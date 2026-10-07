import { describe, expect, it } from "vitest";
import { getUnitArt, UNIT_ART } from "./unitArt";

describe("unit art specs", () => {
  it("gives Mirage one Hull+Gun pack with socket-aligned pivot", () => {
    const spec = UNIT_ART[6];
    expect(spec.hull).toContain("/units-art/tanks/Humvee/Hull_08");
    expect(spec.hullW).toBe(256);
    expect(spec.turrets).toHaveLength(1);
    expect(spec.turrets[0].barrels).toHaveLength(1);
    expect(spec.turrets[0].aim).toBe(0);
    expect(spec.turrets[0]).toMatchObject({ x: 128, y: 151 });
    expect(spec.turrets[0].barrels[0].src).toContain("/units-art/tanks/Humvee/Gun_02");
    expect(spec.turrets[0].barrels[0]).toMatchObject({ originX: 128, originY: 145 });
  });

  it("mounts Bastion and Zeus guns on their hull sockets", () => {
    const bastion = UNIT_ART[3];
    expect(bastion.hull).toContain("/units-art/tanks/Bastion/Hull_02");
    expect(bastion.turrets).toHaveLength(1);
    expect(bastion.turrets[0]).toMatchObject({ x: 128, y: 150 });
    expect(bastion.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/Bastion/Gun_08"),
      originX: 128,
      originY: 135,
    });

    const zeus = UNIT_ART[1];
    expect(zeus.hull).toContain("/units-art/tanks/Zeus/Hull_05");
    expect(zeus.turrets).toHaveLength(1);
    expect(zeus.turrets[0]).toMatchObject({ x: 128, y: 152 });
    expect(zeus.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/Zeus/Gun_06"),
      originX: 128,
      originY: 146,
    });
  });

  it("packs Apex / Jackal / Nomad as 256 Hull+Gun like Bastion", () => {
    const apex = UNIT_ART[2];
    expect(apex.kind).toBe("heavy");
    expect(apex.hull).toContain("/units-art/tanks/Apex/Hull_01");
    expect(apex.hullW).toBe(256);
    expect(apex.turrets).toHaveLength(1);
    expect(apex.turrets[0]).toMatchObject({ x: 128, y: 124 });
    expect(apex.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/Apex/Gun_01"),
      originX: 128,
      originY: 140,
    });

    const jackal = UNIT_ART[4];
    expect(jackal.hull).toContain("/units-art/tanks/Jackal/Hull_03");
    expect(jackal.turrets[0]).toMatchObject({ x: 128, y: 128 });
    expect(jackal.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/Jackal/Gun_03"),
      originX: 128,
      originY: 145,
    });

    const nomad = UNIT_ART[5];
    expect(nomad.hull).toContain("/units-art/tanks/Nomad/Hull_04");
    expect(nomad.turrets[0]).toMatchObject({ x: 128, y: 130 });
    expect(nomad.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/Nomad/Gun_04"),
      originX: 128,
      originY: 146,
    });
  });

  it("builds Stalker as a biped with side-pod walk-legs", () => {
    const spec = UNIT_ART[14];
    expect(spec.kind).toBe("biped");
    expect(spec.legs).toHaveLength(2);
    expect(spec.legs?.[0].width).toBe(14);
    expect(spec.legs?.[0].height).toBe(36);
    expect(spec.legs?.[0].x).toBe(0);
    expect(spec.legs?.[1].x).toBeGreaterThan(spec.pivotX);
    expect(spec.torsoW).toBe(84);
    expect(spec.torsoH).toBe(61);
    expect(spec.upper).toBeUndefined();
    expect(spec.turrets).toHaveLength(0);
    expect(spec.hull).toContain("/units-art/robot/stalker/torso");
  });

  it("paints Aegis as an ocean-blue biped walker", () => {
    const spec = UNIT_ART[13];
    expect(spec.kind).toBe("biped");
    expect(spec.legs).toHaveLength(2);
    expect(spec.hull).toContain("/units-art/robot/aegis/torso");
    expect(spec.legs?.[0].src).toContain("/units-art/robot/aegis/leg-left");
    expect(spec.legs?.[0]).toMatchObject({ x: 26, y: 53, width: 30, height: 50 });
    expect(spec.legs?.[1]).toMatchObject({ x: 62, y: 53, width: 30, height: 50 });
  });

  it("paints Ironclad Goliath as a red quadruped walker", () => {
    const spec = UNIT_ART[15];
    expect(spec.kind).toBe("biped");
    expect(spec.legs).toHaveLength(4);
    expect(spec.hull).toContain("/units-art/robot/ironclad/torso");
    expect(spec.lower?.src).toContain("/units-art/robot/ironclad/hips");
    expect(spec.legs?.[0].src).toContain("/units-art/robot/ironclad/leg-left");
    expect(spec.legs?.[0]).toMatchObject({ width: 34, height: 67, end: "rear" });
    expect(spec.legs?.[2].end).toBe("front");
    expect(spec.legs?.[2].y).toBeLessThan(spec.legs?.[0].y ?? 0);
  });

  it("gives every robot walker separate legs so the torso can yaw toward the enemy", () => {
    for (const id of [14, 13, 15] as const) {
      const spec = UNIT_ART[id];
      expect(spec.kind).toBe("biped");
      expect(spec.legs?.length).toBeGreaterThan(0);
      expect(spec.hull).toContain("/torso");
    }
  });

  it("packs Tiamat Echo MLRS as a single heavy Hull+Gun", () => {
    const spec = UNIT_ART[10];
    expect(spec.kind).toBe("heavy");
    expect(spec.pair).toBeUndefined();
    expect(spec.hull).toContain("/units-art/tanks/MLRS/Hull_01");
    expect(spec.hullW).toBe(256);
    expect(spec.turrets).toHaveLength(1);
    expect(spec.turrets[0]).toMatchObject({ x: 128, y: 122 });
    expect(spec.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/MLRS/Gun_01"),
      originX: 128,
      originY: 122,
      width: 256,
      height: 256,
    });
  });

  it("packs Siege Howitzer as a single heavy Hull+Gun", () => {
    const spec = UNIT_ART[12];
    expect(spec.kind).toBe("heavy");
    expect(spec.pair).toBeUndefined();
    expect(spec.hull).toContain("/units-art/tanks/Siege/Hull_01");
    expect(spec.hullW).toBe(256);
    expect(spec.turrets).toHaveLength(1);
    expect(spec.turrets[0]).toMatchObject({ x: 128, y: 142 });
    expect(spec.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/Siege/Gun_01"),
      originX: 128,
      originY: 142,
      width: 256,
      height: 256,
    });
  });

  it("packs Sentinel Battery as a single heavy Hull+Gun", () => {
    const spec = UNIT_ART[11];
    expect(spec.kind).toBe("heavy");
    expect(spec.pair).toBeUndefined();
    expect(spec.hull).toContain("/units-art/tanks/Sentinel/Hull_01");
    expect(spec.hullW).toBe(256);
    expect(spec.turrets).toHaveLength(1);
    expect(spec.turrets[0]).toMatchObject({ x: 128, y: 148 });
    expect(spec.turrets[0].barrels[0]).toMatchObject({
      src: expect.stringContaining("/units-art/tanks/Sentinel/Gun_01"),
      originX: 128,
      originY: 148,
      width: 256,
      height: 256,
    });
  });

  it("paints tutorial Cadet and Recruit with robot walker models", () => {
    expect(getUnitArt(101)).toBe(UNIT_ART[14]);
    expect(getUnitArt(102)).toBe(UNIT_ART[13]);
  });
});
