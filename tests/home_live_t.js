// home-live: live-editor copy on hero, plan cards and How step; prices/checkout unchanged. Shots: hero + pricing at 412px.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const HTML=fs.readFileSync(path.resolve(process.argv[2]||'../index.html'),'utf8');const SH=process.argv[3]||'';const API='https://yourfirstshift.culpepperhunter.workers.dev';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await ctx.route('**/*',r=>{const u=r.request().url();if(u==='http://yfs.local/')return r.fulfill({body:HTML,contentType:'text/html'});
  if(u===API+'/api/pro/plans')return r.fulfill({body:JSON.stringify({plans:{pro:true,pack:true,pro_year:true},pack_days:30}),contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'}});
  if(u.includes('fonts.g'))return r.fulfill({body:'',contentType:'text/css'});return r.abort();});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://yfs.local/');await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>{const live=document.querySelector('.hero .live');const cards={};document.querySelectorAll('#pricing .plan').forEach(c=>{const n=c.querySelector('.plan-name').innerText.trim();cards[n]={live:[...c.querySelectorAll('li')].some(l=>/^Live editor: change anything, see it update instantly$/.test(l.innerText.trim())),price:(c.querySelector('.price b')||{}).innerText};});
  return {live:live&&live.innerText,cards,ow:document.documentElement.scrollWidth};});
 ok(r.live&&/Pro:\s*Edit your finished resume live, right on your phone, and see every change instantly\./.test(r.live),'hero live-editor line');
 ok(r.cards['Pro']&&r.cards['Pro'].live&&r.cards['Pro'].price==='$9','Pro card has bullet, $9');
 ok(r.cards['Pro — yearly']&&r.cards['Pro — yearly'].live&&r.cards['Pro — yearly'].price==='$59','Yearly card has bullet, $59');
 ok(r.cards['Job Hunt Pack']&&r.cards['Job Hunt Pack'].live&&r.cards['Job Hunt Pack'].price==='$29','Pack card has bullet, $29');
 ok(!Object.entries(r.cards).some(([k,v])=>/free/i.test(k)&&v.live),'Free card has no live-editor bullet');
 ok(r.ow<=412,'no sideways scroll ('+r.ow+')');ok(!errs.length,'no page errors '+errs.join('|'));
 if(SH){await p.screenshot({path:SH+'-hero.png'});const y=await p.evaluate(()=>document.getElementById('pricing').getBoundingClientRect().top+scrollY);await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(300);await p.screenshot({path:SH+'-pricing.png'});
  await p.evaluate(()=>scrollBy(0,800));await p.waitForTimeout(300);await p.screenshot({path:SH+'-pricing2.png'});}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
