import React, {createContext, useContext, useEffect, useState} from 'react';
import {getAudioData, type MediaUtilsAudioData} from '@remotion/media-utils';
import {continueRender, delayRender, staticFile} from 'remotion';
import type {Clips} from '../types';

export type Wave = MediaUtilsAudioData;

const Ctx = createContext<Record<string, Wave> | null>(null);
export const useWaves = () => useContext(Ctx);

/** 读入本集所有台词的波形；读完之前挂起渲染（文字对齐、声波都靠它） */
export const WavesProvider: React.FC<{dir: string; clips: Clips; children: React.ReactNode}> = ({dir, clips, children}) => {
  const [waves, setWaves] = useState<Record<string, Wave> | null>(null);
  const [handle] = useState(() => delayRender('load clip waveforms'));
  useEffect(() => {
    const tags = Object.keys(clips.clips);
    Promise.all(tags.map((tag) => getAudioData(staticFile(`${dir}/${clips.clips[tag].file}`))))
      .then((list) => setWaves(Object.fromEntries(tags.map((tag, k) => [tag, list[k]]))))
      .catch((e) => {
        console.error('waveform load failed', e);
        setWaves({});
      })
      .finally(() => continueRender(handle));
  }, [dir, clips, handle]);
  return <Ctx.Provider value={waves}>{waves ? children : null}</Ctx.Provider>;
};
