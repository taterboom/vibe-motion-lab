# 用 Chromium 把原始 SVG 栅格化成 1024px PNG（白底版作 source.png，另存透明版）
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
svg = Path(sys.argv[1]).resolve(); out = Path(sys.argv[2]); size = 1024
html = f'<html><body style="margin:0;background:transparent"><img src="{svg.as_uri()}" width="{size}" height="{size}" style="display:block"></body></html>'
tmp = out.parent / "_raster.html"; tmp.write_text(html)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": size, "height": size})
    pg.goto(tmp.resolve().as_uri()); pg.wait_for_timeout(200)
    pg.screenshot(path=str(out.with_name(out.stem + "_alpha.png")), omit_background=True)
    pg.set_content(html.replace("transparent", "#ffffff")); pg.goto(tmp.resolve().as_uri().replace("x","x"))
    pg.evaluate("document.body.style.background='#fff'"); pg.wait_for_timeout(100)
    pg.screenshot(path=str(out)); b.close()
tmp.unlink()
