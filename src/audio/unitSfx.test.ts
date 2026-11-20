import { describe, expect, it } from "vitest";
import { ARTILLERY_FIRE, GUN_FIRE, IMPACT, MOVE_GROUND, pickSlot } from "./catalog";
import { HEAVY_FIRE_POWER, isHeavyFire, sfxSlotsForId } from "./unitSfx";
import { UNITS } from "../data/units";

describe("unit sfx slots", () => {
  it("is stable per unit id", () => {
    const a = sfxSlotsForId(1);
    const b = sfxSlotsForId(1);
    expect(a).toEqual(b);
    expect(sfxSlotsForId(2)).not.toEqual(a);
  });

  it("assigns fixed slots on every catalog unit", () => {
    for (const unit of UNITS) {
      expect(unit.sfx).toEqual(sfxSlotsForId(unit.id));
      expect(pickSlot(GUN_FIRE, unit.sfx.fire)).toMatch(/^\/sfx\//);
      expect(pickSlot(MOVE_GROUND, unit.sfx.move)).toMatch(/^\/sfx\//);
      expect(pickSlot(IMPACT, unit.sfx.impact)).toMatch(/^\/sfx\//);
      expect(pickSlot(ARTILLERY_FIRE, unit.sfx.fire)).toMatch(/^\/sfx\//);
    }
  });

  it("uses gun for low power and artillery for high power", () => {
    expect(isHeavyFire(HEAVY_FIRE_POWER - 1)).toBe(false);
    expect(isHeavyFire(HEAVY_FIRE_POWER)).toBe(true);

    for (const unit of UNITS) {
      const power = unit.atk + unit.ap;
      expect(isHeavyFire(power)).toBe(power >= HEAVY_FIRE_POWER);
    }
  });

  it("spreads fire variants across the roster", () => {
    const fires = new Set(UNITS.map((u) => pickSlot(GUN_FIRE, u.sfx.fire)));
    expect(fires.size).toBeGreaterThan(4);
  });
});
