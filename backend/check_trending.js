const mongoose = require("mongoose");
const Anime = require("./models/animeModel");
const connectDB = require("./config/db");
require("dotenv").config();

const countTrending = async () => {
  try {
    await connectDB();
    const count = await Anime.countDocuments({ isAiring: true });
    console.log(`Total trending (isAiring: true) anime: ${count}`);

    // Also list them to be sure
    const animes = await Anime.find({ isAiring: true })
      .select("title score")
      .sort({ score: -1, _id: 1 });
    console.log("Trending Anime List:");
    animes.forEach((a, i) =>
      console.log(`${i + 1}. ${a.title} (Score: ${a.score})`),
    );

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

countTrending();
