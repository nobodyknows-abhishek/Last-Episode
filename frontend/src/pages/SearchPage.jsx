import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AnimeCard from "../components/AnimeCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  Filter,
  Sparkles,
  Zap,
  X,
  LayoutGrid,
  Loader2,
} from "lucide-react";

const GENRES = [
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
  "Supernatural",
  "Slice of Life",
];

const SearchPage = () => {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);

  // Debounce keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const toggleGenre = (g) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setStatus("");
    setPage(1);
  };

  const clearSearch = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setPage(1);
  };

  const fetchSearch = useCallback(
    async (p = 1, append = false) => {
      // Don't search if everything is empty
      if (!debouncedKeyword && !status && selectedGenres.length === 0) {
        setAnimes([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = { q: debouncedKeyword, page: p };
        if (status) params.status = status;
        if (selectedGenres.length) params.genre = selectedGenres.join(",");

        const { data } = await axios.get("/api/anime/search", { params });
        const items = (data.data || []).map((it) => ({
          _id: it.mal_id,
          title: it.title,
          imageUrl:
            it.images?.jpg?.large_image_url || it.images?.jpg?.image_url,
          score: it.score,
          status: it.status,
          episodes: it.episodes,
          lastKnownEpisodes: it.lastKnownEpisodes || 0,
        }));

        if (append) setAnimes((prev) => [...prev, ...items]);
        else setAnimes(items);

        const pagination = data.pagination || {};
        setHasMore(Boolean(pagination.has_next_page));
      } catch (err) {
        console.error("Search error:", err.message || err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedKeyword, status, selectedGenres],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    setPage(1);
    fetchSearch(1, false);
  }, [fetchSearch]);

  useEffect(() => {
    if (page === 1) return;
    fetchSearch(page, true);
  }, [page, fetchSearch]);

  const isInitialState = !keyword && !status && selectedGenres.length === 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      {/* Hero Search Section */}
      <div className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--cyber-teal-dark)_0%,transparent_70%)] opacity-20 pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic uppercase">
              Search your favorite{" "}
              <span className="text-cyber-teal">Anime</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-linear-to-r from-cyber-teal to-cyber-amber rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
            <div className="relative flex items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden px-6 py-4">
              <SearchIcon size={24} className="text-cyber-teal mr-4" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter title, character, or studio..."
                className="w-full bg-transparent border-none outline-none text-xl font-bold placeholder:text-white/20 uppercase tracking-tight italic"
              />
              {keyword && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white mr-2"
                >
                  <X size={18} />
                </button>
              )}
              {loading && (
                <Loader2
                  size={24}
                  className="animate-spin text-cyber-teal ml-4"
                />
              )}
            </div>
          </motion.div>

          {/* Filters */}
          <div className="mt-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                    selectedGenres.includes(g)
                      ? "bg-cyber-teal border-cyber-teal text-black shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-center">
              {["", "Airing", "Completed", "Upcoming"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                    status === s
                      ? "bg-cyber-amber border-cyber-amber text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  {s || "All Status"}
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-6 mt-8">
        {!isInitialState && (
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <LayoutGrid size={20} className="text-cyber-teal" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] italic">
                Search Results
              </h2>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={animes.length}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-[10px] font-bold text-white/40 uppercase tracking-widest"
              >
                {animes.length} Titles Found
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {loading && animes.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="aspect-3/4 bg-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : isInitialState ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center"
          >
            <Zap
              size={48}
              className="mx-auto text-white/10 mb-6 animate-pulse"
            />
            <p className="text-xl font-bold text-white/40 uppercase italic tracking-tighter">
              Awaiting transmission... <br />
              <span className="text-sm">
                Initiate resonance to discover titles.
              </span>
            </p>
          </motion.div>
        ) : animes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center"
          >
            <Sparkles size={48} className="mx-auto text-white/5 mb-6" />
            <p className="text-xl font-bold text-white/20 uppercase italic tracking-tighter">
              No results found for{" "}
              <span className="text-cyber-teal">
                {debouncedKeyword
                  ? `"${debouncedKeyword}"`
                  : "selected filters"}
              </span>
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8"
            >
              <AnimatePresence mode="popLayout">
                {animes.map((a, idx) => (
                  <AnimeCard
                    key={`${a._id}-${idx}`}
                    anime={a}
                    index={idx % 20}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <div className="flex justify-center mt-20">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="group relative px-12 py-4 bg-transparent"
                >
                  <div className="absolute inset-0 bg-cyber-teal rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative px-8 py-3 bg-black border border-cyber-teal/50 rounded-full text-cyber-teal font-black uppercase tracking-widest text-xs flex items-center gap-2 overflow-hidden">
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        Synchronize More <Zap size={14} fill="currentColor" />
                      </>
                    )}
                  </div>
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
