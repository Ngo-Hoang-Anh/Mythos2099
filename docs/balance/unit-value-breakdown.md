# Unit value breakdown — 2-turn damage & defense

Generated: 2026-11-19T13:48:58.531Z

## Offense assumptions (2 turns: you attack, then you defend)

- Target armor is **0**. Missile and gun both deal their full ATK/Missile value.
- Self ATK = (ATK + Aggressive) on your attack + (ATK + Retaliate) on your defend = `2×ATK + Aggressive + Retaliate`.
- Ally buff: 2 adjacent allies with Support Fire 2 each → +4 ATK on **both** volleys = +8. Units with Rally add +3 (played on your attack turn).
- Indirect = Missile once (only the attacker fires missiles).
- Special = hand-calculated constants in `src/tools/specialSkillDamage.ts`. Utility / buff specials are 0.

## Defense assumptions

- Score 1: `HP + Armor × 2`
- Score 2: `HP + Armor × 3`
- Total ATK = ATK + Aggressive + Retaliate. Catalog average: total ATK **4.64**, AP **2.69**, Missile **0.58**.
- Extreme attackers: max total ATK = **Heimdall Bastion** (10 ATK, 2 AP, Missile 0); max AP = **Rostam Breacher** (8 AP, 4 ATK, Missile 0); max ATK+AP = **Pashupata Annihilator** (14).
- Incoming **attack** hit = gun (`total ATK` vs armor after AP) + missile (50% armor rounded up, no AP).
- Incoming **retaliate** hit = gun only (opponent is immortal; your damage is ignored).
- Survival cells: `atkDmg / atkHits · retalDmg / retalHits · 2-turn cycles` until HP reaches 0. ∞ = that hit deals 0.

## Offense over 2 turns

| Unit | Cost | ATK | Agg | Ret | Total ATK | AP | Missile | Self ATK | Ally buff (SF / Rally) | Indirect | Special | Special name | **Total** |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Pashupata Annihilator | 6 | 7 | 0 | 0 | 7 | 7 | 0 | 14 | 8 (8 / 0) | 0 | 7 | Precision Strike | **29** |
| Sekhmet Kamikaze | 3 | 6 | 0 | 0 | 6 | 4 | 0 | 12 | 8 (8 / 0) | 0 | 8 | Kamikaze | **28** |
| Tiamat Echo | 5 | 5 | 0 | 0 | 5 | 5 | 5 | 10 | 8 (8 / 0) | 5 | 5 | Storm Caller | **28** |
| Zeus Devastator | 6 | 3 | 0 | 0 | 3 | 2 | 5 | 6 | 8 (8 / 0) | 5 | 8 | Thunder Strike | **27** |
| Houyi Quiver | 4 | 6 | 0 | 0 | 6 | 5 | 0 | 12 | 8 (8 / 0) | 0 | 6 | First Strike | **26** |
| Rostam Breacher | 4 | 2 | 0 | 2 | 4 | 8 | 0 | 6 | 8 (8 / 0) | 0 | 12 | Sticky Bomb | **26** |
| Baihu | 6 | 4 | 0 | 0 | 4 | 3 | 0 | 8 | 8 (8 / 0) | 0 | 10 | Ambush | **26** |
| Thor | 4 | 3 | 0 | 0 | 7 | 2 | 0 | 14 | 8 (8 / 0) | 0 | 3 | Thunder Strike | **25** |
| Fenrir Vanguard | 6 | 3 | 2 | 0 | 5 | 6 | 0 | 8 | 8 (8 / 0) | 0 | 9 | Ambush | **25** |
| Garuda Talon | 5 | 5 | 0 | 3 | 8 | 3 | 0 | 13 | 11 (8 / 3) | 0 | 0 | Rally | **24** |
| Typhon Disruptor | 6 | 3 | 0 | 2 | 9 | 2 | 0 | 16 | 8 (8 / 0) | 0 | 0 | Diversion C | **24** |
| Suzaku Komet | 6 | 5 | 0 | 0 | 5 | 5 | 0 | 10 | 8 (8 / 0) | 0 | 5 | Hit & Run | **23** |
| Skadi Hunter | 5 | 3 | 4 | 0 | 7 | 3 | 0 | 10 | 8 (8 / 0) | 0 | 4 | Coordinate | **22** |
| Qinglong | 5 | 2 | 0 | 0 | 7 | 1 | 0 | 14 | 8 (8 / 0) | 0 | 0 | Analyze Weakness | **22** |
| Heimdall Bastion | 4 | 2 | 0 | 8 | 10 | 2 | 0 | 12 | 8 (8 / 0) | 0 | 0 | Entrenchment | **20** |
| Hades Stealthray | 6 | 6 | 0 | 0 | 6 | 3 | 0 | 12 | 8 (8 / 0) | 0 | 0 | The Silent Death | **20** |
| Huma Enforcer | 3 | 4 | 0 | 0 | 4 | 2 | 0 | 8 | 11 (8 / 3) | 0 | 0 | Rally | **19** |
| Dhanvantari Lifeweaver | 4 | 4 | 0 | 3 | 7 | 0 | 0 | 11 | 8 (8 / 0) | 0 | 0 | First-aid Kit | **19** |
| Gungnir's Tip | 5 | 4 | 3 | 0 | 7 | 3 | 0 | 11 | 8 (8 / 0) | 0 | 0 | Deadly Presence | **19** |
| Raiju's Whisper | 4 | 3 | 0 | 0 | 3 | 0 | 4 | 6 | 8 (8 / 0) | 4 | 0 | Tactical Strike | **18** |
| Simurgh Skylord | 4 | 5 | 0 | 0 | 5 | 1 | 0 | 10 | 8 (8 / 0) | 0 | 0 | Vision Support | **18** |
| Raijin Tempest | 4 | 3 | 0 | 0 | 3 | 2 | 4 | 6 | 8 (8 / 0) | 4 | 0 | Death from Above | **18** |
| Longinus | 5 | 3 | 0 | 0 | 3 | 3 | 0 | 6 | 8 (8 / 0) | 0 | 3 | Precision Strike | **17** |
| Xuanwu Fortress | 6 | 2 | 0 | 5 | 7 | 0 | 0 | 9 | 8 (8 / 0) | 0 | 0 | Trap | **17** |
| Hermes Strider | 3 | 4 | 0 | 0 | 4 | 4 | 0 | 8 | 8 (8 / 0) | 0 | 0 | Diversion A | **16** |
| Thoth Oracler | 6 | 4 | 0 | 0 | 4 | 4 | 0 | 8 | 8 (8 / 0) | 0 | 0 | Analyze Weakness | **16** |
| Sarama Warhound | 4 | 3 | 0 | 0 | 3 | 3 | 0 | 6 | 8 (8 / 0) | 0 | 0 | Intel Acquired | **14** |
| Yatagarasu Pathfinder | 4 | 3 | 0 | 0 | 3 | 1 | 0 | 6 | 8 (8 / 0) | 0 | 0 | Diversion B | **14** |
| Loki | 4 | 3 | 0 | 0 | 3 | 3 | 0 | 6 | 8 (8 / 0) | 0 | 0 | Copy | **14** |
| Eir's Blessing | 5 | 3 | 0 | 0 | 3 | 2 | 0 | 6 | 8 (8 / 0) | 0 | 0 | Repair | **14** |
| Excalibur | 5 | 3 | 0 | 0 | 3 | 5 | 0 | 6 | 8 (8 / 0) | 0 | 0 | Deadly Presence | **14** |
| Eyes of Horus | 2 | 1 | 0 | 0 | 1 | 0 | 3 | 2 | 8 (8 / 0) | 3 | 0 | Target Acquired | **13** |
| Artemis | 3 | 2 | 0 | 0 | 2 | 1 | 0 | 4 | 8 (8 / 0) | 0 | 0 | Target Acquired | **12** |
| Agni | 4 | 2 | 0 | 0 | 2 | 1 | 0 | 4 | 8 (8 / 0) | 0 | 0 | Tactical Strike | **12** |
| Pandora | 3 | 1 | 0 | 0 | 1 | 1 | 0 | 2 | 8 (8 / 0) | 0 | 0 | Trap | **10** |
| Anhur Warden | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 (8 / 0) | 0 | 0 | HQ Repair | **8** |

## Special skill constants

| Unit | Skill | Damage | Note |
| --- | --- | ---: | --- |
| Zeus Devastator | Thunder Strike | 8 | Extra attack: gun 3 + follow-up Missile 5. Ignore-armor adds 0 when target armor is already 0. |
| Fenrir Vanguard | Ambush | 9 | Frontline extra engage: ATK 3 + Aggressive 2 + 2 = 7, plus +2 ATK on the regular attack volley. +2 Armor adds 0 vs 0-armor targets. |
| Xuanwu Fortress | Trap | 0 | Forces engagement; no extra damage. |
| Sarama Warhound | Intel Acquired | 0 | Move an ally twice (including diagonal) and gain 1 Supply. |
| Eir's Blessing | Repair | 0 | Heal 4. |
| Huma Enforcer | Rally | 0 | +3 ATK to an ally; counted under ally buff, not special. |
| Garuda Talon | Rally | 0 | +3 ATK to an ally; counted under ally buff, not special. |
| Raiju's Whisper | Tactical Strike | 0 | Missile +4 on an ally. |
| Simurgh Skylord | Vision Support | 0 | Support Fire also grants +2 AP; no damage instance. |
| Tiamat Echo | Storm Caller | 5 | Extra own Missile 5. Ally missile proc is not this unit's damage. |
| Houyi Quiver | First Strike | 6 | Extra attack: gun ATK 6. No missile. |
| Pashupata Annihilator | Precision Strike | 7 | Extra attack anywhere: gun ATK 7. No missile. |
| Typhon Disruptor | Diversion C | 0 | Move an enemy into Aegis's lane and strip keywords until end of opponent's turn. |
| Skadi Hunter | Coordinate | 4 | Extra attack after +1 ATK: gun 3+1 = 4. Buff lasts the rest of the turn. No return fire. |
| Thoth Oracler | Analyze Weakness | 0 | −2 Armor. No extra damage when the target is already 0 armor. |
| Rostam Breacher | Sticky Bomb | 12 | +6 ATK this turn on 2 hits (extra attack + normal engage) = 12. Self 4 after each shot is not enemy damage. |
| Heimdall Bastion | Entrenchment | 0 | +3 Armor / +2 AP. |
| Dhanvantari Lifeweaver | First-aid Kit | 0 | Heal all Armored Infantry 2; all allies Repair 1 for 2 turns. Requires Medic on board. |
| Hermes Strider | Diversion A | 0 | Move an enemy down; -1 ATK for 2 turns. |
| Gungnir's Tip | Deadly Presence | 0 | +2 ATK / +4 AP buff. |
| Yatagarasu Pathfinder | Diversion B | 0 | Move an enemy up; -1 ARM for 2 turns. |
| Eyes of Horus | Target Acquired | 0 | Marks a missile lane; enemies there take +1 Missile damage. |
| Sekhmet Kamikaze | Kamikaze | 8 | 8 damage ignore armor; unit dies. |
| Anhur Warden | HQ Repair | 0 | Repair HQ 7. |
| Raijin Tempest | Death from Above | 0 | Allied Missile +1. |
| Hades Stealthray | The Silent Death | 0 | Untargetable next turn. |
| Suzaku Komet | Hit & Run | 5 | Extra attack: gun ATK 5, then return to reserve. No missile. |
| Qinglong | Analyze Weakness | 0 | −2 Armor. No extra damage when the target is already 0 armor. |
| Baihu | Ambush | 10 | Frontline extra engage: ATK 4 + Ambush +2 = 6, plus +2 ATK on the regular attack volley vs 0 armor. |
| Pandora | Trap | 0 | Forces engagement; no extra damage. |
| Excalibur | Deadly Presence | 0 | +2 ATK / +4 AP buff. |
| Longinus | Precision Strike | 3 | Extra attack anywhere: gun ATK 3 (First Strike already spent or not on extra). Conservative constant uses printed ATK. |
| Thor | Thunder Strike | 3 | Extra attack: gun ATK 3. No missile on Thor. |
| Artemis | Target Acquired | 0 | Marks a missile lane; enemies there take +1 Missile damage. |
| Agni | Tactical Strike | 0 | Missile +4 on an ally. |
| Loki | Copy | 0 | Mirrors another unit's ATK/Armor/AP until end of opponent's next turn. |

## Defense scores & hits survived

| Unit | Cost | HP | Armor | HP+2A | HP+3A | vs Average | vs Heimdall Bastion (max ATK) | vs Rostam Breacher (max AP) | vs Pashupata Annihilator (max ATK+AP) |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Zeus Devastator | 6 | 10 | 6 | 22 | 28 | 1.33 / 8 · 1.33 / 8 · 4 | 6 / 2 · 6 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Typhon Disruptor | 6 | 12 | 4 | 20 | 24 | 3.33 / 4 · 3.33 / 4 · 2 | 8 / 2 · 8 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Raijin Tempest | 4 | 13 | 3 | 19 | 22 | 4.33 / 3 · 4.33 / 3 · 2 | 9 / 2 · 9 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 7 / 2 · 7 / 2 · 1 |
| Yatagarasu Pathfinder | 4 | 14 | 2 | 18 | 20 | 4.64 / 4 · 4.64 / 4 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 7 / 2 · 7 / 2 · 1 |
| Excalibur | 5 | 14 | 2 | 18 | 20 | 4.64 / 4 · 4.64 / 4 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 7 / 2 · 7 / 2 · 1 |
| Dhanvantari Lifeweaver | 4 | 19 | 0 | 19 | 19 | 5.22 / 4 · 4.64 / 5 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 5 · 4 / 5 · 3 | 7 / 3 · 7 / 3 · 2 |
| Gungnir's Tip | 5 | 16 | 1 | 18 | 19 | 4.64 / 4 · 4.64 / 4 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 7 / 3 · 7 / 3 · 2 |
| Garuda Talon | 5 | 13 | 2 | 17 | 19 | 4.64 / 3 · 4.64 / 3 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 7 / 2 · 7 / 2 · 1 |
| Fenrir Vanguard | 6 | 10 | 3 | 16 | 19 | 4.33 / 3 · 4.33 / 3 · 2 | 9 / 2 · 9 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Agni | 4 | 12 | 2 | 16 | 18 | 4.64 / 3 · 4.64 / 3 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Xuanwu Fortress | 6 | 9 | 3 | 15 | 18 | 4.33 / 3 · 4.33 / 3 · 2 | 9 / 1 · 9 / 1 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Thoth Oracler | 6 | 9 | 3 | 15 | 18 | 4.33 / 3 · 4.33 / 3 · 2 | 9 / 1 · 9 / 1 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Thor | 4 | 9 | 3 | 15 | 18 | 4.33 / 3 · 4.33 / 3 · 2 | 9 / 1 · 9 / 1 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Eir's Blessing | 5 | 11 | 2 | 15 | 17 | 4.64 / 3 · 4.64 / 3 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Baihu | 6 | 11 | 2 | 15 | 17 | 4.64 / 3 · 4.64 / 3 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Heimdall Bastion | 4 | 16 | 0 | 16 | 16 | 5.22 / 4 · 4.64 / 4 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 7 / 3 · 7 / 3 · 2 |
| Raiju's Whisper | 4 | 10 | 2 | 14 | 16 | 4.64 / 3 · 4.64 / 3 · 2 | 10 / 1 · 10 / 1 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Rostam Breacher | 4 | 15 | 0 | 15 | 15 | 5.22 / 3 · 4.64 / 4 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 4 · 4 / 4 · 2 | 7 / 3 · 7 / 3 · 2 |
| Huma Enforcer | 3 | 9 | 2 | 13 | 15 | 4.64 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Qinglong | 5 | 11 | 1 | 13 | 14 | 4.64 / 3 · 4.64 / 3 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Skadi Hunter | 5 | 8 | 2 | 12 | 14 | 4.64 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Artemis | 3 | 9 | 1 | 11 | 12 | 4.64 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Simurgh Skylord | 4 | 11 | 0 | 11 | 11 | 5.22 / 3 · 4.64 / 3 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Hermes Strider | 3 | 11 | 0 | 11 | 11 | 5.22 / 3 · 4.64 / 3 · 2 | 10 / 2 · 10 / 2 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Sarama Warhound | 4 | 8 | 1 | 10 | 11 | 4.64 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Pandora | 3 | 8 | 1 | 10 | 11 | 4.64 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Hades Stealthray | 6 | 10 | 0 | 10 | 10 | 5.22 / 2 · 4.64 / 3 · 2 | 10 / 1 · 10 / 1 · 1 | 4 / 3 · 4 / 3 · 2 | 7 / 2 · 7 / 2 · 1 |
| Tiamat Echo | 5 | 8 | 0 | 8 | 8 | 5.22 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Houyi Quiver | 4 | 8 | 0 | 8 | 8 | 5.22 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Pashupata Annihilator | 6 | 8 | 0 | 8 | 8 | 5.22 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Longinus | 5 | 8 | 0 | 8 | 8 | 5.22 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Loki | 4 | 8 | 0 | 8 | 8 | 5.22 / 2 · 4.64 / 2 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 2 · 4 / 2 · 1 | 7 / 2 · 7 / 2 · 1 |
| Eyes of Horus | 2 | 4 | 0 | 4 | 4 | 5.22 / 1 · 4.64 / 1 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 1 · 4 / 1 · 1 | 7 / 1 · 7 / 1 · 1 |
| Sekhmet Kamikaze | 3 | 4 | 0 | 4 | 4 | 5.22 / 1 · 4.64 / 1 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 1 · 4 / 1 · 1 | 7 / 1 · 7 / 1 · 1 |
| Anhur Warden | 2 | 4 | 0 | 4 | 4 | 5.22 / 1 · 4.64 / 1 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 1 · 4 / 1 · 1 | 7 / 1 · 7 / 1 · 1 |
| Suzaku Komet | 6 | 3 | 0 | 3 | 3 | 5.22 / 1 · 4.64 / 1 · 1 | 10 / 1 · 10 / 1 · 1 | 4 / 1 · 4 / 1 · 1 | 7 / 1 · 7 / 1 · 1 |

### Incoming damage detail

| Unit | Armor | Avg gun / missile | Max ATK gun / missile | Max AP gun / missile | Max ATK+AP gun / missile |
| --- | ---: | --- | --- | --- | --- |
| Zeus Devastator | 6 | 1.33 / 0 | 6 / 0 | 4 / 0 | 7 / 0 |
| Typhon Disruptor | 4 | 3.33 / 0 | 8 / 0 | 4 / 0 | 7 / 0 |
| Raijin Tempest | 3 | 4.33 / 0 | 9 / 0 | 4 / 0 | 7 / 0 |
| Yatagarasu Pathfinder | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Excalibur | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Dhanvantari Lifeweaver | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Gungnir's Tip | 1 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Garuda Talon | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Fenrir Vanguard | 3 | 4.33 / 0 | 9 / 0 | 4 / 0 | 7 / 0 |
| Agni | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Xuanwu Fortress | 3 | 4.33 / 0 | 9 / 0 | 4 / 0 | 7 / 0 |
| Thoth Oracler | 3 | 4.33 / 0 | 9 / 0 | 4 / 0 | 7 / 0 |
| Thor | 3 | 4.33 / 0 | 9 / 0 | 4 / 0 | 7 / 0 |
| Eir's Blessing | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Baihu | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Heimdall Bastion | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Raiju's Whisper | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Rostam Breacher | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Huma Enforcer | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Qinglong | 1 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Skadi Hunter | 2 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Artemis | 1 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Simurgh Skylord | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Hermes Strider | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Sarama Warhound | 1 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Pandora | 1 | 4.64 / 0 | 10 / 0 | 4 / 0 | 7 / 0 |
| Hades Stealthray | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Tiamat Echo | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Houyi Quiver | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Pashupata Annihilator | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Longinus | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Loki | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Eyes of Horus | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Sekhmet Kamikaze | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Anhur Warden | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |
| Suzaku Komet | 0 | 4.64 / 0.58 | 10 / 0 | 4 / 0 | 7 / 0 |

## Notes

- Support Fire received is identical for every unit under the 2-ally assumption; Rally is the only ally-buff differentiator.
- Ambush: Frontline extra engage (buffed ATK) plus +2 on the regular attack volley. Sticky Bomb: +6 ATK × 2 hits. Deadly Presence stays 0.
- Kamikaze 8 is one-shot and kills the drone; the 2-turn table still adds it as special damage.
