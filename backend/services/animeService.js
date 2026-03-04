const Anime = require("../models/animeModel");
const Watchlist = require("../models/watchlistModel");
const Notification = require("../models/notificationModel");
const jikanService = require("./jikanService");

const syncAnimeData = async (io) => {
  console.log("Starting Anime Data Sync...");
  try {
    const [trendingData, topData, watchlistEntries] = await Promise.all([
      jikanService.fetchTrendingAnime(),
      jikanService.fetchTopAnime(1),
      Watchlist.find({}).populate("anime", "malId"),
    ]);

    const watchlistMalIds = watchlistEntries
      .map((w) => w.anime?.malId)
      .filter((id) => id);

    const combinedList = [
      ...(trendingData.data || []),
      ...(topData.data || []),
    ];

    // Map to track mal_ids to sync
    const itemsToSync = new Map();
    combinedList.forEach((item) => itemsToSync.set(item.mal_id, item));

    // For watchlist items that aren't in trending/top, we need to fetch their Jikan data
    // To keep it simple, we'll just add the malIds and fetch them one by one if they aren't in itemsToSync
    const allMalIds = new Set([...itemsToSync.keys(), ...watchlistMalIds]);

    console.log(`Total unique anime to sync: ${allMalIds.size}`);

    let updatedCount = 0;

    for (const malId of allMalIds) {
      let item = itemsToSync.get(malId);

      // If item info isn't in trending/top (combinedList), fetch it from Jikan
      if (!item) {
        try {
          const jikanResponse = await jikanService.fetchAnimeByMalId(malId);
          item = jikanResponse.data;
        } catch (err) {
          console.error(
            `Failed to fetch Jikan data for malId ${malId}:`,
            err.message,
          );
          continue;
        }
      }

      if (!item) continue;

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

      const existingAnime = await Anime.findOne({ malId: item.mal_id });
      const oldEpisodes = existingAnime ? existingAnime.episodes : 0;
      const newEpisodes = animeData.episodes || 0;

      const updatedAnime = await Anime.findOneAndUpdate(
        { malId: item.mal_id },
        animeData,
        {
          upsert: true,
          returnDocument: "after",
        },
      );

      if (existingAnime && newEpisodes > oldEpisodes) {
        const watchlists = await Watchlist.find({ anime: updatedAnime._id });
        if (watchlists.length > 0) {
          const notifications = watchlists.map((w) => ({
            user: w.user,
            anime: updatedAnime._id,
            message: `New episode released for ${updatedAnime.title}! (Ep ${newEpisodes})`,
            type: "episode_release",
            isRead: false,
          }));
          const savedNotifications =
            await Notification.insertMany(notifications);

          // Real-time delivery
          if (io) {
            savedNotifications.forEach((notif) => {
              // Convert to plain object and populate manually for emission
              const emissionData = {
                ...notif.toObject(),
                anime: {
                  _id: updatedAnime._id,
                  title: updatedAnime.title,
                  imageUrl: updatedAnime.imageUrl,
                  malId: updatedAnime.malId,
                },
              };
              io.to(notif.user.toString()).emit(
                "new_notification",
                emissionData,
              );
            });
          }
        }
      }

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
