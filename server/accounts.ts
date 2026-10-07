import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface Account {
  id: string;
  username: string;
  passwordHash: string;
  token: string;
  /** Ephemeral playtester account — kept in memory only, never written to disk. */
  guest?: boolean;
}

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
  keyLen: number;
}

const DEFAULT_SCRYPT: ScryptParams = { N: 16384, r: 8, p: 1, keyLen: 32 };
export const FAST_SCRYPT: ScryptParams = { N: 16, r: 8, p: 1, keyLen: 32 };

const USERNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim();
}

export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (!USERNAME_RE.test(username)) return "Username must be 3–16 letters, numbers, or _";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 4) return "Password must be at least 4 characters";
  if (password.length > 72) return "Password is too long";
  return null;
}

function hashPassword(password: string, params: ScryptParams, salt = randomBytes(16)): string {
  const hash = scryptSync(password, salt, params.keyLen, { N: params.N, r: params.r, p: params.p });
  return `${params.N}:${params.r}:${params.p}:${params.keyLen}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 6) return false;
  const N = Number(parts[0]);
  const r = Number(parts[1]);
  const p = Number(parts[2]);
  const keyLen = Number(parts[3]);
  const salt = Buffer.from(parts[4]!, "hex");
  const expected = Buffer.from(parts[5]!, "hex");
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !Number.isFinite(keyLen)) return false;
  const actual = scryptSync(password, salt, keyLen, { N, r, p });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function newId(): string {
  return randomBytes(12).toString("hex");
}

function newToken(): string {
  return randomBytes(24).toString("hex");
}

export class AccountStore {
  private users: Account[] = [];

  constructor(
    private readonly filePath: string | null = null,
    private readonly scrypt: ScryptParams = DEFAULT_SCRYPT,
  ) {
    this.load();
  }

  private load(): void {
    if (!this.filePath) return;
    try {
      const raw = readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as { users?: Account[] };
      this.users = parsed.users ?? [];
    } catch {
      this.users = [];
    }
  }

  private save(): void {
    if (!this.filePath) return;
    mkdirSync(dirname(this.filePath), { recursive: true });
    const durable = this.users.filter((user) => !user.guest);
    writeFileSync(this.filePath, JSON.stringify({ users: durable }, null, 2));
  }

  createGuest(): Account {
    let username = "";
    for (let i = 0; i < 20; i++) {
      username = `Guest_${randomBytes(3).toString("hex").slice(0, 4).toUpperCase()}`;
      if (!this.byUsername(username)) break;
    }
    const account: Account = {
      id: newId(),
      username,
      passwordHash: "",
      token: newToken(),
      guest: true,
    };
    this.users.push(account);
    return account;
  }

  removeGuest(id: string): void {
    const account = this.byId(id);
    if (!account?.guest) return;
    this.users = this.users.filter((user) => user.id !== id);
  }

  byId(id: string): Account | undefined {
    return this.users.find((user) => user.id === id);
  }

  byUsername(username: string): Account | undefined {
    const key = normalizeUsername(username).toLowerCase();
    return this.users.find((user) => user.username.toLowerCase() === key);
  }

  byToken(token: string): Account | undefined {
    if (!token) return undefined;
    return this.users.find((user) => user.token === token);
  }

  listGuests(): Account[] {
    return this.users.filter((user) => user.guest);
  }

  register(usernameRaw: string, password: string): { ok: true; account: Account } | { ok: false; error: string } {
    const usernameError = validateUsername(usernameRaw);
    if (usernameError) return { ok: false, error: usernameError };
    const passwordError = validatePassword(password);
    if (passwordError) return { ok: false, error: passwordError };
    const username = normalizeUsername(usernameRaw);
    if (this.byUsername(username)) return { ok: false, error: "Username is taken" };
    const account: Account = {
      id: newId(),
      username,
      passwordHash: hashPassword(password, this.scrypt),
      token: newToken(),
    };
    this.users.push(account);
    this.save();
    return { ok: true, account };
  }

  login(usernameRaw: string, password: string): { ok: true; account: Account } | { ok: false; error: string } {
    const account = this.byUsername(usernameRaw);
    if (!account || !verifyPassword(password, account.passwordHash)) {
      return { ok: false, error: "Invalid username or password" };
    }
    account.token = newToken();
    this.save();
    return { ok: true, account };
  }
}
