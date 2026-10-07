import { cloneBoard } from "../board";
import { applyEliminationLoss } from "../elimination";
import { log, withLogGroup } from "../state";
import type { CombatCtx, ExtraEngagement } from "./helpers";
import { clearStrikeFlags } from "./helpers";
import { runCleanupPhase } from "./cleanup";
import { runDamagePhase } from "./damage";
import { runMissilePhase } from "./missile";
import { runRelocationPhase } from "./relocation";
import { runStatsPhase } from "./stats";
import type { MatchState, Phase, PlayerId, UnitInstance } from "../types";

export interface EngagementOpts {
  /** Mid-turn extra combat (Lure / Quick Engagement) keeps current positions. */
  skipRelocation?: boolean;
  /** Restore this phase after playback instead of passing the turn. */
  resumePhase?: Phase;
  /** Extra engagement: only these units in this lane fight. */
  extra?: ExtraEngagement;
  /** Who volleys first (Aggressive). Defaults to the current player. */
  attacker?: PlayerId;
}

/** One unit (and its facing foe) fights with keyword buffs. Other rows are untouched. */
export function beginExtraEngagement(
  state: MatchState,
  units: Array<UnitInstance | null | undefined>,
  opts?: { attacker?: PlayerId },
): void {
  const living = units.filter((unit): unit is UnitInstance => Boolean(unit && unit.hp > 0));
  const primary = living[0];
  if (!primary) return;
  const participantIds = [...new Set(living.filter((unit) => unit.row === primary.row).map((unit) => unit.instanceId))];
  beginEngagement(state, {
    skipRelocation: true,
    resumePhase: "maneuver",
    extra: { lane: primary.row, participantIds },
    attacker: opts?.attacker,
  });
}

export function beginEngagement(state: MatchState, opts?: EngagementOpts): void {
  if (state.winner !== null) return;
  const attacker = opts?.attacker ?? state.currentPlayer;
  const defender: 0 | 1 = attacker === 0 ? 1 : 0;
  const initialBoard = cloneBoard(state.board);
  const initialHq: [number, number] = [state.players[0].hqHp, state.players[1].hqHp];
  const ctx: CombatCtx = { attacker, defender, steps: [], extra: opts?.extra };

  state.combatResumePhase = opts?.resumePhase ?? null;
  state.phase = "engagement";
  withLogGroup(
    state,
    `P${attacker + 1} Engagement`,
    undefined,
    () => {
      clearStrikeFlags(state);
      if (!opts?.skipRelocation) runRelocationPhase(state, ctx);
      runStatsPhase(state, ctx);
      runDamagePhase(state, ctx);
      runMissilePhase(state, ctx);
      runCleanupPhase(state, ctx);
      if (state.winner !== null) {
        log(state, `P${state.winner + 1} wins — HQ destroyed`);
        state.winReason = "hq";
      }
    },
    true,
  );

  if (state.winner === null) applyEliminationLoss(state);

  if (state.winner !== null) {
    state.phase = "gameover";
  }
  state.combatPlayback = { steps: ctx.steps, initialBoard, initialHq };
}

export { runRelocationPhase, runStatsPhase, runDamagePhase, runCleanupPhase, runMissilePhase };
