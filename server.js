const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const httpserver = http.Server(app);

// Enable CORS (adjust origin to your actual frontend domain for security)
const io = socketio(httpserver, {
  cors: {
    origin: "justathing.ct.ws", // e.g., replace with "https://yourfrontend.infinityfreeapp.com"
    methods: ["GET", "POST"]
  }
});

// Uptime monitor endpoint
app.get("/ping", (req, res) => {
  res.status(200).send("Server is awake! 🚀");
});

// Use Render's dynamic port, fallback for local
const PORT = process.env.PORT || 3000;
httpserver.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Room and username tracking
let rooms = {};
let usernames = {};

// Handle new connections
io.on('connection', (socket) => {

  // Join event
  socket.on("join", ({ room, username }) => {
    if (username && room) {
      rooms[socket.id] = room;
      usernames[socket.id] = username;

      socket.leaveAll();
      socket.join(room);

      io.in(room).emit("recieve", `Server: ${username} has entered the chat! (ﾉ◕ヮ◕)ﾉ*.✧`);
      socket.emit("join", room);
    }
  });

  // Message send event
  socket.on("send", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];

    if (!room || !username) return;

    // Server_Updates logic
    if (room === "Server_Updates" && username !== "Server") {
      const [pin, ...messageParts] = message.split(' ');
      if (pin !== "1024") {
        socket.emit("recieve", "Server: Invalid PIN. Use format 'XXXX your message'");
        return;
      }
      message = messageParts.join(' ');
    }

    io.in(room).emit("recieve", `${username}: ${message}`);
  });

  // Echo back (optional, could be removed)
  socket.on("recieve", (message) => {
    socket.emit("recieve", message);
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];
    if (room && username) {
      io.in(room).emit("recieve", `Server: ${username} has left the chat.`);
    }
    delete rooms[socket.id];
    delete usernames[socket.id];
  });
});
