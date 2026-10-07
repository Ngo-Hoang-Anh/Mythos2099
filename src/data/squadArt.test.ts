import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SQUAD_ART,
  SQUAD_PROP_FADE_DELAY_MS,
  SQUAD_PROP_FADE_DURATION_MS,
  SQUAD_PROP_FADE_TOTAL_MS,
} from "./squadArt";

describe("squad art specs", () => {
  it("points every piece and prop at public/units-art/squads", () => {
    for (const spec of Object.values(SQUAD_ART)) {
      if (spec.kind === "drones") {
        expect(spec.pieces.every((p) => p.src.startsWith("/units-art/drone/"))).toBe(true);
        continue;
      }
      for (const piece of spec.pieces) {
        expect(piece.src.startsWith("/units-art/squads/")).toBe(true);
      }
      for (const prop of spec.props ?? []) {
        expect(prop.src.startsWith("/units-art/squads/props/")).toBe(true);
      }
    }
  });

  it("gives each infantry unit a four-mech diamond at bike size", () => {
    for (const id of [16, 17, 18] as const) {
      const spec = SQUAD_ART[id];
      expect(spec.pieces).toHaveLength(4);
      expect(spec.pieces.every((p) => p.width === 24 && p.height === 34)).toBe(true);
    }
    expect(SQUAD_ART[16].pieces.every((p) => p.src.endsWith("breacher-mech.png"))).toBe(true);
    expect(SQUAD_ART[17].pieces.every((p) => p.src.endsWith("trench-mech.png"))).toBe(true);
    expect(SQUAD_ART[18].pieces.every((p) => p.src.endsWith("medic-mech.png"))).toBe(true);
    expect(SQUAD_ART[16].pieces.filter((p) => p.firesBullet)).toHaveLength(2);
    expect(SQUAD_ART[16].props).toBeUndefined();
    expect(SQUAD_ART[17].props).toBeUndefined();
    for (const file of ["breacher-mech.png", "trench-mech.png", "medic-mech.png"]) {
      expect(existsSync(resolve(`public/units-art/squads/infantry/${file}`))).toBe(true);
    }
  });

  it("gives each drone unit a five-ship swarm of its own sprite", () => {
    expect(SQUAD_ART[22].kind).toBe("drones");
    expect(SQUAD_ART[22].pieces).toHaveLength(5);
    expect(SQUAD_ART[24].pieces.every((p) => p.src.endsWith("/aegis.svg") && p.firesBullet)).toBe(true);
    expect(SQUAD_ART[23].pieces.every((p) => p.src.endsWith("/kamikaze.svg"))).toBe(true);
    expect(SQUAD_ART[22].pieces.every((p) => p.src.endsWith("/recon.svg") && p.shotScale === 0.25)).toBe(true);
    for (const file of ["recon.svg", "aegis.svg", "kamikaze.svg"]) {
      const svg = readFileSync(resolve(`public/units-art/drone/${file}`), "utf8");
      expect(svg).toContain('viewBox="0 0 32 32"');
    }
  });

  it("uses painted bike PNGs and crisp prop sprites", () => {
    for (const file of ["bike-blue.png", "bike-red.png", "bike-sand.png"]) {
      expect(existsSync(resolve(`public/units-art/squads/motorcycles/${file}`))).toBe(true);
    }
    expect(SQUAD_ART[19].pieces.every((p) => p.src.endsWith("/bike-blue.png"))).toBe(true);
    expect(SQUAD_ART[20].pieces.every((p) => p.src.endsWith("/bike-red.png"))).toBe(true);
    expect(SQUAD_ART[21].pieces.every((p) => p.src.endsWith("/bike-sand.png"))).toBe(true);
    const prop = readFileSync(resolve("public/units-art/squads/props/sandbag-large.svg"), "utf8");
    expect(prop).toContain('shape-rendering="crispEdges"');
    expect(prop).toContain("<rect");
  });

  it("fades ground props over 10s after a 5s delay", () => {
    expect(SQUAD_PROP_FADE_DELAY_MS).toBe(5000);
    expect(SQUAD_PROP_FADE_DURATION_MS).toBe(5000);
    expect(SQUAD_PROP_FADE_TOTAL_MS).toBe(10000);
  });
});
