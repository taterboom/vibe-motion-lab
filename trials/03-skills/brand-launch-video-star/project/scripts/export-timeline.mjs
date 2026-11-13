// Writes ../timeline.json (validate-timeline.mjs format) from motion/shots.js, the single source of shot boundaries.
import { writeFileSync } from "node:fs";
import { FPS, DURATION_SECONDS, SHOTS } from "../motion/shots.js";
const out = new URL("../../timeline.json", import.meta.url);
writeFileSync(out, JSON.stringify({ fps: FPS, durationSeconds: DURATION_SECONDS, allowCustomDuration: true, maxOverlapFrames: 12,
  shots: SHOTS.map(({ id, startFrame, endFrame, visualOwner, action, color }) => ({ id, startFrame, endFrame, visualOwner, primaryAction: action, colorState: color })) }, null, 2) + "\n");
console.log("wrote", out.pathname);
