const mongoose = require("mongoose");

const animeSchema = mongoose.Schema(
  {
    malId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    synopsis: { type: String },
    episodes: { type: Number },
    genres: [{ type: String }],
    status: { type: String },
    rating: { type: String },
    score: { type: Number },
    popularity: { type: Number },
    releaseDate: { type: String },
    imageUrl: { type: String },
    bannerImage: { type: String },
    coverImage: { type: String },
    studio: [{ type: String }],
    trailerUrl: { type: String },
    isTrending: { type: Boolean, default: false },
    isTopRated: { type: Boolean, default: false },
    isAiring: { type: Boolean, default: false },
    lastKnownEpisodes: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

const Anime = mongoose.model("Anime", animeSchema);

module.exports = Anime;
