import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

// Cinematic anime/cyber aesthetic showcase images
const showcaseImages = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2787&auto=format&fit=crop", // Abstract cyber / city
  "https://images.unsplash.com/photo-1618336753174-8e8308c7f09b?q=80&w=2787&auto=format&fit=crop", // Neon
  "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2940&auto=format&fit=crop", // Sci-fi vibe
];

// Reusable interactive input component
const InputField = ({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  isPassword,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      className={`relative rounded-2xl border transition-all duration-300 ${
        focused
          ? "border-cyber-teal bg-cyber-teal/5 shadow-[0_0_15px_rgba(45,212,191,0.15)]"
          : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-cyber-black/50"
      }`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Icon
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
          focused ? "text-cyber-teal" : "text-gray-400"
        }`}
        size={20}
      />
      <input
        type={
          isPassword && !showPassword
            ? "password"
            : type === "password"
              ? "text"
              : type
        }
        placeholder={placeholder}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full pl-12 pr-12 py-4 md:py-5 bg-transparent outline-none text-xs md:text-sm font-black tracking-widest uppercase dark:text-white"
        value={value}
        onChange={onChange}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyber-teal transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </motion.div>
  );
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Rotate images in the showcase panel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % showcaseImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-cyber-black overflow-hidden relative">
      {/* LEFT PANEL - CINEMATIC SHOWCASE (Hidden on lg < screens) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-black border-r border-white/5">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImgIndex}
            src={showcaseImages[currentImgIndex]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover grayscale-40"
            alt="Cinematic background sequence"
          />
        </AnimatePresence>

        {/* Cinematic Gradients & Overlays */}
        <div className="absolute inset-0 bg-linear-to-br from-cyber-black/90 via-transparent to-cyber-teal/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-linear-to-t from-cyber-black via-cyber-black/40 to-transparent" />

        {/* Brand/Logo Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center space-x-3 text-white"
        >
          <div className="w-12 h-12 bg-cyber-teal rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.4)]">
            <ShieldCheck size={28} className="text-cyber-black" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter uppercase drop-shadow-lg">
            Last<span className="text-cyber-teal">Episode</span>
          </span>
        </motion.div>

        {/* Messaging Area */}
        <div className="relative z-10 max-w-xl mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login-msg" : "reg-msg"}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center space-x-2 text-cyber-teal mb-4">
                <Sparkles size={16} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {isLogin
                    ? "Neural Link Established"
                    : "Awaiting Synchronization"}
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9] mb-6 drop-shadow-2xl">
                {isLogin ? "Track Your" : "Begin Your"}{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-cyber-teal to-cyber-amber">
                  Reality
                </span>
              </h1>
              <p className="text-gray-300 font-medium leading-[1.6] max-w-md text-lg">
                Synchronize your cross-dimensional media consumption. Access
                massive anime databases, stream in optimal quality, and manage
                your personal archives.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL - AUTHENTICATION FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile/Tablet Background Elements */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full bg-cyber-black/95 z-0" />
        <div className="lg:hidden absolute top-1/4 -left-20 w-96 h-96 bg-cyber-teal/10 rounded-full blur-[120px] animate-pulse-slow z-0" />
        <div className="lg:hidden absolute bottom-1/4 -right-20 w-96 h-96 bg-cyber-amber/10 rounded-full blur-[120px] animate-pulse-slow z-0" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center lg:text-left mb-10">
            <motion.div
              layout
              className="inline-flex p-4 rounded-3xl bg-cyber-teal/10 text-cyber-teal mb-6 border border-cyber-teal/20 lg:hidden shadow-[0_0_30px_rgba(45,212,191,0.2)]"
            >
              <ShieldCheck size={40} />
            </motion.div>
            <motion.h2
              layout
              className="text-3xl md:text-4xl font-black text-cyber-black dark:text-white uppercase italic tracking-tighter mb-3"
            >
              {isLogin ? "Episode Access" : "Create Identity"}
            </motion.h2>
            <motion.p
              layout
              className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs"
            >
              {isLogin
                ? "Enter your credentials to sync"
                : "Initialize a new arc"}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center shadow-lg shadow-red-500/5"
              >
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <InputField
                    icon={User}
                    type="text"
                    placeholder="CHOOSE ALIAS"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              icon={Mail}
              type="email"
              placeholder="EMAIL ADDRESS"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <InputField
              icon={Lock}
              type="password"
              placeholder="ACCESS CODE"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              isPassword={true}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-5 md:py-6 bg-cyber-teal text-cyber-black rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center space-x-3 transition-all shadow-[0_10px_30px_rgba(45,212,191,0.3)] relative overflow-hidden group border border-transparent hover:border-white/50 border-t-white/50"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">
                {loading ? "SYNCING DATA..." : "INITIATE ACCESS"}
              </span>
              <ArrowRight
                size={20}
                className={`relative z-10 transition-transform ${
                  loading ? "animate-pulse" : "group-hover:translate-x-2"
                }`}
              />
            </motion.button>
          </form>

          <div className="mt-12 text-center relative">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                or
              </span>
              <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
            </div>

            <button
              type="button"
              onClick={handleToggleMode}
              className="group inline-flex items-center justify-center rounded-full p-4 px-8 font-bold text-cyber-teal uppercase tracking-widest text-[10px] sm:text-xs hover:bg-cyber-teal/5 transition-colors border border-transparent hover:border-cyber-teal/30"
            >
              <span>
                {isLogin
                  ? "Require an identity? Create one."
                  : "Already synchronized? Access your episode."}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
