import { frontCol, inBounds, isOwnCol, supportCol } from "../engine/board";
import { ROWS, type BoardPos, type PlayerId, type UnitClass } from "../engine/types";
import { boardFacingDeg } from "../data/unitArt";

export type PathNode = { k: "park"; col: number; row: number } | { k: "aisle"; row: number };

export type Point = { x: number; y: number };

export const BOARD_ART_SIZE = 96;
export const BOARD_ART_MARGIN = 12;
export function parkAlign(col: number): "left" | "right" {
  return col % 2 === 0 ? "left" : "right";
}

/** Hull follows the drive path; guns or a robot torso settle toward the enemy. */
export function usesDriveRig(unitClass: UnitClass): boolean {
  return (
    unitClass === "Tank" ||
    unitClass === "Light Vehicle" ||
    unitClass === "Robot" ||
    unitClass === "Motorcycle" ||
    unitClass === "Artillery"
  );
}

/** Helicopters / jets / drones fly over ground units; only other air units block the path. */
export function isAirborneClass(unitClass: UnitClass): boolean {
  return unitClass === "Helicopter" || unitClass === "Drone" || unitClass === "Jet Plane";
}

export function isSquadClass(unitClass: UnitClass): boolean {
  return unitClass === "Armored Infantry" || unitClass === "Motorcycle";
}

/** Parked heading: face the enemy (P1 right, P2 left). Artillery included. */
export function parkedHullDeg(_unitClass: UnitClass, owner: PlayerId): number {
  return boardFacingDeg(owner);
}

export type MoveRouteOpts = {
  /** Straight park-to-park; infantry and empty cells are not obstacles. */
  airborne?: boolean;
};

/** Orthogonal or diagonal neighbor (Chebyshev distance 1). */
export function isStepAdjacent(from: BoardPos, to: BoardPos): boolean {
  const dc = Math.abs(from.col - to.col);
  const dr = Math.abs(from.row - to.row);
  return dc <= 1 && dr <= 1 && dc + dr > 0;
}

function key(node: PathNode): string {
  return node.k === "park" ? `p:${node.col},${node.row}` : `a:${node.row}`;
}

function occKey(col: number, row: number): string {
  return `${col},${row}`;
}

function passablePark(
  col: number,
  row: number,
  from: BoardPos,
  to: BoardPos,
  occupied: Set<string>,
): boolean {
  if (!inBounds(col, row)) return false;
  if (col === from.col && row === from.row) return true;
  if (col === to.col && row === to.row) return true;
  return !occupied.has(occKey(col, row));
}

function neighbors(
  node: PathNode,
  owner: PlayerId,
  from: BoardPos,
  to: BoardPos,
  occupied: Set<string>,
): { node: PathNode; cost: number }[] {
  const front = frontCol(owner);
  const support = supportCol(owner);
  const out: { node: PathNode; cost: number }[] = [];

  if (node.k === "park") {
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      const col = node.col + dc;
      const row = node.row + dr;
      if (!inBounds(col, row) || !isOwnCol(owner, col)) continue;
      if (!passablePark(col, row, from, to, occupied)) continue;
      out.push({ node: { k: "park", col, row }, cost: isStepAdjacent({ col: node.col, row: node.row }, { col, row }) ? 2 : 16 });
    }
    out.push({ node: { k: "aisle", row: node.row }, cost: 1 });
  }

  if (node.k === "aisle") {
    if (node.row > 0) out.push({ node: { k: "aisle", row: node.row - 1 }, cost: 1 });
    if (node.row < ROWS - 1) out.push({ node: { k: "aisle", row: node.row + 1 }, cost: 1 });
    if (passablePark(front, node.row, from, to, occupied)) {
      out.push({ node: { k: "park", col: front, row: node.row }, cost: 1 });
    }
    if (passablePark(support, node.row, from, to, occupied)) {
      out.push({ node: { k: "park", col: support, row: node.row }, cost: 1 });
    }
  }

  return out;
}

/** Stay on own territory. Adjacent / diagonal hops go park-to-park. Longer moves use the aisle between Support and Front. */
export function planMoveRoute(
  from: BoardPos,
  to: BoardPos,
  owner: PlayerId,
  occupied: BoardPos[],
  opts?: MoveRouteOpts,
): PathNode[] {
  if (from.col === to.col && from.row === to.row) return [{ k: "park", col: from.col, row: from.row }];
  if (opts?.airborne) {
    return [
      { k: "park", col: from.col, row: from.row },
      { k: "park", col: to.col, row: to.row },
    ];
  }
  if (isStepAdjacent(from, to)) {
    return [
      { k: "park", col: from.col, row: from.row },
      { k: "park", col: to.col, row: to.row },
    ];
  }
  const blocked = new Set(occupied.map((pos) => occKey(pos.col, pos.row)));
  const start: PathNode = { k: "park", col: from.col, row: from.row };
  const goal = `p:${to.col},${to.row}`;
  const costMap = new Map<string, number>();
  const prev = new Map<string, PathNode>();
  const nodes = new Map<string, PathNode>();
  costMap.set(key(start), 0);
  nodes.set(key(start), start);
  const queue: { k: string; cost: number }[] = [{ k: key(start), cost: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const cur = queue.shift();
    if (!cur) break;
    if (cur.cost !== costMap.get(cur.k)) continue;
    const node = nodes.get(cur.k);
    if (!node) continue;
    if (cur.k === goal) break;
    for (const edge of neighbors(node, owner, from, to, blocked)) {
      const nk = key(edge.node);
      const nextCost = cur.cost + edge.cost;
      if (nextCost >= (costMap.get(nk) ?? Infinity)) continue;
      costMap.set(nk, nextCost);
      prev.set(nk, node);
      nodes.set(nk, edge.node);
      queue.push({ k: nk, cost: nextCost });
    }
  }

  if (!costMap.has(goal)) {
    return [
      { k: "park", col: from.col, row: from.row },
      { k: "park", col: to.col, row: to.row },
    ];
  }

  const path: PathNode[] = [{ k: "park", col: to.col, row: to.row }];
  let cursor = goal;
  while (cursor !== key(start)) {
    const parent = prev.get(cursor);
    if (!parent) break;
    path.push(parent);
    cursor = key(parent);
  }
  path.reverse();
  return collapseRepeats(path);
}

function collapseRepeats(path: PathNode[]): PathNode[] {
  const out: PathNode[] = [];
  for (const node of path) {
    const last = out[out.length - 1];
    if (last && key(last) === key(node)) continue;
    out.push(node);
  }
  return out;
}

/** Adjacent hops get a light perpendicular bow. Longer same-row fallbacks may still lean toward the aisle. */
export function prepareControls(
  route: PathNode[],
  measured: Point[],
  aisleAt: (row: number) => Point | null,
): Point[] {
  if (measured.length < 2) return measured;
  if (route.length === 2 && route[0].k === "park" && route[1].k === "park") {
    const from = { col: route[0].col, row: route[0].row };
    const to = { col: route[1].col, row: route[1].row };
    const a = measured[0];
    const b = measured[1];
    if (isStepAdjacent(from, to)) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const bulge = Math.min(16, len * 0.1);
      const sign = (from.col + from.row) % 2 === 0 ? 1 : -1;
      return [
        a,
        {
          x: (a.x + b.x) / 2 + (-dy / len) * bulge * sign,
          y: (a.y + b.y) / 2 + (dx / len) * bulge * sign,
        },
        b,
      ];
    }
    if (from.row === to.row) {
      const aisle = aisleAt(from.row);
      if (aisle) {
        return [
          a,
          {
            x: a.x * 0.22 + aisle.x * 0.56 + b.x * 0.22,
            y: (a.y + b.y) / 2,
          },
          b,
        ];
      }
    }
  }
  return measured;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function catmullPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function separate(point: Point, obstacles: Point[], radius: number): Point {
  let { x, y } = point;
  for (const obstacle of obstacles) {
    const dx = x - obstacle.x;
    const dy = y - obstacle.y;
    const d = Math.hypot(dx, dy);
    if (d >= radius || d < 0.001) continue;
    const push = (radius - d) / d;
    x += dx * push;
    y += dy * push;
  }
  return { x, y };
}

function resample(points: Point[], spacing: number): Point[] {
  if (points.length < 2) return points;
  const out: Point[] = [points[0]];
  let acc = 0;
  for (let i = 1; i < points.length; i += 1) {
    let a = out[out.length - 1];
    const b = points[i];
    let seg = dist(a, b);
    while (acc + seg >= spacing) {
      const t = (spacing - acc) / seg;
      const next = lerpPoint(a, b, t);
      out.push(next);
      a = next;
      seg = dist(a, b);
      acc = 0;
    }
    acc += seg;
  }
  const last = points[points.length - 1];
  const tail = out[out.length - 1];
  if (dist(tail, last) > 4) out.push(last);
  else out[out.length - 1] = last;
  return out;
}

/** Catmull-Rom through controls, then push the curve off allied park circles. */
export function curveDrivePath(controls: Point[], obstacles: Point[], radius = 54, _spacing = 38): Point[] {
  if (controls.length < 2) return controls;
  const bent = controls.map((point, i) =>
    i === 0 || i === controls.length - 1 ? point : separate(point, obstacles, radius),
  );
  const padded = [bent[0], ...bent, bent[bent.length - 1]];
  const raw: Point[] = [];
  const steps = 10;
  for (let i = 0; i < padded.length - 3; i += 1) {
    for (let s = 0; s < steps; s += 1) {
      raw.push(catmullPoint(padded[i], padded[i + 1], padded[i + 2], padded[i + 3], s / steps));
    }
  }
  raw.push(bent[bent.length - 1]);
  const cleared = raw.map((point, i) =>
    i === 0 || i === raw.length - 1 ? point : separate(point, obstacles, radius),
  );
  return resample(cleared, 38);
}

export function headingDeg(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return 0;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

/** Unit forward for `headingDeg` (0° up, 90° right). */
export function headingVector(deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.sin(rad), y: -Math.cos(rad) };
}

export const BIKE_REVERSE_THRESHOLD = 55;

/**
 * Motorcycles cannot pivot in place. If the first heading is far off, back up a
 * short arc while turning toward `travelHeading`.
 */
export function reverseToFace(
  start: Point,
  hullDeg: number,
  travelHeading: number,
): { point: Point; hull: number; ms: number } | null {
  const delta = shortestDelta(hullDeg, travelHeading);
  if (Math.abs(delta) <= BIKE_REVERSE_THRESHOLD) return null;
  const fwd = headingVector(hullDeg);
  const turn = delta >= 0 ? 1 : -1;
  const side = headingVector(hullDeg + 90 * turn);
  const reversePx = Math.min(34, 20 + Math.abs(delta) * 0.08);
  const swing = reversePx * 0.3;
  const turnFrac = Math.abs(delta) > 120 ? 0.82 : 0.72;
  return {
    point: {
      x: start.x - fwd.x * reversePx + side.x * swing,
      y: start.y - fwd.y * reversePx + side.y * swing,
    },
    hull: hullDeg + delta * turnFrac,
    ms: Math.max(160, Math.min(280, Math.abs(delta) * 1.35)),
  };
}

/** Keep the current hull heading on a zero-length segment (do not snap to 0° / upright). */
export function headingAlong(from: Point, to: Point, fallback: number): number {
  if (dist(from, to) < 0.75) return fallback;
  return headingDeg(from, to);
}

export function shortestDelta(from: number, to: number): number {
  let d = to - from;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export function combatTurretExtra(hullDeg: number, owner: PlayerId): number {
  return shortestDelta(0, boardFacingDeg(owner) - hullDeg);
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
