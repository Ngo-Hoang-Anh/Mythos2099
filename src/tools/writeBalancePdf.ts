import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { UNITS } from "../data/units";
import { specialSkillDamageOf } from "./specialSkillDamage";
import { allDefenseBreakdowns, allOffenseBreakdowns, catalogAverages, valueCatalog } from "./unitValueBreakdown";
import {
  allVacuumEngagements,
  allVacuumExchanges,
  duelOutcome,
  shortCodes,
  type DuelHp,
} from "./vacuumDuel";
import { buildPowerRows, renderPowerAnalysisMarkdown } from "./powerAnalysis";

const CSS = `
:root { --ink:#1a1a1a; --muted:#555; --line:#ccc; --head:#f0f0f0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; color: var(--ink); font: 11px/1.4 "Segoe UI", system-ui, sans-serif; }
h1 { font-size: 20px; margin: 0 0 8px; }
h2 { font-size: 15px; margin: 18px 0 8px; page-break-after: avoid; }
h3 { font-size: 13px; margin: 12px 0 6px; page-break-after: avoid; }
p, li { font-size: 11px; }
.muted { color: var(--muted); }
.note { font-size: 10px; color: var(--muted); margin: 0 0 12px; }
table { border-collapse: collapse; width: 100%; margin: 0 0 14px; }
th, td { border: 1px solid var(--line); padding: 3px 5px; vertical-align: top; }
th { background: var(--head); font-weight: 600; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.matrix { font-size: 7.5px; }
.matrix th, .matrix td { padding: 2px 3px; white-space: nowrap; text-align: center; }
.matrix th:first-child, .matrix td:first-child { text-align: left; font-weight: 600; background: #fafafa; }
.w { background: #c6efce; }
.l { background: #ffc7ce; }
.x { background: #ffe599; }
.live { background: #fff; }
.over { background: #c6efce; }
.under { background: #ffc7ce; }
.role { background: #dbeafe; }
.ok { background: #f7f7f7; }
.card { break-inside: avoid; margin: 0 0 10px; padding: 0 0 4px; }
@page { size: A3 landscape; margin: 10mm; }
@media print {
  thead { display: table-header-group; }
  h2 { break-after: avoid; }
}
`;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function doc(title: string, body: string): string {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

function indexDuels(rows: DuelHp[]): Map<string, DuelHp> {
  const map = new Map<string, DuelHp>();
  for (const row of rows) map.set(`${row.attackerId}__${row.defenderId}`, row);
  return map;
}

function matrixTable(rows: DuelHp[], title: string): string {
  const units = UNITS;
  const codes = shortCodes(units);
  const map = indexDuels(rows);
  const head = ["Atk \\ Def", ...units.map((u) => esc(codes[u.id]))];
  const body = units
    .map((attacker) => {
      const cells = units.map((defender) => {
        const duel = map.get(`${attacker.id}__${defender.id}`);
        if (!duel) return "<td>—</td>";
        const mark = duelOutcome(duel);
        const cls = mark === "attacker" ? "w" : mark === "defender" ? "l" : mark === "mutual" ? "x" : "live";
        const tag = mark === "attacker" ? "W" : mark === "defender" ? "L" : mark === "mutual" ? "X" : "·";
        return `<td class="${cls}">${duel.attackerHp}/${duel.defenderHp} ${tag}</td>`;
      });
      return `<tr><td>${esc(codes[attacker.id])}</td>${cells.join("")}</tr>`;
    })
    .join("");
  return `<h2>${esc(title)}</h2>
<p class="note">Ô: HP attacker / HP defender. W = attacker sống, defender chết. L = attacker chết. X = cả hai chết. · = cả hai sống. Hàng = đánh trước.</p>
<table class="matrix"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
}

function vacuumHtml(generatedAt: string): string {
  const units = UNITS;
  const codes = shortCodes(units);
  const engagements = allVacuumEngagements(units);
  const exchanges = allVacuumExchanges(units);
  const power = buildPowerRows(units);

  const roster = units
    .map(
      (u) =>
        `<tr><td>${esc(codes[u.id])}</td><td>${esc(u.name)}</td><td>${esc(u.class)}</td><td class="num">${u.cost}</td><td class="num">${u.hp}</td><td class="num">${u.atk}</td><td class="num">${u.armor}</td><td class="num">${u.ap}</td><td>${esc(u.keywords.map((k) => (k.value && !["cover", "flank", "blitz", "artillery", "airStrike", "jetPlane"].includes(k.name) ? `${k.name} ${k.value}` : k.name)).join(", "))}</td></tr>`,
    )
    .join("");

  const board = power
    .slice()
    .sort((a, b) => b.vacuum.atkWin - a.vacuum.atkWin)
    .map(
      (r) =>
        `<tr><td>${esc(r.name)}</td><td class="num">${r.cost}</td><td class="num">${r.vacuum.atkWin}/${r.vacuum.atkLose}/${r.vacuum.atkMutual}/${r.vacuum.atkLive}</td><td class="num">${r.vacuum.defWin}/${r.vacuum.defLose}</td><td class="num">${r.vacuum.xWin}/${r.vacuum.xLose}</td><td class="num">${r.vacuum.avgHpAtk.toFixed(1)}</td><td class="num">${r.vacuum.avgHpDef.toFixed(1)}</td></tr>`,
    )
    .join("");

  return doc(
    "Vacuum 1v1",
    `<h1>Vacuum 1v1 — remaining HP</h1>
<p class="muted">Generated ${esc(generatedAt)} · PDF bỏ per-unit details (xem vacuum-1v1.md).</p>
<h2>Assumptions</h2>
<ul>
<li>Hai unit, cùng làn, không bài, không Cover/Flank, không Support Fire đồng minh.</li>
<li>Artillery / Air Strike đứng Support; còn lại Frontline.</li>
<li>1 engagement: attacker volley → defender counter → attacker missile (50% armor, làm tròn xuống, không AP).</li>
<li>2-round: đổi lượt nếu cả hai còn sống, máu cộng dồn.</li>
</ul>
<h2>Roster</h2>
<table><thead><tr><th>Code</th><th>Name</th><th>Class</th><th class="num">Cost</th><th class="num">HP</th><th class="num">ATK</th><th class="num">Armor</th><th class="num">AP</th><th>Keywords</th></tr></thead><tbody>${roster}</tbody></table>
<h2>Scoreboard</h2>
<table><thead><tr><th>Unit</th><th class="num">Cost</th><th>1-eng atk W/L/X/·</th><th>1-eng def W/L</th><th>2-round W/L</th><th class="num">Avg HP atk</th><th class="num">Avg HP def</th></tr></thead><tbody>${board}</tbody></table>
${matrixTable(engagements, "One engagement (row attacks first)")}
${matrixTable(exchanges, "Two-round exchange (row then column)")}`,
  );
}

function valueHtml(generatedAt: string): string {
  const offense = allOffenseBreakdowns();
  const defense = allDefenseBreakdowns();
  const catalog = valueCatalog();
  const avg = catalogAverages();
  const offRows = [...offense]
    .sort((a, b) => b.totalDmg - a.totalDmg)
    .map(
      (r) =>
        `<tr><td>${esc(r.name)}</td><td class="num">${r.cost}</td><td class="num">${r.atk}</td><td class="num">${r.aggressive}</td><td class="num">${r.retaliate}</td><td class="num">${r.totalAtk}</td><td class="num">${r.ap}</td><td class="num">${r.missile}</td><td class="num">${r.selfAtkDmg}</td><td class="num">${r.allyBuffDmg} (${r.supportFireDmg}/${r.rallyDmg})</td><td class="num">${r.indirectDmg}</td><td class="num">${r.specialDmg}</td><td>${esc(r.specialName)}</td><td class="num"><b>${r.totalDmg}</b></td></tr>`,
    )
    .join("");
  const specRows = UNITS.map((u) => {
    const s = specialSkillDamageOf(u.id);
    return `<tr><td>${esc(u.name)}</td><td>${esc(s.skill)}</td><td class="num">${s.damage}</td><td>${esc(s.note)}</td></tr>`;
  }).join("");
  const defRows = [...defense]
    .sort((a, b) => b.hpArmor3 - a.hpArmor3)
    .map((r) => {
      const cell = (s: typeof r.avgOpp) =>
        `${s.attackHitDmg.toFixed(2)} / ${s.attacksSurvived ?? "∞"} · ${s.retaliateHitDmg.toFixed(2)} / ${s.retaliatesSurvived ?? "∞"} · ${s.cyclesSurvived ?? "∞"}`;
      return `<tr><td>${esc(r.name)}</td><td class="num">${r.cost}</td><td class="num">${r.hp}</td><td class="num">${r.armor}</td><td class="num">${r.hpArmor2}</td><td class="num">${r.hpArmor3}</td><td>${cell(r.avgOpp)}</td><td>${cell(r.maxTotalAtk)}</td><td>${cell(r.maxAp)}</td><td>${cell(r.maxAtkPlusAp)}</td></tr>`;
    })
    .join("");

  return doc(
    "Unit value breakdown",
    `<h1>Unit value breakdown — 2-turn damage &amp; defense</h1>
<p class="muted">Generated ${esc(generatedAt)}</p>
<h2>Assumptions</h2>
<ul>
<li>Địch 0 armor. Self ATK = 2×ATK + Aggressive + Retaliate.</li>
<li>Ally buff: 2 Support Fire 2 (+8). Rally +3 nếu unit có Rally.</li>
<li>Indirect = Missile 1 lần. Special = hằng số (không tự suy).</li>
<li>Defense: HP+2A / HP+3A. Avg total ATK ${avg.totalAtk.toFixed(2)}, AP ${avg.ap.toFixed(2)}, Missile ${avg.missile.toFixed(2)}.</li>
<li>Max ATK = ${esc(catalog.maxTotalAtk.name)}; max AP = ${esc(catalog.maxAp.name)}; max ATK+AP = ${esc(catalog.maxAtkPlusAp.name)}.</li>
<li>Survival: atkDmg / atkHits · retalDmg / retalHits · 2-turn cycles.</li>
</ul>
<h2>Offense over 2 turns</h2>
<table><thead><tr><th>Unit</th><th class="num">Cost</th><th class="num">ATK</th><th class="num">Agg</th><th class="num">Ret</th><th class="num">Total ATK</th><th class="num">AP</th><th class="num">Msl</th><th class="num">Self</th><th class="num">Ally (SF/Rally)</th><th class="num">Indir</th><th class="num">Spec</th><th>Skill</th><th class="num">Total</th></tr></thead><tbody>${offRows}</tbody></table>
<h2>Special skill constants</h2>
<table><thead><tr><th>Unit</th><th>Skill</th><th class="num">Dmg</th><th>Note</th></tr></thead><tbody>${specRows}</tbody></table>
<h2>Defense &amp; hits survived</h2>
<table><thead><tr><th>Unit</th><th class="num">Cost</th><th class="num">HP</th><th class="num">Armor</th><th class="num">HP+2A</th><th class="num">HP+3A</th><th>vs Average</th><th>vs ${esc(catalog.maxTotalAtk.name)}</th><th>vs ${esc(catalog.maxAp.name)}</th><th>vs ${esc(catalog.maxAtkPlusAp.name)}</th></tr></thead><tbody>${defRows}</tbody></table>`,
  );
}

function analysisHtml(generatedAt: string): string {
  const rows = buildPowerRows();
  const ranked = [...rows].sort((a, b) => b.vacuum.xWin - a.vacuum.xWin || b.vacuum.avgHpAtk - a.vacuum.avgHpAtk);
  const rankRows = ranked
    .map(
      (r) =>
        `<tr class="${r.band}"><td>${esc(r.name)}</td><td class="num">${r.cost}</td><td>${esc(r.class)}</td><td class="num">${r.vacuum.atkWin}/${r.vacuum.atkLose}</td><td class="num">${r.vacuum.xWin}/${r.vacuum.xLose}</td><td class="num">${r.vacuum.avgHpAtk.toFixed(1)} / ${r.vacuum.avgHpDef.toFixed(1)}</td><td class="num">${r.dmgPerCost.toFixed(2)}</td><td class="num">${r.defPerCost.toFixed(2)}</td><td>${r.band}</td></tr>`,
    )
    .join("");

  const cards = (band: "over" | "under" | "role") =>
    rows
      .filter((r) => r.band === band)
      .map((r) => {
        const skills = r.specials.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.text)}</li>`).join("");
        const spec = specialSkillDamageOf(r.id);
        return `<div class="card"><h3>${esc(r.name)} <span class="muted">(${r.cost} cost, ${esc(r.class)})</span></h3>
<p>${esc(r.why)}</p>
${skills ? `<ul>${skills}</ul>` : ""}
<p class="note">Special-dmg constant: ${spec.damage}. Vacuum atk ${r.vacuum.atkWin}W/${r.vacuum.atkLose}L · def ${r.vacuum.defWin}W · 2-round ${r.vacuum.xWin}W/${r.vacuum.xLose}L · 2-turn dmg ${r.offense.totalDmg} · HP+3A ${r.defense.hpArmor3}.</p></div>`;
      })
      .join("");

  return doc(
    "Power analysis",
    `<h1>Power analysis — overpower / underpower</h1>
<p class="muted">Generated ${esc(generatedAt)}</p>
<p>Vacuum 1v1 = combat thuần (không bài). Bảng 2-turn dmg giả định 0 armor. Kết luận ưu tiên leftover HP + kill, rồi dmg/cost. Band <b>role</b>: đừng buff stat nếu utility đã đủ.</p>
<p class="note">Màu hàng: xanh = over, đỏ = under, xanh dương = role, xám = ok.</p>
<h2>Ranking</h2>
<table><thead><tr><th>Unit</th><th class="num">Cost</th><th>Class</th><th>1-eng W/L</th><th>2-round W/L</th><th>Avg HP atk/def</th><th class="num">Dmg/cost</th><th class="num">HP+3A/cost</th><th>Band</th></tr></thead><tbody>${rankRows}</tbody></table>
<h2>Overpower</h2>
${cards("over")}
<h2>Underpower — review skill trước khi buff</h2>
<p>Combat không trả đủ cost. Nếu special/utility không bù → buff HP/ATK/AP hoặc hạ cost.</p>
${cards("under")}
<h2>Role — 1v1 không phải thước đo</h2>
${cards("role")}
<h2>Ưu tiên review</h2>
<ol>
<li><b>Komet Fighter</b> — cost 6 / 3 HP, 23 thua khi đánh trước. Hit &amp; Run phải cực mạnh; nếu không, hạ cost hoặc thêm HP.</li>
<li><b>Stealthray Bomber</b> — Silent Death + Artillery Call vs cost 6. Combat thua Viper 5.</li>
<li><b>Death Rider</b> — thân ≈ Phantom cost 3. Deadly Presence có thể không đủ 2 cost chênh.</li>
<li><b>Ironclad Goliath</b> — Analyze Weakness bị bảng 0-armor giấu; so Aegis cùng 6 cost thì thua tank.</li>
<li><b>Nomad / Scout Biker / Tempest</b> — kit support. Chỉ buff combat nếu muốn chúng 1v1 được.</li>
</ol>
<p>Không cần buff combat: Trench Guard (wall), Jackal/Phantom (flanker rẻ), artillery (context sai), drone support/kamikaze (payoff skill).</p>`,
  );
}

function findChrome(): string {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("Chrome/Edge not found");
  return found;
}

function printPdf(browser: string, htmlPath: string, pdfPath: string): void {
  const profile = join(tmpdir(), "armored-legend-pdf-profile");
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
    { stdio: "inherit", timeout: 120000 },
  );
  if (result.status !== 0) {
    throw new Error(`PDF print failed for ${pdfPath} (exit ${result.status})`);
  }
}

function main(): void {
  const generatedAt = new Date().toISOString();
  const outDir = join(process.cwd(), "docs", "balance");
  mkdirSync(outDir, { recursive: true });
  const rows = buildPowerRows();
  writeFileSync(join(outDir, "power-analysis.md"), renderPowerAnalysisMarkdown(rows, generatedAt), "utf8");

  const files = [
    { html: "vacuum-1v1.html", pdf: "vacuum-1v1.pdf", body: vacuumHtml(generatedAt) },
    { html: "unit-value-breakdown.html", pdf: "unit-value-breakdown.pdf", body: valueHtml(generatedAt) },
    { html: "power-analysis.html", pdf: "power-analysis.pdf", body: analysisHtml(generatedAt) },
  ];
  const browser = findChrome();
  for (const file of files) {
    const htmlPath = join(outDir, file.html);
    const pdfPath = join(outDir, file.pdf);
    writeFileSync(htmlPath, file.body, "utf8");
    printPdf(browser, htmlPath, pdfPath);
    console.log(`Wrote ${pdfPath}`);
  }
}

main();
