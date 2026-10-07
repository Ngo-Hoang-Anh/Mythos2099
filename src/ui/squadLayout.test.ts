import { describe, expect, it } from "vitest";
import { rotateOffset, squadKindOf, squadLayout, squadMuzzles, worldMuzzleOffset } from "./squadLayout";

describe("squad layouts", () => {
  it("puts breacher in a four-mech diamond at bike size", () => {
    const laid = squadLayout(16, true);
    expect(laid?.kind).toBe("breacher");
    expect(laid?.members).toHaveLength(4);
    expect(laid?.members.every((m) => m.role === "heavy" && m.width === 24 && m.height === 34)).toBe(true);
    expect(laid?.members.every((m) => m.src.endsWith("/breacher-mech.png"))).toBe(true);
    expect(laid?.members.filter((m) => m.firesBullet)).toHaveLength(2);
    expect(laid?.members.every((m) => m.shotScale === 0.5)).toBe(true);
    expect(laid?.props).toEqual([]);
  });

  it("keeps breacher diamond while moving", () => {
    const laid = squadLayout(16, false);
    expect(laid?.props).toEqual([]);
    expect(laid?.members).toHaveLength(4);
    expect(laid?.members.some((m) => m.y < 0)).toBe(true);
    expect(laid?.members.some((m) => m.y > 0)).toBe(true);
  });

  it("puts trench guard in a four-mech diamond", () => {
    const laid = squadLayout(17, true);
    expect(laid?.members).toHaveLength(4);
    expect(laid?.members.every((m) => m.src.endsWith("/trench-mech.png") && m.role === "mg")).toBe(true);
    expect(laid?.members.every((m) => m.width === 24 && m.height === 34)).toBe(true);
    expect(laid?.members.every((m) => !m.firesBullet && Math.abs(m.shotScale - 1 / 3) < 0.001)).toBe(true);
    expect(laid?.props).toEqual([]);
  });

  it("puts line medic in a four-mech diamond", () => {
    const laid = squadLayout(18, true);
    expect(laid?.members).toHaveLength(4);
    expect(laid?.members.every((m) => m.role === "medic" && m.src.endsWith("/medic-mech.png"))).toBe(true);
    expect(laid?.members.every((m) => m.width === 24 && m.height === 34 && m.shotScale === 0.25)).toBe(true);
  });

  it("gives Phantom, Death, and Scout three same-color bikes in a triangle", () => {
    const phantom = squadLayout(19, true);
    const death = squadLayout(20, true);
    const scout = squadLayout(21, true);
    expect(phantom?.kind).toBe("bikes");
    expect(phantom?.members).toHaveLength(3);
    expect(death?.members).toHaveLength(3);
    expect(scout?.members).toHaveLength(3);
    expect(new Set(phantom?.members.map((m) => m.src)).size).toBe(1);
    expect(phantom?.members.every((m) => m.src.endsWith("/bike-blue.png"))).toBe(true);
    expect(death?.members.every((m) => m.src.endsWith("/bike-red.png"))).toBe(true);
    expect(scout?.members.every((m) => m.src.endsWith("/bike-sand.png") && m.width <= 24 && m.height <= 34)).toBe(true);
    expect(scout!.members.some((m) => m.x < 0)).toBe(true);
    expect(scout!.members.some((m) => m.x > 0)).toBe(true);
    expect(phantom?.members.every((m) => m.role === "bike" && m.width <= 24 && m.height <= 34)).toBe(true);
  });

  it("gives each drone a five-ship diamond that all fire small bullets", () => {
    const recon = squadLayout(22, true);
    const aegis = squadLayout(24, true);
    const kami = squadLayout(23, true);
    expect(recon?.kind).toBe("drones");
    expect(recon?.members).toHaveLength(5);
    expect(aegis?.members.every((m) => m.src.endsWith("/aegis.svg") && m.firesBullet && m.shotScale === 0.25)).toBe(true);
    expect(kami?.members.every((m) => m.src.endsWith("/kamikaze.svg"))).toBe(true);
    expect(recon?.members.every((m) => m.role === "drone" && m.width <= 28 && m.height <= 28)).toBe(true);
    const xs = (recon?.members ?? []).map((m) => m.x).sort((a, b) => a - b);
    expect(xs[0]).toBeLessThan(0);
    expect(xs[xs.length - 1]).toBeGreaterThan(0);
  });

  it("rotates local forward (-y) to the right at 90deg", () => {
    const p = rotateOffset(0, -10, 90);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
  });

  it("maps squad kinds from def ids", () => {
    expect(squadKindOf(16)).toBe("breacher");
    expect(squadKindOf(17)).toBe("trench");
    expect(squadKindOf(18)).toBe("medic");
    expect(squadKindOf(21)).toBe("bikes");
    expect(squadKindOf(22)).toBe("drones");
    expect(squadKindOf(23)).toBe("drones");
  });

  it("only two breacher heavies spawn flying bullets in the volley", () => {
    const shots = squadMuzzles(16);
    expect(shots.filter((s) => s.firesBullet)).toHaveLength(2);
    expect(shots).toHaveLength(4);
    const trench = squadMuzzles(17);
    expect(trench.every((s) => !s.firesBullet)).toBe(true);
    expect(trench).toHaveLength(4);
  });

  it("swings bike muzzles with turret extra without moving the hull", () => {
    const [gun] = squadMuzzles(19);
    expect(gun).toBeTruthy();
    const rest = worldMuzzleOffset(gun!, 90, 0);
    const swung = worldMuzzleOffset(gun!, 90, 45);
    expect(rest.x).not.toBeCloseTo(swung.x);
    const bodyOnly = rotateOffset(gun!.x, gun!.y, 90);
    expect(Math.hypot(rest.x - bodyOnly.x, rest.y - bodyOnly.y)).toBeGreaterThan(8);
  });

  it("keeps infantry mech sprites while jogging", () => {
    const laid = squadLayout(16, false, true);
    expect(laid?.props).toEqual([]);
    expect(laid?.members.every((m) => m.src.endsWith("breacher-mech.png"))).toBe(true);
  });
});
