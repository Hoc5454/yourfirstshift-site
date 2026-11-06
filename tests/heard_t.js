// heard-about-us test. Usage: node heard_t.js <app.html> [shot.png]   (Worker mocked; nothing real is called)
const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../app.html',SHOT=process.argv[3]||'';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
async function run(b,{verify='ok',init=null,url='http://yfs.local/app.html?session_id=cs_test_abc#tool-1'}={}){
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];const log={metrics:[],bodies:[]};
  p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
  await ctx.route('**/*',async r=>{const u=r.request().url();
    if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
    if(u.includes('fonts.g'))return r.abort();
    if(u.includes('/api/pro/verify')){if(verify==='ok')return r.fulfill({body:JSON.stringify({token:'tok_test'}),contentType:'application/json'});
      return r.fulfill({status:400,body:JSON.stringify({error:'bad'}),contentType:'application/json'});}
    if(u.includes('/api/metrics/')){log.metrics.push(u.split('/api/metrics/')[1]);log.bodies.push(r.request().postData()||'');log.ct=(r.request().headers()['content-type']||'');return r.fulfill({body:'{}',contentType:'application/json'});}
    return r.fulfill({body:'{}',contentType:'application/json'});});
  if(init)await p.addInitScript(init);
  await p.goto(url);await p.waitForTimeout(900);
  return {ctx,p,errs,log};}
(async()=>{const b=await chromium.launch();
 // T1 paid return -> card, type + send
 {const {ctx,p,errs,log}=await run(b);
  ok(await p.isVisible('#yfsThankYou'),'T1 thank-you card shows after verified paid return');
  ok(await p.evaluate(()=>localStorage.getItem('yfs_pro')==='1'&&isPro===true),'T1 Pro is active (not blocked by card)');
  ok(!(await p.evaluate(()=>location.search.includes('session_id'))),'T1 session_id stripped from URL');
  ok(await p.isDisabled('#yfsTySend'),'T1 Send disabled while empty');
  ok(await p.evaluate(()=>{const r=document.getElementById('runBtn');if(!r)return true;const e=document.elementFromPoint(20,120);return !!e&&!e.closest('#yfsThankYou');}),'T1 page above card is still tappable (no overlay)');
  if(SHOT){await p.fill('#yfsTyIn','TikTok');await p.screenshot({path:SHOT});await p.fill('#yfsTyIn','');}
  await p.fill('#yfsTyIn','  my <b>school</b>\n counselor   ');await p.click('#yfsTySend');await p.waitForTimeout(300);
  const i=log.metrics.indexOf('heard_about');ok(i>=0,'T1 POST /api/metrics/heard_about sent');
  let body={};try{body=JSON.parse(log.bodies[i]);}catch(_){}
  ok(body.answer==='my b school /b counselor','T1 answer cleaned/trimmed: '+JSON.stringify(body.answer));
  ok(log.ct.startsWith('text/plain'),'T1 simple request (text/plain, no CORS preflight)');
  ok(await p.evaluate(()=>localStorage.getItem('yfs_heard_done')==='1'&&JSON.parse(localStorage.getItem('yfs_heard')).a.length>0),'T1 answer saved on device; asked-once flag set');
  await p.waitForTimeout(1800);ok(!(await p.isVisible('#yfsThankYou')),'T1 card closes after thanks');
  await p.reload();await p.waitForTimeout(700);ok(!(await p.isVisible('#yfsThankYou')),'T1 no card on plain reload');
  ok(errs.length===0,'T1 no page errors '+errs.join('|'));await ctx.close();}
 // T2 skip
 {const {ctx,p,errs,log}=await run(b);await p.click('#yfsTySkip');await p.waitForTimeout(200);
  ok(!(await p.isVisible('#yfsThankYou')),'T2 Skip closes card');ok(log.metrics.includes('heard_skip')&&!log.metrics.includes('heard_about'),'T2 skip counted, no answer sent');
  ok(await p.evaluate(()=>isPro===true),'T2 still Pro after skip');
  await p.evaluate(()=>yfsOpenTool(3));await p.waitForTimeout(200);ok(await p.evaluate(()=>/Run/.test(document.getElementById('runBtn').textContent)),'T2 Pro tools usable');
  ok(errs.length===0,'T2 no page errors '+errs.join('|'));await ctx.close();}
 // T3 X closes = skip
 {const {ctx,p,errs,log}=await run(b);await p.click('.yfs-ty-x');await p.waitForTimeout(200);
  ok(!(await p.isVisible('#yfsThankYou'))&&log.metrics.includes('heard_skip'),'T3 ✕ closes (counts as skip)');ok(errs.length===0,'T3 no page errors');await ctx.close();}
 // T4 verify fails -> no card, no Pro
 {const {ctx,p,errs}=await run(b,{verify:'fail'});ok(!(await p.isVisible('#yfsThankYou')),'T4 failed verify: no card');
  ok(await p.evaluate(()=>!isPro),'T4 failed verify: still Free');ok(errs.length===0,'T4 no page errors');await ctx.close();}
 // T5 normal load, no session_id
 {const {ctx,p,errs,log}=await run(b,{url:'http://yfs.local/app.html'});ok(!(await p.isVisible('#yfsThankYou')),'T5 normal load: no card');
  ok(!log.metrics.some(m=>m.startsWith('heard')),'T5 no heard metrics');ok(errs.length===0,'T5 no page errors');await ctx.close();}
 // T6 already answered on this device -> thanks card without question
 {const {ctx,p,errs}=await run(b,{init:()=>localStorage.setItem('yfs_heard_done','1')});
  ok(await p.isVisible('#yfsThankYou')&&!(await p.isVisible('#yfsTyIn')),'T6 repeat purchase: thank-you only, no question');
  await p.click('#yfsTyOk');ok(!(await p.isVisible('#yfsThankYou')),'T6 OK closes');ok(errs.length===0,'T6 no page errors');await ctx.close();}
 // T7 src carried in body when present
 {const {ctx,p,log}=await run(b,{init:()=>localStorage.setItem('yfs_src',JSON.stringify({s:'tiktok',t:Date.now()}))});
  await p.fill('#yfsTyIn','tiktok video');await p.click('#yfsTySend');await p.waitForTimeout(200);
  let body={};try{body=JSON.parse(log.bodies[log.metrics.indexOf('heard_about')]);}catch(_){}ok(body.src==='tiktok','T7 src attached when present');await ctx.close();}
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
