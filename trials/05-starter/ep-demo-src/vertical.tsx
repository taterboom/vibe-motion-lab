/**
 * 竖屏(1080×1920)纯图形镜头 —— 对话气泡语汇。
 *
 *   vchat:标题 + 一串聊天气泡逐条弹出 + 底部结论句(开场抛问题 / 收尾汇总)
 *   vtip :编号要点头 + 对话区(对方原话 → [划掉的错误回法] → 已说过的回复 → 本条新回复 → [对方正在输入])+ 结论句
 *
 * 约定同 content.tsx:被 TalkingHead 套在 <Sequence> 里,useCurrentFrame() 是本地帧,
 *   所有 *AtSec 相对本镜头起点。动效全部 frame 驱动(interpolate 带 clamp / spring 重映射)。
 * 布局按 1080 宽设计,内容框避开竖屏平台 UI(顶部状态/标题区、底部文案区、右侧按钮列)。
 */
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { SceneTag } from '../schema/sceneTag';

const FONT = `${theme.fonts.zh},sans-serif`;
const MONO = `${theme.fonts.mono},${theme.fonts.zh},monospace`;
/** 所有 interpolate 必带双向 clamp(HARD_RULES §3) */
const clampBoth = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 竖屏内容安全框(px @1080×1920):顶部让标题栏、底部让文案/进度条、右侧让点赞评论按钮列 */
const SAFE = { top: 250, bottom: 420, left: 90, right: 150 } as const;

const sec = (s: number | undefined, fps: number) => Math.round((s ?? 0) * fps);

/** 入场进度:spring 0..1(用前须 interpolate 重映射;clamp 会削掉过冲,视觉上是快起软停、不回弹)+ 利落的线性 opacity */
const useEnter = (appearAtFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - appearAtFrames;
  const p = spring({ frame: local, fps, config: { damping: theme.motion.bubbleSpringDamping, mass: 0.7 } });
  const opacity = interpolate(local, [0, 8], [0, 1], clampBoth);
  return { p, opacity, local, fps };
};

/* ───────────────────────────── 气泡 ───────────────────────────── */

type BubbleTone = 'them' | 'you' | 'past' | 'ghost';

const BUBBLE_LOOK: Record<BubbleTone, { bg: string; color: string; glossColor: string; shadow: string }> = {
  them: { bg: theme.colors.white, color: theme.colors.ink, glossColor: theme.colors.inkMuted, shadow: theme.shadow.card },
  you: { bg: theme.colors.blue, color: theme.colors.white, glossColor: 'rgba(255,255,255,.82)', shadow: theme.shadow.card },
  past: { bg: theme.colors.blueSoft, color: theme.colors.ink2, glossColor: theme.colors.inkMuted, shadow: 'none' },
  ghost: { bg: theme.colors.surface, color: theme.colors.inkMuted, glossColor: theme.colors.inkMuted, shadow: 'none' },
};

const Bubble: React.FC<{
  side: 'left' | 'right';
  tone: BubbleTone;
  text?: string;
  gloss?: string;
  label?: string;
  fontSizePx: number;
  appearAtFrames: number;
  /** ghost 专用:划掉的时刻(帧)。不传 = 不划 */
  strikeAtFrames?: number;
  children?: React.ReactNode;
}> = ({ side, tone, text, gloss, label, fontSizePx, appearAtFrames, strikeAtFrames, children }) => {
  const { p, opacity, fps } = useEnter(appearAtFrames);
  const frame = useCurrentFrame();
  const look = BUBBLE_LOOK[tone];
  const strike =
    strikeAtFrames === undefined
      ? 0
      : interpolate(frame, [strikeAtFrames, strikeAtFrames + Math.max(1, Math.round(0.3 * fps))], [0, 1], clampBoth);
  const isLeft = side === 'left';
  return (
    <div
      style={{
        alignSelf: isLeft ? 'flex-start' : 'flex-end',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        gap: 10,
        maxWidth: '100%',
        opacity: opacity * interpolate(strike, [0, 1], [1, 0.6], clampBoth),
        scale: `${interpolate(p, [0, 1], [0.86, 1], clampBoth)}`,
        translate: `0px ${interpolate(p, [0, 1], [36, 0], clampBoth)}px`,
        transformOrigin: isLeft ? 'left bottom' : 'right bottom',
      }}
    >
      {label ? (
        <div style={{ fontFamily: FONT, fontSize: theme.fontSize.minReadable + 2, fontWeight: 700, color: theme.colors.inkMuted, padding: '0 14px' }}>
          {label}
        </div>
      ) : null}
      <div
        style={{
          position: 'relative',
          background: look.bg,
          color: look.color,
          boxShadow: look.shadow,
          borderRadius: 44,
          [isLeft ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 12,
          padding: `${Math.round(fontSizePx * 0.36)}px ${Math.round(fontSizePx * 0.56)}px`,
          fontFamily: FONT,
        }}
      >
        {children ?? (
          <>
            {/* pre-line:文案里的 \n 是手动断行(日文长句按意群断,别让浏览器从词中间折) */}
            <div style={{ fontSize: fontSizePx, fontWeight: 800, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{text}</div>
            {gloss ? (
              <div style={{ fontSize: Math.max(theme.fontSize.minReadable + 6, Math.round(fontSizePx * 0.46)), fontWeight: 700, color: look.glossColor, marginTop: 8 }}>
                {gloss}
              </div>
            ) : null}
          </>
        )}
        {strikeAtFrames !== undefined ? (
          <div
            style={{
              position: 'absolute',
              left: '6%',
              top: gloss ? '40%' : '50%',
              height: 6,
              borderRadius: 3,
              width: `${interpolate(strike, [0, 1], [0, 88], clampBoth)}%`,
              background: theme.focusTones.orange.border,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

/** 对方「正在输入…」三点气泡:点按帧做正弦起伏(确定性,无随机/时钟) */
const TypingBubble: React.FC<{ appearAtFrames: number; label?: string }> = ({ appearAtFrames, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Bubble side="left" tone="them" fontSizePx={60} appearAtFrames={appearAtFrames} label={label}>
      <div style={{ display: 'flex', gap: 14, padding: '14px 4px' }}>
        {[0, 1, 2].map((i) => {
          const wave = Math.sin(((frame - appearAtFrames) / fps) * Math.PI * 2 * 1.6 - i * 0.9);
          return (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: theme.radius.round,
                background: theme.colors.inkMuted,
                opacity: interpolate(wave, [-1, 1], [0.35, 1], clampBoth),
                translate: `0px ${interpolate(wave, [-1, 1], [4, -6], clampBoth)}px`,
              }}
            />
          );
        })}
      </div>
    </Bubble>
  );
};

/* ───────────────────────────── 结论句(荧光笔扫亮) ───────────────────────────── */

const SweepLine: React.FC<{ text: string; sweep?: string; appearAtFrames: number; fontSizePx?: number }> = ({
  text,
  sweep,
  appearAtFrames,
  fontSizePx = 48,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - appearAtFrames;
  const opacity = interpolate(local, [0, 8], [0, 1], clampBoth);
  const dy = interpolate(local, [0, 10], [18, 0], clampBoth);
  const sweepFrom = Math.round(0.25 * fps);
  const sweepP = interpolate(local, [sweepFrom, Math.max(sweepFrom + 1, Math.round(0.65 * fps))], [0, 100], clampBoth);
  const target = sweep && text.includes(sweep) ? sweep : null;
  const idx = target ? text.indexOf(target) : -1;
  const before = target ? text.slice(0, idx) : text;
  const after = target ? text.slice(idx + target.length) : '';
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: fontSizePx,
        fontWeight: 800,
        color: theme.colors.ink,
        lineHeight: 1.35,
        opacity,
        translate: `0px ${dy}px`,
      }}
    >
      {before}
      {target ? (
        <span
          style={{
            backgroundImage: `linear-gradient(${theme.tints.orangeSweep}, ${theme.tints.orangeSweep})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0 90%',
            backgroundSize: `${sweepP}% 42%`,
          }}
        >
          {target}
        </span>
      ) : null}
      {after}
    </div>
  );
};

/* ───────────────────────────── vchat ───────────────────────────── */

export type ChatMessage = {
  side: 'left' | 'right';
  text: string;
  gloss?: string;
  label?: string;
  /** 大号气泡(开场金句用) */
  big?: boolean;
  appearAtSec?: number;
};

export const VChatScene: React.FC<{
  title?: string;
  titleAppearAtSec?: number;
  messages: ChatMessage[];
  caption?: string;
  captionSweep?: string;
  captionAppearAtSec?: number;
}> = ({ title, titleAppearAtSec = 0, messages, caption, captionSweep, captionAppearAtSec = 0 }) => {
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: SAFE.top,
        bottom: SAFE.bottom,
        left: SAFE.left,
        right: SAFE.right,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 34,
      }}
    >
      {title ? <SweepLine text={title} appearAtFrames={sec(titleAppearAtSec, fps)} fontSizePx={60} /> : null}
      {messages.map((m, i) => (
        <Bubble
          key={i}
          side={m.side}
          tone={m.side === 'left' ? 'them' : 'you'}
          text={m.text}
          gloss={m.gloss}
          label={m.label}
          fontSizePx={m.big ? 72 : 54}
          appearAtFrames={sec(m.appearAtSec, fps)}
        />
      ))}
      {caption ? (
        <div style={{ marginTop: 26 }}>
          <SweepLine text={caption} sweep={captionSweep} appearAtFrames={sec(captionAppearAtSec, fps)} fontSizePx={68} />
        </div>
      ) : null}
    </div>
  );
};

/* ───────────────────────────── vtip ───────────────────────────── */

export const VTipScene: React.FC<{
  index: string;
  heading: string;
  /** 对方原话(对话上下文,镜头一开始就在) */
  context?: { text: string; label?: string };
  /** 划掉的错误回法(先出现再被划掉) */
  avoid?: { text: string; label?: string; appearAtSec?: number; strikeAtSec?: number };
  /** 前几条已经说过的回复(压暗小气泡,表现「回复在一条条叠起来」) */
  pastReplies?: { text: string }[];
  reply: { text: string; gloss?: string; label?: string; appearAtSec?: number };
  /** 对方「正在输入…」:表现话题被接下去 */
  typing?: { label?: string; appearAtSec?: number };
  note?: string;
  noteSweep?: string;
  noteAppearAtSec?: number;
}> = ({ index, heading, context, avoid, pastReplies = [], reply, typing, note, noteSweep, noteAppearAtSec = 0 }) => {
  const { fps } = useVideoConfig();
  const head = useEnter(0);
  return (
    <>
      {/* 要点头:编号 + 小标题(固定在顶部,三条要点切换时位置不跳) */}
      <div
        style={{
          position: 'absolute',
          top: SAFE.top,
          left: SAFE.left,
          right: SAFE.right,
          opacity: head.opacity,
          translate: `${interpolate(head.p, [0, 1], [-40, 0], clampBoth)}px 0px`,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 700, color: theme.colors.orange, lineHeight: 1 }}>{index}</div>
        <div style={{ fontFamily: FONT, fontSize: 70, fontWeight: 800, color: theme.colors.ink, lineHeight: 1.25, marginTop: 18 }}>
          {heading}
        </div>
        <div style={{ width: 120, height: 8, borderRadius: 4, background: theme.colors.orange, marginTop: 26 }} />
      </div>

      {/* 对话区 */}
      <div
        style={{
          position: 'absolute',
          top: SAFE.top + 290,
          bottom: SAFE.bottom,
          left: SAFE.left,
          right: SAFE.right,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        {context ? (
          <Bubble side="left" tone="them" text={context.text} label={context.label} fontSizePx={46} appearAtFrames={0} />
        ) : null}
        {avoid ? (
          <Bubble
            side="right"
            tone="ghost"
            text={avoid.text}
            label={avoid.label}
            fontSizePx={46}
            appearAtFrames={sec(avoid.appearAtSec, fps)}
            strikeAtFrames={sec(avoid.strikeAtSec ?? (avoid.appearAtSec ?? 0) + 0.6, fps)}
          />
        ) : null}
        {pastReplies.map((r, i) => (
          <Bubble key={i} side="right" tone="past" text={r.text} fontSizePx={42} appearAtFrames={0} />
        ))}
        <Bubble
          side="right"
          tone="you"
          text={reply.text}
          gloss={reply.gloss}
          label={reply.label}
          fontSizePx={66}
          appearAtFrames={sec(reply.appearAtSec, fps)}
        />
        {typing ? <TypingBubble appearAtFrames={sec(typing.appearAtSec, fps)} label={typing.label} /> : null}
        {note ? (
          <div style={{ marginTop: 18 }}>
            <SweepLine text={note} sweep={noteSweep} appearAtFrames={sec(noteAppearAtSec, fps)} fontSizePx={50} />
          </div>
        ) : null}
      </div>
    </>
  );
};

/* ───────────────────────────── 镜头说明书 ───────────────────────────── */

export const vchatTag: SceneTag = {
  id: 'vchat',
  componentName: 'VChatScene',
  title: '竖屏聊天气泡',
  status: 'experimental',
  intent: '竖屏纯图形:一串左右聊天气泡逐条弹出,配顶部标题与底部荧光笔结论句',
  suitableFor: '开场抛出一句对话/问题,或收尾把完整对话串起来汇总。',
  notFor: '横屏口播片(用 title/list);需要图/数据/截图的段落',
  exampleBeats: ['对方夸你一句 → 抛问题「怎么回?」', '收尾:完整的一来一回'],
  form: 'F0',
  defaultPose: 'audio-only',
  fullscreenOnly: true,
  needsExternalAsset: false,
  assetType: null,
  textBinding: 'messages',
  fields: [
    { key: 'title', label: '标题', type: 'text', tier: 'primary', help: '气泡上方的标题(可空)' },
    {
      key: 'messages', label: '气泡', type: 'list', tier: 'primary', required: true, help: '逐条弹出的聊天气泡',
      itemFields: [
        { key: 'side', label: '哪一方', type: 'enum', tier: 'primary', values: ['left', 'right'], required: true, help: 'left=对方,right=你' },
        { key: 'text', label: '原文', type: 'text', tier: 'primary', required: true, help: '气泡主文字' },
        { key: 'gloss', label: '释义', type: 'text', tier: 'primary', help: '气泡内小字释义' },
        { key: 'label', label: '说话人', type: 'text', tier: 'advanced', help: '气泡上方小标签' },
        { key: 'big', label: '大号', type: 'boolean', tier: 'advanced', help: '金句大号气泡' },
        { key: 'appearAtSec', label: '出现秒', type: 'number', tier: 'advanced', help: '相对本镜头起点' },
      ],
    },
    { key: 'caption', label: '结论句', type: 'text', tier: 'primary', help: '底部大字结论/问题' },
    { key: 'captionSweep', label: '扫亮子串', type: 'text', tier: 'advanced', help: '结论句里荧光笔扫亮的一段' },
    { key: 'captionAppearAtSec', label: '结论出现秒', type: 'number', tier: 'advanced', default: 0, help: '相对本镜头起点' },
    { key: 'titleAppearAtSec', label: '标题出现秒', type: 'number', tier: 'advanced', default: 0, help: '相对本镜头起点' },
  ],
  catalog: { narratorPosition: '无人像', supportingElements: ['聊天气泡', '结论句'], animation: '气泡逐条弹入 + 荧光笔扫亮', background: '纯色浅底' },
  tagVersion: 1,
  promotedFrom: 'inline',
};

export const vtipTag: SceneTag = {
  id: 'vtip',
  componentName: 'VTipScene',
  title: '竖屏编号要点·对话演示',
  status: 'experimental',
  intent: '竖屏纯图形:编号要点头 + 对话演示(可划掉错误回法、叠加已说回复、对方正在输入),落一句结论',
  suitableFor: '「怎么回/怎么说」类表达教学,一条要点配一个对话动作。',
  notFor: '横屏口播片;不涉及对话的要点(用 list)',
  exampleBeats: ['01 别急着否认 → 划掉「いえいえ」→ 说「ありがとうございます」'],
  form: 'F0',
  defaultPose: 'audio-only',
  fullscreenOnly: true,
  needsExternalAsset: false,
  assetType: null,
  textBinding: 'reply',
  fields: [
    { key: 'index', label: '编号', type: 'text', tier: 'primary', required: true, help: '如 01' },
    { key: 'heading', label: '要点标题', type: 'text', tier: 'primary', required: true, help: '一句话要点' },
    { key: 'context', label: '对方原话', type: 'group', tier: 'primary', help: '对话上下文', fields: [
      { key: 'text', label: '原文', type: 'text', tier: 'primary', help: '对方说的话' },
      { key: 'label', label: '说话人', type: 'text', tier: 'advanced', help: '小标签' },
    ] },
    { key: 'avoid', label: '错误回法', type: 'group', tier: 'advanced', help: '先出现再被划掉', fields: [
      { key: 'text', label: '原文', type: 'text', tier: 'advanced', help: '被划掉的回法' },
      { key: 'label', label: '标签', type: 'text', tier: 'advanced', help: '小标签' },
      { key: 'appearAtSec', label: '出现秒', type: 'number', tier: 'advanced', help: '相对本镜头起点' },
      { key: 'strikeAtSec', label: '划掉秒', type: 'number', tier: 'advanced', help: '默认出现后 0.6s' },
    ] },
    { key: 'pastReplies', label: '已说回复', type: 'list', tier: 'advanced', help: '前几条要点的回复(压暗)', itemFields: [
      { key: 'text', label: '原文', type: 'text', tier: 'advanced', help: '回复原文' },
    ] },
    { key: 'reply', label: '本条回复', type: 'group', tier: 'primary', required: true, help: '主角气泡', fields: [
      { key: 'text', label: '原文', type: 'text', tier: 'primary', required: true, help: '回复原文' },
      { key: 'gloss', label: '释义', type: 'text', tier: 'primary', help: '小字释义' },
      { key: 'label', label: '说话人', type: 'text', tier: 'advanced', help: '小标签' },
      { key: 'appearAtSec', label: '出现秒', type: 'number', tier: 'advanced', help: '相对本镜头起点' },
    ] },
    { key: 'typing', label: '对方正在输入', type: 'group', tier: 'advanced', help: '表现话题接下去', fields: [
      { key: 'label', label: '标签', type: 'text', tier: 'advanced', help: '小标签' },
      { key: 'appearAtSec', label: '出现秒', type: 'number', tier: 'advanced', help: '相对本镜头起点' },
    ] },
    { key: 'note', label: '结论句', type: 'text', tier: 'primary', help: '底部一句话' },
    { key: 'noteSweep', label: '扫亮子串', type: 'text', tier: 'advanced', help: '荧光笔扫亮的一段' },
    { key: 'noteAppearAtSec', label: '结论出现秒', type: 'number', tier: 'advanced', default: 0, help: '相对本镜头起点' },
  ],
  catalog: { narratorPosition: '无人像', supportingElements: ['编号要点', '聊天气泡', '结论句'], animation: '气泡弹入 / 划掉 / 正在输入 / 荧光笔扫亮', background: '纯色浅底' },
  tagVersion: 1,
  promotedFrom: 'inline',
};
