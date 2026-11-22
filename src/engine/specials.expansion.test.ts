import { describe, expect, it } from "vitest";
import { getUnitDef } from "../data/units";
import { emptyBoard, placeUnit } from "./board";
import { beginEngagement } from "./combat/engagement";
import { createMatch, must } from "./match";
import { cloneState } from "./state";
import { hasStatusOn, statusesOf } from "./status";
import type { CardInstance, MatchState, PlayerId, PlayTargets, UnitInstance } from "./types";
import { P1_FRONT, P1_SUPPORT, P2_FRONT, P2_SUPPORT } from "./types";
import { distributeEvenly } from "./expansionSpecials";

function spawn(state: MatchState, defId: number, owner: PlayerId, col: number, row: number): UnitInstance {
  const def = getUnitDef(defId);
  const unit: UnitInstance = {
    instanceId: `t_${defId}_${col}_${row}_${owner}`,
    defId: def.id,
    name: def.name,
    class: def.class,
    owner,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    armor: def.armor,
    ap: def.ap,
    cost: def.cost,
    col,
    row,
    keywords: def.keywords.map((k) => ({ ...k })),
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
    shield: 0,
    shieldMax: 0,
    barrier: 0,
    barrierMax: 0,
    tookDamageSinceRegen: false,
  };
  placeUnit(state.board, unit);
  return unit;
}

function blankMatch(): MatchState {
  const match = cloneState(
    createMatch([28, 29, 30, 31, 32, 33, 34, 35], [2, 3, 4, 5, 6, 7, 8, 9], 1),
  );
  match.board = emptyBoard();
  match.phase = "maneuver";
  match.players[0].commandPoints = 20;
  match.statuses = [];
  match.rngState = 1;
  return match;
}

function give(state: MatchState, defId: number, templateId: string): CardInstance {
  const def = getUnitDef(defId);
  const template = def.cards.find((card) => card.templateId === templateId)!;
  const card: CardInstance = {
    instanceId: `card_${defId}_${templateId}`,
    ownerUnitId: defId,
    templateId: template.templateId,
    name: template.name,
    type: template.type,
    cost: template.cost,
    text: template.text,
    effectId: template.effectId,
    targets: [...template.targets],
    requiresSourceOnField: template.requiresSourceOnField,
  };
  state.players[0].hand.unshift(card);
  return card;
}

function play(state: MatchState, defId: number, templateId: string, targets: PlayTargets) {
  const card = give(state, defId, templateId);
  return must(state, { type: "playCard", cardId: card.instanceId, targets });
}

describe("expansion special skills", () => {
  it("wires catalog specials onto units 28–35", () => {
    expect(getUnitDef(28).cards.find((c) => c.type === "special")!.effectId).toBe("qinglongTide");
    expect(getUnitDef(29).cards.find((c) => c.type === "special")!.effectId).toBe("baihuOmniAoe");
    expect(getUnitDef(30).cards.find((c) => c.type === "special")!.effectId).toBe("pandoraBox");
    expect(getUnitDef(31).cards.find((c) => c.type === "special")!.effectId).toBe("excaliburExecute");
    expect(getUnitDef(32).cards.find((c) => c.type === "special")!.effectId).toBe("longinusLance");
    expect(getUnitDef(33).cards.find((c) => c.type === "special")!.effectId).toBe("thorStun");
    expect(getUnitDef(34).cards.find((c) => c.type === "special")!.effectId).toBe("artemisTraps");
    expect(getUnitDef(35).cards.find((c) => c.type === "special")!.effectId).toBe("agniEruption");
  });

  it("distributeEvenly prefers higher HP for damage shares", () => {
    const a = { instanceId: "a", hp: 8 } as UnitInstance;
    const b = { instanceId: "b", hp: 6 } as UnitInstance;
    const c = { instanceId: "c", hp: 6 } as UnitInstance;
    const map = distributeEvenly([a, b, c], 6, "highest");
    expect(map.get("a")! + map.get("b")! + map.get("c")!).toBe(6);
    expect(map.get("a")!).toBeGreaterThanOrEqual(map.get("b")!);
    expect(map.get("a")!).toBeGreaterThanOrEqual(map.get("c")!);
    expect(map.get("a")!).toBeGreaterThan(2);
  });

  it("Qinglong Azure Tide splits 6 dmg and 4 heal by priority", () => {
    const state = blankMatch();
    const qing = spawn(state, 28, 0, P1_FRONT, 1);
    qing.hp = 5;
    const ally = spawn(state, 29, 0, P1_FRONT, 2);
    ally.hp = 2;
    ally.maxHp = 8;
    const high = spawn(state, 2, 1, P2_FRONT, 0);
    high.hp = 10;
    const mid = spawn(state, 3, 1, P2_FRONT, 1);
    mid.hp = 6;
    const low = spawn(state, 4, 1, P2_FRONT, 2);
    low.hp = 3;
    const next = play(state, 28, "qinglong_tide", {});
    // Prefer highest: 5 to high, 1 to mid, 0 to low after equalization.
    expect(next.board[P2_FRONT][0]!.hp).toBe(5);
    expect(next.board[P2_FRONT][1]!.hp).toBe(5);
    expect(next.board[P2_FRONT][2]!.hp).toBe(3);
    // Prefer lowest heal: ally gets 3, Qinglong gets 1.
    expect(next.board[P1_FRONT][1]!.hp).toBe(6);
    expect(next.board[P1_FRONT][2]!.hp).toBe(5);
  });

  it("Baihu Omnidirectional Claws splashes gun damage to adjacent enemies", () => {
    const soft = blankMatch();
    spawn(soft, 29, 0, P1_FRONT, 1);
    const p = spawn(soft, 22, 1, P2_FRONT, 1);
    const adj = spawn(soft, 22, 1, P2_FRONT, 0);
    const away = spawn(soft, 22, 1, P2_FRONT, 3);
    const armed = play(soft, 29, "baihu_omni", {});
    expect(hasStatusOn(armed, armed.board[P1_FRONT][1]!.instanceId, "omniAoe")).toBe(true);
    beginEngagement(armed, { skipRelocation: true });
    expect(armed.board[P2_FRONT][1]!.hp).toBeLessThan(p.maxHp);
    expect(armed.board[P2_FRONT][0]!.hp).toBeLessThan(adj.maxHp);
    expect(armed.board[P2_FRONT][3]!.hp).toBe(away.maxHp);
  });

  it("Pandora's Box applies a 2-turn random debuff to each enemy", () => {
    const state = blankMatch();
    spawn(state, 30, 0, P1_FRONT, 1);
    const a = spawn(state, 2, 1, P2_FRONT, 0);
    const b = spawn(state, 3, 1, P2_FRONT, 1);
    const next = play(state, 30, "pandora_box", {});
    const debuffed = [a, b].every((unit) => {
      const id = next.board[unit.col][unit.row]!.instanceId;
      return (
        hasStatusOn(next, id, "modAtk") ||
        hasStatusOn(next, id, "modArmor") ||
        hasStatusOn(next, id, "suppressKeywords")
      );
    });
    expect(debuffed).toBe(true);
    const mods = [
      ...statusesOf(next, "modAtk"),
      ...statusesOf(next, "modArmor"),
      ...statusesOf(next, "suppressKeywords"),
    ];
    expect(mods.every((s) => s.duration === "endOfNextTurn")).toBe(true);
  });

  it("Excalibur Execute destroys only sub-25% HP targets", () => {
    const state = blankMatch();
    spawn(state, 31, 0, P1_FRONT, 1);
    const healthy = spawn(state, 2, 1, P2_FRONT, 1);
    healthy.hp = Math.ceil(healthy.maxHp * 0.3);
    expect(() => play(state, 31, "excalibur_execute", { unitIds: [healthy.instanceId] })).toThrow(
      /25%/i,
    );
    const dying = spawn(blankMatch(), 2, 1, P2_FRONT, 2);
    const ok = blankMatch();
    spawn(ok, 31, 0, P1_FRONT, 1);
    const target = spawn(ok, 2, 1, P2_FRONT, 2);
    target.hp = Math.floor(target.maxHp * 0.2);
    const next = play(ok, 31, "excalibur_execute", { unitIds: [target.instanceId] });
    expect(next.board[P2_FRONT][2]).toBeNull();
    expect(dying.maxHp).toBeGreaterThan(0);
  });

  it("Longinus Holy Lance deals floor(50% current HP)", () => {
    const state = blankMatch();
    spawn(state, 32, 0, P1_SUPPORT, 1);
    const target = spawn(state, 2, 1, P2_FRONT, 1);
    target.hp = 11;
    const next = play(state, 32, "longinus_lance", { unitIds: [target.instanceId] });
    expect(next.board[P2_FRONT][1]!.hp).toBe(6); // 11 - 5
  });

  it("Thor Mjolnir EMP stuns a target so it cannot move or volley", () => {
    const state = blankMatch();
    spawn(state, 33, 0, P1_FRONT, 1);
    const foe = spawn(state, 2, 1, P2_FRONT, 1);
    const next = play(state, 33, "thor_stun", { unitIds: [foe.instanceId] });
    expect(hasStatusOn(next, foe.instanceId, "stunned")).toBe(true);

    const duel = blankMatch();
    spawn(duel, 33, 0, P1_FRONT, 1);
    const stunned = spawn(duel, 2, 1, P2_FRONT, 1);
    const stunnedState = play(duel, 33, "thor_stun", { unitIds: [stunned.instanceId] });
    const before = stunnedState.board[P1_FRONT][1]!.hp;
    beginEngagement(stunnedState, { skipRelocation: true, attacker: 1 });
    // Stunned attacker cannot volley, so Thor takes no gun damage from them.
    expect(stunnedState.board[P1_FRONT][1]!.hp).toBe(before);
  });

  it("Artemis Moon Sigils trap a unit that moves onto them", () => {
    const state = blankMatch();
    spawn(state, 34, 0, P1_SUPPORT, 0);
    const next = play(state, 34, "artemis_traps", {
      cells: [
        { col: P2_FRONT, row: 2 },
        { col: P2_SUPPORT, row: 2 },
      ],
    });
    expect(statusesOf(next, "boardTrap")).toHaveLength(2);
    const victim = spawn(next, 2, 1, P2_SUPPORT, 1);
    victim.keywords = [
      { name: "aggressive", value: 4 },
      { name: "blitz", value: 1 },
    ];
    // Move onto trap via Forward into P2_FRONT row 2 — use relocate through a move card.
    next.currentPlayer = 1;
    next.players[1].commandPoints = 5;
    const forward: CardInstance = {
      instanceId: "fwd",
      ownerUnitId: 2,
      templateId: "forward_1",
      name: "Forward",
      type: "move",
      cost: 0,
      text: "fwd",
      effectId: "forward",
      targets: ["friendly", "boardDest"],
    };
    next.players[1].hand.unshift(forward);
    // Place victim on support of row 2 empty front with trap.
    next.board[victim.col][victim.row] = null;
    victim.col = P2_SUPPORT;
    victim.row = 2;
    placeUnit(next.board, victim);
    const after = must(next, {
      type: "playCard",
      cardId: "fwd",
      targets: { unitIds: [victim.instanceId], cells: [{ col: P2_FRONT, row: 2 }] },
    });
    const moved = after.board[P2_FRONT][2]!;
    expect(moved.keywords).toEqual([]);
    expect(hasStatusOn(after, moved.instanceId, "rooted")).toBe(true);
    expect(statusesOf(after, "boardTrap").some((t) => t.col === P2_FRONT && t.lane === 2)).toBe(false);
  });

  it("Agni Eruption Omen detonates on the enemy engagement", () => {
    const state = blankMatch();
    // Keep Agni off the marked lane so return fire does not stack on omen damage.
    spawn(state, 35, 0, P1_FRONT, 3);
    const center = spawn(state, 2, 1, P2_FRONT, 1);
    const adj = spawn(state, 3, 1, P2_FRONT, 0);
    const marked = play(state, 35, "agni_eruption", { cells: [{ col: P2_FRONT, row: 1 }] });
    expect(statusesOf(marked, "eruptionOmen")).toHaveLength(1);
    beginEngagement(marked, { skipRelocation: true, attacker: 1 });
    expect(marked.board[P2_FRONT][1]!.hp).toBe(center.maxHp - 4);
    expect(marked.board[P2_FRONT][0]!.hp).toBe(adj.maxHp - 2);
    expect(statusesOf(marked, "eruptionOmen")).toHaveLength(0);
  });

  it("Agni Eruption Omen reduces adjacent damage when the center is empty", () => {
    const state = blankMatch();
    spawn(state, 35, 0, P1_FRONT, 3);
    const adj = spawn(state, 3, 1, P2_FRONT, 0);
    const marked = play(state, 35, "agni_eruption", { cells: [{ col: P2_FRONT, row: 1 }] });
    beginEngagement(marked, { skipRelocation: true, attacker: 1 });
    expect(marked.board[P2_FRONT][0]!.hp).toBe(adj.maxHp - 1);
  });
});
