import { describe, expect, it } from "vitest";
import { UNITS } from "./units";
import { UNIT_ART } from "./unitArt";
import { SQUAD_ART } from "./squadArt";

describe("unit catalog", () => {
  it("loads mythic names and lore for every catalog unit", () => {
    expect(UNITS).toHaveLength(36);
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(36);
    for (const [i, unit] of UNITS.entries()) {
      expect(unit.id).toBe(i + 1);
      expect(unit.name.length).toBeGreaterThan(2);
      expect(unit.lore.length).toBeGreaterThan(20);
      expect(unit.lore).toMatch(/Mythology/);
    }
    expect(UNITS[0].name).toBe("Zeus Devastator");
    expect(UNITS[UNITS.length - 1].name).toBe("Loki");
    expect(UNITS.find((u) => u.id === 3)!.name).toBe("Xuanwu Fortress");
    expect(UNITS.find((u) => u.id === 28)!.name).toBe("Qinglong");
    expect(UNITS.find((u) => u.id === 36)!.name).toBe("Loki");
  });

  it("applies expansion keyword and new-unit balance patch", () => {
    const of = (id: number) => UNITS.find((u) => u.id === id)!;
    const special = (id: number) => of(id).cards.find((c) => c.type === "special")!;

    expect(of(2)).toMatchObject({ hp: 14, atk: 1, ap: 4 });
    expect(of(2).keywords).toEqual(expect.arrayContaining([{ name: "aggressive", value: 4 }]));
    expect(of(3)).toMatchObject({ hp: 11, atk: 2, armor: 3 });
    expect(of(3).keywords).toEqual(
      expect.arrayContaining([
        { name: "hulldown", value: 1 },
        { name: "slopedArmor", value: 1 },
        { name: "retaliate", value: 5 },
      ]),
    );
    expect(of(4)).toMatchObject({ hp: 15, atk: 4, armor: 1, ap: 2, cost: 3 });
    expect(of(4).keywords).toEqual(
      expect.arrayContaining([
        { name: "scout", value: 1 },
        { name: "blitz", value: 1 },
        { name: "flank", value: 1 },
      ]),
    );
    expect(of(4).keywords.some((k) => k.name === "barrier")).toBe(false);
    expect(of(6)).toMatchObject({ hp: 12, atk: 4, armor: 2, ap: 1 });
    expect(of(6).keywords).toEqual(expect.arrayContaining([{ name: "barrier", value: 3 }]));
    expect(of(8)).toMatchObject({ atk: 4, armor: 1, ap: 0 });
    expect(of(8).keywords).toEqual(expect.arrayContaining([{ name: "corrosion", value: 2 }]));
    expect(of(9)).toMatchObject({ hp: 16, atk: 2, ap: 0, cost: 5 });
    expect(of(9).keywords).toEqual(expect.arrayContaining([{ name: "suppression", value: 1 }]));
    expect(of(13)).toMatchObject({ hp: 13, atk: 3, armor: 3, ap: 2 });
    expect(of(13).keywords).toEqual(
      expect.arrayContaining([
        { name: "shock", value: 4 },
        { name: "retaliate", value: 3 },
      ]),
    );
    expect(of(14)).toMatchObject({ hp: 12, atk: 3, armor: 2 });
    expect(of(14).keywords).toEqual(expect.arrayContaining([{ name: "camouflage", value: 1 }]));
    expect(of(15)).toMatchObject({ hp: 9, atk: 3, armor: 2, ap: 3 });
    expect(of(15).keywords).toEqual(expect.arrayContaining([{ name: "shield", value: 4 }]));
    expect(of(16)).toMatchObject({ hp: 20, atk: 2, ap: 6 });
    expect(of(16).keywords).toEqual(expect.arrayContaining([{ name: "retaliate", value: 3 }]));
    expect(of(17)).toMatchObject({ hp: 18, atk: 1, ap: 1, cost: 5 });
    expect(of(17).keywords).toEqual(
      expect.arrayContaining([
        { name: "hulldown", value: 1 },
        { name: "retaliate", value: 6 },
      ]),
    );
    expect(of(18)).toMatchObject({ hp: 14, atk: 2, armor: 1, ap: 0 });
    expect(of(18).keywords).toEqual(expect.arrayContaining([{ name: "supportFire", value: 2 }]));
    expect(of(18).keywords.some((k) => k.name === "retaliate")).toBe(false);
    expect(of(19)).toMatchObject({ hp: 11, atk: 4, armor: 0, ap: 0 });
    expect(of(19).keywords).toEqual(expect.arrayContaining([{ name: "smokeScreen", value: 1 }]));
    expect(of(20)).toMatchObject({ hp: 20, atk: 1, armor: 0, ap: 2 });
    expect(of(20).keywords).toEqual(expect.arrayContaining([{ name: "veteran", value: 1 }]));
    expect(of(21)).toMatchObject({ hp: 14, atk: 2, armor: 1, ap: 1 });
    expect(of(21).keywords).toEqual(expect.arrayContaining([{ name: "scout", value: 1 }]));
    expect(of(22)).toMatchObject({ hp: 9, atk: 2 });
    expect(of(22).keywords).toEqual(expect.arrayContaining([{ name: "radar", value: 1 }]));
    expect(of(23)).toMatchObject({ atk: 7, ap: 4 });
    expect(of(23).keywords).toEqual(expect.arrayContaining([{ name: "scout", value: 1 }]));
    expect(of(24)).toMatchObject({ hp: 9, armor: 0 });
    expect(of(24).keywords).toEqual(
      expect.arrayContaining([
        { name: "shield", value: 4 },
        { name: "barrier", value: 4 },
        { name: "supportFire", value: 3 },
      ]),
    );
    expect(of(24).keywords.some((k) => k.name === "blitz")).toBe(false);
    expect(of(26)).toMatchObject({ hp: 15, atk: 4, armor: 0 });
    expect(of(26).keywords).toEqual(expect.arrayContaining([{ name: "camouflage", value: 1 }]));
    expect(of(26).keywords.some((k) => k.name === "flank")).toBe(false);
    expect(of(27)).toMatchObject({ atk: 6, ap: 5 });
    expect(of(27).keywords).toEqual(expect.arrayContaining([{ name: "fire", value: 3 }]));
    expect(special(27).cost).toBe(3);

    expect(of(28)).toMatchObject({ hp: 13, atk: 4, armor: 0 });
    expect(of(28).keywords).toEqual(
      expect.arrayContaining([
        { name: "barrier", value: 5 },
        { name: "shock", value: 5 },
      ]),
    );
    expect(of(29)).toMatchObject({ hp: 8, atk: 3, ap: 2 });
    expect(of(29).keywords).toEqual(
      expect.arrayContaining([
        { name: "veteran", value: 1 },
        { name: "shield", value: 3 },
        { name: "slopedArmor", value: 1 },
      ]),
    );
    expect(of(30)).toMatchObject({ hp: 15, atk: 2, armor: 0, ap: 0, cost: 4 });
    expect(of(30).keywords).toEqual(
      expect.arrayContaining([
        { name: "smokeScreen", value: 1 },
        { name: "suppression", value: 1 },
        { name: "corrosion", value: 3 },
      ]),
    );
    expect(of(31)).toMatchObject({ hp: 16, atk: 2, armor: 1, ap: 2, cost: 6 });
    expect(of(31).keywords).toEqual(
      expect.arrayContaining([
        { name: "veteran", value: 1 },
        { name: "firstStrike", value: 5 },
      ]),
    );
    expect(of(32)).toMatchObject({ atk: 3, ap: 4 });
    expect(of(32).keywords).toEqual(
      expect.arrayContaining([
        { name: "artillery", value: 1 },
        { name: "firstStrike", value: 4 },
      ]),
    );
    expect(of(33)).toMatchObject({ hp: 9, cost: 5 });
    expect(of(33).keywords).toEqual(
      expect.arrayContaining([
        { name: "shield", value: 4 },
        { name: "shock", value: 4 },
      ]),
    );
    expect(of(34)).toMatchObject({ hp: 17, atk: 3, armor: 2, ap: 2, cost: 4 });
    expect(of(34).keywords).toEqual(
      expect.arrayContaining([
        { name: "jetPlane", value: 1 },
        { name: "radar", value: 1 },
        { name: "blitz", value: 1 },
      ]),
    );
    expect(of(34).keywords.some((k) => k.name === "scout")).toBe(false);
    expect(of(35)).toMatchObject({ hp: 13, atk: 2, armor: 0, ap: 0, cost: 6 });
    expect(of(35).keywords).toEqual(
      expect.arrayContaining([
        { name: "firstStrike", value: 5 },
        { name: "fire", value: 2 },
        { name: "corrosion", value: 2 },
      ]),
    );
    expect(of(36)).toMatchObject({ hp: 11, atk: 3, ap: 1, cost: 3 });
    expect(of(36).keywords).toEqual(
      expect.arrayContaining([
        { name: "camouflage", value: 1 },
        { name: "shield", value: 4 },
        { name: "smokeScreen", value: 1 },
      ]),
    );
    expect(of(11)).toMatchObject({ atk: 4, ap: 4, cost: 5 });
    expect(of(12)).toMatchObject({ atk: 4, ap: 4 });
    expect(of(1)).toMatchObject({ hp: 12, atk: 3, armor: 3 });
    expect(of(1).keywords).toEqual(
      expect.arrayContaining([
        { name: "missile", value: 4 },
        { name: "slopedArmor", value: 1 },
      ]),
    );
    expect(of(5)).toMatchObject({ hp: 13, atk: 3, armor: 1 });
    expect(of(7)).toMatchObject({ hp: 13, atk: 3 });
    expect(of(7).keywords).toEqual(expect.arrayContaining([{ name: "retaliate", value: 4 }]));
    expect(of(25)).toMatchObject({ hp: 13, armor: 1 });
    expect(of(10)).toMatchObject({ atk: 3, ap: 1 });
    expect(special(36)).toMatchObject({ effectId: "lokiCopy", cost: 2 });
  });

  it("keeps stats inside current sheet bounds", () => {
    for (const unit of UNITS) {
      expect(unit.hp).toBeGreaterThanOrEqual(3);
      expect(unit.hp).toBeLessThanOrEqual(20);
      expect(unit.atk).toBeGreaterThanOrEqual(0);
      expect(unit.atk).toBeLessThanOrEqual(10);
      expect(unit.armor).toBeGreaterThanOrEqual(0);
      expect(unit.armor).toBeLessThanOrEqual(8);
      expect(unit.ap).toBeGreaterThanOrEqual(0);
      expect(unit.ap).toBeLessThanOrEqual(8);
      expect(unit.cost).toBeGreaterThanOrEqual(2);
      expect(unit.cost).toBeLessThanOrEqual(6);
      expect(unit.cards.length).toBeGreaterThan(0);
    }
  });

  it("gives each unit one special, one maneuver, and one move", () => {
    for (const unit of UNITS) {
      expect(unit.cards.filter((c) => c.type === "special")).toHaveLength(1);
      expect(unit.cards.filter((c) => c.type === "maneuver")).toHaveLength(1);
      expect(unit.cards.filter((c) => c.type === "move")).toHaveLength(1);
    }
  });

  it("treats AP as a stat and stores Helicopter class", () => {
    const whisper = UNITS.find((u) => u.id === 8);
    expect(whisper?.class).toBe("Helicopter");
    expect(whisper?.ap).toBe(0);
    expect(UNITS.some((u) => u.id === 27)).toBe(true);
    expect(UNITS.some((u) => u.class === "Jet Plane")).toBe(true);
  });

  it("lets move cards pick a board cell after the unit", () => {
    const cards = UNITS.flatMap((u) => u.cards);
    for (const card of cards.filter((c) => ["up", "down", "upOrDown", "forward", "retreat"].includes(c.effectId))) {
      expect(card.targets).toEqual(["friendly", "boardDest"]);
    }
  });

  it("flags composed art on tanks, light vehicles, and the robot/artillery samples", () => {
    const flagged = UNITS.filter((u) => u.hasArt).map((u) => u.id).sort((a, b) => a - b);
    expect(flagged).toEqual(Object.keys(UNIT_ART).map(Number).sort((a, b) => a - b));
    for (const unit of UNITS.filter((u) => u.id <= 27)) {
      const painted =
        // Zeus (1) is isometric-only; former 2D pack moved to Loki (36).
        (unit.class === "Tank" && unit.id !== 1) ||
        unit.class === "Light Vehicle" ||
        unit.id === 14 ||
        unit.id === 13 ||
        unit.id === 15 ||
        unit.id === 12 ||
        unit.id === 11 ||
        unit.id === 10;
      expect(unit.hasArt).toBe(painted);
    }
  });

  it("charges Kamikaze Hunter Up or Down 1 Supply", () => {
    const hunter = UNITS.find((u) => u.id === 23);
    const moves = hunter?.cards.filter((c) => c.effectId === "upOrDown") ?? [];
    expect(moves).toHaveLength(1);
    expect(moves.every((c) => c.cost === 1)).toBe(true);
  });

  it("links published infantry, motorcycle, and drone units to squad sprites", () => {
    const squadIds = Object.keys(SQUAD_ART).map(Number).sort((a, b) => a - b);
    for (const id of squadIds) {
      const unit = UNITS.find((u) => u.id === id);
      expect(unit).toBeTruthy();
      expect(["Armored Infantry", "Motorcycle", "Drone"]).toContain(unit!.class);
    }
  });
});
