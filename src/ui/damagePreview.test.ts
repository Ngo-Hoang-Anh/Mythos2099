import { describe, expect, it } from "vitest";
import { createSandboxMatch, spawnUnit } from "../engine/sandbox";
import { P1_FRONT, P1_SUPPORT, P2_FRONT } from "../engine/types";
import { gunAim, missileAimHit } from "./damagePreview";

describe("damage preview", () => {
  it("forecasts gun damage and return fire", () => {
    const state = createSandboxMatch();
    const shooter = spawnUnit(state, { defId: 1, owner: 0, col: P1_FRONT, row: 0 });
    const target = spawnUnit(state, { defId: 2, owner: 1, col: P2_FRONT, row: 0 });
    shooter.atk = 8;
    shooter.ap = 0;
    shooter.armor = 1;
    shooter.keywords = [];
    target.atk = 4;
    target.armor = 3;
    target.ap = 0;
    target.keywords = [{ name: "retaliate", value: 2 }];

    const aim = gunAim(state, shooter);
    expect(aim?.to).toEqual({ col: P2_FRONT, row: 0 });
    expect(aim && "hits" in aim ? aim.hits : []).toEqual([
      { unitId: target.instanceId, hp: 5 },
      { unitId: shooter.instanceId, hp: 5 },
    ]);
  });

  it("aims a front-line gun at HQ when the lane is empty", () => {
    const state = createSandboxMatch();
    const shooter = spawnUnit(state, { defId: 1, owner: 0, col: P1_FRONT, row: 1 });
    shooter.keywords = [];
    expect(gunAim(state, shooter)?.to).toEqual({ hq: 1 });
  });

  it("does not preview a gun shot from a unit that cannot volley", () => {
    const state = createSandboxMatch();
    const shooter = spawnUnit(state, { defId: 1, owner: 0, col: P1_SUPPORT, row: 0 });
    shooter.keywords = [];
    spawnUnit(state, { defId: 2, owner: 1, col: P2_FRONT, row: 0 });
    expect(gunAim(state, shooter)).toBeNull();
  });

  it("forecasts missile damage on the locked enemy", () => {
    const state = createSandboxMatch();
    const shooter = spawnUnit(state, { defId: 1, owner: 0, col: P1_FRONT, row: 0 });
    const target = spawnUnit(state, { defId: 2, owner: 1, col: P2_FRONT, row: 1 });
    shooter.keywords = [{ name: "missile", value: 5 }];
    shooter.missileTarget = { col: P2_FRONT, row: 1 };
    target.armor = 6;
    expect(missileAimHit(state, shooter)).toEqual({ unitId: target.instanceId, hp: target.hp - 2 });
  });

  it("still forecasts a rested missile lock", () => {
    const state = createSandboxMatch();
    const shooter = spawnUnit(state, { defId: 1, owner: 0, col: P1_FRONT, row: 0, rested: true });
    const target = spawnUnit(state, { defId: 2, owner: 1, col: P2_FRONT, row: 0 });
    shooter.keywords = [{ name: "missile", value: 5 }];
    shooter.missileTarget = { col: P2_FRONT, row: 0 };
    target.armor = 6;
    expect(missileAimHit(state, shooter)?.hp).toBe(target.hp - 2);
  });
});
