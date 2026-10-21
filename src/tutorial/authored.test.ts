import { describe, expect, it } from "vitest";
import { getSquadArt, SQUAD_ART } from "../data/squadArt";
import { getUnitArt, UNIT_ART } from "../data/unitArt";
import { applyAction } from "../engine/match";
import type { MatchState } from "../engine/types";
import {
  allowFromBeats,
  checkDone,
  emptyDraft,
  firstOpenBeat,
  freePlayBehavior,
  markBeatProgress,
  scriptedFromBeats,
  setupScenario,
  type Beat,
} from "./authored";
import { ARMOR_SCENARIO } from "./scenarios";

function must(match: MatchState, action: NonNullable<ReturnType<ReturnType<typeof scriptedFromBeats>>>) {
  const result = applyAction(match, action);
  if (!result.ok) throw new Error(result.error);
  markBeatProgress(result.state, beatsOf(result.state));
  return result.state;
}

let activeBeats: Beat[] = [];
function beatsOf(_match: MatchState): Beat[] {
  return activeBeats;
}

describe("authored art aliases", () => {
  it("resolves armor-lesson infantry aliases via squad packs", () => {
    setupScenario(ARMOR_SCENARIO);
    expect(getSquadArt(1041)).toBe(SQUAD_ART[17]);
    expect(getSquadArt(1045)).toBe(SQUAD_ART[16]);
    expect(getSquadArt(1042)).toBe(SQUAD_ART[18]);
    expect(getUnitArt(1046)).toBe(UNIT_ART[3]);
  });
});

describe("authored free-play", () => {
  it("allows any action and wins on match outcome", () => {
    const draft = emptyDraft();
    draft.win = "elimination";
    draft.reserve = [[101], []];
    draft.board = [{ defId: 103, owner: 1, col: 2, row: 2, hp: 3, atk: 0 }];
    draft.units = [
      {
        id: 101,
        name: "Cadet",
        class: "Robot",
        hp: 6,
        atk: 3,
        armor: 0,
        ap: 0,
        cost: 3,
        keywordText: "Blitz",
        cardTemplateIds: [],
        artAliasId: 14,
      },
      {
        id: 103,
        name: "Dummy",
        class: "Helicopter",
        hp: 3,
        atk: 0,
        armor: 0,
        ap: 0,
        cost: 0,
        keywordText: "",
        cardTemplateIds: [],
      },
    ];
    const behavior = freePlayBehavior(draft);
    let match = setupScenario(draft);
    expect(behavior.allow(match, { type: "deploy", unitDefId: 101, row: 0 })).toBeNull();
    const deployed = applyAction(match, { type: "deploy", unitDefId: 101, row: 2 });
    if (!deployed.ok) throw new Error(deployed.error);
    match = deployed.state;
    const fighting = applyAction(match, { type: "endDeployment" });
    if (!fighting.ok) throw new Error(fighting.error);
    match = fighting.state;
    expect(match.winner).toBe(0);
    expect(behavior.steps[0]!.done(match)).toBe(true);
  });
});

describe("authored beats", () => {
  it("keeps an end-deployment beat settled after the turn passes", () => {
    const beats: Beat[] = [
      {
        id: "open",
        label: "End deployment",
        actor: 1,
        action: { type: "endDeployment" },
        done: { type: "phase", phase: "maneuver" },
        block: "End deployment.",
      },
    ];
    activeBeats = beats;
    const draft = emptyDraft();
    draft.youFirst = false;
    draft.hand = [{ player: 1, ownerDefId: 13, templateId: "forward" }];
    let match = setupScenario(draft);
    expect(match.currentPlayer).toBe(1);
    expect(match.phase).toBe("deployment");

    const scripted = scriptedFromBeats(beats);
    const opening = scripted(match);
    expect(opening).toEqual({ type: "endDeployment" });
    match = must(match, opening!);
    expect(match.phase).toBe("maneuver");
    expect(firstOpenBeat(match, beats)).toBeUndefined();

    match.phase = "deployment";
    match.turn = 2;
    match.currentPlayer = 0;
    expect(checkDone(match, beats[0]!.done)).toBe(false);
    expect(firstOpenBeat(match, beats)).toBeUndefined();
    expect(scripted(match)).toBeNull();
  });

  it("blocks the student until the open beat matches", () => {
    const beats: Beat[] = [
      {
        id: "drop",
        label: "Summon",
        actor: 0,
        action: { type: "deploy", unitDefId: 101, row: 1 },
        done: { type: "unitOn", defId: 101, owner: 0, col: 0, row: 1 },
        block: "Summon the Cadet on lane 2.",
      },
    ];
    const allow = allowFromBeats(beats);
    const draft = emptyDraft();
    draft.reserve = [[101], []];
    const match = setupScenario(draft);
    expect(allow(match, { type: "deploy", unitDefId: 101, row: 0 })).toBe("Summon the Cadet on lane 2.");
    expect(allow(match, { type: "deploy", unitDefId: 101, row: 1 })).toBeNull();
  });

  it("counts repeated discards separately", () => {
    const draft = emptyDraft();
    draft.hand = [
      { player: 0, ownerDefId: 13, templateId: "forward" },
      { player: 0, ownerDefId: 13, templateId: "forward" },
    ];
    const match = setupScenario(draft);
    match.players[0].discard.push(match.players[0].hand[0]!);
    expect(checkDone(match, { type: "discarded", player: 0, templateId: "forward", count: 1 })).toBe(true);
    expect(checkDone(match, { type: "discarded", player: 0, templateId: "forward", count: 2 })).toBe(false);
  });
});
