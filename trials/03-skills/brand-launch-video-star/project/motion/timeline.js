// state = f(frame). Every value below is computed from the frame number and constants only (no accumulated state).
import { FPS, TOTAL_FRAMES, shot } from "./shots.js";

export const W = 1920;
export const H = 1080;

// ---------- helpers ----------
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const prog = (f, a, b) => clamp01((f - a) / (b - a));
const mix = (a, b, t) => a + (b - a) * t;
export const ease = {
  outCubic: (t) => 1 - (1 - t) ** 3,
  inCubic: (t) => t ** 3,
  inOutCubic: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  outBack: (t, s = 1.7) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
// damped settle after an impact: 1 + amp * decaying cosine
const settle = (f, at, amp, len) => {
  if (f < at || f > at + len) return 1;
  const t = (f - at) / len;
  return 1 + amp * Math.cos(t * Math.PI * 2) * (1 - t) ** 2;
};

// ---------- colour states (motion-quality.md: 2-5 named states tied to meaning) ----------
export const COLORS = {
  neutral: "#0E0F13",
  "interaction-blue": "#0C1B3F",
  "execution-violet": "#22123F",
  "result-amber": "#F4B23C",
  ink: "#F4F1EA",
  dark: "#1A1206",
  blue: "#7C8CFF",
  violet: "#B98CFF",
};
// each wipe is triggered by an on-screen event, at that event's position
const WIPES = [
  { start: 36, dur: 16, x: 960, y: 540, color: COLORS["interaction-blue"] }, // mark lifts off
  { start: 96, dur: 16, x: 1450, y: 560, color: COLORS["execution-violet"] }, // Send impact
  { start: 234, dur: 22, x: 1360, y: 780, color: COLORS["result-amber"] }, // last card lands in Done
  { start: 316, dur: 24, x: 690, y: 540, color: COLORS.neutral }, // week collapses into the mark
];

// ---------- primary / secondary actions, used for the beat audit (scripts/measure-beats.mjs) ----------
export const ACTIONS = [
  { beat: "brand-hook", kind: "primary", name: "orbit dot lands on mark", start: 0, end: 24 },
  { beat: "brand-hook", kind: "secondary", name: "wordmark reveal", start: 18, end: 32 },
  { beat: "intent", kind: "primary", name: "mark lifts to header", start: 34, end: 50 },
  { beat: "intent", kind: "primary", name: "prompt typed + Send pressed", start: 44, end: 99 },
  { beat: "intent", kind: "secondary", name: "label fades in", start: 50, end: 60 },
  { beat: "routing", kind: "primary", name: "dot runs through nodes", start: 98, end: 152 },
  { beat: "routing", kind: "secondary", name: "node labels + headline", start: 124, end: 142 },
  { beat: "board", kind: "primary", name: "nodes morph into columns", start: 160, end: 174 },
  { beat: "board", kind: "primary", name: "cards drop, then sort into Done", start: 170, end: 234 },
  { beat: "result", kind: "primary", name: "week fills", start: 248, end: 284 },
  { beat: "result", kind: "secondary", name: "headline words", start: 266, end: 286 },
  { beat: "lockup", kind: "primary", name: "week collapses into mark", start: 296, end: 318 },
  { beat: "lockup", kind: "primary", name: "mark + wordmark resolve", start: 318, end: 340 },
  { beat: "lockup", kind: "secondary", name: "CTA + disclaimer", start: 336, end: 346 },
];

// ---------- layout constants ----------
const MARK_C = { x: 690, y: 540 }; // lockup mark centre
const MARK_SIZE = 150;
const HEADER = { x: 96, y: 78, scale: 0.34 };
const SEND = { x: 1450, y: 560 };
const NODES = [560, 960, 1360];
const NODE_Y = 540;
const NODE_LABELS = ["Plan", "Assign", "Schedule"];
const COL_LABELS = ["To do", "Doing", "Done"];
const TASKS = [
  { title: "Draft launch post", color: "#7C8CFF", day: 0, top: 0, h: 120 },
  { title: "Record 30s demo", color: "#FF7A59", day: 1, top: 40, h: 150 },
  { title: "Brief support team", color: "#3FC1A5", day: 2, top: 0, h: 110 },
  { title: "Prep FAQ page", color: "#B98CFF", day: 3, top: 70, h: 130 },
  { title: "Ship v2 notes", color: "#1A1206", day: 4, top: 20, h: 170 },
];
const CARD_W = 300, CARD_H = 84;
const cardSlotY = (i) => 380 + i * 100;
const DAY_X = (d) => 560 + d * 200;
const DAY_TOP = 470;

// ---------- the orbit/routing dot (pure, so ghosts can sample earlier times) ----------
const quad = (p0, c, p1, t) => ({ x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t ** 2 * p1.x, y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t ** 2 * p1.y });
const routeDot = (f) => {
  if (f < 98 || f > 152) return null;
  if (f <= 120) { const t = ease.outCubic(prog(f, 98, 120)); return quad(SEND, { x: 1050, y: 240 }, { x: NODES[0], y: NODE_Y }, t); }
  if (f <= 146) { const t = ease.inOutSine(prog(f, 122, 146)); return { x: mix(NODES[0], NODES[2], t), y: NODE_Y }; }
  return { x: NODES[2], y: NODE_Y };
};
const hookDot = (f) => {
  if (f > 24) return null;
  const t = ease.inCubic(prog(f, 0, 24)); // accelerates into the landing
  const a = mix(200, 405, t) * (Math.PI / 180), r = mix(230, 0, ease.inCubic(prog(f, 8, 24))) + 73;
  // lands on the mark's dot (upper-right of mark)
  return { x: MARK_C.x + Math.cos(a) * r * 0.9, y: MARK_C.y - Math.sin(a) * r * 0.9 };
};
// node i lights when the dot reaches it
const nodeLitFrame = (i) => {
  for (let f = 98; f <= 152; f += 0.5) { const d = routeDot(f); if (f > 119 && d && d.x >= NODES[i] - 1) return f; }
  return 999;
};
const NODE_LIT = NODES.map((_, i) => nodeLitFrame(i));

// ---------- per-frame state ----------
export const buildState = (frameIn) => {
  const f = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIn));
  const s = {};

  // background: base + every started wipe as a growing circle (later on top)
  s.wipes = WIPES.filter((w) => f >= w.start).map((w) => ({ ...w, r: ease.inOutCubic(prog(f, w.start, w.start + w.dur)) * 2300 }));
  s.base = COLORS.neutral;

  // ----- mark (hook -> header -> hidden -> lockup) -----
  const lockOn = f >= 316;
  const sweep = lockOn ? ease.outCubic(prog(f, 320, 336)) : ease.outCubic(prog(f, 4, 24));
  const pop = lockOn ? ease.outBack(prog(f, 318, 334)) : ease.outBack(prog(f, 2, 22));
  const impact = lockOn ? settle(f, 334, 0.05, 10) : settle(f, 24, 0.07, 10);
  const lift = lockOn ? 0 : ease.inOutCubic(prog(f, 34, 50));
  const groupX = mix(0, HEADER.x - (MARK_C.x - MARK_SIZE / 2) * HEADER.scale, lift);
  const groupY = mix(0, HEADER.y - (MARK_C.y - MARK_SIZE / 2) * HEADER.scale - 0, lift);
  const groupScale = mix(1, HEADER.scale, lift);
  const groupOpacity = lockOn ? 1 : 1 - prog(f, 238, 246);
  s.mark = {
    visible: groupOpacity > 0.001,
    opacity: groupOpacity,
    sweepDeg: sweep * 360,
    markScale: mix(0.62, 1, pop) * impact,
    wordClip: 1 - ease.outExpo(lockOn ? prog(f, 326, 342) : prog(f, 18, 32)), // fraction hidden from the right
    wordX: mix(30, 0, ease.outCubic(lockOn ? prog(f, 326, 342) : prog(f, 18, 32))),
    groupX, groupY, groupScale,
    // header ink stays light on blue/violet
  };
  s.markC = MARK_C; s.markSize = MARK_SIZE;
  const hd = hookDot(f);
  s.hookDot = hd ? { ...hd, r: 14, ghosts: [1, 2, 3, 4, 5].map((k) => hookDot(f - k * 0.6)).filter(Boolean) } : null;

  // ----- intent: input bar, typing, cursor, Send -----
  const barIn = ease.outExpo(prog(f, 44, 62));
  const barOut = ease.inCubic(prog(f, 102, 112));
  const text = "Plan our launch week";
  const typed = Math.floor(prog(f, 62, 84) * text.length);
  const press = f < 90 ? 1 : f < 95 ? mix(1, 0.86, ease.outCubic(prog(f, 90, 95))) : f < 99 ? mix(0.86, 1.12, ease.outCubic(prog(f, 95, 99))) : mix(1.12, 1, ease.outCubic(prog(f, 99, 108)));
  const cur = ease.inOutCubic(prog(f, 72, 90));
  s.intent = {
    visible: f >= 42 && f < 114,
    opacity: prog(f, 42, 48) * (1 - barOut),
    y: 560 - 40 * barOut,
    width: mix(120, 1100, barIn),
    scale: 1 - 0.04 * barOut,
    label: { opacity: ease.outCubic(prog(f, 50, 60)) * (1 - barOut), y: 440 + 16 * (1 - ease.outCubic(prog(f, 50, 60))) },
    text: text.slice(0, typed),
    caret: f < 62 || f > 84 ? Math.floor(f / 8) % 2 === 0 : true,
    sendScale: press * ease.outBack(prog(f, 52, 62)),
    sendFlash: f >= 95 ? 1 - prog(f, 95, 104) : 0,
    cursor: { x: mix(1720, SEND.x + 14, cur), y: mix(930, SEND.y + 16, cur) + (f >= 90 && f < 99 ? 4 : 0), opacity: prog(f, 70, 74) * (1 - prog(f, 100, 106)) },
  };

  // ----- routing -----
  const rd = routeDot(f);
  s.routeDot = rd ? { ...rd, r: f > 146 ? mix(16, 0, prog(f, 146, 152)) : 16, ghosts: [1, 2, 3, 4, 5, 6].map((k) => routeDot(f - k * 0.7)).filter(Boolean) } : null;
  const morph = ease.inOutCubic(prog(f, 160, 174));
  const boardOut = ease.inCubic(prog(f, 240, 250));
  s.nodes = NODES.map((x, i) => {
    const appear = ease.outBack(prog(f, 104 + i * 3, 116 + i * 3));
    const lit = f >= NODE_LIT[i];
    const litPop = lit ? settle(f, NODE_LIT[i], 0.25, 8) : 1;
    const lab = ease.outCubic(prog(f, NODE_LIT[i] + 4, NODE_LIT[i] + 12));
    return {
      visible: f >= 104 && f < 252,
      x, y: mix(NODE_Y, 300, morph),
      w: mix(68, 320, morph), h: mix(68, 64, morph),
      scale: appear * litPop * (1 - 0.04 * boardOut),
      lit, opacity: 1 - boardOut,
      fill: lit ? (morph > 0 ? `rgba(244,241,234,${mix(1, 0.1, morph)})` : COLORS.violet) : "transparent",
      nodeLabel: { text: NODE_LABELS[i], opacity: lab * (1 - prog(f, 160, 166)), y: mix(620, 610, lab) },
      colLabel: { text: COL_LABELS[i], opacity: prog(f, 166, 174) * (1 - boardOut) },
    };
  });
  s.trail = f >= 120 && f < 176 ? { x0: NODES[0], x1: rd && f <= 146 ? Math.max(NODES[0], rd.x) : NODES[2], y: mix(NODE_Y, 300, morph), opacity: 1 - prog(f, 156, 163) } : null;
  s.headline1 = { text: "One goal. Every step.", opacity: ease.outCubic(prog(f, 132, 142)) * (1 - prog(f, 158, 166)), y: mix(350, 330, ease.outCubic(prog(f, 132, 142))) };

  // ----- board -----
  s.columns = NODES.map((x) => ({ x, opacity: ease.outCubic(prog(f, 166, 178)) * (1 - boardOut) * 0.06 }));
  s.cards = TASKS.map((t, i) => {
    const dropT = ease.outCubic(prog(f, 170 + i * 3, 180 + i * 3));
    const ss = 192 + i * 6, se = ss + 16;
    const m = prog(f, ss, se), mt = ease.inOutCubic(m);
    const landed = f >= se;
    return {
      visible: f >= 170 && f < 252,
      title: t.title, color: t.color,
      x: mix(NODES[0], NODES[2], mt),
      y: cardSlotY(i) - 60 * (1 - dropT) - 46 * Math.sin(Math.PI * m),
      rot: 5 * Math.sin(Math.PI * m) * (m < 0.5 ? 1 : 0.6),
      scale: (landed ? settle(f, se, 0.05, 6) : 1 + 0.04 * Math.sin(Math.PI * m)) * (1 - 0.05 * boardOut),
      opacity: dropT * (1 - boardOut),
      check: ease.outBack(prog(f, se + 1, se + 7)),
      shadow: Math.sin(Math.PI * m),
    };
  });

  // ----- result: week calendar -----
  const collapse = ease.inCubic(prog(f, 298, 316));
  s.days = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => ({ text: d, x: DAY_X(i), opacity: ease.outCubic(prog(f, 248 + i * 2, 256 + i * 2)) * (1 - prog(f, 296, 302)) }));
  s.dayCols = [0, 1, 2, 3, 4].map((i) => ({ x: DAY_X(i), opacity: ease.outCubic(prog(f, 248 + i * 2, 256 + i * 2)) * (1 - prog(f, 296, 302)) }));
  s.blocks = TASKS.map((t, i) => {
    const g = ease.outBack(prog(f, 254 + i * 4, 264 + i * 4), 1.2);
    const bx = DAY_X(t.day), by = DAY_TOP + 20 + t.top + t.h / 2;
    return {
      visible: f >= 254 && f < 318,
      title: t.title, color: t.color,
      x: mix(bx, MARK_C.x, collapse), y: mix(by, MARK_C.y, collapse),
      w: mix(170, 28, collapse), h: mix(t.h * Math.max(0, g), 28, collapse),
      radius: mix(12, 14, collapse),
      textOpacity: prog(f, 262 + i * 4, 268 + i * 4) * (1 - prog(f, 298, 304)),
      opacity: f < 316 ? 1 : 1 - prog(f, 316, 318),
    };
  });
  const words = ["Launch", "week,", "planned."];
  s.headline2 = words.map((w, i) => { const t = ease.outCubic(prog(f, 266 + i * 5, 276 + i * 5)); return { text: w, opacity: t * (1 - prog(f, 296, 304)), y: 24 * (1 - t) }; });

  // ----- lockup extras -----
  s.cta = { opacity: ease.outCubic(prog(f, 336, 346)), y: 14 * (1 - ease.outCubic(prog(f, 336, 346))) };
  s.disclaimer = { opacity: 0.55 * prog(f, 338, 348) };
  s.lockDot = f >= 314 && f < 322 ? { x: MARK_C.x, y: MARK_C.y, r: f < 318 ? mix(18, 26, prog(f, 314, 318)) : mix(26, 0, prog(f, 318, 322)) } : null;

  return s;
};

// ---------- scaffold plugin interface ----------
export const resolveMotionSceneContext = () => ({ layout: { videoWidth: W, videoHeight: H } });
export const getMotionDurationInFrames = () => TOTAL_FRAMES;
export const buildMotionSceneProps = ({ frame = 0 } = {}) => ({ layout: { videoWidth: W, videoHeight: H }, frame, state: buildState(frame) });
export { FPS, shot };
