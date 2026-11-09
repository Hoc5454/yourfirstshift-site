// free-summary: Free resume previews show name/contact + Professional Summary sharp; Experience-down stays inside the blur.
// Worker is mocked. Usage: node free_summary_t.js [app.html] [screenshot.png] [baseline-app.html]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const SHOT=process.argv[3]||'';const BASE=process.argv[4]?fs.readFileSync(process.argv[4],'utf8'):null;
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const XRAY="## AI MATCH ESTIMATE: 71/100 (vs this job posting)\n## VERDICT: Strong base.\n\n## ✅ KEYWORD HITS (2 found)\n- RF scanning\n- Forklift\n\n## 📝 REWRITTEN EXPERIENCE SECTION\n### Regional Driver | Southeast Freight Lines | 2021–Present\n- Planned regional routes and appointment windows\n";
const RB="# MARCUS JOHNSON\nCDL-A Driver / Warehouse Associate\nJacksonville, FL · (904) 555-0142 · marcus.johnson@email.com\n\n## PROFESSIONAL SUMMARY\nRegional CDL-A driver with 3 years of zero preventable accidents and 3 years of warehouse work.\n\n## EXPERIENCE\n### Regional Driver | Southeast Freight Lines | 2021 – Present\n- Drive 53' dry van on regional routes\n\n## SKILLS\nCDL Class A · Forklift\n\n## EDUCATION & TRAINING\nHigh School Diploma — Ribault High School, 2017\n";
const JD='Logistics Coordinator. Schedule freight, work with drivers, RF scanning, forklift a plus.';
const FIX_HEAD="Dana Cole\nOrlando, FL · (555) 010-0177 · dana.cole@example.com\n\nProfessional Summary\nFriendly cashier who opens and closes the store.\n\nExperience\nCashier — Sunshine Market, Orlando FL (2023–Present)\n- Ran register for 200+ customers a day\n\nSkills & Certifications\nCash handling · Food Handler card\n\nEducation\nHigh School Diploma — Lakeview High, 2023\n";
const FIX_LEAD="Dana Cole\nOrlando, FL · (555) 010-0177 · dana.cole@example.com\nDependable retail cashier with two years of front-end experience, trusted to open and close the store on my own.\n\nExperience\nCashier — Sunshine Market, Orlando FL (2023–Present)\n- Ran register for 200+ customers a day\n\nCertifications\nFood Handler card\n";
async function page(b,html,{pro=false}={}){const ctx=await b.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await ctx.route('**/*',async r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:html,contentType:'text/html'});
  if(u===API||u===API+'/'){const body=r.request().postData()||'';const t=/Build My Resume|RESUME BUILDER|resume builder/i.test(body)&&!/AI MATCH/.test(body)?RB:XRAY;return r.fulfill({body:JSON.stringify({content:[{type:'text',text:ctx.__out||t}]}),contentType:'application/json'});}
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
 await ctx.addInitScript(p=>{if(p)localStorage.setItem('yfs_pro','1');},pro);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1500);return {ctx,p,errs};}
async function xray(p,resume){await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);
 if(resume==null)await p.evaluate(()=>yfsTryExample());else await p.evaluate(([jd,v])=>{document.getElementById('xrayJd').value=jd;document.getElementById('xrayResume').value=v;try{xrayCheck();}catch(_){}try{updateRunBtn();}catch(_){}},[JD,resume]);
 await p.evaluate(()=>runTool());await p.waitForTimeout(2500);}
const tease=p=>p.evaluate(()=>{const t=document.getElementById('yfsTease');const pg=t&&t.querySelector('.rb-page');if(!pg)return null;
  const out=(sel)=>{const e=pg.querySelector(sel);return e?{txt:e.innerText.replace(/\s+/g,' ').slice(0,300),inBlur:!!e.closest('.ym-blur'),inLock:!!e.closest('.ym-lock')}:null;};
  const heads=[...pg.querySelectorAll('.ym-blur .rb-h')].map(x=>x.innerText.trim().toUpperCase());
  return {name:out('.rb-name'),contact:out('.rb-contact'),sum:out('.ym-sum'),heads,html:t.outerHTML};});
(async()=>{const b=await chromium.launch();
 // T1 Marcus Johnson X-Ray sample, free
 {const {ctx,p,errs}=await page(b,APP);await xray(p,null);const r=await tease(p);
  ok(r&&r.name&&!r.name.inBlur&&/Marcus Johnson/.test(r.name.txt),'T1a name outside the blur');
  ok(r&&r.contact&&!r.contact.inBlur&&/555-0142/.test(r.contact.txt),'T1b contact outside the blur');
  ok(r&&r.sum&&!r.sum.inBlur&&!r.sum.inLock&&/zero preventable accidents/.test(r.sum.txt),'T1c Professional Summary outside the blur ['+(r&&r.sum?r.sum.txt.slice(0,60):'none')+']');
  ok(r&&r.heads[0]==='EXPERIENCE','T1d Experience is the first section inside the blur '+JSON.stringify(r&&r.heads));
  ok(r&&r.heads.includes('SKILLS & CERTS'),'T1e "Skills & Certs" is its own section (not folded into Experience) '+JSON.stringify(r&&r.heads));
  ok(!errs.length,'T1f no page errors '+errs.join('|'));
  if(SHOT){const y=await p.evaluate(()=>document.getElementById('yfsTease').getBoundingClientRect().top+scrollY);await p.evaluate(y=>scrollTo(0,y-60),y);await p.waitForTimeout(300);await p.screenshot({path:SHOT});}
  ctx.__html=r&&r.html;await ctx.close();
  if(BASE){const c2=await page(b,BASE);await xray(c2.p,null);const r0=await tease(c2.p);await c2.ctx.close();
   const S=['Southeast Freight','pallet jack','Ribault','Amazon Fulfillment','Planned regional routes'];const now=S.filter(x=>r.html.includes(x)),before=S.filter(x=>r0.html.includes(x));
   ok(JSON.stringify(now)===JSON.stringify(before),'T1g Experience text in the free page is unchanged vs production (no new exposure) now='+JSON.stringify(now)+' before='+JSON.stringify(before));}}
 // T2 fixture with a real "Professional Summary" heading
 {const {ctx,p}=await page(b,APP);await xray(p,FIX_HEAD);const r=await tease(p);
  ok(r&&r.sum&&!r.sum.inLock&&/opens and closes/.test(r.sum.txt),'T2a Summary heading → .ym-sum outside .ym-lock');
  ok(r&&r.heads.includes('SKILLS & CERTIFICATIONS')&&r.heads[0]==='EXPERIENCE','T2b "Skills & Certifications" is its own section '+JSON.stringify(r&&r.heads));await ctx.close();}
 // T3 fixture with a >90-char lead paragraph and no heading
 {const {ctx,p}=await page(b,APP);await xray(p,FIX_LEAD);const r=await tease(p);
  ok(r&&r.sum&&!r.sum.inLock&&/front-end experience/.test(r.sum.txt),'T3a long lead paragraph → .ym-sum outside .ym-lock');
  ok(r&&r.heads.includes('CERTIFICATIONS'),'T3b "Certifications" is its own section '+JSON.stringify(r&&r.heads));await ctx.close();}
 // T4 Resume Builder, free
 {const {ctx,p,errs}=await page(b,APP);ctx.__out=RB;await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(400);await p.evaluate(()=>yfsTryExample());await p.waitForTimeout(300);
  await p.evaluate(()=>runTool());await p.waitForTimeout(3000);
  const r=await p.evaluate(()=>{const pg=document.getElementById('rbPage');if(!pg)return null;const s=pg.querySelector('[data-f=summary]'),e=pg.querySelector('[data-f=experience]');
    return {sum:s?{inBlur:!!s.closest('.ym-blur'),txt:s.innerText.slice(0,60)}:null,exp:e?{inBlur:!!e.closest('.ym-blur')}:null};});
  ok(r&&r.sum&&!r.sum.inBlur,'T4a Builder: [data-f=summary] outside .ym-blur ['+(r&&r.sum?r.sum.txt:'none')+']');
  ok(r&&r.exp&&r.exp.inBlur,'T4b Builder: [data-f=experience] inside .ym-blur');ok(!errs.length,'T4c no page errors '+errs.join('|'));await ctx.close();}
 // T5 Pro X-Ray: full clear page (unchanged)
 {const {ctx,p}=await page(b,APP,{pro:true});await xray(p,null);const r=await tease(p);
  ok(r&&r.heads.length===0&&r.sum&&!r.sum.inLock,'T5 Pro X-Ray: nothing blurred, summary shown');await ctx.close();}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
