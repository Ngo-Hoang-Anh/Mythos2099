import { COLS, P1_FRONT, P1_SUPPORT, P2_FRONT, P2_SUPPORT, ROWS, type PlayerId, type UnitInstance } from "./types";

export function emptyBoard(): (UnitInstance | null)[][] {
  return Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => null));
}

export function cloneBoard(board: (UnitInstance | null)[][]): (UnitInstance | null)[][] {
  return board.map((col) =>
    col.map((cell) =>
      cell
        ? {
            ...cell,
            keywords: cell.keywords.map((k) => ({ ...k })),
            missileTarget: cell.missileTarget ? { ...cell.missileTarget } : null,
          }
        : null,
    ),
  );
}

export function supportCol(player: PlayerId): number {
  return player === 0 ? P1_SUPPORT : P2_SUPPORT;
}

export function frontCol(player: PlayerId): number {
  return player === 0 ? P1_FRONT : P2_FRONT;
}

export function isOwnCol(player: PlayerId, col: number): boolean {
  return player === 0 ? col === P1_SUPPORT || col === P1_FRONT : col === P2_SUPPORT || col === P2_FRONT;
}

export function isFrontline(player: PlayerId, col: number): boolean {
  return col === frontCol(player);
}

export function isSupport(player: PlayerId, col: number): boolean {
  return col === supportCol(player);
}

export function forwardCol(player: PlayerId, col: number): number | null {
  if (player === 0) {
    return col === P1_SUPPORT ? P1_FRONT : null;
  }
  return col === P2_SUPPORT ? P2_FRONT : null;
}

export function backCol(player: PlayerId, col: number): number | null {
  if (player === 0) {
    return col === P1_FRONT ? P1_SUPPORT : null;
  }
  return col === P2_FRONT ? P2_SUPPORT : null;
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

export function getUnit(board: (UnitInstance | null)[][], col: number, row: number): UnitInstance | null {
  if (!inBounds(col, row)) return null;
  return board[col][row];
}

export function placeUnit(board: (UnitInstance | null)[][], unit: UnitInstance): void {
  board[unit.col][unit.row] = unit;
}

export function clearCell(board: (UnitInstance | null)[][], col: number, row: number): void {
  board[col][row] = null;
}

export function moveUnitOnBoard(board: (UnitInstance | null)[][], unit: UnitInstance, col: number, row: number): void {
  board[unit.col][unit.row] = null;
  unit.col = col;
  unit.row = row;
  board[col][row] = unit;
}

export function findUnit(board: (UnitInstance | null)[][], instanceId: string): UnitInstance | null {
  for (const col of board) {
    for (const cell of col) {
      if (cell?.instanceId === instanceId) return cell;
    }
  }
  return null;
}

export function unitsOf(board: (UnitInstance | null)[][], player: PlayerId): UnitInstance[] {
  const units: UnitInstance[] = [];
  for (const col of board) {
    for (const cell of col) {
      if (cell?.owner === player) units.push(cell);
    }
  }
  return units;
}

export function allUnits(board: (UnitInstance | null)[][]): UnitInstance[] {
  const units: UnitInstance[] = [];
  for (const col of board) {
    for (const cell of col) {
      if (cell) units.push(cell);
    }
  }
  return units;
}

export function countUnits(board: (UnitInstance | null)[][], player: PlayerId): number {
  return unitsOf(board, player).length;
}

export function enemyFirstInRow(
  board: (UnitInstance | null)[][],
  attacker: PlayerId,
  row: number,
): UnitInstance | null {
  if (attacker === 0) {
    return board[P2_FRONT][row] ?? board[P2_SUPPORT][row];
  }
  return board[P1_FRONT][row] ?? board[P1_SUPPORT][row];
}

export function enemySupportInRow(
  board: (UnitInstance | null)[][],
  attacker: PlayerId,
  row: number,
): UnitInstance | null {
  return attacker === 0 ? board[P2_SUPPORT][row] : board[P1_SUPPORT][row];
}

export function oppositeUnit(
  board: (UnitInstance | null)[][],
  attacker: PlayerId,
  row: number,
): UnitInstance | null {
  return enemyFirstInRow(board, attacker, row);
}

export function adjacentAllies(board: (UnitInstance | null)[][], unit: UnitInstance): UnitInstance[] {
  const found: UnitInstance[] = [];
  for (const other of unitsOf(board, unit.owner)) {
    const dCol = Math.abs(other.col - unit.col);
    const dRow = Math.abs(other.row - unit.row);
    if (other.instanceId !== unit.instanceId && dCol + dRow === 1) {
      found.push(other);
    }
  }
  return found;
}
