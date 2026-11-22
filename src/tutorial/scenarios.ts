import { parseKeywords } from "../engine/keywords";
import {
  P1_FRONT,
  P1_SUPPORT,
  P2_FRONT,
  P2_SUPPORT,
  type Keyword,
  type UnitClass,
} from "../engine/types";
import {
  freePlayBehavior,
  isFreePlay,
  lessonBehavior,
  referencedUnitIds,
  setupScenario,
  type CustomUnitDraft,
  type ScenarioDraft,
} from "./authored";
import type { LessonDef, LessonId } from "./lessons";

function kw(text: string): Keyword[] {
  return parseKeywords(text);
}

function unit(
  id: number,
  name: string,
  unitClass: UnitClass,
  stats: {
    hp: number;
    atk: number;
    armor?: number;
    ap?: number;
    cost?: number;
    keywords?: string;
    cards?: string[];
    artAliasId?: number;
  },
): CustomUnitDraft {
  return {
    id,
    name,
    class: unitClass,
    hp: stats.hp,
    atk: stats.atk,
    armor: stats.armor ?? 0,
    ap: stats.ap ?? 0,
    cost: stats.cost ?? 0,
    keywordText: stats.keywords ?? "",
    cardTemplateIds: stats.cards ?? [],
    artAliasId: stats.artAliasId,
  };
}

const HQ60 = { hp: 60, max: 60 } as const;

/**
 * Lesson 01 — free-play summon + trade.
 * Correct: Cadet row 2 trades Dummy ATK 1 (P2 also pokes Cadet between volleys).
 * Wrong lane: Cadet never contests Dummy → on P2 turn Dummy volleys your 1 HP HQ.
 */
export const BASIC_SCENARIO: ScenarioDraft = {
  id: "basic",
  number: 1,
  title: "Summon & Engagement",
  subtitle:
    "Understanding Supply cost, unit combat stats, and simultaneous damage resolution.",
  coach: [
    "An enemy Dummy is threatening your position. Summon a Cadet from your reserve onto the board (Lane 3) to hold the line. Notice that combat resolves simultaneously—units reduced to 0 HP will still fire their final shot before being destroyed.",
  ],
  success: "Eliminate all enemy forces on the board.",
  hubStats: ["supply", "hp", "atk"],
  keywords: [],
  youFirst: true,
  supply: [4, 4],
  hq: [{ hp: 1, max: 60 }, HQ60],
  board: [{ defId: 103, owner: 1, col: P2_FRONT, row: 2, hp: 8, atk: 1 }],
  reserve: [[101], []],
  hand: [],
  deck: [],
  units: [
    unit(101, "Cadet", "Robot", {
      hp: 6,
      atk: 3,
      cost: 3,
      keywords: "Blitz",
      cards: ["forward"],
      artAliasId: 14,
    }),
    unit(103, "Dummy", "Helicopter", { hp: 8, atk: 1 }),
  ],
  beats: [],
  win: "elimination",
  // First lesson: teach Supply / HP / ATK, Reserve summon, and the hourglass.
  spotlight: { stats: ["supply", "hp", "atk"], reserve: true, hourglass: true },
};

/**
 * Lesson 02 — HQ win via empty lanes (must finish this turn).
 * Correct: Blitz Cadets on open rows 0 & 3 → 3+3 = HQ 6.
 * Wrong jam: Cadets into Armor 8 deal 0; return ATK 6 deletes them → elimination.
 * Wrong (1 Cadet / skip): P2 mid blockers volley empty lanes into your HQ (6+6).
 */
export const VICTORY_SCENARIO: ScenarioDraft = {
  id: "victory",
  number: 2,
  title: "Win Conditions",
  subtitle: "Achieving victory via HQ Destruction through empty Front lanes.",
  coach: [
    "The enemy HQ is nearly broken, but two heavily armored blockers clog the middle lanes—ignore them. Summon Cadets into the two open lanes this turn: empty Front lanes shoot the HQ directly, and enough open firepower wins by HQ destruction before their blockers can answer.",
  ],
  success: "Destroy the enemy HQ through open lanes.",
  hubStats: ["hp", "atk", "supply"],
  keywords: [],
  youFirst: true,
  supply: [4, 4],
  hq: [
    { hp: 8, max: 60 },
    { hp: 6, max: 60 },
  ],
  board: [
    { defId: 103, owner: 1, col: P2_FRONT, row: 1, hp: 20, armor: 8, atk: 6 },
    { defId: 103, owner: 1, col: P2_FRONT, row: 2, hp: 20, armor: 8, atk: 6 },
  ],
  reserve: [[101, 101], []],
  hand: [],
  deck: [],
  units: [
    unit(101, "Cadet", "Robot", {
      hp: 6,
      atk: 3,
      cost: 2,
      keywords: "Blitz",
      cards: ["forward"],
      artAliasId: 14,
    }),
    unit(103, "Bastion Dummy", "Tank", { hp: 20, atk: 6, armor: 8 }),
  ],
  beats: [],
  win: "hq",
  // Win-condition focus — do not re-teach Supply / Reserve / hourglass.
};

/**
 * Lesson 03 — going second, Initiative Move, HQ race.
 * Need Cadet (2) + Recruit Blitz (1) on open fronts = 3 into HQ.
 * Dummy blocks row 0; Initiative Move is the only way to get Cadet Front without Rest.
 * Wrong (supply / skip move / Cadet only): Dummy ATK 5 deletes your 5 HQ next.
 */
export const RESOURCES_SCENARIO: ScenarioDraft = {
  id: "resources",
  number: 3,
  title: "Going Second & Initiative",
  subtitle: "Capitalizing on second-turn tempo and tactical movement.",
  formula: "Going second → Fully Prepared",
  coach: [
    "Going second grants you the Special Initiative card. Play Initiative to move your Cadet from the support row directly to the Frontline without losing its turn, then deploy Recruit to mobilize maximum firepower against the weakened enemy HQ!",
  ],
  success: "Destroy the enemy HQ in a single turn.",
  hubStats: ["supply"],
  keywords: [],
  youFirst: false,
  supply: [0, 4],
  hq: [
    { hp: 5, max: 60 },
    { hp: 3, max: 60 },
  ],
  // Support → opening advance is Rested (no HQ snipe). Next P2 turn Dummy is live ATK 5.
  board: [{ defId: 103, owner: 1, col: P2_SUPPORT, row: 0, hp: 8, atk: 5 }],
  reserve: [[101, 102], []],
  hand: [{ player: 0, ownerDefId: 101, templateId: "initiative" }],
  deck: [],
  units: [
    unit(101, "Cadet", "Robot", {
      hp: 6,
      atk: 2,
      cost: 3,
      cards: ["blitzkrieg"],
      artAliasId: 14,
    }),
    unit(102, "Recruit", "Robot", {
      hp: 4,
      atk: 1,
      cost: 1,
      keywords: "Blitz",
      cards: ["repair"],
      artAliasId: 13,
    }),
    unit(103, "Dummy", "Helicopter", { hp: 8, atk: 5 }),
  ],
  beats: [],
  win: "hq",
  // First cards lesson: drag up to play. Discard-redraw is taught in movement-updown.
  spotlight: { cards: true },
};

/**
 * Lesson 04 — Forward (no Rest) vs Engagement Advance (Rested).
 * Lane 1: Thoth A Support vs Enemy A — no Forward → auto-Advance + Rest (no shot).
 * Lane 2: Thoth B Support vs Enemy B (Flank) — must Forward to kill before Flank snipes HQ.
 */
export const MOVEMENT_FORWARD_SCENARIO: ScenarioDraft = {
  id: "movement-forward",
  number: 4,
  title: "Tactical Movement: Forward & Advance",
  subtitle:
    "Understanding the Rested penalty from auto-Advancing vs playing Forward",
  coach: [
    "Advancing automatically during Engagement applies RESTED, skipping its attack. Use 'Forward' in Maneuver to advance without Resting! Compare both lanes: play Forward on Lane 2 to strike immediately, while Thoth A on Lane 1 auto-Advances and Rests.",
  ],
  success:
    "Enemy B eliminated cleanly using Forward while observing Lane 1 Auto-Advance.",
  hubStats: [],
  keywords: [],
  youFirst: true,
  supply: [2, 2],
  hq: [{ hp: 5, max: 60 }, HQ60],
  board: [
    { defId: 1151, owner: 0, col: P1_SUPPORT, row: 1 },
    { defId: 1141, owner: 1, col: P2_FRONT, row: 1, hp: 5, atk: 2 },
    { defId: 1152, owner: 0, col: P1_SUPPORT, row: 2 },
    { defId: 1142, owner: 1, col: P2_FRONT, row: 2, hp: 5, atk: 5 },
  ],
  reserve: [[], []],
  hand: [{ player: 0, ownerDefId: 1152, templateId: "forward" }],
  deck: [],
  units: [
    unit(1151, "Thoth A", "Robot", { hp: 10, atk: 5, artAliasId: 15 }),
    unit(1152, "Thoth B", "Robot", {
      hp: 10,
      atk: 5,
      cards: ["forward"],
      artAliasId: 15,
    }),
    unit(1141, "Enemy A", "Light Vehicle", { hp: 5, atk: 2, artAliasId: 4 }),
    unit(1142, "Enemy B", "Light Vehicle", {
      hp: 5,
      atk: 5,
      keywords: "Flank",
      artAliasId: 4,
    }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
};

/**
 * Lesson 05 — Up/Down block + Discard-Redraw.
 * Outer Guardians (rows 0 & 3) must step inward to block 10 ATK Destroyers (rows 1 & 2).
 * Hand starts with two Move Up — discard one to redraw Move Down from the deck.
 * HQ at 1 HP: any open inner lane is instant loss.
 */
export const MOVEMENT_UPDOWN_SCENARIO: ScenarioDraft = {
  id: "movement-updown",
  number: 5,
  title: "Vertical Relocation & Card Redraw",
  subtitle:
    "Use Up/Down cards to block enemies and Discard to Redraw from your Deck",
  coach: [
    "Your HQ has only 1 HP! Two enemy destroyers in inner lanes 2 & 3 threaten your HQ. You hold two 'Move Up' cards, but need a 'Move Down' card. Drag one 'Move Up' card onto your Deck to Discard & Redraw for 'Move Down', then shift both units inward to block!",
  ],
  success:
    "Redrawn successfully, blocked both lanes, and protected the 1 HP HQ.",
  hubStats: [],
  keywords: [],
  youFirst: true,
  supply: [2, 2],
  hq: [{ hp: 1, max: 60 }, HQ60],
  board: [
    { defId: 1153, owner: 0, col: P1_FRONT, row: 0 },
    { defId: 1154, owner: 0, col: P1_FRONT, row: 3 },
    { defId: 1155, owner: 1, col: P2_FRONT, row: 1, hp: 6, atk: 10 },
    { defId: 1155, owner: 1, col: P2_FRONT, row: 2, hp: 6, atk: 10 },
  ],
  reserve: [[], []],
  hand: [
    { player: 0, ownerDefId: 1153, templateId: "up" },
    { player: 0, ownerDefId: 1154, templateId: "up" },
  ],
  deck: [{ player: 0, ownerDefId: 1153, templateId: "down" }],
  units: [
    unit(1153, "Guardian North", "Robot", {
      hp: 12,
      atk: 8,
      cards: ["up", "down"],
      artAliasId: 14,
    }),
    unit(1154, "Guardian South", "Robot", {
      hp: 12,
      atk: 8,
      cards: ["up", "down"],
      artAliasId: 13,
    }),
    unit(1155, "Elite Destroyer", "Light Vehicle", {
      hp: 6,
      atk: 10,
      artAliasId: 4,
    }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
  spotlight: { discardRedraw: true },
};

/**
 * Lesson 06 — Match AP guns to heavy armor; raw ATK to high-HP soft targets.
 * Starts MISMATCHED: Assault(10/0) faces Bastion(6/8), Rostam(6/8) faces Heavy(20/0).
 * Correct: 2× Retreat (diagonal lane swap onto Support) + 2× Forward →
 * Skip swap / leave Front empty: HQ is at 1 HP — open lanes lose immediately.
 */
export const ARMOR_SCENARIO: ScenarioDraft = {
  id: "armor",
  number: 6,
  title: "Armor vs Armor Piercing (AP)",
  subtitle: "Exploiting unit stat matchups and specialized penetration.",
  formula: "Gun: ATK − max(0, Armor − AP)",
  coach: [
    "Match high-AP guns into heavy armor, and raw ATK into high-HP soft targets.",
    "Your formation is in the wrong lanes — play 2 Retreat cards (diagonal into the correct Support rows) then 2 Forward cards to swap before you open fire.",
  ],
  success: "Destroy both targets by matching the right weapon to each threat.",
  hubStats: ["armor", "ap"],
  keywords: [],
  youFirst: true,
  supply: [4, 4],
  hq: [{ hp: 1, max: 60 }, HQ60],
  board: [
    // Mismatched start — Assault faces Bastion, Rostam faces Heavy.
    { defId: 1041, owner: 0, col: P1_FRONT, row: 2 },
    { defId: 1045, owner: 0, col: P1_FRONT, row: 1 },
    { defId: 1042, owner: 1, col: P2_FRONT, row: 1, hp: 20, armor: 0, atk: 4 },
    { defId: 1046, owner: 1, col: P2_FRONT, row: 2, hp: 6, armor: 8, atk: 6 },
  ],
  reserve: [[], []],
  hand: [
    { player: 0, ownerDefId: 1041, templateId: "retreat" },
    { player: 0, ownerDefId: 1045, templateId: "retreat" },
    { player: 0, ownerDefId: 1041, templateId: "forward" },
    { player: 0, ownerDefId: 1045, templateId: "forward" },
  ],
  deck: [],
  units: [
    unit(1041, "Assault Officer", "Armored Infantry", {
      hp: 12,
      atk: 10,
      cards: ["retreat", "forward"],
      artAliasId: 17,
    }),
    unit(1045, "Rostam AP", "Armored Infantry", {
      hp: 10,
      atk: 6,
      ap: 8,
      cards: ["retreat", "forward"],
      artAliasId: 16,
    }),
    unit(1042, "Heavy Trooper", "Armored Infantry", {
      hp: 20,
      atk: 4,
      artAliasId: 18,
    }),
    unit(1046, "Bastion", "Tank", {
      hp: 6,
      atk: 6,
      armor: 8,
      artAliasId: 3,
    }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
  spotlight: { stats: ["armor", "ap"] },
};

/**
 * Lesson 07 — Comeback rebound then Forward rush the enemy HQ.
 * Turn 1: Maneuver with 0 SP / 0 cards — End Maneuver into Engagement.
 *   Front Cadet (row 0) dies → Comeback (+1S & +1 draw). Front Cadet (row 2, 5 ATK / 6 HP)
 *   survives Enforcer ATK 5 and holds the lane; reinforcements must Forward to join the fight.
 * Turn 2: 4+1 board +1 Comeback = 6 SP → 2 Cadets (cost 2) + 2× Forward (cost 1).
 * Turn 3+: Clean up and open-lane the 5 HP enemy HQ.
 */
export const COMEBACK_SCENARIO: ScenarioDraft = {
  id: "comeback",
  number: 7,
  title: "Comeback Mechanics",
  subtitle: "Rebound with bonus supply and draw cards when behind",
  formula:
    "Behind on army → +1 Supply & +1 draw next turn (stacks)  ·  HQ marks at 40/25/15/10",
  coach: [
    "Your HQ is at 10 HP and you open with no Supply and no cards. End Maneuver to enter Engagement. One Cadet will fall and trigger Comeback; the other survives the hit with 5 ATK. Next turn, spend Comeback Supply to summon reinforcements and Forward them onto the Frontline to finish their 5 HP HQ!",
  ],
  success:
    "Comeback aid claimed, enemy forces cleared, and their HQ destroyed.",
  hubStats: ["supply"],
  keywords: [],
  youFirst: true,
  supply: [0, 4],
  hq: [
    { hp: 10, max: 60 },
    { hp: 5, max: 60 },
  ],
  board: [
    // Dies on P2's volley → Comeback while behind on army.
    { defId: 101, owner: 0, col: P1_FRONT, row: 0, hp: 2, rested: true },
    {
      defId: 101,
      owner: 0,
      col: P1_FRONT,
      row: 2,
      hp: 6,
      atk: 5,
      rested: true,
    },
    { defId: 103, owner: 1, col: P2_FRONT, row: 0, hp: 3, atk: 3 },
    // Open-lane ATK 3 keeps HQ 10 alive on turn 1 (3+3=6).
    { defId: 103, owner: 1, col: P2_FRONT, row: 1, hp: 3, atk: 3 },
    // ATK 5 into survivor HP 6 → leaves 1 HP; survivor keeps ATK 5 for the Forward rush.
    { defId: 103, owner: 1, col: P2_FRONT, row: 2, hp: 5, atk: 5 },
    { defId: 103, owner: 1, col: P2_FRONT, row: 3, hp: 3, atk: 3 },
  ],
  reserve: [[101, 101], []],
  hand: [],
  deck: [
    { player: 0, ownerDefId: 101, templateId: "forward" },
    { player: 0, ownerDefId: 101, templateId: "forward" },
  ],
  units: [
    // Cost 2: survivor on board (+1) + Comeback (+1) → 6 SP pays 2 deploys + 2 Forwards.
    unit(101, "Cadet", "Robot", {
      hp: 6,
      atk: 5,
      cost: 2,
      cards: ["forward"],
      artAliasId: 14,
    }),
    unit(103, "Enforcer", "Helicopter", { hp: 3, atk: 3 }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "hq",
  spotlight: { comeback: true },
};

export const COVER_FLANK_SCENARIO: ScenarioDraft = {
  id: "cover-flank",
  number: 10,
  title: "Flank & Cover Tactics",
  subtitle: "Executing automated positioning and defensive intercepts.",
  coach: [
    "Your HQ is at critical health against a deadly 10 ATK enemy! Drop Xuanwu (Cover) onto the field and pass the turn. Hermes (Flank) will automatically sidestep into an open lane to strike the enemy HQ, while Xuanwu leaps forward to block the fatal strike!",
  ],
  success: "Protect your HQ and eliminate the enemy HQ.",
  hubStats: [],
  keywords: kw("Flank, Cover"),
  youFirst: true,
  supply: [3, 3],
  hq: [
    { hp: 10, max: 60 },
    { hp: 10, max: 60 },
  ],
  board: [
    { defId: 1073, owner: 0, col: P1_FRONT, row: 2 },
    { defId: 1071, owner: 1, col: P2_FRONT, row: 2, hp: 15, atk: 10 },
  ],
  reserve: [[1072], []],
  hand: [],
  deck: [],
  units: [
    unit(1073, "Hermes", "Motorcycle", {
      hp: 6,
      atk: 5,
      keywords: "Flank",
      artAliasId: 19,
    }),
    unit(1072, "Xuanwu Cover", "Tank", {
      hp: 12,
      atk: 2,
      armor: 2,
      cost: 3,
      keywords: "Cover",
      artAliasId: 3,
    }),
    unit(1071, "Destroyer Tank", "Tank", {
      hp: 15,
      atk: 10,
      artAliasId: 1,
    }),
  ],
  beats: [],
  win: "hq",
  spotlight: { keywords: true },
};

/**
 * Lesson 09 — Retreat weak scouts, Blitz Fenrir into an open lane, Aggressive snipes HQ.
 * Attacking with scouts into Retaliate 5 suicides them (HP 3 < 5 return).
 * Correct: deploy Fenrir (Blitz) on open row 2, Retreat both scouts, then engage —
 * scouts Advance+Rest (no swing into Retaliate); Fenrir's Aggressive open-lane volleys HQ.
 */
export const AGGRESSIVE_SCENARIO: ScenarioDraft = {
  id: "aggressive",
  number: 11,
  title: "Aggressive vs Retaliate & Retreat",
  subtitle: "Neutralizing counter-attacks through tactical disengagement.",
  coach: [
    "Your HQ has only 1 HP remaining, and the enemy squad has Retaliate! Attacking directly with weak units will trigger lethal counter-fire. Use the 'Retreat' card to pull your scout back to Support (Resting it), clearing a lane for Fenrir (Aggressive 4) to finish the job safely.",
  ],
  success:
    "Retreat your weak unit and clear all targets without taking counter-damage.",
  hubStats: [],
  keywords: kw("Aggressive 4, Retaliate 5"),
  youFirst: true,
  supply: [4, 4],
  hq: [
    { hp: 1, max: 60 },
    { hp: 12, max: 60 },
  ],
  board: [
    { defId: 1081, owner: 0, col: P1_FRONT, row: 0 },
    { defId: 1081, owner: 0, col: P1_FRONT, row: 1 },
    { defId: 1082, owner: 1, col: P2_FRONT, row: 0, hp: 4, atk: 1 },
    { defId: 1082, owner: 1, col: P2_FRONT, row: 1, hp: 4, atk: 1 },
  ],
  reserve: [[1083], []],
  hand: [
    { player: 0, ownerDefId: 1081, templateId: "retreat" },
    { player: 0, ownerDefId: 1081, templateId: "retreat" },
  ],
  deck: [],
  units: [
    unit(1081, "Weak Scout", "Light Vehicle", {
      hp: 3,
      atk: 1,
      cards: ["retreat"],
      artAliasId: 4,
    }),
    unit(1083, "Fenrir", "Tank", {
      hp: 8,
      atk: 4,
      armor: 2,
      cost: 4,
      keywords: "Aggressive 4, Blitz",
      artAliasId: 2,
    }),
    unit(1082, "Heimdall Counter", "Armored Infantry", {
      hp: 4,
      atk: 1,
      keywords: "Retaliate 5",
      artAliasId: 17,
    }),
  ],
  beats: [],
  win: "hq",
  spotlight: { keywords: true },
};

/**
 * Lesson 12 — Barrier timing vs Aggressive / Retaliate.
 * Both Aegis start Support with 1 Supply → only one Forward this turn.
 * Correct: Forward the Retaliate lane. Barrier soaks the big counter; Aggressive-lane
 *   auto-Advances Resting so Barrier stays for their Aggressive shot next.
 * Wrong: Forward the Aggressive lane. Barrier burns on the weak counter; their Aggressive
 *   volley kills the unit, then the open lane deletes your HQ.
 */
export const BARRIER_TIMING_SCENARIO: ScenarioDraft = {
  id: "barrier-timing",
  number: 12,
  title: "Barrier Timing",
  subtitle: "Barrier only blocks the next frontal hit — spend it wisely.",
  coach: [
    "Barrier soaks one frontal gun hit, then drops until your next turn. Trigger it on the hit that matters, especially when the enemy has Aggressive or Retaliate. You have 1 Supply — pick a lane.",
  ],
  success: "Eliminate both enemies.",
  hubStats: [],
  keywords: kw("Barrier 4"),
  youFirst: true,
  supply: [1, 1],
  hq: [
    { hp: 5, max: 60 },
    { hp: 60, max: 60 },
  ],
  board: [
    { defId: 1201, owner: 0, col: P1_SUPPORT, row: 0 },
    { defId: 1202, owner: 0, col: P1_SUPPORT, row: 1 },
    { defId: 1203, owner: 1, col: P2_FRONT, row: 0, hp: 10, atk: 2 },
    { defId: 1204, owner: 1, col: P2_FRONT, row: 1, hp: 4, atk: 2 },
  ],
  reserve: [[], []],
  hand: [
    { player: 0, ownerDefId: 1201, templateId: "forward" },
    { player: 0, ownerDefId: 1202, templateId: "forward" },
  ],
  deck: [],
  units: [
    unit(1201, "Aegis Alpha", "Tank", {
      hp: 6,
      atk: 4,
      keywords: "Barrier 4",
      cards: ["forward"],
      artAliasId: 3,
    }),
    unit(1202, "Aegis Beta", "Tank", {
      hp: 6,
      atk: 4,
      keywords: "Barrier 4",
      cards: ["forward"],
      artAliasId: 3,
    }),
    unit(1203, "Raider", "Light Vehicle", {
      hp: 10,
      atk: 2,
      keywords: "Aggressive 4",
      artAliasId: 4,
    }),
    unit(1204, "Sentinel", "Armored Infantry", {
      hp: 4,
      atk: 2,
      keywords: "Retaliate 5",
      artAliasId: 17,
    }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
  spotlight: { keywords: true },
};

/**
 * Lesson 13 — Smoke Screen timing (inverse of Barrier).
 * Correct: Forward Alpha into Aggressive → light counter deploys Smoke → their Aggressive
 *   (and later Retaliate counters) redirect to HQ. Extra HP so Veils clear the board ~2
 *   turns later, after the dodge→HQ beat is visible.
 * Wrong: Forward Beta into Retaliate — ATK+Retaliate 10 kills HP 10 before Smoke helps.
 */
export const SMOKE_TIMING_SCENARIO: ScenarioDraft = {
  id: "smoke-timing",
  number: 13,
  title: "Smoke Screen Timing",
  subtitle: "Smoke only deploys after you take damage — time it.",
  coach: [
    "Smoke Screen deploys only after you take HP damage, then gun shots against that unit go to HQ. Trigger it before the hit that would kill you, especially when the enemy has Aggressive or Retaliate. You have 1 Supply — pick a lane.",
  ],
  success: "Eliminate both enemies.",
  hubStats: [],
  keywords: kw("Smoke Screen"),
  youFirst: true,
  supply: [1, 1],
  hq: [
    // Tank every smoked redirect (Aggressive + Retaliate, including corpse counters) until Veils finish.
    { hp: 40, max: 60 },
    { hp: 60, max: 60 },
  ],
  board: [
    { defId: 1211, owner: 0, col: P1_SUPPORT, row: 0 },
    { defId: 1212, owner: 0, col: P1_SUPPORT, row: 1 },
    { defId: 1213, owner: 1, col: P2_FRONT, row: 0, hp: 18, atk: 2 },
    { defId: 1214, owner: 1, col: P2_FRONT, row: 1, hp: 14, atk: 2 },
  ],
  reserve: [[], []],
  hand: [
    { player: 0, ownerDefId: 1211, templateId: "forward" },
    { player: 0, ownerDefId: 1212, templateId: "forward" },
  ],
  deck: [],
  units: [
    unit(1211, "Veil Alpha", "Light Vehicle", {
      hp: 10,
      atk: 4,
      keywords: "Smoke Screen",
      cards: ["forward"],
      artAliasId: 36,
    }),
    unit(1212, "Veil Beta", "Light Vehicle", {
      hp: 10,
      atk: 4,
      keywords: "Smoke Screen",
      cards: ["forward"],
      artAliasId: 36,
    }),
    unit(1213, "Raider", "Light Vehicle", {
      hp: 18,
      atk: 2,
      keywords: "Aggressive 4",
      artAliasId: 4,
    }),
    unit(1214, "Sentinel", "Armored Infantry", {
      hp: 14,
      atk: 2,
      keywords: "Retaliate 8",
      artAliasId: 17,
    }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
  spotlight: { keywords: true },
};

/**
 * Lesson 14 — Match Shock values to Shield / Barrier / Smoke pools.
 * Deploy+Blitz each Shock into the right lane:
 *   Shock 1 ATK 1 → Veil Smoke+Shield1 HP2 (strip 1, chip 1 → smoke; finish next turn)
 *   Shock 2 ATK 6 → Shield4 HP4 (strip 2, shield eats 2, punch 4) — clears T1
 *   Shock 4 ATK 9 → Barrier4 HP9 (strip 4, punch 9) — clears T1
 * T1: Shield+Barrier die; Veil lives at 1 with Smoke. P2: Spark's counter into Veil
 *   redirects to HQ (smoke beat). Smoke expires; T2 Shock1 strips regen Shield and kills.
 * Spark HP 5 survives Veil ATK 2 twice. Enemy ATK 2 open-lanes the 2 HP HQ on mismatch.
 */
export const SHOCK_MATCH_SCENARIO: ScenarioDraft = {
  id: "shock-match",
  number: 14,
  title: "Shock vs Shield, Barrier & Smoke",
  subtitle: "Match Shock values to the right defense pools before you fire.",
  coach: [
    "Shock depletes Shield and Barrier before your gun hit. The Smoker also carries Shield 1 — Shock 1 strips it so your ATK can chip, then Smoke deploys and gun shots against that unit go to HQ until it fades. Deploy each Shock with Blitz into the matching lane: Shock 1 vs Smoke+Shield1, Shock 2 vs Shield 4, Shock 4 vs Barrier 4. Mis-match any lane and a survivor will break your 2 HP HQ.",
  ],
  success: "Match all three Shock values and eliminate the enemy line.",
  hubStats: [],
  keywords: kw("Shock 4, Shield 4, Barrier 4, Smoke Screen"),
  youFirst: true,
  supply: [0, 0],
  hq: [
    { hp: 2, max: 60 },
    // High so a partial clear cannot HQ-snipe before survivors finish your 2 HP HQ.
    { hp: 200, max: 200 },
  ],
  board: [
    { defId: 1224, owner: 1, col: P2_FRONT, row: 0, hp: 2, atk: 2 },
    { defId: 1225, owner: 1, col: P2_FRONT, row: 1, hp: 4, atk: 2 },
    { defId: 1226, owner: 1, col: P2_FRONT, row: 2, hp: 9, atk: 2 },
  ],
  reserve: [[1222, 1223, 1221], []],
  hand: [],
  deck: [],
  units: [
    unit(1221, "Shock Bolt", "Robot", {
      hp: 3,
      atk: 9,
      cost: 0,
      keywords: "Shock 4; Blitz",
      artAliasId: 14,
    }),
    unit(1222, "Shock Spark", "Robot", {
      // Survive Veil ATK 2 on T1 counter + T1 P2 attack; finish Veil on T2.
      hp: 5,
      atk: 1,
      cost: 0,
      keywords: "Shock 1; Blitz",
      artAliasId: 15,
    }),
    unit(1223, "Shock Arc", "Robot", {
      hp: 3,
      atk: 6,
      cost: 0,
      keywords: "Shock 2; Blitz",
      artAliasId: 13,
    }),
    unit(1224, "Veil Smoker", "Light Vehicle", {
      hp: 2,
      atk: 2,
      keywords: "Smoke Screen; Shield 1",
      artAliasId: 36,
    }),
    unit(1225, "Aegis Shield", "Tank", {
      hp: 4,
      atk: 2,
      keywords: "Shield 4",
      artAliasId: 3,
    }),
    unit(1226, "Ward Barrier", "Tank", {
      hp: 9,
      atk: 2,
      keywords: "Barrier 4",
      artAliasId: 1,
    }),
  ],
  beats: [],
  win: "elimination",
  spotlight: { keywords: true, reserve: true },
};

/**
 * Lesson 15 — Drop Support Fire 2 into the middle lane for exact HQ lethal.
 * Front 0+2 Assaults (4 ATK each) = 8 into empty enemy; HQ 12 needs +4.
 * Deploy one SF2 into row 1 → each Assault gains +2 → 6+6=12, one-turn HQ kill.
 * Wrong lane / skip: only 8 (or 10) — not lethal this turn.
 */
export const SUPPORT_FIRE_SCENARIO: ScenarioDraft = {
  id: "support-fire",
  number: 15,
  title: "Support Fire Stacking",
  subtitle: "Maximizing adjacent attack buffs for exact lethal damage.",
  coach: [
    "Goal: Destroy the enemy HQ in 1 turn! Your current units on lanes 1 and 3 deal 8 total damage, leaving you 4 damage short of destroying the 12 HP HQ. Deploy a Support Fire unit into the middle slot (Lane 2) to grant +2 ATK to both adjacent allies!",
  ],
  success: "Destroy the enemy HQ in 1 turn using Support Fire.",
  hubStats: [],
  keywords: kw("Support Fire 2"),
  youFirst: true,
  supply: [3, 3],
  hq: [
    { hp: 12, max: 60 },
    { hp: 12, max: 60 },
  ],
  board: [
    { defId: 1091, owner: 0, col: P1_FRONT, row: 0 },
    { defId: 1091, owner: 0, col: P1_FRONT, row: 2 },
    // Support-only Dummy so open Front lanes still shoot HQ, but skip-SF is not an elimination win.
    { defId: 103, owner: 1, col: P2_SUPPORT, row: 3, hp: 20, atk: 0 },
  ],
  reserve: [[1092], []],
  hand: [],
  deck: [],
  units: [
    unit(1091, "Assault Trooper", "Light Vehicle", {
      hp: 6,
      atk: 4,
      artAliasId: 4,
    }),
    unit(1092, "Eir Support", "Light Vehicle", {
      hp: 6,
      atk: 1,
      cost: 3,
      keywords: "Support Fire 2",
      artAliasId: 5,
    }),
    unit(103, "Dummy", "Helicopter", { hp: 20, atk: 12 }),
  ],
  beats: [],
  win: "hq",
  spotlight: { keywords: true },
};

/** Lesson 13 — Missile mark then detonate. Raiju HP 13 survives Sarama ATK 6. */
export const MISSILE_SCENARIO: ScenarioDraft = {
  id: "missile",
  number: 16,
  title: "Delayed Missile Strikes",
  subtitle: "Managing two-phase target locking and armor halving.",
  coach: [
    "Missile attacks require two turns: Turn 1 mark the target and turn 2 launch the missile. Missle provide indirect damage to other lanes. Use this to wear down enemy force to avoid direct confrontation.",
  ],
  success: "Lock and detonate a missile strike to eliminate Sarama.",
  hubStats: ["ap", "armor"],
  keywords: kw("Missile 4"),
  youFirst: true,
  supply: [4, 4],
  hq: [HQ60, HQ60],
  board: [
    { defId: 4, owner: 1, col: P2_FRONT, row: 1, hp: 2, armor: 2, atk: 6 },
    { defId: 4, owner: 1, col: P2_FRONT, row: 2, hp: 5, armor: 2, atk: 6 },
    { defId: 4, owner: 1, col: P2_FRONT, row: 3, hp: 2, armor: 2, atk: 6 },
  ],
  reserve: [[8, 8], []],
  hand: [],
  deck: [],
  units: [
    unit(8, "Raiju", "Helicopter", {
      hp: 6,
      atk: 4,
      cost: 4,
      keywords: "Missile 4,Blitz",
    }),
    unit(4, "Sarama", "Light Vehicle", { hp: 5, atk: 8, armor: 2 }),
  ],
  beats: [],
  win: "elimination",
  // Missile keyword only — Armor/AP were taught in lesson 04.
  spotlight: { keywords: true },
};

/**
 * Lesson 17 — Scout Recon.
 * Deploy Pathfinder (Blitz + Scout) into the Smoke lane:
 *   Scout on Front ignores Camo / Smoke / Suppression; gun kills Veil; Spotter gun + Missile kill Ghost.
 * Skip / wrong empty row: Ghost and/or Veil live → Aggressive finishes Spotter / HQ next turn (exact).
 *
 * Near-miss math:
 *   Spotter HP 3 survives Ghost return 2 at 1; Pathfinder HP 2 survives Veil return 1 at 1.
 *   Ghost 2+Agg4 = 6 and Veil 1+Agg5 = 6 both exact-lethal vs Spotter leftover / HQ 6.
 */
export const SCOUT_RECON_SCENARIO: ScenarioDraft = {
  id: "scout-recon",
  number: 17,
  title: "Scout Recon",
  subtitle:
    "Frontline Scout ignores Camouflage, Smoke, and Suppression — Blitz gets it there this turn.",
  coach: [
    "Your Missile is locked on Ghost (Camouflage) but that cell is Suppressed — and Veil already has Smoke up, so guns go to HQ. Both enemies have enough Aggressive to end you next turn. Deploy Pathfinder (Blitz + Scout) into the Smoke lane: once Scout is on Frontline, Missiles pierce Camouflage, guns ignore Smoke, Suppression on you is ignored, and Pathfinder finishes Veil in the same engagement.",
  ],
  success: "Eliminate Ghost and Veil in one turn.",
  hubStats: [],
  keywords: kw("Camouflage, Suppression, Scout, Blitz"),
  youFirst: true,
  supply: [0, 0],
  hq: [
    { hp: 6, max: 60 },
    { hp: 60, max: 60 },
  ],
  board: [
    {
      defId: 1301,
      owner: 0,
      col: P1_FRONT,
      row: 0,
      statuses: [{ kind: "suppressionMark", remainingPasses: 4 }],
      missileTarget: { col: P2_FRONT, row: 0 },
    },
    {
      defId: 1303,
      owner: 1,
      col: P2_FRONT,
      row: 0,
    },
    {
      defId: 1304,
      owner: 1,
      col: P2_FRONT,
      row: 1,
      statuses: [{ kind: "smokeDodge", remainingPasses: 2 }],
    },
  ],
  reserve: [[1302], []],
  hand: [],
  deck: [],
  units: [
    unit(1301, "Spotter", "Helicopter", {
      hp: 3,
      atk: 2,
      keywords: "Missile 4",
      artAliasId: 8,
    }),
    unit(1302, "Pathfinder", "Light Vehicle", {
      hp: 2,
      atk: 6,
      cost: 0,
      keywords: "Blitz; Scout",
      artAliasId: 4,
    }),
    unit(1303, "Ghost", "Robot", {
      hp: 6,
      atk: 2,
      keywords: "Camouflage; Aggressive 4",
      artAliasId: 14,
    }),
    unit(1304, "Veil", "Light Vehicle", {
      hp: 6,
      atk: 1,
      keywords: "Smoke Screen; Aggressive 5",
      artAliasId: 30,
    }),
  ],
  beats: [],
  win: "elimination",
  spotlight: { keywords: true, reserve: true },
};

/**
 * Lesson 26 — Veteran farm + First Strike answer.
 *
 * T1 P1: Deploy Vanguard (Veteran 2) row 0 + Forward → farm Grunt (stack → 4/2).
 * T2 P2: Deploy Ambush (Cover; First Strike 3) row 2 — Cover blocked by Grunt Front; Advance rests.
 * T3 P1: Deploy Aegis (Barrier 4; Blitz) into Ambush — soak return; Vanguard finishes Grunt (→ 6/4).
 * T4 P2: Rally + First Strike card delete Aegis before Barrier recharges; Pillar HQ again.
 * T5 P1: Striker (First Strike 3, cost 4) + Supply + Rally + Down Vanguard onto Pillar → elimination.
 *
 * Supply budget (real costs — not free deploys):
 *   T1 start CP 4: Vanguard 3 + Forward 1 = 4 exact.
 *   T3 CP = 4+1 = 5: Aegis 3 (Blitz).
 *   T5 CP = 4+1 = 5: Striker 4 + Rally 1 + Down 1 = 6 → must play Supply (+2).
 * Near-miss:
 *   Pillar open-lanes HQ 5+5; P1 HQ 11 survives. Third shot (delayed farm) kills.
 *   End HP: Striker 1, Vanguard 4.
 *   Grunt HP 9 so T2 Veteran return (4) does not delete the farm target early.
 */
export const VETERAN_FIRST_STRIKE_SCENARIO: ScenarioDraft = {
  id: "veteran-first-strike",
  number: 26,
  title: "Veteran Farm & First Strike",
  subtitle:
    "Stack Veteran between fights. First Strike hits before the gun volley.",
  coach: [
    "Veteran permanently grows after each of your attack volleys. First Strike adds damage before normal gunfire — on the unit and on the card. Clear the board before Pillar finishes your HQ.",
  ],
  success: "Eliminate all enemy forces.",
  hubStats: [],
  keywords: kw("Veteran 2, First Strike 3"),
  youFirst: true,
  // T1: Vanguard 3 + Forward 1. Later turns use normal 4 + board units.
  supply: [4, 4],
  hq: [
    { hp: 11, max: 60 },
    { hp: 60, max: 60 },
  ],
  board: [
    { defId: 1324, owner: 1, col: P2_FRONT, row: 0 },
    { defId: 1325, owner: 1, col: P2_FRONT, row: 1 },
  ],
  reserve: [[1321, 1322, 1323], [1326]],
  hand: [
    { player: 0, ownerDefId: 1321, templateId: "forward" },
    { player: 0, ownerDefId: 1321, templateId: "down" },
    { player: 0, ownerDefId: 1321, templateId: "rally" },
    { player: 0, ownerDefId: 1321, templateId: "supply" },
    { player: 1, ownerDefId: 1326, templateId: "rally" },
    { player: 1, ownerDefId: 1326, templateId: "first_strike" },
  ],
  deck: [],
  units: [
    unit(1321, "Vanguard", "Tank", {
      hp: 11,
      atk: 2,
      armor: 1,
      ap: 0,
      cost: 3,
      keywords: "Veteran 2",
      cards: ["forward_1", "down_1", "rally", "supply"],
      artAliasId: 3,
    }),
    unit(1322, "Aegis", "Tank", {
      hp: 8,
      atk: 1,
      armor: 0,
      ap: 0,
      cost: 3,
      keywords: "Blitz; Barrier 4",
      artAliasId: 3,
    }),
    unit(1323, "Striker", "Light Vehicle", {
      hp: 5,
      atk: 2,
      armor: 0,
      ap: 2,
      cost: 4,
      keywords: "Blitz; First Strike 3",
      artAliasId: 4,
    }),
    unit(1324, "Grunt", "Armored Infantry", {
      // HP 9: T1 chip 1 → 8; T2 Veteran return 4 → 4; T3 gun 4 finishes (corpse returns).
      // Lower HP lets T2 return delete Grunt and skips the second Veteran stack.
      hp: 9,
      atk: 1,
      armor: 1,
      ap: 1,
      artAliasId: 17,
    }),
    unit(1325, "Pillar", "Tank", {
      hp: 5,
      atk: 5,
      armor: 5,
      ap: 0,
      artAliasId: 2,
    }),
    unit(1326, "Ambush", "Light Vehicle", {
      hp: 6,
      atk: 4,
      armor: 3,
      ap: 0,
      cost: 3,
      keywords: "Cover; First Strike 3",
      cards: ["rally", "first_strike"],
      artAliasId: 30,
    }),
  ],
  beats: [],
  win: "elimination",
  // Keyword intros only — no reserve/hourglass click-hints.
  spotlight: { keywords: true },
};

/**
 * Lesson 18 — Hulldown / Sloped / Corrosion / Radar.
 * T1: Acid Eye (Blitz + Radar + Corrosion 3) into Slope → Radar locks Dig-A; Corrosion strips Slope; missiles 4+4 kill Dig-A.
 * T2: Diversion C pulls Dig-B onto the empty lock (move clears Hulldown) → missiles finish Dig-B.
 * T3: Wedge ATK 4 finishes naked Slope.
 * Wrong locks start on Dig-B so Radar is required to prefer Dig-A (same lane as the missile shooters).
 *
 * Near-miss math (separate T2/T3):
 *   P2 open-lane Dig-B 3 + Slope 2 = 5/turn while Dig-B lives, then Slope 2 alone.
 *   HQ 8 → 3 after P2 T1 → 1 after P2 T2 → win. Skip Diversion: Dig-B+Slope = 5 kills HQ 3 next turn.
 *   Lockfront HP 7 survives Dig-A return 3 then Dig-B return 3 at 1 (must live for its Missile).
 *   Lockback is missile-only padding (HP 2). Wedge HP 2 dies to Slope return after the kill (mutual).
 */
export const HULLDOWN_SLOPE_SCENARIO: ScenarioDraft = {
  id: "hulldown-slope",
  number: 18,
  title: "Dig In & Soften Armor",
  subtitle:
    "Missiles ignore Hulldown; Corrosion strips Sloped’s armor; Radar re-aims bad locks; Diversion moves clear dig-in.",
  coach: [
    "Two missiles are locked on the wrong cell, and Dig-A is Hulldown — guns take −3, but Missiles ignore it. Slope’s Armor 3 + Sloped Armor ricochets anything that leaves 1–3 after armor (even ATK 6). Deploy the Radar/Corrosion drone into Slope’s lane: Radar re-aims both Missiles onto Dig-A, Corrosion strips the 3 Armor. Next, Diversion the far Hulldown onto the empty missile lock — moving clears Hulldown. Finally drop the ATK 4 Wedge to finish the now-naked Slope.",
  ],
  success: "Eliminate Dig-A, Dig-B, and Slope.",
  hubStats: [],
  keywords: kw("Hulldown, Sloped Armor, Corrosion 3, Radar"),
  youFirst: true,
  supply: [2, 2],
  hq: [
    { hp: 8, max: 60 },
    { hp: 60, max: 60 },
  ],
  board: [
    {
      defId: 1311,
      owner: 0,
      col: P1_FRONT,
      row: 0,
      // Wrong living lock — without Radar these fire Dig-B instead of Dig-A.
      missileTarget: { col: P2_FRONT, row: 3 },
    },
    {
      defId: 1312,
      owner: 0,
      col: P1_SUPPORT,
      row: 0,
      missileTarget: { col: P2_FRONT, row: 3 },
    },
    {
      defId: 1315,
      owner: 1,
      col: P2_FRONT,
      row: 0,
      statuses: [{ kind: "hulldownArmor" }],
    },
    {
      defId: 1317,
      owner: 1,
      col: P2_FRONT,
      row: 1,
      armor: 3,
    },
    {
      defId: 1316,
      owner: 1,
      col: P2_FRONT,
      row: 3,
      statuses: [{ kind: "hulldownArmor" }],
    },
  ],
  reserve: [[1313, 1314], []],
  hand: [{ player: 0, ownerDefId: 1311, templateId: "diversion" }],
  deck: [],
  units: [
    unit(1311, "Lockfront", "Helicopter", {
      hp: 7,
      atk: 2,
      keywords: "Missile 4",
      cards: ["diversion_c"],
      artAliasId: 8,
    }),
    unit(1312, "Lockback", "Artillery", {
      hp: 2,
      atk: 0,
      keywords: "Missile 4",
      artAliasId: 10,
    }),
    unit(1313, "Acid Eye", "Drone", {
      hp: 2,
      atk: 2,
      cost: 0,
      keywords: "Blitz; Radar; Corrosion 3",
      artAliasId: 22,
    }),
    unit(1314, "Wedge", "Light Vehicle", {
      hp: 2,
      atk: 4,
      cost: 0,
      keywords: "Blitz",
      artAliasId: 4,
    }),
    unit(1315, "Dig-A", "Tank", {
      hp: 8,
      atk: 3,
      keywords: "Hulldown",
      artAliasId: 3,
    }),
    unit(1316, "Dig-B", "Tank", {
      hp: 8,
      atk: 3,
      keywords: "Hulldown",
      artAliasId: 1,
    }),
    unit(1317, "Slope", "Tank", {
      hp: 4,
      atk: 2,
      armor: 3,
      keywords: "Sloped Armor",
      artAliasId: 2,
    }),
  ],
  beats: [],
  win: "elimination",
  spotlight: { keywords: true, reserve: true },
};

/**
 * Lesson 19 — First Strike + Trap.
 * Correct: First Strike chips Heimdall; Trap mutual-kills Horus (Retaliate); arty finishes Heimdall.
 * Skip Trap (or both): Xuanwu HP 6 dies to Horus return (8−2 armor); P2 Horus open-lanes your HQ 8.
 * Trap only (no First Strike): Heimdall lives at 5 after one arty shot; P2 open-lanes HQ (ATK 8).
 */
export const EXTRA_ATTACK_SCENARIO: ScenarioDraft = {
  id: "extra-attack",
  number: 19,
  title: "Extra Attacks & Extra Engagements",
  subtitle: "Manipulating turn order with First Strike and Trap.",
  coach: [
    "Control the battle before regular Engagement begins! Play 'First Strike' on Houyi to deliver a free attack without taking return fire, then play 'Trap' on Lane 4 to force Horus into an early duel against Xuanwu's Retaliate!",
  ],
  success: "Execute both special card actions and clean up the board.",
  hubStats: ["atk"],
  keywords: [],
  youFirst: true,
  supply: [3, 3],
  hq: [{ hp: 8, max: 60 }, HQ60],
  board: [
    { defId: 11, owner: 0, col: P1_SUPPORT, row: 2, hp: 6, atk: 5 },
    { defId: 3, owner: 0, col: P1_FRONT, row: 3, hp: 6, atk: 2, armor: 2 },
    { defId: 17, owner: 1, col: P2_FRONT, row: 2, hp: 10, atk: 8 },
    { defId: 22, owner: 1, col: P2_FRONT, row: 3, hp: 5, atk: 8 },
  ],
  reserve: [[], []],
  hand: [
    { player: 0, ownerDefId: 11, templateId: "first_strike" },
    { player: 0, ownerDefId: 3, templateId: "trap" },
  ],
  deck: [],
  units: [
    unit(11, "Houyi", "Artillery", {
      hp: 6,
      atk: 5,
      keywords: "Artillery",
      cards: ["first_strike"],
    }),
    unit(3, "Xuanwu", "Tank", {
      hp: 6,
      atk: 2,
      armor: 2,
      keywords: "Retaliate 5",
      cards: ["trap"],
    }),
    unit(17, "Heimdall", "Armored Infantry", { hp: 10, atk: 8 }),
    unit(22, "Horus", "Drone", { hp: 5, atk: 8 }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
};

/**
 * Lesson 20 — Fire DoT on HQ: ignite with Fire 3, refresh with Fire 1–2.
 * Empty enemy board (open-lane HQ only). P2 hand holds Sniping cards (2 dmg) that
 * delete your 2 HP burners so Incendiary cannot keep refreshing Fire by itself.
 * Deck filler keeps P2 from elimination with no board units.
 *
 * Damage budget (guns ATK 1; Fire ticks at end of each turn pass):
 *   Correct (Ember refresh on T3 into a different open lane):
 *     T1 gun 1 + tick 3  →  4   (Incendiary ignites Fire 3)
 *     T2          tick 3  →  7   (enemy Sniping deletes Incendiary)
 *     T3 gun 1 + tick 3  → 11   (Ember Fire 1 refreshes, keeps mag 3)
 *     T4          tick 3  → 14   (enemy Sniping deletes Ember — no T5 gun)
 *     T5          tick 3  → 17   exact lethal burn-only finish
 *   Skip refresh: gun 1 + 3×Fire3 ticks = 10 → HQ left at 7 (fail).
 *
 * HQ 17 = 2 guns (ignite + refresh) + 5×Fire3 ticks.
 */
export const FIRE_SCENARIO: ScenarioDraft = {
  id: "fire",
  number: 20,
  title: "Fire Burn & Refresh",
  subtitle: "Ignite HQ with Fire 3, then refresh the burn with weaker Fire.",
  coach: [
    "Incendiary already holds an open lane — end Deployment to shoot the enemy HQ and ignite Fire 3. The enemy will play Sniping (2 damage, ignores armor) from hand to delete your 2 HP burner. Before Fire expires, deploy Ember (Fire 1) or Cinder (Fire 2) into a different open lane: weaker Fire refreshes duration but keeps Fire 3. Let the burn finish the 17 HP HQ — you do not need another shot on the last turn.",
  ],
  success: "Destroy the enemy HQ with Fire burn within 5 turns.",
  hubStats: [],
  keywords: kw("Fire 3"),
  youFirst: true,
  supply: [0, 0],
  hq: [
    { hp: 60, max: 60 },
    { hp: 17, max: 60 },
  ],
  board: [
    {
      defId: 1101,
      owner: 0,
      col: P1_FRONT,
      row: 1,
      hp: 2,
      atk: 1,
    },
  ],
  reserve: [[1102, 1103], []],
  hand: [
    { player: 1, ownerDefId: 1104, templateId: "sniping" },
    { player: 1, ownerDefId: 1104, templateId: "sniping" },
  ],
  // Filler so P2 is not eliminated with an empty board (Sniping needs no source on field).
  deck: [
    { player: 1, ownerDefId: 1104, templateId: "supply" },
    { player: 1, ownerDefId: 1104, templateId: "supply" },
    { player: 1, ownerDefId: 1104, templateId: "supply" },
    { player: 1, ownerDefId: 1104, templateId: "supply" },
    { player: 1, ownerDefId: 1104, templateId: "supply" },
    { player: 1, ownerDefId: 1104, templateId: "supply" },
  ],
  units: [
    unit(1101, "Incendiary", "Light Vehicle", {
      hp: 2,
      atk: 1,
      cost: 0,
      keywords: "Fire 3",
      artAliasId: 27,
    }),
    unit(1102, "Ember", "Light Vehicle", {
      hp: 1,
      atk: 1,
      cost: 0,
      keywords: "Fire 1; Blitz",
      artAliasId: 4,
    }),
    unit(1103, "Cinder", "Light Vehicle", {
      hp: 1,
      atk: 1,
      cost: 0,
      keywords: "Fire 2; Blitz",
      artAliasId: 5,
    }),
    // Card owner only — never placed on the board (hand/deck ownership).
    unit(1104, "Marksman", "Helicopter", {
      hp: 1,
      atk: 0,
      cost: 99,
      cards: [
        "sniping",
        "sniping",
        "supply",
        "supply",
        "supply",
        "supply",
        "supply",
        "supply",
      ],
      artAliasId: 8,
    }),
  ],
  beats: [],
  win: "hq",
  spotlight: { keywords: true },
};

/** Lesson 21 — Artillery from Support, no return fire. */
export const ARTILLERY_SCENARIO: ScenarioDraft = {
  id: "artillery",
  number: 21,
  title: "Support Line Firepower (Artillery)",
  subtitle: "Raining fire from safety without taking return fire.",
  coach: [
    "Artillery units fight exclusively from the Support row. They take a Rest turn when deployed, but once active, they unleash devastating strikes that CANNOT be counter-attacked by enemy units!",
  ],
  success: "Deploy Houyi and destroy the target without taking damage.",
  hubStats: [],
  keywords: kw("Artillery"),
  youFirst: true,
  supply: [4, 4],
  hq: [HQ60, HQ60],
  board: [{ defId: 103, owner: 1, col: P2_FRONT, row: 2, hp: 6, atk: 5 }],
  reserve: [[11], []],
  hand: [],
  deck: [],
  units: [
    unit(11, "Houyi Quiver", "Artillery", {
      hp: 6,
      atk: 6,
      cost: 4,
      keywords: "Artillery",
    }),
    unit(103, "Dummy", "Helicopter", { hp: 6, atk: 5 }),
  ],
  beats: [],
  win: "elimination",
  spotlight: { keywords: true },
};

/** Lesson 22 — Jet Plane trades return fire. */
export const JET_PLANE_SCENARIO: ScenarioDraft = {
  id: "jet-plane",
  number: 22,
  title: "Aerial Combat (Jet Plane)",
  subtitle: "High-mobility support units that engage in reciprocal trades.",
  coach: [
    "Unlike Artillery, Jet Planes fighting from the Support row WILL exchange return fire when attacking. Deploy Raijin, endure the initial Rest turn, and trade shots to neutralize the enemy heavy!",
  ],
  success: "Deploy Raijin Tempest and win the aerial trade.",
  hubStats: [],
  keywords: kw("Jet Plane"),
  youFirst: true,
  supply: [4, 4],
  hq: [{ hp: 5, max: 60 }, HQ60],
  board: [{ defId: 103, owner: 1, col: P2_FRONT, row: 2, hp: 6, atk: 5 }],
  reserve: [[25], []],
  hand: [],
  deck: [],
  units: [
    unit(25, "Raijin Tempest", "Jet Plane", {
      hp: 13,
      atk: 3,
      cost: 4,
      keywords: "Jet Plane",
    }),
    unit(103, "Dummy", "Helicopter", { hp: 6, atk: 5 }),
  ],
  beats: [],
  win: "elimination",
  spotlight: { keywords: true },
};

/**
 * Lesson 18 — Rally + jets race HQ 17 this turn.
 * Skip Rally: 6+8=14 leaves HQ at 3; P2 enemy (Front ATK 8) deletes your 8 HQ.
 * Rally on wrong unit: same shortfall.
 */
export const PLAYSTYLE_AGGRO_SCENARIO: ScenarioDraft = {
  id: "playstyle-aggro",
  number: 23,
  title: "Aggro Rush",
  subtitle: "Overwhelming the enemy HQ with Blitz, Flank, and Rally.",
  coach: [
    "Speed is everything! The enemy HQ has 17 HP left. Cast 'Rally' on Komet (+3 ATK) and let Stealthray (Flank) bypass blockers to deliver exactly 17 damage directly to the enemy HQ this turn!",
  ],
  success: "Destroy the enemy HQ in a single turn.",
  hubStats: ["hp", "supply"],
  keywords: kw("Blitz, Flank"),
  youFirst: true,
  supply: [7, 3],
  hq: [
    { hp: 8, max: 60 },
    { hp: 17, max: 60 },
  ],
  board: [
    // { defId: 27, owner: 0, col: P1_FRONT, row: 0, hp: 8, atk: 6 },
    { defId: 26, owner: 0, col: P1_FRONT, row: 1, hp: 8, atk: 8 },
    // Open lane 1 → on P2 turn this shoots your HQ if you failed the race.
    { defId: 22, owner: 1, col: P2_FRONT, row: 1, hp: 12, atk: 8 },
    { defId: 22, owner: 1, col: P2_FRONT, row: 3, hp: 12, atk: 8 },
  ],
  reserve: [[27], []],
  hand: [{ player: 0, ownerDefId: 6, templateId: "rally" }],
  deck: [],
  units: [
    unit(27, "Komet", "Jet Plane", {
      hp: 8,
      atk: 6,
      cost: 6,
      keywords: "Jet Plane, Blitz",
      cards: ["rally"],
    }),
    unit(26, "Stealthray", "Jet Plane", {
      hp: 8,
      atk: 8,
      keywords: "Jet Plane, Flank",
    }),
    unit(6, "Support", "Light Vehicle", { hp: 6, atk: 2, cards: ["rally"] }),
    unit(19, "Support2", "Motorcycle", { hp: 6, atk: 2 }),
    unit(22, "Enemy", "Drone", { hp: 12, atk: 8 }),
  ],
  beats: [],
  startPhase: "deployment",
  win: "hq",
};

/**
 * Lesson 19 — Heatseeking redirects a wasted missile lock onto Sarama.
 * Correct: Heatseeking → gun 4 + missile 4 = 8 kills Sarama.
 * Skip Heatseeking: missile wastes on empty; Sarama at 4 HP returns ATK 8 and deletes Xuanwu,
 * then P2 finishes your HQ (8).
 */
export const PLAYSTYLE_MISSILE_ARTY_SCENARIO: ScenarioDraft = {
  id: "playstyle-missile-arty",
  number: 24,
  title: "Missile & Artillery Salvo",
  subtitle: "Redirecting locked ordnance behind a Cover wall.",
  coach: [
    "Tiamat's missile target is currently locked on an empty lane. While Xuanwu holds the Frontline with Cover, play 'Heatseeking' to redirect Tiamat's missile lock directly onto Sarama to obliterate her!",
  ],
  success: "Redirect Tiamat's missile and destroy Sarama.",
  hubStats: ["armor"],
  keywords: kw("Cover, Artillery, Missile 5"),
  youFirst: true,
  supply: [3, 3],
  hq: [{ hp: 8, max: 60 }, HQ60],
  board: [
    { defId: 3, owner: 0, col: P1_FRONT, row: 2, hp: 6, atk: 2, armor: 2 },
    {
      defId: 10,
      owner: 0,
      col: P1_SUPPORT,
      row: 2,
      hp: 8,
      atk: 4,
      ap: 4,
      missileTarget: { col: P2_FRONT, row: 0 },
    },
    { defId: 4, owner: 1, col: P2_FRONT, row: 2, hp: 8, armor: 2, atk: 8 },
  ],
  reserve: [[], []],
  hand: [{ player: 0, ownerDefId: 10, templateId: "heatseeking" }],
  deck: [],
  units: [
    unit(3, "Xuanwu", "Tank", { hp: 6, atk: 2, armor: 2, keywords: "Cover" }),
    unit(10, "Tiamat", "Artillery", {
      hp: 8,
      atk: 4,
      ap: 4,
      keywords: "Artillery, Missile 5",
      cards: ["heatseeking"],
    }),
    unit(4, "Sarama", "Light Vehicle", { hp: 8, atk: 8, armor: 2 }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
};

/**
 * Lesson 20 — Quick Engagement doubles Fenrir into Sarama; regular clears both.
 * Sarama HP 14 needs two Aggressive shots (QE 7 + regular 7). Skip QE: one shot leaves
 * Sarama at 7; P2 kills Fenrir then open-lanes your HQ 8 on the following turn.
 */
export const PLAYSTYLE_TANK_ROBOT_SCENARIO: ScenarioDraft = {
  id: "playstyle-tank-robot",
  number: 25,
  title: "Armored Breakthrough",
  subtitle: "Clearing path blockers with pre-engagement strikes.",
  coach: [
    "Two heavy defenders block your path. Play 'Quick Engagement' on Fenrir during the Maneuver phase to trigger an early attack with Aggressive 4, destroying Sarama before regular combat begins!",
  ],
  success: "Clear both frontline blockers using Quick Engagement.",
  hubStats: ["atk", "hp"],
  keywords: kw("Aggressive 4"),
  youFirst: true,
  supply: [3, 3],
  hq: [{ hp: 8, max: 60 }, HQ60],
  board: [
    { defId: 14, owner: 0, col: P1_FRONT, row: 0, hp: 8, atk: 4, armor: 2 },
    { defId: 2, owner: 0, col: P1_FRONT, row: 2, hp: 8, atk: 3, armor: 2 },
    // Off Fenrir's lane so a dead Fenrir leaves row 2 empty for Sarama → HQ (no Cover refill).
    { defId: 6, owner: 0, col: P1_SUPPORT, row: 1, hp: 6, atk: 2 },
    { defId: 22, owner: 1, col: P2_FRONT, row: 0, hp: 8, atk: 5 },
    { defId: 4, owner: 1, col: P2_FRONT, row: 2, hp: 14, atk: 8 },
  ],
  reserve: [[], []],
  hand: [{ player: 0, ownerDefId: 6, templateId: "quick_engagement" }],
  deck: [],
  units: [
    unit(14, "Skadi", "Robot", {
      hp: 8,
      atk: 4,
      armor: 2,
      keywords: "Aggressive 4",
    }),
    unit(2, "Fenrir", "Tank", {
      hp: 8,
      atk: 3,
      armor: 2,
      keywords: "Aggressive 4",
      cards: ["quick_engagement"],
    }),
    unit(6, "Support", "Light Vehicle", {
      hp: 6,
      atk: 2,
      cards: ["quick_engagement"],
    }),
    unit(22, "Horus", "Drone", { hp: 8, atk: 5 }),
    unit(4, "Sarama", "Light Vehicle", { hp: 14, atk: 8 }),
  ],
  beats: [],
  startPhase: "maneuver",
  win: "elimination",
};

export const FREE_PLAY_SCENARIOS: ScenarioDraft[] = [
  BASIC_SCENARIO,
  VICTORY_SCENARIO,
  RESOURCES_SCENARIO,
  MOVEMENT_FORWARD_SCENARIO,
  MOVEMENT_UPDOWN_SCENARIO,
  ARMOR_SCENARIO,
  COMEBACK_SCENARIO,
  COVER_FLANK_SCENARIO,
  AGGRESSIVE_SCENARIO,
  BARRIER_TIMING_SCENARIO,
  SMOKE_TIMING_SCENARIO,
  SHOCK_MATCH_SCENARIO,
  SUPPORT_FIRE_SCENARIO,
  MISSILE_SCENARIO,
  SCOUT_RECON_SCENARIO,
  HULLDOWN_SLOPE_SCENARIO,
  VETERAN_FIRST_STRIKE_SCENARIO,
  EXTRA_ATTACK_SCENARIO,
  FIRE_SCENARIO,
  ARTILLERY_SCENARIO,
  JET_PLANE_SCENARIO,
  PLAYSTYLE_AGGRO_SCENARIO,
  PLAYSTYLE_MISSILE_ARTY_SCENARIO,
  PLAYSTYLE_TANK_ROBOT_SCENARIO,
];

export function lessonFromDraft(draft: ScenarioDraft): LessonDef {
  const behavior = isFreePlay(draft)
    ? freePlayBehavior(draft)
    : lessonBehavior(draft.beats);
  return {
    id: draft.id as LessonId,
    number: draft.number,
    title: draft.title,
    subtitle: draft.subtitle,
    coach: draft.coach,
    formula: draft.formula,
    success: draft.success,
    hubStats: draft.hubStats,
    keywords: draft.keywords,
    units: referencedUnitIds(draft),
    setup: () => setupScenario(draft),
    ...behavior,
  };
}
