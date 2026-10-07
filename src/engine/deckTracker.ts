import { isInitiativeCard } from "../data/initiative";
import { getUnitDef } from "../data/units";
import { deckCardsOf } from "./army";
import { countCards, type CardCount } from "./armySummary";
import {
  DISCARD_REDRAW_LIMIT,
  DRAW_PER_TURN,
  type CardInstance,
  type CardType,
  type PlayerState,
} from "./types";

export type TrackerCardKey = string;

export interface TrackerRow {
  key: TrackerCardKey;
  name: string;
  type: CardType;
  cost: number;
  count: number;
  /** Chance to see ≥1 copy in the next turn draw (2 cards). */
  basePct: number;
  /** Chance if also using both recycle draws (+2). Shown in red in UI. */
  recyclePct: number;
  unknown?: boolean;
}

export interface DeckTrackerModel {
  deckSize: number;
  handSize: number;
  rows: TrackerRow[];
  /** Opponent burns / plays that left the hidden zone. */
  discarded: CardCount[];
  revealedUnitIds: number[];
}

export function cardTrackerKey(card: { type: CardType; name: string }): TrackerCardKey {
  return `${card.type}:${card.name}`;
}

/** P(draw ≥1 copy of a card) when drawing `draws` without replacement from a deck of `deckSize`. */
export function drawAtLeastOneChance(copies: number, deckSize: number, draws: number): number {
  if (copies <= 0 || deckSize <= 0 || draws <= 0) return 0;
  const k = Math.min(draws, deckSize);
  if (copies >= deckSize) return 1;
  if (deckSize - copies < k) return 1;
  let pNone = 1;
  for (let i = 0; i < k; i++) {
    pNone *= (deckSize - copies - i) / (deckSize - i);
  }
  return Math.max(0, Math.min(1, 1 - pNone));
}

function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= kk; i++) {
    r = (r * (n - kk + i)) / i;
  }
  return r;
}

/** Hypergeometric PMF: draw `n` from population `N` with `K` successes, exactly `k` hits. */
export function hypergeometricPmf(K: number, N: number, n: number, k: number): number {
  if (N <= 0 || n < 0 || n > N) return 0;
  return binom(K, k) * binom(N - K, n - k) / binom(N, n);
}

/**
 * Opponent fog: known copies sit in hand∪deck. Deck is a random size-`deckSize` subset
 * of that hidden zone; then draw `draws` from the deck.
 */
export function foggedDrawAtLeastOneChance(
  copiesInHidden: number,
  hiddenSize: number,
  deckSize: number,
  draws: number,
): number {
  if (copiesInHidden <= 0 || hiddenSize <= 0 || deckSize <= 0 || draws <= 0) return 0;
  const n = Math.min(deckSize, hiddenSize);
  const minInDeck = Math.max(0, copiesInHidden - (hiddenSize - n));
  const maxInDeck = Math.min(copiesInHidden, n);
  let p = 0;
  for (let m = minInDeck; m <= maxInDeck; m++) {
    p += hypergeometricPmf(copiesInHidden, hiddenSize, n, m) * drawAtLeastOneChance(m, n, draws);
  }
  return Math.max(0, Math.min(1, p));
}

export function formatPct(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return "0%";
  if (p >= 0.999) return "100%";
  return `${Math.round(p * 100)}%`;
}

type SoftCard = { name: string; type: CardType; cost: number };

function removeOne(pool: SoftCard[], card: SoftCard): boolean {
  const idx = pool.findIndex((c) => c.type === card.type && c.name === card.name);
  if (idx < 0) return false;
  pool.splice(idx, 1);
  return true;
}

function armyCardPool(unitIds: number[]): SoftCard[] {
  return unitIds.flatMap((id) => {
    if (!id) return [];
    try {
      return deckCardsOf(getUnitDef(id)).map((c) => ({ name: c.name, type: c.type, cost: c.cost }));
    } catch {
      return [];
    }
  });
}

function isHiddenCard(card: CardInstance): boolean {
  return card.templateId === "hidden";
}

/** Prefer live deck contents when not fogged (hotseat / tests). */
export function remainingDeckCards(player: PlayerState): SoftCard[] {
  if (player.deck.length > 0 && player.deck.every((c) => !isHiddenCard(c))) {
    return player.deck.map((c) => ({ name: c.name, type: c.type, cost: c.cost }));
  }
  const army = player.army?.length ? player.army : [];
  const pool = armyCardPool(army);
  for (const card of [...player.hand, ...player.discard]) {
    if (isHiddenCard(card) || isInitiativeCard(card)) continue;
    removeOne(pool, card);
  }
  return pool;
}

function rowsFromRemaining(
  remaining: SoftCard[],
  pct: (copies: number) => { basePct: number; recyclePct: number },
): TrackerRow[] {
  return countCards(remaining).map((card) => {
    const odds = pct(card.count);
    return {
      key: cardTrackerKey(card),
      name: card.name,
      type: card.type,
      cost: card.cost,
      count: card.count,
      basePct: odds.basePct,
      recyclePct: odds.recyclePct,
    };
  });
}

export function buildSelfDeckTracker(player: PlayerState): DeckTrackerModel {
  const remaining = remainingDeckCards(player);
  const deckSize = player.deck.length;
  const draw = DRAW_PER_TURN;
  const recycleDraws = DRAW_PER_TURN + DISCARD_REDRAW_LIMIT;
  const rows = rowsFromRemaining(remaining, (copies) => ({
    basePct: drawAtLeastOneChance(copies, deckSize, draw),
    recyclePct: drawAtLeastOneChance(copies, deckSize, recycleDraws),
  }));
  return {
    deckSize,
    handSize: player.hand.filter((c) => !isHiddenCard(c)).length || player.hand.length,
    rows,
    discarded: countCards(
      player.discard.filter((c) => !isHiddenCard(c) && !isInitiativeCard(c)),
    ),
    revealedUnitIds: [...(player.army ?? [])],
  };
}

export function buildEnemyDeckTracker(player: PlayerState): DeckTrackerModel {
  const revealed = [...(player.revealedUnitIds ?? [])];
  const knownPool = armyCardPool(revealed);
  const discardedVisible = player.discard.filter((c) => !isHiddenCard(c) && !isInitiativeCard(c));
  const stillOut = [...knownPool];
  for (const card of discardedVisible) {
    removeOne(stillOut, card);
  }

  const deckSize = player.deck.length;
  const handSize = player.hand.length;
  const hiddenSize = deckSize + handSize;
  const unknownCount = Math.max(0, hiddenSize - stillOut.length);
  const draw = DRAW_PER_TURN;
  const recycleDraws = DRAW_PER_TURN + DISCARD_REDRAW_LIMIT;

  const rows = rowsFromRemaining(stillOut, (copies) => ({
    basePct: foggedDrawAtLeastOneChance(copies, hiddenSize, deckSize, draw),
    recyclePct: foggedDrawAtLeastOneChance(copies, hiddenSize, deckSize, recycleDraws),
  }));

  if (unknownCount > 0) {
    rows.push({
      key: "unknown",
      name: "Unknown",
      type: "maneuver",
      cost: 0,
      count: unknownCount,
      basePct: foggedDrawAtLeastOneChance(unknownCount, hiddenSize, deckSize, draw),
      recyclePct: foggedDrawAtLeastOneChance(unknownCount, hiddenSize, deckSize, recycleDraws),
      unknown: true,
    });
  }

  return {
    deckSize,
    handSize,
    rows,
    discarded: countCards(discardedVisible),
    revealedUnitIds: revealed,
  };
}

/** Units (from an id list) that include a card matching name+type. */
export function unitsWithCard(
  unitIds: number[],
  name: string,
  type: CardType,
): { id: number; name: string }[] {
  const out: { id: number; name: string }[] = [];
  for (const id of unitIds) {
    if (!id) continue;
    try {
      const def = getUnitDef(id);
      if (def.cards.some((c) => c.name === name && c.type === type)) {
        out.push({ id: def.id, name: def.name });
      }
    } catch {
      /* skip */
    }
  }
  return out;
}

export function revealUnit(player: PlayerState, unitDefId: number): void {
  if (!unitDefId) return;
  if (!player.revealedUnitIds) player.revealedUnitIds = [];
  if (!player.revealedUnitIds.includes(unitDefId)) {
    player.revealedUnitIds.push(unitDefId);
  }
}
