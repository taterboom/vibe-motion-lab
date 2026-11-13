import {clean, pick} from '../text';
import {font} from '../theme';
import type {Episode, Segment, SegmentKind} from '../types';
import {align, phrasesOf, tokenize, type Timed} from './align';
import {voicedSegments, type WaveLike} from './analysis';
import {copy, ruby} from './content';
import {bubble, grid, type, wrap, wrapPlain, rowWidth} from './layout';

/** 一次播放：这条消息的音频在绝对时间 at 开始 */
export type Play = {at: number; dur: number; tag: string};

/** 排好版的一段文字：行 → 单元（带对齐时间） */
export type TextBlock = {rows: Timed[][]; width: number; height: number; size: number; rubySize: number; family: string; ruby: boolean; lineH: number};

export type MsgKind = 'event' | 'them' | 'you' | 'host' | 'ghost' | 'typing' | 'divider';

export type Msg = {
  id: string;
  kind: MsgKind;
  side: 'L' | 'R' | 'C';
  at: number;               // 出现时刻（秒）
  out?: number;             // 退场时刻
  h: number;                // 占位高度（含头像行）
  w: number;                // 气泡宽度
  role?: string;            // bucho / you / host
  text?: TextBlock;
  gloss?: string[];
  plays?: Play[];
  mode?: 'reveal' | 'karaoke';
  label?: string;
  hiddenUntil?: number;     // 文字遮住，直到这个时刻揭开
  tapbackAt?: number;
  strikeAt?: number;
  keystrokes?: number[];    // 正在输入：这些时刻有人在打字
  passes?: boolean;         // 头像行显示第几遍
  frosted?: boolean;        // ③ 时被磨砂遮住的旧消息
  reserved?: boolean;       // 开场第一条：位置一开始就留好，原地弹出（0 帧画面不空）
};

export type Marks = Record<SegmentKind, Segment | undefined>;

export type Script = {
  msgs: Msg[];
  marks: Marks;
  reacts: Segment[];
  draft: {text: string; times: number[]};
  frost: {from: number; to: number};
  steps: number[];          // 三个步骤各自开始的时刻
  coach: Array<{at: number; text: string; em?: string}>;
};

const BUBBLE_INNER = bubble.maxInner;
const HOST_INNER = 1080 - grid.side * 2 - 2 * 44;

const jaBlock = (text: string, tag: string | undefined, waves: Record<string, WaveLike>, dur: number, lang: 'ja' | 'zh'): TextBlock => {
  const units = tokenize(text, lang === 'ja' ? ruby : {});
  const phrases = phrasesOf(units);
  const w = tag ? waves[tag] : undefined;
  const timed = align(phrases, w ? voicedSegments(w) : [[0, dur]], dur);
  const size = lang === 'ja' ? type.ja : type.host;
  const rubySize = type.ruby;
  const rows = wrap(timed, lang === 'ja' ? BUBBLE_INNER : HOST_INNER, size, rubySize);
  const hasRuby = lang === 'ja';
  const lineH = hasRuby ? bubble.rubyH + size * bubble.jaLine : size * 1.4;
  return {
    rows,
    width: Math.max(...rows.map((r) => rowWidth(r, size, rubySize))),
    height: rows.length * lineH,
    size,
    rubySize,
    family: lang === 'ja' ? font.ja : font.zh,
    ruby: hasRuby,
    lineH,
  };
};

const glossLines = (zh?: string) => (zh ? wrapPlain(zh, BUBBLE_INNER, type.zh) : undefined);
const glossH = (g?: string[]) => (g ? bubble.glossGap + g.length * type.zh * bubble.zhLine : 0);
const glossW = (g?: string[]) => (g ? Math.max(...g.map((l) => [...l].length * type.zh)) : 0);

const bubbleSize = (text: TextBlock, gloss?: string[], label = true) => {
  const bh = bubble.padY * 2 + text.height + glossH(gloss);
  const bw = bubble.padX * 2 + Math.max(text.width, glossW(gloss));
  return {h: bh + (label ? bubble.labelH + bubble.labelGap : 0), w: bw};
};

export const TYPING = {w: 168, h: 104};
export const EVENT_H = 500;
export const DIVIDER_H = 84;
export const HOST_PAD = 36;
export const HOST_LABEL = 58;

/** 时间线 → 对话流里的全部消息。所有时刻从 segments 推出，gaps 改了画面跟着走 */
export const buildScript = (episode: Episode, segments: Segment[], waves: Record<string, WaveLike>): Script => {
  const marks = {} as Marks;
  for (const s of segments) if (!marks[s.kind]) marks[s.kind] = s;
  const reacts = segments.filter((s) => s.kind === 'react');
  const S = (k: SegmentKind) => marks[k] ?? segments[0];
  const end = (s: Segment) => s.start + s.dur;
  const durOf = (tag: string) => waves[tag]?.durationInSeconds ?? 3;

  const askText = clean(pick(episode, 'ask')?.text ?? '');
  const targetText = clean(pick(episode, 'target_normal')?.text ?? '');
  const hostText = clean(pick(episode, 'q')?.text ?? '');

  const askBlock = jaBlock(askText, 'ask', waves, S('ask').dur, 'ja');
  const askGloss = glossLines(pick(episode, 'ask')?.zh);
  const targetBlock = jaBlock(targetText, 'target_normal', waves, S('play1').dur, 'ja');
  const targetGloss = glossLines(pick(episode, 'target_normal')?.zh);
  const hostBlock = jaBlock(hostText, 'q', waves, S('host').dur, 'zh');
  const ghostBlock = jaBlock(copy.ghost.text, undefined, waves, 1, 'ja');
  const ghostGloss = glossLines(copy.ghost.zh);

  const play = (s: Segment | undefined): Play[] => (s && s.audio ? [{at: s.start, dur: s.dur, tag: s.audio}] : []);

  const msgs: Msg[] = [];
  msgs.push({id: 'event', kind: 'event', side: 'C', at: -1, h: EVENT_H, w: 1080 - grid.side * 2});

  const ask = S('ask');
  msgs.push({id: 'ask', kind: 'them', side: 'L', role: 'bucho', at: ask.start, reserved: true, ...bubbleSize(askBlock, askGloss), text: askBlock, gloss: askGloss, plays: play(ask), mode: 'reveal'});

  // ① 留白：你在犹豫着打字（打两下停住，再打完）
  const wait = S('wait');
  const draftText = copy.ghost.text.replace(/。$/, '');
  const draftChars = [...draftText];
  const firstPart = draftChars.findIndex((c) => c === '、') + 1 || Math.ceil(draftChars.length / 2);
  const draftTimes = draftChars.map((_, i) =>
    i < firstPart ? wait.start + 0.22 + i * 0.12 : wait.start + 0.22 + firstPart * 0.12 + 0.42 + (i - firstPart) * 0.13,
  );
  const host = S('host');
  msgs.push({id: 'typing1', kind: 'typing', side: 'R', role: 'you', at: wait.start + 0.1, out: host.start, h: TYPING.h, w: TYPING.w, keystrokes: draftTimes});

  const hostH = HOST_PAD * 2 + HOST_LABEL + hostBlock.height;
  msgs.push({id: 'host', kind: 'host', side: 'C', role: 'host', at: host.start, h: hostH, w: 1080 - grid.side * 2, text: hostBlock, plays: play(host), mode: 'reveal'});

  const hp = S('hostPause');
  const p1 = S('play1');
  msgs.push({id: 'ghost', kind: 'ghost', side: 'R', role: 'you', at: hp.start, ...bubbleSize(ghostBlock, ghostGloss, false), text: ghostBlock, gloss: ghostGloss, strikeAt: hp.start + 0.22, label: copy.ghost.label});

  const targetAt = Math.max(hp.start + 0.45, Math.min(hp.start + 0.7, p1.start - 0.25));
  msgs.push({id: 'target', kind: 'you', side: 'R', role: 'you', at: targetAt, ...bubbleSize(targetBlock, targetGloss), text: targetBlock, gloss: targetGloss,
    plays: [...play(marks.play1), ...play(marks.play2)], mode: 'karaoke', label: copy.targetLabel, passes: true});

  const ask2 = S('ask2');
  const cd = S('countdown');
  const ans = S('answer');
  const dividerAt = ask2.start - 0.3;
  msgs.push({id: 'divider', kind: 'divider', side: 'C', at: dividerAt, h: DIVIDER_H, w: 640});
  msgs.push({id: 'ask2', kind: 'them', side: 'L', role: 'bucho', at: ask2.start, ...bubbleSize(askBlock, askGloss), text: askBlock, gloss: askGloss, plays: play(ask2), mode: 'reveal', hiddenUntil: ans.start + 0.6});
  msgs.push({id: 'typing2', kind: 'typing', side: 'R', role: 'you', at: cd.start + 0.08, out: ans.start, h: TYPING.h, w: TYPING.w});
  const firstReact = reacts[0];
  msgs.push({id: 'answer', kind: 'you', side: 'R', role: 'you', at: ans.start, ...bubbleSize(targetBlock, targetGloss), text: targetBlock, gloss: targetGloss,
    plays: play(ans), mode: 'karaoke', label: copy.answerLabel, tapbackAt: firstReact ? firstReact.start + 0.35 : undefined});

  for (const r of reacts) {
    const tag = r.audio ?? 'react';
    const line = pick(episode, tag);
    const block = jaBlock(clean(line?.text ?? ''), tag, waves, r.dur, 'ja');
    const g = glossLines(line?.zh);
    msgs.push({id: `react-${tag}`, kind: 'them', side: 'L', role: 'bucho', at: r.start, ...bubbleSize(block, g), text: block, gloss: g, plays: play(r), mode: 'reveal'});
  }
  const lastReact = reacts[reacts.length - 1];
  if (lastReact) {
    msgs.push({id: 'typing3', kind: 'typing', side: 'L', role: 'bucho', at: Math.max(lastReact.start + 0.5, end(lastReact) - 0.15), h: TYPING.h, w: TYPING.w});
  }

  // ③ 开始后，分隔条以上的旧消息蒙上磨砂，答完再揭开
  const dividerIdx = msgs.findIndex((m) => m.id === 'divider');
  msgs.forEach((m, i) => {
    if (i < dividerIdx) m.frosted = true;
  });

  const coach: Script['coach'] = [
    {at: -1, text: copy.coach.ask},
    {at: wait.start + 0.1, text: copy.coach.wait},
    {at: host.start, text: ''},
    {at: hp.start + 0.3, text: episode.hook ?? '', em: (episode.hook ?? '').split(/(?<=。)/)[0]},
    {at: dividerAt, text: copy.coach.ask2},
    {at: cd.start, text: copy.coach.countdown},
    {at: ans.start, text: copy.coach.answer},
    ...(firstReact ? [{at: firstReact.start + 0.9, text: copy.coach.react}] : []),
  ];

  return {
    msgs,
    marks,
    reacts,
    draft: {text: draftText, times: draftTimes},
    frost: {from: dividerAt, to: ans.start + 0.8},
    steps: [-1, host.start, dividerAt],
    coach,
  };
};
