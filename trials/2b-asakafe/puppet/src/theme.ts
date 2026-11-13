export const W = 1080;
export const H = 1920;
export const FPS = 30;

// 全片一种底色，段落靠顶部标签区分，避免切换时的视觉跳动
export const color = {
  bg: '#F3E9D2',
  ink: '#2B2420',
  muted: '#8A8178',
  accent: '#B5422C',
  faint: '#D9CDB4',
  paper: '#FFFCF4',
  bucho: '#A8483A',
  you: '#C7862A',
  teal: '#2F8F83',
  good: '#4E8F5A',
  bad: '#C8452F',
};

// 渲染用本机 Chrome，macOS 系统字体可直接用；其他机器回落到 Noto。
export const font = {
  ja: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
  zh: '"Hiragino Sans GB", "PingFang SC", "Noto Sans SC", "Microsoft YaHei UI", sans-serif',
};

export const PAD = 72;

/** 固定槽位：所有段落的文字都锚在这些位置，切换时不跳（y 为顶边） */
export const slot = {
  brand: 44,
  progress: 112,
  chip: 1314,
  mainTop: 1376,
  mainHeight: 268,
  zh: 1652,
  hint: 1738,
  foot: 1846,
};

/** 场景画框：栏目名下方占画面主体的圆角画框 */
export const stage = {left: 28, top: 196, width: 1024, height: 1090};
/** 世界（场景 1008×800）到画框的基础比例：z=1 时世界高度正好铺满画框 */
export const K0 = 1.3;

/** 中日文折行：任意字间可断，标点不上行首，两行尽量等长 */
export const cjkWrap = {wordBreak: 'normal', lineBreak: 'strict', textWrap: 'balance'} as const;

/** 两个 #RRGGBB 颜色按 k 混合 */
export const mix = (a: string, b: string, k: number) => {
  const p = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  const kk = Math.min(1, Math.max(0, k));
  return '#' + [0, 1, 2].map((i) => h(p(a, i) + (p(b, i) - p(a, i)) * kk)).join('');
};
