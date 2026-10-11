import type { Action, MatchState, PlayerId } from "../engine/types";
import type { AiDifficulty, ClientMessage, ResumeInfo, RoomMode, RoomSummary, ServerMessage } from "./protocol";

export const AUTH_TOKEN_KEY = "mythos2099.authToken";

export interface GameClientHandlers {
  onAuthed: (info: { username: string; token: string; resume: ResumeInfo | null }) => void;
  onRooms: (rooms: RoomSummary[]) => void;
  onHello: (info: {
    roomId: string;
    you: PlayerId;
    mode: RoomMode;
    waitingForPeer: boolean;
    hostName: string;
    guestName: string | null;
  }) => void;
  onState: (info: {
    roomId: string;
    you: PlayerId;
    mode: RoomMode;
    waitingForPeer: boolean;
    waitingForCombatAck: boolean;
    match: MatchState;
    hostName: string;
    guestName: string | null;
    peerConnected: boolean;
  }) => void;
  onError: (error: string) => void;
  onPeerStatus: (info: { connected: boolean; username?: string }) => void;
  onClose: () => void;
}

function wsUrl(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined;
  if (configured) return configured;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export class GameClient {
  private socket: WebSocket | null = null;
  private handlers: GameClientHandlers | null = null;
  private queue: ClientMessage[] = [];

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  connect(handlers: GameClientHandlers): Promise<void> {
    this.handlers = handlers;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return this.socket.readyState === WebSocket.OPEN ? Promise.resolve() : this.waitOpen();
    }
    this.socket = new WebSocket(wsUrl());
    this.socket.addEventListener("message", (event) => this.onMessage(String(event.data)));
    this.socket.addEventListener("close", () => {
      this.socket = null;
      this.handlers?.onClose();
    });
    return this.waitOpen();
  }

  register(username: string, password: string): void {
    this.send({ type: "register", username, password });
  }

  login(username: string, password: string): void {
    this.send({ type: "login", username, password });
  }

  guest(): void {
    this.send({ type: "guest" });
  }

  auth(token: string): void {
    this.send({ type: "auth", token });
  }

  listRooms(): void {
    this.send({ type: "listRooms" });
  }

  createRoom(mode: RoomMode, p1Army: number[], p2Army?: number[], aiDifficulty?: AiDifficulty): void {
    this.send({ type: "createRoom", mode, p1Army, p2Army, aiDifficulty });
  }

  join(roomId: string, army: number[]): void {
    this.send({ type: "join", roomId, army });
  }

  rejoin(): void {
    this.send({ type: "rejoin" });
  }

  sendAction(action: Action): void {
    this.send({ type: "action", action });
  }

  continueAi(): void {
    this.send({ type: "continueAi" });
  }

  leave(): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.send({ type: "leave" });
  }

  abandon(roomId?: string): void {
    this.send(roomId ? { type: "abandon", roomId } : { type: "abandon" });
  }

  disconnect(): void {
    const socket = this.socket;
    this.handlers = null;
    this.socket = null;
    this.queue = [];
    socket?.close();
  }

  private waitOpen(): Promise<void> {
    const socket = this.socket;
    if (!socket) return Promise.reject(new Error("No socket"));
    if (socket.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onOpen = () => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("close", onClose);
        for (const message of this.queue) socket.send(JSON.stringify(message));
        this.queue = [];
        resolve();
      };
      const onClose = () => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("close", onClose);
        reject(new Error("Cannot reach the game server"));
      };
      socket.addEventListener("open", onOpen);
      socket.addEventListener("close", onClose);
    });
  }

  private send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return;
    }
    this.queue.push(message);
  }

  private onMessage(raw: string): void {
    let message: ServerMessage;
    try {
      message = JSON.parse(raw) as ServerMessage;
    } catch {
      this.handlers?.onError("Invalid server message");
      return;
    }
    if (message.type === "authed") this.handlers?.onAuthed(message);
    else if (message.type === "rooms") this.handlers?.onRooms(message.rooms);
    else if (message.type === "hello") this.handlers?.onHello(message);
    else if (message.type === "state") this.handlers?.onState(message);
    else if (message.type === "error") this.handlers?.onError(message.error);
    else if (message.type === "peerStatus") this.handlers?.onPeerStatus(message);
  }
}
