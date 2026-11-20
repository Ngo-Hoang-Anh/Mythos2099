# Expansion keywords + 9 new units — vacuum balance summary

Generated: 2026-11-19 after applying Tab 1–3 of the Sci-Fi TCG balance report.

**Sources:** `docs/balance/vacuum-1v1.md`, `docs/balance/unit-value-breakdown.md`

## What shipped

### New units (ids 28–36)

| Id | Unit | Cost | Role keywords |
| ---: | --- | ---: | --- |
| 28 | Qinglong | 5 | Blitz, Barrier 4, Shock 4 |
| 29 | Baihu | 6 | Veteran 1, Shield 3, Sloped Armor |
| 30 | Pandora | 3 | Smoke Screen, Suppression, Corrosion 2 |
| 31 | Excalibur | 5 | Veteran 1, First Strike 4 |
| 32 | Longinus | 5 | Artillery, First Strike 4 |
| 33 | Thor | 4 | Shield 2, Shock 4 |
| 34 | Artemis | 3 | Jet Plane, Scout, Radar |
| 35 | Agni | 4 | First Strike 3, Fire 3, Corrosion 2 |
| 36 | Loki | 4 | Camouflage, Shield 3 + **Copy** (2S special) |

### Existing roster patches (highlights)

- Fenrir Aggressive 4 → **2**; Suzaku ATK/AP **5/5**, Fire 3, Hit & Run **3S**
- Xuanwu: Cover → **Hulldown + Sloped Armor**, HP 9 / Armor 4
- Heimdall +Hulldown, HP 16; Rostam HP 15
- Defense keywords traded HP/Armor; offense keywords traded ATK/AP (per report)

Vacuum now places **Jet Plane** on Support and initializes **Shield/Barrier** pools.

---

## Vacuum scoreboard (latest after tweaks + Shock/Corrosion fix)

| Unit | As ATK W/L | Avg HP (atk) | Avg HP (def) | Read |
| --- | --- | ---: | ---: | --- |
| **Excalibur** | **4**/0 | 10.5 | 10.0 | ATK nerf; FS 4 kept |
| **Qinglong** | **4**/0 | 9.6 | 9.0 | Shock 5 now in gun math |
| **Longinus** | **4**/0 | 8.0 | 3.7 | Glass FS artillery; ATK 3 |
| **Thor** | **4**/0 | 7.3 | 6.9 | Shock 4 now counts |
| Baihu | 3/0 | 9.7 | 9.4 | Shield 2 + Sloped |
| Agni | 3/0 | 8.4 | 7.9 | FS + Corrosion; Fire still offline |
| **Pandora** | 0/3 | 4.3 | 3.6 | Soft gun; Corrosion helps but ATK 1 |

*(Vacuum still omits cards, Smoke setup, Suppression, Fire DoT ticks, Radar, Copy, Cover/Flank, allied SF.)*

---

## Recommended stat / keyword tweaks

### Priority high (vacuum + value outliers)

1. **Excalibur (31)** — 10 first-strike kills as attacker.  
   - Prefer: First Strike **4 → 3**, or ATK **4 → 3**, or AP **5 → 4**.  
   - Keep Veteran 1; the opener is the problem, not the snowball.

2. **Longinus (32)** — Same 10 ATK-side kills; dies easily on defense (avg 4 HP).  
   - Prefer: First Strike **4 → 3** *or* printed ATK **4 → 3**.  
   - Optional: +1 HP if you want less glass after the FS nerf.

3. **Pandora (30)** — Lowest new-unit vacuum presence; Smoke/Suppression don’t show in 1v1 gun math.  
   - Prefer: ATK **1 → 2** and/or HP **8 → 10**.  
   - Alternate: Corrosion **2 → 3** if you want more late value than raw gun.

4. **Baihu (29)** — Top of value table (Total 30) + sticky vacuum HP.  
   - Prefer: Shield **3 → 2**, or ATK **5 → 4**, or drop Sloped Armor if Shield stays at 3.  
   - Avoid cutting Veteran (identity).

### Priority medium

5. **Qinglong (28)** — Survives (Barrier) but ATK 2 never closes.  
   - Prefer: ATK **2 → 3** *or* Shock **4 → 5** if you want anti-Shield identity over kills.  
   - Cost 5 with no kills looks expensive vs Huma/Thor.

6. **Artemis (34)** — Intentional support jet; vacuum gun is intentionally weak.  
   - Prefer: leave stats; if Scout+Radar feel light in playtests, +1 Missile keyword or ATK **2 → 3**.  
   - Do not push HP high — Jet + Scout is already tempo-safe.

7. **Agni (35)** — Fine gun opener; Fire/Corrosion under-counted in vacuum.  
   - Prefer: watch Fire HQ burn in real matches before buffing.  
   - If underwhelming in games: First Strike **3 → 4** *or* ATK **2 → 3**.

8. **Thor (33)** — Balanced mid. Optional polish: Shield **2 → 3** if Shock package feels soft vs Baihu/Thoth.

9. **Loki (36)** — Vacuum without Copy looks soft; with Copy he can spike.  
   - Prefer: leave until Copy playtest. If still weak: ATK **3 → 4** or Shield **3 → 4**.

### Existing units to re-check after expansion

| Unit | Note |
| --- | --- |
| **Suzaku** | Still dies often (avg HP ~0.6) but Hit & Run 3S + Fire 3 is the intended trade. Don’t buff ATK back. |
| **Xuanwu** | Sloped Armor + Armor 4 ricochets many 3-dmg hits; watch vs low-ATK openers. If too sticky, Armor **4 → 3**. |
| **Heimdall** | Still best retaliate wall; Hulldown stacks with Entrenchment in tests (tempArmor 6). Cap or make Hulldown non-stacking with Entrenchment if oppressive. |
| **Sekhmet / Eyes** | Still glass; Scout tax is OK. |

---

## Suggested next balance pass (order)

1. Nerfs: Excalibur FS/ATK, Longinus FS/ATK, Baihu Shield or ATK.  
2. Buffs: Pandora ATK/HP, Qinglong ATK.  
3. Re-run `npm run balance`.  
4. Manual playtests for **Fire DoT**, **Suppression marks**, **Smoke dodge**, **Radar re-aim**, **Loki Copy** (vacuum cannot grade these).

---

## Applied rule: nerf = cut raw; buff = raise keyword number

| Unit | Change | Why |
| --- | --- | --- |
| **Excalibur** | ATK **4 → 3**; keep First Strike **4** | Nerf raw gun; keep FS identity high |
| **Longinus** | ATK **4 → 3**; keep First Strike **4** | Same |
| **Baihu** | Shield **3 → 2**; keep Sloped; ATK **5 → 4**; AP **4 → 3** | Per design: keep Sloped, cut Shield + base |
| **Pandora** | Corrosion **2 → 3** | Buff via keyword, not ATK/HP |
| **Qinglong** | Shock **4 → 5** | Buff via keyword, not ATK |
| **Xuanwu** | Armor **4 → 3**; keep Retaliate **5** | Nerf raw armor; keep Retaliate |
| **Heimdall** | Hulldown **no stack** with Entrenchment | Dig-in rule |

Left alone: Artemis, Agni, Thor, Loki, Suzaku.

### Engine fix (Shock / Corrosion in math)

- **Shock:** +N gun strike vs units (and still depletes Shield/Barrier).
- **Corrosion:** always −N Armor once on a connecting gun hit, **before** damage (even through Shield/Barrier).
- Vacuum + value tools now count Shock; Corrosion affects the same engagement via the engine.

## Commands

```bash
npm run balance          # vacuum-1v1.md + unit-value-breakdown.md
npm run balance:vacuum   # vacuum only
npm run balance:value    # value breakdown only
```
