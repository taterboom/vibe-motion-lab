"""补充：技能的 ink sweep 只数「暗像素」，适合浅底深墨。本标志是深底浅笔画，这里改数黄/绿笔画像素，
沿用同一套 flatline / jump 判定（逐 10ms，?t= 定帧）。"""
import io, json, sys, numpy as np
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
html, start, end, step = sys.argv[1], *map(int, sys.argv[2].split(":"))
url = Path(html).resolve().as_uri(); times = list(range(start, end+1, step)); vals = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 800, "height": 800})
    for t in times:
        pg.goto(f"{url}?t={t}"); pg.wait_for_function("window.__p2mReady === true")
        a = np.asarray(Image.open(io.BytesIO(pg.locator("#logo-root").screenshot())).convert("RGB")).astype(int)
        m = (np.linalg.norm(a-np.array((242,207,115)),axis=2) < 60) | (np.linalg.norm(a-np.array((138,163,130)),axis=2) < 40)
        vals.append(int(m.sum()))
    b.close()
d = [vals[i]-vals[i-1] for i in range(1, len(vals))]
mv = sorted(x for x in d if x > 0); med = mv[len(mv)//2] if mv else 0
flags = [{"t": times[i+1], "delta": x, "kind": "flatline" if x <= max(2, med*0.05) else "jump"} for i, x in enumerate(d) if x <= max(2, med*0.05) or x > med*3]
stalls = [times[i+1] for i in range(1, len(d)) if d[i-1] <= max(2, med*0.05) and d[i] > med*3]
for t, v, x in zip(times, vals, [0]+d): print(t, v, x)
print("median", med, "stall+pop at", stalls)
json.dump({"times": times, "stroke_px": vals, "deltas": d, "median": med, "flags": flags, "stall_pop": stalls}, open(sys.argv[3], "w"), indent=1)
