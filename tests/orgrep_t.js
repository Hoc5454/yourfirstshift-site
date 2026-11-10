// org-report test. Usage: node orgrep_t.js <app.html> <org-report.html> [shot.png]   (Worker mocked; nothing real is called)
const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../app.html',R=process.argv[3]||'../org-report.html',SHOT=process.argv[4]||'';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const RAW=fs.readFileSync('raw_resume.txt','utf8');
async function app(b,{orgOn=true,paid=false}={}){
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[],ev=[],ai=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
  await ctx.route('**/*',async r=>{const u=r.request().url();
    if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
    if(u.includes('fonts.g'))return r.abort();
    if(u.includes('/api/metrics/org_event')){ev.push({ct:r.request().headers()['content-type']||'',b:JSON.parse(r.request().postData()||'{}')});return r.fulfill({status:204,body:''});}
    if(u.includes('/api/org/redeem'))return r.fulfill({body:JSON.stringify({token:'orgtok_A',org:'Tri-County Tech',ends:Math.floor(Date.now()/1000)+30*86400}),contentType:'application/json'});
    if(u.endsWith('workers.dev')||u.endsWith('workers.dev/')){ai.push(r.request().postData()||'');return r.fulfill({body:JSON.stringify({content:[{text:'Dear Hiring Manager,\n\nTest.\n\nJ'}]}),contentType:'application/json'});}
    return r.fulfill({body:'{}',contentType:'application/json'});});
  await p.addInitScript(r=>localStorage.setItem('yfs_resume',r),RAW);
  if(orgOn)await p.addInitScript(()=>{if(localStorage.getItem('yfs_org'))return;localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_pro_token','orgtok_A');localStorage.setItem('yfs_org',JSON.stringify({org:'Tri-County Tech',ends:Date.now()+30*864e5,tok:'orgtok_A'}));});
  if(paid)await p.addInitScript(()=>{localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_pro_token','stripe_tok');});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1200);return {ctx,p,errs,ev,ai};}
async function run(p,i){await p.evaluate(i=>yfsOpenTool(i),i);await p.waitForTimeout(150);const has=await p.$('#userInput');if(has){await p.fill('#userInput','Heavy Equipment Operator — Lee County.');}
  await p.evaluate(()=>{try{updateRunBtn();}catch(_){}runTool();});await p.waitForTimeout(900);}
(async()=>{const b=await chromium.launch();
 // T1 org Pro: open ping once per day, run events per tool
 {const {ctx,p,errs,ev,ai}=await app(b);
  const opens=()=>ev.filter(e=>e.b.k==='open').length;
  ok(opens()===1&&ev[0].b.t==='orgtok_A','T1 one "open" event with org token');
  ok(ev.every(e=>e.ct.startsWith('text/plain')),'T1 events are simple requests (text/plain)');
  await run(p,3);await run(p,4);
  const runs=ev.filter(e=>e.b.k==='run').map(e=>e.b.tool);
  ok(ai.length===2&&JSON.stringify(runs)==='["cover","interview"]','T1 run events: '+JSON.stringify(runs)+' (AI calls '+ai.length+')');
  ok(ev.every(e=>Object.keys(e.b).every(k=>['t','k','tool'].includes(k))),'T1 events carry only token/kind/tool — no resume text');
  ok(!ev.some(e=>JSON.stringify(e.b).includes('Jordan')),'T1 no resume content in events');
  await p.reload();await p.waitForTimeout(1100);ok(opens()===1,'T1 open not repeated same day');
  ok(errs.length===0,'T1 no page errors '+errs.join('|'));await ctx.close();}
 // T2 extract (file upload read) is not counted as a run
 {const {ctx,p,ev}=await app(b);await p.evaluate(()=>fetch(YFS_API,{method:'POST',headers:proHeaders({'X-YFS-Kind':'extract'}),body:'{}'}));await p.waitForTimeout(300);
  ok(!ev.some(e=>e.b.k==='run'),'T2 file-read call not counted');await ctx.close();}
 // T3 failed AI call not counted
 {const {ctx,p,ev}=await app(b);await p.route('**/*',r=>{const u=r.request().url();if(u.endsWith('workers.dev')||u.endsWith('workers.dev/'))return r.fulfill({status:500,body:'{}'});return r.fallback();});
  await run(p,3);ok(!ev.some(e=>e.b.k==='run'),'T3 failed AI call not counted');await ctx.close();}
 // T4 Free user and paid Stripe Pro: no org events at all
 {const {ctx,p,ev,errs}=await app(b,{orgOn:false});await run(p,3);ok(ev.length===0,'T4 Free user: no org events');ok(errs.length===0,'T4 no page errors');await ctx.close();}
 {const {ctx,p,ev}=await app(b,{orgOn:false,paid:true});await run(p,3);ok(ev.length===0,'T4 Stripe Pro user: no org events');await ctx.close();}
 // T5 redeem → open ping right away
 {const {ctx,p,ev}=await app(b,{orgOn:false});await p.evaluate(()=>yfsOpenOrg('YFS-TCTC-7KQ4'));await p.click('#yfsOrgGo');await p.waitForTimeout(500);
  ok(ev.filter(e=>e.b.k==='open').length===1,'T5 open event right after redeem');await ctx.close();}
 // T6 admin page with mocked report
 {const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];let auth='',q='';p.on('pageerror',e=>errs.push(e.message));
  const REP={code:'YFS-TCTC-7KQ4',org:'Tri-County Tech',plan:'pilot',period:{start:'2026-11-01',end:'2026-11-30'},seat_limit:25,seats_redeemed:18,active_seats:14,runs:{translator:9,ats:31,outreach:6,cover:17,interview:12,builder:8,other:0},runs_total:83,free_runs:null,generated_at:'2026-12-01T13:00:00Z'};
  await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/org-report.html'))return r.fulfill({body:fs.readFileSync(R),contentType:'text/html'});
    if(u.includes('/api/admin/org-report')){auth=r.request().headers()['authorization']||'';q=u.split('?')[1];if(auth!=='Bearer test-admin')return r.fulfill({status:401,body:'{}',contentType:'application/json'});return r.fulfill({body:JSON.stringify(REP),contentType:'application/json'});}
    return r.abort();});
  await p.goto('http://yfs.local/org-report.html');
  await p.fill('#code','yfs tctc 7kq4');await p.fill('#month','2026-11');await p.fill('#key','wrong');await p.click('#go');await p.waitForTimeout(300);
  ok(/not accepted/.test(await p.textContent('#msg')),'T6 wrong admin key → clear message');
  await p.fill('#key','test-admin');await p.click('#go');await p.waitForTimeout(300);
  ok(q==='code=YFS-TCTC-7KQ4&month=2026-11'&&auth==='Bearer test-admin','T6 request: '+q);
  const txt=await p.textContent('#out');ok(/18 \/ 25/.test(txt)&&/ATSX-Ray31/.test(txt.replace(/\s/g,''))&&/83/.test(txt),'T6 report renders seats/tools/total');
  const csv=await p.evaluate(d=>yfsReportCSV(d),REP);const lines=csv.trim().split('\n');
  ok(lines.length===2&&lines[0].startsWith('org,code,period_start')&&lines[1].startsWith('Tri-County Tech,YFS-TCTC-7KQ4,2026-11-01,2026-11-30,25,18,14,9,31,8,17,6,12,83'),'T6 CSV: '+lines[1]);
  ok(!/@|Jordan/.test(csv),'T6 CSV has no PII');
  ok(await p.evaluate(()=>localStorage.length===0&&sessionStorage.length===0),'T6 admin key not stored');
  if(SHOT)await p.screenshot({path:SHOT,fullPage:true});
  ok(errs.length===0,'T6 no page errors '+errs.join('|'));await ctx.close();}
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
