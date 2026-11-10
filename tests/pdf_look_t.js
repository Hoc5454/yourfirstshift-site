// PDF keeps the on-screen proportions; hard-wrapped sentences rejoin, but lists/contact lines/headings never do.
// Fully synthetic fixture: tests/fixtures/pdf_look_resume.txt (made-up person). Usage: node pdf_look_t.js [app.html] [shotDir]
const {chromium,devices}=require('playwright');const fs=require('fs');const path=require('path');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const SHOTS=process.argv[3]||'';
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const RES=fs.readFileSync(path.join(__dirname,'fixtures','pdf_look_resume.txt'),'utf8');
// Translator output (markdown) built from the same made-up person, with the same hard wraps + a one-per-line skills list
const MD=`# Riley Carter
Equipment Operator
Ocala, FL · (555) 010-0142 · riley.carter@example.com ·

## PROFESSIONAL SUMMARY
Equipment operator with two years of road and drainage work and a year leading a small install crew in North
Florida.

## EXPERIENCE
### Equipment Operator | Tri-County Earthworks, Ocala FL | June 2024 – Present
- Ran excavators and loaders to move fill and stone around road and drainage jobs. Mostly
running mid-size track machines and a rubber-tire loader.
- Checked every machine before shift and kept a written log of fluids, wear and repairs for the
shop foreman

## SKILLS
forklift
pallet jack
reach truck
`;
(async()=>{const b=await chromium.launch();
 // ── unit: yfsJoinWraps joins only real wrapped sentences ──
 {const p=await b.newPage();await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/'))return r.fulfill({body:APP,contentType:'text/html'});if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(800);
  const u=await p.evaluate(()=>({list:yfsJoinWraps('forklift\npallet jack\nreach truck'),contact:yfsJoinWraps('Orlando, FL\ngavin@x.com'),contactLong:yfsJoinWraps('Orlando, FL 32801 and the surrounding counties in Central Florida area\nriley@example.com'),
    caps:yfsJoinWraps('EXPERIENCE\nwarehouse associate'),capsLong:yfsJoinWraps('EQUIPMENT OPERATOR AT TRI-COUNTY EARTHWORKS ROAD CREW DIVISION\nwarehouse associate'),
    wrap:yfsJoinWraps('- Ran excavators and loaders to move fill and stone around road and drainage jobs. Mostly\nrunning mid-size track machines.'),
    sentenceEnd:yfsJoinWraps('- Kept a written log of fluids, wear and repairs for every machine on the job.\nrunning list'),
    skillsHtml:yfsSecHtml('Skills','forklift\npallet jack\nreach truck'),certHtml:yfsSecHtml('Certifications','OSHA 10\nCPR\nforklift')}));
  ok(u.list==='forklift\npallet jack\nreach truck','U1 short list lines never join ("forklift / pallet jack / reach truck")');
  ok(u.contact==='Orlando, FL\ngavin@x.com'&&/\nriley@example\.com$/.test(u.contactLong),'U2 an email/URL/phone line never joins the line above');
  ok(u.caps==='EXPERIENCE\nwarehouse associate'&&/\nwarehouse associate$/.test(u.capsLong),'U3 nothing joins under an ALL-CAPS line');
  ok(/Mostly running mid-size/.test(u.wrap),'U4 a real wrapped sentence still joins');
  ok(/\nrunning list$/.test(u.sentenceEnd),'U5 no join after a finished sentence');
  ok(/forklift · pallet jack · reach truck/.test(u.skillsHtml),'U6 output-box Skills keep each item ("forklift · pallet jack · reach truck")');
  ok(!/OSHA 10 CPR/.test(u.certHtml),'U7 short cert lines stay separate');
  await p.close();}
 for(const [dev,vp] of [['iphone',{...devices['iPhone 13'],viewport:{width:412,height:915}}],['desktop',{viewport:{width:1366,height:900}}]]){
 const c=await b.newContext({...vp,deviceScaleFactor:2});
 await c.route('**/*',r=>{const u=r.request().url(),m=r.request().method();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:APP,contentType:'text/html'});
  if(/html2pdf/.test(u))return r.fulfill({body:'window.html2pdf=function(){};',contentType:'application/javascript'});
  if((u===API||u===API+'/')&&m==='POST')return r.fulfill({body:JSON.stringify({content:[{type:'text',text:MD}]}),contentType:'application/json'});
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
 await c.addInitScript(t=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_usage','1');localStorage.setItem('yfs_vault',JSON.stringify([{id:'vR',name:'RileyCarterResume',text:t,ts:1}]));localStorage.setItem('yfs_vault_active','vR');localStorage.setItem('yfs_resume',t);},RES);
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1200);
 await p.evaluate(()=>{window.rbLoadPdfLib=async()=>{};window.yfsPdfSave=async(el)=>{const o=document.getElementById('pdfWrap');if(o)o.remove();const k=el.cloneNode(true);k.id='pdfShot';const w=document.createElement('div');w.id='pdfWrap';w.className=el.parentNode.className;w.style.cssText='position:absolute;left:0;top:0;width:816px;z-index:99999;background:#fff';w.appendChild(k);document.body.appendChild(w);};});
 const measure=(pageSel)=>p.evaluate(sel=>{const fs=e=>parseFloat(getComputedStyle(e).fontSize);const pg=document.querySelector(sel),pd=document.getElementById('pdfShot');const g=(r,s)=>r.querySelector(s);
   const ratio=r=>({name:fs(g(r,'.rb-name'))/fs(g(r,'li')),contact:fs(g(r,'.rb-contact'))/fs(g(r,'li')),h:fs(g(r,'.rb-h'))/fs(g(r,'li'))});
   const tx=n=>n.innerText;return {s:ratio(pg),p:ratio(pd),li:fs(g(pd,'li')),pdfText:tx(pd),screen:tx(pg),contact:(g(pd,'.rb-contact')||{}).innerText||''};},pageSel);
 const close=(a,b)=>Math.abs(a-b)/b<0.04;
 const negatives=(label,t)=>{ok(!/forklift pallet jack/i.test(t)&&/forklift/i.test(t)&&/pallet jack/i.test(t),'['+dev+'] '+label+': skills list not glued together');
   ok(!/\d{4}\s+riley\.carter@example\.com/.test(t)&&!/FL riley\.carter/.test(t),'['+dev+'] '+label+': email not glued onto the line above');
   ok(!/EXPERIENCE [a-z]/.test(t)&&!/SKILLS forklift/.test(t),'['+dev+'] '+label+': nothing glued under an ALL-CAPS heading');};
 // ── A. Builder (default look) ──
 await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(600);
 const scr=await p.evaluate(()=>document.getElementById('rbPage').innerText);ok(/Mostly running mid-size track machines/.test(scr.replace(/\s+/g,' '))&&/repairs for the shop foreman/.test(scr.replace(/\s+/g,' ')),'['+dev+'] Builder screen: wrapped sentences rejoin');
 negatives('Builder screen',scr);
 await p.evaluate(()=>rbDownloadPdf());await p.waitForTimeout(500);let r=await measure('#rbPage');
 ok(close(r.p.name,r.s.name)&&close(r.p.contact,r.s.contact)&&close(r.p.h,r.s.h),'['+dev+'] Builder PDF keeps screen proportions (name '+r.s.name.toFixed(2)+'→'+r.p.name.toFixed(2)+', contact '+r.s.contact.toFixed(2)+'→'+r.p.contact.toFixed(2)+', heading '+r.s.h.toFixed(2)+'→'+r.p.h.toFixed(2)+')');
 ok(Math.abs(r.li-13.5)<0.2,'['+dev+'] Builder PDF body = 13.5px ('+r.li+')');ok(/Mostly running mid-size/.test(r.pdfText.replace(/\s+/g,' ')),'['+dev+'] Builder PDF: wrapped sentence joined');negatives('Builder PDF',r.pdfText);
 ok(!/EDUCATION/i.test(r.pdfText)&&!/[·•]\s*$/.test(r.contact.trim()),'['+dev+'] Builder PDF: no empty section, no trailing dot');
 if(SHOTS){await p.locator('#pdfWrap').screenshot({path:path.join(SHOTS,'builder-pdf-'+dev+'.png')});await p.evaluate(()=>document.getElementById('pdfWrap').remove());await p.locator('#rbPage').screenshot({path:path.join(SHOTS,'builder-screen-'+dev+'.png')});}
 let t=await p.evaluate(()=>{const m=yfsResumeModel();const x=yfsResumeDocxXml(m,selectedStyle);return {txt:yfsResumeTxt(m),docx:(x.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).map(z=>z.replace(/<[^>]+>/g,'')).join('\n')};});
 ok(/Mostly running mid-size/.test(t.txt)&&/Mostly running mid-size/.test(t.docx),'['+dev+'] Builder Word/Text: wrapped sentence joined');negatives('Builder Text',t.txt);negatives('Builder Word',t.docx);
 // ── B. Builder, Bold Trades look ──
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.style-opt')].find(x=>/Bold Trades/.test(x.textContent));if(b)b.click();else yfsSetTpl('Bold Trades');});await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.getElementById('rbPage').className.includes('tpl-trades')),'['+dev+'] Bold Trades look on');
 await p.evaluate(()=>rbDownloadPdf());await p.waitForTimeout(500);r=await measure('#rbPage');
 ok(close(r.p.name,r.s.name)&&close(r.p.contact,r.s.contact)&&close(r.p.h,r.s.h)&&Math.abs(r.li-13.5)<0.2,'['+dev+'] Bold Trades PDF keeps proportions, body '+r.li+'px');
 if(SHOTS){await p.locator('#pdfWrap').screenshot({path:path.join(SHOTS,'trades-pdf-'+dev+'.png')});}await p.evaluate(()=>{const w=document.getElementById('pdfWrap');if(w)w.remove();});
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.style-opt')].find(x=>/Modern Professional/.test(x.textContent));if(b)b.click();});
 // ── C. Output-box page (Translator) → yfsExportPdf ──
 await p.evaluate(()=>yfsOpenTool(0));await p.waitForTimeout(300);await p.evaluate(()=>runTool());await p.waitForSelector('#outputBox .rb-page',{timeout:10000});await p.waitForTimeout(300);
 const os=await p.evaluate(()=>document.querySelector('#outputBox .rb-page').innerText);ok(/Mostly/.test(os),'['+dev+'] Translator page painted (AI lines arrive capitalized, so they are left as written)');negatives('Translator page',os);
 await p.evaluate(()=>yfsExportPdf());await p.waitForTimeout(600);r=await measure('#outputBox .rb-page');
 ok(close(r.p.name,r.s.name)&&close(r.p.contact,r.s.contact)&&close(r.p.h,r.s.h)&&Math.abs(r.li-13.5)<0.2,'['+dev+'] Translator PDF (yfsExportPdf) keeps proportions, body '+r.li+'px');
 ok(!/[·•|]\s*$/.test(r.contact.trim()),'['+dev+'] Translator PDF: trailing "·" on the plain-text contact line removed ['+r.contact.trim()+']');negatives('Translator PDF',r.pdfText);
 if(SHOTS){await p.locator('#pdfWrap').screenshot({path:path.join(SHOTS,'translator-pdf-'+dev+'.png')});}await p.evaluate(()=>{const w=document.getElementById('pdfWrap');if(w)w.remove();});
 t=await p.evaluate(()=>{const m=yfsResumeModel();const x=yfsResumeDocxXml(m,selectedStyle);return {txt:yfsResumeTxt(m),docx:(x.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).map(z=>z.replace(/<[^>]+>/g,'')).join('\n')};});
 negatives('Translator Text',t.txt);negatives('Translator Word',t.docx);
 ok(await p.evaluate(()=>!document.querySelector('[data-pfs]')),'['+dev+'] on-screen pages left untouched after PDFs');
 ok(!errs.length,'['+dev+'] no page errors '+errs.join('|'));await c.close();}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
