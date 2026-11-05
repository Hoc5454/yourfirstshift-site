const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2];
(async()=>{const b=await chromium.launch();
 for(const pro of [false,true]){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});if(u.includes('fonts.g'))return r.abort();return r.fulfill({body:'{}',contentType:'application/json'});});
  if(pro)await p.addInitScript(()=>{localStorage.setItem('yfs_pro','1');});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(500);
  const md=fs.readFileSync('sample2.md','utf8').replace('FILLER','');
  const st=await p.evaluate(([md,pro])=>{yfsOpenTool(pro?0:1);try{showResult(md,!pro);}catch(e){return 'ERR '+e.message}const o=document.getElementById('outputSection');return getComputedStyle(o).display+' '+o.offsetHeight;},[md,pro]);
  console.log(pro,st);
  const y=await p.evaluate(()=>document.getElementById('outputSection').getBoundingClientRect().top+scrollY);
  await p.evaluate(y=>window.scrollTo(0,y-70),y);await p.waitForTimeout(200);
  await p.screenshot({path:`o/L_res_${pro?'pro':'free'}.png`});
  await p.evaluate(y=>window.scrollTo(0,y+700),y);await p.waitForTimeout(200);
  await p.screenshot({path:`o/L_res2_${pro?'pro':'free'}.png`});
  await ctx.close();}
 await b.close();})();
