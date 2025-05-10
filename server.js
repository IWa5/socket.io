const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const httpserver = http.Server(app);

// Allow connections from your InfinityFree frontend
const io = socketio(httpserver, {
  cors: {
    origin: "https://justathing.ct.ws",
    methods: ["GET", "POST"]
  }
});

// Use Render's dynamic port or fallback for local dev
const PORT = process.env.PORT || 3000;
httpserver.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let rooms = {};
let usernames = {};

io.on('connection', (socket) => {
  console.log("A user connected");

  socket.on("join", ({ room, username }) => {
    if (username && room) {
      rooms[socket.id] = room;
      usernames[socket.id] = username;
      socket.leaveAll();  // Ensure user leaves other rooms
      socket.join(room);
      io.to(room).emit("recieve", `Server: ${username} has entered the chat! (ﾉ◕ヮ◕)ﾉ*.✧`);
    }
  });

  socket.on("chatMessage", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];

    if (!room || !username) return;

    // Special check for Server_Updates room
    if (room === "Server_Updates" && username !== "Server") {
      socket.emit("recieve", "Server: Only users with the valid privileges can send messages in the Server_Updates room");
      return;
    }

    if (room === "Server_Updates") {
      const [pin, ...messageParts] = message.split(' ');
      if (pin !== "1024") {
        socket.emit("recieve", "Server: Invalid PIN. Please enter the correct PIN followed by your message (e.g., 'XXXX your message')");
        return;
      }
      message = messageParts.join(' ');
    }

    io.to(room).emit("recieve", `${username}: ${message}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    const room = rooms[socket.id];
    const username = usernames[socket.id];
    if (room && username) {
      io.to(room).emit("recieve", `Server: ${username} has left the chat.`);
    }
    delete rooms[socket.id];
    delete usernames[socket.id];
  });
});
