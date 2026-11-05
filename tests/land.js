const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const w of [390,1280]){const ctx=await b.newContext({viewport:{width:w,height:844}});const p=await ctx.newPage();
 p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('dialog',d=>{console.log('DIALOG',d.message());d.dismiss();});
 let ck=0;await ctx.route('**/*',r=>{const u=r.request().url();if(u==='http://yfs.local/')return r.fulfill({body:fs.readFileSync('/home/claude/landing/index.html'),contentType:'text/html'});
  if(u.includes('/api/pro/checkout')){ck++;return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/test'}),contentType:'application/json'});}
  if(u.includes('checkout.stripe.com'))return r.fulfill({body:'STRIPE',contentType:'text/html'});
  if(u.includes('fonts.g'))return r.abort();return r.fulfill({body:'',contentType:'text/plain'});});
 await p.goto('http://yfs.local/');await p.waitForTimeout(400);
 await p.screenshot({path:`o/land_${w}_top.png`});await p.screenshot({path:`o/land_${w}_full.png`,fullPage:true});
 if(w===390){const links=await p.$$eval('a',as=>as.map(a=>a.getAttribute('href')));console.log([...new Set(links)].join('\n'));
  const small=await p.$$eval('a,button',els=>els.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44&&!e.closest('p')}).map(e=>e.textContent.trim().slice(0,30)+':'+Math.round(e.getBoundingClientRect().height)));console.log('small taps:',small);
  await p.click('text=Get Pro — $9/month');await p.waitForTimeout(500);console.log('checkout calls',ck,'url',p.url());}
 await ctx.close();}
await b.close();})();
