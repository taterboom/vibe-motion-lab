import React from 'react';
import {Audio} from '@remotion/media';
import {Sequence} from 'remotion';
import ambience from './assets/sfx/ambience.mp3';
import clink from './assets/sfx/clink.mp3';
import key from './assets/sfx/key.mp3';
import pop from './assets/sfx/pop.mp3';
import strike from './assets/sfx/strike.mp3';
import tick from './assets/sfx/tick.mp3';
import type {Script} from './film/script';
import {FPS} from './theme';
import type {Segment} from './types';

/**
 * 音效层（气泡版）：环境声铺底、段 ② 压低；非说话的消息弹出一声 pop，
 * 犹豫打字的按键声、划掉的笔划声、倒计时 tick、发送答案、部长回应碰杯。
 * 音量都压在人声之下。出处见 assets/sfx/CREDITS.md
 */
const AMBIENCE = 0.1;
const AMBIENCE_DUCKED = 0.03;
const HOST: Segment['kind'][] = ['host', 'hostPause', 'play1', 'gap', 'play2', 'shadow'];

export const Sfx: React.FC<{segments: Segment[]; script: Script}> = ({segments, script}) => {
  const ambienceVolume = (frame: number) => {
    const t = frame / FPS;
    const level = (s?: Segment) => (s && HOST.includes(s.kind) ? AMBIENCE_DUCKED : AMBIENCE);
    const i = segments.findIndex((s) => t < s.start + s.dur);
    if (i < 0) return AMBIENCE;
    const k = Math.min(1, (t - segments[i].start) / 0.4);
    return level(segments[i - 1] ?? segments[i]) * (1 - k) + level(segments[i]) * k;
  };
  const hits: Array<{at: number; src: string; volume: number}> = [];
  for (const m of script.msgs) {
    if (m.at < 0) continue;
    // 说话的消息自带人声，不再叠 pop；主持人卡片、草稿、分隔条、正在输入 各一声
    if (m.kind === 'typing' && m.id !== 'typing2') hits.push({at: m.at, src: pop, volume: 0.22});
    if (m.kind === 'host' || m.kind === 'ghost' || m.kind === 'divider') hits.push({at: m.at, src: pop, volume: 0.3});
    if (m.id === 'target') hits.push({at: m.at, src: pop, volume: 0.26});
    if (m.strikeAt !== undefined) hits.push({at: m.strikeAt, src: strike, volume: 0.5});
  }
  for (const k of script.draft.times) hits.push({at: k, src: key, volume: 0.28});
  const cd = script.marks.countdown;
  if (cd) {
    const n = Math.max(1, Math.round(cd.dur));
    for (let k = 0; k < n; k++) hits.push({at: cd.start + (k * cd.dur) / n, src: tick, volume: 0.6});
  }
  const ans = script.marks.answer;
  if (ans) hits.push({at: Math.max(0, ans.start - 0.04), src: pop, volume: 0.3});
  const tap = script.msgs.find((m) => m.tapbackAt !== undefined)?.tapbackAt;
  if (tap !== undefined) hits.push({at: tap, src: clink, volume: 0.42});
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
