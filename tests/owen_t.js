// owen-landing: "Owen sent you. Your free run is ready." card. Usage: node owen_t.js [../app.html]
// Worker + Stripe mocked; nothing real is called. Writes o/owen_home_390.png and o/owen_xray_390.png
const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../app.html';const RAW=fs.readFileSync('raw_resume.txt','utf8');
const XR=`## AI MATCH ESTIMATE: 64/100 (vs this job posting)\n## VERDICT: Solid fit.\n\n## ✅ KEYWORD HITS (2 found)\n- Motor grader\n- Dozer\n\n## ❌ CRITICAL GAPS (1 missing)\n- Grade stakes\n\n## 🔧 TOP 5 FIXES — do these before applying\n1. Put "motor grader" in your summary\n\n## 📊 HIRING PROBABILITY\nGood with fixes.`;
let fails=0;const ok=(c,m)=>{console.log((c?'  PASS ':'  FAIL ')+m);if(!c)fails++;};
(async()=>{const b=await chromium.launch();
 async function open(q,o={}){const log=[],errs=[];const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:o.dpr||1});
  await ctx.route('**/*',r=>{const u=r.request().url();
    if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
    if(u.includes('fonts.g'))return r.abort();if(u.includes('workers.dev'))log.push(u);
    if(u.includes('/api/pro/checkout'))return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/test'}),contentType:'application/json'});
    if(/workers\.dev\/?$/.test(u))return r.fulfill({body:JSON.stringify({content:[{text:XR}]}),contentType:'application/json'});
    return r.fulfill({body:'{}',contentType:'application/json'});});
  await ctx.addInitScript(([raw,o])=>{if(sessionStorage.getItem('__i'))return;sessionStorage.setItem('__i','1');
    if(o.resume)localStorage.setItem('yfs_resume',raw);if(o.pro)localStorage.setItem('yfs_pro','1');if(o.used)localStorage.setItem('yfs_usage','1');
    if(o.oldSrc)localStorage.setItem('yfs_src',JSON.stringify({s:'tiktok',t:Date.now()}));},[RAW,o]);
  const p=await ctx.newPage();p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message);});p.on('dialog',d=>d.dismiss());
  await p.goto('http://yfs.local/app.html'+q);await p.waitForTimeout(500);return {ctx,p,log,errs};}
 const card=p=>p.evaluate(()=>{const c=document.getElementById('yfsOwen');if(!c)return {shown:false};const r=c.getBoundingClientRect();
   return {shown:c.classList.contains('on')&&getComputedStyle(c).display!=='none'&&r.height>0,text:c.innerText.replace(/\s+/g,' ').trim(),h:Math.round(r.height),top:Math.round(r.top)};});
 // T1 tiktok → card on Start screen, exact copy, small, doesn't hide the cards
 {console.log('T1 ?src=tiktok (Start)');const {ctx,p,errs}=await open('?src=tiktok',{dpr:2});const c=await card(p);
  ok(c.shown,'card shown');ok(/^Owen sent you\. Your free run is ready\. ✕$/.test(c.text),'copy exact: "'+c.text+'"');ok(c.h<=80,'small (height '+c.h+'px)');
  const t=await p.evaluate(()=>{const e=document.querySelector('.yh-main').getBoundingClientRect();return e.bottom<=844;});ok(t,'"Fix my resume" card still above the fold');
  await p.screenshot({path:'o/owen_home_390.png'});ok(errs.length===0,'no page errors');await ctx.close();}
 for(const q of ['?src=reels','?src=shorts']){console.log('T2 '+q);const {ctx,p,errs}=await open(q);ok((await card(p)).shown,'card shown');ok(errs.length===0,'no page errors');await ctx.close();}
 // T3 no src / unknown src / old src from a past visit → no card
 for(const [q,o,l] of [['',{},'no src'],['?src=facebook',{},'unknown src'],['?src=',{},'empty src'],['',{oldSrc:true},'src only from an earlier visit']]){console.log('T3 '+l);
  const {ctx,p,errs}=await open(q,o);ok(!(await card(p)).shown,'no card');ok(errs.length===0,'no page errors');await ctx.close();}
 // T4 Pro or free run already used → no card (it would not be true)
 for(const [o,l] of [[{pro:true},'Pro'],[{used:true},'free run used']]){console.log('T4 '+l);const {ctx,p,errs}=await open('?src=tiktok',o);ok(!(await card(p)).shown,'no card');ok(errs.length===0,'no page errors');await ctx.close();}
 // T5 deep link #tool-1 → card above X-Ray; free run one-tap; card goes away after the run
 {console.log('T5 ?src=tiktok#tool-1 → free run');const {ctx,p,log,errs}=await open('?src=tiktok#tool-1',{resume:true,dpr:2});
  ok(/ATS X-Ray/.test(await p.textContent('#toolTitle')),'X-Ray open');const c=await card(p);ok(c.shown,'card shown above tool (top '+c.top+')');await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(200);await p.screenshot({path:'o/owen_xray_390.png'});
  await p.fill('#xrayJd','Heavy Equipment Operator — Demo County. Must run dozer and motor grader, read grade stakes, CDL a plus. Full-time.');
  await p.evaluate(()=>{try{updateRunBtn()}catch(_){}});
  await p.evaluate(()=>document.getElementById('runBtn').scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(700);
  const rb=await p.evaluate(()=>{const b=document.getElementById('runBtn');const r2=b.getBoundingClientRect();const e=document.elementFromPoint(r2.left+r2.width/2,r2.top+r2.height/2);return {dis:b.disabled,txt:b.textContent,hit:e===b||b.contains(e),at:e&&(e.id||e.className)};});
  ok(!rb.dis&&rb.hit,'Run button enabled and not covered: '+rb.txt+' '+rb.at);
  await p.click('#runBtn');await p.waitForTimeout(1600);
  ok(log.filter(u=>/workers\.dev\/?$/.test(u)).length===1,'one tap = 1 AI run');
  ok(!(await card(p)).shown,'card hidden after free run is used');ok(errs.length===0,'no page errors');await ctx.close();}
 // T6 dismiss → stays hidden for the session (SPA nav + reload); Start cards still work
 {console.log('T6 dismiss');const {ctx,p,errs}=await open('?src=tiktok');await p.click('#yfsOwen .yo-x');ok(!(await card(p)).shown,'hidden after ✕');
  await p.evaluate(()=>yfsOpenTool(3));await p.evaluate(()=>yfsGoHome());ok(!(await card(p)).shown,'still hidden after nav');
  await p.reload();await p.waitForTimeout(400);ok(!(await card(p)).shown,'still hidden after reload');
  await p.click('.yh-main');await p.waitForTimeout(200);ok(/ATS X-Ray/.test(await p.textContent('#toolTitle')),'Start card still opens X-Ray');ok(errs.length===0,'no page errors');await ctx.close();}
 // T7 card not in print
 {console.log('T7 print');const {ctx,p,errs}=await open('?src=tiktok');await p.emulateMedia({media:'print'});ok(await p.evaluate(()=>getComputedStyle(document.getElementById('yfsOwen')).display)==='none','hidden in print');await ctx.close();}
 await b.close();console.log(fails?'FAILURES: '+fails:'ALL PASS');process.exit(fails?1:0);})();
