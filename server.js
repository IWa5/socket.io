const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

// CORS setup: allow only your InfinityFree domain
const io = new Server(httpserver, {
  cors: {
    origin: "https://justathing.ct.ws",
    methods: ["GET", "POST"]
  }
});

// Use Render's dynamic port or local fallback
const PORT = process.env.PORT || 3000;
httpserver.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Store rooms and usernames per socket
const rooms = {};
const usernames = {};

io.on("connection", (socket) => {
  console.log("🔌 A user connected");

  socket.on("join", ({ room, username }) => {
    if (!room || !username) return;

    // Store user info
    rooms[socket.id] = room;
    usernames[socket.id] = username;

    // Join the room
    socket.join(room);
    io.to(room).emit("recieve", `🔔 ${username} has joined ${room}`);
  });

  socket.on("chatMessage", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];
    if (!room || !username) return;

    // Server_Updates restriction
    if (room === "Server_Updates" && username !== "Server") {
      return socket.emit("recieve", "❌ Only Users with valid privlages can send messages in Server_Updates.");
    }

    // Handle PIN-protected message
    if (room === "Server_Updates") {
      const [pin, ...rest] = message.split(" ");
      if (pin !== "1024") {
        return socket.emit("recieve", "🔒 Invalid PIN. Use: `PIN your message`.");
      }
      message = rest.join(" ");
    }

    io.to(room).emit("recieve", `${username}: ${message}`);
  });

