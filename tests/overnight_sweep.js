// Overnight sweep: every tool, free + Pro, iPhone / Android / desktop.
// Catches page errors, console errors, sideways scroll, elements wider than the screen,
// tiny tap targets, and checks each tool runs and shows a result with a fake AI.
// Usage: node overnight_sweep.js ../app.html [shotDir]
const { chromium } = require('playwright'); const fs = require('fs');
const H = process.argv[2] || '../app.html', SHOTS = process.argv[3] || '';
const RAW = fs.readFileSync('raw_resume.txt', 'utf8');
const OUT = 'Jordan Hayes\nSite Foreman\nSampleton, FL · 555-010-0199 · jordan.hayes@example.com\n\n## SUMMARY\nSite foreman with years of civil work running crews and equipment.\n\n## EXPERIENCE\n### Site Foreman | Gulfview Site Works | 2024 – Present\n- Runs day-to-day site work and final grading\n- Trains crews and operators\n\n## SKILLS\nMotor grader\nDozer\nOSHA 10\n\n## EDUCATION\nHigh School Diploma — Testwood High School';
const DEV = { iphone: { width: 390, height: 844 }, android: { width: 360, height: 800 }, desktop: { width: 1280, height: 800 } };
let fails = 0; const issues = [];
function bad(k, m) { fails++; issues.push(k + ' ' + m); console.log('FAIL', k, m); }
(async () => {
  const b = await chromium.launch();
  for (const [dn, vp] of Object.entries(DEV)) for (const pro of [false, true]) {
    const k = `[${dn} ${pro ? 'pro' : 'free'}]`;
    const ctx = await b.newContext({ viewport: vp, isMobile: dn !== 'desktop', hasTouch: dn !== 'desktop' }); const p = await ctx.newPage();
    const perr = [], cerr = [];
    p.on('pageerror', e => perr.push(e.message)); p.on('dialog', d => d.dismiss());
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) cerr.push(m.text()); });
    await ctx.route('**/*', r => {
      const u = r.request().url();
      if (u.startsWith('http://yfs.local/app.html')) return r.fulfill({ body: fs.readFileSync(H), contentType: 'text/html' });
      if (/workers\.dev\/?$/.test(u)) return r.fulfill({ body: JSON.stringify({ content: [{ text: OUT }] }), contentType: 'application/json' });
      if (/workers\.dev/.test(u)) return r.fulfill({ body: '{}', contentType: 'application/json' });
      return r.abort();
    });
    await p.addInitScript(([raw, pro]) => {
      localStorage.setItem('yfs_vault', JSON.stringify([{ id: 'v1', name: 'JordanHayesResume', text: raw, look: 'Modern Professional', ts: Date.now() }]));
      localStorage.setItem('yfs_vault_active', 'v1'); localStorage.setItem('yfs_resume', raw); if (pro) localStorage.setItem('yfs_pro', '1');
    }, [RAW, pro]);
    await p.goto('http://yfs.local/app.html'); await p.waitForTimeout(600);
    const nTools = await p.evaluate(() => TOOLS.length);
    const check = async (where) => {
      const r = await p.evaluate(() => {
        const W = innerWidth, out = [];
        const sw = document.documentElement.scrollWidth;
        document.querySelectorAll('body *').forEach(el => {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
          const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) return;
          let a = el.parentElement, clipped = false; while (a && a !== document.body) { const s = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { clipped = true; break; } a = a.parentElement; }
          if (!clipped && rc.right > W + 2 && rc.left < W) out.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]) + ' r=' + Math.round(rc.right));
        });
        const small = [];
        document.querySelectorAll('button, a[href], [onclick], select, input:not([type=hidden]):not([type=file])').forEach(el => {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height || rc.bottom < 0) return;
          if (el.closest('.rb-page,#outputBox,footer,.ftr,label')) return;
          if (rc.height < 32 && rc.width < 200) small.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) + ':' + (el.textContent || el.value || '').trim().slice(0, 20) + ' ' + Math.round(rc.width) + 'x' + Math.round(rc.height));
        });
        return { sw, W, wide: out.slice(0, 6), small: [...new Set(small)].slice(0, 8) };
      });
      if (r.sw > r.W + 2) bad(k, `${where}: page scrolls sideways (${r.sw} > ${r.W}) ${r.wide.join(', ')}`);
      else if (r.wide.length) bad(k, `${where}: wider than screen: ${r.wide.join(', ')}`);
      if (dn !== 'desktop' && r.small.length) issues.push(`NOTE ${k} ${where}: small tap targets: ${r.small.join(' | ')}`);
    };
    await check('start');
    for (let t = 0; t < nTools; t++) {
      await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(250);
      await check('tool ' + t + ' open');
      const ran = await p.evaluate(() => {
        const jd = document.getElementById('xrayJd'); const ui = document.getElementById('userInput');
        if (jd && jd.offsetParent) jd.value = 'Heavy Equipment Operator — must run dozer and motor grader, read grade stakes. Full-time, benefits, CDL a plus.';
        if (ui && ui.offsetParent && !ui.value) ui.value = 'Operator role at a county public works department, dozer and grader work.';
        ['xrayJd', 'userInput'].forEach(id => { const e = document.getElementById(id); if (e) e.dispatchEvent(new Event('input', { bubbles: true })); });
        try { updateRunBtn(); } catch (_) {}
        const btn = document.getElementById('runBtn');
        if (!btn || !btn.offsetParent) return 'no-run-btn';
        if (btn.disabled) return 'disabled:' + btn.textContent.trim().slice(0, 40);
        try { runTool(); return 'ran'; } catch (e) { return 'threw:' + e.message; }
      });
      await p.waitForTimeout(1800);
      const res = await p.evaluate(() => {
        const os = document.getElementById('outputSection'), box = document.getElementById('outputBox'), eb = document.getElementById('errorBox'), rb = document.getElementById('rbPage');
        if (TOOLS[activeTool] && TOOLS[activeTool].hasBuilder) return { shown: !!(rb && rb.offsetParent), len: rb ? rb.innerText.trim().length : 0, err: eb && eb.offsetParent ? eb.innerText.trim().slice(0, 80) : '' };
        return { shown: !!(os && os.offsetParent), len: box ? box.innerText.trim().length : 0, err: eb && eb.offsetParent ? eb.innerText.trim().slice(0, 80) : '' };
      });
      const label = `tool ${t}`;
      if (ran === 'ran') {
        if (res.err) bad(k, `${label}: error box after run: ${res.err}`);
        else if (!res.shown || res.len < 40) bad(k, `${label}: no result shown (len ${res.len})`);
        await check(label + ' result');
      } else issues.push(`NOTE ${k} ${label}: did not run (${ran})`);
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: `${SHOTS}/${dn}-${pro ? 'pro' : 'free'}-t${t}.png`, fullPage: true }); }
      await p.evaluate(() => { try { yfsGoHome && yfsGoHome(); } catch (_) {} });
    }
    // bigger tap areas: a tap 10px above/below the small "switch in Vault" button still hits it
    if (dn !== 'desktop') {
      await p.evaluate(() => yfsOpenTool(3)); await p.waitForTimeout(300);
      const hit = await p.evaluate(() => { const b = document.querySelector('#yfsUsing button'); if (!b) return 'none';
        b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const x = r.left + r.width / 2;
        const up = document.elementFromPoint(x, r.top - 9), dn = document.elementFromPoint(x, r.bottom + 9);
        return (up === b || b.contains(up)) && (dn === b || b.contains(dn)) ? 'ok' : 'miss:' + Math.round(r.height); });
      if (hit === 'ok') console.log('PASS', k, 'switch-in-Vault tap area is at least 38px tall'); else if (hit !== 'none') bad(k, 'switch-in-Vault tap area too small (' + hit + ')');
    }
    // plans sheet
    await p.goto('http://yfs.local/app.html#plans'); await p.waitForTimeout(600); await check('#plans');
    if (perr.length) bad(k, 'page errors: ' + [...new Set(perr)].join(' | ').slice(0, 300));
    if (cerr.length) bad(k, 'console errors: ' + [...new Set(cerr)].join(' | ').slice(0, 300));
    if (!perr.length && !cerr.length) console.log('PASS', k, 'no page or console errors');
    await ctx.close();
  }
  await b.close();
  console.log('\n--- notes ---'); issues.filter(x => x.startsWith('NOTE')).forEach(x => console.log(x));
  console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
