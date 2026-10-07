import { useEffect, useRef, useState } from "react";
import {
  pixelTailCells,
  rotorsOf,
  rotorStreaks,
  STEALTHRAY_TAIL_CELL,
  tailLagFromTurn,
  type SpriteArtSpec,
  type SpriteRotorSpec,
} from "../data/spriteArt";
import { shortestDelta } from "./movePath";

function useTailBend(facingDeg: number, enabled: boolean, moving: boolean): number {
  const prev = useRef(facingDeg);
  const [lag, setLag] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const delta = shortestDelta(prev.current, facingDeg);
    prev.current = facingDeg;
    if (!moving) {
      setLag(0);
      return;
    }
    if (Math.abs(delta) >= 0.8) setLag(tailLagFromTurn(delta));
  }, [facingDeg, enabled, moving]);
  // Ease straight again while flying without yaw — bend only during turns.
  useEffect(() => {
    if (!enabled || !moving) {
      setLag(0);
      return;
    }
    const id = window.setInterval(() => {
      setLag((cur) => (Math.abs(cur) < 1.2 ? 0 : cur * 0.78));
    }, 40);
    return () => clearInterval(id);
  }, [enabled, moving]);
  return moving ? lag : 0;
}

function RotorDisc({ rotor }: { rotor: SpriteRotorSpec }) {
  const round = rotor.inWing ? 1 : 0.92;
  return (
    <g className="heli-rotor" transform={`translate(${rotor.x} ${rotor.y})`}>
      <ellipse
        className={`heli-rotor-disc${rotor.inWing ? " in-wing" : ""}`}
        rx={rotor.size}
        ry={rotor.size * round}
      />
      <g className={`heli-rotor-spin${rotor.ccw ? " reverse" : ""}`}>
        {rotorStreaks(rotor.size).map((streak, i) => (
          <line
            key={i}
            className={`heli-rotor-flash${streak.dim ? " dim" : ""}`}
            x1={streak.x1}
            y1={streak.y1}
            x2={streak.x2}
            y2={streak.y2}
          />
        ))}
      </g>
      <circle className="heli-rotor-hub" r={Math.max(rotor.inWing ? 1.4 : 2, rotor.size * 0.09)} />
    </g>
  );
}

export function SpriteArt({
  spec,
  facingDeg = 0,
  running = false,
}: {
  spec: SpriteArtSpec;
  facingDeg?: number;
  running?: boolean;
}) {
  const bend = useTailBend(facingDeg, Boolean(spec.tail), running);
  const tail = spec.tail;
  const whip = Boolean(tail && tail.whip !== false);
  const cell = STEALTHRAY_TAIL_CELL;
  const rows = whip && tail ? Math.round(tail.height / cell) : 0;
  const segs = whip && tail ? pixelTailCells(rows, cell, bend, running) : [];
  const hover = !running;
  const drawScale = spec.scale ?? 1;
  return (
    <svg className="sprite-svg" viewBox={`0 0 ${spec.box} ${spec.box}`} aria-hidden>
      <g className={hover ? "air-hover" : undefined}>
        <g transform={`translate(${spec.pivotX} ${spec.pivotY}) scale(${drawScale}) rotate(${facingDeg})`}>
        {tail && !whip ? (
          <g transform={`translate(${tail.attachX} ${tail.attachY}) rotate(${bend})`}>
            <image
              className="sprite-tail"
              href={tail.src}
              x={-tail.width / 2}
              y={0}
              width={tail.width}
              height={tail.height}
              style={{ imageRendering: "pixelated" }}
            />
          </g>
        ) : null}
        <image
          href={spec.src}
          x={-spec.pivotX}
          y={-spec.pivotY}
          width={spec.box}
          height={spec.box}
          style={{ imageRendering: "pixelated" }}
        />
        {tail && whip
          ? segs.map((seg, i) => (
              <g key={i} transform={`translate(${tail.attachX + seg.x} ${tail.attachY + seg.y})`}>
                <rect x={-4.5} y={0} width={cell} height={cell} fill="#1a1e26" />
                <rect x={-1.5} y={0} width={cell} height={cell} fill={i % 2 === 0 ? "#2c3340" : "#6ae0ea"} />
                <rect x={1.5} y={0} width={cell} height={cell} fill="#1a1e26" />
              </g>
            ))
          : null}
        {rotorsOf(spec).map((rotor, i) => (
          <RotorDisc key={i} rotor={rotor} />
        ))}
        </g>
      </g>
    </svg>
  );
}
