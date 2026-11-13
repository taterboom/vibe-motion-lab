// 直接给 hard-rules-guard / render-guard 喂假的工具调用，看每条规则拦不拦、有没有误伤。
// 用法：node test-hooks.mjs   （在 trials/05-starter 下）
import { spawnSync } from 'node:child_process';

const HOOKS = new URL('./ext/.claude/hooks/', import.meta.url).pathname;
const run = (hook, payload) => {
  const r = spawnSync('node', [HOOKS + hook], { input: JSON.stringify(payload), encoding: 'utf8' });
  if (!r.stdout.trim()) return 'allow';
  try { return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision; } catch { return 'raw:' + r.stdout.slice(0, 40); }
};
const write = (content, file = '/x/kit/scenes/Foo.tsx') =>
  run('hard-rules-guard.mjs', { tool_name: 'Write', tool_input: { file_path: file, content } });
const bash = (command) => run('render-guard.mjs', { tool_name: 'Bash', tool_input: { command } });

// [说明, 实际结果, 期望]
const cases = [
  // —— 该拦的 ——
  ['Math.random()', write('const x = Math.random();'), 'deny'],
  ['Date.now()', write('const t = Date.now();'), 'deny'],
  ['new Date()', write('const d = new Date();'), 'deny'],
  ['style transition:', write('<div style={{transition: "opacity 1s"}} />'), 'deny'],
  ['@keyframes 裸写', write('const css = `@keyframes spin { from {} }`;'), 'deny'],
  ['animation: "spin 1s linear"', write('<div style={{animation: "spin 1s linear"}} />'), 'deny'],
  ['Tailwind animate-spin', write('<div className="animate-spin p-2" />'), 'deny'],
  ['interpolate 没 clamp', write('const o = interpolate(frame, [0, 30], [0, 1]);'), 'deny'],
  ['<OffthreadVideo loop>', write('<OffthreadVideo src={s} loop />'), 'deny'],
  // —— 该放的 ——
  ['interpolate 带 clamp', write("const o = interpolate(frame,[0,30],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});"), 'allow'],
  ['random(seed)', write("import {random} from 'remotion'; const x = random('a');"), 'allow'],
  ['注释里的 Math.random', write('// 不要用 Math.random()\nconst a = 1;'), 'allow'],
  ['钉帧 animation + paused', write("<div style={{animation:'spin 1s linear', animationPlayState:'paused', animationDelay:`-${f/30}s`}} />"), 'allow'],
  ['import @remotion/transitions', write("import {TransitionSeries} from '@remotion/transitions';"), 'allow'],
  // —— 可能误伤 ——
  ['clamp 写在常量里再传入', write("const CLAMP = {extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;\nconst o = interpolate(frame,[0,30],[0,1],CLAMP);"), 'allow'],
  ['只 clamp 右边', write("const o = interpolate(frame,[0,30],[0,1],{extrapolateRight:'clamp'});"), 'deny?'],
  ['数据字段 transition: "fade"', write("const scenes = [{ type: 'title', transition: 'fade' }];"), 'allow'],
  ['字符串里的 Math.random', write("const tip = '别用 Math.random()';"), 'allow'],
  ['new Date(固定时间) 当数据', write("const d = new Date('2026-01-01');"), 'allow'],
  // —— 能绕过的 ——
  ['.jsx 文件里 Math.random', write('const x = Math.random();', '/x/src/Scene.jsx'), 'deny?'],
  ['.js 文件里 Math.random', write('const x = Math.random();', '/x/src/timeline.js'), 'deny?'],
  ['Edit 改成 Math.random', run('hard-rules-guard.mjs', { tool_name: 'Edit', tool_input: { file_path: '/x/a.tsx', old_string: 'random("a")', new_string: 'Math.random()' } }), 'deny'],
  ['用 Bash 写文件', run('hard-rules-guard.mjs', { tool_name: 'Bash', tool_input: { command: "echo 'Math.random()' > a.tsx" } }), 'deny?'],
  ['interpolate 嵌套 500 字符外 clamp', write(`const o = interpolate(frame,[0,30],[0,1],/*${'x'.repeat(10)}*/ {\n${' '.repeat(520)}extrapolateLeft:'clamp',extrapolateRight:'clamp'});`), 'allow'],
  // —— render-guard ——
  ['npm run render', bash('npm run render'), 'ask'],
  ['npx remotion render', bash('npx remotion render TalkingHead out/v.mp4'), 'ask'],
  ['npx remotion still', bash('npx remotion still TalkingHead out/f.png --frame=60'), 'allow'],
  ['npm run render3d', bash('npm run render3d'), 'ask'],
  ['pnpm exec remotion render', bash('pnpm exec remotion render Motion30fps out/a.mp4'), 'ask'],
  ['node 脚本里调 renderMedia', bash('node scripts/render.mjs'), 'ask?'],
];

let w = 0;
for (const [name, got, want] of cases) {
  const soft = want.endsWith('?');
  const ok = got === want.replace('?', '');
  if (!ok && !soft) w++;
  console.log(`${ok ? 'OK  ' : soft ? 'NOTE' : 'MISS'}  ${name.padEnd(32)} 实际=${got}  期望=${want}`);
}
console.log(`\n${cases.length} 条，硬性不符 ${w} 条`);
