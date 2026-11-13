import React from 'react';
import {Img} from 'remotion';
import type {Box, SpriteSet} from './sprites.gen';

/** 位图立绘人物：一张身体垫底，眼部、嘴部各叠一张贴片来换表情。贴片全部常驻，只切透明度，换的时候不用等加载 */
export const Sprite: React.FC<{
  set: SpriteSet;
  left: number;
  top: number;
  scale: number;
  eyes?: string;       // 眼部贴片名；不给就是基准图的眼睛
  mouth?: string;      // 嘴部贴片名；不给就是基准图的嘴
  transform?: string;  // 以底边中点为轴
}> = ({set, left, top, scale, eyes, mouth, transform}) => (
  <div style={{position: 'absolute', left, top, width: set.width * scale, height: set.height * scale, transformOrigin: '50% 100%', transform,
    filter: 'drop-shadow(0 8px 14px rgba(40, 20, 8, 0.4)) sepia(0.14) brightness(0.96)'}}>
    <Img src={set.body} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
    <Patches box={set.eyesBox} images={set.eyes} active={eyes} scale={scale} />
    <Patches box={set.mouthBox} images={set.mouth} active={mouth} scale={scale} />
  </div>
);

const Patches: React.FC<{box: Box; images: Record<string, string>; active?: string; scale: number}> = ({box, images, active, scale}) => (
  <>
    {Object.entries(images).map(([name, src]) => (
      <Img key={name} src={src} style={{position: 'absolute', left: box.left * scale, top: box.top * scale, width: box.width * scale, height: box.height * scale, opacity: name === active ? 1 : 0}} />
    ))}
  </>
);
