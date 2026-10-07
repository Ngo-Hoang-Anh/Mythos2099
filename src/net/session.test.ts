import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import { AI_SEAT, HUMAN_SEAT, createRoom, MatchRoom } from "./session";

describe("MatchRoom", () => {
  it("lets the AI go first; human is second seat", () => {
    const { room, error } = createRoom("ai", DEFAULT_P1, DEFAULT_P2, "AI01", "host");
    expect(error).toBeNull();
    expect(room.seatOf("host")).toBe(HUMAN_SEAT);
    expect(room.state?.currentPlayer).toBe(AI_SEAT);
    expect(room.state?.players[AI_SEAT].army).toEqual(DEFAULT_P2);
    expect(room.state?.players[HUMAN_SEAT].army).toEqual(DEFAULT_P1);
  });

  it("steps AI one action at a time via continueAi", () => {
    const { room, error } = createRoom("ai", DEFAULT_P1, DEFAULT_P2, "AI02", "host");
    expect(error).toBeNull();
    expect(room.state?.currentPlayer).toBe(AI_SEAT);
    const beforeCp = room.state!.players[AI_SEAT].commandPoints;
    const beforeUndeployed = room.state!.players[AI_SEAT].undeployed.length;
    expect(room.continueAi().ok).toBe(true);
    // One step should change something (deploy or end phase) without finishing the whole turn.
    const after = room.state!;
    expect(
      after.players[AI_SEAT].commandPoints !== beforeCp ||
        after.players[AI_SEAT].undeployed.length !== beforeUndeployed ||
        after.phase !== "deployment" ||
        after.currentPlayer !== AI_SEAT,
    ).toBe(true);
  });

  it("runs AI engagement after human finishes their engagement ack", () => {
    const { room, error } = createRoom("ai", DEFAULT_P1, DEFAULT_P2, "AI03", "host");
    expect(error).toBeNull();
    // Finish AI opening turn by stepping until human to move (or engagement).
    let guard = 0;
    while (room.state && room.state.currentPlayer === AI_SEAT && guard < 40) {
      if (room.state.phase === "engagement") break;
      expect(room.continueAi().ok).toBe(true);
      guard += 1;
    }
    if (room.state?.phase === "engagement") {
      expect(room.submit(HUMAN_SEAT, { type: "endEngagement" }).ok).toBe(true);
    }
    expect(room.state).toBeTruthy();
  });

  it("rejects actions from the player who is not to move", () => {
    const { room } = createRoom("hotseat", DEFAULT_P1, DEFAULT_P2);
    const result = room.submit(1, { type: "endDeployment" });
    expect(result).toEqual({ ok: false, error: "Not your turn" });
  });

  it("waits for both PvP combat acks before ending engagement", () => {
    const room = new MatchRoom("TEST", "pvp", DEFAULT_P1, DEFAULT_P2);
    expect(room.start(3)).toBeNull();
    expect(room.submit(0, { type: "endDeployment" }).ok).toBe(true);

    let guard = 0;
    while (room.state && room.state.phase !== "engagement" && guard < 20) {
      const action =
        room.state.phase === "deployment" ? { type: "endDeployment" as const } : { type: "endManeuver" as const };
      const result = room.submit(room.state.currentPlayer, action);
      expect(result.ok).toBe(true);
      guard += 1;
    }
    expect(room.state?.phase).toBe("engagement");
    expect(room.state?.combatPlayback).not.toBeNull();

    const first = room.submit(0, { type: "endEngagement" });
    expect(first).toEqual({ ok: true, waitingForCombatAck: true });
    expect(room.state?.phase).toBe("engagement");
    expect(room.state?.combatPlayback).not.toBeNull();

    const second = room.submit(1, { type: "endEngagement" });
    expect(second).toEqual({ ok: true, waitingForCombatAck: false });
    expect(room.state?.combatPlayback).toBeNull();
    expect(room.state?.currentPlayer).toBe(1);
  });

  it("force-ends engagement when a PvP combat ack never arrives", () => {
    const room = new MatchRoom("TEST", "pvp", DEFAULT_P1, DEFAULT_P2);
    expect(room.start(3)).toBeNull();
    expect(room.submit(0, { type: "endDeployment" }).ok).toBe(true);

    let guard = 0;
    while (room.state && room.state.phase !== "engagement" && guard < 20) {
      const action =
        room.state.phase === "deployment" ? { type: "endDeployment" as const } : { type: "endManeuver" as const };
      expect(room.submit(room.state.currentPlayer, action).ok).toBe(true);
      guard += 1;
    }
    expect(room.submit(0, { type: "endEngagement" })).toEqual({ ok: true, waitingForCombatAck: true });
    expect(room.waitingForCombatAck()).toBe(true);

    const expired = room.expireMissingCombatAcks();
    expect(expired).toEqual({ ok: true, waitingForCombatAck: false });
    expect(room.state?.combatPlayback).toBeNull();
    expect(room.waitingForCombatAck()).toBe(false);
  });

  it("keeps PvP rooms idle until P2 joins with a legal army", () => {
    const { room, error } = createRoom("pvp", DEFAULT_P1, null);
    expect(error).toBeNull();
    expect(room.waitingForPeer()).toBe(true);
    expect(room.joinP2(DEFAULT_P2)).toBeNull();
    expect(room.waitingForPeer()).toBe(false);
    expect(room.state?.phase).toBe("deployment");
  });

  it("does not fog the hotseat snapshot because both seats share one screen", () => {
    const { room } = createRoom("hotseat", DEFAULT_P1, DEFAULT_P2);
    const view = room.viewFor(0);
    expect(view?.players[0].hand.every((card) => card.templateId !== "hidden")).toBe(true);
    expect(view?.players[1].hand.every((card) => card.templateId !== "hidden")).toBe(true);
  });

  it("lets a PvP player surrender on the opponent's turn", () => {
    const room = new MatchRoom("TEST", "pvp", DEFAULT_P1, DEFAULT_P2);
    expect(room.start(3)).toBeNull();
    expect(room.state?.currentPlayer).toBe(0);
    const result = room.submit(1, { type: "surrender" });
    expect(result.ok).toBe(true);
    expect(room.state?.winner).toBe(0);
    expect(room.state?.winReason).toBe("surrender");
    expect(room.state?.phase).toBe("gameover");
    expect(room.isFinished()).toBe(true);
  });
});
