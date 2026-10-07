import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2, PREMADE_ARMIES } from "../data/premadeArmies";
import { getUnitDef } from "../data/units";
import { applyHqDamage, healHq } from "./attack";
import { countUnits, placeUnit } from "./board";
import { resolveDestroyedUnits } from "./combat/cleanup";
import { cloneState, drawCards, flattenLog } from "./state";
import { createMatch, must } from "./match";
import { INITIATIVE_CARD_NAME } from "../data/initiative";
import { BASE_SUPPLY, DRAW_PER_TURN, HAND_LIMIT, HQ_BREAKPOINTS, HQ_MAX_HP, INITIATIVE_TEMPLATE_ID, OPENING_HAND, nextHqBreakpoint, type CardInstance, type MatchState } from "./types";

function fakeForward(id: string): CardInstance {
  return {
    instanceId: id,
    ownerUnitId: 4,
    templateId: "forward_test",
    name: "Forward",
    type: "move",
    cost: 1,
    text: "Advance",
    effectId: "forward",
    targets: ["friendly"],
  };
}

function finishTurn(match: MatchState): MatchState {
  if (match.phase === "deployment") match = must(match, { type: "endDeployment" });
  if (match.phase === "maneuver") match = must(match, { type: "endManeuver" });
  if (match.phase === "engagement") match = must(match, { type: "endEngagement" });
  return match;
}

describe("match flow", () => {
  it("starts with max HQ, base Supply, opening hands, empty board", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 7);
    expect(match.players[0].hqHp).toBe(HQ_MAX_HP);
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
    expect(match.players[0].commandPoints).toBe(BASE_SUPPLY);
    expect(match.players[0].hand).toHaveLength(OPENING_HAND);
    expect(match.players[1].hand).toHaveLength(OPENING_HAND + 1);
    expect(match.players[1].hand[0].templateId).toBe(INITIATIVE_TEMPLATE_ID);
    expect(match.players[1].hand[0].name).toBe(INITIATIVE_CARD_NAME);
    expect(match.players[1].hand.filter((c) => c.templateId !== INITIATIVE_TEMPLATE_ID)).toHaveLength(OPENING_HAND);
    expect(match.phase).toBe("deployment");
    expect(match.board.flat().every((cell) => cell === null)).toBe(true);
  });

  it("draws two cards at the start of later turns", () => {
    let match = createMatch(DEFAULT_P1, DEFAULT_P2, 7);
    const p1Hand = match.players[0].hand.length;
    match = must(match, { type: "endDeployment" });
    if (match.phase === "maneuver") match = must(match, { type: "endManeuver" });
    match = must(match, { type: "endEngagement" });
    match = must(match, { type: "endDeployment" });
    if (match.phase === "maneuver") match = must(match, { type: "endManeuver" });
    match = must(match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(0);
    expect(match.players[0].hand.length).toBe(p1Hand + DRAW_PER_TURN);
  });

  it("does not draw past 9 cards in hand", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 7);
    const player = match.players[0];
    while (player.hand.length < HAND_LIMIT - 1 && player.deck.length > 0) {
      player.hand.push(player.deck.shift()!);
    }
    expect(player.hand.length).toBe(HAND_LIMIT - 1);
    const drawn = drawCards(match, 0, DRAW_PER_TURN);
    expect(drawn).toBe(1);
    expect(player.hand.length).toBe(HAND_LIMIT);
    expect(drawCards(match, 0, DRAW_PER_TURN)).toBe(0);
    expect(player.hand.length).toBe(HAND_LIMIT);
  });

  it("Blitz deploys onto Frontline and spends CP", () => {
    const match = must(createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3), {
      type: "deploy",
      unitDefId: 4,
      row: 2,
    });
    expect(match.players[0].commandPoints).toBe(0);
    expect(match.board[1][2]?.defId).toBe(4);
    expect(match.board[0][2]).toBeNull();
  });

  it("blocks Forward once the unit is already on Frontline", () => {
    let match = must(createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 1), {
      type: "deploy",
      unitDefId: 4,
      row: 1,
    });
    match = must(match, { type: "endDeployment" });
    match.players[0].commandPoints = 1;
    match.players[0].hand = [fakeForward("fwd1"), ...match.players[0].hand];
    expect(() =>
      must(match, {
        type: "playCard",
        cardId: "fwd1",
        targets: { unitIds: [match.board[1][1]!.instanceId] },
      }),
    ).toThrow(/already at Frontline/);
  });

  it("never reshuffles an exhausted deck", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 9);
    const p = match.players[0];
    const total = p.deck.length + p.hand.length;
    p.hand = [...p.hand, ...p.deck];
    p.deck = [];
    expect(p.hand.length).toBe(total);
    expect(p.deck.length).toBe(0);
  });

  it("allows two discard-redraws per Maneuver", () => {
    let match = createMatch(DEFAULT_P1, DEFAULT_P2, 11);
    match = must(match, { type: "endDeployment" });
    const first = match.players[0].hand[0];
    const deckBefore = match.players[0].deck.length;
    match = must(match, { type: "discardRedraw", cardId: first.instanceId });
    expect(match.players[0].discard.some((c) => c.instanceId === first.instanceId)).toBe(true);
    expect(match.players[0].deck.length).toBe(deckBefore - 1);
    expect(match.players[0].discardRedrawsUsed).toBe(1);
    const second = match.players[0].hand[0];
    match = must(match, { type: "discardRedraw", cardId: second.instanceId });
    expect(match.players[0].discardRedrawsUsed).toBe(2);
    expect(() => must(match, { type: "discardRedraw", cardId: match.players[0].hand[0].instanceId })).toThrow(
      /Already discarded twice/,
    );
  });
});

describe("HQ / unit comeback", () => {
  it("grants next-turn Supply+draw when a behind player crosses an HQ mark", () => {
    const next = cloneState(createMatch(DEFAULT_P1, DEFAULT_P2, 4));
    next.players[1].hqHp = HQ_MAX_HP;
    applyHqDamage(next, 0, 20, "Test");
    expect(next.players[0].hqHp).toBe(40);
    expect(next.players[0].triggeredBreakpoints).toEqual([40]);
    expect(next.players[0].nextTurnSupplyBonus).toBe(1);
    expect(next.players[0].nextTurnDrawBonus).toBe(1);
    expect(flattenLog(next.log).some((line) => line.includes("Comeback (HQ 40)"))).toBe(true);
  });

  it("does not grant HQ comeback when the damaged player still has equal or more HQ", () => {
    const next = cloneState(createMatch(DEFAULT_P1, DEFAULT_P2, 4));
    next.players[1].hqHp = 30;
    applyHqDamage(next, 0, 20, "Test");
    expect(next.players[0].hqHp).toBe(40);
    expect(next.players[0].triggeredBreakpoints).toEqual([40]);
    expect(next.players[0].nextTurnSupplyBonus).toBe(0);
    expect(next.players[0].nextTurnDrawBonus).toBe(0);
    expect(flattenLog(next.log).some((line) => line.includes("no comeback"))).toBe(true);
  });

  it("fires each newly crossed mark once and stacks comeback bonuses", () => {
    const next = cloneState(createMatch(DEFAULT_P1, DEFAULT_P2, 4));
    applyHqDamage(next, 0, 50, "Test");
    expect(next.players[0].hqHp).toBe(10);
    expect(next.players[0].triggeredBreakpoints).toEqual([40, 25, 15, 10]);
    expect(next.players[0].nextTurnSupplyBonus).toBe(4);
    expect(next.players[0].nextTurnDrawBonus).toBe(4);
    applyHqDamage(next, 0, 0, "Test");
    expect(next.players[0].triggeredBreakpoints).toEqual([40, 25, 15, 10]);
    expect(HQ_BREAKPOINTS).toEqual([40, 25, 15, 10]);
    expect(nextHqBreakpoint(HQ_MAX_HP, [])).toBe(40);
    expect(nextHqBreakpoint(40, [40])).toBe(25);
    expect(nextHqBreakpoint(10, [40, 25, 15, 10])).toBeNull();
  });

  it("does not retrigger after HQ is repaired past a mark", () => {
    const next = cloneState(createMatch(DEFAULT_P1, DEFAULT_P2, 4));
    applyHqDamage(next, 0, 20, "Test");
    expect(next.players[0].nextTurnSupplyBonus).toBe(1);
    healHq(next, 0, 10);
    expect(next.players[0].hqHp).toBe(50);
    applyHqDamage(next, 0, 12, "Test");
    expect(next.players[0].hqHp).toBe(38);
    expect(next.players[0].triggeredBreakpoints).toEqual([40]);
    expect(next.players[0].nextTurnSupplyBonus).toBe(1);
  });

  it("applies queued comeback Supply and draw at turn start", () => {
    let match = cloneState(createMatch(DEFAULT_P1, DEFAULT_P2, 4));
    match.players[0].nextTurnSupplyBonus = 1;
    match.players[0].nextTurnDrawBonus = 1;
    const handBefore = match.players[0].hand.length;
    match = finishTurn(match);
    match = finishTurn(match);
    expect(match.currentPlayer).toBe(0);
    expect(match.players[0].commandPoints).toBe(BASE_SUPPLY + 1);
    expect(match.players[0].nextTurnSupplyBonus).toBe(0);
    expect(match.players[0].nextTurnDrawBonus).toBe(0);
    expect(match.players[0].hand.length).toBe(handBefore + DRAW_PER_TURN + 1);
    expect(flattenLog(match.log).some((line) => line.includes("Comeback:") && line.includes("+1 Supply"))).toBe(true);
    expect(flattenLog(match.log).some((line) => line.includes("incl. +1 comeback"))).toBe(true);
  });

  it("grants unit-death comeback only when behind on board+reserve", () => {
    const match = cloneState(createMatch(DEFAULT_P1, DEFAULT_P2, 4));
    match.players[0].undeployed = [16];
    match.players[1].undeployed = [16, 17];
    const def = getUnitDef(16);
    placeUnit(match.board, {
      instanceId: "u_die",
      defId: def.id,
      name: def.name,
      class: def.class,
      owner: 0,
      col: 0,
      row: 0,
      hp: 0,
      maxHp: def.hp,
      atk: def.atk,
      armor: def.armor,
      ap: def.ap,
      cost: def.cost,
      keywords: def.keywords.map((k) => ({ ...k })),
      tempAtk: 0,
      tempArmor: 0,
      tempAp: 0,
      tempRetaliate: 0,
      rested: true,
      combatAtkBonus: 0,
      isAttacker: false,
    });
    resolveDestroyedUnits(match);
    expect(match.board[0][0]).toBeNull();
    expect(match.players[0].nextTurnSupplyBonus).toBe(1);
    expect(match.players[0].nextTurnDrawBonus).toBe(1);
  });

  it("skips unit-death comeback when not behind on army presence", () => {
    const match = cloneState(createMatch(DEFAULT_P1, DEFAULT_P2, 4));
    match.players[0].undeployed = [16, 17];
    match.players[1].undeployed = [16];
    const def = getUnitDef(16);
    placeUnit(match.board, {
      instanceId: "u_die2",
      defId: def.id,
      name: def.name,
      class: def.class,
      owner: 0,
      col: 0,
      row: 0,
      hp: 0,
      maxHp: def.hp,
      atk: def.atk,
      armor: def.armor,
      ap: def.ap,
      cost: def.cost,
      keywords: def.keywords.map((k) => ({ ...k })),
      tempAtk: 0,
      tempArmor: 0,
      tempAp: 0,
      tempRetaliate: 0,
      rested: true,
      combatAtkBonus: 0,
      isAttacker: false,
    });
    resolveDestroyedUnits(match);
    expect(match.players[0].nextTurnSupplyBonus).toBe(0);
    expect(match.players[0].nextTurnDrawBonus).toBe(0);
  });
});

describe("special fizzle", () => {
  it("charges 1 CP and does nothing when the source unit is not on the board", () => {
    let match = createMatch(DEFAULT_P1, DEFAULT_P2, 2);
    match = must(match, { type: "endDeployment" });
    const special: CardInstance = {
      instanceId: "spec_test",
      ownerUnitId: 4,
      templateId: "special_test",
      name: "Test Special",
      type: "special",
      cost: 0,
      text: "Fizzle test",
      effectId: "fortify",
      targets: [],
      requiresSourceOnField: true,
    };
    match.players[0].hand = [special, ...match.players[0].hand];
    const cp = match.players[0].commandPoints;
    match = must(match, { type: "playCard", cardId: special.instanceId, targets: {} });
    expect(match.players[0].commandPoints).toBe(cp - 1);
    expect(match.players[0].discard[0].instanceId).toBe(special.instanceId);
    expect(flattenLog(match.log).some((line) => line.includes("fizzles"))).toBe(true);
  });
});

describe("engagement", () => {
  it("keeps Artillery on Support and lets it shoot an empty lane into HQ", () => {
    let match = createMatch(PREMADE_ARMIES.jet_infantry.units, PREMADE_ARMIES.aggro.units, 5);
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 12, row: 2 });
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    expect(match.board[0][2]?.defId).toBe(12);
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
    match = must(match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(1);
  });

  it("still enters Maneuver when the deck is empty so hand cards can be played", () => {
    let match = createMatch(PREMADE_ARMIES.jet_infantry.units, PREMADE_ARMIES.aggro.units, 5);
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 12, row: 2 });
    match.players[0].deck = [];
    match = must(match, { type: "endDeployment" });
    expect(match.phase).toBe("maneuver");
    expect(flattenLog(match.log).some((line) => line.includes("Maneuver skipped"))).toBe(false);
    match = must(match, { type: "endManeuver" });
    expect(match.phase).toBe("engagement");
    match = must(match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(1);
  });

  it("recalculates CP as 4 + units on board at the start of a later turn", () => {
    let match = createMatch(DEFAULT_P1, DEFAULT_P2, 3);
    match = must(match, { type: "deploy", unitDefId: 6, row: 0 });
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    match = must(match, { type: "endEngagement" });
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    match = must(match, { type: "endEngagement" });
    expect(match.currentPlayer).toBe(0);
    expect(match.players[0].commandPoints).toBe(BASE_SUPPLY + 1);
  });
});

describe("second player opening", () => {
  it("gives P2 +1 Supply on their first two deployments", () => {
    let match = finishTurn(createMatch(DEFAULT_P1, DEFAULT_P2, 3));
    expect(match.currentPlayer).toBe(1);
    expect(match.players[1].commandPoints).toBe(BASE_SUPPLY + 1);
    match = must(match, { type: "deploy", unitDefId: 5, row: 2 });
    expect(match.players[1].commandPoints).toBe(0);
    expect(match.board[3][2]?.defId).toBe(5);

    match = finishTurn(match);
    match = finishTurn(match);
    expect(match.currentPlayer).toBe(1);
    expect(match.players[1].turnsTaken).toBe(2);
    expect(match.players[1].commandPoints).toBe(BASE_SUPPLY + countUnits(match.board, 1) + 1);

    match = finishTurn(match);
    match = finishTurn(match);
    expect(match.currentPlayer).toBe(1);
    expect(match.players[1].turnsTaken).toBe(3);
    expect(match.players[1].commandPoints).toBe(BASE_SUPPLY + countUnits(match.board, 1));
  });

  it("lets Fully Prepared gain 1 Supply, move any direction, or bank +1 Supply next Deployment", () => {
    let match = finishTurn(createMatch(DEFAULT_P1, DEFAULT_P2, 8));
    const card = match.players[1].hand.find((c) => c.templateId === INITIATIVE_TEMPLATE_ID)!;
    match = must(match, { type: "deploy", unitDefId: 6, row: 1 });
    match = must(match, { type: "endDeployment" });
    const cp = match.players[1].commandPoints;
    match = must(match, { type: "playCard", cardId: card.instanceId, targets: { choice: "supply" } });
    expect(match.players[1].commandPoints).toBe(cp + 1);
    expect(match.players[1].discard[0].templateId).toBe(INITIATIVE_TEMPLATE_ID);

    match = finishTurn(match);
    match = finishTurn(match);
    const again = match.players[1].hand.find((c) => c.templateId === INITIATIVE_TEMPLATE_ID);
    expect(again).toBeUndefined();

    let bankMatch = finishTurn(createMatch(DEFAULT_P1, DEFAULT_P2, 9));
    const bankCard = bankMatch.players[1].hand.find((c) => c.templateId === INITIATIVE_TEMPLATE_ID)!;
    bankMatch = must(bankMatch, { type: "endDeployment" });
    bankMatch = must(bankMatch, {
      type: "playCard",
      cardId: bankCard.instanceId,
      targets: { choice: "nextSupply" },
    });
    expect(bankMatch.players[1].nextTurnSupplyBonus).toBe(1);

    let fwdMatch = finishTurn(createMatch(DEFAULT_P1, DEFAULT_P2, 10));
    const fwdCard = fwdMatch.players[1].hand.find((c) => c.templateId === INITIATIVE_TEMPLATE_ID)!;
    fwdMatch.players[1].commandPoints = 6;
    fwdMatch = must(fwdMatch, { type: "deploy", unitDefId: 3, row: 2 });
    const bastion = fwdMatch.board[3][2]!;
    fwdMatch = must(fwdMatch, { type: "endDeployment" });
    // Diagonal / sideways move (not only straight Forward).
    fwdMatch = must(fwdMatch, {
      type: "playCard",
      cardId: fwdCard.instanceId,
      targets: { choice: "move", unitIds: [bastion.instanceId], cells: [{ col: 3, row: 1 }] },
    });
    expect(fwdMatch.board[3][1]?.defId).toBe(3);
    expect(fwdMatch.board[3][2]).toBeNull();
  });
});

describe("back-line summoning rest", () => {
  it("keeps rested after endEngagement until the turn actually passes", () => {
    let match = createMatch(PREMADE_ARMIES.jet_infantry.units, DEFAULT_P2, 5);
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 12, row: 2 });
    expect(match.board[0][2]?.rested).toBe(true);
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    expect(match.phase).toBe("engagement");
    expect(match.board[0][2]?.rested).toBe(true);
    match = must(match, { type: "endEngagement" });
    // Turn has passed to P2 — rested clears on passTurn, not mid-engagement ack.
    expect(match.currentPlayer).toBe(1);
    expect(match.board[0][2]?.rested).toBe(false);
  });

  it("rests artillery and jets on deploy so they cannot initiate this engagement", () => {
    let match = createMatch(PREMADE_ARMIES.jet_infantry.units, DEFAULT_P2, 5);
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 12, row: 2 });
    expect(match.board[0][2]?.rested).toBe(true);
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBe(HQ_MAX_HP);
    expect(flattenLog(match.log).some((line) => line.includes("with Artillery"))).toBe(false);
  });

  it("lets artillery fire on the following turn", () => {
    let match = createMatch(PREMADE_ARMIES.jet_infantry.units, DEFAULT_P2, 5);
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 12, row: 2 });
    match = finishTurn(match);
    match = finishTurn(match);
    expect(match.currentPlayer).toBe(0);
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    expect(match.players[1].hqHp).toBeLessThan(HQ_MAX_HP);
  });

  it("does not rest a Blitz jet on deploy", () => {
    const army = [27, ...DEFAULT_P1.slice(1)];
    let match = createMatch(army, DEFAULT_P2, 3);
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 27, row: 2 });
    expect(match.board[1][2]?.defId).toBe(27);
    expect(match.board[1][2]?.rested).toBe(false);
  });

  it("ends the match when a player surrenders", () => {
    const match = must(createMatch(DEFAULT_P1, DEFAULT_P2, 7), { type: "surrender", by: 0 });
    expect(match.winner).toBe(1);
    expect(match.winReason).toBe("surrender");
    expect(match.phase).toBe("gameover");
  });
});
