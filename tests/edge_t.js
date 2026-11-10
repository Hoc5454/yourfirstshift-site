// Edge-case pass: hostile/odd input, broken storage, no network, double taps, bad links, tiny screens.
// Usage: node edge_t.js ../app.html
const { chromium } = require('playwright'); const fs = require('fs');
const H = process.argv[2] || '../app.html'; const RAW = fs.readFileSync('raw_resume.txt', 'utf8');
const OUT = '## SUMMARY\nSite foreman with years of civil work.\n\n## EXPERIENCE\n### Site Foreman | Gulfview Site Works | 2024 – Present\n- Runs day-to-day site work\n- Trains crews\n\n## SKILLS\nMotor grader\nDozer';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const mk = async (opt = {}) => {
    const ctx = await b.newContext({ viewport: opt.vp || { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
    const st = { perr: [], calls: 0, mode: opt.net || 'ok', dialogs: [] };
    p.on('pageerror', e => st.perr.push(e.message)); p.on('dialog', d => { st.dialogs.push(d.message()); d.dismiss(); });
    await ctx.route('**/*', async r => {
      const u = r.request().url();
      if (u.startsWith('http://yfs.local/app.html')) return r.fulfill({ body: fs.readFileSync(H), contentType: 'text/html' });
      if (/workers\.dev\/?$/.test(u)) { st.calls++;
        if (st.mode === 'down') return r.abort('failed'); if (st.mode === '500') return r.fulfill({ status: 500, body: 'oops' });
        if (st.mode === 'junk') return r.fulfill({ body: '<html>not json', contentType: 'text/html' });
        if (st.mode === 'empty') return r.fulfill({ body: JSON.stringify({ content: [{ text: '' }] }), contentType: 'application/json' });
        if (st.mode === 'slow') await new Promise(z => setTimeout(z, 1200));
        return r.fulfill({ body: JSON.stringify({ content: [{ text: opt.out || OUT }] }), contentType: 'application/json' }); }
      if (/workers\.dev/.test(u)) return r.fulfill({ body: '{}', contentType: 'application/json' });
      return r.abort();
    });
    if (opt.init) await p.addInitScript(opt.init, opt.initArg);
    await p.goto('http://yfs.local/app.html' + (opt.hash || '')); await p.waitForTimeout(700);
    return { ctx, p, st };
  };
  const seed = ([raw, pro, name]) => { localStorage.setItem('yfs_vault', JSON.stringify([{ id: 'v1', name: name || 'JordanResume', text: raw, look: 'Modern Professional', ts: Date.now() }])); localStorage.setItem('yfs_vault_active', 'v1'); localStorage.setItem('yfs_resume', raw); if (pro) localStorage.setItem('yfs_pro', '1'); };
  const run = async (p, t) => { await p.evaluate(t => { yfsOpenTool(t); }, t); await p.waitForTimeout(250);
    await p.evaluate(() => { const jd = document.getElementById('xrayJd'), ui = document.getElementById('userInput');
      if (jd && jd.offsetParent) jd.value = 'Heavy Equipment Operator — dozer, motor grader, grade stakes. Full-time with benefits.';
      if (ui && ui.offsetParent && !ui.value) ui.value = 'Operator role at county public works.'; try { updateRunBtn(); } catch (_) {} }); };
  const state = p => p.evaluate(() => { const v = e => !!(e && e.offsetParent); const eb = document.getElementById('errorBox'), os = document.getElementById('outputSection'), btn = document.getElementById('runBtn');
    return { err: v(eb) ? eb.innerText.trim() : '', out: v(os) ? document.getElementById('outputBox').innerText.trim().length : 0, btn: btn ? { dis: btn.disabled, txt: btn.textContent.trim() } : null, busy: !!window.yfsRunBusy }; });

  // E1 hostile vault name + resume text: no script runs, no markup injected
  { const XSS = '<img src=x onerror="window.__pwn=1">"><script>window.__pwn=2</script>\'';
    const { ctx, p, st } = await mk({ init: seed, initArg: [XSS + '\n' + RAW, true, XSS] });
    for (const t of [0, 1, 2, 3, 4, 5]) { await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(200); }
    await p.evaluate(() => { try { yfsOpenVault ? yfsOpenVault() : openVault(); } catch (_) {} }); await p.waitForTimeout(300);
    await run(p, 0); await p.evaluate(() => runTool()); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({ pwn: window.__pwn || 0, img: document.querySelectorAll('img[src="x"]').length }));
    ok(!r.pwn && !r.img, 'E1 hostile resume name/text is shown as text, never run (' + JSON.stringify(r) + ')'); ok(!st.perr.length, 'E1 no page errors ' + st.perr.join('|').slice(0, 200)); await ctx.close(); }

  // E2 hostile AI output
  { const { ctx, p, st } = await mk({ init: seed, initArg: [RAW, true], out: '## SUMMARY\n<img src=x onerror="window.__pwn=1"> <script>window.__pwn=2</script> [click](javascript:window.__pwn=3)\n\n## SKILLS\n<b onmouseover="window.__pwn=4">Dozer</b>' });
    for (const t of [0, 1, 2, 3, 4]) { await run(p, t); await p.evaluate(() => runTool()); await p.waitForTimeout(1300); }
    const r = await p.evaluate(() => ({ pwn: window.__pwn || 0, img: document.querySelectorAll('img[src="x"]').length, js: document.querySelectorAll('a[href^="javascript"]').length, on: document.querySelectorAll('#outputSection [onmouseover], #outputSection [onerror]').length }));
    ok(!r.pwn && !r.img && !r.js && !r.on, 'E2 hostile AI output is neutralised in every tool (' + JSON.stringify(r) + ')'); ok(!st.perr.length, 'E2 no page errors ' + st.perr.join('|').slice(0, 200)); await ctx.close(); }

  // E3 corrupted storage: app still boots and tools open
  { const { ctx, p, st } = await mk({ init: () => { for (const k of ['yfs_vault', 'yfs_res', 'yfs_handoff', 'yfs_last_output', 'yfs_otj_v1', 'yfs_pro_token', 'yfs_runs', 'yfs_free_used']) localStorage.setItem(k, '{{{not json'); localStorage.setItem('yfs_vault_active', 'nope'); localStorage.setItem('yfs_res', '[1,2,"x",null]'); } });
    let opened = 0; for (const t of [0, 1, 2, 3, 4, 5]) { await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(200); opened += await p.evaluate(() => document.getElementById('appContent').children.length > 0 ? 1 : 0); }
    ok(opened === 6 && !st.perr.length, 'E3 corrupted saved data: app boots, all 6 tools open, no errors (' + opened + ') ' + st.perr.join('|').slice(0, 300)); await ctx.close(); }

  // E4 storage blocked (private mode / quota): app still usable
  { const { ctx, p, st } = await mk({ init: () => { const th = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); }; Storage.prototype.setItem = th; } });
    await run(p, 0); await p.evaluate(() => { const ui = document.getElementById('userInput'); ui.value = 'Ran dozer and grader for 5 years at a site contractor. Led a crew of 6. OSHA 10.'; ui.dispatchEvent(new Event('input', { bubbles: true })); updateRunBtn(); runTool(); }); await p.waitForTimeout(1600);
    const s = await state(p); ok(s.out > 40 && !s.err && !/Incomplete/.test(await p.evaluate(() => document.getElementById('outputBox').innerText)) && !st.perr.length, 'E4 storage full: tool runs, shows a result, no false error (out ' + s.out + ', err "' + s.err.slice(0, 60) + '") ' + st.perr.join('|').slice(0, 300)); await ctx.close(); }
  { const { ctx, p, st } = await mk({ init: () => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('SecurityError', 'SecurityError'); } }); } });
    const boot = await p.evaluate(() => typeof yfsOpenTool === 'function' && !!document.getElementById('appContent'));
    let opened = 0; if (boot) for (const t of [0, 1, 5]) { try { await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(200); opened += await p.evaluate(() => document.getElementById('appContent').children.length > 0 ? 1 : 0); } catch (_) {} }
    let ranOk = 0; if (boot) { await p.evaluate(() => { const ui = document.getElementById('userInput') ; yfsOpenTool(0); }); await p.waitForTimeout(200); await p.evaluate(() => { const ui = document.getElementById('userInput'); ui.value = 'Ran dozer and grader for 5 years at a site contractor. Led a crew of 6. OSHA 10.'; updateRunBtn(); runTool(); }); await p.waitForTimeout(1600); const s = await state(p); ranOk = s.out > 40 && !s.err ? 1 : 0; }
    ok(boot && opened === 3 && ranOk && !st.perr.length, 'E4b storage fully denied (cookies blocked): app boots, tools open (' + opened + '/3) and run (' + ranOk + ') ' + [...new Set(st.perr)].join('|').slice(0, 300)); await ctx.close(); }

  // E5 network failures: friendly error, button usable again, free run not burned
  for (const mode of ['down', '500', 'junk', 'empty']) { const { ctx, p, st } = await mk({ init: seed, initArg: [RAW, false], net: mode });
    await run(p, 1); await p.evaluate(() => runTool()); await p.waitForTimeout(mode === 'down' ? 9000 : 4000); const s = await state(p);
    const used = await p.evaluate(() => { try { return typeof freeUsed === 'function' ? freeUsed() : (localStorage.getItem('yfs_free_used') || localStorage.getItem('yfs_used') || ''); } catch (_) { return '?'; } });
    ok(!!s.err && !/undefined|null|\[object|TypeError|SyntaxError|Unexpected token/i.test(s.err), `E5 ${mode}: clear error shown ("${s.err.replace(/\s+/g, ' ').slice(0, 90)}")`);
    ok(!s.busy && s.btn && !s.btn.dis, `E5 ${mode}: run button usable again (${JSON.stringify(s.btn)})`);
    st.mode = 'ok'; await p.evaluate(() => { const r = document.querySelector('#errorBox .yfs-retry-btn'); if (r) r.click(); else runTool(); }); await p.waitForTimeout(2000); const s2 = await state(p);
    ok(s2.out > 40, `E5 ${mode}: free user can try again and gets the result (free run was not burned) out=${s2.out} err="${s2.err.slice(0, 60)}"`);
    ok(!st.perr.length, `E5 ${mode}: no page errors ` + st.perr.join('|').slice(0, 200)); await ctx.close(); }

  // E6 double tap on Run: one AI call
  { const { ctx, p, st } = await mk({ init: seed, initArg: [RAW, true], net: 'slow' });
    await run(p, 3); await p.evaluate(() => { runTool(); runTool(); document.getElementById('runBtn').click(); }); await p.waitForTimeout(3200);
    ok(st.calls === 1, 'E6 triple-tap Run makes one AI call (' + st.calls + ')'); await ctx.close(); }

  // E7 bad / odd links
  for (const h of ['#tool-9', '#tool-', '#tool-abc', '#plans?x=1', '#%E0%A4%A', '#tool-5', '?src=<script>alert(1)</script>#tool-1', '?org=%3Cimg%20src%3Dx%20onerror%3Dwindow.__pwn%3D1%3E']) { const { ctx, p, st } = await mk({ hash: h });
    const r = await p.evaluate(() => ({ ok: !!document.body.innerText.trim(), pwn: window.__pwn || 0, home: !!document.querySelector('#appContent, .yfs-home') }));
    ok(r.ok && !r.pwn && !st.perr.length && !st.dialogs.length, `E7 link "${h.slice(0, 40)}" loads cleanly ` + st.perr.join('|').slice(0, 200) + st.dialogs.join('|').slice(0, 80)); await ctx.close(); }

  // E8 vault edge cases
  { const { ctx, p, st } = await mk({ init: seed, initArg: [RAW, true] });
    const r = await p.evaluate(() => { const out = {};
      yfsVaultDel('v1'); out.afterDel = { n: yfsVaultList().length, act: localStorage.getItem('yfs_vault_active'), res: (localStorage.getItem('yfs_resume') || '').length };
      return out; });
    for (const t of [0, 1, 2, 3, 4, 5]) { await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(150); }
    const chip = await p.evaluate(() => /Using:/.test((document.getElementById('yfsUsing') || {}).innerText || ''));
    ok(r.afterDel.n === 0 && !chip && !st.perr.length, 'E8 deleting the only resume: no "Using" bar left behind, tools still open ' + JSON.stringify(r.afterDel) + ' ' + st.perr.join('|').slice(0, 200));
    await p.evaluate(() => yfsOpenTool(3)); await p.waitForTimeout(200);
    const s = await p.evaluate(() => { try { updateRunBtn(); } catch (_) {} const b = document.getElementById('runBtn'); const up = document.getElementById('uploadZone'); return { dis: b && b.disabled, txt: b && b.textContent.trim(), upVisible: !!(up && up.offsetParent) }; });
    ok(s.upVisible, 'E8 after deleting the only resume, the upload box is back on upload tools ' + JSON.stringify(s)); await ctx.close(); }

  // E9 very long + unusual resume text
  { const big = (RAW + '\n').repeat(40) + '\n— “smart quotes” – ñ é 你好 🚜 ‮right-to-left‬ \t tabs ' + 'A'.repeat(3000);
    const { ctx, p, st } = await mk({ init: seed, initArg: [big, true] });
    await run(p, 1); const t0 = Date.now(); await p.evaluate(() => runTool()); await p.waitForTimeout(2500); const s = await state(p);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok((s.out > 40 || !!s.err) && !st.perr.length, 'E9 very long resume (' + big.length + ' chars): result or clear message, no crash (out ' + s.out + ', err "' + s.err.slice(0, 70) + '")');
    ok(sw <= 2, 'E9 long unbroken text does not make the page scroll sideways (' + sw + ')'); await ctx.close(); }

  // E10 tiny screen 320px + landscape: nothing wider than screen
  for (const vp of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) for (const pro of [false, true]) { const { ctx, p, st } = await mk({ init: seed, initArg: [RAW, pro], vp });
    const wide = []; for (const t of [0, 1, 2, 3, 4, 5]) { await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(250); if (pro && t < 5) { await run(p, t); await p.evaluate(() => runTool()); await p.waitForTimeout(1300); }
      const d = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (d > 2) wide.push('tool' + t + ':+' + d); }
    await p.evaluate(() => { location.hash = '#plans'; }); await p.goto('http://yfs.local/app.html#plans'); await p.waitForTimeout(700); const d = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (d > 2) wide.push('plans:+' + d);
    ok(!wide.length && !st.perr.length, `E10 ${vp.width}x${vp.height} ${pro ? 'pro' : 'free'}: no sideways scroll ${wide.join(' ')} ${st.perr.join('|').slice(0, 150)}`); await ctx.close(); }

  // E11 back button
  { const { ctx, p, st } = await mk({ init: seed, initArg: [RAW, true] });
    await p.evaluate(() => yfsOpenTool(2)); await p.waitForTimeout(200); await p.evaluate(() => yfsOpenTool(4)); await p.waitForTimeout(200);
    await p.goBack().catch(() => {}); await p.waitForTimeout(400); const a = await p.evaluate(() => ({ url: location.href, body: document.body.innerText.length }));
    await p.goBack().catch(() => {}); await p.waitForTimeout(400); const c = await p.evaluate(() => ({ url: location.href, body: document.body.innerText.length })).catch(() => ({ url: 'left', body: 1 }));
    ok(a.body > 100 && c.body > 0 && !st.perr.length, 'E11 Back button never lands on a blank page (' + a.url.split('/').pop() + ' → ' + c.url.split('/').pop() + ')'); await ctx.close(); }

  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
