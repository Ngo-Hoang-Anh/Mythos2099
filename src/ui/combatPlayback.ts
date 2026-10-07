import type { CombatPlayback } from "../engine/types";

export function samePlayback(a: CombatPlayback, b: CombatPlayback): boolean {
  return JSON.stringify(a.steps) === JSON.stringify(b.steps) && a.initialHq[0] === b.initialHq[0] && a.initialHq[1] === b.initialHq[1];
}

/** AI mode can replace P1 combat with P2 combat in one state push. The ack latch must reset then. */
export function heldPlaybackAfterState(
  prev: CombatPlayback | null,
  next: CombatPlayback | null,
): { held: CombatPlayback | null; resetAck: boolean } {
  if (!next) return { held: null, resetAck: true };
  if (prev && samePlayback(prev, next)) return { held: prev, resetAck: false };
  return { held: next, resetAck: true };
}
