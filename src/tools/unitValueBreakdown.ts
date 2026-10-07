import { UNITS } from "../data/units";
import { computeStrikeDamage, missileEffectiveArmor } from "../engine/combat";
import { aggressiveOf, keywordValue, retaliateOf } from "../engine/keywords";
import type { UnitDef, UnitInstance } from "../engine/types";
import { specialSkillDamageOf } from "./specialSkillDamage";

/** Two adjacent allies, each Support Fire 2. */
export const ASSUMED_SUPPORT_ALLIES = 2;
export const ASSUMED_SUPPORT_FIRE = 2;

export interface OffenseBreakdown {
  unitId: number;
  name: string;
  class: UnitDef["class"];
  cost: number;
  atk: number;
  aggressive: number;
  retaliate: number;
  totalAtk: number;
  ap: number;
  missile: number;
  selfAtkDmg: number;
  allyBuffDmg: number;
  rallyDmg: number;
  supportFireDmg: number;
  indirectDmg: number;
  specialDmg: number;
  specialName: string;
  totalDmg: number;
}

export interface SurvivalHits {
  attackerName: string;
  gunDmg: number;
  missileDmg: number;
  attackHitDmg: number;
  retaliateHitDmg: number;
  attacksSurvived: number | null;
  retaliatesSurvived: number | null;
  cyclesSurvived: number | null;
}

export interface DefenseBreakdown {
  unitId: number;
  name: string;
  class: UnitDef["class"];
  cost: number;
  hp: number;
  armor: number;
  hpArmor2: number;
  hpArmor3: number;
  avgOpp: SurvivalHits;
  maxTotalAtk: SurvivalHits;
  maxAp: SurvivalHits;
  maxAtkPlusAp: SurvivalHits;
}

export interface CatalogAverages {
  totalAtk: number;
  ap: number;
  missile: number;
}

export interface ExtremeAttacker {
  id: number;
  name: string;
  totalAtk: number;
  ap: number;
  missile: number;
  atkPlusAp: number;
}

export interface ValueCatalog {
  averages: CatalogAverages;
  maxTotalAtk: ExtremeAttacker;
  maxAp: ExtremeAttacker;
  maxAtkPlusAp: ExtremeAttacker;
}

function asKeywordHost(def: UnitDef): UnitInstance {
  return {
    instanceId: String(def.id),
    defId: def.id,
    name: def.name,
    class: def.class,
    owner: 0,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    armor: def.armor,
    ap: def.ap,
    cost: def.cost,
    col: 1,
    row: 0,
    keywords: def.keywords,
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
  };
}

export function totalAtkOf(def: UnitDef): number {
  const host = asKeywordHost(def);
  return def.atk + aggressiveOf(host) + retaliateOf(host);
}

export function missileOf(def: UnitDef): number {
  return keywordValue(def, "missile");
}

export function hasRally(def: UnitDef): boolean {
  return def.cards.some((card) => card.effectId === "concentratedFire");
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function catalogAverages(units: UnitDef[] = UNITS): CatalogAverages {
  return {
    totalAtk: mean(units.map(totalAtkOf)),
    ap: mean(units.map((u) => u.ap)),
    missile: mean(units.map(missileOf)),
  };
}

function extremeOf(def: UnitDef): ExtremeAttacker {
  const totalAtk = totalAtkOf(def);
  return {
    id: def.id,
    name: def.name,
    totalAtk,
    ap: def.ap,
    missile: missileOf(def),
    atkPlusAp: totalAtk + def.ap,
  };
}

function pickExtreme(units: UnitDef[], score: (u: ExtremeAttacker) => number): ExtremeAttacker {
  let best = extremeOf(units[0]);
  let bestScore = score(best);
  for (const unit of units.slice(1)) {
    const row = extremeOf(unit);
    const value = score(row);
    if (value > bestScore) {
      best = row;
      bestScore = value;
    }
  }
  return best;
}

export function valueCatalog(units: UnitDef[] = UNITS): ValueCatalog {
  return {
    averages: catalogAverages(units),
    maxTotalAtk: pickExtreme(units, (u) => u.totalAtk),
    maxAp: pickExtreme(units, (u) => u.ap),
    maxAtkPlusAp: pickExtreme(units, (u) => u.atkPlusAp),
  };
}

export function offenseBreakdownOf(def: UnitDef): OffenseBreakdown {
  const host = asKeywordHost(def);
  const aggressive = aggressiveOf(host);
  const retaliate = retaliateOf(host);
  const totalAtk = def.atk + aggressive + retaliate;
  const missile = missileOf(def);
  const supportPerVolley = ASSUMED_SUPPORT_ALLIES * ASSUMED_SUPPORT_FIRE;
  const supportFireDmg = supportPerVolley * 2;
  const rallyDmg = hasRally(def) ? 3 : 0;
  const selfAtkDmg = def.atk + aggressive + def.atk + retaliate;
  const special = specialSkillDamageOf(def.id);
  const allyBuffDmg = supportFireDmg + rallyDmg;
  const indirectDmg = missile;
  return {
    unitId: def.id,
    name: def.name,
    class: def.class,
    cost: def.cost,
    atk: def.atk,
    aggressive,
    retaliate,
    totalAtk,
    ap: def.ap,
    missile,
    selfAtkDmg,
    allyBuffDmg,
    rallyDmg,
    supportFireDmg,
    indirectDmg,
    specialDmg: special.damage,
    specialName: special.skill,
    totalDmg: selfAtkDmg + allyBuffDmg + indirectDmg + special.damage,
  };
}

function hitsUntilDead(hp: number, dmg: number): number | null {
  if (dmg <= 0) return null;
  return Math.ceil(hp / dmg);
}

export function survivalAgainst(
  def: UnitDef,
  attacker: { name: string; totalAtk: number; ap: number; missile: number },
): SurvivalHits {
  const gunDmg = computeStrikeDamage({
    atk: attacker.totalAtk,
    armor: def.armor,
    armorPiercing: attacker.ap,
  });
  const missileDmg = computeStrikeDamage({
    atk: attacker.missile,
    armor: missileEffectiveArmor(def.armor),
    armorPiercing: 0,
  });
  const attackHitDmg = gunDmg + missileDmg;
  const retaliateHitDmg = gunDmg;
  const cycleDmg = attackHitDmg + retaliateHitDmg;
  return {
    attackerName: attacker.name,
    gunDmg,
    missileDmg,
    attackHitDmg,
    retaliateHitDmg,
    attacksSurvived: hitsUntilDead(def.hp, attackHitDmg),
    retaliatesSurvived: hitsUntilDead(def.hp, retaliateHitDmg),
    cyclesSurvived: hitsUntilDead(def.hp, cycleDmg),
  };
}

export function defenseBreakdownOf(def: UnitDef, catalog: ValueCatalog = valueCatalog()): DefenseBreakdown {
  const avg = catalog.averages;
  return {
    unitId: def.id,
    name: def.name,
    class: def.class,
    cost: def.cost,
    hp: def.hp,
    armor: def.armor,
    hpArmor2: def.hp + def.armor * 2,
    hpArmor3: def.hp + def.armor * 3,
    avgOpp: survivalAgainst(def, {
      name: "Average",
      totalAtk: avg.totalAtk,
      ap: avg.ap,
      missile: avg.missile,
    }),
    maxTotalAtk: survivalAgainst(def, catalog.maxTotalAtk),
    maxAp: survivalAgainst(def, catalog.maxAp),
    maxAtkPlusAp: survivalAgainst(def, catalog.maxAtkPlusAp),
  };
}

export function allOffenseBreakdowns(units: UnitDef[] = UNITS): OffenseBreakdown[] {
  return units.map(offenseBreakdownOf);
}

export function allDefenseBreakdowns(units: UnitDef[] = UNITS, catalog = valueCatalog(units)): DefenseBreakdown[] {
  return units.map((unit) => defenseBreakdownOf(unit, catalog));
}

function fmtHits(n: number | null): string {
  return n === null ? "∞" : String(n);
}

function fmtN(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function survivalCells(row: SurvivalHits): string {
  return `${fmtN(row.attackHitDmg)} / ${fmtHits(row.attacksSurvived)} · ${fmtN(row.retaliateHitDmg)} / ${fmtHits(row.retaliatesSurvived)} · ${fmtHits(row.cyclesSurvived)}`;
}

export function renderUnitValueMarkdown(opts?: { generatedAt?: string; units?: UnitDef[] }): string {
  const units = opts?.units ?? UNITS;
  const generatedAt = opts?.generatedAt ?? new Date().toISOString();
  const catalog = valueCatalog(units);
  const offense = allOffenseBreakdowns(units);
  const defense = allDefenseBreakdowns(units, catalog);
  const avg = catalog.averages;

  const lines: string[] = [
    "# Unit value breakdown — 2-turn damage & defense",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Offense assumptions (2 turns: you attack, then you defend)",
    "",
    "- Target armor is **0**. Missile and gun both deal their full ATK/Missile value.",
    `- Self ATK = (ATK + Aggressive) on your attack + (ATK + Retaliate) on your defend = \`2×ATK + Aggressive + Retaliate\`.`,
    `- Ally buff: ${ASSUMED_SUPPORT_ALLIES} adjacent allies with Support Fire ${ASSUMED_SUPPORT_FIRE} each → +${ASSUMED_SUPPORT_ALLIES * ASSUMED_SUPPORT_FIRE} ATK on **both** volleys = +${ASSUMED_SUPPORT_ALLIES * ASSUMED_SUPPORT_FIRE * 2}. Units with Rally add +3 (played on your attack turn).`,
    "- Indirect = Missile once (only the attacker fires missiles).",
    "- Special = hand-calculated constants in `src/tools/specialSkillDamage.ts`. Utility / buff specials are 0.",
    "",
    "## Defense assumptions",
    "",
    "- Score 1: `HP + Armor × 2`",
    "- Score 2: `HP + Armor × 3`",
    `- Total ATK = ATK + Aggressive + Retaliate. Catalog average: total ATK **${fmtN(avg.totalAtk)}**, AP **${fmtN(avg.ap)}**, Missile **${fmtN(avg.missile)}**.`,
    `- Extreme attackers: max total ATK = **${catalog.maxTotalAtk.name}** (${catalog.maxTotalAtk.totalAtk} ATK, ${catalog.maxTotalAtk.ap} AP, Missile ${catalog.maxTotalAtk.missile}); max AP = **${catalog.maxAp.name}** (${catalog.maxAp.ap} AP, ${catalog.maxAp.totalAtk} ATK, Missile ${catalog.maxAp.missile}); max ATK+AP = **${catalog.maxAtkPlusAp.name}** (${catalog.maxAtkPlusAp.atkPlusAp}).`,
    "- Incoming **attack** hit = gun (`total ATK` vs armor after AP) + missile (50% armor rounded up, no AP).",
    "- Incoming **retaliate** hit = gun only (opponent is immortal; your damage is ignored).",
    "- Survival cells: `atkDmg / atkHits · retalDmg / retalHits · 2-turn cycles` until HP reaches 0. ∞ = that hit deals 0.",
    "",
    "## Offense over 2 turns",
    "",
    "| Unit | Cost | ATK | Agg | Ret | Total ATK | AP | Missile | Self ATK | Ally buff (SF / Rally) | Indirect | Special | Special name | **Total** |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |",
  ];

  const offenseRanked = [...offense].sort((a, b) => b.totalDmg - a.totalDmg || a.cost - b.cost);
  for (const row of offenseRanked) {
    lines.push(
      `| ${row.name} | ${row.cost} | ${row.atk} | ${row.aggressive} | ${row.retaliate} | ${row.totalAtk} | ${row.ap} | ${row.missile} | ${row.selfAtkDmg} | ${row.allyBuffDmg} (${row.supportFireDmg} / ${row.rallyDmg}) | ${row.indirectDmg} | ${row.specialDmg} | ${row.specialName} | **${row.totalDmg}** |`,
    );
  }

  lines.push(
    "",
    "## Special skill constants",
    "",
    "| Unit | Skill | Damage | Note |",
    "| --- | --- | ---: | --- |",
  );
  for (const unit of units) {
    const special = specialSkillDamageOf(unit.id);
    lines.push(`| ${unit.name} | ${special.skill} | ${special.damage} | ${special.note} |`);
  }

  lines.push(
    "",
    "## Defense scores & hits survived",
    "",
    `| Unit | Cost | HP | Armor | HP+2A | HP+3A | vs Average | vs ${catalog.maxTotalAtk.name} (max ATK) | vs ${catalog.maxAp.name} (max AP) | vs ${catalog.maxAtkPlusAp.name} (max ATK+AP) |`,
    "| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |",
  );
  const defenseRanked = [...defense].sort((a, b) => b.hpArmor3 - a.hpArmor3 || b.hp - a.hp);
  for (const row of defenseRanked) {
    lines.push(
      `| ${row.name} | ${row.cost} | ${row.hp} | ${row.armor} | ${row.hpArmor2} | ${row.hpArmor3} | ${survivalCells(row.avgOpp)} | ${survivalCells(row.maxTotalAtk)} | ${survivalCells(row.maxAp)} | ${survivalCells(row.maxAtkPlusAp)} |`,
    );
  }

  lines.push(
    "",
    "### Incoming damage detail",
    "",
    "| Unit | Armor | Avg gun / missile | Max ATK gun / missile | Max AP gun / missile | Max ATK+AP gun / missile |",
    "| --- | ---: | --- | --- | --- | --- |",
  );
  for (const row of defenseRanked) {
    lines.push(
      `| ${row.name} | ${row.armor} | ${fmtN(row.avgOpp.gunDmg)} / ${fmtN(row.avgOpp.missileDmg)} | ${fmtN(row.maxTotalAtk.gunDmg)} / ${fmtN(row.maxTotalAtk.missileDmg)} | ${fmtN(row.maxAp.gunDmg)} / ${fmtN(row.maxAp.missileDmg)} | ${fmtN(row.maxAtkPlusAp.gunDmg)} / ${fmtN(row.maxAtkPlusAp.missileDmg)} |`,
    );
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Support Fire received is identical for every unit under the 2-ally assumption; Rally is the only ally-buff differentiator.",
    "- Ambush: Frontline extra engage (buffed ATK) plus +2 on the regular attack volley. Sticky Bomb: +6 ATK × 2 hits. Deadly Presence stays 0.",
    "- Kamikaze 8 is one-shot and kills the drone; the 2-turn table still adds it as special damage.",
  );

  return `${lines.join("\n")}\n`;
}
