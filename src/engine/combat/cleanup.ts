import { allUnits } from "../board";
import { maybeUnitDeathComeback } from "../hp";
import { log, withLogGroup } from "../state";
import type { MatchState } from "../types";
import type { CombatCtx } from "./helpers";

export function removeDeadUnits(state: MatchState, ctx: CombatCtx): void {
  const dead = allUnits(state.board).filter((u) => u.hp <= 0);
  for (const unit of dead) {
    state.board[unit.col][unit.row] = null;
    ctx.steps.push({ kind: "destroy", unitId: unit.instanceId });
    log(state, `${unit.name} is destroyed`, "hp");
    maybeUnitDeathComeback(state, unit.owner, unit.name);
  }
}

export function runCleanupPhase(state: MatchState, ctx: CombatCtx): void {
  if (!allUnits(state.board).some((unit) => unit.hp <= 0)) return;
  ctx.steps.push({ kind: "phase", phase: "cleanup" });
  withLogGroup(state, "Cleanup", "hp", () => {
    removeDeadUnits(state, ctx);
  });
}

/**
 * Resolve 0 HP units outside (or after) combat playback.
 * Card damage / extra attacks / missiles leave corpses at 0 HP; this is the
 * single place that decides to remove them from the board.
 */
export function resolveDestroyedUnits(state: MatchState): void {
  if (!allUnits(state.board).some((unit) => unit.hp <= 0)) return;
  // Extra engagements already ran cleanup inside combatPlayback; skip duplicate work.
  if (state.phase === "engagement" && state.combatPlayback) return;
  withLogGroup(state, "Cleanup", "hp", () => {
    for (const unit of allUnits(state.board).filter((u) => u.hp <= 0)) {
      state.board[unit.col][unit.row] = null;
      log(state, `${unit.name} is destroyed`, "hp");
      maybeUnitDeathComeback(state, unit.owner, unit.name);
    }
  });
}
