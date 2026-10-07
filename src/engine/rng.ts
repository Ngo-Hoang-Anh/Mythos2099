export function mulberry32State(seed: number): number {
  return seed >>> 0;
}

export function nextRng(state: number): { value: number; state: number } {
  let a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a >>> 0 };
}

export function shuffle<T>(items: T[], rngState: number): { items: T[]; rngState: number } {
  const copy = [...items];
  let state = rngState;
  for (let i = copy.length - 1; i > 0; i--) {
    const step = nextRng(state);
    state = step.state;
    const j = Math.floor(step.value * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return { items: copy, rngState: state };
}
