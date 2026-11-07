// co-timeout: "Opening secure checkout…" spinner gives up after ~10s if the Worker never answers; double-tap still = one call.
// Mocked Worker only — never calls the real API or Stripe. Usage: node cotimeout_t.js [../app.html] [shot.png]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');const SHOT=process.argv[3];
const API='https://yourfirstshift.culpepperhunter.workers.dev';
let fails=0;const ok=(c,n)=>{console.log((c?'PASS ':'FAIL ')+n);if(!c)fails++;};
(async()=>{const b=await chromium.launch();
 async function open(o={}){const ctx=await b.newContext({viewport:{width:390,height:844}});const log={ck:0};const errs=[],alerts=[];
  await ctx.route('**/*',async r=>{const u=r.request().url(),m=r.request().method();
   if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
   if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({body:'<html><body>STRIPE</body></html>',contentType:'text/html'});
   if(u.startsWith(API)){if(m==='OPTIONS')return r.fulfill({status:204});
     if(u.endsWith('/api/pro/checkout')){log.ck++;const d=(o.delays||[250])[log.ck-1]??250;await new Promise(x=>setTimeout(x,d));
       try{return await r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/pay/pro'}),contentType:'application/json'});}catch(_){return;}}
     if(u.endsWith('/api/pro/plans'))return r.fulfill({body:'{"plans":{"pro":true,"pack":false,"pro_year":false}}',contentType:'application/json'});
     return r.fulfill({body:'{}',contentType:'application/json'});}
   if(u.startsWith('http://yfs.local/'))return r.fulfill({body:'',status:404});return r.abort();});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{alerts.push(d.message());d.dismiss();});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1500);return {ctx,p,log,errs,alerts};}
 const spin=p=>p.evaluate(()=>!!document.getElementById('yfsCoOpen'));
 // T1 Worker hangs (25s) → spinner at first, gone by ~10s with an honest "taking too long / not charged" alert; stays on app
 let {ctx,p,log,errs,alerts}=await open({delays:[25000,250]});
 ok(errs.length===0,'T1 page loads with no errors');
 const t0=Date.now();p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(400);
 ok(await spin(p),'T1 "Opening secure checkout…" shows while waiting');
 if(SHOT)await p.screenshot({path:SHOT});
 await p.evaluate(()=>{yfsOpenCheckout();yfsOpenCheckout();});await p.waitForTimeout(200);
 ok(log.ck===1,'T1 double/triple tap while waiting → still one checkout call');
 await p.waitForTimeout(8500);ok(await spin(p)&&alerts.length===0,'T1 still waiting at ~9s (no early give-up)');
 await p.waitForFunction(()=>!document.getElementById('yfsCoOpen'),null,{timeout:4000}).catch(()=>{});const el=Date.now()-t0;
 ok(!(await spin(p)),'T1 spinner cleared after timeout ('+el+'ms)');ok(el>=9500&&el<=12500,'T1 gave up at ~10s');
 await p.waitForTimeout(200);
 ok(alerts.length===1&&/taking too long/.test(alerts[0])&&/not been charged/.test(alerts[0]),'T1 alert: '+JSON.stringify(alerts[0]||''));
 ok(p.url().startsWith('http://yfs.local/'),'T1 stays on the app');
 // T2 tap again after a timeout → works (busy flag reset) and lands on Stripe in the same tab
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:6000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();})]);
 ok(log.ck===2&&p.url().startsWith('https://checkout.stripe.com/'),'T2 second tap after timeout → Stripe same tab');
 ok(errs.length===0,'T1/T2 no page errors');await ctx.close();
 // T3 normal fast Worker → straight to Stripe, no alert
 ({ctx,p,log,errs,alerts}=await open({delays:[300]}));
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:6000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();})]);
 ok(log.ck===1&&p.url().startsWith('https://checkout.stripe.com/')&&alerts.length===0,'T3 fast Worker → Stripe, no alert');await ctx.close();
 // T4 slow-but-OK Worker (7s) → still goes to Stripe (no false timeout)
 ({ctx,p,log,alerts}=await open({delays:[7000]}));
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:12000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();})]);
 ok(p.url().startsWith('https://checkout.stripe.com/')&&alerts.length===0,'T4 7s Worker → still Stripe, no alert');await ctx.close();
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
