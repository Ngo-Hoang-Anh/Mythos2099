import type { HTMLAttributes } from "react";
import type { CardType, EffectId, Keyword, KeywordName } from "../engine/types";
import { FLAG_KEYWORDS } from "../engine/keywords";
import { keywordHelp, STAT_HELP } from "../engine/armySummary";
import { TipHost } from "./AnchoredTip";

export const KEYWORD_YELLOW = "#e6c84a";

export const STAT_COLOR = {
  hp: "#f4f4f4",
  atk: "#e4453a",
  armor: "#3a9ad9",
  ap: "#b45ce0",
  supply: "#4caf5a",
} as const;

const KEYWORD_FILE: Record<KeywordName, string> = {
  cover: "cover.svg",
  flank: "flank.svg",
  retaliate: "retalitate.svg",
  aggressive: "aggresive.svg",
  blitz: "blitz.svg",
  supportFire: "support fire.svg",
  artillery: "artilery.svg",
  airStrike: "heavy-bullets.svg",
  missile: "missle.svg",
  jetPlane: "jet-fighter.svg",
};

export const STAT_ICON_SIZE = 24;
export const KEYWORD_ICON_SIZE = 36;

export const STAT_FILE = {
  hp: { file: "HP.svg", color: STAT_COLOR.hp, title: "HP" },
  atk: { file: "attack.svg", color: STAT_COLOR.atk, title: "ATK" },
  armor: { file: "armor.svg", color: STAT_COLOR.armor, title: "Armor" },
  ap: { file: "armor-piercing.svg", color: STAT_COLOR.ap, title: "AP" },
  supply: { file: "supply.svg", color: STAT_COLOR.supply, title: "Supply" },
} as const;

export type StatName = keyof typeof STAT_FILE;

export function StatIcon({ name, size = STAT_ICON_SIZE }: { name: StatName; size?: number }) {
  const spec = STAT_FILE[name];
  return <FileIcon file={spec.file} color={spec.color} size={size} title={spec.title} />;
}

function FileIcon({
  file,
  color,
  size = STAT_ICON_SIZE,
  title,
  flipX,
}: {
  file: string;
  color: string;
  size?: number;
  title?: string;
  /** Mirror art when P2 sits opposite (forward = left on screen). */
  flipX?: boolean;
}) {
  const src = `/icon/${file.split("/").map(encodeURIComponent).join("/")}`;
  return (
    <span
      className="file-icon"
      role="img"
      aria-label={title}
      title={title}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

/** Effects whose SVG encodes left/right relative to enemy (P1: forward = right). */
export function cardArtFlipsForFacing(effectId: EffectId): boolean {
  switch (effectId) {
    case "forward":
    case "retreat":
    case "maintenance":
    case "swiftManeuver":
    case "moveUnitTwice":
    case "moveTwoUnits":
    case "moveAnyDirection":
      return true;
    default:
      return false;
  }
}

export function KeywordIcon({ name, size = KEYWORD_ICON_SIZE }: { name: KeywordName; size?: number }) {
  return <FileIcon file={KEYWORD_FILE[name]} color={KEYWORD_YELLOW} size={size} />;
}

export function LogGlyph({ icon, size = 14 }: { icon?: import("../engine/types").LogIcon; size?: number }) {
  if (!icon) return null;
  if (icon === "atk") return <FileIcon file="attack.svg" color={STAT_COLOR.atk} size={size} title="ATK" />;
  if (icon === "hp") return <FileIcon file="HP.svg" color={STAT_COLOR.hp} size={size} title="HP" />;
  if (icon === "supply") return <SupplyIcon size={size} />;
  if (icon === "card") return <FileIcon file="log.svg" color="#c4c0b4" size={size} title="Card" />;
  return <KeywordIcon name={icon} size={size} />;
}

export function SupplyIcon({ size = STAT_ICON_SIZE, title = "Supply" }: { size?: number; title?: string }) {
  return <FileIcon file="supply.svg" color={STAT_COLOR.supply} size={size} title={title} />;
}

export function RecycleIcon({ size = 28 }: { size?: number }) {
  return <FileIcon file="recycle.svg" color={KEYWORD_YELLOW} size={size} title="Discard to draw" />;
}

const CARD_TYPE_FILE: Record<CardType, string> = {
  special: "cards/special.svg",
  maneuver: "cards/maneuver.svg",
  move: "cards/move.svg",
};

/** White silhouette for a card — prefers effect art, falls back to type. */
export function CardArtIcon({
  effectId,
  type: _type,
  size = KEYWORD_ICON_SIZE,
  title,
  facing = 0,
}: {
  effectId: EffectId;
  type: CardType;
  size?: number;
  title?: string;
  /** Seat of the viewer (0 = P1 faces right, 1 = P2 faces left). */
  facing?: 0 | 1;
}) {
  const effectFile = `cards/${effectId}.svg`;
  const flipX = facing === 1 && cardArtFlipsForFacing(effectId);
  return <FileIcon file={effectFile} color="#f4f4f4" size={size} title={title} flipX={flipX} />;
}

export function CardTypeIcon({
  type,
  size = KEYWORD_ICON_SIZE,
}: {
  type: CardType;
  size?: number;
}) {
  return <FileIcon file={CARD_TYPE_FILE[type]} color="#f4f4f4" size={size} title={type} />;
}

export function KeywordChip({
  keyword,
  size = KEYWORD_ICON_SIZE,
  tut,
  boost,
  ...rest
}: {
  keyword: Keyword;
  size?: number;
  tut?: string;
  boost?: boolean;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">) {
  const flag = FLAG_KEYWORDS.has(keyword.name);
  const { title, body } = keywordHelp(keyword);
  return (
    <TipHost
      className={`kw-chip ${flag ? "flag" : ""} ${boost ? "boost" : ""}`}
      tipClassName="chip-tip kw-tip"
      aria-label={`${title}. ${body}`}
      data-tut={tut}
      {...rest}
      tip={
        <>
          <b>{title}</b>
          <p>{body}</p>
        </>
      }
    >
      <KeywordIcon name={keyword.name} size={size} />
      {flag ? null : <span className="chip-val">{keyword.value}</span>}
    </TipHost>
  );
}

export function HpChip({ value, max }: { value: number; max?: number }) {
  const label = max != null ? `HP ${value}/${max}` : `HP ${value}`;
  const help = STAT_HELP.hp;
  return (
    <TipHost
      className="stat-chip hp"
      tipClassName="chip-tip stat-tip"
      aria-label={label}
      tip={
        <>
          <b>{label}</b>
          <p>{help.body}</p>
        </>
      }
    >
      <FileIcon file="HP.svg" color={STAT_COLOR.hp} />
      <span className="chip-val">{value}</span>
    </TipHost>
  );
}

export function AtkChip({ value, boost }: { value: number; boost?: boolean }) {
  const help = STAT_HELP.atk;
  return (
    <TipHost
      className={`stat-chip atk ${boost ? "boost" : ""}`}
      tipClassName="chip-tip stat-tip"
      aria-label={`ATK ${value}`}
      tip={
        <>
          <b>
            {help.title} {value}
          </b>
          <p>{help.body}</p>
        </>
      }
    >
      <FileIcon file="attack.svg" color={STAT_COLOR.atk} />
      <span className="chip-val">{value}</span>
    </TipHost>
  );
}

export function ArmorChip({ value, tut }: { value: number; tut?: string }) {
  const help = STAT_HELP.armor;
  return (
    <TipHost
      className="stat-chip armor"
      tipClassName="chip-tip stat-tip"
      aria-label={`Armor ${value}`}
      data-tut={tut}
      tip={
        <>
          <b>
            {help.title} {value}
          </b>
          <p>{help.body}</p>
        </>
      }
    >
      <FileIcon file="armor.svg" color={STAT_COLOR.armor} />
      <span className="chip-val">{value}</span>
    </TipHost>
  );
}

export function ApChip({ value, tut }: { value: number; tut?: string }) {
  const help = STAT_HELP.ap;
  return (
    <TipHost
      className="stat-chip ap"
      tipClassName="chip-tip stat-tip"
      aria-label={`AP ${value}`}
      data-tut={tut}
      tip={
        <>
          <b>
            {help.title} {value}
          </b>
          <p>{help.body}</p>
        </>
      }
    >
      <FileIcon file="armor-piercing.svg" color={STAT_COLOR.ap} />
      <span className="chip-val">{value}</span>
    </TipHost>
  );
}

export function WhiteFlagIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M5 21V3" fill="none" stroke="#f4f1ea" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6.2 4.2h11.2l-2.6 3.6 2.6 3.6H6.2V4.2Z" fill="#f7f4ee" stroke="#d8d2c6" strokeWidth="0.8" />
    </svg>
  );
}

export function SupplyChip({ value }: { value: number }) {
  const help = STAT_HELP.supply;
  return (
    <TipHost
      className="stat-chip supply"
      tipClassName="chip-tip stat-tip"
      aria-label={`Supply ${value}`}
      tip={
        <>
          <b>
            {help.title} {value}
          </b>
          <p>{help.body}</p>
        </>
      }
    >
      <SupplyIcon title={undefined} />
      <span className="chip-val">{value}</span>
    </TipHost>
  );
}

export function StatRow({
  hp,
  maxHp,
  atk,
  armor,
  ap,
  supply,
  atkBoost,
}: {
  hp: number;
  maxHp?: number;
  atk: number;
  armor: number;
  ap: number;
  supply?: number;
  atkBoost?: boolean;
}) {
  return (
    <div className="stat-row">
      {supply != null && supply > 0 ? <SupplyChip value={supply} /> : null}
      {hp > 0 ? <HpChip value={hp} max={maxHp} /> : null}
      {atk > 0 ? <AtkChip value={atk} boost={atkBoost} /> : null}
      {armor > 0 ? <ArmorChip value={armor} /> : null}
      {ap > 0 ? <ApChip value={ap} /> : null}
    </div>
  );
}
