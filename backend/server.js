const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // Join room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  // Send drawing elements
  socket.on("send-elements", (data) => {
    socket.to(data.roomId).emit("receive-elements", data.elements);
  });

  // Clear canvas
  socket.on("clear-canvas", (roomId) => {
    socket.to(roomId).emit("clear-canvas");
  });

  // ✅ LIVE CURSOR MOVE
  socket.on("cursor-move", (data) => {
    socket.to(data.roomId).emit("cursor-move", {
      socketId: socket.id,
      x: data.x,
      y: data.y,
      name: data.name,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);

    // Notify others to remove cursor
    socket.broadcast.emit("user-disconnected", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
