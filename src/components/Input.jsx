// src/components/InputHandlers.jsx

import { useEffect, useState } from "react";

export const InputHandlers = () => {
  const [keys, setKeys] = useState({});
  const [mouse, setMouse] = useState({ x: 0, y: 0, click: false });

  useEffect(() => {
    const handleKeyDown = (event) => {
      setKeys((keys) => ({ ...keys, [event.key]: true }));
    };

    const handleKeyUp = (event) => {
      setKeys((keys) => ({ ...keys, [event.key]: false }));
    };

    const handleMouseDown = () => {
      setMouse((mouse) => ({ ...mouse, click: true }));
    };

    const handleMouseUp = () => {
      setMouse((mouse) => ({ ...mouse, click: false }));
    };

    const handleMouseMove = (event) => {
      setMouse((mouse) => ({
        ...mouse,
        x: event.clientX,
        y: event.clientY,
      }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return { keys, mouse };
};
