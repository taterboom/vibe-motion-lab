import React from 'react';

/** 纸偶式人物（矢量扁平）。原点在座位底部中心，向上为负。所有姿态由 PoseState 决定，组件本身无状态 */

export type Pt = [number, number];

export type Look = {
  skin: string;
  hair: string;
  hairStyle: 'bucho' | 'youF';
  top: string;
  inner?: string;
  tie?: string;
  glasses?: boolean;
  cheek: number;
};

export const looks: Record<string, Look> = {
  bucho: {skin: '#F6CDA8', hair: '#4B4643', hairStyle: 'bucho', top: '#FAF6EE', tie: '#A8483A', glasses: true, cheek: 0.85},
  youF: {skin: '#F8D5B5', hair: '#3A2A22', hairStyle: 'youF', top: '#D49A3A', inner: '#F4EFE6', cheek: 0.55},
};

export type MouthShape = 'neutral' | 'smile' | 'grin' | 'o' | 'wavy';

export type ArmState = {hand: Pt; palm?: number; palmRot?: number};
export type MugState = {side: -1 | 1; tilt: number; slosh: number; level: number};

export type PoseState = {
  turn: number; // -1 朝左 … +1 朝右，五官横移
  sx: number;
  sy: number;
  lean: number; // 度，绕座位点
  bob: number;
  head: {tilt: number; nod: number; dx: number; dy: number};
  eye: {open: number; lookX: number; lookY: number; wide: number; happy: number};
  brow: {raise: number; worry: number};
  mouth: {open: number; shape: MouthShape};
  blush: number;
  sweat: number[]; // 每滴汗的进度 0–1，范围外不画
  hairLag: number;
  armL: ArmState;
  armR: ArmState;
  mug?: MugState;
};

const INK = '#2B2420';
/** 袖子比衣身深一点，手臂压在身体前面时也分得清 */
const sleeve = (c: string) => {
  const p = (i: number) => Math.round(parseInt(c.slice(1 + i * 2, 3 + i * 2), 16) * 0.9).toString(16).padStart(2, '0');
  return '#' + p(0) + p(1) + p(2);
};
const MOUTH = '#7A2E2A';
const SHOULDER: Pt = [98, -222];
const L1 = 122;
const L2 = 112;

/** 两段 IK：给手的位置，求肘。肘总往外、往下弯 */
const elbowFor = (side: -1 | 1, hand: Pt): Pt => {
  const sx = side * SHOULDER[0];
  const sy = SHOULDER[1];
  const dx = hand[0] - sx;
  const dy = hand[1] - sy;
  const d = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 0.5, Math.hypot(dx, dy)));
  const th = Math.atan2(dy, dx);
  const a = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const c1: Pt = [sx + L1 * Math.cos(th + a), sy + L1 * Math.sin(th + a)];
  const c2: Pt = [sx + L1 * Math.cos(th - a), sy + L1 * Math.sin(th - a)];
  const score = (p: Pt) => side * p[0] * 0.35 + p[1]; // 肘尽量朝下，贴着身体
  return score(c1) > score(c2) ? c1 : c2;
};

type Props = {look: Look; x: number; y: number; scale: number; pose: PoseState};

export const Puppet: React.FC<Props> = ({look, x, y, scale, pose: p}) => {
  const fx = p.turn * 14 + p.eye.lookX * 3;
  const fy = p.head.nod * 7 + p.eye.lookY * 2;
  const headRot = p.head.tilt + p.head.nod * 6 * (Math.abs(p.turn) > 0.2 ? Math.sign(p.turn) : 0);
  const headT = `translate(${p.head.dx} ${-285 + p.head.dy}) rotate(${headRot})`;
  return (
    <g transform={`translate(${x} ${y + p.bob}) rotate(${p.lean}) scale(${scale * p.sx} ${scale * p.sy})`}>
      {look.hairStyle === 'youF' ? (
        <g transform={headT}>
          <g transform={`rotate(${p.hairLag} 0 -190)`}>
            <rect x={-124} y={-205} width={248} height={262} rx={110} fill={look.hair} />
          </g>
        </g>
      ) : null}
      {/* 躯干 */}
      <path d="M -115 0 L -115 -180 Q -115 -250 -50 -258 L 50 -258 Q 115 -250 115 -180 L 115 0 Z" fill={look.top} />
      {look.inner ? <path d="M -42 -258 L 42 -258 L 0 -168 Z" fill={look.inner} /> : null}
      {look.tie ? (
        <>
          <path d="M -46 -258 L 0 -228 L -18 -206 Z M 46 -258 L 0 -228 L 18 -206 Z" fill="#E6E0D4" />
          <path d="M -11 -232 L 11 -232 L 17 -150 L 0 -124 L -17 -150 Z" fill={look.tie} transform={`rotate(${5 + p.lean * 0.6} 0 -232)`} />
        </>
      ) : null}
      <rect x={-22} y={-292} width={44} height={46} fill={look.skin} />
      {/* 头 */}
      <g transform={headT}>
        <circle cx={-104 - p.turn * 6} cy={-88} r={18} fill={look.skin} />
        <circle cx={104 - p.turn * 6} cy={-88} r={18} fill={look.skin} />
        <ellipse cx={0} cy={-95} rx={108} ry={100} fill={look.skin} />
        <Hair look={look} turn={p.turn} />
        <clipPath id={`face-${look.hairStyle}`}>
          <ellipse cx={0} cy={-95} rx={108} ry={100} />
        </clipPath>
        <g clipPath={`url(#face-${look.hairStyle})`}>
          <Cheeks fx={fx} fy={fy} look={look} blush={p.blush} />
        </g>
        <Eye cx={fx - 40} fy={fy} side={-1} p={p} />
        <Eye cx={fx + 40} fy={fy} side={1} p={p} />
        {look.glasses ? (
          <g fill="rgba(255,255,255,0.18)" stroke={INK} strokeWidth={5}>
            <rect x={fx - 68} y={-116 + fy} width={56} height={44} rx={14} />
            <rect x={fx + 12} y={-116 + fy} width={56} height={44} rx={14} />
            <path d={`M ${fx - 12} ${-96 + fy} L ${fx + 12} ${-96 + fy}`} fill="none" />
          </g>
        ) : null}
        <Mouth cx={fx} cy={-44 + fy} shape={p.mouth.shape} open={p.mouth.open} />
        {p.sweat.map((s, i) => (s > 0 && s < 1 ? <Sweat key={i} k={s} x={(p.turn <= 0 ? 1 : -1) * (92 - i * 14)} /> : null))}
      </g>
      <Limb side={-1} arm={p.armL} look={look} mug={p.mug?.side === -1 ? p.mug : undefined} />
      <Limb side={1} arm={p.armR} look={look} mug={p.mug?.side === 1 ? p.mug : undefined} />
    </g>
  );
};

const Hair: React.FC<{look: Look; turn: number}> = ({look, turn}) => {
  const s = turn * 6;
  if (look.hairStyle === 'bucho') {
    return (
      <g transform={`translate(${s} 0)`}>
        <path d="M -109 -100 Q -116 -206 0 -204 Q 116 -206 109 -100 Q 92 -150 44 -160 Q -30 -172 -109 -100 Z" fill={look.hair} />
        <path d="M -109 -100 Q -112 -128 -100 -146 L -92 -98 Z M 109 -100 Q 112 -128 100 -146 L 92 -98 Z" fill="#9B9590" />
      </g>
    );
  }
  return (
    <g transform={`translate(${s} 0)`}>
      <path d="M -113 -84 Q -128 -216 0 -213 Q 128 -216 113 -84 Q 104 -134 72 -142 Q 30 -120 -18 -152 Q -72 -136 -113 -84 Z" fill={look.hair} />
    </g>
  );
};

const Cheeks: React.FC<{fx: number; fy: number; look: Look; blush: number}> = ({fx, fy, look, blush}) => {
  const op = Math.min(0.85, look.cheek * 0.6 + blush * 0.35);
  const r = 21 + blush * 5;
  return (
    <>
      {[-66, 66].map((dx) => (
        <g key={dx}>
          <ellipse cx={fx + dx} cy={-58 + fy} rx={r * 1.1} ry={r} fill="#F08A7C" opacity={op} />
          {blush > 0.25 ? (
            <path d={`M ${fx + dx - 12} ${-52 + fy} l 6 -10 M ${fx + dx - 2} ${-52 + fy} l 6 -10 M ${fx + dx + 8} ${-52 + fy} l 6 -10`}
              stroke="#D9604F" strokeWidth={3} strokeLinecap="round" opacity={Math.min(1, (blush - 0.25) * 2)} />
          ) : null}
        </g>
      ))}
    </>
  );
};

const Eye: React.FC<{cx: number; fy: number; side: -1 | 1; p: PoseState}> = ({cx, fy, side, p}) => {
  const y = -92 + fy;
  const {open, lookX, lookY, wide, happy} = p.eye;
  const by = -124 + fy - p.brow.raise * 10 - wide * 4;
  const outer = cx + 14 * side;
  const inner = cx - 14 * side;
  const innerY = by - p.brow.worry * 9;
  const arch = 5 + Math.max(0, p.brow.raise) * 4;
  const brow = `M ${outer} ${by} Q ${cx} ${Math.min(by, innerY) - arch} ${inner} ${innerY}`;
  const px = cx + lookX * 6;
  const py = y + lookY * 5;
  const rx = 9 * (1 + 0.25 * wide);
  const ry = 11 * (1 + 0.4 * wide) * open;
  return (
    <>
      <path d={brow} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.78} />
      {happy > 0.5 ? (
        <path d={`M ${cx - 13} ${y + 4} Q ${cx} ${y - 12} ${cx + 13} ${y + 4}`} stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
      ) : open < 0.22 ? (
        <path d={`M ${cx - 12} ${y + 2} L ${cx + 12} ${y + 2}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx={px} cy={py} rx={rx} ry={ry} fill={INK} />
          {open > 0.6 ? <circle cx={px + 3} cy={py - 4 * open} r={3 + wide} fill="#fff" /> : null}
        </>
      )}
    </>
  );
};

const Mouth: React.FC<{cx: number; cy: number; shape: MouthShape; open: number}> = ({cx, cy, shape, open}) => {
  if (open > 0) {
    if (shape === 'grin' || shape === 'smile') {
      // 笑着说话：上沿平、下沿弧的 D 形
      const w = 18 + 4 * open;
      const h = 8 + 20 * open;
      return (
        <>
          <path d={`M ${cx - w} ${cy - 8} Q ${cx} ${cy - 12} ${cx + w} ${cy - 8} Q ${cx + w * 0.7} ${cy - 8 + h} ${cx} ${cy - 8 + h} Q ${cx - w * 0.7} ${cy - 8 + h} ${cx - w} ${cy - 8} Z`} fill={MOUTH} />
          {open > 0.5 ? <ellipse cx={cx} cy={cy - 8 + h * 0.72} rx={w * 0.5} ry={h * 0.22} fill="#E0766F" /> : null}
        </>
      );
    }
    const rx = 14 + 5 * open;
    const ry = 4 + 15 * open;
    return (
      <>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={MOUTH} />
        {open > 0.5 ? <ellipse cx={cx} cy={cy + ry * 0.5} rx={rx * 0.6} ry={ry * 0.4} fill="#E0766F" /> : null}
      </>
    );
  }
  const line = {stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none'};
  switch (shape) {
    case 'grin':
      return <path d={`M ${cx - 21} ${cy - 12} Q ${cx} ${cy + 24} ${cx + 21} ${cy - 12} Z`} fill={MOUTH} />;
    case 'o':
      return <ellipse cx={cx} cy={cy} rx={9} ry={12} fill={MOUTH} />;
    case 'wavy':
      return <path d={`M ${cx - 15} ${cy + 2} Q ${cx - 8} ${cy - 7} ${cx - 2} ${cy} Q ${cx + 5} ${cy + 7} ${cx + 15} ${cy - 2}`} {...line} />;
    case 'smile':
      return <path d={`M ${cx - 17} ${cy - 8} Q ${cx} ${cy + 10} ${cx + 17} ${cy - 8}`} {...line} />;
    default:
      return <path d={`M ${cx - 11} ${cy - 2} Q ${cx} ${cy + 2} ${cx + 11} ${cy - 2}`} {...line} />;
  }
};

const Sweat: React.FC<{k: number; x: number}> = ({k, x}) => {
  const y = -150 + k * 85;
  const op = Math.min(1, k / 0.12, (1 - k) / 0.2);
  return (
    <g transform={`translate(${x} ${y})`} opacity={op}>
      <path d="M 0 -26 Q 20 4 0 16 Q -20 4 0 -26 Z" fill="#7CC0EC" stroke="#fff" strokeWidth={4} />
      <ellipse cx={-5} cy={4} rx={3} ry={5} fill="#fff" opacity={0.8} />
    </g>
  );
};

const Limb: React.FC<{side: -1 | 1; arm: ArmState; look: Look; mug?: MugState}> = ({side, arm, look, mug}) => {
  const [hx, hy] = arm.hand;
  const [ex, ey] = elbowFor(side, arm.hand);
  const palm = arm.palm ?? 0;
  return (
    <>
      <path d={`M ${side * SHOULDER[0]} ${SHOULDER[1]} L ${ex} ${ey} L ${hx} ${hy}`} stroke={sleeve(look.top)} strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {mug ? <Mug x={hx} y={hy} side={side} tilt={mug.tilt} slosh={mug.slosh} level={mug.level} /> : null}
      {palm > 0.5 ? (
        <g transform={`translate(${hx} ${hy}) rotate(${arm.palmRot ?? 0})`}>
          <ellipse cx={0} cy={-8} rx={24} ry={32} fill={look.skin} />
          <ellipse cx={side * -22} cy={6} rx={9} ry={16} fill={look.skin} transform={`rotate(${side * 30} ${side * -22} 6)`} />
          <path d="M -10 -30 L -10 -14 M 0 -34 L 0 -14 M 10 -30 L 10 -14" stroke="#D9A88A" strokeWidth={3} strokeLinecap="round" />
        </g>
      ) : (
        <circle cx={hx} cy={hy} r={25} fill={look.skin} />
      )}
    </>
  );
};

/** 生啤杯，握在手里。tilt 杯身倾角，slosh 泡沫滞后的横移量 */
export const Mug: React.FC<{x: number; y: number; side?: -1 | 1; level?: number; tilt?: number; slosh?: number}> = ({x, y, side = 1, level = 0.8, tilt = 0, slosh = 0}) => {
  const top = -94 + 100 * (1 - level);
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <path d={`M ${-side * 30} -78 q ${-side * 34} 4 ${-side * 34} 34 q 0 30 ${side * 34} 34`} stroke="#F3EEE4" strokeWidth={10} fill="none" />
      <rect x={-32} y={-100} width={64} height={112} rx={9} fill="#F3EEE4" stroke="#CDBFA8" strokeWidth={3} />
      <rect x={-26} y={top} width={52} height={100 * level} rx={5} fill="#F0B23A" />
      <g transform={`translate(${slosh * 5} 0) rotate(${slosh * 6} 0 ${top - 8})`}>
        <rect x={-36} y={top - 22} width={72} height={30} rx={15} fill="#FFFDF7" />
        <circle cx={-14} cy={top - 22} r={10} fill="#FFFDF7" />
        <circle cx={10} cy={top - 24} r={12} fill="#FFFDF7" />
      </g>
      <rect x={-18} y={-70} width={7} height={56} rx={3.5} fill="#fff" opacity={0.5} />
      {[[-8, -30], [8, -52], [-2, -12]].map(([bx, by], i) => (
        <circle key={i} cx={bx} cy={by} r={3} fill="#FFF3C4" opacity={0.7} />
      ))}
    </g>
  );
};
