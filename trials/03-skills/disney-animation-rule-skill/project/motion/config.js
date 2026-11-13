export const DEFAULT_LAYOUT_PARAMS = Object.freeze({
  videoWidth: 1080,
  videoHeight: 1080,
});

export const DEFAULT_ANIMATION_PARAMS = Object.freeze({
  // "A" = 不看技能写的版本；"B" = 照 disney-animation-rule-skill 写的版本
  variant: "A",
  durationSeconds: 2,
});

export const DEFAULT_MOTION_PROPS = Object.freeze({
  ...DEFAULT_LAYOUT_PARAMS,
  ...DEFAULT_ANIMATION_PARAMS,
});
