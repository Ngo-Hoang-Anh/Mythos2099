/**
 * Convert PNG files to WebP and write them beside the source.
 *
 *   node scripts/pngToWebp.mjs [--quality 90] [--lossless] [--min-kb 0]
 *        [--delete-source] [--dry-run] <file-or-dir> [...]
 *
 * Directories are scanned recursively for .png files. A source is kept when
 * the WebP is not smaller. --delete-source removes the PNG only after a
 * smaller WebP has been written.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const flags = {
  quality: 90,
  lossless: false,
  minKb: 0,
  deleteSource: false,
  dryRun: false,
};
const inputs = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--lossless") flags.lossless = true;
  else if (arg === "--delete-source") flags.deleteSource = true;
  else if (arg === "--dry-run") flags.dryRun = true;
  else if (arg === "--quality") flags.quality = Number(args[++i]);
  else if (arg === "--min-kb") flags.minKb = Number(args[++i]);
  else if (arg.startsWith("-")) {
    console.error(`Unknown flag: ${arg}`);
    process.exit(1);
  } else inputs.push(arg);
}

if (!inputs.length || Number.isNaN(flags.quality) || Number.isNaN(flags.minKb)) {
  console.error("Usage: node scripts/pngToWebp.mjs [--quality 90] [--lossless] [--min-kb 0] [--delete-source] [--dry-run] <file-or-dir> [...]");
  process.exit(1);
}

function collect(target) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) throw new Error(`Not found: ${target}`);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    const found = [];
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const child = path.join(abs, entry.name);
      if (entry.isDirectory()) found.push(...collect(child));
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) found.push(child);
    }
    return found;
  }
  if (!abs.toLowerCase().endsWith(".png")) throw new Error(`Not a PNG: ${target}`);
  return [abs];
}

const files = [...new Set(inputs.flatMap(collect))].sort();
let pngBytes = 0;
let webpBytes = 0;
let converted = 0;
let skipped = 0;

for (const file of files) {
  const before = fs.statSync(file).size;
  const rel = path.relative(process.cwd(), file);
  if (before < flags.minKb * 1024) {
    skipped += 1;
    console.log(`skip  ${rel}  (${(before / 1024).toFixed(1)} KB < ${flags.minKb} KB)`);
    continue;
  }

  const out = file.replace(/\.png$/i, ".webp");
  const image = sharp(file);
  const encoded = flags.lossless
    ? image.webp({ lossless: true, effort: 6 })
    : image.webp({ quality: flags.quality, alphaQuality: 100, effort: 6 });
  const buf = await encoded.toBuffer();

  if (buf.length >= before) {
    skipped += 1;
    console.log(`keep  ${rel}  WebP ${(buf.length / 1024).toFixed(1)} KB is not smaller than ${(before / 1024).toFixed(1)} KB`);
    continue;
  }

  if (!flags.dryRun) fs.writeFileSync(out, buf);
  if (!flags.dryRun && flags.deleteSource) fs.unlinkSync(file);

  pngBytes += before;
  webpBytes += buf.length;
  converted += 1;
  const outRel = path.relative(process.cwd(), out);
  console.log(
    `${flags.dryRun ? "dry " : "webp "} ${rel}  ${(before / 1024).toFixed(1)} KB -> ${outRel} ${(buf.length / 1024).toFixed(1)} KB`,
  );
}

const saved = pngBytes - webpBytes;
console.log(
  `\n${converted} converted, ${skipped} skipped. ${(pngBytes / 1024).toFixed(1)} KB -> ${(webpBytes / 1024).toFixed(1)} KB (saved ${(saved / 1024).toFixed(1)} KB).`,
);
