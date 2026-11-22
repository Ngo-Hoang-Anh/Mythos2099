import { enemyFirstInRow } from "../board";
import { hasFrontlineScout, hasKeyword } from "../keywords";
import { log } from "../state";
import { addStatus, hasStatusOn } from "../status";
import type { MatchState, PlayerId, UnitInstance } from "../types";

/** Smoke Screen: cannot be gun-targeted (Scout on Frontline ignores it). Missiles/skills still hit. */
export function smokeBlocksGun(
  state: MatchState,
  target: UnitInstance,
  shooterOwner: PlayerId,
): boolean {
  if (!hasStatusOn(state, target.instanceId, "smokeDodge")) return false;
  if (hasFrontlineScout(state, shooterOwner)) return false;
  return true;
}

/**
 * Gun target in a lane. If the facing enemy has Smoke Screen, return null so the shot goes to HQ
 * (does not retarget Support behind them). Missiles/skills do not use this.
 */
export function enemyFirstForGun(
  state: MatchState,
  attacker: PlayerId,
  row: number,
): UnitInstance | null {
  const first = enemyFirstInRow(state.board, attacker, row);
  if (!first || first.hp <= 0) return null;
  if (smokeBlocksGun(state, first, attacker)) return null;
  return first;
}

/** After taking HP damage, deploy Smoke for this turn + the next turn. Returns the new status id. */
export function deploySmokeAfterDamage(state: MatchState, target: UnitInstance): string | null {
  if (target.hp <= 0) return null;
  if (!hasKeyword(target, "smokeScreen")) return null;
  if (hasStatusOn(state, target.instanceId, "smokeDodge")) return null;
  const status = addStatus(state, {
    kind: "smokeDodge",
    sourceId: target.instanceId,
    owner: target.owner,
    targetId: target.instanceId,
    duration: "endOfNextTurn",
  });
  log(state, `${target.name} deploys Smoke Screen`, "smokeScreen");
  return status.id;
}
