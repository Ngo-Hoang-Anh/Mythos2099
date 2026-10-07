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
import { SgIconImg } from "./UiChrome";

const PLAYABLE_IDS = new Set<string>([
  ...LESSONS.map((l) => l.id),
  BUILD_GUIDE.id,
]);

export function TutorialHub({
  onPlay,
  onBack,
}: {
  onPlay: (id: TutorialId) => void;
  onBack: () => void;
}) {
  const done = loadCompletedLessons();
  const realCards = TUTORIAL_HUB.flatMap((s) => s.cards).filter(
    (c) => !c.placeholder,
  );
  const totalRealCards = realCards.length;
  const doneCount = realCards.reduce(
    (n: number, card) => n + (cardCompleted(card, done) ? 1 : 0),
    0,
  );
  return (
    <div className="tutorial-hub">
      <header className="builder-hero">
        <p className="eyebrow">Training</p>
        <h1>Tutorial</h1>
        <p>
          Sandbox lessons teach the rules. Some lessons use a short scripted
          enemy opening to set up the scenario. Finish lessons in order — locked
          ones unlock after the previous lesson.
        </p>
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
      {TUTORIAL_HUB.map((section, sIdx) => (
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
                  locked={locked}
                />
              );
            })}
          </div>
        </section>
      ))}
      <p
        className="muted"
        style={{ marginTop: "0.75rem" }}>
        Sandbox lessons teach the rules; the Build Your Army walkthrough is the
        army builder.
      </p>
      <footer className="builder-footer">
        <button
          type="button"
          className="ghost sg-btn-row"
          onClick={onBack}>
          <SgIconImg
            name="back"
            tone="cyan"
            size={20}
          />
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

function isCardLocked(
  hub: readonly HubSection[],
  sIdx: number,
  idx: number,
  done: ReturnType<typeof loadCompletedLessons>,
): boolean {
  const section = hub[sIdx]!;
  const card = section.cards[idx];
  if (card.placeholder) return false;

  if (idx > 0) {
    const prev = section.cards[idx - 1]!;
    if (prev.placeholder) return false;
    if (!cardCompleted(prev, done)) return true;
    return false;
  }

  if (sIdx === 0) return false;

  let prevS = sIdx - 1;
  while (prevS >= 0 && hub[prevS]!.cards.length === 0) prevS--;
  if (prevS < 0) return false;
  const prevCards = hub[prevS]!.cards;
  for (let i = prevCards.length - 1; i >= 0; i--) {
    const c = prevCards[i]!;
    if (!c.placeholder) return !cardCompleted(c, done);
  }
  return false;
}

function HubCard({
  card,
  index,
  done,
  onPlay,
  locked,
}: {
  card: HubLessonCard;
  index: number;
  done: ReturnType<typeof loadCompletedLessons>;
  onPlay: (id: TutorialId) => void;
  locked: boolean;
}) {
  const isRealLesson = !card.placeholder && PLAYABLE_IDS.has(card.id);
  const completed = cardCompleted(card, done);
  // Completed lessons stay playable (replay) even if the unlock chain is broken.
  const blocked = card.placeholder || (locked && !completed) || !isRealLesson;
  const onClick = () => {
    if (blocked) return;
    onPlay(card.id as TutorialId);
  };
  return (
    <button
      type="button"
      className={`tutorial-card ${completed ? "done" : ""} ${card.placeholder ? "placeholder" : ""} ${locked && !completed ? "locked" : ""}`}
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
          ) : card.placeholder || !isRealLesson ? (
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
