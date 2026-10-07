/** Single top-down sprites (jets, etc.). Not tank hull/turret and not squad blobs. */

import { TUTORIAL_SPRITE_ALIAS } from "./tutorialUnits";

export type SpriteTailSpec = {
  src: string;
  /** Local attach on the body, relative to the craft pivot. +y is rear. */
  attachX: number;
  attachY: number;
  width: number;
  height: number;
  /** Pixel-whip segments (Stealthray). False = render `src` as a rigid boom. */
  whip?: boolean;
};

/** Spinning rotor disc. Paint the heli body without blades; this overlay is the rotor. */
export type SpriteRotorSpec = {
  /** Local attach vs pivot. +y is rear. */
  x: number;
  y: number;
  /** Disc radius in sprite pixels. */
  size: number;
  ccw?: boolean;
  inWing?: boolean;
};

export type SpriteArtSpec = {
  src: string;
  box: number;
  pivotX: number;
  pivotY: number;
  /** Visual scale vs the box (e.g. 0.8 for helicopters). */
  scale?: number;
  tail?: SpriteTailSpec;
  rotor?: SpriteRotorSpec;
  rotors?: SpriteRotorSpec[];
};

export function rotorsOf(spec: SpriteArtSpec): SpriteRotorSpec[] {
  if (spec.rotors?.length) return spec.rotors;
  return spec.rotor ? [spec.rotor] : [];
}

export function rotorStreaks(size: number): { x1: number; y1: number; x2: number; y2: number; dim: boolean }[] {
  return [
    { x1: -size, y1: 0, x2: size, y2: 0, dim: false },
    { x1: 0, y1: -size * 0.92, x2: 0, y2: size * 0.92, dim: true },
  ];
}

export const SPRITE_ART: Record<number, SpriteArtSpec> = {
  26: {
    src: "/units-art/air/stealthray-bomber.svg",
    box: 96,
    pivotX: 48,
    pivotY: 40,
    tail: {
      src: "/units-art/air/stealthray-tail.svg",
      attachX: 0,
      attachY: 16,
      width: 15,
      height: 33,
    },
  },
  25: {
    src: "/units-art/air/tempest-2.svg",
    box: 96,
    pivotX: 48,
    pivotY: 46,
  },
  27: {
    src: "/units-art/air/komet-2.svg",
    box: 96,
    pivotX: 48,
    pivotY: 46,
  },
  9: {
    src: "/units-art/air/falcon.svg",
    box: 96,
    pivotX: 48,
    pivotY: 50,
    scale: 0.8,
    rotors: [
      { x: -37, y: -3, size: 8.5, inWing: true },
      { x: 36, y: -3, size: 8.5, inWing: true, ccw: true },
    ],
  },
  8: {
    src: "/units-art/air/hornet.svg",
    box: 96,
    pivotX: 48,
    pivotY: 50,
    scale: 0.8,
    rotor: { x: 0, y: -8, size: 34 },
  },
  7: {
    src: "/units-art/air/viper.svg",
    box: 96,
    pivotX: 48,
    pivotY: 50,
    scale: 0.8,
    tail: {
      src: "/units-art/air/viper-tail.svg",
      attachX: 0,
      attachY: 42,
      width: 19,
      height: 48,
      whip: false,
    },
    rotors: [
      { x: -34, y: -8, size: 20 },
      { x: 34, y: -8, size: 20, ccw: true },
    ],
  },
};

export function getSpriteArt(id: number | undefined): SpriteArtSpec | undefined {
  if (id == null) return undefined;
  return SPRITE_ART[id] ?? SPRITE_ART[TUTORIAL_SPRITE_ALIAS[id]];
}

/** Tail lags opposite the turn, then eases straight. */
export function tailLagFromTurn(deltaDeg: number): number {
  return Math.max(-36, Math.min(36, -deltaDeg * 0.5));
}

export const STEALTHRAY_TAIL_CELL = 3;

/** Straight pixel whip unless turning — tip lags opposite the yaw. */
export function pixelTailCells(
  rows: number,
  cell: number,
  bendDeg: number,
  moving: boolean,
): { x: number; y: number }[] {
  return Array.from({ length: rows }, (_, i) => {
    const t = rows <= 1 ? 0 : i / (rows - 1);
    let ox = 0;
    if (moving && bendDeg !== 0) {
      const lag = Math.sin((bendDeg * Math.PI) / 180) * t * rows * cell * 0.85;
      ox = Math.round(lag / cell) * cell;
    }
    return { x: ox, y: i * cell };
  });
}
