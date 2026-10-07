import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2 } from "../src/data/premadeArmies";
import type { ServerMessage } from "../src/net/protocol";
import { AccountStore, FAST_SCRYPT } from "./accounts";
import { GameServer, type ServerSocket } from "./gameServer";
import { RoomStore } from "./roomStore";

class FakeSock implements ServerSocket {
  readyState = 1;
  messages: ServerMessage[] = [];
  send(data: string): void {
    this.messages.push(JSON.parse(data) as ServerMessage);
  }
  last(): ServerMessage | undefined {
    return this.messages[this.messages.length - 1];
  }
  ofType(type: ServerMessage["type"]): ServerMessage[] {
    return this.messages.filter((message) => message.type === type);
  }
}

function server(dir?: string): GameServer {
  const root = dir ?? mkdtempSync(join(tmpdir(), "ml-"));
  return new GameServer(new AccountStore(join(root, "accounts.json"), FAST_SCRYPT), new RoomStore(join(root, "rooms.json")));
}

function authed(game: GameServer, name: string): FakeSock {
  const ws = new FakeSock();
  game.connect(ws);
  game.handleMessage(ws, JSON.stringify({ type: "register", username: name, password: "secret" }));
  return ws;
}

describe("GameServer lobby", () => {
  it("requires an account before creating a room", () => {
    const game = server();
    const ws = new FakeSock();
    game.connect(ws);
    game.handleMessage(ws, JSON.stringify({ type: "createRoom", mode: "ai", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }));
    expect(ws.last()).toEqual({ type: "error", error: "Sign in first" });
  });

  it("lists waiting PvP rooms to others and keeps AI rooms private", () => {
    const game = server();
    const host = authed(game, "HostOne");
    const guest = authed(game, "GuestTwo");
    game.handleMessage(host, JSON.stringify({ type: "createRoom", mode: "pvp", p1Army: DEFAULT_P1 }));
    game.handleMessage(guest, JSON.stringify({ type: "listRooms" }));
    const guestRooms = guest.ofType("rooms").at(-1);
    expect(guestRooms?.type).toBe("rooms");
    if (guestRooms?.type !== "rooms") return;
    expect(guestRooms.rooms).toHaveLength(1);
    expect(guestRooms.rooms[0]?.mode).toBe("pvp");
    expect(guestRooms.rooms[0]?.youSeated).toBe(false);

    game.handleMessage(host, JSON.stringify({ type: "abandon" }));
    game.handleMessage(host, JSON.stringify({ type: "createRoom", mode: "ai", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }));
    game.handleMessage(guest, JSON.stringify({ type: "listRooms" }));
    const afterAi = guest.ofType("rooms").at(-1);
    if (afterAi?.type !== "rooms") return;
    expect(afterAi.rooms).toHaveLength(0);

    game.handleMessage(host, JSON.stringify({ type: "listRooms" }));
    const hostRooms = host.ofType("rooms").at(-1);
    if (hostRooms?.type !== "rooms") return;
    expect(hostRooms.rooms.some((room) => room.mode === "ai" && room.youSeated)).toBe(true);
  });

  it("keeps a match after disconnect so the same seat can rejoin", () => {
    const game = server();
    const host = authed(game, "PilotA");
    game.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "hotseat", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    const started = host.ofType("state").at(-1);
    expect(started?.type).toBe("state");
    if (started?.type !== "state") return;
    const phase = started.match.phase;
    game.disconnect(host);

    const again = new FakeSock();
    game.connect(again);
    const tokenMsg = host.ofType("authed")[0];
    if (tokenMsg?.type !== "authed") return;
    game.handleMessage(again, JSON.stringify({ type: "auth", token: tokenMsg.token }));
    game.handleMessage(again, JSON.stringify({ type: "rejoin" }));
    const resumed = again.ofType("state").at(-1);
    expect(resumed?.type).toBe("state");
    if (resumed?.type !== "state") return;
    expect(resumed.match.phase).toBe(phase);
    expect(resumed.you).toBe(started.you);
  });

  it("reloads persisted rooms after a new server boots", () => {
    const dir = mkdtempSync(join(tmpdir(), "ml-"));
    const first = server(dir);
    const host = authed(first, "Saved");
    first.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "ai", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    const before = host.ofType("state").at(-1);
    expect(before?.type).toBe("state");
    if (before?.type !== "state") return;

    const second = server(dir);
    const ws = new FakeSock();
    second.connect(ws);
    const tokenMsg = host.ofType("authed")[0];
    if (tokenMsg?.type !== "authed") return;
    second.handleMessage(ws, JSON.stringify({ type: "auth", token: tokenMsg.token }));
    second.handleMessage(ws, JSON.stringify({ type: "rejoin" }));
    const after = ws.ofType("state").at(-1);
    expect(after?.type).toBe("state");
    if (after?.type !== "state") return;
    expect(after.match.phase).toBe(before.match.phase);
    expect(after.roomId).toBe(before.roomId);
  });

  it("notifies the remaining PvP player when a peer disconnects", () => {
    const game = server();
    const host = authed(game, "P1User");
    const guest = authed(game, "P2User");
    game.handleMessage(host, JSON.stringify({ type: "createRoom", mode: "pvp", p1Army: DEFAULT_P1 }));
    const hello = host.ofType("hello").at(-1);
    expect(hello?.type).toBe("hello");
    if (hello?.type !== "hello") return;
    game.handleMessage(guest, JSON.stringify({ type: "join", roomId: hello.roomId, army: DEFAULT_P2 }));
    expect(guest.ofType("state").at(-1)?.type).toBe("state");
    game.disconnect(host);
    const status = guest.ofType("peerStatus").at(-1);
    expect(status).toEqual({ type: "peerStatus", connected: false, username: "P1User" });
  });

  it("pushes match state to host immediately when a PvP guest joins the room", () => {
    const game = server();
    const host = authed(game, "HostA");
    const guest = authed(game, "GuestB");
    game.handleMessage(host, JSON.stringify({ type: "createRoom", mode: "pvp", p1Army: DEFAULT_P1 }));
    const hello = host.ofType("hello").at(-1);
    expect(hello?.type).toBe("hello");
    expect(hello?.waitingForPeer).toBe(true);
    if (hello?.type !== "hello") return;
    const hostMsgCountBefore = host.messages.length;

    game.handleMessage(guest, JSON.stringify({ type: "join", roomId: hello.roomId, army: DEFAULT_P2 }));

    const guestLast = guest.ofType("state").at(-1);
    expect(guestLast?.type).toBe("state");
    expect(guestLast?.waitingForPeer).toBe(false);

    const hostAfter = host.ofType("state").at(-1);
    expect(hostAfter).toBeDefined();
    expect(hostAfter?.type).toBe("state");
    expect(hostAfter?.waitingForPeer).toBe(false);
    expect(hostAfter?.match.phase).toBeTruthy();
    expect(hostAfter?.peerConnected).toBe(true);
    expect(host.messages.length).toBeGreaterThan(hostMsgCountBefore);
  });

  it("closes a finished AI room when the player leaves", () => {
    const game = server();
    const host = authed(game, "Solo");
    game.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "ai", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    const started = host.ofType("state").at(-1);
    expect(started?.type).toBe("state");
    if (started?.type !== "state") return;
    const room = game.rooms.get(started.roomId);
    expect(room?.state).toBeTruthy();
    if (!room?.state) return;
    room.state.winner = 0;
    room.state.phase = "gameover";
    room.state.combatPlayback = null;
    room.state.winReason = "hq";
    game.handleMessage(host, JSON.stringify({ type: "leave" }));
    expect(game.rooms.has(started.roomId)).toBe(false);
  });

  it("closes an AI room as soon as the player surrenders", () => {
    const game = server();
    const host = authed(game, "GivesUp");
    game.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "ai", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    const started = host.ofType("state").at(-1);
    expect(started?.type).toBe("state");
    if (started?.type !== "state") return;
    expect(game.rooms.has(started.roomId)).toBe(true);

    game.handleMessage(host, JSON.stringify({ type: "action", action: { type: "surrender" } }));
    const ended = host.ofType("state").at(-1);
    expect(ended?.type).toBe("state");
    if (ended?.type === "state") {
      expect(ended.match.winner).toBe(0); // AI goes first; human (seat 1) surrender → AI wins
      expect(ended.match.winReason).toBe("surrender");
    }
    expect(game.rooms.has(started.roomId)).toBe(false);
    expect(host.ofType("rooms").at(-1)?.type).toBe("rooms");
  });

  it("closes a finished PvP room only after both players leave", () => {
    const game = server();
    const host = authed(game, "HostWin");
    const guest = authed(game, "GuestLose");
    game.handleMessage(host, JSON.stringify({ type: "createRoom", mode: "pvp", p1Army: DEFAULT_P1 }));
    const hello = host.ofType("hello").at(-1);
    expect(hello?.type).toBe("hello");
    if (hello?.type !== "hello") return;
    game.handleMessage(guest, JSON.stringify({ type: "join", roomId: hello.roomId, army: DEFAULT_P2 }));
    const room = game.rooms.get(hello.roomId);
    expect(room?.state).toBeTruthy();
    if (!room?.state) return;
    room.state.winner = 0;
    room.state.phase = "gameover";
    room.state.combatPlayback = null;
    room.state.winReason = "hq";

    game.handleMessage(host, JSON.stringify({ type: "leave" }));
    expect(game.rooms.has(hello.roomId)).toBe(true);

    game.handleMessage(guest, JSON.stringify({ type: "leave" }));
    expect(game.rooms.has(hello.roomId)).toBe(false);
  });

  it("removes an AI room when the host abandons from the lobby", () => {
    const game = server();
    const host = authed(game, "Cleaner");
    game.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "ai", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    expect(game.rooms.size).toBe(1);
    game.handleMessage(host, JSON.stringify({ type: "leave" }));
    expect(game.rooms.size).toBe(1);
    game.handleMessage(host, JSON.stringify({ type: "abandon" }));
    expect(game.rooms.size).toBe(0);
  });

  it("abandons a specific AI room by id without deleting another match", () => {
    const game = server();
    const host = authed(game, "TwoSeats");
    const guest = authed(game, "StillHere");
    game.handleMessage(host, JSON.stringify({ type: "createRoom", mode: "pvp", p1Army: DEFAULT_P1 }));
    const hello = host.ofType("hello").at(-1);
    expect(hello?.type).toBe("hello");
    if (hello?.type !== "hello") return;
    game.handleMessage(guest, JSON.stringify({ type: "join", roomId: hello.roomId, army: DEFAULT_P2 }));
    const pvp = game.rooms.get(hello.roomId);
    expect(pvp?.state).toBeTruthy();
    if (!pvp?.state) return;
    pvp.state.winner = 0;
    pvp.state.phase = "gameover";
    pvp.state.combatPlayback = null;
    game.handleMessage(host, JSON.stringify({ type: "leave" }));

    game.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "ai", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    const aiState = host.ofType("state").at(-1);
    expect(aiState?.type).toBe("state");
    if (aiState?.type !== "state") return;
    expect(aiState.roomId).not.toBe(hello.roomId);

    game.handleMessage(host, JSON.stringify({ type: "abandon", roomId: aiState.roomId }));
    expect(game.rooms.has(aiState.roomId)).toBe(false);
    expect(game.rooms.has(hello.roomId)).toBe(true);
  });
});

describe("GameServer guests and idle cleanup", () => {
  function guestAuthed(game: GameServer): FakeSock {
    const ws = new FakeSock();
    game.connect(ws);
    game.handleMessage(ws, JSON.stringify({ type: "guest" }));
    return ws;
  }

  it("lets a guest create a room and reconnect with the same token", () => {
    const game = server();
    const host = guestAuthed(game);
    const authedMsg = host.ofType("authed")[0];
    expect(authedMsg?.type).toBe("authed");
    if (authedMsg?.type !== "authed") return;
    expect(authedMsg.guest).toBe(true);
    expect(authedMsg.username.startsWith("Guest_")).toBe(true);

    game.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "hotseat", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    expect(host.ofType("state").at(-1)?.type).toBe("state");
    game.disconnect(host);

    const again = new FakeSock();
    game.connect(again);
    game.handleMessage(again, JSON.stringify({ type: "auth", token: authedMsg.token }));
    const resumedAuth = again.ofType("authed").at(-1);
    expect(resumedAuth?.type).toBe("authed");
    if (resumedAuth?.type !== "authed") return;
    expect(resumedAuth.token).toBe(authedMsg.token);
    expect(resumedAuth.resume?.roomId).toBeTruthy();
    game.handleMessage(again, JSON.stringify({ type: "rejoin" }));
    expect(again.ofType("state").at(-1)?.type).toBe("state");
  });

  it("purges rooms idle longer than the TTL without requiring abandon", () => {
    let now = 1_000_000;
    const root = mkdtempSync(join(tmpdir(), "ml-"));
    const game = new GameServer(
      new AccountStore(join(root, "accounts.json"), FAST_SCRYPT),
      new RoomStore(join(root, "rooms.json")),
      { roomIdleMs: 30 * 60 * 1000, now: () => now },
    );
    const host = guestAuthed(game);
    game.handleMessage(host, JSON.stringify({ type: "createRoom", mode: "pvp", p1Army: DEFAULT_P1 }));
    expect(game.rooms.size).toBe(1);
    game.disconnect(host);

    now += 29 * 60 * 1000;
    expect(game.purgeIdleRooms()).toBe(0);
    expect(game.rooms.size).toBe(1);

    now += 2 * 60 * 1000;
    expect(game.purgeIdleRooms()).toBe(1);
    expect(game.rooms.size).toBe(0);
  });

  it("keeps an active room when players still act before the TTL", () => {
    let now = 1_000_000;
    const root = mkdtempSync(join(tmpdir(), "ml-"));
    const game = new GameServer(
      new AccountStore(join(root, "accounts.json"), FAST_SCRYPT),
      new RoomStore(join(root, "rooms.json")),
      { roomIdleMs: 30 * 60 * 1000, now: () => now },
    );
    const host = guestAuthed(game);
    game.handleMessage(
      host,
      JSON.stringify({ type: "createRoom", mode: "hotseat", p1Army: DEFAULT_P1, p2Army: DEFAULT_P2 }),
    );
    now += 25 * 60 * 1000;
    game.handleMessage(host, JSON.stringify({ type: "rejoin" }));
    now += 25 * 60 * 1000;
    expect(game.purgeIdleRooms()).toBe(0);
    expect(game.rooms.size).toBe(1);
  });
});
