import { UNITS } from "../data/units";
import { nextRng } from "./rng";
import type { DeployBuff, UnitDef } from "./types";

export type AiDifficulty = "easy" | "normal" | "hard";

export const AI_DIFFICULTIES = ["easy", "normal", "hard"] as const;

export function isAiDifficulty(value: unknown): value is AiDifficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

export const AI_DIFFICULTY_LABEL: Record<AiDifficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

export const AI_DIFFICULTY_BLURB: Record<AiDifficulty, string> = {
  easy: "The AI uses the 8-unit army you built, with the standard rules.",
  normal:
    "Only the AI: +1 random unit, +1 base Supply, HQ 70. Armor above 3: +2 HP. Armor 3 or less: +1 Armor. An empty AI deck is shuffled back from the discard. Your HQ stays 60 and your base Supply stays 4.",
  hard:
    "Only the AI: +2 random units, +2 base Supply, HQ 80, and +1 card each turn. Every AI unit +3 HP. Armor 3 or less: +1 Armor. Armor above 3: +1 ATK. An empty AI deck is shuffled back from the discard. Your HQ stays 60 and your base Supply stays 4.",
};

export interface AiProfile {
  extraUnits: number;
  baseSupply: number;
  hqBonus: number;
  drawBonus: number;
  recycleDeck: boolean;
  deployBuff?: DeployBuff;
}

export function aiProfile(difficulty: AiDifficulty): AiProfile | null {
  if (difficulty === "normal") {
    return {
      extraUnits: 1,
      baseSupply: 1,
      hqBonus: 10,
      drawBonus: 0,
      recycleDeck: true,
      deployBuff: { hp: 0, highArmorHp: 2, highArmorAtk: 0, lowArmor: 1 },
    };
  }
  if (difficulty === "hard") {
    return {
      extraUnits: 2,
      baseSupply: 2,
      hqBonus: 20,
      drawBonus: 1,
      recycleDeck: true,
      deployBuff: { hp: 3, highArmorHp: 0, highArmorAtk: 1, lowArmor: 1 },
    };
  }
  return null;
}

export function expandAiArmy(
  unitIds: number[],
  extra: number,
  rngState: number,
): { unitIds: number[]; added: number[]; rngState: number } {
  const bag = UNITS.map((unit) => unit.id).filter((id) => !unitIds.includes(id));
  const added: number[] = [];
  let state = rngState;
  for (let n = 0; n < extra && bag.length > 0; n++) {
    const step = nextRng(state);
    state = step.state;
    const index = Math.floor(step.value * bag.length);
    added.push(bag.splice(index, 1)[0]!);
  }
  return { unitIds: [...unitIds, ...added], added, rngState: state };
}

/** Printed Armor decides which half of a difficulty buff applies. */
export function buffedUnitStats(def: UnitDef, buff: DeployBuff | undefined): { hp: number; atk: number; armor: number } {
  if (!buff) return { hp: def.hp, atk: def.atk, armor: def.armor };
  let hp = def.hp + buff.hp;
  let atk = def.atk;
  let armor = def.armor;
  if (def.armor > 3) {
    hp += buff.highArmorHp;
    atk += buff.highArmorAtk;
  } else {
    armor += buff.lowArmor;
  }
  return { hp, atk, armor };
}
