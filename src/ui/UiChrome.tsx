/** SunGraphica FREE chrome helpers — assets in /ui/sungraphica/ */

export type SgTone = "cyan" | "gold";

export type SgIconName =
  | "check"
  | "close"
  | "home"
  | "plus"
  | "minus"
  | "help"
  | "back"
  | "skip"
  | "rewind"
  | "lock";

const BASE = "/ui/sungraphica";
const KIT = "/ui/kit";

export type KitButton = "close" | "ok";

/** Navy/cyan kit copied from resource/usable/UI into /ui/kit. */
export function kitAsset(file: string): string {
  return `${KIT}/${file}`;
}

export function kitButton(name: KitButton): string {
  return kitAsset(name === "close" ? "close.png" : "ok.png");
}

export function sgIcon(name: SgIconName, tone: SgTone = "gold"): string {
  return `${BASE}/icons/${name}-${tone}.svg`;
}

export function sgButton(name: SgIconName, tone: SgTone = "gold"): string {
  return `${BASE}/buttons/${name}-${tone}.svg`;
}

export function sgElement(file: string): string {
  return `${BASE}/elements/${file}`;
}

export function SgIconBtn({
  name,
  tone = "gold",
  title,
  onClick,
  className = "",
  disabled,
  framed = true,
  size = 36,
}: {
  name: SgIconName;
  tone?: SgTone;
  title: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  /** Framed square button vs bare glyph */
  framed?: boolean;
  size?: number;
}) {
  const src = framed ? sgButton(name, tone) : sgIcon(name, tone);
  return (
    <button
      type="button"
      className={`sg-icon-btn ${className}`}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <img src={src} alt="" width={size} height={size} draggable={false} style={{ width: size, height: size }} />
    </button>
  );
}

export function SgIconImg({
  name,
  tone = "gold",
  size = 22,
  title,
  framed = false,
}: {
  name: SgIconName;
  tone?: SgTone;
  size?: number;
  title?: string;
  framed?: boolean;
}) {
  const src = framed ? sgButton(name, tone) : sgIcon(name, tone);
  return (
    <img
      className="sg-icon-img"
      src={src}
      alt={title ?? ""}
      title={title}
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}

/** Unstretched kit glyph sitting beside a text label. */
export function KitMark({ file, size = 32 }: { file: string; size?: number }) {
  return (
    <img
      className="kit-mark"
      src={kitAsset(file)}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}

/** Square bevel button from the usable UI kit. Do not stretch into a wide label. */
export function KitIconBtn({
  name,
  title,
  onClick,
  className = "",
  disabled,
  size = 40,
}: {
  name: KitButton;
  title: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <button
      type="button"
      className={`kit-icon-btn ${className}`}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <img
        src={kitButton(name)}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{ width: size, height: size }}
      />
    </button>
  );
}

/** Corner brackets overlay for a framed region */
export function SgBrackets({ className = "" }: { className?: string }) {
  return (
    <div className={`sg-brackets ${className}`} aria-hidden>
      <img className="sg-br tl" src={sgElement("bracket-tl.svg")} alt="" />
      <img className="sg-br tr" src={sgElement("bracket-tr.svg")} alt="" />
      <img className="sg-br bl" src={sgElement("bracket-bl.svg")} alt="" />
      <img className="sg-br br" src={sgElement("bracket-br.svg")} alt="" />
    </div>
  );
}
