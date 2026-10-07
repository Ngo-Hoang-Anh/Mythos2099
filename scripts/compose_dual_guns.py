from pathlib import Path

from PIL import Image

TURRET = Path(__file__).resolve().parents[1] / "public" / "units-art" / "tanks" / "turret"


def muzzle_mid(im: Image.Image) -> float:
    px = im.load()
    w, h = im.size
    for y in range(min(6, h)):
        xs = [x for x in range(w) if px[x, y][3] > 0]
        if xs:
            return (xs[0] + xs[-1]) / 2
    return (w - 1) / 2


def bridge_breech(canvas: Image.Image, from_y: int) -> None:
    px = canvas.load()
    w, h = canvas.size
    for y in range(from_y, h):
        opaque = [x for x in range(w) if px[x, y][3] > 0]
        if len(opaque) < 2:
            continue
        left, right = opaque[0], opaque[-1]
        for x in range(left, right + 1):
            if px[x, y][3] > 0:
                continue
            l = next((i for i in range(x, -1, -1) if px[i, y][3] > 0), None)
            r = next((i for i in range(x, w) if px[i, y][3] > 0), None)
            if l is None or r is None:
                continue
            a = px[l, y]
            b = px[r, y]
            t = (x - l) / max(1, r - l)
            px[x, y] = (
                round(a[0] + (b[0] - a[0]) * t),
                round(a[1] + (b[1] - a[1]) * t),
                round(a[2] + (b[2] - a[2]) * t),
                255,
            )


def compose_dual(file: str, spread: int, out_name: str, breech_ratio: float = 0.28) -> tuple[int, int, int]:
    gun = Image.open(TURRET / file).convert("RGBA")
    w, h = gun.size
    mid = muzzle_mid(gun)
    left = gun.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    left_mid = (w - 1) - mid
    pad = 2
    cx = int(round(max(mid, left_mid) + spread + pad))
    canvas_w = cx * 2
    canvas = Image.new("RGBA", (canvas_w, h), (0, 0, 0, 0))
    right_x = int(round(cx + spread - mid))
    left_x = int(round(cx - spread - left_mid))
    canvas.alpha_composite(left, (left_x, 0))
    canvas.alpha_composite(gun, (right_x, 0))
    bridge_breech(canvas, int(h * (1 - breech_ratio)))
    px = canvas.load()
    xs = [x for y in range(h) for x in range(canvas_w) if px[x, y][3] > 0]
    min_x, max_x = min(xs), max(xs)
    radius = max(cx - min_x, max_x - cx)
    left_c = cx - radius
    right_c = cx + radius
    cropped = canvas.crop((left_c, 0, right_c + 1, h))
    origin_x = cx - left_c
    cropped.save(TURRET / out_name)
    print(f"{out_name}: {cropped.size[0]}x{cropped.size[1]} origin_x={origin_x} spread={spread} muzzle_mid={mid:.1f}")
    return cropped.size[0], cropped.size[1], origin_x


if __name__ == "__main__":
    compose_dual("tankBlue_barrel2_outline.png", 8, "tankBlue_barrel2_dual_outline.png")
    compose_dual("specialBarrel4_outline.png", 10, "specialBarrel4_dual_outline.png")
