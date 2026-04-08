const cron = require("node-cron");
const animeService = require("../services/animeService");
const episodeCheckService = require("../services/episodeCheckService");

// Shared flag to prevent the episode-check from running while the full sync is active
let isSyncing = false;

const initCronJobs = (io) => {
  // Run initial sync
  console.log("Triggering initial Anime Sync...");
  isSyncing = true;
  animeService
    .syncAnimeData(io)
    .then(() => {
      if (io)
        io.emit("anime_updated", { message: "Initial database sync complete" });
    })
    .catch((err) => console.error("Initial Sync Error:", err.message))
    .finally(() => { isSyncing = false; });

  // Every 12 hours: full sync (trending + top + watchlist anime)
  cron.schedule("0 0 */12 * * *", async () => {
    console.log("Running 12-hour Anime Sync Job...");
    isSyncing = true;
    try {
      await animeService.syncAnimeData(io);
      if (io) {
        io.emit("anime_updated", {
          message: "Database updated with latest anime data",
        });
      }
    } catch (error) {
      console.error("CRON Job Error:", error.message);
    } finally {
      isSyncing = false;
    }
  });

  // Every 30 minutes: lightweight episode check for currently-airing anime
  // Skips if the full sync is already in progress to avoid rate-limit collisions
  cron.schedule("*/30 * * * *", async () => {
    if (isSyncing) {
      console.log("[EpisodeCheck] Skipping — full sync in progress.");
      return;
    }
    console.log("Running 30-min Episode Check Job...");
    try {
      await episodeCheckService.checkNewEpisodes(io);
    } catch (error) {
      console.error("Episode Check CRON Error:", error.message);
    }
  });
};

module.exports = initCronJobs;
