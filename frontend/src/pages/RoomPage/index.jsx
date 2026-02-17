import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../../socket";
import Whiteboard from "../../Components/Whiteboard";
import "./index.css";

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  const name = location.state?.name || "Guest";

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    socket.emit("join-room", roomId);

    return () => {
      socket.emit("leave-room", roomId);
    };
  }, [roomId, navigate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", roomId);
    navigate("/");
  };

  return (
    <div className="room-page">
      <div className="room-header">
        <div className="brand">🧠 WhiteSync</div>

        <div className="room-info">
          <span className="user">👤 {name}</span>

          <div className="room-id-container">
            <span className="room">🔑 {roomId}</span>

            <button
              className={`copy-btn ${copied ? "copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <button className="leave-btn" onClick={handleLeaveRoom}>
            Leave
          </button>
        </div>
      </div>

      <Whiteboard roomId={roomId} socket={socket} />
    </div>
  );
};

export default RoomPage;
