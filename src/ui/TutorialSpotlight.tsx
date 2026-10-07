import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LessonHint } from "../tutorial/lessons";
import { TutorialKeywords } from "./TutorialHub";
import { SgBrackets, SgIconImg } from "./UiChrome";

type SpotRect = { top: number; left: number; width: number; height: number };

function roundRect(r: DOMRectReadOnly): SpotRect {
  return {
    top: Math.round(r.top),
    left: Math.round(r.left),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

function sameSpot(a: SpotRect | null, b: SpotRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/** Layout viewport size — same CSS px space as getBoundingClientRect / position:fixed. */
function layoutViewportSize(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

function overlapArea(a: SpotRect, b: SpotRect): number {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

export function TutorialSpotlight({
  hint,
  onNext,
}: {
  hint: LessonHint;
  onNext?: () => void;
}) {
  const [rect, setRect] = useState<SpotRect | null>(null);
  const [avoid, setAvoid] = useState<SpotRect | null>(null);
  const [cardSize, setCardSize] = useState<{ w: number; h: number }>({ w: 340, h: 240 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<SpotRect | null>(null);
  const avoidRef = useRef<SpotRect | null>(null);
  const missRef = useRef(0);

  useLayoutEffect(() => {
    let marked: Element | null = null;
    let raf = 0;
    let scrolled = false;

    const applyRect = (next: SpotRect | null) => {
      if (sameSpot(rectRef.current, next)) return;
      rectRef.current = next;
      setRect(next);
    };

    const applyAvoid = (next: SpotRect | null) => {
      if (sameSpot(avoidRef.current, next)) return;
      avoidRef.current = next;
      setAvoid(next);
    };

    const measure = () => {
      const el = document.querySelector(`[data-tut="${hint.anchor}"]`);
      if (marked && marked !== el) marked.removeAttribute("data-tut-spot");
      marked = el;
      if (el) el.setAttribute("data-tut-spot", "");

      if (!el) {
        // Keep the last hole for a few frames so layout churn does not blink it off.
        missRef.current += 1;
        if (missRef.current >= 4) {
          applyRect(null);
          applyAvoid(null);
        }
        return;
      }
      missRef.current = 0;

      const next = roundRect(el.getBoundingClientRect());
      if (next.width < 2 || next.height < 2) {
        missRef.current += 1;
        if (missRef.current >= 4) {
          applyRect(null);
          applyAvoid(null);
        }
        return;
      }
      applyRect(next);

      // Choice / reserve modals: keep the guide card off the whole dialog, not just the button.
      const dialog = el.closest(".choice-dialog, .reserve-dialog") as HTMLElement | null;
      applyAvoid(dialog ? roundRect(dialog.getBoundingClientRect()) : null);

      if (cardRef.current) {
        const cr = cardRef.current.getBoundingClientRect();
        if (cr.width > 0 && cr.height > 0) {
          const w = Math.round(cr.width);
          const h = Math.round(cr.height);
          setCardSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
        }
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };

    measure();
    if (!scrolled) {
      scrolled = true;
      const first = document.querySelector(`[data-tut="${hint.anchor}"]`);
      first?.scrollIntoView({ block: "nearest", inline: "nearest" });
      measure();
    }

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    const anchor = document.querySelector(`[data-tut="${hint.anchor}"]`);
    if (anchor && ro) {
      ro.observe(anchor);
      const dialog = (anchor as HTMLElement).closest(".choice-dialog, .reserve-dialog");
      if (dialog) ro.observe(dialog);
    }

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    // Slow fallback for animated targets; stable rect compare avoids re-render flash.
    const timer = window.setInterval(schedule, 480);

    return () => {
      marked?.removeAttribute("data-tut-spot");
      if (raf) window.cancelAnimationFrame(raf);
      window.clearInterval(timer);
      ro?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, [hint.anchor, hint.id]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const cr = cardRef.current.getBoundingClientRect();
    if (cr.width > 0 && cr.height > 0) {
      const w = Math.round(cr.width);
      const h = Math.round(cr.height);
      setCardSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    }
  }, [hint.id, hint.anchor, hint.body, hint.keywords?.length, hint.title]);

  const card = placeCard(rect, cardSize, avoid);
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="tut-spot tut-spot-layer" aria-live="polite">
      {rect ? (
        <div
          className="tut-spot-hole"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        >
          <SgBrackets />
        </div>
      ) : null}
      <div
        ref={cardRef}
        className={hint.next ? "tut-spot-card" : "tut-spot-card tut-spot-card-pass"}
        style={{
          top: card.top,
          left: card.left,
          maxWidth: `calc(var(--vw) - ${Math.max(16, 24)}px)`,
          maxHeight: `calc(var(--vh) - ${Math.max(16, 48)}px)`,
        }}
      >
        <p className="eyebrow">{hint.title}</p>
        <p>{hint.body}</p>
        {hint.keywords && hint.keywords.length > 0 ? <TutorialKeywords keywords={hint.keywords} /> : null}
        {hint.next && onNext ? (
          <button type="button" className="primary sg-btn-row" onClick={onNext}>
            <SgIconImg name="skip" tone="gold" size={20} />
            {hint.nextLabel ?? "Next"}
          </button>
        ) : (
          <small>Click or drag the highlighted spot</small>
        )}
      </div>
    </div>,
    document.body,
  );
}

type Candidate = {
  top: number;
  left: number;
  fits: boolean;
  overlap: number;
  dist: number;
  block: number;
};

function placeCard(
  rect: SpotRect | null,
  size: { w: number; h: number },
  avoid: SpotRect | null = null,
): { top: number; left: number } {
  const margin = 16;
  const gap = 12;
  const { width: vw, height: vh } = layoutViewportSize();
  // Prefer measured size; keep a modest floor so first paint is not huge.
  const cw = Math.min(Math.max(size.w, 200), vw - margin * 2);
  const ch = Math.min(Math.max(size.h, 96), vh - margin * 2);

  const clampInView = (t: number, l: number) => ({
    top: Math.max(margin, Math.min(vh - ch - margin, t)),
    left: Math.max(margin, Math.min(vw - cw - margin, l)),
  });

  if (!rect) {
    return clampInView(margin + 64, margin + 16);
  }

  const candidates: Candidate[] = [];
  const rcX = rect.left + rect.width / 2;
  const rcY = rect.top + rect.height / 2;
  const block = avoid ?? rect;
  const modal = avoid != null;

  function score(top: number, left: number): Candidate {
    const fitsTop = top >= margin && top + ch <= vh - margin;
    const fitsLeft = left >= margin && left + cw <= vw - margin;
    const fits = fitsTop && fitsLeft;
    const ctrX = left + cw / 2;
    const ctrY = top + ch / 2;
    const dist = (ctrX - rcX) ** 2 + (ctrY - rcY) ** 2;
    const clamped = clampInView(top, left);
    const visW = Math.max(0, Math.min(clamped.left + cw, vw - margin) - Math.max(clamped.left, margin));
    const visH = Math.max(0, Math.min(clamped.top + ch, vh - margin) - Math.max(clamped.top, margin));
    const cardBox = { top: clamped.top, left: clamped.left, width: cw, height: ch };
    return {
      top: clamped.top,
      left: clamped.left,
      fits,
      overlap: visW * visH,
      dist,
      block: overlapArea(cardBox, block),
    };
  }

  if (modal) {
    // Keep the guide clear of the whole dialog — sides first, then above/below.
    candidates.push(score(block.top, block.left - gap - cw));
    candidates.push(score(block.top, block.left + block.width + gap));
    candidates.push(score(block.top + (block.height - ch) / 2, block.left - gap - cw));
    candidates.push(score(block.top + (block.height - ch) / 2, block.left + block.width + gap));
    candidates.push(score(block.top - gap - ch, block.left + (block.width - cw) / 2));
    candidates.push(score(block.top + block.height + gap, block.left + (block.width - cw) / 2));
    // Corners of the dialog (still outside the box).
    candidates.push(score(block.top - gap - ch, block.left - gap - cw));
    candidates.push(score(block.top - gap - ch, block.left + block.width + gap));
    candidates.push(score(block.top + block.height + gap, block.left - gap - cw));
    candidates.push(score(block.top + block.height + gap, block.left + block.width + gap));
    // Last resort: top/bottom of the viewport, horizontally clear of the dialog center.
    candidates.push(score(margin, margin));
    candidates.push(score(margin, vw - margin - cw));
    candidates.push(score(vh - margin - ch, margin));
    candidates.push(score(vh - margin - ch, vw - margin - cw));
  } else {
    candidates.push(score(rect.top + rect.height / 2 - ch / 2, rect.left + rect.width + gap));
    candidates.push(score(rect.top + rect.height / 2 - ch / 2, rect.left - gap - cw));
    candidates.push(score(rect.top + rect.height + gap, rect.left + rect.width / 2 - cw / 2));
    candidates.push(score(rect.top - gap - ch, rect.left + rect.width / 2 - cw / 2));
  }

  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i];
    // Zero overlap with the dialog always wins over any partial cover.
    if (c.block === 0 && best.block > 0) {
      best = c;
      continue;
    }
    if (c.block > 0 && best.block === 0) continue;
    if (c.block < best.block) {
      best = c;
      continue;
    }
    if (c.block > best.block) continue;
    if (c.fits && !best.fits) {
      best = c;
      continue;
    }
    if (c.fits && best.fits) {
      if (c.dist < best.dist) best = c;
      continue;
    }
    if (!c.fits && !best.fits) {
      if (c.overlap > best.overlap) best = c;
      else if (c.overlap === best.overlap && c.dist < best.dist) best = c;
    }
  }
  return { top: best.top, left: best.left };
}
