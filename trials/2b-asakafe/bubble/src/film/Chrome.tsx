import React from 'react';
import {interpolateColors} from 'remotion';
import {color, font, FPS} from '../theme';
import type {Episode, Segment, SegmentKind} from '../types';
import {rmsAt} from './analysis';
import {EarIcon, MicIcon, SendIcon, SpeakerIcon} from './Bits';
import {copy} from './content';
import {grid, type} from './layout';
import {ease, keys, ramp, stampScale} from './motion';
import type {Script} from './script';
import type {Wave} from './waves';

const W = 1080;

/* ───────── 门帘头：藍色暖帘 + 红灯笼，标题固定 ───────── */

export const Header: React.FC<{episode: Episode; t: number}> = ({episode, t}) => {
  const sway = Math.sin(t * 1.6) * 2.6;
  const panels = 4;
  const pw = W / panels;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: grid.header + 12}}>
      <svg width={W} height={grid.header + 12} viewBox={`0 0 ${W} ${grid.header + 12}`} style={{position: 'absolute', inset: 0}}>
        <rect x={0} y={0} width={W} height={150} fill={color.indigo} />
        {Array.from({length: panels}, (_, i) => {
          // 每片帘子下摆各自轻轻摆（相位错开，次要动作）
          const d = Math.sin(t * 1.3 + i * 1.1) * 3;
          const x0 = i * pw + (i ? 6 : 0);
          const x1 = (i + 1) * pw - (i < panels - 1 ? 6 : 0);
          return <path key={i} d={`M ${x0} 140 L ${x1} 140 L ${x1 + d} ${grid.header} L ${x0 + d} ${grid.header} Z`} fill={color.indigo} />;
        })}
        <rect x={0} y={grid.header - 10} width={W} height={0} fill="none" />
      </svg>
      <div style={{position: 'absolute', left: -20, top: -10, width: 270, height: 250, background: `radial-gradient(circle at 50% 50%, rgba(226,161,59,0.28), rgba(226,161,59,0) 65%)`}} />
      {/* 灯笼：从顶上的绳挂下来，绕挂点摆 */}
      <div style={{position: 'absolute', left: 58, top: 0, width: 110, height: 200, transformOrigin: '55px 0px', transform: `rotate(${sway}deg)`}}>
        <svg width={110} height={200} viewBox="0 0 110 200">
          <line x1={55} y1={0} x2={55} y2={40} stroke="#1A2236" strokeWidth={4} />
          <rect x={33} y={38} width={44} height={12} rx={3} fill="#1A2236" />
          <ellipse cx={55} cy={104} rx={46} ry={58} fill={color.accent} />
          {[-30, -15, 0, 15, 30].map((dy) => (
            <path key={dy} d={`M 12 ${104 + dy} Q 55 ${110 + dy} 98 ${104 + dy}`} fill="none" stroke="#8E2F1E" strokeWidth={2} opacity={0.6} />
          ))}
          <rect x={33} y={158} width={44} height={12} rx={3} fill="#1A2236" />
          <text x={55} y={120} textAnchor="middle" fontFamily={font.ja} fontSize={44} fontWeight={700} fill="#FFF3DA">酒</text>
        </svg>
      </div>
      <div style={{position: 'absolute', left: 196, top: 40, right: 40}}>
        <div style={{fontFamily: font.zh, fontSize: type.title, fontWeight: 700, color: '#FFF8EA', lineHeight: 1.2}}>{copy.headerTitle}</div>
        <div style={{marginTop: 14, fontFamily: font.zh, fontSize: 28, color: 'rgba(243,233,210,0.72)'}}>
          朝カフェ #{String(episode.n ?? 1).padStart(3, '0')}　{(episode.title ?? '').split('｜')[1] ?? ''}
        </div>
      </div>
    </div>
  );
};

/* ───────── 步骤条：高亮块在三格之间滑动 ───────── */

export const Stepper: React.FC<{script: Script; t: number}> = ({script, t}) => {
  const n = copy.steps.length;
  const gap = 20;
  const cellW = (W - grid.side * 2 - gap * (n - 1)) / n;
  const idx = script.steps.reduce((a, s, i) => (t >= s ? i : a), 0);
  const since = (t - script.steps[idx]) * FPS;
  const from = Math.max(0, idx - 1);
  // 滑动：14 帧到位，过冲 4% 回稳
  const k = idx === 0 ? 1 : keys(since, [[0, 0], [9, 1.04], [14, 0.99], [18, 1]], [ease.inOut, ease.inOut, ease.inOut]);
  const xOf = (i: number) => grid.side + i * (cellW + gap);
  const x = xOf(from) + (xOf(idx) - xOf(from)) * k;
  return (
    <div style={{position: 'absolute', left: 0, top: grid.stepTop, width: W, height: grid.stepH}}>
      {copy.steps.map((_, i) => (
        <div key={i} style={{position: 'absolute', left: xOf(i), top: 0, width: cellW, height: grid.stepH, borderRadius: grid.stepH / 2, border: `2px solid ${color.line}`, boxSizing: 'border-box'}} />
      ))}
      <div style={{position: 'absolute', left: x, top: 0, width: cellW, height: grid.stepH, borderRadius: grid.stepH / 2, backgroundColor: color.ink}} />
      {copy.steps.map((s, i) => {
        const on = Math.max(0, 1 - Math.abs(x - xOf(i)) / (cellW + gap));
        return (
          <div key={s} style={{position: 'absolute', left: xOf(i), top: 0, width: cellW, height: grid.stepH, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: font.zh, fontSize: 32, fontWeight: 600, color: interpolateColors(on, [0, 1], [i < idx ? color.ink : color.muted, '#FFF8EA'])}}>{s}</div>
        );
      })}
    </div>
  );
};

/* ───────── 提示行：一句旁白 / 要点，换句时旧的上滑淡出，新的滞后 3 帧进来 ───────── */

export const Coach: React.FC<{script: Script; t: number}> = ({script, t}) => {
  const list = script.coach;
  const idx = list.reduce((a, c, i) => (t >= c.at ? i : a), 0);
  const cur = list[idx];
  const prev = idx > 0 ? list[idx - 1] : undefined;
  const f = (t - cur.at) * FPS;
  const line = (c: {text: string; em?: string}, opacity: number, dy: number, key: string) => {
    const em = c.em && c.text.startsWith(c.em) ? c.em : '';
    return (
      <div key={key} style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity, transform: `translateY(${dy}px)`,
        fontFamily: font.zh, fontSize: type.coach, color: color.ink, fontWeight: 500, whiteSpace: 'nowrap'}}>
        {em ? <span style={{color: color.accent, fontWeight: 700}}>{em}</span> : null}
        <span>{c.text.slice(em.length)}</span>
      </div>
    );
  };
  const outK = ramp(f, 0, 5, ease.in);
  const inK = ramp(f, 5, 14, ease.out);
  return (
    <div style={{position: 'absolute', left: grid.side, right: grid.side, top: grid.coachTop, height: grid.coachH}}>
      {prev && prev.text && outK < 1 ? line(prev, 1 - outK, -16 * outK, `p${idx}`) : null}
      {cur.text ? line(cur, cur.at < 0 ? 1 : inK, cur.at < 0 ? 0 : 18 * (1 - inK), `c${idx}`) : null}
    </div>
  );
};

/* ───────── 输入框：「你」这边的一切都发生在这里 ───────── */

type DockState = 'idle' | 'draft' | 'listen' | 'turn' | 'ask2' | 'count';
const dockOf = (k: SegmentKind): DockState =>
  ({ask: 'idle', wait: 'draft', host: 'draft', hostPause: 'idle', play1: 'listen', gap: 'listen', play2: 'listen', shadow: 'turn', ask2: 'ask2', countdown: 'count',
    answer: 'idle', beforeReact: 'idle', react: 'idle', tail: 'idle'} as Record<SegmentKind, DockState>)[k];

const BTN = 168;

export const Dock: React.FC<{script: Script; segments: Segment[]; waves: Record<string, Wave>; t: number}> = ({script, segments, waves, t}) => {
  const i = Math.max(0, segments.findIndex((s) => t < s.start + s.dur));
  const seg = segments[i] ?? segments[segments.length - 1];
  const prevSeg = segments[i - 1];
  const st = dockOf(seg.kind);
  const prevSt = prevSeg ? dockOf(prevSeg.kind) : st;
  const f = (t - seg.start) * FPS;
  const outK = st === prevSt ? 1 : ramp(f, 0, 5, ease.in);
  const inK = st === prevSt ? 1 : ramp(f, 5, 13, ease.out);
  const top = grid.dockTop;
  const fieldX = grid.side + 28;
  const fieldW = W - grid.side * 2 - 28 * 3 - BTN;
  const btnCx = W - grid.side - 28 - BTN / 2;
  const btnCy = top + grid.dockH / 2;

  const m = script.marks;
  const progressOf = (s?: Segment) => (s ? Math.max(0, Math.min(1, (t - s.start) / s.dur)) : 0);

  const field = (s: DockState, seg0: Segment) => {
    switch (s) {
      case 'idle':
        return <div style={{fontFamily: font.zh, fontSize: type.dock, color: color.muted}}>{copy.dock.placeholder}</div>;
      case 'draft': {
        const n = script.draft.times.filter((x) => t >= x).length;
        const typing = script.draft.times.some((x) => t >= x && t < x + 0.35);
        const caret = typing || Math.floor(t * 2) % 2 === 0;
        return (
          <div style={{display: 'flex', alignItems: 'center', fontFamily: font.ja, fontSize: 56, fontWeight: 600, color: color.ink, opacity: seg0.kind === 'host' ? 0.5 : 1}}>
            {n === 0 ? <span style={{fontFamily: font.zh, fontSize: type.dock, fontWeight: 400, color: color.muted, position: 'absolute', left: 36}}>{copy.dock.placeholder}</span> : null}
            <span>{[...script.draft.text].slice(0, n).join('')}</span>
            <span style={{display: 'inline-block', width: 4, height: 62, marginLeft: 6, backgroundColor: color.accent, opacity: caret ? 1 : 0}} />
          </div>
        );
      }
      case 'listen': {
        const plays = [m.play1, m.play2].filter(Boolean) as Segment[];
        const cur = plays.find((p) => t >= p.start && t < p.start + p.dur);
        const done = plays.filter((p) => t >= p.start).length;
        const w = cur?.audio ? waves[cur.audio] : undefined;
        const level = cur && w ? Math.min(1, rmsAt(w, t - cur.start) / 0.2) : 0;
        const label = seg0.kind === 'gap' ? copy.dock.listenAgain : copy.dock.listen;
        return (
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <SpeakerIcon size={54} color={color.accent} level={level} />
            <span style={{fontFamily: font.zh, fontSize: type.dock, color: color.ink, fontWeight: 600}}>{label}</span>
            <div style={{display: 'flex', gap: 10, marginLeft: 6}}>
              {plays.map((_, k) => (
                <div key={k} style={{width: 22, height: 22, borderRadius: 11, border: `4px solid ${color.accent}`, backgroundColor: k < done ? color.accent : 'transparent'}} />
              ))}
            </div>
          </div>
        );
      }
      case 'turn':
        return (
          <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
            <span style={{fontFamily: font.zh, fontSize: 58, color: color.accent, fontWeight: 700}}>{copy.dock.shadow}</span>
            <span style={{fontFamily: font.zh, fontSize: 36, color: color.muted}}>{copy.dock.shadowSub}</span>
          </div>
        );
      case 'ask2':
        return (
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <EarIcon size={54} color={color.indigo} />
            <span style={{fontFamily: font.zh, fontSize: type.dock, color: color.ink, fontWeight: 600}}>{copy.dock.ask2}</span>
          </div>
        );
      case 'count':
        return (
          <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
            <span style={{fontFamily: font.zh, fontSize: 58, color: color.accent, fontWeight: 700}}>{copy.dock.countdown}</span>
            <span style={{fontFamily: font.zh, fontSize: 36, color: color.muted}}>{copy.dock.countdownSub}</span>
          </div>
        );
    }
  };

  // 输入框底部的细进度条：听 / 跟读 / 只听 的时候走
  const bar = (() => {
    if (st === 'listen') {
      const p = [m.play1, m.play2].find((s) => s && t >= s.start && t < s.start + s.dur);
      return {p: progressOf(p), c: color.accent};
    }
    if (st === 'turn') return {p: progressOf(seg), c: color.accent};
    if (st === 'ask2') return {p: progressOf(seg), c: color.indigo};
    return null;
  })();

  // 按钮
  const btnOn = st === 'draft' || st === 'turn' || st === 'count';
  const prevOn = prevSt === 'draft' || prevSt === 'turn' || prevSt === 'count';
  const onK = btnOn === prevOn ? (btnOn ? 1 : 0) : btnOn ? inK : 1 - inK;
  const bg = interpolateColors(onK, [0, 1], [color.line, color.accent]);
  const breathe = st === 'turn' ? 1 + 0.045 * Math.sin((t - seg.start) * Math.PI * 2 * 0.9) : 1;
  const ans = m.answer;
  const sendF = ans ? (t - ans.start) * FPS : -1;
  const sendPulse = sendF >= -4 && sendF < 16 ? keys(sendF, [[-4, 1], [0, 0.86], [5, 1.08], [10, 0.98], [15, 1]], [ease.in, ease.out, ease.inOut, ease.inOut]) : 1;
  const sendFlash = sendF >= -4 && sendF < 16 ? 1 - ramp(sendF, 6, 16) : 0;
  const btnBg = sendFlash > 0 ? interpolateColors(sendFlash, [0, 1], [color.line, color.accent]) : bg;

  let ring = 0;
  let digit: number | null = null;
  let digitF = 0;
  if (st === 'turn') ring = progressOf(seg);
  if (st === 'count') {
    const n = Math.max(1, Math.round(seg.dur));
    const per = seg.dur / n;
    const k = Math.min(n - 1, Math.floor((t - seg.start) / per));
    digit = n - k;
    digitF = (t - seg.start - k * per) * FPS;
    ring = 1 - ((t - seg.start - k * per) / per);
  }
  const R = BTN / 2 + 14;
  const C = 2 * Math.PI * R;

  const icon = digit !== null ? (
    <div style={{fontFamily: font.zh, fontSize: 96, fontWeight: 700, color: '#fff', transform: `scale(${stampScale(digitF)})`}}>{digit}</div>
  ) : sendFlash > 0 || st === 'draft' ? (
    <SendIcon size={64} color={st === 'draft' || sendFlash > 0 ? '#fff' : color.muted} />
  ) : (
    <MicIcon size={64} color={onK > 0.5 ? '#fff' : color.muted} />
  );

  return (
    <div style={{position: 'absolute', left: grid.side, top, width: W - grid.side * 2, height: grid.dockH, borderRadius: 52, backgroundColor: color.paper,
      boxShadow: '0 8px 0 rgba(43,36,32,0.06), 0 18px 40px rgba(43,36,32,0.10)'}}>
      <div style={{position: 'absolute', left: fieldX - grid.side, top: 28, width: fieldW, height: grid.dockH - 56, borderRadius: 36, backgroundColor: color.field, overflow: 'hidden'}}>
        {prevSt !== st && outK < 1 ? (
          <div style={{position: 'absolute', left: 36, right: 24, top: 0, bottom: 0, display: 'flex', alignItems: 'center', opacity: 1 - outK, transform: `translateY(${-14 * outK}px)`}}>
            {prevSeg ? field(prevSt, prevSeg) : null}
          </div>
        ) : null}
        <div style={{position: 'absolute', left: 36, right: 24, top: 0, bottom: 0, display: 'flex', alignItems: 'center', opacity: inK, transform: `translateY(${16 * (1 - inK)}px)`}}>
          {field(st, seg)}
        </div>
        {bar ? (
          <div style={{position: 'absolute', left: 36, right: 36, bottom: 22, height: 8, borderRadius: 4, backgroundColor: 'rgba(43,36,32,0.08)', opacity: inK}}>
            <div style={{width: `${bar.p * 100}%`, height: '100%', borderRadius: 4, backgroundColor: bar.c}} />
          </div>
        ) : null}
      </div>
      <div style={{position: 'absolute', left: btnCx - grid.side - BTN / 2, top: btnCy - top - BTN / 2, width: BTN, height: BTN}}>
        {ring > 0 ? (
          <svg width={R * 2 + 12} height={R * 2 + 12} style={{position: 'absolute', left: BTN / 2 - R - 6, top: BTN / 2 - R - 6}}>
            <circle cx={R + 6} cy={R + 6} r={R} fill="none" stroke="rgba(181,66,44,0.15)" strokeWidth={8} />
            <circle cx={R + 6} cy={R + 6} r={R} fill="none" stroke={color.accent} strokeWidth={8} strokeLinecap="round"
              strokeDasharray={`${C * ring} ${C}`} transform={`rotate(-90 ${R + 6} ${R + 6})`} />
          </svg>
        ) : null}
        <div style={{position: 'absolute', inset: 0, borderRadius: BTN / 2, backgroundColor: btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${breathe * sendPulse})`, opacity: st === 'draft' && seg.kind === 'host' ? 0.6 : 1}}>
          {icon}
        </div>
      </div>
    </div>
  );
};
