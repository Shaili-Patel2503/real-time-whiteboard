import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

const Home = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const createRoom = () => {
    if (!name) return alert("Enter your name");

    const roomId = Math.random().toString(36).substring(2, 8);
    navigate(`/${roomId}?name=${name}`);
  };

  const joinRoom = () => {
    if (!name || !joinCode) return alert("Enter all fields");

    navigate(`/${joinCode}?name=${name}`);
  };

  return (
    <div className="home-container">
      <div className="card">
        <h1>Realtime Whiteboard</h1>

        <input
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
        />

        <button className="primary-btn" onClick={createRoom}>
          Create New Room
        </button>

        <div className="divider">OR</div>

        <input
          placeholder="Enter Room Code"
          onChange={(e) => setJoinCode(e.target.value)}
        />

        <button className="secondary-btn" onClick={joinRoom}>
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Home;
