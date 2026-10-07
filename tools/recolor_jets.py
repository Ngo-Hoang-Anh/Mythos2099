"""Recolor komet-2 (orange/red) and tempest-2 (yellow) from original extracted PNGs."""
from __future__ import annotations

import base64
import io
import re
from pathlib import Path

import numpy as np
from PIL import Image

AIR = Path(r"f:\CodeProject\Armored Legend\public\units-art\air")
ASSETS = Path(r"f:\CodeProject\Armored Legend\assets")


def rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    df = mx - mn
    h = np.zeros_like(mx)
    mask = df > 1e-6
    idx = mask & (mx == r)
    h[idx] = (60 * ((g[idx] - b[idx]) / df[idx]) + 360) % 360
    idx = mask & (mx == g)
    h[idx] = (60 * ((b[idx] - r[idx]) / df[idx]) + 120) % 360
    idx = mask & (mx == b)
    h[idx] = (60 * ((r[idx] - g[idx]) / df[idx]) + 240) % 360
    s = np.zeros_like(mx)
    s[mx > 1e-6] = df[mx > 1e-6] / mx[mx > 1e-6]
    return np.stack([h, s, mx], axis=-1)


def hsv_to_rgb(hsv: np.ndarray) -> np.ndarray:
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    c = v * s
    x = c * (1 - np.abs((h / 60) % 2 - 1))
    m = v - c
    sextant = (h / 60).astype(int) % 6
    rgb = np.zeros((*h.shape, 3), dtype=np.float64)
    parts = [
        (c, x, np.zeros_like(c)),
        (x, c, np.zeros_like(c)),
        (np.zeros_like(c), c, x),
        (np.zeros_like(c), x, c),
        (x, np.zeros_like(c), c),
        (c, np.zeros_like(c), x),
    ]
    for sxt, (ri, gi, bi) in enumerate(parts):
        idx = sextant == sxt
        rgb[idx, 0] = ri[idx]
        rgb[idx, 1] = gi[idx]
        rgb[idx, 2] = bi[idx]
    rgb += m[..., None]
    return np.clip(rgb, 0, 1)


def recolor(im: Image.Image, target_h: float, s_floor: float, s_mul: float, v_mul: float) -> Image.Image:
    arr = np.array(im).astype(np.float64)
    rgb = arr[..., :3] / 255.0
    a = arr[..., 3]
    hsv = rgb_to_hsv(rgb)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    paint = (
        (a > 128)
        & (s > 0.12)
        & (v > 0.15)
        & (v < 0.85)
        & (
            ((h >= 175) & (h <= 240))
            | ((rgb[..., 2] > rgb[..., 0] + 0.02) & (rgb[..., 2] >= rgb[..., 1] - 0.02) & (s > 0.15))
        )
    )
    print("  paint", int(paint.sum()), "h", float(h[paint].mean()) if paint.any() else None)
    out = hsv.copy()
    out[paint, 0] = target_h
    out[paint, 1] = np.clip(np.maximum(s[paint] * s_mul, s_floor), 0, 1)
    out[paint, 2] = np.clip(v[paint] * v_mul, 0, 1)
    result = np.zeros_like(arr)
    result[..., :3] = hsv_to_rgb(out) * 255
    result[..., 3] = a
    return Image.fromarray(result.astype(np.uint8), "RGBA")


def write_svg(svg_path: Path, im: Image.Image) -> None:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    svg = svg_path.read_text(encoding="utf-8")
    svg = re.sub(
        r'href="data:image/png;base64,[A-Za-z0-9+/=]+"',
        f'href="data:image/png;base64,{b64}"',
        svg,
        count=1,
    )
    svg_path.write_text(svg, encoding="utf-8")


JOBS = [
    # vivid orange-red
    ("komet-2.png", "komet-2.svg", 8, 0.55, 1.6, 1.15),
    # bright yellow
    ("tempest-2.png", "tempest-2.svg", 50, 0.62, 1.7, 1.25),
]

for src_name, svg_name, hue, s_floor, s_mul, v_mul in JOBS:
    src = ASSETS / src_name
    im = Image.open(src).convert("RGBA")
    print(svg_name, im.size)
    out = recolor(im, hue, s_floor, s_mul, v_mul)
    out.save(ASSETS / src_name.replace(".png", "-recolor.png"))
    write_svg(AIR / svg_name, out)
    print("  wrote", AIR / svg_name)
