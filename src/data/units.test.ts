import { describe, expect, it } from "vitest";
import { UNITS } from "./units";
import { UNIT_ART } from "./unitArt";
import { SQUAD_ART } from "./squadArt";

describe("unit catalog", () => {
  it("loads mythic names and lore for every catalog unit", () => {
    expect(UNITS).toHaveLength(27);
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(27);
    for (const [i, unit] of UNITS.entries()) {
      expect(unit.id).toBe(i + 1);
      expect(unit.name.length).toBeGreaterThan(2);
      expect(unit.lore.length).toBeGreaterThan(20);
      expect(unit.lore).toMatch(/Mythology/);
    }
    expect(UNITS[0].name).toBe("Zeus Devastator");
    expect(UNITS[UNITS.length - 1].name).toBe("Suzaku Komet");
    expect(UNITS.find((u) => u.id === 3)!.name).toBe("Xuanwu Fortress");
    expect(UNITS.find((u) => u.id === 4)!.name).toBe("Sarama Warhound");
    expect(UNITS.find((u) => u.id === 5)!.name).toBe("Eir's Blessing");
    expect(UNITS.find((u) => u.id === 8)!.name).toBe("Raiju's Whisper");
    expect(UNITS.find((u) => u.id === 17)!.name).toBe("Heimdall Bastion");
    expect(UNITS.find((u) => u.id === 20)!.name).toBe("Gungnir's Tip");
    expect(UNITS.find((u) => u.id === 22)!.name).toBe("Eyes of Horus");
  });

  it("applies the post-vacuum balance patch", () => {
    const of = (id: number) => UNITS.find((u) => u.id === id)!;
    const special = (id: number) => of(id).cards.find((c) => c.type === "special")!;
    expect(of(27)).toMatchObject({ atk: 8, ap: 8 });
    expect(special(27).cost).toBe(1);
    expect(of(25).hp).toBe(13);
    expect(special(25).cost).toBe(2);
    expect(special(26).cost).toBe(1);
    expect(of(20)).toMatchObject({ hp: 16, atk: 5, ap: 4 });
    expect(of(3)).toMatchObject({ hp: 10, atk: 2, ap: 0 });
    expect(of(3).keywords).toEqual(expect.arrayContaining([{ name: "retaliate", value: 5 }]));
    expect(of(1)).toMatchObject({ hp: 10, atk: 3, armor: 6, ap: 2 });
    expect(of(1).keywords).toEqual(expect.arrayContaining([{ name: "missile", value: 5 }]));
    expect(of(2)).toMatchObject({ hp: 10, atk: 3, armor: 3, ap: 6 });
    expect(special(2).cost).toBe(3);
    expect(of(6)).toMatchObject({ hp: 11, atk: 4, armor: 3, ap: 2, cost: 3 });
    expect(of(4)).toMatchObject({ hp: 10, atk: 3, armor: 2, ap: 3 });
    expect(of(5)).toMatchObject({ hp: 12 });
    expect(of(7)).toMatchObject({ hp: 13, atk: 5 });
    expect(of(8)).toMatchObject({ hp: 10 });
    expect(of(9)).toMatchObject({ hp: 14 });
    expect(of(13)).toMatchObject({ hp: 12, atk: 4, armor: 4 });
    expect(of(13).keywords).toEqual(expect.arrayContaining([{ name: "retaliate", value: 2 }]));
    expect(of(14)).toMatchObject({ hp: 10, atk: 3 });
    expect(of(14).keywords).toEqual(expect.arrayContaining([{ name: "aggressive", value: 4 }]));
    expect(of(15)).toMatchObject({ hp: 11, atk: 4 });
    expect(of(17)).toMatchObject({ atk: 2, ap: 2, cost: 4 });
    expect(of(12)).toMatchObject({ atk: 7, cost: 6 });
    expect(special(12).cost).toBe(4);
    expect(of(8)).toMatchObject({ hp: 10, atk: 4 });
    expect(special(8).text).toContain("+4");
    expect(of(2).cards.some((c) => c.effectId === "sniping")).toBe(true);
    expect(of(19).cards.some((c) => c.effectId === "maintenance")).toBe(true);
    expect(of(16).cards.some((c) => c.effectId === "maintenance")).toBe(true);
    expect(of(7).cards.some((c) => c.effectId === "reorganize")).toBe(true);
    expect(of(10).cards.some((c) => c.templateId === "missile_barrage")).toBe(true);
    expect(special(11).name).toBe("First Strike");
    expect(of(12)).toMatchObject({ atk: 7 });
    expect(of(10)).toMatchObject({ atk: 5, ap: 5 });
    expect(of(10).keywords).toEqual(expect.arrayContaining([{ name: "missile", value: 5 }]));
    expect(of(11)).toMatchObject({ ap: 5 });
    expect(of(24)).toMatchObject({ atk: 0, ap: 0 });
    expect(of(24).keywords).toEqual(expect.arrayContaining([{ name: "supportFire", value: 3 }]));
    expect(of(23)).toMatchObject({ atk: 7, ap: 6, cost: 3 });
    expect(special(4)).toMatchObject({ cost: 0, effectId: "intelAcquired" });
    expect(of(19)).toMatchObject({ hp: 14, atk: 4, ap: 4 });
    expect(of(21)).toMatchObject({ hp: 14, atk: 4, ap: 2 });
    expect(of(22).keywords).toEqual(expect.arrayContaining([{ name: "missile", value: 3 }]));
    expect(of(25)).toMatchObject({ ap: 2 });
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
    const hornet = UNITS.find((u) => u.id === 8);
    expect(hornet?.class).toBe("Helicopter");
    expect(hornet?.ap).toBe(1);
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
    for (const unit of UNITS) {
      const painted =
        unit.class === "Tank" ||
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

  it("links infantry, motorcycle, and drone units to squad sprites", () => {
    const squadIds = UNITS.filter((u) => u.class === "Armored Infantry" || u.class === "Motorcycle" || u.class === "Drone")
      .map((u) => u.id)
      .sort((a, b) => a - b);
    expect(squadIds).toEqual(Object.keys(SQUAD_ART).map(Number).sort((a, b) => a - b));
  });
});
