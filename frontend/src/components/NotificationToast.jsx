import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Sparkles } from "lucide-react";
import { useSocket } from "../context/SocketContext";

const NotificationToast = () => {
  const { toastNotif, clearToast } = useSocket();

  // Auto-dismiss handled in SocketContext, but allow manual dismiss too
  if (!toastNotif) return null;

  const anime = toastNotif.anime;

  return (
    <AnimatePresence>
      {toastNotif && (
        <motion.div
          key={toastNotif._id || "toast"}
          initial={{ opacity: 0, x: 120, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 120, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[9999] w-80 max-w-[calc(100vw-2rem)]"
          role="alert"
          aria-live="polite"
        >
          {/* Glow backdrop */}
          <div className="absolute inset-0 rounded-2xl bg-cyber-amber/10 blur-xl pointer-events-none" />

          <div className="relative rounded-2xl bg-cyber-black/95 border border-cyber-amber/30 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Top accent line */}
            <div className="h-0.5 bg-gradient-to-r from-cyber-amber via-yellow-300 to-cyber-amber" />

            <div className="p-4 flex gap-3 items-start">
              {/* Anime cover */}
              {anime?.imageUrl ? (
                <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden shadow-lg border border-white/10">
                  <img
                    src={anime.imageUrl}
                    alt={anime.title || "Anime"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-12 h-16 rounded-lg bg-cyber-amber/10 flex items-center justify-center border border-cyber-amber/20">
                  <Bell size={20} className="text-cyber-amber" />
                </div>
              )}

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-cyber-amber flex-shrink-0" />
                  <span className="text-xs font-semibold text-cyber-amber uppercase tracking-wider">
                    New Episode!
                  </span>
                </div>
                {anime?.title && (
                  <p className="text-sm font-bold text-white truncate">
                    {anime.title}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-0.5 leading-relaxed line-clamp-2">
                  {toastNotif.message}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={clearToast}
                className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar auto-dismiss indicator */}
            <motion.div
              className="h-0.5 bg-cyber-amber/60"
              initial={{ scaleX: 1, originX: 0 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;
