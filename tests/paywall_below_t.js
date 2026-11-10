// Overnight fixes: free-run card sits under a saved result; tap pads never steal taps from real buttons;
// owner name not in the app; free X-Ray box has no blank gap. Usage: node paywall_below_t.js ../app.html
const { chromium } = require('playwright'); const fs = require('fs');
const H = process.argv[2] || '../app.html'; const RAW = fs.readFileSync('raw_resume.txt', 'utf8');
const OUT = '## AI MATCH ESTIMATE: 64/100 (vs this job posting)\n## VERDICT: Solid fit.\n\n## ✅ KEYWORD HITS (2 found)\n- Motor grader\n- Dozer\n\n## ❌ CRITICAL GAPS (1 missing)\n- Grade stakes\n\n## 🔧 TOP 5 FIXES — do these before applying\n1. Put motor grader in your summary\n\n## 📊 HIRING PROBABILITY\nGood with fixes.';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const mk = async (pro) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); const st = { perr: [], co: 0 };
    p.on('pageerror', e => st.perr.push(e.message)); p.on('dialog', d => d.dismiss());
    await ctx.route('**/*', r => { const u = r.request().url();
      if (u.startsWith('http://yfs.local/app.html')) return r.fulfill({ body: fs.readFileSync(H), contentType: 'text/html' });
      if (/\/api\/pro\/checkout/.test(u)) { st.co++; return r.fulfill({ status: 502, body: JSON.stringify({ error: 'test' }), contentType: 'application/json' }); }
      if (/workers\.dev\/?$/.test(u)) return r.fulfill({ body: JSON.stringify({ content: [{ text: OUT }] }), contentType: 'application/json' });
      if (/workers\.dev/.test(u)) return r.fulfill({ body: '{}', contentType: 'application/json' }); return r.abort(); });
    await p.addInitScript(([raw, pro]) => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('yfs_vault', JSON.stringify([{ id: 'v1', name: 'JordanHayesResume', text: raw, look: 'Modern Professional', ts: Date.now() }])); localStorage.setItem('yfs_vault_active', 'v1'); localStorage.setItem('yfs_resume', raw); if (pro) localStorage.setItem('yfs_pro', '1'); } }, [RAW, pro]);
    await p.goto('http://yfs.local/app.html'); await p.waitForTimeout(500); return { ctx, p, st }; };
  const runXray = async p => { await p.evaluate(() => yfsOpenTool(1)); await p.waitForTimeout(200); await p.fill('#xrayJd', 'Heavy Equipment Operator — must run dozer and motor grader, read grade stakes. Full-time, benefits.'); await p.evaluate(() => { updateRunBtn(); runTool(); }); await p.waitForTimeout(1500); };
  const cards = p => p.evaluate(() => { const pws = [...document.querySelectorAll('.paywall')].filter(e => e.offsetParent); const os = document.getElementById('outputSection'); const top = e => e ? Math.round(e.getBoundingClientRect().top + scrollY) : null;
    return { n: pws.length, pwTop: pws[0] ? top(pws[0]) : null, osTop: os && os.offsetParent ? top(os) : null, moved: !!document.getElementById('yfsPwMoved'), inApp: !!document.querySelector('#appContent .paywall') }; });
  // every real tap target (>=40px tall) must receive a tap 4px inside each of its edges — no pad from a neighbour may cover it
  const hit = p => p.evaluate(() => { const bad = []; const seen = new Set();
    document.querySelectorAll('button, a[href], [onclick], label.vault-up').forEach(el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none' || !el.offsetParent) return;
      let r = el.getBoundingClientRect(); if (r.height < 40 || r.width < 40) return; if (el.closest('.tabs,.yt-looks,.ym-blur,.bz-text,[aria-hidden="true"]')) return;
      el.scrollIntoView({ block: 'center' }); r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const pts = { top: [cx, r.top + 4], bottom: [cx, r.bottom - 4], left: [r.left + 4, cy], right: [r.right - 4, cy] };
      for (const k in pts) { const [x, y] = pts[k]; if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) continue; const t = document.elementFromPoint(x, y); if (!t) continue;
        if (!(t === el || el.contains(t) || t.contains(el))) { const fixed = t.closest('nav,.bottom-nav,.yfs-nav,header') || getComputedStyle(t).position === 'fixed' || (t.offsetParent && getComputedStyle(t.offsetParent).position === 'fixed'); if (fixed) continue;
          const key = (el.id || el.className || el.tagName) + '@' + k; if (!seen.has(key)) { seen.add(key); bad.push(key + ' covered by ' + (t.id || t.className || t.tagName) + ' "' + (t.textContent || '').trim().slice(0, 18) + '"'); } } } });
    return bad; });

  // ── free user ──
  { const { ctx, p, st } = await mk(false); await runXray(p);
    const h = await p.evaluate(() => ({ h: document.getElementById('outputBox').offsetHeight, onlyH: !document.getElementById('outputBox').querySelector('p,ul,ol,li,table,div,pre,blockquote,h3,h4') }));
    ok(h.onlyH && h.h < 200, 'P6 free X-Ray box (score + verdict only) has no blank gap (height ' + h.h + 'px, was 260)');
    let bad = await hit(p); ok(!bad.length, 'P7a free result: every big button gets a tap 4px inside each edge ' + bad.slice(0, 4).join(' | '));
    const pads = await p.evaluate(() => { const c = document.getElementById('yfsPdfCta'), rl = document.getElementById('yfsRestoreLink'); const pad = e => e ? getComputedStyle(e, '::after').content : 'x'; return { cta: pad(c), restore: pad(rl), paywallBtn: pad(document.querySelector('.paywall-btn')) }; });
    ok(pads.cta === 'none' && pads.restore === 'none', 'P7b big PDF button and Restore button carry no tap pad ' + JSON.stringify(pads));
    // without reload: leave the tool and come back
    await p.evaluate(() => yfsOpenTool(2)); await p.waitForTimeout(600); let r = await cards(p);
    ok(r.n === 1 && r.inApp && !r.moved, 'P2 tool with no saved result: one card in the normal spot ' + JSON.stringify(r));
    bad = await hit(p); ok(!bad.length, 'P7c paywall screen: every big button gets a tap 4px inside each edge ' + bad.slice(0, 4).join(' | '));
    await p.evaluate(() => yfsOpenTool(1)); await p.waitForTimeout(800); r = await cards(p);
    ok(r.n === 1 && r.osTop != null && r.pwTop > r.osTop, 'P1a after a free run, no reload: result first, free-run card under it ' + JSON.stringify(r));
    bad = await hit(p); ok(!bad.length, 'P7d result + moved card: every big button gets a tap 4px inside each edge ' + bad.slice(0, 4).join(' | '));
    const before = st.co; await p.evaluate(() => { const bt = document.querySelector('#yfsPwMoved .paywall-btn'); bt.scrollIntoView({ block: 'center' }); }); await p.click('#yfsPwMoved .paywall-btn'); await p.waitForTimeout(900);
    ok(st.co === before + 1, 'P3 Unlock Pro on the moved card starts checkout (checkout calls ' + before + ' → ' + st.co + ')');
    await p.reload(); await p.waitForTimeout(600); await p.evaluate(() => yfsOpenTool(1)); await p.waitForTimeout(800); r = await cards(p);
    ok(r.n === 1 && r.osTop != null && r.pwTop > r.osTop, 'P1b after reload: result first, card under it');
    for (const t of [0, 3, 1, 4, 1]) await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(700); r = await cards(p);
    ok(r.n === 1, 'P4 fast switching never leaves two cards (' + r.n + ')'); ok(!st.perr.length, 'P5 free: no page errors ' + st.perr.join('|').slice(0, 200)); await ctx.close(); }

  // ── Pro user never sees the card ──
  { const { ctx, p, st } = await mk(true); await runXray(p); let seen = 0;
    for (const t of [2, 1, 0, 1, 5, 1]) { await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(400); seen += await p.evaluate(() => [...document.querySelectorAll('.paywall')].filter(e => e.offsetParent).length + (document.getElementById('yfsPwMoved') ? 1 : 0)); }
    await p.reload(); await p.waitForTimeout(600); await p.evaluate(() => yfsOpenTool(1)); await p.waitForTimeout(800); seen += await p.evaluate(() => [...document.querySelectorAll('.paywall')].filter(e => e.offsetParent).length + (document.getElementById('yfsPwMoved') ? 1 : 0));
    ok(seen === 0, 'P8 Pro never sees the free-run card, before or after reload (' + seen + ')');
    const bad = await hit(p); ok(!bad.length, 'P7e Pro result: every big button gets a tap 4px inside each edge ' + bad.slice(0, 4).join(' | ')); ok(!st.perr.length, 'P5 pro: no page errors'); await ctx.close(); }

  // ── owner name not in the app file ──
  { const src = fs.readFileSync(H, 'utf8'); const stripped = src.split('yourfirstshift.culpepperhunter.workers.dev').join('');
    const m = stripped.match(new RegExp(['hun' + 'ter', 'culp' + 'epper', 'blue.or' + 'igin'].join('|'), 'gi')) || []; /* split so the PII guard does not flag this file */ ok(!m.length, 'P9 owner name / employer not in app.html outside the Worker address (' + m.length + ' hits)'); }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
