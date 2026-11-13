import {useEffect, useState} from 'react';
import {getAudioData} from '@remotion/media-utils';
import {continueRender, delayRender, staticFile} from 'remotion';
import type {Clips} from './types';

export type Wave = Awaited<ReturnType<typeof getAudioData>>;
export type Waves = Record<string, Wave> | null;

/** 一句音频在 t 秒附近（1/15 秒窗）的 RMS → 0–1 */
export const levelAt = (w: Wave | undefined, t: number) => {
  if (!w || t < 0) return 0;
  const ch = w.channelWaveforms[0];
  const from = Math.floor(t * w.sampleRate);
  const to = Math.min(ch.length, from + Math.floor(w.sampleRate / 15));
  if (to <= from) return 0;
  let sum = 0;
  for (let k = from; k < to; k++) sum += ch[k] * ch[k];
  return Math.min(1, Math.sqrt(sum / (to - from)) / 0.16);
};

/** 开口量：太小算闭嘴，量化成三档（纸偶换嘴） */
export const mouthOpen = (w: Wave | undefined, t: number) => {
  const v = levelAt(w, t);
  return v < 0.12 ? 0 : Math.ceil(v * 3) / 3;
};

/** 读入本集所有片段的波形；读完之前挂起渲染 */
export const useWaves = (dir: string, clips: Clips | null): Waves => {
  const [waves, setWaves] = useState<Waves>(null);
  const [handle] = useState(() => delayRender('load clip waveforms'));
  useEffect(() => {
    if (!clips) {
      continueRender(handle);
      return;
    }
    const tags = Object.keys(clips.clips);
    Promise.all(tags.map((tag) => getAudioData(staticFile(`${dir}/${clips.clips[tag].file}`))))
      .then((list) => setWaves(Object.fromEntries(tags.map((tag, k) => [tag, list[k]]))))
      .catch((e) => console.error('waveform load failed, mouths stay closed', e))
      .finally(() => continueRender(handle));
  }, [dir, clips, handle]);
  return waves;
};
