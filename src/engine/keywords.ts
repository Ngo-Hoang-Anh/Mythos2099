import { frontCol, unitsOf } from "./board";
import type { Keyword, KeywordName, MatchState, PlayerId, UnitInstance } from "./types";

export const FLAG_KEYWORDS = new Set<KeywordName>([
  "cover",
  "flank",
  "blitz",
  "artillery",
  "jetPlane",
  "camouflage",
  "smokeScreen",
  "suppression",
  "scout",
  "radar",
  "hulldown",
  "slopedArmor",
]);

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

/** Runtime defense fields for a freshly created unit. */
export function blankDefensePools(): Pick<
  UnitInstance,
  "shield" | "shieldMax" | "barrier" | "barrierMax" | "tookDamageSinceRegen"
> {
  return {
    shield: 0,
    shieldMax: 0,
    barrier: 0,
    barrierMax: 0,
    tookDamageSinceRegen: false,
  };
}

/** Fill Shield/Barrier pools from printed keywords (keeps current if already set above 0 max). */
export function syncDefensePools(unit: UnitInstance): void {
  const shield = keywordValue(unit, "shield");
  if (shield > 0 && unit.shieldMax <= 0) {
    unit.shieldMax = shield;
    unit.shield = shield;
  }
  const barrier = keywordValue(unit, "barrier");
  if (barrier > 0 && unit.barrierMax <= 0) {
    unit.barrierMax = barrier;
    unit.barrier = barrier;
  }
}

export function stripKeyword(unit: UnitInstance, name: KeywordName): boolean {
  const before = unit.keywords.length;
  unit.keywords = unit.keywords.filter((k) => k.name !== name);
  return unit.keywords.length !== before;
}

/** Living Scout on this player's Frontline. */
export function hasFrontlineScout(state: MatchState, owner: PlayerId): boolean {
  const col = frontCol(owner);
  return unitsOf(state.board, owner).some(
    (unit) => unit.hp > 0 && unit.col === col && hasKeyword(unit, "scout"),
  );
}

export function camouflageBlocksMissile(
  state: MatchState,
  shooter: UnitInstance,
  target: UnitInstance,
): boolean {
  if (!hasKeyword(target, "camouflage")) return false;
  return !hasFrontlineScout(state, shooter.owner);
}

/** ATK/AP penalty from enemy Suppression marks on this unit's cell (−1 ATK / −2 AP per mark). */
export function suppressionPenalty(
  state: MatchState,
  unit: UnitInstance,
): { atk: number; ap: number } {
  if (hasFrontlineScout(state, unit.owner)) return { atk: 0, ap: 0 };
  const stacks = state.statuses.filter(
    (status) =>
      status.kind === "suppressionMark" &&
      status.col === unit.col &&
      status.lane === unit.row &&
      status.owner !== unit.owner,
  ).length;
  if (stacks <= 0) return { atk: 0, ap: 0 };
  return { atk: stacks, ap: stacks * 2 };
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
    [/^shield\s*:?\s*(\d+)$/i, "shield"],
    [/^barrier\s*:?\s*(\d+)$/i, "barrier"],
    [/^shock\s*:?\s*(\d+)$/i, "shock"],
    [/^veteran\s*:?\s*(\d+)$/i, "veteran"],
    [/^first\s*strike\s*:?\s*(\d+)$/i, "firstStrike"],
    [/^fire\s*:?\s*(\d+)$/i, "fire"],
    [/^corrosion\s*:?\s*(\d+)$/i, "corrosion"],
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
    [/^jet\s*plane$/i, "jetPlane"],
    [/^camouflage$/i, "camouflage"],
    [/^smoke\s*screen$/i, "smokeScreen"],
    [/^suppression$/i, "suppression"],
    [/^scout$/i, "scout"],
    [/^radar$/i, "radar"],
    [/^hull\s*down$/i, "hulldown"],
    [/^sloped\s*armor$/i, "slopedArmor"],
  ];
  for (const [re, name] of flags) {
    if (re.test(token)) return { name, value: 1 };
  }
  throw new Error(`Unknown keyword: ${token}`);
}
