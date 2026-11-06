// Node test for the org-code routes in worker.js. No network, no real keys.
// Run: node worker/test/org_worker_t.mjs
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// ---- mocks: KV, caches.default, fetch(Anthropic) ----
class KV {
  constructor() { this.m = new Map(); }
  async get(k, t) { const v = this.m.get(k); if (v == null) return null; return t === 'json' ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, String(v)); }
  async delete(k) { this.m.delete(k); }
  async list({ prefix = '', cursor } = {}) {
    const all = [...this.m.keys()].filter(k => k.startsWith(prefix)).sort();
    const start = cursor ? parseInt(cursor, 10) : 0, page = all.slice(start, start + 2);   // tiny pages to test paging
    const done = start + 2 >= all.length;
    return { keys: page.map(name => ({ name })), list_complete: done, cursor: done ? undefined : String(start + 2) };
  }
}
const cacheStore = new Map();
globalThis.caches = { default: {
  async match(req) { const v = cacheStore.get(req.url); return v == null ? undefined : new Response(v); },
  async put(req, res) { cacheStore.set(req.url, await res.text()); } } };
let anthropicCalls = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, init) => {
  if (String(u).startsWith('https://api.anthropic.com/')) { anthropicCalls++;
    return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
  throw new Error('unexpected network call: ' + u);
};

const W = (await import('../worker.js')).default;
const ORIGIN = 'https://yourfirstshiftapp.com';
const KVS = new KV();
const env = { YFS_KV: KVS, PRO_SIGNING_SECRET: 'test-signing-secret', ADMIN_KEY: 'test-admin', ENFORCE_FREE_LIMIT: '1', ANTHROPIC_API_KEY: 'test-anthropic' };

let pass = 0, fail = 0;
const ok = (c, name) => { if (c) { pass++; } else { fail++; console.log('FAIL:', name); } };
let ipN = 0; const freshIp = () => '10.0.0.' + (++ipN);
async function call(method, path, { body, headers = {}, ip, raw } = {}) {
  const h = { Origin: ORIGIN, 'CF-Connecting-IP': ip || freshIp(), ...headers };
  if (body !== undefined && !raw) h['Content-Type'] = 'application/json';
  const r = await W.fetch(new Request('https://w.example' + path, { method, headers: h, body: body === undefined ? undefined : (raw ? body : JSON.stringify(body)) }), env);
  const txt = await r.text(); let d = null; try { d = JSON.parse(txt); } catch {}
  return { s: r.status, d, h: r.headers };
}
const now = () => Math.floor(Date.now() / 1000);
const DEV = n => n.repeat(32).slice(0, 32);
const A = DEV('a'), B = DEV('b'), C = DEV('c');
const CODE = 'YFS-TEST-AB12';
await KVS.put('org:' + CODE, JSON.stringify({ org: 'Test Tech', seat_limit: 2, ends: now() + 30 * 86400, plan: 'pilot', issued: '2026-11-06' }));

// 1. redeem
let r = await call('POST', '/api/org/redeem', { body: { code: 'YFS-NOPE-0000', device: A } });
ok(r.s === 404 && r.d.error === 'invalid', 'unknown code → 404 invalid');
r = await call('POST', '/api/org/redeem', { body: { code: 'bad', device: A } });
ok(r.s === 404 && r.d.error === 'invalid', 'malformed code → invalid');
r = await call('POST', '/api/org/redeem', { body: { code: CODE, device: 'xyz' } });
ok(r.s === 400, 'bad device → 400');
r = await call('POST', '/api/org/redeem', { body: { code: ' yfs-test-ab12 ', device: A } });
ok(r.s === 200 && r.d.token && r.d.org === 'Test Tech' && r.d.seats_used === 1 && r.d.seat_limit === 2 && r.d.ends > now(), 'device A redeems (normalized code) → seat 1');
ok(r.h.get('Access-Control-Allow-Origin') === ORIGIN, 'CORS header on redeem');
const tokA = r.d.token;
r = await call('POST', '/api/org/redeem', { body: { code: CODE, device: A } });
ok(r.s === 200 && r.d.seats_used === 1, 're-redeem same device → no new seat');
r = await call('POST', '/api/org/redeem', { body: { code: CODE, device: B } });
ok(r.s === 200 && r.d.seats_used === 2, 'device B → seat 2'); const tokB = r.d.token;
r = await call('POST', '/api/org/redeem', { body: { code: CODE, device: C } });
ok(r.s === 409 && r.d.error === 'full' && r.d.seat_limit === 2, 'device C → 409 full');
await KVS.put('org:YFS-OLD-AAAA', JSON.stringify({ org: 'Old', seat_limit: 5, ends: now() - 10 }));
r = await call('POST', '/api/org/redeem', { body: { code: 'YFS-OLD-AAAA', device: A } });
ok(r.s === 410 && r.d.error === 'expired' && r.d.ends > 0, 'ended code → 410 expired');
r = await call('OPTIONS', '/api/org/redeem');
ok(r.s === 204 && r.h.get('Access-Control-Allow-Origin') === ORIGIN, 'OPTIONS preflight');
r = await W.fetch(new Request('https://w.example/api/org/redeem', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ code: CODE, device: C }) }), env);
ok(r.status === 403, 'foreign origin → 403');

// 2. rate limit (10/hour per IP)
const ip = '10.9.9.9'; let last;
for (let i = 0; i < 11; i++) last = await call('POST', '/api/org/redeem', { body: { code: 'YFS-NOPE-0000', device: A }, ip });
ok(last.s === 429, '11th try in an hour → 429');

// 3. AI route accepts org token past the free limit; rejects when freed/ended
const day = new Date().toISOString().slice(0, 10), aiIp = '10.8.8.8';
await KVS.put(`free:${aiIp}:${day}`, '999');
const ai = (tok) => call('POST', '/', { body: { messages: [{ role: 'user', content: 'hi' }] }, ip: aiIp, headers: tok ? { 'X-YFS-Pro': tok } : {} });
r = await ai(null); ok(r.s === 402, 'no token past limit → 402');
let before = anthropicCalls; r = await ai(tokA); ok(r.s === 200 && anthropicCalls === before + 1, 'org token → AI call allowed');
r = await ai('garbage.token'); ok(r.s === 402, 'forged token → 402');
await KVS.delete('orgseat:' + CODE + ':' + B);
r = await ai(tokB); ok(r.s === 402, 'seat freed by Shift → token stops working');
const rec = JSON.parse(KVS.m.get('org:' + CODE));
await KVS.put('org:' + CODE, JSON.stringify({ ...rec, ends: now() - 1 }));
r = await ai(tokA); ok(r.s === 402, 'code ended early → token stops working');
await KVS.put('org:' + CODE, JSON.stringify(rec));
r = await ai(tokA); ok(r.s === 200, 'end date restored → works again');

// 4. Stripe-token regression (same signer, sub-based)
const te = new TextEncoder();
const b64u = b => { let s = ''; for (const c of new Uint8Array(b)) s += String.fromCharCode(c); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const key = await crypto.subtle.importKey('raw', te.encode(env.PRO_SIGNING_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const sign = async p => { const body = b64u(te.encode(JSON.stringify(p))); return body + '.' + b64u(await crypto.subtle.sign('HMAC', key, te.encode(body))); };
const stripeTok = await sign({ sub: 'sub_test', cus: 'cus_test', iat: now(), exp: now() + 3600 });
r = await ai(stripeTok); ok(r.s === 200, 'Stripe Pro token still works');
await KVS.put('sub:sub_test', JSON.stringify({ status: 'canceled' }));
r = await ai(stripeTok); ok(r.s === 402, 'canceled Stripe sub still revoked');
const fakeOrg = await sign({ org: 'YFS-NOPE-0000', did: A, iat: now(), exp: now() + 3600, src: 'org' });
r = await ai(fakeOrg); ok(r.s === 402, 'signed token for a code that does not exist → rejected');

// 5. usage events + report
const ev = (t, k, tool) => call('POST', '/api/metrics/org_event', { body: JSON.stringify(tool ? { t, k, tool } : { t, k }), raw: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } });
r = await ev(tokA, 'open'); ok(r.s === 204, 'open event → 204');
await ev(tokA, 'run', 'ats'); await ev(tokA, 'run', 'ats'); await ev(tokA, 'run', 'cover'); await ev(tokA, 'run', 'weird');
r = await ev(stripeTok, 'run', 'ats'); ok(r.s === 204, 'non-org token → ignored 204');
r = await ev('nope', 'run', 'ats'); ok(r.s === 204, 'bad token → ignored 204');
const mon = new Date().toISOString().slice(0, 7);
ok(KVS.m.get(`orgm:${CODE}:${mon}:run:ats`) === '2' && KVS.m.get(`orgm:${CODE}:${mon}:run:other`) === '1', 'run counters by tool');
// second active device for paging test
await KVS.put('orgseat:' + CODE + ':' + B, String(now()));
await ev(tokB, 'open');
await KVS.put(`orgact:${CODE}:${mon}:${DEV('d')}`, '1');
const rep = (h, q = `?code=${CODE}&month=${mon}`) => call('GET', '/api/admin/org-report' + q, { headers: h });
r = await rep({}); ok(r.s === 401, 'report without key → 401');
r = await rep({ Authorization: 'Bearer wrong' }); ok(r.s === 401, 'report wrong key → 401');
r = await rep({ Authorization: 'Bearer test-admin' });
ok(r.s === 200 && r.d.org === 'Test Tech' && r.d.seat_limit === 2 && r.d.seats_redeemed === 2, 'report: org, limit, seats redeemed');
ok(r.d && r.d.active_seats === 3, 'report: active seats (paged list)');
ok(r.d && r.d.runs.ats === 2 && r.d.runs.cover === 1 && r.d.runs.other === 1 && r.d.runs_total === 4 && r.d.free_runs === null, 'report: runs per tool + total');
ok(r.d && r.d.period.start === mon + '-01' && /^\d{4}-\d{2}-\d{2}$/.test(r.d.period.end), 'report: period');
r = await rep({ Authorization: 'Bearer test-admin' }, `?code=YFS-NOPE-0000&month=${mon}`); ok(r.s === 404, 'report unknown code → 404');
r = await rep({ Authorization: 'Bearer test-admin' }, `?code=${CODE}&month=2026-13`); ok(r.s === 400, 'report bad month → 400');
const noAdmin = { ...env }; delete noAdmin.ADMIN_KEY;
let rr = await W.fetch(new Request('https://w.example/api/admin/org-report?code=' + CODE, { headers: { Origin: ORIGIN, Authorization: 'Bearer x' } }), noAdmin);
ok(rr.status === 503, 'no ADMIN_KEY set → 503 (route safely off)');

// 6. funnel metric + existing routes untouched
r = await call('POST', '/api/metrics/org_redeem'); ok(r.s === 200 && r.d.ok, 'org_redeem funnel counter');
r = await call('POST', '/api/metrics/visit'); ok(r.s === 200, 'existing visit metric still works');

console.log(fail ? `\n${fail} FAILED, ${pass} passed` : `ALL PASS (${pass} checks)`);
process.exit(fail ? 1 : 0);
