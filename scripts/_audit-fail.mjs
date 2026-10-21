/**
 * Quick fail-path probe for free-play scenarios.
 * Run: node scripts/_audit-fail.mjs
 */
console.log(`
Manual audit checklist (engine rules: only attackers volley HQ; empty hand skips Maneuver):

01 basic
  wrong lane → Cadet shoots HQ, Dummy shoots P1 HQ. soloVolleys + HQ60 = STALEMATE not lose.
  FIX: P1 HQ low (≤2) so Dummy ATK 1 kills on wrong-lane volleys.

02 victory  
  1 Cadet open lane × 2 turns = 6 HQ → still wins.
  both on blockers = 0 dmg stalemate.
  FIX: P1 HQ ≤ blocker ATK sum on P2 turn; no soloVolleys; blockers ATK high.

03 resources
  Forward card = alternate win without Initiative Move.
  Cadet alone kills HQ 3 — Recruit optional.
  FIX: remove Forward; need Cadet+Recruit damage; Dummy punish.

04 armor / 07 cover / 08 aggro / 09 SF / 10 missile / 14 return
  No meaningful choices (watch). Accept as demo OR add alternate unit.

05 maneuver
  Skip Forward → Rest → survive → win next turn.
  FIX: enemy lethal on first Rest engage OR P1 HQ chip.

06 comeback
  P2 opens correctly. Turn2 one Cadet may fail clear — check.

11-17 card lessons: skip key card must lose same/next turn.
`);
