import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoomForm = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();

    if (!name || !roomId) return alert("Fill all fields");

    navigate(`/${roomId}`, {
      state: { username: name },
    });
  };

  return (
    <form onSubmit={handleJoin}>
      <input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button type="submit">Join Room</button>
    </form>
  );
};

export default JoinRoomForm;
