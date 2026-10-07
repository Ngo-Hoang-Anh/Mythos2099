import type { Keyword, KeywordName, UnitInstance } from "./types";

export const FLAG_KEYWORDS = new Set<KeywordName>(["cover", "flank", "blitz", "artillery", "airStrike", "jetPlane"]);

export function keywordValue(unit: Pick<UnitInstance, "keywords">, name: KeywordName): number {
  const found = unit.keywords.find((k) => k.name === name);
  if (!found) return 0;
  return found.value;
}

export function hasKeyword(unit: Pick<UnitInstance, "keywords">, name: KeywordName): boolean {
  return unit.keywords.some((k) => k.name === name);
}

/** Artillery and jets rest on deploy, unless they also have Blitz. */
export function restsOnDeploy(unit: Pick<UnitInstance, "keywords">): boolean {
  if (hasKeyword(unit, "blitz")) return false;
  return hasKeyword(unit, "artillery") || hasKeyword(unit, "jetPlane");
}

export function armorPiercingOf(unit: Pick<UnitInstance, "ap" | "tempAp">): number {
  return Math.max(0, unit.ap + unit.tempAp);
}

export function retaliateOf(unit: UnitInstance): number {
  return keywordValue(unit, "retaliate") + unit.tempRetaliate;
}

export function aggressiveOf(unit: UnitInstance): number {
  return keywordValue(unit, "aggressive");
}

export function parseKeywords(raw: string): Keyword[] {
  if (!raw || /^none$/i.test(raw.trim())) return [];
  return raw
    .split(/[;,]|(?<=\d)\.(?=[A-Za-z])/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseOne);
}

function parseOne(token: string): Keyword {
  const numbered: Array<[RegExp, KeywordName]> = [
    [/^retaliat(?:e|ion)\s*:?\s*(\d+)$/i, "retaliate"],
    [/^aggres+ive\s*:?\s*(\d+)$/i, "aggressive"],
    [/^support\s*fire\s*:?\s*(\d+)$/i, "supportFire"],
    [/^miss(?:ile|le)\s*:?\s*(\d+)$/i, "missile"],
  ];
  for (const [re, name] of numbered) {
    const m = token.match(re);
    if (m) return { name, value: Number(m[1]) };
  }
  const flags: Array<[RegExp, KeywordName]> = [
    [/^cover$/i, "cover"],
    [/^flank$/i, "flank"],
    [/^blitz$/i, "blitz"],
    [/^artil+ery$/i, "artillery"],
    [/^air\s*strike$/i, "airStrike"],
    [/^jet\s*plane$/i, "jetPlane"],
  ];
  for (const [re, name] of flags) {
    if (re.test(token)) return { name, value: 1 };
  }
  throw new Error(`Unknown keyword: ${token}`);
}
