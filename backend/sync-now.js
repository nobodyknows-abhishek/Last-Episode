require("dotenv").config();
const mongoose = require("mongoose");
const animeService = require("./services/animeService");

async function runSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      "Connected to MongoDB. Running forced sync to get high-res images...",
    );
    await animeService.syncAnimeData();
    console.log("Sync complete! You can now check the frontend.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runSync();
