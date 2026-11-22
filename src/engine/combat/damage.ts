import { applyHqDamage, pushHqDamageSteps } from "../hp";
import { frontCol, supportCol, unitsOf } from "../board";
import { artilleryRepeatBonus } from "../combat";
import { armorPiercingOf, hasKeyword, keywordValue, stripKeyword, suppressionPenalty } from "../keywords";
import { log, withLogGroup } from "../state";
import { afterGunAttack, statusesOf } from "../status";
import { playerHqMax, type MatchState, type PlayerId, type UnitInstance } from "../types";
import { removeDeadUnits } from "./cleanup";
import {
  canCounter,
  canVolley,
  combatLanes,
  facingCounterUnit,
  mayStrike,
  strikeAtk,
  strikeSource,
  supportFireFromOthers,
  takesReturnFire,
  volleyTarget,
  type CombatCtx,
} from "./helpers";
import { afterGunHitEffects, applyFireFromHqHit, resolveGunHit } from "./keywordEffects";
import { reaimAlliedMissiles } from "./missile";
import { smokeBlocksGun } from "./smoke";

function afterAttackingVolley(state: MatchState, shooter: UnitInstance, side: "attack" | "counter"): void {
  if (hasKeyword(shooter, "firstStrike")) {
    stripKeyword(shooter, "firstStrike");
    log(state, `${shooter.name} First Strike spent`, "firstStrike");
  }
  if (side !== "attack") return;
  const veteran = keywordValue(shooter, "veteran");
  if (veteran > 0) {
    shooter.atk += veteran;
    shooter.ap += veteran;
    log(state, `${shooter.name} Veteran +${veteran} ATK/+${veteran} AP`, "veteran");
  }
  if (hasKeyword(shooter, "radar")) {
    reaimAlliedMissiles(state, shooter.owner);
  }
}

function volleyAtk(state: MatchState, unit: UnitInstance): number {
  return strikeAtk(state, unit, unit.isAttacker);
}

function volleyAp(state: MatchState, unit: UnitInstance): number {
  let ap = armorPiercingOf(unit);
  ap -= suppressionPenalty(state, unit).ap;
  ap = Math.max(0, ap);
  if (
    statusesOf(state, "supportFireGrantsAp", unit.owner).length > 0 &&
    supportFireFromOthers(state, unit).amount > 0
  ) {
    ap += 2;
  }
  return ap;
}

function resolveAttackTarget(
  state: MatchState,
  ctx: CombatCtx,
  shooter: UnitInstance,
): UnitInstance | null {
  return volleyTarget(state, ctx, shooter).unit;
}

function fireGunAtUnit(
  state: MatchState,
  ctx: CombatCtx,
  shooter: UnitInstance,
  target: UnitInstance,
  side: "attack" | "counter",
): void {
  shooter.isAttacker = side === "attack";
  const atk = volleyAtk(state, shooter);
  const pen = volleyAp(state, shooter);
  const bonus = artilleryRepeatBonus(state, shooter, target.instanceId);
  const hit = resolveGunHit(state, shooter, target, {
    atk: atk + bonus,
    armorPiercing: pen,
  });
  const dmg = hit.damage;
  ctx.steps.push({
    kind: "shot",
    unitId: shooter.instanceId,
    name: shooter.name,
    owner: shooter.owner,
    from: { col: shooter.col, row: shooter.row },
    to: { col: target.col, row: target.row },
    damage: dmg,
    side,
    power: atk + bonus + pen,
    targetMaxHp: target.maxHp,
  });
  if (dmg > 0) {
    target.hp -= dmg;
    const src = strikeSource(state, shooter, side);
    log(state, `${shooter.name} deals ${dmg} with ${src.via} to ${target.name} (${Math.max(target.hp, 0)} HP)`, src.icon);
    ctx.steps.push({ kind: "hp", unitId: target.instanceId, hp: target.hp, lost: dmg });
  }
  const { smokeStatusId } = afterGunHitEffects(state, ctx.attacker, shooter, target, side, hit);
  if (smokeStatusId) {
    ctx.steps.push({
      kind: "statusAdd",
      unitId: target.instanceId,
      statusId: smokeStatusId,
      statusKind: "smokeDodge",
    });
  }
  afterAttackingVolley(state, shooter, side);
  afterGunAttack(state, shooter);
}

function fireGunAtHq(
  state: MatchState,
  ctx: CombatCtx,
  shooter: UnitInstance,
  foe: PlayerId,
  side: "attack" | "counter",
): void {
  shooter.isAttacker = side === "attack";
  const atk = volleyAtk(state, shooter);
  const pen = volleyAp(state, shooter);
  const bonus = artilleryRepeatBonus(state, shooter, `hq:${foe}`);
  const dmg = Math.max(0, atk + bonus);
  ctx.steps.push({
    kind: "shot",
    unitId: shooter.instanceId,
    name: shooter.name,
    owner: shooter.owner,
    from: { col: shooter.col, row: shooter.row },
    to: { hq: foe },
    damage: dmg,
    side,
    power: atk + bonus + pen,
    targetMaxHp: playerHqMax(state.players[foe]),
  });
  if (dmg <= 0) {
    afterAttackingVolley(state, shooter, side);
    afterGunAttack(state, shooter);
    return;
  }
  const src = strikeSource(state, shooter, side);
  const hits = applyHqDamage(state, foe, dmg, shooter.name, { keepPhase: true, ...src });
  pushHqDamageSteps(ctx.steps, foe, state.players[foe].hqHp, dmg, hits);
  applyFireFromHqHit(state, shooter, foe, dmg);
  afterAttackingVolley(state, shooter, side);
  afterGunAttack(state, shooter);
}

/**
 * Attack + return fire happen per-attacker, per-lane, interleaved:
 *   attacker fires → target (if alive and eligible) returns fire immediately.
 * Old behavior (batch mode): ALL attackers fire (pass 1), then ALL defenders return
 * fire (pass 2) → players saw many attack shots without counters, then a big
 * dump of return-fire damage at the end.
 *
 * Artillery neither takes nor deals return fire. Return fire: defender (target)
 * only shoots back at the specific unit that attacked them (never HQ). 0 HP
 * corpses still return fire and are removed once the full lane is resolved.
 *
 * If multiple attackers share the same defender (e.g. 2 allies shoot 1 enemy),
 * the defender fires one counter PER individual attacker — still interleaved so
 * each pair animates together.
 */
export function runDamagePhase(state: MatchState, ctx: CombatCtx): void {
  const attackersReady = unitsOf(state.board, ctx.attacker).some(
    (u) => canVolley(u) && !u.rested && u.hp > 0 && mayStrike(ctx, u),
  );
  const defendersReady = unitsOf(state.board, ctx.defender).some((u) => canCounter(u) && mayStrike(ctx, u));
  if (!attackersReady && !defendersReady) return;

  ctx.steps.push({ kind: "phase", phase: "damage" });
  withLogGroup(state, "Damage", "atk", () => {
    // Two passes: every Frontline shooter first, then every Support shooter.
    // Smoke Screen on a shared target can deploy from the front hit before the back shot.
    const ready = (u: UnitInstance) => canVolley(u) && !u.rested && u.hp > 0 && mayStrike(ctx, u);
    const fireAttacker = (unit: UnitInstance) => {
      const target = resolveAttackTarget(state, ctx, unit);
      if (target) {
        fireGunAtUnit(state, ctx, unit, target, "attack");
      } else {
        // Empty lane or Smoke Screen on the facing enemy → gun shot goes to HQ.
        fireGunAtHq(state, ctx, unit, ctx.defender, "attack");
      }
      // Interleaved return fire — including when Smoke redirected the shot to HQ.
      // If the attacker has Smoke Screen, the counter also redirects to HQ.
      const counter = target ?? facingCounterUnit(state, ctx, unit);
      if (counter && takesReturnFire(unit) && canCounter(counter)) {
        if (smokeBlocksGun(state, unit, counter.owner)) {
          fireGunAtHq(state, ctx, counter, unit.owner, "counter");
        } else {
          fireGunAtUnit(state, ctx, counter, unit, "counter");
        }
      }
    };
    for (const pass of ["front", "support"] as const) {
      for (const lane of combatLanes(ctx)) {
        const col = pass === "front" ? frontCol(ctx.attacker) : supportCol(ctx.attacker);
        const unit = state.board[col][lane];
        if (!unit || !ready(unit)) continue;
        ctx.steps.push({ kind: "lane", lane, color: "red" });
        fireAttacker(unit);
      }
    }
    removeDeadUnits(state, ctx);
  });
}
