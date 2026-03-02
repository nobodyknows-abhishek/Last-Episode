const Anime = require("../models/animeModel");
const jikanService = require("./jikanService");

const syncAnimeData = async () => {
  console.log("Starting Anime Data Sync...");
  try {
    const [trendingData, topData] = await Promise.all([
      jikanService.fetchTrendingAnime(),
      jikanService.fetchTopAnime(1),
    ]);

    const combinedList = [
      ...(trendingData.data || []),
      ...(topData.data || []),
    ];

    // Use a Map to deduplicate by mal_id
    const uniqueAnimeMap = new Map();
    combinedList.forEach((item) => uniqueAnimeMap.set(item.mal_id, item));
    const animeList = Array.from(uniqueAnimeMap.values());

    let updatedCount = 0;

    for (const item of animeList) {
      const anilistImages = await jikanService.fetchAniListImages(item.mal_id);

      const animeData = {
        malId: item.mal_id,
        title: item.title,
        synopsis: item.synopsis || "No synopsis available.",
        episodes: item.episodes || 0,
        genres: (item.genres || []).map((g) => g.name),
        status: item.status || "Unknown",
        rating: item.rating || "Not Rated",
        score: item.score || 0,
        popularity: item.popularity || 0,
        releaseDate: item.aired?.string || "Unknown",
        imageUrl:
          item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        bannerImage: anilistImages?.bannerImage || null,
        coverImage: anilistImages?.coverImage?.extraLarge || null,
        studio: (item.studios || []).map((s) => s.name),
        trailerUrl: item.trailer?.url || null,
        isAiring: item.airing || false,
        lastUpdated: new Date(),
      };

      await Anime.findOneAndUpdate({ malId: item.mal_id }, animeData, {
        upsert: true,
        returnDocument: "after",
      });
      updatedCount++;
      // Respect rate limits: roughly 2 requests / sec
      await jikanService.delay(500);
    }

    console.log(`Sync Completed! Updated ${updatedCount} anime.`);
    return updatedCount;
  } catch (error) {
    console.error("Sync failed:", error.message);
    throw error;
  }
};

module.exports = {
  syncAnimeData,
};
