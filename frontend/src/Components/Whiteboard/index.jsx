import { useRef, useEffect, useState } from "react";
import "./index.css";

const Whiteboard = ({ socket, roomId, name, color }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const currentElement = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [drawColor, setDrawColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth - 500;
    canvas.height = window.innerHeight - 140;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;
    contextRef.current = context;
  }, []);

  // Socket listeners
  useEffect(() => {
    socket.on("receive-elements", (data) => setElements(data));
    socket.on("users-update", (data) => setUsers(data));

    socket.on("cursor-move", (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.socketId]: data,
      }));
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("clear-canvas", () => {
      setElements([]);
      setRedoStack([]);
    });

    return () => {
      socket.off("receive-elements");
      socket.off("users-update");
      socket.off("cursor-move");
      socket.off("receive-message");
      socket.off("clear-canvas");
    };
  }, [socket]);

  // Redraw canvas
  useEffect(() => {
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    elements.forEach((el) => drawElement(ctx, el));
  }, [elements]);

  const drawElement = (ctx, element) => {
    ctx.strokeStyle = element.color;

    if (element.type === "pencil") {
      ctx.beginPath();
      element.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    if (element.type === "line") {
      ctx.beginPath();
      ctx.moveTo(element.startX, element.startY);
      ctx.lineTo(element.endX, element.endY);
      ctx.stroke();
    }

    if (element.type === "rectangle") {
      ctx.strokeRect(
        element.startX,
        element.startY,
        element.endX - element.startX,
        element.endY - element.startY
      );
    }
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setDrawing(true);

    if (tool === "pencil") {
      currentElement.current = {
        id: Date.now(),
        type: "pencil",
        color: drawColor,
        points: [{ x: offsetX, y: offsetY }],
      };
    } else {
      currentElement.current = {
        id: Date.now(),
        type: tool,
        color: drawColor,
        startX: offsetX,
        startY: offsetY,
        endX: offsetX,
        endY: offsetY,
      };
    }
  };

  const draw = (e) => {
    if (!drawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "pencil") {
      currentElement.current.points.push({ x: offsetX, y: offsetY });
    } else {
      currentElement.current.endX = offsetX;
      currentElement.current.endY = offsetY;
    }

    const updated = [
      ...elements.filter((el) => el.id !== currentElement.current.id),
      currentElement.current,
    ];

    setElements(updated);
    socket.emit("send-elements", { roomId, elements: updated });
  };

  const stopDrawing = () => {
    setDrawing(false);
    setRedoStack([]);
  };

  const undo = () => {
    if (!elements.length) return;
    const last = elements[elements.length - 1];
    const updated = elements.slice(0, -1);
    setElements(updated);
    setRedoStack([...redoStack, last]);
    socket.emit("send-elements", { roomId, elements: updated });
  };

  const redo = () => {
    if (!redoStack.length) return;
    const element = redoStack[redoStack.length - 1];
    const updated = [...elements, element];
    setElements(updated);
    setRedoStack(redoStack.slice(0, -1));
    socket.emit("send-elements", { roomId, elements: updated });
  };

  const clearCanvas = () => {
    setElements([]);
    setRedoStack([]);
    socket.emit("clear-canvas", roomId);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const msgData = {
      roomId,
      message: chatInput,
      name,
      color,
    };

    socket.emit("send-message", msgData);
    setChatInput("");
  };

  return (
    <div className="app">
      <div className="topbar">
        <h3>Room: {roomId}</h3>
      </div>

      <div className="layout">
        {/* Canvas + Toolbar */}
        <div className="canvas-area">
          <div className="toolbar">
            <button onClick={() => setTool("pencil")}>✏ Pencil</button>
            <button onClick={() => setTool("line")}>📏 Line</button>
            <button onClick={() => setTool("rectangle")}>⬛ Rectangle</button>
            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
            />
            <button onClick={undo}>Undo</button>
            <button onClick={redo}>Redo</button>
            <button onClick={clearCanvas}>Clear</button>
          </div>

          <canvas
            ref={canvasRef}
            className="canvas"
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
              draw(e);
              const rect = canvasRef.current.getBoundingClientRect();
              socket.emit("cursor-move", {
                roomId,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                name,
                color,
              });
            }}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {Object.values(cursors).map((cursor) => (
            <div
              key={cursor.socketId}
              className="live-cursor"
              style={{ left: cursor.x, top: cursor.y }}
            >
              <div
                className="cursor-dot"
                style={{ backgroundColor: cursor.color }}
              />
              <span
                className="cursor-name"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.name}
              </span>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <h4>Users</h4>
          {users.map((user) => (
            <div key={user.socketId} className="user">
              <div
                className="avatar"
                style={{ backgroundColor: user.color }}
              >
                {user.name[0].toUpperCase()}
              </div>
              {user.name}
            </div>
          ))}

          <hr />

          <h4>Chat</h4>

          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <span style={{ color: msg.color, fontWeight: "bold" }}>
                  {msg.name}
                </span>
                <div>{msg.message}</div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
