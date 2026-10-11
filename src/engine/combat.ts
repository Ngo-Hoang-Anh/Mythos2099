import { unitsOf } from "./board";
import {
  aggressiveOf,
  armorPiercingOf,
  hasKeyword,
  keywordValue,
  retaliateOf,
} from "./keywords";
import { hasStatusOn, missileMod, statusesOf } from "./status";
import {
  type MatchState,
  type PlayerId,
  type UnitInstance,
} from "./types";

export function computeStrikeDamage(opts: {
  atk: number;
  armor: number;
  armorPiercing?: number;
}): number {
  const piercing = opts.armorPiercing ?? 0;
  const effectiveArmor = Math.max(0, opts.armor - piercing);
  return Math.max(0, opts.atk - effectiveArmor);
}

export function attackPower(
  attacker: UnitInstance,
  supportFire: number,
): number {
  return attacker.atk + attacker.tempAtk + aggressiveOf(attacker) + supportFire;
}

export function extraGunPower(attacker: UnitInstance): number {
  return attacker.atk + attacker.tempAtk;
}

export function defenseArmor(defender: UnitInstance): number {
  return Math.max(0, defender.armor + defender.tempArmor);
}

/** Missiles count half the target's armor, rounded up. */
export function missileEffectiveArmor(armor: number): number {
  return Math.ceil(Math.max(0, armor) / 2);
}

export function missilePowerOf(state: MatchState, unit: UnitInstance): number {
  return Math.max(0, keywordValue(unit, "missile") + missileMod(state, unit));
}

export function artilleryRepeatBonus(
  state: MatchState,
  shooter: UnitInstance,
  targetKey: string,
): number {
  if (!hasKeyword(shooter, "artillery")) return 0;
  const statuses = statusesOf(state, "artilleryRepeat", shooter.owner);
  if (statuses.length === 0) return 0;
  const tracker = statuses[0];
  const keys = tracker.hitKeys ?? (tracker.hitKeys = []);
  const prior = keys.filter((key) => key === targetKey).length;
  keys.push(targetKey);
  const bonus = statuses.reduce((sum, status) => sum + status.magnitude, 0);
  return prior >= 1 ? bonus : 0;
}

export function combatDamage(
  attacker: UnitInstance,
  defender: UnitInstance,
  supportFire: number,
  state?: MatchState,
): number {
  const bonus = state
    ? artilleryRepeatBonus(state, attacker, defender.instanceId)
    : 0;
  return computeStrikeDamage({
    atk: attackPower(attacker, supportFire) + bonus,
    armor: defenseArmor(defender),
    armorPiercing: armorPiercingOf(attacker),
  });
}

export function hqDamage(
  attacker: UnitInstance,
  supportFire: number,
  state?: MatchState,
  hqOwner?: 0 | 1,
): number {
  const bonus =
    state && hqOwner !== undefined
      ? artilleryRepeatBonus(state, attacker, `hq:${hqOwner}`)
      : 0;
  return Math.max(0, attackPower(attacker, supportFire) + bonus);
}

export function extraGunDamage(
  state: MatchState,
  attacker: UnitInstance,
  defender: UnitInstance,
): number {
  const bonus = artilleryRepeatBonus(state, attacker, defender.instanceId);
  return computeStrikeDamage({
    atk: extraGunPower(attacker) + bonus,
    armor: defenseArmor(defender),
    armorPiercing: armorPiercingOf(attacker),
  });
}

export function extraGunHqDamage(
  state: MatchState,
  attacker: UnitInstance,
  hqOwner: PlayerId,
): number {
  return Math.max(
    0,
    extraGunPower(attacker) +
      artilleryRepeatBonus(state, attacker, `hq:${hqOwner}`),
  );
}

export function retaliateDamage(
  defender: UnitInstance,
  attacker: UnitInstance,
  supportFire: number,
): number {
  const raw = retaliateOf(defender) + supportFire;
  if (raw <= 0) return 0;
  return computeStrikeDamage({
    atk: raw,
    armor: defenseArmor(attacker),
    armorPiercing: 0,
  });
}

export function missileDamage(
  state: MatchState,
  attacker: UnitInstance,
  target: UnitInstance,
): number {
  const missile = missilePowerOf(state, attacker);
  if (missile <= 0) return 0;
  const ignore = hasStatusOn(state, attacker.instanceId, "missileIgnoreArmor");
  const marked = statusesOf(state, "missileLaneMark", attacker.owner).some(
    (s) => s.lane === target.row,
  )
    ? 1
    : 0;
  return computeStrikeDamage({
    atk: missile + marked,
    armor: ignore ? 0 : missileEffectiveArmor(defenseArmor(target)),
    armorPiercing: 0,
  });
}

export function supportFireBonus(
  board: (UnitInstance | null)[][],
  unit: UnitInstance,
): number {
  let bonus = 0;
  for (const ally of unitsOf(board, unit.owner)) {
    if (ally.instanceId === unit.instanceId || ally.hp <= 0) continue;
    if (Math.abs(ally.row - unit.row) > 1) continue;
    bonus += keywordValue(ally, "supportFire");
  }
  return bonus;
}

export function canAttackFromPosition(unit: UnitInstance): boolean {
  if (
    hasKeyword(unit, "artillery") ||
    hasKeyword(unit, "airStrike") ||
    hasKeyword(unit, "jetPlane")
  ) {
    return true;
  }
  return unit.owner === 0 ? unit.col === 1 : unit.col === 2;
}

/** Artillery never takes gun return fire and never counters. Jets and other units return fire to who shot them. */
export function skipsReturnFire(unit: Pick<UnitInstance, "keywords">): boolean {
  return hasKeyword(unit, "artillery");
}

export function skipsRetaliate(attacker: UnitInstance): boolean {
  return skipsReturnFire(attacker);
}
