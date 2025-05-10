const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const httpserver = http.Server(app);

// Enable CORS to allow connections from InfinityFree (or any origin for now)
const io = socketio(httpserver, {
  cors: {
    origin: "*", // Replace with your InfinityFree domain for security
    methods: ["GET", "POST"]
  }
});

// Use Render's dynamic port, fallback to 3000 for local development
const PORT = process.env.PORT || 3000;
httpserver.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let rooms = [];
let usernames = [];

io.on('connection', (socket) => {

  socket.on("join", (room, username) => {
    if (username !== "") {
      rooms[socket.id] = room;
      usernames[socket.id] = username;
      socket.leaveAll();
      socket.join(room);
      io.in(room).emit("recieve", `Server: ${username} has entered the chat! (ﾉ◕ヮ◕)ﾉ*.✧`);
      socket.emit("join", room);
    }
  });

  socket.on("send", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];

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

    io.in(room).emit("recieve", `${username} : ${message}`);
  });

  socket.on("recieve", (message) => {
    socket.emit("recieve", message);
  });
});
const io = require("socket.io")(server, {
  cors: {
    origin: "https://justathing.ct.ws",
    methods: ["GET", "POST"]
  }
});
