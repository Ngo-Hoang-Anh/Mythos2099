import { describe, expect, it } from "vitest";
import { getUnitDef } from "../../data/units";
import { emptyBoard, placeUnit } from "../board";
import { missileDamage } from "../combat";
import { blankDefensePools, parseKeywords, syncDefensePools } from "../keywords";
import { relocateUnit } from "../fx";
import { createMatch, must } from "../match";
import { cloneState } from "../state";
import { addStatus, hasStatusOn, rebuildTempBuffs, tickStatuses } from "../status";
import type { MatchState, PlayerId, UnitInstance } from "../types";
import { P1_FRONT, P1_SUPPORT, P2_FRONT } from "../types";
import { runDamagePhase } from "./damage";
import { beginEngagement } from "./engagement";
import type { CombatCtx } from "./helpers";
import { strikeAtk } from "./helpers";
import {
  afterGunHitEffects,
  resolveGunHit,
  runOwnerEndOfTurn,
  runShieldRegen,
} from "./keywordEffects";
import { resolveMissileShot } from "./missile";

function ctx(attacker: PlayerId = 0): CombatCtx {
  return { attacker, defender: attacker === 0 ? 1 : 0, steps: [] };
}

function blankMatch(): MatchState {
  const match = cloneState(
    createMatch([17, 3, 4, 1, 18, 21, 23, 5], [12, 10, 11, 1, 17, 3, 18, 24], 1),
  );
  match.board = emptyBoard();
  match.statuses = [];
  return match;
}

function spawn(
  state: MatchState,
  defId: number,
  owner: PlayerId,
  col: number,
  row: number,
  keywords?: string,
): UnitInstance {
  const def = getUnitDef(defId);
  const unit: UnitInstance = {
    instanceId: `t_${defId}_${col}_${row}_${owner}`,
    defId: def.id,
    name: def.name,
    class: def.class,
    owner,
    hp: 30,
    maxHp: 30,
    atk: 8,
    armor: 2,
    ap: 0,
    cost: def.cost,
    col,
    row,
    keywords: keywords ? parseKeywords(keywords) : [],
    tempAtk: 0,
    tempArmor: 0,
    tempAp: 0,
    tempRetaliate: 0,
    rested: false,
    combatAtkBonus: 0,
    isAttacker: false,
    ...blankDefensePools(),
  };
  syncDefensePools(unit);
  placeUnit(state.board, unit);
  return unit;
}

function passEngagement(state: MatchState): MatchState {
  state.phase = "engagement";
  return must(state, { type: "endEngagement" });
}

describe("new keyword parser", () => {
  it("parses expansion keywords", () => {
    expect(parseKeywords("Camouflage; Smoke Screen; Scout")).toEqual([
      { name: "camouflage", value: 1 },
      { name: "smokeScreen", value: 1 },
      { name: "scout", value: 1 },
    ]);
    expect(parseKeywords("Shield 4, Barrier 3, Shock 5")).toEqual([
      { name: "shield", value: 4 },
      { name: "barrier", value: 3 },
      { name: "shock", value: 5 },
    ]);
    expect(parseKeywords("Veteran 2; First Strike 5; Fire 3; Corrosion 2")).toEqual([
      { name: "veteran", value: 2 },
      { name: "firstStrike", value: 5 },
      { name: "fire", value: 3 },
      { name: "corrosion", value: 2 },
    ]);
    expect(parseKeywords("Radar, Hull Down, Sloped Armor, Suppression")).toEqual([
      { name: "radar", value: 1 },
      { name: "hulldown", value: 1 },
      { name: "slopedArmor", value: 1 },
      { name: "suppression", value: 1 },
    ]);
  });
});

describe("Camouflage", () => {
  it("blocks missile damage unless the attacker has Frontline Scout", () => {
    const state = blankMatch();
    const shooter = spawn(state, 1, 0, P1_SUPPORT, 1, "Missile 8");
    const target = spawn(state, 3, 1, P2_FRONT, 1, "Camouflage");
    shooter.missileTarget = { col: target.col, row: target.row };
    expect(missileDamage(state, shooter, target)).toBe(0);
    resolveMissileShot(state, shooter);
    expect(target.hp).toBe(30);

    spawn(state, 4, 0, P1_FRONT, 0, "Scout");
    expect(missileDamage(state, shooter, target)).toBeGreaterThan(0);
  });
});

describe("Smoke Screen", () => {
  it("activates after taking gun damage on the enemy turn and dodges later hits", () => {
    const state = blankMatch();
    state.currentPlayer = 0;
    const attacker = spawn(state, 1, 0, P1_FRONT, 1);
    attacker.atk = 10;
    const defender = spawn(state, 3, 1, P2_FRONT, 1, "Smoke Screen");
    defender.armor = 0;
    const hpBefore = defender.hp;
    runDamagePhase(state, ctx(0));
    expect(defender.hp).toBeLessThan(hpBefore);
    expect(hasStatusOn(state, defender.instanceId, "smokeDodge")).toBe(true);

    const attacker2 = spawn(state, 4, 0, P1_FRONT, 2);
    attacker2.atk = 10;
    const other = spawn(state, 5, 1, P2_FRONT, 2, "Smoke Screen");
    // Move smoke dodge scenario: second shot on same defender in a fresh phase
    const state2 = blankMatch();
    state2.currentPlayer = 0;
    const a = spawn(state2, 1, 0, P1_FRONT, 1);
    a.atk = 6;
    const d = spawn(state2, 3, 1, P2_FRONT, 1, "Smoke Screen");
    d.armor = 0;
    addStatus(state2, {
      kind: "smokeDodge",
      sourceId: d.instanceId,
      owner: 1,
      targetId: d.instanceId,
      duration: "endOfTurn",
    });
    const before = d.hp;
    runDamagePhase(state2, ctx(0));
    expect(d.hp).toBe(before);
  });

  it("Shock ignores smoke dodge and does not trigger smoke", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1, "Shock 4");
    a.atk = 8;
    const d = spawn(state, 3, 1, P2_FRONT, 1, "Smoke Screen");
    d.armor = 0;
    d.shield = 5;
    d.shieldMax = 5;
    addStatus(state, {
      kind: "smokeDodge",
      sourceId: d.instanceId,
      owner: 1,
      targetId: d.instanceId,
      duration: "endOfTurn",
    });
    const before = d.hp;
    runDamagePhase(state, ctx(0));
    expect(d.hp).toBeLessThan(before);
    // Still only the pre-existing dodge status — Shock must not add a new trigger path oddly;
    // defender already had smokeDodge. Fresh trigger check:
    const state2 = blankMatch();
    const a2 = spawn(state2, 1, 0, P1_FRONT, 1, "Shock 4");
    a2.atk = 8;
    const d2 = spawn(state2, 3, 1, P2_FRONT, 1, "Smoke Screen");
    d2.armor = 0;
    runDamagePhase(state2, ctx(0));
    expect(hasStatusOn(state2, d2.instanceId, "smokeDodge")).toBe(false);
  });
});

describe("Suppression + Scout", () => {
  it("marks an enemy cell at end of turn and applies −1 ATK / −2 AP", () => {
    const state = blankMatch();
    state.currentPlayer = 0;
    spawn(state, 1, 0, P1_FRONT, 1, "Suppression");
    const enemy = spawn(state, 3, 1, P2_FRONT, 2);
    enemy.atk = 10;
    enemy.ap = 4;
    // Force RNG to a deterministic pick
    state.rngState = 1;
    runOwnerEndOfTurn(state, 0);
    const mark = state.statuses.find((s) => s.kind === "suppressionMark");
    expect(mark).toBeTruthy();
    expect(mark!.col).toBe(enemy.col);
    expect(mark!.lane).toBe(enemy.row);
    expect(mark!.remainingPasses).toBe(4);

    const atk = strikeAtk(state, enemy, true);
    expect(atk).toBe(9);
    // AP penalty is applied in volleyAp; verify suppressionPenalty path via strike + rebuild
    rebuildTempBuffs(state);

    spawn(state, 4, 1, P2_FRONT, 0, "Scout");
    expect(strikeAtk(state, enemy, true)).toBe(10);
  });

  it("prefers unmarked enemy cells", () => {
    const state = blankMatch();
    spawn(state, 1, 0, P1_FRONT, 0, "Suppression");
    spawn(state, 1, 0, P1_FRONT, 1, "Suppression");
    const e0 = spawn(state, 3, 1, P2_FRONT, 0);
    const e1 = spawn(state, 3, 1, P2_FRONT, 1);
    addStatus(state, {
      kind: "suppressionMark",
      sourceId: "pre",
      owner: 0,
      col: e0.col,
      lane: e0.row,
      duration: "endOfNextTurn",
      remainingPasses: 4,
    });
    state.rngState = 42;
    runOwnerEndOfTurn(state, 0);
    const marks = state.statuses.filter((s) => s.kind === "suppressionMark");
    expect(marks.some((m) => m.lane === e1.row)).toBe(true);
  });

  it("stacks Suppression when every enemy cell is already marked", () => {
    const state = blankMatch();
    spawn(state, 1, 0, P1_FRONT, 0, "Suppression");
    spawn(state, 1, 0, P1_FRONT, 1, "Suppression");
    const enemy = spawn(state, 3, 1, P2_FRONT, 1);
    enemy.atk = 10;
    enemy.ap = 6;
    state.rngState = 1;
    runOwnerEndOfTurn(state, 0);
    const marks = state.statuses.filter((s) => s.kind === "suppressionMark");
    expect(marks).toHaveLength(2);
    expect(marks.every((m) => m.lane === enemy.row && m.col === enemy.col)).toBe(true);
    expect(strikeAtk(state, enemy, true)).toBe(8);
  });
});

describe("Shield + Barrier + Shock + Sloped Armor + Corrosion", () => {
  it("Shield absorbs strike power before armor", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1);
    a.atk = 6;
    const d = spawn(state, 3, 1, P2_FRONT, 1, "Shield 4");
    d.armor = 10;
    const hit = resolveGunHit(state, a, d, { atk: 6, armorPiercing: 0 });
    expect(d.shield).toBe(0);
    expect(hit.damage).toBe(0); // 6 absorbed by shield, nothing left for armor math
    expect(hit.blockedByDefense).toBe(true);
  });

  it("Barrier reduces the next frontal hit then depletes", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1);
    a.atk = 10;
    const d = spawn(state, 3, 1, P2_FRONT, 1, "Barrier 3");
    d.armor = 0;
    const hit = resolveGunHit(state, a, d, { atk: 10, armorPiercing: 0 });
    expect(hit.damage).toBe(7);
    expect(d.barrier).toBe(0);
  });

  it("Barrier does not block Support-line shots", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_SUPPORT, 1, "Artillery");
    a.atk = 10;
    const d = spawn(state, 3, 1, P2_FRONT, 1, "Barrier 3");
    d.armor = 0;
    const hit = resolveGunHit(state, a, d, { atk: 10, armorPiercing: 0 });
    expect(hit.damage).toBe(10);
    expect(d.barrier).toBe(3);
  });

  it("Shock depletes shield/barrier only and does not add flat gun damage", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1, "Shock 4");
    const d = spawn(state, 3, 1, P2_FRONT, 1, "Shield 6; Barrier 3");
    d.armor = 0;
    const hit = resolveGunHit(state, a, d, { atk: 5, armorPiercing: 0 });
    expect(d.barrier).toBe(0); // 3 barrier - 4 shock
    expect(d.shield).toBeLessThan(6);
    expect(hit.dodged).toBe(false);

    const bare = blankMatch();
    const shooter = spawn(bare, 1, 0, P1_FRONT, 1, "Shock 4");
    const target = spawn(bare, 3, 1, P2_FRONT, 1);
    target.armor = 0;
    target.shield = 0;
    target.barrier = 0;
    const shocked = resolveGunHit(bare, shooter, target, { atk: 2, armorPiercing: 0 });
    expect(shocked.damage).toBe(2); // no flat Shock bonus vs unshielded
  });

  it("Sloped Armor ignores gun damage of 3 or less", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1);
    const d = spawn(state, 3, 1, P2_FRONT, 1, "Sloped Armor");
    d.armor = 0;
    const hit = resolveGunHit(state, a, d, { atk: 3, armorPiercing: 0 });
    expect(hit.damage).toBe(0);
    const hit2 = resolveGunHit(state, a, d, { atk: 4, armorPiercing: 0 });
    expect(hit2.damage).toBe(4);
  });

  it("Corrosion always strips Armor once on a connecting hit (even through Shield)", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1, "Corrosion 2");
    a.atk = 10;
    const d = spawn(state, 3, 1, P2_FRONT, 1);
    d.armor = 5;
    d.hp = 30;
    const hit = resolveGunHit(state, a, d, { atk: 10, armorPiercing: 0 });
    expect(d.armor).toBe(3);
    // Same-hit math uses reduced armor: 10 vs Armor 3.
    expect(hit.damage).toBe(7);

    const a2 = spawn(state, 4, 0, P1_FRONT, 2, "Corrosion 2");
    a2.atk = 10;
    const d2 = spawn(state, 5, 1, P2_FRONT, 2, "Shield 20");
    d2.armor = 5;
    resolveGunHit(state, a2, d2, { atk: 10, armorPiercing: 0 });
    expect(d2.armor).toBe(3);
  });

  it("Shield regenerates half when undamaged; Barrier recharges end of turn", () => {
    const state = blankMatch();
    const unit = spawn(state, 1, 0, P1_FRONT, 1, "Shield 4; Barrier 3");
    unit.shield = 0;
    unit.barrier = 0;
    unit.tookDamageSinceRegen = false;
    runShieldRegen(state, 0);
    expect(unit.shield).toBe(2); // ceil(4/2)
    unit.barrier = 0;
    runOwnerEndOfTurn(state, 0);
    expect(unit.barrier).toBe(3);

    unit.shield = 0;
    unit.tookDamageSinceRegen = true;
    runShieldRegen(state, 0);
    expect(unit.shield).toBe(0);
    expect(unit.tookDamageSinceRegen).toBe(false);
  });
});

describe("Veteran + First Strike + Fire + Radar", () => {
  it("Veteran permanently raises ATK and AP after attacking", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1, "Veteran 2");
    a.atk = 5;
    a.ap = 1;
    const d = spawn(state, 3, 1, P2_FRONT, 1);
    d.armor = 0;
    runDamagePhase(state, ctx(0));
    expect(a.atk).toBe(7);
    expect(a.ap).toBe(3);
  });

  it("First Strike adds ATK then is removed after attacking or being attacked", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1, "First Strike 5");
    a.atk = 4;
    expect(strikeAtk(state, a, true)).toBe(9);
    const d = spawn(state, 3, 1, P2_FRONT, 1);
    d.armor = 0;
    runDamagePhase(state, ctx(0));
    expect(a.keywords.some((k) => k.name === "firstStrike")).toBe(false);

    const state2 = blankMatch();
    const a2 = spawn(state2, 1, 0, P1_FRONT, 1);
    a2.atk = 8;
    const d2 = spawn(state2, 3, 1, P2_FRONT, 1, "First Strike 4");
    d2.armor = 0;
    runDamagePhase(state2, ctx(0));
    expect(d2.keywords.some((k) => k.name === "firstStrike")).toBe(false);
  });

  it("Fire applies a single highest DoT that ticks for 3 passes and can refresh", () => {
    const state = blankMatch();
    const a = spawn(state, 1, 0, P1_FRONT, 1, "Fire 2");
    a.atk = 8;
    const d = spawn(state, 3, 1, P2_FRONT, 1);
    d.armor = 0;
    d.hp = 20;
    runDamagePhase(state, ctx(0));
    const fire = state.statuses.find((s) => s.kind === "fireDot" && s.targetId === d.instanceId);
    expect(fire?.magnitude).toBe(2);
    expect(fire?.remainingPasses).toBe(3);

    // Lower fire refreshes duration, keeps higher magnitude
    const a2 = spawn(state, 4, 0, P1_FRONT, 2, "Fire 1");
    a2.atk = 8;
    // target already damaged; fire again via afterGunHitEffects path
    const hit = { damage: 1, blockedByDefense: false, dodged: false };
    afterGunHitEffects(state, 0, a2, d, "attack", hit);
    const fire2 = state.statuses.find((s) => s.kind === "fireDot" && s.targetId === d.instanceId)!;
    expect(fire2.magnitude).toBe(2);
    expect(fire2.remainingPasses).toBe(3);

    const hp = d.hp;
    tickStatuses(state);
    expect(d.hp).toBe(hp - 2);
    expect(fire2.remainingPasses).toBe(2);
  });

  it("Radar re-aims allied missiles when the radar unit attacks", () => {
    const state = blankMatch();
    const radar = spawn(state, 1, 0, P1_FRONT, 1, "Radar");
    radar.atk = 8;
    const missile = spawn(state, 10, 0, P1_SUPPORT, 2, "Missile 5");
    missile.missileTarget = { col: P2_FRONT, row: 0 }; // empty / stale
    const enemy = spawn(state, 3, 1, P2_FRONT, 1);
    enemy.armor = 0;
    runDamagePhase(state, ctx(0));
    expect(missile.missileTarget).toEqual({ col: enemy.col, row: enemy.row });
  });
});

describe("Hulldown", () => {
  it("digs in at end of turn for −3 gun damage, clears on move, ignores missiles", () => {
    const state = blankMatch();
    state.currentPlayer = 0;
    const unit = spawn(state, 1, 0, P1_FRONT, 1, "Hulldown");
    unit.armor = 0;
    expect(unit.tempArmor).toBe(0);
    runOwnerEndOfTurn(state, 0);
    rebuildTempBuffs(state);
    expect(unit.tempArmor).toBe(0);
    expect(state.statuses.some((s) => s.kind === "hulldownArmor")).toBe(true);

    const shooter = spawn(state, 3, 1, P2_FRONT, 1);
    shooter.atk = 5;
    const gun = resolveGunHit(state, shooter, unit, { atk: 5, armorPiercing: 4 });
    expect(gun.damage).toBe(2);

    const missile = spawn(state, 10, 1, P2_FRONT, 2, "Missile 5");
    expect(missileDamage(state, missile, unit)).toBe(5);

    relocateUnit(state, unit, P1_SUPPORT, 1);
    expect(state.statuses.some((s) => s.kind === "hulldownArmor")).toBe(false);
    const afterMove = resolveGunHit(state, shooter, unit, { atk: 5, armorPiercing: 4 });
    expect(afterMove.damage).toBe(5);
  });
});

describe("full engagement smoke + camouflage integration", () => {
  it("runs beginEngagement without throwing with mixed new keywords", () => {
    const state = blankMatch();
    spawn(state, 1, 0, P1_FRONT, 1, "Veteran 1; Shock 4; Radar");
    spawn(state, 10, 0, P1_SUPPORT, 1, "Missile 5");
    spawn(state, 3, 1, P2_FRONT, 1, "Camouflage; Smoke Screen; Shield 3; Barrier 2; Sloped Armor");
    beginEngagement(state, { skipRelocation: true });
    expect(state.combatPlayback).toBeTruthy();
  });
});

describe("end-of-turn pipeline via endEngagement", () => {
  it("throws Suppression marks when the turn passes", () => {
    let state = blankMatch();
    state.phase = "engagement";
    state.currentPlayer = 0;
    spawn(state, 1, 0, P1_FRONT, 1, "Suppression");
    spawn(state, 3, 1, P2_FRONT, 2);
    state.rngState = 7;
    state = passEngagement(state);
    expect(state.statuses.some((s) => s.kind === "suppressionMark")).toBe(true);
    // After tickStatuses in passTurn, remainingPasses should be 3 (2 opponent turns left)
    const mark = state.statuses.find((s) => s.kind === "suppressionMark")!;
    expect(mark.remainingPasses).toBe(3);
  });
});
