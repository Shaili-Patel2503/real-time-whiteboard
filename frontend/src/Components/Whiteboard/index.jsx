import { useRef, useEffect, useState } from "react";
import "./index.css";

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const currentElement = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [cursors, setCursors] = useState({});

  // =============================
  // Setup Canvas
  // =============================
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;

    contextRef.current = context;
  }, []);

  // =============================
  // Redraw Canvas
  // =============================
  useEffect(() => {
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    elements.forEach((element) => drawElement(ctx, element));
  }, [elements]);

  // =============================
  // Socket Listeners
  // =============================
  useEffect(() => {
    socket.on("receive-elements", (newElements) => {
      setElements(newElements);
    });

    socket.on("clear-canvas", () => {
      setElements([]);
      setRedoStack([]);
    });

    socket.on("cursor-move", (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.socketId]: data,
      }));
    });

    socket.on("user-disconnected", (socketId) => {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    return () => {
      socket.off("receive-elements");
      socket.off("clear-canvas");
      socket.off("cursor-move");
      socket.off("user-disconnected");
    };
  }, [socket]);

  // =============================
  // Drawing Logic
  // =============================
  const drawElement = (ctx, element) => {
    ctx.strokeStyle = element.color;

    if (element.type === "pencil") {
      ctx.beginPath();
      element.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.closePath();
    }

    if (element.type === "line") {
      ctx.beginPath();
      ctx.moveTo(element.startX, element.startY);
      ctx.lineTo(element.endX, element.endY);
      ctx.stroke();
      ctx.closePath();
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
        color,
        points: [{ x: offsetX, y: offsetY }],
      };
    } else {
      currentElement.current = {
        id: Date.now(),
        type: tool,
        color,
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

    const updatedElements = [
      ...elements.filter((el) => el.id !== currentElement.current.id),
      currentElement.current,
    ];

    setElements(updatedElements);
    socket.emit("send-elements", { roomId, elements: updatedElements });
  };

  const stopDrawing = () => {
    setDrawing(false);
    setRedoStack([]);
  };

  // =============================
  // Undo / Redo / Clear
  // =============================
  const undo = () => {
    if (!elements.length) return;

    const last = elements[elements.length - 1];
    const newElements = elements.slice(0, -1);

    setElements(newElements);
    setRedoStack([...redoStack, last]);
    socket.emit("send-elements", { roomId, elements: newElements });
  };

  const redo = () => {
    if (!redoStack.length) return;

    const element = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const newElements = [...elements, element];

    setElements(newElements);
    setRedoStack(newRedo);
    socket.emit("send-elements", { roomId, elements: newElements });
  };

  const clearCanvas = () => {
    setElements([]);
    setRedoStack([]);
    socket.emit("clear-canvas", roomId);
  };

  // =============================
  // Cursor Move
  // =============================
  const handleCursorMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit("cursor-move", {
      roomId,
      x,
      y,
      name: "User",
    });
  };

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <button
          className={tool === "pencil" ? "active" : ""}
          onClick={() => setTool("pencil")}
        >
          ✏ Pencil
        </button>

        <button
          className={tool === "line" ? "active" : ""}
          onClick={() => setTool("line")}
        >
          📏 Line
        </button>

        <button
          className={tool === "rectangle" ? "active" : ""}
          onClick={() => setTool("rectangle")}
        >
          ⬛ Rectangle
        </button>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <button onClick={undo}>↩ Undo</button>
        <button onClick={redo}>↪ Redo</button>
        <button onClick={clearCanvas}>🗑 Clear</button>
      </div>

      <canvas
        ref={canvasRef}
        className="canvas"
        onMouseDown={startDrawing}
        onMouseMove={(e) => {
          draw(e);
          handleCursorMove(e);
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
          <div className="cursor-dot" />
          <span className="cursor-name">{cursor.name}</span>
        </div>
      ))}
    </div>
  );
};

export default Whiteboard;
