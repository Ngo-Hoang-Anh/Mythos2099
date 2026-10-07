/** Ensures only one tap-tip is open at a time (mobile shell). */
let activeClose: (() => void) | null = null;

export function claimExclusiveTip(close: () => void): void {
  if (activeClose && activeClose !== close) activeClose();
  activeClose = close;
}

export function releaseExclusiveTip(close: () => void): void {
  if (activeClose === close) activeClose = null;
}

export function isMobileShellUi(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("is-mobile-shell");
}
