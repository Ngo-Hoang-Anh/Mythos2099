import {
  INITIATIVE_CARD_NAME,
  isInitiativeCard,
  makeInitiativeCard,
} from "../data/initiative";
import {
  TUTORIAL_CADET,
  TUTORIAL_DUMMY,
  TUTORIAL_RECRUIT,
} from "../data/tutorialUnits";
import { countUnits } from "../engine/board";
import { beginEngagement } from "../engine/combat/engagement";
import { relocateUnit } from "../engine/fx";
import { parseKeywords } from "../engine/keywords";
import {
  createSandboxMatch,
  discardedTemplate,
  giveUnitCard,
  giveUnitDeckCard,
  setPhase,
  setReserve,
  setSupply,
  spawnUnit,
  unitByDef,
} from "../engine/sandbox";
import { nid } from "../engine/state";
import {
  BASE_SUPPLY,
  DRAW_PER_TURN,
  HQ_BREAKPOINTS,
  HQ_MAX_HP,
  INITIATIVE_TEMPLATE_ID,
  P1_FRONT,
  P1_SUPPORT,
  P2_FRONT,
  P2_SUPPORT,
  type Action,
  type CardInstance,
  type Keyword,
  type MatchState,
} from "../engine/types";

export type LessonId =
  | "basic"
  | "resources"
  | "armor"
  | "maneuver"
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
  steps: LessonStep[];
}

const LANE_MID = 2;

const HINT_HOURGLASS: LessonHint = {
  id: "hourglass",
  anchor: "hourglass",
  title: "Press the hourglass",
  body: "This ends the current phase and starts the next one.",
};

function hintNext(
  id: string,
  anchor: TutAnchor,
  title: string,
  body: string,
  keywords?: Keyword[],
): LessonHint {
  return { id, anchor, title, body, keywords, next: true };
}

function hintGo(
  id: string,
  anchor: TutAnchor,
  title: string,
  body: string,
  keywords?: Keyword[],
): LessonHint {
  return { id, anchor, title, body, keywords };
}

function targeting(hud: TutorialHud, templateId: string): boolean {
  return hud.targetingTemplateId === templateId;
}

function pickedUnits(hud: TutorialHud): number {
  return hud.targetingPickedUnits ?? 0;
}

export function pickLessonHint(
  lesson: LessonDef,
  match: MatchState,
  hud: TutorialHud,
  dismissed: ReadonlySet<string>,
): LessonHint | null {
  if (hud.animating || match.combatPlayback) return null;
  if (lesson.pickHint) return lesson.pickHint(match, hud, dismissed);
  if (match.phase === "deployment" || match.phase === "maneuver")
    return HINT_HOURGLASS;
  return null;
}

function cardOf(match: MatchState, action: Action): CardInstance | undefined {
  if (action.type !== "playCard") return undefined;
  return match.players[0].hand.find(
    (card) => card.instanceId === action.cardId,
  );
}

function onlyEndPhase(
  match: MatchState,
  action: Action,
  from: "deployment" | "maneuver",
  need?: (match: MatchState) => string | null,
): string | null {
  if (action.type === "endDeployment" && from === "deployment")
    return need ? need(match) : null;
  if (action.type === "endManeuver" && from === "maneuver")
    return need ? need(match) : null;
  return "Follow the steps in the coach panel.";
}

function skipToFight(from: "deployment" | "maneuver"): LessonDef["allow"] {
  return (match, action) => onlyEndPhase(match, action, from);
}

function onBoard(match: MatchState, defId: number, owner: 0 | 1): boolean {
  return Boolean(unitByDef(match, defId, owner));
}

function countDef(match: MatchState, defId: number, owner: 0 | 1): number {
  let n = 0;
  for (const col of match.board) {
    for (const cell of col) {
      if (cell && cell.defId === defId && cell.owner === owner) n += 1;
    }
  }
  return n;
}

function hp(match: MatchState, defId: number, owner: 0 | 1): number {
  return unitByDef(match, defId, owner)?.hp ?? 0;
}

function dummyHp(match: MatchState): number {
  return hp(match, TUTORIAL_DUMMY, 1);
}

function resumeP1Deploy(match: MatchState): void {
  match.currentPlayer = 0;
  match.phase = "deployment";
  match.players[0].commandPoints = Math.max(
    0,
    BASE_SUPPLY + countUnits(match.board, 0),
  );
}

const BASIC: LessonDef = {
  id: "basic",
  number: 1,
  title: "Summon & Engagement",
  subtitle: "Supply, HP, ATK, and trading shots",
  hubStats: ["supply", "hp", "atk"],
  units: [TUTORIAL_CADET, TUTORIAL_DUMMY],
  keywords: [],
  coach: [
    "Cadet costs 3 Supply to summon.",
    "HP (bottom-left) is health. ATK (bottom-right) is damage each Engagement.",
    "Both sides shoot. A unit at 0 HP still returns fire, then dies. Watch 3 rounds.",
  ],
  success: "0 HP returns fire, then dies.",
  setup() {
    const state = createSandboxMatch();
    setReserve(state, 0, [TUTORIAL_CADET]);
    spawnUnit(state, {
      defId: TUTORIAL_DUMMY,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
    });
    return state;
  },
  allow(match, action) {
    if (action.type === "deploy") {
      if (onBoard(match, TUTORIAL_CADET, 0))
        return "Cadet is already on the board.";
      if (action.unitDefId !== TUTORIAL_CADET) return "Summon the Cadet.";
      if (action.row !== LANE_MID)
        return "Drop the Cadet on the middle Support cell (lane 3).";
      return null;
    }
    if (action.type === "endDeployment") {
      if (!onBoard(match, TUTORIAL_CADET, 0)) return "Summon the Cadet first.";
      return null;
    }
    return "Follow the on-screen popup.";
  },
  afterAction(match, action) {
    if (action.type === "deploy") {
      const cadet = unitByDef(match, TUTORIAL_CADET, 0);
      if (cadet && cadet.col === P1_SUPPORT) {
        relocateUnit(match, cadet, P1_FRONT, cadet.row);
        cadet.rested = false;
      }
      return;
    }
    if (action.type === "endEngagement" && onBoard(match, TUTORIAL_DUMMY, 1)) {
      resumeP1Deploy(match);
    }
  },
  pickHint(match, hud, dismissed) {
    if (!onBoard(match, TUTORIAL_CADET, 0)) {
      if (!dismissed.has("supply")) {
        return hintNext(
          "supply",
          "supply",
          "Supply",
          "Green number — Cadet costs 3.",
        );
      }
      if (hud.pendingDeploy) {
        return hintGo(
          "drop",
          "cell-0-2",
          "Summon",
          "Click the highlighted cell.",
        );
      }
      if (hud.reserveOpen) {
        return hintGo(
          "pick",
          `reserve-unit-${TUTORIAL_CADET}`,
          "Cadet",
          "Click Cadet.",
        );
      }
      return hintGo(
        "reserve",
        "reserve",
        "Reserve",
        "Click to summon a unit.",
      );
    }

    const enemy = dummyHp(match);

    if (enemy <= 2) {
      if (!dismissed.has("predict-3")) {
        return hintNext(
          "predict-3",
          "hp-103",
          "Round 3",
          "Dummy hits 0, still returns fire, then dies.",
        );
      }
      return hintGo(
        "hourglass-3",
        "hourglass",
        "Start round 3",
        "Watch — don't click during shots.",
      );
    }
    if (enemy <= 5) {
      if (!dismissed.has("predict-2")) {
        return hintNext(
          "predict-2",
          "hp-103",
          "Round 2",
          "Both shoot again. Watch the HP drop.",
        );
      }
      return hintGo(
        "hourglass-2",
        "hourglass",
        "Start round 2",
        "Press the hourglass.",
      );
    }
    if (!dismissed.has("hp")) {
      return hintNext(
        "hp",
        "hp-101",
        "HP",
        "Bottom-left = health. At 0 it still shoots, then dies.",
      );
    }
    if (!dismissed.has("atk")) {
      return hintNext(
        "atk",
        "atk-101",
        "ATK",
        "Bottom-right = damage per Engagement.",
      );
    }
    if (!dismissed.has("dummy-hp")) {
      return hintNext(
        "dummy-hp",
        "hp-103",
        "Enemy HP",
        "Dummy has 8 HP. Watch it drop each round.",
      );
    }
    if (!dismissed.has("predict-1")) {
      return hintNext(
        "predict-1",
        "hp-103",
        "Round 1",
        "Both shoot at once. Watch the trade.",
      );
    }
    return hintGo(
      "hourglass-1",
      "hourglass",
      "Start Engagement",
      "Watch the shots.",
    );
  },
  steps: [
    {
      id: "summon",
      label: "Summon Cadet (3S)",
      done: (m) => onBoard(m, TUTORIAL_CADET, 0),
    },
    {
      id: "r1",
      label: "Round 1: both shoot",
      done: (m) => dummyHp(m) <= 5 && hp(m, TUTORIAL_CADET, 0) <= 6,
    },
    {
      id: "r2",
      label: "Round 2: both shoot",
      done: (m) => dummyHp(m) <= 2 && hp(m, TUTORIAL_CADET, 0) <= 4,
    },
    {
      id: "r3",
      label: "Round 3: Dummy hits 0, returns fire, dies",
      done: (m) =>
        !onBoard(m, TUTORIAL_DUMMY, 1) && hp(m, TUTORIAL_CADET, 0) <= 2,
    },
  ],
};

const RESOURCE_HAND: Array<[number, string]> = [
  [13, "forward"],
  [5, "supply"],
  [5, "repair"],
  [6, "rally"],
  [4, "intel_acquired"],
];

const RESOURCE_DECK: Array<[number, string]> = [
  [4, "blitzkrieg"],
  [6, "quick_engagement"],
  [3, "trap"],
  [3, "lure"],
];

const DUMMY_LANE = 0;

function seedResourceCards(state: MatchState): void {
  for (const [defId, templateId] of RESOURCE_HAND)
    giveUnitCard(state, 0, defId, templateId);
  for (const [defId, templateId] of RESOURCE_DECK)
    giveUnitDeckCard(state, 0, defId, templateId);
}

function cadetOnFront(match: MatchState): boolean {
  return match.board[P1_FRONT][LANE_MID]?.defId === TUTORIAL_CADET;
}

function playedSealedOrders(match: MatchState): boolean {
  return discardedTemplate(match, 0, INITIATIVE_TEMPLATE_ID);
}

const RESOURCES: LessonDef = {
  id: "resources",
  number: 2,
  title: "Resources",
  subtitle: "Cards, summons, and HQ",
  hubStats: ["supply"],
  units: [TUTORIAL_CADET, TUTORIAL_RECRUIT, TUTORIAL_DUMMY],
  keywords: [],
  formula: `Going second → ${INITIATIVE_CARD_NAME}`,
  coach: [
    "Win: enemy HQ to 0. Empty lanes shoot HQ.",
    `Going second: you get ${INITIATIVE_CARD_NAME}.`,
    `${INITIATIVE_CARD_NAME}: pick Move — Cadet to Frontline.`,
    "Maneuver: discard onto the deck to redraw.",
  ],
  success: `Cadet chipped HQ. Keep going until it hits 0.`,
  setup() {
    const state = createSandboxMatch();
    state.players[0].turnsTaken = 0;
    state.players[0].commandPoints = 0;
    state.currentPlayer = 1;
    state.firstPlayerId = 1;
    state.players[1].turnsTaken = 1;
    state.players[1].commandPoints = BASE_SUPPLY;
    setReserve(state, 1, [TUTORIAL_DUMMY]);
    setReserve(state, 0, [TUTORIAL_CADET, TUTORIAL_RECRUIT]);
    seedResourceCards(state);
    state.players[0].hand.unshift(makeInitiativeCard(nid(state, "c")));
    return state;
  },
  scriptedAction(match) {
    if (match.currentPlayer !== 1 || match.combatPlayback) return null;
    if (match.players[1].hqHp < HQ_MAX_HP) return null;
    if (match.phase === "deployment") {
      if (!onBoard(match, TUTORIAL_DUMMY, 1)) {
        return { type: "deploy", unitDefId: TUTORIAL_DUMMY, row: DUMMY_LANE };
      }
      return { type: "endDeployment" };
    }
    if (match.phase === "maneuver") return { type: "endManeuver" };
    return null;
  },
  allow(match, action) {
    if (match.currentPlayer === 1) {
      if (action.type === "deploy") {
        if (action.unitDefId !== TUTORIAL_DUMMY)
          return "Watch the opponent summon.";
        if (action.row !== DUMMY_LANE) return "Watch the opponent summon.";
        return null;
      }
      if (action.type === "endDeployment") {
        if (!onBoard(match, TUTORIAL_DUMMY, 1))
          return "Watch the opponent summon.";
        return null;
      }
      if (action.type === "endManeuver") return null;
      return "Watch the opponent's opening.";
    }

    const cadets = countDef(match, TUTORIAL_CADET, 0);
    const recruitOut = onBoard(match, TUTORIAL_RECRUIT, 0);

    if (action.type === "deploy") {
      if (action.unitDefId === TUTORIAL_CADET) {
        if (cadets >= 1) return "Summon Recruit next.";
        if (action.row !== LANE_MID)
          return "Drop the Cadet on the middle Support cell (lane 3).";
        return null;
      }
      if (action.unitDefId === TUTORIAL_RECRUIT) {
        if (cadets < 1) return "Summon the Cadet first.";
        if (recruitOut) return "Recruit is already on the board.";
        if (action.row !== DUMMY_LANE)
          return "Drop Recruit on the highlighted Support cell (lane 1).";
        return null;
      }
      return "Summon Cadet, then Recruit.";
    }

    if (action.type === "endDeployment") {
      if (cadets < 1) return "Summon the Cadet first.";
      if (!recruitOut) return "Summon Recruit too.";
      return null;
    }

    if (action.type === "playCard") {
      const card = cardOf(match, action);
      if (!card || !isInitiativeCard(card))
        return `Play ${INITIATIVE_CARD_NAME} — it's a Special.`;
      if (action.targets.choice !== "move" && action.targets.choice !== "forward")
        return "Choose Move — Cadet to Frontline.";
      const cadet = unitByDef(match, TUTORIAL_CADET, 0);
      if (!cadet || action.targets.unitIds?.[0] !== cadet.instanceId)
        return "Move the Cadet.";
      const dest = action.targets.cells?.[0];
      if (!dest || dest.col !== P1_FRONT || dest.row !== LANE_MID) {
        return "Click Cadet's Frontline cell in this lane.";
      }
      return null;
    }

    if (action.type === "discardRedraw") {
      if (match.phase !== "maneuver")
        return "Discard-redraw is only in Maneuver.";
      if (!playedSealedOrders(match))
        return `Play ${INITIATIVE_CARD_NAME} first.`;
      const discarded = match.players[0].hand.find(
        (card) => card.instanceId === action.cardId,
      );
      if (discarded && isInitiativeCard(discarded))
        return `Play ${INITIATIVE_CARD_NAME}, don't discard it.`;
      return null;
    }

    if (action.type === "endManeuver") {
      if (match.players[1].hqHp < HQ_MAX_HP) return null;
      if (!playedSealedOrders(match))
        return `Play ${INITIATIVE_CARD_NAME} first.`;
      if (!cadetOnFront(match)) return "Move Cadet to the Frontline first.";
      if (match.players[0].discardRedrawsUsed < 1)
        return "Discard a card onto the deck first.";
      return null;
    }

    return "Follow the on-screen popup.";
  },
  afterAction(match, action) {
    if (action.type === "endEngagement" && match.players[1].hqHp < HQ_MAX_HP) {
      match.currentPlayer = 0;
      match.phase = "engagement";
    }
  },
  pickHint(match, hud, dismissed) {
    if (match.currentPlayer === 1) {
      if (match.players[1].hqHp < HQ_MAX_HP) return null;
      if (!dismissed.has("p2-first")) {
        return hintNext(
          "p2-first",
          "phase",
          "Going second",
          `Opponent goes first. You get ${INITIATIVE_CARD_NAME}.`,
        );
      }
      return null;
    }

    const cadets = countDef(match, TUTORIAL_CADET, 0);
    const recruitOut = onBoard(match, TUTORIAL_RECRUIT, 0);

    if (cadets < 1) {
      if (!dismissed.has("hq")) {
        return hintNext(
          "hq",
          "hq-1",
          "Enemy HQ",
          "Take this to 0 to win.",
        );
      }
      if (hud.pendingDeploy === TUTORIAL_CADET) {
        return hintGo(
          "drop",
          `cell-${P1_SUPPORT}-${LANE_MID}`,
          "Summon",
          "Drop Cadet here.",
        );
      }
      if (hud.reserveOpen) {
        return hintGo(
          "pick",
          `reserve-unit-${TUTORIAL_CADET}`,
          "Cadet",
          "Click Cadet.",
        );
      }
      return hintGo(
        "reserve",
        "reserve",
        "Reserve",
        "Summon Cadet.",
      );
    }

    if (!recruitOut && match.phase === "deployment") {
      if (hud.pendingDeploy === TUTORIAL_RECRUIT) {
        return hintGo(
          "drop-recruit",
          `cell-${P1_SUPPORT}-${DUMMY_LANE}`,
          "Summon Recruit",
          "Drop Recruit here.",
        );
      }
      if (hud.reserveOpen) {
        return hintGo(
          "pick-recruit",
          `reserve-unit-${TUTORIAL_RECRUIT}`,
          "Recruit",
          "Click Recruit.",
        );
      }
      return hintGo(
        "reserve-recruit",
        "reserve",
        "Recruit",
        "Summon Recruit too.",
      );
    }

    if (match.phase === "maneuver") {
      if (!playedSealedOrders(match)) {
        if (hud.initiativeOpen) {
          return hintGo(
            "sealed-fwd",
            "initiative-forward",
            "Move",
            "Pick Move.",
          );
        }
        if (hud.targetingTemplateId === INITIATIVE_TEMPLATE_ID) {
          if (pickedUnits(hud) < 1) {
            return hintGo(
              "sealed-cadet",
              `unit-${TUTORIAL_CADET}`,
              "Cadet",
              "Click Cadet.",
            );
          }
          return hintGo(
            "sealed-front",
            `cell-${P1_FRONT}-${LANE_MID}`,
            "Frontline",
            "Click this cell.",
          );
        }
        if (!dismissed.has("sealed")) {
          return hintNext(
            "sealed",
            `card-${INITIATIVE_TEMPLATE_ID}`,
            INITIATIVE_CARD_NAME,
            "Play it — choose Move.",
          );
        }
        return hintGo(
          "sealed-play",
          `card-${INITIATIVE_TEMPLATE_ID}`,
          INITIATIVE_CARD_NAME,
          `Click ${INITIATIVE_CARD_NAME}.`,
        );
      }
      if (match.players[0].discardRedrawsUsed >= 1) {
        if (!dismissed.has("predict")) {
          return hintNext(
            "predict",
            "hq-1",
            "Shoot HQ",
            "Cadet will shoot HQ.",
          );
        }
        return hintGo(
          "hourglass-fight",
          "hourglass",
          "Fight",
          "End Maneuver.",
        );
      }
      if (!dismissed.has("hand")) {
        return hintNext(
          "hand",
          "hand",
          "Cards",
          "Try discard → redraw.",
        );
      }
      return hintGo(
        "deck",
        "deck",
        "Redraw",
        "Drag a card onto the deck.",
      );
    }

    if (match.phase === "deployment") {
      return hintGo(
        "hourglass-maneuver",
        "hourglass",
        "To Maneuver",
        `Play ${INITIATIVE_CARD_NAME}.`,
      );
    }

    return null;
  },
  steps: [
    {
      id: "p2",
      label: "Opponent summons first",
      done: (m) => onBoard(m, TUTORIAL_DUMMY, 1),
    },
    {
      id: "cadet",
      label: "Summon Cadet",
      done: (m) => onBoard(m, TUTORIAL_CADET, 0),
    },
    {
      id: "recruit",
      label: "Summon Recruit",
      done: (m) => onBoard(m, TUTORIAL_RECRUIT, 0),
    },
    {
      id: "sealed",
      label: `Play ${INITIATIVE_CARD_NAME}: move Cadet`,
      done: (m) => cadetOnFront(m),
    },
    {
      id: "redraw",
      label: "Discard to redraw",
      done: (m) => m.players[0].discard.some((card) => !isInitiativeCard(card)),
    },
    {
      id: "hq",
      label: "Cadet shoots HQ",
      done: (m) => m.players[1].hqHp < HQ_MAX_HP,
    },
  ],
};

const ARMOR: LessonDef = {
  id: "armor",
  number: 3,
  title: "Armor & Armor Piercing",
  subtitle: "Adding armor and piercing",
  hubStats: ["armor", "ap"],
  units: [16, 3],
  keywords: [],
  formula:
    "Gun: ATK − max(0, Armor − AP)  ·  Missile: half armor, no AP",
  coach: [
    "Armor (blue) reduces gun damage. AP (purple) subtracts from Armor first.",
    "Here AP equals Armor — guns go straight into HP.",
    "Missiles: half armor, no AP.",
  ],
  success: "AP pierced Armor.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, {
      defId: 16,
      owner: 0,
      col: P1_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 3,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    return state;
  },
  allow: skipToFight("deployment"),
  pickHint(match, _hud, dismissed) {
    if (match.phase !== "deployment") return null;
    if (!dismissed.has("armor")) {
      return hintNext(
        "armor",
        "armor-3",
        "Armor",
        "Blue chip = Armor. Reduces gun damage after AP.",
      );
    }
    if (!dismissed.has("ap")) {
      return hintNext(
        "ap",
        "ap-16",
        "AP",
        "Purple chip = AP. Subtracts from Armor, not HP.",
      );
    }
    if (!dismissed.has("predict")) {
      return hintNext(
        "predict",
        "hp-3",
        "Result",
        "Armor fully pierced — damage goes into HP.",
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "Start Engagement",
      "Watch the shots.",
    );
  },
  steps: [
    {
      id: "watch",
      label: "Enter Engagement",
      done: (m) => m.phase === "engagement" || hp(m, 3, 1) < 10,
    },
    {
      id: "pen",
      label: "Rostam pierces Armor",
      done: (m) => hp(m, 3, 1) < 10,
    },
  ],
};

const MANEUVER: LessonDef = {
  id: "maneuver",
  number: 4,
  title: "Maneuver — Move with cards",
  subtitle: "Play a Move card in the Maneuver phase",
  hubStats: [],
  units: [15, 4],
  keywords: [],
  coach: [
    "Maneuver: play cards from hand.",
    "Thoth is on Support. Without a card, it Advances and rests — no shot this turn.",
    "Forward moves to Frontline without resting. Drag it → click Thoth → click destination.",
  ],
  success: "Move card → Frontline without resting.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, {
      defId: 15,
      owner: 0,
      col: P1_SUPPORT,
      row: LANE_MID,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 4,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    giveUnitCard(state, 0, 13, "forward", 15);
    setSupply(state, 0, 2);
    setPhase(state, "maneuver");
    return state;
  },
  allow(match, action) {
    if (action.type === "playCard") {
      const card = cardOf(match, action);
      if (!card || card.effectId !== "forward") return "Play the Forward card.";
      const dest = action.targets.cells?.[0];
      if (dest && dest.row !== LANE_MID)
        return "Move into the same lane (lane 3).";
      return null;
    }
    if (action.type === "endManeuver") {
      if (!discardedTemplate(match, 0, "forward"))
        return "Play Forward first so Thoth does not rest.";
      return null;
    }
    return "Play Forward, then press the hourglass.";
  },
  pickHint(match, hud, dismissed) {
    const moved = discardedTemplate(match, 0, "forward");
    if (match.phase !== "maneuver") return null;
    if (moved) {
      if (!dismissed.has("predict")) {
        return hintNext(
          "predict",
          "hp-4",
          "Result",
          "Thoth is on Frontline, not rested. It will shoot.",
        );
      }
      return hintGo(
        "hourglass",
        "hourglass",
        "Start Engagement",
        "Watch the shots.",
      );
    }
    if (targeting(hud, "forward")) {
      if (pickedUnits(hud) >= 1) {
        return hintGo(
          "dest",
          "cell-1-2",
          "Frontline",
          "Click this cell.",
        );
      }
      return hintGo(
        "pick-ironclad",
        "unit-15",
        "Choose unit",
        "Click Thoth.",
      );
    }
    if (!dismissed.has("support-pos")) {
      return hintNext(
        "support-pos",
        "unit-15",
        "Support",
        "Without Forward, Thoth Advances and rests — no shot.",
      );
    }
    if (!dismissed.has("dest-preview")) {
      return hintNext(
        "dest-preview",
        "cell-1-2",
        "Destination",
        "Forward moves Thoth here without resting.",
      );
    }
    return hintGo(
      "hand",
      "card-forward",
      "Drag Forward",
      "Drag the card onto the board.",
    );
  },
  steps: [
    {
      id: "forward",
      label: "Forward Thoth to Frontline",
      done: (m) => {
        const unit = unitByDef(m, 15, 0);
        return Boolean(unit && unit.col === P1_FRONT && unit.row === LANE_MID);
      },
    },
    {
      id: "fight",
      label: "End Maneuver → Engagement",
      done: (m) => m.phase === "engagement" || hp(m, 4, 1) < 10,
    },
  ],
};

const COMEBACK_DECK: Array<[number, string]> = [
  [13, "forward"],
  [5, "supply"],
  [5, "repair"],
  [6, "rally"],
  [4, "intel_acquired"],
  [4, "blitzkrieg"],
];

/**
 * Two vanilla Cadets (3+3). Raid banks HQ + unit-death comeback; next turn
 * payout funds both summons with no Cover/Blitz.
 */
const COMEBACK_ROW_A = 1;
const COMEBACK_ROW_B = 3;
/** Start just above the first mark so a weak open-lane shot (ATK 2) crosses 40. */
const COMEBACK_START_HQ = 41;
/** Fragile raiders — Cadet return fire deletes the middle one. */
const COMEBACK_DUMMY_HP = 2;

function comebackCadetsOnBoard(match: MatchState): number {
  return countDef(match, TUTORIAL_CADET, 0);
}

function spawnComebackDummy(
  state: MatchState,
  row: number,
): ReturnType<typeof spawnUnit> {
  const unit = spawnUnit(state, {
    defId: TUTORIAL_DUMMY,
    owner: 1,
    col: P2_FRONT,
    row,
    hp: COMEBACK_DUMMY_HP,
  });
  unit.maxHp = COMEBACK_DUMMY_HP;
  return unit;
}

const COMEBACK: LessonDef = {
  id: "comeback",
  number: 5,
  title: "Comeback",
  subtitle: "Bonus Supply and draws when you're behind",
  hubStats: ["supply"],
  units: [TUTORIAL_CADET, TUTORIAL_DUMMY],
  keywords: [],
  formula: `HQ marks at ${HQ_BREAKPOINTS.join("/")}  ·  Behind → +1S & +1 draw`,
  coach: [
    "3 Dummies outnumber you. Open lanes chip HQ; mid kills Cadet.",
    `Behind on HQ or unit count → +1S & +1 draw each.`,
    "Next turn: spend the bonus on two Cadets.",
  ],
  success: "Comeback banked → spent on two Cadets.",
  setup() {
    const state = createSandboxMatch();
    state.players[0].hqHp = COMEBACK_START_HQ;
    state.players[1].hqHp = HQ_MAX_HP;
    // After Cadet dies: P1 reserve 2 < P2 board 3 (mid corpse still counted during cleanup).
    setReserve(state, 0, [TUTORIAL_CADET, TUTORIAL_CADET]);
    setReserve(state, 1, []);
    spawnUnit(state, {
      defId: TUTORIAL_CADET,
      owner: 0,
      col: P1_FRONT,
      row: LANE_MID,
      hp: 1,
    });
    // Lanes 0 / 4 open → ATK 2+2 chips HQ 41→37 (first mark). Mid trades with Cadet.
    spawnComebackDummy(state, 0);
    spawnComebackDummy(state, LANE_MID);
    spawnComebackDummy(state, 4);
    for (const [defId, templateId] of COMEBACK_DECK) {
      giveUnitDeckCard(state, 0, defId, templateId);
    }
    // Keep a card in hand so endDeployment lands on Maneuver (not an auto P1 engagement).
    giveUnitCard(state, 0, 13, "forward");
    return state;
  },
  scriptedAction(match) {
    if (match.currentPlayer !== 1 || match.combatPlayback) return null;
    if (match.phase === "deployment") return { type: "endDeployment" };
    if (match.phase === "maneuver") return { type: "endManeuver" };
    return null;
  },
  afterAction(match, action) {
    if (
      action.type === "endDeployment" &&
      match.currentPlayer === 0 &&
      match.players[0].turnsTaken < 2 &&
      match.phase === "maneuver" &&
      onBoard(match, TUTORIAL_CADET, 0)
    ) {
      // Enemy volleys first so open lanes actually shoot your HQ.
      beginEngagement(match, { attacker: 1, skipRelocation: true });
    }
  },
  allow(match, action) {
    if (match.currentPlayer === 1) {
      if (action.type === "endDeployment" || action.type === "endManeuver") return null;
      return "Watch the opponent's turn.";
    }

    const turn2 = match.players[0].turnsTaken >= 2;

    if (!turn2) {
      if (action.type === "endDeployment") return null;
      if (action.type === "endEngagement") return null;
      return "Follow the on-screen popup.";
    }

    const cadets = comebackCadetsOnBoard(match);

    if (action.type === "deploy") {
      if (action.unitDefId !== TUTORIAL_CADET) return "Summon two Cadets.";
      if (cadets >= 2) return "Both Cadets are already on the board.";
      if (cadets === 0) {
        if (action.row !== COMEBACK_ROW_A)
          return `Drop the first Cadet on Support lane ${COMEBACK_ROW_A + 1}.`;
        return null;
      }
      if (action.row !== COMEBACK_ROW_B)
        return `Drop the second Cadet on Support lane ${COMEBACK_ROW_B + 1}.`;
      return null;
    }

    if (action.type === "endDeployment") {
      if (cadets === 0) return "Summon Cadet first.";
      if (cadets < 2)
        return "Still have Supply — summon the second Cadet.";
      return null;
    }

    if (action.type === "endManeuver") {
      if (cadets < 2) return "Summon both Cadets first.";
      return null;
    }

    if (action.type === "endEngagement") return null;
    return "Follow the on-screen popup.";
  },
  pickHint(match, hud, dismissed) {
    if (match.currentPlayer === 1) {
      if (!dismissed.has("enemy-turn")) {
        return hintNext(
          "enemy-turn",
          "phase",
          "Opponent's turn",
          "Comeback pending. Payout next turn.",
        );
      }
      return null;
    }

    const turn2 = match.players[0].turnsTaken >= 2;

    if (!turn2) {
      if (match.phase === "engagement") return null;
      if (!dismissed.has("marks")) {
        return hintNext(
          "marks",
          "hq-0",
          "HQ shields",
          `First mark at ${HQ_BREAKPOINTS[0]}. Open lanes cross it.`,
        );
      }
      if (!dismissed.has("enemies")) {
        return hintNext(
          "enemies",
          "unit-103",
          "Outnumbered",
          "3 Dummies > you. Outers hit HQ; mid kills Cadet.",
        );
      }
      if (!dismissed.has("unit-rule")) {
        return hintNext(
          "unit-rule",
          `unit-${TUTORIAL_CADET}`,
          "Unit death",
          "Cadet dies → fewer units than enemy → +1S/+1 draw.",
        );
      }
      if (!dismissed.has("predict")) {
        return hintNext(
          "predict",
          "hq-0",
          "Result",
          "HQ mark + Cadet death → +2S/+2 draw.",
        );
      }
      return hintGo(
        "hourglass",
        "hourglass",
        "Start",
        "Raiders strike first.",
      );
    }

    if (match.phase !== "deployment") {
      if (comebackCadetsOnBoard(match) >= 2) {
        return hintGo(
          "done",
          "hourglass",
          "Complete",
          "Comeback spent.",
        );
      }
      return null;
    }

    const cadets = comebackCadetsOnBoard(match);
    const cp = match.players[0].commandPoints;

    if (cadets === 0) {
      if (!dismissed.has("payout")) {
        return hintNext(
          "payout",
          "supply",
          "Payout",
          `${cp}S now. Two Cadets = 3+3.`,
        );
      }
      if (hud.pendingDeploy === TUTORIAL_CADET) {
        return hintGo(
          "drop-a",
          `cell-${P1_SUPPORT}-${COMEBACK_ROW_A}`,
          "Summon",
          "Click the highlighted cell.",
        );
      }
      if (hud.reserveOpen) {
        return hintGo(
          "pick-a",
          `reserve-unit-${TUTORIAL_CADET}`,
          "Cadet",
          "Click Cadet (3S).",
        );
      }
      return hintGo(
        "reserve",
        "reserve",
        "Reserve",
        "Summon a Cadet.",
      );
    }

    if (cadets === 1) {
      if (!dismissed.has("cadet-b")) {
        return hintNext(
          "cadet-b",
          "supply",
          "Second Cadet",
          "Spend the rest on another Cadet.",
        );
      }
      if (hud.pendingDeploy === TUTORIAL_CADET) {
        return hintGo(
          "drop-b",
          `cell-${P1_SUPPORT}-${COMEBACK_ROW_B}`,
          "Summon",
          "Click the highlighted cell.",
        );
      }
      if (hud.reserveOpen) {
        return hintGo(
          "pick-b",
          `reserve-unit-${TUTORIAL_CADET}`,
          "Cadet",
          "Click second Cadet.",
        );
      }
      return hintGo(
        "reserve-2",
        "reserve",
        "Reserve",
        "Summon second Cadet.",
      );
    }

    return hintGo(
      "hourglass-2",
      "hourglass",
      "Continue",
      "Comeback spent.",
    );
  },
  steps: [
    {
      id: "raid",
      label: "Raiders shoot HQ, Cadet dies",
      done: (m) =>
        m.players[0].hqHp <= 40 &&
        m.players[0].triggeredBreakpoints.includes(40),
    },
    {
      id: "banked",
      label: "Comeback banked",
      done: (m) =>
        m.players[0].nextTurnSupplyBonus >= 2 || m.players[0].turnsTaken >= 2,
    },
    {
      id: "next-turn",
      label: "Comeback pays out",
      done: (m) =>
        m.currentPlayer === 0 &&
        m.players[0].turnsTaken >= 2 &&
        m.players[0].nextTurnSupplyBonus === 0 &&
        m.players[0].hand.length >= DRAW_PER_TURN + 2,
    },
    {
      id: "summon",
      label: "Summon two Cadets",
      done: (m) => comebackCadetsOnBoard(m) >= 2,
    },
  ],
};

const COVER_FLANK: LessonDef = {
  id: "cover-flank",
  number: 6,
  title: "Cover & Flank",
  subtitle: "Relocation: leave a lane, fill a lane",
  hubStats: [],
  units: [19, 3, 22],
  keywords: parseKeywords("Flank; Cover"),
  coach: [
    "Relocation order: Flank → Cover → Advance.",
    "Flank: enemy in lane → sidestep to empty lane. Frontline: no rest.",
    "Cover: no enemy → jump to contested lane. From Support: rests.",
    "Hermes (Flank) sidesteps out. Xuanwu (Cover) fills in and rests.",
  ],
  success: "Flank leaves, Cover fills.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, {
      defId: 19,
      owner: 0,
      col: P1_FRONT,
      row: LANE_MID,
      keywords: parseKeywords("Flank"),
    });
    spawnUnit(state, {
      defId: 3,
      owner: 0,
      col: P1_SUPPORT,
      row: 0,
      keywords: parseKeywords("Cover"),
    });
    spawnUnit(state, {
      defId: 22,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    return state;
  },
  allow: skipToFight("deployment"),
  pickHint(match, _hud, dismissed) {
    if (match.phase !== "deployment") return null;
    if (!dismissed.has("flank")) {
      return hintNext(
        "flank",
        "kw-flank-19",
        "Flank",
        "Enemy in lane → sidesteps to empty lane.",
        parseKeywords("Flank"),
      );
    }
    if (!dismissed.has("flank-dest")) {
      return hintNext(
        "flank-dest",
        "cell-1-1",
        "Destination",
        "Hermes sidesteps here. Already Frontline, no rest.",
        parseKeywords("Flank"),
      );
    }
    if (!dismissed.has("cover")) {
      return hintNext(
        "cover",
        "kw-cover-3",
        "Cover",
        "No enemy → jumps to contested lane. From Support: rests.",
        parseKeywords("Cover"),
      );
    }
    if (!dismissed.has("cover-dest")) {
      return hintNext(
        "cover-dest",
        "unit-3",
        "Destination",
        "Xuanwu Covers into the lane and rests.",
        parseKeywords("Cover"),
      );
    }
    if (!dismissed.has("enemy")) {
      return hintNext(
        "enemy",
        "unit-22",
        "Contested lane",
        "Hermes leaves, Xuanwu fills, rests. No shot at Horus.",
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "Start",
      "Watch Relocation.",
    );
  },
  steps: [
    {
      id: "go",
      label: "Watch Relocation",
      done: (m) =>
        m.phase === "engagement" || (unitByDef(m, 19, 0)?.row ?? 2) !== 2,
    },
    {
      id: "flank",
      label: "Hermes Flanks out",
      done: (m) => (unitByDef(m, 19, 0)?.row ?? 2) !== 2,
    },
    {
      id: "cover",
      label: "Xuanwu Covers in",
      done: (m) => {
        const unit = unitByDef(m, 3, 0);
        return Boolean(unit && unit.col === P1_FRONT && unit.row === LANE_MID);
      },
    },
  ],
};

const AGGRESSIVE: LessonDef = {
  id: "aggressive",
  number: 7,
  title: "Aggressive & Retaliate",
  subtitle: "Bonus ATK when attacking / when returning fire",
  hubStats: [],
  units: [2, 17],
  keywords: parseKeywords("Aggressive 4; Retaliate 8"),
  coach: [
    "Aggressive: bonus ATK only when attacking.",
    "Retaliate: bonus ATK when returning fire.",
    "Fenrir attacks with Aggressive. Heimdall counters with Retaliate.",
  ],
  success: "Aggressive when attacking, Retaliate when defending.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, { defId: 2, owner: 0, col: P1_FRONT, row: LANE_MID });
    spawnUnit(state, { defId: 17, owner: 1, col: P2_FRONT, row: LANE_MID });
    return state;
  },
  allow: skipToFight("deployment"),
  pickHint(match, _hud, dismissed) {
    if (match.phase !== "deployment") return null;
    if (!dismissed.has("aggressive")) {
      return hintNext(
        "aggressive",
        "kw-aggressive-2",
        "Aggressive",
        "Bonus ATK only when attacking — not on counters.",
        parseKeywords("Aggressive 4"),
      );
    }
    if (!dismissed.has("apex-atk")) {
      return hintNext(
        "apex-atk",
        "atk-2",
        "ATK",
        "Base ATK + Aggressive on the attack.",
      );
    }
    if (!dismissed.has("predict-agg")) {
      return hintNext(
        "predict-agg",
        "hp-17",
        "Attack",
        "Fenrir hits with Aggressive.",
        parseKeywords("Aggressive 4"),
      );
    }
    if (!dismissed.has("retaliate")) {
      return hintNext(
        "retaliate",
        "kw-retaliate-17",
        "Retaliate",
        "Bonus ATK when returning fire.",
        parseKeywords("Retaliate 8"),
      );
    }
    if (!dismissed.has("apex-armor")) {
      return hintNext(
        "apex-armor",
        "armor-2",
        "Counter",
        "Heimdall returns fire with Retaliate.",
      );
    }
    if (!dismissed.has("predict-ret")) {
      return hintNext(
        "predict-ret",
        "hp-2",
        "Return fire",
        "Watch Fenrir take the counter.",
        parseKeywords("Retaliate 8"),
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "Start Engagement",
      "Watch both shots.",
    );
  },
  steps: [
    {
      id: "go",
      label: "Enter Engagement",
      done: (m) => m.phase === "engagement" || hp(m, 17, 1) < 20,
    },
    {
      id: "agg",
      label: "Fenrir attacks with Aggressive",
      done: (m) => hp(m, 17, 1) <= 13,
    },
    {
      id: "ret",
      label: "Heimdall counters with Retaliate",
      done: (m) => hp(m, 2, 0) <= 1,
    },
  ],
};

const SUPPORT_FIRE: LessonDef = {
  id: "support-fire",
  number: 8,
  title: "Support Fire",
  subtitle: "Adjacent allies add ATK",
  hubStats: [],
  units: [4, 5, 21, 17],
  keywords: parseKeywords("Support Fire 2"),
  coach: [
    "Support Fire: allies in this lane + adjacent lanes gain +N ATK. Does not buff itself.",
    "Eir and Yatagarasu each grant +2 to Sarama.",
  ],
  success: "Two adjacent Support Fires added ATK.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, {
      defId: 5,
      owner: 0,
      col: P1_FRONT,
      row: 1,
      keywords: parseKeywords("Support Fire 2"),
    });
    spawnUnit(state, {
      defId: 4,
      owner: 0,
      col: P1_FRONT,
      row: 2,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 21,
      owner: 0,
      col: P1_FRONT,
      row: 3,
      keywords: parseKeywords("Support Fire 2"),
    });
    // Strip Retaliate — this lesson is only Support Fire ATK.
    spawnUnit(state, {
      defId: 17,
      owner: 1,
      col: P2_FRONT,
      row: 1,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 17,
      owner: 1,
      col: P2_FRONT,
      row: 2,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 17,
      owner: 1,
      col: P2_FRONT,
      row: 3,
      keywords: [],
    });
    return state;
  },
  allow: skipToFight("deployment"),
  pickHint(match, _hud, dismissed) {
    if (match.phase !== "deployment") return null;
    if (!dismissed.has("sf-nomad")) {
      return hintNext(
        "sf-nomad",
        "kw-supportFire-5",
        "Support Fire",
        "Eir adds +2 ATK to allies in adjacent lanes.",
        parseKeywords("Support Fire 2"),
      );
    }
    if (!dismissed.has("sf-biker")) {
      return hintNext(
        "sf-biker",
        "kw-supportFire-21",
        "Support Fire",
        "Yatagarasu also adds +2. Together: +4 to Sarama.",
        parseKeywords("Support Fire 2"),
      );
    }
    if (!dismissed.has("jackal-atk")) {
      return hintNext(
        "jackal-atk",
        "atk-4",
        "Sarama ATK",
        "Base ATK + both Support Fires.",
      );
    }
    if (!dismissed.has("predict")) {
      return hintNext(
        "predict",
        "cell-2-2",
        "Result",
        "Sarama hits the middle Heimdall with the buff.",
        parseKeywords("Support Fire 2"),
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "Start Engagement",
      "Watch Support Fire pop.",
    );
  },
  steps: [
    {
      id: "go",
      label: "Enter Engagement",
      done: (m) => m.phase === "engagement" || hp(m, 17, 1) < 20,
    },
    {
      id: "sf",
      label: "Sarama hits with Support Fire",
      done: (m) => {
        const mid = m.board[P2_FRONT][2];
        return Boolean(mid && mid.defId === 17 && mid.hp <= 13);
      },
    },
  ],
};

const MISSILE: LessonDef = {
  id: "missile",
  number: 9,
  title: "Missile",
  subtitle: "After guns, a missile — half armor, no AP",
  hubStats: ["ap", "armor"],
  units: [8, 4],
  keywords: parseKeywords("Missile 4"),
  coach: [
    "After guns, Missile fires. Half armor (round down), no AP.",
    "Watch two hits: gun, then missile.",
  ],
  success: "Missile used half armor. AP did not pierce it.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, {
      defId: 8,
      owner: 0,
      col: P1_FRONT,
      row: LANE_MID,
      keywords: parseKeywords("Missile 4"),
    });
    spawnUnit(state, {
      defId: 4,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    return state;
  },
  allow: skipToFight("deployment"),
  pickHint(match, _hud, dismissed) {
    if (match.phase !== "deployment") return null;
    if (!dismissed.has("gun")) {
      return hintNext(
        "gun",
        "atk-8",
        "Guns first",
        "Gun volley fires first. AP pierces on this hit.",
      );
    }
    if (!dismissed.has("missile")) {
      return hintNext(
        "missile",
        "kw-missile-8",
        "Missile",
        "After guns, fires Missile. Half armor, no AP.",
        parseKeywords("Missile 4"),
      );
    }
    if (!dismissed.has("ap-no-pen")) {
      return hintNext(
        "ap-no-pen",
        "ap-8",
        "AP",
        "AP only works on the gun hit, not the missile.",
      );
    }
    if (!dismissed.has("predict")) {
      return hintNext(
        "predict",
        "hp-4",
        "Result",
        "Gun + Missile hit. Watch the damage.",
        parseKeywords("Missile 4"),
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "Start Engagement",
      "Watch gun, then missile.",
    );
  },
  steps: [
    {
      id: "go",
      label: "Enter Engagement",
      done: (m) => m.phase === "engagement" || hp(m, 4, 1) < 10,
    },
    {
      id: "hit",
      label: "Gun + Missile hit Sarama",
      done: (m) => hp(m, 4, 1) <= 4,
    },
  ],
};

const EXTRA: LessonDef = {
  id: "extra-attack",
  number: 10,
  title: "Extra Attack & Extra Engagement",
  subtitle: "One extra shot, or one extra fight",
  hubStats: ["atk"],
  units: [11, 3, 17, 22],
  keywords: [],
  coach: [
    "Extra attack: one shot, no return fire, no keyword buffs. Missile still follows.",
    "Extra engagement: that lane fights with keyword buffs, then back to Maneuver.",
    "1) First Strike → Houyi extra-attacks. 2) Trap → Horus forced to attack Xuanwu. 3) Hourglass → regular Engagement.",
  ],
  success:
    "Extra attack = one shot. Extra engagement = that lane fights.",
  setup() {
    const state = createSandboxMatch();
    // Artillery only — strip Cover so regular Engagement does not relocate.
    spawnUnit(state, {
      defId: 11,
      owner: 0,
      col: P1_SUPPORT,
      row: LANE_MID,
      keywords: parseKeywords("Artillery"),
    });
    // Retaliate only — Trap demo needs it; Cover would jump after Horus dies.
    spawnUnit(state, {
      defId: 3,
      owner: 0,
      col: P1_FRONT,
      row: 4,
      keywords: parseKeywords("Retaliate 5"),
    });
    spawnUnit(state, {
      defId: 17,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 22,
      owner: 1,
      col: P2_FRONT,
      row: 4,
      keywords: [],
    });
    giveUnitCard(state, 0, 11, "first_strike");
    giveUnitCard(state, 0, 3, "trap");
    setSupply(state, 0, 3);
    setPhase(state, "maneuver");
    return state;
  },
  allow(match, action) {
    if (action.type === "playCard") {
      const card = cardOf(match, action);
      if (!card) return "Play First Strike, then Trap.";
      if (card.templateId === "first_strike") return null;
      if (card.templateId === "trap") {
        if (!discardedTemplate(match, 0, "first_strike"))
          return "Play First Strike first.";
        return null;
      }
      return "Play First Strike, then Trap.";
    }
    if (action.type === "endManeuver") {
      if (
        !discardedTemplate(match, 0, "first_strike") ||
        !discardedTemplate(match, 0, "trap")
      ) {
        return "Play both cards first.";
      }
      return null;
    }
    return "Play First Strike, then Trap, then the hourglass.";
  },
  pickHint(match, hud, dismissed) {
    const qmob = discardedTemplate(match, 0, "first_strike");
    const trap = discardedTemplate(match, 0, "trap");

    if (!qmob) {
      if (!dismissed.has("extra-atk")) {
        return hintNext(
          "extra-atk",
          "unit-11",
          "Extra attack",
          "One shot, no return fire, no keyword buffs.",
        );
      }
      if (!dismissed.has("predict-atk")) {
        return hintNext(
          "predict-atk",
          "hp-17",
          "Result",
          "Houyi shoots Heimdall. No return fire.",
        );
      }
      return hintGo(
        "qmob",
        "card-first_strike",
        "First Strike",
        "Drag onto board. Watch the shot.",
      );
    }

    if (!trap) {
      if (targeting(hud, "trap")) {
        return hintGo(
          "pick-Horus",
          "unit-22",
          "Click Horus",
          "Only this lane fights.",
        );
      }
      if (!dismissed.has("extra-eng")) {
        return hintNext(
          "extra-eng",
          "unit-3",
          "Extra engagement",
          "Trap forces enemy to attack. Retaliate applies. Back to Maneuver after.",
        );
      }
      if (!dismissed.has("predict-trap")) {
        return hintNext(
          "predict-trap",
          "hp-22",
          "Result",
          "Horus forced to attack Xuanwu. Xuanwu counters with Retaliate.",
        );
      }
      return hintGo(
        "trap",
        "card-trap",
        "Trap",
        "Drag onto board, click Horus.",
      );
    }

    if (match.phase === "maneuver") {
      if (!dismissed.has("predict-regular")) {
        return hintNext(
          "predict-regular",
          "hp-17",
          "Regular Engagement",
          "Now the whole board shoots.",
        );
      }
      return HINT_HOURGLASS;
    }
    return null;
  },
  steps: [
    {
      id: "qmob",
      label: "First Strike — extra attack",
      done: (m) => discardedTemplate(m, 0, "first_strike"),
    },
    {
      id: "trap",
      label: "Trap — extra engagement",
      done: (m) => discardedTemplate(m, 0, "trap"),
    },
    {
      id: "regular",
      label: "Regular Engagement",
      done: (m) =>
        discardedTemplate(m, 0, "first_strike") &&
        discardedTemplate(m, 0, "trap") &&
        ((m.phase === "engagement" && m.combatResumePhase === null) ||
          m.currentPlayer === 1),
    },
  ],
};

const SENTINEL = 11;
const TEMPEST = 25;

function allowSummonOnMidSupport(
  defId: number,
  name: string,
): LessonDef["allow"] {
  return (match, action) => {
    if (match.currentPlayer === 1) {
      if (action.type === "endManeuver") return null;
      return "Watch the Dummy attack.";
    }
    if (action.type === "deploy") {
      if (onBoard(match, defId, 0)) return `${name} is already on the board.`;
      if (action.unitDefId !== defId) return `Summon ${name}.`;
      if (action.row !== LANE_MID)
        return `Drop ${name} on the middle Support cell (lane 3).`;
      return null;
    }
    if (action.type === "endDeployment") {
      if (!onBoard(match, defId, 0)) return `Summon ${name} first.`;
      return null;
    }
    return "Follow the on-screen popup.";
  };
}

function scriptEnemyManeuver(match: MatchState): Action | null {
  if (match.currentPlayer === 1 && match.phase === "maneuver")
    return { type: "endManeuver" };
  return null;
}

const ARTILLERY: LessonDef = {
  id: "artillery",
  number: 11,
  title: "Artillery",
  subtitle: "Shoots from Support. Never trades return fire.",
  hubStats: [],
  units: [SENTINEL, TUTORIAL_DUMMY],
  keywords: parseKeywords("Artillery"),
  coach: [
    "Drop Houyi on Support. REST = will not initiate.",
    "Artillery never returns fire when attacked, and never takes return fire.",
    "Counters never hit HQ instead.",
  ],
  success: "Artillery fired clean — no return fire either way.",
  setup() {
    const state = createSandboxMatch();
    setReserve(state, 0, [SENTINEL]);
    spawnUnit(state, {
      defId: TUTORIAL_DUMMY,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
    });
    return state;
  },
  allow: allowSummonOnMidSupport(SENTINEL, "Houyi Quiver"),
  afterAction(match, action) {
    if (action.type === "deploy") {
      const gun = unitByDef(match, SENTINEL, 0);
      if (gun) gun.keywords = gun.keywords.filter((k) => k.name === "artillery");
      return;
    }
    if (action.type === "endDeployment") {
      const gun = unitByDef(match, SENTINEL, 0);
      if (gun?.rested)
        beginEngagement(match, { attacker: 1, skipRelocation: true });
      return;
    }
    if (action.type !== "endEngagement") return;
    const dummy = unitByDef(match, TUTORIAL_DUMMY, 1);
    if (dummy && dummy.hp === dummy.maxHp) resumeP1Deploy(match);
  },
  pickHint(match, hud, dismissed) {
    if (!onBoard(match, SENTINEL, 0)) {
      if (hud.pendingDeploy) {
        return hintGo(
          "drop",
          "cell-0-2",
          "Summon",
          "Click the highlighted cell.",
        );
      }
      if (hud.reserveOpen) {
        return hintGo(
          "pick",
          `reserve-unit-${SENTINEL}`,
          "Houyi",
          "Click Houyi (4S).",
        );
      }
      return hintGo(
        "reserve",
        "reserve",
        "Reserve",
        "Pick Houyi.",
      );
    }
    const enemy = dummyHp(match);
    if (match.board[P1_SUPPORT][LANE_MID]?.rested) {
      if (!dismissed.has("kw")) {
        return hintNext(
          "kw",
          "kw-artillery-11",
          "Artillery",
          "Stays on Support. Never trades return fire.",
          parseKeywords("Artillery"),
        );
      }
      if (!dismissed.has("rest")) {
        return hintNext(
          "rest",
          `rest-${SENTINEL}`,
          "REST",
          "Will not initiate. Dummy shoots first.",
        );
      }
      if (!dismissed.has("predict-dummy")) {
        return hintNext(
          "predict-dummy",
          `atk-${TUTORIAL_DUMMY}`,
          "Dummy first",
          "Dummy shoots. Artillery does not return fire.",
        );
      }
      return hintGo(
        "hourglass-dummy",
        "hourglass",
        "Start",
        "Watch Dummy shoot.",
      );
    }
    if (enemy <= 2) return null;
    if (!dismissed.has("no-return")) {
      return hintNext(
        "no-return",
        `hp-${SENTINEL}`,
        "No counter",
        "Houyi did not shoot back. REST is gone.",
      );
    }
    if (!dismissed.has("predict-shot")) {
      return hintNext(
        "predict-shot",
        "hp-103",
        "Artillery shot",
        "Houyi fires. Dummy cannot return fire at Artillery.",
      );
    }
    return hintGo(
      "hourglass-shot",
      "hourglass",
      "Continue",
      "Watch Houyi shoot.",
    );
  },
  steps: [
    {
      id: "summon",
      label: "Drop Houyi on Support (REST)",
      done: (m) => onBoard(m, SENTINEL, 0),
    },
    {
      id: "dummy",
      label: "Dummy shoots, Houyi does not return fire",
      done: (m) => hp(m, SENTINEL, 0) <= 6,
    },
    {
      id: "shot",
      label: "Houyi shoots, Dummy cannot return fire",
      done: (m) => dummyHp(m) <= 2 && hp(m, SENTINEL, 0) <= 6,
    },
  ],
};

const JET: LessonDef = {
  id: "jet-plane",
  number: 12,
  title: "Jet Plane",
  subtitle: "Rests when dropped. Still trades return fire.",
  hubStats: [],
  units: [TEMPEST, TUTORIAL_DUMMY],
  keywords: parseKeywords("Jet Plane"),
  coach: [
    "Drop Raijin on Support. REST = will not initiate this turn.",
    "Jets take and deal return fire (unlike Artillery).",
    "Counters ignore REST and work from Support.",
  ],
  success: "Jet traded shots both ways — unlike Artillery.",
  setup() {
    const state = createSandboxMatch();
    setReserve(state, 0, [TEMPEST]);
    const dummy = spawnUnit(state, {
      defId: TUTORIAL_DUMMY,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
    });
    dummy.atk = 5;
    return state;
  },
  allow: allowSummonOnMidSupport(TEMPEST, "Raijin Tempest"),
  scriptedAction: scriptEnemyManeuver,
  afterAction(match, action) {
    if (action.type === "deploy") {
      const jet = unitByDef(match, TEMPEST, 0);
      if (jet) jet.keywords = jet.keywords.filter((k) => k.name === "jetPlane");
      return;
    }
    if (action.type !== "endEngagement") return;
    const dummy = unitByDef(match, TUTORIAL_DUMMY, 1);
    const jet = unitByDef(match, TEMPEST, 0);
    if (!dummy || !jet) return;
    if (dummy.hp === dummy.maxHp) {
      resumeP1Deploy(match);
      return;
    }
    if (dummy.hp > 2) {
      match.currentPlayer = 1;
      match.phase = "maneuver";
    }
  },
  pickHint(match, hud, dismissed) {
    if (match.currentPlayer === 1) {
      if (!dismissed.has("dummy-atk")) {
        return hintNext(
          "dummy-atk",
          `atk-${TUTORIAL_DUMMY}`,
          "Dummy attacks",
          "Jet shoots back from Support. Counters ignore REST.",
        );
      }
      return null;
    }
    if (!onBoard(match, TEMPEST, 0)) {
      if (hud.pendingDeploy) {
        return hintGo(
          "drop",
          "cell-0-2",
          "Summon",
          "Click the highlighted cell.",
        );
      }
      if (hud.reserveOpen) {
        return hintGo(
          "pick",
          `reserve-unit-${TEMPEST}`,
          "Raijin",
          "Click Raijin (4S).",
        );
      }
      return hintGo(
        "reserve",
        "reserve",
        "Reserve",
        "Pick Raijin.",
      );
    }
    const jetHp = hp(match, TEMPEST, 0);
    const enemy = dummyHp(match);
    if (match.board[P1_SUPPORT][LANE_MID]?.rested) {
      if (!dismissed.has("kw")) {
        return hintNext(
          "kw",
          "kw-jetPlane-25",
          "Jet Plane",
          "Fights from Support. Unlike Artillery, trades return fire.",
          parseKeywords("Jet Plane"),
        );
      }
      if (!dismissed.has("rest")) {
        return hintNext(
          "rest",
          `rest-${TEMPEST}`,
          "REST",
          "Will not initiate. No shot → no return fire.",
        );
      }
      if (!dismissed.has("predict-rest")) {
        return hintNext(
          "predict-rest",
          `hp-${TEMPEST}`,
          "Result",
          "Raijin skips. No shots. REST clears.",
        );
      }
      return hintGo(
        "hourglass-rest",
        "hourglass",
        "Start",
        "No shots. REST clears.",
      );
    }
    if (enemy <= 2 && jetHp <= 9) {
      return null;
    }
    if (enemy <= 5 && jetHp <= 11) {
      if (!dismissed.has("traded")) {
        return hintNext(
          "traded",
          `hp-${TEMPEST}`,
          "Traded shots",
          "Jets take return fire — unlike Artillery.",
        );
      }
      return hintGo(
        "hourglass-dummy",
        "hourglass",
        "Continue",
        "Dummy will attack next.",
      );
    }
    if (!dismissed.has("support")) {
      return hintNext(
        "support",
        `unit-${TEMPEST}`,
        "Ready",
        "REST is gone. Raijin will shoot and take return fire.",
      );
    }
    if (!dismissed.has("predict-shot")) {
      return hintNext(
        "predict-shot",
        "hp-103",
        "Both shoot",
        "Jets trade return fire — unlike Artillery.",
      );
    }
    return hintGo(
      "hourglass-shot",
      "hourglass",
      "Start",
      "Watch both sides shoot.",
    );
  },
  steps: [
    {
      id: "summon",
      label: "Drop Raijin on Support (REST)",
      done: (m) => onBoard(m, TEMPEST, 0),
    },
    {
      id: "rest",
      label: "Rested: no shots, REST clears",
      done: (m) =>
        onBoard(m, TEMPEST, 0) && !m.board[P1_SUPPORT][LANE_MID]?.rested,
    },
    {
      id: "shot",
      label: "Raijin shoots, Dummy returns fire",
      done: (m) => dummyHp(m) <= 5 && hp(m, TEMPEST, 0) <= 11,
    },
    {
      id: "defend",
      label: "Dummy attacks, Raijin shoots back",
      done: (m) => dummyHp(m) <= 2 && hp(m, TEMPEST, 0) <= 9,
    },
  ],
};

const RETURN_FIRE: LessonDef = {
  id: "return-fire",
  number: 13,
  title: "Return Fire",
  subtitle: "Return fire hits who shot you — not the whole lane, not HQ",
  hubStats: [],
  units: [TUTORIAL_CADET, SENTINEL, TEMPEST, TUTORIAL_DUMMY],
  keywords: parseKeywords("Artillery; Jet Plane"),
  formula:
    "Counter hits shooters only · Artillery never trades · Counter never hits HQ",
  coach: [
    "Attackers shoot, then defenders return fire to whoever shot them.",
    "Counter hits the shooters, not the lane, never HQ.",
    "REST blocks initiating. Artillery never trades. Jets do.",
  ],
  success: "REST Cadet safe. Houyi clean. Raijin traded.",
  setup() {
    const state = createSandboxMatch();
    const cadet = spawnUnit(state, {
      defId: TUTORIAL_CADET,
      owner: 0,
      col: P1_FRONT,
      row: 0,
      rested: true,
    });
    cadet.rested = true;
    const d0 = spawnUnit(state, {
      defId: TUTORIAL_DUMMY,
      owner: 1,
      col: P2_FRONT,
      row: 0,
    });
    d0.atk = 2;

    const gun = spawnUnit(state, {
      defId: SENTINEL,
      owner: 0,
      col: P1_SUPPORT,
      row: LANE_MID,
      keywords: parseKeywords("Artillery"),
    });
    gun.rested = false;
    const dMid = spawnUnit(state, {
      defId: TUTORIAL_DUMMY,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
    });
    dMid.atk = 2;

    const jet = spawnUnit(state, {
      defId: TEMPEST,
      owner: 0,
      col: P1_SUPPORT,
      row: 4,
      keywords: parseKeywords("Jet Plane"),
    });
    jet.armor = 0;
    jet.rested = false;
    const dBot = spawnUnit(state, {
      defId: TUTORIAL_DUMMY,
      owner: 1,
      col: P2_FRONT,
      row: 4,
    });
    dBot.atk = 5;

    return state;
  },
  allow: skipToFight("deployment"),
  pickHint(match, _hud, dismissed) {
    if (match.phase !== "deployment") return null;

    if (!dismissed.has("rules")) {
      return hintNext(
        "rules",
        "phase",
        "Two volleys",
        "Attackers shoot, then defenders return fire to shooters. Counter never hits HQ. Artillery never trades; Jets do.",
      );
    }
    if (!dismissed.has("lane-rest")) {
      return hintNext(
        "lane-rest",
        "unit-101",
        "Lane 1 — REST",
        "Cadet is REST → skips volley. No shot → no return fire.",
      );
    }
    if (!dismissed.has("lane-arty")) {
      return hintNext(
        "lane-arty",
        `unit-${SENTINEL}`,
        "Lane 3 — Artillery",
        "Houyi shoots. Dummy cannot return fire at Artillery.",
        parseKeywords("Artillery"),
      );
    }
    if (!dismissed.has("lane-jet")) {
      return hintNext(
        "lane-jet",
        `unit-${TEMPEST}`,
        "Lane 5 — Jet",
        "Raijin shoots. Dummy returns fire at Raijin.",
        parseKeywords("Jet Plane"),
      );
    }
    if (!dismissed.has("predict")) {
      return hintNext(
        "predict",
        "hourglass",
        "Result",
        "REST safe. Artillery clean. Jet trades.",
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "Start",
      "Watch all three lanes.",
    );
  },
  steps: [
    {
      id: "demo",
      label: "REST safe, Artillery clean, Jet trades",
      done: (m) => {
        const cadet = m.board[P1_FRONT][0];
        const d0 = m.board[P2_FRONT][0];
        const gun = m.board[P1_SUPPORT][LANE_MID];
        const dMid = m.board[P2_FRONT][LANE_MID];
        const jet = m.board[P1_SUPPORT][4];
        const dBot = m.board[P2_FRONT][4];
        return Boolean(
          cadet &&
          d0 &&
          gun &&
          dMid &&
          jet &&
          dBot &&
          cadet.hp === cadet.maxHp &&
          d0.hp >= 8 &&
          gun.hp === gun.maxHp &&
          dMid.hp <= 2 &&
          jet.hp <= 8 &&
          dBot.hp <= 5,
        );
      },
    },
  ],
};

const PLAYSTYLE_AGGRO: LessonDef = {
  id: "playstyle-aggro",
  number: 14,
  title: "Playstyle: Aggro",
  subtitle: "Race the enemy HQ with Blitz, Flank, Rally, Diversion",
  hubStats: ["hp", "supply"],
  units: [27, 26, 6, 19, 22],
  keywords: parseKeywords("Blitz; Flank"),
  formula: "Empty lane → shoot HQ. Blitz: Front on deploy. Flank: sidestep blockers",
  coach: [
    "Aggro punches HQ. Open lanes are free shots.",
    "Blitz jumps to Front. Flank leaves blocked lane for empty one.",
    "Rally: +3 ATK. Diversion: yank blocker out of lane.",
  ],
  success: "Rally + both jets punch HQ.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, { defId: 27, owner: 0, col: P1_FRONT, row: 0 });
    spawnUnit(state, { defId: 26, owner: 0, col: P1_FRONT, row: LANE_MID });
    spawnUnit(state, { defId: 6, owner: 0, col: P1_SUPPORT, row: LANE_MID });
    spawnUnit(state, { defId: 19, owner: 0, col: P1_SUPPORT, row: 0 });
    spawnUnit(state, {
      defId: 22,
      owner: 1,
      col: P2_SUPPORT,
      row: LANE_MID,
      keywords: [],
    });
    state.players[1].hqHp = HQ_MAX_HP;
    giveUnitCard(state, 0, 6, "rally");
    giveUnitCard(state, 0, 19, "diversion");
    giveUnitCard(state, 1, 13, "forward");
    giveUnitCard(state, 1, 5, "repair");
    setSupply(state, 0, 3);
    setPhase(state, "maneuver");
    return state;
  },
  allow(match, action) {
    if (action.type === "playCard") {
      const card = cardOf(match, action);
      if (!card) return "Play Rally on Komet, or Diversion on Horus.";
      if (card.templateId === "rally") return null;
      if (card.templateId === "diversion") return null;
      return "Play Rally on Komet, or Diversion on Horus.";
    }
    if (action.type === "endManeuver") {
      if (!discardedTemplate(match, 0, "rally"))
        return "Play Rally on Komet first.";
      return null;
    }
    return "Play Rally, then the hourglass.";
  },
  pickHint(match, hud, dismissed) {
    if (match.phase === "engagement") return null;

    if (!discardedTemplate(match, 0, "rally")) {
      if (!dismissed.has("race")) {
        return hintNext(
          "race",
          "hq-1",
          "Race the HQ",
          "Open lanes shoot HQ. Chip it to 0.",
        );
      }
      if (!dismissed.has("blitz")) {
        return hintNext(
          "blitz",
          "kw-blitz-27",
          "Blitz",
          "Komet in empty lane → shoots HQ.",
          parseKeywords("Blitz"),
        );
      }
      if (!dismissed.has("flank")) {
        return hintNext(
          "flank",
          "kw-flank-26",
          "Flank",
          "Stealthray sidesteps to empty lane → shoots HQ.",
          parseKeywords("Flank"),
        );
      }
      if (targeting(hud, "rally") && pickedUnits(hud) < 1) {
        return hintGo(
          "rally-target",
          "unit-27",
          "Target",
          "Click Komet.",
        );
      }
      return hintGo(
        "rally",
        "card-rally",
        "Rally",
        "Drag Rally → click Komet. +3 ATK.",
      );
    }

    if (!dismissed.has("predict")) {
      return hintNext(
        "predict",
        "hq-1",
        "Result",
        "Both jets punch HQ.",
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "End Maneuver",
      "Watch jets punch HQ.",
    );
  },
  steps: [
    {
      id: "rally",
      label: "Rally on Komet",
      done: (m) => discardedTemplate(m, 0, "rally"),
    },
    {
      id: "hq",
      label: "Jets punch HQ",
      done: (m) => m.players[1].hqHp <= 63,
    },
  ],
};

const PLAYSTYLE_MISSILE_ARTY: LessonDef = {
  id: "playstyle-missile-arty",
  number: 15,
  title: "Playstyle: Missile / Artillery",
  subtitle: "Cover wall up front, guns and missiles from Support",
  hubStats: ["armor"],
  units: [3, 10, 4, 22],
  keywords: parseKeywords("Cover; Artillery; Missile 5"),
  formula: "Artillery on Support. Missile = half armor, no AP. Barrage splashes 1",
  coach: [
    "Cover wall on Front. Artillery/Missiles erase from Support.",
    "Tiamat (Artillery + Missile) never trades return fire.",
    "Missile Barrage: next missile splashes 1 to surrounding enemies.",
  ],
  success: "Barrage + gun + missile hit Sarama, splash Horus.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, { defId: 3, owner: 0, col: P1_FRONT, row: LANE_MID });
    spawnUnit(state, { defId: 10, owner: 0, col: P1_SUPPORT, row: LANE_MID });
    spawnUnit(state, {
      defId: 4,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 22,
      owner: 1,
      col: P2_FRONT,
      row: 1,
      keywords: [],
    });
    giveUnitCard(state, 0, 10, "missile_barrage");
    giveUnitCard(state, 1, 13, "forward");
    giveUnitCard(state, 1, 5, "repair");
    setSupply(state, 0, 3);
    setPhase(state, "maneuver");
    return state;
  },
  allow(match, action) {
    if (action.type === "playCard") {
      const card = cardOf(match, action);
      if (!card) return "Play Missile Barrage.";
      if (card.templateId === "missile_barrage") return null;
      return "Play Missile Barrage.";
    }
    if (action.type === "endManeuver") {
      if (!discardedTemplate(match, 0, "missile_barrage"))
        return "Play Missile Barrage first.";
      return null;
    }
    return "Play Missile Barrage, then the hourglass.";
  },
  pickHint(match, _hud, dismissed) {
    if (match.phase === "engagement") return null;

    if (!discardedTemplate(match, 0, "missile_barrage")) {
      if (!dismissed.has("wall")) {
        return hintNext(
          "wall",
          "unit-3",
          "Cover wall",
          "Xuanwu holds Front. Artillery fires from Support.",
          parseKeywords("Cover"),
        );
      }
      if (!dismissed.has("arty")) {
        return hintNext(
          "arty",
          "kw-artillery-10",
          "Artillery",
          "Never trades return fire.",
          parseKeywords("Artillery"),
        );
      }
      if (!dismissed.has("missile")) {
        return hintNext(
          "missile",
          "kw-missile-10",
          "Missile",
          "After gun, fires Missile. Half armor, no AP.",
          parseKeywords("Missile 5"),
        );
      }
      return hintGo(
        "barrage",
        "card-missile_barrage",
        "Barrage",
        "Drag onto board. Splashes 1 to adjacent enemies.",
      );
    }

    if (!dismissed.has("predict")) {
      return hintNext(
        "predict",
        "hp-4",
        "Result",
        "Gun + Missile hit Sarama. Splash hits Horus.",
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "End Maneuver",
      "Watch the Support salvo.",
    );
  },
  steps: [
    {
      id: "barrage",
      label: "Play Missile Barrage",
      done: (m) => discardedTemplate(m, 0, "missile_barrage"),
    },
    {
      id: "salvo",
      label: "Gun + Missile + Splash",
      done: (m) => hp(m, 4, 1) <= 1 && hp(m, 22, 1) <= 3,
    },
  ],
};

const PLAYSTYLE_TANK_ROBOT: LessonDef = {
  id: "playstyle-tank-robot",
  number: 16,
  title: "Playstyle: Tank + Robot",
  subtitle: "Aggressive frontline, then Quick Engagement to pick a fight",
  hubStats: ["atk", "hp"],
  units: [2, 14, 6, 4, 22],
  keywords: parseKeywords("Aggressive 4"),
  formula: "Aggressive only when attacking. Quick Engagement = one lane fights now",
  coach: [
    "Hold Frontline, pick fights. Aggressive adds ATK only when attacking.",
    "Quick Engagement: one Frontline ally fights now with keyword buffs.",
    "Clear a blocker mid-turn, then regular Engagement finishes the rest.",
  ],
  success: "Quick Engagement + Aggressive clears both blockers.",
  setup() {
    const state = createSandboxMatch();
    spawnUnit(state, { defId: 2, owner: 0, col: P1_FRONT, row: LANE_MID });
    spawnUnit(state, { defId: 14, owner: 0, col: P1_FRONT, row: 0 });
    spawnUnit(state, { defId: 6, owner: 0, col: P1_SUPPORT, row: LANE_MID });
    spawnUnit(state, {
      defId: 4,
      owner: 1,
      col: P2_FRONT,
      row: LANE_MID,
      keywords: [],
    });
    spawnUnit(state, {
      defId: 22,
      owner: 1,
      col: P2_FRONT,
      row: 0,
      keywords: [],
    });
    giveUnitCard(state, 0, 6, "quick_engagement");
    giveUnitCard(state, 1, 13, "forward");
    giveUnitCard(state, 1, 5, "repair");
    setSupply(state, 0, 3);
    setPhase(state, "maneuver");
    return state;
  },
  allow(match, action) {
    if (action.type === "playCard") {
      const card = cardOf(match, action);
      if (!card) return "Play Quick Engagement on Fenrir.";
      if (card.templateId === "quick_engagement") return null;
      return "Play Quick Engagement on Fenrir.";
    }
    if (action.type === "endManeuver") {
      if (!discardedTemplate(match, 0, "quick_engagement"))
        return "Play Quick Engagement on Fenrir first.";
      if (match.phase === "engagement")
        return "Finish the Quick Engagement first (hourglass).";
      return null;
    }
    return "Play Quick Engagement, finish that fight, then the hourglass.";
  },
  pickHint(match, hud, dismissed) {
    if (match.phase === "engagement") return null;

    if (!discardedTemplate(match, 0, "quick_engagement")) {
      if (!dismissed.has("front")) {
        return hintNext(
          "front",
          "unit-2",
          "Aggressive",
          "Fenrir and Skadi have Aggressive 4. Bonus ATK when attacking.",
          parseKeywords("Aggressive 4"),
        );
      }
      if (!dismissed.has("qe-card")) {
        return hintNext(
          "qe-card",
          "card-quick_engagement",
          "Quick Engagement",
          "One Frontline ally fights now with keyword buffs.",
        );
      }
      if (targeting(hud, "quick_engagement") && pickedUnits(hud) < 1) {
        return hintGo(
          "qe-target",
          "unit-2",
          "Fenrir",
          "Click Fenrir. Aggressive applies.",
        );
      }
      return hintGo(
        "qe",
        "card-quick_engagement",
        "Quick Engagement",
        "Drag onto board, click Fenrir.",
      );
    }

    if (!dismissed.has("chip")) {
      return hintNext(
        "chip",
        "hp-4",
        "Done",
        "Fenrir's lane fought. Aggressive applied.",
        parseKeywords("Aggressive 4"),
      );
    }
    if (!dismissed.has("predict")) {
      return hintNext(
        "predict",
        "unit-14",
        "Next",
        "Regular Engagement clears both blockers.",
        parseKeywords("Aggressive 4"),
      );
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "End Maneuver",
      "Both frontliners clear blockers.",
    );
  },
  steps: [
    {
      id: "qe",
      label: "Quick Engagement on Fenrir",
      done: (m) =>
        discardedTemplate(m, 0, "quick_engagement") && hp(m, 4, 1) <= 3,
    },
    {
      id: "clear",
      label: "Clear both blockers",
      done: (m) => !onBoard(m, 4, 1) && !onBoard(m, 22, 1),
    },
  ],
};

export const LESSONS: LessonDef[] = [
  BASIC,
  RESOURCES,
  ARMOR,
  MANEUVER,
  COMEBACK,
  COVER_FLANK,
  AGGRESSIVE,
  SUPPORT_FIRE,
  MISSILE,
  EXTRA,
  ARTILLERY,
  JET,
  RETURN_FIRE,
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

/** Tutorial lobby sections — must stay in sync with `LESSONS` + build-army. */
export const TUTORIAL_HUB: readonly HubSection[] = [
  {
    id: "basic",
    eyebrow: "Section 01",
    title: "Basics",
    intro: "Supply, summoning, armor, moves, and comeback when you're behind.",
    cards: LESSONS.filter((l) => l.number <= 5).map(hubCard),
  },
  {
    id: "keywords",
    eyebrow: "Section 02",
    title: "Keywords",
    intro: "How keyword abilities change fights and positioning.",
    cards: LESSONS.filter((l) => l.number >= 6 && l.number <= 10).map(hubCard),
  },
  {
    id: "special",
    eyebrow: "Section 03",
    title: "Special units",
    intro: "Artillery, jets, and how return fire works.",
    cards: LESSONS.filter((l) => l.number >= 11 && l.number <= 13).map(hubCard),
  },
  {
    id: "strategy",
    eyebrow: "Section 04",
    title: "Playstyles & army",
    intro: "Archetype sandboxes, then build your own 8-unit list.",
    cards: [
      ...LESSONS.filter((l) => l.number >= 14).map(hubCard),
      {
        id: "build-army",
        title: "Build an army",
        subtitle: "8 units. Their cards are the deck.",
        number: 17,
        hubStats: [],
        keywords: [],
      },
    ],
  },
];
