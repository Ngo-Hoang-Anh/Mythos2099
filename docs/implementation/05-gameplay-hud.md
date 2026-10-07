# 05 — HUD trận & animation

- Trữ quân trái, bài tay phải. Phase mặc định: triển khai → trữ quân, điều phối → tay bài. Hover/click đổi focus: bên focus phóng to ra giữa, bên kia thu nhỏ.
- Chip trữ quân có keyword.
- Move: unit drives a curved path inside its own side (aisle between Support and Front; never the frontier). Hull follows the curve; on arrival hull stays, guns traverse toward the enemy. Attack: recoil, shot sprites, Kenney explosions.
- Token/HUD dùng icon tự vẽ (`src/ui/icons.tsx`), không còn chữ HP/ATK/ARM/AP/CP trên token. Keyword vàng; HP vòng đỏ; ATK kiếm; Armor khiên; AP giáo xuyên khiên; Supply (ex-CP) can xăng. Keyword có số: hình chữ nhật icon | số.
- AP là chỉ số lá bài, không còn keyword Armor Piercing. Class máy bay đổi thành Helicopter. Catalog 24 unit theo sheet (bỏ Titan Prime / Vanguard Titan).
- Tooltip move: lưới 3×3, ô giữa = vị trí hiện tại (đen), phải = tiến về địch, trái = rút. Forward chỉ tô ô thẳng phía trước; Retreat tô cả 3 ô trái. Up tô ô trên + chéo lùi trên; Down tô ô dưới + chéo lùi dưới; Up or Down chỉ thẳng lên/xuống. Forward/Retreat có mũi tên Ta → Địch phía trên lưới.
- HUD: vòng Reserved units mở dialog giữa màn (xem mọi phase). Chip trữ quân cùng chiều ngang (lưới 2 cột). Stat = 0 không hiện trên portrait/bàn. Triệu hồi: click unit trong dialog → portrait float trên vòng Reserved → click ô Support trống. Tay bài quạt quanh origin rất xa dưới màn (~2400px); từ lá thứ 7 khoảng cách (kể cả lúc hover) bị siết để không overflow; hover tỏa + tooltip; mặt bài tên + khung art. Log float: mỗi phase một khung lớn, mỗi bước resolve một khung nhỏ, sát thương ghi rõ nguồn (ATK/Artillery/Missile/Retaliate) kèm icon. Nút pass hiện tên phase tiếp theo. Header liệt kê 3 phase, phase hiện tại được highlight.
