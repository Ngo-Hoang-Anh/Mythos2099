import { useEffect, useRef, useState, type DragEvent } from "react";
import { boardFacingDeg } from "../data/unitArt";
import { getUnitDef } from "../data/units";
import { INITIATIVE_CARD_NAME, isInitiativeCard } from "../data/initiative";
import { cloneBoard, findUnit, isSupport, supportCol, unitsOf } from "../engine/board";
import {
  canAffordDeploy,
  discardsNeeded,
  needsDesperateMeasure,
} from "../engine/desperateMeasure";
import { destCountForEffect, dirsForEffect, samePos, unitsNeededForMove, allowsPartialMove, minDestCountForEffect, minUnitsNeededForMove } from "../engine/move";
import { isUntargetableBy } from "../engine/status";
import {
  DISCARD_REDRAW_LIMIT,
  type Action,
  type BoardPos,
  type CardInstance,
  type EffectId,
  type FxEvent,
  type InitiativeChoice,
  type MatchState,
  type PlayTargets,
  type PlayerId,
  type TargetKind,
  type UnitInstance,
} from "../engine/types";
import { BoardView } from "./BoardView";
import { EnemyDeckTracker, OwnDeckTracker } from "./DeckTracker";
import { HandView } from "./HandView";
import { MobileHandView } from "../mobile/MobileHandView";
import { resolvePointerDropZone } from "../mobile/pointerCardDrag";
import { RecycleIcon, SupplyIcon, WhiteFlagIcon } from "./icons";
import { SgIconBtn, sgButton } from "./UiChrome";
import { UnitCardPills } from "./CardTip";
import { LogView } from "./LogView";
import { UnitKeywords, UnitPortrait } from "./UnitToken";
import { UnitDetailDialog, type UnitDetailTarget } from "./UnitDetailDialog";
import { AnchoredPanel } from "./AnchoredTip";
import { heldPlaybackAfterState } from "./combatPlayback";
import { onPageHidden } from "./pageVisibility";
import { allowDrop, centerOf, readDrag, type DragKind, type DragPayload } from "./dnd";
import {
  awaitingMoveDest,
  canPickSequentialMoveUnit,
  isSequentialTwoUnitMove,
  moveDestPrompt,
  moveDestUnderUnit,
  moveHighlights as moveDestHighlights,
  sequentialMoveStuck,
} from "./moveTargeting";
import type { TutorialHud } from "../tutorial";

interface TargetDraft {
  card: CardInstance;
  kinds: TargetKind[];
  unitIds: string[];
  cells: BoardPos[];
  hq: boolean;
  prompt: string;
  choice?: InitiativeChoice;
}

function targetingEffect(draft: TargetDraft): EffectId {
  // Fully Prepared move uses 8-way dirs on effectId "initiative" — not the Forward card.
  if (draft.choice === "forward" || draft.choice === "move") {
    return draft.card.effectId === "initiative" ? "initiative" : "forward";
  }
  return draft.card.effectId;
}

const PHASE_LABEL = {
  deployment: "Deployment",
  maneuver: "Maneuver",
  engagement: "Engagement",
  gameover: "Game Over",
} as const;

const TURN_PHASES = ["deployment", "maneuver", "engagement"] as const;

const COMBAT_SPEED_KEY = "al-combat-speed";

function loadCombatSpeed(): "detail" | "quick" {
  try {
    return localStorage.getItem(COMBAT_SPEED_KEY) === "quick" ? "quick" : "detail";
  } catch {
    return "detail";
  }
}

function nextPhaseOf(match: MatchState): "deployment" | "maneuver" | "engagement" {
  if (match.phase === "deployment") return "maneuver";
  if (match.phase === "maneuver") return "engagement";
  return "deployment";
}

/** Label above the hourglass: Next phase in Deployment, End turn from Maneuver. */
function phaseAdvanceLabel(match: MatchState): string {
  return match.phase === "maneuver" ? "End turn" : "Next phase";
}

function promptFor(kind: TargetKind | undefined, picked: number): string {
  switch (kind) {
    case "friendly":
      return "Click a friendly unit on the board";
    case "enemy":
    case "anyEnemy":
      return "Click an enemy unit on the board";
    case "anyUnit":
      return "Click a unit on the board";
    case "enemySupport":
      return "Click an enemy unit on the Support line";
    case "selfOrHq":
    case "allyOrHq":
    case "hqOrAlly":
      return "Click a friendly unit, or your HQ";
    case "twoAdjacentAllies":
      return picked === 0 ? "Click the first friendly unit" : "Click the adjacent friendly unit";
    case "twoAllies":
      return picked === 0 ? "Click the first friendly unit" : "Click the second friendly unit";
    case "boardDest":
      return picked === 0 ? "Click a friendly unit on the board" : "Click a highlighted cell";
    case "twoDirectionsSameUnit":
      if (picked === 0) return "Click the unit that will move";
      return `Click destination ${picked} (or Done after 1)`;
    case "twoUnitsOneStep":
      return `Click friendly unit ${picked + 1}, then its destination (Done after 1)`;
    case "lure":
      return picked === 0 ? "Click a friendly unit (lure)" : "Click an enemy in an adjacent lane";
    default:
      return "Choose a target";
  }
}

function moveHighlights(match: MatchState, draft: TargetDraft): BoardPos[] {
  return moveDestHighlights(match, targetingEffect(draft), draft.unitIds, draft.cells);
}

/** Enemy units that can be clicked for the current draft — red reticle while picking. */
function hostileAimIds(match: MatchState, draft: TargetDraft | null, viewer: PlayerId): string[] {
  if (!draft) return [];
  const kinds = draft.kinds;
  const foe = (viewer === 0 ? 1 : 0) as PlayerId;
  const enemies = unitsOf(match.board, foe).filter(
    (u) => u.hp > 0 && !isUntargetableBy(match, u, viewer),
  );
  if (kinds.includes("enemySupport")) {
    return enemies.filter((u) => isSupport(u.owner, u.col)).map((u) => u.instanceId);
  }
  if (kinds.includes("enemy") || kinds.includes("anyEnemy") || kinds.includes("anyUnit")) {
    return enemies.map((u) => u.instanceId);
  }
  if (kinds.includes("lure") && draft.unitIds.length === 1) {
    const ally = findUnit(match.board, draft.unitIds[0]);
    if (!ally) return [];
    return enemies.filter((e) => Math.abs(e.row - ally.row) === 1).map((e) => e.instanceId);
  }
  return [];
}

function destPrompt(match: MatchState, draft: TargetDraft, viewer: PlayerId): string {
  return moveDestPrompt(match, targetingEffect(draft), draft.unitIds, draft.cells, viewer);
}

function draftReady(draft: TargetDraft): boolean {
  const needed = draft.kinds;
  const moveDirs = dirsForEffect(targetingEffect(draft));
  if (moveDirs) {
    const effect = targetingEffect(draft);
    const maxDest = destCountForEffect(effect);
    const maxUnits = unitsNeededForMove(effect);
    if (isSequentialTwoUnitMove(effect)) {
      return draft.unitIds.length === maxUnits && draft.cells.length === maxDest;
    }
    return draft.unitIds.length === maxUnits && draft.cells.length === maxDest;
  }
  if (needed.length === 1 && needed[0] === "friendly") return draft.unitIds.length === 1;
  if (needed.includes("twoAdjacentAllies") || needed.includes("twoAllies")) return draft.unitIds.length === 2;
  if (needed.includes("lure")) return draft.unitIds.length === 2;
  if (needed.includes("selfOrHq") || needed.includes("allyOrHq") || needed.includes("hqOrAlly")) {
    return draft.hq || draft.unitIds.length === 1;
  }
  if (needed.includes("enemy") || needed.includes("anyEnemy") || needed.includes("enemySupport") || needed.includes("anyUnit")) {
    return draft.unitIds.length === 1;
  }
  return false;
}

function canConfirmPartial(draft: TargetDraft): boolean {
  const effect = targetingEffect(draft);
  if (!allowsPartialMove(effect)) return false;
  if (draft.cells.length < minDestCountForEffect(effect)) return false;
  if (draft.cells.length >= destCountForEffect(effect)) return false;
  if (isSequentialTwoUnitMove(effect)) {
    return draft.unitIds.length === draft.cells.length && draft.unitIds.length >= minUnitsNeededForMove(effect);
  }
  return draft.unitIds.length >= minUnitsNeededForMove(effect);
}

function drawnForViewer(prev: MatchState, next: MatchState, viewer: PlayerId): string[] {
  const prevIds = new Set(prev.players[viewer].hand.map((card) => card.instanceId));
  return next.players[viewer].hand
    .filter((card) => !prevIds.has(card.instanceId) && card.templateId !== "hidden")
    .map((card) => card.name);
}

export function MatchView({
  match,
  you,
  vsAi,
  waitingForCombatAck,
  peerConnected = true,
  actionError,
  onAction,
  onContinueAi,
  onClearError,
  onExit,
  onSurrender,
  onTutorialHud,
  /** `/m` only — pointer-drag cards. Desktop App must omit (HTML5 DnD unchanged). */
  pointerCardDrag = false,
}: {
  match: MatchState;
  you: PlayerId;
  vsAi: boolean;
  waitingForCombatAck: boolean;
  peerConnected?: boolean;
  actionError: string | null;
  onAction: (action: Action) => void;
  onContinueAi?: () => void;
  onClearError: () => void;
  onExit: () => void;
  onSurrender?: () => void;
  onTutorialHud?: (hud: TutorialHud) => void;
  pointerCardDrag?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<TargetDraft | null>(null);
  const [initiativeCard, setInitiativeCard] = useState<CardInstance | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [ownTrackerOpen, setOwnTrackerOpen] = useState(false);
  const [enemyTrackerOpen, setEnemyTrackerOpen] = useState(false);
  const [combatSpeed, setCombatSpeed] = useState<"detail" | "quick">(loadCombatSpeed);
  const [speedFlash, setSpeedFlash] = useState<"detail" | "quick" | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [pendingDeploy, setPendingDeploy] = useState<number | null>(null);
  const [desperateDiscards, setDesperateDiscards] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [fxQueue, setFxQueue] = useState<FxEvent[]>([]);
  const [fxStartBoard, setFxStartBoard] = useState<(UnitInstance | null)[][] | null>(null);
  const [dropKind, setDropKind] = useState<DragKind | null>(null);
  const [flight, setFlight] = useState<{ name: string; x: number; y: number } | null>(null);
  const [heldPlayback, setHeldPlayback] = useState(match.combatPlayback);
  const [inspect, setInspect] = useState<UnitDetailTarget | null>(null);

  const finishingCombat = useRef(false);
  const dragRef = useRef<DragPayload | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const enemyDeckRef = useRef<HTMLDivElement>(null);
  const ownTrackerPanelRef = useRef<HTMLDivElement>(null);
  const enemyTrackerPanelRef = useRef<HTMLDivElement>(null);
  const handDockRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const speedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMatchRef = useRef(match);
  const pendingFlight = useRef<{
    discardName?: string;
    discardNames?: string[];
    discardFrom: { x: number; y: number } | null;
  } | null>(null);

  const viewer = you;
  const player = match.players[viewer];
  const inCombat = Boolean(heldPlayback);
  const myTurn = match.currentPlayer === viewer && match.phase !== "gameover";
  const waitingOnOther = !myTurn && !inCombat && match.winner === null;
  const selectedIds = draft?.unitIds ?? [];
  const allies = unitsOf(match.board, viewer);
  const shownError = error ?? actionError;
  const locked = busy || waitingOnOther;
  const targetingSeq = Boolean(draft && isSequentialTwoUnitMove(targetingEffect(draft)));
  const seqStuck =
    targetingSeq && draft
      ? sequentialMoveStuck(match, targetingEffect(draft), draft.unitIds, draft.cells, viewer)
      : false;
  const committedMove = targetingSeq && !seqStuck;

  useEffect(() => {
    setHeldPlayback((prev) => {
      const next = heldPlaybackAfterState(prev, match.combatPlayback ?? null);
      if (next.resetAck) finishingCombat.current = false;
      return next.held;
    });
  }, [match.combatPlayback]);

  useEffect(() => {
    if (!heldPlayback) return;
    return onPageHidden(() => finishCombat());
  }, [heldPlayback]);

  useEffect(() => {
    if (actionError) setBusy(false);
  }, [actionError]);

  // Step the AI one action at a time after fx / combat settle so plays are visible.
  useEffect(() => {
    if (!vsAi || !onContinueAi) return;
    if (busy || heldPlayback || waitingForCombatAck) return;
    if (match.winner !== null) return;
    if (match.phase === "engagement") return;
    // AI is always seat 0 (goes first); human is seat 1.
    if (match.currentPlayer !== 0) return;
    const delay = match.fx.length > 0 ? 80 : 420;
    const timer = window.setTimeout(() => onContinueAi(), delay);
    return () => window.clearTimeout(timer);
  }, [vsAi, onContinueAi, busy, heldPlayback, waitingForCombatAck, match]);

  useEffect(() => {
    if (!ownTrackerOpen && !enemyTrackerOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ownTrackerOpen) {
        const inZone = deckRef.current?.contains(target);
        const inPanel = ownTrackerPanelRef.current?.contains(target);
        if (!inZone && !inPanel) setOwnTrackerOpen(false);
      }
      if (enemyTrackerOpen) {
        const inZone = enemyDeckRef.current?.contains(target);
        const inPanel = enemyTrackerPanelRef.current?.contains(target);
        if (!inZone && !inPanel) setEnemyTrackerOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ownTrackerOpen, enemyTrackerOpen]);

  useEffect(() => {
    return () => {
      if (speedFlashTimer.current) clearTimeout(speedFlashTimer.current);
    };
  }, []);

  useEffect(() => {
    const prev = prevMatchRef.current;
    if (prev === match) return;
    const flightInfo = pendingFlight.current;
    pendingFlight.current = null;
    const drawnNames = drawnForViewer(prev, match, viewer);
    const holdBusy = match.fx.length > 0 || Boolean(match.combatPlayback);
    prevMatchRef.current = match;
    if (flightInfo?.discardName || flightInfo?.discardNames?.length || drawnNames.length > 0) {
      playHandFlight({
        discardName: flightInfo?.discardName,
        discardNames: flightInfo?.discardNames,
        discardFrom: flightInfo?.discardFrom ?? null,
        drawnNames,
        holdBusy,
      });
    }
    if (match.combatPlayback) {
      setFxQueue([]);
      setFxStartBoard(null);
      setBusy(true);
    } else if (match.fx.length > 0) {
      setFxQueue(match.fx);
      setFxStartBoard(cloneBoard(prev.board));
      setBusy(true);
    } else {
      setBusy(false);
    }
  }, [match, viewer]);

  useEffect(() => {
    if (!pendingDeploy) {
      setDesperateDiscards([]);
      return;
    }
    if (match.phase !== "deployment" || !player.undeployed.includes(pendingDeploy)) {
      setPendingDeploy(null);
      setDesperateDiscards([]);
      return;
    }
    const need = discardsNeeded(getUnitDef(pendingDeploy).cost, player.commandPoints);
    if (need > 0 && player.deploysThisTurn > 0) {
      setPendingDeploy(null);
      setDesperateDiscards([]);
    }
  }, [match.phase, pendingDeploy, player.undeployed, player.commandPoints, player.deploysThisTurn]);

  useEffect(() => {
    onTutorialHud?.({
      reserveOpen,
      pendingDeploy,
      targetingTemplateId: draft?.card.templateId ?? (initiativeCard ? initiativeCard.templateId : null),
      targetingPickedUnits: draft?.unitIds.length ?? 0,
      initiativeOpen: Boolean(initiativeCard),
      animating: Boolean(heldPlayback) || busy,
    });
  }, [reserveOpen, pendingDeploy, draft, initiativeCard, heldPlayback, busy, onTutorialHud]);

  function waitMs(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  async function flyCard(name: string, from: { x: number; y: number } | null, to: { x: number; y: number } | null) {
    if (!from || !to) return;
    setFlight({ name, x: from.x, y: from.y });
    await waitMs(30);
    setFlight({ name, x: to.x, y: to.y });
    await waitMs(420);
    setFlight(null);
  }

  function playHandFlight(opts: {
    discardName?: string;
    discardNames?: string[];
    discardFrom: { x: number; y: number } | null;
    drawnNames: string[];
    holdBusy: boolean;
  }) {
    const discards = opts.discardName ? [opts.discardName] : (opts.discardNames ?? []);
    if (discards.length === 0 && opts.drawnNames.length === 0) return;
    void (async () => {
      if (!opts.holdBusy) setBusy(true);
      const deck = centerOf(deckRef.current);
      const hand = centerOf(handDockRef.current);
      for (const name of discards) await flyCard(name, opts.discardFrom ?? hand, deck);
      for (const name of opts.drawnNames) await flyCard(name, deck, hand);
      if (!opts.holdBusy) setBusy(false);
    })();
  }

  function clearPendingDeploy() {
    setPendingDeploy(null);
    setDesperateDiscards([]);
  }

  function act(action: Action) {
    if (locked) return;
    if (action.type === "discardRedraw") {
      pendingFlight.current = {
        discardFrom: centerOf(document.querySelector(`[data-card-id="${action.cardId}"]`)),
        discardName: player.hand.find((card) => card.instanceId === action.cardId)?.name,
      };
    }
    if (action.type === "deploy" && action.discardCardIds?.length) {
      pendingFlight.current = {
        discardFrom: centerOf(handDockRef.current),
        discardNames: action.discardCardIds
          .map((id) => player.hand.find((card) => card.instanceId === id)?.name)
          .filter((name): name is string => Boolean(name)),
      };
    }
    setError(null);
    setDraft(null);
    setInitiativeCard(null);
    clearPendingDeploy();
    setBusy(true);
    onAction(action);
  }

  function finishCombat() {
    if (finishingCombat.current) return;
    finishingCombat.current = true;
    onAction({ type: "endEngagement" });
  }

  function startDraft(card: CardInstance) {
    const next: TargetDraft = {
      card,
      kinds: card.targets,
      unitIds: [],
      cells: [],
      hq: false,
      prompt: promptFor(card.targets[0], 0),
    };
    if (dirsForEffect(targetingEffect(next))) next.prompt = destPrompt(match, next, viewer);
    setError(null);
    setDraft(next);
  }

  function updateDraft(next: TargetDraft) {
    if (draftReady(next)) {
      const targets: PlayTargets = {
        unitIds: next.unitIds,
        cells: next.cells,
        hq: next.hq,
        choice: next.choice,
      };
      act({ type: "playCard", cardId: next.card.instanceId, targets });
      return;
    }
    const prompt = dirsForEffect(targetingEffect(next))
      ? destPrompt(match, next, viewer)
      : promptFor(next.kinds[0], next.unitIds.length);
    setDraft({ ...next, prompt });
  }

  function onPlayCard(card: CardInstance) {
    if (committedMove) {
      setError("Finish moving both units");
      return;
    }
    if (match.phase !== "maneuver") {
      setError("Cards can only be played during Maneuver");
      return;
    }
    if (isInitiativeCard(card)) {
      setError(null);
      setDraft(null);
      setInitiativeCard(card);
      return;
    }
    if (card.targets.length === 0) {
      act({ type: "playCard", cardId: card.instanceId, targets: {} });
      return;
    }
    startDraft(card);
  }

  function pickInitiative(choice: InitiativeChoice) {
    if (!initiativeCard) return;
    const card = initiativeCard;
    setInitiativeCard(null);
    if (choice === "forward" || choice === "move") {
      setError(null);
      setDraft({
        card,
        kinds: ["friendly"],
        unitIds: [],
        cells: [],
        hq: false,
        prompt: "Click a friendly unit to move 1 space (any direction)",
        choice: "move",
      });
      return;
    }
    act({ type: "playCard", cardId: card.instanceId, targets: { choice } });
  }

  function onSelectUnit(unit: UnitInstance) {
    if (!draft) {
      setInspect({ mode: "board", unit, match });
      return;
    }
    const effect = targetingEffect(draft);
    const viaUnit = moveDestUnderUnit(match, effect, draft.unitIds, draft.cells, unit);
    if (viaUnit) {
      updateDraft({ ...draft, cells: [...draft.cells, viaUnit] });
      return;
    }
    const next: TargetDraft = { ...draft, unitIds: [...draft.unitIds], cells: [...draft.cells] };
    const kinds = draft.kinds;
    const moveUnits = unitsNeededForMove(effect);
    if (kinds.includes("lure")) {
      if (next.unitIds.length === 0 && unit.owner === viewer) next.unitIds.push(unit.instanceId);
      else if (next.unitIds.length === 1 && unit.owner !== viewer) {
        if (isUntargetableBy(match, unit, viewer)) {
          setError(`${unit.name} cannot be targeted`);
          return;
        }
        next.unitIds.push(unit.instanceId);
      } else return;
    } else if (moveUnits === 2) {
      if (awaitingMoveDest(effect, next.unitIds, next.cells)) return;
      if (unit.owner !== viewer || next.unitIds.includes(unit.instanceId) || next.unitIds.length >= 2) return;
      if (!canPickSequentialMoveUnit(match, effect, next.unitIds, next.cells, unit, viewer)) {
        setError(`${unit.name} cannot move`);
        return;
      }
      next.unitIds.push(unit.instanceId);
    } else if (kinds.includes("twoAdjacentAllies") || kinds.includes("twoAllies")) {
      if (unit.owner !== viewer || next.unitIds.includes(unit.instanceId) || next.unitIds.length >= 2) return;
      next.unitIds.push(unit.instanceId);
    } else if (kinds.includes("anyUnit")) {
      if (isUntargetableBy(match, unit, viewer)) {
        setError(`${unit.name} cannot be targeted`);
        return;
      }
      next.unitIds = [unit.instanceId];
    } else if (kinds.includes("enemy") || kinds.includes("anyEnemy") || kinds.includes("enemySupport")) {
      if (unit.owner === viewer) return;
      if (isUntargetableBy(match, unit, viewer)) {
        setError(`${unit.name} cannot be targeted`);
        return;
      }
      next.unitIds = [unit.instanceId];
    } else if (unit.owner === viewer) {
      if (moveUnits === 1 && next.cells.length > 0) return;
      next.unitIds = [unit.instanceId];
      next.cells = [];
    } else {
      return;
    }
    updateDraft(next);
  }

  function onSelectCell(col: number, row: number) {
    if (pendingDeploy && match.phase === "deployment" && !locked) {
      const need = discardsNeeded(getUnitDef(pendingDeploy).cost, player.commandPoints);
      if (desperateDiscards.length !== need) {
        setError(
          need > 0
            ? `Desperate Measure: pick ${need} card${need === 1 ? "" : "s"} to discard (${desperateDiscards.length}/${need})`
            : "Finish selecting discards first",
        );
        return;
      }
      if (col !== supportCol(viewer)) {
        setError("Click an empty Support cell to summon");
        return;
      }
      act({
        type: "deploy",
        unitDefId: pendingDeploy,
        row,
        discardCardIds: need > 0 ? desperateDiscards : undefined,
      });
      return;
    }
    if (draft && awaitingMoveDest(targetingEffect(draft), draft.unitIds, draft.cells)) {
      const dests = moveHighlights(match, draft);
      if (!dests.some((pos) => samePos(pos, { col, row }))) {
        setError("That cell is not a legal destination");
        return;
      }
      updateDraft({ ...draft, cells: [...draft.cells, { col, row }] });
    }
  }

  function clearDrag() {
    dragRef.current = null;
    setDropKind(null);
  }

  function takePayload(event?: DragEvent) {
    return dragRef.current ?? (event ? readDrag(event) : null);
  }

  function onDropBoard(event: DragEvent) {
    const payload = takePayload(event);
    clearDrag();
    if (!payload || payload.kind !== "card") return;
    const card = player.hand.find((item) => item.instanceId === payload.id);
    if (!card) return;
    onPlayCard(card);
  }

  function onDropCell(col: number, row: number, event: DragEvent) {
    const payload = takePayload(event);
    if (payload?.kind === "card") {
      const card = player.hand.find((item) => item.instanceId === payload.id);
      clearDrag();
      if (card) onPlayCard(card);
      return;
    }
    clearDrag();
    onSelectCell(col, row);
  }

  function discardCardById(cardId: string) {
    if (match.phase !== "maneuver") {
      setError("Discard only during Maneuver");
      return;
    }
    if (player.discardRedrawsUsed >= DISCARD_REDRAW_LIMIT || player.deck.length === 0) {
      setError(
        player.discardRedrawsUsed >= DISCARD_REDRAW_LIMIT ? "Already discarded twice this turn" : "Deck is empty",
      );
      return;
    }
    act({ type: "discardRedraw", cardId });
  }

  function onDropDeck(event: DragEvent) {
    const payload = takePayload(event);
    clearDrag();
    if (!payload || payload.kind !== "card") return;
    discardCardById(payload.id);
  }

  function onPointerCardDrop(card: CardInstance, clientX: number, clientY: number) {
    const zone = resolvePointerDropZone(clientX, clientY, deckRef.current as import("../mobile/pointerCardDrag").HitNode | null);
    clearDrag();
    if (zone.kind === "deck") {
      discardCardById(card.instanceId);
      return;
    }
    if (zone.kind === "cell" || zone.kind === "board") {
      onPlayCard(card);
    }
  }

  function onSelectHq(playerId: PlayerId) {
    if (!draft) return;
    const kinds = draft.kinds;
    if (!(kinds.includes("selfOrHq") || kinds.includes("allyOrHq") || kinds.includes("hqOrAlly"))) return;
    if (playerId !== viewer) {
      setError("You can only target your own HQ");
      return;
    }
    updateDraft({ ...draft, hq: true });
  }

  const reachableCells = draft ? moveHighlights(match, draft) : [];
  const hostileIds = hostileAimIds(match, draft, viewer);
  const canDiscard =
    myTurn &&
    player.discardRedrawsUsed < DISCARD_REDRAW_LIMIT &&
    player.deck.length > 0 &&
    match.phase === "maneuver";
  const showDiscardDrop = dropKind === "card" && canDiscard;
  const pendingDef = pendingDeploy ? getUnitDef(pendingDeploy) : null;
  const visibleReserve = player.undeployed.filter((id) => id !== 0);
  const visibleHand = player.hand.filter((card) => card.templateId !== "hidden");
  const desperateNeed = pendingDef ? discardsNeeded(pendingDef.cost, player.commandPoints) : 0;
  const desperateReady = Boolean(pendingDeploy) && desperateDiscards.length === desperateNeed;
  const pickingDesperate = Boolean(pendingDeploy) && desperateNeed > 0 && !desperateReady;
  const showDesperateHint =
    myTurn &&
    match.phase === "deployment" &&
    !locked &&
    needsDesperateMeasure(
      visibleReserve.map((id) => getUnitDef(id).cost),
      player.commandPoints,
      visibleHand.length,
      player.deploysThisTurn,
      unitsOf(match.board, player.id).length,
      unitsOf(match.board, player.id === 0 ? 1 : 0).length,
    );
  const waitingText = waitingForCombatAck
    ? "Waiting for opponent to finish combat…"
    : !peerConnected && !vsAi
      ? "Opponent is offline — they can rejoin."
    : waitingOnOther
      ? vsAi && match.currentPlayer === 0
        ? "AI is playing…"
        : `P${match.currentPlayer + 1} is playing…`
      : null;
  const dialogText = draft
    ? `${draft.card.name} · ${draft.prompt}`
    : shownError
      ? shownError
      : pickingDesperate && pendingDef
        ? `Desperate Measure · pick ${desperateNeed} card${desperateNeed === 1 ? "" : "s"} to discard for ${pendingDef.name} (${desperateDiscards.length}/${desperateNeed})`
        : pendingDef && desperateReady
          ? desperateNeed > 0
            ? `Click an empty Support cell to summon ${pendingDef.name} (−${desperateNeed / 2} cost from discards)`
            : `Click an empty Support cell to summon ${pendingDef.name}`
          : waitingText
            ? waitingText
            : match.winner !== null
              ? match.winReason === "surrender"
                ? `P${match.winner + 1} wins — opponent surrendered.`
                : match.winReason === "elimination"
                  ? `P${match.winner + 1} wins — opponent has no forces left.`
                  : `P${match.winner + 1} wins — enemy HQ destroyed.`
              : null;
  const dialogTone =
    draft || pendingDef ? "play" : shownError ? "error" : match.winner !== null ? "win" : "info";
  const canSurrender = Boolean(onSurrender) && match.winner === null;
  const surrenderBtn = canSurrender ? (
    <button
      type="button"
      className="surrender-flag"
      disabled={Boolean(heldPlayback) || waitingForCombatAck}
      title="Surrender"
      onClick={() => {
        if (window.confirm("Surrender this match?")) onSurrender?.();
      }}
    >
      <WhiteFlagIcon />
    </button>
  ) : null;

  return (
    <div className="match">
      <SgIconBtn
        name="close"
        tone="gold"
        className="round-btn exit-btn sg-exit"
        title="Leave match (can rejoin)"
        onClick={onExit}
        size={44}
      />

      <div className="hq-strip">
        <div className="hq-side">
          {viewer === 0 ? surrenderBtn : null}
          <span>
            HQ P1 <b>{match.players[0].hqHp}</b>
          </span>
        </div>
        <div className="phase-track" data-tut="phase">
          <em>Turn {match.turn}</em>
          {TURN_PHASES.map((phase) => (
            <span key={phase} className={match.phase === phase ? "on" : ""}>
              {PHASE_LABEL[phase]}
            </span>
          ))}
        </div>
        <div className="hq-side hq-side-end">
          <span>
            HQ P2 <b>{match.players[1].hqHp}</b>
          </span>
          {viewer === 1 ? surrenderBtn : null}
        </div>
      </div>

      <div className="match-stage" ref={stageRef}>
        {dialogText && (
          <div
            className={`play-dialog ${dialogTone}`}
            onClick={() => {
              if (shownError && !draft) {
                setError(null);
                onClearError();
              }
            }}
          >
            {dialogText}
          </div>
        )}
        <BoardView
          match={match}
          selectedIds={selectedIds}
          hostileAimIds={hostileIds}
          deployPlayer={match.phase === "deployment" && myTurn ? viewer : null}
          deployEnabled={match.phase === "deployment" && desperateReady && !locked}
          reachableCells={reachableCells}
          dropKind={dropKind}
          fxQueue={fxQueue}
          fxStartBoard={fxStartBoard}
          onFxDone={() => {
            setBusy(false);
            setFxQueue([]);
            setFxStartBoard(null);
          }}
          combatPlayback={heldPlayback}
          combatSpeed={combatSpeed}
          onCombatDone={finishCombat}
          onSelectUnit={onSelectUnit}
          onSelectCell={onSelectCell}
          onSelectHq={onSelectHq}
          onDropBoard={onDropBoard}
          onDropCell={onDropCell}
        />
      </div>

      {logOpen && (
        <aside className="log-float near-deck">
          <LogView entries={match.log} />
        </aside>
      )}

      {((draft && !committedMove) || pendingDeploy || initiativeCard) && (
        <button
          type="button"
          className="round-btn float-cancel sg-float"
          onClick={() => {
            setDraft(null);
            clearPendingDeploy();
            setInitiativeCard(null);
          }}
          title="Cancel"
        >
          <img src={sgButton("close", "cyan")} alt="" width={40} height={40} draggable={false} />
          Cancel
        </button>
      )}

      {draft && canConfirmPartial(draft) && (
        <button
          type="button"
          className="round-btn float-confirm sg-float"
          onClick={() => {
            act({
              type: "playCard",
              cardId: draft.card.instanceId,
              targets: {
                unitIds: draft.unitIds,
                cells: draft.cells,
                hq: draft.hq,
                choice: draft.choice,
              },
            });
          }}
          title="Finish move early"
        >
          <img src={sgButton("check", "gold")} alt="" width={40} height={40} draggable={false} />
          Done
        </button>
      )}

      <div className="hud">
        <div
          className="cp-orb"
          title="Supply"
          data-tut="supply"
        >
          <SupplyIcon size={24} />
          <b>{player.commandPoints}</b>
          {player.nextTurnSupplyBonus > 0 || player.nextTurnDrawBonus > 0 ? (
            <em className="cp-penalty" title="Comeback next turn">
              +{player.nextTurnSupplyBonus}S / +{player.nextTurnDrawBonus}D
            </em>
          ) : null}
        </div>
        {pendingDef && (
          <button
            type="button"
            className="reserve-float"
            title={
              pickingDesperate
                ? `${pendingDef.name} — pick ${desperateNeed} cards to discard · click here to cancel`
                : `${pendingDef.name} — click an empty Support cell to summon · click here to cancel`
            }
            onClick={clearPendingDeploy}
          >
            <UnitPortrait
              name={pendingDef.name}
              unitClass={pendingDef.class}
              unitId={pendingDef.id}
              facingDeg={boardFacingDeg(player.id)}
              compact
              cost={Math.max(0, pendingDef.cost - Math.floor(desperateDiscards.length / 2))}
              hp={pendingDef.hp}
              armor={pendingDef.armor}
              atk={pendingDef.atk}
              ap={pendingDef.ap}
            />
          </button>
        )}
        <button
          type="button"
          className={`reserve-orb ${pendingDef ? "pending" : ""} ${showDesperateHint ? "desperate" : ""}`}
          title={showDesperateHint ? "Desperate Measure — discard 2 cards to reduce summon cost by 1" : "Reserved units"}
          data-tut="reserve"
          onClick={() => setReserveOpen(true)}
        >
          {showDesperateHint && <em className="desperate-badge">Desperate Measure</em>}
          <span>Reserved units</span>
          <b>{visibleReserve.length}</b>
        </button>
        <div className="hand-slot" ref={handDockRef} data-tut="hand">
          {pointerCardDrag ? (
            <MobileHandView
              cards={visibleHand}
              selectedId={draft?.card.instanceId ?? initiativeCard?.instanceId}
              selectedIds={pendingDeploy && desperateNeed > 0 ? desperateDiscards : undefined}
              disabled={
                locked ||
                committedMove ||
                (match.phase !== "maneuver" && !(pendingDeploy && desperateNeed > 0))
              }
              pickMode={Boolean(pendingDeploy) && desperateNeed > 0}
              boardUnitDefIds={new Set(allies.map((u) => u.defId))}
              facing={viewer}
              onDragStart={(card) => {
                dragRef.current = { kind: "card", id: card.instanceId };
                setDropKind("card");
              }}
              onDragEnd={clearDrag}
              onPointerDrop={onPointerCardDrop}
              onPickCard={(card) => {
                if (!pendingDeploy || desperateNeed <= 0) return;
                setDesperateDiscards((prev) => {
                  if (prev.includes(card.instanceId)) return prev.filter((id) => id !== card.instanceId);
                  if (prev.length >= desperateNeed) return prev;
                  return [...prev, card.instanceId];
                });
              }}
            />
          ) : (
            <HandView
              cards={visibleHand}
              selectedId={draft?.card.instanceId ?? initiativeCard?.instanceId}
              selectedIds={pendingDeploy && desperateNeed > 0 ? desperateDiscards : undefined}
              disabled={
                locked ||
                committedMove ||
                (match.phase !== "maneuver" && !(pendingDeploy && desperateNeed > 0))
              }
              pickMode={Boolean(pendingDeploy) && desperateNeed > 0}
              boardUnitDefIds={new Set(allies.map((u) => u.defId))}
              facing={viewer}
              onDragStart={(card) => {
                dragRef.current = { kind: "card", id: card.instanceId };
                setDropKind("card");
              }}
              onDragEnd={clearDrag}
              onPickCard={(card) => {
                if (!pendingDeploy || desperateNeed <= 0) return;
                setDesperateDiscards((prev) => {
                  if (prev.includes(card.instanceId)) return prev.filter((id) => id !== card.instanceId);
                  if (prev.length >= desperateNeed) return prev;
                  return [...prev, card.instanceId];
                });
              }}
            />
          )}
        </div>
        <div className="deck-cluster">
          <div className="deck-actions">
            <div className="phase-advance">
              <div className="speed-slot">
                <button
                  type="button"
                  className={`round-btn icon-btn speed ${combatSpeed}`}
                  aria-label={combatSpeed === "quick" ? "Quick engagement" : "Detail engagement"}
                  title={
                    combatSpeed === "quick"
                      ? "Quick engagement — units move and fire together"
                      : "Detail engagement — phase by phase"
                  }
                  onClick={() => {
                    setCombatSpeed((prev) => {
                      const next = prev === "quick" ? "detail" : "quick";
                      try {
                        localStorage.setItem(COMBAT_SPEED_KEY, next);
                      } catch {
                        /* ignore quota / private mode */
                      }
                      if (speedFlashTimer.current) clearTimeout(speedFlashTimer.current);
                      setSpeedFlash(next);
                      speedFlashTimer.current = setTimeout(() => setSpeedFlash(null), 900);
                      return next;
                    });
                  }}
                />
                {speedFlash && (
                  <em className="speed-flash" aria-live="polite">
                    {speedFlash === "quick" ? "Speed x2" : "Speed"}
                  </em>
                )}
              </div>
              <div className="phase-pass">
                <span className="phase-advance-label">{phaseAdvanceLabel(match)}</span>
                <button
                  type="button"
                  className="round-btn icon-btn hourglass"
                  data-tut="hourglass"
                  disabled={locked || committedMove || (match.phase !== "deployment" && match.phase !== "maneuver")}
                  title={`Go to ${PHASE_LABEL[nextPhaseOf(match)]}`}
                  onClick={() => act({ type: match.phase === "deployment" ? "endDeployment" : "endManeuver" })}
                >
                  <span>{PHASE_LABEL[nextPhaseOf(match)]}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="decks-stack">
            <div className="enemy-deck-row">
              <button
                type="button"
                className={`round-btn icon-btn log ${logOpen ? "on" : ""}`}
                aria-label={logOpen ? "Hide log" : "Show log"}
                title={logOpen ? "Hide log" : "Log"}
                onClick={() => setLogOpen((v) => !v)}
              />
              <div
                className={`enemy-deck-zone ${enemyTrackerOpen ? "open" : ""}`}
                ref={enemyDeckRef}
              >
                <button
                  type="button"
                  className="deck-pile enemy tip-host"
                  aria-expanded={enemyTrackerOpen}
                  aria-label="Enemy deck tracker"
                  data-tip="Click to open tracker"
                  data-tut="enemy-deck"
                  onClick={() => {
                    setEnemyTrackerOpen((v) => !v);
                    setOwnTrackerOpen(false);
                  }}
                >
                  <b>{match.players[viewer === 0 ? 1 : 0].deck.length}</b>
                  <span>Enemy</span>
                </button>
                {enemyTrackerOpen && (
                  <AnchoredPanel
                    open={enemyTrackerOpen}
                    anchorRef={enemyDeckRef}
                    panelRef={enemyTrackerPanelRef}
                    prefer="above"
                    maxWidth={260}
                  >
                    <EnemyDeckTracker player={match.players[viewer === 0 ? 1 : 0]} />
                  </AnchoredPanel>
                )}
              </div>
            </div>
            <div
              className={`deck-zone ${ownTrackerOpen ? "open" : ""} ${showDiscardDrop ? "drop-ready" : ""}`}
              ref={deckRef}
              data-tut="deck"
              title={
                canDiscard
                  ? `Drop a card here to discard and draw (${DISCARD_REDRAW_LIMIT - player.discardRedrawsUsed} left)`
                  : undefined
              }
              onDragOver={(event) => {
                if (showDiscardDrop) allowDrop(event);
              }}
              onDrop={(event) => {
                event.preventDefault();
                onDropDeck(event);
              }}
            >
              {showDiscardDrop && (
                <div className="deck-recycle">
                  <RecycleIcon size={32} />
                  <span>discard to draw other card</span>
                </div>
              )}
              <button
                type="button"
                className="deck-pile tip-host"
                aria-expanded={ownTrackerOpen}
                aria-label="Your deck tracker"
                data-tip="Click to open tracker"
                onClick={() => {
                  if (showDiscardDrop) return;
                  setOwnTrackerOpen((v) => !v);
                  setEnemyTrackerOpen(false);
                }}
              >
                <b>{player.deck.length}</b>
                <span>Deck</span>
              </button>
              {ownTrackerOpen && (
                <AnchoredPanel
                  open={ownTrackerOpen}
                  anchorRef={deckRef}
                  panelRef={ownTrackerPanelRef}
                  prefer="above"
                  maxWidth={320}
                >
                  <OwnDeckTracker player={player} />
                </AnchoredPanel>
              )}
            </div>
          </div>
        </div>
      </div>

      {inspect && <UnitDetailDialog target={inspect} onClose={() => setInspect(null)} facing={viewer} />}

      {initiativeCard && (
        <div className="choice-modal" onClick={() => setInitiativeCard(null)}>
          <div
            className="choice-dialog"
            role="dialog"
            aria-label={INITIATIVE_CARD_NAME}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>{INITIATIVE_CARD_NAME}</h2>
            <p>Second player — choose one:</p>
            <div className="choice-options">
              <button type="button" className="primary" onClick={() => pickInitiative("move")} data-tut="initiative-forward">
                Move 1 unit (any direction)
              </button>
              <button type="button" className="primary" onClick={() => pickInitiative("supply")} data-tut="initiative-supply">
                Gain 1 Supply
              </button>
              <button type="button" className="primary" onClick={() => pickInitiative("nextSupply")} data-tut="initiative-next-supply">
                +1 Supply next Deployment
              </button>
            </div>
            <SgIconBtn name="close" tone="cyan" title="Cancel" onClick={() => setInitiativeCard(null)} size={40} />
          </div>
        </div>
      )}

      {reserveOpen && (
        <div className="reserve-modal" onClick={() => setReserveOpen(false)}>
          <div
            className="reserve-dialog"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="Reserved units"
          >
            <header>
              <h2>Reserved units</h2>
              <p>
                {match.phase === "deployment" && myTurn
                  ? showDesperateHint
                    ? "No unit is affordable with Supply — discard 2 cards = −1 cost for your first summon, then click Support."
                    : "Click a unit you can afford with Supply, then click an empty Support cell."
                  : "View only — summon during Deployment."}
              </p>
              <SgIconBtn name="close" tone="gold" title="Close" onClick={() => setReserveOpen(false)} size={40} />
            </header>
            <div className="reserve-row">
              {visibleReserve.map((id) => {
                const def = getUnitDef(id);
                const handCount = visibleHand.length;
                const need = discardsNeeded(def.cost, player.commandPoints);
                const affordableWithSupply = def.cost <= player.commandPoints;
                const canSummon =
                  match.phase === "deployment" &&
                  myTurn &&
                  !locked &&
                  (affordableWithSupply ||
                    (showDesperateHint &&
                      canAffordDeploy(def.cost, player.commandPoints, handCount)));
                return (
                  <button
                    key={id}
                    type="button"
                    className={`reserve-chip ${pendingDeploy === id ? "on" : ""} ${canSummon ? "" : "no-pick"}`}
                    data-tut={`reserve-unit-${id}`}
                    title={
                      canSummon
                        ? need > 0
                          ? `Desperate Measure: discard ${need} cards (−${need / 2} cost)`
                          : "Click to select, then click Support"
                        : need > 0 && !showDesperateHint
                          ? player.deploysThisTurn > 0
                            ? "Desperate Measure only for the first summon of the turn"
                            : unitsOf(match.board, player.id === 0 ? 1 : 0).length <=
                                unitsOf(match.board, player.id).length
                              ? "Desperate Measure only when the opponent has more units on the board"
                              : "Summon a cheaper unit with Supply first — Desperate Measure only when none are affordable"
                          : need > 0
                            ? `Need ${need} cards in hand to cover cost`
                            : undefined
                    }
                    onClick={() => {
                      if (!canSummon) return;
                      setPendingDeploy(id);
                      setDesperateDiscards([]);
                      setReserveOpen(false);
                    }}
                  >
                    <UnitPortrait
                      name={def.name}
                      unitClass={def.class}
                      unitId={def.id}
                      facingDeg={boardFacingDeg(player.id)}
                      compact
                      cost={def.cost}
                      hp={def.hp}
                      armor={def.armor}
                      atk={def.atk}
                      ap={def.ap}
                    />
                    <span>
                      <strong>{def.name}</strong>
                      {need > 0 && canSummon ? (
                        <em className="desperate-chip-note">Discard {need} (−{need / 2})</em>
                      ) : null}
                      <UnitKeywords keywords={def.keywords} unitId={def.id} />
                      <UnitCardPills cards={def.cards} facing={viewer} sourceName={def.name} />
                    </span>
                  </button>
                );
              })}
              {visibleReserve.length === 0 && <p className="muted">No reserved units.</p>}
            </div>
          </div>
        </div>
      )}

      {flight && (
        <div className="card-flight" style={{ left: flight.x, top: flight.y }}>
          {flight.name}
        </div>
      )}
    </div>
  );
}
