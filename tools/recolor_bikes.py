"""Recolor bike_model.png into blue / red / sand variants for squad units."""
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(r"f:\CodeProject\Armored Legend\assets\bike_model.png")
OUT = Path(r"f:\CodeProject\Armored Legend\public\units-art\squads\motorcycles")
OUT.mkdir(parents=True, exist_ok=True)

# Armor hue targets (HSV). Source armor is deep blue ~220°.
VARIANTS = {
    "bike-blue.png": {"h": 215, "s_mul": 1.05, "v_mul": 1.02, "name": "blue"},
    "bike-red.png": {"h": 5, "s_mul": 1.1, "v_mul": 0.98, "name": "red"},
    "bike-sand.png": {"h": 38, "s_mul": 0.85, "v_mul": 1.12, "name": "sand"},
}


def rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    df = mx - mn
    h = np.zeros_like(mx)
    mask = df > 1e-6
    # red is max
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
    rgb = np.zeros((*h.shape, 3), dtype=np.float64)
    for lo, hi, order in [
        (0, 60, (c, x, 0)),
        (60, 120, (x, c, 0)),
        (120, 180, (0, c, x)),
        (180, 240, (0, x, c)),
        (240, 300, (x, 0, c)),
        (300, 360, (c, 0, x)),
    ]:
        idx = (h >= lo) & (h < hi) if hi < 360 else (h >= lo) | (h < 0.001)
        if hi == 360:
            idx = (h >= lo) & (h <= 360)
        rgb[idx, 0] = order[0][idx] if isinstance(order[0], np.ndarray) else order[0]
        # fix: order elements are arrays
    # cleaner loop
    rgb = np.zeros((*h.shape, 3), dtype=np.float64)
    sextant = (h / 60).astype(int) % 6
    for sxt, (ri, gi, bi) in enumerate(
        [
            (c, x, np.zeros_like(c)),
            (x, c, np.zeros_like(c)),
            (np.zeros_like(c), c, x),
            (np.zeros_like(c), x, c),
            (x, np.zeros_like(c), c),
            (c, np.zeros_like(c), x),
        ]
    ):
        idx = sextant == sxt
        rgb[idx, 0] = ri[idx]
        rgb[idx, 1] = gi[idx]
        rgb[idx, 2] = bi[idx]
    rgb += m[..., None]
    return np.clip(rgb, 0, 1)


im = Image.open(SRC).convert("RGBA")
arr = np.array(im).astype(np.float64)
rgb = arr[..., :3] / 255.0
a = arr[..., 3]
hsv = rgb_to_hsv(rgb)

# Armor = blue-ish, enough sat, not near-black (tires/outline), not yellow
h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
armor = (
    (a > 128)
    & (s > 0.18)
    & (v > 0.18)
    & (v < 0.95)
    & (((h >= 185) & (h <= 265)) | ((rgb[..., 2] > rgb[..., 0] + 0.05) & (rgb[..., 2] > rgb[..., 1] * 0.9) & (s > 0.22)))
)
# Exclude yellow headlight
yellow = (rgb[..., 0] > 0.7) & (rgb[..., 1] > 0.65) & (rgb[..., 2] < 0.45)
armor &= ~yellow
# Exclude near-grey metals (low sat)
armor &= s > 0.22

print("armor pixels", int(armor.sum()), "/", int((a > 128).sum()))
print("armor H mean", float(h[armor].mean()) if armor.any() else None)

for filename, cfg in VARIANTS.items():
    out_hsv = hsv.copy()
    # Remap armor hue; preserve relative sat/value with mild mul
    out_hsv[armor, 0] = cfg["h"]
    out_hsv[armor, 1] = np.clip(s[armor] * cfg["s_mul"], 0, 1)
    out_hsv[armor, 2] = np.clip(v[armor] * cfg["v_mul"], 0, 1)
    out_rgb = hsv_to_rgb(out_hsv)
    out = np.zeros_like(arr)
    out[..., :3] = out_rgb * 255
    out[..., 3] = a
    out_im = Image.fromarray(out.astype(np.uint8), "RGBA")
    path = OUT / filename
    out_im.save(path)
    print("wrote", path, out_im.size)

# Also copy sand as sidecar alias so old paths can be redirected cleanly
(Image.open(OUT / "bike-sand.png")).save(OUT / "bike-sidecar-sand.png")
print("wrote bike-sidecar-sand.png (sand alias)")
