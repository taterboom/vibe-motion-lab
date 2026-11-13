import React from 'react';
import {color, font} from '../theme';
import type {Timed} from './align';
import {bubble, unitWidth} from './layout';
import type {TextBlock} from './script';

/** 一个显示单元在某一帧的状态 */
export type UnitState = {vis: number; dy: number; lit: number; lift: number};

/**
 * 排好版的文字：每个单元定宽，注音在上方居中。
 * lit < 1 时画两层：底色一层 + 亮色一层按 lit 横向裁切（卡拉 OK 扫亮）。
 */
export const TextRows: React.FC<{
  block: TextBlock;
  state: (u: Timed) => UnitState;
  dim: string;
  lit: string;
  rubyDim: string;
  rubyLit: string;
  weight?: number;
  justify?: 'flex-start' | 'center';
}> = ({block, state, dim, lit, rubyDim, rubyLit, weight = 600, justify = 'flex-start'}) => {
  const baseTop = block.ruby ? bubble.rubyH : 0;
  const baseLine = block.lineH - baseTop;
  const layer = (u: Timed, c: string, rc: string) => (
    <>
      {block.ruby && u.ruby ? (
        <div style={{position: 'absolute', top: 0, left: -20, right: -20, height: bubble.rubyH, textAlign: 'center', fontFamily: font.ja, fontSize: block.rubySize,
          lineHeight: `${bubble.rubyH}px`, fontWeight: 500, color: rc, whiteSpace: 'nowrap'}}>{u.ruby}</div>
      ) : null}
      <div style={{position: 'absolute', top: baseTop, left: 0, right: 0, height: baseLine, textAlign: 'center', fontFamily: block.family, fontSize: block.size,
        lineHeight: `${baseLine}px`, fontWeight: weight, color: c, whiteSpace: 'nowrap'}}>{u.base}</div>
    </>
  );
  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {block.rows.map((row, r) => (
        <div key={r} style={{display: 'flex', flexDirection: 'row', justifyContent: justify, height: block.lineH}}>
          {row.map((u, k) => {
            const s = state(u);
            const w = unitWidth(u, block.size, block.rubySize);
            return (
              <div key={k} style={{position: 'relative', width: w, height: block.lineH, opacity: s.vis, transform: `translateY(${s.dy - s.lift}px)`}}>
                {s.lit < 1 ? layer(u, dim, rubyDim) : null}
                {s.lit > 0 ? (
                  <div style={{position: 'absolute', inset: 0, clipPath: s.lit < 1 ? `inset(-40px ${(1 - s.lit) * 100}% -40px -40px)` : undefined}}>
                    {layer(u, lit, rubyLit)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** 圆形字标头像；说话时外圈跟音量鼓起 */
export const Avatar: React.FC<{letter?: string; bg: string; fg?: string; size?: number; level?: number; icon?: React.ReactNode}> = ({letter, bg, fg = '#fff', size = 56, level = 0, icon}) => (
  <div style={{position: 'relative', width: size, height: size, flex: 'none'}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: size, border: `4px solid ${bg}`, opacity: level > 0.02 ? 0.25 + 0.5 * level : 0,
      transform: `scale(${1.08 + 0.42 * level})`}} />
    <div style={{position: 'absolute', inset: 0, borderRadius: size, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: fg, fontFamily: font.zh, fontWeight: 600, fontSize: size * 0.5}}>{icon ?? letter}</div>
  </div>
);

/** 迷你声波条：整句音量包络，播放头扫过的格子变色 */
export const VoiceChip: React.FC<{env: number[]; progress: number; on: string; off: string; dur: number; textColor: string}> = ({env, progress, on, off, dur, textColor}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 4, height: 40}}>
      {env.map((v, i) => {
        const played = progress * env.length - i;
        const k = Math.max(0, Math.min(1, played));
        return (
          <div key={i} style={{width: 6, height: 6 + 32 * Math.pow(v, 0.8), borderRadius: 3, backgroundColor: k > 0.5 ? on : off}} />
        );
      })}
    </div>
    <div style={{fontFamily: font.zh, fontSize: 24, color: textColor, fontVariantNumeric: 'tabular-nums'}}>{`0:${String(Math.max(1, Math.round(dur))).padStart(2, '0')}`}</div>
  </div>
);

/* ── 图标（矢量，不用 emoji 字体） ── */

export const MicIcon: React.FC<{size?: number; color: string}> = ({size = 48, color: c}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <rect x={16} y={4} width={16} height={26} rx={8} fill={c} />
    <path d="M10 22 a14 14 0 0 0 28 0" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" />
    <line x1={24} y1={36} x2={24} y2={44} stroke={c} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

export const SendIcon: React.FC<{size?: number; color: string}> = ({size = 48, color: c}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M24 40 V10 M12 21 L24 9 L36 21" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SpeakerIcon: React.FC<{size?: number; color: string; level?: number}> = ({size = 44, color: c, level = 1}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M6 18 h9 l11 -9 v30 l-11 -9 h-9 z" fill={c} />
    <path d="M32 17 a9 9 0 0 1 0 14" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" opacity={0.4 + 0.6 * level} />
    <path d="M37 11 a17 17 0 0 1 0 26" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" opacity={0.2 + 0.8 * level} />
  </svg>
);

export const EarIcon: React.FC<{size?: number; color: string}> = ({size = 44, color: c}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M14 20 a11 11 0 0 1 22 0 c0 7 -6 8 -7 13 c-1 5 -4 9 -9 9 c-3 0 -5 -2 -5 -4" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" />
    <path d="M20 20 a5 5 0 0 1 10 0 c0 3 -3 4 -4 6" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

/** 啤酒杯（回应章、活动卡片用）：杯身琥珀、白泡沫带描边，浅底深底都看得清 */
export const Beer: React.FC<{size?: number; tilt?: number}> = ({size = 48, tilt = 0}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{transform: `rotate(${tilt}deg)`}}>
    <path d="M44 24 h6 a8 8 0 0 1 0 16 h-6" fill="none" stroke="#B87516" strokeWidth={5} />
    <rect x={12} y={20} width={34} height={38} rx={6} fill={color.amber} stroke="#B87516" strokeWidth={3} />
    <rect x={19} y={28} width={4} height={23} rx={2} fill="#F8DA97" />
    <rect x={29} y={28} width={4} height={23} rx={2} fill="#F8DA97" opacity={0.6} />
    <path d="M10 24 q-2 -9 7 -10 q3 -7 12 -5 q8 -6 14 1 q8 0 7 9 q0 5 -4 5 h-32 q-4 0 -4 0 z" fill="#FFFDF6" stroke="#D9C69C" strokeWidth={2.5} />
  </svg>
);
