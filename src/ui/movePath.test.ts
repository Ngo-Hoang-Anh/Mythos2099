import { describe, expect, it } from "vitest";
import { combatTurretExtra, curveDrivePath, headingAlong, parkAlign, parkedHullDeg, planMoveRoute, prepareControls, reverseToFace, shortestDelta, usesDriveRig } from "./movePath";

describe("move path", () => {
  it("drives same-row support to front on own territory", () => {
    const path = planMoveRoute({ col: 0, row: 2 }, { col: 1, row: 2 }, 0, []);
    expect(path[0]).toEqual({ k: "park", col: 0, row: 2 });
    expect(path[path.length - 1]).toEqual({ k: "park", col: 1, row: 2 });
    expect(path.every((n) => n.k !== "aisle" || n.row === 2)).toBe(true);
    expect(path).toEqual([
      { k: "park", col: 0, row: 2 },
      { k: "park", col: 1, row: 2 },
    ]);
  });

  it("hops diagonally park-to-park without the aisle", () => {
    const path = planMoveRoute({ col: 0, row: 2 }, { col: 1, row: 1 }, 0, []);
    expect(path).toEqual([
      { k: "park", col: 0, row: 2 },
      { k: "park", col: 1, row: 1 },
    ]);
  });

  it("uses the own-side aisle when changing lanes instead of driving through an ally", () => {
    const path = planMoveRoute({ col: 1, row: 3 }, { col: 1, row: 0 }, 0, [{ col: 1, row: 2 }]);
    expect(path.some((n) => n.k === "aisle")).toBe(true);
    expect(path.some((n) => n.k === "park" && n.col === 1 && n.row === 2)).toBe(false);
  });

  it("does not park on a blocked same-side cell while detouring", () => {
    const blocked = [
      { col: 1, row: 1 },
      { col: 1, row: 2 },
    ];
    const path = planMoveRoute({ col: 0, row: 3 }, { col: 0, row: 0 }, 0, blocked);
    for (const node of path) {
      if (node.k !== "park") continue;
      if (node.col === 0 && (node.row === 0 || node.row === 3)) continue;
      expect(blocked.some((b) => b.col === node.col && b.row === node.row)).toBe(false);
    }
    expect(path[path.length - 1]).toEqual({ k: "park", col: 0, row: 0 });
  });

  it("maps even columns to the left side and odd columns to the right", () => {
    expect(parkAlign(0)).toBe("left");
    expect(parkAlign(1)).toBe("right");
    expect(parkAlign(2)).toBe("left");
    expect(parkAlign(3)).toBe("right");
  });

  it("smooths a lane-change into a curve that misses an allied circle", () => {
    const controls = [
      { x: 40, y: 400 },
      { x: 120, y: 400 },
      { x: 120, y: 80 },
      { x: 40, y: 80 },
    ];
    const curve = curveDrivePath(controls, [{ x: 40, y: 240 }], 54);
    expect(curve.length).toBeGreaterThan(controls.length);
    const mid = curve[Math.floor(curve.length / 2)];
    expect(Math.hypot(mid.x - 40, mid.y - 240)).toBeGreaterThan(50);
    const axisAligned = curve.every(
      (p, i) => i === 0 || p.x === curve[i - 1].x || p.y === curve[i - 1].y,
    );
    expect(axisAligned).toBe(false);
  });

  it("only bows slightly on an adjacent hop", () => {
    const route = [
      { k: "park" as const, col: 0, row: 1 },
      { k: "park" as const, col: 1, row: 1 },
    ];
    const bent = prepareControls(
      route,
      [
        { x: 20, y: 100 },
        { x: 180, y: 100 },
      ],
      () => ({ x: 100, y: 40 }),
    );
    expect(bent).toHaveLength(3);
    expect(Math.abs(bent[1].y - 100)).toBeLessThan(20);
    expect(Math.abs(bent[1].x - 100)).toBeLessThan(8);
  });

  it("does not snap heading to upright on a zero-length segment", () => {
    const p = { x: 10, y: 10 };
    expect(headingAlong(p, p, 90)).toBe(90);
    expect(headingAlong({ x: 0, y: 0 }, { x: 10, y: 0 }, 0)).toBe(90);
  });

  it("lets airborne units fly park-to-park through occupied infantry cells", () => {
    const blocked = [{ col: 1, row: 2 }];
    const air = planMoveRoute({ col: 1, row: 3 }, { col: 1, row: 0 }, 0, blocked, { airborne: true });
    expect(air).toEqual([
      { k: "park", col: 1, row: 3 },
      { k: "park", col: 1, row: 0 },
    ]);
    const ground = planMoveRoute({ col: 1, row: 3 }, { col: 1, row: 0 }, 0, blocked);
    expect(ground.some((n) => n.k === "aisle")).toBe(true);
    expect(ground.some((n) => n.k === "park" && n.col === 1 && n.row === 2)).toBe(false);
  });

  it("steers hull for tanks, light vehicles, robots, motorcycles, and artillery", () => {
    expect(usesDriveRig("Tank")).toBe(true);
    expect(usesDriveRig("Light Vehicle")).toBe(true);
    expect(usesDriveRig("Robot")).toBe(true);
    expect(usesDriveRig("Artillery")).toBe(true);
    expect(usesDriveRig("Helicopter")).toBe(false);
    expect(usesDriveRig("Armored Infantry")).toBe(false);
    expect(usesDriveRig("Motorcycle")).toBe(true);
  });

  it("backs a bike up when travel heading is far from the hull", () => {
    const start = { x: 100, y: 100 };
    expect(reverseToFace(start, 90, 90)).toBeNull();
    const turn = reverseToFace(start, 90, 0);
    expect(turn).not.toBeNull();
    expect(turn!.point.x).toBeLessThan(start.x);
    expect(turn!.hull).toBeGreaterThan(0);
    expect(turn!.hull).toBeLessThan(90);
    expect(turn!.ms).toBeGreaterThan(150);
    const aboutFace = reverseToFace(start, 90, -90);
    expect(aboutFace).not.toBeNull();
    expect(Math.abs(shortestDelta(90, aboutFace!.hull))).toBeGreaterThan(90);
  });

  it("points turret extra from hull heading toward the enemy side", () => {
    expect(combatTurretExtra(90, 0)).toBe(0);
    expect(combatTurretExtra(45, 0)).toBe(45);
    expect(combatTurretExtra(-90, 1)).toBe(0);
    expect(combatTurretExtra(-45, 1)).toBe(-45);
  });

  it("parks artillery facing the enemy like tanks", () => {
    expect(parkedHullDeg("Artillery", 0)).toBe(90);
    expect(parkedHullDeg("Artillery", 1)).toBe(-90);
    expect(parkedHullDeg("Tank", 0)).toBe(90);
    expect(parkedHullDeg("Tank", 1)).toBe(-90);
  });
});
