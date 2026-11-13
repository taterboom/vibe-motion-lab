import React from 'react';
import {Audio} from '@remotion/media';
import {Sequence} from 'remotion';
import ambience from './assets/sfx/ambience.mp3';
import clink from './assets/sfx/clink.mp3';
import pop from './assets/sfx/pop.mp3';
import tick from './assets/sfx/tick.mp3';
import {anchorsOf, clinkAt} from './perform';
import {FPS} from './theme';
import type {Segment} from './types';

/** 音效层：环境声铺底，段 ② 压低；「！」、卡片升起、倒计时、碰杯各一声，时间点和画面动作取同一个锚点。出处见 assets/sfx/CREDITS.md */
const AMBIENCE = 0.1;
const AMBIENCE_DUCKED = 0.03;
const HOST: Segment['kind'][] = ['host', 'hostPause', 'play1', 'gap', 'play2', 'shadow'];
/** clink.mp3 的击打点：文件里约 0.03 秒，加上 mp3 解码延迟，实测成片里比 Sequence 起点晚约 0.09 秒 */
const CLINK_LEAD = 0.09;

export const Sfx: React.FC<{segments: Segment[]}> = ({segments}) => {
  const A = anchorsOf(segments);
  const ambienceVolume = (frame: number) => {
    const t = frame / FPS;
    const level = (s?: Segment) => (s && HOST.includes(s.kind) ? AMBIENCE_DUCKED : AMBIENCE);
    const i = segments.findIndex((s) => t < s.start + s.dur);
    if (i < 0) return AMBIENCE;
    const k = Math.min(1, (t - segments[i].start) / 0.4);
    return level(segments[i - 1] ?? segments[i]) * (1 - k) + level(segments[i]) * k;
  };
  const hits: Array<{at: number; src: string; volume: number}> = [
    {at: A.ask + 2.78 + 0.28, src: pop, volume: 0.45}, // 「！」弹出
    {at: A.host + 0.4, src: pop, volume: 0.22}, // 卡片升起
  ];
  for (const s of segments) {
    if (s.kind === 'countdown') {
      const n = Math.max(1, Math.round(s.dur));
      for (let k = 0; k < n; k++) hits.push({at: s.start + (k * s.dur) / n, src: tick, volume: 0.6});
    }
  }
  hits.push({at: clinkAt(A) - CLINK_LEAD, src: clink, volume: 0.5});
  return (
    <>
      <Audio src={ambience} volume={ambienceVolume} />
      {hits.map((h, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(h.at * FPS))} durationInFrames={FPS * 2} name="音效" layout="none">
          <Audio src={h.src} volume={h.volume} />
        </Sequence>
      ))}
    </>
  );
};
