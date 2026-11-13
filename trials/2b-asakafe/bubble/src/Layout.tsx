import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {PAD, cjkWrap, color, font, slot} from './theme';

type Props = {
  phase?: string;                 // 顶部环节标签
  main?: React.ReactNode;         // 主句
  mainFamily?: string;
  mainSize?: number;
  mainWeight?: number;
  sub?: string;                   // 释义
  cue?: React.ReactNode;          // 跟读提示
  hook?: string;                  // 一行字
  foot?: string;                  // 底部标题
  fade?: boolean;                 // 主文字区进场淡入
};

/** 全片唯一的版式：底色、栏目名、固定槽位 */
export const Layout: React.FC<Props> = ({phase, main, mainFamily = font.ja, mainSize = 64, mainWeight = 600, sub, cue, hook, foot, fade = true}) => {
  const frame = useCurrentFrame();
  const opacity = fade ? interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  return (
    <AbsoluteFill style={{backgroundColor: color.bg}}>
      <Line top={slot.brand} family={font.ja} size={36} weight={600} color={color.muted}>朝カフェ</Line>
      {phase ? <Line top={slot.phase} family={font.zh} size={40} color={color.muted}>{phase}</Line> : null}
      <div style={{position: 'absolute', left: PAD, right: PAD, top: slot.mainTop, height: slot.mainHeight,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity}}>
        {main ? <div style={{fontFamily: mainFamily, fontSize: mainSize, fontWeight: mainWeight, color: color.ink, lineHeight: 1.35, ...cjkWrap}}>{main}</div> : null}
        {sub ? <div style={{marginTop: 28, fontFamily: font.zh, fontSize: 40, color: color.muted, lineHeight: 1.4, ...cjkWrap}}>{sub}</div> : null}
      </div>
      {cue ? <div style={{position: 'absolute', left: 0, right: 0, top: slot.cue, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, fontFamily: font.zh, fontSize: 42, color: color.accent}}>{cue}</div> : null}
      {hook ? <Line top={slot.hook} family={font.zh} size={44} color={color.accent}>{hook}</Line> : null}
      {foot ? <Line top={slot.foot} family={font.zh} size={32} color={color.muted}>{foot}</Line> : null}
    </AbsoluteFill>
  );
};

const Line: React.FC<{top: number; family: string; size: number; weight?: number; color: string; children: React.ReactNode}> = ({top, family, size, weight, color: c, children}) => (
  <div style={{position: 'absolute', left: PAD, right: PAD, top, textAlign: 'center', fontFamily: family, fontSize: size, fontWeight: weight ?? 400, color: c, lineHeight: 1.4, ...cjkWrap}}>
    {children}
  </div>
);

export const PlayCue: React.FC = () => (
  <>
    <svg width="30" height="36" viewBox="0 0 30 36"><polygon points="0,0 30,18 0,36" fill={color.accent} /></svg>
    <span>跟读</span>
  </>
);
