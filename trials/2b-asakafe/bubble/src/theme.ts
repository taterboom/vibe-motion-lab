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
  // 气泡版追加：居酒屋夜色（暖帘的藍、灯笼的朱、啤酒的琥珀）
  paper: '#FFFBF2',
  indigo: '#26314A',
  indigoSoft: '#46557A',
  amber: '#E2A13B',
  field: '#F1E6CF',
  line: '#E4D6B8',
  pattern: '#EADDC2',
  onAccent: '#FFFFFF',
};

// 渲染用本机 Chrome，macOS 系统字体可直接用；其他机器回落到 Noto。
export const font = {
  ja: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
  zh: '"Hiragino Sans GB", "PingFang SC", "Noto Sans SC", "Microsoft YaHei UI", sans-serif',
};

export const PAD = 72;

/** 固定槽位：所有段落的文字都锚在这些位置，切换时不跳 */
export const slot = {
  brand: 120,      // 栏目名
  phase: 200,      // ①②③ + 环节名
  mainTop: 1120,   // 主文字区（主句 + 释义）垂直居中于此区
  mainHeight: 430,
  cue: 1570,       // 跟读提示
  hook: 1650,      // 一行字
  foot: 1790,      // 标题
};

/** 场景画面：栏目名与主文字区之间的一块圆角画框，人物和背景画在里面 */
export const stage = {left: 36, top: 280, width: 1008, height: 800};

/** 中日文折行：任意字间可断，标点不上行首，两行尽量等长 */
export const cjkWrap = {wordBreak: 'normal', lineBreak: 'strict', textWrap: 'balance'} as const;
