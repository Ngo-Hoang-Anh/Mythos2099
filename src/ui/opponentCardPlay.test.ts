import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import { createMatch } from "../engine/match";
import { cloneState } from "../engine/state";
import { opponentCardPlay } from "./opponentCardPlay";

function played(actor: 0 | 1 = 0) {
  const prev = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
  prev.currentPlayer = actor;
  const next = cloneState(prev);
  const card = next.players[actor].hand[0];
  next.players[actor].hand = next.players[actor].hand.slice(1);
  next.players[actor].discard = [...next.players[actor].discard, card];
  next.log = [...next.log, { text: `Played ${card.name}`, icon: "card" }];
  return { prev, next, card };
}

describe("opponentCardPlay", () => {
  it("reports a card the other seat just played", () => {
    const { prev, next, card } = played();
    expect(opponentCardPlay(prev, next, 1)).toEqual({ card, actor: 0 });
  });

  it("hides the viewer's own play unless hotseat asks for both seats", () => {
    const { prev, next, card } = played();
    expect(opponentCardPlay(prev, next, 0)).toBeNull();
    expect(opponentCardPlay(prev, next, 0, { includeSelf: true })?.card.instanceId).toBe(card.instanceId);
  });

  it("ignores a discard-redraw", () => {
    const prev = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
    const next = cloneState(prev);
    const card = next.players[0].hand[0];
    next.players[0].hand = next.players[0].hand.slice(1);
    next.players[0].discard = [...next.players[0].discard, card];
    next.log = [...next.log, { text: `Discarded ${card.name} to redraw (1/2)` }];
    expect(opponentCardPlay(prev, next, 1)).toBeNull();
  });

  it("ignores a rejected special that never left the hand", () => {
    const prev = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
    const next = cloneState(prev);
    const card = next.players[0].hand[0];
    next.log = [...next.log, { text: `That unit must be on the board to play ${card.name}` }];
    expect(opponentCardPlay(prev, next, 1)).toBeNull();
  });
});
