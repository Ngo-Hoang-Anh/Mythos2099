/**
 * Convert padded string unit ids ("01"…"27", "t01"…) to integers (1…27, 101…).
 * Run: node scripts/toIntUnitIds.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOTS = ["src", "server", "scripts"];
const EXT = new Set([".ts", ".tsx", ".js", ".cjs", ".mjs"]);
const SKIP = new Set([
  path.normalize("src/data/unitIds.ts"),
  path.normalize("scripts/toIntUnitIds.cjs"),
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(name))) out.push(full);
  }
  return out;
}

function convert(text) {
  let s = text;
  // tutorial first
  s = s.replace(/"t01"/g, "101");
  s = s.replace(/"t02"/g, "102");
  s = s.replace(/"t03"/g, "103");
  // object keys and string literals "27"…"01" — quoted two-digit only
  for (let n = 27; n >= 1; n -= 1) {
    const pad = String(n).padStart(2, "0");
    s = s.replace(new RegExp(`"${pad}"`, "g"), String(n));
  }
  return s;
}

let changed = 0;
for (const root of ROOTS) {
  const abs = path.join(process.cwd(), root);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const rel = path.relative(process.cwd(), file);
    if (SKIP.has(path.normalize(rel))) continue;
    const raw = fs.readFileSync(file, "utf8");
    const next = convert(raw);
    if (next === raw) continue;
    fs.writeFileSync(file, next);
    changed += 1;
    console.log(rel);
  }
}
console.log("files:", changed);
