import { applyAction } from "../engine/match";
import type { Action, ActionResult, MatchState } from "../engine/types";
import { BUILD_GUIDE_ID } from "./buildGuide";
import { LESSONS, type LessonDef, type LessonId, type TutorialId } from "./lessons";

export type LessonResult = ActionResult & { complete: boolean };

export function getLesson(id: string): LessonDef | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function startLesson(id: LessonId): { lesson: LessonDef; match: MatchState } {
  const lesson = getLesson(id);
  if (!lesson) throw new Error(`Unknown lesson ${id}`);
  return { lesson, match: lesson.setup() };
}

export function evaluateSteps(lesson: LessonDef, match: MatchState): boolean[] {
  return lesson.steps.map((step) => step.done(match));
}

export function lessonComplete(lesson: LessonDef, match: MatchState): boolean {
  return lesson.steps.every((step) => step.done(match));
}

export function currentStepIndex(lesson: LessonDef, match: MatchState): number {
  const done = evaluateSteps(lesson, match);
  const idx = done.findIndex((ok) => !ok);
  return idx < 0 ? done.length : idx;
}

export function gateAction(lesson: LessonDef, match: MatchState, action: Action): string | null {
  if (action.type === "endEngagement") return null;
  if (match.currentPlayer !== 0) {
    if (!lesson.scriptedAction) return "This lesson is over.";
    return lesson.allow(match, action);
  }
  if (action.type === "discardRedraw" && lesson.id !== "resources") return "Tutorial: no discard-redraw.";
  return lesson.allow(match, action);
}

export function applyLessonAction(lesson: LessonDef, match: MatchState, action: Action): LessonResult {
  const blocked = gateAction(lesson, match, action);
  if (blocked) return { ok: false, error: blocked, complete: false };
  const result = applyAction(match, action);
  if (!result.ok) return { ...result, complete: false };
  lesson.afterAction?.(result.state, action);
  return { ok: true, state: result.state, complete: lessonComplete(lesson, result.state) };
}

export function tutorialOrder(): TutorialId[] {
  return [...LESSONS.map((lesson) => lesson.id), BUILD_GUIDE_ID];
}

export function nextLessonId(id: LessonId): LessonId | null {
  const idx = LESSONS.findIndex((lesson) => lesson.id === id);
  if (idx < 0 || idx >= LESSONS.length - 1) return null;
  return LESSONS[idx + 1].id;
}

/** Next playable tutorial after `id`. Skips ids already in `done` when provided. */
export function nextTutorialId(
  id: TutorialId,
  done?: ReadonlySet<TutorialId>,
): TutorialId | null {
  const order = tutorialOrder();
  const idx = order.indexOf(id);
  if (idx < 0) return null;
  for (let i = idx + 1; i < order.length; i++) {
    const next = order[i]!;
    if (!done || !done.has(next)) return next;
  }
  return null;
}

/** First incomplete tutorial in curriculum order, or null if all done. */
export function firstIncompleteTutorialId(
  done: ReadonlySet<TutorialId>,
): TutorialId | null {
  for (const id of tutorialOrder()) {
    if (!done.has(id)) return id;
  }
  return null;
}
