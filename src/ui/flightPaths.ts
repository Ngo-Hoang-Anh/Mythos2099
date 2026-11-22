import { curveDrivePath, dist, type Point } from "./movePath";

export const DRONE_COUNT = 5;
export const DRONE_SHOT_SCALE = 0.25;
export const DRONE_MISSILE_SCALE = 1 / 3;
export const AIR_PATTERN_COUNT = 4;
export const DRONE_FLIGHT_MS = 1200;
export const DRONE_PATH_SAMPLES = 21;
export const DRONE_STEP_MS = DRONE_FLIGHT_MS / (DRONE_PATH_SAMPLES - 1);
export const DRONE_MISSILE_FLIGHT_MS = 420;
export const DRONE_MISSILE_SAMPLES = 7;
export const DRONE_MISSILE_STEP_MS = DRONE_MISSILE_FLIGHT_MS / (DRONE_MISSILE_SAMPLES - 1);
export const DRONE_FIRE_STAGGER = [0, 3, 1, 5, 2];
export const JET_OUT_MS = 1200;
export const JET_BACK_MS = 1200;
export const JET_LEG_SAMPLES = 16;
export const JET_STEP_MS = JET_OUT_MS / (JET_LEG_SAMPLES - 1);
export const SQUAD_MARCH_SAMPLES = 10;
export const SQUAD_MARCH_STEP_MS = 120;

type Rel = { along: number; side: number; up: number };

type Basis = { fx: number; fy: number; px: number; py: number; len: number };

/** Closest-pass offset: stay wide of the target, different side / height per drone. */
const PASS_SLOTS: Rel[] = [
  { along: 1.22, side: 176, up: 36 },
  { along: 1.34, side: -184, up: 24 },
  { along: 1.28, side: 0, up: 58 },
  { along: 1.18, side: 160, up: 48 },
  { along: 1.4, side: -156, up: 20 },
];

/** When each drone reaches closest approach (0..1 along the 1.2s pass). */
const DRONE_PEAK_U = [0.36, 0.44, 0.52, 0.6, 0.68];

const JET_LOOPS: Rel[][] = [
  [
    { along: 0, side: 0, up: 0 },
    { along: 0.18, side: 22, up: 86 },
    { along: 0.52, side: 72, up: 108 },
    { along: 1.04, side: 56, up: 58 },
    { along: 1.42, side: 28, up: 62 },
    { along: 0.82, side: -118, up: 96 },
    { along: 0.22, side: -46, up: 68 },
    { along: 0, side: 0, up: 0 },
  ],
  [
    { along: 0, side: 0, up: 0 },
    { along: 0.16, side: -18, up: 78 },
    { along: 0.48, side: -72, up: 112 },
    { along: 1.04, side: -54, up: 56 },
    { along: 1.42, side: -22, up: 64 },
    { along: 0.78, side: 124, up: 98 },
    { along: 0.2, side: 42, up: 64 },
    { along: 0, side: 0, up: 0 },
  ],
  [
    { along: 0, side: 0, up: 0 },
    { along: 0.12, side: 10, up: 72 },
    { along: 0.5, side: 64, up: 96 },
    { along: 1.06, side: 58, up: 52 },
    { along: 1.52, side: 36, up: 48 },
    { along: 1.22, side: 128, up: 92 },
    { along: 0.48, side: 108, up: 100 },
    { along: 0.1, side: 36, up: 58 },
    { along: 0, side: 0, up: 0 },
  ],
  [
    { along: 0, side: 0, up: 0 },
    { along: 0.26, side: -10, up: 56 },
    { along: 0.68, side: -58, up: 82 },
    { along: 1.08, side: -48, up: 54 },
    { along: 1.28, side: 18, up: 108 },
    { along: 0.86, side: 72, up: 142 },
    { along: 0.34, side: 52, up: 88 },
    { along: 0.08, side: 14, up: 36 },
    { along: 0, side: 0, up: 0 },
  ],
];

let dronePatternSeq = 0;
let jetPatternSeq = 0;
let marchPatternSeq = 0;

export function nextAirPattern(kind: "drone" | "jet" | "march"): number {
  if (kind === "drone") {
    const n = dronePatternSeq % AIR_PATTERN_COUNT;
    dronePatternSeq += 1;
    return n;
  }
  if (kind === "march") {
    const n = marchPatternSeq % AIR_PATTERN_COUNT;
    marchPatternSeq += 1;
    return n;
  }
  const n = jetPatternSeq % AIR_PATTERN_COUNT;
  jetPatternSeq += 1;
  return n;
}

function basis(start: Point, end: Point): Basis {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(Math.hypot(dx, dy), 80);
  const fx = dx / len;
  const fy = dy / len;
  return { fx, fy, px: -fy, py: fx, len };
}

function at(origin: Point, b: Basis, rel: Rel): Point {
  return {
    x: origin.x + b.fx * rel.along * b.len + b.px * rel.side,
    y: origin.y + b.fy * rel.along * b.len + b.py * rel.side - rel.up,
  };
}

function pathLength(points: Point[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) sum += dist(points[i - 1], points[i]);
  return sum;
}

function pointAtLength(points: Point[], want: number): Point {
  if (points.length === 1) return points[0];
  let acc = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const seg = dist(a, b);
    if (acc + seg >= want || i === points.length - 1) {
      const t = seg < 0.001 ? 0 : (want - acc) / seg;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    acc += seg;
  }
  return points[points.length - 1];
}

export function resamplePath(points: Point[], samples: number): Point[] {
  if (points.length === 0 || samples <= 1) return points.slice(0, 1);
  const total = pathLength(points);
  const out: Point[] = [points[0]];
  for (let i = 1; i < samples - 1; i += 1) {
    out.push(pointAtLength(points, (total * i) / (samples - 1)));
  }
  out.push(points[points.length - 1]);
  return out;
}

function smooth(controls: Point[], samples: number): Point[] {
  if (controls.length < 2) return resamplePath(controls, samples);
  return resamplePath(curveDrivePath(controls, [], 0, 22), samples);
}

export const MISSILE_FLIGHT_MS = 1200;
export const MISSILE_PATH_SAMPLES = 16;
export const MISSILE_STEP_MS = MISSILE_FLIGHT_MS / (MISSILE_PATH_SAMPLES - 1);
export const JET_ORBIT_SAMPLES = 24;
export const JET_ORBIT_MS = 2400;
export const JET_ORBIT_STEP_MS = JET_ORBIT_MS / JET_ORBIT_SAMPLES;

export function missileArcPath(start: Point, end: Point): Point[] {
  const peak = {
    x: start.x + (end.x - start.x) * 0.55,
    y: Math.max(16, Math.min(start.y, end.y) - 170),
  };
  return smooth([start, peak, end], MISSILE_PATH_SAMPLES);
}

/** Full-size jet missile: cruise level, then fall onto the target. No lofted arc. */
export function missileLevelDropPath(start: Point, end: Point): Point[] {
  const dx = end.x - start.x;
  const out = Math.abs(dx) >= 36 ? Math.sign(dx) : start.x <= end.x ? 1 : -1;
  const cruise = Math.max(Math.abs(dx) * 0.58, 88);
  const level = { x: start.x + out * cruise, y: start.y };
  const breakover = {
    x: start.x + (end.x - start.x) * 0.84,
    y: start.y + (end.y - start.y) * 0.22,
  };
  return smooth([start, level, breakover, end], MISSILE_PATH_SAMPLES);
}

/** Straight drop from a hovering drone — no ballistic climb. */
export function missileDivePath(start: Point, end: Point): Point[] {
  return resamplePath([start, end], DRONE_MISSILE_SAMPLES);
}

export function reversePath(points: Point[]): Point[] {
  return points.slice().reverse();
}

export function pickOverheadDrone<T extends Point>(drones: T[], target: Point): T {
  return drones.reduce((best, drone) => {
    const bestDx = Math.abs(best.x - target.x);
    const dx = Math.abs(drone.x - target.x);
    if (dx < bestDx - 4) return drone;
    if (Math.abs(dx - bestDx) <= 4 && drone.y < best.y) return drone;
    return best;
  });
}

export const KAMIKAZE_FLIGHT_MS = 1400;
export const KAMIKAZE_PATH_SAMPLES = 12;
export const KAMIKAZE_STEP_MS = KAMIKAZE_FLIGHT_MS / (KAMIKAZE_PATH_SAMPLES - 1);

export function kamikazeDivePaths(starts: Point[], target: Point): Point[][] {
  const mid = (starts.length - 1) / 2;
  return starts.map((start, i) => {
    const b = basis(start, target);
    const flare = at(start, b, { along: 0.32, side: (i - mid) * 42, up: 78 });
    return smooth([start, flare, target], KAMIKAZE_PATH_SAMPLES);
  });
}

function rotateItems<T>(items: readonly T[], n: number): T[] {
  const k = ((n % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

export function closestPathIndex(path: Point[], target: Point): number {
  return nearestPathIndex(path, target);
}

export function droneFireSteps(paths: Point[][], target: Point): number[] {
  return paths.map((path, i) => {
    const closest = closestPathIndex(path, target);
    const cap = Math.max(2, path.length - 4);
    return Math.min(cap, Math.max(2, closest + DRONE_FIRE_STAGGER[i % DRONE_FIRE_STAGGER.length]));
  });
}

function keepOff(p: Point, target: Point, minR: number, fallback: Basis): Point {
  const dx = p.x - target.x;
  const dy = p.y - target.y;
  const d = Math.hypot(dx, dy);
  if (d >= minR) return p;
  if (d < 1) return { x: target.x + fallback.px * minR, y: target.y + fallback.py * minR };
  const s = minR / d;
  return { x: target.x + dx * s, y: target.y + dy * s };
}

function passSweep(u: number, peakU: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 0;
  if (u <= peakU) return Math.sin((u / peakU) * (Math.PI / 2));
  return Math.sin(((1 - u) / (1 - peakU)) * (Math.PI / 2));
}

export function droneAttackPaths(starts: Point[], target: Point, pattern: number): Point[][] {
  const slots = rotateItems(PASS_SLOTS, pattern);
  const peaks = rotateItems(DRONE_PEAK_U, pattern);
  return starts.map((start, i) => {
    const b = basis(start, target);
    const slot = slots[i];
    const peakU = peaks[i];
    const pts: Point[] = [];
    for (let s = 0; s < DRONE_PATH_SAMPLES; s += 1) {
      const u = s / (DRONE_PATH_SAMPLES - 1);
      const sweep = passSweep(u, peakU);
      const raw =
        s === 0 || s === DRONE_PATH_SAMPLES - 1
          ? start
          : at(start, b, { along: sweep * slot.along, side: sweep * slot.side, up: sweep * slot.up });
      pts.push(s === 0 || s === DRONE_PATH_SAMPLES - 1 ? start : keepOff(raw, target, 64, b));
    }
    return pts;
  });
}

export function jetLoopPath(start: Point, target: Point, pattern: number): Point[] {
  const { outbound, inbound } = jetAttackPath(start, target, pattern);
  return [...outbound, ...inbound.slice(1)];
}

export function jetFireIndex(path: Point[], target: Point): number {
  const closest = closestPathIndex(path, target);
  return Math.min(path.length - 4, Math.max(3, closest));
}

export function jetAttackPath(
  start: Point,
  target: Point,
  pattern: number,
): { outbound: Point[]; inbound: Point[] } {
  const b = basis(start, target);
  const loop = JET_LOOPS[pattern % AIR_PATTERN_COUNT];
  const fireIdx = loop.findIndex((rel) => rel.along >= 0.98);
  const split = fireIdx > 0 ? fireIdx : Math.floor(loop.length / 2);
  const outboundCtrl = loop.slice(0, split + 1).map((rel) => at(start, b, rel));
  const inboundCtrl = loop.slice(split).map((rel) => at(start, b, rel));
  outboundCtrl[0] = start;
  inboundCtrl[inboundCtrl.length - 1] = start;
  const outbound = smooth(outboundCtrl, JET_LEG_SAMPLES).map((p, i) => (i === 0 ? p : keepOff(p, target, 52, b)));
  const inbound = smooth(inboundCtrl, JET_LEG_SAMPLES).map((p, i, arr) =>
    i === arr.length - 1 ? p : keepOff(p, target, 52, b),
  );
  return { outbound, inbound };
}

/** Diameter of the hold circle a missile-armed jet flies after its gun pass. */
export function jetOrbitRadius(screen: { width: number; height: number }): number {
  return Math.min(Math.max(screen.width, 1), Math.max(screen.height, 1)) / 6;
}

export function jetOrbitCenter(target: Point, radius: number): Point {
  return { x: target.x, y: target.y - radius * 1.15 };
}

export function jetOrbitPath(center: Point, radius: number, samples = JET_ORBIT_SAMPLES): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < samples; i += 1) {
    const a = -Math.PI / 2 + (i / samples) * Math.PI * 2;
    pts.push({ x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius });
  }
  return pts;
}

/** Ms to arrive at each waypoint. Entry 0 is 0; later entries are the hop that ends there. */
export function evenDurations(count: number, stepMs: number): number[] {
  return Array.from({ length: count }, (_, i) => (i === 0 ? 0 : stepMs));
}

export type TimedTrack = {
  points: Point[];
  durations: number[];
  /** Waypoint just commanded. */
  index: number;
  /** Wall time when `index` was commanded. */
  commandedAt: number;
};

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Where a unit on a fixed schedule will be at wall time `at`. */
export function pointOnTrack(track: TimedTrack, at: number): Point {
  const pts = track.points;
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return pts[0];
  const last = pts.length - 1;
  let idx = Math.max(0, Math.min(last, track.index));
  const segDur = Math.max(0, track.durations[idx] ?? 0);
  if (at <= track.commandedAt) return pts[segDur > 0 ? Math.max(0, idx - 1) : idx];
  if (segDur > 0 && at < track.commandedAt + segDur) {
    return lerpPoint(pts[Math.max(0, idx - 1)], pts[idx], (at - track.commandedAt) / segDur);
  }
  let time = track.commandedAt + segDur;
  while (idx < last) {
    const next = idx + 1;
    const hop = Math.max(0, track.durations[next] ?? 0);
    if (hop <= 0) {
      idx = next;
      continue;
    }
    if (at < time + hop) return lerpPoint(pts[idx], pts[next], (at - time) / hop);
    time += hop;
    idx = next;
  }
  return pts[last];
}

export function nearestPathIndex(points: Point[], from: Point): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const d = dist(points[i], from);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export function jetJoinOrbitPath(from: Point, orbit: Point[]): Point[] {
  if (orbit.length === 0) return [from];
  const i = nearestPathIndex(orbit, from);
  return smooth([from, orbit[i]], Math.max(6, Math.ceil(JET_LEG_SAMPLES / 2)));
}

export function jetHomePath(from: Point, home: Point, pattern: number): Point[] {
  const b = basis(from, home);
  const side = pattern % 2 === 0 ? 1 : -1;
  return smooth(
    [from, at(from, b, { along: 0.38, side: 92 * side, up: 36 }), at(from, b, { along: 0.78, side: 28 * side, up: 12 }), home],
    JET_LEG_SAMPLES,
  );
}

export type MarchMember = { start: Point; end: Point };

/** Each soldier follows the unit path, fanning out mid-course then closing ranks. */
export function spreadMarchPaths(center: Point[], members: MarchMember[], pattern: number): Point[][] {
  const path = resamplePath(center.length >= 2 ? center : [center[0] ?? { x: 0, y: 0 }, center[0] ?? { x: 0, y: 0 }], SQUAD_MARCH_SAMPLES);
  const n = path.length;
  const origin = path[0];
  const dest = path[n - 1];
  return members.map((m, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    const amp = 24 + (i % 5) * 9 + (pattern % 4) * 6;
    const startOff = { x: m.start.x - origin.x, y: m.start.y - origin.y };
    const endOff = { x: m.end.x - dest.x, y: m.end.y - dest.y };
    return path.map((p, s) => {
      const t = n <= 1 ? 0 : s / (n - 1);
      const fan = Math.sin(Math.PI * t);
      const prev = path[Math.max(0, s - 1)];
      const next = path[Math.min(n - 1, s + 1)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.max(Math.hypot(dx, dy), 1);
      const px = -dy / len;
      const py = dx / len;
      const ox = startOff.x + (endOff.x - startOff.x) * t;
      const oy = startOff.y + (endOff.y - startOff.y) * t;
      const swell = 1 + 1.7 * fan;
      return {
        x: p.x + ox * swell + px * amp * 0.35 * fan * sign,
        y: p.y + oy * swell + py * amp * 0.35 * fan * sign,
      };
    });
  });
}

export function surroundTarget(points: Point[], target: Point): boolean {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return Math.min(...xs) < target.x && Math.max(...xs) > target.x && Math.min(...ys) < target.y && Math.max(...ys) > target.y;
}
