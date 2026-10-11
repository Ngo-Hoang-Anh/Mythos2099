import type { CardDef, CardType, EffectId, PlayerId } from "../engine/types";
import { TipHost } from "./AnchoredTip";
import { CardArtIcon, SupplyChip } from "./icons";

const TYPE_LABEL: Record<CardType, string> = {
  special: "Special",
  maneuver: "Maneuver",
  move: "Move",
};

type Reach = "up" | "down" | "forward" | "forwardUp" | "forwardDown" | "back" | "upBack" | "downBack";

function reachForEffect(effectId: EffectId): Reach[] | null {
  switch (effectId) {
    case "up":
      return ["up", "upBack"];
    case "down":
      return ["down", "downBack"];
    case "forward":
      return ["forward"];
    case "retreat":
    case "maintenance":
      return ["upBack", "back", "downBack"];
    case "upOrDown":
      return ["up", "down"];
    case "moveAnyDirection":
      return ["up", "down", "forward", "back"];
    case "intelAcquired":
    case "moveUnitTwice":
    case "diversionDown":
    case "diversionUp":
      return ["up", "down", "forward", "back", "forwardUp", "forwardDown", "upBack", "downBack"];
    case "swiftManeuver":
    case "moveTwoUnits":
      return ["up", "down", "back"];
    default:
      return null;
  }
}

function showsEnemyFacing(effectId: EffectId): boolean {
  return effectId === "forward" || effectId === "retreat" || effectId === "maintenance";
}

function cellClass(row: number, col: number, reach: Set<Reach>, facing: PlayerId): string {
  if (row === 1 && col === 1) return "here";
  // P1: forward = right (col 2). P2: forward = left (col 0) — mirror board columns.
  const boardCol = facing === 1 ? 2 - col : col;
  const map: Record<string, Reach> = {
    "0,1": "up",
    "2,1": "down",
    "1,2": "forward",
    "0,2": "forwardUp",
    "2,2": "forwardDown",
    "1,0": "back",
    "0,0": "upBack",
    "2,0": "downBack",
  };
  const dir = map[`${row},${boardCol}`];
  if (dir && reach.has(dir)) return "reach";
  return "";
}

export function MoveGrid({ effectId, facing = 0 }: { effectId: EffectId; facing?: PlayerId }) {
  const dirs = reachForEffect(effectId);
  if (!dirs) return null;
  const reach = new Set(dirs);
  return (
    <div className="move-diagram">
      {showsEnemyFacing(effectId) && (
        <div className="move-facing" title="Assumed enemy facing">
          {facing === 1 ? (
            <>
              <span>Enemy</span>
              <span className="move-arrow" aria-hidden>
                ←
              </span>
              <span>You</span>
            </>
          ) : (
            <>
              <span>You</span>
              <span className="move-arrow" aria-hidden>
                →
              </span>
              <span>Enemy</span>
            </>
          )}
        </div>
      )}
      <div className="move-grid" aria-hidden>
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <span key={`${row}-${col}`} className={`move-cell ${cellClass(row, col, reach, facing)}`} />
          )),
        )}
      </div>
    </div>
  );
}

/** Bound-to-unit badge: required on board vs play anytime. */
export function CardSourceBadge({
  sourceName,
  requiresSource,
  sourceReady,
  compact = false,
}: {
  sourceName: string;
  requiresSource?: boolean;
  sourceReady?: boolean;
  compact?: boolean;
}) {
  const required = Boolean(requiresSource);
  const missing = required && sourceReady === false;
  const label = required
    ? missing
      ? compact
        ? sourceName
        : `${sourceName} · not on board`
      : compact
        ? sourceName
        : `Requires ${sourceName} on board`
    : compact
      ? sourceName
      : `From ${sourceName} · play anytime`;
  const title = required
    ? missing
      ? `${sourceName} must be on the board to play this Special (missing).`
      : `${sourceName} must be on the board to play this Special.`
    : `From ${sourceName}. Can be played even if that unit is not on the board.`;
  return (
    <div
      className={`card-source ${required ? (missing ? "missing" : "required") : "optional"} ${compact ? "compact" : ""}`}
      title={title}
    >
      <span className="card-source-mark" aria-hidden>
        {required ? "▣" : "◇"}
      </span>
      <span className="card-source-text">{label}</span>
    </div>
  );
}

export function CardDetail({
  name,
  type,
  cost,
  text,
  effectId,
  sourceName,
  sourceReady,
  requiresSource,
  facing = 0,
}: {
  name: string;
  type: CardType;
  cost: number;
  text: string;
  effectId: EffectId;
  sourceName?: string;
  sourceReady?: boolean;
  requiresSource?: boolean;
  facing?: PlayerId;
}) {
  return (
    <div className="card-detail">
      <header>
        <CardArtIcon effectId={effectId} type={type} size={18} title={TYPE_LABEL[type]} facing={facing} />
        <b>{name}</b>
        <em>{TYPE_LABEL[type]}</em>
        <SupplyChip value={cost} />
      </header>
      {sourceName && (
        <CardSourceBadge sourceName={sourceName} requiresSource={requiresSource} sourceReady={sourceReady} />
      )}
      <p>{text}</p>
      <MoveGrid effectId={effectId} facing={facing} />
    </div>
  );
}

export function UnitCardPills({
  cards,
  facing = 0,
  sourceName,
}: {
  cards: CardDef[];
  facing?: PlayerId;
  /** Owning unit name — shown on Specials with required/anytime badge. */
  sourceName?: string;
}) {
  const grouped = new Map<string, { card: CardDef; count: number }>();
  for (const card of cards) {
    const key = `${card.type}:${card.name}`;
    const existing = grouped.get(key);
    if (existing) existing.count += 1;
    else grouped.set(key, { card, count: 1 });
  }
  const list = [...grouped.values()];
  if (list.length === 0) return null;
  return (
    <div className="unit-card-pills">
      {list.map(({ card, count }) => {
        const isSpecial = card.type === "special";
        const required = Boolean(card.requiresSourceOnField);
        return (
          <TipHost
            key={`${card.type}-${card.name}`}
            className={`unit-card-pill type-${card.type} ${isSpecial ? (required ? "bind-required" : "bind-optional") : ""}`}
            tipClassName="chip-tip card-tip"
            tip={
              <CardDetail
                name={card.name}
                type={card.type}
                cost={card.cost}
                text={card.text}
                effectId={card.effectId}
                facing={facing}
                sourceName={isSpecial ? sourceName : undefined}
                requiresSource={required}
                sourceReady={true}
              />
            }
          >
            <CardArtIcon effectId={card.effectId} type={card.type} size={16} title={card.name} facing={facing} />
            {isSpecial && (
              <span className="card-source-mark" aria-hidden title={required ? "Requires unit on board" : "Play anytime"}>
                {required ? "▣" : "◇"}
              </span>
            )}
            {card.name}
            {count > 1 ? ` ×${count}` : ""}
          </TipHost>
        );
      })}
    </div>
  );
}
