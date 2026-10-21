import type { UnitDef } from "../engine/types";

/** Training-only units. Not in the 27-unit catalog / army builder. */
export const TUTORIAL_CADET = 101;
export const TUTORIAL_RECRUIT = 102;
export const TUTORIAL_DUMMY = 103;

/** Reuse catalog models so tutorial tokens are not empty class-color boxes. */
export const TUTORIAL_ART_ALIAS: Record<number, number> = {
  [TUTORIAL_CADET]: 14,
  [TUTORIAL_RECRUIT]: 13,
};

/** Armored Infantry / Motorcycle / Drone packs (`squadArt`). */
export const TUTORIAL_SQUAD_ALIAS: Record<number, number> = {};

export const TUTORIAL_SPRITE_ALIAS: Record<number, number> = {
  [TUTORIAL_DUMMY]: 8,
};

export const TUTORIAL_UNITS: UnitDef[] = [
  {
    id: TUTORIAL_CADET,
    name: "Cadet",
    class: "Robot",
    hp: 8,
    atk: 3,
    armor: 0,
    ap: 0,
    cost: 3,
    keywords: [],
    cards: [],
    lore: "",
    hasArt: true,
  },
  {
    id: TUTORIAL_RECRUIT,
    name: "Recruit",
    class: "Robot",
    hp: 6,
    atk: 2,
    armor: 0,
    ap: 0,
    cost: 2,
    keywords: [],
    cards: [],
    lore: "",
    hasArt: true,
  },
  {
    id: TUTORIAL_DUMMY,
    name: "Target Dummy",
    class: "Helicopter",
    hp: 8,
    atk: 2,
    armor: 0,
    ap: 0,
    cost: 2,
    keywords: [],
    cards: [],
    lore: "",
    hasArt: false,
  },
];
