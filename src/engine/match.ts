import { getUnitDef } from "../data/units";
import { makeInitiativeCard } from "../data/initiative";
import { aiProfile, buffedUnitStats, expandAiArmy, type AiDifficulty } from "./aiDifficulty";
import { beginEngagement } from "./combat/engagement";
import { resolveDestroyedUnits } from "./combat/cleanup";
import { resetCombatFlags, clearRested } from "./combat/helpers";
import { buildDeck, validateArmy } from "./army";
import {
  countUnits,
  emptyBoard,
  frontCol,
  placeUnit,
  supportCol,
  unitsOf,
} from "./board";
import { playEffect } from "./effects";
import { relocateUnit } from "./fx";
import { hasKeyword, restsOnDeploy } from "./keywords";
import { discardsNeeded, needsDesperateMeasure } from "./desperateMeasure";
import { applyEliminationLoss, projectedDeploySupply } from "./elimination";
import { mulberry32State, shuffle } from "./rng";
import { revealUnit } from "./deckTracker";
import {
  cloneState,
  current,
  drawCards,
  log,
  nid,
  takeFromHand,
  withLogGroup,
} from "./state";
import { clearThisCombatStatuses, tickStatuses } from "./status";
import {
  BASE_SUPPLY,
  DISCARD_REDRAW_LIMIT,
  DRAW_PER_TURN,
  HQ_MAX_HP,
  OPENING_HAND,
  SECOND_PLAYER_OPENING_SUPPLY,
  SECOND_PLAYER_OPENING_TURNS,
  ROWS,
  type Action,
  type ActionResult,
  type MatchState,
  type PlayerId,
  type PlayerState,
  type UnitDef,
  type UnitInstance,
} from "./types";

export interface MatchOptions {
  aiDifficulty?: AiDifficulty;
  /** Seat that receives the vs-AI bonuses. The computer is seat 0. */
  aiPlayer?: PlayerId;
}

function createPlayer(
  id: PlayerId,
  army: number[],
  nextId: () => string,
): PlayerState {
  return {
    id,
    hqHp: HQ_MAX_HP,
    triggeredBreakpoints: [],
    commandPoints: 0,
    nextTurnSupplyBonus: 0,
    nextTurnDrawBonus: 0,
    army: [...army],
    undeployed: [...army],
    revealedUnitIds: [],
    deck: buildDeck(army, nextId),
    hand: [],
    discard: [],
    discardRedrawsUsed: 0,
    deploysThisTurn: 0,
    turnsTaken: 0,
    thinkingTimeSeconds: 180,
    baseSupplyBonus: 0,
    drawPerTurnBonus: 0,
    recycleDeck: false,
    hqMaxHp: HQ_MAX_HP,
  };
}

export function createMatch(
  p1Army: number[],
  p2Army: number[],
  seed = 1,
  options?: MatchOptions,
): MatchState {
  const err1 = validateArmy(p1Army);
  const err2 = validateArmy(p2Army);
  if (err1) throw new Error(`P1: ${err1}`);
  if (err2) throw new Error(`P2: ${err2}`);

  const difficulty = options?.aiDifficulty ?? "easy";
  const aiPlayer: PlayerId = options?.aiPlayer ?? 0;
  const profile = aiProfile(difficulty);
  let armies: [number[], number[]] = [[...p1Army], [...p2Army]];
  let rngState = mulberry32State(seed);
  let added: number[] = [];
  if (profile && profile.extraUnits > 0) {
    const expanded = expandAiArmy(armies[aiPlayer], profile.extraUnits, rngState);
    armies[aiPlayer] = expanded.unitIds;
    added = expanded.added;
    rngState = expanded.rngState;
  }

  const proto: MatchState = {
    players: [
      createPlayer(0, armies[0], () => "tmp"),
      createPlayer(1, armies[1], () => "tmp"),
    ],
    board: emptyBoard(),
    currentPlayer: 0,
    firstPlayerId: 0,
    phase: "deployment",
    turn: 1,
    winner: null,
    seed,
    rngState,
    log: [],
    fx: [],
    combatPlayback: null,
    combatResumePhase: null,
    statuses: [],
    idSeq: 0,
    phaseStartTime: null,
  };

  const p1 = createPlayer(0, armies[0], () => nid(proto, "c"));
  const p2 = createPlayer(1, armies[1], () => nid(proto, "c"));
  proto.players = [p1, p2];
  if (profile) {
    const ai = proto.players[aiPlayer];
    ai.baseSupplyBonus = profile.baseSupply;
    ai.drawPerTurnBonus = profile.drawBonus;
    ai.recycleDeck = profile.recycleDeck;
    ai.hqMaxHp = HQ_MAX_HP + profile.hqBonus;
    ai.hqHp = ai.hqMaxHp;
    ai.deployBuff = profile.deployBuff;
  }

  const s1 = shuffle(p1.deck, proto.rngState);
  p1.deck = s1.items;
  const s2 = shuffle(p2.deck, s1.rngState);
  p2.deck = s2.items;
  proto.rngState = s2.rngState;

  drawCards(proto, 0, OPENING_HAND);
  drawCards(proto, 1, OPENING_HAND);
  p2.hand.unshift(makeInitiativeCard(nid(proto, "c")));
  startTurn(proto, 0);
  if (profile) {
    const names = added.map((id) => getUnitDef(id).name).join(", ");
    const extra =
      profile.drawBonus > 0
        ? `, +${profile.drawBonus} card each turn`
        : "";
    log(
      proto,
      `AI ${difficulty}: +${added.length} random unit${added.length === 1 ? "" : "s"}${names ? ` (${names})` : ""}, +${profile.baseSupply} base Supply, +${profile.hqBonus} HQ${extra}. Empty deck reshuffles from discard.`,
    );
  }
  log(proto, "Match start — P1 Deployment");
  return proto;
}

function refreshCp(state: MatchState, playerId: PlayerId): void {
  const player = state.players[playerId];
  const base = BASE_SUPPLY + (player.baseSupplyBonus ?? 0) + countUnits(state.board, playerId);
  const supplyBonus = player.nextTurnSupplyBonus;
  player.nextTurnSupplyBonus = 0;
  player.commandPoints = base + supplyBonus;
  if (supplyBonus > 0) {
    log(
      state,
      `Comeback: P${playerId + 1} +${supplyBonus} Supply → ${player.commandPoints}`,
      "supply",
    );
  }

  if (
    playerId !== state.firstPlayerId &&
    player.turnsTaken <= SECOND_PLAYER_OPENING_TURNS
  ) {
    player.commandPoints += SECOND_PLAYER_OPENING_SUPPLY;
    log(
      state,
      `Going second: +${SECOND_PLAYER_OPENING_SUPPLY} Supply (turn ${player.turnsTaken}/${SECOND_PLAYER_OPENING_TURNS})`,
    );
  }
}

function startTurn(state: MatchState, playerId: PlayerId): void {
  const player = state.players[playerId];
  player.turnsTaken += 1;
  player.discardRedrawsUsed = 0;
  player.deploysThisTurn = 0;
  refreshCp(state, playerId);
  if (player.turnsTaken > 1) {
    const drawBonus = player.nextTurnDrawBonus;
    player.nextTurnDrawBonus = 0;
    const difficultyDraw = player.drawPerTurnBonus ?? 0;
    const drawn = drawCards(state, playerId, DRAW_PER_TURN + difficultyDraw + drawBonus);
    if (drawn) {
      const notes: string[] = [];
      if (difficultyDraw > 0) notes.push(`+${difficultyDraw} difficulty`);
      if (drawBonus > 0) notes.push(`+${drawBonus} comeback`);
      log(
        state,
        notes.length > 0
          ? `P${playerId + 1} draws ${drawn} (incl. ${notes.join(", ")})`
          : `P${playerId + 1} draws ${drawn}`,
      );
    }
  } else {
    player.nextTurnDrawBonus = 0;
  }
  state.currentPlayer = playerId;
  state.phase = "deployment";
  applyEliminationLoss(state, [
    playerId === 0 ? player.commandPoints : projectedDeploySupply(state, 0),
    playerId === 1 ? player.commandPoints : projectedDeploySupply(state, 1),
  ]);
  state.phaseStartTime = Date.now();
}

function spend(player: PlayerState, cost: number): string | null {
  if (player.commandPoints < cost)
    return `Need ${cost} Supply (have ${player.commandPoints})`;
  player.commandPoints -= cost;
  return null;
}

function beginManeuver(state: MatchState): void {
  const player = current(state);
  // Nothing to play — skip straight to Engagement (tutorials / empty hand).
  if (player.hand.length === 0) {
    log(state, `P${player.id + 1} Maneuver skipped — no cards in hand`);
    resolveEngagement(state);
    return;
  }
  state.phase = "maneuver";
  state.phaseStartTime = Date.now();

  log(state, `P${player.id + 1} Maneuver`);
}

export function resolveEngagement(state: MatchState): void {
  beginEngagement(state);
}

function endEngagement(state: MatchState): string | null {
  if (
    state.phase !== "engagement" &&
    !(state.phase === "gameover" && state.combatPlayback)
  ) {
    return "Not in Engagement";
  }
  state.combatPlayback = null;
  resetCombatFlags(state);
  clearThisCombatStatuses(state);
  const resume = state.combatResumePhase;
  state.combatResumePhase = null;
  if (state.winner !== null) {
    state.phase = "gameover";
    return null;
  }
  if (resume) {
    state.phase = resume;
    return null;
  }
  passTurn(state);
  return null;
}

function surrender(state: MatchState, loser: PlayerId): string | null {
  if (state.winner !== null) return "Match is over";
  if (state.phase === "engagement" || state.combatPlayback)
    return "Wait for combat to finish";
  const winner: PlayerId = loser === 0 ? 1 : 0;
  state.winner = winner;
  state.winReason = "surrender";
  state.phase = "gameover";
  log(state, `P${loser + 1} surrenders — P${winner + 1} wins`);
  return null;
}

function passTurn(state: MatchState): void {
  clearRested(state);
  tickStatuses(state);
  const next: PlayerId = state.currentPlayer === 0 ? 1 : 0;
  state.turn += 1;
  startTurn(state, next);
  log(state, `Turn ${state.turn}: P${next + 1} Deployment`);
}

function deploy(
  state: MatchState,
  unitDefId: number,
  row: number,
  discardCardIds: string[] = [],
): string | null {
  if (state.phase !== "deployment") return "Not in Deployment";
  if (row < 0 || row >= ROWS) return "Invalid row";
  const player = current(state);
  const idx = player.undeployed.indexOf(unitDefId);
  if (idx < 0) return "That unit is not in reserve";
  const def = getUnitDef(unitDefId);
  const col = supportCol(player.id);
  if (state.board[col][row]) return "Support cell occupied";
  const needed = discardsNeeded(def.cost, player.commandPoints);
  if (discardCardIds.length !== needed) {
    if (needed === 0) return "No discards needed for this summon";
    return `Desperate Measure needs ${needed} card${needed === 1 ? "" : "s"} discarded (have ${discardCardIds.length})`;
  }
  if (needed > 0) {
    const reserveCosts = player.undeployed
      .filter((id) => id !== 0)
      .map((id) => getUnitDef(id).cost);
    const enemy: PlayerId = player.id === 0 ? 1 : 0;
    if (
      !needsDesperateMeasure(
        reserveCosts,
        player.commandPoints,
        player.hand.length,
        player.deploysThisTurn,
        unitsOf(state.board, player.id).length,
        unitsOf(state.board, enemy).length,
      )
    ) {
      const enemyCount = unitsOf(state.board, enemy).length;
      const ownCount = unitsOf(state.board, player.id).length;
      return player.deploysThisTurn > 0
        ? "Desperate Measure only for the first summon of the turn"
        : enemyCount <= ownCount
          ? "Desperate Measure only when the opponent has more units on the board"
          : "Desperate Measure only when no reserved unit is affordable with Supply";
    }
    const unique = new Set(discardCardIds);
    if (unique.size !== discardCardIds.length) return "Duplicate discard";
    for (const cardId of discardCardIds) {
      if (!player.hand.some((card) => card.instanceId === cardId))
        return "Card not in hand";
    }
    const discardedNames: string[] = [];
    for (const cardId of discardCardIds) {
      const card = takeFromHand(player, cardId);
      if (!card) return "Card not in hand";
      player.discard.push(card);
      discardedNames.push(card.name);
    }
    log(
      state,
      `Desperate Measure: discarded ${discardedNames.join(", ")} (−${needed / 2} cost)`,
      "supply",
    );
  }
  const paid = def.cost - needed / 2;
  const spent = spend(player, paid);
  if (spent) return spent;
  player.deploysThisTurn += 1;
  const unit = commitDeploy(state, player, def, row);
  const payNote =
    needed > 0 ? `${paid} Supply + ${needed} discarded` : `${def.cost} Supply`;
  log(
    state,
    `P${player.id + 1} deploys ${unit.name} on lane ${row + 1} for ${payNote}`,
    "supply",
  );
  return null;
}

function commitDeploy(state: MatchState, player: PlayerState, def: UnitDef, row: number): UnitInstance {
  const idx = player.undeployed.indexOf(def.id);
  player.undeployed.splice(idx, 1);
  const col = supportCol(player.id);
  const stats = buffedUnitStats(def, player.deployBuff);
  const unit: UnitInstance = {
    instanceId: nid(state, "u"),
    defId: def.id,
    name: def.name,
    class: def.class,
    owner: player.id,
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    armor: stats.armor,
    ap: def.ap,
    cost: def.cost,
    col,
    row,
    keywords: def.keywords.map((k) => ({ ...k })),
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
  };
  placeUnit(state.board, unit);
  revealUnit(player, unit.defId);
  if (restsOnDeploy(unit)) {
    unit.rested = true;
    log(state, `${unit.name} rests until next turn`);
  }
  if (hasKeyword(unit, "blitz")) {
    const dest = frontCol(player.id);
    if (!state.board[dest][row]) {
      relocateUnit(state, unit, dest, row);
      log(state, `${unit.name} Blitz to Frontline`, "blitz");
    }
  }
  return unit;
}

function playCard(
  state: MatchState,
  cardId: string,
  targets: import("./types").PlayTargets,
): string | null {
  if (state.phase !== "maneuver") return "Not in Maneuver";
  const player = current(state);
  const card = player.hand.find((c) => c.instanceId === cardId);
  if (!card) return "Card not in hand";

  const sourcePresent = unitsOf(state.board, player.id).some(
    (u) => u.defId === card.ownerUnitId,
  );
  if (
    card.type === "special" &&
    card.requiresSourceOnField &&
    card.ownerUnitId &&
    !sourcePresent
  ) {
    const penalty = spend(player, 1);
    if (penalty) return penalty;
    takeFromHand(player, cardId);
    player.discard.push(card);
    log(state, `${card.name} fizzles — source unit not on board (-1 CP)`);
    return null;
  }

  const spent = spend(player, card.cost);
  if (spent) return spent;
  let err: string | null = null;
  const group = withLogGroup(
    state,
    `Played ${card.name}`,
    "card",
    () => {
      err = playEffect(state, card, targets);
    },
    true,
  );
  if (err) {
    player.commandPoints += card.cost;
    const idx = state.log.lastIndexOf(group);
    if (idx >= 0) state.log.splice(idx, 1);
    return err;
  }
  takeFromHand(player, cardId);
  player.discard.push(card);
  // Flat damage / extra attacks / missiles leave 0 HP corpses until cleanup.
  // Extra engagements already clean inside combatPlayback — this is a no-op then.
  resolveDestroyedUnits(state);
  return null;
}

export function applyAction(state: MatchState, action: Action): ActionResult {
  if (state.phase === "engagement" && action.type !== "endEngagement") {
    return { ok: false, error: "Combat is resolving" };
  }
  if (state.phase === "gameover" && action.type !== "endEngagement") {
    return { ok: false, error: "Match is over" };
  }
  const next = cloneState(state);
  next.fx = [];
  let error: string | null = null;
  switch (action.type) {
    case "deploy":
      error = deploy(next, action.unitDefId, action.row, action.discardCardIds);
      break;
    case "endDeployment":
      if (next.phase !== "deployment") error = "Not in Deployment";
      else beginManeuver(next);
      break;
    case "discardRedraw": {
      if (next.phase !== "maneuver") error = "Not in Maneuver";
      else {
        const player = current(next);
        if (player.discardRedrawsUsed >= DISCARD_REDRAW_LIMIT)
          error = "Already discarded twice this turn";
        else if (player.deck.length === 0 && !player.recycleDeck) error = "Deck is empty";
        else {
          const card = takeFromHand(player, action.cardId);
          if (!card) error = "Card not in hand";
          else {
            player.discard.push(card);
            drawCards(next, player.id, 1);
            player.discardRedrawsUsed += 1;
            log(
              next,
              `Discarded ${card.name} to redraw (${player.discardRedrawsUsed}/${DISCARD_REDRAW_LIMIT})`,
            );
          }
        }
      }
      break;
    }
    case "playCard":
      error = playCard(next, action.cardId, action.targets);
      break;
    case "endManeuver":
      if (next.phase !== "maneuver") error = "Not in Maneuver";
      else resolveEngagement(next);
      break;
    case "endEngagement":
      error = endEngagement(next);
      break;
    case "surrender":
      error = surrender(next, action.by ?? next.currentPlayer);
      break;
  }
  if (error) return { ok: false, error };
  return { ok: true, state: next };
}

export function must(state: MatchState, action: Action): MatchState {
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(result.error);
  return result.state;
}
