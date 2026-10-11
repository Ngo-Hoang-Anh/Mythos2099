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

/**
 * Safari itself. Chrome, Edge, Firefox, and Opera include "Safari" in the UA
 * but must not take the tab-restore viewport reset — that path hides the page
 * and rewrites the meta tag.
 */
export function isSafariBrowser(userAgent: string): boolean {
  if (!/Safari\//.test(userAgent)) return false;
  return !/Chrome\/|Chromium\/|CriOS\/|FxiOS\/|Edg\/|EdgiOS\/|OPR\/|OPiOS\/|Android/.test(userAgent);
}

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

const LOCKED_DEVICE_VIEWPORT =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no";

/**
 * Scale=1 viewport used only as a temporary write. WebKit ignores a viewport
 * assignment whose string did not change, which is how a restored tab keeps
 * the shrunk scale. Passing through this value forces it to recompute.
 */
export const VIEWPORT_RESET = LOCKED_DEVICE_VIEWPORT;

export function viewportMetaContent(fit: MobileFit): string {
  if (!fit.active) return DEFAULT_VIEWPORT;
  if (fit.layoutWidth === "device-width") return LOCKED_DEVICE_VIEWPORT;
  const s = Number(fit.scale.toFixed(5));
  return `width=${fit.layoutWidth}, initial-scale=${s}, minimum-scale=${s}, maximum-scale=${s}, user-scalable=no, viewport-fit=cover, shrink-to-fit=no`;
}

/**
 * True while `innerWidth` is still the widened layout viewport. After a reset
 * to `width=device-width`, it drops back to the screen long edge.
 */
export function layoutWidthStillApplied(
  innerWidth: number,
  screenWidth: number,
  screenHeight: number,
): boolean {
  const longEdge = Math.max(screenWidth, screenHeight, 1);
  return innerWidth > longEdge + 32;
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

/**
 * iOS Safari ignores `user-scalable=no` for pinch and the aA page-zoom control.
 * Cancel the gesture, then snap the visual viewport back to the locked meta scale.
 */
function bindZoomLock(lockedViewport: () => string, hold: { current: boolean }): () => void {
  const stop = (event: Event) => {
    event.preventDefault();
  };
  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault();
  };
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) event.preventDefault();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === "+" || event.key === "-" || event.key === "=" || event.key === "_" || event.key === "0") {
      event.preventDefault();
    }
  };

  let snapping = false;
  const snapUserScale = () => {
    if (snapping || hold.current) return;
    const scale = window.visualViewport?.scale ?? 1;
    if (Math.abs(scale - 1) < 0.01) return;
    const meta = document.querySelector('meta[name="viewport"]');
    const locked = lockedViewport();
    if (!meta || !locked.includes("user-scalable=no")) return;
    snapping = true;
    meta.setAttribute("content", locked);
    requestAnimationFrame(() => {
      snapping = false;
    });
  };

  const capture: AddEventListenerOptions = { capture: true, passive: false };
  document.addEventListener("gesturestart", stop, capture);
  document.addEventListener("gesturechange", stop, capture);
  document.addEventListener("gestureend", stop, capture);
  document.addEventListener("touchmove", onTouchMove, capture);
  document.addEventListener("wheel", onWheel, capture);
  window.addEventListener("keydown", onKeyDown, true);
  window.visualViewport?.addEventListener("resize", snapUserScale);
  window.visualViewport?.addEventListener("scroll", snapUserScale);

  return () => {
    document.removeEventListener("gesturestart", stop, capture);
    document.removeEventListener("gesturechange", stop, capture);
    document.removeEventListener("gestureend", stop, capture);
    document.removeEventListener("touchmove", onTouchMove, capture);
    document.removeEventListener("wheel", onWheel, capture);
    window.removeEventListener("keydown", onKeyDown, true);
    window.visualViewport?.removeEventListener("resize", snapUserScale);
    window.visualViewport?.removeEventListener("scroll", snapUserScale);
  };
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
  let lockedViewport = DEFAULT_VIEWPORT;
  const zoomHold = { current: false };
  const onMobileShell = document.documentElement.classList.contains("is-mobile-shell");
  const lockZoom = onMobileShell && isMobileClient(readMobileClientHints());
  const restoreOnShow = lockZoom && isSafariBrowser(window.navigator.userAgent);
  const unbindZoom = lockZoom ? bindZoomLock(() => lockedViewport, zoomHold) : () => {};
  const commit = () => {
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
    lockedViewport = viewportMetaContent(fit);
    applyFit(fit);
  };

  const sync = () => {
    if (zoomHold.current) return;
    commit();
  };

  let orientTimer = 0;
  let restoreGen = 0;
  let restoreTimer = 0;
  let restoring = false;
  let sawHidden = false;

  const endRestore = (gen: number) => {
    if (gen !== restoreGen) return;
    restoring = false;
    document.documentElement.classList.remove("is-viewport-restoring");
    zoomHold.current = false;
  };

  const onOrientation = () => {
    zoomHold.current = true;
    window.clearTimeout(orientTimer);
    // iOS updates innerWidth after orientationchange. Wait, then refit.
    orientTimer = window.setTimeout(() => {
      if (restoring) return;
      zoomHold.current = false;
      lastMeta = "";
      sync();
    }, 200);
  };

  /**
   * Tab restore on iOS reapplies a shrunk scale and ignores a viewport write
   * that matches the current attribute. Reset to device-width first, measure
   * the real visible size, then fit again. Resize is held off so a stale
   * `appliedScale` cannot multiply the reset size into an even smaller fit.
   */
  const restoreViewport = () => {
    if (document.visibilityState === "hidden") return;
    if (!lockedViewport.includes("user-scalable=no")) return;
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    const gen = ++restoreGen;
    window.clearTimeout(restoreTimer);
    restoring = true;
    zoomHold.current = true;
    document.documentElement.classList.add("is-viewport-restoring");

    const attemptReset = (attempt: number) => {
      if (gen !== restoreGen) return;
      if (document.visibilityState === "hidden") {
        endRestore(gen);
        return;
      }
      meta.setAttribute("content", VIEWPORT_RESET);
      restoreTimer = window.setTimeout(() => {
        if (gen !== restoreGen) return;
        const stillWide = layoutWidthStillApplied(
          window.innerWidth,
          window.screen.width,
          window.screen.height,
        );
        if (stillWide && attempt < 8) {
          attemptReset(attempt + 1);
          return;
        }
        if (!stillWide) {
          appliedScale = 1;
          lastMeta = "";
          commit();
        } else {
          meta.setAttribute("content", lockedViewport);
        }
        restoreTimer = window.setTimeout(() => {
          if (gen !== restoreGen) return;
          const vvScale = window.visualViewport?.scale ?? 1;
          const widthMatch = lockedViewport.match(/width=(\d+)/);
          const expected = widthMatch ? Number(widthMatch[1]) : 0;
          const exploded = expected > 0 && window.innerWidth > expected * 1.08;
          const pinched = Math.abs(vvScale - 1) > 0.02;
          if ((exploded || pinched) && attempt < 1) {
            attemptReset(attempt + 1);
            return;
          }
          endRestore(gen);
        }, 280);
      }, 40);
    };

    attemptReset(0);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      sawHidden = true;
      return;
    }
    if (sawHidden) restoreViewport();
  };

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted || sawHidden) restoreViewport();
  };

  sync();

  // Fires on rotation and URL-bar show/hide.
  window.addEventListener("resize", sync);
  if (lockZoom) {
    window.addEventListener("orientationchange", onOrientation);
  }
  if (restoreOnShow) {
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
  }

  return () => {
    restoreGen += 1;
    restoring = false;
    window.clearTimeout(orientTimer);
    window.clearTimeout(restoreTimer);
    document.documentElement.classList.remove("is-viewport-restoring");
    window.removeEventListener("resize", sync);
    window.removeEventListener("orientationchange", onOrientation);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pageshow", onPageShow);
    unbindZoom();
  };
}
