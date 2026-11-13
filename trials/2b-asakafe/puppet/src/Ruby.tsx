import React from 'react';
import {color, font, mix} from './theme';
import type {Cap} from './script';

type Props = {
  cap: Cap;
  filled: number; // 扫亮到第几个字（小数）
  size: number;
  rubySize?: number;
  hi?: string; // 扫亮色
  base?: string;
  hiMix?: number; // 1 = 高亮色，0 = 退回底色（gap 时高亮淡出）
  family?: string;
  weight?: number;
  lineGap?: number;
  lift?: boolean; // 正在唱的字轻轻上浮
};

/** 带注音的卡拉 OK 文字：逐字按 filled 从左到右填色，注音跟着它的汉字一起变色 */
export const Ruby: React.FC<Props> = ({cap, filled, size, rubySize = Math.round(size * 0.4), hi = color.accent, base = color.ink, hiMix = 1, family = font.ja, weight = 700, lineGap = 0, lift = false}) => {
  const hiC = mix(base, hi, hiMix);
  let idx = 0;
  const charSpan = (ch: string, i: number) => {
    const p = Math.max(0, Math.min(1, filled - i));
    const cur = lift && p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0;
    const style: React.CSSProperties =
      p <= 0 ? {color: base} : p >= 1 ? {color: hiC} : {
        backgroundImage: `linear-gradient(90deg, ${hiC} ${p * 100}%, ${base} ${p * 100}%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      };
    return (
      <span key={i} style={{...style, display: 'inline-block', transform: cur ? `translateY(${-cur * size * 0.07}px)` : undefined}}>
        {ch}
      </span>
    );
  };
  return (
    <div style={{fontFamily: family, fontSize: size, fontWeight: weight, lineHeight: 1, textAlign: 'center'}}>
      {cap.lines.map((line, li) => (
        <div key={li} style={{marginTop: li ? lineGap : 0, paddingTop: rubySize * 1.25, whiteSpace: 'nowrap'}}>
          {line.map((tok, ti) => {
            const start = idx;
            const chars = [...tok.t].map((c) => charSpan(c, idx++));
            if (!tok.r) return <React.Fragment key={ti}>{chars}</React.Fragment>;
            const tokP = Math.max(0, Math.min(1, (filled - start) / tok.t.length));
            return (
              <ruby key={ti} style={{rubyPosition: 'over'}}>
                {chars}
                <rt style={{fontSize: rubySize, fontWeight: 500, color: tokP > 0.5 ? hiC : color.muted, letterSpacing: 1, transform: 'translateY(-4px)'}}>{tok.r}</rt>
              </ruby>
            );
          })}
        </div>
      ))}
    </div>
  );
};
