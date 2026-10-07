import { UNITS } from "../data/units";
import type { UnitDef } from "../engine/types";
import { specialSkillDamageOf } from "./specialSkillDamage";
import {
  allDefenseBreakdowns,
  allOffenseBreakdowns,
  type DefenseBreakdown,
  type OffenseBreakdown,
} from "./unitValueBreakdown";
import {
  allVacuumEngagements,
  allVacuumExchanges,
  duelOutcome,
  type DuelHp,
} from "./vacuumDuel";

export type PowerBand = "over" | "under" | "role" | "ok";

export interface VacuumRecord {
  id: number;
  atkWin: number;
  atkLose: number;
  atkMutual: number;
  atkLive: number;
  defWin: number;
  defLose: number;
  avgHpAtk: number;
  avgHpDef: number;
  xWin: number;
  xLose: number;
}

export interface PowerRow {
  id: number;
  name: string;
  class: UnitDef["class"];
  cost: number;
  hp: number;
  armor: number;
  atk: number;
  ap: number;
  offense: OffenseBreakdown;
  defense: DefenseBreakdown;
  vacuum: VacuumRecord;
  exchange: VacuumRecord;
  dmgPerCost: number;
  defPerCost: number;
  specials: Array<{ name: string; text: string }>;
  band: PowerBand;
  why: string;
}

function tally(rows: DuelHp[], unitId: number, side: "attacker" | "defender"): VacuumRecord {
  const mine = rows.filter((d) => (side === "attacker" ? d.attackerId === unitId : d.defenderId === unitId));
  const vsOther = mine.filter((d) => d.attackerId !== d.defenderId);
  const avg = (list: DuelHp[], pick: (d: DuelHp) => number) =>
    list.length === 0 ? 0 : list.reduce((n, d) => n + pick(d), 0) / list.length;
  const win = vsOther.filter((d) =>
    side === "attacker" ? duelOutcome(d) === "attacker" : duelOutcome(d) === "defender",
  ).length;
  const lose = vsOther.filter((d) =>
    side === "attacker" ? duelOutcome(d) === "defender" : duelOutcome(d) === "attacker",
  ).length;
  const mutual = vsOther.filter((d) => duelOutcome(d) === "mutual").length;
  const live = vsOther.filter((d) => duelOutcome(d) === "both_live").length;
  return {
    id: unitId,
    atkWin: side === "attacker" ? win : 0,
    atkLose: side === "attacker" ? lose : 0,
    atkMutual: side === "attacker" ? mutual : 0,
    atkLive: side === "attacker" ? live : 0,
    defWin: side === "defender" ? win : 0,
    defLose: side === "defender" ? lose : 0,
    avgHpAtk: side === "attacker" ? avg(vsOther, (d) => d.attackerHp) : 0,
    avgHpDef: side === "defender" ? avg(vsOther, (d) => d.defenderHp) : 0,
    xWin: 0,
    xLose: 0,
  };
}

function mergeVacuum(atk: VacuumRecord, def: VacuumRecord, exAtk: VacuumRecord): VacuumRecord {
  return {
    ...atk,
    defWin: def.defWin,
    defLose: def.defLose,
    avgHpDef: def.avgHpDef,
    xWin: exAtk.atkWin,
    xLose: exAtk.atkLose,
  };
}

const BAND: Record<number, { band: PowerBand; why: string }> = {
  3: {
    band: "over",
    why: "HP 10 + Armor 8 + Retaliate 5. ATK 2 / AP 0. Wall mỏng hơn, 2-round first-strike không xóa roster.",
  },
  1: {
    band: "over",
    why: "HP 10 + Armor 6 + ATK 3 + AP 2, Missile 5 + Thunder Strike. Vẫn tank/missile nhưng mỏng hơn.",
  },
  13: {
    band: "over",
    why: "15 HP / Armor 4 / Retaliate 2 / ATK 5. Vẫn robot tank, retaliate yếu hơn.",
  },
  2: {
    band: "over",
    why: "ATK 3 / Armor 3 / AP 6. Ambush 3S: Frontline only, +2 ARM +2 ATK rồi engage. Burst phụ thuộc skill + vị trí.",
  },
  6: {
    band: "over",
    why: "Cost 3, ATK 4 / Armor 3 / AP 2. Cover only. Còn rẻ nhưng giáp mỏng hơn.",
  },
  27: {
    band: "under",
    why: "Vẫn 3 HP, nhưng ATK 8 / AP 8 / Hit & Run 1 cost. Glass cannon rẻ hơn về skill; 1v1 vẫn dễ chết.",
  },
  26: {
    band: "under",
    why: "Stat giữ vì Flank. Silent Death 1 cost. Combat 6-cost vẫn dựa utility hơn 1v1.",
  },
  20: {
    band: "under",
    why: "14 HP / 4 ATK (buff). Aggressive 3 + Cover. Thân khỏe hơn Phantom, còn cost 5.",
  },
  25: {
    band: "under",
    why: "13 HP (buff), Death from Above 2 cost. AP 0 nên 1v1 vs armor vẫn yếu; team missile buff rẻ hơn.",
  },
  8: {
    band: "over",
    why: "Cost 4, Missile 4. Khỏe chủ yếu khi có Tactical Strike; vacuum 1v1 không tính Rally/skill.",
  },
  7: {
    band: "over",
    why: "Cost 5, ATK 6 + Retaliate 3. Rally không phải lúc nào cũng có; base combat vẫn ổn.",
  },
  5: {
    band: "ok",
    why: "Support Fire 2 + Flank + Repair/Supply. Combat không phải vai trò chính.",
  },
  15: {
    band: "ok",
    why: "Analyze Weakness + Support Fire. Combat dưới Aegis nhưng kit utility ổn.",
  },
  19: {
    band: "ok",
    why: "Support Fire 2 + Flank + Diversion. Combat dưới Jackal, kit support đủ.",
  },
  22: {
    band: "role",
    why: "Cost 2, 4 HP, 0W/20L. Đúng vai trò spotter (Target Acquired + 2 Artillery Call). Đừng buff HP nếu utility đã đủ.",
  },
  24: {
    band: "role",
    why: "Cost 2, HQ Repair 7 + Supply + SF 2. Combat 1v1 gần như luôn chết — đúng support.",
  },
  23: {
    band: "role",
    why: "Cost 2, 8 ignore-armor rồi chết. Bảng 0-armor đẩy total lên 32 (trông OP) nhưng vacuum 1v1 luôn tự sát. Skill là toàn bộ unit.",
  },
  10: {
    band: "role",
    why: "Artillery 8 HP 0 armor. Vacuum 1v1 là worst case (địch bắn lại). Vai trò bắn HQ / hàng sau; Storm Caller + Missile 3.",
  },
  11: {
    band: "role",
    why: "Cùng khung artillery giấy. Quick Mobilization +6 là burst. Không kết luận UP từ 1v1.",
  },
  12: {
    band: "role",
    why: "AP 7 nhưng 8 HP 0 armor. Precision Strike anywhere. Vacuum 1v1 không phản ánh artillery.",
  },
  17: {
    band: "role",
    why: "0 ATK khi đánh trước by design. Avg HP 15, 7 kill khi thủ. Wall + Entrenchment — không underpower.",
  },
  4: {
    band: "ok",
    why: "Cost 4, Armor 2, Flank/Blitz. Combat ổn cho light vehicle; Intel Acquired là utility.",
  },
  21: {
    band: "ok",
    why: "Cost 3, combat gần Death Rider cost 5. Flanker rẻ — efficient, không UP.",
  },
  9: {
    band: "ok",
    why: "Cost 4, 14 HP, SF 2, Blitz. Combat giữa bảng. Vision Support là team AP.",
  },
  14: {
    band: "ok",
    why: "Cost 5, Aggressive 3, combat giữa bảng. Coordinate là utility lane.",
  },
  18: {
    band: "ok",
    why: "Cost 4, 19 HP, Retaliate 3. Tank infantry rẻ. First-aid Kit là heal team.",
  },
  16: {
    band: "ok",
    why: "Cost 4, 18 HP, AP 8, Sticky Bomb 12 trên 2 hit. 0 kill vacuum vì ATK gốc 2; skill + AP là identity.",
  },
};

function specialsOf(def: UnitDef): Array<{ name: string; text: string }> {
  return def.cards.filter((c) => c.type === "special").map((c) => ({ name: c.name, text: c.text }));
}

export function buildPowerRows(units: UnitDef[] = UNITS): PowerRow[] {
  const engagements = allVacuumEngagements(units);
  const exchanges = allVacuumExchanges(units);
  const offense = allOffenseBreakdowns(units);
  const defense = allDefenseBreakdowns(units);
  const offBy = Object.fromEntries(offense.map((r) => [r.unitId, r]));
  const defBy = Object.fromEntries(defense.map((r) => [r.unitId, r]));

  return units.map((unit) => {
    const vac = mergeVacuum(
      tally(engagements, unit.id, "attacker"),
      tally(engagements, unit.id, "defender"),
      tally(exchanges, unit.id, "attacker"),
    );
    const off = offBy[unit.id];
    const def = defBy[unit.id];
    const meta = BAND[unit.id] ?? { band: "ok" as const, why: "Giữa bảng." };
    return {
      id: unit.id,
      name: unit.name,
      class: unit.class,
      cost: unit.cost,
      hp: unit.hp,
      armor: unit.armor,
      atk: unit.atk,
      ap: unit.ap,
      offense: off,
      defense: def,
      vacuum: vac,
      exchange: vac,
      dmgPerCost: off.totalDmg / unit.cost,
      defPerCost: def.hpArmor3 / unit.cost,
      specials: specialsOf(unit),
      band: meta.band,
      why: meta.why,
    };
  });
}

function fmt(n: number, d = 1): string {
  return n.toFixed(d);
}

export function renderPowerAnalysisMarkdown(rows: PowerRow[], generatedAt: string): string {
  const over = rows.filter((r) => r.band === "over");
  const under = rows.filter((r) => r.band === "under");
  const role = rows.filter((r) => r.band === "role");
  const ranked = [...rows].sort((a, b) => b.vacuum.xWin - a.vacuum.xWin || b.vacuum.avgHpAtk - a.vacuum.avgHpAtk);

  const lines: string[] = [
    "# Power analysis — overpower / underpower",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Cách đọc",
    "",
    "- **Vacuum 1v1** đo combat thuần (không bài, không ally). Artillery/drone giấy sẽ trông yếu hơn trên bàn thật.",
    "- **2-turn damage** giả định địch 0 armor + 2 Support Fire allies — phóng đại missile/special, bỏ qua armor-shred.",
    "- Kết luận **over/under** ưu tiên: leftover HP + kill vacuum, rồi dmg/cost và def/cost. Unit **role** không nên buff stat nếu skill utility đã đủ.",
    "- Cột **2-round W/L** = thắng/thua sau A đánh rồi B đánh lại (nếu cả hai còn sống).",
    "",
    "## Ranking (2-round first-strike wins)",
    "",
    "| Unit | Cost | 1-eng W/L (atk) | 2-round W/L | Avg HP atk/def | Dmg/cost | HP+3A/cost | Band |",
    "| --- | ---: | --- | --- | --- | ---: | ---: | --- |",
  ];

  for (const row of ranked) {
    lines.push(
      `| ${row.name} | ${row.cost} | ${row.vacuum.atkWin}/${row.vacuum.atkLose} | ${row.vacuum.xWin}/${row.vacuum.xLose} | ${fmt(row.vacuum.avgHpAtk)} / ${fmt(row.vacuum.avgHpDef)} | ${fmt(row.dmgPerCost, 2)} | ${fmt(row.defPerCost, 2)} | ${row.band} |`,
    );
  }

  lines.push("", "## Overpower", "");
  for (const row of over) {
    lines.push(`### ${row.name} (${row.cost} cost)`, "", row.why, "");
    lines.push(
      `- Vacuum 1-eng: atk ${row.vacuum.atkWin}W/${row.vacuum.atkLose}L, def ${row.vacuum.defWin}W. 2-round first: ${row.vacuum.xWin}W/${row.vacuum.xLose}L.`,
      `- 2-turn dmg ${row.offense.totalDmg} (${fmt(row.dmgPerCost, 2)}/cost). HP+3A ${row.defense.hpArmor3} (${fmt(row.defPerCost, 2)}/cost).`,
      "",
    );
  }

  lines.push("## Underpower — xem skill trước khi buff stat", "");
  lines.push(
    "Những unit dưới đây **combat không trả đủ cost**. Việc tiếp theo của bạn: skill/utility có đủ bù không. Nếu không → buff (HP/ATK/AP/cost). Nếu có → giữ.",
    "",
  );
  for (const row of under) {
    const spec = specialSkillDamageOf(row.id);
    lines.push(`### ${row.name} (${row.cost} cost, ${row.class})`, "", row.why, "");
    lines.push("**Specials (để review utility):**", "");
    for (const card of row.specials) {
      lines.push(`- **${card.name}** — ${card.text}`);
    }
    if (row.specials.length === 0) lines.push("- (không có special)");
    lines.push(
      "",
      `- Special-dmg constant: ${spec.damage} (${spec.note})`,
      `- Vacuum: atk ${row.vacuum.atkWin}W/${row.vacuum.atkLose}L, def ${row.vacuum.defWin}W/${row.vacuum.defLose}L, avg HP ${fmt(row.vacuum.avgHpAtk)}/${fmt(row.vacuum.avgHpDef)}. 2-round ${row.vacuum.xWin}W/${row.vacuum.xLose}L.`,
      `- 2-turn dmg ${row.offense.totalDmg} (${fmt(row.dmgPerCost, 2)}/cost). HP+3A ${row.defense.hpArmor3}.`,
      "",
    );
  }

  lines.push("## Role — đừng kết luận UP từ 1v1", "");
  for (const row of role) {
    lines.push(`### ${row.name} (${row.cost} cost)`, "", row.why, "");
    if (row.specials.length) {
      for (const card of row.specials) lines.push(`- **${card.name}** — ${card.text}`);
      lines.push("");
    }
  }

  lines.push(
    "## Gợi ý ưu tiên review",
    "",
    "1. **Komet Fighter** — ứng viên buff rõ nhất (cost 6 / 3 HP). Hit & Run phải cực mạnh mới đáng 6; nếu không, hạ cost hoặc thêm HP.",
    "2. **Stealthray Bomber** — Silent Death + Artillery Call vs cost 6. So với Viper 5 thì combat thua; utility phải rất đáng.",
    "3. **Death Rider** — Deadly Presence vs Phantom 3-cost cùng thân. Có thể hạ cost hoặc thêm HP/armor.",
    "4. **Ironclad Goliath** — Analyze Weakness bị bảng 0-armor giấu; trên bàn có armor thì khá hơn. So Aegis cùng 6 cost thì vẫn thua tank.",
    "5. **Nomad / Scout Biker / Tempest** — kit support. Chỉ buff combat nếu bạn muốn chúng cũng 1v1 được.",
    "",
    "Không cần buff: **Trench Guard** (wall), **Jackal/Phantom** (flanker rẻ), artillery (đo sai context), drone support/kamikaze (payoff skill).",
    "",
  );

  return `${lines.join("\n")}\n`;
}
