import { describe, expect, it } from "vitest";
import { createSandboxMatch, spawnUnit } from "../engine/sandbox";
import {
  awaitingMoveDest,
  canPickSequentialMoveUnit,
  moveDestPrompt,
  moveDestUnderUnit,
  moveHighlights,
  sequentialMoveStuck,
} from "./moveTargeting";

function twoAllies() {
  const match = createSandboxMatch();
  const a = spawnUnit(match, { defId: 4, owner: 0, col: 1, row: 1 });
  const b = spawnUnit(match, { defId: 6, owner: 0, col: 1, row: 3 });
  return { match, a, b };
}

describe("Swift Maneuver targeting", () => {
  it("shows destinations as soon as the first unit is picked", () => {
    const { match, a, b } = twoAllies();
    const effect = "swiftManeuver";
    expect(awaitingMoveDest(effect, [], [])).toBe(false);
    expect(moveHighlights(match, effect, [], [])).toEqual([]);
    expect(canPickSequentialMoveUnit(match, effect, [], [], a, 0)).toBe(true);
    expect(canPickSequentialMoveUnit(match, effect, [], [], b, 0)).toBe(true);

    const afterPick = moveHighlights(match, effect, [a.instanceId], []);
    expect(afterPick.length).toBeGreaterThan(0);
    expect(afterPick).toEqual(
      expect.arrayContaining([
        { col: 1, row: 0 },
        { col: 1, row: 2 },
        { col: 0, row: 1 },
      ]),
    );
    expect(moveDestPrompt(match, effect, [a.instanceId], [])).toContain("Sarama Warhound");
    expect(canPickSequentialMoveUnit(match, effect, [a.instanceId], [], b, 0)).toBe(false);
  });

  it("does not let the second unit be picked until the first has moved", () => {
    const { match, a, b } = twoAllies();
    const effect = "swiftManeuver";
    expect(canPickSequentialMoveUnit(match, effect, [a.instanceId], [], b, 0)).toBe(false);
    expect(awaitingMoveDest(effect, [a.instanceId], [])).toBe(true);

    const dest = { col: 1, row: 2 };
    expect(awaitingMoveDest(effect, [a.instanceId], [dest])).toBe(false);
    expect(moveHighlights(match, effect, [a.instanceId], [dest])).toEqual([]);
    expect(moveDestPrompt(match, effect, [a.instanceId], [dest])).toBe("Click friendly unit 2 (or Done)");
    expect(canPickSequentialMoveUnit(match, effect, [a.instanceId], [dest], a, 0)).toBe(false);
    expect(canPickSequentialMoveUnit(match, effect, [a.instanceId], [dest], b, 0)).toBe(true);
  });

  it("cannot unpick a unit and is not stuck while two allies can still move", () => {
    const { match, a, b } = twoAllies();
    const effect = "swiftManeuver";
    expect(sequentialMoveStuck(match, effect, [], [], 0)).toBe(false);
    expect(canPickSequentialMoveUnit(match, effect, [a.instanceId], [], a, 0)).toBe(false);
    expect(sequentialMoveStuck(match, effect, [a.instanceId], [], 0)).toBe(false);
    expect(sequentialMoveStuck(match, effect, [a.instanceId], [{ col: 1, row: 2 }], 0)).toBe(false);
    expect(canPickSequentialMoveUnit(match, effect, [a.instanceId, b.instanceId], [{ col: 1, row: 2 }], b, 0)).toBe(
      false,
    );
  });

  it("is stuck only when no remaining ally has a legal step", () => {
    const match = createSandboxMatch();
    expect(sequentialMoveStuck(match, "swiftManeuver", [], [], 0)).toBe(true);
    expect(moveDestPrompt(match, "swiftManeuver", [], [])).toBe("No unit can move — Cancel");
  });

  it("blocks the first unit's destination when choosing the second unit's step", () => {
    const { match, a, b } = twoAllies();
    const dests = moveHighlights(match, "swiftManeuver", [a.instanceId, b.instanceId], [{ col: 1, row: 2 }]);
    expect(dests).not.toContainEqual({ col: 1, row: 2 });
    expect(dests).toEqual(
      expect.arrayContaining([
        { col: 1, row: 4 },
        { col: 0, row: 3 },
      ]),
    );
  });

  it("treats a click on the first unit as picking its vacated cell for the second mover", () => {
    const match = createSandboxMatch();
    const a = spawnUnit(match, { defId: 4, owner: 0, col: 1, row: 1 });
    const b = spawnUnit(match, { defId: 6, owner: 0, col: 1, row: 2 });
    const destA = { col: 1, row: 0 };
    expect(moveHighlights(match, "swiftManeuver", [a.instanceId, b.instanceId], [destA])).toContainEqual({
      col: 1,
      row: 1,
    });
    expect(moveDestUnderUnit(match, "swiftManeuver", [a.instanceId, b.instanceId], [destA], a)).toEqual({
      col: 1,
      row: 1,
    });
    expect(moveDestUnderUnit(match, "swiftManeuver", [a.instanceId, b.instanceId], [destA], b)).toBeNull();
  });

  it("still highlights the second step of a single-unit double move", () => {
    const { match, a } = twoAllies();
    const afterFirst = moveHighlights(match, "moveUnitTwice", [a.instanceId], [{ col: 1, row: 2 }]);
    expect(afterFirst.length).toBeGreaterThan(0);
    expect(moveDestPrompt(match, "moveUnitTwice", [a.instanceId], [{ col: 1, row: 2 }])).toContain("step 2/2");
    expect(moveDestPrompt(match, "moveUnitTwice", [a.instanceId], [{ col: 1, row: 2 }])).toContain("Done");
  });
});
