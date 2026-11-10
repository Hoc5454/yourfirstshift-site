// Resume clean-up: AI leftovers and parser slips must never reach the page or the downloads.
// Made-up fixture: tests/fixtures/dirty_resume.txt. Usage: node resume_clean_t.js ../app.html [shotDir]
const {chromium,devices}=require('playwright');const fs=require('fs');const path=require('path');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const SHOTS=process.argv[3]||'';
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const RES=fs.readFileSync(path.join(__dirname,'fixtures','dirty_resume.txt'),'utf8');
(async()=>{const b=await chromium.launch();
 for(const [dev,vp] of [['iphone',{...devices['iPhone 13'],viewport:{width:412,height:915}}],['desktop',{viewport:{width:1366,height:900}}]]){
 const c=await b.newContext({...vp,deviceScaleFactor:1});
 await c.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:APP,contentType:'text/html'});
  if(/html2pdf/.test(u))return r.fulfill({body:'window.html2pdf=function(){};',contentType:'application/javascript'});
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
 await c.addInitScript(t=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_usage','1');localStorage.setItem('yfs_vault',JSON.stringify([{id:'vR',name:'RileyCarterResume',text:t,ts:1}]));localStorage.setItem('yfs_vault_active','vR');localStorage.setItem('yfs_resume',t);},RES);
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1200);
 await p.evaluate(()=>{window.rbLoadPdfLib=async()=>{};window.yfsPdfSave=async(el)=>{const o=document.getElementById('pdfWrap');if(o)o.remove();const k=el.cloneNode(true);k.id='pdfShot';const w=document.createElement('div');w.id='pdfWrap';w.className=el.parentNode.className;w.style.cssText='position:absolute;left:0;top:0;width:816px;z-index:99999;background:#fff';w.appendChild(k);document.body.appendChild(w);};});
 // (d) parser
 const f=await p.evaluate(t=>yfsResumeFields(t),RES);
 ok(f.email==='riley.carter@example.com','['+dev+'] (d) Email field holds only the email ("'+f.email+'")');
 ok(/555\s?010\s?0142/.test(f.phone)&&!/@/.test(f.phone)&&/Sampleton, FL/.test(f.location)&&!/555/.test(f.location),'['+dev+'] (d) phone and city land in their own fields (phone "'+f.phone+'", location "'+f.location+'")');
 // Builder screen
 await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(700);
 const scr=await p.evaluate(()=>{const pg=document.getElementById('rbPage');return {text:pg.innerText,ph:[...pg.querySelectorAll('.rb-ph')].map(x=>x.textContent.trim()),lis:[...pg.querySelectorAll('li')].map(x=>x.textContent.trim())};});
 const junk=(label,t,lis)=>{
  ok(!/^\s*[•\-–—*·]?\s*[—–\-]{1,3}\s*$/m.test(t)&&!(lis||[]).some(x=>!x||/^[—–\-*·•\s]+$/.test(x)),'['+dev+'] (b) '+label+': no empty "• —" bullets');
  ok(!/⚠|Note: if you hold/i.test(t)&&!/\*/.test(t),'['+dev+'] (e) '+label+': no AI "⚠ Note…" line, no stray *');
  ok(!/Name\s*·\s*Phone|---\s*·\s*---|\|\s*Name\s*\|/.test(t)&&(label==='Word download'||!/^\s*[·|]/m.test(t))&&!/REFERENCES/i.test(t),'['+dev+'] (f) '+label+': no junk References lines, no empty References heading');};
 junk('Builder screen',scr.text,scr.lis);
 ok(!scr.ph.some(x=>/City, ST|\(555\) 123-4567/.test(x)),'['+dev+'] (c) screen: no "City, ST · (555) 123-4567" placeholders when the resume has a city and phone ('+scr.ph.join(' | ').slice(0,90)+')');
 ok(!scr.ph.some(x=>/linkedin\.com\/in\/you/.test(x)),'['+dev+'] (c) screen: no fake-looking "linkedin.com/in/you" on the page');
 // PDF
 await p.evaluate(()=>rbDownloadPdf());await p.waitForTimeout(600);
 const pdf=await p.evaluate(()=>{const d=document.getElementById('pdfShot');const lis=[...d.querySelectorAll('li')];return {text:d.innerText,lis:lis.map(x=>x.textContent.trim()),h:d.getBoundingClientRect().height,li:lis.length?parseFloat(getComputedStyle(lis[0]).fontSize):0,lh:lis.length?parseFloat(getComputedStyle(lis[0]).lineHeight):0,ph:d.querySelectorAll('.rb-ph').length};});
 junk('PDF',pdf.text,pdf.lis);
 ok(!/City, ST|\(555\) 123-4567|linkedin\.com\/in\/you|Target Job Title/.test(pdf.text)&&pdf.ph===0,'['+dev+'] (c) PDF: no placeholders');
 const pages=Math.ceil(pdf.h/960);ok(pages<=2&&pdf.lh/pdf.li<=1.6,'['+dev+'] (a) PDF: this 3-job resume fits 2 pages or fewer, normal line spacing (about '+pages+' page'+(pages===1?'':'s')+', '+Math.round(pdf.h)+'px, line-height '+(pdf.lh/pdf.li).toFixed(2)+')');
 ok(!/[•·]\s*$/.test(pdf.text.trim()),'['+dev+'] (a) PDF does not end with a lone bullet');
 if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.locator('#pdfWrap').screenshot({path:path.join(SHOTS,'clean-pdf-'+dev+'.png')});}
 await p.evaluate(()=>{const w=document.getElementById('pdfWrap');if(w)w.remove();});
 // Word / Text
 const t=await p.evaluate(()=>{const m=yfsResumeModel();const x=yfsResumeDocxXml(m,selectedStyle);return {txt:yfsResumeTxt(m),docx:(x.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).map(z=>z.replace(/<[^>]+>/g,'')).join('\n')};});
 junk('Text download',t.txt);junk('Word download',t.docx);
 ok(/Harbor Line Builders/.test(t.txt)&&/Northgate Door Control/.test(t.txt)&&/Example Iron Works/.test(t.txt)&&/Testwood High School/.test(t.txt)&&/Stick welding/.test(t.txt)&&/Rigged loads/.test(t.txt),'['+dev+'] nothing real was lost (3 employers, school, skills, bullets all present)');
 // cleaner unit checks: real content is never dropped
 const u=await p.evaluate(()=>({table:yfsCleanResume('## REFERENCES\n| Name | Phone |\n|---|---|\n| Sam Ortiz | 555-010-0111 |'),keep:yfsCleanResume('## SKILLS\nC++ · C# · A+ certified\n- Ran a 3-person crew\n- Note taking and filing'),dates:yfsCleanResume('### Lead | Acme | 2020 – Present\n- Cut downtime 30%\n---\n- **Trained** 4 hires*'),tip:yfsCleanResume('## EDUCATION\nGED, 2019\nTip: add your certifications here\n[Add graduation date]'),one:yfsResumeFields('# Sam Ortiz\nWelder\nsam.ortiz@example.com | (555) 010-0111 | Testwood, FL | linkedin.com/in/samortiz\n\n## EXPERIENCE\n### Welder | Example Iron Works | 2020 – Present\n- Welded structural steel on commercial jobs for four years')}));
 ok(/Sam Ortiz · 555-010-0111/.test(u.table)&&!/Name/.test(u.table)&&!/---/.test(u.table),'['+dev+'] cleaner: a table row with real data is kept as "Sam Ortiz · 555-010-0111"; header + separator rows go');
 ok(/C\+\+ · C# · A\+ certified/.test(u.keep)&&/Ran a 3-person crew/.test(u.keep)&&/Note taking and filing/.test(u.keep),'['+dev+'] cleaner: "C++", "A+" and a bullet starting "Note taking" are kept');
 ok(/2020 – Present/.test(u.dates)&&/Cut downtime 30%/.test(u.dates)&&/- Trained 4 hires$/.test(u.dates)&&!/---/.test(u.dates),'['+dev+'] cleaner: dates with dashes kept, "---" rule and ** marks removed');
 ok(/GED, 2019/.test(u.tip)&&!/Tip:|\[Add/.test(u.tip),'['+dev+'] cleaner: "Tip: …" and "[Add …]" prompt lines removed, real line kept');
 ok(u.one.email==='sam.ortiz@example.com'&&u.one.phone==='(555) 010-0111'&&u.one.location==='Testwood, FL'&&/linkedin\.com\/in\/samortiz/.test(u.one.links),'['+dev+'] parser: the normal "a | b | c | d" contact line still splits right '+JSON.stringify([u.one.email,u.one.phone,u.one.location,u.one.links]));
 ok(!errs.length,'['+dev+'] no page errors '+errs.join('|').slice(0,160));
 await c.close();}
 await b.close();console.log(fails?fails+' FAIL':'ALL PASS');process.exit(fails?1:0);})();
