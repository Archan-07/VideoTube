import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const newTweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const tweets = await Tweet.aggregate([
    {
      $match: { owner: userObjectId },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $lookup: {
        from: "likes",
        let: { tweetId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$tweet", "$$tweetId"] } } },
          { $project: { likedBy: 1 } },
        ],
        as: "likes",
      },
    },
    {
      $project: {
        content: 1,
        owner: {
          _id: "$ownerDetails._id",
          username: "$ownerDetails.username",
          avatar: "$ownerDetails.avatar",
        },
        likesCount: { $size: "$likes" },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (req.user._id && req.user._id.toString() !== tweet.owner._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  // Update tweet content

  tweet.content = content || tweet.content;
  await tweet.save();
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (req.user._id && req.user._id.toString() !== tweet.owner._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }
  await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

const getAllTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $lookup: {
        from: "likes",
        let: { tweetId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$tweet", "$$tweetId"] } } },
          { $project: { likedBy: 1 } },
        ],
        as: "likes",
      },
    },

    {
      $lookup: {
        from: "comments",
        let: { tweetId: "$_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$tweet", "$$tweetId"] } },
          },
          {
            $project: {
              content: 1,
            },
          },
        ],
        as: "comments",
      },
    },

    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: { $size: "$likes" },
        comments: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "All tweets fetched successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet, getAllTweets };
