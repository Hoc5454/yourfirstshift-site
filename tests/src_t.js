// src-tracking: ?src= capture, persistence, attach to metrics + Pro checkout, #tool-1 deep link.
// Usage: node src_t.js [../app.html]   (Worker + Stripe fully mocked; nothing real is called)
const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../app.html';const RAW=fs.readFileSync('raw_resume.txt','utf8');
const XR=`## AI MATCH ESTIMATE: 64/100 (vs this job posting)\n## VERDICT: Solid fit.\n\n## ✅ KEYWORD HITS (2 found)\n- Motor grader\n- Dozer\n\n## ❌ CRITICAL GAPS (1 missing)\n- Grade stakes\n\n## 🔧 TOP 5 FIXES — do these before applying\n1. Put "motor grader" in your summary\n\n## 📊 HIRING PROBABILITY\nGood with fixes.`;
let fails=0;const ok=(c,m)=>{console.log((c?'  PASS ':'  FAIL ')+m);if(!c)fails++;};
async function ctxFor(b,log,opts={}){const ctx=await b.newContext({viewport:{width:390,height:844}});
  await ctx.route('**/*',r=>{const q=r.request(),u=q.url();/* checkout-same-tab: Stripe now opens in the SAME tab; a 204 keeps the test on the app page */if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({status:204,body:''});
    if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
    if(u.includes('fonts.g'))return r.abort();
    if(u.includes('workers.dev'))log.push({u,body:q.postData()||''});
    if(u.includes('/api/pro/checkout'))return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/test'}),contentType:'application/json'});
    if(/workers\.dev\/?$/.test(u))return r.fulfill({body:JSON.stringify({content:[{text:XR}]}),contentType:'application/json'});
    return r.fulfill({body:'{}',contentType:'application/json'});});
  await ctx.addInitScript(([raw,o])=>{if(!sessionStorage.getItem('__init')){sessionStorage.setItem('__init','1');
      localStorage.setItem('yfs_resume',raw);if(o.stale)localStorage.setItem('yfs_src',JSON.stringify({s:'reels',t:Date.now()-31*864e5}));}},[RAW,opts]);
  return ctx;}
async function page(ctx,errs){const p=await ctx.newPage();p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message);});p.on('dialog',d=>d.dismiss());return p;}
const metric=(log,m)=>log.filter(x=>x.u.includes('/api/metrics/'+m));
const ck=log=>log.filter(x=>x.u.includes('/api/pro/checkout'));
const ai=log=>log.filter(x=>/workers\.dev\/?$/.test(x.u));
(async()=>{const b=await chromium.launch();
 // T1 tiktok: capture, survive SPA nav, free run, Pro checkout, new tab
 {console.log('T1 ?src=tiktok → free run → Pro checkout');const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);
  await p.goto('http://yfs.local/app.html?src=tiktok');await p.waitForTimeout(500);
  ok(metric(log,'visit').length===1&&metric(log,'visit')[0].u.endsWith('/api/metrics/visit?src=tiktok'),'visit metric carries ?src=tiktok');
  ok(await p.evaluate(()=>yfsSrc())==='tiktok','yfsSrc() = tiktok');
  await p.evaluate(()=>yfsOpenTool(3));await p.evaluate(()=>yfsGoHome());await p.evaluate(()=>yfsOpenPlans());await p.evaluate(()=>yfsCloseSheets());
  await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(150);
  ok(await p.evaluate(()=>yfsSrc())==='tiktok','src survives SPA navigation (home/tool/sheets)');
  await p.fill('#xrayJd','Heavy Equipment Operator — Lee County. Must run dozer and motor grader, read grade stakes, CDL a plus. Full-time.');
  await p.evaluate(()=>{try{updateRunBtn()}catch(_){}});await p.evaluate(()=>runTool());await p.waitForTimeout(1500);
  ok(ai(log).length===1,'1 AI run');
  ok(metric(log,'free_run').length===1&&metric(log,'free_run')[0].u.endsWith('?src=tiktok'),'free_run metric carries ?src=tiktok');
  ok(ai(log).every(x=>!/"src"/.test(x.body)),'AI request body unchanged (no src field sent to the model)');
  await p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(500);
  const c=ck(log);ok(c.length===1&&JSON.parse(c[0].body).src==='tiktok','Pro checkout body = '+(c[0]&&c[0].body));
  ok(metric(log,'pay_tap').every(x=>x.u.endsWith('?src=tiktok'))&&metric(log,'pay_tap').length>=1,'pay_tap metric carries ?src=tiktok');
  await p.evaluate(()=>yfsCheckoutPlan('pack'));await p.waitForTimeout(400);
  const c2=ck(log)[1];ok(c2&&JSON.parse(c2.body).plan==='pack'&&JSON.parse(c2.body).src==='tiktok','plan checkout keeps plan + adds src: '+(c2&&c2.body));
  // new tab, no ?src (e.g. return from Stripe ?session_id=…) — src still known from the last 30 days
  const log2Len=log.length;const p2=await page(ctx,errs);await p2.goto('http://yfs.local/app.html?checkout=canceled');await p2.waitForTimeout(500);
  ok(await p2.evaluate(()=>yfsSrc())==='tiktok'&&await p2.evaluate(()=>yfsSrcThisSession())==='','new tab without ?src still attributes tiktok (not counted as this-session src)');
  await p2.evaluate(()=>yfsOpenCheckout());await p2.waitForTimeout(400);
  ok(JSON.parse(ck(log).slice(-1)[0].body).src==='tiktok','checkout from new tab still carries src');
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T2 reels + shorts + case/space
 for(const [q,exp] of [['reels','reels'],['shorts','shorts'],['%20TikTok%20','tiktok']]){const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);
  await p.goto('http://yfs.local/app.html?src='+q);await p.waitForTimeout(400);await p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(400);
  console.log('T2 ?src='+q);ok(await p.evaluate(()=>yfsSrc())===exp&&JSON.parse(ck(log)[0].body).src===exp&&metric(log,'visit')[0].u.endsWith('?src='+exp),'captured as '+exp);
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T3 unknown / empty / junk → ignored safely, request bodies byte-identical to before
 for(const q of ['?src=','?src=facebook','?src=%3Cscript%3E','?src=tiktok%22','']){const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);
  await p.goto('http://yfs.local/app.html'+q);await p.waitForTimeout(400);await p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(400);
  console.log('T3 '+(q||'(no query)'));
  ok(await p.evaluate(()=>yfsSrc())===''&&await p.evaluate(()=>localStorage.getItem('yfs_src'))===null,'nothing stored');
  ok(ck(log)[0].body==='{}'&&metric(log,'visit')[0].u.endsWith('/api/metrics/visit')&&metric(log,'pay_tap')[0].u.endsWith('/api/metrics/pay_tap'),'checkout body "{}" and metric URLs unchanged');
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T4 stale (>30 days) src ignored; a later bogus ?src does not wipe a good one
 {console.log('T4 30-day window');const log=[],errs=[];const ctx=await ctxFor(b,log,{stale:true});const p=await page(ctx,errs);
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(400);ok(await p.evaluate(()=>yfsSrc())==='','31-day-old src ignored');
  await p.goto('http://yfs.local/app.html?src=shorts');await p.waitForTimeout(300);await p.goto('http://yfs.local/app.html?src=bogus');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>yfsSrc())==='shorts','bogus ?src keeps last good src');ok(errs.length===0,'no page errors');await ctx.close();}
 // T5 deep link #tool-1 with and without src
 for(const q of ['#tool-1','?src=tiktok#tool-1']){const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);
  await p.goto('http://yfs.local/app.html'+q);await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({t:document.getElementById('toolTitle').textContent,c:document.body.className,a:activeTool,vis:getComputedStyle(document.getElementById('xrayJd')).display!=='none'}));
  console.log('T5 '+q);ok(/ATS X-Ray/.test(r.t)&&/yfs-tool/.test(r.c)&&r.a===1&&r.vis,'opens ATS X-Ray '+JSON.stringify(r));
  if(q.includes('src'))ok(await p.evaluate(()=>yfsSrc())==='tiktok','src kept with deep link');
  if(q.includes('src')){await p.screenshot({path:'o/src_xray_390.png'});}
  ok(errs.length===0,'no page errors');await ctx.close();}
 await b.close();console.log(fails?'FAILURES: '+fails:'ALL PASS');process.exit(fails?1:0);})();
