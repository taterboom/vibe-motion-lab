/**
 * 文字 ↔ 音频对齐：纯函数。
 * 1. 文本切成显示单元（一个字，或一组带注音的汉字），每个单元有「拍数」权重（假名 1，汉字按注音字数）。
 * 2. 按标点切成短语；短语用 DP 对到连续的有声片段上（片段数可以多于短语数）。
 * 3. 短语内按权重把单元摊到有声时间上，静音处文字自然停住。
 */

export type Unit = {base: string; ruby?: string; w: number; punct: boolean};
export type Timed = Unit & {t0: number; t1: number};

const PUNCT = /[、。？！，．,.?!…・「」]/;
const SMALL = /[ゃゅょぁぃぅぇぉャュョァィゥェォ]/;
const KANA = /[぀-ヿ]/;
const HAN = /[一-鿿]/;

const kanaWeight = (s: string) => [...s].reduce((a, c) => a + (SMALL.test(c) ? 0.4 : 1), 0);

export const tokenize = (text: string, ruby: Record<string, string>): Unit[] => {
  const keys = Object.keys(ruby).sort((a, b) => b.length - a.length);
  const out: Unit[] = [];
  let i = 0;
  while (i < text.length) {
    const k = keys.find((key) => text.startsWith(key, i));
    if (k) {
      out.push({base: k, ruby: ruby[k], w: kanaWeight(ruby[k]), punct: false});
      i += k.length;
      continue;
    }
    const c = text[i];
    const punct = PUNCT.test(c);
    const w = punct ? 0 : KANA.test(c) ? (SMALL.test(c) ? 0.4 : 1) : HAN.test(c) ? 1 : c.trim() ? 0.5 : 0;
    out.push({base: c, w, punct});
    i += 1;
  }
  return out;
};

/** 标点结尾处切短语（连续标点跟着前一个短语） */
export const phrasesOf = (units: Unit[]): Unit[][] => {
  const out: Unit[][] = [];
  let cur: Unit[] = [];
  units.forEach((u, i) => {
    cur.push(u);
    const next = units[i + 1];
    if (u.punct && !(next && next.punct)) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
};

type Seg = [number, number];
const segDur = (s: Seg[]) => s.reduce((a, [x, y]) => a + (y - x), 0);

/** 在一串有声片段拼成的「有声时间轴」上，x 秒处对应的真实时间 */
const voicedTime = (pieces: Seg[], x: number) => {
  let left = x;
  for (const [a, b] of pieces) {
    if (left <= b - a) return a + left;
    left -= b - a;
  }
  return pieces.length ? pieces[pieces.length - 1][1] : x;
};

const spread = (phrase: Unit[], pieces: Seg[]): Timed[] => {
  const total = phrase.reduce((a, u) => a + u.w, 0) || 1;
  const D = segDur(pieces);
  let acc = 0;
  return phrase.map((u) => {
    const t0 = voicedTime(pieces, (acc / total) * D);
    acc += u.w;
    const t1 = voicedTime(pieces, (acc / total) * D);
    return {...u, t0, t1};
  });
};

export const align = (phrases: Unit[][], segs: Seg[], dur: number): Timed[][] => {
  const k = phrases.length;
  const m = segs.length;
  if (m === 0) return phrases.map((p) => spread(p, [[0, dur]]));
  if (m < k) {
    // 片段比短语少：整句摊在全部有声时间上
    const flat = spread(phrases.flat(), segs);
    let i = 0;
    return phrases.map((p) => p.map(() => flat[i++]));
  }
  const W = phrases.map((p) => p.reduce((a, u) => a + u.w, 0));
  const TW = W.reduce((a, b) => a + b, 0) || 1;
  const TD = segDur(segs) || 1;
  const prefix = [0];
  segs.forEach(([a, b]) => prefix.push(prefix[prefix.length - 1] + (b - a)));
  const runShare = (a: number, b: number) => (prefix[b + 1] - prefix[a]) / TD;
  // best[i][j]：前 i 个短语用掉前 j 个片段的最小代价
  const INF = 1e9;
  const best = Array.from({length: k + 1}, () => new Array<number>(m + 1).fill(INF));
  const from = Array.from({length: k + 1}, () => new Array<number>(m + 1).fill(-1));
  best[0][0] = 0;
  for (let i = 1; i <= k; i++) {
    for (let j = i; j <= m - (k - i); j++) {
      for (let s = i - 1; s < j; s++) {
        if (best[i - 1][s] >= INF) continue;
        const c = best[i - 1][s] + (W[i - 1] / TW - runShare(s, j - 1)) ** 2;
        if (c < best[i][j]) {
          best[i][j] = c;
          from[i][j] = s;
        }
      }
    }
  }
  const runs: Array<[number, number]> = [];
  let j = m;
  for (let i = k; i >= 1; i--) {
    const s = from[i][j];
    runs.unshift([s, j - 1]);
    j = s;
  }
  return phrases.map((p, i) => spread(p, segs.slice(runs[i][0], runs[i][1] + 1)));
};
