import { describe, expect, it } from "vitest";
import { UNITS } from "../data/units";
import { SPECIAL_SKILL_DAMAGE } from "./specialSkillDamage";
import {
  ASSUMED_SUPPORT_ALLIES,
  ASSUMED_SUPPORT_FIRE,
  catalogAverages,
  offenseBreakdownOf,
  defenseBreakdownOf,
  totalAtkOf,
  valueCatalog,
} from "./unitValueBreakdown";

describe("special skill constants", () => {
  it("covers every catalog unit", () => {
    for (const unit of UNITS) {
      expect(SPECIAL_SKILL_DAMAGE[unit.id], String(unit.id)).toBeDefined();
      expect(SPECIAL_SKILL_DAMAGE[unit.id].damage).toBeGreaterThanOrEqual(0);
    }
  });

  it("records extra-attack and kamikaze numbers", () => {
    expect(SPECIAL_SKILL_DAMAGE[1].damage).toBe(8);
    expect(SPECIAL_SKILL_DAMAGE[11].damage).toBe(6);
    expect(SPECIAL_SKILL_DAMAGE[12].damage).toBe(7);
    expect(SPECIAL_SKILL_DAMAGE[27].damage).toBe(8);
    expect(SPECIAL_SKILL_DAMAGE[23].damage).toBe(8);
    expect(SPECIAL_SKILL_DAMAGE[10].damage).toBe(5);
    expect(SPECIAL_SKILL_DAMAGE[2].damage).toBe(11);
    expect(SPECIAL_SKILL_DAMAGE[16].damage).toBe(12);
    expect(SPECIAL_SKILL_DAMAGE[4].damage).toBe(0);
  });
});

describe("offense breakdown", () => {
  it("uses 2×ATK + Aggressive + Retaliate for self damage and 2 SF allies", () => {
    const apex = offenseBreakdownOf(UNITS.find((u) => u.id === 2)!);
    expect(apex.selfAtkDmg).toBe(3 + 4 + 3 + 0);
    expect(apex.supportFireDmg).toBe(ASSUMED_SUPPORT_ALLIES * ASSUMED_SUPPORT_FIRE * 2);
    expect(apex.rallyDmg).toBe(0);
    expect(apex.indirectDmg).toBe(0);
    expect(apex.specialDmg).toBe(11);
    expect(apex.totalDmg).toBe(apex.selfAtkDmg + apex.allyBuffDmg + apex.indirectDmg + apex.specialDmg);
  });

  it("adds Rally +3 only on units that have the card", () => {
    const mirage = offenseBreakdownOf(UNITS.find((u) => u.id === 6)!);
    const jackal = offenseBreakdownOf(UNITS.find((u) => u.id === 4)!);
    expect(mirage.rallyDmg).toBe(3);
    expect(jackal.rallyDmg).toBe(0);
    expect(mirage.allyBuffDmg).toBe(jackal.allyBuffDmg + 3);
  });

  it("counts missile once as indirect", () => {
    const hornet = offenseBreakdownOf(UNITS.find((u) => u.id === 8)!);
    expect(hornet.indirectDmg).toBe(4);
  });
});

describe("defense breakdown", () => {
  it("scores HP + armor multipliers", () => {
    const zeus = defenseBreakdownOf(UNITS.find((u) => u.id === 1)!);
    expect(zeus.hpArmor2).toBe(10 + 12);
    expect(zeus.hpArmor3).toBe(10 + 18);
  });

  it("picks Trench Guard as max total ATK and Breacher as max AP", () => {
    const catalog = valueCatalog();
    expect(catalog.maxTotalAtk.id).toBe(17);
    expect(catalog.maxTotalAtk.totalAtk).toBe(10);
    expect(catalog.maxAp.id).toBe(16);
    expect(catalog.maxAp.ap).toBe(8);
    expect(catalog.maxAtkPlusAp.id).toBe(27);
  });

  it("averages include zeros", () => {
    const avg = catalogAverages();
    const expectedAtk = UNITS.reduce((sum, u) => sum + totalAtkOf(u), 0) / UNITS.length;
    expect(avg.totalAtk).toBeCloseTo(expectedAtk);
    expect(avg.ap).toBeGreaterThan(0);
  });

  it("gives ∞ hits when incoming damage is 0", () => {
    const bastion = defenseBreakdownOf(UNITS.find((u) => u.id === 3)!);
    if (bastion.avgOpp.attackHitDmg <= 0) {
      expect(bastion.avgOpp.attacksSurvived).toBeNull();
    } else {
      expect(bastion.avgOpp.attacksSurvived).toBeGreaterThan(0);
    }
  });
});
