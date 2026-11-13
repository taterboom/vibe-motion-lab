import {Key, blinkOpen, clamp, drift, ease, lerp, prog, pulse, settle, track} from './anim';
import type {ArmState, MouthShape, PoseState, Pt} from './Puppet';
import {askNods} from './script';
import type {Segment, SegmentKind} from './types';

/** 全片的「表演」：给定时间 t（秒），算出镜头、两个人的姿态、卡片和头顶符号。纯函数，可乱序逐帧求值。
 *  阶段表见 PLAN.md；这里的时间都写成「段起点 + 偏移」 */

export type Anchors = Record<SegmentKind, number> & {end: number};

export const anchorsOf = (segments: Segment[]): Anchors => {
  const a = {} as Anchors;
  for (const s of segments) if (a[s.kind] === undefined) a[s.kind] = s.start;
  const last = segments[segments.length - 1];
  a.end = last ? last.start + last.dur : 0;
  return a;
};

export const BUCHO = {x: 290, y: 720, scale: 1.2};
export const YOU = {x: 722, y: 720, scale: 1.2};

/** 碰杯接触点（世界坐标）和杯子倾角 */
const CLINK: Pt = [506, 318];
const CLINK_TILT = 9;
export const clinkAt = (A: Anchors) => A.react + 1.55;

export type Cam = {cx: number; cy: number; z: number};
export type Emote = {kind: 'bang' | 'dots' | 'q' | 'sparkle' | 'splash'; x: number; y: number; k: number; age: number};
export type Show = {cam: Cam; bucho: PoseState; you: PoseState; card: number; emotes: Emote[]};

const S = BUCHO.scale;

/** 世界坐标 → 人物局部坐标（考虑人物的平移、前倾、缩放） */
const toLocal = (who: typeof BUCHO, lean: number, sx: number, sy: number, bob: number, w: Pt): Pt => {
  const dx = w[0] - who.x;
  const dy = w[1] - (who.y + bob);
  const r = (-lean * Math.PI) / 180;
  const rx = dx * Math.cos(r) - dy * Math.sin(r);
  const ry = dx * Math.sin(r) + dy * Math.cos(r);
  return [rx / (who.scale * sx), ry / (who.scale * sy)];
};

/** 手要放在哪，杯子边缘才正好落在接触点上 */
const clinkHand = (who: typeof BUCHO, side: -1 | 1, lean: number, sx: number, sy: number, bob: number): Pt => {
  const tilt = side * CLINK_TILT;
  const corner: Pt = [side * 32, -96]; // 杯口靠对方那一角（杯子局部）
  const r = (tilt * Math.PI) / 180;
  const cx = corner[0] * Math.cos(r) - corner[1] * Math.sin(r);
  const cy = corner[0] * Math.sin(r) + corner[1] * Math.cos(r);
  // 杯子画在人物局部坐标里，先求接触点的局部坐标，再减去杯角偏移
  const c = toLocal(who, lean, sx, sy, bob, [CLINK[0] - side * 1.5, CLINK[1]]);
  return [c[0] - cx, c[1] - cy];
};

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
/** 沿弧线插值：中点抬高 lift */
const arcPt = (a: Pt, b: Pt, k: number, lift: number): Pt => {
  const p = lerpPt(a, b, k);
  return [p[0], p[1] - Math.sin(k * Math.PI) * lift];
};

// ───────────────────────── 镜头 ─────────────────────────

const camKeys = (A: Anchors) => {
  const strip = {cx: 506, cy: 489, z: 1.11};
  const stripYou = {cx: 560, cy: 476, z: 1.17};
  const buchoMed = {cx: 420, cy: 380, z: 1.2};
  const youMed = {cx: 640, cy: 360, z: 1.34};
  const youFace = {cx: 700, cy: 345};
  const k = (key: keyof Cam) => {
    const keys: Key[] = [
      [0, key === 'cx' ? 506 : key === 'cy' ? 410 : 1.0],
      [A.ask + 0.9, key === 'cx' ? 506 : key === 'cy' ? 405 : 1.04, ease.soft],
      [A.ask + 1.55, buchoMed[key], ease.over],
      [A.ask + 2.62, key === 'z' ? buchoMed.z + 0.02 : buchoMed[key], ease.linear],
      [A.ask + 3.0, youMed[key], ease.over],
      [A.host, key === 'z' ? 1.42 : youMed[key], ease.soft],
      [A.host + 0.6, strip[key], ease.inOut],
      // 教学段：示范时慢慢靠向正在说的「你」，跟读时回到两人居中（两人都面向观众）
      [A.play1, strip[key], ease.linear],
      [A.gap + 0.5, stripYou[key], ease.soft],
      [A.play2 + 2.4, key === 'cx' ? 572 : key === 'z' ? 1.19 : stripYou[key], ease.linear],
      [A.shadow + 0.6, strip[key], ease.inOut],
      [A.ask2 + 0.05, strip[key], ease.linear],
      [A.ask2 + 0.7, buchoMed[key], ease.over],
      [A.countdown, key === 'z' ? buchoMed.z + 0.03 : buchoMed[key], ease.linear],
      [A.countdown + 0.38, key === 'z' ? 1.45 : youFace[key], ease.out],
      [A.countdown + 1.0, key === 'z' ? 1.45 : youFace[key], ease.linear],
      [A.countdown + 1.2, key === 'z' ? 1.6 : youFace[key], ease.out],
      [A.countdown + 2.0, key === 'z' ? 1.6 : youFace[key], ease.linear],
      [A.countdown + 2.2, key === 'z' ? 1.76 : youFace[key], ease.out],
      [A.answer, key === 'z' ? 1.77 : youFace[key], ease.linear],
      [A.answer + 0.5, key === 'cx' ? 570 : key === 'cy' ? 385 : 1.22, ease.outOver],
      [A.react, key === 'cx' ? 562 : key === 'cy' ? 386 : 1.2, ease.soft],
      [A.react + 0.35, key === 'cx' ? 506 : key === 'cy' ? 385 : 1.18, ease.inOut],
      [A.react + 1.75, key === 'cx' ? 506 : key === 'cy' ? 385 : 1.18, ease.linear],
      [A.react + 2.6, key === 'cx' ? 470 : key === 'cy' ? 378 : 1.27, ease.inOut],
      [A.tail, key === 'cx' ? 468 : key === 'cy' ? 378 : 1.28, ease.linear],
      [A.end, key === 'cx' ? 506 : key === 'cy' ? 400 : 1.04, ease.out],
    ];
    return keys;
  };
  return k;
};

const cameraAt = (t: number, A: Anchors): Cam => {
  const k = camKeys(A);
  // 教学段机位要稳，漂移只留一点；其他段稍大，像手持
  const calm = t > A.host + 0.6 && t < A.ask2 ? 0.4 : 1;
  const punch = 0.025 * Math.max(0, pulse(t, clinkAt(A), 0.04, 0.16, 0.3));
  return {
    cx: track(t, k('cx')) + drift(t, 1) * 2.2 * calm,
    cy: track(t, k('cy')) + drift(t, 2) * 1.6 * calm,
    z: track(t, k('z')) + drift(t, 3) * 0.003 * calm + punch,
  };
};

// ───────────────────────── 「你」的目标句表演（play1 / play2 / answer 共用） ─────────────────────────

type Act = {sy: number; lean: number; tilt: number; nod: number; wide: number; brow: number; happy: number; blush: number; chest: number; shape: MouthShape; sparkle: number};

const targetAct = (tc: number, amt: number): Act => {
  const none: Act = {sy: 0, lean: 0, tilt: 0, nod: 0, wide: 0, brow: 0, happy: 0, blush: 0, chest: 0, shape: 'smile', sparkle: -1};
  if (tc < -0.2 || tc > 3.2) return none;
  // 「え、」小 take：吸气下沉 → 拉伸 → 回
  const sy = track(tc, [[-0.05, 0], [0.08, -0.018, ease.out], [0.18, 0.04, ease.out], [0.45, -0.006, ease.inOut], [0.7, 0, ease.inOut]]);
  const wide = track(tc, [[0.06, 0], [0.16, 0.9, ease.out], [0.6, 0.35, ease.inOut], [1.4, 0.15], [1.6, 0]]);
  const brow = track(tc, [[0.06, 0], [0.16, 1, ease.out], [0.7, 0.35], [1.12, 0.35], [1.24, 0.9, ease.out], [1.5, 0.3], [2.0, 0]]);
  // 「本当ですか？」歪头、前探、手到胸前；「うれしいです」鞠躬 + 点头
  const tilt = track(tc, [[0.5, 0], [0.78, -7, ease.over], [1.42, -6], [1.62, 0, ease.inOut]]);
  const lean = track(tc, [[0.5, 0], [0.8, -3, ease.out], [1.58, -3], [1.82, -10, ease.out], [2.12, -10], [2.42, -1.5, ease.over], [2.7, -1.5]]) + settle(tc, 2.42, -1.2, 2.5, 6);
  const nod = pulse(tc, 1.66, 0.09, 0.2) * 0.9 + pulse(tc, 2.02, 0.08, 0.2) * 0.6;
  const chest = track(tc, [[0.55, 0], [0.85, 1, ease.over], [2.3, 1], [2.7, 0, ease.inOut]]);
  const happy = tc > 1.56 && tc < 2.9 ? 1 : 0;
  const blush = track(tc, [[1.5, 0], [1.9, 0.7, ease.out], [3.0, 0.5]]);
  const shape: MouthShape = tc < 0.45 ? 'o' : tc < 1.5 ? 'neutral' : 'grin';
  const sparkle = tc > 1.62 && tc < 2.7 ? (tc - 1.62) / 1.08 : -1;
  return {sy: sy * amt, lean: lean * amt, tilt: tilt * amt, nod: nod * amt, wide: wide * amt, brow: brow * amt, happy, blush: blush * amt, chest, shape, sparkle};
};

// ───────────────────────── 部长 ─────────────────────────

const buchoBody = (t: number, A: Anchors) => {
  const turn = track(t, [
    [A.ask, 0.12], [A.ask + 0.05, 0.12], [A.ask + 0.18, -0.12, ease.out], [A.ask + 0.42, 1.1, ease.inOut], [A.ask + 0.62, 1, ease.inOut],
    [A.shadow + 0.2, 1], [A.shadow + 0.55, 0.05, ease.over], [A.ask2, 0.05],
    [A.ask2 + 0.12, -0.12, ease.out], [A.ask2 + 0.36, 1.1, ease.inOut], [A.ask2 + 0.56, 1, ease.inOut],
  ]);
  const lean = track(t, [
    [A.ask + 0.15, 0], [A.ask + 0.65, 4, ease.out], [A.wait + 0.1, 4], [A.wait + 0.75, 9, ease.over], [A.host + 0.2, 9],
    [A.host + 0.9, 3, ease.inOut], [A.shadow + 0.2, 3], [A.shadow + 0.6, 1, ease.inOut], [A.ask2 + 0.1, 1], [A.ask2 + 0.6, 5, ease.out],
    [A.countdown, 5], [A.countdown + 0.6, 7, ease.inOut], [A.answer + 1.6, 7], [A.answer + 2.0, 1, ease.out],
    [A.react + 0.95, 1], [A.react + 1.5, 7, ease.inOut], [A.react + 1.75, 5, ease.out], [A.react + 2.05, 9, ease.inOut],
  ]);
  return {turn, lean};
};

const buchoNods = (t: number, A: Anchors) => {
  let n = 0;
  for (const b of askNods) n += pulse(t, A.ask + b, 0.08, 0.2) * (b === 1.8 ? 1 : 0.7);
  for (const b of askNods) n += pulse(t, A.ask2 + b, 0.08, 0.2) * (b === 1.8 ? 1 : 0.7);
  n += pulse(t, A.wait + 1.0, 0.1, 0.25) * 0.8;
  for (const p of [A.play1, A.play2]) n += pulse(t, p + 1.7, 0.1, 0.25) * 0.8;
  n += pulse(t, A.answer + 1.75, 0.1, 0.25);
  n += pulse(t, A.react + 1.0, 0.08, 0.18) * 0.8 + pulse(t, A.react + 1.27, 0.08, 0.18) * 0.6;
  // 跟读时部长跟着节拍点头，像在听你说
  for (const b of [0.6, 1.7]) n += pulse(t, A.shadow + b, 0.1, 0.25) * 0.6;
  return n;
};

/** 部长杯子手的位置（局部坐标）：随动作抬起、碰杯 */
const buchoMugHand = (t: number, A: Anchors, lean: number, bob: number, sy: number): Pt => {
  const rest: Pt = [104, -70];
  const lift: Pt = [150, -150];
  const lift2: Pt = [156, -168];
  const tc = clinkAt(A);
  if (t < A.react + 0.8) {
    const y = track(t, [
      [A.ask + 0.1, rest[1]], [A.ask + 0.5, lift[1], ease.over], [A.ask + 1.4, rest[1] - 6, ease.inOut],
      [A.ask2 + 0.12, rest[1]], [A.ask2 + 0.55, lift2[1], ease.over], [A.ask2 + 1.6, rest[1] - 6, ease.inOut],
      [A.beforeReact, rest[1] - 6], [A.react + 0.2, rest[1] + 4, ease.inOut],
    ]);
    const x = track(t, [[A.ask + 0.1, rest[0]], [A.ask + 0.5, lift[0], ease.over], [A.ask + 1.4, rest[0]], [A.ask2 + 0.12, rest[0]], [A.ask2 + 0.55, lift2[0], ease.over], [A.ask2 + 1.6, rest[0]]]);
    return [x, y];
  }
  const dip: Pt = [110, -58];
  const contact = clinkHand(BUCHO, 1, lean, 1, sy, bob);
  const start: Pt = [rest[0], rest[1] + 4];
  if (t < A.react + 1.0) return lerpPt(start, dip, ease.inOut(prog(t, A.react + 0.8, A.react + 1.0)));
  // 举杯：沿弧线加速冲向接触点（末端不减速到 0，才有「碰」的力度）
  if (t < tc) return arcPt(dip, contact, Easing2(prog(t, A.react + 1.0, tc)), 18);
  // 接触后弹开 6px 再回稳，然后放回胸前
  const back = -7 * Math.max(0, pulse(t, tc, 0.05, 0.16, 0.25));
  const hold: Pt = [contact[0] + back, contact[1] - 2];
  if (t < tc + 0.35) return hold;
  return arcPt(hold, rest, ease.inOut(prog(t, tc + 0.35, tc + 0.85)), -6);
};

/** 末端保留速度的缓入：用于冲向接触点 */
const Easing2 = (x: number) => -0.6 * x * x * x + 1.6 * x * x; // 起步速度 0，末端速度为平均速度的 1.4 倍

/** 部长空着的左手：「いやいや」摆手 */
const buchoFreeHand = (t: number, A: Anchors): ArmState => {
  const rest: Pt = [-92, -14];
  const r0 = A.react;
  const up = track(t, [[r0 - 0.15, 0], [r0 + 0.12, 1, ease.out], [r0 + 0.78, 1], [r0 + 1.1, 0, ease.inOut]]);
  const wave = t > r0 - 0.05 && t < r0 + 0.95 ? Math.sin((t - r0 - 0.02) * Math.PI * 2 * 3.4) * track(t, [[r0, 0.3], [r0 + 0.15, 1], [r0 + 0.6, 1], [r0 + 0.9, 0]]) : 0;
  const wavePos: Pt = [-50 + wave * 26, -250 + Math.abs(wave) * 4]; // 胸前摆手，不挡脸
  const hand = lerpPt(rest, wavePos, up);
  return {hand, palm: up, palmRot: wave * 16 - 8};
};

export const buchoAt = (t: number, A: Anchors, mouth: number, talking: boolean): PoseState => {
  const {turn, lean} = buchoBody(t, A);
  const breath = Math.sin((t / 3.4) * Math.PI * 2);
  const inhale = track(t, [[A.beforeReact - 0.05, 0], [A.beforeReact + 0.25, 1, ease.out], [A.react + 0.15, 0, ease.inOut]]);
  // 「いやいや」时笑得身子一颤一颤
  const laugh = t > A.react && t < A.react + 0.8 ? Math.abs(Math.sin((t - A.react) * Math.PI * 2 * 3.4)) * track(t, [[A.react, 0], [A.react + 0.1, 1], [A.react + 0.8, 0]]) : 0;
  const sy = 1 + 0.012 * breath + 0.022 * inhale - 0.012 * laugh;
  const bob = laugh * 3;
  const nod = buchoNods(t, A);
  const shake = t > A.react && t < A.react + 0.85 ? Math.sin((t - A.react) * Math.PI * 2 * 3.4 + 1) * 3.5 * track(t, [[A.react, 0], [A.react + 0.15, 1], [A.react + 0.85, 0]]) : 0;
  const tilt = track(t, [
    [A.wait + 0.2, 0], [A.wait + 0.8, 5, ease.over], [A.host + 0.8, 5], [A.host + 1.3, 1],
    [A.shadow + 0.3, 1], [A.shadow + 0.8, -6, ease.over], [A.ask2, -6], [A.ask2 + 0.4, 0],
    [A.react + 1.8, 0], [A.react + 2.2, 8, ease.over],
  ]) + shake - inhale * 2;
  const happyWin = (t > A.answer + 1.9 && t < A.react + 1.8) || t > A.tail + 0.1 || (t > A.play1 + 1.75 && t < A.play1 + 2.6) || (t > A.play2 + 1.75 && t < A.play2 + 2.6);
  const browRaise =
    track(t, [[A.ask + 1.7, 0], [A.ask + 1.85, 0.8, ease.out], [A.ask + 2.4, 0.2], [A.wait + 0.3, 0.2], [A.wait + 0.8, 0.5], [A.host + 0.6, 0.1]]) +
    track(t, [[A.ask2 + 1.7, 0], [A.ask2 + 1.85, 0.7, ease.out], [A.ask2 + 2.4, 0.1]]) +
    track(t, [[A.answer + 0.1, 0], [A.answer + 0.2, 0.7, ease.out], [A.answer + 0.9, 0]]) +
    track(t, [[A.react + 1.8, 0], [A.react + 2.0, 1, ease.out], [A.end, 0.8]]);
  const lookX = track(t, [[A.shadow + 0.15, 0.7], [A.shadow + 0.3, 0, ease.out], [A.ask2 + 0.1, 0], [A.ask2 + 0.2, 0.7, ease.out]]);
  const blink = blinkOpen(t, 1, [A.ask + 0.22, A.ask2 + 0.22, A.shadow + 0.3, A.react + 1.6]);
  const mugHand = buchoMugHand(t, A, lean, bob, sy);
  // 泡沫与杯身：跟手的速度滞后
  const v = (tt: number) => {
    const p = buchoMugHand(tt, A, buchoBody(tt, A).lean, 0, 1);
    const q = buchoMugHand(tt - 0.04, A, buchoBody(tt - 0.04, A).lean, 0, 1);
    return [(p[0] - q[0]) / 0.04, (p[1] - q[1]) / 0.04];
  };
  const [vx] = v(t - 0.06);
  const tc = clinkAt(A);
  const slosh = clamp(-vx / 260, -1.4, 1.4) + settle(t, tc, -1.3, 3.2, 5);
  const mugTilt = track(t, [[A.react + 1.0, 0], [tc - 0.05, CLINK_TILT, ease.inOut], [tc + 0.35, CLINK_TILT], [tc + 0.8, 0, ease.inOut]]) + clamp(vx / 90, -6, 6) * 0.5;
  const shape: MouthShape = happyWin || t > A.react ? 'grin' : 'smile';
  return {
    turn, sx: 1 / Math.sqrt(sy), sy, lean, bob,
    head: {tilt, nod, dx: 0, dy: -inhale * 4},
    eye: {open: blink, lookX, lookY: 0, wide: 0, happy: happyWin ? 1 : 0},
    brow: {raise: browRaise, worry: 0},
    mouth: {open: talking ? mouth : 0, shape},
    blush: t > A.react ? 0.45 : 0.25,
    sweat: [],
    hairLag: 0,
    armL: buchoFreeHand(t, A),
    armR: {hand: mugHand},
    mug: {side: 1, tilt: mugTilt, slosh, level: 0.72},
  };
};

// ───────────────────────── 你（リン） ─────────────────────────

const takeT = (A: Anchors) => A.ask + 2.78;

const youBody = (t: number, A: Anchors) => {
  const turn = track(t, [
    [A.ask + 0.5, 0], [A.ask + 0.78, -1.1, ease.out], [A.ask + 0.95, -1, ease.inOut],
    [A.host + 0.4, -1], [A.host + 0.8, -0.55, ease.inOut], [A.hostPause + 0.3, -0.55], [A.hostPause + 0.6, -1, ease.over],
    [A.shadow + 0.1, -1], [A.shadow + 0.45, 0.06, ease.over], [A.shadow + 0.6, 0], [A.ask2 + 0.12, 0], [A.ask2 + 0.42, -1.08, ease.out], [A.ask2 + 0.6, -1],
    [A.countdown + 0.2, -1], [A.countdown + 0.5, -0.8, ease.inOut], [A.answer, -0.8], [A.answer + 0.12, -1, ease.out],
  ]);
  const acts = [A.play1, A.play2, A.answer].map((s, i) => targetAct(t - s, i === 2 ? 1 : 0.85));
  const act = acts.reduce((a, b) => ({...a, sy: a.sy + b.sy, lean: a.lean + b.lean, tilt: a.tilt + b.tilt, nod: a.nod + b.nod}));
  const lean =
    track(t, [
      [A.ask + 0.6, 0], [A.ask + 1.0, -2, ease.out], [A.wait + 0.6, -2], [A.wait + 1.0, 1.5, ease.inOut], [A.host + 0.3, 1.5], [A.host + 0.9, 0],
      [A.shadow + 0.1, 0], [A.shadow + 0.5, 0], [A.ask2 + 0.4, -2, ease.out], [A.countdown + 0.3, 2.5, ease.inOut],
      [A.answer, 2.5], [A.answer + 0.15, 0, ease.out],
      [A.react + 1.0, 0], [A.react + 1.5, -7, ease.inOut], [A.react + 1.75, -5, ease.out], [A.react + 2.2, -2, ease.inOut],
    ]) + act.lean;
  const tilt =
    track(t, [
      [A.host + 0.4, 0], [A.host + 0.9, 8, ease.over], [A.hostPause + 0.3, 8], [A.hostPause + 0.6, 0, ease.inOut],
      [A.shadow + 0.2, 0], [A.shadow + 0.6, 6, ease.over], [A.ask2 + 0.1, 6], [A.ask2 + 0.4, 0],
      [A.react + 2.2, 0], [A.react + 2.6, 7, ease.over],
    ]) + act.tilt;
  return {turn, lean, tilt, act, acts};
};

export const youAt = (t: number, A: Anchors, mouth: number, talking: boolean): PoseState => {
  const {turn, lean, tilt, act, acts} = youBody(t, A);
  const T0 = takeT(A);
  const breath = Math.sin((t / 3.0) * Math.PI * 2 + 1.3);
  // ① 的 take：预备下沉 → 拉伸 → 阻尼回稳
  let take = track(t, [[T0, 0], [T0 + 0.17, -0.05, ease.out], [T0 + 0.3, 0.075, ease.out]]);
  if (t >= T0 + 0.3) {
    const d = t - (T0 + 0.3);
    take = 0.075 * Math.exp(-7 * d) * Math.cos(2 * Math.PI * 2.6 * d);
  }
  // 倒计时紧张：小幅快速发抖，最后咽口水一沉
  const cd = A.countdown;
  const tremble = t > cd && t < A.answer ? Math.sin(t * 61) * 0.004 : 0;
  const gulp = pulse(t, cd + 2.85, 0.08, 0.2);
  const sy = 1 + 0.013 * breath + take + act.sy + tremble - gulp * 0.02;
  const headDy = track(t, [[T0, 0], [T0 + 0.17, 7, ease.out], [T0 + 0.3, -8, ease.out], [T0 + 0.7, 0, ease.inOut]]) + gulp * 6;
  const nod = act.nod + pulse(t, A.ask + 1.85, 0.1, 0.25) * 0.3 + gulp * 0.5;

  // 眼神
  const look = (kx: Key[]) => track(t, kx);
  const sac = ease.out;
  const lookX = look([
    [A.ask + 0.45, 0], [A.ask + 0.52, -1, sac],
    [A.wait + 0.8, -1], [A.wait + 0.86, 0.3, sac], [A.wait + 1.3, 0.3], [A.wait + 1.36, -1, sac], [A.wait + 1.65, -1], [A.wait + 1.71, 0.4, sac],
    [A.host + 0.4, 0.4], [A.host + 0.7, 0.6, ease.inOut], [A.hostPause + 0.3, 0.6], [A.hostPause + 0.4, -1, sac],
    [A.shadow + 0.1, -1], [A.shadow + 0.2, 0, sac], [A.ask2 + 0.06, 0], [A.ask2 + 0.12, -1, sac],
    [cd + 0.35, -1], [cd + 0.41, 0.6, sac], [cd + 0.75, 0.6], [cd + 0.81, -0.8, sac], [cd + 1.2, -0.8], [cd + 1.26, 0.9, sac],
    [cd + 1.6, 0.9], [cd + 1.66, -0.2, sac], [cd + 2.05, -0.2], [cd + 2.11, -1, sac], [cd + 2.45, -1], [cd + 2.51, 0.7, sac],
    [cd + 2.8, 0.7], [cd + 2.86, -1, sac],
    [A.react + 2.25, -1], [A.react + 2.4, 0.4, ease.inOut],
  ]);
  const lookY = look([
    [A.ask, 0.7], [A.ask + 0.45, 0.7], [A.ask + 0.52, 0, sac],
    [A.wait + 0.8, 0], [A.wait + 0.86, 0.8, sac], [A.wait + 1.3, 0.8], [A.wait + 1.36, 0, sac], [A.wait + 1.65, 0], [A.wait + 1.71, 0.7, sac],
    [A.host + 0.4, 0.7], [A.host + 0.7, -1, ease.inOut], [A.hostPause + 0.3, -1], [A.hostPause + 0.4, 0, sac],
    [cd + 0.35, 0], [cd + 0.41, -0.3, sac], [cd + 0.75, -0.3], [cd + 0.81, 0.6, sac], [cd + 1.2, 0.6], [cd + 1.26, 0.2, sac],
    [cd + 1.6, 0.2], [cd + 1.66, 0.9, sac], [cd + 2.05, 0.9], [cd + 2.11, 0, sac], [cd + 2.45, 0], [cd + 2.51, -0.4, sac], [cd + 2.8, -0.4], [cd + 2.86, 0, sac],
    [A.react + 2.25, 0], [A.react + 2.4, -0.9, ease.inOut],
  ]);
  const squint = track(t, [[T0, 1], [T0 + 0.17, 0.55, ease.out], [T0 + 0.3, 1, ease.out]]);
  const blink = blinkOpen(t, 2, [A.ask + 0.6, A.shadow + 0.22, A.ask2 + 0.2, A.hostPause + 0.32, cd + 1.45, A.react + 1.6]);
  const takeWide = track(t, [[T0 + 0.17, 0], [T0 + 0.3, 1.1, ease.out], [T0 + 0.9, 0.35, ease.inOut], [A.wait + 1.5, 0.15], [A.host + 0.5, 0]]);
  const wide = takeWide + acts.reduce((a, b) => a + b.wide, 0) + track(t, [[A.ask2 + 2.5, 0], [A.ask2 + 2.62, 0.4, ease.out], [A.countdown + 0.6, 0.2], [A.countdown + 1.5, 0]]);
  const happy = acts.some((a) => a.happy > 0) || (t > A.react - 0.1 && t < A.react + 1.9) || (t > A.shadow + 0.45 && t < A.ask2) ? 1 : 0;

  const worry = track(t, [[A.wait + 0.5, 0], [A.wait + 0.9, 0.7], [A.hostPause + 0.3, 0.8], [A.hostPause + 0.5, 0], [cd, 0], [cd + 0.4, 1], [A.answer, 1], [A.answer + 0.12, 0]]);
  const browRaise = track(t, [[A.ask + 1.7, 0], [A.ask + 2.2, 0.4], [T0 + 0.17, 0.2], [T0 + 0.3, 1.3, ease.out], [A.wait + 0.8, 0.4], [A.wait + 1.2, 0]])
    + acts.reduce((a, b) => a + b.brow, 0)
    + track(t, [[A.hostPause + 0.3, 0], [A.hostPause + 0.42, 1, ease.out], [A.hostPause + 0.9, 0.3], [A.play1, 0]])
    + track(t, [[A.ask2 + 2.5, 0], [A.ask2 + 2.62, 0.8, ease.out], [cd + 0.4, 0]]);

  // 嘴型（不说话时）
  const actShape = acts.find((a) => a.sparkle !== -1 || a.chest > 0)?.shape;
  let shape: MouthShape = 'smile';
  if (t < A.ask + 1.7) shape = 'neutral';
  else if (t < T0 + 0.17) shape = 'smile';
  else if (t < T0 + 0.75) shape = 'o';
  else if (t < A.hostPause + 0.35) shape = 'wavy';
  else if (t > A.shadow + 0.3 && t < A.ask2) shape = 'grin';
  else if (t > cd && t < A.answer) shape = 'wavy';
  else if (t > A.react - 0.2) shape = 'grin';
  if (actShape && talking) shape = actShape;
  else if (acts.some((a) => a.happy > 0)) shape = 'grin';

  const blush = Math.max(
    track(t, [[A.wait + 0.2, 0], [A.wait + 0.6, 1, ease.out], [A.host + 0.5, 1], [A.host + 1.5, 0.25]]),
    acts.reduce((a, b) => a + b.blush, 0),
    t > A.react - 0.1 ? 0.5 : 0,
    t > cd && t < A.answer ? 0.35 : 0,
  );
  const sweat = [prog(t, cd + 0.5, cd + 2.2), prog(t, cd + 1.5, cd + 2.95), prog(t, A.wait + 1.2, A.wait + 2.4)];

  // 头发滞后：头部角度的延迟采样差
  const angle = (tt: number) => {
    const b = youBody(tt, A);
    return b.lean + b.tilt + b.turn * 6;
  };
  const hairLag = clamp((angle(t - 0.12) - angle(t)) * 0.9, -12, 12) + settle(t, T0 + 0.32, 4, 3, 6);

  // 右手（空手）：害羞捂脸 → 托腮想 → 手按胸口 → 摊手「轮到你」→ 紧张握拳 → 托下巴
  const restR: Pt = [86, -12];
  const cheek: Pt = [96, -318];
  const chin: Pt = [34, -262];
  const chest: Pt = [36, -172];
  const offer: Pt = [92, -244];
  const keysR = (i: 0 | 1): Key[] => [
    [A.wait + 0.4, restR[i]], [A.wait + 0.75, cheek[i], ease.over], [A.host + 0.4, cheek[i]], [A.host + 0.85, chin[i], ease.inOut],
    [A.hostPause + 0.3, chin[i]], [A.hostPause + 0.7, restR[i], ease.inOut],
    [A.shadow + 0.15, restR[i]], [A.shadow + 0.55, offer[i], ease.over], [A.ask2 + 0.05, offer[i]], [A.ask2 + 0.45, restR[i], ease.inOut],
    [cd + 0.3, restR[i]], [cd + 0.7, chest[i] + (i ? -8 : 6), ease.inOut], [A.answer, chest[i] + (i ? -8 : 6)], [A.answer + 0.3, restR[i], ease.inOut],
    [A.react + 2.2, restR[i]], [A.react + 2.6, chin[i], ease.over],
  ];
  let handR: Pt = [track(t, keysR(0)), track(t, keysR(1))];
  const chestAmt = Math.max(...acts.map((a) => a.chest));
  if (chestAmt > 0) handR = lerpPt(handR, chest, chestAmt);
  if (t > cd && t < A.answer) handR = [handR[0] + Math.sin(t * 53) * 1.5, handR[1] + Math.cos(t * 47) * 1.2];
  const palm = t > A.shadow + 0.3 && t < A.ask2 + 0.2 ? 1 : 0;

  // 左手拿杯：碰杯
  const restL: Pt = [-96, -66];
  const tc = clinkAt(A);
  let handL: Pt = restL;
  if (t > A.react + 1.02) {
    const contact = clinkHand(YOU, -1, lean, 1 / Math.sqrt(sy), sy, 0);
    if (t < tc) handL = arcPt(restL, contact, Easing2(prog(t, A.react + 1.02, tc)), 16);
    else {
      const back = 7 * Math.max(0, pulse(t, tc, 0.05, 0.16, 0.25));
      const hold: Pt = [contact[0] + back, contact[1] - 2];
      handL = t < tc + 0.4 ? hold : arcPt(hold, restL, ease.inOut(prog(t, tc + 0.4, tc + 0.9)), -6);
    }
  }
  const mugTilt = track(t, [[A.react + 1.02, 0], [tc - 0.05, -CLINK_TILT, ease.inOut], [tc + 0.4, -CLINK_TILT], [tc + 0.9, 0, ease.inOut]]);
  const slosh = settle(t, tc, 1.3, 3.2, 5) + track(t, [[A.react + 1.02, 0], [A.react + 1.3, 0.8], [tc, 0.2]]);

  return {
    turn, sx: 1 / Math.sqrt(sy), sy, lean, bob: 0,
    head: {tilt, nod, dx: 0, dy: headDy},
    eye: {open: Math.min(blink, squint), lookX, lookY, wide, happy},
    brow: {raise: browRaise, worry},
    mouth: {open: talking ? mouth : 0, shape},
    blush,
    sweat,
    hairLag,
    armL: {hand: handL},
    armR: {hand: handR, palm, palmRot: -12},
    mug: {side: -1, tilt: mugTilt, slosh, level: 0.86},
  };
};

// ───────────────────────── 卡片、头顶符号 ─────────────────────────

/** 卡片位移：0 = 到位，正数 = 往下藏 */
export const cardAt = (t: number, A: Anchors) =>
  track(t, [
    [A.host + 0.17, 620], [A.host + 0.62, -16, ease.over], [A.host + 0.85, 0, ease.inOut],
    [A.ask2, 0], [A.ask2 + 0.1, -20, ease.out], [A.ask2 + 0.48, 640, ease.in],
  ]);

const emotesAt = (t: number, A: Anchors): Emote[] => {
  const out: Emote[] = [];
  const add = (kind: Emote['kind'], x: number, y: number, from: number, to: number) => {
    if (t >= from && t < to) out.push({kind, x, y, k: prog(t, from, to), age: t - from});
  };
  const T0 = takeT(A);
  add('bang', YOU.x + 150, 175, T0 + 0.28, A.wait + 1.0);
  add('dots', YOU.x + 105, 140, A.wait + 1.05, A.host + 0.35);
  add('q', YOU.x + 112, 178, A.host + 0.55, A.hostPause + 0.3);
  for (const s of [A.play1, A.play2, A.answer]) add('sparkle', YOU.x - 40, 150, s + 1.62, s + 2.7);
  add('splash', CLINK[0], CLINK[1] - 4, clinkAt(A), clinkAt(A) + 0.55);
  return out;
};

export const showAt = (t: number, A: Anchors, mouthB: number, mouthY: number, speaker: string | undefined): Show => ({
  cam: cameraAt(t, A),
  bucho: buchoAt(t, A, mouthB, speaker === 'bucho'),
  you: youAt(t, A, mouthY, speaker === 'you'),
  card: cardAt(t, A),
  emotes: emotesAt(t, A),
});
