// On the Job Restore: a bad backup file must never damage or replace the worker's records by accident.
// Usage: node otj_restore_t.js ..
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const {CASES,base,W,T,t0}=require('./otj_damaged_sets.js');
const ROOT=path.resolve(process.argv[2]||'..');const PORT=18897,O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const GOOD=base({entries:[W({id:'k1',note:'keep-1'}),W({id:'k2',date:T,start:t0-86400e3,end:t0-86400e3+8*3600e3,note:'keep-2'}),W({id:'k3',note:'keep-3'})]});GOOD.entries[1].date=require('./otj_damaged_sets.js').ymd(new Date(t0-86400e3));
const BAD=/NaN|undefined|\[object|Infinity|Invalid Date/;
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 // one fresh page per case: seeded with 3 good records, then a file is restored
 async function tryRestore(name,fileText,{accept=true}={}){
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await c.addInitScript(v=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);}},JSON.stringify(GOOD));
  const p=await c.newPage();p.setDefaultTimeout(3000);const errs=[],dlg=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{dlg.push(d.type()+': '+d.message());if(d.type()==='confirm'&&!accept)d.dismiss();else d.accept();});
  await p.goto(O+'/job/');await p.waitForTimeout(500);await p.click('nav.tabs [data-v=more]');await p.waitForTimeout(200);
  const before=await p.evaluate(()=>localStorage.getItem('yfs_otj_v1'));
  await p.setInputFiles('#restoreFile',{name:'backup.json',mimeType:'application/json',buffer:Buffer.from(fileText)});await p.waitForTimeout(600);
  const mid=await p.evaluate(()=>({ids:OTJ.state().entries.map(e=>e.id),n:OTJ.state().entries.length,body:document.body.innerText,prev:localStorage.getItem('yfs_otj_v1_prev'),log:(OTJ.state().log||[]).map(l=>l.new).join(' | ')}));
  // the worker keeps using the app: reload, then clock in
  await p.reload();await p.waitForTimeout(600);
  const after=await p.evaluate(()=>({n:OTJ.state().entries.length,ids:OTJ.state().entries.map(e=>e.id),body:document.body.innerText}));
  /* usable = can clock in, or is already on the clock, or is at first-time setup (backup had no pay settings) */
  let clocked=false,why='';try{if(await p.evaluate(()=>!OTJ.state().settings&&/Set up your pay/.test(document.body.innerText)))clocked=true;else{/* DOM clicks: this checks the records + clock logic, not layout (absurd pay values can widen the page) */await p.evaluate(()=>document.querySelector('nav.tabs [data-v=today]').click());await p.waitForTimeout(200);if(!(await p.evaluate(()=>!!OTJ.state().clock)))await p.evaluate(()=>document.querySelector('[data-a=start]').click());await p.waitForTimeout(300);clocked=await p.evaluate(()=>!!OTJ.state().clock);}}catch(e){why=String(e.message).slice(0,120);}
  const end=await p.evaluate(()=>({n:OTJ.state().entries.length,ids:OTJ.state().entries.map(e=>e.id),saved:(JSON.parse(localStorage.getItem('yfs_otj_v1')).entries||[]).length}));
  await c.close();return {errs,dlg,before,mid,after,end,clocked,why,kept:['k1','k2','k3'].every(id=>end.ids.includes(id))&&end.n===3&&end.saved===3};}
 const bk=(data,extra)=>JSON.stringify(Object.assign({app:'yfs-on-the-job',exported:new Date().toISOString(),data},extra||{}));

 // A. the 12 damaged sets, as backup files
 for(const [name,data] of Object.entries(CASES)){const r=await tryRestore(name,bk(data));const isBackup=data&&Array.isArray(data.entries);
  const clean=!r.errs.length&&!r.dlg.some(d=>BAD.test(d))&&!BAD.test(r.mid.body)&&!BAD.test(r.after.body);
  if(!isBackup)ok(clean&&r.kept&&r.clocked&&r.dlg.some(d=>/isn't an On the Job backup/.test(d)),`A [${name}] not a usable backup → refused, the 3 records are untouched, clock-in works ${r.errs.join('|').slice(0,150)}`);
  else ok(clean&&r.clocked&&r.dlg.some(d=>/^confirm/.test(d))&&r.end.n===r.end.saved&&JSON.parse(r.mid.prev||'{}').entries.length===3,`A [${name}] restores cleanly: no error, no NaN/Invalid Date, safety copy of the 3 old records kept, clock-in works (now ${r.end.n} entries) ${r.why} ${BAD.test(r.mid.body)?'mid:'+(r.mid.body.match(/.{0,30}(NaN|undefined|Infinity|Invalid Date).{0,15}/)||[''])[0]:''} ${BAD.test(r.after.body)?'after:'+(r.after.body.match(/.{0,30}(NaN|undefined|Infinity|Invalid Date).{0,15}/)||[''])[0]:''} ${r.errs.join('|').slice(0,150)} ${r.dlg.filter(d=>BAD.test(d)).join('|').slice(0,120)}`);}

 // B. missing / bad "exported" date
 for(const [label,extra] of [['missing',{exported:undefined}],['null',{exported:null}],['text',{exported:'not a date'}],['object',{exported:{}}],['huge number',{exported:1e300}],['empty',{exported:''}]]){
  const good2=base({entries:[W({id:'n1'}),W({id:'n2'})]});const r=await tryRestore(label,bk(good2,extra));const cf=r.dlg.find(d=>/^confirm/.test(d))||'';
  ok(!r.errs.length&&/an unknown date/.test(cf)&&!BAD.test(cf)&&r.end.n===2&&/unknown date/.test(r.mid.log)&&r.clocked&&!BAD.test(r.mid.body),`B exported=${label}: confirm says "an unknown date", restore works (2 entries), history says unknown date ${r.errs.join('|').slice(0,150)}`);}

 // C. files that are not backups
 for(const [label,txt] of [['other JSON','{"a":1}'],['a list','[]'],['null','null'],['not JSON','hello there'],['empty file',''],['wrong app',JSON.stringify({app:'something-else',data:{entries:[]}})],['data is a list',JSON.stringify({app:'yfs-on-the-job',data:[]})],['entries not a list',JSON.stringify({app:'yfs-on-the-job',data:{entries:'x'}})],['data null',JSON.stringify({app:'yfs-on-the-job',data:null})]]){
  const r=await tryRestore(label,txt);ok(!r.errs.length&&r.kept&&r.clocked&&r.mid.prev===null&&r.dlg.length===1&&/isn't an On the Job backup/.test(r.dlg[0]),`C ${label}: refused with a clear message, records untouched, no safety copy written, clock-in works ${r.errs.join('|').slice(0,120)} ${JSON.stringify(r.dlg).slice(0,80)}`);}

 // D. worker says No at the confirm
 {const r=await tryRestore('cancel',bk(base({entries:[W({id:'n1'})]})),{accept:false});ok(!r.errs.length&&r.kept&&r.mid.prev===null,'D tapping Cancel on the confirm leaves the 3 records untouched');}

 // E. damaged records are counted and reported
 {const mixed=base({entries:[W({id:'g1'}),W({id:'g2'}),null,{},W({id:'b1',start:'x'})]});const r=await tryRestore('mixed',bk(mixed));const cf=r.dlg.find(d=>/^confirm/.test(d))||'';
  ok(/\(3 entries\)/.test(cf)&&/\(2 entries; 3 damaged records will be skipped\)/.test(cf)&&r.end.n===2&&/2 entries · 3 damaged skipped/.test(r.mid.log),'E 2 good + 3 damaged: confirm shows the cleaned count and "3 damaged records will be skipped" ['+cf.slice(cf.indexOf('It replaces'),cf.length).slice(0,150)+']');
  const one=await tryRestore('one',bk(base({entries:[W({id:'g1'})]})));ok(/\(1 entry\)\./.test(one.dlg.find(d=>/^confirm/.test(d))||''),'E wording: "1 entry", not "1 entries"');}

 // F. Undo last restore, 14-day expiry, and a failed save never says "Restored"
 {const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await c.addInitScript(v=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);}},JSON.stringify(GOOD));
  const p=await c.newPage();p.setDefaultTimeout(3000);const errs=[],dlg=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{dlg.push(d.message());d.accept();});
  await p.goto(O+'/job/');await p.waitForTimeout(500);await p.click('nav.tabs [data-v=more]');await p.waitForTimeout(200);
  ok(!(await p.$('[data-a=undorestore]')),'F1 no "Undo last restore" before any restore');
  await p.setInputFiles('#restoreFile',{name:'b.json',mimeType:'application/json',buffer:Buffer.from(bk(base({entries:[W({id:'n1'})]})))});await p.waitForTimeout(600);
  ok(await p.evaluate(()=>OTJ.state().entries.length===1)&&!!(await p.$('[data-a=undorestore]')),'F2 after a restore, More shows "Undo last restore"');
  await p.evaluate(()=>document.querySelector('[data-a=undorestore]').click());await p.waitForTimeout(500);
  let ids=await p.evaluate(()=>OTJ.state().entries.map(e=>e.id).sort().join(','));
  ok(ids==='k1,k2,k3'&&dlg.some(d=>/Undo the last restore\? This brings back the records you had before it \(3 entries\)/.test(d)),'F3 Undo brings the 3 earlier records back, after a clear confirm');
  await p.reload();await p.waitForTimeout(500);ok(await p.evaluate(()=>OTJ.state().entries.length===3),'F4 the undo survives a reload');
  await p.click('nav.tabs [data-v=more]');await p.waitForTimeout(200);await p.evaluate(()=>document.querySelector('[data-a=undorestore]').click());await p.waitForTimeout(500);
  ok(await p.evaluate(()=>OTJ.state().entries.length===1&&OTJ.state().entries[0].id==='n1'),'F5 Undo again goes forward to the restored backup (nothing is lost either way)');
  await p.evaluate(()=>localStorage.setItem('yfs_otj_v1_prev_t',String(Date.now()-15*86400000)));await p.reload();await p.waitForTimeout(500);await p.click('nav.tabs [data-v=more]');await p.waitForTimeout(200);
  ok(!(await p.$('[data-a=undorestore]'))&&await p.evaluate(()=>localStorage.getItem('yfs_otj_v1_prev')===null),'F6 the safety copy is dropped after 14 days');
  ok(!errs.length,'F7 no page errors '+errs.join('|').slice(0,150));await c.close();}
 {const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await c.addInitScript(v=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);}},JSON.stringify(GOOD));
  const p=await c.newPage();p.setDefaultTimeout(3000);const dlg=[];p.on('dialog',d=>{dlg.push(d.message());d.accept();});
  await p.goto(O+'/job/');await p.waitForTimeout(500);await p.click('nav.tabs [data-v=more]');await p.waitForTimeout(200);
  await p.evaluate(()=>{const real=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='yfs_otj_v1'&&/"n1"/.test(v))throw new DOMException('QuotaExceededError','QuotaExceededError');return real.call(this,k,v);};});
  await p.setInputFiles('#restoreFile',{name:'b.json',mimeType:'application/json',buffer:Buffer.from(bk(base({entries:[W({id:'n1'})]})))});await p.waitForTimeout(700);
  const r=await p.evaluate(()=>({ids:OTJ.state().entries.map(e=>e.id).sort().join(','),saved:JSON.parse(localStorage.getItem('yfs_otj_v1')).entries.length,toasts:[...document.querySelectorAll('.toast')].map(t=>t.textContent).join(' | ')}));
  ok(r.ids==='k1,k2,k3'&&r.saved===3&&dlg.some(d=>/Restore failed\. Your records were not changed\./.test(d))&&!/Restored/.test(r.toasts),'F8 save fails during restore → "Restore failed", no "Restored" toast, the 3 records stay ('+r.toasts.slice(0,60)+')');await c.close();}
 await b.close();srv.close();console.log(fails?fails+' FAIL':'ALL PASS');process.exit(fails?1:0);})();
