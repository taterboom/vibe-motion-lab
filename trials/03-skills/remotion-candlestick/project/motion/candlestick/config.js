export const DEFAULT_LAYOUT_PARAMS = Object.freeze({
  videoWidth: 1920, // 16:9 横屏
  videoHeight: 1080,
});

export const DEFAULT_ANIMATION_PARAMS = Object.freeze({
  durationSeconds: 28, // 动画总时长
  title: "S&P 500",
  subtitle: "过去40年 · 周线K线图",
});

export const DEFAULT_MOTION_PROPS = Object.freeze({
  ...DEFAULT_LAYOUT_PARAMS,
  ...DEFAULT_ANIMATION_PARAMS,
});
