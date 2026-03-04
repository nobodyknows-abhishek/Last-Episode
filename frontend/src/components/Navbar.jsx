import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LogOut, User, Search, Tv, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationMenu from "./NotificationMenu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-cyber-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5 shadow-xs transition-colors duration-500">
      <div className="container mx-auto px-4 sm:px-8 h-16 sm:h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 group">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="text-cyber-teal"
          >
            <img
              src="/logo.svg"
              alt="logo"
              className="h-10 w-12 sm:h-16 sm:w-20"
            />
          </motion.div>
          <span className="text-lg sm:text-2xl font-black bg-linear-to-r from-cyber-teal to-cyber-amber bg-clip-text text-transparent italic tracking-tight sm:tracking-normal">
            LastEpisode
          </span>
        </Link>

        <div className="flex items-center gap-8 lg:gap-16 flex-1 ml-8 sm:ml-12">
          <div className="hidden md:flex items-center space-x-8">
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
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4 sm:space-x-8">
          {user && (
            <>
              <NotificationMenu />
              <div className="h-6 w-px bg-gray-800" />
            </>
          )}

          {user ? (
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-gray-400 hover:text-red-600 transition-all duration-300 flex gap-1 items-center font-bold uppercase text-xs tracking-widest"
            >
              <span>Logout</span>
              <LogOut className="cursor-pointer" size={18} />
            </button>
          ) : (
            <Link
              to="/login"
              className="relative px-6 py-2 group overflow-hidden rounded-full font-bold text-sm uppercase tracking-widest"
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
            <div className="px-6 py-10 flex flex-col space-y-8">
              <Link
                to="/search"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-cyber-teal transition-all font-bold uppercase tracking-[0.2em] flex items-center space-x-5 text-sm"
              >
                <div className="p-2 bg-white/5 rounded-lg">
                  <Search size={20} />
                </div>
                <span>Discover</span>
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-cyber-teal transition-all font-bold uppercase tracking-[0.2em] flex items-center space-x-5 text-sm"
                >
                  <div className="p-2 bg-white/5 rounded-lg">
                    <User size={20} />
                  </div>
                  <span>Library</span>
                </Link>
              )}
              <div className="h-px bg-white/5 w-full" />
              {user ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="text-gray-400 hover:text-red-500 transition-all font-bold uppercase tracking-[0.2em] flex items-center space-x-5 justify-start text-left w-full text-sm"
                >
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                    <LogOut size={20} />
                  </div>
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="bg-cyber-teal text-cyber-black uppercase font-black text-center py-5 rounded-2xl tracking-[0.2em] mt-4 shadow-lg shadow-cyber-teal/20 text-xs"
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
