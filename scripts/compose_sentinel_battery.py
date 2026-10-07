"""Scrap the orange light-tank sheet into Sentinel Battery hull + 1× gun packs."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r"C:\Users\ADMIN\.cursor\projects\f-CodeProject-Armored-Legend\assets"
    r"\c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944"
    r"_images_image-61d155f7-bddb-4e4e-8ffd-55af7369bdff.png"
)
OUT = ROOT / "public" / "units-art" / "tanks" / "Sentinel"
SIZE = 256
MOUNT = (128, 148)


def dilate(mask: np.ndarray, iters: int = 1) -> np.ndarray:
    out = mask.copy()
    h, w = out.shape
    for _ in range(iters):
        pad = np.pad(out, 1, constant_values=False)
        nxt = out.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                nxt |= pad[1 + dy : h + 1 + dy, 1 + dx : w + 1 + dx]
        out = nxt
    return out


def face_up(im: Image.Image) -> Image.Image:
    """Source faces left; ROTATE_270 turns the nose up."""
    return im.transpose(Image.Transpose.ROTATE_270)


def longest_run(xs: np.ndarray) -> tuple[int, int]:
    breaks = np.where(np.diff(xs) > 1)[0]
    starts = np.r_[0, breaks + 1]
    ends = np.r_[breaks, len(xs) - 1]
    runs = [(int(xs[s]), int(xs[e]), e - s + 1) for s, e in zip(starts, ends)]
    runs.sort(key=lambda t: -t[2])
    return runs[0][0], runs[0][1]


def is_orange(p: np.ndarray) -> bool:
    return bool(p[0] > 150 and p[1] < 160 and p[0] > p[1] + 20)


def find_socket(hull_im: Image.Image) -> tuple[int, int]:
    ha = np.array(hull_im)
    dark = (ha[:, :, 3] > 200) & (ha[:, :, 0] < 40) & (ha[:, :, 1] < 40) & (ha[:, :, 2] < 40)
    cys, cxs = np.where(ha[:, :, 3] > 10)
    cx0, cy0 = float(cxs.mean()), float(cys.mean())
    best: tuple[int, int] | None = None
    best_score = -1
    for cy in range(int(cy0 - 40), int(cy0 + 40)):
        for cx in range(int(cx0 - 30), int(cx0 + 30)):
            if not (0 <= cy < ha.shape[0] and 0 <= cx < ha.shape[1]):
                continue
            score = int(dark[max(0, cy - 8) : cy + 9, max(0, cx - 8) : cx + 9].sum())
            if score > best_score and score > 20:
                best_score = score
                best = (cx, cy)
    if best is None:
        return int(cx0), int(cy0)
    return best


def main() -> None:
    raw = np.array(Image.open(SRC).convert("RGBA"))
    h, w = raw.shape[:2]
    content = np.linalg.norm(raw[:, :, :3].astype(np.float32) - np.array([248.0, 248.0, 248.0]), axis=2) > 28
    r, g, b = raw[:, :, 0].astype(int), raw[:, :, 1].astype(int), raw[:, :, 2].astype(int)
    sat = raw[:, :, :3].max(2) - raw[:, :, :3].min(2)
    val = raw[:, :, :3].max(2)
    orange = (r > 150) & (g < 160) & (b < 130) & (r > g + 25) & content
    metal = (sat < 55) & (val > 95) & (val < 235) & content & ~orange
    dark = (val < 60) & content

    bx0, bx1 = longest_run(np.where(metal[58])[0])
    print(f"barrel x={bx0}..{bx1}")

    gun = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for yy in range(48, 75):
        for x in range(bx0 - 1, bx1 + 2):
            if metal[yy, x]:
                gun[yy, x] = True
                q.append((yy, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < h and 0 <= nx < w) or gun[ny, nx] or not content[ny, nx]:
                continue
            if ny < 45 or ny > 79 or nx < bx0 - 6 or nx > bx1 + 24:
                continue
            if metal[ny, nx]:
                gun[ny, nx] = True
                q.append((ny, nx))
            elif dark[ny, nx] and metal[max(0, ny - 2) : ny + 3, max(0, nx - 2) : nx + 3].any():
                if 48 <= ny <= 76:
                    gun[ny, nx] = True
                    q.append((ny, nx))
            elif orange[ny, nx] and nx >= (bx0 + bx1) // 2 and nx <= bx1 + 18 and abs(ny - 61) <= 12:
                if gun[max(0, ny - 2) : ny + 3, max(0, nx - 2) : nx + 3].sum() >= 3:
                    gun[ny, nx] = True
                    q.append((ny, nx))

    gun = dilate(gun, 1) & content
    gys, gxs = np.where(gun)
    print(f"gun bbox {int(gxs.min())},{int(gys.min())}..{int(gxs.max())},{int(gys.max())} px={int(gun.sum())}")

    pad = 2
    gy0, gy1 = max(0, int(gys.min()) - pad), min(h, int(gys.max()) + pad + 1)
    gx0, gx1 = max(0, int(gxs.min()) - pad), min(w, int(gxs.max()) + pad + 1)
    gun_crop = raw[gy0:gy1, gx0:gx1].copy()
    gun_crop[:, :, 3] = np.where(gun[gy0:gy1, gx0:gx1], 255, 0).astype(np.uint8)

    corridor = np.zeros((h, w), dtype=bool)
    corridor[50:74, bx0 - 2 : bx1 + 20] = True
    erase = (dilate(gun, 3) | (metal & corridor)) & content

    hull = raw.copy()
    hull[:, :, 3] = np.where(content, 255, 0).astype(np.uint8)
    hull[erase] = (0, 0, 0, 0)

    for yy, xx in zip(*np.where(erase)):
        left = right = None
        for x in range(xx - 1, max(-1, xx - 50), -1):
            if hull[yy, x, 3] > 0 and not erase[yy, x]:
                left = hull[yy, x].copy()
                break
        for x in range(xx + 1, min(w, xx + 50)):
            if hull[yy, x, 3] > 0 and not erase[yy, x]:
                right = hull[yy, x].copy()
                break
        if left is not None and right is not None:
            if is_orange(left) and is_orange(right):
                hull[yy, xx] = ((left.astype(np.int16) + right.astype(np.int16)) // 2).astype(np.uint8)
            elif is_orange(left):
                hull[yy, xx] = left
            elif is_orange(right):
                hull[yy, xx] = right
            else:
                hull[yy, xx] = ((left.astype(np.int16) + right.astype(np.int16)) // 2).astype(np.uint8)
        elif left is not None:
            hull[yy, xx] = left
        elif right is not None:
            hull[yy, xx] = right
        else:
            hull[yy, xx] = (206, 74, 22, 255)

    # Pivot on the barrel centerline at the breech (not the offset orange blob).
    my = 61
    mx = bx1 - 3
    print(f"mount src ({mx},{my})")

    yy, xx = np.ogrid[:h, :w]
    sock = (yy - my) ** 2 + (xx - mx) ** 2 <= 8**2
    ring = ((yy - my) ** 2 + (xx - mx) ** 2 <= 9**2) & ~sock
    hull[sock] = (24, 20, 16, 255)
    hull[ring] = (42, 36, 28, 255)

    hys, hxs = np.where(hull[:, :, 3] > 10)
    hy0, hx0 = int(hys.min()), int(hxs.min())
    hull_crop = hull[hy0 : int(hys.max()) + 1, hx0 : int(hxs.max()) + 1].copy()

    hull_im = face_up(Image.fromarray(hull_crop))
    gun_im = face_up(Image.fromarray(gun_crop))

    # PIL ROTATE_270 = 90° CW: (x, y) → (H - 1 - y, x); new size (H, W).
    def rot270(px: int, py: int, pre_h: int) -> tuple[int, int]:
        return pre_h - 1 - py, px

    hull_pre_h = hull_crop.shape[0]
    gun_pre_h = gun_crop.shape[0]
    mount_x, mount_y = rot270(mx - hx0, my - hy0, hull_pre_h)
    g_ox, g_oy = rot270(mx - gx0, my - gy0, gun_pre_h)

    ga = np.array(gun_im)
    yy, xx = np.ogrid[: ga.shape[0], : ga.shape[1]]
    hole = (yy - g_oy) ** 2 + (xx - g_ox) ** 2 <= 5**2
    ring = ((yy - g_oy) ** 2 + (xx - g_ox) ** 2 <= 6**2) & ~hole
    vis = ga[:, :, 3] > 0
    ga[hole & vis] = (22, 20, 18, 255)
    ga[ring & vis] = (40, 36, 30, 255)
    gun_im = Image.fromarray(ga)

    hull_canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hull_canvas.alpha_composite(hull_im, (MOUNT[0] - mount_x, MOUNT[1] - mount_y))

    gun_canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gun_canvas.alpha_composite(gun_im, (MOUNT[0] - g_ox, MOUNT[1] - g_oy))

    OUT.mkdir(parents=True, exist_ok=True)
    hull_canvas.save(OUT / "Hull_01.png")
    gun_canvas.save(OUT / "Gun_01.png")

    prev = hull_canvas.copy()
    prev.alpha_composite(gun_canvas)
    prev.save(ROOT / "_preview_sentinel.png")

    print(f"mount={MOUNT} hull_socket=({mount_x},{mount_y}) gun_origin=({g_ox},{g_oy}) gun={gun_im.size}")
    print(f"wrote {OUT}")

if __name__ == "__main__":
    main()
