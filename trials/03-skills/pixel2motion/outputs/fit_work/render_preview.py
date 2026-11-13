"""预览：用 ?t= 逐帧（30fps）截 #logo-root，末尾停 0.5s；另查 prefers-reduced-motion 是否直接是静态终态。"""
import io, sys, numpy as np
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
html, outdir = Path(sys.argv[1]).resolve(), Path(sys.argv[2]); outdir.mkdir(parents=True, exist_ok=True)
url = html.as_uri(); n = 0
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 900, "height": 600})
    for i in range(0, 46):  # 0..1500ms
        t = min(1500, round(i * 1000 / 30, 3))
        pg.goto(f"{url}?t={t}"); pg.wait_for_function("window.__p2mReady === true")
        pg.locator("#logo-root").screenshot(path=str(outdir / f"f{n:04d}.png")); n += 1
    last = outdir / f"f{n-1:04d}.png"
    for _ in range(15): (outdir / f"f{n:04d}.png").write_bytes(last.read_bytes()); n += 1
    # reduced motion
    ctx = b.new_context(viewport={"width": 900, "height": 600}, reduced_motion="reduce"); pr = ctx.new_page()
    pr.goto(url); pr.wait_for_timeout(300); rm = np.asarray(Image.open(io.BytesIO(pr.locator("#logo-root").screenshot())).convert("RGB")).astype(int)
    pg.goto(f"{url}?static=1"); pg.wait_for_function("window.__p2mReady === true")
    st = np.asarray(Image.open(io.BytesIO(pg.locator("#logo-root").screenshot())).convert("RGB")).astype(int)
    print("reduced-motion vs static: max diff", int(np.abs(rm-st).max()) if rm.shape == st.shape else ("shape", rm.shape, st.shape))
    b.close()
print("frames", n)
