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
 * Lesson 12 — Drop Support Fire 2 into the middle lane for exact HQ lethal.
 * Front 0+2 Assaults (4 ATK each) = 8 into empty enemy; HQ 12 needs +4.
 * Deploy one SF2 into row 1 → each Assault gains +2 → 6+6=12, one-turn HQ kill.
 * Wrong lane / skip: only 8 (or 10) — not lethal this turn.
 */
export const SUPPORT_FIRE_SCENARIO: ScenarioDraft = {
  id: "support-fire",
  number: 12,
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
  number: 13,
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
 * Lesson 14 — First Strike + Trap.
 * Correct: First Strike chips Heimdall; Trap mutual-kills Horus (Retaliate); arty finishes Heimdall.
 * Skip Trap (or both): Xuanwu HP 6 dies to Horus return (8−2 armor); P2 Horus open-lanes your HQ 8.
 * Trap only (no First Strike): Heimdall lives at 5 after one arty shot; P2 open-lanes HQ (ATK 8).
 */
export const EXTRA_ATTACK_SCENARIO: ScenarioDraft = {
  id: "extra-attack",
  number: 14,
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

/** Lesson 15 — Artillery from Support, no return fire. */
export const ARTILLERY_SCENARIO: ScenarioDraft = {
  id: "artillery",
  number: 15,
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

/** Lesson 16 — Jet Plane trades return fire. */
export const JET_PLANE_SCENARIO: ScenarioDraft = {
  id: "jet-plane",
  number: 16,
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
 * Lesson 17 — Rally + jets race HQ 17 this turn.
 * Skip Rally: 6+8=14 leaves HQ at 3; P2 enemy (Front ATK 8) deletes your 8 HQ.
 * Rally on wrong unit: same shortfall.
 */
export const PLAYSTYLE_AGGRO_SCENARIO: ScenarioDraft = {
  id: "playstyle-aggro",
  number: 17,
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
 * Lesson 18 — Heatseeking redirects a wasted missile lock onto Sarama.
 * Correct: Heatseeking → gun 4 + missile 4 = 8 kills Sarama.
 * Skip Heatseeking: missile wastes on empty; Sarama at 4 HP returns ATK 8 and deletes Xuanwu,
 * then P2 finishes your HQ (8).
 */
export const PLAYSTYLE_MISSILE_ARTY_SCENARIO: ScenarioDraft = {
  id: "playstyle-missile-arty",
  number: 18,
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
 * Lesson 19 — Quick Engagement doubles Fenrir into Sarama; regular clears both.
 * Sarama HP 14 needs two Aggressive shots (QE 7 + regular 7). Skip QE: one shot leaves
 * Sarama at 7; P2 kills Fenrir then open-lanes your HQ 8 on the following turn.
 */
export const PLAYSTYLE_TANK_ROBOT_SCENARIO: ScenarioDraft = {
  id: "playstyle-tank-robot",
  number: 19,
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
  SUPPORT_FIRE_SCENARIO,
  MISSILE_SCENARIO,
  EXTRA_ATTACK_SCENARIO,
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
