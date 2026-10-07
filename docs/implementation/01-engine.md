# 01 — Engine

Engine thuần TypeScript, không React, không I/O. Entry: `src/engine/index.ts`.

| File / thư mục | Việc |
| --- | --- |
| `types.ts` | State, action, keyword, card, **hằng số trận** (`HQ_MAX_HP`, Supply, draw…) |
| `combat.ts` | Công thức damage (súng / missile helpers) |
| `board.ts` | 4×5, Support/Front, không vượt biên |
| `combat/` | Engagement cuối lượt: relocation → stats → damage → missile → cleanup |
| `attack.ts` | Extra combat trong Maneuver; HQ damage (breakpoint punish TEMP off) |
| `effects.ts` | Toàn bộ Special / Maneuver / Move |
| `match.ts` | `createMatch`, `applyAction` (immutable), Supply / passTurn / rest clear |
| `army.ts` | Đúng 8 unit, ghép deck |
| `ai.ts` | AI tham lam (server dùng cho mode AI) |
| `elimination.ts` | Thua khi không còn lực lượng hợp lệ |
| `sandbox.ts` | Match tutorial (không validate army 8) |

`applyAction` luôn clone state. Server (`src/net/session.ts` + `server/gameServer.ts`) là chỗ duy nhất áp action trong trận online; UI chỉ gửi action và render view. Test engine gọi `applyAction` trực tiếp.

- Unit catalog: `src/data/units.ts` (từ Excel).
- Premade armies: `src/data/premadeArmies.ts`.
- Luật khớp code: [`00-quy-tac-local.md`](./00-quy-tac-local.md).
