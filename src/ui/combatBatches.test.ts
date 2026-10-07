import { describe, expect, it } from "vitest";
import type { CombatStep } from "../engine/types";
import { collectQuickCombat, takeCombatExchange } from "./combatBatches";

function shot(unitId: string, side: "attack" | "counter" | "missile"): CombatStep {
  return {
    kind: "shot",
    unitId,
    name: unitId,
    owner: side === "counter" ? 1 : 0,
    from: { col: 1, row: 0 },
    to: { col: 2, row: 0 },
    damage: 3,
    side,
    power: 5,
    targetMaxHp: 10,
  };
}

function hp(unitId: string, n: number): CombatStep {
  return { kind: "hp", unitId, hp: n, lost: 3 };
}

describe("takeCombatExchange", () => {
  it("groups a 1v1 gun exchange so both shots play together", () => {
    const steps: CombatStep[] = [
      { kind: "phase", phase: "damage" },
      { kind: "lane", lane: 0, color: "red" },
      shot("a", "attack"),
      hp("b", 7),
      shot("b", "counter"),
      hp("a", 8),
      { kind: "destroy", unitId: "b" },
    ];
    expect(takeCombatExchange(steps, 0)).toBeNull();
    expect(takeCombatExchange(steps, 1)).toBeNull();
    const grouped = takeCombatExchange(steps, 2);
    expect(grouped?.exchange.shots.map((s) => s.unitId)).toEqual(["a", "b"]);
    expect(grouped?.exchange.results).toHaveLength(2);
    expect(grouped?.next).toBe(6);
  });

  it("leaves a lone shot sequential, including HQ hits", () => {
    const steps: CombatStep[] = [
      shot("a", "attack"),
      { kind: "hq", player: 1, hp: 75, damage: 25 },
      { kind: "hqBreakpoint", player: 1, bp: 80, supply: 1, draw: 1 },
    ];
    expect(takeCombatExchange(steps, 0)).toBeNull();
  });

  it("does not fold missile shots into a gun exchange", () => {
    const steps: CombatStep[] = [shot("a", "missile"), hp("b", 4), shot("c", "missile")];
    expect(takeCombatExchange(steps, 0)).toBeNull();
  });
});

describe("collectQuickCombat", () => {
  it("groups shots with following hp/hq and skips phase/lane beats", () => {
    const steps: CombatStep[] = [
      { kind: "phase", phase: "relocation" },
      { kind: "lane", lane: 0, color: "green" },
      {
        kind: "move",
        unitId: "a",
        name: "A",
        unitClass: "Tank",
        owner: 0,
        from: { col: 0, row: 0 },
        to: { col: 1, row: 0 },
      },
      { kind: "rest", unitId: "a" },
      { kind: "phase", phase: "stats" },
      { kind: "statAtk", unitId: "a", bonus: 2, total: 6 },
      { kind: "keywordPop", unitId: "a", keyword: "aggressive", amount: 2 },
      { kind: "phase", phase: "damage" },
      shot("a", "attack"),
      hp("b", 7),
      shot("b", "counter"),
      { kind: "hq", player: 0, hp: 75, damage: 25 },
      { kind: "hqBreakpoint", player: 0, bp: 80, supply: 1, draw: 1 },
      { kind: "destroy", unitId: "b" },
      { kind: "phase", phase: "missile" },
      shot("a", "missile"),
      hp("c", 4),
      hp("d", 8),
    ];
    const plan = collectQuickCombat(steps);
    expect(plan.moves).toHaveLength(1);
    expect(plan.rests).toEqual([{ kind: "rest", unitId: "a" }]);
    expect(plan.stats).toHaveLength(1);
    expect(plan.guns.map((s) => s.shot.unitId)).toEqual(["a", "b"]);
    expect(plan.guns[0].results).toEqual([hp("b", 7)]);
    expect(plan.guns[1].results).toEqual([
      { kind: "hq", player: 0, hp: 75, damage: 25 },
      { kind: "hqBreakpoint", player: 0, bp: 80, supply: 1, draw: 1 },
    ]);
    expect(plan.missiles).toHaveLength(1);
    expect(plan.missiles[0].results).toHaveLength(2);
    expect(plan.destroys).toEqual([{ kind: "destroy", unitId: "b" }]);
  });
});
