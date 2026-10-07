# 00 — Luật trận (khớp code hiện tại)

> **Nguồn sự thật = code** (`src/engine/`).  
> Tài liệu thiết kế gốc: V4 (turn/board/cards) + V5 (HQ/keywords/archetypes) trong `docs/MechaLegend-.../`.  
> Bản so sánh lệch V4/V5: [`09-so-sanh-v4-v5.md`](./09-so-sanh-v4-v5.md).

## Bàn cờ

- 4 cột × 5 làn. P1 trái: Support (cột 0) + Frontline (cột 1). P2 phải: Frontline (cột 2) + Support (cột 3).
- Unit **không** vượt biên giới. Tiến tối đa tới Frontline rồi bắn sang.

## Hằng số trận

| Hằng số | Giá trị |
| --- | --- |
| HQ max | **60** |
| Army | **8** unit khác nhau |
| Supply gốc | **4** + số unit trên bàn |
| Người đi sau | **+1 Supply** trong **2 lượt đầu** (`firstPlayerId` ≠ current) |
| Mở bài | **5**; người đi sau thêm **Sealed Orders** (Initiative) |
| Rút bài | Từ lượt thứ 2 của mỗi người: **2**/lượt; hand limit **9** |
| Discard-redraw | Tối đa **2**/lượt (cần còn deck) |
| Deploy cost | 3–6 Supply vào **Support** |

## Lượt

1. **Deployment** — summon vào Support.
2. **Maneuver** — chơi Move / Maneuver / Special; discard→redraw.
   - Hand **rỗng** → bỏ qua Maneuver, vào Engagement ngay.
   - Deck hết vẫn vào Maneuver (chơi bài còn trên tay); discard-redraw bị chặn.
3. **Engagement** — engine resolve đủ phase → `combatPlayback` → client `endEngagement` → `passTurn`.

Thắng khi: HQ địch = 0, đối thủ surrender, hoặc đối thủ **eliminated** (hết quân trên bàn + không summon nổi reserve kể cả Desperate + hết deck).

### Comeback

- **HQ marks** (HP lost from full: first **20**, then **15**, **10**, **5** → remaining **40 / 25 / 15 / 10**): if that player has **strictly less HQ HP** than the opponent → **+1 Supply** and **+1 draw** on their next turn.
- **Unit destroyed**: if that player has **fewer units on board + reserve** than the opponent → **+1 Supply** and **+1 draw** next turn (each death can stack).

## Combat (tóm tắt)

- **Súng:** `ATK + Aggressive|Retaliate + Support Fire + temp − max(0, Armor + temp − AP)`
- **Missile:** `Missile − floor((Armor + temp) / 2)` — không dùng AP
- **Volley:** unrested + `canVolley` (Frontline, hoặc Artillery / Air Strike / Jet trên Support)
- **Return fire:** defender trả từng attacker đã bắn nó — không HQ; REST vẫn counter; Artillery không trade; Jet có trade; 0 HP vẫn trả rồi mới chết
- **Rest:** sau Advance/Cover từ Support (và Artillery/Jet deploy trừ Blitz). Clear khi **`passTurn`**, không clear lúc `endEngagement`
- **Blitz:** deploy → Front nếu trống, không rest
- Chi tiết phase: [`06-engagement-phases.md`](./06-engagement-phases.md)

## Người đi sau (Initiative)

- +1 Supply × 2 lượt đầu
- Lá **Sealed Orders** (cost 0): chọn một — +1 Supply / Forward 1 unit / draw 1
