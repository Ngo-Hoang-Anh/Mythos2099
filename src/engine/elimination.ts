import { getUnitDef } from "../data/units";
import { countUnits, unitsOf } from "./board";
import { canAffordDeploy } from "./desperateMeasure";
import { log } from "./state";
import { BASE_SUPPLY, type MatchState, type PlayerId } from "./types";

/** True if any reserve unit can be fielded with Supply and/or Desperate Measure. */
export function canFieldAnyReserve(
  reserveCosts: readonly number[],
  supply: number,
  handSize: number,
  ownBoardUnits: number,
  enemyBoardUnits: number,
): boolean {
  if (reserveCosts.length === 0) return false;
  if (reserveCosts.some((cost) => cost <= supply)) return true;
  if (enemyBoardUnits <= ownBoardUnits) return false;
  return reserveCosts.some((cost) => canAffordDeploy(cost, supply, handSize));
}

/** Supply the player would have at the start of Deployment with the current board. */
export function projectedDeploySupply(state: MatchState, playerId: PlayerId): number {
  return BASE_SUPPLY + countUnits(state.board, playerId);
}

/**
 * No units on the board, deck empty, and no reserve unit can be summoned
 * (normal Supply or Desperate Measure).
 */
export function isPlayerEliminated(
  state: MatchState,
  playerId: PlayerId,
  supply = projectedDeploySupply(state, playerId),
): boolean {
  if (unitsOf(state.board, playerId).length > 0) return false;
  const player = state.players[playerId];
  if (player.deck.length > 0) return false;
  const enemy: PlayerId = playerId === 0 ? 1 : 0;
  const costs = player.undeployed.filter((id) => id !== 0).map((id) => getUnitDef(id).cost);
  return !canFieldAnyReserve(
    costs,
    supply,
    player.hand.length,
    0,
    unitsOf(state.board, enemy).length,
  );
}

/** If a player is eliminated, set winner and gameover. Returns true when the match ended. */
export function applyEliminationLoss(state: MatchState, supplyByPlayer?: [number, number]): boolean {
  if (state.winner !== null) return false;
  const e0 = isPlayerEliminated(state, 0, supplyByPlayer?.[0]);
  const e1 = isPlayerEliminated(state, 1, supplyByPlayer?.[1]);
  if (!e0 && !e1) return false;

  let winner: PlayerId;
  if (e0 && e1) {
    const h0 = state.players[0].hqHp;
    const h1 = state.players[1].hqHp;
    if (h0 !== h1) winner = h0 > h1 ? 0 : 1;
    else winner = state.currentPlayer === 0 ? 1 : 0;
  } else {
    winner = e0 ? 1 : 0;
  }

  state.winner = winner;
  state.winReason = "elimination";
  state.phase = "gameover";
  log(state, `P${winner + 1} wins — opponent has no forces left`);
  return true;
}
