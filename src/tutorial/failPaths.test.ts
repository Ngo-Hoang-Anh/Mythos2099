import { describe, expect, it } from "vitest";
import { P1_FRONT, P2_FRONT, type Action, type MatchState } from "../engine/types";
import { TUTORIAL_CADET, TUTORIAL_RECRUIT } from "../data/tutorialUnits";
import { unitByDef } from "../engine/sandbox";
import { applyLessonAction, startLesson, type LessonResult } from "./controller";
import type { LESSONS } from "./lessons";

function must(result: LessonResult): MatchState {
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

function play(lesson: (typeof LESSONS)[number], match: MatchState, action: Action): MatchState {
  return must(applyLessonAction(lesson, match, action));
}

describe("tutorial fail paths (wrong play must lose)", () => {
  it("10 cover-flank: skip Cover — Destroyer open-lanes your 10 HP HQ", () => {
    const { lesson, match: start } = startLesson("cover-flank");
    // Flank leaves the lane empty; Destroyer deletes HQ on P2's volley.
    let match = play(lesson, start, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("11 aggressive: skip Retreat — scouts die to Retaliate and HQ falls", () => {
    const { lesson, match: start } = startLesson("aggressive");
    // Leave Fenrir in reserve; swing scouts into Retaliate and die.
    let match = play(lesson, start, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1081, 0)).toBeNull();
    for (let i = 0; i < 12 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("3 resources: Cadet only (no Recruit) — Dummy finishes HQ", () => {
    const { lesson, match: start } = startLesson("resources");
    let match = play(lesson, start, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    const cadet = unitByDef(match, TUTORIAL_CADET, 0)!;
    const sealed = match.players[0].hand.find((c) => c.templateId === "initiative")!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: sealed.instanceId,
      targets: { choice: "move", unitIds: [cadet.instanceId], cells: [{ col: P1_FRONT, row: 2 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBe(1);
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("3 resources: skip Initiative entirely — Cadet Resting, Dummy finishes HQ", () => {
    const { lesson, match: start } = startLesson("resources");
    let match = play(lesson, start, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_CADET, row: 2 });
    match = play(lesson, match, { type: "deploy", unitDefId: TUTORIAL_RECRUIT, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBe(2);
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("12 extra-attack: skip both cards — Horus open-lanes HQ after Xuanwu dies", () => {
    const { lesson, match: start } = startLesson("extra-attack");
    let match = play(lesson, start, { type: "endManeuver" });
    expect(unitByDef(match, 3, 0)).toBeNull();
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("12 extra-attack: First Strike only (no Trap) — Horus still snipes HQ", () => {
    const { lesson, match: start } = startLesson("extra-attack");
    const first = start.players[0].hand.find((c) => c.templateId === "first_strike")!;
    let match = play(lesson, start, { type: "playCard", cardId: first.instanceId, targets: {} });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 3, 0)).toBeNull();
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("12 barrier-timing: Forward Aggressive (wrong lane) — P2 wins", () => {
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
    for (let i = 0; i < 20 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("13 smoke-timing: Forward Retaliate (wrong lane) — P2 wins", () => {
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
    for (let i = 0; i < 20 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it.each([
    [1221, 1222, 1223], // Shock 4/1/2
    [1222, 1221, 1223], // Shock 1/4/2
    [1223, 1222, 1221], // Shock 2/1/4
    [1221, 1223, 1222], // Shock 4/2/1
    [1223, 1221, 1222], // Shock 2/4/1
  ] as const)("14 shock-match: wrong lanes %i/%i/%i — P2 wins", (a, b, c) => {
    const { lesson, match: start } = startLesson("shock-match");
    let match = play(lesson, start, { type: "deploy", unitDefId: a, row: 0 });
    match = play(lesson, match, { type: "deploy", unitDefId: b, row: 1 });
    match = play(lesson, match, { type: "deploy", unitDefId: c, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    for (let i = 0; i < 40 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("15 playstyle-aggro: Rally on Support (wrong unit) — shortfall then HQ snipe", () => {
    const { lesson, match: start } = startLesson("playstyle-aggro");
    const rally = start.players[0].hand.find((c) => c.templateId === "rally")!;
    const support = unitByDef(start, 6, 0)!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: rally.instanceId,
      targets: { unitIds: [support.instanceId] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBeGreaterThan(0);
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("17 scout-recon: skip Pathfinder — Aggressive finishes you", () => {
    const { lesson, match: start } = startLesson("scout-recon");
    let match = play(lesson, start, { type: "endDeployment" });
    expect(unitByDef(match, 1303, 1)?.hp).toBeGreaterThan(0);
    expect(unitByDef(match, 1304, 1)?.hp).toBeGreaterThan(0);
    for (let i = 0; i < 20 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("17 scout-recon: Blitz wrong empty row — Veil open-lanes HQ", () => {
    const { lesson, match: start } = startLesson("scout-recon");
    let match = play(lesson, start, { type: "deploy", unitDefId: 1302, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(unitByDef(match, 1303, 1)).toBeNull();
    expect(unitByDef(match, 1304, 1)?.hp).toBeGreaterThan(0);
    for (let i = 0; i < 20 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("18 hulldown-slope: skip Acid Eye — Dig-A and Slope survive, P2 wins", () => {
    const { lesson, match: start } = startLesson("hulldown-slope");
    let match = play(lesson, start, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1315, 1)?.hp).toBeGreaterThan(0);
    expect(unitByDef(match, 1317, 1)?.armor).toBe(3);
    for (let i = 0; i < 40 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("18 hulldown-slope: Wedge before Corrosion — ricochet, Slope lives", () => {
    const { lesson, match: start } = startLesson("hulldown-slope");
    let match = play(lesson, start, { type: "deploy", unitDefId: 1314, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1317, 1)?.hp).toBe(4);
    expect(unitByDef(match, 1317, 1)?.armor).toBe(3);
    for (let i = 0; i < 40 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("18 hulldown-slope: skip Diversion — Dig-B open-lanes HQ", () => {
    const { lesson, match: start } = startLesson("hulldown-slope");
    let match = play(lesson, start, { type: "deploy", unitDefId: 1313, row: 1 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1315, 1)).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endEngagement" });
    // Skip Diversion — missiles re-lock Slope; Dig-B stays dug-in and open-lanes.
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1316, 1)?.hp).toBeGreaterThan(0);
    for (let i = 0; i < 40 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
  });

  it("16 playstyle-missile-arty: skip Heatseeking — line collapses (P2 wins)", () => {
    const { lesson, match: start } = startLesson("playstyle-missile-arty");
    let match = play(lesson, start, { type: "endManeuver" });
    expect(unitByDef(match, 3, 0)).toBeNull();
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
  });

  it("17 playstyle-tank-robot: skip Quick Engagement — Sarama lives and snipes HQ", () => {
    const { lesson, match: start } = startLesson("playstyle-tank-robot");
    let match = play(lesson, start, { type: "endManeuver" });
    // One Aggressive shot: Sarama 14→7; Horus dies to Skadi; Fenrir chipped by return.
    expect(unitByDef(match, 4, 1)?.hp).toBe(7);
    expect(unitByDef(match, 22, 1)).toBeNull();
    expect(match.winner).toBeNull();
    // P2 kills Fenrir; next P2 open-lanes HQ 8 (Support is off-lane so it won't Cover-fill).
    for (let i = 0; i < 8 && match.winner == null; i++) {
      if (match.phase === "engagement") match = play(lesson, match, { type: "endEngagement" });
      else if (match.phase === "deployment") match = play(lesson, match, { type: "endDeployment" });
      else if (match.phase === "maneuver") match = play(lesson, match, { type: "endManeuver" });
      else break;
    }
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("hq");
  });

  it("11 extra-attack: Trap only (no First Strike) — Heimdall lives and snipes HQ", () => {
    const { lesson, match: start } = startLesson("extra-attack");
    const trap = start.players[0].hand.find((c) => c.templateId === "trap")!;
    const horus = unitByDef(start, 22, 1)!;
    let match = play(lesson, start, {
      type: "playCard",
      cardId: trap.instanceId,
      targets: { unitIds: [horus.instanceId] },
    });
    expect(unitByDef(match, 22, 1)).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endManeuver" });
    // Arty alone chips Heimdall 10→5; empty Front row 2 → P2 Heimdall ATK 8 deletes HQ.
    expect(unitByDef(match, 17, 1)?.hp).toBe(5);
    expect(match.winner).toBeNull();
    match = play(lesson, match, { type: "endEngagement" });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.winner).toBe(1);
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

  it("26 veteran-first-strike: mirror First Strike — Ambush lives, T4 deletes Striker", () => {
    const { lesson, match: start } = startLesson("veteran-first-strike");
    let match = play(lesson, start, { type: "deploy", unitDefId: 1321, row: 0 });
    match = play(lesson, match, { type: "endDeployment" });
    const forward = match.players[0].hand.find((c) => c.templateId === "forward")!;
    const vanguard = unitByDef(match, 1321, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: forward.instanceId,
      targets: { unitIds: [vanguard.instanceId], cells: [{ col: P1_FRONT, row: 0 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    // T3: Striker into Ambush instead of Aegis.
    match = play(lesson, match, { type: "deploy", unitDefId: 1323, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1326, 1)?.hp).toBe(2);
    expect(unitByDef(match, 1323, 0)?.hp).toBe(1);
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    expect(unitByDef(match, 1323, 0)).toBeNull();
    expect(unitByDef(match, 1326, 1)?.hp).toBeGreaterThan(0);
    expect(match.winner).toBeNull();
  });

  it("26 veteran-first-strike: T5 skip Rally — Ambush survives", () => {
    const { lesson, match: start } = startLesson("veteran-first-strike");
    let match = play(lesson, start, { type: "deploy", unitDefId: 1321, row: 0 });
    match = play(lesson, match, { type: "endDeployment" });
    const forward = match.players[0].hand.find((c) => c.templateId === "forward")!;
    const vanguard = unitByDef(match, 1321, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: forward.instanceId,
      targets: { unitIds: [vanguard.instanceId], cells: [{ col: P1_FRONT, row: 0 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    match = play(lesson, match, { type: "deploy", unitDefId: 1322, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    match = play(lesson, match, { type: "deploy", unitDefId: 1323, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    const supply = match.players[0].hand.find((c) => c.templateId === "supply")!;
    match = play(lesson, match, { type: "playCard", cardId: supply.instanceId, targets: {} });
    const down = match.players[0].hand.find((c) => c.templateId === "down")!;
    const vet = unitByDef(match, 1321, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: down.instanceId,
      targets: { unitIds: [vet.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    expect(unitByDef(match, 1326, 1)?.hp).toBe(2);
    expect(match.winner).toBeNull();
  });

  it("26 veteran-first-strike: T5 no Supply — cannot afford Rally + Down", () => {
    const { lesson, match: start } = startLesson("veteran-first-strike");
    let match = play(lesson, start, { type: "deploy", unitDefId: 1321, row: 0 });
    match = play(lesson, match, { type: "endDeployment" });
    const forward = match.players[0].hand.find((c) => c.templateId === "forward")!;
    const vanguard = unitByDef(match, 1321, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: forward.instanceId,
      targets: { unitIds: [vanguard.instanceId], cells: [{ col: P1_FRONT, row: 0 }] },
    });
    match = play(lesson, match, { type: "endManeuver" });
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    match = play(lesson, match, { type: "deploy", unitDefId: 1322, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    match = play(lesson, match, { type: "endManeuver" });
    match = play(lesson, match, { type: "endEngagement" });
    match = runOpponent(lesson, match);
    match = play(lesson, match, { type: "deploy", unitDefId: 1323, row: 2 });
    match = play(lesson, match, { type: "endDeployment" });
    expect(match.players[0].commandPoints).toBe(1);
    const rally = match.players[0].hand.find((c) => c.templateId === "rally")!;
    const striker = unitByDef(match, 1323, 0)!;
    match = play(lesson, match, {
      type: "playCard",
      cardId: rally.instanceId,
      targets: { unitIds: [striker.instanceId] },
    });
    expect(match.players[0].commandPoints).toBe(0);
    const down = match.players[0].hand.find((c) => c.templateId === "down")!;
    const vet = unitByDef(match, 1321, 0)!;
    const blocked = applyLessonAction(lesson, match, {
      type: "playCard",
      cardId: down.instanceId,
      targets: { unitIds: [vet.instanceId], cells: [{ col: P1_FRONT, row: 1 }] },
    });
    expect(blocked.ok).toBe(false);
  });
});
