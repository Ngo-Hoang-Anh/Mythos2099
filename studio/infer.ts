import { getUnitDef } from "../src/data/units";
import { supportCol, templateMatch, type Beat, type BeatTargets, type DoneCheck } from "../src/tutorial/authored";
import type { Action, MatchState, PlayerId, UnitInstance } from "../src/engine/types";

function discardCount(match: MatchState, player: PlayerId, templateId: string): number {
  return match.players[player].discard.filter((card) => templateMatch(card.templateId, templateId)).length;
}

function unitName(defId: number): string {
  try {
    return getUnitDef(defId).name;
  } catch {
    return `Unit ${defId}`;
  }
}

function placedAfter(match: MatchState, defId: number, owner: PlayerId, row: number): UnitInstance | null {
  for (const column of match.board) {
    for (const unit of column) {
      if (unit && unit.defId === defId && unit.owner === owner && unit.row === row && unit.hp > 0) return unit;
    }
  }
  return null;
}

function targetsFrom(before: MatchState, action: Extract<Action, { type: "playCard" }>): BeatTargets {
  const targets: BeatTargets = {};
  if (action.targets.unitIds?.length) {
    const units = [];
    for (const id of action.targets.unitIds) {
      let found: UnitInstance | null = null;
      for (const column of before.board) {
        for (const unit of column) {
          if (unit?.instanceId === id) found = unit;
        }
      }
      if (!found) continue;
      units.push({ defId: found.defId, owner: found.owner, col: found.col, row: found.row });
    }
    if (units.length) targets.units = units;
  }
  if (action.targets.cells?.length) targets.cells = action.targets.cells.map((cell) => ({ ...cell }));
  if (action.targets.directions?.length) targets.directions = [...action.targets.directions];
  if (action.targets.hq) targets.hq = true;
  if (action.targets.choice) targets.choice = action.targets.choice;
  return targets;
}

export function inferBeat(before: MatchState, after: MatchState, action: Action, id: string): Beat | null {
  if (action.type === "endEngagement" || action.type === "surrender") return null;
  const actor = before.currentPlayer;
  const block = "Follow the steps in the coach panel.";

  if (action.type === "deploy") {
    const placed = placedAfter(after, action.unitDefId, actor, action.row);
    const done: DoneCheck = {
      type: "unitOn",
      defId: action.unitDefId,
      owner: actor,
      col: placed?.col ?? supportCol(actor),
      row: action.row,
    };
    const discardTemplateIds = (action.discardCardIds ?? [])
      .map((cardId) => before.players[actor].hand.find((card) => card.instanceId === cardId)?.templateId)
      .filter((templateId): templateId is string => Boolean(templateId));
    const name = unitName(action.unitDefId);
    return {
      id,
      actor,
      label: `Summon ${name} on lane ${action.row + 1}`,
      block,
      done,
      action: {
        type: "deploy",
        unitDefId: action.unitDefId,
        row: action.row,
        ...(discardTemplateIds.length ? { discardTemplateIds } : {}),
      },
      hint: {
        anchor: `reserve-unit-${action.unitDefId}`,
        title: `Summon ${name}`,
        body: `Drop it on lane ${action.row + 1}.`,
      },
    };
  }

  if (action.type === "playCard") {
    const card = before.players[actor].hand.find((entry) => entry.instanceId === action.cardId);
    if (!card) return null;
    const count = discardCount(after, actor, card.templateId);
    return {
      id,
      actor,
      label: `Play ${card.name}`,
      block,
      done: { type: "discarded", player: actor, templateId: card.templateId, count: Math.max(1, count) },
      action: {
        type: "playCard",
        templateId: card.templateId,
        ownerUnitId: card.ownerUnitId,
        targets: targetsFrom(before, action),
      },
      hint: {
        anchor: `card-${card.templateId}`,
        title: card.name,
        body: "Play this card.",
      },
    };
  }

  if (action.type === "discardRedraw") {
    const card = before.players[actor].hand.find((entry) => entry.instanceId === action.cardId);
    if (!card) return null;
    const count = discardCount(after, actor, card.templateId);
    return {
      id,
      actor,
      label: `Discard ${card.name} to redraw`,
      block,
      done: { type: "discarded", player: actor, templateId: card.templateId, count: Math.max(1, count) },
      action: { type: "discardRedraw", templateId: card.templateId, ownerUnitId: card.ownerUnitId },
      hint: {
        anchor: `card-${card.templateId}`,
        title: `Discard ${card.name}`,
        body: "Discard this card to redraw.",
      },
    };
  }

  if (action.type === "endDeployment" || action.type === "endManeuver") {
    const phase = after.phase === "gameover" ? "gameover" : after.phase;
    const label = action.type === "endDeployment" ? "End deployment" : "End maneuver";
    return {
      id,
      actor,
      label,
      block,
      done: { type: "phase", phase },
      action: { type: action.type },
      hint: {
        anchor: "hourglass",
        title: "Press the hourglass",
        body: label + ".",
      },
    };
  }

  return null;
}

export function nextBeatId(beats: readonly Beat[]): string {
  let max = 0;
  for (const beat of beats) {
    const n = Number(/^b(\d+)$/.exec(beat.id)?.[1] ?? 0);
    if (n > max) max = n;
  }
  return `b${max + 1}`;
}
