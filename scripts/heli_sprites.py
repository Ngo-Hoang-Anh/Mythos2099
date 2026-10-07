"""Fit helicopter PNGs into 96px pixel SVGs and paint Falcon's in-wing nacelles."""

from __future__ import annotations

import shutil
import sys
from colorsys import hsv_to_rgb, rgb_to_hsv
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixel_sprites import ART, NONE, disk, new_grid, put, write_svg

ASSETS = Path(r"C:\Users\ADMIN\.cursor\projects\f-CodeProject-Armored-Legend\assets")
AIR = ART / "air"
BOX = 96
FALLBACK = {
    "falcon": ASSETS
    / "c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944_images_Human-Corvette-a73aadd6-691e-41ce-8d73-5db0219f5a14.png",
    "hornet": ASSETS
    / "c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944_images_5B-b2664996-4cd4-4473-98f6-8d5df056c3fa.png",
    "viper": ASSETS
    / "c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944_images_9B-8a0783c5-93f3-4006-88ff-de3bc11a1ab6.png",
}
VIPER_TAIL_SRC = (
    ASSETS
    / "c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944_images_3-ce9b91ab-e451-4b1e-aed1-ad274f46eab0.png"
)

HULL = (37, 43, 67, 255)
HULL_HI = (68, 100, 121, 255)
CYAN = (92, 139, 158, 255)
CYAN_HI = (123, 163, 179, 255)
DARK = (24, 24, 24, 255)
OUT = (0, 0, 0, 255)
WELL = (12, 14, 22, 255)


def fit_nn(im: Image.Image, box: int = BOX) -> Image.Image:
    w, h = im.size
    scale = min(box / w, box / h)
    tw = max(1, round(w * scale))
    th = max(1, round(h * scale))
    scaled = im.resize((tw, th), Image.NEAREST)
    canvas = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    canvas.paste(scaled, ((box - tw) // 2, (box - th) // 2))
    return canvas


def harden_alpha(im: Image.Image, cut: int = 128) -> Image.Image:
    pix = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if a >= cut:
                dst[x, y] = (r, g, b, 255)
    return out


def quantize_rgba(im: Image.Image, colors: int = 28) -> Image.Image:
    rgb = im.convert("RGB")
    pal = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert("RGB")
    src = im.load()
    q = pal.load()
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    dst = out.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3] >= 128:
                r, g, b = q[x, y]
                dst[x, y] = (r, g, b, 255)
    return out


def to_grid(im: Image.Image) -> list[list[tuple[int, int, int, int]]]:
    g = new_grid(*im.size)
    pix = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            p = pix[x, y]
            if p[3] >= 128:
                put(g, x, y, (p[0], p[1], p[2], 255))
    return g


def punch(g, cx, cy, r):
    rr = r * r
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            if 0 <= y < len(g) and 0 <= x < len(g[0]):
                if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rr:
                    g[y][x] = NONE


def put_empty(g, x, y, c):
    if 0 <= y < len(g) and 0 <= x < len(g[0]) and g[y][x][3] == 0:
        g[y][x] = c


def paint_falcon_wings(g):
    """Slab wings with a round rotor well cut into each panel."""

    def wing(x0: int, x1: int, cx: int):
        for y in range(35, 60):
            edge = 2 if y in (35, 59) else 1 if y in (36, 58) else 0
            for x in range(x0 + edge, x1 + 1 - edge):
                if y <= 37:
                    put_empty(g, x, y, CYAN_HI if y == 35 else CYAN)
                elif y >= 57:
                    put_empty(g, x, y, DARK)
                else:
                    put_empty(g, x, y, HULL_HI if 44 <= y <= 50 else HULL)
        # well rim, then punch the spinning disc hole
        disk(g, cx, 47, 10.6, OUT)
        disk(g, cx, 47, 9.6, WELL)
        punch(g, cx, 47, 8.4)

    wing(0, 24, 11)
    wing(71, 95, 84)


def to_viper_green(r: int, g: int, b: int) -> tuple[int, int, int]:
    """Shift Falcon cyan/blue into Viper olive-green; leave greys alone."""
    h, s, v = rgb_to_hsv(r / 255, g / 255, b / 255)
    if 0.40 <= h <= 0.72 and s > 0.10:
        h = 0.23 + (h - 0.55) * 0.12
        s = min(1.0, s * 1.25)
        rr, gg, bb = hsv_to_rgb(h, s, v)
        return int(rr * 255 + 0.5), int(gg * 255 + 0.5), int(bb * 255 + 0.5)
    return r, g, b


def crop_opaque(im: Image.Image) -> Image.Image:
    pix = im.load()
    w, h = im.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if pix[x, y][3] >= 128:
                xs.append(x)
                ys.append(y)
    if not xs:
        return im
    return im.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1))


def recolor_image(im: Image.Image) -> Image.Image:
    pix = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if a < 128:
                continue
            nr, ng, nb = to_viper_green(r, g, b)
            dst[x, y] = (nr, ng, nb, 255)
    return out


def write_viper_tail() -> Path:
    raw_path = AIR / "viper-tail-src.png"
    if not raw_path.exists():
        shutil.copyfile(VIPER_TAIL_SRC, raw_path)
    raw = harden_alpha(Image.open(raw_path).convert("RGBA"))
    # Drop the Falcon body; keep the boom + engine from the narrow waist down.
    boom = crop_opaque(raw.crop((0, 94, raw.size[0], raw.size[1])))
    painted = quantize_rgba(recolor_image(boom), colors=22)
    g = to_grid(painted)
    dest = AIR / "viper-tail.svg"
    write_svg(dest, painted.size[0], painted.size[1], g)
    return dest


def convert(name: str, src: Path, wings: bool = False) -> Path:
    raw = harden_alpha(Image.open(src).convert("RGBA"))
    fitted = quantize_rgba(fit_nn(raw))
    g = to_grid(fitted)
    if wings:
        paint_falcon_wings(g)
    dest = AIR / f"{name}.svg"
    write_svg(dest, BOX, BOX, g)
    return dest


def main():
    AIR.mkdir(parents=True, exist_ok=True)
    for name, fallback in FALLBACK.items():
        src = AIR / f"{name}-src.png"
        if not src.exists():
            shutil.copyfile(fallback, src)
        convert(name, src, wings=(name == "falcon"))
        print("wrote", name)
    write_viper_tail()
    print("wrote viper-tail")
    print("done")


if __name__ == "__main__":
    main()
