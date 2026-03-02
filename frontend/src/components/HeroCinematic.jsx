import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroCinematic = ({ animes }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Auto-scroll logic
  useEffect(() => {
    if (!animes || animes.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animes.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(interval);
  }, [animes]);

  if (!animes || animes.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  };

  const handleNavigate = () => {
    navigate(`/anime/${animes[currentIndex]._id}`);
  };

  return (
    <section className="relative h-screen min-h-100 lg:min-h-150 w-full overflow-hidden bg-transparent">
      <AnimatePresence mode="wait">
        {/* The image container */}
        <div className="absolute inset-0 w-full h-full">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-top md:bg-center"
            style={{
              backgroundImage: `url(${animes[currentIndex]?.bannerImage || animes[currentIndex]?.imageUrl})`,
            }}
          />
        </div>
      </AnimatePresence>

      {/* Premium Cinematic Deep Vignette for Text Contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.2)_0%,rgba(2,6,23,0.95)_100%)] bg-linear-to-t from-cyber-black via-cyber-black/90 to-black/40 z-10" />

      {/* Carousel Controls */}
      <div className="absolute inset-y-0 left-0 z-30 flex items-center px-4 md:px-8">
        <button
          onClick={handlePrev}
          className="p-3 md:p-4 rounded-full bg-black/20 hover:bg-cyber-teal border border-white/10 hover:border-cyber-teal backdrop-blur-md text-white hover:text-cyber-black transition-all duration-300 group"
        >
          <ChevronLeft
            size={32}
            className="group-hover:-translate-x-1 transition-transform"
          />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 z-30 flex items-center px-4 md:px-8">
        <button
          onClick={handleNext}
          className="p-3 md:p-4 rounded-full bg-black/20 hover:bg-cyber-teal border border-white/10 hover:border-cyber-teal backdrop-blur-md text-white hover:text-cyber-black transition-all duration-300 group"
        >
          <ChevronRight
            size={32}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-16 lg:px-24 z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${currentIndex}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl space-y-6 pointer-events-auto"
          >
            <div className="flex flex-wrap items-center gap-4">
              <span className="px-4 py-1.5 bg-cyber-teal/10 border border-cyber-teal/30 text-cyber-teal text-xs font-black tracking-widest uppercase rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                Trending Now
              </span>
              <span className="text-gray-600 dark:text-white/70 text-sm font-bold uppercase tracking-[0.2em] italic">
                {animes[currentIndex]?.status === "Currently Airing"
                  ? "Broadcasting"
                  : animes[currentIndex]?.status || "Season Highlight"}
              </span>
            </div>

            {/* Responsive, scalable typography with line clamp and break-words to prevent overflow */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[0.95] tracking-tighter uppercase italic drop-shadow-[0_10px_10px_rgba(0,0,0,0.85)] overflow-hidden wrap-break-word"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={animes[currentIndex]?.title}
            >
              {animes[currentIndex]?.title?.replace(/\[|\]/g, "")?.trim() ||
                "Untitled Mission"}
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl line-clamp-3 font-medium leading-[1.6] drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)]">
              {animes[currentIndex]?.synopsis
                ?.replace("[Written by MAL Rewrite]", "")
                ?.trim()}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 pt-8">
              <button
                onClick={handleNavigate}
                className="relative group overflow-hidden bg-cyber-amber text-cyber-black px-6 py-4 md:px-12 md:py-5 rounded-full font-black uppercase text-xs md:text-sm tracking-widest flex justify-center items-center space-x-3 transition-transform hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                <Play size={20} fill="currentColor" className="relative z-10" />
                <span className="relative z-10">Enter World</span>
              </button>
              <button
                onClick={handleNavigate}
                className="relative overflow-hidden border border-white/20 bg-black/40 backdrop-blur-md text-white px-6 py-4 md:px-12 md:py-5 rounded-full font-black uppercase text-xs md:text-sm tracking-widest hover:bg-white/10 transition-all duration-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] w-full sm:w-auto"
              >
                Explore Lore
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-3 z-30">
        {animes.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-500 rounded-full ${
              idx === currentIndex
                ? "w-12 h-2 bg-cyber-teal shadow-[0_0_10px_rgba(45,212,191,0.6)]"
                : "w-2 h-2 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCinematic;
