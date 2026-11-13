import { DEFAULT_MOTION_PROPS } from "./config.js";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const toNumber = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const toText = (v, fallback) =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;

// 1. 场景上下文：验证 + 强制类型转换所有参数
export const resolveCandlestickSceneContext = (pluginParams = {}) => {
  const p = { ...DEFAULT_MOTION_PROPS, ...pluginParams };
  return {
    title: toText(p.title, DEFAULT_MOTION_PROPS.title),
    subtitle: toText(p.subtitle, DEFAULT_MOTION_PROPS.subtitle),
    durationSeconds: clamp(toNumber(p.durationSeconds, 28), 2, 120),
    layout: {
      videoWidth: Math.round(clamp(toNumber(p.videoWidth, 1920), 320, 3840)),
      videoHeight: Math.round(clamp(toNumber(p.videoHeight, 1080), 320, 3840)),
    },
  };
};

// 2. 时长计算：durationSeconds * fps
export const getCandlestickDurationInFrames = ({ fps, sceneContext }) =>
  Math.max(1, Math.round(sceneContext.durationSeconds * (fps || 30)));

// 分段缓动：开头 3% 快速建立基线，中间 90% 匀速揭示，结尾减速
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const revealCurve = (t) => {
  const A = 0.03; // 时间占比
  const B = 0.93;
  const pA = 0.06; // 对应揭示进度
  const pB = 0.97;
  if (t <= A) return (t / A) * pA; // 线性快进，避免在 3% 处速度降到 0 再起步
  if (t <= B) return pA + ((t - A) / (B - A)) * (pB - pA);
  return pB + easeOutCubic((t - B) / (1 - B)) * (1 - pB);
};

// 3. 逐帧 props：从 frame/fps 计算 progress 等动画值
export const buildCandlestickSceneProps = ({ frame = 0, fps, loop = false, sceneContext }) => {
  const durationInFrames = getCandlestickDurationInFrames({ fps, sceneContext });
  const f = loop ? frame % durationInFrames : Math.min(frame, durationInFrames - 1);
  // 留最后 1.5 秒停住，揭示在之前完成
  const holdFrames = Math.round(1.5 * (fps || 30));
  const revealEndFrame = Math.max(1, durationInFrames - 1 - holdFrames);
  const t = clamp(f / revealEndFrame, 0, 1);
  return {
    ...sceneContext,
    frame: f,
    fps,
    durationInFrames,
    revealEndFrame,
    progress: revealCurve(t),
    timeProgress: clamp(f / (durationInFrames - 1), 0, 1),
  };
};
