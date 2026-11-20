import type { UnitClass, UnitSfxSlots } from "../engine/types";
import {
  ARTILLERY_FIRE,
  DESTROY,
  GUN_FIRE,
  IMPACT,
  MOVE_GROUND,
  MOVE_HELI,
  MOVE_JET,
  MOVE_MECH,
  pickSlot,
} from "./catalog";
import { audio } from "./player";

export type { UnitSfxSlots };

/** Deterministic slots from unit id — same id always gets the same variants. */
export function sfxSlotsForId(id: number): UnitSfxSlots {
  const n = id | 0;
  return {
    fire: (Math.imul(n, 73856093) ^ (n << 7)) >>> 0,
    move: (Math.imul(n, 19349663) ^ (n << 13)) >>> 0,
    impact: (Math.imul(n, 83492791) ^ (n << 19)) >>> 0,
  };
}

/**
 * Gun fire family from printed power (ATK + AP).
 * Roster average ATK+AP ≈ 4.92 (median 5) → threshold 5:
 * below average → gun, at/above average → artillery.
 * Missile is separate (no stand-in sounds).
 */
export const HEAVY_FIRE_POWER = 5;

export function isHeavyFire(power: number): boolean {
  return power >= HEAVY_FIRE_POWER;
}

function firePool(power: number): readonly string[] {
  return isHeavyFire(power) ? ARTILLERY_FIRE : GUN_FIRE;
}

function movePool(unitClass: UnitClass): readonly string[] {
  switch (unitClass) {
    case "Helicopter":
      return MOVE_HELI;
    case "Jet Plane":
    case "Drone":
      return MOVE_JET;
    case "Robot":
    case "Armored Infantry":
      return MOVE_MECH;
    default:
      return MOVE_GROUND;
  }
}

function moveMaxMs(unitClass: UnitClass): number {
  switch (unitClass) {
    case "Helicopter":
      return 2200;
    case "Jet Plane":
    case "Drone":
      return 1800;
    default:
      return 1400;
  }
}

export function playUnitFire(
  slots: UnitSfxSlots,
  opts: { power?: number; missile?: boolean; volume?: number } = {},
): void {
  // No missile pack yet — do not substitute artillery/gun.
  if (opts.missile) return;
  const power = opts.power ?? 0;
  const heavy = isHeavyFire(power);
  const src = pickSlot(firePool(power), slots.fire);
  audio.playSfx(src, {
    volume: opts.volume ?? (heavy ? 0.7 : 0.55),
    maxMs: heavy ? 2500 : 1600,
  });
}

export function playUnitMove(slots: UnitSfxSlots, unitClass: UnitClass): void {
  const src = pickSlot(movePool(unitClass), slots.move);
  audio.playSfx(src, { volume: 0.45, maxMs: moveMaxMs(unitClass) });
}

export function playUnitImpact(
  slots: UnitSfxSlots,
  opts: { damage: number; power?: number; missile?: boolean; volume?: number } = { damage: 1 },
): void {
  if (opts.damage <= 0) return;
  // No missile pack yet — do not substitute artillery/gun.
  if (opts.missile) return;
  const heavy = isHeavyFire(opts.power ?? opts.damage);
  const pool = heavy ? ARTILLERY_FIRE : IMPACT;
  const src = pickSlot(pool, slots.impact);
  audio.playSfx(src, {
    volume: opts.volume ?? (heavy ? 0.72 : 0.55),
    maxMs: 2200,
  });
}

export function playUnitDestroy(slots: UnitSfxSlots): void {
  const src = pickSlot(DESTROY, slots.impact ^ slots.fire);
  audio.playSfx(src, { volume: 0.75, maxMs: 2800 });
}
