// No output may ever show a bullet with no text. Sections that end with a blank line, a trailing newline,
// extra spaces or a stray bullet mark (•, -, *, a Word "symbol" bullet, a zero-width space…) must end on the last REAL line.
// Checks the Build Resume screen, the PDF sheet, Word and Text, in both looks. Made-up resumes only.
// Usage: node empty_bullet_t.js ../app.html
const {chromium,devices}=require('playwright');const fs=require('fs');const path=require('path');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const ENDS={'blank line':'\n','trailing spaces':'   \n  ','stray •':'•','stray • + spaces':'•   ','stray -':'-','stray - + spaces':'-  ','stray *':'*','• + no-break space':'• ','- + zero-width space':'- ​','• + tab':'•\t','• —':'• —','Word symbol bullet':'','○':'○','➢':'➢','✓':'✓','◆':'◆','lone o':'o','–':'–'};
const mk=(e,md)=>md?('# Riley Carter\nWelder\nriley.carter@example.com | (555) 010-0142 | Sampleton, FL\n\n## SUMMARY\nWelder with six years on commercial jobs.\n'+e+'\n\n## EXPERIENCE\n### Welder | Example Iron Works | 2020 – Present\n- Welded structural steel on commercial jobs\n- Trained two hires\n'+e+'\n\n### Helper | Harbor Line Builders | 2018 – 2020\n- Rigged loads\n- Kept the daily log\n'+e+'\n\n## SKILLS\n- Stick welding\n- Rigging\n'+e+'\n\n## EDUCATION\nTestwood High School, 2017\n'+e+'\n')
 :('Riley Carter\nWelder\nriley.carter@example.com | (555) 010-0142 | Sampleton, FL\n\nSUMMARY\nWelder with six years on commercial jobs.\n'+e+'\n\nEXPERIENCE\nWelder, Example Iron Works, 2020 – Present\n• Welded structural steel on commercial jobs\n• Trained two hires\n'+e+'\n\nHelper, Harbor Line Builders, 2018 – 2020\n• Rigged loads\n• Kept the daily log\n'+e+'\n\nSKILLS\n• Stick welding\n• Rigging\n'+e+'\n\nEDUCATION\nTestwood High School, 2017\n'+e+'\n');
const REAL=['Trained two hires','Kept the daily log','Rigging','Testwood High School'];
// a line is "empty" when it has no letter or digit at all, or is a lone "o" (what Word's hollow bullet turns into)
const emptyLines=t=>String(t).split('\n').map(x=>x.trim()).filter(x=>x&&(!/[\p{L}\p{N}]/u.test(x)||/^o$/.test(x)));
(async()=>{const b=await chromium.launch();
 const open=async(dev,look,init)=>{const vp=dev==='iphone'?{...devices['iPhone 13'],viewport:{width:412,height:915}}:dev==='android'?{...devices['Pixel 5']}:{viewport:{width:1366,height:900}};const c=await b.newContext({...vp,deviceScaleFactor:1});
  await c.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:APP,contentType:'text/html'});if(/html2pdf/.test(u))return r.fulfill({body:'window.html2pdf=function(){};',contentType:'application/javascript'});if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
  await c.addInitScript(([i,look])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_usage','1');localStorage.setItem('yfs_tl_style',look);
   if(i.text){localStorage.setItem('yfs_vault',JSON.stringify([{id:'vR',name:'TestResume',text:i.text,look:look,ts:1}]));localStorage.setItem('yfs_vault_active','vR');localStorage.setItem('yfs_resume',i.text);}
   if(i.draft)localStorage.setItem('yfs_rb_draft',JSON.stringify(i.draft));},[init,look]);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://yfs.local/app.html');await p.waitForTimeout(900);
  await p.evaluate(()=>{window.rbLoadPdfLib=async()=>{};window.yfsPdfSave=async(el)=>{const o=document.getElementById('pdfWrap');if(o)o.remove();const k=el.cloneNode(true);k.id='pdfShot';const w=document.createElement('div');w.id='pdfWrap';w.className=el.parentNode.className;w.style.cssText='position:absolute;left:0;top:0;width:816px;z-index:99999;background:#fff';w.appendChild(k);document.body.appendChild(w);};});
  await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(600);return {c,p,errs};};
 const grab=async p=>{const scr=await p.evaluate(()=>{const pg=document.getElementById('rbPage');return {text:pg.innerText,items:[...pg.querySelectorAll('li,p')].filter(x=>!x.classList.contains('yfs-pb-sp')).map(x=>x.textContent.trim())};});
  await p.evaluate(()=>rbDownloadPdf());await p.waitForTimeout(450);
  const pdf=await p.evaluate(()=>{const d=document.getElementById('pdfShot');if(!d)return null;const r={text:d.innerText,items:[...d.querySelectorAll('li,p')].filter(x=>!x.classList.contains('yfs-pb-sp')).map(x=>x.textContent.trim())};document.getElementById('pdfWrap').remove();return r;});
  const dl=await p.evaluate(()=>{const m=yfsResumeModel();const x=yfsResumeDocxXml(m,selectedStyle);return {txt:yfsResumeTxt(m),docx:(x.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[]).map(z=>(z.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).map(y=>y.replace(/<[^>]+>/g,'')).join('')+(/<w:numPr>/.test(z)&&!/<w:t/.test(z)?'•':'')).join('\n'),emptyListParas:(x.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[]).filter(z=>/<w:numPr>/.test(z)&&!/[\p{L}\p{N}]/u.test((z.match(/<w:t[^>]*>[^<]*<\/w:t>/g)||[]).join('').replace(/<[^>]+>/g,''))).length};});
  return {scr,pdf,dl};};
 const check=(tag,g)=>{
  const noItem=a=>(a||[]).filter(x=>!/[\p{L}\p{N}]/u.test(x)||/^o$/.test(x));
  const e1=emptyLines(g.scr.text).concat(noItem(g.scr.items));ok(!e1.length,tag+' Build Resume screen: no bullet or line without text '+JSON.stringify(e1).slice(0,80));
  const e2=g.pdf?emptyLines(g.pdf.text).concat(noItem(g.pdf.items)):['no pdf'];ok(!e2.length,tag+' PDF: no bullet or line without text '+JSON.stringify(e2).slice(0,80));
  const e3=emptyLines(g.dl.docx);ok(!e3.length&&!g.dl.emptyListParas,tag+' Word: no bullet or line without text '+JSON.stringify(e3).slice(0,80)+(g.dl.emptyListParas?' ('+g.dl.emptyListParas+' empty list items)':''));
  const e4=emptyLines(g.dl.txt.replace(/^[=\-_─━]{3,}$/gm,''));ok(!e4.length,tag+' Text: no bullet or line without text '+JSON.stringify(e4).slice(0,80));
  const miss=REAL.filter(x=>g.scr.text.indexOf(x)<0||!g.pdf||g.pdf.text.indexOf(x)<0||g.dl.docx.indexOf(x)<0||g.dl.txt.indexOf(x)<0);ok(!miss.length,tag+' the last real line of every section still shows in all four outputs '+miss.join(','));};
 // 1) resumes from the Vault (markdown and plain text), every ending, both looks
 const names=Object.keys(ENDS);let i=0;
 for(const name of names)for(const md of [1,0]){const look=(i++%2)?'Bold Trades':'Modern Professional';const dev=['iphone','android','desktop'][i%3];
  const {c,p,errs}=await open(dev,look,{text:mk(ENDS[name],md)});const g=await grab(p);check('['+dev+'/'+(look==='Bold Trades'?'Bold':'Modern')+'] '+(md?'markdown':'plain')+' resume, sections end with '+name+':',g);ok(!errs.length,'['+dev+'] no page errors '+errs.join('|').slice(0,120));await c.close();}
 // 2) text typed or left in the builder form itself (no Vault resume)
 for(const look of ['Modern Professional','Bold Trades'])for(const [name,e] of [['stray •','\n•'],['stray -','\n-'],['• + spaces + newline','\n•   \n'],['blank lines','\n\n\n'],['• —','\n• —'],['Word symbol bullet','\n ']]){
  const draft={name:'Riley Carter',target:'Welder',email:'riley.carter@example.com',phone:'(555) 010-0142',location:'Sampleton, FL',experience:'Welder | Example Iron Works | 2020 – Present\n• Welded structural steel on commercial jobs\n• Trained two hires'+e+'\n\nHelper | Harbor Line Builders | 2018 – 2020\n• Rigged loads\n• Kept the daily log'+e,skills:'• Stick welding\n• Rigging'+e,education:'Testwood High School, 2017'+e,extra:''};
  const {c,p,errs}=await open('iphone',look,{draft});const g=await grab(p);check('[iphone/'+(look==='Bold Trades'?'Bold':'Modern')+'] builder form, fields end with '+name+':',g);ok(!errs.length,'no page errors '+errs.join('|').slice(0,120));await c.close();}
 await b.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
