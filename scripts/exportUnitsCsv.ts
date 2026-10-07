/**
 * Writes the unit catalog CSV from live code stats / cards / lore.
 * Run: npx tsx scripts/exportUnitsCsv.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { UNITS } from "../src/data/units";
import { FLAG_KEYWORDS } from "../src/engine/keywords";
import { KEYWORD_LABEL } from "../src/engine/armySummary";
import type { CardDef, Keyword, UnitDef } from "../src/engine/types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function keywordCell(keywords: Keyword[]): string {
  return keywords
    .map((k) => {
      const label = KEYWORD_LABEL[k.name];
      if (FLAG_KEYWORDS.has(k.name)) return label;
      return `${label} ${k.value}`;
    })
    .join("; ");
}

function cardSlot(cards: CardDef[], type: CardDef["type"]): string {
  const ofType = cards.filter((c) => c.type === type);
  if (ofType.length === 0) return "None";
  const groups = new Map<string, { card: CardDef; count: number }>();
  for (const card of ofType) {
    const key = `${card.name}|${card.cost}|${card.text}`;
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else groups.set(key, { card, count: 1 });
  }
  return [...groups.values()]
    .map(({ card, count }) => {
      const copies = count > 1 ? ` (x${count})` : "";
      return `${card.name}${copies}: ${card.cost}S — ${card.text}`;
    })
    .join(" | ");
}

function row(unit: UnitDef): string {
  return [
    unit.id,
    unit.name,
    unit.class,
    String(unit.hp),
    String(unit.atk),
    String(unit.armor),
    String(unit.ap),
    `${unit.cost}S`,
    keywordCell(unit.keywords),
    cardSlot(unit.cards, "special"),
    cardSlot(unit.cards, "maneuver"),
    cardSlot(unit.cards, "move"),
    unit.lore,
  ]
    .map(csvEscape)
    .join(",");
}

const header =
  "Id,Unit Name,Class,HP,ATK,Armor,AP,Cost (Supply),Keywords,Special Slot,Manuever Slot,Move Slot,Lore";

const body = [
  ",Titan Prime (Benchmark),Baseline,20,10,8,,6 S,None,None,None,None,",
  ...UNITS.map(row),
].join("\n");

const out = resolve("Sci-Fi TCG Unit Cards and Stats Database - Sci-Fi TCG Unit Cards and Stats Database.csv");
writeFileSync(out, `${header}\n${body}\n`, "utf8");
console.log(`Wrote ${UNITS.length} units (+ benchmark) to ${out}`);
