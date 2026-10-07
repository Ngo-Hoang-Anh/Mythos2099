export type PageVisibilityTarget = {
  hidden: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
};

function defaultTarget(): PageVisibilityTarget | undefined {
  return typeof document !== "undefined" ? document : undefined;
}

export function isPageHidden(target: Pick<PageVisibilityTarget, "hidden"> | undefined = defaultTarget()): boolean {
  return Boolean(target?.hidden);
}

/** Fires now if the page is already hidden, then on later hide events. */
export function onPageHidden(callback: () => void, target: PageVisibilityTarget | undefined = defaultTarget()): () => void {
  if (!target) return () => {};
  const fire = () => {
    if (target.hidden) callback();
  };
  fire();
  target.addEventListener("visibilitychange", fire);
  return () => target.removeEventListener("visibilitychange", fire);
}
