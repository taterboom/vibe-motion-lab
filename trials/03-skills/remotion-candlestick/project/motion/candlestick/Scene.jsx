import React, { useCallback, useEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// 深色主题色彩（SKILL.md 原值）
const COLORS = {
  bg: "#1a1a19",
  grid: "#2c2c2a",
  upBorder: "#e66767", // 阳线边框（红）
  upFill: "rgba(230,103,103,0.15)", // 阳线填充（半透明）
  downFill: "#199e70", // 阴线填充（绿）
  textPrimary: "#ffffff",
  textSecondary: "#c3c2b7",
  textMuted: "#898781",
  accent: "#3987e5",
};

// 蜡烛绘制关键参数（SKILL.md 原值）
const CANDLE_GAP_RATIO = 0.28;
const CANDLE_FADE_FRAMES = 22;
const MAX_CANDLE_W = 8;
const MIN_CANDLE_W = 0.6;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const niceStep = (range, target) => {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
};

const fmt = (v) => Math.round(v).toLocaleString("en-US");

export const CandlestickScene = ({
  title,
  subtitle,
  progress,
  timeProgress,
  revealEndFrame,
  layout,
  onAutoLayoutReady,
}) => {
  const canvasRef = useRef(null);
  const [data, setData] = useState(null);
  const [dataHandle] = useState(() => delayRender("Loading data"));

  useEffect(() => {
    fetch(staticFile("data/sp500-weekly.json"))
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        continueRender(dataHandle);
      })
      .catch((err) => cancelRender(err));
  }, [dataHandle]);

  useEffect(() => {
    if (data) onAutoLayoutReady?.();
  }, [data, onAutoLayoutReady]);

  const W = layout?.videoWidth ?? 1920;
  const H = layout?.videoHeight ?? 1080;
  const scale = W / 1920;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const N = data.length;
    // 揭示到第几根（小数）
    const revealPos = progress * (N - 1);
    const revealed = Math.max(1, Math.min(N, Math.floor(revealPos) + 1));
    const framesPerCandle = revealEndFrame / Math.max(1, N - 1);
    // 当前虚拟帧（以蜡烛出现时间计）
    const currentFrame = revealPos * framesPerCandle;

    // 1. 背景
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 72 * scale, r: 150 * scale, t: 170 * scale, b: 110 * scale };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;

    // 横轴：可见槽位随揭示数量增长（逐步缩小视野）
    const visibleCount = Math.min(N, Math.max(40, revealed * 1.12));
    const slotW = plotW / visibleCount;
    let gap = CANDLE_GAP_RATIO;
    if (slotW < 1) gap = 0.1;
    const bodyW = Math.max(MIN_CANDLE_W, Math.min(MAX_CANDLE_W * scale, slotW * (1 - gap)));

    // 纵轴：按已揭示蜡烛的高低价自适应
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < revealed; i++) {
      if (data[i].l < lo) lo = data[i].l;
      if (data[i].h > hi) hi = data[i].h;
    }
    const span = Math.max(hi - lo, hi * 0.05);
    const yMin = Math.max(0, lo - span * 0.08);
    const yMax = hi + span * 0.08;
    const yOf = (v) => pad.t + plotH * (1 - (v - yMin) / (yMax - yMin));
    const xOf = (i) => pad.l + slotW * (i + 0.5);

    // 2. 网格线 + Y 轴价格刻度
    const step = niceStep(yMax - yMin, 6);
    ctx.font = `${16 * scale}px "JetBrains Mono Variable", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) {
      const y = yOf(v);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
      ctx.fillStyle = COLORS.textMuted;
      ctx.fillText(fmt(v), pad.l + plotW + 14 * scale, y);
    }

    // 3. 蜡烛（wick + body）
    for (let i = 0; i < revealed; i++) {
      const d = data[i];
      const appearFrame = i * framesPerCandle;
      const candleAge = currentFrame - appearFrame;
      const fadeAlpha = Math.min(1, Math.max(0, candleAge / CANDLE_FADE_FRAMES));
      if (fadeAlpha <= 0) continue;
      const up = d.c >= d.o;
      const x = xOf(i);
      const highY = yOf(d.h);
      const lowY = yOf(d.l);
      const bodyTop = yOf(Math.max(d.o, d.c));
      let bodyBottom = yOf(Math.min(d.o, d.c));
      let displayTop = bodyTop;
      let displayHighY = highY;
      if (candleAge < CANDLE_FADE_FRAMES && candleAge > 0) {
        const growT = easeOutCubic(candleAge / CANDLE_FADE_FRAMES);
        displayTop = lerp(lowY, bodyTop, growT);
        displayHighY = lerp(lowY, highY, growT);
        bodyBottom = lerp(lowY, bodyBottom, growT);
      }
      ctx.globalAlpha = fadeAlpha;
      ctx.strokeStyle = up ? COLORS.upBorder : COLORS.downFill;
      ctx.lineWidth = Math.max(0.6, Math.min(1.5 * scale, bodyW * 0.25));
      ctx.beginPath();
      ctx.moveTo(x, displayHighY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      const h = Math.max(1, bodyBottom - displayTop);
      if (up) {
        ctx.fillStyle = COLORS.upFill;
        ctx.fillRect(x - bodyW / 2, displayTop, bodyW, h);
        if (bodyW > 2) ctx.strokeRect(x - bodyW / 2, displayTop, bodyW, h);
      } else {
        ctx.fillStyle = COLORS.downFill;
        ctx.fillRect(x - bodyW / 2, displayTop, bodyW, h);
      }
      ctx.globalAlpha = 1;
    }

    // 当前价位虚线 + 右侧标签
    const last = data[revealed - 1];
    const lastY = yOf(last.c);
    ctx.setLineDash([4 * scale, 4 * scale]);
    ctx.strokeStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(pad.l, lastY);
    ctx.lineTo(pad.l + plotW, lastY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(pad.l + plotW + 6 * scale, lastY - 13 * scale, 100 * scale, 26 * scale);
    ctx.fillStyle = COLORS.textPrimary;
    ctx.fillText(fmt(last.c), pad.l + plotW + 14 * scale, lastY);

    // 4. X 轴年份标签
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = COLORS.textMuted;
    const yearsVisible = visibleCount / 52;
    const yearStep = yearsVisible > 24 ? 5 : yearsVisible > 10 ? 2 : 1;
    let prevYear = null;
    for (let i = 0; i < revealed; i++) {
      const y = new Date(data[i].t * 1000).getUTCFullYear();
      if (y !== prevYear) {
        if (prevYear !== null && y % yearStep === 0) {
          ctx.fillText(String(y), xOf(i), pad.t + plotH + 14 * scale);
        }
        prevYear = y;
      }
    }

    // 5. 标题 / 副标题 / 统计信息
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = `600 ${52 * scale}px "JetBrains Mono Variable", monospace`;
    ctx.fillText(title, pad.l, 92 * scale);
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `${24 * scale}px "PingFang SC", sans-serif`;
    ctx.fillText(subtitle, pad.l, 132 * scale);

    const first = data[0];
    const change = last.c - first.o;
    const pct = (change / first.o) * 100;
    const upColor = change >= 0 ? COLORS.upBorder : COLORS.downFill;
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = `600 ${64 * scale}px "JetBrains Mono Variable", monospace`;
    ctx.fillText(fmt(last.c), W - pad.l, 92 * scale);
    ctx.fillStyle = upColor;
    ctx.font = `${22 * scale}px "JetBrains Mono Variable", monospace`;
    ctx.fillText(
      `${change >= 0 ? "+" : ""}${fmt(change)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`,
      W - pad.l,
      128 * scale
    );
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `${18 * scale}px "JetBrains Mono Variable", monospace`;
    ctx.fillText(new Date(last.t * 1000).toISOString().slice(0, 10), W - pad.l, 156 * scale);

    // 6. 进度条
    const barY = H - 34 * scale;
    ctx.fillStyle = COLORS.grid;
    ctx.fillRect(pad.l, barY, W - pad.l * 2, 4 * scale);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(pad.l, barY, (W - pad.l * 2) * clamp(timeProgress, 0, 1), 4 * scale);
  }, [data, progress, timeProgress, revealEndFrame, W, H, scale, title, subtitle]);

  useEffect(() => {
    draw();
  }, [draw]);

  return <canvas ref={canvasRef} style={{ width: W, height: H, display: "block" }} />;
};
