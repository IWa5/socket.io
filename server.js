const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

// Correct CORS setup
const io = new Server(httpserver, {
  cors: {
    origin: "https://justathing.ct.ws",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
httpserver.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Room and username tracking
const rooms = {};
const usernames = {};

io.on("connection", (socket) => {
  console.log("🔌 A user connected");

  socket.on("join", ({ room, username }) => {
    console.log("JOIN EVENT:", { room, username }); // 🧪 TEST LINE

    if (!room || !username) return;

    rooms[socket.id] = room;
    usernames[socket.id] = username;

    socket.leaveAll();
    socket.join(room);

    io.to(room).emit("recieve", `Server: ${username} has entered the chat! (ﾉ◕ヮ◕)ﾉ*.✧`);
    socket.emit("join", room);
  });

  socket.on("chatMessage", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];
    if (!room || !username) return;

    if (room === "Server_Updates" && username !== "Server") {
      return socket.emit("recieve", "❌ Only Server can send messages in Server_Updates.");
    }

    if (room === "Server_Updates") {
      const [pin, ...rest] = message.split(" ");
      if (pin !== "1024") {
        return socket.emit("recieve", "🔒 Invalid PIN. Use: `1024 your message`.");
      }
      message = rest.join(" ");
    }

    io.to(room).emit("recieve", `${username}: ${message}`);
  });

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
