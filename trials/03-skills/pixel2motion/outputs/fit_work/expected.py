"""按设计的 cubic-bezier 算期望值，和探针读数对照；同时给出线性插值值，看是否「掉成线性」。"""
import json
def bez(x1,y1,x2,y2,x):
    lo,hi=0.0,1.0
    for _ in range(60):
        t=(lo+hi)/2; bx=3*(1-t)**2*t*x1+3*(1-t)*t*t*x2+t**3
        lo,hi=(t,hi) if bx<x else (lo,t)
    t=(lo+hi)/2; return 3*(1-t)**2*t*y1+3*(1-t)*t*t*y2+t**3
P=json.load(open("outputs/qa/easing_probe.json"))["probe"]
rows=[]
for r in P:
    t=r["t"]
    def seg(a,b,v0,v1,curve):
        if t<=a: return v0, v0
        if t>=b: return v1, v1
        f=(t-a)/(b-a); return v0+(v1-v0)*bez(*curve,f), v0+(v1-v0)*f
    e_bl,l_bl=seg(300,720,1,0,(0.4,0,0.2,1)); e_br,l_br=seg(360,780,1,0,(0.4,0,0.2,1))
    sc = None
    if 750<=t<=900: sc=seg(750,900,0.94,1.05,(0.16,1,0.3,1))
    elif 900<t<=1050: sc=seg(900,1050,1.05,0.985,(0.4,0,0.2,1))
    rows.append({"t":t,"bolt-left 实测":r["#bolt-left:stroke-dashoffset"],"期望":round(e_bl,4),"若线性":round(l_bl,4),
                 "bolt-right 实测":r["#bolt-right:stroke-dashoffset"],"期望R":round(e_br,4),"若线性R":round(l_br,4),
                 "logo 实测":r["#logo:transform"],"scale期望/线性":[round(v,4) for v in sc] if sc else None,"cover":r["#bolt-cover:opacity"]})
for x in rows: print(x)
json.dump(rows,open("outputs/qa/easing_probe_vs_design.json","w"),ensure_ascii=False,indent=1)
