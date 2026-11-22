# Tutorial keyword lesson — Veteran & First Strike

One Keywords-hub lesson that teaches **farming with Veteran** and **spending / answering First Strike**, using Barrier (already taught), Rally, Down, and the First Strike *card* (extra attack) as puzzle tools.

| Lesson id (suggested) | Keywords taught | Hub section | Prereqs |
|-----------------------|-----------------|-------------|---------|
| `veteran-first-strike` | Veteran, First Strike | Keywords (02) | `barrier-timing`, `movement-forward`, `movement-updown`, Rally / extra-attack familiarity |

Shared infra:

- Custom tutorial unit defs (high id range, e.g. 132x) + `artAliasId` from existing art.
- Multi-turn free-play / lightly scripted P2 (deploy Ambush T2; Rally + First Strike card T4) — pattern refs: `fire` (`fireOpponentScript`), `hulldown-slope` beats.
- Wire into `LessonId`, `LESSONS` / scenarios, `TUTORIAL_HUB`, `tutorialOrder()`, `lessons.test.ts`, `failPaths.test.ts`.

Canonical copy: `KEYWORD_SHORT` / `KEYWORD_FULL` in `src/engine/armySummary.ts`.  
Cards: Rally = `concentratedFire` (+3 ATK EOT), First Strike card = `quickMobilization` (extra attack), Down = move 1 row, Supply = +2 CP.

---

## Lesson — Veteran Farm & First Strike

**Id:** `veteran-first-strike`  
**Title (suggested):** Veteran Farm & First Strike  
**Subtitle:** Grow Veteran off a weak blocker, answer First Strike with Barrier, then Rally + Down for the exact lethal.  
**Hub chips:** `veteran`, `firstStrike`  
**Tooling (not new hub chips):** Barrier, Cover, Rally, First Strike card, Down, Supply, Forward

### Teaching beat

1. **Veteran** only grows on *your* attack volleys (not return fire). Park it on a 1 ATK grub and Forward so it shoots the same turn.
2. Enemy drops **Cover + First Strike** into an empty lane (Cover cannot enter the farm Front — cell occupied — so it stays).
3. **Barrier** (already taught) faces that Ambush: soak the counter on your turn; Barrier stays 0 through their turn and dies to Rally + extra attack before recharge.
4. Deploy your **First Strike 3** finisher + Rally into the Ambush lane; **Down** the buffed Veteran onto the HQ-siege Pillar. Exact clears; both of your survivors end at the scripted HP.

Without the farm stacks, Veteran cannot crack Pillar. Without Barrier first, mirroring First Strike leaves Ambush alive and you get executed on their Rally turn. Without Rally / Supply on the finale, Ambush or the cost wall stops the win.

### Rules reminders

| Keyword / card | Behavior relevant to this lesson |
|----------------|----------------------------------|
| Veteran n | After **attack** volley only, permanently +n ATK and +n AP. Stacks. |
| First Strike n | +n ATK while present. Removed after this unit **gun-attacks** or is **gun-hit** (0 dmg still strips). |
| Cover | If this lane has no enemy, move to Front of a lane that does (open cell only). Farm Front occupied → Ambush **stays**. |
| Barrier n | Next frontal gun hit −n then Barrier → 0. Recharges at **start of owner’s turn**. |
| Rally | Ally +3 ATK this turn (cost 1). |
| First Strike card | Extra attack (cost 1). Not the keyword. |
| Forward | Advance without Resting (needed so Veteran / Barrier shoot same turn). |
| Down | Move down 1 row (Front→Front does not rest). |
| Supply | +2 Supply this turn (cost 0). |

Gun math: `dmg = ATK − max(0, Armor − AP)`. HQ open-lane shots only on the **active** player’s attack volleys.

### Board setup (start)

```
Row 0  Farm     P1: empty                         P2: Grunt Front (1 ATK farm target)
Row 1  Pillar   P1: empty                         P2: Pillar Front (HQ siege)
Row 2  Ambush   P1: empty                         P2: empty → Ambush deploys T2
Row 3  unused
```

- **Reserve P1:** Vanguard (Veteran), Aegis (Barrier), Striker (First Strike)  
- **Reserve P2:** Ambush (Cover; First Strike)  
- **Hand P1:** Forward (Vanguard), Forward (Aegis) *or* Aegis has Blitz, Down (Vanguard), Rally (Vanguard→target Striker), Supply (any owner)  
- **Hand P2:** Rally (Ambush), First Strike card (Ambush)  
- **youFirst:** true  
- **win:** `elimination`  
- **Start supply:** `[4, 4]` — T1 exact for Vanguard 3 + Forward 1; later turns use normal `4 + board units`

### Stats table

| Unit | Side | Keywords | HP | ATK | AP | Armor | Cost | Role |
|------|------|----------|----|-----|----|-------|------|------|
| **Vanguard** | P1 | Veteran **2** | **11** | 2 | 0 | **1** | **3** | Farm Grunt T1+T3 → +4/+4; Down onto Pillar |
| **Aegis** | P1 | Barrier **4**; Blitz | **8** | 1 | 0 | 0 | **3** | Face Ambush; cannot chip ARM 3 |
| **Striker** | P1 | First Strike **3**; Blitz | **5** | 2 | **2** | 0 | **4** | T5 finisher; needs Rally |
| **Grunt** | P2 | — | **9** | **1** | **1** | **1** | — | Survives T2 Veteran return; dies T3; chips Vet through Armor |
| **Pillar** | P2 | — | **5** | **5** | 0 | **5** | — | HQ siege; dies to buffed Veteran exact |
| **Ambush** | P2 | Cover; First Strike **3** | **6** | **4** | 0 | **3** | **3** | Empty-lane drop; Rally + extra attack kills Aegis |

Ambush: **no Blitz** — T2 deploy Support → Cover blocked → auto-Advance **rests** → does not dump First Strike into HQ on the drop turn.

### Math

#### Veteran farm (Grunt ARM 1 HP 5, AP 1)

| Turn | Shooter | ATK / AP | Dmg to Grunt | Vet stacks after | Vet HP after chips |
|------|---------|----------|--------------|------------------|--------------------|
| T1 P1 | Vanguard | 2 / 0 | 2−1=**1** (HP 8) | +2 → **4/2** | 11−1 return=**10** |
| T2 P2 | Grunt | 1 / 1 | Vet return 4 → HP **4** | (no Veteran stack on return) | 10−1=**9** |
| T3 P1 | Vanguard | 4 / 2 | 4−max(0,1−2)=**4** (HP 0) | +2 → **6/4** | 9−1 corpse return=**8** |

T4: Grunt already dead. Vanguard sits at **ATK 6, AP 4, HP 8** until the Down.

#### Barrier vs Ambush

| Moment | Ambush ATK | Barrier | Result |
|--------|------------|---------|--------|
| T3 P1 — Aegis Forward/Blitz shoots (ATK 1 vs ARM 3 → 0 HP) | FS stripped on gun-hit | Return **4** fully soaked by Barrier 4 → Barrier **0**, HP 8 | |
| T4 P2 start | — | Still **0** (recharge is P1’s turn) | |
| T4 engagement after Rally (+3) | **7** | Barrier 0 | 7 → Aegis HP **1** |
| T4 First Strike **card** extra attack | **7** | — | Aegis dies |

Skip extra attack → Aegis lives at 1 → Barrier recharges on T5 → plan breaks.

#### Striker vs Ambush (T5)

| | ATK | AP | vs ARM 3 | Dmg | Notes |
|--|-----|----|----------|-----|-------|
| No Rally | 2+FS3=**5** | 2 | 5−1=**4** | Ambush lives at 2 |
| Rally +3 | 2+3+FS3=**8** | 2 | 8−1=**7** | Kills HP 6; corpse returns **4** → Striker 5→**1** |

#### Veteran vs Pillar (T5 after Down)

| | ATK / AP | vs ARM 5 | Dmg | Return (ATK 5 vs ARM 1) |
|--|----------|----------|-----|-------------------------|
| Buffed (after 2× Veteran 2) | **6 / 4** | 6−1=**5** | Exact HP 5; Vet 8−4=**4** |
| Only one farm attack (+2/+2) | 4 / 2 | 4−3=**1** | Pillar lives → fail |

#### HQ budget (Pillar open-lane only; Ambush rested on drop)

| Turn | HQ hit | Cumulative |
|------|--------|------------|
| T2 | Pillar **5** | 5 |
| T4 | Pillar **5** | 10 |

- **P1 HQ = 11** (survives script; third Pillar shot on a delayed timeline kills).  
- Ambush must stay non-Blitz so T2 does not also spend First Strike into HQ (would be +4 or +7 and blow the budget / strip FS early).

#### Supply across the script

| Turn | CP | Spend |
|------|----|-------|
| T1 | **4** (start) | Vanguard **3** + Forward **1** = 4 |
| T3 | **5** (4+1 Vet) | Aegis **3** |
| T5 | **5** (4+1 Vet; Aegis dead) | Striker **4** + Rally **1** + Down **1** = **6** → need **Supply** (+2) |

Without Supply on T5: after Striker deploy CP=1 → cannot afford Rally+Down.

### Correct play script

**T1 — P1 farm start**

1. Deploy Vanguard on **row 0** Support.  
2. Maneuver: **Forward** onto Front (do not auto-Advance / Rest).  
3. Engage: chip Grunt, Veteran → 4/2.

**T2 — P2 Ambush drop (scripted)**

1. Deploy Ambush on **row 2** Support (Cover; First Strike 3; no Blitz).  
2. Relocation: Cover wants row 0 Front — **occupied by Grunt** → stays; Advance → Front **rested**.  
3. Engage: only Pillar open-lanes HQ for 5. Ambush does not shoot (rested); First Strike still on.

**T3 — P1 Barrier answer**

1. Deploy Aegis into **row 2**; Forward or Blitz to Front.  
2. Engage: Aegis gun strips Ambush First Strike (0 HP through ARM 3); Ambush return 4 soaked by Barrier; Vanguard finishes Grunt and reaches **6/4**.

**T4 — P2 break Barrier (scripted)**

1. Rally Ambush (+3 ATK).  
2. End maneuver → engagement: 7 into Barrier-down Aegis (HP 8→1).  
3. First Strike **card** extra attack: 7 finishes Aegis.  
4. Pillar open-lanes HQ again (total 10). Grunt is already gone.

**T5 — P1 finale**

1. Deploy Striker (cost 4) Blitz/Forward into **row 2** (Ambush lane).  
2. Maneuver: **Supply** → **Rally** Striker → **Down** Vanguard row 0→1 onto Pillar.  
3. Engage: Striker 8/2 kills Ambush (Striker left at 1 HP); Vanguard 6/4 kills Pillar (Vanguard left at 4 HP).  
4. Elimination win.

### Fail paths

| Mistake | Why it loses |
|---------|----------------|
| **T3 deploy Striker into Ambush instead of Aegis** | Gun 5/2 deals 4 (Ambush 6→2), strips their FS; return 4 leaves Striker at 1. Ambush lives. T4 Rally + extra attack deletes Striker. No clean T5 answer; tempo / HQ fail. Feels like a “First Strike mirror” that trades into a loss (“hòa” then die). |
| **Deploy Aegis before Vanguard (T1 Barrier, farm late)** | Only **one** Veteran attack before the finale → 4/2 into Pillar ARM 5 deals **1**; Pillar lives. Extra turn lets Pillar’s third HQ shot (5) finish HQ 11→0. |
| **Skip Forward on Vanguard T1** | Auto-Advance rests → no T1 stack → same shortfall as above. |
| **T5 skip Rally** | Striker deals 4; Ambush lives at 2 and returns; board not cleared. |
| **T5 skip Supply** | Cannot pay Rally+Down after Striker 4. |
| **T5 skip Down** | Vanguard never reaches Pillar; Pillar keeps sieging / board not eliminated. |
| **T5 Down onto Ambush lane instead of Pillar** | Wrong target; Pillar survives. |

### Intro keyword order

1. Veteran (why Forward into the 1 ATK lane first)  
2. First Strike (Ambush buff; spent when shooting or shot; your Striker’s lethal math)  

Barrier / Cover / Rally / Down / Supply called out in coach as tools, not new hub chips.

### Coach (suggested)

> Grunt is weak but thick — park Vanguard (Veteran 2) there and Forward so it actually attacks. Each of your attack volleys permanently +2 ATK/+2 AP. The enemy will drop a Cover / First Strike Ambush into an empty lane (Cover cannot squeeze onto Grunt’s Front). Answer with Barrier: soak their counter on your turn, then expect Rally + an extra attack next turn before Barrier recharges. When Ambush is gone, Supply up, Rally your First Strike 3 Striker for exact lethal, and Down the now 6/4 Veteran onto the Pillar that has been chewing your HQ. End state: Striker at 1 HP, Vanguard at 4 HP, board clear.

### Success

Eliminate Grunt, Ambush, and Pillar by the end of turn 5. Surviving P1 units: Striker **1 HP**, Vanguard **4 HP**.

### Tests

1. Full correct script → P1 elimination; Striker hp=1, Vanguard hp=4; HQ ≥ 1.  
2. T3 Striker mirror → Ambush lives → T4 kills Striker → fail.  
3. Barrier before Veteran / skip T1 Forward → Pillar survives T5 gun → fail (or HQ death next P2 turn).  
4. T5 no Rally → Ambush lives.  
5. T5 no Supply → cannot play Rally+Down after Striker.  
6. Assert Ambush start keywords Cover + First Strike 3; Vanguard Veteran 2; Pillar open-lane HQ math 5+5 with P1 HQ 11.

---

## Hub / order placement

Suggested Keywords section insertion (after Barrier / movement basics, near other expansion keywords):

```
… barrier-timing → smoke-timing → …
  veteran-first-strike →
  scout-recon → hulldown-slope → …
```

Keep **after `barrier-timing`** (Barrier is a prerequisite tool). First Strike *card* lesson (`extra-attack`) can stay separate — this lesson teaches the **keyword**.

Update:

- `src/tutorial/lessons.ts` — `LessonId`, `TUTORIAL_HUB`, order helpers  
- `src/tutorial/scenarios.ts` — scenario draft + P2 script helper  
- `src/tutorial/lessons.test.ts` / `failPaths.test.ts`  
- `src/tutorial/authored.ts` — opponent script if not using beats  

---

## Implementation checklist

- [x] Custom units 132x (Vanguard, Aegis, Striker, Grunt, Pillar, Ambush) + art aliases  
- [x] Scenario draft: board rows 0/1/2, hands (Forwards, Down, Rally, Supply, P2 Rally + first_strike)  
- [x] P2 script: T2 deploy Ambush row 2; T4 Rally then First Strike card (only vs Aegis)  
- [x] Confirm Cover cannot enter row 0 Front while Grunt lives  
- [x] Confirm Ambush non-Blitz rests on T2 Advance (FS preserved until T3 gun-hit)  
- [x] Confirm T5 CP = 5 and Supply is required for cost 4+1+1  
- [x] Fail-path tests for mirror FS, skip Forward (underfarm), skip Rally, skip Supply  
- [x] Hub chips only `veteran` + `firstStrike`  
- [x] Grunt HP 9 so T2 Veteran return does not delete the farm target early
