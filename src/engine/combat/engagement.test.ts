import { describe, expect, it } from "vitest";
import { getUnitDef } from "../../data/units";
import { emptyBoard, placeUnit } from "../board";
import { resolveDestroyedUnits, runCleanupPhase } from "./cleanup";
import { runDamagePhase } from "./damage";
import { beginEngagement } from "./engagement";
import { runMissilePhase } from "./missile";
import { runRelocationPhase } from "./relocation";
import { runStatsPhase } from "./stats";
import type { CombatCtx } from "./helpers";
import { createMatch, must } from "../match";
import { cloneState } from "../state";
import type { CardInstance, MatchState, PlayerId, UnitInstance } from "../types";
import { HQ_MAX_HP, P1_FRONT, P1_SUPPORT, P2_FRONT, P2_SUPPORT } from "../types";

function ctx(attacker: PlayerId = 0): CombatCtx {
  return { attacker, defender: attacker === 0 ? 1 : 0, steps: [] };
}

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
  const match = cloneState(createMatch(
    [17, 3, 4, 1, 18, 21, 23, 5],
    [12, 10, 11, 1, 17, 3, 18, 24],
    1,
  ));
  match.board = emptyBoard();
  return match;
}

describe("relocation phase", () => {
  it("advances non-battery units and marks them rested", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_SUPPORT, 1);
    runRelocationPhase(state, ctx());
    const unit = state.board[P1_FRONT][1];
    expect(unit?.defId).toBe(17);
    expect(unit?.rested).toBe(true);
    expect(state.board[P1_SUPPORT][1]).toBeNull();
  });

  it("does not advance artillery and does not rest it", () => {
    const state = blankMatch();
    spawn(state, 12, 0, P1_SUPPORT, 2);
    runRelocationPhase(state, ctx());
    const unit = state.board[P1_SUPPORT][2];
    expect(unit?.defId).toBe(12);
    expect(unit?.rested).toBe(false);
  });

  it("does not advance a jet from Support", () => {
    const state = blankMatch();
    spawn(state, 25, 0, P1_SUPPORT, 2);
    runRelocationPhase(state, ctx());
    expect(state.board[P1_SUPPORT][2]?.defId).toBe(25);
    expect(state.board[P1_FRONT][2]).toBeNull();
  });

  it("Cover prefers a lane that has own artillery on Support", () => {
    const state = blankMatch();
    spawn(state, 3, 0, P1_FRONT, 0);
    spawn(state, 12, 0, P1_SUPPORT, 3);
    spawn(state, 4, 1, P2_FRONT, 3);
    runRelocationPhase(state, ctx());
    expect(state.board[P1_FRONT][3]?.defId).toBe(3);
    expect(state.board[P1_FRONT][3]?.rested).toBe(false);
  });

  it("Cover from Support goes to Frontline in front of artillery, not onto the gun", () => {
    const state = blankMatch();
    spawn(state, 6, 0, P1_SUPPORT, 0);
    spawn(state, 12, 0, P1_SUPPORT, 3);
    spawn(state, 4, 1, P2_FRONT, 3);
    runRelocationPhase(state, ctx());
    expect(state.board[P1_FRONT][3]?.defId).toBe(6);
    expect(state.board[P1_FRONT][3]?.rested).toBe(true);
    expect(state.board[P1_SUPPORT][3]?.defId).toBe(12);
    expect(state.board[P1_SUPPORT][0]).toBeNull();
  });

  it("Cover prefers artillery Support over a closer enemy lane with no allies", () => {
    const state = blankMatch();
    spawn(state, 6, 0, P1_FRONT, 2);
    spawn(state, 12, 0, P1_SUPPORT, 0);
    spawn(state, 4, 1, P2_FRONT, 3);
    spawn(state, 21, 1, P2_FRONT, 0);
    runRelocationPhase(state, ctx());
    expect(state.board[P1_FRONT][0]?.defId).toBe(6);
    expect(state.board[P1_FRONT][0]?.rested).toBe(false);
    expect(state.board[P1_FRONT][3]).toBeNull();
  });

  it("Cover prefers an enemy lane with no allies over one that already has an ally", () => {
    const state = blankMatch();
    spawn(state, 6, 0, P1_FRONT, 0);
    spawn(state, 17, 0, P1_SUPPORT, 1);
    spawn(state, 4, 1, P2_FRONT, 1);
    spawn(state, 21, 1, P2_FRONT, 3);
    runRelocationPhase(state, ctx());
    expect(state.board[P1_FRONT][3]?.defId).toBe(6);
    expect(state.board[P1_FRONT][0]).toBeNull();
  });

  it("Artillery with Cover stays on Support when relocating", () => {
    const state = blankMatch();
    spawn(state, 11, 0, P1_SUPPORT, 0);
    spawn(state, 4, 1, P2_FRONT, 3);
    runRelocationPhase(state, ctx());
    expect(state.board[P1_SUPPORT][3]?.defId).toBe(11);
    expect(state.board[P1_SUPPORT][3]?.rested).toBe(false);
    expect(state.board[P1_FRONT][3]).toBeNull();
    expect(state.board[P1_SUPPORT][0]).toBeNull();
  });

  it("Cover picks the upper lane when two enemy cells are equally near", () => {
    const state = blankMatch();
    spawn(state, 6, 0, P1_FRONT, 2);
    spawn(state, 4, 1, P2_FRONT, 1);
    spawn(state, 21, 1, P2_FRONT, 3);
    runRelocationPhase(state, ctx());
    expect(state.board[P1_FRONT][1]?.defId).toBe(6);
    expect(state.board[P1_FRONT][3]).toBeNull();
  });

  it("Flank prefers a lane with no allied units over the upper lane", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_SUPPORT, 1);
    spawn(state, 17, 0, P1_FRONT, 0);
    spawn(state, 3, 1, P2_FRONT, 1);
    runRelocationPhase(state, ctx());
    const unit = state.board[P1_FRONT][2];
    expect(unit?.defId).toBe(4);
    expect(unit?.rested).toBe(true);
    expect(state.board[P1_SUPPORT][2]).toBeNull();
    expect(state.board[P1_FRONT][0]?.defId).toBe(17);
  });

  it("Flank goes to Frontline instead of sidestepping onto Support", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_SUPPORT, 1);
    spawn(state, 17, 1, P2_FRONT, 1);
    runRelocationPhase(state, ctx());
    const unit = state.board[P1_FRONT][0];
    expect(unit?.defId).toBe(4);
    expect(unit?.rested).toBe(true);
    expect(state.board[P1_SUPPORT][1]).toBeNull();
    expect(state.board[P1_SUPPORT][0]).toBeNull();
  });

  it("Flank from Frontline to Frontline does not rest", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 1);
    spawn(state, 17, 1, P2_FRONT, 1);
    runRelocationPhase(state, ctx());
    const unit = state.board[P1_FRONT][0];
    expect(unit?.defId).toBe(4);
    expect(unit?.rested).toBe(false);
    expect(state.board[P1_FRONT][1]).toBeNull();
  });

  it("skips Flank, Cover and Advance when the board is empty", () => {
    const state = blankMatch();
    const c = ctx();
    runRelocationPhase(state, c);
    expect(c.steps.filter((s) => s.kind === "phase")).toEqual([]);
    expect(c.steps.filter((s) => s.kind === "lane")).toEqual([]);
  });

  it("skips Flank and Cover when those keywords cannot act, but still Advances", () => {
    const state = blankMatch();
    const c = ctx();
    spawn(state, 17, 0, P1_SUPPORT, 1);
    runRelocationPhase(state, c);
    expect(c.steps.filter((s) => s.kind === "phase").map((s) => s.detail)).toEqual(["Advance"]);
    // Only the lane that actually advances is highlighted — empty rows are skipped.
    expect(c.steps.filter((s) => s.kind === "lane")).toEqual([{ kind: "lane", lane: 1, color: "green" }]);
  });
});

describe("stats and damage phases", () => {
  it("adds Aggressive into combat ATK only for the striker", () => {
    const state = blankMatch();
    spawn(state, 2, 0, P1_FRONT, 1);
    runStatsPhase(state, ctx());
    const unit = state.board[P1_FRONT][1];
    expect(unit?.isAttacker).toBe(true);
    expect(unit?.combatAtkBonus).toBe(4);
  });

  it("highlights only lanes that have combat ATK buffs", () => {
    const state = blankMatch();
    spawn(state, 2, 0, P1_FRONT, 1); // Aggressive
    spawn(state, 17, 0, P1_FRONT, 3); // no combat keywords
    const c = ctx();
    runStatsPhase(state, c);
    expect(c.steps.filter((s) => s.kind === "lane")).toEqual([{ kind: "lane", lane: 1, color: "yellow" }]);
  });

  it("highlights only lanes that fire in Damage", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 2);
    spawn(state, 4, 1, P2_FRONT, 2);
    const idle = spawn(state, 17, 0, P1_FRONT, 0);
    idle.rested = true;
    const c = ctx();
    runDamagePhase(state, c);
    expect(c.steps.filter((s) => s.kind === "lane")).toEqual([{ kind: "lane", lane: 2, color: "red" }]);
  });

  it("does not apply Retaliate when every enemy in the lane is rested", () => {
    const state = blankMatch();
    const attacker = spawn(state, 4, 0, P1_FRONT, 1);
    attacker.rested = true;
    const bastion = spawn(state, 3, 1, P2_FRONT, 1);
    bastion.ap = 0;
    runStatsPhase(state, ctx());
    expect(state.board[P2_FRONT][1]?.combatAtkBonus).toBe(0);
    const hp = state.board[P1_FRONT][1]!.hp;
    runDamagePhase(state, ctx());
    expect(state.board[P1_FRONT][1]!.hp).toBe(hp);
  });

  it("applies Retaliate only when the unit is defending", () => {
    const state = blankMatch();
    spawn(state, 2, 0, P1_FRONT, 1);
    spawn(state, 3, 1, P2_FRONT, 1);
    runStatsPhase(state, ctx());
    expect(state.board[P1_FRONT][1]?.isAttacker).toBe(true);
    expect(state.board[P1_FRONT][1]?.combatAtkBonus).toBe(4);
    expect(state.board[P2_FRONT][1]?.isAttacker).toBe(false);
    expect(state.board[P2_FRONT][1]?.combatAtkBonus).toBe(5);
  });

  it("applies Support Fire to the attacker and the defender", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 2);
    spawn(state, 5, 0, P1_FRONT, 1);
    spawn(state, 17, 1, P2_FRONT, 2);
    spawn(state, 18, 1, P2_FRONT, 1);
    runStatsPhase(state, ctx());
    expect(state.board[P1_FRONT][2]?.isAttacker).toBe(true);
    expect(state.board[P1_FRONT][2]?.combatAtkBonus).toBe(2);
    expect(state.board[P2_FRONT][2]?.isAttacker).toBe(false);
    expect(state.board[P2_FRONT][2]?.combatAtkBonus).toBe(10);
    runDamagePhase(state, ctx());
    expect(state.board[P2_FRONT][2]?.hp).toBe(15);
    // Heimdall (2 ATK + Retaliate/SF bonus, AP 2) deletes Sarama (10 HP, Armor 2).
    expect(state.board[P1_FRONT][2]).toBeNull();
  });

  it("applies Support Fire to every other ally in the same lane", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 2);
    spawn(state, 11, 0, P1_SUPPORT, 2);
    spawn(state, 5, 0, P1_FRONT, 1);
    spawn(state, 17, 1, P2_FRONT, 2);
    runStatsPhase(state, ctx());
    expect(state.board[P1_FRONT][2]?.combatAtkBonus).toBe(2);
    expect(state.board[P1_SUPPORT][2]?.combatAtkBonus).toBe(2);
    expect(state.board[P1_FRONT][1]?.combatAtkBonus).toBe(0);
  });

  it("stacks Support Fire from Front and Support in an adjacent lane", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 2);
    spawn(state, 5, 0, P1_FRONT, 1);
    spawn(state, 24, 0, P1_SUPPORT, 1);
    spawn(state, 17, 1, P2_FRONT, 2);
    runStatsPhase(state, ctx());
    expect(state.board[P1_FRONT][2]?.combatAtkBonus).toBe(5);
    expect(state.board[P1_FRONT][1]?.combatAtkBonus).toBe(3);
    expect(state.board[P1_SUPPORT][1]?.combatAtkBonus).toBe(2);
  });

  it("still grants Support Fire when the giver or receiver is rested", () => {
    const state = blankMatch();
    const jackal = spawn(state, 4, 0, P1_FRONT, 2);
    const nomad = spawn(state, 5, 0, P1_FRONT, 1);
    nomad.rested = true;
    jackal.rested = true;
    spawn(state, 17, 1, P2_FRONT, 2);
    runStatsPhase(state, ctx());
    expect(state.board[P1_FRONT][2]?.combatAtkBonus).toBe(2);
  });

  it("does not apply a unit's own Support Fire to itself", () => {
    const state = blankMatch();
    spawn(state, 5, 0, P1_FRONT, 2);
    spawn(state, 17, 1, P2_FRONT, 2);
    runStatsPhase(state, ctx());
    expect(state.board[P1_FRONT][2]?.combatAtkBonus).toBe(0);
  });

  it("does not grant Support Fire across a skipped lane", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 2);
    spawn(state, 5, 0, P1_FRONT, 0);
    spawn(state, 17, 1, P2_FRONT, 2);
    runStatsPhase(state, ctx());
    expect(state.board[P1_FRONT][2]?.combatAtkBonus).toBe(0);
  });

  it("lets a 0 HP defender counter before cleanup removes it", () => {
    const state = blankMatch();
    const atk = spawn(state, 16, 0, P1_FRONT, 2);
    atk.atk = 20;
    atk.combatAtkBonus = 0;
    const def = spawn(state, 4, 1, P2_FRONT, 2);
    def.hp = 1;
    def.armor = 0;
    def.atk = 8;
    runDamagePhase(state, ctx());
    expect(state.board[P2_FRONT][2]).toBeNull();
    expect(state.board[P1_FRONT][2]!.hp).toBeLessThan(atk.maxHp);
  });

  it("does not let artillery take return fire when it volleys", () => {
    const state = blankMatch();
    const gun = spawn(state, 11, 0, P1_SUPPORT, 2);
    const dummy = spawn(state, 4, 1, P2_FRONT, 2);
    dummy.armor = 0;
    dummy.atk = 4;
    runDamagePhase(state, ctx());
    expect(dummy.hp).toBeLessThan(dummy.maxHp);
    expect(gun.hp).toBe(gun.maxHp);
  });

  it("does not let artillery counter when it is attacked", () => {
    const state = blankMatch();
    const striker = spawn(state, 4, 0, P1_FRONT, 2);
    striker.armor = 0;
    const gun = spawn(state, 11, 1, P2_SUPPORT, 2);
    gun.armor = 0;
    runDamagePhase(state, ctx());
    expect(gun.hp).toBeLessThan(gun.maxHp);
    expect(striker.hp).toBe(striker.maxHp);
  });

  it("lets a rested defender still return fire (non-artillery)", () => {
    const state = blankMatch();
    const striker = spawn(state, 4, 0, P1_FRONT, 2);
    striker.armor = 0;
    const defender = spawn(state, 17, 1, P2_FRONT, 2);
    defender.rested = true;
    defender.armor = 0;
    const strikerHp = striker.hp;
    runDamagePhase(state, ctx());
    expect(defender.hp).toBeLessThan(defender.maxHp);
    expect(striker.hp).toBeLessThan(strikerHp);
  });

  it("lets a rested jet still counter when attacked", () => {
    const state = blankMatch();
    const striker = spawn(state, 4, 0, P1_FRONT, 2);
    striker.armor = 0;
    const jet = spawn(state, 25, 1, P2_SUPPORT, 2);
    jet.keywords = jet.keywords.filter((k) => k.name === "jetPlane");
    jet.rested = true;
    jet.armor = 0;
    const strikerHp = striker.hp;
    runDamagePhase(state, ctx());
    expect(jet.hp).toBeLessThan(jet.maxHp);
    expect(striker.hp).toBeLessThan(strikerHp);
  });

  it("lets a jet take return fire and still counter", () => {
    const state = blankMatch();
    const jet = spawn(state, 25, 0, P1_SUPPORT, 2);
    jet.keywords = jet.keywords.filter((k) => k.name === "jetPlane");
    const dummy = spawn(state, 4, 1, P2_FRONT, 2);
    dummy.armor = 0;
    dummy.atk = 5;
    dummy.ap = 0;
    runDamagePhase(state, ctx());
    expect(dummy.hp).toBeLessThan(dummy.maxHp);
    expect(jet.hp).toBeLessThan(jet.maxHp);
  });

  it("returns fire to the attacking unit, not merely the lane front", () => {
    const state = blankMatch();
    const tank = spawn(state, 3, 0, P1_FRONT, 2);
    tank.armor = 0;
    const gun = spawn(state, 11, 0, P1_SUPPORT, 2);
    const dummy = spawn(state, 4, 1, P2_FRONT, 2);
    dummy.armor = 0;
    dummy.atk = 4;
    dummy.ap = 0;
    runDamagePhase(state, ctx());
    // Both attacked Dummy; Dummy returns only to units that take return fire (tank, not artillery).
    expect(tank.hp).toBeLessThan(tank.maxHp);
    expect(gun.hp).toBe(gun.maxHp);
  });

  it("returns fire to every attacker in the lane, including a jet on Support", () => {
    const state = blankMatch();
    const tank = spawn(state, 3, 0, P1_FRONT, 2);
    tank.armor = 0;
    tank.atk = 2;
    const jet = spawn(state, 25, 0, P1_SUPPORT, 2);
    jet.keywords = jet.keywords.filter((k) => k.name === "jetPlane");
    jet.armor = 0;
    jet.atk = 2;
    const dummy = spawn(state, 4, 1, P2_FRONT, 2);
    dummy.armor = 0;
    dummy.atk = 4;
    dummy.ap = 0;
    const tankHp = tank.hp;
    const jetHp = jet.hp;
    runDamagePhase(state, ctx());
    expect(dummy.hp).toBeLessThan(dummy.maxHp);
    expect(tank.hp).toBeLessThan(tankHp);
    expect(jet.hp).toBeLessThan(jetHp);
  });

  it("does not let counters deal HQ damage", () => {
    const state = blankMatch();
    const gun = spawn(state, 11, 0, P1_SUPPORT, 2);
    gun.rested = false;
    const dummy = spawn(state, 4, 1, P2_FRONT, 2);
    dummy.armor = 0;
    dummy.atk = 8;
    const hqBefore = state.players[0].hqHp;
    runDamagePhase(state, ctx());
    // Artillery shot Dummy; Dummy cannot return onto Artillery and must not chip HQ instead.
    expect(dummy.hp).toBeLessThan(dummy.maxHp);
    expect(gun.hp).toBe(gun.maxHp);
    expect(state.players[0].hqHp).toBe(hqBefore);
  });

  it("lets a support-line defender return fire when attacked", () => {
    const state = blankMatch();
    const striker = spawn(state, 4, 0, P1_FRONT, 2);
    striker.armor = 0;
    // Normal unit parked on Support (no Front blocker) — still returns when hit.
    const defender = spawn(state, 17, 1, P2_SUPPORT, 2);
    defender.keywords = [];
    defender.armor = 0;
    defender.atk = 5;
    const strikerHp = striker.hp;
    runDamagePhase(state, ctx());
    expect(defender.hp).toBeLessThan(defender.maxHp);
    expect(striker.hp).toBeLessThan(strikerHp);
  });

  it("does not counter when the attacker skipped the volley (REST)", () => {
    const state = blankMatch();
    const cadet = spawn(state, 4, 0, P1_FRONT, 2);
    cadet.rested = true;
    cadet.armor = 0;
    const dummy = spawn(state, 4, 1, P2_FRONT, 2);
    dummy.armor = 0;
    dummy.atk = 5;
    runDamagePhase(state, ctx());
    expect(cadet.hp).toBe(cadet.maxHp);
    expect(dummy.hp).toBe(dummy.maxHp);
  });

  it("keeps corpses on the board if cleanup is not run", () => {
    const state = blankMatch();
    const atk = spawn(state, 16, 0, P1_FRONT, 2);
    atk.atk = 20;
    const def = spawn(state, 4, 1, P2_FRONT, 2);
    def.hp = 1;
    def.armor = 0;
    def.atk = 0;
    const c = ctx();
    // damage phase now cleans per lane; verify destroy steps exist after counter
    runDamagePhase(state, c);
    expect(c.steps.some((s) => s.kind === "destroy" && s.unitId === def.instanceId)).toBe(true);
  });

  it("still records a shot when armor blocks all damage", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 1);
    spawn(state, 3, 1, P2_FRONT, 1);
    const c = ctx();
    runDamagePhase(state, c);
    const blocked = c.steps.find((s) => s.kind === "shot" && s.side === "attack");
    expect(blocked?.kind === "shot" && blocked.damage === 0).toBe(true);
    expect(blocked?.kind === "shot" && blocked.power).toBe(6);
    expect(blocked?.kind === "shot" && blocked.targetMaxHp).toBe(getUnitDef(3).hp);
  });
});

describe("missile phase", () => {
  it("locks the enemy support unit in the same lane, then fires on the next activation", () => {
    const state = blankMatch();
    const shooter = spawn(state, 10, 0, P1_SUPPORT, 1);
    const front = spawn(state, 17, 1, P2_FRONT, 1);
    const back = spawn(state, 5, 1, P2_SUPPORT, 1);
    front.armor = 0;
    back.armor = 0;
    const backHp = back.hp;
    runMissilePhase(state, ctx());
    expect(back.hp).toBe(backHp);
    expect(front.hp).toBe(getUnitDef(17).hp);
    expect(shooter.missileTarget).toEqual({ col: P2_SUPPORT, row: 1 });
    runMissilePhase(state, ctx());
    expect(back.hp).toBeLessThan(backHp);
    expect(front.hp).toBe(getUnitDef(17).hp);
  });

  it("does not fire or hit HQ when no enemy is on the board", () => {
    const state = blankMatch();
    const shooter = spawn(state, 10, 0, P1_SUPPORT, 2);
    const c = ctx();
    runMissilePhase(state, c);
    expect(c.steps.some((s) => s.kind === "phase" && s.phase === "missile")).toBe(true);
    expect(c.steps.some((s) => s.kind === "shot" && s.side === "missile")).toBe(false);
    expect(c.steps.some((s) => s.kind === "missileLock")).toBe(false);
    expect(shooter.missileTarget ?? null).toBeNull();
    expect(state.players[1].hqHp).toBe(HQ_MAX_HP);
  });

  it("records HQ comeback steps when a volley first crosses a mark while behind", () => {
    const state = blankMatch();
    spawn(state, 12, 0, P1_SUPPORT, 2);
    state.players[0].hqHp = HQ_MAX_HP;
    state.players[1].hqHp = 42;
    const hand = state.players[1].hand.length;
    const c = ctx();
    runDamagePhase(state, c);
    expect(state.players[1].hqHp).toBeLessThanOrEqual(40);
    expect(state.players[1].triggeredBreakpoints).toContain(40);
    expect(state.players[1].nextTurnSupplyBonus).toBeGreaterThanOrEqual(1);
    expect(state.players[1].nextTurnDrawBonus).toBeGreaterThanOrEqual(1);
    expect(state.players[1].hand.length).toBe(hand);
    expect(c.steps.some((s) => s.kind === "hqBreakpoint" && s.bp === 40 && s.player === 1)).toBe(true);
  });

  it("skips rested units", () => {
    const state = blankMatch();
    const shooter = spawn(state, 8, 0, P1_FRONT, 0);
    shooter.rested = true;
    const target = spawn(state, 4, 1, P2_SUPPORT, 0);
    target.armor = 0;
    const hp = target.hp;
    runMissilePhase(state, ctx());
    expect(target.hp).toBe(hp);
  });

  it("locks the upper adjacent lane when both neighbors have enemies, then fires there", () => {
    const state = blankMatch();
    const shooter = spawn(state, 10, 0, P1_SUPPORT, 2);
    const upper = spawn(state, 4, 1, P2_FRONT, 1);
    const lower = spawn(state, 21, 1, P2_FRONT, 3);
    upper.armor = 0;
    lower.armor = 0;
    const upperHp = upper.hp;
    runMissilePhase(state, ctx());
    expect(upper.hp).toBe(upperHp);
    expect(lower.hp).toBe(getUnitDef(21).hp);
    expect(shooter.missileTarget).toEqual({ col: P2_FRONT, row: 1 });
    runMissilePhase(state, ctx());
    expect(upper.hp).toBeLessThan(upperHp);
    expect(lower.hp).toBe(getUnitDef(21).hp);
  });
});

describe("full engagement playback", () => {
  it("stays in engagement until endEngagement and artillery still shoots HQ", () => {
    let match = createMatch(
      [12, 10, 11, 1, 17, 3, 18, 24],
      [8, 19, 7, 20, 4, 22, 6, 21],
      5,
    );
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 12, row: 2 });
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    expect(match.phase).toBe("engagement");
    expect(match.board[P1_SUPPORT][2]?.defId).toBe(12);
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
    match = must(match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(1);
    expect(match.phase).toBe("deployment");
  });
});

describe("combat phase skips", () => {
  it("skips stats when no combat ATK bonuses apply", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_FRONT, 1);
    const c = ctx();
    runStatsPhase(state, c);
    expect(c.steps.filter((s) => s.kind === "phase")).toEqual([]);
  });

  it("skips damage when nobody can volley", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_SUPPORT, 1);
    const unit = state.board[P1_SUPPORT][1]!;
    unit.rested = true;
    const c = ctx();
    runDamagePhase(state, c);
    expect(c.steps.filter((s) => s.kind === "phase")).toEqual([]);
  });

  it("skips missile when no attacker has a missile shot", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_FRONT, 1);
    const c = ctx();
    runMissilePhase(state, c);
    expect(c.steps.filter((s) => s.kind === "phase")).toEqual([]);
  });

  it("skips cleanup when nobody is at 0 HP", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_FRONT, 1);
    const c = ctx();
    runCleanupPhase(state, c);
    expect(c.steps.filter((s) => s.kind === "phase")).toEqual([]);
    expect(state.board[P1_FRONT][1]?.defId).toBe(17);
  });
});

describe("cleanup helper", () => {
  it("strips remaining 0 HP units after missiles", () => {
    const state = blankMatch();
    const unit = spawn(state, 4, 1, P2_FRONT, 0);
    unit.hp = 0;
    runCleanupPhase(state, ctx());
    expect(state.board[P2_FRONT][0]).toBeNull();
  });

  it("resolveDestroyedUnits clears 0 HP corpses outside combat", () => {
    const state = blankMatch();
    const unit = spawn(state, 4, 1, P2_FRONT, 0);
    unit.hp = 0;
    resolveDestroyedUnits(state);
    expect(state.board[P2_FRONT][0]).toBeNull();
  });

  it("does not destroy the same-named unit on the other side", () => {
    const state = blankMatch();
    const p1 = spawn(state, 4, 0, P1_FRONT, 2);
    const p2 = spawn(state, 4, 1, P2_FRONT, 2);
    expect(p1.name).toBe(p2.name);
    expect(p1.instanceId).not.toBe(p2.instanceId);
    p1.hp = 0;
    const c = ctx();
    runCleanupPhase(state, c);
    expect(state.board[P1_FRONT][2]).toBeNull();
    expect(state.board[P2_FRONT][2]?.instanceId).toBe(p2.instanceId);
    expect(state.board[P2_FRONT][2]?.hp).toBe(p2.maxHp);
    expect(c.steps.filter((s) => s.kind === "destroy").map((s) => s.unitId)).toEqual([p1.instanceId]);
  });
});

function injectCard(state: MatchState, card: CardInstance): void {
  state.players[0].hand = [card, ...state.players[0].hand];
}

function playbackPhases(state: MatchState): Array<string | undefined> {
  return state.combatPlayback?.steps.filter((s) => s.kind === "phase").map((s) => s.detail ?? s.phase) ?? [];
}

describe("mid-turn extra engagement", () => {
  it("keeps rested through endEngagement when resuming maneuver", () => {
    const state = blankMatch();
    const gun = spawn(state, 12, 0, P1_SUPPORT, 2);
    gun.rested = true;
    beginEngagement(state, { skipRelocation: true, resumePhase: "maneuver" });
    const after = must(state, { type: "endEngagement" });
    expect(after.phase).toBe("maneuver");
    expect(after.currentPlayer).toBe(0);
    expect(after.board[P1_SUPPORT][2]?.rested).toBe(true);
  });

  it("skips relocation but still applies stats, damage, and missiles", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_SUPPORT, 2);
    spawn(state, 2, 0, P1_FRONT, 1);
    spawn(state, 10, 0, P1_SUPPORT, 0);
    const enemy = spawn(state, 4, 1, P2_FRONT, 1);
    enemy.armor = 0;
    beginEngagement(state, { skipRelocation: true, resumePhase: "maneuver" });
    expect(state.phase).toBe("engagement");
    expect(state.combatResumePhase).toBe("maneuver");
    expect(state.board[P1_SUPPORT][2]?.defId).toBe(17);
    expect(state.board[P1_FRONT][2]).toBeNull();
    expect(playbackPhases(state)).toEqual(["stats", "damage", "missile"]);
    expect(state.board[P1_FRONT][1]?.combatAtkBonus).toBe(4);
    expect(state.board[P2_FRONT][1]?.missileTarget).toBeUndefined();
    expect(state.board[P1_SUPPORT][0]?.missileTarget).toEqual({ col: P2_FRONT, row: 1 });
    expect(state.players[1].hqHp).toBeLessThan(HQ_MAX_HP);
  });

  it("Quick Engagement only fights that unit and applies Aggressive", () => {
    let match = must(blankMatch(), { type: "endDeployment" });
    const ally = spawn(match, 2, 0, P1_FRONT, 1);
    spawn(match, 11, 0, P1_SUPPORT, 1);
    spawn(match, 17, 0, P1_SUPPORT, 3);
    spawn(match, 10, 0, P1_SUPPORT, 0);
    spawn(match, 4, 1, P2_FRONT, 1);
    const bystander = spawn(match, 22, 1, P2_FRONT, 0);
    const bystanderHp = bystander.hp;
    injectCard(match, {
      instanceId: "qe",
      ownerUnitId: 23,
      templateId: "quick_engagement",
      name: "Quick Engagement",
      type: "maneuver",
      cost: 2,
      text: "A Frontline ally engages in combat.",
      effectId: "quickEngage",
      targets: ["friendly"],
    });
    match.players[0].commandPoints = 5;
    match = must(match, { type: "playCard", cardId: "qe", targets: { unitIds: [ally.instanceId] } });
    expect(match.phase).toBe("engagement");
    expect(match.board[P1_SUPPORT][3]?.defId).toBe(17);
    expect(playbackPhases(match)).toEqual(["stats", "damage"]);
    expect(match.board[P1_FRONT][1]?.combatAtkBonus).toBe(4);
    expect(match.board[P2_FRONT][1]!.hp).toBe(getUnitDef(4).hp - 7);
    expect(match.board[P2_FRONT][0]?.hp).toBe(bystanderHp);
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
    match = must(match, { type: "endEngagement" });
    expect(match.phase).toBe("maneuver");
    expect(match.currentPlayer).toBe(0);
    expect(match.board[P1_SUPPORT][3]?.defId).toBe(17);
  });

  it("Lure only fights the targeted enemy's lane and stays in Maneuver after", () => {
    let match = must(blankMatch(), { type: "endDeployment" });
    spawn(match, 2, 0, P1_FRONT, 1);
    spawn(match, 17, 0, P1_SUPPORT, 3);
    spawn(match, 10, 0, P1_SUPPORT, 0);
    const enemy = spawn(match, 4, 1, P2_FRONT, 1);
    const other = spawn(match, 22, 1, P2_FRONT, 3);
    const otherHp = other.hp;
    injectCard(match, {
      instanceId: "lure-card",
      ownerUnitId: 13,
      templateId: "lure",
      name: "Lure",
      type: "maneuver",
      cost: 0,
      text: "An enemy in a lane triggers engagement. That enemy gets -1 ATK this turn.",
      effectId: "forceEngage",
      targets: ["enemy"],
    });
    match.players[0].commandPoints = 5;
    match = must(match, { type: "playCard", cardId: "lure-card", targets: { unitIds: [enemy.instanceId] } });
    expect(match.phase).toBe("engagement");
    expect(match.board[P1_SUPPORT][3]?.defId).toBe(17);
    expect(playbackPhases(match)).toEqual(["damage"]);
    expect(match.board[P1_FRONT][1]?.combatAtkBonus).toBe(0);
    expect(match.board[P2_FRONT][1]?.isAttacker).toBe(true);
    expect(match.board[P2_FRONT][3]?.hp).toBe(otherHp);
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
    match = must(match, { type: "endEngagement" });
    expect(match.phase).toBe("maneuver");
    expect(match.currentPlayer).toBe(0);
  });

  it("Trap only fights the targeted enemy, not other units in the lane or other rows", () => {
    let match = must(blankMatch(), { type: "endDeployment" });
    spawn(match, 3, 0, P1_FRONT, 2);
    spawn(match, 11, 0, P1_SUPPORT, 2);
    spawn(match, 2, 0, P1_FRONT, 0);
    const trapped = spawn(match, 7, 1, P2_FRONT, 2);
    const behind = spawn(match, 22, 1, P2_SUPPORT, 2);
    const otherLane = spawn(match, 4, 1, P2_FRONT, 0);
    const behindHp = behind.hp;
    const otherHp = otherLane.hp;
    const apexHp = getUnitDef(2).hp;
    injectCard(match, {
      instanceId: "trap-card",
      ownerUnitId: 3,
      templateId: "trap",
      name: "Trap",
      type: "special",
      cost: 1,
      text: "Enemy in Iron Bastion's lane engages.",
      effectId: "trap",
      targets: ["enemy"],
    });
    match.players[0].commandPoints = 5;
    match = must(match, { type: "playCard", cardId: "trap-card", targets: { unitIds: [trapped.instanceId] } });
    expect(match.phase).toBe("engagement");
    expect(match.board[P2_FRONT][2]?.hp).toBe(trapped.maxHp - 5);
    expect(match.board[P1_FRONT][2]?.combatAtkBonus).toBe(5);
    expect(match.board[P2_FRONT][2]?.combatAtkBonus).toBe(0);
    expect(match.board[P2_SUPPORT][2]?.hp).toBe(behindHp);
    expect(match.board[P2_FRONT][0]?.hp).toBe(otherHp);
    expect(match.board[P1_FRONT][0]?.hp).toBe(apexHp);
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
  });

  it("Lure hits a Support blocker instead of HQ when the Front is empty", () => {
    let match = must(blankMatch(), { type: "endDeployment" });
    const blocker = spawn(match, 17, 0, P1_SUPPORT, 1);
    const enemy = spawn(match, 4, 1, P2_FRONT, 1);
    const blockerHp = blocker.hp;
    const hqBefore = match.players[0].hqHp;
    injectCard(match, {
      instanceId: "lure-support",
      ownerUnitId: 13,
      templateId: "lure",
      name: "Lure",
      type: "maneuver",
      cost: 0,
      text: "An enemy in a lane triggers engagement. That enemy gets -1 ATK this turn.",
      effectId: "forceEngage",
      targets: ["enemy"],
    });
    match.players[0].commandPoints = 5;
    match = must(match, { type: "playCard", cardId: "lure-support", targets: { unitIds: [enemy.instanceId] } });
    expect(match.players[0].hqHp).toBe(hqBefore);
    expect(match.board[P1_SUPPORT][1]?.hp).toBeLessThan(blockerHp);
    // Heimdall's return fire (with AP) can delete Sarama; HQ must still be untouched.
    expect(match.board[P2_FRONT][1] == null || match.board[P2_FRONT][1]!.hp < enemy.hp).toBe(true);
  });

  it("Trap makes the Frontline blocker take the hit and return fire when the source is on Support", () => {
    let match = must(blankMatch(), { type: "endDeployment" });
    spawn(match, 3, 0, P1_SUPPORT, 2);
    spawn(match, 17, 0, P1_FRONT, 2);
    const enemy = spawn(match, 7, 1, P2_FRONT, 2);
    const hqBefore = match.players[0].hqHp;
    const trenchMax = getUnitDef(17).hp;
    injectCard(match, {
      instanceId: "trap-support-source",
      ownerUnitId: 3,
      templateId: "trap",
      name: "Trap",
      type: "special",
      cost: 1,
      text: "Enemy in Iron Bastion's lane engages.",
      effectId: "trap",
      targets: ["enemy"],
    });
    match.players[0].commandPoints = 5;
    match = must(match, {
      type: "playCard",
      cardId: "trap-support-source",
      targets: { unitIds: [enemy.instanceId] },
    });
    expect(match.players[0].hqHp).toBe(hqBefore);
    expect(match.board[P1_FRONT][2]?.hp).toBeLessThan(trenchMax);
    expect(match.board[P1_SUPPORT][2]?.hp).toBe(getUnitDef(3).hp);
    expect(match.board[P2_FRONT][2]?.hp).toBeLessThan(enemy.maxHp);
    expect(match.board[P1_FRONT][2]?.combatAtkBonus).toBe(8);
  });

  it("extra engagement missile does not skip a remaining blocker to HQ after the participant dies", () => {
    const state = blankMatch();
    const front = spawn(state, 22, 0, P1_FRONT, 1);
    front.hp = 1;
    front.armor = 0;
    spawn(state, 17, 0, P1_SUPPORT, 1);
    const enemy = spawn(state, 8, 1, P2_FRONT, 1);
    enemy.armor = 0;
    const hqBefore = state.players[0].hqHp;
    beginEngagement(state, {
      skipRelocation: true,
      resumePhase: "maneuver",
      extra: { lane: 1, participantIds: [front.instanceId, enemy.instanceId] },
      attacker: 1,
    });
    expect(state.board[P1_FRONT][1]).toBeNull();
    expect(state.players[0].hqHp).toBe(hqBefore);
    expect(state.board[P1_SUPPORT][1]?.hp).toBe(getUnitDef(17).hp);
    expect(enemy.missileTarget).toEqual({ col: P1_SUPPORT, row: 1 });
  });
});
