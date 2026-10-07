import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderVacuumDuelMarkdown } from "./vacuumDuel";

const outDir = join(process.cwd(), "docs", "balance");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "vacuum-1v1.md");
writeFileSync(outPath, renderVacuumDuelMarkdown(), "utf8");
console.log(`Wrote ${outPath}`);
