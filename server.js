const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

// Set up Socket.IO with CORS to allow only your frontend
const io = new Server(httpserver, {
  cors: {
    origin: "https://justathing.ct.ws",
    methods: ["GET", "POST"]
  }
});

// Use Render's dynamic port or fallback locally
const PORT = process.env.PORT || 3000;
httpserver.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Track room and username per socket
const rooms = {};
const usernames = {};

io.on("connection", (socket) => {
  console.log("🔌 A user connected");

  // Handle user joining a room
  socket.on("join", ({ room, username }) => {
    if (!room || !username) return;

    rooms[socket.id] = room;
    usernames[socket.id] = username;

    socket.leaveAll();
    socket.join(room);

    // Notify others in the room
    io.to(room).emit("recieve", `Server: ${username} has entered the chat! (ﾉ◕ヮ◕)ﾉ*.✧`);

    // Confirm room join (can be used by client)
    socket.emit("join", room);
  });

  // Handle chat messages
  socket.on("chatMessage", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];

    if (!room || !username) return;

    if (room === "Server_Updates" && username !== "Server") {
      socket.emit("recieve", "Server: Only users with the valid privileges can send messages in the Server_Updates room");
      return;
    }

    if (room === "Server_Updates") {
      const [pin, ...messageParts] = message.split(' ');
      if (pin !== "1024") {
        socket.emit("recieve", "Server: Invalid PIN. Please enter the correct PIN followed by your message (e.g., '1024 your message')");
        return;
      }
      message = messageParts.join(' ');
    }

    io.to(room).emit("recieve", `${username}: ${message}`);
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];

    if (room && username) {
      io.to(room).emit("recieve", `Server: ${username} has left the chat.`);
    }

    delete rooms[socket.id];
    delete usernames[socket.id];
  });
});
