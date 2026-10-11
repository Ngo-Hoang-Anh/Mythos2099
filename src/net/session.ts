import type { AiDifficulty } from "../engine/aiDifficulty";
import { pickAiAction, runAiTurn } from "../engine/ai";
import { validateArmy } from "../engine/army";
import { applyAction, createMatch } from "../engine/match";
import { cloneState } from "../engine/state";
import type { Action, MatchState, PlayerId } from "../engine/types";
import type { RoomMode, RoomStatus, RoomSummary } from "./protocol";
import { projectMatch } from "./view";

export type SubmitResult =
  | { ok: true; waitingForCombatAck: boolean }
  | { ok: false; error: string };

/** In vs-AI, the computer is P1 (seat 0, goes first); the human is P2 (seat 1). */
export const AI_SEAT: PlayerId = 0;
export const HUMAN_SEAT: PlayerId = 1;

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomRoomId(random = Math.random): string {
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += ROOM_ALPHABET[Math.floor(random() * ROOM_ALPHABET.length)]!;
  }
  return id;
}

export class MatchRoom {
  readonly id: string;
  readonly mode: RoomMode;
  p1Army: number[];
  p2Army: number[] | null;
  hostUserId: string | null;
  guestUserId: string | null = null;
  state: MatchState | null = null;
  combatAcks = new Set<PlayerId>();
  /** Wall-clock ms of last gameplay activity (create/join/action/rejoin/…). */
  lastActivityAt = Date.now();

  constructor(
    id: string,
    mode: RoomMode,
    p1Army: number[],
    p2Army: number[] | null,
    hostUserId: string | null = null,
  ) {
    this.id = id;
    this.mode = mode;
    this.p1Army = p1Army;
    this.p2Army = p2Army;
    this.hostUserId = hostUserId;
  }

  touch(now = Date.now()): void {
    this.lastActivityAt = now;
  }

  waitingForPeer(): boolean {
    return this.mode === "pvp" && this.state === null;
  }

  isFinished(): boolean {
    if (!this.state) return false;
    return this.state.winner !== null && !this.state.combatPlayback;
  }

  isActive(): boolean {
    return !this.isFinished();
  }

  occupies(userId: string): boolean {
    if (this.hostUserId === userId) return true;
    if (this.mode === "pvp" && this.guestUserId === userId) return true;
    return false;
  }

  seatOf(userId: string): PlayerId | null {
    if (this.hostUserId === userId) {
      // Human hosts vs AI as second player.
      return this.mode === "ai" ? HUMAN_SEAT : 0;
    }
    if (this.mode === "pvp" && this.guestUserId === userId) return 1;
    return null;
  }

  seatsFor(userId: string): PlayerId[] {
    if (this.mode === "hotseat" && this.hostUserId === userId) return [0, 1];
    const seat = this.seatOf(userId);
    return seat === null ? [] : [seat];
  }

  status(): RoomStatus {
    if (this.waitingForPeer()) return "waiting";
    if (this.isFinished()) return "gameover";
    return "playing";
  }

  viewFor(seat: PlayerId): MatchState | null {
    if (!this.state) return null;
    if (this.mode === "hotseat") {
      const next = cloneState(this.state);
      delete next.logSink;
      next.seed = 0;
      next.rngState = 0;
      next.idSeq = 0;
      return next;
    }
    return projectMatch(this.state, seat);
  }

  seatForView(seat: PlayerId): PlayerId {
    if (!this.state || this.mode !== "hotseat") return seat;
    return this.state.currentPlayer;
  }

  start(seed: number, aiDifficulty: AiDifficulty = "easy"): string | null {
    if (this.state) return "Match already started";
    const p2 = this.p2Army;
    if (!p2) return "P2 army is missing";
    const err1 = validateArmy(this.p1Army);
    if (err1) return `P1: ${err1}`;
    const err2 = validateArmy(p2);
    if (err2) return `P2: ${err2}`;
    this.state = createMatch(
      this.p1Army,
      p2,
      seed,
      this.mode === "ai" && aiDifficulty !== "easy"
        ? { aiDifficulty, aiPlayer: AI_SEAT }
        : undefined,
    );
    this.combatAcks.clear();
    return null;
  }

  joinP2(army: number[], guestUserId: string | null = null): string | null {
    if (this.mode !== "pvp") return "This room is not waiting for a second player";
    if (this.state) return "Match already started";
    const err = validateArmy(army);
    if (err) return err;
    this.p2Army = army;
    if (guestUserId) this.guestUserId = guestUserId;
    return this.start(Date.now() % 1_000_000);
  }

  submit(actor: PlayerId, action: Action): SubmitResult {
    if (!this.state) return { ok: false, error: "Waiting for opponent" };

    if (action.type === "endEngagement") {
      return this.submitCombatAck(actor);
    }

    if (action.type === "surrender") {
      if (this.mode === "ai" && actor === AI_SEAT) {
        return { ok: false, error: "That seat is the AI" };
      }
      return this.applyAndMaybeAi({ type: "surrender", by: actor });
    }

    if (this.state.phase === "engagement") {
      return { ok: false, error: "Combat is resolving" };
    }
    if (actor !== this.state.currentPlayer) {
      return { ok: false, error: "Not your turn" };
    }
    if (this.mode === "ai" && actor === AI_SEAT) {
      return { ok: false, error: "That seat is the AI" };
    }

    return this.applyAndMaybeAi(action);
  }

  /**
   * Advance the AI by a single action so the client can play fx / combat between steps.
   * Safe to call when it is not the AI's turn (no-op).
   */
  continueAi(): SubmitResult {
    if (!this.state) return { ok: false, error: "Waiting for opponent" };
    if (this.mode !== "ai") return { ok: false, error: "Not an AI match" };
    if (this.state.winner !== null) return { ok: true, waitingForCombatAck: false };
    if (this.state.phase === "engagement") return { ok: true, waitingForCombatAck: false };
    if (this.state.currentPlayer !== AI_SEAT) return { ok: true, waitingForCombatAck: false };

    this.state = stepAiOnce(this.state);
    return { ok: true, waitingForCombatAck: false };
  }

  private submitCombatAck(actor: PlayerId): SubmitResult {
    if (!this.state) return { ok: false, error: "Waiting for opponent" };
    if (this.state.phase !== "engagement" && !(this.state.phase === "gameover" && this.state.combatPlayback)) {
      return { ok: false, error: "Not in Engagement" };
    }
    this.combatAcks.add(actor);
    if (this.combatAcks.size < this.combatAcksNeeded()) {
      return { ok: true, waitingForCombatAck: true };
    }
    this.combatAcks.clear();
    return this.applyAndMaybeAi({ type: "endEngagement" });
  }

  combatAcksNeeded(): number {
    return this.mode === "pvp" ? 2 : 1;
  }

  waitingForCombatAck(): boolean {
    return Boolean(this.state?.combatPlayback) && this.combatAcks.size > 0 && this.combatAcks.size < this.combatAcksNeeded();
  }

  /** Unblocks a room whose remaining combat acks never arrived (background tab, dropped socket). */
  expireMissingCombatAcks(): SubmitResult {
    if (!this.state) return { ok: false, error: "Waiting for opponent" };
    if (this.state.phase !== "engagement" && !(this.state.phase === "gameover" && this.state.combatPlayback)) {
      return { ok: false, error: "Not in Engagement" };
    }
    this.combatAcks.clear();
    return this.applyAndMaybeAi({ type: "endEngagement" });
  }

  private applyAndMaybeAi(action: Action): SubmitResult {
    if (!this.state) return { ok: false, error: "Waiting for opponent" };
    const applied = applyAction(this.state, action);
    if (!applied.ok) return applied;
    this.state = this.maybeStepAi(applied.state);
    return { ok: true, waitingForCombatAck: false };
  }

  /** One AI action only — client calls continueAi after animations. */
  private maybeStepAi(state: MatchState): MatchState {
    if (this.mode !== "ai") return state;
    if (state.winner !== null) return state;
    if (state.phase === "engagement") return state;
    if (state.currentPlayer !== AI_SEAT) return state;
    return stepAiOnce(state);
  }
}

/** Apply a single AI decision (used by the room and tests). */
export function stepAiOnce(state: MatchState): MatchState {
  const action = pickAiAction(state);
  if (!action) return state;
  const result = applyAction(state, action);
  if (!result.ok) {
    const fallback: Action =
      state.phase === "deployment" ? { type: "endDeployment" } : { type: "endManeuver" };
    const ended = applyAction(state, fallback);
    return ended.ok ? ended.state : state;
  }
  return result.state;
}

export function createRoom(
  mode: RoomMode,
  p1Army: number[],
  p2Army: number[] | null,
  id = randomRoomId(),
  hostUserId: string | null = null,
  aiDifficulty: AiDifficulty = "easy",
): { room: MatchRoom; error: string | null } {
  // Client sends (humanArmy, aiArmy). For AI mode the computer goes first, so swap seats.
  const firstArmy = mode === "ai" && p2Army ? p2Army : p1Army;
  const secondArmy = mode === "ai" && p2Army ? p1Army : p2Army;

  const err1 = validateArmy(firstArmy);
  if (err1) return { room: new MatchRoom(id, mode, firstArmy, secondArmy, hostUserId), error: `P1: ${err1}` };
  if (mode !== "pvp") {
    if (!secondArmy) return { room: new MatchRoom(id, mode, firstArmy, null, hostUserId), error: "P2 army is required" };
    const err2 = validateArmy(secondArmy);
    if (err2) return { room: new MatchRoom(id, mode, firstArmy, secondArmy, hostUserId), error: `P2: ${err2}` };
  }
  const room = new MatchRoom(id, mode, firstArmy, secondArmy, hostUserId);
  if (mode !== "pvp") {
    const started = room.start(Date.now() % 1_000_000, mode === "ai" ? aiDifficulty : "easy");
    if (started) return { room, error: started };
  }
  return { room, error: null };
}

export function summarizeRoom(
  room: MatchRoom,
  viewerUserId: string,
  nameOf: (userId: string | null) => string | null,
): RoomSummary {
  const guestName =
    room.mode === "ai" ? "AI" : room.mode === "hotseat" ? nameOf(room.hostUserId) : nameOf(room.guestUserId);
  return {
    id: room.id,
    mode: room.mode,
    hostName: nameOf(room.hostUserId) ?? "Host",
    guestName,
    status: room.status(),
    youSeated: room.occupies(viewerUserId),
    phase: room.state?.phase,
    turn: room.state?.turn,
  };
}

// Re-export for tests that still run a full AI turn offline.
export { runAiTurn };
