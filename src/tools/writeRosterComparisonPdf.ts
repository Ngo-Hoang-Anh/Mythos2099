/**
 * Roster balance PDF — deathmatch / HQ-4 / skills + utility + note.
 * Run: npm run balance:roster
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { UNITS } from "../data/units";
import { hasKeyword, keywordValue } from "../engine/keywords";
import type { KeywordName, UnitDef } from "../engine/types";
import { allExtendedScores, type UnitExtendedScore } from "./vacuumExtended";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx]!;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

/** Signed delta vs roster average, e.g. +4.2 / −1.0 */
function deltaVsAvg(value: number, avg: number): string {
  const d = value - avg;
  const s = (Math.round(d * 10) / 10).toFixed(1);
  return d >= 0 ? `+${s}` : s;
}

/** Sustained gun power only — excludes one-shot First Strike and situational Shock. */
function gunPower(def: UnitDef): number {
  return def.atk + keywordValue(def, "aggressive") + keywordValue(def, "retaliate");
}

/** Effective toughness: Armor counts ×3 (e.g. 10 HP + 6 Armor → bulk 28). */
function bulkScore(def: UnitDef): number {
  return def.hp + def.armor * 3;
}

function utilityOf(def: UnitDef, thresholds: { atk: number; ap: number; armor: number; bulk: number }): string {
  const tags: string[] = [];
  const totalGun = gunPower(def);
  const bulk = bulkScore(def);
  const fs = keywordValue(def, "firstStrike");
  const shock = keywordValue(def, "shock");

  if (keywordValue(def, "supportFire") > 0) tags.push(`Support Fire ${keywordValue(def, "supportFire")}`);
  if (totalGun >= thresholds.atk) tags.push(`ATK cao (${totalGun})`);
  if (def.ap >= thresholds.ap) tags.push(`AP cao (${def.ap})`);
  if (def.armor >= thresholds.armor) tags.push(`Armor cao (${def.armor})`);
  if (bulk >= thresholds.bulk) tags.push(`Bulk cao (${bulk})`);
  if (fs > 0) tags.push(`First Strike ${fs} (1 lần)`);
  if (shock > 0) tags.push(`Shock ${shock} (vs Shield/Barrier)`);

  const numbered: Array<[KeywordName, string]> = [
    ["missile", "Missile"],
    ["veteran", "Veteran"],
    ["fire", "Fire"],
    ["corrosion", "Corrosion"],
    ["shield", "Shield"],
    ["barrier", "Barrier"],
    ["retaliate", "Retaliate"],
    ["aggressive", "Aggressive"],
  ];
  for (const [key, label] of numbered) {
    const n = keywordValue(def, key);
    if (n > 0) tags.push(`${label} ${n}`);
  }

  const flags: Array<[KeywordName, string]> = [
    ["suppression", "Suppression"],
    ["smokeScreen", "Smoke"],
    ["scout", "Scout"],
    ["radar", "Radar"],
    ["camouflage", "Camouflage"],
    ["slopedArmor", "Sloped"],
    ["hulldown", "Hulldown"],
    ["blitz", "Blitz"],
    ["flank", "Flank"],
    ["cover", "Cover"],
    ["artillery", "Artillery"],
    ["jetPlane", "Jet"],
  ];
  for (const [key, label] of flags) {
    if (hasKeyword(def, key)) tags.push(label);
  }

  return tags.length ? tags.join(", ") : "—";
}

type Strength = "OP" | "Solo+HQ" | "Solo+Skill" | "HQ+Skill" | "Solo" | "HQ" | "Skill" | "Weak" | "OK";

function noteOf(
  row: UnitExtendedScore,
  thr: { win: number; hq: number; skill: number; weakWin: number; weakHq: number },
): { strength: Strength; text: string } {
  const solo = row.deathWin >= thr.win;
  const hq = row.hqDmg4 >= thr.hq;
  const skill = row.skillWin >= thr.skill;
  const weak = row.deathWin <= thr.weakWin && row.hqDmg4 <= thr.weakHq && row.skillWin <= thr.weakWin;

  if (solo && hq && skill) {
    return { strength: "OP", text: "Quá mạnh — solo + HQ + skill đều cao" };
  }
  if (solo && hq) return { strength: "Solo+HQ", text: "Solo + bắn HQ khỏe" };
  if (solo && skill) return { strength: "Solo+Skill", text: "Solo + skill khỏe" };
  if (hq && skill) return { strength: "HQ+Skill", text: "HQ + skill khỏe" };
  if (solo) return { strength: "Solo", text: "Solo khỏe" };
  if (hq) return { strength: "HQ", text: "Bắn HQ khỏe" };
  if (skill) return { strength: "Skill", text: "Skill khỏe (1v1 thường)" };
  if (weak) return { strength: "Weak", text: "Yếu trên 3 trục — xem utility" };
  return { strength: "OK", text: "Ổn / giữa bảng" };
}

const CSS = `
:root { --ink:#1a1d21; --muted:#5a6270; --line:#d0d5dd; --accent:#1f4b7a; }
* { box-sizing: border-box; }
body { margin: 0; font: 10.5px/1.35 "Segoe UI", system-ui, sans-serif; color: var(--ink); }
h1 { font-size: 17px; margin: 0 0 6px; color: var(--accent); }
h2 { font-size: 12.5px; margin: 12px 0 6px; border-bottom: 2px solid var(--accent); color: var(--accent); padding-bottom: 2px; }
.muted { color: var(--muted); font-size: 9px; }
.note { color: var(--muted); font-style: italic; margin: 0 0 8px; font-size: 9px; }
table { border-collapse: collapse; width: 100%; margin: 0 0 10px; }
th, td { border: 1px solid var(--line); padding: 3px 5px; vertical-align: top; }
th { background: #e8eef5; color: var(--accent); font-weight: 650; }
th .sub { display: block; font-weight: 500; color: var(--muted); font-size: 8px; margin-top: 1px; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
td .delta { display: block; color: var(--muted); font-size: 8px; }
.new { font-weight: 650; }
.OP { background: #ffe2cc; }
.Solo\\+HQ, .Solo\\+Skill, .HQ\\+Skill { background: #fff4ec; }
.Weak { background: #eef8f1; }
.util { font-size: 9px; max-width: 220px; }
ul { margin: 0 0 8px; padding-left: 1.2em; }
@page { size: A3 landscape; margin: 9mm; }
@media print { thead { display: table-header-group; } }
`;

function wl(win: number, lose: number, mutual: number, timeout: number): string {
  const extra =
    mutual || timeout
      ? ` <span class="muted">(X${mutual}${timeout ? ` T${timeout}` : ""})</span>`
      : "";
  return `${win}/${lose}${extra}`;
}

function renderHtml(
  rows: Array<
    UnitExtendedScore & { utility: string; strength: Strength; note: string }
  >,
  generatedAt: string,
  thr: { win: number; hq: number; skill: number },
  avg: { win: number; hq: number; skill: number; cost: number },
): string {
  const byDeath = [...rows].sort(
    (a, b) => b.deathWin - a.deathWin || b.hqDmg4 - a.hqDmg4 || a.deathLose - b.deathLose,
  );

  const body = byDeath
    .map((r) => {
      const cls = r.strength === "OP" ? "OP" : r.strength === "Weak" ? "Weak" : r.strength.includes("+") ? "OP" : "";
      return `<tr class="${cls}">
<td class="num">${r.id}</td>
<td class="${r.era === "new" ? "new" : ""}">${esc(r.name)}</td>
<td class="num">${r.cost}</td>
<td class="num">${wl(r.deathWin, r.deathLose, r.deathMutual, r.deathTimeout)}<span class="delta">${deltaVsAvg(r.deathWin, avg.win)} vs avg</span></td>
<td class="num">${r.hqDmg4}<span class="delta">${deltaVsAvg(r.hqDmg4, avg.hq)} vs avg</span></td>
<td class="num">${wl(r.skillWin, r.skillLose, r.skillMutual, r.skillTimeout)}<span class="delta">${deltaVsAvg(r.skillWin, avg.skill)} vs avg</span></td>
<td class="util">${esc(r.utility)}</td>
<td><b>${esc(r.strength)}</b> — ${esc(r.note)}</td>
</tr>`;
    })
    .join("");

  const opList = byDeath
    .filter((r) => r.strength === "OP" || r.strength.includes("+"))
    .map((r) => `<li><b>${esc(r.name)}</b> (${r.cost}S) — ${esc(r.note)}</li>`)
    .join("");

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Roster deathmatch / HQ / skills</title><style>${CSS}</style></head><body>
<h1>Roster balance — Deathmatch · HQ 4T · Skills</h1>
<p class="muted">Generated ${esc(generatedAt)} · ${rows.length} units · Avg: Death W ${round1(avg.win)}, HQ ${round1(avg.hq)}, Skill W ${round1(avg.skill)}, Cost ${round1(avg.cost)} · OP tag ≈P75: Death≥${thr.win}, HQ≥${thr.hq}, Skill≥${thr.skill}</p>
<p class="note">Δ dưới mỗi số = so với trung bình roster (không phải P75). Deathmatch: đánh đến chết. Smoke/Barrier ON/OFF mỗi lượt (ON đầu). Fire DoT, Suppression (2 lượt địch; cộng dồn khi chỉ 1 mục tiêu), Veteran, SF=tự buff. Skill = special 1 lần/bên. Bulk = HP + Armor×3. ATK cao = ATK+Aggressive+Retaliate.</p>

<h2>Ưu tiên xem (OP / combo mạnh)</h2>
<ul>${opList || "<li>Không có</li>"}</ul>

<h2>All units</h2>
<table><thead><tr>
<th class="num">Id</th><th>Unit</th><th class="num">Cost<span class="sub">avg ${round1(avg.cost)}</span></th>
<th class="num">Deathmatch W/L<span class="sub">avg W ${round1(avg.win)} · P75≥${thr.win}</span></th>
<th class="num">HQ dmg 4T<span class="sub">avg ${round1(avg.hq)} · P75≥${thr.hq}</span></th>
<th class="num">Skills W/L<span class="sub">avg W ${round1(avg.skill)} · P75≥${thr.skill}</span></th>
<th>Utility</th>
<th>Note</th>
</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}

function findBrowser(): string {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("Chrome/Edge not found");
  return found;
}

function printPdf(browser: string, htmlPath: string, pdfPath: string): void {
  const profile = join(tmpdir(), "armored-legend-roster-pdf");
  mkdirSync(profile, { recursive: true });
  const result = spawnSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-pdf-header-footer",
      `--user-data-dir=${profile}`,
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit", timeout: 180000 },
  );
  if (result.status !== 0) throw new Error(`PDF print failed (exit ${result.status})`);
}

function main(): void {
  const generatedAt = new Date().toISOString();
  console.log(`Scoring ${UNITS.length} units (deathmatch × skills × HQ)…`);
  const t0 = Date.now();
  const raw = allExtendedScores(UNITS);
  console.log(`Scored in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const wins = [...raw.map((r) => r.deathWin)].sort((a, b) => a - b);
  const hqs = [...raw.map((r) => r.hqDmg4)].sort((a, b) => a - b);
  const skills = [...raw.map((r) => r.skillWin)].sort((a, b) => a - b);
  const thr = {
    win: percentile(wins, 0.75),
    hq: percentile(hqs, 0.75),
    skill: percentile(skills, 0.75),
    weakWin: percentile(wins, 0.25),
    weakHq: percentile(hqs, 0.25),
  };
  const avg = {
    win: mean(raw.map((r) => r.deathWin)),
    hq: mean(raw.map((r) => r.hqDmg4)),
    skill: mean(raw.map((r) => r.skillWin)),
    cost: mean(raw.map((r) => r.cost)),
  };

  const atkVals = UNITS.map(gunPower).sort((a, b) => a - b);
  const apVals = UNITS.map((u) => u.ap).sort((a, b) => a - b);
  const armorVals = UNITS.map((u) => u.armor).sort((a, b) => a - b);
  const bulkVals = UNITS.map((u) => bulkScore(u)).sort((a, b) => a - b);
  const utilThr = {
    atk: percentile(atkVals, 0.75),
    ap: percentile(apVals, 0.75),
    armor: percentile(armorVals, 0.75),
    bulk: percentile(bulkVals, 0.75),
  };

  const byId = Object.fromEntries(UNITS.map((u) => [u.id, u]));
  const rows = raw.map((r) => {
    const { strength, text } = noteOf(r, thr);
    return {
      ...r,
      utility: utilityOf(byId[r.id]!, utilThr),
      strength,
      note: text,
    };
  });

  const outDir = join(process.cwd(), "docs", "balance");
  mkdirSync(outDir, { recursive: true });

  const md = [
    "# Roster balance — Deathmatch / HQ 4T / Skills",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Roster avg: Death W ${round1(avg.win)}, HQ ${round1(avg.hq)}, Skill W ${round1(avg.skill)}, Cost ${round1(avg.cost)}`,
    `OP tag (P75): Death≥${thr.win}, HQ≥${thr.hq}, Skill≥${thr.skill}`,
    "",
    "Δ = so với trung bình roster. Bulk = HP + Armor×3. ATK cao = ATK+Aggressive+Retaliate (không gồm First Strike / Shock).",
    "",
    `| Id | Unit | Cost (avg ${round1(avg.cost)}) | Deathmatch W/L (avg ${round1(avg.win)}, P75≥${thr.win}) | HQ dmg 4T (avg ${round1(avg.hq)}, P75≥${thr.hq}) | Skills W/L (avg ${round1(avg.skill)}, P75≥${thr.skill}) | Utility | Note |`,
    "| ---: | --- | ---: | --- | ---: | --- | --- | --- |",
    ...[...rows]
      .sort((a, b) => b.deathWin - a.deathWin || b.hqDmg4 - a.hqDmg4)
      .map((r) => {
        const d = `${r.deathWin}/${r.deathLose}${r.deathMutual || r.deathTimeout ? ` (X${r.deathMutual} T${r.deathTimeout})` : ""} (${deltaVsAvg(r.deathWin, avg.win)})`;
        const s = `${r.skillWin}/${r.skillLose}${r.skillMutual || r.skillTimeout ? ` (X${r.skillMutual} T${r.skillTimeout})` : ""} (${deltaVsAvg(r.skillWin, avg.skill)})`;
        return `| ${r.id} | ${r.name} | ${r.cost} | ${d} | ${r.hqDmg4} (${deltaVsAvg(r.hqDmg4, avg.hq)}) | ${s} | ${r.utility} | **${r.strength}** — ${r.note} |`;
      }),
    "",
  ].join("\n");
  writeFileSync(join(outDir, "roster-comparison.md"), md, "utf8");

  const htmlPath = join(outDir, "roster-comparison.html");
  const pdfPath = join(outDir, "roster-comparison.pdf");
  writeFileSync(htmlPath, renderHtml(rows, generatedAt, thr, avg), "utf8");
  printPdf(findBrowser(), htmlPath, pdfPath);
  console.log(`Wrote ${pdfPath}`);
}

main();
