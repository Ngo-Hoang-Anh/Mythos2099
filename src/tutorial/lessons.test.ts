import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { P1_FRONT, P1_SUPPORT, P2_FRONT } from "../engine/types";
import { TUTORIAL_CADET, TUTORIAL_DUMMY, TUTORIAL_RECRUIT } from "../data/tutorialUnits";
import { createSandboxMatch, spawnUnit, unitByDef } from "../engine/sandbox";
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
  RETURN_FIRE,
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
  it("has seventeen sandbox lessons plus a build walkthrough", () => {
    expect(LESSONS).toHaveLength(17);
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
      "support-fire",
      "missile",
      "extra-attack",
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
      { id: "support-fire", stats: [], kws: ["supportFire"] },
      { id: "missile", stats: ["ap", "armor"], kws: ["missile"] },
      { id: "extra-attack", stats: ["atk"], kws: [] },
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

  it("8 return-fire draft still plays (hub placeholder until rewrite)", () => {
    const lesson = RETURN_FIRE;
    const start = lesson.setup();
    expect(start.board[P1_FRONT][0]?.rested).toBe(true);
    expect(hint(lesson, start)).toBeNull();
    let match = play(lesson, start, { type: "endDeployment" });
    // Rest lane: Cadet did not shoot / take return. Arty shot clean. Jet traded.
    expect(match.board[P1_FRONT][0]?.hp).toBe(6);
    expect(match.board[P1_SUPPORT][2]?.hp).toBe(6);
    for (let i = 0; i < 6 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      if (match.winner != null) break;
      if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
    }
    expect(match.winner).toBe(0);
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

  it("hub numbers are 01–19 with Return fire as a Basics placeholder", () => {
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
      "support-fire",
      "missile",
      "extra-attack",
      "artillery",
      "jet-plane",
      "playstyle-aggro",
      "playstyle-missile-arty",
      "playstyle-tank-robot",
    ]);
    expect(LESSONS.map((l) => l.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    ]);
    const hubNumbers = TUTORIAL_HUB.flatMap((s) =>
      s.cards.filter((c) => !c.cta).map((c) => c.number),
    );
    expect(hubNumbers).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
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
      "return-fire",
      "build-army",
      "basic-complete",
    ]);
    expect(basic?.cards.find((c) => c.id === "return-fire")?.placeholder).toBe(true);
    expect(TUTORIAL_HUB.find((s) => s.id === "comeback")).toBeUndefined();
    expect(TUTORIAL_HUB.find((s) => s.id === "keywords")?.cards.map((c) => c.id)).toEqual([
      "cover-flank",
      "aggressive",
      "support-fire",
      "missile",
      "extra-attack",
    ]);
    const ready = basic?.cards.at(-1);
    expect(ready).toMatchObject({
      id: "basic-complete",
      number: 10,
      title: "You are ready for battle",
      cta: true,
    });
  });

  it("build guide walks the army builder with highlights", () => {
    expect(nextTutorialId("comeback")).toBe(BUILD_GUIDE_ID);
    expect(nextTutorialId(BUILD_GUIDE_ID)).toBe("cover-flank");
    expect(nextTutorialId("aggressive")).toBe("support-fire");
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
