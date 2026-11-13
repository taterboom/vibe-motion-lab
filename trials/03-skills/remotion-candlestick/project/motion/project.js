import { candlestickPlugin } from "./candlestick/plugin.js";

export const ACTIVE_COMPOSITION = Object.freeze({
  id: "SP500Kline",
  fps: 30,
  plugin: candlestickPlugin,
});

export const ACTIVE_COMPOSITION_ID = ACTIVE_COMPOSITION.id;
