import { describe, expect, it } from "vitest";
import { isMobilePath, mobileShellHref, mobileShellRedirectHref } from "./shell";

describe("isMobilePath", () => {
  it("matches /m and nested paths", () => {
    expect(isMobilePath("/m")).toBe(true);
    expect(isMobilePath("/m/")).toBe(true);
    expect(isMobilePath("/m/anything")).toBe(true);
    expect(isMobilePath("/")).toBe(false);
    expect(isMobilePath("/lobby")).toBe(false);
  });
});

describe("mobileShellHref", () => {
  it("keeps query and hash", () => {
    expect(mobileShellHref("?x=1", "#y")).toBe("/m?x=1#y");
  });
});

describe("mobileShellRedirectHref", () => {
  it("sends mobile clients on / to /m", () => {
    expect(mobileShellRedirectHref(true, { pathname: "/", search: "?a=1", hash: "" })).toBe(
      "/m?a=1",
    );
  });

  it("skips desktop and clients already on /m", () => {
    expect(mobileShellRedirectHref(false, { pathname: "/", search: "", hash: "" })).toBeNull();
    expect(mobileShellRedirectHref(true, { pathname: "/m", search: "", hash: "" })).toBeNull();
  });
});
