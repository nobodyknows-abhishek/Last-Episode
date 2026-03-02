const express = require("express");
const router = express.Router();
const {
  getAnimes,
  getAnimeById,
  getTrendingAnimes,
  getTopRatedAnimes,
  getAnimeEpisodes,
  searchAnimeGlobally,
  getMalsyncData,
} = require("../controllers/animeController");

router.get("/", getAnimes);
router.get("/trending", getTrendingAnimes);
router.get("/top-rated", getTopRatedAnimes);
router.get("/search", searchAnimeGlobally);
router.get("/malsync/:id", getMalsyncData);
router.get("/:id", getAnimeById);
router.get("/:id/episodes", getAnimeEpisodes);

module.exports = router;
