import { describe, expect, it } from "vitest";
import {
  computeMobileFit,
  DEFAULT_VIEWPORT,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  isMobileClient,
  isSafariBrowser,
  MOBILE_SHORT_EDGE,
  layoutWidthStillApplied,
  physicalViewportSize,
  viewportMetaContent,
} from "./mobileFit";

describe("isMobileClient", () => {
  it("rejects a narrow desktop window (fine pointer + hover)", () => {
    expect(
      isMobileClient({
        coarsePointer: false,
        hoverNone: false,
        maxTouchPoints: 0,
        screenShortEdge: 900,
      }),
    ).toBe(false);
  });

  it("accepts a phone-sized coarse/touch screen", () => {
    expect(
      isMobileClient({
        coarsePointer: true,
        hoverNone: true,
        maxTouchPoints: 5,
        screenShortEdge: 390,
      }),
    ).toBe(true);
  });

  it("rejects large touch laptops / desktops", () => {
    expect(
      isMobileClient({
        coarsePointer: true,
        hoverNone: false,
        maxTouchPoints: 10,
        screenShortEdge: 1080,
      }),
    ).toBe(false);
  });
});

describe("isSafariBrowser", () => {
  it("accepts iPhone Safari", () => {
    expect(
      isSafariBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(true);
  });

  it("rejects Chrome, Edge, and Firefox even when the UA mentions Safari", () => {
    expect(
      isSafariBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
    expect(
      isSafariBrowser(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isSafariBrowser(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      ),
    ).toBe(false);
    expect(isSafariBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/121.0 Mobile/15E148 Safari/605.1.15")).toBe(false);
  });
});

describe("computeMobileFit", () => {
  it("never activates on PC even when the window is small", () => {
    expect(computeMobileFit(844, 390, false)).toEqual({
      active: false,
      scale: 1,
      layoutWidth: "device-width",
      isPortraitMobile: false,
    });
    expect(computeMobileFit(900, 1200, false).active).toBe(false);
  });

  it("keeps large mobile landscape on the default viewport", () => {
    expect(computeMobileFit(DESIGN_WIDTH, DESIGN_HEIGHT, true)).toEqual({
      active: true,
      scale: 1,
      layoutWidth: "device-width",
      isPortraitMobile: false,
    });
  });

  it("widens the layout viewport so a landscape phone fits the design height", () => {
    const fit = computeMobileFit(844, 390, true);
    expect(fit.active).toBe(true);
    expect(fit.isPortraitMobile).toBe(false);
    expect(fit.scale).toBeCloseTo(Math.min(1, 844 / DESIGN_WIDTH, 390 / DESIGN_HEIGHT), 5);
    expect(fit.layoutWidth).toBe(Math.round(844 / fit.scale));
    expect(390 / fit.scale).toBeCloseTo(DESIGN_HEIGHT, 0);
  });

  it("flags portrait phones for the rotate gate", () => {
    expect(computeMobileFit(390, 844, true)).toEqual({
      active: true,
      scale: 1,
      layoutWidth: "device-width",
      isPortraitMobile: true,
    });
    expect(computeMobileFit(MOBILE_SHORT_EDGE, MOBILE_SHORT_EDGE + 200, true).isPortraitMobile).toBe(
      true,
    );
  });
});

describe("physicalViewportSize", () => {
  it("undoes our own meta scale (inner 1818×720 @0.38865 ≈ 707×280)", () => {
    const p = physicalViewportSize(1818, 720, 0.38865);
    expect(p.width).toBeCloseTo(706.6, 0);
    expect(p.height).toBeCloseTo(279.8, 0);
  });

  it("re-measuring after the fit is applied yields the same fit", () => {
    const fit = computeMobileFit(854, 384, true);
    const again = physicalViewportSize(fit.layoutWidth as number, 384 / fit.scale, fit.scale);
    expect(computeMobileFit(again.width, again.height, true)).toEqual(fit);
  });
});

describe("viewportMetaContent", () => {
  it("restores the default viewport when inactive", () => {
    expect(
      viewportMetaContent({
        active: false,
        scale: 1,
        layoutWidth: "device-width",
        isPortraitMobile: false,
      }),
    ).toBe(DEFAULT_VIEWPORT);
  });

  it("locks scale on device-width mobile viewports", () => {
    for (const isPortraitMobile of [true, false]) {
      const content = viewportMetaContent({
        active: true,
        scale: 1,
        layoutWidth: "device-width",
        isPortraitMobile,
      });
      expect(content).toContain("user-scalable=no");
      expect(content).toContain("minimum-scale=1");
      expect(content).toContain("maximum-scale=1");
    }
  });

  it("pins scale for active landscape fit", () => {
    const content = viewportMetaContent({
      active: true,
      scale: 0.5,
      layoutWidth: 1600,
      isPortraitMobile: false,
    });
    expect(content).toContain("width=1600");
    expect(content).toContain("initial-scale=0.5");
    expect(content).toContain("user-scalable=no");
    expect(content).toContain("shrink-to-fit=no");
  });
});

describe("layoutWidthStillApplied", () => {
  it("treats a widened layout viewport as not yet reset", () => {
    expect(layoutWidthStillApplied(1561, 393, 852)).toBe(true);
  });

  it("treats device-width innerWidth as an honest measurement", () => {
    expect(layoutWidthStillApplied(852, 393, 852)).toBe(false);
    expect(layoutWidthStillApplied(860, 393, 852)).toBe(false);
  });
});
