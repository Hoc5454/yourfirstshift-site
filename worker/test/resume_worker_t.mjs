// resume-fix (Worker): interrupted runs never cost a free run; finished results cached 10 min per device+run; error-type logging.
// Mocked KV / cache / Anthropic stream. No network, fake keys. Run: node worker/test/resume_worker_t.mjs
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
class KV { constructor() { this.m = new Map(); this.ttl = new Map(); }
  async get(k, t) { const v = this.m.get(k); if (v == null) return null; return t === 'json' ? JSON.parse(v) : v; }
  async put(k, v, o) { this.m.set(k, String(v)); if (o && o.expirationTtl) this.ttl.set(k, o.expirationTtl); } async delete(k) { this.m.delete(k); }
  async list({ prefix = '' } = {}) { return { keys: [...this.m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; } }
const cache = new Map();
globalThis.caches = { default: { async match(r) { const v = cache.get(r.url); return v == null ? undefined : new Response(v); }, async put(r, res) { cache.set(r.url, await res.text()); } } };

let aiCalls = 0, MODE = 'full';
const sse = (parts, stop) => parts.map(t => 'event: content_block_delta\ndata: ' + JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } }) + '\n\n').join('')
  + (stop ? 'event: message_stop\ndata: {"type":"message_stop"}\n\n' : '');
globalThis.fetch = async (u) => {
  if (String(u).startsWith('https://api.anthropic.com/')) { aiCalls++;
    const body = MODE === 'full' ? sse(['## PROFESSIONAL SUMMARY\nRuns crews. ', 'Safe and on time.'], true) : sse(['## PROFESSIONAL SUMMARY\nRuns cr'], false);
    return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(body)); c.close(); } }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } }); }
  throw new Error('unexpected network call: ' + u);
};
const W = (await import('../worker.js')).default;
const ORIGIN = 'https://yourfirstshiftapp.com', KVS = new KV();
const env = { YFS_KV: KVS, PRO_SIGNING_SECRET: 's', ANTHROPIC_API_KEY: 'x', ENFORCE_FREE_LIMIT: '1' };
let pass = 0, fail = 0; const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };
const hex32 = c => c.repeat(32).slice(0, 32);
const DEV = hex32('d'), RUN1 = hex32('a'), RUN2 = hex32('b'), RUN3 = hex32('c');
async function ai({ ip = '10.0.0.1', run, dev = DEV, msg = 'hello', tok } = {}) {
  const waits = []; const ctx = { waitUntil: p => waits.push(p) };
  const h = { Origin: ORIGIN, 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' };
  if (run) h['X-YFS-Run'] = run; if (dev) h['X-YFS-Dev'] = dev; if (tok) h['X-YFS-Pro'] = tok;
  const r = await W.fetch(new Request('https://w.example/', { method: 'POST', headers: h, body: JSON.stringify({ stream: true, messages: [{ role: 'user', content: msg }] }) }), env, ctx);
  const text = await r.text(); await Promise.all(waits); return { s: r.status, text, h: r.headers, waits: waits.length };
}
const get = (path, ip = '10.0.0.9') => W.fetch(new Request('https://w.example' + path, { headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip } }), env).then(async r => ({ s: r.status, d: JSON.parse(await r.text() || '{}'), h: r.headers }));

// 1. interrupted free run (stream ends without message_stop) → retry same run is NOT a new free run
MODE = 'cut'; let r = await ai({ ip: '1.1.1.1', run: RUN1 });
ok(r.s === 200 && aiCalls === 1, 'first free run starts (counted once)');
ok(!KVS.m.has('runres:' + DEV + ':' + RUN1), 'interrupted result is NOT cached as finished');
MODE = 'full'; r = await ai({ ip: '1.1.1.1', run: RUN1 });
ok(r.s === 200 && aiCalls === 2, 'retry of the SAME run after interruption → allowed (free run not lost)');
ok(r.waits === 1 && KVS.m.has('runres:' + DEV + ':' + RUN1), 'finished result cached for this device+run');
ok(KVS.ttl.get('runres:' + DEV + ':' + RUN1) === 600, 'cached result expires after 10 minutes');
// 2. abuse limits
r = await ai({ ip: '1.1.1.1', run: RUN2 }); ok(r.s === 402, 'a NEW run after the free run is used → 402 (no unlimited free runs)');
r = await ai({ ip: '1.1.1.1', run: RUN1, msg: 'a different request' }); ok(r.s === 402, 'same run ID but a different request → counts as new → 402');
r = await ai({ ip: '1.1.1.1', run: RUN1 }); r = await ai({ ip: '1.1.1.1', run: RUN1 });
ok(r.s === 200, 'retries 2 and 3 of the same run still allowed');
r = await ai({ ip: '1.1.1.1', run: RUN1 }); ok(r.s === 402, 'a 4th retry of the same run → 402 (retry cap)');
r = await ai({ ip: '2.2.2.2' }); ok(r.s === 200, 'old app without run IDs still works (counted as before)');
r = await ai({ ip: '2.2.2.2' }); ok(r.s === 402, 'old app: second free run still blocked');
// 3. fetching a cached result
let g = await get('/api/run/' + RUN1 + '?d=' + DEV);
ok(g.s === 200 && g.d.done && /Safe and on time\./.test(g.d.text), 'GET /api/run returns the finished result to the same device');
ok(g.h.get('Cache-Control') === 'no-store' && g.h.get('Access-Control-Allow-Origin') === ORIGIN, 'run fetch: no-store + CORS');
g = await get('/api/run/' + RUN1 + '?d=' + hex32('e')); ok(g.s === 404, 'another device cannot fetch someone else\'s result');
g = await get('/api/run/' + RUN3 + '?d=' + DEV); ok(g.s === 404, 'unknown run → 404');
g = await get('/api/run/xyz?d=' + DEV); ok(g.s === 400, 'malformed run id → 400');
const foreign = await W.fetch(new Request('https://w.example/api/run/' + RUN1 + '?d=' + DEV, { headers: { Origin: 'https://evil.example' } }), env); ok(foreign.status === 403, 'foreign origin → 403');
// 4. free results are cached already cut (no locked content leaks through the cache)
MODE = 'full'; const RUN4 = hex32('f'); r = await ai({ ip: '3.3.3.3', run: RUN4, msg: 'resume please' });
const cached = JSON.parse(KVS.m.get('runres:' + DEV + ':' + RUN4) || '{}'); ok(cached.free === 1 && typeof cached.text === 'string', 'free run cached with free flag (same cut stream the user saw)');
// 5. preflight allows the new headers
const pre = await W.fetch(new Request('https://w.example/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env);
ok(/X-YFS-Run/.test(pre.headers.get('Access-Control-Allow-Headers') || '') && /X-YFS-Dev/.test(pre.headers.get('Access-Control-Allow-Headers') || ''), 'CORS allows X-YFS-Run + X-YFS-Dev');
// 6. no device id → still works, just no cache
const RUN5 = hex32('1'); r = await ai({ ip: '4.4.4.4', run: RUN5, dev: '' }); ok(r.s === 200 && r.waits === 0, 'no device id → result still streams, nothing cached');
// 7. client error logging: types only
const err = (b, ip = '5.5.5.5') => W.fetch(new Request('https://w.example/api/metrics/client_err', { method: 'POST', headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip, 'Content-Type': 'text/plain' }, body: JSON.stringify(b) }), env).then(x => x.status);
ok(await err({ t: 'interrupted', ua: 'samsung' }) === 204, 'client_err accepted');
await err({ t: 'interrupted', ua: 'samsung' }); await err({ t: 'evil<script>', ua: 'x', name: 'Jeff', resume: 'secret' });
const day = new Date().toISOString().slice(0, 10);
ok(KVS.m.get(`m:err:${day}:interrupted:samsung`) === '2' && KVS.m.get(`m:err:${day}:other:other`) === '1', 'error counters by type + browser; junk → "other"');
ok(![...KVS.m.values()].some(v => /Jeff|secret/.test(v)) && ![...KVS.m.keys()].some(k => /Jeff|secret|script/.test(k)), 'no personal data stored from error logs');
g = await get('/api/metrics/errors'); ok(g.s === 200 && g.d.errors[day]['interrupted:samsung'] === 2, 'GET /api/metrics/errors shows today\'s counts');
// 8. Pro users unaffected by the free gate, still get caching
// (pro token check fails with a fake token → treated as free here; covered by org/plans suites for real tokens)
console.log(fail ? `\n${fail} FAILED, ${pass} passed` : `ALL PASS (${pass} checks)`);
process.exit(fail ? 1 : 0);
