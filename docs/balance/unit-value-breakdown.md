# Unit value breakdown — 2-turn damage & defense

Generated: 2026-09-16T19:58:32.216Z

## Offense assumptions (2 turns: you attack, then you defend)

- Target armor is **0**. Missile and gun both deal their full ATK/Missile value.
- Self ATK = (ATK + Aggressive) on your attack + (ATK + Retaliate) on your defend = `2×ATK + Aggressive + Retaliate`.
- Ally buff: 2 adjacent allies with Support Fire 2 each → +4 ATK on **both** volleys = +8. Units with Rally add +3 (played on your attack turn).
- Indirect = Missile once (only the attacker fires missiles).
- Special = hand-calculated constants in `src/tools/specialSkillDamage.ts`. Utility / buff specials are 0.

## Defense assumptions

- Score 1: `HP + Armor × 2`
- Score 2: `HP + Armor × 3`
- Total ATK = ATK + Aggressive + Retaliate. Catalog average: total ATK **5.33**, AP **3.11**, Missile **0.78**.
- Extreme attackers: max total ATK = **Trench Guard** (9 ATK, 0 AP, Missile 0); max AP = **Exosuit Breacher** (8 AP, 4 ATK, Missile 0); max ATK+AP = **Komet Fighter** (16).
- Incoming **attack** hit = gun (`total ATK` vs armor after AP) + missile (50% armor rounded down, no AP).
- Incoming **retaliate** hit = gun only (opponent is immortal; your damage is ignored).
- Survival cells: `atkDmg / atkHits · retalDmg / retalHits · 2-turn cycles` until HP reaches 0. ∞ = that hit deals 0.

## Offense over 2 turns

| Unit | Cost | ATK | Agg | Ret | Total ATK | AP | Missile | Self ATK | Ally buff (SF / Rally) | Indirect | Special | Special name | **Total** |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Komet Fighter | 6 | 8 | 0 | 0 | 8 | 8 | 0 | 16 | 8 (8 / 0) | 0 | 8 | Hit & Run | **32** |
| Kamikaze Hunter | 3 | 7 | 0 | 0 | 7 | 6 | 0 | 14 | 8 (8 / 0) | 0 | 8 | Kamikaze | **30** |
| Siege Howitzer | 5 | 7 | 0 | 0 | 7 | 7 | 0 | 14 | 8 (8 / 0) | 0 | 7 | Precision Strike | **29** |
| Apex Destroyer | 6 | 3 | 4 | 0 | 7 | 6 | 0 | 10 | 8 (8 / 0) | 0 | 11 | Ambush | **29** |
| Manticore MLRS | 5 | 5 | 0 | 0 | 5 | 5 | 5 | 10 | 8 (8 / 0) | 5 | 5 | Storm Caller | **28** |
| Zeus | 6 | 3 | 0 | 0 | 3 | 2 | 5 | 6 | 8 (8 / 0) | 5 | 8 | Thunder Strike | **27** |
| Sentinel Battery | 4 | 6 | 0 | 0 | 6 | 5 | 0 | 12 | 8 (8 / 0) | 0 | 6 | Quick Mobilization | **26** |
| Exosuit Breacher | 4 | 2 | 0 | 2 | 4 | 8 | 0 | 6 | 8 (8 / 0) | 0 | 12 | Sticky Bomb | **26** |
| Hornet Interceptor | 4 | 6 | 0 | 0 | 6 | 1 | 4 | 12 | 8 (8 / 0) | 4 | 0 | Tactical Strike | **24** |
| Viper Gunship | 5 | 5 | 0 | 3 | 8 | 3 | 0 | 13 | 11 (8 / 3) | 0 | 0 | Rally | **24** |
| Death Rider | 5 | 5 | 3 | 0 | 8 | 4 | 0 | 13 | 8 (8 / 0) | 0 | 0 | Deadly Presence | **21** |
| Stealthray Bomber | 6 | 6 | 0 | 0 | 6 | 3 | 0 | 12 | 8 (8 / 0) | 0 | 0 | The Silent Death | **20** |
| Mirage Humvee | 3 | 4 | 0 | 0 | 4 | 2 | 0 | 8 | 11 (8 / 3) | 0 | 0 | Rally | **19** |
| Line Combat Medic | 4 | 4 | 0 | 3 | 7 | 0 | 0 | 11 | 8 (8 / 0) | 0 | 0 | First-aid Kit | **19** |
| Falcon Dropship | 4 | 5 | 0 | 0 | 5 | 1 | 0 | 10 | 8 (8 / 0) | 0 | 0 | Vision Support | **18** |
| Tempest Strike Bomber | 4 | 3 | 0 | 0 | 3 | 2 | 4 | 6 | 8 (8 / 0) | 4 | 0 | Death from Above | **18** |
| Stalker Biped | 5 | 3 | 4 | 0 | 7 | 3 | 0 | 10 | 8 (8 / 0) | 0 | 0 | Coordinate | **18** |
| Trench Guard | 5 | 1 | 0 | 8 | 9 | 0 | 0 | 10 | 8 (8 / 0) | 0 | 0 | Entrenchment | **18** |
| Aegis | 6 | 4 | 0 | 2 | 6 | 3 | 0 | 10 | 8 (8 / 0) | 0 | 0 | Diversion | **18** |
| Iron Bastion | 6 | 2 | 0 | 5 | 7 | 0 | 0 | 9 | 8 (8 / 0) | 0 | 0 | Trap | **17** |
| Phantom Speeder | 3 | 4 | 0 | 0 | 4 | 4 | 0 | 8 | 8 (8 / 0) | 0 | 0 | Diversion | **16** |
| Scout Biker | 4 | 4 | 0 | 0 | 4 | 2 | 0 | 8 | 8 (8 / 0) | 0 | 0 | Diversion | **16** |
| Nomad Supply Buggy | 5 | 4 | 0 | 0 | 4 | 2 | 0 | 8 | 8 (8 / 0) | 0 | 0 | Repair | **16** |
| Ironclad Goliath | 6 | 4 | 0 | 0 | 4 | 4 | 0 | 8 | 8 (8 / 0) | 0 | 0 | Analyze Weakness | **16** |
| Recon Eye | 2 | 2 | 0 | 0 | 2 | 0 | 3 | 4 | 8 (8 / 0) | 3 | 0 | Target Acquired | **15** |
| Jackal Scout | 4 | 3 | 0 | 0 | 3 | 3 | 0 | 6 | 8 (8 / 0) | 0 | 0 | Intel Acquired | **14** |
| Aegis Support Drone | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 (8 / 0) | 0 | 0 | HQ Repair | **8** |

## Special skill constants

| Unit | Skill | Damage | Note |
| --- | --- | ---: | --- |
| Zeus | Thunder Strike | 8 | Extra attack: gun 3 + follow-up Missile 5. Ignore-armor adds 0 when target armor is already 0. |
| Apex Destroyer | Ambush | 11 | Frontline extra engage: ATK 3 + Aggressive 4 + 2 = 9, plus +2 ATK on the regular attack volley. +2 Armor adds 0 vs 0-armor targets. |
| Iron Bastion | Trap | 0 | Forces engagement; no extra damage. |
| Jackal Scout | Intel Acquired | 0 | Move an ally twice (including diagonal) and gain 2 Supply. |
| Nomad Supply Buggy | Repair | 0 | Heal 4. |
| Mirage Humvee | Rally | 0 | +3 ATK to an ally; counted under ally buff, not special. |
| Viper Gunship | Rally | 0 | +3 ATK to an ally; counted under ally buff, not special. |
| Hornet Interceptor | Tactical Strike | 0 | Missile +3 on an ally. |
| Falcon Dropship | Vision Support | 0 | Support Fire also grants +2 AP; no damage instance. |
| Manticore MLRS | Storm Caller | 5 | Extra own Missile 5. Ally missile proc is not this unit's damage. |
| Sentinel Battery | Quick Mobilization | 6 | Extra attack: gun ATK 6. No missile. |
| Siege Howitzer | Precision Strike | 7 | Extra attack anywhere: gun ATK 7. No missile. |
| Aegis | Diversion | 0 | Move an enemy into Aegis's lane. |
| Stalker Biped | Coordinate | 0 | Redirects empty-lane targeting. |
| Ironclad Goliath | Analyze Weakness | 0 | −2 Armor. No extra damage when the target is already 0 armor. |
| Exosuit Breacher | Sticky Bomb | 12 | +6 ATK this turn on 2 hits (extra attack + normal engage) = 12. Self 4 after each shot is not enemy damage. |
| Trench Guard | Entrenchment | 0 | +3 Armor / +2 AP. |
| Line Combat Medic | First-aid Kit | 0 | Heal infantry/motorcycles. |
| Phantom Speeder | Diversion | 0 | Move an enemy down. |
| Death Rider | Deadly Presence | 0 | +2 ATK / +4 AP buff. |
| Scout Biker | Diversion | 0 | Move an enemy up. |
| Recon Eye | Target Acquired | 0 | Marks a missile lane; enemies there take +1 Missile damage. |
| Kamikaze Hunter | Kamikaze | 8 | 8 damage ignore armor; unit dies. |
| Aegis Support Drone | HQ Repair | 0 | Repair HQ 7. |
| Tempest Strike Bomber | Death from Above | 0 | Allied Missile +1. |
| Stealthray Bomber | The Silent Death | 0 | Untargetable next turn. |
| Komet Fighter | Hit & Run | 8 | Extra attack: gun ATK 8, then return to reserve. No missile. |

## Defense scores & hits survived

| Unit | Cost | HP | Armor | HP+2A | HP+3A | vs Average | vs Trench Guard (max ATK) | vs Exosuit Breacher (max AP) | vs Komet Fighter (max ATK+AP) |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Iron Bastion | 6 | 10 | 8 | 26 | 34 | 0.44 / 23 · 0.44 / 23 · 12 | 1 / 10 · 1 / 10 · 5 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Zeus | 6 | 10 | 6 | 22 | 28 | 2.44 / 5 · 2.44 / 5 · 3 | 3 / 4 · 3 / 4 · 2 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Aegis | 6 | 12 | 4 | 20 | 24 | 4.44 / 3 · 4.44 / 3 · 2 | 5 / 3 · 5 / 3 · 2 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Ironclad Goliath | 6 | 11 | 4 | 19 | 23 | 4.44 / 3 · 4.44 / 3 · 2 | 5 / 3 · 5 / 3 · 2 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Tempest Strike Bomber | 4 | 13 | 3 | 19 | 22 | 5.33 / 3 · 5.33 / 3 · 2 | 6 / 3 · 6 / 3 · 2 | 4 / 4 · 4 / 4 · 2 | 8 / 2 · 8 / 2 · 1 |
| Trench Guard | 5 | 20 | 0 | 20 | 20 | 6.11 / 4 · 5.33 / 4 · 2 | 9 / 3 · 9 / 3 · 2 | 4 / 5 · 4 / 5 · 3 | 8 / 3 · 8 / 3 · 2 |
| Scout Biker | 4 | 14 | 2 | 18 | 20 | 5.33 / 3 · 5.33 / 3 · 2 | 7 / 2 · 7 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 8 / 2 · 8 / 2 · 1 |
| Mirage Humvee | 3 | 11 | 3 | 17 | 20 | 5.33 / 3 · 5.33 / 3 · 2 | 6 / 2 · 6 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Line Combat Medic | 4 | 19 | 0 | 19 | 19 | 6.11 / 4 · 5.33 / 4 · 2 | 9 / 3 · 9 / 3 · 2 | 4 / 5 · 4 / 5 · 3 | 8 / 3 · 8 / 3 · 2 |
| Death Rider | 5 | 16 | 1 | 18 | 19 | 6.11 / 3 · 5.33 / 3 · 2 | 8 / 2 · 8 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 8 / 2 · 8 / 2 · 1 |
| Viper Gunship | 5 | 13 | 2 | 17 | 19 | 5.33 / 3 · 5.33 / 3 · 2 | 7 / 2 · 7 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 8 / 2 · 8 / 2 · 1 |
| Apex Destroyer | 6 | 10 | 3 | 16 | 19 | 5.33 / 2 · 5.33 / 2 · 1 | 6 / 2 · 6 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Stalker Biped | 5 | 10 | 3 | 16 | 19 | 5.33 / 2 · 5.33 / 2 · 1 | 6 / 2 · 6 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Exosuit Breacher | 4 | 18 | 0 | 18 | 18 | 6.11 / 3 · 5.33 / 4 · 2 | 9 / 2 · 9 / 2 · 1 | 4 / 5 · 4 / 5 · 3 | 8 / 3 · 8 / 3 · 2 |
| Nomad Supply Buggy | 5 | 12 | 2 | 16 | 18 | 5.33 / 3 · 5.33 / 3 · 2 | 7 / 2 · 7 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Falcon Dropship | 4 | 14 | 1 | 16 | 17 | 6.11 / 3 · 5.33 / 3 · 2 | 8 / 2 · 8 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 8 / 2 · 8 / 2 · 1 |
| Phantom Speeder | 3 | 14 | 1 | 16 | 17 | 6.11 / 3 · 5.33 / 3 · 2 | 8 / 2 · 8 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 8 / 2 · 8 / 2 · 1 |
| Jackal Scout | 4 | 10 | 2 | 14 | 16 | 5.33 / 2 · 5.33 / 2 · 1 | 7 / 2 · 7 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Hornet Interceptor | 4 | 10 | 2 | 14 | 16 | 5.33 / 2 · 5.33 / 2 · 1 | 7 / 2 · 7 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Stealthray Bomber | 6 | 12 | 1 | 14 | 15 | 6.11 / 2 · 5.33 / 3 · 2 | 8 / 2 · 8 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 8 / 2 · 8 / 2 · 1 |
| Manticore MLRS | 5 | 8 | 0 | 8 | 8 | 6.11 / 2 · 5.33 / 2 · 1 | 9 / 1 · 9 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 8 / 1 · 8 / 1 · 1 |
| Sentinel Battery | 4 | 8 | 0 | 8 | 8 | 6.11 / 2 · 5.33 / 2 · 1 | 9 / 1 · 9 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 8 / 1 · 8 / 1 · 1 |
| Siege Howitzer | 5 | 8 | 0 | 8 | 8 | 6.11 / 2 · 5.33 / 2 · 1 | 9 / 1 · 9 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 8 / 1 · 8 / 1 · 1 |
| Aegis Support Drone | 2 | 5 | 1 | 7 | 8 | 6.11 / 1 · 5.33 / 1 · 1 | 8 / 1 · 8 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 8 / 1 · 8 / 1 · 1 |
| Recon Eye | 2 | 4 | 0 | 4 | 4 | 6.11 / 1 · 5.33 / 1 · 1 | 9 / 1 · 9 / 1 · 1 | 4 / 1 · 4 / 1 · 1 | 8 / 1 · 8 / 1 · 1 |
| Kamikaze Hunter | 3 | 4 | 0 | 4 | 4 | 6.11 / 1 · 5.33 / 1 · 1 | 9 / 1 · 9 / 1 · 1 | 4 / 1 · 4 / 1 · 1 | 8 / 1 · 8 / 1 · 1 |
| Komet Fighter | 6 | 3 | 0 | 3 | 3 | 6.11 / 1 · 5.33 / 1 · 1 | 9 / 1 · 9 / 1 · 1 | 4 / 1 · 4 / 1 · 1 | 8 / 1 · 8 / 1 · 1 |

### Incoming damage detail

| Unit | Armor | Avg gun / missile | Max ATK gun / missile | Max AP gun / missile | Max ATK+AP gun / missile |
| --- | ---: | --- | --- | --- | --- |
| Iron Bastion | 8 | 0.44 / 0 | 1 / 0 | 4 / 0 | 8 / 0 |
| Zeus | 6 | 2.44 / 0 | 3 / 0 | 4 / 0 | 8 / 0 |
| Aegis | 4 | 4.44 / 0 | 5 / 0 | 4 / 0 | 8 / 0 |
| Ironclad Goliath | 4 | 4.44 / 0 | 5 / 0 | 4 / 0 | 8 / 0 |
| Tempest Strike Bomber | 3 | 5.33 / 0 | 6 / 0 | 4 / 0 | 8 / 0 |
| Trench Guard | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Scout Biker | 2 | 5.33 / 0 | 7 / 0 | 4 / 0 | 8 / 0 |
| Mirage Humvee | 3 | 5.33 / 0 | 6 / 0 | 4 / 0 | 8 / 0 |
| Line Combat Medic | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Death Rider | 1 | 5.33 / 0.78 | 8 / 0 | 4 / 0 | 8 / 0 |
| Viper Gunship | 2 | 5.33 / 0 | 7 / 0 | 4 / 0 | 8 / 0 |
| Apex Destroyer | 3 | 5.33 / 0 | 6 / 0 | 4 / 0 | 8 / 0 |
| Stalker Biped | 3 | 5.33 / 0 | 6 / 0 | 4 / 0 | 8 / 0 |
| Exosuit Breacher | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Nomad Supply Buggy | 2 | 5.33 / 0 | 7 / 0 | 4 / 0 | 8 / 0 |
| Falcon Dropship | 1 | 5.33 / 0.78 | 8 / 0 | 4 / 0 | 8 / 0 |
| Phantom Speeder | 1 | 5.33 / 0.78 | 8 / 0 | 4 / 0 | 8 / 0 |
| Jackal Scout | 2 | 5.33 / 0 | 7 / 0 | 4 / 0 | 8 / 0 |
| Hornet Interceptor | 2 | 5.33 / 0 | 7 / 0 | 4 / 0 | 8 / 0 |
| Stealthray Bomber | 1 | 5.33 / 0.78 | 8 / 0 | 4 / 0 | 8 / 0 |
| Manticore MLRS | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Sentinel Battery | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Siege Howitzer | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Aegis Support Drone | 1 | 5.33 / 0.78 | 8 / 0 | 4 / 0 | 8 / 0 |
| Recon Eye | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Kamikaze Hunter | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |
| Komet Fighter | 0 | 5.33 / 0.78 | 9 / 0 | 4 / 0 | 8 / 0 |

## Notes

- Support Fire received is identical for every unit under the 2-ally assumption; Rally is the only ally-buff differentiator.
- Ambush: Frontline extra engage (buffed ATK) plus +2 on the regular attack volley. Sticky Bomb: +6 ATK × 2 hits. Deadly Presence stays 0.
- Kamikaze 8 is one-shot and kills the drone; the 2-turn table still adds it as special damage.
