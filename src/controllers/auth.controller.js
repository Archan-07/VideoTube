import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import { updateMedia } from "../utils/updateMedia.js";
const generateAccessRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating accessToken and refreshToken"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with email or username is already exists",
      []
    );
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
  } catch (error) {
    Logger.error(`Error uploading avatar: ${error.message}`);
    throw new ApiError(500, "Failed to upload avatar");
  }
  let coverImage = null;
  try {
    if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }
  } catch (error) {
    Logger.error(`Error uploading cover image: ${error.message}`);
    throw new ApiError(500, "Failed to upload cover image");
  }

  try {
    const user = await User.create({
      email,
      username,
      fullName,
      password,
      avatar: avatar.url,
      avatarPublicId: avatar.public_id,
      coverImage: coverImage?.url || "",
      coverImagePublicId: coverImage?.public_id || "",
    });

    await user.save({ validateBeforeSave: false });

    const createUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createUser) {
      throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { user: createUser },
          "User registered successfully"
        )
      );
  } catch (error) {
    Logger.error(`User creation failed: ${error.message}`);

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new ApiError(
      500,
      "Something went wrong while registering user and images were deleted"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = { httpOnly: true, secure: true };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("AccessToken", accessToken, options)
      .cookie("RefreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refresh successfully"
        )
      );
  } catch (error) {
    Logger.error(`Error refreshing access token: ${error.message}`);
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

const loggedOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req.user },
        "Current user fetched successfully"
      )
    );
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updated successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar is required");
  }
  const user = await updateMedia({
    model: User,
    docId: req.user._id,
    filePath: req.file?.path,
    field: "avatar",
    publicIdField: "avatarPublicId",
    notFoundMessage: "Avatar is required",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Cover image is required");
  }
  const user = await updateMedia({
    model: User,
    docId: req.user._id,
    filePath: req.file?.path,
    field: "coverImage",
    publicIdField: "coverImagePublicId",
    notFoundMessage: "Cover image is required",
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const channelInfo = await User.aggregate([
    { $match: { username: username.trim().toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (channelInfo.length === 0) {
    throw new ApiError(404, "Channel not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channel: channelInfo[0] },
        "User channel profile fetched successfully"
      )
    );
});

const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        watchHistory: {
          $each: [videoId],
          $position: 0,
          $slice: 100,
        },
      },
    },
    {
      new: true,
    }
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { watchHistory: user.watchHistory },
        "Watch history updated successfully"
      )
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistoryVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);
  if (user.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { watchHistory: user[0]?.watchHistoryVideos },
        "User watch history fetched successfully"
      )
    );
});

const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }
    if (user.coverImagePublicId) {
      await deleteFromCloudinary(user.coverImagePublicId);
    }
  } catch (error) {
    throw new ApiError(500, "Failed to delete user images from storage");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, null, "User account deleted successfully"));
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  loggedOutUser,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  deleteUserAccount,
  addToWatchHistory,
};
