import { UNITS, getUnitDef } from "../data/units";
import { emptyBoard, frontCol, placeUnit, supportCol } from "../engine/board";
import { beginEngagement } from "../engine/combat/engagement";
import { hasKeyword } from "../engine/keywords";
import { mulberry32State } from "../engine/rng";
import type { MatchState, PlayerId, UnitDef, UnitInstance } from "../engine/types";
import { HQ_MAX_HP } from "../engine/types";

export const VACUUM_LANE = 2;

export interface DuelHp {
  attackerId: number;
  defenderId: number;
  attackerHp: number;
  defenderHp: number;
  attackerMax: number;
  defenderMax: number;
}

export type DuelOutcome = "attacker" | "defender" | "mutual" | "both_live";

export function duelOutcome(hp: DuelHp): DuelOutcome {
  const aLive = hp.attackerHp > 0;
  const dLive = hp.defenderHp > 0;
  if (aLive && dLive) return "both_live";
  if (!aLive && !dLive) return "mutual";
  return aLive ? "attacker" : "defender";
}

function blankMatch(attacker: PlayerId): MatchState {
  return {
    players: [
      {
        id: 0,
        hqHp: HQ_MAX_HP,
        triggeredBreakpoints: [],
        commandPoints: 5,
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
        commandPoints: 5,
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
    currentPlayer: attacker,
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
  const battery = hasKeyword(def, "artillery") || hasKeyword(def, "airStrike");
  return battery ? supportCol(owner) : frontCol(owner);
}

export function spawnVacuumUnit(state: MatchState, defId: number, owner: PlayerId): UnitInstance {
  const def = getUnitDef(defId);
  const col = deployCol(owner, def);
  const unit: UnitInstance = {
    instanceId: `vac_${owner}_${def.id}_${state.idSeq + 1}`,
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
    col,
    row: VACUUM_LANE,
    keywords: def.keywords.map((k) => ({ ...k })),
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
  };
  state.idSeq += 1;
  placeUnit(state.board, unit);
  return unit;
}

function livingHp(unit: UnitInstance): number {
  return Math.max(0, unit.hp);
}

/** One engagement: attacker volley + defender counter + attacker missiles. No cards, no relocation, no allies. */
export function simulateVacuumEngagement(attackerId: number, defenderId: number): DuelHp {
  const state = blankMatch(0);
  const attacker = spawnVacuumUnit(state, attackerId, 0);
  const defender = spawnVacuumUnit(state, defenderId, 1);
  beginEngagement(state, { skipRelocation: true, resumePhase: "maneuver" });
  return {
    attackerId,
    defenderId,
    attackerHp: livingHp(attacker),
    defenderHp: livingHp(defender),
    attackerMax: attacker.maxHp,
    defenderMax: defender.maxHp,
  };
}

/** Two engagements: firstId strikes, then secondId strikes if both still live. HP carries over. */
export function simulateVacuumExchange(firstId: number, secondId: number): DuelHp {
  const state = blankMatch(0);
  const first = spawnVacuumUnit(state, firstId, 0);
  const second = spawnVacuumUnit(state, secondId, 1);
  beginEngagement(state, { skipRelocation: true, resumePhase: "maneuver" });
  if (livingHp(first) > 0 && livingHp(second) > 0) {
    state.currentPlayer = 1;
    state.phase = "maneuver";
    state.combatPlayback = null;
    beginEngagement(state, { skipRelocation: true, resumePhase: "maneuver" });
  }
  return {
    attackerId: firstId,
    defenderId: secondId,
    attackerHp: livingHp(first),
    defenderHp: livingHp(second),
    attackerMax: first.maxHp,
    defenderMax: second.maxHp,
  };
}

export function allVacuumEngagements(units = UNITS): DuelHp[] {
  const rows: DuelHp[] = [];
  for (const attacker of units) {
    for (const defender of units) {
      rows.push(simulateVacuumEngagement(attacker.id, defender.id));
    }
  }
  return rows;
}

export function allVacuumExchanges(units = UNITS): DuelHp[] {
  const rows: DuelHp[] = [];
  for (const first of units) {
    for (const second of units) {
      rows.push(simulateVacuumExchange(first.id, second.id));
    }
  }
  return rows;
}

export function shortCodes(units: UnitDef[] = UNITS): Record<number, string> {
  const used = new Set<string>();
  const codes: Record<number, string> = {};
  for (const unit of units) {
    const tokens = unit.name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
    const candidates = [
      tokens[0],
      tokens[tokens.length - 1],
      tokens.map((t) => t.slice(0, 3)).join(""),
      tokens.map((t) => t[0]).join(""),
      String(unit.id),
    ];
    let code = "";
    for (const raw of candidates) {
      const next = raw.slice(0, 8);
      if (next && !used.has(next.toLowerCase())) {
        code = next;
        break;
      }
    }
    if (!code) {
      let n = 2;
      const base = tokens[0].slice(0, 6);
      code = `${base}${n}`;
      while (used.has(code.toLowerCase())) {
        n += 1;
        code = `${base}${n}`;
      }
    }
    used.add(code.toLowerCase());
    codes[unit.id] = code;
  }
  return codes;
}

function cellHp(row: DuelHp): string {
  return `${row.attackerHp}/${row.defenderHp}`;
}

function outcomeMark(row: DuelHp): string {
  switch (duelOutcome(row)) {
    case "attacker":
      return "W";
    case "defender":
      return "L";
    case "mutual":
      return "X";
    default:
      return "·";
  }
}

function indexDuels(rows: DuelHp[]): Map<string, DuelHp> {
  const map = new Map<string, DuelHp>();
  for (const row of rows) map.set(`${row.attackerId}__${row.defenderId}`, row);
  return map;
}

function keywordLabel(def: UnitDef): string {
  if (def.keywords.length === 0) return "—";
  return def.keywords.map((k) => (k.value && !["cover", "flank", "blitz", "artillery", "airStrike", "jetPlane"].includes(k.name) ? `${k.name} ${k.value}` : k.name)).join(", ");
}

function summaryRows(engagements: DuelHp[], units: UnitDef[]) {
  return units.map((unit) => {
    const asAtk = engagements.filter((d) => d.attackerId === unit.id && d.defenderId !== unit.id);
    const asDef = engagements.filter((d) => d.defenderId === unit.id && d.attackerId !== unit.id);
    const count = (rows: DuelHp[], who: "attacker" | "defender") =>
      rows.filter((d) => {
        const o = duelOutcome(d);
        if (who === "attacker") return o === "attacker";
        return o === "defender";
      }).length;
    const avgHp = (rows: DuelHp[], side: "attacker" | "defender") => {
      if (rows.length === 0) return 0;
      const sum = rows.reduce((n, d) => n + (side === "attacker" ? d.attackerHp : d.defenderHp), 0);
      return sum / rows.length;
    };
    return {
      id: unit.id,
      name: unit.name,
      atkWin: count(asAtk, "attacker"),
      atkLose: count(asAtk, "defender"),
      atkMutual: asAtk.filter((d) => duelOutcome(d) === "mutual").length,
      atkLive: asAtk.filter((d) => duelOutcome(d) === "both_live").length,
      defWin: count(asDef, "defender"),
      defLose: count(asDef, "attacker"),
      defMutual: asDef.filter((d) => duelOutcome(d) === "mutual").length,
      defLive: asDef.filter((d) => duelOutcome(d) === "both_live").length,
      avgHpAtk: avgHp(asAtk, "attacker"),
      avgHpDef: avgHp(asDef, "defender"),
      n: asAtk.length,
    };
  });
}

function firstStrikeFlips(engagements: DuelHp[], units: UnitDef[]): string[] {
  const map = indexDuels(engagements);
  const lines: string[] = [];
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const a = units[i];
      const b = units[j];
      const aFirst = map.get(`${a.id}__${b.id}`);
      const bFirst = map.get(`${b.id}__${a.id}`);
      if (!aFirst || !bFirst) continue;
      const aWinner = duelOutcome(aFirst);
      const bWinner = duelOutcome(bFirst);
      const aKills = aWinner === "attacker" || aWinner === "mutual";
      const bKills = bWinner === "attacker" || bWinner === "mutual";
      const aDies = aWinner === "defender" || aWinner === "mutual";
      const bDiesAsAtk = bWinner === "defender" || bWinner === "mutual";
      if (aKills !== bDiesAsAtk || aDies !== bKills) {
        lines.push(
          `- **${a.name}** vs **${b.name}**: ${a.name} trước → ${cellHp(aFirst)} (${aWinner}); ${b.name} trước → ${bFirst.attackerHp}/${bFirst.defenderHp} (${bWinner})`,
        );
      }
    }
  }
  return lines;
}

function hpMatrix(title: string, rows: DuelHp[], units: UnitDef[], codes: Record<number, string>): string[] {
  const map = indexDuels(rows);
  const head = ["Hàng = attacker", ...units.map((u) => codes[u.id])];
  const out = [
    `### ${title}`,
    "",
    "Ô: `HP attacker / HP defender` sau combat. 0 = chết.",
    "",
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
  ];
  for (const attacker of units) {
    const cells = units.map((defender) => {
      const duel = map.get(`${attacker.id}__${defender.id}`);
      return duel ? `${cellHp(duel)} ${outcomeMark(duel)}` : "—";
    });
    out.push(`| ${codes[attacker.id]} | ${cells.join(" | ")} |`);
  }
  out.push("");
  return out;
}

export function renderVacuumDuelMarkdown(opts?: { generatedAt?: string; units?: UnitDef[] }): string {
  const units = opts?.units ?? UNITS;
  const generatedAt = opts?.generatedAt ?? new Date().toISOString();
  const engagements = allVacuumEngagements(units);
  const exchanges = allVacuumExchanges(units);
  const codes = shortCodes(units);
  const summary = summaryRows(engagements, units);
  const flips = firstStrikeFlips(engagements, units);

  const lines: string[] = [
    "# Vacuum 1v1 — remaining HP",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Assumptions",
    "",
    "- Two units only, same lane, no cards, no Cover/Flank relocation, no allied Support Fire.",
    "- Artillery / Air Strike stay on Support; everyone else on Frontline.",
    "- **One engagement:** attacker volley (ATK + Aggressive + AP) → defender counter (ATK + Retaliate + AP) → attacker missiles (50% armor rounded down, no AP).",
    "- **Two-round exchange:** that engagement, then roles reverse with leftover HP if both still live.",
    "- Cell mark: `W` attacker lives & defender dies, `L` attacker dies, `X` both die, `·` both live.",
    "",
    "## Roster / short codes",
    "",
    "| Code | Name | Class | Cost | HP | ATK | Armor | AP | Keywords |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const unit of units) {
    lines.push(
      `| ${codes[unit.id]} | ${unit.name} | ${unit.class} | ${unit.cost} | ${unit.hp} | ${unit.atk} | ${unit.armor} | ${unit.ap} | ${keywordLabel(unit)} |`,
    );
  }

  lines.push("", "## One engagement (row attacks first)", "");
  lines.push(...hpMatrix("Remaining HP after 1 engagement", engagements, units, codes));

  lines.push("## Two-round exchange (row then column)", "");
  lines.push(
    "Hàng đánh trước, rồi cột đánh lại nếu cả hai còn sống. Ô `B then A` là transpose: xem ô (cột, hàng).",
    "",
  );
  lines.push(...hpMatrix("Remaining HP after A→B exchange", exchanges, units, codes));

  lines.push("## Scoreboard (one engagement, excluding mirror)", "");
  lines.push(
    "| Unit | As attacker W/L/X/· | As defender W/L/X/· | Avg HP left (atk) | Avg HP left (def) |",
    "| --- | --- | --- | ---: | ---: |",
  );
  const ranked = [...summary].sort((a, b) => b.atkWin - a.atkWin || b.avgHpAtk - a.avgHpAtk);
  for (const row of ranked) {
    lines.push(
      `| ${row.name} | ${row.atkWin}/${row.atkLose}/${row.atkMutual}/${row.atkLive} | ${row.defWin}/${row.defLose}/${row.defMutual}/${row.defLive} | ${row.avgHpAtk.toFixed(1)} | ${row.avgHpDef.toFixed(1)} |`,
    );
  }

  lines.push("", "## First-strike flips", "");
  if (flips.length === 0) {
    lines.push("No pair changes kill/survival based on who strikes first (excluding both-live).");
  } else {
    lines.push("Pairs where who goes first changes whether someone dies:", "", ...flips);
  }

  lines.push("", "## Per-unit leftover HP (one engagement)", "");
  for (const unit of units) {
    const asAtk = engagements.filter((d) => d.attackerId === unit.id);
    const asDef = engagements.filter((d) => d.defenderId === unit.id);
    lines.push(`<details><summary>${unit.name}</summary>`, "", `Attacker vs …`, "");
    lines.push("| Enemy | HP (me/them) |", "| --- | --- |");
    for (const row of asAtk) {
      const enemy = getUnitDef(row.defenderId).name;
      lines.push(`| ${enemy} | ${cellHp(row)} |`);
    }
    lines.push("", `Defender vs … (enemy attacks first)`, "");
    lines.push("| Enemy | HP (them/me) |", "| --- | --- |");
    for (const row of asDef) {
      const enemy = getUnitDef(row.attackerId).name;
      lines.push(`| ${enemy} | ${cellHp(row)} |`);
    }
    lines.push("", "</details>", "");
  }

  return `${lines.join("\n")}\n`;
}
