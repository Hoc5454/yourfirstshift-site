const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2];const tag=process.argv[3];
(async()=>{const b=await chromium.launch();
 async function page(pro){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('dialog',d=>d.dismiss());
  await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});if(u.includes('fonts.g'))return r.abort();return r.fulfill({body:'{}',contentType:'application/json'});});
  if(pro)await p.addInitScript(()=>{localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_vault',JSON.stringify([{id:'v1',name:'JORDANHAYESResume',text:'# Jordan Hayes\nSite Foreman\nSampleton, FL · 555-010-0199\n## EXPERIENCE\n### Site Foreman | Harbor Line | 2021 – Present\n- Led crews',look:'Modern Professional',ts:Date.now()}]));localStorage.setItem('yfs_vault_active','v1');});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(600);return p;}
 const shots=[];const snap=async(p,n,full)=>{await p.screenshot({path:`o/${tag}_${n}.png`,fullPage:!!full});shots.push(n);};
 let p=await page(false);
 for(const i of [0,1,2,3,4,5]){await p.evaluate(i=>yfsOpenTool(i),i);await p.waitForTimeout(250);await snap(p,'t'+i);}
 // free result w/ paywall: paint modern result
 const md=fs.readFileSync('sample2.md','utf8').replace('FILLER','');
 await p.evaluate(md=>{yfsOpenTool(1);showResult(md,true);},md);await p.waitForTimeout(400);
 await p.evaluate(()=>document.getElementById('outputSection').scrollIntoView());await snap(p,'freeres');
 p=await page(true);
 await p.evaluate(md=>{yfsOpenTool(0);showResult(md,false);},md);await p.waitForTimeout(400);
 await p.evaluate(()=>document.getElementById('outputSection').scrollIntoView());await snap(p,'prores');
 await p.evaluate(()=>{yfsOpenTool(5);});await p.waitForTimeout(400);await p.evaluate(()=>window.scrollTo(0,900));await snap(p,'builder');
 await p.evaluate(()=>openVault());await p.waitForTimeout(300);await snap(p,'vault');
 await p.evaluate(()=>{closeVault();yfsOpenRestore();});await p.waitForTimeout(300);await snap(p,'restore');
 await b.close();console.log(shots.join(' '));})();
