const Watchlist = require("../models/watchlistModel");
const Anime = require("../models/animeModel");
const mongoose = require("mongoose");

const getMyWatchlist = async (req, res) => {
  const watchlist = await Watchlist.find({ user: req.user._id }).populate(
    "anime",
  );
  res.json(watchlist);
};

const addToWatchlist = async (req, res) => {
  const { animeId, status, rating, notes } = req.body;

  let actualAnimeId = animeId;
  const isMongoId = animeId && String(animeId).match(/^[0-9a-fA-F]{24}$/);
  if (!isMongoId) {
    const animeDoc = await Anime.findOne({ malId: Number(animeId) });
    if (!animeDoc) {
      return res.status(404).json({ message: "Anime not found" });
    }
    actualAnimeId = animeDoc._id;
  }

  const exists = await Watchlist.findOne({
    user: req.user._id,
    anime: actualAnimeId,
  });

  if (exists) {
    exists.status = status || exists.status;
    exists.rating = rating !== undefined ? rating : exists.rating;
    exists.notes = notes || exists.notes;
    const updated = await exists.save();
    const populated = await updated.populate("anime");
    res.json(populated);
  } else {
    const watchlistEntry = new Watchlist({
      user: req.user._id,
      anime: actualAnimeId,
      status: status || "Plan to Watch",
      rating: rating || 0,
      notes: notes || "",
    });

    const created = await watchlistEntry.save();
    const populated = await created.populate("anime");
    res.status(201).json(populated);
  }
};

const removeFromWatchlist = async (req, res) => {
  const entry = await Watchlist.findById(req.params.id);

  if (entry) {
    if (entry.user.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: "User not authorized" });
      return;
    }
    await entry.deleteOne();
    res.json({ message: "Removed from watchlist" });
  } else {
    res.status(404).json({ message: "Watchlist entry not found" });
  }
};

module.exports = {
  getMyWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};
