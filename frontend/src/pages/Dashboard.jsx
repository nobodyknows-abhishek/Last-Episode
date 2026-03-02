import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import {
  Trash2,
  ExternalLink,
  Bookmark,
  User,
  Shield,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    const fetchWatchlist = async () => {
      try {
        const { data } = await axios.get("/api/watchlist", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setWatchlist(data);
      } catch (error) {
        console.error("Error fetching watchlist:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchWatchlist();
  }, [user, authLoading, navigate]);

  const handleRemove = async (id) => {
    if (!window.confirm("Disconnect node from archives?")) return;
    try {
      await axios.delete(`/api/watchlist/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setWatchlist(watchlist.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  if (loading || authLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-cyber-teal border-t-transparent rounded-full"
        />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {/* Cinematic Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-gray-50 dark:bg-cyber-gray p-10 md:p-16 rounded-[50px] overflow-hidden mb-12 border border-gray-100 dark:border-gray-800"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 dark:opacity-10">
          <Shield size={200} className="text-cyber-teal" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-cyber-teal">
              <Zap size={20} className="animate-pulse" />
              <span className="font-black uppercase tracking-[0.3em] text-xs">
                Operational Status: Online
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black dark:text-white uppercase italic tracking-tighter">
              {user?.name}'s <span className="text-cyber-teal">Archives</span>
            </h1>
          </div>

          <div className="bg-white dark:bg-cyber-black p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 flex items-center space-x-6 shadow-xl">
            <div className="text-center px-4">
              <div className="text-3xl font-black text-cyber-teal italic">
                {watchlist.length}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Tracked
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="text-center px-4">
              <div className="text-3xl font-black text-cyber-amber italic">
                0
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Completed
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Watchlist Grid */}
      <div className="space-y-6">
        <AnimatePresence>
          {watchlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50/50 dark:bg-cyber-gray/30 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[50px] py-32 text-center"
            >
              <Bookmark size={48} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-black dark:text-white uppercase italic tracking-widest">
                Archive Empty
              </h3>
              <p className="text-gray-500 mt-2 uppercase text-xs font-bold tracking-widest mb-8">
                No anime data detected in your personal node
              </p>
              <Link
                to="/search"
                className="inline-flex items-center space-x-3 bg-cyber-teal text-cyber-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
              >
                <span>Initialize Search</span>
                <ExternalLink size={16} />
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {watchlist.map((item, idx) => (
                <motion.div
                  key={item._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  exit={{ x: 50, opacity: 0 }}
                  className="group bg-white dark:bg-cyber-gray p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-8 hover:border-cyber-teal/50 transition-all shadow-lg hover:shadow-cyber-teal/5 shadow-gray-200/50 dark:shadow-none"
                >
                  <div className="w-24 h-36 rounded-2xl overflow-hidden shrink-0 shadow-xl">
                    <img
                      src={item.anime.imageUrl}
                      alt={item.anime.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-grow text-center md:text-left space-y-2">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                      {item.anime.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                        >
                          #{g}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl font-black dark:text-white italic uppercase tracking-tight group-hover:text-cyber-teal transition-colors">
                      {item.anime.title}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start space-x-4">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-cyber-teal/10 text-cyber-teal px-3 py-1 rounded-full">
                        {item.status}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Added to archives:{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <Link
                      to={`/anime/${item.anime._id}`}
                      className="p-5 bg-gray-50 dark:bg-cyber-black text-gray-400 hover:text-cyber-teal rounded-2xl transition-all hover:scale-110"
                    >
                      <ExternalLink size={20} />
                    </Link>
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="p-5 bg-red-500/5 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
