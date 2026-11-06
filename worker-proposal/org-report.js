/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  FOR SHIFT TO REVIEW — PROPOSAL ONLY. NOT DEPLOYED. NOT WIRED INTO ANY WORKER.
 *  Ticket: FOR_CLAUDE-org-report (pairs with FOR_CLAUDE-org-codes, PR #5).
 *  Written by Claude without access to the real Worker source. Names like
 *  verifyProToken(), env.YFS_KV and env.ADMIN_KEY are placeholders. Swap in
 *  the Worker's real token check, KV binding and existing admin protection.
 *  No secrets here. Secrets live only in `wrangler secret`, set by Shift.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Two routes:
 *   POST /api/metrics/org_event     (called by app.html, text/plain JSON body)
 *        body: {"t":"<org pro token>","k":"open"|"run","tool":"translator|ats|outreach|cover|interview|builder|other"}
 *   GET  /api/admin/org-report?code=YFS-XXXX-XXXX&month=YYYY-MM   (Authorization: Bearer <admin key>)
 *        → JSON report (shape below). The org-report.html page turns it into a table + CSV.
 *
 * KV keys (all counts, no personal data):
 *   org:<CODE>                         {org, seat_limit, ends, plan, issued}       ← from org-codes
 *   orgcount:<CODE>                    "<seats redeemed>"                          ← from org-codes
 *   orgm:<CODE>:<YYYY-MM>:run:<tool>   "<count>"
 *   orgact:<CODE>:<YYYY-MM>:<device>   "1"   (TTL ~400 days; 1 key per active device per month)
 *
 * KV is not atomic. Counts can be off by a few when two runs land at the same instant.
 * That's fine for a pilot report. Move the counters to D1 or a Durable Object for exact billing numbers.
 */

const TOOLS = ['translator', 'ats', 'outreach', 'cover', 'interview', 'builder', 'other'];
const month = (d = new Date()) => d.toISOString().slice(0, 7);

/* ---- POST /api/metrics/org_event ---------------------------------------- */
export async function handleOrgEvent(request, env) {
  let body = {};
  try { body = JSON.parse(await request.text()); } catch (_) { return new Response(null, { status: 204 }); }
  // Use the SAME verification as the AI route. It must reject expired tokens.
  const claims = await verifyProToken(env, String(body.t || ''));          // ← Shift: existing function
  // org tokens carry subject "org:<CODE>:<device>" (see org-codes return)
  const m = claims && typeof claims.sub === 'string' && claims.sub.match(/^org:([A-Z0-9-]{6,24}):([a-f0-9]{32})$/);
  if (!m) return new Response(null, { status: 204 });                     // not an org token → ignore quietly
  const [, code, device] = m, mon = month();
  if (body.k === 'open' || body.k === 'run') {
    await env.YFS_KV.put(`orgact:${code}:${mon}:${device}`, '1', { expirationTtl: 400 * 86400 });
  }
  if (body.k === 'run') {
    const tool = TOOLS.includes(body.tool) ? body.tool : 'other';
    const key = `orgm:${code}:${mon}:run:${tool}`;
    const n = parseInt((await env.YFS_KV.get(key)) || '0', 10) || 0;
    await env.YFS_KV.put(key, String(n + 1));
  }
  return new Response(null, { status: 204 });
}

/* ---- GET /api/admin/org-report ------------------------------------------ */
export async function handleOrgReport(request, env) {
  // Protect this the SAME way existing admin/metrics-read paths are protected.
  // If there is none yet: Shift sets ADMIN_KEY with `wrangler secret put ADMIN_KEY` (never in git/Drive).
  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_KEY || !timingSafeEqual(auth, 'Bearer ' + env.ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);

  const url = new URL(request.url);
  const code = String(url.searchParams.get('code') || '').toUpperCase();
  const mon = String(url.searchParams.get('month') || month());
  if (!/^[A-Z0-9-]{6,24}$/.test(code) || !/^\d{4}-\d{2}$/.test(mon)) return json({ error: 'bad_request' }, 400);

  const meta = await env.YFS_KV.get(`org:${code}`, 'json');
  if (!meta) return json({ error: 'invalid' }, 404);

  const runs = {};
  let total = 0;
  for (const t of TOOLS) {
    const n = parseInt((await env.YFS_KV.get(`orgm:${code}:${mon}:run:${t}`)) || '0', 10) || 0;
    runs[t] = n; total += n;
  }
  // count active devices (list is paginated)
  let active = 0, cursor;
  do {
    const page = await env.YFS_KV.list({ prefix: `orgact:${code}:${mon}:`, cursor });
    active += page.keys.length; cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const [y, mo] = mon.split('-').map(Number);
  const start = `${mon}-01`, end = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
  return json({
    code, org: meta.org || '', plan: meta.plan || '',
    period: { start, end },
    seat_limit: meta.seat_limit || 0,
    seats_redeemed: parseInt((await env.YFS_KV.get(`orgcount:${code}`)) || '0', 10) || 0,
    active_seats: active,
    runs, runs_total: total,
    free_runs: null,   // not attributable: a device is only linked to a code after it enters it
    generated_at: new Date().toISOString(),
  });
}

/* ---- helpers ------------------------------------------------------------- */
function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  // ← Shift: add the Worker's existing CORS headers. The admin page sends an Authorization
  //   header, so OPTIONS must allow it from https://yourfirstshiftapp.com.
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
/* Placeholder. Replace with the Worker's real Pro-token verification (same one the AI route uses). */
async function verifyProToken(env, token) { throw new Error('Shift: wire to existing token verification'); }

/*
 * Optional monthly email to hello@: a Cron Trigger (e.g. "0 13 1 * *") that, for each `org:` key,
 * builds last month's report and sends it with whatever email path the Worker already has.
 * Skipped in v1. Liz can download the CSV from org-report.html instead.
 */
