import React from 'react';
import {font} from './theme';

/** 居酒屋包间（矢量扁平），世界坐标沿用 1008×800，但四周多画出一圈，镜头推拉平移不会露边。
 *  Back 在人物后面，Table 在人物前面 */

const MENU = ['生ビール', '枝豆', '唐揚げ', '刺身盛り', 'だし巻き', '焼き鳥'];

export const SetBack: React.FC<{t: number}> = ({t}) => {
  const sway = Math.sin(t * 0.75) * 2.5;
  const sway2 = Math.sin(t * 0.75 + 1.4) * 2;
  return (
    <g>
      <rect x={-600} y={-400} width={2200} height={1600} fill="#EBD5AC" />
      <rect x={-600} y={-400} width={2200} height={446} fill="#6B4630" />
      <rect x={-600} y={30} width={2200} height={16} fill="#5A3A27" />
      <rect x={-600} y={430} width={2200} height={800} fill="#A8744A" />
      <rect x={-600} y={430} width={2200} height={14} fill="#7C5234" />
      {[-378, -126, 126, 378, 630, 882, 1134, 1386].map((x) => <rect key={x} x={x} y={444} width={6} height={700} fill="#8F603C" />)}
      {/* 暖光 */}
      <ellipse cx={504} cy={140} rx={620} ry={300} fill="#FFF3CF" opacity={0.45} />
      {/* 菜单短册 */}
      {MENU.map((m, i) => {
        const x = 250 + i * 86;
        return (
          <g key={m}>
            <rect x={x} y={84} width={62} height={214} rx={4} fill="#FFFBF0" />
            <rect x={x} y={84} width={62} height={10} fill="#B5422C" />
            <text x={x + 31} y={112} fontFamily={font.ja} fontSize={30} fontWeight={600} fill="#2B2420" style={{writingMode: 'vertical-rl'}}>{m}</text>
          </g>
        );
      })}
      {/* 左边的小窗（障子） */}
      <g transform="translate(-260 96)">
        <rect width={250} height={230} rx={6} fill="#6B4630" />
        <rect x={10} y={10} width={230} height={210} fill="#FFF6DF" />
        {[67, 124, 181].map((x) => <rect key={x} x={x} y={10} width={5} height={210} fill="#9C7656" />)}
        {[80, 150].map((y) => <rect key={y} x={10} y={y} width={230} height={5} fill="#9C7656" />)}
      </g>
      {/* 酒瓶架 */}
      <rect x={800} y={300} width={300} height={12} rx={4} fill="#6B4630" />
      {([['#3D6B52', 822], ['#7A4A2A', 868], ['#2F4A6B', 914], ['#3D6B52', 958], ['#7A4A2A', 1010], ['#2F4A6B', 1060]] as const).map(([c, x]) => (
        <g key={x}>
          <rect x={x - 6} y={206} width={12} height={34} fill={c} />
          <rect x={x - 17} y={232} width={34} height={68} rx={8} fill={c} />
          <rect x={x - 13} y={254} width={26} height={24} fill="#FFFBF0" />
        </g>
      ))}
      <Lantern x={120} sway={sway} />
      <Lantern x={1210} sway={sway2} small />
    </g>
  );
};

const Lantern: React.FC<{x: number; sway: number; small?: boolean}> = ({x, sway, small}) => (
  <g transform={`rotate(${sway} ${x} 46) translate(${x} 0) scale(${small ? 0.8 : 1}) translate(${-x} 0)`}>
    <rect x={x - 3} y={46} width={6} height={44} fill="#2B2420" />
    <rect x={x - 36} y={88} width={72} height={14} rx={4} fill="#2B2420" />
    <ellipse cx={x} cy={184} rx={74} ry={88} fill="#D5422F" />
    <ellipse cx={x} cy={184} rx={44} ry={88} fill="#E35A44" opacity={0.6} />
    <rect x={x - 36} y={266} width={72} height={14} rx={4} fill="#2B2420" />
    <text x={x} y={208} textAnchor="middle" fontFamily={font.ja} fontSize={68} fontWeight={700} fill="#FFFBF0">酒</text>
  </g>
);

export const SetTable: React.FC = () => (
  <g>
    <rect x={-600} y={650} width={2200} height={600} rx={18} fill="#7C4F30" />
    <rect x={-600} y={650} width={2200} height={20} rx={10} fill="#9A6740" />
    {/* 枝豆 */}
    <ellipse cx={500} cy={722} rx={96} ry={30} fill="#F4EFE6" />
    <ellipse cx={500} cy={716} rx={80} ry={21} fill="#DCD5C6" />
    {[[452, 708, -20], [486, 702, 12], [522, 706, -8], [548, 712, 24], [504, 716, 40], [470, 718, 4]].map(([x, y, r], i) => (
      <ellipse key={i} cx={x} cy={y} rx={24} ry={8} fill={i % 2 ? '#7FB069' : '#6A9E55'} transform={`rotate(${r} ${x} ${y})`} />
    ))}
    {/* 唐揚げ */}
    <ellipse cx={230} cy={742} rx={104} ry={30} fill="#F4EFE6" />
    {[[186, 728], [226, 720], [266, 730], [208, 742], [250, 744]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={21} fill={i % 2 ? '#C9853E' : '#B8742F'} />
    ))}
    <path d="M 298 736 l 22 -10 l 6 14 Z" fill="#F0D24A" />
    {/* 刺身盛り */}
    <ellipse cx={800} cy={740} rx={92} ry={26} fill="#2F4A6B" />
    {[[766, 728, '#E86A5A'], [796, 724, '#F28C6E'], [826, 728, '#E86A5A']].map(([x, y, c], i) => (
      <ellipse key={i} cx={x as number} cy={y as number} rx={22} ry={11} fill={c as string} />
    ))}
    <rect x={770} y={738} width={60} height={6} rx={3} fill="#7FB069" />
    {/* 筷子 */}
    <rect x={620} y={756} width={120} height={6} rx={3} fill="#3A2A22" transform="rotate(-6 620 756)" />
    <rect x={622} y={768} width={120} height={6} rx={3} fill="#3A2A22" transform="rotate(-3 622 768)" />
  </g>
);
