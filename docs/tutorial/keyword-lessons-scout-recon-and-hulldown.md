# Tutorial keyword lessons — implementation brief

Two new Keywords-hub lessons for expansion keywords that exist in the engine/roster but are not yet taught.

| Lesson id (suggested) | Keywords taught | Hub section | Prereqs |
|-----------------------|-----------------|-------------|---------|
| `scout-recon` | Camouflage, Scout, Suppression, Blitz | Keywords (02) | `smoke-timing`, `missile`, Aggressive basics |
| `hulldown-slope` | Hulldown, Sloped Armor, Corrosion, Radar | Keywords (02) | `missile`, Armor basics |

Shared infra (do first if missing):

- Extend `ScenarioDraft` / `setupScenario` to seed starting **statuses** (`smokeDodge`, `suppressionMark`, `hulldownArmor`) and stale **`missileTarget`** (already supported on `PlacedUnitDraft`).
- Wire new lesson ids into `LessonId`, `LESSONS` / scenarios, `TUTORIAL_HUB` keywords section, `tutorialOrder()`, and `lessons.test.ts` hub expectations.
- Custom tutorial unit defs (high id range, e.g. 130x / 131x) + `artAliasId` from existing art.
- `spotlight: { keywords: true, reserve: true }` where deploy-from-reserve is the puzzle.
- Fail-path tests mirroring other keyword lessons (`failPaths.test.ts`).

Canonical keyword copy: `KEYWORD_SHORT` / `KEYWORD_FULL` in `src/engine/armySummary.ts`.  
Parsing / names: `KeywordName` in `src/engine/types.ts`, `parseKeywords` in `src/engine/keywords.ts`.

Pattern references: `src/tutorial/scenarios.ts` (`shock-match`, `missile`, `smoke-timing`), `src/tutorial/authored.ts`, `src/tutorial/lessons.ts`.

---

## Lesson A — Scout Recon

**Id:** `scout-recon`  
**Title (suggested):** Scout Recon  
**Subtitle:** Frontline Scout ignores Camouflage, Smoke, and Suppression — Blitz gets it there this turn.  
**Hub chips:** `camouflage`, `scout`, `suppression`, `blitz` (may also mention learned `smokeScreen` / `missile` in coach, not as new hub chips if already taught).

### Teaching beat

One deploy of **Blitz + Scout** onto Frontline simultaneously:

1. Lets allied **Missiles ignore Camouflage**
2. Lets **guns ignore active Smoke** (`smokeDodge`)
3. Lets your units **ignore Suppression marks** on you (−1 ATK / −2 AP per mark)
4. The Scout’s own gun **kills the Smoke unit** in its lane

Without Scout: Missile does 0 vs Camo; Smoke redirects guns to HQ; Suppression keeps the Missile unit’s gun weak — both enemies live and **Aggressive** finishes you / HQ next turn.

**Important:** One Scout kills “both” because **Scout gun + enabled Missile** resolve in the same engagement — not because one unit has splash.

### Rules reminders

| Keyword | Behavior relevant to this lesson |
|---------|----------------------------------|
| Camouflage | Immune to Missile unless enemy has **Frontline Scout** |
| Smoke Screen | After HP damage, `smokeDodge` — guns go to HQ; Missiles/skills still hit; Frontline Scout ignores |
| Suppression | End of thrower’s turn marks enemy cell (−1 ATK / −2 AP); lasts ~2 opponent turns (`remainingPasses: 4` when thrown); Frontline Scout ignores marks on you |
| Scout | While alive on **your Frontline**, allies ignore enemy Camo / Smoke and Suppression on you |
| Blitz | After deploy, advance to empty Frontline **without resting** — required so Scout is Frontline *this* turn |

Suppression does **not** reduce Missile power — only ATK/AP. Camo lane lethal must need **full gun ATK + Missile** so Suppression matters.

### Board setup

| Lane | P1 | P2 |
|------|----|----|
| **Row 0 — Camo** | **Spotter** Front: `Missile 4`, ATK 2, HP **3**, armor 0 · `missileTarget` → Ghost · **`suppressionMark`** on this cell | **Ghost** Front: `Camouflage`, `Aggressive 4`, ATK 2, HP 6, armor 0 |
| **Row 1 — Smoke** | *empty* (Blitz drop) | **Veil** Front: `Smoke Screen`, `Aggressive 5`, ATK 1, HP 6, armor 0 · **`smokeDodge` already active** (`remainingPasses: 2`) |
| Reserve | **Pathfinder**: `Blitz; Scout`, ATK 6, HP **2**, cost 0 | — |

- **HQ:** P1 = **6**, P2 = 60+  
- **Supply:** `[0, 0]`  
- **youFirst:** true  
- **win:** `elimination`  
- Optional flavor: P2 Support Suppression unit ATK 0 (already threw) — not required if mark is seeded.

### Stats table

| Unit | Keywords | HP | ATK | Agg | Role |
|------|----------|----|-----|-----|------|
| Spotter (P1) | Missile 4 | **3** | 2 | — | Locked on Camo; suppressed; survives return at 1 |
| Pathfinder (reserve) | Blitz; Scout | **2** | 6 | — | Only correct play; survives return at 1 |
| Ghost (P2) | Camouflage; Aggressive 4 | 6 | 2 | 4 | Needs gun + missile |
| Veil (P2) | Smoke Screen; Aggressive 5 | 6 | 1 | 5 | Exact Scout ATK; HQ threat 6 |

### Math

**Camo lane (Spotter gun + Missile)**

| | Effective ATK | Gun into Ghost HP6 | Missile | Result |
|--|--|--|--|--|
| No Frontline Scout | 2 − 1 Suppress = **1** | 6→5 | **0** (Camo) | Ghost lives |
| Scout on Front | **2** | 6→4 | **4** | 4+4 ≥ 6 → dead |

**Smoke lane (Pathfinder ATK 6)**

| | Gun | Result |
|--|--|--|
| No Frontline Scout | Redirect → HQ | Veil lives |
| Blitz into row 1 | 6 ignores Smoke | Veil dies exact |

**Return fire this turn** (P1 attacker — Aggressive does not apply on defend)

- Ghost returns ATK 2 → Spotter HP 3→**1**  
- Veil returns ATK 1 → Pathfinder HP 2→**1**  

**Fail / next turn if wrong**

- Ghost lives → attack: 2+Agg4 = **6** ≥ Spotter leftover 1  
- Veil lives → open lane / HQ: 1+Agg5 = **6** = P1 HQ  

Optional fail: Blitz into a *different* empty Front row → global Scout enables Camo kill, but Veil not shot → HQ dies next turn.

### Correct play

1. Deploy Pathfinder on **row 1** (Blitz to Front).  
2. End deployment → engagement.  
3. Pathfinder kills Veil; Spotter gun + Missile kill Ghost.  
4. Elimination win.

### Intro keyword order

1. Camouflage  
2. Suppression  
3. Scout  
4. Blitz (why Scout must reach Front *this* turn)

### Coach (suggested)

> Your Missile is locked on Ghost (Camouflage) but that cell is Suppressed — and Veil already has Smoke up, so guns go to HQ. Both enemies have enough Aggressive to end you next turn. Deploy Pathfinder (Blitz + Scout) into the Smoke lane: once Scout is on Frontline, Missiles pierce Camouflage, guns ignore Smoke, Suppression on you is ignored, and Pathfinder finishes Veil in the same engagement.

### Success

Eliminate Ghost and Veil in one turn.

### Tests

1. Deploy Pathfinder row 1 → end deploy → end engage → both enemies gone, winner P1.  
2. Skip deploy → engage → enemies live → P2 turn → HQ or Spotter dies.  
3. (Optional) Blitz wrong empty row → Ghost dies, Veil lives → P2 HQ lethal.  
4. Assert start: `missileTarget`, `suppressionMark`, `smokeDodge`.

---

## Lesson B — Hulldown / Sloped / Corrosion / Radar

**Id:** `hulldown-slope` (or `armor-break`)  
**Title (suggested):** Dig In & Soften Armor  
**Subtitle:** Missiles ignore Hulldown; Corrosion strips Sloped’s armor; Radar re-aims bad locks; Diversion moves clear dig-in.  
**Hub chips:** `hulldown`, `slopedArmor`, `corrosion`, `radar`  
**Tool card (not a hub keyword):** Diversion **C**

### Teaching beat

1. **Hulldown** dig-in: −3 gun damage; **Missiles ignore**; cleared when the unit **moves**.  
2. **Sloped Armor + Armor 3:** ATK 6 still **ricochets** (6−3=3 ≤ 3). Need Corrosion (or ATK ≥ 7).  
3. Deploy **Radar + Corrosion** drone into Slope lane → Radar re-aims stale Missiles; Corrosion strips 3 Armor (even if this hit ricochets HP).  
4. Missiles (now correctly locked) kill first Hulldown.  
5. Next turn **Diversion C** pulls second Hulldown onto the empty missile lock (move clears dig-in / strips keywords).  
6. Deploy vanilla **ATK 4** into Slope (Armor 0) → 4 > Sloped threshold → finish.

### Rules reminders

| Keyword / card | Behavior |
|----------------|----------|
| Hulldown | EOT dig-in (`hulldownArmor`); −3 gun after armor/AP; missiles ignore; any move clears |
| Sloped Armor | After Shield/Barrier, if remaining gun dmg is 1–3 → 0 (ricochet) |
| Corrosion n | On connecting gun hit, permanently −n Armor **before** damage math (same hit) |
| Radar | On **deploy** or attack, all allied Missiles `reaim` via `pickMissileTarget` (prefer same lane as each shooter) |
| Diversion C | Move enemy to **this unit’s lane**; strip keywords until end of opponent’s turn; move also clears dig-in |
| Missile | Half armor (ceil); AP does not apply; Support non-arty units can still fire missiles if not rested |

**Do not teach “ATK 6 outs Armor 3 + Sloped”** — that still ricochets. Lesson point is Corrosion → ATK 4 finisher.

### Board setup

```
Row 0  P1: Lockfront (Missile 4) Front + Lockback (Missile 4) Support
       P2: Dig-A (Hulldown) Front — already dig-in
       Both P1 missileTarget: WRONG (e.g. Slope cell or empty)

Row 1  P1: empty
       P2: Slope (Sloped Armor, Armor 3) Front

Row 3  P1: empty
       P2: Dig-B (Hulldown) Front — already dig-in
           (far so empty-lock re-aim prefers Slope over Dig-B)
```

- **Reserve:** Acid Eye (`Blitz; Radar; Corrosion 3`) · Wedge (vanilla ATK 4, `Blitz`)  
- **Hand:** Diversion C owned by Lockfront (cost 2)  
- **Statuses start:** `hulldownArmor` on Dig-A and Dig-B  
- **Supply:** enough for Diversion C + cost-0 deploys  
- **HQ:** P1 = **8** (survive correct path at 1; skip Diversion dies next P2 turn)  
- **win:** `elimination`

### Stats table

| Unit | Keywords | HP | ATK | Armor | Role |
|------|----------|----|-----|-------|------|
| Lockfront | Missile 4 | **7** | 2 | 0 | Survives Dig-A then Dig-B returns at 1 |
| Lockback | Missile 4 | **2** | 0 | 0 | Support missiles only |
| Acid Eye | Blitz; Radar; Corrosion 3 | 2 | 2 | 0 | Deploy on Slope → Radar + strip |
| Wedge | Blitz | **2** | **4** | 0 | Finisher; mutual with Slope return after the kill |
| Dig-A | Hulldown | **8** | 3 | 0 | Exact 4+4 Missile |
| Dig-B | Hulldown | **8** | 3 | 0 | T2 onto lock via Diversion |
| Slope | Sloped Armor | **4** | 2 | **3** | Kills drone; dies to Wedge |

### Math highlights

- Dig-A HP 8 = Missile 4 + Missile 4 (ignore Hulldown). Lockfront gun ATK 2 − 3 HD ≈ **0**.  
- Acid Eye ATK 2 after Corrosion 3→0 Armor: dmg 2 ≤ 3 → **ricochet HP**, Armor stays 0. Slope ATK 2 kills drone HP 2.  
- Wedge ATK 4 vs Armor 0 + Sloped → **4 connects**, exact Slope HP 4. Without Corrosion: 4−3=1 → ricochet.  
- Dig-B on row 3: after Dig-A dies, empty lock would re-aim to **Slope ( nearer )** unless Diversion fills the lock cell.

### Correct play script

**Turn 1 — Corrosion + Radar + Missile Dig-A**

1. Deploy Acid Eye on **row 1** (Blitz Front).  
2. Radar fires → both Missiles re-lock Dig-A (same-lane preference).  
3. Engage: Corrosion strips Slope; drone dies; guns bounce Dig-A; Missiles 4+4 kill Dig-A. Lock remains on Dig-A’s empty cell.

**Turn 2 — Diversion + Missile Dig-B**

1. Play Diversion C from Lockfront → pull Dig-B into lane 0 onto the lock.  
2. Engage: Missiles (and/or full guns without −3) kill Dig-B.

**Turn 3 — Out Sloped**

1. Deploy Wedge Blitz row 1.  
2. Engage: ATK 4 finishes Slope → elimination.

Tempo note: T2+T3 can merge if supply allows; prefer separate beats so keywords are readable.

### Fail paths

| Mistake | Result |
|---------|--------|
| Skip Acid Eye / wrong lane | Missiles stay wrong; Slope keeps Armor 3; Dig-A lives (guns HD-blocked) |
| Deploy Wedge early into Slope | ATK 4 vs Armor 3 → ricochet |
| Skip Diversion T2 | Empty lock → Missiles re-lock Slope; Dig-B stays dug-in |
| Wrong Diversion target | Dig-B never stands on lock |

### Intro keyword order

1. Hulldown  
2. Sloped Armor  
3. Corrosion  
4. Radar  

Diversion is puzzle tooling (move clears Hulldown); optional coach callout, not a keyword chip.

### Coach (suggested)

> Two missiles are locked on the wrong cell, and Dig-A is Hulldown — guns take −3, but Missiles ignore it. Slope’s Armor 3 + Sloped Armor ricochets anything that leaves 1–3 after armor (even ATK 6). Deploy the Radar/Corrosion drone into Slope’s lane: Radar re-aims both Missiles onto Dig-A, Corrosion strips the 3 Armor. Next, Diversion the far Hulldown onto the empty missile lock — moving clears Hulldown. Finally drop the ATK 4 Wedge to finish the now-naked Slope.

### Success

Eliminate Dig-A, Dig-B, and Slope (order as scripted).

### Tests

1. Full correct script → winner P1 elimination.  
2. Skip drone → Dig-A and/or Slope survive fail path.  
3. Skip Diversion → missiles retarget Slope / Dig-B lives.  
4. Wedge before Corrosion → ricochet, Slope lives.  
5. Assert start: wrong `missileTarget`s, `hulldownArmor` on both Dig units, Diversion C in hand.

---

## Hub / order placement

Suggested Keywords section order insertion (after existing missile/smoke lessons):

```
… smoke-timing → shock-match → support-fire → missile →
  scout-recon → hulldown-slope →
  extra-attack → fire …
```

Exact slot can shift; keep **scout-recon** after Smoke + Missile, **hulldown-slope** after Missile + Armor.

Update:

- `src/tutorial/lessons.ts` — `LessonId`, `TUTORIAL_HUB`, order helpers  
- `src/tutorial/scenarios.ts` — scenario drafts  
- `src/tutorial/lessons.test.ts` — hub card lists + keyword chips per lesson  
- `src/tutorial/failPaths.test.ts` — fail paths  
- `src/tutorial/authored.ts` — status seeding if added on draft  

---

## Implementation checklist

- [x] `ScenarioDraft` initial `statuses` (or equivalent seed API) in `setupScenario`  
- [x] Lesson A scenario + custom units + intros + tests  
- [x] Lesson B scenario + custom units + Diversion C hand + intros + tests  
- [x] Hub + `tutorialOrder` / `nextTutorialId` expectations  
- [x] Confirm Radar re-aim prefers Dig-A (same lane as missile shooters) after drone deploys on Slope lane  
- [x] Confirm Diversion C owner stays on board (Lockfront) when card is played  
- [x] Confirm Acid Eye has Blitz (rested Support deploy would skip Corrosion gun the same turn)
