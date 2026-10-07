import type { Action, MatchState, Phase, PlayerId } from "../engine/types";

export type RoomMode = "ai" | "hotseat" | "pvp";

export type RoomStatus = "waiting" | "playing" | "gameover";

export interface RoomSummary {
  id: string;
  mode: RoomMode;
  hostName: string;
  guestName: string | null;
  status: RoomStatus;
  youSeated: boolean;
  phase?: Phase;
  turn?: number;
}

export interface ResumeInfo {
  roomId: string;
  mode: RoomMode;
  you: PlayerId;
  waitingForPeer: boolean;
}

export type ClientMessage =
  | { type: "register"; username: string; password: string }
  | { type: "login"; username: string; password: string }
  | { type: "guest" }
  | { type: "auth"; token: string }
  | { type: "listRooms" }
  | { type: "createRoom"; mode: RoomMode; p1Army: number[]; p2Army?: number[] }
  | { type: "join"; roomId: string; army: number[] }
  | { type: "rejoin" }
  | { type: "action"; action: Action }
  | { type: "continueAi" }
  | { type: "leave" }
  | { type: "abandon"; roomId?: string };

export type ServerMessage =
  | { type: "authed"; username: string; token: string; resume: ResumeInfo | null; guest?: boolean }
  | { type: "rooms"; rooms: RoomSummary[] }
  | {
      type: "hello";
      roomId: string;
      you: PlayerId;
      mode: RoomMode;
      waitingForPeer: boolean;
      hostName: string;
      guestName: string | null;
    }
  | {
      type: "state";
      roomId: string;
      you: PlayerId;
      mode: RoomMode;
      waitingForPeer: boolean;
      waitingForCombatAck: boolean;
      match: MatchState;
      hostName: string;
      guestName: string | null;
      peerConnected: boolean;
    }
  | { type: "peerStatus"; connected: boolean; username?: string }
  | { type: "error"; error: string };

export interface MatchEnvelope {
  roomId: string;
  you: PlayerId;
  mode: RoomMode;
  waitingForPeer: boolean;
  waitingForCombatAck: boolean;
  match: MatchState | null;
}
