import { describe, expect, it } from "vitest";
import { UNITS, getUnitDef } from "../data/units";
import { emptyBoard, placeUnit } from "./board";
import { beginEngagement } from "./combat/engagement";
import { pickMissileTarget } from "./combat/helpers";
import { extraGunDamage, missileDamage, missilePowerOf } from "./combat";
import { applyAction, createMatch, must } from "./match";
import { cloneState } from "./state";
import { resolveAttack } from "./attack";
import { hasStatusOn, keywordsWithMods, statusesOf } from "./status";
import type { CardInstance, EffectId, MatchState, PlayerId, PlayTargets, UnitInstance } from "./types";
import { P1_FRONT, P1_SUPPORT, P2_FRONT, P2_SUPPORT } from "./types";

const RESOLVED_SPECIALS: EffectId[] = [
  "thunderStrike",
  "ambush",
  "trap",
  "intelAcquired",
  "fieldRepair",
  "concentratedFire",
  "tacticalStrike",
  "visionSupport",
  "stormCaller",
  "quickMobilization",
  "precisionStrike",
  "diversionToLane",
  "coordinate",
  "analyzeWeakness",
  "stickyBomb",
  "entrenchment",
  "firstAidKit",
  "diversionDown",
  "deadlyPresence",
  "diversionUp",
  "targetAcquired",
  "kamikazeBlast",
  "hqRepair",
  "deathFromAbove",
  "silentDeath",
  "hitAndRun",
];

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

describe("all special skills resolve", () => {
  it("covers every special effectId in the catalog", () => {
    const catalog = [
      ...new Set(UNITS.flatMap((unit) => unit.cards.filter((card) => card.type === "special").map((card) => card.effectId))),
    ].sort();
    expect(catalog).toEqual([...RESOLVED_SPECIALS].sort());
  });

  it("Zeus Thunder Strike extra-attacks and ignores armor on missiles", () => {
    const state = blankMatch();
    spawn(state, 1, 0, P1_FRONT, 1);
    spawn(state, 17, 1, P2_FRONT, 1);
    const next = play(state, 1, "thunder_strike", {});
    expect(hasStatusOn(next, next.board[P1_FRONT][1]!.instanceId, "missileIgnoreArmor")).toBe(true);
    expect(next.board[P2_FRONT][1]?.hp).toBe(17);
    expect(next.board[P1_FRONT][1]?.missileTarget).toEqual({ col: P2_FRONT, row: 1 });
  });

  it("Apex Ambush buffs on Frontline then engages only that matchup", () => {
    const state = blankMatch();
    spawn(state, 2, 0, P1_FRONT, 2);
    spawn(state, 4, 1, P2_FRONT, 2);
    spawn(state, 22, 1, P2_FRONT, 0);
    const next = play(state, 2, "ambush", {});
    const unit = next.board[P1_FRONT][2]!;
    expect(unit.tempArmor).toBe(2);
    expect(unit.tempAtk).toBe(2);
    expect(unit.tempAp).toBe(0);
    expect(next.phase).toBe("engagement");
    expect(unit.combatAtkBonus).toBe(4);
    expect(next.board[P2_FRONT][0]?.hp).toBe(getUnitDef(22).hp);
  });

  it("Iron Bastion Trap engages only the targeted enemy and locks their ATK", () => {
    const state = blankMatch();
    spawn(state, 3, 0, P1_FRONT, 2);
    const viper = spawn(state, 7, 1, P2_FRONT, 2);
    const next = play(state, 3, "trap", { unitIds: [viper.instanceId] });
    expect(next.phase).toBe("engagement");
    expect(next.board[P2_FRONT][2]?.hp).toBe(viper.maxHp - 5);
    expect(next.board[P1_FRONT][2]?.hp).toBe(getUnitDef(3).hp);
    expect(next.board[P1_FRONT][2]?.combatAtkBonus).toBe(5);
    expect(next.board[P2_FRONT][2]?.combatAtkBonus).toBe(0);
  });

  it("Trap treats the enemy as attacker so Bastion Retaliates and their Aggressive is locked", () => {
    const state = blankMatch();
    spawn(state, 3, 0, P1_FRONT, 2);
    const apex = spawn(state, 2, 1, P2_FRONT, 2);
    const next = play(state, 3, "trap", { unitIds: [apex.instanceId] });
    expect(next.board[P2_FRONT][2]?.isAttacker).toBe(true);
    expect(next.board[P2_FRONT][2]?.combatAtkBonus).toBe(0);
    expect(next.board[P1_FRONT][2]?.isAttacker).toBe(false);
    expect(next.board[P1_FRONT][2]?.combatAtkBonus).toBe(5);
    expect(next.board[P1_FRONT][2]?.hp).toBe(getUnitDef(3).hp - 1);
    expect(next.board[P2_FRONT][2]?.hp).toBe(apex.maxHp - 4);
  });

  it("Lure treats the enemy as attacker so the defending ally gets Retaliate", () => {
    const state = blankMatch();
    spawn(state, 13, 0, P1_FRONT, 1);
    const jackal = spawn(state, 4, 1, P2_FRONT, 1);
    const next = play(state, 13, "lure", { unitIds: [jackal.instanceId] });
    expect(next.board[P2_FRONT][1]?.isAttacker).toBe(true);
    expect(next.board[P1_FRONT][1]?.isAttacker).toBe(false);
    expect(next.board[P1_FRONT][1]?.combatAtkBonus).toBe(2);
    expect(next.board[P2_FRONT][1]?.hp).toBe(jackal.maxHp - 6);
    expect(next.board[P2_FRONT][1]?.tempAtk).toBe(-1);
  });

  it("Trap still applies Support Fire to the defending Bastion", () => {
    const state = blankMatch();
    spawn(state, 3, 0, P1_FRONT, 2);
    spawn(state, 21, 0, P1_FRONT, 3);
    const recon = spawn(state, 22, 1, P2_FRONT, 2);
    const next = play(state, 3, "trap", { unitIds: [recon.instanceId] });
    expect(next.board[P1_FRONT][2]?.combatAtkBonus).toBe(7);
    expect(next.board[P2_FRONT][2]).toBeNull();
  });

  it("Jackal Intel Acquired moves an ally twice including diagonal and gains 2 Supply", () => {
    const state = blankMatch();
    spawn(state, 4, 0, P1_FRONT, 2);
    const ally = spawn(state, 17, 0, P1_SUPPORT, 2);
    const cp = state.players[0].commandPoints;
    const next = play(state, 4, "intel_acquired", {
      unitIds: [ally.instanceId],
      cells: [
        { col: P1_FRONT, row: 1 },
        { col: P1_FRONT, row: 0 },
      ],
    });
    expect(next.board[P1_SUPPORT][2]).toBeNull();
    expect(next.board[P1_FRONT][0]?.instanceId).toBe(ally.instanceId);
    expect(next.players[0].commandPoints).toBe(cp + 2);
  });

  it("Nomad Repair heals an ally for 4", () => {
    const state = blankMatch();
    spawn(state, 5, 0, P1_SUPPORT, 2);
    const ally = spawn(state, 4, 0, P1_FRONT, 2);
    ally.hp = 5;
    const next = play(state, 5, "repair", { unitIds: [ally.instanceId] });
    expect(next.board[P1_FRONT][2]?.hp).toBe(9);
  });

  it("Mirage Rally gives an ally +3 ATK this turn", () => {
    const state = blankMatch();
    spawn(state, 6, 0, P1_FRONT, 2);
    const ally = spawn(state, 4, 0, P1_FRONT, 1);
    const next = play(state, 6, "rally", { unitIds: [ally.instanceId] });
    expect(next.board[P1_FRONT][1]?.tempAtk).toBe(3);
  });

  it("Hornet Tactical Strike gives an allied Missile unit +4 Missile", () => {
    const state = blankMatch();
    spawn(state, 8, 0, P1_FRONT, 1);
    const zeus = spawn(state, 1, 0, P1_FRONT, 2);
    const next = play(state, 8, "tactical_strike", { unitIds: [zeus.instanceId] });
    const buffed = next.board[P1_FRONT][2]!;
    expect(missilePowerOf(next, buffed)).toBe(9);
    expect(keywordsWithMods(next, buffed).find((k) => k.name === "missile")?.value).toBe(9);
  });

  it("Falcon Vision Support grants +2 AP to units that receive Support Fire", () => {
    const state = blankMatch();
    spawn(state, 9, 0, P1_SUPPORT, 0);
    spawn(state, 4, 0, P1_FRONT, 1);
    spawn(state, 3, 1, P2_FRONT, 1);
    const next = play(state, 9, "vision_support", {});
    expect(statusesOf(next, "supportFireGrantsAp", 0)).toHaveLength(1);
    beginEngagement(next, { skipRelocation: true });
    expect(next.board[P2_FRONT][1]?.hp).toBe(getUnitDef(3).hp - 2);
  });

  it("Manticore Storm Caller fires missiles from itself and another Missile ally", () => {
    const state = blankMatch();
    spawn(state, 10, 0, P1_SUPPORT, 2);
    const zeus = spawn(state, 1, 0, P1_FRONT, 2);
    spawn(state, 17, 1, P2_FRONT, 2);
    const next = play(state, 10, "storm_caller", { unitIds: [zeus.instanceId] });
    expect(next.board[P2_FRONT][2]?.hp).toBe(getUnitDef(17).hp);
    expect(next.board[P1_SUPPORT][2]?.missileTarget).toEqual({ col: P2_FRONT, row: 2 });
    expect(next.board[P1_FRONT][2]?.missileTarget).toEqual({ col: P2_FRONT, row: 2 });
  });

  it("Sentinel First Strike does an extra artillery attack", () => {
    const state = blankMatch();
    const sentinel = spawn(state, 11, 0, P1_SUPPORT, 2);
    const enemy = spawn(state, 4, 1, P2_FRONT, 2);
    const expected = enemy.hp - extraGunDamage(state, sentinel, enemy);
    const next = play(state, 11, "first_strike", {});
    expect(next.board[P2_FRONT][2]?.hp).toBe(expected);
  });

  it("Siege Howitzer Precision Strike attacks an enemy in another lane", () => {
    const state = blankMatch();
    const howitzer = spawn(state, 12, 0, P1_SUPPORT, 2);
    const enemy = spawn(state, 3, 1, P2_FRONT, 3);
    const expected = enemy.hp - extraGunDamage(state, howitzer, enemy);
    const next = play(state, 12, "precision_strike", { unitIds: [enemy.instanceId] });
    expect(next.board[P2_FRONT][3]?.hp).toBe(expected);
    expect(next.board[P2_FRONT][2]).toBeNull();
  });

  it("Aegis Diversion pulls an enemy into its lane, using the free Front/Support cell", () => {
    const state = blankMatch();
    spawn(state, 13, 0, P1_FRONT, 2);
    spawn(state, 17, 1, P2_FRONT, 2);
    const target = spawn(state, 4, 1, P2_FRONT, 0);
    const next = play(state, 13, "diversion", { unitIds: [target.instanceId] });
    expect(next.board[P2_FRONT][0]).toBeNull();
    const diverted = next.board[P2_SUPPORT][2];
    expect(diverted?.instanceId).toBe(target.instanceId);
    expect(diverted?.keywords).toEqual([]);
    expect(hasStatusOn(next, target.instanceId, "suppressKeywords")).toBe(true);
    expect(statusesOf(next, "suppressKeywords")[0]?.duration).toBe("endOfNextTurn");
  });

  it("Skadi Coordinate buffs then extra-attacks the nearest occupied lane when empty", () => {
    const state = blankMatch();
    const stalker = spawn(state, 14, 0, P1_FRONT, 1);
    const top = spawn(state, 4, 1, P2_FRONT, 0);
    top.armor = 0;
    spawn(state, 21, 1, P2_FRONT, 3);
    const next = play(state, 14, "coordinate", {});
    expect(hasStatusOn(next, stalker.instanceId, "redirectEmptyLane")).toBe(false);
    expect(next.board[P1_FRONT][1]?.tempAtk).toBe(1);
    expect(next.board[P1_FRONT][1]?.tempAp).toBe(1);
    // Extra attack: ATK 3 +1 buff = 4 into Armor 0 → nearest lane damaged; farther lane untouched.
    expect(next.board[P2_FRONT][0]?.hp).toBe(getUnitDef(4).hp - 4);
    expect(next.board[P2_FRONT][3]?.hp).toBe(getUnitDef(21).hp);
    expect(next.board[P1_FRONT][1]?.hp).toBe(stalker.maxHp);
    expect(next.phase).toBe("maneuver");
  });

  it("Skadi Coordinate cannot activate when an enemy shares the lane", () => {
    const state = blankMatch();
    spawn(state, 14, 0, P1_FRONT, 2);
    const foe = spawn(state, 4, 1, P2_FRONT, 2);
    foe.armor = 0;
    expect(() => play(state, 14, "coordinate", {})).toThrow(/empty lane/i);
    expect(state.board[P2_FRONT][2]?.hp).toBe(getUnitDef(4).hp);
    expect(state.board[P1_FRONT][2]?.tempAtk).toBe(0);
  });

  it("Ironclad Analyze Weakness reduces a unit's armor by 2 this turn", () => {
    const state = blankMatch();
    spawn(state, 15, 0, P1_FRONT, 1);
    const enemy = spawn(state, 3, 1, P2_FRONT, 3);
    const next = play(state, 15, "analyze_weakness", { unitIds: [enemy.instanceId] });
    expect(next.board[P2_FRONT][3]?.tempArmor).toBe(-2);
  });

  it("Exosuit Sticky Bomb grants +6 ATK then deals 4 to itself after attacking", () => {
    const state = blankMatch();
    const breacher = spawn(state, 16, 0, P1_FRONT, 2);
    spawn(state, 4, 1, P2_FRONT, 2);
    const next = play(state, 16, "sticky_bomb", {});
    const unit = next.board[P1_FRONT][2]!;
    expect(unit.tempAtk).toBe(6);
    expect(hasStatusOn(next, unit.instanceId, "afterAttackSelfDamage")).toBe(true);
    resolveAttack(next, unit.instanceId);
    expect(next.board[P1_FRONT][2]?.hp).toBe(breacher.maxHp - 4);
  });

  it("Trench Guard Entrenchment grants +3 Armor and +2 AP until next turn", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_SUPPORT, 2);
    const next = play(state, 17, "entrenchment", {});
    const unit = next.board[P1_SUPPORT][2]!;
    expect(unit.tempArmor).toBe(3);
    expect(unit.tempAp).toBe(2);
    expect(statusesOf(next, "modArmor").every((s) => s.duration === "endOfNextTurn")).toBe(true);
  });

  it("Medic First-aid Kit heals infantry 2 and grants all allies Repair 1 for 2 turns", () => {
    const state = blankMatch();
    const medic = spawn(state, 18, 0, P1_SUPPORT, 2);
    const trench = spawn(state, 17, 0, P1_FRONT, 2);
    const biker = spawn(state, 21, 0, P1_FRONT, 1);
    const tank = spawn(state, 4, 0, P1_FRONT, 3);
    medic.hp = 10;
    trench.hp = 10;
    biker.hp = 10;
    tank.hp = 10;
    const next = play(state, 18, "first_aid_kit", {});
    expect(next.board[P1_SUPPORT][2]?.hp).toBe(12);
    expect(next.board[P1_FRONT][2]?.hp).toBe(12);
    expect(next.board[P1_FRONT][1]?.hp).toBe(10); // Motorcycle: no instant heal
    expect(next.board[P1_FRONT][3]?.hp).toBe(10); // Tank: no instant heal
    const regens = statusesOf(next, "regen");
    expect(regens).toHaveLength(4);
    expect(regens.every((s) => s.magnitude === 1 && s.remainingPasses === 2)).toBe(true);
  });

  it("Medic First-aid Kit requires the Medic on the board", () => {
    const state = blankMatch();
    spawn(state, 17, 0, P1_FRONT, 2);
    state.phase = "maneuver";
    const card = give(state, 18, "first_aid_kit");
    const before = state.players[0].commandPoints;
    const result = applyAction(state, { type: "playCard", cardId: card.instanceId, targets: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/must be on the board/);
    expect(state.players[0].commandPoints).toBe(before);
    expect(state.players[0].hand.some((entry) => entry.instanceId === card.instanceId)).toBe(true);
    expect(state.board[P1_FRONT][2]?.hp).toBe(getUnitDef(17).hp);
    expect(statusesOf(state, "regen")).toHaveLength(0);
  });

  it("Phantom Speeder Diversion moves an enemy down one lane", () => {
    const state = blankMatch();
    spawn(state, 19, 0, P1_FRONT, 1);
    const enemy = spawn(state, 4, 1, P2_FRONT, 1);
    const next = play(state, 19, "diversion", {
      unitIds: [enemy.instanceId],
      cells: [{ col: P2_FRONT, row: 2 }],
    });
    expect(next.board[P2_FRONT][1]).toBeNull();
    expect(next.board[P2_FRONT][2]?.instanceId).toBe(enemy.instanceId);
    expect(next.board[P2_FRONT][2]?.tempAtk).toBe(-1);
    expect(statusesOf(next, "modAtk").every((s) => s.duration === "endOfNextTurn")).toBe(true);
  });

  it("Death Rider Deadly Presence grants +4 AP and +2 ATK this turn", () => {
    const state = blankMatch();
    spawn(state, 20, 0, P1_FRONT, 2);
    const next = play(state, 20, "deadly_presence", {});
    const unit = next.board[P1_FRONT][2]!;
    expect(unit.tempAp).toBe(4);
    expect(unit.tempAtk).toBe(2);
  });

  it("Phantom Speeder Diversion can move an enemy diagonally", () => {
    const state = blankMatch();
    spawn(state, 19, 0, P1_FRONT, 1);
    const enemy = spawn(state, 4, 1, P2_FRONT, 1);
    const next = play(state, 19, "diversion", {
      unitIds: [enemy.instanceId],
      cells: [{ col: P2_SUPPORT, row: 2 }],
    });
    expect(next.board[P2_FRONT][1]).toBeNull();
    expect(next.board[P2_SUPPORT][2]?.instanceId).toBe(enemy.instanceId);
    expect(next.board[P2_SUPPORT][2]?.tempAtk).toBe(-1);
  });

  it("Scout Biker Diversion moves an enemy up one lane", () => {
    const state = blankMatch();
    spawn(state, 21, 0, P1_FRONT, 2);
    const enemy = spawn(state, 4, 1, P2_FRONT, 2);
    const next = play(state, 21, "diversion", {
      unitIds: [enemy.instanceId],
      cells: [{ col: P2_FRONT, row: 1 }],
    });
    expect(next.board[P2_FRONT][2]).toBeNull();
    expect(next.board[P2_FRONT][1]?.instanceId).toBe(enemy.instanceId);
    expect(next.board[P2_FRONT][1]?.tempArmor).toBe(-1);
    expect(statusesOf(next, "modArmor").every((s) => s.duration === "endOfNextTurn")).toBe(true);
  });

  it("Recon Eye Target Acquired makes allied missiles prefer its lane", () => {
    const state = blankMatch();
    const recon = spawn(state, 22, 0, P1_FRONT, 0);
    spawn(state, 1, 0, P1_FRONT, 3);
    spawn(state, 17, 1, P2_FRONT, 0);
    spawn(state, 3, 1, P2_FRONT, 3);
    const next = play(state, 22, "target_acquired", {});
    const zeus = next.board[P1_FRONT][3]!;
    expect(pickMissileTarget(next, zeus)?.row).toBe(recon.row);
      expect(missileDamage(next, zeus, next.board[P2_FRONT][0]!)).toBe(6);
  });

  it("Kamikaze Hunter destroys itself to deal 8 armor-ignoring damage anywhere", () => {
    const state = blankMatch();
    spawn(state, 23, 0, P1_FRONT, 0);
    const far = spawn(state, 3, 1, P2_SUPPORT, 3);
    const next = play(state, 23, "kamikaze", { unitIds: [far.instanceId] });
    expect(next.board[P1_FRONT][0]).toBeNull();
    expect(next.board[P2_SUPPORT][3]?.hp).toBe(far.maxHp - 8);
  });

  it("Aegis Support Drone HQ Repair heals HQ for 7", () => {
    const state = blankMatch();
    spawn(state, 24, 0, P1_FRONT, 2);
    state.players[0].hqHp = 40;
    const next = play(state, 24, "hq_repair", {});
    expect(next.players[0].hqHp).toBe(47);
  });

  it("Tempest Death from Above gives all allied Missiles +1 this turn", () => {
    const state = blankMatch();
    spawn(state, 25, 0, P1_FRONT, 2);
    spawn(state, 1, 0, P1_FRONT, 1);
    const next = play(state, 25, "death_from_above", {});
    expect(missilePowerOf(next, next.board[P1_FRONT][1]!)).toBe(6);
    expect(missilePowerOf(next, next.board[P1_FRONT][2]!)).toBe(5);
  });

  it("Stealthray Silent Death cannot be targeted by effects next turn", () => {
    const state = blankMatch();
    const stingray = spawn(state, 26, 0, P1_FRONT, 2);
    const next = play(state, 26, "the_silent_death", {});
    expect(hasStatusOn(next, stingray.instanceId, "untargetable")).toBe(true);
    expect(statusesOf(next, "untargetable")[0]?.duration).toBe("endOfNextTurn");
  });

  it("Komet Hit & Run extra-attacks then returns to reserve", () => {
    const state = blankMatch();
    const komet = spawn(state, 27, 0, P1_FRONT, 2);
    const enemy = spawn(state, 17, 1, P2_FRONT, 2);
    const expected = enemy.hp - extraGunDamage(state, komet, enemy);
    const next = play(state, 27, "hit_and_run", {});
    expect(next.board[P1_FRONT][2]).toBeNull();
    expect(next.players[0].undeployed).toContain(27);
    expect(next.board[P2_FRONT][2]?.hp).toBe(expected);
  });
});

describe("Heatseeking", () => {
  it("retargets missile locks on cells with no enemy and leaves valid or null locks", () => {
    const state = blankMatch();
    const wasted = spawn(state, 10, 0, P1_SUPPORT, 1);
    const valid = spawn(state, 8, 0, P1_FRONT, 2);
    const idle = spawn(state, 1, 0, P1_FRONT, 0);
    const enemy = spawn(state, 4, 1, P2_FRONT, 2);
    wasted.missileTarget = { col: P2_FRONT, row: 0 };
    valid.missileTarget = { col: enemy.col, row: enemy.row };
    idle.missileTarget = null;
    const next = play(state, 10, "heatseeking", { cells: [{ col: enemy.col, row: enemy.row }] });
    expect(next.board[P1_SUPPORT][1]?.missileTarget).toEqual({ col: enemy.col, row: enemy.row });
    expect(next.board[P1_FRONT][2]?.missileTarget).toEqual({ col: enemy.col, row: enemy.row });
    expect(next.board[P1_FRONT][0]?.missileTarget ?? null).toBeNull();
  });

  it("refuses to play when no missile is locked on an empty cell", () => {
    const state = blankMatch();
    const shooter = spawn(state, 10, 0, P1_SUPPORT, 1);
    const enemy = spawn(state, 4, 1, P2_FRONT, 1);
    shooter.missileTarget = { col: enemy.col, row: enemy.row };
    expect(() => play(state, 10, "heatseeking", { cells: [{ col: enemy.col, row: enemy.row }] })).toThrow(
      /no missile is locked/i,
    );
  });
});
