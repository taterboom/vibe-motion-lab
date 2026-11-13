import React, {useMemo} from 'react';
import {visualizeAudio} from '@remotion/media-utils';
import {color, font, FPS} from '../theme';
import type {Timed} from './align';
import {envelope, rmsAt} from './analysis';
import {Avatar, Beer, EarIcon, MicIcon, TextRows, VoiceChip, type UnitState} from './Bits';
import {copy} from './content';
import {bubble, grid, type} from './layout';
import {ease, exitCollapse, exitScale, fadeIn, keys, popScale, ramp, stackIn, stampScale} from './motion';
import {TYPING, type Msg, type Play, type Script} from './script';
import type {Wave} from './waves';

const W = 1080;

/** 对话流：消息从底边往上堆，新消息推旧消息上移；整片只有这一条流，不重置 */
export const Chat: React.FC<{script: Script; waves: Record<string, Wave>; t: number}> = ({script, waves, t}) => {
  const envs = useMemo(() => Object.fromEntries(Object.entries(waves).map(([k, w]) => [k, envelope(w, 22)])), [waves]);
  const frost = ramp(t, script.frost.from, script.frost.from + 0.45) * (1 - ramp(t, script.frost.to, script.frost.to + 0.5));

  // 从最新一条往上排：每条的底边 = 下面各条（按入场进度）占掉的高度
  const placed: Array<{m: Msg; top: number}> = [];
  let bottom = grid.chatBottom;
  for (let i = script.msgs.length - 1; i >= 0; i--) {
    const m = script.msgs[i];
    const fIn = (t - m.at) * FPS;
    let c = m.at < 0 || m.reserved ? 1 : stackIn(fIn);
    if (m.out !== undefined) c *= 1 - exitCollapse((t - m.out) * FPS);
    if (fIn >= 0 && bottom > grid.chatTop - 40 && !(m.out !== undefined && (t - m.out) * FPS > 9)) placed.push({m, top: bottom - m.h});
    bottom -= (m.h + grid.gap) * c;
  }

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: grid.chatBottom + 40,
      maskImage: `linear-gradient(to bottom, transparent ${grid.chatTop - 10}px, black ${grid.chatTop + grid.fade}px)`,
      WebkitMaskImage: `linear-gradient(to bottom, transparent ${grid.chatTop - 10}px, black ${grid.chatTop + grid.fade}px)`}}>
      {placed.map(({m, top}) => {
        const fIn = m.at < 0 ? 99 : (t - m.at) * FPS;
        const fOut = m.out !== undefined ? (t - m.out) * FPS : -1;
        const frosted = m.frosted ? frost : 0;
        const full = m.kind === 'them' || m.kind === 'you' || m.kind === 'ghost' || m.kind === 'typing';
        const x = full || m.side === 'L' ? grid.side : (W - m.w) / 2;
        return (
          <div key={m.id} style={{position: 'absolute', left: x, top, width: full ? W - grid.side * 2 : m.w, height: m.h,
            filter: frosted > 0.01 ? `blur(${frosted * 9}px)` : undefined, opacity: 1 - 0.5 * frosted}}>
            <Item m={m} t={t} fIn={fIn} fOut={fOut} waves={waves} envs={envs} />
          </div>
        );
      })}
    </div>
  );
};

/* ───────── 时间 → 状态的小工具 ───────── */

const current = (plays: Play[] | undefined, t: number) => plays?.find((p) => t >= p.at && t < p.at + p.dur);
const lastStarted = (plays: Play[] | undefined, t: number) => [...(plays ?? [])].reverse().find((p) => t >= p.at);
const levelOf = (waves: Record<string, Wave>, plays: Play[] | undefined, t: number) => {
  const p = current(plays, t);
  const w = p ? waves[p.tag] : undefined;
  return p && w ? Math.min(1, rmsAt(w, t - p.at) / 0.2) : 0;
};

/** 首次出现的句子：每个单元在它的发音时刻浮现 */
const revealState = (local: number) => (u: Timed): UnitState => {
  const f = (local - u.t0) * FPS;
  return {vis: fadeIn(f, 4), dy: keys(f, [[0, 12], [4, -2], [7, 0]], [ease.out, ease.inOut]), lit: 1, lift: 0};
};

/** 卡拉 OK：当前播放内按单元时间扫亮；两遍之间亮色回落，最后一遍之后保持亮 */
const karaokeState = (plays: Play[], t: number) => {
  const idx = plays.reduce((a, p, i) => (t >= p.at ? i : a), -1);
  const p = plays[idx];
  const next = plays[idx + 1];
  return (u: Timed): UnitState => {
    if (!p) return {vis: 1, dy: 0, lit: 0, lift: 0};
    const local = t - p.at;
    if (local < p.dur) {
      const span = Math.max(0.001, u.t1 - u.t0);
      const lit = u.punct ? (local >= u.t0 ? 1 : 0) : Math.max(0, Math.min(1, (local - u.t0) / span));
      return {vis: 1, dy: 0, lit, lift: u.punct ? 0 : Math.sin(Math.PI * lit) * 5};
    }
    const back = next ? ramp(t, p.at + p.dur + 0.1, p.at + p.dur + 0.55, ease.inOut) : 0;
    return {vis: 1, dy: 0, lit: 1 - back, lift: 0};
  };
};

/* ───────── 各种消息 ───────── */

type ItemProps = {m: Msg; t: number; fIn: number; fOut: number; waves: Record<string, Wave>; envs: Record<string, number[]>};

const Item: React.FC<ItemProps> = (p) => {
  switch (p.m.kind) {
    case 'event':
      return <EventCard />;
    case 'them':
    case 'you':
      return <Speech {...p} />;
    case 'ghost':
      return <Ghost {...p} />;
    case 'host':
      return <HostCard {...p} />;
    case 'typing':
      return <Typing {...p} />;
    case 'divider':
      return <Divider {...p} />;
    default:
      return null;
  }
};

/** 气泡外壳：从尾巴角弹出（主动作），退场时缩回 */
const Shell: React.FC<{side: 'L' | 'R' | 'C'; fIn: number; fOut?: number; style: React.CSSProperties; children: React.ReactNode}> = ({side, fIn, fOut = -1, style, children}) => {
  const s = popScale(fIn) * (fOut >= 0 ? exitScale(fOut) : 1);
  const o = fadeIn(fIn, 4) * (fOut >= 0 ? 1 - ramp(fOut, 1, 7) : 1);
  const origin = side === 'L' ? 'left bottom' : side === 'R' ? 'right bottom' : 'center bottom';
  const corner = side === 'L' ? {borderBottomLeftRadius: bubble.tail} : side === 'R' ? {borderBottomRightRadius: bubble.tail} : {};
  return (
    <div style={{position: 'relative', borderRadius: bubble.radius, ...corner, ...style, transform: `scale(${s})`, transformOrigin: origin, opacity: o}}>
      {children}
    </div>
  );
};

/** 头像行：头像 + 名字 + 声波条（+ 第几遍 / 标签）。比气泡晚 3 帧到（次要动作） */
const LabelRow: React.FC<ItemProps & {extra?: React.ReactNode}> = ({m, t, fIn, waves, envs, extra}) => {
  const f = fIn - 3;
  const isYou = m.role === 'you';
  const p = lastStarted(m.plays, t) ?? m.plays?.[0];
  const progress = p ? Math.max(0, Math.min(1, (t - p.at) / p.dur)) : 0;
  const level = levelOf(waves, m.plays, t);
  const env = p ? envs[p.tag] : undefined;
  return (
    <div style={{display: 'flex', flexDirection: m.side === 'R' ? 'row-reverse' : 'row', alignItems: 'center', gap: 16, height: bubble.labelH,
      opacity: fadeIn(f, 5), transform: `translateX(${(m.side === 'R' ? 1 : -1) * keys(f, [[0, 24], [6, 0]], ease.out)}px)`}}>
      <Avatar letter={copy.avatars[m.role ?? ''] ?? ''} bg={isYou ? color.accent : color.indigo} level={level} />
      <div style={{fontFamily: font.zh, fontSize: type.label, fontWeight: 600, color: color.ink, whiteSpace: 'nowrap'}}>{copy.names[m.role ?? ''] ?? ''}</div>
      {env && p ? <VoiceChip env={env} progress={progress} on={isYou ? color.accent : color.indigo} off={color.line} dur={p.dur} textColor={color.muted} /> : null}
      {extra}
    </div>
  );
};

const Tag: React.FC<{text: string; tone: 'good' | 'bad' | 'plain'}> = ({text, tone}) => (
  <div style={{fontFamily: font.zh, fontSize: 26, fontWeight: 600, padding: '6px 16px', borderRadius: 20, whiteSpace: 'nowrap',
    color: tone === 'plain' ? color.muted : color.accent, backgroundColor: tone === 'good' ? 'rgba(181,66,44,0.1)' : 'transparent',
    border: tone === 'bad' ? `2px solid ${color.accent}` : 'none'}}>{text}</div>
);

const Passes: React.FC<{n: number; of: number}> = ({n, of}) => (
  <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
    {Array.from({length: of}, (_, i) => (
      <div key={i} style={{width: 16, height: 16, borderRadius: 8, backgroundColor: i < n ? color.accent : 'transparent', border: `3px solid ${color.accent}`}} />
    ))}
  </div>
);

/** 说话的气泡（部长 / 你）。部长：逐字浮现；你：卡拉 OK 扫亮。③ 的部长重放先只给声波，答完再揭开字 */
const Speech: React.FC<ItemProps> = (p) => {
  const {m, t, fIn, waves} = p;
  const isYou = m.role === 'you';
  const text = m.text!;
  const plays = m.plays ?? [];
  const first = plays[0];
  const state = m.mode === 'karaoke' ? karaokeState(plays, t) : m.hiddenUntil !== undefined ? () => ({vis: 1, dy: 0, lit: 1, lift: 0}) : revealState(first ? t - first.at : 99);
  const lastUnit = text.rows[text.rows.length - 1]?.slice(-1)[0];
  const glossF = m.mode === 'reveal' && first && lastUnit && m.hiddenUntil === undefined ? (t - (first.at + lastUnit.t1 - 0.15)) * FPS : 99;
  const hidden = m.hiddenUntil !== undefined ? 1 - ramp(t, m.hiddenUntil, m.hiddenUntil + 0.4) : 0;
  const passes = m.passes ? plays.filter((pl) => t >= pl.at).length : 0;
  const extra = (
    <>
      {m.passes ? <Passes n={passes} of={plays.length} /> : null}
      {m.label ? <Tag text={m.label} tone="good" /> : null}
    </>
  );
  const tap = m.tapbackAt !== undefined ? (t - m.tapbackAt) * FPS : -1;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: m.side === 'R' ? 'flex-end' : 'flex-start', gap: bubble.labelGap}}>
      <LabelRow {...p} extra={extra} />
      <Shell side={m.side} fIn={fIn} style={{width: m.w, padding: `${bubble.padY}px ${bubble.padX}px`, boxSizing: 'border-box',
        backgroundColor: isYou ? color.accent : color.paper, boxShadow: '0 6px 0 rgba(43,36,32,0.06), 0 10px 30px rgba(43,36,32,0.08)'}}>
        <div style={{position: 'relative'}}>
          <div style={{opacity: 1 - hidden, filter: hidden > 0.01 ? `blur(${hidden * 14}px)` : undefined}}>
            <TextRows block={text} state={state}
              dim={isYou ? 'rgba(255,255,255,0.42)' : color.ink} lit={isYou ? color.onAccent : color.ink}
              rubyDim={isYou ? 'rgba(255,255,255,0.4)' : color.muted} rubyLit={isYou ? 'rgba(255,255,255,0.9)' : color.muted} />
            {m.gloss ? (
              <div style={{marginTop: bubble.glossGap, fontFamily: font.zh, fontSize: type.zh, lineHeight: bubble.zhLine, color: isYou ? 'rgba(255,255,255,0.85)' : color.muted,
                opacity: fadeIn(glossF, 8), transform: `translateY(${keys(glossF, [[0, 10], [8, 0]], ease.out)}px)`}}>
                {m.gloss.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            ) : null}
          </div>
          {hidden > 0 ? <Listening {...p} opacity={hidden} /> : null}
        </div>
        {tap >= 0 ? (
          <div style={{position: 'absolute', right: 'calc(100% + 16px)', bottom: 6, height: 92, padding: '0 22px 0 12px', borderRadius: 46, backgroundColor: color.paper,
            boxShadow: '0 6px 18px rgba(43,36,32,0.2)', display: 'flex', alignItems: 'center', gap: 4, transformOrigin: 'right center',
            transform: `scale(${stampScale(tap)}) rotate(${keys(tap, [[0, -24], [6, 10], [11, -4], [16, 0]], ease.inOut)}deg)`, opacity: fadeIn(tap, 3)}}>
            <Beer size={72} />
            <span style={{fontFamily: font.ja, fontSize: 34, fontWeight: 700, color: color.ink, whiteSpace: 'nowrap'}}>乾杯！</span>
          </div>
        ) : null}
      </Shell>
    </div>
  );
};

/** 遮住字时的气泡内容：实时频谱（visualizeAudio）镜像成声波 + 「只听，不看字」 */
const Listening: React.FC<ItemProps & {opacity: number}> = ({m, t, waves, envs, opacity}) => {
  const p = current(m.plays, t);
  const w = p ? waves[p.tag] : undefined;
  const N = 20;
  let bins: number[] = new Array(N).fill(0);
  if (p && w) {
    const frame = Math.floor((t - p.at) * FPS);
    const v = visualizeAudio({audioData: w, frame, fps: FPS, numberOfSamples: 64, optimizeFor: 'speed'});
    bins = v.slice(1, N + 1).map((x, i) => Math.min(1, Math.pow(x * (10 + i * 1.5), 0.6)));
  } else {
    // 没在播：画这句录音的静态包络（淡），像一条已经收到的语音
    const env = envs[m.plays?.[0]?.tag ?? ''] ?? [];
    bins = Array.from({length: N}, (_, i) => 0.25 * (env[Math.floor((i / N) * env.length)] ?? 0));
  }
  const bars = p ? [...bins.slice().reverse(), ...bins] : [...bins, ...bins];
  const text = m.text!;
  const h = text.height + (m.gloss ? bubble.glossGap + m.gloss.length * type.zh * bubble.zhLine : 0);
  return (
    <div style={{position: 'absolute', inset: 0, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, opacity}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 6, height: 150}}>
        {bars.map((v, i) => (
          <div key={i} style={{width: 9, height: 10 + 140 * v, borderRadius: 5, backgroundColor: color.indigo, opacity: 0.35 + 0.65 * v}} />
        ))}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: font.zh, fontSize: 32, color: color.muted}}>
        <EarIcon size={38} color={color.muted} />
        {copy.hiddenNote}
      </div>
    </div>
  );
};

/** 差点发出去的回复：虚线幽灵气泡，红线划掉 + ✕ 章 */
const Ghost: React.FC<ItemProps> = ({m, t, fIn}) => {
  const fs = (t - (m.strikeAt ?? 1e9)) * FPS;
  const strike = ramp(fs, 0, 9, ease.inOut);
  const dimmed = ramp(fs, 6, 14);
  const text = m.text!;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
      <Shell side="R" fIn={fIn} style={{width: m.w, padding: `${bubble.padY - 3}px ${bubble.padX - 3}px`, boxSizing: 'border-box',
        border: `3px dashed ${color.muted}`, backgroundColor: 'rgba(255,251,242,0.55)'}}>
        <div style={{opacity: 1 - 0.45 * dimmed}}>
          <TextRows block={text} state={() => ({vis: 1, dy: 0, lit: 1, lift: 0})} dim={color.muted} lit={color.ink} rubyDim={color.muted} rubyLit={color.muted} />
          {m.gloss ? (
            <div style={{marginTop: bubble.glossGap, fontFamily: font.zh, fontSize: type.zh, lineHeight: bubble.zhLine, color: color.muted}}>{m.gloss.join('')}</div>
          ) : null}
        </div>
        {text.rows.map((row, r) => (
          <div key={r} style={{position: 'absolute', left: bubble.padX - 14, top: bubble.padY + r * text.lineH + (text.ruby ? bubble.rubyH : 0) + (text.lineH - bubble.rubyH) / 2 - 4,
            height: 8, borderRadius: 4, backgroundColor: color.accent, width: (m.w - 2 * bubble.padX + 28) * strike}} />
        ))}
        <div style={{position: 'absolute', left: -28, top: -28, width: 64, height: 64, borderRadius: 32, backgroundColor: color.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, fontFamily: font.zh,
          transform: `scale(${fs >= 4 ? stampScale(fs - 4) : 0})`}}>✕</div>
        <div style={{position: 'absolute', right: 28, top: -24, backgroundColor: color.bg, borderRadius: 22, opacity: fadeIn(fs - 2, 5),
          transform: `translateY(${keys(fs - 2, [[0, 10], [6, 0]], ease.out)}px)`}}>
          <Tag text={m.label ?? ''} tone="bad" />
        </div>
      </Shell>
    </div>
  );
};

/** 主持人：不是对话里的人，用深色居中卡片 + 麦克风标，和气泡一眼区分 */
const HostCard: React.FC<ItemProps> = ({m, t, fIn, waves, envs}) => {
  const text = m.text!;
  const first = m.plays?.[0];
  const progress = first ? Math.max(0, Math.min(1, (t - first.at) / first.dur)) : 0;
  const level = levelOf(waves, m.plays, t);
  const env = first ? envs[first.tag] : undefined;
  return (
    <Shell side="C" fIn={fIn} style={{width: m.w, height: m.h, padding: '36px 44px', boxSizing: 'border-box', backgroundColor: color.ink, borderRadius: 36}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, height: 46, marginBottom: 12, opacity: fadeIn(fIn - 3, 5)}}>
        <Avatar bg={color.amber} size={46} level={level} icon={<MicIcon size={28} color={color.ink} />} />
        <div style={{fontFamily: font.zh, fontSize: type.label, fontWeight: 600, color: color.amber}}>{copy.names.host}</div>
        {env && first ? <VoiceChip env={env} progress={progress} on={color.amber} off="rgba(243,233,210,0.18)" dur={first.dur} textColor="rgba(243,233,210,0.5)" /> : null}
      </div>
      <TextRows block={text} state={revealState(first ? t - first.at : 99)} dim={color.bg} lit={color.bg} rubyDim={color.bg} rubyLit={color.bg} weight={600} justify="center" />
    </Shell>
  );
};

/** 正在输入…：三个点。传了 keystrokes 的只在有人打字时跳（停手 = 犹豫） */
const Typing: React.FC<ItemProps> = ({m, t, fIn, fOut}) => {
  const active = m.keystrokes
    ? Math.max(0, ...m.keystrokes.map((k) => (t >= k && t < k + 0.45 ? 1 - ramp(t, k + 0.25, k + 0.45) : 0)))
    : 1;
  const isYou = m.role === 'you';
  return (
    <div style={{display: 'flex', justifyContent: m.side === 'R' ? 'flex-end' : 'flex-start', paddingTop: m.h - TYPING.h}}>
      <Shell side={m.side} fIn={fIn} fOut={fOut} style={{width: TYPING.w, height: TYPING.h, backgroundColor: isYou ? '#F2D9D1' : color.paper,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
        {[0, 1, 2].map((i) => {
          const wave = Math.sin(t * Math.PI * 2 * 1.7 - i * 0.9);
          const a = 0.25 + 0.75 * active;
          return (
            <div key={i} style={{width: 20, height: 20, borderRadius: 10, backgroundColor: isYou ? color.accent : color.muted,
              opacity: 0.35 + 0.65 * a * (0.5 + 0.5 * wave), transform: `translateY(${-7 * a * Math.max(0, wave)}px)`}} />
          );
        })}
      </Shell>
    </div>
  );
};

const Divider: React.FC<ItemProps> = ({m, fIn}) => {
  const line = ramp(fIn - 4, 0, 10, ease.out);
  return (
    <div style={{position: 'relative', height: m.h, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', left: -120, right: -120, top: m.h / 2 - 1, height: 2, backgroundColor: color.line, transform: `scaleX(${line})`}} />
      <Shell side="C" fIn={fIn} style={{padding: '14px 36px', borderRadius: 40, backgroundColor: color.indigo, color: '#fff', fontFamily: font.zh, fontSize: 34, fontWeight: 600}}>
        {copy.divider}
      </Shell>
    </div>
  );
};

/** 0 帧就在的活动卡片：交代场景（居酒屋、新人欢迎会、邻座是部长），随对话推进滚走 */
const EventCard: React.FC = () => (
  <div style={{width: '100%', height: '100%', borderRadius: 36, backgroundColor: color.paper, overflow: 'hidden', boxShadow: '0 6px 0 rgba(43,36,32,0.05)'}}>
    <div style={{position: 'relative', height: 320, backgroundColor: color.indigo}}>
      <svg width={992} height={320} viewBox="0 -70 992 320" style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="warm" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor={color.amber} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color.amber} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={0} y={-70} width={992} height={320} fill="url(#warm)" />
        {/* 一排小灯笼 */}
        {[90, 250, 742, 902].map((x, i) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <line x1={0} y1={-70} x2={0} y2={26} stroke="#1A2236" strokeWidth={3} />
            <rect x={-14} y={24} width={28} height={7} rx={2} fill="#1A2236" />
            <ellipse cx={0} cy={62} rx={26} ry={32} fill={i % 2 ? color.accent : '#C9512F'} />
            <rect x={-14} y={92} width={28} height={7} rx={2} fill="#1A2236" />
          </g>
        ))}
        {/* 吧台 */}
        <rect x={0} y={190} width={992} height={60} fill="#6B4430" />
        <rect x={0} y={182} width={992} height={12} fill="#8A5A3C" />
        {/* 毛豆 */}
        <ellipse cx={300} cy={188} rx={70} ry={14} fill="#F3E9D2" />
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={262 + i * 18} cy={180 - (i % 2) * 4} rx={13} ry={8} fill="#7FA650" stroke="#5E8139" strokeWidth={2} />)}
        {/* 烤串 */}
        <ellipse cx={690} cy={188} rx={78} ry={14} fill="#F3E9D2" />
        {[0, 1].map((k) => (
          <g key={k} transform={`translate(${640 + k * 26} ${176 - k * 8}) rotate(-8)`}>
            <line x1={-10} y1={0} x2={110} y2={0} stroke="#C9A36A" strokeWidth={4} />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 22} y={-10} width={18} height={20} rx={6} fill={i % 2 ? '#9A5A2E' : '#B06A35'} />)}
          </g>
        ))}
      </svg>
      {/* 两杯碰在一起 */}
      <div style={{position: 'absolute', left: 372, top: 96}}><Beer size={150} tilt={-10} /></div>
      <div style={{position: 'absolute', left: 478, top: 104}}><Beer size={138} tilt={12} /></div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 180, padding: '0 44px'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
        <div style={{fontFamily: font.zh, fontSize: 30, color: color.accent, fontWeight: 600}}>{copy.event.time}</div>
        <div style={{fontFamily: font.zh, fontSize: 64, color: color.ink, fontWeight: 700, lineHeight: 1.15}}>{copy.event.title}</div>
      </div>
      <div style={{fontFamily: font.zh, fontSize: 34, color: color.muted, textAlign: 'right', lineHeight: 1.45}}>
        {copy.event.sub.split(' · ').map((l) => <div key={l}>{l}</div>)}
      </div>
    </div>
  </div>
);
