import { DEFAULT_MOTION_PROPS } from "./config.js";
import { CandlestickScene } from "./Scene.jsx";
import {
  buildCandlestickSceneProps,
  getCandlestickDurationInFrames,
  resolveCandlestickSceneContext,
} from "./timeline.js";

const ctxOf = (sceneContext, pluginParams) =>
  sceneContext ?? resolveCandlestickSceneContext({ ...DEFAULT_MOTION_PROPS, ...(pluginParams ?? {}) });

export const candlestickPlugin = Object.freeze({
  id: "sp500-candlestick",
  defaultProps: DEFAULT_MOTION_PROPS,
  SceneComponent: CandlestickScene,
  waitForSceneLayoutReady: true, // 等待数据加载完毕

  resolveSceneContext: (params) =>
    resolveCandlestickSceneContext({ ...DEFAULT_MOTION_PROPS, ...(params ?? {}) }),
  getDurationInFrames: ({ fps, sceneContext, pluginParams } = {}) =>
    getCandlestickDurationInFrames({ fps, sceneContext: ctxOf(sceneContext, pluginParams) }),
  buildSceneProps: ({ frame, fps, loop, sceneContext, pluginParams } = {}) =>
    buildCandlestickSceneProps({ frame, fps, loop, sceneContext: ctxOf(sceneContext, pluginParams) }),
  getLayout: ({ sceneContext, pluginParams } = {}) => ctxOf(sceneContext, pluginParams).layout,
});
