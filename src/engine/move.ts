import { backCol, forwardCol, inBounds, isOwnCol } from "./board";
import type { BoardPos, Direction, EffectId, MatchState, PlayerId, UnitInstance } from "./types";

export type DestFail = "frontline" | "support" | "retreat" | "bounds" | "border";

export function samePos(a: BoardPos, b: BoardPos): boolean {
  return a.col === b.col && a.row === b.row;
}

export function destOfDir(owner: PlayerId, col: number, row: number, dir: Direction): BoardPos | DestFail {
  let nextCol = col;
  let nextRow = row;
  if (dir === "up") nextRow -= 1;
  else if (dir === "down") nextRow += 1;
  else if (dir === "forward" || dir === "forwardUp" || dir === "forwardDown") {
    const next = forwardCol(owner, col);
    if (next === null) return "frontline";
    nextCol = next;
    if (dir === "forwardUp") nextRow -= 1;
    if (dir === "forwardDown") nextRow += 1;
  } else if (dir === "back") {
    const next = backCol(owner, col);
    if (next === null) return "support";
    nextCol = next;
  } else if (dir === "upBack" || dir === "downBack") {
    const next = backCol(owner, col);
    if (next === null) return "retreat";
    nextCol = next;
    nextRow += dir === "upBack" ? -1 : 1;
  }
  if (!inBounds(nextCol, nextRow)) return "bounds";
  if (!isOwnCol(owner, nextCol)) return "border";
  return { col: nextCol, row: nextRow };
}

export function destError(unit: UnitInstance, fail: DestFail): string {
  if (fail === "frontline") return `${unit.name} is already at Frontline`;
  if (fail === "support") return `${unit.name} is already at Support`;
  if (fail === "retreat") return `${unit.name} cannot retreat further`;
  if (fail === "bounds") return "That move is off the board";
  return "Units cannot cross the border";
}

export function dirsForEffect(effectId: EffectId): Direction[] | null {
  switch (effectId) {
    case "forward":
      return ["forward"];
    case "retreat":
    case "maintenance":
      return ["upBack", "back", "downBack"];
    case "up":
      return ["up", "upBack"];
    case "down":
      return ["down", "downBack"];
    case "upOrDown":
      return ["up", "down"];
    case "moveAnyDirection":
    case "moveTwoUnits":
      return ["up", "down", "forward", "back"];
    case "diversionDown":
    case "diversionUp":
      return ["up", "down", "forward", "back", "forwardUp", "forwardDown", "upBack", "downBack"];
    case "initiative":
    case "moveUnitTwice":
    case "intelAcquired":
      return ["up", "down", "forward", "back", "forwardUp", "forwardDown", "upBack", "downBack"];
    case "swiftManeuver":
      return ["up", "down", "back"];
    default:
      return null;
  }
}

/** Maximum destinations the move card can use (Blitzkrieg / Swift allow stopping earlier). */
export function destCountForEffect(effectId: EffectId): number {
  if (effectId === "moveUnitTwice" || effectId === "intelAcquired" || effectId === "moveTwoUnits" || effectId === "swiftManeuver") return 2;
  return dirsForEffect(effectId) ? 1 : 0;
}

/** Minimum destinations required before the player may confirm (upto moves). */
export function minDestCountForEffect(effectId: EffectId): number {
  if (effectId === "moveUnitTwice" || effectId === "swiftManeuver") return 1;
  return destCountForEffect(effectId);
}

export function allowsPartialMove(effectId: EffectId): boolean {
  return minDestCountForEffect(effectId) < destCountForEffect(effectId);
}

export function unitsNeededForMove(effectId: EffectId): number {
  if (effectId === "moveTwoUnits" || effectId === "swiftManeuver") return 2;
  return dirsForEffect(effectId) ? 1 : 0;
}

export function minUnitsNeededForMove(effectId: EffectId): number {
  if (effectId === "swiftManeuver") return 1;
  return unitsNeededForMove(effectId);
}

export function legalDestinations(
  state: MatchState,
  unit: UnitInstance,
  dirs: Direction[],
  opts?: {
    from?: BoardPos;
    extraEmpty?: BoardPos[];
    extraOccupied?: BoardPos[];
  },
): BoardPos[] {
  const from = opts?.from ?? { col: unit.col, row: unit.row };
  const dests: BoardPos[] = [];
  for (const dir of dirs) {
    const dest = destOfDir(unit.owner, from.col, from.row, dir);
    if (typeof dest === "string") continue;
    if (cellBlocked(state, unit, dest, opts)) continue;
    dests.push(dest);
  }
  return dests;
}

function cellBlocked(
  state: MatchState,
  unit: UnitInstance,
  dest: BoardPos,
  opts?: { extraEmpty?: BoardPos[]; extraOccupied?: BoardPos[] },
): boolean {
  if (opts?.extraOccupied?.some((pos) => samePos(pos, dest))) return true;
  if (opts?.extraEmpty?.some((pos) => samePos(pos, dest))) return false;
  const occupant = state.board[dest.col][dest.row];
  if (!occupant) return false;
  return occupant.instanceId !== unit.instanceId;
}

export function noDestError(unit: UnitInstance, dirs: Direction[]): string {
  const sample = destOfDir(unit.owner, unit.col, unit.row, dirs[0] ?? "forward");
  if (typeof sample === "string" && dirs.every((dir) => typeof destOfDir(unit.owner, unit.col, unit.row, dir) === "string")) {
    return destError(unit, sample);
  }
  return "No legal destination";
}
