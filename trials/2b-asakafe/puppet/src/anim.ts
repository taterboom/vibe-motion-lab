import {Easing} from 'remotion';

/** 纯函数动画工具：一切都是 f(t)，t 为全片秒数。不累积、不读上一帧 */

export type Ease = (x: number) => number;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const prog = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));

export const ease = {
  linear: (x: number) => x,
  inOut: Easing.inOut(Easing.cubic),
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.quad),
  soft: Easing.inOut(Easing.sin),
  /** 到位时轻微过冲再回 */
  over: Easing.bezier(0.45, 0, 0.2, 1.12),
  overBig: Easing.bezier(0.34, 0, 0.18, 1.3),
  outOver: Easing.bezier(0.15, 0.6, 0.25, 1.15),
} satisfies Record<string, Ease>;

/** 关键帧轨道：[时间, 值, 进入这个关键帧用的缓动]。第一个关键帧之前取首值，最后之后取尾值 */
export type Key = [number, number, Ease?];
export const track = (t: number, keys: Key[]): number => {
  if (keys.length === 0) return 0;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t < t1) {
      const [t0, v0] = keys[i - 1];
      return lerp(v0, v1, (e ?? ease.inOut)(prog(t, t0, t1)));
    }
  }
  return keys[keys.length - 1][1];
};

/** 一次「下去再回来」的脉冲：up 秒到 1，down 秒回 0，回的时候带一点反向回弹 */
export const pulse = (t: number, t0: number, up = 0.08, down = 0.22, rebound = 0.18) =>
  track(t, [
    [t0, 0],
    [t0 + up, 1, ease.out],
    [t0 + up + down, -rebound, ease.inOut],
    [t0 + up + down * 1.7, 0, ease.inOut],
  ]);

/** 阻尼振荡（回稳用），t0 之前为 0 */
export const settle = (t: number, t0: number, amp: number, freq = 3, decay = 7) => {
  if (t < t0) return 0;
  const d = t - t0;
  return amp * Math.exp(-decay * d) * Math.sin(2 * Math.PI * freq * d);
};

/** 确定性的伪随机（按种子） */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 平滑噪声：几个不同频率的正弦叠加，用于呼吸以外的小漂移 */
export const drift = (t: number, seed: number) =>
  Math.sin(t * 0.9 + seed) * 0.6 + Math.sin(t * 2.3 + seed * 1.7) * 0.3 + Math.sin(t * 5.1 + seed * 3.1) * 0.1;

/** 眨眼：返回眼睛张开度 0–1。周期性 + 指定时刻的补眨（如转头时） */
export const blinkOpen = (t: number, seed: number, extra: number[] = []) => {
  const period = 2.9 + seed * 0.7;
  const phase = ((t + seed * 1.3) % period + period) % period;
  const shape = (d: number) => (d < 0 || d > 0.16 ? 1 : d < 0.05 ? 1 - d / 0.05 : d < 0.08 ? 0 : (d - 0.08) / 0.08);
  let v = shape(phase - (period - 0.2));
  for (const e of extra) v = Math.min(v, shape(t - e));
  return v;
};
