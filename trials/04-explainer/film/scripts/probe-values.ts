// 不渲染，直接在 Node 里算每一帧的数值，做数值层面的检查。用法：npx tsx scripts/probe-values.ts
import fs from 'node:fs';
import path from 'node:path';
import {demoTimeline, filmState, Beat} from '../src/timeline';

const root = path.resolve(import.meta.dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'src/data/choreography-plan.json'), 'utf8'));
const beats: Beat[] = plan.beats;
const N = plan.productionContract.durationInFrames;
const period = plan.demoMotion.period;
const HOLD = 630;
const checks: Array<{name: string; pass: boolean; detail: string}> = [];
const add = (name: string, pass: boolean, detail: string) => checks.push({name, pass, detail});

// 1. beats contiguous and cover the film
let cov = beats[0].startFrame === 0 && beats[beats.length - 1].endFrame === N;
for (let i = 1; i < beats.length; i++) cov &&= beats[i].startFrame === beats[i - 1].endFrame;
add('beats contiguous 0..N', cov, `${beats.length} beats, N=${N}`);

// 2. demo motion facts that the film claims on screen
const contacts = Array.from({length: period}, (_, d) => d).filter((d) => demoTimeline(d, period).squash <= 0.7001);
add('contact frames squash 0.70', JSON.stringify(contacts) === '[0,30]', `contacts=${JSON.stringify(contacts)}`);
const xs = Array.from({length: period}, (_, d) => demoTimeline(d, period).x);
add('x monotonic', xs.every((x, i) => i === 0 || x > xs[i - 1]), `x0=${xs[0]} x59=${xs[period - 1].toFixed(1)}`);

// 3. every frame finite; persistence: once entered (>0.99) never back to 0
const persist = ['chip.opacity', 'fn.opacity', 'values4.panelOpacity', 'scene.open', 'browser.in', 'strip.titleIn', 'ffmpeg.in'];
const get = (o: any, k: string) => k.split('.').reduce((a, b) => a[b], o);
const entered: Record<string, number> = {};
const dropped: string[] = [];
let nan = 0;
let maxChipStep = 0;
let prev: any = null;
const samples: any[] = [];
for (let f = 0; f < N; f++) {
  const s = filmState(Math.min(f, HOLD), beats, period);
  const flat = [s.values.x, s.values.y, s.values.squash, s.values.camera, s.camera.cx, s.camera.scale, s.chip.x, s.chip.y];
  if (flat.some((v) => !Number.isFinite(v))) nan++;
  for (const k of persist) {
    const v = get(s, k);
    if (v > 0.99 && entered[k] === undefined) entered[k] = f;
    if (entered[k] !== undefined && v < 0.01) dropped.push(`${k}@${f}`);
  }
  if (prev) maxChipStep = Math.max(maxChipStep, Math.hypot(s.chip.x - prev.chip.x, s.chip.y - prev.chip.y));
  prev = s;
  if (f % 30 === 0) samples.push({f, beat: s.active.id, d: s.d, x: +s.values.x.toFixed(1), squash: +s.values.squash.toFixed(3), camera: +s.values.camera.toFixed(3)});
}
add('no NaN', nan === 0, `${nan} bad frames`);
add('persistent objects never drop to 0 after entry', dropped.length === 0, dropped.slice(0, 5).join(', ') || JSON.stringify(entered));
add('chip max step per frame < 40px', maxChipStep < 40, `${maxChipStep.toFixed(1)} px`);
const a = JSON.stringify(filmState(Math.min(N - 30, HOLD), beats, period).values);
const b = JSON.stringify(filmState(Math.min(N - 1, HOLD), beats, period).values);
add('hold: values equal at N-30 and N-1', a === b, '');

const out = {generatedAt: new Date().toISOString(), pass: checks.every((c) => c.pass), checks, samples};
fs.writeFileSync(path.join(root, 'qc/value-probe.json'), JSON.stringify(out, null, 2));
for (const c of checks) console.log(c.pass ? 'PASS' : 'FAIL', c.name, c.detail);
process.exit(out.pass ? 0 : 1);
