import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./index.css";

const socket = io("http://localhost:3001");

function App() {
  const [roomId, setRoomId] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [word, setWord] = useState("");
  const [words, setWords] = useState([]);
  const [status, setStatus] = useState("Waiting to join...");

  useEffect(() => {
    socket.on("startGame", () => setStatus("Game started!"));
    socket.on("newWord", ({ word, from }) =>
      setWords((prev) => [...prev, word])
    );
    socket.on("playerLeft", () => setStatus("Opponent left."));
  }, []);

  const join = () => {
    socket.emit("joinRoom", roomId, (err) => {
      if (err) return alert(err);
      setInRoom(true);
      setStatus("Waiting for opponent...");
    });
  };

  const send = () => {
    socket.emit("submitWord", { roomId, word }, (err) => {
      if (err) return alert(err);
      setWord("");
    });
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-gray-100">
      {!inRoom ? (
        <>
          <h1 className="text-xl font-bold mb-4">Join a Word Game</h1>
          <input
            className="border p-2 mb-2 w-full max-w-sm"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-4 py-2" onClick={join}>
            Join
          </button>
        </>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-2">{status}</div>
          <div className="bg-white border rounded w-full max-w-md p-2 h-96 overflow-y-auto mb-2">
            {words.map((w, i) => (
              <div key={i} className="p-1 border-b">
                {w}
              </div>
            ))}
          </div>
          <div className="flex w-full max-w-md">
            <input
              className="border p-2 flex-grow"
              value={word}
              onChange={(e) => setWord(e.target.value)}
            />
            <button className="bg-green-500 text-white px-4" onClick={send}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
