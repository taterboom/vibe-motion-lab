import type {Timed} from './align';

/** 画面网格：所有区块锚在这里，整片不变 */
export const grid = {
  side: 44,           // 对话流左右边距
  header: 236,        // 门帘头底边
  stepTop: 256,
  stepH: 70,
  chatTop: 346,
  chatBottom: 1446,   // 新消息从这里长出来
  coachTop: 1462,
  coachH: 100,
  dockTop: 1588,
  dockH: 232,
  fade: 96,           // 对话流顶部渐隐高度
  gap: 30,            // 消息之间
};

/** 字号表：所有文字从这里取 */
export const type = {
  ja: 72,        // 气泡日文
  ruby: 30,      // 注音
  zh: 38,        // 气泡里的中文释义
  host: 54,      // 主持人卡片
  coach: 44,     // 提示行
  label: 30,     // 头像行名字
  title: 50,     // 门帘标题
  dock: 48,      // 输入框
  small: 28,
};

export const bubble = {
  padX: 40,
  padY: 30,
  maxInner: 864,      // 12 个全角日文字
  rubyH: 36,          // 注音占的高度
  jaLine: 1.25,
  zhLine: 1.4,
  glossGap: 12,
  labelH: 62,         // 头像行
  labelGap: 12,
  radius: 44,
  tail: 12,           // 尾巴角的小圆角
};

/** 全角文字的宽度就是字号，注音组取「汉字宽」和「注音宽」的较大者 */
export const unitWidth = (u: Timed, size: number, rubySize: number) =>
  Math.max([...u.base].length * size, u.ruby ? [...u.ruby].length * rubySize : 0);

/** 按短语折行：短语不拆，一行放不下就换行；单个短语比一行还宽时按字拆（标点不上行首） */
export const wrap = (phrases: Timed[][], maxW: number, size: number, rubySize: number): Timed[][] => {
  const rows: Timed[][] = [];
  let row: Timed[] = [];
  let w = 0;
  const widthOf = (us: Timed[]) => us.reduce((a, u) => a + unitWidth(u, size, rubySize), 0);
  for (const p of phrases) {
    const pw = widthOf(p);
    if (w + pw <= maxW) {
      row.push(...p);
      w += pw;
      continue;
    }
    if (row.length) {
      rows.push(row);
      row = [];
      w = 0;
    }
    if (pw <= maxW) {
      row.push(...p);
      w = pw;
      continue;
    }
    for (const u of p) {
      const uw = unitWidth(u, size, rubySize);
      if (w + uw > maxW && !u.punct && row.length) {
        rows.push(row);
        row = [];
        w = 0;
      }
      row.push(u);
      w += uw;
    }
  }
  if (row.length) rows.push(row);
  return rows;
};

export const rowWidth = (row: Timed[], size: number, rubySize: number) => row.reduce((a, u) => a + unitWidth(u, size, rubySize), 0);

/** 中文释义：逐字等宽，按字数折行（标点不上行首） */
export const wrapPlain = (text: string, maxW: number, size: number): string[] => {
  const per = Math.max(1, Math.floor(maxW / size));
  const chars = [...text];
  const lines: string[] = [];
  let cur = '';
  for (const c of chars) {
    if ([...cur].length >= per && !/[，。？！、]/.test(c)) {
      lines.push(cur);
      cur = '';
    }
    cur += c;
  }
  if (cur) lines.push(cur);
  return lines;
};
