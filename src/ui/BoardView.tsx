import { useEffect, useLayoutEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { CLASS_COLOR, UnitArt, UnitToken } from "./UnitToken";
import { gunAim, missileAimHit, type HpForecast } from "./damagePreview";
import { SquadArt } from "./SquadArt";
import { ExplosionFx } from "./ExplosionFx";
import { SgBrackets, sgIcon } from "./UiChrome";
import { WhiteFlagIcon } from "./icons";
import { boardFacingDeg, getUnitArt } from "../data/unitArt";
import { getSquadArt, SQUAD_PROP_FADE_TOTAL_MS } from "../data/squadArt";
import { getSpriteArt } from "../data/spriteArt";
import {
  DAMAGE_EXPLOSION,
  DESTRUCTION_EXPLOSION,
  bulletHeight,
  bulletSprite,
  explosionDuration,
  explosionPlacements,
  emitMissileWake,
  MISSILE_JET_SPRITE,
  MISSILE_SPRITE,
  missileTrailSprite,
  missileWakeHeight,
  preloadCombatFx,
  type MissileWake,
  shotHeight,
  shotSprite,
} from "../data/combatFx";
import {
  allUnits,
  cloneBoard,
  findUnit,
  frontCol,
  moveUnitOnBoard,
  supportCol,
} from "../engine/board";
import type { DragKind } from "./dnd";
import { allowDrop } from "./dnd";
import { isPageHidden, onPageHidden } from "./pageVisibility";
import {
  HQ_BREAKPOINTS,
  HQ_COMEBACK_LOSS_STEPS,
  HQ_MAX_HP,
  nextHqBreakpoint,
  playerHqMax,
  ROWS,
  type BoardPos,
  type CombatPhaseName,
  type CombatPlayback,
  type CombatStep,
  type FxEvent,
  type FxTarget,
  type KeywordName,
  type MatchState,
  type PlayerId,
  type UnitClass,
  type UnitInstance,
} from "../engine/types";
import { collectQuickCombat, takeCombatExchange, type CombatExchange, type CombatStrike } from "./combatBatches";
import {
  combatTurretExtra,
  curveDrivePath,
  dist,
  headingAlong,
  headingDeg,
  isAirborneClass,
  isSquadClass,
  isStepAdjacent,
  parkAlign,
  parkedHullDeg,
  planMoveRoute,
  prepareControls,
  reverseToFace,
  shortestDelta,
  usesDriveRig,
  type PathNode,
  type Point,
} from "./movePath";
import { hasFormationDeploy, rotateOffset, squadLayout, squadMuzzles, tankRed1BulletH, tankThinShotH, worldMuzzleOffset } from "./squadLayout";
import {
  DRONE_COUNT,
  DRONE_MISSILE_SCALE,
  DRONE_MISSILE_STEP_MS,
  DRONE_SHOT_SCALE,
  DRONE_STEP_MS,
  JET_STEP_MS,
  KAMIKAZE_STEP_MS,
  SQUAD_MARCH_STEP_MS,
  droneAttackPaths,
  droneFireSteps,
  jetFireIndex,
  jetHomePath,
  jetLoopPath,
  kamikazeDivePaths,
  missileArcPath,
  missileDivePath,
  missileLevelDropPath,
  MISSILE_STEP_MS,
  evenDurations,
  nextAirPattern,
  pointOnTrack,
  reversePath,
  type TimedTrack,
  spreadMarchPaths,
} from "./airStrike";

const TURRET_SETTLE_MS = 280;
const FORMATION_MS = 420;
const ARTILLERY_TURN_MS = 320;
const RECOIL_MS = 160;
const MUZZLE_MS = 180;
const GUN_FLIGHT_MS = 500;
const GUN_PAINT_MS = 32;
const PHASE_MS = 520;
const LANE_MS = 260;
const KEYWORD_MS = 700;
const STAT_MS = 380;
const REST_MS = 220;
const DESTROY_MS = 560;
const RICOCHET_MS = 300;
const FLOAT_MS = 420;

const PHASE_LABEL: Record<CombatPhaseName, string> = {
  relocation: "Relocation",
  stats: "Stats",
  damage: "Damage",
  cleanup: "Cleanup",
  missile: "Missile",
};

type ExplosionPlay = {
  key: string;
  x: number;
  y: number;
  frames: readonly string[];
  scale: number;
};

type ShotMark = {
  key: string;
  x: number;
  y: number;
  angle: number;
  src: string;
  size: number;
  moveMs?: number;
};

type GunRound = {
  key: string;
  x: number;
  y: number;
  angle: number;
  src: string;
  size: number;
  moveMs: number;
  to: Point;
  released: boolean;
  arrived: boolean;
};

function projMotion(ms: number): { transition: string } {
  return { transition: ms > 0 ? `left ${ms}ms linear, top ${ms}ms linear` : "none" };
}

function gunMarks(rounds: GunRound[]): ShotMark[] {
  return rounds.filter((round) => !round.arrived).map((round) => ({
    key: round.key,
    x: round.x,
    y: round.y,
    angle: round.angle,
    src: round.src,
    size: round.size,
    moveMs: round.moveMs,
  }));
}

function withGunTracers(rounds: GunRound[], existing: ShotMark[]): ShotMark[] {
  return [...gunMarks(rounds), ...existing.filter((mark) => mark.key.endsWith("-bounce"))];
}

type DroneFlyer = {
  key: string;
  x: number;
  y: number;
  hullDeg: number;
  src: string;
  moveMs: number;
  width?: number;
  height?: number;
};

type DroneStation = {
  unitId: string;
  drones: DroneFlyer[];
  paths: Point[][];
  parkFacing: number;
};

type JetStation = {
  unitId: string;
  flyer: FlyerPlay;
  origin: Point;
  orbit: Point[];
  index: number;
  parkFacing: number;
  stop: boolean;
  ready: boolean;
};

type FlyerPlay = {
  unitId: string;
  name: string;
  unitClass: UnitClass;
  defId?: number;
  owner: PlayerId;
  x: number;
  y: number;
  hullDeg: number;
  turretExtra: number;
  moveMs: number;
  deployed?: boolean;
  running?: boolean;
};

type PlayFx = {
  hideArtId: string | null;
  fadeId: string | null;
  fadeOutId: string | null;
  recoilId: string | null;
  flyer: Omit<FlyerPlay, "unitId"> | null;
  drones: DroneFlyer[];
  shot: Point | null;
  shotSrc: string;
  bulletSrc: string;
  shotSize: number;
  bulletSize: number;
  shotRicochet: boolean;
  shotMissile: boolean;
  shotMissileScale: number;
  shotFalling: boolean;
  shotAngle: number;
  shotMoveMs: number;
  missileWakes: MissileWake[];
  muzzles: ShotMark[];
  tracers: ShotMark[];
  explosions: ExplosionPlay[];
  dmgFloat: { x: number; y: number; amount: number } | null;
};

type PlayWriter = (update: PlayFx | ((p: PlayFx) => PlayFx)) => void;

type ShotAftermath = {
  impact: () => Promise<void>;
  settle: () => Promise<void>;
};

type SquadGroundPhase = "hold" | "arriving";

type SquadLeftover = {
  key: string;
  col: number;
  row: number;
  defId: number;
  facingDeg: number;
};

type SquadGround = {
  leftover: SquadLeftover[];
  phase: Record<string, SquadGroundPhase>;
};

const EMPTY_PLAY: PlayFx = {
  hideArtId: null,
  fadeId: null,
  fadeOutId: null,
  recoilId: null,
  flyer: null,
  drones: [],
  shot: null,
  shotSrc: shotSprite(0),
  bulletSrc: bulletSprite(0),
  shotSize: shotHeight(0),
  bulletSize: bulletHeight(0),
  shotRicochet: false,
  shotMissile: false,
  shotMissileScale: 1,
  shotFalling: false,
  shotAngle: 0,
  shotMoveMs: 0,
  missileWakes: [],
  muzzles: [],
  tracers: [],
  explosions: [],
  dmgFloat: null,
};

let explosionSeq = 0;

const HQ_TILES = [
  "B01", "B02", "B09", "B10", "B11", "B12", "B13", "B14", "B15", "B16", "B17", "B18", "B19", "B20",
  "B21", "B22", "B23", "B24", "B25", "B26", "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08",
].map((name) => `/ui/hq-building-rng/${name}.webp`);

function shuffleTiles(items: string[]): string[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function rollHqFace(): { outer: string[]; face: string[] } {
  const picked = shuffleTiles(HQ_TILES);
  return { face: picked.slice(0, 4), outer: picked.slice(4, 9) };
}

function HqFaceFlank({
  player,
  aimRef,
}: {
  player: 0 | 1;
  aimRef: (el: HTMLElement | null) => void;
}) {
  const [layout] = useState(rollHqFace);
  const faceTowardEnemy = player === 0;
  const columns = faceTowardEnemy
    ? [
        { key: "outer", tiles: layout.outer, tall: true },
        { key: "face", tiles: layout.face, tall: false },
      ]
    : [
        { key: "face", tiles: layout.face, tall: false },
        { key: "outer", tiles: layout.outer, tall: true },
      ];
  return (
    <div
      className={`hq-flank p${player}`}
      aria-hidden
      onDragOver={(event) => {
        event.stopPropagation();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="hq-face">
        {columns.map((col) => (
          <div key={col.key} className={`hq-face-col ${col.tall ? "n5" : "n4"}`}>
            {col.tiles.map((src) => (
              <img key={src} className="hq-cell" src={src} alt="" draggable={false} />
            ))}
          </div>
        ))}
        <span className="hq-aim" ref={aimRef} />
      </div>
    </div>
  );
}

function aimArcPath(from: Point, to: Point): string {
  const lift = Math.min(110, Math.max(42, Math.hypot(to.x - from.x, to.y - from.y) * 0.35));
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2 - lift;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

function aimStraightPath(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

type BoardAim = { kind: "missile" | "atk"; unitId: string };

export function BoardView({
  match,
  selectedIds,
  kwFocusId = null,
  hostileAimIds = [],
  deployPlayer,
  deployEnabled,
  reachableCells = [],
  reachableLabel = "Move here",
  dropKind = null,
  fxQueue,
  fxStartBoard = null,
  fxStartHq = null,
  holdBoard = null,
  holdHq = null,
  onFxDone,
  combatPlayback,
  combatSpeed = "detail",
  onCombatDone,
  onSelectUnit,
  onSelectCell,
  onSelectHq,
  onDropBoard,
  onDropCell,
  viewer = 0,
  onSurrender,
  surrenderDisabled = false,
  onToggleExit,
  onRequestSurrender,
  opponentIntel = null,
}: {
  match: MatchState;
  selectedIds: string[];
  /** Mobile inspect focus: keywords visible until a second tap or an outside tap. */
  kwFocusId?: string | null;
  /** Valid enemy targets while a card is waiting for an enemy pick. */
  hostileAimIds?: string[];
  deployPlayer: PlayerId | null;
  deployEnabled: boolean;
  reachableCells?: BoardPos[];
  reachableLabel?: string;
  dropKind?: DragKind | null;
  fxQueue: FxEvent[];
  /** Board before card-move FX resolved; keeps tokens from teleporting to final cells. */
  fxStartBoard?: (UnitInstance | null)[][] | null;
  /** HQ before this FX batch; damage is applied when the shot lands. */
  fxStartHq?: [number, number] | null;
  /** Freeze the board on the pre-card snapshot while the opponent's card reveal plays. */
  holdBoard?: (UnitInstance | null)[][] | null;
  holdHq?: [number, number] | null;
  onFxDone: () => void;
  combatPlayback: CombatPlayback | null;
  combatSpeed?: "detail" | "quick";
  onCombatDone: () => void;
  onSelectUnit: (unit: UnitInstance) => void;
  onSelectCell: (col: number, row: number) => void;
  onSelectHq: (player: PlayerId) => void;
  onDropBoard?: (event: DragEvent) => void;
  onDropCell?: (col: number, row: number, event: DragEvent) => void;
  viewer?: PlayerId;
  onSurrender?: () => void;
  surrenderDisabled?: boolean;
  onToggleExit?: () => void;
  onRequestSurrender?: () => void;
  /** Hand, supply, reserve, and deck tracker for the seat across the table. */
  opponentIntel?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hqRefs = useRef<Record<0 | 1, HTMLButtonElement | null>>({ 0: null, 1: null });
  const hqArtRefs = useRef<Record<0 | 1, HTMLElement | null>>({ 0: null, 1: null });
  const visualRef = useRef<(UnitInstance | null)[][] | null>(null);
  const poseRef = useRef<Record<string, { hull: number; turret: number }>>({});
  const [visualBoard, setVisualBoard] = useState<(UnitInstance | null)[][] | null>(null);
  const [visualHq, setVisualHq] = useState<[number, number] | null>(null);
  const [hqCrack, setHqCrack] = useState<{ player: PlayerId; bps: number[] } | null>(null);
  const [laneHl, setLaneHl] = useState<{ lane: number; color: "green" | "yellow" | "red" | "orange" } | null>(null);
  const [phaseName, setPhaseName] = useState<CombatPhaseName | null>(null);
  const [phaseDetail, setPhaseDetail] = useState<string | null>(null);
  const [keywordPop, setKeywordPop] = useState<{ unitId: string; keyword: KeywordName; amount: number } | null>(null);
  const [fxLayers, setFxLayers] = useState<Record<string, PlayFx>>({ main: EMPTY_PLAY });
  const fxLayersRef = useRef<Record<string, PlayFx>>({ main: EMPTY_PLAY });
  const [jetReturns, setJetReturns] = useState<FlyerPlay[]>([]);
  const jetReturnsRef = useRef<FlyerPlay[]>([]);
  const [jetStations, setJetStations] = useState<JetStation[]>([]);
  const jetStationsRef = useRef<JetStation[]>([]);
  const [droneStations, setDroneStations] = useState<DroneStation[]>([]);
  const droneStationsRef = useRef<DroneStation[]>([]);
  const airTracks = useRef(new Map<string, TimedTrack>());
  const jetPlans = useRef(new Map<string, Point[]>());
  const dronePlans = useRef(new Map<string, Point[][]>());
  const boardAlive = useRef(true);
  const [pose, setPose] = useState<Record<string, { hull: number; turret: number }>>({});
  const [squadGround, setSquadGround] = useState<SquadGround>({ leftover: [], phase: {} });
  const [aim, setAim] = useState<BoardAim | null>(null);
  const [aimLine, setAimLine] = useState<{ from: Point; to: Point; straight: boolean } | null>(null);
  const groundTimers = useRef<number[]>([]);
  poseRef.current = pose;

  function writeLayer(layer: string, update: PlayFx | ((p: PlayFx) => PlayFx)) {
    setFxLayers((prev) => {
      const current = prev[layer] ?? EMPTY_PLAY;
      const nextPlay = typeof update === "function" ? update(current) : update;
      if (nextPlay === current && prev[layer] === current) return prev;
      const next = { ...prev, [layer]: nextPlay };
      fxLayersRef.current = next;
      return next;
    });
  }

  function setPlay(update: PlayFx | ((p: PlayFx) => PlayFx)) {
    writeLayer("main", update);
  }

  function writerFor(layer: string): PlayWriter {
    return (update) => writeLayer(layer, update);
  }

  function clearAllPlay() {
    const next = { main: EMPTY_PLAY };
    fxLayersRef.current = next;
    setFxLayers(next);
  }

  function livePoint(unitId: string): Point | null {
    for (const layer of Object.values(fxLayersRef.current)) {
      if (layer.flyer && (layer.hideArtId === unitId || layer.fadeId === unitId)) {
        return { x: layer.flyer.x, y: layer.flyer.y };
      }
      if (layer.hideArtId === unitId || layer.fadeId === unitId) {
        const drone = layer.drones[0];
        if (drone) return { x: drone.x, y: drone.y };
      }
    }
    const flying = jetReturnsRef.current.find((jet) => jet.unitId === unitId);
    if (flying) return { x: flying.x, y: flying.y };
    const holding = jetStationsRef.current.find((jet) => jet.unitId === unitId);
    if (holding) return { x: holding.flyer.x, y: holding.flyer.y };
    const station = droneStationsRef.current.find((s) => s.unitId === unitId);
    if (station?.drones[0]) return { x: station.drones[0].x, y: station.drones[0].y };
    return null;
  }

  function liveFrom(unitId: string, from: { col: number; row: number }): Point | null {
    return livePoint(unitId) ?? (rootRef.current ? parkPoint(from.col, from.row, rootRef.current.getBoundingClientRect()) : null) ?? pointOfFrom(from);
  }

  function liveTo(to: FxTarget): Point | null {
    if ("hq" in to) return pointOfTarget(to);
    const boardNow = visualRef.current ?? match.board;
    const occupant = boardNow[to.col]?.[to.row];
    if (occupant) {
      const moving = livePoint(occupant.instanceId);
      if (moving) return moving;
    }
    return pointOfTarget(to);
  }

  function trackAir(unitId: string, points: Point[], durations: number[]) {
    if (points.length === 0) return;
    airTracks.current.set(unitId, { points, durations, index: 0, commandedAt: performance.now() });
  }

  function commandAir(unitId: string, index: number) {
    const track = airTracks.current.get(unitId);
    if (!track) return;
    track.index = index;
    track.commandedAt = performance.now();
  }

  function endAir(unitId: string) {
    airTracks.current.delete(unitId);
    jetPlans.current.delete(unitId);
    dronePlans.current.delete(unitId);
  }

  /** Fixed gun aim: parked units stay put; a jet or drone is led by one bullet flight. */
  function bulletAim(to: FxTarget | undefined, fallback: Point): Point {
    if (!to) return fallback;
    const current = liveTo(to) ?? fallback;
    if ("hq" in to) return current;
    const boardNow = visualRef.current ?? match.board;
    const occupant = boardNow[to.col]?.[to.row];
    if (!occupant || (occupant.class !== "Jet Plane" && occupant.class !== "Drone")) return current;
    const track = airTracks.current.get(occupant.instanceId);
    if (!track) return current;
    return pointOnTrack(track, performance.now() + GUN_FLIGHT_MS);
  }

  function ensureJetPlan(unit: UnitInstance, origin: Point, end: Point): Point[] {
    const cached = jetPlans.current.get(unit.instanceId);
    if (cached) return cached;
    const loop = jetLoopPath(origin, end, nextAirPattern("jet"));
    jetPlans.current.set(unit.instanceId, loop);
    trackAir(unit.instanceId, loop, evenDurations(loop.length, JET_STEP_MS));
    return loop;
  }

  function ensureDronePlan(unit: UnitInstance, origin: Point, end: Point): Point[][] {
    const cached = dronePlans.current.get(unit.instanceId);
    if (cached) return cached;
    const facing = poseRef.current[unit.instanceId]?.hull ?? parkedHullDeg(unit.class, unit.owner);
    const members = squadLayout(unit.defId, true)?.members ?? [];
    const fallbackSrc = getSquadArt(unit.defId)?.pieces[0]?.src ?? "/units-art/drone/recon.svg";
    const spawned = (members.length > 0 ? members : [{ x: 0, y: 0, src: fallbackSrc }]).slice(0, DRONE_COUNT);
    const starts = spawned.map((member) => {
      const local = rotateOffset(member.x, member.y, facing);
      return { x: origin.x + local.x, y: origin.y + local.y };
    });
    while (starts.length < DRONE_COUNT && starts[0]) starts.push({ ...starts[0] });
    const paths = droneAttackPaths(starts, end, nextAirPattern("drone"));
    dronePlans.current.set(unit.instanceId, paths);
    if (paths[0]) trackAir(unit.instanceId, paths[0], evenDurations(paths[0].length, DRONE_STEP_MS));
    return paths;
  }

  function primeAirborneGuns(shots: { unitId: string; from: { col: number; row: number }; to: FxTarget }[]) {
    const boardNow = visualRef.current ?? match.board;
    for (const step of shots) {
      const shooter = findUnit(boardNow, step.unitId);
      if (!shooter) continue;
      const origin = liveFrom(shooter.instanceId, step.from);
      const end = liveTo(step.to);
      if (!origin || !end) continue;
      if (shooter.class === "Jet Plane") ensureJetPlan(shooter, origin, end);
      if (shooter.class === "Drone" && getSquadArt(shooter.defId)) ensureDronePlan(shooter, origin, end);
    }
  }

  function syncDroneStations(next: DroneStation[]) {
    droneStationsRef.current = next;
    setDroneStations(next);
  }

  function syncJetReturns(next: FlyerPlay[]) {
    jetReturnsRef.current = next;
    setJetReturns(next);
  }

  function syncJetStations(next: JetStation[]) {
    jetStationsRef.current = next;
    setJetStations(next);
  }

  useEffect(() => {
    boardAlive.current = true;
    return () => {
      boardAlive.current = false;
    };
  }, []);

  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    groundTimers.current.push(id);
  }

  useEffect(() => {
    return () => {
      for (const id of groundTimers.current) window.clearTimeout(id);
    };
  }, []);

  function leaveSquadGround(unitId: string, defId: number, from: BoardPos, facingDeg: number) {
    if (!getSquadArt(defId)?.props?.length) return;
    const key = `leave-${unitId}-${Date.now()}`;
    setSquadGround((prev) => ({
      leftover: [...prev.leftover, { key, col: from.col, row: from.row, defId, facingDeg }],
      phase: Object.fromEntries(Object.entries(prev.phase).filter(([id]) => id !== unitId)),
    }));
    later(SQUAD_PROP_FADE_TOTAL_MS + 120, () => {
      setSquadGround((prev) => ({ ...prev, leftover: prev.leftover.filter((item) => item.key !== key) }));
    });
  }

  function arriveSquadGround(unitId: string, defId: number) {
    if (!getSquadArt(defId)?.props?.length) return;
    setSquadGround((prev) => ({ ...prev, phase: { ...prev.phase, [unitId]: "arriving" } }));
    later(SQUAD_PROP_FADE_TOTAL_MS + 120, () => {
      setSquadGround((prev) => {
        if (prev.phase[unitId] !== "arriving") return prev;
        return { ...prev, phase: { ...prev.phase, [unitId]: "hold" } };
      });
    });
  }

  useEffect(() => {
    preloadCombatFx();
  }, []);

  const board = visualBoard ?? holdBoard ?? match.board;
  const missileLocks = new Set<string>();
  for (const unit of allUnits(board)) {
    if (unit.hp <= 0 || !unit.missileTarget) continue;
    missileLocks.add(`${unit.missileTarget.col}-${unit.missileTarget.row}`);
  }

  const previewState: MatchState = board === match.board ? match : { ...match, board };

  useLayoutEffect(() => {
    const unit = aim ? findUnit(board, aim.unitId) : null;
    const root = rootRef.current?.getBoundingClientRect();
    if (!unit || !root) {
      setAimLine(null);
      return;
    }
    const from = parkPoint(unit.col, unit.row, root);
    if (aim.kind === "missile") {
      const target = unit.missileTarget;
      const to = target ? centerOfCell(target, root) : null;
      setAimLine(from && to ? { from, to, straight: false } : null);
      return;
    }
    const shot = gunAim(previewState, unit);
    if (!shot || !from) {
      setAimLine(null);
      return;
    }
    const to = "hq" in shot.to ? centerOfHq(shot.to.hq, root) : centerOfCell(shot.to, root);
    setAimLine(to ? { from, to, straight: true } : null);
  }, [aim, board, match]);

  useEffect(() => {
    if (!aim) return;
    const onDown = (event: PointerEvent) => {
      const t = event.target;
      if (!(t instanceof Element)) return;
      if (aim.kind === "missile") {
        if (event.pointerType === "mouse") return;
        if (t.closest(`[data-missile-aim="${aim.unitId}"]`)) return;
        setAim(null);
        return;
      }
      if (t.closest(`[data-atk-aim="${aim.unitId}"]`)) return;
      setAim(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [aim]);

  function aimMissile(unitId: string, mode: "on" | "off" | "toggle") {
    setAim((prev) => {
      if (mode === "on") return { kind: "missile", unitId };
      if (mode === "off") return prev?.kind === "missile" && prev.unitId === unitId ? null : prev;
      return prev?.kind === "missile" && prev.unitId === unitId ? null : { kind: "missile", unitId };
    });
  }

  function aimAtk(unitId: string) {
    const unit = findUnit(board, unitId);
    if (!unit || !gunAim(previewState, unit)) return;
    setAim((prev) => (prev?.kind === "atk" && prev.unitId === unitId ? null : { kind: "atk", unitId }));
  }

  const hpForecast = new Map<string, number>();
  if (aim) {
    const unit = findUnit(board, aim.unitId);
    const hits: HpForecast[] =
      !unit ? [] : aim.kind === "missile" ? [missileAimHit(previewState, unit)].filter((hit): hit is HpForecast => Boolean(hit)) : (gunAim(previewState, unit)?.hits ?? []);
    for (const hit of hits) hpForecast.set(hit.unitId, hit.hp);
  }
  const hq0 = visualHq ? visualHq[0] : holdHq ? holdHq[0] : match.players[0].hqHp;
  const hq1 = visualHq ? visualHq[1] : holdHq ? holdHq[1] : match.players[1].hqHp;

  function pointOfTarget(to: FxTarget | { col: number; row: number }): Point | null {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return null;
    if ("hq" in to) return centerOfHq(to.hq, root);
    return centerOfCell(to, root);
  }

  function pointOfFrom(from: { col: number; row: number }): Point | null {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return null;
    return centerOfCell(from, root);
  }

  function centerOfCell(pos: { col: number; row: number }, root: DOMRect): Point | null {
    const el = cellRefs.current[`${pos.col}-${pos.row}`];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - root.left + r.width / 2, y: r.top - root.top + r.height / 2 };
  }

  function centerOfHq(player: PlayerId, root: DOMRect): Point | null {
    const el = hqArtRefs.current[player] ?? hqRefs.current[player];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - root.left + r.width / 2, y: r.top - root.top + r.height / 2 };
  }

  function bumpVisual() {
    if (!visualRef.current) return;
    setVisualBoard(cloneBoard(visualRef.current));
  }

  function hqBreaksOf(results: Array<{ kind: string }>): Extract<CombatStep, { kind: "hqBreakpoint" }>[] {
    return results.filter((step): step is Extract<CombatStep, { kind: "hqBreakpoint" }> => step.kind === "hqBreakpoint");
  }

  async function flashHqBreaks(
    results: Array<{ kind: string }>,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
  ) {
    const hits = hqBreaksOf(results);
    if (hits.length === 0) return;
    setHqCrack({ player: hits[0].player, bps: hits.map((hit) => hit.bp) });
    await wait(520);
    if (!cancelled()) setHqCrack(null);
  }

  useEffect(() => {
    const live = new Set(allUnits(match.board).map((unit) => unit.instanceId));
    setPose((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!live.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [match.board]);

  useEffect(() => {
    const units = allUnits(board);
    const live = new Set(units.map((unit) => unit.instanceId));
    setSquadGround((prev) => {
      let changed = false;
      const phase = { ...prev.phase };
      for (const id of Object.keys(phase)) {
        if (!live.has(id)) {
          delete phase[id];
          changed = true;
        }
      }
      for (const unit of units) {
        if (Object.values(fxLayers).some((layer) => layer.hideArtId === unit.instanceId)) continue;
        if (!getSquadArt(unit.defId)?.props?.length) continue;
        if (phase[unit.instanceId]) continue;
        phase[unit.instanceId] = "hold";
        changed = true;
      }
      return changed ? { ...prev, phase } : prev;
    });
  }, [board, fxLayers]);

  function parkPoint(col: number, row: number, root: DOMRect): Point | null {
    const el = cellRefs.current[`${col}-${row}`];
    if (!el) return null;
    const portrait = el.querySelector(".unit-portrait");
    if (portrait) {
      const r = portrait.getBoundingClientRect();
      return {
        x: r.left - root.left + r.width / 2,
        y: r.top - root.top + r.height / 2,
      };
    }
    const r = el.getBoundingClientRect();
    return {
      x: r.left - root.left + r.width / 2,
      y: r.top - root.top + r.height / 2,
    };
  }

  function aislePoint(owner: PlayerId, row: number, root: DOMRect): Point | null {
    const leftCol = Math.min(supportCol(owner), frontCol(owner));
    const rightCol = Math.max(supportCol(owner), frontCol(owner));
    const left = cellRefs.current[`${leftCol}-${row}`];
    const right = cellRefs.current[`${rightCol}-${row}`];
    if (!left || !right) return null;
    const a = left.getBoundingClientRect();
    const b = right.getBoundingClientRect();
    return {
      x: (a.right + b.left) / 2 - root.left,
      y: (a.top + a.bottom + b.top + b.bottom) / 4 - root.top,
    };
  }

  function pointOfNode(node: PathNode, owner: PlayerId): Point | null {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return null;
    if (node.k === "park") return parkPoint(node.col, node.row, root);
    return aislePoint(owner, node.row, root);
  }

  /** Apply FX damage only after the projectile animation has reached the target. */
  async function settleFxStrike(
    event: Extract<FxEvent, { kind: "attack" }>,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
  ) {
    const boardNow = visualRef.current;
    if ("hq" in event.to) {
      if (event.damage <= 0) return;
      const player = event.to.hq;
      setVisualHq((prev) => {
        const next: [number, number] = prev
          ? [...prev]
          : fxStartHq
            ? [...fxStartHq]
            : [match.players[0].hqHp, match.players[1].hqHp];
        next[player] = Math.max(0, next[player] - event.damage);
        return next;
      });
      return;
    }
    if (boardNow && event.damage > 0) {
      const shown = boardNow[event.to.col]?.[event.to.row];
      if (shown) {
        shown.hp = Math.max(0, shown.hp - event.damage);
        bumpVisual();
        if (shown.hp <= 0) await playDestroy(shown.instanceId, wait, cancelled, setPlay);
        if (cancelled()) return;
      }
    }
    if (event.kamikaze && boardNow) {
      const shooter = findUnit(boardNow, event.unitId);
      if (shooter && shooter.hp > 0) {
        shooter.hp = 0;
        bumpVisual();
        await playDestroy(shooter.instanceId, wait, cancelled, setPlay);
      }
    }
  }

  useEffect(() => {
    if (fxQueue.length === 0 || combatPlayback) {
      return;
    }
    let cancelled = false;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const moveEvents = fxQueue.filter((event): event is Extract<FxEvent, { kind: "move" }> => event.kind === "move");
    const hasAttack = fxQueue.some((event) => event.kind === "attack");
    const movers = new Map<string, UnitInstance>();

    if (moveEvents.length > 0 || hasAttack) {
      const start = cloneBoard(fxStartBoard ?? match.board);
      for (const event of moveEvents) {
        const unit = findUnit(start, event.unitId);
        if (!unit) continue;
        start[unit.col][unit.row] = null;
        movers.set(event.unitId, unit);
      }
      visualRef.current = start;
      setVisualBoard(cloneBoard(start));
      if (hasAttack && fxStartHq) setVisualHq([...fxStartHq]);
    }

    async function run() {
      // Let the pre-move visual board paint before measuring park points / flyers.
      await wait(32);
      if (cancelled) return;
      // Play each move in order with the normal per-class route (aisle / drive / squad / air).
      // Parallel “cross fly” looks wrong for ground units and skips class-specific motion.
      for (const event of fxQueue) {
        if (cancelled) return;
        if (event.kind === "move") {
          await playMove(
            event.unitId,
            event.name,
            event.unitClass,
            event.owner,
            event.from,
            event.to,
            wait,
            () => cancelled,
            writerFor(`move:${event.unitId}`),
            { unit: movers.get(event.unitId), boardPlace: "end" },
          );
        } else {
          await playShot(event.unitId, event.from, event.to, event.damage, wait, () => cancelled, {
            power: event.power,
            targetMaxHp: event.targetMaxHp,
            kamikaze: event.kamikaze,
            missile: event.missile,
            defId: event.defId,
            owner: event.owner,
            originAt: liveFrom(event.unitId, event.from) ?? undefined,
            targetAt: liveTo(event.to) ?? undefined,
          });
          if (cancelled) return;
          await settleFxStrike(event, wait, () => cancelled);
        }
      }
      if (cancelled) return;
      await recallOrbitingJets(wait, () => cancelled);
      await recallHoveringDrones(wait, () => cancelled);
      if (cancelled) return;
      clearAllPlay();
      visualRef.current = null;
      setVisualBoard(null);
      setVisualHq(null);
      onFxDone();
    }

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fxQueue, combatPlayback]);

  useEffect(() => {
    if (!combatPlayback) {
      visualRef.current = null;
      setVisualBoard(null);
      setVisualHq(null);
      setHqCrack(null);
      setLaneHl(null);
      setPhaseName(null);
      setPhaseDetail(null);
      setKeywordPop(null);
      clearAllPlay();
      syncDroneStations([]);
      syncJetStations([]);
      syncJetReturns([]);
      return;
    }

    let cancelled = false;
    let skipDelays = isPageHidden();
    const pending = new Set<() => void>();
    const playback = combatPlayback;
    const flushPending = () => {
      const waiting = [...pending];
      pending.clear();
      for (const resume of waiting) resume();
    };
    const stopHidden = onPageHidden(() => {
      skipDelays = true;
      flushPending();
      if (!cancelled) onCombatDone();
    });
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (cancelled || skipDelays) {
          resolve();
          return;
        }
        let settled = false;
        let timer = 0;
        const resume = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          pending.delete(resume);
          resolve();
        };
        timer = window.setTimeout(resume, ms);
        pending.add(resume);
      });
    visualRef.current = cloneBoard(playback.initialBoard);
    setVisualBoard(cloneBoard(playback.initialBoard));
    setVisualHq([...playback.initialHq]);

    async function run() {
      if (skipDelays) {
        syncDroneStations([]);
        syncJetStations([]);
        syncJetReturns([]);
        if (!cancelled) onCombatDone();
        return;
      }
      await wait(40);
      if (combatSpeed === "quick") {
        await runQuickCombat(playback.steps, wait, () => cancelled);
      } else {
        for (let i = 0; i < playback.steps.length; ) {
          if (cancelled) return;
          const grouped = takeCombatExchange(playback.steps, i);
          if (grouped) {
            await playCombatExchange(grouped.exchange, wait, () => cancelled);
            i = grouped.next;
            continue;
          }
          await applyCombatStep(playback.steps[i], wait, () => cancelled);
          i += 1;
        }
      }
      if (cancelled) return;
      await recallOrbitingJets(wait, () => cancelled);
      await recallHoveringDrones(wait, () => cancelled);
      if (cancelled) return;
      setLaneHl(null);
      setPhaseName(null);
      setPhaseDetail(null);
      setKeywordPop(null);
      clearAllPlay();
      if (!cancelled) onCombatDone();
    }

    void run();
    return () => {
      cancelled = true;
      stopHidden();
      flushPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatPlayback]);

  async function playMove(
    unitId: string,
    name: string,
    unitClass: UnitClass,
    owner: PlayerId,
    from: { col: number; row: number },
    to: { col: number; row: number },
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    write: PlayWriter = setPlay,
    opts?: { unit?: UnitInstance; boardPlace?: "start" | "end" | "none" },
  ) {
    const boardPlace = opts?.boardPlace ?? "start";
    const liveBoard = visualRef.current ?? match.board;
    const moving = opts?.unit ?? findUnit(liveBoard, unitId) ?? findUnit(match.board, unitId);
    const others = allUnits(liveBoard).filter((unit) => unit.instanceId !== unitId);
    const occupied = others.map((unit) => ({ col: unit.col, row: unit.row }));
    const airborne = isAirborneClass(unitClass);
    const steer = usesDriveRig(unitClass);
    const defId = moving?.defId;
    const squad = isSquadClass(unitClass) || Boolean(defId && getSquadArt(defId));
    const route = planMoveRoute(from, to, owner, occupied, { airborne });
    const root = rootRef.current?.getBoundingClientRect();
    const measured = route.map((node) => pointOfNode(node, owner)).filter((p): p is Point => p !== null);
    const start = measured[0] ?? pointOfFrom(from);
    const end = measured[measured.length - 1] ?? pointOfTarget(to);
    if (!start || !end || !root) return;
    const blockers = airborne ? others.filter((unit) => isAirborneClass(unit.class)) : others;
    const obstacles = blockers
      .map((unit) => parkPoint(unit.col, unit.row, root))
      .filter((p): p is Point => p !== null);
    const waypoints = measured.length >= 2 ? measured : [start, end];
    const controls = airborne
      ? waypoints
      : prepareControls(route, waypoints, (row) => aislePoint(owner, row, root));
    const adjacent = isStepAdjacent(from, to);
    const path = curveDrivePath(controls, adjacent && !airborne ? [] : obstacles);
    const spriteSteer = Boolean(defId && getSpriteArt(defId));
    const flySteer = spriteSteer || unitClass === "Drone";
    const aimHull = steer || flySteer;
    if (defId) {
      leaveSquadGround(unitId, defId, from, parkedHullDeg(unitClass, owner));
    }
    const visual = visualRef.current;
    if (boardPlace === "start" && visual) {
      const relocating = findUnit(visual, unitId) ?? (opts?.unit && opts.unit.col === from.col && opts.unit.row === from.row ? opts.unit : null);
      if (relocating && (relocating.col !== to.col || relocating.row !== to.row)) {
        moveUnitOnBoard(visual, relocating, to.col, to.row);
        bumpVisual();
      }
    }
    const parkFacing = parkedHullDeg(unitClass, owner);
    let hull = aimHull ? (poseRef.current[unitId]?.hull ?? boardFacingDeg(owner)) : parkFacing;
    if (isSquadClass(unitClass) && moving && !steer) {
      write({
        ...EMPTY_PLAY,
        hideArtId: unitId,
        fadeId: unitId,
      });
      await wait(40);
      if (cancelled()) return;
      const settledSquad = rootRef.current?.getBoundingClientRect();
      const destSquad = settledSquad ? parkPoint(to.col, to.row, settledSquad) : null;
      if (destSquad && path.length > 0) path[path.length - 1] = destSquad;
      await playSquadMarch(moving, start, destSquad ?? end, path, hull, parkFacing, wait, cancelled, write);
      if (cancelled()) return;
      setPose((prev) => ({ ...prev, [unitId]: { hull: parkFacing, turret: 0 } }));
      if (defId) arriveSquadGround(unitId, defId);
      placeMovedUnit(unitId, to, boardPlace, opts?.unit);
      write(EMPTY_PLAY);
      return;
    }
    write({
      ...EMPTY_PLAY,
      hideArtId: unitId,
      fadeId: unitId,
      flyer: {
        name,
        unitClass,
        defId: moving?.defId,
        owner,
        x: path[0].x,
        y: path[0].y,
        hullDeg: hull,
        turretExtra: 0,
        moveMs: 40,
        deployed: squad ? false : true,
        running: squad || flySteer || airborne || unitClass === "Robot",
      },
    });
    await wait(40);
    if (cancelled()) return;
    const settledRoot = rootRef.current?.getBoundingClientRect();
    const destNow = settledRoot ? parkPoint(to.col, to.row, settledRoot) : null;
    if (destNow && path.length > 0) path[path.length - 1] = destNow;
    const travelCap = unitClass === "Jet Plane" ? 240 : airborne ? 380 : 220;
    const trackingAir = unitClass === "Jet Plane" || unitClass === "Drone";
    if (trackingAir) {
      const durations = path.map((_, i) =>
        i === 0 ? 0 : Math.max(70, Math.min(travelCap, dist(path[i - 1], path[i]) * 1.15)),
      );
      trackAir(unitId, path, durations);
    }
    const reverseFrom = hull;
    const backing =
      unitClass === "Motorcycle" && path.length >= 2
        ? reverseToFace(path[0], hull, headingAlong(path[0], path[1], hull))
        : null;
    if (backing) {
      const origin = path[0];
      path.splice(
        1,
        0,
        {
          x: origin.x * 0.5 + backing.point.x * 0.5,
          y: origin.y * 0.5 + backing.point.y * 0.5,
        },
        backing.point,
      );
    }
    const reverseSegs = backing ? 2 : 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      const reversing = Boolean(backing && i < reverseSegs);
      if (aimHull) {
        if (reversing && backing) {
          const t = (i + 1) / reverseSegs;
          hull = reverseFrom + shortestDelta(reverseFrom, backing.hull) * t;
        } else {
          const want = headingAlong(a, b, hull);
          const delta = shortestDelta(hull, want);
          hull += delta;
          if (i === reverseSegs && Math.abs(delta) > 55 && unitClass !== "Motorcycle") {
            const turnMs = Math.max(90, Math.min(180, Math.abs(delta) * 1.1));
            write((p) =>
              p.flyer ? { ...p, flyer: { ...p.flyer, hullDeg: hull, turretExtra: 0, moveMs: turnMs } } : p,
            );
            await wait(turnMs);
            if (cancelled()) {
              if (trackingAir) endAir(unitId);
              return;
            }
          }
        }
      }
      const travel =
        reversing && backing ? backing.ms / reverseSegs : Math.max(70, Math.min(travelCap, dist(a, b) * 1.15));
      if (trackingAir) commandAir(unitId, i + 1);
      write((p) =>
        p.flyer
          ? { ...p, flyer: { ...p.flyer, x: b.x, y: b.y, hullDeg: hull, turretExtra: 0, moveMs: travel } }
          : p,
      );
      await wait(travel);
      if (cancelled()) {
        if (trackingAir) endAir(unitId);
        return;
      }
    }
    if (steer) {
      const extra = combatTurretExtra(hull, owner);
      write((p) =>
        p.flyer
          ? { ...p, flyer: { ...p.flyer, turretExtra: extra, running: false, deployed: true, moveMs: TURRET_SETTLE_MS } }
          : p,
      );
      setPose((prev) => ({ ...prev, [unitId]: { hull, turret: extra } }));
      if (extra !== 0 || getUnitArt(moving?.defId ?? 0)) await wait(TURRET_SETTLE_MS);
    } else if (spriteSteer || unitClass === "Drone") {
      const spin = Math.abs(shortestDelta(hull, parkFacing));
      hull = parkFacing;
      write((p) =>
        p.flyer ? { ...p, flyer: { ...p.flyer, hullDeg: hull, turretExtra: 0, moveMs: ARTILLERY_TURN_MS } } : p,
      );
      setPose((prev) => ({ ...prev, [unitId]: { hull, turret: 0 } }));
      if (spin > 8) await wait(ARTILLERY_TURN_MS);
    } else if (squad && hasFormationDeploy(moving?.defId)) {
      write((p) =>
        p.flyer ? { ...p, flyer: { ...p.flyer, deployed: true, running: false, moveMs: FORMATION_MS } } : p,
      );
      setPose((prev) => ({ ...prev, [unitId]: { hull: parkFacing, turret: 0 } }));
      await wait(FORMATION_MS);
    } else {
      setPose((prev) => ({ ...prev, [unitId]: { hull: parkFacing, turret: 0 } }));
    }
    if (cancelled()) {
      if (trackingAir) endAir(unitId);
      return;
    }
    if (defId) arriveSquadGround(unitId, defId);
    placeMovedUnit(unitId, to, boardPlace, opts?.unit);
    if (trackingAir) endAir(unitId);
    write(EMPTY_PLAY);
  }

  function placeMovedUnit(
    unitId: string,
    to: { col: number; row: number },
    boardPlace: "start" | "end" | "none",
    fallback?: UnitInstance,
  ) {
    if (boardPlace !== "end") return;
    const visual = visualRef.current;
    if (!visual) return;
    const existing = findUnit(visual, unitId);
    const unit = existing ?? fallback ?? findUnit(match.board, unitId);
    if (!unit) return;
    if (existing) visual[existing.col][existing.row] = null;
    unit.col = to.col;
    unit.row = to.row;
    visual[to.col][to.row] = unit;
    bumpVisual();
  }

  async function playSquadMarch(
    unit: UnitInstance,
    origin: Point,
    dest: Point,
    center: Point[],
    startFacing: number,
    parkFacing: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    write: PlayWriter = setPlay,
  ) {
    const blob = squadLayout(unit.defId, false, true);
    const parked = squadLayout(unit.defId, true, false);
    if (!blob || blob.members.length === 0) return;
    const members = blob.members.map((m, i) => {
      const startLocal = rotateOffset(m.x, m.y, startFacing);
      const parkedM = parked?.members[i] ?? m;
      const endLocal = rotateOffset(parkedM.x, parkedM.y, parkFacing);
      return {
        key: `${unit.instanceId}-s${i}`,
        src: m.src,
        width: m.width,
        height: m.height,
        start: { x: origin.x + startLocal.x, y: origin.y + startLocal.y },
        end: { x: dest.x + endLocal.x, y: dest.y + endLocal.y },
      };
    });
    const paths = spreadMarchPaths(
      center,
      members.map((m) => ({ start: m.start, end: m.end })),
      nextAirPattern("march"),
    );
    write({
      ...EMPTY_PLAY,
      hideArtId: unit.instanceId,
      fadeId: unit.instanceId,
      drones: members.map((m, i) => ({
        key: m.key,
        x: paths[i][0].x,
        y: paths[i][0].y,
        hullDeg: parkFacing,
        src: m.src,
        moveMs: 40,
        width: m.width,
        height: m.height,
      })),
    });
    await wait(40);
    if (cancelled()) return;
    const steps = paths[0]?.length ?? 0;
    for (let i = 1; i < steps; i += 1) {
      write((p) => ({
        ...p,
        drones: p.drones.map((drone, di) => {
          const path = paths[di] ?? paths[0];
          const next = path[Math.min(i, path.length - 1)];
          return {
            ...drone,
            x: next.x,
            y: next.y,
            hullDeg: parkFacing,
            moveMs: SQUAD_MARCH_STEP_MS,
          };
        }),
      }));
      await wait(SQUAD_MARCH_STEP_MS);
      if (cancelled()) return;
    }
  }

  async function aimBipedTorso(
    unit: UnitInstance,
    from: Point,
    to: Point,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
  ) {
    if (!getUnitArt(unit.defId)?.legs?.length) return;
    const hull = poseRef.current[unit.instanceId]?.hull ?? parkedHullDeg(unit.class, unit.owner);
    const extra = shortestDelta(hull, headingDeg(from, to));
    const prev = poseRef.current[unit.instanceId]?.turret ?? 0;
    if (Math.abs(shortestDelta(prev, extra)) <= 2) return;
    setPose((p) => ({ ...p, [unit.instanceId]: { hull, turret: extra } }));
    await wait(TURRET_SETTLE_MS);
    if (cancelled()) return;
  }

  async function playShot(
    unitId: string,
    from: { col: number; row: number },
    to: FxTarget,
    damage: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    opts: {
      missile?: boolean;
      power?: number;
      targetMaxHp?: number;
      kamikaze?: boolean;
      defId?: number;
      owner?: PlayerId;
      write?: PlayWriter;
      split?: boolean;
      direct?: boolean;
      originAt?: Point;
      targetAt?: Point;
    } = {},
  ): Promise<ShotAftermath | undefined> {
    const write = opts.write ?? setPlay;
    const split = Boolean(opts.split);
    const liveBoard = visualRef.current ?? match.board;
    const shooter = findUnit(liveBoard, unitId);
    const origin =
      liveFrom(unitId, from) ??
      opts.originAt ??
      ((rootRef.current && (shooter || opts.kamikaze)
        ? parkPoint(from.col, from.row, rootRef.current.getBoundingClientRect())
        : null) ?? pointOfFrom(from));
    const end = liveTo(to) ?? opts.targetAt ?? pointOfTarget(to);
    if (!origin || !end) return;
    const nested = { ...opts, write, split };
    if (opts.kamikaze && !opts.direct) {
      return playKamikazeDive(unitId, shooter, origin, end, damage, wait, cancelled, nested);
    }
    if (shooter && shooter.class === "Drone" && getSquadArt(shooter.defId)) {
      const parked = droneStationsRef.current.find((s) => s.unitId === shooter.instanceId);
      if (parked || !opts.direct) {
        return playDroneStrike(shooter, origin, end, damage, wait, cancelled, nested, to);
      }
    }
    if (shooter && shooter.class === "Jet Plane") {
      if (opts.missile) return playJetMissile(shooter, origin, end, damage, wait, cancelled, nested, to);
      return playJetStrike(shooter, origin, end, damage, wait, cancelled, nested, to);
    }
    if (shooter && isSquadClass(shooter.class) && !opts.missile) {
      return playSquadShot(shooter, origin, end, damage, wait, cancelled, opts.targetMaxHp ?? 1, write, split, to);
    }
    const start = origin;
    const missile = opts.missile ?? false;
    const power = opts.power ?? 0;
    const targetMaxHp = opts.targetMaxHp ?? 1;
    if (shooter) {
      await aimBipedTorso(shooter, start, bulletAim(to, end), wait, cancelled);
      if (cancelled()) return;
    }
    const muzzleAim = bulletAim(to, end);
    write({
      ...EMPTY_PLAY,
      recoilId: unitId,
      shot: start,
      shotSrc: shotSprite(power),
      bulletSrc: bulletSprite(power),
      shotSize: shotHeight(power),
      bulletSize: bulletHeight(power),
      shotMissile: missile,
      shotFalling: false,
      shotAngle: headingDeg(start, muzzleAim),
      shotMoveMs: 0,
      missileWakes: missile ? emitMissileWake([], start, headingDeg(start, muzzleAim), 1) : [],
    });
    await wait(RECOIL_MS);
    if (cancelled()) return;
    const aim = missile ? (liveTo(to) ?? end) : bulletAim(to, end);
    if (missile) {
      const arc = missileArcPath(start, aim);
      let nose = arc.length >= 2 ? headingDeg(arc[0], arc[1]) : headingDeg(start, aim);
      for (let i = 1; i < arc.length; i += 1) {
        const want = headingAlong(arc[i - 1], arc[i], nose);
        nose += shortestDelta(nose, want);
        write((p) => ({
          ...p,
          recoilId: null,
          shot: arc[i],
          shotFalling: arc[i].y > arc[i - 1].y,
          shotAngle: nose,
          shotMoveMs: MISSILE_STEP_MS,
          missileWakes: p.shot
            ? emitMissileWake(p.missileWakes, p.shot, p.shotAngle, p.shotMissileScale)
            : p.missileWakes,
        }));
        await wait(MISSILE_STEP_MS);
        if (cancelled()) return;
      }
    } else {
      write((p) => ({ ...p, recoilId: null, shot: aim, shotAngle: headingDeg(start, aim), shotMoveMs: GUN_FLIGHT_MS }));
      await wait(GUN_FLIGHT_MS);
    }
    if (cancelled()) return;
    return resolveShot(split, () => finishImpact(start, aim, damage, targetMaxHp, wait, cancelled, false, missile, write), async () => {
      write(EMPTY_PLAY);
    });
  }

  async function resolveShot(
    split: boolean,
    impact: () => Promise<void>,
    settle: () => Promise<void>,
  ): Promise<ShotAftermath | undefined> {
    await impact();
    if (split) return { impact: async () => {}, settle };
    await settle();
    return undefined;
  }

  function scheduleGunImpact(
    round: GunRound,
    rounds: GunRound[],
    write: PlayWriter,
    damage: number,
    targetMaxHp: number,
    origin: Point,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
  ): Promise<void> {
    return (async () => {
      await wait(GUN_FLIGHT_MS);
      if (cancelled() || round.arrived) return;
      round.arrived = true;
      if (damage <= 0) {
        const outward = round.to.x >= origin.x ? 1 : -1;
        const bounce = { x: round.to.x + outward * 92, y: round.to.y - 78 };
        const bounceKey = `${round.key}-bounce`;
        write((p) => ({
          ...p,
          muzzles: [],
          shotRicochet: true,
          tracers: [
            ...gunMarks(rounds),
            ...p.tracers.filter((mark) => mark.key.endsWith("-bounce") && mark.key !== bounceKey),
            {
              key: bounceKey,
              x: bounce.x,
              y: bounce.y,
              angle: headingDeg(round.to, bounce),
              src: round.src,
              size: round.size,
              moveMs: RICOCHET_MS,
            },
          ],
        }));
        await wait(RICOCHET_MS);
        if (cancelled()) return;
        write((p) => ({ ...p, tracers: p.tracers.filter((mark) => mark.key !== bounceKey) }));
        return;
      }
      const blasts = explosionPlacements(round.to, damage, targetMaxHp);
      const keys = blasts.map(() => `dmg-${explosionSeq++}`);
      let ownsFloat = false;
      write((p) => {
        ownsFloat = !p.dmgFloat;
        return {
          ...p,
          muzzles: [],
          tracers: withGunTracers(rounds, p.tracers),
          explosions: [
            ...p.explosions,
            ...blasts.map((blast, i) => ({
              key: keys[i],
              x: blast.x,
              y: blast.y,
              frames: DAMAGE_EXPLOSION,
              scale: blast.scale,
            })),
          ],
          dmgFloat: p.dmgFloat ?? { x: round.to.x, y: round.to.y, amount: damage },
        };
      });
      await wait(Math.max(explosionDuration(DAMAGE_EXPLOSION), FLOAT_MS));
      if (cancelled()) return;
      write((p) => ({
        ...p,
        explosions: p.explosions.filter((blast) => !keys.includes(blast.key)),
        dmgFloat: ownsFloat ? null : p.dmgFloat,
      }));
    })();
  }

  async function playKamikazeDive(
    unitId: string,
    shooter: UnitInstance | null,
    origin: Point,
    end: Point,
    damage: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    opts: { targetMaxHp?: number; defId?: number; owner?: PlayerId; write?: PlayWriter; split?: boolean },
  ): Promise<ShotAftermath | undefined> {
    const write = opts.write ?? setPlay;
    const defId = opts.defId ?? shooter?.defId ?? 23;
    const owner = opts.owner ?? shooter?.owner ?? 0;
    const facing = poseRef.current[unitId]?.hull ?? parkedHullDeg("Drone", owner);
    const members = squadLayout(defId, true)?.members ?? [];
    const fallbackSrc = getSquadArt(defId)?.pieces[0]?.src ?? "/units-art/drone/kamikaze.svg";
    const parked = (members.length > 0 ? members : [{ x: 0, y: 0, src: fallbackSrc }]).slice(0, DRONE_COUNT).map((m, i) => {
      const local = rotateOffset(m.x, m.y, facing);
      return {
        key: `${unitId}-kami-${i}`,
        x: origin.x + local.x,
        y: origin.y + local.y,
        hullDeg: facing,
        src: m.src,
        moveMs: 40,
      };
    });
    while (parked.length < DRONE_COUNT) {
      parked.push({ ...parked[0], key: `${unitId}-kami-${parked.length}` });
    }
    const starts = parked.map((drone) => ({ x: drone.x, y: drone.y }));
    const paths = kamikazeDivePaths(starts, end);
    write({
      ...EMPTY_PLAY,
      hideArtId: unitId,
      drones: parked,
    });
    await wait(40);
    if (cancelled()) return;
    const steps = Math.max(...paths.map((path) => path.length));
    for (let i = 1; i < steps; i += 1) {
      write((p) => ({
        ...p,
        drones: p.drones.map((drone, di) => {
          const path = paths[di] ?? paths[0];
          const prev = path[Math.min(i - 1, path.length - 1)];
          const next = path[Math.min(i, path.length - 1)];
          return {
            ...drone,
            x: next.x,
            y: next.y,
            hullDeg: headingAlong(prev, next, drone.hullDeg),
            moveMs: KAMIKAZE_STEP_MS,
          };
        }),
      }));
      await wait(KAMIKAZE_STEP_MS);
      if (cancelled()) return;
    }
    return resolveShot(
      Boolean(opts.split),
      () => finishImpact(origin, end, damage, opts.targetMaxHp ?? 1, wait, cancelled, true, false, write),
      async () => {
        write(EMPTY_PLAY);
      },
    );
  }

  async function playDroneStrike(
    unit: UnitInstance,
    origin: Point,
    end: Point,
    damage: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    opts: { missile?: boolean; power?: number; targetMaxHp?: number; write?: PlayWriter; split?: boolean },
    to?: FxTarget,
  ): Promise<ShotAftermath | undefined> {
    const write = opts.write ?? setPlay;
    const split = Boolean(opts.split);
    const targetMaxHp = opts.targetMaxHp ?? 1;
    const missileFollowup = Boolean(opts.missile);
    syncDroneStations(droneStationsRef.current.filter((s) => s.unitId !== unit.instanceId));
    const facing = poseRef.current[unit.instanceId]?.hull ?? parkedHullDeg(unit.class, unit.owner);
    const members = squadLayout(unit.defId, true)?.members ?? [];
    const fallbackSrc = getSquadArt(unit.defId)?.pieces[0]?.src ?? "/units-art/drone/recon.svg";
    const spawned = (members.length > 0 ? members : [{ x: 0, y: 0, src: fallbackSrc }]).slice(0, DRONE_COUNT).map((m, i) => {
      const local = rotateOffset(m.x, m.y, facing);
      return {
        key: `${unit.instanceId}-d${i}`,
        x: origin.x + local.x,
        y: origin.y + local.y,
        hullDeg: facing,
        src: m.src,
        moveMs: 40,
      };
    });
    while (spawned.length < DRONE_COUNT) {
      spawned.push({ ...spawned[0], key: `${unit.instanceId}-d${spawned.length}` });
    }
    const paths = ensureDronePlan(unit, origin, end);
    const fireAt = droneFireSteps(paths, end);
    const missileDrone = (() => {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < paths.length; i += 1) {
        const pt = paths[i][fireAt[i]] ?? paths[i][paths[i].length - 1];
        const d = Math.hypot(pt.x - end.x, pt.y - end.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    })();
    write({
      ...EMPTY_PLAY,
      hideArtId: unit.instanceId,
      drones: spawned,
    });
    await wait(40);
    if (cancelled()) {
      endAir(unit.instanceId);
      return;
    }
    let drones = spawned;
    const fired = new Set<number>();
    const rounds: GunRound[] = [];
    const landings: Promise<void>[] = [];
    let missilePath: Point[] | null = null;
    let missileIdx = 0;
    let missileNose = 0;
    const steps = Math.max(...paths.map((path) => path.length));
    for (let i = 1; i < steps || (missilePath && missileIdx < missilePath.length - 1); i += 1) {
      if (i < steps) {
        commandAir(unit.instanceId, Math.min(i, (paths[0]?.length ?? 1) - 1));
        drones = drones.map((drone, di) => {
          const path = paths[di] ?? paths[0];
          const prev = path[Math.min(i - 1, path.length - 1)];
          const next = path[Math.min(i, path.length - 1)];
          const last = i >= path.length - 1;
          return {
            ...drone,
            x: next.x,
            y: next.y,
            hullDeg: last ? facing : headingAlong(prev, next, drone.hullDeg),
            moveMs: DRONE_STEP_MS,
          };
        });
      }
      const muzzles: ShotMark[] = [];
      let spawnedRound = false;
      for (let di = 0; di < drones.length; di += 1) {
        if (i !== fireAt[di] || fired.has(di)) continue;
        fired.add(di);
        const drone = drones[di];
        if (missileFollowup && di === missileDrone) {
          const aim = end;
          missilePath = missileDivePath({ x: drone.x, y: drone.y }, aim);
          missileIdx = 0;
          missileNose = missilePath.length >= 2 ? headingDeg(missilePath[0], missilePath[1]) : headingDeg(drone, aim);
        } else if (!missileFollowup) {
          const from = { x: drone.x, y: drone.y };
          const toPoint = bulletAim(to, end);
          rounds.push({
            key: `${unit.instanceId}-tr-${di}`,
            x: from.x,
            y: from.y,
            to: toPoint,
            angle: headingDeg(from, toPoint),
            src: "/units-art/bullets/bulletRed1.png",
            size: tankRed1BulletH() * DRONE_SHOT_SCALE,
            moveMs: 0,
            released: false,
            arrived: false,
          });
          spawnedRound = true;
          muzzles.push({
            key: `${drone.key}-mz`,
            x: drone.x,
            y: drone.y,
            angle: headingDeg(from, toPoint),
            src: "/units-art/shot/shotThin.png",
            size: tankThinShotH() * DRONE_SHOT_SCALE,
          });
        }
      }
      if (missilePath && missileIdx < missilePath.length - 1) missileIdx += 1;
      const missilePt = missilePath ? missilePath[Math.min(missileIdx, missilePath.length - 1)] : null;
      if (missilePath && missileIdx > 0) {
        missileNose = headingAlong(missilePath[missileIdx - 1], missilePt!, missileNose);
      }
      const writeFrame = () =>
        write((p) => ({
          ...p,
          hideArtId: unit.instanceId,
          drones,
          muzzles,
          tracers: missileFollowup ? [] : withGunTracers(rounds, p.tracers),
          shot: missilePt,
          shotMissile: Boolean(missilePath),
          shotMissileScale: DRONE_MISSILE_SCALE,
          shotFalling: Boolean(missilePath),
          shotAngle: missileNose,
          shotMoveMs: missilePath ? DRONE_MISSILE_STEP_MS : 0,
          missileWakes:
            missilePt && missilePath
              ? emitMissileWake(p.missileWakes, missilePt, missileNose, DRONE_MISSILE_SCALE)
              : [],
        }));
      writeFrame();
      if (spawnedRound) {
        await wait(GUN_PAINT_MS);
        if (cancelled()) {
          endAir(unit.instanceId);
          return;
        }
        for (const round of rounds) {
          if (round.released) continue;
          const from = { x: round.x, y: round.y };
          round.to = bulletAim(to, end);
          round.angle = headingDeg(from, round.to);
          round.released = true;
          round.x = round.to.x;
          round.y = round.to.y;
          round.moveMs = GUN_FLIGHT_MS;
          landings.push(scheduleGunImpact(round, rounds, write, damage, targetMaxHp, origin, wait, cancelled));
        }
        writeFrame();
        await wait(Math.max(0, DRONE_STEP_MS - GUN_PAINT_MS));
      } else {
        await wait(missilePath ? Math.max(DRONE_STEP_MS, DRONE_MISSILE_STEP_MS) : DRONE_STEP_MS);
      }
      if (cancelled()) {
        endAir(unit.instanceId);
        return;
      }
    }
    if (!missileFollowup) await Promise.all(landings);
    if (cancelled()) {
      endAir(unit.instanceId);
      return;
    }
    endAir(unit.instanceId);
    if (missileFollowup) {
      return resolveShot(
        split,
        async () => {
          if (damage > 0) {
            await showDroneImpact(end, damage, targetMaxHp, wait, write);
            return;
          }
        },
        async () => {
          write(EMPTY_PLAY);
        },
      );
    }
    return resolveShot(
      split,
      async () => {},
      async () => {
        write(EMPTY_PLAY);
      },
    );
  }

  async function recallHoveringDrones(wait: (ms: number) => Promise<unknown>, cancelled: () => boolean) {
    const leftover = droneStationsRef.current;
    if (leftover.length === 0) return;
    syncDroneStations([]);
    for (const station of leftover) {
      if (cancelled()) return;
      await flyDronesHome(station.drones, station.paths, station.parkFacing, station.unitId, wait, cancelled);
    }
  }

  async function flyDronesAlong(
    current: DroneFlyer[],
    paths: Point[][],
    parkFacing: number,
    homeward: boolean,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    write: PlayWriter = setPlay,
  ): Promise<DroneFlyer[] | null> {
    const steps = Math.max(...paths.map((path) => path.length));
    let drones = current;
    for (let i = 1; i < steps; i += 1) {
      const last = i === steps - 1;
      drones = drones.map((drone, di) => {
        const path = paths[di] ?? paths[0];
        const prev = path[Math.min(i - 1, path.length - 1)];
        const next = path[Math.min(i, path.length - 1)];
        return {
          ...drone,
          x: next.x,
          y: next.y,
          hullDeg: homeward && last ? parkFacing : headingAlong(prev, next, drone.hullDeg),
          moveMs: DRONE_STEP_MS,
        };
      });
      write((p) => ({ ...p, hideArtId: p.hideArtId, drones }));
      await wait(DRONE_STEP_MS);
      if (cancelled()) return null;
    }
    return drones;
  }

  async function flyDronesHome(
    drones: DroneFlyer[],
    outbound: Point[][],
    parkFacing: number,
    unitId: string,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    write: PlayWriter = setPlay,
  ) {
    const inbound = outbound.map(reversePath);
    write((p) => ({
      ...EMPTY_PLAY,
      hideArtId: unitId,
      drones,
      explosions: p.explosions,
      dmgFloat: p.dmgFloat,
    }));
    await flyDronesAlong(drones, inbound, parkFacing, true, wait, cancelled, write);
    if (cancelled()) return;
    write(EMPTY_PLAY);
  }

  async function showDroneImpact(end: Point, damage: number, targetMaxHp: number, wait: (ms: number) => Promise<unknown>, write: PlayWriter = setPlay) {
    if (damage <= 0) {
      write((p) => ({ ...p, shot: null }));
      return;
    }
    const blasts = explosionPlacements(end, damage, targetMaxHp);
    write((p) => ({
      ...p,
      shot: null,
      tracers: [],
      muzzles: [],
      explosions: blasts.map((blast) => ({
        key: `dmg-${explosionSeq++}`,
        x: blast.x,
        y: blast.y,
        frames: DAMAGE_EXPLOSION,
        scale: blast.scale,
      })),
      dmgFloat: { x: end.x, y: end.y, amount: damage },
    }));
    await wait(Math.max(explosionDuration(DAMAGE_EXPLOSION), FLOAT_MS));
  }

  function artHidden(unitId: string): boolean {
    return (
      Object.values(fxLayers).some((layer) => layer.hideArtId === unitId) ||
      jetReturns.some((jet) => jet.unitId === unitId) ||
      jetStations.some((jet) => jet.unitId === unitId) ||
      droneStations.some((station) => station.unitId === unitId)
    );
  }

  function startJetReturn(unit: UnitInstance, from: Point, inbound: Point[], hull: number, parkFacing: number) {
    const flyer: FlyerPlay = {
      unitId: unit.instanceId,
      name: unit.name,
      unitClass: unit.class,
      defId: unit.defId,
      owner: unit.owner,
      x: from.x,
      y: from.y,
      hullDeg: hull,
      turretExtra: 0,
      moveMs: JET_STEP_MS,
      deployed: true,
      running: true,
    };
    syncJetReturns([...jetReturnsRef.current.filter((jet) => jet.unitId !== unit.instanceId), flyer]);
    const home = inbound[0] && dist(inbound[0], from) < 4 ? inbound : [from, ...inbound];
    void (async () => {
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      let heading = hull;
      for (let i = 1; i < home.length; i += 1) {
        if (!boardAlive.current) return;
        const prev = home[i - 1];
        const next = home[i];
        heading = i === home.length - 1 ? parkFacing : headingAlong(prev, next, heading);
        syncJetReturns(
          jetReturnsRef.current.map((jet) =>
            jet.unitId === unit.instanceId
              ? { ...jet, x: next.x, y: next.y, hullDeg: heading, moveMs: JET_STEP_MS }
              : jet,
          ),
        );
        await wait(JET_STEP_MS);
      }
      if (!boardAlive.current) return;
      setPose((prev) => ({ ...prev, [unit.instanceId]: { hull: parkFacing, turret: 0 } }));
      syncJetReturns(jetReturnsRef.current.filter((jet) => jet.unitId !== unit.instanceId));
    })();
  }

  function takeJetStation(unitId: string): JetStation | null {
    const station = jetStationsRef.current.find((jet) => jet.unitId === unitId) ?? null;
    if (!station) return null;
    station.stop = true;
    syncJetStations(jetStationsRef.current.filter((jet) => jet.unitId !== unitId));
    return station;
  }

  async function playJetMissile(
    unit: UnitInstance,
    origin: Point,
    end: Point,
    damage: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    opts: { power?: number; targetMaxHp?: number; write?: PlayWriter; split?: boolean },
    to?: FxTarget,
  ): Promise<ShotAftermath | undefined> {
    const write = opts.write ?? setPlay;
    const split = Boolean(opts.split);
    const power = opts.power ?? 0;
    const targetMaxHp = opts.targetMaxHp ?? 1;
    const parkFacing = parkedHullDeg(unit.class, unit.owner);
    takeJetStation(unit.instanceId);
    const aim = (to ? liveTo(to) : null) ?? end;
    const loop = jetLoopPath(origin, aim, nextAirPattern("jet"));
    trackAir(unit.instanceId, loop, evenDurations(loop.length, JET_STEP_MS));
    const fireAt = jetFireIndex(loop, aim);
    let hull = poseRef.current[unit.instanceId]?.hull ?? parkFacing;
    write({
      ...EMPTY_PLAY,
      hideArtId: unit.instanceId,
      flyer: {
        name: unit.name,
        unitClass: unit.class,
        defId: unit.defId,
        owner: unit.owner,
        x: loop[0].x,
        y: loop[0].y,
        hullDeg: hull,
        turretExtra: 0,
        moveMs: 30,
        deployed: true,
        running: true,
      },
    });
    await wait(30);
    if (cancelled()) {
      endAir(unit.instanceId);
      return;
    }
    let missilePath: Point[] | null = null;
    let missileIdx = 0;
    let nose = 0;
    let i = 1;
    while (i < loop.length || (missilePath && missileIdx < missilePath.length - 1)) {
      if (i < loop.length) {
        const prev = loop[i - 1];
        const next = loop[i];
        commandAir(unit.instanceId, i);
        hull = i === loop.length - 1 ? parkFacing : headingAlong(prev, next, hull);
        if (i === fireAt) {
          missilePath = missileLevelDropPath(next, aim);
          missileIdx = 0;
          nose = missilePath.length >= 2 ? headingDeg(missilePath[0], missilePath[1]) : headingDeg(next, aim);
        }
        write((p) =>
          p.flyer
            ? { ...p, hideArtId: unit.instanceId, flyer: { ...p.flyer, x: next.x, y: next.y, hullDeg: hull, moveMs: JET_STEP_MS } }
            : p,
        );
        i += 1;
      }
      if (missilePath && missileIdx < missilePath.length - 1) {
        missileIdx += 1;
        const pt = missilePath[missileIdx];
        nose = headingAlong(missilePath[missileIdx - 1], pt, nose);
        write((p) => ({
          ...p,
          hideArtId: unit.instanceId,
          shot: pt,
          shotSrc: shotSprite(power),
          bulletSrc: bulletSprite(power),
          shotSize: shotHeight(power),
          bulletSize: bulletHeight(power),
          shotMissile: true,
          shotMissileScale: 1,
          shotFalling: pt.y > missilePath![missileIdx - 1].y + 1,
          shotAngle: nose,
          shotMoveMs: MISSILE_STEP_MS,
          missileWakes: p.shot ? emitMissileWake(p.missileWakes, p.shot, p.shotAngle, 1) : emitMissileWake([], pt, nose, 1),
        }));
      }
      await wait(missilePath ? Math.max(JET_STEP_MS, MISSILE_STEP_MS) : JET_STEP_MS);
      if (cancelled()) {
        endAir(unit.instanceId);
        return;
      }
    }
    endAir(unit.instanceId);
    return resolveShot(
      split,
      () => finishImpact(origin, aim, damage, targetMaxHp, wait, cancelled, false, true, write),
      async () => {
        write(EMPTY_PLAY);
      },
    );
  }

  async function recallOrbitingJets(wait: (ms: number) => Promise<unknown>, cancelled: () => boolean) {
    const leftover = jetStationsRef.current;
    if (leftover.length === 0) return;
    syncJetStations([]);
    for (const station of leftover) {
      station.stop = true;
      if (cancelled()) return;
      const liveBoard = visualRef.current ?? match.board;
      const unit = findUnit(liveBoard, station.unitId);
      if (!unit) continue;
      startJetReturn(
        unit,
        { x: station.flyer.x, y: station.flyer.y },
        jetHomePath({ x: station.flyer.x, y: station.flyer.y }, station.origin, 1),
        station.flyer.hullDeg,
        station.parkFacing,
      );
    }
    await wait(JET_STEP_MS);
  }

  async function playJetStrike(
    unit: UnitInstance,
    origin: Point,
    end: Point,
    damage: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    opts: { missile?: boolean; power?: number; targetMaxHp?: number; write?: PlayWriter; split?: boolean },
    to?: FxTarget,
  ): Promise<ShotAftermath | undefined> {
    const write = opts.write ?? setPlay;
    const split = Boolean(opts.split);
    const parkFacing = parkedHullDeg(unit.class, unit.owner);
    const parked = takeJetStation(unit.instanceId);
    const takeoff = parked ? { x: parked.flyer.x, y: parked.flyer.y } : origin;
    const home = parked?.origin ?? origin;
    const loop = ensureJetPlan(unit, takeoff, end);
    const fireAt = jetFireIndex(loop, end);
    const power = opts.power ?? 0;
    const targetMaxHp = opts.targetMaxHp ?? 1;
    let hull = parked?.flyer.hullDeg ?? poseRef.current[unit.instanceId]?.hull ?? parkFacing;
    write({
      ...EMPTY_PLAY,
      hideArtId: unit.instanceId,
      flyer: {
        name: unit.name,
        unitClass: unit.class,
        defId: unit.defId,
        owner: unit.owner,
        x: loop[0].x,
        y: loop[0].y,
        hullDeg: hull,
        turretExtra: 0,
        moveMs: 30,
        deployed: true,
        running: true,
      },
    });
    await wait(30);
    if (cancelled()) {
      endAir(unit.instanceId);
      return;
    }
    const rounds: GunRound[] = [];
    const landings: Promise<void>[] = [];
    for (let i = 1; i < loop.length; i += 1) {
      const prev = loop[i - 1];
      const next = loop[i];
      commandAir(unit.instanceId, i);
      hull = i === loop.length - 1 ? parkFacing : headingAlong(prev, next, hull);
      const muzzles: ShotMark[] = [];
      if (i === fireAt) {
        const from = { x: next.x, y: next.y };
        const toPoint = bulletAim(to, end);
        rounds.push({
          key: `${unit.instanceId}-jet-tr`,
          x: from.x,
          y: from.y,
          to: toPoint,
          angle: headingDeg(from, toPoint),
          src: "/units-art/bullets/bulletRed1.png",
          size: tankRed1BulletH() * 0.55,
          moveMs: 0,
          released: false,
          arrived: false,
        });
        muzzles.push({
          key: `${unit.instanceId}-jet-mz`,
          x: next.x,
          y: next.y,
          angle: headingDeg(from, toPoint),
          src: "/units-art/shot/shotThin.png",
          size: tankThinShotH() * 0.55,
        });
      }
      const writeFrame = () =>
        write((p) =>
          p.flyer
            ? {
                ...p,
                hideArtId: unit.instanceId,
                flyer: { ...p.flyer, x: next.x, y: next.y, hullDeg: hull, moveMs: JET_STEP_MS },
                muzzles,
                tracers: withGunTracers(rounds, p.tracers),
                shotSrc: shotSprite(power),
                bulletSrc: bulletSprite(power),
              }
            : p,
        );
      writeFrame();
      if (i === fireAt) {
        await wait(GUN_PAINT_MS);
        if (cancelled()) {
          endAir(unit.instanceId);
          return;
        }
        for (const round of rounds) {
          if (round.released) continue;
          const from = { x: round.x, y: round.y };
          round.to = bulletAim(to, end);
          round.angle = headingDeg(from, round.to);
          round.released = true;
          round.x = round.to.x;
          round.y = round.to.y;
          round.moveMs = GUN_FLIGHT_MS;
          landings.push(scheduleGunImpact(round, rounds, write, damage, targetMaxHp, takeoff, wait, cancelled));
        }
        writeFrame();
        await wait(Math.max(0, JET_STEP_MS - GUN_PAINT_MS));
      } else {
        await wait(JET_STEP_MS);
      }
      if (cancelled()) {
        endAir(unit.instanceId);
        return;
      }
    }
    await Promise.all(landings);
    if (cancelled()) {
      endAir(unit.instanceId);
      return;
    }
    endAir(unit.instanceId);
    if (parked) {
      startJetReturn(unit, loop[loop.length - 1], jetHomePath(loop[loop.length - 1], home, 1), hull, parkFacing);
    }
    return resolveShot(
      split,
      async () => {},
      async () => {
        write(EMPTY_PLAY);
      },
    );
  }

  async function playSquadShot(
    unit: UnitInstance,
    origin: Point,
    end: Point,
    damage: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    targetMaxHp: number,
    write: PlayWriter = setPlay,
    split = false,
    to?: FxTarget,
  ): Promise<ShotAftermath | undefined> {
    const facing = poseRef.current[unit.instanceId]?.hull ?? parkedHullDeg(unit.class, unit.owner);
    const turret = poseRef.current[unit.instanceId]?.turret ?? 0;
    const muzzles = squadMuzzles(unit.defId);
    const aimNow = () => bulletAim(to, end);
    if (muzzles.length === 0) {
      const start = origin;
      write({
        ...EMPTY_PLAY,
        recoilId: unit.instanceId,
        shot: start,
        shotSrc: "/units-art/shot/shotThin.png",
        bulletSrc: "/units-art/bullets/bulletRed1.png",
        shotSize: tankThinShotH() * 0.25,
        bulletSize: tankRed1BulletH() * 0.25,
        shotAngle: headingDeg(start, aimNow()),
        shotMoveMs: 0,
      });
      await wait(RECOIL_MS);
      if (cancelled()) return;
      const aim = aimNow();
      write((p) => ({ ...p, recoilId: null, shot: aim, shotAngle: headingDeg(start, aim), shotMoveMs: GUN_FLIGHT_MS }));
      await wait(GUN_FLIGHT_MS);
      if (cancelled()) return;
      return resolveShot(
        split,
        () => finishImpact(origin, aim, damage, targetMaxHp, wait, cancelled, false, false, write),
        async () => {
          write(EMPTY_PLAY);
        },
      );
    }
    const firstAim = aimNow();
    const world = muzzles.map((m, i) => {
      const local = worldMuzzleOffset(m, facing, turret);
      const pos = { x: origin.x + local.x, y: origin.y + local.y };
      const angle = headingDeg(pos, firstAim);
      return {
        spec: m,
        pos,
        angle,
        key: `${unit.instanceId}-mz-${i}`,
      };
    });
    const muzzleMarks: ShotMark[] = world.map((w) => ({
      key: w.key,
      x: w.pos.x,
      y: w.pos.y,
      angle: w.angle,
      src: "/units-art/shot/shotThin.png",
      size: tankThinShotH() * w.spec.shotScale,
    }));
    const tracerStarts: ShotMark[] = world
      .filter((w) => w.spec.firesBullet)
      .map((w, i) => ({
        key: `${unit.instanceId}-tr-${i}`,
        x: w.pos.x,
        y: w.pos.y,
        angle: w.angle,
        src: "/units-art/bullets/bulletRed1.png",
        size: tankRed1BulletH() * w.spec.shotScale,
        moveMs: 0,
      }));
    write({
      ...EMPTY_PLAY,
      recoilId: unit.instanceId,
      muzzles: muzzleMarks,
      tracers: tracerStarts,
    });
    await wait(MUZZLE_MS);
    if (cancelled()) return;
    const aim = aimNow();
    if (tracerStarts.length > 0) {
      write((p) => ({
        ...p,
        recoilId: null,
        muzzles: [],
        tracers: tracerStarts.map((tr) => ({
          ...tr,
          x: aim.x,
          y: aim.y,
          angle: headingDeg({ x: tr.x, y: tr.y }, aim),
          moveMs: GUN_FLIGHT_MS,
        })),
      }));
      await wait(GUN_FLIGHT_MS);
    } else {
      write((p) => ({ ...p, recoilId: null, muzzles: [] }));
      await wait(120);
    }
    if (cancelled()) return;
    return resolveShot(
      split,
      async () => {
        if (damage > 0) {
          await finishImpact(origin, aim, damage, targetMaxHp, wait, cancelled, true, false, write);
          return;
        }
        if (tracerStarts.length > 0) {
          const outward = aim.x >= origin.x ? 1 : -1;
          const bounce = { x: aim.x + outward * 92, y: aim.y - 78 };
          write((p) => ({
            ...p,
            tracers: p.tracers.map((tr) => ({ ...tr, x: bounce.x, y: bounce.y, angle: headingDeg(aim, bounce), moveMs: RICOCHET_MS })),
            shotRicochet: true,
          }));
          await wait(RICOCHET_MS);
        }
      },
      async () => {
        write(EMPTY_PLAY);
      },
    );
  }

  async function finishImpact(
    start: Point,
    end: Point,
    damage: number,
    targetMaxHp: number,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    fromSquad = false,
    missile = false,
    write: PlayWriter = setPlay,
  ) {
    if (damage > 0) {
      const blasts = explosionPlacements(end, damage, targetMaxHp);
      write((p) => ({
        ...p,
        shot: null,
        tracers: [],
        muzzles: [],
        explosions: blasts.map((blast) => ({
          key: `dmg-${explosionSeq++}`,
          x: blast.x,
          y: blast.y,
          frames: DAMAGE_EXPLOSION,
          scale: blast.scale,
        })),
        dmgFloat: { x: end.x, y: end.y, amount: damage },
      }));
      await wait(Math.max(explosionDuration(DAMAGE_EXPLOSION), FLOAT_MS));
    } else if (!fromSquad && !missile) {
      const outward = end.x >= start.x ? 1 : -1;
      const bounce = { x: end.x + outward * 92, y: end.y - 78 };
      write((p) => ({
        ...p,
        explosions: [],
        shotRicochet: true,
        shot: bounce,
        shotAngle: headingDeg(end, bounce),
        shotMoveMs: RICOCHET_MS,
      }));
      await wait(RICOCHET_MS);
    }
    if (cancelled()) return;
    write(EMPTY_PLAY);
  }

  async function playCombatExchange(
    exchange: CombatExchange,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
  ) {
    primeAirborneGuns(exchange.shots);
    const aftermaths = (
      await Promise.all(
        exchange.shots.map((step) =>
          playShot(step.unitId, step.from, step.to, step.damage, wait, cancelled, {
            missile: false,
            power: step.power,
            targetMaxHp: step.targetMaxHp,
            write: writerFor(step.unitId),
            split: true,
          }),
        ),
      )
    ).filter((item): item is ShotAftermath => Boolean(item));
    if (cancelled()) return;
    await Promise.all(aftermaths.map((item) => item.impact()));
    if (cancelled()) return;
    const boardNow = visualRef.current;
    for (const step of exchange.results) {
      if (step.kind === "hp" && boardNow) {
        const unit = findUnit(boardNow, step.unitId);
        if (unit) unit.hp = step.hp;
      }
      if (step.kind === "hq") {
        setVisualHq((prev) => {
          const next: [number, number] = prev ? [...prev] : [hq0, hq1];
          next[step.player] = step.hp;
          return next;
        });
      }
    }
    bumpVisual();
    await wait(80);
    if (cancelled()) return;
    await flashHqBreaks(exchange.results, wait, cancelled);
    if (cancelled()) return;
    await Promise.all(aftermaths.map((item) => item.settle()));
  }

  function applyStrikeResults(results: CombatStrike["results"]) {
    const boardNow = visualRef.current;
    for (const step of results) {
      if (step.kind === "hp" && boardNow) {
        const unit = findUnit(boardNow, step.unitId);
        if (unit && unit.hp > step.hp) unit.hp = step.hp;
      }
      if (step.kind === "hq") {
        setVisualHq((prev) => {
          const next: [number, number] = prev ? [...prev] : [hq0, hq1];
          next[step.player] = Math.min(next[step.player], step.hp);
          return next;
        });
      }
    }
    bumpVisual();
  }

  async function playDestroy(
    unitId: string,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    write: PlayWriter = writerFor(`kill:${unitId}`),
  ) {
    const boardNow = visualRef.current;
    if (!boardNow) return;
    const unit = findUnit(boardNow, unitId);
    if (!unit) return;
    writeLayer(`move:${unitId}`, EMPTY_PLAY);
    const root = rootRef.current?.getBoundingClientRect();
    const moving = livePoint(unitId);
    const pos = moving ?? (root ? centerOfCell({ col: unit.col, row: unit.row }, root) : null);
    write({
      ...EMPTY_PLAY,
      hideArtId: unitId,
      fadeOutId: unitId,
      explosions: pos
        ? [
            {
              key: `kill-${explosionSeq++}`,
              x: pos.x,
              y: pos.y,
              frames: DESTRUCTION_EXPLOSION,
              scale: 1.15,
            },
          ]
        : [],
    });
    await wait(Math.max(DESTROY_MS, explosionDuration(DESTRUCTION_EXPLOSION)));
    if (cancelled()) return;
    const still = findUnit(boardNow, unitId);
    if (still) {
      boardNow[still.col][still.row] = null;
      bumpVisual();
    }
    write(EMPTY_PLAY);
  }

  async function playQuickStrike(
    strike: CombatStrike,
    index: number,
    kind: "gun" | "missile",
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
    kills: Map<string, Promise<void>>,
  ) {
    const step = strike.shot;
    const aftermath = await playShot(step.unitId, step.from, step.to, step.damage, wait, cancelled, {
      missile: step.side === "missile",
      power: step.power,
      targetMaxHp: step.targetMaxHp,
      write: writerFor(`${kind}:${index}:${step.unitId}`),
      direct: true,
      originAt: liveFrom(step.unitId, step.from) ?? undefined,
      targetAt: liveTo(step.to) ?? undefined,
    });
    if (cancelled()) return;
    if (aftermath) {
      await aftermath.impact();
      applyStrikeResults(strike.results);
      await flashHqBreaks(strike.results, wait, cancelled);
      if (cancelled()) return;
      await aftermath.settle();
    } else {
      applyStrikeResults(strike.results);
      await flashHqBreaks(strike.results, wait, cancelled);
    }
    const boardNow = visualRef.current;
    for (const result of strike.results) {
      if (result.kind !== "hp" || !boardNow) continue;
      const unit = findUnit(boardNow, result.unitId);
      if (unit && unit.hp <= 0 && !kills.has(unit.instanceId)) {
        kills.set(unit.instanceId, playDestroy(unit.instanceId, wait, cancelled));
      }
    }
  }

  async function runQuickCombat(
    steps: CombatStep[],
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
  ) {
    const plan = collectQuickCombat(steps);
    const boardNow = visualRef.current;
    if (boardNow) {
      for (const rest of plan.rests) {
        const unit = findUnit(boardNow, rest.unitId);
        if (unit) unit.rested = true;
      }
      for (const stat of plan.stats) {
        const unit = findUnit(boardNow, stat.unitId);
        if (unit) unit.combatAtkBonus = stat.bonus;
      }
      bumpVisual();
    }

    const kills = new Map<string, Promise<void>>();
    const tasks: Promise<void>[] = [];
    for (const [i, step] of plan.moves.entries()) {
      tasks.push(
        (async () => {
          await wait(i * 28);
          if (cancelled()) return;
          await playMove(
            step.unitId,
            step.name,
            step.unitClass,
            step.owner,
            step.from,
            step.to,
            wait,
            cancelled,
            writerFor(`move:${step.unitId}`),
          );
        })(),
      );
    }
    tasks.push(
      (async () => {
        await wait(plan.moves.length > 0 ? 120 : 40);
        if (cancelled()) return;
        await Promise.all(
          plan.guns.map((strike, i) =>
            (async () => {
              await wait(i * 45);
              if (cancelled()) return;
              await playQuickStrike(strike, i, "gun", wait, cancelled, kills);
            })(),
          ),
        );
      })(),
    );
    tasks.push(
      (async () => {
        await wait(plan.moves.length > 0 ? 260 : 80);
        if (cancelled()) return;
        if (plan.locks.length > 0 && boardNow) {
          for (const lock of plan.locks) {
            const unit = findUnit(boardNow, lock.unitId);
            if (unit) unit.missileTarget = { ...lock.to };
          }
          bumpVisual();
          await wait(460);
          if (cancelled()) return;
        }
        await Promise.all(
          plan.missiles.map((strike, i) =>
            (async () => {
              await wait(i * 60);
              if (cancelled()) return;
              await playQuickStrike(strike, i, "missile", wait, cancelled, kills);
            })(),
          ),
        );
      })(),
    );
    await Promise.all(tasks);
    if (cancelled()) return;
    await Promise.all([...kills.values()]);
    if (cancelled()) return;
    for (const step of plan.destroys) {
      if (kills.has(step.unitId)) continue;
      const leftover = visualRef.current ? findUnit(visualRef.current, step.unitId) : null;
      if (!leftover) continue;
      await playDestroy(step.unitId, wait, cancelled);
      if (cancelled()) return;
    }
  }

  async function applyCombatStep(
    step: CombatStep,
    wait: (ms: number) => Promise<unknown>,
    cancelled: () => boolean,
  ) {
    const boardNow = visualRef.current;
    if (step.kind === "phase") {
      setPhaseName(step.phase);
      setPhaseDetail(step.detail ?? null);
      await wait(PHASE_MS);
      return;
    }
    if (step.kind === "lane") {
      setLaneHl({ lane: step.lane, color: step.color });
      await wait(LANE_MS);
      return;
    }
    if (step.kind === "move" && boardNow) {
      const unit = findUnit(boardNow, step.unitId);
      await playMove(step.unitId, step.name, step.unitClass, step.owner, step.from, step.to, wait, cancelled);
      if (cancelled() || !unit) return;
      if (unit.col !== step.to.col || unit.row !== step.to.row) {
        moveUnitOnBoard(boardNow, unit, step.to.col, step.to.row);
        bumpVisual();
      }
      return;
    }
    if (step.kind === "rest" && boardNow) {
      const unit = findUnit(boardNow, step.unitId);
      if (unit) unit.rested = true;
      bumpVisual();
      await wait(REST_MS);
      return;
    }
    if (step.kind === "keywordPop") {
      setKeywordPop({ unitId: step.unitId, keyword: step.keyword, amount: step.amount });
      await wait(KEYWORD_MS);
      if (cancelled()) return;
      setKeywordPop(null);
      return;
    }
    if (step.kind === "statAtk" && boardNow) {
      const unit = findUnit(boardNow, step.unitId);
      if (unit) unit.combatAtkBonus = step.bonus;
      bumpVisual();
      await wait(STAT_MS);
      return;
    }
    if (step.kind === "shot") {
      await playShot(step.unitId, step.from, step.to, step.damage, wait, cancelled, {
        missile: step.side === "missile",
        power: step.power,
        targetMaxHp: step.targetMaxHp,
      });
      return;
    }
    if (step.kind === "hp" && boardNow) {
      const unit = findUnit(boardNow, step.unitId);
      if (unit) unit.hp = step.hp;
      bumpVisual();
      await wait(80);
      return;
    }
    if (step.kind === "hq") {
      setVisualHq((prev) => {
        const next: [number, number] = prev ? [...prev] : [hq0, hq1];
        next[step.player] = step.hp;
        return next;
      });
      await wait(160);
      return;
    }
    if (step.kind === "hqBreakpoint") {
      await flashHqBreaks([step], wait, cancelled);
      return;
    }
    if (step.kind === "missileLock" && boardNow) {
      const unit = findUnit(boardNow, step.unitId);
      if (unit) unit.missileTarget = { ...step.to };
      bumpVisual();
      await wait(460);
      return;
    }
    if (step.kind === "destroy") {
      await playDestroy(step.unitId, wait, cancelled, setPlay);
    }
  }

  function flyerOverlay(flyer: Omit<FlyerPlay, "unitId"> & { unitId?: string }, key: string) {
    const defId = flyer.defId;
    const painted = Boolean(defId && (getUnitArt(defId) || getSpriteArt(defId) || getSquadArt(defId)));
    const squad = isSquadClass(flyer.unitClass) || Boolean(defId && getSquadArt(defId));
    return (
      <div
        key={key}
        className={`fx-flyer ${painted && !squad ? "sprite" : ""} ${squad ? "squad" : ""}`}
        style={{
          left: flyer.x,
          top: flyer.y,
          background: painted || squad ? undefined : CLASS_COLOR[flyer.unitClass],
          transitionDuration: `${flyer.moveMs}ms`,
        }}
      >
        <UnitArt
          name={flyer.name}
          unitClass={flyer.unitClass}
          unitId={flyer.defId}
          facingDeg={flyer.hullDeg}
          turretExtraDeg={flyer.turretExtra}
          deployed={flyer.deployed ?? true}
          running={flyer.running ?? false}
          showProps={false}
          compact
        />
      </div>
    );
  }

  function renderCell(col: number, row: number) {
    const unit = board[col][row];
    const deployable =
      deployEnabled && deployPlayer !== null && col === supportCol(deployPlayer) && !unit;
    const reachable = reachableCells.some((pos) => pos.col === col && pos.row === row);
    const front = col === frontCol(0) || col === frontCol(1);
    const leftover = squadGround.leftover.filter((item) => item.col === col && item.row === row);
    const parked = unit ? pose[unit.instanceId] : undefined;
    const groundPhase = unit ? squadGround.phase[unit.instanceId] ?? null : null;
    return (
      <div
        key={`${col}-${row}`}
        ref={(el) => {
          cellRefs.current[`${col}-${row}`] = el;
        }}
        className={`cell ${front ? "front" : "support"} ${parkAlign(col) === "left" ? "park-left" : "park-right"} ${deployable ? "deployable" : ""} ${reachable ? "reachable" : ""}`}
        data-tut={`cell-${col}-${row}`}
        onClick={() => onSelectCell(col, row)}
        onDragOver={(event) => {
          if (dropKind === "card" || dropKind === "unit" || deployable || reachable) allowDrop(event);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDropCell?.(col, row, event);
        }}
      >
        {leftover.map((item) => (
          <div key={item.key} className="squad-ground leaving">
            <SquadArt unitId={item.defId} facingDeg={item.facingDeg} deployed showSoldiers={false} showProps />
          </div>
        ))}
        {missileLocks.has(`${col}-${row}`) ? (
          <div className="missile-lock" aria-hidden>
            <i className="arm n" />
            <i className="arm e" />
            <i className="arm s" />
            <i className="arm w" />
          </div>
        ) : null}
        {unit ? (
          <UnitToken
            unit={unit}
            match={match}
            layout="board"
            parkAlign={parkAlign(unit.col)}
            hullDeg={parked?.hull}
            turretExtraDeg={parked?.turret ?? 0}
            deployed
            groundPhase={groundPhase}
            selected={selectedIds.includes(unit.instanceId)}
            kwFocus={kwFocusId === unit.instanceId}
            hostileAim={hostileAimIds.includes(unit.instanceId)}
            hideArt={artHidden(unit.instanceId)}
            fadeInfo={Object.values(fxLayers).some((layer) => layer.fadeId === unit.instanceId)}
            fadeOut={Object.values(fxLayers).some((layer) => layer.fadeOutId === unit.instanceId)}
            recoil={Object.values(fxLayers).some((layer) => layer.recoilId === unit.instanceId) ? unit.owner : null}
            keywordPop={
              keywordPop?.unitId === unit.instanceId
                ? { keyword: keywordPop.keyword, amount: keywordPop.amount }
                : null
            }
            onClick={() => onSelectUnit(unit)}
            onMissileAim={(mode) => aimMissile(unit.instanceId, mode)}
            onAtkAim={() => aimAtk(unit.instanceId)}
            forecastHp={hpForecast.get(unit.instanceId)}
            atkAiming={aim?.kind === "atk" && aim.unitId === unit.instanceId}
          />
        ) : (
          <span className="empty">{deployable ? "Drop here" : reachable ? reachableLabel : ""}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`battlefield ${dropKind === "card" ? "drop-play" : ""}`}
      ref={rootRef}
      onDragOver={(event) => {
        if (dropKind === "card") allowDrop(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropBoard?.(event);
      }}
    >
      <SgBrackets />
      {phaseName && (
        <div className="combat-phase-banner">
          {PHASE_LABEL[phaseName]}
          {phaseDetail ? ` · ${phaseDetail}` : ""}
        </div>
      )}
      <HqPillar
        player={0}
        showSurrender={viewer === 0 && Boolean(onSurrender)}
        surrenderDisabled={surrenderDisabled}
        onSurrender={onSurrender}
        onRequestSurrender={onRequestSurrender}
        onToggleExit={onToggleExit}
        hp={hq0}
        maxHp={playerHqMax(match.players[0])}
        triggered={match.players[0].triggeredBreakpoints}
        animating={visualHq !== null}
        crack={hqCrack?.player === 0}
        crackBps={hqCrack?.player === 0 ? hqCrack.bps : []}
        supplyBonus={match.players[0].nextTurnSupplyBonus}
        drawBonus={match.players[0].nextTurnDrawBonus}
        active={match.currentPlayer === 0}
        onClick={() => onSelectHq(0)}
        innerRef={(el) => {
          hqRefs.current[0] = el;
        }}
        intel={viewer === 1 ? opponentIntel : null}
      />
      <HqFaceFlank
        player={0}
        aimRef={(el) => {
          hqArtRefs.current[0] = el;
        }}
      />
      <div className="grid-wrap">
        <div className="board">
          {Array.from({ length: ROWS }, (_, row) => (
            <div className={`lane ${laneHl?.lane === row ? `hl-${laneHl.color}` : ""}`} key={row}>
              {renderCell(0, row)}
              {renderCell(1, row)}
              <div className="lane-border" aria-hidden />
              {renderCell(2, row)}
              {renderCell(3, row)}
            </div>
          ))}
        </div>
      </div>
      <HqFaceFlank
        player={1}
        aimRef={(el) => {
          hqArtRefs.current[1] = el;
        }}
      />
      <HqPillar
        player={1}
        showSurrender={viewer === 1 && Boolean(onSurrender)}
        surrenderDisabled={surrenderDisabled}
        onSurrender={onSurrender}
        onRequestSurrender={onRequestSurrender}
        hp={hq1}
        maxHp={playerHqMax(match.players[1])}
        triggered={match.players[1].triggeredBreakpoints}
        animating={visualHq !== null}
        crack={hqCrack?.player === 1}
        crackBps={hqCrack?.player === 1 ? hqCrack.bps : []}
        supplyBonus={match.players[1].nextTurnSupplyBonus}
        drawBonus={match.players[1].nextTurnDrawBonus}
        active={match.currentPlayer === 1}
        onClick={() => onSelectHq(1)}
        innerRef={(el) => {
          hqRefs.current[1] = el;
        }}
        intel={viewer === 0 ? opponentIntel : null}
      />
      {aimLine ? (
        <svg className="missile-arc" aria-hidden>
          <path d={aimLine.straight ? aimStraightPath(aimLine.from, aimLine.to) : aimArcPath(aimLine.from, aimLine.to)} />
        </svg>
      ) : null}
      <div className="fx-layer" aria-hidden>
        {Object.entries(fxLayers).map(([layerId, layer]) => (
          <div key={layerId}>
            {layer.flyer && flyerOverlay(layer.flyer, `${layerId}-flyer`)}
            {layer.drones.map((drone) => (
              <div
                key={drone.key}
                className="fx-drone"
                style={{
                  left: drone.x,
                  top: drone.y,
                  width: drone.width ?? 32,
                  height: drone.height ?? 32,
                  transform: `translate(-50%, -50%) rotate(${drone.hullDeg}deg)`,
                  transitionDuration: `${drone.moveMs}ms`,
                }}
              >
                <img src={drone.src} alt="" />
              </div>
            ))}
            {layer.missileWakes.map((wake) => (
              <div
                key={wake.key}
                className="fx-missile-wake"
                style={{
                  left: wake.x,
                  top: wake.y,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <img src={missileTrailSprite(wake.age)} alt="" height={missileWakeHeight(wake.age, wake.scale)} />
              </div>
            ))}
            {layer.shot && layer.shotMissile && (
              <div
                className={`fx-missile ${layer.shotFalling ? "falling" : ""}`}
                style={{
                  left: layer.shot.x,
                  top: layer.shot.y,
                  transform: `translate(-50%, -50%) rotate(${layer.shotAngle}deg) scale(${layer.shotMissileScale})`,
                  transitionDuration: `${layer.shotMoveMs}ms`,
                  transitionTimingFunction: "linear",
                }}
              >
                <img className="fx-missile-body" src={MISSILE_SPRITE} alt="" />
                <img className="fx-missile-jet" src={MISSILE_JET_SPRITE} alt="" />
              </div>
            )}
            {layer.shot && !layer.shotMissile && (
              <>
                <img
                  className={`fx-proj blast ${layer.shotRicochet ? "ricochet" : ""}`}
                  src={layer.shotSrc}
                  alt=""
                  style={{
                    left: layer.shot.x,
                    top: layer.shot.y,
                    height: layer.shotSize,
                    transform: `translate(-50%, -50%) rotate(${layer.shotAngle}deg)`,
                    ...projMotion(layer.shotMoveMs),
                  }}
                />
                <img
                  className={`fx-proj tracer ${layer.shotRicochet ? "ricochet" : ""}`}
                  src={layer.bulletSrc}
                  alt=""
                  style={{
                    left: layer.shot.x,
                    top: layer.shot.y,
                    height: layer.bulletSize,
                    transform: `translate(-50%, -50%) rotate(${layer.shotAngle}deg)`,
                    ...projMotion(layer.shotMoveMs),
                  }}
                />
              </>
            )}
            {layer.muzzles.map((mz) => (
              <img
                key={mz.key}
                className="fx-muzzle"
                src={mz.src}
                alt=""
                style={{
                  left: mz.x,
                  top: mz.y,
                  height: mz.size,
                  transform: `translate(-50%, -50%) rotate(${mz.angle}deg)`,
                }}
              />
            ))}
            {layer.tracers.map((tr) => (
              <img
                key={tr.key}
                className={`fx-proj tracer ${layer.shotRicochet ? "ricochet" : ""}`}
                src={tr.src}
                alt=""
                style={{
                  left: tr.x,
                  top: tr.y,
                  height: tr.size,
                  transform: `translate(-50%, -50%) rotate(${tr.angle}deg)`,
                  ...projMotion(tr.moveMs ?? 0),
                }}
              />
            ))}
            {layer.explosions.map((blast) => (
              <ExplosionFx key={blast.key} x={blast.x} y={blast.y} frames={blast.frames} scale={blast.scale} />
            ))}
            {layer.dmgFloat && (
              <div className="fx-dmg" style={{ left: layer.dmgFloat.x, top: layer.dmgFloat.y }}>
                -{layer.dmgFloat.amount}
              </div>
            )}
          </div>
        ))}
        {jetReturns.map((jet) => flyerOverlay(jet, `jet-home-${jet.unitId}`))}
        {jetStations.map((station) => flyerOverlay(station.flyer, `jet-hold-${station.unitId}`))}
        {droneStations.flatMap((station) => station.drones).map((drone) => (
          <div
            key={drone.key}
            className="fx-drone"
            style={{
              left: drone.x,
              top: drone.y,
              width: drone.width ?? 32,
              height: drone.height ?? 32,
              transform: `translate(-50%, -50%) rotate(${drone.hullDeg}deg)`,
              transitionDuration: `${drone.moveMs}ms`,
            }}
          >
            <img src={drone.src} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HqPillar({
  player,
  showSurrender,
  surrenderDisabled,
  onSurrender,
  onRequestSurrender,
  onToggleExit,
  hp,
  maxHp,
  triggered,
  animating,
  crack,
  crackBps,
  supplyBonus,
  drawBonus,
  active,
  onClick,
  innerRef,
  intel = null,
}: {
  player: PlayerId;
  showSurrender?: boolean;
  surrenderDisabled?: boolean;
  onSurrender?: () => void;
  onRequestSurrender?: () => void;
  onToggleExit?: () => void;
  hp: number;
  maxHp: number;
  triggered: number[];
  animating: boolean;
  crack: boolean;
  crackBps: number[];
  supplyBonus: number;
  drawBonus: number;
  active: boolean;
  onClick: () => void;
  innerRef: (el: HTMLButtonElement | null) => void;
  intel?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const nextBp = nextHqBreakpoint(hp, triggered);
  const note =
    crack && crackBps.length > 0
      ? `Comeback +1 Supply · +1 Draw`
      : supplyBonus > 0 || drawBonus > 0
        ? `+${supplyBonus} Supply · +${drawBonus} Draw`
        : null;
  return (
    <div className={`hq-slot p${player} ${intel ? "with-intel" : ""}`}>
    <div className="hq-top">
    {player === 0 && onToggleExit ? (
      <button
        type="button"
        className="match-back"
        title="Leave match"
        aria-label="Leave match"
        onClick={onToggleExit}
      >
        <img src={sgIcon("back", "cyan")} alt="" width={22} height={22} draggable={false} />
      </button>
    ) : null}
    <div className="hq-stack">
    <button
      type="button"
      className={`hq ${active ? "active" : ""} ${crack ? "crack" : ""}`}
      data-tut={`hq-${player}`}
      title={`HQ ${maxHp} HP. Comeback after losing ${HQ_COMEBACK_LOSS_STEPS.join("/")} HP (marks at ${HQ_BREAKPOINTS.join("/")} remaining). Reduce enemy HQ to 0 to win.`}
      onClick={onClick}
      ref={innerRef}
    >
      <div className="hq-label">HQ P{player + 1}</div>
      <div className="hq-bar">
        <div className="hq-fill" style={{ width: `${pct}%` }} />
        {HQ_BREAKPOINTS.map((bp, i) => {
          const broken = triggered.includes(bp) && (!animating || hp <= bp);
          const isNext = nextBp === bp;
          const lossStep = HQ_COMEBACK_LOSS_STEPS[i] ?? HQ_MAX_HP - bp;
          const at = `${(bp / maxHp) * 100}%`;
          return (
            <span
              key={bp}
              className={`hq-mark ${broken ? "broken" : ""} ${isNext ? "next" : ""} ${crackBps.includes(bp) ? "flash" : ""}`}
              style={player === 1 ? { right: at, left: "auto" } : { left: at }}
              data-tut={isNext ? `hq-bp-${player}` : undefined}
              title={`Comeback mark at ${bp} HQ (after losing ${lossStep} more from the previous mark)`}
            >
              <em className="hq-bp-num">{bp}</em>
            </span>
          );
        })}
      </div>
      <div className="hq-hp">{hp}</div>
      {note ? <div className="hq-break-note">{note}</div> : null}
    </button>
    {intel ? <div className={`hq-intel ${note ? "under-note" : ""}`}>{intel}</div> : null}
    </div>
    {showSurrender ? (
      <button
        type="button"
        className="surrender-flag"
        disabled={surrenderDisabled}
        title="Surrender"
        onClick={() => (onRequestSurrender ? onRequestSurrender() : onSurrender?.())}
      >
        <WhiteFlagIcon />
      </button>
    ) : null}
    </div>
    </div>
  );
}
