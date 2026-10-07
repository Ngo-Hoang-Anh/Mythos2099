import type { DragEvent } from "react";

export type DragKind = "card" | "unit";

export type DragPayload = { kind: DragKind; id: string };

export function writeDrag(event: DragEvent, payload: DragPayload): void {
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "copyMove";
}

export function readDrag(event: DragEvent): DragPayload | null {
  const raw = event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DragPayload;
    if (parsed.kind === "card" || parsed.kind === "unit") return parsed;
  } catch {
    return null;
  }
  return null;
}

export function allowDrop(event: DragEvent): void {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

export function centerOf(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
