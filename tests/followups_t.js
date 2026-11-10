// Nov 10 follow-ups (app): small Unlock Pro links padded, device id on file reads, 429 wait message,
// storage notice, reset keeps On the Job records. Usage: node followups_t.js ../app.html
const { chromium } = require('playwright'); const fs = require('fs');
const H = process.argv[2] || '../app.html'; const RAW = fs.readFileSync('raw_resume.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => { const b = await chromium.launch();
  const mk = async (opt = {}) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); const st = { perr: [], reqs: [], mode: opt.mode || 'ok' };
    p.on('pageerror', e => st.perr.push(e.message)); p.on('dialog', d => d.dismiss());
    await ctx.route('**/*', r => { const u = r.request().url();
      if (u.startsWith('http://yfs.local/app.html')) return r.fulfill({ body: fs.readFileSync(H), contentType: 'text/html' });
      if (/workers\.dev\/?$/.test(u)) { st.reqs.push(r.request().headers());
        if (st.mode === '429json') return r.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'rate_limited', message: 'x', retry_after: 1500 }) });
        if (st.mode === '429one') return r.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'rate_limited', retry_after: 45 }) });
        if (st.mode === '429plain') return r.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Rate limit exceeded' }) });
        return r.fulfill({ body: JSON.stringify({ content: [{ text: RAW }] }), contentType: 'application/json' }); }
      if (/workers\.dev/.test(u)) return r.fulfill({ body: '{}', contentType: 'application/json' }); return r.abort(); });
    if (opt.init) await p.addInitScript(opt.init, opt.initArg);
    await p.goto('http://yfs.local/app.html'); await p.waitForTimeout(600); return { ctx, p, st }; };
  const seed = ([raw, pro]) => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.setItem('yfs_vault', JSON.stringify([{ id: 'v1', name: 'JordanHayesResume', text: raw, look: 'Modern Professional', ts: Date.now() }])); localStorage.setItem('yfs_vault_active', 'v1'); localStorage.setItem('yfs_resume', raw); if (pro) localStorage.setItem('yfs_pro', '1'); };

  // F1 every small inline "Unlock Pro" link has a tap pad; big buttons never do
  { const { ctx, p } = await mk({ init: seed, initArg: [RAW, false] });
    const r = await p.evaluate(() => { const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:20px;top:200px;z-index:99999;background:#fff;padding:30px'; document.body.appendChild(host);
      const links = [...document.querySelectorAll('a[onclick*="yfsOpenCheckout"]')]; const out = { small: [], big: [] };
      links.forEach(a => { const c = a.cloneNode(true); c.style.display = c.id === 'yfsPdfCta' ? 'block' : ''; c.removeAttribute('id'); if (a.id) c.id = a.id + 'Clone'; const pad = getComputedStyle(a, '::after'); const rec = { txt: a.textContent.trim().slice(0, 22), content: pad.content, top: pad.top };
        (a.id === 'yfsPdfCta' || a.classList.contains('paywall-btn') ? out.big : out.small).push(rec); }); host.remove(); return out; });
    ok(r.small.length >= 1 && r.small.every(x => x.content !== 'none' && x.top === '-12px'), 'F1a every small inline Unlock Pro link carries the 12px tap pad (' + r.small.length + ' links: ' + r.small.map(x => x.txt).join(' / ') + ')');
    ok(r.big.length >= 1 && r.big.every(x => x.content === 'none'), 'F1b the big PDF button still has no pad');
    // dynamic ones too (Builder banner / PDF error line)
    const dyn = await p.evaluate(() => { const d = document.createElement('div'); d.id = 'whatever'; d.innerHTML = '<a href="#" onclick="event.preventDefault();yfsOpenCheckout()">Unlock Pro →</a>'; document.body.appendChild(d); const c = getComputedStyle(d.firstChild, '::after').content; d.remove(); return c; });
    ok(dyn !== 'none', 'F1c a small Unlock Pro link rendered anywhere later is padded too'); await ctx.close(); }

  // F2 file reads send the device id
  { const { ctx, p, st } = await mk({});
    await p.evaluate(() => yfsOpenTool(3)); await p.waitForTimeout(300); const inp = await p.$('#fileInput');
    await inp.setInputFiles({ name: 'r.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') }); await p.waitForTimeout(1500);
    const h = st.reqs.find(x => x['x-yfs-kind'] === 'extract');
    ok(!!h && /^[a-f0-9]{32}$/.test(h['x-yfs-dev'] || ''), 'F2 file-read request carries X-YFS-Dev (' + (h ? (h['x-yfs-dev'] || 'missing').slice(0, 8) + '…' : 'no extract call') + ')'); await ctx.close(); }

  // F3 429 → wait time in plain words, free run kept, retry works
  for (const [mode, want] of [['429json', /lot of requests this hour\. Please wait about 25 minutes, then tap Try again\./], ['429one', /Please wait about 1 minute, then tap Try again\./], ['429plain', /lot of requests this hour\. Please wait a few minutes, then tap Try again\./]]) {
    const { ctx, p, st } = await mk({ init: seed, initArg: [RAW, false], mode });
    await p.evaluate(() => yfsOpenTool(1)); await p.waitForTimeout(200); await p.fill('#xrayJd', 'Heavy Equipment Operator — dozer, motor grader, grade stakes. Full-time with benefits.'); await p.evaluate(() => { updateRunBtn(); runTool(); }); await p.waitForTimeout(2500);
    const e = await p.evaluate(() => document.getElementById('errorBox').innerText.replace(/\s+/g, ' '));
    ok(want.test(e) && /won’t use your free run/.test(e) && !/busy/.test(e), `F3 ${mode}: "${e.slice(0, 120)}"`);
    st.mode = 'ok'; await p.click('#errorBox .yfs-retry-btn'); await p.waitForTimeout(1800);
    ok(await p.evaluate(() => document.getElementById('outputSection').offsetParent && document.getElementById('outputBox').innerText.length > 40), `F3 ${mode}: Try again then works, free run was not used`); ok(!st.perr.length, `F3 ${mode}: no page errors`); await ctx.close(); }

  // F4 storage notice
  { const { ctx, p, st } = await mk({ init: () => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('SecurityError', 'SecurityError'); } }); Object.defineProperty(window, 'sessionStorage', { configurable: true, get() { throw new DOMException('SecurityError', 'SecurityError'); } }); } });
    await p.evaluate(() => yfsOpenTool(0)); await p.waitForTimeout(300);
    let n = await p.evaluate(() => { const d = document.getElementById('yfsStoreNote'); return d ? d.innerText : ''; });
    ok(/blocking saved data/.test(n) && /Block All Cookies/.test(n), 'F4a localStorage AND sessionStorage blocked: app runs and says so in plain words');
    await p.click('#yfsStoreNote button'); await p.waitForTimeout(4500); ok(await p.evaluate(() => !document.getElementById('yfsStoreNote')), 'F4b OK dismisses it for the visit');
    await p.evaluate(() => { const ui = document.getElementById('userInput'); ui.value = 'Ran dozer and grader for 5 years at a site contractor. Led a crew of 6. OSHA 10.'; updateRunBtn(); runTool(); }); await p.waitForTimeout(1600);
    ok(await p.evaluate(() => document.getElementById('outputBox').innerText.length > 40) && !st.perr.length, 'F4c tools still run with both storages blocked ' + st.perr.join('|').slice(0, 150)); await ctx.close(); }
  { const { ctx, p } = await mk({ init: () => { const real = Storage.prototype.setItem; let n = 0; Storage.prototype.setItem = function () { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); }; } });
    await p.evaluate(() => { try { localStorage.setItem('yfs_x', '1'); } catch (_) {} }); await p.waitForTimeout(4500);
    ok(/storage is full/.test(await p.evaluate(() => (document.getElementById('yfsStoreNote') || {}).innerText || '')), 'F4d storage full: plain-words notice');
    await p.reload(); await p.waitForTimeout(800); ok(await p.evaluate(() => typeof yfsOpenTool === 'function' && !!document.getElementById('appContent')), 'F4e storage full, then reload: app still starts'); await ctx.close(); }
  { const { ctx, p } = await mk({ init: seed, initArg: [RAW, true] }); await p.waitForTimeout(4500); ok(await p.evaluate(() => !document.getElementById('yfsStoreNote')), 'F4f normal phone: no notice'); await ctx.close(); }

  // F5 reset keeps On the Job records and clears the in-memory fallback
  { const { ctx, p } = await mk({ init: seed, initArg: [RAW, false] });
    const r = await p.evaluate(() => { localStorage.setItem('yfs_otj_v1', '{"app":"yfs-on-the-job","entries":[1]}'); localStorage.setItem('yfs_otj_v1_prev', '{"entries":[]}'); localStorage.setItem('yfs_junk', '1'); yfsResetFreeClient();
      return { otj: localStorage.getItem('yfs_otj_v1'), prev: localStorage.getItem('yfs_otj_v1_prev'), junk: localStorage.getItem('yfs_junk'), vault: localStorage.getItem('yfs_vault') }; });
    ok(!!r.otj && !!r.prev && r.junk === null && r.vault === null, 'F5a reset clears app data but keeps On the Job records ' + JSON.stringify({ otj: !!r.otj, prev: !!r.prev, junk: r.junk, vault: r.vault })); await ctx.close(); }
  { const { ctx, p } = await mk({ init: () => { Storage.prototype.setItem = function () { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); }; } });
    const r = await p.evaluate(() => { localStorage.setItem('yfs_a', '1'); localStorage.setItem('yfs_otj_v1', 'keep'); const before = localStorage.getItem('yfs_a'); yfsResetFreeClient(); return { before, a: localStorage.getItem('yfs_a'), otj: localStorage.getItem('yfs_otj_v1') }; });
    ok(r.before === '1' && r.a === null && r.otj === 'keep', 'F5b reset also clears the in-memory fallback (and still keeps On the Job) ' + JSON.stringify(r)); await ctx.close(); }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
