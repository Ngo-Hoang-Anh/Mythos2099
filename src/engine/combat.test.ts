import { describe, expect, it } from "vitest";
import { computeStrikeDamage, combatDamage, hqDamage, missileEffectiveArmor, retaliateDamage } from "../engine/combat";
import { parseKeywords } from "../engine/keywords";
import type { UnitInstance } from "../engine/types";

function unit(partial: Partial<UnitInstance> & Pick<UnitInstance, "atk" | "armor" | "keywords">): UnitInstance {
  return {
    instanceId: "u",
    defId: 0,
    name: "X",
    class: "Tank",
    owner: 0,
    hp: 20,
    maxHp: 20,
    cost: 6,
    ap: 0,
    col: 1,
    row: 0,
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
    ...partial,
  };
}

describe("combat math", () => {
  it("uses ATK minus remaining armor after AP", () => {
    expect(computeStrikeDamage({ atk: 10, armor: 8, armorPiercing: 0 })).toBe(2);
    expect(computeStrikeDamage({ atk: 10, armor: 8, armorPiercing: 8 })).toBe(10);
    expect(computeStrikeDamage({ atk: 4, armor: 8, armorPiercing: 3 })).toBe(0);
  });

  it("never goes below zero", () => {
    expect(computeStrikeDamage({ atk: 5, armor: 8 })).toBe(0);
  });

  it("counts half armor against missiles, rounded up", () => {
    expect(missileEffectiveArmor(0)).toBe(0);
    expect(missileEffectiveArmor(1)).toBe(1);
    expect(missileEffectiveArmor(3)).toBe(2);
    expect(missileEffectiveArmor(4)).toBe(2);
    expect(missileEffectiveArmor(5)).toBe(3);
    expect(computeStrikeDamage({ atk: 4, armor: missileEffectiveArmor(5) })).toBe(1);
  });

  it("adds Aggressive and temp ATK, then applies AP", () => {
    const attacker = unit({
      atk: 6,
      armor: 2,
      ap: 8,
      keywords: parseKeywords("Aggressive 2"),
      tempAtk: 3,
    });
    const defender = unit({ atk: 5, armor: 7, keywords: [] });
    expect(combatDamage(attacker, defender, 0)).toBe(11);
  });

  it("HQ damage ignores armor", () => {
    const attacker = unit({ atk: 6, armor: 8, keywords: parseKeywords("Aggressive 1"), tempAtk: 2 });
    expect(hqDamage(attacker, 2)).toBe(11);
  });

  it("Retaliate is reduced by the original attacker's armor", () => {
    const defender = unit({ atk: 5, armor: 8, keywords: parseKeywords("Retaliate 5") });
    const attacker = unit({ atk: 6, armor: 4, keywords: [] });
    expect(retaliateDamage(defender, attacker, 0)).toBe(1);
  });
});

describe("keyword parser", () => {
  it("parses mixed numbered and flag keywords", () => {
    const ks = parseKeywords("Artillery; Missile 7");
    expect(ks).toEqual([
      { name: "artillery", value: 1 },
      { name: "missile", value: 7 },
    ]);
  });

  it("accepts spreadsheet typos and comma lists", () => {
    expect(parseKeywords("Cover,Missle 4")).toEqual([
      { name: "cover", value: 1 },
      { name: "missile", value: 4 },
    ]);
    expect(parseKeywords("Aggresive 4")).toEqual([{ name: "aggressive", value: 4 }]);
    expect(parseKeywords("Retaliation:3")).toEqual([{ name: "retaliate", value: 3 }]);
  });
});
