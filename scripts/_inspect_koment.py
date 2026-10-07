from pathlib import Path
import re
import base64
import io
from PIL import Image

svg = Path(r"f:\CodeProject\Armored Legend\public\units-art\air\koment-2.svg").read_text(encoding="utf-8")
b64 = re.search(r"base64,([^\"\s]+)", svg).group(1)
im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
print(im.size, im.split()[-1].getbbox())
px = im.load()
w, h = im.size
for y in range(h):
    xs = [x for x in range(w) if px[x, y][3] > 20]
    if xs:
        print(f"{y:3d}", min(xs), max(xs), "span", max(xs) - min(xs) + 1, "n", len(xs))
