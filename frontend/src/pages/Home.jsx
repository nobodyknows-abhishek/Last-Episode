import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AnimeCard from "../components/AnimeCard";
import HeroCinematic from "../components/HeroCinematic";
import { useSocket } from "../context/SocketContext.jsx";
import { AlertCircle, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);
  const [trendingPage, setTrendingPage] = useState(1);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [latestPage, setLatestPage] = useState(1);
  const [hasMoreLatest, setHasMoreLatest] = useState(true);
  const [loadingMoreTrending, setLoadingMoreTrending] = useState(false);
  const [loadingMoreLatest, setLoadingMoreLatest] = useState(false);
  const { notification } = useSocket();

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const trendingUrl = "/api/anime/trending?limit=10&page=1";
        const latestUrl = "/api/anime/latest?pageSize=20&page=1";
        console.log("Fetching Trending from:", axios.defaults.baseURL + trendingUrl);
        console.log("Fetching Latest from:", axios.defaults.baseURL + latestUrl);
        const [trendingRes, latestRes] = await Promise.all([
          axios.get(trendingUrl),
          axios.get(latestUrl),
        ]);
        setTrending(trendingRes.data);
        if (trendingRes.data.length < 10) {
          setHasMoreTrending(false);
        }
        setLatest(latestRes.data.animes);
        if (latestRes.data.animes.length < 20) {
          setHasMoreLatest(false);
        }
      } catch (error) {
        console.error("Error fetching animes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimes();
  }, []);

  const loadMoreTrending = async () => {
    if (loadingMoreTrending) return;
    setLoadingMoreTrending(true);
    try {
      const nextPage = trendingPage + 1;
      const res = await axios.get(
        `/api/anime/trending?limit=10&page=${nextPage}`,
      );
      const newAnimes = res.data;
      if (newAnimes.length === 0) {
        setHasMoreTrending(false);
        setLoadingMoreTrending(false);
        return;
      }
      if (newAnimes.length < 10) {
        setHasMoreTrending(false);
      }
      setTrending((prev) => {
        const existingIds = new Set(prev.map((a) => a._id));
        const uniqueNew = newAnimes.filter((a) => !existingIds.has(a._id));
        return [...prev, ...uniqueNew];
      });
      setTrendingPage(nextPage);
    } catch (error) {
      console.error("Error loading more trending:", error);
    } finally {
      setLoadingMoreTrending(false);
    }
  };

  const loadMoreLatest = async () => {
    if (loadingMoreLatest) return;
    setLoadingMoreLatest(true);
    try {
      const nextPage = latestPage + 1;
      const res = await axios.get(`/api/anime/latest?pageSize=20&page=${nextPage}`);
      const newAnimes = res.data.animes;
      if (newAnimes.length === 0) {
        setHasMoreLatest(false);
        setLoadingMoreLatest(false);
        return;
      }
      if (newAnimes.length < 20) {
        setHasMoreLatest(false);
      }
      setLatest((prev) => {
        const existingIds = new Set(prev.map((a) => a._id));
        const uniqueNew = newAnimes.filter((a) => !existingIds.has(a._id));
        return [...prev, ...uniqueNew];
      });
      setLatestPage(nextPage);
    } catch (error) {
      console.error("Error loading more latest:", error);
    } finally {
      setLoadingMoreLatest(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-cyber-teal border-t-transparent rounded-full"
        />
      </div>
    );

  return (
    <div className="bg-transparent min-h-screen overflow-x-hidden">
      {notification && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed bottom-8 right-8 bg-cyber-teal text-cyber-black px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 z-[100] font-black uppercase text-xs tracking-widest border-2 border-white/20"
        >
          <AlertCircle size={18} />
          <span>{notification}</span>
        </motion.div>
      )}

      <HeroCinematic animes={trending.slice(0, 5)} />

      <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 space-y-24 md:space-y-32">
        {/* Trending Section */}
        <section>
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-cyber-teal font-black tracking-[0.4em] uppercase text-xs mb-2 block">
                Hot Pick
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black dark:text-white flex items-center tracking-tighter italic uppercase">
                Trending{" "}
                <TrendingUp
                  className="ml-3 sm:ml-4 text-cyber-teal"
                  size={32}
                />
              </h2>
            </div>
            <button
              onClick={() => setShowAllTrending(!showAllTrending)}
              className="flex items-center space-x-2 text-gray-500 hover:text-cyber-teal transition-colors font-bold uppercase tracking-widest text-xs cursor-pointer"
            >
              <span>{showAllTrending ? "Show Less" : "View More"}</span>
              <ChevronRight
                size={16}
                className={`transition-transform ${showAllTrending ? "rotate-90" : ""}`}
              />
            </button>
          </div>
          <motion.div
            layout
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
          >
            {(showAllTrending ? trending.slice(1) : trending.slice(1, 5)).map(
              (anime, idx) => (
                <AnimeCard key={anime._id} anime={anime} index={idx} />
              ),
            )}
          </motion.div>

          {showAllTrending && hasMoreTrending && (
            <div className="flex justify-center mt-8 ">
              <button
                onClick={loadMoreTrending}
                disabled={loadingMoreTrending}
                className="px-8 py-3 bg-cyber-teal text-cyber-black font-black uppercase tracking-widest hover:bg-white transition-colors rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMoreTrending ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </section>

        {/* Cinematic Split Section */}
        <section className="relative min-h-[50vh] sm:h-[60vh] rounded-3xl sm:rounded-[40px] overflow-hidden group">
          <div className="absolute inset-0 bg-cyber-amber/20 z-10 mix-blend-overlay" />
          <img
            src={latest[0]?.imageUrl}
            className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 transition-all duration-1000"
            alt="Highlight"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center text-center p-6 md:p-12">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black text-cyber-black dark:text-white italic tracking-tighter uppercase leading-[0.95] drop-shadow-lg">
                Unleash the <span className="text-cyber-amber">Otaku</span>{" "}
                within
              </h2>
              <p className="text-sm sm:text-lg text-cyber-black dark:text-gray-200 font-bold px-4 drop-shadow-xl max-w-2xl mx-auto">
                Join thousands of fans tracking their journey through the
                infinite worlds of animation. Live updates, real-time sync, and
                a community that never sleeps.
              </p>
            </div>
          </div>
        </section>

        {/* Latest Updates Section */}
        <section>
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black dark:text-white flex items-center tracking-tighter italic uppercase">
                Latest Airing{" "}
                <Sparkles className="ml-3 sm:ml-4 text-cyber-amber" size={32} />
              </h2>
            </div>
            <button
              onClick={() => setShowAllLatest(!showAllLatest)}
              className="flex items-center space-x-2 text-gray-500 hover:text-cyber-amber transition-colors font-bold uppercase tracking-widest text-xs cursor-pointer"
            >
              <span>{showAllLatest ? "Show Less" : "View More"}</span>
              <ChevronRight
                size={16}
                className={`transition-transform ${showAllLatest ? "rotate-90" : ""}`}
              />
            </button>
          </div>
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {(showAllLatest ? latest : latest.slice(0, 5)).map((anime, idx) => (
              <AnimeCard key={anime._id} anime={anime} index={idx} />
            ))}
          </motion.div>

          {showAllLatest && hasMoreLatest && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMoreLatest}
                disabled={loadingMoreLatest}
                className="px-8 py-3 bg-cyber-amber text-cyber-black font-black uppercase tracking-widest hover:bg-white transition-colors rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMoreLatest ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
