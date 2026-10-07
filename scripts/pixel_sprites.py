"""Generate Kenney-style pixel SVGs for stealthray, infantry, bikes, and props."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "units-art"

NONE = (0, 0, 0, 0)


def new_grid(w: int, h: int) -> list[list[tuple[int, int, int, int]]]:
    return [[NONE for _ in range(w)] for _ in range(h)]


def put(g, x, y, c):
    if 0 <= y < len(g) and 0 <= x < len(g[0]) and c[3] > 0:
        g[y][x] = c


def rect(g, x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(g, xx, yy, c)


def disk(g, cx, cy, r, c):
    rr = r * r
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rr:
                put(g, x, y, c)


def ellipse(g, cx, cy, rx, ry, c):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            dx = (x + 0.5 - cx) / max(rx, 0.01)
            dy = (y + 0.5 - cy) / max(ry, 0.01)
            if dx * dx + dy * dy <= 1:
                put(g, x, y, c)


def line(g, x0, y0, x1, y1, c, t=1):
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    x, y = x0, y0
    while True:
        if t <= 1:
            put(g, x, y, c)
        else:
            rect(g, x - t // 2, y - t // 2, t, t, c)
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x += sx
        if e2 < dx:
            err += dx
            y += sy


def inside(poly, x, y) -> bool:
    odd = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            at = (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi
            if x < at:
                odd = not odd
        j = i
    return odd


def outline(g, color, empty=NONE):
    h, w = len(g), len(g[0])
    mark = []
    for y in range(h):
        for x in range(w):
            if g[y][x] == empty:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < w and 0 <= ny < h) or g[ny][nx] == empty:
                    mark.append((x, y))
                    break
    for x, y in mark:
        g[y][x] = color


def merge_rects(g):
    h, w = len(g), len(g[0])
    used = [[False] * w for _ in range(h)]
    rects: list[tuple[int, int, int, int, tuple[int, int, int, int]]] = []
    for y in range(h):
        for x in range(w):
            if used[y][x] or g[y][x][3] == 0:
                used[y][x] = True
                continue
            c = g[y][x]
            rw = 1
            while x + rw < w and (not used[y][x + rw]) and g[y][x + rw] == c:
                rw += 1
            rh = 1
            done = False
            while y + rh < h and not done:
                for xx in range(x, x + rw):
                    if used[y + rh][xx] or g[y + rh][xx] != c:
                        done = True
                        break
                if not done:
                    rh += 1
            for yy in range(y, y + rh):
                for xx in range(x, x + rw):
                    used[yy][xx] = True
            rects.append((x, y, rw, rh, c))
    return rects


def hex_color(c):
    r, g, b, a = c
    if a >= 250:
        return f"#{r:02x}{g:02x}{b:02x}"
    return None


def write_svg(path: Path, w: int, h: int, g, scale=1, ox=0, oy=0):
    groups = defaultdict(list)
    opac = defaultdict(list)
    box_w = w * scale
    box_h = h * scale
    for x, y, rw, rh, c in merge_rects(g):
        hx = hex_color(c)
        item = (ox + x * scale, oy + y * scale, rw * scale, rh * scale)
        if hx:
            groups[hx].append(item)
        else:
            opac[(f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}", round(c[3] / 255, 3))].append(item)
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box_w} {box_h}" shape-rendering="crispEdges">'
    ]
    for fill, items in groups.items():
        parts.append(f'<g fill="{fill}">')
        for x, y, rw, rh in items:
            parts.append(f'<rect x="{x}" y="{y}" width="{rw}" height="{rh}"/>')
        parts.append("</g>")
    for (fill, op), items in opac.items():
        parts.append(f'<g fill="{fill}" opacity="{op}">')
        for x, y, rw, rh in items:
            parts.append(f'<rect x="{x}" y="{y}" width="{rw}" height="{rh}"/>')
        parts.append("</g>")
    parts.append("</svg>\n")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(parts), encoding="utf-8")


def rgb(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


# --- Stealthray ------------------------------------------------------------------

HULL_POLY = [
    (48 / 3, 6 / 3),
    (83 / 3, 49 / 3),
    (90 / 3, 56 / 3),
    (83 / 3, 63 / 3),
    (76 / 3, 56 / 3),
    (69 / 3, 63 / 3),
    (62 / 3, 56 / 3),
    (55 / 3, 63 / 3),
    (48 / 3, 56 / 3),
    (41 / 3, 63 / 3),
    (34 / 3, 56 / 3),
    (27 / 3, 63 / 3),
    (20 / 3, 56 / 3),
    (13 / 3, 63 / 3),
    (6 / 3, 56 / 3),
    (13 / 3, 49 / 3),
]

SR_OUT = rgb("1a1e26")
SR_HULL = rgb("2c3340")
SR_MID = rgb("434a5f")
SR_HI = rgb("6a7384")
SR_IN = rgb("161920")
SR_CYAN = rgb("6ae0ea")
SR_GLOW = rgb("8af4ff")
SR_CANOPY = rgb("0c1018")


def stealthray():
    g = new_grid(32, 32)
    for y in range(32):
        for x in range(32):
            if inside(HULL_POLY, x + 0.5, y + 0.5):
                g[y][x] = SR_HULL
    for y in range(32):
        for x in range(32):
            if g[y][x] != SR_HULL:
                continue
            if inside([(p[0] * 0.72 + 16 * 0.28, p[1] * 0.72 + 11 * 0.28) for p in HULL_POLY], x + 0.5, y + 0.5):
                g[y][x] = SR_IN
    for x in range(15, 17):
        for y in range(3, 18):
            if g[y][x][3]:
                g[y][x] = SR_HI if y < 8 else SR_MID
    disk(g, 16, 7, 2.2, SR_CANOPY)
    put(g, 15, 6, SR_GLOW)
    outline(g, SR_OUT)
    for px, py in ((27, 20), (23, 20), (18, 20), (13, 20), (9, 20), (4, 20), (30, 18), (2, 18)):
        if 0 <= py < 32 and 0 <= px < 32 and g[py][px][3]:
            g[py][px] = SR_CYAN
    write_svg(ART / "air" / "stealthray-bomber.svg", 32, 32, g, scale=3)

    t = new_grid(5, 11)
    for y in range(11):
        put(t, 2, y, SR_HULL)
        put(t, 1, y, SR_OUT)
        put(t, 3, y, SR_OUT)
        if y % 2 == 0:
            put(t, 2, y, SR_CYAN if y > 0 else SR_HI)
    put(t, 2, 0, SR_MID)
    write_svg(ART / "air" / "stealthray-tail.svg", 5, 11, t, scale=3)


# --- Infantry --------------------------------------------------------------------

SKIN = rgb("e0b090")
GUN = rgb("2a2a2a")
GUN_HI = rgb("5a5a5a")
RED = rgb("d32020")
WHITE = rgb("f7f4ec")


def soldier(body, edge, *, heavy=False, mg=False, medic=False, pack=False, run=False):
    g = new_grid(32, 40)
    # torso + helmet from above
    ellipse(g, 16, 25, 8, 5, body)
    disk(g, 16, 24, 6, body)
    disk(g, 16, 24, 4, SKIN)
    disk(g, 16, 23, 5, body)
    disk(g, 16, 24, 3, SKIN)
    if pack:
        rect(g, 13, 16, 6, 6, WHITE)
        rect(g, 15, 17, 2, 4, RED)
        rect(g, 14, 18, 4, 2, RED)
    if medic and not pack:
        rect(g, 15, 23, 2, 5, RED)
        rect(g, 13, 24, 6, 2, RED)

    gx = 20
    if run:
        # gun across the body
        line(g, 10, 18, 22, 10, GUN, 2)
        disk(g, 12, 17, 2, SKIN)
        disk(g, 16, 14, 2, SKIN)
        if pack:
            rect(g, 14, 12, 5, 5, WHITE)
            rect(g, 16, 13, 1, 3, RED)
            rect(g, 15, 14, 3, 1, RED)
    else:
        gh = 22 if (heavy or mg) else 18
        gy0 = 2 if (heavy or mg) else 5
        gw = 3 if (heavy or mg) else 2
        rect(g, gx, gy0, gw, gh, GUN)
        rect(g, gx - 1, gy0 + gh - 6, gw + 2, 4, GUN)
        put(g, gx + gw // 2, gy0, GUN_HI)
        if mg:
            rect(g, gx - 4, 12, 10, 2, GUN)
        disk(g, gx + 1, 20, 2, SKIN)
        disk(g, gx + 1, 13, 2, SKIN)

    outline(g, edge)
    return g


def write_soldier(name, body, edge, **kw):
    write_svg(ART / "squads" / "infantry" / name, 32, 40, soldier(body, edge, **kw))


# --- Bikes -----------------------------------------------------------------------

TIRE = rgb("1a1e22")
RIM = rgb("6a7478")
SKIN_C = SKIN


def bike(body, hull, glass, rider, visor, trim, w=24, h=34, ox=12):
    g = new_grid(w, h)
    # wheels
    ellipse(g, ox, 6, 4, 5, TIRE)
    ellipse(g, ox, 6, 2, 2, RIM)
    ellipse(g, ox, 28, 4, 5, TIRE)
    ellipse(g, ox, 28, 2, 2, RIM)
    rect(g, ox - 1, 8, 2, 18, trim)
    # hull
    ellipse(g, ox, 18, 5, 8, hull)
    rect(g, ox - 4, 12, 8, 12, hull)
    rect(g, ox - 4, 8, 8, 4, glass)
    rect(g, ox - 5, 9, 10, 2, trim)
    # rider
    ellipse(g, ox, 20, 4, 6, rider)
    disk(g, ox, 16, 4, body)
    ellipse(g, ox, 16, 3, 2, visor)
    disk(g, ox - 5, 10, 2, SKIN_C)
    line(g, ox + 4, 4, ox + 4, 16, GUN, 2)
    disk(g, ox + 4, 16, 2, SKIN_C)
    outline(g, trim)
    return g


def sidecar():
    g = new_grid(36, 34)
    # bike left
    bg = bike(rgb("c4a05a"), rgb("c4a05a"), rgb("c4a05a"), rgb("dcc08a"), rgb("3a2a18"), rgb("8a6a32"), w=24, h=34, ox=10)
    for y in range(34):
        for x in range(24):
            if bg[y][x][3]:
                put(g, x, y, bg[y][x])
    # sidecar tub
    hull = rgb("b8924a")
    rider = rgb("dcc08a")
    visor = rgb("3a2a18")
    tire = TIRE
    ellipse(g, 29, 22, 4, 5, tire)
    ellipse(g, 29, 22, 2, 2, RIM)
    rect(g, 16, 12, 16, 12, hull)
    ellipse(g, 28, 18, 6, 8, hull)
    ellipse(g, 26, 20, 4, 6, rider)
    disk(g, 26, 16, 4, rgb("c4a05a"))
    ellipse(g, 26, 16, 3, 2, visor)
    line(g, 31, 4, 31, 16, GUN, 2)
    disk(g, 31, 16, 2, SKIN_C)
    outline(g, rgb("8a6a32"))
    return g


# --- Props -----------------------------------------------------------------------

BAG = rgb("d2b17a")
BAG_E = rgb("8d7348")
TRENCH = rgb("4a2e1a")
TRENCH_E = rgb("2e1b10")


def sandbag(w, h):
    g = new_grid(w, h)
    ellipse(g, w / 2, h / 2, w / 2 - 0.6, h / 2 - 0.6, BAG)
    outline(g, BAG_E)
    return g


def trench():
    g = new_grid(72, 16)
    rect(g, 1, 1, 70, 14, TRENCH)
    rect(g, 3, 7, 66, 2, TRENCH_E)
    outline(g, TRENCH_E)
    return g


def main():
    stealthray()

    bikes = ART / "squads" / "motorcycles"
    write_svg(
        bikes / "bike-blue.svg",
        24,
        34,
        bike(rgb("7a9098"), rgb("7a8e98"), rgb("8fb8c6"), rgb("9ec4ce"), rgb("1a2830"), rgb("4a5c66")),
    )
    write_svg(
        bikes / "bike-red.svg",
        24,
        34,
        bike(rgb("c42828"), rgb("1a1a1a"), rgb("b42028"), rgb("161616"), rgb("1a0808"), rgb("3a1010")),
    )
    write_svg(bikes / "bike-sidecar-sand.svg", 36, 34, sidecar())

    props = ART / "squads" / "props"
    write_svg(props / "sandbag-large.svg", 18, 10, sandbag(18, 10))
    write_svg(props / "sandbag-small.svg", 10, 6, sandbag(10, 6))
    write_svg(props / "trench.svg", 72, 16, trench())
    print("wrote pixel sprites")


if __name__ == "__main__":
    main()
