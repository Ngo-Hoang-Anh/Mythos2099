import { describe, expect, it } from "vitest";
import { DEFAULT_P2, PREMADE_ARMIES } from "../data/premadeArmies";
import { createMatch, must } from "./match";

describe("combat fx", () => {
  it("records a Blitz move when a unit deploys onto Frontline", () => {
    const match = must(createMatch(PREMADE_ARMIES.aggro.units, PREMADE_ARMIES.aggro.units, 3), {
      type: "deploy",
      unitDefId: 4,
      row: 2,
    });
    expect(match.fx.some((e) => e.kind === "move" && e.name === "Sarama Warhound")).toBe(true);
  });

  it("records HQ attacks after Artillery engagement", () => {
    let match = createMatch(PREMADE_ARMIES.jet_infantry.units, DEFAULT_P2, 5);
    match.players[0].commandPoints = 6;
    match = must(match, { type: "deploy", unitDefId: 12, row: 2 });
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    expect(match.combatPlayback?.steps.some((s) => s.kind === "shot")).toBeFalsy();
    match = must(match, { type: "endEngagement" });
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    match = must(match, { type: "endEngagement" });
    match = must(match, { type: "endDeployment" });
    match = must(match, { type: "endManeuver" });
    expect(match.combatPlayback?.steps.some((s) => s.kind === "shot")).toBe(true);
  });
});
