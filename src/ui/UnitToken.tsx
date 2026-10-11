import { getUnitArt } from "../data/unitArt";
import { getSquadArt } from "../data/squadArt";
import { getSpriteArt } from "../data/spriteArt";
import { keywordsWithMods, missileMod } from "../engine/status";
import type { Keyword, MatchState, UnitClass, UnitInstance } from "../engine/types";
import { TankArt } from "./TankArt";
import { SquadArt } from "./SquadArt";
import { SpriteArt } from "./SpriteArt";
import { parkedHullDeg, usesDriveRig } from "./movePath";
import { isMobileShellUi } from "./tipExclusive";
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

function BoardHpMeter({
  hp,
  maxHp,
  forecastHp,
  tut,
}: {
  hp: number;
  maxHp?: number;
  /** HP after the previewed shot. The lost slice and the number blink against the current value. */
  forecastHp?: number;
  tut?: string;
}) {
  const cap = maxHp && maxHp > 0 ? maxHp : Math.max(hp, 1);
  const pct = Math.max(0, Math.min(100, (hp / cap) * 100));
  const showForecast = forecastHp != null && forecastHp < hp;
  const after = showForecast ? forecastHp : hp;
  const afterPct = Math.max(0, Math.min(100, (after / cap) * 100));
  const label = showForecast
    ? `HP ${hp} → ${after}`
    : maxHp != null
      ? `HP ${hp}/${maxHp}`
      : `HP ${hp}`;
  return (
    <div className="unit-hp-meter" data-tut={tut} title={label} aria-label={label}>
      <div className="unit-hp-frame" />
      <div className="unit-hp-track">
        <div
          className={`unit-hp-fill ${showForecast ? "forecast-base" : ""}`}
          style={{ ["--hp-cut" as string]: `${100 - (showForecast ? afterPct : pct)}%` }}
        />
        {showForecast ? (
          <div
            className="unit-hp-loss"
            style={{
              ["--loss-top" as string]: `${100 - pct}%`,
              ["--loss-bottom" as string]: `${afterPct}%`,
            }}
          />
        ) : null}
      </div>
      {showForecast ? (
        <span className="unit-hp-num forecast">
          <span className="hp-now">{hp}</span>
          <span className="hp-after">{after}</span>
        </span>
      ) : (
        <span className="unit-hp-num">{hp}</span>
      )}
    </div>
  );
}

export function UnitPortrait({
  name,
  unitClass,
  compact,
  boardMeter = false,
  cost,
  hp,
  maxHp,
  armor,
  atk,
  ap,
  atkBoost,
  forecastHp,
  atkAiming,
  atkAimId,
  onAtkAim,
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
  boardMeter?: boolean;
  cost: number;
  hp: number;
  maxHp?: number;
  armor: number;
  atk: number;
  ap: number;
  atkBoost?: boolean;
  forecastHp?: number;
  atkAiming?: boolean;
  atkAimId?: string;
  onAtkAim?: () => void;
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
      {boardMeter ? (
        <BoardHpMeter hp={hp} maxHp={maxHp} forecastHp={forecastHp} tut={unitId ? `hp-${unitId}` : undefined} />
      ) : (
        <>
          <div className="port-tl">
            {cost > 0 ? <SupplyChip value={cost} /> : null}
          </div>
          <div className="port-bl" data-tut={unitId ? `hp-${unitId}` : undefined}>
            <HpChip value={hp} max={maxHp} />
          </div>
        </>
      )}
      <div className="port-tr">
        {armor > 0 ? <ArmorChip value={armor} tut={unitId ? `armor-${unitId}` : undefined} /> : null}
      </div>
      <div className="port-br" data-tut={unitId ? `atk-${unitId}` : undefined}>
        {ap > 0 ? <ApChip value={ap} tut={unitId ? `ap-${unitId}` : undefined} /> : null}
        {atk > 0 ? (
          <AtkChip
            value={atk}
            boost={atkBoost}
            aiming={atkAiming}
            aimId={atkAimId}
            onAim={onAtkAim}
          />
        ) : null}
      </div>
    </div>
  );
}

export function UnitKeywords({
  keywords,
  size = KEYWORD_ICON_SIZE,
  unitId,
  boosted,
  missileAimId,
  onMissileAim,
}: {
  keywords: Keyword[];
  size?: number;
  unitId?: number;
  /** Keyword names currently raised by a temporary mod (e.g. Missile +4). */
  boosted?: Partial<Record<Keyword["name"], boolean>>;
  /** Board unit whose Missile icon draws the aim arc. */
  missileAimId?: string;
  onMissileAim?: (mode: "on" | "off" | "toggle") => void;
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
          data-missile-aim={k.name === "missile" && missileAimId ? missileAimId : undefined}
          onMouseEnter={k.name === "missile" && onMissileAim ? () => onMissileAim("on") : undefined}
          onMouseLeave={k.name === "missile" && onMissileAim ? () => onMissileAim("off") : undefined}
          onClick={
            k.name === "missile" && onMissileAim
              ? (event) => {
                  event.stopPropagation();
                  if (isMobileShellUi()) onMissileAim("toggle");
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function UnitToken({
  unit,
  match,
  selected,
  kwFocus,
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
  onMissileAim,
  onAtkAim,
  forecastHp,
  atkAiming,
}: {
  unit: UnitInstance;
  match?: MatchState;
  selected?: boolean;
  /** Mobile: first tap reveals keywords; a second tap opens the detail. */
  kwFocus?: boolean;
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
  onMissileAim?: (mode: "on" | "off" | "toggle") => void;
  onAtkAim?: () => void;
  forecastHp?: number;
  atkAiming?: boolean;
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
      data-unit-id={unit.instanceId}
      className={`unit-token ${layout === "board" ? "board-token" : ""} ${parkSide === "right" ? "park-right" : parkSide === "left" ? "park-left" : ""} ${selected ? "selected" : ""} ${kwFocus ? "kw-focus" : ""} ${hostileAim ? "hostile-aim" : ""} owner-${unit.owner} ${recoilClass} ${fadeInfo ? "info-fade" : ""} ${fadeOut ? "fade-out" : ""} ${unit.rested ? "rested" : ""} ${dying ? "dying" : ""}`}
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
            boardMeter={layout === "board"}
            cost={unit.cost}
            hp={Math.max(0, unit.hp)}
            maxHp={unit.maxHp}
            armor={unit.armor + unit.tempArmor}
            atk={atk}
            ap={unit.ap + unit.tempAp}
            atkBoost={unit.combatAtkBonus > 0}
            forecastHp={layout === "board" ? forecastHp : undefined}
            atkAiming={layout === "board" && atkAiming}
            atkAimId={layout === "board" && onAtkAim ? unit.instanceId : undefined}
            onAtkAim={layout === "board" ? onAtkAim : undefined}
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
            missileAimId={layout === "board" && unit.missileTarget ? unit.instanceId : undefined}
            onMissileAim={layout === "board" && unit.missileTarget ? onMissileAim : undefined}
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
