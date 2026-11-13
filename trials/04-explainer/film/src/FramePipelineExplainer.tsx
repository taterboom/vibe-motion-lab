import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';
import {DemoScene, Thumb} from './components/DemoScene';
import {Beat, DEMO, demoTimeline, filmState, FilmState} from './timeline';

export const explainerSchema = z.object({
  beats: z.array(
    z.object({id: z.string(), startFrame: z.number().int(), endFrame: z.number().int(), statement: z.string()}),
  ),
  period: z.number().int().min(12).max(120),
  holdFrom: z.number().int(),
  colors: z.object({
    frame: zColor(),
    x: zColor(),
    squash: zColor(),
    color: zColor(),
    camera: zColor(),
  }),
  freezeAt: z.number().int().optional(), // HeroFrame / debugging: render a fixed state
});
export type ExplainerProps = z.infer<typeof explainerSchema>;

// palette borrowed from shot-library ProductionSystem.tsx themes.studio
const P = {
  bg: '#10120f',
  surface: '#1c1f1a',
  line: '#353a34',
  text: '#fffdf7',
  muted: '#aeb5a7',
};
const ZH = 'PingFang SC, Hiragino Sans GB, sans-serif';
const MONO = 'Menlo, SFMono-Regular, monospace';

// world geometry (see src/data/persistent-objects.json)
const FN = {x: 130, y: 400, w: 380, h: 260};
const VP = {x: 580, y: 300, w: 420, h: 360};
const SC = {x: 1080, y: 300, w: 744, h: 420};
const GRID = {x: 300, y: 790, colW: 54, rowH: 40, tw: 50, th: 28};
const FF = {x: 1420, y: 790, w: 160, h: 120};
const VID = {x: 1620, y: 790, w: 204, h: 120};
const rowCenter = (i: number) => VP.y + 110 + i * 70;
const fnLineY = (i: number) => FN.y + 92 + i * 33;

const Panel: React.FC<React.PropsWithChildren<{r: {x: number; y: number; w: number; h: number}; style?: React.CSSProperties}>> = ({
  r,
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      borderRadius: 22,
      background: P.surface,
      border: `2px solid ${P.line}`,
      boxShadow: '0 24px 60px rgba(0,0,0,.35)',
      ...style,
    }}
  >
    {children}
  </div>
);

const Wire: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; p: number}> = ({x1, y1, x2, y2, color, p}) => {
  const mx = (x1 + x2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) * 1.3 + 10;
  return (
    <path
      d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      strokeDasharray={len}
      strokeDashoffset={len * (1 - p)}
      opacity={p > 0 ? 0.9 : 0}
    />
  );
};

const StatementBar: React.FC<{s: FilmState}> = ({s}) => (
  <div
    style={{
      position: 'absolute',
      left: 96,
      top: 54,
      width: 1728,
      height: 96,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: ZH,
      fontSize: 52,
      fontWeight: 800,
      color: P.text,
      opacity: s.statementIn,
      transform: `translateY(${24 * (1 - s.statementIn)}px)`,
      letterSpacing: 1,
    }}
  >
    {s.active.statement}
  </div>
);

const FrameChip: React.FC<{s: FilmState; c: ExplainerProps['colors']}> = ({s, c}) => {
  const ch = s.chip;
  return (
    <div
      style={{
        position: 'absolute',
        left: ch.x,
        top: ch.y,
        width: ch.w,
        height: ch.h,
        borderRadius: 20,
        border: `3px solid ${c.frame}`,
        background: '#171a14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 26px',
        boxSizing: 'border-box',
        opacity: ch.opacity * ch.dim,
        zIndex: 5,
      }}
    >
      <span style={{fontFamily: ZH, fontSize: Math.max(24, ch.fontSize * 0.32), color: P.muted, fontWeight: 700}}>{ch.label}</span>
      <span style={{fontFamily: MONO, fontSize: ch.fontSize, color: c.frame, fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>
        {String(s.d).padStart(2, '0')}
      </span>
    </div>
  );
};

const TimelineFn: React.FC<{s: FilmState; c: ExplainerProps['colors']; period: number}> = ({s, c, period}) => {
  const lines: Array<[string, string]> = [
    [`t = frame ÷ ${period}`, P.text],
    [`x = ${DEMO.xFrom}+${DEMO.xTo - DEMO.xFrom}·t`, c.x],
    ['squash = 1−0.3·触地', c.squash],
    ['color = hue(205→20)', c.color],
    ['camera = 1+0.15·s(t)', c.camera],
  ];
  return (
    <Panel
      r={FN}
      style={{
        opacity: s.fn.opacity,
        transform: `translateY(${s.fn.rise}px)`,
        border: `2px solid ${s.fn.lit ? c.frame : P.line}`,
        boxShadow: s.fn.lit ? `0 0 0 8px ${c.frame}1f, 0 24px 60px rgba(0,0,0,.35)` : undefined,
      }}
    >
      <div style={{position: 'absolute', left: 26, top: 18, fontFamily: ZH, fontSize: 28, fontWeight: 800, color: P.text}}>时间线函数</div>
      <div style={{position: 'absolute', left: 26, top: 56, fontFamily: MONO, fontSize: 20, color: P.muted}}>
        timeline(frame)
      </div>
      {lines.map(([txt, col], i) => (
        <div
          key={txt}
          style={{
            position: 'absolute',
            left: 26,
            top: fnLineY(i) - FN.y,
            fontFamily: MONO,
            fontSize: 21,
            color: col,
            opacity: s.fn.lineReveal(i),
            whiteSpace: 'nowrap',
          }}
        >
          {txt}
        </div>
      ))}
    </Panel>
  );
};

const ValuePanel: React.FC<{s: FilmState; c: ExplainerProps['colors']}> = ({s, c}) => {
  const v = s.values;
  const rows = [
    {zh: '位置', en: 'x', val: `${v.x.toFixed(0)} px`, bar: (v.x - DEMO.xFrom) / (DEMO.xTo - DEMO.xFrom), col: c.x},
    {zh: '压扁', en: 'squash', val: v.squash.toFixed(2), bar: (1 - v.squash) / 0.3, col: c.squash},
    {zh: '颜色', en: 'color', val: `hue ${v.hue.toFixed(0)}`, bar: -1, col: c.color},
    {zh: '相机', en: 'camera', val: `${v.camera.toFixed(2)}×`, bar: (v.camera - 1) / 0.15, col: c.camera},
  ];
  return (
    <Panel r={VP} style={{opacity: s.values4.panelOpacity}}>
      <div style={{position: 'absolute', left: 26, top: 18, fontFamily: ZH, fontSize: 28, fontWeight: 800, color: P.text}}>
        这一帧的数值
      </div>
      {rows.map((r, i) => {
        const p = s.values4.row(i);
        const pulse = s.values4.pulse(i);
        return (
          <div
            key={r.en}
            style={{
              position: 'absolute',
              left: 16,
              top: rowCenter(i) - VP.y - 28,
              width: VP.w - 32,
              height: 56,
              borderRadius: 14,
              background: pulse > 0 ? `${r.col}${Math.round(pulse * 60).toString(16).padStart(2, '0')}` : 'transparent',
              opacity: p,
              transform: `translateX(${-20 * (1 - p)}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 12px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{width: 10, height: 34, borderRadius: 5, background: r.col}} />
            <span style={{fontFamily: ZH, fontSize: 26, fontWeight: 700, color: P.text, width: 60}}>{r.zh}</span>
            <span style={{fontFamily: MONO, fontSize: 20, color: P.muted, width: 90}}>{r.en}</span>
            <span style={{fontFamily: MONO, fontSize: 26, color: r.col, width: 120, textAlign: 'right', fontVariantNumeric: 'tabular-nums'}}>
              {r.val}
            </span>
            {r.bar >= 0 ? (
              <span style={{position: 'relative', width: 56, height: 10, borderRadius: 5, background: '#2c3029'}}>
                <span style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(1, r.bar) * 100}%`, borderRadius: 5, background: r.col}} />
              </span>
            ) : (
              <span style={{width: 56, height: 28, borderRadius: 8, background: v.color, border: '2px solid #ffffff44'}} />
            )}
          </div>
        );
      })}
    </Panel>
  );
};

const Chart: React.FC<{s: FilmState; c: ExplainerProps['colors']; period: number}> = ({s, c, period}) => {
  const W = SC.w;
  const H = SC.h;
  const m = {l: 70, r: 40, t: 40, b: 60};
  const px = (d: number) => m.l + ((W - m.l - m.r) * d) / (period - 1);
  const pyX = (x: number) => m.t + (H - m.t - m.b) * (1 - (x - DEMO.xFrom) / (DEMO.xTo - DEMO.xFrom));
  const pyS = (q: number) => m.t + (H - m.t - m.b) * ((1 - q) / 0.3) * 0.95 + 4;
  const upto = s.d;
  const pts = Array.from({length: upto + 1}, (_, d) => demoTimeline(d, period));
  const contacts = Array.from({length: period}, (_, d) => d).filter((d) => demoTimeline(d, period).squash <= 0.7001);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: s.scene.chart}}>
      <line x1={m.l} y1={H - m.b} x2={W - m.r} y2={H - m.b} stroke="#4a5046" strokeWidth={2} />
      <line x1={m.l} y1={m.t} x2={m.l} y2={H - m.b} stroke="#4a5046" strokeWidth={2} />
      <text x={m.l} y={H - 22} fill={P.muted} fontSize={20} fontFamily={MONO}>0</text>
      <text x={W - m.r - 30} y={H - 22} fill={P.muted} fontSize={20} fontFamily={MONO}>{period - 1}</text>
      <text x={W / 2 - 40} y={H - 22} fill={P.muted} fontSize={20} fontFamily={ZH}>帧号 →</text>
      <polyline points={pts.map((v, d) => `${px(d)},${pyX(v.x)}`).join(' ')} fill="none" stroke={c.x} strokeWidth={4} />
      <polyline points={pts.map((v, d) => `${px(d)},${pyS(v.squash)}`).join(' ')} fill="none" stroke={c.squash} strokeWidth={4} />
      <text x={m.l + 10} y={m.t + 48} fill={c.x} fontSize={22} fontFamily={ZH}>位置 x</text>
      <text x={m.l + 120} y={m.t + 48} fill={c.squash} fontSize={22} fontFamily={ZH}>压扁 squash（向下 = 更扁）</text>
      <line x1={px(upto)} y1={m.t} x2={px(upto)} y2={H - m.b} stroke="#ffffff55" strokeWidth={2} />
      {contacts
        .filter((d) => d <= upto)
        .map((d) => (
          <g key={d}>
            <circle cx={px(d)} cy={pyS(0.7)} r={9} fill={c.squash} />
            <text x={px(d) + 16} y={pyS(0.7) - 18} fill={P.text} fontSize={22} fontFamily={ZH}>
              ✓ 第 {d} 帧触地 0.70
            </text>
          </g>
        ))}
    </svg>
  );
};

const ScenePanel: React.FC<{s: FilmState; c: ExplainerProps['colors']; period: number}> = ({s, c, period}) => {
  const o = s.scene.open;
  const b = s.browser;
  return (
    <>
      {/* browser chrome: slides down onto the scene panel */}
      <div
        style={{
          position: 'absolute',
          left: SC.x,
          top: SC.y - 46 - 30 * (1 - b.in),
          width: SC.w,
          height: 46,
          borderRadius: '16px 16px 0 0',
          background: '#2b302a',
          opacity: b.in,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 18px',
          boxSizing: 'border-box',
          fontFamily: ZH,
          fontSize: 22,
          color: P.muted,
        }}
      >
        <span style={{width: 14, height: 14, borderRadius: '50%', background: b.mode === 'chrome' ? '#ff7658' : '#5b6157'}} />
        <span style={{color: P.text, fontWeight: 700}}>{b.mode === 'chrome' ? '无头浏览器' : 'node · 不开浏览器'}</span>
        <span style={{fontFamily: MONO, fontSize: 20}}>{b.mode === 'chrome' ? 'headless Chrome' : 'timeline(0…59)'}</span>
        <span style={{marginLeft: 'auto', fontFamily: MONO, color: b.mode === 'chrome' ? P.text : P.muted}}>
          {b.mode === 'chrome' ? `已截 ${b.captured}/${period}` : '不截图'}
        </span>
      </div>
      <Panel
        r={SC}
        style={{
          overflow: 'hidden',
          opacity: o,
          transform: `scale(${0.92 + 0.08 * o})`,
          borderRadius: b.in > 0.5 ? '0 0 16px 16px' : 22,
          padding: 0,
        }}
      >
        <DemoScene values={s.values} width={SC.w - 4} ballOpacity={s.scene.ballOpacity} />
        <div style={{position: 'absolute', left: 18, top: 14, fontFamily: ZH, fontSize: 26, fontWeight: 800, color: P.text, opacity: 1 - s.scene.chart}}>
          画面组件 <span style={{fontFamily: MONO, fontSize: 20, color: P.muted}}>Scene(数值)</span>
        </div>
        <Chart s={s} c={c} period={period} />
      </Panel>
    </>
  );
};

const FilmStrip: React.FC<{s: FilmState; period: number}> = ({s, period}) => {
  const cols = period / 3;
  const st = s.strip;
  return (
    <div style={{opacity: st.dim * st.titleIn}}>
      <div style={{position: 'absolute', left: GRID.x, top: GRID.y - 46, fontFamily: ZH, fontSize: 26, fontWeight: 700, color: P.text, opacity: st.titleIn}}>
        {st.mode === 'serial' ? '图片' : '3 个进程同时截图，各 20 帧'}
        <span style={{fontFamily: MONO, fontSize: 20, color: P.muted, marginLeft: 14}}>
          {st.mode === 'serial' ? `0000.png … ${String(period - 1).padStart(4, '0')}.png` : '帧之间互不依赖'}
        </span>
      </div>
      {[0, 1, 2].map((r) => (
        <div
          key={r}
          style={{
            position: 'absolute',
            left: 130,
            top: GRID.y + r * GRID.rowH,
            width: 160,
            height: GRID.th,
            fontFamily: ZH,
            fontSize: 21,
            color: P.muted,
            opacity: st.titleIn,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{color: st.mode === 'parallel' ? P.text : P.muted, fontWeight: 700}}>{st.mode === 'parallel' ? `进程${r + 1} ` : '帧 '}</span>
          <span style={{fontFamily: MONO}}>{r * cols}–{r * cols + cols - 1}</span>
        </div>
      ))}
      {Array.from({length: period}, (_, i) => {
        const r = Math.floor(i / cols);
        const col = i % cols;
        const slot = st.slot(i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: GRID.x + col * GRID.colW,
              top: GRID.y + r * GRID.rowH,
              width: GRID.tw,
              height: GRID.th,
              borderRadius: 4,
              border: `1px solid ${slot.pop > 0 ? '#ffffff' : '#3a3f37'}`,
              overflow: 'hidden',
              background: '#161914',
              transform: `scale(${1 + 0.15 * slot.pop})`,
              zIndex: slot.pop > 0 ? 3 : 1,
            }}
          >
            <div style={{opacity: slot.filled * (slot.consumed ? 0.35 : 1)}}>
              <Thumb d={i} width={GRID.tw} period={period} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Encoder: React.FC<{s: FilmState; c: ExplainerProps['colors']}> = ({s, c}) => {
  const e = s.ffmpeg;
  return (
    <div style={{opacity: e.in * e.dim * s.strip.dim}}>
      <Panel r={FF} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
        <div style={{fontFamily: MONO, fontSize: 28, fontWeight: 700, color: P.text}}>ffmpeg</div>
        <div style={{fontSize: 34, color: P.muted, transform: `rotate(${e.progress * 540}deg)`}}>⚙</div>
      </Panel>
      <Panel r={VID} style={{padding: '14px 16px', boxSizing: 'border-box', lineHeight: 1.25}}>
        <div style={{fontFamily: ZH, fontSize: 24, fontWeight: 700, color: P.text}}>
          ▶ 视频 <span style={{fontFamily: MONO, fontSize: 18, color: P.muted}}>.mp4</span>
        </div>
        <div style={{marginTop: 12, height: 12, borderRadius: 6, background: '#2c3029', overflow: 'hidden'}}>
          <div style={{width: `${e.progress * 100}%`, height: '100%', background: c.frame}} />
        </div>
        <div style={{marginTop: 6, fontFamily: MONO, fontSize: 20, lineHeight: 1.2, whiteSpace: 'nowrap', color: e.progress >= 1 ? c.frame : P.muted}}>
          {Math.round(e.progress * 60)}/60 帧
        </div>
      </Panel>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <Wire x1={GRID.x + 20 * GRID.colW} y1={GRID.y + 50} x2={FF.x} y2={FF.y + 60} color={c.frame} p={e.in} />
        <Wire x1={FF.x + FF.w} y1={FF.y + 60} x2={VID.x} y2={VID.y + 60} color={c.frame} p={e.progress > 0 ? 1 : 0} />
      </svg>
    </div>
  );
};

export const FramePipelineExplainer: React.FC<ExplainerProps> = ({beats, period, holdFrom, colors, freezeAt}) => {
  const raw = useCurrentFrame();
  // single display frame: every child freezes together in the final hold
  const f = freezeAt ?? Math.min(raw, holdFrom);
  const s = filmState(f, beats as Beat[], period);
  const c = colors;
  const cam = s.camera;
  const v4 = s.values4;
  return (
    <AbsoluteFill style={{background: P.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: '0 0',
          transform: `translate(${960 - cam.cx * cam.scale}px, ${540 - cam.cy * cam.scale}px) scale(${cam.scale})`,
        }}
      >
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: s.upper}}>
          {[c.x, c.squash, c.color, c.camera].map((col, i) => (
            <Wire key={`a${i}`} x1={FN.x + FN.w} y1={fnLineY(i + 1) + 13} x2={VP.x} y2={rowCenter(i)} color={col} p={v4.wire(i)} />
          ))}
          {[c.x, c.squash, c.color, c.camera].map((col, i) => (
            <Wire key={`b${i}`} x1={VP.x + VP.w} y1={rowCenter(i)} x2={SC.x} y2={SC.y + 90 + i * 80} color={col} p={s.scene.wire(i)} />
          ))}
          {/* chip -> fn input */}
          <Wire x1={FN.x + FN.w / 2} y1={380} x2={FN.x + FN.w / 2} y2={FN.y} color={c.frame} p={s.fn.lit ? 1 : 0} />
        </svg>
        <div style={{opacity: s.upper}}>
          <TimelineFn s={s} c={c} period={period} />
          <ValuePanel s={s} c={c} />
          <ScenePanel s={s} c={c} period={period} />
        </div>
        <FilmStrip s={s} period={period} />
        <Encoder s={s} c={c} />
        <FrameChip s={s} c={c} />
      </div>
      <StatementBar s={s} />
    </AbsoluteFill>
  );
};
