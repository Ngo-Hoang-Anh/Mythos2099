import { beforeEach, describe, expect, it } from "vitest";
import { PREMADE_ARMIES } from "./premadeArmies";
import {
  deleteCustomArmy,
  loadCustomArmies,
  MAX_CUSTOM_ARMIES,
  resetCustomArmies,
  saveCustomArmy,
} from "./customArmies";

const units = PREMADE_ARMIES.tank_robot.units;

function installMemoryStorage(): void {
  const store = new Map<string, string>();
  const memory: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memory,
    configurable: true,
    writable: true,
  });
}

describe("customArmies", () => {
  beforeEach(() => {
    installMemoryStorage();
    resetCustomArmies();
  });

  it("persists armies in localStorage", () => {
    const saved = saveCustomArmy({ name: "My Wall", units });
    expect(saved.ok).toBe(true);
    expect(loadCustomArmies()).toHaveLength(1);
    expect(loadCustomArmies()[0]?.name).toBe("My Wall");
    expect(loadCustomArmies()[0]?.units).toEqual(units);
  });

  it("caps at MAX_CUSTOM_ARMIES", () => {
    for (let i = 0; i < MAX_CUSTOM_ARMIES; i++) {
      const result = saveCustomArmy({ name: `Army ${i + 1}`, units });
      expect(result.ok).toBe(true);
    }
    const overflow = saveCustomArmy({ name: "Too many", units });
    expect(overflow.ok).toBe(false);
    expect(loadCustomArmies()).toHaveLength(MAX_CUSTOM_ARMIES);
  });

  it("updates an existing army by id", () => {
    const created = saveCustomArmy({ name: "Draft", units });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.armies[0]!.id;
    const nextUnits = PREMADE_ARMIES.aggro.units;
    const updated = saveCustomArmy({ id, name: "Aggro copy", units: nextUnits });
    expect(updated.ok).toBe(true);
    expect(loadCustomArmies()).toHaveLength(1);
    expect(loadCustomArmies()[0]).toMatchObject({ id, name: "Aggro copy", units: nextUnits });
  });

  it("deletes by id", () => {
    const created = saveCustomArmy({ name: "Temp", units });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.armies[0]!.id;
    expect(deleteCustomArmy(id)).toHaveLength(0);
    expect(loadCustomArmies()).toHaveLength(0);
  });

  it("rejects incomplete armies", () => {
    const result = saveCustomArmy({ name: "Nope", units: units.slice(0, 3) });
    expect(result.ok).toBe(false);
  });
});
