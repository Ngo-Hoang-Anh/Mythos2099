import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { toPersistedState } from "../src/engine/state";
import type { MatchState, PlayerId } from "../src/engine/types";
import type { RoomMode } from "../src/net/protocol";
import { MatchRoom } from "../src/net/session";

export interface RoomSnapshot {
  id: string;
  mode: RoomMode;
  hostUserId: string | null;
  guestUserId: string | null;
  p1Army: number[];
  p2Army: number[] | null;
  state: MatchState | null;
  combatAcks: PlayerId[];
  lastActivityAt?: number;
}

export function snapshotRoom(room: MatchRoom): RoomSnapshot {
  return {
    id: room.id,
    mode: room.mode,
    hostUserId: room.hostUserId,
    guestUserId: room.guestUserId,
    p1Army: room.p1Army,
    p2Army: room.p2Army,
    state: room.state ? toPersistedState(room.state) : null,
    combatAcks: [...room.combatAcks],
    lastActivityAt: room.lastActivityAt,
  };
}

export function restoreRoom(snap: RoomSnapshot): MatchRoom {
  const room = new MatchRoom(snap.id, snap.mode, snap.p1Army, snap.p2Army, snap.hostUserId);
  room.guestUserId = snap.guestUserId;
  room.state = snap.state;
  room.combatAcks = new Set(snap.combatAcks);
  room.lastActivityAt = snap.lastActivityAt ?? Date.now();
  return room;
}

export class RoomStore {
  constructor(private readonly filePath: string | null = null) {}

  load(): RoomSnapshot[] {
    if (!this.filePath) return [];
    try {
      const raw = readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as { rooms?: RoomSnapshot[] };
      return parsed.rooms ?? [];
    } catch {
      return [];
    }
  }

  save(rooms: Iterable<MatchRoom>): void {
    if (!this.filePath) return;
    mkdirSync(dirname(this.filePath), { recursive: true });
    const snaps = [...rooms].map(snapshotRoom);
    writeFileSync(this.filePath, JSON.stringify({ rooms: snaps }, null, 2));
  }
}
