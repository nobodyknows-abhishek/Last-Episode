const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    anime: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Anime",
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "episode_release",
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
