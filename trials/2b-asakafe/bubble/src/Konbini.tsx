import React from 'react';
import {font} from './theme';

/** 便利店收银台。画布 1008×800 */

const BOX = ['#D5422F', '#F0B23A', '#3F6FB5', '#6A9E55', '#8A5AA8', '#E58A3C'];

export const KonbiniBack: React.FC<{frame: number; variant?: string}> = () => (
  <g>
    <rect width={1008} height={800} fill="#F4F1EA" />
    <rect width={1008} height={54} fill="#2F7F86" />
    <rect y={54} width={1008} height={10} fill="#F0B23A" />
    {/* 收银台后的货架 */}
    <rect x={40} y={110} width={420} height={420} rx={6} fill="#E3DED3" />
    {[0, 1, 2, 3].map((r) => (
      <g key={r}>
        <rect x={40} y={196 + r * 100} width={420} height={10} fill="#BDB6A8" />
        {[0, 1, 2, 3, 4, 5, 6].map((c) => (
          <rect key={c} x={56 + c * 57} y={126 + r * 100} width={44} height={70} rx={4} fill={BOX[(r * 2 + c) % BOX.length]} opacity={0.9} />
        ))}
      </g>
    ))}
    {/* 吊牌 */}
    <rect x={500} y={54} width={6} height={50} fill="#8A8178" />
    <rect x={430} y={100} width={146} height={64} rx={8} fill="#FFFFFF" stroke="#2F7F86" strokeWidth={6} />
    <text x={503} y={146} textAnchor="middle" fontFamily={font.ja} fontSize={40} fontWeight={700} fill="#2F7F86">レジ</text>
    {/* 海报 */}
    <rect x={610} y={110} width={170} height={230} rx={6} fill="#FFF3CF" stroke="#E58A3C" strokeWidth={6} />
    <text x={695} y={170} textAnchor="middle" fontFamily={font.ja} fontSize={36} fontWeight={700} fill="#B5422C">新発売</text>
    <ellipse cx={695} cy={250} rx={54} ry={40} fill="#E58A3C" />
    <ellipse cx={695} cy={238} rx={40} ry={22} fill="#F7D36B" />
    {/* 玻璃门 */}
    <rect x={820} y={90} width={168} height={560} fill="#CFE8F2" stroke="#BDB6A8" strokeWidth={10} />
    <rect x={900} y={90} width={8} height={560} fill="#BDB6A8" />
    <rect x={850} y={330} width={14} height={90} rx={7} fill="#8A8178" />
    <rect y={560} width={820} height={240} fill="#E3DED3" />
  </g>
);

export const KonbiniFront: React.FC = () => (
  <g>
    {/* 收银机，立在两人之间 */}
    <rect x={452} y={540} width={110} height={120} rx={8} fill="#4A4744" />
    <rect x={462} y={552} width={90} height={56} rx={4} fill="#9FD3C7" />
    <rect x={438} y={500} width={70} height={46} rx={6} fill="#2B2420" transform="rotate(-8 438 500)" />
    {/* 台面 */}
    <rect x={-20} y={650} width={1048} height={170} rx={10} fill="#FBFAF6" />
    <rect x={-20} y={650} width={1048} height={16} fill="#E3DED3" />
    <rect x={-20} y={742} width={1048} height={18} fill="#2F7F86" />
    {/* 便当、饮料、塑料袋、筷子 */}
    <rect x={620} y={676} width={170} height={54} rx={10} fill="#2B2420" />
    <rect x={630} y={684} width={70} height={38} rx={6} fill="#FFFFFF" />
    <rect x={708} y={684} width={34} height={38} rx={6} fill="#C9853E" />
    <rect x={748} y={684} width={34} height={38} rx={6} fill="#6A9E55" />
    <rect x={820} y={640} width={40} height={88} rx={10} fill="#6A9E55" />
    <rect x={828} y={626} width={24} height={18} rx={4} fill="#FFFFFF" />
    <path d="M 250 730 L 262 668 Q 300 650 338 668 L 350 730 Z" fill="#FFFFFF" stroke="#D9D4C8" strokeWidth={4} />
    <rect x={150} y={708} width={84} height={12} rx={3} fill="#F7E7C6" />
  </g>
);
