# Vacuum 1v1 — remaining HP

Generated: 2026-11-19T13:48:58.090Z

## Assumptions

- Two units only, same lane, no cards, no Cover/Flank relocation, no allied Support Fire.
- Artillery / Jet Plane stay on Support; everyone else on Frontline.
- **One engagement:** full engine gun math — ATK + Aggressive/Retaliate + First Strike + **Shock**, AP, Shield/Barrier, Sloped, Hulldown; **Corrosion −Armor once** on connecting hits before damage; then missiles (50% armor, no AP).
- **Two-round exchange:** that engagement, then roles reverse with leftover HP if both still live.
- Still omitted: cards, Cover/Flank relocation, allied Support Fire, Smoke dodge setup, Suppression marks, Fire DoT ticks, Radar re-aim, Loki Copy.
- Cell mark: `W` attacker lives & defender dies, `L` attacker dies, `X` both die, `·` both live.

## Roster / short codes

| Code | Name | Class | Cost | HP | ATK | Armor | AP | Keywords |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Zeus | Zeus Devastator | Tank | 6 | 10 | 3 | 6 | 2 | cover, missile 5 |
| Fenrir | Fenrir Vanguard | Tank | 6 | 10 | 3 | 3 | 6 | aggressive 2 |
| Xuanwu | Xuanwu Fortress | Tank | 6 | 9 | 2 | 3 | 0 | hulldown 1, slopedArmor 1, retaliate 5 |
| Sarama | Sarama Warhound | Light Vehicle | 4 | 8 | 3 | 1 | 3 | flank, blitz, barrier 2 |
| Eirs | Eir's Blessing | Light Vehicle | 5 | 11 | 3 | 2 | 2 | supportFire 2, flank |
| Huma | Huma Enforcer | Light Vehicle | 3 | 9 | 4 | 2 | 2 | cover, barrier 2 |
| Garuda | Garuda Talon | Helicopter | 5 | 13 | 5 | 2 | 3 | blitz, retaliate 3 |
| Raijus | Raiju's Whisper | Helicopter | 4 | 10 | 3 | 2 | 0 | blitz, missile 4, corrosion 1 |
| Simurgh | Simurgh Skylord | Helicopter | 4 | 11 | 5 | 0 | 1 | supportFire 2, blitz, suppression 1 |
| Tiamat | Tiamat Echo | Artillery | 5 | 8 | 5 | 0 | 5 | artillery, missile 5 |
| Houyi | Houyi Quiver | Artillery | 4 | 8 | 6 | 0 | 5 | artillery, cover |
| Pashupat | Pashupata Annihilator | Artillery | 6 | 8 | 7 | 0 | 7 | artillery |
| Typhon | Typhon Disruptor | Robot | 6 | 12 | 3 | 4 | 2 | retaliate 2, shock 4 |
| Skadi | Skadi Hunter | Robot | 5 | 8 | 3 | 2 | 3 | aggressive 4, camouflage 1 |
| Thoth | Thoth Oracler | Robot | 6 | 9 | 4 | 3 | 4 | supportFire 2, shield 3 |
| Rostam | Rostam Breacher | Armored Infantry | 4 | 15 | 2 | 0 | 8 | retaliate 2, cover |
| Heimdall | Heimdall Bastion | Armored Infantry | 4 | 16 | 2 | 0 | 2 | retaliate 8, hulldown 1 |
| Dhanvant | Dhanvantari Lifeweaver | Armored Infantry | 4 | 19 | 4 | 0 | 0 | supportFire 2, retaliate 3 |
| Hermes | Hermes Strider | Motorcycle | 3 | 11 | 4 | 0 | 4 | flank, blitz, smokeScreen 1 |
| Gungnirs | Gungnir's Tip | Motorcycle | 5 | 16 | 4 | 1 | 3 | aggressive 3, cover, veteran 1 |
| Yatagara | Yatagarasu Pathfinder | Motorcycle | 4 | 14 | 3 | 2 | 1 | supportFire 2, flank, scout 1 |
| Eyes | Eyes of Horus | Drone | 2 | 4 | 1 | 0 | 0 | blitz, missile 3, radar 1 |
| Sekhmet | Sekhmet Kamikaze | Drone | 3 | 4 | 6 | 0 | 4 | blitz, cover, scout 1 |
| Anhur | Anhur Warden | Drone | 2 | 4 | 0 | 0 | 0 | blitz, supportFire 3, shield 2 |
| Raijin | Raijin Tempest | Jet Plane | 4 | 13 | 3 | 3 | 2 | jetPlane, missile 4 |
| Hades | Hades Stealthray | Jet Plane | 6 | 10 | 6 | 0 | 3 | jetPlane, flank, camouflage 1 |
| Suzaku | Suzaku Komet | Jet Plane | 6 | 3 | 5 | 0 | 5 | jetPlane, blitz, fire 3 |
| Qinglong | Qinglong | Drone | 5 | 11 | 2 | 1 | 1 | blitz, barrier 4, shock 5 |
| Baihu | Baihu | Light Vehicle | 6 | 11 | 4 | 2 | 3 | veteran 1, shield 2, slopedArmor 1 |
| Pandora | Pandora | Robot | 3 | 8 | 1 | 1 | 1 | smokeScreen 1, suppression 1, corrosion 3 |
| Excalibu | Excalibur | Armored Infantry | 5 | 14 | 3 | 2 | 5 | veteran 1, firstStrike 4 |
| Longinus | Longinus | Artillery | 5 | 8 | 3 | 0 | 3 | artillery, firstStrike 4 |
| Thor | Thor | Tank | 4 | 9 | 3 | 3 | 2 | shield 2, shock 4 |
| Artemis | Artemis | Jet Plane | 3 | 9 | 2 | 1 | 1 | jetPlane, scout 1, radar 1 |
| Agni | Agni | Helicopter | 4 | 12 | 2 | 2 | 1 | firstStrike 3, fire 3, corrosion 2 |
| Loki | Loki | Light Vehicle | 4 | 8 | 3 | 0 | 3 | camouflage 1, shield 3 |

## One engagement (row attacks first)

### Remaining HP after 1 engagement

Ô: `HP attacker / HP defender` sau combat. 0 = chết.

| Hàng = attacker | Zeus | Fenrir | Xuanwu | Sarama | Eirs | Huma | Garuda | Raijus | Simurgh | Tiamat | Houyi | Pashupat | Typhon | Skadi | Thoth | Rostam | Heimdall | Dhanvant | Hermes | Gungnirs | Yatagara | Eyes | Sekhmet | Anhur | Raijin | Hades | Suzaku | Qinglong | Baihu | Pandora | Excalibu | Longinus | Thor | Artemis | Agni | Loki |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zeus | 10/10 · | 7/8 · | 9/9 · | 10/7 · | 10/8 · | 10/8 · | 5/10 · | 10/7 · | 10/8 · | 10/5 · | 10/5 · | 10/5 · | 5/11 · | 10/5 · | 8/9 · | 6/12 · | 4/13 · | 9/16 · | 8/8 · | 9/13 · | 10/11 · | 10/1 · | 6/1 · | 10/3 · | 10/11 · | 7/7 · | 6/0 W | 8/11 · | 9/11 · | 10/5 · | 8/11 · | 10/5 · | 7/9 · | 10/6 · | 10/9 · | 10/8 · |
| Fenrir | 8/5 · | 7/5 · | 6/4 · | 7/5 · | 8/6 · | 7/6 · | 2/8 · | 9/5 · | 7/6 · | 10/3 · | 10/3 · | 10/3 · | 2/7 · | 7/3 · | 6/7 · | 6/10 · | 1/11 · | 6/14 · | 6/6 · | 6/11 · | 9/9 · | 10/0 W | 4/0 W | 10/1 · | 8/8 · | 4/5 · | 5/0 W | 5/10 · | 6/11 · | 9/3 · | 7/9 · | 10/3 · | 4/6 · | 10/4 · | 8/7 · | 7/6 · |
| Xuanwu | 9/10 · | 9/10 · | 5/9 · | 9/8 · | 9/11 · | 9/9 · | 1/13 · | 9/10 · | 9/9 · | 9/6 · | 9/6 · | 9/6 · | 1/12 · | 9/8 · | 5/9 · | 5/13 · | 0/14 L | 5/17 · | 5/9 · | 5/15 · | 9/14 · | 9/2 · | 3/2 · | 9/4 · | 9/13 · | 3/8 · | 4/1 · | 4/11 · | 5/11 · | 9/7 · | 9/14 · | 9/6 · | 3/9 · | 9/8 · | 9/12 · | 9/8 · |
| Sarama | 7/10 · | 7/7 · | 4/9 · | 7/7 · | 7/8 · | 6/8 · | 2/10 · | 7/7 · | 5/8 · | 8/5 · | 8/5 · | 8/5 · | 0/10 L | 7/5 · | 6/9 · | 6/12 · | 0/13 L | 4/16 · | 6/8 · | 6/13 · | 7/11 · | 8/1 · | 4/1 · | 8/3 · | 5/10 · | 2/7 · | 3/0 W | 1/11 · | 6/11 · | 8/5 · | 7/11 · | 8/5 · | 1/8 · | 6/6 · | 8/9 · | 7/8 · |
| Eirs | 8/10 · | 8/8 · | 6/9 · | 8/7 · | 8/8 · | 7/8 · | 3/10 · | 9/7 · | 7/8 · | 11/5 · | 11/5 · | 11/5 · | 2/11 · | 8/5 · | 7/9 · | 7/12 · | 1/13 · | 6/16 · | 7/8 · | 7/13 · | 9/11 · | 11/1 · | 5/1 · | 11/3 · | 8/11 · | 5/7 · | 6/0 W | 5/11 · | 7/11 · | 10/5 · | 8/11 · | 11/5 · | 4/9 · | 10/6 · | 9/9 · | 8/8 · |
| Huma | 8/10 · | 8/7 · | 6/9 · | 8/6 · | 8/7 · | 7/7 · | 3/9 · | 9/6 · | 7/7 · | 9/4 · | 9/4 · | 9/4 · | 0/10 L | 8/4 · | 7/9 · | 7/11 · | 1/12 · | 6/15 · | 7/7 · | 7/12 · | 9/10 · | 9/0 W | 5/0 W | 9/2 · | 6/10 · | 3/6 · | 4/0 W | 3/11 · | 7/11 · | 9/4 · | 8/10 · | 9/4 · | 2/8 · | 8/5 · | 9/8 · | 8/7 · |
| Garuda | 10/8 · | 10/5 · | 8/4 · | 10/5 · | 10/6 · | 9/6 · | 5/8 · | 11/5 · | 9/6 · | 13/3 · | 13/3 · | 13/3 · | 4/8 · | 10/3 · | 9/7 · | 9/10 · | 3/11 · | 8/14 · | 9/6 · | 9/11 · | 11/9 · | 13/0 W | 7/0 W | 13/1 · | 10/8 · | 7/5 · | 8/0 W | 7/10 · | 9/11 · | 12/3 · | 10/9 · | 13/3 · | 6/6 · | 12/4 · | 11/7 · | 10/6 · |
| Raijus | 7/10 · | 7/9 · | 5/9 · | 7/7 · | 7/9 · | 6/9 · | 2/11 · | 8/8 · | 6/8 · | 10/5 · | 10/5 · | 10/5 · | 1/12 · | 7/6 · | 6/9 · | 6/12 · | 0/13 L | 5/16 · | 6/8 · | 6/13 · | 8/12 · | 10/1 · | 4/1 · | 10/3 · | 7/12 · | 4/7 · | 5/0 W | 4/11 · | 6/11 · | 9/5 · | 7/12 · | 10/5 · | 3/9 · | 9/6 · | 8/10 · | 7/8 · |
| Simurgh | 8/10 · | 8/7 · | 4/9 · | 8/5 · | 8/7 · | 7/7 · | 3/9 · | 8/6 · | 6/6 · | 11/3 · | 11/3 · | 11/3 · | 2/10 · | 8/4 · | 7/9 · | 7/10 · | 1/11 · | 4/14 · | 7/6 · | 7/11 · | 8/10 · | 10/0 W | 5/0 W | 11/1 · | 8/10 · | 5/5 · | 6/0 W | 4/10 · | 7/11 · | 10/3 · | 8/10 · | 11/3 · | 4/8 · | 9/4 · | 9/8 · | 8/6 · |
| Tiamat | 8/6 · | 8/5 · | 8/4 · | 8/3 · | 8/6 · | 8/4 · | 8/8 · | 8/5 · | 8/6 · | 8/3 · | 8/3 · | 8/3 · | 8/7 · | 8/3 · | 8/7 · | 8/10 · | 8/11 · | 8/14 · | 8/6 · | 8/11 · | 8/9 · | 8/0 W | 8/0 W | 8/1 · | 8/8 · | 8/5 · | 8/0 W | 8/6 · | 8/11 · | 8/3 · | 8/9 · | 8/3 · | 8/6 · | 8/4 · | 8/7 · | 8/6 · |
| Houyi | 8/5 · | 8/4 · | 8/3 · | 8/2 · | 8/5 · | 8/3 · | 8/7 · | 8/4 · | 8/5 · | 8/2 · | 8/2 · | 8/2 · | 8/6 · | 8/2 · | 8/6 · | 8/9 · | 8/10 · | 8/13 · | 8/5 · | 8/10 · | 8/8 · | 8/0 W | 8/0 W | 8/0 W | 8/7 · | 8/4 · | 8/0 W | 8/5 · | 8/7 · | 8/2 · | 8/8 · | 8/2 · | 8/5 · | 8/3 · | 8/6 · | 8/5 · |
| Pashupat | 8/3 · | 8/3 · | 8/2 · | 8/1 · | 8/4 · | 8/2 · | 8/6 · | 8/3 · | 8/4 · | 8/1 · | 8/1 · | 8/1 · | 8/5 · | 8/1 · | 8/5 · | 8/8 · | 8/9 · | 8/12 · | 8/4 · | 8/9 · | 8/7 · | 8/0 W | 8/0 W | 8/0 W | 8/6 · | 8/3 · | 8/0 W | 8/4 · | 8/6 · | 8/1 · | 8/7 · | 8/1 · | 8/4 · | 8/2 · | 8/5 · | 8/4 · |
| Typhon | 11/7 · | 9/4 · | 9/3 · | 10/1 · | 11/4 · | 10/2 · | 5/6 · | 12/3 · | 10/4 · | 12/1 · | 12/1 · | 12/1 · | 5/7 · | 10/1 · | 8/3 · | 8/8 · | 4/9 · | 9/12 · | 8/4 · | 9/9 · | 12/7 · | 12/0 W | 6/0 W | 12/0 W | 11/7 · | 7/3 · | 7/0 W | 8/4 · | 9/4 · | 11/1 · | 9/7 · | 12/1 · | 7/3 · | 12/2 · | 11/5 · | 10/1 · |
| Skadi | 5/6 · | 5/3 · | 3/2 · | 5/3 · | 5/4 · | 4/4 · | 0/6 L | 6/3 · | 4/4 · | 8/1 · | 8/1 · | 8/1 · | 0/6 L | 5/1 · | 4/5 · | 4/8 · | 0/9 L | 3/12 · | 4/4 · | 4/9 · | 6/7 · | 8/0 W | 2/0 W | 8/0 W | 5/6 · | 2/3 · | 3/0 W | 2/8 · | 4/6 · | 7/1 · | 5/7 · | 8/1 · | 1/4 · | 7/2 · | 6/5 · | 5/4 · |
| Thoth | 9/8 · | 9/6 · | 8/5 · | 9/6 · | 9/7 · | 9/7 · | 4/9 · | 9/6 · | 9/7 · | 9/4 · | 9/4 · | 9/4 · | 1/8 · | 9/4 · | 8/8 · | 8/11 · | 3/12 · | 8/15 · | 8/7 · | 8/12 · | 9/10 · | 9/0 W | 6/0 W | 9/2 · | 9/9 · | 6/6 · | 7/0 W | 4/11 · | 8/11 · | 9/4 · | 9/10 · | 9/4 · | 3/7 · | 9/5 · | 9/8 · | 9/7 · |
| Rostam | 12/8 · | 12/8 · | 8/9 · | 12/8 · | 12/9 · | 11/9 · | 7/11 · | 12/8 · | 10/9 · | 15/6 · | 15/6 · | 15/6 · | 6/10 · | 12/6 · | 11/9 · | 11/13 · | 5/14 · | 8/17 · | 11/9 · | 11/14 · | 12/12 · | 14/2 · | 9/2 · | 15/4 · | 12/11 · | 9/8 · | 10/1 · | 8/11 · | 11/11 · | 14/6 · | 12/12 · | 15/6 · | 8/9 · | 13/7 · | 13/10 · | 12/8 · |
| Heimdall | 13/10 · | 13/9 · | 9/9 · | 13/8 · | 13/9 · | 12/9 · | 8/11 · | 13/8 · | 11/9 · | 16/6 · | 16/6 · | 16/6 · | 7/12 · | 13/6 · | 12/9 · | 12/13 · | 6/14 · | 9/17 · | 12/9 · | 12/14 · | 13/12 · | 15/2 · | 10/2 · | 16/4 · | 13/12 · | 10/8 · | 11/1 · | 9/11 · | 12/11 · | 15/6 · | 13/12 · | 16/6 · | 9/9 · | 14/7 · | 14/10 · | 13/8 · |
| Dhanvant | 16/10 · | 16/9 · | 12/9 · | 16/7 · | 16/9 · | 15/9 · | 11/11 · | 16/8 · | 14/7 · | 19/4 · | 19/4 · | 19/4 · | 10/12 · | 16/6 · | 15/9 · | 15/11 · | 9/12 · | 12/15 · | 15/7 · | 15/13 · | 16/12 · | 18/0 W | 13/0 W | 19/2 · | 16/12 · | 13/6 · | 14/0 W | 12/11 · | 15/11 · | 18/5 · | 16/12 · | 19/4 · | 12/9 · | 17/6 · | 17/10 · | 16/7 · |
| Hermes | 8/8 · | 8/6 · | 4/5 · | 8/6 · | 8/7 · | 7/7 · | 3/9 · | 8/6 · | 6/7 · | 11/4 · | 11/4 · | 11/4 · | 2/8 · | 8/4 · | 7/8 · | 7/11 · | 1/12 · | 4/15 · | 7/7 · | 7/12 · | 8/10 · | 10/0 W | 5/0 W | 11/2 · | 8/9 · | 5/6 · | 6/0 W | 4/11 · | 7/11 · | 10/4 · | 8/10 · | 11/4 · | 4/7 · | 9/5 · | 9/8 · | 8/7 · |
| Gungnirs | 13/6 · | 13/3 · | 10/2 · | 13/3 · | 13/4 · | 12/4 · | 8/6 · | 13/3 · | 11/4 · | 16/1 · | 16/1 · | 16/1 · | 7/6 · | 13/1 · | 12/5 · | 12/8 · | 6/9 · | 10/12 · | 12/4 · | 12/9 · | 13/7 · | 16/0 W | 10/0 W | 16/0 W | 13/6 · | 10/3 · | 11/0 W | 9/8 · | 12/6 · | 15/1 · | 13/7 · | 16/1 · | 9/4 · | 14/2 · | 14/5 · | 13/4 · |
| Yatagara | 11/10 · | 11/9 · | 9/9 · | 11/7 · | 11/9 · | 10/9 · | 6/11 · | 12/8 · | 10/8 · | 14/5 · | 14/5 · | 14/5 · | 5/12 · | 11/6 · | 10/9 · | 10/12 · | 4/13 · | 9/16 · | 10/8 · | 10/13 · | 12/12 · | 14/1 · | 8/1 · | 14/3 · | 11/12 · | 8/7 · | 9/0 W | 8/11 · | 10/11 · | 13/5 · | 11/12 · | 14/5 · | 7/9 · | 13/6 · | 12/10 · | 11/8 · |
| Eyes | 1/10 · | 1/9 · | 0/9 L | 1/6 · | 1/9 · | 0/9 L | 0/13 L | 1/8 · | 0/10 L | 4/4 · | 4/4 · | 4/4 · | 0/12 L | 1/8 · | 0/9 L | 0/14 L | 0/15 L | 0/18 L | 0/10 L | 0/16 L | 1/12 · | 3/0 W | 0/3 L | 4/1 · | 1/12 · | 0/9 L | 0/2 L | 0/11 L | 0/11 L | 3/6 · | 1/12 · | 4/4 · | 0/9 L | 2/7 · | 2/10 · | 1/8 · |
| Sekhmet | 1/6 · | 1/4 · | 0/3 L | 1/4 · | 1/5 · | 0/5 L | 0/7 L | 1/4 · | 0/5 L | 4/2 · | 4/2 · | 4/2 · | 0/6 L | 1/2 · | 0/6 L | 0/9 L | 0/10 L | 0/13 L | 0/5 L | 0/10 L | 1/8 · | 3/0 W | 0/0 X | 4/0 W | 1/7 · | 0/4 L | 0/0 X | 0/9 L | 0/7 L | 3/2 · | 1/8 · | 4/2 · | 0/5 L | 2/3 · | 2/6 · | 1/5 · |
| Anhur | 3/10 · | 3/10 · | 0/9 L | 3/8 · | 3/11 · | 2/9 · | 0/13 L | 3/10 · | 1/11 · | 4/8 · | 4/8 · | 4/8 · | 0/12 L | 3/8 · | 2/9 · | 2/15 · | 0/16 L | 0/19 L | 2/11 · | 2/16 · | 3/14 · | 4/4 · | 0/4 L | 4/4 · | 3/13 · | 0/10 L | 1/3 · | 0/11 L | 2/11 · | 4/8 · | 3/14 · | 4/8 · | 0/9 L | 4/9 · | 4/12 · | 3/8 · |
| Raijin | 11/10 · | 10/8 · | 9/9 · | 10/5 · | 11/8 · | 10/6 · | 5/10 · | 12/7 · | 10/8 · | 13/5 · | 13/5 · | 13/5 · | 5/11 · | 10/5 · | 9/9 · | 9/12 · | 4/13 · | 9/16 · | 9/8 · | 9/13 · | 12/11 · | 13/1 · | 7/1 · | 13/3 · | 11/11 · | 7/7 · | 8/0 W | 8/8 · | 9/11 · | 12/5 · | 10/11 · | 13/5 · | 7/9 · | 13/6 · | 11/9 · | 10/8 · |
| Hades | 7/7 · | 7/4 · | 3/3 · | 7/2 · | 7/5 · | 6/3 · | 2/7 · | 7/4 · | 5/5 · | 10/2 · | 10/2 · | 10/2 · | 1/7 · | 7/2 · | 6/6 · | 6/9 · | 0/10 L | 3/13 · | 6/5 · | 6/10 · | 7/8 · | 9/0 W | 4/0 W | 10/0 W | 7/7 · | 4/4 · | 5/0 W | 3/5 · | 6/7 · | 9/2 · | 7/8 · | 10/2 · | 3/5 · | 8/3 · | 8/6 · | 7/5 · |
| Suzaku | 0/6 L | 0/5 L | 0/4 L | 0/3 L | 0/6 L | 0/4 L | 0/8 L | 0/5 L | 0/6 L | 3/3 · | 3/3 · | 3/3 · | 0/7 L | 0/3 L | 0/7 L | 0/10 L | 0/11 L | 0/14 L | 0/6 L | 0/11 L | 0/9 L | 2/0 W | 0/0 X | 3/1 · | 0/8 L | 0/5 L | 0/0 X | 0/6 L | 0/11 L | 2/3 · | 0/9 L | 3/3 · | 0/6 L | 1/4 · | 1/7 · | 0/6 L |
| Qinglong | 11/8 · | 11/5 · | 9/4 · | 11/1 · | 11/5 · | 11/3 · | 7/7 · | 11/4 · | 10/4 · | 11/1 · | 11/1 · | 11/1 · | 2/8 · | 11/2 · | 11/4 · | 11/8 · | 5/9 · | 9/12 · | 11/4 · | 11/9 · | 11/8 · | 11/0 W | 9/0 W | 11/0 W | 8/8 · | 5/3 · | 6/0 W | 4/4 · | 11/5 · | 11/1 · | 11/8 · | 11/1 · | 4/4 · | 9/2 · | 11/6 · | 11/1 · |
| Baihu | 11/9 · | 11/6 · | 11/5 · | 11/6 · | 11/7 · | 11/7 · | 5/9 · | 11/6 · | 11/7 · | 11/4 · | 11/4 · | 11/4 · | 2/9 · | 11/4 · | 11/8 · | 11/11 · | 3/12 · | 11/15 · | 11/7 · | 11/12 · | 11/10 · | 11/0 W | 7/0 W | 11/2 · | 11/9 · | 7/6 · | 11/0 W | 5/11 · | 11/11 · | 11/4 · | 11/10 · | 11/4 · | 4/7 · | 11/5 · | 11/8 · | 11/7 · |
| Pandora | 5/10 · | 5/9 · | 2/9 · | 5/8 · | 5/10 · | 4/9 · | 0/12 L | 5/9 · | 3/10 · | 8/7 · | 8/7 · | 8/7 · | 0/11 L | 5/7 · | 4/9 · | 4/14 · | 0/15 L | 2/18 · | 4/10 · | 4/15 · | 5/13 · | 8/3 · | 2/3 · | 8/4 · | 5/12 · | 2/9 · | 3/2 · | 1/11 · | 4/11 · | 7/7 · | 5/13 · | 8/7 · | 1/9 · | 6/8 · | 6/11 · | 5/8 · |
| Excalibu | 11/3 · | 11/3 · | 9/2 · | 11/3 · | 11/4 · | 10/4 · | 6/6 · | 12/3 · | 10/4 · | 14/1 · | 14/1 · | 14/1 · | 5/5 · | 11/1 · | 10/5 · | 10/8 · | 4/9 · | 9/12 · | 10/4 · | 10/9 · | 12/7 · | 14/0 W | 8/0 W | 14/0 W | 11/6 · | 8/3 · | 9/0 W | 8/8 · | 10/6 · | 13/1 · | 11/7 · | 14/1 · | 7/4 · | 13/2 · | 12/5 · | 11/4 · |
| Longinus | 8/3 · | 8/3 · | 8/2 · | 8/1 · | 8/4 · | 8/2 · | 8/6 · | 8/3 · | 8/4 · | 8/1 · | 8/1 · | 8/1 · | 8/5 · | 8/1 · | 8/5 · | 8/8 · | 8/9 · | 8/12 · | 8/4 · | 8/9 · | 8/7 · | 8/0 W | 8/0 W | 8/0 W | 8/6 · | 8/3 · | 8/0 W | 8/4 · | 8/6 · | 8/1 · | 8/7 · | 8/1 · | 8/4 · | 8/2 · | 8/5 · | 8/4 · |
| Thor | 9/7 · | 8/4 · | 7/3 · | 8/1 · | 9/4 · | 8/2 · | 3/6 · | 9/3 · | 8/4 · | 9/1 · | 9/1 · | 9/1 · | 1/7 · | 8/1 · | 7/3 · | 7/8 · | 2/9 · | 7/12 · | 7/4 · | 7/9 · | 9/7 · | 9/0 W | 5/0 W | 9/0 W | 9/7 · | 5/3 · | 6/0 W | 4/4 · | 7/4 · | 9/1 · | 8/7 · | 9/1 · | 3/3 · | 9/2 · | 9/5 · | 8/1 · |
| Artemis | 6/10 · | 6/10 · | 3/9 · | 6/6 · | 6/10 · | 5/8 · | 1/12 · | 6/9 · | 4/9 · | 9/6 · | 9/6 · | 9/6 · | 0/12 L | 6/7 · | 5/9 · | 5/13 · | 0/14 L | 3/17 · | 5/9 · | 5/14 · | 6/13 · | 9/2 · | 3/2 · | 9/4 · | 6/13 · | 3/8 · | 4/1 · | 2/9 · | 5/11 · | 8/6 · | 6/13 · | 9/6 · | 2/9 · | 7/7 · | 7/11 · | 6/8 · |
| Agni | 9/5 · | 9/5 · | 7/4 · | 9/5 · | 9/6 · | 8/6 · | 4/8 · | 10/5 · | 8/6 · | 12/3 · | 12/3 · | 12/3 · | 3/7 · | 9/3 · | 8/7 · | 8/10 · | 2/11 · | 7/14 · | 8/6 · | 8/11 · | 10/9 · | 12/0 W | 6/0 W | 12/1 · | 9/8 · | 6/5 · | 7/0 W | 6/10 · | 8/11 · | 11/3 · | 9/9 · | 12/3 · | 5/6 · | 11/4 · | 10/7 · | 9/6 · |
| Loki | 8/10 · | 8/7 · | 4/9 · | 8/7 · | 8/8 · | 7/8 · | 3/10 · | 8/7 · | 6/8 · | 8/5 · | 8/5 · | 8/5 · | 0/10 L | 8/5 · | 7/9 · | 7/12 · | 1/13 · | 4/16 · | 7/8 · | 7/13 · | 8/11 · | 8/1 · | 5/1 · | 8/3 · | 8/10 · | 5/7 · | 6/0 W | 1/11 · | 7/11 · | 8/5 · | 8/11 · | 8/5 · | 1/8 · | 8/6 · | 8/9 · | 8/8 · |

## Two-round exchange (row then column)

Hàng đánh trước, rồi cột đánh lại nếu cả hai còn sống. Ô `B then A` là transpose: xem ô (cột, hàng).

### Remaining HP after A→B exchange

Ô: `HP attacker / HP defender` sau combat. 0 = chết.

| Hàng = attacker | Zeus | Fenrir | Xuanwu | Sarama | Eirs | Huma | Garuda | Raijus | Simurgh | Tiamat | Houyi | Pashupat | Typhon | Skadi | Thoth | Rostam | Heimdall | Dhanvant | Hermes | Gungnirs | Yatagara | Eyes | Sekhmet | Anhur | Raijin | Hades | Suzaku | Qinglong | Baihu | Pandora | Excalibu | Longinus | Thor | Artemis | Agni | Loki |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zeus | 10/10 · | 2/6 · | 9/9 · | 10/4 · | 10/5 · | 10/5 · | 3/7 · | 10/4 · | 10/5 · | 6/5 · | 5/5 · | 3/5 · | 2/10 · | 6/2 · | 6/7 · | 4/9 · | 4/10 · | 9/13 · | 6/8 · | 5/10 · | 10/8 · | 10/0 W | 2/0 W | 10/0 W | 10/9 · | 4/4 · | 6/0 W | 6/8 · | 8/11 · | 9/5 · | 6/8 · | 10/5 · | 4/7 · | 10/3 · | 9/6 · | 10/5 · |
| Fenrir | 6/2 · | 2/2 · | 6/4 · | 4/2 · | 6/3 · | 4/3 · | 0/5 L | 7/2 · | 4/3 · | 5/3 · | 4/3 · | 3/3 · | 0/4 L | 0/0 X | 2/4 · | 4/7 · | 0/8 L | 5/11 · | 2/6 · | 0/8 L | 8/6 · | 10/0 W | 4/0 W | 10/0 W | 6/5 · | 0/2 L | 5/0 W | 0/7 L | 2/11 · | 8/3 · | 4/6 · | 7/3 · | 0/3 L | 10/1 · | 6/4 · | 4/3 · |
| Xuanwu | 9/9 · | 4/6 · | 5/5 · | 9/2 · | 9/6 · | 9/6 · | 0/8 L | 9/5 · | 9/2 · | 4/6 · | 3/6 · | 2/6 · | 0/9 L | 2/3 · | 1/6 · | 5/6 · | 0/14 L | 5/10 · | 1/9 · | 0/9 L | 9/9 · | 9/0 W | 0/0 X | 9/0 W | 9/9 · | 0/1 L | 0/0 X | 0/5 L | 1/6 · | 9/7 · | 9/9 · | 9/6 · | 0/5 L | 9/2 · | 9/7 · | 9/2 · |
| Sarama | 4/10 · | 2/4 · | 3/9 · | 4/4 · | 4/5 · | 2/5 · | 0/7 L | 4/4 · | 0/5 L | 3/5 · | 2/5 · | 1/5 · | 0/10 L | 0/2 L | 2/6 · | 4/9 · | 0/13 L | 1/13 · | 2/8 · | 0/10 L | 4/8 · | 8/0 W | 0/0 X | 8/0 W | 2/7 · | 0/4 L | 3/0 W | 0/8 L | 2/11 · | 7/5 · | 4/8 · | 5/5 · | 0/5 L | 4/3 · | 6/6 · | 4/5 · |
| Eirs | 5/10 · | 3/6 · | 6/9 · | 5/4 · | 5/5 · | 3/5 · | 0/7 L | 6/4 · | 3/5 · | 6/5 · | 5/5 · | 4/5 · | 0/10 L | 1/2 · | 3/7 · | 5/9 · | 0/10 L | 4/13 · | 3/8 · | 0/10 L | 7/8 · | 11/0 W | 0/0 X | 11/0 W | 5/9 · | 0/4 L | 6/0 W | 0/8 L | 3/11 · | 9/5 · | 5/8 · | 8/5 · | 0/7 L | 9/3 · | 7/6 · | 5/5 · |
| Huma | 5/10 · | 3/4 · | 6/9 · | 5/2 · | 5/3 · | 3/3 · | 0/5 L | 6/2 · | 3/3 · | 4/4 · | 3/4 · | 2/4 · | 0/10 L | 1/0 W | 3/6 · | 5/7 · | 0/8 L | 4/11 · | 3/7 · | 0/8 L | 7/6 · | 9/0 W | 5/0 W | 9/0 W | 3/7 · | 0/2 L | 4/0 W | 0/7 L | 3/7 · | 8/4 · | 5/6 · | 6/4 · | 0/5 L | 7/1 · | 7/4 · | 5/3 · |
| Garuda | 7/3 · | 5/0 W | 8/0 W | 7/0 W | 7/0 W | 5/0 W | 0/0 X | 8/0 W | 5/0 W | 8/3 · | 7/3 · | 6/3 · | 0/1 L | 3/0 W | 5/0 W | 7/2 · | 1/3 · | 6/6 · | 5/6 · | 2/3 · | 9/1 · | 13/0 W | 7/0 W | 13/0 W | 7/0 W | 1/0 W | 8/0 W | 1/2 · | 5/3 · | 11/3 · | 7/1 · | 10/3 · | 0/0 X | 11/0 W | 9/0 W | 7/0 W |
| Raijus | 4/10 · | 2/7 · | 5/9 · | 4/4 · | 4/6 · | 2/6 · | 0/8 L | 5/5 · | 2/5 · | 5/5 · | 4/5 · | 3/5 · | 0/11 L | 0/3 L | 2/7 · | 4/9 · | 0/13 L | 3/13 · | 2/8 · | 0/10 L | 6/9 · | 10/0 W | 0/0 X | 10/0 W | 4/10 · | 0/4 L | 5/0 W | 0/8 L | 2/11 · | 8/5 · | 4/9 · | 7/5 · | 0/7 L | 8/3 · | 6/7 · | 4/5 · |
| Simurgh | 5/10 · | 3/4 · | 2/9 · | 5/0 W | 5/3 · | 3/3 · | 0/5 L | 5/2 · | 1/1 · | 6/3 · | 5/3 · | 4/3 · | 0/8 L | 1/0 W | 3/6 · | 5/5 · | 0/6 L | 0/9 L | 3/6 · | 0/6 L | 5/6 · | 10/0 W | 5/0 W | 11/0 W | 5/7 · | 0/0 X | 6/0 W | 0/5 L | 3/7 · | 9/3 · | 5/6 · | 8/3 · | 0/5 L | 7/0 W | 7/4 · | 5/1 · |
| Tiamat | 5/6 · | 3/5 · | 6/4 · | 5/3 · | 5/6 · | 4/4 · | 3/8 · | 5/5 · | 3/6 · | 3/3 · | 2/3 · | 1/3 · | 1/7 · | 1/3 · | 4/7 · | 6/10 · | 6/11 · | 4/14 · | 4/6 · | 1/11 · | 5/9 · | 8/0 W | 8/0 W | 8/1 · | 5/8 · | 2/5 · | 8/0 W | 1/6 · | 4/11 · | 7/3 · | 5/9 · | 5/3 · | 1/6 · | 6/4 · | 6/7 · | 5/6 · |
| Houyi | 5/5 · | 3/4 · | 6/3 · | 5/2 · | 5/5 · | 4/3 · | 3/7 · | 5/4 · | 3/5 · | 3/2 · | 2/2 · | 1/2 · | 1/6 · | 1/2 · | 4/6 · | 6/9 · | 6/10 · | 4/13 · | 4/5 · | 1/10 · | 5/8 · | 8/0 W | 8/0 W | 8/0 W | 5/7 · | 2/4 · | 8/0 W | 1/5 · | 4/7 · | 7/2 · | 5/8 · | 5/2 · | 1/5 · | 6/3 · | 6/6 · | 5/5 · |
| Pashupat | 5/3 · | 3/3 · | 6/2 · | 5/1 · | 5/4 · | 4/2 · | 3/6 · | 5/3 · | 3/4 · | 3/1 · | 2/1 · | 1/1 · | 1/5 · | 1/1 · | 4/5 · | 6/8 · | 6/9 · | 4/12 · | 4/4 · | 1/9 · | 5/7 · | 8/0 W | 8/0 W | 8/0 W | 5/6 · | 2/3 · | 8/0 W | 1/4 · | 4/6 · | 7/1 · | 5/7 · | 5/1 · | 1/4 · | 6/2 · | 6/5 · | 5/4 · |
| Typhon | 10/2 · | 4/0 W | 9/0 W | 8/0 W | 10/0 W | 8/0 W | 1/0 W | 11/0 W | 8/0 W | 7/1 · | 6/1 · | 5/1 · | 0/0 X | 4/0 W | 4/0 W | 6/0 W | 4/0 W | 9/3 · | 4/0 W | 3/0 W | 12/0 W | 12/0 W | 6/0 W | 12/0 W | 10/0 W | 2/0 W | 7/0 W | 4/0 W | 6/0 W | 10/0 W | 6/0 W | 10/1 · | 2/0 W | 12/0 W | 9/0 W | 8/0 W |
| Skadi | 2/6 · | 0/0 X | 3/2 · | 2/0 W | 2/1 · | 0/1 L | 0/6 L | 3/0 W | 0/1 L | 3/1 · | 2/1 · | 1/1 · | 0/6 L | 0/0 X | 0/2 L | 2/5 · | 0/9 L | 1/9 · | 0/4 L | 0/6 L | 4/4 · | 8/0 W | 2/0 W | 8/0 W | 2/3 · | 0/0 X | 3/0 W | 0/5 L | 0/6 L | 6/1 · | 2/4 · | 5/1 · | 0/1 L | 6/0 W | 4/2 · | 2/1 · |
| Thoth | 7/6 · | 4/2 · | 8/1 · | 6/2 · | 7/3 · | 6/3 · | 0/5 L | 7/2 · | 6/3 · | 7/4 · | 6/4 · | 5/4 · | 0/4 L | 2/0 W | 4/4 · | 6/7 · | 2/8 · | 7/11 · | 4/7 · | 1/8 · | 8/6 · | 9/0 W | 6/0 W | 9/0 W | 7/5 · | 0/2 L | 7/0 W | 0/7 L | 4/7 · | 9/4 · | 6/6 · | 9/4 · | 0/3 L | 9/1 · | 8/4 · | 6/3 · |
| Rostam | 9/4 · | 7/4 · | 6/5 · | 9/4 · | 9/5 · | 7/5 · | 2/7 · | 9/4 · | 5/5 · | 10/6 · | 9/6 · | 8/6 · | 0/6 L | 5/2 · | 7/6 · | 9/9 · | 3/10 · | 4/13 · | 7/9 · | 4/10 · | 9/8 · | 13/0 W | 3/0 W | 15/0 W | 9/7 · | 3/4 · | 5/0 W | 1/7 · | 7/7 · | 13/6 · | 9/8 · | 12/6 · | 1/5 · | 11/3 · | 11/6 · | 9/5 · |
| Heimdall | 10/4 · | 8/0 W | 7/0 W | 10/0 W | 10/0 W | 8/0 W | 3/1 · | 10/0 W | 6/0 W | 11/6 · | 10/6 · | 9/6 · | 0/4 L | 6/0 W | 8/1 · | 10/3 · | 4/4 · | 5/7 · | 8/9 · | 5/4 · | 10/2 · | 14/0 W | 4/0 W | 16/0 W | 10/3 · | 4/0 W | 6/0 W | 2/1 · | 8/1 · | 14/6 · | 10/2 · | 13/6 · | 2/0 W | 12/0 W | 12/0 W | 10/0 W |
| Dhanvant | 13/9 · | 11/5 · | 10/5 · | 13/1 · | 13/4 · | 11/4 · | 6/6 · | 13/3 · | 9/0 W | 14/4 · | 13/4 · | 12/4 · | 3/9 · | 9/1 · | 11/5 · | 13/4 · | 7/5 · | 8/8 · | 11/7 · | 8/7 · | 13/7 · | 18/0 W | 13/0 W | 19/0 W | 13/8 · | 7/0 W | 14/0 W | 5/5 · | 11/6 · | 17/5 · | 13/7 · | 16/4 · | 5/5 · | 15/0 W | 15/5 · | 13/0 W |
| Hermes | 5/6 · | 3/2 · | 2/1 · | 5/2 · | 5/3 · | 3/3 · | 0/5 L | 5/2 · | 1/3 · | 6/4 · | 5/4 · | 4/4 · | 0/4 L | 1/0 W | 3/4 · | 5/7 · | 0/8 L | 0/11 L | 3/7 · | 0/8 L | 5/6 · | 10/0 W | 5/0 W | 11/0 W | 5/5 · | 0/2 L | 6/0 W | 0/7 L | 3/7 · | 9/4 · | 5/6 · | 8/4 · | 0/3 L | 7/1 · | 7/4 · | 5/3 · |
| Gungnirs | 10/3 · | 8/0 W | 9/0 W | 10/0 W | 10/0 W | 8/0 W | 3/1 · | 10/0 W | 6/0 W | 11/1 · | 10/1 · | 9/1 · | 0/1 L | 6/0 W | 8/0 W | 10/3 · | 4/4 · | 7/7 · | 8/4 · | 5/4 · | 10/2 · | 16/0 W | 10/0 W | 16/0 W | 10/1 · | 4/0 W | 11/0 W | 2/3 · | 8/1 · | 14/1 · | 10/2 · | 13/1 · | 2/0 W | 12/0 W | 12/0 W | 10/0 W |
| Yatagara | 8/10 · | 6/8 · | 9/9 · | 8/4 · | 8/7 · | 6/7 · | 1/9 · | 9/6 · | 6/5 · | 9/5 · | 8/5 · | 7/5 · | 0/12 L | 4/4 · | 6/8 · | 8/9 · | 2/10 · | 7/13 · | 6/5 · | 3/10 · | 10/10 · | 14/0 W | 2/0 W | 14/0 W | 8/11 · | 2/4 · | 9/0 W | 2/8 · | 6/11 · | 12/2 · | 8/10 · | 11/5 · | 0/8 L | 12/3 · | 10/8 · | 8/5 · |
| Eyes | 0/10 L | 0/9 L | 0/9 L | 0/6 L | 0/9 L | 0/9 L | 0/13 L | 0/8 L | 0/10 L | 0/4 L | 0/4 L | 0/4 L | 0/12 L | 0/8 L | 0/9 L | 0/14 L | 0/15 L | 0/18 L | 0/10 L | 0/16 L | 0/12 L | 3/0 W | 0/3 L | 4/1 · | 0/12 L | 0/9 L | 0/2 L | 0/11 L | 0/11 L | 2/6 · | 0/12 L | 1/4 · | 0/9 L | 0/7 L | 0/10 L | 0/8 L |
| Sekhmet | 0/2 L | 0/0 X | 0/3 L | 0/0 X | 0/0 X | 0/5 L | 0/7 L | 0/0 X | 0/5 L | 0/2 L | 0/2 L | 0/2 L | 0/6 L | 0/0 X | 0/6 L | 0/9 L | 0/10 L | 0/13 L | 0/5 L | 0/10 L | 0/2 L | 3/0 W | 0/0 X | 4/0 W | 0/1 L | 0/4 L | 0/0 X | 0/9 L | 0/7 L | 2/0 W | 0/2 L | 1/2 · | 0/5 L | 0/0 X | 0/0 X | 0/0 X |
| Anhur | 0/10 L | 0/10 L | 0/9 L | 0/8 L | 0/11 L | 0/9 L | 0/13 L | 0/10 L | 0/11 L | 1/8 · | 0/8 L | 0/8 L | 0/12 L | 0/8 L | 0/9 L | 0/15 L | 0/16 L | 0/19 L | 0/11 L | 0/16 L | 0/14 L | 1/4 · | 0/4 L | 4/4 · | 0/13 L | 0/10 L | 0/3 L | 0/11 L | 0/11 L | 4/8 · | 0/14 L | 3/8 · | 0/9 L | 2/9 · | 2/12 · | 0/8 L |
| Raijin | 9/10 · | 5/6 · | 9/9 · | 7/2 · | 9/5 · | 7/3 · | 0/7 L | 10/4 · | 7/5 · | 8/5 · | 7/5 · | 6/5 · | 0/10 L | 3/2 · | 5/7 · | 7/9 · | 3/10 · | 8/13 · | 5/8 · | 2/10 · | 11/8 · | 13/0 W | 1/0 W | 13/0 W | 9/9 · | 1/4 · | 8/0 W | 3/5 · | 5/11 · | 11/5 · | 7/8 · | 10/5 · | 1/7 · | 13/3 · | 9/6 · | 7/5 · |
| Hades | 4/4 · | 2/0 W | 1/0 W | 4/0 W | 4/0 W | 2/0 W | 0/1 L | 4/0 W | 0/0 X | 5/2 · | 4/2 · | 3/2 · | 0/2 L | 0/0 X | 2/0 W | 4/3 · | 0/10 L | 0/7 L | 2/5 · | 0/4 L | 4/2 · | 9/0 W | 4/0 W | 10/0 W | 4/1 · | 0/0 X | 5/0 W | 0/0 X | 2/1 · | 8/2 · | 4/2 · | 7/2 · | 0/0 X | 6/0 W | 6/0 W | 4/0 W |
| Suzaku | 0/6 L | 0/5 L | 0/4 L | 0/3 L | 0/6 L | 0/4 L | 0/8 L | 0/5 L | 0/6 L | 0/3 L | 0/3 L | 0/3 L | 0/7 L | 0/3 L | 0/7 L | 0/10 L | 0/11 L | 0/14 L | 0/6 L | 0/11 L | 0/9 L | 2/0 W | 0/0 X | 3/0 W | 0/8 L | 0/5 L | 0/0 X | 0/6 L | 0/11 L | 1/3 · | 0/9 L | 0/3 L | 0/6 L | 0/0 X | 0/2 L | 0/6 L |
| Qinglong | 8/6 · | 6/0 W | 8/0 W | 8/0 W | 8/0 W | 7/0 W | 2/1 · | 8/0 W | 5/0 W | 6/1 · | 5/1 · | 4/1 · | 0/4 L | 4/0 W | 7/0 W | 9/1 · | 3/2 · | 6/5 · | 7/0 W | 4/2 · | 8/2 · | 11/0 W | 9/0 W | 11/0 W | 5/3 · | 0/0 X | 6/0 W | 0/0 X | 7/0 W | 10/0 W | 8/2 · | 8/1 · | 0/0 X | 7/0 W | 9/0 W | 8/0 W |
| Baihu | 11/6 · | 6/1 · | 11/0 W | 11/1 · | 11/2 · | 7/2 · | 0/4 L | 11/1 · | 7/2 · | 11/4 · | 7/4 · | 6/4 · | 0/4 L | 4/0 W | 7/3 · | 11/6 · | 3/7 · | 11/10 · | 7/7 · | 4/7 · | 11/5 · | 11/0 W | 7/0 W | 11/0 W | 11/4 · | 1/1 · | 11/0 W | 0/6 L | 7/6 · | 11/4 · | 11/5 · | 11/4 · | 0/2 L | 11/0 W | 11/3 · | 11/2 · |
| Pandora | 2/9 · | 0/8 L | 1/9 · | 2/7 · | 2/9 · | 0/8 L | 0/12 L | 2/8 · | 0/9 L | 3/7 · | 2/7 · | 1/7 · | 0/11 L | 0/6 L | 0/9 L | 2/13 · | 0/15 L | 0/17 L | 0/10 L | 0/14 L | 2/12 · | 6/2 · | 0/2 L | 8/4 · | 2/11 · | 0/8 L | 0/1 L | 0/10 L | 0/11 L | 6/7 · | 2/12 · | 5/7 · | 0/9 L | 4/7 · | 4/10 · | 2/8 · |
| Excalibu | 8/0 W | 6/0 W | 9/0 W | 8/0 W | 8/0 W | 6/0 W | 1/2 · | 9/0 W | 6/0 W | 9/1 · | 8/1 · | 7/1 · | 0/1 L | 4/0 W | 6/1 · | 8/4 · | 2/5 · | 7/8 · | 6/4 · | 3/5 · | 10/3 · | 14/0 W | 8/0 W | 14/0 W | 8/2 · | 2/0 W | 9/0 W | 2/4 · | 6/2 · | 12/1 · | 8/3 · | 11/1 · | 0/0 X | 12/0 W | 10/1 · | 8/0 W |
| Longinus | 5/3 · | 3/3 · | 6/2 · | 5/1 · | 5/4 · | 4/2 · | 3/6 · | 5/3 · | 3/4 · | 3/1 · | 2/1 · | 1/1 · | 1/5 · | 1/1 · | 4/5 · | 6/8 · | 6/9 · | 4/12 · | 4/4 · | 1/9 · | 5/7 · | 8/0 W | 8/0 W | 8/0 W | 5/6 · | 2/3 · | 8/0 W | 1/4 · | 4/6 · | 7/1 · | 5/7 · | 5/1 · | 1/4 · | 6/2 · | 6/5 · | 5/4 · |
| Thor | 7/4 · | 3/0 W | 7/0 W | 5/0 W | 7/0 W | 5/0 W | 0/0 X | 7/0 W | 5/0 W | 6/1 · | 5/1 · | 4/1 · | 0/2 L | 1/0 W | 3/0 W | 5/1 · | 1/2 · | 6/5 · | 3/0 W | 0/2 L | 8/0 W | 9/0 W | 5/0 W | 9/0 W | 7/1 · | 0/0 X | 6/0 W | 0/0 X | 3/0 W | 9/0 W | 5/0 W | 8/1 · | 0/0 X | 9/0 W | 7/0 W | 5/0 W |
| Artemis | 3/10 · | 1/10 · | 2/9 · | 3/4 · | 3/9 · | 1/7 · | 0/11 L | 3/8 · | 0/7 L | 4/6 · | 3/6 · | 2/6 · | 0/12 L | 0/6 L | 1/9 · | 3/11 · | 0/14 L | 0/15 L | 1/9 · | 0/12 L | 3/12 · | 9/0 W | 0/0 X | 9/2 · | 3/13 · | 0/6 L | 0/0 X | 0/7 L | 1/11 · | 7/6 · | 3/12 · | 6/6 · | 0/9 L | 5/5 · | 5/10 · | 3/7 · |
| Agni | 6/4 · | 4/3 · | 7/4 · | 6/3 · | 6/4 · | 4/4 · | 0/6 L | 7/3 · | 4/4 · | 7/3 · | 6/3 · | 5/3 · | 0/5 L | 2/1 · | 4/5 · | 6/8 · | 0/9 L | 5/12 · | 4/6 · | 1/9 · | 8/7 · | 12/0 W | 6/0 W | 12/0 W | 6/6 · | 0/3 L | 7/0 W | 0/8 L | 4/11 · | 10/3 · | 6/7 · | 9/3 · | 0/4 L | 10/2 · | 8/5 · | 6/4 · |
| Loki | 5/10 · | 3/4 · | 2/9 · | 5/4 · | 5/5 · | 3/5 · | 0/7 L | 5/4 · | 1/5 · | 6/5 · | 5/5 · | 4/5 · | 0/10 L | 1/2 · | 3/6 · | 5/9 · | 0/10 L | 0/13 L | 3/8 · | 0/10 L | 5/8 · | 8/0 W | 0/0 X | 8/0 W | 5/7 · | 0/4 L | 6/0 W | 0/8 L | 3/11 · | 8/5 · | 5/8 · | 8/5 · | 0/5 L | 7/3 · | 7/6 · | 5/5 · |

## Scoreboard (one engagement, excluding mirror)

| Unit | As attacker W/L/X/· | As defender W/L/X/· | Avg HP left (atk) | Avg HP left (def) |
| --- | --- | --- | ---: | ---: |
| Gungnir's Tip | 4/0/0/31 | 3/0/0/32 | 12.3 | 11.9 |
| Excalibur | 4/0/0/31 | 1/0/0/34 | 10.5 | 10.0 |
| Qinglong | 4/0/0/31 | 4/0/0/31 | 9.6 | 9.0 |
| Typhon Disruptor | 4/0/0/31 | 10/0/0/25 | 9.6 | 8.9 |
| Houyi Quiver | 4/0/0/31 | 0/0/0/35 | 8.0 | 3.7 |
| Pashupata Annihilator | 4/0/0/31 | 0/0/0/35 | 8.0 | 3.7 |
| Longinus | 4/0/0/31 | 0/0/0/35 | 8.0 | 3.7 |
| Thor | 4/0/0/31 | 4/0/0/31 | 7.3 | 6.9 |
| Hades Stealthray | 4/1/0/30 | 4/0/0/31 | 6.3 | 5.7 |
| Skadi Hunter | 4/3/0/28 | 1/0/0/34 | 4.5 | 4.1 |
| Dhanvantari Lifeweaver | 3/0/0/32 | 4/0/0/31 | 15.3 | 14.7 |
| Baihu | 3/0/0/32 | 3/0/0/32 | 9.7 | 9.4 |
| Garuda Talon | 3/0/0/32 | 6/0/0/29 | 9.6 | 9.0 |
| Agni | 3/0/0/32 | 0/0/0/35 | 8.4 | 7.9 |
| Tiamat Echo | 3/0/0/32 | 0/0/0/35 | 8.0 | 3.6 |
| Thoth Oracler | 3/0/0/32 | 3/0/0/32 | 7.7 | 7.3 |
| Simurgh Skylord | 3/0/0/32 | 3/0/0/32 | 7.2 | 6.7 |
| Hermes Strider | 3/0/0/32 | 3/0/0/32 | 7.2 | 6.7 |
| Fenrir Vanguard | 3/0/0/32 | 1/0/0/34 | 6.9 | 6.3 |
| Huma Enforcer | 3/1/0/31 | 3/0/0/32 | 6.7 | 6.1 |
| Sekhmet Kamikaze | 2/15/1/17 | 2/20/1/12 | 1.1 | 0.7 |
| Yatagarasu Pathfinder | 1/0/0/34 | 1/0/0/34 | 10.4 | 9.9 |
| Raijin Tempest | 1/0/0/34 | 1/0/0/34 | 9.8 | 9.3 |
| Zeus Devastator | 1/0/0/34 | 1/0/0/34 | 8.6 | 7.8 |
| Eir's Blessing | 1/0/0/34 | 1/0/0/34 | 7.5 | 6.9 |
| Raiju's Whisper | 1/1/0/33 | 1/0/0/34 | 6.4 | 5.9 |
| Loki | 1/1/0/33 | 1/0/0/34 | 6.3 | 6.1 |
| Sarama Warhound | 1/2/0/32 | 1/0/0/34 | 5.5 | 4.9 |
| Suzaku Komet | 1/25/1/8 | 1/27/1/6 | 0.6 | 0.3 |
| Heimdall Bastion | 0/0/0/35 | 11/0/0/24 | 12.4 | 11.6 |
| Rostam Breacher | 0/0/0/35 | 3/0/0/32 | 11.2 | 10.6 |
| Xuanwu Fortress | 0/1/0/34 | 4/0/0/31 | 6.8 | 5.9 |
| Artemis | 0/2/0/33 | 0/0/0/35 | 5.3 | 4.7 |
| Pandora | 0/3/0/32 | 0/0/0/35 | 4.3 | 3.6 |
| Anhur Warden | 0/9/0/26 | 0/11/0/24 | 2.2 | 1.7 |
| Eyes of Horus | 0/17/0/18 | 0/22/0/13 | 1.1 | 0.6 |

## First-strike flips

Pairs where who goes first changes whether someone dies:

- **Fenrir Vanguard** vs **Eyes of Horus**: Fenrir Vanguard trước → 10/0 (attacker); Eyes of Horus trước → 1/9 (both_live)
- **Fenrir Vanguard** vs **Sekhmet Kamikaze**: Fenrir Vanguard trước → 4/0 (attacker); Sekhmet Kamikaze trước → 1/4 (both_live)
- **Xuanwu Fortress** vs **Heimdall Bastion**: Xuanwu Fortress trước → 0/14 (defender); Heimdall Bastion trước → 9/9 (both_live)
- **Xuanwu Fortress** vs **Eyes of Horus**: Xuanwu Fortress trước → 9/2 (both_live); Eyes of Horus trước → 0/9 (defender)
- **Xuanwu Fortress** vs **Sekhmet Kamikaze**: Xuanwu Fortress trước → 3/2 (both_live); Sekhmet Kamikaze trước → 0/3 (defender)
- **Xuanwu Fortress** vs **Anhur Warden**: Xuanwu Fortress trước → 9/4 (both_live); Anhur Warden trước → 0/9 (defender)
- **Xuanwu Fortress** vs **Suzaku Komet**: Xuanwu Fortress trước → 4/1 (both_live); Suzaku Komet trước → 0/4 (defender)
- **Sarama Warhound** vs **Typhon Disruptor**: Sarama Warhound trước → 0/10 (defender); Typhon Disruptor trước → 10/1 (both_live)
- **Sarama Warhound** vs **Heimdall Bastion**: Sarama Warhound trước → 0/13 (defender); Heimdall Bastion trước → 13/8 (both_live)
- **Huma Enforcer** vs **Typhon Disruptor**: Huma Enforcer trước → 0/10 (defender); Typhon Disruptor trước → 10/2 (both_live)
- **Garuda Talon** vs **Skadi Hunter**: Garuda Talon trước → 10/3 (both_live); Skadi Hunter trước → 0/6 (defender)
- **Garuda Talon** vs **Anhur Warden**: Garuda Talon trước → 13/1 (both_live); Anhur Warden trước → 0/13 (defender)
- **Garuda Talon** vs **Pandora**: Garuda Talon trước → 12/3 (both_live); Pandora trước → 0/12 (defender)
- **Raiju's Whisper** vs **Heimdall Bastion**: Raiju's Whisper trước → 0/13 (defender); Heimdall Bastion trước → 13/8 (both_live)
- **Tiamat Echo** vs **Eyes of Horus**: Tiamat Echo trước → 8/0 (attacker); Eyes of Horus trước → 4/4 (both_live)
- **Tiamat Echo** vs **Sekhmet Kamikaze**: Tiamat Echo trước → 8/0 (attacker); Sekhmet Kamikaze trước → 4/2 (both_live)
- **Tiamat Echo** vs **Suzaku Komet**: Tiamat Echo trước → 8/0 (attacker); Suzaku Komet trước → 3/3 (both_live)
- **Houyi Quiver** vs **Eyes of Horus**: Houyi Quiver trước → 8/0 (attacker); Eyes of Horus trước → 4/4 (both_live)
- **Houyi Quiver** vs **Sekhmet Kamikaze**: Houyi Quiver trước → 8/0 (attacker); Sekhmet Kamikaze trước → 4/2 (both_live)
- **Houyi Quiver** vs **Anhur Warden**: Houyi Quiver trước → 8/0 (attacker); Anhur Warden trước → 4/8 (both_live)
- **Houyi Quiver** vs **Suzaku Komet**: Houyi Quiver trước → 8/0 (attacker); Suzaku Komet trước → 3/3 (both_live)
- **Pashupata Annihilator** vs **Eyes of Horus**: Pashupata Annihilator trước → 8/0 (attacker); Eyes of Horus trước → 4/4 (both_live)
- **Pashupata Annihilator** vs **Sekhmet Kamikaze**: Pashupata Annihilator trước → 8/0 (attacker); Sekhmet Kamikaze trước → 4/2 (both_live)
- **Pashupata Annihilator** vs **Anhur Warden**: Pashupata Annihilator trước → 8/0 (attacker); Anhur Warden trước → 4/8 (both_live)
- **Pashupata Annihilator** vs **Suzaku Komet**: Pashupata Annihilator trước → 8/0 (attacker); Suzaku Komet trước → 3/3 (both_live)
- **Typhon Disruptor** vs **Skadi Hunter**: Typhon Disruptor trước → 10/1 (both_live); Skadi Hunter trước → 0/6 (defender)
- **Typhon Disruptor** vs **Pandora**: Typhon Disruptor trước → 11/1 (both_live); Pandora trước → 0/11 (defender)
- **Typhon Disruptor** vs **Artemis**: Typhon Disruptor trước → 12/2 (both_live); Artemis trước → 0/12 (defender)
- **Typhon Disruptor** vs **Loki**: Typhon Disruptor trước → 10/1 (both_live); Loki trước → 0/10 (defender)
- **Skadi Hunter** vs **Heimdall Bastion**: Skadi Hunter trước → 0/9 (defender); Heimdall Bastion trước → 13/6 (both_live)
- **Skadi Hunter** vs **Eyes of Horus**: Skadi Hunter trước → 8/0 (attacker); Eyes of Horus trước → 1/8 (both_live)
- **Skadi Hunter** vs **Sekhmet Kamikaze**: Skadi Hunter trước → 2/0 (attacker); Sekhmet Kamikaze trước → 1/2 (both_live)
- **Skadi Hunter** vs **Anhur Warden**: Skadi Hunter trước → 8/0 (attacker); Anhur Warden trước → 3/8 (both_live)
- **Rostam Breacher** vs **Eyes of Horus**: Rostam Breacher trước → 14/2 (both_live); Eyes of Horus trước → 0/14 (defender)
- **Rostam Breacher** vs **Sekhmet Kamikaze**: Rostam Breacher trước → 9/2 (both_live); Sekhmet Kamikaze trước → 0/9 (defender)
- **Rostam Breacher** vs **Suzaku Komet**: Rostam Breacher trước → 10/1 (both_live); Suzaku Komet trước → 0/10 (defender)
- **Heimdall Bastion** vs **Eyes of Horus**: Heimdall Bastion trước → 15/2 (both_live); Eyes of Horus trước → 0/15 (defender)
- **Heimdall Bastion** vs **Sekhmet Kamikaze**: Heimdall Bastion trước → 10/2 (both_live); Sekhmet Kamikaze trước → 0/10 (defender)
- **Heimdall Bastion** vs **Anhur Warden**: Heimdall Bastion trước → 16/4 (both_live); Anhur Warden trước → 0/16 (defender)
- **Heimdall Bastion** vs **Hades Stealthray**: Heimdall Bastion trước → 10/8 (both_live); Hades Stealthray trước → 0/10 (defender)
- **Heimdall Bastion** vs **Suzaku Komet**: Heimdall Bastion trước → 11/1 (both_live); Suzaku Komet trước → 0/11 (defender)
- **Heimdall Bastion** vs **Pandora**: Heimdall Bastion trước → 15/6 (both_live); Pandora trước → 0/15 (defender)
- **Heimdall Bastion** vs **Artemis**: Heimdall Bastion trước → 14/7 (both_live); Artemis trước → 0/14 (defender)
- **Dhanvantari Lifeweaver** vs **Anhur Warden**: Dhanvantari Lifeweaver trước → 19/2 (both_live); Anhur Warden trước → 0/19 (defender)
- **Gungnir's Tip** vs **Anhur Warden**: Gungnir's Tip trước → 16/0 (attacker); Anhur Warden trước → 2/16 (both_live)
- **Eyes of Horus** vs **Excalibur**: Eyes of Horus trước → 1/12 (both_live); Excalibur trước → 14/0 (attacker)
- **Eyes of Horus** vs **Longinus**: Eyes of Horus trước → 4/4 (both_live); Longinus trước → 8/0 (attacker)
- **Eyes of Horus** vs **Agni**: Eyes of Horus trước → 2/10 (both_live); Agni trước → 12/0 (attacker)
- **Sekhmet Kamikaze** vs **Excalibur**: Sekhmet Kamikaze trước → 1/8 (both_live); Excalibur trước → 8/0 (attacker)
- **Sekhmet Kamikaze** vs **Longinus**: Sekhmet Kamikaze trước → 4/2 (both_live); Longinus trước → 8/0 (attacker)
- **Sekhmet Kamikaze** vs **Agni**: Sekhmet Kamikaze trước → 2/6 (both_live); Agni trước → 6/0 (attacker)
- **Anhur Warden** vs **Excalibur**: Anhur Warden trước → 3/14 (both_live); Excalibur trước → 14/0 (attacker)
- **Anhur Warden** vs **Longinus**: Anhur Warden trước → 4/8 (both_live); Longinus trước → 8/0 (attacker)
- **Suzaku Komet** vs **Longinus**: Suzaku Komet trước → 3/3 (both_live); Longinus trước → 8/0 (attacker)
- **Suzaku Komet** vs **Agni**: Suzaku Komet trước → 1/7 (both_live); Agni trước → 7/0 (attacker)

## Per-unit leftover HP (one engagement)

<details><summary>Zeus Devastator</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 10/10 |
| Fenrir Vanguard | 7/8 |
| Xuanwu Fortress | 9/9 |
| Sarama Warhound | 10/7 |
| Eir's Blessing | 10/8 |
| Huma Enforcer | 10/8 |
| Garuda Talon | 5/10 |
| Raiju's Whisper | 10/7 |
| Simurgh Skylord | 10/8 |
| Tiamat Echo | 10/5 |
| Houyi Quiver | 10/5 |
| Pashupata Annihilator | 10/5 |
| Typhon Disruptor | 5/11 |
| Skadi Hunter | 10/5 |
| Thoth Oracler | 8/9 |
| Rostam Breacher | 6/12 |
| Heimdall Bastion | 4/13 |
| Dhanvantari Lifeweaver | 9/16 |
| Hermes Strider | 8/8 |
| Gungnir's Tip | 9/13 |
| Yatagarasu Pathfinder | 10/11 |
| Eyes of Horus | 10/1 |
| Sekhmet Kamikaze | 6/1 |
| Anhur Warden | 10/3 |
| Raijin Tempest | 10/11 |
| Hades Stealthray | 7/7 |
| Suzaku Komet | 6/0 |
| Qinglong | 8/11 |
| Baihu | 9/11 |
| Pandora | 10/5 |
| Excalibur | 8/11 |
| Longinus | 10/5 |
| Thor | 7/9 |
| Artemis | 10/6 |
| Agni | 10/9 |
| Loki | 10/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/10 |
| Fenrir Vanguard | 8/5 |
| Xuanwu Fortress | 9/10 |
| Sarama Warhound | 7/10 |
| Eir's Blessing | 8/10 |
| Huma Enforcer | 8/10 |
| Garuda Talon | 10/8 |
| Raiju's Whisper | 7/10 |
| Simurgh Skylord | 8/10 |
| Tiamat Echo | 8/6 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/3 |
| Typhon Disruptor | 11/7 |
| Skadi Hunter | 5/6 |
| Thoth Oracler | 9/8 |
| Rostam Breacher | 12/8 |
| Heimdall Bastion | 13/10 |
| Dhanvantari Lifeweaver | 16/10 |
| Hermes Strider | 8/8 |
| Gungnir's Tip | 13/6 |
| Yatagarasu Pathfinder | 11/10 |
| Eyes of Horus | 1/10 |
| Sekhmet Kamikaze | 1/6 |
| Anhur Warden | 3/10 |
| Raijin Tempest | 11/10 |
| Hades Stealthray | 7/7 |
| Suzaku Komet | 0/6 |
| Qinglong | 11/8 |
| Baihu | 11/9 |
| Pandora | 5/10 |
| Excalibur | 11/3 |
| Longinus | 8/3 |
| Thor | 9/7 |
| Artemis | 6/10 |
| Agni | 9/5 |
| Loki | 8/10 |

</details>

<details><summary>Fenrir Vanguard</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/5 |
| Fenrir Vanguard | 7/5 |
| Xuanwu Fortress | 6/4 |
| Sarama Warhound | 7/5 |
| Eir's Blessing | 8/6 |
| Huma Enforcer | 7/6 |
| Garuda Talon | 2/8 |
| Raiju's Whisper | 9/5 |
| Simurgh Skylord | 7/6 |
| Tiamat Echo | 10/3 |
| Houyi Quiver | 10/3 |
| Pashupata Annihilator | 10/3 |
| Typhon Disruptor | 2/7 |
| Skadi Hunter | 7/3 |
| Thoth Oracler | 6/7 |
| Rostam Breacher | 6/10 |
| Heimdall Bastion | 1/11 |
| Dhanvantari Lifeweaver | 6/14 |
| Hermes Strider | 6/6 |
| Gungnir's Tip | 6/11 |
| Yatagarasu Pathfinder | 9/9 |
| Eyes of Horus | 10/0 |
| Sekhmet Kamikaze | 4/0 |
| Anhur Warden | 10/1 |
| Raijin Tempest | 8/8 |
| Hades Stealthray | 4/5 |
| Suzaku Komet | 5/0 |
| Qinglong | 5/10 |
| Baihu | 6/11 |
| Pandora | 9/3 |
| Excalibur | 7/9 |
| Longinus | 10/3 |
| Thor | 4/6 |
| Artemis | 10/4 |
| Agni | 8/7 |
| Loki | 7/6 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 7/8 |
| Fenrir Vanguard | 7/5 |
| Xuanwu Fortress | 9/10 |
| Sarama Warhound | 7/7 |
| Eir's Blessing | 8/8 |
| Huma Enforcer | 8/7 |
| Garuda Talon | 10/5 |
| Raiju's Whisper | 7/9 |
| Simurgh Skylord | 8/7 |
| Tiamat Echo | 8/5 |
| Houyi Quiver | 8/4 |
| Pashupata Annihilator | 8/3 |
| Typhon Disruptor | 9/4 |
| Skadi Hunter | 5/3 |
| Thoth Oracler | 9/6 |
| Rostam Breacher | 12/8 |
| Heimdall Bastion | 13/9 |
| Dhanvantari Lifeweaver | 16/9 |
| Hermes Strider | 8/6 |
| Gungnir's Tip | 13/3 |
| Yatagarasu Pathfinder | 11/9 |
| Eyes of Horus | 1/9 |
| Sekhmet Kamikaze | 1/4 |
| Anhur Warden | 3/10 |
| Raijin Tempest | 10/8 |
| Hades Stealthray | 7/4 |
| Suzaku Komet | 0/5 |
| Qinglong | 11/5 |
| Baihu | 11/6 |
| Pandora | 5/9 |
| Excalibur | 11/3 |
| Longinus | 8/3 |
| Thor | 8/4 |
| Artemis | 6/10 |
| Agni | 9/5 |
| Loki | 8/7 |

</details>

<details><summary>Xuanwu Fortress</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 9/10 |
| Fenrir Vanguard | 9/10 |
| Xuanwu Fortress | 5/9 |
| Sarama Warhound | 9/8 |
| Eir's Blessing | 9/11 |
| Huma Enforcer | 9/9 |
| Garuda Talon | 1/13 |
| Raiju's Whisper | 9/10 |
| Simurgh Skylord | 9/9 |
| Tiamat Echo | 9/6 |
| Houyi Quiver | 9/6 |
| Pashupata Annihilator | 9/6 |
| Typhon Disruptor | 1/12 |
| Skadi Hunter | 9/8 |
| Thoth Oracler | 5/9 |
| Rostam Breacher | 5/13 |
| Heimdall Bastion | 0/14 |
| Dhanvantari Lifeweaver | 5/17 |
| Hermes Strider | 5/9 |
| Gungnir's Tip | 5/15 |
| Yatagarasu Pathfinder | 9/14 |
| Eyes of Horus | 9/2 |
| Sekhmet Kamikaze | 3/2 |
| Anhur Warden | 9/4 |
| Raijin Tempest | 9/13 |
| Hades Stealthray | 3/8 |
| Suzaku Komet | 4/1 |
| Qinglong | 4/11 |
| Baihu | 5/11 |
| Pandora | 9/7 |
| Excalibur | 9/14 |
| Longinus | 9/6 |
| Thor | 3/9 |
| Artemis | 9/8 |
| Agni | 9/12 |
| Loki | 9/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 9/9 |
| Fenrir Vanguard | 6/4 |
| Xuanwu Fortress | 5/9 |
| Sarama Warhound | 4/9 |
| Eir's Blessing | 6/9 |
| Huma Enforcer | 6/9 |
| Garuda Talon | 8/4 |
| Raiju's Whisper | 5/9 |
| Simurgh Skylord | 4/9 |
| Tiamat Echo | 8/4 |
| Houyi Quiver | 8/3 |
| Pashupata Annihilator | 8/2 |
| Typhon Disruptor | 9/3 |
| Skadi Hunter | 3/2 |
| Thoth Oracler | 8/5 |
| Rostam Breacher | 8/9 |
| Heimdall Bastion | 9/9 |
| Dhanvantari Lifeweaver | 12/9 |
| Hermes Strider | 4/5 |
| Gungnir's Tip | 10/2 |
| Yatagarasu Pathfinder | 9/9 |
| Eyes of Horus | 0/9 |
| Sekhmet Kamikaze | 0/3 |
| Anhur Warden | 0/9 |
| Raijin Tempest | 9/9 |
| Hades Stealthray | 3/3 |
| Suzaku Komet | 0/4 |
| Qinglong | 9/4 |
| Baihu | 11/5 |
| Pandora | 2/9 |
| Excalibur | 9/2 |
| Longinus | 8/2 |
| Thor | 7/3 |
| Artemis | 3/9 |
| Agni | 7/4 |
| Loki | 4/9 |

</details>

<details><summary>Sarama Warhound</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 7/10 |
| Fenrir Vanguard | 7/7 |
| Xuanwu Fortress | 4/9 |
| Sarama Warhound | 7/7 |
| Eir's Blessing | 7/8 |
| Huma Enforcer | 6/8 |
| Garuda Talon | 2/10 |
| Raiju's Whisper | 7/7 |
| Simurgh Skylord | 5/8 |
| Tiamat Echo | 8/5 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/5 |
| Typhon Disruptor | 0/10 |
| Skadi Hunter | 7/5 |
| Thoth Oracler | 6/9 |
| Rostam Breacher | 6/12 |
| Heimdall Bastion | 0/13 |
| Dhanvantari Lifeweaver | 4/16 |
| Hermes Strider | 6/8 |
| Gungnir's Tip | 6/13 |
| Yatagarasu Pathfinder | 7/11 |
| Eyes of Horus | 8/1 |
| Sekhmet Kamikaze | 4/1 |
| Anhur Warden | 8/3 |
| Raijin Tempest | 5/10 |
| Hades Stealthray | 2/7 |
| Suzaku Komet | 3/0 |
| Qinglong | 1/11 |
| Baihu | 6/11 |
| Pandora | 8/5 |
| Excalibur | 7/11 |
| Longinus | 8/5 |
| Thor | 1/8 |
| Artemis | 6/6 |
| Agni | 8/9 |
| Loki | 7/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/7 |
| Fenrir Vanguard | 7/5 |
| Xuanwu Fortress | 9/8 |
| Sarama Warhound | 7/7 |
| Eir's Blessing | 8/7 |
| Huma Enforcer | 8/6 |
| Garuda Talon | 10/5 |
| Raiju's Whisper | 7/7 |
| Simurgh Skylord | 8/5 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 10/1 |
| Skadi Hunter | 5/3 |
| Thoth Oracler | 9/6 |
| Rostam Breacher | 12/8 |
| Heimdall Bastion | 13/8 |
| Dhanvantari Lifeweaver | 16/7 |
| Hermes Strider | 8/6 |
| Gungnir's Tip | 13/3 |
| Yatagarasu Pathfinder | 11/7 |
| Eyes of Horus | 1/6 |
| Sekhmet Kamikaze | 1/4 |
| Anhur Warden | 3/8 |
| Raijin Tempest | 10/5 |
| Hades Stealthray | 7/2 |
| Suzaku Komet | 0/3 |
| Qinglong | 11/1 |
| Baihu | 11/6 |
| Pandora | 5/8 |
| Excalibur | 11/3 |
| Longinus | 8/1 |
| Thor | 8/1 |
| Artemis | 6/6 |
| Agni | 9/5 |
| Loki | 8/7 |

</details>

<details><summary>Eir's Blessing</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/10 |
| Fenrir Vanguard | 8/8 |
| Xuanwu Fortress | 6/9 |
| Sarama Warhound | 8/7 |
| Eir's Blessing | 8/8 |
| Huma Enforcer | 7/8 |
| Garuda Talon | 3/10 |
| Raiju's Whisper | 9/7 |
| Simurgh Skylord | 7/8 |
| Tiamat Echo | 11/5 |
| Houyi Quiver | 11/5 |
| Pashupata Annihilator | 11/5 |
| Typhon Disruptor | 2/11 |
| Skadi Hunter | 8/5 |
| Thoth Oracler | 7/9 |
| Rostam Breacher | 7/12 |
| Heimdall Bastion | 1/13 |
| Dhanvantari Lifeweaver | 6/16 |
| Hermes Strider | 7/8 |
| Gungnir's Tip | 7/13 |
| Yatagarasu Pathfinder | 9/11 |
| Eyes of Horus | 11/1 |
| Sekhmet Kamikaze | 5/1 |
| Anhur Warden | 11/3 |
| Raijin Tempest | 8/11 |
| Hades Stealthray | 5/7 |
| Suzaku Komet | 6/0 |
| Qinglong | 5/11 |
| Baihu | 7/11 |
| Pandora | 10/5 |
| Excalibur | 8/11 |
| Longinus | 11/5 |
| Thor | 4/9 |
| Artemis | 10/6 |
| Agni | 9/9 |
| Loki | 8/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/8 |
| Fenrir Vanguard | 8/6 |
| Xuanwu Fortress | 9/11 |
| Sarama Warhound | 7/8 |
| Eir's Blessing | 8/8 |
| Huma Enforcer | 8/7 |
| Garuda Talon | 10/6 |
| Raiju's Whisper | 7/9 |
| Simurgh Skylord | 8/7 |
| Tiamat Echo | 8/6 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/4 |
| Typhon Disruptor | 11/4 |
| Skadi Hunter | 5/4 |
| Thoth Oracler | 9/7 |
| Rostam Breacher | 12/9 |
| Heimdall Bastion | 13/9 |
| Dhanvantari Lifeweaver | 16/9 |
| Hermes Strider | 8/7 |
| Gungnir's Tip | 13/4 |
| Yatagarasu Pathfinder | 11/9 |
| Eyes of Horus | 1/9 |
| Sekhmet Kamikaze | 1/5 |
| Anhur Warden | 3/11 |
| Raijin Tempest | 11/8 |
| Hades Stealthray | 7/5 |
| Suzaku Komet | 0/6 |
| Qinglong | 11/5 |
| Baihu | 11/7 |
| Pandora | 5/10 |
| Excalibur | 11/4 |
| Longinus | 8/4 |
| Thor | 9/4 |
| Artemis | 6/10 |
| Agni | 9/6 |
| Loki | 8/8 |

</details>

<details><summary>Huma Enforcer</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/10 |
| Fenrir Vanguard | 8/7 |
| Xuanwu Fortress | 6/9 |
| Sarama Warhound | 8/6 |
| Eir's Blessing | 8/7 |
| Huma Enforcer | 7/7 |
| Garuda Talon | 3/9 |
| Raiju's Whisper | 9/6 |
| Simurgh Skylord | 7/7 |
| Tiamat Echo | 9/4 |
| Houyi Quiver | 9/4 |
| Pashupata Annihilator | 9/4 |
| Typhon Disruptor | 0/10 |
| Skadi Hunter | 8/4 |
| Thoth Oracler | 7/9 |
| Rostam Breacher | 7/11 |
| Heimdall Bastion | 1/12 |
| Dhanvantari Lifeweaver | 6/15 |
| Hermes Strider | 7/7 |
| Gungnir's Tip | 7/12 |
| Yatagarasu Pathfinder | 9/10 |
| Eyes of Horus | 9/0 |
| Sekhmet Kamikaze | 5/0 |
| Anhur Warden | 9/2 |
| Raijin Tempest | 6/10 |
| Hades Stealthray | 3/6 |
| Suzaku Komet | 4/0 |
| Qinglong | 3/11 |
| Baihu | 7/11 |
| Pandora | 9/4 |
| Excalibur | 8/10 |
| Longinus | 9/4 |
| Thor | 2/8 |
| Artemis | 8/5 |
| Agni | 9/8 |
| Loki | 8/7 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/8 |
| Fenrir Vanguard | 7/6 |
| Xuanwu Fortress | 9/9 |
| Sarama Warhound | 6/8 |
| Eir's Blessing | 7/8 |
| Huma Enforcer | 7/7 |
| Garuda Talon | 9/6 |
| Raiju's Whisper | 6/9 |
| Simurgh Skylord | 7/7 |
| Tiamat Echo | 8/4 |
| Houyi Quiver | 8/3 |
| Pashupata Annihilator | 8/2 |
| Typhon Disruptor | 10/2 |
| Skadi Hunter | 4/4 |
| Thoth Oracler | 9/7 |
| Rostam Breacher | 11/9 |
| Heimdall Bastion | 12/9 |
| Dhanvantari Lifeweaver | 15/9 |
| Hermes Strider | 7/7 |
| Gungnir's Tip | 12/4 |
| Yatagarasu Pathfinder | 10/9 |
| Eyes of Horus | 0/9 |
| Sekhmet Kamikaze | 0/5 |
| Anhur Warden | 2/9 |
| Raijin Tempest | 10/6 |
| Hades Stealthray | 6/3 |
| Suzaku Komet | 0/4 |
| Qinglong | 11/3 |
| Baihu | 11/7 |
| Pandora | 4/9 |
| Excalibur | 10/4 |
| Longinus | 8/2 |
| Thor | 8/2 |
| Artemis | 5/8 |
| Agni | 8/6 |
| Loki | 7/8 |

</details>

<details><summary>Garuda Talon</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 10/8 |
| Fenrir Vanguard | 10/5 |
| Xuanwu Fortress | 8/4 |
| Sarama Warhound | 10/5 |
| Eir's Blessing | 10/6 |
| Huma Enforcer | 9/6 |
| Garuda Talon | 5/8 |
| Raiju's Whisper | 11/5 |
| Simurgh Skylord | 9/6 |
| Tiamat Echo | 13/3 |
| Houyi Quiver | 13/3 |
| Pashupata Annihilator | 13/3 |
| Typhon Disruptor | 4/8 |
| Skadi Hunter | 10/3 |
| Thoth Oracler | 9/7 |
| Rostam Breacher | 9/10 |
| Heimdall Bastion | 3/11 |
| Dhanvantari Lifeweaver | 8/14 |
| Hermes Strider | 9/6 |
| Gungnir's Tip | 9/11 |
| Yatagarasu Pathfinder | 11/9 |
| Eyes of Horus | 13/0 |
| Sekhmet Kamikaze | 7/0 |
| Anhur Warden | 13/1 |
| Raijin Tempest | 10/8 |
| Hades Stealthray | 7/5 |
| Suzaku Komet | 8/0 |
| Qinglong | 7/10 |
| Baihu | 9/11 |
| Pandora | 12/3 |
| Excalibur | 10/9 |
| Longinus | 13/3 |
| Thor | 6/6 |
| Artemis | 12/4 |
| Agni | 11/7 |
| Loki | 10/6 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 5/10 |
| Fenrir Vanguard | 2/8 |
| Xuanwu Fortress | 1/13 |
| Sarama Warhound | 2/10 |
| Eir's Blessing | 3/10 |
| Huma Enforcer | 3/9 |
| Garuda Talon | 5/8 |
| Raiju's Whisper | 2/11 |
| Simurgh Skylord | 3/9 |
| Tiamat Echo | 8/8 |
| Houyi Quiver | 8/7 |
| Pashupata Annihilator | 8/6 |
| Typhon Disruptor | 5/6 |
| Skadi Hunter | 0/6 |
| Thoth Oracler | 4/9 |
| Rostam Breacher | 7/11 |
| Heimdall Bastion | 8/11 |
| Dhanvantari Lifeweaver | 11/11 |
| Hermes Strider | 3/9 |
| Gungnir's Tip | 8/6 |
| Yatagarasu Pathfinder | 6/11 |
| Eyes of Horus | 0/13 |
| Sekhmet Kamikaze | 0/7 |
| Anhur Warden | 0/13 |
| Raijin Tempest | 5/10 |
| Hades Stealthray | 2/7 |
| Suzaku Komet | 0/8 |
| Qinglong | 7/7 |
| Baihu | 5/9 |
| Pandora | 0/12 |
| Excalibur | 6/6 |
| Longinus | 8/6 |
| Thor | 3/6 |
| Artemis | 1/12 |
| Agni | 4/8 |
| Loki | 3/10 |

</details>

<details><summary>Raiju's Whisper</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 7/10 |
| Fenrir Vanguard | 7/9 |
| Xuanwu Fortress | 5/9 |
| Sarama Warhound | 7/7 |
| Eir's Blessing | 7/9 |
| Huma Enforcer | 6/9 |
| Garuda Talon | 2/11 |
| Raiju's Whisper | 8/8 |
| Simurgh Skylord | 6/8 |
| Tiamat Echo | 10/5 |
| Houyi Quiver | 10/5 |
| Pashupata Annihilator | 10/5 |
| Typhon Disruptor | 1/12 |
| Skadi Hunter | 7/6 |
| Thoth Oracler | 6/9 |
| Rostam Breacher | 6/12 |
| Heimdall Bastion | 0/13 |
| Dhanvantari Lifeweaver | 5/16 |
| Hermes Strider | 6/8 |
| Gungnir's Tip | 6/13 |
| Yatagarasu Pathfinder | 8/12 |
| Eyes of Horus | 10/1 |
| Sekhmet Kamikaze | 4/1 |
| Anhur Warden | 10/3 |
| Raijin Tempest | 7/12 |
| Hades Stealthray | 4/7 |
| Suzaku Komet | 5/0 |
| Qinglong | 4/11 |
| Baihu | 6/11 |
| Pandora | 9/5 |
| Excalibur | 7/12 |
| Longinus | 10/5 |
| Thor | 3/9 |
| Artemis | 9/6 |
| Agni | 8/10 |
| Loki | 7/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/7 |
| Fenrir Vanguard | 9/5 |
| Xuanwu Fortress | 9/10 |
| Sarama Warhound | 7/7 |
| Eir's Blessing | 9/7 |
| Huma Enforcer | 9/6 |
| Garuda Talon | 11/5 |
| Raiju's Whisper | 8/8 |
| Simurgh Skylord | 8/6 |
| Tiamat Echo | 8/5 |
| Houyi Quiver | 8/4 |
| Pashupata Annihilator | 8/3 |
| Typhon Disruptor | 12/3 |
| Skadi Hunter | 6/3 |
| Thoth Oracler | 9/6 |
| Rostam Breacher | 12/8 |
| Heimdall Bastion | 13/8 |
| Dhanvantari Lifeweaver | 16/8 |
| Hermes Strider | 8/6 |
| Gungnir's Tip | 13/3 |
| Yatagarasu Pathfinder | 12/8 |
| Eyes of Horus | 1/8 |
| Sekhmet Kamikaze | 1/4 |
| Anhur Warden | 3/10 |
| Raijin Tempest | 12/7 |
| Hades Stealthray | 7/4 |
| Suzaku Komet | 0/5 |
| Qinglong | 11/4 |
| Baihu | 11/6 |
| Pandora | 5/9 |
| Excalibur | 12/3 |
| Longinus | 8/3 |
| Thor | 9/3 |
| Artemis | 6/9 |
| Agni | 10/5 |
| Loki | 8/7 |

</details>

<details><summary>Simurgh Skylord</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/10 |
| Fenrir Vanguard | 8/7 |
| Xuanwu Fortress | 4/9 |
| Sarama Warhound | 8/5 |
| Eir's Blessing | 8/7 |
| Huma Enforcer | 7/7 |
| Garuda Talon | 3/9 |
| Raiju's Whisper | 8/6 |
| Simurgh Skylord | 6/6 |
| Tiamat Echo | 11/3 |
| Houyi Quiver | 11/3 |
| Pashupata Annihilator | 11/3 |
| Typhon Disruptor | 2/10 |
| Skadi Hunter | 8/4 |
| Thoth Oracler | 7/9 |
| Rostam Breacher | 7/10 |
| Heimdall Bastion | 1/11 |
| Dhanvantari Lifeweaver | 4/14 |
| Hermes Strider | 7/6 |
| Gungnir's Tip | 7/11 |
| Yatagarasu Pathfinder | 8/10 |
| Eyes of Horus | 10/0 |
| Sekhmet Kamikaze | 5/0 |
| Anhur Warden | 11/1 |
| Raijin Tempest | 8/10 |
| Hades Stealthray | 5/5 |
| Suzaku Komet | 6/0 |
| Qinglong | 4/10 |
| Baihu | 7/11 |
| Pandora | 10/3 |
| Excalibur | 8/10 |
| Longinus | 11/3 |
| Thor | 4/8 |
| Artemis | 9/4 |
| Agni | 9/8 |
| Loki | 8/6 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/8 |
| Fenrir Vanguard | 7/6 |
| Xuanwu Fortress | 9/9 |
| Sarama Warhound | 5/8 |
| Eir's Blessing | 7/8 |
| Huma Enforcer | 7/7 |
| Garuda Talon | 9/6 |
| Raiju's Whisper | 6/8 |
| Simurgh Skylord | 6/6 |
| Tiamat Echo | 8/6 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/4 |
| Typhon Disruptor | 10/4 |
| Skadi Hunter | 4/4 |
| Thoth Oracler | 9/7 |
| Rostam Breacher | 10/9 |
| Heimdall Bastion | 11/9 |
| Dhanvantari Lifeweaver | 14/7 |
| Hermes Strider | 6/7 |
| Gungnir's Tip | 11/4 |
| Yatagarasu Pathfinder | 10/8 |
| Eyes of Horus | 0/10 |
| Sekhmet Kamikaze | 0/5 |
| Anhur Warden | 1/11 |
| Raijin Tempest | 10/8 |
| Hades Stealthray | 5/5 |
| Suzaku Komet | 0/6 |
| Qinglong | 10/4 |
| Baihu | 11/7 |
| Pandora | 3/10 |
| Excalibur | 10/4 |
| Longinus | 8/4 |
| Thor | 8/4 |
| Artemis | 4/9 |
| Agni | 8/6 |
| Loki | 6/8 |

</details>

<details><summary>Tiamat Echo</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/6 |
| Fenrir Vanguard | 8/5 |
| Xuanwu Fortress | 8/4 |
| Sarama Warhound | 8/3 |
| Eir's Blessing | 8/6 |
| Huma Enforcer | 8/4 |
| Garuda Talon | 8/8 |
| Raiju's Whisper | 8/5 |
| Simurgh Skylord | 8/6 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/3 |
| Pashupata Annihilator | 8/3 |
| Typhon Disruptor | 8/7 |
| Skadi Hunter | 8/3 |
| Thoth Oracler | 8/7 |
| Rostam Breacher | 8/10 |
| Heimdall Bastion | 8/11 |
| Dhanvantari Lifeweaver | 8/14 |
| Hermes Strider | 8/6 |
| Gungnir's Tip | 8/11 |
| Yatagarasu Pathfinder | 8/9 |
| Eyes of Horus | 8/0 |
| Sekhmet Kamikaze | 8/0 |
| Anhur Warden | 8/1 |
| Raijin Tempest | 8/8 |
| Hades Stealthray | 8/5 |
| Suzaku Komet | 8/0 |
| Qinglong | 8/6 |
| Baihu | 8/11 |
| Pandora | 8/3 |
| Excalibur | 8/9 |
| Longinus | 8/3 |
| Thor | 8/6 |
| Artemis | 8/4 |
| Agni | 8/7 |
| Loki | 8/6 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/5 |
| Fenrir Vanguard | 10/3 |
| Xuanwu Fortress | 9/6 |
| Sarama Warhound | 8/5 |
| Eir's Blessing | 11/5 |
| Huma Enforcer | 9/4 |
| Garuda Talon | 13/3 |
| Raiju's Whisper | 10/5 |
| Simurgh Skylord | 11/3 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 12/1 |
| Skadi Hunter | 8/1 |
| Thoth Oracler | 9/4 |
| Rostam Breacher | 15/6 |
| Heimdall Bastion | 16/6 |
| Dhanvantari Lifeweaver | 19/4 |
| Hermes Strider | 11/4 |
| Gungnir's Tip | 16/1 |
| Yatagarasu Pathfinder | 14/5 |
| Eyes of Horus | 4/4 |
| Sekhmet Kamikaze | 4/2 |
| Anhur Warden | 4/8 |
| Raijin Tempest | 13/5 |
| Hades Stealthray | 10/2 |
| Suzaku Komet | 3/3 |
| Qinglong | 11/1 |
| Baihu | 11/4 |
| Pandora | 8/7 |
| Excalibur | 14/1 |
| Longinus | 8/1 |
| Thor | 9/1 |
| Artemis | 9/6 |
| Agni | 12/3 |
| Loki | 8/5 |

</details>

<details><summary>Houyi Quiver</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/5 |
| Fenrir Vanguard | 8/4 |
| Xuanwu Fortress | 8/3 |
| Sarama Warhound | 8/2 |
| Eir's Blessing | 8/5 |
| Huma Enforcer | 8/3 |
| Garuda Talon | 8/7 |
| Raiju's Whisper | 8/4 |
| Simurgh Skylord | 8/5 |
| Tiamat Echo | 8/2 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/2 |
| Typhon Disruptor | 8/6 |
| Skadi Hunter | 8/2 |
| Thoth Oracler | 8/6 |
| Rostam Breacher | 8/9 |
| Heimdall Bastion | 8/10 |
| Dhanvantari Lifeweaver | 8/13 |
| Hermes Strider | 8/5 |
| Gungnir's Tip | 8/10 |
| Yatagarasu Pathfinder | 8/8 |
| Eyes of Horus | 8/0 |
| Sekhmet Kamikaze | 8/0 |
| Anhur Warden | 8/0 |
| Raijin Tempest | 8/7 |
| Hades Stealthray | 8/4 |
| Suzaku Komet | 8/0 |
| Qinglong | 8/5 |
| Baihu | 8/7 |
| Pandora | 8/2 |
| Excalibur | 8/8 |
| Longinus | 8/2 |
| Thor | 8/5 |
| Artemis | 8/3 |
| Agni | 8/6 |
| Loki | 8/5 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/5 |
| Fenrir Vanguard | 10/3 |
| Xuanwu Fortress | 9/6 |
| Sarama Warhound | 8/5 |
| Eir's Blessing | 11/5 |
| Huma Enforcer | 9/4 |
| Garuda Talon | 13/3 |
| Raiju's Whisper | 10/5 |
| Simurgh Skylord | 11/3 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 12/1 |
| Skadi Hunter | 8/1 |
| Thoth Oracler | 9/4 |
| Rostam Breacher | 15/6 |
| Heimdall Bastion | 16/6 |
| Dhanvantari Lifeweaver | 19/4 |
| Hermes Strider | 11/4 |
| Gungnir's Tip | 16/1 |
| Yatagarasu Pathfinder | 14/5 |
| Eyes of Horus | 4/4 |
| Sekhmet Kamikaze | 4/2 |
| Anhur Warden | 4/8 |
| Raijin Tempest | 13/5 |
| Hades Stealthray | 10/2 |
| Suzaku Komet | 3/3 |
| Qinglong | 11/1 |
| Baihu | 11/4 |
| Pandora | 8/7 |
| Excalibur | 14/1 |
| Longinus | 8/1 |
| Thor | 9/1 |
| Artemis | 9/6 |
| Agni | 12/3 |
| Loki | 8/5 |

</details>

<details><summary>Pashupata Annihilator</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/3 |
| Fenrir Vanguard | 8/3 |
| Xuanwu Fortress | 8/2 |
| Sarama Warhound | 8/1 |
| Eir's Blessing | 8/4 |
| Huma Enforcer | 8/2 |
| Garuda Talon | 8/6 |
| Raiju's Whisper | 8/3 |
| Simurgh Skylord | 8/4 |
| Tiamat Echo | 8/1 |
| Houyi Quiver | 8/1 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 8/5 |
| Skadi Hunter | 8/1 |
| Thoth Oracler | 8/5 |
| Rostam Breacher | 8/8 |
| Heimdall Bastion | 8/9 |
| Dhanvantari Lifeweaver | 8/12 |
| Hermes Strider | 8/4 |
| Gungnir's Tip | 8/9 |
| Yatagarasu Pathfinder | 8/7 |
| Eyes of Horus | 8/0 |
| Sekhmet Kamikaze | 8/0 |
| Anhur Warden | 8/0 |
| Raijin Tempest | 8/6 |
| Hades Stealthray | 8/3 |
| Suzaku Komet | 8/0 |
| Qinglong | 8/4 |
| Baihu | 8/6 |
| Pandora | 8/1 |
| Excalibur | 8/7 |
| Longinus | 8/1 |
| Thor | 8/4 |
| Artemis | 8/2 |
| Agni | 8/5 |
| Loki | 8/4 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/5 |
| Fenrir Vanguard | 10/3 |
| Xuanwu Fortress | 9/6 |
| Sarama Warhound | 8/5 |
| Eir's Blessing | 11/5 |
| Huma Enforcer | 9/4 |
| Garuda Talon | 13/3 |
| Raiju's Whisper | 10/5 |
| Simurgh Skylord | 11/3 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 12/1 |
| Skadi Hunter | 8/1 |
| Thoth Oracler | 9/4 |
| Rostam Breacher | 15/6 |
| Heimdall Bastion | 16/6 |
| Dhanvantari Lifeweaver | 19/4 |
| Hermes Strider | 11/4 |
| Gungnir's Tip | 16/1 |
| Yatagarasu Pathfinder | 14/5 |
| Eyes of Horus | 4/4 |
| Sekhmet Kamikaze | 4/2 |
| Anhur Warden | 4/8 |
| Raijin Tempest | 13/5 |
| Hades Stealthray | 10/2 |
| Suzaku Komet | 3/3 |
| Qinglong | 11/1 |
| Baihu | 11/4 |
| Pandora | 8/7 |
| Excalibur | 14/1 |
| Longinus | 8/1 |
| Thor | 9/1 |
| Artemis | 9/6 |
| Agni | 12/3 |
| Loki | 8/5 |

</details>

<details><summary>Typhon Disruptor</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 11/7 |
| Fenrir Vanguard | 9/4 |
| Xuanwu Fortress | 9/3 |
| Sarama Warhound | 10/1 |
| Eir's Blessing | 11/4 |
| Huma Enforcer | 10/2 |
| Garuda Talon | 5/6 |
| Raiju's Whisper | 12/3 |
| Simurgh Skylord | 10/4 |
| Tiamat Echo | 12/1 |
| Houyi Quiver | 12/1 |
| Pashupata Annihilator | 12/1 |
| Typhon Disruptor | 5/7 |
| Skadi Hunter | 10/1 |
| Thoth Oracler | 8/3 |
| Rostam Breacher | 8/8 |
| Heimdall Bastion | 4/9 |
| Dhanvantari Lifeweaver | 9/12 |
| Hermes Strider | 8/4 |
| Gungnir's Tip | 9/9 |
| Yatagarasu Pathfinder | 12/7 |
| Eyes of Horus | 12/0 |
| Sekhmet Kamikaze | 6/0 |
| Anhur Warden | 12/0 |
| Raijin Tempest | 11/7 |
| Hades Stealthray | 7/3 |
| Suzaku Komet | 7/0 |
| Qinglong | 8/4 |
| Baihu | 9/4 |
| Pandora | 11/1 |
| Excalibur | 9/7 |
| Longinus | 12/1 |
| Thor | 7/3 |
| Artemis | 12/2 |
| Agni | 11/5 |
| Loki | 10/1 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 5/11 |
| Fenrir Vanguard | 2/7 |
| Xuanwu Fortress | 1/12 |
| Sarama Warhound | 0/10 |
| Eir's Blessing | 2/11 |
| Huma Enforcer | 0/10 |
| Garuda Talon | 4/8 |
| Raiju's Whisper | 1/12 |
| Simurgh Skylord | 2/10 |
| Tiamat Echo | 8/7 |
| Houyi Quiver | 8/6 |
| Pashupata Annihilator | 8/5 |
| Typhon Disruptor | 5/7 |
| Skadi Hunter | 0/6 |
| Thoth Oracler | 1/8 |
| Rostam Breacher | 6/10 |
| Heimdall Bastion | 7/12 |
| Dhanvantari Lifeweaver | 10/12 |
| Hermes Strider | 2/8 |
| Gungnir's Tip | 7/6 |
| Yatagarasu Pathfinder | 5/12 |
| Eyes of Horus | 0/12 |
| Sekhmet Kamikaze | 0/6 |
| Anhur Warden | 0/12 |
| Raijin Tempest | 5/11 |
| Hades Stealthray | 1/7 |
| Suzaku Komet | 0/7 |
| Qinglong | 2/8 |
| Baihu | 2/9 |
| Pandora | 0/11 |
| Excalibur | 5/5 |
| Longinus | 8/5 |
| Thor | 1/7 |
| Artemis | 0/12 |
| Agni | 3/7 |
| Loki | 0/10 |

</details>

<details><summary>Skadi Hunter</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 5/6 |
| Fenrir Vanguard | 5/3 |
| Xuanwu Fortress | 3/2 |
| Sarama Warhound | 5/3 |
| Eir's Blessing | 5/4 |
| Huma Enforcer | 4/4 |
| Garuda Talon | 0/6 |
| Raiju's Whisper | 6/3 |
| Simurgh Skylord | 4/4 |
| Tiamat Echo | 8/1 |
| Houyi Quiver | 8/1 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 0/6 |
| Skadi Hunter | 5/1 |
| Thoth Oracler | 4/5 |
| Rostam Breacher | 4/8 |
| Heimdall Bastion | 0/9 |
| Dhanvantari Lifeweaver | 3/12 |
| Hermes Strider | 4/4 |
| Gungnir's Tip | 4/9 |
| Yatagarasu Pathfinder | 6/7 |
| Eyes of Horus | 8/0 |
| Sekhmet Kamikaze | 2/0 |
| Anhur Warden | 8/0 |
| Raijin Tempest | 5/6 |
| Hades Stealthray | 2/3 |
| Suzaku Komet | 3/0 |
| Qinglong | 2/8 |
| Baihu | 4/6 |
| Pandora | 7/1 |
| Excalibur | 5/7 |
| Longinus | 8/1 |
| Thor | 1/4 |
| Artemis | 7/2 |
| Agni | 6/5 |
| Loki | 5/4 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/5 |
| Fenrir Vanguard | 7/3 |
| Xuanwu Fortress | 9/8 |
| Sarama Warhound | 7/5 |
| Eir's Blessing | 8/5 |
| Huma Enforcer | 8/4 |
| Garuda Talon | 10/3 |
| Raiju's Whisper | 7/6 |
| Simurgh Skylord | 8/4 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 10/1 |
| Skadi Hunter | 5/1 |
| Thoth Oracler | 9/4 |
| Rostam Breacher | 12/6 |
| Heimdall Bastion | 13/6 |
| Dhanvantari Lifeweaver | 16/6 |
| Hermes Strider | 8/4 |
| Gungnir's Tip | 13/1 |
| Yatagarasu Pathfinder | 11/6 |
| Eyes of Horus | 1/8 |
| Sekhmet Kamikaze | 1/2 |
| Anhur Warden | 3/8 |
| Raijin Tempest | 10/5 |
| Hades Stealthray | 7/2 |
| Suzaku Komet | 0/3 |
| Qinglong | 11/2 |
| Baihu | 11/4 |
| Pandora | 5/7 |
| Excalibur | 11/1 |
| Longinus | 8/1 |
| Thor | 8/1 |
| Artemis | 6/7 |
| Agni | 9/3 |
| Loki | 8/5 |

</details>

<details><summary>Thoth Oracler</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 9/8 |
| Fenrir Vanguard | 9/6 |
| Xuanwu Fortress | 8/5 |
| Sarama Warhound | 9/6 |
| Eir's Blessing | 9/7 |
| Huma Enforcer | 9/7 |
| Garuda Talon | 4/9 |
| Raiju's Whisper | 9/6 |
| Simurgh Skylord | 9/7 |
| Tiamat Echo | 9/4 |
| Houyi Quiver | 9/4 |
| Pashupata Annihilator | 9/4 |
| Typhon Disruptor | 1/8 |
| Skadi Hunter | 9/4 |
| Thoth Oracler | 8/8 |
| Rostam Breacher | 8/11 |
| Heimdall Bastion | 3/12 |
| Dhanvantari Lifeweaver | 8/15 |
| Hermes Strider | 8/7 |
| Gungnir's Tip | 8/12 |
| Yatagarasu Pathfinder | 9/10 |
| Eyes of Horus | 9/0 |
| Sekhmet Kamikaze | 6/0 |
| Anhur Warden | 9/2 |
| Raijin Tempest | 9/9 |
| Hades Stealthray | 6/6 |
| Suzaku Komet | 7/0 |
| Qinglong | 4/11 |
| Baihu | 8/11 |
| Pandora | 9/4 |
| Excalibur | 9/10 |
| Longinus | 9/4 |
| Thor | 3/7 |
| Artemis | 9/5 |
| Agni | 9/8 |
| Loki | 9/7 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 8/9 |
| Fenrir Vanguard | 6/7 |
| Xuanwu Fortress | 5/9 |
| Sarama Warhound | 6/9 |
| Eir's Blessing | 7/9 |
| Huma Enforcer | 7/9 |
| Garuda Talon | 9/7 |
| Raiju's Whisper | 6/9 |
| Simurgh Skylord | 7/9 |
| Tiamat Echo | 8/7 |
| Houyi Quiver | 8/6 |
| Pashupata Annihilator | 8/5 |
| Typhon Disruptor | 8/3 |
| Skadi Hunter | 4/5 |
| Thoth Oracler | 8/8 |
| Rostam Breacher | 11/9 |
| Heimdall Bastion | 12/9 |
| Dhanvantari Lifeweaver | 15/9 |
| Hermes Strider | 7/8 |
| Gungnir's Tip | 12/5 |
| Yatagarasu Pathfinder | 10/9 |
| Eyes of Horus | 0/9 |
| Sekhmet Kamikaze | 0/6 |
| Anhur Warden | 2/9 |
| Raijin Tempest | 9/9 |
| Hades Stealthray | 6/6 |
| Suzaku Komet | 0/7 |
| Qinglong | 11/4 |
| Baihu | 11/8 |
| Pandora | 4/9 |
| Excalibur | 10/5 |
| Longinus | 8/5 |
| Thor | 7/3 |
| Artemis | 5/9 |
| Agni | 8/7 |
| Loki | 7/9 |

</details>

<details><summary>Rostam Breacher</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 12/8 |
| Fenrir Vanguard | 12/8 |
| Xuanwu Fortress | 8/9 |
| Sarama Warhound | 12/8 |
| Eir's Blessing | 12/9 |
| Huma Enforcer | 11/9 |
| Garuda Talon | 7/11 |
| Raiju's Whisper | 12/8 |
| Simurgh Skylord | 10/9 |
| Tiamat Echo | 15/6 |
| Houyi Quiver | 15/6 |
| Pashupata Annihilator | 15/6 |
| Typhon Disruptor | 6/10 |
| Skadi Hunter | 12/6 |
| Thoth Oracler | 11/9 |
| Rostam Breacher | 11/13 |
| Heimdall Bastion | 5/14 |
| Dhanvantari Lifeweaver | 8/17 |
| Hermes Strider | 11/9 |
| Gungnir's Tip | 11/14 |
| Yatagarasu Pathfinder | 12/12 |
| Eyes of Horus | 14/2 |
| Sekhmet Kamikaze | 9/2 |
| Anhur Warden | 15/4 |
| Raijin Tempest | 12/11 |
| Hades Stealthray | 9/8 |
| Suzaku Komet | 10/1 |
| Qinglong | 8/11 |
| Baihu | 11/11 |
| Pandora | 14/6 |
| Excalibur | 12/12 |
| Longinus | 15/6 |
| Thor | 8/9 |
| Artemis | 13/7 |
| Agni | 13/10 |
| Loki | 12/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 6/12 |
| Fenrir Vanguard | 6/10 |
| Xuanwu Fortress | 5/13 |
| Sarama Warhound | 6/12 |
| Eir's Blessing | 7/12 |
| Huma Enforcer | 7/11 |
| Garuda Talon | 9/10 |
| Raiju's Whisper | 6/12 |
| Simurgh Skylord | 7/10 |
| Tiamat Echo | 8/10 |
| Houyi Quiver | 8/9 |
| Pashupata Annihilator | 8/8 |
| Typhon Disruptor | 8/8 |
| Skadi Hunter | 4/8 |
| Thoth Oracler | 8/11 |
| Rostam Breacher | 11/13 |
| Heimdall Bastion | 12/13 |
| Dhanvantari Lifeweaver | 15/11 |
| Hermes Strider | 7/11 |
| Gungnir's Tip | 12/8 |
| Yatagarasu Pathfinder | 10/12 |
| Eyes of Horus | 0/14 |
| Sekhmet Kamikaze | 0/9 |
| Anhur Warden | 2/15 |
| Raijin Tempest | 9/12 |
| Hades Stealthray | 6/9 |
| Suzaku Komet | 0/10 |
| Qinglong | 11/8 |
| Baihu | 11/11 |
| Pandora | 4/14 |
| Excalibur | 10/8 |
| Longinus | 8/8 |
| Thor | 7/8 |
| Artemis | 5/13 |
| Agni | 8/10 |
| Loki | 7/12 |

</details>

<details><summary>Heimdall Bastion</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 13/10 |
| Fenrir Vanguard | 13/9 |
| Xuanwu Fortress | 9/9 |
| Sarama Warhound | 13/8 |
| Eir's Blessing | 13/9 |
| Huma Enforcer | 12/9 |
| Garuda Talon | 8/11 |
| Raiju's Whisper | 13/8 |
| Simurgh Skylord | 11/9 |
| Tiamat Echo | 16/6 |
| Houyi Quiver | 16/6 |
| Pashupata Annihilator | 16/6 |
| Typhon Disruptor | 7/12 |
| Skadi Hunter | 13/6 |
| Thoth Oracler | 12/9 |
| Rostam Breacher | 12/13 |
| Heimdall Bastion | 6/14 |
| Dhanvantari Lifeweaver | 9/17 |
| Hermes Strider | 12/9 |
| Gungnir's Tip | 12/14 |
| Yatagarasu Pathfinder | 13/12 |
| Eyes of Horus | 15/2 |
| Sekhmet Kamikaze | 10/2 |
| Anhur Warden | 16/4 |
| Raijin Tempest | 13/12 |
| Hades Stealthray | 10/8 |
| Suzaku Komet | 11/1 |
| Qinglong | 9/11 |
| Baihu | 12/11 |
| Pandora | 15/6 |
| Excalibur | 13/12 |
| Longinus | 16/6 |
| Thor | 9/9 |
| Artemis | 14/7 |
| Agni | 14/10 |
| Loki | 13/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 4/13 |
| Fenrir Vanguard | 1/11 |
| Xuanwu Fortress | 0/14 |
| Sarama Warhound | 0/13 |
| Eir's Blessing | 1/13 |
| Huma Enforcer | 1/12 |
| Garuda Talon | 3/11 |
| Raiju's Whisper | 0/13 |
| Simurgh Skylord | 1/11 |
| Tiamat Echo | 8/11 |
| Houyi Quiver | 8/10 |
| Pashupata Annihilator | 8/9 |
| Typhon Disruptor | 4/9 |
| Skadi Hunter | 0/9 |
| Thoth Oracler | 3/12 |
| Rostam Breacher | 5/14 |
| Heimdall Bastion | 6/14 |
| Dhanvantari Lifeweaver | 9/12 |
| Hermes Strider | 1/12 |
| Gungnir's Tip | 6/9 |
| Yatagarasu Pathfinder | 4/13 |
| Eyes of Horus | 0/15 |
| Sekhmet Kamikaze | 0/10 |
| Anhur Warden | 0/16 |
| Raijin Tempest | 4/13 |
| Hades Stealthray | 0/10 |
| Suzaku Komet | 0/11 |
| Qinglong | 5/9 |
| Baihu | 3/12 |
| Pandora | 0/15 |
| Excalibur | 4/9 |
| Longinus | 8/9 |
| Thor | 2/9 |
| Artemis | 0/14 |
| Agni | 2/11 |
| Loki | 1/13 |

</details>

<details><summary>Dhanvantari Lifeweaver</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 16/10 |
| Fenrir Vanguard | 16/9 |
| Xuanwu Fortress | 12/9 |
| Sarama Warhound | 16/7 |
| Eir's Blessing | 16/9 |
| Huma Enforcer | 15/9 |
| Garuda Talon | 11/11 |
| Raiju's Whisper | 16/8 |
| Simurgh Skylord | 14/7 |
| Tiamat Echo | 19/4 |
| Houyi Quiver | 19/4 |
| Pashupata Annihilator | 19/4 |
| Typhon Disruptor | 10/12 |
| Skadi Hunter | 16/6 |
| Thoth Oracler | 15/9 |
| Rostam Breacher | 15/11 |
| Heimdall Bastion | 9/12 |
| Dhanvantari Lifeweaver | 12/15 |
| Hermes Strider | 15/7 |
| Gungnir's Tip | 15/13 |
| Yatagarasu Pathfinder | 16/12 |
| Eyes of Horus | 18/0 |
| Sekhmet Kamikaze | 13/0 |
| Anhur Warden | 19/2 |
| Raijin Tempest | 16/12 |
| Hades Stealthray | 13/6 |
| Suzaku Komet | 14/0 |
| Qinglong | 12/11 |
| Baihu | 15/11 |
| Pandora | 18/5 |
| Excalibur | 16/12 |
| Longinus | 19/4 |
| Thor | 12/9 |
| Artemis | 17/6 |
| Agni | 17/10 |
| Loki | 16/7 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 9/16 |
| Fenrir Vanguard | 6/14 |
| Xuanwu Fortress | 5/17 |
| Sarama Warhound | 4/16 |
| Eir's Blessing | 6/16 |
| Huma Enforcer | 6/15 |
| Garuda Talon | 8/14 |
| Raiju's Whisper | 5/16 |
| Simurgh Skylord | 4/14 |
| Tiamat Echo | 8/14 |
| Houyi Quiver | 8/13 |
| Pashupata Annihilator | 8/12 |
| Typhon Disruptor | 9/12 |
| Skadi Hunter | 3/12 |
| Thoth Oracler | 8/15 |
| Rostam Breacher | 8/17 |
| Heimdall Bastion | 9/17 |
| Dhanvantari Lifeweaver | 12/15 |
| Hermes Strider | 4/15 |
| Gungnir's Tip | 10/12 |
| Yatagarasu Pathfinder | 9/16 |
| Eyes of Horus | 0/18 |
| Sekhmet Kamikaze | 0/13 |
| Anhur Warden | 0/19 |
| Raijin Tempest | 9/16 |
| Hades Stealthray | 3/13 |
| Suzaku Komet | 0/14 |
| Qinglong | 9/12 |
| Baihu | 11/15 |
| Pandora | 2/18 |
| Excalibur | 9/12 |
| Longinus | 8/12 |
| Thor | 7/12 |
| Artemis | 3/17 |
| Agni | 7/14 |
| Loki | 4/16 |

</details>

<details><summary>Hermes Strider</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/8 |
| Fenrir Vanguard | 8/6 |
| Xuanwu Fortress | 4/5 |
| Sarama Warhound | 8/6 |
| Eir's Blessing | 8/7 |
| Huma Enforcer | 7/7 |
| Garuda Talon | 3/9 |
| Raiju's Whisper | 8/6 |
| Simurgh Skylord | 6/7 |
| Tiamat Echo | 11/4 |
| Houyi Quiver | 11/4 |
| Pashupata Annihilator | 11/4 |
| Typhon Disruptor | 2/8 |
| Skadi Hunter | 8/4 |
| Thoth Oracler | 7/8 |
| Rostam Breacher | 7/11 |
| Heimdall Bastion | 1/12 |
| Dhanvantari Lifeweaver | 4/15 |
| Hermes Strider | 7/7 |
| Gungnir's Tip | 7/12 |
| Yatagarasu Pathfinder | 8/10 |
| Eyes of Horus | 10/0 |
| Sekhmet Kamikaze | 5/0 |
| Anhur Warden | 11/2 |
| Raijin Tempest | 8/9 |
| Hades Stealthray | 5/6 |
| Suzaku Komet | 6/0 |
| Qinglong | 4/11 |
| Baihu | 7/11 |
| Pandora | 10/4 |
| Excalibur | 8/10 |
| Longinus | 11/4 |
| Thor | 4/7 |
| Artemis | 9/5 |
| Agni | 9/8 |
| Loki | 8/7 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 8/8 |
| Fenrir Vanguard | 6/6 |
| Xuanwu Fortress | 5/9 |
| Sarama Warhound | 6/8 |
| Eir's Blessing | 7/8 |
| Huma Enforcer | 7/7 |
| Garuda Talon | 9/6 |
| Raiju's Whisper | 6/8 |
| Simurgh Skylord | 7/6 |
| Tiamat Echo | 8/6 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/4 |
| Typhon Disruptor | 8/4 |
| Skadi Hunter | 4/4 |
| Thoth Oracler | 8/7 |
| Rostam Breacher | 11/9 |
| Heimdall Bastion | 12/9 |
| Dhanvantari Lifeweaver | 15/7 |
| Hermes Strider | 7/7 |
| Gungnir's Tip | 12/4 |
| Yatagarasu Pathfinder | 10/8 |
| Eyes of Horus | 0/10 |
| Sekhmet Kamikaze | 0/5 |
| Anhur Warden | 2/11 |
| Raijin Tempest | 9/8 |
| Hades Stealthray | 6/5 |
| Suzaku Komet | 0/6 |
| Qinglong | 11/4 |
| Baihu | 11/7 |
| Pandora | 4/10 |
| Excalibur | 10/4 |
| Longinus | 8/4 |
| Thor | 7/4 |
| Artemis | 5/9 |
| Agni | 8/6 |
| Loki | 7/8 |

</details>

<details><summary>Gungnir's Tip</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 13/6 |
| Fenrir Vanguard | 13/3 |
| Xuanwu Fortress | 10/2 |
| Sarama Warhound | 13/3 |
| Eir's Blessing | 13/4 |
| Huma Enforcer | 12/4 |
| Garuda Talon | 8/6 |
| Raiju's Whisper | 13/3 |
| Simurgh Skylord | 11/4 |
| Tiamat Echo | 16/1 |
| Houyi Quiver | 16/1 |
| Pashupata Annihilator | 16/1 |
| Typhon Disruptor | 7/6 |
| Skadi Hunter | 13/1 |
| Thoth Oracler | 12/5 |
| Rostam Breacher | 12/8 |
| Heimdall Bastion | 6/9 |
| Dhanvantari Lifeweaver | 10/12 |
| Hermes Strider | 12/4 |
| Gungnir's Tip | 12/9 |
| Yatagarasu Pathfinder | 13/7 |
| Eyes of Horus | 16/0 |
| Sekhmet Kamikaze | 10/0 |
| Anhur Warden | 16/0 |
| Raijin Tempest | 13/6 |
| Hades Stealthray | 10/3 |
| Suzaku Komet | 11/0 |
| Qinglong | 9/8 |
| Baihu | 12/6 |
| Pandora | 15/1 |
| Excalibur | 13/7 |
| Longinus | 16/1 |
| Thor | 9/4 |
| Artemis | 14/2 |
| Agni | 14/5 |
| Loki | 13/4 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 9/13 |
| Fenrir Vanguard | 6/11 |
| Xuanwu Fortress | 5/15 |
| Sarama Warhound | 6/13 |
| Eir's Blessing | 7/13 |
| Huma Enforcer | 7/12 |
| Garuda Talon | 9/11 |
| Raiju's Whisper | 6/13 |
| Simurgh Skylord | 7/11 |
| Tiamat Echo | 8/11 |
| Houyi Quiver | 8/10 |
| Pashupata Annihilator | 8/9 |
| Typhon Disruptor | 9/9 |
| Skadi Hunter | 4/9 |
| Thoth Oracler | 8/12 |
| Rostam Breacher | 11/14 |
| Heimdall Bastion | 12/14 |
| Dhanvantari Lifeweaver | 15/13 |
| Hermes Strider | 7/12 |
| Gungnir's Tip | 12/9 |
| Yatagarasu Pathfinder | 10/13 |
| Eyes of Horus | 0/16 |
| Sekhmet Kamikaze | 0/10 |
| Anhur Warden | 2/16 |
| Raijin Tempest | 9/13 |
| Hades Stealthray | 6/10 |
| Suzaku Komet | 0/11 |
| Qinglong | 11/9 |
| Baihu | 11/12 |
| Pandora | 4/15 |
| Excalibur | 10/9 |
| Longinus | 8/9 |
| Thor | 7/9 |
| Artemis | 5/14 |
| Agni | 8/11 |
| Loki | 7/13 |

</details>

<details><summary>Yatagarasu Pathfinder</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 11/10 |
| Fenrir Vanguard | 11/9 |
| Xuanwu Fortress | 9/9 |
| Sarama Warhound | 11/7 |
| Eir's Blessing | 11/9 |
| Huma Enforcer | 10/9 |
| Garuda Talon | 6/11 |
| Raiju's Whisper | 12/8 |
| Simurgh Skylord | 10/8 |
| Tiamat Echo | 14/5 |
| Houyi Quiver | 14/5 |
| Pashupata Annihilator | 14/5 |
| Typhon Disruptor | 5/12 |
| Skadi Hunter | 11/6 |
| Thoth Oracler | 10/9 |
| Rostam Breacher | 10/12 |
| Heimdall Bastion | 4/13 |
| Dhanvantari Lifeweaver | 9/16 |
| Hermes Strider | 10/8 |
| Gungnir's Tip | 10/13 |
| Yatagarasu Pathfinder | 12/12 |
| Eyes of Horus | 14/1 |
| Sekhmet Kamikaze | 8/1 |
| Anhur Warden | 14/3 |
| Raijin Tempest | 11/12 |
| Hades Stealthray | 8/7 |
| Suzaku Komet | 9/0 |
| Qinglong | 8/11 |
| Baihu | 10/11 |
| Pandora | 13/5 |
| Excalibur | 11/12 |
| Longinus | 14/5 |
| Thor | 7/9 |
| Artemis | 13/6 |
| Agni | 12/10 |
| Loki | 11/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/11 |
| Fenrir Vanguard | 9/9 |
| Xuanwu Fortress | 9/14 |
| Sarama Warhound | 7/11 |
| Eir's Blessing | 9/11 |
| Huma Enforcer | 9/10 |
| Garuda Talon | 11/9 |
| Raiju's Whisper | 8/12 |
| Simurgh Skylord | 8/10 |
| Tiamat Echo | 8/9 |
| Houyi Quiver | 8/8 |
| Pashupata Annihilator | 8/7 |
| Typhon Disruptor | 12/7 |
| Skadi Hunter | 6/7 |
| Thoth Oracler | 9/10 |
| Rostam Breacher | 12/12 |
| Heimdall Bastion | 13/12 |
| Dhanvantari Lifeweaver | 16/12 |
| Hermes Strider | 8/10 |
| Gungnir's Tip | 13/7 |
| Yatagarasu Pathfinder | 12/12 |
| Eyes of Horus | 1/12 |
| Sekhmet Kamikaze | 1/8 |
| Anhur Warden | 3/14 |
| Raijin Tempest | 12/11 |
| Hades Stealthray | 7/8 |
| Suzaku Komet | 0/9 |
| Qinglong | 11/8 |
| Baihu | 11/10 |
| Pandora | 5/13 |
| Excalibur | 12/7 |
| Longinus | 8/7 |
| Thor | 9/7 |
| Artemis | 6/13 |
| Agni | 10/9 |
| Loki | 8/11 |

</details>

<details><summary>Eyes of Horus</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 1/10 |
| Fenrir Vanguard | 1/9 |
| Xuanwu Fortress | 0/9 |
| Sarama Warhound | 1/6 |
| Eir's Blessing | 1/9 |
| Huma Enforcer | 0/9 |
| Garuda Talon | 0/13 |
| Raiju's Whisper | 1/8 |
| Simurgh Skylord | 0/10 |
| Tiamat Echo | 4/4 |
| Houyi Quiver | 4/4 |
| Pashupata Annihilator | 4/4 |
| Typhon Disruptor | 0/12 |
| Skadi Hunter | 1/8 |
| Thoth Oracler | 0/9 |
| Rostam Breacher | 0/14 |
| Heimdall Bastion | 0/15 |
| Dhanvantari Lifeweaver | 0/18 |
| Hermes Strider | 0/10 |
| Gungnir's Tip | 0/16 |
| Yatagarasu Pathfinder | 1/12 |
| Eyes of Horus | 3/0 |
| Sekhmet Kamikaze | 0/3 |
| Anhur Warden | 4/1 |
| Raijin Tempest | 1/12 |
| Hades Stealthray | 0/9 |
| Suzaku Komet | 0/2 |
| Qinglong | 0/11 |
| Baihu | 0/11 |
| Pandora | 3/6 |
| Excalibur | 1/12 |
| Longinus | 4/4 |
| Thor | 0/9 |
| Artemis | 2/7 |
| Agni | 2/10 |
| Loki | 1/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/1 |
| Fenrir Vanguard | 10/0 |
| Xuanwu Fortress | 9/2 |
| Sarama Warhound | 8/1 |
| Eir's Blessing | 11/1 |
| Huma Enforcer | 9/0 |
| Garuda Talon | 13/0 |
| Raiju's Whisper | 10/1 |
| Simurgh Skylord | 10/0 |
| Tiamat Echo | 8/0 |
| Houyi Quiver | 8/0 |
| Pashupata Annihilator | 8/0 |
| Typhon Disruptor | 12/0 |
| Skadi Hunter | 8/0 |
| Thoth Oracler | 9/0 |
| Rostam Breacher | 14/2 |
| Heimdall Bastion | 15/2 |
| Dhanvantari Lifeweaver | 18/0 |
| Hermes Strider | 10/0 |
| Gungnir's Tip | 16/0 |
| Yatagarasu Pathfinder | 14/1 |
| Eyes of Horus | 3/0 |
| Sekhmet Kamikaze | 3/0 |
| Anhur Warden | 4/4 |
| Raijin Tempest | 13/1 |
| Hades Stealthray | 9/0 |
| Suzaku Komet | 2/0 |
| Qinglong | 11/0 |
| Baihu | 11/0 |
| Pandora | 8/3 |
| Excalibur | 14/0 |
| Longinus | 8/0 |
| Thor | 9/0 |
| Artemis | 9/2 |
| Agni | 12/0 |
| Loki | 8/1 |

</details>

<details><summary>Sekhmet Kamikaze</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 1/6 |
| Fenrir Vanguard | 1/4 |
| Xuanwu Fortress | 0/3 |
| Sarama Warhound | 1/4 |
| Eir's Blessing | 1/5 |
| Huma Enforcer | 0/5 |
| Garuda Talon | 0/7 |
| Raiju's Whisper | 1/4 |
| Simurgh Skylord | 0/5 |
| Tiamat Echo | 4/2 |
| Houyi Quiver | 4/2 |
| Pashupata Annihilator | 4/2 |
| Typhon Disruptor | 0/6 |
| Skadi Hunter | 1/2 |
| Thoth Oracler | 0/6 |
| Rostam Breacher | 0/9 |
| Heimdall Bastion | 0/10 |
| Dhanvantari Lifeweaver | 0/13 |
| Hermes Strider | 0/5 |
| Gungnir's Tip | 0/10 |
| Yatagarasu Pathfinder | 1/8 |
| Eyes of Horus | 3/0 |
| Sekhmet Kamikaze | 0/0 |
| Anhur Warden | 4/0 |
| Raijin Tempest | 1/7 |
| Hades Stealthray | 0/4 |
| Suzaku Komet | 0/0 |
| Qinglong | 0/9 |
| Baihu | 0/7 |
| Pandora | 3/2 |
| Excalibur | 1/8 |
| Longinus | 4/2 |
| Thor | 0/5 |
| Artemis | 2/3 |
| Agni | 2/6 |
| Loki | 1/5 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 6/1 |
| Fenrir Vanguard | 4/0 |
| Xuanwu Fortress | 3/2 |
| Sarama Warhound | 4/1 |
| Eir's Blessing | 5/1 |
| Huma Enforcer | 5/0 |
| Garuda Talon | 7/0 |
| Raiju's Whisper | 4/1 |
| Simurgh Skylord | 5/0 |
| Tiamat Echo | 8/0 |
| Houyi Quiver | 8/0 |
| Pashupata Annihilator | 8/0 |
| Typhon Disruptor | 6/0 |
| Skadi Hunter | 2/0 |
| Thoth Oracler | 6/0 |
| Rostam Breacher | 9/2 |
| Heimdall Bastion | 10/2 |
| Dhanvantari Lifeweaver | 13/0 |
| Hermes Strider | 5/0 |
| Gungnir's Tip | 10/0 |
| Yatagarasu Pathfinder | 8/1 |
| Eyes of Horus | 0/3 |
| Sekhmet Kamikaze | 0/0 |
| Anhur Warden | 0/4 |
| Raijin Tempest | 7/1 |
| Hades Stealthray | 4/0 |
| Suzaku Komet | 0/0 |
| Qinglong | 9/0 |
| Baihu | 7/0 |
| Pandora | 2/3 |
| Excalibur | 8/0 |
| Longinus | 8/0 |
| Thor | 5/0 |
| Artemis | 3/2 |
| Agni | 6/0 |
| Loki | 5/1 |

</details>

<details><summary>Anhur Warden</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 3/10 |
| Fenrir Vanguard | 3/10 |
| Xuanwu Fortress | 0/9 |
| Sarama Warhound | 3/8 |
| Eir's Blessing | 3/11 |
| Huma Enforcer | 2/9 |
| Garuda Talon | 0/13 |
| Raiju's Whisper | 3/10 |
| Simurgh Skylord | 1/11 |
| Tiamat Echo | 4/8 |
| Houyi Quiver | 4/8 |
| Pashupata Annihilator | 4/8 |
| Typhon Disruptor | 0/12 |
| Skadi Hunter | 3/8 |
| Thoth Oracler | 2/9 |
| Rostam Breacher | 2/15 |
| Heimdall Bastion | 0/16 |
| Dhanvantari Lifeweaver | 0/19 |
| Hermes Strider | 2/11 |
| Gungnir's Tip | 2/16 |
| Yatagarasu Pathfinder | 3/14 |
| Eyes of Horus | 4/4 |
| Sekhmet Kamikaze | 0/4 |
| Anhur Warden | 4/4 |
| Raijin Tempest | 3/13 |
| Hades Stealthray | 0/10 |
| Suzaku Komet | 1/3 |
| Qinglong | 0/11 |
| Baihu | 2/11 |
| Pandora | 4/8 |
| Excalibur | 3/14 |
| Longinus | 4/8 |
| Thor | 0/9 |
| Artemis | 4/9 |
| Agni | 4/12 |
| Loki | 3/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/3 |
| Fenrir Vanguard | 10/1 |
| Xuanwu Fortress | 9/4 |
| Sarama Warhound | 8/3 |
| Eir's Blessing | 11/3 |
| Huma Enforcer | 9/2 |
| Garuda Talon | 13/1 |
| Raiju's Whisper | 10/3 |
| Simurgh Skylord | 11/1 |
| Tiamat Echo | 8/1 |
| Houyi Quiver | 8/0 |
| Pashupata Annihilator | 8/0 |
| Typhon Disruptor | 12/0 |
| Skadi Hunter | 8/0 |
| Thoth Oracler | 9/2 |
| Rostam Breacher | 15/4 |
| Heimdall Bastion | 16/4 |
| Dhanvantari Lifeweaver | 19/2 |
| Hermes Strider | 11/2 |
| Gungnir's Tip | 16/0 |
| Yatagarasu Pathfinder | 14/3 |
| Eyes of Horus | 4/1 |
| Sekhmet Kamikaze | 4/0 |
| Anhur Warden | 4/4 |
| Raijin Tempest | 13/3 |
| Hades Stealthray | 10/0 |
| Suzaku Komet | 3/1 |
| Qinglong | 11/0 |
| Baihu | 11/2 |
| Pandora | 8/4 |
| Excalibur | 14/0 |
| Longinus | 8/0 |
| Thor | 9/0 |
| Artemis | 9/4 |
| Agni | 12/1 |
| Loki | 8/3 |

</details>

<details><summary>Raijin Tempest</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 11/10 |
| Fenrir Vanguard | 10/8 |
| Xuanwu Fortress | 9/9 |
| Sarama Warhound | 10/5 |
| Eir's Blessing | 11/8 |
| Huma Enforcer | 10/6 |
| Garuda Talon | 5/10 |
| Raiju's Whisper | 12/7 |
| Simurgh Skylord | 10/8 |
| Tiamat Echo | 13/5 |
| Houyi Quiver | 13/5 |
| Pashupata Annihilator | 13/5 |
| Typhon Disruptor | 5/11 |
| Skadi Hunter | 10/5 |
| Thoth Oracler | 9/9 |
| Rostam Breacher | 9/12 |
| Heimdall Bastion | 4/13 |
| Dhanvantari Lifeweaver | 9/16 |
| Hermes Strider | 9/8 |
| Gungnir's Tip | 9/13 |
| Yatagarasu Pathfinder | 12/11 |
| Eyes of Horus | 13/1 |
| Sekhmet Kamikaze | 7/1 |
| Anhur Warden | 13/3 |
| Raijin Tempest | 11/11 |
| Hades Stealthray | 7/7 |
| Suzaku Komet | 8/0 |
| Qinglong | 8/8 |
| Baihu | 9/11 |
| Pandora | 12/5 |
| Excalibur | 10/11 |
| Longinus | 13/5 |
| Thor | 7/9 |
| Artemis | 13/6 |
| Agni | 11/9 |
| Loki | 10/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/11 |
| Fenrir Vanguard | 8/8 |
| Xuanwu Fortress | 9/13 |
| Sarama Warhound | 5/10 |
| Eir's Blessing | 8/11 |
| Huma Enforcer | 6/10 |
| Garuda Talon | 10/8 |
| Raiju's Whisper | 7/12 |
| Simurgh Skylord | 8/10 |
| Tiamat Echo | 8/8 |
| Houyi Quiver | 8/7 |
| Pashupata Annihilator | 8/6 |
| Typhon Disruptor | 11/7 |
| Skadi Hunter | 5/6 |
| Thoth Oracler | 9/9 |
| Rostam Breacher | 12/11 |
| Heimdall Bastion | 13/12 |
| Dhanvantari Lifeweaver | 16/12 |
| Hermes Strider | 8/9 |
| Gungnir's Tip | 13/6 |
| Yatagarasu Pathfinder | 11/12 |
| Eyes of Horus | 1/12 |
| Sekhmet Kamikaze | 1/7 |
| Anhur Warden | 3/13 |
| Raijin Tempest | 11/11 |
| Hades Stealthray | 7/7 |
| Suzaku Komet | 0/8 |
| Qinglong | 8/8 |
| Baihu | 11/9 |
| Pandora | 5/12 |
| Excalibur | 11/6 |
| Longinus | 8/6 |
| Thor | 9/7 |
| Artemis | 6/13 |
| Agni | 9/8 |
| Loki | 8/10 |

</details>

<details><summary>Hades Stealthray</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 7/7 |
| Fenrir Vanguard | 7/4 |
| Xuanwu Fortress | 3/3 |
| Sarama Warhound | 7/2 |
| Eir's Blessing | 7/5 |
| Huma Enforcer | 6/3 |
| Garuda Talon | 2/7 |
| Raiju's Whisper | 7/4 |
| Simurgh Skylord | 5/5 |
| Tiamat Echo | 10/2 |
| Houyi Quiver | 10/2 |
| Pashupata Annihilator | 10/2 |
| Typhon Disruptor | 1/7 |
| Skadi Hunter | 7/2 |
| Thoth Oracler | 6/6 |
| Rostam Breacher | 6/9 |
| Heimdall Bastion | 0/10 |
| Dhanvantari Lifeweaver | 3/13 |
| Hermes Strider | 6/5 |
| Gungnir's Tip | 6/10 |
| Yatagarasu Pathfinder | 7/8 |
| Eyes of Horus | 9/0 |
| Sekhmet Kamikaze | 4/0 |
| Anhur Warden | 10/0 |
| Raijin Tempest | 7/7 |
| Hades Stealthray | 4/4 |
| Suzaku Komet | 5/0 |
| Qinglong | 3/5 |
| Baihu | 6/7 |
| Pandora | 9/2 |
| Excalibur | 7/8 |
| Longinus | 10/2 |
| Thor | 3/5 |
| Artemis | 8/3 |
| Agni | 8/6 |
| Loki | 7/5 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 7/7 |
| Fenrir Vanguard | 4/5 |
| Xuanwu Fortress | 3/8 |
| Sarama Warhound | 2/7 |
| Eir's Blessing | 5/7 |
| Huma Enforcer | 3/6 |
| Garuda Talon | 7/5 |
| Raiju's Whisper | 4/7 |
| Simurgh Skylord | 5/5 |
| Tiamat Echo | 8/5 |
| Houyi Quiver | 8/4 |
| Pashupata Annihilator | 8/3 |
| Typhon Disruptor | 7/3 |
| Skadi Hunter | 2/3 |
| Thoth Oracler | 6/6 |
| Rostam Breacher | 9/8 |
| Heimdall Bastion | 10/8 |
| Dhanvantari Lifeweaver | 13/6 |
| Hermes Strider | 5/6 |
| Gungnir's Tip | 10/3 |
| Yatagarasu Pathfinder | 8/7 |
| Eyes of Horus | 0/9 |
| Sekhmet Kamikaze | 0/4 |
| Anhur Warden | 0/10 |
| Raijin Tempest | 7/7 |
| Hades Stealthray | 4/4 |
| Suzaku Komet | 0/5 |
| Qinglong | 5/3 |
| Baihu | 7/6 |
| Pandora | 2/9 |
| Excalibur | 8/3 |
| Longinus | 8/3 |
| Thor | 5/3 |
| Artemis | 3/8 |
| Agni | 6/5 |
| Loki | 5/7 |

</details>

<details><summary>Suzaku Komet</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 0/6 |
| Fenrir Vanguard | 0/5 |
| Xuanwu Fortress | 0/4 |
| Sarama Warhound | 0/3 |
| Eir's Blessing | 0/6 |
| Huma Enforcer | 0/4 |
| Garuda Talon | 0/8 |
| Raiju's Whisper | 0/5 |
| Simurgh Skylord | 0/6 |
| Tiamat Echo | 3/3 |
| Houyi Quiver | 3/3 |
| Pashupata Annihilator | 3/3 |
| Typhon Disruptor | 0/7 |
| Skadi Hunter | 0/3 |
| Thoth Oracler | 0/7 |
| Rostam Breacher | 0/10 |
| Heimdall Bastion | 0/11 |
| Dhanvantari Lifeweaver | 0/14 |
| Hermes Strider | 0/6 |
| Gungnir's Tip | 0/11 |
| Yatagarasu Pathfinder | 0/9 |
| Eyes of Horus | 2/0 |
| Sekhmet Kamikaze | 0/0 |
| Anhur Warden | 3/1 |
| Raijin Tempest | 0/8 |
| Hades Stealthray | 0/5 |
| Suzaku Komet | 0/0 |
| Qinglong | 0/6 |
| Baihu | 0/11 |
| Pandora | 2/3 |
| Excalibur | 0/9 |
| Longinus | 3/3 |
| Thor | 0/6 |
| Artemis | 1/4 |
| Agni | 1/7 |
| Loki | 0/6 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 6/0 |
| Fenrir Vanguard | 5/0 |
| Xuanwu Fortress | 4/1 |
| Sarama Warhound | 3/0 |
| Eir's Blessing | 6/0 |
| Huma Enforcer | 4/0 |
| Garuda Talon | 8/0 |
| Raiju's Whisper | 5/0 |
| Simurgh Skylord | 6/0 |
| Tiamat Echo | 8/0 |
| Houyi Quiver | 8/0 |
| Pashupata Annihilator | 8/0 |
| Typhon Disruptor | 7/0 |
| Skadi Hunter | 3/0 |
| Thoth Oracler | 7/0 |
| Rostam Breacher | 10/1 |
| Heimdall Bastion | 11/1 |
| Dhanvantari Lifeweaver | 14/0 |
| Hermes Strider | 6/0 |
| Gungnir's Tip | 11/0 |
| Yatagarasu Pathfinder | 9/0 |
| Eyes of Horus | 0/2 |
| Sekhmet Kamikaze | 0/0 |
| Anhur Warden | 1/3 |
| Raijin Tempest | 8/0 |
| Hades Stealthray | 5/0 |
| Suzaku Komet | 0/0 |
| Qinglong | 6/0 |
| Baihu | 11/0 |
| Pandora | 3/2 |
| Excalibur | 9/0 |
| Longinus | 8/0 |
| Thor | 6/0 |
| Artemis | 4/1 |
| Agni | 7/0 |
| Loki | 6/0 |

</details>

<details><summary>Qinglong</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 11/8 |
| Fenrir Vanguard | 11/5 |
| Xuanwu Fortress | 9/4 |
| Sarama Warhound | 11/1 |
| Eir's Blessing | 11/5 |
| Huma Enforcer | 11/3 |
| Garuda Talon | 7/7 |
| Raiju's Whisper | 11/4 |
| Simurgh Skylord | 10/4 |
| Tiamat Echo | 11/1 |
| Houyi Quiver | 11/1 |
| Pashupata Annihilator | 11/1 |
| Typhon Disruptor | 2/8 |
| Skadi Hunter | 11/2 |
| Thoth Oracler | 11/4 |
| Rostam Breacher | 11/8 |
| Heimdall Bastion | 5/9 |
| Dhanvantari Lifeweaver | 9/12 |
| Hermes Strider | 11/4 |
| Gungnir's Tip | 11/9 |
| Yatagarasu Pathfinder | 11/8 |
| Eyes of Horus | 11/0 |
| Sekhmet Kamikaze | 9/0 |
| Anhur Warden | 11/0 |
| Raijin Tempest | 8/8 |
| Hades Stealthray | 5/3 |
| Suzaku Komet | 6/0 |
| Qinglong | 4/4 |
| Baihu | 11/5 |
| Pandora | 11/1 |
| Excalibur | 11/8 |
| Longinus | 11/1 |
| Thor | 4/4 |
| Artemis | 9/2 |
| Agni | 11/6 |
| Loki | 11/1 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 8/11 |
| Fenrir Vanguard | 5/10 |
| Xuanwu Fortress | 4/11 |
| Sarama Warhound | 1/11 |
| Eir's Blessing | 5/11 |
| Huma Enforcer | 3/11 |
| Garuda Talon | 7/10 |
| Raiju's Whisper | 4/11 |
| Simurgh Skylord | 4/10 |
| Tiamat Echo | 8/6 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/4 |
| Typhon Disruptor | 8/4 |
| Skadi Hunter | 2/8 |
| Thoth Oracler | 4/11 |
| Rostam Breacher | 8/11 |
| Heimdall Bastion | 9/11 |
| Dhanvantari Lifeweaver | 12/11 |
| Hermes Strider | 4/11 |
| Gungnir's Tip | 9/8 |
| Yatagarasu Pathfinder | 8/11 |
| Eyes of Horus | 0/11 |
| Sekhmet Kamikaze | 0/9 |
| Anhur Warden | 0/11 |
| Raijin Tempest | 8/8 |
| Hades Stealthray | 3/5 |
| Suzaku Komet | 0/6 |
| Qinglong | 4/4 |
| Baihu | 5/11 |
| Pandora | 1/11 |
| Excalibur | 8/8 |
| Longinus | 8/4 |
| Thor | 4/4 |
| Artemis | 2/9 |
| Agni | 6/10 |
| Loki | 1/11 |

</details>

<details><summary>Baihu</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 11/9 |
| Fenrir Vanguard | 11/6 |
| Xuanwu Fortress | 11/5 |
| Sarama Warhound | 11/6 |
| Eir's Blessing | 11/7 |
| Huma Enforcer | 11/7 |
| Garuda Talon | 5/9 |
| Raiju's Whisper | 11/6 |
| Simurgh Skylord | 11/7 |
| Tiamat Echo | 11/4 |
| Houyi Quiver | 11/4 |
| Pashupata Annihilator | 11/4 |
| Typhon Disruptor | 2/9 |
| Skadi Hunter | 11/4 |
| Thoth Oracler | 11/8 |
| Rostam Breacher | 11/11 |
| Heimdall Bastion | 3/12 |
| Dhanvantari Lifeweaver | 11/15 |
| Hermes Strider | 11/7 |
| Gungnir's Tip | 11/12 |
| Yatagarasu Pathfinder | 11/10 |
| Eyes of Horus | 11/0 |
| Sekhmet Kamikaze | 7/0 |
| Anhur Warden | 11/2 |
| Raijin Tempest | 11/9 |
| Hades Stealthray | 7/6 |
| Suzaku Komet | 11/0 |
| Qinglong | 5/11 |
| Baihu | 11/11 |
| Pandora | 11/4 |
| Excalibur | 11/10 |
| Longinus | 11/4 |
| Thor | 4/7 |
| Artemis | 11/5 |
| Agni | 11/8 |
| Loki | 11/7 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 9/11 |
| Fenrir Vanguard | 6/11 |
| Xuanwu Fortress | 5/11 |
| Sarama Warhound | 6/11 |
| Eir's Blessing | 7/11 |
| Huma Enforcer | 7/11 |
| Garuda Talon | 9/11 |
| Raiju's Whisper | 6/11 |
| Simurgh Skylord | 7/11 |
| Tiamat Echo | 8/11 |
| Houyi Quiver | 8/7 |
| Pashupata Annihilator | 8/6 |
| Typhon Disruptor | 9/4 |
| Skadi Hunter | 4/6 |
| Thoth Oracler | 8/11 |
| Rostam Breacher | 11/11 |
| Heimdall Bastion | 12/11 |
| Dhanvantari Lifeweaver | 15/11 |
| Hermes Strider | 7/11 |
| Gungnir's Tip | 12/6 |
| Yatagarasu Pathfinder | 10/11 |
| Eyes of Horus | 0/11 |
| Sekhmet Kamikaze | 0/7 |
| Anhur Warden | 2/11 |
| Raijin Tempest | 9/11 |
| Hades Stealthray | 6/7 |
| Suzaku Komet | 0/11 |
| Qinglong | 11/5 |
| Baihu | 11/11 |
| Pandora | 4/11 |
| Excalibur | 10/6 |
| Longinus | 8/6 |
| Thor | 7/4 |
| Artemis | 5/11 |
| Agni | 8/11 |
| Loki | 7/11 |

</details>

<details><summary>Pandora</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 5/10 |
| Fenrir Vanguard | 5/9 |
| Xuanwu Fortress | 2/9 |
| Sarama Warhound | 5/8 |
| Eir's Blessing | 5/10 |
| Huma Enforcer | 4/9 |
| Garuda Talon | 0/12 |
| Raiju's Whisper | 5/9 |
| Simurgh Skylord | 3/10 |
| Tiamat Echo | 8/7 |
| Houyi Quiver | 8/7 |
| Pashupata Annihilator | 8/7 |
| Typhon Disruptor | 0/11 |
| Skadi Hunter | 5/7 |
| Thoth Oracler | 4/9 |
| Rostam Breacher | 4/14 |
| Heimdall Bastion | 0/15 |
| Dhanvantari Lifeweaver | 2/18 |
| Hermes Strider | 4/10 |
| Gungnir's Tip | 4/15 |
| Yatagarasu Pathfinder | 5/13 |
| Eyes of Horus | 8/3 |
| Sekhmet Kamikaze | 2/3 |
| Anhur Warden | 8/4 |
| Raijin Tempest | 5/12 |
| Hades Stealthray | 2/9 |
| Suzaku Komet | 3/2 |
| Qinglong | 1/11 |
| Baihu | 4/11 |
| Pandora | 7/7 |
| Excalibur | 5/13 |
| Longinus | 8/7 |
| Thor | 1/9 |
| Artemis | 6/8 |
| Agni | 6/11 |
| Loki | 5/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/5 |
| Fenrir Vanguard | 9/3 |
| Xuanwu Fortress | 9/7 |
| Sarama Warhound | 8/5 |
| Eir's Blessing | 10/5 |
| Huma Enforcer | 9/4 |
| Garuda Talon | 12/3 |
| Raiju's Whisper | 9/5 |
| Simurgh Skylord | 10/3 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 11/1 |
| Skadi Hunter | 7/1 |
| Thoth Oracler | 9/4 |
| Rostam Breacher | 14/6 |
| Heimdall Bastion | 15/6 |
| Dhanvantari Lifeweaver | 18/5 |
| Hermes Strider | 10/4 |
| Gungnir's Tip | 15/1 |
| Yatagarasu Pathfinder | 13/5 |
| Eyes of Horus | 3/6 |
| Sekhmet Kamikaze | 3/2 |
| Anhur Warden | 4/8 |
| Raijin Tempest | 12/5 |
| Hades Stealthray | 9/2 |
| Suzaku Komet | 2/3 |
| Qinglong | 11/1 |
| Baihu | 11/4 |
| Pandora | 7/7 |
| Excalibur | 13/1 |
| Longinus | 8/1 |
| Thor | 9/1 |
| Artemis | 8/6 |
| Agni | 11/3 |
| Loki | 8/5 |

</details>

<details><summary>Excalibur</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 11/3 |
| Fenrir Vanguard | 11/3 |
| Xuanwu Fortress | 9/2 |
| Sarama Warhound | 11/3 |
| Eir's Blessing | 11/4 |
| Huma Enforcer | 10/4 |
| Garuda Talon | 6/6 |
| Raiju's Whisper | 12/3 |
| Simurgh Skylord | 10/4 |
| Tiamat Echo | 14/1 |
| Houyi Quiver | 14/1 |
| Pashupata Annihilator | 14/1 |
| Typhon Disruptor | 5/5 |
| Skadi Hunter | 11/1 |
| Thoth Oracler | 10/5 |
| Rostam Breacher | 10/8 |
| Heimdall Bastion | 4/9 |
| Dhanvantari Lifeweaver | 9/12 |
| Hermes Strider | 10/4 |
| Gungnir's Tip | 10/9 |
| Yatagarasu Pathfinder | 12/7 |
| Eyes of Horus | 14/0 |
| Sekhmet Kamikaze | 8/0 |
| Anhur Warden | 14/0 |
| Raijin Tempest | 11/6 |
| Hades Stealthray | 8/3 |
| Suzaku Komet | 9/0 |
| Qinglong | 8/8 |
| Baihu | 10/6 |
| Pandora | 13/1 |
| Excalibur | 11/7 |
| Longinus | 14/1 |
| Thor | 7/4 |
| Artemis | 13/2 |
| Agni | 12/5 |
| Loki | 11/4 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 8/11 |
| Fenrir Vanguard | 7/9 |
| Xuanwu Fortress | 9/14 |
| Sarama Warhound | 7/11 |
| Eir's Blessing | 8/11 |
| Huma Enforcer | 8/10 |
| Garuda Talon | 10/9 |
| Raiju's Whisper | 7/12 |
| Simurgh Skylord | 8/10 |
| Tiamat Echo | 8/9 |
| Houyi Quiver | 8/8 |
| Pashupata Annihilator | 8/7 |
| Typhon Disruptor | 9/7 |
| Skadi Hunter | 5/7 |
| Thoth Oracler | 9/10 |
| Rostam Breacher | 12/12 |
| Heimdall Bastion | 13/12 |
| Dhanvantari Lifeweaver | 16/12 |
| Hermes Strider | 8/10 |
| Gungnir's Tip | 13/7 |
| Yatagarasu Pathfinder | 11/12 |
| Eyes of Horus | 1/12 |
| Sekhmet Kamikaze | 1/8 |
| Anhur Warden | 3/14 |
| Raijin Tempest | 10/11 |
| Hades Stealthray | 7/8 |
| Suzaku Komet | 0/9 |
| Qinglong | 11/8 |
| Baihu | 11/10 |
| Pandora | 5/13 |
| Excalibur | 11/7 |
| Longinus | 8/7 |
| Thor | 8/7 |
| Artemis | 6/13 |
| Agni | 9/9 |
| Loki | 8/11 |

</details>

<details><summary>Longinus</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/3 |
| Fenrir Vanguard | 8/3 |
| Xuanwu Fortress | 8/2 |
| Sarama Warhound | 8/1 |
| Eir's Blessing | 8/4 |
| Huma Enforcer | 8/2 |
| Garuda Talon | 8/6 |
| Raiju's Whisper | 8/3 |
| Simurgh Skylord | 8/4 |
| Tiamat Echo | 8/1 |
| Houyi Quiver | 8/1 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 8/5 |
| Skadi Hunter | 8/1 |
| Thoth Oracler | 8/5 |
| Rostam Breacher | 8/8 |
| Heimdall Bastion | 8/9 |
| Dhanvantari Lifeweaver | 8/12 |
| Hermes Strider | 8/4 |
| Gungnir's Tip | 8/9 |
| Yatagarasu Pathfinder | 8/7 |
| Eyes of Horus | 8/0 |
| Sekhmet Kamikaze | 8/0 |
| Anhur Warden | 8/0 |
| Raijin Tempest | 8/6 |
| Hades Stealthray | 8/3 |
| Suzaku Komet | 8/0 |
| Qinglong | 8/4 |
| Baihu | 8/6 |
| Pandora | 8/1 |
| Excalibur | 8/7 |
| Longinus | 8/1 |
| Thor | 8/4 |
| Artemis | 8/2 |
| Agni | 8/5 |
| Loki | 8/4 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/5 |
| Fenrir Vanguard | 10/3 |
| Xuanwu Fortress | 9/6 |
| Sarama Warhound | 8/5 |
| Eir's Blessing | 11/5 |
| Huma Enforcer | 9/4 |
| Garuda Talon | 13/3 |
| Raiju's Whisper | 10/5 |
| Simurgh Skylord | 11/3 |
| Tiamat Echo | 8/3 |
| Houyi Quiver | 8/2 |
| Pashupata Annihilator | 8/1 |
| Typhon Disruptor | 12/1 |
| Skadi Hunter | 8/1 |
| Thoth Oracler | 9/4 |
| Rostam Breacher | 15/6 |
| Heimdall Bastion | 16/6 |
| Dhanvantari Lifeweaver | 19/4 |
| Hermes Strider | 11/4 |
| Gungnir's Tip | 16/1 |
| Yatagarasu Pathfinder | 14/5 |
| Eyes of Horus | 4/4 |
| Sekhmet Kamikaze | 4/2 |
| Anhur Warden | 4/8 |
| Raijin Tempest | 13/5 |
| Hades Stealthray | 10/2 |
| Suzaku Komet | 3/3 |
| Qinglong | 11/1 |
| Baihu | 11/4 |
| Pandora | 8/7 |
| Excalibur | 14/1 |
| Longinus | 8/1 |
| Thor | 9/1 |
| Artemis | 9/6 |
| Agni | 12/3 |
| Loki | 8/5 |

</details>

<details><summary>Thor</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 9/7 |
| Fenrir Vanguard | 8/4 |
| Xuanwu Fortress | 7/3 |
| Sarama Warhound | 8/1 |
| Eir's Blessing | 9/4 |
| Huma Enforcer | 8/2 |
| Garuda Talon | 3/6 |
| Raiju's Whisper | 9/3 |
| Simurgh Skylord | 8/4 |
| Tiamat Echo | 9/1 |
| Houyi Quiver | 9/1 |
| Pashupata Annihilator | 9/1 |
| Typhon Disruptor | 1/7 |
| Skadi Hunter | 8/1 |
| Thoth Oracler | 7/3 |
| Rostam Breacher | 7/8 |
| Heimdall Bastion | 2/9 |
| Dhanvantari Lifeweaver | 7/12 |
| Hermes Strider | 7/4 |
| Gungnir's Tip | 7/9 |
| Yatagarasu Pathfinder | 9/7 |
| Eyes of Horus | 9/0 |
| Sekhmet Kamikaze | 5/0 |
| Anhur Warden | 9/0 |
| Raijin Tempest | 9/7 |
| Hades Stealthray | 5/3 |
| Suzaku Komet | 6/0 |
| Qinglong | 4/4 |
| Baihu | 7/4 |
| Pandora | 9/1 |
| Excalibur | 8/7 |
| Longinus | 9/1 |
| Thor | 3/3 |
| Artemis | 9/2 |
| Agni | 9/5 |
| Loki | 8/1 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 7/9 |
| Fenrir Vanguard | 4/6 |
| Xuanwu Fortress | 3/9 |
| Sarama Warhound | 1/8 |
| Eir's Blessing | 4/9 |
| Huma Enforcer | 2/8 |
| Garuda Talon | 6/6 |
| Raiju's Whisper | 3/9 |
| Simurgh Skylord | 4/8 |
| Tiamat Echo | 8/6 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/4 |
| Typhon Disruptor | 7/3 |
| Skadi Hunter | 1/4 |
| Thoth Oracler | 3/7 |
| Rostam Breacher | 8/9 |
| Heimdall Bastion | 9/9 |
| Dhanvantari Lifeweaver | 12/9 |
| Hermes Strider | 4/7 |
| Gungnir's Tip | 9/4 |
| Yatagarasu Pathfinder | 7/9 |
| Eyes of Horus | 0/9 |
| Sekhmet Kamikaze | 0/5 |
| Anhur Warden | 0/9 |
| Raijin Tempest | 7/9 |
| Hades Stealthray | 3/5 |
| Suzaku Komet | 0/6 |
| Qinglong | 4/4 |
| Baihu | 4/7 |
| Pandora | 1/9 |
| Excalibur | 7/4 |
| Longinus | 8/4 |
| Thor | 3/3 |
| Artemis | 2/9 |
| Agni | 5/6 |
| Loki | 1/8 |

</details>

<details><summary>Artemis</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 6/10 |
| Fenrir Vanguard | 6/10 |
| Xuanwu Fortress | 3/9 |
| Sarama Warhound | 6/6 |
| Eir's Blessing | 6/10 |
| Huma Enforcer | 5/8 |
| Garuda Talon | 1/12 |
| Raiju's Whisper | 6/9 |
| Simurgh Skylord | 4/9 |
| Tiamat Echo | 9/6 |
| Houyi Quiver | 9/6 |
| Pashupata Annihilator | 9/6 |
| Typhon Disruptor | 0/12 |
| Skadi Hunter | 6/7 |
| Thoth Oracler | 5/9 |
| Rostam Breacher | 5/13 |
| Heimdall Bastion | 0/14 |
| Dhanvantari Lifeweaver | 3/17 |
| Hermes Strider | 5/9 |
| Gungnir's Tip | 5/14 |
| Yatagarasu Pathfinder | 6/13 |
| Eyes of Horus | 9/2 |
| Sekhmet Kamikaze | 3/2 |
| Anhur Warden | 9/4 |
| Raijin Tempest | 6/13 |
| Hades Stealthray | 3/8 |
| Suzaku Komet | 4/1 |
| Qinglong | 2/9 |
| Baihu | 5/11 |
| Pandora | 8/6 |
| Excalibur | 6/13 |
| Longinus | 9/6 |
| Thor | 2/9 |
| Artemis | 7/7 |
| Agni | 7/11 |
| Loki | 6/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/6 |
| Fenrir Vanguard | 10/4 |
| Xuanwu Fortress | 9/8 |
| Sarama Warhound | 6/6 |
| Eir's Blessing | 10/6 |
| Huma Enforcer | 8/5 |
| Garuda Talon | 12/4 |
| Raiju's Whisper | 9/6 |
| Simurgh Skylord | 9/4 |
| Tiamat Echo | 8/4 |
| Houyi Quiver | 8/3 |
| Pashupata Annihilator | 8/2 |
| Typhon Disruptor | 12/2 |
| Skadi Hunter | 7/2 |
| Thoth Oracler | 9/5 |
| Rostam Breacher | 13/7 |
| Heimdall Bastion | 14/7 |
| Dhanvantari Lifeweaver | 17/6 |
| Hermes Strider | 9/5 |
| Gungnir's Tip | 14/2 |
| Yatagarasu Pathfinder | 13/6 |
| Eyes of Horus | 2/7 |
| Sekhmet Kamikaze | 2/3 |
| Anhur Warden | 4/9 |
| Raijin Tempest | 13/6 |
| Hades Stealthray | 8/3 |
| Suzaku Komet | 1/4 |
| Qinglong | 9/2 |
| Baihu | 11/5 |
| Pandora | 6/8 |
| Excalibur | 13/2 |
| Longinus | 8/2 |
| Thor | 9/2 |
| Artemis | 7/7 |
| Agni | 11/4 |
| Loki | 8/6 |

</details>

<details><summary>Agni</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 9/5 |
| Fenrir Vanguard | 9/5 |
| Xuanwu Fortress | 7/4 |
| Sarama Warhound | 9/5 |
| Eir's Blessing | 9/6 |
| Huma Enforcer | 8/6 |
| Garuda Talon | 4/8 |
| Raiju's Whisper | 10/5 |
| Simurgh Skylord | 8/6 |
| Tiamat Echo | 12/3 |
| Houyi Quiver | 12/3 |
| Pashupata Annihilator | 12/3 |
| Typhon Disruptor | 3/7 |
| Skadi Hunter | 9/3 |
| Thoth Oracler | 8/7 |
| Rostam Breacher | 8/10 |
| Heimdall Bastion | 2/11 |
| Dhanvantari Lifeweaver | 7/14 |
| Hermes Strider | 8/6 |
| Gungnir's Tip | 8/11 |
| Yatagarasu Pathfinder | 10/9 |
| Eyes of Horus | 12/0 |
| Sekhmet Kamikaze | 6/0 |
| Anhur Warden | 12/1 |
| Raijin Tempest | 9/8 |
| Hades Stealthray | 6/5 |
| Suzaku Komet | 7/0 |
| Qinglong | 6/10 |
| Baihu | 8/11 |
| Pandora | 11/3 |
| Excalibur | 9/9 |
| Longinus | 12/3 |
| Thor | 5/6 |
| Artemis | 11/4 |
| Agni | 10/7 |
| Loki | 9/6 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/9 |
| Fenrir Vanguard | 8/7 |
| Xuanwu Fortress | 9/12 |
| Sarama Warhound | 8/9 |
| Eir's Blessing | 9/9 |
| Huma Enforcer | 9/8 |
| Garuda Talon | 11/7 |
| Raiju's Whisper | 8/10 |
| Simurgh Skylord | 9/8 |
| Tiamat Echo | 8/7 |
| Houyi Quiver | 8/6 |
| Pashupata Annihilator | 8/5 |
| Typhon Disruptor | 11/5 |
| Skadi Hunter | 6/5 |
| Thoth Oracler | 9/8 |
| Rostam Breacher | 13/10 |
| Heimdall Bastion | 14/10 |
| Dhanvantari Lifeweaver | 17/10 |
| Hermes Strider | 9/8 |
| Gungnir's Tip | 14/5 |
| Yatagarasu Pathfinder | 12/10 |
| Eyes of Horus | 2/10 |
| Sekhmet Kamikaze | 2/6 |
| Anhur Warden | 4/12 |
| Raijin Tempest | 11/9 |
| Hades Stealthray | 8/6 |
| Suzaku Komet | 1/7 |
| Qinglong | 11/6 |
| Baihu | 11/8 |
| Pandora | 6/11 |
| Excalibur | 12/5 |
| Longinus | 8/5 |
| Thor | 9/5 |
| Artemis | 7/11 |
| Agni | 10/7 |
| Loki | 8/9 |

</details>

<details><summary>Loki</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus Devastator | 8/10 |
| Fenrir Vanguard | 8/7 |
| Xuanwu Fortress | 4/9 |
| Sarama Warhound | 8/7 |
| Eir's Blessing | 8/8 |
| Huma Enforcer | 7/8 |
| Garuda Talon | 3/10 |
| Raiju's Whisper | 8/7 |
| Simurgh Skylord | 6/8 |
| Tiamat Echo | 8/5 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/5 |
| Typhon Disruptor | 0/10 |
| Skadi Hunter | 8/5 |
| Thoth Oracler | 7/9 |
| Rostam Breacher | 7/12 |
| Heimdall Bastion | 1/13 |
| Dhanvantari Lifeweaver | 4/16 |
| Hermes Strider | 7/8 |
| Gungnir's Tip | 7/13 |
| Yatagarasu Pathfinder | 8/11 |
| Eyes of Horus | 8/1 |
| Sekhmet Kamikaze | 5/1 |
| Anhur Warden | 8/3 |
| Raijin Tempest | 8/10 |
| Hades Stealthray | 5/7 |
| Suzaku Komet | 6/0 |
| Qinglong | 1/11 |
| Baihu | 7/11 |
| Pandora | 8/5 |
| Excalibur | 8/11 |
| Longinus | 8/5 |
| Thor | 1/8 |
| Artemis | 8/6 |
| Agni | 8/9 |
| Loki | 8/8 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus Devastator | 10/8 |
| Fenrir Vanguard | 7/6 |
| Xuanwu Fortress | 9/8 |
| Sarama Warhound | 7/8 |
| Eir's Blessing | 8/8 |
| Huma Enforcer | 8/7 |
| Garuda Talon | 10/6 |
| Raiju's Whisper | 7/8 |
| Simurgh Skylord | 8/6 |
| Tiamat Echo | 8/6 |
| Houyi Quiver | 8/5 |
| Pashupata Annihilator | 8/4 |
| Typhon Disruptor | 10/1 |
| Skadi Hunter | 5/4 |
| Thoth Oracler | 9/7 |
| Rostam Breacher | 12/8 |
| Heimdall Bastion | 13/8 |
| Dhanvantari Lifeweaver | 16/7 |
| Hermes Strider | 8/7 |
| Gungnir's Tip | 13/4 |
| Yatagarasu Pathfinder | 11/8 |
| Eyes of Horus | 1/8 |
| Sekhmet Kamikaze | 1/5 |
| Anhur Warden | 3/8 |
| Raijin Tempest | 10/8 |
| Hades Stealthray | 7/5 |
| Suzaku Komet | 0/6 |
| Qinglong | 11/1 |
| Baihu | 11/7 |
| Pandora | 5/8 |
| Excalibur | 11/4 |
| Longinus | 8/4 |
| Thor | 8/1 |
| Artemis | 6/8 |
| Agni | 9/6 |
| Loki | 8/8 |

</details>

