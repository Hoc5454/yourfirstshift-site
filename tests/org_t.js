// org-codes test. Usage: node org_t.js <app.html> [shot.png]   (Worker mocked with a fake code table; nothing real is called)
const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../app.html',SHOT=process.argv[3]||'';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const DAY=864e5,NOW=Date.now();
const CODES={'YFS-TCTC-7KQ4':{org:'Tri-County Tech',limit:2,ends:Math.floor((NOW+30*DAY)/1000)},'YFS-OLD-1234':{org:'Old Program',limit:25,ends:Math.floor((NOW-DAY)/1000)},'YFS-SOON-77AA':{org:'Short Pilot',limit:5,get ends(){return Math.floor((Date.now()+60000)/1000);}}};
const seats={};let redeemCalls=0;
async function page(b,{init=null,url='http://yfs.local/app.html',redeemDown=false}={}){
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];const aiHdr=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
  await ctx.route('**/*',async r=>{const u=r.request().url();
    if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
    if(u.includes('fonts.g'))return r.abort();
    if(u.includes('/api/org/redeem')){redeemCalls++;if(redeemDown)return r.fulfill({status:404,body:'Not found',contentType:'text/plain'});
      const {code,device}=JSON.parse(r.request().postData()||'{}');const c=CODES[code];const j=(s,o)=>r.fulfill({status:s,body:JSON.stringify(o),contentType:'application/json'});
      if(!c)return j(404,{error:'invalid'});if(c.ends*1000<=Date.now())return j(410,{error:'expired',ends:c.ends});
      const s=seats[code]=seats[code]||new Set();if(!s.has(device)&&s.size>=c.limit)return j(409,{error:'full',seat_limit:c.limit});
      s.add(device);return j(200,{token:'orgtok_'+code+'_'+device.slice(0,6),org:c.org,ends:c.ends,seats_used:s.size,seat_limit:c.limit});}
    if(u.endsWith('workers.dev')||u.endsWith('workers.dev/')){aiHdr.push(r.request().headers()['x-yfs-pro']||'');return r.fulfill({body:JSON.stringify({content:[{text:'Dear Hiring Manager,\n\nTest.\n\nJ'}]}),contentType:'application/json'});}
    return r.fulfill({body:'{}',contentType:'application/json'});});
  await p.addInitScript(r=>localStorage.setItem('yfs_resume',r),fs.readFileSync('raw_resume.txt','utf8'));
  if(init)await p.addInitScript(init);
  await p.goto(url);await p.waitForTimeout(700);return {ctx,p,errs,aiHdr};}
const msg=p=>p.evaluate(()=>document.getElementById('yfsOrgMsg').textContent);
async function redeem(p,code){await p.evaluate(()=>yfsOpenOrg());await p.fill('#yfsOrgCode',code);await p.click('#yfsOrgGo');await p.waitForTimeout(400);return msg(p);}
(async()=>{const b=await chromium.launch();
 // T1 deep link + valid redeem
 {const {ctx,p,errs,aiHdr}=await page(b,{url:'http://yfs.local/app.html?org=yfs-tctc-7kq4'});
  ok(await p.isVisible('#yfsOrgModal'),'T1 ?org= deep link opens code box');
  ok(await p.inputValue('#yfsOrgCode')==='YFS-TCTC-7KQ4','T1 code prefilled + uppercased');
  ok(!(await p.evaluate(()=>location.search.includes('org='))),'T1 code removed from URL bar');
  ok(redeemCalls===0,'T1 no seat used until user taps Unlock');
  if(SHOT){await p.screenshot({path:SHOT.replace('.png','-entry.png')});}
  await p.click('#yfsOrgGo');await p.waitForTimeout(400);const m=await msg(p);
  ok(/Pro is on for this device through .*Tri-County Tech/.test(m),'T1 success message: '+m);
  if(SHOT)await p.screenshot({path:SHOT});
  ok(await p.evaluate(()=>isPro===true&&localStorage.getItem('yfs_pro')==='1'&&/^orgtok_/.test(localStorage.getItem('yfs_pro_token'))),'T1 Pro on, org token stored');
  await p.waitForTimeout(1900);ok(!(await p.isVisible('#yfsOrgModal')),'T1 box closes');
  ok(await p.evaluate(()=>document.getElementById('manageSubBtn').style.display==='none'),'T1 no Manage/Cancel (no Stripe sub)');
  await p.evaluate(()=>yfsOpenAccount());await p.waitForTimeout(150);
  const acct=await p.evaluate(()=>[document.getElementById('yaPlan').textContent,document.getElementById('yaPlanS').textContent,getComputedStyle(document.getElementById('yaManage')).display,getComputedStyle(document.getElementById('yaOrg')).display]);
  ok(acct[0]==='Pro — via Tri-County Tech'&&/runs through/.test(acct[1])&&acct[2]==='none'&&acct[3]==='none','T1 Account: '+acct.join(' | '));
  await p.evaluate(()=>yfsCloseSheets());
  await p.evaluate(()=>yfsOpenTool(3));await p.fill('#userInput','Operator job');await p.evaluate(()=>updateRunBtn());await p.evaluate(()=>runTool());await p.waitForTimeout(800);
  ok(aiHdr.length===1&&/^orgtok_/.test(aiHdr[0]),'T1 AI call carries org token (X-YFS-Pro) so Worker enforces');
  await p.reload();await p.waitForTimeout(600);ok(await p.evaluate(()=>isPro===true),'T1 still Pro after reload');
  const before=redeemCalls;const m2=await redeem(p,'YFS-TCTC-7KQ4');ok(/Pro is on/.test(m2)&&seats['YFS-TCTC-7KQ4'].size===1,'T1 same device re-entering code uses no new seat');
  ok(errs.length===0,'T1 no page errors '+errs.join('|'));await ctx.close();}
 // T2 second device takes seat 2; T3 third device -> full
 {const {ctx,p}=await page(b);ok(/Pro is on/.test(await redeem(p,' yfs tctc 7kq4 ')),'T2 2nd device redeems (spaces/lowercase normalized)');await ctx.close();}
 {const {ctx,p,errs}=await page(b);const m=await redeem(p,'YFS-TCTC-7KQ4');ok(/All 2 seats for that code are taken/.test(m),'T3 full: '+m);ok(await p.evaluate(()=>!isPro),'T3 stays Free');ok(errs.length===0,'T3 no page errors');await ctx.close();}
 // T4 invalid / expired / bad shape / Worker not ready / network
 {const {ctx,p,errs}=await page(b);
  ok(/isn’t valid/.test(await redeem(p,'YFS-NOPE-0000')),'T4 invalid code message');
  ok(/ended on/.test(await redeem(p,'YFS-OLD-1234')),'T4 expired code message');
  const n=redeemCalls;ok(/doesn’t look like a program code/.test(await redeem(p,'hello'))&&redeemCalls===n,'T4 bad shape rejected locally (no call)');
  ok(/Enter the code/.test(await redeem(p,'   ')),'T4 empty');
  ok(await p.evaluate(()=>!isPro),'T4 still Free');ok(errs.length===0,'T4 no page errors');await ctx.close();}
 {const {ctx,p}=await page(b,{redeemDown:true});ok(/Couldn’t check the code right now/.test(await redeem(p,'YFS-TCTC-7KQ4')),'T4b Worker route missing → honest "couldn’t check", not "invalid"');await ctx.close();}
 // T5 paid Stripe Pro user: no overwrite
 {const {ctx,p}=await page(b,{init:()=>{localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_pro_token','stripe_tok');}});const n=redeemCalls;
  ok(/already have Pro/.test(await redeem(p,'YFS-TCTC-7KQ4'))&&redeemCalls===n,'T5 paid Pro: no call, token kept');
  ok(await p.evaluate(()=>localStorage.getItem('yfs_pro_token')==='stripe_tok'),'T5 Stripe token untouched');
  ok(await p.evaluate(()=>document.getElementById('manageSubBtn').style.display==='inline-block'),'T5 paid Pro keeps Manage/Cancel');await ctx.close();}
 // T6 expiry at load
 {const {ctx,p,errs}=await page(b,{init:()=>{if(sessionStorage.getItem('x'))return;sessionStorage.setItem('x','1');localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_pro_token','orgtok_x');localStorage.setItem('yfs_org',JSON.stringify({org:'Tri-County Tech',ends:Date.now()-1000,tok:'orgtok_x'}));}});
  ok(await p.evaluate(()=>isPro===false&&!localStorage.getItem('yfs_pro')&&!localStorage.getItem('yfs_org')),'T6 past end date → back to Free at load');
  ok(await p.isVisible('#yfsOrgEnded'),'T6 plain "access ended" notice');
  if(SHOT)await p.screenshot({path:SHOT.replace('.png','-ended.png')});
  await p.click('#yfsOrgEnded button');await p.reload();await p.waitForTimeout(600);ok(!(await p.isVisible('#yfsOrgEnded')),'T6 notice shown once');
  ok(errs.length===0,'T6 no page errors');await ctx.close();}
 // T7 end date passes while app open
 {const {ctx,p}=await page(b);ok(/Pro is on/.test(await redeem(p,'YFS-SOON-77AA')),'T7 short code redeemed');await p.waitForTimeout(1900);
  await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('yfs_org'));o.ends=Date.now()-1;localStorage.setItem('yfs_org',JSON.stringify(o));document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>isPro===false)&&await p.isVisible('#yfsOrgEnded'),'T7 ends while open → Free + notice');await ctx.close();}
 // T8 later Stripe purchase replaces token → org record dropped, Pro kept
 {const {ctx,p}=await page(b,{init:()=>{localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_pro_token','stripe_tok');localStorage.setItem('yfs_org',JSON.stringify({org:'X',ends:Date.now()-1000,tok:'orgtok_old'}));}});
  ok(await p.evaluate(()=>isPro===true&&localStorage.getItem('yfs_pro_token')==='stripe_tok'&&!localStorage.getItem('yfs_org')),'T8 Stripe Pro never removed by old org record');await ctx.close();}
 // T9 entry points
 {const {ctx,p}=await page(b);await p.evaluate(()=>yfsOpenAccount());await p.waitForTimeout(150);ok(await p.isVisible('#yaOrg'),'T9 Account sheet has code button');
  await p.click('#yaOrg');ok(await p.isVisible('#yfsOrgModal'),'T9 opens code box');await p.evaluate(()=>yfsCloseOrg());
  await p.evaluate(()=>yfsOpenPlans());await p.waitForTimeout(150);ok(await p.isVisible('#ypOrgLink'),'T9 Plans sheet has code link');
  await p.evaluate(()=>{yfsCloseSheets();yfsOpenRestore();});ok(await p.isVisible('#yfsRmOrg'),'T9 Restore box has code link');await ctx.close();}
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
