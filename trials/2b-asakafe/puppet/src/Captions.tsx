import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog, track} from './anim';
import {Ruby} from './Ruby';
import {caps, hostCap, sweepAt, type Cap} from './script';
import {segAt} from './Stage';
import {FPS, PAD, color, font, slot} from './theme';
import type {Episode, Segment, SegmentKind} from './types';
import {levelAt, type Waves} from './waves';

/** 画框下方的文字区：说话人签 / 主字幕 / 中文 / 提示行 / 片名，全部锚在固定槽位。
 *  同一内容跨段延续时不重新进场；内容变了才做 0.2s 交叉淡入 */

type Slots = {chip?: {text: string; bg: string}; main?: React.ReactNode; zh?: string; hint?: React.ReactNode};

const chipOf: Partial<Record<SegmentKind, {text: string; bg: string}>> = {
  ask: {text: '部长', bg: color.bucho},
  wait: {text: '部长', bg: color.bucho},
  host: {text: '主持人', bg: color.ink},
  hostPause: {text: '主持人', bg: color.ink},
  play1: {text: '示范 · 第 1 遍', bg: color.you},
  gap: {text: '示范 · 第 2 遍', bg: color.you},
  play2: {text: '示范 · 第 2 遍', bg: color.you},
  shadow: {text: '跟读 · 轮到你', bg: color.teal},
  ask2: {text: '部长 · 再说一遍', bg: color.bucho},
  countdown: {text: '你来答', bg: color.accent},
  answer: {text: '参考答案', bg: color.good},
  beforeReact: {text: '参考答案', bg: color.good},
  react: {text: '部长', bg: color.bucho},
  tail: {text: '部长', bg: color.bucho},
};

/** 每段的「内容身份」：相同就不重新进场 */
const idOf = (k: SegmentKind) =>
  k === 'ask' || k === 'wait' ? 'ask'
  : k === 'host' || k === 'hostPause' ? 'host'
  : k === 'play1' || k === 'gap' || k === 'play2' || k === 'shadow' ? 'target'
  : k === 'answer' || k === 'beforeReact' ? 'answer'
  : k === 'react' || k === 'tail' ? 'react'
  : k;

const full = (c: Cap) => c.lines.flat().reduce((a, k) => a + k.t.length, 0);

export const Captions: React.FC<{episode: Episode; segments: Segment[]; waves: Waves}> = ({episode, segments, waves}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const {i, seg} = segAt(segments, t);
  const prev = segments[i - 1];
  const local = t - seg.start;
  const changed = !prev || idOf(prev.kind) !== idOf(seg.kind);
  // 先让旧内容 0.1s 淡出，再让新内容 0.18s 进场，两段字不叠在一起；全片第一段直接出现
  const kOut = changed && prev ? ease.inOut(prog(local, 0, 0.1)) : 1;
  const k = changed && prev ? ease.out(prog(local, 0.08, 0.26)) : 1;
  const cur = slotsAt(seg, t, segments, waves);
  const old = changed && prev && kOut < 1 ? slotsAt(prev, prev.start + prev.dur - 0.001, segments, waves) : null;
  const chipChanged = !prev || chipOf[prev.kind]?.text !== chipOf[seg.kind]?.text;
  const chipK = chipChanged && prev ? ease.over(prog(local, 0, 0.25)) : 1;
  return (
    <>
      <Chip c={cur.chip} k={chipK} />
      {old ? <Body s={old} opacity={1 - kOut} dy={-10 * kOut} /> : null}
      <Body s={cur} opacity={k} dy={(1 - k) * 18} />
      <Center top={slot.foot} size={30} c={color.muted} family={font.zh}>{episode.title}</Center>
    </>
  );
};

const slotsAt = (seg: Segment, t: number, segments: Segment[], waves: Waves): Slots => {
  const local = t - seg.start;
  const chip = chipOf[seg.kind];
  const target = caps.target_normal;
  const big = (cap: Cap, filled: number, hi?: string, hiMix?: number) => <Ruby cap={cap} filled={filled} size={70} rubySize={28} hi={hi} hiMix={hiMix} lineGap={6} lift />;
  const hint = (text: string, c: string, from: number) => {
    const o = ease.out(prog(local, from, from + 0.3));
    return <span style={{opacity: o, display: 'inline-block', transform: `translateY(${(1 - o) * 10}px)`, color: c}}>{text}</span>;
  };
  switch (seg.kind) {
    case 'ask':
      return {chip, main: big(caps.ask, sweepAt(caps.ask, local)), zh: caps.ask.zh};
    case 'wait':
      return {chip, main: big(caps.ask, full(caps.ask)), zh: caps.ask.zh, hint: hint('如果是你，怎么回？', color.accent, 0.35)};
    case 'host':
    case 'hostPause': {
      const f = seg.kind === 'host' ? sweepAt(hostCap, local) : full(hostCap);
      return {chip, main: <Ruby cap={hostCap} filled={f} size={60} family={font.zh} weight={600} hi={color.ink} base={'#BDB09A'} lineGap={4} />};
    }
    case 'play1':
    case 'play2':
      return {chip, main: big(target, sweepAt(target, local)), zh: target.zh, hint: hint(episodeHook, color.accent, 0.1)};
    case 'gap':
      return {chip, main: big(target, full(target), color.accent, 1 - prog(local, 0.15, 0.5)), zh: target.zh, hint: hint(episodeHook, color.accent, -1)};
    case 'shadow': {
      const p = prog(local, 0, seg.dur);
      return {
        chip,
        main: big(target, sweepAt(target, local), color.teal),
        zh: target.zh,
        hint: (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
            <span style={{color: color.teal, fontWeight: 700}}>▶ 轮到你：跟着高亮说出来</span>
            <div style={{width: 520, height: 10, borderRadius: 5, backgroundColor: color.faint, overflow: 'hidden'}}>
              <div style={{width: `${(1 - p) * 100}%`, height: '100%', backgroundColor: color.teal, borderRadius: 5}} />
            </div>
          </div>
        ),
      };
    }
    case 'ask2':
      return {chip, main: <Listen level={levelAt(waves?.[seg.audio ?? 'ask'], local)} t={local} />, hint: hint('听懂了吗？马上轮到你回答', color.muted, 1.4)};
    case 'countdown':
      return {chip, main: <Count local={local} dur={seg.dur} />, hint: hint('轮到你回答！说出来', color.accent, 0)};
    case 'answer':
      return {chip, main: big(target, sweepAt(target, local), color.good), zh: target.zh};
    case 'beforeReact':
      return {chip, main: big(target, full(target), color.good), zh: target.zh};
    case 'react':
      return {chip, main: big(caps.react, sweepAt(caps.react, local)), zh: caps.react.zh, hint: hint('✓ 收下夸奖，话题就接下去了', color.good, 1.75)};
    case 'tail': {
      const r = segments.find((s) => s.kind === 'react');
      return {chip, main: big(caps.react, full(caps.react)), zh: caps.react.zh, hint: hint('✓ 收下夸奖，话题就接下去了', color.good, r ? r.start + 1.75 - seg.start : -1)};
    }
    default:
      return {chip};
  }
};

const episodeHook = '别否认。你一否认，对方还得再夸一轮。';

const Chip: React.FC<{c?: {text: string; bg: string}; k: number}> = ({c, k}) =>
  c ? (
    <div style={{position: 'absolute', left: 0, right: 0, top: slot.chip, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '8px 26px', borderRadius: 999, backgroundColor: c.bg, color: '#FFF8EC', fontFamily: font.zh, fontSize: 30, fontWeight: 700, letterSpacing: 2,
        transform: `scale(${0.85 + 0.15 * k})`, opacity: Math.min(1, k * 1.5)}}>
        {c.text}
      </div>
    </div>
  ) : null;

const Body: React.FC<{s: Slots; opacity: number; dy: number}> = ({s, opacity, dy}) => (
  <div style={{position: 'absolute', inset: 0, opacity, transform: `translateY(${dy}px)`}}>
    <div style={{position: 'absolute', left: PAD - 30, right: PAD - 30, top: slot.mainTop, height: slot.mainHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.ink}}>
      {s.main}
    </div>
    {s.zh ? <Center top={slot.zh} size={38} c={color.muted} family={font.zh}>{s.zh}</Center> : null}
    {s.hint ? <Center top={slot.hint} size={42} c={color.accent} family={font.zh} weight={600}>{s.hint}</Center> : null}
  </div>
);

const Center: React.FC<{top: number; size: number; c: string; family: string; weight?: number; children: React.ReactNode}> = ({top, size, c, family, weight = 400, children}) => (
  <div style={{position: 'absolute', left: PAD, right: PAD, top, textAlign: 'center', fontFamily: family, fontSize: size, fontWeight: weight, color: c, lineHeight: 1.35}}>
    {children}
  </div>
);

/** ③ 重放：不出台词，只给耳朵 + 跟部长音量跳的音量条 */
const Listen: React.FC<{level: number; t: number}> = ({level, t}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
      <Ear />
      <div style={{display: 'flex', alignItems: 'center', gap: 10, height: 120}}>
        {[0.55, 0.85, 1, 0.8, 0.6, 0.9, 0.5].map((w, i) => {
          const h = 16 + 100 * Math.min(1, level * w * (0.85 + 0.15 * Math.sin(t * 17 + i * 1.7)));
          return <div key={i} style={{width: 16, height: h, borderRadius: 8, backgroundColor: color.bucho, opacity: 0.85}} />;
        })}
      </div>
    </div>
    <div style={{fontFamily: font.zh, fontSize: 46, fontWeight: 600, color: color.ink}}>这次没有字幕，用耳朵听</div>
  </div>
);

const Ear: React.FC = () => (
  <svg width="96" height="110" viewBox="0 0 96 110">
    <path d="M 22 44 Q 22 8 54 8 Q 86 8 86 42 Q 86 62 70 72 Q 58 80 58 94 Q 58 106 44 106 Q 30 106 28 94" stroke={color.ink} strokeWidth={9} fill="none" strokeLinecap="round" />
    <path d="M 40 46 Q 40 28 56 28 Q 70 28 70 44 Q 70 54 60 58" stroke={color.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
  </svg>
);

/** ③ 倒计时：数字弹入 + 外圈按秒走完 */
const Count: React.FC<{local: number; dur: number}> = ({local, dur}) => {
  const n = Math.max(1, Math.round(dur));
  const per = dur / n;
  const idx = Math.min(n - 1, Math.floor(local / per));
  const tl = local - idx * per;
  const s = track(tl, [[0, 0.55], [0.12, 1.12, ease.out], [0.26, 0.97, ease.inOut], [0.36, 1]]);
  const p = tl / per;
  const R = 112;
  const C = 2 * Math.PI * R;
  return (
    <div style={{position: 'relative', width: 270, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={270} height={270} style={{position: 'absolute', inset: 0}}>
        <circle cx={135} cy={135} r={R} stroke={color.faint} strokeWidth={14} fill="none" />
        <circle cx={135} cy={135} r={R} stroke={color.accent} strokeWidth={14} fill="none" strokeLinecap="round"
          strokeDasharray={`${C * (1 - p)} ${C}`} transform="rotate(-90 135 135)" />
      </svg>
      <span style={{fontFamily: font.ja, fontSize: 170, fontWeight: 800, color: color.ink, transform: `scale(${s})`, display: 'inline-block', lineHeight: 1}}>{n - idx}</span>
    </div>
  );
};
