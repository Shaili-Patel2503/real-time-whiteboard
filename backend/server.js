require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());

const server = http.createServer(app);

/* ✅ IMPORTANT: Allow production frontend */
const io = new Server(server, {
  cors: {
    origin: "*", // we will restrict later after Vercel deploy
    methods: ["GET", "POST"],
  },
});

/* ------------------ OPENAI SETUP ------------------ */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ------------------ ROOMS STORAGE ------------------ */
const rooms = {};

/* ------------------ SOCKET CONNECTION ------------------ */
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  /* JOIN ROOM */
  socket.on("join-room", ({ roomId, name, color }) => {
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];

    rooms[roomId].push({
      socketId: socket.id,
      name,
      color,
    });

    io.to(roomId).emit("users-update", rooms[roomId]);
  });

  /* DRAWING */
  socket.on("send-elements", (data) => {
    socket.to(data.roomId).emit("receive-elements", data.elements);
  });

  /* CURSOR */
  socket.on("cursor-move", (data) => {
    socket.to(data.roomId).emit("cursor-move", {
      socketId: socket.id,
      x: data.x,
      y: data.y,
      name: data.name,
      color: data.color,
    });
  });

  /* CHAT + AI */
  socket.on("send-message", async (data) => {
    io.to(data.roomId).emit("receive-message", {
      message: data.message,
      name: data.name,
      color: data.color,
      time: new Date().toLocaleTimeString(),
    });

    if (data.message.startsWith("@ai")) {
      const userPrompt = data.message.replace("@ai", "").trim();
      if (!userPrompt) return;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant inside a collaborative whiteboard app. Keep answers short and clear.",
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

        const aiReply = completion.choices[0].message.content;

        io.to(data.roomId).emit("receive-message", {
          message: aiReply,
          name: "AI Bot 🤖",
          color: "#22c55e",
          time: new Date().toLocaleTimeString(),
        });
      } catch (error) {
        console.error("AI Error:", error.message);

        io.to(data.roomId).emit("receive-message", {
          message: "AI is currently unavailable.",
          name: "AI Bot 🤖",
          color: "#ef4444",
          time: new Date().toLocaleTimeString(),
        });
      }
    }
  });

  /* CLEAR CANVAS */
  socket.on("clear-canvas", (roomId) => {
    socket.to(roomId).emit("clear-canvas");
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(
        (user) => user.socketId !== socket.id
      );
      io.to(roomId).emit("users-update", rooms[roomId]);
    }
  });
});

/* ✅ IMPORTANT FOR RENDER */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});