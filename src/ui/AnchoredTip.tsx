import {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { claimExclusiveTip, isMobileShellUi, releaseExclusiveTip } from "./tipExclusive";

const MARGIN = 8;
const GAP = 6;
const PANEL_GAP = 8;

function placeTip(anchor: HTMLElement, tip: HTMLElement): { top: number; left: number } {
  const ar = anchor.getBoundingClientRect();
  // Prefer visual box (post CSS zoom) so tip size matches getBoundingClientRect space.
  const tipBox = tip.getBoundingClientRect();
  const tw = tipBox.width || tip.offsetWidth;
  const th = tipBox.height || tip.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = ar.bottom + GAP;
  const above = ar.top - GAP - th;
  if (top + th > vh - MARGIN && above >= MARGIN) {
    top = above;
  } else {
    top = Math.max(MARGIN, Math.min(top, vh - MARGIN - th));
  }

  let left = ar.left;
  if (left + tw > vw - MARGIN) left = ar.right - tw;
  left = Math.max(MARGIN, Math.min(left, vw - MARGIN - tw));

  return { top, left };
}

function applyTipPlacement(anchor: HTMLElement, tip: HTMLElement) {
  const mobile = isMobileShellUi();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  tip.style.display = "block";
  tip.style.visibility = "hidden";
  tip.style.position = "fixed";
  tip.style.top = "0px";
  tip.style.left = "0px";
  tip.style.zIndex = mobile ? "220" : "70";
  tip.setAttribute("data-anchored-tip", "");

  if (mobile) {
    tip.style.maxWidth = `${Math.min(360, vw - MARGIN * 2)}px`;
    tip.style.maxHeight = `${Math.min(Math.floor(vh * 0.5), vh - MARGIN * 2)}px`;
    tip.style.overflow = "auto";
    tip.style.pointerEvents = "auto";
    tip.style.setProperty("-webkit-overflow-scrolling", "touch");
  } else {
    tip.style.maxWidth = "";
    tip.style.maxHeight = "";
    tip.style.overflow = "";
    tip.style.pointerEvents = "none";
  }

  const pos = placeTip(anchor, tip);
  tip.style.visibility = "visible";
  tip.style.top = `${pos.top}px`;
  tip.style.left = `${pos.left}px`;
}

/** Prefer above the anchor; clamp into the viewport and cap height so content scrolls inside. */
function applyPanelPlacement(
  anchor: HTMLElement,
  panel: HTMLElement,
  prefer: "above" | "below",
  maxWidth: number,
) {
  const ar = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(maxWidth, vw - MARGIN * 2);

  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.position = "fixed";
  panel.style.visibility = "hidden";
  panel.style.zIndex = "80";
  panel.style.width = `${width}px`;
  panel.style.maxWidth = `${width}px`;
  panel.style.top = "0px";
  panel.style.left = "0px";
  panel.style.height = "auto";
  panel.style.maxHeight = "none";
  panel.style.overflow = "hidden";

  const spaceAbove = ar.top - MARGIN - PANEL_GAP;
  const spaceBelow = vh - ar.bottom - MARGIN - PANEL_GAP;
  let side: "above" | "below" = prefer;
  if (prefer === "above" && spaceAbove < 140 && spaceBelow > spaceAbove) side = "below";
  if (prefer === "below" && spaceBelow < 140 && spaceAbove > spaceBelow) side = "above";

  const avail = side === "above" ? spaceAbove : spaceBelow;
  const maxH = Math.max(120, Math.min(avail, Math.floor(vh * 0.7)));
  panel.style.maxHeight = `${maxH}px`;

  const layoutTh = Math.min(panel.scrollHeight, maxH);
  panel.style.height = `${layoutTh}px`;
  const panelBox = panel.getBoundingClientRect();
  const th = panelBox.height || layoutTh;
  const tw = panelBox.width || panel.offsetWidth;

  let top = side === "above" ? ar.top - PANEL_GAP - th : ar.bottom + PANEL_GAP;
  top = Math.max(MARGIN, Math.min(top, vh - MARGIN - th));

  // Right-align with deck zone (panels sit on the right edge of the board).
  let left = ar.right - tw;
  left = Math.max(MARGIN, Math.min(left, vw - MARGIN - tw));

  panel.style.visibility = "visible";
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

/** Fixed, viewport-clamped tooltip portal. Keeps tips inside the view (no horizontal scroll). */
export function AnchoredTip({
  open,
  anchorRef,
  className,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const tipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    const anchor = anchorRef.current;
    if (!tip) return;
    if (!open || !anchor) {
      tip.style.display = "none";
      return;
    }
    applyTipPlacement(anchor, tip);
  }, [open, anchorRef, children]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const tip = tipRef.current;
      const anchor = anchorRef.current;
      if (!tip || !anchor) return;
      applyTipPlacement(anchor, tip);
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, anchorRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <span ref={tipRef} className={className} role="tooltip" style={{ display: "none" }}>
      {children}
    </span>,
    document.body,
  );
}

/** Interactive fixed panel (e.g. deck tracker) clamped inside the viewport. */
export function AnchoredPanel({
  open,
  anchorRef,
  panelRef,
  className,
  prefer = "above",
  maxWidth = 320,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  prefer?: "above" | "below";
  maxWidth?: number;
  children: ReactNode;
}) {
  const localRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = localRef.current;
    const anchor = anchorRef.current;
    if (!panel) return;
    if (!open || !anchor) {
      panel.style.display = "none";
      return;
    }
    applyPanelPlacement(anchor, panel, prefer, maxWidth);
  }, [open, anchorRef, prefer, maxWidth, children]);

  useEffect(() => {
    if (!open) return;
    const panel = localRef.current;
    const reposition = () => {
      const anchor = anchorRef.current;
      if (!panel || !anchor) return;
      applyPanelPlacement(anchor, panel, prefer, maxWidth);
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    const ro = panel ? new ResizeObserver(reposition) : null;
    if (panel && ro) ro.observe(panel);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      ro?.disconnect();
    };
  }, [open, anchorRef, prefer, maxWidth]);

  useEffect(() => {
    if (!panelRef) return;
    panelRef.current = localRef.current;
    return () => {
      panelRef.current = null;
    };
  });

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div ref={localRef} className={className} style={{ display: "none" }}>
      {children}
    </div>,
    document.body,
  );
}

/** Opens an AnchoredTip — hover on desktop, tap + outside-dismiss on `/m` mobile shell. */
export function TipHost({
  className,
  tipClassName,
  tip,
  children,
  ...rest
}: {
  className?: string;
  tipClassName: string;
  tip: ReactNode;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const mobile = isMobileShellUi();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open || !mobile) {
      releaseExclusiveTip(close);
      return;
    }
    claimExclusiveTip(close);
    const onPointerDown = (event: PointerEvent) => {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (ref.current?.contains(t)) return;
      if (t instanceof Element && t.closest("[data-anchored-tip]")) return;
      setOpen(false);
    };
    // Capture so we close even when a scroll pane eats the bubble.
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      releaseExclusiveTip(close);
    };
  }, [open, mobile, close]);

  return (
    <span
      {...rest}
      ref={ref}
      className={className}
      onMouseEnter={(e) => {
        rest.onMouseEnter?.(e);
        if (!isMobileShellUi()) setOpen(true);
      }}
      onMouseLeave={(e) => {
        rest.onMouseLeave?.(e);
        if (!isMobileShellUi()) setOpen(false);
      }}
      onFocus={(e) => {
        rest.onFocus?.(e);
        if (!isMobileShellUi()) setOpen(true);
      }}
      onBlur={(e) => {
        rest.onBlur?.(e);
        if (!isMobileShellUi()) setOpen(false);
      }}
      onClick={(e) => {
        rest.onClick?.(e);
        if (!isMobileShellUi()) return;
        e.preventDefault();
        e.stopPropagation();
        if (rest["data-atk-aim"]) return;
        setOpen((v) => !v);
      }}
    >
      {children}
      <AnchoredTip open={open} anchorRef={ref} className={tipClassName}>
        {tip}
      </AnchoredTip>
    </span>
  );
}
