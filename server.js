const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://justathing.ct.ws", // your InfinityFree domain
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

const rooms = {};
const usernames = {};

io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  socket.on("join", ({ username, room }) => {
    if (!username || !room) return;

    usernames[socket.id] = username;
    rooms[socket.id] = room;

    socket.leaveAll();
    socket.join(room);

    io.to(room).emit(
      "recieve",
      `Server: ${username} has entered the chat! (ﾉ◕ヮ◕)ﾉ*.✧`
    );
  });

  socket.on("chatMessage", (message) => {
    const room = rooms[socket.id];
    const username = usernames[socket.id];
    if (!room || !username) return;

    // Special Server_Updates room restrictions
    if (room === "Server_Updates" && username !== "Server") {
      socket.emit(
        "recieve",
        "Server: Only 'Server' can send messages in Server_Updates"
      );
      return;
    }

    if (room === "Server_Updates") {
      const [pin, ...rest] = message.split(" ");
      if (pin !== "1024") {
        socket.emit(
          "recieve",
          "Server: Invalid PIN. Use: '1024 your message'"
        );
        return;
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
