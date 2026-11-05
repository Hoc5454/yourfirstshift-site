const { chromium } = require('playwright');const fs=require('fs');
const LETTER=`# Cover Letter — Marcus Reed\n\n---\n\nMarcus Reed\nPort St. Lucie, FL · (772) 555-0188 · marcus.reed@example.com\n\nHiring Manager\nLee County Public Works\nFort Myers, FL\n\n---\n\nRoad and drainage work doesn't forgive sloppy grading — and after cutting pads to grade stakes on 40+ home sites, I know what it costs when the grade is off.\n\nFor the past five years at Treasure Coast Sitework, I've run excavator, dozer, and skid steer on residential and commercial site prep, and I keep daily equipment logs.\n\nLee County's road program is the work I want to be doing next, close to home.\n\nI'd welcome 15 minutes to talk.\n\nMarcus Reed`;
const OTHER=`Dear Hiring Manager,\n\nI ran final grade on three subdivisions last year with a motor grader and dozer, and kept every crew on schedule.\n\nAt Caloosa Site Development I supervise crews.\n\nThanks,\nJeffery`;
(async()=>{const b=await chromium.launch();
 for(const [nm,out] of [['marcus',LETTER],['plain',OTHER]]){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(process.argv[2]||'../app.html'),contentType:'text/html'});
   if(u.endsWith('workers.dev')||u.endsWith('workers.dev/'))return r.fulfill({body:JSON.stringify({content:[{text:out}]}),contentType:'application/json'});return r.fulfill({body:'{}',contentType:'application/json'});});
  await p.addInitScript(r=>{localStorage.setItem('yfs_resume',r);},fs.readFileSync('raw_resume.txt','utf8'));
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(400);
  await p.evaluate(()=>{yfsOpenTool(3);});await p.fill('#userInput','Heavy Equipment Operator — Lee County Public Works. Dozer, grader, grade stakes, CDL-B.');
  await p.evaluate(()=>runTool());await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>({free:document.getElementById('outputBox').innerText.trim(),rest:getComputedStyle(document.getElementById('lockedRest')).display,lockTitle:document.querySelector('#lockedRest .lr-over div')?.textContent,tease:!!document.getElementById('yfsTease')}));
  console.log('==',nm,JSON.stringify(r));
  const y=await p.evaluate(()=>document.getElementById('outputSection').getBoundingClientRect().top+scrollY);await p.evaluate(y=>scrollTo(0,y-70),y);await p.screenshot({path:`o/cl_${nm}.png`});await ctx.close();}
 // other tools unaffected: outreach split unchanged
 await b.close();})();
