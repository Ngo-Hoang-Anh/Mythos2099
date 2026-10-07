import fs from "fs";
import path from "path";

const root = path.resolve("public/ui/sungraphica");

function write(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log(rel);
}

const C = { cyan: "#00FEFE", gold: "#FFD338", fill: "#333333" };

function iconSvg(paths, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
${paths.map((d) => `  <path d="${d}" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join("\n")}
</svg>
`;
}

function buttonSvg(inner, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect x="4" y="4" width="56" height="56" fill="${C.fill}" stroke="${color}" stroke-width="2.5"/>
${inner}
</svg>
`;
}

const glyphs = {
  check: { paths: ["M16 32l10 12 22-26"] },
  close: { paths: ["M20 20l24 24", "M44 20L20 44"] },
  home: { paths: ["M12 30l20-16 20 16", "M18 28v18h10V34h8v12h10V28"] },
  plus: { paths: ["M32 16v32", "M16 32h32"] },
  minus: { paths: ["M16 32h32"] },
  help: { paths: ["M24 24c0-5 3.5-8 8-8s8 3 8 8c0 4-3 6-5 7.5S32 34 32 38", "M32 46v2"] },
  back: { paths: ["M38 16L22 32l16 16"] },
  skip: { paths: ["M18 18l20 14-20 14V18z", "M42 18v28"] },
  rewind: { paths: ["M46 18L26 32l20 14V18z", "M22 18v28"] },
  lock: { paths: ["M22 30h20v18H22z", "M26 30v-6a6 6 0 0112 0v6"] },
};

for (const [name, g] of Object.entries(glyphs)) {
  for (const [tone, color] of [
    ["cyan", C.cyan],
    ["gold", C.gold],
  ]) {
    write(`icons/${name}-${tone}.svg`, iconSvg(g.paths, color));
    const inner = g.paths
      .map(
        (d) =>
          `  <path d="${d}" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
      )
      .join("\n");
    write(`buttons/${name}-${tone}.svg`, buttonSvg(inner, color));
  }
}

write(
  "elements/panel-h-cyan.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="none">
  <path d="M24 8h40l12 12h300l12-12h12v12l12 12v64l-12 12H36l-12-12V32L12 20V8z" fill="#1b1f27" stroke="#00FEFE" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M40 100h48l8 8H48z" fill="#00FEFE" opacity="0.85"/>
  <path d="M48 104h36" stroke="#1a1a1a" stroke-width="3" stroke-dasharray="4 3"/>
</svg>
`,
);

write(
  "elements/panel-h-gold.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="none">
  <path d="M24 8h40l12 12h300l12-12h12v12l12 12v64l-12 12H36l-12-12V32L12 20V8z" fill="#1b1f27" stroke="#FFD338" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M40 100h48l8 8H48z" fill="#FFD338" opacity="0.85"/>
  <path d="M48 104h36" stroke="#1a1a1a" stroke-width="3" stroke-dasharray="4 3"/>
</svg>
`,
);

write(
  "elements/panel-v-cyan.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 400" preserveAspectRatio="none">
  <path d="M16 24v40l12 12v280l-12 12v8h12l12 12h92l12-12h12v-8l-12-12V76l12-12V24l-12-12H28z" fill="#1b1f27" stroke="#00FEFE" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M8 80v64l8 8V88z" fill="#00FEFE" opacity="0.85"/>
  <path d="M12 88v52" stroke="#1a1a1a" stroke-width="3" stroke-dasharray="4 3"/>
</svg>
`,
);

write(
  "elements/panel-v-gold.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 400" preserveAspectRatio="none">
  <path d="M16 24v40l12 12v280l-12 12v8h12l12 12h92l12-12h12v-8l-12-12V76l12-12V24l-12-12H28z" fill="#1b1f27" stroke="#FFD338" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M8 80v64l8 8V88z" fill="#FFD338" opacity="0.85"/>
  <path d="M12 88v52" stroke="#1a1a1a" stroke-width="3" stroke-dasharray="4 3"/>
</svg>
`,
);

write(
  "elements/slot-cyan.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M8 16L16 8h32l8 8v32l-8 8H16l-8-8z" fill="#1b1f27" stroke="#00FEFE" stroke-width="2.5" stroke-linejoin="round"/>
</svg>
`,
);

write(
  "elements/slot-gold.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M8 16L16 8h32l8 8v32l-8 8H16l-8-8z" fill="#1b1f27" stroke="#FFD338" stroke-width="2.5" stroke-linejoin="round"/>
</svg>
`,
);

write(
  "elements/bracket-tl.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M4 36V12L12 4h24" fill="none" stroke="#FFD338" stroke-width="3" stroke-linecap="square"/>
  <path d="M4 20h8M20 4v8" stroke="#FFD338" stroke-width="2"/>
</svg>
`,
);
write(
  "elements/bracket-tr.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M44 36V12L36 4H12" fill="none" stroke="#FFD338" stroke-width="3" stroke-linecap="square"/>
  <path d="M44 20h-8M28 4v8" stroke="#FFD338" stroke-width="2"/>
</svg>
`,
);
write(
  "elements/bracket-bl.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M4 12v24l8 8h24" fill="none" stroke="#00FEFE" stroke-width="3" stroke-linecap="square"/>
  <path d="M4 28h8M20 44v-8" stroke="#00FEFE" stroke-width="2"/>
</svg>
`,
);
write(
  "elements/bracket-br.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M44 12v24l-8 8H12" fill="none" stroke="#00FEFE" stroke-width="3" stroke-linecap="square"/>
  <path d="M44 28h-8M28 44v-8" stroke="#00FEFE" stroke-width="2"/>
</svg>
`,
);

write(
  "elements/reticle-cyan.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="18" fill="none" stroke="#00FEFE" stroke-width="2"/>
  <circle cx="32" cy="32" r="3" fill="#00FEFE"/>
  <path d="M32 8v12M32 44v12M8 32h12M44 32h12" stroke="#00FEFE" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`,
);
write(
  "elements/reticle-gold.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="18" fill="none" stroke="#FFD338" stroke-width="2"/>
  <circle cx="32" cy="32" r="3" fill="#FFD338"/>
  <path d="M32 8v12M32 44v12M8 32h12M44 32h12" stroke="#FFD338" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`,
);

write(
  "elements/banner-cyan.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 48" preserveAspectRatio="none">
  <path d="M16 8h40l10 10h348l10-10h40v8l12 12v8l-12 12v8H26l-10-8H4V28L16 16z" fill="#1b1f27" stroke="#00FEFE" stroke-width="2" stroke-linejoin="round"/>
</svg>
`,
);
write(
  "elements/banner-gold.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 48" preserveAspectRatio="none">
  <path d="M16 8h40l10 10h348l10-10h40v8l12 12v8l-12 12v8H26l-10-8H4V28L16 16z" fill="#1b1f27" stroke="#FFD338" stroke-width="2" stroke-linejoin="round"/>
</svg>
`,
);

write(
  "elements/bar-track-cyan.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 200" preserveAspectRatio="none">
  <path d="M4 8h16v184H4z" fill="#2a1c1c" stroke="#00FEFE" stroke-width="2"/>
  <path d="M4 8l8-4 8 4" fill="#00FEFE"/>
</svg>
`,
);
write(
  "elements/bar-track-gold.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 200" preserveAspectRatio="none">
  <path d="M4 8h16v184H4z" fill="#2a1c1c" stroke="#FFD338" stroke-width="2"/>
  <path d="M4 8l8-4 8 4" fill="#FFD338"/>
</svg>
`,
);

write(
  "elements/tab-hazard-gold.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 28" preserveAspectRatio="none">
  <path d="M4 4h100l12 12v8H16L4 12z" fill="#FFD338"/>
  <path d="M20 8l8 16M32 8l8 16M44 8l8 16M56 8l8 16M68 8l8 16M80 8l8 16" stroke="#1a1a1a" stroke-width="3"/>
</svg>
`,
);
write(
  "elements/tab-hazard-cyan.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 28" preserveAspectRatio="none">
  <path d="M4 4h100l12 12v8H16L4 12z" fill="#00FEFE"/>
  <path d="M20 8l8 16M32 8l8 16M44 8l8 16M56 8l8 16M68 8l8 16M80 8l8 16" stroke="#1a1a1a" stroke-width="3"/>
</svg>
`,
);

const segs = Array.from({ length: 16 }, (_, i) => {
  return `<rect x="${4 + i * 12}" y="2" width="8" height="12" fill="#FFD338" opacity="0.35"/>`;
}).join("\n  ");
write(
  "elements/progress-segments.svg",
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 16" preserveAspectRatio="none">
  ${segs}
</svg>
`,
);

write(
  "README.md",
  `# SunGraphica UI chrome

Extracted / recreated components from \`resource/Game UI collection FREE version\` (SunGraphica FREE).

- \`buttons/\` — framed action buttons (cyan / gold)
- \`icons/\` — bare glyphs (cyan / gold)
- \`elements/\` — panels, brackets, bars, reticles, banners

Palette: cyan \`#00FEFE\` (secondary), gold \`#FFD338\` (maps to \`--accent\`).
`,
);

console.log("done");
