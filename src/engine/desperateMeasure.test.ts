import { describe, expect, it } from "vitest";
import { getUnitDef } from "../data/units";
import { PREMADE_ARMIES } from "../data/premadeArmies";
import { placeUnit } from "./board";
import {
  canAffordDeploy,
  discardsNeeded,
  needsDesperateMeasure,
  supplyGap,
} from "./desperateMeasure";
import { applyAction, createMatch, must } from "./match";
import { flattenLog } from "./state";
import { P2_FRONT, type CardInstance, type MatchState } from "./types";

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

/** Put one enemy on the board so Desperate Measure's outnumbered gate passes. */
function outnumberPlayer(match: MatchState): void {
  const def = getUnitDef(4);
  placeUnit(match.board, {
    instanceId: "enemy_outnumber",
    defId: def.id,
    name: def.name,
    class: def.class,
    owner: 1,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    armor: def.armor,
    ap: def.ap,
    cost: def.cost,
    col: P2_FRONT,
    row: 0,
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

describe("desperateMeasure helpers", () => {
  it("needs 2 discards per missing Supply", () => {
    expect(supplyGap(5, 3)).toBe(2);
    expect(discardsNeeded(5, 3)).toBe(4);
    expect(discardsNeeded(4, 4)).toBe(0);
    expect(canAffordDeploy(5, 3, 4)).toBe(true);
    expect(canAffordDeploy(5, 3, 3)).toBe(false);
  });

  it("flags Desperate Measure only when outnumbered and Supply alone cannot summon", () => {
    expect(needsDesperateMeasure([4, 5], 4, 0, 0, 0, 1)).toBe(false);
    expect(needsDesperateMeasure([5, 6], 4, 2, 0, 0, 1)).toBe(true);
    expect(needsDesperateMeasure([5, 6], 4, 2, 0, 1, 1)).toBe(false);
    expect(needsDesperateMeasure([5, 6], 4, 2, 0, 2, 1)).toBe(false);
    expect(needsDesperateMeasure([5, 6], 4, 0, 0, 0, 1)).toBe(false);
    expect(needsDesperateMeasure([], 0, 10, 0, 0, 1)).toBe(false);
    expect(needsDesperateMeasure([5, 6], 4, 2, 1, 0, 1)).toBe(false);
  });
});

describe("deploy with Desperate Measure", () => {
  it("discards 2 cards per missing Supply and places the unit", () => {
    let match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3);
    outnumberPlayer(match);
    match.players[0].commandPoints = 2;
    match.players[0].hand = [fakeCard("a"), fakeCard("b"), fakeCard("c"), fakeCard("d")];
    // 04 costs 4 → need 4 discards for −2 cost
    match = must(match, {
      type: "deploy",
      unitDefId: 4,
      row: 2,
      discardCardIds: ["a", "b", "c", "d"],
    });
    expect(match.players[0].commandPoints).toBe(0);
    expect(match.players[0].hand).toHaveLength(0);
    expect(match.players[0].discard.map((c) => c.instanceId).sort()).toEqual(["a", "b", "c", "d"]);
    expect(match.board[1][2]?.defId).toBe(4);
    expect(flattenLog(match.log).some((line) => line.includes("Desperate Measure"))).toBe(true);
  });

  it("rejects deploy when not enough discards are provided", () => {
    const match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3);
    outnumberPlayer(match);
    match.players[0].commandPoints = 2;
    match.players[0].hand = [fakeCard("a"), fakeCard("b")];
    const result = applyAction(match, {
      type: "deploy",
      unitDefId: 4,
      row: 2,
      discardCardIds: ["a", "b"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/needs 4/);
  });

  it("rejects extra discards when Supply already covers the cost", () => {
    const match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3);
    outnumberPlayer(match);
    match.players[0].hand = [fakeCard("a"), fakeCard("b")];
    const result = applyAction(match, {
      type: "deploy",
      unitDefId: 4,
      row: 2,
      discardCardIds: ["a", "b"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/No discards needed/);
  });

  it("rejects Desperate Measure when a cheaper reserve unit is still affordable", () => {
    const match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3);
    outnumberPlayer(match);
    // 06 costs 3 — still affordable; 04 costs 4
    match.players[0].commandPoints = 3;
    match.players[0].hand = [fakeCard("a"), fakeCard("b")];
    const result = applyAction(match, {
      type: "deploy",
      unitDefId: 4,
      row: 2,
      discardCardIds: ["a", "b"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/only when no reserved unit/);
  });

  it("rejects Desperate Measure when not outnumbered", () => {
    const match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3);
    match.players[0].commandPoints = 2;
    match.players[0].hand = [fakeCard("a"), fakeCard("b"), fakeCard("c"), fakeCard("d")];
    const result = applyAction(match, {
      type: "deploy",
      unitDefId: 4,
      row: 2,
      discardCardIds: ["a", "b", "c", "d"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/opponent has more units/);
  });

  it("rejects Desperate Measure after already summoning this turn", () => {
    let match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3);
    outnumberPlayer(match);
    match.players[0].commandPoints = 3;
    match = must(match, { type: "deploy", unitDefId: 6, row: 0 });
    // Remaining units all cost > leftover Supply (0), but a summon already happened
    match.players[0].hand = [fakeCard("a"), fakeCard("b"), fakeCard("c"), fakeCard("d")];
    match.players[0].commandPoints = 2;
    const result = applyAction(match, {
      type: "deploy",
      unitDefId: 4,
      row: 2,
      discardCardIds: ["a", "b", "c", "d"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/first summon/);
  });
});
