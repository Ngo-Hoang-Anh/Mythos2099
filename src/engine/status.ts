import { allUnits, findUnit } from "./board";
import { applyUnitDamage, healUnit } from "./hp";
import type {
  Keyword,
  MatchState,
  PlayerId,
  StatusDuration,
  StatusEffect,
  StatusKind,
  UnitInstance,
} from "./types";

export function cloneStatuses(statuses: StatusEffect[]): StatusEffect[] {
  return statuses.map((status) => ({
    ...status,
    hitKeys: status.hitKeys ? [...status.hitKeys] : undefined,
    suppressedKeywords: status.suppressedKeywords
      ? status.suppressedKeywords.map((keyword) => ({ ...keyword }))
      : undefined,
  }));
}

export function addStatus(
  state: MatchState,
  opts: {
    kind: StatusKind;
    magnitude?: number;
    sourceId: string | number;
    owner: PlayerId;
    targetId?: string;
    lane?: number;
    duration: StatusDuration;
    remainingPasses?: number;
    suppressedKeywords?: StatusEffect["suppressedKeywords"];
  },
): StatusEffect {
  const remainingPasses =
    opts.remainingPasses ??
    (opts.duration === "endOfNextTurn" ? 2 : opts.duration === "thisCombat" ? 1 : 1);
  const status: StatusEffect = {
    id: `st_${++state.idSeq}`,
    kind: opts.kind,
    magnitude: opts.magnitude ?? 0,
    sourceId: opts.sourceId,
    owner: opts.owner,
    targetId: opts.targetId,
    lane: opts.lane,
    duration: opts.duration,
    remainingPasses,
    hitKeys: opts.kind === "artilleryRepeat" ? [] : undefined,
    suppressedKeywords: opts.suppressedKeywords
      ? opts.suppressedKeywords.map((keyword) => ({ ...keyword }))
      : undefined,
  };
  state.statuses.push(status);
  rebuildTempBuffs(state);
  return status;
}

export function statusesOf(state: MatchState, kind: StatusKind, owner?: PlayerId): StatusEffect[] {
  return state.statuses.filter((status) => status.kind === kind && (owner === undefined || status.owner === owner));
}

export function hasStatusOn(state: MatchState, unitId: string, kind: StatusKind): boolean {
  return state.statuses.some((status) => status.kind === kind && status.targetId === unitId);
}

export function statusMod(state: MatchState, unitId: string, kind: StatusKind): number {
  let total = 0;
  for (const status of state.statuses) {
    if (status.kind !== kind) continue;
    if (status.targetId && status.targetId !== unitId) continue;
    if (!status.targetId && (kind === "modAtk" || kind === "modAp" || kind === "modArmor")) continue;
    total += status.magnitude;
  }
  return total;
}

export function missileMod(state: MatchState, unit: UnitInstance): number {
  let total = 0;
  for (const status of state.statuses) {
    if (status.kind !== "modMissile") continue;
    if (status.owner !== unit.owner) continue;
    if (status.targetId && status.targetId !== unit.instanceId) continue;
    total += status.magnitude;
  }
  return total;
}

/** Keywords for UI: Missile includes this-turn mods; expires when statuses tick off. */
export function keywordsWithMods(state: MatchState, unit: UnitInstance): Keyword[] {
  const mod = missileMod(state, unit);
  if (!mod) return unit.keywords;
  return unit.keywords.map((keyword) =>
    keyword.name === "missile" ? { ...keyword, value: Math.max(0, keyword.value + mod) } : keyword,
  );
}

export function isUntargetableBy(state: MatchState, unit: UnitInstance, actor: PlayerId): boolean {
  if (unit.owner === actor) return false;
  return state.statuses.some((status) => status.kind === "untargetable" && status.targetId === unit.instanceId);
}

export function tickStatuses(state: MatchState): void {
  for (const status of state.statuses) {
    if (status.kind === "regen" && status.targetId && status.magnitude > 0) {
      const unit = findUnit(state.board, status.targetId);
      if (unit && unit.hp > 0) {
        healUnit(unit, status.magnitude);
      }
    }
    if (status.duration === "thisCombat") continue;
    status.remainingPasses -= 1;
  }
  const expired = state.statuses.filter((status) => {
    if (status.duration === "thisCombat") return false;
    return status.remainingPasses <= 0;
  });
  for (const status of expired) {
    restoreSuppressedKeywords(state, status);
  }
  state.statuses = state.statuses.filter((status) => {
    if (status.duration === "thisCombat") return true;
    return status.remainingPasses > 0;
  });
  rebuildTempBuffs(state);
}

export function clearThisCombatStatuses(state: MatchState): void {
  state.statuses = state.statuses.filter((status) => status.duration !== "thisCombat");
  rebuildTempBuffs(state);
}

export function removeStatus(state: MatchState, id: string): void {
  const status = state.statuses.find((entry) => entry.id === id);
  if (status) restoreSuppressedKeywords(state, status);
  state.statuses = state.statuses.filter((entry) => entry.id !== id);
  rebuildTempBuffs(state);
}

/** Strip a unit's keywords until the status expires, then restore them. */
export function suppressUnitKeywords(
  state: MatchState,
  unit: UnitInstance,
  opts: {
    sourceId: string | number;
    owner: PlayerId;
    duration: StatusDuration;
  },
): StatusEffect | null {
  if (hasStatusOn(state, unit.instanceId, "suppressKeywords")) return null;
  if (unit.keywords.length === 0) return null;
  const suppressedKeywords = unit.keywords.map((keyword) => ({ ...keyword }));
  unit.keywords = [];
  return addStatus(state, {
    kind: "suppressKeywords",
    sourceId: opts.sourceId,
    owner: opts.owner,
    targetId: unit.instanceId,
    duration: opts.duration,
    suppressedKeywords,
  });
}

function restoreSuppressedKeywords(state: MatchState, status: StatusEffect): void {
  if (status.kind !== "suppressKeywords" || !status.targetId || !status.suppressedKeywords) return;
  const unit = findUnit(state.board, status.targetId);
  if (!unit) return;
  unit.keywords = status.suppressedKeywords.map((keyword) => ({ ...keyword }));
}

export function afterGunAttack(state: MatchState, attacker: UnitInstance): void {
  if (attacker.hp <= 0) return;
  for (const status of state.statuses) {
    if (status.kind !== "afterAttackSelfDamage") continue;
    if (status.targetId !== attacker.instanceId) continue;
    applyUnitDamage(state, attacker, status.magnitude, "Sticky Bomb");
  }
}

export function rebuildTempBuffs(state: MatchState): void {
  for (const unit of allUnits(state.board)) {
    unit.tempAtk = 0;
    unit.tempArmor = 0;
    unit.tempAp = 0;
  }
  for (const status of state.statuses) {
    if (!status.targetId) continue;
    const unit = findUnit(state.board, status.targetId);
    if (!unit) continue;
    if (status.kind === "modAtk") unit.tempAtk += status.magnitude;
    if (status.kind === "modAp") unit.tempAp += status.magnitude;
    if (status.kind === "modArmor") unit.tempArmor += status.magnitude;
  }
}
