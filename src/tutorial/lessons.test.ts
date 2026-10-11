import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BASE_SUPPLY, DRAW_PER_TURN, HQ_MAX_HP, P1_FRONT, P1_SUPPORT, P2_FRONT, P2_SUPPORT } from "../engine/types";
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
import { LESSONS, TUTORIAL_HUB, pickLessonHint, type TutorialHud } from "./lessons";
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

function playP2Opening(lesson: (typeof LESSONS)[number], match: MatchState): MatchState {
  match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_DUMMY, row: 0 });
  expect(match.board[P2_SUPPORT][0]?.defId).toBe(TUTORIAL_DUMMY);
  match = play(lesson, match, { type: "endDeployment" });
  expect(match.phase).toBe("engagement");
  expect(match.board[P2_FRONT][0]?.defId).toBe(TUTORIAL_DUMMY);
  match = play(lesson, match, { type: "endEngagement" });
  expect(match.currentPlayer).toBe(0);
  expect(match.phase).toBe("deployment");
  expect(match.players[0].commandPoints).toBe(BASE_SUPPLY + 1);
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
  it("has sixteen sandbox lessons plus a build walkthrough", () => {
    expect(LESSONS).toHaveLength(16);
    expect(LESSONS.map((l) => l.id)).toEqual([
      "basic",
      "resources",
      "armor",
      "maneuver",
      "comeback",
      "cover-flank",
      "aggressive",
      "support-fire",
      "missile",
      "extra-attack",
      "artillery",
      "jet-plane",
      "return-fire",
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
      { id: "resources", stats: ["supply"], kws: [] },
      { id: "armor", stats: ["armor", "ap"], kws: [] },
      { id: "maneuver", stats: [], kws: [] },
      { id: "comeback", stats: ["supply"], kws: [] },
      { id: "cover-flank", stats: [], kws: ["flank", "cover"] },
      { id: "aggressive", stats: [], kws: ["aggressive", "retaliate"] },
      { id: "support-fire", stats: [], kws: ["supportFire"] },
      { id: "missile", stats: ["ap", "armor"], kws: ["missile"] },
      { id: "extra-attack", stats: ["atk"], kws: [] },
      { id: "artillery", stats: [], kws: ["artillery"] },
      { id: "jet-plane", stats: [], kws: ["jetPlane"] },
      { id: "return-fire", stats: [], kws: ["artillery", "jetPlane"] },
      { id: "playstyle-aggro", stats: ["hp", "supply"], kws: ["blitz", "flank"] },
      { id: "playstyle-missile-arty", stats: ["armor"], kws: ["cover", "artillery", "missile"] },
      { id: "playstyle-tank-robot", stats: ["atk", "hp"], kws: ["aggressive"] },
    ]);
  });

  it("1 basic: three rounds of exchange, 0 HP still returns damage", () => {
    const { lesson, match: start } = startLesson("basic");
    expect(start.players[0].commandPoints).toBe(4);
    const blocked = applyLessonAction(lesson, start, { type: "deploy", unitDefId: 101, row: 0 });
    expect(blocked.ok).toBe(false);
    let match = play(lesson, start, { type: "deploy", unitDefId: 101, row: 2 });
    expect(match.players[0].commandPoints).toBe(1);
    expect(match.board[P1_FRONT][2]?.defId).toBe(101);
    expect(match.board[P1_FRONT][2]?.keywords).toEqual([]);
    expect(match.board[P2_FRONT][2]?.hp).toBe(8);

    match = play(lesson, match, { type: "endDeployment" });
    expect(match.phase).toBe("engagement");
    expect(match.board[P2_FRONT][2]?.hp).toBe(5);
    expect(match.board[P1_FRONT][2]?.hp).toBe(6);
    expect(lesson.steps.every((s) => s.done(match))).toBe(false);

    match = play(lesson, match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(0);
    expect(match.phase).toBe("deployment");

    match = play(lesson, match, { type: "endDeployment" });
    expect(match.board[P2_FRONT][2]?.hp).toBe(2);
    expect(match.board[P1_FRONT][2]?.hp).toBe(4);

    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(match.board[P1_FRONT][2]?.hp).toBe(2);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("1 basic: popups point at Supply, then HP and ATK chips", () => {
    const { lesson, match } = startLesson("basic");
    const hud = HUD;
    expect(pickLessonHint(lesson, match, hud, new Set())?.anchor).toBe("supply");
    expect(pickLessonHint(lesson, match, hud, new Set(["supply"]))?.anchor).toBe("reserve");
    expect(pickLessonHint(lesson, match, { reserveOpen: true, pendingDeploy: null }, new Set(["supply"]))?.anchor).toBe(
      "reserve-unit-101",
    );
    expect(
      pickLessonHint(lesson, match, { reserveOpen: false, pendingDeploy: 101 }, new Set(["supply"]))?.anchor,
    ).toBe("cell-0-2");
    const after = play(lesson, match, { type: "deploy", unitDefId: 101, row: 2 });
    expect(pickLessonHint(lesson, after, hud, new Set(["supply"]))?.anchor).toBe("hp-101");
    expect(pickLessonHint(lesson, after, hud, new Set(["supply", "hp"]))?.anchor).toBe("atk-101");
    expect(pickLessonHint(lesson, after, hud, new Set(["supply", "hp", "atk"]))?.anchor).toBe("hp-103");
    expect(pickLessonHint(lesson, after, hud, new Set(["supply", "hp", "atk", "dummy-hp"]))?.anchor).toBe("hp-103");
    expect(pickLessonHint(lesson, after, hud, new Set(["supply", "hp", "atk", "dummy-hp", "predict-1"]))?.anchor).toBe(
      "hourglass",
    );
    const fighting = play(lesson, after, { type: "endDeployment" });
    expect(fighting.combatPlayback).toBeTruthy();
    expect(pickLessonHint(lesson, fighting, hud, new Set(["supply", "hp", "atk", "dummy-hp", "predict-1"]))).toBeNull();
    const afterR1 = play(lesson, fighting, { type: "endEngagement" });
    expect(pickLessonHint(lesson, afterR1, hud, new Set(["supply", "hp", "atk", "dummy-hp", "predict-1"]))?.anchor).toBe(
      "hp-103",
    );
    expect(
      pickLessonHint(lesson, afterR1, hud, new Set(["supply", "hp", "atk", "dummy-hp", "predict-1", "predict-2"]))?.anchor,
    ).toBe("hourglass");
    expect(hint(lesson, after, ["supply", "hp"], { animating: true })).toBeNull();
  });

  it("2 resources: opponent first, spend leftover Supply, special, then HQ shot ends the lesson", () => {
    const { lesson, match: start } = startLesson("resources");
    expect(start.currentPlayer).toBe(1);
    expect(start.players[0].commandPoints).toBe(0);
    expect(start.players[0].hand).toHaveLength(6);
    expect(start.players[0].hand[0].templateId).toBe("initiative");
    expect(start.players[0].deck).toHaveLength(4);
    expect(start.players[0].undeployed).toEqual([TUTORIAL_CADET, TUTORIAL_RECRUIT]);
    expect(start.players[1].hqHp).toBe(HQ_MAX_HP);
    expect(applyLessonAction(lesson, start, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 }).ok).toBe(false);

    let match = playP2Opening(lesson, start);
    expect(applyLessonAction(lesson, match, { type: "endDeployment" }).ok).toBe(false);

    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 });
    expect(match.players[0].commandPoints).toBe(2);
    expect(match.board[P1_SUPPORT][2]?.defId).toBe(TUTORIAL_CADET);
    expect(match.board[P1_FRONT][2]).toBeNull();
    expect(applyLessonAction(lesson, match, { type: "endDeployment" }).ok).toBe(false);

    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_RECRUIT, row: 0 });
    expect(match.players[0].commandPoints).toBe(0);
    expect(match.board[P1_SUPPORT][0]?.defId).toBe(TUTORIAL_RECRUIT);

    match = play(lesson, match, { type: "endDeployment" });
    expect(match.phase).toBe("maneuver");
    expect(applyLessonAction(lesson, match, { type: "endManeuver" }).ok).toBe(false);

    const cadet = unitByDef(match, TUTORIAL_CADET, 0)!;
    const sealed = match.players[0].hand.find((card) => card.templateId === "initiative")!;
    expect(
      applyLessonAction(lesson, match, { type: "playCard", cardId: sealed.instanceId, targets: { choice: "supply" } }).ok,
    ).toBe(false);
    match = play(lesson, match, {
      type: "playCard",
      cardId: sealed.instanceId,
      targets: { choice: "move", unitIds: [cadet.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(match.board[P1_FRONT][2]?.defId).toBe(TUTORIAL_CADET);
    expect(match.board[P1_FRONT][2]?.rested).toBe(false);
    expect(match.board[P1_SUPPORT][2]).toBeNull();

    const redraw = match.players[0].hand[0];
    match = play(lesson, match, { type: "discardRedraw", cardId: redraw.instanceId });
    expect(match.players[0].discardRedrawsUsed).toBe(1);
    expect(match.players[0].hand).toHaveLength(5);

    match = play(lesson, match, { type: "endManeuver" });
    expect(match.phase).toBe("engagement");
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP - 3);
    expect(match.players[0].hqHp).toBe(HQ_MAX_HP);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);

    match = play(lesson, match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(0);
    expect(match.combatPlayback).toBeNull();
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("2 resources: popups point at going second, summon, then the special", () => {
    const { lesson, match: start } = startLesson("resources");
    expect(hint(lesson, start)?.anchor).toBe("phase");
    expect(hint(lesson, start, ["p2-first"])).toBeNull();

    const ready = playP2Opening(lesson, start);
    expect(hint(lesson, ready)?.anchor).toBe("hq-1");
    expect(hint(lesson, ready, ["hq"])?.anchor).toBe("reserve");
    expect(hint(lesson, ready, ["hq"], { reserveOpen: true })?.anchor).toBe("reserve-unit-101");
    expect(hint(lesson, ready, ["hq"], { pendingDeploy: TUTORIAL_CADET })?.anchor).toBe("cell-0-2");

    const afterCadet = play(lesson, ready, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 });
    expect(hint(lesson, afterCadet, ["hq"])?.anchor).toBe("reserve");
    expect(hint(lesson, afterCadet, ["hq"], { reserveOpen: true })?.anchor).toBe("reserve-unit-102");
    expect(hint(lesson, afterCadet, ["hq"], { pendingDeploy: TUTORIAL_RECRUIT })?.anchor).toBe("cell-0-0");

    const afterRecruit = play(lesson, afterCadet, { type: "deploy", unitDefId: TUTORIAL_RECRUIT, row: 0 });
    expect(hint(lesson, afterRecruit, ["hq"])?.anchor).toBe("hourglass");

    const maneuver = play(lesson, afterRecruit, { type: "endDeployment" });
    expect(hint(lesson, maneuver, ["hq"])?.anchor).toBe("card-initiative");
    expect(hint(lesson, maneuver, ["hq", "sealed"])?.anchor).toBe("card-initiative");
    expect(hint(lesson, maneuver, ["hq", "sealed"], { initiativeOpen: true })?.anchor).toBe("initiative-forward");
    expect(hint(lesson, maneuver, ["hq", "sealed"], { targetingTemplateId: "initiative" })?.anchor).toBe(
      "unit-101",
    );
    expect(
      hint(lesson, maneuver, ["hq", "sealed"], {
        targetingTemplateId: "initiative",
        targetingPickedUnits: 1,
      })?.anchor,
    ).toBe("cell-1-2");

    const cadet = unitByDef(maneuver, TUTORIAL_CADET, 0)!;
    const sealed = maneuver.players[0].hand.find((card) => card.templateId === "initiative")!;
    const moved = play(lesson, maneuver, {
      type: "playCard",
      cardId: sealed.instanceId,
      targets: { choice: "move", unitIds: [cadet.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(hint(lesson, moved, ["hq", "sealed"])?.anchor).toBe("hand");
    expect(hint(lesson, moved, ["hq", "sealed", "hand"])?.anchor).toBe("deck");

    const redrawn = play(lesson, moved, {
      type: "discardRedraw",
      cardId: moved.players[0].hand[0].instanceId,
    });
    expect(hint(lesson, redrawn, ["hq", "sealed", "hand"])?.anchor).toBe("hq-1");
    expect(hint(lesson, redrawn, ["hq", "sealed", "hand", "predict"])?.anchor).toBe("hourglass");

    const fighting = play(lesson, redrawn, { type: "endManeuver" });
    expect(fighting.players[1].hqHp).toBe(HQ_MAX_HP - 3);
    expect(lesson.steps.every((s) => s.done(fighting))).toBe(true);
  });

  it("3 armor: Exosuit AP 8 deals 2 through Bastion 8 armor", () => {
    const { lesson, match: start } = startLesson("armor");
    const match = play(lesson, start, { type: "endDeployment" });
    expect(match.board[P2_FRONT][2]?.hp).toBe(8);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("3 armor: popups point at Armor then AP chips", () => {
    const { lesson, match } = startLesson("armor");
    const hud = { reserveOpen: false, pendingDeploy: null };
    expect(pickLessonHint(lesson, match, hud, new Set())?.anchor).toBe("armor-3");
    expect(pickLessonHint(lesson, match, hud, new Set(["armor"]))?.anchor).toBe("ap-16");
    expect(pickLessonHint(lesson, match, hud, new Set(["armor", "ap"]))?.anchor).toBe("hp-3");
    expect(pickLessonHint(lesson, match, hud, new Set(["armor", "ap", "predict"]))?.anchor).toBe("hourglass");
    const fighting = play(lesson, match, { type: "endDeployment" });
    expect(pickLessonHint(lesson, fighting, hud, new Set(["armor", "ap", "predict"]))).toBeNull();
  });

  it("4 maneuver: Forward then fight, cannot skip to rest", () => {
    const { lesson, match: start } = startLesson("maneuver");
    expect(start.phase).toBe("maneuver");
    const skip = applyLessonAction(lesson, start, { type: "endManeuver" });
    expect(skip.ok).toBe(false);
    const ironclad = unitByDef(start, 15, 0)!;
    const card = start.players[0].hand[0];
    let match = play(lesson, start, {
      type: "playCard",
      cardId: card.instanceId,
      targets: { unitIds: [ironclad.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(unitByDef(match, 15, 0)?.col).toBe(P1_FRONT);
    expect(unitByDef(match, 15, 0)?.rested).toBe(false);
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.phase).toBe("engagement");
    expect(match.board[P2_FRONT][2]?.hp).toBeLessThan(12);
  });

  it("4 maneuver: popups point at Support, Forward card, then targets", () => {
    const { lesson, match: start } = startLesson("maneuver");
    expect(hint(lesson, start)?.anchor).toBe("unit-15");
    expect(hint(lesson, start, ["support-pos"])?.anchor).toBe("cell-1-2");
    expect(hint(lesson, start, ["support-pos", "dest-preview"])?.anchor).toBe("card-forward");
    expect(
      hint(lesson, start, ["support-pos", "dest-preview"], { targetingTemplateId: "forward", targetingPickedUnits: 0 })
        ?.anchor,
    ).toBe("unit-15");
    expect(
      hint(lesson, start, ["support-pos", "dest-preview"], { targetingTemplateId: "forward", targetingPickedUnits: 1 })
        ?.anchor,
    ).toBe("cell-1-2");
    const ironclad = unitByDef(start, 15, 0)!;
    const card = start.players[0].hand[0];
    const moved = play(lesson, start, {
      type: "playCard",
      cardId: card.instanceId,
      targets: { unitIds: [ironclad.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    expect(hint(lesson, moved)?.anchor).toBe("hp-4");
    expect(hint(lesson, moved, ["predict"])?.anchor).toBe("hourglass");
    const fighting = play(lesson, moved, { type: "endManeuver" });
    expect(hint(lesson, fighting)).toBeNull();
  });

  it("5 comeback: real raid banks bonuses, then two Cadets spend them", () => {
    const { lesson, match: start } = startLesson("comeback");
    expect(start.players[0].hqHp).toBe(41);
    expect(start.players[1].hqHp).toBe(HQ_MAX_HP);
    expect(start.players[0].nextTurnSupplyBonus).toBe(0);
    expect(start.players[0].undeployed).toEqual([TUTORIAL_CADET, TUTORIAL_CADET]);
    expect(start.players[1].undeployed).toEqual([]);
    expect(start.board[P2_FRONT].filter(Boolean)).toHaveLength(3);
    expect(start.board[P2_FRONT][0]?.hp).toBe(2);
    expect(start.board[P2_FRONT][2]?.hp).toBe(2);
    expect(start.board[P2_FRONT][3]?.hp).toBe(2);
    expect(hint(lesson, start)?.anchor).toBe("hq-0");
    expect(hint(lesson, start, ["marks"])?.anchor).toBe("unit-103");
    expect(hint(lesson, start, ["marks", "enemies"])?.anchor).toBe(`unit-${TUTORIAL_CADET}`);
    expect(hint(lesson, start, ["marks", "enemies", "unit-rule"])?.anchor).toBe("hq-0");
    expect(hint(lesson, start, ["marks", "enemies", "unit-rule", "predict"])?.anchor).toBe("hourglass");

    let match = play(lesson, start, { type: "endDeployment" });
    expect(match.phase).toBe("engagement");
    // Open-lane ATK 2+2 from HQ 41 → 37 crosses the first mark; mid Dummy dies to Cadet return fire.
    expect(match.players[0].hqHp).toBe(37);
    expect(match.players[0].triggeredBreakpoints).toContain(40);
    expect(unitByDef(match, TUTORIAL_CADET, 0)).toBeNull();
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(match.board[P2_FRONT][0]?.defId).toBe(TUTORIAL_DUMMY);
    expect(match.board[P2_FRONT][3]?.defId).toBe(TUTORIAL_DUMMY);
    expect(match.players[0].nextTurnSupplyBonus).toBeGreaterThanOrEqual(2);
    expect(match.players[0].nextTurnDrawBonus).toBeGreaterThanOrEqual(2);

    match = play(lesson, match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(1);
    expect(match.board[P2_FRONT].filter(Boolean)).toHaveLength(2);

    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(0);
    expect(match.players[0].turnsTaken).toBe(2);
    expect(match.players[0].commandPoints).toBe(BASE_SUPPLY + 2);
    expect(match.players[0].hand.length).toBeGreaterThanOrEqual(DRAW_PER_TURN + 2);

    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 1 });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 3 });
    expect(
      match.board.flat().filter((u) => u?.defId === TUTORIAL_CADET && u.owner === 0),
    ).toHaveLength(2);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("6 cover & flank: Phantom leaves the contested lane, Bastion fills it", () => {
    const { lesson, match: start } = startLesson("cover-flank");
    const match = play(lesson, start, { type: "endDeployment" });
    expect(unitByDef(match, 19, 0)?.row).not.toBe(2);
    const bastion = unitByDef(match, 3, 0)!;
    expect(bastion.col).toBe(P1_FRONT);
    expect(bastion.row).toBe(2);
    expect(bastion.rested).toBe(true);
    expect(unitByDef(match, 22, 1)?.hp).toBe(4);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("6 cover & flank: popups point at Flank, Cover, then enemy", () => {
    const { lesson, match: start } = startLesson("cover-flank");
    expect(hint(lesson, start)?.anchor).toBe("kw-flank-19");
    expect(hint(lesson, start, ["flank"])?.anchor).toBe("cell-1-1");
    expect(hint(lesson, start, ["flank", "flank-dest"])?.anchor).toBe("kw-cover-3");
    expect(hint(lesson, start, ["flank", "flank-dest", "cover"])?.anchor).toBe("unit-3");
    expect(hint(lesson, start, ["flank", "flank-dest", "cover", "cover-dest"])?.anchor).toBe("unit-22");
    expect(hint(lesson, start, ["flank", "flank-dest", "cover", "cover-dest", "enemy"])?.anchor).toBe("hourglass");
    const fighting = play(lesson, start, { type: "endDeployment" });
    expect(hint(lesson, fighting)).toBeNull();
  });

  it("7 aggressive / retaliate: Apex deals 7, Heimdall returns 9", () => {
    const { lesson, match: start } = startLesson("aggressive");
    const match = play(lesson, start, { type: "endDeployment" });
    expect(unitByDef(match, 17, 1)?.hp).toBe(13);
    expect(unitByDef(match, 2, 0)?.hp).toBe(1);
  });

  it("7 aggressive / retaliate: popups point at Aggressive, ATK, Retaliate, Armor", () => {
    const { lesson, match: start } = startLesson("aggressive");
    expect(hint(lesson, start)?.anchor).toBe("kw-aggressive-2");
    expect(hint(lesson, start, ["aggressive"])?.anchor).toBe("atk-2");
    expect(hint(lesson, start, ["aggressive", "apex-atk"])?.anchor).toBe("hp-17");
    expect(hint(lesson, start, ["aggressive", "apex-atk", "predict-agg"])?.anchor).toBe("kw-retaliate-17");
    expect(hint(lesson, start, ["aggressive", "apex-atk", "predict-agg", "retaliate"])?.anchor).toBe("armor-2");
    expect(hint(lesson, start, ["aggressive", "apex-atk", "predict-agg", "retaliate", "apex-armor"])?.anchor).toBe(
      "hp-2",
    );
    expect(
      hint(lesson, start, ["aggressive", "apex-atk", "predict-agg", "retaliate", "apex-armor", "predict-ret"])?.anchor,
    ).toBe("hourglass");
    const fighting = play(lesson, start, { type: "endDeployment" });
    expect(hint(lesson, fighting)).toBeNull();
  });

  it("8 support fire: Jackal 3+4 hits the middle Trench for 7", () => {
    const { lesson, match: start } = startLesson("support-fire");
    const match = play(lesson, start, { type: "endDeployment" });
    expect(match.board[P2_FRONT][2]?.hp).toBe(13);
  });

  it("8 support fire: popups point at both Support Fire icons then Jackal ATK", () => {
    const { lesson, match: start } = startLesson("support-fire");
    expect(hint(lesson, start)?.anchor).toBe("kw-supportFire-5");
    expect(hint(lesson, start, ["sf-nomad"])?.anchor).toBe("kw-supportFire-21");
    expect(hint(lesson, start, ["sf-nomad", "sf-biker"])?.anchor).toBe("atk-4");
    expect(hint(lesson, start, ["sf-nomad", "sf-biker", "jackal-atk"])?.anchor).toBe("cell-2-2");
    expect(hint(lesson, start, ["sf-nomad", "sf-biker", "jackal-atk", "predict"])?.anchor).toBe("hourglass");
    const fighting = play(lesson, start, { type: "endDeployment" });
    expect(hint(lesson, fighting)).toBeNull();
  });

  it("9 missile: first fight marks Sarama, second fight fires for 3", () => {
    const { lesson, match: start } = startLesson("missile");
    let match = play(lesson, start, { type: "endDeployment" });
    expect(unitByDef(match, 4, 1)?.hp).toBe(7);
    expect(unitByDef(match, 8, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 2 });
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.phase).toBe("deployment");
    expect(match.currentPlayer).toBe(0);
    expect(unitByDef(match, 4, 1)?.hp).toBe(7);
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, 4, 1)?.hp).toBe(1);
    expect(lesson.steps.every((step) => step.done(match))).toBe(true);
  });

  it("9 missile: popups explain the mark, then half armor, before the second fight", () => {
    const { lesson, match: start } = startLesson("missile");
    expect(hint(lesson, start)?.anchor).toBe("atk-8");
    expect(hint(lesson, start, ["gun"])?.anchor).toBe("kw-missile-8");
    expect(hint(lesson, start, ["gun", "missile"])?.anchor).toBe("ap-8");
    expect(hint(lesson, start, ["gun", "missile", "ap-no-pen"])?.anchor).toBe("hp-4");
    expect(hint(lesson, start, ["gun", "missile", "ap-no-pen", "predict"])?.anchor).toBe("hourglass");
    const fighting = play(lesson, start, { type: "endDeployment" });
    expect(hint(lesson, fighting)).toBeNull();
    const marked = play(lesson, fighting, { type: "endEngagement" });
    expect(hint(lesson, marked)?.anchor).toBe("hp-4");
    expect(hint(lesson, marked, ["mark"])?.anchor).toBe("kw-missile-8");
    expect(hint(lesson, marked, ["mark", "half"])?.anchor).toBe("hourglass");
  });

  it("10 extra attack then extra engagement, then regular engage", () => {
    const { lesson, match: start } = startLesson("extra-attack");
    expect(start.phase).toBe("maneuver");
    const qmob = start.players[0].hand.find((c) => c.templateId === "first_strike")!;
    let match = play(lesson, start, { type: "playCard", cardId: qmob.instanceId, targets: {} });
    expect(match.phase).toBe("maneuver");
    expect(unitByDef(match, 17, 1)?.hp).toBe(14);
    expect(match.combatResumePhase).toBeNull();

    const trap = match.players[0].hand.find((c) => c.templateId === "trap")!;
    const recon = unitByDef(match, 22, 1)!;
    match = play(lesson, match, { type: "playCard", cardId: trap.instanceId, targets: { unitIds: [recon.instanceId] } });
    expect(match.phase).toBe("engagement");
    expect(match.combatResumePhase).toBe("maneuver");
    expect(unitByDef(match, 22, 1)).toBeNull();
    expect(unitByDef(match, 3, 0)?.combatAtkBonus).toBe(5);
    expect(unitByDef(match, 17, 1)?.hp).toBe(14);

    match = play(lesson, match, { type: "endEngagement" });
    expect(match.phase).toBe("maneuver");
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.phase).toBe("engagement");
    expect(match.combatResumePhase).toBeNull();
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("10 extra: popups distinguish extra attack vs extra engagement", () => {
    const { lesson, match: start } = startLesson("extra-attack");
    expect(hint(lesson, start)?.anchor).toBe("unit-11");
    expect(hint(lesson, start, ["extra-atk"])?.anchor).toBe("hp-17");
    expect(hint(lesson, start, ["extra-atk", "predict-atk"])?.anchor).toBe("card-first_strike");
    const qmob = start.players[0].hand.find((c) => c.templateId === "first_strike")!;
    const afterAtk = play(lesson, start, { type: "playCard", cardId: qmob.instanceId, targets: {} });
    expect(hint(lesson, afterAtk)?.anchor).toBe("unit-3");
    expect(hint(lesson, afterAtk, ["extra-eng"])?.anchor).toBe("hp-22");
    expect(hint(lesson, afterAtk, ["extra-eng", "predict-trap"])?.anchor).toBe("card-trap");
    expect(
      hint(lesson, afterAtk, ["extra-eng", "predict-trap"], { targetingTemplateId: "trap", targetingPickedUnits: 0 })
        ?.anchor,
    ).toBe("unit-22");
    const trap = afterAtk.players[0].hand.find((c) => c.templateId === "trap")!;
    const recon = unitByDef(afterAtk, 22, 1)!;
    const extraFight = play(lesson, afterAtk, {
      type: "playCard",
      cardId: trap.instanceId,
      targets: { unitIds: [recon.instanceId] },
    });
    expect(hint(lesson, extraFight)).toBeNull();
    const back = play(lesson, extraFight, { type: "endEngagement" });
    expect(hint(lesson, back)?.anchor).toBe("hp-17");
    expect(hint(lesson, back, ["predict-regular"])?.anchor).toBe("hourglass");
    const regular = play(lesson, back, { type: "endManeuver" });
    expect(hint(lesson, regular)).toBeNull();
  });

  it("11 artillery: rests on drop, then shoots without return fire either way", () => {
    const { lesson, match: start } = startLesson("artillery");
    expect(hint(lesson, start)?.anchor).toBe("reserve");
    expect(start.board[P1_SUPPORT][2]).toBeNull();
    let match = play(lesson, start, { type: "deploy", unitDefId: 11, row: 2 });
    expect(match.board[P1_SUPPORT][2]?.rested).toBe(true);
    expect(hint(lesson, match)?.anchor).toBe("kw-artillery-11");
    expect(hint(lesson, match, ["kw"])?.anchor).toBe("rest-11");
    expect(hint(lesson, match, ["kw", "rest"])?.anchor).toBe(`atk-${TUTORIAL_DUMMY}`);
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.phase).toBe("engagement");
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.hp).toBe(8);
    expect(unitByDef(match, 11, 0)?.hp).toBe(6);
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(0);
    expect(match.board[P1_SUPPORT][2]?.rested).toBe(false);
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.hp).toBe(2);
    expect(unitByDef(match, 11, 0)?.hp).toBe(6);
    expect(match.board[P1_FRONT][2]).toBeNull();
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("12 jet plane: rests on drop, then trades return fire both ways", () => {
    const { lesson, match: start } = startLesson("jet-plane");
    expect(hint(lesson, start)?.anchor).toBe("reserve");
    let match = play(lesson, start, { type: "deploy", unitDefId: 25, row: 2 });
    expect(match.board[P1_SUPPORT][2]?.rested).toBe(true);
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.atk).toBe(5);
    match = play(lesson, match, { type: "endDeployment" });
    // REST skip: jet did not shoot, so Dummy does not return fire.
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.hp).toBe(8);
    expect(unitByDef(match, 25, 0)?.hp).toBe(13);
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.hp).toBe(5);
    expect(unitByDef(match, 25, 0)?.hp).toBe(11);
    expect(match.board[P1_FRONT][2]).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(1);
    expect(hint(lesson, match)?.anchor).toBe(`atk-${TUTORIAL_DUMMY}`);
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 25, 0)?.hp).toBe(9);
    expect(unitByDef(match, TUTORIAL_DUMMY, 1)?.hp).toBe(2);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("13 return fire: REST skip safe, Artillery clean, Jet trades", () => {
    const { lesson, match: start } = startLesson("return-fire");
    expect(start.phase).toBe("deployment");
    expect(start.board[P1_FRONT][0]?.rested).toBe(true);
    expect(hint(lesson, start)?.anchor).toBe("phase");
    expect(hint(lesson, start, ["rules"])?.anchor).toBe("unit-101");
    expect(hint(lesson, start, ["rules", "lane-rest"])?.anchor).toBe("unit-11");
    expect(hint(lesson, start, ["rules", "lane-rest", "lane-arty"])?.anchor).toBe("unit-25");
    expect(hint(lesson, start, ["rules", "lane-rest", "lane-arty", "lane-jet"])?.anchor).toBe("hourglass");
    expect(
      hint(lesson, start, ["rules", "lane-rest", "lane-arty", "lane-jet", "predict"])?.anchor,
    ).toBe("hourglass");

    const match = play(lesson, start, { type: "endDeployment" });
    expect(match.board[P1_FRONT][0]?.hp).toBe(8);
    expect(match.board[P2_FRONT][0]?.hp).toBe(8);
    expect(match.board[P1_SUPPORT][2]?.hp).toBe(8);
    expect(match.board[P2_FRONT][2]?.hp).toBe(2);
    expect(match.board[P1_SUPPORT][3]?.hp).toBe(8);
    expect(match.board[P2_FRONT][3]?.hp).toBe(5);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("14 playstyle aggro: Rally then both jets punch HQ", () => {
    const { lesson, match: start } = startLesson("playstyle-aggro");
    expect(start.phase).toBe("maneuver");
    expect(start.players[1].hqHp).toBe(HQ_MAX_HP);
    expect(hint(lesson, start)?.anchor).toBe("hq-1");
    expect(hint(lesson, start, ["race"])?.anchor).toBe("kw-blitz-27");
    expect(hint(lesson, start, ["race", "blitz"])?.anchor).toBe("kw-flank-26");
    expect(hint(lesson, start, ["race", "blitz", "flank"])?.anchor).toBe("card-rally");
    expect(
      hint(lesson, start, ["race", "blitz", "flank"], {
        targetingTemplateId: "rally",
        targetingPickedUnits: 0,
      })?.anchor,
    ).toBe("unit-27");

    const rally = start.players[0].hand.find((c) => c.templateId === "rally")!;
    const komet = unitByDef(start, 27, 0)!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: rally.instanceId,
      targets: { unitIds: [komet.instanceId] },
    });
    expect(unitByDef(match, 27, 0)?.tempAtk).toBe(3);
    expect(hint(lesson, match)?.anchor).toBe("hq-1");
    expect(hint(lesson, match, ["predict"])?.anchor).toBe("hourglass");

    match = play(lesson, match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP - 17);
    expect(match.players[1].nextTurnSupplyBonus).toBe(0);
    expect(match.players[1].nextTurnDrawBonus).toBe(0);
    expect(match.players[1].hand).toHaveLength(2);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("15 playstyle missile/arty: Heatseeking then Support salvo", () => {
    const { lesson, match: start } = startLesson("playstyle-missile-arty");
    expect(start.phase).toBe("maneuver");
    expect(hint(lesson, start)?.anchor).toBe("unit-3");
    expect(hint(lesson, start, ["wall"])?.anchor).toBe("kw-artillery-10");
    expect(hint(lesson, start, ["wall", "arty"])?.anchor).toBe("kw-missile-10");
    expect(hint(lesson, start, ["wall", "arty", "missile"])?.anchor).toBe("card-heatseeking");

    const card = start.players[0].hand.find((c) => c.templateId === "heatseeking")!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: card.instanceId,
      targets: { cells: [{ col: P2_FRONT, row: 2 }] },
    });
    expect(unitByDef(match, 10, 0)?.missileTarget).toEqual({ col: P2_FRONT, row: 2 });
    expect(hint(lesson, match)?.anchor).toBe("hp-4");
    expect(hint(lesson, match, ["predict"])?.anchor).toBe("hourglass");

    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 4, 1)?.hp).toBe(1);
    expect(unitByDef(match, 22, 1)?.hp).toBe(4);
    expect(unitByDef(match, 10, 0)?.hp).toBe(8);
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("16 playstyle tank/robot: Quick Engagement then both Aggressive clear", () => {
    const { lesson, match: start } = startLesson("playstyle-tank-robot");
    expect(start.phase).toBe("maneuver");
    expect(hint(lesson, start)?.anchor).toBe("unit-2");
    expect(hint(lesson, start, ["front"])?.anchor).toBe("card-quick_engagement");
    expect(
      hint(lesson, start, ["front", "qe-card"], {
        targetingTemplateId: "quick_engagement",
        targetingPickedUnits: 0,
      })?.anchor,
    ).toBe("unit-2");

    const qe = start.players[0].hand.find((c) => c.templateId === "quick_engagement")!;
    const fenrir = unitByDef(start, 2, 0)!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: qe.instanceId,
      targets: { unitIds: [fenrir.instanceId] },
    });
    expect(match.phase).toBe("engagement");
    expect(match.board[P2_FRONT][2]?.hp).toBe(3);
    expect(match.board[P2_FRONT][0]?.hp).toBe(4);

    match = play(lesson, match, { type: "endEngagement" });
    expect(match.phase).toBe("maneuver");
    expect(hint(lesson, match)?.anchor).toBe("hp-4");
    expect(hint(lesson, match, ["chip"])?.anchor).toBe("unit-14");
    expect(hint(lesson, match, ["chip", "predict"])?.anchor).toBe("hourglass");

    match = play(lesson, match, { type: "endManeuver" });
    expect(match.board[P2_FRONT][2]).toBeNull();
    expect(match.board[P2_FRONT][0]).toBeNull();
    expect(lesson.steps.every((s) => s.done(match))).toBe(true);
  });

  it("hub numbers are 01–17 in curriculum order with no gaps", () => {
    const hubIds = TUTORIAL_HUB.flatMap((s) => s.cards.filter((c) => !c.cta).map((c) => c.id));
    expect(hubIds).toEqual(tutorialOrder());
    expect(LESSONS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const hubNumbers = TUTORIAL_HUB.flatMap((s) => s.cards.filter((c) => !c.cta).map((c) => c.number));
    expect(hubNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
    const ready = TUTORIAL_HUB.find((s) => s.id === "basic")?.cards.at(-1);
    expect(ready).toMatchObject({
      id: "basic-complete",
      number: 6,
      title: "You are ready for battle",
      cta: true,
    });
  });

  it("build guide walks the army builder with highlights", () => {
    expect(nextTutorialId("jet-plane")).toBe("return-fire");
    expect(nextTutorialId("return-fire")).toBe("playstyle-aggro");
    expect(nextTutorialId("playstyle-aggro")).toBe("playstyle-missile-arty");
    expect(nextTutorialId("playstyle-missile-arty")).toBe("playstyle-tank-robot");
    expect(nextTutorialId("playstyle-tank-robot")).toBe(BUILD_GUIDE_ID);
    expect(nextTutorialId(BUILD_GUIDE_ID)).toBeNull();
    expect(nextTutorialId("basic", new Set(["basic", "resources"]))).toBe("armor");
    expect(firstIncompleteTutorialId(new Set(["basic", BUILD_GUIDE_ID]))).toBe("resources");
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
