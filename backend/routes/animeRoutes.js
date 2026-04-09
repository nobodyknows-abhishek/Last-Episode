const express = require("express");
const router = express.Router();
const {
  getAnimes,
  getAnimeById,
  getTrendingAnimes,
  getTopRatedAnimes,
  getLatestAnimes,
  getAnimeEpisodes,
  searchAnimeGlobally,
  getMalsyncData,
} = require("../controllers/animeController");

router.use((req, res, next) => {
  console.log(`Anime Route hit: ${req.method} ${req.url}`);
  next();
});

router.get("/trending", getTrendingAnimes);
router.get("/latest", getLatestAnimes);
router.get("/top-rated", getTopRatedAnimes);
router.get("/search", searchAnimeGlobally);
router.get("/malsync/:id", getMalsyncData);
router.get("/", getAnimes);
router.get("/:id", getAnimeById);
router.get("/:id/episodes", getAnimeEpisodes);

module.exports = router;
