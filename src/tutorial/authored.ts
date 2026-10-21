import { C, type CardCatalogId, getCard } from "../data/cardCatalog";
import { makeInitiativeCard } from "../data/initiative";
import {
  TUTORIAL_ART_ALIAS,
  TUTORIAL_SQUAD_ALIAS,
  TUTORIAL_SPRITE_ALIAS,
} from "../data/tutorialUnits";
import { UNIT_BY_ID } from "../data/units";
import { keywordTutorial, STAT_HELP } from "../engine/armySummary";
import { parseKeywords } from "../engine/keywords";
import {
  createSandboxMatch,
  giveUnitCard,
  giveUnitDeckCard,
  setReserve,
  spawnUnit,
} from "../engine/sandbox";
import { log, nid } from "../engine/state";
import {
  INITIATIVE_TEMPLATE_ID,
  P1_SUPPORT,
  P2_SUPPORT,
  type Action,
  type BoardPos,
  type CardDef,
  type Direction,
  type InitiativeChoice,
  type Keyword,
  type KeywordName,
  type LogEntry,
  type MatchState,
  type Phase,
  type PlayerId,
  type PlayTargets,
  type UnitClass,
  type UnitDef,
  type UnitInstance,
} from "../engine/types";
import type { LessonHint, TutorialHud } from "./lessons";

/** Hidden log line. Keeps a beat done after its board check would revert next turn. */
export const BEAT_MARK = "@@beat:";

export type HubStat = "hp" | "atk" | "armor" | "ap" | "supply";

export type DoneCheck =
  | {
      type: "unitOn";
      defId: number;
      owner: PlayerId;
      col?: number;
      row?: number;
    }
  | { type: "unitGone"; defId: number; owner: PlayerId }
  | { type: "hpAtMost"; defId: number; owner: PlayerId; hp: number }
  | { type: "hqAtMost"; player: PlayerId; hp: number }
  | { type: "discarded"; player: PlayerId; templateId: string; count?: number }
  | { type: "phase"; phase: Phase }
  | { type: "and"; checks: DoneCheck[] };

export interface BeatUnitRef {
  defId: number;
  owner: PlayerId;
  col?: number;
  row?: number;
}

export interface BeatTargets {
  units?: BeatUnitRef[];
  directions?: Direction[];
  cells?: BoardPos[];
  hq?: boolean;
  choice?: InitiativeChoice;
}

export type BeatAction =
  | {
      type: "deploy";
      unitDefId: number;
      row: number;
      discardTemplateIds?: string[];
    }
  | {
      type: "playCard";
      templateId: string;
      ownerUnitId?: number;
      targets: BeatTargets;
    }
  | { type: "discardRedraw"; templateId: string; ownerUnitId?: number }
  | { type: "endDeployment" }
  | { type: "endManeuver" };

export interface BeatHint {
  anchor: string;
  title: string;
  body: string;
  next?: boolean;
  keywords?: Keyword[];
}

export interface Beat {
  id: string;
  label: string;
  actor: PlayerId;
  action: BeatAction;
  done: DoneCheck;
  block: string;
  hint?: BeatHint;
}

export interface CustomUnitDraft {
  id: number;
  name: string;
  class: UnitClass;
  hp: number;
  atk: number;
  armor: number;
  ap: number;
  cost: number;
  /** Comma-separated, parsed with the same rules as the catalog. */
  keywordText: string;
  cardTemplateIds: string[];
  artAliasId?: number;
}

export interface PlacedUnitDraft {
  defId: number;
  owner: PlayerId;
  col: number;
  row: number;
  rested?: boolean;
  hp?: number;
  atk?: number;
  armor?: number;
  ap?: number;
  /** Pre-lock a missile mark (Heatseeking lessons). */
  missileTarget?: BoardPos;
}

export interface CardSlot {
  player: PlayerId;
  ownerDefId: number;
  templateId: string;
}

/** How a free-play lesson (empty `beats`) declares victory. */
export type FreePlayWin = "hq" | "elimination" | "comeback";

export interface ScenarioDraft {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  coach: string[];
  formula?: string;
  success: string;
  hubStats: HubStat[];
  keywords: Keyword[];
  youFirst: boolean;
  supply: [number, number];
  hq: [{ hp: number; max: number }, { hp: number; max: number }];
  board: PlacedUnitDraft[];
  reserve: [number[], number[]];
  hand: CardSlot[];
  deck: CardSlot[];
  units: CustomUnitDraft[];
  beats: Beat[];
  /** Skip Deployment and open in this phase (Maneuver card lessons). */
  startPhase?: Phase;
  /**
   * Free-play: win when the student wins the match this way.
   * Empty `beats` + `win` → no action gating.
   */
  win?: FreePlayWin;
  /**
   * Explicit spotlight curriculum for this lesson only.
   * Do not infer from hubStats — hub icons can mention Supply without re-teaching it.
   */
  spotlight?: {
    /** Stat intro dialogs (Next). */
    stats?: HubStat[];
    /** Keyword intro dialogs from `keywords`. */
    keywords?: boolean;
    /** Teach Reserve / summon (basic only). */
    reserve?: boolean;
    /** Teach hourglass / end phase (basic only). */
    hourglass?: boolean;
    /** Teach drag-up to play a card (first card lesson). */
    cards?: boolean;
    /** Teach drag-to-deck discard & redraw. */
    discardRedraw?: boolean;
    /** Show Comeback dialog when next-turn Supply/draw bonuses are queued. */
    comeback?: boolean;
  };
}

export function emptyDraft(): ScenarioDraft {
  return {
    id: "custom-lesson",
    number: 18,
    title: "Custom lesson",
    subtitle: "Authored scenario",
    coach: ["Describe what the student should do."],
    success: "Lesson complete.",
    hubStats: [],
    keywords: [],
    youFirst: true,
    supply: [4, 4],
    hq: [
      { hp: 60, max: 60 },
      { hp: 60, max: 60 },
    ],
    board: [],
    reserve: [[], []],
    hand: [],
    deck: [],
    units: [],
    beats: [],
  };
}

/** Catalog key whose card.templateId equals `templateId` (keys and ids differ for cost variants). */
export function catalogIdForTemplate(
  templateId: string,
): CardCatalogId | undefined {
  for (const key of Object.keys(C) as CardCatalogId[]) {
    if (getCard(key).templateId === templateId) return key;
  }
  return undefined;
}

export function cardDefForTemplate(templateId: string): CardDef {
  const id = catalogIdForTemplate(templateId);
  if (!id) throw new Error(`Unknown card template: ${templateId}`);
  return getCard(id);
}

export function resolveCatalogCard(idOrTemplate: string): CardDef {
  if ((Object.keys(C) as string[]).includes(idOrTemplate))
    return getCard(idOrTemplate as CardCatalogId);
  return cardDefForTemplate(idOrTemplate);
}

const registeredIds = new Set<number>();
/** Snapshot of catalog/tutorial defs overwritten by a draft (restored on next register). */
const overwrittenDefs = new Map<number, UnitDef>();
const overwrittenArt = new Map<number, number>();
const overwrittenSquad = new Map<number, number>();
const overwrittenSprite = new Map<number, number>();

function restoreAlias(
  map: Record<number, number>,
  prior: Map<number, number>,
  id: number,
): void {
  const value = prior.get(id);
  if (value != null) map[id] = value;
  else delete map[id];
  prior.delete(id);
}

function snapshotAlias(
  map: Record<number, number>,
  prior: Map<number, number>,
  id: number,
): void {
  if (map[id] != null && !prior.has(id)) prior.set(id, map[id]!);
}

export function customUnitDef(draft: CustomUnitDraft): UnitDef {
  return {
    id: draft.id,
    name: draft.name.trim() || `Unit ${draft.id}`,
    class: draft.class,
    hp: draft.hp,
    atk: draft.atk,
    armor: draft.armor,
    ap: draft.ap,
    cost: draft.cost,
    keywords: draft.keywordText.trim() ? parseKeywords(draft.keywordText) : [],
    cards: draft.cardTemplateIds.map((id) => resolveCatalogCard(id)),
    lore: "",
    hasArt: draft.artAliasId != null,
  };
}

export function registerDraftUnits(units: readonly CustomUnitDraft[]): void {
  for (const id of registeredIds) {
    const prior = overwrittenDefs.get(id);
    if (prior) UNIT_BY_ID[id] = prior;
    else delete UNIT_BY_ID[id];
    overwrittenDefs.delete(id);
    restoreAlias(TUTORIAL_ART_ALIAS, overwrittenArt, id);
    restoreAlias(TUTORIAL_SQUAD_ALIAS, overwrittenSquad, id);
    restoreAlias(TUTORIAL_SPRITE_ALIAS, overwrittenSprite, id);
  }
  registeredIds.clear();
  for (const draft of units) {
    if (draft.id < 1)
      throw new Error(`Custom unit id ${draft.id} must be >= 1`);
    if (UNIT_BY_ID[draft.id] && !overwrittenDefs.has(draft.id)) {
      overwrittenDefs.set(draft.id, UNIT_BY_ID[draft.id]!);
    }
    snapshotAlias(TUTORIAL_ART_ALIAS, overwrittenArt, draft.id);
    snapshotAlias(TUTORIAL_SQUAD_ALIAS, overwrittenSquad, draft.id);
    snapshotAlias(TUTORIAL_SPRITE_ALIAS, overwrittenSprite, draft.id);
    UNIT_BY_ID[draft.id] = customUnitDef(draft);
    registeredIds.add(draft.id);
    // Alias may resolve via tank, squad, or sprite packs — each getter picks what exists.
    if (draft.artAliasId != null) {
      TUTORIAL_ART_ALIAS[draft.id] = draft.artAliasId;
      TUTORIAL_SQUAD_ALIAS[draft.id] = draft.artAliasId;
      TUTORIAL_SPRITE_ALIAS[draft.id] = draft.artAliasId;
    }
  }
}

export function setupScenario(draft: ScenarioDraft): MatchState {
  registerDraftUnits(draft.units);
  const state = createSandboxMatch();
  if (!draft.youFirst) {
    state.players[0].turnsTaken = 0;
    state.currentPlayer = 1;
    state.firstPlayerId = 1;
    state.players[1].turnsTaken = 1;
  }
  for (const id of [0, 1] as const) {
    state.players[id].hqHp = draft.hq[id].hp;
    state.players[id].hqMaxHp = draft.hq[id].max;
    state.players[id].commandPoints = draft.supply[id];
    setReserve(state, id, draft.reserve[id]);
  }
  for (const placed of draft.board) {
    const unit = spawnUnit(state, {
      defId: placed.defId,
      owner: placed.owner,
      col: placed.col,
      row: placed.row,
      rested: placed.rested,
      hp: placed.hp,
    });
    if (placed.hp != null) unit.maxHp = Math.max(unit.maxHp, placed.hp);
    if (placed.atk != null) unit.atk = placed.atk;
    if (placed.armor != null) unit.armor = placed.armor;
    if (placed.ap != null) unit.ap = placed.ap;
    if (placed.missileTarget) unit.missileTarget = { ...placed.missileTarget };
  }
  if (draft.startPhase) state.phase = draft.startPhase;
  for (const card of draft.hand) {
    if (card.templateId === INITIATIVE_TEMPLATE_ID) {
      state.players[card.player].hand.push(makeInitiativeCard(nid(state, "c")));
      continue;
    }
    giveUnitCard(state, card.player, card.ownerDefId, card.templateId);
  }
  for (const card of draft.deck) {
    giveUnitDeckCard(state, card.player, card.ownerDefId, card.templateId);
  }
  markBeatProgress(state, draft.beats);
  return state;
}

export function supportCol(owner: PlayerId): number {
  return owner === 0 ? P1_SUPPORT : P2_SUPPORT;
}

function walkLog(
  entries: readonly LogEntry[],
  visit: (entry: LogEntry) => void,
): void {
  for (const entry of entries) {
    visit(entry);
    if (entry.children) walkLog(entry.children, visit);
  }
}

export function beatMarked(match: MatchState, id: string): boolean {
  let found = false;
  walkLog(match.log, (entry) => {
    if (entry.text === `${BEAT_MARK}${id}`) found = true;
  });
  return found;
}

function unitsOf(
  match: MatchState,
  defId: number,
  owner: PlayerId,
  col?: number,
  row?: number,
): UnitInstance[] {
  const found: UnitInstance[] = [];
  for (const column of match.board) {
    for (const unit of column) {
      if (!unit || unit.defId !== defId || unit.owner !== owner) continue;
      if (col != null && unit.col !== col) continue;
      if (row != null && unit.row !== row) continue;
      found.push(unit);
    }
  }
  return found;
}

export function templateMatch(cardTemplate: string, wanted: string): boolean {
  return cardTemplate === wanted || cardTemplate.startsWith(`${wanted}_`);
}

function discardCount(
  match: MatchState,
  player: PlayerId,
  templateId: string,
): number {
  return match.players[player].discard.filter((card) =>
    templateMatch(card.templateId, templateId),
  ).length;
}

export function checkDone(match: MatchState, check: DoneCheck): boolean {
  switch (check.type) {
    case "and":
      return check.checks.every((child) => checkDone(match, child));
    case "unitOn":
      return unitsOf(
        match,
        check.defId,
        check.owner,
        check.col,
        check.row,
      ).some((unit) => unit.hp > 0);
    case "unitGone":
      return unitsOf(match, check.defId, check.owner).length === 0;
    case "hpAtMost": {
      const units = unitsOf(match, check.defId, check.owner);
      if (units.length === 0) return true;
      return units.every((unit) => unit.hp <= check.hp);
    }
    case "hqAtMost":
      return match.players[check.player].hqHp <= check.hp;
    case "discarded":
      return (
        discardCount(match, check.player, check.templateId) >=
        (check.count ?? 1)
      );
    case "phase":
      return match.phase === check.phase;
    default:
      return false;
  }
}

export function markBeatProgress(
  match: MatchState,
  beats: readonly Beat[],
): void {
  for (const beat of beats) {
    if (beatMarked(match, beat.id)) continue;
    if (!checkDone(match, beat.done)) break;
    log(match, `${BEAT_MARK}${beat.id}`);
  }
}

export function beatSettled(match: MatchState, beat: Beat): boolean {
  return beatMarked(match, beat.id) || checkDone(match, beat.done);
}

export function firstOpenBeat(
  match: MatchState,
  beats: readonly Beat[],
): Beat | undefined {
  return beats.find((beat) => !beatSettled(match, beat));
}

function findHandCard(
  match: MatchState,
  player: PlayerId,
  templateId: string,
  ownerUnitId?: number,
) {
  return match.players[player].hand.find(
    (card) =>
      templateMatch(card.templateId, templateId) &&
      (ownerUnitId == null || card.ownerUnitId === ownerUnitId),
  );
}

function findUnit(match: MatchState, ref: BeatUnitRef): UnitInstance | null {
  return (
    unitsOf(match, ref.defId, ref.owner, ref.col, ref.row).find(
      (unit) => unit.hp > 0,
    ) ?? null
  );
}

function sameCells(
  a: BoardPos[] | undefined,
  b: BoardPos[] | undefined,
): boolean {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  return left.every(
    (cell, i) => cell.col === right[i]!.col && cell.row === right[i]!.row,
  );
}

function sameDirs(
  a: Direction[] | undefined,
  b: Direction[] | undefined,
): boolean {
  const left = a ?? [];
  const right = b ?? [];
  return (
    left.length === right.length && left.every((dir, i) => dir === right[i])
  );
}

function targetsMatch(
  match: MatchState,
  spec: BeatTargets,
  actual: PlayTargets,
): boolean {
  if (!sameCells(spec.cells, actual.cells)) return false;
  if (!sameDirs(spec.directions, actual.directions)) return false;
  if (!!spec.hq !== !!actual.hq) return false;
  if ((spec.choice ?? undefined) !== (actual.choice ?? undefined)) return false;
  const wanted = spec.units ?? [];
  const got = actual.unitIds ?? [];
  if (wanted.length !== got.length) return false;
  return wanted.every((ref, i) => findUnit(match, ref)?.instanceId === got[i]);
}

function discardTemplates(
  match: MatchState,
  player: PlayerId,
  ids: string[] | undefined,
): string[] | null {
  if (!ids?.length) return [];
  const out: string[] = [];
  for (const id of ids) {
    const card = match.players[player].hand.find(
      (entry) => entry.instanceId === id,
    );
    if (!card) return null;
    out.push(card.templateId);
  }
  return out;
}

function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((item, i) => item === right[i]);
}

export function actionMatches(
  match: MatchState,
  beat: Beat,
  action: Action,
): boolean {
  const expected = beat.action;
  if (expected.type !== action.type) return false;
  if (expected.type === "endDeployment" || expected.type === "endManeuver")
    return true;
  if (expected.type === "deploy" && action.type === "deploy") {
    if (expected.unitDefId !== action.unitDefId || expected.row !== action.row)
      return false;
    const got = discardTemplates(match, beat.actor, action.discardCardIds);
    if (!got) return false;
    return sameMultiset(expected.discardTemplateIds ?? [], got);
  }
  if (expected.type === "playCard" && action.type === "playCard") {
    const card = match.players[beat.actor].hand.find(
      (entry) => entry.instanceId === action.cardId,
    );
    if (!card || !templateMatch(card.templateId, expected.templateId))
      return false;
    if (
      expected.ownerUnitId != null &&
      card.ownerUnitId !== expected.ownerUnitId
    )
      return false;
    return targetsMatch(match, expected.targets, action.targets);
  }
  if (expected.type === "discardRedraw" && action.type === "discardRedraw") {
    const card = match.players[beat.actor].hand.find(
      (entry) => entry.instanceId === action.cardId,
    );
    if (!card || !templateMatch(card.templateId, expected.templateId))
      return false;
    return (
      expected.ownerUnitId == null || card.ownerUnitId === expected.ownerUnitId
    );
  }
  return false;
}

function resolveDiscardIds(
  match: MatchState,
  player: PlayerId,
  templates: string[] | undefined,
): string[] | null {
  if (!templates?.length) return [];
  const hand = [...match.players[player].hand];
  const ids: string[] = [];
  for (const templateId of templates) {
    const idx = hand.findIndex((card) =>
      templateMatch(card.templateId, templateId),
    );
    if (idx < 0) return null;
    ids.push(hand[idx]!.instanceId);
    hand.splice(idx, 1);
  }
  return ids;
}

function toPlayTargets(
  match: MatchState,
  spec: BeatTargets,
): PlayTargets | null {
  const targets: PlayTargets = {};
  if (spec.units?.length) {
    const ids: string[] = [];
    for (const ref of spec.units) {
      const unit = findUnit(match, ref);
      if (!unit) return null;
      ids.push(unit.instanceId);
    }
    targets.unitIds = ids;
  }
  if (spec.cells?.length)
    targets.cells = spec.cells.map((cell) => ({ ...cell }));
  if (spec.directions?.length) targets.directions = [...spec.directions];
  if (spec.hq) targets.hq = true;
  if (spec.choice) targets.choice = spec.choice;
  return targets;
}

export function beatToAction(match: MatchState, beat: Beat): Action | null {
  const action = beat.action;
  switch (action.type) {
    case "endDeployment":
      return { type: "endDeployment" };
    case "endManeuver":
      return { type: "endManeuver" };
    case "deploy": {
      const discardCardIds = resolveDiscardIds(
        match,
        beat.actor,
        action.discardTemplateIds,
      );
      if (!discardCardIds) return null;
      return {
        type: "deploy",
        unitDefId: action.unitDefId,
        row: action.row,
        ...(discardCardIds.length ? { discardCardIds } : {}),
      };
    }
    case "playCard": {
      const card = findHandCard(
        match,
        beat.actor,
        action.templateId,
        action.ownerUnitId,
      );
      if (!card) return null;
      const targets = toPlayTargets(match, action.targets);
      if (!targets) return null;
      return { type: "playCard", cardId: card.instanceId, targets };
    }
    case "discardRedraw": {
      const card = findHandCard(
        match,
        beat.actor,
        action.templateId,
        action.ownerUnitId,
      );
      if (!card) return null;
      return { type: "discardRedraw", cardId: card.instanceId };
    }
    default:
      return null;
  }
}

export function scriptedFromBeats(
  beats: readonly Beat[],
): (match: MatchState) => Action | null {
  return (match) => {
    if (match.currentPlayer !== 1 || match.combatPlayback) return null;
    const open = firstOpenBeat(match, beats);
    if (!open || open.actor !== 1) return null;
    return beatToAction(match, open);
  };
}

export function allowFromBeats(
  beats: readonly Beat[],
): (match: MatchState, action: Action) => string | null {
  return (match, action) => {
    if (action.type === "endEngagement") return null;
    const open = firstOpenBeat(match, beats);
    if (!open) return "This lesson is over.";
    if (
      match.currentPlayer !== open.actor ||
      !actionMatches(match, open, action)
    )
      return open.block;
    return null;
  };
}

export function stepsFromBeats(beats: readonly Beat[]): {
  id: string;
  label: string;
  done: (match: MatchState) => boolean;
}[] {
  return beats.map((beat) => ({
    id: beat.id,
    label: beat.label,
    done: (match: MatchState) => beatSettled(match, beat),
  }));
}

export function hintFromBeats(
  beats: readonly Beat[],
): (
  match: MatchState,
  hud: TutorialHud,
  dismissed: ReadonlySet<string>,
) => LessonHint | null {
  return (match, _hud, dismissed) => {
    const open = firstOpenBeat(match, beats);
    if (!open?.hint || dismissed.has(open.id)) return null;
    return {
      id: open.id,
      anchor: open.hint.anchor,
      title: open.hint.title,
      body: open.hint.body,
      ...(open.hint.next ? { next: true } : {}),
      ...(open.hint.keywords?.length ? { keywords: open.hint.keywords } : {}),
    };
  };
}

export function lessonBehavior(beats: readonly Beat[]) {
  return {
    scriptedAction: scriptedFromBeats(beats),
    allow: allowFromBeats(beats),
    afterAction: (match: MatchState) => markBeatProgress(match, beats),
    pickHint: hintFromBeats(beats),
    steps: stepsFromBeats(beats),
  };
}

export function isFreePlay(draft: ScenarioDraft): boolean {
  return draft.beats.length === 0 && draft.win != null;
}

function freePlayWon(match: MatchState, win: FreePlayWin): boolean {
  if (win === "comeback") {
    const you = match.players[0];
    return you.nextTurnSupplyBonus > 0 || you.nextTurnDrawBonus > 0;
  }
  if (match.winner !== 0) return false;
  if (win === "hq") return match.winReason === "hq";
  return match.winReason === "elimination";
}

/** P2 only ends phases — no clever AI. */
export function idleOpponentScript(match: MatchState): Action | null {
  if (match.currentPlayer !== 1 || match.combatPlayback || match.winner != null)
    return null;
  if (match.phase === "deployment") return { type: "endDeployment" };
  if (match.phase === "maneuver") return { type: "endManeuver" };
  return null;
}

function hintNext(
  id: string,
  anchor: string,
  title: string,
  body: string,
  keywords?: Keyword[],
): LessonHint {
  return { id, anchor, title, body, keywords, next: true };
}

function hintGo(
  id: string,
  anchor: string,
  title: string,
  body: string,
): LessonHint {
  return { id, anchor, title, body };
}

function boardUnits(match: MatchState): UnitInstance[] {
  const found: UnitInstance[] = [];
  for (const column of match.board) {
    for (const unit of column) {
      if (unit && unit.hp > 0) found.push(unit);
    }
  }
  return found;
}

function unitForStat(match: MatchState, stat: HubStat): UnitInstance | null {
  const units = boardUnits(match);
  const prefer = (test: (unit: UnitInstance) => boolean) =>
    units.find((unit) => unit.owner === 0 && test(unit)) ??
    units.find(test) ??
    null;
  if (stat === "hp") return prefer(() => true);
  if (stat === "atk") return prefer((unit) => unit.atk > 0);
  if (stat === "armor") return prefer((unit) => unit.armor > 0);
  if (stat === "ap") return prefer((unit) => unit.ap > 0);
  return null;
}

function unitForKeyword(
  match: MatchState,
  name: KeywordName,
): UnitInstance | null {
  return (
    boardUnits(match).find((unit) =>
      unit.keywords.some((keyword) => keyword.name === name),
    ) ?? null
  );
}

function introStatHint(
  match: MatchState,
  draft: ScenarioDraft,
  stat: HubStat,
): LessonHint {
  const help = STAT_HELP[stat];
  if (stat === "supply") {
    return hintNext(`intro-${stat}`, "supply", help.title, help.body);
  }
  const unit = unitForStat(match, stat);
  if (unit) {
    return hintNext(
      `intro-${stat}`,
      `${stat}-${unit.defId}`,
      help.title,
      help.body,
    );
  }
  const reserved = draft.reserve[0][0];
  if (reserved != null) {
    return hintNext(
      `intro-${stat}`,
      `reserve-unit-${reserved}`,
      help.title,
      help.body,
    );
  }
  return hintNext(`intro-${stat}`, "reserve", help.title, help.body);
}

function introKeywordHint(
  match: MatchState,
  draft: ScenarioDraft,
  keyword: Keyword,
): LessonHint {
  const help = keywordTutorial(keyword);
  const onBoard = unitForKeyword(match, keyword.name);
  if (onBoard) {
    return hintNext(
      `intro-kw-${keyword.name}`,
      `kw-${keyword.name}-${onBoard.defId}`,
      help.title,
      help.body,
      [keyword],
    );
  }
  const fromDraft = draft.units.find((unit) =>
    parseKeywords(unit.keywordText || "").some(
      (item) => item.name === keyword.name,
    ),
  );
  if (fromDraft && draft.reserve[0].includes(fromDraft.id)) {
    return hintNext(
      `intro-kw-${keyword.name}`,
      `reserve-unit-${fromDraft.id}`,
      help.title,
      help.body,
      [keyword],
    );
  }
  return hintNext(
    `intro-kw-${keyword.name}`,
    "reserve",
    help.title,
    help.body,
    [keyword],
  );
}

/** Reserve / hourglass go-hints — only when this lesson opts in via `spotlight`. */
function freePlayChromeHint(
  match: MatchState,
  hud: TutorialHud,
  spot: NonNullable<ScenarioDraft["spotlight"]>,
): LessonHint | null {
  if (match.winner != null || match.currentPlayer !== 0) return null;
  // Card / deploy targeting uses real board highlights (green Drop here / Move here,
  // gold/red unit reticles) — never cover them with a yellow tut spotlight.
  if (hud.boardTargeting || hud.targetingTemplateId || hud.initiativeOpen || hud.pendingDeploy)
    return null;

  if (spot.reserve && match.phase === "deployment") {
    const reserve = match.players[0].undeployed;
    if (reserve.length > 0) {
      if (hud.reserveOpen) {
        const id = reserve[0]!;
        const name = UNIT_BY_ID[id]?.name ?? `Unit ${id}`;
        return hintGo("pick", `reserve-unit-${id}`, name, `Click ${name}.`);
      }
      return hintGo("reserve", "reserve", "Reserve", "Click to summon a unit.");
    }
  }

  if (
    spot.hourglass &&
    (match.phase === "deployment" || match.phase === "maneuver")
  ) {
    if (
      match.phase === "deployment" &&
      match.players[0].undeployed.length > 0 &&
      spot.reserve
    ) {
      return null;
    }
    return hintGo(
      "hourglass",
      "hourglass",
      "Press the hourglass",
      match.phase === "deployment"
        ? "End Deployment and continue."
        : "End Maneuver to fight.",
    );
  }

  return null;
}

/**
 * Spotlight only what this lesson declares in `draft.spotlight`.
 * hubStats alone never create intros (icons ≠ teaching).
 */
export function freePlayPickHint(
  draft: ScenarioDraft,
): (
  match: MatchState,
  hud: TutorialHud,
  dismissed: ReadonlySet<string>,
) => LessonHint | null {
  const spot = draft.spotlight;
  if (!spot) return () => null;

  return (match, hud, dismissed) => {
    // While deploying or targeting a card, leave the board's real reticles alone.
    if (hud.boardTargeting || hud.targetingTemplateId || hud.initiativeOpen || hud.pendingDeploy)
      return null;

    for (const stat of spot.stats ?? []) {
      const id = `intro-${stat}`;
      if (!dismissed.has(id)) return introStatHint(match, draft, stat);
    }
    if (spot.keywords) {
      for (const keyword of draft.keywords) {
        const id = `intro-kw-${keyword.name}`;
        if (!dismissed.has(id)) return introKeywordHint(match, draft, keyword);
      }
    }
    if (match.currentPlayer === 0 && match.phase === "maneuver") {
      if (spot.cards && !dismissed.has("ui-card-play")) {
        return hintNext(
          "ui-card-play",
          "hand",
          "Play a card",
          "Drag a card up onto the board to play it. Legal targets light up on the board.",
        );
      }
      if (spot.discardRedraw && !dismissed.has("ui-card-discard")) {
        return hintNext(
          "ui-card-discard",
          "deck",
          "Discard to redraw",
          "Drag a card onto your deck to discard it and draw a replacement.",
        );
      }
    }
    if (
      spot.comeback &&
      !dismissed.has("intro-comeback") &&
      (match.players[0].nextTurnSupplyBonus > 0 ||
        match.players[0].nextTurnDrawBonus > 0)
    ) {
      return hintNext(
        "intro-comeback",
        "supply",
        "Comeback",
        "You are behind. Next turn you get +1 Supply and +1 card draw — spend them to fight back.",
      );
    }
    return freePlayChromeHint(match, hud, spot);
  };
}

export function freePlayBehavior(draft: ScenarioDraft) {
  const win = draft.win!;
  return {
    allow: (_match: MatchState, _action: Action) => null as string | null,
    allowDiscardRedraw: true as const,
    pickHint: freePlayPickHint(draft),
    scriptedAction: idleOpponentScript,
    steps: [
      {
        id: "win",
        label:
          win === "hq"
            ? "Destroy the enemy HQ"
            : win === "comeback"
              ? "Trigger Comeback aid"
              : "Eliminate all enemy forces",
        done: (match: MatchState) => freePlayWon(match, win),
      },
    ],
  };
}

function collectCheckUnits(check: DoneCheck, ids: Set<number>): void {
  if (check.type === "and") {
    for (const child of check.checks) collectCheckUnits(child, ids);
    return;
  }
  if (
    check.type === "unitOn" ||
    check.type === "unitGone" ||
    check.type === "hpAtMost"
  )
    ids.add(check.defId);
}

export function referencedUnitIds(draft: ScenarioDraft): number[] {
  const ids = new Set<number>();
  for (const unit of draft.units) ids.add(unit.id);
  for (const placed of draft.board) ids.add(placed.defId);
  for (const side of draft.reserve) for (const id of side) ids.add(id);
  for (const card of [...draft.hand, ...draft.deck]) ids.add(card.ownerDefId);
  for (const beat of draft.beats) {
    const action = beat.action;
    if (action.type === "deploy") ids.add(action.unitDefId);
    if (
      (action.type === "playCard" || action.type === "discardRedraw") &&
      action.ownerUnitId != null
    ) {
      ids.add(action.ownerUnitId);
    }
    if (action.type === "playCard") {
      for (const unit of action.targets.units ?? []) ids.add(unit.defId);
    }
    collectCheckUnits(beat.done, ids);
  }
  return [...ids];
}
