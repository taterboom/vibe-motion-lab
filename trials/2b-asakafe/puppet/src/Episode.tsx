import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Scene} from './Scene';
import {Sfx} from './Sfx';
import {Stage} from './Stage';
import {FPS, color} from './theme';
import {buildTimeline} from './timeline';
import type {EpisodeProps} from './types';

export const EpisodeVideo: React.FC<EpisodeProps> = ({dir, gaps, episode, clips}) => {
  const segments = useMemo(() => (clips ? buildTimeline(clips, gaps) : []), [clips, gaps]);
  if (!episode || !clips) {
    return <AbsoluteFill style={{backgroundColor: color.bg}} />;
  }
  return (
    <AbsoluteFill style={{backgroundColor: color.bg}}>
      {segments.map((s, i) => (
        <Sequence key={`${s.kind}-${i}`} name={s.label} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round(s.dur * FPS))}>
          {s.audio ? <Audio src={staticFile(`${dir}/${clips.clips[s.audio].file}`)} /> : null}
          <Scene segment={s} episode={episode} />
        </Sequence>
      ))}
      <Sfx segments={segments} />
      <Stage dir={dir} episode={episode} clips={clips} segments={segments} />
    </AbsoluteFill>
  );
};
