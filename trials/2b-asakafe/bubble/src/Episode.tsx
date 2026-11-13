import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Film} from './film/Film';
import {WavesProvider} from './film/waves';
import {FPS, color} from './theme';
import {buildTimeline} from './timeline';
import type {EpisodeProps} from './types';

/** 声音按时间线逐段播（每段一个 Sequence + Audio，和基线一致）；画面是一整条由全局帧驱动的对话流 */
export const EpisodeVideo: React.FC<EpisodeProps> = ({dir, gaps, episode, clips}) => {
  const segments = useMemo(() => (clips ? buildTimeline(clips, gaps) : []), [clips, gaps]);
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
      <WavesProvider dir={dir} clips={clips}>
        <Film episode={episode} segments={segments} />
      </WavesProvider>
    </AbsoluteFill>
  );
};
