import React from 'react';
import {IzakayaBack, IzakayaTable, PaintedBack, PaintedTable} from './Izakaya';
import {KonbiniBack, KonbiniFront} from './Konbini';
import {OfficeBack, OfficeFront} from './Office';
import {stage} from './theme';

/** 铺满场景画框的 SVG 图层 */
export const Layer: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg viewBox="0 0 1008 800" width={stage.width} height={stage.height} style={{position: 'absolute', left: 0, top: 0}}>
    {children}
  </svg>
);

/** 一个场景 = 人物后面一层 + 人物前面一层（桌子、柜台）。seatY 是坐着的人的底边位置，被前面那层挡住 */
export type SceneDef = {
  Back: React.FC<{frame: number; variant?: string}>;
  Front: React.FC;
  seatY: number;
};

const vector = (Back: React.FC<{frame: number; variant?: string}>, Front: React.FC, seatY = 720): SceneDef => ({
  Back: (p) => <Layer><Back {...p} /></Layer>,
  Front: () => <Layer><Front /></Layer>,
  seatY,
});

/** 场景库。tts/epNNN.json 的 stage.scene 写这里的键 */
export const scenes: Record<string, SceneDef> = {
  izakaya: vector(({frame}) => <IzakayaBack sway={Math.sin(frame / 40) * 2.5} />, IzakayaTable),
  office: vector(OfficeBack, OfficeFront),
  konbini: vector(KonbiniBack, KonbiniFront),
  // 手绘风位图版居酒屋（图像模型出图），留作对比
  izakaya_painted: {Back: () => <PaintedBack />, Front: () => <PaintedTable />, seatY: 720},
};
