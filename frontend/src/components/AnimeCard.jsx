import React from "react";
import { Link } from "react-router-dom";
import { Star, Play } from "lucide-react";
import { motion } from "framer-motion";

const AnimeCard = ({ anime, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        to={`/anime/${anime._id}`}
        className="group relative bg-[#ffffff]/80 dark:bg-cyber-gray/80 backdrop-blur-xl rounded-2xl sm:rounded-4xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(45,212,191,0.2)] dark:shadow-2xl dark:hover:shadow-cyber-teal/20 transition-all duration-500 block border border-white/50 dark:border-white/10"
      >
        <div className="aspect-[3/4] relative overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.8 }}
            src={anime.coverImage || anime.imageUrl}
            alt={anime.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 dark:opacity-80 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-cyber-teal/20 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1.2 }}
              className="bg-cyber-teal text-cyber-black p-4 rounded-full shadow-xl"
            >
              <Play size={24} fill="currentColor" />
            </motion.div>
          </div>

          <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1 border border-white/20 shadow-sm">
            <Star size={12} className="text-cyber-amber" fill="currentColor" />
            <span className="text-cyber-black dark:text-white text-xs font-black">
              {anime.score || "N/A"}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-transparent relative z-10 w-full">
          <h3 className="font-black text-cyber-black dark:text-white truncate text-base sm:text-lg group-hover:text-cyber-teal transition-colors tracking-tight uppercase italic">
            {anime.title}
          </h3>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-[10px] font-black tracking-widest uppercase text-cyber-teal bg-cyber-teal/10 px-2 py-0.5 rounded">
              {anime.status === "Currently Airing" ? "LIVE" : "VOD"}
            </span>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              {(() => {
                const total = anime.episodes || "?";
                if (anime.status === "Finished Airing" || anime.status === "Completed") return `${total}/${total} Episodes`;
                const released = anime.lastKnownEpisodes || "?";
                return `${released}/${total} Episodes`;
              })()}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default AnimeCard;
