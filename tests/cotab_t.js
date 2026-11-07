// checkout-same-tab: Upgrade goes to Stripe in the same tab, no new tab, no double checkout, honest error.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');
let fails=0;const ok=(c,n)=>{console.log((c?'PASS ':'FAIL ')+n);if(!c)fails++;};
(async()=>{const b=await chromium.launch();
 async function open(o={}){const ctx=await b.newContext({viewport:{width:390,height:844}});const log={ck:0,bodies:[],pages:0,stripe:0};const errs=[];
  ctx.on('page',()=>log.pages++);
  await ctx.route('**/*',async r=>{const u=r.request().url();
   if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
   if(u.includes('/api/pro/checkout')){log.ck++;log.bodies.push(r.request().postData()||'');await new Promise(x=>setTimeout(x,o.delay||150));
     return o.fail?r.fulfill({status:502,body:'{"error":"checkout unavailable"}',contentType:'application/json'}):r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/pay/test123'}),contentType:'application/json'});}
   if(u.startsWith('https://checkout.stripe.com/')){log.stripe++;return r.fulfill({body:'<html><body>STRIPE CHECKOUT</body></html>',contentType:'text/html'});}
   if(u.includes('workers.dev'))return r.fulfill({body:'{}',contentType:'application/json'});
   if(u.startsWith('http://yfs.local/'))return r.fulfill({body:'',status:404});return r.abort();});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));let alerts=[];p.on('dialog',d=>{alerts.push(d.message());d.dismiss();});
  await p.goto('http://yfs.local/app.html'+(o.q||''));await p.waitForTimeout(500);return {ctx,p,log,errs,alerts};}
 // T1 Upgrade → same tab lands on Stripe, no new tab
 let {ctx,p,log,errs,alerts}=await open();
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:5000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();})]);
 ok(p.url().startsWith('https://checkout.stripe.com/c/pay/test123'),'T1 same tab goes to Stripe checkout');
 ok(log.pages===1,'T1 no new tab/window opened');ok(log.ck===1&&log.stripe===1,'T1 one checkout session');ok(errs.length===0&&alerts.length===0,'T1 no errors/alerts');await ctx.close();
 // T2 double tap while the server answers → only one checkout session
 ({ctx,p,log}=await open({delay:600}));
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:5000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();yfsOpenCheckout();yfsOpenCheckout();})]);
 ok(log.ck===1,'T2 triple tap → one checkout call');await ctx.close();
 // T3 server down → honest alert, button usable again
 ({ctx,p,log,alerts}=await open({fail:true}));
 await p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(400);
 ok(alerts.length===1&&/not been charged/.test(alerts[0])&&p.url().startsWith('http://yfs.local/'),'T3 failure → "not charged" alert, stays on app');
 await p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(400);ok(log.ck===2,'T3 can try again right away');await ctx.close();
 // T4 src tag still rides along to checkout
 ({ctx,p,log}=await open({q:'?src=tiktok-ad'}));
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:5000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();})]);
 ok(JSON.parse(log.bodies[0]||'{}').src==='tiktok-ad','T4 checkout carries src=tiktok-ad');await ctx.close();
 // T5 back button from Stripe → app usable, can tap Upgrade again
 ({ctx,p,log}=await open());
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:5000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();})]);
 await p.goBack();await p.waitForTimeout(500);
 await Promise.all([p.waitForURL('https://checkout.stripe.com/**',{timeout:5000}).catch(()=>{}),p.evaluate(()=>{yfsOpenCheckout();})]);
 ok(log.ck===2&&p.url().startsWith('https://checkout.stripe.com/'),'T5 back from Stripe → Upgrade works again');await ctx.close();
 // T6 server hangs → gives up after 20s with the honest "not charged" message, button usable again
 ({ctx,p,log,alerts}=await open({delay:26000}));
 const t0=Date.now();await p.evaluate(()=>{yfsOpenCheckout();});await p.waitForEvent('dialog',{timeout:30000}).catch(()=>{});await p.waitForTimeout(300);
 ok(alerts.length===1&&/not been charged/.test(alerts[0])&&Date.now()-t0<24000&&p.url().startsWith('http://yfs.local/'),'T6 hung checkout → stops at ~20s, "not charged", stays on app');
 ok(await p.evaluate(()=>!document.getElementById('yfsCoOpen')&&!yfsCoBusy),'T6 spinner cleared, can tap again');await ctx.close();
 // T7 certification buttons have spoken labels
 ({ctx,p}=await open());await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(400);
 const lab=await p.evaluate(()=>[...document.querySelectorAll('.rb-cert-chip')].map(e=>e.getAttribute('aria-label')));
 ok(lab.length>0&&lab.every(x=>/^Add .+ to certifications$/.test(x||'')),'T7 every certification chip has a label ('+lab.length+')');await ctx.close();
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
