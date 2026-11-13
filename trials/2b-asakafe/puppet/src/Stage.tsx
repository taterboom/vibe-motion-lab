import React, {useEffect, useState} from 'react';
import {getAudioData} from '@remotion/media-utils';
import {Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Puppet, looks, restArm, type Arm} from './Puppet';
import {Layer, scenes} from './scenes';
import {pick} from './text';
import {FPS, color, font, stage} from './theme';
import type {CastMember, Clips, Emote, Episode, Expr, Segment, SegmentKind} from './types';

type Wave = Awaited<ReturnType<typeof getAudioData>>;

/** 学习者那个角色。默认演出表里「你」和「其他人」各一列，头顶符号默认冒在「你」头上 */
const LEARNER = 'you';

/** 默认演出表：每个环节里「你」和其他人的表情、头顶符号。按环节类型写，所以三段结构不变时对每一集都成立；
 *  某一集要改，在 tts/epNNN.json 的 stage.beats 里只写不同的部分 */
const defaultBeats: Record<SegmentKind, {you: Expr; others: Expr; emote?: Emote}> = {
  ask: {others: 'smile', you: 'neutral'},
  wait: {others: 'smile', you: 'surprised', emote: 'dots'},
  host: {others: 'smile', you: 'troubled', emote: 'q'},
  hostPause: {others: 'smile', you: 'troubled', emote: 'q'},
  play1: {others: 'smile', you: 'smile'},
  gap: {others: 'smile', you: 'smile'},
  play2: {others: 'smile', you: 'smile'},
  shadow: {others: 'smile', you: 'smile'},
  ask2: {others: 'smile', you: 'neutral'},
  countdown: {others: 'smile', you: 'troubled', emote: 'sweat'},
  answer: {others: 'smile', you: 'smile'},
  beforeReact: {others: 'smile', you: 'happy'},
  react: {others: 'happy', you: 'smile'},
  tail: {others: 'happy', you: 'happy'},
};

const SCALE = 1.2;
const CENTER = 504;

/** 随环节平滑变化的量：镜头、压暗、举起手里的东西。说话人的前倾单独按人算 */
type Pose = {zoom: number; panX: number; dim: number; raise: number};
const poseOf = (s: Segment, speaker?: CastMember): Pose => ({
  zoom: speaker ? 1.08 : 1,
  panX: speaker ? (CENTER - speaker.x) * 0.19 : 0,
  dim: s.kind === 'host' || s.kind === 'hostPause' ? 0.5 : 0,
  raise: s.kind === 'react' || s.kind === 'tail' ? 1 : 0,
});

/** 场景与人物：整集常驻，按 episode.stage 的声明摆场景和人，按当前环节换演出。口型跟当前那句音频的音量走 */
export const Stage: React.FC<{dir: string; episode: Episode; clips: Clips; segments: Segment[]}> = ({dir, episode, clips, segments}) => {
  const frame = useCurrentFrame();
  const waves = useWaves(dir, clips);
  const spec = episode.stage;
  const scene = spec ? scenes[spec.scene] : undefined;
  if (!spec || !scene) {
    // 没声明画面的集：留一块空画框，文字照常
    return <div style={{position: 'absolute', left: stage.left, top: stage.top, width: stage.width, height: stage.height, borderRadius: 36, backgroundColor: color.faint}} />;
  }

  const t = frame / FPS;
  const i = Math.max(0, segments.findIndex((s) => t < s.start + s.dur));
  const seg = segments[i] ?? segments[segments.length - 1];
  const prev = segments[i - 1] ?? seg;
  const member = (s: Segment) => {
    const role = s.audio ? pick(episode, s.audio)?.role : undefined;
    return spec.cast.find((m) => m.role === role);
  };
  const speaker = member(seg);
  const wasSpeaking = member(prev);
  const local = frame - Math.round(seg.start * FPS);

  // 口型两帧一换，像逐张换嘴的纸偶动画
  const stepped = Math.max(0, (Math.floor(frame / 2) * 2) / FPS - seg.start);
  const open = seg.audio && waves?.[seg.audio] ? mouthOpen(waves[seg.audio], stepped) : 0;

  const ease = interpolate(local, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const a = poseOf(prev, wasSpeaking);
  const b = poseOf(seg, speaker);
  const mix = (k: keyof Pose) => a[k] + (b[k] - a[k]) * ease;

  const base = defaultBeats[seg.kind];
  const over = spec.beats?.[seg.kind];
  const exprOf = (role: string): Expr => over?.expr?.[role] ?? (role === LEARNER ? base.you : base.others);
  const emote = over && 'emote' in over ? over.emote : base.emote;
  const emoteOn = spec.cast.find((m) => m.role === (over?.emoteOn ?? LEARNER));

  const intro = interpolate(frame, [0, 24], [1.06, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const lookOf = (m: CastMember) => looks[m.look === LEARNER ? (/_f$/.test(dir) ? 'youF' : 'youM') : m.look] ?? looks.youM;
  const yOf = (m: CastMember) => m.y ?? scene.seatY;

  return (
    <div style={{position: 'absolute', left: stage.left, top: stage.top, width: stage.width, height: stage.height, borderRadius: 36, overflow: 'hidden', backgroundColor: color.faint}}>
      {/* 镜头：整块画面一起缩放平移 */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: `scale(${mix('zoom') * intro}) translateX(${mix('panX')}px)`}}>
        <scene.Back frame={frame} variant={spec.variant} />
        <Layer>
          {spec.cast.map((m, k) => {
            const talking = m === speaker;
            // 说话的人朝对方前倾；开口和收回都缓动
            const lean = m.face * (1.5 + 4 * ((wasSpeaking === m ? 1 - ease : 0) + (talking ? ease : 0)));
            const raise = m.holding ? mix('raise') : 0;
            const held: Arm = {
              elbow: [m.face * (150 + 14 * raise), -122 - 26 * raise],
              hand: [m.face * (162 + 48 * raise), -212 - 76 * raise],
            };
            return (
              <Puppet key={m.role} look={lookOf(m)} x={m.x} y={yOf(m)} scale={m.scale ?? SCALE} face={m.face}
                expr={exprOf(m.role)} mouth={talking ? open : 0} blink={blink(frame, k + 1)}
                bob={Math.sin(frame / 22 + k * 2) * 2.5 - (talking ? open * 4 : 0)} lean={lean} tilt={m.face * (talking ? 3 : 1)}
                armL={m.holding && m.face === -1 ? held : restArm(-1)} armR={m.holding && m.face === 1 ? held : restArm(1)}
                holding={m.holding ? {side: m.face, item: m.holding} : undefined} />
            );
          })}
        </Layer>
        <scene.Front />
        {emote && emoteOn ? (
          <Layer>
            <EmoteMark kind={emote} x={emoteOn.x - emoteOn.face * 132} y={yOf(emoteOn) - 475 * (emoteOn.scale ?? SCALE)} frame={local} />
          </Layer>
        ) : null}
      </div>
      <div style={{position: 'absolute', inset: 0, backgroundColor: color.ink, opacity: mix('dim')}} />
    </div>
  );
};

/** 眨眼：每人周期不同，一次 4 帧 */
const blink = (frame: number, seed: number) => (frame + seed * 37) % (92 + seed * 19) < 4;

/** 一句音频在 t 秒附近的音量 → 开口量 0–1，太小算闭嘴 */
const mouthOpen = (w: Wave, t: number) => {
  const ch = w.channelWaveforms[0];
  const from = Math.floor(t * w.sampleRate);
  const to = Math.min(ch.length, from + Math.floor(w.sampleRate / 15));
  if (to <= from) return 0;
  let sum = 0;
  for (let k = from; k < to; k++) sum += ch[k] * ch[k];
  const rms = Math.sqrt(sum / (to - from));
  const v = Math.min(1, rms / 0.16);
  return v < 0.12 ? 0 : Math.ceil(v * 3) / 3;
};

/** 读入本集所有片段的波形；读完之前挂起渲染 */
const useWaves = (dir: string, clips: Clips) => {
  const [waves, setWaves] = useState<Record<string, Wave> | null>(null);
  const [handle] = useState(() => delayRender('load clip waveforms'));
  useEffect(() => {
    const tags = Object.keys(clips.clips);
    Promise.all(tags.map((tag) => getAudioData(staticFile(`${dir}/${clips.clips[tag].file}`))))
      .then((list) => setWaves(Object.fromEntries(tags.map((tag, k) => [tag, list[k]]))))
      .catch((e) => console.error('waveform load failed, mouths stay closed', e))
      .finally(() => continueRender(handle));
  }, [dir, clips, handle]);
  return waves;
};

const EmoteMark: React.FC<{kind: Emote; x: number; y: number; frame: number}> = ({kind, x, y, frame}) => {
  const pop = spring({frame, fps: FPS, config: {damping: 10, stiffness: 180}});
  const float = Math.sin(frame / 9) * 4;
  return (
    <g transform={`translate(${x} ${y + float}) scale(${pop})`}>
      {kind === 'q' ? (
        <text textAnchor="middle" y={30} fontFamily={font.ja} fontSize={110} fontWeight={800} fill="#3F6FB5" stroke="#fff" strokeWidth={8} paintOrder="stroke">?</text>
      ) : kind === 'sweat' ? (
        <path d="M 0 -44 Q 34 4 0 26 Q -34 4 0 -44 Z" fill="#6DB6E8" stroke="#fff" strokeWidth={6} />
      ) : (
        <>
          <rect x={-66} y={-34} width={132} height={64} rx={32} fill="#fff" />
          <path d="M -40 26 L -58 52 L -16 28 Z" fill="#fff" />
          {[-32, 0, 32].map((dx, k) => (
            <circle key={dx} cx={dx} cy={-2} r={9} fill={color.muted} opacity={frame > k * 8 ? 1 : 0.2} />
          ))}
        </>
      )}
    </g>
  );
};
