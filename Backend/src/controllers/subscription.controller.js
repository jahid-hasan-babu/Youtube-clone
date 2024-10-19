import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });
  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { Subscribed: false }, "Unsubscribed successfully")
      );
  }
  const subscriptionDocument = await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (!subscriptionDocument) {
    throw new ApiError(500, "Document creation failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { Subscribed: true }, "Subscribed successfully")
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }
  const subscribers = await Subscription.find({ channel: channelId }).select(
    "subscriber"
  );
  if (!subscribers) {
    throw new ApiError(404, "Subscribers not found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
