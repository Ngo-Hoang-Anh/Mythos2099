import { useEffect, useMemo, useState } from "react";
import { getUnitDef } from "../data/units";
import { keywordHelp, keywordFullLabel } from "../engine/armySummary";
import { keywordsWithMods, missileMod } from "../engine/status";
import type { MatchState, PlayerId, StatusEffect, UnitDef, UnitInstance } from "../engine/types";
import { ArmorChip, ApChip, AtkChip, HpChip, SupplyChip } from "./icons";
import { KitIconBtn, kitAsset } from "./UiChrome";
import { UnitArt, UnitKeywords } from "./UnitToken";
import { UnitCardPills } from "./CardTip";

const SIDE_WIDE = new Set([
  "modMissile",
  "missileSplash",
  "artilleryRepeat",
  "supportFireGrantsAp",
  "missileLaneMark",
]);

const STATUS_LABEL: Record<string, (s: StatusEffect) => string> = {
  modAtk: (s) => `${s.magnitude >= 0 ? "+" : ""}${s.magnitude} ATK`,
  modAp: (s) => `${s.magnitude >= 0 ? "+" : ""}${s.magnitude} AP`,
  modArmor: (s) => `${s.magnitude >= 0 ? "+" : ""}${s.magnitude} Armor`,
  modMissile: (s) => `${s.magnitude >= 0 ? "+" : ""}${s.magnitude} Missile`,
  missileIgnoreArmor: () => "Missile ignores armor",
  missileSplash: (s) => `Next missile splash ${s.magnitude}`,
  artilleryRepeat: (s) => `Artillery repeat +${s.magnitude}`,
  atkUnmodifiable: () => "ATK locked this combat",
  supportFireGrantsAp: (s) => `Support Fire also +${s.magnitude} AP`,
  redirectEmptyLane: () => "Extra-attacks nearest lane if empty",
  missileLaneMark: (s) => `Missiles prioritize lane ${(s.lane ?? 0) + 1}`,
  afterAttackSelfDamage: (s) => `Self-damage ${s.magnitude} after attack`,
  regen: (s) => `Repair ${s.magnitude} HP / turn (${s.remainingPasses} left)`,
  untargetable: () => "Cannot be targeted",
  suppressKeywords: () => "Keywords suppressed",
};

function durationHint(status: StatusEffect): string {
  if (status.kind === "regen") return "";
  if (status.duration === "thisCombat") return "this combat";
  if (status.duration === "untilConsumed") return "until used";
  if (status.remainingPasses <= 1) return "until end of turn";
  return `${status.remainingPasses} turns`;
}

export type UnitDetailTarget =
  | { mode: "catalog"; def: UnitDef }
  | { mode: "board"; unit: UnitInstance; match: MatchState };

export function UnitDetailDialog({
  target,
  onClose,
  facing = 0,
}: {
  target: UnitDetailTarget;
  onClose: () => void;
  /** Viewer seat — flip move/maneuver forward/retreat icons for P2. */
  facing?: PlayerId;
}) {
  const def = target.mode === "catalog" ? target.def : getUnitDef(target.unit.defId);
  const unit = target.mode === "board" ? target.unit : null;
  const [flipped, setFlipped] = useState(false);
  const gameplay = target.mode === "board";

  useEffect(() => {
    setFlipped(false);
  }, [def.id, unit?.instanceId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const modifiers = useMemo(() => {
    if (!unit || target.mode !== "board") return [];
    const rows: string[] = [];
    if (unit.rested) rows.push("RESTed — does not initiate guns or missiles; still deals return-fire damage when attacked");
    if (unit.tempAtk) rows.push(`${unit.tempAtk >= 0 ? "+" : ""}${unit.tempAtk} ATK`);
    if (unit.tempAp) rows.push(`${unit.tempAp >= 0 ? "+" : ""}${unit.tempAp} AP`);
    if (unit.tempArmor) rows.push(`${unit.tempArmor >= 0 ? "+" : ""}${unit.tempArmor} Armor`);
    if (unit.tempRetaliate) rows.push(`${unit.tempRetaliate >= 0 ? "+" : ""}${unit.tempRetaliate} Retaliate`);

    for (const status of target.match.statuses) {
      const onUnit = status.targetId === unit.instanceId;
      const sideWide = !status.targetId && status.owner === unit.owner && SIDE_WIDE.has(status.kind);
      if (!onUnit && !sideWide) continue;
      if (onUnit && (status.kind === "modAtk" || status.kind === "modAp" || status.kind === "modArmor")) continue;
      const label = STATUS_LABEL[status.kind]?.(status) ?? status.kind;
      const when = durationHint(status);
      rows.push(when ? `${label} · ${when}` : label);
    }
    return rows;
  }, [target, unit]);

  const hp = unit?.hp ?? def.hp;
  const maxHp = unit?.maxHp ?? def.hp;
  const armor = (unit?.armor ?? def.armor) + (unit?.tempArmor ?? 0);
  const atk = (unit?.atk ?? def.atk) + (unit?.tempAtk ?? 0);
  const ap = (unit?.ap ?? def.ap) + (unit?.tempAp ?? 0);
  const keywords =
    unit && target.mode === "board" ? keywordsWithMods(target.match, unit) : (unit?.keywords ?? def.keywords);
  const missileBoost = unit && target.mode === "board" ? missileMod(target.match, unit) !== 0 : false;

  return (
    <div className="unit-detail-modal" onClick={onClose} role="presentation">
      <div
        className="unit-detail-dialog kit-window"
        role="dialog"
        aria-label={`${def.name} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="unit-detail-head">
          <div>
            <h2>{def.name}</h2>
            <p>
              {def.class} · <SupplyChip value={def.cost} />
            </p>
          </div>
          <KitIconBtn name="close" title="Close" onClick={onClose} size={44} />
        </header>

        <div className="unit-detail-main">
          <div className="unit-detail-stage">
            <div className={`unit-detail-flip${flipped ? " flipped" : ""}`}>
              <div className="unit-detail-face front">
                <UnitArt name={def.name} unitClass={def.class} unitId={def.id} facingDeg={0} />
                <div className="unit-detail-stats">
                  <div className="kit-hp-row">
                    <img src={kitAsset("hp.png")} alt="" />
                    <HpChip value={hp} />
                    {maxHp !== hp ? <span className="unit-detail-maxhp">/{maxHp}</span> : null}
                    <div className="kit-hp-bar" aria-hidden>
                      <span style={{ width: `${maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0}%` }} />
                    </div>
                  </div>
                  <div className="kit-hp-row">
                    <img src={kitAsset("armor.png")} alt="" />
                    <ArmorChip value={armor} />
                  </div>
                  <AtkChip value={atk} />
                  <ApChip value={ap} />
                </div>
              </div>
              <div className="unit-detail-face back">
                <p className="unit-detail-lore-back">{def.lore || "No lore recorded for this unit."}</p>
              </div>
            </div>

            {gameplay && (
              <button
                type="button"
                className={`unit-detail-scroll${flipped ? " active" : ""}`}
                title={flipped ? "Show unit" : "Read lore"}
                onClick={() => setFlipped((v) => !v)}
              >
                <img src="/icon/scroll-lore.svg" alt="" width={40} height={40} />
                <span>{flipped ? "Unit" : "Lore"}</span>
              </button>
            )}
          </div>

          <aside className="unit-detail-side kit-table">
            <h3>Keywords</h3>
            {keywords.length === 0 ? (
              <p className="muted">None</p>
            ) : (
              <ul className="unit-detail-kw-list">
                {keywords.map((keyword) => {
                  const help = keywordHelp(keyword);
                  return (
                    <li key={`${keyword.name}-${keyword.value}`}>
                      <strong>{keywordFullLabel(keyword)}</strong>
                      <span>{help.body}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <h3>Cards</h3>
            <UnitCardPills cards={def.cards} facing={facing} sourceName={def.name} />
            <div className="unit-detail-kw-chips">
              <UnitKeywords keywords={keywords} boosted={missileBoost ? { missile: true } : undefined} />
            </div>
          </aside>
        </div>

        <footer className="unit-detail-foot">
          {gameplay ? (
            <>
              <h3>Active effects</h3>
              {modifiers.length === 0 ? (
                <p className="muted">No buffs, debuffs, or statuses on this unit.</p>
              ) : (
                <ul className="unit-detail-mods">
                  {modifiers.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <h3>Lore</h3>
              <p className="unit-detail-lore">{def.lore || "No lore recorded for this unit."}</p>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
