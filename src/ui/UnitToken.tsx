import { getUnitArt } from "../data/unitArt";
import { getSquadArt } from "../data/squadArt";
import { getSpriteArt } from "../data/spriteArt";
import { keywordsWithMods, missileMod } from "../engine/status";
import type { Keyword, MatchState, UnitClass, UnitInstance } from "../engine/types";
import { TankArt } from "./TankArt";
import { SquadArt } from "./SquadArt";
import { SpriteArt } from "./SpriteArt";
import { parkedHullDeg, usesDriveRig } from "./movePath";
import {
  ApChip,
  ArmorChip,
  AtkChip,
  HpChip,
  KEYWORD_ICON_SIZE,
  KeywordChip,
  SupplyChip,
} from "./icons";

export const CLASS_COLOR: Record<UnitClass, string> = {
  Tank: "#4c6b34",
  "Light Vehicle": "#8a6a32",
    Helicopter: "#2d6380",
    Artillery: "#8a4a1c",
    Robot: "#53407a",
    "Armored Infantry": "#555555",
    Motorcycle: "#7a3030",
    Drone: "#1f6b6b",
    "Jet Plane": "#3d4a80",
  };

export function UnitArt({
  name,
  unitClass,
  compact,
  unitId,
  facingDeg = 0,
  turretExtraDeg = 0,
  deployed = true,
  running = false,
  showProps,
}: {
  name: string;
  unitClass: UnitClass;
  compact?: boolean;
  unitId?: number;
  facingDeg?: number;
  turretExtraDeg?: number;
  deployed?: boolean;
  running?: boolean;
  showProps?: boolean;
}) {
  const spec = unitId ? getUnitArt(unitId) : undefined;
  const sprite = unitId ? getSpriteArt(unitId) : undefined;
  if (spec) {
    return (
      <div className={`unit-art has-sprite ${compact ? "compact" : ""}`} title={name}>
        <TankArt spec={spec} facingDeg={facingDeg} turretExtraDeg={turretExtraDeg} walking={running} />
      </div>
    );
  }
  if (sprite) {
    return (
      <div className={`unit-art has-sprite ${compact ? "compact" : ""}`} title={name}>
        <SpriteArt spec={sprite} facingDeg={facingDeg} running={running} />
      </div>
    );
  }
  if (unitId && getSquadArt(unitId)) {
    return (
      <div className={`unit-art has-squad ${compact ? "compact" : ""}`} title={name}>
        <SquadArt
          unitId={unitId}
          unitClass={unitClass}
          facingDeg={facingDeg}
          turretExtraDeg={turretExtraDeg}
          deployed={deployed}
          running={running}
          showProps={showProps}
        />
      </div>
    );
  }
  return (
    <div
      className={`unit-art ${compact ? "compact" : ""} ${!running && unitClass === "Helicopter" ? "air-hover" : ""}`}
      style={{ background: CLASS_COLOR[unitClass] }}
      title={name}
    >
      <span className="unit-art-face" style={{ transform: `rotate(${facingDeg}deg)` }}>
        {name}
      </span>
    </div>
  );
}

export function UnitPortrait({
  name,
  unitClass,
  compact,
  cost,
  hp,
  maxHp,
  armor,
  atk,
  ap,
  atkBoost,
  unitId,
  facingDeg = 0,
  turretExtraDeg = 0,
  deployed = true,
  running = false,
  showProps,
}: {
  name: string;
  unitClass: UnitClass;
  compact?: boolean;
  cost: number;
  hp: number;
  maxHp?: number;
  armor: number;
  atk: number;
  ap: number;
  atkBoost?: boolean;
  unitId?: number;
  facingDeg?: number;
  turretExtraDeg?: number;
  deployed?: boolean;
  running?: boolean;
  showProps?: boolean;
}) {
  return (
    <div className={`unit-portrait ${compact ? "compact" : ""}`}>
      <UnitArt
        name={name}
        unitClass={unitClass}
        compact={compact}
        unitId={unitId}
        facingDeg={facingDeg}
        turretExtraDeg={turretExtraDeg}
        deployed={deployed}
        running={running}
        showProps={showProps}
      />
      <div className="port-tl">
        {cost > 0 ? <SupplyChip value={cost} /> : null}
      </div>
      <div className="port-tr">
        {armor > 0 ? <ArmorChip value={armor} tut={unitId ? `armor-${unitId}` : undefined} /> : null}
      </div>
      <div className="port-bl" data-tut={unitId ? `hp-${unitId}` : undefined}>
        <HpChip value={hp} max={maxHp} />
      </div>
      <div className="port-br" data-tut={unitId ? `atk-${unitId}` : undefined}>
        {ap > 0 ? <ApChip value={ap} tut={unitId ? `ap-${unitId}` : undefined} /> : null}
        {atk > 0 ? <AtkChip value={atk} boost={atkBoost} /> : null}
      </div>
    </div>
  );
}

export function UnitKeywords({
  keywords,
  size = KEYWORD_ICON_SIZE,
  unitId,
  boosted,
}: {
  keywords: Keyword[];
  size?: number;
  unitId?: number;
  /** Keyword names currently raised by a temporary mod (e.g. Missile +4). */
  boosted?: Partial<Record<Keyword["name"], boolean>>;
}) {
  return (
    <div className="unit-keys">
      {keywords.map((k) => (
        <KeywordChip
          key={k.name}
          keyword={k}
          size={size}
          boost={boosted?.[k.name]}
          tut={unitId ? `kw-${k.name}-${unitId}` : undefined}
        />
      ))}
    </div>
  );
}

export function UnitToken({
  unit,
  match,
  selected,
  hostileAim,
  hideArt,
  fadeInfo,
  fadeOut,
  recoil,
  keywordPop,
  layout = "card",
  parkAlign: parkSide,
  hullDeg,
  turretExtraDeg = 0,
  deployed = true,
  running = false,
  groundPhase = null,
  onClick,
}: {
  unit: UnitInstance;
  match?: MatchState;
  selected?: boolean;
  hostileAim?: boolean;
  hideArt?: boolean;
  fadeInfo?: boolean;
  fadeOut?: boolean;
  recoil?: 0 | 1 | null;
  keywordPop?: { keyword: UnitInstance["keywords"][number]["name"]; amount: number } | null;
  layout?: "card" | "board";
  parkAlign?: "left" | "right";
  hullDeg?: number;
  turretExtraDeg?: number;
  deployed?: boolean;
  running?: boolean;
  groundPhase?: "hold" | "arriving" | null;
  onClick?: () => void;
}) {
  const recoilClass = recoil === 0 ? "recoil-0" : recoil === 1 ? "recoil-1" : "";
  const atk = unit.atk + unit.tempAtk + unit.combatAtkBonus;
  const dying = unit.hp <= 0;
  const keywords = match ? keywordsWithMods(match, unit) : unit.keywords;
  const missileBoost = match ? missileMod(match, unit) !== 0 : false;
  const facing = usesDriveRig(unit.class)
    ? (hullDeg ?? parkedHullDeg(unit.class, unit.owner))
    : parkedHullDeg(unit.class, unit.owner);
  return (
    <button
      type="button"
      className={`unit-token ${layout === "board" ? "board-token" : ""} ${parkSide === "right" ? "park-right" : parkSide === "left" ? "park-left" : ""} ${selected ? "selected" : ""} ${hostileAim ? "hostile-aim" : ""} owner-${unit.owner} ${recoilClass} ${fadeInfo ? "info-fade" : ""} ${fadeOut ? "fade-out" : ""} ${unit.rested ? "rested" : ""} ${dying ? "dying" : ""}`}
      data-tut={`unit-${unit.defId}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="unit-cluster">
        {layout === "board" && groundPhase && !hideArt ? (
          <div className={`squad-ground ${groundPhase}`}>
            <SquadArt unitId={unit.defId} facingDeg={facing} deployed showSoldiers={false} showProps />
          </div>
        ) : null}
        <div className={hideArt ? "art-hidden" : ""}>
          <UnitPortrait
            name={unit.name}
            unitClass={unit.class}
            unitId={unit.defId}
            facingDeg={facing}
            turretExtraDeg={turretExtraDeg}
            deployed={deployed}
            running={running}
            showProps={layout !== "board"}
            compact={layout === "board"}
            cost={unit.cost}
            hp={Math.max(0, unit.hp)}
            maxHp={unit.maxHp}
            armor={unit.armor + unit.tempArmor}
            atk={atk}
            ap={unit.ap + unit.tempAp}
            atkBoost={unit.combatAtkBonus > 0}
          />
        </div>
        <div className="unit-body">
          <div className="unit-name">
            {unit.name}
            {unit.rested ? (
              <em className="rest-tag" data-tut={`rest-${unit.defId}`}>
                REST
              </em>
            ) : null}
          </div>
          <UnitKeywords
            keywords={keywords}
            unitId={unit.defId}
            size={layout === "board" ? 16 : KEYWORD_ICON_SIZE}
            boosted={missileBoost ? { missile: true } : undefined}
          />
        </div>
      </div>
      {keywordPop && (
        <div className="keyword-pop">
          <KeywordChip keyword={{ name: keywordPop.keyword, value: keywordPop.amount }} size={KEYWORD_ICON_SIZE} />
        </div>
      )}
    </button>
  );
}
