"""从栅格源图测量几何：圆角半径、白色镂空多边形角点、黄/绿描边宽度。结果写 measure.json。"""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, "../../../.claude/skills/pixel2motion/scripts")
from raster_logo_trace import trace_mask, simplify_closed  # 复用技能自带的描边与 RDP

src = np.asarray(Image.open("input/source.png").convert("RGB")).astype(int)
H, W, _ = src.shape
def near(c, tol=60): return np.linalg.norm(src - np.array(c), axis=2) < tol
dark, yellow, green = near((46,56,43)), near((242,207,115)), near((138,163,130),40)
white = src.sum(axis=2) > 720
out = {}
# 1) 圆角：沿四个对角线找第一个深色像素
rs = []
for (x0,y0,dx,dy) in [(0,0,1,1),(W-1,0,-1,1),(0,H-1,1,-1),(W-1,H-1,-1,-1)]:
    for i in range(300):
        if dark[y0+dy*i, x0+dx*i]:
            rs.append(i/(1-1/math.sqrt(2))); break
out["corner_samples"] = rs
# 2) 镂空：从中心附近的白点 flood fill
seed = (600, 512)
assert white[seed[1], seed[0]]
m = Image.fromarray((white*255).astype(np.uint8)).copy(); ImageDraw.floodfill(m, seed, 128)
hole = np.asarray(m) == 128
loops = trace_mask(hole)
poly = simplify_closed(loops[0], 3.0)
out["hole_poly"] = poly
# 3) 黄色带宽：在每条非边框边的中点，沿法线向外量黄色像素长度
def band(px, py, nx, ny, mask, maxd=80):
    run, start = 0, None
    for s in range(1, maxd):
        x, y = int(round(px+nx*s)), int(round(py+ny*s))
        if not (0<=x<W and 0<=y<H): break
        if mask[y,x]:
            start = s if start is None else start; run += 1
        elif start is not None: break
    return start, run
edges = []
n = len(poly)
for i in range(n):
    (x1,y1),(x2,y2) = poly[i], poly[(i+1)%n]
    if (y1 in (0,H) and y2 in (0,H)) or (x1 in (0,W) and x2 in (0,W)): continue
    L = math.hypot(x2-x1,y2-y1)
    if L < 60: continue
    tx, ty = (x2-x1)/L, (y2-y1)/L
    for sgn in (1,-1):
        nx, ny = -ty*sgn, tx*sgn
        mx, my = (x1+x2)/2, (y1+y2)/2
        if hole[int(my+ny*5), int(mx+nx*5)]: continue  # 法线指回镂空里，换方向
        ys = [band(x1+(x2-x1)*f, y1+(y2-y1)*f, nx, ny, yellow) for f in (0.3,0.5,0.7)]
        edges.append({"p1":[x1,y1],"p2":[x2,y2],"len":round(L,1),"normal_out":[round(nx,3),round(ny,3)],"yellow_start_width":ys})
        break
out["edges"] = edges
json.dump(out, open("outputs/fit_work/measure.json","w"), indent=1)
print(json.dumps({k:v for k,v in out.items()}, indent=1)[:3500])
