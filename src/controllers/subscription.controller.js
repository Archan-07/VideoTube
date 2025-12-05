import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    // UNSUBSCRIBE LOGIC
    // 1. Delete the subscription document
    // 2. Decrement channel's subscriber count
    // 3. Decrement user's "subscribed to" count

    await Promise.all([
      Subscription.findByIdAndDelete(existingSubscription._id),
      User.findByIdAndUpdate(channelId, { $inc: { subscribersCount: -1 } }),
      User.findByIdAndUpdate(subscriberId, {
        $inc: { channelsSubscribedToCount: -1 },
      }),
    ]);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  } else {
    // SUBSCRIBE LOGIC
    // 1. Create the subscription document
    // 2. Increment channel's subscriber count
    // 3. Increment user's "subscribed to" count

    await Promise.all([
      Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
      }),
      User.findByIdAndUpdate(channelId, { $inc: { subscribersCount: 1 } }),
      User.findByIdAndUpdate(subscriberId, {
        $inc: { channelsSubscribedToCount: 1 },
      }),
    ]);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Subscribed successfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId);

  const subscribersPipeline = await Subscription.find({
    channel: channelObjectId,
  })
    .select("subscriber")
    .populate("subscriber", "username avatar")
    .skip((page - 1) * limit) // Skip previous pages
    .limit(parseInt(limit)); // Only fetch 10

  const subscribers = subscribersPipeline.map((item) => item.subscriber);

  const subscribersCount = subscribers.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribers, subscribersCount },
        "Subscribers fetched"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "username avatar");

  const totalSubscribedChannels = subscribedChannels.map((i) => i.channel);
  const subscribedChannelsCount = totalSubscribedChannels.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribedChannels, subscribedChannelsCount },
        "Subscribed channels fetched"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
