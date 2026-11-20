import { describe, expect, it } from "vitest";
import { emptyBoard, placeUnit } from "../engine/board";
import { parseKeywords, blankDefensePools, syncDefensePools } from "../engine/keywords";
import { createMatch } from "../engine/match";
import { cloneState } from "../engine/state";
import { addStatus } from "../engine/status";
import type { MatchState, UnitInstance } from "../engine/types";
import { P2_FRONT } from "../engine/types";
import { unitStatusChips } from "./unitStatuses";

function blankMatch(): MatchState {
  const match = cloneState(
    createMatch([17, 3, 4, 1, 18, 21, 23, 5], [12, 10, 11, 1, 17, 3, 18, 24], 1),
  );
  match.board = emptyBoard();
  match.statuses = [];
  return match;
}

function spawn(state: MatchState, id: string, col: number, row: number): UnitInstance {
  const unit: UnitInstance = {
    instanceId: id,
    defId: 1,
    name: "Target",
    class: "Tank",
    owner: 1,
    hp: 20,
    maxHp: 20,
    atk: 5,
    armor: 2,
    ap: 0,
    cost: 4,
    col,
    row,
    keywords: parseKeywords("Smoke Screen"),
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
    ...blankDefensePools(),
  };
  syncDefensePools(unit);
  placeUnit(state.board, unit);
  return unit;
}

describe("unitStatusChips", () => {
  it("shows Fire as a red debuff and Smoke as a green buff", () => {
    const state = blankMatch();
    const unit = spawn(state, "u1", P2_FRONT, 1);
    addStatus(state, {
      kind: "fireDot",
      magnitude: 3,
      sourceId: "atk",
      owner: 0,
      targetId: unit.instanceId,
      duration: "endOfTurn",
      remainingPasses: 3,
    });
    addStatus(state, {
      kind: "smokeDodge",
      sourceId: unit.instanceId,
      owner: 1,
      targetId: unit.instanceId,
      duration: "endOfTurn",
    });
    addStatus(state, {
      kind: "suppressionMark",
      sourceId: "sup",
      owner: 0,
      col: unit.col,
      lane: unit.row,
      duration: "endOfNextTurn",
      remainingPasses: 2,
    });

    const chips = unitStatusChips(state, unit);
    expect(chips.map((c) => c.polarity)).toEqual(["buff", "debuff", "debuff"]);
    expect(chips.find((c) => c.icon === "fire")?.value).toBe(3);
    expect(chips.find((c) => c.icon === "smokeScreen")?.polarity).toBe("buff");
    expect(chips.find((c) => c.icon === "suppression")?.polarity).toBe("debuff");
  });
});
