import { describe, expect, it } from "vitest";
import { DEFAULT_P1, PREMADE_ARMIES } from "../data/premadeArmies";
import { getUnitDef } from "../data/units";
import { buildDeck, deckSizeForArmy, validateArmy } from "./army";
import { countCards, keywordHelp, keywordTutorial, KEYWORD_FULL, KEYWORD_SHORT, summarizeArmy } from "./armySummary";
import type { KeywordName } from "./types";
import { ARMY_SIZE } from "./types";

describe("army builder rules", () => {
  it("requires exactly 8 unique known units", () => {
    expect(validateArmy([4])).toMatch(/exactly 8/);
    const dup = [...PREMADE_ARMIES.aggro.units];
    dup[7] = dup[0];
    expect(validateArmy(dup)).toMatch(/duplicate/);
    expect(validateArmy([...PREMADE_ARMIES.aggro.units.slice(0, 7), 999])).toMatch(/Unknown/);
    expect(validateArmy(PREMADE_ARMIES.tank_robot.units)).toBeNull();
    expect(validateArmy(PREMADE_ARMIES.retaliate.units)).toBeNull();
    expect(validateArmy(PREMADE_ARMIES.support_fire.units)).toBeNull();
    expect(validateArmy(PREMADE_ARMIES.jet_infantry.units)).toBeNull();
    expect(validateArmy(PREMADE_ARMIES.aggro.units)).toBeNull();
    expect(validateArmy(PREMADE_ARMIES.missile.units)).toBeNull();
    expect(PREMADE_ARMIES.aggro.units).toEqual([
      27,
      26,
      4,
      19,
      21,
      6,
      7,
      8,
    ]);
    expect(DEFAULT_P1).toBe(PREMADE_ARMIES.tank_robot.units);
    expect(Object.keys(PREMADE_ARMIES)).toEqual([
      "tank_robot",
      "retaliate",
      "support_fire",
      "jet_infantry",
      "aggro",
      "missile",
    ]);
    expect(PREMADE_ARMIES.missile.units).toEqual([1, 8, 10, 22, 25, 2, 5, 11]);
  });

  it("includes Special cards in the constructed deck", () => {
    expect(PREMADE_ARMIES.tank_robot.units).toHaveLength(ARMY_SIZE);
    let n = 0;
    const deck = buildDeck(PREMADE_ARMIES.tank_robot.units, () => `c${(n += 1)}`);
    expect(deck.some((c) => c.type === "special")).toBe(true);
    expect(deck.filter((c) => c.type === "special")).toHaveLength(ARMY_SIZE);
    expect(deck.length).toBe(deckSizeForArmy(PREMADE_ARMIES.tank_robot.units));
    expect(deck.length).toBeGreaterThan(8);
  });

  it("aggregates attached cards and army averages", () => {
    const jackal = getUnitDef(4);
    const upDown = countCards(jackal.cards).find((c) => c.name === "Down");
    expect(upDown?.count).toBe(1);

    const summary = summarizeArmy(PREMADE_ARMIES.aggro.units);
    expect(summary.count).toBe(8);
    expect(summary.avgCp).toBeGreaterThan(3);
    expect(summary.cards.some((c) => c.name === "Up or Down" && c.count >= 2)).toBe(true);
    expect(summary.cards.some((c) => c.type === "special")).toBe(true);
  });
});

describe("keyword copy", () => {
  const names = Object.keys(KEYWORD_SHORT) as KeywordName[];

  it("has short hover text and full tutorial text for every keyword", () => {
    expect(names.sort()).toEqual(Object.keys(KEYWORD_FULL).sort());
    for (const name of names) {
      expect(KEYWORD_SHORT[name].length).toBeGreaterThan(10);
      expect(KEYWORD_FULL[name].length).toBeGreaterThan(KEYWORD_SHORT[name].length - 20);
    }
  });

  it("uses the short line on hover and the full rules in tutorial", () => {
    const cover = { name: "cover" as const, value: 1 };
    expect(keywordHelp(cover).body).toBe(KEYWORD_SHORT.cover);
    expect(keywordTutorial(cover).body).toBe(KEYWORD_FULL.cover);
    expect(keywordHelp(cover).body).not.toMatch(/Prefers|Rests if|Nearest cell/);

    const missile = { name: "missile" as const, value: 5 };
    expect(keywordHelp(missile).title).toBe("Missile 5");
    expect(keywordHelp(missile).body).toContain("ATK 5");
    expect(keywordHelp(missile).body).not.toMatch(/Rested units skip|Prefers the enemy Support/);
    expect(keywordTutorial(missile).body).toMatch(/Rested units skip/);
  });
});

