import React from 'react';
import {ease, prog, track} from './anim';
import type {Anchors} from './perform';
import {Ruby} from './Ruby';
import {chipCaps, sweepAt, wrong} from './script';
import {color, font, stage} from './theme';

export const CARD = {left: 24, top: 600, height: 466};

/** 段 ② 的教学卡片：从画框底部升起，盖住画面下 55%，人物的头留在上面继续演。
 *  ✕ 反例被划掉 → ○ 拆成两块（先惊讶 / 再收下），示范音频播放时两块随卡拉 OK 亮起 */
export const Card: React.FC<{t: number; A: Anchors; y: number}> = ({t, A, y}) => {
  if (y > 600) return null;
  const rowA = ease.out(prog(t, A.host + 0.62, A.host + 0.95));
  const strike = ease.inOut(prog(t, A.host + 2.05, A.host + 2.35));
  const note = ease.out(prog(t, A.host + 2.35, A.host + 2.65));
  const chipIn = [ease.over(prog(t, A.hostPause + 0.05, A.hostPause + 0.45)), ease.over(prog(t, A.hostPause + 0.22, A.hostPause + 0.62))];
  // 哪一遍在放：play1 / play2 用强调色，shadow 用青绿色无声扫一遍
  const plays = [A.play1, A.play2];
  let tc = -1;
  let hi = color.accent;
  for (const p of plays) if (t >= p && t < p + 2.6) tc = t - p;
  if (t >= A.shadow && t < A.ask2) {
    tc = t - A.shadow;
    hi = color.teal;
  }
  // gap 时高亮淡出
  const hiMix = t >= A.gap && t < A.play2 ? 1 - prog(t, A.gap + 0.15, A.gap + 0.5) : 1;
  const tcHeld = t >= A.gap && t < A.play2 ? 2.6 : tc;
  const mic = t >= A.shadow ? track(t - A.shadow, [[0, 0], [0.15, 1.2, ease.out], [0.3, 1]]) : 0;
  const breathe = 1 + 0.06 * Math.sin((t - A.shadow) * Math.PI * 2 * 1.2);
  const shadowP = prog(t, A.shadow, A.ask2);
  return (
    <div style={{position: 'absolute', left: CARD.left, width: stage.width - CARD.left * 2, top: CARD.top, height: CARD.height, transform: `translateY(${y}px)`,
      backgroundColor: color.paper, borderRadius: 34, boxShadow: '0 -6px 28px rgba(60,35,15,0.22)', padding: '30px 40px', boxSizing: 'border-box'}}>
      {/* 标题签 */}
      <div style={{position: 'absolute', top: -26, left: 40, padding: '8px 24px', borderRadius: 999, backgroundColor: color.ink, color: '#FFF7E6', fontFamily: font.zh, fontSize: 32, fontWeight: 600, letterSpacing: 2}}>
        被夸了，怎么接？
      </div>
      {/* ✕ 反例 */}
      <div style={{opacity: rowA, transform: `translateY(${(1 - rowA) * 16}px)`, display: 'flex', alignItems: 'center', gap: 22, marginTop: 18}}>
        <Badge ok={false} />
        <div style={{position: 'relative'}}>
          <Ruby cap={{lines: [wrong], sweep: []}} filled={0} size={54} base={strike > 0.5 ? color.muted : color.ink} />
          <div style={{position: 'absolute', left: -6, top: 52, height: 7, width: `${strike * 104}%`, backgroundColor: color.bad, borderRadius: 4, transform: 'rotate(-3deg)', transformOrigin: 'left center'}} />
        </div>
      </div>
      <div style={{opacity: note, marginLeft: 92, marginTop: 6, fontFamily: font.zh, fontSize: 32, color: color.bad}}>
        生硬否认 → 对方只好再夸你一轮
      </div>
      <div style={{height: 2, margin: '34px 0 30px', backgroundImage: `linear-gradient(90deg, ${color.faint} 60%, transparent 60%)`, backgroundSize: '22px 2px', opacity: chipIn[0]}} />
      {/* ○ 拆解 */}
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 22}}>
        <div style={{opacity: chipIn[0], marginTop: 36}}><Badge ok /></div>
        <div style={{display: 'flex', gap: 18, flex: 1}}>
          {chipCaps.map((c, i) => {
            const f = tcHeld >= 0 ? sweepAt(c, tcHeld) : 0;
            const total = c.lines.flat().reduce((a, k) => a + k.t.length, 0);
            const lit = tc >= 0 && f > 0 && f < total ? 1 : 0;
            const done = f >= total ? 1 : 0;
            const glow = Math.max(lit, done * 0.5) * hiMix;
            return (
              <div key={i} style={{flex: i === 0 ? 1.12 : 1, opacity: chipIn[i], transform: `translateY(${(1 - chipIn[i]) * 30}px) scale(${1 + lit * 0.03})`,
                borderRadius: 24, padding: '18px 14px 22px', backgroundColor: glow > 0 ? `rgba(${hi === color.teal ? '47,143,131' : '181,66,44'},${0.08 + glow * 0.06})` : '#F6EFE0',
                border: `3px solid ${glow > 0.6 ? hi : 'transparent'}`, textAlign: 'center'}}>
                <Ruby cap={c} filled={f} size={50} rubySize={22} hi={hi} hiMix={hiMix} />
                <div style={{marginTop: 14, fontFamily: font.zh, fontSize: 32, fontWeight: 600, color: glow > 0.6 ? hi : color.muted}}>
                  {i === 0 ? '① 先惊讶一下' : '② 再收下夸奖'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 跟读：麦克风 + 进度 */}
      {mic > 0 ? (
        <div style={{position: 'absolute', right: 34, top: 26, transform: `scale(${mic})`, display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{fontFamily: font.zh, fontSize: 32, fontWeight: 700, color: color.teal}}>轮到你</div>
          <div style={{width: 72, height: 72, borderRadius: 36, backgroundColor: color.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${breathe})`, boxShadow: `0 0 0 ${8 + 6 * Math.sin(shadowP * Math.PI * 6) ** 2}px rgba(47,143,131,0.18)`}}>
            <Mic />
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Badge: React.FC<{ok: boolean}> = ({ok}) => (
  <div style={{width: 70, height: 70, borderRadius: 35, flex: 'none', backgroundColor: ok ? color.good : color.bad, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width="38" height="38" viewBox="0 0 38 38">
      {ok ? <circle cx={19} cy={19} r={13} stroke="#fff" strokeWidth={6} fill="none" /> : <path d="M 8 8 L 30 30 M 30 8 L 8 30" stroke="#fff" strokeWidth={6} strokeLinecap="round" />}
    </svg>
  </div>
);

const Mic: React.FC = () => (
  <svg width="36" height="44" viewBox="0 0 36 44">
    <rect x={10} y={2} width={16} height={26} rx={8} fill="#fff" />
    <path d="M 4 20 Q 4 34 18 34 Q 32 34 32 20" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 18 34 L 18 42 M 10 42 L 26 42" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
  </svg>
);
