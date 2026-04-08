require("dotenv").config();
const mongoose = require("mongoose");
const Anime = require("./models/animeModel");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const onepiece = await Anime.findOne({ malId: 21 });
    console.log("One Piece:", onepiece ? { episodes: onepiece.episodes, lastKnownEpisodes: onepiece.lastKnownEpisodes } : "Not Found");
    const yuusha = await Anime.findOne({ title: /Yuusha/i });
    console.log("Yuusha:", yuusha ? { title: yuusha.title, episodes: yuusha.episodes, lastKnownEpisodes: yuusha.lastKnownEpisodes } : "Not found");
    process.exit();
}).catch(console.error);
