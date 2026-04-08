import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import {
  Users,
  MessageSquare,
  Send,
  Copy,
  Check,
  Monitor,
  VideoOff,
  Smile,
  Search,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const WatchParty = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Location state
  const [animeTitle] = useState(location.state?.animeTitle || "Watch Party");
  const [episodeNum] = useState(location.state?.episodeNum || null);

  const [socket, setSocket] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const roomUsersRef = useRef([]); // Access latest users in socket events

  useEffect(() => {
    roomUsersRef.current = roomUsers;
  }, [roomUsers]);

  const [activeStreams, setActiveStreams] = useState([]); // List of socketIds
  const [messages, setMessages] = useState(() => {
    try {
      if (!roomId) return [];
      const saved = sessionStorage.getItem(`chat_${roomId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save messages to session storage
  useEffect(() => {
    if (roomId) {
      sessionStorage.setItem(`chat_${roomId}`, JSON.stringify(messages));
    }
  }, [messages, roomId]);

  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [copied, setCopied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const [remoteStreams, setRemoteStreams] = useState(new Map()); // socketId -> MediaStream
  const [isSharing, setIsSharing] = useState(false);
  const localStreamRef = useRef(null);

  // Voice chat state
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState(new Set()); // socketIds of users with mic on
  
  // Device Selection
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");

  const localVoiceStreamRef = useRef(null);
  const voiceOutgoingPeersRef = useRef({});
  const voiceIncomingPeersRef = useRef({});
  const remoteAudioStreams = useRef(new Map()); // socketId -> MediaStream (audio)

  // Connection Refs
  // outgoing: I called them (I am sharing)
  // incoming: They called me (They are sharing)
  const outgoingPeersRef = useRef({});
  const incomingPeersRef = useRef({});

  const chatScrollRef = useRef(null);
  const textareaRef = useRef(null);

  const [gifs, setGifs] = useState([]);
  const [gifQuery, setGifQuery] = useState("");

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const fetchGifs = async () => {
    try {
      const apiKey = "LIVDSRZULELA";
      const url = gifQuery
        ? `https://g.tenor.com/v1/search?q=${gifQuery}&key=${apiKey}&limit=20`
        : `https://g.tenor.com/v1/trending?key=${apiKey}&limit=20`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        // Prefer mediumgif or gif over tinygif for better visibility/quality
        setGifs(
          data.results.map(
            (r) =>
              r.media[0].mediumgif?.url ||
              r.media[0].gif?.url ||
              r.media[0].tinygif?.url,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to fetch GIFs", e);
    }
  };

  useEffect(() => {
    if (showGifPicker) {
      fetchGifs();
    }
  }, [showGifPicker, gifQuery]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // ─── Voice Chat WebRTC Helpers ────────────────────────────────────────────

  const handleVoiceCallUser = async (targetId, stream, socketInstance) => {
    // Prevent leak: close existing outgoing peer
    if (voiceOutgoingPeersRef.current[targetId]) {
      voiceOutgoingPeersRef.current[targetId].close();
      delete voiceOutgoingPeersRef.current[targetId];
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketInstance.emit("voice_ice", {
          target: targetId,
          candidate: e.candidate,
          sender: socketInstance.id,
        });
      }
    };

    voiceOutgoingPeersRef.current[targetId] = peer;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketInstance.emit("voice_offer", {
      target: targetId,
      sdp: offer,
      sender: socketInstance.id,
    });
  };

  const handleVoiceReceiveOffer = async (payload, socketInstance) => {
    // Prevent leak: close existing incoming peer
    if (voiceIncomingPeersRef.current[payload.sender]) {
      voiceIncomingPeersRef.current[payload.sender].close();
      delete voiceIncomingPeersRef.current[payload.sender];
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketInstance.emit("voice_ice", {
          target: payload.sender,
          candidate: e.candidate,
          sender: socketInstance.id,
        });
      }
    };

    peer.ontrack = (e) => {
      const stream = e.streams[0];
      remoteAudioStreams.current.set(payload.sender, stream);
      // Attach to hidden audio element
      const audioEl = document.getElementById(`voice-audio-${payload.sender}`);
      if (audioEl) audioEl.srcObject = stream;
      setSpeakingUsers((prev) => new Set([...prev, payload.sender]));
    };

    voiceIncomingPeersRef.current[payload.sender] = peer;
    await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socketInstance.emit("voice_answer", {
      target: payload.sender,
      sdp: answer,
      sender: socketInstance.id,
    });
  };

  // ─── Screen Share WebRTC Helpers ──────────────────────────────────────────

  // Helper functions
  const handleCallUser = async (targetId, stream, socketInstance) => {
    // console.log(`Calling ${targetId} with stream`);
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketInstance.emit("ice-candidate", {
          target: targetId,
          candidate: e.candidate,
          sender: socketInstance.id,
          type: "offer_candidate", // Differentiate candidacy
        });
      }
    };

    outgoingPeersRef.current[targetId] = peer;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socketInstance.emit("offer", {
      target: targetId,
      sdp: offer,
      sender: socketInstance.id,
    });
  };

  const handleReceiveOffer = async (payload, socketInstance) => {
    // console.log(`Received offer from ${payload.sender}`);
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketInstance.emit("ice-candidate", {
          target: payload.sender,
          candidate: e.candidate,
          sender: socketInstance.id,
          type: "answer_candidate",
        });
      }
    };

    peer.ontrack = (e) => {
      // console.log("Received track from", payload.sender);
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.set(payload.sender, e.streams[0]);
        return newMap;
      });
    };

    incomingPeersRef.current[payload.sender] = peer;

    await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socketInstance.emit("answer", {
      target: payload.sender,
      sdp: answer,
      sender: socketInstance.id,
    });
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { state: { returnTo: `/watch/${roomId}` } });
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
      newSocket.emit("join_room", { roomId, user });
    });

    newSocket.on("room_state", (state) => {
      setRoomUsers(state.users);
      setActiveStreams(state.streams || []);
    });

    newSocket.on("update_users", (users) => {
      setRoomUsers(users);
    });

    newSocket.on("update_streams", (streams) => {
      setActiveStreams(streams);
    });

    // ─── Voice Signaling ───────────────────────────────────────────────────
    newSocket.on("voice_offer", (payload) =>
      handleVoiceReceiveOffer(payload, newSocket),
    );

    newSocket.on("voice_answer", async (payload) => {
      const peer = voiceOutgoingPeersRef.current[payload.sender];
      if (peer)
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    newSocket.on("voice_ice", async (payload) => {
      const peer =
        voiceIncomingPeersRef.current[payload.sender] ||
        voiceOutgoingPeersRef.current[payload.sender];
      if (peer && payload.candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("Voice ICE error", e);
        }
      }
    });

    newSocket.on("voice_user_joined", (socketId) => {
      // Someone turned on their mic — call them with our voice stream if we're on
      if (localVoiceStreamRef.current) {
        handleVoiceCallUser(socketId, localVoiceStreamRef.current, newSocket);
      }
      setSpeakingUsers((prev) => new Set([...prev, socketId]));
    });

    newSocket.on("voice_user_left", (socketId) => {
      if (voiceOutgoingPeersRef.current[socketId]) {
        voiceOutgoingPeersRef.current[socketId].close();
        delete voiceOutgoingPeersRef.current[socketId];
      }
      if (voiceIncomingPeersRef.current[socketId]) {
        voiceIncomingPeersRef.current[socketId].close();
        delete voiceIncomingPeersRef.current[socketId];
      }
      remoteAudioStreams.current.delete(socketId);
      setSpeakingUsers((prev) => {
        const next = new Set(prev);
        next.delete(socketId);
        return next;
      });
    });

    // Stream Signaling
    newSocket.on("stream_started", (userId) => {
      console.log("Stream started by:", userId);
      if (userId === newSocket.id) {
        // Trigger calls to existing users
        // Note: using roomUsersRef to avoid stale closure if useEffect doesn't re-run
        const usersToCall = roomUsersRef.current;
        if (localStreamRef.current) {
          usersToCall.forEach((u) => {
            // Don't call myself
            if (u.socketId !== newSocket.id) {
              handleCallUser(u.socketId, localStreamRef.current, newSocket);
            }
          });
        }
      }
    });

    newSocket.on("stream_stopped", (userId) => {
      if (userId === newSocket.id) {
        stopLocalCapture();
      } else {
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        if (incomingPeersRef.current[userId]) {
          incomingPeersRef.current[userId].close();
          delete incomingPeersRef.current[userId];
        }
      }
    });

    newSocket.on("stream_error", (msg) => {
      alert(msg);
      stopLocalCapture(); // Ensure we stop if server rejects
    });

    newSocket.on("offer", (payload) => handleReceiveOffer(payload, newSocket));

    newSocket.on("answer", async (payload) => {
      const peer = outgoingPeersRef.current[payload.sender];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      }
    });

    newSocket.on("ice-candidate", async (payload) => {
      let peer =
        incomingPeersRef.current[payload.sender] ||
        outgoingPeersRef.current[payload.sender];
      if (peer && payload.candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("ICE error", e);
        }
      }
    });

    newSocket.on("user_joined", (newUser) => {
      if (localStreamRef.current) {
        handleCallUser(newUser.socketId, localStreamRef.current, newSocket);
      }
      // Also call with voice if mic is on
      if (localVoiceStreamRef.current) {
        handleVoiceCallUser(
          newUser.socketId,
          localVoiceStreamRef.current,
          newSocket,
        );
      }
    });

    newSocket.on("user_left", (leftUser) => {
      if (outgoingPeersRef.current[leftUser.socketId]) {
        outgoingPeersRef.current[leftUser.socketId].close();
        delete outgoingPeersRef.current[leftUser.socketId];
      }
      if (incomingPeersRef.current[leftUser.socketId]) {
        incomingPeersRef.current[leftUser.socketId].close();
        delete incomingPeersRef.current[leftUser.socketId];
      }
    });

    newSocket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      stopLocalCapture();
      stopVoice(newSocket);
      newSocket.disconnect();
    };
  }, [roomId, user, loading, navigate]);

  const requestStartStream = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        (!navigator.mediaDevices.getDisplayMedia &&
          !navigator.mediaDevices.getUserMedia)
      ) {
        alert("Your browser doesn't support media sharing.");
        return;
      }

      let stream;
      if (navigator.mediaDevices.getDisplayMedia) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 60 },
            },
            audio: true,
          });

          // Check if user forgot to tick "Share tab audio" box
          if (stream.getAudioTracks().length === 0) {
            alert(
              "⚠️ You are sharing your screen WITHOUT audio!\n\nMake sure to toggle the 'Also share tab audio' or 'Share system audio' switch in the browser's screen-share menu so others can hear the anime."
            );
          }
        } catch (e) {
          console.log(
            "getDisplayMedia failed, checking for getUserMedia fallback",
            e,
          );
          // If user cancelled or it's restricted, we might try camera on mobile
          if (window.innerWidth < 1024) {
            const confirmCamera = window.confirm(
              "Screen sharing might not be supported on your mobile device. Would you like to share your camera instead?",
            );
            if (confirmCamera) {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
      } else {
        // Fallback directly for platforms without getDisplayMedia
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      if (!stream) return;

      localStreamRef.current = stream;
      setIsSharing(true);

      stream.getVideoTracks()[0].onended = () => {
        requestStopStream();
      };

      if (socket) {
        socket.emit("start_stream", { roomId });
      }
    } catch (err) {
      console.error("Capture failed or cancelled", err);
      setIsSharing(false);
      if (err.name !== "NotAllowedError") {
        alert(
          "Failed to start sharing. Mobile devices often restrict screen sharing from browsers.",
        );
      }
    }
  };

  const requestStopStream = (socketInstance = socket) => {
    if (socketInstance) {
      socketInstance.emit("stop_stream", { roomId });
    }
    stopLocalCapture();
  };

  const stopLocalCapture = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setIsSharing(false);

    Object.keys(outgoingPeersRef.current).forEach((key) => {
      outgoingPeersRef.current[key].close();
      delete outgoingPeersRef.current[key];
    });
  };

  // ─── Voice Chat Functions ─────────────────────────────────────────────────

  // Enumerate Audio Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === "audioinput" && d.deviceId);
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Failed to enumerate devices:", err);
      }
    };
    getDevices();
    navigator.mediaDevices.addEventListener("devicechange", getDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", getDevices);
  }, [selectedAudioDevice]);

  // Prevent rapid double-clicks from spawning multiple getUserMedia instances
  const isMicLoadingRef = useRef(false);

  const toggleMic = async () => {
    if (!socket || isMicLoadingRef.current) return;

    // If mic is already on: mute/unmute toggle
    if (isMicOn) {
      setIsMuted((prevMuted) => {
        const nextMuted = !prevMuted;
        if (localVoiceStreamRef.current) {
          localVoiceStreamRef.current.getAudioTracks().forEach((t) => {
            t.enabled = !nextMuted;
          });
        }
        return nextMuted;
      });
      return;
    }

    isMicLoadingRef.current = true;

    // Turn mic ON
    try {
      // Remove aggressive DSP to eliminate filtering issues, but allow custom device selection
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
        video: false,
      });

      // Update names now that we have permissions
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((d) => d.kind === "audioinput" && d.deviceId));

      localVoiceStreamRef.current = stream;
      setIsMicOn(true);
      setIsMuted(false);

      // Notify the room that we turned on our mic (so others can call us)
      socket.emit("voice_join", { roomId, socketId: socket.id });

      // Call every user already in the room
      roomUsersRef.current.forEach((u) => {
        if (u.socketId !== socket.id) {
          handleVoiceCallUser(u.socketId, stream, socket);
        }
      });
    } catch (err) {
      console.error("Mic access failed:", err);
      alert(
        `Mic access error: ${err.message || err.name || "Unknown error"}. Check browser permissions.`,
      );
    } finally {
      isMicLoadingRef.current = false;
    }
  };

  const stopVoice = (socketInstance = socket) => {
    // Stop processed WebRTC tracks
    if (localVoiceStreamRef.current) {
      localVoiceStreamRef.current.getTracks().forEach((t) => t.stop());
      localVoiceStreamRef.current = null;
    }

    setIsMicOn(false);
    setIsMuted(false);

    // Close all voice peers
    Object.keys(voiceOutgoingPeersRef.current).forEach((key) => {
      voiceOutgoingPeersRef.current[key].close();
      delete voiceOutgoingPeersRef.current[key];
    });
    Object.keys(voiceIncomingPeersRef.current).forEach((key) => {
      voiceIncomingPeersRef.current[key].close();
      delete voiceIncomingPeersRef.current[key];
    });

    if (socketInstance) {
      socketInstance.emit("voice_leave", {
        roomId,
        socketId: socketInstance.id,
      });
    }
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    // Mute/unmute all remote audio elements instantly
    Array.from(speakingUsers).forEach((sid) => {
      const el = document.getElementById(`voice-audio-${sid}`);
      if (el) el.muted = newDeafened;
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const msgData = {
      roomId,
      user: { id: user._id, name: user.name },
      message: newMessage, // Correct field name for backend
      type: "text",
      timestamp: new Date().toISOString(),
    };

    socket.emit("send_message", msgData);
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const sendGif = (url) => {
    if (!socket) return;
    const msgData = {
      roomId,
      user: { id: user._id, name: user.name },
      message: url,
      type: "image",
      timestamp: new Date().toISOString(),
    };
    socket.emit("send_message", msgData);
    setShowGifPicker(false);
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    // Don't close picker automatically for better UX
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );

  // Render Streams
  // We need to render:
  // 1. My local stream (if sharing)
  // 2. Remote streams
  const streamKeys = Array.from(remoteStreams.keys());
  const totalStreams = streamKeys.length + (isSharing ? 1 : 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white transition-colors p-2"
          >
            ←
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-lg truncate">
              {animeTitle}
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 truncate">
              {episodeNum ? `EP ${episodeNum}` : "Room"} • {roomId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mic Selector */}
          {audioDevices.length > 0 && (
            <select
              className="bg-zinc-800 text-white text-[10px] sm:text-xs rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 max-w-[100px] sm:max-w-[150px] outline-none truncate"
              value={selectedAudioDevice}
              onChange={(e) => {
                setSelectedAudioDevice(e.target.value);
                if (isMicOn) {
                  stopVoice();
                  // Re-enable it seamlessly after a tiny delay
                  setTimeout(() => document.getElementById('watchparty-mic-btn')?.click(), 100);
                }
              }}
              title="Select Microphone"
            >
              {audioDevices.map((device, idx) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Mic Button */}
          <button
            id="watchparty-mic-btn"
            onClick={isMicOn ? toggleMic : toggleMic}
            onContextMenu={(e) => {
              e.preventDefault();
              if (isMicOn) stopVoice();
            }}
            title={
              isMicOn
                ? isMuted
                  ? "Unmute mic"
                  : "Mute mic (right-click to turn off)"
                : "Turn on mic"
            }
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-[10px] sm:text-sm transition-all ${
              !isMicOn
                ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                : isMuted
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30"
            }`}
          >
            {isMicOn && !isMuted ? <Mic size={16} /> : <MicOff size={16} />}
            <span className="hidden sm:inline">
              {!isMicOn ? "Mic" : isMuted ? "Unmute" : "Mute"}
            </span>
            {isMicOn && !isMuted && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* Deafen Button */}
          <button
            onClick={toggleDeafen}
            title={isDeafened ? "Undeafen" : "Deafen (mute all incoming audio)"}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-[10px] sm:text-sm transition-all ${
              isDeafened
                ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/30"
                : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
            }`}
          >
            <VolumeX size={16} />
            <span className="hidden sm:inline">
              {isDeafened ? "Undeafen" : "Deafen"}
            </span>
          </button>

          {!isSharing ? (
            <button
              onClick={requestStartStream}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-[10px] sm:text-sm transition-all shadow-lg shadow-purple-900/20"
            >
              <Monitor size={16} />
              <span className="hidden sm:inline">Share Screen</span>
            </button>
          ) : (
            <button
              onClick={() => requestStopStream(socket)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-[10px] sm:text-sm transition-all"
            >
              <VideoOff size={16} />
              <span className="hidden sm:inline">Stop Sharing</span>
            </button>
          )}

          <button
            onClick={copyRoomLink}
            className="flex items-center justify-center p-2 sm:p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Copy Link"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>

        {/* Hidden audio elements for remote voice streams */}
        {Array.from(speakingUsers).map((sid) => (
          <audio
            key={sid}
            id={`voice-audio-${sid}`}
            autoPlay
            playsInline
            muted={isDeafened}
            style={{ display: "none" }}
          />
        ))}
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Stream Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-4">
          {totalStreams > 0 ? (
            <div
              className={
                totalStreams >= 2
                  ? "w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 content-start overflow-y-auto"
                  : "w-full h-full flex items-center justify-center p-2 sm:p-0"
              }
            >
              {/* Local Stream Preview */}
              {isSharing && (
                <div
                  className={`relative ${totalStreams >= 2 ? "w-full aspect-video sm:h-full bg-zinc-900 rounded-xl overflow-hidden border border-purple-500/50" : "w-full h-fit flex items-center justify-center"}`}
                >
                  <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded text-[10px] select-none pointer-events-none border border-white/5">
                    You (Live)
                  </div>
                  <video
                    ref={(v) => {
                      if (v && localStreamRef.current)
                        v.srcObject = localStreamRef.current;
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Remote Streams */}
              {streamKeys.map((key) => {
                const userName =
                  roomUsers.find((u) => u.socketId === key)?.name || "User";
                return (
                  <div
                    key={key}
                    className={`relative ${totalStreams >= 2 ? "w-full aspect-video sm:h-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800" : "w-full h-fit flex items-center justify-center"}`}
                  >
                    <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded text-[10px] select-none pointer-events-none border border-white/5">
                      {userName}
                    </div>
                    <video
                      ref={(v) => {
                        if (v) v.srcObject = remoteStreams.get(key);
                      }}
                      autoPlay
                      playsInline
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-zinc-500">
              <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No Active Streams
                </h3>
                <p className="text-sm">
                  Click "Share Screen" to start streaming.
                </p>
                <p className="text-xs mt-2 text-zinc-600">
                  (Max 2 concurrent streams)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Collapsible/Tabs optimized for mobile */}
        <div
          className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-950 flex flex-col transition-all duration-300 ${activeTab === "none" ? "h-0 sm:h-auto" : "h-[60vh] sm:h-auto"}`}
        >
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === "chat"
                  ? "text-purple-400 border-b-2 border-purple-400 bg-white/5"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <MessageSquare size={16} /> Chat
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === "users"
                  ? "text-purple-400 border-b-2 border-purple-400 bg-white/5"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Users size={16} /> Users ({roomUsers.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === "chat" ? (
              <div className="flex flex-col gap-3 min-h-full justify-end">
                {messages.length === 0 && (
                  <div className="text-zinc-600 text-center my-auto py-10 text-sm">
                    No messages yet
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.user.id === user._id ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-300">
                        {msg.user.name}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg text-sm max-w-[90%] break-words whitespace-pre-wrap ${msg.user.id === user._id ? "bg-purple-600" : "bg-zinc-800"}`}
                    >
                      {msg.type === "image" ||
                      /\.(gif|jpe?g|png|webp)($|\?)/i.test(
                        msg.message || msg.text,
                      ) ? (
                        <img
                          src={msg.message || msg.text}
                          alt="Shared content"
                          className="rounded-lg w-full h-auto block mt-1"
                          loading="lazy"
                        />
                      ) : (
                        msg.message || msg.text
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatScrollRef} />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {roomUsers.map((u) => (
                  <div
                    key={u.socketId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
                      {u.name[0]}
                    </div>
                    <div className="text-sm flex flex-col">
                      <span className="flex items-center gap-1.5">
                        {u.name} {u.socketId === socket.id && "(You)"}
                        {speakingUsers.has(u.socketId) && (
                          <Volume2
                            size={12}
                            className="text-green-400 animate-pulse"
                          />
                        )}
                        {u.socketId === socket.id && isMicOn && isMuted && (
                          <MicOff size={12} className="text-yellow-400" />
                        )}
                      </span>
                      {activeStreams.includes(u.socketId) && (
                        <span className="text-red-400 text-[10px] flex items-center gap-1">
                          ● Live
                        </span>
                      )}
                      {speakingUsers.has(u.socketId) && (
                        <span className="text-green-400 text-[10px] flex items-center gap-1">
                          🎙 Voice
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeTab === "chat" && (
            <div className="p-3 sm:p-4 border-t border-white/10 bg-zinc-900/50 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 sm:right-4 mb-2 z-50 shadow-2xl">
                  <EmojiPicker
                    onEmojiClick={(data) => onEmojiClick(data)}
                    theme="dark"
                    skinTonesDisabled
                    searchDisabled={false}
                    width={
                      window.innerWidth < 640 ? window.innerWidth - 24 : 300
                    }
                    height={350}
                  />
                </div>
              )}
              {showGifPicker && (
                <div className="absolute bottom-full left-0 right-0 sm:left-4 sm:right-4 mb-2 bg-zinc-900 border border-zinc-700 rounded-t-xl sm:rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2 h-72">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Search Tenor..."
                      value={gifQuery}
                      onChange={(e) => setGifQuery(e.target.value)}
                      className="w-full bg-zinc-800 border-none rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 placeholder-zinc-600"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 custom-scrollbar p-1">
                    {gifs.map((gif, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendGif(gif)}
                        className="hover:opacity-80 transition-opacity rounded-lg overflow-hidden relative bg-zinc-800 h-24 w-full"
                      >
                        <img
                          src={gif}
                          alt="GIF"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowGifPicker(false);
                    }}
                    className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGifPicker(!showGifPicker);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <ImageIcon size={18} />
                  </button>
                </div>
                <form
                  onSubmit={sendMessage}
                  className="flex-1 flex gap-2 items-end"
                >
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder="Message..."
                    rows={1}
                    className="flex-1 bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 placeholder-zinc-600 resize-none custom-scrollbar"
                    style={{ minHeight: "38px", maxHeight: "100px" }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:grayscale flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchParty;
