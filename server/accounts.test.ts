import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AccountStore, FAST_SCRYPT } from "./accounts";

describe("AccountStore", () => {
  it("registers, logs in, and rejects a duplicate username", () => {
    const store = new AccountStore(null, FAST_SCRYPT);
    const created = store.register("Alpha", "secret");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.account.username).toBe("Alpha");
    expect(created.account.token.length).toBeGreaterThan(8);
    const firstToken = created.account.token;

    const dup = store.register("alpha", "other");
    expect(dup).toEqual({ ok: false, error: "Username is taken" });

    const bad = store.login("Alpha", "nope");
    expect(bad.ok).toBe(false);

    const login = store.login("Alpha", "secret");
    expect(login.ok).toBe(true);
    if (!login.ok) return;
    expect(login.account.token).not.toBe(firstToken);
    expect(store.byToken(login.account.token)?.username).toBe("Alpha");
  });

  it("rejects short usernames", () => {
    const store = new AccountStore(null, FAST_SCRYPT);
    expect(store.register("ab", "secret")).toEqual({
      ok: false,
      error: "Username must be 3–16 letters, numbers, or _",
    });
  });

  it("creates in-memory guests that are not written to disk", () => {
    const dir = mkdtempSync(join(tmpdir(), "ml-acc-"));
    const path = join(dir, "accounts.json");
    const store = new AccountStore(path, FAST_SCRYPT);
    const guest = store.createGuest();
    expect(guest.guest).toBe(true);
    expect(guest.username.startsWith("Guest_")).toBe(true);
    expect(store.byToken(guest.token)?.id).toBe(guest.id);
    expect(existsSync(path)).toBe(false);

    store.register("Pilot", "secret");
    const raw = JSON.parse(readFileSync(path, "utf8")) as { users: { username: string; guest?: boolean }[] };
    expect(raw.users).toHaveLength(1);
    expect(raw.users[0]?.username).toBe("Pilot");
    expect(raw.users.every((user) => !user.guest)).toBe(true);
    expect(store.listGuests()).toHaveLength(1);
  });
});
