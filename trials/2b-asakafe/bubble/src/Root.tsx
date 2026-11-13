import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {z} from 'zod';
import {EpisodeVideo} from './Episode';
import {FPS, H, W} from './theme';
import {buildTimeline, defaultGaps, totalDuration} from './timeline';
import type {Clips, Episode, EpisodeProps} from './types';

const sec = (d: string) => z.number().min(0).max(10).step(0.1).describe(d);

/** Studio 右侧参数面板：dir 切集，gaps 调各环节留白（秒） */
export const episodeSchema = z.object({
  dir: z.string().describe('out/ 下的目录名，如 ep001_m'),
  gaps: z.object({
    afterAsk: sec('① 问完等你反应'),
    hostPlaceholder: sec('没有主角音频时的占位'),
    afterHost: sec('② 主角问完到答案'),
    betweenPlays: sec('② 两遍之间'),
    shadow: sec('② 跟读留白'),
    countdown: sec('③ 倒计时'),
    beforeReact: sec('③ 参考答案到对方反应'),
    tail: sec('片尾停留'),
  }),
  episode: z.any().nullable(),
  clips: z.any().nullable(),
});

/** 从 public（= out/）读一集的台词和片段时长，按时间线总长定帧数 */
const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props, abortSignal}) => {
  const get = async <T,>(name: string): Promise<T> => {
    const r = await fetch(staticFile(`${props.dir}/${name}`), {signal: abortSignal});
    if (!r.ok) throw new Error(`${props.dir}/${name}: ${r.status}`);
    return (await r.json()) as T;
  };
  const [episode, clips] = await Promise.all([get<Episode>('_episode.json'), get<Clips>('_clips.json')]);
  const total = totalDuration(buildTimeline(clips, props.gaps));
  return {durationInFrames: Math.max(1, Math.ceil(total * FPS)), props: {...props, episode, clips}};
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Episode"
    component={EpisodeVideo}
    schema={episodeSchema}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={30 * FPS}
    defaultProps={{dir: 'ep001_f', gaps: defaultGaps, episode: null, clips: null}}
    calculateMetadata={calculateMetadata}
  />
);
