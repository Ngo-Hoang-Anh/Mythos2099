import { useEffect, useState } from "react";
import { EXPLOSION_FRAME_MS } from "../data/combatFx";

export function ExplosionFx({
  x,
  y,
  frames,
  scale = 1,
  frameMs = EXPLOSION_FRAME_MS,
}: {
  x: number;
  y: number;
  frames: readonly string[];
  scale?: number;
  frameMs?: number;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    setFrame(0);
  }, [frames]);
  useEffect(() => {
    if (frames.length === 0 || frame >= frames.length - 1) return;
    const id = window.setTimeout(() => setFrame((i) => i + 1), frameMs);
    return () => window.clearTimeout(id);
  }, [frame, frames, frameMs]);
  const src = frames[Math.min(frame, Math.max(0, frames.length - 1))];
  if (!src) return null;
  return (
    <img
      className="fx-explosion"
      src={src}
      alt=""
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    />
  );
}
