// Plans: $29 one-time 30-day Job Hunt Pack + $59/yr Pro. Mocked Stripe/KV, fake keys, no network.
// Run: node worker/test/plans_worker_t.mjs
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;

class KV { constructor() { this.m = new Map(); }
  async get(k, t) { const v = this.m.get(k); if (v == null) return null; return t === 'json' ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, String(v)); } async delete(k) { this.m.delete(k); }
  async list({ prefix = '' } = {}) { return { keys: [...this.m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; } }
const cache = new Map();
globalThis.caches = { default: { async match(r) { const v = cache.get(r.url); return v == null ? undefined : new Response(v); }, async put(r, res) { cache.set(r.url, await res.text()); } } };

const now = () => Math.floor(Date.now() / 1000);
const SESS = {}, SUBS = {}, CREATED = [];
globalThis.fetch = async (u, init = {}) => {
  u = String(u);
  if (u.startsWith('https://api.anthropic.com/')) return new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }), { status: 200 });
  if (u === 'https://api.stripe.com/v1/checkout/sessions' && init.method === 'POST') {
    const p = new URLSearchParams(init.body); CREATED.push(p);
    return new Response(JSON.stringify({ id: 'cs_test_new' + CREATED.length, url: 'https://checkout.stripe.com/c/pay/x' + CREATED.length }), { status: 200 }); }
  let m = u.match(/^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions\/([^?]+)$/);
  if (m) { const s = SESS[decodeURIComponent(m[1])]; return s ? new Response(JSON.stringify(s), { status: 200 }) : new Response('{"error":{"message":"No such session"}}', { status: 404 }); }
  m = u.match(/^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions\?(.*)$/);
  if (m) { const em = new URLSearchParams(m[1]).get('customer_details[email]');
    return new Response(JSON.stringify({ data: Object.values(SESS).filter(s => s.customer_details && s.customer_details.email === em) }), { status: 200 }); }
  m = u.match(/^https:\/\/api\.stripe\.com\/v1\/subscriptions\/([^?]+)$/);
  if (m) { const st = SUBS[decodeURIComponent(m[1])]; return st ? new Response(JSON.stringify({ id: m[1], status: st }), { status: 200 }) : new Response('{"error":{"message":"No such subscription"}}', { status: 404 }); }
  throw new Error('unexpected network call: ' + u);
};

const W = (await import('../worker.js')).default;
const ORIGIN = 'https://yourfirstshiftapp.com', KVS = new KV();
const base = { YFS_KV: KVS, PRO_SIGNING_SECRET: 'test-sign', STRIPE_RK: 'rk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake', ANTHROPIC_API_KEY: 'x', ENFORCE_FREE_LIMIT: '1' };
const envOn = { ...base, YFS_PRICE_PACK: 'price_PACK29', YFS_PRICE_YEAR: 'price_YEAR59' };
let pass = 0, fail = 0; const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };
let ipN = 0;
async function call(env, method, path, { body, headers = {}, raw } = {}) {
  const h = { Origin: ORIGIN, 'CF-Connecting-IP': '10.1.0.' + (++ipN % 250), ...headers };
  if (body !== undefined && !raw) h['Content-Type'] = 'application/json';
  const r = await W.fetch(new Request('https://w.example' + path, { method, headers: h, body: body === undefined ? undefined : (raw ? body : JSON.stringify(body)) }), env);
  const t = await r.text(); let d = null; try { d = JSON.parse(t); } catch {} return { s: r.status, d, h: r.headers };
}

// 1. plans endpoint
let r = await call(base, 'GET', '/api/pro/plans');
ok(r.s === 200 && r.d.plans.pro === true && r.d.plans.pack === false && r.d.plans.pro_year === false, 'plans: only $9 Pro until Shift sets prices');
r = await call(envOn, 'GET', '/api/pro/plans');
ok(r.s === 200 && r.d.plans.pack && r.d.plans.pro_year && r.d.pack_days === 30, 'plans: pack + yearly on once prices are set');
ok(r.h.get('Access-Control-Allow-Origin') === ORIGIN, 'plans: CORS');
r = await call({ ...base, YFS_PRICE_PACK: 'not-a-price' }, 'GET', '/api/pro/plans'); ok(r.d.plans.pack === false, 'plans: malformed price id ignored');

// 2. checkout per plan
r = await call(base, 'POST', '/api/pro/checkout', { body: {} });
let p = CREATED.at(-1);
ok(r.s === 200 && p.get('mode') === 'subscription' && p.get('line_items[0][price]') === 'price_1TtWAN2UF854inJLHEqOW9Lx' && p.get('metadata[yfs_plan]') === 'pro', 'checkout: default = $9/mo (unchanged)');
r = await call(base, 'POST', '/api/pro/checkout', { body: { plan: 'pack' } });
ok(r.s === 409 && r.d.error === 'plan_unavailable', 'checkout: pack refused until its price exists (no wrong charge)');
r = await call(envOn, 'POST', '/api/pro/checkout', { body: { plan: 'pack', src: 'TikTok-Ad!' } }); p = CREATED.at(-1);
ok(r.s === 200 && p.get('mode') === 'payment' && p.get('line_items[0][price]') === 'price_PACK29' && p.get('customer_creation') === 'always' && !p.has('subscription_data[metadata][yfs_pro]'), 'checkout: pack = one-time payment, own price, no subscription fields');
ok(p.get('metadata[yfs_plan]') === 'pack' && p.get('metadata[yfs_src]') === 'tiktok-ad' && p.get('payment_intent_data[metadata][yfs_plan]') === 'pack', 'checkout: pack metadata + cleaned src tag');
r = await call(envOn, 'POST', '/api/pro/checkout', { body: { plan: 'pro_year' } }); p = CREATED.at(-1);
ok(r.s === 200 && p.get('mode') === 'subscription' && p.get('line_items[0][price]') === 'price_YEAR59' && p.get('subscription_data[metadata][yfs_plan]') === 'pro_year', 'checkout: yearly = subscription at the yearly price');
r = await call(envOn, 'POST', '/api/pro/checkout', { body: { plan: 'premium' } }); ok(r.s === 409, 'checkout: unknown plan refused');

// 3. verify pack
const day = 86400;
SESS.cs_test_pack1 = { id: 'cs_test_pack1', status: 'complete', mode: 'payment', payment_status: 'paid', created: now() - 2 * day, customer: 'cus_p1', payment_intent: 'pi_1', metadata: { yfs_pro: '1', yfs_plan: 'pack' }, customer_details: { email: 'pack@x.com' } };
SESS.cs_test_unpaid = { ...SESS.cs_test_pack1, id: 'cs_test_unpaid', payment_status: 'unpaid' };
SESS.cs_test_old = { ...SESS.cs_test_pack1, id: 'cs_test_old', created: now() - 40 * day, payment_intent: 'pi_old', customer_details: { email: 'old@x.com' } };
r = await call(envOn, 'POST', '/api/pro/verify', { body: { session_id: 'cs_test_pack1' } });
const packTok = r.d && r.d.token;
ok(r.s === 200 && packTok && r.d.plan === 'pack' && Math.abs(r.d.exp - (SESS.cs_test_pack1.created + 30 * day)) < 2, 'verify: paid pack → 30 days from purchase');
r = await call(envOn, 'POST', '/api/pro/verify', { body: { session_id: 'cs_test_unpaid' } }); ok(r.s === 402, 'verify: unpaid pack refused');
r = await call(envOn, 'POST', '/api/pro/verify', { body: { session_id: 'cs_test_old' } }); ok(r.s === 410, 'verify: pack older than 30 days → ended');

// 4. pack pass works on the AI route, can't be refreshed, ends at 30 days, refund revokes
const aiIp = '10.200.0.1', today = new Date().toISOString().slice(0, 10);
await KVS.put(`free:${aiIp}:${today}`, '999');
const ai = (tok) => call(envOn, 'POST', '/', { body: { messages: [] }, headers: { 'CF-Connecting-IP': aiIp, ...(tok ? { 'X-YFS-Pro': tok } : {}) } });
r = await ai(packTok); ok(r.s === 200, 'pack pass unlocks the AI route');
r = await call(envOn, 'POST', '/api/pro/refresh', { body: { token: packTok } }); ok(r.s === 404, 'pack pass cannot be refreshed past 30 days');
// refund via signed webhook
async function hook(evt) {
  const raw = JSON.stringify(evt), t = String(now());
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode('whsec_fake'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(t + '.' + raw)))].map(b => b.toString(16).padStart(2, '0')).join('');
  return W.fetch(new Request('https://w.example/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}` }, body: raw }), envOn);
}
let wr = await hook({ id: 'evt_bad', type: 'charge.refunded', data: { object: { payment_intent: 'pi_1', refunded: true } } }).then(x => x.status);
ok(wr === 200, 'webhook: signed refund event accepted');
r = await ai(packTok); ok(r.s === 402, 'refunded pack → pass stops working');
r = await call(envOn, 'POST', '/api/pro/verify', { body: { session_id: 'cs_test_pack1' } }); ok(r.s === 410, 'refunded pack → verify refuses a new pass');
const forged = await W.fetch(new Request('https://w.example/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${now()},v1=deadbeef` }, body: '{"id":"evt_x","type":"charge.refunded","data":{"object":{"payment_intent":"pi_2"}}}' }), envOn);
ok(forged.status === 400, 'webhook: forged refund rejected');

// 5. restore by email
SESS.cs_test_pack2 = { id: 'cs_test_pack2', status: 'complete', mode: 'payment', payment_status: 'paid', created: now() - 5 * day, customer: 'cus_p2', payment_intent: 'pi_2', metadata: { yfs_pro: '1', yfs_plan: 'pack' }, customer_details: { email: 'buyer@x.com' } };
r = await call(envOn, 'POST', '/api/pro/restore', { body: { email: 'buyer@x.com' } });
ok(r.s === 200 && r.d.plan === 'pack' && Math.abs(r.d.exp - (SESS.cs_test_pack2.created + 30 * day)) < 2, 'restore: pack buyer gets their remaining days (not a fresh 30)');
r = await ai(r.d.token); ok(r.s === 200, 'restored pack pass works');
r = await call(envOn, 'POST', '/api/pro/restore', { body: { email: 'old@x.com' } }); ok(r.s === 404, 'restore: expired pack → not found');
// subscription wins over pack when both exist
SESS.cs_test_sub = { id: 'cs_test_sub', status: 'complete', mode: 'subscription', subscription: 'sub_both', customer: 'cus_p2', metadata: { yfs_pro: '1', yfs_plan: 'pro_year' }, customer_details: { email: 'buyer@x.com' } };
SUBS.sub_both = 'active';
r = await call(envOn, 'POST', '/api/pro/restore', { body: { email: 'buyer@x.com' } });
const cl = r.d && r.d.token ? JSON.parse(Buffer.from(r.d.token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()) : {};
ok(r.s === 200 && cl.sub === 'sub_both' && !cl.pack, 'restore: active subscription preferred over a pack');

// 6. yearly verify uses the subscription path (refreshable)
SESS.cs_test_year = { id: 'cs_test_year', status: 'complete', mode: 'subscription', subscription: 'sub_year', customer: 'cus_y', metadata: { yfs_pro: '1', yfs_plan: 'pro_year' } };
SUBS.sub_year = 'active';
r = await call(envOn, 'POST', '/api/pro/verify', { body: { session_id: 'cs_test_year' } });
ok(r.s === 200 && r.d.token, 'verify: yearly works like monthly');
r = await call(envOn, 'POST', '/api/pro/refresh', { body: { token: r.d.token } }); ok(r.s === 200 && r.d.token, 'yearly pass refreshes while the sub is active');

console.log(fail ? `\n${fail} FAILED, ${pass} passed` : `ALL PASS (${pass} checks)`);
process.exit(fail ? 1 : 0);
