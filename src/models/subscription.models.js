import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // One who is subscribing like someone subscribed to my channel
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // One to whom "Subscriber" is subscribing like im subscribing to other channel
      ref: "User",
    },
  },
  { timestamps: true }
);

// This ensures a unique pair of subscriber + channel
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
