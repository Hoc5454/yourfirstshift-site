// Real PDF check: builds the actual PDF with the real html2pdf library, counts its pages with pdfinfo,
// and fails if the last page is nearly empty (ink covers under 12% of the page height) or carries only a stray mark.
// Needs: tests/node_modules/html2pdf.js (npm i in tests/), poppler (pdfinfo, pdftoppm), python3 + Pillow.
// Made-up resumes only. Usage: node pdf_pages_t.js ../app.html [outDir]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const cp=require('child_process');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const OUT=process.argv[3]||'/tmp/yfs_pdf_pages';fs.mkdirSync(OUT,{recursive:true});
const LIB=path.join(__dirname,'node_modules/html2pdf.js/dist/html2pdf.bundle.min.js');
if(!fs.existsSync(LIB)){console.log('FAIL html2pdf library missing: run "npm i" in tests/');process.exit(1);}
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const CASES=[['dirty 3-job resume',fs.readFileSync(path.join(__dirname,'fixtures','dirty_resume.txt'),'utf8'),1],['7-job resume',fs.readFileSync(path.join(__dirname,'sample2.md'),'utf8'),2],['short 2-job resume',fs.readFileSync(path.join(__dirname,'raw_resume.txt'),'utf8'),1]];
function ink(pdf,page){const base=path.join(OUT,'pg');cp.execFileSync('pdftoppm',['-r','40','-f',String(page),'-l',String(page),'-png',pdf,base]);
  const f=fs.readdirSync(OUT).filter(x=>x.startsWith('pg')&&x.endsWith('.png')).map(x=>path.join(OUT,x))[0];
  const r=cp.execFileSync('python3',['-c','import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("L");w,h=im.size;px=im.load()\nrows=[y for y in range(h) if sum(1 for x in range(w) if px[x,y]<200)>=2]\nprint((max(rows)-min(rows)+1)/h if rows else 0, len(rows)/h)',f]).toString().trim().split(' ').map(Number);fs.unlinkSync(f);return {extent:r[0],rows:r[1]};}
(async()=>{const b=await chromium.launch();
 for(const look of ['Modern Professional','Bold Trades'])for(const [name,text,maxPages] of CASES){
  const c=await b.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,acceptDownloads:true});
  await c.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:APP,contentType:'text/html'});
   if(/html2pdf/.test(u))return r.fulfill({body:fs.readFileSync(LIB),contentType:'application/javascript'});if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
  await c.addInitScript(([t,look])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_usage','1');localStorage.setItem('yfs_tl_style',look);localStorage.setItem('yfs_vault',JSON.stringify([{id:'vR',name:'TestResume',text:t,look:look,ts:1}]));localStorage.setItem('yfs_vault_active','vR');localStorage.setItem('yfs_resume',t);},[text,look]);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1000);
  await p.evaluate(()=>yfsOpenTool(5));await p.waitForTimeout(800);
  const file=path.join(OUT,(name+'-'+look).replace(/\W+/g,'_')+'.pdf');
  let got=false;try{const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.evaluate(()=>rbDownloadPdf())]);await dl.saveAs(file);got=true;}catch(e){}
  if(!got){ok(false,`[${look}] ${name}: a PDF file was produced`);await c.close();continue;}
  const info=cp.execFileSync('pdfinfo',[file]).toString();const pages=+((info.match(/Pages:\s+(\d+)/)||[])[1]||0);const size=(info.match(/Page size:\s+([\d.]+) x ([\d.]+)/)||[]).slice(1).map(Number);
  const last=ink(file,pages),first=ink(file,1);
  ok(pages>=1&&pages<=maxPages,`[${look}] ${name}: real PDF has ${pages} page${pages===1?'':'s'} (limit ${maxPages}), ${Math.round(size[0])}x${Math.round(size[1])}pt`);
  ok(pages===1||last.extent>=0.12,`[${look}] ${name}: last page is not nearly empty (ink spans ${(last.extent*100).toFixed(0)}% of page ${pages})`);
  ok(first.extent>0.2,`[${look}] ${name}: page 1 has content (${(first.extent*100).toFixed(0)}%)`);
  const txt=cp.execFileSync('pdftotext',['-layout',file,'-']).toString();
  ok(/Harbor Line Builders/.test(txt)&&!/⚠|Note: if you hold|Name\s*·\s*Phone|City, ST|\(555\) 123-4567|\+ Add /.test(txt)&&!/^\s*[•·\-]\s*[—–-]?\s*$/m.test(txt),`[${look}] ${name}: PDF text layer has the real content and no junk (${txt.length} chars)`);
  ok(!errs.length,`[${look}] ${name}: no page errors ${errs.join('|').slice(0,120)}`);await c.close();}
 await b.close();console.log(fails?fails+' FAIL':'ALL PASS');process.exit(fails?1:0);})();
