const STORAGE_KEY = "mythos.isoPreview.remapCache.v1";

export type RemapMap = number[]; // length 8, values 0..7

type CacheState = {
  lastPackId: string;
  remaps: Record<string, RemapMap>;
};

const IDENTITY: RemapMap = [0, 1, 2, 3, 4, 5, 6, 7];

function isRemapMap(value: unknown): value is RemapMap {
  if (!Array.isArray(value) || value.length !== 8) return false;
  const seen = new Set<number>();
  for (const n of value) {
    if (!Number.isInteger(n) || n < 0 || n > 7 || seen.has(n)) return false;
    seen.add(n);
  }
  return true;
}

function readCache(): CacheState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastPackId: "", remaps: {} };
    const parsed = JSON.parse(raw) as Partial<CacheState>;
    const remaps: Record<string, RemapMap> = {};
    if (parsed.remaps && typeof parsed.remaps === "object") {
      for (const [id, map] of Object.entries(parsed.remaps)) {
        if (isRemapMap(map)) remaps[id] = map;
      }
    }
    return {
      lastPackId: typeof parsed.lastPackId === "string" ? parsed.lastPackId : "",
      remaps,
    };
  } catch {
    return { lastPackId: "", remaps: {} };
  }
}

function writeCache(state: CacheState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadCachedPackId(fallback: string): string {
  const { lastPackId } = readCache();
  return lastPackId || fallback;
}

export function loadRemap(packId: string): RemapMap {
  const { remaps } = readCache();
  return remaps[packId] ? [...remaps[packId]!] : [...IDENTITY];
}

export function saveRemap(packId: string, remap: RemapMap) {
  if (!isRemapMap(remap)) return;
  const state = readCache();
  state.lastPackId = packId;
  state.remaps[packId] = [...remap];
  writeCache(state);
}

export function saveLastPackId(packId: string) {
  const state = readCache();
  state.lastPackId = packId;
  writeCache(state);
}

export function clearRemap(packId: string) {
  const state = readCache();
  delete state.remaps[packId];
  writeCache(state);
}

export function hasCachedRemap(packId: string): boolean {
  const map = readCache().remaps[packId];
  if (!map) return false;
  return map.some((v, i) => v !== i);
}

export function identityRemap(): RemapMap {
  return [...IDENTITY];
}
