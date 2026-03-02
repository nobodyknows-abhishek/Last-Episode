import React, { useState, useEffect } from "react";
import axios from "axios";
import AnimeCard from "../components/AnimeCard";
import { Search as SearchIcon, Filter, Layers, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SearchPage = () => {
  const [animes, setAnimes] = useState([]);
  const [params, setParams] = useState({
    keyword: "",
    status: "",
    genre: "",
    page: 1,
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const genres = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Sports",
  ];

  const fetchSearch = async () => {
    setLoading(true);
    try {
      if (params.keyword) {
        const { data } = await axios.get("/api/anime/search", {
          params: { q: params.keyword, page: params.page },
        });
        const mappedAnimes = (data.data || []).map((item) => ({
          _id: item.mal_id,
          title: item.title,
          imageUrl:
            item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
          score: item.score,
          status: item.status,
          episodes: item.episodes,
        }));
        setAnimes(mappedAnimes);
      } else {
        const { data } = await axios.get("/api/anime", {
          params: { ...params, pageSize: 15 },
        });
        setAnimes(data.animes || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [params]);

  return (
    <div className="min-h-screen bg-white dark:bg-cyber-black pb-24">
      {/* Header & Search Bar */}
      <div className="bg-gray-50 dark:bg-cyber-gray py-20 px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <span className="text-cyber-teal font-black tracking-[0.4em] uppercase text-xs mb-4 block">
              Archive Directory
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black dark:text-white uppercase italic tracking-tighter">
              Discover Reality
            </h1>
          </motion.div>

          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-cyber-teal/20 blur-2xl group-focus-within:bg-cyber-teal/40 transition-all rounded-[40px]" />
            <div className="relative flex items-center bg-white dark:bg-cyber-black border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-2 focus-within:border-cyber-teal transition-all">
              <div className="pl-6 text-gray-400">
                <SearchIcon size={24} />
              </div>
              <input
                type="text"
                placeholder="SCAN FOR TITLES, GENRES, STUDIOS..."
                className="w-full px-4 md:px-6 py-4 md:py-6 bg-transparent outline-none dark:text-white font-black tracking-widest uppercase text-xs md:text-sm"
                value={params.keyword}
                onChange={(e) =>
                  setParams({ ...params, keyword: e.target.value, page: 1 })
                }
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-5 rounded-2xl flex items-center space-x-2 transition-all ${showFilters ? "bg-cyber-teal text-cyber-black" : "hover:bg-gray-100 dark:hover:bg-cyber-gray text-gray-400"}`}
              >
                <Filter size={20} />
                <span className="font-black text-xs uppercase tracking-widest hidden md:inline">
                  Filters
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-12">
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 dark:bg-cyber-gray p-8 rounded-[40px] mb-12 grid grid-cols-1 md:grid-cols-2 gap-10 overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div>
                <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
                  <Layers size={14} />
                  <span>Genre Protocol</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {["", ...genres].map((g) => (
                    <button
                      key={g}
                      onClick={() =>
                        setParams({ ...params, genre: g, page: 1 })
                      }
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${params.genre === g ? "bg-cyber-teal text-cyber-black" : "bg-white dark:bg-cyber-black dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-cyber-teal"}`}
                    >
                      {g || "OFFLINE"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
                  <Zap size={14} />
                  <span>Status Stream</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {["", "Airing", "Completed", "Upcoming"].map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setParams({ ...params, status: s, page: 1 })
                      }
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${params.status === s ? "bg-cyber-amber text-cyber-black" : "bg-white dark:bg-cyber-black dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-cyber-amber"}`}
                    >
                      {s || "ALL FREQUENCIES"}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="h-16 w-16 border-4 border-cyber-teal border-t-transparent rounded-full mb-6"
            />
            <span className="text-xs font-black tracking-[0.5em] text-cyber-teal uppercase animate-pulse">
              Synchronizing Data...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {animes.map((anime, idx) => (
              <AnimeCard key={anime._id} anime={anime} index={idx} />
            ))}
          </div>
        )}

        {!loading && animes.length === 0 && (
          <div className="text-center py-40 bg-gray-50 dark:bg-cyber-gray rounded-[50px] border border-dashed border-gray-200 dark:border-gray-700">
            <X size={64} className="mx-auto text-gray-300 mb-6" />
            <h3 className="text-2xl font-black dark:text-white uppercase italic tracking-widest">
              No Signals Found
            </h3>
            <p className="text-gray-500 mt-2 uppercase text-xs font-bold tracking-widest">
              Adjust your filters to scan different frequencies
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
