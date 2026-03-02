const mongoose = require("mongoose");

const watchlistSchema = mongoose.Schema(
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
    status: {
      type: String,
      required: true,
      enum: ["Watching", "Completed", "Plan to Watch", "Dropped"],
      default: "Plan to Watch",
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

module.exports = Watchlist;
