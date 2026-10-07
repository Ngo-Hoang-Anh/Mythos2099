# 07 — Tank / light-vehicle art

Portrait and board tokens share the same composed sprites. `UnitDef.hasArt` is true for the 6 Tank + Light Vehicle units plus the robot walkers (Stalker, Aegis, Ironclad Goliath), Sentinel Battery, and Siege Howitzer.

## Per-unit packs (preferred)

New tank / light-vehicle art lives under `public/units-art/tanks/{Name}/`:

| Unit | Folder | Hull | Gun |
| --- | --- | --- | --- |
| Iron Bastion | `Bastion/` | `Hull_02.png` | `Gun_08.png` |
| Mirage Humvee | `Humvee/` | `Hull_08.png` | `Gun_02.png` |
| Zeus | `Zeus/` | `Hull_05.png` | `Gun_06.png` |
| Siege Howitzer | `Siege/` | `Hull_01.png` | `Gun_01.png` |
| Sentinel Battery | `Sentinel/` | `Hull_01.png` | `Gun_01.png` |

Each PNG is a **256×256** canvas, facing **up**. The hull has a dark circular socket; the gun has a matching mount hole. Specs in `unitArt.ts` place the turret at the socket and set barrel `originX/Y` to the gun hole so they coincide:

| Unit | Hull socket | Gun origin | Chassis pivot |
| --- | --- | --- | --- |
| Bastion | (128, 150) | (128, 135) | (128, 128) |
| Humvee | (128, 151) | (128, 145) | (128, 128) |
| Zeus | (128, 152) | (128, 146) | (128, 128) |
| Sentinel | (128, 148) | (128, 148) | (128, 128) |
| Siege | (128, 142) | (128, 142) | (128, 128) |

Zeus uses one twin-barrel gun on a single mount (no second turret).

## Legacy + other classes

| Unit | Notes |
| --- | --- |
| Stalker / Aegis / Ironclad | `public/units-art/robot/{unit}/` biped pieces |
| Sentinel Battery | scraped orange hull + silver barrel (`tanks/Sentinel/`) |
| Siege Howitzer | mirrored scrap hull + twin gun (`tanks/Siege/`) |

Idle board facing: P1 +90°, P2 −90°. While driving, hull follows a curved own-side path; after parking, hull keeps that heading and turrets add `combatTurretExtra` so guns point at the enemy. Robot legs stride along the hull axis while `running`. Artillery with Hull+Gun packs (Siege, Sentinel) uses the same drive + turret settle as tanks.

Specs: `src/data/unitArt.ts`. Renderer: `src/ui/TankArt.tsx`. Move routes: `src/ui/movePath.ts`.
