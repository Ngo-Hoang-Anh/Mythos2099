import { type Action, type Keyword, type MatchState } from "../engine/types";
import {
  AGGRESSIVE_SCENARIO,
  ARMOR_SCENARIO,
  ARTILLERY_SCENARIO,
  BASIC_SCENARIO,
  COMEBACK_SCENARIO,
  COVER_FLANK_SCENARIO,
  EXTRA_ATTACK_SCENARIO,
  JET_PLANE_SCENARIO,
  MISSILE_SCENARIO,
  MOVEMENT_FORWARD_SCENARIO,
  MOVEMENT_UPDOWN_SCENARIO,
  PLAYSTYLE_AGGRO_SCENARIO,
  PLAYSTYLE_MISSILE_ARTY_SCENARIO,
  PLAYSTYLE_TANK_ROBOT_SCENARIO,
  RESOURCES_SCENARIO,
  SUPPORT_FIRE_SCENARIO,
  VICTORY_SCENARIO,
  lessonFromDraft,
} from "./scenarios";

export type LessonId =
  | "basic"
  | "victory"
  | "resources"
  | "movement-forward"
  | "movement-updown"
  | "armor"
  | "comeback"
  | "cover-flank"
  | "aggressive"
  | "support-fire"
  | "missile"
  | "extra-attack"
  | "artillery"
  | "jet-plane"
  | "return-fire"
  | "playstyle-aggro"
  | "playstyle-missile-arty"
  | "playstyle-tank-robot";

export type TutorialId = LessonId | "build-army";

export interface LessonStep {
  id: string;
  label: string;
  done: (match: MatchState) => boolean;
}

export type TutAnchor = string;

export interface TutorialHud {
  reserveOpen: boolean;
  pendingDeploy: number | null;
  targetingTemplateId?: string | null;
  targetingPickedUnits?: number;
  /** True while a card TargetDraft is open — board uses real green/red reticles, no tut spotlight. */
  boardTargeting?: boolean;
  initiativeOpen?: boolean;
  animating?: boolean;
}

export interface LessonHint {
  id: string;
  anchor: TutAnchor;
  title: string;
  body: string;
  keywords?: Keyword[];
  next?: boolean;
  nextLabel?: string;
}

export type LessonStat = "hp" | "atk" | "armor" | "ap" | "supply";

export interface LessonDef {
  id: LessonId;
  number: number;
  title: string;
  subtitle: string;
  coach: string[];
  formula?: string;
  /** Stat icons on the hub card. Only what this lesson actually uses. */
  hubStats: LessonStat[];
  keywords: Keyword[];
  units: number[];
  success: string;
  setup: () => MatchState;
  allow: (match: MatchState, action: Action) => string | null;
  afterAction?: (match: MatchState, action: Action) => void;
  pickHint?: (
    match: MatchState,
    hud: TutorialHud,
    dismissed: ReadonlySet<string>,
  ) => LessonHint | null;
  /** Auto-played when it is not the student's turn (Resources opening). */
  scriptedAction?: (match: MatchState) => Action | null;
  /** Sandbox lessons block discard-redraw. Authored lessons opt in. */
  allowDiscardRedraw?: boolean;
  steps: LessonStep[];
}

const HINT_HOURGLASS: LessonHint = {
  id: "hourglass",
  anchor: "hourglass",
  title: "Press the hourglass",
  body: "This ends the current phase and starts the next one.",
};

export function pickLessonHint(
  lesson: LessonDef,
  match: MatchState,
  hud: TutorialHud,
  dismissed: ReadonlySet<string>,
): LessonHint | null {
  // Combat playback usually suppresses chrome, but Comeback must explain the
  // queued bonus before endEngagement starts the next turn and spends it.
  if (hud.animating || match.combatPlayback) {
    if (!lesson.pickHint) return null;
    const during = lesson.pickHint(match, hud, dismissed);
    return during?.id === "intro-comeback" ? during : null;
  }
  if (lesson.pickHint) return lesson.pickHint(match, hud, dismissed);
  if (match.phase === "deployment" || match.phase === "maneuver")
    return HINT_HOURGLASS;
  return null;
}

const BASIC: LessonDef = lessonFromDraft(BASIC_SCENARIO);

const VICTORY: LessonDef = lessonFromDraft(VICTORY_SCENARIO);

const RESOURCES: LessonDef = lessonFromDraft(RESOURCES_SCENARIO);

const MOVEMENT_FORWARD: LessonDef = lessonFromDraft(MOVEMENT_FORWARD_SCENARIO);

const MOVEMENT_UPDOWN: LessonDef = lessonFromDraft(MOVEMENT_UPDOWN_SCENARIO);

const ARMOR: LessonDef = lessonFromDraft(ARMOR_SCENARIO);

const COMEBACK: LessonDef = lessonFromDraft(COMEBACK_SCENARIO);

const COVER_FLANK: LessonDef = lessonFromDraft(COVER_FLANK_SCENARIO);

const AGGRESSIVE: LessonDef = lessonFromDraft(AGGRESSIVE_SCENARIO);

const SUPPORT_FIRE: LessonDef = lessonFromDraft(SUPPORT_FIRE_SCENARIO);

const MISSILE: LessonDef = lessonFromDraft(MISSILE_SCENARIO);

const EXTRA: LessonDef = lessonFromDraft(EXTRA_ATTACK_SCENARIO);

const ARTILLERY: LessonDef = lessonFromDraft(ARTILLERY_SCENARIO);

const JET: LessonDef = lessonFromDraft(JET_PLANE_SCENARIO);

const PLAYSTYLE_AGGRO: LessonDef = lessonFromDraft(PLAYSTYLE_AGGRO_SCENARIO);

const PLAYSTYLE_MISSILE_ARTY: LessonDef = lessonFromDraft(
  PLAYSTYLE_MISSILE_ARTY_SCENARIO,
);

const PLAYSTYLE_TANK_ROBOT: LessonDef = lessonFromDraft(
  PLAYSTYLE_TANK_ROBOT_SCENARIO,
);

/** Playable curriculum order (Return fire is hub-only until rewritten). */
export const LESSONS: LessonDef[] = [
  BASIC,
  VICTORY,
  RESOURCES,
  MOVEMENT_FORWARD,
  MOVEMENT_UPDOWN,
  ARMOR,
  COMEBACK,
  COVER_FLANK,
  AGGRESSIVE,
  SUPPORT_FIRE,
  MISSILE,
  EXTRA,
  ARTILLERY,
  JET,
  PLAYSTYLE_AGGRO,
  PLAYSTYLE_MISSILE_ARTY,
  PLAYSTYLE_TANK_ROBOT,
];

/** Hub CTA card id (styles: `.basic-complete-card`). Not a playable lesson. */
export const BASIC_COMPLETION_CARD_ID = "basic-complete" as const;

export type HubSectionId = "basic" | "special" | "keywords" | "strategy";

export interface HubLessonCard {
  id: string;
  title: string;
  subtitle: string;
  number?: number;
  hubStats: LessonStat[];
  keywords: Keyword[];
  placeholder?: boolean;
  /** Graduation card. Opens a choice; it is not a lesson and does not gate later sections. */
  cta?: boolean;
}

export interface HubSection {
  id: HubSectionId;
  eyebrow: string;
  title: string;
  intro?: string;
  cards: HubLessonCard[];
}

function hubCard(lesson: LessonDef): HubLessonCard {
  return {
    id: lesson.id,
    title: lesson.title,
    subtitle: lesson.subtitle,
    number: lesson.number,
    hubStats: lesson.hubStats,
    keywords: lesson.keywords,
  };
}

function lessonById(id: LessonId): LessonDef {
  const lesson = LESSONS.find((l) => l.id === id);
  if (!lesson) throw new Error(`Missing lesson ${id}`);
  return lesson;
}

/** Tutorial lobby sections — must stay in sync with `tutorialOrder()`. */
export const TUTORIAL_HUB: readonly HubSection[] = [
  {
    id: "basic",
    eyebrow: "Section 01",
    title: "Basics",
    intro:
      "How a match is won, Supply, summoning, movement, armor, Comeback, and building an army.",
    cards: [
      ...LESSONS.filter((l) => l.number <= 7).map(hubCard),
      {
        id: "build-army",
        title: "Build an army",
        subtitle: "8 units. Their cards are the deck.",
        number: 8,
        hubStats: [],
        keywords: [],
      },
      {
        id: BASIC_COMPLETION_CARD_ID,
        title: "You are ready for battle",
        subtitle:
          "Want to learn more and become an expert? Check the Mechanic Codex",
        number: 9,
        hubStats: [],
        keywords: [],
        cta: true,
      },
    ],
  },
  {
    id: "keywords",
    eyebrow: "Section 02",
    title: "Keywords",
    intro: "How keyword abilities change fights and positioning.",
    cards: [
      "cover-flank",
      "aggressive",
      "support-fire",
      "missile",
      "extra-attack",
    ].map((id) => hubCard(lessonById(id as LessonId))),
  },
  {
    id: "special",
    eyebrow: "Section 03",
    title: "Special units",
    intro: "Artillery and jets — firepower from Support and the air.",
    cards: ["artillery", "jet-plane"].map((id) =>
      hubCard(lessonById(id as LessonId)),
    ),
  },
  {
    id: "strategy",
    eyebrow: "Section 04",
    title: "Playstyles",
    intro: "Archetype sandboxes for common army shapes.",
    cards: [
      "playstyle-aggro",
      "playstyle-missile-arty",
      "playstyle-tank-robot",
    ].map((id) => hubCard(lessonById(id as LessonId))),
  },
];
