export type AtlasFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AtlasData = {
  frames: Record<string, { frame: AtlasFrame; pivot?: { x: number; y: number } }>;
  atlases: { image: string; size: { width: number; height: number } }[];
};

export type DirLabel = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

/** Screen-space unit vectors for classic 2:1 isometric. */
export const ISO_MOVE: Record<DirLabel, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  NE: { x: 1, y: -0.5 },
  E: { x: 1, y: 0 },
  SE: { x: 1, y: 0.5 },
  S: { x: 0, y: 1 },
  SW: { x: -1, y: 0.5 },
  W: { x: -1, y: 0 },
  NW: { x: -1, y: -0.5 },
};

/**
 * Default mapping for these ToolBuddy packs (dir0..7), left→right on atlas.png:
 * SE, E, NE, N, NW, W, SW, S — same turn direction as a counterclockwise walk.
 */
export const DEFAULT_DIR_LABELS: DirLabel[] = ["SE", "E", "NE", "N", "NW", "W", "SW", "S"];

export type SheetPack = {
  id: string;
  label: string;
  atlasUrl: string;
  data: AtlasData;
};

const atlasModules = import.meta.glob<AtlasData>(
  "../../resource/isometric/Sheet/*/atlas.texturepacker.json",
  { eager: true, import: "default" },
);

const imageModules = import.meta.glob<string>(
  "../../resource/isometric/Sheet/*/atlas.png",
  { eager: true, query: "?url", import: "default" },
);

function folderFromGlobKey(key: string): string {
  const parts = key.replace(/\\/g, "/").split("/");
  const sheetIdx = parts.lastIndexOf("Sheet");
  return parts[sheetIdx + 1] ?? key;
}

function shortLabel(folder: string): string {
  return folder
    .replace(/-spritesheet(?:\s*\(\d+\))?$/i, "")
    .replace(/\s+by\s+.+$/i, "")
    .replace(/\s+-\s+[A-Za-z0-9_-]+$/i, "")
    .trim();
}

export function loadSheetPacks(): SheetPack[] {
  const byFolder = new Map<string, Partial<SheetPack>>();

  for (const [key, data] of Object.entries(atlasModules)) {
    const id = folderFromGlobKey(key);
    const entry = byFolder.get(id) ?? { id, label: shortLabel(id) };
    entry.data = data;
    byFolder.set(id, entry);
  }

  for (const [key, url] of Object.entries(imageModules)) {
    const id = folderFromGlobKey(key);
    const entry = byFolder.get(id) ?? { id, label: shortLabel(id) };
    entry.atlasUrl = url;
    byFolder.set(id, entry);
  }

  return [...byFolder.values()]
    .filter((p): p is SheetPack => Boolean(p.id && p.label && p.atlasUrl && p.data))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function frameForDir(data: AtlasData, dir: number, frame = 0): AtlasFrame | null {
  const key = `static_dir${dir}_frame${frame}`;
  return data.frames[key]?.frame ?? null;
}
