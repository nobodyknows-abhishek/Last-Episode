import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { LogOut, User, Search, Tv, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationMenu from "./NotificationMenu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-cyber-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5 shadow-xs transition-colors duration-500">
      <div className="container mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 group">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="text-cyber-teal"
          >
            <img src="/logo.svg" alt="logo" className="h-16 w-20" />
          </motion.div>
          <span className="text-xl sm:text-2xl font-black bg-linear-to-r from-cyber-teal to-cyber-amber bg-clip-text text-transparent italic tracking-normal">
            LastEpisode
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-4 sm:space-x-8">
          <Link
            to="/search"
            className="text-gray-600 dark:text-gray-400 hover:text-cyber-teal dark:hover:text-cyber-teal transition-colors font-bold uppercase text-xs tracking-widest flex items-center space-x-1"
          >
            <Search size={18} />
            <span>Discover</span>
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-cyber-teal dark:hover:text-cyber-teal transition-colors font-bold uppercase text-xs tracking-widest flex items-center space-x-1"
            >
              <User size={18} />
              <span>Library</span>
            </Link>
          )}

          <div className="h-6 w-px bg-gray-800" />

          {user && (
            <>
              <NotificationMenu />
              <div className="h-6 w-px bg-gray-800 cursor-pointer" />
            </>
          )}

          {user ? (
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <Link
              to="/login"
              className="relative px-4 sm:px-6 py-2 group overflow-hidden rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest"
            >
              <span className="absolute inset-0 bg-cyber-teal transition-transform duration-300 group-hover:scale-105" />
              <span className="relative text-cyber-black">Join</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-4">
          {user && <NotificationMenu />}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-cyber-black/95 backdrop-blur-xl border-b border-white/5"
          >
            <div className="px-6 py-8 flex flex-col space-y-6">
              <Link
                to="/search"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-cyber-teal transition-colors font-bold uppercase tracking-widest flex items-center space-x-4"
              >
                <Search size={24} />
                <span>Discover</span>
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-cyber-teal transition-colors font-bold uppercase tracking-widest flex items-center space-x-4"
                >
                  <User size={24} />
                  <span>Library</span>
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors font-bold uppercase tracking-widest flex items-center space-x-4 justify-start text-left w-full"
                >
                  <LogOut size={24} />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="bg-cyber-teal text-cyber-black uppercase font-black text-center py-4 rounded-xl tracking-widest mt-4"
                >
                  Join Last EP
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
