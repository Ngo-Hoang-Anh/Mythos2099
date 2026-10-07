import { describe, expect, it } from "vitest";
import { UNITS, getUnitDef } from "../data/units";
import {
  duelOutcome,
  simulateVacuumEngagement,
  simulateVacuumExchange,
  allVacuumEngagements,
} from "./vacuumDuel";

describe("vacuum 1v1", () => {
  it("runs every pair including mirrors", () => {
    const rows = allVacuumEngagements();
    expect(rows).toHaveLength(UNITS.length * UNITS.length);
  });

  it("Apex vs Iron Bastion depends on who strikes first", () => {
    const aFirst = simulateVacuumEngagement(2, 3);
    expect(aFirst.attackerHp).toBe(6);
    expect(aFirst.defenderHp).toBe(5);
    expect(duelOutcome(aFirst)).toBe("both_live");

    const bFirst = simulateVacuumEngagement(3, 2);
    expect(bFirst.attackerHp).toBe(9);
    expect(bFirst.defenderHp).toBe(10);
  });

  it("keeps leftover HP when the second unit strikes back", () => {
    const one = simulateVacuumEngagement(2, 3);
    const two = simulateVacuumExchange(2, 3);
    expect(one.attackerHp).toBe(6);
    expect(one.defenderHp).toBe(5);
    expect(two.attackerHp).toBeLessThanOrEqual(one.attackerHp);
    expect(two.defenderHp).toBeLessThanOrEqual(one.defenderHp);
    expect(two.attackerHp).toBe(6);
    expect(two.defenderHp).toBe(4);
  });

  it("places artillery on Support so it still volleys", () => {
    const row = simulateVacuumEngagement(12, 4);
    expect(row.defenderHp).toBeLessThan(getUnitDef(4).hp);
  });
});
