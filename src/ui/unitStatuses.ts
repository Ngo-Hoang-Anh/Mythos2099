import { KEYWORD_LABEL } from "../engine/armySummary";
import type {
  KeywordName,
  MatchState,
  PlayerId,
  StatusEffect,
  UnitInstance,
} from "../engine/types";

export type StatusPolarity = "buff" | "debuff";

export interface UnitStatusChip {
  id: string;
  polarity: StatusPolarity;
  /** Keyword icon — same art as skill chips. */
  icon: KeywordName;
  /** Optional raw icon file under /icon when not a keyword glyph. */
  file?: string;
  value?: number;
  title: string;
  body: string;
}

const BUFF = "#3dcf6a";
const DEBUFF = "#e4453a";

export const STATUS_POLARITY_COLOR: Record<StatusPolarity, string> = {
  buff: BUFF,
  debuff: DEBUFF,
};

function chip(
  status: StatusEffect,
  polarity: StatusPolarity,
  icon: KeywordName,
  title: string,
  body: string,
  value?: number,
): UnitStatusChip {
  return {
    id: status.id,
    polarity,
    icon,
    value,
    title,
    body,
  };
}

/** Fire (and future DoTs) on an HQ pillar. */
export function hqStatusChips(match: MatchState, player: PlayerId): UnitStatusChip[] {
  const chips: UnitStatusChip[] = [];
  for (const status of match.statuses) {
    if (status.kind === "fireDot" && status.targetHq === player) {
      chips.push(
        chip(
          status,
          "debuff",
          "fire",
          `Fire ${status.magnitude}`,
          `HQ takes ${status.magnitude} damage at the end of each turn (${status.remainingPasses} left).`,
          status.magnitude,
        ),
      );
    }
  }
  return chips;
}

/** Active buff/debuff chips for board hover — Fire, Suppression, Smoke, Hulldown, temp mods, etc. */
export function unitStatusChips(match: MatchState, unit: UnitInstance): UnitStatusChip[] {
  const chips: UnitStatusChip[] = [];

  for (const status of match.statuses) {
    if (status.kind === "hulldownArmor" && status.targetId === unit.instanceId) {
      chips.push(
        chip(
          status,
          "buff",
          "hulldown",
          "Hulldown",
          "−3 damage from gun attacks until this unit moves. Missiles ignore this.",
          status.magnitude,
        ),
      );
      continue;
    }

    if (status.kind === "fireDot" && status.targetId === unit.instanceId) {
      chips.push(
        chip(
          status,
          "debuff",
          "fire",
          `Fire ${status.magnitude}`,
          `Takes ${status.magnitude} damage at the end of each turn (${status.remainingPasses} left).`,
          status.magnitude,
        ),
      );
      continue;
    }

    if (status.kind === "smokeDodge" && status.targetId === unit.instanceId) {
      chips.push(
        chip(
          status,
          "buff",
          "smokeScreen",
          "Smoke Screen",
          "Cannot be gun-attacked (shots go to HQ). Lasts this turn and the next. Missiles and skills still hit.",
        ),
      );
      continue;
    }

    if (
      status.kind === "suppressionMark" &&
      status.col === unit.col &&
      status.lane === unit.row
    ) {
      chips.push(
        chip(
          status,
          "debuff",
          "suppression",
          "Suppression",
          "−1 ATK and −2 AP while standing on this mark.",
        ),
      );
      continue;
    }

    if (status.targetId !== unit.instanceId) continue;

    if (status.kind === "afterAttackSelfDamage") {
      chips.push(
        chip(
          status,
          "debuff",
          "shock",
          "Sticky Bomb",
          `Takes ${status.magnitude} damage after each gun attack.`,
          status.magnitude,
        ),
      );
      continue;
    }

    if (status.kind === "suppressKeywords") {
      chips.push(
        chip(status, "debuff", "scout", "Keywords suppressed", "Printed keywords are disabled."),
      );
      continue;
    }

    if (status.kind === "regen") {
      chips.push(
        chip(
          status,
          "buff",
          "veteran",
          `Repair ${status.magnitude}`,
          `Heals ${status.magnitude} HP each turn.`,
          status.magnitude,
        ),
      );
      continue;
    }

    if (status.kind === "untargetable") {
      chips.push(
        chip(
          status,
          "buff",
          "camouflage",
          "Untargetable",
          "Cannot be targeted by missiles or effects.",
        ),
      );
      continue;
    }

    if (status.kind === "missileIgnoreArmor") {
      chips.push(
        chip(
          status,
          "buff",
          "missile",
          "Armor-piercing missiles",
          "This unit's missiles ignore armor.",
        ),
      );
      continue;
    }

    if (status.kind === "redirectEmptyLane") {
      chips.push(
        chip(
          status,
          "buff",
          "flank",
          "Redirect",
          "Extra-attacks the nearest occupied lane if this lane is empty.",
        ),
      );
      continue;
    }

    if (status.kind === "modAtk" || status.kind === "modAp" || status.kind === "modArmor") {
      const polarity: StatusPolarity = status.magnitude >= 0 ? "buff" : "debuff";
      const icon: KeywordName =
        status.kind === "modAtk" ? "aggressive" : status.kind === "modAp" ? "corrosion" : "slopedArmor";
      const file =
        status.kind === "modAtk"
          ? "attack.svg"
          : status.kind === "modAp"
            ? "armor-piercing.svg"
            : "armor.svg";
      const stat =
        status.kind === "modAtk" ? "ATK" : status.kind === "modAp" ? "AP" : "Armor";
      const sign = status.magnitude >= 0 ? "+" : "";
      chips.push({
        ...chip(
          status,
          polarity,
          icon,
          `${sign}${status.magnitude} ${stat}`,
          `Temporary ${stat} modifier.`,
          Math.abs(status.magnitude),
        ),
        file,
      });
      continue;
    }

    if (status.kind === "modMissile") {
      const polarity: StatusPolarity = status.magnitude >= 0 ? "buff" : "debuff";
      const sign = status.magnitude >= 0 ? "+" : "";
      chips.push(
        chip(
          status,
          polarity,
          "missile",
          `${sign}${status.magnitude} Missile`,
          "Temporary Missile power modifier.",
          Math.abs(status.magnitude),
        ),
      );
    }
  }

  // Living defense pools read as buffs when charged.
  if (unit.shield > 0 && unit.shieldMax > 0) {
    chips.push({
      id: `shield-${unit.instanceId}`,
      polarity: "buff",
      icon: "shield",
      value: unit.shield,
      title: `Shield ${unit.shield}/${unit.shieldMax}`,
      body: "Absorbs damage before Armor.",
    });
  }
  if (unit.barrier > 0 && unit.barrierMax > 0) {
    chips.push({
      id: `barrier-${unit.instanceId}`,
      polarity: "buff",
      icon: "barrier",
      value: unit.barrier,
      title: `Barrier ${unit.barrier}/${unit.barrierMax}`,
      body: "Reduces the next frontal gun hit.",
    });
  }

  // Buffs left, debuffs right — stable within each group.
  const rank = (c: UnitStatusChip) => (c.polarity === "buff" ? 0 : 1);
  chips.sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
  return chips;
}

/** Tip title for a chip that mirrors keyword naming. */
export function statusChipLabel(chip: UnitStatusChip): string {
  if (chip.value != null && KEYWORD_LABEL[chip.icon]) {
    // Keep custom titles like "Fire 2" / "+3 ATK" when already set.
    return chip.title;
  }
  return chip.title;
}
