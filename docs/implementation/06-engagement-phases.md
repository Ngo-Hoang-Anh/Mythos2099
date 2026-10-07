# 06 — Engagement theo phase

Cuối lượt, `endManeuver` gọi `beginEngagement`. Mỗi bước chỉ chạy khi có việc. Log lồng: Engagement (khung lớn) → từng phase (khung) → từng hành động (khung nhỏ). Sát thương ghi `deals N with ATK|Artillery|Air Strike|Missile|Retaliate` kèm icon. Engine resolve hết rồi mới trả `combatPlayback`; `endEngagement` mới `passTurn`.

| Phase | File | Highlight làn |
| --- | --- | --- |
| 1 Relocation | `relocation.ts` | Xanh lá — Flank trước, rồi Cover, rồi tiến + rest |
| 2 Stats | `stats.ts` | Vàng — `isAttacker` thì Aggressive, không thì Retaliate; Support Fire cộng ATK |
| 3 Damage | `damage.ts` | Đỏ — attacker bắn xuống làn (hoặc HQ); defender trả đòn lên từng unit đã tấn công nó (không HQ); 0 HP mới bị xóa |
| 4 Missile | `missile.ts` | Cam — missile phe tấn công, kể cả hàng sau, trừ unit rest |
| 5 Cleanup | `cleanup.ts` | Xóa 0 HP còn lại sau missile |

Rest: unit vừa tiến không tấn công, không bắn missile **trong engagement của lượt này**. Support Fire **vẫn** buff / nhận buff khi rested. Flag `rested` chỉ clear khi `passTurn` (hết lượt), không clear lúc `endEngagement` — để mid-turn extra combat / UI vẫn thấy rest đúng. Artillery / Air Strike / Jet không Advance tự động. Retaliate chỉ cộng ATK khi cùng lane còn địch chưa rest.

Cover ưu tiên làn có artillery/jet của mình. Flank ưu tiên làn không có quân mình; hòa thì gần nhất, rồi làn trên. Missile chỉ tính 50% armor (làm tròn xuống), không AP; ưu tiên hàng sau cùng làn, không thì làn gần nhất (hòa thì làn trên); không có địch trước mặt vẫn bắn (kể cả HQ), animation bay lên rồi rơi.
