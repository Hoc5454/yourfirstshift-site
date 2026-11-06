// plans: $29 Job Hunt Pack + $59/yr appear only when the Worker says they're buyable; pack pass UI + clean ending; checkout polish.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');
const API='https://yourfirstshift.culpepperhunter.workers.dev';
let fails=0;const ok=(c,n)=>{console.log((c?'PASS ':'FAIL ')+n);if(!c)fails++;};
const b64u=s=>Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const tok=c=>b64u(JSON.stringify(c))+'.sig';const now=()=>Math.floor(Date.now()/1000);
(async()=>{const b=await chromium.launch();
 async function open(o={}){const ctx=await b.newContext({viewport:{width:390,height:844}});const log={plans:0,ck:[]};const errs=[],alerts=[];
  await ctx.route('**/*',async r=>{const u=r.request().url(),m=r.request().method();
   if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
   if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({body:'<html><body>STRIPE</body></html>',contentType:'text/html'});
   if(u.startsWith(API)){if(m==='OPTIONS')return r.fulfill({status:204});
     if(u.endsWith('/api/pro/plans')){log.plans++;return r.fulfill({body:JSON.stringify({plans:o.plans||{pro:true,pack:false,pro_year:false},pack_days:30}),contentType:'application/json'});}
     if(u.endsWith('/api/pro/checkout')){const bd=JSON.parse(r.request().postData()||'{}');log.ck.push(bd);await new Promise(x=>setTimeout(x,o.delay||250));
       if(o.unavail&&bd.plan)return r.fulfill({status:409,body:'{"error":"plan_unavailable"}',contentType:'application/json'});
       return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/pay/'+(bd.plan||'pro')}),contentType:'application/json'});}
     return r.fulfill({body:'{}',contentType:'application/json'});}
   if(u.startsWith('http://yfs.local/'))return r.fulfill({body:'',status:404});return r.abort();});
  if(o.tok)await ctx.addInitScript(t=>{localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_pro_token',t);},o.tok);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{alerts.push(d.message());d.dismiss();});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1800);return {ctx,p,log,errs,alerts};}
 const cards=p=>p.evaluate(()=>[...document.querySelectorAll('#ypList .yp-card')].map(c=>({id:c.dataset.id,off:c.getAttribute('aria-disabled')==='true',txt:c.textContent})));
 // T1 prices not set → pack/year shown but not buyable; Pro default
 let {ctx,p,log,errs}=await open();await p.evaluate(()=>yfsOpenPlans());await p.waitForTimeout(400);let c=await cards(p);
 ok(log.plans>=1,'T1 app asks the Worker which plans are live');
 ok(c.find(x=>x.id==='pack').off&&c.find(x=>x.id==='pro_year').off&&!c.find(x=>x.id==='pro').off,'T1 no prices yet → $29/$59 greyed, $9 buyable');
 ok(/\$9/.test(await p.textContent('#ypCta')),'T1 CTA defaults to $9 monthly');ok(errs.length===0,'T1 no errors');await ctx.close();
 // T2 prices set → pack + yearly buyable; pack checkout = same tab, one call, spinner shows
 ({ctx,p,log,errs}=await open({plans:{pro:true,pack:true,pro_year:true},delay:700}));await p.evaluate(()=>yfsOpenPlans());await p.waitForTimeout(500);c=await cards(p);
 ok(!c.find(x=>x.id==='pack').off&&!c.find(x=>x.id==='pro_year').off,'T2 prices set → $29 and $59 selectable');
 await p.click('#ypList .yp-card[data-id="pack"]');ok(/\$29/.test(await p.textContent('#ypCta')),'T2 picking the pack → CTA says $29');
 const nav=p.waitForURL('https://checkout.stripe.com/**',{timeout:6000}).catch(()=>{});
 await p.click('#ypCta');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!!document.getElementById('yfsCoOpen')&&/Opening secure checkout/.test(document.getElementById('yfsCoOpen').textContent)),'T2 "Opening secure checkout…" shows while waiting');
 await p.evaluate(()=>{try{yfsPlanGo();yfsPlanGo();}catch(_){}});await nav;
 ok(log.ck.length===1&&log.ck[0].plan==='pack','T2 one checkout session, plan=pack (taps 2 and 3 ignored)');ok(p.url().endsWith('/pack'),'T2 same tab lands on Stripe');ok(errs.length===0,'T2 no errors');await ctx.close();
 // T3 yearly
 ({ctx,p,log}=await open({plans:{pro:true,pack:true,pro_year:true}}));await p.evaluate(()=>yfsOpenPlans());await p.waitForTimeout(400);
 await p.click('#ypList .yp-card[data-id="pro_year"]');ok(/\$59/.test(await p.textContent('#ypCta')),'T3 yearly CTA says $59');
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:6000}).catch(()=>{}),p.click('#ypCta')]);
 ok(log.ck.length===1&&log.ck[0].plan==='pro_year','T3 yearly checkout sends plan=pro_year');await ctx.close();
 // T4 Worker says plan unavailable (price removed) → honest alert, stays, re-syncs, spinner gone
 let alerts;({ctx,p,log,alerts}=await open({plans:{pro:true,pack:true,pro_year:true},unavail:true}));await p.evaluate(()=>yfsOpenPlans());await p.waitForTimeout(400);
 const before=log.plans;await p.click('#ypList .yp-card[data-id="pack"]');await p.click('#ypCta');await p.waitForTimeout(900);
 ok(alerts.length===1&&/not been charged/.test(alerts[0])&&p.url().startsWith('http://yfs.local/'),'T4 409 → "not charged" alert, stays on app');
 ok(log.plans>before,'T4 plan list re-checked');ok(await p.evaluate(()=>!document.getElementById('yfsCoOpen')),'T4 spinner cleared');await ctx.close();
 // T5 pack holder: pill + Account show end date, no Manage/Cancel, can still move to monthly
 const ends=now()+10*86400;({ctx,p,errs}=await open({tok:tok({pack:'cs_test_1',pi:'pi_1',iat:now(),exp:ends,src:'pack'})}));
 const pill=await p.textContent('#usagePill');ok(/^Pro · through /.test(pill),'T5 pill = "'+pill+'"');
 ok(await p.evaluate(()=>getComputedStyle(document.getElementById('manageSubBtn')).display)==='none','T5 no Manage/Cancel in the nav');
 await p.evaluate(()=>yfsOpenAccount());await p.waitForTimeout(300);
 ok(/Job Hunt Pack/.test(await p.textContent('#yaPlan'))&&/nothing to cancel/.test(await p.textContent('#yaPlanS')),'T5 Account explains the pack');
 ok(await p.evaluate(()=>getComputedStyle(document.getElementById('yaManage')).display)==='none','T5 Account hides Manage/Cancel');
 await p.evaluate(()=>{yfsCloseSheets();yfsOpenPlans();});await p.waitForTimeout(300);await p.click('#ypList .yp-card[data-id="pro"]');
 ok(await p.evaluate(()=>!document.getElementById('ypCta').disabled)&&/\$9/.test(await p.textContent('#ypCta')),'T5 pack holder can still choose $9 monthly');ok(errs.length===0,'T5 no errors');await ctx.close();
 // T6 pack already ended at load → Free + one-time notice; "See plans" works
 ({ctx,p,errs}=await open({tok:tok({pack:'cs_test_1',iat:now()-31*86400,exp:now()-60,src:'pack'})}));
 ok(await p.evaluate(()=>localStorage.getItem('yfs_pro')===null&&localStorage.getItem('yfs_pro_token')===null),'T6 expired pack removed before load');
 ok(await p.isVisible('#yfsPackEnded')&&/Job Hunt Pack ended/.test(await p.textContent('#yfsPackEnded')),'T6 "pack ended" notice shown');
 await p.click('#yfsPackEnded button:not(.ghost)');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.getElementById('yfsPlans').classList.contains('open'))&&!(await p.isVisible('#yfsPackEnded')),'T6 "See plans" opens Plans, notice gone');ok(errs.length===0,'T6 no errors');await ctx.close();
 // T7 pack runs out while the app is open
 ({ctx,p}=await open({tok:tok({pack:'cs_test_1',iat:now(),exp:now()+3,src:'pack'})}));
 ok(/through/.test(await p.textContent('#usagePill')),'T7 starts as pack Pro');await p.waitForTimeout(3500);
 await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await p.waitForTimeout(300);
 ok(await p.evaluate(()=>localStorage.getItem('yfs_pro')===null)&&await p.isVisible('#yfsPackEnded'),'T7 ends cleanly + notice when the app comes back');await ctx.close();
 // T8 monthly Pro subscriber untouched (still "You're on Pro", Manage visible)
 ({ctx,p}=await open({tok:tok({sub:'sub_1',iat:now(),exp:now()+20*86400})}));await p.evaluate(()=>yfsOpenAccount());await p.waitForTimeout(300);
 ok(await p.evaluate(()=>getComputedStyle(document.getElementById('yaManage')).display)!=='none'&&!/Job Hunt Pack/.test(await p.textContent('#yaPlan')),'T8 monthly subscriber unchanged (Manage visible)');await ctx.close();
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
