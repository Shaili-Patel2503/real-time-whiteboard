import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import "./index.css";

export default function Home() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    if (!name) return alert("Enter your name");
    const id = uuidV4().slice(0, 6);
    navigate(`/${id}?name=${name}`);
  };

  const joinRoom = () => {
    if (!name || !roomId) return alert("Enter all fields");
    navigate(`/${roomId}?name=${name}`);
  };

  return (
    <div className="premium-container">

      <div className="background-glow"></div>

      <div className="premium-card">

        <div className="left-section">
          <h1>Realtime Whiteboard</h1>
          <p>
            Collaborate. Draw. Share ideas instantly with your team.
          </p>
        </div>

        <div className="right-section">

          <div className="action-card">
            <h2>Create Room</h2>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button className="primary-btn" onClick={createRoom}>
              Create New Room
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="action-card">
            <h2>Join Room</h2>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />

            <button className="secondary-btn" onClick={joinRoom}>
              Join Room
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}