const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();
 for(const tool of [3,0,1]){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync('../p8/app.html'),contentType:'text/html'});return r.fulfill({body:'{}',contentType:'application/json'});});
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(400);await p.evaluate(t=>yfsOpenTool(t),tool);await p.waitForTimeout(200);
 const st=async(l)=>console.log(tool,l,JSON.stringify(await p.evaluate(()=>({btn:document.getElementById('runBtn').className,hint:document.getElementById('yfsGateHint')?.textContent||''}))));
 await st('empty');
 const fi=await p.$('#fileInput');if(fi){await fi.setInputFiles('/tmp/resume.txt');await p.waitForTimeout(400);await st('upload');}
 if(tool===1){await p.fill('#xrayJd','Operator job posting with requirements and benefits full-time');await p.evaluate(()=>updateRunBtn());await st('+jd');}
 if(tool===3){await p.screenshot({path:'o/gate3.png'});}
 await ctx.close();}
 await b.close();})();
