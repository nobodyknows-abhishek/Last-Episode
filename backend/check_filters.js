const mongoose = require("mongoose");
const Anime = require("./models/animeModel");
const connectDB = require("./config/db");
require("dotenv").config();

const checkFilters = async () => {
  try {
    await connectDB();

    console.log("Checking distinct statuses:");
    const statuses = await Anime.distinct("status");
    console.log(statuses);

    console.log("\nChecking distinct genres:");
    const genres = await Anime.distinct("genres");
    console.log(genres.slice(0, 20)); // Limit output

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkFilters();
