# 03 — Unit test local

`npm test` (Vitest) — 42 test, 8 file.

Phủ thêm pipeline engagement:

- Relocation: tiến + rest, artillery đứng yên, Cover ưu tiên làn có pháo, Flank rồi vẫn tiến
- Stats: Aggressive cộng ATK
- Damage: 0 HP vẫn phản công rồi mới bị xóa
- Missile: ưu tiên hàng sau, skip rest, hòa khoảng cách thì làn trên; armor tính 50% (làm tròn xuống), không AP
- `endManeuver` giữ phase `engagement` cho tới `endEngagement`

Vẫn cover: ATK/Armor/AP, 24 unit, bàn 4×5, Blitz, HQ artillery, Maneuver khi hết deck, breakpoint (skipped while TEMP off), fizzle, CP, AI.
