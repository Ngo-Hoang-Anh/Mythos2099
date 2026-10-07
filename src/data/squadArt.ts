/** Composed squad art. Sprites live in `public/units-art/squads`; swap the files (or `src`) to replace placeholders. */

const INF = "/units-art/squads/infantry";
const BIKE = "/units-art/squads/motorcycles";

export const SQUAD_PROP_FADE_DELAY_MS = 5000;
export const SQUAD_PROP_FADE_DURATION_MS = 5000;
export const SQUAD_PROP_FADE_TOTAL_MS = SQUAD_PROP_FADE_DELAY_MS + SQUAD_PROP_FADE_DURATION_MS;

export type SquadKind = "breacher" | "trench" | "medic" | "bikes" | "drones";

export type SquadMemberRole = "rifle" | "heavy" | "mg" | "medic" | "bike" | "drone";

export type SquadPos = { x: number; y: number };

export type SquadPieceSpec = {
  src: string;
  width: number;
  height: number;
  /** Pivot on the sprite (px from top-left). Placed on blob/parked. */
  originX: number;
  originY: number;
  blob: SquadPos;
  parked: SquadPos;
  role: SquadMemberRole;
  firesBullet: boolean;
  shotScale: number;
  /** Local gun muzzle relative to the pivot (negative Y = forward). */
  tipX: number;
  tipY: number;
  /** Optional running pose (gun across the body). */
  runSrc?: string;
  scaleWhenEntrenched?: number;
};

export type SquadPropSpec = {
  src: string;
  width: number;
  height: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
};

export type SquadArtSpec = {
  kind: SquadKind;
  entrench?: boolean;
  pieces: SquadPieceSpec[];
  props?: SquadPropSpec[];
};

const SOLDIER = { width: 32, height: 40, originX: 16, originY: 24 } as const;
const CYCLE = { width: 24, height: 34, originX: 12, originY: 17 } as const;
const DRONE = { width: 28, height: 28, originX: 14, originY: 14 } as const;
/** Infantry mechs match bike footprint. */
const MECH = CYCLE;

function piece(
  src: string,
  role: SquadMemberRole,
  blob: SquadPos,
  parked: SquadPos,
  extra: Partial<Pick<SquadPieceSpec, "firesBullet" | "shotScale" | "tipX" | "tipY" | "runSrc" | "scaleWhenEntrenched">> & {
    size?: { width: number; height: number; originX: number; originY: number };
  } = {},
): SquadPieceSpec {
  const size = extra.size ?? SOLDIER;
  return {
    src,
    ...size,
    blob,
    parked,
    role,
    firesBullet: extra.firesBullet ?? false,
    shotScale: extra.shotScale ?? 0,
    tipX: extra.tipX ?? 0,
    tipY: extra.tipY ?? 0,
    runSrc: extra.runSrc,
    scaleWhenEntrenched: extra.scaleWhenEntrenched,
  };
}

const BIKE_TRIANGLE: SquadPos[] = [
  { x: 0, y: -18 },
  { x: -20, y: 16 },
  { x: 20, y: 16 },
];

function bikes(file: string): SquadArtSpec {
  const src = `${BIKE}/${file}`;
  return {
    kind: "bikes",
    pieces: BIKE_TRIANGLE.map((pos) =>
      piece(src, "bike", pos, pos, { size: CYCLE, shotScale: 0.25, tipX: 0, tipY: -15 }),
    ),
  };
}

const SQUAD_4: SquadPos[] = [
  { x: 0, y: -24 },
  { x: -24, y: 0 },
  { x: 24, y: 0 },
  { x: 0, y: 24 },
];

/** Five-ship diamond: forward / left / center / right / rear. */
const DRONE_DIAMOND: SquadPos[] = [
  { x: 0, y: -28 },
  { x: -28, y: 0 },
  { x: 0, y: 0 },
  { x: 28, y: 0 },
  { x: 0, y: 28 },
];

function drones(file: string): SquadArtSpec {
  const src = `/units-art/drone/${file}`;
  return {
    kind: "drones",
    pieces: DRONE_DIAMOND.map((pos) =>
      piece(src, "drone", pos, pos, { size: DRONE, firesBullet: true, shotScale: 0.25, tipX: 0, tipY: -12 }),
    ),
  };
}

function infantryMechs(
  kind: SquadKind,
  file: string,
  role: SquadMemberRole,
  extra: Partial<Pick<SquadPieceSpec, "firesBullet" | "shotScale" | "tipX" | "tipY" | "scaleWhenEntrenched">> & {
    entrench?: boolean;
    /** Indices that spawn flying bullets (breacher heavies). */
    bulletAt?: number[];
  } = {},
): SquadArtSpec {
  const src = `${INF}/${file}`;
  const bulletAt = new Set(extra.bulletAt ?? []);
  return {
    kind,
    entrench: extra.entrench,
    pieces: SQUAD_4.map((pos, i) =>
      piece(src, role, pos, pos, {
        size: MECH,
        firesBullet: bulletAt.has(i),
        shotScale: extra.shotScale ?? 0.25,
        tipX: extra.tipX ?? 0,
        tipY: extra.tipY ?? -15,
        scaleWhenEntrenched: extra.scaleWhenEntrenched,
      }),
    ),
  };
}

export const SQUAD_ART: Record<number, SquadArtSpec> = {
  16: infantryMechs("breacher", "breacher-mech.png", "heavy", {
    shotScale: 0.5,
    tipX: 0,
    tipY: -15,
    bulletAt: [0, 3],
  }),
  17: infantryMechs("trench", "trench-mech.png", "mg", {
    entrench: true,
    shotScale: 1 / 3,
    tipX: 0,
    tipY: -15,
    scaleWhenEntrenched: 0.92,
  }),
  18: infantryMechs("medic", "medic-mech.png", "medic", {
    shotScale: 0.25,
    tipX: 0,
    tipY: -15,
  }),
  19: bikes("bike-blue.png"),
  20: bikes("bike-red.png"),
  21: bikes("bike-sand.png"),
  22: drones("recon.svg"),
  24: drones("aegis.svg"),
  23: drones("kamikaze.svg"),
};

export function getSquadArt(id: number | undefined): SquadArtSpec | undefined {
  if (id == null) return undefined;
  return SQUAD_ART[id];
}

export function hasFormationDeploy(id: number | undefined): boolean {
  const spec = getSquadArt(id);
  if (!spec) return false;
  if (spec.props && spec.props.length > 0) return true;
  return spec.pieces.some((p) => p.blob.x !== p.parked.x || p.blob.y !== p.parked.y);
}
