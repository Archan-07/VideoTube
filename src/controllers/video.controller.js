import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Like } from "../models/like.models.js";
import { updateMedia } from "../utils/updateMedia.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const filter = { isPublished: true };

  if (userId) {
    filter.owner = userId;
  }
  if (query) {
    filter.title = { $text: { $search: query } };
  }

  const sortOptions = {
    createdAt: sortBy === "createdAt" ? (sortType === "desc" ? -1 : 1) : -1,
    views: sortBy === "views" ? (sortType === "desc" ? -1 : 1) : -1,
  };

  const currentUserId = req.user?._id ?? null;

  const videos = await Video.aggregate([
    { $match: filter },
    { $sort: sortOptions },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },

    {
      $project: {
        title: 1,
        description: 1,
        duration: 1,
        thumbnailUrl: 1,
        videoFile: 1,
        views: 1,
        isPublished: 1,
        owner: { $arrayElemAt: ["$ownerDetails.username", 0] },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const [video, thumbnail] = await Promise.all([
    uploadOnCloudinary(videoLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ]);
  if (!thumbnail?.secure_url) {
    throw new ApiError(500, "Thumbnail upload failed");
  }
  if (!video?.secure_url) {
    throw new ApiError(500, "Video upload failed");
  }
  const publishAVideo = await Video.create({
    title,
    description,
    thumbnail: thumbnail.secure_url,
    videoFile: video.secure_url,
    duration: video.duration,
    owner: req.user._id,
    isPublished: true,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, publishAVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username email"
  );
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const currentUserId = req.user?._id ?? null;

  if (
    !currentUserId ||
    video.owner._id.toString() !== currentUserId.toString()
  ) {
    await Video.findByIdAndUpdate({ _id: videoId }, { $inc: { views: 1 } });
    await video.save();
  }

  const likesCount = await Like.countDocuments({ video: video._id });
  const isLiked = currentUserId
    ? Boolean(await Like.exists({ video: video._id, likedBy: currentUserId }))
    : false;

  const videoObj = video.toObject();
  videoObj.likesCount = likesCount;
  videoObj.isLiked = isLiked;

  return res
    .status(200)
    .json(new ApiResponse(200, videoObj, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (req.user && video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  let updateData = { title, description };
  let updatedVideo;

  if (req.file?.path) {
    updateVideo = await updateMedia({
      model: Video,
      docId: videoId,
      filePath: req.file?.path,
      field: "thumbnail",
      publicIdField: "thumbnailPublicId",
      notFoundMessage: "thumbnail file is required",
    });
    updateData.thumbnail = updateVideo.thumbnail;
    updateData.thumbnailPublicId = updateVideo.thumbnailPublicId;
  }
  updateVideo = await Video.findByIdAndUpdate(videoId, updateData, {
    new: true,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (req.user && video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  try {
    if (video.videoFilePublicId) {
      await deleteFromCloudinary(video.videoFilePublicId);
    }
    if (video.thumbnailPublicId) {
      await deleteFromCloudinary(video.thumbnailPublicId);
    }
  } catch (error) {
    throw new ApiError(500, "Failed to delete video from storage");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (req.user && video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to change publish status of this video"
    );
  }
  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status toggled successfully")
    );
});

const getUserVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const videos = await Video.find({ owner: userId, isPublished: true }).sort({
    createdAt: -1,
  });
  if (!videos) {
    throw new ApiError(404, "No videos found for this user");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "User videos fetched successfully"));
});

const getTrendingVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ isPublished: true })
    .sort({ views: -1 })
    .limit(20);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Trending videos fetched successfully"));
});

const searchVideos = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const videos = await Video.find(
    { $text: { $search: query }, isPublished: true },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Search results fetched successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getUserVideos,
  getTrendingVideos,
  searchVideos,
};
