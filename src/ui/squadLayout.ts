import { bulletHeight, shotHeight } from "../data/combatFx";
import { getSquadArt, hasFormationDeploy as specHasFormation, type SquadArtSpec, type SquadKind, type SquadMemberRole } from "../data/squadArt";

export type { SquadKind, SquadMemberRole };

export type SquadMember = {
  id: string;
  x: number;
  y: number;
  role: SquadMemberRole;
  src: string;
  width: number;
  height: number;
  originX: number;
  originY: number;
  firesBullet: boolean;
  shotScale: number;
  tipX: number;
  tipY: number;
  scale: number;
};

export type SquadProp = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
};

export type SquadLayout = {
  kind: SquadKind;
  members: SquadMember[];
  props: SquadProp[];
  entrench: boolean;
};

const THIN_SHOT = shotHeight(0);
const RED1_BULLET = bulletHeight(0);

export function tankThinShotH(): number {
  return THIN_SHOT;
}

export function tankRed1BulletH(): number {
  return RED1_BULLET;
}

export function squadKindOf(defId: number | undefined): SquadKind | undefined {
  return getSquadArt(defId)?.kind;
}

function fromSpec(spec: SquadArtSpec, deployed: boolean, running: boolean): SquadLayout {
  return {
    kind: spec.kind,
    entrench: Boolean(spec.entrench) && deployed && !running,
    props: deployed && !running ? spec.props ?? [] : [],
    members: spec.pieces.map((p, i) => {
      const pos = deployed && !running ? p.parked : p.blob;
      return {
        id: `s${i}`,
        x: pos.x,
        y: pos.y,
        role: p.role,
        src: running && p.runSrc ? p.runSrc : p.src,
        width: p.width,
        height: p.height,
        originX: p.originX,
        originY: p.originY,
        firesBullet: p.firesBullet,
        shotScale: p.shotScale,
        tipX: p.tipX,
        tipY: p.tipY,
        scale: deployed && !running && spec.entrench && p.scaleWhenEntrenched ? p.scaleWhenEntrenched : 1,
      };
    }),
  };
}

export function squadLayout(defId: number | undefined, deployed: boolean, running = false): SquadLayout | null {
  const spec = getSquadArt(defId);
  if (!spec) return null;
  return fromSpec(spec, deployed, running);
}

/** Rotate a local (x,y) where -y is forward (up), clockwise-positive degrees matching CSS/SVG. */
export function rotateOffset(x: number, y: number, facingDeg: number): { x: number; y: number } {
  const rad = (facingDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: x * c - y * s, y: x * s + y * c };
}

export type MuzzleSpec = {
  x: number;
  y: number;
  tipX: number;
  tipY: number;
  firesBullet: boolean;
  shotScale: number;
};

/** Member pivot + muzzle offset in local art space (origin = token center, -y forward). */
export function squadMuzzles(defId: number | undefined): MuzzleSpec[] {
  const layout = squadLayout(defId, true);
  if (!layout) return [];
  return layout.members
    .filter((m) => m.shotScale > 0)
    .map((m) => ({
      x: m.x,
      y: m.y,
      tipX: m.tipX,
      tipY: m.tipY,
      firesBullet: m.firesBullet,
      shotScale: m.shotScale,
    }));
}

/** World offset from token center: hull turns the bike, turret extra swings the gun. */
export function worldMuzzleOffset(m: MuzzleSpec, hullDeg: number, turretExtraDeg = 0): { x: number; y: number } {
  const body = rotateOffset(m.x, m.y, hullDeg);
  const tip = rotateOffset(m.tipX, m.tipY, hullDeg + turretExtraDeg);
  return { x: body.x + tip.x, y: body.y + tip.y };
}

export function hasFormationDeploy(defId: number | undefined): boolean {
  return specHasFormation(defId);
}
