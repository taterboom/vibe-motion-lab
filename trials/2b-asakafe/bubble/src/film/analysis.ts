/** 波形分析：纯函数，只依赖音频数据本身（不依赖 remotion，方便用 node 单独验证） */

export type WaveLike = {channelWaveforms: Float32Array[]; sampleRate: number; durationInSeconds: number};

/** t 秒附近 win 秒窗口的 RMS */
export const rmsAt = (w: WaveLike, t: number, win = 1 / 15): number => {
  const ch = w.channelWaveforms[0];
  const from = Math.max(0, Math.floor((t - win / 2) * w.sampleRate));
  const to = Math.min(ch.length, Math.floor((t + win / 2) * w.sampleRate));
  if (to <= from) return 0;
  let sum = 0;
  for (let k = from; k < to; k++) sum += ch[k] * ch[k];
  return Math.sqrt(sum / (to - from));
};

/** 整句的音量包络：分 bins 格，每格 RMS，归一到 0–1 */
export const envelope = (w: WaveLike, bins: number): number[] => {
  const ch = w.channelWaveforms[0];
  const per = Math.max(1, Math.floor(ch.length / bins));
  const out: number[] = [];
  for (let b = 0; b < bins; b++) {
    let sum = 0;
    const from = b * per;
    const to = Math.min(ch.length, from + per);
    for (let k = from; k < to; k++) sum += ch[k] * ch[k];
    out.push(Math.sqrt(sum / Math.max(1, to - from)));
  }
  const peak = Math.max(1e-6, ...out);
  return out.map((v) => Math.min(1, v / peak));
};

/**
 * 有声片段：20ms 窗 RMS，低于阈值算静音；太短的有声片段并到邻居，太短的静音不算断开。
 * 返回 [start, end] 秒。
 */
export const voicedSegments = (w: WaveLike): Array<[number, number]> => {
  const ch = w.channelWaveforms[0];
  const hop = Math.floor(w.sampleRate * 0.02);
  const r: number[] = [];
  for (let i = 0; i + hop <= ch.length; i += hop) {
    let sum = 0;
    for (let k = i; k < i + hop; k++) sum += ch[k] * ch[k];
    r.push(Math.sqrt(sum / hop));
  }
  const peak = Math.max(1e-6, ...r);
  const thr = Math.max(0.008, 0.04 * peak);
  const segs: Array<[number, number]> = [];
  let start = -1;
  r.forEach((v, i) => {
    if (v >= thr && start < 0) start = i;
    if (v < thr && start >= 0) {
      segs.push([start * 0.02, i * 0.02]);
      start = -1;
    }
  });
  if (start >= 0) segs.push([start * 0.02, r.length * 0.02]);
  // 有声片段短于 60ms 的（气音、齿音）并到前一个片段
  const merged: Array<[number, number]> = [];
  for (const s of segs) {
    const last = merged[merged.length - 1];
    if (last && (s[1] - s[0] < 0.06 || s[0] - last[1] < 0.02)) last[1] = s[1];
    else merged.push([s[0], s[1]]);
  }
  return merged;
};
