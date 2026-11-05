const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../p1/app.html';
(async()=>{const b=await chromium.launch();
 async function page(pro,w){const ctx=await b.newContext({viewport:{width:w||390,height:844},deviceScaleFactor:1});const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::/.test(m.text()))console.log('CONSOLE',m.text())});
  p.on('dialog',d=>{console.log('DIALOG',d.message());d.dismiss();});
  await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});if(u.includes('fonts.g'))return r.abort();return r.fulfill({body:'{}',contentType:'application/json'});});
  if(pro)await p.addInitScript(()=>{localStorage.setItem('yfs_pro','1');});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(700);return p;}
 let p=await page(false);
 await p.screenshot({path:'o/p1_home.png'});
 console.log('pill:',await p.textContent('#usagePill'));
 await p.click('text=Fix my resume for a job');await p.waitForTimeout(300);
 console.log('hash:',await p.evaluate(()=>location.hash),'title:',await p.textContent('#toolTitle'));
 await p.screenshot({path:'o/p1_tool.png'});
 await p.goBack();await p.waitForTimeout(300);console.log('after back home?',await p.evaluate(()=>document.body.classList.contains('yfs-home')));
 await p.click('#ybnPlans');await p.waitForTimeout(300);await p.screenshot({path:'o/p1_plans.png'});
 console.log('cta:',await p.textContent('#ypCta'),'|',await p.textContent('#ypFine'));
 await p.click('.yp-card[data-id="pack"]',{force:true});console.log('cta after pack tap:',await p.textContent('#ypCta'));
 await p.keyboard.press('Escape');await p.click('#ybnAcct');await p.waitForTimeout(200);await p.screenshot({path:'o/p1_acct.png'});
 await p.keyboard.press('Escape');await p.click('#ybnRes');await p.waitForTimeout(300);await p.screenshot({path:'o/p1_vault.png'});
 console.log('vault open:',await p.evaluate(()=>getComputedStyle(document.getElementById('vaultModal')).display));
 await p.evaluate(()=>closeVault());
 for(const [t,i] of [['Build my resume',5],['Write a cover letter',3],['Practice my interview',4],['Resume Translator',0],['Outreach message',2]]){await p.evaluate(()=>yfsGoHome());await p.click('text='+t);await p.waitForTimeout(150);console.log(t,'->',await p.evaluate(()=>activeTool),await p.textContent('#toolTitle'));}
 await p.screenshot({path:'o/p1_build.png'});
 const pp=await page(true);console.log('pro pill:',await pp.textContent('#usagePill'));await pp.click('#ybnAcct');await pp.waitForTimeout(200);await pp.screenshot({path:'o/p1_acct_pro.png'});
 const pd=await page(false,1280);await pd.screenshot({path:'o/p1_desktop.png'});
 const ph=await page(false);await ph.goto('http://yfs.local/app.html#tool-3');await ph.waitForTimeout(500);console.log('deeplink:',await ph.textContent('#toolTitle'),await ph.evaluate(()=>document.body.className));
 await b.close();})();
