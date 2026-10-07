import { describe, expect, it } from "vitest";
import {
  AIR_PATTERN_COUNT,
  DRONE_COUNT,
  DRONE_FIRE_STAGGER,
  DRONE_FLIGHT_MS,
  DRONE_MISSILE_SCALE,
  DRONE_PATH_SAMPLES,
  DRONE_SHOT_SCALE,
  DRONE_STEP_MS,
  JET_BACK_MS,
  JET_LEG_SAMPLES,
  JET_OUT_MS,
  JET_STEP_MS,
  closestPathIndex,
  droneAttackPaths,
  droneFireSteps,
  jetAttackPath,
  jetFireIndex,
  jetHomePath,
  jetJoinOrbitPath,
  jetLoopPath,
  jetOrbitCenter,
  jetOrbitPath,
  jetOrbitRadius,
  kamikazeDivePaths,
  missileArcPath,
  missileDivePath,
  missileLevelDropPath,
  nearestPathIndex,
  nextAirPattern,
  pickOverheadDrone,
  reversePath,
  spreadMarchPaths,
} from "./airStrike";

import { headingDeg } from "./movePath";

const START = { x: 80, y: 220 };
const TARGET = { x: 320, y: 200 };
const DRONE_STARTS = [
  { x: 80, y: 206 },
  { x: 66, y: 220 },
  { x: 80, y: 220 },
  { x: 94, y: 220 },
  { x: 80, y: 234 },
];

describe("air strike paths", () => {
  it("flies drones a 1.2s pass-and-return, jets 1.2s plus 1.2s", () => {
    expect((DRONE_PATH_SAMPLES - 1) * DRONE_STEP_MS).toBe(DRONE_FLIGHT_MS);
    expect(DRONE_FLIGHT_MS).toBe(1200);
    expect((JET_LEG_SAMPLES - 1) * JET_STEP_MS).toBe(JET_OUT_MS);
    expect(JET_OUT_MS).toBe(1200);
    expect(JET_BACK_MS).toBe(1200);
    expect(DRONE_SHOT_SCALE).toBe(0.25);
    expect(DRONE_MISSILE_SCALE).toBeCloseTo(1 / 3);
    expect(DRONE_COUNT).toBe(5);
    expect(DRONE_FIRE_STAGGER).toEqual([0, 3, 1, 5, 2]);
  });

  it("cycles four attack patterns", () => {
    const seen = new Set([nextAirPattern("drone"), nextAirPattern("drone"), nextAirPattern("drone"), nextAirPattern("drone")]);
    expect(seen.size).toBe(AIR_PATTERN_COUNT);
  });

  it("sends each drone past the target on a curve and back home, never parking on it", () => {
    for (let pattern = 0; pattern < AIR_PATTERN_COUNT; pattern += 1) {
      const paths = droneAttackPaths(DRONE_STARTS, TARGET, pattern);
      expect(paths).toHaveLength(DRONE_COUNT);
      const fireAt = droneFireSteps(paths, TARGET);
      expect(new Set(fireAt).size).toBeGreaterThan(1);
      paths.forEach((path, i) => {
        expect(path).toHaveLength(DRONE_PATH_SAMPLES);
        expect(path[0].x).toBeCloseTo(DRONE_STARTS[i].x, 0);
        expect(path[0].y).toBeCloseTo(DRONE_STARTS[i].y, 0);
        expect(path[path.length - 1].x).toBeCloseTo(DRONE_STARTS[i].x, 5);
        expect(path[path.length - 1].y).toBeCloseTo(DRONE_STARTS[i].y, 5);
        const closest = closestPathIndex(path, TARGET);
        const near = path[closest];
        const dist = Math.hypot(near.x - TARGET.x, near.y - TARGET.y);
        expect(dist).toBeGreaterThan(56);
        expect(dist).toBeLessThan(Math.hypot(DRONE_STARTS[i].x - TARGET.x, DRONE_STARTS[i].y - TARGET.y) * 0.85);
        expect(closest).toBeLessThan(path.length - 3);
        expect(fireAt[i]).toBeGreaterThan(1);
        expect(fireAt[i]).toBeLessThan(path.length - 2);
        const dx = TARGET.x - DRONE_STARTS[i].x;
        const dy = TARGET.y - DRONE_STARTS[i].y;
        const len = Math.hypot(dx, dy) || 1;
        const bend = Math.max(
          ...path.map((p) => Math.abs((p.x - DRONE_STARTS[i].x) * dy - (p.y - DRONE_STARTS[i].y) * dx) / len),
        );
        expect(bend).toBeGreaterThan(40);
      });
    }
  });

  it("keeps drone patterns from sharing the same pass geometry", () => {
    const near = (pattern: number) =>
      droneAttackPaths(DRONE_STARTS, TARGET, pattern).map((path) => path[closestPathIndex(path, TARGET)]);
    const a = near(0);
    const b = near(1);
    const same = a.every((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y) < 8);
    expect(same).toBe(false);
  });

  it("sends a jet through a loop past the target, firing mid-pass then home", () => {
    for (let pattern = 0; pattern < AIR_PATTERN_COUNT; pattern += 1) {
      const { outbound, inbound } = jetAttackPath(START, TARGET, pattern);
      expect(outbound).toHaveLength(JET_LEG_SAMPLES);
      expect(inbound).toHaveLength(JET_LEG_SAMPLES);
      expect(outbound[0]).toEqual(START);
      expect(inbound[inbound.length - 1].x).toBeCloseTo(START.x, 0);
      expect(inbound[inbound.length - 1].y).toBeCloseTo(START.y, 0);
      const loop = jetLoopPath(START, TARGET, pattern);
      expect(loop[0]).toEqual(START);
      expect(loop[loop.length - 1].x).toBeCloseTo(START.x, 0);
      expect(loop[loop.length - 1].y).toBeCloseTo(START.y, 0);
      const fire = jetFireIndex(loop, TARGET);
      expect(fire).toBeGreaterThan(2);
      expect(fire).toBeLessThan(loop.length - 3);
      const at = loop[fire];
      expect(Math.hypot(at.x - TARGET.x, at.y - TARGET.y)).toBeLessThan(
        Math.hypot(START.x - TARGET.x, START.y - TARGET.y) * 0.55,
      );
    }
  });

  it("uses distinct jet loops across the four patterns", () => {
    const hook = (pattern: number) => {
      const pts = jetAttackPath(START, TARGET, pattern).inbound;
      return pts[Math.floor(pts.length / 2)];
    };
    expect(Math.hypot(hook(0).x - hook(1).x, hook(0).y - hook(1).y)).toBeGreaterThan(24);
    expect(Math.hypot(hook(0).x - hook(2).x, hook(0).y - hook(2).y)).toBeGreaterThan(24);
  });

  it("fans infantry off the march line mid-course then closes ranks", () => {
    const center = [
      { x: 40, y: 200 },
      { x: 200, y: 200 },
    ];
    const members = [
      { start: { x: 40, y: 188 }, end: { x: 200, y: 188 } },
      { start: { x: 40, y: 212 }, end: { x: 200, y: 212 } },
    ];
    const paths = spreadMarchPaths(center, members, 0);
    expect(paths).toHaveLength(2);
    const startGap = Math.hypot(paths[0][0].x - paths[1][0].x, paths[0][0].y - paths[1][0].y);
    const mid = Math.floor(paths[0].length / 2);
    const midGap = Math.hypot(paths[0][mid].x - paths[1][mid].x, paths[0][mid].y - paths[1][mid].y);
    expect(midGap).toBeGreaterThan(startGap + 20);
    expect(paths[0][0].x).toBeCloseTo(40, 0);
    expect(paths[0][paths[0].length - 1].x).toBeCloseTo(200, 0);
  });

  it("dives all five kamikaze drones into the target, not around it", () => {
    const paths = kamikazeDivePaths(DRONE_STARTS, TARGET);
    expect(paths).toHaveLength(DRONE_COUNT);
    paths.forEach((path, i) => {
      expect(path[0].x).toBeCloseTo(DRONE_STARTS[i].x, 0);
      expect(path[0].y).toBeCloseTo(DRONE_STARTS[i].y, 0);
      expect(path[path.length - 1].x).toBeCloseTo(TARGET.x, 0);
      expect(path[path.length - 1].y).toBeCloseTo(TARGET.y, 0);
    });
  });

  it("drops a drone missile straight at the target with no climb", () => {
    const start = { x: 320, y: 120 };
    const end = { x: 320, y: 200 };
    const path = missileDivePath(start, end);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1].x).toBeCloseTo(end.x, 0);
    expect(path[path.length - 1].y).toBeCloseTo(end.y, 0);
    expect(Math.min(...path.map((p) => p.y))).toBeGreaterThanOrEqual(start.y - 0.01);
    const home = reversePath(path);
    expect(home[0]).toEqual(path[path.length - 1]);
    expect(home[home.length - 1]).toEqual(path[0]);
    const dropper = pickOverheadDrone(
      [
        { x: 280, y: 160 },
        { x: 322, y: 110 },
        { x: 360, y: 170 },
      ],
      end,
    );
    expect(dropper).toEqual({ x: 322, y: 110 });
  });

  it("keeps a missile nose-first along a ballistic arc", () => {
    const start = { x: 80, y: 300 };
    const end = { x: 400, y: 280 };
    const path = missileArcPath(start, end);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1].x).toBeCloseTo(end.x, 0);
    expect(Math.min(...path.map((p) => p.y))).toBeLessThan(Math.min(start.y, end.y) - 80);
    const climb = headingDeg(path[0], path[1]);
    const dive = headingDeg(path[path.length - 2], path[path.length - 1]);
    expect(climb).toBeGreaterThan(0);
    expect(climb).toBeLessThan(90);
    expect(dive).toBeGreaterThan(90);
    const left = missileArcPath({ x: 400, y: 300 }, { x: 80, y: 280 });
    expect(headingDeg(left[0], left[1])).toBeLessThan(0);
    expect(headingDeg(left[left.length - 2], left[left.length - 1])).toBeLessThan(-90);
  });

  it("flies a jet missile level then drops, without lofting", () => {
    const start = { x: 120, y: 90 };
    const end = { x: 420, y: 260 };
    const path = missileLevelDropPath(start, end);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1].x).toBeCloseTo(end.x, 0);
    expect(path[path.length - 1].y).toBeCloseTo(end.y, 0);
    expect(Math.min(...path.map((p) => p.y))).toBeGreaterThan(start.y - 12);
    const early = path[Math.floor(path.length * 0.3)];
    expect(Math.abs(early.y - start.y)).toBeLessThan(36);
    expect(early.x).toBeGreaterThan(start.x + 40);
    const fall = headingDeg(path[path.length - 2], path[path.length - 1]);
    expect(Math.abs(fall)).toBeGreaterThan(90);
  });

  it("holds a missile jet on a circle about one third of the screen", () => {
    const screen = { width: 1200, height: 900 };
    const radius = jetOrbitRadius(screen);
    expect(radius * 2).toBeCloseTo(Math.min(screen.width, screen.height) / 3, 5);
    const target = { x: 640, y: 420 };
    const center = jetOrbitCenter(target, radius);
    const orbit = jetOrbitPath(center, radius);
    expect(orbit.length).toBeGreaterThan(8);
    const spanX = Math.max(...orbit.map((p) => p.x)) - Math.min(...orbit.map((p) => p.x));
    const spanY = Math.max(...orbit.map((p) => p.y)) - Math.min(...orbit.map((p) => p.y));
    expect(spanX).toBeCloseTo(radius * 2, 0);
    expect(spanY).toBeCloseTo(radius * 2, 0);
    expect(center.y + radius).toBeLessThan(target.y);
    const from = { x: 80, y: 400 };
    const join = jetJoinOrbitPath(from, orbit);
    expect(join[0]).toEqual(from);
    const land = join[join.length - 1];
    expect(orbit[nearestPathIndex(orbit, land)].x).toBeCloseTo(land.x, 0);
    const home = jetHomePath(land, from, 0);
    expect(home[home.length - 1].x).toBeCloseTo(from.x, 0);
    expect(home[home.length - 1].y).toBeCloseTo(from.y, 0);
  });
});
