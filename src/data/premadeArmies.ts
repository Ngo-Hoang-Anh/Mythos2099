export const PREMADE_ARMIES: Record<string, { name: string; description: string; units: number[] }> = {
  tank_robot: {
    name: "Tank + Robot",
    description: "All tanks and robots, plus the sturdiest light vehicles.",
    units: [
      1,
      2,
      3,
      13,
      14,
      15,
      6,
      5,
    ],
  },
  retaliate: {
    name: "Retaliate",
    description: "Retaliate walls on the Frontline, artillery shooting from Support.",
    units: [
      17,
      3,
      18,
      7,
      13,
      16,
      12,
      11,
    ],
  },
  support_fire: {
    name: "Support Fire",
    description: "Every Support Fire aura, plus Rally and Vision Support to cash in the buff.",
    units: [
      15,
      5,
      9,
      18,
      21,
      24,
      7,
      6,
    ],
  },
  jet_infantry: {
    name: "Jets + Infantry",
    description: "Jet fighters with infantry up front and Siege Howitzer on the back line.",
    units: [
      27,
      26,
      25,
      16,
      17,
      18,
      12,
      11,
    ],
  },
  aggro: {
    name: "Aggro",
    description: "Blitz and Flank into empty lanes, Rally for ATK, Diversion to yank blockers, then race the enemy HQ to 0.",
    units: [
      27,
      26,
      4,
      19,
      21,
      6,
      7,
      8,
    ],
  },
};

export const DEFAULT_P1 = PREMADE_ARMIES.tank_robot.units;
export const DEFAULT_P2 = PREMADE_ARMIES.tank_robot.units;
