import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId);

  const channelStats = await User.findById(channelId).select(
    "subscribersCount channelsSubscribedToCount fullName username avatar"
  );

  if (!channelStats) {
    throw new ApiError(404, "Channel not found");
  }

  const videoStats = await Video.aggregate([
    { $match: { owner: channelObjectId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  const response = {
    ...channelStats.toObject(),
    totalViews: videoStats[0]?.totalViews || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Channel stats fetched"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const videos = await Video.find({ owner: channelId }).populate(
    "owner",
    "username avatar"
  );

  const totalVideos = videos.length;

  return res
    .status(200)
    .json(
      new ApiResponse(200, { videos, totalVideos }, "Channel videos fetched")
    );
});

export { getChannelStats, getChannelVideos };
