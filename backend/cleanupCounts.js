require("dotenv").config();
const mongoose = require("mongoose");
const Anime = require("./models/animeModel");

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for cleanup.");

        // Find currently airing anime that are incorrectly marked as fully released
        // (i.e., lastKnownEpisodes matches the total episodes count, assuming it was a mistake)
        // We reset lastKnownEpisodes to 0 (or null) so the next sync/check can fix it accurately.
        const faultyAiring = await Anime.find({
            status: "Currently Airing",
            $expr: { $eq: ["$lastKnownEpisodes", "$episodes"] },
            episodes: { $gt: 0 }
        });

        console.log(`Found ${faultyAiring.length} faulty airing records.`);

        for (const anime of faultyAiring) {
            console.log(`Resetting released count for: ${anime.title}`);
            anime.lastKnownEpisodes = 0; // Reset to force a fresh accurate check
            await anime.save();
        }

        console.log("Cleanup finished.");
        process.exit(0);
    } catch (err) {
        console.error("Cleanup error:", err);
        process.exit(1);
    }
})();
