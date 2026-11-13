/** ep001 的字幕排版与台词内部节拍。时间相对每句音频开头（秒），来自 silencedetect + 50ms RMS 包络 */

export type Tok = {t: string; r?: string};
/** 一句台词：分行的 token（带注音），以及卡拉 OK 扫亮的分块 [起字, 止字, 起秒, 止秒] */
export type Cap = {lines: Tok[][]; sweep: Array<[number, number, number, number]>; zh?: string};

export const caps: Record<string, Cap> = {
  ask: {
    lines: [
      [{t: 'リンさん、'}, {t: '日本語', r: 'にほんご'}, {t: '、'}],
      [{t: 'お'}, {t: '上手', r: 'じょうず'}, {t: 'ですね。'}],
    ],
    // リンさん、(0-5) 日本語、(5-9) お上手ですね。(9-16)
    sweep: [[0, 5, 0.02, 0.78], [5, 9, 1.07, 1.67], [9, 16, 1.74, 2.69]],
    zh: '小林，你日语说得真好啊。',
  },
  target_normal: {
    lines: [
      [{t: 'え、'}, {t: '本当', r: 'ほんとう'}, {t: 'ですか？'}],
      [{t: 'うれしいです。'}],
    ],
    // え、(0-2) 本当ですか？(2-8) うれしいです。(8-15)
    sweep: [[0, 2, 0.1, 0.4], [2, 8, 0.57, 1.34], [8, 15, 1.55, 2.2]],
    zh: '诶，真的吗？好开心。',
  },
  react: {
    lines: [
      [{t: 'いやいや、'}, {t: '本当', r: 'ほんとう'}, {t: 'に。'}],
      [{t: '日本', r: 'にほん'}, {t: 'はどれくらい？'}],
    ],
    // いやいや、(0-5) 本当に。(5-9) 日本はどれくらい？(9-18)
    sweep: [[0, 5, 0.05, 0.75], [5, 9, 0.85, 1.43], [9, 18, 1.8, 2.8]],
    zh: '不不，真的。来日本多久了？',
  },
};

/** 主持人的中文问题，分两行，按两个语块扫亮 */
export const hostCap: Cap = {
  lines: [[{t: '被日本人夸日语好，'}], [{t: '怎么回才不尴尬？'}]],
  sweep: [[0, 9, 0.0, 1.53], [9, 17, 1.83, 3.17]],
};

/** 教学卡片上把目标句拆成两块，时间与 target_normal 一致 */
export const chipCaps: Cap[] = [
  {lines: [[{t: 'え、'}, {t: '本当', r: 'ほんとう'}, {t: 'ですか？'}]], sweep: [[0, 2, 0.1, 0.4], [2, 8, 0.57, 1.34]]},
  {lines: [[{t: 'うれしいです。'}]], sweep: [[0, 7, 1.55, 2.2]]},
];

/** 反例 */
export const wrong: Tok[] = [{t: 'いいえ、'}, {t: '下手', r: 'へた'}, {t: 'です。'}];

/** 某句在 tClip 时刻扫亮到第几个字（可为小数） */
export const sweepAt = (cap: Cap, tClip: number) => {
  let v = 0;
  for (const [a, b, t0, t1] of cap.sweep) {
    if (tClip >= t1) v = b;
    else if (tClip > t0) v = a + ((b - a) * (tClip - t0)) / (t1 - t0);
  }
  return v;
};

/** 部长那句「お上手ですね」的重音点头 */
export const askNods = [1.12, 1.8, 2.22, 2.5];
