"""Cut Kenney tank hulls into robot/artillery prototype pieces."""

import colorsys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
HULL = ROOT / "public" / "units-art" / "tanks" / "hull"
TURRET = ROOT / "public" / "units-art" / "tanks" / "turret"
ROBOT = ROOT / "public" / "units-art" / "robot" / "stalker"
ARTILLERY = ROOT / "public" / "units-art" / "artillery" / "siege"
REF = ROOT / "scripts" / "ref"
AEGIS_DIR = ROOT / "public" / "units-art" / "robot" / "aegis"
IRONCLAD_DIR = ROOT / "public" / "units-art" / "robot" / "ironclad"

# Kenney hull fills — ocean blue / ironclad red.
BLUE_HUE = 0.566
RED_HUE = 0.016
CANOPY_BLUE = 0.52
CANOPY_RED = 0.08

OUTLINE = (46, 43, 34, 255)
FILL = (86, 84, 77, 255)
HIGH = (95, 93, 85, 255)
SHADE = (64, 60, 47, 255)


def crop(im: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return im.convert("RGBA").crop(box)


def draw_hex(width: int, height: int) -> Image.Image:
    im = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    cx, cy = width // 2, height // 2
    rx, ry = width // 2 - 1, height // 2 - 1
    pts = [
        (cx - rx // 2, cy - ry),
        (cx + rx // 2, cy - ry),
        (cx + rx, cy),
        (cx + rx // 2, cy + ry),
        (cx - rx // 2, cy + ry),
        (cx - rx, cy),
    ]
    draw.polygon(pts, fill=FILL, outline=OUTLINE)
    inner = [
        (cx - rx // 2 + 3, cy - ry + 4),
        (cx + rx // 2 - 3, cy - ry + 4),
        (cx + rx - 5, cy),
        (cx + rx // 2 - 3, cy + ry - 4),
        (cx - rx // 2 + 3, cy + ry - 4),
        (cx - rx + 5, cy),
    ]
    draw.polygon(inner, fill=HIGH, outline=SHADE)
    hole = 10
    draw.ellipse((cx - hole, cy - hole, cx + hole, cy + hole), fill=SHADE, outline=OUTLINE)
    draw.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=FILL, outline=OUTLINE)
    return im


def compose_stalker() -> None:
    w, h = split_walker(REF / "stalker-src.png", ROBOT, ((0, 12, 14, 48), (70, 12, 84, 48)))
    hex_path = ROBOT / "hex.png"
    if hex_path.exists():
        hex_path.unlink()
    print(f"stalker {w}x{h}  side-pod legs (0,12) (70,12) 14x36  guns on torso")


def compose_siege() -> None:
    ARTILLERY.mkdir(parents=True, exist_ok=True)
    gun = Image.open(TURRET / "specialBarrel1_outline.png").convert("RGBA")
    big = gun.resize((gun.size[0] * 2, gun.size[1] * 2), Image.Resampling.NEAREST)
    big.save(ARTILLERY / "howitzer.png")
    print(f"siege howitzer {big.size[0]}x{big.size[1]} origin=({big.size[0] // 2},{big.size[1] - 8})")


def cut_piece(im: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    piece = im.crop(box).copy()
    blank = Image.new("RGBA", piece.size, (0, 0, 0, 0))
    im.paste(blank, box, piece)
    return piece


def paint_chroma(
    im: Image.Image,
    armor_hue: float,
    canopy_hue: float,
    sat_boost: float,
    metal: str | None = None,
) -> Image.Image:
    out = im.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            hv, sat, val = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            lum = (r + g + b) / 3
            if sat >= 0.14 and val >= 0.12:
                hue = canopy_hue if sat > 0.28 and val > 0.42 else armor_hue
                sat = min(1.0, sat * sat_boost)
                val = min(1.0, val * 1.08)
                nr, ng, nb = colorsys.hsv_to_rgb(hue, sat, val)
                px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
                continue
            if metal and 32 < lum < 210:
                k = 0.78
                if metal == "red":
                    tint = (min(255, lum * 1.55), lum * 0.38, lum * 0.32)
                else:
                    tint = (lum * 0.38, lum * 0.82, min(255, lum * 1.35))
                px[x, y] = (
                    round(r * (1 - k) + tint[0] * k),
                    round(g * (1 - k) + tint[1] * k),
                    round(b * (1 - k) + tint[2] * k),
                    a,
                )
    return out


def split_walker(src: Path, dest: Path, legs: tuple[tuple[int, int, int, int], tuple[int, int, int, int]]) -> tuple[int, int]:
    dest.mkdir(parents=True, exist_ok=True)
    body = Image.open(src).convert("RGBA")
    left_box, right_box = legs
    cut_piece(body, left_box).save(dest / "leg-left.png")
    cut_piece(body, right_box).save(dest / "leg-right.png")
    body.save(dest / "torso.png")
    return body.size


def compose_aegis() -> None:
    painted = paint_chroma(Image.open(REF / "aegis-src.png").convert("RGBA"), BLUE_HUE, CANOPY_BLUE, 1.45)
    tmp = REF / "_aegis-painted.png"
    painted.save(tmp)
    w, h = split_walker(tmp, AEGIS_DIR, ((26, 78, 56, 103), (62, 78, 92, 103)))
    tmp.unlink(missing_ok=True)
    print(f"aegis {w}x{h} ocean-blue  legs (26,78) (62,78)")


def compose_ironclad() -> None:
    painted = paint_chroma(Image.open(REF / "ironclad-src.png").convert("RGBA"), RED_HUE, CANOPY_RED, 1.55, "red")
    tmp = REF / "_ironclad-painted.png"
    painted.save(tmp)
    w, h = split_walker(tmp, IRONCLAD_DIR, ((18, 88, 48, 118), (68, 88, 98, 118)))
    tmp.unlink(missing_ok=True)
    print(f"ironclad {w}x{h} red  legs (18,88) (68,88)")


if __name__ == "__main__":
    compose_stalker()
    compose_siege()
    compose_aegis()
    compose_ironclad()
