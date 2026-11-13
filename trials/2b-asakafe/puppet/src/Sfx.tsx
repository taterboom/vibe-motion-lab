import React from 'react';
import {Audio} from '@remotion/media';
import {Sequence} from 'remotion';
import ambience from './assets/sfx/ambience.mp3';
import clink from './assets/sfx/clink.mp3';
import pop from './assets/sfx/pop.mp3';
import tick from './assets/sfx/tick.mp3';
import {FPS} from './theme';
import type {Segment} from './types';

/** 音效层：环境声铺底，段 ② 压低；符号弹出、倒计时、碰杯各一声。出处见 assets/sfx/CREDITS.md */
const AMBIENCE = 0.1;
const AMBIENCE_DUCKED = 0.03;
const HOST: Segment['kind'][] = ['host', 'hostPause', 'play1', 'gap', 'play2', 'shadow'];

export const Sfx: React.FC<{segments: Segment[]}> = ({segments}) => {
  const ambienceVolume = (frame: number) => {
    const t = frame / FPS;
    const level = (s?: Segment) => (s && HOST.includes(s.kind) ? AMBIENCE_DUCKED : AMBIENCE);
    const i = segments.findIndex((s) => t < s.start + s.dur);
    if (i < 0) return AMBIENCE;
    // 环节交界处用 0.4 秒过渡
    const k = Math.min(1, (t - segments[i].start) / 0.4);
    return level(segments[i - 1] ?? segments[i]) * (1 - k) + level(segments[i]) * k;
  };
  const hits: Array<{at: number; src: string; volume: number}> = [];
  for (const s of segments) {
    if (s.kind === 'wait' || s.kind === 'host') hits.push({at: s.start, src: pop, volume: 0.5});
    if (s.kind === 'countdown') {
      const n = Math.max(1, Math.round(s.dur));
      for (let k = 0; k < n; k++) hits.push({at: s.start + (k * s.dur) / n, src: tick, volume: 0.6});
    }
    if (s.kind === 'react') hits.push({at: s.start + 0.35, src: clink, volume: 0.45});
  }
  return (
    <>
      <Audio src={ambience} volume={ambienceVolume} />
      {hits.map((h, i) => (
        <Sequence key={i} from={Math.round(h.at * FPS)} durationInFrames={FPS * 2} name="音效" layout="none">
          <Audio src={h.src} volume={h.volume} />
        </Sequence>
      ))}
    </>
  );
};
