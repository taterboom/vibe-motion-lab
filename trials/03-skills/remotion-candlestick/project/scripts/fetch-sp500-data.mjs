// 按 remotion-candlestick SKILL.md 步骤 1：Yahoo Finance Chart API 拉 S&P 500 周线
import { writeFile, mkdir } from "node:fs/promises";

const PERIOD1 = Math.floor(Date.UTC(1984, 0, 1) / 1000);
const PERIOD2 = Math.floor(Date.now() / 1000);
const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?period1=${PERIOD1}&period2=${PERIOD2}&interval=1wk`;

const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
if (!resp.ok) throw new Error(`Yahoo HTTP ${resp.status}`);
const json = await resp.json();
const result = json.chart?.result?.[0];
if (!result) throw new Error("no result: " + JSON.stringify(json).slice(0, 300));
const ts = result.timestamp;
const quote = result.indicators.quote[0];
const rows = [];
for (let i = 0; i < ts.length; i++) {
  const o = quote.open[i], h = quote.high[i], l = quote.low[i], c = quote.close[i];
  if ([o, h, l, c].some((v) => v == null)) continue;
  rows.push({ t: ts[i], o, h, l, c });
}
await mkdir("public/data", { recursive: true });
await writeFile("public/data/sp500-weekly.json", JSON.stringify(rows));
console.log(`saved ${rows.length} weekly candles`, new Date(rows[0].t * 1000).toISOString().slice(0, 10), "→", new Date(rows.at(-1).t * 1000).toISOString().slice(0, 10));
