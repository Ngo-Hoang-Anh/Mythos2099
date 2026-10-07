import { describe, expect, it } from "vitest";
import { getUnitDef } from "./units";
import { SPRITE_ART, getSpriteArt, pixelTailCells, rotorsOf, rotorStreaks, tailLagFromTurn } from "./spriteArt";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("sprite art", () => {
  it("gives Stealthray Bomber a flying-wing sprite with a hinged stingray tail", () => {
    expect(getUnitDef(26).name).toBe("Hades Stealthray");
    const spec = SPRITE_ART[26];
    expect(spec.src).toContain("stealthray-bomber");
    expect(spec.tail?.src).toContain("stealthray-tail");
    expect(spec.pivotY).toBeLessThan(spec.box / 2);
    expect(spec.tail?.attachY).toBeGreaterThan(0);
    expect(spec.tail?.height).toBe(33);
  });

  it("renders Stealthray as a pixel sprite with a sawtooth trailing edge", () => {
    const svg = readFileSync(resolve("public/units-art/air/stealthray-bomber.svg"), "utf8");
    const tail = readFileSync(resolve("public/units-art/air/stealthray-tail.svg"), "utf8");
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain("<rect");
    expect(svg).toContain("#6ae0ea");
    expect(tail).toContain('shape-rendering="crispEdges"');
    expect(svg).not.toContain("L83 49 L90 56");
  });

  it("keeps the stingray tail straight unless turning", () => {
    const rest = pixelTailCells(11, 3, 0, false);
    expect(rest.every((c) => c.x === 0)).toBe(true);
    expect(rest[rest.length - 1]?.y).toBe(30);
    const straight = pixelTailCells(11, 3, 0, true);
    expect(straight.every((c) => c.x === 0)).toBe(true);
    const left = pixelTailCells(11, 3, -20, true);
    const right = pixelTailCells(11, 3, 20, true);
    expect(left.some((c) => c.x !== 0)).toBe(true);
    expect(left[left.length - 1]!.x).not.toBe(right[right.length - 1]!.x);
  });

  it("bends the tail opposite a turn then can straighten", () => {
    expect(tailLagFromTurn(40)).toBeLessThan(0);
    expect(tailLagFromTurn(-40)).toBeGreaterThan(0);
    expect(Math.abs(tailLagFromTurn(90))).toBeLessThanOrEqual(36);
  });

  it("gives Tempest and Komet converted top-down jet sprites", () => {
    expect(SPRITE_ART[25].src).toContain("air/tempest-2.svg");
    expect(SPRITE_ART[27].src).toContain("air/komet-2.svg");
    expect(SPRITE_ART[25].tail).toBeUndefined();
    expect(SPRITE_ART[27].tail).toBeUndefined();
    expect(SPRITE_ART[25].rotor).toBeUndefined();
    expect(SPRITE_ART[27].rotor).toBeUndefined();
    const tempest = readFileSync(resolve("public/units-art/air/tempest-2.svg"), "utf8");
    const komet = readFileSync(resolve("public/units-art/air/komet-2.svg"), "utf8");
    expect(tempest).toContain('viewBox="0 0 151 95"');
    expect(komet).toContain('viewBox="0 0 126 95"');
    expect(tempest).toContain("image-rendering:pixelated");
    expect(komet).toContain("data:image/png;base64,");
  });

  it("gives the three helicopters top-down sprites and matching rotors", () => {
    const falcon = SPRITE_ART[9];
    const hornet = SPRITE_ART[8];
    const viper = SPRITE_ART[7];
    expect(falcon.scale).toBe(0.8);
    expect(hornet.scale).toBe(0.8);
    expect(viper.scale).toBe(0.8);
    expect(falcon.src).toContain("air/falcon.svg");
    expect(hornet.src).toContain("air/hornet.svg");
    expect(viper.src).toContain("air/viper.svg");
    expect(rotorsOf(falcon)).toHaveLength(2);
    expect(rotorsOf(falcon).every((r) => r.inWing && r.size < 12)).toBe(true);
    expect(rotorsOf(hornet)).toHaveLength(1);
    expect(rotorsOf(hornet)[0].size).toBe(34);
    expect(rotorsOf(viper)).toHaveLength(2);
    expect(rotorsOf(viper).every((r) => !r.inWing && r.size === 20)).toBe(true);
    expect(rotorsOf(viper).some((r) => r.ccw)).toBe(true);
    expect(viper.tail?.src).toContain("viper-tail.svg");
    expect(viper.tail?.whip).toBe(false);
    expect(viper.tail?.height).toBe(48);
    const viperTail = readFileSync(resolve("public/units-art/air/viper-tail.svg"), "utf8");
    expect(viperTail).toContain('viewBox="0 0 58 145"');
    expect(viperTail).toContain("#87a25a");
    expect(viperTail).not.toContain("#7ba3b3");
    for (const file of ["falcon.svg", "hornet.svg", "viper.svg"]) {
      const svg = readFileSync(resolve(`public/units-art/air/${file}`), "utf8");
      expect(svg).toContain('viewBox="0 0 96 96"');
      expect(svg).toContain("<rect");
    }
  });

  it("draws the rotor as a disc with a bright cross that spans the blur", () => {
    const streaks = rotorStreaks(24);
    expect(streaks).toHaveLength(2);
    expect(streaks.some((s) => !s.dim && s.x2 - s.x1 === 48)).toBe(true);
    expect(streaks.some((s) => s.dim)).toBe(true);
  });

  it("paints the tutorial dummy with the Hornet helicopter sprite", () => {
    expect(getSpriteArt(103)).toBe(SPRITE_ART[8]);
  });
});
