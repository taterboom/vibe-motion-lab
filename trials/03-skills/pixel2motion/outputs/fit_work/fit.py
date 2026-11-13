"""按复杂度阶梯拟合：圆角矩形 + 折线闪电（中心线最小二乘 → 相邻边求交）+ 描边。
输出各迭代 SVG 到 outputs/fit_work/iters/，参数写 params.json。"""
import json, math, sys, itertools, os
import numpy as np
from PIL import Image, ImageDraw
M = json.load(open("outputs/fit_work/measure.json"))
src = np.asarray(Image.open("input/source.png").convert("RGB")).astype(int)
H, W, _ = src.shape
near = lambda c, t=60: np.linalg.norm(src - np.array(c), axis=2) < t
yellow, green = near((242,207,115)), near((138,163,130), 40)

def fit_center(edge, mask, half_extent=60):
    """沿边取 40 个点，法线方向找色带中点，最小二乘拟合直线 (点, 方向)。"""
    (x1,y1),(x2,y2) = edge["p1"], edge["p2"]; nx, ny = edge["normal_out"]
    pts = []
    for f in np.linspace(0.12, 0.88, 40):
        px, py = x1+(x2-x1)*f, y1+(y2-y1)*f
        on = [s for s in range(0, half_extent) if 0<=int(round(py+ny*s))<H and 0<=int(round(px+nx*s))<W and mask[int(round(py+ny*s)), int(round(px+nx*s))]]
        if not on: continue
        # 只取第一段连续色带
        run = [on[0]]
        for s in on[1:]:
            if s == run[-1]+1: run.append(s)
            else: break
        c = (run[0]+run[-1])/2
        pts.append((px+nx*c, py+ny*c))
    P = np.array(pts); mu = P.mean(0); _,_,vt = np.linalg.svd(P-mu); d = vt[0]
    resid = np.abs((P-mu) @ np.array([-d[1], d[0]]))
    if os.environ.get("ROBUST"):  # 迭代剔除离群点（> 2.5 px 且 > 3σ）后重拟合
        for _ in range(3):
            keep = resid < max(2.5, 3*resid.std()) if resid.std() > 0.3 else resid < 9e9
            P = P[keep]; mu = P.mean(0); _,_,vt = np.linalg.svd(P-mu); d = vt[0]
            resid = np.abs((P-mu) @ np.array([-d[1], d[0]]))
    return mu, d, float(resid.std()), float(resid.max())

def intersect(a, b):
    (p, d), (q, e) = a, b
    A = np.array([d, -e]).T; t = np.linalg.solve(A, q-p); return p + t[0]*d
def at_y(line, y):
    p, d = line; t = (y-p[1])/d[1]; return p + t*d

E = [e for e in M["edges"] if e["len"] > 150]   # 6 条长边（去掉顶边、圆角接头小边）
L = {}
names = ["right_upper", "right_arm", "right_lower", "left_lower", "left_arm", "left_upper"]
fits = {}
for name, e in zip(names, E):
    mu, d, sd, mx = fit_center(e, yellow)
    L[name] = (mu, d); fits[name] = {"resid_sd_px": round(sd,3), "resid_max_px": round(mx,3)}
import os
def fit_outer(edge, mask, w):
    """从外侧往里扫到黄色外缘，再往里退 w/2 得中心线（右侧两条边镂空里混着绿色，内侧测量有偏）。"""
    (x1,y1),(x2,y2) = edge["p1"], edge["p2"]; nx, ny = edge["normal_out"]; pts=[]
    for f in np.linspace(0.12, 0.88, 60):
        px, py = x1+(x2-x1)*f, y1+(y2-y1)*f
        for s in np.arange(70, 0, -0.25):
            x, y = int(round(px+nx*s)), int(round(py+ny*s))
            if 0<=x<W and 0<=y<H and mask[y,x]:
                c = s - w/2; pts.append((px+nx*c, py+ny*c)); break
    P=np.array(pts); mu=P.mean(0); _,_,vt=np.linalg.svd(P-mu); d=vt[0]
    r=np.abs((P-mu)@np.array([-d[1],d[0]])); return mu, d, float(r.std()), float(r.max())
if os.environ.get("REFINE") and not os.environ.get("ROBUST"):
    yw0 = float(np.mean([w for e in E for (_, w) in e["yellow_start_width"]]))
    for name, e in zip(names, E):
        if name in ("right_upper", "right_arm"):
            mu, d, sd, mx = fit_outer(e, yellow, yw0); L[name]=(mu,d); fits[name]={"resid_sd_px": round(sd,3), "resid_max_px": round(mx,3), "method":"outer_edge"}
TOP, BOT = -100.0, 1124.0
left = [at_y(L["left_upper"], TOP), intersect(L["left_upper"], L["left_arm"]), intersect(L["left_arm"], L["left_lower"]), at_y(L["left_lower"], BOT)]
right = [at_y(L["right_upper"], TOP), intersect(L["right_upper"], L["right_arm"]), intersect(L["right_arm"], L["right_lower"]), at_y(L["right_lower"], BOT)]
R = float(np.mean(M["corner_samples"]))
yw = float(np.mean([w for e in E for (_, w) in e["yellow_start_width"]]))

def poly_d(pts): return "M" + " L".join(f"{x:.1f} {y:.1f}" for x,y in pts)
bolt_poly = left[:1] + left[1:] + right[::-1]          # 闭合多边形：左侧向下，右侧向上
# 绿色阴影：在同一折线上做平移 + 线宽网格搜索，目标=绿色像素 IoU（只算黄色之外的区域）
def raster_poly(pts, width, dx=0, dy=0, scale=0.5):
    im = Image.new("L", (int(W*scale), int(H*scale)), 0); dr = ImageDraw.Draw(im)
    for seg in pts:
        dr.line([((x+dx)*scale, (y+dy)*scale) for x,y in seg], fill=255, width=max(1,int(round(width*scale))), joint="curve")
    return np.asarray(im) > 0
ys = np.asarray(Image.fromarray(yellow.astype(np.uint8)*255).resize((W//2,H//2))) > 127
gs = np.asarray(Image.fromarray(green.astype(np.uint8)*255).resize((W//2,H//2))) > 127
# 瓦片外（圆角外）不算
tile = np.zeros((H//2, W//2), bool); Image.fromarray(tile)
best = None
for dx, dy, gw in itertools.product(range(-34, 1, 2), range(0, 35, 2), (17, 19, 21, 23, 25)):
    g = raster_poly([left, right], gw, dx, dy) & ~ys
    inter = (g & gs).sum(); uni = (g | gs).sum(); iou = inter/uni
    if best is None or iou > best[0]: best = (iou, dx, dy, gw)
iou_g, gdx, gdy, gw = best
if os.environ.get("REFINE"):  # 全分辨率、步长 1 细搜
    ys1, gs1 = yellow, green; b2=None
    for dx, dy, w2 in itertools.product(range(gdx-2, gdx+3), range(gdy-2, gdy+3), np.arange(gw-3, gw+2, 1.0)):
        g = raster_poly([left, right], w2, dx, dy, scale=1.0) & ~ys1
        v = (g&gs1).sum()/(g|gs1).sum()
        if b2 is None or v>b2[0]: b2=(v,dx,dy,float(w2))
    iou_g, gdx, gdy, gw = b2
params = {"corner_radius": round(R,2), "yellow_width": round(yw,2), "left": [list(map(lambda v: round(float(v),1), p)) for p in left],
          "right": [list(map(lambda v: round(float(v),1), p)) for p in right], "line_fit_residuals": fits,
          "green_offset": [gdx, gdy], "green_width": gw, "green_grid_iou_halfres": round(float(iou_g),4)}
json.dump(params, open("outputs/fit_work/params.json","w"), indent=1)
print(json.dumps(params, indent=1))

C_DARK, C_Y, C_G = "#2e382b", "#f2cf73", "#8aa382"
def svg(level, viewbox="0 0 1024 1024", ids=True):
    rect = f'<rect width="1024" height="1024" rx="{R:.1f}"/>'
    hole = f'M0 0 H1024 V1024 H0 Z {poly_d(bolt_poly)} Z'
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}">',
             f'  <defs><clipPath id="tile-clip">{rect}</clipPath></defs>',
             '  <g id="logo" clip-path="url(#tile-clip)">',
             f'    <path id="tile" fill="{C_DARK}" fill-rule="evenodd" d="{hole}"/>']
    if level >= 3 and level != 3.5:
        pass
    if level >= 4:
        for side, pts in (("left", left), ("right", right)):
            parts.append(f'    <path id="shadow-{side}" d="{poly_d(pts)}" fill="none" stroke="{C_G}" stroke-width="{gw}" stroke-linejoin="round" transform="translate({gdx},{gdy})" pathLength="1"/>')
    if level >= 3:
        for side, pts in (("left", left), ("right", right)):
            parts.append(f'    <path id="bolt-{side}" d="{poly_d(pts)}" fill="none" stroke="{C_Y}" stroke-width="{yw:.1f}" stroke-linejoin="round" pathLength="1"/>')
    parts += ["  </g>", "</svg>", ""]
    return "\n".join(parts)
import os; os.makedirs("outputs/fit_work/iters", exist_ok=True)
if os.environ.get("REFINE"):
    tag = os.environ.get("TAG", "05_refit_right_edges")
    open(f"outputs/fit_work/iters/{tag}.svg", "w").write(svg(4))
    json.dump(params, open(f"outputs/fit_work/params_{tag[:2]}.json","w"), indent=1)
else:
    for lv, name in ((2, "02_tile_hole"), (3, "03_yellow_stroke"), (4, "04_green_shadow")):
        open(f"outputs/fit_work/iters/{name}.svg", "w").write(svg(lv))
open("outputs/fit_work/svg_builder_ok", "w").write("1")
