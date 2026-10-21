import { useLayoutEffect, useState } from "react";
import { getUnitDef } from "../data/units";
import type { CardInstance, PlayerId } from "../engine/types";
import { CardSourceBadge } from "./CardTip";
import { CardArtIcon, SupplyChip } from "./icons";

export const OPPONENT_CARD_FLY_MS = 560;
export const OPPONENT_CARD_PAUSE_MS = 1000;

const TYPE_LABEL = { special: "Special", maneuver: "Maneuver", move: "Move" } as const;

export function opponentSidePoint(actor: PlayerId, stage: HTMLElement | null): { x: number; y: number } {
  const rect = stage?.getBoundingClientRect();
  const y = rect ? rect.top + rect.height * 0.42 : window.innerHeight * 0.45;
  if (!rect) return { x: actor === 0 ? 72 : window.innerWidth - 72, y };
  return { x: actor === 0 ? rect.left + 36 : rect.right - 36, y };
}

export function stageCenterPoint(stage: HTMLElement | null): { x: number; y: number } {
  const rect = stage?.getBoundingClientRect();
  if (!rect) return { x: window.innerWidth / 2, y: window.innerHeight * 0.46 };
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.46 };
}

function sourceName(id: number): string | null {
  try {
    return getUnitDef(id).name;
  } catch {
    return null;
  }
}

export function OpponentCardReveal({
  card,
  actor,
  viewer,
  vsAi,
  from,
  to,
}: {
  card: CardInstance;
  actor: PlayerId;
  viewer: PlayerId;
  vsAi: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  const [at, setAt] = useState(from);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setAt(to));
    return () => cancelAnimationFrame(frame);
  }, [from.x, from.y, to, to.x, to.y]);

  const title = vsAi && actor !== viewer ? "AI played" : actor === viewer ? `P${actor + 1} played` : "Opponent played";
  const source = card.type === "special" ? sourceName(card.ownerUnitId) : null;

  return (
    <div className="opp-card-reveal" role="status" aria-live="assertive">
      <div className="opp-card-pop" style={{ left: to.x, top: to.y - 168 }}>
        {title}
      </div>
      <article
        className={`card ${card.type} opp-card-fly`}
        style={{
          left: at.x,
          top: at.y,
          transitionDuration: `${OPPONENT_CARD_FLY_MS}ms`,
        }}
      >
        <header>
          <span>{TYPE_LABEL[card.type]}</span>
          <SupplyChip value={card.cost} />
        </header>
        <h4>{card.name}</h4>
        {source && (
          <CardSourceBadge
            sourceName={source}
            requiresSource={card.requiresSourceOnField}
            sourceReady
            compact
          />
        )}
        <div className="card-art" aria-hidden>
          <CardArtIcon effectId={card.effectId} type={card.type} size={72} title={card.name} facing={actor} />
        </div>
        <p>{card.text}</p>
      </article>
    </div>
  );
}
