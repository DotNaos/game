// src/components/AudioPlayer.jsx

import { useEffect } from "react";

export const AudioPlayer = ({ src, volume, trigger }) => {
  useEffect(() => {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play();
  }, [trigger]);

  return null;
};
