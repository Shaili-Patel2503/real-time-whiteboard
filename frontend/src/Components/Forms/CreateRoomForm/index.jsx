import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

const CreateRoomForm = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleCreate = (e) => {
    e.preventDefault();

    if (!name) return alert("Enter name");

    const roomId = uuid().slice(0, 6);

    navigate(`/${roomId}`, {
      state: { username: name },
    });
  };

  return (
    <form onSubmit={handleCreate}>
      <input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">Create Room</button>
    </form>
  );
};

export default CreateRoomForm;
