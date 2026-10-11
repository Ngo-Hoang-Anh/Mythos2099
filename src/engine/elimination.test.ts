import { describe, expect, it } from "vitest";
import { getUnitDef } from "../data/units";
import { DEFAULT_P1, DEFAULT_P2, PREMADE_ARMIES } from "../data/premadeArmies";
import { placeUnit } from "./board";
import {
  applyEliminationLoss,
  canFieldAnyReserve,
  isPlayerEliminated,
  projectedDeploySupply,
} from "./elimination";
import { createMatch, must } from "./match";
import { flattenLog } from "./state";
import { P1_FRONT, P2_FRONT, ROWS, type CardInstance, type MatchState } from "./types";

function fakeCard(id: string): CardInstance {
  return {
    instanceId: id,
    ownerUnitId: 4,
    templateId: `fake_${id}`,
    name: `Card ${id}`,
    type: "maneuver",
    cost: 0,
    text: "Test",
    effectId: "fortify",
    targets: [],
  };
}

function spawn(match: MatchState, defId: number, owner: 0 | 1, col: number, row: number): void {
  const def = getUnitDef(defId);
  placeUnit(match.board, {
    instanceId: `u_${owner}_${defId}_${row}`,
    defId: def.id,
    name: def.name,
    class: def.class,
    owner,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    armor: def.armor,
    ap: def.ap,
    cost: def.cost,
    col,
    row,
    keywords: def.keywords.map((k) => ({ ...k })),
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
  });
}

describe("elimination helpers", () => {
  it("can field when Supply covers a reserve cost", () => {
    expect(canFieldAnyReserve([3, 6], 4, 0, 0, 1)).toBe(true);
  });

  it("can field via Desperate when outnumbered and hand covers the gap", () => {
    expect(canFieldAnyReserve([6], 4, 4, 0, 1)).toBe(true);
    expect(canFieldAnyReserve([6], 4, 0, 0, 1)).toBe(false);
    expect(canFieldAnyReserve([6], 4, 4, 0, 0)).toBe(false);
  });

  it("cannot field with an empty reserve", () => {
    expect(canFieldAnyReserve([], 4, 10, 0, 2)).toBe(false);
  });
});

describe("elimination loss", () => {
  it("does not eliminate when a cheap reserve can still be summoned", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
    match.players[0].undeployed = [6]; // cost 3
    match.players[0].deck = [];
    match.players[0].hand = [];
    expect(projectedDeploySupply(match, 0)).toBe(4);
    expect(isPlayerEliminated(match, 0)).toBe(false);
    expect(applyEliminationLoss(match)).toBe(false);
  });

  it("eliminates when board, deck, and fieldable reserve are all gone", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
    match.players[0].undeployed = [];
    match.players[0].deck = [];
    match.players[0].hand = [];
    spawn(match, 4, 1, P2_FRONT, 2);
    expect(isPlayerEliminated(match, 0)).toBe(true);
    expect(applyEliminationLoss(match)).toBe(true);
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("elimination");
    expect(match.phase).toBe("gameover");
    expect(flattenLog(match.log).some((line) => line.includes("no forces left"))).toBe(true);
  });

  it("eliminates when reserve is too expensive even with Desperate", () => {
    const match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3);
    match.players[0].undeployed = [20]; // cost 5
    match.players[0].deck = [];
    match.players[0].hand = [fakeCard("a")]; // only −0 cost from discards
    spawn(match, 4, 1, P2_FRONT, 2);
    expect(getUnitDef(20).cost).toBe(5);
    expect(isPlayerEliminated(match, 0)).toBe(true);
  });

  it("does not eliminate while the deck still has cards", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
    match.players[0].undeployed = [];
    match.players[0].deck = [fakeCard("last")];
    match.players[0].hand = [];
    expect(isPlayerEliminated(match, 0)).toBe(false);
  });

  it("ends the match when the active player cannot recover", () => {
    let match = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    match = must(match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(1);

    match.players[1].undeployed = [];
    match.players[1].deck = [];
    match.players[1].hand = [];
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (match.board[c][r]?.owner === 1) match.board[c][r] = null;
      }
    }
    spawn(match, 4, 0, P1_FRONT, 2);

    match.players[1].commandPoints = 4;
    match.phase = "deployment";
    expect(applyEliminationLoss(match, [4, 4])).toBe(true);
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });
});
