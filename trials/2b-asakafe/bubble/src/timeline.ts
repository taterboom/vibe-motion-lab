import type {Clips, Gaps, Segment} from './types';

export const defaultGaps: Gaps = {
  afterAsk: 2, hostPlaceholder: 3, afterHost: 1, betweenPlays: 1, shadow: 2.5, countdown: 3, beforeReact: 0.3, tail: 0.6,
};

/** 三段结构（PROPOSAL 第 3 节）落到时间线：纯函数，画面和音频都按它走 */
export const buildTimeline = (clips: Clips, gaps: Gaps): Segment[] => {
  const c = clips.clips;
  const need = (tag: string) => {
    if (!c[tag]) throw new Error(`missing clip: ${tag}`);
    return c[tag];
  };
  const reacts = Object.keys(c).filter((t) => /^react\d*$/.test(t)).sort();
  const seq: Array<Omit<Segment, 'start'>> = [
    {kind: 'ask', label: '① 被问', dur: need('ask').dur, audio: 'ask'},
    {kind: 'wait', label: '留白', dur: gaps.afterAsk},
    c.q ? {kind: 'host', label: '② 主角提问', dur: c.q.dur, audio: 'q'} : {kind: 'host', label: '② 主角提问（占位）', dur: gaps.hostPlaceholder},
    {kind: 'hostPause', label: '留白', dur: gaps.afterHost},
    {kind: 'play1', label: '② 第一遍', dur: need('target_normal').dur, audio: 'target_normal'},
    {kind: 'gap', label: '留白', dur: gaps.betweenPlays},
    {kind: 'play2', label: '② 第二遍', dur: need('target_normal').dur, audio: 'target_normal'},
    {kind: 'shadow', label: '跟读留白', dur: gaps.shadow},
    {kind: 'ask2', label: '③ 再问', dur: need('ask').dur, audio: 'ask'},
    {kind: 'countdown', label: '倒计时', dur: gaps.countdown},
    {kind: 'answer', label: '③ 参考答案', dur: need('target_normal').dur, audio: 'target_normal'},
    {kind: 'beforeReact', label: '留白', dur: gaps.beforeReact},
    ...reacts.map((t) => ({kind: 'react' as const, label: '③ 兑现', dur: c[t].dur, audio: t, tag: t})),
    {kind: 'tail', label: '片尾', dur: gaps.tail},
  ];
  let t = 0;
  return seq.filter((s) => s.dur > 0).map((s) => {
    const seg = {...s, start: t};
    t += s.dur;
    return seg;
  });
};

export const totalDuration = (segments: Segment[]) => segments.reduce((a, s) => a + s.dur, 0);
