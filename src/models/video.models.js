import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: true,
    },
    videoFilePublicId: {
      type: String,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    thumbnailPublicId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likesCount: { type: Number, default: 0 }, // Add this
    commentsCount: { type: Number, default: 0 }, // Add this
    duration: {
      type: Number,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
/** Indexes */

// 1. SEARCH: Text index for title searching
videoSchema.index({ title: "text" });

// 2. FEED OPTIMIZATION (Crucial for your Load Test):
// Allows finding "Published" videos and sorting by "Newest" instantly.
videoSchema.index({ isPublished: 1, createdAt: -1 });

// 3. POPULARITY FEED:
// Allows finding "Published" videos and sorting by "Most Views".
videoSchema.index({ isPublished: 1, views: -1 });

// 4. USER PROFILE:
// Fast lookup for a specific user's published videos
videoSchema.index({ isPublished: 1, owner: 1 });

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
