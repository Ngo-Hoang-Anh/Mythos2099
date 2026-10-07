import { describe, expect, it } from "vitest";
import type { CombatPlayback } from "../engine/types";
import { heldPlaybackAfterState } from "./combatPlayback";

function playback(lane: number): CombatPlayback {
  return {
    steps: [{ kind: "lane", lane, color: "green" }],
    initialBoard: [],
    initialHq: [20, 20],
  };
}

describe("heldPlaybackAfterState", () => {
  it("keeps the same combat object so VFX are not restarted on a PvP ack wait", () => {
    const first = playback(0);
    const resent = playback(0);
    const result = heldPlaybackAfterState(first, resent);
    expect(result.held).toBe(first);
    expect(result.resetAck).toBe(false);
  });

  it("resets the ack latch when AI combat replaces the player's combat in one push", () => {
    const playerCombat = playback(0);
    const aiCombat = playback(2);
    const result = heldPlaybackAfterState(playerCombat, aiCombat);
    expect(result.held).toBe(aiCombat);
    expect(result.resetAck).toBe(true);
  });

  it("clears the latch when combat ends", () => {
    expect(heldPlaybackAfterState(playback(0), null)).toEqual({ held: null, resetAck: true });
  });
});
