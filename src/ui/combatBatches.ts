import type { CombatStep } from "../engine/types";

type ShotStep = Extract<CombatStep, { kind: "shot" }>;
type ResultStep = Extract<CombatStep, { kind: "hp" | "hq" | "hqBreakpoint" }>;
type MoveStep = Extract<CombatStep, { kind: "move" }>;
type RestStep = Extract<CombatStep, { kind: "rest" }>;
type StatStep = Extract<CombatStep, { kind: "statAtk" }>;
type DestroyStep = Extract<CombatStep, { kind: "destroy" }>;

export type CombatExchange = {
  shots: ShotStep[];
  results: ResultStep[];
};

/** Consecutive gun volleys (attack + counter) in one lane, with their HP/HQ updates. */
export function takeCombatExchange(steps: CombatStep[], start: number): { exchange: CombatExchange; next: number } | null {
  const first = steps[start];
  if (!first || first.kind !== "shot" || first.side === "missile") return null;

  const shots: ShotStep[] = [];
  const results: ResultStep[] = [];
  let i = start;
  while (i < steps.length) {
    const step = steps[i];
    if (step.kind === "shot" && (step.side === "attack" || step.side === "counter")) {
      shots.push(step);
      i += 1;
      continue;
    }
    if (step.kind === "hp" || step.kind === "hq" || step.kind === "hqBreakpoint") {
      results.push(step);
      i += 1;
      continue;
    }
    break;
  }
  if (shots.length < 2) return null;
  return { exchange: { shots, results }, next: i };
}

export type CombatStrike = {
  shot: ShotStep;
  results: ResultStep[];
};

export type QuickCombatPlan = {
  moves: MoveStep[];
  rests: RestStep[];
  stats: StatStep[];
  guns: CombatStrike[];
  missiles: CombatStrike[];
  destroys: DestroyStep[];
};

/** Flatten a sequential engagement into parallel animation groups. Skips phase/lane/keyword beats. */
export function collectQuickCombat(steps: CombatStep[]): QuickCombatPlan {
  const moves: MoveStep[] = [];
  const rests: RestStep[] = [];
  const stats: StatStep[] = [];
  const guns: CombatStrike[] = [];
  const missiles: CombatStrike[] = [];
  const destroys: DestroyStep[] = [];

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    if (step.kind === "move") {
      moves.push(step);
      continue;
    }
    if (step.kind === "rest") {
      rests.push(step);
      continue;
    }
    if (step.kind === "statAtk") {
      stats.push(step);
      continue;
    }
    if (step.kind === "destroy") {
      destroys.push(step);
      continue;
    }
    if (step.kind !== "shot") continue;

    const results: ResultStep[] = [];
    let j = i + 1;
    while (j < steps.length && (steps[j].kind === "hp" || steps[j].kind === "hq" || steps[j].kind === "hqBreakpoint")) {
      results.push(steps[j] as ResultStep);
      j += 1;
    }
    const strike = { shot: step, results };
    if (step.side === "missile") missiles.push(strike);
    else guns.push(strike);
    i = j - 1;
  }

  return { moves, rests, stats, guns, missiles, destroys };
}
