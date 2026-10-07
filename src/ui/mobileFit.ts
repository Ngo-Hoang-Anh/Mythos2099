/** Desktop design size the UI was built against. */
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

/** Short edge at or below this ⇒ treat as phone / small tablet. */
export const MOBILE_SHORT_EDGE = 600;

/** Screen short edge ceiling for “phone/tablet”, not a resized desktop window. */
export const MOBILE_SCREEN_SHORT_EDGE = 920;

/** Default viewport — PC must stay on this and never get scale pinning. */
export const DEFAULT_VIEWPORT =
  "width=device-width, initial-scale=1.0, viewport-fit=cover";

export type MobileFit = {
  /** False on PC / desktop: do not rewrite viewport or gate orientation. */
  active: boolean;
  /** Visual scale the browser applies via the viewport meta tag. */
  scale: number;
  /** Layout viewport width in CSS px (`width=` in the meta tag). */
  layoutWidth: number | "device-width";
  isPortraitMobile: boolean;
};

export type MobileClientHints = {
  coarsePointer: boolean;
  hoverNone: boolean;
  maxTouchPoints: number;
  /** Physical screen short edge (prefer screen, not window). */
  screenShortEdge: number;
};

/** True only for real phones/tablets — never a narrow desktop browser window. */
export function isMobileClient(hints: MobileClientHints): boolean {
  const touchy =
    hints.coarsePointer || (hints.hoverNone && hints.maxTouchPoints > 0);
  return touchy && hints.screenShortEdge <= MOBILE_SCREEN_SHORT_EDGE;
}

export function readMobileClientHints(
  win: Pick<Window, "matchMedia" | "navigator" | "screen"> = window,
): MobileClientHints {
  return {
    coarsePointer: win.matchMedia("(pointer: coarse)").matches,
    hoverNone: win.matchMedia("(hover: none)").matches,
    maxTouchPoints: win.navigator.maxTouchPoints ?? 0,
    screenShortEdge: Math.min(win.screen.width, win.screen.height),
  };
}

/**
 * Mobile-only fit. PC always gets `active: false` so viewport/CSS stay untouched.
 * On mobile landscape, widen layout viewport so unit art + board scale with the page.
 */
export function computeMobileFit(
  visualWidth: number,
  visualHeight: number,
  mobile: boolean,
): MobileFit {
  if (!mobile) {
    return {
      active: false,
      scale: 1,
      layoutWidth: "device-width",
      isPortraitMobile: false,
    };
  }

  const w = Math.max(1, visualWidth);
  const h = Math.max(1, visualHeight);
  const short = Math.min(w, h);
  const portrait = h > w;
  const isPortraitMobile = portrait && short <= MOBILE_SHORT_EDGE;

  if (isPortraitMobile) {
    return {
      active: true,
      scale: 1,
      layoutWidth: "device-width",
      isPortraitMobile: true,
    };
  }

  const scale = Math.min(1, w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
  if (scale >= 0.999) {
    return {
      active: true,
      scale: 1,
      layoutWidth: "device-width",
      isPortraitMobile: false,
    };
  }

  return {
    active: true,
    scale,
    layoutWidth: Math.max(1, Math.round(w / scale)),
    isPortraitMobile: false,
  };
}

export function viewportMetaContent(fit: MobileFit): string {
  if (!fit.active || fit.layoutWidth === "device-width") {
    if (fit.active && fit.isPortraitMobile) {
      return "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
    }
    return DEFAULT_VIEWPORT;
  }
  const s = Number(fit.scale.toFixed(5));
  return `width=${fit.layoutWidth}, initial-scale=${s}, minimum-scale=${s}, maximum-scale=${s}, user-scalable=no, viewport-fit=cover`;
}

/**
 * Device-px size of the visible area. `innerWidth/innerHeight` are in layout CSS px,
 * which our own meta viewport shrinks by `appliedScale` — multiply back so the
 * measurement doesn't depend on the fit we already applied.
 */
export function physicalViewportSize(
  innerWidth: number,
  innerHeight: number,
  appliedScale: number,
): { width: number; height: number } {
  return { width: innerWidth * appliedScale, height: innerHeight * appliedScale };
}

function applyFit(fit: MobileFit): void {
  const root = document.documentElement;
  root.style.setProperty("--ui-scale", String(fit.active ? fit.scale : 1));
  root.style.zoom = "1";
  root.classList.toggle("is-mobile-fit", fit.active);
  root.classList.toggle("is-portrait-mobile", fit.isPortraitMobile);

  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) meta.setAttribute("content", viewportMetaContent(fit));
}

async function tryLockLandscape(): Promise<void> {
  const orientation = window.screen?.orientation;
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    await orientation.lock("landscape");
  } catch {
    /* Overlay still asks the user to rotate. */
  }
}

function bindRotateGate(gate: HTMLElement): void {
  gate.addEventListener("click", () => {
    void tryLockLandscape();
  });
}

/** Apply mobile-only landscape fit + portrait gate; no-ops on PC. */
export function applyMobileFit(): () => void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  const gate = document.getElementById("rotate-gate");
  if (gate) bindRotateGate(gate);

  let appliedScale = 1;
  let lastMeta = "";
  const sync = () => {
    const mobile = isMobileClient(readMobileClientHints());
    const { width, height } = physicalViewportSize(
      window.innerWidth,
      window.innerHeight,
      appliedScale,
    );
    const fit = computeMobileFit(width, height, mobile);
    const meta = `${fit.active}:${fit.isPortraitMobile}:${viewportMetaContent(fit)}`;
    if (meta === lastMeta) return;
    lastMeta = meta;
    appliedScale = fit.active ? Number(fit.scale.toFixed(5)) : 1;
    applyFit(fit);
  };

  sync();

  // Fires on rotation and URL-bar show/hide.
  window.addEventListener("resize", sync);

  return () => {
    window.removeEventListener("resize", sync);
  };
}
