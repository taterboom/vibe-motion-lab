// 逐帧导出 A、B 的姿势数值（不渲染），供画曲线和自查
import { computePose } from "../motion/timeline.js";
const fps = 30, frames = 60;
const rows = [];
for (let f = 0; f < frames; f++) {
  const a = computePose("A", f / fps), b = computePose("B", f / fps);
  rows.push({ f, aLift: a.lift, aSy: a.scaleY, aSx: a.scaleX, aEye: a.eyeOffsetY, aOpen: a.eyeOpen,
              bLift: b.lift, bSy: b.scaleY, bSx: b.scaleX, bEye: b.eyeOffsetY, bOpen: b.eyeOpen });
}
if (process.argv[2] === "--json") console.log(JSON.stringify(rows));
else for (const r of rows) console.log([r.f, r.aLift, r.aSy, r.bLift, r.bSy, r.bSx, r.bEye, r.bOpen].map((x) => (+x).toFixed(2).padStart(7)).join(""));
