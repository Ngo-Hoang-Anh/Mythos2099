import { useState } from "react";
import { getUnitDef } from "../data/units";
import { isInitiativeCard } from "../data/initiative";
import type { CardInstance, PlayerId } from "../engine/types";
import { CardDetail, CardSourceBadge } from "./CardTip";
import { writeDrag } from "./dnd";
import { CardArtIcon } from "./icons";

const FAN_OPEN = 4;
const FAN_REST = 3.5;
const FAN_SOFTEN_AFTER = 6;

/** Degrees between neighboring cards. Past 6, keep the same total arc so hover does not overflow. */
export function fanStepDeg(count: number, expanded: boolean): number {
  const base = expanded ? FAN_OPEN : FAN_REST;
  if (count <= 1) return 0;
  if (count <= FAN_SOFTEN_AFTER) return base;
  return (base * (FAN_SOFTEN_AFTER - 1)) / (count - 1);
}

export function HandView({
  cards,
  selectedId,
  selectedIds,
  disabled,
  pickMode,
  boardUnitDefIds,
  facing = 0,
  onDragStart,
  onDragEnd,
  onPickCard,
}: {
  cards: CardInstance[];
  selectedId?: string;
  selectedIds?: string[];
  disabled?: boolean;
  /** Click-to-select for Desperate Measure (no drag). */
  pickMode?: boolean;
  boardUnitDefIds: Set<number>;
  /** Seat of the hand owner — flips forward/retreat art for P2. */
  facing?: PlayerId;
  onDragStart: (card: CardInstance) => void;
  onDragEnd: () => void;
  onPickCard?: (card: CardInstance) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hoverCard = cards.find((card) => card.instanceId === hoverId) ?? null;
  const hoverSource =
    hoverCard?.type === "special" && hoverCard.ownerUnitId
      ? getUnitDef(hoverCard.ownerUnitId)
      : null;
  const hoverNeedsSource = Boolean(hoverCard?.requiresSourceOnField);
  const multiSelected = new Set(selectedIds ?? []);

  return (
    <div
      className={`hand fan ${expanded ? "expanded" : ""} ${pickMode ? "pick-mode" : ""}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => {
        setExpanded(false);
        setHoverId(null);
      }}>
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
              hoverSource
                ? !hoverNeedsSource || boardUnitDefIds.has(hoverSource.id)
                : undefined
            }
          />
        </div>
      )}
      {cards.length === 0 && (
        <p className="muted hand-empty">No cards in hand.</p>
      )}
      {cards.map((card, index) => {
        const mid = (cards.length - 1) / 2;
        const step = fanStepDeg(cards.length, expanded);
        const rot = (index - mid) * step;
        const lifted = hoverId === card.instanceId;
        const source =
          card.type === "special" && card.ownerUnitId
            ? getUnitDef(card.ownerUnitId)
            : null;
        const needsSource = Boolean(card.requiresSourceOnField);
        const sourceReady =
          !source || !needsSource || boardUnitDefIds.has(source.id);
        const isSelected =
          selectedId === card.instanceId || multiSelected.has(card.instanceId);
        const canDrag = !disabled && !pickMode;
        return (
          <div
            key={card.instanceId}
            className={`fan-pivot ${lifted ? "lifted" : ""}`}
            style={{
              transform: `rotate(${rot}deg)`,
              zIndex: lifted ? 40 : 10 + index,
            }}>
            <article
              data-card-id={card.instanceId}
              data-tut={`card-${card.templateId}`}
              draggable={canDrag}
              className={`card ${card.type} ${isInitiativeCard(card) ? "initiative" : ""} ${isSelected ? "selected" : ""} ${
                needsSource && source && !sourceReady ? "source-missing" : ""
              } ${disabled && !pickMode ? "no-drag" : ""} ${pickMode ? "pickable" : ""} ${lifted ? "lifted" : ""}`}
              title={
                pickMode
                  ? "Click to discard for Desperate Measure"
                  : disabled
                    ? undefined
                    : "Drag onto the board to play · onto the deck to discard and draw"
              }
              onMouseEnter={() => setHoverId(card.instanceId)}
              onClick={() => {
                if (pickMode && onPickCard) onPickCard(card);
              }}
              onDragStart={(event) => {
                if (!canDrag) {
                  event.preventDefault();
                  return;
                }
                writeDrag(event, { kind: "card", id: card.instanceId });
                onDragStart(card);
              }}
              onDragEnd={onDragEnd}>
              <h4>{card.name}</h4>
              {card.type === "special" && source && (
                <CardSourceBadge
                  sourceName={source.name}
                  requiresSource={needsSource}
                  sourceReady={sourceReady}
                  compact
                />
              )}
              <div
                className={`card-art card-art-${card.type}`}
                aria-hidden>
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
