// vault-sync: one ACTIVE resume feeds every tool (upload/paste/switch, free + Pro, across an upgrade); Word/Text/PDF = the page on screen.
// Worker mocked. Usage: node vault_sync_t.js [app.html] [shotDir] [iphone|android|desktop]
const {chromium,devices}=require('playwright');const fs=require('fs');const path=require('path');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const SHOTS=process.argv[3]||'';const DEV=process.argv[4]||'iphone';
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'['+DEV+'] '+m);if(!c)fails++;};
const F=require('./pro_handoff_fixtures.js');
const DEVS={iphone:{...devices['iPhone 13'],viewport:{width:412,height:915}},android:devices['Pixel 7'],desktop:{viewport:{width:1366,height:900}}};
const SAM=`Sam Ortiz
Delivery Driver
Orlando, FL · (407) 555-0101 · sam.ortiz@example.com

Summary
Route delivery driver with 3 years of on-time residential and business stops across Orange County.

Experience
Delivery Driver | Fast Couriers, Orlando FL | 2021 – Present
- Delivered 80 packages a day on a 120-stop route
- Kept a clean MVR and passed every DOT check

Skills
Class C license, route planning, handheld scanner

Education
High School Diploma — Edgewater High, 2018
`;
const TR=`# Jordan Reyes
Warehouse Associate
Tampa, FL · (813) 555-0199 · jordan.reyes@example.com

## PROFESSIONAL SUMMARY
Warehouse associate with 4 years of picking, packing and loading trucks.

## EXPERIENCE
### Warehouse Associate | Gulf Coast Grocers, Tampa FL | 2022 – Present
- Picked and packed orders with an RF scanner
- Drove sit-down forklift to move pallets

### Stock Clerk | Bayside Hardware, Brandon FL | 2020 – 2022
- Unloaded trucks and stocked shelves

## SKILLS
Forklift certified, RF scanner, pallet jack

## EDUCATION
High School Diploma — Plant High School, 2019
`;
function tok(c){return Buffer.from(JSON.stringify(c)).toString('base64').replace(/=+$/,'')+'.sig';}
async function ctx(b,opt={}){const c=await b.newContext({...DEVS[DEV],deviceScaleFactor:2,acceptDownloads:true});const log={ai:[]};
 await c.route('**/*',async r=>{const u=r.request().url(),m=r.request().method();
  if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:APP,contentType:'text/html'});
  if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({contentType:'text/html',body:F.STRIPE});
  if(u===API+'/api/pro/checkout')return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/pay/cs_test_1'}),contentType:'application/json'});
  if(u===API+'/api/pro/verify')return r.fulfill({body:JSON.stringify({token:tok({sub:'cus_t',exp:Math.floor(Date.now()/1000)+35*86400})}),contentType:'application/json'});
  if((u===API||u===API+'/')&&m==='POST'){const p=(JSON.parse(r.request().postData()).messages||[{}])[0].content||'';log.ai.push(p);
   const t=/Upgrade this person/.test(p)?F.UPG:/analyzing a job application/.test(p)?F.XRAY:/cover letter/i.test(p)?F.CL:/interview prep/i.test(p)?F.IV:/outreach/i.test(p)?'## Message 1\nHi.\n\n## Message 2\nHello.\n\n## Follow-up\nThanks.':TR;
   return r.fulfill({body:JSON.stringify({content:[{type:'text',text:t}]}),contentType:'application/json'});}
  if(/html2pdf|jspdf/.test(u)){const f=/html2pdf/.test(u)?'node_modules/html2pdf.js/dist/html2pdf.bundle.min.js':'node_modules/jspdf/dist/jspdf.umd.min.js';if(fs.existsSync(f))return r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'});}
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
 await c.addInitScript(o=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');if(o.pro)localStorage.setItem('yfs_pro','1');if(o.used)localStorage.setItem('yfs_usage','1');
  if(o.vault){localStorage.setItem('yfs_vault',JSON.stringify(o.vault.list));localStorage.setItem('yfs_vault_active',o.vault.active);localStorage.setItem('yfs_resume',o.vault.list.find(x=>x.id===o.vault.active).text);}},opt);
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1200);return {c,p,errs,log};}
const shot=async(p,n)=>{if(SHOTS)await p.screenshot({path:path.join(SHOTS,'vs-'+DEV+'-'+n+'.png')});};
const using=p=>p.evaluate(()=>(document.getElementById('yfsUsing')||{}).innerText||'');
const active=p=>p.evaluate(()=>{const a=yfsVaultActive();const e=yfsVaultList().find(x=>x.id===a);return e?{name:e.name,first:e.text.trim().split('\n')[0].replace(/^#\s*/,'')}:null;});
async function run(p,t,input){await p.evaluate(t=>yfsOpenTool(t),t);await p.waitForTimeout(300);if(input!=null){await p.evaluate(v=>{const u=document.getElementById('userInput');u.value=v;u.dispatchEvent(new Event('input',{bubbles:true}));},input);}await p.evaluate(()=>runTool());await p.waitForTimeout(2200);}
const words=s=>String(s||'').replace(/[•·|–—\-]/g,' ').replace(/[^\w@.()'&,]+/g,' ').replace(/[,.]+(\s|$)/g,' ').trim().toLowerCase().split(/\s+/).filter(Boolean);
(async()=>{const b=await chromium.launch();
 // A. FREE: upload a resume in X-Ray (no run) → ACTIVE → every tool has it; then upgrade → Pro lands on it
 {const {c,p,errs,log}=await ctx(b);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);
  const tmp='/tmp/Sam-Ortiz-Resume.txt';fs.writeFileSync(tmp,SAM);await p.setInputFiles('#fileInput',tmp);await p.waitForTimeout(1200);
  const a=await active(p);ok(a&&a.first==='Sam Ortiz'&&/Sam-Ortiz-Resume|Sam Ortiz Resume/.test(a.name),'A1 free upload → saved to Vault as ACTIVE ('+JSON.stringify(a)+')');
  ok(/Using: .*Sam/.test(await using(p)),'A2 X-Ray shows Using: <uploaded resume>');await shot(p,'1-upload-active');
  for(const t of [0,2,3,4,5]){await p.evaluate(t=>yfsOpenTool(t),t);await p.waitForTimeout(350);const u=await using(p);
   const extra=await p.evaluate(t=>t===0?(document.getElementById('userInput')||{}).value:t===5?(document.querySelector('#rbPage [data-f=name]')||{}).innerText:'',t);
   ok(/Using: .*Sam/.test(u)&&(t!==0||/Sam Ortiz/.test(extra))&&(t!==5||extra==='Sam Ortiz'),'A3 tool '+t+' loads the uploaded resume'+(t===0?' (prefilled)':t===5?' (Builder page)':''));}
  await p.evaluate(()=>yfsOpenTool(3));await p.waitForTimeout(300);await shot(p,'2-cover-letter-using');
  // the free run (Cover Letter) uses it
  await run(p,3,'Delivery Driver at Speedy Freight');ok(log.ai.length&&/Sam Ortiz/.test(log.ai.slice(-1)[0]),'A4 free Cover Letter run used the uploaded resume');
  // upgrade (no X-Ray handoff for this tool) → Pro lands on the ACTIVE resume
  await p.goto('http://yfs.local/app.html?checkout=success&session_id=cs_test_1');await p.waitForSelector('#yfsProBanner .pb-h',{timeout:15000});await p.waitForFunction(()=>!document.querySelector('#yfsProBanner .pb-busy'),null,{timeout:20000});
  const r=await p.evaluate(()=>({n:(document.querySelector('#rbPage [data-f=name]')||{}).innerText,u:(document.getElementById('yfsUsing')||{}).innerText}));
  ok(r.n==='Sam Ortiz'&&/Using:/.test(r.u),'A5 after upgrade: Pro editor opens the same uploaded resume ('+r.n+')');
  for(const t of [1,2,3,4]){await p.evaluate(t=>yfsOpenTool(t),t);await p.waitForTimeout(300);ok(/Using: .*(Sam|· Pro)/.test(await using(p)),'A6 Pro tool '+t+' uses it right after upgrade');}
  ok(!errs.length,'A no page errors '+errs.join('|'));await c.close();}
 // B. FREE: paste into Translator + run → ACTIVE
 {const {c,p,errs}=await ctx(b);await run(p,0,SAM);const a=await active(p);ok(a&&a.first==='Sam Ortiz','B1 resume pasted in Translator → ACTIVE after the run');
  await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(400);ok(await p.evaluate(()=>(document.querySelector('#rbPage [data-f=name]')||{}).innerText)==='Sam Ortiz'&&/Using: .*Sam/.test(await using(p)),'B2 Builder (free form) opens it');ok(!errs.length,'B no page errors');await c.close();}
 // C. PRO: switch resumes in the Vault → every tool updates at once (incl. a stale upload in Cover Letter)
 {const vault={active:'vJ',list:[{id:'vJ',name:'JordanReyesResume',text:F.RESUME,ts:1},{id:'vS',name:'SamOrtizResume',text:SAM,ts:2}]};
  const {c,p,errs,log}=await ctx(b,{pro:true,used:true,vault});
  // stale upload on Cover Letter: upload Jordan again as a file, then switch to Sam
  await p.evaluate(()=>yfsOpenTool(3));await p.waitForTimeout(300);
  await p.evaluate(()=>{openVault();});await p.waitForTimeout(300);await shot(p,'3-vault');await p.evaluate(()=>yfsVaultUse('vS',true));await p.waitForTimeout(400);
  ok(/Using: SamOrtizResume/.test(await using(p)),'C1 switch in Vault → the open tool shows the new resume immediately');await shot(p,'4-switched');
  await run(p,3,'Driver at Speedy');ok(/Sam Ortiz/.test(log.ai.slice(-1)[0])&&!/Jordan Reyes/.test(log.ai.slice(-1)[0]),'C2 Cover Letter run uses the switched resume');
  await run(p,4,'Interview for driver');ok(/Sam Ortiz/.test(log.ai.slice(-1)[0]),'C3 Interview Prep uses it');
  await run(p,2,'Reach the hiring manager at Speedy');ok(/Sam Ortiz/.test(log.ai.slice(-1)[0]),'C4 Outreach uses it');
  await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);ok(/Sam Ortiz/.test(await p.inputValue('#xrayResume')),'C5 X-Ray resume box holds it');
  await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(300);ok(/Sam Ortiz/.test(await p.inputValue('#userInput')),'C6 Translator holds it');
  await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(300);ok(await p.evaluate(()=>(document.querySelector('#rbPage [data-f=name]')||{}).innerText)==='Sam Ortiz','C7 Builder shows it');
  // switch back while ON the builder and while on translator
  await p.evaluate(()=>yfsVaultUse('vJ',true));await p.waitForTimeout(300);ok(await p.evaluate(()=>(document.querySelector('#rbPage [data-f=name]')||{}).innerText)==='Jordan Reyes','C8 switch while on Builder → page swaps at once');
  await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsVaultUse('vS',true));await p.waitForTimeout(200);ok(/Sam Ortiz/.test(await p.inputValue('#userInput')),'C9 switch while on Translator → box swaps at once');
  // stale upload: upload a different file on Cover Letter, then switch → upload dropped
  await p.evaluate(()=>yfsOpenTool(3));await p.waitForTimeout(300);await p.evaluate(()=>{document.querySelectorAll('.yfs-up-hidden').forEach(x=>x.classList.remove('yfs-up-hidden'));});
  fs.writeFileSync('/tmp/Jordan.txt',F.RESUME);await p.setInputFiles('#fileInput','/tmp/Jordan.txt');await p.waitForTimeout(1000);
  ok((await active(p)).first==='Jordan Reyes','C10 uploading on Cover Letter makes it ACTIVE (reuses the saved copy, no duplicate)');
  ok(await p.evaluate(()=>yfsVaultList().length)===2,'C11 no duplicate Vault entry');
  await p.evaluate(()=>yfsVaultUse('vS',true));await p.waitForTimeout(300);ok(await p.evaluate(()=>!extractedFileText),'C12 switching drops the stale upload in that tool');
  await run(p,3,'Driver at Speedy');ok(/Sam Ortiz/.test(log.ai.slice(-1)[0]),'C13 next run uses the switched resume, not the old upload');
  ok(!errs.length,'C no page errors '+errs.join('|'));await c.close();}
 // D. downloads = the page on screen (Translator modern page + Builder), including tap-to-edit changes
 {const vault={active:'vJ',list:[{id:'vJ',name:'JordanReyesResume',text:F.RESUME,ts:1}]};const {c,p,errs}=await ctx(b,{pro:true,used:true,vault});
  await run(p,0,null);await p.waitForSelector('#outputBox .rb-page');
  // edit a bullet + the summary on the page
  await p.evaluate(()=>{const pg=document.querySelector('#outputBox .rb-page');const li=pg.querySelector('li');li.textContent='Ran daily cycle counts with an RF scanner (edited on page)';const s=pg.querySelector('.ym-sum p');s.textContent='Edited summary line typed on the phone.';document.getElementById('outputBox').dispatchEvent(new InputEvent('input',{bubbles:true}));});
  const T=await p.evaluate(()=>{const m=yfsResumeModel();const xml=yfsResumeDocxXml(m,selectedStyle);const docx=(xml.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).map(x=>x.replace(/<[^>]+>/g,'')).join(' ').replace(/&amp;/g,'&');
    const pg=document.querySelector('#outputBox .rb-page');const clone=yfsStyledClone();const tx=n=>n.innerHTML.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ');let pdf=clone?tx(clone):'';return {pageH:tx(pg),page:pg.innerText,txt:yfsResumeTxt(m),docx,pdf,heads:[...pg.querySelectorAll('.rb-h')].map(h=>h.innerText.trim().toUpperCase()),mheads:m.secs.map(s=>s[0].toUpperCase())};});
  ok(/edited on page/.test(T.txt)&&/edited on page/.test(T.docx)&&/Edited summary line/.test(T.txt)&&/Edited summary line/.test(T.docx),'D1 Translator: page edits are in Word + Text');
  ok(JSON.stringify(T.heads)===JSON.stringify(T.mheads),'D2 Word/Text sections in the same order as the page '+JSON.stringify(T.mheads));
  const pw=words(T.page).join(' '),tw=words(T.txt).join(' '),dw=words(T.docx).join(' ');ok(tw===pw,'D3 Text download = page word-for-word');ok(dw===pw,'D4 Word download = page word-for-word');
  if(tw!==pw)console.log('  page:',pw.slice(0,300),'\n  txt :',tw.slice(0,300));if(dw!==pw)console.log('  docx:',dw.slice(0,300));
  ok(/edited on page/.test(T.pdf)&&words(T.pdf).join(' ')===words(T.pageH).join(' '),'D5 PDF clone = page word-for-word');if(words(T.pdf).join(' ')!==pw)console.log('  pdf :',words(T.pdf).join(' ').slice(0,400),'\n  page:',pw.slice(0,400));
  // every look: Word keeps the same words
  for(const look of ['Modern Professional','Clean Minimal','Bold Trades','Creative Tech','Traditional Classic']){const d=await p.evaluate(l=>{yfsSetTpl(l);const m=yfsResumeModel();const xml=yfsResumeDocxXml(m,l);return (xml.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).map(x=>x.replace(/<[^>]+>/g,'')).join(' ').replace(/&amp;/g,'&');},look);
   ok(words(d).join(' ').toLowerCase()===pw,'D6 Word ('+look+') = page words');}
  await shot(p,'5-translator-page');
  // Builder
  await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(400);
  await p.evaluate(()=>{const e=document.querySelector('#rbPage [data-f=skills]');e.focus();e.textContent='Forklift certified, RF scanner, pallet jack, edited skill';e.dispatchEvent(new InputEvent('input',{bubbles:true}));e.blur();});await p.waitForTimeout(300);
  const B=await p.evaluate(()=>{const m=yfsResumeModel();const xml=yfsResumeDocxXml(m,selectedStyle);const docx=(xml.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).map(x=>x.replace(/<[^>]+>/g,'')).join(' ').replace(/&amp;/g,'&');
    const pg=document.getElementById('rbPage');const cp=pg.cloneNode(true);cp.querySelectorAll('.rb-ph,.rb-foot,.rb-wm').forEach(x=>x.remove());document.body.appendChild(cp);const pt=cp.innerText;cp.remove();return {page:pt,txt:yfsResumeTxt(m),docx};});
  ok(/edited skill/.test(B.txt)&&/edited skill/.test(B.docx),'D7 Builder: page edits are in Word + Text');
  const bp=words(B.page).join(' ');ok(words(B.txt).join(' ')===bp,'D8 Builder Text = page word-for-word');ok(words(B.docx).join(' ')===bp,'D9 Builder Word = page word-for-word');
  if(words(B.txt).join(' ')!==bp)console.log('  bpage:',bp.slice(0,400),'\n  btxt :',words(B.txt).join(' ').slice(0,400));
  ok(!errs.length,'D no page errors '+errs.join('|'));await c.close();}

 // E. a saved result only comes back for the resume it was made from (the "Gavin" X-Ray bug)
 {const vault={active:'vJ',list:[{id:'vJ',name:'JordanReyesResume',text:F.RESUME,ts:1},{id:'vS',name:'SamOrtizResume',text:SAM,ts:2}]};const {c,p,errs,log}=await ctx(b,{pro:true,used:true,vault});
  await p.evaluate(()=>{localStorage.setItem('yfs_last_output','## AI MATCH ESTIMATE: 42/100 (vs this job posting)\n## VERDICT: Gavin has the hands-on muscle Blue Origin wants.\n\n## ✅ KEYWORD HITS\n- Forklift\n');localStorage.setItem('yfs_last_tool','1');localStorage.setItem('yfs_res',JSON.stringify({'1':{text:localStorage.getItem('yfs_last_output'),src:'Gavin Price\nLaunch Pad Technician\nMelbourne, FL\n\nExperience\nMechanic | Space Coast Fab | 2020 – Present\n- Fabricated and welded steel',free:false,ts:Date.now()}}));});
  await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(500);
  let r=await p.evaluate(()=>({out:getComputedStyle(document.getElementById('outputSection')).display,txt:document.getElementById('outputBox').innerText,note:(document.getElementById('yfsStaleNote')||{}).innerText||''}));
  ok(r.out==='none'&&!/Gavin/.test(r.txt)&&/different resume/.test(r.note),'E1 X-Ray does NOT re-show another person\'s old result under your resume');await shot(p,'6-stale-note');
  await p.click('#yfsStaleNote [data-a=old]');await p.waitForTimeout(300);ok(/Gavin/i.test(await p.evaluate(()=>document.getElementById('outputBox').innerText)),'E2 "view the old one" still shows it on request (nothing deleted)');
  await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(300);ok(/different resume/.test(await p.evaluate(()=>(document.querySelector('.yfs-last-chip')||{}).innerText||'')),'E3 other tools label the old result as a different resume');
  await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);await p.fill('#xrayJd','Inventory Control Specialist at Sunrise Logistics. Cycle counts, RF scanning, forklift.');await p.evaluate(()=>{try{xrayCheck();}catch(_){}updateRunBtn();runTool();});await p.waitForTimeout(2500);
  await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(500);
  r=await p.evaluate(()=>({out:getComputedStyle(document.getElementById('outputSection')).display,note:!!document.getElementById('yfsStaleNote')}));ok(r.out!=='none'&&!r.note,'E4 your own new X-Ray result comes back when you return');
  await p.evaluate(()=>yfsVaultUse('vS',true));await p.waitForTimeout(400);
  r=await p.evaluate(()=>({out:getComputedStyle(document.getElementById('outputSection')).display,note:(document.getElementById('yfsStaleNote')||{}).innerText||''}));ok(r.out==='none'&&/SamOrtizResume/.test(r.note),'E5 switching resumes hides the result made for the other resume');
  ok(!errs.length,'E no page errors '+errs.join('|'));await c.close();}

 // F. Liz FAIL items: no name matching, ids/hash only
 {const RES1='RESUME\nDana Cole\nWarehouse Lead\nOrlando, FL · (555) 010-0177 · dana@example.com\n\nSummary\nWarehouse lead with five years running pick lines, receiving docks and cycle counts for a grocery distribution center.\n\nExperience\nWarehouse Lead | Sunshine Foods DC | 2021 – Present\n- Ran a 12-person pick line\n- Trained new hires on RF scanners and pallet jacks\n\nSkills\nForklift, RF scanner, inventory\n';
  const SAMB='Sam Baker\nDelivery Driver\nTampa, FL · (813) 555-0144 · sam.baker@example.com\n\nSummary\nDelivery driver with four years of route work and clean safety record for a regional parcel company in Tampa.\n\nExperience\nDelivery Driver | Bay Parcel | 2022 – Present\n- Ran 110 stops a day on time\n- Loaded and secured the van every morning\n\nSkills\nClass C license, route planning\n';
  const GAVIN='Gavin Price\nLaunch Pad Technician\nMelbourne, FL\n\nExperience\nMechanic | Space Coast Fab | 2020 – Present\n- Fabricated and welded steel';
  const XG='## AI MATCH ESTIMATE: 42/100 (vs this job posting)\n## VERDICT: Gavin has the hands-on muscle Blue Origin wants for this resume; a delivery driver background would not help.\n\n## ✅ KEYWORD HITS\n- Forklift\n';
  const vis=p=>p.evaluate(()=>({out:getComputedStyle(document.getElementById('outputSection')).display,txt:document.getElementById('outputBox').innerText,note:!!document.getElementById('yfsStaleNote')}));
  const seedRes=(rec)=>p=>p.evaluate(r=>{localStorage.setItem('yfs_res',JSON.stringify({'1':r}));localStorage.setItem('yfs_last_output',r.text);localStorage.setItem('yfs_last_tool','1');},rec);
  // F1 first line "RESUME" (old fallback would have matched on "resume")
  {const {c,p,errs}=await ctx(b,{pro:true,used:true,vault:{active:'vD',list:[{id:'vD',name:'Dana',text:RES1,ts:1}]}});await seedRes({text:XG,src:GAVIN,free:false,ts:1})(p);
   await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(500);const r=await vis(p);
   ok(r.out==='none'&&!/Gavin/i.test(r.txt)&&r.note,'F1 resume whose first line is "RESUME" → Gavin\'s old result stays hidden');ok(!errs.length,'F1 no errors');await c.close();}
  // F2 two resumes share a first name (Sam Ortiz result, Sam Baker active)
  {const {c,p}=await ctx(b,{pro:true,used:true,vault:{active:'vB',list:[{id:'vO',name:'SamOrtiz',text:SAM,ts:1},{id:'vB',name:'SamBaker',text:SAMB,ts:2}]}});
   await seedRes({text:'## AI MATCH ESTIMATE: 70/100\n## VERDICT: Sam is a strong driver.\n\n## ✅ KEYWORD HITS\n- Route',src:SAM,vid:'vO',free:false,ts:1})(p);
   await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(500);let r=await vis(p);
   ok(r.out==='none'&&r.note,'F2 shared first name (Sam Ortiz vs Sam Baker) → not shown as yours');
   await p.evaluate(()=>yfsVaultUse('vO',true));await p.waitForTimeout(400);await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(500);r=await vis(p);
   ok(r.out!=='none'&&!r.note&&/Sam is a strong driver/i.test(r.txt),'F3 switch to the resume that made it (Vault id) → it comes back');await c.close();}
  // F4 old result with no src → treated as a different resume
  {const {c,p}=await ctx(b,{pro:true,used:true,vault:{active:'vJ',list:[{id:'vJ',name:'JordanReyesResume',text:F.RESUME,ts:1}]}});await seedRes({text:'## AI MATCH ESTIMATE: 55/100\n## VERDICT: Jordan fits.\n\n## ✅ KEYWORD HITS\n- RF',src:'',free:false,ts:1})(p);
   await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(500);const r=await vis(p);
   ok(r.out==='none'&&r.note,'F4 old result with no source resume → yellow note, not shown (even if it names you)');
   await p.click('#yfsStaleNote [data-a=old]');await p.waitForTimeout(300);ok(/Jordan fits/i.test(await p.evaluate(()=>document.getElementById('outputBox').innerText)),'F5 "view the old one" still opens it (not deleted)');
   ok(await p.evaluate(()=>yfsVaultList().length)===1,'F6 re-showing a saved result does not adopt/add a Vault resume');await c.close();}
  // F7 no ACTIVE Vault resume → no auto-show
  {const {c,p}=await ctx(b,{pro:true,used:true});await seedRes({text:XG,src:GAVIN,free:false,ts:1})(p);await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(500);const r=await vis(p);
   ok(r.out==='none'&&r.note,'F7 no ACTIVE Vault resume → old result not auto-shown; note instead');await c.close();}
  // F8 upload a new resume while the old person's result is ON SCREEN → hidden at once (no tab redraw)
  {const {c,p,log}=await ctx(b,{pro:true,used:true,vault:{active:'vG',list:[{id:'vG',name:'Gavin',text:GAVIN+'\n- Rigged and set GSE\n- Read hydraulic schematics\n\nSkills\nWelding, rigging, hydraulics, forklift, OSHA 30 and more hands-on work for launch site equipment',ts:1}]}});
   await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);await p.fill('#xrayJd','Blue Origin Launch Pad Technician. GSE, hydraulics, rigging.');await p.evaluate(()=>{try{xrayCheck();}catch(_){}updateRunBtn();runTool();});await p.waitForTimeout(2500);
   let r=await vis(p);ok(r.out!=='none','F8a Gavin\'s own X-Ray result shows for Gavin');
   const rid=await p.evaluate(()=>JSON.parse(localStorage.getItem('yfs_res'))['1'].vid);ok(rid==='vG','F8b new results are saved with the Vault resume id ('+rid+')');
   await p.evaluate(()=>{document.querySelectorAll('.yfs-up-hidden').forEach(x=>x.classList.remove('yfs-up-hidden'));});fs.writeFileSync('/tmp/Dana.txt',RES1);await p.setInputFiles('#fileInput','/tmp/Dana.txt');await p.waitForTimeout(900);
   r=await vis(p);ok(r.out==='none'&&r.note&&!/Gavin/i.test(r.txt),'F8c upload Dana while Gavin\'s result is on screen → hidden right away, note shown');await shot(p,'7-upload-hides-old');await c.close();}
  // F9 a matching saved result re-shown by restore does NOT run "adopt pasted resume"
  {const {c,p}=await ctx(b,{pro:true,used:true,vault:{active:'vJ',list:[{id:'vJ',name:'JordanReyesResume',text:F.RESUME,ts:1}]}});
   await seedRes({text:'## AI MATCH ESTIMATE: 64/100\n## VERDICT: Close.\n\n## ✅ KEYWORD HITS\n- RF',src:SAMB,vid:'vJ',free:false,ts:1})(p);
   await p.evaluate(()=>{window.__adopts=0;const o=window.yfsAdoptResume;window.yfsAdoptResume=function(){window.__adopts++;return o.apply(this,arguments);};});
   await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(200);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(600);
   const r=await p.evaluate(()=>({n:window.__adopts,len:yfsVaultList().length,act:yfsVaultActive(),out:getComputedStyle(document.getElementById('outputSection')).display}));
   ok(r.n===0&&r.len===1&&r.act==='vJ'&&r.out!=='none','F9 restoring a saved result never adopts a resume ('+JSON.stringify(r)+')');await c.close();}
 }

 // G. Liz preview checklist items not covered above
 {const GAV='Gavin Price\nLaunch Pad Technician\nMelbourne, FL · (321) 555-0100 · gavin@example.com\n\nSummary\nMechanic and fabricator with six years of welding, rigging and hydraulic work on heavy equipment along the Space Coast.\n\nExperience\nMechanic | Space Coast Fab | 2020 – Present\n- Fabricated and welded structural steel\n- Rigged and set heavy equipment\n\nSkills\nWelding, rigging, hydraulics\n';
  const DD='Delivery Driver\nSam Ortiz\nOrlando, FL · (407) 555-0101 · sam.ortiz@example.com\n\nSummary\nRoute delivery driver with 3 years of on-time residential and business stops across Orange County and the delivery side of the business.\n\nExperience\nDelivery Driver | Fast Couriers, Orlando FL | 2021 – Present\n- Delivered 80 packages a day\n\nSkills\nClass C license\n';
  const {c,p,errs,log}=await ctx(b,{pro:true,used:true,vault:{active:'vG',list:[{id:'vG',name:'Gavin',text:GAV,ts:1},{id:'vD',name:'DeliveryDriver',text:DD,ts:2}]}});
  await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);await p.fill('#xrayJd','Blue Origin Launch Pad Technician. GSE, hydraulics, rigging, welding.');await p.evaluate(()=>{try{xrayCheck();}catch(_){}updateRunBtn();runTool();});await p.waitForTimeout(2500);
  await p.evaluate(()=>{const r=JSON.parse(localStorage.getItem('yfs_res'));r['1'].text=r['1'].text.replace('VERDICT:','VERDICT: Gavin is a delivery-ready resume —');localStorage.setItem('yfs_res',JSON.stringify(r));});
  await p.evaluate(()=>yfsVaultUse('vD',true));await p.waitForTimeout(400);
  let r=await p.evaluate(()=>({out:getComputedStyle(document.getElementById('outputSection')).display,txt:document.getElementById('outputBox').innerText,note:!!document.getElementById('yfsStaleNote')}));
  ok(r.out==='none'&&r.note&&!/Gavin/i.test(r.txt),'G1 first line "Delivery Driver" (old write-up says "delivery" + "resume") → Gavin stays hidden');
  await p.evaluate(()=>yfsVaultUse('vG',true));await p.waitForTimeout(400);
  r=await p.evaluate(()=>({out:getComputedStyle(document.getElementById('outputSection')).display,note:!!document.getElementById('yfsStaleNote')}));ok(r.out!=='none'&&!r.note,'G2 switch back to Gavin → his result is back, no note');
  ok(!errs.length,'G no page errors '+errs.join('|'));await c.close();}
 {const {c,p}=await ctx(b);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);fs.writeFileSync('/tmp/Sam-Ortiz-Resume.txt',SAM);
  await p.setInputFiles('#fileInput','/tmp/Sam-Ortiz-Resume.txt');await p.waitForTimeout(900);
  await p.evaluate(()=>{document.querySelectorAll('.yfs-up-hidden').forEach(x=>x.classList.remove('yfs-up-hidden'));try{clearFile();}catch(_){}});await p.setInputFiles('#fileInput','/tmp/Sam-Ortiz-Resume.txt');await p.waitForTimeout(900);
  ok(await p.evaluate(()=>yfsVaultList().length)===1,'G3 uploading the same file twice → still one Vault entry');
  await c.close();}
 {const vault={active:'vJ',list:[{id:'vJ',name:'JordanReyesResume',text:F.RESUME,ts:1}]};const {c,p}=await ctx(b,{pro:true,used:true,vault});
  await run(p,0,SAM);await run(p,0,SAM);const n=await p.evaluate(()=>({len:yfsVaultList().length,act:yfsVaultList().find(x=>x.id===yfsVaultActive()).text.split('\n')[0]}));
  ok(n.len===2&&n.act==='Sam Ortiz','G4 paste a different resume in Translator and run (twice) → ACTIVE, no duplicate ('+JSON.stringify(n)+')');await c.close();}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
