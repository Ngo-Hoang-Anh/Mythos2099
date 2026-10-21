import {
  catalogIdForTemplate,
  referencedUnitIds,
  type Beat,
  type CustomUnitDraft,
  type ScenarioDraft,
} from "../src/tutorial/authored";
import { C } from "../src/data/cardCatalog";

export interface LessonPack {
  guide: string;
  units: string;
  lesson: string;
  test: string;
}

function constName(id: string): string {
  const raw = id
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  if (!raw) return "CUSTOM_LESSON";
  return /^[0-9]/.test(raw) ? `LESSON_${raw}` : raw;
}

function emit(value: unknown, indent = 0): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "null";
  const pad = " ".repeat(indent);
  const inner = " ".repeat(indent + 2);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${inner}${emit(item, indent + 2)}`).join(",\n")},\n${pad}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined);
  if (entries.length === 0) return "{}";
  return `{\n${entries.map(([key, item]) => `${inner}${key}: ${emit(item, indent + 2)}`).join(",\n")},\n${pad}}`;
}

function emitBeat(beat: Beat, indent: number): string {
  const body: Record<string, unknown> = {
    id: beat.id,
    label: beat.label,
    actor: beat.actor,
    action: beat.action,
    done: beat.done,
    block: beat.block,
  };
  if (beat.hint) body.hint = beat.hint;
  return emit(body, indent);
}

function unitConst(unit: CustomUnitDraft): string {
  const raw = unit.name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  const base = !raw || /^[0-9]/.test(raw) ? `UNIT_${unit.id}` : raw;
  return base;
}

function emitCustomUnit(unit: CustomUnitDraft, name: string): string {
  const cards = unit.cardTemplateIds.map((templateId) => {
    const key = (Object.keys(C) as string[]).includes(templateId)
      ? templateId
      : catalogIdForTemplate(templateId);
    if (!key) throw new Error(`Unknown card ${templateId} on ${unit.name}`);
    return `C.${key}`;
  });
  const keywords = unit.keywordText.trim()
    ? `parseKeywords(${JSON.stringify(unit.keywordText.trim())})`
    : "[]";
  const cardsExpr = cards.length ? `cardsOf(${cards.join(", ")})` : "[]";
  return `  {
    id: ${name},
    name: ${JSON.stringify(unit.name.trim() || `Unit ${unit.id}`)},
    class: ${JSON.stringify(unit.class)},
    hp: ${unit.hp},
    atk: ${unit.atk},
    armor: ${unit.armor},
    ap: ${unit.ap},
    cost: ${unit.cost},
    keywords: ${keywords},
    cards: ${cardsExpr},
    lore: "",
    hasArt: ${unit.artAliasId != null},
  }`;
}

function setupBody(draft: ScenarioDraft): string {
  const lines: string[] = ["    const state = createSandboxMatch();"];
  if (!draft.youFirst) {
    lines.push(
      "    state.players[0].turnsTaken = 0;",
      "    state.currentPlayer = 1;",
      "    state.firstPlayerId = 1;",
      "    state.players[1].turnsTaken = 1;",
    );
  }
  for (const id of [0, 1] as const) {
    lines.push(
      `    state.players[${id}].hqHp = ${draft.hq[id].hp};`,
      `    state.players[${id}].hqMaxHp = ${draft.hq[id].max};`,
      `    state.players[${id}].commandPoints = ${draft.supply[id]};`,
    );
    if (draft.reserve[id].length) {
      lines.push(`    setReserve(state, ${id}, [${draft.reserve[id].join(", ")}]);`);
    }
  }
  for (const placed of draft.board) {
    const fields = [
      `defId: ${placed.defId}`,
      `owner: ${placed.owner}`,
      `col: ${placed.col}`,
      `row: ${placed.row}`,
    ];
    if (placed.rested) fields.push("rested: true");
    if (placed.hp != null) fields.push(`hp: ${placed.hp}`);
    const overrides =
      placed.hp != null || placed.atk != null || placed.armor != null || placed.ap != null;
    if (!overrides) {
      lines.push(`    spawnUnit(state, { ${fields.join(", ")} });`);
      continue;
    }
    lines.push(`    {`);
    lines.push(`      const unit = spawnUnit(state, { ${fields.join(", ")} });`);
    if (placed.hp != null) lines.push(`      unit.maxHp = Math.max(unit.maxHp, ${placed.hp});`);
    if (placed.atk != null) lines.push(`      unit.atk = ${placed.atk};`);
    if (placed.armor != null) lines.push(`      unit.armor = ${placed.armor};`);
    if (placed.ap != null) lines.push(`      unit.ap = ${placed.ap};`);
    lines.push(`    }`);
  }
  for (const card of draft.hand) {
    lines.push(
      `    giveUnitCard(state, ${card.player}, ${card.ownerDefId}, ${JSON.stringify(card.templateId)});`,
    );
  }
  for (const card of draft.deck) {
    lines.push(
      `    giveUnitDeckCard(state, ${card.player}, ${card.ownerDefId}, ${JSON.stringify(card.templateId)});`,
    );
  }
  lines.push(`    markBeatProgress(state, ${constName(draft.id)}_BEATS);`);
  lines.push("    return state;");
  return lines.join("\n");
}

function sandboxImports(draft: ScenarioDraft): string[] {
  const names = ["createSandboxMatch"];
  if (draft.board.length) names.push("spawnUnit");
  if (draft.reserve.some((side) => side.length)) names.push("setReserve");
  if (draft.hand.length) names.push("giveUnitCard");
  if (draft.deck.length) names.push("giveUnitDeckCard");
  return names;
}

export function emitLessonPack(draft: ScenarioDraft): LessonPack {
  const name = constName(draft.id);
  const lessonId = draft.id.trim() || "custom-lesson";
  const units = draft.units;
  const usedCards = units.some((unit) => unit.cardTemplateIds.length);
  const usedKeywords = units.some((unit) => unit.keywordText.trim());
  const unitImports = [
    usedKeywords ? `import { parseKeywords } from "../engine/keywords";` : "",
    usedCards ? `import { C, cardsOf } from "./cardCatalog";` : "",
  ].filter(Boolean);

  const names = new Map<number, string>();
  const usedNames = new Set<string>();
  for (const unit of units) {
    let label = unitConst(unit);
    if (usedNames.has(label)) label = `${label}_${unit.id}`;
    usedNames.add(label);
    names.set(unit.id, label);
  }
  const constants = units.map((unit) => `export const ${names.get(unit.id)} = ${unit.id};`).join("\n");
  const aliases = units
    .filter((unit) => unit.artAliasId != null)
    .map((unit) => `  [${names.get(unit.id)}]: ${unit.artAliasId},`)
    .join("\n");
  const unitObjects = units.map((unit) => emitCustomUnit(unit, names.get(unit.id)!)).join(",\n");

  const unitsSnippet = [
    unitImports.length ? `${unitImports.join("\n")}\n` : "",
    constants,
    "",
    "/* Paste each object into TUTORIAL_UNITS. */",
    unitObjects || "/* No custom units. */",
    "",
    aliases
      ? `/* Paste into TUTORIAL_ART_ALIAS:\n${aliases}\n*/`
      : "/* No art aliases. */",
  ].join("\n");

  const beatBlock = draft.beats.map((beat) => emitBeat(beat, 2)).join(",\n");
  const coach = emit(draft.coach.length ? draft.coach : [""], 2);
  const hubStats = emit(draft.hubStats, 2);
  const keywords = emit(draft.keywords, 2);
  const unitIds = referencedUnitIds(draft);
  const redraw = draft.beats.some((beat) => beat.action.type === "discardRedraw");
  const formula = draft.formula?.trim()
    ? `\n  formula: ${JSON.stringify(draft.formula.trim())},`
    : "";

  const lessonSnippet = `import {
  allowFromBeats,
  hintFromBeats,
  markBeatProgress,
  scriptedFromBeats,
  stepsFromBeats,
  type Beat,
} from "./authored";
import { ${sandboxImports(draft).join(", ")} } from "../engine/sandbox";
import type { LessonDef } from "./lessons";

const ${name}_BEATS: Beat[] = [
${beatBlock ? `${beatBlock},\n` : ""}];

const ${name}: LessonDef = {
  id: ${JSON.stringify(lessonId)},
  number: ${draft.number},
  title: ${JSON.stringify(draft.title)},
  subtitle: ${JSON.stringify(draft.subtitle)},${formula}
  hubStats: ${hubStats},
  units: [${unitIds.join(", ")}],
  keywords: ${keywords},
  coach: ${coach},
  success: ${JSON.stringify(draft.success)},${redraw ? "\n  allowDiscardRedraw: true," : ""}
  setup() {
${setupBody(draft)}
  },
  scriptedAction: scriptedFromBeats(${name}_BEATS),
  allow: allowFromBeats(${name}_BEATS),
  afterAction(match) {
    markBeatProgress(match, ${name}_BEATS);
  },
  pickHint: hintFromBeats(${name}_BEATS),
  steps: stepsFromBeats(${name}_BEATS),
};`;

  const guide = `1. src/data/tutorialUnits.ts
   - Dán các hằng id và object unit vào TUTORIAL_UNITS.
   - Nếu có art alias, thêm dòng vào TUTORIAL_ART_ALIAS.
   - Nếu snippet có import parseKeywords / cardsOf, thêm import đó vào đầu file (file hiện chưa import chúng).

2. src/tutorial/lessons.ts
   - Id phải chưa có trong LessonId.
   - Thêm ${JSON.stringify(lessonId)} vào union LessonId.
   - Dán const ${name}_BEATS và const ${name} cạnh các lesson khác.
   - Thêm ${name} vào mảng LESSONS.
   - number ${draft.number} đang rơi vào section Strategy vì TUTORIAL_HUB lấy lesson có number >= 15. Muốn section khác thì đổi number và sửa filter trong TUTORIAL_HUB.

3. src/tutorial/lessons.test.ts
   - Trong test "has seventeen sandbox lessons...", tăng toHaveLength thêm 1.
   - Thêm ${JSON.stringify(lessonId)} vào cuối mảng id kỳ vọng.

4. Chạy npm test. Lesson không tự vào bản deploy cho đến khi những file trên được commit cùng game.`;

  const test = `expect(LESSONS).toHaveLength(N); // N = số lesson hiện tại + 1
// thêm vào cuối mảng id:
${JSON.stringify(lessonId)}`;

  return { guide, units: unitsSnippet, lesson: lessonSnippet, test };
}
