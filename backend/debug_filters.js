const mongoose = require("mongoose");
const Anime = require("./models/animeModel");
const connectDB = require("./config/db");
require("dotenv").config();

const debugFilters = async () => {
  try {
    await connectDB();

    console.log("--- DEBUGGING GENRES ---");
    const horrorCount = await Anime.countDocuments({ genres: "Horror" });
    const sportsCount = await Anime.countDocuments({ genres: "Sports" });
    console.log(`Horror Anime: ${horrorCount}`);
    console.log(`Sports Anime: ${sportsCount}`);

    console.log("\n--- DEBUGGING STATUS ---");
    const airingCount = await Anime.countDocuments({
      status: "Currently Airing",
    });
    const completedCount = await Anime.countDocuments({
      status: "Finished Airing",
    });
    const upcomingCount = await Anime.countDocuments({
      status: "Not yet aired",
    });

    console.log(`Currently Airing: ${airingCount}`);
    console.log(`Finished Airing: ${completedCount}`);
    console.log(`Not yet aired: ${upcomingCount}`);

    console.log("\n--- SAMPLE DOCUMENT ---");
    const sample = await Anime.findOne();
    console.log("Status field:", sample.status);
    console.log("Genres field:", sample.genres);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

debugFilters();
