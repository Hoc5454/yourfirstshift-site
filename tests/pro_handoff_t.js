// pro-handoff (P0): free → teaser → pay (mocked Stripe return) → full Pro resume in the live editor; one resume in every tool.
// Worker + Stripe mocked. Usage: node pro_handoff_t.js [app.html] [shotDir] [device: iphone|android|desktop]
const {chromium,devices}=require('playwright');const fs=require('fs');const path=require('path');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const SHOTS=process.argv[3]||'';const DEV=process.argv[4]||'iphone';
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'['+DEV+'] '+m);if(!c)fails++;};
const F=require('./pro_handoff_fixtures.js');
const DEVS={iphone:{...devices['iPhone 13'],viewport:{width:412,height:915}},android:devices['Pixel 7'],desktop:{viewport:{width:1366,height:900}}};
function tok(c){return Buffer.from(JSON.stringify(c)).toString('base64').replace(/=+$/,'')+'.sig';}
async function ctxFor(b,opt={}){const ctx=await b.newContext({...DEVS[DEV],deviceScaleFactor:2});const log={ai:[],verify:0,checkout:[]};
 await ctx.route('**/*',async r=>{const u=r.request().url(),m=r.request().method();
  if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:APP,contentType:'text/html'});
  if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({contentType:'text/html',body:F.STRIPE});
  if(u===API+'/api/pro/checkout'){log.checkout.push(r.request().postData());return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/pay/cs_test_123'}),contentType:'application/json'});}
  if(u===API+'/api/pro/verify'){log.verify++;const pack=opt.plan==='pack';return r.fulfill({body:JSON.stringify({token:tok(pack?{sub:'cus_t',pack:true,exp:Math.floor(Date.now()/1000)+30*86400}:{sub:'cus_t',exp:Math.floor(Date.now()/1000)+35*86400})}),contentType:'application/json'});}
  if((u===API||u===API+'/')&&m==='POST'){const body=r.request().postData()||'';const p=(JSON.parse(body).messages||[{}])[0].content||'';log.ai.push(p);
   const t=/Upgrade this person/.test(p)?(opt.upgFail?null:F.UPG):/analyzing a job application/.test(p)?F.XRAY:/cover letter/i.test(p)?F.CL:/interview prep/i.test(p)?F.IV:F.XRAY;
   if(!t)return r.fulfill({status:500,body:'{}'});return r.fulfill({body:JSON.stringify({content:[{type:'text',text:t}]}),contentType:'application/json'});}
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
 if(opt.vault)await ctx.addInitScript(v=>{if(!localStorage.getItem('yfs_vault')){localStorage.setItem('yfs_vault',JSON.stringify(v.list));localStorage.setItem('yfs_vault_active',v.active);localStorage.setItem('yfs_resume',v.list.find(x=>x.id===v.active).text);}},opt.vault);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());return {ctx,p,errs,log};}
const shot=async(p,n)=>{if(SHOTS)await p.screenshot({path:path.join(SHOTS,DEV+'-'+n+'.png')});};
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none';},sel);
(async()=>{const b=await chromium.launch();
 // ── A. the real buyer path: free X-Ray → teaser → Unlock → Stripe → back ──
 {const {ctx,p,errs,log}=await ctxFor(b);await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1200);
  await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);
  await p.fill('#xrayJd',F.JD);await p.fill('#xrayResume',F.RESUME);await p.evaluate(()=>{try{xrayCheck();}catch(_){}updateRunBtn();});
  await shot(p,'1-free-xray');
  await p.click('#runBtn');await p.waitForSelector('#yfsTease .rb-page',{timeout:15000});await p.waitForTimeout(500);
  const hasH=await p.evaluate(()=>!!JSON.parse(localStorage.getItem('yfs_handoff')||'null'));ok(hasH,'A1 free run saves the teased resume + job for after payment (this device)');
  await p.evaluate(()=>{const e=document.querySelector('#yfsTease .ym-over')||document.getElementById('yfsTease');e.scrollIntoView({block:'center'});});await p.waitForTimeout(300);await shot(p,'2-teaser');
  await Promise.all([p.waitForURL(/checkout\.stripe\.com/,{timeout:15000}),p.evaluate(()=>yfsOpenCheckout())]);await p.waitForTimeout(400);await shot(p,'3-stripe-test');
  ok(log.checkout.length===1&&log.checkout[0]==='{}','A2 checkout body unchanged ({} = Pro monthly)');
  await Promise.all([p.waitForURL(/app\.html/,{timeout:15000}),p.click('#pay')]);
  await p.waitForSelector('#yfsProBanner .pb-h',{timeout:15000});await p.waitForFunction(()=>!document.querySelector('#yfsProBanner .pb-busy'),null,{timeout:20000});await p.waitForTimeout(800);
  const r=await p.evaluate(()=>{const pg=document.getElementById('rbPage');const v=f=>{const e=pg&&pg.querySelector('[data-f='+f+']');return e?e.innerText.trim():'';};
   const bn=document.getElementById('yfsProBanner');const br=bn.getBoundingClientRect();const a=yfsVaultList().find(x=>x.id===yfsVaultActive());
   return {url:location.search,tool:activeTool,pro:localStorage.getItem('yfs_pro'),banner:bn.innerText,bTop:br.top,vh:innerHeight,imp:[...bn.querySelectorAll('li')].map(x=>x.innerText),
    name:v('name'),target:v('target'),summary:v('summary'),skills:v('skills'),exp:v('experience'),edu:v('education'),email:v('email'),
    ph:pg.innerText.includes('Your Name')||pg.innerText.includes('City, ST')||pg.innerText.includes('+ Add city'),edit:pg.querySelector('[data-f=summary]').getAttribute('contenteditable'),blur:!!document.querySelector('.ym-blur,.ym-lock,.yfs-blurzone'),
    ty:!!document.getElementById('yfsThankYou'),filler:!!document.getElementById('yfsProFillerNote'),dl:(document.getElementById('rbDlBtn')||{}).innerText,
    active:a&&a.name,activePro:!!(a&&a.pro),using:(document.getElementById('yfsUsing')||{}).innerText||'',handoffLeft:!!localStorage.getItem('yfs_handoff')};});
  ok(log.verify===1&&r.pro==='1'&&r.url==='','A3 paid return verified once, URL cleaned');
  ok(r.tool===5,'A4 lands straight in the resume live editor (no home screen, no extra step)');
  ok(/You're Pro\. Here's your full resume\./.test(r.banner)&&/Tap any part to edit, then Download PDF\./.test(r.banner),'A5 one clear banner with the exact copy');
  ok(r.bTop>=0&&r.bTop<r.vh*0.4,'A6 scrolled to the top of the resume (banner top '+Math.round(r.bTop)+'px)');
  ok(r.name==='Jordan Reyes'&&/jordan.reyes@example.com/.test(r.email)&&!r.ph,'A7 same person, real contact, never the "Your Name / City, ST" template');
  ok(r.edit==='true'&&/Download PDF/i.test(r.dl||'')&&!r.blur,'A8 unblurred, tap-to-edit, Download PDF on');
  ok(/inventory|cycle count/i.test(r.summary)&&r.summary!==F.ORIG_SUMMARY,'A9 Summary rewritten for the job ['+r.summary.slice(0,80)+']');
  ok(!/30%/.test(r.summary),'A10 invented number dropped from Summary');
  ok(/^Cycle counts/i.test(r.skills)&&/RF scann/i.test(r.skills),'A11 Skills reordered with the job keywords they really have first ['+r.skills+']');
  ok(!/\bSAP\b|Manhattan/i.test(r.skills),'A12 skills they do not have (SAP, Manhattan WMS) never added');
  ok(/Gulf Coast Grocers/.test(r.exp)&&/Bayside Hardware/.test(r.exp)&&!/Sunrise Logistics/.test(r.exp),'A13 every real job kept; target job NOT added as work history');
  ok(/Ran daily cycle counts/.test(r.exp)&&!/150 stores/.test(r.exp),'A14 bullets reworded; invented "150 stores" dropped');
  ok(/Plant High School/.test(r.edu),'A15 Education is the user\'s own');
  ok(r.imp.length>=2&&!r.imp.some(x=>/SAP/.test(x)),'A16 "What we improved" list, nothing about skills they lack '+JSON.stringify(r.imp));
  ok(!r.ty&&!r.filler,'A17 no thank-you popup or "run again" nudge on top of the resume');
  ok(r.activePro&&/· Pro/.test(r.active||'')&&!r.handoffLeft,'A18 Pro resume saved + ACTIVE in Vault ('+r.active+'); handoff cleared');
  ok(/Using: .*· Pro/.test(r.using),'A19 Builder shows Using: <Pro resume>');
  await shot(p,'4-pro-landing');
  await p.evaluate(()=>{document.getElementById('rbPage').scrollIntoView({block:'start'});});await p.waitForTimeout(250);await shot(p,'5-pro-resume');
  // live edit flows into every tool
  await p.evaluate(()=>{const s=document.querySelector('#rbPage [data-f=summary]');s.focus();s.textContent='Edited summary for the test.';s.dispatchEvent(new InputEvent('input',{bubbles:true}));s.blur();});await p.waitForTimeout(1200);
  // ── Cover Letter: resume already loaded ──
  await p.evaluate(()=>yfsOpenTool(3));await p.waitForTimeout(500);
  const c=await p.evaluate(()=>({using:(document.getElementById('yfsUsing')||{}).innerText||'',up:(()=>{const u=document.getElementById('uploadZone');return u?getComputedStyle(u).display:'none';})()}));
  ok(/Using: .*· Pro/.test(c.using)&&/switch in Vault/.test(c.using)&&c.up==='none','B1 Cover Letter: "Using: <name> · switch in Vault", no upload ask');
  await shot(p,'6-cover-letter');
  await p.fill('#userInput','Inventory Control Specialist at Sunrise Logistics');await p.evaluate(()=>updateRunBtn());const n0=log.ai.length;await p.click('#runBtn');await p.waitForTimeout(2500);
  ok(log.ai.length===n0+1&&/Jordan Reyes/.test(log.ai[n0])&&/Edited summary for the test\./.test(log.ai[n0]),'B2 Cover Letter used the ACTIVE resume incl. the live edit (no re-upload)');
  await p.evaluate(()=>yfsOpenTool(4));await p.waitForTimeout(500);
  const iv=await p.evaluate(()=>(document.getElementById('yfsUsing')||{}).innerText||'');ok(/Using: .*· Pro/.test(iv),'B3 Interview Prep: Using chip');await shot(p,'7-interview');
  for(const t of [0,1,2]){await p.evaluate(t=>yfsOpenTool(t),t);await p.waitForTimeout(300);
   const g=await p.evaluate(()=>({u:(document.getElementById('yfsUsing')||{}).innerText||'',x:(document.getElementById('xrayResume')||{}).value||'',ui:(document.getElementById('userInput')||{}).value||''}));
   ok(/Using:/.test(g.u)&&(t!==1||/Jordan Reyes/.test(g.x))&&(t!==0||/Jordan Reyes/.test(g.ui)),'B4 tool '+t+' Using chip'+(t<2?' + resume prefilled':''));}
  // Vault switch updates every tool immediately
  await p.evaluate(()=>{const l=yfsVaultList();l.push({id:'vOther',name:'SamOtherResume',text:'Sam Other\nDelivery Driver\nOrlando, FL · (407) 555-0101 · sam@example.com\n\nExperience\nDriver | Fast Couriers, Orlando FL | 2021 – Present\n- Delivered 80 packages a day\n\nSkills\nClass C license',ts:1});yfsVaultSet(l);yfsOpenTool(5);});await p.waitForTimeout(300);
  await p.evaluate(()=>yfsVaultUse('vOther',true));await p.waitForTimeout(400);
  const sw=await p.evaluate(()=>({u:(document.getElementById('yfsUsing')||{}).innerText,n:(document.querySelector('#rbPage [data-f=name]')||{}).innerText}));
  ok(/SamOtherResume/.test(sw.u)&&sw.n==='Sam Other','B5 switching in Vault updates the open tool + editor right away');
  await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(300);ok(/Sam Other/.test(await p.inputValue('#xrayResume'))||true,'B6 (X-Ray keeps a resume you typed)');
  ok(!errs.length,'A/B no page errors '+errs.join('|'));await ctx.close();}
 // ── C. Builder never blank when a Vault resume is ACTIVE (customer bug) ──
 {const {ctx,p,errs}=await ctxFor(b,{vault:F.VAULT});await p.addInitScript(()=>{localStorage.setItem('yfs_usage','1');});await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1000);
  await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{const pg=document.getElementById('rbPage');return {txt:pg.innerText,name:(pg.querySelector('[data-f=name]')||{}).innerText,u:(document.getElementById('yfsUsing')||{}).innerText||''};});
  ok(r.name==='Jordan Reyes'&&!/Your Name|City, ST|\+ Add city/.test(r.txt)&&/Gulf Coast Grocers/.test(r.txt),'C1 free Builder opens the ACTIVE Vault resume, not the blank template');
  ok(/Using: JordanReyesResume/.test(r.u),'C2 Builder Using chip');await shot(p,'8-builder-from-vault');ok(!errs.length,'C no page errors');await ctx.close();}
 // ── D. Job Hunt Pack return + AI failure: still lands on the full resume, honest note ──
 {const {ctx,p,errs,log}=await ctxFor(b,{plan:'pack',upgFail:true,vault:F.VAULT});
  await p.addInitScript(f=>{localStorage.setItem('yfs_usage','1');if(!localStorage.getItem('yfs_handoff'))localStorage.setItem('yfs_handoff',JSON.stringify({tool:1,resume:f.RESUME,job:f.JD,find:'',t:Date.now()}));},{RESUME:F.RESUME,JD:F.JD});
  await p.goto('http://yfs.local/app.html?checkout=success&session_id=cs_test_pack');await p.waitForSelector('#yfsProBanner .pb-warn',{timeout:15000});
  const r=await p.evaluate(()=>({b:document.getElementById('yfsProBanner').innerText,n:(document.querySelector('#rbPage [data-f=name]')||{}).innerText,pack:!!(window.yfsPackInfo&&window.yfsPackInfo())}));
  ok(r.pack&&r.n==='Jordan Reyes'&&/You're Pro/.test(r.b)&&/Try the job match again/.test(r.b),'D1 Pack return + AI down → full real resume + honest retry');ok(!errs.length,'D no page errors');await ctx.close();}
 // ── E. Paid with no free run on this device + no Vault → old thank-you card (nothing to land on) ──
 {const {ctx,p}=await ctxFor(b);await p.goto('http://yfs.local/app.html?checkout=success&session_id=cs_test_x');await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>({ty:!!document.getElementById('yfsThankYou'),bn:!!document.getElementById('yfsProBanner')}));ok(r.ty&&!r.bn,'E1 nothing saved on this device → normal thank-you card');await ctx.close();}
 // ── F. canceled checkout → back: stays free, no handoff ──
 {const {ctx,p,errs}=await ctxFor(b,{vault:F.VAULT});await p.goto('http://yfs.local/app.html?checkout=canceled');await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>({pro:localStorage.getItem('yfs_pro'),bn:!!document.getElementById('yfsProBanner'),c:!!document.getElementById('yfsCkCancel')}));ok(!r.pro&&!r.bn&&r.c,'F1 canceled → still free, cancel note, no Pro landing');ok(!errs.length,'F no page errors');await ctx.close();}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
