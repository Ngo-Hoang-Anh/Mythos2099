import { useEffect, useMemo, useRef, useState } from "react";
import { C, getCard, type CardCatalogId } from "../src/data/cardCatalog";
import { getUnitDef, UNITS } from "../src/data/units";
import { FLAG_KEYWORDS, parseKeywords } from "../src/engine/keywords";
import { applyAction } from "../src/engine/match";
import {
  COLS,
  ROWS,
  type Action,
  type Direction,
  type InitiativeChoice,
  type Keyword,
  type KeywordName,
  type MatchState,
  type Phase,
  type PlayerId,
  type UnitClass,
} from "../src/engine/types";
import {
  beatSettled,
  emptyDraft,
  lessonBehavior,
  markBeatProgress,
  registerDraftUnits,
  setupScenario,
  type Beat,
  type BeatAction,
  type BeatTargets,
  type CustomUnitDraft,
  type DoneCheck,
  type PlacedUnitDraft,
  type ScenarioDraft,
} from "../src/tutorial/authored";
import type { LessonDef, LessonStat, TutorialHud } from "../src/tutorial/lessons";
import { MatchView } from "../src/ui/MatchView";
import { TutorialSpotlight } from "../src/ui/TutorialSpotlight";
import { emitLessonPack, type LessonPack } from "./codegen";
import { inferBeat, nextBeatId } from "./infer";

const STORAGE_KEY = "mythos.lessonStudio.v1";
const COL_NAME = ["P1 Support", "P1 Front", "P2 Front", "P2 Support"];
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
const PHASES: Phase[] = ["deployment", "maneuver", "engagement", "gameover"];
const DIRECTIONS: Direction[] = [
  "forward",
  "forwardUp",
  "forwardDown",
  "back",
  "up",
  "down",
  "upBack",
  "downBack",
];
const CHOICES: InitiativeChoice[] = ["supply", "move", "nextSupply"];
const HUB_STATS: LessonStat[] = ["hp", "atk", "armor", "ap", "supply"];
const KEYWORD_LABEL: Record<KeywordName, string> = {
  cover: "Cover",
  flank: "Flank",
  retaliate: "Retaliate",
  aggressive: "Aggressive",
  blitz: "Blitz",
  supportFire: "Support Fire",
  artillery: "Artillery",
  airStrike: "Air Strike",
  missile: "Missile",
  jetPlane: "Jet Plane",
};
const CARD_KEYS = Object.keys(C) as CardCatalogId[];

function loadDraft(): ScenarioDraft {
  const base = emptyDraft();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ScenarioDraft>;
    return {
      ...base,
      ...parsed,
      hq: parsed.hq ?? base.hq,
      supply: parsed.supply ?? base.supply,
      reserve: parsed.reserve ?? base.reserve,
      board: parsed.board ?? [],
      hand: parsed.hand ?? [],
      deck: parsed.deck ?? [],
      units: parsed.units ?? [],
      beats: parsed.beats ?? [],
      coach: parsed.coach?.length ? parsed.coach : base.coach,
      hubStats: parsed.hubStats ?? [],
      keywords: parsed.keywords ?? [],
    };
  } catch {
    return base;
  }
}

function formatKeywords(keywords: Keyword[]): string {
  return keywords
    .map((keyword) =>
      FLAG_KEYWORDS.has(keyword.name)
        ? KEYWORD_LABEL[keyword.name]
        : `${KEYWORD_LABEL[keyword.name]} ${keyword.value}`,
    )
    .join(", ");
}

function num(value: string, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function checksOf(done: DoneCheck): DoneCheck[] {
  return done.type === "and" ? done.checks : [done];
}

function packChecks(checks: DoneCheck[]): DoneCheck {
  if (checks.length === 1) return checks[0]!;
  return { type: "and", checks };
}

function blankCheck(): DoneCheck {
  return { type: "phase", phase: "deployment" };
}

function unitChoices(units: CustomUnitDraft[]): { id: number; name: string }[] {
  return [
    ...UNITS.map((unit) => ({ id: unit.id, name: unit.name })),
    ...units.map((unit) => ({ id: unit.id, name: unit.name || `Custom ${unit.id}` })),
  ];
}

function cardsFor(defId: number): { templateId: string; name: string }[] {
  try {
    return getUnitDef(defId).cards.map((card) => ({ templateId: card.templateId, name: card.name }));
  } catch {
    return [];
  }
}

function blankAction(type: BeatAction["type"]): BeatAction {
  if (type === "deploy") return { type: "deploy", unitDefId: 1, row: 0 };
  if (type === "playCard") return { type: "playCard", templateId: "forward", targets: {} };
  if (type === "discardRedraw") return { type: "discardRedraw", templateId: "forward" };
  if (type === "endDeployment") return { type: "endDeployment" };
  return { type: "endManeuver" };
}

export function StudioApp() {
  const [draft, setDraft] = useState(loadDraft);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [mode, setMode] = useState<"free" | "lesson">("free");
  const [recording, setRecording] = useState<null | "player" | "bot">(null);
  const [error, setError] = useState<string | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [hud, setHud] = useState<TutorialHud>({ reserveOpen: false, pendingDeploy: null });
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [selectedBeat, setSelectedBeat] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);
  const [placeId, setPlaceId] = useState(1);
  const [pack, setPack] = useState<LessonPack | null>(null);
  const [hubKw, setHubKw] = useState(() => formatKeywords(loadDraft().keywords));
  const draftRef = useRef(draft);
  const matchRef = useRef(match);
  const modeRef = useRef(mode);
  const recordingRef = useRef(recording);
  const failRef = useRef<string | null>(null);
  const lessonRef = useRef<LessonDef | null>(null);
  draftRef.current = draft;
  matchRef.current = match;
  modeRef.current = mode;
  recordingRef.current = recording;

  const lesson = useMemo((): LessonDef => {
    const behavior = lessonBehavior(draft.beats);
    return {
      id: (draft.id || "custom-lesson") as LessonDef["id"],
      number: draft.number,
      title: draft.title,
      subtitle: draft.subtitle,
      ...(draft.formula?.trim() ? { formula: draft.formula.trim() } : {}),
      hubStats: draft.hubStats,
      units: [],
      keywords: draft.keywords,
      coach: draft.coach.length ? draft.coach : [""],
      success: draft.success,
      allowDiscardRedraw: draft.beats.some((beat) => beat.action.type === "discardRedraw"),
      setup: () => setupScenario(draft),
      ...behavior,
    };
  }, [draft]);
  lessonRef.current = lesson;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    try {
      registerDraftUnits(draft.units);
      setUnitError(null);
    } catch (err) {
      setUnitError(err instanceof Error ? err.message : "Custom unit không hợp lệ");
    }
  }, [draft.units]);

  useEffect(() => {
    try {
      const next = setupScenario(draftRef.current);
      matchRef.current = next;
      setMatch(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không dựng được trận");
    }
    // Mount only — Restart áp lại setup sau khi sửa form.
  }, []);

  function restart() {
    try {
      const next = setupScenario(draftRef.current);
      matchRef.current = next;
      setMatch(next);
      setError(null);
      failRef.current = null;
      setDismissed(new Set());
      setHud({ reserveOpen: false, pendingDeploy: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không dựng được trận");
    }
  }

  function commit(action: Action, record: boolean, fromScript: boolean) {
    const current = matchRef.current;
    const active = lessonRef.current;
    if (!current || !active) return;
    if (modeRef.current === "lesson" && !record && action.type !== "endEngagement") {
      const blocked = active.allow(current, action);
      if (blocked) {
        setError(blocked);
        if (fromScript) failRef.current = blocked;
        return;
      }
    }
    const result = applyAction(current, action);
    if (!result.ok) {
      setError(result.error);
      if (fromScript) failRef.current = result.error;
      return;
    }
    const next = result.state;
    const beats = draftRef.current.beats;
    if (record) {
      const beat = inferBeat(current, next, action, nextBeatId(beats));
      if (beat) {
        const updated = [...beats, beat];
        setDraft({ ...draftRef.current, beats: updated });
        markBeatProgress(next, updated);
        setSelectedBeat(updated.length - 1);
      } else {
        markBeatProgress(next, beats);
      }
    } else {
      markBeatProgress(next, beats);
    }
    failRef.current = null;
    setError(null);
    matchRef.current = next;
    setMatch(next);
  }

  useEffect(() => {
    if (!match || recording || failRef.current || match.combatPlayback || hud.animating) return;
    if (mode === "lesson" && draft.beats.length > 0 && draft.beats.every((beat) => beatSettled(match, beat))) return;
    if (mode === "lesson") {
      const hint = lesson.pickHint?.(match, hud, dismissed);
      if (hint?.next) return;
    }
    const action = lesson.scriptedAction?.(match);
    if (!action) return;
    const timer = window.setTimeout(() => commit(action, false, true), 750);
    return () => window.clearTimeout(timer);
  }, [dismissed, draft.beats, hud, lesson, match, mode, recording]);

  function sendAction(action: Action) {
    const seat = matchRef.current?.currentPlayer;
    const rec = recordingRef.current;
    const record = (rec === "player" && seat === 0) || (rec === "bot" && seat === 1);
    const skip = action.type === "endEngagement" || action.type === "surrender";
    commit(action, record && !skip, false);
  }

  const you: PlayerId = recording === "bot" ? 1 : 0;
  const hint = mode === "lesson" && match ? lesson.pickHint?.(match, hud, dismissed) ?? null : null;
  const choices = unitChoices(draft.units);
  const placed = selectedCell
    ? draft.board.find((unit) => unit.col === selectedCell.col && unit.row === selectedCell.row)
    : undefined;

  function patch(partial: Partial<ScenarioDraft>) {
    setDraft({ ...draft, ...partial });
  }

  function updateBeat(index: number, partial: Partial<Beat>) {
    const beats = draft.beats.map((beat, i) => (i === index ? { ...beat, ...partial } : beat));
    patch({ beats });
  }

  function moveBeat(from: number, to: number) {
    if (to < 0 || to >= draft.beats.length) return;
    const beats = [...draft.beats];
    const [item] = beats.splice(from, 1);
    beats.splice(to, 0, item!);
    patch({ beats });
    setSelectedBeat(to);
  }

  const beat = draft.beats[selectedBeat];

  return (
    <div className="studio-app">
      <aside className="studio-side">
        <div>
          <p className="eyebrow">Local only</p>
          <h1>Lesson studio</h1>
          <p className="studio-note">
            Chạy bằng <code>npm run dev:studio</code> (cổng 5174). App này không nằm trong bản deploy.
            Sửa setup rồi bấm Restart để chơi lại từ đầu.
          </p>
        </div>
        <section>
          <h2>Lesson</h2>
          <div className="studio-row">
            <label>
              Id
              <input value={draft.id} onChange={(event) => patch({ id: event.target.value })} />
            </label>
            <label>
              Number
              <input
                type="number"
                value={draft.number}
                onChange={(event) => patch({ number: num(event.target.value, draft.number) })}
              />
            </label>
          </div>
          <label>
            Title
            <input value={draft.title} onChange={(event) => patch({ title: event.target.value })} />
          </label>
          <label>
            Subtitle
            <input value={draft.subtitle} onChange={(event) => patch({ subtitle: event.target.value })} />
          </label>
          <label>
            Formula
            <input
              value={draft.formula ?? ""}
              onChange={(event) => patch({ formula: event.target.value })}
            />
          </label>
          <label>
            Coach (mỗi dòng một đoạn)
            <textarea
              rows={4}
              value={draft.coach.join("\n")}
              onChange={(event) => patch({ coach: event.target.value.split("\n") })}
            />
          </label>
          <label>
            Success
            <input value={draft.success} onChange={(event) => patch({ success: event.target.value })} />
          </label>
          <div className="studio-chips">
            {HUB_STATS.map((stat) => (
              <label key={stat}>
                <input
                  type="checkbox"
                  checked={draft.hubStats.includes(stat)}
                  onChange={(event) => {
                    const hubStats = event.target.checked
                      ? [...draft.hubStats, stat]
                      : draft.hubStats.filter((item) => item !== stat);
                    patch({ hubStats });
                  }}
                />
                {stat}
              </label>
            ))}
          </div>
          <label>
            Hub keywords
            <input
              value={hubKw}
              onChange={(event) => setHubKw(event.target.value)}
              onBlur={() => {
                try {
                  patch({ keywords: hubKw.trim() ? parseKeywords(hubKw) : [] });
                  setError(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Keyword không hợp lệ");
                }
              }}
            />
          </label>
        </section>
        <section>
          <h2>Trận</h2>
          <label>
            <input
              type="checkbox"
              checked={draft.youFirst}
              onChange={(event) => patch({ youFirst: event.target.checked })}
            />
            Người chơi đi trước
          </label>
          {([0, 1] as const).map((id) => (
            <div className="studio-row" key={id}>
              <label>
                P{id + 1} supply
                <input
                  type="number"
                  value={draft.supply[id]}
                  onChange={(event) => {
                    const supply: [number, number] = [...draft.supply];
                    supply[id] = num(event.target.value, supply[id]);
                    patch({ supply });
                  }}
                />
              </label>
              <label>
                HQ HP
                <input
                  type="number"
                  value={draft.hq[id].hp}
                  onChange={(event) => {
                    const hq = draft.hq.map((side, index) =>
                      index === id ? { ...side, hp: num(event.target.value, side.hp) } : side,
                    ) as ScenarioDraft["hq"];
                    patch({ hq });
                  }}
                />
              </label>
              <label>
                HQ max
                <input
                  type="number"
                  value={draft.hq[id].max}
                  onChange={(event) => {
                    const hq = draft.hq.map((side, index) =>
                      index === id ? { ...side, max: num(event.target.value, side.max) } : side,
                    ) as ScenarioDraft["hq"];
                    patch({ hq });
                  }}
                />
              </label>
            </div>
          ))}
        </section>
        <UnitEditor
          units={draft.units}
          onChange={(units) => patch({ units })}
        />
        <section>
          <h2>Bàn</h2>
          <label>
            Unit để đặt
            <select value={placeId} onChange={(event) => setPlaceId(num(event.target.value, placeId))}>
              {choices.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.id} {unit.name}
                </option>
              ))}
            </select>
          </label>
          <div className="studio-board">
            {Array.from({ length: ROWS }, (_, row) =>
              Array.from({ length: COLS }, (_, col) => {
                const unit = draft.board.find((item) => item.col === col && item.row === row);
                const name = unit ? choices.find((item) => item.id === unit.defId)?.name ?? unit.defId : "";
                return (
                  <button
                    key={`${col}-${row}`}
                    type="button"
                    className={selectedCell?.col === col && selectedCell.row === row ? "studio-cell on" : "studio-cell"}
                    onClick={() => {
                      setSelectedCell({ col, row });
                      if (unit) return;
                      const owner: PlayerId = col >= 2 ? 1 : 0;
                      patch({ board: [...draft.board, { defId: placeId, owner, col, row }] });
                    }}
                  >
                    {COL_NAME[col]}
                    <br />
                    L{row + 1}
                    <br />
                    {name}
                  </button>
                );
              }),
            )}
          </div>
          <button
            type="button"
            disabled={!selectedCell}
            onClick={() => {
              if (!selectedCell) return;
              const owner: PlayerId = selectedCell.col >= 2 ? 1 : 0;
              const next = draft.board.filter(
                (item) => !(item.col === selectedCell.col && item.row === selectedCell.row),
              );
              patch({
                board: [...next, { defId: placeId, owner, col: selectedCell.col, row: selectedCell.row }],
              });
            }}
          >
            Đặt unit lên ô đang chọn
          </button>
          {placed ? (
            <PlacedEditor
              placed={placed}
              choices={choices}
              onChange={(next) =>
                patch({
                  board: draft.board.map((unit) =>
                    unit.col === placed.col && unit.row === placed.row ? next : unit,
                  ),
                })
              }
              onRemove={() =>
                patch({
                  board: draft.board.filter((unit) => !(unit.col === placed.col && unit.row === placed.row)),
                })
              }
            />
          ) : (
            <p className="studio-note">Bấm ô để đặt unit đang chọn. Bấm lại để đổi unit trên ô đó.</p>
          )}
        </section>
        <ReserveEditor
          title="Reserve"
          sides={draft.reserve}
          choices={choices}
          onChange={(reserve) => patch({ reserve })}
        />
        <CardListEditor
          title="Bài trên tay"
          cards={draft.hand}
          choices={choices}
          onChange={(hand) => patch({ hand })}
        />
        <CardListEditor
          title="Deck (thứ tự rút)"
          cards={draft.deck}
          choices={choices}
          onChange={(deck) => patch({ deck })}
        />
        {unitError ? <p className="studio-error">{unitError}</p> : null}
      </aside>
      <div className="studio-stage">
        {recording ? (
          <div className="studio-banner">
            Đang ghi {recording === "bot" ? "nước của bot" : "nước của người chơi"}
          </div>
        ) : null}
        {match ? (
          <MatchView
            match={match}
            you={you}
            vsAi={recording !== "bot" && match.currentPlayer === 1}
            waitingForCombatAck={false}
            actionError={error}
            onAction={sendAction}
            onClearError={() => {
              setError(null);
              failRef.current = null;
            }}
            onExit={() => undefined}
            onRetry={restart}
            onTutorialHud={setHud}
          />
        ) : (
          <p className="studio-error">{error ?? "Chưa có trận."}</p>
        )}
        {hint ? (
          <TutorialSpotlight
            hint={hint}
            onNext={
              hint.next
                ? () => setDismissed((prev) => new Set(prev).add(hint.id))
                : undefined
            }
          />
        ) : null}
      </div>
      <aside className="studio-side right">
        <div className="studio-row">
          <button type="button" className={mode === "free" ? "primary" : ""} onClick={() => setMode("free")}>
            Tự do
          </button>
          <button type="button" className={mode === "lesson" ? "primary" : ""} onClick={() => setMode("lesson")}>
            Lesson
          </button>
          <button type="button" onClick={restart}>
            Restart
          </button>
        </div>
        <div className="studio-row">
          <button
            type="button"
            className={recording === "player" ? "primary" : ""}
            onClick={() => setRecording((value) => (value === "player" ? null : "player"))}
          >
            Ghi người chơi
          </button>
          <button
            type="button"
            className={recording === "bot" ? "primary" : ""}
            onClick={() => setRecording((value) => (value === "bot" ? null : "bot"))}
          >
            Ghi bot
          </button>
        </div>
        <p className="studio-note">
          Ghi bot: bạn cầm ghế đối thủ, script tạm dừng. Ghi người chơi: bot vẫn tự đi các beat đã có.
          Combat bấm tiếp như trận thường, không thành beat.
        </p>
        <section>
          <h2>Beat</h2>
          <ol className="studio-list">
            {draft.beats.map((item, index) => (
              <li
                key={item.id}
                className={`studio-beat${index === selectedBeat ? " current" : ""}${match && beatSettled(match, item) ? " done" : ""}`}
                draggable
                onDragStart={() => {
                  selectedDrag.current = index;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (selectedDrag.current == null) return;
                  moveBeat(selectedDrag.current, index);
                  selectedDrag.current = null;
                }}
                onClick={() => setSelectedBeat(index)}
              >
                <small>{item.actor === 0 ? "P1" : "Bot"}</small>
                <span>{item.label}</span>
                <span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); moveBeat(index, index - 1); }}>
                    ↑
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); moveBeat(index, index + 1); }}>
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <div className="studio-row">
            <button
              type="button"
              onClick={() => {
                const created: Beat = {
                  id: nextBeatId(draft.beats),
                  label: "End deployment",
                  actor: 0,
                  action: { type: "endDeployment" },
                  done: { type: "phase", phase: "maneuver" },
                  block: "Follow the steps in the coach panel.",
                  hint: { anchor: "hourglass", title: "Press the hourglass", body: "End deployment." },
                };
                patch({ beats: [...draft.beats, created] });
                setSelectedBeat(draft.beats.length);
              }}
            >
              Thêm beat
            </button>
            {beat ? (
              <button
                type="button"
                onClick={() => {
                  patch({ beats: draft.beats.filter((_, index) => index !== selectedBeat) });
                  setSelectedBeat(Math.max(0, selectedBeat - 1));
                }}
              >
                Xóa
              </button>
            ) : null}
          </div>
        </section>
        {beat ? (
          <BeatEditor
            beat={beat}
            choices={choices}
            onChange={(partial) => updateBeat(selectedBeat, partial)}
          />
        ) : null}
        <button
          type="button"
          className="primary"
          onClick={() => {
            try {
              setPack(emitLessonPack(draft));
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Không sinh được code");
            }
          }}
        >
          Sinh code
        </button>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Xóa scenario đang soạn?")) return;
            const fresh = emptyDraft();
            setDraft(fresh);
            setHubKw("");
            setSelectedBeat(0);
          }}
        >
          Mới
        </button>
        {error ? <p className="studio-error">{error}</p> : null}
      </aside>
      {pack ? <GenerateDialog pack={pack} onClose={() => setPack(null)} /> : null}
    </div>
  );
}

const selectedDrag = { current: null as number | null };

function GenerateDialog({ pack, onClose }: { pack: LessonPack; onClose: () => void }) {
  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }
  return (
    <div className="studio-modal">
      <div className="studio-modal-card">
        <h2>Dán vào game</h2>
        <p className="studio-note">{pack.guide}</p>
        <label>
          tutorialUnits.ts
          <textarea readOnly value={pack.units} />
        </label>
        <button type="button" onClick={() => void copy(pack.units)}>Copy units</button>
        <label>
          lessons.ts
          <textarea readOnly rows={16} value={pack.lesson} />
        </label>
        <button type="button" onClick={() => void copy(pack.lesson)}>Copy lesson</button>
        <label>
          lessons.test.ts
          <textarea readOnly rows={3} value={pack.test} />
        </label>
        <button type="button" onClick={() => void copy(pack.test)}>Copy test hint</button>
        <button type="button" className="primary" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}

function UnitEditor({
  units,
  onChange,
}: {
  units: CustomUnitDraft[];
  onChange: (units: CustomUnitDraft[]) => void;
}) {
  return (
    <section>
      <h2>Custom unit</h2>
      <p className="studio-note">Id từ 201. Stat in trên def — reserve và bài lấy stat này. Art alias là id unit catalog.</p>
      {units.map((unit, index) => (
        <div key={unit.id} className="studio-check">
          <div className="studio-row">
            <label>
              Id
              <input
                type="number"
                value={unit.id}
                onChange={(event) => updateUnit(index, { id: num(event.target.value, unit.id) })}
              />
            </label>
            <label>
              Tên
              <input value={unit.name} onChange={(event) => updateUnit(index, { name: event.target.value })} />
            </label>
            <label>
              Class
              <select
                value={unit.class}
                onChange={(event) => updateUnit(index, { class: event.target.value as UnitClass })}
              >
                {CLASSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="studio-row">
            {(["hp", "atk", "armor", "ap", "cost"] as const).map((stat) => (
              <label key={stat}>
                {stat}
                <input
                  type="number"
                  value={unit[stat]}
                  onChange={(event) => updateUnit(index, { [stat]: num(event.target.value, unit[stat]) })}
                />
              </label>
            ))}
          </div>
          <label>
            Keywords
            <input
              value={unit.keywordText}
              onChange={(event) => updateUnit(index, { keywordText: event.target.value })}
            />
          </label>
          <label>
            Art alias id
            <input
              type="number"
              value={unit.artAliasId ?? ""}
              onChange={(event) => {
                const raw = event.target.value.trim();
                updateUnit(index, { artAliasId: raw === "" ? undefined : num(raw, unit.artAliasId ?? 1) });
              }}
            />
          </label>
          <label>
            Bài (catalog)
            <select
              multiple
              size={6}
              value={unit.cardTemplateIds}
              onChange={(event) => {
                const cardTemplateIds = [...event.target.selectedOptions].map((option) => option.value);
                updateUnit(index, { cardTemplateIds });
              }}
            >
              {CARD_KEYS.map((key) => {
                const card = getCard(key);
                return (
                  <option key={key} value={key}>
                    {card.name} · {card.templateId} · {card.cost}
                  </option>
                );
              })}
            </select>
          </label>
          <button type="button" onClick={() => onChange(units.filter((_, i) => i !== index))}>
            Xóa unit
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          const id = Math.max(200, ...units.map((unit) => unit.id)) + 1;
          onChange([
            ...units,
            {
              id,
              name: "Custom",
              class: "Robot",
              hp: 6,
              atk: 2,
              armor: 0,
              ap: 0,
              cost: 2,
              keywordText: "",
              cardTemplateIds: [],
            },
          ]);
        }}
      >
        Thêm custom unit
      </button>
    </section>
  );

  function updateUnit(index: number, partial: Partial<CustomUnitDraft>) {
    onChange(units.map((unit, i) => (i === index ? { ...unit, ...partial } : unit)));
  }
}

function PlacedEditor({
  placed,
  choices,
  onChange,
  onRemove,
}: {
  placed: PlacedUnitDraft;
  choices: { id: number; name: string }[];
  onChange: (placed: PlacedUnitDraft) => void;
  onRemove: () => void;
}) {
  return (
    <div className="studio-check">
      <div className="studio-row">
        <label>
          Unit
          <select
            value={placed.defId}
            onChange={(event) => onChange({ ...placed, defId: num(event.target.value, placed.defId) })}
          >
            {choices.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Owner
          <select
            value={placed.owner}
            onChange={(event) => onChange({ ...placed, owner: num(event.target.value, placed.owner) as PlayerId })}
          >
            <option value={0}>P1</option>
            <option value={1}>Bot</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={!!placed.rested}
            onChange={(event) => onChange({ ...placed, rested: event.target.checked })}
          />
          Rested
        </label>
      </div>
      <div className="studio-row">
        {(["hp", "atk", "armor", "ap"] as const).map((stat) => (
          <label key={stat}>
            {stat}
            <input
              type="number"
              value={placed[stat] ?? ""}
              placeholder="in"
              onChange={(event) => {
                const raw = event.target.value.trim();
                onChange({ ...placed, [stat]: raw === "" ? undefined : num(raw, placed[stat] ?? 0) });
              }}
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={onRemove}>
        Xóa khỏi bàn
      </button>
    </div>
  );
}

function ReserveEditor({
  title,
  sides,
  choices,
  onChange,
}: {
  title: string;
  sides: [number[], number[]];
  choices: { id: number; name: string }[];
  onChange: (sides: [number[], number[]]) => void;
}) {
  const [pick, setPick] = useState(choices[0]?.id ?? 1);
  return (
    <section>
      <h2>{title}</h2>
      {([0, 1] as const).map((player) => (
        <div key={player}>
          <p className="studio-note">{player === 0 ? "P1" : "Bot"}</p>
          <ul className="studio-list">
            {sides[player].map((id, index) => (
              <li key={`${id}-${index}`}>
                {choices.find((unit) => unit.id === id)?.name ?? id}
                <button
                  type="button"
                  onClick={() => {
                    const next = sides.map((side) => [...side]) as [number[], number[]];
                    next[player].splice(index, 1);
                    onChange(next);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="studio-row">
        <select value={pick} onChange={(event) => setPick(num(event.target.value, pick))}>
          {choices.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onChange([[...sides[0], pick], sides[1]])}
        >
          + P1
        </button>
        <button
          type="button"
          onClick={() => onChange([sides[0], [...sides[1], pick]])}
        >
          + Bot
        </button>
      </div>
    </section>
  );
}

function CardListEditor({
  title,
  cards,
  choices,
  onChange,
}: {
  title: string;
  cards: ScenarioDraft["hand"];
  choices: { id: number; name: string }[];
  onChange: (cards: ScenarioDraft["hand"]) => void;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <ul className="studio-list">
        {cards.map((card, index) => {
          const options = cardsFor(card.ownerDefId);
          return (
            <li key={`${card.templateId}-${index}`} className="studio-row">
              <select
                value={card.player}
                onChange={(event) => {
                  const next = [...cards];
                  next[index] = { ...card, player: num(event.target.value, card.player) as PlayerId };
                  onChange(next);
                }}
              >
                <option value={0}>P1</option>
                <option value={1}>Bot</option>
              </select>
              <select
                value={card.ownerDefId}
                onChange={(event) => {
                  const ownerDefId = num(event.target.value, card.ownerDefId);
                  const first = cardsFor(ownerDefId)[0]?.templateId ?? card.templateId;
                  const next = [...cards];
                  next[index] = { ...card, ownerDefId, templateId: first };
                  onChange(next);
                }}
              >
                {choices.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <select
                value={card.templateId}
                onChange={(event) => {
                  const next = [...cards];
                  next[index] = { ...card, templateId: event.target.value };
                  onChange(next);
                }}
              >
                {options.map((option) => (
                  <option key={option.templateId} value={option.templateId}>
                    {option.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange(cards.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => {
          const ownerDefId = choices[0]?.id ?? 1;
          const templateId = cardsFor(ownerDefId)[0]?.templateId;
          if (!templateId) return;
          onChange([...cards, { player: 0, ownerDefId, templateId }]);
        }}
      >
        Thêm bài
      </button>
    </section>
  );
}

function BeatEditor({
  beat,
  choices,
  onChange,
}: {
  beat: Beat;
  choices: { id: number; name: string }[];
  onChange: (partial: Partial<Beat>) => void;
}) {
  const checks = checksOf(beat.done);
  return (
    <section>
      <h2>Sửa beat</h2>
      <div className="studio-row">
        <label>
          Ai
          <select
            value={beat.actor}
            onChange={(event) => onChange({ actor: num(event.target.value, beat.actor) as PlayerId })}
          >
            <option value={0}>P1</option>
            <option value={1}>Bot</option>
          </select>
        </label>
        <label>
          Label
          <input value={beat.label} onChange={(event) => onChange({ label: event.target.value })} />
        </label>
      </div>
      <label>
        Câu chặn
        <input value={beat.block} onChange={(event) => onChange({ block: event.target.value })} />
      </label>
      <label>
        Hành động
        <select
          value={beat.action.type}
          onChange={(event) => onChange({ action: blankAction(event.target.value as BeatAction["type"]) })}
        >
          <option value="deploy">deploy</option>
          <option value="playCard">playCard</option>
          <option value="discardRedraw">discardRedraw</option>
          <option value="endDeployment">endDeployment</option>
          <option value="endManeuver">endManeuver</option>
        </select>
      </label>
      <ActionFields
        action={beat.action}
        choices={choices}
        onChange={(action) => onChange({ action })}
      />
      <h2>Xong khi</h2>
      {checks.map((check, index) => (
        <CheckFields
          key={index}
          check={check}
          choices={choices}
          onChange={(next) => {
            const copy = [...checks];
            copy[index] = next;
            onChange({ done: packChecks(copy) });
          }}
          onRemove={() => {
            const copy = checks.filter((_, i) => i !== index);
            onChange({ done: packChecks(copy.length ? copy : [blankCheck()]) });
          }}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange({ done: packChecks([...checks, blankCheck()]) })}
      >
        Thêm điều kiện
      </button>
      <h2>Spotlight</h2>
      <label>
        Anchor
        <input
          value={beat.hint?.anchor ?? ""}
          onChange={(event) =>
            onChange({
              hint: {
                anchor: event.target.value,
                title: beat.hint?.title ?? beat.label,
                body: beat.hint?.body ?? "",
                next: beat.hint?.next,
              },
            })
          }
        />
      </label>
      <label>
        Title
        <input
          value={beat.hint?.title ?? ""}
          onChange={(event) =>
            onChange({
              hint: {
                anchor: beat.hint?.anchor ?? "hourglass",
                title: event.target.value,
                body: beat.hint?.body ?? "",
                next: beat.hint?.next,
              },
            })
          }
        />
      </label>
      <label>
        Body
        <textarea
          rows={2}
          value={beat.hint?.body ?? ""}
          onChange={(event) =>
            onChange({
              hint: {
                anchor: beat.hint?.anchor ?? "hourglass",
                title: beat.hint?.title ?? beat.label,
                body: event.target.value,
                next: beat.hint?.next,
              },
            })
          }
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!beat.hint?.next}
          onChange={(event) =>
            onChange({
              hint: {
                anchor: beat.hint?.anchor ?? "hourglass",
                title: beat.hint?.title ?? beat.label,
                body: beat.hint?.body ?? "",
                next: event.target.checked,
              },
            })
          }
        />
        Nút Next (bot chờ đến khi bấm)
      </label>
    </section>
  );
}

function ActionFields({
  action,
  choices,
  onChange,
}: {
  action: BeatAction;
  choices: { id: number; name: string }[];
  onChange: (action: BeatAction) => void;
}) {
  if (action.type === "deploy") {
    return (
      <div className="studio-row">
        <label>
          Unit
          <select
            value={action.unitDefId}
            onChange={(event) => onChange({ ...action, unitDefId: num(event.target.value, action.unitDefId) })}
          >
            {choices.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lane
          <input
            type="number"
            min={1}
            max={4}
            value={action.row + 1}
            onChange={(event) => onChange({ ...action, row: num(event.target.value, action.row + 1) - 1 })}
          />
        </label>
      </div>
    );
  }
  if (action.type === "playCard" || action.type === "discardRedraw") {
    return (
      <div className="studio-row">
        <label>
          Template
          <input
            value={action.templateId}
            onChange={(event) => onChange({ ...action, templateId: event.target.value })}
          />
        </label>
        <label>
          Owner unit id
          <input
            type="number"
            value={action.ownerUnitId ?? ""}
            onChange={(event) => {
              const raw = event.target.value.trim();
              onChange({
                ...action,
                ownerUnitId: raw === "" ? undefined : num(raw, action.ownerUnitId ?? 0),
              });
            }}
          />
        </label>
        {action.type === "playCard" ? (
          <TargetFields targets={action.targets} choices={choices} onChange={(targets) => onChange({ ...action, targets })} />
        ) : null}
      </div>
    );
  }
  return null;
}

function TargetFields({
  targets,
  choices,
  onChange,
}: {
  targets: BeatTargets;
  choices: { id: number; name: string }[];
  onChange: (targets: BeatTargets) => void;
}) {
  const unit = targets.units?.[0];
  const cell = targets.cells?.[0];
  return (
    <>
      <label>
        Target unit
        <select
          value={unit ? `${unit.defId}` : ""}
          onChange={(event) => {
            if (!event.target.value) {
              onChange({ ...targets, units: undefined });
              return;
            }
            onChange({
              ...targets,
              units: [{ defId: num(event.target.value, 1), owner: unit?.owner ?? 1, col: unit?.col, row: unit?.row }],
            });
          }}
        >
          <option value="">Không</option>
          {choices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {unit ? (
        <>
          <label>
            Owner
            <select
              value={unit.owner}
              onChange={(event) =>
                onChange({
                  ...targets,
                  units: [{ ...unit, owner: num(event.target.value, unit.owner) as PlayerId }],
                })
              }
            >
              <option value={0}>P1</option>
              <option value={1}>Bot</option>
            </select>
          </label>
          <label>
            Cột
            <input
              type="number"
              value={unit.col ?? ""}
              onChange={(event) => {
                const raw = event.target.value.trim();
                onChange({
                  ...targets,
                  units: [{ ...unit, col: raw === "" ? undefined : num(raw, unit.col ?? 0) }],
                });
              }}
            />
          </label>
          <label>
            Hàng
            <input
              type="number"
              value={unit.row ?? ""}
              onChange={(event) => {
                const raw = event.target.value.trim();
                onChange({
                  ...targets,
                  units: [{ ...unit, row: raw === "" ? undefined : num(raw, unit.row ?? 0) }],
                });
              }}
            />
          </label>
        </>
      ) : null}
      <label>
        Ô col
        <input
          type="number"
          value={cell?.col ?? ""}
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") {
              onChange({ ...targets, cells: undefined });
              return;
            }
            onChange({ ...targets, cells: [{ col: num(raw, 0), row: cell?.row ?? 0 }] });
          }}
        />
      </label>
      <label>
        Ô row
        <input
          type="number"
          value={cell?.row ?? ""}
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") return;
            onChange({ ...targets, cells: [{ col: cell?.col ?? 0, row: num(raw, 0) }] });
          }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!targets.hq}
          onChange={(event) => onChange({ ...targets, hq: event.target.checked || undefined })}
        />
        HQ
      </label>
      <label>
        Hướng
        <select
          value={targets.directions?.[0] ?? ""}
          onChange={(event) =>
            onChange({
              ...targets,
              directions: event.target.value ? [event.target.value as Direction] : undefined,
            })
          }
        >
          <option value="">Không</option>
          {DIRECTIONS.map((dir) => (
            <option key={dir}>{dir}</option>
          ))}
        </select>
      </label>
      <label>
        Initiative
        <select
          value={targets.choice ?? ""}
          onChange={(event) =>
            onChange({
              ...targets,
              choice: event.target.value ? (event.target.value as InitiativeChoice) : undefined,
            })
          }
        >
          <option value="">Không</option>
          {CHOICES.map((choice) => (
            <option key={choice}>{choice}</option>
          ))}
        </select>
      </label>
    </>
  );
}

function CheckFields({
  check,
  choices,
  onChange,
  onRemove,
}: {
  check: DoneCheck;
  choices: { id: number; name: string }[];
  onChange: (check: DoneCheck) => void;
  onRemove: () => void;
}) {
  return (
    <div className="studio-check">
      <div className="studio-row">
        <label>
          Loại
          <select
            value={check.type}
            onChange={(event) => onChange(defaultCheck(event.target.value as DoneCheck["type"]))}
          >
            <option value="unitOn">unit trên bàn</option>
            <option value="unitGone">unit rời bàn</option>
            <option value="hpAtMost">HP unit ≤</option>
            <option value="hqAtMost">HQ ≤</option>
            <option value="discarded">bài vào discard</option>
            <option value="phase">phase</option>
          </select>
        </label>
        <button type="button" onClick={onRemove}>
          ×
        </button>
      </div>
      {check.type === "phase" ? (
        <select value={check.phase} onChange={(event) => onChange({ ...check, phase: event.target.value as Phase })}>
          {PHASES.map((phase) => (
            <option key={phase}>{phase}</option>
          ))}
        </select>
      ) : null}
      {check.type === "hqAtMost" ? (
        <div className="studio-row">
          <label>
            Người
            <select
              value={check.player}
              onChange={(event) => onChange({ ...check, player: num(event.target.value, check.player) as PlayerId })}
            >
              <option value={0}>P1</option>
              <option value={1}>Bot</option>
            </select>
          </label>
          <label>
            HP
            <input
              type="number"
              value={check.hp}
              onChange={(event) => onChange({ ...check, hp: num(event.target.value, check.hp) })}
            />
          </label>
        </div>
      ) : null}
      {check.type === "discarded" ? (
        <div className="studio-row">
          <label>
            Người
            <select
              value={check.player}
              onChange={(event) => onChange({ ...check, player: num(event.target.value, check.player) as PlayerId })}
            >
              <option value={0}>P1</option>
              <option value={1}>Bot</option>
            </select>
          </label>
          <label>
            Template
            <input value={check.templateId} onChange={(event) => onChange({ ...check, templateId: event.target.value })} />
          </label>
          <label>
            Số lần
            <input
              type="number"
              value={check.count ?? 1}
              onChange={(event) => onChange({ ...check, count: num(event.target.value, check.count ?? 1) })}
            />
          </label>
        </div>
      ) : null}
      {check.type === "unitOn" || check.type === "unitGone" || check.type === "hpAtMost" ? (
        <div className="studio-row">
          <label>
            Unit
            <select
              value={check.defId}
              onChange={(event) => onChange({ ...check, defId: num(event.target.value, check.defId) })}
            >
              {choices.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner
            <select
              value={check.owner}
              onChange={(event) => onChange({ ...check, owner: num(event.target.value, check.owner) as PlayerId })}
            >
              <option value={0}>P1</option>
              <option value={1}>Bot</option>
            </select>
          </label>
          {check.type === "hpAtMost" ? (
            <label>
              HP
              <input
                type="number"
                value={check.hp}
                onChange={(event) => onChange({ ...check, hp: num(event.target.value, check.hp) })}
              />
            </label>
          ) : null}
          {check.type === "unitOn" ? (
            <>
              <label>
                Cột
                <input
                  type="number"
                  value={check.col ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    onChange({ ...check, col: raw === "" ? undefined : num(raw, check.col ?? 0) });
                  }}
                />
              </label>
              <label>
                Hàng
                <input
                  type="number"
                  value={check.row ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    onChange({ ...check, row: raw === "" ? undefined : num(raw, check.row ?? 0) });
                  }}
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function defaultCheck(type: DoneCheck["type"]): DoneCheck {
  if (type === "unitOn") return { type, defId: 1, owner: 0, col: 0, row: 0 };
  if (type === "unitGone") return { type, defId: 1, owner: 1 };
  if (type === "hpAtMost") return { type, defId: 1, owner: 1, hp: 0 };
  if (type === "hqAtMost") return { type, player: 1, hp: 0 };
  if (type === "discarded") return { type, player: 0, templateId: "forward", count: 1 };
  if (type === "phase") return { type, phase: "deployment" };
  return { type: "and", checks: [] };
}
