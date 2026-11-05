const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});const p=await ctx.newPage();
 await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync('../src/app.html'),contentType:'text/html'});if(u.includes('fonts.g'))return r.abort();return r.fulfill({body:'{}',contentType:'application/json'});});
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1000);
 await p.screenshot({path:'o/s_free_top.png'});
 await p.screenshot({path:'o/s_free_full.png',fullPage:true});
 const h=await p.evaluate(()=>document.body.scrollHeight);console.log('height',h);
 const tabs=await p.evaluate(()=>[...document.querySelectorAll('.tab')].map(t=>t.textContent.trim()));console.log(tabs);
 await b.close();})();
