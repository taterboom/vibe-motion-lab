import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Layout, PlayCue} from './Layout';
import {ja, pick, zh, clean} from './text';
import {font} from './theme';
import type {Episode, Segment} from './types';

/** 一段 → 一屏。所有分支都走同一个 Layout，只换槽位内容 */
export const Scene: React.FC<{segment: Segment; episode: Episode}> = ({segment: s, episode}) => {
  const foot = episode.title;
  const target = ja(episode, 'target_normal');
  const long = target.length > 20;
  switch (s.kind) {
    case 'ask':
      return <Layout phase={`① ${episode.scene ?? ''}`} main={ja(episode, 'ask')} sub={zh(episode, 'ask')} mainSize={ja(episode, 'ask').length > 28 ? 56 : 64} foot={foot} />;
    case 'wait':
      return <Layout phase={`① ${episode.scene ?? ''}`} main={<Dots />} foot={foot} fade={false} />;
    case 'host':
    case 'hostPause':
      return <Layout phase="②" main={clean(pick(episode, 'q')?.text ?? '')} mainFamily={font.zh} mainSize={60} mainWeight={400} foot={foot} fade={s.kind === 'host'} />;
    case 'play1':
    case 'gap':
    case 'play2':
    case 'shadow':
      return <Layout phase="②" main={target} sub={zh(episode, 'target_normal')} mainSize={long ? 64 : 72}
        cue={s.kind === 'shadow' ? <PlayCue /> : undefined} hook={episode.hook} foot={foot} fade={s.kind === 'play1'} />;
    case 'ask2':
      return <Layout phase="③ 再来一遍，你来答" foot={foot} />;
    case 'countdown':
      return <Layout phase="③ 你来答" main={<Count seconds={s.dur} />} fade={false} foot={foot} />;
    case 'answer':
      return <Layout phase="③ 参考答案" main={target} mainSize={long ? 64 : 72} foot={foot} />;
    case 'beforeReact':
      return <Layout phase="③ 参考答案" main={target} mainSize={long ? 64 : 72} foot={foot} fade={false} />;
    case 'react':
      return <Layout phase="③" main={ja(episode, s.tag ?? 'react')} sub={zh(episode, s.tag ?? 'react')} foot={foot} />;
    case 'tail':
      return <Layout phase="③" foot={foot} fade={false} />;
    default:
      return <Layout foot={foot} />;
  }
};

/** ① 之后：对方在等你，点逐个出现 */
const Dots: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.min(3, Math.floor(interpolate(frame, [0, 30], [1, 4], {extrapolateRight: 'clamp'})));
  return <span style={{letterSpacing: 10, fontSize: 80}}>{'・'.repeat(n)}</span>;
};

/** ③ 倒计时：每秒换一个数字，弹一下 */
const Count: React.FC<{seconds: number}> = ({seconds}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = Math.max(1, Math.round(seconds));
  const per = (seconds * fps) / n;
  const idx = Math.min(n - 1, Math.floor(frame / per));
  const scale = spring({frame: frame - idx * per, fps, config: {damping: 12, stiffness: 160}, from: 0.6, to: 1});
  return <span style={{display: 'inline-block', fontSize: 220, fontWeight: 700, transform: `scale(${scale})`}}>{n - idx}</span>;
};
