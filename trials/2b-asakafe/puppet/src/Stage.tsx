import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Card} from './Card';
import {prog, track, ease} from './anim';
import {BUCHO, YOU, anchorsOf, showAt, type Emote} from './perform';
import {Puppet, looks} from './Puppet';
import {SetBack, SetTable} from './Set';
import {pick} from './text';
import {FPS, K0, color, font, stage} from './theme';
import type {Episode, Segment} from './types';
import {mouthOpen, type Waves} from './waves';

/** 当前时刻在哪一段 */
export const segAt = (segments: Segment[], t: number) => {
  const i = Math.max(0, segments.findIndex((s) => t < s.start + s.dur));
  return {i, seg: segments[i] ?? segments[segments.length - 1]};
};

/** 舞台：场景 + 两个纸偶 + 镜头 + 段 ② 的教学卡片。所有状态来自 perform.ts 的 showAt(t) */
export const Stage: React.FC<{episode: Episode; segments: Segment[]; waves: Waves}> = ({episode, segments, waves}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const A = anchorsOf(segments);
  const {seg} = segAt(segments, t);
  const speaker = seg.audio ? pick(episode, seg.audio)?.role : undefined;
  // 口型两帧一换，像逐张换嘴的纸偶动画
  const stepped = Math.max(0, (Math.floor(frame / 2) * 2) / FPS - seg.start);
  const open = seg.audio ? mouthOpen(waves?.[seg.audio], stepped) : 0;
  const show = showAt(t, A, open, open, speaker);
  const {cam} = show;
  const k = K0 * cam.z;
  const world = `translate(${stage.width / 2} ${stage.height / 2}) scale(${k}) translate(${-cam.cx} ${-cam.cy})`;
  // 进入教学段时场景稍微压暗，卡片更突出；③ 再亮回来
  const dim = track(t, [[A.host + 0.1, 0], [A.host + 0.7, 0.16, ease.inOut], [A.ask2, 0.16], [A.ask2 + 0.4, 0, ease.inOut]]);
  return (
    <div style={{position: 'absolute', left: stage.left, top: stage.top, width: stage.width, height: stage.height, borderRadius: 40, overflow: 'hidden', backgroundColor: color.faint, boxShadow: '0 10px 30px rgba(80,50,20,0.16)'}}>
      <svg width={stage.width} height={stage.height} viewBox={`0 0 ${stage.width} ${stage.height}`} style={{position: 'absolute', inset: 0}}>
        <g transform={world}>
          <SetBack t={t} />
          <Puppet look={looks.bucho} x={BUCHO.x} y={BUCHO.y} scale={BUCHO.scale} pose={show.bucho} />
          <Puppet look={looks.youF} x={YOU.x} y={YOU.y} scale={YOU.scale} pose={show.you} />
          <SetTable />
          {show.emotes.map((e, i) => <EmoteMark key={i} e={e} />)}
        </g>
        <rect width={stage.width} height={stage.height} fill={color.ink} opacity={dim} />
      </svg>
      <Card t={t} A={A} y={show.card} />
    </div>
  );
};

const EmoteMark: React.FC<{e: Emote}> = ({e}) => {
  const pop = track(e.age, [[0, 0], [0.1, 1.25, ease.out], [0.22, 0.95, ease.inOut], [0.32, 1]]);
  const fade = 1 - prog(e.k, 0.85, 1);
  const float = Math.sin(e.age * 5) * 4;
  if (e.kind === 'sparkle') {
    return (
      <g opacity={fade}>
        {[[0, 0, 1], [70, 40, 0.7], [-50, 60, 0.6]].map(([dx, dy, s], i) => {
          const tw = Math.max(0, Math.sin((e.age * 2.2 - i * 0.18) * Math.PI));
          return <Star key={i} x={e.x + dx} y={e.y + dy - e.age * 20} r={22 * s * tw} />;
        })}
      </g>
    );
  }
  if (e.kind === 'splash') {
    return (
      <g>
        {[[-1, -1.1], [0.2, -1.5], [1, -1]].map(([vx, vy], i) => {
          const a = e.age;
          const x = e.x + vx * 160 * a;
          const y = e.y + vy * 240 * a + 900 * a * a;
          return <ellipse key={i} cx={x} cy={y} rx={7} ry={9} fill="#F6C451" stroke="#fff" strokeWidth={3} opacity={1 - e.k} />;
        })}
        {e.age < 0.18 ? (
          <g opacity={1 - e.age / 0.18} stroke="#FFFDF7" strokeWidth={6} strokeLinecap="round">
            {[-60, -20, 20, 60].map((a) => {
              const r = (a - 90) * (Math.PI / 180);
              const r0 = 28 + e.age * 120;
              return <line key={a} x1={e.x + Math.cos(r) * r0} y1={e.y + Math.sin(r) * r0} x2={e.x + Math.cos(r) * (r0 + 26)} y2={e.y + Math.sin(r) * (r0 + 26)} />;
            })}
          </g>
        ) : null}
      </g>
    );
  }
  return (
    <g transform={`translate(${e.x} ${e.y + float}) scale(${pop})`} opacity={fade}>
      {e.kind === 'bang' ? (
        <text textAnchor="middle" y={36} fontFamily={font.ja} fontSize={120} fontWeight={900} fill={color.bad} stroke="#fff" strokeWidth={10} paintOrder="stroke">!</text>
      ) : e.kind === 'q' ? (
        <text textAnchor="middle" y={36} fontFamily={font.ja} fontSize={110} fontWeight={800} fill="#3F6FB5" stroke="#fff" strokeWidth={9} paintOrder="stroke" transform={`rotate(${Math.sin(e.age * 3) * 8})`}>?</text>
      ) : (
        <>
          <rect x={-72} y={-38} width={144} height={72} rx={36} fill="#fff" />
          <path d="M -44 28 L -64 58 L -18 32 Z" fill="#fff" />
          {[-34, 0, 34].map((dx, k) => {
            const on = ((e.age * 3 - k * 0.33) % 1 + 1) % 1;
            return <circle key={dx} cx={dx} cy={-2 - Math.max(0, Math.sin(on * Math.PI)) * 6} r={9} fill={color.muted} opacity={0.35 + 0.65 * Math.max(0, Math.sin(on * Math.PI))} />;
          })}
        </>
      )}
    </g>
  );
};

const Star: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
  if (r <= 0.5) return null;
  const q = r * 0.32;
  return <path d={`M ${x} ${y - r} Q ${x + q} ${y - q} ${x + r} ${y} Q ${x + q} ${y + q} ${x} ${y + r} Q ${x - q} ${y + q} ${x - r} ${y} Q ${x - q} ${y - q} ${x} ${y - r} Z`} fill="#F6C451" stroke="#fff" strokeWidth={3} />;
};
