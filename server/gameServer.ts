import type { Account } from "./accounts";
import { AccountStore } from "./accounts";
import { restoreRoom, RoomStore } from "./roomStore";
import type { Action } from "../src/engine/types";
import type { ClientMessage, ResumeInfo, RoomMode, RoomSummary, ServerMessage } from "../src/net/protocol";
import { isAiDifficulty } from "../src/engine/aiDifficulty";
import { createRoom, MatchRoom, randomRoomId, summarizeRoom } from "../src/net/session";

export interface ServerSocket {
  send(data: string): void;
  readyState: number;
}

const OPEN = 1;
const COMBAT_ACK_GRACE_MS = 20_000;
export const DEFAULT_ROOM_IDLE_MS = 30 * 60 * 1000;
export const DEFAULT_ROOM_CLEANUP_MS = 60 * 1000;

export interface GameServerOptions {
  roomIdleMs?: number;
  cleanupIntervalMs?: number;
  now?: () => number;
}

interface Conn {
  userId: string | null;
  roomId: string | null;
}

export class GameServer {
  readonly rooms = new Map<string, MatchRoom>();
  private readonly connections = new Map<ServerSocket, Conn>();
  private readonly combatAckTimers = new Map<MatchRoom, ReturnType<typeof setTimeout>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private readonly roomIdleMs: number;
  private readonly cleanupIntervalMs: number;
  private readonly now: () => number;

  constructor(
    readonly accounts: AccountStore,
    private readonly roomStore: RoomStore,
    options: GameServerOptions = {},
  ) {
    this.roomIdleMs = options.roomIdleMs ?? DEFAULT_ROOM_IDLE_MS;
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? DEFAULT_ROOM_CLEANUP_MS;
    this.now = options.now ?? Date.now;
    for (const snap of roomStore.load()) {
      const room = restoreRoom(snap);
      // Skip orphans whose host account no longer exists (e.g. guest wipe after restart).
      if (room.hostUserId && !accounts.byId(room.hostUserId)) continue;
      if (room.guestUserId && !accounts.byId(room.guestUserId) && room.mode === "pvp" && !room.waitingForPeer()) {
        // P2 was a missing guest mid-match — drop the room rather than leave a half seat.
        continue;
      }
      this.rooms.set(room.id, room);
    }
  }

  startCleanupLoop(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.purgeIdleRooms(), this.cleanupIntervalMs);
    if (typeof this.cleanupTimer === "object" && "unref" in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  stopCleanupLoop(): void {
    if (!this.cleanupTimer) return;
    clearInterval(this.cleanupTimer);
    this.cleanupTimer = null;
  }

  /** Removes rooms with no activity for `roomIdleMs`. Exposed for tests. */
  purgeIdleRooms(now = this.now()): number {
    const cutoff = now - this.roomIdleMs;
    const idle = [...this.rooms.values()].filter((room) => room.lastActivityAt <= cutoff);
    for (const room of idle) {
      this.destroyRoom(room, "Room closed due to inactivity");
    }
    this.purgeOrphanGuests();
    return idle.length;
  }

  connect(ws: ServerSocket): void {
    this.connections.set(ws, { userId: null, roomId: null });
  }

  disconnect(ws: ServerSocket): void {
    this.leaveRoom(ws, false);
    this.connections.delete(ws);
  }

  handleMessage(ws: ServerSocket, raw: string): void {
    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      this.send(ws, { type: "error", error: "Invalid message" });
      return;
    }
    switch (message.type) {
      case "register":
        this.handleRegister(ws, message.username, message.password);
        break;
      case "login":
        this.handleLogin(ws, message.username, message.password);
        break;
      case "guest":
        this.handleGuest(ws);
        break;
      case "auth":
        this.handleAuth(ws, message.token);
        break;
      case "listRooms":
        this.requireUser(ws, (user) => this.sendRooms(ws, user));
        break;
      case "createRoom":
        this.requireUser(ws, (user) =>
          this.handleCreate(ws, user, message.mode, message.p1Army, message.p2Army, message.aiDifficulty),
        );
        break;
      case "join":
        this.requireUser(ws, (user) => this.handleJoin(ws, user, message.roomId, message.army));
        break;
      case "rejoin":
        this.requireUser(ws, (user) => this.handleRejoin(ws, user));
        break;
      case "action":
        this.requireUser(ws, (user) => this.handleAction(ws, user, message.action));
        break;
      case "continueAi":
        this.requireUser(ws, (user) => this.handleContinueAi(ws, user));
        break;
      case "leave":
        this.leaveRoom(ws, true);
        break;
      case "abandon":
        this.requireUser(ws, (user) => this.handleAbandon(ws, user, message.roomId));
        break;
      default:
        this.send(ws, { type: "error", error: "Unknown message" });
    }
  }

  private touch(room: MatchRoom): void {
    room.touch(this.now());
  }

  private persist(): void {
    this.roomStore.save(this.rooms.values());
  }

  private send(ws: ServerSocket, message: ServerMessage): void {
    if (ws.readyState === OPEN) ws.send(JSON.stringify(message));
  }

  private conn(ws: ServerSocket): Conn | undefined {
    return this.connections.get(ws);
  }

  private requireUser(ws: ServerSocket, fn: (user: Account) => void): void {
    const conn = this.conn(ws);
    const user = conn?.userId ? this.accounts.byId(conn.userId) : undefined;
    if (!user) {
      this.send(ws, { type: "error", error: "Sign in first" });
      return;
    }
    fn(user);
  }

  private uniqueRoomId(): string {
    for (let i = 0; i < 20; i++) {
      const id = randomRoomId();
      if (!this.rooms.has(id)) return id;
    }
    return randomRoomId() + randomRoomId();
  }

  private nameOf = (userId: string | null): string | null => {
    if (!userId) return null;
    return this.accounts.byId(userId)?.username ?? null;
  };

  private resumeFor(user: Account): ResumeInfo | null {
    const room = this.roomForUser(user.id);
    if (!room) return null;
    const seats = room.seatsFor(user.id);
    const you = room.seatForView(seats[0] ?? 0);
    return { roomId: room.id, mode: room.mode, you, waitingForPeer: room.waitingForPeer() };
  }

  private roomForUser(userId: string): MatchRoom | undefined {
    return [...this.rooms.values()].find((room) => room.occupies(userId));
  }

  private activeRoomForUser(userId: string): MatchRoom | undefined {
    return [...this.rooms.values()].find((room) => room.occupies(userId) && room.isActive());
  }

  private roomsVisibleTo(userId: string): RoomSummary[] {
    return [...this.rooms.values()]
      .filter((room) => room.occupies(userId) || (room.mode === "pvp" && room.waitingForPeer()))
      .map((room) => summarizeRoom(room, userId, this.nameOf));
  }

  private sendRooms(ws: ServerSocket, user: Account): void {
    this.send(ws, { type: "rooms", rooms: this.roomsVisibleTo(user.id) });
  }

  private broadcastLobby(): void {
    for (const [ws, conn] of this.connections) {
      if (!conn.userId || conn.roomId) continue;
      const user = this.accounts.byId(conn.userId);
      if (user) this.sendRooms(ws, user);
    }
  }

  private authed(ws: ServerSocket, account: Account): void {
    const conn = this.conn(ws);
    if (!conn) return;
    conn.userId = account.id;
    this.send(ws, {
      type: "authed",
      username: account.username,
      token: account.token,
      resume: this.resumeFor(account),
      guest: account.guest === true ? true : undefined,
    });
    this.sendRooms(ws, account);
  }

  private handleRegister(ws: ServerSocket, username: string, password: string): void {
    const result = this.accounts.register(username, password);
    if (!result.ok) {
      this.send(ws, { type: "error", error: result.error });
      return;
    }
    this.authed(ws, result.account);
  }

  private handleLogin(ws: ServerSocket, username: string, password: string): void {
    const result = this.accounts.login(username, password);
    if (!result.ok) {
      this.send(ws, { type: "error", error: result.error });
      return;
    }
    this.authed(ws, result.account);
  }

  private handleGuest(ws: ServerSocket): void {
    const account = this.accounts.createGuest();
    this.authed(ws, account);
  }

  private handleAuth(ws: ServerSocket, token: string): void {
    const account = this.accounts.byToken(token);
    if (!account) {
      this.send(ws, { type: "error", error: "Invalid session" });
      return;
    }
    this.authed(ws, account);
  }

  private handleCreate(
    ws: ServerSocket,
    user: Account,
    mode: RoomMode,
    p1Army: number[],
    p2Army?: number[],
    aiDifficulty?: string,
  ): void {
    if (this.activeRoomForUser(user.id)) {
      this.send(ws, { type: "error", error: "Finish or abandon your current match first" });
      return;
    }
    if (mode === "ai" && aiDifficulty !== undefined && !isAiDifficulty(aiDifficulty)) {
      this.send(ws, { type: "error", error: "Unknown AI difficulty" });
      return;
    }
    const { room, error } = createRoom(
      mode,
      p1Army,
      p2Army ?? null,
      this.uniqueRoomId(),
      user.id,
      mode === "ai" && isAiDifficulty(aiDifficulty) ? aiDifficulty : "easy",
    );
    if (error) {
      this.send(ws, { type: "error", error });
      return;
    }
    this.touch(room);
    this.rooms.set(room.id, room);
    this.persist();
    this.enterRoom(ws, user, room);
    this.broadcastLobby();
  }

  private handleJoin(ws: ServerSocket, user: Account, roomId: string, army: number[]): void {
    const room = this.rooms.get(roomId.trim().toUpperCase());
    if (!room) {
      this.send(ws, { type: "error", error: "Room not found" });
      return;
    }
    if (room.occupies(user.id)) {
      this.touch(room);
      this.enterRoom(ws, user, room);
      this.pushRoom(room);
      return;
    }
    if (this.activeRoomForUser(user.id)) {
      this.send(ws, { type: "error", error: "Finish or abandon your current match first" });
      return;
    }
    if (!room.waitingForPeer()) {
      this.send(ws, { type: "error", error: "Room is not accepting a second player" });
      return;
    }
    if (room.guestUserId) {
      this.send(ws, { type: "error", error: "Seat P2 is already taken" });
      return;
    }
    const started = room.joinP2(army, user.id);
    if (started) {
      this.send(ws, { type: "error", error: started });
      return;
    }
    this.touch(room);
    this.persist();
    this.enterRoom(ws, user, room);
    this.pushRoom(room);
    this.broadcastLobby();
  }

  private handleRejoin(ws: ServerSocket, user: Account): void {
    const room = this.roomForUser(user.id);
    if (!room) {
      this.send(ws, { type: "error", error: "No match to resume" });
      return;
    }
    this.touch(room);
    this.enterRoom(ws, user, room);
  }

  private handleAction(ws: ServerSocket, user: Account, action: Action): void {
    const conn = this.conn(ws);
    if (!conn?.roomId) {
      this.send(ws, { type: "error", error: "Join a room first" });
      return;
    }
    const room = this.rooms.get(conn.roomId);
    if (!room) {
      this.send(ws, { type: "error", error: "Room is gone" });
      return;
    }
    const seats = room.seatsFor(user.id);
    if (seats.length === 0) {
      this.send(ws, { type: "error", error: "You are not in this room" });
      return;
    }
    const actor = seats.length === 2 && room.state ? room.state.currentPlayer : (seats[0] ?? 0);
    const result = room.submit(actor, action);
    if (!result.ok) {
      this.send(ws, { type: "error", error: result.error });
      return;
    }
    this.touch(room);
    this.syncCombatAckTimer(room);
    this.persist();
    this.pushRoom(room);
    if (room.isFinished()) {
      // Solo AI matches have nothing to resume; close immediately so surrender/HQ
      // wins do not leave a zombie room in the lobby.
      if (room.mode === "ai") {
        this.destroyRoom(room, null);
        return;
      }
      this.broadcastLobby();
    }
  }

  private handleContinueAi(ws: ServerSocket, user: Account): void {
    const conn = this.conn(ws);
    if (!conn?.roomId) {
      this.send(ws, { type: "error", error: "Join a room first" });
      return;
    }
    const room = this.rooms.get(conn.roomId);
    if (!room) {
      this.send(ws, { type: "error", error: "Room is gone" });
      return;
    }
    if (!room.occupies(user.id)) {
      this.send(ws, { type: "error", error: "You are not in this room" });
      return;
    }
    const result = room.continueAi();
    if (!result.ok) {
      this.send(ws, { type: "error", error: result.error });
      return;
    }
    this.touch(room);
    this.syncCombatAckTimer(room);
    this.persist();
    this.pushRoom(room);
    if (room.isFinished() && room.mode === "ai") {
      this.destroyRoom(room, null);
    }
  }

  private handleAbandon(ws: ServerSocket, user: Account, roomId?: string): void {
    const room = roomId
      ? this.rooms.get(roomId.trim().toUpperCase())
      : this.conn(ws)?.roomId
        ? this.rooms.get(this.conn(ws)!.roomId!)
        : this.roomForUser(user.id);
    if (!room || !room.occupies(user.id)) {
      this.send(ws, { type: "error", error: "No match to abandon" });
      return;
    }
    this.destroyRoom(room, "Match abandoned", ws);
  }

  private destroyRoom(room: MatchRoom, notice: string | null, except?: ServerSocket): void {
    this.clearCombatAckTimer(room);
    this.rooms.delete(room.id);
    this.persist();
    for (const [peer, conn] of this.connections) {
      if (conn.roomId !== room.id) continue;
      conn.roomId = null;
      const account = conn.userId ? this.accounts.byId(conn.userId) : undefined;
      if (notice && peer !== except) this.send(peer, { type: "error", error: notice });
      if (account) this.sendRooms(peer, account);
    }
    this.broadcastLobby();
  }

  private userIdsConnected(): Set<string> {
    const ids = new Set<string>();
    for (const conn of this.connections.values()) {
      if (conn.userId) ids.add(conn.userId);
    }
    return ids;
  }

  private purgeOrphanGuests(): void {
    const seated = new Set<string>();
    for (const room of this.rooms.values()) {
      if (room.hostUserId) seated.add(room.hostUserId);
      if (room.guestUserId) seated.add(room.guestUserId);
    }
    const online = this.userIdsConnected();
    for (const account of this.accounts.listGuests()) {
      if (seated.has(account.id) || online.has(account.id)) continue;
      this.accounts.removeGuest(account.id);
    }
  }

  private closeIfFinishedAndEmpty(room: MatchRoom): boolean {
    if (!room.isFinished() || this.socketsInRoom(room).length > 0) return false;
    this.destroyRoom(room, null);
    return true;
  }

  private enterRoom(ws: ServerSocket, user: Account, room: MatchRoom): void {
    this.leaveRoom(ws, false);
    const conn = this.conn(ws);
    if (!conn) return;
    conn.roomId = room.id;
    this.pushTo(ws, user, room);
  }

  private leaveRoom(ws: ServerSocket, notifySelf: boolean): void {
    const conn = this.conn(ws);
    if (!conn?.roomId) return;
    const room = this.rooms.get(conn.roomId);
    const userId = conn.userId;
    conn.roomId = null;
    if (!room) return;
    const seats = userId ? room.seatsFor(userId) : [];
    if (room.state?.combatPlayback) {
      for (const seat of seats) room.submit(seat, { type: "endEngagement" });
      this.touch(room);
      this.syncCombatAckTimer(room);
      this.persist();
    }
    if (this.closeIfFinishedAndEmpty(room)) {
      if (notifySelf && userId) {
        const user = this.accounts.byId(userId);
        if (user) this.sendRooms(ws, user);
      }
      return;
    }
    this.pushRoom(room);
    for (const [peer, peerConn] of this.connections) {
      if (peer === ws || peerConn.roomId !== room.id) continue;
      const username = userId ? this.nameOf(userId) ?? undefined : undefined;
      this.send(peer, { type: "peerStatus", connected: false, username });
    }
    if (notifySelf && userId) {
      const user = this.accounts.byId(userId);
      if (user) this.sendRooms(ws, user);
    }
    this.broadcastLobby();
  }

  private socketsInRoom(room: MatchRoom): ServerSocket[] {
    const list: ServerSocket[] = [];
    for (const [ws, conn] of this.connections) {
      if (conn.roomId === room.id) list.push(ws);
    }
    return list;
  }

  private userConnectedInRoom(room: MatchRoom, userId: string | null): boolean {
    if (!userId) return false;
    for (const [, conn] of this.connections) {
      if (conn.roomId === room.id && conn.userId === userId) return true;
    }
    return false;
  }

  private peerConnected(room: MatchRoom, viewerUserId: string): boolean {
    if (room.mode !== "pvp") return true;
    const other = room.hostUserId === viewerUserId ? room.guestUserId : room.hostUserId;
    return this.userConnectedInRoom(room, other);
  }

  private pushRoom(room: MatchRoom): void {
    for (const ws of this.socketsInRoom(room)) {
      const conn = this.conn(ws);
      const user = conn?.userId ? this.accounts.byId(conn.userId) : undefined;
      if (user) this.pushTo(ws, user, room);
    }
  }

  private pushTo(ws: ServerSocket, user: Account, room: MatchRoom): void {
    const seats = room.seatsFor(user.id);
    const seat = seats[0] ?? 0;
    const you = room.seatForView(seat);
    const hostName = this.nameOf(room.hostUserId) ?? "Host";
    const guestName =
      room.mode === "ai" ? "AI" : room.mode === "hotseat" ? hostName : this.nameOf(room.guestUserId);
    const match = room.viewFor(seat);
    if (!match) {
      this.send(ws, {
        type: "hello",
        roomId: room.id,
        you,
        mode: room.mode,
        waitingForPeer: true,
        hostName,
        guestName,
      });
      return;
    }
    this.send(ws, {
      type: "state",
      roomId: room.id,
      you,
      mode: room.mode,
      waitingForPeer: false,
      waitingForCombatAck: room.waitingForCombatAck(),
      match,
      hostName,
      guestName,
      peerConnected: this.peerConnected(room, user.id),
    });
  }

  private clearCombatAckTimer(room: MatchRoom): void {
    const timer = this.combatAckTimers.get(room);
    if (timer) clearTimeout(timer);
    this.combatAckTimers.delete(room);
  }

  private syncCombatAckTimer(room: MatchRoom): void {
    if (!room.waitingForCombatAck()) {
      this.clearCombatAckTimer(room);
      return;
    }
    if (this.combatAckTimers.has(room)) return;
    this.combatAckTimers.set(
      room,
      setTimeout(() => {
        this.combatAckTimers.delete(room);
        if (!this.rooms.has(room.id) || !room.waitingForCombatAck()) return;
        room.expireMissingCombatAcks();
        this.touch(room);
        this.persist();
        this.pushRoom(room);
      }, COMBAT_ACK_GRACE_MS),
    );
  }
}
