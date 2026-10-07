import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2, PREMADE_ARMIES } from "../data/premadeArmies";
import { stepUnit } from "./effects";
import { applyAction, createMatch, must } from "./match";
import { dirsForEffect, legalDestinations } from "./move";

describe("board movement", () => {
  it("moves Up diagonally back-up from Frontline", () => {
    const match = must(createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3), {
      type: "deploy",
      unitDefId: 4,
      row: 2,
    });
    const unit = match.board[1][2]!;
    expect(stepUnit(match, unit, "upBack")).toBeNull();
    expect(match.board[0][1]?.instanceId).toBe(unit.instanceId);
    expect(match.board[1][2]).toBeNull();
  });

  it("blocks diagonal retreat from Support", () => {
    const match = must(createMatch(DEFAULT_P1, DEFAULT_P2, 3), {
      type: "deploy",
      unitDefId: 6,
      row: 2,
    });
    const unit = match.board[0][2]!;
    expect(stepUnit(match, unit, "downBack")).toMatch(/cannot retreat further/);
  });

  it("lets Forward reach only the straight Frontline cell from Support", () => {
    const match = must(createMatch(DEFAULT_P1, DEFAULT_P2, 3), {
      type: "deploy",
      unitDefId: 6,
      row: 2,
    });
    const unit = match.board[0][2]!;
    const dests = legalDestinations(match, unit, dirsForEffect("forward")!);
    expect(dests).toEqual([{ col: 1, row: 2 }]);
  });

  it("lets Retreat reach 3 Support cells from Frontline", () => {
    const match = must(createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3), {
      type: "deploy",
      unitDefId: 4,
      row: 2,
    });
    const unit = match.board[1][2]!;
    const dests = legalDestinations(match, unit, dirsForEffect("retreat")!);
    expect(dests).toEqual([
      { col: 0, row: 1 },
      { col: 0, row: 2 },
      { col: 0, row: 3 },
    ]);
  });

  it("plays Forward onto the straight Frontline cell only", () => {
    let match = must(createMatch(DEFAULT_P1, DEFAULT_P2, 3), {
      type: "deploy",
      unitDefId: 6,
      row: 2,
    });
    match = must(match, { type: "endDeployment" });
    const unit = match.board[0][2]!;
    match.players[0].hand = [
      {
        instanceId: "fwd-straight",
        ownerUnitId: 6,
        templateId: "forward_test",
        name: "Forward",
        type: "move",
        cost: 1,
        text: "Advance",
        effectId: "forward",
        targets: ["friendly", "boardDest"],
      },
      ...match.players[0].hand,
    ];
    const diag = applyAction(match, {
      type: "playCard",
      cardId: "fwd-straight",
      targets: { unitIds: [unit.instanceId], cells: [{ col: 1, row: 1 }] },
    });
    expect(diag.ok).toBe(false);
    match = must(match, {
      type: "playCard",
      cardId: "fwd-straight",
      targets: { unitIds: [unit.instanceId], cells: [{ col: 1, row: 2 }] },
    });
    expect(match.board[1][2]?.instanceId).toBe(unit.instanceId);
    expect(match.board[0][2]).toBeNull();
  });

  it("lets Blitzkrieg and Maintenance use diagonal / retreat dirs", () => {
    expect(dirsForEffect("initiative")).toEqual(
      expect.arrayContaining(["forward", "up", "down", "back", "forwardUp", "forwardDown", "upBack", "downBack"]),
    );
    expect(dirsForEffect("moveUnitTwice")).toEqual(
      expect.arrayContaining(["forwardUp", "forwardDown", "upBack", "downBack"]),
    );
    expect(dirsForEffect("maintenance")).toEqual(["upBack", "back", "downBack"]);
  });
});
