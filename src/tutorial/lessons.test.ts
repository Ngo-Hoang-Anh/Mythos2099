import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { P1_FRONT, P1_SUPPORT, P2_FRONT } from "../engine/types";
import { TUTORIAL_CADET, TUTORIAL_DUMMY, TUTORIAL_RECRUIT } from "../data/tutorialUnits";
import { createSandboxMatch, spawnUnit, unitByDef } from "../engine/sandbox";
import { hasStatusOn } from "../engine/status";
import {
  applyLessonAction,
  firstIncompleteTutorialId,
  nextTutorialId,
  startLesson,
  tutorialOrder,
  type LessonResult,
} from "./controller";
import {
  LESSONS,
  TUTORIAL_HUB,
  pickLessonHint,
  type TutorialHud,
} from "./lessons";
import { BUILD_GUIDE_ID, BUILD_GUIDE_STEPS } from "./buildGuide";
import type { Action, MatchState } from "../engine/types";

const HUD: TutorialHud = { reserveOpen: false, pendingDeploy: null };

function hint(
  lesson: (typeof LESSONS)[number],
  match: MatchState,
  dismissed: string[] = [],
  extra: Partial<TutorialHud> = {},
) {
  return pickLessonHint(lesson, match, { ...HUD, ...extra }, new Set(dismissed));
}

function must(result: LessonResult): MatchState {
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

function play(lesson: (typeof LESSONS)[number], match: MatchState, action: Action): MatchState {
  return must(applyLessonAction(lesson, match, action));
}

/** Idle through phases until the match ends (P2 scripted; P1 plays no more cards). */
function idleToEnd(lesson: (typeof LESSONS)[number], match: MatchState, n = 20): MatchState {
  for (let i = 0; i < n && match.winner == null; i++) {
    if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
    else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
    else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    else break;
  }
  return match;
}

describe("sandbox match", () => {
  it("skips 8-unit validation and Initiative", () => {
    const match = createSandboxMatch();
    expect(match.players[0].undeployed).toEqual([]);
    expect(match.players[0].hand).toEqual([]);
    expect(match.players[1].hand).toEqual([]);
    expect(match.players[0].commandPoints).toBe(4);
    spawnUnit(match, { defId: 4, owner: 0, col: P1_FRONT, row: 2 });
    expect(unitByDef(match, 4, 0)?.row).toBe(2);
  });
});

describe("tutorial lessons", () => {
  it("has twenty-four sandbox lessons plus a build walkthrough", () => {
    expect(LESSONS).toHaveLength(24);
    expect(LESSONS.map((l) => l.id)).toEqual([
      "basic",
      "victory",
      "resources",
      "movement-forward",
      "movement-updown",
      "armor",
      "comeback",
      "cover-flank",
      "aggressive",
      "barrier-timing",
      "veteran-first-strike",
      "smoke-timing",
      "shock-match",
      "support-fire",
      "missile",
      "scout-recon",
      "hulldown-slope",
      "extra-attack",
      "fire",
      "artillery",
      "jet-plane",
      "playstyle-aggro",
      "playstyle-missile-arty",
      "playstyle-tank-robot",
    ]);
  });

  it("spotlight anchors match DOM data-tut ids (no zero-pad / typo anchors)", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(dir, "lessons.ts"), "utf8");
    // UnitToken emits `hp-${unitId}` → "hp-3", not "hp-03".
    const padded = src.match(/"(?:hp|atk|armor|ap|unit|kw-[a-zA-Z]+)-0\d"/g) ?? [];
    expect(padded).toEqual([]);
    expect(src.includes("atk-t03")).toBe(false);
    for (const lesson of LESSONS) {
      const { match } = startLesson(lesson.id);
      const opening = pickLessonHint(lesson, match, HUD, new Set());
      if (!opening) continue;
      expect(opening.anchor, lesson.id).not.toMatch(/^(?:hp|atk|armor|ap|unit|kw-[a-zA-Z]+)-0\d$/);
      expect(opening.anchor, lesson.id).not.toMatch(/-t\d/);
    }
  });

  it("hub cards list only the stats and keywords each lesson uses", () => {
    expect(LESSONS.map((l) => ({ id: l.id, stats: l.hubStats, kws: l.keywords.map((k) => k.name) }))).toEqual([
      { id: "basic", stats: ["supply", "hp", "atk"], kws: [] },
      { id: "victory", stats: ["hp", "atk", "supply"], kws: [] },
      { id: "resources", stats: ["supply"], kws: [] },
      { id: "movement-forward", stats: [], kws: [] },
      { id: "movement-updown", stats: [], kws: [] },
      { id: "armor", stats: ["armor", "ap"], kws: [] },
      { id: "comeback", stats: ["supply"], kws: [] },
      { id: "cover-flank", stats: [], kws: ["flank", "cover"] },
      { id: "aggressive", stats: [], kws: ["aggressive", "retaliate"] },
      { id: "barrier-timing", stats: [], kws: ["barrier"] },
      { id: "veteran-first-strike", stats: ["supply"], kws: ["veteran", "firstStrike"] },
      { id: "smoke-timing", stats: [], kws: ["smokeScreen"] },
      { id: "shock-match", stats: [], kws: ["shock", "shield", "barrier", "smokeScreen"] },
      { id: "support-fire", stats: [], kws: ["supportFire"] },
      { id: "missile", stats: ["ap", "armor"], kws: ["missile"] },
      { id: "scout-recon", stats: [], kws: ["camouflage", "suppression", "scout", "blitz"] },
      { id: "hulldown-slope", stats: [], kws: ["hulldown", "slopedArmor", "corrosion", "radar"] },
      { id: "extra-attack", stats: ["atk"], kws: [] },
      { id: "fire", stats: [], kws: ["fire"] },
      { id: "artillery", stats: [], kws: ["artillery"] },
      { id: "jet-plane", stats: [], kws: ["jetPlane"] },
      { id: "playstyle-aggro", stats: ["hp", "supply"], kws: ["blitz", "flank"] },
      { id: "playstyle-missile-arty", stats: ["armor"], kws: ["cover", "artillery", "missile"] },
      { id: "playstyle-tank-robot", stats: ["atk", "hp"], kws: ["aggressive"] },
    ]);
  });

  it("1 basic: free-play trades then wipe Dummy", () => {
    const { lesson, match: start } = startLesson("basic");
    let match = play(lesson, start, { type: "deploy", unitDefId: 101, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.board[P2_FRONT][2]?.hp).toBe(5);
    expect(match.board[P1_FRONT][2]?.hp).toBe(5);
    // P2 pokes Cadet; Cadet return leaves Dummy at 2.
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.board[P1_FRONT][2]?.hp).toBe(4);
    expect(match.board[P2_FRONT][2]?.hp).toBe(2);
    // P1's next volley finishes Dummy (ATK 3 into 2 HP).
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("1 basic: skip deploy — Dummy volleys your 1 HP HQ", () => {
    const { lesson, match: start } = startLesson("basic");
    let match = play(lesson, start, { type: "endDeployment" });
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("1 basic: intro stats then reserve / hourglass highlights", () => {
    const { lesson, match } = startLesson("basic");
    expect(hint(lesson, match)?.id).toBe("intro-supply");
    expect(hint(lesson, match, ["intro-supply"])?.id).toBe("intro-hp");
    expect(hint(lesson, match, ["intro-supply", "intro-hp"])?.id).toBe("intro-atk");
    const afterIntro = ["intro-supply", "intro-hp", "intro-atk"];
    expect(hint(lesson, match, afterIntro)?.anchor).toBe("reserve");
    expect(hint(lesson, match, afterIntro, { reserveOpen: true })?.anchor).toBe(
      `reserve-unit-${TUTORIAL_CADET}`,
    );
    // Pending deploy: no yellow cell spotlight — board uses green Drop here like a real match.
    expect(hint(lesson, match, afterIntro, { pendingDeploy: TUTORIAL_CADET })).toBeNull();
  });

  it("2 victory: no chrome / supply re-teach spotlight", () => {
    const { lesson, match } = startLesson("victory");
    expect(hint(lesson, match)).toBeNull();
  });

  it("2 victory: free-play empty lanes break the HQ", () => {
    const { lesson, match: start } = startLesson("victory");
    expect(start.players[1].hqHp).toBe(6);
    expect(start.players[0].hqHp).toBe(8);
    let match = play(lesson, start, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 0 });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 3 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(0);
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
  });

  it("2 victory: jam the blockers — return fire deletes Cadets (elimination)", () => {
    const { lesson, match: start } = startLesson("victory");
    // Both Cadets into armored blockers — 0 gun damage through Armor 8; return ATK 6 deletes them.
    let match = play(lesson, start, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 1 });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(6);
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("elimination");
  });

  it("2 victory: one open Cadet only — shortfall, then blockers snipe HQ", () => {
    const { lesson, match: start } = startLesson("victory");
    let match = play(lesson, start, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 0 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(3);
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("2 victory: do nothing — blockers still snipe HQ on their turn", () => {
    const { lesson, match: start } = startLesson("victory");
    let match = play(lesson, start, { type: "endDeployment" });
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("1 basic: wrong lane — Dummy volleys your HQ on P2 turn", () => {
    const { lesson, match: start } = startLesson("basic");
    let match = play(lesson, start, { type: "deploy", unitDefId: 101, row: 0 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[0].hqHp).toBe(1);
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("3 going second: free-play Initiative Move then HQ kill", () => {
    const { lesson, match: start } = startLesson("resources");
    expect(start.currentPlayer).toBe(1);
    expect(start.players[0].hand.map((c) => c.templateId)).toEqual(["initiative"]);
    expect(start.players[1].hqHp).toBe(3);
    expect(start.players[0].hqHp).toBe(5);

    let match = play(lesson, start, { type: "endDeployment" });
    expect(match.players[0].hqHp).toBe(5);
    expect(match.board[P2_FRONT][0]?.rested).toBe(true);
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(0);

    // Recruit Blitz on open lane 2 (row 1); Cadet Support lane 3 then Initiative Move.
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_RECRUIT, row: 1 });
    expect(match.board[P1_FRONT][1]?.defId).toBe(TUTORIAL_RECRUIT);
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.phase).toBe("maneuver");
    expect(hint(lesson, match)?.id).toBe("ui-card-play");
    expect(hint(lesson, match, ["ui-card-play"])).toBeNull();

    const cadet = unitByDef(match, TUTORIAL_CADET, 0)!;
    const sealed = match.players[0].hand.find((card) => card.templateId === "initiative")!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: sealed.instanceId,
      targets: { choice: "move", unitIds: [cadet.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(match.board[P1_FRONT][2]?.rested).toBe(false);

    match = play(lesson, match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBe(0);
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
  });

  it("3 going second: Initiative supply leaves Cadet Resting — Dummy finishes HQ", () => {
    const { lesson, match: start } = startLesson("resources");
    let match = play(lesson, start, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_RECRUIT, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    const sealed = match.players[0].hand.find((card) => card.templateId === "initiative")!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: sealed.instanceId,
      targets: { choice: "supply" },
    });
    match = play(lesson, match, { type: "endManeuver" });
    // Recruit Blitz alone deals 1; HQ lives. Cadet auto-advanced Resting — no shot.
    expect(match.players[1].hqHp).toBeGreaterThan(0);
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    // P2 idle script: Dummy (unrefreshed Front) volleys HQ 5.
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });


  it("4 movement-forward: Forward Lane 2, Lane 1 auto-Advances rested", () => {
    const { lesson, match: start } = startLesson("movement-forward");
    expect(start.phase).toBe("maneuver");
    expect(start.players[0].hqHp).toBe(5);
    const thothB = unitByDef(start, 1152, 0)!;
    const forward = start.players[0].hand.find((c) => c.templateId === "forward")!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: forward.instanceId,
      targets: { unitIds: [thothB.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(unitByDef(match, 1152, 0)?.rested).toBe(false);
    match = play(lesson, match, { type: "endManeuver" });
    // Lane 2: Forward shot deletes Enemy B. Lane 1: Thoth A Advanced+Rested (no shot).
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(unitByDef(match, 1151, 0)?.col).toBe(P1_FRONT);
    expect(unitByDef(match, 1151, 0)?.rested).toBe(true);
    expect(match.board[P2_FRONT][1]?.hp).toBe(5);
    // P2 auto-skips empty Maneuver; Enemy A's attack draws Thoth A return fire and clears the board.
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("4 movement-forward: skip Forward — Flank Enemy B snipes HQ", () => {
    const { lesson, match: start } = startLesson("movement-forward");
    let match = play(lesson, start, { type: "endManeuver" });
    expect(unitByDef(match, 1151, 0)?.rested).toBe(true);
    expect(unitByDef(match, 1152, 0)?.rested).toBe(true);
    expect(match.board[P2_FRONT][2]?.defId).toBe(1142);
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("5 movement-updown: discard-redraw Down then block both lanes", () => {
    const { lesson, match: start } = startLesson("movement-updown");
    expect(start.phase).toBe("maneuver");
    expect(start.players[0].hqHp).toBe(1);
    expect(hint(lesson, start)?.id).toBe("ui-card-discard");
    expect(start.players[0].hand.map((c) => c.templateId)).toEqual(["up", "up"]);
    expect(start.players[0].deck.map((c) => c.templateId)).toEqual(["down"]);
    const discardUp = start.players[0].hand.find((c) => c.templateId === "up")!;
    let match = play(lesson, start, { type: "discardRedraw", cardId: discardUp.instanceId });
    expect(match.players[0].hand.some((c) => c.templateId === "down")).toBe(true);
    const north = unitByDef(match, 1153, 0)!;
    const south = unitByDef(match, 1154, 0)!;
    const down = match.players[0].hand.find((c) => c.templateId === "down")!;
    const up = match.players[0].hand.find((c) => c.templateId === "up")!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: down.instanceId,
      targets: { unitIds: [north.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
    });
    match = play(lesson, match, {
      type: "playCard",
      cardId: up.instanceId,
      targets: { unitIds: [south.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(match.board[P1_FRONT][1]?.defId).toBe(1153);
    expect(match.board[P1_FRONT][2]?.defId).toBe(1154);
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("5 movement-updown: skip block — Destroyers delete 1 HP HQ", () => {
    const { lesson, match: start } = startLesson("movement-updown");
    let match = play(lesson, start, { type: "endManeuver" });
    // P1 outer lanes open-fire the enemy HQ first; P2 Destroyers then snipe the 1 HP HQ.
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
    expect(match.players[0].hqHp).toBe(0);
  });

  it("6 armor: Retreat+Forward swap then matched lanes clear both targets", () => {
    const { lesson, match: start } = startLesson("armor");
    expect(start.phase).toBe("maneuver");
    expect(start.players[0].hqHp).toBe(1);
    expect(start.players[1].hqHp).toBe(60);
    expect(hint(lesson, start)?.id).toBe("intro-armor");
    expect(hint(lesson, start, ["intro-armor"])?.id).toBe("intro-ap");
    expect(hint(lesson, start, ["intro-armor", "intro-ap"])).toBeNull();
    // Mismatched: Assault row 2 vs Bastion, Rostam row 1 vs Heavy.
    expect(start.board[P1_FRONT][2]?.defId).toBe(1041);
    expect(start.board[P1_FRONT][1]?.defId).toBe(1045);
    let match = start;
    const assault = unitByDef(match, 1041, 0)!;
    const rostam = unitByDef(match, 1045, 0)!;
    // Diagonal Retreat into swapped Support lanes, then Forward onto matched Front.
    const retreatAssault = match.players[0].hand.find((c) => c.templateId === "retreat" && c.ownerUnitId === 1041)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: retreatAssault.instanceId,
      targets: { unitIds: [assault.instanceId], cells: [{ col: P1_SUPPORT, row: 1 }] },
    });
    const retreatRostam = match.players[0].hand.find((c) => c.templateId === "retreat" && c.ownerUnitId === 1045)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: retreatRostam.instanceId,
      targets: { unitIds: [rostam.instanceId], cells: [{ col: P1_SUPPORT, row: 2 }] },
    });
    const forwardAssault = match.players[0].hand.find((c) => c.templateId === "forward" && c.ownerUnitId === 1041)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: forwardAssault.instanceId,
      targets: { unitIds: [assault.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
    });
    const forwardRostam = match.players[0].hand.find((c) => c.templateId === "forward" && c.ownerUnitId === 1045)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: forwardRostam.instanceId,
      targets: { unitIds: [rostam.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(match.board[P1_FRONT][1]?.defId).toBe(1041);
    expect(match.board[P1_FRONT][2]?.defId).toBe(1045);
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(match.board[P2_FRONT][1]?.hp).toBe(10);
    for (let i = 0; i < 4 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      if (match.winner != null) break;
      if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    }
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("6 armor: skip swap — mismatched lanes lose the 1-HP HQ", () => {
    const { lesson, match: start } = startLesson("armor");
    let match = play(lesson, start, { type: "endManeuver" });
    // Wrong lanes: Assault chips Bastion and dies to return fire on the 2nd exchange;
    // Bastion then open-lanes the 1-HP HQ on P2's attack.
    for (let i = 0; i < 8 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      if (match.winner != null) break;
      if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    }
    expect(match.winner).toBe(1);
  });

  it("7 comeback: survive opening, Comeback Forward rush, destroy HQ", () => {
    const { lesson, match: start } = startLesson("comeback");
    expect(start.phase).toBe("maneuver");
    expect(start.players[0].commandPoints).toBe(0);
    expect(start.players[0].hand).toEqual([]);
    expect(start.players[0].hqHp).toBe(10);
    expect(start.players[1].hqHp).toBe(5);
    expect(start.players[0].undeployed).toEqual([TUTORIAL_CADET, TUTORIAL_CADET]);
    expect(start.board[P1_FRONT][2]?.atk).toBe(5);
    expect(start.board[P1_FRONT][2]?.hp).toBe(6);
    expect(hint(lesson, start)).toBeNull();

    // Turn 1: empty Maneuver → Engagement (rested Cadets do not fire).
    let match = play(lesson, start, { type: "endManeuver" });
    expect(match.players[0].hqHp).toBe(10);
    match = play(lesson, match, { type: "endEngagement" });

    // P2 volley: row-0 Cadet dies (Comeback); row-2 Cadet survives ATK 5; open lanes chip HQ.
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.board[P1_FRONT][0]).toBeNull();
    const survivor = match.board[P1_FRONT][2];
    expect(survivor?.defId).toBe(TUTORIAL_CADET);
    expect(survivor!.hp).toBe(1);
    expect(survivor!.atk).toBe(5);
    expect(match.players[0].nextTurnSupplyBonus).toBeGreaterThan(0);
    expect(match.players[0].hqHp).toBeLessThan(10);
    expect(hint(lesson, match)?.id).toBe("intro-comeback");
    match = play(lesson, match, { type: "endEngagement" });

    // Turn 2: Comeback Supply + draw both Forwards; Forward reinforcements onto open lanes.
    expect(match.currentPlayer).toBe(0);
    expect(match.phase).toBe("deployment");
    expect(match.players[0].commandPoints).toBeGreaterThanOrEqual(6);
    expect(match.players[0].hand.filter((c) => c.templateId === "forward")).toHaveLength(2);
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 0 });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    for (const row of [0, 1]) {
      const fromSupport = match.board[P1_SUPPORT][row]!;
      expect(fromSupport.defId).toBe(TUTORIAL_CADET);
      const card = match.players[0].hand.find((c) => c.templateId === "forward")!;
      match = play(lesson, match, {
        type: "playCard",
        cardId: card.instanceId,
        targets: { unitIds: [fromSupport.instanceId], cells: [{ col: P1_FRONT, row }] },
      });
      expect(match.board[P1_FRONT][row]?.rested).toBe(false);
    }
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(match.board[P2_FRONT][0]).toBeNull();

    for (let i = 0; i < 10 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      if (match.winner != null) break;
      if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    }
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
  });

  it("10 cover-flank: deploy Cover then Flank/Cover save HQ and snipe", () => {
    const { lesson, match: start } = startLesson("cover-flank");
    expect(hint(lesson, start)?.id).toMatch(/^intro-kw-/);
    const intros = ["intro-kw-flank", "intro-kw-cover"];
    // Drop Cover on empty Support (row 1), not the contested lane.
    let match = play(lesson, start, { type: "deploy", unitDefId: 1072, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, 1073, 0)?.row).not.toBe(2);
    const cover = unitByDef(match, 1072, 0)!;
    expect(cover.col).toBe(P1_FRONT);
    expect(cover.row).toBe(2);
    expect(match.players[0].hqHp).toBe(10);
    expect(match.players[1].hqHp).toBeLessThan(10);
    // Keep going until Flank finishes enemy HQ.
    for (let i = 0; i < 8 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      if (match.winner != null) break;
      if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    }
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
    expect(hint(lesson, start, intros)).toBeNull();
  });

  it("11 aggressive: deploy Fenrir, Retreat scouts, Aggressive snipes HQ", () => {
    const { lesson, match: start } = startLesson("aggressive");
    expect(hint(lesson, start)?.id).toMatch(/^intro-kw-/);
    expect(start.players[0].hand.filter((c) => c.templateId === "retreat")).toHaveLength(2);
    let match = play(lesson, start, { type: "deploy", unitDefId: 1083, row: 2 });
    expect(unitByDef(match, 1083, 0)?.col).toBe(P1_FRONT);
    expect(unitByDef(match, 1083, 0)?.rested).toBe(false);
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.phase).toBe("maneuver");
    for (const row of [0, 1]) {
      const scout = match.board[P1_FRONT][row]!;
      const card = match.players[0].hand.find((c) => c.templateId === "retreat")!;
      match = play(lesson, match, {
        type: "playCard",
        cardId: card.instanceId,
        targets: { unitIds: [scout.instanceId], cells: [{ col: P1_SUPPORT, row }] },
      });
      expect(match.board[P1_SUPPORT][row]?.defId).toBe(1081);
    }
    match = play(lesson, match, { type: "endManeuver" });
    // Fenrir Aggressive open-lane: 4+4=8 into HQ 12 (may need a second P1 volley).
    for (let i = 0; i < 6 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      if (match.winner != null) break;
      if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    }
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
  });

  it("12 barrier-timing: Forward Retaliate (correct) wins; Forward Aggressive (wrong) loses", () => {
    // Correct: Forward Beta into Retaliate → Barrier soaks counter; Alpha rests with Barrier intact.
    {
      const { lesson, match: start } = startLesson("barrier-timing");
      expect(start.players[0].commandPoints).toBe(1);
      const beta = unitByDef(start, 1202, 0)!;
      const fwd = start.players[0].hand.find((c) => c.ownerUnitId === 1202)!;
      let match = play(lesson, start, {
        type: "playCard",
        cardId: fwd.instanceId,
        targets: { unitIds: [beta.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
      });
      match = play(lesson, match, { type: "endManeuver" });
      expect(match.board[P2_FRONT][1]).toBeNull(); // Sentinel dead
      expect(unitByDef(match, 1202, 0)?.hp).toBeGreaterThan(0);
      expect(unitByDef(match, 1202, 0)?.barrier).toBe(0); // spent on Retaliate counter
      expect(unitByDef(match, 1201, 0)?.rested).toBe(true);
      expect(unitByDef(match, 1201, 0)?.barrier).toBe(4); // saved for Aggressive
      match = idleToEnd(lesson, match);
      expect(match.winner).toBe(0);
      expect(match.winReason).toBe("elimination");
    }
    // Wrong: Forward Alpha into Aggressive → Barrier burned on weak counter → P2 wins.
    {
      const { lesson, match: start } = startLesson("barrier-timing");
      const alpha = unitByDef(start, 1201, 0)!;
      const fwd = start.players[0].hand.find((c) => c.ownerUnitId === 1201)!;
      let match = play(lesson, start, {
        type: "playCard",
        cardId: fwd.instanceId,
        targets: { unitIds: [alpha.instanceId], cells: [{ col: P1_FRONT, row: 0 }] },
      });
      match = play(lesson, match, { type: "endManeuver" });
      expect(unitByDef(match, 1201, 0)?.barrier).toBe(0);
      expect(match.board[P2_FRONT][0]?.hp).toBeGreaterThan(0); // Raider still up
      match = idleToEnd(lesson, match);
      expect(match.winner).toBe(1);
    }
  });

  it("13 smoke-timing: Forward Aggressive (correct) wins; Forward Retaliate (wrong) loses", () => {
    // Correct: Forward Alpha into Aggressive → light counter procs Smoke → HQ redirect beat → win later.
    {
      const { lesson, match: start } = startLesson("smoke-timing");
      const alpha = unitByDef(start, 1211, 0)!;
      const fwd = start.players[0].hand.find((c) => c.ownerUnitId === 1211)!;
      let match = play(lesson, start, {
        type: "playCard",
        cardId: fwd.instanceId,
        targets: { unitIds: [alpha.instanceId], cells: [{ col: P1_FRONT, row: 0 }] },
      });
      match = play(lesson, match, { type: "endManeuver" });
      expect(unitByDef(match, 1211, 0)?.hp).toBe(8); // HP 10 − ATK 2 counter
      expect(hasStatusOn(match, alpha.instanceId, "smokeDodge")).toBe(true);
      expect(unitByDef(match, 1212, 0)?.rested).toBe(true);
      expect(match.winner).toBeNull();
      // P2 turn: Aggressive redirects into HQ (smoke dodge), board not cleared yet.
      match = play(lesson, match, { type: "endEngagement" });
      match = play(lesson, match, { type: "endDeployment" });
      expect(match.players[0].hqHp).toBeLessThan(start.players[0].hqHp);
      expect(unitByDef(match, 1213, 1)?.hp).toBeGreaterThan(0);
      expect(match.winner).toBeNull();
      match = idleToEnd(lesson, match);
      expect(match.winner).toBe(0);
      expect(match.winReason).toBe("elimination");
    }
    // Wrong: Forward Beta into Retaliate → ATK+Retaliate 10 kills HP 10 before Smoke helps.
    {
      const { lesson, match: start } = startLesson("smoke-timing");
      const beta = unitByDef(start, 1212, 0)!;
      const fwd = start.players[0].hand.find((c) => c.ownerUnitId === 1212)!;
      let match = play(lesson, start, {
        type: "playCard",
        cardId: fwd.instanceId,
        targets: { unitIds: [beta.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
      });
      match = play(lesson, match, { type: "endManeuver" });
      expect(unitByDef(match, 1212, 0)).toBeNull();
      match = idleToEnd(lesson, match);
      expect(match.winner).toBe(1);
    }
  });

  it("14 shock-match: correct Shock pairing wins; wrong lanes lose", () => {
    // Correct: Shock1 chips Smoke→smoke up; Shock2/4 clear Shield/Barrier; finish Veil next turn.
    {
      const { lesson, match: start } = startLesson("shock-match");
      expect(hint(lesson, start)?.id).toMatch(/^intro-kw-/);
      expect(start.phase).toBe("deployment");
      let match = play(lesson, start, { type: "deploy", unitDefId: 1222, row: 0 }); // Shock 1
      match = play(lesson, match, { type: "deploy", unitDefId: 1223, row: 1 }); // Shock 2
      match = play(lesson, match, { type: "deploy", unitDefId: 1221, row: 2 }); // Shock 4
      expect(match.board[P1_FRONT][0]?.defId).toBe(1222);
      expect(match.board[P1_FRONT][1]?.defId).toBe(1223);
      expect(match.board[P1_FRONT][2]?.defId).toBe(1221);
      expect(unitByDef(match, 1222, 0)?.rested).toBe(false);
      match = play(lesson, match, { type: "endDeployment" });
      const veil = unitByDef(match, 1224, 1)!;
      expect(veil.hp).toBe(1);
      expect(hasStatusOn(match, veil.instanceId, "smokeDodge")).toBe(true);
      expect(match.board[P2_FRONT][1]).toBeNull();
      expect(match.board[P2_FRONT][2]).toBeNull();
      expect(match.winner).toBeNull();
      const enemyHq = match.players[1].hqHp;
      // P2: Veil shoots Spark; Spark's counter into smoked Veil redirects to enemy HQ.
      match = play(lesson, match, { type: "endEngagement" });
      match = play(lesson, match, { type: "endDeployment" });
      expect(match.players[1].hqHp).toBe(enemyHq - 1);
      expect(unitByDef(match, 1224, 1)?.hp).toBe(1);
      expect(hasStatusOn(match, veil.instanceId, "smokeDodge")).toBe(true);
      // Smoke expires on pass; T2 Shock1 strips regen Shield and finishes Veil.
      match = play(lesson, match, { type: "endEngagement" });
      match = play(lesson, match, { type: "endDeployment" });
      expect(unitByDef(match, 1224, 1)).toBeNull();
      expect(match.winner).toBe(0);
      expect(match.winReason).toBe("elimination");
    }
    // Wrong: Shock4/Shock1/Shock2 vs Smoke/Shield/Barrier — survivors break HQ.
    {
      const { lesson, match: start } = startLesson("shock-match");
      let match = play(lesson, start, { type: "deploy", unitDefId: 1221, row: 0 }); // Shock 4 on Smoke
      match = play(lesson, match, { type: "deploy", unitDefId: 1222, row: 1 }); // Shock 1 on Shield
      match = play(lesson, match, { type: "deploy", unitDefId: 1223, row: 2 }); // Shock 2 on Barrier
      match = play(lesson, match, { type: "endDeployment" });
      expect(match.board[P2_FRONT][1]?.hp).toBeGreaterThan(0); // Shield lives
      expect(match.board[P2_FRONT][2]?.hp).toBeGreaterThan(0); // Barrier lives
      match = idleToEnd(lesson, match);
      expect(match.winner).toBe(1);
    }
  });

  it("10 support-fire: middle SF2 makes exact HQ lethal", () => {
    const { lesson, match: start } = startLesson("support-fire");
    expect(hint(lesson, start)?.id).toBe("intro-kw-supportFire");
    expect(start.players[1].hqHp).toBe(12);
    // Lane 2 = row 1 — between Assaults on rows 0 and 2.
    let match = play(lesson, start, { type: "deploy", unitDefId: 1092, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(0);
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
  });

  it("10 support-fire: skip SF — 8 damage leaves HQ alive", () => {
    const { lesson, match: start } = startLesson("support-fire");
    const match = play(lesson, start, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(4);
    expect(match.winner).toBeNull();
  });

  it("11 missile: free-play mark then detonate", () => {
    const { lesson, match: start } = startLesson("missile");
    expect(hint(lesson, start)?.id).toBe("intro-kw-missile");
    let match = play(lesson, start, { type: "endDeployment" });
    expect(unitByDef(match, 4, 1)?.hp).toBe(3);
    expect(unitByDef(match, 8, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 2 });
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("17 scout-recon: Blitz Scout into Smoke lane clears both enemies", () => {
    const { lesson, match: start } = startLesson("scout-recon");
    expect(hint(lesson, start)?.id).toBe("intro-kw-camouflage");
    const spotter = unitByDef(start, 1301, 0)!;
    expect(spotter.missileTarget).toEqual({ col: P2_FRONT, row: 0 });
    expect(
      start.statuses.some(
        (s) =>
          s.kind === "suppressionMark" &&
          s.col === spotter.col &&
          s.lane === spotter.row,
      ),
    ).toBe(true);
    const veil = unitByDef(start, 1304, 1)!;
    expect(hasStatusOn(start, veil.instanceId, "smokeDodge")).toBe(true);

    let match = play(lesson, start, { type: "deploy", unitDefId: 1302, row: 1 });
    expect(match.board[P1_FRONT][1]?.defId).toBe(1302);
    expect(unitByDef(match, 1302, 0)?.rested).toBe(false);
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, 1303, 1)).toBeNull();
    expect(unitByDef(match, 1304, 1)).toBeNull();
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("17 scout-recon: skip deploy — Aggressive finishes Spotter / HQ", () => {
    const { lesson, match: start } = startLesson("scout-recon");
    let match = play(lesson, start, { type: "endDeployment" });
    expect(unitByDef(match, 1303, 1)?.hp).toBeGreaterThan(0);
    expect(unitByDef(match, 1304, 1)?.hp).toBeGreaterThan(0);
    match = idleToEnd(lesson, match);
    expect(match.winner).toBe(1);
  });

  it("18 hulldown-slope: Radar/Corrosion → Diversion → Wedge clears the board", () => {
    const { lesson, match: start } = startLesson("hulldown-slope");
    expect(hint(lesson, start)?.id).toBe("intro-kw-hulldown");
    const digA = unitByDef(start, 1315, 1)!;
    const digB = unitByDef(start, 1316, 1)!;
    expect(hasStatusOn(start, digA.instanceId, "hulldownArmor")).toBe(true);
    expect(hasStatusOn(start, digB.instanceId, "hulldownArmor")).toBe(true);
    expect(unitByDef(start, 1311, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 3 });
    expect(unitByDef(start, 1312, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 3 });
    expect(start.players[0].hand.some((c) => c.templateId === "diversion")).toBe(true);
    expect(unitByDef(start, 1317, 1)?.armor).toBe(3);

    // T1 — Acid Eye into Slope: Radar re-aims Dig-A; Corrosion strips Slope; missiles kill Dig-A.
    // Diversion is already in hand, so Deployment → Maneuver; skip the card until Dig-A is dead.
    let match = play(lesson, start, { type: "deploy", unitDefId: 1313, row: 1 });
    expect(unitByDef(match, 1311, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 0 });
    expect(unitByDef(match, 1312, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 0 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1315, 1)).toBeNull();
    expect(unitByDef(match, 1313, 0)).toBeNull();
    expect(unitByDef(match, 1317, 1)?.armor).toBe(0);
    expect(unitByDef(match, 1311, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 0 });

    // P2 open-lanes HQ between turns.
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });

    // T2 — end empty Deployment, then Diversion Dig-B onto the empty lock.
    match = play(lesson, match, { type: "endDeployment" });
    const diversion = match.players[0].hand.find((c) => c.templateId === "diversion")!;
    const digBLive = unitByDef(match, 1316, 1)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: diversion.instanceId,
      targets: { unitIds: [digBLive.instanceId] },
    });
    expect(unitByDef(match, 1316, 1)?.row).toBe(0);
    expect(hasStatusOn(match, digBLive.instanceId, "hulldownArmor")).toBe(false);
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1316, 1)).toBeNull();

    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });

    // T3 — Wedge finishes naked Slope.
    match = play(lesson, match, { type: "deploy", unitDefId: 1314, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, 1317, 1)).toBeNull();
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("12 extra-attack: free-play First Strike + Trap then clear", () => {
    const { lesson, match: start } = startLesson("extra-attack");
    expect(start.phase).toBe("maneuver");
    expect(hint(lesson, start)).toBeNull();
    const first = start.players[0].hand.find((c) => c.templateId === "first_strike")!;
    let match = play(lesson, start, { type: "playCard", cardId: first.instanceId, targets: {} });
    expect(unitByDef(match, 17, 1)?.hp).toBe(5);

    const trap = match.players[0].hand.find((c) => c.templateId === "trap")!;
    const horus = unitByDef(match, 22, 1)!;
    match = play(lesson, match, { type: "playCard", cardId: trap.instanceId, targets: { unitIds: [horus.instanceId] } });
    expect(unitByDef(match, 22, 1)).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.winner).toBe(0);
  });

  it("13 artillery: free-play deploy, rest, then safe barrage", () => {
    const { lesson, match: start } = startLesson("artillery");
    expect(hint(lesson, start)?.id).toBe("intro-kw-artillery");
    let match = play(lesson, start, { type: "deploy", unitDefId: 11, row: 2 });
    expect(match.board[P1_SUPPORT][2]?.rested).toBe(true);
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.hp).toBe(6);
    expect(unitByDef(match, 11, 0)?.hp).toBe(6);
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(0);
    expect(unitByDef(match, 11, 0)?.hp).toBe(6);
  });

  it("14 jet-plane: free-play deploy, rest, then trade to a win", () => {
    const { lesson, match: start } = startLesson("jet-plane");
    expect(hint(lesson, start)?.id).toBe("intro-kw-jetPlane");
    let match = play(lesson, start, { type: "deploy", unitDefId: 25, row: 2 });
    expect(match.board[P1_SUPPORT][2]?.rested).toBe(true);
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.hp).toBe(6);
    match = play(lesson, match, { type: "endEngagement" });
    for (let i = 0; i < 4 && match.winner == null; i++) {
      if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    }
    expect(match.winner).toBe(0);
  });

  function runOpponent(lesson: (typeof LESSONS)[number], match: MatchState): MatchState {
    for (let i = 0; i < 10 && match.currentPlayer === 1 && match.winner == null; i++) {
      if (match.phase === "engagement") {
        match = play(lesson, match, { type: "endEngagement" });
        continue;
      }
      const action = lesson.scriptedAction?.(match);
      if (!action) break;
      match = play(lesson, match, action);
    }
    return match;
  }

  it("17 fire: ignite Fire 3 then refresh with Fire 1 to break HQ", () => {
    const { lesson, match: start } = startLesson("fire");
    expect(hint(lesson, start)?.id).toBe("intro-kw-fire");
    expect(start.players[1].hqHp).toBe(17);
    expect(start.players[1].hand.filter((c) => c.templateId === "sniping")).toHaveLength(2);
    // T1: Incendiary open-lanes HQ and applies Fire 3.
    let match = play(lesson, start, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(16);
    expect(unitByDef(match, 1101, 0)?.hp).toBe(2);
    const fire = match.statuses.find((s) => s.kind === "fireDot" && s.targetHq === 1);
    expect(fire?.magnitude).toBe(3);
    expect(fire?.remainingPasses).toBe(3);
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.players[1].hqHp).toBe(13);
    // T2: enemy Sniping (2 dmg) deletes Incendiary; Fire ticks.
    match = runOpponent(lesson, match);
    expect(unitByDef(match, 1101, 0)).toBeNull();
    expect(match.players[1].hqHp).toBe(10);
    // T3: Ember into a different open lane — Fire 1 refreshes, keeps magnitude 3.
    match = play(lesson, match, { type: "deploy", unitDefId: 1102, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(9);
    const refreshed = match.statuses.find((s) => s.kind === "fireDot" && s.targetHq === 1)!;
    expect(refreshed.magnitude).toBe(3);
    expect(refreshed.remainingPasses).toBe(3);
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.players[1].hqHp).toBe(6);
    // T4: enemy Sniping deletes Ember; Fire ticks to rem 1.
    match = runOpponent(lesson, match);
    expect(unitByDef(match, 1102, 0)).toBeNull();
    expect(match.players[1].hqHp).toBe(3);
    // T5: no gun left — final Fire tick finishes HQ at 17.
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.players[1].hqHp).toBe(0);
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
  });

  it("17 fire: skip refresh — Fire expires and HQ survives past turn 5", () => {
    const { lesson, match: start } = startLesson("fire");
    let match = play(lesson, start, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match); // Sniping deletes Incendiary
    // T3: no Ember/Cinder — third Fire tick, then DoT expires (10 damage total).
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.players[1].hqHp).toBe(7);
    expect(match.statuses.find((s) => s.kind === "fireDot" && s.targetHq === 1)).toBeUndefined();
    // T4–T5: no further burn.
    match = runOpponent(lesson, match);
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[1].hqHp).toBe(7);
    expect(match.winner).toBeNull();
  });

  it("26 veteran-first-strike: farm → Barrier → Rally finale clears board", () => {
    const { lesson, match: start } = startLesson("veteran-first-strike");
    expect(hint(lesson, start)?.id).toBe("intro-kw-veteran");
    expect(start.players[0].hqHp).toBe(11);
    expect(unitByDef(start, 1324, 1)?.hp).toBe(9);
    expect(unitByDef(start, 1325, 1)?.atk).toBe(5);
    expect(start.players[1].undeployed.includes(1326)).toBe(true);
    expect(start.players[0].undeployed).toEqual([1321, 1322, 1323]);
    expect(start.players[0].commandPoints).toBe(4);

    // T1 — Vanguard (3) + Forward (1) into Grunt.
    let match = play(lesson, start, { type: "deploy", unitDefId: 1321, row: 0 });
    expect(match.players[0].commandPoints).toBe(1);
    match = play(lesson, match, { type: "endDeployment" });
    const forward = match.players[0].hand.find((c) => c.templateId === "forward")!;
    const vanguard = unitByDef(match, 1321, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: forward.instanceId,
      targets: { unitIds: [vanguard.instanceId], cells: [{ col: P1_FRONT, row: 0 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1321, 0)?.atk).toBe(4);
    expect(unitByDef(match, 1321, 0)?.ap).toBe(2);
    expect(unitByDef(match, 1324, 1)?.hp).toBe(8);
    match = play(lesson, match, { type: "endEngagement" });

    // T2 — Ambush drops; Cover blocked; Pillar chips HQ. runOpponent ends engagement.
    match = runOpponent(lesson, match);
    const ambush = unitByDef(match, 1326, 1)!;
    expect(ambush.row).toBe(2);
    expect(ambush.col).toBe(P2_FRONT);
    expect(ambush.keywords.some((k) => k.name === "firstStrike")).toBe(true);
    expect(match.players[0].hqHp).toBe(6);
    expect(unitByDef(match, 1321, 0)?.hp).toBe(9);
    expect(unitByDef(match, 1324, 1)?.hp).toBe(4);

    // T3 — Aegis Barrier answers Ambush; Vanguard finishes Grunt.
    match = play(lesson, match, { type: "deploy", unitDefId: 1322, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1326, 1)?.keywords.some((k) => k.name === "firstStrike")).toBe(false);
    expect(unitByDef(match, 1322, 0)?.barrier).toBe(0);
    expect(unitByDef(match, 1322, 0)?.hp).toBe(8);
    expect(unitByDef(match, 1324, 1)).toBeNull();
    expect(unitByDef(match, 1321, 0)?.atk).toBe(6);
    expect(unitByDef(match, 1321, 0)?.ap).toBe(4);
    expect(unitByDef(match, 1321, 0)?.hp).toBe(8);
    match = play(lesson, match, { type: "endEngagement" });

    // T4 — Rally + First Strike card delete Aegis; Pillar HQ again.
    match = runOpponent(lesson, match);
    expect(unitByDef(match, 1322, 0)).toBeNull();
    expect(match.players[0].hqHp).toBe(1);

    // T5 — Supply + Rally Striker + Down Vanguard onto Pillar.
    expect(match.players[0].commandPoints).toBe(5);
    match = play(lesson, match, { type: "deploy", unitDefId: 1323, row: 2 });
    expect(match.players[0].commandPoints).toBe(1);
    match = play(lesson, match, { type: "endDeployment" });
    const supply = match.players[0].hand.find((c) => c.templateId === "supply")!;
    match = play(lesson, match, { type: "playCard", cardId: supply.instanceId, targets: {} });
    expect(match.players[0].commandPoints).toBe(3);
    const rally = match.players[0].hand.find((c) => c.templateId === "rally")!;
    const striker = unitByDef(match, 1323, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: rally.instanceId,
      targets: { unitIds: [striker.instanceId] },
    });
    const down = match.players[0].hand.find((c) => c.templateId === "down")!;
    const vet = unitByDef(match, 1321, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: down.instanceId,
      targets: { unitIds: [vet.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1326, 1)).toBeNull();
    expect(unitByDef(match, 1325, 1)).toBeNull();
    expect(unitByDef(match, 1323, 0)?.hp).toBe(1);
    expect(unitByDef(match, 1321, 0)?.hp).toBe(4);
    expect(match.players[0].hqHp).toBe(1);
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("26 veteran-first-strike: skip Forward — underfarmed Veteran cannot crack Pillar", () => {
    const { lesson, match: start } = startLesson("veteran-first-strike");
    // T1 auto-Advance rests — no Veteran stack.
    let match = play(lesson, start, { type: "deploy", unitDefId: 1321, row: 0 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1321, 0)?.rested).toBe(true);
    expect(unitByDef(match, 1321, 0)?.atk).toBe(2);
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    // T3 Barrier as normal.
    match = play(lesson, match, { type: "deploy", unitDefId: 1322, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1321, 0)?.atk).toBe(4);
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    // T5 finale without enough stacks.
    match = play(lesson, match, { type: "deploy", unitDefId: 1323, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    const supply = match.players[0].hand.find((c) => c.templateId === "supply")!;
    match = play(lesson, match, { type: "playCard", cardId: supply.instanceId, targets: {} });
    const rally = match.players[0].hand.find((c) => c.templateId === "rally")!;
    const striker = unitByDef(match, 1323, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: rally.instanceId,
      targets: { unitIds: [striker.instanceId] },
    });
    const down = match.players[0].hand.find((c) => c.templateId === "down")!;
    const vet = unitByDef(match, 1321, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: down.instanceId,
      targets: { unitIds: [vet.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1325, 1)?.hp).toBeGreaterThan(0);
    expect(match.winner).toBeNull();
  });

  it("17 playstyle-aggro: free-play Rally races HQ to 0", () => {
    const { lesson, match: start } = startLesson("playstyle-aggro");
    expect(start.players[1].hqHp).toBe(17);
    expect(start.players[0].hqHp).toBe(8);
    const rally = start.players[0].hand.find((c) => c.templateId === "rally")!;
    const komet = unitByDef(start, 27, 0)!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: rally.instanceId,
      targets: { unitIds: [komet.instanceId] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBe(0);
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("hq");
  });

  it("17 playstyle-aggro: skip Rally — shortfall then enemy HQ shots finish you", () => {
    const { lesson, match: start } = startLesson("playstyle-aggro");
    let match = play(lesson, start, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBe(3);
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("18 playstyle-missile-arty: free-play Heatseeking then eliminate", () => {
    const { lesson, match: start } = startLesson("playstyle-missile-arty");
    expect(start.phase).toBe("maneuver");
    expect(unitByDef(start, 10, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 0 });
    expect(hint(lesson, start)).toBeNull();
    const card = start.players[0].hand.find((c) => c.templateId === "heatseeking")!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: card.instanceId,
      targets: { cells: [{ col: P2_FRONT, row: 2 }] },
    });
    expect(unitByDef(match, 10, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 2 });
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.winner).toBe(0);
    expect(match.winReason).toBe("elimination");
  });

  it("19 playstyle-tank-robot: free-play Quick Engagement then clear", () => {
    const { lesson, match: start } = startLesson("playstyle-tank-robot");
    expect(start.phase).toBe("maneuver");
    expect(hint(lesson, start)).toBeNull();
    const qe = start.players[0].hand.find((c) => c.templateId === "quick_engagement")!;
    const fenrir = unitByDef(start, 2, 0)!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: qe.instanceId,
      targets: { unitIds: [fenrir.instanceId] },
    });
    expect(match.phase).toBe("engagement");
    // First Aggressive shot only — Sarama needs the regular volley too (HP 14).
    expect(match.board[P2_FRONT][2]?.hp).toBe(7);
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(match.board[P2_FRONT][0]).toBeNull();
    expect(match.winner).toBe(0);
  });

  it("hub numbers stay in sync with curriculum order", () => {
    const hubIds = TUTORIAL_HUB.flatMap((s) =>
      s.cards.filter((c) => !c.cta && !c.placeholder).map((c) => c.id),
    );
    expect(hubIds).toEqual(tutorialOrder());
    expect(tutorialOrder()).toEqual([
      "basic",
      "victory",
      "resources",
      "movement-forward",
      "movement-updown",
      "armor",
      "comeback",
      BUILD_GUIDE_ID,
      "cover-flank",
      "aggressive",
      "barrier-timing",
      "veteran-first-strike",
      "smoke-timing",
      "shock-match",
      "support-fire",
      "missile",
      "scout-recon",
      "hulldown-slope",
      "extra-attack",
      "fire",
      "artillery",
      "jet-plane",
      "playstyle-aggro",
      "playstyle-missile-arty",
      "playstyle-tank-robot",
    ]);
    expect(LESSONS.map((l) => l.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 26, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    ]);
    const hubNumbers = TUTORIAL_HUB.flatMap((s) =>
      s.cards.filter((c) => !c.cta).map((c) => c.number),
    );
    expect(hubNumbers).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 26, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    ]);
    const basic = TUTORIAL_HUB.find((s) => s.id === "basic");
    expect(basic?.cards.map((c) => c.id)).toEqual([
      "basic",
      "victory",
      "resources",
      "movement-forward",
      "movement-updown",
      "armor",
      "comeback",
      "build-army",
      "basic-complete",
    ]);
    expect(TUTORIAL_HUB.find((s) => s.id === "comeback")).toBeUndefined();
    expect(TUTORIAL_HUB.find((s) => s.id === "keywords")?.cards.map((c) => c.id)).toEqual([
      "cover-flank",
      "aggressive",
      "barrier-timing",
      "veteran-first-strike",
      "smoke-timing",
      "shock-match",
      "support-fire",
      "missile",
      "scout-recon",
      "hulldown-slope",
      "extra-attack",
      "fire",
    ]);
    const ready = basic?.cards.at(-1);
    expect(ready).toMatchObject({
      id: "basic-complete",
      number: 9,
      title: "You are ready for battle",
      cta: true,
    });
  });

  it("build guide walks the army builder with highlights", () => {
    expect(nextTutorialId("comeback")).toBe(BUILD_GUIDE_ID);
    expect(nextTutorialId(BUILD_GUIDE_ID)).toBe("cover-flank");
    expect(nextTutorialId("aggressive")).toBe("barrier-timing");
    expect(nextTutorialId("barrier-timing")).toBe("veteran-first-strike");
    expect(nextTutorialId("veteran-first-strike")).toBe("smoke-timing");
    expect(nextTutorialId("smoke-timing")).toBe("shock-match");
    expect(nextTutorialId("shock-match")).toBe("support-fire");
    expect(nextTutorialId("missile")).toBe("scout-recon");
    expect(nextTutorialId("scout-recon")).toBe("hulldown-slope");
    expect(nextTutorialId("hulldown-slope")).toBe("extra-attack");
    expect(nextTutorialId("jet-plane")).toBe("playstyle-aggro");
    expect(nextTutorialId("playstyle-aggro")).toBe("playstyle-missile-arty");
    expect(nextTutorialId("playstyle-missile-arty")).toBe("playstyle-tank-robot");
    expect(nextTutorialId("playstyle-tank-robot")).toBeNull();
    expect(nextTutorialId("basic")).toBe("victory");
    expect(nextTutorialId("victory")).toBe("resources");
    expect(nextTutorialId("basic", new Set(["basic", "victory", "resources"]))).toBe("movement-forward");
    expect(nextTutorialId("movement-forward")).toBe("movement-updown");
    expect(nextTutorialId("movement-updown")).toBe("armor");
    expect(firstIncompleteTutorialId(new Set(["basic", BUILD_GUIDE_ID]))).toBe("victory");
    expect(firstIncompleteTutorialId(new Set(tutorialOrder()))).toBeNull();
    expect(BUILD_GUIDE_STEPS.map((s) => s.anchor)).toEqual([
      "builder-catalog",
      "builder-unit",
      "builder-cards",
      "builder-premade",
      "builder-deck",
      "builder-start",
    ]);
    expect(BUILD_GUIDE_STEPS.every((s) => s.next && s.body.length > 20)).toBe(true);
    expect(BUILD_GUIDE_STEPS.at(-1)?.nextLabel).toBe("Finish");
  });
});
