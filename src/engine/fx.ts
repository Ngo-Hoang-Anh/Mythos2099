import { moveUnitOnBoard } from "./board";
import { weaponPower } from "./combat/helpers";
import { HQ_MAX_HP, playerHqMax, type BoardPos, type FxEvent, type FxTarget, type MatchState, type UnitInstance } from "./types";

export function isHqTarget(target: FxTarget): target is { hq: 0 | 1 } {
  return "hq" in target;
}

export function relocateUnit(state: MatchState, unit: UnitInstance, col: number, row: number): void {
  const from: BoardPos = { col: unit.col, row: unit.row };
  if (from.col === col && from.row === row) return;
  moveUnitOnBoard(state.board, unit, col, row);
  state.fx.push({
    kind: "move",
    unitId: unit.instanceId,
    name: unit.name,
    unitClass: unit.class,
    owner: unit.owner,
    from,
    to: { col, row },
  });
}

export function pushAttack(
  state: MatchState,
  attacker: UnitInstance,
  to: FxTarget,
  extras?: { damage?: number; power?: number; kamikaze?: boolean; missile?: boolean },
): void {
  let targetMaxHp = "hq" in to ? playerHqMax(state.players[to.hq]) : HQ_MAX_HP;
  if (!("hq" in to)) {
    const unit = state.board[to.col][to.row];
    if (unit) targetMaxHp = unit.maxHp;
  }
  state.fx.push({
    kind: "attack",
    unitId: attacker.instanceId,
    name: attacker.name,
    owner: attacker.owner,
    from: { col: attacker.col, row: attacker.row },
    to,
    damage: extras?.damage ?? 0,
    power: extras?.power ?? weaponPower(attacker),
    targetMaxHp,
    kamikaze: extras?.kamikaze,
    missile: extras?.missile,
    defId: attacker.defId,
  });
}

export function cloneFx(events: FxEvent[]): FxEvent[] {
  return events.map((event) =>
    event.kind === "move"
      ? { ...event, from: { ...event.from }, to: { ...event.to } }
      : {
          ...event,
          from: { ...event.from },
          to: "hq" in event.to ? { ...event.to } : { ...event.to },
        },
  );
}
