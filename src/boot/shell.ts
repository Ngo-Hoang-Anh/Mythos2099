/** Mobile shell path: `/m` or `/m/...` (lobby/play stay in React state for now). */
export function isMobilePath(pathname: string): boolean {
  return pathname === "/m" || pathname.startsWith("/m/");
}

export function mobileShellHref(search = "", hash = ""): string {
  return `/m${search}${hash}`;
}

export type RedirectTarget = {
  pathname: string;
  search: string;
  hash: string;
};

/**
 * Phone/tablet on desktop `/` → go to `/m`.
 * Returns the href to navigate to, or null if no redirect.
 */
export function mobileShellRedirectHref(
  mobileClient: boolean,
  loc: RedirectTarget,
): string | null {
  if (!mobileClient || isMobilePath(loc.pathname)) return null;
  return mobileShellHref(loc.search, loc.hash);
}
