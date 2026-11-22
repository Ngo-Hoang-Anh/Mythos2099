import type { UnitDisplayType } from "../engine/types";
import { TUTORIAL_ART_ALIAS, TUTORIAL_SPRITE_ALIAS } from "./tutorialUnits";

export type IsoDir = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type IsoFrameRect = { x: number; y: number; w: number; h: number };

export type IsoArtSpec = {
  displayType: "isometric";
  src: string;
  atlasW: number;
  atlasH: number;
  /** Left→right frame compass order on the sheet. */
  dirs: IsoDir[];
  frames: IsoFrameRect[];
  /** Draw box in the unit portrait (px). */
  box?: number;
};

/** Game facingDeg: 0 = North (up), 90 = East (right). */
const FACING_DIRS: IsoDir[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Static UI / catalog portraits — southeast isometric view. */
export const ISO_STATIC_FACING_DEG = 135;

/** Packed ToolBuddy / iso-preview row: 8×256 cells with 4px border + gap. */
function packedRow8(frame = 256, pad = 4, gap = 4): IsoFrameRect[] {
  return Array.from({ length: 8 }, (_, i) => ({
    x: pad + i * (frame + gap),
    y: pad,
    w: frame,
    h: frame,
  }));
}

/**
 * Shared left→right order for ToolBuddy / units-isometric sheets:
 * SE, E, NE, N, NW, W, SW, S
 */
const STANDARD_ISO_DIRS: IsoDir[] = ["SE", "E", "NE", "N", "NW", "W", "SW", "S"];

function isoSheet(src: string): IsoArtSpec {
  return {
    displayType: "isometric",
    src,
    atlasW: 4096,
    atlasH: 512,
    dirs: STANDARD_ISO_DIRS,
    frames: packedRow8(),
    box: 92,
  };
}

export const ISO_ART: Record<number, IsoArtSpec> = {
  1: isoSheet("/units-isometric/tank/zeus.png"),
  29: isoSheet("/units-isometric/light-vehicle/baihu.png"),
  30: isoSheet("/units-isometric/robot/pandora.png"),
  31: isoSheet("/units-isometric/infantry/excalibur.png"),
  32: isoSheet("/units-isometric/artilery/longinus.png"),
  33: isoSheet("/units-isometric/tank/thor.png"),
  34: isoSheet("/units-isometric/jet/artemis.png"),
  35: isoSheet("/units-isometric/helicopter/agni.png"),
};

export function getIsoArt(id: number | undefined): IsoArtSpec | undefined {
  if (id == null) return undefined;
  return (
    ISO_ART[id] ??
    ISO_ART[TUTORIAL_ART_ALIAS[id]] ??
    ISO_ART[TUTORIAL_SPRITE_ALIAS[id]]
  );
}

export function getUnitDisplayType(id: number | undefined): UnitDisplayType {
  return getIsoArt(id) ? "isometric" : "2d";
}

/** Pick sheet frame for a board facing (degrees). */
export function isoFrameIndex(facingDeg: number, dirs: IsoDir[]): number {
  const a = ((facingDeg % 360) + 360) % 360;
  const sector = Math.round(a / 45) % 8;
  const want = FACING_DIRS[sector]!;
  const idx = dirs.indexOf(want);
  return idx >= 0 ? idx : 0;
}
