import { describe, expect, it } from "vitest";
import { getIsoArt, getUnitDisplayType, isoFrameIndex, ISO_ART } from "./isoArt";
import { getUnitDef } from "./units";

const ISO_UNITS: { id: number; src: string }[] = [
  { id: 1, src: "/units-isometric/tank/zeus.png" },
  { id: 29, src: "/units-isometric/light-vehicle/baihu.png" },
  { id: 30, src: "/units-isometric/robot/pandora.png" },
  { id: 31, src: "/units-isometric/infantry/excalibur.png" },
  { id: 32, src: "/units-isometric/artilery/longinus.png" },
  { id: 33, src: "/units-isometric/tank/thor.png" },
  { id: 34, src: "/units-isometric/jet/artemis.png" },
  { id: 35, src: "/units-isometric/helicopter/agni.png" },
];

describe("iso art", () => {
  it("maps every shipped isometric sheet onto its unit", () => {
    expect(Object.keys(ISO_ART).map(Number).sort((a, b) => a - b)).toEqual(
      ISO_UNITS.map((u) => u.id),
    );
    for (const { id, src } of ISO_UNITS) {
      expect(getUnitDef(id).displayType).toBe("isometric");
      expect(getUnitDisplayType(id)).toBe("isometric");
      expect(ISO_ART[id].src).toBe(src);
      expect(getIsoArt(id)?.dirs).toEqual(["SE", "E", "NE", "N", "NW", "W", "SW", "S"]);
      expect(ISO_ART[id].frames).toHaveLength(8);
    }
    expect(getUnitDef(25).displayType).toBe("2d");
    expect(getUnitDisplayType(25)).toBe("2d");
    expect(getUnitDisplayType(2)).toBe("2d");
    expect(ISO_ART[1].frames[0]).toMatchObject({ x: 4, y: 4, w: 256, h: 256 });
  });

  it("picks frames from board facing without rotating the sheet", () => {
    const tankDirs = ISO_ART[33].dirs;
    expect(isoFrameIndex(0, tankDirs)).toBe(tankDirs.indexOf("N"));
    expect(isoFrameIndex(90, tankDirs)).toBe(tankDirs.indexOf("E"));
    expect(isoFrameIndex(180, tankDirs)).toBe(tankDirs.indexOf("S"));
    expect(isoFrameIndex(-90, tankDirs)).toBe(tankDirs.indexOf("W"));
    expect(isoFrameIndex(45, tankDirs)).toBe(tankDirs.indexOf("NE"));
  });
});
