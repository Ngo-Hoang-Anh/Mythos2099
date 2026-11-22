/**
 * Extended vacuum sims for roster balance:
 * - Deathmatch until one dies (multi-round), with DoT / Suppression / Veteran / SF-self,
 *   and Smoke/Barrier toggled ON/OFF each round (ON first round → 50% uptime).
 * - HQ damage over 4 attacking turns.
 * - Deathmatch with both sides using specials once.
 */
import { UNITS, getUnitDef } from "../data/units";
import { emptyBoard, frontCol, placeUnit, supportCol, unitsOf } from "../engine/board";
import { beginEngagement } from "../engine/combat/engagement";
import { runOwnerEndOfTurn } from "../engine/combat/keywordEffects";
import { hasKeyword, keywordValue, syncDefensePools } from "../engine/keywords";
import { mulberry32State } from "../engine/rng";
import { addStatus, hasStatusOn, removeStatus, tickStatuses } from "../engine/status";
import type { MatchState, PlayerId, UnitDef, UnitInstance } from "../engine/types";
import { HQ_MAX_HP } from "../engine/types";
import { specialSkillDamageOf } from "./specialSkillDamage";

export const VACUUM_LANE = 2;
export const DEATHMATCH_MAX_ROUNDS = 48;
export const HQ_TURNS = 4;

export type DeathOutcome = "attacker" | "defender" | "mutual" | "timeout";

export interface DeathmatchResult {
  attackerId: number;
  defenderId: number;
  outcome: DeathOutcome;
  rounds: number;
  attackerHp: number;
  defenderHp: number;
}

function blankMatch(currentPlayer: PlayerId = 0): MatchState {
  return {
    players: [
      {
        id: 0,
        hqHp: HQ_MAX_HP,
        triggeredBreakpoints: [],
        commandPoints: 10,
        nextTurnSupplyBonus: 0,
        nextTurnDrawBonus: 0,
        army: [],
        undeployed: [],
        revealedUnitIds: [],
        deck: [],
        hand: [],
        discard: [],
        discardRedrawsUsed: 0,
        deploysThisTurn: 0,
        turnsTaken: 1,
        thinkingTimeSeconds: 180,
      },
      {
        id: 1,
        hqHp: HQ_MAX_HP,
        triggeredBreakpoints: [],
        commandPoints: 10,
        nextTurnSupplyBonus: 0,
        nextTurnDrawBonus: 0,
        army: [],
        undeployed: [],
        revealedUnitIds: [],
        deck: [],
        hand: [],
        discard: [],
        discardRedrawsUsed: 0,
        deploysThisTurn: 0,
        turnsTaken: 1,
        thinkingTimeSeconds: 180,
      },
    ],
    board: emptyBoard(),
    currentPlayer,
    firstPlayerId: 0,
    phase: "maneuver",
    turn: 1,
    winner: null,
    seed: 1,
    rngState: mulberry32State(1),
    log: [],
    fx: [],
    combatPlayback: null,
    combatResumePhase: null,
    statuses: [],
    idSeq: 0,
  };
}

function deployCol(owner: PlayerId, def: UnitDef): number {
  const backline =
    hasKeyword(def, "artillery") || hasKeyword(def, "jetPlane");
  return backline ? supportCol(owner) : frontCol(owner);
}

function spawnUnit(state: MatchState, defId: number, owner: PlayerId): UnitInstance {
  const def = getUnitDef(defId);
  const unit: UnitInstance = {
    instanceId: `vx_${owner}_${def.id}_${state.idSeq + 1}`,
    defId: def.id,
    name: def.name,
    class: def.class,
    owner,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    armor: def.armor,
    ap: def.ap,
    cost: def.cost,
    col: deployCol(owner, def),
    row: VACUUM_LANE,
    keywords: def.keywords.map((k) => ({ ...k })),
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
    shield: 0,
    shieldMax: 0,
    barrier: 0,
    barrierMax: 0,
    tookDamageSinceRegen: false,
  };
  syncDefensePools(unit);
  state.idSeq += 1;
  placeUnit(state.board, unit);
  return unit;
}

function living(unit: UnitInstance | null | undefined): boolean {
  return Boolean(unit && unit.hp > 0);
}

/** Smoke + Barrier ON on even rounds (0,2,4…), OFF on odd — first round ON ≈ 50% uptime. */
function applyConditionalToggles(state: MatchState, roundIndex: number): void {
  const on = roundIndex % 2 === 0;
  for (const unit of [...unitsOf(state.board, 0), ...unitsOf(state.board, 1)]) {
    if (unit.hp <= 0) continue;

    if (hasKeyword(unit, "barrier")) {
      unit.barrier = on ? unit.barrierMax : 0;
    }

    const smokeStatuses = state.statuses.filter(
      (s) => s.kind === "smokeDodge" && s.targetId === unit.instanceId,
    );
    for (const s of smokeStatuses) removeStatus(state, s.id);

    if (on && hasKeyword(unit, "smokeScreen")) {
      addStatus(state, {
        kind: "smokeDodge",
        sourceId: unit.instanceId,
        owner: unit.owner,
        targetId: unit.instanceId,
        duration: "endOfTurn",
        remainingPasses: 99,
      });
    }
  }
}

/** Support Fire counts as a self ATK buff for vacuum (no allies present). */
function applySupportFireSelf(state: MatchState): void {
  for (const unit of [...unitsOf(state.board, 0), ...unitsOf(state.board, 1)]) {
    if (unit.hp <= 0) continue;
    const sf = keywordValue(unit, "supportFire");
    if (sf <= 0) continue;
    // Drop prior vacuum SF mods for this unit.
    for (const s of [...state.statuses]) {
      if (s.kind === "modAtk" && s.sourceId === `vacuum-sf:${unit.instanceId}`) {
        removeStatus(state, s.id);
      }
    }
    addStatus(state, {
      kind: "modAtk",
      magnitude: sf,
      sourceId: `vacuum-sf:${unit.instanceId}`,
      owner: unit.owner,
      targetId: unit.instanceId,
      duration: "thisCombat",
      remainingPasses: 1,
    });
  }
}

function applySpecialOnce(
  state: MatchState,
  attacker: UnitInstance,
  defender: UnitInstance,
  used: Set<string>,
): void {
  if (used.has(attacker.instanceId)) return;
  used.add(attacker.instanceId);
  const spec = specialSkillDamageOf(attacker.defId);
  if (spec.damage > 0 && living(defender)) {
    defender.hp -= spec.damage;
    if (defender.hp <= 0) {
      state.board[defender.col][defender.row] = null;
    }
    return;
  }
  // Non-damage specials: small lasting ATK buff as a stand-in for utility skills.
  addStatus(state, {
    kind: "modAtk",
    magnitude: 2,
    sourceId: `vacuum-skill:${attacker.instanceId}`,
    owner: attacker.owner,
    targetId: attacker.instanceId,
    duration: "untilConsumed",
    remainingPasses: 99,
  });
}

function findOnBoard(state: MatchState, defId: number, owner: PlayerId): UnitInstance | null {
  return unitsOf(state.board, owner).find((u) => u.defId === defId) ?? null;
}

export function simulateDeathmatch(
  attackerId: number,
  defenderId: number,
  opts?: { useSkills?: boolean },
): DeathmatchResult {
  const useSkills = opts?.useSkills ?? false;
  const state = blankMatch(0);
  const a = spawnUnit(state, attackerId, 0);
  const b = spawnUnit(state, defenderId, 1);
  const usedSkills = new Set<string>();
  let current: PlayerId = 0;
  let rounds = 0;

  while (rounds < DEATHMATCH_MAX_ROUNDS) {
    const left = findOnBoard(state, attackerId, 0);
    const right = findOnBoard(state, defenderId, 1);
    if (!living(left) && !living(right)) {
      return {
        attackerId,
        defenderId,
        outcome: "mutual",
        rounds,
        attackerHp: 0,
        defenderHp: 0,
      };
    }
    if (!living(left)) {
      return {
        attackerId,
        defenderId,
        outcome: "defender",
        rounds,
        attackerHp: 0,
        defenderHp: Math.max(0, right?.hp ?? 0),
      };
    }
    if (!living(right)) {
      return {
        attackerId,
        defenderId,
        outcome: "attacker",
        rounds,
        attackerHp: Math.max(0, left?.hp ?? 0),
        defenderHp: 0,
      };
    }

    applyConditionalToggles(state, rounds);
    applySupportFireSelf(state);
    state.currentPlayer = current;
    state.phase = "maneuver";
    state.combatPlayback = null;
    state.winner = null;

    const striker = current === 0 ? left! : right!;
    const foe = current === 0 ? right! : left!;
    if (useSkills) applySpecialOnce(state, striker, foe, usedSkills);

    // Re-check after skill burst.
    if (!living(findOnBoard(state, attackerId, 0)) || !living(findOnBoard(state, defenderId, 1))) {
      rounds += 1;
      continue;
    }

    beginEngagement(state, { skipRelocation: true, resumePhase: "maneuver", attacker: current });
    runOwnerEndOfTurn(state, current);
    tickStatuses(state);

    current = current === 0 ? 1 : 0;
    rounds += 1;
  }

  const left = findOnBoard(state, attackerId, 0);
  const right = findOnBoard(state, defenderId, 1);
  return {
    attackerId,
    defenderId,
    outcome: "timeout",
    rounds,
    attackerHp: Math.max(0, left?.hp ?? 0),
    defenderHp: Math.max(0, right?.hp ?? 0),
  };
}

/** Sum of HQ damage dealt by the unit over HQ_TURNS attacking turns (empty lane). */
export function simulateHqDamageOverTurns(unitId: number, turns = HQ_TURNS): number {
  const state = blankMatch(0);
  spawnUnit(state, unitId, 0);
  let dealt = 0;

  for (let round = 0; round < turns; round += 1) {
    const before = state.players[1].hqHp;
    applyConditionalToggles(state, round);
    applySupportFireSelf(state);
    state.currentPlayer = 0;
    state.phase = "maneuver";
    state.combatPlayback = null;
    state.winner = null;
    beginEngagement(state, { skipRelocation: true, resumePhase: "maneuver", attacker: 0 });
    dealt += Math.max(0, before - state.players[1].hqHp);
    // Fire DoT on HQ is not modeled in engine; only gun/missile this turn.
    runOwnerEndOfTurn(state, 0);
    tickStatuses(state);
    if (state.players[1].hqHp <= 0) break;
  }
  return dealt;
}

export interface UnitExtendedScore {
  id: number;
  name: string;
  cost: number;
  era: "core" | "new";
  /** Deathmatch as first striker vs all others (excl. mirror). */
  deathWin: number;
  deathLose: number;
  deathMutual: number;
  deathTimeout: number;
  /** Same deathmatch but both sides use specials once. */
  skillWin: number;
  skillLose: number;
  skillMutual: number;
  skillTimeout: number;
  /** Total HQ damage over 4 attacking turns. */
  hqDmg4: number;
}

export function scoreUnitExtended(unit: UnitDef, roster: UnitDef[] = UNITS): UnitExtendedScore {
  let deathWin = 0;
  let deathLose = 0;
  let deathMutual = 0;
  let deathTimeout = 0;
  let skillWin = 0;
  let skillLose = 0;
  let skillMutual = 0;
  let skillTimeout = 0;

  for (const foe of roster) {
    if (foe.id === unit.id) continue;
    const d = simulateDeathmatch(unit.id, foe.id);
    if (d.outcome === "attacker") deathWin += 1;
    else if (d.outcome === "defender") deathLose += 1;
    else if (d.outcome === "mutual") deathMutual += 1;
    else deathTimeout += 1;

    const s = simulateDeathmatch(unit.id, foe.id, { useSkills: true });
    if (s.outcome === "attacker") skillWin += 1;
    else if (s.outcome === "defender") skillLose += 1;
    else if (s.outcome === "mutual") skillMutual += 1;
    else skillTimeout += 1;
  }

  return {
    id: unit.id,
    name: unit.name,
    cost: unit.cost,
    era: unit.id >= 28 ? "new" : "core",
    deathWin,
    deathLose,
    deathMutual,
    deathTimeout,
    skillWin,
    skillLose,
    skillMutual,
    skillTimeout,
    hqDmg4: simulateHqDamageOverTurns(unit.id),
  };
}

export function allExtendedScores(roster: UnitDef[] = UNITS): UnitExtendedScore[] {
  return roster.map((u) => scoreUnitExtended(u, roster));
}
