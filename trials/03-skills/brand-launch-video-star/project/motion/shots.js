// Single source of shot boundaries (brand-launch-video-star step 8: "Keep shot boundaries in one timeline/constants module").
// scripts/export-timeline.mjs writes ../timeline.json from this file for validate-timeline.mjs.
export const FPS = 30;
export const DURATION_SECONDS = 12;
export const TOTAL_FRAMES = FPS * DURATION_SECONDS; // 360

export const SHOTS = [
  { id: "brand-hook", startFrame: 0, endFrame: 40, visualOwner: "orbitask mark (fictional, authored SVG)", action: "orbit dot lands, mark resolves", color: "neutral" },
  { id: "intent", startFrame: 34, endFrame: 110, visualOwner: "prompt input", action: "goal typed, Send pressed", color: "interaction-blue" },
  { id: "routing", startFrame: 102, endFrame: 170, visualOwner: "routing dot", action: "dot runs Plan -> Assign -> Schedule", color: "execution-violet" },
  { id: "board", startFrame: 162, endFrame: 250, visualOwner: "task cards", action: "cards sort into Done", color: "execution-violet" },
  { id: "result", startFrame: 242, endFrame: 306, visualOwner: "week calendar", action: "week fills, headline holds", color: "result-amber" },
  { id: "lockup", startFrame: 298, endFrame: 360, visualOwner: "orbitask mark + CTA", action: "week collapses into mark", color: "neutral" },
];

export const shot = (id) => SHOTS.find((s) => s.id === id);
