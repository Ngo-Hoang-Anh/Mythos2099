/** Composed top-down tank art. Coordinates are source pixels; sprites face up. */

import { TUTORIAL_ART_ALIAS } from "./tutorialUnits";

/** Per-unit pack: `public/units-art/tanks/{Name}/Hull_*.png` + `Gun_*.png` (256×256). */
const TANKS = "/units-art/tanks";

export type BarrelSpec = {
  src: string;
  width: number;
  height: number;
  /** Mount point on the barrel PNG (px from top-left). Guns rotate around this. */
  originX: number;
  originY: number;
};

export type TurretSpec = {
  /** Mount on the hull, px from hull top-left. */
  x: number;
  y: number;
  /** 0 = forward (up in the sprite), 180 = rear. */
  aim: number;
  barrels: BarrelSpec[];
};

export type PieceSpec = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LegSpec = PieceSpec & {
  side?: "left" | "right";
  /** Rear pair sits in the torso's bottom pocket; front is a vertical mirror. */
  end?: "front" | "rear";
  flipY?: boolean;
};

export type TankArtSpec = {
  kind: "standard" | "heavy" | "biped";
  hull: string;
  hullW: number;
  hullH: number;
  /** Torso draw box when `legs` is set; otherwise the hull fills the rig. */
  torsoX?: number;
  torsoY?: number;
  torsoW?: number;
  torsoH?: number;
  /** Hex / upper body the guns mount on. Yaws with the torso toward the enemy. */
  upper?: PieceSpec;
  /** Chassis plate under the torso. Stays with the legs so a stride cannot open a gap. */
  lower?: PieceSpec;
  /** Unit spin pivot on the hull (px). Heavy chassis is not turret-centered. */
  pivotX: number;
  pivotY: number;
  turrets: TurretSpec[];
  legs?: LegSpec[];
  /** Artillery batteries draw as two scaled hulls side by side. */
  pair?: boolean;
};

/** 256×256 hull + gun pack. Mount = hull socket; origin = gun rotation hole. */
function packTank(
  folder: string,
  hullFile: string,
  gunFile: string,
  mountX: number,
  mountY: number,
  originX: number,
  originY: number,
  kind: TankArtSpec["kind"] = "standard",
  pair = false,
): TankArtSpec {
  const dir = `${TANKS}/${folder}`;
  return {
    kind,
    hull: `${dir}/${hullFile}`,
    hullW: 256,
    hullH: 256,
    pivotX: 128,
    pivotY: 128,
    pair: pair || undefined,
    turrets: [
      {
        x: mountX,
        y: mountY,
        aim: 0,
        barrels: [
          {
            src: `${dir}/${gunFile}`,
            width: 256,
            height: 256,
            originX,
            originY,
          },
        ],
      },
    ],
  };
}

const ROBOT = "/units-art/robot/stalker";
const AEGIS = "/units-art/robot/aegis";
const IRONCLAD = "/units-art/robot/ironclad";

export const UNIT_ART: Record<number, TankArtSpec> = {
  // Socket (128,128) ↔ gun body hole (128,145) on 256 canvases.
  4: packTank("Jackal", "Hull_03.png", "Gun_03.png", 128, 128, 128, 145),
  // Socket (128,130) ↔ twin gun hole (128,146).
  5: packTank("Nomad", "Hull_04.png", "Gun_04.png", 128, 130, 128, 146),
  // Socket (128,151) ↔ gun body hole (128,145) on 256 canvases.
  6: packTank("Humvee", "Hull_08.png", "Gun_02.png", 128, 151, 128, 145),
  // Socket (128,150) ↔ gun mount hole (128,135).
  3: packTank("Bastion", "Hull_02.png", "Gun_08.png", 128, 150, 128, 135),
  // Twin gun on one mount; socket (128,152) ↔ turret body (128,146).
  1: packTank("Zeus", "Hull_05.png", "Gun_06.png", 128, 152, 128, 146),
  // Heavy quad-pod hull + twin turret; socket (128,124) ↔ (128,140).
  2: packTank("Apex", "Hull_01.png", "Gun_01.png", 128, 124, 128, 140, "heavy"),
  // Halftrack hull + twin missile pods; socket (128,122) ↔ launcher center (128,122).
  10: packTank("MLRS", "Hull_01.png", "Gun_01.png", 128, 122, 128, 122, "heavy"),
  // Scraped orange chassis + matching 1× barrel; socket (128,148) ↔ gun hole (128,148).
  11: packTank("Sentinel", "Hull_01.png", "Gun_01.png", 128, 148, 128, 148, "heavy"),
  // Mirrored artillery scrap; socket (128,142) ↔ twin-barrel origin (128,142).
  12: packTank("Siege", "Hull_01.png", "Gun_01.png", 128, 142, 128, 142, "heavy"),
  14: {
    kind: "biped",
    hull: `${ROBOT}/torso.png`,
    hullW: 84,
    hullH: 61,
    torsoX: 0,
    torsoY: 0,
    torsoW: 84,
    torsoH: 61,
    pivotX: 42,
    pivotY: 30,
    legs: [
      { src: `${ROBOT}/leg-left.png`, x: 0, y: 12, width: 14, height: 36 },
      { src: `${ROBOT}/leg-right.png`, x: 70, y: 12, width: 14, height: 36 },
    ],
    turrets: [],
  },
  13: {
    kind: "biped",
    hull: `${AEGIS}/torso.png`,
    hullW: 118,
    hullH: 103,
    torsoX: 0,
    torsoY: 0,
    torsoW: 118,
    torsoH: 103,
    pivotX: 59,
    pivotY: 48,
    legs: [
      { src: `${AEGIS}/leg-left.png`, x: 26, y: 53, width: 30, height: 50 },
      { src: `${AEGIS}/leg-right.png`, x: 62, y: 53, width: 30, height: 50 },
    ],
    turrets: [],
  },
  15: {
    kind: "biped",
    hull: `${IRONCLAD}/torso.png`,
    hullW: 116,
    hullH: 118,
    torsoX: 0,
    torsoY: 0,
    torsoW: 116,
    torsoH: 118,
    pivotX: 58,
    pivotY: 52,
    lower: { src: `${IRONCLAD}/hips.png`, x: 33, y: 57, width: 51, height: 40 },
    legs: [
      { src: `${IRONCLAD}/leg-left.png`, x: 8, y: 44, width: 34, height: 67, side: "left", end: "rear" },
      { src: `${IRONCLAD}/leg-right.png`, x: 71, y: 44, width: 34, height: 67, side: "right", end: "rear" },
      { src: `${IRONCLAD}/leg-left.png`, x: 8, y: 4, width: 34, height: 67, side: "left", end: "front" },
      { src: `${IRONCLAD}/leg-right.png`, x: 71, y: 4, width: 34, height: 67, side: "right", end: "front" },
    ],
    turrets: [],
  },
};

export function getUnitArt(id: number): TankArtSpec | undefined {
  return UNIT_ART[id] ?? UNIT_ART[TUTORIAL_ART_ALIAS[id]];
}

/** P1 faces right, P2 faces left. Portrait / catalog keep Kenney's native up. */
export function boardFacingDeg(owner: 0 | 1): number {
  return owner === 0 ? 90 : -90;
}
