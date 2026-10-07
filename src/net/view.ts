import { HIDDEN_UNIT_ID } from "../data/unitIds";
import { cloneCard, cloneState } from "../engine/state";
import type { CardInstance, MatchState, PlayerId, PlayerState } from "../engine/types";

function hiddenCard(owner: PlayerId, pile: string, index: number): CardInstance {
  return {
    instanceId: `hidden_${owner}_${pile}_${index}`,
    ownerUnitId: HIDDEN_UNIT_ID,
    templateId: "hidden",
    name: "",
    type: "maneuver",
    cost: 0,
    text: "",
    effectId: "forward",
    targets: [],
  };
}

function hiddenPile(owner: PlayerId, pile: string, count: number): CardInstance[] {
  return Array.from({ length: count }, (_, index) => hiddenCard(owner, pile, index));
}

function projectPlayer(player: PlayerState, viewer: PlayerId): PlayerState {
  const self = player.id === viewer;
  return {
    ...player,
    army: self ? [...(player.army ?? [])] : [],
    revealedUnitIds: [...(player.revealedUnitIds ?? [])],
    // Discard stays visible so burns / Desperate Measure / played cards are public.
    discard: player.discard.map(cloneCard),
    deck: hiddenPile(player.id, "deck", player.deck.length),
    hand: self ? player.hand.map(cloneCard) : hiddenPile(player.id, "hand", player.hand.length),
    undeployed: self ? [...player.undeployed] : player.undeployed.map(() => HIDDEN_UNIT_ID),
  };
}

/** Public snapshot for one seat: hides RNG, deck order, and the opponent's real cards. */
export function projectMatch(state: MatchState, viewer: PlayerId): MatchState {
  const next = cloneState(state);
  delete next.logSink;
  next.seed = 0;
  next.rngState = 0;
  next.idSeq = 0;
  next.players = [projectPlayer(next.players[0], viewer), projectPlayer(next.players[1], viewer)];
  return next;
}
