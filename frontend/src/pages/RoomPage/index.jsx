import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../../socket";
import Whiteboard from "../../Components/Whiteboard";

const generateColor = () => {
  const colors = [
    "#4F46E5",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#EC4899",
    "#06B6D4",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const RoomPage = () => {
  const { roomId } = useParams();
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [color] = useState(generateColor());

  const joinRoom = () => {
    if (!name) return alert("Enter your name");
    socket.emit("join-room", { roomId, name, color });
    setJoined(true);
  };

  if (!joined) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Enter Your Name</h2>
        <input
          type="text"
          placeholder="Your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "10px", width: "250px" }}
        />
        <br />
        <button
          onClick={joinRoom}
          style={{ marginTop: "20px", padding: "10px 20px" }}
        >
          Join Room
        </button>
      </div>
    );
  }

  return (
    <Whiteboard
      roomId={roomId}
      socket={socket}
      name={name}
      color={color}
    />
  );
};

export default RoomPage;
