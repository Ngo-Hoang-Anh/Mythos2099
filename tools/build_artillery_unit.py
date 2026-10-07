"""Build a complete forward-facing siege artillery sprite from the right-half source.

Steps: crop to centerline → lift shadowed lower band → mirror right→left →
transparent background. Output is a single unit PNG (no hull/turret split yet).
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(r"f:\CodeProject\Armored Legend")
SRC = ROOT / "assets" / "artillery_half.png"
OUT = ROOT / "public" / "units-art" / "artillery" / "siege" / "unit.png"
ASSETS_OUT = ROOT / "assets" / "artillery_unit.png"

BG = np.array([26.0, 33.0, 39.0])


def bg_mask(rgb: np.ndarray, thresh: float = 16.0) -> np.ndarray:
    return np.linalg.norm(rgb - BG, axis=-1) < thresh


def main() -> None:
    arr = np.array(Image.open(SRC).convert("RGBA")).astype(np.float64)
    h, _w = arr.shape[:2]

    content = ~bg_mask(arr[..., :3])
    axis_x = int(
        np.median([np.where(content[y])[0][0] for y in range(h) if content[y].any()])
    )
    half = arr[:, axis_x:].copy()
    hh, _hw = half.shape[:2]

    lum = half[..., :3].mean(-1)
    bg = bg_mask(half[..., :3])
    row_p80 = np.array(
        [
            float(np.percentile(lum[y, ~bg[y]], 80)) if (~bg[y]).any() else 0.0
            for y in range(hh)
        ]
    )
    k = 5
    row_s = np.convolve(np.pad(row_p80, k // 2, "edge"), np.ones(k) / k, "valid")
    drop = row_s[:-1] - row_s[1:]
    shadow_start = int(np.argmax(drop[90:120]) + 90)
    ref = float(np.max(row_s[shadow_start - 20 : shadow_start - 2]))

    gain = np.ones(hh)
    for y in range(hh):
        if y < shadow_start - 6:
            continue
        t = np.clip((y - (shadow_start - 6)) / 10.0, 0, 1)
        local = max(float(row_s[y]), 1.0)
        g = min(ref / local, 3.3)
        gain[y] = 1.0 + (g - 1.0) * t

    for y in range(hh):
        g = float(gain[y])
        if g <= 1.01:
            continue
        mx = half[y, :, :3].max(-1)
        keep = ~bg[y]
        pg = np.where(mx < 36, 1.0 + (g - 1) * 0.12, g)
        half[y, keep, :3] = np.clip(half[y, keep, :3] * pg[keep, None], 0, 255)

    for y in range(shadow_start, hh):
        keep = ~bg_mask(half[y, :, :3]) & (half[y, :, :3].max(-1) >= 40)
        if not keep.any():
            continue
        pix = half[y, keep, :3]
        mean = pix.mean(1, keepdims=True)
        half[y, keep, :3] = np.clip(mean + (pix - mean) * 1.2, 0, 250)

    bg = bg_mask(half[..., :3], 18)
    half[bg, 3] = 0
    dist = np.linalg.norm(half[..., :3] - BG, axis=-1)
    fringe = (dist >= 18) & (dist < 28) & (half[..., 3] > 0)
    half[fringe, 3] *= np.clip((dist[fringe] - 18) / 10, 0, 1)

    full = np.concatenate([half[:, 1:, :][:, ::-1, :], half], axis=1)
    full_im = Image.fromarray(np.clip(full, 0, 255).astype(np.uint8), "RGBA")

    a = np.array(full_im)
    ys, xs = np.where(a[:, :, 3] > 8)
    pad = 2
    full_im = full_im.crop(
        (
            max(0, int(xs.min()) - pad),
            max(0, int(ys.min()) - pad),
            min(a.shape[1], int(xs.max()) + 1 + pad),
            min(a.shape[0], int(ys.max()) + 1 + pad),
        )
    )
    full_im = ImageEnhance.Contrast(full_im).enhance(1.04)
    full_im = full_im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=40, threshold=2))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    full_im.save(OUT)
    full_im.save(ASSETS_OUT)
    print(f"wrote {OUT.relative_to(ROOT)} ({full_im.size[0]}x{full_im.size[1]})")
    print(f"wrote {ASSETS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
