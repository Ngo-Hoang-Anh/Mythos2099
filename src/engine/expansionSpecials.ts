import { allUnits, inBounds } from "./board";
import { applyUnitDamage, healUnit } from "./hp";
import { nextRng } from "./rng";
import { addStatus, hasStatusOn, suppressUnitKeywords } from "./status";
import { log } from "./state";
import { COLS, ROWS, type BoardPos, type MatchState, type PlayerId, type UnitInstance } from "./types";
import { resolveDestroyedUnits } from "./combat/cleanup";

export function adjacentCells(col: number, row: number): BoardPos[] {
  const out: BoardPos[] = [];
  for (let dc = -1; dc <= 1; dc += 1) {
    for (let dr = -1; dr <= 1; dr += 1) {
      if (dc === 0 && dr === 0) continue;
      const c = col + dc;
      const r = row + dr;
      if (!inBounds(c, r)) continue;
      out.push({ col: c, row: r });
    }
  }
  return out;
}

/** Round-robin 1-point shares; prefer higher (dmg) or lower (heal) effective HP each step. */
export function distributeEvenly(
  units: UnitInstance[],
  total: number,
  prefer: "highest" | "lowest",
): Map<string, number> {
  const amounts = new Map<string, number>();
  for (const unit of units) amounts.set(unit.instanceId, 0);
  if (units.length === 0 || total <= 0) return amounts;
  const effective = new Map(units.map((unit) => [unit.instanceId, unit.hp]));
  for (let i = 0; i < total; i += 1) {
    let pick: UnitInstance | null = null;
    for (const unit of units) {
      if (!pick) {
        pick = unit;
        continue;
      }
      const aHp = effective.get(unit.instanceId)!;
      const bHp = effective.get(pick.instanceId)!;
      if (prefer === "highest" ? aHp > bHp : aHp < bHp) {
        pick = unit;
        continue;
      }
      if (aHp !== bHp) continue;
      // Among equal HP, prefer whoever has received fewer points so far.
      const aAmt = amounts.get(unit.instanceId)!;
      const bAmt = amounts.get(pick.instanceId)!;
      if (aAmt < bAmt) pick = unit;
    }
    if (!pick) break;
    amounts.set(pick.instanceId, (amounts.get(pick.instanceId) ?? 0) + 1);
    const nextHp =
      prefer === "highest"
        ? Math.max(0, effective.get(pick.instanceId)! - 1)
        : effective.get(pick.instanceId)! + 1;
    effective.set(pick.instanceId, nextHp);
  }
  return amounts;
}

export function applyQinglongTide(state: MatchState, source: UnitInstance, owner: PlayerId): void {
  const foes = allUnits(state.board).filter((unit) => unit.owner !== owner && unit.hp > 0);
  const allies = allUnits(state.board).filter((unit) => unit.owner === owner && unit.hp > 0);
  const dmgMap = distributeEvenly(foes, 6, "highest");
  const healMap = distributeEvenly(allies, 4, "lowest");
  for (const foe of foes) {
    const amount = dmgMap.get(foe.instanceId) ?? 0;
    if (amount <= 0) continue;
    applyUnitDamage(state, foe, amount, source.name, { via: "Azure Tide", skipSmoke: true });
  }
  const healed: string[] = [];
  for (const ally of allies) {
    const amount = healMap.get(ally.instanceId) ?? 0;
    if (amount <= 0) continue;
    const gained = healUnit(ally, amount);
    if (gained > 0) healed.push(`${ally.name} +${gained}`);
  }
  resolveDestroyedUnits(state);
  log(
    state,
    healed.length
      ? `Azure Tide: 6 dmg split to enemies; healed ${healed.join(", ")}`
      : "Azure Tide: 6 dmg split to enemies",
  );
}

/** Baihu gun splash to every adjacent enemy around the primary target. */
export function applyOmniAoeSplash(
  state: MatchState,
  shooter: UnitInstance,
  primary: UnitInstance,
  damage: number,
): void {
  if (damage <= 0) return;
  if (!hasStatusOn(state, shooter.instanceId, "omniAoe")) return;
  for (const cell of adjacentCells(primary.col, primary.row)) {
    const unit = state.board[cell.col][cell.row];
    if (!unit || unit.hp <= 0) continue;
    if (unit.owner === shooter.owner) continue;
    if (unit.instanceId === primary.instanceId) continue;
    applyUnitDamage(state, unit, damage, `${shooter.name} Omni AoE`, {
      via: "Omni AoE",
      skipSmoke: true,
    });
  }
}

export function applyPandoraBox(state: MatchState, source: UnitInstance, owner: PlayerId): void {
  const foes = allUnits(state.board).filter((unit) => unit.owner !== owner && unit.hp > 0);
  const notes: string[] = [];
  for (const foe of foes) {
    const roll = nextRng(state.rngState);
    state.rngState = roll.state;
    const pick = Math.floor(roll.value * 3);
    if (pick === 0) {
      addStatus(state, {
        kind: "modAtk",
        magnitude: -2,
        sourceId: source.instanceId,
        owner,
        targetId: foe.instanceId,
        duration: "endOfNextTurn",
      });
      notes.push(`${foe.name} −2 ATK`);
    } else if (pick === 1) {
      addStatus(state, {
        kind: "modArmor",
        magnitude: -2,
        sourceId: source.instanceId,
        owner,
        targetId: foe.instanceId,
        duration: "endOfNextTurn",
      });
      notes.push(`${foe.name} −2 Armor`);
    } else {
      const stripped = suppressUnitKeywords(state, foe, {
        sourceId: source.instanceId,
        owner,
        duration: "endOfNextTurn",
      });
      notes.push(stripped ? `${foe.name} keywords removed` : `${foe.name} (no keywords)`);
    }
  }
  log(state, notes.length ? `Pandora's Box: ${notes.join("; ")}` : "Pandora's Box: no enemies");
}

export function isImmobilized(state: MatchState, unit: UnitInstance): boolean {
  return (
    hasStatusOn(state, unit.instanceId, "stunned") || hasStatusOn(state, unit.instanceId, "rooted")
  );
}

export function isStunned(state: MatchState, unit: UnitInstance): boolean {
  return hasStatusOn(state, unit.instanceId, "stunned");
}

export function triggerBoardTraps(state: MatchState, unit: UnitInstance): void {
  const traps = state.statuses.filter(
    (status) =>
      status.kind === "boardTrap" && status.col === unit.col && status.lane === unit.row,
  );
  if (traps.length === 0) return;
  for (const trap of traps) {
    state.statuses = state.statuses.filter((status) => status.id !== trap.id);
  }
  suppressUnitKeywords(state, unit, {
    sourceId: traps[0]!.sourceId,
    owner: traps[0]!.owner,
    duration: "endOfNextTurn",
  });
  if (!hasStatusOn(state, unit.instanceId, "rooted")) {
    addStatus(state, {
      kind: "rooted",
      sourceId: traps[0]!.sourceId,
      owner: traps[0]!.owner,
      targetId: unit.instanceId,
      duration: "endOfNextTurn",
    });
  }
  log(state, `${unit.name} triggers a Moon Sigil: keywords stripped, cannot move for 2 turns`);
}

/** Fire eruption omens placed by the defender at the start of this engagement. */
export function resolveEruptionOmens(state: MatchState, attacker: PlayerId): void {
  const omens = state.statuses.filter(
    (status) => status.kind === "eruptionOmen" && status.owner !== attacker,
  );
  if (omens.length === 0) return;
  for (const omen of omens) {
    if (omen.col == null || omen.lane == null) continue;
    const center = state.board[omen.col][omen.lane];
    const centerHit = Boolean(center && center.hp > 0 && center.owner === attacker);
    const adjDmg = centerHit ? 2 : 1;
    if (center && center.hp > 0 && center.owner === attacker) {
      applyUnitDamage(state, center, 4, "Eruption Omen", { via: "Eruption", skipSmoke: true });
    }
    for (const cell of adjacentCells(omen.col, omen.lane)) {
      const unit = state.board[cell.col][cell.row];
      if (!unit || unit.hp <= 0 || unit.owner !== attacker) continue;
      applyUnitDamage(state, unit, adjDmg, "Eruption Omen", { via: "Eruption", skipSmoke: true });
    }
    state.statuses = state.statuses.filter((status) => status.id !== omen.id);
    log(
      state,
      centerHit
        ? `Eruption Omen detonates at (${omen.col},${omen.lane}): 4 center / 2 adjacent`
        : `Eruption Omen detonates at (${omen.col},${omen.lane}): empty center / ${adjDmg} adjacent`,
    );
  }
  resolveDestroyedUnits(state);
}

export function emptyCellsOnBoard(state: MatchState): BoardPos[] {
  const out: BoardPos[] = [];
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      if (!state.board[col][row]) out.push({ col, row });
    }
  }
  return out;
}
