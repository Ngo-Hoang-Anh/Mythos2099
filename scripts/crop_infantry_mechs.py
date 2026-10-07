from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(
    r"C:\Users\ADMIN\.cursor\projects\f-CodeProject-Armored-Legend\assets"
    r"\c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944"
    r"_images_Screenshot_2026-09-17_032750-5494e239-9de2-4f43-bc32-2cee89ec7961.png"
)
OUT_DIR = Path(r"f:\CodeProject\Armored Legend\public\units-art\squads\infantry")
NAMES = ["breacher-mech.png", "trench-mech.png", "medic-mech.png"]


def dilate(mask: np.ndarray, iterations: int = 2) -> np.ndarray:
    out = mask.copy()
    h, w = mask.shape
    for _ in range(iterations):
        nxt = out.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            shifted = np.zeros_like(out)
            y0, y1 = max(0, dy), h + min(0, dy)
            x0, x1 = max(0, dx), w + min(0, dx)
            sy0, sy1 = max(0, -dy), h - max(0, dy)
            sx0, sx1 = max(0, -dx), w - max(0, dx)
            shifted[y0:y1, x0:x1] = out[sy0:sy1, sx0:sx1]
            nxt |= shifted
        out = nxt
    return out


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]

    samples = []
    for y0, x0 in ((0, 0), (0, w - 16), (h - 16, 0), (h - 16, w - 16), (0, w // 2 - 8)):
        samples.append(arr[y0 : y0 + 16, x0 : x0 + 16, :3].reshape(-1, 3).astype(np.float32))
    bg = np.median(np.concatenate(samples, axis=0), axis=0)
    rgb = arr[:, :, :3].astype(np.float32)
    dist = np.linalg.norm(rgb - bg, axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    # Content: colored OR clearly brighter/darker than panel gray
    mask = (sat > 28) | (dist > 38)
    print("bg", bg, "mask", float(mask.mean()))

    for i, name in enumerate(NAMES):
        x0 = int(w * i / 3)
        x1 = int(w * (i + 1) / 3)
        local = mask.copy()
        local[:, :x0] = False
        local[:, x1:] = False
        # Leave a gap between neighbors so flood doesn't bleed
        if i > 0:
            local[:, x0 : x0 + 8] = False
        if i < 2:
            local[:, x1 - 8 : x1] = False

        yy, xx = np.where(local)
        if len(yy) == 0:
            raise SystemExit(f"no content in third {i}")
        scores = sat[yy, xx] * 2 + dist[yy, xx]
        seed = int(np.argmax(scores))
        sy, sx = int(yy[seed]), int(xx[seed])

        visited = np.zeros((h, w), dtype=bool)
        q = deque([(sy, sx)])
        visited[sy, sx] = True
        while q:
            y, x = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and local[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

        ys, xs = np.where(visited)
        pad = 8
        bx0, bx1 = max(0, int(xs.min()) - pad), min(w - 1, int(xs.max()) + pad)
        by0, by1 = max(0, int(ys.min()) - pad), min(h - 1, int(ys.max()) + pad)
        crop = arr[by0 : by1 + 1, bx0 : bx1 + 1].copy()
        vis = visited[by0 : by1 + 1, bx0 : bx1 + 1]
        d = np.linalg.norm(crop[:, :, :3].astype(np.float32) - bg, axis=2)
        soft = dilate(vis, 2)
        alpha = np.zeros(vis.shape, dtype=np.uint8)
        alpha[soft] = 160
        alpha[vis] = 255
        alpha[(d < 22) & (~vis)] = 0
        crop[:, :, 3] = alpha

        # Kill flat panel-gray / soft shadow leftovers
        c_sat = crop[:, :, :3].max(axis=2) - crop[:, :, :3].min(axis=2)
        flat = (d < 45) & (c_sat < 22) & (crop[:, :, 3] > 0)
        crop[:, :, 3] = np.where(flat, 0, crop[:, :, 3])

        ys2, xs2 = np.where(crop[:, :, 3] > 24)
        out = Image.fromarray(crop).crop((int(xs2.min()), int(ys2.min()), int(xs2.max()) + 1, int(ys2.max()) + 1))
        path = OUT_DIR / name
        out.save(path)
        opaque = int((np.array(out)[:, :, 3] > 200).sum())
        print(name, out.size, "opaque", opaque)


if __name__ == "__main__":
    main()
