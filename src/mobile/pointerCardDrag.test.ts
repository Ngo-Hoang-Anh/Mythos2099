import { describe, expect, it } from "vitest";
import { resolvePointerDropZone, type HitNode } from "./pointerCardDrag";

function node( partial: {
  className?: string;
  tut?: string;
  parent?: HitNode;
}): HitNode {
  const self: HitNode = {
    getAttribute(name) {
      if (name === "data-tut") return partial.tut ?? null;
      return null;
    },
    closest(selector) {
      if (selector === ".cell" && partial.className === "cell") return self;
      if (selector === ".battlefield" && partial.className === "battlefield") return self;
      if (partial.parent) return partial.parent.closest?.(selector) ?? null;
      return null;
    },
    contains(other) {
      return other === self || Boolean(partial.parent && partial.parent === other);
    },
  };
  return self;
}

describe("resolvePointerDropZone", () => {
  it("prefers the own deck zone", () => {
    const deck = node({ className: "deck-zone" });
    const pile = node({ className: "deck-pile", parent: deck });
    // deck.contains(pile) — fix contains for children
    const deckEl: HitNode = {
      contains: (other) => other === deck || other === pile,
      closest: () => null,
      getAttribute: () => null,
    };
    expect(resolvePointerDropZone(0, 0, deckEl, () => [pile, deckEl])).toEqual({ kind: "deck" });
  });

  it("reads cell coordinates from data-tut", () => {
    const cell = node({ className: "cell", tut: "cell-1-3" });
    expect(resolvePointerDropZone(0, 0, null, () => [cell])).toEqual({
      kind: "cell",
      col: 1,
      row: 3,
    });
  });

  it("falls back to the battlefield", () => {
    const board = node({ className: "battlefield" });
    const fx = node({ className: "fx", parent: board });
    expect(resolvePointerDropZone(0, 0, null, () => [fx])).toEqual({ kind: "board" });
  });

  it("returns none when nothing matches", () => {
    expect(resolvePointerDropZone(0, 0, null, () => [node({})])).toEqual({ kind: "none" });
  });
});
