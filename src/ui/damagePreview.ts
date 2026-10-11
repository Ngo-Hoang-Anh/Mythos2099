import { enemyFirstInRow } from "../engine/board";
import { computeStrikeDamage, defenseArmor, missileDamage } from "../engine/combat";
import {
  canCounter,
  canVolley,
  combatTargetLane,
  strikeAtk,
  supportFireFromOthers,
  takesReturnFire,
} from "../engine/combat/helpers";
import { armorPiercingOf, hasKeyword } from "../engine/keywords";
import { isUntargetableBy, statusesOf } from "../engine/status";
import type { BoardPos, MatchState, PlayerId, UnitInstance } from "../engine/types";

export interface HpForecast {
  unitId: string;
  hp: number;
}

export type GunAim =
  | { to: BoardPos; hits: HpForecast[] }
  | { to: { hq: PlayerId }; hits: HpForecast[] };

/** Artillery repeat bonus without recording the hit. */
function repeatBonus(state: MatchState, shooter: UnitInstance, targetKey: string): number {
  if (!hasKeyword(shooter, "artillery")) return 0;
  const statuses = statusesOf(state, "artilleryRepeat", shooter.owner);
  if (statuses.length === 0) return 0;
  const prior = (statuses[0].hitKeys ?? []).filter((key) => key === targetKey).length;
  const bonus = statuses.reduce((sum, status) => sum + status.magnitude, 0);
  return prior >= 1 ? bonus : 0;
}

function volleyAp(state: MatchState, unit: UnitInstance): number {
  let ap = armorPiercingOf(unit);
  if (
    statusesOf(state, "supportFireGrantsAp", unit.owner).length > 0 &&
    supportFireFromOthers(state, unit).amount > 0
  ) {
    ap += 2;
  }
  return ap;
}

function gunDamage(state: MatchState, shooter: UnitInstance, target: UnitInstance, asAttacker: boolean): number {
  return computeStrikeDamage({
    atk: strikeAtk(state, shooter, asAttacker) + repeatBonus(state, shooter, target.instanceId),
    armor: defenseArmor(target),
    armorPiercing: volleyAp(state, shooter),
  });
}

/** Where a normal attack would land, and HP after the shot plus return fire. */
export function gunAim(state: MatchState, shooter: UnitInstance): GunAim | null {
  if (shooter.hp <= 0 || !canVolley(shooter)) return null;
  const foe: PlayerId = shooter.owner === 0 ? 1 : 0;
  const lane = combatTargetLane(state, shooter);
  const target = enemyFirstInRow(state.board, shooter.owner, lane);
  if (!target || target.hp <= 0) return { to: { hq: foe }, hits: [] };

  const hits: HpForecast[] = [];
  const dealt = gunDamage(state, shooter, target, true);
  if (dealt > 0) hits.push({ unitId: target.instanceId, hp: Math.max(0, target.hp - dealt) });
  if (takesReturnFire(shooter) && canCounter(target)) {
    const back = gunDamage(state, target, shooter, false);
    if (back > 0) hits.push({ unitId: shooter.instanceId, hp: Math.max(0, shooter.hp - back) });
  }
  return { to: { col: target.col, row: target.row }, hits };
}

/** HP the locked missile would leave on its target. Null when the shot would not connect. */
export function missileAimHit(state: MatchState, shooter: UnitInstance): HpForecast | null {
  if (shooter.hp <= 0 || !shooter.missileTarget) return null;
  const pos = shooter.missileTarget;
  const unit = state.board[pos.col]?.[pos.row];
  if (!unit || unit.hp <= 0 || unit.owner === shooter.owner) return null;
  if (isUntargetableBy(state, unit, shooter.owner)) return null;
  const dealt = missileDamage(state, shooter, unit);
  if (dealt <= 0) return null;
  return { unitId: unit.instanceId, hp: Math.max(0, unit.hp - dealt) };
}
