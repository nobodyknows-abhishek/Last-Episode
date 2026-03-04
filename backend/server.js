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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(cors());

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
        currentVideo: "",
        host: socket.id,
      });
    }

    const room = rooms.get(roomId);
    room.users.set(socket.id, user);

    // If first user, make them host
    const isHost = room.host === socket.id;

    // Send the current room state to the newly joined user
    socket.emit("room_state", {
      users: Array.from(room.users.values()),
      currentVideo: room.currentVideo,
      host: room.host,
      isHost,
    });

    // Notify others that a user joined
    socket.to(roomId).emit("user_joined", user);

    // Broadcast updated user list
    io.to(roomId).emit("update_users", Array.from(room.users.values()));
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
