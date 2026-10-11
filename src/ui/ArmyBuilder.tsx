import { useMemo, useState, type ReactNode } from "react";
import { PREMADE_ARMIES } from "../data/premadeArmies";
import { UNITS } from "../data/units";
import {
  AI_DIFFICULTIES,
  AI_DIFFICULTY_BLURB,
  AI_DIFFICULTY_LABEL,
  type AiDifficulty,
} from "../engine/aiDifficulty";
import { validateArmy } from "../engine/army";
import { formatAvg, summarizeArmy, type ArmySummary } from "../engine/armySummary";
import { ARMY_SIZE, type CardType, type UnitClass, type UnitDef } from "../engine/types";
import { ArmorChip, ApChip, AtkChip, CardTypeIcon, HpChip, KeywordChip, SupplyChip } from "./icons";
import { UnitCardPills } from "./CardTip";
import { UnitArt, UnitKeywords, UnitPortrait } from "./UnitToken";
import { UnitDetailDialog, type UnitDetailTarget } from "./UnitDetailDialog";
import { SgIconImg } from "./UiChrome";

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
  onConfirm: (armies: { p1: number[]; p2: number[]; aiDifficulty?: AiDifficulty }) => void;
  /** Tutorial walkthrough: P1 only, no match start required. */
  guide?: boolean;
  deckDrawer?: boolean;
}) {
  const joinOnly = intent.kind === "join";
  const hostOnly = (intent.kind === "create" && intent.mode === "pvp") || Boolean(guide);
  const [p1, setP1] = useState<number[]>(defaultP1);
  const [p2, setP2] = useState<number[]>(defaultP2);
  const [edit, setEdit] = useState<"p1" | "p2">(joinOnly ? "p2" : "p1");
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [inspect, setInspect] = useState<UnitDetailTarget | null>(null);
  const [deckListOpen, setDeckListOpen] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>("easy");
  const vsAi = intent.kind === "create" && intent.mode === "ai";
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

  function focusUnit(id: number) {
    setFocusedId(id);
    setDeckListOpen(false);
  }

  const focused = focusedId == null ? null : (UNITS.find((unit) => unit.id === focusedId) ?? null);

  return (
    <div className={`builder${deckDrawer ? " deck-drawer" : ""}`}>
      {inspect && <UnitDetailDialog target={inspect} onClose={() => setInspect(null)} />}
      <div className="builder-layout">
        <div className="catalog" data-tut="builder-catalog">
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
                  {vsAi ? "You" : "P1"} ({p1.length}/{ARMY_SIZE})
                </button>
              )}
              {!hostOnly && (
                <button type="button" className={edit === "p2" ? "primary" : "ghost"} onClick={() => setEdit("p2")}>
                  {vsAi ? "AI" : "P2"} ({p2.length}/{ARMY_SIZE})
                </button>
              )}
            </div>
          )}

          {CLASSES.map((unitClass) => (
            <div key={unitClass} className="class-block">
              <h3>{unitClass}</h3>
              <div className="unit-pick-grid">
                {UNITS.filter((u) => u.class === unitClass).map((unit) => {
                  const on = selected.includes(unit.id);
                  const focusedOn = focusedId === unit.id;
                  return (
                    <article
                      key={unit.id}
                      className={`pick-card${on ? " on" : ""}${focusedOn ? " focus" : ""}`}
                      data-tut={unit.id === 11 ? "builder-unit" : undefined}
                    >
                      <button
                        type="button"
                        className="pick-focus"
                        aria-pressed={focusedOn}
                        aria-label={`Inspect ${unit.name}`}
                        onClick={() => focusUnit(unit.id)}
                      >
                        <UnitArt name={unit.name} unitClass={unit.class} unitId={unit.id} compact />
                      </button>
                      <button
                        type="button"
                        className={`pick-toggle${on ? " on" : ""}`}
                        aria-pressed={on}
                        disabled={!on && selected.length >= ARMY_SIZE}
                        onClick={() => toggle(unit.id)}
                      >
                        {on ? "Selected" : "Select"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="deck-panel" data-tut="builder-deck">
          <div className="builder-stage">
            {deckListOpen ? (
              <DeckListView summary={summary} onToggleUnit={toggle} />
            ) : (
              <UnitInspectScreen
                unit={focused}
                onInfo={() => {
                  if (focused) setInspect({ mode: "catalog", def: focused });
                }}
              />
            )}
          </div>
          <button
            type="button"
            className={`decklist-toggle${deckListOpen ? " open" : ""}`}
            aria-expanded={deckListOpen}
            data-tut="builder-cards"
            onClick={() => setDeckListOpen((open) => !open)}
          >
            <span className="decklist-caret" aria-hidden>
              {deckListOpen ? "▼" : "▲"}
            </span>
            decklist
          </button>
          <DeckStats edit={edit} summary={summary} />
        </aside>
      </div>

      <footer className="builder-footer">
        {(error || sessionError) && <p className="error">{error ?? sessionError}</p>}
        {vsAi && (
          <div className="difficulty-row">
            <span className="sg-tab">AI</span>
            {AI_DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                className={aiDifficulty === level ? "primary" : undefined}
                onClick={() => setAiDifficulty(level)}
              >
                {AI_DIFFICULTY_LABEL[level]}
              </button>
            ))}
            <p className="muted difficulty-blurb">{AI_DIFFICULTY_BLURB[aiDifficulty]}</p>
          </div>
        )}
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
            onClick={() => onConfirm({ p1, p2, aiDifficulty: vsAi ? aiDifficulty : undefined })}
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
    <div className="deck-cards-only">
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

function UnitInspectScreen({ unit, onInfo }: { unit: UnitDef | null; onInfo: () => void }) {
  return (
    <div className="builder-screen" aria-label={unit ? `${unit.name} details` : "Unit detail"}>
      <div className="builder-screen-chin" aria-hidden>
        <i />
        <span>Detail</span>
      </div>
      <div className={`builder-screen-glass${unit ? "" : " empty"}`}>
        {unit ? (
          <div className="builder-screen-card">
            <button
              type="button"
              className="pick-detail-btn"
              title={`Details: ${unit.name}`}
              aria-label={`View ${unit.name} details`}
              onClick={onInfo}
            >
              i
            </button>
            <UnitPortrait
              name={unit.name}
              unitClass={unit.class}
              unitId={unit.id}
              cost={unit.cost}
              hp={unit.hp}
              armor={unit.armor}
              atk={unit.atk}
              ap={unit.ap}
            />
            <div className="builder-screen-meta">
              <strong>{unit.name}</strong>
              <UnitKeywords keywords={unit.keywords} />
              <UnitCardPills cards={unit.cards} sourceName={unit.name} />
            </div>
          </div>
        ) : (
          <p>Select a unit</p>
        )}
      </div>
    </div>
  );
}

function DeckListView({
  summary,
  onToggleUnit,
}: {
  summary: ArmySummary;
  onToggleUnit: (id: number) => void;
}) {
  return (
    <div className="builder-decklist">
      <section>
        <h3>Units</h3>
        {summary.count === 0 ? (
          <p className="muted">No units selected.</p>
        ) : (
          <ul className="deck-units">
            {summary.units.map((unit) => (
              <li key={unit.id}>
                <button type="button" className="deck-unit" onClick={() => onToggleUnit(unit.id)}>
                  <UnitArt name={unit.name} unitClass={unit.class} unitId={unit.id} compact />
                  <strong>{unit.name}</strong>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3>Cards in deck · {summary.deckSize}</h3>
        <DeckCardsList summary={summary} />
      </section>
    </div>
  );
}

function DeckStats({ edit, summary }: { edit: "p1" | "p2"; summary: ArmySummary }) {
  return (
    <div className="builder-stats">
      <h2>
        {edit.toUpperCase()} deck · {summary.count}/{ARMY_SIZE} · {summary.deckSize} cards
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
        </>
      )}
    </div>
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
