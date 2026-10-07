import {
  allUnits,
  enemyFirstInRow,
  enemySupportInRow,
  findUnit,
  frontCol,
  moveUnitOnBoard,
  supportCol,
  unitsOf,
} from "../board";
import { skipsReturnFire } from "../combat";
import { aggressiveOf, armorPiercingOf, hasKeyword, keywordValue, retaliateOf } from "../keywords";
import { hasStatusOn, isUntargetableBy, statusesOf } from "../status";
import type {
  CombatStep,
  LogIcon,
  MatchState,
  PlayerId,
  UnitInstance,
} from "../types";
import { ROWS } from "../types";

export interface ExtraEngagement {
  /** Only this lane fights. Other rows do not shoot or take gun/missile damage. */
  lane: number;
  /** Only these units volley. Keyword buffs still apply to them. */
  participantIds: string[];
}

export interface CombatCtx {
  attacker: PlayerId;
  defender: PlayerId;
  steps: CombatStep[];
  extra?: ExtraEngagement;
}

export function combatLanes(ctx: CombatCtx): number[] {
  if (ctx.extra) return [ctx.extra.lane];
  return Array.from({ length: ROWS }, (_, i) => i);
}

export function mayStrike(ctx: CombatCtx, unit: UnitInstance): boolean {
  if (!ctx.extra) return true;
  return ctx.extra.participantIds.includes(unit.instanceId);
}

export function extraFoe(state: MatchState, ctx: CombatCtx, shooter: UnitInstance): UnitInstance | null {
  if (!ctx.extra) return null;
  for (const id of ctx.extra.participantIds) {
    const unit = findUnit(state.board, id);
    if (unit && unit.owner !== shooter.owner && unit.hp > 0) return unit;
  }
  return null;
}

/** Extra matchups prefer participants, then normal lane facing — never skip a living blocker to HQ. */
export function extraVolleyTarget(
  state: MatchState,
  ctx: CombatCtx,
  shooter: UnitInstance,
): UnitInstance | null {
  if (!ctx.extra) return null;
  return extraFoe(state, ctx, shooter) ?? enemyFirstInRow(state.board, shooter.owner, ctx.extra.lane);
}

export function volleyTarget(
  state: MatchState,
  ctx: CombatCtx,
  shooter: UnitInstance,
): { unit: UnitInstance | null; lane: number } {
  if (ctx.extra) {
    return { unit: extraVolleyTarget(state, ctx, shooter), lane: ctx.extra.lane };
  }
  const lane = combatTargetLane(state, shooter);
  return { unit: enemyFirstInRow(state.board, shooter.owner, lane), lane };
}

export function laneHasUnrestedEnemy(state: MatchState, owner: PlayerId, lane: number): boolean {
  const foe: PlayerId = owner === 0 ? 1 : 0;
  return sideUnitsInLane(state, foe, lane).some((unit) => unit.hp > 0 && !unit.rested);
}

export function effectiveRetaliate(state: MatchState, unit: UnitInstance): number {
  if (!laneHasUnrestedEnemy(state, unit.owner, unit.row)) return 0;
  return retaliateOf(unit);
}

/** Aggressive on the attack volley, Retaliate on the counter. Trap locks all three. */
export function strikeCombatBonus(
  state: MatchState,
  unit: UnitInstance,
  asAttacker: boolean,
): { aggressive: number; retaliate: number; support: number; locked: boolean } {
  if (hasStatusOn(state, unit.instanceId, "atkUnmodifiable")) {
    return { aggressive: 0, retaliate: 0, support: 0, locked: true };
  }
  return {
    aggressive: asAttacker ? aggressiveOf(unit) : 0,
    retaliate: asAttacker ? 0 : effectiveRetaliate(state, unit),
    support: supportFireFromOthers(state, unit).amount,
    locked: false,
  };
}

export function strikeAtk(state: MatchState, unit: UnitInstance, asAttacker: boolean): number {
  const bonus = strikeCombatBonus(state, unit, asAttacker);
  if (bonus.locked) return unit.atk;
  return unit.atk + unit.tempAtk + bonus.aggressive + bonus.retaliate + bonus.support;
}

export function strikeSource(state: MatchState, unit: UnitInstance, side: "attack" | "counter" | "missile"): { icon: LogIcon; via: string } {
  if (side === "missile") return { icon: "missile", via: "Missile" };
  if (hasKeyword(unit, "artillery")) return { icon: "artillery", via: "Artillery" };
  if (hasKeyword(unit, "airStrike")) return { icon: "airStrike", via: "Air Strike" };
  if (side === "counter" && effectiveRetaliate(state, unit) > 0) return { icon: "retaliate", via: "Retaliate" };
  return { icon: "atk", via: "ATK" };
}

export function isBattery(unit: UnitInstance): boolean {
  return hasKeyword(unit, "artillery") || hasKeyword(unit, "airStrike");
}

export function fightsFromSupport(unit: UnitInstance): boolean {
  return isBattery(unit) || hasKeyword(unit, "jetPlane");
}

export function canVolley(unit: UnitInstance): boolean {
  if (fightsFromSupport(unit)) return true;
  return unit.col === frontCol(unit.owner);
}

/** Any non-Artillery unit can return fire when attacked — Front or Support, rested OK. 0 HP still counters, then dies. */
export function canCounter(unit: UnitInstance): boolean {
  return !skipsReturnFire(unit);
}

export function takesReturnFire(unit: UnitInstance): boolean {
  return unit.hp > 0 && !skipsReturnFire(unit);
}

export function sideUnitsInLane(state: MatchState, player: PlayerId, lane: number): UnitInstance[] {
  const front = state.board[frontCol(player)][lane];
  const support = state.board[supportCol(player)][lane];
  return [front, support].filter((u): u is UnitInstance => Boolean(u));
}

export function livingEnemyInLane(state: MatchState, attacker: PlayerId, lane: number): boolean {
  const first = enemyFirstInRow(state.board, attacker, lane);
  return Boolean(first && first.hp > 0);
}

export function combatMove(state: MatchState, ctx: CombatCtx, unit: UnitInstance, col: number, row: number): void {
  const from = { col: unit.col, row: unit.row };
  if (from.col === col && from.row === row) return;
  moveUnitOnBoard(state.board, unit, col, row);
  ctx.steps.push({
    kind: "move",
    unitId: unit.instanceId,
    name: unit.name,
    unitClass: unit.class,
    owner: unit.owner,
    from,
    to: { col, row },
  });
}

export function supportFireFromOthers(state: MatchState, unit: UnitInstance): { amount: number; sources: UnitInstance[] } {
  const sources: UnitInstance[] = [];
  let amount = 0;
  for (const giver of unitsOf(state.board, unit.owner)) {
    if (giver.instanceId === unit.instanceId || giver.hp <= 0) continue;
    if (Math.abs(giver.row - unit.row) > 1) continue;
    const value = keywordValue(giver, "supportFire");
    if (value <= 0) continue;
    amount += value;
    sources.push(giver);
  }
  return { amount, sources };
}

export function displayedAtk(unit: UnitInstance): number {
  return unit.atk + unit.tempAtk + unit.combatAtkBonus;
}

export function weaponPower(unit: UnitInstance): number {
  return displayedAtk(unit) + armorPiercingOf(unit);
}

export function preferMissileTarget(state: MatchState, attacker: PlayerId, lane: number): UnitInstance | null {
  const support = enemySupportInRow(state.board, attacker, lane);
  const first = enemyFirstInRow(state.board, attacker, lane);
  if (support && support.hp > 0 && !isUntargetableBy(state, support, attacker)) return support;
  if (first && first.hp > 0 && !isUntargetableBy(state, first, attacker)) return first;
  return null;
}

export function nearestMissileLane(state: MatchState, attacker: PlayerId, fromLane: number): number | null {
  let best: number | null = null;
  let bestDist = 99;
  for (let lane = 0; lane < ROWS; lane++) {
    if (lane === fromLane) continue;
    if (!preferMissileTarget(state, attacker, lane)) continue;
    const dist = Math.abs(lane - fromLane);
    if (dist < bestDist || (dist === bestDist && best !== null && lane < best)) {
      best = lane;
      bestDist = dist;
    }
  }
  return best;
}

export function pickMissileTarget(state: MatchState, shooter: UnitInstance): UnitInstance | null {
  const attacker = shooter.owner;
  const mark = statusesOf(state, "missileLaneMark", attacker)[0];
  if (mark?.lane !== undefined) {
    const marked = preferMissileTarget(state, attacker, mark.lane);
    if (marked) return marked;
  }
  const same = preferMissileTarget(state, attacker, shooter.row);
  if (same) return same;
  const lane = nearestMissileLane(state, attacker, shooter.row);
  if (lane === null) return null;
  return preferMissileTarget(state, attacker, lane);
}

export function nearestEnemyLane(state: MatchState, owner: PlayerId, fromLane: number): number | null {
  let best: number | null = null;
  let bestDist = 99;
  for (let lane = 0; lane < ROWS; lane++) {
    if (lane === fromLane) continue;
    if (!livingEnemyInLane(state, owner, lane)) continue;
    const dist = Math.abs(lane - fromLane);
    if (dist < bestDist || (dist === bestDist && best !== null && lane < best)) {
      best = lane;
      bestDist = dist;
    }
  }
  return best;
}

export function combatTargetLane(state: MatchState, unit: UnitInstance): number {
  const redirect = statusesOf(state, "redirectEmptyLane").find((status) => status.targetId === unit.instanceId);
  if (redirect && !livingEnemyInLane(state, unit.owner, unit.row)) {
    return nearestEnemyLane(state, unit.owner, unit.row) ?? unit.row;
  }
  return unit.row;
}

export function preferBackTarget(state: MatchState, attacker: PlayerId, lane: number): UnitInstance | null {
  const support = enemySupportInRow(state.board, attacker, lane);
  const first = enemyFirstInRow(state.board, attacker, lane);
  if (support && support.hp > 0) return support;
  if (first && first.hp > 0) return first;
  return null;
}

export function clearStrikeFlags(state: MatchState): void {
  for (const unit of allUnits(state.board)) {
    unit.combatAtkBonus = 0;
    unit.isAttacker = false;
  }
}

/** Combat-only flags — does not clear `rested` (that lasts until the turn passes). */
export function resetCombatFlags(state: MatchState): void {
  clearStrikeFlags(state);
}

export function clearRested(state: MatchState): void {
  for (const unit of allUnits(state.board)) {
    unit.rested = false;
  }
}

export function liveUnit(state: MatchState, id: string): UnitInstance | null {
  return findUnit(state.board, id);
}
