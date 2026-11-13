import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from './anim';
import {FPS, color, font, mix, slot} from './theme';
import type {Segment, SegmentKind} from './types';

const PHASES: Array<{label: string; kinds: SegmentKind[]}> = [
  {label: '① 被夸了', kinds: ['ask', 'wait']},
  {label: '② 学一句', kinds: ['host', 'hostPause', 'play1', 'gap', 'play2', 'shadow']},
  {label: '③ 你来答', kinds: ['ask2', 'countdown', 'answer', 'beforeReact', 'react', 'tail']},
];

/** 顶栏：栏目名 + 三段进度。当前段高亮，切段时 0.3s 过渡；版式全片不变 */
export const Header: React.FC<{segments: Segment[]}> = ({segments}) => {
  const t = useCurrentFrame() / FPS;
  const starts = PHASES.map((p) => segments.find((s) => p.kinds.includes(s.kind))?.start ?? 0);
  const on = (i: number) => {
    const a = i === 0 ? 1 : ease.inOut(prog(t, starts[i], starts[i] + 0.3));
    const b = i + 1 < starts.length ? ease.inOut(prog(t, starts[i + 1], starts[i + 1] + 0.3)) : 0;
    return a * (1 - b);
  };
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: slot.brand, textAlign: 'center', fontFamily: font.ja, fontSize: 40, fontWeight: 700, color: color.ink, letterSpacing: 4}}>
        日本語の朝カフェ
        <span style={{marginLeft: 18, fontSize: 26, fontWeight: 600, color: color.muted, letterSpacing: 1}}>#001</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: slot.progress, display: 'flex', justifyContent: 'center', gap: 14}}>
        {PHASES.map((p, i) => {
          const k = on(i);
          const done = t >= (starts[i + 1] ?? Infinity) ? 1 : 0;
          return (
            <div key={p.label} style={{width: 220, padding: '9px 0', textAlign: 'center', borderRadius: 999, fontFamily: font.zh, fontSize: 28, fontWeight: 700,
              backgroundColor: mix(done ? '#E7DBC2' : '#EADFC8', color.accent, k), color: mix(color.muted, '#FFF8EC', k), transform: `scale(${1 + 0.05 * k})`}}>
              {p.label}
            </div>
          );
        })}
      </div>
    </>
  );
};
