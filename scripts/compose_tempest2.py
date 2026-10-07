"""Sharpen Tempest wing bands and export tempest-2 air art."""

import base64
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = (
    ROOT.parent.parent
    / ".cursor/projects/f-CodeProject-Armored-Legend/assets"
    / "c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944_images_image-1da74842-3866-4da5-868a-5e355f9d348d.png"
)
# Fallback to scripts/ref if asset path differs
REF = ROOT / "scripts" / "ref" / "tempest-src.png"
OUT_DIR = ROOT / "public" / "units-art" / "air"

WING_PALETTE = [
    (0, 0, 0),
    (8, 8, 8),
    (16, 16, 32),
    (32, 32, 56),
    (46, 71, 84),
    (64, 96, 112),
    (64, 96, 120),
    (72, 104, 128),
    (88, 120, 144),
    (64, 64, 64),
    (56, 56, 56),
    (64, 64, 72),
    (89, 89, 89),
]


def nearest_color(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    best = WING_PALETTE[0]
    best_d = 1e9
    for c in WING_PALETTE:
        d = sum((a - b) ** 2 for a, b in zip(rgb, c))
        if d < best_d:
            best_d = d
            best = c
    return best


def sharpen_wing_band(
    im: Image.Image,
    left: int,
    top: int,
    right: int,
    bottom: int,
    block: int = 5,
) -> Image.Image:
    band = im.crop((left, top, right, bottom)).convert("RGBA")
    bw, bh = band.size
    if bw <= 0 or bh <= 0:
        return band
    small_w = max(1, bw // block)
    small_h = max(1, bh // block)
    small = band.resize((small_w, small_h), Image.Resampling.BOX)
    sharp = small.resize((bw, bh), Image.Resampling.NEAREST)
    px = sharp.load()
    for y in range(bh):
        for x in range(bw):
            r, g, b, a = px[x, y]
            if a < 20:
                px[x, y] = (0, 0, 0, 0)
                continue
            nr, ng, nb = nearest_color((r, g, b))
            px[x, y] = (nr, ng, nb, 255)
    return sharp


def crop_opaque(im: Image.Image, pad: int = 2) -> Image.Image:
    px = im.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] > 20:
                xs.append(x)
                ys.append(y)
    if not xs:
        return im
    return im.crop(
        (
            max(0, min(xs) - pad),
            max(0, min(ys) - pad),
            min(im.width, max(xs) + pad + 1),
            min(im.height, max(ys) + pad + 1),
        )
    )


def compose() -> tuple[Image.Image, Path, Path]:
    src_path = SRC if SRC.exists() else REF
    if not src_path.exists():
        raise FileNotFoundError(f"Tempest source not found at {SRC} or {REF}")

    src = Image.open(src_path).convert("RGBA")
    im = crop_opaque(src)

    # Fuselage / wing split from source layout (525x280 original).
    fx0 = 207 - (525 - im.width) // 2
    fx1 = 284 - (525 - im.width) // 2
    wy0 = 111 - (280 - im.height) // 2
    wy1 = 174 - (280 - im.height) // 2

    # Re-detect fuselage column on cropped image for robustness.
    px = im.load()
    col_counts = []
    for x in range(im.width):
        n = sum(1 for y in range(im.height) if px[x, y][3] > 20)
        col_counts.append(n)
    peak = max(col_counts)
    body_cols = [x for x, n in enumerate(col_counts) if n >= peak * 0.85]
    if body_cols:
        fx0 = min(body_cols)
        fx1 = max(body_cols)
    row_counts = []
    for y in range(im.height):
        n = sum(1 for x in range(im.width) if px[x, y][3] > 20)
        row_counts.append(n)
    wide = max(row_counts)
    wing_rows = [y for y, n in enumerate(row_counts) if n >= wide * 0.9]
    if wing_rows:
        wy0 = min(wing_rows)
        wy1 = max(wing_rows)

    out = im.copy()
    left = sharpen_wing_band(im, 0, wy0, fx0, wy1)
    out.paste(left, (0, wy0), left)
    right = sharpen_wing_band(im, fx1, wy0, im.width, wy1)
    out.paste(right, (fx1, wy0), right)

    target_h = 95
    scale = target_h / out.height
    target_w = max(1, round(out.width * scale))
    final = out.resize((target_w, target_h), Image.Resampling.NEAREST)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    png_path = OUT_DIR / "tempest-2.png"
    svg_path = OUT_DIR / "tempest-2.svg"
    final.save(png_path)

    buf = BytesIO()
    final.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    svg_path.write_text(
        "\n".join(
            [
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {target_w} {target_h}">',
                f'  <image width="{target_w}" height="{target_h}" href="data:image/png;base64,{b64}" style="image-rendering:pixelated"/>',
                "</svg>",
            ]
        ),
        encoding="utf-8",
    )
    return final, png_path, svg_path


if __name__ == "__main__":
    final, png, svg = compose()
    print(f"tempest-2 {final.size[0]}x{final.size[1]}")
    print(f"  png: {png}")
    print(f"  svg: {svg}")
