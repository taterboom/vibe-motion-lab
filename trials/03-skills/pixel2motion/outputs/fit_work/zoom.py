"""平滑度证据：把原图(1024 栅格放大)、描摹结果、拟合结果在 4096px 下渲染，裁同一块左尖角区域并排。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
Z = 4; box = (170*Z, 560*Z, 300*Z, 690*Z)
items = [("source raster x4 (nearest)", None), ("01 raw trace", "outputs/fit_work/iters/01_raw_trace.svg"), ("06 fit", "outputs/fit_work/iters/06_robust_line_fit.svg")]
crops = []
src = Image.open("input/source.png").convert("RGB").resize((1024*Z,)*2, Image.NEAREST).crop(box); crops.append(src)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1024*Z, "height": 1024*Z})
    for _, f in items[1:]:
        hp = Path("outputs/fit_work/_z.html"); hp.write_text(f'<html><body style="margin:0;background:#fff"><img src="{Path(f).resolve().as_uri()}" width="{1024*Z}" height="{1024*Z}" style="display:block"></body></html>')
        pg.goto(hp.resolve().as_uri())
        pg.wait_for_timeout(300); tmp = "outputs/fit_work/_z.png"; pg.screenshot(path=tmp, clip={"x":box[0],"y":box[1],"width":box[2]-box[0],"height":box[3]-box[1]})
        crops.append(Image.open(tmp).convert("RGB"))
    b.close()
w, h = crops[0].size; out = Image.new("RGB", (w*3+40, h+30), "white"); d = ImageDraw.Draw(out)
for i, (c, (lab, _)) in enumerate(zip(crops, items)):
    out.paste(c, (i*(w+20), 30)); d.text((i*(w+20)+6, 8), lab, fill="black")
out.save("outputs/audit/zoom_compare.png"); Path("outputs/fit_work/_z.png").unlink(); Path("outputs/fit_work/_z.html").unlink()
