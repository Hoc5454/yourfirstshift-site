// Layout pass: Build Resume (Edit / Rebuild first, downloads under the page), upload from every tool into the Vault,
// one-tap update after a resume switch, downloads under results. Made-up resumes only. Usage: node layout_t.js ../app.html [shotDir]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const H = process.argv[2] || '../app.html', SHOTS = process.argv[3] || ''; const RAW = fs.readFileSync('raw_resume.txt', 'utf8');
const RES2 = fs.readFileSync(path.join(__dirname, 'fixtures', 'pdf_look_resume.txt'), 'utf8');
const XRAY = '## AI MATCH ESTIMATE: 64/100 (vs this job posting)\n## VERDICT: Solid fit.\n\n## ✅ KEYWORD HITS (2 found)\n- Motor grader\n- Dozer\n\n## 🔧 TOP 5 FIXES — do these before applying\n1. Put motor grader in your summary\n\n## 📊 HIRING PROBABILITY\nGood with fixes.';
const BUILT = '# Jordan Hayes\nSite Foreman\n\n## PROFESSIONAL SUMMARY\nSite foreman with years of earthwork experience.\n\n## EXPERIENCE\n### Site Foreman | Gulfview Site Works | 2023 – Present\n- Plans and runs daily earthwork\n\n## SKILLS\nMotor Grader, Dozer';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => { const b = await chromium.launch();
  const mk = async (opt = {}) => { const ctx = await b.newContext({ viewport: opt.vp || { width: 390, height: 844 }, isMobile: !opt.vp, hasTouch: !opt.vp }); const p = await ctx.newPage(); const st = { perr: [], ai: 0, extract: 0, co: 0, out: opt.out || XRAY, fileText: opt.fileText || RES2 };
    p.on('pageerror', e => st.perr.push(e.message)); p.on('dialog', d => d.dismiss());
    await ctx.route('**/*', async r => { const u = r.request().url();
      if (u.startsWith('http://yfs.local/app.html')) return r.fulfill({ body: fs.readFileSync(H), contentType: 'text/html' });
      if (/html2pdf/.test(u)) return r.fulfill({ body: 'window.html2pdf=function(){};', contentType: 'application/javascript' });
      if (/\/api\/pro\/checkout/.test(u)) { st.co++; return r.fulfill({ status: 502, body: '{"error":"test"}', contentType: 'application/json' }); }
      if (/workers\.dev\/?$/.test(u)) { if (r.request().headers()['x-yfs-kind'] === 'extract') { st.extract++; if (st.slow) await new Promise(z => setTimeout(z, st.slow)); return r.fulfill({ body: JSON.stringify({ content: [{ text: st.fileText }] }), contentType: 'application/json' }); }
        st.ai++; return r.fulfill({ body: JSON.stringify({ content: [{ text: st.out }] }), contentType: 'application/json' }); }
      if (/workers\.dev/.test(u)) return r.fulfill({ body: '{}', contentType: 'application/json' }); return r.abort(); });
    await p.addInitScript(([raw, pro, vault, used]) => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); if (vault) { localStorage.setItem('yfs_vault', JSON.stringify([{ id: 'v1', name: 'JordanHayesResume', text: raw, look: 'Modern Professional', ts: 1 }])); localStorage.setItem('yfs_vault_active', 'v1'); localStorage.setItem('yfs_resume', raw); } if (pro) localStorage.setItem('yfs_pro', '1'); if (used) localStorage.setItem('yfs_usage', '1'); }, [RAW, !!opt.pro, opt.vault !== false, !!opt.used]);
    await p.goto('http://yfs.local/app.html'); await p.waitForTimeout(600); return { ctx, p, st }; };
  const open = async (p, t) => { await p.evaluate(t => yfsOpenTool(t), t); await p.waitForTimeout(500); };
  const Y = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e || !e.offsetParent || (e.checkVisibility && !e.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true }))) return null; return Math.round(e.getBoundingClientRect().top + scrollY); }, sel);
  const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); } };
  const PDF = { name: 'RileyCarterResume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') };

  // ── A. Build Resume, Pro ──
  { const { ctx, p, st } = await mk({ pro: true, out: BUILT }); await open(p, 5);
    const y = { use: await Y(p, '#yfsUsing'), top: await Y(p, '#yfsRbTop'), look: await Y(p, '.style-picker'), page: await Y(p, '#rbPage'), dl: await Y(p, '#yfsRbDl'), pdf: await Y(p, '#rbDlBtn'), form: await Y(p, '#b_name') };
    ok(y.use < y.top && y.top < y.look && y.look < y.page && y.page < y.dl && y.pdf > y.page, 'A1 Pro order: Using bar → Edit/Rebuild → looks → page → downloads ' + JSON.stringify(y));
    ok(y.top < 700 && y.form === null, 'A2 Edit fields + Rebuild with AI are on the first screen (y=' + y.top + '); the long form is folded away');
    const sz = await p.evaluate(() => [...document.querySelectorAll('#yfsRbTop button,#yfsRbDl .rb-print-btn')].map(b => Math.round(b.getBoundingClientRect().height)));
    ok(sz.every(h => h >= 44), 'A3 every button there is at least 44px tall (' + sz.join(',') + ')');
    await p.click('#yfsRbEdit'); await p.waitForTimeout(500); const fy = await Y(p, '#b_name');
    ok(fy !== null && fy > y.top && fy < y.page + 400 && await p.evaluate(() => document.getElementById('yfsRbEdit').getAttribute('aria-expanded') === 'true'), 'A4 Edit fields opens the form right under the buttons, above the page');
    ok(await Y(p, '#runBtn') !== null && await Y(p, '#runBtn') < await Y(p, '#rbPage'), 'A5 the Build button sits at the end of the form, not under the whole page');
    await p.click('#yfsRbEdit'); await p.waitForTimeout(300); ok(await Y(p, '#b_name') === null, 'A6 tapping again hides the fields');
    await shot(p, 'layout-builder-pro');
    const before = st.ai; const busy = await p.evaluate(() => { const b = document.getElementById('yfsRbAi'); b.click(); return b.textContent + '|' + b.disabled; });
    await p.waitForTimeout(2500); ok(st.ai === before + 1 && /Building.*\|true/.test(busy) && await p.evaluate(() => !document.getElementById('yfsRbAi').disabled), 'A7 Rebuild with AI = exactly one AI run; button shows "Building…" then comes back (' + (st.ai - before) + ')');
    await p.evaluate(() => { window.rbLoadPdfLib = async () => {}; window.__pdf = 0; window.yfsPdfSave = async () => { window.__pdf++; }; }); await p.click('#rbDlBtn'); await p.waitForTimeout(600);
    ok(await p.evaluate(() => window.__pdf === 1), 'A8 Download PDF still works from its new place under the page');
    const m = await p.evaluate(() => { const m = yfsResumeModel(); return { txt: yfsResumeTxt(m).length, docx: yfsResumeDocxXml(m, selectedStyle).length }; }); ok(m.txt > 100 && m.docx > 500, 'A9 Word and Text still build');
    ok(!st.perr.length, 'A10 no page errors ' + st.perr.join('|').slice(0, 200)); await ctx.close(); }
  // empty required fields
  { const { ctx, p, st } = await mk({ pro: true, vault: false }); await open(p, 5);
    ok(await Y(p, '#yfsRbTop') === null && await Y(p, '#b_name') !== null, 'A11 brand-new user (nothing filled in): the form is simply open, no extra buttons');
    await p.fill('#b_skills', 'Forklift'); await p.waitForTimeout(1500); await open(p, 0); await open(p, 5);
    ok(await Y(p, '#yfsRbTop') !== null, 'A12 once something is filled in, Edit/Rebuild shows at the top');
    await p.click('#yfsRbAi'); await p.waitForTimeout(500);
    ok(st.ai === 0 && await Y(p, '#b_name') !== null && /name, the job you want and your work experience/.test(await p.evaluate(() => document.getElementById('yfsRbTop').innerText)), 'A13 Rebuild with missing basics: no AI run, form opens, plain message says what to add'); await ctx.close(); }

  // ── B. Build Resume, free ──
  { const { ctx, p, st } = await mk({ pro: false }); await open(p, 5);
    const y = { top: await Y(p, '#yfsRbTop'), page: await Y(p, '#rbPage'), lock: await Y(p, '#rbPage .paywall-btn, .rb-scale .paywall-btn, .rb-preview-wrap .paywall-btn'), dl: await Y(p, '#yfsRbDl'), rest: await Y(p, '.yfs-rb-restore') };
    ok(y.top < y.page && y.page < y.dl && y.dl < y.rest, 'B1 free order: Edit/Rebuild → page (with its Unlock button) → locked downloads → Restore link ' + JSON.stringify(y));
    await p.evaluate(() => document.querySelector('.yfs-rb-restore').click()); await p.waitForTimeout(300);
    ok(await p.evaluate(() => { const m = document.getElementById('yfsRestoreModal'); return !!m && getComputedStyle(m).display !== 'none'; }), 'B2 "Already Pro? Restore" opens the restore box');
    await p.evaluate(() => { const m = document.getElementById('yfsRestoreModal'); if (m) m.style.display = 'none'; try { yfsCloseRestore(); } catch (_) {} });
    await p.evaluate(() => document.getElementById('rbDlBtn').click()); await p.waitForTimeout(800); ok(st.co === 1 || await p.evaluate(() => !!document.getElementById('rbPdfErr')), 'B3 locked PDF button still leads to Pro (checkout or the Pro note)');
    await shot(p, 'layout-builder-free'); ok(!st.perr.length, 'B4 no page errors ' + st.perr.join('|').slice(0, 200)); await ctx.close(); }
  { const { ctx, p, st } = await mk({ pro: false, used: true }); await open(p, 5);
    ok(/Pro/.test(await p.evaluate(() => (document.getElementById('yfsRbAi') || {}).textContent || '')), 'B5 free run used: the button says "Rebuild with AI (Pro)"');
    await p.click('#yfsRbAi'); await p.waitForTimeout(800); ok(st.ai === 0 && st.co === 1, 'B6 …and it opens checkout, no AI run (ai ' + st.ai + ', checkout ' + st.co + ')'); await ctx.close(); }

  // ── C. upload from any tool → Vault → active everywhere ──
  for (const pro of [true, false]) { const { ctx, p, st } = await mk({ pro });
    for (const t of [0, 1, 2, 3, 4, 5]) { await open(p, t); const has = await p.evaluate(() => !!document.querySelector('#yfsUsing [data-a=up]')); if (!has) { ok(false, `C1 [${pro ? 'pro' : 'free'}] tool ${t} has an Upload button in the Using bar`); } }
    ok(true, `C1 [${pro ? 'pro' : 'free'}] every tool (0–5) has "upload a new one" in the Using bar`);
    await open(p, 4); const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#yfsUsing [data-a=up]')]); await fc.setFiles(PDF); await p.waitForTimeout(2200);
    const v = await p.evaluate(() => { const l = yfsVaultList(), a = l.find(x => x.id === yfsVaultActive()); return { n: l.length, act: a && a.name, has: /Riley Carter/.test(a ? a.text : ''), chip: (document.getElementById('yfsUsing') || {}).innerText || '', status: !!document.getElementById('yfsUpStatus'), zones: document.querySelectorAll('#uploadZone').length }; });
    ok(st.extract === 1 && v.n === 2 && v.has && /RileyCarterResume/.test(v.act) && /RileyCarterResume/.test(v.chip) && !v.status, `C2 [${pro ? 'pro' : 'free'}] upload inside Interview: saved to the Vault (2 resumes), ACTIVE, Using bar updates ` + JSON.stringify({ n: v.n, act: v.act }));
    await open(p, 1); ok(await p.evaluate(() => /Riley Carter/.test(document.getElementById('xrayResume').value) && document.querySelectorAll('#uploadZone').length <= 1), `C3 [${pro ? 'pro' : 'free'}] X-Ray now uses the uploaded resume`);
    await open(p, 5); ok(await p.evaluate(() => /Riley Carter/.test(document.getElementById('rbPage').innerText)), `C4 [${pro ? 'pro' : 'free'}] Build Resume shows the uploaded resume`);
    await p.click('#yfsUsing [data-a=v]'); await p.waitForTimeout(300); ok(await p.evaluate(() => { const s = document.getElementById('vaultInput'); return !!s && !!s.offsetParent; }), `C5 [${pro ? 'pro' : 'free'}] "switch in Vault" still opens the Vault`);
    ok(!st.perr.length, `C6 [${pro ? 'pro' : 'free'}] no page errors ` + st.perr.join('|').slice(0, 200)); await ctx.close(); }
  // no resume yet
  { const { ctx, p, st } = await mk({ pro: false, vault: false }); await open(p, 5);
    ok(/Already have a resume\? Upload it/.test(await p.evaluate(() => (document.getElementById('yfsUsing') || {}).innerText || '')), 'C7 no resume yet, Build Resume: "Already have a resume? Upload it and we’ll fill this in for you."');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#yfsUsing [data-a=up]')]); await fc.setFiles(PDF); await p.waitForTimeout(2200);
    ok(await p.evaluate(() => document.getElementById('b_name').value === 'Riley Carter' && /Riley Carter/.test(document.getElementById('rbPage').innerText) && yfsVaultList().length === 1), 'C8 …uploading fills the builder and saves it to the Vault');
    await open(p, 2); ok(await p.evaluate(() => /Using:/.test(document.getElementById('yfsUsing').innerText)), 'C9 the other tools pick it up');
    await open(p, 0); await ctx.close(); }
  { const { ctx, p, st } = await mk({ pro: true, fileText: 'hello' }); await open(p, 2);
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#yfsUsing [data-a=up]')]); await fc.setFiles(PDF); await p.waitForTimeout(2200);
    const r = await p.evaluate(() => ({ n: yfsVaultList().length, msg: (document.getElementById('yfsUpStatus') || {}).innerText || '', act: yfsVaultActive() }));
    ok(r.n === 1 && r.act === 'v1' && /doesn’t look like a resume|Could not|too short|couldn|scanned/i.test(r.msg), 'C10 a file that is not a resume: clear message, Vault unchanged ("' + r.msg.slice(0, 70) + '")');
    await open(p, 3); ok(await p.evaluate(() => document.querySelectorAll('#uploadZone').length === 1 && !document.getElementById('uploadZoneHold')), 'C11 the tool’s own upload box is intact afterwards'); await ctx.close(); }

  // switching tools while a quick upload is still being read
  for (const [from, to] of [[4, 3], [3, 5], [5, 1], [2, 0]]) { const { ctx, p, st } = await mk({ pro: true }); st.slow = 1500; await open(p, from);
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#yfsUsing [data-a=up]')]); await fc.setFiles(PDF); await p.waitForTimeout(350);
    const during = await p.evaluate(() => ({ status: (document.querySelector('.yfs-up-status') || {}).innerText || '' }));
    await p.evaluate(t => yfsOpenTool(t), to); await p.waitForTimeout(400);
    const mid = await p.evaluate(() => ({ status: !!document.querySelector('.yfs-up-status'), zones: document.querySelectorAll('#uploadZone').length }));
    await p.waitForTimeout(2600);
    const r = await p.evaluate(() => { const l = yfsVaultList(), a = l.find(x => x.id === yfsVaultActive()); const uz = document.getElementById('uploadZone');
      return { n: l.length, act: a && a.name, chip: (document.getElementById('yfsUsing') || {}).innerText || '', status: !!document.querySelector('.yfs-up-status'), hold: !!document.getElementById('uploadZoneHold'), zones: document.querySelectorAll('#uploadZone').length, realZone: uz ? uz.classList.contains('upload-zone') : null, zoneTxt: uz ? uz.innerText.replace(/\s+/g, ' ').slice(0, 40) : '', xr: (document.getElementById('xrayResume') || {}).value || '', ui: (document.getElementById('userInput') || {}).value || '', page: (document.getElementById('rbPage') || {}).innerText || '' }; });
    const hasZone = [0, 1, 3].includes(to);
    ok(/reading/i.test(during.status) && mid.status && mid.zones === 1, `C12 [${from}→${to}] the "Reading your resume…" box follows you to the new tool (one upload zone id on the page) ` + JSON.stringify({ during, mid }));
    ok(st.extract === 1 && r.n === 2 && /RileyCarterResume/.test(r.act) && /RileyCarterResume/.test(r.chip), `C13 [${from}→${to}] the upload still lands in the Vault as ACTIVE and the Using bar on the new tool shows it`);
    ok(!r.status && !r.hold && (hasZone ? (r.zones === 1 && r.realZone === true && !/Reading/.test(r.zoneTxt)) : r.zones === 0), `C14 [${from}→${to}] nothing left behind: no status box, no parked zone, the new tool’s own upload box is intact ` + JSON.stringify({ zones: r.zones, real: r.realZone, txt: r.zoneTxt }));
    if (to === 1) ok(/Riley Carter/.test(r.xr), `C15 [${from}→${to}] X-Ray’s resume box holds the uploaded resume`);
    if (to === 0) ok(/Riley Carter/.test(r.ui), `C15 [${from}→${to}] Translator’s box holds the uploaded resume`);
    if (to === 5) ok(/Riley Carter/.test(r.page), `C15 [${from}→${to}] Build Resume shows the uploaded resume`);
    ok(await p.evaluate(() => extractedFileText === '') && !st.perr.length, `C16 [${from}→${to}] no stale per-tool upload text, no page errors ` + st.perr.join('|').slice(0, 150)); await ctx.close(); }
  // a second upload tapped while one is still being read is ignored (no double read)
  { const { ctx, p, st } = await mk({ pro: true }); st.slow = 1200; await open(p, 2);
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#yfsUsing [data-a=up]')]); await fc.setFiles(PDF); await p.waitForTimeout(250);
    const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.click('#yfsUsing [data-a=up]')]); await fc2.setFiles(PDF); await p.waitForTimeout(3000);
    ok(st.extract === 1 && await p.evaluate(() => yfsVaultList().length === 2 && !document.querySelector('.yfs-up-status')), 'C17 a second upload tapped mid-read is ignored: one read, one new Vault entry (' + st.extract + ' reads)'); await ctx.close(); }

  // ── D. after a resume switch: one tap to update ──
  { const { ctx, p, st } = await mk({ pro: true }); await open(p, 1);
    await p.fill('#xrayJd', 'Heavy Equipment Operator — must run dozer and motor grader, read grade stakes. Full-time, benefits.'); await p.evaluate(() => { updateRunBtn(); runTool(); }); await p.waitForTimeout(1600);
    ok(st.ai === 1 && await Y(p, '#outputSection') !== null, 'D0 first X-Ray run shows a result');
    await p.evaluate(t => { const l = yfsVaultList(); l.push({ id: 'v2', name: 'RileyCarterResume', text: t, look: 'Modern Professional', ts: 2 }); yfsVaultSet(l); yfsVaultUse('v2', false); }, RES2); await p.waitForTimeout(600);
    const n = await p.evaluate(() => { const d = document.getElementById('yfsStaleNote'); return { txt: d ? d.innerText : '', go: !!(d && d.querySelector('.yfs-stale-go')), old: !!(d && d.querySelector('[data-a=old]')), out: getComputedStyle(document.getElementById('outputSection')).display, rs: /Riley Carter/.test(document.getElementById('xrayResume').value) }; });
    ok(st.ai === 1 && n.go && n.old && n.out === 'none' && /different resume/.test(n.txt) && /Update for RileyCarterResume/.test(n.txt), 'D1 switching resumes: old score hidden, banner offers "Update for RileyCarterResume →"; nothing runs by itself (AI runs still ' + st.ai + ')');
    ok(n.rs, 'D2 the X-Ray resume box now holds the new resume');
    await p.fill('#xrayJd', ''); await p.click('#yfsStaleNote .yfs-stale-go'); await p.waitForTimeout(1800);
    ok(st.ai === 2 && await Y(p, '#outputSection') !== null && await p.evaluate(() => !document.getElementById('yfsStaleNote') && /dozer and motor grader/.test(document.getElementById('xrayJd').value)), 'D3 one tap: the saved job description is reused and X-Ray runs once (AI runs ' + st.ai + ')');
    await shot(p, 'layout-xray-updated');
    for (const t of [2, 3, 4]) { await open(p, t); } ok(st.ai === 2, 'D4 opening the other tools runs nothing (AI runs still ' + st.ai + ')'); ok(!st.perr.length, 'D5 no page errors ' + st.perr.join('|').slice(0, 200)); await ctx.close(); }
  { const { ctx, p, st } = await mk({ pro: true }); // saved result for another resume, no saved job text
    await p.evaluate(() => { localStorage.setItem('yfs_res', JSON.stringify({ 3: { text: 'Dear Hiring Manager, I am writing to apply for the operator role. I bring five years of earthwork experience and a clean safety record.', src: 'someone else resume text '.repeat(20), free: false, ts: 1 } })); });
    await open(p, 3); const has = await p.evaluate(() => !!document.querySelector('#yfsStaleNote .yfs-stale-go'));
    if (has) { await p.evaluate(() => { document.getElementById('userInput').value = ''; }); await p.click('#yfsStaleNote .yfs-stale-go'); await p.waitForTimeout(600);
      ok(st.ai === 0 && /Add the job details below, then tap Run/.test(await p.evaluate(() => document.getElementById('yfsStaleNote').innerText)) && await p.evaluate(() => document.activeElement && document.activeElement.id === 'userInput'), 'D6 Cover Letter with no job details: no AI run; it says "Add the job details below, then tap Run" and puts the cursor there');
      await p.click('#yfsStaleNote [data-a=old]'); await p.waitForTimeout(400); ok(await Y(p, '#outputSection') !== null, 'D7 "view the old one" still works'); }
    else ok(false, 'D6 stale banner missing on Cover Letter'); await ctx.close(); }
  { const { ctx, p, st } = await mk({ pro: false, used: true }); await p.evaluate(() => { localStorage.setItem('yfs_res', JSON.stringify({ 1: { text: '## AI MATCH ESTIMATE: 42/100\n## VERDICT: weak', src: 'someone else resume text '.repeat(20), free: true, ts: 1 } })); });
    await open(p, 1); const t = await p.evaluate(() => (document.querySelector('#yfsStaleNote .yfs-stale-go') || {}).textContent || 'none');
    ok(t === 'none' || /Unlock Pro/.test(t), 'D8 free user with the free run used: banner (if shown) says "Unlock Pro to update it" (' + t + ')');
    if (/Unlock Pro/.test(t)) { await p.click('#yfsStaleNote .yfs-stale-go'); await p.waitForTimeout(700); ok(st.ai === 0 && st.co === 1, 'D9 …and opens checkout, no AI run'); } await ctx.close(); }

  // ── E. results: downloads under the result, then upgrade, then Restore ──
  { const { ctx, p, st } = await mk({ pro: false }); await open(p, 1); await p.fill('#xrayJd', 'Heavy Equipment Operator — must run dozer and motor grader, read grade stakes. Full-time, benefits.'); await p.evaluate(() => { updateRunBtn(); runTool(); }); await p.waitForTimeout(1700);
    const y = { box: await Y(p, '#outputBox'), tease: await Y(p, '#yfsTease'), copy: await Y(p, '#copyBtn'), cta: await Y(p, '#yfsPdfCta'), rest: await Y(p, '#yfsRestoreLink') };
    ok(y.box < y.copy && (y.tease === null || y.tease < y.copy) && y.copy < y.cta && y.cta < y.rest, 'E1 free result order: result → (resume preview) → Copy/Print/downloads → "Get the clean PDF" → Restore link ' + JSON.stringify(y));
    await open(p, 2); await open(p, 1); await p.waitForTimeout(600);
    const z = { copy: await Y(p, '#copyBtn'), cta: await Y(p, '#yfsPdfCta'), rest: await Y(p, '#yfsRestoreLink'), card: await Y(p, '#yfsPwMoved .paywall') };
    ok(z.copy < z.cta && z.cta < z.rest && z.card !== null && z.rest < z.card, 'E2 free run used: … → Restore link → the "You’ve used your free run" card last ' + JSON.stringify(z));
    await p.evaluate(() => document.getElementById('yfsRestoreLink').click()); await p.waitForTimeout(300); ok(await p.evaluate(() => { const m = document.getElementById('yfsRestoreModal'); return !!m && getComputedStyle(m).display !== 'none'; }), 'E3 Restore link still opens the restore box');
    await shot(p, 'layout-result-free'); ok(!st.perr.length, 'E4 no page errors ' + st.perr.join('|').slice(0, 200)); await ctx.close(); }
  { const { ctx, p, st } = await mk({ pro: true }); await open(p, 0); await p.evaluate(() => { updateRunBtn(); runTool(); }); await p.waitForTimeout(1700);
    const y = { box: await Y(p, '#outputBox'), copy: await Y(p, '#copyBtn') }; const bh = await p.evaluate(() => document.getElementById('outputBox').offsetHeight);
    ok(y.copy > y.box + bh - 5 && await Y(p, '#yfsPdfCta') === null, 'E5 Pro result: Copy/Print/downloads are under the result; no upgrade button'); await ctx.close(); }

  // ── F. desktop sanity ──
  { const { ctx, p, st } = await mk({ pro: true, vp: { width: 1280, height: 900 } }); await open(p, 5);
    const r = await p.evaluate(() => ({ wide: document.documentElement.scrollWidth - innerWidth, top: !!document.getElementById('yfsRbTop'), dl: !!document.getElementById('yfsRbDl') })); await shot(p, 'layout-builder-desktop');
    ok(r.wide <= 2 && r.top && r.dl && !st.perr.length, 'F1 desktop: same controls, no sideways scroll, no errors ' + JSON.stringify(r)); await ctx.close(); }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
