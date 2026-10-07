/** Projectile and explosion VFX keyed off weapon ATK+Penetration. */

export const DAMAGE_EXPLOSION = [
  "/units-art/explosion/damage/explosion1.png",
  "/units-art/explosion/damage/explosion2.png",
  "/units-art/explosion/damage/explosion3.png",
  "/units-art/explosion/damage/explosion4.png",
  "/units-art/explosion/damage/explosion5.png",
  "/units-art/explosion/damage/explosionSmoke1.png",
] as const;

export const DESTRUCTION_EXPLOSION = [
  "/units-art/explosion/destruction/explosionSmoke2.png",
  "/units-art/explosion/destruction/explosionSmoke3.png",
  "/units-art/explosion/destruction/explosionSmoke4.png",
  "/units-art/explosion/destruction/explosionSmoke5.png",
] as const;

const SHOT_SPRITES = [
  "/units-art/shot/shotThin.png",
  "/units-art/shot/shotLarge.png",
  "/units-art/shot/shotOrange.png",
  "/units-art/shot/shotRed.png",
] as const;

const BULLET_SPRITES = [
  "/units-art/bullets/bulletRed1.png",
  "/units-art/bullets/bulletRed3.png",
  "/units-art/bullets/bulletRed2.png",
  "/units-art/bullets/bulletRed3_outline.png",
] as const;

export const MISSILE_SPRITE = "/units-art/missle/missle/spaceMissiles_003.png";
export const MISSILE_JET_SPRITE = "/units-art/missle/missle/missle-fire.png";
export const MISSILE_TRAIL_SPRITES = [
  "/units-art/missle/trail/spaceEffects_008.png",
  "/units-art/missle/trail/spaceEffects_009.png",
  "/units-art/missle/trail/spaceEffects_010.png",
  "/units-art/missle/trail/spaceEffects_011.png",
  "/units-art/missle/trail/spaceEffects_012.png",
  "/units-art/missle/trail/spaceEffects_013.png",
  "/units-art/missle/trail/spaceEffects_014.png",
  "/units-art/missle/trail/spaceEffects_015.png",
  "/units-art/missle/trail/spaceEffects_016.png",
] as const;

export const MISSILE_TRAIL_BEHIND_PX = 32;
export const MISSILE_WAKE_FADE_MS = 720;
export const MISSILE_WAKE_MAX_AGE = MISSILE_TRAIL_SPRITES.length;

export type MissileWake = {
  key: string;
  x: number;
  y: number;
  age: number;
  scale: number;
};

export function missileTrailSprite(age: number): string {
  const last = MISSILE_TRAIL_SPRITES.length - 1;
  return MISSILE_TRAIL_SPRITES[Math.min(Math.max(age, 0), last)];
}

/** World position of exhaust, behind a CSS-rotated missile (0° = up). */
export function missileTrailBehind(
  pos: { x: number; y: number },
  angleDeg: number,
  scale = 1,
  behindPx = MISSILE_TRAIL_BEHIND_PX,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const d = behindPx * scale;
  return {
    x: pos.x - Math.sin(rad) * d,
    y: pos.y + Math.cos(rad) * d,
  };
}

export function missileWakeHeight(age: number, scale = 1): number {
  return Math.round((20 + age * 1.4) * scale);
}

let missileWakeSeq = 0;

/** Leave a puff at the missile's current exhaust and age the ones already in the air. */
export function emitMissileWake(
  wakes: MissileWake[],
  missile: { x: number; y: number },
  angleDeg: number,
  scale = 1,
): MissileWake[] {
  const aged = wakes
    .map((wake) => ({ ...wake, age: wake.age + 1 }))
    .filter((wake) => wake.age < MISSILE_WAKE_MAX_AGE);
  const at = missileTrailBehind(missile, angleDeg, scale);
  aged.push({
    key: `mw-${missileWakeSeq++}`,
    x: at.x,
    y: at.y,
    age: 0,
    scale,
  });
  return aged;
}

const SHOT_HEIGHT = [26, 34, 38, 44] as const;
const BULLET_HEIGHT = [18, 22, 26, 28] as const;

export const EXPLOSION_FRAME_MS = 70;
export const HEAVY_HIT_OFFSET = 16;
export const HEAVY_HIT_SMALL_SCALE = 0.78;

export type CombatVfxTier = 0 | 1 | 2 | 3;

export function weaponFxPower(atk: number, penetration: number): number {
  return atk + penetration;
}

/** <5, <9, <12, 12+. */
export function combatVfxTier(power: number): CombatVfxTier {
  if (power < 5) return 0;
  if (power < 9) return 1;
  if (power < 12) return 2;
  return 3;
}

export function shotSprite(power: number): string {
  return SHOT_SPRITES[combatVfxTier(power)];
}

export function bulletSprite(power: number): string {
  return BULLET_SPRITES[combatVfxTier(power)];
}

export function shotHeight(power: number): number {
  return SHOT_HEIGHT[combatVfxTier(power)];
}

export function bulletHeight(power: number): number {
  return BULLET_HEIGHT[combatVfxTier(power)];
}

/** Damage greater than half the unit's HP, rounded down. */
export function isHeavyHit(damage: number, maxHp: number): boolean {
  return damage > Math.floor(maxHp / 2);
}

export type ExplosionPlacement = { x: number; y: number; scale: number };

export function explosionPlacements(
  origin: { x: number; y: number },
  damage: number,
  maxHp: number,
  baseScale = 1,
): ExplosionPlacement[] {
  if (!isHeavyHit(damage, maxHp)) {
    return [{ x: origin.x, y: origin.y, scale: baseScale }];
  }
  const d = HEAVY_HIT_OFFSET;
  return [
    { x: origin.x - d, y: origin.y - d, scale: baseScale },
    { x: origin.x + d, y: origin.y + d, scale: baseScale * HEAVY_HIT_SMALL_SCALE },
  ];
}

export function explosionDuration(frames: readonly string[]): number {
  return frames.length * EXPLOSION_FRAME_MS;
}

export function preloadCombatFx(): void {
  if (typeof Image === "undefined") return;
  for (const src of [
    ...DAMAGE_EXPLOSION,
    ...DESTRUCTION_EXPLOSION,
    ...SHOT_SPRITES,
    ...BULLET_SPRITES,
    MISSILE_SPRITE,
    MISSILE_JET_SPRITE,
    ...MISSILE_TRAIL_SPRITES,
  ]) {
    const img = new Image();
    img.src = src;
  }
}
