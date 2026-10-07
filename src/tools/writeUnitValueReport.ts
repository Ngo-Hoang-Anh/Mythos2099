import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderUnitValueMarkdown } from "./unitValueBreakdown";

const outDir = join(process.cwd(), "docs", "balance");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "unit-value-breakdown.md");
writeFileSync(outPath, renderUnitValueMarkdown(), "utf8");
console.log(`Wrote ${outPath}`);
