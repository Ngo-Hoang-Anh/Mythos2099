# Debug Session: tutorial-dialog-viewport
- **Status**: [OPEN]
- **Issue**: Trong tutorial (đặc biệt là step highlight HP HQ đối thủ), chỉ thấy highlight/spotlight chạy, nhưng dialog ghi giải thích không hiện lên hoặc nằm ngoài viewport (không thấy). Phải tìm nguyên nhân và fix cho toàn bộ tutorial.
- **Debug Server**: (sẽ cập nhật port khi khởi chạy)
- **Log File**: .dbg/trae-debug-log-tutorial-dialog-viewport.ndjson

## Reproduction Steps
1. Mở app (Tutorial Hub) → chọn tutorial Basic "Win Condition & Battlefield" (lesson `battlefield`).
2. Bỏ qua các popup đầu tiên cho đến step `Enemy HQ HP` (anchor `hq-hp-1`).
3. Quan sát: spotlight có khoanh vùng đúng HP HQ đối thủ, nhưng dialog giải thích có thể không hiện hoặc nằm ngoài màn hình.
4. Lặp lại với một số lesson khác (vd: `initiative`, `basic-engagement-rest`, `basic-return-fire`) ở các anchor `lane-*`, `hq-hp-*`, `phase`, `hourglass`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `pickHint()` không trả về hint hợp lệ (dismissed cache / condition chưa đúng) nên không render tooltip dialog, chỉ có highlight riêng lẻ ko cùng lifecycle | High | Low | Pending |
| B | Anchor element không tồn tại hoặc `getBoundingClientRect()` trả về `{0,0,0,0}` (ẩn/hydration delay) → tooltip position bị clamp ra ngoài viewport hoặc không render | High | Med | Pending |
| C | Tooltip popup tính toán position theo anchor nhưng thiếu flip/keep-inside-view (vd: anchor ở right-top thì popup vượt phải/trên màn hình) | Med | Med | Pending |
| D | Có z-index / overlay / combat playback / `hud.animating` ngăn chặn render hoặc che khuất tooltip (mặc dù user thấy highlight) | Med | Low | Pending |
| E | Map `anchorName → selector` trong `TutorialView.tsx` bị thiếu/lệch (ví dụ `hq-hp-1` không trùng với `data-tut` đã đặt trong `BoardView.tsx`) → không tìm được element để position, popup bị rơi xuống default corner | High | Low | Pending |

## Log Evidence
Pending.

## Verification Conclusion
Pending.
