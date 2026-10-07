export type PointerDropZone =
  | { kind: "deck" }
  | { kind: "cell"; col: number; row: number }
  | { kind: "board" }
  | { kind: "none" };

/** Minimal DOM surface for hit-testing (works in node tests without jsdom). */
export type HitNode = {
  closest?: (selector: string) => HitNode | null;
  contains?: (other: HitNode | Node | null) => boolean;
  getAttribute?: (name: string) => string | null;
};

const CELL_TUT = /^cell-(\d+)-(\d+)$/;

function isDeckHit(node: HitNode, deckEl: HitNode | null): boolean {
  if (!deckEl) return false;
  if (node === deckEl) return true;
  return Boolean(deckEl.contains?.(node));
}

/** Resolve where a pointer card drag ended (ghost must use pointer-events: none). */
export function resolvePointerDropZone(
  clientX: number,
  clientY: number,
  deckEl: HitNode | null,
  hitTest: (x: number, y: number) => HitNode[] = (x, y) =>
    typeof document !== "undefined"
      ? (document.elementsFromPoint(x, y) as unknown as HitNode[])
      : [],
): PointerDropZone {
  for (const node of hitTest(clientX, clientY)) {
    if (isDeckHit(node, deckEl)) return { kind: "deck" };

    const cell = node.closest?.(".cell") ?? null;
    if (cell) {
      const tut = cell.getAttribute?.("data-tut") ?? "";
      const m = CELL_TUT.exec(tut);
      if (m) return { kind: "cell", col: Number(m[1]), row: Number(m[2]) };
    }

    if (node.closest?.(".battlefield")) return { kind: "board" };
  }
  return { kind: "none" };
}

export const POINTER_DRAG_SLOP_PX = 8;
