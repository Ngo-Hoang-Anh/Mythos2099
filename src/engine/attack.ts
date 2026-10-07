import { enemyFirstInRow, findUnit } from "./board";
import {
  extraGunDamage,
  extraGunHqDamage,
  extraGunPower,
  missilePowerOf,
} from "./combat";
import { resolveDestroyedUnits } from "./combat/cleanup";
import { armorPiercingOf, hasKeyword } from "./keywords";
import { pushAttack } from "./fx";
import { applyHqDamage, applyUnitDamage } from "./hp";
import type { MatchState, PlayerId, UnitInstance } from "./types";
import { strikeSource } from "./combat/helpers";
import { resolveMissileShot } from "./combat/missile";
import { afterGunAttack } from "./status";

export { applyHqDamage, applyUnitDamage, healUnit, healHq } from "./hp";

export function resolveAttack(
  state: MatchState,
  attackerId: string,
  opts?: { targetId?: string },
): string | null {
  const attacker = findUnit(state.board, attackerId);
  if (!attacker || attacker.hp <= 0) return "Attacker is gone";

  const forced = opts?.targetId ? findUnit(state.board, opts.targetId) : null;
  if (opts?.targetId && (!forced || forced.hp <= 0)) return "Target is gone";
  const enemy = forced ?? enemyFirstInRow(state.board, attacker.owner, attacker.row);
  const hqOwner: PlayerId = attacker.owner === 0 ? 1 : 0;

  if (!enemy) {
    const dmg = extraGunHqDamage(state, attacker, hqOwner);
    pushAttack(state, attacker, { hq: hqOwner }, { damage: dmg, power: extraGunPower(attacker) + armorPiercingOf(attacker) });
    applyHqDamage(state, hqOwner, dmg, attacker.name, strikeSource(state, attacker, "attack"));
    afterGunAttack(state, attacker);
    fireFollowupMissile(state, attacker);
    resolveDestroyedUnits(state);
    return null;
  }

  const dmg = extraGunDamage(state, attacker, enemy);
  pushAttack(state, attacker, { col: enemy.col, row: enemy.row }, {
    damage: dmg,
    power: extraGunPower(attacker) + armorPiercingOf(attacker),
  });
  applyUnitDamage(state, enemy, dmg, attacker.name, strikeSource(state, attacker, "attack"));
  afterGunAttack(state, attacker);
  fireFollowupMissile(state, attacker);
  resolveDestroyedUnits(state);
  return null;
}

function fireFollowupMissile(state: MatchState, attacker: UnitInstance): void {
  if (missilePowerOf(state, attacker) > 0 && attacker.hp > 0) {
    resolveMissileShot(state, attacker);
  }
}

export function canStayAndShoot(unit: UnitInstance): boolean {
  return hasKeyword(unit, "artillery") || hasKeyword(unit, "airStrike") || hasKeyword(unit, "jetPlane");
}
