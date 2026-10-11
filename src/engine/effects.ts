import {
  backCol,
  enemyFirstInRow,
  findUnit,
  forwardCol,
  isFrontline,
  isSupport,
  oppositeUnit,
  unitsOf,
} from "./board";
import { applyUnitDamage, healHq, healUnit, resolveAttack } from "./attack";
import { resolveMissileShot } from "./combat/missile";
import { computeStrikeDamage, defenseArmor } from "./combat";
import { beginExtraEngagement } from "./combat/engagement";
import { canVolley, nearestEnemyLane, sideUnitsInLane } from "./combat/helpers";
import { pushAttack, relocateUnit } from "./fx";
import { armorPiercingOf, hasKeyword, keywordValue } from "./keywords";
import { ROWS } from "./types";
import { addStatus, isUntargetableBy, suppressUnitKeywords } from "./status";
import {
  destError,
  destOfDir,
  dirsForEffect,
  legalDestinations,
  noDestError,
  samePos,
} from "./move";
import type { BoardPos, CardInstance, Direction, MatchState, PlayTargets, PlayerId, UnitInstance } from "./types";
import { current, log } from "./state";

function requireUnit(state: MatchState, id: string | undefined): UnitInstance | string {
  if (!id) return "Missing unit target";
  const unit = findUnit(state.board, id);
  if (!unit) return "Unit not found";
  return unit;
}

function requireFriendly(state: MatchState, id: string | undefined, player: PlayerId): UnitInstance | string {
  const unit = requireUnit(state, id);
  if (typeof unit === "string") return unit;
  if (unit.owner !== player) return "Must target an allied unit";
  return unit;
}

function requireEnemy(state: MatchState, id: string | undefined, player: PlayerId): UnitInstance | string {
  const unit = requireUnit(state, id);
  if (typeof unit === "string") return unit;
  if (unit.owner === player) return "Must target an enemy unit";
  if (isUntargetableBy(state, unit, player)) return `${unit.name} cannot be targeted`;
  return unit;
}

export function stepUnit(
  state: MatchState,
  unit: UnitInstance,
  dir: Direction,
): string | null {
  const dest = destOfDir(unit.owner, unit.col, unit.row, dir);
  if (typeof dest === "string") return destError(unit, dest);
  if (state.board[dest.col][dest.row]) return "Destination is occupied";
  relocateUnit(state, unit, dest.col, dest.row);
  return null;
}

function applyMoveToCell(
  state: MatchState,
  unit: UnitInstance,
  cell: BoardPos,
  dirs: Direction[],
  opts?: { from?: BoardPos; extraEmpty?: BoardPos[]; extraOccupied?: BoardPos[] },
): string | null {
  const legal = legalDestinations(state, unit, dirs, opts);
  if (!legal.some((pos) => samePos(pos, cell))) return "That cell is not a legal destination";
  relocateUnit(state, unit, cell.col, cell.row);
  return null;
}

function applyChosenMove(
  state: MatchState,
  unit: UnitInstance,
  targets: PlayTargets,
  dirs: Direction[],
  index = 0,
): string | null {
  const cell = targets.cells?.[index];
  if (cell) return applyMoveToCell(state, unit, cell, dirs);
  const dir = targets.directions?.[index];
  if (dir) {
    if (!dirs.includes(dir)) return "Illegal direction";
    return stepUnit(state, unit, dir);
  }
  if (legalDestinations(state, unit, dirs).length === 0) return noDestError(unit, dirs);
  return "Choose a destination on the board";
}

function sourceUnit(state: MatchState, card: CardInstance): UnitInstance | null {
  return unitsOf(state.board, current(state).id).find((u) => u.defId === card.ownerUnitId) ?? null;
}

function selfFromTargets(state: MatchState, card: CardInstance, targets: PlayTargets): UnitInstance | string {
  const source = sourceUnit(state, card);
  if (!source) return "Source unit is not on the board";
  if (targets.unitIds?.[0] && targets.unitIds[0] !== source.instanceId) {
    const chosen = requireFriendly(state, targets.unitIds[0], current(state).id);
    if (typeof chosen === "string") return chosen;
    if (chosen.defId !== card.ownerUnitId) return `This card must target ${source.name}`;
    return chosen;
  }
  return source;
}

function retreatToSupport(state: MatchState, unit: UnitInstance): string | null {
  if (!isFrontline(unit.owner, unit.col)) return `${unit.name} is not on the Frontline`;
  const dest = backCol(unit.owner, unit.col);
  if (dest === null) return "Cannot retreat";
  if (state.board[dest][unit.row]) return "Support cell is occupied";
  relocateUnit(state, unit, dest, unit.row);
  return null;
}

function returnToReserve(state: MatchState, unit: UnitInstance): void {
  state.board[unit.col][unit.row] = null;
  state.players[unit.owner].undeployed.push(unit.defId);
  log(state, `${unit.name} returns to reserve`);
}

function emptyOwnCellInRow(state: MatchState, owner: PlayerId, preferredCol: number, row: number): number | null {
  if (!state.board[preferredCol][row]) return preferredCol;
  const other = backCol(owner, preferredCol) ?? forwardCol(owner, preferredCol);
  if (other !== null && !state.board[other][row]) return other;
  return null;
}

function divertEnemyToRow(state: MatchState, enemy: UnitInstance, destRow: number): string | null {
  if (destRow < 0 || destRow >= ROWS) return "That move is off the board";
  const destCol = emptyOwnCellInRow(state, enemy.owner, enemy.col, destRow);
  if (destCol === null) return "The destination lane is occupied";
  relocateUnit(state, enemy, destCol, destRow);
  return null;
}

function shiftEnemy(state: MatchState, enemy: UnitInstance, dRow: number): string | null {
  const destRow = enemy.row + dRow;
  if (destRow < 0 || destRow >= ROWS) return "That move is off the board";
  if (state.board[enemy.col][destRow]) return "Destination is occupied";
  relocateUnit(state, enemy, enemy.col, destRow);
  log(state, `${enemy.name} is diverted to lane ${destRow + 1}`);
  return null;
}

function allyOrHqHeal(state: MatchState, targets: PlayTargets, allyHeal: number, hqHeal: number): string | null {
  const player = current(state);
  if (targets.hq) {
    const gained = healHq(state, player.id, hqHeal);
    log(state, `HQ repaired for ${gained}`);
    return null;
  }
  const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
  if (typeof unit === "string") return unit;
  const gained = healUnit(unit, allyHeal);
  log(state, `${unit.name} repaired for ${gained}`);
  return null;
}

export function playEffect(state: MatchState, card: CardInstance, targets: PlayTargets): string | null {
  const player = current(state);
  switch (card.effectId) {
    case "forward":
    case "up":
    case "down":
    case "retreat":
    case "upOrDown":
    case "moveAnyDirection": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      const dirs = dirsForEffect(card.effectId);
      if (!dirs) return "This card has no movement";
      return applyChosenMove(state, unit, targets, dirs);
    }
    case "supply": {
      player.commandPoints += 2;
      log(state, `${card.name}: +2 Supply`);
      return null;
    }
    case "fortify": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      addStatus(state, {
        kind: "modArmor",
        magnitude: 3,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
      });
      log(state, `${unit.name} gets +3 Armor`);
      return null;
    }
    case "concentratedFire": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      addStatus(state, {
        kind: "modAtk",
        magnitude: 3,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
      });
      log(state, `${unit.name} gets +3 ATK`);
      return null;
    }
    case "reorganize": {
      const a = requireFriendly(state, targets.unitIds?.[0], player.id);
      const b = requireFriendly(state, targets.unitIds?.[1], player.id);
      if (typeof a === "string") return a;
      if (typeof b === "string") return b;
      if (a.instanceId === b.instanceId) return "Choose two different units";
      const ac = a.col;
      const ar = a.row;
      const bc = b.col;
      const br = b.row;
      state.board[ac][ar] = null;
      state.board[bc][br] = null;
      a.col = bc;
      a.row = br;
      b.col = ac;
      b.row = ar;
      state.board[a.col][a.row] = a;
      state.board[b.col][b.row] = b;
      state.fx.push(
        {
          kind: "move",
          unitId: a.instanceId,
          name: a.name,
          unitClass: a.class,
          owner: a.owner,
          from: { col: ac, row: ar },
          to: { col: bc, row: br },
        },
        {
          kind: "move",
          unitId: b.instanceId,
          name: b.name,
          unitClass: b.class,
          owner: b.owner,
          from: { col: bc, row: br },
          to: { col: ac, row: ar },
        },
      );
      log(state, `Swapped ${a.name} and ${b.name}`);
      return null;
    }
    case "lure": {
      const ally = requireFriendly(state, targets.unitIds?.[0], player.id);
      const enemy = requireEnemy(state, targets.unitIds?.[1], player.id);
      if (typeof ally === "string") return ally;
      if (typeof enemy === "string") return enemy;
      if (Math.abs(ally.row - enemy.row) !== 1) return "Enemy must be in an adjacent lane";
      const lureErr = divertEnemyToRow(state, enemy, ally.row);
      if (lureErr) return lureErr;
      log(state, `${ally.name} lures ${enemy.name} into lane ${ally.row + 1}`);
      return null;
    }
    case "forceEngage": {
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      addStatus(state, {
        kind: "modAtk",
        magnitude: -1,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: enemy.instanceId,
        duration: "endOfTurn",
      });
      // Prefer a volley-capable ally for the counter; always include the lane blocker so the enemy cannot shoot HQ past them.
      const defender = oppositeUnit(state.board, enemy.owner, enemy.row);
      const volleyAlly =
        sideUnitsInLane(state, player.id, enemy.row).find((u) => canVolley(u) && u.hp > 0) ?? null;
      log(state, `${card.name} forces ${enemy.name} to engage (−1 ATK this turn)`);
      beginExtraEngagement(state, [defender, volleyAlly, enemy], { attacker: enemy.owner });
      return null;
    }
    case "quickEngage": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      if (!isFrontline(unit.owner, unit.col)) return "Target must be on the Frontline";
      log(state, `${unit.name} triggers a Quick Engagement`);
      beginExtraEngagement(state, [unit, oppositeUnit(state.board, unit.owner, unit.row)]);
      return null;
    }
    case "artilleryCall": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      if (!hasKeyword(unit, "artillery")) return "Target must have Artillery";
      return resolveAttack(state, unit.instanceId);
    }
    case "missileBarrage": {
      addStatus(state, {
        kind: "missileSplash",
        magnitude: 1,
        sourceId: card.ownerUnitId,
        owner: player.id,
        duration: "untilConsumed",
      });
      log(state, "Missile Barrage: next missile splashes 1 to surrounding enemies");
      return null;
    }
    case "targetRegistration": {
      addStatus(state, {
        kind: "artilleryRepeat",
        magnitude: 2,
        sourceId: card.ownerUnitId,
        owner: player.id,
        duration: "endOfTurn",
      });
      const stacks = state.statuses.filter(
        (s) => s.kind === "artilleryRepeat" && s.owner === player.id,
      ).length;
      const total = stacks * 2;
      log(
        state,
        `Target Registration: artillery +${total} from the 2nd hit on the same target${stacks > 1 ? ` (${stacks} stacks)` : ""}`,
      );
      return null;
    }
    case "extraCombat": {
      const unit = targets.unitIds?.[0]
        ? requireFriendly(state, targets.unitIds[0], player.id)
        : selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      return resolveAttack(state, unit.instanceId);
    }
    case "quickMobilization": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      return resolveAttack(state, unit.instanceId);
    }
    case "thunderStrike": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      addStatus(state, {
        kind: "missileIgnoreArmor",
        sourceId: unit.instanceId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
      });
      log(state, `${unit.name}'s Missile ignores armor this turn`);
      return resolveAttack(state, unit.instanceId);
    }
    case "ambush": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      if (!isFrontline(unit.owner, unit.col)) return `${unit.name} must be on the Frontline`;
      addStatus(state, { kind: "modArmor", magnitude: 2, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfTurn" });
      addStatus(state, { kind: "modAtk", magnitude: 2, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfTurn" });
      log(state, `${unit.name} Ambush: +2 Armor, +2 ATK this turn`);
      beginExtraEngagement(state, [unit, oppositeUnit(state.board, unit.owner, unit.row)]);
      return null;
    }
    case "trap": {
      const source = sourceUnit(state, card);
      if (!source) return "Source unit is not on the board";
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      if (enemy.row !== source.row) return "Enemy must be in this unit's lane";
      addStatus(state, {
        kind: "atkUnmodifiable",
        sourceId: source.instanceId,
        owner: player.id,
        targetId: enemy.instanceId,
        duration: "thisCombat",
      });
      log(state, `Trap: ${enemy.name}'s ATK cannot be modified this combat`);
      // Frontline blocker first so the enemy hits them (and they can Retaliate) even if the Trap source is on Support.
      const defender = oppositeUnit(state.board, enemy.owner, enemy.row);
      beginExtraEngagement(state, [defender, source, enemy], { attacker: enemy.owner });
      return null;
    }
    case "tacticalStrike": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      if (keywordValue(unit, "missile") <= 0) return "Target must have Missile";
      addStatus(state, {
        kind: "modMissile",
        magnitude: 4,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
      });
      log(state, `${unit.name} gets Missile +4 this turn`);
      return null;
    }
    case "visionSupport": {
      addStatus(state, {
        kind: "supportFireGrantsAp",
        magnitude: 2,
        sourceId: card.ownerUnitId,
        owner: player.id,
        duration: "endOfTurn",
      });
      log(state, "Vision Support: allies that receive Support Fire get +2 AP this turn");
      return null;
    }
    case "stormCaller": {
      const source = sourceUnit(state, card);
      if (!source) return "Source unit is not on the board";
      if (keywordValue(source, "missile") <= 0) return "Manticore must have Missile";
      const other = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof other === "string") return other;
      if (other.instanceId === source.instanceId) return "Choose another unit with Missile";
      if (keywordValue(other, "missile") <= 0) return "Target must have Missile";
      resolveMissileShot(state, source);
      if (other.hp > 0) resolveMissileShot(state, other);
      return null;
    }
    case "diversionToLane": {
      const source = sourceUnit(state, card);
      if (!source) return "Source unit is not on the board";
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      if (enemy.row === source.row) return "Enemy is already in that lane";
      const divertErr = divertEnemyToRow(state, enemy, source.row);
      if (divertErr) return divertErr;
      suppressUnitKeywords(state, enemy, {
        sourceId: source.instanceId,
        owner: player.id,
        duration: "endOfNextTurn",
      });
      log(state, `${source.name} diverts ${enemy.name} into lane ${source.row + 1} and strips its keywords`);
      return null;
    }
    case "diversionDown": {
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      const shiftErr = shiftEnemy(state, enemy, 1);
      if (shiftErr) return shiftErr;
      addStatus(state, {
        kind: "modAtk",
        magnitude: -1,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: enemy.instanceId,
        duration: "endOfNextTurn",
      });
      log(state, `${enemy.name} gets -1 ATK for 2 turns`);
      return null;
    }
    case "diversionUp": {
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      const shiftErr = shiftEnemy(state, enemy, -1);
      if (shiftErr) return shiftErr;
      addStatus(state, {
        kind: "modArmor",
        magnitude: -1,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: enemy.instanceId,
        duration: "endOfNextTurn",
      });
      log(state, `${enemy.name} gets -1 ARM for 2 turns`);
      return null;
    }
    case "coordinate": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      const sameLane = enemyFirstInRow(state.board, unit.owner, unit.row);
      if (sameLane && sameLane.hp > 0) return "Coordinate requires an empty lane";
      const lane = nearestEnemyLane(state, unit.owner, unit.row);
      if (lane === null) return "No enemy lane to Coordinate against";
      const target = enemyFirstInRow(state.board, unit.owner, lane);
      if (!target || target.hp <= 0) return "No enemy lane to Coordinate against";
      addStatus(state, {
        kind: "modAtk",
        magnitude: 1,
        sourceId: unit.instanceId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
      });
      addStatus(state, {
        kind: "modAp",
        magnitude: 1,
        sourceId: unit.instanceId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
      });
      log(state, `${unit.name} Coordinate: +1 ATK, +1 AP; extra attack into lane ${target.row + 1}`);
      return resolveAttack(state, unit.instanceId, { targetId: target.instanceId });
    }
    case "analyzeWeakness": {
      const unit = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      addStatus(state, {
        kind: "modArmor",
        magnitude: -2,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
      });
      log(state, `${unit.name} has -2 Armor this turn`);
      return null;
    }
    case "stickyBomb": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      addStatus(state, { kind: "modAtk", magnitude: 6, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfTurn" });
      addStatus(state, { kind: "afterAttackSelfDamage", magnitude: 4, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfTurn" });
      log(state, `${unit.name} Sticky Bomb: +6 ATK this turn, then 4 damage after attacking`);
      return null;
    }
    case "entrenchment": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      addStatus(state, { kind: "modArmor", magnitude: 3, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfNextTurn" });
      addStatus(state, { kind: "modAp", magnitude: 2, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfNextTurn" });
      log(state, `${unit.name} Entrenchment: +3 Armor, +2 AP until the end of next turn`);
      return null;
    }
    case "firstAidKit": {
      const source = sourceUnit(state, card);
      if (!source) return "Source unit is not on the board";
      const healed: string[] = [];
      for (const unit of unitsOf(state.board, player.id)) {
        if (unit.class !== "Armored Infantry") continue;
        const gained = healUnit(unit, 2);
        if (gained > 0) healed.push(`${unit.name} +${gained}`);
      }
      for (const unit of unitsOf(state.board, player.id)) {
        if (unit.hp <= 0) continue;
        addStatus(state, {
          kind: "regen",
          magnitude: 1,
          sourceId: source.instanceId,
          owner: player.id,
          targetId: unit.instanceId,
          duration: "endOfTurn",
          remainingPasses: 2,
        });
      }
      log(
        state,
        healed.length
          ? `First-aid Kit: ${healed.join(", ")}; all allies Repair 1 for 2 turns`
          : "First-aid Kit: all allies Repair 1 for 2 turns",
      );
      return null;
    }
    case "deadlyPresence": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      addStatus(state, { kind: "modAp", magnitude: 4, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfTurn" });
      addStatus(state, { kind: "modAtk", magnitude: 2, sourceId: unit.instanceId, owner: player.id, targetId: unit.instanceId, duration: "endOfTurn" });
      log(state, `${unit.name} Deadly Presence: +4 AP, +2 ATK this turn`);
      return null;
    }
    case "targetAcquired": {
      const unit = sourceUnit(state, card);
      if (!unit) return "Source unit is not on the board";
      addStatus(state, {
        kind: "missileLaneMark",
        sourceId: unit.instanceId,
        owner: player.id,
        lane: unit.row,
        duration: "endOfTurn",
      });
      log(state, `Target Acquired: allied missiles prioritize lane ${unit.row + 1}; enemies there take +1 Missile damage`);
      return null;
    }
    case "hqRepair": {
      const gained = healHq(state, player.id, 7);
      log(state, `HQ repaired for ${gained}`);
      return null;
    }
    case "deathFromAbove": {
      addStatus(state, {
        kind: "modMissile",
        magnitude: 1,
        sourceId: card.ownerUnitId,
        owner: player.id,
        duration: "endOfTurn",
      });
      log(state, "Death from Above: allied Missile +1 this turn");
      return null;
    }
    case "silentDeath": {
      const unit = sourceUnit(state, card);
      if (!unit) return "Source unit is not on the board";
      addStatus(state, {
        kind: "untargetable",
        sourceId: unit.instanceId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfNextTurn",
      });
      log(state, `${unit.name} cannot be targeted by missiles or effects next turn`);
      return null;
    }
    case "intelAcquired":
    case "moveUnitTwice": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      const dirs = dirsForEffect(card.effectId);
      if (!dirs) return "This card has no movement";
      let err: string | null = null;
      if (targets.cells && targets.cells.length >= 1) {
        if (card.effectId === "intelAcquired" && targets.cells.length < 2) {
          return "Choose two steps";
        }
        err = applyMoveToCell(state, unit, targets.cells[0], dirs);
        if (!err && targets.cells[1]) err = applyMoveToCell(state, unit, targets.cells[1], dirs);
      } else {
        const d1 = targets.directions?.[0];
        const d2 = targets.directions?.[1];
        if (!d1) return "Choose a step";
        if (card.effectId === "intelAcquired" && !d2) return "Choose two steps";
        err = stepUnit(state, unit, d1);
        if (!err && d2) err = stepUnit(state, unit, d2);
      }
      if (err) return err;
      if (card.effectId === "intelAcquired") {
        player.commandPoints += 2;
        log(state, `${card.name}: +2 Supply`);
      }
      return null;
    }
    case "swiftManeuver":
    case "moveTwoUnits": {
      const a = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof a === "string") return a;
      const dirs = dirsForEffect(card.effectId);
      if (!dirs) return "This card has no movement";
      if (!targets.cells?.length) {
        const d1 = targets.directions?.[0];
        if (!d1) return "Choose a direction for each unit";
        if (!dirs.includes(d1)) return "Illegal direction";
        const first = stepUnit(state, a, d1);
        if (first) return first;
        if (card.effectId === "moveTwoUnits" || (targets.unitIds?.length ?? 0) >= 2) {
          const b = requireFriendly(state, targets.unitIds?.[1], player.id);
          if (typeof b === "string") return b;
          if (a.instanceId === b.instanceId) return "Choose two different units";
          const d2 = targets.directions?.[1];
          if (!d2) return "Choose a direction for each unit";
          if (!dirs.includes(d2)) return "Illegal direction";
          return stepUnit(state, b, d2);
        }
        return null;
      }
      const first = applyMoveToCell(state, a, targets.cells[0], dirs);
      if (first) return first;
      if (targets.cells.length < 2) return null;
      const b = requireFriendly(state, targets.unitIds?.[1], player.id);
      if (typeof b === "string") return b;
      if (a.instanceId === b.instanceId) return "Choose two different units";
      return applyMoveToCell(state, b, targets.cells[1], dirs);
    }
    case "maintenance": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      const dirs = dirsForEffect("maintenance");
      if (!dirs) return "This card has no movement";
      const err = applyChosenMove(state, unit, targets, dirs);
      if (err) return err;
      unit.rested = true;
      addStatus(state, {
        kind: "regen",
        magnitude: 1,
        sourceId: card.ownerUnitId,
        owner: player.id,
        targetId: unit.instanceId,
        duration: "endOfTurn",
        remainingPasses: 4,
      });
      log(state, `${unit.name} Maintenance: retreats, rests, and repairs 1 HP for 4 turns`);
      return null;
    }
    case "sniping": {
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      const source = sourceUnit(state, card);
      if (source) {
        pushAttack(state, source, { col: enemy.col, row: enemy.row }, { damage: 2, power: 2 });
      }
      applyUnitDamage(state, enemy, 2, card.name);
      log(state, `${card.name}: ${enemy.name} takes 2 (ignore armor)`);
      return null;
    }
    case "siegeLock": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      unit.tempArmor += 2;
      unit.tempRetaliate += 2;
      log(state, `${unit.name} Siege Lock: +2 Armor, +2 Retaliate`);
      return null;
    }
    case "heavyOverdrive":
    case "strafingRun":
    case "plasmaCharge": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      unit.tempAtk += 2;
      unit.tempAp += 3;
      log(state, `${unit.name} overdrives (+2 ATK, +3 AP) and attacks`);
      return resolveAttack(state, unit.instanceId);
    }
    case "emergencyOverhaul": {
      const unit = sourceUnit(state, card);
      if (!unit) return "Source unit is not on the board";
      if (targets.hq) {
        const gained = healHq(state, player.id, 7);
        log(state, `Emergency Overhaul repairs HQ for ${gained}`);
        return null;
      }
      const gained = healUnit(unit, 4);
      log(state, `${unit.name} repaired for ${gained}`);
      return null;
    }
    case "tacticalFallback": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      const err = retreatToSupport(state, unit);
      if (err) return err;
      player.commandPoints += 1;
      log(state, `${unit.name} falls back and grants +1 CP`);
      return null;
    }
    case "hitAndRun": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      const err = resolveAttack(state, unit.instanceId);
      if (err) return err;
      const still = findUnit(state.board, unit.instanceId);
      if (still && still.hp > 0) returnToReserve(state, still);
      return null;
    }
    case "fieldRepair": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      const gained = healUnit(unit, 4);
      log(state, `${unit.name} repaired for ${gained}`);
      return null;
    }
    case "supplyLogistics":
    case "emergencyMedicalKit":
    case "nanoRepair":
      return allyOrHqHeal(state, targets, 4, 7);
    case "precisionAirStrike": {
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      if (!isSupport(enemy.owner, enemy.col)) return "Target must be on the enemy Support Line";
      const source = sourceUnit(state, card);
      const dmg = computeStrikeDamage({ atk: 5, armor: defenseArmor(enemy), armorPiercing: 0 });
      if (source) pushAttack(state, source, { col: enemy.col, row: enemy.row }, { damage: dmg, power: 5 });
      applyUnitDamage(state, enemy, dmg, card.name);
      return null;
    }
    case "rallyAssault": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      unit.tempAtk += 2;
      unit.tempAp += 2;
      log(state, `${unit.name} Rally Assault: +2 ATK, +2 AP`);
      return null;
    }
    case "evacExtraction":
    case "strategicShift":
    case "emergencyFallback": {
      const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
      if (typeof unit === "string") return unit;
      const err = retreatToSupport(state, unit);
      if (err) return err;
      player.commandPoints += 1;
      log(state, `${unit.name} is extracted, +1 CP`);
      return null;
    }
    case "precisionStrike": {
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      const source = sourceUnit(state, card);
      if (!source) return "Source unit is not on the board";
      return resolveAttack(state, source.instanceId, { targetId: enemy.instanceId });
    }
    case "sustainedSalvo": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      unit.tempAtk += 2;
      log(state, `${unit.name} Sustained Salvo: +2 ATK and extra attack`);
      return resolveAttack(state, unit.instanceId);
    }
    case "tacticalOverdrive": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      unit.tempAtk += 3;
      log(state, `${unit.name} Tactical Overdrive: +3 ATK`);
      return null;
    }
    case "bunkerBreaker": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      const enemy = oppositeUnit(state.board, unit.owner, unit.row);
      if (!enemy) return "No opposite unit";
      const dmg = computeStrikeDamage({
        atk: 5,
        armor: defenseArmor(enemy),
        armorPiercing: armorPiercingOf(unit),
      });
      pushAttack(state, unit, { col: enemy.col, row: enemy.row }, { damage: dmg, power: 5 + armorPiercingOf(unit) });
      applyUnitDamage(state, enemy, dmg, `${unit.name} Bunker Breaker`);
      return null;
    }
    case "digInProtocol": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      unit.tempArmor += 3;
      unit.tempRetaliate += 2;
      log(state, `${unit.name} Dig-In: +3 Armor, +2 Retaliate`);
      return null;
    }
    case "driveByStrafe": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      const enemy = oppositeUnit(state.board, unit.owner, unit.row);
      if (!enemy) return "No same-lane enemy";
      const dmg = computeStrikeDamage({
        atk: 5,
        armor: defenseArmor(enemy),
        armorPiercing: armorPiercingOf(unit),
      });
      pushAttack(state, unit, { col: enemy.col, row: enemy.row }, { damage: dmg, power: 5 + armorPiercingOf(unit) });
      applyUnitDamage(state, enemy, dmg, `${unit.name} Drive-by Strafe`);
      return null;
    }
    case "vanguardFocus": {
      const unit = selfFromTargets(state, card, targets);
      if (typeof unit === "string") return unit;
      unit.tempAtk += 2;
      unit.tempAp += 3;
      log(state, `${unit.name} Vanguard Focus: +2 ATK, +3 AP`);
      return null;
    }
    case "kamikazeBlast": {
      const unit = sourceUnit(state, card);
      if (!unit) return "Source unit is not on the board";
      const enemy = requireEnemy(state, targets.unitIds?.[0], player.id);
      if (typeof enemy === "string") return enemy;
      pushAttack(state, unit, { col: enemy.col, row: enemy.row }, { damage: 8, power: 8, kamikaze: true });
      applyUnitDamage(state, enemy, 8, `${unit.name} Kamikaze`);
      applyUnitDamage(state, unit, unit.hp, `${unit.name} self-destruct`);
      return null;
    }
    case "initiative": {
      if (targets.choice === "forward" || targets.choice === "move") {
        const unit = requireFriendly(state, targets.unitIds?.[0], player.id);
        if (typeof unit === "string") return unit;
        const dirs = dirsForEffect("initiative");
        if (!dirs) return "This card has no movement";
        return applyChosenMove(state, unit, targets, dirs);
      }
      if (targets.choice === "supply") {
        player.commandPoints += 1;
        log(state, `${card.name}: +1 Supply`);
        return null;
      }
      if (targets.choice === "nextSupply") {
        player.nextTurnSupplyBonus += 2;
        log(state, `${card.name}: +2 Supply next Deployment`);
        return null;
      }
      return "Choose one: move 1 allied unit, gain 1 Supply, or gain 2 Supply at the start of your next Deployment";
    }
    default:
      return `Unhandled effect ${card.effectId}`;
  }
}
