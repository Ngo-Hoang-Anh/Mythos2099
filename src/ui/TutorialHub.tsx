import { useState } from "react";
import { keywordTutorial } from "../engine/armySummary";
import {
  BUILD_GUIDE,
  LESSONS,
  TUTORIAL_HUB,
  loadCompletedLessons,
  type HubLessonCard,
  type HubSection,
  type TutorialId,
} from "../tutorial";
import { KeywordChip, KeywordIcon, StatIcon } from "./icons";
import { KitMark, SgIconImg } from "./UiChrome";

const PLAYABLE_IDS = new Set<string>([
  ...LESSONS.map((l) => l.id),
  BUILD_GUIDE.id,
]);

type HubTab = "tutorial" | "codex";

const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: "tutorial", label: "Tutorial" },
  { id: "codex", label: "Mechanic Codex" },
];

export function TutorialHub({
  onPlay,
  onBack,
  onBattle,
  tab,
  onTabChange,
}: {
  onPlay: (id: TutorialId) => void;
  onBack: () => void;
  onBattle: () => void;
  tab: HubTab;
  onTabChange: (tab: HubTab) => void;
}) {
  const [readyOpen, setReadyOpen] = useState(false);
  const done = loadCompletedLessons();
  const sections =
    tab === "tutorial"
      ? TUTORIAL_HUB.filter((section) => section.id === "basic")
      : TUTORIAL_HUB.filter((section) => section.id !== "basic");
  const realCards = sections
    .flatMap((s) => s.cards)
    .filter((c) => !c.placeholder && !c.cta);
  const totalRealCards = realCards.length;
  const doneCount = realCards.reduce(
    (n: number, card) => n + (cardCompleted(card, done) ? 1 : 0),
    0,
  );
  return (
    <div className="tutorial-hub">
      <header className="builder-hero">
        <p className="eyebrow">Training</p>
        <h1>{tab === "tutorial" ? "Tutorial" : "Mechanic Codex"}</h1>
        <p>
          {tab === "tutorial"
            ? "Sandbox lessons teach the rules. Some lessons use a short scripted enemy opening to set up the scenario. Finish lessons in order — locked ones unlock after the previous lesson."
            : "Keywords, special units, and playstyle sandboxes. Guides stay locked until the previous one is finished, including the last Basics lesson."}
        </p>
        <div
          className="picker-tabs tutorial-tabs"
          role="tablist"
          aria-label="Training sections">
          {HUB_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`${tab === item.id ? "primary" : "ghost"} kit-btn-row`}
              onClick={() => onTabChange(item.id)}>
              <KitMark file={item.id === "tutorial" ? "info.png" : "faq.png"} />
              {item.label}
            </button>
          ))}
        </div>
        <div
          className="builder-army-meter"
          aria-label={`${doneCount} of ${totalRealCards} lessons complete`}>
          <div className="sg-progress">
            {Array.from({ length: totalRealCards }, (_, i) => (
              <i
                key={i}
                className={i < doneCount ? "on" : ""}
              />
            ))}
          </div>
        </div>
      </header>
      {sections.map((section) => {
        const sIdx = TUTORIAL_HUB.findIndex((s) => s.id === section.id);
        return (
          <section
            key={section.id}
            className={`tutorial-section section-${section.id}`}>
            <div className="tutorial-section-header">
              <p className="eyebrow">{section.eyebrow}</p>
              <h2>{section.title}</h2>
              {section.intro ? (
                <p className="section-intro">{section.intro}</p>
              ) : null}
            </div>
            <div className="tutorial-grid">
              {section.cards.map((card, idx) => {
                const locked = isCardLocked(TUTORIAL_HUB, sIdx, idx, done);
                return (
                  <HubCard
                    key={card.id}
                    card={card}
                    index={idx}
                    done={done}
                    onPlay={onPlay}
                    onReady={() => setReadyOpen(true)}
                    locked={locked}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
      {tab === "codex" ? (
        <p
          className="muted"
          style={{ marginTop: "0.75rem" }}>
          Basics ends with Build an army. Codex covers keywords, special units,
          and playstyles.
        </p>
      ) : null}
      {readyOpen ? (
        <div className="choice-modal" onClick={() => setReadyOpen(false)}>
          <div
            className="choice-dialog kit-window"
            role="dialog"
            aria-label="To battle or to library?"
            onClick={(event) => event.stopPropagation()}>
            <h2>To battle or to library?</h2>
            <div className="choice-options kit-table">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setReadyOpen(false);
                  onBattle();
                }}>
                To Battle
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setReadyOpen(false);
                  onTabChange("codex");
                }}>
                To Library
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <footer className="builder-footer">
        <button
          type="button"
          className="ghost sg-btn-row"
          onClick={onBack}>
          <KitMark file="backward.png" />
          Back
        </button>
      </footer>
    </div>
  );
}

function cardCompleted(
  card: HubLessonCard,
  done: ReturnType<typeof loadCompletedLessons>,
): boolean {
  if (card.placeholder) return false;
  if (!PLAYABLE_IDS.has(card.id)) return false;
  return done.has(card.id as TutorialId);
}

function chainCard(card: HubLessonCard): boolean {
  return !card.placeholder && !card.cta;
}

/** Previous real lesson. CTA cards are skipped so they do not lock the Codex. */
function previousChainCard(
  hub: readonly HubSection[],
  sIdx: number,
  idx: number,
): HubLessonCard | null {
  const section = hub[sIdx]!;
  for (let i = idx - 1; i >= 0; i--) {
    const card = section.cards[i]!;
    if (chainCard(card)) return card;
  }
  for (let s = sIdx - 1; s >= 0; s--) {
    const cards = hub[s]!.cards;
    for (let i = cards.length - 1; i >= 0; i--) {
      const card = cards[i]!;
      if (chainCard(card)) return card;
    }
  }
  return null;
}

function isCardLocked(
  hub: readonly HubSection[],
  sIdx: number,
  idx: number,
  done: ReturnType<typeof loadCompletedLessons>,
): boolean {
  const card = hub[sIdx]!.cards[idx]!;
  if (card.placeholder) return false;
  const prev = previousChainCard(hub, sIdx, idx);
  if (!prev) return false;
  return !cardCompleted(prev, done);
}

function HubCard({
  card,
  index,
  done,
  onPlay,
  onReady,
  locked,
}: {
  card: HubLessonCard;
  index: number;
  done: ReturnType<typeof loadCompletedLessons>;
  onPlay: (id: TutorialId) => void;
  onReady: () => void;
  locked: boolean;
}) {
  const isRealLesson = !card.placeholder && PLAYABLE_IDS.has(card.id);
  const completed = cardCompleted(card, done);
  // Completed lessons stay playable (replay) even if the unlock chain is broken.
  const blocked = card.placeholder || (locked && !completed) || (!isRealLesson && !card.cta);
  const onClick = () => {
    if (blocked) return;
    if (card.cta) onReady();
    else onPlay(card.id as TutorialId);
  };
  return (
    <button
      type="button"
      className={`tutorial-card ${card.cta ? "basic-complete-card tutorial-card-cta" : ""} ${completed ? "done" : ""} ${card.placeholder ? "placeholder" : ""} ${locked && !completed ? "locked" : ""}`}
      onClick={onClick}
      disabled={blocked}
      aria-disabled={blocked}>
      <span className="tutorial-num">
        {card.number != null
          ? String(card.number).padStart(2, "0")
          : indexToLabel(index)}
      </span>
      <div className="tutorial-card-body">
        <div className="tutorial-card-title-row">
          <strong>{card.title}</strong>
          {isRealLesson && completed ? (
            <em className="tutorial-check">
              <SgIconImg
                name="check"
                tone="gold"
                size={18}
              />
              <span>Done</span>
            </em>
          ) : card.placeholder || (!isRealLesson && !card.cta) ? (
            <em className="tutorial-check placeholder-tag">
              <SgIconImg
                name="lock"
                tone="cyan"
                size={16}
              />
              <span>
                Coming
                <br />
                soon
              </span>
            </em>
          ) : locked ? (
            <em className="tutorial-check placeholder-tag">
              <SgIconImg
                name="lock"
                tone="cyan"
                size={16}
              />
              <span>
                Complete
                <br />
                previous
              </span>
            </em>
          ) : null}
        </div>
        <span>{card.subtitle}</span>
        {card.hubStats.length > 0 || card.keywords.length > 0 ? (
          <div
            className="tutorial-icons"
            aria-hidden>
            {card.hubStats.map((stat) => (
              <StatIcon
                key={stat}
                name={stat}
                size={22}
              />
            ))}
            {card.keywords.map((keyword) => (
              <KeywordIcon
                key={keyword.name}
                name={keyword.name}
                size={22}
              />
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function indexToLabel(i: number): string {
  if (i < 26) return `${i + 1}`;
  return "•";
}

export function TutorialKeywords({
  keywords,
}: {
  keywords: import("../engine/types").Keyword[];
}) {
  if (keywords.length === 0) return null;
  return (
    <div className="tut-kw-list">
      {keywords.map((keyword) => {
        const { title, body } = keywordTutorial(keyword);
        return (
          <div
            key={`${keyword.name}-${keyword.value}`}
            className="tut-kw">
            <KeywordChip
              keyword={keyword}
              size={28}
            />
            <div>
              <b>{title}</b>
              <p>{body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
