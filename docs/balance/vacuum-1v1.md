# Vacuum 1v1 — remaining HP

Generated: 2026-09-16T19:58:31.840Z

## Assumptions

- Two units only, same lane, no cards, no Cover/Flank relocation, no allied Support Fire.
- Artillery / Air Strike stay on Support; everyone else on Frontline.
- **One engagement:** attacker volley (ATK + Aggressive + AP) → defender counter (ATK + Retaliate + AP) → attacker missiles (50% armor rounded down, no AP).
- **Two-round exchange:** that engagement, then roles reverse with leftover HP if both still live.
- Cell mark: `W` attacker lives & defender dies, `L` attacker dies, `X` both die, `·` both live.

## Roster / short codes

| Code | Name | Class | Cost | HP | ATK | Armor | AP | Keywords |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Zeus | Zeus | Tank | 6 | 10 | 3 | 6 | 2 | cover, missile 5 |
| Apex | Apex Destroyer | Tank | 6 | 10 | 3 | 3 | 6 | aggressive 4 |
| Iron | Iron Bastion | Tank | 6 | 10 | 2 | 8 | 0 | cover, retaliate 5 |
| Jackal | Jackal Scout | Light Vehicle | 4 | 10 | 3 | 2 | 3 | flank, blitz |
| Nomad | Nomad Supply Buggy | Light Vehicle | 5 | 12 | 4 | 2 | 2 | supportFire 2, flank |
| Mirage | Mirage Humvee | Light Vehicle | 3 | 11 | 4 | 3 | 2 | cover |
| Viper | Viper Gunship | Helicopter | 5 | 13 | 5 | 2 | 3 | blitz, retaliate 3 |
| Hornet | Hornet Interceptor | Helicopter | 4 | 10 | 6 | 2 | 1 | blitz, missile 4 |
| Falcon | Falcon Dropship | Helicopter | 4 | 14 | 5 | 1 | 1 | supportFire 2, blitz |
| Manticor | Manticore MLRS | Artillery | 5 | 8 | 5 | 0 | 5 | artillery, missile 5 |
| Sentinel | Sentinel Battery | Artillery | 4 | 8 | 6 | 0 | 5 | artillery, cover |
| Siege | Siege Howitzer | Artillery | 5 | 8 | 7 | 0 | 7 | artillery |
| Aegis | Aegis | Robot | 6 | 12 | 4 | 4 | 3 | retaliate 2 |
| Stalker | Stalker Biped | Robot | 5 | 10 | 3 | 3 | 3 | aggressive 4 |
| Ironclad | Ironclad Goliath | Robot | 6 | 11 | 4 | 4 | 4 | supportFire 2 |
| Exosuit | Exosuit Breacher | Armored Infantry | 4 | 18 | 2 | 0 | 8 | retaliate 2, cover |
| Trench | Trench Guard | Armored Infantry | 5 | 20 | 1 | 0 | 0 | retaliate 8 |
| Line | Line Combat Medic | Armored Infantry | 4 | 19 | 4 | 0 | 0 | supportFire 2, retaliate 3 |
| Phantom | Phantom Speeder | Motorcycle | 3 | 14 | 4 | 1 | 4 | flank, blitz |
| Death | Death Rider | Motorcycle | 5 | 16 | 5 | 1 | 4 | aggressive 3, cover |
| Scout | Scout Biker | Motorcycle | 4 | 14 | 4 | 2 | 2 | supportFire 2, flank |
| Recon | Recon Eye | Drone | 2 | 4 | 2 | 0 | 0 | blitz, missile 3 |
| Kamikaze | Kamikaze Hunter | Drone | 3 | 4 | 7 | 0 | 6 | blitz, cover |
| Drone | Aegis Support Drone | Drone | 2 | 5 | 0 | 1 | 0 | blitz, supportFire 3 |
| Tempest | Tempest Strike Bomber | Jet Plane | 4 | 13 | 3 | 3 | 2 | jetPlane, missile 4 |
| Stealthr | Stealthray Bomber | Jet Plane | 6 | 12 | 6 | 1 | 3 | jetPlane, flank |
| Komet | Komet Fighter | Jet Plane | 6 | 3 | 8 | 0 | 8 | jetPlane, blitz |

## One engagement (row attacks first)

### Remaining HP after 1 engagement

Ô: `HP attacker / HP defender` sau combat. 0 = chết.

| Hàng = attacker | Zeus | Apex | Iron | Jackal | Nomad | Mirage | Viper | Hornet | Falcon | Manticor | Sentinel | Siege | Aegis | Stalker | Ironclad | Exosuit | Trench | Line | Phantom | Death | Scout | Recon | Kamikaze | Drone | Tempest | Stealthr | Komet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zeus | 10/8 · | 7/4 · | 9/9 · | 10/3 · | 10/5 · | 10/5 · | 5/6 · | 9/3 · | 10/6 · | 10/0 W | 10/0 W | 10/0 W | 7/8 · | 10/4 · | 8/7 · | 6/10 · | 7/12 · | 9/11 · | 8/6 · | 7/8 · | 10/7 · | 10/0 W | 3/0 W | 10/0 W | 10/7 · | 7/4 · | 2/0 W |
| Apex | 8/3 · | 7/3 · | 6/5 · | 7/3 · | 7/5 · | 7/4 · | 2/6 · | 6/3 · | 7/7 · | 10/1 · | 10/1 · | 10/1 · | 4/5 · | 7/3 · | 6/4 · | 6/11 · | 4/13 · | 6/12 · | 6/7 · | 5/9 · | 7/7 · | 10/0 W | 3/0 W | 10/0 W | 8/6 · | 4/5 · | 2/0 W |
| Iron | 10/10 · | 9/10 · | 10/10 · | 10/10 · | 10/12 · | 10/11 · | 7/13 · | 10/10 · | 10/13 · | 10/6 · | 10/6 · | 10/6 · | 9/12 · | 10/10 · | 10/11 · | 6/16 · | 9/18 · | 10/17 · | 10/13 · | 9/15 · | 10/14 · | 10/2 · | 5/2 · | 10/4 · | 10/13 · | 9/11 · | 2/1 · |
| Jackal | 7/10 · | 7/7 · | 5/10 · | 7/7 · | 6/9 · | 6/8 · | 2/10 · | 5/7 · | 6/11 · | 10/5 · | 10/5 · | 10/5 · | 4/10 · | 7/7 · | 6/9 · | 6/15 · | 3/17 · | 5/16 · | 6/11 · | 5/13 · | 6/11 · | 10/1 · | 3/1 · | 10/2 · | 7/10 · | 4/9 · | 2/0 W |
| Nomad | 9/10 · | 9/7 · | 7/10 · | 9/6 · | 8/8 · | 8/8 · | 4/9 · | 7/6 · | 8/10 · | 12/4 · | 12/4 · | 12/4 · | 6/10 · | 9/7 · | 8/9 · | 8/14 · | 5/16 · | 7/15 · | 8/10 · | 7/12 · | 8/10 · | 12/0 W | 5/0 W | 12/1 · | 9/10 · | 6/8 · | 4/0 W |
| Mirage | 9/10 · | 8/7 · | 7/10 · | 8/6 · | 8/8 · | 8/8 · | 3/9 · | 7/6 · | 8/10 · | 11/4 · | 11/4 · | 11/4 · | 5/10 · | 8/7 · | 7/9 · | 7/14 · | 5/16 · | 7/15 · | 7/10 · | 6/12 · | 8/10 · | 11/0 W | 4/0 W | 11/1 · | 9/10 · | 5/8 · | 3/0 W |
| Viper | 10/8 · | 10/5 · | 8/10 · | 10/5 · | 9/7 · | 9/6 · | 5/8 · | 8/5 · | 9/9 · | 13/3 · | 13/3 · | 13/3 · | 7/8 · | 10/5 · | 9/7 · | 9/13 · | 6/15 · | 8/14 · | 9/9 · | 8/11 · | 9/9 · | 13/0 W | 6/0 W | 13/0 W | 10/8 · | 7/7 · | 5/0 W |
| Hornet | 7/8 · | 7/3 · | 5/10 · | 7/2 · | 6/4 · | 6/4 · | 2/5 · | 5/2 · | 6/4 · | 10/0 W | 10/0 W | 10/0 W | 4/7 · | 7/3 · | 6/6 · | 6/8 · | 3/10 · | 5/9 · | 6/4 · | 5/6 · | 6/6 · | 10/0 W | 3/0 W | 10/0 W | 7/6 · | 4/2 · | 2/0 W |
| Falcon | 11/10 · | 11/7 · | 8/10 · | 11/6 · | 10/8 · | 10/8 · | 6/9 · | 8/6 · | 9/9 · | 14/3 · | 14/3 · | 14/3 · | 8/10 · | 11/7 · | 10/9 · | 10/13 · | 6/15 · | 8/14 · | 10/9 · | 9/11 · | 10/10 · | 13/0 W | 7/0 W | 14/0 W | 11/10 · | 8/7 · | 6/0 W |
| Manticor | 8/4 · | 8/1 · | 8/7 · | 8/1 · | 8/3 · | 8/2 · | 8/4 · | 8/1 · | 8/4 · | 8/0 W | 8/0 W | 8/0 W | 8/4 · | 8/1 · | 8/3 · | 8/8 · | 8/10 · | 8/9 · | 8/4 · | 8/6 · | 8/5 · | 8/0 W | 8/0 W | 8/0 W | 8/4 · | 8/2 · | 8/0 W |
| Sentinel | 8/5 · | 8/4 · | 8/7 · | 8/4 · | 8/6 · | 8/5 · | 8/7 · | 8/4 · | 8/8 · | 8/2 · | 8/2 · | 8/2 · | 8/6 · | 8/4 · | 8/5 · | 8/12 · | 8/14 · | 8/13 · | 8/8 · | 8/10 · | 8/8 · | 8/0 W | 8/0 W | 8/0 W | 8/7 · | 8/6 · | 8/0 W |
| Siege | 8/3 · | 8/3 · | 8/4 · | 8/3 · | 8/5 · | 8/4 · | 8/6 · | 8/3 · | 8/7 · | 8/1 · | 8/1 · | 8/1 · | 8/5 · | 8/3 · | 8/4 · | 8/11 · | 8/13 · | 8/12 · | 8/7 · | 8/9 · | 8/7 · | 8/0 W | 8/0 W | 8/0 W | 8/6 · | 8/5 · | 8/0 W |
| Aegis | 11/9 · | 9/6 · | 9/10 · | 10/6 · | 10/8 · | 10/7 · | 5/9 · | 9/6 · | 10/10 · | 12/4 · | 12/4 · | 12/4 · | 7/9 · | 10/6 · | 8/8 · | 8/14 · | 7/16 · | 9/15 · | 8/10 · | 7/12 · | 10/10 · | 12/0 W | 5/0 W | 12/1 · | 11/9 · | 7/8 · | 4/0 W |
| Stalker | 8/6 · | 7/3 · | 6/8 · | 7/3 · | 7/5 · | 7/4 · | 2/6 · | 6/3 · | 7/7 · | 10/1 · | 10/1 · | 10/1 · | 4/6 · | 7/3 · | 6/5 · | 6/11 · | 4/13 · | 6/12 · | 6/7 · | 5/9 · | 7/7 · | 10/0 W | 3/0 W | 10/0 W | 8/6 · | 4/5 · | 2/0 W |
| Ironclad | 10/8 · | 8/6 · | 8/10 · | 9/6 · | 9/8 · | 9/7 · | 4/9 · | 8/6 · | 9/10 · | 11/4 · | 11/4 · | 11/4 · | 6/8 · | 9/6 · | 7/7 · | 7/14 · | 6/16 · | 8/15 · | 7/10 · | 6/12 · | 9/10 · | 11/0 W | 4/0 W | 11/1 · | 10/9 · | 6/8 · | 3/0 W |
| Exosuit | 15/8 · | 15/8 · | 11/8 · | 15/8 · | 14/10 · | 14/9 · | 10/11 · | 12/8 · | 13/12 · | 18/6 · | 18/6 · | 18/6 · | 12/10 · | 15/8 · | 14/9 · | 14/16 · | 9/18 · | 11/17 · | 14/12 · | 13/14 · | 14/12 · | 16/2 · | 11/2 · | 18/3 · | 15/11 · | 12/10 · | 10/1 · |
| Trench | 17/10 · | 17/10 · | 13/10 · | 17/10 · | 16/12 · | 16/11 · | 12/13 · | 14/10 · | 15/14 · | 20/7 · | 20/7 · | 20/7 · | 14/12 · | 17/10 · | 16/11 · | 16/17 · | 11/19 · | 13/18 · | 16/14 · | 15/16 · | 16/14 · | 18/3 · | 13/3 · | 20/5 · | 17/13 · | 14/12 · | 12/2 · |
| Line | 16/10 · | 16/9 · | 12/10 · | 16/8 · | 15/10 · | 15/10 · | 11/11 · | 13/8 · | 14/11 · | 19/4 · | 19/4 · | 19/4 · | 13/12 · | 16/9 · | 15/11 · | 15/14 · | 10/16 · | 12/15 · | 15/11 · | 14/13 · | 15/12 · | 17/0 W | 12/0 W | 19/2 · | 16/12 · | 13/9 · | 11/0 W |
| Phantom | 11/8 · | 11/6 · | 8/10 · | 11/6 · | 10/8 · | 10/7 · | 6/9 · | 8/6 · | 9/10 · | 14/4 · | 14/4 · | 14/4 · | 8/8 · | 11/6 · | 10/7 · | 10/14 · | 6/16 · | 8/15 · | 10/10 · | 9/12 · | 10/10 · | 13/0 W | 7/0 W | 14/1 · | 11/9 · | 8/8 · | 6/0 W |
| Death | 13/4 · | 13/2 · | 10/6 · | 13/2 · | 12/4 · | 12/3 · | 8/5 · | 10/2 · | 11/6 · | 16/0 W | 16/0 W | 16/0 W | 10/4 · | 13/2 · | 12/3 · | 12/10 · | 8/12 · | 10/11 · | 12/6 · | 11/8 · | 12/6 · | 15/0 W | 9/0 W | 16/0 W | 13/5 · | 10/4 · | 8/0 W |
| Scout | 11/10 · | 11/7 · | 9/10 · | 11/6 · | 10/8 · | 10/8 · | 6/9 · | 9/6 · | 10/10 · | 14/4 · | 14/4 · | 14/4 · | 8/10 · | 11/7 · | 10/9 · | 10/14 · | 7/16 · | 9/15 · | 10/10 · | 9/12 · | 10/10 · | 14/0 W | 7/0 W | 14/1 · | 11/10 · | 8/8 · | 6/0 W |
| Recon | 1/10 · | 1/8 · | 0/10 L | 1/8 · | 0/12 L | 0/11 L | 0/13 L | 0/10 L | 0/13 L | 4/3 · | 4/3 · | 4/3 · | 0/12 L | 1/8 · | 0/11 L | 0/16 L | 0/18 L | 0/17 L | 0/13 L | 0/15 L | 0/14 L | 2/0 W | 0/2 L | 4/1 · | 1/11 · | 0/11 L | 0/1 L |
| Kamikaze | 1/3 · | 1/3 · | 0/5 L | 1/3 · | 0/5 L | 0/4 L | 0/6 L | 0/3 L | 0/7 L | 4/1 · | 4/1 · | 4/1 · | 0/5 L | 1/3 · | 0/4 L | 0/11 L | 0/13 L | 0/12 L | 0/7 L | 0/9 L | 0/7 L | 2/0 W | 0/0 X | 4/0 W | 1/6 · | 0/5 L | 0/0 X |
| Drone | 2/10 · | 2/10 · | 0/10 L | 2/10 · | 1/12 · | 1/11 · | 0/13 L | 0/10 L | 0/14 L | 5/8 · | 5/8 · | 5/8 · | 0/12 L | 2/10 · | 1/11 · | 1/18 · | 0/20 L | 0/19 L | 1/14 · | 0/16 L | 1/14 · | 4/4 · | 0/4 L | 5/5 · | 2/13 · | 0/12 L | 0/3 L |
| Tempest | 11/9 · | 10/5 · | 9/10 · | 10/4 · | 10/6 · | 10/6 · | 5/7 · | 9/4 · | 10/7 · | 13/1 · | 13/1 · | 13/1 · | 7/9 · | 10/5 · | 9/8 · | 9/11 · | 7/13 · | 9/12 · | 9/7 · | 8/9 · | 10/8 · | 13/0 W | 6/0 W | 13/0 W | 11/8 · | 7/5 · | 5/0 W |
| Stealthr | 9/7 · | 9/4 · | 6/9 · | 9/4 · | 8/6 · | 8/5 · | 4/7 · | 6/4 · | 7/8 · | 12/2 · | 12/2 · | 12/2 · | 6/7 · | 9/4 · | 8/6 · | 8/12 · | 4/14 · | 6/13 · | 8/8 · | 7/10 · | 8/8 · | 11/0 W | 5/0 W | 12/0 W | 9/7 · | 6/6 · | 4/0 W |
| Komet | 0/2 L | 0/2 L | 0/2 L | 0/2 L | 0/4 L | 0/3 L | 0/5 L | 0/2 L | 0/6 L | 3/0 W | 3/0 W | 3/0 W | 0/4 L | 0/2 L | 0/3 L | 0/10 L | 0/12 L | 0/11 L | 0/6 L | 0/8 L | 0/6 L | 1/0 W | 0/0 X | 3/0 W | 0/5 L | 0/4 L | 0/0 X |

## Two-round exchange (row then column)

Hàng đánh trước, rồi cột đánh lại nếu cả hai còn sống. Ô `B then A` là transpose: xem ô (cột, hàng).

### Remaining HP after A→B exchange

Ô: `HP attacker / HP defender` sau combat. 0 = chết.

| Hàng = attacker | Zeus | Apex | Iron | Jackal | Nomad | Mirage | Viper | Hornet | Falcon | Manticor | Sentinel | Siege | Aegis | Stalker | Ironclad | Exosuit | Trench | Line | Phantom | Death | Scout | Recon | Kamikaze | Drone | Tempest | Stealthr | Komet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zeus | 8/8 · | 0/2 L | 9/9 · | 10/0 W | 10/2 · | 10/3 · | 3/3 · | 8/0 W | 10/3 · | 10/0 W | 10/0 W | 10/0 W | 6/7 · | 6/2 · | 6/6 · | 4/7 · | 7/9 · | 9/8 · | 6/3 · | 1/5 · | 10/4 · | 10/0 W | 3/0 W | 10/0 W | 9/5 · | 4/1 · | 2/0 W |
| Apex | 6/0 W | 0/0 X | 6/4 · | 4/0 W | 4/2 · | 4/1 · | 0/3 L | 2/0 W | 4/4 · | 1/1 · | 4/1 · | 3/1 · | 0/2 L | 0/0 X | 2/1 · | 4/8 · | 4/10 · | 5/9 · | 2/4 · | 0/6 L | 4/4 · | 10/0 W | 3/0 W | 10/0 W | 3/3 · | 0/2 L | 2/0 W |
| Iron | 9/9 · | 4/6 · | 10/10 · | 10/5 · | 10/7 · | 10/7 · | 7/8 · | 10/5 · | 10/7 · | 7/6 · | 7/6 · | 4/6 · | 9/9 · | 8/6 · | 10/8 · | 4/9 · | 9/11 · | 10/10 · | 10/7 · | 5/9 · | 10/9 · | 10/0 W | 0/0 X | 10/0 W | 10/9 · | 8/5 · | 0/0 X |
| Jackal | 0/10 L | 0/4 L | 5/10 · | 4/4 · | 2/6 · | 2/5 · | 0/7 L | 0/4 L | 2/8 · | 1/5 · | 4/5 · | 3/5 · | 0/8 L | 0/4 L | 2/7 · | 4/12 · | 3/14 · | 3/13 · | 2/8 · | 0/10 L | 2/8 · | 10/0 W | 0/0 X | 10/0 W | 1/7 · | 0/6 L | 2/0 W |
| Nomad | 2/10 · | 2/4 · | 7/10 · | 6/2 · | 4/4 · | 4/5 · | 0/5 L | 0/2 L | 4/6 · | 3/4 · | 6/4 · | 5/4 · | 2/8 · | 2/4 · | 4/7 · | 6/10 · | 5/12 · | 5/11 · | 4/6 · | 0/8 L | 4/6 · | 12/0 W | 5/0 W | 12/0 W | 3/7 · | 0/4 L | 4/0 W |
| Mirage | 3/10 · | 1/4 · | 7/10 · | 5/2 · | 5/4 · | 5/5 · | 0/5 L | 0/2 L | 5/6 · | 2/4 · | 5/4 · | 4/4 · | 1/8 · | 1/4 · | 3/7 · | 5/10 · | 5/12 · | 6/11 · | 3/6 · | 0/8 L | 5/6 · | 11/0 W | 4/0 W | 11/0 W | 4/7 · | 0/4 L | 3/0 W |
| Viper | 3/3 · | 3/0 W | 8/7 · | 7/0 W | 5/0 W | 5/0 W | 0/0 X | 3/0 W | 5/1 · | 4/3 · | 7/3 · | 6/3 · | 3/1 · | 3/0 W | 5/0 W | 7/5 · | 6/7 · | 6/6 · | 5/1 · | 0/3 L | 5/1 · | 13/0 W | 6/0 W | 13/0 W | 7/0 W | 1/0 W | 5/0 W |
| Hornet | 0/7 L | 0/0 X | 5/10 · | 4/0 W | 2/0 W | 2/0 W | 0/0 X | 0/0 X | 2/0 W | 10/0 W | 10/0 W | 10/0 W | 0/4 L | 0/0 X | 2/3 · | 4/2 · | 3/4 · | 3/3 · | 2/0 W | 0/0 X | 2/1 · | 10/0 W | 3/0 W | 10/0 W | 1/2 · | 0/0 X | 2/0 W |
| Falcon | 3/10 · | 4/4 · | 7/10 · | 8/2 · | 6/4 · | 6/5 · | 1/5 · | 0/2 L | 4/4 · | 4/3 · | 8/3 · | 7/3 · | 4/8 · | 4/4 · | 6/7 · | 8/8 · | 6/10 · | 5/9 · | 6/4 · | 1/6 · | 6/6 · | 13/0 W | 7/0 W | 14/0 W | 4/7 · | 2/2 · | 6/0 W |
| Manticor | 0/4 L | 1/1 · | 6/7 · | 5/1 · | 4/3 · | 4/2 · | 3/4 · | 0/1 L | 3/4 · | 8/0 W | 8/0 W | 8/0 W | 4/4 · | 1/1 · | 4/3 · | 6/8 · | 7/10 · | 4/9 · | 4/4 · | 0/6 L | 4/5 · | 8/0 W | 8/0 W | 8/0 W | 1/4 · | 2/2 · | 8/0 W |
| Sentinel | 0/5 L | 1/4 · | 6/7 · | 5/4 · | 4/6 · | 4/5 · | 3/7 · | 0/4 L | 3/8 · | 0/2 L | 2/2 · | 1/2 · | 4/6 · | 1/4 · | 4/5 · | 6/12 · | 7/14 · | 4/13 · | 4/8 · | 0/10 L | 4/8 · | 8/0 W | 8/0 W | 8/0 W | 1/7 · | 2/6 · | 8/0 W |
| Siege | 0/3 L | 1/3 · | 6/4 · | 5/3 · | 4/5 · | 4/4 · | 3/6 · | 0/3 L | 3/7 · | 0/1 L | 2/1 · | 1/1 · | 4/5 · | 1/3 · | 4/4 · | 6/11 · | 7/13 · | 4/12 · | 4/7 · | 0/9 L | 4/7 · | 8/0 W | 8/0 W | 8/0 W | 1/6 · | 2/5 · | 8/0 W |
| Aegis | 7/6 · | 2/0 W | 9/9 · | 8/0 W | 8/2 · | 8/1 · | 1/3 · | 6/0 W | 8/4 · | 4/4 · | 6/4 · | 5/4 · | 4/4 · | 4/0 W | 4/3 · | 6/8 · | 7/10 · | 9/9 · | 4/4 · | 0/6 L | 8/4 · | 12/0 W | 5/0 W | 12/0 W | 8/3 · | 2/2 · | 4/0 W |
| Stalker | 2/6 · | 0/0 X | 6/8 · | 4/0 W | 4/2 · | 4/1 · | 0/3 L | 2/0 W | 4/4 · | 1/1 · | 4/1 · | 3/1 · | 0/4 L | 0/0 X | 2/3 · | 4/8 · | 4/10 · | 5/9 · | 2/4 · | 0/6 L | 4/4 · | 10/0 W | 3/0 W | 10/0 W | 3/3 · | 0/2 L | 2/0 W |
| Ironclad | 6/6 · | 1/2 · | 8/10 · | 7/2 · | 7/4 · | 7/3 · | 0/5 L | 3/2 · | 7/6 · | 3/4 · | 5/4 · | 4/4 · | 3/4 · | 3/2 · | 3/3 · | 5/10 · | 6/12 · | 8/11 · | 3/6 · | 0/8 L | 7/6 · | 11/0 W | 4/0 W | 11/0 W | 7/5 · | 1/4 · | 3/0 W |
| Exosuit | 7/4 · | 8/4 · | 9/4 · | 12/4 · | 10/6 · | 10/5 · | 5/7 · | 2/4 · | 8/8 · | 8/6 · | 12/6 · | 11/6 · | 8/6 · | 8/4 · | 10/5 · | 12/12 · | 8/14 · | 7/13 · | 10/8 · | 5/10 · | 10/8 · | 14/0 W | 4/0 W | 18/0 W | 8/7 · | 6/6 · | 2/0 W |
| Trench | 9/7 · | 10/4 · | 11/9 · | 14/3 · | 12/5 · | 12/5 · | 7/6 · | 4/3 · | 10/6 · | 10/7 · | 14/7 · | 13/7 · | 10/7 · | 10/4 · | 12/6 · | 14/8 · | 10/10 · | 9/9 · | 12/6 · | 7/8 · | 12/7 · | 16/0 W | 6/0 W | 20/0 W | 10/7 · | 8/4 · | 4/0 W |
| Line | 8/9 · | 9/5 · | 10/10 · | 13/3 · | 11/5 · | 11/6 · | 6/6 · | 3/3 · | 9/5 · | 9/4 · | 13/4 · | 12/4 · | 9/9 · | 9/5 · | 11/8 · | 13/7 · | 9/9 · | 8/8 · | 11/5 · | 6/7 · | 11/7 · | 17/0 W | 12/0 W | 19/0 W | 9/8 · | 7/3 · | 11/0 W |
| Phantom | 3/6 · | 4/2 · | 7/10 · | 8/2 · | 6/4 · | 6/3 · | 1/5 · | 0/2 L | 4/6 · | 4/4 · | 8/4 · | 7/4 · | 4/4 · | 4/2 · | 6/3 · | 8/10 · | 6/12 · | 5/11 · | 6/6 · | 1/8 · | 6/6 · | 13/0 W | 7/0 W | 14/0 W | 4/5 · | 2/4 · | 6/0 W |
| Death | 5/1 · | 6/0 W | 9/5 · | 10/0 W | 8/0 W | 8/0 W | 3/0 W | 4/0 W | 6/1 · | 16/0 W | 16/0 W | 16/0 W | 6/0 W | 6/0 W | 8/0 W | 10/5 · | 8/7 · | 7/6 · | 8/1 · | 3/3 · | 8/1 · | 15/0 W | 9/0 W | 16/0 W | 10/0 W | 4/0 W | 8/0 W |
| Scout | 4/10 · | 4/4 · | 9/10 · | 8/2 · | 6/4 · | 6/5 · | 1/5 · | 1/2 · | 6/6 · | 5/4 · | 8/4 · | 7/4 · | 4/8 · | 4/4 · | 6/7 · | 8/10 · | 7/12 · | 7/11 · | 6/6 · | 1/8 · | 6/6 · | 14/0 W | 7/0 W | 14/0 W | 5/7 · | 2/4 · | 6/0 W |
| Recon | 0/10 L | 0/8 L | 0/10 L | 0/8 L | 0/12 L | 0/11 L | 0/13 L | 0/10 L | 0/13 L | 0/3 L | 0/3 L | 0/3 L | 0/12 L | 0/8 L | 0/11 L | 0/16 L | 0/18 L | 0/17 L | 0/13 L | 0/15 L | 0/14 L | 2/0 W | 0/2 L | 4/0 W | 0/11 L | 0/11 L | 0/1 L |
| Kamikaze | 0/0 X | 0/0 X | 0/5 L | 0/0 X | 0/5 L | 0/4 L | 0/6 L | 0/3 L | 0/7 L | 0/1 L | 0/1 L | 0/1 L | 0/5 L | 0/0 X | 0/4 L | 0/11 L | 0/13 L | 0/12 L | 0/7 L | 0/9 L | 0/7 L | 2/0 W | 0/0 X | 4/0 W | 0/0 X | 0/5 L | 0/0 X |
| Drone | 0/10 L | 0/10 L | 0/10 L | 0/10 L | 0/12 L | 0/11 L | 0/13 L | 0/10 L | 0/14 L | 0/8 L | 0/8 L | 0/8 L | 0/12 L | 0/10 L | 0/11 L | 0/18 L | 0/20 L | 0/19 L | 0/14 L | 0/16 L | 0/14 L | 0/4 L | 0/4 L | 5/5 · | 0/13 L | 0/12 L | 0/3 L |
| Tempest | 5/9 · | 3/3 · | 9/10 · | 7/1 · | 7/3 · | 7/4 · | 0/4 L | 2/1 · | 7/4 · | 4/1 · | 7/1 · | 6/1 · | 3/8 · | 3/3 · | 5/7 · | 7/8 · | 7/10 · | 8/9 · | 5/4 · | 0/6 L | 7/5 · | 13/0 W | 6/0 W | 13/0 W | 6/6 · | 1/2 · | 5/0 W |
| Stealthr | 1/4 · | 2/0 W | 5/8 · | 6/0 W | 4/0 W | 4/0 W | 0/1 L | 0/0 X | 2/2 · | 2/2 · | 6/2 · | 5/2 · | 2/2 · | 2/0 W | 4/1 · | 6/6 · | 4/8 · | 3/7 · | 4/2 · | 0/4 L | 4/2 · | 11/0 W | 5/0 W | 12/0 W | 2/1 · | 0/0 X | 4/0 W |
| Komet | 0/2 L | 0/2 L | 0/2 L | 0/2 L | 0/4 L | 0/3 L | 0/5 L | 0/2 L | 0/6 L | 3/0 W | 3/0 W | 3/0 W | 0/4 L | 0/2 L | 0/3 L | 0/10 L | 0/12 L | 0/11 L | 0/6 L | 0/8 L | 0/6 L | 1/0 W | 0/0 X | 3/0 W | 0/5 L | 0/4 L | 0/0 X |

## Scoreboard (one engagement, excluding mirror)

| Unit | As attacker W/L/X/· | As defender W/L/X/· | Avg HP left (atk) | Avg HP left (def) |
| --- | --- | --- | ---: | ---: |
| Death Rider | 7/0/0/19 | 4/0/0/22 | 11.9 | 11.1 |
| Zeus | 7/0/0/19 | 1/0/0/25 | 8.2 | 7.5 |
| Hornet Interceptor | 7/0/0/19 | 4/0/0/22 | 6.2 | 5.5 |
| Manticore MLRS | 6/0/0/20 | 0/4/0/22 | 8.0 | 3.0 |
| Komet Fighter | 5/20/1/0 | 2/20/1/3 | 0.5 | 0.3 |
| Falcon Dropship | 4/0/0/22 | 4/0/0/22 | 9.9 | 9.0 |
| Tempest Strike Bomber | 4/0/0/22 | 1/0/0/25 | 9.4 | 8.6 |
| Viper Gunship | 4/0/0/22 | 4/0/0/22 | 9.3 | 8.3 |
| Sentinel Battery | 4/0/0/22 | 0/5/0/21 | 8.0 | 2.9 |
| Siege Howitzer | 4/0/0/22 | 0/5/0/21 | 8.0 | 3.0 |
| Stealthray Bomber | 4/0/0/22 | 4/0/0/22 | 8.0 | 7.0 |
| Apex Destroyer | 4/0/0/22 | 1/0/0/25 | 6.5 | 5.7 |
| Stalker Biped | 4/0/0/22 | 1/0/0/25 | 6.5 | 5.7 |
| Line Combat Medic | 3/0/0/23 | 4/0/0/22 | 14.8 | 13.8 |
| Scout Biker | 3/0/0/23 | 3/0/0/23 | 10.1 | 9.3 |
| Phantom Speeder | 3/0/0/23 | 3/0/0/23 | 9.9 | 9.0 |
| Aegis | 3/0/0/23 | 4/0/0/22 | 9.1 | 8.2 |
| Nomad Supply Buggy | 3/0/0/23 | 3/0/0/23 | 8.1 | 7.3 |
| Ironclad Goliath | 3/0/0/23 | 3/0/0/23 | 8.1 | 7.3 |
| Mirage Humvee | 3/0/0/23 | 3/0/0/23 | 7.5 | 6.6 |
| Kamikaze Hunter | 2/15/1/8 | 2/19/1/4 | 0.9 | 0.5 |
| Jackal Scout | 1/0/0/25 | 1/0/0/25 | 6.1 | 5.2 |
| Trench Guard | 0/0/0/26 | 4/0/0/22 | 15.9 | 14.7 |
| Exosuit Breacher | 0/0/0/26 | 3/0/0/23 | 13.7 | 12.7 |
| Iron Bastion | 0/0/0/26 | 4/0/0/22 | 9.0 | 8.5 |
| Aegis Support Drone | 0/11/0/15 | 0/14/0/12 | 1.3 | 0.9 |
| Recon Eye | 0/17/0/9 | 0/21/0/5 | 0.8 | 0.5 |

## First-strike flips

Pairs where who goes first changes whether someone dies:

- **Zeus** vs **Manticore MLRS**: Zeus trước → 10/0 (attacker); Manticore MLRS trước → 8/4 (both_live)
- **Zeus** vs **Sentinel Battery**: Zeus trước → 10/0 (attacker); Sentinel Battery trước → 8/5 (both_live)
- **Zeus** vs **Siege Howitzer**: Zeus trước → 10/0 (attacker); Siege Howitzer trước → 8/3 (both_live)
- **Zeus** vs **Recon Eye**: Zeus trước → 10/0 (attacker); Recon Eye trước → 1/10 (both_live)
- **Zeus** vs **Kamikaze Hunter**: Zeus trước → 3/0 (attacker); Kamikaze Hunter trước → 1/3 (both_live)
- **Zeus** vs **Aegis Support Drone**: Zeus trước → 10/0 (attacker); Aegis Support Drone trước → 2/10 (both_live)
- **Apex Destroyer** vs **Recon Eye**: Apex Destroyer trước → 10/0 (attacker); Recon Eye trước → 1/8 (both_live)
- **Apex Destroyer** vs **Kamikaze Hunter**: Apex Destroyer trước → 3/0 (attacker); Kamikaze Hunter trước → 1/3 (both_live)
- **Apex Destroyer** vs **Aegis Support Drone**: Apex Destroyer trước → 10/0 (attacker); Aegis Support Drone trước → 2/10 (both_live)
- **Iron Bastion** vs **Recon Eye**: Iron Bastion trước → 10/2 (both_live); Recon Eye trước → 0/10 (defender)
- **Iron Bastion** vs **Kamikaze Hunter**: Iron Bastion trước → 5/2 (both_live); Kamikaze Hunter trước → 0/5 (defender)
- **Iron Bastion** vs **Aegis Support Drone**: Iron Bastion trước → 10/4 (both_live); Aegis Support Drone trước → 0/10 (defender)
- **Iron Bastion** vs **Komet Fighter**: Iron Bastion trước → 2/1 (both_live); Komet Fighter trước → 0/2 (defender)
- **Hornet Interceptor** vs **Manticore MLRS**: Hornet Interceptor trước → 10/0 (attacker); Manticore MLRS trước → 8/1 (both_live)
- **Hornet Interceptor** vs **Sentinel Battery**: Hornet Interceptor trước → 10/0 (attacker); Sentinel Battery trước → 8/4 (both_live)
- **Hornet Interceptor** vs **Siege Howitzer**: Hornet Interceptor trước → 10/0 (attacker); Siege Howitzer trước → 8/3 (both_live)
- **Manticore MLRS** vs **Sentinel Battery**: Manticore MLRS trước → 8/0 (attacker); Sentinel Battery trước → 8/2 (both_live)
- **Manticore MLRS** vs **Siege Howitzer**: Manticore MLRS trước → 8/0 (attacker); Siege Howitzer trước → 8/1 (both_live)
- **Manticore MLRS** vs **Death Rider**: Manticore MLRS trước → 8/6 (both_live); Death Rider trước → 16/0 (attacker)
- **Manticore MLRS** vs **Recon Eye**: Manticore MLRS trước → 8/0 (attacker); Recon Eye trước → 4/3 (both_live)
- **Manticore MLRS** vs **Kamikaze Hunter**: Manticore MLRS trước → 8/0 (attacker); Kamikaze Hunter trước → 4/1 (both_live)
- **Manticore MLRS** vs **Aegis Support Drone**: Manticore MLRS trước → 8/0 (attacker); Aegis Support Drone trước → 5/8 (both_live)
- **Manticore MLRS** vs **Komet Fighter**: Manticore MLRS trước → 8/0 (attacker); Komet Fighter trước → 3/0 (attacker)
- **Sentinel Battery** vs **Death Rider**: Sentinel Battery trước → 8/10 (both_live); Death Rider trước → 16/0 (attacker)
- **Sentinel Battery** vs **Recon Eye**: Sentinel Battery trước → 8/0 (attacker); Recon Eye trước → 4/3 (both_live)
- **Sentinel Battery** vs **Kamikaze Hunter**: Sentinel Battery trước → 8/0 (attacker); Kamikaze Hunter trước → 4/1 (both_live)
- **Sentinel Battery** vs **Aegis Support Drone**: Sentinel Battery trước → 8/0 (attacker); Aegis Support Drone trước → 5/8 (both_live)
- **Sentinel Battery** vs **Komet Fighter**: Sentinel Battery trước → 8/0 (attacker); Komet Fighter trước → 3/0 (attacker)
- **Siege Howitzer** vs **Death Rider**: Siege Howitzer trước → 8/9 (both_live); Death Rider trước → 16/0 (attacker)
- **Siege Howitzer** vs **Recon Eye**: Siege Howitzer trước → 8/0 (attacker); Recon Eye trước → 4/3 (both_live)
- **Siege Howitzer** vs **Kamikaze Hunter**: Siege Howitzer trước → 8/0 (attacker); Kamikaze Hunter trước → 4/1 (both_live)
- **Siege Howitzer** vs **Aegis Support Drone**: Siege Howitzer trước → 8/0 (attacker); Aegis Support Drone trước → 5/8 (both_live)
- **Siege Howitzer** vs **Komet Fighter**: Siege Howitzer trước → 8/0 (attacker); Komet Fighter trước → 3/0 (attacker)
- **Aegis** vs **Aegis Support Drone**: Aegis trước → 12/1 (both_live); Aegis Support Drone trước → 0/12 (defender)
- **Stalker Biped** vs **Recon Eye**: Stalker Biped trước → 10/0 (attacker); Recon Eye trước → 1/8 (both_live)
- **Stalker Biped** vs **Kamikaze Hunter**: Stalker Biped trước → 3/0 (attacker); Kamikaze Hunter trước → 1/3 (both_live)
- **Stalker Biped** vs **Aegis Support Drone**: Stalker Biped trước → 10/0 (attacker); Aegis Support Drone trước → 2/10 (both_live)
- **Exosuit Breacher** vs **Recon Eye**: Exosuit Breacher trước → 16/2 (both_live); Recon Eye trước → 0/16 (defender)
- **Exosuit Breacher** vs **Kamikaze Hunter**: Exosuit Breacher trước → 11/2 (both_live); Kamikaze Hunter trước → 0/11 (defender)
- **Exosuit Breacher** vs **Komet Fighter**: Exosuit Breacher trước → 10/1 (both_live); Komet Fighter trước → 0/10 (defender)
- **Trench Guard** vs **Recon Eye**: Trench Guard trước → 18/3 (both_live); Recon Eye trước → 0/18 (defender)
- **Trench Guard** vs **Kamikaze Hunter**: Trench Guard trước → 13/3 (both_live); Kamikaze Hunter trước → 0/13 (defender)
- **Trench Guard** vs **Aegis Support Drone**: Trench Guard trước → 20/5 (both_live); Aegis Support Drone trước → 0/20 (defender)
- **Trench Guard** vs **Komet Fighter**: Trench Guard trước → 12/2 (both_live); Komet Fighter trước → 0/12 (defender)
- **Line Combat Medic** vs **Aegis Support Drone**: Line Combat Medic trước → 19/2 (both_live); Aegis Support Drone trước → 0/19 (defender)
- **Recon Eye** vs **Tempest Strike Bomber**: Recon Eye trước → 1/11 (both_live); Tempest Strike Bomber trước → 13/0 (attacker)
- **Kamikaze Hunter** vs **Tempest Strike Bomber**: Kamikaze Hunter trước → 1/6 (both_live); Tempest Strike Bomber trước → 6/0 (attacker)
- **Aegis Support Drone** vs **Tempest Strike Bomber**: Aegis Support Drone trước → 2/13 (both_live); Tempest Strike Bomber trước → 13/0 (attacker)

## Per-unit leftover HP (one engagement)

<details><summary>Zeus</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 10/8 |
| Apex Destroyer | 7/4 |
| Iron Bastion | 9/9 |
| Jackal Scout | 10/3 |
| Nomad Supply Buggy | 10/5 |
| Mirage Humvee | 10/5 |
| Viper Gunship | 5/6 |
| Hornet Interceptor | 9/3 |
| Falcon Dropship | 10/6 |
| Manticore MLRS | 10/0 |
| Sentinel Battery | 10/0 |
| Siege Howitzer | 10/0 |
| Aegis | 7/8 |
| Stalker Biped | 10/4 |
| Ironclad Goliath | 8/7 |
| Exosuit Breacher | 6/10 |
| Trench Guard | 7/12 |
| Line Combat Medic | 9/11 |
| Phantom Speeder | 8/6 |
| Death Rider | 7/8 |
| Scout Biker | 10/7 |
| Recon Eye | 10/0 |
| Kamikaze Hunter | 3/0 |
| Aegis Support Drone | 10/0 |
| Tempest Strike Bomber | 10/7 |
| Stealthray Bomber | 7/4 |
| Komet Fighter | 2/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/8 |
| Apex Destroyer | 8/3 |
| Iron Bastion | 10/10 |
| Jackal Scout | 7/10 |
| Nomad Supply Buggy | 9/10 |
| Mirage Humvee | 9/10 |
| Viper Gunship | 10/8 |
| Hornet Interceptor | 7/8 |
| Falcon Dropship | 11/10 |
| Manticore MLRS | 8/4 |
| Sentinel Battery | 8/5 |
| Siege Howitzer | 8/3 |
| Aegis | 11/9 |
| Stalker Biped | 8/6 |
| Ironclad Goliath | 10/8 |
| Exosuit Breacher | 15/8 |
| Trench Guard | 17/10 |
| Line Combat Medic | 16/10 |
| Phantom Speeder | 11/8 |
| Death Rider | 13/4 |
| Scout Biker | 11/10 |
| Recon Eye | 1/10 |
| Kamikaze Hunter | 1/3 |
| Aegis Support Drone | 2/10 |
| Tempest Strike Bomber | 11/9 |
| Stealthray Bomber | 9/7 |
| Komet Fighter | 0/2 |

</details>

<details><summary>Apex Destroyer</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 8/3 |
| Apex Destroyer | 7/3 |
| Iron Bastion | 6/5 |
| Jackal Scout | 7/3 |
| Nomad Supply Buggy | 7/5 |
| Mirage Humvee | 7/4 |
| Viper Gunship | 2/6 |
| Hornet Interceptor | 6/3 |
| Falcon Dropship | 7/7 |
| Manticore MLRS | 10/1 |
| Sentinel Battery | 10/1 |
| Siege Howitzer | 10/1 |
| Aegis | 4/5 |
| Stalker Biped | 7/3 |
| Ironclad Goliath | 6/4 |
| Exosuit Breacher | 6/11 |
| Trench Guard | 4/13 |
| Line Combat Medic | 6/12 |
| Phantom Speeder | 6/7 |
| Death Rider | 5/9 |
| Scout Biker | 7/7 |
| Recon Eye | 10/0 |
| Kamikaze Hunter | 3/0 |
| Aegis Support Drone | 10/0 |
| Tempest Strike Bomber | 8/6 |
| Stealthray Bomber | 4/5 |
| Komet Fighter | 2/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 7/4 |
| Apex Destroyer | 7/3 |
| Iron Bastion | 9/10 |
| Jackal Scout | 7/7 |
| Nomad Supply Buggy | 9/7 |
| Mirage Humvee | 8/7 |
| Viper Gunship | 10/5 |
| Hornet Interceptor | 7/3 |
| Falcon Dropship | 11/7 |
| Manticore MLRS | 8/1 |
| Sentinel Battery | 8/4 |
| Siege Howitzer | 8/3 |
| Aegis | 9/6 |
| Stalker Biped | 7/3 |
| Ironclad Goliath | 8/6 |
| Exosuit Breacher | 15/8 |
| Trench Guard | 17/10 |
| Line Combat Medic | 16/9 |
| Phantom Speeder | 11/6 |
| Death Rider | 13/2 |
| Scout Biker | 11/7 |
| Recon Eye | 1/8 |
| Kamikaze Hunter | 1/3 |
| Aegis Support Drone | 2/10 |
| Tempest Strike Bomber | 10/5 |
| Stealthray Bomber | 9/4 |
| Komet Fighter | 0/2 |

</details>

<details><summary>Iron Bastion</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 10/10 |
| Apex Destroyer | 9/10 |
| Iron Bastion | 10/10 |
| Jackal Scout | 10/10 |
| Nomad Supply Buggy | 10/12 |
| Mirage Humvee | 10/11 |
| Viper Gunship | 7/13 |
| Hornet Interceptor | 10/10 |
| Falcon Dropship | 10/13 |
| Manticore MLRS | 10/6 |
| Sentinel Battery | 10/6 |
| Siege Howitzer | 10/6 |
| Aegis | 9/12 |
| Stalker Biped | 10/10 |
| Ironclad Goliath | 10/11 |
| Exosuit Breacher | 6/16 |
| Trench Guard | 9/18 |
| Line Combat Medic | 10/17 |
| Phantom Speeder | 10/13 |
| Death Rider | 9/15 |
| Scout Biker | 10/14 |
| Recon Eye | 10/2 |
| Kamikaze Hunter | 5/2 |
| Aegis Support Drone | 10/4 |
| Tempest Strike Bomber | 10/13 |
| Stealthray Bomber | 9/11 |
| Komet Fighter | 2/1 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 9/9 |
| Apex Destroyer | 6/5 |
| Iron Bastion | 10/10 |
| Jackal Scout | 5/10 |
| Nomad Supply Buggy | 7/10 |
| Mirage Humvee | 7/10 |
| Viper Gunship | 8/10 |
| Hornet Interceptor | 5/10 |
| Falcon Dropship | 8/10 |
| Manticore MLRS | 8/7 |
| Sentinel Battery | 8/7 |
| Siege Howitzer | 8/4 |
| Aegis | 9/10 |
| Stalker Biped | 6/8 |
| Ironclad Goliath | 8/10 |
| Exosuit Breacher | 11/8 |
| Trench Guard | 13/10 |
| Line Combat Medic | 12/10 |
| Phantom Speeder | 8/10 |
| Death Rider | 10/6 |
| Scout Biker | 9/10 |
| Recon Eye | 0/10 |
| Kamikaze Hunter | 0/5 |
| Aegis Support Drone | 0/10 |
| Tempest Strike Bomber | 9/10 |
| Stealthray Bomber | 6/9 |
| Komet Fighter | 0/2 |

</details>

<details><summary>Jackal Scout</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 7/10 |
| Apex Destroyer | 7/7 |
| Iron Bastion | 5/10 |
| Jackal Scout | 7/7 |
| Nomad Supply Buggy | 6/9 |
| Mirage Humvee | 6/8 |
| Viper Gunship | 2/10 |
| Hornet Interceptor | 5/7 |
| Falcon Dropship | 6/11 |
| Manticore MLRS | 10/5 |
| Sentinel Battery | 10/5 |
| Siege Howitzer | 10/5 |
| Aegis | 4/10 |
| Stalker Biped | 7/7 |
| Ironclad Goliath | 6/9 |
| Exosuit Breacher | 6/15 |
| Trench Guard | 3/17 |
| Line Combat Medic | 5/16 |
| Phantom Speeder | 6/11 |
| Death Rider | 5/13 |
| Scout Biker | 6/11 |
| Recon Eye | 10/1 |
| Kamikaze Hunter | 3/1 |
| Aegis Support Drone | 10/2 |
| Tempest Strike Bomber | 7/10 |
| Stealthray Bomber | 4/9 |
| Komet Fighter | 2/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/3 |
| Apex Destroyer | 7/3 |
| Iron Bastion | 10/10 |
| Jackal Scout | 7/7 |
| Nomad Supply Buggy | 9/6 |
| Mirage Humvee | 8/6 |
| Viper Gunship | 10/5 |
| Hornet Interceptor | 7/2 |
| Falcon Dropship | 11/6 |
| Manticore MLRS | 8/1 |
| Sentinel Battery | 8/4 |
| Siege Howitzer | 8/3 |
| Aegis | 10/6 |
| Stalker Biped | 7/3 |
| Ironclad Goliath | 9/6 |
| Exosuit Breacher | 15/8 |
| Trench Guard | 17/10 |
| Line Combat Medic | 16/8 |
| Phantom Speeder | 11/6 |
| Death Rider | 13/2 |
| Scout Biker | 11/6 |
| Recon Eye | 1/8 |
| Kamikaze Hunter | 1/3 |
| Aegis Support Drone | 2/10 |
| Tempest Strike Bomber | 10/4 |
| Stealthray Bomber | 9/4 |
| Komet Fighter | 0/2 |

</details>

<details><summary>Nomad Supply Buggy</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 9/10 |
| Apex Destroyer | 9/7 |
| Iron Bastion | 7/10 |
| Jackal Scout | 9/6 |
| Nomad Supply Buggy | 8/8 |
| Mirage Humvee | 8/8 |
| Viper Gunship | 4/9 |
| Hornet Interceptor | 7/6 |
| Falcon Dropship | 8/10 |
| Manticore MLRS | 12/4 |
| Sentinel Battery | 12/4 |
| Siege Howitzer | 12/4 |
| Aegis | 6/10 |
| Stalker Biped | 9/7 |
| Ironclad Goliath | 8/9 |
| Exosuit Breacher | 8/14 |
| Trench Guard | 5/16 |
| Line Combat Medic | 7/15 |
| Phantom Speeder | 8/10 |
| Death Rider | 7/12 |
| Scout Biker | 8/10 |
| Recon Eye | 12/0 |
| Kamikaze Hunter | 5/0 |
| Aegis Support Drone | 12/1 |
| Tempest Strike Bomber | 9/10 |
| Stealthray Bomber | 6/8 |
| Komet Fighter | 4/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/5 |
| Apex Destroyer | 7/5 |
| Iron Bastion | 10/12 |
| Jackal Scout | 6/9 |
| Nomad Supply Buggy | 8/8 |
| Mirage Humvee | 8/8 |
| Viper Gunship | 9/7 |
| Hornet Interceptor | 6/4 |
| Falcon Dropship | 10/8 |
| Manticore MLRS | 8/3 |
| Sentinel Battery | 8/6 |
| Siege Howitzer | 8/5 |
| Aegis | 10/8 |
| Stalker Biped | 7/5 |
| Ironclad Goliath | 9/8 |
| Exosuit Breacher | 14/10 |
| Trench Guard | 16/12 |
| Line Combat Medic | 15/10 |
| Phantom Speeder | 10/8 |
| Death Rider | 12/4 |
| Scout Biker | 10/8 |
| Recon Eye | 0/12 |
| Kamikaze Hunter | 0/5 |
| Aegis Support Drone | 1/12 |
| Tempest Strike Bomber | 10/6 |
| Stealthray Bomber | 8/6 |
| Komet Fighter | 0/4 |

</details>

<details><summary>Mirage Humvee</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 9/10 |
| Apex Destroyer | 8/7 |
| Iron Bastion | 7/10 |
| Jackal Scout | 8/6 |
| Nomad Supply Buggy | 8/8 |
| Mirage Humvee | 8/8 |
| Viper Gunship | 3/9 |
| Hornet Interceptor | 7/6 |
| Falcon Dropship | 8/10 |
| Manticore MLRS | 11/4 |
| Sentinel Battery | 11/4 |
| Siege Howitzer | 11/4 |
| Aegis | 5/10 |
| Stalker Biped | 8/7 |
| Ironclad Goliath | 7/9 |
| Exosuit Breacher | 7/14 |
| Trench Guard | 5/16 |
| Line Combat Medic | 7/15 |
| Phantom Speeder | 7/10 |
| Death Rider | 6/12 |
| Scout Biker | 8/10 |
| Recon Eye | 11/0 |
| Kamikaze Hunter | 4/0 |
| Aegis Support Drone | 11/1 |
| Tempest Strike Bomber | 9/10 |
| Stealthray Bomber | 5/8 |
| Komet Fighter | 3/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/5 |
| Apex Destroyer | 7/4 |
| Iron Bastion | 10/11 |
| Jackal Scout | 6/8 |
| Nomad Supply Buggy | 8/8 |
| Mirage Humvee | 8/8 |
| Viper Gunship | 9/6 |
| Hornet Interceptor | 6/4 |
| Falcon Dropship | 10/8 |
| Manticore MLRS | 8/2 |
| Sentinel Battery | 8/5 |
| Siege Howitzer | 8/4 |
| Aegis | 10/7 |
| Stalker Biped | 7/4 |
| Ironclad Goliath | 9/7 |
| Exosuit Breacher | 14/9 |
| Trench Guard | 16/11 |
| Line Combat Medic | 15/10 |
| Phantom Speeder | 10/7 |
| Death Rider | 12/3 |
| Scout Biker | 10/8 |
| Recon Eye | 0/11 |
| Kamikaze Hunter | 0/4 |
| Aegis Support Drone | 1/11 |
| Tempest Strike Bomber | 10/6 |
| Stealthray Bomber | 8/5 |
| Komet Fighter | 0/3 |

</details>

<details><summary>Viper Gunship</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 10/8 |
| Apex Destroyer | 10/5 |
| Iron Bastion | 8/10 |
| Jackal Scout | 10/5 |
| Nomad Supply Buggy | 9/7 |
| Mirage Humvee | 9/6 |
| Viper Gunship | 5/8 |
| Hornet Interceptor | 8/5 |
| Falcon Dropship | 9/9 |
| Manticore MLRS | 13/3 |
| Sentinel Battery | 13/3 |
| Siege Howitzer | 13/3 |
| Aegis | 7/8 |
| Stalker Biped | 10/5 |
| Ironclad Goliath | 9/7 |
| Exosuit Breacher | 9/13 |
| Trench Guard | 6/15 |
| Line Combat Medic | 8/14 |
| Phantom Speeder | 9/9 |
| Death Rider | 8/11 |
| Scout Biker | 9/9 |
| Recon Eye | 13/0 |
| Kamikaze Hunter | 6/0 |
| Aegis Support Drone | 13/0 |
| Tempest Strike Bomber | 10/8 |
| Stealthray Bomber | 7/7 |
| Komet Fighter | 5/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 5/6 |
| Apex Destroyer | 2/6 |
| Iron Bastion | 7/13 |
| Jackal Scout | 2/10 |
| Nomad Supply Buggy | 4/9 |
| Mirage Humvee | 3/9 |
| Viper Gunship | 5/8 |
| Hornet Interceptor | 2/5 |
| Falcon Dropship | 6/9 |
| Manticore MLRS | 8/4 |
| Sentinel Battery | 8/7 |
| Siege Howitzer | 8/6 |
| Aegis | 5/9 |
| Stalker Biped | 2/6 |
| Ironclad Goliath | 4/9 |
| Exosuit Breacher | 10/11 |
| Trench Guard | 12/13 |
| Line Combat Medic | 11/11 |
| Phantom Speeder | 6/9 |
| Death Rider | 8/5 |
| Scout Biker | 6/9 |
| Recon Eye | 0/13 |
| Kamikaze Hunter | 0/6 |
| Aegis Support Drone | 0/13 |
| Tempest Strike Bomber | 5/7 |
| Stealthray Bomber | 4/7 |
| Komet Fighter | 0/5 |

</details>

<details><summary>Hornet Interceptor</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 7/8 |
| Apex Destroyer | 7/3 |
| Iron Bastion | 5/10 |
| Jackal Scout | 7/2 |
| Nomad Supply Buggy | 6/4 |
| Mirage Humvee | 6/4 |
| Viper Gunship | 2/5 |
| Hornet Interceptor | 5/2 |
| Falcon Dropship | 6/4 |
| Manticore MLRS | 10/0 |
| Sentinel Battery | 10/0 |
| Siege Howitzer | 10/0 |
| Aegis | 4/7 |
| Stalker Biped | 7/3 |
| Ironclad Goliath | 6/6 |
| Exosuit Breacher | 6/8 |
| Trench Guard | 3/10 |
| Line Combat Medic | 5/9 |
| Phantom Speeder | 6/4 |
| Death Rider | 5/6 |
| Scout Biker | 6/6 |
| Recon Eye | 10/0 |
| Kamikaze Hunter | 3/0 |
| Aegis Support Drone | 10/0 |
| Tempest Strike Bomber | 7/6 |
| Stealthray Bomber | 4/2 |
| Komet Fighter | 2/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 9/3 |
| Apex Destroyer | 6/3 |
| Iron Bastion | 10/10 |
| Jackal Scout | 5/7 |
| Nomad Supply Buggy | 7/6 |
| Mirage Humvee | 7/6 |
| Viper Gunship | 8/5 |
| Hornet Interceptor | 5/2 |
| Falcon Dropship | 8/6 |
| Manticore MLRS | 8/1 |
| Sentinel Battery | 8/4 |
| Siege Howitzer | 8/3 |
| Aegis | 9/6 |
| Stalker Biped | 6/3 |
| Ironclad Goliath | 8/6 |
| Exosuit Breacher | 12/8 |
| Trench Guard | 14/10 |
| Line Combat Medic | 13/8 |
| Phantom Speeder | 8/6 |
| Death Rider | 10/2 |
| Scout Biker | 9/6 |
| Recon Eye | 0/10 |
| Kamikaze Hunter | 0/3 |
| Aegis Support Drone | 0/10 |
| Tempest Strike Bomber | 9/4 |
| Stealthray Bomber | 6/4 |
| Komet Fighter | 0/2 |

</details>

<details><summary>Falcon Dropship</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 11/10 |
| Apex Destroyer | 11/7 |
| Iron Bastion | 8/10 |
| Jackal Scout | 11/6 |
| Nomad Supply Buggy | 10/8 |
| Mirage Humvee | 10/8 |
| Viper Gunship | 6/9 |
| Hornet Interceptor | 8/6 |
| Falcon Dropship | 9/9 |
| Manticore MLRS | 14/3 |
| Sentinel Battery | 14/3 |
| Siege Howitzer | 14/3 |
| Aegis | 8/10 |
| Stalker Biped | 11/7 |
| Ironclad Goliath | 10/9 |
| Exosuit Breacher | 10/13 |
| Trench Guard | 6/15 |
| Line Combat Medic | 8/14 |
| Phantom Speeder | 10/9 |
| Death Rider | 9/11 |
| Scout Biker | 10/10 |
| Recon Eye | 13/0 |
| Kamikaze Hunter | 7/0 |
| Aegis Support Drone | 14/0 |
| Tempest Strike Bomber | 11/10 |
| Stealthray Bomber | 8/7 |
| Komet Fighter | 6/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/6 |
| Apex Destroyer | 7/7 |
| Iron Bastion | 10/13 |
| Jackal Scout | 6/11 |
| Nomad Supply Buggy | 8/10 |
| Mirage Humvee | 8/10 |
| Viper Gunship | 9/9 |
| Hornet Interceptor | 6/4 |
| Falcon Dropship | 9/9 |
| Manticore MLRS | 8/4 |
| Sentinel Battery | 8/8 |
| Siege Howitzer | 8/7 |
| Aegis | 10/10 |
| Stalker Biped | 7/7 |
| Ironclad Goliath | 9/10 |
| Exosuit Breacher | 13/12 |
| Trench Guard | 15/14 |
| Line Combat Medic | 14/11 |
| Phantom Speeder | 9/10 |
| Death Rider | 11/6 |
| Scout Biker | 10/10 |
| Recon Eye | 0/13 |
| Kamikaze Hunter | 0/7 |
| Aegis Support Drone | 0/14 |
| Tempest Strike Bomber | 10/7 |
| Stealthray Bomber | 7/8 |
| Komet Fighter | 0/6 |

</details>

<details><summary>Manticore MLRS</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 8/4 |
| Apex Destroyer | 8/1 |
| Iron Bastion | 8/7 |
| Jackal Scout | 8/1 |
| Nomad Supply Buggy | 8/3 |
| Mirage Humvee | 8/2 |
| Viper Gunship | 8/4 |
| Hornet Interceptor | 8/1 |
| Falcon Dropship | 8/4 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/0 |
| Siege Howitzer | 8/0 |
| Aegis | 8/4 |
| Stalker Biped | 8/1 |
| Ironclad Goliath | 8/3 |
| Exosuit Breacher | 8/8 |
| Trench Guard | 8/10 |
| Line Combat Medic | 8/9 |
| Phantom Speeder | 8/4 |
| Death Rider | 8/6 |
| Scout Biker | 8/5 |
| Recon Eye | 8/0 |
| Kamikaze Hunter | 8/0 |
| Aegis Support Drone | 8/0 |
| Tempest Strike Bomber | 8/4 |
| Stealthray Bomber | 8/2 |
| Komet Fighter | 8/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/0 |
| Apex Destroyer | 10/1 |
| Iron Bastion | 10/6 |
| Jackal Scout | 10/5 |
| Nomad Supply Buggy | 12/4 |
| Mirage Humvee | 11/4 |
| Viper Gunship | 13/3 |
| Hornet Interceptor | 10/0 |
| Falcon Dropship | 14/3 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/2 |
| Siege Howitzer | 8/1 |
| Aegis | 12/4 |
| Stalker Biped | 10/1 |
| Ironclad Goliath | 11/4 |
| Exosuit Breacher | 18/6 |
| Trench Guard | 20/7 |
| Line Combat Medic | 19/4 |
| Phantom Speeder | 14/4 |
| Death Rider | 16/0 |
| Scout Biker | 14/4 |
| Recon Eye | 4/3 |
| Kamikaze Hunter | 4/1 |
| Aegis Support Drone | 5/8 |
| Tempest Strike Bomber | 13/1 |
| Stealthray Bomber | 12/2 |
| Komet Fighter | 3/0 |

</details>

<details><summary>Sentinel Battery</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 8/5 |
| Apex Destroyer | 8/4 |
| Iron Bastion | 8/7 |
| Jackal Scout | 8/4 |
| Nomad Supply Buggy | 8/6 |
| Mirage Humvee | 8/5 |
| Viper Gunship | 8/7 |
| Hornet Interceptor | 8/4 |
| Falcon Dropship | 8/8 |
| Manticore MLRS | 8/2 |
| Sentinel Battery | 8/2 |
| Siege Howitzer | 8/2 |
| Aegis | 8/6 |
| Stalker Biped | 8/4 |
| Ironclad Goliath | 8/5 |
| Exosuit Breacher | 8/12 |
| Trench Guard | 8/14 |
| Line Combat Medic | 8/13 |
| Phantom Speeder | 8/8 |
| Death Rider | 8/10 |
| Scout Biker | 8/8 |
| Recon Eye | 8/0 |
| Kamikaze Hunter | 8/0 |
| Aegis Support Drone | 8/0 |
| Tempest Strike Bomber | 8/7 |
| Stealthray Bomber | 8/6 |
| Komet Fighter | 8/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/0 |
| Apex Destroyer | 10/1 |
| Iron Bastion | 10/6 |
| Jackal Scout | 10/5 |
| Nomad Supply Buggy | 12/4 |
| Mirage Humvee | 11/4 |
| Viper Gunship | 13/3 |
| Hornet Interceptor | 10/0 |
| Falcon Dropship | 14/3 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/2 |
| Siege Howitzer | 8/1 |
| Aegis | 12/4 |
| Stalker Biped | 10/1 |
| Ironclad Goliath | 11/4 |
| Exosuit Breacher | 18/6 |
| Trench Guard | 20/7 |
| Line Combat Medic | 19/4 |
| Phantom Speeder | 14/4 |
| Death Rider | 16/0 |
| Scout Biker | 14/4 |
| Recon Eye | 4/3 |
| Kamikaze Hunter | 4/1 |
| Aegis Support Drone | 5/8 |
| Tempest Strike Bomber | 13/1 |
| Stealthray Bomber | 12/2 |
| Komet Fighter | 3/0 |

</details>

<details><summary>Siege Howitzer</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 8/3 |
| Apex Destroyer | 8/3 |
| Iron Bastion | 8/4 |
| Jackal Scout | 8/3 |
| Nomad Supply Buggy | 8/5 |
| Mirage Humvee | 8/4 |
| Viper Gunship | 8/6 |
| Hornet Interceptor | 8/3 |
| Falcon Dropship | 8/7 |
| Manticore MLRS | 8/1 |
| Sentinel Battery | 8/1 |
| Siege Howitzer | 8/1 |
| Aegis | 8/5 |
| Stalker Biped | 8/3 |
| Ironclad Goliath | 8/4 |
| Exosuit Breacher | 8/11 |
| Trench Guard | 8/13 |
| Line Combat Medic | 8/12 |
| Phantom Speeder | 8/7 |
| Death Rider | 8/9 |
| Scout Biker | 8/7 |
| Recon Eye | 8/0 |
| Kamikaze Hunter | 8/0 |
| Aegis Support Drone | 8/0 |
| Tempest Strike Bomber | 8/6 |
| Stealthray Bomber | 8/5 |
| Komet Fighter | 8/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/0 |
| Apex Destroyer | 10/1 |
| Iron Bastion | 10/6 |
| Jackal Scout | 10/5 |
| Nomad Supply Buggy | 12/4 |
| Mirage Humvee | 11/4 |
| Viper Gunship | 13/3 |
| Hornet Interceptor | 10/0 |
| Falcon Dropship | 14/3 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/2 |
| Siege Howitzer | 8/1 |
| Aegis | 12/4 |
| Stalker Biped | 10/1 |
| Ironclad Goliath | 11/4 |
| Exosuit Breacher | 18/6 |
| Trench Guard | 20/7 |
| Line Combat Medic | 19/4 |
| Phantom Speeder | 14/4 |
| Death Rider | 16/0 |
| Scout Biker | 14/4 |
| Recon Eye | 4/3 |
| Kamikaze Hunter | 4/1 |
| Aegis Support Drone | 5/8 |
| Tempest Strike Bomber | 13/1 |
| Stealthray Bomber | 12/2 |
| Komet Fighter | 3/0 |

</details>

<details><summary>Aegis</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 11/9 |
| Apex Destroyer | 9/6 |
| Iron Bastion | 9/10 |
| Jackal Scout | 10/6 |
| Nomad Supply Buggy | 10/8 |
| Mirage Humvee | 10/7 |
| Viper Gunship | 5/9 |
| Hornet Interceptor | 9/6 |
| Falcon Dropship | 10/10 |
| Manticore MLRS | 12/4 |
| Sentinel Battery | 12/4 |
| Siege Howitzer | 12/4 |
| Aegis | 7/9 |
| Stalker Biped | 10/6 |
| Ironclad Goliath | 8/8 |
| Exosuit Breacher | 8/14 |
| Trench Guard | 7/16 |
| Line Combat Medic | 9/15 |
| Phantom Speeder | 8/10 |
| Death Rider | 7/12 |
| Scout Biker | 10/10 |
| Recon Eye | 12/0 |
| Kamikaze Hunter | 5/0 |
| Aegis Support Drone | 12/1 |
| Tempest Strike Bomber | 11/9 |
| Stealthray Bomber | 7/8 |
| Komet Fighter | 4/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 7/8 |
| Apex Destroyer | 4/5 |
| Iron Bastion | 9/12 |
| Jackal Scout | 4/10 |
| Nomad Supply Buggy | 6/10 |
| Mirage Humvee | 5/10 |
| Viper Gunship | 7/8 |
| Hornet Interceptor | 4/7 |
| Falcon Dropship | 8/10 |
| Manticore MLRS | 8/4 |
| Sentinel Battery | 8/6 |
| Siege Howitzer | 8/5 |
| Aegis | 7/9 |
| Stalker Biped | 4/6 |
| Ironclad Goliath | 6/8 |
| Exosuit Breacher | 12/10 |
| Trench Guard | 14/12 |
| Line Combat Medic | 13/12 |
| Phantom Speeder | 8/8 |
| Death Rider | 10/4 |
| Scout Biker | 8/10 |
| Recon Eye | 0/12 |
| Kamikaze Hunter | 0/5 |
| Aegis Support Drone | 0/12 |
| Tempest Strike Bomber | 7/9 |
| Stealthray Bomber | 6/7 |
| Komet Fighter | 0/4 |

</details>

<details><summary>Stalker Biped</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 8/6 |
| Apex Destroyer | 7/3 |
| Iron Bastion | 6/8 |
| Jackal Scout | 7/3 |
| Nomad Supply Buggy | 7/5 |
| Mirage Humvee | 7/4 |
| Viper Gunship | 2/6 |
| Hornet Interceptor | 6/3 |
| Falcon Dropship | 7/7 |
| Manticore MLRS | 10/1 |
| Sentinel Battery | 10/1 |
| Siege Howitzer | 10/1 |
| Aegis | 4/6 |
| Stalker Biped | 7/3 |
| Ironclad Goliath | 6/5 |
| Exosuit Breacher | 6/11 |
| Trench Guard | 4/13 |
| Line Combat Medic | 6/12 |
| Phantom Speeder | 6/7 |
| Death Rider | 5/9 |
| Scout Biker | 7/7 |
| Recon Eye | 10/0 |
| Kamikaze Hunter | 3/0 |
| Aegis Support Drone | 10/0 |
| Tempest Strike Bomber | 8/6 |
| Stealthray Bomber | 4/5 |
| Komet Fighter | 2/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/4 |
| Apex Destroyer | 7/3 |
| Iron Bastion | 10/10 |
| Jackal Scout | 7/7 |
| Nomad Supply Buggy | 9/7 |
| Mirage Humvee | 8/7 |
| Viper Gunship | 10/5 |
| Hornet Interceptor | 7/3 |
| Falcon Dropship | 11/7 |
| Manticore MLRS | 8/1 |
| Sentinel Battery | 8/4 |
| Siege Howitzer | 8/3 |
| Aegis | 10/6 |
| Stalker Biped | 7/3 |
| Ironclad Goliath | 9/6 |
| Exosuit Breacher | 15/8 |
| Trench Guard | 17/10 |
| Line Combat Medic | 16/9 |
| Phantom Speeder | 11/6 |
| Death Rider | 13/2 |
| Scout Biker | 11/7 |
| Recon Eye | 1/8 |
| Kamikaze Hunter | 1/3 |
| Aegis Support Drone | 2/10 |
| Tempest Strike Bomber | 10/5 |
| Stealthray Bomber | 9/4 |
| Komet Fighter | 0/2 |

</details>

<details><summary>Ironclad Goliath</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 10/8 |
| Apex Destroyer | 8/6 |
| Iron Bastion | 8/10 |
| Jackal Scout | 9/6 |
| Nomad Supply Buggy | 9/8 |
| Mirage Humvee | 9/7 |
| Viper Gunship | 4/9 |
| Hornet Interceptor | 8/6 |
| Falcon Dropship | 9/10 |
| Manticore MLRS | 11/4 |
| Sentinel Battery | 11/4 |
| Siege Howitzer | 11/4 |
| Aegis | 6/8 |
| Stalker Biped | 9/6 |
| Ironclad Goliath | 7/7 |
| Exosuit Breacher | 7/14 |
| Trench Guard | 6/16 |
| Line Combat Medic | 8/15 |
| Phantom Speeder | 7/10 |
| Death Rider | 6/12 |
| Scout Biker | 9/10 |
| Recon Eye | 11/0 |
| Kamikaze Hunter | 4/0 |
| Aegis Support Drone | 11/1 |
| Tempest Strike Bomber | 10/9 |
| Stealthray Bomber | 6/8 |
| Komet Fighter | 3/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 8/7 |
| Apex Destroyer | 6/4 |
| Iron Bastion | 10/11 |
| Jackal Scout | 6/9 |
| Nomad Supply Buggy | 8/9 |
| Mirage Humvee | 7/9 |
| Viper Gunship | 9/7 |
| Hornet Interceptor | 6/6 |
| Falcon Dropship | 10/9 |
| Manticore MLRS | 8/3 |
| Sentinel Battery | 8/5 |
| Siege Howitzer | 8/4 |
| Aegis | 8/8 |
| Stalker Biped | 6/5 |
| Ironclad Goliath | 7/7 |
| Exosuit Breacher | 14/9 |
| Trench Guard | 16/11 |
| Line Combat Medic | 15/11 |
| Phantom Speeder | 10/7 |
| Death Rider | 12/3 |
| Scout Biker | 10/9 |
| Recon Eye | 0/11 |
| Kamikaze Hunter | 0/4 |
| Aegis Support Drone | 1/11 |
| Tempest Strike Bomber | 9/8 |
| Stealthray Bomber | 8/6 |
| Komet Fighter | 0/3 |

</details>

<details><summary>Exosuit Breacher</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 15/8 |
| Apex Destroyer | 15/8 |
| Iron Bastion | 11/8 |
| Jackal Scout | 15/8 |
| Nomad Supply Buggy | 14/10 |
| Mirage Humvee | 14/9 |
| Viper Gunship | 10/11 |
| Hornet Interceptor | 12/8 |
| Falcon Dropship | 13/12 |
| Manticore MLRS | 18/6 |
| Sentinel Battery | 18/6 |
| Siege Howitzer | 18/6 |
| Aegis | 12/10 |
| Stalker Biped | 15/8 |
| Ironclad Goliath | 14/9 |
| Exosuit Breacher | 14/16 |
| Trench Guard | 9/18 |
| Line Combat Medic | 11/17 |
| Phantom Speeder | 14/12 |
| Death Rider | 13/14 |
| Scout Biker | 14/12 |
| Recon Eye | 16/2 |
| Kamikaze Hunter | 11/2 |
| Aegis Support Drone | 18/3 |
| Tempest Strike Bomber | 15/11 |
| Stealthray Bomber | 12/10 |
| Komet Fighter | 10/1 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 6/10 |
| Apex Destroyer | 6/11 |
| Iron Bastion | 6/16 |
| Jackal Scout | 6/15 |
| Nomad Supply Buggy | 8/14 |
| Mirage Humvee | 7/14 |
| Viper Gunship | 9/13 |
| Hornet Interceptor | 6/8 |
| Falcon Dropship | 10/13 |
| Manticore MLRS | 8/8 |
| Sentinel Battery | 8/12 |
| Siege Howitzer | 8/11 |
| Aegis | 8/14 |
| Stalker Biped | 6/11 |
| Ironclad Goliath | 7/14 |
| Exosuit Breacher | 14/16 |
| Trench Guard | 16/17 |
| Line Combat Medic | 15/14 |
| Phantom Speeder | 10/14 |
| Death Rider | 12/10 |
| Scout Biker | 10/14 |
| Recon Eye | 0/16 |
| Kamikaze Hunter | 0/11 |
| Aegis Support Drone | 1/18 |
| Tempest Strike Bomber | 9/11 |
| Stealthray Bomber | 8/12 |
| Komet Fighter | 0/10 |

</details>

<details><summary>Trench Guard</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 17/10 |
| Apex Destroyer | 17/10 |
| Iron Bastion | 13/10 |
| Jackal Scout | 17/10 |
| Nomad Supply Buggy | 16/12 |
| Mirage Humvee | 16/11 |
| Viper Gunship | 12/13 |
| Hornet Interceptor | 14/10 |
| Falcon Dropship | 15/14 |
| Manticore MLRS | 20/7 |
| Sentinel Battery | 20/7 |
| Siege Howitzer | 20/7 |
| Aegis | 14/12 |
| Stalker Biped | 17/10 |
| Ironclad Goliath | 16/11 |
| Exosuit Breacher | 16/17 |
| Trench Guard | 11/19 |
| Line Combat Medic | 13/18 |
| Phantom Speeder | 16/14 |
| Death Rider | 15/16 |
| Scout Biker | 16/14 |
| Recon Eye | 18/3 |
| Kamikaze Hunter | 13/3 |
| Aegis Support Drone | 20/5 |
| Tempest Strike Bomber | 17/13 |
| Stealthray Bomber | 14/12 |
| Komet Fighter | 12/2 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 7/12 |
| Apex Destroyer | 4/13 |
| Iron Bastion | 9/18 |
| Jackal Scout | 3/17 |
| Nomad Supply Buggy | 5/16 |
| Mirage Humvee | 5/16 |
| Viper Gunship | 6/15 |
| Hornet Interceptor | 3/10 |
| Falcon Dropship | 6/15 |
| Manticore MLRS | 8/10 |
| Sentinel Battery | 8/14 |
| Siege Howitzer | 8/13 |
| Aegis | 7/16 |
| Stalker Biped | 4/13 |
| Ironclad Goliath | 6/16 |
| Exosuit Breacher | 9/18 |
| Trench Guard | 11/19 |
| Line Combat Medic | 10/16 |
| Phantom Speeder | 6/16 |
| Death Rider | 8/12 |
| Scout Biker | 7/16 |
| Recon Eye | 0/18 |
| Kamikaze Hunter | 0/13 |
| Aegis Support Drone | 0/20 |
| Tempest Strike Bomber | 7/13 |
| Stealthray Bomber | 4/14 |
| Komet Fighter | 0/12 |

</details>

<details><summary>Line Combat Medic</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 16/10 |
| Apex Destroyer | 16/9 |
| Iron Bastion | 12/10 |
| Jackal Scout | 16/8 |
| Nomad Supply Buggy | 15/10 |
| Mirage Humvee | 15/10 |
| Viper Gunship | 11/11 |
| Hornet Interceptor | 13/8 |
| Falcon Dropship | 14/11 |
| Manticore MLRS | 19/4 |
| Sentinel Battery | 19/4 |
| Siege Howitzer | 19/4 |
| Aegis | 13/12 |
| Stalker Biped | 16/9 |
| Ironclad Goliath | 15/11 |
| Exosuit Breacher | 15/14 |
| Trench Guard | 10/16 |
| Line Combat Medic | 12/15 |
| Phantom Speeder | 15/11 |
| Death Rider | 14/13 |
| Scout Biker | 15/12 |
| Recon Eye | 17/0 |
| Kamikaze Hunter | 12/0 |
| Aegis Support Drone | 19/2 |
| Tempest Strike Bomber | 16/12 |
| Stealthray Bomber | 13/9 |
| Komet Fighter | 11/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 9/11 |
| Apex Destroyer | 6/12 |
| Iron Bastion | 10/17 |
| Jackal Scout | 5/16 |
| Nomad Supply Buggy | 7/15 |
| Mirage Humvee | 7/15 |
| Viper Gunship | 8/14 |
| Hornet Interceptor | 5/9 |
| Falcon Dropship | 8/14 |
| Manticore MLRS | 8/9 |
| Sentinel Battery | 8/13 |
| Siege Howitzer | 8/12 |
| Aegis | 9/15 |
| Stalker Biped | 6/12 |
| Ironclad Goliath | 8/15 |
| Exosuit Breacher | 11/17 |
| Trench Guard | 13/18 |
| Line Combat Medic | 12/15 |
| Phantom Speeder | 8/15 |
| Death Rider | 10/11 |
| Scout Biker | 9/15 |
| Recon Eye | 0/17 |
| Kamikaze Hunter | 0/12 |
| Aegis Support Drone | 0/19 |
| Tempest Strike Bomber | 9/12 |
| Stealthray Bomber | 6/13 |
| Komet Fighter | 0/11 |

</details>

<details><summary>Phantom Speeder</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 11/8 |
| Apex Destroyer | 11/6 |
| Iron Bastion | 8/10 |
| Jackal Scout | 11/6 |
| Nomad Supply Buggy | 10/8 |
| Mirage Humvee | 10/7 |
| Viper Gunship | 6/9 |
| Hornet Interceptor | 8/6 |
| Falcon Dropship | 9/10 |
| Manticore MLRS | 14/4 |
| Sentinel Battery | 14/4 |
| Siege Howitzer | 14/4 |
| Aegis | 8/8 |
| Stalker Biped | 11/6 |
| Ironclad Goliath | 10/7 |
| Exosuit Breacher | 10/14 |
| Trench Guard | 6/16 |
| Line Combat Medic | 8/15 |
| Phantom Speeder | 10/10 |
| Death Rider | 9/12 |
| Scout Biker | 10/10 |
| Recon Eye | 13/0 |
| Kamikaze Hunter | 7/0 |
| Aegis Support Drone | 14/1 |
| Tempest Strike Bomber | 11/9 |
| Stealthray Bomber | 8/8 |
| Komet Fighter | 6/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 8/6 |
| Apex Destroyer | 6/7 |
| Iron Bastion | 10/13 |
| Jackal Scout | 6/11 |
| Nomad Supply Buggy | 8/10 |
| Mirage Humvee | 7/10 |
| Viper Gunship | 9/9 |
| Hornet Interceptor | 6/4 |
| Falcon Dropship | 10/9 |
| Manticore MLRS | 8/4 |
| Sentinel Battery | 8/8 |
| Siege Howitzer | 8/7 |
| Aegis | 8/10 |
| Stalker Biped | 6/7 |
| Ironclad Goliath | 7/10 |
| Exosuit Breacher | 14/12 |
| Trench Guard | 16/14 |
| Line Combat Medic | 15/11 |
| Phantom Speeder | 10/10 |
| Death Rider | 12/6 |
| Scout Biker | 10/10 |
| Recon Eye | 0/13 |
| Kamikaze Hunter | 0/7 |
| Aegis Support Drone | 1/14 |
| Tempest Strike Bomber | 9/7 |
| Stealthray Bomber | 8/8 |
| Komet Fighter | 0/6 |

</details>

<details><summary>Death Rider</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 13/4 |
| Apex Destroyer | 13/2 |
| Iron Bastion | 10/6 |
| Jackal Scout | 13/2 |
| Nomad Supply Buggy | 12/4 |
| Mirage Humvee | 12/3 |
| Viper Gunship | 8/5 |
| Hornet Interceptor | 10/2 |
| Falcon Dropship | 11/6 |
| Manticore MLRS | 16/0 |
| Sentinel Battery | 16/0 |
| Siege Howitzer | 16/0 |
| Aegis | 10/4 |
| Stalker Biped | 13/2 |
| Ironclad Goliath | 12/3 |
| Exosuit Breacher | 12/10 |
| Trench Guard | 8/12 |
| Line Combat Medic | 10/11 |
| Phantom Speeder | 12/6 |
| Death Rider | 11/8 |
| Scout Biker | 12/6 |
| Recon Eye | 15/0 |
| Kamikaze Hunter | 9/0 |
| Aegis Support Drone | 16/0 |
| Tempest Strike Bomber | 13/5 |
| Stealthray Bomber | 10/4 |
| Komet Fighter | 8/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 7/8 |
| Apex Destroyer | 5/9 |
| Iron Bastion | 9/15 |
| Jackal Scout | 5/13 |
| Nomad Supply Buggy | 7/12 |
| Mirage Humvee | 6/12 |
| Viper Gunship | 8/11 |
| Hornet Interceptor | 5/6 |
| Falcon Dropship | 9/11 |
| Manticore MLRS | 8/6 |
| Sentinel Battery | 8/10 |
| Siege Howitzer | 8/9 |
| Aegis | 7/12 |
| Stalker Biped | 5/9 |
| Ironclad Goliath | 6/12 |
| Exosuit Breacher | 13/14 |
| Trench Guard | 15/16 |
| Line Combat Medic | 14/13 |
| Phantom Speeder | 9/12 |
| Death Rider | 11/8 |
| Scout Biker | 9/12 |
| Recon Eye | 0/15 |
| Kamikaze Hunter | 0/9 |
| Aegis Support Drone | 0/16 |
| Tempest Strike Bomber | 8/9 |
| Stealthray Bomber | 7/10 |
| Komet Fighter | 0/8 |

</details>

<details><summary>Scout Biker</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 11/10 |
| Apex Destroyer | 11/7 |
| Iron Bastion | 9/10 |
| Jackal Scout | 11/6 |
| Nomad Supply Buggy | 10/8 |
| Mirage Humvee | 10/8 |
| Viper Gunship | 6/9 |
| Hornet Interceptor | 9/6 |
| Falcon Dropship | 10/10 |
| Manticore MLRS | 14/4 |
| Sentinel Battery | 14/4 |
| Siege Howitzer | 14/4 |
| Aegis | 8/10 |
| Stalker Biped | 11/7 |
| Ironclad Goliath | 10/9 |
| Exosuit Breacher | 10/14 |
| Trench Guard | 7/16 |
| Line Combat Medic | 9/15 |
| Phantom Speeder | 10/10 |
| Death Rider | 9/12 |
| Scout Biker | 10/10 |
| Recon Eye | 14/0 |
| Kamikaze Hunter | 7/0 |
| Aegis Support Drone | 14/1 |
| Tempest Strike Bomber | 11/10 |
| Stealthray Bomber | 8/8 |
| Komet Fighter | 6/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/7 |
| Apex Destroyer | 7/7 |
| Iron Bastion | 10/14 |
| Jackal Scout | 6/11 |
| Nomad Supply Buggy | 8/10 |
| Mirage Humvee | 8/10 |
| Viper Gunship | 9/9 |
| Hornet Interceptor | 6/6 |
| Falcon Dropship | 10/10 |
| Manticore MLRS | 8/5 |
| Sentinel Battery | 8/8 |
| Siege Howitzer | 8/7 |
| Aegis | 10/10 |
| Stalker Biped | 7/7 |
| Ironclad Goliath | 9/10 |
| Exosuit Breacher | 14/12 |
| Trench Guard | 16/14 |
| Line Combat Medic | 15/12 |
| Phantom Speeder | 10/10 |
| Death Rider | 12/6 |
| Scout Biker | 10/10 |
| Recon Eye | 0/14 |
| Kamikaze Hunter | 0/7 |
| Aegis Support Drone | 1/14 |
| Tempest Strike Bomber | 10/8 |
| Stealthray Bomber | 8/8 |
| Komet Fighter | 0/6 |

</details>

<details><summary>Recon Eye</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 1/10 |
| Apex Destroyer | 1/8 |
| Iron Bastion | 0/10 |
| Jackal Scout | 1/8 |
| Nomad Supply Buggy | 0/12 |
| Mirage Humvee | 0/11 |
| Viper Gunship | 0/13 |
| Hornet Interceptor | 0/10 |
| Falcon Dropship | 0/13 |
| Manticore MLRS | 4/3 |
| Sentinel Battery | 4/3 |
| Siege Howitzer | 4/3 |
| Aegis | 0/12 |
| Stalker Biped | 1/8 |
| Ironclad Goliath | 0/11 |
| Exosuit Breacher | 0/16 |
| Trench Guard | 0/18 |
| Line Combat Medic | 0/17 |
| Phantom Speeder | 0/13 |
| Death Rider | 0/15 |
| Scout Biker | 0/14 |
| Recon Eye | 2/0 |
| Kamikaze Hunter | 0/2 |
| Aegis Support Drone | 4/1 |
| Tempest Strike Bomber | 1/11 |
| Stealthray Bomber | 0/11 |
| Komet Fighter | 0/1 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/0 |
| Apex Destroyer | 10/0 |
| Iron Bastion | 10/2 |
| Jackal Scout | 10/1 |
| Nomad Supply Buggy | 12/0 |
| Mirage Humvee | 11/0 |
| Viper Gunship | 13/0 |
| Hornet Interceptor | 10/0 |
| Falcon Dropship | 13/0 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/0 |
| Siege Howitzer | 8/0 |
| Aegis | 12/0 |
| Stalker Biped | 10/0 |
| Ironclad Goliath | 11/0 |
| Exosuit Breacher | 16/2 |
| Trench Guard | 18/3 |
| Line Combat Medic | 17/0 |
| Phantom Speeder | 13/0 |
| Death Rider | 15/0 |
| Scout Biker | 14/0 |
| Recon Eye | 2/0 |
| Kamikaze Hunter | 2/0 |
| Aegis Support Drone | 4/4 |
| Tempest Strike Bomber | 13/0 |
| Stealthray Bomber | 11/0 |
| Komet Fighter | 1/0 |

</details>

<details><summary>Kamikaze Hunter</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 1/3 |
| Apex Destroyer | 1/3 |
| Iron Bastion | 0/5 |
| Jackal Scout | 1/3 |
| Nomad Supply Buggy | 0/5 |
| Mirage Humvee | 0/4 |
| Viper Gunship | 0/6 |
| Hornet Interceptor | 0/3 |
| Falcon Dropship | 0/7 |
| Manticore MLRS | 4/1 |
| Sentinel Battery | 4/1 |
| Siege Howitzer | 4/1 |
| Aegis | 0/5 |
| Stalker Biped | 1/3 |
| Ironclad Goliath | 0/4 |
| Exosuit Breacher | 0/11 |
| Trench Guard | 0/13 |
| Line Combat Medic | 0/12 |
| Phantom Speeder | 0/7 |
| Death Rider | 0/9 |
| Scout Biker | 0/7 |
| Recon Eye | 2/0 |
| Kamikaze Hunter | 0/0 |
| Aegis Support Drone | 4/0 |
| Tempest Strike Bomber | 1/6 |
| Stealthray Bomber | 0/5 |
| Komet Fighter | 0/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 3/0 |
| Apex Destroyer | 3/0 |
| Iron Bastion | 5/2 |
| Jackal Scout | 3/1 |
| Nomad Supply Buggy | 5/0 |
| Mirage Humvee | 4/0 |
| Viper Gunship | 6/0 |
| Hornet Interceptor | 3/0 |
| Falcon Dropship | 7/0 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/0 |
| Siege Howitzer | 8/0 |
| Aegis | 5/0 |
| Stalker Biped | 3/0 |
| Ironclad Goliath | 4/0 |
| Exosuit Breacher | 11/2 |
| Trench Guard | 13/3 |
| Line Combat Medic | 12/0 |
| Phantom Speeder | 7/0 |
| Death Rider | 9/0 |
| Scout Biker | 7/0 |
| Recon Eye | 0/2 |
| Kamikaze Hunter | 0/0 |
| Aegis Support Drone | 0/4 |
| Tempest Strike Bomber | 6/0 |
| Stealthray Bomber | 5/0 |
| Komet Fighter | 0/0 |

</details>

<details><summary>Aegis Support Drone</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 2/10 |
| Apex Destroyer | 2/10 |
| Iron Bastion | 0/10 |
| Jackal Scout | 2/10 |
| Nomad Supply Buggy | 1/12 |
| Mirage Humvee | 1/11 |
| Viper Gunship | 0/13 |
| Hornet Interceptor | 0/10 |
| Falcon Dropship | 0/14 |
| Manticore MLRS | 5/8 |
| Sentinel Battery | 5/8 |
| Siege Howitzer | 5/8 |
| Aegis | 0/12 |
| Stalker Biped | 2/10 |
| Ironclad Goliath | 1/11 |
| Exosuit Breacher | 1/18 |
| Trench Guard | 0/20 |
| Line Combat Medic | 0/19 |
| Phantom Speeder | 1/14 |
| Death Rider | 0/16 |
| Scout Biker | 1/14 |
| Recon Eye | 4/4 |
| Kamikaze Hunter | 0/4 |
| Aegis Support Drone | 5/5 |
| Tempest Strike Bomber | 2/13 |
| Stealthray Bomber | 0/12 |
| Komet Fighter | 0/3 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/0 |
| Apex Destroyer | 10/0 |
| Iron Bastion | 10/4 |
| Jackal Scout | 10/2 |
| Nomad Supply Buggy | 12/1 |
| Mirage Humvee | 11/1 |
| Viper Gunship | 13/0 |
| Hornet Interceptor | 10/0 |
| Falcon Dropship | 14/0 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/0 |
| Siege Howitzer | 8/0 |
| Aegis | 12/1 |
| Stalker Biped | 10/0 |
| Ironclad Goliath | 11/1 |
| Exosuit Breacher | 18/3 |
| Trench Guard | 20/5 |
| Line Combat Medic | 19/2 |
| Phantom Speeder | 14/1 |
| Death Rider | 16/0 |
| Scout Biker | 14/1 |
| Recon Eye | 4/1 |
| Kamikaze Hunter | 4/0 |
| Aegis Support Drone | 5/5 |
| Tempest Strike Bomber | 13/0 |
| Stealthray Bomber | 12/0 |
| Komet Fighter | 3/0 |

</details>

<details><summary>Tempest Strike Bomber</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 11/9 |
| Apex Destroyer | 10/5 |
| Iron Bastion | 9/10 |
| Jackal Scout | 10/4 |
| Nomad Supply Buggy | 10/6 |
| Mirage Humvee | 10/6 |
| Viper Gunship | 5/7 |
| Hornet Interceptor | 9/4 |
| Falcon Dropship | 10/7 |
| Manticore MLRS | 13/1 |
| Sentinel Battery | 13/1 |
| Siege Howitzer | 13/1 |
| Aegis | 7/9 |
| Stalker Biped | 10/5 |
| Ironclad Goliath | 9/8 |
| Exosuit Breacher | 9/11 |
| Trench Guard | 7/13 |
| Line Combat Medic | 9/12 |
| Phantom Speeder | 9/7 |
| Death Rider | 8/9 |
| Scout Biker | 10/8 |
| Recon Eye | 13/0 |
| Kamikaze Hunter | 6/0 |
| Aegis Support Drone | 13/0 |
| Tempest Strike Bomber | 11/8 |
| Stealthray Bomber | 7/5 |
| Komet Fighter | 5/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 10/7 |
| Apex Destroyer | 8/6 |
| Iron Bastion | 10/13 |
| Jackal Scout | 7/10 |
| Nomad Supply Buggy | 9/10 |
| Mirage Humvee | 9/10 |
| Viper Gunship | 10/8 |
| Hornet Interceptor | 7/6 |
| Falcon Dropship | 11/10 |
| Manticore MLRS | 8/4 |
| Sentinel Battery | 8/7 |
| Siege Howitzer | 8/6 |
| Aegis | 11/9 |
| Stalker Biped | 8/6 |
| Ironclad Goliath | 10/9 |
| Exosuit Breacher | 15/11 |
| Trench Guard | 17/13 |
| Line Combat Medic | 16/12 |
| Phantom Speeder | 11/9 |
| Death Rider | 13/5 |
| Scout Biker | 11/10 |
| Recon Eye | 1/11 |
| Kamikaze Hunter | 1/6 |
| Aegis Support Drone | 2/13 |
| Tempest Strike Bomber | 11/8 |
| Stealthray Bomber | 9/7 |
| Komet Fighter | 0/5 |

</details>

<details><summary>Stealthray Bomber</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 9/7 |
| Apex Destroyer | 9/4 |
| Iron Bastion | 6/9 |
| Jackal Scout | 9/4 |
| Nomad Supply Buggy | 8/6 |
| Mirage Humvee | 8/5 |
| Viper Gunship | 4/7 |
| Hornet Interceptor | 6/4 |
| Falcon Dropship | 7/8 |
| Manticore MLRS | 12/2 |
| Sentinel Battery | 12/2 |
| Siege Howitzer | 12/2 |
| Aegis | 6/7 |
| Stalker Biped | 9/4 |
| Ironclad Goliath | 8/6 |
| Exosuit Breacher | 8/12 |
| Trench Guard | 4/14 |
| Line Combat Medic | 6/13 |
| Phantom Speeder | 8/8 |
| Death Rider | 7/10 |
| Scout Biker | 8/8 |
| Recon Eye | 11/0 |
| Kamikaze Hunter | 5/0 |
| Aegis Support Drone | 12/0 |
| Tempest Strike Bomber | 9/7 |
| Stealthray Bomber | 6/6 |
| Komet Fighter | 4/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 7/4 |
| Apex Destroyer | 4/5 |
| Iron Bastion | 9/11 |
| Jackal Scout | 4/9 |
| Nomad Supply Buggy | 6/8 |
| Mirage Humvee | 5/8 |
| Viper Gunship | 7/7 |
| Hornet Interceptor | 4/2 |
| Falcon Dropship | 8/7 |
| Manticore MLRS | 8/2 |
| Sentinel Battery | 8/6 |
| Siege Howitzer | 8/5 |
| Aegis | 7/8 |
| Stalker Biped | 4/5 |
| Ironclad Goliath | 6/8 |
| Exosuit Breacher | 12/10 |
| Trench Guard | 14/12 |
| Line Combat Medic | 13/9 |
| Phantom Speeder | 8/8 |
| Death Rider | 10/4 |
| Scout Biker | 8/8 |
| Recon Eye | 0/11 |
| Kamikaze Hunter | 0/5 |
| Aegis Support Drone | 0/12 |
| Tempest Strike Bomber | 7/5 |
| Stealthray Bomber | 6/6 |
| Komet Fighter | 0/4 |

</details>

<details><summary>Komet Fighter</summary>

Attacker vs …

| Enemy | HP (me/them) |
| --- | --- |
| Zeus | 0/2 |
| Apex Destroyer | 0/2 |
| Iron Bastion | 0/2 |
| Jackal Scout | 0/2 |
| Nomad Supply Buggy | 0/4 |
| Mirage Humvee | 0/3 |
| Viper Gunship | 0/5 |
| Hornet Interceptor | 0/2 |
| Falcon Dropship | 0/6 |
| Manticore MLRS | 3/0 |
| Sentinel Battery | 3/0 |
| Siege Howitzer | 3/0 |
| Aegis | 0/4 |
| Stalker Biped | 0/2 |
| Ironclad Goliath | 0/3 |
| Exosuit Breacher | 0/10 |
| Trench Guard | 0/12 |
| Line Combat Medic | 0/11 |
| Phantom Speeder | 0/6 |
| Death Rider | 0/8 |
| Scout Biker | 0/6 |
| Recon Eye | 1/0 |
| Kamikaze Hunter | 0/0 |
| Aegis Support Drone | 3/0 |
| Tempest Strike Bomber | 0/5 |
| Stealthray Bomber | 0/4 |
| Komet Fighter | 0/0 |

Defender vs … (enemy attacks first)

| Enemy | HP (them/me) |
| --- | --- |
| Zeus | 2/0 |
| Apex Destroyer | 2/0 |
| Iron Bastion | 2/1 |
| Jackal Scout | 2/0 |
| Nomad Supply Buggy | 4/0 |
| Mirage Humvee | 3/0 |
| Viper Gunship | 5/0 |
| Hornet Interceptor | 2/0 |
| Falcon Dropship | 6/0 |
| Manticore MLRS | 8/0 |
| Sentinel Battery | 8/0 |
| Siege Howitzer | 8/0 |
| Aegis | 4/0 |
| Stalker Biped | 2/0 |
| Ironclad Goliath | 3/0 |
| Exosuit Breacher | 10/1 |
| Trench Guard | 12/2 |
| Line Combat Medic | 11/0 |
| Phantom Speeder | 6/0 |
| Death Rider | 8/0 |
| Scout Biker | 6/0 |
| Recon Eye | 0/1 |
| Kamikaze Hunter | 0/0 |
| Aegis Support Drone | 0/3 |
| Tempest Strike Bomber | 5/0 |
| Stealthray Bomber | 4/0 |
| Komet Fighter | 0/0 |

</details>

