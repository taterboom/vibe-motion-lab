// 由 tools/prep_sprites.py 生成，不要手改

import bucho_body from './assets/chars/bucho/body.png';
import bucho_mouth_talk_a from './assets/chars/bucho/mouth_talk_a.png';
import bucho_mouth_talk_b from './assets/chars/bucho/mouth_talk_b.png';
import bucho_eyes_blink from './assets/chars/bucho/eyes_blink.png';
import bucho_eyes_laugh from './assets/chars/bucho/eyes_laugh.png';
import bucho_mouth_laugh from './assets/chars/bucho/mouth_laugh.png';
import you_body from './assets/chars/you/body.png';
import you_mouth_talk_a from './assets/chars/you/mouth_talk_a.png';
import you_mouth_talk_b from './assets/chars/you/mouth_talk_b.png';
import you_eyes_blink from './assets/chars/you/eyes_blink.png';
import you_eyes_surprised from './assets/chars/you/eyes_surprised.png';
import you_mouth_surprised from './assets/chars/you/mouth_surprised.png';
import you_eyes_troubled from './assets/chars/you/eyes_troubled.png';
import you_mouth_troubled from './assets/chars/you/mouth_troubled.png';
import you_eyes_happy from './assets/chars/you/eyes_happy.png';
import you_mouth_happy from './assets/chars/you/mouth_happy.png';

export type Box = {left: number; top: number; width: number; height: number};
export type SpriteSet = {width: number; height: number; body: string; eyesBox: Box; mouthBox: Box; eyes: Record<string, string>; mouth: Record<string, string>};

export const sprites: Record<string, SpriteSet> = {
  bucho: {width: 1024, height: 1536, body: bucho_body, eyesBox: {left: 370, top: 290, width: 310, height: 192}, mouthBox: {left: 385, top: 482, width: 275, height: 186}, eyes: {blink: bucho_eyes_blink, laugh: bucho_eyes_laugh}, mouth: {talk_a: bucho_mouth_talk_a, talk_b: bucho_mouth_talk_b, laugh: bucho_mouth_laugh}},
  you: {width: 1024, height: 1536, body: you_body, eyesBox: {left: 315, top: 285, width: 275, height: 140}, mouthBox: {left: 340, top: 425, width: 230, height: 183}, eyes: {blink: you_eyes_blink, surprised: you_eyes_surprised, troubled: you_eyes_troubled, happy: you_eyes_happy}, mouth: {talk_a: you_mouth_talk_a, talk_b: you_mouth_talk_b, surprised: you_mouth_surprised, troubled: you_mouth_troubled, happy: you_mouth_happy}},
};
