import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import { projectMatch } from "../net/view";
import {
  buildEnemyDeckTracker,
  buildSelfDeckTracker,
  drawAtLeastOneChance,
  foggedDrawAtLeastOneChance,
  remainingDeckCards,
  revealUnit,
  unitsWithCard,
} from "./deckTracker";
import { createMatch } from "./match";
import { DISCARD_REDRAW_LIMIT, DRAW_PER_TURN } from "./types";

describe("drawAtLeastOneChance", () => {
  it("is 0 with no copies or empty deck", () => {
    expect(drawAtLeastOneChance(0, 10, 2)).toBe(0);
    expect(drawAtLeastOneChance(2, 0, 2)).toBe(0);
  });

  it("matches hypergeometric for drawing 2", () => {
    // N=5, X=1, draw 2 → P = 1 - C(4,2)/C(5,2) = 1 - 6/10 = 0.4
    expect(drawAtLeastOneChance(1, 5, 2)).toBeCloseTo(0.4, 5);
  });

  it("is 1 when every draw must hit", () => {
    expect(drawAtLeastOneChance(4, 4, 2)).toBe(1);
    expect(drawAtLeastOneChance(3, 4, 2)).toBe(1);
  });
});

describe("foggedDrawAtLeastOneChance", () => {
  it("reduces odds when copies may sit in hand", () => {
    const allInDeck = drawAtLeastOneChance(2, 10, 2);
    const fogged = foggedDrawAtLeastOneChance(2, 14, 10, 2);
    expect(fogged).toBeLessThan(allInDeck);
    expect(fogged).toBeGreaterThan(0);
  });
});

describe("self deck tracker", () => {
  it("reconstructs remaining cards under fog and matches live deck", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 7);
    const live = remainingDeckCards(match.players[0]);
    expect(live).toHaveLength(match.players[0].deck.length);

    const view = projectMatch(match, 0);
    const fogged = remainingDeckCards(view.players[0]);
    expect(fogged).toHaveLength(view.players[0].deck.length);
    expect(fogged.map((c) => `${c.type}:${c.name}`).sort()).toEqual(
      live.map((c) => `${c.type}:${c.name}`).sort(),
    );

    const tracker = buildSelfDeckTracker(view.players[0]);
    expect(tracker.deckSize).toBe(view.players[0].deck.length);
    expect(tracker.rows.every((r) => r.recyclePct >= r.basePct)).toBe(true);
  });
});

describe("enemy deck tracker", () => {
  it("only counts revealed units, shows burns, and maps cards to units", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 11);
    const unitId = match.players[1].army[0]!;
    revealUnit(match.players[1], unitId);

    const burned = match.players[1].deck.pop()!;
    match.players[1].discard.push(burned);

    const view = projectMatch(match, 0);
    const enemy = view.players[1];
    expect(enemy.army).toEqual([]);
    expect(enemy.revealedUnitIds).toContain(unitId);
    expect(enemy.discard.some((c) => c.name === burned.name)).toBe(true);

    const tracker = buildEnemyDeckTracker(enemy);
    expect(tracker.discarded.some((c) => c.name === burned.name)).toBe(true);
    expect(tracker.rows.some((r) => r.unknown)).toBe(true);

    const known = tracker.rows.find((r) => !r.unknown);
    expect(known).toBeTruthy();
    const units = unitsWithCard(tracker.revealedUnitIds, known!.name, known!.type);
    expect(units.some((u) => u.id === unitId)).toBe(true);
  });
});

describe("draw constants", () => {
  it("uses turn draw 2 and recycle limit 2 for the red column", () => {
    expect(DRAW_PER_TURN).toBe(2);
    expect(DISCARD_REDRAW_LIMIT).toBe(2);
  });
});
