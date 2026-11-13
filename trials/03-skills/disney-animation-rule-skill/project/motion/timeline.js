import { DEFAULT_MOTION_PROPS } from "./config.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toInt = (value, fallback, min, max) =>
  Math.round(clamp(toNumber(value, fallback), min, max));

const toPositiveFrames = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : fallback;
};

const toFrame = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
};

// ---------- 通用小工具 ----------
const lerp = (a, b, t) => a + (b - a) * t;
const progressIn = (t, start, end) => clamp((t - start) / (end - start), 0, 1);
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const easeInQuad = (t) => t * t;

// 角色静止时的姿势。所有通道都有默认值，场景只读这些数。
export const REST_POSE = Object.freeze({
  lift: 0, // 离地高度，px（向上为正）
  scaleX: 1,
  scaleY: 1,
  tiltDeg: 0,
  eyeOffsetY: 0, // 眼睛相对身体的上下偏移，px
  eyeOpen: 1, // 1 = 睁开，0 = 闭上
  pupilOffsetY: 0,
});

// ---------- 版本 A：不看技能，按平时的写法 ----------
// 2 秒 = 60 帧：停 0.4s → 起跳上升 0.5s（ease-out）→ 下落 0.5s（ease-in）→ 落地压扁回弹 0.3s → 停
const jumpA = (timeSec) => {
  const JUMP_HEIGHT = 300;
  const T_START = 0.4;
  const T_APEX = 0.9;
  const T_LAND = 1.4;
  const T_SETTLE = 1.7;

  const pose = { ...REST_POSE };

  if (timeSec >= T_START && timeSec < T_APEX) {
    const p = progressIn(timeSec, T_START, T_APEX);
    pose.lift = JUMP_HEIGHT * easeOutQuad(p);
    // 上升时略微拉长
    pose.scaleY = lerp(1.08, 1, p);
    pose.scaleX = lerp(0.94, 1, p);
  } else if (timeSec >= T_APEX && timeSec < T_LAND) {
    const p = progressIn(timeSec, T_APEX, T_LAND);
    pose.lift = JUMP_HEIGHT * (1 - easeInQuad(p));
    pose.scaleY = lerp(1, 1.06, p);
    pose.scaleX = lerp(1, 0.96, p);
  } else if (timeSec >= T_LAND && timeSec < T_SETTLE) {
    // 落地：压扁后回到原样
    const p = progressIn(timeSec, T_LAND, T_SETTLE);
    const squash = Math.sin(Math.PI * p) * (1 - p * 0.3);
    pose.scaleY = 1 - 0.18 * squash;
    pose.scaleX = 1 + 0.14 * squash;
  }

  // 落地时眨一下眼
  pose.eyeOpen = 1 - 0.8 * Math.sin(Math.PI * progressIn(timeSec, 1.4, 1.6));
  return pose;
};

// ---------- 版本 B：照 disney-animation-rule-skill 写 ----------
// 动作一句话：团子先蹲下、眼睛往上看（要跳了），猛地蹬地拉长升空，在顶点多停一下，
// 下落比上升快，砸地压扁（压多少看落地速度），再弹两下回到原形；脸（眼睛）比身体慢半拍。
// 主动作：身体竖直位移。次要：眼睛的滞后和眨眼。
// 阶段表（30fps 帧数，合计 60 帧 = 2 秒）：
const FPS_BASE = 30;
const PHASES_B = [
  ["introHold", 6], // 站定，轻轻吸一口气（停顿不冻结所有通道）
  ["anticipation", 8], // 下蹲，眼睛上看
  ["anticHold", 3], // 蹲住，让准备姿势读得出
  ["ascent", 9], // 蹬地快速升空，前 2 帧是蹲姿释放
  ["hangtime", 12], // 顶点悬停，略微再上浮一点
  ["descent", 7], // 加速下落（比上升短）
  ["landingSquash", 4], // 砸地压扁
  ["recovery", 11], // 阻尼回弹，回到原形
];

const BODY_H = 260; // 和 Scene 里的身体高度一致；高度、速度都按身体尺寸归一
const JUMP_H = 1.2 * BODY_H;

const buildPhaseTable = (phases) => {
  let start = 0;
  const table = {};
  for (const [name, frames] of phases) {
    const dur = frames / FPS_BASE;
    table[name] = { start, end: start + dur, dur };
    start += dur;
  }
  return table;
};
const PB = buildPhaseTable(PHASES_B);

const local = (t, name) => progressIn(t, PB[name].start, PB[name].end);
const inPhase = (t, name) => t >= PB[name].start && t < PB[name].end;

// 三次 Hermite：同时控制两端位置和速度（速度单位 px/s）
const hermite = (p0, p1, v0, v1, dur, u) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * p0 +
    (u3 - 2 * u2 + u) * v0 * dur +
    (-2 * u3 + 3 * u2) * p1 +
    (u3 - u2) * v1 * dur
  );
};

// 边界速度：上升起点快、到顶慢；悬停段两端速度对接；下落末端最快
const V_LAUNCH = 2.2 * (JUMP_H / PB.ascent.dur);
const V_APEX_IN = 0.15 * (JUMP_H / PB.ascent.dur);
const APEX_END_H = JUMP_H - 0.02 * BODY_H;
const V_APEX_OUT = -V_APEX_IN;
const V_IMPACT = -2.0 * (APEX_END_H / PB.descent.dur);

// 主动作：离地高度，纯函数
const liftB = (t) => {
  if (t < PB.ascent.start || t >= PB.landingSquash.start) return 0;
  if (inPhase(t, "ascent")) {
    return hermite(0, JUMP_H, V_LAUNCH, V_APEX_IN, PB.ascent.dur, local(t, "ascent"));
  }
  if (inPhase(t, "hangtime")) {
    return hermite(JUMP_H, APEX_END_H, V_APEX_IN, V_APEX_OUT, PB.hangtime.dur, local(t, "hangtime"));
  }
  return hermite(APEX_END_H, 0, V_APEX_OUT, V_IMPACT, PB.descent.dur, local(t, "descent"));
};

// 从主动作采样速度（px/s，向上为正）
const velocityB = (t) => {
  const dt = 1 / 240;
  return (liftB(t + dt) - liftB(t - dt)) / (2 * dt);
};

// 速度驱动的拉长：只在空中、只和速度成正比
const stretchFromSpeed = (v) => 1 + clamp(0.024 * (Math.abs(v) / BODY_H), 0, 0.22);
// 落地压扁量由来袭速度决定
const IMPACT_SQUASH = clamp(0.028 * (Math.abs(V_IMPACT) / BODY_H), 0, 0.32);
const easeInOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

const scaleYB = (t) => {
  const CROUCH = 0.22;
  if (t < PB.anticipation.start) {
    return 1 + 0.015 * Math.sin(Math.PI * local(t, "introHold"));
  }
  if (inPhase(t, "anticipation")) {
    return 1 - CROUCH * easeInOutCubic(local(t, "anticipation"));
  }
  if (inPhase(t, "anticHold")) {
    return 1 - CROUCH - 0.02 * easeOutQuad(local(t, "anticHold"));
  }
  const crouched = 1 - CROUCH - 0.02;
  if (inPhase(t, "ascent")) {
    // 前 2 帧从蹲姿释放到拉长
    const release = easeOutQuad(clamp((t - PB.ascent.start) / (2 / FPS_BASE), 0, 1));
    return lerp(crouched, stretchFromSpeed(velocityB(t)), release);
  }
  if (inPhase(t, "hangtime") || inPhase(t, "descent")) {
    return stretchFromSpeed(velocityB(t));
  }
  const sMin = 1 - IMPACT_SQUASH;
  if (inPhase(t, "landingSquash")) {
    const u = local(t, "landingSquash");
    const sIn = stretchFromSpeed(V_IMPACT);
    if (u < 0.5) return lerp(sIn, sMin, easeOutQuad(u / 0.5));
    return lerp(sMin, sMin + 0.02, (u - 0.5) / 0.5);
  }
  // 恢复：闭式阻尼振荡，不靠上一帧的状态
  const tau = t - PB.recovery.start;
  const s0 = sMin + 0.02;
  return 1 - (1 - s0) * Math.exp(-8.8 * tau) * Math.cos(18.85 * tau);
};

const jumpB = (timeSec) => {
  const t = timeSec;
  const pose = { ...REST_POSE };
  pose.lift = liftB(t);
  pose.scaleY = scaleYB(t);
  // 近似保持面积：横向反向变化
  pose.scaleX = clamp(Math.pow(pose.scaleY, -0.85), 0.8, 1.3);

  // 次要动作 1：眼睛跟随滞后（采样 0.06s 前的主动作）
  const LAG = 0.06;
  // 屏幕坐标向下为正：上升时眼睛被拖在下面，下落时飘在上面
  let eyeLag = clamp((liftB(t) - liftB(t - LAG)) * 0.09, -20, 20);
  const tContact = PB.landingSquash.start;
  const tauEye = t - tContact - LAG;
  if (tauEye > 0) {
    // 落地后眼睛比身体晚停下
    eyeLag += 10 * Math.exp(-6 * tauEye) * Math.sin(18 * tauEye);
  }
  // 次要动作 2：预备时眼睛往上看（指向要去的方向），升空后回中
  const gazeUp =
    t < PB.anticipation.start
      ? 0
      : t < PB.ascent.start
        ? -10 * easeInOutCubic(clamp((t - PB.anticipation.start) / (PB.ascent.start - PB.anticipation.start), 0, 1))
        : -10 * (1 - easeOutQuad(local(t, "ascent")));
  pose.eyeOffsetY = eyeLag + gazeUp;

  // 点缀：蹲住时眯眼（用力），落地时闭眼
  const crouchSquint = inPhase(t, "anticipation")
    ? 0.35 * local(t, "anticipation")
    : inPhase(t, "anticHold")
      ? 0.35
      : inPhase(t, "ascent")
        ? 0.35 * (1 - clamp((t - PB.ascent.start) / (2 / FPS_BASE), 0, 1))
        : 0;
  const impactBlink = 0.85 * Math.sin(Math.PI * progressIn(t, tContact, tContact + 0.2));
  pose.eyeOpen = clamp(1 - crouchSquint - impactBlink, 0.08, 1);
  return pose;
};

export const PHASE_TABLE_B = PB;

const JUMPS = { A: jumpA, B: jumpB };

export const resolveMotionSceneContext = (pluginParams = {}) => {
  const videoWidth = toInt(pluginParams.videoWidth, DEFAULT_MOTION_PROPS.videoWidth, 480, 1280);
  const videoHeight = toInt(pluginParams.videoHeight, DEFAULT_MOTION_PROPS.videoHeight, 480, 1440);
  const variant = JUMPS[pluginParams.variant] ? pluginParams.variant : DEFAULT_MOTION_PROPS.variant;

  return {
    variant,
    durationSeconds: clamp(
      toNumber(pluginParams.durationSeconds, DEFAULT_MOTION_PROPS.durationSeconds),
      1,
      30
    ),
    layout: { videoWidth, videoHeight },
  };
};

export const getMotionDurationInFrames = ({ fps, sceneContext, pluginParams } = {}) => {
  const resolvedContext = sceneContext ?? resolveMotionSceneContext(pluginParams ?? {});
  const resolvedFps = toPositiveFrames(fps, 30);
  return toPositiveFrames(resolvedContext.durationSeconds * resolvedFps, resolvedFps);
};

export const computePose = (variant, timeSec) => (JUMPS[variant] ?? jumpA)(timeSec);

export const buildMotionSceneProps = ({
  frame = 0,
  fps,
  loop = false,
  sceneContext,
  pluginParams,
} = {}) => {
  const resolvedContext = sceneContext ?? resolveMotionSceneContext(pluginParams ?? {});
  const resolvedFps = toPositiveFrames(fps, 30);
  const durationInFrames = getMotionDurationInFrames({ fps: resolvedFps, sceneContext: resolvedContext });

  const rawFrame = toFrame(frame, 0);
  const boundedFrame = loop
    ? rawFrame % durationInFrames
    : Math.min(rawFrame, durationInFrames - 1);
  const timeSec = boundedFrame / resolvedFps;

  return {
    ...resolvedContext,
    durationInFrames,
    frame: boundedFrame,
    pose: computePose(resolvedContext.variant, timeSec),
  };
};
