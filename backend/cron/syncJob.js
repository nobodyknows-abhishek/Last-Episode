const cron = require("node-cron");
const animeService = require("../services/animeService");

const initCronJobs = (io) => {
  // Run initial sync
  console.log("Triggering initial Anime Sync...");
  animeService
    .syncAnimeData()
    .then(() => {
      if (io)
        io.emit("anime_updated", { message: "Initial database sync complete" });
    })
    .catch((err) => console.error("Initial Sync Error:", err.message));

  // Every 12 hours: 0 0 */12 * * *
  // For testing, can be set to every minute: */1 * * * *
  cron.schedule("0 0 */12 * * *", async () => {
    console.log("Running 12-hour Anime Sync Job...");
    try {
      await animeService.syncAnimeData();
      if (io) {
        io.emit("anime_updated", {
          message: "Database updated with latest anime data",
        });
      }
    } catch (error) {
      console.error("CRON Job Error:", error.message);
    }
  });
};

module.exports = initCronJobs;
