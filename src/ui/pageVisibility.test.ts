import { describe, expect, it, vi } from "vitest";
import { isPageHidden, onPageHidden, type PageVisibilityTarget } from "./pageVisibility";

function fakeDoc(hidden: boolean): PageVisibilityTarget & { setHidden(next: boolean): void } {
  const listeners = new Set<() => void>();
  const doc: PageVisibilityTarget & { setHidden(next: boolean): void } = {
    hidden,
    addEventListener(_type, listener) {
      listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener);
    },
    setHidden(next) {
      doc.hidden = next;
      for (const listener of listeners) listener();
    },
  };
  return doc;
}

describe("pageVisibility", () => {
  it("treats a missing document as visible", () => {
    expect(isPageHidden(undefined)).toBe(false);
  });

  it("acks immediately when the tab is already in the background", () => {
    const callback = vi.fn();
    onPageHidden(callback, fakeDoc(true));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("acks when the tab is backgrounded later", () => {
    const doc = fakeDoc(false);
    const callback = vi.fn();
    const stop = onPageHidden(callback, doc);
    expect(callback).not.toHaveBeenCalled();
    doc.setHidden(true);
    expect(callback).toHaveBeenCalledTimes(1);
    stop();
    doc.setHidden(false);
    doc.setHidden(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
