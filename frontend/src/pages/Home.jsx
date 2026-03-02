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
  const { notification } = useSocket();

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const [trendingRes, latestRes] = await Promise.all([
          axios.get("/api/anime/trending?limit=25"),
          axios.get("/api/anime?pageSize=20"),
        ]);
        setTrending(trendingRes.data);
        setLatest(latestRes.data.animes);
      } catch (error) {
        console.error("Error fetching animes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimes();
  }, []);

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
              <h2 className="text-4xl sm:text-5xl font-black dark:text-white flex items-center tracking-tighter italic uppercase">
                Trending{" "}
                <TrendingUp className="ml-4 text-cyber-teal" size={40} />
              </h2>
            </div>
            <button
              onClick={() => setShowAllTrending(!showAllTrending)}
              className="flex items-center space-x-2 text-gray-500 hover:text-cyber-teal transition-colors font-bold uppercase tracking-widest text-xs"
            >
              <span>{showAllTrending ? "Show Less" : "View All Records"}</span>
              <ChevronRight
                size={16}
                className={`transition-transform ${showAllTrending ? "rotate-90" : ""}`}
              />
            </button>
          </div>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {(showAllTrending ? trending.slice(1) : trending.slice(1, 5)).map(
              (anime, idx) => (
                <AnimeCard key={anime._id} anime={anime} index={idx} />
              ),
            )}
          </motion.div>
        </section>

        {/* Cinematic Split Section */}
        <section className="relative h-[60vh] rounded-[40px] overflow-hidden group">
          <div className="absolute inset-0 bg-cyber-amber/20 z-10 mix-blend-overlay" />
          <img
            src={latest[0]?.imageUrl}
            className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 transition-all duration-1000"
            alt="Highlight"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center text-center p-6 md:p-12">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-cyber-black dark:text-white italic tracking-tighter uppercase leading-[0.95]">
                Unleash the <span className="text-cyber-amber">Otaku</span>{" "}
                within
              </h2>
              <p className="text-base sm:text-lg text-cyber-black dark:text-gray-300 font-bold padding-4 drop-shadow-md">
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
              <h2 className="text-4xl sm:text-5xl font-black dark:text-white flex items-center tracking-tighter italic uppercase">
                Latest <Sparkles className="ml-4 text-cyber-amber" size={40} />
              </h2>
            </div>
            <button
              onClick={() => setShowAllLatest(!showAllLatest)}
              className="flex items-center space-x-2 text-gray-500 hover:text-cyber-amber transition-colors font-bold uppercase tracking-widest text-xs"
            >
              <span>{showAllLatest ? "Show Less" : "View All Records"}</span>
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
        </section>
      </div>
    </div>
  );
};

export default Home;
