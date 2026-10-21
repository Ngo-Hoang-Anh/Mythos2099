import { validateArmy } from "../engine/army";

export type CustomArmy = {
  id: string;
  name: string;
  units: number[];
};

export const MAX_CUSTOM_ARMIES = 5;
const KEY = "mythos2099-custom-armies-v1";
const NAME_MAX = 32;

function sanitizeName(name: string): string {
  return name.trim().slice(0, NAME_MAX);
}

function sanitizeArmy(raw: unknown): CustomArmy | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as { id?: unknown; name?: unknown; units?: unknown };
  const id = typeof item.id === "string" && item.id ? item.id : null;
  const name = typeof item.name === "string" ? sanitizeName(item.name) : "";
  const units = Array.isArray(item.units)
    ? item.units.filter((u): u is number => typeof u === "number" && Number.isInteger(u))
    : [];
  if (!id || !name) return null;
  if (validateArmy(units)) return null;
  return { id, name, units: [...units] };
}

function read(): CustomArmy[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: CustomArmy[] = [];
    for (const item of parsed) {
      const army = sanitizeArmy(item);
      if (!army) continue;
      out.push(army);
      if (out.length >= MAX_CUSTOM_ARMIES) break;
    }
    return out;
  } catch {
    return [];
  }
}

function write(armies: CustomArmy[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(armies.slice(0, MAX_CUSTOM_ARMIES)));
  } catch {
    /* private mode / quota — ignore */
  }
}

export function loadCustomArmies(): CustomArmy[] {
  return read();
}

export function saveCustomArmy(input: {
  name: string;
  units: number[];
  /** When set, overwrite that slot instead of creating a new one. */
  id?: string;
}): { ok: true; armies: CustomArmy[] } | { ok: false; error: string } {
  const name = sanitizeName(input.name);
  if (!name) return { ok: false, error: "Name your army" };
  const armyError = validateArmy(input.units);
  if (armyError) return { ok: false, error: armyError };

  const armies = read();
  if (input.id) {
    const idx = armies.findIndex((a) => a.id === input.id);
    if (idx < 0) return { ok: false, error: "Army not found" };
    armies[idx] = { id: input.id, name, units: [...input.units] };
    write(armies);
    return { ok: true, armies };
  }

  if (armies.length >= MAX_CUSTOM_ARMIES) {
    return { ok: false, error: `You can save up to ${MAX_CUSTOM_ARMIES} armies` };
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  armies.push({ id, name, units: [...input.units] });
  write(armies);
  return { ok: true, armies };
}

export function deleteCustomArmy(id: string): CustomArmy[] {
  const next = read().filter((a) => a.id !== id);
  write(next);
  return next;
}

/** Test helper — clears persisted custom armies. */
export function resetCustomArmies(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
