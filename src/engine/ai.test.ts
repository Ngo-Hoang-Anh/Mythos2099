import { describe, expect, it } from "vitest";
import { PREMADE_ARMIES } from "../data/premadeArmies";
import { UNITS } from "../data/units";
import { computeMaxDeploymentCost, laneTradeValue, losingTrades, pickAiAction, runAiTurn } from "./ai";
import { frontCol } from "./board";
import { createMatch, must } from "./match";
import { createSandboxMatch, spawnUnit } from "./sandbox";

describe("local AI", () => {
  it("can finish a turn without crashing", () => {
    let match = createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.tank_robot.units, 21);
    match = runAiTurn(match);
    if (match.phase === "engagement") match = must(match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(1);
    expect(match.phase === "deployment" || match.phase === "gameover").toBe(true);
  });

  it("plays a short hotseat-style match vs AI", () => {
    let match = createMatch(PREMADE_ARMIES.jet_infantry.units, PREMADE_ARMIES.retaliate.units, 42);
    for (let i = 0; i < 16 && match.winner === null; i++) {
      if (match.phase === "deployment") match = must(match, { type: "endDeployment" });
      if (match.winner) break;
      if (match.phase === "maneuver") match = must(match, { type: "endManeuver" });
      if (match.phase === "engagement") match = must(match, { type: "endEngagement" });
    }
    expect(match.turn).toBeGreaterThan(1);
    expect(["deployment", "maneuver", "gameover"]).toContain(match.phase);
  });

  it("detects a losing lane trade", () => {
    const match = createSandboxMatch();
    const ally = spawnUnit(match, { defId: PREMADE_ARMIES.aggro.units[0]!, owner: 0, col: frontCol(0), row: 2 });
    ally.hp = 3;
    ally.atk = 2;
    ally.armor = 0;
    const enemy = spawnUnit(match, {
      defId: PREMADE_ARMIES.tank_robot.units[0]!,
      owner: 1,
      col: frontCol(1),
      row: 2,
    });
    enemy.hp = 12;
    enemy.atk = 8;
    enemy.armor = 4;
    const trades = losingTrades(match, 0);
    expect(trades.some((t) => t.losing && t.row === 2)).toBe(true);
  });

  it("reserves supply when hand has move cards during a losing trade", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "deployment";
    match.players[0].commandPoints = 4;
    const ally = spawnUnit(match, { defId: PREMADE_ARMIES.aggro.units[0]!, owner: 0, col: frontCol(0), row: 2 });
    ally.hp = 2;
    ally.atk = 1;
    ally.armor = 0;
    const enemy = spawnUnit(match, {
      defId: PREMADE_ARMIES.tank_robot.units[0]!,
      owner: 1,
      col: frontCol(1),
      row: 2,
    });
    enemy.hp = 10;
    enemy.atk = 9;
    enemy.armor = 3;
    match.players[0].hand = [
      {
        instanceId: "m1",
        ownerUnitId: ally.defId,
        templateId: "retreat-test",
        name: "Fall Back",
        type: "move",
        cost: 2,
        text: "Retreat",
        effectId: "retreat",
        targets: ["friendly"],
      },
    ];
    const max = computeMaxDeploymentCost(match);
    expect(max).toBeLessThanOrEqual(2);
  });

  it("recycles duplicate cards in maneuver", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "maneuver";
    match.players[0].commandPoints = 4;
    match.players[0].deck = [
      {
        instanceId: "deck1",
        ownerUnitId: 1,
        templateId: "x",
        name: "Deck",
        type: "maneuver",
        cost: 0,
        text: "",
        effectId: "supply",
        targets: [],
      },
    ];
    match.players[0].hand = [
      {
        instanceId: "a",
        ownerUnitId: 1,
        templateId: "dup",
        name: "Dup A",
        type: "special",
        cost: 1,
        text: "",
        effectId: "fortify",
        targets: ["friendly"],
      },
      {
        instanceId: "b",
        ownerUnitId: 1,
        templateId: "dup",
        name: "Dup B",
        type: "special",
        cost: 1,
        text: "",
        effectId: "fortify",
        targets: ["friendly"],
      },
    ];
    const action = pickAiAction(match);
    expect(action).toEqual({ type: "discardRedraw", cardId: "b" });
  });

  it("does not dump leftover supply on low-value cards", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "maneuver";
    match.players[0].commandPoints = 4;
    // Isolated ally, no enemy — fortify / supply should not be auto-played.
    spawnUnit(match, { defId: PREMADE_ARMIES.aggro.units[0]!, owner: 0, col: frontCol(0), row: 2 });
    match.players[0].hand = [
      {
        instanceId: "s1",
        ownerUnitId: 1,
        templateId: "supply-card",
        name: "Resupply",
        type: "maneuver",
        cost: 1,
        text: "+2 Supply",
        effectId: "supply",
        targets: [],
      },
      {
        instanceId: "f1",
        ownerUnitId: PREMADE_ARMIES.aggro.units[0]!,
        templateId: "fortify-card",
        name: "Fortify",
        type: "special",
        cost: 1,
        text: "+3 Armor",
        effectId: "fortify",
        targets: ["friendly"],
      },
    ];
    const action = pickAiAction(match);
    expect(action).toEqual({ type: "endManeuver" });
  });

  it("deploys at most one unit per turn", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "deployment";
    match.players[0].commandPoints = 10;
    match.players[0].deploysThisTurn = 1;
    match.players[0].undeployed = [PREMADE_ARMIES.aggro.units[0]!];
    const action = pickAiAction(match);
    expect(action).toEqual({ type: "endDeployment" });
  });

  it("prefers deploying onto a wounded enemy lane", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "deployment";
    match.players[0].commandPoints = 5;
    const healthy = spawnUnit(match, {
      defId: PREMADE_ARMIES.tank_robot.units[0]!,
      owner: 1,
      col: frontCol(1),
      row: 0,
    });
    healthy.hp = healthy.maxHp;
    healthy.armor = 2;
    const wounded = spawnUnit(match, {
      defId: PREMADE_ARMIES.tank_robot.units[0]!,
      owner: 1,
      col: frontCol(1),
      row: 3,
    });
    wounded.hp = 2;
    wounded.maxHp = 10;
    wounded.armor = 2;

    const melee = UNITS.find((u) => u.cost <= 5 && !u.keywords.some((k) => k.name === "artillery" || k.name === "jetPlane" || k.name === "missile"));
    expect(melee).toBeTruthy();
    match.players[0].undeployed = [melee!.id];

    const action = pickAiAction(match);
    expect(action?.type).toBe("deploy");
    if (action?.type === "deploy") {
      expect(action.row).toBe(3);
    }
  });

  it("does not move Cover or Flank units with move cards", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "maneuver";
    match.players[0].commandPoints = 4;
    match.log.push({ text: "P1 Maneuver" });

    const coverUnit = UNITS.find((u) => u.keywords.some((k) => k.name === "cover") && u.cost <= 5);
    expect(coverUnit).toBeTruthy();
    const ally = spawnUnit(match, { defId: coverUnit!.id, owner: 0, col: frontCol(0), row: 2 });
    ally.hp = 2;
    ally.atk = 1;
    ally.armor = 0;
    const enemy = spawnUnit(match, {
      defId: PREMADE_ARMIES.tank_robot.units[0]!,
      owner: 1,
      col: frontCol(1),
      row: 2,
    });
    enemy.hp = 12;
    enemy.atk = 9;
    enemy.armor = 3;

    match.players[0].hand = [
      {
        instanceId: "m1",
        ownerUnitId: ally.defId,
        templateId: "retreat-test",
        name: "Fall Back",
        type: "move",
        cost: 1,
        text: "Retreat",
        effectId: "retreat",
        targets: ["friendly"],
      },
    ];
    const action = pickAiAction(match);
    expect(action).toEqual({ type: "endManeuver" });
  });

  it("plays at most one non-kill card per maneuver", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "maneuver";
    match.players[0].commandPoints = 6;
    match.log.push({ text: "P1 Maneuver" });
    const ally = spawnUnit(match, { defId: PREMADE_ARMIES.aggro.units[0]!, owner: 0, col: frontCol(0), row: 2 });
    const enemy = spawnUnit(match, {
      defId: PREMADE_ARMIES.tank_robot.units[0]!,
      owner: 1,
      col: frontCol(1),
      row: 2,
    });
    enemy.hp = 2;
    enemy.maxHp = 10;
    ally.atk = 4;

    match.players[0].hand = [
      {
        instanceId: "f1",
        ownerUnitId: ally.defId,
        templateId: "fortify-card",
        name: "Fortify",
        type: "special",
        cost: 1,
        text: "+3 Armor",
        effectId: "fortify",
        targets: ["friendly"],
      },
    ];
    match.players[0].discard = [
      {
        instanceId: "played-qe",
        ownerUnitId: ally.defId,
        templateId: "qe-card",
        name: "Quick Engage",
        type: "special",
        cost: 1,
        text: "Engage",
        effectId: "quickEngage",
        targets: ["friendly"],
      },
    ];
    match.log.push({ text: "Played Quick Engage", icon: "card" });

    const action = pickAiAction(match);
    expect(action).toEqual({ type: "endManeuver" });
  });

  it("prefers deploying high AP opposite high armor", () => {
    const match = createSandboxMatch();
    match.currentPlayer = 0;
    match.phase = "deployment";
    match.players[0].commandPoints = 5;
    // Soft enemy in lane 0, armored enemy in lane 3.
    const soft = spawnUnit(match, { defId: PREMADE_ARMIES.aggro.units[0]!, owner: 1, col: frontCol(1), row: 0 });
    soft.armor = 1;
    soft.ap = 0;
    const hard = spawnUnit(match, { defId: PREMADE_ARMIES.tank_robot.units[0]!, owner: 1, col: frontCol(1), row: 3 });
    hard.armor = 6;
    hard.ap = 0;

    const pierce = UNITS.find((u) => u.ap >= 3 && u.cost <= 5);
    expect(pierce).toBeTruthy();
    match.players[0].undeployed = [pierce!.id];

    const action = pickAiAction(match);
    expect(action?.type).toBe("deploy");
    if (action?.type === "deploy") {
      expect(action.row).toBe(3);
    }
  });

  it("scores empty-lane HQ pressure as +1, not a better trade than a real exchange", () => {
    const match = createSandboxMatch();
    const ally = spawnUnit(match, { defId: PREMADE_ARMIES.aggro.units[0]!, owner: 0, col: frontCol(0), row: 2 });
    ally.atk = 8;
    ally.armor = 2;
    const enemy = spawnUnit(match, { defId: PREMADE_ARMIES.tank_robot.units[0]!, owner: 1, col: frontCol(1), row: 2 });
    enemy.hp = 10;
    enemy.armor = 2;
    enemy.atk = 2;
    const contested = laneTradeValue(match, 0, ally, 2, frontCol(0));
    const emptyHq = laneTradeValue(match, 0, ally, 0, frontCol(0));
    expect(emptyHq).toBe(1);
    expect(contested).toBeGreaterThan(emptyHq);
  });
});
