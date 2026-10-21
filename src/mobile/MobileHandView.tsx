import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getUnitDef } from "../data/units";
import { isInitiativeCard } from "../data/initiative";
import type { CardInstance, PlayerId } from "../engine/types";
import { CardDetail, CardSourceBadge } from "../ui/CardTip";
import { CardArtIcon } from "../ui/icons";
import { fanStepDeg } from "../ui/HandView";
import { POINTER_DRAG_SLOP_PX } from "./pointerCardDrag";

type Props = {
  cards: CardInstance[];
  selectedId?: string;
  selectedIds?: string[];
  disabled?: boolean;
  pickMode?: boolean;
  /** Current Supply while cards can be played. Omit outside Maneuver. */
  supply?: number;
  /** Unaffordable cards can still be dragged onto the deck. */
  allowDiscard?: boolean;
  boardUnitDefIds: Set<number>;
  facing?: PlayerId;
  onDragStart: (card: CardInstance) => void;
  onDragEnd: () => void;
  onPickCard?: (card: CardInstance) => void;
  /** Tap did not play the card (tutorial explains why). */
  onBlockedClick?: (card: CardInstance) => void;
  /** Called after a drag that moved past slop; ghost already removed. */
  onPointerDrop: (card: CardInstance, clientX: number, clientY: number) => void;
};

type LiveDrag = {
  card: CardInstance;
  pointerId: number;
  ghost: HTMLDivElement;
  startX: number;
  startY: number;
  moved: boolean;
};

/**
 * Mobile hand: pointer-drag cards (HTML5 DnD does not work on iOS/Android).
 * Desktop keeps `ui/HandView` + HTML5 drag unchanged.
 */
export function MobileHandView({
  cards,
  selectedId,
  selectedIds,
  disabled,
  pickMode,
  supply,
  allowDiscard = false,
  boardUnitDefIds,
  facing = 0,
  onDragStart,
  onDragEnd,
  onPickCard,
  onBlockedClick,
  onPointerDrop,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const dragRef = useRef<LiveDrag | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inspectOnly = Boolean(disabled) && !pickMode;

  useEffect(() => {
    if (!inspectOnly) setHoverId(null);
  }, [inspectOnly]);

  useEffect(() => {
    if (!hoverId || !inspectOnly) return;
    function onDocPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      const target = event.target;
      if (!(target instanceof Node) || !root?.contains(target)) setHoverId(null);
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [hoverId, inspectOnly]);
  const hoverCard = cards.find((card) => card.instanceId === hoverId) ?? null;
  const hoverSource =
    hoverCard?.type === "special" && hoverCard.ownerUnitId
      ? getUnitDef(hoverCard.ownerUnitId)
      : null;
  const hoverNeedsSource = Boolean(hoverCard?.requiresSourceOnField);
  const multiSelected = new Set(selectedIds ?? []);

  function endDrag(clientX: number, clientY: number) {
    const live = dragRef.current;
    if (!live) return;
    dragRef.current = null;
    live.ghost.remove();
    const { card, moved } = live;
    if (moved) onPointerDrop(card, clientX, clientY);
    onDragEnd();
  }

  function onCardPointerDown(event: ReactPointerEvent<HTMLElement>, card: CardInstance, canDrag: boolean) {
    if (pickMode) return;
    if (!canDrag || event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const ghost = document.createElement("div");
    ghost.className = "mobile-card-ghost";
    ghost.textContent = card.name;
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
    document.body.appendChild(ghost);

    dragRef.current = {
      card,
      pointerId: event.pointerId,
      ghost,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    setHoverId(card.instanceId);
    onDragStart(card);
  }

  function onCardPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const live = dragRef.current;
    if (!live || live.pointerId !== event.pointerId) return;
    const dist = Math.hypot(event.clientX - live.startX, event.clientY - live.startY);
    if (dist >= POINTER_DRAG_SLOP_PX) live.moved = true;
    live.ghost.style.left = `${event.clientX}px`;
    live.ghost.style.top = `${event.clientY}px`;
  }

  function onCardPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const live = dragRef.current;
    if (!live || live.pointerId !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    endDrag(event.clientX, event.clientY);
    setHoverId(null);
  }

  return (
    <div
      ref={rootRef}
      className={`hand fan ${expanded ? "expanded" : ""} ${pickMode ? "pick-mode" : ""} ${inspectOnly ? "inspect-only" : ""} mobile-hand`}
      onPointerDown={() => setExpanded(true)}
    >
      {hoverCard && (
        <div className="hand-tip">
          <CardDetail
            name={hoverCard.name}
            type={hoverCard.type}
            cost={hoverCard.cost}
            text={hoverCard.text}
            effectId={hoverCard.effectId}
            facing={facing}
            sourceName={hoverSource?.name}
            requiresSource={hoverNeedsSource}
            sourceReady={
              hoverSource ? !hoverNeedsSource || boardUnitDefIds.has(hoverSource.id) : undefined
            }
          />
        </div>
      )}
      {cards.length === 0 && <p className="muted hand-empty">No cards in hand.</p>}
      {cards.map((card, index) => {
        const mid = (cards.length - 1) / 2;
        const step = fanStepDeg(cards.length, expanded);
        const rot = (index - mid) * step;
        const lifted = hoverId === card.instanceId;
        const source =
          card.type === "special" && card.ownerUnitId ? getUnitDef(card.ownerUnitId) : null;
        const needsSource = Boolean(card.requiresSourceOnField);
        const sourceReady = !source || !needsSource || boardUnitDefIds.has(source.id);
        const playCost = card.cost;
        const sourceMissing = Boolean(needsSource && source && !sourceReady && !pickMode && supply != null);
        const unaffordable = supply != null && !pickMode && playCost > supply;
        const isSelected =
          selectedId === card.instanceId || multiSelected.has(card.instanceId);
        const canPlay = !disabled && !pickMode && !unaffordable && !sourceMissing;
        const canDrag = canPlay || ((unaffordable || sourceMissing) && allowDiscard && !disabled);
        return (
          <div
            key={card.instanceId}
            className={`fan-pivot ${lifted ? "lifted" : ""}`}
            style={{
              transform: `rotate(${rot}deg)`,
              zIndex: lifted ? 40 : 10 + index,
            }}
          >
            <article
              data-card-id={card.instanceId}
              data-tut={`card-${card.templateId}`}
              draggable={false}
              className={`card ${card.type} ${isInitiativeCard(card) ? "initiative" : ""} ${isSelected ? "selected" : ""} ${
                unaffordable || sourceMissing ? "unaffordable" : ""
              } ${needsSource && source && !sourceReady ? "source-missing" : ""} ${
                !canDrag ? "no-drag" : ""
              } ${pickMode ? "pickable" : ""} ${lifted ? "lifted" : ""} ${
                canDrag ? "mobile-card-draggable" : ""
              }`}
              title={
                pickMode
                  ? "Tap to discard for Desperate Measure"
                  : sourceMissing
                    ? allowDiscard
                      ? `${source?.name ?? "That unit"} must be on the board · drag onto the deck to discard and draw`
                      : `${source?.name ?? "That unit"} must be on the board`
                    : unaffordable
                      ? allowDiscard
                        ? `Need ${playCost} Supply (have ${supply}) · drag onto the deck to discard and draw`
                        : `Need ${playCost} Supply (have ${supply})`
                      : inspectOnly
                      ? "Tap to view"
                      : "Drag onto the board to play · onto the deck to discard and draw"
              }
              onClick={() => {
                if (pickMode && onPickCard) {
                  onPickCard(card);
                  return;
                }
                if (onBlockedClick) {
                  onBlockedClick(card);
                  return;
                }
                if (!inspectOnly) return;
                setHoverId((id) => (id === card.instanceId ? null : card.instanceId));
              }}
              onPointerDown={(event) => onCardPointerDown(event, card, canDrag)}
              onPointerMove={onCardPointerMove}
              onPointerUp={onCardPointerUp}
              onPointerCancel={onCardPointerUp}
            >
              <h4>{card.name}</h4>
              {card.type === "special" && source && (
                <CardSourceBadge
                  sourceName={source.name}
                  requiresSource={needsSource}
                  sourceReady={sourceReady}
                  compact
                />
              )}
              <div className={`card-art card-art-${card.type}`} aria-hidden>
                <CardArtIcon
                  effectId={card.effectId}
                  type={card.type}
                  size={72}
                  title={card.name}
                  facing={facing}
                />
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
