/**
 * Hand-calculated special-skill damage over a 2-turn (attack + defend) window.
 *
 * Rules used when filling this table (0 armor on the target):
 * - Extra attacks count gun ATK only (no Aggressive / Retaliate), plus that shot's follow-up missile.
 * - Direct damage (Kamikaze) counts the listed number.
 * - Ambush: Frontline extra engage at buffed ATK, plus +2 ATK on the regular attack volley. Armor buff ignored vs 0 armor.
 * - Sticky Bomb: this-turn ATK buff × 2 hits (1 extra attack + 1 normal engagement).
 * - Other stat buffs, heals, moves, extra engagements, and armor shred vs 0 armor = 0.
 * - Maneuver cards (Artillery Call, Quick Engagement, Heatseeking) are not specials.
 *
 * The breakdown tool must only read these constants — it does not infer special damage.
 */
export interface SpecialSkillDamage {
  skill: string;
  damage: number;
  note: string;
}

export const SPECIAL_SKILL_DAMAGE: Record<number, SpecialSkillDamage> = {
  1: {
    skill: "Thunder Strike",
    damage: 8,
    note: "Extra attack: gun 3 + follow-up Missile 5. Ignore-armor adds 0 when target armor is already 0.",
  },
  2: {
    skill: "Ambush",
    damage: 11,
    note: "Frontline extra engage: ATK 3 + Aggressive 4 + 2 = 9, plus +2 ATK on the regular attack volley. +2 Armor adds 0 vs 0-armor targets.",
  },
  3: {
    skill: "Trap",
    damage: 0,
    note: "Forces engagement; no extra damage.",
  },
  4: {
    skill: "Intel Acquired",
    damage: 0,
    note: "Move an ally twice (including diagonal) and gain 1 Supply.",
  },
  5: {
    skill: "Repair",
    damage: 0,
    note: "Heal 4.",
  },
  6: {
    skill: "Rally",
    damage: 0,
    note: "+3 ATK to an ally; counted under ally buff, not special.",
  },
  7: {
    skill: "Rally",
    damage: 0,
    note: "+3 ATK to an ally; counted under ally buff, not special.",
  },
  8: {
    skill: "Tactical Strike",
    damage: 0,
    note: "Missile +4 on an ally.",
  },
  9: {
    skill: "Vision Support",
    damage: 0,
    note: "Support Fire also grants +2 AP; no damage instance.",
  },
  10: {
    skill: "Storm Caller",
    damage: 5,
    note: "Extra own Missile 5. Ally missile proc is not this unit's damage.",
  },
  11: {
    skill: "First Strike",
    damage: 6,
    note: "Extra attack: gun ATK 6. No missile.",
  },
  12: {
    skill: "Precision Strike",
    damage: 7,
    note: "Extra attack anywhere: gun ATK 7. No missile.",
  },
  13: {
    skill: "Diversion C",
    damage: 0,
    note: "Move an enemy into Aegis's lane and strip keywords until end of opponent's turn.",
  },
  14: {
    skill: "Coordinate",
    damage: 4,
    note: "Extra attack after +1 ATK: gun 3+1 = 4. Buff lasts the rest of the turn. No return fire.",
  },
  15: {
    skill: "Analyze Weakness",
    damage: 0,
    note: "−2 Armor. No extra damage when the target is already 0 armor.",
  },
  16: {
    skill: "Sticky Bomb",
    damage: 12,
    note: "+6 ATK this turn on 2 hits (extra attack + normal engage) = 12. Self 4 after each shot is not enemy damage.",
  },
  17: {
    skill: "Entrenchment",
    damage: 0,
    note: "+3 Armor / +2 AP.",
  },
  18: {
    skill: "First-aid Kit",
    damage: 0,
    note: "Heal all Armored Infantry 2; all allies Repair 1 for 2 turns. Requires Medic on board.",
  },
  19: {
    skill: "Diversion A",
    damage: 0,
    note: "Move an enemy down; -1 ATK for 2 turns.",
  },
  20: {
    skill: "Deadly Presence",
    damage: 0,
    note: "+2 ATK / +4 AP buff.",
  },
  21: {
    skill: "Diversion B",
    damage: 0,
    note: "Move an enemy up; -1 ARM for 2 turns.",
  },
  22: {
    skill: "Target Acquired",
    damage: 0,
    note: "Marks a missile lane; enemies there take +1 Missile damage.",
  },
  23: {
    skill: "Kamikaze",
    damage: 8,
    note: "8 damage ignore armor; unit dies.",
  },
  24: {
    skill: "HQ Repair",
    damage: 0,
    note: "Repair HQ 7.",
  },
  25: {
    skill: "Death from Above",
    damage: 0,
    note: "Allied Missile +1.",
  },
  26: {
    skill: "The Silent Death",
    damage: 0,
    note: "Untargetable next turn.",
  },
  27: {
    skill: "Hit & Run",
    damage: 8,
    note: "Extra attack: gun ATK 8, then return to reserve. No missile.",
  },
};

export function specialSkillDamageOf(unitId: number): SpecialSkillDamage {
  const row = SPECIAL_SKILL_DAMAGE[unitId];
  if (!row) throw new Error(`Missing special-skill constant for ${unitId}`);
  return row;
}
