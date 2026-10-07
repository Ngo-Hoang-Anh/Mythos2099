import { describe, expect, it } from "vitest";
import { fanStepDeg } from "./HandView";

describe("hand fan spacing", () => {
  it("keeps the 6-card hover spread and tightens after that", () => {
    const six = fanStepDeg(6, true) * 5;
    const ten = fanStepDeg(10, true) * 9;
    expect(fanStepDeg(6, true)).toBeCloseTo(4);
    expect(ten).toBeCloseTo(six);
    expect(fanStepDeg(10, true)).toBeLessThan(fanStepDeg(6, true));
  });
});
