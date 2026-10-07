import { describe, expect, it } from "vitest";
import { emptyBoard, forwardCol, inBounds, isOwnCol } from "./board";
import { COLS, P1_FRONT, P2_FRONT, ROWS } from "./types";

describe("board geometry", () => {
  it("is 4 columns by 5 rows", () => {
    const board = emptyBoard();
    expect(board).toHaveLength(COLS);
    expect(board[0]).toHaveLength(ROWS);
  });

  it("does not allow crossing the border", () => {
    expect(isOwnCol(0, P2_FRONT)).toBe(false);
    expect(isOwnCol(1, P1_FRONT)).toBe(false);
    expect(forwardCol(0, P1_FRONT)).toBeNull();
    expect(forwardCol(1, P2_FRONT)).toBeNull();
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(4, 0)).toBe(false);
  });
});
