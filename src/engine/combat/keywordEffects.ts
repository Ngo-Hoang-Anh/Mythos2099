import { frontCol, unitsOf } from "../board";
import { computeStrikeDamage, defenseArmor } from "../combat";
import {
  hasFrontlineScout,
  hasKeyword,
  keywordValue,
  stripKeyword,
} from "../keywords";
import { nextRng } from "../rng";
import { log } from "../state";
import {
  addStatus,
  clearHulldownOnMove,
  hasStatusOn,
  hulldownGunReduction,
} from "../status";
import type { MatchState, PlayerId, UnitInstance } from "../types";

export { clearHulldownOnMove, hulldownGunReduction };

export interface GunHitResult {
  damage: number;
  blockedByDefense: boolean;
  dodged: boolean;
}

/** Frontal gun hit: shooter is on their own Frontline facing the target. */
export function isFrontalGunHit(shooter: UnitInstance, target: UnitInstance): boolean {
  if (shooter.owner === target.owner) return false;
  return shooter.col === frontCol(shooter.owner);
}

function smokeDodges(
  state: MatchState,
  shooter: UnitInstance,
  target: UnitInstance,
  shock: number,
): boolean {
  if (shock > 0) return false;
  if (!hasStatusOn(state, target.instanceId, "smokeDodge")) return false;
  if (hasFrontlineScout(state, shooter.owner)) return false;
  return true;
}

/**
 * Apply Shield → Armor → Barrier → Sloped Armor to a gun strike.
 * `atk` / `armorPiercing` are already final strike values.
 */
export function resolveGunHit(
  state: MatchState,
  shooter: UnitInstance,
  target: UnitInstance,
  opts: { atk: number; armorPiercing: number },
): GunHitResult {
  const shock = keywordValue(shooter, "shock");
  if (smokeDodges(state, shooter, target, shock)) {
    log(state, `${target.name} Smoke Screen dodges the attack`, "smokeScreen");
    return { damage: 0, blockedByDefense: false, dodged: true };
  }

  // Corrosion always strips Armor once on a connecting gun hit (before damage math).
  const corrosion = keywordValue(shooter, "corrosion");
  if (corrosion > 0) {
    const before = target.armor;
    target.armor = Math.max(0, target.armor - corrosion);
    if (target.armor !== before) {
      log(state, `${shooter.name} Corrosion −${corrosion} Armor on ${target.name}`, "corrosion");
    }
  }

  let blockedByDefense = false;
  const fromFront = isFrontalGunHit(shooter, target);

  // Shock only interacts with Barrier/Shield pools — it does not add flat gun damage.
  if (shock > 0) {
    if (target.barrier > 0 && fromFront) {
      const cut = Math.min(target.barrier, shock);
      target.barrier -= cut;
      if (cut > 0) blockedByDefense = true;
    }
    if (target.shield > 0) {
      const cut = Math.min(target.shield, shock);
      target.shield -= cut;
      if (cut > 0) {
        blockedByDefense = true;
        target.tookDamageSinceRegen = true;
      }
    }
  }

  let strike = Math.max(0, opts.atk);

  if (target.shield > 0 && strike > 0) {
    const absorbed = Math.min(target.shield, strike);
    target.shield -= absorbed;
    strike -= absorbed;
    if (absorbed > 0) {
      blockedByDefense = true;
      target.tookDamageSinceRegen = true;
      log(state, `${target.name} Shield absorbs ${absorbed}`, "shield");
    }
  }

  let dmg = computeStrikeDamage({
    atk: strike,
    armor: defenseArmor(target),
    armorPiercing: opts.armorPiercing,
  });

  if (dmg > 0 && target.barrier > 0 && fromFront) {
    const reduced = Math.min(target.barrier, dmg);
    dmg -= reduced;
    target.barrier = 0;
    blockedByDefense = true;
    log(state, `${target.name} Barrier blocks ${reduced}`, "barrier");
  }

  if (dmg > 0 && dmg <= 3 && hasKeyword(target, "slopedArmor")) {
    log(state, `${target.name} Sloped Armor ricochets ${dmg}`, "slopedArmor");
    dmg = 0;
  }

  // Hulldown: flat gun DR after armor/AP — missiles ignore this; corrosion does not strip it.
  const hulldown = hulldownGunReduction(state, target);
  if (dmg > 0 && hulldown > 0) {
    const cut = Math.min(dmg, hulldown);
    dmg -= cut;
    log(state, `${target.name} Hulldown −${cut} damage`, "hulldown");
  }

  return { damage: dmg, blockedByDefense, dodged: false };
}

export function afterGunHitEffects(
  state: MatchState,
  ctxAttacker: PlayerId,
  shooter: UnitInstance,
  target: UnitInstance,
  side: "attack" | "counter",
  hit: GunHitResult,
): void {
  if (hit.damage > 0) {
    target.tookDamageSinceRegen = true;
  }

  // Smoke Screen: after taking damage on the enemy's turn (while defending).
  if (
    hit.damage > 0 &&
    !hit.dodged &&
    keywordValue(shooter, "shock") <= 0 &&
    hasKeyword(target, "smokeScreen") &&
    target.owner !== ctxAttacker &&
    side === "attack"
  ) {
    if (!hasStatusOn(state, target.instanceId, "smokeDodge")) {
      addStatus(state, {
        kind: "smokeDodge",
        sourceId: target.instanceId,
        owner: target.owner,
        targetId: target.instanceId,
        duration: "endOfTurn",
      });
      log(state, `${target.name} deploys Smoke Screen`, "smokeScreen");
    }
  }

  if (hit.damage > 0) {
    const fire = keywordValue(shooter, "fire");
    if (fire > 0) applyOrRefreshFire(state, shooter, target, fire);
  }

  if (hasKeyword(target, "firstStrike")) {
    stripKeyword(target, "firstStrike");
    log(state, `${target.name} First Strike spent`, "firstStrike");
  }
}

function applyOrRefreshFire(
  state: MatchState,
  shooter: UnitInstance,
  target: UnitInstance,
  fire: number,
): void {
  const existing = state.statuses.find(
    (status) => status.kind === "fireDot" && status.targetId === target.instanceId,
  );
  if (existing) {
    existing.magnitude = Math.max(existing.magnitude, fire);
    existing.remainingPasses = 3;
    existing.sourceId = shooter.instanceId;
    existing.owner = shooter.owner;
    log(state, `${target.name} Fire refreshed (${existing.magnitude})`, "fire");
    return;
  }
  addStatus(state, {
    kind: "fireDot",
    magnitude: fire,
    sourceId: shooter.instanceId,
    owner: shooter.owner,
    targetId: target.instanceId,
    duration: "endOfTurn",
    remainingPasses: 3,
  });
  log(state, `${target.name} ignited with Fire ${fire}`, "fire");
}

export function runOwnerEndOfTurn(state: MatchState, owner: PlayerId): void {
  for (const unit of unitsOf(state.board, owner)) {
    if (unit.hp <= 0) continue;
    if (unit.barrierMax > 0) {
      unit.barrier = unit.barrierMax;
    }
    if (hasKeyword(unit, "hulldown")) {
      const existing = state.statuses.find(
        (status) => status.kind === "hulldownArmor" && status.targetId === unit.instanceId,
      );
      if (!existing) {
        addStatus(state, {
          kind: "hulldownArmor",
          magnitude: 3,
          sourceId: unit.instanceId,
          owner,
          targetId: unit.instanceId,
          duration: "untilConsumed",
          remainingPasses: 99,
        });
        log(state, `${unit.name} Hulldown −3 gun damage`, "hulldown");
      }
    }
  }
  throwSuppressionMarks(state, owner);
}

function throwSuppressionMarks(state: MatchState, owner: PlayerId): void {
  const throwers = unitsOf(state.board, owner).filter(
    (unit) => unit.hp > 0 && hasKeyword(unit, "suppression"),
  );
  if (throwers.length === 0) return;

  const foe: PlayerId = owner === 0 ? 1 : 0;
  const enemyCells: { col: number; row: number; unit: UnitInstance }[] = [];
  for (const unit of unitsOf(state.board, foe)) {
    if (unit.hp <= 0) continue;
    enemyCells.push({ col: unit.col, row: unit.row, unit });
  }
  if (enemyCells.length === 0) return;

  for (const thrower of throwers) {
    const unmarked = enemyCells.filter(
      (cell) =>
        !state.statuses.some(
          (status) =>
            status.kind === "suppressionMark" &&
            status.owner === owner &&
            status.col === cell.col &&
            status.lane === cell.row,
        ),
    );
    // Prefer unmarked cells. If every enemy cell is already marked (e.g. 1v1 vacuum),
    // stack another mark on a marked cell instead of replacing.
    const stack = unmarked.length === 0;
    const pool = stack ? enemyCells : unmarked;
    const roll = nextRng(state.rngState);
    state.rngState = roll.state;
    const pick = pool[Math.floor(roll.value * pool.length)]!;
    addStatus(state, {
      kind: "suppressionMark",
      sourceId: thrower.instanceId,
      owner,
      col: pick.col,
      lane: pick.row,
      duration: "endOfNextTurn",
      // 4 passes ≈ two full opponent turns after the thrower's end-of-turn tick.
      remainingPasses: 4,
    });
    log(
      state,
      `${thrower.name} Suppression marks lane ${pick.row + 1} (${pick.unit.name})${stack ? " (stack)" : ""}`,
      "suppression",
    );
  }
}

export function runShieldRegen(state: MatchState, owner: PlayerId): void {
  for (const unit of unitsOf(state.board, owner)) {
    if (unit.hp <= 0 || unit.shieldMax <= 0) continue;
    if (!unit.tookDamageSinceRegen) {
      const gain = Math.ceil(unit.shieldMax / 2);
      const before = unit.shield;
      unit.shield = Math.min(unit.shieldMax, unit.shield + gain);
      if (unit.shield > before) {
        log(state, `${unit.name} Shield regenerates to ${unit.shield}`, "shield");
      }
    }
    unit.tookDamageSinceRegen = false;
  }
}
