export type PlayerId = 0 | 1;

export type UnitClass =
  | "Tank"
  | "Light Vehicle"
  | "Helicopter"
  | "Artillery"
  | "Robot"
  | "Armored Infantry"
  | "Motorcycle"
  | "Drone"
  | "Jet Plane";

export type CardType = "special" | "maneuver" | "move";

export type Phase = "deployment" | "maneuver" | "engagement" | "gameover";

export type Direction =
  | "forward"
  | "forwardUp"
  | "forwardDown"
  | "back"
  | "up"
  | "down"
  | "upBack"
  | "downBack";

export type KeywordName =
  | "cover"
  | "flank"
  | "retaliate"
  | "aggressive"
  | "blitz"
  | "supportFire"
  | "artillery"
  | "airStrike"
  | "missile"
  | "jetPlane";

export interface Keyword {
  name: KeywordName;
  value: number;
}

export type TargetKind =
  | "friendly"
  | "enemy"
  | "enemySupport"
  | "anyEnemy"
  | "selfOrHq"
  | "allyOrHq"
  | "hqOrAlly"
  | "twoAdjacentAllies"
  | "twoAllies"
  | "direction"
  | "upOrDown"
  | "boardDest"
  | "upMove"
  | "downMove"
  | "anyDirection"
  | "twoDirectionsSameUnit"
  | "twoUnitsOneStep"
  | "upDownOrBack"
  | "lure"
  | "anyUnit";

export type EffectId =
  | "forward"
  | "up"
  | "down"
  | "retreat"
  | "upOrDown"
  | "supply"
  | "fortify"
  | "concentratedFire"
  | "reorganize"
  | "lure"
  | "forceEngage"
  | "quickEngage"
  | "artilleryCall"
  | "missileBarrage"
  | "targetRegistration"
  | "extraCombat"
  | "moveAnyDirection"
  | "intelAcquired"
  | "moveUnitTwice"
  | "moveTwoUnits"
  | "swiftManeuver"
  | "maintenance"
  | "sniping"
  | "siegeLock"
  | "heavyOverdrive"
  | "emergencyOverhaul"
  | "tacticalFallback"
  | "fieldRepair"
  | "strafingRun"
  | "precisionAirStrike"
  | "rallyAssault"
  | "evacExtraction"
  | "precisionStrike"
  | "sustainedSalvo"
  | "supplyLogistics"
  | "plasmaCharge"
  | "tacticalOverdrive"
  | "strategicShift"
  | "bunkerBreaker"
  | "digInProtocol"
  | "emergencyMedicalKit"
  | "hitAndRun"
  | "driveByStrafe"
  | "vanguardFocus"
  | "nanoRepair"
  | "kamikazeBlast"
  | "emergencyFallback"
  | "thunderStrike"
  | "ambush"
  | "trap"
  | "tacticalStrike"
  | "visionSupport"
  | "stormCaller"
  | "quickMobilization"
  | "diversionToLane"
  | "diversionDown"
  | "diversionUp"
  | "coordinate"
  | "analyzeWeakness"
  | "stickyBomb"
  | "entrenchment"
  | "firstAidKit"
  | "deadlyPresence"
  | "targetAcquired"
  | "hqRepair"
  | "deathFromAbove"
  | "silentDeath"
  | "initiative";

export interface CardDef {
  templateId: string;
  name: string;
  type: CardType;
  cost: number;
  text: string;
  effectId: EffectId;
  targets: TargetKind[];
  /** When true, playing this special fizzles if the owner unit is not on the board. */
  requiresSourceOnField?: boolean;
}

export interface UnitDef {
  id: number;
  name: string;
  class: UnitClass;
  hp: number;
  atk: number;
  armor: number;
  ap: number;
  cost: number;
  keywords: Keyword[];
  cards: CardDef[];
  /** Flavor text shown in the unit detail dialog. */
  lore: string;
  /** True when the unit has composed hull/turret art; otherwise the class-color placeholder is used. */
  hasArt: boolean;
}

export interface CardInstance {
  instanceId: string;
  /** Catalog / tutorial unit id that owns this card. */
  ownerUnitId: number;
  templateId: string;
  name: string;
  type: CardType;
  cost: number;
  text: string;
  effectId: EffectId;
  targets: TargetKind[];
  /** When true, playing this special fizzles if the owner unit is not on the board. */
  requiresSourceOnField?: boolean;
}

export interface UnitInstance {
  instanceId: string;
  defId: number;
  name: string;
  class: UnitClass;
  owner: PlayerId;
  hp: number;
  maxHp: number;
  atk: number;
  armor: number;
  ap: number;
  cost: number;
  col: number;
  row: number;
  keywords: Keyword[];
  tempAtk: number;
  tempArmor: number;
  tempAp: number;
  tempRetaliate: number;
  rested: boolean;
  combatAtkBonus: number;
  /** True when this unit is the striker of the current attack, not merely the turn player. */
  isAttacker: boolean;
}

export interface PlayerState {
  id: PlayerId;
  hqHp: number;
  triggeredBreakpoints: number[];
  commandPoints: number;
  /** Added to Supply at the start of this player's next turn, then cleared. */
  nextTurnSupplyBonus: number;
  /** Extra cards drawn at the start of this player's next turn, then cleared. */
  nextTurnDrawBonus: number;
  /** Starting army unit ids (stable for the match). */
  army: number[];
  undeployed: number[];
  /** Unit defIds the opponent has seen deployed (public for deck tracker). */
  revealedUnitIds: number[];
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  discardRedrawsUsed: number;
  /** Units summoned during the current Deployment phase (resets each turn). */
  deploysThisTurn: number;
  turnsTaken: number;
  thinkingTimeSeconds: number;
  /** Added to base Supply every Deployment. Vs-AI difficulty. */
  baseSupplyBonus?: number;
  /** Extra cards on top of the normal per-turn draw. */
  drawPerTurnBonus?: number;
  /** When the deck is empty, shuffle the discard pile back in. */
  recycleDeck?: boolean;
  /** HQ bar and heals use this instead of {@link HQ_MAX_HP} when set. */
  hqMaxHp?: number;
  /** Permanent stat changes applied when this player deploys a unit. */
  deployBuff?: DeployBuff;
}

/** Stat bumps applied from the unit's printed Armor when it is deployed. */
export interface DeployBuff {
  /** HP added to every unit. */
  hp: number;
  /** Extra HP when printed Armor is above 3. */
  highArmorHp: number;
  /** ATK added when printed Armor is above 3. */
  highArmorAtk: number;
  /** Armor added when printed Armor is 3 or less. */
  lowArmor: number;
}

export type BoardPos = { col: number; row: number };

/** Choices for Fully Prepared. `forward` is kept as an alias of `move` (tutorial / older clients). */
export type InitiativeChoice = "supply" | "forward" | "move" | "nextSupply";

export interface PlayTargets {
  unitIds?: string[];
  directions?: Direction[];
  cells?: BoardPos[];
  hq?: boolean;
  choice?: InitiativeChoice;
}

export type Action =
  | {
      type: "deploy";
      unitDefId: number;
      row: number;
      discardCardIds?: string[];
    }
  | { type: "endDeployment" }
  | { type: "discardRedraw"; cardId: string }
  | { type: "playCard"; cardId: string; targets: PlayTargets }
  | { type: "endManeuver" }
  | { type: "endEngagement" }
  | { type: "surrender"; by?: PlayerId };

export type StatusDuration =
  | "endOfTurn"
  | "endOfNextTurn"
  | "thisCombat"
  | "untilConsumed";

export type StatusKind =
  | "modAtk"
  | "modAp"
  | "modArmor"
  | "modMissile"
  | "missileIgnoreArmor"
  | "missileSplash"
  | "artilleryRepeat"
  | "atkUnmodifiable"
  | "supportFireGrantsAp"
  | "redirectEmptyLane"
  | "missileLaneMark"
  | "afterAttackSelfDamage"
  | "regen"
  | "untargetable"
  | "suppressKeywords";

export interface StatusEffect {
  id: string;
  kind: StatusKind;
  magnitude: number;
  sourceId: string | number;
  owner: PlayerId;
  targetId?: string;
  lane?: number;
  duration: StatusDuration;
  remainingPasses: number;
  hitKeys?: string[];
  /** Keywords stripped by `suppressKeywords`, restored when the status expires. */
  suppressedKeywords?: Keyword[];
}

export type CombatPhaseName =
  | "relocation"
  | "stats"
  | "damage"
  | "cleanup"
  | "missile";

export type CombatStep =
  | { kind: "phase"; phase: CombatPhaseName; detail?: string }
  | { kind: "lane"; lane: number; color: "green" | "yellow" | "red" | "orange" }
  | {
      kind: "move";
      unitId: string;
      name: string;
      unitClass: UnitClass;
      owner: PlayerId;
      from: BoardPos;
      to: BoardPos;
    }
  | { kind: "rest"; unitId: string }
  | { kind: "keywordPop"; unitId: string; keyword: KeywordName; amount: number }
  | { kind: "statAtk"; unitId: string; bonus: number; total: number }
  | {
      kind: "shot";
      unitId: string;
      name: string;
      owner: PlayerId;
      from: BoardPos;
      to: FxTarget;
      damage: number;
      side: "attack" | "counter" | "missile";
      /** ATK + Penetration used to pick shot/bullet sprites. */
      power: number;
      targetMaxHp: number;
    }
  | { kind: "hp"; unitId: string; hp: number; lost: number }
  | { kind: "hq"; player: PlayerId; hp: number; damage: number }
  | { kind: "hqBreakpoint"; player: PlayerId; bp: number; supply: number; draw: number }
  | { kind: "destroy"; unitId: string };

export interface CombatPlayback {
  steps: CombatStep[];
  initialBoard: (UnitInstance | null)[][];
  initialHq: [number, number];
}

export type LogIcon = KeywordName | "atk" | "hp" | "supply" | "card";

export interface LogEntry {
  text: string;
  icon?: LogIcon;
  children?: LogEntry[];
}

export type ActionResult =
  | { ok: true; state: MatchState }
  | { ok: false; error: string };

export type FxTarget = BoardPos | { hq: PlayerId };

export type FxEvent =
  | {
      kind: "move";
      unitId: string;
      name: string;
      unitClass: UnitClass;
      owner: PlayerId;
      from: BoardPos;
      to: BoardPos;
    }
  | {
      kind: "attack";
      unitId: string;
      name: string;
      owner: PlayerId;
      from: BoardPos;
      to: FxTarget;
      damage: number;
      power: number;
      targetMaxHp: number;
      kamikaze?: boolean;
      missile?: boolean;
      defId?: number;
    };

export interface MatchState {
  players: [PlayerState, PlayerState];
  board: (UnitInstance | null)[][];
  currentPlayer: PlayerId;
  /** Player who took the opening turn; the other gets early Supply bonus. */
  firstPlayerId: PlayerId;
  phase: Phase;
  turn: number;
  winner: PlayerId | null;
  winReason?: "hq" | "surrender" | "elimination";
  seed: number;
  rngState: number;
  log: LogEntry[];
  /** Transient sink for nested log groups; not part of cloned snapshots. */
  logSink?: LogEntry[];
  fx: FxEvent[];
  combatPlayback: CombatPlayback | null;
  /** After mid-turn extra combat, `endEngagement` restores this phase instead of passing the turn. */
  combatResumePhase: Phase | null;
  statuses: StatusEffect[];
  idSeq: number;
  phaseStartTime: number | null;
}

export const ROWS = 5;
export const COLS = 4;
export const HQ_MAX_HP = 60;

export function playerHqMax(player: { hqMaxHp?: number }): number {
  return player.hqMaxHp && player.hqMaxHp > 0 ? player.hqMaxHp : HQ_MAX_HP;
}
export const ARMY_SIZE = 8;
export const OPENING_HAND = 5;
export const DRAW_PER_TURN = 2;
export const BASE_SUPPLY = 4;
export const SECOND_PLAYER_OPENING_SUPPLY = 1;
/** How many of the second player's early turns get the opening Supply bonus. */
export const SECOND_PLAYER_OPENING_TURNS = 2;
export const INITIATIVE_TEMPLATE_ID = "initiative";
export const HAND_LIMIT = 9;
export const DISCARD_REDRAW_LIMIT = 2;
/**
 * Comeback steps by HQ HP lost from full (first 20, then +15, +10, +5).
 * Remaining-HP marks = HQ_MAX_HP minus the running total lost.
 */
export const HQ_COMEBACK_LOSS_STEPS = [20, 15, 10, 5] as const;

/** Remaining-HP values where each comeback mark fires (derived from loss steps). */
export const HQ_BREAKPOINTS = (() => {
  let lost = 0;
  return HQ_COMEBACK_LOSS_STEPS.map((step) => {
    lost += step;
    return HQ_MAX_HP - lost;
  }) as unknown as readonly [
    number,
    number,
    number,
    number,
  ];
})();

/** Next HQ mark that can still grant comeback when HP first crosses it. */
export function nextHqBreakpoint(
  hp: number,
  triggered: readonly number[],
): number | null {
  for (const bp of HQ_BREAKPOINTS) {
    if (hp > bp && !triggered.includes(bp)) return bp;
  }
  return null;
}

export const P1_SUPPORT = 0;
export const P1_FRONT = 1;
export const P2_FRONT = 2;
export const P2_SUPPORT = 3;
