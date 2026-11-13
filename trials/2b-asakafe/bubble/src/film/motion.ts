import {Easing, interpolate} from 'remotion';

/** 所有 interpolate 两端都 clamp（HARD_RULES §3） */
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Ease = (t: number) => number;
export const ease = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  outQuad: Easing.out(Easing.quad),
  linear: (t: number) => t,
};

/**
 * 阶段表求值：关键帧 [帧, 值]，每两帧之间一条缓动。
 * 过冲和回稳都写成显式关键帧（不用 spring），这样每一帧都是 frame 的纯函数。
 */
export const keys = (f: number, ks: Array<[number, number]>, eases: Ease | Ease[] = ease.inOut): number => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [f0, v0] = ks[i];
    const [f1, v1] = ks[i + 1];
    if (f < f1) {
      const e = Array.isArray(eases) ? eases[Math.min(i, eases.length - 1)] : eases;
      return interpolate(f, [f0, f1], [v0, v1], {...clamp, easing: e});
    }
  }
  return ks[ks.length - 1][1];
};

export const ramp = (f: number, from: number, to: number, e: Ease = ease.inOut) =>
  interpolate(f, [from, Math.max(from + 0.001, to)], [0, 1], {...clamp, easing: e});

/* ── 消息入场 / 退场的阶段表（帧数相对出现时刻） ── */

/** 堆叠占位：预备下沉 → 推上去 → 过冲 → 回稳 */
export const stackIn = (f: number) =>
  keys(f, [[-3, 0], [0, -0.04], [7, 1.05], [12, 0.985], [17, 1]], [ease.inOut, ease.out, ease.inOut, ease.inOut]);

/** 气泡本体：从尾巴角弹出，过冲后回稳 */
export const popScale = (f: number) => keys(f, [[0, 0.5], [6, 1.06], [10, 0.98], [15, 1]], [ease.out, ease.inOut, ease.inOut]);

export const fadeIn = (f: number, d = 4) => ramp(f, 0, d, ease.linear);

/** 退场：先缩、后收起占位 */
export const exitScale = (f: number) => keys(f, [[0, 1], [2, 1.04], [7, 0.6]], [ease.out, ease.in]);
export const exitCollapse = (f: number) => keys(f, [[0, 0], [9, 1]], ease.inOut);

/** 章、数字一类的小件弹出 */
export const stampScale = (f: number) => keys(f, [[0, 0.4], [5, 1.14], [9, 0.96], [13, 1]], [ease.out, ease.inOut, ease.inOut]);
