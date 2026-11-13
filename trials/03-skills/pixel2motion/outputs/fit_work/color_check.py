"""补充指标：技能的 IoU 只看「非白」轮廓，看不出颜色错。这里按三种颜色分别算 IoU，外加平均像素差。"""
import sys, json, numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(int)
b = np.asarray(Image.open(sys.argv[2]).convert("RGB")).astype(int)
res = {"mean_abs_rgb_diff": round(float(np.abs(a-b).mean()), 3)}
for name, c, t in (("dark", (46,56,43), 60), ("yellow", (242,207,115), 60), ("green", (138,163,130), 40)):
    ma = np.linalg.norm(a-np.array(c), axis=2) < t; mb = np.linalg.norm(b-np.array(c), axis=2) < t
    res[f"iou_{name}"] = round(float((ma&mb).sum()/max(1,(ma|mb).sum())), 4)
print(json.dumps(res))
