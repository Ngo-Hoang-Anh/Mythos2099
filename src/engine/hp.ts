import { countUnits } from "./board";
import { nextRng } from "./rng";
import { log } from "./state";
import {
  HQ_BREAKPOINTS,
  HQ_MAX_HP,
  type CombatStep,
  type LogIcon,
  type MatchState,
  type PlayerId,
  type UnitInstance,
} from "./types";

export interface HqBreakpointHit {
  bp: number;
  supply: number;
  draw: number;
}

/** Board units + undeployed reserve (excluding hidden 0 placeholders). */
export function armyPresence(state: MatchState, playerId: PlayerId): number {
  const reserve = state.players[playerId].undeployed.filter((id) => id !== 0).length;
  return countUnits(state.board, playerId) + reserve;
}

/** Queue +1 Supply and +1 draw for the player's next turn. */
export function grantNextTurnComeback(
  state: MatchState,
  playerId: PlayerId,
  reason: string,
): void {
  const player = state.players[playerId];
  player.nextTurnSupplyBonus += 1;
  player.nextTurnDrawBonus += 1;
  log(
    state,
    `Comeback (${reason}): P${playerId + 1} +1 Supply & +1 draw next turn`,
    "supply",
  );
}

/** Random discard from hand. Returns card name, or null if hand empty. */
export function discardOneFromHand(state: MatchState, playerId: PlayerId): string | null {
  const player = state.players[playerId];
  if (player.hand.length === 0) return null;
  const roll = nextRng(state.rngState);
  state.rngState = roll.state;
  const idx = Math.floor(roll.value * player.hand.length);
  const [discarded] = player.hand.splice(idx, 1);
  player.discard.push(discarded);
  return discarded.name;
}

/** Mill top of deck into discard. Returns card name, or null if deck empty. */
export function millTopOfDeck(state: MatchState, playerId: PlayerId): string | null {
  const player = state.players[playerId];
  const card = player.deck.shift();
  if (!card) return null;
  player.discard.push(card);
  return card.name;
}

/**
 * Spend one legacy penalty discard: discard from hand, or mill deck if hand is empty.
 * Kept for tools/tests that still call it; HQ punish no longer uses this path.
 */
export function resolveOnePenaltyDiscard(
  state: MatchState,
  playerId: PlayerId,
): { kind: "hand" | "deck"; name: string } | null {
  const fromHand = discardOneFromHand(state, playerId);
  if (fromHand) return { kind: "hand", name: fromHand };
  const fromDeck = millTopOfDeck(state, playerId);
  if (fromDeck) return { kind: "deck", name: fromDeck };
  return null;
}

export function applyHqDamage(
  state: MatchState,
  defender: PlayerId,
  amount: number,
  source: string,
  opts?: { keepPhase?: boolean; icon?: LogIcon; via?: string },
): HqBreakpointHit[] {
  if (amount <= 0 || state.winner !== null) return [];
  const player = state.players[defender];
  const before = player.hqHp;
  player.hqHp = Math.max(0, player.hqHp - amount);
  const via = opts?.via ?? "ATK";
  log(state, `${source} deals ${amount} with ${via} to HQ (P${defender + 1}: ${before} → ${player.hqHp})`, opts?.icon ?? "atk");

  const foe: PlayerId = defender === 0 ? 1 : 0;
  const hits: HqBreakpointHit[] = [];
  for (const bp of HQ_BREAKPOINTS) {
    if (before > bp && player.hqHp <= bp && !player.triggeredBreakpoints.includes(bp)) {
      player.triggeredBreakpoints.push(bp);
      if (player.hqHp < state.players[foe].hqHp) {
        grantNextTurnComeback(state, defender, `HQ ${bp}`);
        hits.push({ bp, supply: 1, draw: 1 });
      } else {
        log(
          state,
          `HQ ${bp}: P${defender + 1} crossed (no comeback — not behind on HQ)`,
          "supply",
        );
      }
    }
  }

  if (player.hqHp <= 0) {
    state.winner = defender === 0 ? 1 : 0;
    state.winReason = "hq";
    if (!opts?.keepPhase) {
      state.phase = "gameover";
      log(state, `P${state.winner + 1} wins — HQ destroyed`);
    }
  }
  return hits;
}

export function pushHqDamageSteps(
  steps: CombatStep[],
  player: PlayerId,
  hp: number,
  damage: number,
  hits: HqBreakpointHit[],
): void {
  steps.push({ kind: "hq", player, hp, damage });
  for (const hit of hits) {
    steps.push({
      kind: "hqBreakpoint",
      player,
      bp: hit.bp,
      supply: hit.supply,
      draw: hit.draw,
    });
  }
}

export function applyUnitDamage(
  state: MatchState,
  target: UnitInstance,
  amount: number,
  source: string,
  opts?: { icon?: LogIcon; via?: string },
): void {
  if (amount <= 0 || target.hp <= 0) return;
  target.hp -= amount;
  const via = opts?.via ?? "ATK";
  log(state, `${source} deals ${amount} with ${via} to ${target.name} (${Math.max(target.hp, 0)} HP)`, opts?.icon ?? "atk");
  // Do not remove from the board here — call resolveDestroyedUnits / runCleanupPhase
  // so 0 HP destroys go through the same resolve path as combat.
}

export function healUnit(unit: UnitInstance, amount: number): number {
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  return unit.hp - before;
}

export function healHq(state: MatchState, playerId: PlayerId, amount: number): number {
  const player = state.players[playerId];
  const before = player.hqHp;
  player.hqHp = Math.min(HQ_MAX_HP, player.hqHp + amount);
  return player.hqHp - before;
}

/** After a friendly unit leaves the board as destroyed, maybe grant unit-death comeback. */
export function maybeUnitDeathComeback(
  state: MatchState,
  owner: PlayerId,
  unitName: string,
): void {
  const foe: PlayerId = owner === 0 ? 1 : 0;
  if (armyPresence(state, owner) >= armyPresence(state, foe)) return;
  grantNextTurnComeback(state, owner, `${unitName} destroyed`);
}
