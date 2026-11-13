// 把 claude -p 的 stream-json 日志压成可读的时间线
import { readFileSync } from 'node:fs';
const lines = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);
const cut = (s, n = 300) => (s = String(s ?? '').replace(/\s+/g, ' ')).length > n ? s.slice(0, n) + '…' : s;
for (const l of lines) {
  let m; try { m = JSON.parse(l); } catch { continue; }
  if (m.type === 'system' && m.subtype === 'init') console.log('[init] mcp:', JSON.stringify(m.mcp_servers), 'skills:', JSON.stringify(m.skills ?? ''));
  else if (m.type === 'system') console.log(`[system:${m.subtype}]`, cut(JSON.stringify(m), 400));
  else if (m.type === 'assistant') for (const c of m.message.content) {
    if (c.type === 'text') console.log('[say]', cut(c.text, 600));
    if (c.type === 'tool_use') console.log('[tool]', c.name, cut(JSON.stringify(c.input), 350));
  }
  else if (m.type === 'user' && Array.isArray(m.message?.content)) for (const c of m.message.content) {
    if (c.type === 'tool_result') console.log('[result]', c.is_error ? 'ERROR' : '', cut(typeof c.content === 'string' ? c.content : JSON.stringify(c.content), 400));
    else if (c.type === 'text') console.log('[user-text]', cut(c.text, 400));
  }
  else if (m.type === 'result') console.log('[done]', m.subtype, 'turns', m.num_turns, 'cost', m.total_cost_usd, cut(m.result, 400));
}
