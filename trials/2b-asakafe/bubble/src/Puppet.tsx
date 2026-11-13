import React from 'react';
import type {Expr} from './types';

/** 纸偶式人物：身体是固定图形，表情、嘴形、眨眼、手臂位置由参数决定。原点在座位底部中心，向上为负 */

export type {Expr};
export type Pt = [number, number];
export type Arm = {elbow: Pt; hand: Pt};

export type Look = {
  skin: string;
  hair: string;
  hairStyle: 'bucho' | 'youM' | 'youF' | 'ponytail';
  top: string;        // 上衣
  inner?: string;     // 开衫里的内搭
  tie?: string;
  glasses?: boolean;
  cheek: number;      // 腮红浓度 0–1
};

export const looks: Record<string, Look> = {
  bucho: {skin: '#F6CDA8', hair: '#4B4643', hairStyle: 'bucho', top: '#FAF6EE', tie: '#A8483A', glasses: true, cheek: 0.85},
  youM: {skin: '#F8D5B5', hair: '#3A2A22', hairStyle: 'youM', top: '#3F5B7A', inner: '#F4EFE6', cheek: 0.45},
  youF: {skin: '#F8D5B5', hair: '#3A2A22', hairStyle: 'youF', top: '#D49A3A', inner: '#F4EFE6', cheek: 0.55},
  clerk: {skin: '#F9D9BC', hair: '#5A3A2A', hairStyle: 'ponytail', top: '#2F7F86', inner: '#F4EFE6', cheek: 0.5},
};

const INK = '#2B2420';
const MOUTH = '#7A2E2A';
const SHOULDER_X = 98;
const SHOULDER_Y = -222;
export const restArm = (side: -1 | 1): Arm => ({elbow: [side * 128, -100], hand: [side * 84, -8]});

type Props = {
  look: Look;
  x: number;
  y: number;
  scale?: number;
  face: -1 | 1;            // 脸朝哪边
  expr: Expr;
  mouth: number;           // 0 = 不在说话；说话时 0–1 的开口量
  blink: boolean;
  bob?: number;            // 身体上下浮动（像素）
  lean?: number;           // 身体倾斜（度）
  tilt?: number;           // 头倾斜（度）
  armL?: Arm;
  armR?: Arm;
  holding?: {side: -1 | 1; item: 'beer' | 'coffee'};
};

export const Puppet: React.FC<Props> = ({look, x, y, scale = 1, face, expr, mouth, blink, bob = 0, lean = 0, tilt = 0, armL = restArm(-1), armR = restArm(1), holding}) => {
  const fx = face * 12;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale}) rotate(${lean})`}>
      {look.hairStyle === 'youF' ? <rect x={-124} y={-490} width={248} height={262} rx={110} fill={look.hair} /> : null}
      {look.hairStyle === 'ponytail' ? <ellipse cx={-face * 104} cy={-400} rx={40} ry={74} fill={look.hair} transform={`rotate(${face * 14} ${-face * 104} -400)`} /> : null}
      {/* 躯干 */}
      <path d="M -115 0 L -115 -180 Q -115 -250 -50 -258 L 50 -258 Q 115 -250 115 -180 L 115 0 Z" fill={look.top} />
      {look.inner ? <path d="M -42 -258 L 42 -258 L 0 -168 Z" fill={look.inner} /> : null}
      {look.tie ? (
        <>
          <path d="M -46 -258 L 0 -228 L -18 -206 Z M 46 -258 L 0 -228 L 18 -206 Z" fill="#E6E0D4" />
          <path d="M -11 -232 L 11 -232 L 17 -150 L 0 -124 L -17 -150 Z" fill={look.tie} transform="rotate(5 0 -232)" />
        </>
      ) : null}
      <rect x={-22} y={-290} width={44} height={44} fill={look.skin} />
      {/* 头 */}
      <g transform={`translate(0 -285) rotate(${tilt})`}>
        <circle cx={-104} cy={-88} r={18} fill={look.skin} />
        <circle cx={104} cy={-88} r={18} fill={look.skin} />
        <ellipse cx={0} cy={-95} rx={108} ry={100} fill={look.skin} />
        <Hair look={look} />
        <circle cx={fx - 66} cy={-60} r={21} fill="#F08A7C" opacity={look.cheek * 0.6} />
        <circle cx={fx + 66} cy={-60} r={21} fill="#F08A7C" opacity={look.cheek * 0.6} />
        <Eye cx={fx - 40} expr={expr} blink={blink} side={-1} />
        <Eye cx={fx + 40} expr={expr} blink={blink} side={1} />
        {look.glasses ? (
          <g fill="rgba(255,255,255,0.18)" stroke={INK} strokeWidth={5}>
            <rect x={fx - 68} y={-116} width={56} height={44} rx={14} />
            <rect x={fx + 12} y={-116} width={56} height={44} rx={14} />
            <path d={`M ${fx - 12} -96 L ${fx + 12} -96`} fill="none" />
          </g>
        ) : null}
        <Mouth cx={fx} expr={expr} open={mouth} />
      </g>
      {/* 手臂：粗线条当袖子，圆当手 */}
      <Limb side={-1} arm={armL} look={look} item={holding?.side === -1 ? holding.item : undefined} />
      <Limb side={1} arm={armR} look={look} item={holding?.side === 1 ? holding.item : undefined} />
    </g>
  );
};

const Hair: React.FC<{look: Look}> = ({look}) => {
  if (look.hairStyle === 'bucho') {
    return (
      <>
        <path d="M -109 -100 Q -116 -206 0 -204 Q 116 -206 109 -100 Q 92 -150 44 -160 Q -30 -172 -109 -100 Z" fill={look.hair} />
        <path d="M -109 -100 Q -112 -128 -100 -146 L -92 -98 Z M 109 -100 Q 112 -128 100 -146 L 92 -98 Z" fill="#9B9590" />
      </>
    );
  }
  return <path d="M -113 -84 Q -128 -216 0 -213 Q 128 -216 113 -84 Q 104 -134 72 -142 Q 30 -120 -18 -152 Q -72 -136 -113 -84 Z" fill={look.hair} />;
};

const Eye: React.FC<{cx: number; expr: Expr; blink: boolean; side: -1 | 1}> = ({cx, expr, blink, side}) => {
  const y = -92;
  const brow =
    expr === 'troubled' ? `M ${cx - 14 * side} -126 L ${cx + 14 * side} -118`
    : expr === 'surprised' ? `M ${cx - 14} -134 Q ${cx} -142 ${cx + 14} -134`
    : `M ${cx - 14} -124 Q ${cx} -130 ${cx + 14} -124`;
  return (
    <>
      <path d={brow} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.75} />
      {expr === 'happy' ? (
        <path d={`M ${cx - 13} ${y + 4} Q ${cx} ${y - 12} ${cx + 13} ${y + 4}`} stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
      ) : blink ? (
        <path d={`M ${cx - 12} ${y + 2} L ${cx + 12} ${y + 2}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx={cx} cy={y} rx={expr === 'surprised' ? 10 : 9} ry={expr === 'surprised' ? 14 : 11} fill={INK} />
          <circle cx={cx + 3} cy={y - 4} r={3} fill="#fff" />
        </>
      )}
    </>
  );
};

const Mouth: React.FC<{cx: number; expr: Expr; open: number}> = ({cx, expr, open}) => {
  if (open > 0) {
    const rx = 15 + 5 * open;
    const ry = 4 + 15 * open;
    return (
      <>
        <ellipse cx={cx} cy={-44} rx={rx} ry={ry} fill={MOUTH} />
        {open > 0.5 ? <ellipse cx={cx} cy={-44 + ry * 0.5} rx={rx * 0.6} ry={ry * 0.4} fill="#E0766F" /> : null}
      </>
    );
  }
  const line = {stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none'};
  switch (expr) {
    case 'happy':
      return <path d={`M ${cx - 21} -56 Q ${cx} -20 ${cx + 21} -56 Z`} fill={MOUTH} />;
    case 'surprised':
      return <ellipse cx={cx} cy={-44} rx={8} ry={10} fill={MOUTH} />;
    case 'troubled':
      return <path d={`M ${cx - 14} -42 Q ${cx - 5} -52 ${cx + 2} -44 Q ${cx + 8} -38 ${cx + 14} -46`} {...line} />;
    case 'smile':
      return <path d={`M ${cx - 17} -52 Q ${cx} -34 ${cx + 17} -52`} {...line} />;
    default:
      return <path d={`M ${cx - 11} -46 Q ${cx} -42 ${cx + 11} -46`} {...line} />;
  }
};

const Limb: React.FC<{side: -1 | 1; arm: Arm; look: Look; item?: 'beer' | 'coffee'}> = ({side, arm, look, item}) => {
  const [ex, ey] = arm.elbow;
  const [hx, hy] = arm.hand;
  return (
    <>
      <path d={`M ${side * SHOULDER_X} ${SHOULDER_Y} L ${ex} ${ey} L ${hx} ${hy}`} stroke={look.top} strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {item === 'beer' ? <Mug x={hx} y={hy} side={side} /> : null}
      {item === 'coffee' ? <PaperCup x={hx} y={hy} /> : null}
      <circle cx={hx} cy={hy} r={25} fill={look.skin} />
    </>
  );
};

/** 生啤杯，握在手里 */
export const Mug: React.FC<{x: number; y: number; side?: -1 | 1; level?: number}> = ({x, y, side = 1, level = 0.8}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M ${-side * 30} -78 q ${-side * 34} 4 ${-side * 34} 34 q 0 30 ${side * 34} 34`} stroke="#F3EEE4" strokeWidth={10} fill="none" />
    <rect x={-32} y={-100} width={64} height={112} rx={9} fill="#F3EEE4" />
    <rect x={-26} y={-94 + 100 * (1 - level)} width={52} height={100 * level} rx={5} fill="#F0B23A" />
    <rect x={-36} y={-116 + 100 * (1 - level)} width={72} height={30} rx={15} fill="#FFFDF7" />
    <rect x={-18} y={-70} width={7} height={56} rx={3.5} fill="#fff" opacity={0.5} />
  </g>
);

/** 纸杯咖啡，握在手里 */
export const PaperCup: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -26 -72 L 26 -72 L 20 14 L -20 14 Z" fill="#FFFDF7" />
    <path d="M -24 -44 L 24 -44 L 22 -14 L -22 -14 Z" fill="#B98B5E" />
    <rect x={-30} y={-84} width={60} height={14} rx={6} fill="#5A4636" />
  </g>
);
