import { applyHqDamage, pushHqDamageSteps } from "../hp";
import { consumeMissileSplash, missileDamage, missilePowerOf } from "../combat";
import { unitsOf } from "../board";
import { log, withLogGroup } from "../state";
import { HQ_MAX_HP, type MatchState, type PlayerId, type UnitInstance } from "../types";
import { pushAttack } from "../fx";
import { resolveDestroyedUnits } from "./cleanup";
import {
  combatLanes,
  extraVolleyTarget,
  mayStrike,
  pickMissileTarget,
  sideUnitsInLane,
  type CombatCtx,
} from "./helpers";

export function resolveMissileShot(
  state: MatchState,
  shooter: UnitInstance,
  opts?: { ctx?: CombatCtx },
): void {
  if (shooter.hp <= 0) return;
  const power = missilePowerOf(state, shooter);
  if (power <= 0) return;
  const attacker = shooter.owner;
  const defender: PlayerId = attacker === 0 ? 1 : 0;
  const ctx = opts?.ctx;
  const target = ctx?.extra ? extraVolleyTarget(state, ctx, shooter) : pickMissileTarget(state, shooter);

  if (target) {
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
    for (const splash of consumeMissileSplash(state, target, shooter.owner, { lane: ctx?.extra?.lane })) {
      log(state, `${shooter.name} deals 1 with Missile splash to ${splash.name} (${Math.max(splash.hp, 0)} HP)`, "missile");
      if (ctx) ctx.steps.push({ kind: "hp", unitId: splash.instanceId, hp: splash.hp, lost: 1 });
    }
    if (!ctx) resolveDestroyedUnits(state);
    return;
  }

  if (ctx) {
    ctx.steps.push({
      kind: "shot",
      unitId: shooter.instanceId,
      name: shooter.name,
      owner: shooter.owner,
      from: { col: shooter.col, row: shooter.row },
      to: { hq: defender },
      damage: power,
      side: "missile",
      power,
      targetMaxHp: HQ_MAX_HP,
    });
  } else {
    pushAttack(state, shooter, { hq: defender }, { damage: power, power, missile: true });
  }
  if (power > 0) {
    const hits = applyHqDamage(state, defender, power, shooter.name, {
      keepPhase: true,
      icon: "missile",
      via: "Missile",
    });
    if (ctx) pushHqDamageSteps(ctx.steps, defender, state.players[defender].hqHp, power, hits);
  }
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
