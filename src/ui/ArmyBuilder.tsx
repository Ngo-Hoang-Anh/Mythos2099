import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { PREMADE_ARMIES } from "../data/premadeArmies";
import { UNITS } from "../data/units";
import { validateArmy } from "../engine/army";
import { formatAvg, summarizeArmy, type ArmySummary } from "../engine/armySummary";
import { ARMY_SIZE, type CardType, type UnitClass, type UnitDef } from "../engine/types";
import { ArmorChip, ApChip, AtkChip, CardTypeIcon, HpChip, KeywordChip, SupplyChip } from "./icons";
import { UnitCardPills } from "./CardTip";
import { UnitKeywords, UnitPortrait } from "./UnitToken";
import { UnitDetailDialog, type UnitDetailTarget } from "./UnitDetailDialog";
import { SgIconBtn, SgIconImg } from "./UiChrome";

const CLASSES: UnitClass[] = [
  "Tank",
  "Light Vehicle",
  "Helicopter",
  "Artillery",
  "Robot",
  "Armored Infantry",
  "Motorcycle",
  "Drone",
  "Jet Plane",
];

const TYPE_LABEL: Record<CardType, string> = {
  special: "Special",
  maneuver: "Maneuver",
  move: "Move",
};

export type ArmyIntent =
  | { kind: "create"; mode: "ai" | "hotseat" | "pvp" }
  | { kind: "join"; roomId: string; hostName: string };

export function ArmyBuilder({
  defaultP1,
  defaultP2,
  intent,
  busy = false,
  error: sessionError,
  onBack,
  onConfirm,
  guide = false,
  /** `/m`: hide side deck index; open it from a compact cards button + dialog. */
  deckDrawer = false,
}: {
  defaultP1: number[];
  defaultP2: number[];
  intent: ArmyIntent;
  busy?: boolean;
  error?: string | null;
  onBack: () => void;
  onConfirm: (armies: { p1: number[]; p2: number[] }) => void;
  /** Tutorial walkthrough: P1 only, no match start required. */
  guide?: boolean;
  deckDrawer?: boolean;
}) {
  const joinOnly = intent.kind === "join";
  const hostOnly = (intent.kind === "create" && intent.mode === "pvp") || Boolean(guide);
  const [p1, setP1] = useState<number[]>(defaultP1);
  const [p2, setP2] = useState<number[]>(defaultP2);
  const [edit, setEdit] = useState<"p1" | "p2">(joinOnly ? "p2" : "p1");
  const [inspect, setInspect] = useState<UnitDetailTarget | null>(null);
  const [deckOpen, setDeckOpen] = useState(false);
  const selected = edit === "p1" ? p1 : p2;
  const setter = edit === "p1" ? setP1 : setP2;
  const armyError = useMemo(() => {
    if (joinOnly) return validateArmy(p2);
    if (hostOnly) return validateArmy(p1);
    return validateArmy(p1) ?? validateArmy(p2);
  }, [joinOnly, hostOnly, p1, p2]);
  const error = armyError;
  const summary = useMemo(() => summarizeArmy(selected), [selected]);
  const title = guide
    ? "Build an army"
    : intent.kind === "join"
      ? `Join ${intent.hostName}'s room ${intent.roomId}`
      : intent.mode === "pvp"
        ? "Host a PvP room"
        : intent.mode === "ai"
          ? "vs AI"
          : "Hotseat";
  const confirmLabel = guide
    ? "Finish guide"
    : busy
      ? "Connecting…"
      : intent.kind === "join"
        ? "Join match"
        : intent.mode === "pvp"
          ? "Create room"
          : "Start match";

  function toggle(id: number) {
    if (selected.includes(id)) setter(selected.filter((x) => x !== id));
    else if (selected.length < ARMY_SIZE) setter([...selected, id]);
  }

  function openDetail(unit: UnitDef, event: MouseEvent) {
    event.stopPropagation();
    setInspect({ mode: "catalog", def: unit });
  }

  return (
    <div className={`builder${deckDrawer ? " deck-drawer" : ""}`}>
      {inspect && <UnitDetailDialog target={inspect} onClose={() => setInspect(null)} />}
      {!guide && (
        <header className="builder-hero">
          <p className="eyebrow">Army</p>
          <h1>Mythos2099</h1>
          <p>{title}. Pick 8 units. The server owns the rules.</p>
        </header>
      )}

      <div className="premade-row" data-tut="builder-premade">
        <span className="sg-tab">Premade</span>
        {Object.entries(PREMADE_ARMIES).map(([key, army]) => (
          <button
            key={key}
            type="button"
            className={selected.join() === army.units.join() ? "primary" : undefined}
            onClick={() => setter(army.units)}
          >
            {edit.toUpperCase()}: {army.name}
          </button>
        ))}
      </div>

      {!guide && (
        <div className="picker-tabs">
          {!joinOnly && (
            <button type="button" className={edit === "p1" ? "primary" : "ghost"} onClick={() => setEdit("p1")}>
              P1 ({p1.length}/{ARMY_SIZE})
            </button>
          )}
          {!hostOnly && (
            <button type="button" className={edit === "p2" ? "primary" : "ghost"} onClick={() => setEdit("p2")}>
              P2 ({p2.length}/{ARMY_SIZE})
            </button>
          )}
        </div>
      )}

      <div className="builder-layout">
        <div className="catalog" data-tut="builder-catalog">
          {CLASSES.map((unitClass) => (
            <div key={unitClass} className="class-block">
              <h3>{unitClass}</h3>
              <div className="unit-pick-grid">
                {UNITS.filter((u) => u.class === unitClass).map((unit) => {
                  const on = selected.includes(unit.id);
                  return (
                    <article
                      key={unit.id}
                      className={`pick-card ${on ? "on" : ""}`}
                      data-tut={unit.id === 11 ? "builder-unit" : undefined}
                    >
                      <button
                        type="button"
                        className="pick-select"
                        aria-pressed={on}
                        onClick={() => toggle(unit.id)}
                      >
                        <UnitPortrait
                          name={unit.name}
                          unitClass={unit.class}
                          unitId={unit.id}
                          compact
                          cost={unit.cost}
                          hp={unit.hp}
                          armor={unit.armor}
                          atk={unit.atk}
                          ap={unit.ap}
                        />
                        <div className="pick-meta">
                          <strong>{unit.name}</strong>
                          <UnitKeywords keywords={unit.keywords} />
                          <UnitCardPills cards={unit.cards} sourceName={unit.name} />
                        </div>
                      </button>
                      <button
                        type="button"
                        className="pick-detail-btn"
                        title={`Details: ${unit.name}`}
                        aria-label={`View ${unit.name} details`}
                        onClick={(event) => openDetail(unit, event)}
                      >
                        i
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="deck-panel" data-tut="builder-deck">
          <DeckPanelBody
            edit={edit}
            summary={summary}
            onToggleUnit={toggle}
            hideCards={deckDrawer}
            cardsAction={
              deckDrawer ? (
                <button
                  type="button"
                  className="builder-deck-open"
                  title="Open cards in deck"
                  aria-label={`Open cards in deck, ${summary.deckSize} cards`}
                  onClick={() => setDeckOpen(true)}
                >
                  <img src="/icon/card-special.svg" alt="" width={28} height={28} draggable={false} />
                  <b>{summary.deckSize}</b>
                  <span>cards</span>
                </button>
              ) : null
            }
          />
        </aside>
      </div>

      {deckDrawer && deckOpen && (
        <div className="builder-deck-modal" onClick={() => setDeckOpen(false)} role="presentation">
          <div
            className="builder-deck-dialog deck-panel"
            role="dialog"
            aria-label="Cards in deck"
            data-tut="builder-cards"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="builder-deck-dialog-head">
              <h2>
                Cards in deck · {summary.deckSize}
              </h2>
              <SgIconBtn name="close" tone="cyan" title="Close" onClick={() => setDeckOpen(false)} size={36} />
            </header>
            <DeckCardsList summary={summary} />
          </div>
        </div>
      )}

      <footer className="builder-footer">
        {(error || sessionError) && <p className="error">{error ?? sessionError}</p>}
        <div className="mode-row">
          <button type="button" className="ghost sg-btn-row" onClick={onBack}>
            <SgIconImg name="back" tone="cyan" size={20} />
            {guide ? "Lessons" : "Back to lobby"}
          </button>
          <button
            type="button"
            className="primary sg-btn-row"
            data-tut="builder-start"
            disabled={guide ? false : Boolean(error) || busy}
            onClick={() => onConfirm({ p1, p2 })}
          >
            <SgIconImg name="check" tone="gold" size={20} />
            {confirmLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}

function DeckCardsList({ summary }: { summary: ArmySummary }): ReactNode {
  if (summary.count === 0) return <p className="muted">No units selected.</p>;
  return (
    <div className="deck-cards-only" data-tut="builder-cards">
      {(["special", "maneuver", "move"] as CardType[]).map((type) => {
        const cards = summary.cards.filter((c) => c.type === type);
        if (cards.length === 0) return null;
        return (
          <div key={type} className="deck-card-group">
            <h4 className="deck-card-type">
              <CardTypeIcon type={type} size={18} />
              {TYPE_LABEL[type]}
            </h4>
            <ul>
              {cards.map((card) => (
                <li key={`${card.type}-${card.name}`}>
                  <span>{card.name}</span>
                  <b>×{card.count}</b>
                  <small>
                    <SupplyChip value={card.cost} />
                  </small>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function DeckPanelBody({
  edit,
  summary,
  onToggleUnit,
  hideCards = false,
  cardsAction = null,
}: {
  edit: "p1" | "p2";
  summary: ArmySummary;
  onToggleUnit: (id: number) => void;
  hideCards?: boolean;
  cardsAction?: ReactNode;
}): ReactNode {
  return (
    <>
      <h2 className={hideCards ? "deck-panel-title-row" : undefined}>
        <span>
          {edit.toUpperCase()} deck · {summary.count}/{ARMY_SIZE} units
          {!hideCards ? ` · ${summary.deckSize} cards` : ""}
        </span>
        {cardsAction}
      </h2>
      <div className="builder-army-meter" aria-label={`${summary.count} of ${ARMY_SIZE} units`}>
        <div className="sg-progress">
          {Array.from({ length: ARMY_SIZE }, (_, i) => (
            <i key={i} className={i < summary.count ? "on" : ""} />
          ))}
        </div>
      </div>
      {summary.count === 0 ? (
        <p className="muted">No units selected.</p>
      ) : (
        <>
          <div className="avg-row">
            <AvgStat kind="supply" value={formatAvg(summary.avgCp)} />
            <AvgStat kind="hp" value={formatAvg(summary.avgHp)} />
            <AvgStat kind="atk" value={formatAvg(summary.avgAtk)} />
            <AvgStat kind="armor" value={formatAvg(summary.avgArmor)} />
            <AvgStat kind="ap" value={formatAvg(summary.avgAp)} />
          </div>
          <div className="avg-keywords">
            {summary.keywords.map((k) => (
              <span key={k.name} className="avg-kw">
                <KeywordChip keyword={{ name: k.name, value: k.avgValue ?? 1 }} />
                <em>×{k.count}</em>
              </span>
            ))}
          </div>
          <div className={`deck-cols${hideCards ? " units-only" : ""}`}>
            <section>
              <h3>Units</h3>
              <ul className="deck-units">
                {summary.units.map((unit) => (
                  <li key={unit.id}>
                    <button type="button" className="deck-unit" onClick={() => onToggleUnit(unit.id)}>
                      <UnitPortrait
                        name={unit.name}
                        unitClass={unit.class}
                        unitId={unit.id}
                        compact
                        cost={unit.cost}
                        hp={unit.hp}
                        armor={unit.armor}
                        atk={unit.atk}
                        ap={unit.ap}
                      />
                      <div className="pick-meta">
                        <strong>{unit.name}</strong>
                        <UnitKeywords keywords={unit.keywords} />
                        <UnitCardPills cards={unit.cards} sourceName={unit.name} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            {!hideCards && (
              <section data-tut="builder-cards">
                <h3>Cards in deck</h3>
                <DeckCardsList summary={summary} />
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}

function AvgStat({ kind, value }: { kind: "supply" | "hp" | "atk" | "armor" | "ap"; value: string }) {
  const n = Number(value);
  const chip =
    kind === "supply" ? (
      <SupplyChip value={n} />
    ) : kind === "hp" ? (
      <HpChip value={n} />
    ) : kind === "atk" ? (
      <AtkChip value={n} />
    ) : kind === "armor" ? (
      <ArmorChip value={n} />
    ) : (
      <ApChip value={n} />
    );
  return <div className="avg-stat">{chip}</div>;
}
