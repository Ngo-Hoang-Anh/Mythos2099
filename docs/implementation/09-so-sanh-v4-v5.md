# 09 — So sánh V4 / V5 với code

Tài liệu gốc:

- **V4** — `Tai Lieu Thiet Ke Game - Sci-Fi War Vehicle TCG V4 (Horizontal Layout).docx` (board, turn, Move/Maneuver)
- **V5** — `Tai_Lieu_Thiet_Ke_Game_SciFi_TCG_V5.pdf` (HQ 100, breakpoints, Air Strike, slots/archetypes)

Code hiện tại (**Mythos2099**) là hybrid: giữ khung V4 + keyword/combat sâu từ V5, nhưng **số liệu cân bằng đã đổi** cho bản playable.

| Chủ đề | V4 | V5 | Code hiện tại |
| --- | --- | --- | --- |
| Board 4×5, Support/Front, không vượt biên | ✓ | ✓ | ✓ |
| Lượt: Deploy → Maneuver → Engagement | ✓ | (ít mô tả) | ✓ |
| HQ max | không ghi | **100** | **60** |
| HQ breakpoint punish | — | 80/60/45/30/20/10: discard + −CP | Mốc **45/30/20/10**, hệ stacks — **TEMP off** |
| Supply gốc | **5** + units | **5** + units | **4** + units |
| Người đi sau | — | — | +1 Supply × **2** lượt + Sealed Orders |
| Discard-redraw / lượt | **1** | **1** | **2** |
| Deck hết | Bỏ Maneuver | Bỏ Maneuver | Vẫn Maneuver; hand rỗng mới skip |
| Mở bài / rút / hand limit | — | — | 5 / +2 từ turn 2 / limit 9 |
| Damage súng | ATK − Armor | + AP như pierce | ATK + Agg/SF/temp − max(0, Armor−AP) |
| Missile vs armor | Giảm theo Armor (full) | Giảm theo Armor | **floor(Armor/2)**, không AP |
| Return fire | Mỏng (Artillery không retaliate) | Artillery/Air Strike | Ma trận đầy đủ (REST, Jet trade, không HQ) |
| Air Strike / Jet | — | ✓ | ✓ (`canVolley` từ Support) |
| Sealed Orders / Desperate / Elimination | — | — | Có trong code |
| Brand / deploy | — | — | Mythos2099; Fly FE+BE tách |

Khi thiết kế lại balance: ưu tiên **đổi constant trong `src/engine/types.ts`**, rồi cập nhật file này + `00-quy-tac-local.md`.
