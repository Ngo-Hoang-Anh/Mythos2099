import { describe, expect, it } from "vitest";
import { getUnitDef } from "../data/units";
import { emptyBoard, placeUnit } from "./board";
import { beginEngagement } from "./combat/engagement";
import { pickMissileTarget } from "./combat/helpers";
import { resolveMissileShot } from "./combat/missile";
import { createMatch, must, applyAction } from "./match";
import { cloneState } from "./state";
import { resolveAttack } from "./attack";
import type { CardInstance, MatchState, PlayerId, UnitInstance } from "./types";
import { P1_FRONT, P1_SUPPORT, P2_FRONT, P2_SUPPORT } from "./types";

function spawn(state: MatchState, defId: number, owner: PlayerId, col: number, row: number): UnitInstance {
  const def = getUnitDef(defId);
  const unit: UnitInstance = {
    instanceId: `t_${defId}_${col}_${row}`,
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
  };
  placeUnit(state.board, unit);
  return unit;
}

function blankMatch(): MatchState {
  const match = cloneState(
    createMatch(
      [17, 3, 4, 1, 18, 21, 23, 5],
      [12, 10, 11, 26, 17, 3, 18, 24],
      1,
    ),
  );
  match.board = emptyBoard();
  match.phase = "maneuver";
  match.players[0].commandPoints = 20;
  match.statuses = [];
  return match;
}

function give(state: MatchState, defId: number, templateId: string): CardInstance {
  const def = getUnitDef(defId);
  const template = def.cards.find((card) => card.templateId === templateId)!;
  const card: CardInstance = {
    instanceId: `card_${templateId}`,
    ownerUnitId: defId,
    templateId: template.templateId,
    name: template.name,
    type: template.type,
    cost: template.cost,
    text: template.text,
    effectId: template.effectId,
    targets: [...template.targets],
  };
  state.players[0].hand.unshift(card);
  return card;
}

describe("special effects", () => {
  it("does not let extra attacks retaliate or use Aggressive", () => {
    const state = blankMatch();
    const apex = spawn(state, 2, 0, P1_FRONT, 2);
    const bastion = spawn(state, 3, 1, P2_FRONT, 2);
    const before = apex.hp;
    resolveAttack(state, apex.instanceId);
    expect(apex.hp).toBe(before);
    expect(bastion.hp).toBe(bastion.maxHp - 1);
  });

  it("Ambush buffs Armor/ATK on Frontline and engages", () => {
    const state = blankMatch();
    const apex = spawn(state, 2, 0, P1_FRONT, 2);
    spawn(state, 4, 1, P2_FRONT, 2);
    const card = give(state, 2, "ambush");
    const next = must(state, { type: "playCard", cardId: card.instanceId, targets: {} });
    const unit = next.board[P1_FRONT][2]!;
    expect(unit.tempAtk).toBe(2);
    expect(unit.tempArmor).toBe(2);
    expect(unit.tempAp).toBe(0);
    expect(next.phase).toBe("engagement");
    expect(unit.hp).toBeLessThanOrEqual(apex.hp);
  });

  it("Ambush does not fire from Support", () => {
    const state = blankMatch();
    spawn(state, 2, 0, P1_SUPPORT, 2);
    const card = give(state, 2, "ambush");
    const result = applyAction(state, { type: "playCard", cardId: card.instanceId, targets: {} });
    expect(result.ok).toBe(false);
  });

  it("Thunder Strike extra missile ignores armor", () => {
    const state = blankMatch();
    spawn(state, 1, 0, P1_FRONT, 1);
    spawn(state, 17, 1, P2_FRONT, 1);
    const card = give(state, 1, "thunder_strike");
    const next = must(state, { type: "playCard", cardId: card.instanceId, targets: {} });
    expect(next.board[P2_FRONT][1]?.hp).toBe(17);
    expect(next.board[P1_FRONT][1]?.missileTarget).toEqual({ col: P2_FRONT, row: 1 });
    expect(next.statuses.some((s) => s.kind === "missileIgnoreArmor")).toBe(true);
  });

  it("Target Acquired makes allied missiles prefer the marked lane", () => {
    const state = blankMatch();
    const recon = spawn(state, 22, 0, P1_FRONT, 0);
    spawn(state, 1, 0, P1_FRONT, 3);
    spawn(state, 17, 1, P2_FRONT, 0);
    spawn(state, 3, 1, P2_FRONT, 3);
    const card = give(state, 22, "target_acquired");
    const next = must(state, { type: "playCard", cardId: card.instanceId, targets: {} });
    const zeus = next.board[P1_FRONT][3]!;
    const picked = pickMissileTarget(next, zeus);
    expect(picked?.row).toBe(recon.row);
  });

  it("skips an untargetable Stingray and missiles another unit", () => {
    const state = blankMatch();
    const zeus = spawn(state, 1, 0, P1_FRONT, 2);
    spawn(state, 26, 1, P2_FRONT, 2);
    const other = spawn(state, 17, 1, P2_FRONT, 0);
    state.statuses.push({
      id: "st_untarget",
      kind: "untargetable",
      magnitude: 0,
      sourceId: "stingray",
      owner: 1,
      targetId: state.board[P2_FRONT][2]!.instanceId,
      duration: "endOfNextTurn",
      remainingPasses: 2,
    });
    resolveMissileShot(state, zeus);
    expect(state.board[P2_FRONT][2]?.hp).toBe(getUnitDef(26).hp);
    expect(other.hp).toBe(other.maxHp);
    expect(zeus.missileTarget).toEqual({ col: other.col, row: other.row });
    resolveMissileShot(state, zeus);
    expect(state.board[P2_FRONT][2]?.hp).toBe(getUnitDef(26).hp);
    expect(other.hp).toBeLessThan(other.maxHp);
  });

  it("still lets normal attacks hit Stingray", () => {
    const state = blankMatch();
    spawn(state, 2, 0, P1_FRONT, 2);
    const stingray = spawn(state, 26, 1, P2_FRONT, 2);
    stingray.hp = 4;
    state.statuses.push({
      id: "st_untarget",
      kind: "untargetable",
      magnitude: 0,
      sourceId: "stingray",
      owner: 1,
      targetId: stingray.instanceId,
      duration: "endOfNextTurn",
      remainingPasses: 2,
    });
    beginEngagement(state, { skipRelocation: true });
    const after = state.board[P2_FRONT][2];
    expect(after === null || (after && after.hp < 4)).toBe(true);
  });

  it("blocks effect targeting on Stingray", () => {
    const state = blankMatch();
    spawn(state, 15, 0, P1_FRONT, 1);
    const stingray = spawn(state, 26, 1, P2_FRONT, 3);
    state.statuses.push({
      id: "st_untarget",
      kind: "untargetable",
      magnitude: 0,
      sourceId: "stingray",
      owner: 1,
      targetId: stingray.instanceId,
      duration: "endOfNextTurn",
      remainingPasses: 2,
    });
    const card = give(state, 15, "analyze_weakness");
    expect(() =>
      must(state, { type: "playCard", cardId: card.instanceId, targets: { unitIds: [stingray.instanceId] } }),
    ).toThrow(/cannot be targeted/);
  });

  it("keeps Entrenchment through the opponent's turn", () => {
    let match = createMatch(
      [17, 3, 4, 1, 18, 21, 23, 5],
      [12, 10, 11, 1, 17, 3, 18, 24],
      4,
    );
    match.players[0].commandPoints = 5;
    match = must(match, { type: "deploy", unitDefId: 17, row: 2 });
    match = must(match, { type: "endDeployment" });
    match.players[0].commandPoints = 5;
    const fromDeck = match.players[0].deck.find((c) => c.templateId === "entrenchment");
    const fromHand = match.players[0].hand.find((c) => c.templateId === "entrenchment");
    const card = fromHand ?? fromDeck!;
    if (fromDeck) {
      match.players[0].deck = match.players[0].deck.filter((c) => c.instanceId !== card.instanceId);
      match.players[0].hand.unshift(card);
    }
    match = must(match, { type: "playCard", cardId: card.instanceId, targets: {} });
    const guard = match.board[P1_SUPPORT][2]!;
    expect(guard.tempArmor).toBe(3);
    expect(guard.tempAp).toBe(2);
    match = must(match, { type: "endManeuver" });
    match = must(match, { type: "endEngagement" });
    const still = match.board.flat().find((u) => u?.defId === 17);
    expect(still?.tempArmor).toBe(3);
    expect(still?.tempAp).toBe(2);
  });

  it("returns Komet to reserve after Hit & Run", () => {
    const state = blankMatch();
    const komet = spawn(state, 27, 0, P1_FRONT, 2);
    spawn(state, 17, 1, P2_FRONT, 2);
    const card = give(state, 27, "hit_and_run");
    const next = must(state, { type: "playCard", cardId: card.instanceId, targets: {} });
    expect(next.board[P1_FRONT][2]).toBeNull();
    expect(next.players[0].undeployed).toContain(27);
    expect(komet.defId).toBe(27);
  });

  it("Kamikaze deals 8 ignoring armor to a unit anywhere", () => {
    const state = blankMatch();
    spawn(state, 23, 0, P1_FRONT, 0);
    const far = spawn(state, 3, 1, P2_SUPPORT, 3);
    const card = give(state, 23, "kamikaze");
    const next = must(state, { type: "playCard", cardId: card.instanceId, targets: { unitIds: [far.instanceId] } });
    expect(next.board[P1_FRONT][0]).toBeNull();
    expect(next.board[P2_SUPPORT][3]?.hp).toBe(far.maxHp - 8);
    const attack = next.fx.find((event) => event.kind === "attack");
    expect(attack).toMatchObject({
      kind: "attack",
      kamikaze: true,
      defId: 23,
      damage: 8,
    });
  });

  it("Aegis Diversion still pulls into the empty Front/Support cell of its lane", () => {
    const state = blankMatch();
    spawn(state, 13, 0, P1_FRONT, 2);
    spawn(state, 17, 1, P2_FRONT, 2);
    const target = spawn(state, 4, 1, P2_FRONT, 0);
    const card = give(state, 13, "diversion");
    const next = must(state, { type: "playCard", cardId: card.instanceId, targets: { unitIds: [target.instanceId] } });
    expect(next.board[P2_FRONT][0]).toBeNull();
    expect(next.board[P2_FRONT][2]?.defId).toBe(17);
    expect(next.board[P2_SUPPORT][2]?.instanceId).toBe(target.instanceId);
  });

  it("Aegis Diversion keeps the same column when that cell is free", () => {
    const state = blankMatch();
    spawn(state, 13, 0, P1_FRONT, 2);
    const target = spawn(state, 4, 1, P2_FRONT, 0);
    const card = give(state, 13, "diversion");
    const next = must(state, { type: "playCard", cardId: card.instanceId, targets: { unitIds: [target.instanceId] } });
    expect(next.board[P2_FRONT][2]?.instanceId).toBe(target.instanceId);
    expect(next.board[P2_SUPPORT][2]).toBeNull();
  });

  it("Aegis Diversion fails when both cells in its lane are occupied", () => {
    const state = blankMatch();
    spawn(state, 13, 0, P1_FRONT, 2);
    spawn(state, 17, 1, P2_FRONT, 2);
    spawn(state, 3, 1, P2_SUPPORT, 2);
    const target = spawn(state, 4, 1, P2_FRONT, 0);
    const card = give(state, 13, "diversion");
    expect(() =>
      must(state, { type: "playCard", cardId: card.instanceId, targets: { unitIds: [target.instanceId] } }),
    ).toThrow(/destination lane is occupied/i);
  });
});
