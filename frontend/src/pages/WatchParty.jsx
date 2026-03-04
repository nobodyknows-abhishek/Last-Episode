import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Users,
  MessageSquare,
  Send,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ReactPlayer from "react-player";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const WatchParty = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Location state (from AnimeDetails)
  const [animeTitle, setAnimeTitle] = useState(
    location.state?.animeTitle || "Watch Party",
  );
  const [episodeNum, setEpisodeNum] = useState(
    location.state?.episodeNum || null,
  );

  const [socket, setSocket] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(
    location.state?.videoUrl || "",
  );
  const [videoInput, setVideoInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'users'
  const [copied, setCopied] = useState(false);

  // Initialize from location state if available
  useEffect(() => {
    if (location.state) {
      if (location.state.animeTitle) setAnimeTitle(location.state.animeTitle);
      if (location.state.episodeNum) setEpisodeNum(location.state.episodeNum);
      if (location.state.videoUrl) {
        setCurrentVideo(location.state.videoUrl);
        setVideoInput(location.state.videoUrl);
      }
    }
  }, [location.state]);

  // Player state

  const videoRef = useRef(null);
  const chatScrollRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTimePlayed, setCurrentTimePlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playerError, setPlayerError] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Prevent multiple seeks loops
  const isSeekingRef = useRef(false);
  const ignoreNextEventRef = useRef(false);
  // Add graceful period after video change to ignore auto-pauses
  const changingVideoRef = useRef(false);

  // 1. Socket Connection and Setup
  useEffect(() => {
    if (loading) return; // Wait until auth state is resolved

    if (!user) {
      navigate("/login", { state: { returnTo: `/watch/${roomId}` } });
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
      newSocket.emit("join_room", {
        roomId,
        user: { id: user._id, name: user.name },
      });
    });

    newSocket.on("room_state", (state) => {
      setRoomUsers(state.users);
      setIsHost(state.isHost);
      setCurrentVideo(state.currentVideo || "");
      if (state.currentVideo) setVideoInput(state.currentVideo);
    });

    newSocket.on("update_users", (users) => {
      setRoomUsers(users);
    });

    newSocket.on("new_host", (newHostId) => {
      if (newSocket.id === newHostId) {
        setIsHost(true);
      }
    });

    newSocket.on("video_changed", (url) => {
      console.log("video_changed event received:", url);
      changingVideoRef.current = true;
      // Stop to prevent lingering state
      setIsPlaying(false);

      setCurrentVideo(url);
      setVideoInput(url);
      // We rely on ReactPlayer.onReady to restart playback for the host
    });

    newSocket.on("video_action", ({ action, time }) => {
      if (isHost) return; // Host controls others, not vice versa

      const video = videoRef.current;
      if (!video) return;

      ignoreNextEventRef.current = true; // Prevent echo back to server

      // Apply the time strictly if it's off by >1s
      if (
        time !== undefined &&
        typeof video.getCurrentTime === "function" &&
        Math.abs(video.getCurrentTime() - time) > 1
      ) {
        if (typeof video.seekTo === "function") video.seekTo(time, "seconds");
      }

      if (action === "play") {
        setIsPlaying(true);
      } else if (action === "pause") {
        setIsPlaying(false);
      } else if (action === "seek") {
        // Time already set above
      }
    });

    newSocket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => newSocket.disconnect();
  }, [roomId, user, loading, navigate]);

  // 2. Chat Scroll Auto-Bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // 3. Handlers
  const handleHostSetVideo = (e) => {
    e.preventDefault();
    if (!isHost || !videoInput) return;
    const url = videoInput.trim();
    console.log("Host loading video, emitting set_video:", url);

    if (
      url.includes("hianime.vc") ||
      url.includes("crunchyroll.com") ||
      url.includes("netflix.com") ||
      url.includes("aniwatch.to")
    ) {
      setPlayerError(true);
      return;
    }

    // Stop playing, clear current URL to force a clean remount on the new one
    setIsPlaying(false);
    changingVideoRef.current = true;
    setPlayerError(false);

    socket?.emit("set_video", { roomId, videoUrl: url });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit("send_message", {
      roomId,
      message: newMessage,
      user: user.name,
    });
    setNewMessage("");
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 4. Video Event Handlers (HOST ONLY broadcasts)
  const emitAction = (action) => {
    if (
      isHost &&
      socket &&
      videoRef.current &&
      typeof videoRef.current.getCurrentTime === "function"
    ) {
      socket.emit("video_action", {
        roomId,
        action,
        time: videoRef.current.getCurrentTime(),
      });
    }
  };

  const onPlay = () => {
    // If we successfully play, clear the changingVideo flag so manual pauses work
    changingVideoRef.current = false;

    if (ignoreNextEventRef.current) {
      ignoreNextEventRef.current = false;
      return;
    }
    if (!isHost) {
      // Force non-hosts to wait for host signal (delay to avoid play/pause race)
      setTimeout(() => setIsPlaying(false), 50);
      return;
    }
    setIsPlaying(true);
    emitAction("play");
  };

  const onPause = () => {
    console.log(
      "onPause triggered. isHost:",
      isHost,
      "ignoreNext:",
      ignoreNextEventRef.current,
      "changingVideo:",
      changingVideoRef.current,
    );
    if (ignoreNextEventRef.current) {
      ignoreNextEventRef.current = false;
      return;
    }
    // Ignore pause events during video change to prevent autoplay interruption
    if (changingVideoRef.current) {
      console.log("Ignored auto-pause during load.");
      return;
    }

    if (!isHost) {
      // Resist pausing but delay slightly to avoid causing play() AbortError
      setTimeout(() => setIsPlaying(true), 50);
      return;
    }
    setIsPlaying(false);
    emitAction("pause");
  };

  const onSeeked = () => {
    if (ignoreNextEventRef.current) {
      ignoreNextEventRef.current = false;
      return;
    }
    if (isHost) {
      emitAction("seek");
    }
  };

  const togglePlay = () => {
    // We now rely primarily on native player controls for interaction.
    // This function can remain as a fallback or for custom UI triggers.
    if (!isHost) return;
    setIsPlaying(!isPlaying);
  };

  // Attach native 'seeked' listener to internal player to avoid passing
  // `onSeek` prop through to DOM (React warns about unknown event props).
  useEffect(() => {
    const player = videoRef.current;
    if (!player || typeof player.getInternalPlayer !== "function") return;

    // Try to get internal player (file player returns HTMLMediaElement)
    let internal;
    try {
      internal = player.getInternalPlayer("file") || player.getInternalPlayer();
    } catch (err) {
      // ignore
    }

    if (!internal || typeof internal.addEventListener !== "function") return;

    const onSeekedNative = () => {
      if (ignoreNextEventRef.current) {
        ignoreNextEventRef.current = false;
        return;
      }
      if (isHost) emitAction("seek");
    };

    internal.addEventListener("seeked", onSeekedNative);
    return () => internal.removeEventListener("seeked", onSeekedNative);
  }, [currentVideo, isHost, socket]);

  // 5. Video Progress UI
  const formatTime = (timeInSeconds) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  const handleTimeUpdate = (state) => {
    if (videoRef.current && !isSeekingRef.current) {
      // state.played is a fraction from 0 to 1
      setProgress(state.played * 100 || 0);
      setCurrentTimePlayed(state.playedSeconds || 0);
    }
  };

  const handleProgressScrub = (e) => {
    if (!isHost || !videoRef.current) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const scrubFraction = (e.clientX - rect.left) / rect.width;

    // Check if seekTo exists in current player ref (sometimes internal player isn't ready)
    if (typeof videoRef.current.seekTo === "function") {
      videoRef.current.seekTo(scrubFraction, "fraction");
      setProgress(scrubFraction * 100);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const toggleFullscreen = () => {
    const playerContainer = document.getElementById("player-container");
    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cyber-black pt-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-cyber-teal border-t-transparent rounded-full mb-4"
        />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Joining Room...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black text-white pt-20 px-6 pb-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-widest text-cyber-teal">
              {animeTitle} {episodeNum ? `- EP ${episodeNum}` : ""}
            </h1>
            <p className="text-sm font-bold text-gray-400">
              {isHost ? "You are the Host" : "Waiting for Host..."}
            </p>
          </div>
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest"
          >
            {copied ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} />
            )}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>
        </div>

        {/* Video Player */}
        <div
          id="player-container"
          className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl shadow-cyber-teal/10 border border-white/10 group"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
        >
          {currentVideo ? (
            <ReactPlayer
              ref={videoRef}
              key={currentVideo} // Force remount on video change to ensure clean state
              url={currentVideo}
              className="react-player absolute inset-0"
              width="100%"
              height="100%"
              playing={isPlaying}
              controls={false} // Custom controls only
              volume={isMuted ? 0 : volume}
              muted={isMuted}
              onProgress={handleTimeUpdate}
              onReady={() => {
                console.log("Player ready");
                // Try getting duration safely
                try {
                  const dur = videoRef.current?.getDuration?.();
                  if (typeof dur === "number" && dur > 0) setDuration(dur);
                } catch (err) {
                  // ignore
                }

                // If Host just prioritized a video change, start playback now that player is ready
                // We use a slight delay to ensure the DOM is painted and browser is happy
                // REMOVED AUTO PLAY to force user interaction and avoid "not playing" black screens
                /*
                if (isHost) {
                   setTimeout(() => {
                      setIsPlaying(true);
                   }, 100);
                }
                */
              }}
              onStart={() => {
                console.log("Player started playing");
                // Successful start - allow interactions again
                changingVideoRef.current = false;
                setPlayerError(false);
              }}
              onError={(e) => {
                console.error("ReactPlayer error:", e);
                setPlayerError(true);
              }}
              onPlay={onPlay}
              onPause={onPause}
              // onSeek not passed to avoid unknown prop warning
              config={{
                youtube: {
                  playerVars: {
                    disablekb: 1,
                    rel: 0,
                    controls: 0, // Hide YT controls
                    modestbranding: 1,
                    origin: window.location.origin,
                    fs: 0, // Hide fullscreen button
                    iv_load_policy: 3, // Hide annotations
                    autoplay: 1,
                    playsinline: 1,
                  },
                },
                file: {
                  attributes: {
                    crossOrigin: "anonymous",
                    playsInline: true,
                  },
                },
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50">
              <Play size={64} className="text-white/20 mb-4" />
              <p className="font-bold text-gray-500 uppercase tracking-widest">
                No Video Loaded
              </p>
            </div>
          )}

          {playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 p-6 text-center">
              <p className="text-red-500 font-bold mb-2">
                Unavailable Video Source
              </p>
              <p className="text-gray-400 text-sm max-w-md">
                The player cannot stream this URL directly. This typically
                happens when using webpage URLs instead of direct video links.
              </p>
              <p className="text-cyber-teal text-xs mt-4">
                Supported: YouTube, Vimeo, direct .mp4/.m3u8 files
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Not Supported: hianime.vc, crunchyroll.com (webpages)
              </p>
            </div>
          )}

          {/* Player UI Overlay */}
          <AnimatePresence>
            {showControls && currentVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"
              >
                {/* Center Giant Play/Pause Indicator (Interactive) */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-auto"
                  >
                    <div className="w-24 h-24 bg-cyber-teal/90 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.4)] backdrop-blur-md hover:scale-110 transition-transform">
                      <Play
                        size={40}
                        className="text-cyber-black ml-2"
                        fill="currentColor"
                      />
                    </div>
                  </div>
                )}

                <div className="p-6 pointer-events-auto">
                  {/* Progress Bar */}
                  <div
                    className="w-full h-1.5 bg-white/20 rounded-full mb-6 relative cursor-pointer hover:h-2 transition-all group/progress"
                    onClick={handleProgressScrub}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-cyber-teal rounded-full"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={togglePlay}
                        disabled={!isHost}
                        className={`text-white hover:text-cyber-teal transition-colors ${!isHost && "opacity-50 cursor-not-allowed"}`}
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </button>

                      <div className="flex items-center gap-3 group/volume">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="text-white hover:text-cyber-teal transition-colors"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX size={20} />
                          ) : (
                            <Volume2 size={20} />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setVolume(val);
                            if (val > 0) setIsMuted(false);
                          }}
                          className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 accent-cyber-teal bg-transparent"
                        />
                      </div>

                      <span className="text-xs font-bold text-gray-300 font-mono">
                        {formatTime(currentTimePlayed)} /{" "}
                        {formatTime(duration || 0)}
                      </span>
                    </div>

                    <button
                      onClick={toggleFullscreen}
                      className="text-white hover:text-cyber-teal transition-colors"
                    >
                      <Maximize size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Host Video Input */}
        {isHost && (
          <form
            onSubmit={handleHostSetVideo}
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <div className="flex-1 relative">
              <LinkIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Paste YouTube, Vimeo, Twitch, .mp4 Link..."
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyber-teal"
              />
            </div>
            <button
              type="submit"
              className="bg-cyber-teal text-cyber-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm"
            >
              Load
            </button>
          </form>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-96 flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden h-[80vh]">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${
              activeTab === "chat"
                ? "bg-white/10 text-cyber-teal"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare size={16} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${
              activeTab === "users"
                ? "bg-white/10 text-cyber-amber"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users size={16} />
            Users ({roomUsers.length})
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 custom-scrollbar"
          ref={chatScrollRef}
        >
          {activeTab === "chat" ? (
            <div className="flex flex-col gap-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 text-sm mt-10">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 mb-1">
                      {msg.user}
                    </span>
                    <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 text-sm max-w-[85%]">
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {roomUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-teal to-cyber-amber flex items-center justify-center text-cyber-black font-black flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold flex-1 truncate">{u.name}</span>
                  {u.id === user._id && (
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400 uppercase">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {activeTab === "chat" && (
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-white/10 flex gap-2"
          >
            <input
              type="text"
              placeholder="Type message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyber-teal text-white"
            />
            <button
              type="submit"
              className="w-10 h-10 bg-cyber-teal rounded-xl flex items-center justify-center text-cyber-black flex-shrink-0 hover:bg-cyber-amber transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WatchParty;
