import { useEffect, useMemo, useState } from "react";
import type { Action } from "../engine/types";
import {
  applyLessonAction,
  currentStepIndex,
  evaluateSteps,
  lessonComplete,
  markLessonComplete,
  nextTutorialId,
  pickLessonHint,
  startLesson,
  LESSONS,
  type LessonDef,
  type LessonId,
  type TutorialHud,
  type TutorialId,
} from "../tutorial";
import { MatchView } from "./MatchView";
import { TutorialKeywords } from "./TutorialHub";
import { TutorialSpotlight } from "./TutorialSpotlight";
import { SgIconImg } from "./UiChrome";

export function TutorialView({
  lessonId,
  onExit,
  onPlay,
  pointerCardDrag = false,
}: {
  lessonId: LessonId;
  onExit: () => void;
  onPlay: (id: TutorialId) => void;
  /** `/m` only — see MatchView.pointerCardDrag. */
  pointerCardDrag?: boolean;
}) {
  const [{ lesson, match }, setSession] = useState(() => startLesson(lessonId));
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [hud, setHud] = useState<TutorialHud>({ reserveOpen: false, pendingDeploy: null });
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const stepsDone = useMemo(() => evaluateSteps(lesson, match), [lesson, match]);
  const current = currentStepIndex(lesson, match);
  const nextId = nextTutorialId(lesson.id);
  const total = LESSONS.length + 1;
  // While picking card/deploy targets, never cover the board — real green/red reticles must show.
  const hint =
    complete || hud.boardTargeting || hud.pendingDeploy
      ? null
      : pickLessonHint(lesson, match, hud, dismissed);

  useEffect(() => {
    if (complete || match.combatPlayback || hud.animating) return;
    if (!lessonComplete(lesson, match)) return;
    markLessonComplete(lesson.id);
    setComplete(true);
  }, [complete, hud.animating, lesson, match]);

  useEffect(() => {
    if (complete || match.combatPlayback || hud.animating) return;
    if (hint?.next) return;
    const action = lesson.scriptedAction?.(match);
    if (!action) return;
    const timer = window.setTimeout(() => {
      const result = applyLessonAction(lesson, match, action);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setSession({ lesson, match: result.state });
    }, 750);
    return () => window.clearTimeout(timer);
  }, [complete, hint?.next, hud.animating, lesson, match]);

  function restart() {
    setSession(startLesson(lesson.id));
    setError(null);
    setComplete(false);
    setHud({ reserveOpen: false, pendingDeploy: null });
    setDismissed(new Set());
  }

  function sendAction(action: Action) {
    const result = applyLessonAction(lesson, match, action);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSession({ lesson, match: result.state });
  }

  return (
    <div className="tutorial-shell">
      <aside className="tutorial-coach">
        <p className="eyebrow">
          Lesson {String(lesson.number).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h1>{lesson.title}</h1>
        <p className="tutorial-sub">{lesson.subtitle}</p>
        {lesson.formula ? <p className="tutorial-formula">{lesson.formula}</p> : null}
        {lesson.coach.map((para) => (
          <p key={para}>{para}</p>
        ))}
        <TutorialKeywords keywords={lesson.keywords} />
        <ol className="tutorial-steps">
          {lesson.steps.map((step, index) => (
            <li
              key={step.id}
              className={stepsDone[index] ? "done" : index === current ? "current" : ""}
            >
              {step.label}
            </li>
          ))}
        </ol>
        <div className="tutorial-coach-actions">
          <button type="button" className="ghost sg-btn-row" onClick={restart}>
            <SgIconImg name="rewind" tone="cyan" size={20} />
            Restart
          </button>
          <button type="button" className="ghost sg-btn-row" onClick={onExit}>
            <SgIconImg name="home" tone="gold" size={20} />
            Lessons
          </button>
        </div>
      </aside>
      <div className="tutorial-stage">
        <MatchView
          match={match}
          you={0}
          vsAi={match.currentPlayer === 1}
          waitingForCombatAck={false}
          actionError={error}
          onAction={sendAction}
          onClearError={() => setError(null)}
          onExit={onExit}
          onRetry={restart}
          onTutorialHud={setHud}
          pointerCardDrag={pointerCardDrag}
        />
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
      {complete && !hud.animating ? (
        <CompleteOverlay
          lesson={lesson}
          nextId={nextId}
          onRestart={restart}
          onHub={onExit}
          onNext={nextId ? () => onPlay(nextId) : undefined}
        />
      ) : null}
    </div>
  );
}

function CompleteOverlay({
  lesson,
  nextId,
  onRestart,
  onHub,
  onNext,
}: {
  lesson: LessonDef;
  nextId: TutorialId | null;
  onRestart: () => void;
  onHub: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="tutorial-complete">
      <div className="choice-dialog kit-window" role="dialog" aria-label="Lesson complete">
        <p className="eyebrow">Lesson complete</p>
        <h2>{lesson.title}</h2>
        <p>{lesson.success}</p>
        <div className="choice-options kit-table">
          {onNext && nextId ? (
            <button type="button" className="primary sg-btn-row" onClick={onNext}>
              <SgIconImg name="skip" tone="gold" size={20} />
              Next lesson
            </button>
          ) : null}
          <button type="button" className="primary sg-btn-row" onClick={onHub}>
            <SgIconImg name="home" tone="gold" size={20} />
            All lessons
          </button>
          <button type="button" className="ghost sg-btn-row" onClick={onRestart}>
            <SgIconImg name="rewind" tone="cyan" size={20} />
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
