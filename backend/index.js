const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3001;

let games = new Map(); // roomId -> { players: [socketIds], words: [], turn: 0 }

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinRoom", (roomId, cb) => {
    if (!games.has(roomId)) {
      games.set(roomId, { players: [], words: [], turn: 0 });
    }
    const game = games.get(roomId);
    if (game.players.length >= 2) return cb("Room full");

    socket.join(roomId);
    game.players.push(socket.id);

    if (game.players.length === 2) {
      io.to(roomId).emit("startGame");
    }

    cb(null);
  });

  socket.on("submitWord", ({ roomId, word }, cb) => {
    const game = games.get(roomId);
    if (!game || game.players[game.turn] !== socket.id)
      return cb("Not your turn");

    if (game.words.length > 0) {
      const lastWord = game.words[game.words.length - 1];
      if (word[0].toLowerCase() !== lastWord.slice(-1).toLowerCase()) {
        return cb("Word must start with " + lastWord.slice(-1));
      }
    }

    game.words.push(word);
    game.turn = 1 - game.turn;
    io.to(roomId).emit("newWord", { word, from: socket.id });
    cb(null);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [roomId, game] of games) {
      if (game.players.includes(socket.id)) {
        io.to(roomId).emit("playerLeft");
        games.delete(roomId);
        break;
      }
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
