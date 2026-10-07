import { useEffect, useRef, useState } from "react";
import type { Action, MatchState, PlayerId } from "../engine/types";
import { AUTH_TOKEN_KEY, GameClient } from "./client";
import type { ResumeInfo, RoomMode, RoomSummary } from "./protocol";

export type SessionStatus = "idle" | "connecting" | "online" | "offline";

function readToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function useGameSession() {
  const clientRef = useRef(new GameClient());
  const logoutRef = useRef(false);
  const wantRejoinRef = useRef(false);
  const tokenRef = useRef(readToken());
  const roomIdRef = useRef<string | null>(null);
  const inMatchRef = useRef(false);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [username, setUsername] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeInfo | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [you, setYou] = useState<PlayerId>(0);
  const [mode, setMode] = useState<RoomMode | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [waitingForPeer, setWaitingForPeer] = useState(false);
  const [waitingForCombatAck, setWaitingForCombatAck] = useState(false);
  const [peerConnected, setPeerConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function clearMatchView(): void {
    roomIdRef.current = null;
    inMatchRef.current = false;
    setMatch(null);
    setMode(null);
    setRoomId(null);
    setHostName(null);
    setGuestName(null);
    setWaitingForPeer(false);
    setWaitingForCombatAck(false);
    setPeerConnected(true);
  }

  function handlers() {
    return {
      onAuthed(info: { username: string; token: string; resume: ResumeInfo | null }) {
        tokenRef.current = info.token;
        writeToken(info.token);
        setUsername(info.username);
        setResume(info.resume);
        setStatus("online");
        setError(null);
        if (wantRejoinRef.current && info.resume) {
          wantRejoinRef.current = false;
          clientRef.current.rejoin();
        }
      },
      onRooms(next: RoomSummary[]) {
        setRooms(next);
        const seated = next.find((room) => room.youSeated);
        setResume(
          seated
            ? {
                roomId: seated.id,
                mode: seated.mode,
                you: 0,
                waitingForPeer: seated.status === "waiting",
              }
            : null,
        );
      },
      onHello(info: {
        roomId: string;
        you: PlayerId;
        mode: RoomMode;
        waitingForPeer: boolean;
        hostName: string;
        guestName: string | null;
      }) {
        setRoomId(info.roomId);
        roomIdRef.current = info.roomId;
        inMatchRef.current = true;
        setYou(info.you);
        setMode(info.mode);
        setHostName(info.hostName);
        setGuestName(info.guestName);
        setWaitingForPeer(info.waitingForPeer);
        setWaitingForCombatAck(false);
        setPeerConnected(false);
        setStatus("online");
        if (info.waitingForPeer) setMatch(null);
      },
      onState(info: {
        roomId: string;
        you: PlayerId;
        mode: RoomMode;
        waitingForPeer: boolean;
        waitingForCombatAck: boolean;
        match: MatchState;
        hostName: string;
        guestName: string | null;
        peerConnected: boolean;
      }) {
        setRoomId(info.roomId);
        roomIdRef.current = info.roomId;
        inMatchRef.current = true;
        setYou(info.you);
        setMode(info.mode);
        setHostName(info.hostName);
        setGuestName(info.guestName);
        setWaitingForPeer(false);
        setWaitingForCombatAck(info.waitingForCombatAck);
        setPeerConnected(info.peerConnected);
        setMatch(info.match);
        setError(null);
        setStatus("online");
      },
      onError(message: string) {
        setError(message);
        if (message === "Invalid session") {
          tokenRef.current = null;
          writeToken(null);
          setUsername(null);
        }
      },
      onPeerStatus(info: { connected: boolean; username?: string }) {
        setPeerConnected(info.connected);
      },
      onClose() {
        if (logoutRef.current) {
          logoutRef.current = false;
          return;
        }
        setStatus("offline");
        setError("Disconnected from game server");
        const token = tokenRef.current;
        const shouldRejoin = Boolean(roomIdRef.current || inMatchRef.current);
        void (async () => {
          try {
            await ensureConnected();
            if (token) {
              wantRejoinRef.current = shouldRejoin;
              clientRef.current.auth(token);
            }
          } catch {
            /* keep offline error */
          }
        })();
      },
    };
  }

  async function ensureConnected(): Promise<void> {
    setStatus("connecting");
    setError(null);
    try {
      await clientRef.current.connect(handlers());
      setStatus("online");
    } catch (caught) {
      setStatus("offline");
      const message = caught instanceof Error ? caught.message : "Cannot reach the game server";
      setError(message);
      throw caught;
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureConnected();
        if (cancelled) return;
        const token = tokenRef.current;
        if (token) clientRef.current.auth(token);
      } catch {
        /* shown via error */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function register(name: string, password: string): Promise<void> {
    await ensureConnected();
    clientRef.current.register(name, password);
  }

  async function login(name: string, password: string): Promise<void> {
    await ensureConnected();
    clientRef.current.login(name, password);
  }

  async function playAsGuest(): Promise<void> {
    await ensureConnected();
    clientRef.current.guest();
  }

  function createMatch(nextMode: RoomMode, p1Army: number[], p2Army?: number[]): void {
    setError(null);
    clientRef.current.createRoom(nextMode, p1Army, p2Army);
  }

  function joinMatch(nextRoomId: string, army: number[]): void {
    setError(null);
    clientRef.current.join(nextRoomId, army);
  }

  function rejoin(): void {
    setError(null);
    clientRef.current.rejoin();
  }

  function sendAction(action: Action): void {
    setError(null);
    clientRef.current.sendAction(action);
  }

  function continueAi(): void {
    clientRef.current.continueAi();
  }

  function exitToLobby(): void {
    clientRef.current.leave();
    clearMatchView();
    setError(null);
    setStatus("online");
  }

  function abandon(nextRoomId?: string): void {
    clientRef.current.abandon(nextRoomId);
    if (!nextRoomId || nextRoomId === roomIdRef.current) {
      clearMatchView();
      setError(null);
    }
  }

  function logout(): void {
    logoutRef.current = true;
    tokenRef.current = null;
    writeToken(null);
    clientRef.current.disconnect();
    setUsername(null);
    setResume(null);
    setRooms([]);
    clearMatchView();
    setError(null);
    setStatus("idle");
  }

  function reconnect(): void {
    const token = tokenRef.current;
    void (async () => {
      try {
        wantRejoinRef.current = Boolean(roomIdRef.current || inMatchRef.current || resume);
        await ensureConnected();
        if (token) clientRef.current.auth(token);
      } catch {
        /* shown via error */
      }
    })();
  }

  function clearError(): void {
    setError(null);
  }

  return {
    status,
    username,
    resume,
    rooms,
    match,
    you,
    mode,
    roomId,
    hostName,
    guestName,
    waitingForPeer,
    waitingForCombatAck,
    peerConnected,
    error,
    register,
    login,
    playAsGuest,
    createMatch,
    joinMatch,
    rejoin,
    sendAction,
    continueAi,
    exitToLobby,
    abandon,
    logout,
    reconnect,
    clearError,
  };
}
