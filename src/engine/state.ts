import { cloneBoard } from "./board";
import { cloneFx } from "./fx";
import { cloneStatuses } from "./status";
import { HAND_LIMIT, type CardInstance, type LogEntry, type LogIcon, type MatchState, type PlayerState } from "./types";

export function cloneCard(card: CardInstance): CardInstance {
  return { ...card, targets: [...card.targets] };
}

export function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    triggeredBreakpoints: [...player.triggeredBreakpoints],
    army: [...(player.army ?? [])],
    undeployed: [...player.undeployed],
    revealedUnitIds: [...(player.revealedUnitIds ?? [])],
    deck: player.deck.map(cloneCard),
    hand: player.hand.map(cloneCard),
    discard: player.discard.map(cloneCard),
  };
}

export function cloneState(state: MatchState): MatchState {
  return {
    ...state,
    players: [clonePlayer(state.players[0]), clonePlayer(state.players[1])],
    board: cloneBoard(state.board),
    log: state.log.map(cloneLogEntry),
    fx: cloneFx(state.fx),
    statuses: cloneStatuses(state.statuses),
    combatPlayback: state.combatPlayback
      ? {
          steps: [...state.combatPlayback.steps],
          initialBoard: cloneBoard(state.combatPlayback.initialBoard),
          initialHq: [...state.combatPlayback.initialHq],
        }
      : null,
  };
}

export function toPersistedState(state: MatchState): MatchState {
  const next = cloneState(state);
  delete next.logSink;
  return next;
}

export function nid(state: MatchState, prefix: string): string {
  state.idSeq += 1;
  return `${prefix}_${state.idSeq}`;
}

export function cloneLogEntry(entry: LogEntry): LogEntry {
  return {
    text: entry.text,
    icon: entry.icon,
    children: entry.children?.map(cloneLogEntry),
  };
}

export function flattenLog(entries: LogEntry[]): string[] {
  const lines: string[] = [];
  for (const entry of entries) {
    lines.push(entry.text);
    if (entry.children) lines.push(...flattenLog(entry.children));
  }
  return lines;
}

export function log(state: MatchState, message: string, icon?: LogIcon): void {
  const sink = state.logSink ?? state.log;
  sink.push({ text: message, icon });
}

export function withLogGroup(
  state: MatchState,
  text: string,
  icon: LogIcon | undefined,
  body: () => void,
  keepEmpty = false,
): LogEntry {
  const group: LogEntry = { text, icon, children: [] };
  const parent = state.logSink ?? state.log;
  parent.push(group);
  const prev = state.logSink;
  state.logSink = group.children;
  try {
    body();
  } finally {
    state.logSink = prev;
    if (!keepEmpty && (group.children?.length ?? 0) === 0) {
      const idx = parent.lastIndexOf(group);
      if (idx >= 0) parent.splice(idx, 1);
    }
  }
  return group;
}

export function current(state: MatchState): PlayerState {
  return state.players[state.currentPlayer];
}

export function opponent(state: MatchState): PlayerState {
  return state.players[state.currentPlayer === 0 ? 1 : 0];
}

export function takeFromHand(player: PlayerState, cardId: string): CardInstance | null {
  const idx = player.hand.findIndex((c) => c.instanceId === cardId);
  if (idx < 0) return null;
  return player.hand.splice(idx, 1)[0];
}

export function drawCards(state: MatchState, playerId: 0 | 1, count: number): number {
  const player = state.players[playerId];
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (player.hand.length >= HAND_LIMIT) break;
    const card = player.deck.shift();
    if (!card) break;
    player.hand.push(card);
    drawn += 1;
  }
  return drawn;
}
