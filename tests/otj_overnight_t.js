// On the Job: an overnight shift (clock in yesterday evening, out this morning) shows on Today after STOP. Usage: node otj_overnight_t.js ..
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const PORT=18895,O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 // weekStart values: one where yesterday is in the same week, one where today is the first day of a new week
 for(const mode of ['same week','new week']){const now=new Date(new Date().setHours(6,0,0,0));const ws=mode==='new week'?now.getDay():(now.getDay()+6)%7;
  const start=now.getTime()-8*3600e3;const T=ymd(now);
  const st={app:'yfs-on-the-job',v:1,created:Date.now(),settings:{rate:20,otRate:'',period:'weekly',anchor:T,weekStart:ws,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},
   labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true}],codes:[],entries:[],pto:{buckets:[]},clock:{start,jobId:'j1',codeId:'',breaks:[],onBreak:null},log:[],lastBackup:Date.now(),ui:{a2hsX:1}};
  const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await c.addInitScript(v=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);}},JSON.stringify(st));
  const p=await c.newPage();await p.clock.install({time:now});await p.clock.resume();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
  await p.goto(O+'/job/');await p.waitForTimeout(600);await p.click('[data-a=stop]');await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const s=OTJ.state();const e=s.entries[0];const o=document.getElementById('overnight');return {date:e.date,card:!!o,edit:!!(o&&o.querySelector('[data-edit="'+e.id+'"]')),txt:o?o.innerText.slice(0,120):'',earn:document.getElementById('earnToday').textContent,n:document.querySelectorAll('[data-edit="'+e.id+'"]').length};});
  ok(r.date!==T,`[${mode}] shift is dated on the day it started (${r.date})`);
  ok(r.card&&r.edit&&r.n===1,`[${mode}] Today shows it once under "Overnight shift · ended today", editable (${r.txt.replace(/\s+/g,' ').slice(0,80)})`);
  ok(r.earn==='$0.00',`[${mode}] "Earned today" unchanged: pay stays on the start day (${r.earn})`);
  await p.click('#overnight [data-edit]');await p.waitForTimeout(300);ok(await p.isVisible('#eEnd'),`[${mode}] tapping it opens the edit sheet`);
  ok(!errs.length,`[${mode}] no page errors ${errs.join('|').slice(0,200)}`);await c.close();}
 // normal day shift: no overnight card
 {const now=new Date(new Date().setHours(16,0,0,0));const st={app:'yfs-on-the-job',v:1,settings:{rate:20,period:'weekly',anchor:ymd(now),weekStart:1,state:'FL',filing:'single'},jobs:[{id:'j1',name:'Harbor Line Builders',active:true}],entries:[],clock:{start:now.getTime()-8*3600e3,jobId:'j1',codeId:'',breaks:[],onBreak:null},ui:{a2hsX:1},lastBackup:Date.now()};
  const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await c.addInitScript(v=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);}},JSON.stringify(st));
  const p=await c.newPage();await p.clock.install({time:now});await p.clock.resume();p.on('dialog',d=>d.accept());await p.goto(O+'/job/');await p.waitForTimeout(600);await p.click('[data-a=stop]');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>!document.getElementById('overnight')&&document.getElementById('earnToday').textContent==='$160.00'),'day shift: no overnight card, pay on today ($160.00)');await c.close();}
 await b.close();srv.close();console.log(fails?fails+' FAIL':'ALL PASS');process.exit(fails?1:0);})();
