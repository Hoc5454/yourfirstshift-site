// home-plans: homepage Pack/Yearly cards follow GET /api/pro/plans; Pro checkout unchanged.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const HTML=fs.readFileSync(path.resolve(process.argv[2]||'../index.html'),'utf8');const API='https://yourfirstshift.culpepperhunter.workers.dev';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
async function run(b,mode){const ctx=await b.newContext({viewport:{width:412,height:915},deviceScaleFactor:3.5,isMobile:true,hasTouch:true});const posts=[];
 await ctx.route('**/*',async r=>{const u=r.request().url();
  if(u==='http://yfs.local/')return r.fulfill({body:HTML,contentType:'text/html'});
  if(u===API+'/api/pro/plans'){if(mode==='error')return r.fulfill({status:500,body:'{}'});if(mode==='hang')return;
   const p=mode==='both'?{pro:true,pack:true,pro_year:true}:mode==='packonly'?{pro:true,pack:true,pro_year:false}:{pro:true,pack:false,pro_year:false};
   return r.fulfill({body:JSON.stringify({plans:p,pack_days:30}),contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'}});}
  if(u===API+'/api/pro/checkout'){posts.push(r.request().postData());return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/pay/test'}),contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'}});}
  if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({status:204,body:''});
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'}});
  return r.abort();});
 await ctx.addInitScript(()=>{window.__cls=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value;}).observe({type:'layout-shift',buffered:true});}catch(_){}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>{if(!/Unexpected token '<'/.test(e.message))errs.push(e.message);});p.on('dialog',d=>{errs.push('DIALOG '+d.message());d.dismiss();});
 await p.goto('http://yfs.local/');await p.waitForTimeout(mode==='hang'?6500:1500);
 const st=await p.evaluate(()=>[...document.querySelectorAll('.plan[data-plan]')].map(c=>({id:c.dataset.plan,soon:c.classList.contains('soon'),badge:c.querySelector('.badge').textContent,btn:(c.querySelector('a.btn')||{}).textContent||null})));
 return {ctx,p,st,posts,errs,cls:await p.evaluate(()=>window.__cls)};}
(async()=>{const b=await chromium.launch();
 {const r=await run(b,'both');const [pk,yr]=r.st;
  ok(!pk.soon&&pk.badge==='Available now'&&/Job Hunt Pack — \$29/.test(pk.btn),'T1 plans on → Pack card live ['+JSON.stringify(pk)+']');
  ok(!yr.soon&&yr.badge==='Available now'&&/Pro yearly — \$59\/year/.test(yr.btn),'T2 plans on → Yearly card live');
  await r.p.click('.plan[data-plan=pack] a.btn');await r.p.waitForTimeout(800);ok(r.posts.includes('{"plan":"pack"}'),'T3 Pack button sends {"plan":"pack"} '+JSON.stringify(r.posts));
  await r.p.goto('http://yfs.local/');await r.p.waitForTimeout(1500);await r.p.click('.plan[data-plan=pro_year] a.btn');await r.p.waitForTimeout(800);ok(r.posts.includes('{"plan":"pro_year"}'),'T4 Yearly button sends {"plan":"pro_year"}');
  await r.p.goto('http://yfs.local/');await r.p.waitForTimeout(1500);await r.p.click('.plan.pro a.btn');await r.p.waitForTimeout(800);ok(r.posts.includes('{}'),'T5 Pro button unchanged: sends {}');
  ok(!r.errs.length,'T6 no page errors '+r.errs.join('|'));
  const y=await r.p.evaluate(()=>document.querySelector('#pricing').getBoundingClientRect().top+scrollY);await r.p.evaluate(y=>scrollTo(0,y),y);await r.p.waitForTimeout(300);await r.p.screenshot({path:'/tmp/ats/plans_on.png',fullPage:false});
  ok(r.cls<0.01,'T7 no visible layout shift (CLS '+r.cls.toFixed(4)+')');await r.ctx.close();}
 {const r=await run(b,'packonly');ok(!r.st[0].soon&&r.st[1].soon&&r.st[1].badge==='Available soon','T8 only Pack on → Yearly stays Available soon');await r.ctx.close();}
 {const r=await run(b,'off');ok(r.st.every(c=>c.soon&&c.badge==='Available soon'&&!c.btn),'T9 plans off → both stay Available soon (today\'s look)');await r.ctx.close();}
 {const r=await run(b,'error');ok(r.st.every(c=>c.soon&&!c.btn),'T10 server error → both stay Available soon, no errors');ok(!r.errs.length,'T10b no page errors');await r.ctx.close();}
 {const r=await run(b,'hang');ok(r.st.every(c=>c.soon&&!c.btn),'T11 server never answers → gives up after 5s, cards stay Available soon');await r.ctx.close();}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
