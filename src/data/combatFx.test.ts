import { describe, expect, it } from "vitest";
import {
  bulletSprite,
  combatVfxTier,
  explosionPlacements,
  isHeavyHit,
  shotSprite,
  weaponFxPower,
  MISSILE_JET_SPRITE,
  MISSILE_SPRITE,
  MISSILE_TRAIL_SPRITES,
  MISSILE_TRAIL_BEHIND_PX,
  MISSILE_WAKE_MAX_AGE,
  emitMissileWake,
  missileTrailBehind,
  missileTrailSprite,
  missileWakeHeight,
} from "./combatFx";

describe("combat VFX tiers", () => {
  it("maps ATK+Penetration onto the four shot and bullet sprites", () => {
    expect(weaponFxPower(3, 1)).toBe(4);
    expect(combatVfxTier(4)).toBe(0);
    expect(shotSprite(4)).toContain("shotThin");
    expect(bulletSprite(4)).toContain("bulletRed1");

    expect(combatVfxTier(5)).toBe(1);
    expect(combatVfxTier(8)).toBe(1);
    expect(shotSprite(8)).toContain("shotLarge");
    expect(bulletSprite(8)).toContain("bulletRed3.png");

    expect(combatVfxTier(9)).toBe(2);
    expect(combatVfxTier(11)).toBe(2);
    expect(shotSprite(11)).toContain("shotOrange");
    expect(bulletSprite(11)).toContain("bulletRed2");

    expect(combatVfxTier(12)).toBe(3);
    expect(shotSprite(12)).toContain("shotRed");
    expect(bulletSprite(12)).toContain("bulletRed3_outline");
  });

  it("uses the folder missile, flame exhaust, and trail sprites", () => {
    expect(MISSILE_SPRITE).toContain("missle/missle/spaceMissiles_003");
    expect(MISSILE_JET_SPRITE).toContain("missle-fire");
    expect(MISSILE_TRAIL_SPRITES).toHaveLength(9);
    expect(MISSILE_TRAIL_SPRITES[0]).toContain("missle/trail/spaceEffects_008");
    expect(missileTrailSprite(0)).toBe(MISSILE_TRAIL_SPRITES[0]);
    expect(missileTrailSprite(8)).toBe(MISSILE_TRAIL_SPRITES[8]);
    expect(missileTrailSprite(99)).toBe(MISSILE_TRAIL_SPRITES[8]);
  });
});

describe("missile smoke trail", () => {
  it("spawns exhaust behind the missile in world space", () => {
    expect(missileTrailBehind({ x: 100, y: 80 }, 0)).toEqual({
      x: 100,
      y: 80 + MISSILE_TRAIL_BEHIND_PX,
    });
    const right = missileTrailBehind({ x: 100, y: 80 }, 90);
    expect(right.x).toBeCloseTo(100 - MISSILE_TRAIL_BEHIND_PX);
    expect(right.y).toBeCloseTo(80);
    const left = missileTrailBehind({ x: 100, y: 80 }, -90, 0.5);
    expect(left.x).toBeCloseTo(100 + MISSILE_TRAIL_BEHIND_PX * 0.5);
    expect(left.y).toBeCloseTo(80);
  });

  it("leaves older puffs where they spawned while the missile moves on", () => {
    const first = emitMissileWake([], { x: 40, y: 20 }, 0);
    expect(first).toHaveLength(1);
    expect(first[0].x).toBe(40);
    expect(first[0].y).toBe(20 + MISSILE_TRAIL_BEHIND_PX);
    expect(first[0].age).toBe(0);

    const next = emitMissileWake(first, { x: 40, y: 80 }, 0);
    expect(next[0].key).toBe(first[0].key);
    expect(next[0].x).toBe(first[0].x);
    expect(next[0].y).toBe(first[0].y);
    expect(next[0].age).toBe(1);
    expect(next[1].x).toBe(40);
    expect(next[1].y).toBe(80 + MISSILE_TRAIL_BEHIND_PX);
    expect(next[1].age).toBe(0);
    expect(missileWakeHeight(next[0].age)).toBeGreaterThan(missileWakeHeight(0));
  });

  it("drops a puff after it has played the full trail sprite sequence", () => {
    let wakes = emitMissileWake([], { x: 0, y: 0 }, 0);
    const born = wakes[0].key;
    for (let i = 0; i < MISSILE_WAKE_MAX_AGE; i += 1) {
      wakes = emitMissileWake(wakes, { x: i + 1, y: 0 }, 90);
    }
    expect(wakes.some((wake) => wake.key === born)).toBe(false);
  });
});

describe("heavy hit explosions", () => {
  it("requires damage greater than half HP rounded down", () => {
    expect(isHeavyHit(5, 10)).toBe(false);
    expect(isHeavyHit(6, 10)).toBe(true);
    expect(isHeavyHit(5, 11)).toBe(false);
    expect(isHeavyHit(6, 11)).toBe(true);
  });

  it("offsets a second smaller blast on opposite diagonals for heavy hits", () => {
    expect(explosionPlacements({ x: 100, y: 80 }, 4, 10)).toEqual([{ x: 100, y: 80, scale: 1 }]);
    const pair = explosionPlacements({ x: 100, y: 80 }, 6, 10);
    expect(pair).toHaveLength(2);
    expect(pair[0]).toEqual({ x: 84, y: 64, scale: 1 });
    expect(pair[1].x).toBe(116);
    expect(pair[1].y).toBe(96);
    expect(pair[1].scale).toBeLessThan(1);
  });
});
