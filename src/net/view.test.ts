import { describe, expect, it } from "vitest";
import { DEFAULT_P1, DEFAULT_P2 } from "../data/premadeArmies";
import { createMatch } from "../engine/match";
import { projectMatch } from "./view";

describe("projectMatch", () => {
  it("hides RNG and opponent cards from the viewer", () => {
    const match = createMatch(DEFAULT_P1, DEFAULT_P2, 99);
    const p1 = projectMatch(match, 0);
    const p2 = projectMatch(match, 1);

    expect(p1.seed).toBe(0);
    expect(p1.rngState).toBe(0);
    expect(p1.idSeq).toBe(0);
    expect(p1.players[0].hand.map((card) => card.instanceId)).toEqual(match.players[0].hand.map((card) => card.instanceId));
    expect(p1.players[1].hand.every((card) => card.templateId === "hidden")).toBe(true);
    expect(p1.players[1].hand).toHaveLength(match.players[1].hand.length);
    expect(p1.players[0].deck.every((card) => card.templateId === "hidden")).toBe(true);
    expect(p1.players[0].deck).toHaveLength(match.players[0].deck.length);
    expect(p1.players[0].undeployed).toEqual(match.players[0].undeployed);
    expect(p1.players[0].army).toEqual(match.players[0].army);
    expect(p1.players[1].army).toEqual([]);
    expect(p1.players[1].undeployed.every((id) => id === 0)).toBe(true);

    expect(p2.players[1].hand.map((card) => card.instanceId)).toEqual(match.players[1].hand.map((card) => card.instanceId));
    expect(p2.players[0].hand.every((card) => card.templateId === "hidden")).toBe(true);
  });
});
