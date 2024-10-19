import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { Subscribed: false },
          "Channel unsubscribed successfully"
        )
      );
  }

  const subscriptionDocument = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (!subscriptionDocument) {
    throw new ApiError(500, "Failed to create subscription");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { Subscribed: true },
        "Channel subscribed successfully"
      )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Validate channelId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  // Aggregate to fetch subscribers for the given channelId
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1, // Include avatar URL if available
        },
      },
    },
  ]);

  const totalSubscribers = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(channelId),
  });

  // Return an empty list instead of an error if no subscribers are found
  const subscribersList = subscribers.map((item) => item.subscriber);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { total: totalSubscribers, subscribersList },
        "List of subscribers fetched successfully"
      )
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  // Validate subscriberId
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber ID");
  }

  // Aggregate to fetch subscribed channels and their latest video
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "allVideos",
            },
          },
          {
            $addFields: {
              latestVideo: {
                $last: "$allVideos", // Get the most recent video
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedChannel",
    },
    {
      $project: {
        _id: 0,
        subscribedChannel: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1, // Include avatar URL if available
          latestVideo: {
            "videoFile.url": 1,
            "thumbnail.url": 1,
            title: 1,
            description: 1,
          },
        },
      },
    },
  ]);

  // Return an empty list instead of an error if no channels are found
  if (!channels?.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No subscribed channels found"));
  }

  // Map to get the list of subscribed channels
  const channelsList = channels.map((item) => item.subscribedChannel);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelsList,
        "List of subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
