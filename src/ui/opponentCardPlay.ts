import type { CardInstance, MatchState, PlayerId } from "../engine/types";

export interface OpponentCardPlay {
  card: CardInstance;
  actor: PlayerId;
}

function playedThisCard(text: string, name: string): boolean {
  return text === `Played ${name}`;
}

/**
 * A card the viewer should be told about: the other seat played it
 * (or, in hotseat, either seat — both people share one screen).
 * Discard-redraw and Desperate Measure discards are not plays.
 */
export function opponentCardPlay(
  prev: MatchState,
  next: MatchState,
  viewer: PlayerId,
  opts?: { includeSelf?: boolean },
): OpponentCardPlay | null {
  if (prev === next) return null;
  const actor = prev.currentPlayer;
  if (!opts?.includeSelf && actor === viewer) return null;
  const seen = new Set(prev.players[actor].discard.map((card) => card.instanceId));
  const added = next.players[actor].discard.filter(
    (card) => !seen.has(card.instanceId) && card.templateId !== "hidden" && card.name.length > 0,
  );
  if (added.length === 0) return null;
  const fresh = next.log.slice(prev.log.length);
  const card = added.find((entry) => fresh.some((line) => playedThisCard(line.text, entry.name)));
  if (!card) return null;
  return { card, actor };
}
