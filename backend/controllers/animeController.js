const Anime = require("../models/animeModel");

const getAnimes = async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 20;
  const page = Number(req.query.page) || 1;

  const filter = {};

  if (req.query.keyword) {
    filter.title = {
      $regex: req.query.keyword,
      $options: "i",
    };
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.genre) {
    filter.genres = req.query.genre;
  }

  try {
    const count = await Anime.countDocuments(filter);
    const animes = await Anime.find(filter)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ score: -1, popularity: 1 });

    res.json({
      animes,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during fetch" });
  }
};

const mongoose = require("mongoose");
const {
  fetchAnimeSearch,
  fetchAnimeByMalId,
} = require("../services/jikanService");

const getAnimeById = async (req, res) => {
  const { id } = req.params;
  console.log("getAnimeById called with id:", id);

  try {
    let anime;
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      anime = await Anime.findById(id);
    }

    // If not found by ObjectId, try finding by malId
    if (!anime && !isNaN(id)) {
      anime = await Anime.findOne({ malId: Number(id) });
    }

    // If still not found, fetch from Jikan, save to DB, and return
    if (!anime && !isNaN(id)) {
      console.log(`Anime ${id} not in DB. Fetching from Jikan...`);
      const jikanData = await fetchAnimeByMalId(id);
      if (jikanData && jikanData.data) {
        const item = jikanData.data;
        const newAnime = {
          malId: item.mal_id,
          title: item.title,
          synopsis: item.synopsis || "No synopsis available.",
          episodes: item.episodes || 0,
          genres: (item.genres || []).map((g) => g.name),
          status: item.status || "Unknown",
          rating: item.rating || "Not Rated",
          score: item.score || 0,
          popularity: item.popularity || 0,
          releaseDate: item.aired?.string || "Unknown",
          imageUrl:
            item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
          studio: (item.studios || []).map((s) => s.name),
          trailerUrl: item.trailer?.url || null,
          isAiring: item.airing || false,
          lastUpdated: new Date(),
        };

        anime = await Anime.findOneAndUpdate({ malId: item.mal_id }, newAnime, {
          upsert: true,
          returnDocument: "after",
        });
      }
    }

    if (anime) {
      res.json(anime);
    } else {
      res.status(404).json({ message: "Anime not found local or global" });
    }
  } catch (error) {
    console.error("Error in getAnimeById:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getTrendingAnimes = async (req, res) => {
  const animes = await Anime.find({ isAiring: true })
    .limit(10)
    .sort({ score: -1 });
  res.json(animes);
};

const getTopRatedAnimes = async (req, res) => {
  const animes = await Anime.find({}).limit(10).sort({ score: -1 });
  res.json(animes);
};

const { fetchAnimeEpisodes } = require("../services/jikanService");

const getAnimeEpisodes = async (req, res) => {
  try {
    const { id } = req.params;
    let anime;

    if (mongoose.Types.ObjectId.isValid(id)) {
      anime = await Anime.findById(id);
    }
    if (!anime && !isNaN(id)) {
      anime = await Anime.findOne({ malId: Number(id) });
    }

    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    // malId is present in our DB
    const page = req.query.page || 1;
    const episodesData = await fetchAnimeEpisodes(anime.malId, page);
    res.json(episodesData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching episodes" });
  }
};

const searchAnimeGlobally = async (req, res) => {
  console.log("searchAnimeGlobally called with query:", req.query);
  try {
    const query = req.query.q;
    const page = req.query.page || 1;
    if (!query)
      return res.status(400).json({ message: "Query string 'q' is required" });

    const data = await fetchAnimeSearch(query, page);
    res.json(data);
  } catch (error) {
    console.error(
      "searchAnimeGlobally error:",
      error.response?.data || error.message,
    );
    res.status(500).json({ message: "Error searching global anime" });
  }
};

const getMalsyncData = async (req, res) => {
  try {
    const { id } = req.params;
    const axios = require("axios");
    const url = `https://api.malsync.moe/mal/anime/${id}`;
    console.log(`Fetching malsync URL: ${url}`);
    const { data } = await axios.get(url);
    res.json(data);
  } catch (error) {
    console.error("getMalsyncData error:",
      error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : error.message,
    );
    // If upstream responded with a status, forward it; otherwise use 502
    const status = error.response?.status || 502;
    const message = error.response?.data || "Malsync service error";
    res.status(status).json({ message });
  }
};

module.exports = {
  getAnimes,
  getAnimeById,
  getTrendingAnimes,
  getTopRatedAnimes,
  getAnimeEpisodes,
  searchAnimeGlobally,
  getMalsyncData,
};
