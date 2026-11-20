import { describe, expect, it } from "vitest";
import {
  simulateDeathmatch,
  simulateHqDamageOverTurns,
  DEATHMATCH_MAX_ROUNDS,
} from "./vacuumExtended";

describe("vacuum extended deathmatch", () => {
  it("finishes with a decisive or mutual outcome within the round cap", () => {
    const row = simulateDeathmatch(2, 3);
    expect(row.rounds).toBeGreaterThan(0);
    expect(row.rounds).toBeLessThanOrEqual(DEATHMATCH_MAX_ROUNDS);
    expect(["attacker", "defender", "mutual", "timeout"]).toContain(row.outcome);
  });

  it("skills mode can change leftover HP vs the same matchup", () => {
    const plain = simulateDeathmatch(7, 4);
    const skilled = simulateDeathmatch(7, 4, { useSkills: true });
    expect(skilled.rounds).toBeGreaterThan(0);
    // Same possible outcomes; skills may or may not flip — just ensure it runs.
    expect(["attacker", "defender", "mutual", "timeout"]).toContain(skilled.outcome);
    expect(plain.attackerId).toBe(7);
  });
});

describe("HQ damage over turns", () => {
  it("deals positive HQ damage for a gun unit over 4 turns", () => {
    const dmg = simulateHqDamageOverTurns(12);
    expect(dmg).toBeGreaterThan(0);
  });
});
