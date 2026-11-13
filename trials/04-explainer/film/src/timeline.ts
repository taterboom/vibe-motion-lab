// Pure functions: frame -> every visual value. No React. Importable from Node (scripts/probe-values.mjs).
import {Easing, interpolate} from 'remotion';

export type Beat = {id: string; startFrame: number; endFrame: number; statement: string};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1); // from shot-library ProductionSystem.tsx
const lerp = (f: number, a: number, b: number, from: number, to: number, easing = ease) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing});

// ---------- the demo motion being explained ----------
export type DemoValues = {
  frame: number;
  x: number; // scene px, 0..1280
  y: number; // ball bottom, scene px
  squash: number; // scaleY, 0.7..1
  hue: number; // HSL hue
  color: string;
  camera: number; // zoom
};

export const DEMO = {period: 60, sceneW: 1280, sceneH: 720, ground: 620, jump: 380, xFrom: 140, xTo: 1140};

export const demoTimeline = (d: number, period = DEMO.period): DemoValues => {
  const t = Math.min(1, Math.max(0, d / period)); // contacts land exactly on d = 0 and d = period/2
  const phase = (t * 2) % 1; // two bounces per loop
  const h = 4 * phase * (1 - phase); // 0 at contact, 1 at apex
  const squash = 1 - 0.3 * Math.max(0, 1 - h / 0.15);
  const hue = 205 - 185 * t;
  return {
    frame: d,
    x: DEMO.xFrom + (DEMO.xTo - DEMO.xFrom) * t,
    y: DEMO.ground - DEMO.jump * h,
    squash,
    hue,
    color: `hsl(${hue.toFixed(0)}, 80%, 62%)`,
    camera: 1 + 0.15 * t * t * (3 - 2 * t),
  };
};

// ---------- film timing ----------
export const byId = (beats: Beat[]) => Object.fromEntries(beats.map((b) => [b.id, b])) as Record<string, Beat>;

/** Which demo frame the film is "computing" at this video frame. */
export const demoFrameAt = (f: number, B: Record<string, Beat>, period = DEMO.period) => {
  const cap = B['b5-capture'].startFrame;
  const chk = B['b8-check'].startFrame;
  if (f < cap) return Math.floor(Math.max(0, f - 12) / 2) % period;
  if (f < cap + period) return f - cap;
  if (f < chk + 10) return period - 1;
  return Math.round(lerp(f, chk + 10, chk + 45, 0, period - 1, Easing.linear));
};

export type FilmState = ReturnType<typeof filmState>;

export const filmState = (f: number, beats: Beat[], period = DEMO.period) => {
  const B = byId(beats);
  const s = (id: string) => B[id].startFrame;
  const active = beats.find((b) => f >= b.startFrame && f < b.endFrame) ?? beats[beats.length - 1];
  const d = demoFrameAt(f, B, period);
  const values = demoTimeline(d, period);

  // camera: centre point + scale, world -> screen
  const camT1 = lerp(f, s('b2-frame-in'), s('b2-frame-in') + 40, 0, 1);
  const camT2 = lerp(f, s('b4-scene'), s('b4-scene') + 36, 0, 1);
  const camera = {
    cx: 960 + (560 - 960) * camT1 + (960 - 560) * camT2,
    cy: 500 + (480 - 500) * camT1 + (540 - 480) * camT2,
    scale: 1.18 + (1.0 - 1.18) * camT2,
  };

  // b6-b7: action is in the bottom strip; dim the frozen upper row, relight it in b8 (QC window review fix)
  const upper = 1 - 0.55 * (lerp(f, s('b6-encode'), s('b6-encode') + 10, 0, 1) - lerp(f, s('b8-check'), s('b8-check') + 10, 0, 1));

  // frame chip: hook rect -> docked rect
  const dock = lerp(f, s('b2-frame-in') + 6, s('b2-frame-in') + 46, 0, 1, Easing.inOut(Easing.quad)); // probe: keep per-frame step < 40px
  const chip = {
    opacity: lerp(f, 6, 18, 0, 1),
    x: 760 + (130 - 760) * dock,
    y: 400 + (300 - 400) * dock,
    w: 400 + (380 - 400) * dock,
    h: 200 + (80 - 200) * dock,
    fontSize: 120 + (44 - 120) * dock,
    dim: upper,
    label:
      f >= s('b8-check') ? '直接算' : f >= s('b5-capture') && f < s('b6-encode') ? '截图中' : '帧号 frame',
  };

  const fnIn = lerp(f, s('b2-frame-in'), s('b2-frame-in') + 22, 0, 1);
  const fn = {
    opacity: fnIn,
    rise: 40 * (1 - fnIn),
    lit: f >= s('b2-frame-in') + 46,
    lineReveal: (i: number) => lerp(f, s('b2-frame-in') + 12 + i * 4, s('b2-frame-in') + 24 + i * 4, 0, 1),
  };

  const b3 = s('b3-values');
  const values4 = {
    panelOpacity: lerp(f, b3, b3 + 14, 0, 1),
    wire: (i: number) => lerp(f, b3 + 4 + i * 6, b3 + 18 + i * 6, 0, 1, Easing.linear),
    row: (i: number) => lerp(f, b3 + 16 + i * 10, b3 + 28 + i * 10, 0, 1),
    pulse: (i: number) => {
      const p = s('b4-scene') + 30 + i * 12;
      return interpolate(f, [p, p + 4, p + 16], [0, 1, 0], clamp);
    },
    dimNonCheck: f >= s('b8-check') ? 1 : 0,
  };

  const b4 = s('b4-scene');
  const scene = {
    open: lerp(f, b4, b4 + 22, 0, 1),
    wire: (i: number) => lerp(f, b4 + 8 + i * 4, b4 + 22 + i * 4, 0, 1, Easing.linear),
    ballOpacity: 1 - lerp(f, s('b8-check'), s('b8-check') + 12, 0, 1),
    chart: lerp(f, s('b8-check') + 4, s('b8-check') + 16, 0, 1),
  };

  const b5 = s('b5-capture');
  const browser = {
    in: lerp(f, b5, b5 + 16, 0, 1),
    captured: Math.max(0, Math.min(period, f - b5 + 1)),
    mode: f >= s('b8-check') + 6 ? ('node' as const) : ('chrome' as const),
  };

  // film strip: 3 rows x 20 cols = 60 slots; row r == worker r in b7
  const b6 = s('b6-encode');
  const b7 = s('b7-parallel');
  const encode = lerp(f, b6 + 8, b6 + 58, 0, 1, Easing.inOut(Easing.quad));
  const clear = lerp(f, b7 + 6, b7 + 14, 0, 1, Easing.linear);
  const parallelFilled = Math.max(0, Math.min(period / 3, f - (b7 + 20) + 1));
  const strip = {
    titleIn: lerp(f, b5 + 2, b5 + 14, 0, 1),
    mode: f >= b7 + 6 ? ('parallel' as const) : ('serial' as const),
    // filled(i): 0 empty, 1 filled; pop(i): 0..1 pop-in highlight
    slot: (i: number) => {
      if (f < b7 + 6) {
        const filled = i < browser.captured ? 1 : 0;
        const pop = filled ? interpolate(f, [b5 + i, b5 + i + 3], [1, 0], clamp) : 0;
        const consumed = i < encode * period ? 1 : 0;
        return {filled, pop, consumed};
      }
      const col = i % (period / 3);
      const filledPar = col < parallelFilled ? 1 : 0;
      const pop = filledPar ? interpolate(f, [b7 + 20 + col, b7 + 23 + col], [1, 0], clamp) : 0;
      // during clear: old tiles fade
      return {filled: clear < 1 ? 0.35 * (1 - clear) : filledPar, pop, consumed: 0};
    },
    laneLabel: lerp(f, b7 + 4, b7 + 16, 0, 1),
    dim: f >= s('b8-check') ? 0.4 : 1,
  };

  const ffmpeg = {
    in: lerp(f, b6, b6 + 14, 0, 1),
    progress: encode,
    dim: f >= b7 ? 0.45 : 1,
  };

  // statement bar
  const statementIn = lerp(f, active.startFrame, active.startFrame + 10, 0, 1);

  return {f, active, statementIn, d, values, camera, upper, chip, fn, values4, scene, browser, strip, ffmpeg};
};
