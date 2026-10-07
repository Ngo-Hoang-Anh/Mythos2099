import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import { toPersistedState } from "../engine/state";
import { createRoom } from "./session";
import { restoreRoom, snapshotRoom } from "../../server/roomStore";

describe("room persistence", () => {
  it("round-trips an AI match without logSink", () => {
    const { room, error } = createRoom("ai", DEFAULT_P1, DEFAULT_P2, "SAVE", "user-1");
    expect(error).toBeNull();
    expect(room.state).toBeTruthy();
    // Nudge state so snapshot is not just the pristine create payload.
    expect(room.continueAi().ok).toBe(true);

    const snap = snapshotRoom(room);
    expect(snap.state?.logSink).toBeUndefined();
    expect(snap.hostUserId).toBe("user-1");
    expect(snap.lastActivityAt).toBeTypeOf("number");
    const restored = restoreRoom(snap);
    expect(restored.state?.phase).toBe(room.state?.phase);
    expect(restored.state?.currentPlayer).toBe(room.state?.currentPlayer);
    expect(restored.occupies("user-1")).toBe(true);
    expect(restored.lastActivityAt).toBe(snap.lastActivityAt);
    expect(toPersistedState(restored.state!).logSink).toBeUndefined();
  });
});
