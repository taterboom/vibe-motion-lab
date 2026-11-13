"""最终帧契约的同管线检查：同一工具、视口、DPR 下截 ?static=1 和 ?t=1500，要求 0 差异。"""
import io, json, sys, numpy as np
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
url = Path(sys.argv[1]).resolve().as_uri(); shots = {}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 900, "height": 600}, device_scale_factor=1)
    for q in ("static=1", "t=1500", "t=1499"):
        pg.goto(f"{url}?{q}"); pg.wait_for_function("window.__p2mReady === true")
        shots[q] = np.asarray(Image.open(io.BytesIO(pg.locator("#logo-root").screenshot())).convert("RGB")).astype(int)
    b.close()
r = {}
for q in ("t=1500", "t=1499"):
    d = np.abs(shots["static=1"] - shots[q]); r[f"static_vs_{q}"] = {"max": int(d.max()), "pixels_diff": int((d.max(axis=2) > 0).sum())}
print(json.dumps(r)); json.dump(r, open(sys.argv[2], "w"), indent=1)
