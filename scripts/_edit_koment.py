import base64
from io import BytesIO
from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\ADMIN\.cursor\projects\f-CodeProject-Armored-Legend\assets"
    r"\c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_482874dbff3dadb8ece9e4424ecd3944_images_image-daed1451-3253-48ae-9259-3b445d58b7bf.png"
)
OUT_SVG = Path(r"f:\CodeProject\Armored Legend\public\units-art\air\koment-2.svg")
PREVIEW = Path(r"f:\CodeProject\Armored Legend\public\units-art\air\_koment-2-preview.png")

BODY_L, BODY_R = 86, 107
WING_Y0, WING_Y1 = 40, 92
ROOT_L, ROOT_R = 85, 108
TIP_L, TIP_R = 34, 159
SWEEP_LEAD = 22
SWEEP_TRAIL = -18  # trailing edge pulls forward so both ends meet at a point
TIP_CHORD = 2

DARK = (16, 20, 32, 255)
MID = (68, 102, 123, 255)
LIGHT = (120, 168, 186, 255)
CYAN = (140, 210, 220, 255)


def is_wing_x(x: int) -> bool:
    return x < BODY_L or x > BODY_R


def sweep_t(x: int) -> float:
    if x <= ROOT_L:
        return max(0.0, min(1.0, (ROOT_L - x) / (ROOT_L - TIP_L)))
    if x >= ROOT_R:
        return max(0.0, min(1.0, (x - ROOT_R) / (TIP_R - ROOT_R)))
    return 0.0


def to_svg(im: Image.Image) -> str:
    buf = BytesIO()
    im.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {im.width} {im.height}">\n'
        f'  <image width="{im.width}" height="{im.height}" href="data:image/png;base64,{b64}" '
        f'style="image-rendering:pixelated"/>\n'
        f"</svg>\n"
    )


def put(opx, x, y, w, h, c) -> None:
    if 0 <= x < w and 0 <= y < h:
        opx[x, y] = c


def draw_gun(opx, cx: int, attach_y: int, w: int, h: int) -> None:
    """Pointed cannon sticking forward from the leading edge."""
    # 6px spike, 1px tip
    for i in range(6):
        y = attach_y - 6 + i
        if i == 0:
            xs, col = [cx], CYAN
        elif i == 1:
            xs, col = [cx], LIGHT
        elif i in (2, 3):
            xs, col = [cx - 1, cx, cx + 1], MID if i == 3 else DARK
        else:
            xs, col = [cx], DARK
        for x in xs:
            put(opx, x, y, w, h, col)
        if i == 2:
            put(opx, cx, y, w, h, LIGHT)


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    w, h = src.size
    px = src.load()
    assert px

    extra = 8
    canvas_h = h + extra
    out = Image.new("RGBA", (w, canvas_h), (0, 0, 0, 0))
    opx = out.load()
    assert opx

    # body + tail (tail will be shortened later)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if WING_Y0 <= y <= WING_Y1 and is_wing_x(x):
                continue
            opx[x, y] = (r, g, b, a)

    # solid swept wings, both edges taper to a rear point
    for x in range(w):
        if not is_wing_x(x):
            continue
        ys = [y for y in range(WING_Y0, WING_Y1 + 1) if px[x, y][3] > 16]
        if len(ys) < 2:
            continue
        y0, y1 = min(ys), max(ys)
        chord = y1 - y0 + 1
        t = sweep_t(x) ** 1.05
        lead = y0 + int(round(SWEEP_LEAD * t))
        trail = y1 + int(round(SWEEP_TRAIL * t))
        new_chord = max(TIP_CHORD, trail - lead + 1)
        # force tip almost to a point
        tip_lim = int(round(chord * (1.0 - 0.88 * t)))
        new_chord = max(TIP_CHORD, min(new_chord, tip_lim))
        for i in range(new_chord):
            src_y = y0 + int(round(i * (chord - 1) / max(new_chord - 1, 1)))
            dst_y = lead + i
            if 0 <= dst_y < canvas_h:
                opx[x, dst_y] = px[x, src_y]

    # two guns per wing, on the new leading edge
    def lead_at(x: int) -> int | None:
        for y in range(canvas_h):
            if opx[x, y][3] > 16 and is_wing_x(x):
                return y
        return None

    for x in (70, 50):
        y = lead_at(x)
        if y:
            draw_gun(opx, x, y, w, canvas_h)
    for x in (123, 143):
        y = lead_at(x)
        if y:
            draw_gun(opx, x, y, w, canvas_h)

    # shorten tail: keep a stub of the engine only
    box = out.split()[-1].getbbox()
    assert box
    # original tail starts ~y=93
    tail0 = 93
    keep_tail = 8
    cropped = Image.new("RGBA", (w, tail0 + keep_tail), (0, 0, 0, 0))
    cropped.paste(out.crop((0, 0, w, tail0)), (0, 0))
    src_px = out.load()
    dst_px = cropped.load()
    assert src_px and dst_px
    old_tail = canvas_h - tail0
    for i in range(keep_tail):
        sy = tail0 + int(round(i * max(old_tail - 1, 1) / max(keep_tail - 1, 1)))
        sy = min(sy, canvas_h - 1)
        for x in range(w):
            dst_px[x, tail0 + i] = src_px[x, sy]

    box = cropped.split()[-1].getbbox()
    assert box
    cropped = cropped.crop(box)

    OUT_SVG.write_text(to_svg(cropped), encoding="utf-8")
    preview = Image.new("RGBA", cropped.size, (0, 0, 0, 255))
    preview.alpha_composite(cropped)
    preview.save(PREVIEW)
    print("out", cropped.size)


if __name__ == "__main__":
    main()
