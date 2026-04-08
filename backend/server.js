const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const animeRoutes = require("./routes/animeRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const initCronJobs = require("./cron/syncJob");

dotenv.config();

connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "https://the-last-episode.onrender.com",
  "https://the-last-episode.onrender.com/",
];

const app = express();
const server = http.createServer(app);

if (process.env.FRONTEND_URL) {
  const url = process.env.FRONTEND_URL.replace(/\/$/, "");
  allowedOrigins.push(url);
  allowedOrigins.push(`${url}/`);
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/anime", animeRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Keep track of rooms and their users
const rooms = new Map();

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", ({ roomId, user }) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Map(),
        streams: new Set(),
        currentVideo: "",
        host: socket.id,
      });
      console.log(`[Room: ${roomId}] Created by ${user.name} (${socket.id})`);
    }

    const room = rooms.get(roomId);

    // Store user with socket ID reference
    const socketUser = { ...user, socketId: socket.id };
    room.users.set(socket.id, socketUser);

    // If first user, make them host
    const isHost = room.host === socket.id;
    console.log(
      `[Room: ${roomId}] User joined: ${user.name} (${socket.id}). IsHost: ${isHost}. Current Host: ${room.host}`,
    );

    // Send the current room state to the newly joined user
    socket.emit("room_state", {
      users: Array.from(room.users.values()),
      streams: Array.from(room.streams),
      currentVideo: room.currentVideo,
      host: room.host,
      isHost,
    });

    // Notify others that a user joined
    socket.to(roomId).emit("user_joined", socketUser);

    // Broadcast updated user list
    io.to(roomId).emit("update_users", Array.from(room.users.values()));
  });

  socket.on("join_user_room", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`[Socket: ${socket.id}] Joined personal room: ${userId}`);
    }
  });

  // Voice Chat Signaling (relayed peer-to-peer, audio-only)
  socket.on("voice_join", ({ roomId, socketId }) => {
    // Broadcast to everyone else in the room so they know to connect voice
    socket.to(roomId).emit("voice_user_joined", socketId);
  });

  socket.on("voice_leave", ({ roomId, socketId }) => {
    socket.to(roomId).emit("voice_user_left", socketId);
  });

  socket.on("voice_offer", (payload) => {
    io.to(payload.target).emit("voice_offer", payload);
  });

  socket.on("voice_answer", (payload) => {
    io.to(payload.target).emit("voice_answer", payload);
  });

  socket.on("voice_ice", (payload) => {
    io.to(payload.target).emit("voice_ice", payload);
  });

  // WebRTC Signaling
  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (incoming) => {
    io.to(incoming.target).emit("ice-candidate", incoming);
  });

  // Stream Management
  socket.on("start_stream", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.streams.size >= 2) {
      socket.emit("stream_error", "Maximum of 2 streams allowed.");
      return;
    }

    room.streams.add(socket.id);
    io.to(roomId).emit("stream_started", socket.id);
    io.to(roomId).emit("update_streams", Array.from(room.streams));
  });

  socket.on("stop_stream", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.streams.delete(socket.id);
    io.to(roomId).emit("stream_stopped", socket.id);
    io.to(roomId).emit("update_streams", Array.from(room.streams));
  });

  socket.on("set_video", ({ roomId, videoUrl }) => {
    console.log(
      "set_video received from",
      socket.id,
      "for room",
      roomId,
      "url",
      videoUrl,
    );
    const room = rooms.get(roomId);
    if (room && room.host === socket.id) {
      room.currentVideo = videoUrl;
      io.to(roomId).emit("video_changed", videoUrl);
    } else {
      if (!room) console.log("set_video: room not found", roomId);
      else
        console.log(
          "set_video: socket is not host",
          socket.id,
          "host is",
          room.host,
        );
    }
  });

  socket.on("video_action", ({ roomId, action, time }) => {
    const room = rooms.get(roomId);
    if (room && room.host === socket.id) {
      // Broadcast play/pause/seek to everyone else in the room
      socket.to(roomId).emit("sync_action", { action, time });
    }
  });

  socket.on("send_message", ({ roomId, message, user }) => {
    io.to(roomId).emit("new_message", { message, user, timestamp: new Date() });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Check which rooms the user was in and remove them
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        room.users.delete(socket.id);

        if (room.streams.has(socket.id)) {
          room.streams.delete(socket.id);
          io.to(roomId).emit("stream_stopped", socket.id);
          io.to(roomId).emit("update_streams", Array.from(room.streams));
        }

        socket.to(roomId).emit("user_left", user);

        if (room.users.size === 0) {
          rooms.delete(roomId);
        } else if (room.host === socket.id) {
          // Assign new host if host left
          const newHostId = Array.from(room.users.keys())[0];
          room.host = newHostId;
          io.to(roomId).emit("new_host", newHostId);
        }

        io.to(roomId).emit("update_users", Array.from(room.users.values()));
      }
    }
  });
});

// Initialize CRON jobs with socket.io instance
initCronJobs(io);

const PORT = process.env.PORT || 5000;

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  throw err;
});

// Generic Error Handler
app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
