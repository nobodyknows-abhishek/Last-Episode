import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Star,
  Clock,
  Calendar,
  Bookmark,
  Play,
  Users,
  Hash,
  MonitorPlay,
  ListVideo,
  Server,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const AnimeDetails = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [streamData, setStreamData] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const { data } = await axios.get(`/api/anime/${id}`);
        setAnime(data);

        // Fetch episodes in parallel with watchlist check
        // Always fetch page 1 initially when loading a new anime
        const episodesReq = axios.get(`/api/anime/${id}/episodes?page=1`);
        const malsyncReq = axios.get(`/api/anime/malsync/${data.malId || id}`);
        let watchlistReq = null;

        if (user) {
          watchlistReq = axios.get("/api/watchlist", {
            headers: { Authorization: `Bearer ${user.token}` },
          });
        }

        const [episodesRes, malsyncRes, watchlistRes] = await Promise.all([
          episodesReq.catch(() => ({ data: { data: [] } })), // Fallback if episodes fail
          malsyncReq.catch(() => ({ data: null })),
          watchlistReq
            ? watchlistReq.catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);

        if (episodesRes.data?.data) {
          setEpisodes(episodesRes.data.data);
          // Set current page explicitly to 1 on initial load
          setCurrentPage(1);

          if (episodesRes.data.data.length > 0) {
            // Only set activeEpisode if it's the first page and activeEpisode is null
            setActiveEpisode(1);
          }
          // Set pagination info
          if (episodesRes.data?.pagination) {
            setTotalPages(episodesRes.data.pagination.last_visible_page || 1);
            if (episodesRes.data.pagination.items?.per_page) {
              setItemsPerPage(episodesRes.data.pagination.items.per_page);
            }
          }
        }

        if (malsyncRes.data) {
          setStreamData(malsyncRes.data);
        }

        if (user && watchlistRes) {
          setIsInWatchlist(
            watchlistRes.data.some(
              (item) =>
                item.anime?._id === id ||
                item.anime === id ||
                item.anime?.malId === data.malId,
            ),
          );
        }
      } catch (error) {
        console.error("Error fetching anime:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, [id, user]); // Run only on component mount (or id/user change), ignoring currentPage for initial load to avoid loop. But we need to handle page changes.

  // Separate effect for page changes if we want to fetch new episodes without reloading everything else,
  // or just incorporate page change logic into a function. Let's use a function and only trigger episode fetch.

  const fetchEpisodes = async (page) => {
    setEpisodesLoading(true);
    try {
      const response = await axios.get(
        `/api/anime/${id}/episodes?page=${page}`,
      );
      if (response.data?.data) {
        setEpisodes(response.data.data);
        setCurrentPage(page);
        if (response.data?.pagination) {
          setTotalPages(response.data.pagination.last_visible_page || 1);
          if (response.data.pagination.items?.per_page) {
            setItemsPerPage(response.data.pagination.items.per_page);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching episodes page:", error);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!user) return alert("Please login to track anime");
    try {
      await axios.post(
        "/api/watchlist",
        { animeId: id },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      setIsInWatchlist(true);
    } catch (error) {
      alert(error.response?.data?.message || "Error adding to watchlist");
    }
  };

  const createWatchParty = (episodeNum, episodeUrl) => {
    if (!user) return alert("Please login to create a Watch Party");
    const roomId = `${id}-${Math.random().toString(36).substring(2, 9)}`;
    navigate(`/watch/${roomId}`, {
      state: {
        animeTitle: anime?.title,
        episodeNum: episodeNum,
        videoUrl: episodeUrl || "",
        malId: anime?.malId,
      },
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-cyber-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-cyber-teal border-t-transparent rounded-full"
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-cyber-black">
      {/* Background Hero */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${anime.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-cyber-black via-white/80 dark:via-cyber-black/80 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[8px]" />
      </div>

      <div className="container mx-auto px-6 -mt-64 relative z-10 pb-24">
        {/* WATCH PARTY SECTION */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-6xl mx-auto mb-16"
        >
          <div className="w-full aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl shadow-cyber-amber/20 border border-gray-100 dark:border-gray-800 bg-black relative group">
            <img
              src={anime.imageUrl}
              alt={anime.title}
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-cyber-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <Users
                size={64}
                className="text-cyber-amber mb-6 drop-shadow-[0_0_15px_rgba(255,170,0,0.5)]"
              />
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-widest text-white mb-4">
                Watch With Friends
              </h2>
              <p className="text-gray-300 max-w-2xl mb-8 font-medium">
                Create a synchronized Watch Party room. Paste any direct video
                link to stream perfectly in sync with everyone else in the room.
                Includes live chat and host controls.
              </p>
              <button
                onClick={createWatchParty}
                className="px-8 py-4 bg-cyber-amber text-cyber-black rounded-full font-black uppercase tracking-widest text-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(255,170,0,0.4)] transition-all flex items-center gap-3"
              >
                <Play size={24} fill="currentColor" />
                Create Room
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
          {/* Poster & Actions */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full lg:w-80 shrink-0"
          >
            <div className="rounded-[40px] overflow-hidden shadow-2xl border-4 border-white dark:border-cyber-gray">
              <img
                src={anime.imageUrl}
                alt={anime.title}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            <button
              onClick={createWatchParty}
              className="w-full mt-6 py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 transition-all bg-cyber-amber text-cyber-black hover:scale-105 shadow-xl shadow-cyber-amber/20"
            >
              <Users size={20} className="fill-current" />
              <span>Create Watch Party</span>
            </button>

            <button
              onClick={addToWatchlist}
              disabled={isInWatchlist}
              className={`w-full mt-4 py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 transition-all ${
                isInWatchlist
                  ? "bg-gray-200 dark:bg-cyber-gray/50 text-gray-400 cursor-not-allowed"
                  : "bg-white dark:bg-cyber-gray text-cyber-black dark:text-white hover:scale-105 shadow-xl shadow-black/5"
              }`}
            >
              <Bookmark
                size={20}
                fill={isInWatchlist ? "currentColor" : "none"}
              />
              <span>{isInWatchlist ? "In Watchlist" : "Add to Watchlist"}</span>
            </button>
          </motion.div>

          {/* Info Panels */}
          <div className="flex-1 space-y-10">
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {anime.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-4 py-1.5 rounded-full bg-cyber-teal/10 text-cyber-teal text-xs font-black uppercase tracking-widest border border-cyber-teal/20"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black dark:text-white uppercase italic tracking-tighter leading-[0.95] mb-6">
                {anime.title}
              </h1>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: Star,
                    label: "Score",
                    value: anime.score,
                    color: "text-cyber-amber",
                  },
                  {
                    icon: Users,
                    label: "Popularity",
                    value: `#${anime.popularity}`,
                    color: "text-cyber-teal",
                  },
                  {
                    icon: Hash,
                    label: "Episodes",
                    value: anime.episodes || "??",
                    color: "text-blue-500",
                  },
                  {
                    icon: Clock,
                    label: "Status",
                    value: anime.status,
                    color: "text-emerald-500",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-cyber-gray p-4 rounded-3xl border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <stat.icon size={14} className={stat.color} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-xl font-black dark:text-white italic">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-gray-50 dark:bg-cyber-gray p-8 rounded-[40px] border border-gray-100 dark:border-gray-800"
            >
              <h3 className="text-2xl font-black dark:text-white uppercase italic tracking-widest mb-6 border-l-4 border-cyber-teal pl-6">
                Synopsis
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                {anime.synopsis
                  ?.replace("[Written by MAL Rewrite]", "")
                  ?.trim()}
              </p>
            </motion.div>

            {/* Episode List Section */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <ListVideo className="text-cyber-teal" size={32} />
                <h3 className="text-3xl font-black dark:text-white uppercase italic tracking-widest">
                  Episodes
                </h3>
              </div>

              {episodesLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-cyber-teal" size={40} />
                </div>
              ) : episodes.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {episodes.map((ep, idx) => {
                    const globalEpisodeIndex =
                      (currentPage - 1) * itemsPerPage + idx + 1;
                    const episodeNum = ep.mal_id || globalEpisodeIndex;
                    const isSelected =
                      activeEpisode === episodeNum ||
                      activeEpisode === globalEpisodeIndex;

                    return (
                      <div
                        key={ep.mal_id || idx}
                        onClick={() => {
                          createWatchParty(
                            episodeNum,
                            "", // Do NOT pass ep.url as it is a webpage, not a video stream
                          );
                        }}
                        className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-cyber-gray rounded-2xl hover:bg-cyber-teal/10 dark:hover:bg-cyber-teal/10 transition-colors group cursor-pointer border ${isSelected ? "border-cyber-teal shadow-lg shadow-cyber-teal/20" : "border-transparent hover:border-cyber-teal/30"}`}
                      >
                        <div className="flex items-center space-x-6">
                          <div
                            className={`text-2xl font-black ${isSelected ? "text-cyber-teal" : "text-gray-400 dark:text-gray-700"} italic group-hover:text-cyber-teal transition-colors`}
                          >
                            {globalEpisodeIndex.toString().padStart(2, "0")}
                          </div>
                          <div>
                            <h4
                              className={`text-lg font-bold ${isSelected ? "text-cyber-teal" : "text-cyber-black dark:text-white group-hover:text-cyber-teal"} transition-colors`}
                            >
                              {ep.title || `Episode ${globalEpisodeIndex}`}
                            </h4>
                            {ep.title_japanese && (
                              <p className="text-sm text-gray-500">
                                {ep.title_japanese}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-4 text-sm text-gray-400">
                          {ep.aired && (
                            <span>
                              {new Date(ep.aired).toLocaleDateString()}
                            </span>
                          )}
                          <button
                            className={`w-10 h-10 rounded-full ${isSelected ? "bg-cyber-teal text-cyber-black" : "bg-white dark:bg-black/50 group-hover:bg-cyber-teal group-hover:text-cyber-black"} flex items-center justify-center transition-all`}
                          >
                            <Play size={16} className="ml-1" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-4">
                      <button
                        onClick={() => fetchEpisodes(currentPage - 1)}
                        disabled={currentPage === 1 || episodesLoading}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 disabled:opacity-50 hover:bg-cyber-teal hover:text-white transition-colors"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="text-gray-600 dark:text-gray-300 font-medium font-mono">
                        Page {currentPage} of {totalPages}
                      </div>
                      <button
                        onClick={() => fetchEpisodes(currentPage + 1)}
                        disabled={currentPage === totalPages || episodesLoading}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 disabled:opacity-50 hover:bg-cyber-teal hover:text-white transition-colors"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 dark:bg-cyber-gray rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Episode list format is not publicly available or currently
                    airing.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeDetails;
