/** 本集画面上的文案（台词本身从 _episode.json 读；这里只放气泡版需要的额外文字） */

/** 注音词表：最长匹配，只用于日文台词 */
export const ruby: Record<string, string> = {
  日本語: 'にほんご',
  上手: 'じょうず',
  本当: 'ほんとう',
  日本: 'にほん',
  下手: 'へた',
};

export const copy = {
  headerTitle: '欢迎会 · 邻座的部长',
  event: {time: '今晚 19:30', title: '新人欢迎会', sub: '居酒屋 · 你坐在部长旁边'},
  names: {bucho: '部长', you: '我（リン）', host: '主持人'} as Record<string, string>,
  avatars: {bucho: '部', you: '我'} as Record<string, string>,
  ghost: {text: 'いいえ、下手です。', zh: '不，我说得很差。', label: '✕ 别这样回'},
  targetLabel: '✓ 这样回',
  answerLabel: '参考答案',
  hiddenNote: '只听，不看字',
  steps: ['① 被夸', '② 怎么回', '③ 你来答'],
  divider: '③ 再来一遍 · 这次你来回',
  coach: {
    ask: '公司欢迎会，邻座的部长夸你',
    wait: '你会怎么回？',
    ask2: '这次不看字，只听',
    countdown: '用刚学的那句，回部长',
    answer: '参考答案：先惊喜，再说开心',
    react: '不否认，话题就自然接下去了',
  },
  dock: {
    placeholder: '回复部长…',
    listen: '听两遍',
    listenAgain: '再听一遍',
    shadow: '轮到你说',
    shadowSub: '跟着读一遍',
    ask2: '只听，不看字',
    countdown: '轮到你回',
    countdownSub: '说出声！',
  },
};
