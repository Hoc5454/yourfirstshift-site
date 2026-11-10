const { chromium } = require('playwright');const fs=require('fs');
const LETTER=`# Cover Letter — Jordan Hayes\n\n---\n\nJordan Hayes\nSampleton, FL\n\n---\n\nRoad and drainage work doesn't forgive sloppy grading — and after years cutting final grade on subdivisions, I know what it costs when the grade is off.\n\nAt Gulfview Site Works I supervise crews and operators.\n\nJordan`;
(async()=>{const b=await chromium.launch();
 for(const pro of [false,true]){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
 let calls=0,ck=0;await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(process.argv[2]||'../app.html'),contentType:'text/html'});
  if(u.includes('/api/pro/checkout')){ck++;return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/test'}),contentType:'application/json'});}
  if(u.endsWith('workers.dev')||u.endsWith('workers.dev/')){calls++;return r.fulfill({body:JSON.stringify({content:[{text:LETTER}]}),contentType:'application/json'});}return r.fulfill({body:'{}',contentType:'application/json'});});
 ctx.on('page',np=>np.close().catch(()=>{}));
 if(pro)await p.addInitScript(()=>localStorage.setItem('yfs_pro','1'));
 await p.addInitScript(r=>localStorage.setItem('yfs_resume',r),fs.readFileSync('raw_resume.txt','utf8'));
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(400);
 await p.evaluate(()=>yfsOpenTool(3));await p.fill('#userInput','Heavy Equipment Operator — Demo County.');await p.evaluate(()=>updateRunBtn());
 await p.evaluate(()=>runTool());await p.waitForTimeout(1200);
 const st=async l=>console.log(pro?'PRO':'FREE',l,JSON.stringify(await p.evaluate(()=>{const b=document.getElementById('runBtn');return {cls:b.className,txt:b.textContent,dis:b.disabled};})));
 await st('after run');
 await p.fill('#userInput','typing more');await st('after typing');
 await p.click('#runBtn');await p.waitForTimeout(600);console.log('  checkout calls',ck,'AI calls',calls);
 await ctx.close();}
 await b.close();})();
