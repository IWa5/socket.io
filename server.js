// server.js
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);

// Only allow your InfinityFree frontend to connect
const io = new Server(httpServer, {
  cors: {
    origin: "https://justathing.ct.ws",
    methods: ["GET", "POST"]
  }
});

// Use Render's PORT or 3000 locally
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// In-memory tracking of which socket is in which room, and their username
const rooms = {};
const usernames = {};

io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  // Handle join: expect an object { username, room }
  socket.on("join", ({ username, room }) => {
    console.log("JOIN EVENT:", { socket: socket.id, username, room });

    if (!username || !room) return;      // both required
    rooms[socket.id] = room;             // remember their room
    usernames[socket.id] = username;     // remember their name

    socket.leaveAll();
    socket.join(room);

    // Notify everyone in room
    io.to(room).emit(
      "recieve",
      `Server: ${username} has entered the chat! (ﾉ◕ヮ◕)ﾉ*.✧`
    );
  });

  // Handle chat messages
  socket.on("chatMessage", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];

    if (!room || !username) return;

    // Special rules for Server_Updates room
    if (room === "Server_Updates" && username !== "Server") {
      return socket.emit(
        "recieve",
        "Server: Only users with the valid privileges can send messages in the Server_Updates room"
      );
    }

    if (room === "Server_Updates") {
      const [pin, ...rest] = message.split(" ");
      if (pin !== "1024") {
        return socket.emit(
          "recieve",
          "Server: Invalid PIN. Please enter the correct PIN followed by your message (e.g., '1024 your message')"
        );
      }
      message = rest.join(" ");
    }

    // Broadcast to the room
    io.to(room).emit("recieve", `${username}: ${message}`);
  });

  // Clean up on disconnect
  socket.on("disconnect", () => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];

    if (room && username) {
      io.to(room).emit("recieve", `Server: ${username} has left the chat.`);
    }

    delete rooms[socket.id];
    delete usernames[socket.id];
    console.log("❌ A user disconnected:", socket.id);
  });
});
