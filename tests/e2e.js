const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2],tag=process.argv[3]||'E',PRO=process.argv[4]==='pro';
const RAW=fs.readFileSync('raw_resume.txt','utf8');
const OUT={
1:`## AI MATCH ESTIMATE: 64/100 (vs this job posting)\n## VERDICT: Solid fit, but your resume buries the grader and dozer work this job wants.\n\n## ✅ KEYWORD HITS (5 found)\n- Motor grader\n- Dozer\n\n## ❌ CRITICAL GAPS (3 missing)\n- Grade stakes\n- GPS grade control\n\n## 🔧 TOP 5 FIXES — do these before applying\n1. Put "motor grader" in your summary\n2. Add reading grade stakes\n\n## 📝 REWRITTEN EXPERIENCE SECTION\n### Site Foreman | Gulfview Site Works | 06/2024 – Present\n- Run day-to-day site development and final grading on active job sites\n- Supervise and train labor crews and equipment operators\n### Operator | Harbor Line Builders | 2021 – 2024\n- Ran motor grader, dozer, and excavator to final grade on subdivisions\n\n## 📊 HIRING PROBABILITY\nGood with fixes.`,
2:`## 📱 TEXT/IMESSAGE\nHi Mike — Jordan here, site foreman out of Sampleton. Saw you're hiring operators.\n\n## 💼 LINKEDIN MESSAGE\nHi Mike, I run crews and final grade on subdivisions...\n\n## 📧 EMAIL\nSubject: Operator role\nHi Mike...\n\n## 💡 FOLLOW-UP STRATEGY\nWait 3 days.`,
3:`Dear Hiring Manager,\n\nI ran final grade on three subdivisions last year with a motor grader and dozer, and kept every crew on schedule.\n\nAt Gulfview Site Works I supervise labor crews and operators...\n\nI'd welcome a call.\n\nJordan Hayes`,
4:`## 🎯 THE 3 THINGS THEY'RE REALLY EVALUATING\n1. Safety\n2. Grade accuracy\n\n## THE 8 QUESTIONS YOU WILL ALMOST CERTAINLY BE ASKED\n**Q1: Tell me about your grader experience.**\nAnswer...\n\n## ⚡ THE 2 CURVEBALLS — questions they might not expect\n...\n\n## 🔄 5 QUESTIONS TO ASK THEM\n...`};
(async()=>{const b=await chromium.launch();
 for(const tool of [1,2,3,4]){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('dialog',d=>d.dismiss());
  await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});if(u.includes('fonts.g'))return r.abort();
   if(u==='https://yourfirstshift.culpepperhunter.workers.dev/'||u.endsWith('workers.dev'))return r.fulfill({body:JSON.stringify({content:[{text:OUT[tool]}]}),contentType:'application/json'});
   return r.fulfill({body:'{}',contentType:'application/json'});});
  await p.addInitScript(([raw,pro])=>{localStorage.setItem('yfs_vault',JSON.stringify([{id:'v1',name:'JORDANHAYESResume',text:raw,look:'Bold Trades',ts:Date.now()}]));localStorage.setItem('yfs_vault_active','v1');localStorage.setItem('yfs_resume',raw);localStorage.setItem('yfs_tl_style','Bold Trades');if(pro)localStorage.setItem('yfs_pro','1');},[RAW,PRO]);
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(500);
  await p.evaluate(t=>yfsOpenTool(t),tool);await p.waitForTimeout(200);
  if(tool===1){await p.fill('#xrayJd','Heavy Equipment Operator — Demo County. Must run dozer and motor grader, read grade stakes, CDL a plus. Full-time, benefits.');}
  else{await p.fill('#userInput','Reaching out to Mike at Demo County Public Works about an operator role.');}
  await p.evaluate(()=>{try{updateRunBtn()}catch(_){}});
  await p.evaluate(()=>runTool());await p.waitForTimeout(1500);
  const info=await p.evaluate(()=>{const t=document.getElementById('yfsTease');return {tease:!!t,lock:!!(t&&t.querySelector('.ym-lock')),rest:getComputedStyle(document.getElementById('lockedRest')).display,name:t?t.querySelector('.rb-name')?.textContent:'',target:t?t.querySelector('.rb-target')?.textContent:'',contact:t?t.querySelector('.rb-contact')?.textContent:'',exp:t?(t.querySelector('.ym-blur')?'blurred':(t.innerText.match(/Experience[\s\S]{0,140}/i)||[''])[0].replace(/\n/g,' | ')):''};});
  console.log('tool',tool,JSON.stringify(info));
  const y=await p.evaluate(()=>document.getElementById('outputSection').getBoundingClientRect().top+scrollY);
  await p.evaluate(y=>window.scrollTo(0,y-70),y);await p.waitForTimeout(150);await p.screenshot({path:`o/${tag}${tool}a.png`});
  const ty=await p.evaluate(()=>{const t=document.getElementById('yfsTease');return t?t.getBoundingClientRect().top+scrollY:0;});
  if(ty){await p.evaluate(y=>window.scrollTo(0,y-70),ty);await p.waitForTimeout(150);await p.screenshot({path:`o/${tag}${tool}b.png`});
   await p.evaluate(y=>window.scrollTo(0,y+620),ty);await p.waitForTimeout(150);await p.screenshot({path:`o/${tag}${tool}c.png`});}
  await ctx.close();}
 await b.close();})();
