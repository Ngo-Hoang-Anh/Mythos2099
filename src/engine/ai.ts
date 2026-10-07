import { getUnitDef } from "../data/units";
import { isInitiativeCard } from "../data/initiative";
import {
  enemyFirstInRow,
  frontCol,
  isFrontline,
  isSupport,
  oppositeUnit,
  supportCol,
  unitsOf,
} from "./board";
import { combatDamage, computeStrikeDamage, defenseArmor, extraGunDamage } from "./combat";
import { canCounter, canVolley, fightsFromSupport, nearestEnemyLane, sideUnitsInLane, strikeAtk } from "./combat/helpers";
import { discardsNeeded, needsDesperateMeasure } from "./desperateMeasure";
import { armorPiercingOf, hasKeyword, keywordValue, retaliateOf } from "./keywords";
import { applyAction } from "./match";
import {
  destCountForEffect,
  dirsForEffect,
  legalDestinations,
  minDestCountForEffect,
  unitsNeededForMove,
} from "./move";
import { isUntargetableBy } from "./status";
import { current } from "./state";
import {
  DISCARD_REDRAW_LIMIT,
  ROWS,
  type Action,
  type BoardPos,
  type CardInstance,
  type Direction,
  type EffectId,
  type LogEntry,
  type MatchState,
  type PlayTargets,
  type PlayerId,
  type UnitDef,
  type UnitInstance,
} from "./types";

/** Flat / gun damage effects that can finish a unit off the engagement clock. */
const KILL_DAMAGE_EFFECTS = new Set<EffectId>([
  "sniping",
  "bunkerBreaker",
  "driveByStrafe",
  "precisionAirStrike",
  "kamikazeBlast",
  "extraCombat",
  "artilleryCall",
  "quickMobilization",
  "thunderStrike",
  "sustainedSalvo",
  "heavyOverdrive",
  "strafingRun",
  "plasmaCharge",
  "hitAndRun",
  "precisionStrike",
]);

/** Extra engagement cards. */
const ENGAGE_EFFECTS = new Set<EffectId>(["quickEngage", "forceEngage", "ambush", "trap"]);

function foeId(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}

function sourceOnBoard(state: MatchState, card: CardInstance): UnitInstance | null {
  return unitsOf(state.board, current(state).id).find((u) => u.defId === card.ownerUnitId) ?? null;
}

function isMeleeDef(def: Pick<UnitDef, "keywords">): boolean {
  return !fightsFromSupport({ keywords: def.keywords } as UnitInstance);
}

function isBacklineDef(def: Pick<UnitDef, "keywords">): boolean {
  return fightsFromSupport({ keywords: def.keywords } as UnitInstance);
}

function livingEnemies(state: MatchState, player: PlayerId): UnitInstance[] {
  return unitsOf(state.board, foeId(player)).filter((u) => u.hp > 0 && !isUntargetableBy(state, u, player));
}

/** Prefer finishing wounded foes — lower current HP first, then lower max HP. */
function livingEnemiesByWeakness(state: MatchState, player: PlayerId): UnitInstance[] {
  return [...livingEnemies(state, player)].sort((a, b) => a.hp - b.hp || a.maxHp - b.maxHp || b.cost - a.cost);
}

function affordable(card: CardInstance, cp: number): boolean {
  return card.cost <= cp;
}

/** Cover / Flank relocate automatically — AI must not spend Move cards on them. */
function isAutoRelocator(unit: Pick<UnitInstance, "keywords">): boolean {
  return hasKeyword(unit, "cover") || hasKeyword(unit, "flank");
}

function movableAllies(state: MatchState, player: PlayerId): UnitInstance[] {
  return unitsOf(state.board, player).filter((u) => u.hp > 0 && !isAutoRelocator(u));
}

/** How attractive an enemy is as a focus target (wounded > healthy). */
function weakEnemyFocusScore(enemy: UnitInstance): number {
  const missing = enemy.maxHp - enemy.hp;
  const ratio = enemy.hp / Math.max(1, enemy.maxHp);
  let score = missing * 8;
  if (ratio <= 0.35) score += 55;
  else if (ratio <= 0.55) score += 35;
  else if (ratio <= 0.75) score += 15;
  if (enemy.hp <= 3) score += 40;
  else if (enemy.hp <= 5) score += 20;
  return score;
}

function logSinceManeuverStart(state: MatchState): LogEntry[] {
  const marker = `P${current(state).id + 1} Maneuver`;
  let start = -1;
  for (let i = state.log.length - 1; i >= 0; i--) {
    if (state.log[i]!.text === marker) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];
  return state.log.slice(start + 1);
}

/**
 * True when this Maneuver already spent a non-kill card.
 * Keeps continueAi from dumping the whole hand across steps.
 */
function playedNonKillThisManeuver(state: MatchState): boolean {
  const plays: string[] = [];
  for (const entry of logSinceManeuverStart(state)) {
    if (entry.text.startsWith("Played ") && entry.icon === "card") {
      plays.push(entry.text.slice("Played ".length));
    }
  }
  if (plays.length === 0) return false;

  const pool = [...current(state).discard];
  for (let p = plays.length - 1; p >= 0; p--) {
    const name = plays[p]!;
    for (let d = pool.length - 1; d >= 0; d--) {
      if (pool[d]!.name !== name) continue;
      const card = pool.splice(d, 1)[0]!;
      if (!KILL_DAMAGE_EFFECTS.has(card.effectId)) return true;
      break;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Trade evaluation
// ---------------------------------------------------------------------------

export interface LaneTrade {
  row: number;
  ally: UnitInstance;
  enemy: UnitInstance | null;
  ourDamage: number;
  theirDamage: number;
  /** Unit-vs-unit differential, or +1 when only HQ pressure is available. */
  value: number;
  losing: boolean;
}

function canThreatenFrom(
  state: MatchState,
  player: PlayerId,
  unit: UnitInstance,
  row: number,
  col: number,
): boolean {
  const at = { ...unit, row, col };
  if (fightsFromSupport(at)) return true;
  if (isFrontline(player, col)) return true;
  // Support melee advances into an empty Front at engagement start.
  return isSupport(player, col) && !state.board[frontCol(player)][row];
}

/**
 * Trade value for parking `unit` on (col,row).
 * - Contested lane: ourDamage − theirDamage (kills/deaths adjusted)
 * - Empty lane that can hit HQ: flat +1 (never a "win" over a real exchange)
 * - Cannot shoot: 0
 */
export function laneTradeValue(
  state: MatchState,
  player: PlayerId,
  unit: UnitInstance,
  row: number,
  col: number = unit.col,
): number {
  if (!canThreatenFrom(state, player, unit, row, col)) return 0;

  const enemy = enemyFirstInRow(state.board, player, row);
  if (!enemy || enemy.hp <= 0) return 1; // HQ pressure only

  const shootCol = fightsFromSupport(unit)
    ? supportCol(player)
    : isSupport(player, col)
      ? frontCol(player)
      : col;
  const shooter = { ...unit, row, col: shootCol };
  const ourDamage = computeStrikeDamage({
    atk: strikeAtk(state, shooter, true),
    armor: defenseArmor(enemy),
    armorPiercing: armorPiercingOf(shooter),
  });
  let theirDamage = 0;
  if (canCounter(enemy) && !hasKeyword(shooter, "artillery")) {
    theirDamage = computeStrikeDamage({
      atk: strikeAtk(state, enemy, false),
      armor: defenseArmor(shooter),
      armorPiercing: armorPiercingOf(enemy),
    });
  } else if (retaliateOf(enemy) > 0 && !hasKeyword(shooter, "artillery")) {
    theirDamage = combatDamage(enemy, shooter, 0, state);
  }

  let value = ourDamage - theirDamage;
  if (ourDamage >= enemy.hp) value += 3;
  if (theirDamage >= unit.hp) value -= 6;
  return value;
}

/** Predict gun exchange for the current player's unit in a lane (no relocation sim). */
export function predictLaneTrade(state: MatchState, player: PlayerId, row: number): LaneTrade | null {
  const ally =
    sideUnitsInLane(state, player, row).find((u) => u.hp > 0 && canVolley(u)) ??
    sideUnitsInLane(state, player, row).find((u) => u.hp > 0) ??
    null;
  if (!ally) return null;
  const enemy = enemyFirstInRow(state.board, player, row);
  const value = laneTradeValue(state, player, ally, row, ally.col);
  if (!enemy || enemy.hp <= 0) {
    return { row, ally, enemy: null, ourDamage: 0, theirDamage: 0, value, losing: false };
  }

  const ourDamage = canVolley(ally)
    ? computeStrikeDamage({
        atk: strikeAtk(state, ally, true),
        armor: defenseArmor(enemy),
        armorPiercing: armorPiercingOf(ally),
      })
    : 0;
  let theirDamage = 0;
  if (canCounter(enemy) && !hasKeyword(ally, "artillery")) {
    theirDamage = computeStrikeDamage({
      atk: strikeAtk(state, enemy, false),
      armor: defenseArmor(ally),
      armorPiercing: armorPiercingOf(enemy),
    });
  } else if (retaliateOf(enemy) > 0 && !hasKeyword(ally, "artillery")) {
    theirDamage = combatDamage(enemy, ally, 0, state);
  }

  const weDie = theirDamage >= ally.hp;
  const theyDie = ourDamage >= enemy.hp;
  const losing = (weDie && !theyDie) || (!weDie && !theyDie && theirDamage > ourDamage && theirDamage >= Math.ceil(ally.hp / 2));
  return { row, ally, enemy, ourDamage, theirDamage, value, losing };
}

export function losingTrades(state: MatchState, player: PlayerId): LaneTrade[] {
  const out: LaneTrade[] = [];
  for (let row = 0; row < ROWS; row++) {
    const trade = predictLaneTrade(state, player, row);
    if (trade?.losing) out.push(trade);
  }
  return out;
}

function hasLosingTrades(state: MatchState, player: PlayerId): boolean {
  return losingTrades(state, player).length > 0;
}

// ---------------------------------------------------------------------------
// Card classification / kill & engage prediction
// ---------------------------------------------------------------------------

function isMoveCard(card: CardInstance): boolean {
  return Boolean(dirsForEffect(card.effectId)) || card.type === "move";
}

function predictedFlatDamage(state: MatchState, card: CardInstance, enemy: UnitInstance): number | null {
  const source = sourceOnBoard(state, card);
  switch (card.effectId) {
    case "sniping":
      return 2;
    case "kamikazeBlast":
      return 8;
    case "precisionAirStrike": {
      if (!isSupport(enemy.owner, enemy.col)) return null;
      return computeStrikeDamage({ atk: 5, armor: defenseArmor(enemy), armorPiercing: 0 });
    }
    case "bunkerBreaker":
    case "driveByStrafe": {
      if (!source) return null;
      if (oppositeUnit(state.board, source.owner, source.row)?.instanceId !== enemy.instanceId) return null;
      return computeStrikeDamage({
        atk: 5,
        armor: defenseArmor(enemy),
        armorPiercing: armorPiercingOf(source),
      });
    }
    case "extraCombat":
    case "artilleryCall":
    case "quickMobilization":
    case "thunderStrike":
    case "hitAndRun":
    case "precisionStrike": {
      if (!source) return null;
      if (card.effectId === "artilleryCall" && !hasKeyword(source, "artillery")) return null;
      return extraGunDamage(state, source, enemy);
    }
    case "sustainedSalvo": {
      if (!source) return null;
      const buffed = { ...source, tempAtk: source.tempAtk + 2 };
      return extraGunDamage(state, buffed, enemy);
    }
    case "heavyOverdrive":
    case "strafingRun":
    case "plasmaCharge": {
      if (!source) return null;
      const buffed = { ...source, tempAtk: source.tempAtk + 2, tempAp: source.tempAp + 3 };
      return extraGunDamage(state, buffed, enemy);
    }
    default:
      return null;
  }
}

function killTargetForCard(state: MatchState, card: CardInstance): UnitInstance | null {
  if (!KILL_DAMAGE_EFFECTS.has(card.effectId)) return null;
  if (card.requiresSourceOnField && !sourceOnBoard(state, card)) return null;

  const player = current(state).id;
  const enemies = livingEnemies(state, player);
  let best: UnitInstance | null = null;
  let bestOverkill = -1;

  for (const enemy of enemies) {
    const dmg = predictedFlatDamage(state, card, enemy);
    if (dmg === null || dmg < enemy.hp) continue;
    const overkill = dmg - enemy.hp;
    if (overkill > bestOverkill || (overkill === bestOverkill && enemy.cost > (best?.cost ?? -1))) {
      best = enemy;
      bestOverkill = overkill;
    }
  }
  return best;
}

function engagementParticipants(
  state: MatchState,
  card: CardInstance,
): { ally: UnitInstance; enemy: UnitInstance } | null {
  const player = current(state).id;
  const source = sourceOnBoard(state, card);

  if (card.effectId === "quickEngage" || card.effectId === "ambush") {
    const allies = unitsOf(state.board, player).filter((u) => u.hp > 0 && isFrontline(u.owner, u.col));
    for (const ally of allies) {
      if (card.effectId === "ambush" && source && ally.instanceId !== source.instanceId) continue;
      if (card.effectId === "ambush" && !source) continue;
      const enemy = oppositeUnit(state.board, ally.owner, ally.row);
      if (enemy && enemy.hp > 0) return { ally: card.effectId === "ambush" ? source! : ally, enemy };
    }
    return null;
  }

  if (card.effectId === "forceEngage") {
    for (const enemy of livingEnemiesByWeakness(state, player)) {
      const ally =
        sideUnitsInLane(state, player, enemy.row).find((u) => canVolley(u) && u.hp > 0) ?? null;
      if (ally) return { ally, enemy };
    }
    return null;
  }

  if (card.effectId === "trap") {
    if (!source) return null;
    const enemy = oppositeUnit(state.board, source.owner, source.row);
    if (enemy && enemy.hp > 0) return { ally: source, enemy };
  }
  return null;
}

/** Damage difference (ours − theirs) for an extra engagement, after ambush buffs if any. */
function engagementDamageDiff(state: MatchState, card: CardInstance): number | null {
  const pair = engagementParticipants(state, card);
  if (!pair) return null;
  let ally = pair.ally;
  let enemy = pair.enemy;
  if (card.effectId === "ambush") {
    ally = { ...ally, tempAtk: ally.tempAtk + 2, tempArmor: ally.tempArmor + 2 };
  }
  if (card.effectId === "forceEngage") {
    enemy = { ...enemy, tempAtk: enemy.tempAtk - 1 };
  }
  const ourDamage = canVolley(ally)
    ? computeStrikeDamage({
        atk: strikeAtk(state, ally, true),
        armor: defenseArmor(enemy),
        armorPiercing: armorPiercingOf(ally),
      })
    : 0;
  const theirDamage =
    canCounter(enemy) && !hasKeyword(ally, "artillery")
      ? computeStrikeDamage({
          atk: strikeAtk(state, enemy, false),
          armor: defenseArmor(ally),
          armorPiercing: armorPiercingOf(enemy),
        })
      : 0;
  return ourDamage - theirDamage;
}

function isProfitableEngagement(state: MatchState, card: CardInstance): boolean {
  const pair = engagementParticipants(state, card);
  if (!pair) return false;
  const diff = engagementDamageDiff(state, card);
  if (diff === null) return false;
  // Always take a free/cheap finish on a wounded unit.
  let ally = pair.ally;
  let enemy = pair.enemy;
  if (card.effectId === "ambush") {
    ally = { ...ally, tempAtk: ally.tempAtk + 2, tempArmor: ally.tempArmor + 2 };
  }
  if (card.effectId === "forceEngage") {
    enemy = { ...enemy, tempAtk: enemy.tempAtk - 1 };
  }
  const ourDamage = canVolley(ally)
    ? computeStrikeDamage({
        atk: strikeAtk(state, ally, true),
        armor: defenseArmor(enemy),
        armorPiercing: armorPiercingOf(ally),
      })
    : 0;
  if (ourDamage >= enemy.hp) return true;
  if (weakEnemyFocusScore(enemy) >= 55 && diff >= card.cost) return true;
  return diff >= 2 * Math.max(1, card.cost);
}

// ---------------------------------------------------------------------------
// Max deployment cost
// ---------------------------------------------------------------------------

function reserveForMoves(state: MatchState, hand: CardInstance[], losing: boolean): number {
  const moves = hand.filter(isMoveCard).sort((a, b) => a.cost - b.cost);
  if (moves.length === 0) return 0;

  if (losing) {
    const lanes = losingTrades(state, current(state).id).length;
    let reserved = 0;
    for (let i = 0; i < Math.min(lanes, moves.length); i++) {
      reserved += moves[i]!.cost;
    }
    return reserved;
  }

  // Hold enough for one trade-improving lane shift when the board asks for it.
  if (shouldImproveTrade(state)) return moves[0]!.cost;
  return 0;
}

function reserveForSpecials(state: MatchState, hand: CardInstance[], allies: UnitInstance[]): number {
  if (allies.length === 0) return 0;
  const losing = losingTrades(state, current(state).id);
  const prefer = losing[0]?.ally ?? allies[0]!;
  const specials = hand
    .filter(
      (c) =>
        c.type === "special" &&
        !isInitiativeCard(c) &&
        !KILL_DAMAGE_EFFECTS.has(c.effectId) &&
        !ENGAGE_EFFECTS.has(c.effectId) &&
        (!c.requiresSourceOnField || sourceOnBoard(state, c)),
    )
    .filter((c) => isHighValueSpecial(state, c, prefer, sourceOnBoard(state, c), allies))
    .sort((a, b) => a.cost - b.cost);
  if (specials.length === 0) return 0;
  return specials[0]!.cost;
}

function reserveForKills(state: MatchState, hand: CardInstance[]): number {
  let reserved = 0;
  for (const card of hand) {
    if (!KILL_DAMAGE_EFFECTS.has(card.effectId)) continue;
    if (killTargetForCard(state, card)) reserved += card.cost;
  }
  return reserved;
}

function reserveForEngages(state: MatchState, hand: CardInstance[]): number {
  let reserved = 0;
  for (const card of hand) {
    if (!ENGAGE_EFFECTS.has(card.effectId)) continue;
    if (isProfitableEngagement(state, card)) reserved += card.cost;
  }
  return reserved;
}

/**
 * Supply the AI may spend on deploys after reserving planned maneuver spends.
 * Does not invent extra budget from supply cards — leftover CP is intentionally fine.
 */
export function computeMaxDeploymentCost(state: MatchState): number {
  const player = current(state);
  const allies = unitsOf(state.board, player.id);
  const losing = hasLosingTrades(state, player.id);
  const reserved =
    reserveForMoves(state, player.hand, losing) +
    reserveForSpecials(state, player.hand, allies) +
    reserveForKills(state, player.hand) +
    reserveForEngages(state, player.hand);
  return Math.max(0, player.commandPoints - reserved);
}

/** Prefer holding CP: one summon per turn so the army comes out evenly. */
function maxDeploysThisTurn(_state: MatchState): number {
  return 1;
}

/** Skip filler drops onto mediocre lanes. */
const MIN_DEPLOY_ROW_SCORE = 35;

// ---------------------------------------------------------------------------
// Deployment placement & unit priority
// ---------------------------------------------------------------------------

function hasNonFlankFrontline(state: MatchState, player: PlayerId): boolean {
  const front = frontCol(player);
  for (let row = 0; row < ROWS; row++) {
    const unit = state.board[front][row];
    if (unit && unit.hp > 0 && !hasKeyword(unit, "flank")) return true;
    // Support melee will Advance into an empty Front next engagement.
    const support = state.board[supportCol(player)][row];
    if (
      support &&
      support.hp > 0 &&
      isMeleeDef(support) &&
      !hasKeyword(support, "flank") &&
      !state.board[front][row]
    ) {
      return true;
    }
  }
  return false;
}

function frontCoverInRow(state: MatchState, player: PlayerId, row: number): boolean {
  const front = state.board[frontCol(player)][row];
  if (front && front.hp > 0 && !hasKeyword(front, "flank")) return true;
  const support = state.board[supportCol(player)][row];
  return Boolean(
    support && support.hp > 0 && isMeleeDef(support) && !hasKeyword(support, "flank") && !state.board[frontCol(player)][row],
  );
}

/** Reward putting high AP onto high-armor foes (pierce value). */
function apVsArmorScore(ourAp: number, enemyArmor: number): number {
  if (ourAp <= 0 || enemyArmor <= 0) return 0;
  const pierced = Math.min(ourAp, enemyArmor);
  if (enemyArmor >= 5 && ourAp >= 3) return 55 + pierced * 18;
  if (enemyArmor >= 4 && ourAp >= 2) return 40 + pierced * 14;
  if (enemyArmor >= 3 && ourAp >= 2) return 25 + pierced * 10;
  return pierced * 4;
}

function highArmorEnemies(state: MatchState, player: PlayerId): UnitInstance[] {
  return unitsOf(state.board, foeId(player)).filter((e) => e.hp > 0 && defenseArmor(e) >= 3);
}

function scoreDeployRow(state: MatchState, def: UnitDef, row: number): number {
  const player = current(state).id;
  const support = supportCol(player);
  if (state.board[support][row]) return -Infinity;

  const enemy = enemyFirstInRow(state.board, player, row);
  const missile = keywordValue(def, "missile");
  const retaliate = keywordValue(def, "retaliate");
  const armor = def.armor;
  const hp = def.hp;
  const melee = isMeleeDef(def);
  const backline = isBacklineDef(def);
  let score = 0;

  if (missile > 0) {
    score += enemy ? -40 : 120;
  }
  if (retaliate > 0) {
    score += enemy ? 100 : -20;
  }
  if (enemy) {
    if (armor >= 4 && enemy.ap <= 2) score += 80;
    if (hp >= 8 && armor <= 2 && enemy.ap >= 3) score += 80;
    if (armor >= 3 && enemy.ap < armor) score += 40;
    // High AP → high armor matchup (core request).
    score += apVsArmorScore(def.ap, defenseArmor(enemy));
    if (defenseArmor(enemy) >= 4 && def.ap <= 1) score -= 55;
    if (melee) score += 30;
    // Hunt wounded player units — finish them before they recover.
    score += weakEnemyFocusScore(enemy);
    if (enemy.hp <= def.atk + def.ap) score += 45;
  } else if (melee) {
    score += 10;
    // Don't park a pierce specialist on an empty lane while armored foes exist.
    if (def.ap >= 3 && highArmorEnemies(state, player).length > 0) score -= 45;
    // Prefer contesting a nearby weak enemy over pure HQ parking when possible.
    const weakest = livingEnemiesByWeakness(state, player)[0];
    if (weakest && weakEnemyFocusScore(weakest) >= 35) score -= 15;
  }

  if (backline && frontCoverInRow(state, player, row)) {
    score += 110;
  } else if (backline && !frontCoverInRow(state, player, row)) {
    score -= 50;
  }

  if (melee && !hasNonFlankFrontline(state, player)) {
    score += 60;
  }

  // Slight preference for central lanes when otherwise equal.
  score += 2 - Math.abs(row - 2);
  return score;
}

function unitDeployPriority(state: MatchState, def: UnitDef): number {
  const player = current(state).id;
  const covered = hasNonFlankFrontline(state, player);
  let bonus = 0;
  if (def.ap >= 2 && highArmorEnemies(state, player).length > 0) {
    bonus += 50 + def.ap * 10;
  }
  const weakest = livingEnemiesByWeakness(state, player)[0];
  if (weakest) {
    bonus += Math.min(40, weakEnemyFocusScore(weakest) * 0.35);
    if (weakest.hp <= def.atk + def.ap) bonus += 25;
  }
  if (!covered && isMeleeDef(def)) return 1000 + bonus - def.cost;
  if (covered && isBacklineDef(def)) return 900 + bonus - def.cost;
  if (covered && isMeleeDef(def)) return 700 + bonus - def.cost;
  return 500 + bonus - def.cost;
}

function pickBestRow(state: MatchState, def: UnitDef): number | null {
  let bestRow: number | null = null;
  let bestScore = -Infinity;
  for (let row = 0; row < ROWS; row++) {
    const score = scoreDeployRow(state, def, row);
    if (score > bestScore) {
      bestScore = score;
      bestRow = row;
    }
  }
  return bestScore > -Infinity ? bestRow : null;
}

function pickDesperateDiscards(state: MatchState, need: number, keepIds: Set<string>): string[] | null {
  const player = current(state);
  if (need <= 0) return [];
  if (player.hand.length < need) return null;

  const scored = player.hand.map((card) => {
    let score = card.cost;
    const dups = player.hand.filter((c) => c.templateId === card.templateId).length;
    if (dups >= 2) score += 50;
    if (keepIds.has(card.instanceId)) score -= 100;
    if (KILL_DAMAGE_EFFECTS.has(card.effectId) && killTargetForCard(state, card)) score -= 80;
    if (ENGAGE_EFFECTS.has(card.effectId) && isProfitableEngagement(state, card)) score -= 60;
    if (isMoveCard(card) && hasLosingTrades(state, player.id)) score -= 40;
    return { card, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, need).map((s) => s.card.instanceId);
}

function cardsToKeep(state: MatchState): Set<string> {
  const player = current(state);
  const keep = new Set<string>();
  for (const card of player.hand) {
    if (KILL_DAMAGE_EFFECTS.has(card.effectId) && killTargetForCard(state, card)) keep.add(card.instanceId);
    if (ENGAGE_EFFECTS.has(card.effectId) && isProfitableEngagement(state, card)) keep.add(card.instanceId);
    if (isMoveCard(card) && hasLosingTrades(state, player.id)) keep.add(card.instanceId);
  }
  return keep;
}

function* deployCandidates(state: MatchState): Generator<Action> {
  const player = current(state);
  if (player.deploysThisTurn >= maxDeploysThisTurn(state)) {
    yield { type: "endDeployment" };
    return;
  }

  const maxCost = computeMaxDeploymentCost(state);
  const keep = cardsToKeep(state);
  const emptyBoard = unitsOf(state.board, player.id).length === 0;

  const candidates = player.undeployed
    .filter((id) => id !== 0)
    .map((id) => getUnitDef(id))
    .map((def) => {
      const row = pickBestRow(state, def);
      const score = row === null ? -Infinity : scoreDeployRow(state, def, row);
      return { def, priority: unitDeployPriority(state, def), row, score };
    })
    .filter((c) => c.row !== null && (emptyBoard || c.score >= MIN_DEPLOY_ROW_SCORE))
    .sort((a, b) => b.priority - a.priority || b.score - a.score);

  for (const { def, row } of candidates) {
    if (row === null) continue;
    if (def.cost <= player.commandPoints && def.cost <= maxCost) {
      yield { type: "deploy", unitDefId: def.id, row };
    }
  }

  const reserveCosts = player.undeployed.filter((id) => id !== 0).map((id) => getUnitDef(id).cost);
  const enemy = foeId(player.id);
  if (
    needsDesperateMeasure(
      reserveCosts,
      player.commandPoints,
      player.hand.length,
      player.deploysThisTurn,
      unitsOf(state.board, player.id).length,
      unitsOf(state.board, enemy).length,
    )
  ) {
    for (const { def, row } of candidates) {
      if (row === null) continue;
      const need = discardsNeeded(def.cost, player.commandPoints);
      if (need <= 0) continue;
      const paid = def.cost - need / 2;
      if (paid > maxCost) continue;
      const discards = pickDesperateDiscards(state, need, keep);
      if (!discards) continue;
      yield { type: "deploy", unitDefId: def.id, row, discardCardIds: discards };
    }
  }

  yield { type: "endDeployment" };
}

// ---------------------------------------------------------------------------
// Maneuver: recycle, kills, specials, engages, moves
// ---------------------------------------------------------------------------

function pickDuplicateRecycle(state: MatchState): Action | null {
  const player = current(state);
  if (state.phase !== "maneuver") return null;
  if (player.discardRedrawsUsed >= DISCARD_REDRAW_LIMIT) return null;
  if (player.deck.length === 0) return null;

  const counts = new Map<string, CardInstance[]>();
  for (const card of player.hand) {
    const list = counts.get(card.templateId) ?? [];
    list.push(card);
    counts.set(card.templateId, list);
  }
  for (const list of counts.values()) {
    if (list.length < 2) continue;
    // Discard a spare duplicate; keep the first.
    return { type: "discardRedraw", cardId: list[1]!.instanceId };
  }
  return null;
}

function targetsForKill(state: MatchState, card: CardInstance, enemy: UnitInstance): PlayTargets {
  const source = sourceOnBoard(state, card);
  switch (card.effectId) {
    case "sniping":
    case "kamikazeBlast":
    case "precisionAirStrike":
    case "precisionStrike":
      return { unitIds: [enemy.instanceId] };
    case "artilleryCall":
    case "extraCombat":
      return source ? { unitIds: [source.instanceId] } : {};
    default:
      return source ? { unitIds: [source.instanceId] } : {};
  }
}

function targetsForSpecial(
  state: MatchState,
  card: CardInstance,
  prefer: UnitInstance,
  source: UnitInstance | null,
  allies: UnitInstance[],
): PlayTargets | null {
  switch (card.effectId) {
    case "fortify":
    case "concentratedFire":
    case "tacticalStrike":
    case "fieldRepair":
      return { unitIds: [prefer.instanceId] };
    case "analyzeWeakness": {
      const enemy = livingEnemiesByWeakness(state, current(state).id)[0];
      return enemy ? { unitIds: [enemy.instanceId] } : null;
    }
    case "diversionDown":
    case "diversionUp": {
      const enemy = livingEnemiesByWeakness(state, current(state).id)[0];
      return enemy ? { unitIds: [enemy.instanceId] } : null;
    }
    case "diversionToLane": {
      if (!source) return null;
      const enemy = livingEnemiesByWeakness(state, current(state).id).find((e) => e.row !== source.row);
      return enemy ? { unitIds: [enemy.instanceId] } : null;
    }
    case "lure": {
      const enemies = livingEnemiesByWeakness(state, current(state).id);
      const enemy = enemies.find((e) => Math.abs(e.row - prefer.row) === 1);
      return enemy ? { unitIds: [prefer.instanceId, enemy.instanceId] } : null;
    }
    case "reorganize": {
      if (allies.length < 2) return null;
      return { unitIds: [allies[0]!.instanceId, allies[1]!.instanceId] };
    }
    case "stormCaller": {
      if (!source) return null;
      const other = allies.find((u) => u.instanceId !== source.instanceId && keywordValue(u, "missile") > 0);
      return other ? { unitIds: [other.instanceId] } : null;
    }
    case "emergencyOverhaul":
    case "supplyLogistics":
    case "emergencyMedicalKit":
    case "nanoRepair": {
      if (prefer.hp < prefer.maxHp) return { unitIds: [prefer.instanceId] };
      return { hq: true };
    }
    case "hqRepair":
    case "missileBarrage":
    case "targetRegistration":
    case "visionSupport":
    case "deathFromAbove":
    case "firstAidKit":
      return {};
    case "siegeLock":
    case "digInProtocol":
    case "rallyAssault":
    case "tacticalOverdrive":
    case "vanguardFocus":
    case "stickyBomb":
    case "entrenchment":
    case "deadlyPresence":
    case "coordinate":
    case "silentDeath":
    case "targetAcquired":
      return source ? { unitIds: [source.instanceId] } : null;
    case "supply":
      return null; // Never burn Supply cards just to spend CP.
    default:
      if (source) return { unitIds: [source.instanceId] };
      if (card.targets.includes("friendly") || card.targets.includes("anyUnit")) {
        return { unitIds: [prefer.instanceId] };
      }
      return null;
  }
}

/** Only spend on specials that clearly help a fight or save a unit. */
function isHighValueSpecial(
  state: MatchState,
  card: CardInstance,
  prefer: UnitInstance,
  source: UnitInstance | null,
  allies: UnitInstance[],
): boolean {
  const player = current(state).id;
  const contested = (unit: UnitInstance) => Boolean(enemyFirstInRow(state.board, player, unit.row));
  const losing = hasLosingTrades(state, player);
  const damaged = (unit: UnitInstance) => unit.hp <= unit.maxHp - 3;

  switch (card.effectId) {
    case "supply":
      return false;
    case "fortify":
    case "concentratedFire":
    case "siegeLock":
    case "digInProtocol":
    case "rallyAssault":
    case "tacticalOverdrive":
    case "vanguardFocus":
    case "stickyBomb":
    case "entrenchment":
    case "deadlyPresence": {
      const foe = enemyFirstInRow(state.board, player, prefer.row);
      if (foe && foe.hp > 0 && weakEnemyFocusScore(foe) >= 35) return true;
      return losing && contested(prefer);
    }
    case "coordinate": {
      if (!source) return false;
      if (enemyFirstInRow(state.board, player, source.row)) return false;
      return nearestEnemyLane(state, player, source.row) !== null;
    }
    case "fieldRepair":
    case "emergencyOverhaul":
    case "supplyLogistics":
    case "emergencyMedicalKit":
    case "nanoRepair":
      // Only spend on real wounds — not every chip.
      return allies.some(damaged);
    case "firstAidKit":
      return allies.some((u) => u.class === "Armored Infantry" && damaged(u)) || allies.length >= 2;
    case "hqRepair": {
      const hq = current(state).hqHp;
      return hq <= 25;
    }
    case "tacticalStrike":
    case "missileBarrage":
    case "deathFromAbove":
    case "targetAcquired":
    case "stormCaller":
      return allies.some((u) => keywordValue(u, "missile") > 0 && contested(u));
    case "targetRegistration":
    case "artilleryCall":
      return allies.some((u) => hasKeyword(u, "artillery") && contested(u));
    case "visionSupport":
      return allies.some((u) => keywordValue(u, "supportFire") > 0);
    case "analyzeWeakness":
    case "diversionDown":
    case "diversionUp":
    case "diversionToLane":
    case "lure":
      return livingEnemies(state, player).length > 0 && (losing || contested(prefer));
    case "reorganize":
      return losing;
    case "silentDeath":
      return Boolean(source && contested(source));
    default:
      // Unknown specials: only if source is fighting a weak foe or we are losing.
      if (source) {
        const foe = enemyFirstInRow(state.board, player, source.row);
        if (foe && foe.hp > 0 && weakEnemyFocusScore(foe) >= 35) return true;
        return contested(source) && losing;
      }
      return losing && card.cost <= 1;
  }
}

function scoreMoveDest(state: MatchState, unit: UnitInstance, pos: BoardPos, escaping: boolean): number {
  const player = unit.owner;
  const currentValue = laneTradeValue(state, player, unit, unit.row, unit.col);
  const nextValue = laneTradeValue(state, player, unit, pos.row, pos.col);
  const delta = nextValue - currentValue;

  if (escaping) {
    let score = delta * 10;
    if (isSupport(player, pos.col)) score += 30;
    const enemy = enemyFirstInRow(state.board, player, pos.row);
    if (!enemy) score += 40; // flee to empty is fine when escaping
    else if (nextValue < 0) score -= 40;
    score -= Math.abs(pos.row - unit.row);
    return score;
  }

  // Only reward moves that strictly improve the current trade.
  // Equal trades (e.g. +4 → +4) or HQ-only (+1) downgrades are worthless.
  if (delta <= 0) return delta * 10 - 50;
  let score = delta * 20;
  const foe = enemyFirstInRow(state.board, player, pos.row);
  if (foe) {
    score += apVsArmorScore(armorPiercingOf(unit), defenseArmor(foe)) * 0.25;
    // Maneuver onto wounded player units to finish them.
    score += weakEnemyFocusScore(foe) * 0.5;
    if (foe.hp <= unit.atk + armorPiercingOf(unit)) score += 30;
  }
  score -= Math.abs(pos.row - unit.row);
  return score;
}

/** True when some movable ally can move to a strictly better trade than it has now. */
function shouldImproveTrade(state: MatchState): boolean {
  const player = current(state).id;
  const allDirs: Direction[] = ["up", "down", "forward", "back", "forwardUp", "forwardDown", "upBack", "downBack"];
  for (const unit of movableAllies(state, player)) {
    const currentValue = laneTradeValue(state, player, unit, unit.row, unit.col);
    for (const dest of legalDestinations(state, unit, allDirs)) {
      const next = laneTradeValue(state, player, unit, dest.row, dest.col);
      if (next <= currentValue) continue;
      const foe = enemyFirstInRow(state.board, player, dest.row);
      // Prefer improving into a real fight (esp. wounded), not lateral HQ shuffles.
      if (foe && foe.hp > 0) return true;
      if (next - currentValue >= 3) return true;
    }
  }
  return false;
}

function apSetupUnits(state: MatchState): UnitInstance[] {
  // Prefer units whose current trade is weakest / who have AP to spend on armor.
  // Never include Cover/Flank — they auto-relocate.
  const player = current(state).id;
  return movableAllies(state, player).sort((a, b) => {
    const va = laneTradeValue(state, player, a, a.row, a.col);
    const vb = laneTradeValue(state, player, b, b.row, b.col);
    if (va !== vb) return va - vb;
    return armorPiercingOf(b) - armorPiercingOf(a);
  });
}

function pickMoveTargets(
  state: MatchState,
  card: CardInstance,
  preferUnits: UnitInstance[],
  escaping: boolean,
): PlayTargets | null {
  const dirs = dirsForEffect(card.effectId);
  if (!dirs) return null;
  const needUnits = unitsNeededForMove(card.effectId);
  const needDests = minDestCountForEffect(card.effectId);
  const maxDests = destCountForEffect(card.effectId);
  const pool = preferUnits.filter((u) => !isAutoRelocator(u));
  const allies = pool.length > 0 ? pool : movableAllies(state, current(state).id);
  const rank = (unit: UnitInstance, pos: BoardPos) => scoreMoveDest(state, unit, pos, escaping);

  if (needUnits >= 2) {
    const usable = allies.filter((u) => legalDestinations(state, u, dirs).length > 0);
    if (usable.length === 0) return null;
    const a = usable[0]!;
    const aDest = legalDestinations(state, a, dirs).sort((x, y) => rank(a, y) - rank(a, x))[0];
    if (!aDest) return null;
    if (usable.length >= 2 && maxDests >= 2) {
      const b = usable[1]!;
      const bDest = legalDestinations(state, b, dirs).sort((x, y) => rank(b, y) - rank(b, x))[0];
      if (bDest) return { unitIds: [a.instanceId, b.instanceId], cells: [aDest, bDest] };
    }
    return { unitIds: [a.instanceId], cells: [aDest] };
  }

  // Prefer the unit that gains the most from its best destination.
  let best: { unit: UnitInstance; cells: BoardPos[]; score: number } | null = null;
  for (const unit of allies) {
    const dests = legalDestinations(state, unit, dirs);
    if (dests.length === 0) continue;
    const ranked = [...dests].sort((a, b) => rank(unit, b) - rank(unit, a));
    const cells = ranked.slice(0, Math.min(maxDests, ranked.length));
    if (cells.length < needDests && !["moveUnitTwice", "swiftManeuver"].includes(card.effectId)) continue;
    if (cells.length === 0) continue;
    if (card.effectId === "intelAcquired" && cells.length < 2) continue;
    const score = rank(unit, cells[0]!);
    // Skip moves that do not improve the current trade (unless escaping).
    if (!escaping && score <= 0) continue;
    if (!escaping && score < 20) continue;
    if (!best || score > best.score) best = { unit, cells: cells.slice(0, Math.max(needDests, 1)), score };
  }
  if (!best) return null;
  return { unitIds: [best.unit.instanceId], cells: best.cells };
}

function pickInitiative(state: MatchState): Action | null {
  const player = current(state);
  const card = player.hand.find((c) => isInitiativeCard(c) && affordable(c, player.commandPoints));
  if (!card) return null;
  // Prefer the move when it meaningfully improves the board, otherwise bank Supply for next Deployment.
  const allies = movableAllies(state, player.id);
  const escaping = hasLosingTrades(state, player.id);
  const prefer = escaping
    ? losingTrades(state, player.id).map((t) => t.ally).filter((u) => !isAutoRelocator(u))
    : apSetupUnits(state);
  const picked = pickMoveTargets(state, card, prefer.length ? prefer : allies, escaping);
  if (picked?.unitIds?.[0] && picked.cells?.[0]) {
    const unit = allies.find((u) => u.instanceId === picked.unitIds![0]);
    const dest = picked.cells[0]!;
    if (unit && (enemyFirstInRow(state.board, player.id, dest.row) || isSupport(player.id, unit.col))) {
      return {
        type: "playCard",
        cardId: card.instanceId,
        targets: { choice: "move", unitIds: picked.unitIds.slice(0, 1), cells: picked.cells.slice(0, 1) },
      };
    }
  }
  if (player.commandPoints <= 1) {
    return { type: "playCard", cardId: card.instanceId, targets: { choice: "supply" } };
  }
  return { type: "playCard", cardId: card.instanceId, targets: { choice: "nextSupply" } };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function pickAiAction(state: MatchState, rejected: ReadonlySet<string> = new Set()): Action | null {
  if (state.phase === "gameover" || state.phase === "engagement") return null;
  if (state.phase === "deployment") {
    for (const action of deployCandidates(state)) {
      if (!rejected.has(actionKey(action))) return action;
    }
    return { type: "endDeployment" };
  }
  if (state.phase === "maneuver") {
    for (const action of maneuverCandidates(state)) {
      if (!rejected.has(actionKey(action))) return action;
    }
    return { type: "endManeuver" };
  }
  return null;
}

function actionKey(action: Action): string {
  switch (action.type) {
    case "deploy":
      return `deploy:${action.unitDefId}:${action.row}:${(action.discardCardIds ?? []).join(",")}`;
    case "playCard":
      return `play:${action.cardId}:${JSON.stringify(action.targets)}`;
    case "discardRedraw":
      return `recycle:${action.cardId}`;
    default:
      return action.type;
  }
}

function* maneuverCandidates(state: MatchState): Generator<Action> {
  // Recycle is free (no Supply) — always do it.
  const recycle = pickDuplicateRecycle(state);
  if (recycle) yield recycle;

  // Lethal damage first — always worth the Supply.
  for (const action of allKillCards(state)) yield action;

  // At most one non-kill card per Maneuver (special / engage / move) — stop dumping the hand.
  if (!playedNonKillThisManeuver(state)) {
    for (const action of allSpecialCards(state)) yield action;
    for (const action of allEngageCards(state)) yield action;

    const losing = hasLosingTrades(state, current(state).id);
    if (losing) {
      for (const action of allMoveCards(state, true)) yield action;
    } else if (shouldImproveTrade(state)) {
      for (const action of allMoveCards(state, false)) yield action;
    }
  }

  // Initiative is free CP; allow draw/forward only when we have not already spent a non-kill.
  if (!playedNonKillThisManeuver(state)) {
    const initiative = pickInitiative(state);
    if (initiative) yield initiative;
  }

  yield { type: "endManeuver" };
}

function allKillCards(state: MatchState): Action[] {
  const player = current(state);
  const out: Action[] = [];
  const cards = [...player.hand]
    .filter((c) => affordable(c, player.commandPoints) && KILL_DAMAGE_EFFECTS.has(c.effectId))
    .sort((a, b) => a.cost - b.cost);
  for (const card of cards) {
    const enemy = killTargetForCard(state, card);
    if (!enemy) continue;
    out.push({ type: "playCard", cardId: card.instanceId, targets: targetsForKill(state, card, enemy) });
  }
  return out;
}

function allSpecialCards(state: MatchState): Action[] {
  const player = current(state);
  const allies = unitsOf(state.board, player.id).filter((u) => u.hp > 0);
  if (allies.length === 0) return [];
  const losing = losingTrades(state, player.id);
  const prefer =
    losing[0]?.ally ?? allies.find((u) => enemyFirstInRow(state.board, player.id, u.row)) ?? allies[0]!;
  const cards = [...player.hand]
    .filter(
      (c) =>
        affordable(c, player.commandPoints) &&
        c.type === "special" &&
        !isInitiativeCard(c) &&
        !KILL_DAMAGE_EFFECTS.has(c.effectId) &&
        !ENGAGE_EFFECTS.has(c.effectId) &&
        (!c.requiresSourceOnField || sourceOnBoard(state, c)),
    )
    .sort((a, b) => a.cost - b.cost);
  for (const card of cards) {
    const source = sourceOnBoard(state, card);
    if (!isHighValueSpecial(state, card, prefer, source, allies)) continue;
    const targets = targetsForSpecial(state, card, prefer, source, allies);
    if (targets === null) continue;
    // At most one non-kill special per decision pass — do not dump the hand.
    return [{ type: "playCard", cardId: card.instanceId, targets }];
  }
  return [];
}

function allEngageCards(state: MatchState): Action[] {
  const player = current(state);
  const cards = [...player.hand]
    .filter((c) => affordable(c, player.commandPoints) && ENGAGE_EFFECTS.has(c.effectId) && isProfitableEngagement(state, c))
    .sort((a, b) => a.cost - b.cost);
  for (const card of cards) {
    const pair = engagementParticipants(state, card);
    if (!pair) continue;
    if (card.effectId === "forceEngage" || card.effectId === "trap") {
      return [{ type: "playCard", cardId: card.instanceId, targets: { unitIds: [pair.enemy.instanceId] } }];
    }
    return [{ type: "playCard", cardId: card.instanceId, targets: { unitIds: [pair.ally.instanceId] } }];
  }
  return [];
}

function allMoveCards(state: MatchState, escaping: boolean): Action[] {
  const player = current(state);
  const losing = losingTrades(state, player.id);
  const prefer = escaping
    ? losing.map((t) => t.ally).filter((u) => !isAutoRelocator(u))
    : apSetupUnits(state);
  const cards = [...player.hand]
    .filter((c) => affordable(c, player.commandPoints) && isMoveCard(c) && !isInitiativeCard(c))
    .sort((a, b) => a.cost - b.cost);

  // When escaping, prefer retreat/extraction; for AP setup prefer lateral / any-direction moves.
  const retreatIds = new Set([
    "retreat",
    "maintenance",
    "tacticalFallback",
    "evacExtraction",
    "strategicShift",
    "emergencyFallback",
  ]);
  const ordered = escaping
    ? [...cards.filter((c) => retreatIds.has(c.effectId)), ...cards.filter((c) => !retreatIds.has(c.effectId))]
    : [...cards.filter((c) => !retreatIds.has(c.effectId)), ...cards.filter((c) => retreatIds.has(c.effectId))];

  const out: Action[] = [];
  for (const card of ordered) {
    if (escaping && ["tacticalFallback", "evacExtraction", "strategicShift", "emergencyFallback"].includes(card.effectId)) {
      const unit =
        prefer.find((u) => isFrontline(u.owner, u.col) && !state.board[supportCol(u.owner)][u.row]) ??
        movableAllies(state, player.id).find(
          (u) => isFrontline(u.owner, u.col) && !state.board[supportCol(u.owner)][u.row],
        );
      if (!unit) continue;
      return [{ type: "playCard", cardId: card.instanceId, targets: { unitIds: [unit.instanceId] } }];
    }
    if (!escaping && retreatIds.has(card.effectId)) continue;

    const targets = pickMoveTargets(
      state,
      card,
      prefer.length ? prefer : movableAllies(state, player.id),
      escaping,
    );
    if (!targets) continue;
    // One move card per pass — stop burning the hand on lateral shuffles.
    return [{ type: "playCard", cardId: card.instanceId, targets }];
  }
  return out;
}

export function runAiTurn(state: MatchState): MatchState {
  let currentState = state;
  const collected = [...state.fx];
  const startingPlayer = currentState.currentPlayer;
  const startingTurn = currentState.turn;
  const rejected = new Set<string>();
  let guard = 0;

  while (
    currentState.winner === null &&
    currentState.currentPlayer === startingPlayer &&
    currentState.turn === startingTurn &&
    guard < 60
  ) {
    const action = pickAiAction(currentState, rejected);
    if (!action) break;
    const result = applyAction(currentState, action);
    if (!result.ok) {
      rejected.add(actionKey(action));
      if (action.type === "endDeployment" || action.type === "endManeuver") break;
      guard += 1;
      continue;
    }
    collected.push(...result.state.fx);
    currentState = { ...result.state, fx: collected };
    guard += 1;
  }
  return currentState;
}
