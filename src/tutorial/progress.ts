import type { TutorialId } from "./lessons";

const KEY = "mythos2099-tutorial-v1";

function read(): TutorialId[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { completed?: TutorialId[] };
    return Array.isArray(parsed.completed) ? parsed.completed : [];
  } catch {
    return [];
  }
}

export function loadCompletedLessons(): Set<TutorialId> {
  return new Set(read());
}

export function markLessonComplete(id: TutorialId): Set<TutorialId> {
  const next = new Set(read());
  next.add(id);
  localStorage.setItem(KEY, JSON.stringify({ completed: [...next] }));
  return next;
}
