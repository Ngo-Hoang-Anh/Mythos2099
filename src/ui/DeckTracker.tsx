import { useMemo, useState } from "react";
import {
  buildEnemyDeckTracker,
  buildSelfDeckTracker,
  formatPct,
  unitsWithCard,
  type DeckTrackerModel,
  type TrackerRow,
} from "../engine/deckTracker";
import type { CardType, PlayerState } from "../engine/types";
import { SupplyChip } from "./icons";

const TYPE_LABEL: Record<CardType, string> = {
  special: "Special",
  maneuver: "Maneuver",
  move: "Move",
};

function TrackerPanel({
  title,
  model,
  enemy,
  openKey,
  onToggle,
}: {
  title: string;
  model: DeckTrackerModel;
  enemy?: boolean;
  openKey: string | null;
  onToggle: (key: string | null) => void;
}) {
  const groups: CardType[] = ["special", "maneuver", "move"];
  return (
    <div className={`deck-tracker ${enemy ? "enemy" : "self"}`} role="dialog" aria-label={title}>
      <header>
        <strong>{title}</strong>
        <span>
          Deck {model.deckSize}
          {enemy ? ` · Hand ${model.handSize}` : ""}
        </span>
      </header>
      <p className="deck-tracker-legend">
        <span>% next 2-card draw</span>
        <span className="recycle-pct">% if you discard &amp; redraw x2 (+2 draws)</span>
      </p>
      <div className="deck-tracker-body">
        {groups.map((type) => {
          const rows = model.rows.filter((r) => !r.unknown && r.type === type);
          if (rows.length === 0) return null;
          return (
            <section key={type}>
              <h4>{TYPE_LABEL[type]}</h4>
              <ul>
                {rows.map((row) => (
                  <TrackerLine
                    key={row.key}
                    row={row}
                    enemy={enemy}
                    open={openKey === row.key}
                    units={
                      enemy && openKey === row.key
                        ? unitsWithCard(model.revealedUnitIds, row.name, row.type)
                        : []
                    }
                    onToggle={() => onToggle(openKey === row.key ? null : row.key)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {model.rows
          .filter((r) => r.unknown)
          .map((row) => (
            <section key={row.key}>
              <h4>Fog</h4>
              <ul>
                <TrackerLine row={row} enemy={enemy} open={false} units={[]} onToggle={() => undefined} />
              </ul>
            </section>
          ))}
        {enemy && model.discarded.length > 0 && (
          <section>
            <h4>Burned / played</h4>
            <ul className="deck-tracker-discard">
              {model.discarded.map((card) => (
                <li key={`${card.type}-${card.name}`}>
                  <span>{card.name}</span>
                  <b>×{card.count}</b>
                </li>
              ))}
            </ul>
          </section>
        )}
        {model.rows.length === 0 && model.discarded.length === 0 && (
          <p className="muted">{enemy ? "No revealed cards yet." : "Deck is empty."}</p>
        )}
      </div>
    </div>
  );
}

function TrackerLine({
  row,
  enemy,
  open,
  units,
  onToggle,
}: {
  row: TrackerRow;
  enemy?: boolean;
  open: boolean;
  units: { id: number; name: string }[];
  onToggle: () => void;
}) {
  const inner = (
    <>
      <span className={`deck-tracker-name ${row.unknown ? "unknown" : ""}`}>{row.name}</span>
      <b>×{row.count}</b>
      {!row.unknown ? (
        <small>
          <SupplyChip value={row.cost} />
        </small>
      ) : (
        <small />
      )}
      <em className="base-pct" title="Probability in the next 2-card draw">
        {formatPct(row.basePct)}
      </em>
      <em className="recycle-pct" title="Probability if you also Discard &amp; Redraw twice = 2 extra draws from your deck">
        {formatPct(row.recyclePct)}
      </em>
    </>
  );

  return (
    <li className={open ? "open" : ""}>
      {enemy && !row.unknown ? (
        <button type="button" className="deck-tracker-row" onClick={onToggle}>
          {inner}
        </button>
      ) : (
        <div className="deck-tracker-row">{inner}</div>
      )}
      {open && (
        <div className="deck-tracker-units">
          {units.length === 0 ? (
            <span className="muted">No revealed units with this card.</span>
          ) : (
            units.map((u) => <span key={u.id}>{u.name}</span>)
          )}
        </div>
      )}
    </li>
  );
}

export function OwnDeckTracker({ player }: { player: PlayerState }) {
  const model = useMemo(() => buildSelfDeckTracker(player), [player]);
  return <TrackerPanel title="Your deck" model={model} openKey={null} onToggle={() => undefined} />;
}

export function EnemyDeckTracker({ player }: { player: PlayerState }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const model = useMemo(() => buildEnemyDeckTracker(player), [player]);
  return (
    <TrackerPanel
      title="Enemy deck"
      model={model}
      enemy
      openKey={openKey}
      onToggle={setOpenKey}
    />
  );
}
