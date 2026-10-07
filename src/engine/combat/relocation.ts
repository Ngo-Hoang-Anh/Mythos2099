import { forwardCol, isFrontline, supportCol, frontCol, unitsOf } from "../board";
import { hasKeyword } from "../keywords";
import { log, withLogGroup } from "../state";
import { ROWS, type MatchState, type UnitInstance } from "../types";
import {
  combatMove,
  fightsFromSupport,
  isBattery,
  livingEnemyInLane,
  sideUnitsInLane,
  type CombatCtx,
} from "./helpers";

type Cell = { col: number; row: number };

function destColFor(unit: UnitInstance): number {
  return isBattery(unit) ? supportCol(unit.owner) : frontCol(unit.owner);
}

function laneHasOwnBatteryOnSupport(state: MatchState, owner: UnitInstance["owner"], lane: number): boolean {
  const unit = state.board[supportCol(owner)][lane];
  return Boolean(unit && unit.hp > 0 && isBattery(unit));
}

function laneHasNoAllies(state: MatchState, owner: UnitInstance["owner"], lane: number): boolean {
  return sideUnitsInLane(state, owner, lane).every((unit) => unit.hp <= 0);
}

function cellOpen(state: MatchState, col: number, row: number, unit: UnitInstance): boolean {
  const occ = state.board[col][row];
  return !occ || occ.instanceId === unit.instanceId;
}

function pickBest(
  state: MatchState,
  unit: UnitInstance,
  lanes: number[],
  tierOf: (lane: number) => number,
): Cell | null {
  const col = destColFor(unit);
  let best: Cell | null = null;
  let bestScore = -Infinity;
  for (const lane of lanes) {
    if (!cellOpen(state, col, lane, unit)) continue;
    if (col === unit.col && lane === unit.row) continue;
    const dist = Math.abs(col - unit.col) + Math.abs(lane - unit.row);
    const score = tierOf(lane) * 1000 - dist * 10 - lane;
    if (score > bestScore) {
      bestScore = score;
      best = { col, row: lane };
    }
  }
  return best;
}

function coverDest(state: MatchState, unit: UnitInstance): Cell | null {
  if (livingEnemyInLane(state, unit.owner, unit.row)) return null;
  const lanes: number[] = [];
  for (let lane = 0; lane < ROWS; lane++) {
    if (!livingEnemyInLane(state, unit.owner, lane)) continue;
    lanes.push(lane);
  }
  return pickBest(state, unit, lanes, (lane) => {
    if (laneHasOwnBatteryOnSupport(state, unit.owner, lane)) return 2;
    if (laneHasNoAllies(state, unit.owner, lane)) return 1;
    return 0;
  });
}

function flankDest(state: MatchState, unit: UnitInstance): Cell | null {
  if (!livingEnemyInLane(state, unit.owner, unit.row)) return null;
  const lanes: number[] = [];
  for (let lane = 0; lane < ROWS; lane++) {
    if (livingEnemyInLane(state, unit.owner, lane)) continue;
    lanes.push(lane);
  }
  return pickBest(state, unit, lanes, (lane) => (laneHasNoAllies(state, unit.owner, lane) ? 1 : 0));
}

function restIfLeftSupport(state: MatchState, ctx: CombatCtx, unit: UnitInstance, fromCol: number): void {
  if (isFrontline(unit.owner, unit.col) && !isFrontline(unit.owner, fromCol)) {
    unit.rested = true;
    ctx.steps.push({ kind: "rest", unitId: unit.instanceId });
    log(state, `${unit.name} rests`);
  }
}

function applyFlank(state: MatchState, ctx: CombatCtx, unit: UnitInstance): void {
  if (!hasKeyword(unit, "flank")) return;
  const dest = flankDest(state, unit);
  if (!dest) return;
  const fromCol = unit.col;
  combatMove(state, ctx, unit, dest.col, dest.row);
  log(state, `${unit.name} Flank → lane ${dest.row + 1}`, "flank");
  restIfLeftSupport(state, ctx, unit, fromCol);
}

function applyCover(state: MatchState, ctx: CombatCtx, unit: UnitInstance): void {
  if (!hasKeyword(unit, "cover")) return;
  const dest = coverDest(state, unit);
  if (!dest) return;
  const fromCol = unit.col;
  combatMove(state, ctx, unit, dest.col, dest.row);
  log(state, `${unit.name} Cover → lane ${dest.row + 1}`, "cover");
  restIfLeftSupport(state, ctx, unit, fromCol);
}

function tryAdvance(state: MatchState, ctx: CombatCtx, unit: UnitInstance): void {
  if (fightsFromSupport(unit) || isFrontline(unit.owner, unit.col)) return;
  const dest = forwardCol(unit.owner, unit.col);
  if (dest !== null && !state.board[dest][unit.row]) {
    combatMove(state, ctx, unit, dest, unit.row);
    unit.rested = true;
    ctx.steps.push({ kind: "rest", unitId: unit.instanceId });
    log(state, `${unit.name} advances and rests`);
  }
}

function sweepLanes(
  state: MatchState,
  ctx: CombatCtx,
  each: (unit: UnitInstance) => void,
  willAct: (unit: UnitInstance) => boolean,
): void {
  for (let lane = 0; lane < ROWS; lane++) {
    const units = sideUnitsInLane(state, ctx.attacker, lane);
    if (!units.some(willAct)) continue;
    ctx.steps.push({ kind: "lane", lane, color: "green" });
    for (const unit of units) {
      each(unit);
    }
  }
}

function livingAttackers(state: MatchState, ctx: CombatCtx): UnitInstance[] {
  return unitsOf(state.board, ctx.attacker).filter((unit) => unit.hp > 0);
}

function canAdvance(state: MatchState, unit: UnitInstance): boolean {
  if (fightsFromSupport(unit) || isFrontline(unit.owner, unit.col) || unit.hp <= 0) return false;
  const dest = forwardCol(unit.owner, unit.col);
  return dest !== null && !state.board[dest][unit.row];
}

export function runRelocationPhase(state: MatchState, ctx: CombatCtx): void {
  if (livingAttackers(state, ctx).some((unit) => hasKeyword(unit, "flank") && flankDest(state, unit) !== null)) {
    ctx.steps.push({ kind: "phase", phase: "relocation", detail: "Flank" });
    withLogGroup(state, "Flank", "flank", () => {
      sweepLanes(
        state,
        ctx,
        (unit) => applyFlank(state, ctx, unit),
        (unit) => hasKeyword(unit, "flank") && flankDest(state, unit) !== null,
      );
    });
  }
  if (livingAttackers(state, ctx).some((unit) => hasKeyword(unit, "cover") && coverDest(state, unit) !== null)) {
    ctx.steps.push({ kind: "phase", phase: "relocation", detail: "Cover" });
    withLogGroup(state, "Cover", "cover", () => {
      sweepLanes(
        state,
        ctx,
        (unit) => applyCover(state, ctx, unit),
        (unit) => hasKeyword(unit, "cover") && coverDest(state, unit) !== null,
      );
    });
  }
  if (livingAttackers(state, ctx).some((unit) => canAdvance(state, unit))) {
    ctx.steps.push({ kind: "phase", phase: "relocation", detail: "Advance" });
    withLogGroup(state, "Advance", undefined, () => {
      sweepLanes(
        state,
        ctx,
        (unit) => tryAdvance(state, ctx, unit),
        (unit) => canAdvance(state, unit),
      );
    });
  }
}
