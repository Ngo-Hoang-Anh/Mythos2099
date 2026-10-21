import type { TutorialId } from "./lessons";

const KEY = "mythos2099-tutorial-v1";
const TIPS_KEY = "mythos2099-tutorial-tips-v1";

type Stored = { completed?: TutorialId[]; tips?: string[] };

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Stored;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(next: Stored): void {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function loadCompletedLessons(): Set<TutorialId> {
  const completed = read().completed;
  return new Set(Array.isArray(completed) ? completed : []);
}

export function markLessonComplete(id: TutorialId): Set<TutorialId> {
  const stored = read();
  const next = new Set(Array.isArray(stored.completed) ? stored.completed : []);
  next.add(id);
  write({ ...stored, completed: [...next] });
  return next;
}

/** One-shot chrome / intro tips that must not repeat in later lessons. */
export function loadTaughtTips(): Set<string> {
  try {
    const fromMain = read().tips;
    if (Array.isArray(fromMain)) return new Set(fromMain);
    const legacy = localStorage.getItem(TIPS_KEY);
    if (!legacy) return new Set();
    const parsed = JSON.parse(legacy) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markTipTaught(id: string): Set<string> {
  const stored = read();
  const next = loadTaughtTips();
  next.add(id);
  write({ ...stored, tips: [...next] });
  return next;
}

/** Test helper — clears persisted tip state. */
export function resetTaughtTips(): void {
  try {
    const stored = read();
    write({ ...stored, tips: [] });
    localStorage.removeItem(TIPS_KEY);
  } catch {
    /* ignore */
  }
}
