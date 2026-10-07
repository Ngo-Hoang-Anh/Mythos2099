import { getUnitDef } from "../data/units";
import { emptyBoard, placeUnit } from "./board";
import { revealUnit } from "./deckTracker";
import { mulberry32State } from "./rng";
import { log, nid } from "./state";
import {
  BASE_SUPPLY,
  HQ_MAX_HP,
  type CardDef,
  type CardInstance,
  type Keyword,
  type MatchState,
  type Phase,
  type PlayerId,
  type PlayerState,
  type UnitInstance,
} from "./types";

function emptyPlayer(id: PlayerId): PlayerState {
  return {
    id,
    hqHp: HQ_MAX_HP,
    triggeredBreakpoints: [],
    commandPoints: 0,
    nextTurnSupplyBonus: 0,
    nextTurnDrawBonus: 0,
    army: [],
    undeployed: [],
    revealedUnitIds: [],
    deck: [],
    hand: [],
    discard: [],
    discardRedrawsUsed: 0,
    deploysThisTurn: 0,
    turnsTaken: 0,
    thinkingTimeSeconds: 180,
  };
}

/** Local match with no 8-unit army, no Fully Prepared, no opening draw. */
export function createSandboxMatch(seed = 1): MatchState {
  const state: MatchState = {
    players: [emptyPlayer(0), emptyPlayer(1)],
    board: emptyBoard(),
    currentPlayer: 0,
    firstPlayerId: 0,
    phase: "deployment",
    turn: 1,
    winner: null,
    seed,
    rngState: mulberry32State(seed),
    log: [],
    fx: [],
    combatPlayback: null,
    combatResumePhase: null,
    phaseStartTime: null,
    statuses: [],
    idSeq: 0,
  };
  state.players[0].turnsTaken = 1;
  state.players[0].commandPoints = BASE_SUPPLY;
  log(state, "Tutorial");
  return state;
}

export interface SpawnSpec {
  defId: number;
  owner: PlayerId;
  col: number;
  row: number;
  rested?: boolean;
  hp?: number;
  keywords?: Keyword[];
}

export function spawnUnit(state: MatchState, spec: SpawnSpec): UnitInstance {
  const def = getUnitDef(spec.defId);
  const unit: UnitInstance = {
    instanceId: nid(state, "u"),
    defId: def.id,
    name: def.name,
    class: def.class,
    owner: spec.owner,
    hp: spec.hp ?? def.hp,
    maxHp: def.hp,
    atk: def.atk,
    armor: def.armor,
    ap: def.ap,
    cost: def.cost,
    col: spec.col,
    row: spec.row,
    keywords: (spec.keywords ?? def.keywords).map((k) => ({ ...k })),
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: spec.rested ?? false,
    combatAtkBonus: 0,
    isAttacker: false,
  };
  if (state.board[spec.col][spec.row]) {
    throw new Error(`Cell ${spec.col},${spec.row} is occupied`);
  }
  placeUnit(state.board, unit);
  revealUnit(state.players[spec.owner], unit.defId);
  return unit;
}

export function setReserve(state: MatchState, player: PlayerId, defIds: number[]): void {
  state.players[player].undeployed = [...defIds];
}

export function setSupply(state: MatchState, player: PlayerId, amount: number): void {
  state.players[player].commandPoints = amount;
}

export function setPhase(state: MatchState, phase: Phase): void {
  state.phase = phase;
}

export function findCardDef(defId: number, templateId: string): CardDef {
  const def = getUnitDef(defId);
  const found = def.cards.find(
    (card) => card.templateId === templateId || card.templateId.startsWith(`${templateId}_`),
  );
  if (!found) throw new Error(`No card ${templateId} on ${defId}`);
  return found;
}

function makeCardInstance(state: MatchState, def: CardDef, ownerUnitId: number): CardInstance {
  return {
    instanceId: nid(state, "c"),
    ownerUnitId,
    templateId: def.templateId,
    name: def.name,
    type: def.type,
    cost: def.cost,
    text: def.text,
    effectId: def.effectId,
    targets: [...def.targets],
    requiresSourceOnField: def.requiresSourceOnField,
  };
}

export function giveCard(
  state: MatchState,
  player: PlayerId,
  def: CardDef,
  ownerUnitId: number,
): CardInstance {
  const card = makeCardInstance(state, def, ownerUnitId);
  state.players[player].hand.push(card);
  return card;
}

export function giveUnitCard(
  state: MatchState,
  player: PlayerId,
  defId: number,
  templateId: string,
  ownerUnitId = defId,
): CardInstance {
  return giveCard(state, player, findCardDef(defId, templateId), ownerUnitId);
}

export function giveUnitDeckCard(
  state: MatchState,
  player: PlayerId,
  defId: number,
  templateId: string,
  ownerUnitId = defId,
): CardInstance {
  const card = makeCardInstance(state, findCardDef(defId, templateId), ownerUnitId);
  state.players[player].deck.push(card);
  return card;
}

export function unitByDef(
  state: MatchState,
  defId: number,
  owner?: PlayerId,
): UnitInstance | null {
  for (const col of state.board) {
    for (const cell of col) {
      if (cell && cell.defId === defId && (owner === undefined || cell.owner === owner)) return cell;
    }
  }
  return null;
}

export function discardedTemplate(state: MatchState, player: PlayerId, templateId: string): boolean {
  return state.players[player].discard.some(
    (card) => card.templateId === templateId || card.templateId.startsWith(`${templateId}_`),
  );
}
