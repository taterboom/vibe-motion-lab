import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Captions} from './Captions';
import {Header} from './Header';
import {Sfx} from './Sfx';
import {Stage} from './Stage';
import {FPS, color} from './theme';
import {buildTimeline} from './timeline';
import type {EpisodeProps} from './types';
import {useWaves} from './waves';

/** 一集：每段一个 <Sequence> 只放音频；画面（顶栏 / 舞台 / 字幕区）整集常驻，按全片时间演 */
export const EpisodeVideo: React.FC<EpisodeProps> = ({dir, gaps, episode, clips}) => {
  const segments = useMemo(() => (clips ? buildTimeline(clips, gaps) : []), [clips, gaps]);
  const waves = useWaves(dir, clips);
  if (!episode || !clips) {
    return <AbsoluteFill style={{backgroundColor: color.bg}} />;
  }
  return (
    <AbsoluteFill style={{backgroundColor: color.bg}}>
      {segments.map((s, i) =>
        s.audio ? (
          <Sequence key={`${s.kind}-${i}`} name={s.label} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round(s.dur * FPS))} layout="none">
            <Audio src={staticFile(`${dir}/${clips.clips[s.audio].file}`)} />
          </Sequence>
        ) : null,
      )}
      <Sfx segments={segments} />
      <Header segments={segments} />
      <Stage episode={episode} segments={segments} waves={waves} />
      <Captions episode={episode} segments={segments} waves={waves} />
    </AbsoluteFill>
  );
};
