/** Discard 2 cards from hand → reduce summon cost by 1. */

export function supplyGap(cost: number, supply: number): number {
  return Math.max(0, cost - supply);
}

/** Cards that must be discarded to cover a Supply shortfall. */
export function discardsNeeded(cost: number, supply: number): number {
  return supplyGap(cost, supply) * 2;
}

export function maxCostReduction(handSize: number): number {
  return Math.floor(handSize / 2);
}

export function canAffordDeploy(cost: number, supply: number, handSize: number): boolean {
  return supply + maxCostReduction(handSize) >= cost;
}

/**
 * True only when the opponent has more units on the board, this is still the
 * first summon of the turn, no reserve unit is affordable with Supply alone,
 * but at least one is with discards.
 */
export function needsDesperateMeasure(
  costs: number[],
  supply: number,
  handSize: number,
  deploysThisTurn = 0,
  ownBoardUnits = 0,
  enemyBoardUnits = 0,
): boolean {
  if (enemyBoardUnits <= ownBoardUnits) return false;
  if (deploysThisTurn > 0) return false;
  if (costs.length === 0) return false;
  if (costs.some((cost) => cost <= supply)) return false;
  return costs.some((cost) => canAffordDeploy(cost, supply, handSize));
}
