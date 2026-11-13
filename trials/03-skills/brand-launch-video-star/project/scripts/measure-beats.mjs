// Beat audit for hypothesis 7: beats/s, simultaneous primary actions, transition overlaps, motion energy from the rendered file.
// node scripts/measure-beats.mjs out/orbitask-launch.mp4
import { execFileSync } from "node:child_process";
import { SHOTS, FPS, TOTAL_FRAMES } from "../motion/shots.js";
import { ACTIONS } from "../motion/timeline.js";

const video = process.argv[2];
console.log(`beats: ${SHOTS.length} in ${TOTAL_FRAMES / FPS}s = ${(SHOTS.length / (TOTAL_FRAMES / FPS)).toFixed(2)} beats/s`);
console.log("overlaps (frames):", SHOTS.slice(1).map((s, i) => `${SHOTS[i].id}->${s.id}: ${SHOTS[i].endFrame - s.startFrame}`).join(", "));

// simultaneous primary actions per frame, split by inside/outside shot overlaps
const inOverlap = (f) => SHOTS.filter((s) => f >= s.startFrame && f < s.endFrame).length > 1;
const hist = { in: {}, out: {} };
for (let f = 0; f < TOTAL_FRAMES; f++) {
  const n = ACTIONS.filter((a) => a.kind === "primary" && f >= a.start && f < a.end).length;
  const k = inOverlap(f) ? "in" : "out"; hist[k][n] = (hist[k][n] || 0) + 1;
}
console.log("frames by # of active primary actions — outside overlaps:", hist.out, " inside overlaps:", hist.in);
for (const s of SHOTS) console.log(`  ${s.id}: primaries = ${ACTIONS.filter((a) => a.beat === s.id && a.kind === "primary").map((a) => a.name).join(" | ")}`);

if (video) {
  const w = 192, h = 108;
  const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", video, "-vf", `scale=${w}:${h}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 28 });
  const n = raw.length / (w * h), d = [0];
  for (let i = 1; i < n; i++) { let s = 0; for (let p = 0; p < w * h; p++) s += Math.abs(raw[i * w * h + p] - raw[(i - 1) * w * h + p]); d.push(s / (w * h)); }
  console.log(`\nrendered frames: ${n}`);
  const cuts = d.map((v, i) => [i, v]).filter(([, v]) => v > 25);
  console.log("single-frame jumps (mean |diff| > 25 of 255):", cuts.length ? cuts.map(([i, v]) => `${i}:${v.toFixed(0)}`).join(" ") : "none");
  for (const s of SHOTS) { const seg = d.slice(s.startFrame + 1, s.endFrame); const mean = seg.reduce((a, b) => a + b, 0) / seg.length; const still = seg.filter((v) => v < 0.15).length;
    console.log(`  ${s.id.padEnd(11)} motion mean ${mean.toFixed(2)}  peak ${Math.max(...seg).toFixed(1)}  near-still frames ${still}/${seg.length}`); }
  // energy per 10-frame window, for peaks/braking
  const win = []; for (let i = 0; i < n; i += 10) win.push(d.slice(i, i + 10).reduce((a, b) => a + b, 0) / 10);
  console.log("energy per 1/3 s:", win.map((v) => v.toFixed(1)).join(" "));
  const peaks = win.map((v, i) => [i * 10, v]).filter(([, v], i) => v > 2 && v >= (win[i - 1] ?? 0) && v >= (win[i + 1] ?? 0));
  console.log("local peaks (>2):", peaks.map(([f, v]) => `f${f}:${v.toFixed(1)}`).join(" "));
}
