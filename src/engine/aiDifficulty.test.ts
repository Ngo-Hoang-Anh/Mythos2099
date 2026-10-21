import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import { getUnitDef } from "../data/units";
import { AI_SEAT, HUMAN_SEAT, createRoom } from "../net/session";
import { countUnits } from "./board";
import { drawCards, flattenLog } from "./state";
import { createMatch, must } from "./match";
import {
  ARMY_SIZE,
  BASE_SUPPLY,
  DRAW_PER_TURN,
  HQ_MAX_HP,
  OPENING_HAND,
  SECOND_PLAYER_OPENING_SUPPLY,
  type MatchState,
} from "./types";

const ARMY = [1, 2, 3, 4, 5, 6, 7, 8];

function finishTurn(match: MatchState): MatchState {
  let next = must(match, { type: "endDeployment" });
  if (next.phase === "maneuver") next = must(next, { type: "endManeuver" });
  if (next.phase === "engagement" || next.combatPlayback) next = must(next, { type: "endEngagement" });
  return next;
}

function field(match: MatchState, defId: number): MatchState {
  const placed = match.board.flat().find((unit) => unit?.defId === defId);
  if (placed) return match;
  const row = match.board[0].findIndex((cell) => cell === null);
  match.players[0].commandPoints = 30;
  return must(match, { type: "deploy", unitDefId: defId, row });
}

describe("vs AI difficulty", () => {
  it("leaves easy matches on the standard rules", () => {
    const plain = createMatch(ARMY, ARMY, 4);
    const easy = createMatch(ARMY, ARMY, 4, { aiDifficulty: "easy", aiPlayer: 0 });
    expect(easy.players[0].army).toEqual(plain.players[0].army);
    expect(easy.players[0].deck.map((card) => card.templateId)).toEqual(
      plain.players[0].deck.map((card) => card.templateId),
    );
    expect(easy.players[0].hqHp).toBe(HQ_MAX_HP);
    expect(easy.players[0].commandPoints).toBe(BASE_SUPPLY);
    expect(countUnits(easy.board, 0)).toBe(0);
  });

  it("gives Normal one random unit, +1 Supply, +10 HQ, and a recycled deck", () => {
    const match = createMatch(ARMY, ARMY, 11, { aiDifficulty: "normal", aiPlayer: 0 });
    const ai = match.players[0];
    expect(ai.army).toHaveLength(ARMY_SIZE + 1);
    expect(new Set(ai.army).size).toBe(ai.army.length);
    expect(ai.army.slice(0, ARMY_SIZE)).toEqual(ARMY);
    expect(ARMY.includes(ai.army[8]!)).toBe(false);
    expect(ai.hqHp).toBe(HQ_MAX_HP + 10);
    expect(ai.hqMaxHp).toBe(HQ_MAX_HP + 10);
    expect(ai.commandPoints).toBe(BASE_SUPPLY + 1);
    expect(ai.recycleDeck).toBe(true);
    expect(countUnits(match.board, 0)).toBe(0);
    expect(match.players[1].army).toHaveLength(ARMY_SIZE);
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
    expect(match.players[1].commandPoints).toBe(0);

    const heavy = getUnitDef(1);
    const light = getUnitDef(6);
    let next = field(match, 1);
    let unit = next.board.flat().find((cell) => cell?.defId === 1)!;
    expect(unit.hp).toBe(heavy.hp + 2);
    expect(unit.armor).toBe(heavy.armor);
    expect(unit.atk).toBe(heavy.atk);
    next = field(next, 6);
    unit = next.board.flat().find((cell) => cell?.defId === 6)!;
    expect(unit.hp).toBe(light.hp);
    expect(unit.armor).toBe(light.armor + 1);
    expect(unit.atk).toBe(light.atk);
  });

  it("gives Hard two random units, extra Supply, HQ, draw, and stat bumps", () => {
    const match = createMatch(ARMY, ARMY, 21, { aiDifficulty: "hard", aiPlayer: 0 });
    const ai = match.players[0];
    expect(ai.army).toHaveLength(ARMY_SIZE + 2);
    expect(new Set(ai.army).size).toBe(ai.army.length);
    expect(ai.hqHp).toBe(HQ_MAX_HP + 20);
    expect(ai.commandPoints).toBe(BASE_SUPPLY + 2);
    expect(countUnits(match.board, 0)).toBe(0);
    expect(ai.undeployed).toHaveLength(ai.army.length);
    expect(flattenLog(match.log).some((line) => line.includes("for free"))).toBe(false);

    const heavy = getUnitDef(1);
    const light = getUnitDef(6);
    let next = field(match, 1);
    let unit = next.board.flat().find((cell) => cell?.defId === 1)!;
    expect(unit.maxHp).toBe(heavy.hp + 3);
    expect(unit.atk).toBe(heavy.atk + 1);
    expect(unit.armor).toBe(heavy.armor);
    next = field(next, 6);
    unit = next.board.flat().find((cell) => cell?.defId === 6)!;
    expect(unit.maxHp).toBe(light.hp + 3);
    expect(unit.armor).toBe(light.armor + 1);
    expect(unit.atk).toBe(light.atk);

    const hand = next.players[0].hand.length;
    next = finishTurn(next);
    next = finishTurn(next);
    expect(next.currentPlayer).toBe(0);
    expect(next.players[0].hand.length).toBe(hand + DRAW_PER_TURN + 1);
  });

  it("reshuffles the discard into an empty Normal or Hard deck", () => {
    const match = createMatch(ARMY, ARMY, 8, { aiDifficulty: "normal", aiPlayer: 0 });
    const ai = match.players[0];
    const pile = [...ai.deck];
    ai.discard = pile;
    ai.deck = [];
    expect(drawCards(match, 0, 2)).toBe(2);
    expect(ai.deck.length).toBe(pile.length - 2);
    expect(flattenLog(match.log).some((line) => line.includes("shuffles"))).toBe(true);

    const easy = createMatch(ARMY, ARMY, 8);
    easy.players[0].discard = [...easy.players[0].deck];
    easy.players[0].deck = [];
    expect(drawCards(easy, 0, 1)).toBe(0);
  });

  it("gives Hard HQ 80 and extra base Supply to the AI only", () => {
    const { room, error } = createRoom("ai", DEFAULT_P1, DEFAULT_P2, "HARD", "host", "hard");
    expect(error).toBeNull();
    const ai = room.state!.players[AI_SEAT];
    const human = room.state!.players[HUMAN_SEAT];
    expect(ai.hqHp).toBe(80);
    expect(ai.hqMaxHp).toBe(80);
    expect(ai.baseSupplyBonus).toBe(2);
    expect(human.army).toEqual(DEFAULT_P1);
    expect(human.hqHp).toBe(HQ_MAX_HP);
    expect(human.hqMaxHp).toBe(HQ_MAX_HP);
    expect(human.baseSupplyBonus).toBe(0);
    expect(human.deployBuff).toBeUndefined();
    expect(human.drawPerTurnBonus).toBe(0);
    expect(human.recycleDeck).toBe(false);

    let guard = 0;
    while (room.state!.currentPlayer === AI_SEAT && room.state!.winner === null && guard < 80) {
      if (room.state!.phase === "engagement") {
        expect(room.submit(HUMAN_SEAT, { type: "endEngagement" }).ok).toBe(true);
      } else {
        expect(room.continueAi().ok).toBe(true);
      }
      guard += 1;
    }
    const onYourTurn = room.state!.players[HUMAN_SEAT];
    expect(room.state!.currentPlayer).toBe(HUMAN_SEAT);
    expect(onYourTurn.hqMaxHp).toBe(HQ_MAX_HP);
    expect(onYourTurn.baseSupplyBonus).toBe(0);
    expect(onYourTurn.commandPoints).toBe(
      BASE_SUPPLY + countUnits(room.state!.board, HUMAN_SEAT) + SECOND_PLAYER_OPENING_SUPPLY,
    );
  });

  it("does not draw on the opening turn", () => {
    const match = createMatch(ARMY, ARMY, 5, { aiDifficulty: "hard", aiPlayer: 0 });
    expect(match.players[0].hand.length).toBe(OPENING_HAND);
  });
});
