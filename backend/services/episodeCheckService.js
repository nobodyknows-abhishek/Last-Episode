const Anime = require("../models/animeModel");
const Watchlist = require("../models/watchlistModel");
const Notification = require("../models/notificationModel");
const jikanService = require("./jikanService");

/**
 * Checks all currently-airing anime in the DB against the Jikan API.
 * If a new episode has aired (episode count increased), saves notifications
 * for all users who have that anime on their watchlist and emits via socket.io.
 */
const checkNewEpisodes = async (io) => {
  console.log("[EpisodeCheck] Starting airing anime episode check...");

  try {
    // Only process anime that are currently airing
    const airingAnime = await Anime.find({ isAiring: true });

    if (!airingAnime.length) {
      console.log("[EpisodeCheck] No airing anime found in DB.");
      return;
    }

    console.log(`[EpisodeCheck] Checking ${airingAnime.length} airing anime...`);
    let notifiedCount = 0;

    for (const anime of airingAnime) {
      try {
        const [jikanResponse, anilistData] = await Promise.all([
          jikanService.fetchAnimeByMalId(anime.malId),
          jikanService.fetchAniListImages(anime.malId)
        ]);
        
        const freshData = jikanResponse?.data;
        if (!freshData) continue;

        const totalEpisodes = freshData.episodes || 0;
        let airedEpisodes = anime.lastKnownEpisodes ?? 0;

        if (anilistData?.nextAiringEpisode?.episode) {
          airedEpisodes = anilistData.nextAiringEpisode.episode - 1;
        }

        // New episode detected (Aired count increased)
        if (airedEpisodes > anime.lastKnownEpisodes && anime.lastKnownEpisodes >= 0) {
          console.log(
            `[EpisodeCheck] New episode detected for "${anime.title}": ${anime.lastKnownEpisodes} → ${airedEpisodes}`
          );

          // Find all watchlist entries for this anime
          const watchlists = await Watchlist.find({ anime: anime._id });

          if (watchlists.length > 0) {
            const notifications = watchlists.map((w) => ({
              user: w.user,
              anime: anime._id,
              message: `🎉 New episode of ${anime.title} is out! (Episode ${airedEpisodes})`,
              type: "episode_release",
              isRead: false,
            }));

            const savedNotifications = await Notification.insertMany(notifications);
            notifiedCount += savedNotifications.length;

            // Emit real-time notification
            if (io) {
              savedNotifications.forEach((notif) => {
                const emissionData = {
                  ...notif.toObject(),
                  anime: {
                    _id: anime._id,
                    title: anime.title,
                    imageUrl: anime.imageUrl,
                    malId: anime.malId,
                  },
                };
                io.to(notif.user.toString()).emit("new_notification", emissionData);
              });
            }
          }

          // Update DB with fresh aired count and sync total if possible
          await Anime.findByIdAndUpdate(anime._id, {
            lastKnownEpisodes: airedEpisodes,
            episodes: totalEpisodes, // Also update total planned episodes
            lastUpdated: new Date(),
          });
        } else if (totalEpisodes !== anime.episodes) {
          // Total episodes changed but aired didn't (or no aired info available)
          // Just sync the total episodes field without notifying
          await Anime.findByIdAndUpdate(anime._id, {
            episodes: totalEpisodes,
          });
        }

        // Respect Jikan rate limit (~2 req/s)
        await jikanService.delay(600);
      } catch (animeErr) {
        console.error(
          `[EpisodeCheck] Failed for malId ${anime.malId}:`,
          animeErr.message
        );
        // Continue to next anime even if one fails
      }
    }

    console.log(
      `[EpisodeCheck] Done. Sent ${notifiedCount} notification(s).`
    );
  } catch (err) {
    console.error("[EpisodeCheck] Fatal error:", err.message);
    throw err;
  }
};

module.exports = { checkNewEpisodes };
