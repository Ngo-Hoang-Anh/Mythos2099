import { findUnit, unitsOf } from "../engine/board";
import {
  destCountForEffect,
  dirsForEffect,
  legalDestinations,
  unitsNeededForMove,
  allowsPartialMove,
  samePos,
} from "../engine/move";
import type { BoardPos, EffectId, MatchState, PlayerId, UnitInstance } from "../engine/types";

export function isSequentialTwoUnitMove(effectId: EffectId): boolean {
  return unitsNeededForMove(effectId) === 2;
}

export function awaitingMoveDest(effectId: EffectId, unitIds: string[], cells: BoardPos[]): boolean {
  if (!dirsForEffect(effectId)) return false;
  if (cells.length >= destCountForEffect(effectId)) return false;
  if (isSequentialTwoUnitMove(effectId)) return unitIds.length === cells.length + 1;
  return unitIds.length >= unitsNeededForMove(effectId);
}

function occupancyAfterFirstMove(
  match: MatchState,
  unitIds: string[],
  cells: BoardPos[],
): { extraEmpty: BoardPos[]; extraOccupied: BoardPos[] } {
  const first = findUnit(match.board, unitIds[0]);
  return {
    extraEmpty: first ? [{ col: first.col, row: first.row }] : [],
    extraOccupied: [cells[0]],
  };
}

function destsForMoveUnit(
  match: MatchState,
  effectId: EffectId,
  unit: UnitInstance,
  unitIds: string[],
  cells: BoardPos[],
): BoardPos[] {
  const dirs = dirsForEffect(effectId);
  if (!dirs) return [];
  if (isSequentialTwoUnitMove(effectId)) {
    if (cells.length === 1) return legalDestinations(match, unit, dirs, occupancyAfterFirstMove(match, unitIds, cells));
    return legalDestinations(match, unit, dirs);
  }
  if (cells.length === 1) {
    return legalDestinations(match, unit, dirs, {
      from: cells[0],
      extraEmpty: [{ col: unit.col, row: unit.row }],
      extraOccupied: [cells[0]],
    });
  }
  return legalDestinations(match, unit, dirs);
}

export function moveHighlights(
  match: MatchState,
  effectId: EffectId,
  unitIds: string[],
  cells: BoardPos[],
): BoardPos[] {
  if (!awaitingMoveDest(effectId, unitIds, cells)) return [];
  const unit = findUnit(match.board, unitIds[isSequentialTwoUnitMove(effectId) ? cells.length : 0]);
  if (!unit) return [];
  return destsForMoveUnit(match, effectId, unit, unitIds, cells);
}

/**
 * During sequential moves the first unit still sits on its old cell in the UI, even though
 * that cell is a legal destination for the next mover. Clicking the token must count as
 * picking that cell — otherwise the destination is unreachable.
 */
export function moveDestUnderUnit(
  match: MatchState,
  effectId: EffectId,
  unitIds: string[],
  cells: BoardPos[],
  unit: UnitInstance,
): BoardPos | null {
  if (!awaitingMoveDest(effectId, unitIds, cells)) return null;
  const pos = { col: unit.col, row: unit.row };
  if (!moveHighlights(match, effectId, unitIds, cells).some((dest) => samePos(dest, pos))) return null;
  return pos;
}

export function canPickSequentialMoveUnit(
  match: MatchState,
  effectId: EffectId,
  unitIds: string[],
  cells: BoardPos[],
  unit: UnitInstance,
  viewer: PlayerId,
): boolean {
  if (!isSequentialTwoUnitMove(effectId)) return false;
  if (unit.owner !== viewer) return false;
  if (unitIds.includes(unit.instanceId) || unitIds.length >= 2) return false;
  if (awaitingMoveDest(effectId, unitIds, cells)) return false;
  return destsForMoveUnit(match, effectId, unit, unitIds, cells).length > 0;
}

export function sequentialMoveStuck(
  match: MatchState,
  effectId: EffectId,
  unitIds: string[],
  cells: BoardPos[],
  viewer: PlayerId,
): boolean {
  if (!isSequentialTwoUnitMove(effectId)) return false;
  if (awaitingMoveDest(effectId, unitIds, cells)) {
    return moveHighlights(match, effectId, unitIds, cells).length === 0;
  }
  if (unitIds.length >= unitsNeededForMove(effectId)) return false;
  return !unitsOf(match.board, viewer).some((unit) =>
    canPickSequentialMoveUnit(match, effectId, unitIds, cells, unit, viewer),
  );
}

export function moveDestPrompt(
  match: MatchState,
  effectId: EffectId,
  unitIds: string[],
  cells: BoardPos[],
  viewer: PlayerId = 0,
): string {
  const needUnits = unitsNeededForMove(effectId);
  const needDests = destCountForEffect(effectId);
  if (isSequentialTwoUnitMove(effectId)) {
    if (!awaitingMoveDest(effectId, unitIds, cells)) {
      if (sequentialMoveStuck(match, effectId, unitIds, cells, viewer)) return "No unit can move — Cancel";
      if (allowsPartialMove(effectId) && unitIds.length === cells.length && cells.length >= 1) {
        return `Click friendly unit ${unitIds.length + 1} (or Done)`;
      }
      return `Click friendly unit ${unitIds.length + 1}`;
    }
    const unit = findUnit(match.board, unitIds[cells.length]);
    if (moveHighlights(match, effectId, unitIds, cells).length === 0) return "No legal cells — Cancel";
    return `Click a highlighted cell to move ${unit?.name ?? "unit"}`;
  }
  if (unitIds.length < needUnits) return "Click a friendly unit on the board";
  if (moveHighlights(match, effectId, unitIds, cells).length === 0) {
    return "No legal cells — pick another unit or Cancel";
  }
  if (needDests === 2) {
    if (allowsPartialMove(effectId) && cells.length >= 1) {
      return `Click a highlighted cell — step ${cells.length + 1}/2 (or Done)`;
    }
    return `Click a highlighted cell — step ${cells.length + 1}/2`;
  }
  return "Click a highlighted cell to move";
}
