const { chromium } = require('playwright');const fs=require('fs');
const RAW=fs.readFileSync('raw_resume.txt','utf8');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 let calls=[];
 await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync('../p5/app.html'),contentType:'text/html'});
  if(u.endsWith('workers.dev')||u.endsWith('workers.dev/')){calls.push(r.request().postData());return r.fulfill({body:JSON.stringify({content:[{text:'Dear Hiring Manager,\n\nI ran final grade on subdivisions.\n\nJeffery'}]}),contentType:'application/json'});}
  return r.fulfill({body:'{}',contentType:'application/json'});});
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(500);
 await p.evaluate(()=>yfsOpenTool(3));await p.waitForTimeout(200);
 const st=async(l)=>console.log(l,JSON.stringify(await p.evaluate(()=>({btn:document.getElementById('runBtn').className,hint:document.getElementById('yfsGateHint')?.textContent||''}))));
 await st('empty:');
 await p.fill('#userInput','Heavy Equipment Operator at Lee County. Run dozer and grader. CDL a plus.');await st('JD only:');
 // simulate upload in progress
 await p.evaluate(()=>{window.yfsBusy=true;updateRunBtn();});await st('busy:');
 await p.evaluate(()=>runTool());console.log('calls while busy',calls.length);
 // real txt upload through the file input
 fs.writeFileSync('/tmp/resume.txt',RAW);
 await p.evaluate(()=>{window.yfsBusy=false;});
 const fi=await p.$('#fileInput');await fi.setInputFiles('/tmp/resume.txt');await p.waitForTimeout(400);
 await st('after upload:');console.log('JD kept:',(await p.inputValue('#userInput')).slice(0,30));
 await p.evaluate(()=>runTool());await p.waitForTimeout(1200);
 console.log('calls',calls.length);const body=JSON.parse(calls[0]||'{}');const c=body.messages?.[0]?.content||'';
 const ji=c.indexOf('Job info:'),bg=c.indexOf('Applicant background:');
 console.log('JobInfo has JD:',c.slice(ji,ji+80).includes('Lee County'),'| bg has resume:',c.slice(bg,bg+120).includes('JEFFERY'),'| jobinfo has resume?',c.slice(ji,bg).includes('JEFFERY'));
 console.log('tease:',await p.evaluate(()=>!!document.getElementById('yfsTease')));
 // translator regression: upload-only should be ready
 await p.evaluate(()=>{clearFile&&clearFile();yfsOpenTool(0);});await p.waitForTimeout(200);
 const fi0=await p.$('#fileInput');await fi0.setInputFiles('/tmp/resume.txt');await p.waitForTimeout(400);await st('translator upload:');
 await b.close();})();
