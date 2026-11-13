import React from 'react';
import {Img} from 'remotion';
import painted from './assets/izakaya_bg.png';
import {font} from './theme';
import {Mug} from './Puppet';

/** 居酒屋包间。Back 画在人物后面，Table 画在人物前面。画布 1008×800 */

const MENU = ['生ビール', '枝豆', '唐揚げ', '刺身盛り', 'だし巻き', '焼き鳥'];

export const IzakayaBack: React.FC<{sway: number}> = ({sway}) => (
  <g>
    <rect width={1008} height={800} fill="#EBD5AC" />
    <rect y={0} width={1008} height={46} fill="#6B4630" />
    <rect y={430} width={1008} height={370} fill="#A8744A" />
    <rect y={430} width={1008} height={14} fill="#7C5234" />
    {[126, 378, 630, 882].map((x) => <rect key={x} x={x} y={444} width={6} height={356} fill="#8F603C" />)}
    {/* 暖光 */}
    <ellipse cx={504} cy={120} rx={520} ry={260} fill="#FFF3CF" opacity={0.45} />
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
    {/* 酒瓶架 */}
    <rect x={800} y={300} width={190} height={12} rx={4} fill="#6B4630" />
    {[['#3D6B52', 822], ['#7A4A2A', 868], ['#2F4A6B', 914], ['#3D6B52', 958]].map(([c, x]) => (
      <g key={x}>
        <rect x={(x as number) - 6} y={206} width={12} height={34} fill={c as string} />
        <rect x={(x as number) - 17} y={232} width={34} height={68} rx={8} fill={c as string} />
        <rect x={(x as number) - 13} y={254} width={26} height={24} fill="#FFFBF0" />
      </g>
    ))}
    {/* 提灯，轻轻摆 */}
    <g transform={`rotate(${sway} 120 46)`}>
      <rect x={117} y={46} width={6} height={44} fill="#2B2420" />
      <rect x={84} y={88} width={72} height={14} rx={4} fill="#2B2420" />
      <ellipse cx={120} cy={184} rx={74} ry={88} fill="#D5422F" />
      <ellipse cx={120} cy={184} rx={44} ry={88} fill="#E35A44" opacity={0.6} />
      <rect x={84} y={266} width={72} height={14} rx={4} fill="#2B2420" />
      <text x={120} y={208} textAnchor="middle" fontFamily={font.ja} fontSize={68} fontWeight={700} fill="#FFFBF0">酒</text>
    </g>
  </g>
);

export const IzakayaTable: React.FC = () => (
  <g>
    <rect x={-20} y={650} width={1048} height={170} rx={18} fill="#7C4F30" />
    <rect x={-20} y={650} width={1048} height={20} rx={10} fill="#9A6740" />
    {/* 枝豆 */}
    <ellipse cx={500} cy={722} rx={96} ry={30} fill="#F4EFE6" />
    <ellipse cx={500} cy={716} rx={80} ry={21} fill="#DCD5C6" />
    {[[452, 708, -20], [486, 702, 12], [522, 706, -8], [548, 712, 24], [504, 716, 40], [470, 718, 4]].map(([x, y, r], i) => (
      <ellipse key={i} cx={x} cy={y} rx={24} ry={8} fill={i % 2 ? '#7FB069' : '#6A9E55'} transform={`rotate(${r} ${x} ${y})`} />
    ))}
    {/* 唐揚げ */}
    <ellipse cx={250} cy={742} rx={104} ry={30} fill="#F4EFE6" />
    {[[206, 728], [246, 720], [286, 730], [228, 742], [270, 744]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={21} fill={i % 2 ? '#C9853E' : '#B8742F'} />
    ))}
    <path d="M 318 736 l 22 -10 l 6 14 Z" fill="#F0D24A" />
    {/* 「你」的杯子与筷子 */}
    <Mug x={850} y={728} side={1} level={0.9} />
    <rect x={640} y={748} width={130} height={6} rx={3} fill="#3A2A22" transform="rotate(-6 640 748)" />
    <rect x={642} y={760} width={130} height={6} rx={3} fill="#3A2A22" transform="rotate(-3 642 760)" />
  </g>
);

/** 手绘风位图版（codex 出图）。同一张图画两次：整张垫底，桌沿以下那条再盖在人物前面 */
const TABLE_EDGE = 686;
const fill = {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover'} as const;

export const PaintedBack: React.FC = () => <Img src={painted} style={fill} />;
export const PaintedTable: React.FC = () => <Img src={painted} style={{...fill, clipPath: `inset(${TABLE_EDGE / 8}% 0 0 0)`}} />;
