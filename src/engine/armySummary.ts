import { getUnitDef } from "../data/units";
import { deckCardsOf } from "./army";
import { FLAG_KEYWORDS } from "./keywords";
import type { CardType, Keyword, KeywordName, UnitDef } from "./types";

export const KEYWORD_LABEL: Record<KeywordName, string> = {
  cover: "Cover",
  flank: "Flank",
  retaliate: "Retaliate",
  aggressive: "Aggressive",
  blitz: "Blitz",
  supportFire: "Support Fire",
  artillery: "Artillery",
  airStrike: "Air Strike",
  missile: "Missile",
  jetPlane: "Jet Plane",
  camouflage: "Camouflage",
  smokeScreen: "Smoke Screen",
  suppression: "Suppression",
  scout: "Scout",
  shield: "Shield",
  barrier: "Barrier",
  shock: "Shock",
  veteran: "Veteran",
  firstStrike: "First Strike",
  fire: "Fire",
  radar: "Radar",
  hulldown: "Hulldown",
  slopedArmor: "Sloped Armor",
  corrosion: "Corrosion",
};

/** Hover copy: one or two player-facing sentences. No targeting/rest edge cases. */
export const KEYWORD_SHORT: Record<KeywordName, string> = {
  cover: "If this lane has no enemy, this unit moves into a lane that does.",
  flank: "If this lane has an enemy, this unit moves into a lane that does not.",
  blitz: "After you deploy it, this unit advances to the Frontline if that cell is empty.",
  artillery: "Stays on Support and fires from the back. Rests when deployed (unless Blitz). Does not take or deal return fire.",
  airStrike: "Stays on Support and fights from the back line.",
  jetPlane: "Fights from Support. Rests when deployed (unless Blitz). Takes return fire and returns fire to whoever attacked it.",
  retaliate: "Adds {n} ATK when this unit counters.",
  aggressive: "Adds {n} ATK when this unit attacks.",
  supportFire: "Gives +{n} ATK to every other ally in this lane and the two adjacent lanes, including rested units.",
  missile: "Delayed attack. After combat, fires a missile with ATK {n}. Counts 50% of the target's armor (round up). AP does not apply.",
  camouflage: "Immune to Missile damage.",
  smokeScreen: "After taking gun damage on the enemy turn, dodge later gun hits until that turn ends.",
  suppression: "At end of your turn, mark an enemy cell for their next 2 turns: −1 ATK and −2 AP per mark. Prefers unmarked; stacks if every enemy cell is already marked.",
  scout: "While on Frontline, your units ignore enemy Camouflage, Smoke Screen, and Suppression on you.",
  shield: "Absorbs {n} damage before Armor. Regens half at the start of your turn if undamaged last turn.",
  barrier: "Reduces the next frontal gun hit by {n}. Recharges at end of your turn.",
  shock: "Depletes Barrier/Shield by {n}. Only matters vs those pools. Ignores Smoke.",
  veteran: "After attacking, permanently gain +{n} ATK and +{n} AP.",
  firstStrike: "Gain +{n} ATK and +{n} AP. Removed after this unit attacks or is attacked.",
  fire: "After dealing HP with a gun attack, burn for {n} at end of each turn for 3 turns. Highest only.",
  radar: "When this unit attacks, all allied Missiles re-aim.",
  hulldown: "At end of your turn, dig in: −3 damage from gun attacks. Missiles ignore this. Lost when this unit moves.",
  slopedArmor: "If a gun hit would deal 3 or less, ignore it.",
  corrosion: "On a connecting gun hit, permanently −{n} Armor (before damage).",
};

/** Tutorial-only copy. Hover UI must use KEYWORD_SHORT / keywordHelp. */
export const KEYWORD_FULL: Record<KeywordName, string> = {
  cover:
    "If this lane has no enemy, move to the Frontline of a lane that does. Prefers a lane with your Artillery on Support, then a lane with enemies and no allies. Nearest cell wins; ties go to the upper lane. Rests if this move leaves Support; a Frontline sidestep does not rest.",
  flank:
    "If this lane has an enemy, move to the Frontline of a lane that does not. Prefers an empty friendly lane. Nearest cell wins; ties go to the upper lane. Does not sidestep onto Support. Rests if this move leaves Support; a Frontline sidestep does not rest.",
  blitz: "After deploying, immediately advance to Frontline if that cell is empty. This deploy move does not rest the unit.",
  artillery:
    "Stays on Support and does not advance during relocation. Fires from the back line. Rests the turn it is deployed, unless it also has Blitz. Artillery does not take return fire when it attacks, and does not shoot back when it is attacked.",
  airStrike: "Stays on Support and does not advance during relocation. Fights from the back line like Artillery.",
  jetPlane:
    "Jet aircraft. Fights from Support and does not advance during relocation. Rests the turn it is deployed, unless it also has Blitz. Move cards can still reposition it. Unlike Artillery, a jet takes return fire when it attacks. When a jet is attacked, it returns fire to the units that shot it — even while rested or on Support.",
  retaliate:
    "When defending, add {n} ATK to each return-fire shot only if a non-rested enemy is in this lane. Does not apply when this unit is the attacker.",
  aggressive: "When this unit is the attacker in an engagement, add {n} ATK. Extra attacks and counterattacks do not gain Aggressive.",
  supportFire:
    "Every other living allied unit in this lane and the two adjacent lanes gains +{n} ATK, including rested units and a Front/Support partner. This unit does not gain its own Support Fire.",
  missile:
    "Delayed attack. After the gun volley, fire a missile with ATK {n}. Only 50% of the target's armor applies (rounded up). AP does not pierce it. Rested units skip. Prefers the enemy Support cell in this lane, then the nearest occupied lane.",
  camouflage:
    "This unit takes no Missile damage. An enemy Scout on Frontline lets their Missiles ignore Camouflage.",
  smokeScreen:
    "When this unit takes gun damage during the opponent's Engagement, it gains Smoke Dodge until that turn ends and ignores further gun hits. Shock attacks ignore Smoke and do not trigger it. An enemy Scout on Frontline ignores Smoke Dodge.",
  suppression:
    "At the end of your turn, each Suppression unit marks a random enemy-occupied cell (prefer unmarked). The mark lasts through the opponent's next 2 turns. Enemies on a marked cell have −1 ATK and −2 AP per mark. If every enemy cell is already marked, additional marks stack on a marked cell. Scout on Frontline ignores Suppression on your units.",
  scout:
    "While this unit is alive on your Frontline, your units ignore enemy Camouflage and Smoke Screen, and ignore Suppression marks affecting you.",
  shield:
    "Starts with a Shield pool of {n} that absorbs incoming gun strike power before Armor. Shock depletes Shield first. At the start of your turn, if this unit took no Shield/HP damage since the last check, Shield regenerates by half of its max (rounded up), capped at max.",
  barrier:
    "Starts with Barrier {n}. The next gun hit from an enemy on Frontline reduces damage taken by up to Barrier, then Barrier drops to 0. Recharges to max at the end of your turn. Does not block Support/Artillery angles. Shock also depletes Barrier.",
  shock:
    "When this unit gun-attacks a unit that has Barrier and/or Shield, deplete Barrier (if frontal) and Shield by {n} before the normal strike. Does nothing extra against targets with neither pool. Not dodged by Smoke Screen and does not trigger Smoke Screen.",
  veteran:
    "After this unit's attack volley (not return fire), permanently increase its printed ATK and AP by {n}. Stacks every time it attacks.",
  firstStrike:
    "While this keyword remains, this unit has +{n} ATK and +{n} AP. Remove First Strike after this unit fires a gun attack or is hit by a gun attack.",
  fire:
    "After this unit deals HP damage with a gun attack, the target gains Fire {n} for 3 turn passes. Only one Fire DoT per unit; the highest magnitude deals damage. A new Fire refreshes duration and keeps the higher magnitude.",
  radar:
    "When this unit's attack volley resolves, every living allied Missile unit immediately re-locks a target.",
  hulldown:
    "At the end of your turn, if not already dug in, this unit takes −3 damage from gun attacks until it moves. Flat reduction after Armor/AP — missiles ignore it, and Corrosion cannot strip it. Any move (cards, Blitz, Cover/Flank) clears Hulldown.",
  slopedArmor:
    "After Shield and Barrier, if the remaining gun damage is 1–3, that damage is ignored (ricochet).",
  corrosion:
    "When this unit's gun attack connects (not Smoke-dodged), permanently reduce the target's Armor by {n} (minimum 0) before damage is calculated. Applies once even if Shield or Barrier absorbs the hit.",
};

function fillValue(text: string, n: number): string {
  return text.replaceAll("{n}", String(n));
}

/** Hover tooltip. Keep this short. */
export function keywordHelp(k: Keyword): { title: string; body: string } {
  return { title: keywordFullLabel(k), body: fillValue(KEYWORD_SHORT[k.name], k.value) };
}

/** Full rules text. Use only in the tutorial. */
export function keywordTutorial(k: Keyword): { title: string; body: string } {
  return { title: keywordFullLabel(k), body: fillValue(KEYWORD_FULL[k.name], k.value) };
}

export function keywordFullLabel(k: Keyword): string {
  const base = KEYWORD_LABEL[k.name];
  if (FLAG_KEYWORDS.has(k.name)) return base;
  return `${base} ${k.value}`;
}

export const STAT_HELP = {
  hp: {
    title: "HP",
    body: "Hit points. The unit is destroyed when HP reaches 0.",
  },
  atk: {
    title: "ATK",
    body: "Gun damage in Engagement. Reduced by the target's Armor after AP.",
  },
  armor: {
    title: "Armor",
    body: "Reduces incoming gun damage. Missiles only count half of Armor (rounded up).",
  },
  ap: {
    title: "AP",
    body: "Armor Piercing. Subtracts from the target's Armor before gun damage is applied. Does not cut HP directly.",
  },
  supply: {
    title: "Supply",
    body: "Cost in Supply to deploy this unit or play this card.",
  },
} as const;

export interface CardCount {
  name: string;
  type: CardType;
  cost: number;
  count: number;
}

export interface KeywordCount {
  name: KeywordName;
  label: string;
  count: number;
  avgValue: number | null;
}

export interface ArmySummary {
  units: UnitDef[];
  count: number;
  avgCp: number;
  avgHp: number;
  avgAtk: number;
  avgArmor: number;
  avgAp: number;
  keywords: KeywordCount[];
  cards: CardCount[];
  deckSize: number;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function countCards(cards: { name: string; type: CardType; cost: number }[]): CardCount[] {
  const map = new Map<string, CardCount>();
  for (const card of cards) {
    const key = `${card.type}:${card.name}`;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { name: card.name, type: card.type, cost: card.cost, count: 1 });
  }
  const order: CardType[] = ["special", "maneuver", "move"];
  return [...map.values()].sort((a, b) => {
    const t = order.indexOf(a.type) - order.indexOf(b.type);
    return t !== 0 ? t : a.name.localeCompare(b.name);
  });
}

export function summarizeArmy(unitIds: number[]): ArmySummary {
  const units = unitIds.map(getUnitDef);
  const allCards = units.flatMap((u) => deckCardsOf(u));
  const byKeyword = new Map<KeywordName, number[]>();
  for (const unit of units) {
    for (const k of unit.keywords) {
      const list = byKeyword.get(k.name) ?? [];
      list.push(k.value);
      byKeyword.set(k.name, list);
    }
  }
  const keywords: KeywordCount[] = [...byKeyword.entries()]
    .map(([name, values]) => ({
      name,
      label: KEYWORD_LABEL[name],
      count: values.length,
      avgValue: FLAG_KEYWORDS.has(name) ? null : avg(values),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    units,
    count: units.length,
    avgCp: avg(units.map((u) => u.cost)),
    avgHp: avg(units.map((u) => u.hp)),
    avgAtk: avg(units.map((u) => u.atk)),
    avgArmor: avg(units.map((u) => u.armor)),
    avgAp: avg(units.map((u) => u.ap)),
    keywords,
    cards: countCards(allCards),
    deckSize: allCards.length,
  };
}

export function formatAvg(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
