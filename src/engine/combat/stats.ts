import { allUnits } from "../board";
import { log, withLogGroup } from "../state";
import type { MatchState, UnitInstance } from "../types";
import {
  combatLanes,
  mayStrike,
  sideUnitsInLane,
  strikeCombatBonus,
  type CombatCtx,
} from "./helpers";

function combatBonus(state: MatchState, ctx: CombatCtx, unit: UnitInstance): number {
  const bonus = strikeCombatBonus(state, unit, unit.owner === ctx.attacker);
  return bonus.aggressive + bonus.retaliate + bonus.support;
}

export function runStatsPhase(state: MatchState, ctx: CombatCtx): void {
  const units = allUnits(state.board).filter((unit) => unit.hp > 0 && mayStrike(ctx, unit));
  if (units.length === 0 || units.every((unit) => combatBonus(state, ctx, unit) <= 0)) return;

  ctx.steps.push({ kind: "phase", phase: "stats" });
  withLogGroup(state, "Stats", "atk", () => {
    for (const lane of combatLanes(ctx)) {
      const laneUnits = [
        ...sideUnitsInLane(state, ctx.attacker, lane),
        ...sideUnitsInLane(state, ctx.defender, lane),
      ].filter((unit) => mayStrike(ctx, unit));
      let laneOpened = false;
      const openLane = () => {
        if (laneOpened) return;
        ctx.steps.push({ kind: "lane", lane, color: "yellow" });
        laneOpened = true;
      };
      for (const unit of laneUnits) {
        unit.isAttacker = unit.owner === ctx.attacker;
        const { aggressive, retaliate, support } = strikeCombatBonus(state, unit, unit.isAttacker);
        if (aggressive > 0) {
          openLane();
          ctx.steps.push({ kind: "keywordPop", unitId: unit.instanceId, keyword: "aggressive", amount: aggressive });
        }
        if (retaliate > 0) {
          openLane();
          ctx.steps.push({ kind: "keywordPop", unitId: unit.instanceId, keyword: "retaliate", amount: retaliate });
        }
        if (support > 0) {
          openLane();
          ctx.steps.push({
            kind: "keywordPop",
            unitId: unit.instanceId,
            keyword: "supportFire",
            amount: support,
          });
        }
        unit.combatAtkBonus = aggressive + retaliate + support;
        const total = unit.atk + unit.tempAtk + unit.combatAtkBonus;
        if (unit.combatAtkBonus > 0) {
          openLane();
          ctx.steps.push({ kind: "statAtk", unitId: unit.instanceId, bonus: unit.combatAtkBonus, total });
          const icon = aggressive > 0 ? "aggressive" : retaliate > 0 ? "retaliate" : "supportFire";
          log(state, `${unit.name} combat ATK ${total} (+${unit.combatAtkBonus})`, icon);
        }
      }
    }
  });
}
