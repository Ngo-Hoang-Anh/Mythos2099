import { applyHqDamage, pushHqDamageSteps } from "../hp";
import { unitsOf } from "../board";
import { artilleryRepeatBonus, computeStrikeDamage, defenseArmor } from "../combat";
import { armorPiercingOf } from "../keywords";
import { log, withLogGroup } from "../state";
import { afterGunAttack, statusesOf } from "../status";
import { HQ_MAX_HP, type MatchState, type PlayerId, type UnitInstance } from "../types";
import { removeDeadUnits } from "./cleanup";
import {
  canCounter,
  canVolley,
  combatLanes,
  mayStrike,
  sideUnitsInLane,
  strikeAtk,
  strikeSource,
  supportFireFromOthers,
  takesReturnFire,
  volleyTarget,
  type CombatCtx,
} from "./helpers";

function volleyAtk(state: MatchState, unit: UnitInstance): number {
  return strikeAtk(state, unit, unit.isAttacker);
}

function volleyAp(state: MatchState, unit: UnitInstance): number {
  let ap = armorPiercingOf(unit);
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
  const dmg = computeStrikeDamage({
    atk: atk + bonus,
    armor: defenseArmor(target),
    armorPiercing: pen,
  });
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
    targetMaxHp: HQ_MAX_HP,
  });
  if (dmg <= 0) {
    afterGunAttack(state, shooter);
    return;
  }
  const src = strikeSource(state, shooter, side);
  const hits = applyHqDamage(state, foe, dmg, shooter.name, { keepPhase: true, ...src });
  pushHqDamageSteps(ctx.steps, foe, state.players[foe].hqHp, dmg, hits);
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
    for (const lane of combatLanes(ctx)) {
      const attackers = sideUnitsInLane(state, ctx.attacker, lane).filter(
        (u) => canVolley(u) && !u.rested && u.hp > 0 && mayStrike(ctx, u),
      );
      if (attackers.length === 0) continue;
      ctx.steps.push({ kind: "lane", lane, color: "red" });
      for (const unit of attackers) {
        const target = resolveAttackTarget(state, ctx, unit);
        if (!target) {
          fireGunAtHq(state, ctx, unit, ctx.defender, "attack");
          continue;
        }
        fireGunAtUnit(state, ctx, unit, target, "attack");
        // Interleaved return fire: this specific defender answers this attacker
        // immediately. Multiple attackers on one defender each get their own
        // counter paired with their shot.
        if (takesReturnFire(unit) && canCounter(target)) {
          fireGunAtUnit(state, ctx, target, unit, "counter");
        }
      }
    }
    removeDeadUnits(state, ctx);
  });
}
