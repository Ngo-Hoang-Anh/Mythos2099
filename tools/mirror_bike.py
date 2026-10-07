from PIL import Image
import numpy as np
from pathlib import Path

src = Path(r"C:\Users\ADMIN\.cursor\projects\f-CodeProject-Armored-Legend\assets\c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944_images_image-c96b2fa3-451b-4095-be65-e18116f589f0.png")
out_dir = Path(r"f:\CodeProject\Armored Legend\assets")
out_dir.mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert("RGBA")
arr = np.array(im)
h, w = arr.shape[:2]
print("size", w, h)

# Detect right dark UI border (near-black columns)
col_mean = arr[:, :, :3].astype(float).mean(axis=(0, 2))
print("col mean last 15:", [round(float(x), 1) for x in col_mean[-15:]])
print("col mean first 10:", [round(float(x), 1) for x in col_mean[:10]])

# Right border: dark columns at end
right_border_start = w
for x in range(w - 1, w // 2, -1):
    if col_mean[x] < 45:
        right_border_start = x
    else:
        break
print("right_border_start", right_border_start)

# Crop away right border before processing
usable_w = right_border_start if right_border_start < w else w
work = arr[:, :usable_w, :].copy()
wh, ww = work.shape[0], work.shape[1]
print("work size", ww, wh)

bg = work[0, 0, :3].astype(int)
# use a more robust bg: mode of top-left 5x5
diff = np.abs(work[:, :, :3].astype(int) - bg).sum(axis=2)
mask = diff > 30

content_cols = np.where(mask.any(axis=0))[0]
print("content x", int(content_cols[0]), int(content_cols[-1]))

rgb = work[:, :, :3].astype(int)
yellow = (rgb[:, :, 0] > 180) & (rgb[:, :, 1] > 160) & (rgb[:, :, 2] < 130)
ys = np.where(yellow)
ymean = float(ys[1].mean()) if len(ys[0]) else None
print("yellow mean x", ymean, "range", int(ys[1].min()), int(ys[1].max()) if len(ys[0]) else None)

# Central grey spine: look for bright-ish vertical strip around yellow
# Also find leftmost winglet extent
left_extent = int(content_cols[0])

# Score centers by: after mirror, leftmost content distance from center should match
# Primary: yellow centroid; secondary: maximize symmetry on available overlap

def symmetry_score(c):
    max_d = min(c - left_extent, ww - 1 - c)
    if max_d < 8:
        return 1e9
    errs = []
    for y in range(wh):
        left = work[y, c - max_d : c, :3].astype(int)
        right = work[y, c + 1 : c + 1 + max_d, :3].astype(int)
        # weight by content presence
        lmask = mask[y, c - max_d : c]
        rmask = mask[y, c + 1 : c + 1 + max_d][::-1]
        both = lmask & rmask
        if both.sum() < 3:
            continue
        err = np.abs(left[::-1] - right)  # wait compare left flipped to right
        # left[:,::-1] along x: left is already a slice; flip left
        left_f = left[::-1]
        e = np.abs(left_f - right).mean(axis=1)
        errs.append(e[both].mean())
    return float(np.mean(errs)) if errs else 1e9

candidates = list(range(int(ymean) - 5, int(ymean) + 6)) if ymean else list(range(50, 75))
scored = [(c, symmetry_score(c)) for c in candidates]
scored.sort(key=lambda x: x[1])
for c, s in scored:
    print(f"center {c} score {s:.2f}")

best = scored[0][0]
print("BEST", best, "left_extent", left_extent)

# Build: left_part includes center column; right = mirror of left_extent..best-1
left_part = work[:, left_extent : best + 1, :]
to_mirror = work[:, left_extent:best, :]
right_part = to_mirror[:, ::-1, :]
full = np.concatenate([left_part, right_part], axis=1)
print("full", full.shape[1], "x", full.shape[0])

# Transparent background
out = full.copy()
bg2 = out[0, 0, :3].astype(int)
# sample bg from corners that look empty
diff2 = np.abs(out[:, :, :3].astype(int) - bg2).sum(axis=2)
out[diff2 <= 30, 3] = 0

# Trim empty margins
alpha = out[:, :, 3]
rows = np.where(alpha.any(axis=1))[0]
cols = np.where(alpha.any(axis=0))[0]
out = out[rows[0] : rows[-1] + 1, cols[0] : cols[-1] + 1, :]
print("trimmed", out.shape[1], "x", out.shape[0])

out_im = Image.fromarray(out, "RGBA")
out_path = out_dir / "bike_model.png"
out_im.save(out_path)
print("saved", out_path)

preview = Image.new("RGBA", out_im.size, (40, 40, 48, 255))
preview.paste(out_im, (0, 0), out_im)
# scale up 4x nearest for preview
preview4 = preview.resize((preview.width * 4, preview.height * 4), Image.NEAREST)
preview4.save(out_dir / "bike_model_preview.png")
print("preview", out_dir / "bike_model_preview.png")

# Also save a few center variants for comparison if scores are close
for c, s in scored[:3]:
    left_part = work[:, left_extent : c + 1, :]
    right_part = work[:, left_extent:c, :][:, ::-1, :]
    full = np.concatenate([left_part, right_part], axis=1)
    o = full.copy()
    d = np.abs(o[:, :, :3].astype(int) - bg2).sum(axis=2)
    o[d <= 30, 3] = 0
    Image.fromarray(o, "RGBA").save(out_dir / f"bike_model_c{c}.png")
    print("variant", c, s)
