import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const sortOptions = { createdAt: -1 };
  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  const comments = await Comment.aggregate([
    {
      $match: { video: videoObjectId },
    },
    { $sort: sortOptions },
    { $skip: (page - 1) * parseInt(limit) },
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
      $unwind: "$ownerDetails",
    },
    {
      $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$comment", "$$commentId"] } } },
          { $project: { likedBy: 1 } },
        ],
        as: "likes",
      },
    },
    {
      $project: {
        content: 1,
        video: 1,
        owner: {
          _id: "$ownerDetails._id",
          username: "$ownerDetails.username",
          avatar: "$ownerDetails.avatar",
        },
        createdAt: 1,
        updatedAt: 1,
        likesCount: { $size: "$likes" },
      },
    },
  ]);

  const totalComments = await Comment.countDocuments({ video: videoId });
  return res.status(200).json(
    new ApiResponse(
      true,
      {
        comments,
        totalComments,
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: req.user._id },
    { content },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});


const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const { page = 1, limit = 10 } = req.query;

  const sortOptions = { createdAt: -1 };
  const tweetObjectId = new mongoose.Types.ObjectId(tweetId);

  const comments = await Comment.aggregate([
    {
      $match: { tweet: tweetObjectId },
    },
    {
      $sort: sortOptions,
    },
    { $skip: (page - 1) * parseInt(limit) },
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
      $unwind: "$ownerDetails",
    },
    {
      $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$comment", "$$commentId"] } } },
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $project: {
        content: 1,
        tweet: 1,
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

  const totalComments = await Comment.countDocuments({ tweet: tweetId });
  return res.status(200).json(
    new ApiResponse(
      true,
      {
        comments,
        totalComments,
      },
      "Comments fetched successfully"
    )
  );
});
const addTweetComment = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const comment = await Comment.create({
    content,
    tweet: tweetId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});
const updateTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: req.user._id },
    { content },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});
const deleteTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  const comment = await Comment.findById(commentId);
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }
  await Comment.findOneAndDelete({ _id: commentId, owner: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  getTweetComments,
  addTweetComment,
  updateTweetComment,
  deleteTweetComment,
};
