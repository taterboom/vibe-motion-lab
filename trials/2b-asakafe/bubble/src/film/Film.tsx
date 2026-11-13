import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx} from '../Sfx';
import {color, FPS} from '../theme';
import type {Episode, Segment} from '../types';
import {Chat} from './Chat';
import {Coach, Dock, Header, Stepper} from './Chrome';
import {buildScript} from './script';
import {useWaves} from './waves';

/** 青海波底纹：整片不动的纸面质感，很淡 */
const Pattern: React.FC = () => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <pattern id="seigaiha" width={120} height={60} patternUnits="userSpaceOnUse">
        {[0, 1].map((row) =>
          [-1, 0, 1].map((col) => {
            const cx = col * 120 + (row ? 60 : 0);
            const cy = row * 30 + 30;
            return [56, 42, 28].map((r) => (
              <path key={`${row}-${col}-${r}`} d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color.pattern} strokeWidth={2.5} />
            ));
          }),
        )}
      </pattern>
    </defs>
    <rect x={0} y={0} width={1080} height={1920} fill="url(#seigaiha)" opacity={0.55} />
  </svg>
);

/** 整片画面：一条不断的对话流 + 固定的头、步骤条、提示行、输入框。全部由全局帧算出 */
export const Film: React.FC<{episode: Episode; segments: Segment[]}> = ({episode, segments}) => {
  const frame = useCurrentFrame();
  const waves = useWaves() ?? {};
  const script = useMemo(() => buildScript(episode, segments, waves), [episode, segments, waves]);
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: color.bg}}>
      <Pattern />
      <Chat script={script} waves={waves} t={t} />
      <Header episode={episode} t={t} />
      <Stepper script={script} t={t} />
      <Coach script={script} t={t} />
      <Dock script={script} segments={segments} waves={waves} t={t} />
      <Sfx segments={segments} script={script} />
    </AbsoluteFill>
  );
};
