import { missileDamage, missilePowerOf } from "../combat";
import { unitsOf } from "../board";
import { log, withLogGroup } from "../state";
import { isUntargetableBy } from "../status";
import type { BoardPos, MatchState, UnitInstance } from "../types";
import { pushAttack } from "../fx";
import { resolveDestroyedUnits } from "./cleanup";
import {
  combatLanes,
  mayStrike,
  pickMissileTarget,
  sideUnitsInLane,
  type CombatCtx,
} from "./helpers";

/** Living enemy standing on the missile lock. Untargetable units still count as present. */
export function missileLockHasEnemy(state: MatchState, shooter: UnitInstance): boolean {
  const pos = shooter.missileTarget;
  if (!pos) return false;
  const unit = state.board[pos.col]?.[pos.row];
  return Boolean(unit && unit.hp > 0 && unit.owner !== shooter.owner);
}

/** Living enemy in the locked cell. Untargetable units do not count, so the lock is replaced. */
function enemyOnLock(state: MatchState, shooter: UnitInstance, pos: BoardPos): UnitInstance | null {
  const unit = state.board[pos.col]?.[pos.row];
  if (!unit || unit.hp <= 0 || unit.owner === shooter.owner) return null;
  if (isUntargetableBy(state, unit, shooter.owner)) return null;
  return unit;
}

function lockMissileTarget(state: MatchState, shooter: UnitInstance, ctx?: CombatCtx): void {
  const next = pickMissileTarget(state, shooter);
  if (!next) {
    shooter.missileTarget = null;
    return;
  }
  shooter.missileTarget = { col: next.col, row: next.row };
  log(state, `${shooter.name} locks Missile on ${next.name} (lane ${next.row + 1})`, "missile");
  ctx?.steps.push({
    kind: "missileLock",
    unitId: shooter.instanceId,
    to: { col: next.col, row: next.row },
  });
}

export function resolveMissileShot(
  state: MatchState,
  shooter: UnitInstance,
  opts?: { ctx?: CombatCtx },
): void {
  if (shooter.hp <= 0) return;
  const power = missilePowerOf(state, shooter);
  if (power <= 0) return;
  const ctx = opts?.ctx;
  const locked = shooter.missileTarget ? enemyOnLock(state, shooter, shooter.missileTarget) : null;
  if (!locked) {
    lockMissileTarget(state, shooter, ctx);
    return;
  }
  const target = locked;
  const dmg = missileDamage(state, shooter, target);
  if (ctx) {
    ctx.steps.push({
      kind: "shot",
      unitId: shooter.instanceId,
      name: shooter.name,
      owner: shooter.owner,
      from: { col: shooter.col, row: shooter.row },
      to: { col: target.col, row: target.row },
      damage: dmg,
      side: "missile",
      power,
      targetMaxHp: target.maxHp,
    });
  } else {
    pushAttack(state, shooter, { col: target.col, row: target.row }, {
      damage: dmg,
      power,
      missile: true,
    });
  }
  if (dmg > 0) {
    target.hp -= dmg;
    log(state, `${shooter.name} deals ${dmg} with Missile to ${target.name} (${Math.max(target.hp, 0)} HP)`, "missile");
    if (ctx) ctx.steps.push({ kind: "hp", unitId: target.instanceId, hp: target.hp, lost: dmg });
  }
  if (!ctx) resolveDestroyedUnits(state);
}

export function runMissilePhase(state: MatchState, ctx: CombatCtx): void {
  const shooters = unitsOf(state.board, ctx.attacker).filter(
    (u) => !u.rested && u.hp > 0 && missilePowerOf(state, u) > 0 && mayStrike(ctx, u),
  );
  if (shooters.length === 0) return;

  ctx.steps.push({ kind: "phase", phase: "missile" });
  withLogGroup(state, "Missile", "missile", () => {
    for (const lane of combatLanes(ctx)) {
      const laneShooters = sideUnitsInLane(state, ctx.attacker, lane).filter(
        (u) => !u.rested && u.hp > 0 && missilePowerOf(state, u) > 0 && mayStrike(ctx, u),
      );
      if (laneShooters.length === 0) continue;
      ctx.steps.push({ kind: "lane", lane, color: "orange" });
      for (const unit of laneShooters) {
        resolveMissileShot(state, unit, { ctx });
      }
    }
  });
}
