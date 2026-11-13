import React from 'react';
import {font} from './theme';

/** 办公室。variant: morning（早上，蓝天，九点）/ evening（傍晚，晚霞，六点）。画布 1008×800 */

const skies = {
  morning: {top: '#BFE3F5', bottom: '#EAF6FB', building: '#A9BFCB', lit: '#D7E6EE', hour: 9},
  evening: {top: '#5B4B8A', bottom: '#F2A65A', building: '#3B3355', lit: '#F7D36B', hour: 18},
};

export const OfficeBack: React.FC<{frame: number; variant?: string}> = ({variant}) => {
  const sky = skies[variant === 'evening' ? 'evening' : 'morning'];
  const hourAngle = (sky.hour % 12) * 30;
  return (
    <g>
      <defs>
        <linearGradient id="office-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
      </defs>
      <rect width={1008} height={800} fill="#ECE6DA" />
      {/* 窗 */}
      <rect x={60} y={70} width={520} height={330} rx={8} fill="url(#office-sky)" />
      {[[90, 250, 70], [170, 200, 90], [270, 270, 60], [340, 180, 100], [450, 240, 80]].map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={400 - y} fill={sky.building} />
          {[0, 1, 2].map((r) => [0, 1].map((c) => (
            <rect key={`${r}${c}`} x={x + 12 + c * (w / 2 - 4)} y={y + 16 + r * 34} width={w / 2 - 22} height={16} fill={sky.lit} opacity={(i + r + c) % 3 ? 0.9 : 0.25} />
          )))}
        </g>
      ))}
      <rect x={60} y={70} width={520} height={330} rx={8} fill="none" stroke="#FFFFFF" strokeWidth={14} />
      <rect x={313} y={70} width={14} height={330} fill="#FFFFFF" />
      {/* 白板 */}
      <rect x={650} y={90} width={300} height={210} rx={6} fill="#FFFFFF" stroke="#C9C2B4" strokeWidth={8} />
      <text x={672} y={136} fontFamily={font.ja} fontSize={28} fontWeight={600} fill="#3F5B7A">今週の予定</text>
      {[168, 204, 240].map((y, i) => <rect key={y} x={672} y={y} width={[220, 160, 190][i]} height={8} rx={4} fill={['#B5422C', '#8A8178', '#8A8178'][i]} />)}
      {/* 挂钟 */}
      <g transform="translate(900 380)">
        <circle r={44} fill="#FFFFFF" stroke="#2B2420" strokeWidth={6} />
        <rect x={-3} y={-34} width={6} height={36} rx={3} fill="#2B2420" />
        <rect x={-4} y={-24} width={8} height={26} rx={4} fill="#2B2420" transform={`rotate(${hourAngle})`} />
      </g>
      {/* 隔板与文件柜 */}
      <rect y={470} width={1008} height={330} fill="#CFC8BA" />
      <rect y={470} width={1008} height={12} fill="#B8B0A0" />
      <rect x={20} y={420} width={150} height={380} rx={6} fill="#9AA5AD" />
      {[450, 540].map((y) => <g key={y}><rect x={34} y={y} width={122} height={76} rx={4} fill="#B4BEC5" /><rect x={80} y={y + 30} width={30} height={8} rx={4} fill="#6E7A82" /></g>)}
      {/* 盆栽 */}
      <rect x={930} y={500} width={56} height={60} rx={8} fill="#B5744A" />
      {[-30, 0, 30].map((r) => <ellipse key={r} cx={958} cy={462} rx={16} ry={50} fill="#6A9E55" transform={`rotate(${r} 958 500)`} />)}
    </g>
  );
};

export const OfficeFront: React.FC = () => (
  <g>
    <rect x={-20} y={650} width={1048} height={170} rx={14} fill="#D9C7A6" />
    <rect x={-20} y={650} width={1048} height={18} rx={9} fill="#E8D9BC" />
    {/* 文件、笔筒 */}
    <rect x={70} y={700} width={150} height={16} rx={3} fill="#FFFFFF" transform="rotate(-3 70 700)" />
    <rect x={76} y={716} width={150} height={16} rx={3} fill="#F1ECE2" />
    <rect x={250} y={676} width={44} height={60} rx={6} fill="#3F5B7A" />
    {[[258, '#B5422C'], [270, '#F0B23A'], [282, '#2B2420']].map(([x, c]) => <rect key={x} x={x as number} y={648} width={6} height={36} rx={3} fill={c as string} />)}
    {/* 键盘、鼠标、马克杯、笔记本电脑的背面 */}
    <rect x={560} y={716} width={220} height={36} rx={6} fill="#E9E5DD" />
    {[0, 1, 2].map((r) => <rect key={r} x={572} y={722 + r * 10} width={196} height={5} rx={2.5} fill="#C9C2B4" />)}
    <ellipse cx={826} cy={736} rx={18} ry={24} fill="#E9E5DD" />
    <rect x={880} y={690} width={52} height={56} rx={8} fill="#B5422C" />
    <path d="M 932 704 q 26 4 26 22 q 0 18 -26 20" stroke="#B5422C" strokeWidth={9} fill="none" />
  </g>
);
