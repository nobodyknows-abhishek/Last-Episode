import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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
} from "lucide-react";
import { motion } from "framer-motion";

const AnimeDetails = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [streamData, setStreamData] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [selectedServer, setSelectedServer] = useState("vidlink.pro");
  const [showPlayer, setShowPlayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const playerRef = useRef(null);

  const servers = [
    { id: "vidlink.pro", name: "VidLink Pro (HQ)" },
    { id: "vidsrc.to", name: "VidSrc To (Primary)" },
    { id: "vidsrc.me", name: "VidSrc Me (Fallback)" },
    { id: "vidsrc.cc", name: "VidSrc CC (Alt)" },
  ];

  const getStreamUrl = (streamInfo, ep) => {
    if (!streamInfo) return "";
    const anilistId =
      streamInfo.alId ||
      Object.values(streamInfo.Sites || {})
        .flatMap(Object.values)
        .find((s) => s.aniId)?.aniId;
    if (!anilistId) return "";

    switch (selectedServer) {
      case "vidlink.pro":
        return `https://vidlink.pro/anime/${anilistId}/${ep}`;
      case "vidsrc.to":
        return `https://vidsrc.to/embed/anime/${anilistId}/${ep}`;
      case "vidsrc.me":
        return `https://vidsrc.me/embed/anime?anilist=${anilistId}&ep=${ep}`;
      case "vidsrc.cc":
        return `https://vidsrc.cc/v2/embed/anime/${anilistId}/${ep}`;
      default:
        return `https://vidlink.pro/anime/${anilistId}/${ep}`;
    }
  };

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const { data } = await axios.get(`/api/anime/${id}`);
        setAnime(data);

        // Fetch episodes in parallel with watchlist check
        const episodesReq = axios.get(`/api/anime/${id}/episodes`);
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
          if (episodesRes.data.data.length > 0) {
            setActiveEpisode(1); // Default to ep 1
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
  }, [id, user]);

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

  const scrollToPlayer = () => {
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
        {/* CINEMATIC PLAYER SECTION */}
        <motion.div
          ref={playerRef}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-6xl mx-auto mb-16"
        >
          <div className="w-full aspect-video rounded-[40px] overflow-hidden shadow-2xl shadow-cyber-teal/20 border border-gray-100 dark:border-gray-800 bg-black relative group">
            {!showPlayer ? (
              <div
                className="w-full h-full relative cursor-pointer group"
                onClick={() => setShowPlayer(true)}
              >
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-cyber-black/40 group-hover:bg-cyber-black/20 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-24 h-24 bg-cyber-teal/90 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.4)] backdrop-blur-md group-hover:bg-cyber-teal transition-all"
                  >
                    <Play
                      size={40}
                      className="text-cyber-black ml-2"
                      fill="currentColor"
                    />
                  </motion.div>
                </div>
              </div>
            ) : streamData ? (
              <iframe
                className="w-full h-full"
                src={getStreamUrl(streamData, activeEpisode || 1)}
                title="Anime Player"
                allowFullScreen
              ></iframe>
            ) : anime.trailerUrl ? (
              <iframe
                className="w-full h-full"
                src={`${anime.trailerUrl.replace("watch?v=", "embed/")}?autoplay=0&rel=0`}
                title="Anime Trailer"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-cyber-gray">
                <MonitorPlay
                  size={64}
                  className="text-cyber-teal mb-4 opacity-50"
                />
                <p className="text-xl font-black italic uppercase tracking-widest text-gray-500">
                  Player Unavailable for this title
                </p>
              </div>
            )}
          </div>

          {/* Server Selection UI */}
          {streamData && showPlayer && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between bg-gray-50 dark:bg-cyber-gray p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <Server className="text-cyber-amber" size={24} />
                <span className="font-black uppercase tracking-widest text-sm text-gray-500 dark:text-gray-400">
                  Select Server:
                </span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => setSelectedServer(server.id)}
                    className={`px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md ${
                      selectedServer === server.id
                        ? "bg-cyber-amber text-cyber-black shadow-cyber-amber/30 scale-105"
                        : "bg-white dark:bg-cyber-black text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-cyber-amber/50 border border-transparent"
                    }`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
              onClick={() => {
                setShowPlayer(true);
                scrollToPlayer();
              }}
              className="w-full mt-6 py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 transition-all bg-cyber-teal text-cyber-black hover:scale-105 shadow-xl shadow-cyber-teal/20"
            >
              <Play size={20} className="fill-current" />
              <span>Watch Now</span>
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

              {episodes.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {episodes.map((ep, idx) => (
                    <div
                      key={ep.mal_id || idx}
                      onClick={() => {
                        setShowPlayer(true);
                        setActiveEpisode(ep.mal_id || idx + 1);
                        scrollToPlayer();
                      }}
                      className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-cyber-gray rounded-2xl hover:bg-cyber-teal/10 dark:hover:bg-cyber-teal/10 transition-colors group cursor-pointer border ${activeEpisode === (ep.mal_id || idx + 1) ? "border-cyber-teal shadow-lg shadow-cyber-teal/20" : "border-transparent hover:border-cyber-teal/30"}`}
                    >
                      <div className="flex items-center space-x-6">
                        <div
                          className={`text-2xl font-black ${activeEpisode === (ep.mal_id || idx + 1) ? "text-cyber-teal" : "text-gray-400 dark:text-gray-700"} italic group-hover:text-cyber-teal transition-colors`}
                        >
                          {(ep.mal_id || idx + 1).toString().padStart(2, "0")}
                        </div>
                        <div>
                          <h4
                            className={`text-lg font-bold ${activeEpisode === (ep.mal_id || idx + 1) ? "text-cyber-teal" : "text-cyber-black dark:text-white group-hover:text-cyber-teal"} transition-colors`}
                          >
                            {ep.title || `Episode ${idx + 1}`}
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
                          <span>{new Date(ep.aired).toLocaleDateString()}</span>
                        )}
                        <button
                          className={`w-10 h-10 rounded-full ${activeEpisode === (ep.mal_id || idx + 1) ? "bg-cyber-teal text-cyber-black" : "bg-white dark:bg-black/50 group-hover:bg-cyber-teal group-hover:text-cyber-black"} flex items-center justify-center transition-all`}
                        >
                          <Play size={16} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
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
