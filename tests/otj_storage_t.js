// Clocked In: hours are never lost or falsely reported as saved (blocked storage, failed writes, damaged data, newer data), undo last change, per diem.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_storage_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18891,O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const DEVS={iphone:{...devices['iPhone 13'],viewport:{width:390,height:844}},android:{...devices['Pixel 7']},desktop:{viewport:{width:1280,height:900}}};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const NOW=new Date(new Date().setHours(12,0,0,0));const T=ymd(NOW);const mon=new Date(NOW);mon.setDate(NOW.getDate()-((NOW.getDay()+6)%7));
const D=i=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return ymd(x);};const TI=(NOW.getDay()+6)%7; // today's index in the Monday week
const at=(d,t)=>{const [h,m]=t.split(':');const x=new Date(d+'T00:00:00');x.setHours(+h,+m,0,0);return x.getTime();};
const SET=x=>Object.assign({rate:28,otRate:'',period:'weekly',anchor:D(0),weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
const seed=x=>Object.assign({app:'yfs-on-the-job',v:1,created:Date.now(),settings:SET(),labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true}],codes:[],entries:[],pto:{buckets:[{id:'v',name:'Vacation',type:'none',start:80,startDate:D(0)}]},clock:null,log:[],lastBackup:Date.now(),ui:{a2hsX:1}},x||{});
let n=0;const H=(d,h,x)=>Object.assign({id:'e'+(++n),kind:'work',date:d,start:at(d,'12:00'),manualHours:h,breakMin:0,jobId:'j1',codeId:'',splits:[],note:''},x||{});
const Wk=(d,a,b,x)=>Object.assign({id:'e'+(++n),kind:'work',date:d,start:at(d,a),end:at(d,b),breakMin:0,jobId:'j1',codeId:'',splits:[],note:''},x||{});
const job=(ot,x)=>Object.assign({id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,ot},x||{});
function csvParse(t){const rows=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}else if(ch==='\r'){}else if(ch==='\n'){r.push(c);rows.push(r);r=[];c='';}else c+=ch;}if(c||r.length){r.push(c);rows.push(r);}return rows;}
const near=(a,b)=>Math.abs(a-b)<0.006;

const KEY='yfs_otj_v1';const BLOCK="This browser isn't saving your hours (Private Browsing or blocked storage). Use regular Safari/Chrome.";
const PD={};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 for(const dev of Object.keys(DEVS)){const T0='['+dev+'] ';
  // opts.raw: exact string to put in storage; opts.block: 'throw' = every write fails from the first moment; opts.extra: other keys to seed
  const open=async(state,opts)=>{opts=opts||{};const c=await b.newContext({...DEVS[dev],serviceWorkers:'block',acceptDownloads:true});
   await c.addInitScript(([v,now,o])=>{const _D=Date;const off=now-_D.now();class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;
     window.__persist=0;try{Object.defineProperty(navigator,'storage',{configurable:true,value:{persist(){window.__persist++;return Promise.resolve(true);}}});}catch(_){}
     if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');if(v)localStorage.setItem('yfs_otj_v1',v);Object.keys(o.extra||{}).forEach(k=>localStorage.setItem(k,o.extra[k]));if(o.pro)localStorage.setItem('yfs_pro','1');}
     const si=Storage.prototype.setItem;window.__mode=o.block||'';
     Storage.prototype.setItem=function(k,val){if(this===localStorage){if(window.__mode==='throw')throw new DOMException('The quota has been exceeded.','QuotaExceededError');if(window.__mode==='drop')return;}return si.call(this,k,val);};},[opts.raw!=null?opts.raw:(state?JSON.stringify(state):''),NOW.getTime(),{block:opts.block||'',extra:opts.extra||{},pro:!!opts.pro}]);
   const p=await c.newPage();p.setDefaultTimeout(6000);const errs=[];const dialogs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{dialogs.push(d.message());d.accept();});await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(200);return {c,p,errs,dialogs};};
  const st=p=>p.evaluate(()=>JSON.parse(JSON.stringify(OTJ.state())));const live=s=>s.entries.filter(e=>!e.deleted);
  const ls=(p,k)=>p.evaluate(k=>localStorage.getItem(k),k||KEY);const keys=p=>p.evaluate(()=>Object.keys(localStorage).sort());
  const back=async p=>{await p.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new StorageEvent('storage',{key:'yfs_otj_v1'}));});await p.waitForTimeout(200);};
  const addHours=async(p,a,z)=>{await p.click('nav.tabs [data-v=today]');await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart',a||'06:00');await p.fill('#eEnd',z||'10:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(200);};
  const toastTxt=p=>p.evaluate(()=>{const t=document.querySelector('.toast');return t?[t.firstChild?t.firstChild.textContent:t.textContent,t.getAttribute('data-bad')||'']:['',''];});
  const bar=p=>p.evaluate(()=>{const e=document.getElementById('storeBad');return e?e.innerText.replace(/\s+/g,' '):'';});

  // ── 1. storage blocked from the first moment (Private Browsing) ──
  {const {c,p,errs}=await open(null,{block:'throw'});
   ok((await bar(p)).startsWith(BLOCK)&&await p.evaluate(()=>getComputedStyle(document.getElementById('storeBad')).backgroundColor==='rgb(185, 28, 28)'),'1a '+T0+'storage blocked: red banner on load, "'+BLOCK+'"');
   await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);let t=await toastTxt(p);
   ok(t[0]===BLOCK&&t[1]==='1'&&!/Saved|You're set/.test(t[0])&&!!(await p.$('[data-a=start]')),'1b '+T0+'finishing setup shows the red error, not a success message, and the setup stays on screen');
   await addHours(p);t=await toastTxt(p);let s=await st(p);
   ok(live(s).length===1&&t[0]===BLOCK&&t[1]==='1'&&!/Saved/.test(await p.innerText('body')),'1c '+T0+'adding hours: the entry stays on screen, the message is the red error, "Saved" never appears');
   await back(p);await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'visible'});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(200);s=await st(p);
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);
   ok(live(s).length===1&&!!s.settings&&/6:00am–10:00am/.test(await p.textContent('#sheet')),'1d '+T0+'going to another app and back (hide/show, page restore, storage event): the hours are still there (this was the bug)');
   ok(/Back up now/.test(await bar(p))&&/Try saving again/.test(await bar(p)),'1e '+T0+'the banner offers "Back up now" and "Try saving again"');
   await p.evaluate(()=>{navigator.canShare=null;});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('#storeBk')]);let bk=null;if(dl){const f=path.join(os.tmpdir(),'yfs-st-'+dev+'.json');await dl.saveAs(f);bk=JSON.parse(fs.readFileSync(f,'utf8'));}
   ok(!!bk&&bk.data.entries.length===1&&bk.data.settings.rate===28,'1f '+T0+'"Back up now" still hands over a file with the hours even though the browser is not saving');
   ok((await ls(p))===null,'1g '+T0+'(nothing was written to storage the whole time)');
   await p.evaluate(()=>{window.__mode='';});await p.click('#storeRetry');await p.waitForTimeout(250);t=await toastTxt(p);const raw=await ls(p);
   ok(t[0]==='Saved ✓'&&!(await p.$('#storeBad'))&&!!raw&&JSON.parse(raw).entries.length===1,'1h '+T0+'once storage works, "Try saving again" saves everything: "Saved ✓", banner gone, hours in storage');
   ok(!errs.length,'1 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 2. a write that does not stick (read-back mismatch) ──
  {const {c,p,errs}=await open(seed({entries:[Wk(T,'06:00','08:00')]}));
   ok(!(await p.$('#storeBad'))&&await p.evaluate(()=>OTJ.storeTest()),'2a '+T0+'normal browser: self-test passes, no banner');
   const before=await ls(p);await p.evaluate(()=>{window.__mode='drop';});await addHours(p,'08:30','10:00');let t=await toastTxt(p),s=await st(p);
   ok(live(s).length===2&&/^Not saved\./.test(t[0])&&t[1]==='1'&&/^Not saved\./.test(await bar(p))&&(await ls(p))===before,'2b '+T0+'the browser accepts the write but does not keep it: red "Not saved…" message and banner, the new entry stays on screen, storage untouched');
   await p.evaluate(()=>{window.__mode='throw';});await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);t=await toastTxt(p);ok(!/Saved/.test(t[0]||'')&&live(await st(p)).length===2,'2c '+T0+'switching tabs while it is failing never says "Saved" and keeps the data');
   await back(p);ok(live(await st(p)).length===2,'2d '+T0+'coming back to the page does not swap the on-screen hours for the older stored ones');
   await p.evaluate(()=>{window.__mode='';});await back(p);const raw=await ls(p);
   ok(!(await p.$('#storeBad'))&&JSON.parse(raw).entries.length===2,'2e '+T0+'when storage starts working again, the next return to the page saves by itself and the banner clears');
   await p.evaluate(()=>{window.__mode='throw';});await p.click('nav.tabs [data-v=week]');await p.click('#sheet [data-edit]');await p.waitForTimeout(150);await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(200);t=await toastTxt(p);
   ok(/^Not saved\./.test(t[0])&&t[1]==='1','2f '+T0+'a delete that could not be saved says so in red (not "Deleted")');
   ok(!errs.length,'2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 3. damaged data is copied aside, never overwritten ──
  {const BAD='{"app":"yfs-on-the-job","v":1,"entries":[{"id":"e1","kind":"work","date":"'+T+'","sta';
   const {c,p,errs}=await open(null,{raw:BAD});let ks=(await keys(p)).filter(k=>k.startsWith(KEY+'_raw_'));
   ok(ks.length===1&&/^yfs_otj_v1_raw_\d+$/.test(ks[0])&&(await ls(p,ks[0]))===BAD&&(await ls(p))===BAD,'3a '+T0+'unreadable data: an exact copy is saved as '+KEY+'_raw_<timestamp> before anything else, and the original is left alone');
   ok(/couldn't be read/.test(await p.textContent('#storeNote'))&&/kept on this phone, not erased/.test(await p.textContent('#storeNote'))&&/Set up your pay/.test(await p.textContent('#view')),'3b '+T0+'the app says the hours could not be read and were kept (no silent blank start)');
   await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());ok((await keys(p)).filter(k=>k.startsWith(KEY+'_raw_')).length===1,'3c '+T0+'reloading does not pile up duplicate copies');
   await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);await addHours(p);
   ok((await ls(p,ks[0]))===BAD&&JSON.parse(await ls(p)).entries.length===1&&!(await ls(p,KEY+'_last')||'').startsWith('{"app":"yfs-on-the-job","v":1,"entries":[{"id":"e1"')&&!!JSON.parse(await ls(p,KEY+'_last')),'3d '+T0+'starting over and saving new hours leaves the raw copy byte-for-byte intact (and the damaged text is never used as a safety copy)');
   const BAD2='not json at all {{{';await p.evaluate(([k,v])=>{window.__sv=Storage.prototype.setItem;localStorage.setItem(k,v);},[KEY,BAD2]);await back(p);ks=(await keys(p)).filter(k=>k.startsWith(KEY+'_raw_'));const vals=[];for(const k of ks)vals.push(await ls(p,k));
   ok(ks.length===2&&vals.includes(BAD)&&vals.includes(BAD2)&&live(await st(p)).length===1&&JSON.parse(await ls(p)).entries.length===1,'3e '+T0+'storage damaged while the app is open: second raw copy made, first one untouched, on-screen hours kept and written back');
   ok(!errs.length,'3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  {const good=seed({entries:[Wk(T,'06:00','08:00'),Wk(T,'08:30','10:00')]});const BAD='{"app":"yfs-on-the-job","entries":[';
   const {c,p,errs}=await open(null,{raw:BAD,extra:{[KEY+'_last']:JSON.stringify(good),[KEY+'_last_t']:String(NOW.getTime()-60000)}});
   ok(live(await st(p)).length===2&&/copy from just before it/.test(await p.textContent('#storeNote'))&&(await keys(p)).some(k=>k.startsWith(KEY+'_raw_')),'3f '+T0+'latest save damaged but the safety copy is good: the app opens the safety copy (2 shifts), says so, and keeps the damaged data');
   for(const [nm,raw] of [['the word null','null'],['an empty object','{}'],['a list','[1,2]'],['another app\'s data','{"app":"other","entries":[]}']]){const x=await open(null,{raw});const k2=(await keys(x.p)).filter(k=>k.startsWith(KEY+'_raw_'));if(!(k2.length===1&&(await ls(x.p,k2[0]))===raw&&!x.errs.length))ok(false,'3g '+T0+nm);await x.c.close();}
   ok(true,'3g '+T0+'other unreadable shapes (null, {}, a list, another app\'s data) are also copied aside, with no page errors');
   ok(!errs.length,'3 '+T0+'no page errors (safety copy) '+errs.join('|').slice(0,140));await c.close();}

  // ── 4. safety copy on every good save + Undo last change ──
  {const {c,p,errs,dialogs}=await open(seed({entries:[Wk(T,'06:00','08:00')]}),{pro:true});
   await p.click('nav.tabs [data-v=more]');ok(!(await p.$('[data-a=undolast]'))&&(await ls(p,KEY+'_last'))===null,'4a '+T0+'nothing changed yet: no "Undo last change"');
   const v1=await ls(p);await addHours(p,'08:30','10:00');const lastA=await ls(p,KEY+'_last');
   ok(JSON.parse(lastA).entries.length===1&&JSON.stringify(JSON.parse(lastA).entries)===JSON.stringify(JSON.parse(v1).entries)&&JSON.parse(await ls(p)).entries.length===2&&+(await ls(p,KEY+'_last_t'))>0,'4b '+T0+'after a good save, '+KEY+'_last holds the records exactly as they were before that change');
   await p.click('nav.tabs [data-v=week]');await p.click('nav.tabs [data-v=pto]');await p.click('nav.tabs [data-v=more]');ok((await ls(p,KEY+'_last'))===lastA,'4c '+T0+'moving between tabs does not use up the safety copy');
   await p.click('[data-a=undolast]');await p.waitForTimeout(250);let s=await st(p);
   ok(live(s).length===1&&JSON.parse(await ls(p)).entries.filter(e=>!e.deleted).length===1&&/Undo your last change\?/.test(dialogs.join(' '))&&/^Undone\./.test((await toastTxt(p))[0]),'4d '+T0+'More → "Undo last change" asks first, then puts the records back (2 shifts → 1)');
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(hist.some(x=>x==='Undid the last change')&&!/[{}]|object Object|undefined/.test(hist.join('')),'4e '+T0+'Change history: "Undid the last change"');
   await p.click('[data-a=undolast]');await p.waitForTimeout(250);s=await st(p);ok(live(s).length===2,'4f '+T0+'undo can itself be undone (back to 2 shifts)');
   ok(!errs.length,'4 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 5. data from a newer version: read-only ──
  {const newer=seed({v:2,future:{a:[1,2,3]},entries:[Wk(T,'06:00','08:00',{futureField:'x'})]});const raw=JSON.stringify(newer);
   const {c,p,errs,dialogs}=await open(null,{raw});
   ok(/out of date on this phone\. Update the app to change your hours\. Nothing was changed\./.test(await bar(p))&&!!(await p.$('#storeUpd'))&&await p.evaluate(()=>OTJ.DATA_V===1&&OTJ.store().ro),'5a '+T0+'data saved by a newer version: red banner "…Update the app…" with an Update button');
   await addHours(p,'08:30','10:00');let t=await toastTxt(p);ok(/out of date/.test(t[0])&&t[1]==='1'&&(await ls(p))===raw,'5b '+T0+'changes are not written: red message, and the stored data is byte-for-byte unchanged');
   await back(p);await p.click('nav.tabs [data-v=more]');await p.waitForTimeout(150);ok((await ls(p))===raw&&(await ls(p,KEY+'_last'))===null&&!(await p.$('[data-a=undolast]'))&&!(await keys(p)).some(k=>k.startsWith(KEY+'_raw_')),'5c '+T0+'still unchanged after leaving and coming back; no safety copy written; no undo offered');
   ok(/6:00am–8:00am/.test(await (async()=>{await p.click('nav.tabs [data-v=week]');return p.textContent('#sheet');})()),'5d '+T0+'the hours can still be read');
   let loads=0;p.on('load',()=>loads++);await p.click('#storeUpd');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(200);ok(loads===1&&(await ls(p))===raw,'5e '+T0+'"Update the app" reloads the page');
   await c.close();
   const y=await open(seed({entries:[Wk(T,'06:00','08:00')]}));await y.p.click('nav.tabs [data-v=more]');const before=await ls(y.p);const f=path.join(os.tmpdir(),'yfs-newer-'+dev+'.json');fs.writeFileSync(f,JSON.stringify({app:'yfs-on-the-job',kind:'backup',v:2,exported:Date.now(),data:newer}));await y.p.setInputFiles('#restoreFile',f);await y.p.waitForTimeout(400);
   ok(/newer version of Clocked In/.test(y.dialogs.join(' '))&&(await ls(y.p))===before,'5f '+T0+'a backup file from a newer version is refused and nothing is changed');
   ok(!errs.length&&!y.errs.length,'5 '+T0+'no page errors '+errs.concat(y.errs).join('|').slice(0,140));await y.c.close();}

  // ── 6. coming back to the page never wipes what is on screen ──
  {const {c,p,errs}=await open(null);await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','31.50');await back(p);
   ok(await p.inputValue('#sJob')==='Harbor Line Builders'&&await p.inputValue('#sRate')==='31.50','6a '+T0+'half-filled pay setup survives leaving and coming back');
   await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);ok(await p.evaluate(()=>window.__persist)===1,'6b '+T0+'the browser is asked to keep the data permanently right after the first good save');
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','06:00');await p.fill('#eEnd','09:45');await back(p);
   ok(!!(await p.$('#otjModal'))&&await p.inputValue('#eStart')==='06:00'&&await p.inputValue('#eEnd')==='09:45','6c '+T0+'a half-typed shift survives leaving and coming back');
   await p.click('#eSave');await p.waitForTimeout(200);ok((await toastTxt(p))[0]==='Saved ✓'&&JSON.parse(await ls(p)).entries.length===1&&await p.evaluate(()=>window.__persist)===1,'6d '+T0+'a real save says "Saved ✓" (read back and matched); the keep-my-data request is made once, not on every save');
   // another tab saved newer records: those are picked up
   const other=await st(p);other.entries.push(Wk(T,'10:00','11:00'));await p.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,JSON.stringify(other)]);await back(p);ok(live(await st(p)).length===2,'6e '+T0+'newer records saved from another tab are still picked up');
   // storage emptied underneath the open app
   await p.evaluate(k=>localStorage.removeItem(k),KEY);await back(p);ok(live(await st(p)).length===2&&JSON.parse(await ls(p)).entries.length===2,'6f '+T0+'storage emptied while the app is open: the on-screen hours are kept and written back, not replaced by a blank app');
   // new app version: reload once, never over open work
   let loads=0;p.on('load',()=>loads++);const fire=()=>p.evaluate(()=>navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
   await fire();await p.waitForTimeout(300);const first=loads;await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','11:00');await fire();await p.waitForTimeout(400);const during=loads,kept=await p.inputValue('#eStart').catch(()=>'');
   await p.click('#otjModal [data-close]');await back(p);await p.waitForTimeout(600);await p.waitForFunction(()=>window.OTJ&&OTJ.tax());const after=loads;
   await fire();await fire();await p.waitForTimeout(600);
   ok(first===0&&during===0&&kept==='11:00'&&after===1&&loads===1&&live(await st(p)).length===2,'6g '+T0+'app update: no reload on first install, none while a shift is being typed, one reload afterwards, and no reload loop');
   ok(!errs.length,'6 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 7. iPhone notes ──
  {const {c,p,errs}=await open(seed());await p.click('nav.tabs [data-v=more]');const tx=(await p.textContent('#iosNotes')).replace(/\s+/g,' ');
   ok(/Private Browsing does not keep your hours/.test(tx)&&/Home Screen app keeps its own records, separate from Safari/.test(tx)&&/Back up in one, then Restore in the other/.test(tx),'7a '+T0+'More explains: Private Browsing loses hours; the Home Screen app has its own records; use Backup to move them');
   ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),'7b '+T0+'More fits the screen');ok(!errs.length,'7 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 8. per diem ──
  {const {c,p,errs}=await open(null);ok(!(await p.$('#sPd'))&&/More → Per diem/.test(await p.textContent('#pdHint')),'8a '+T0+'pay setup no longer hides per diem in the collapsed section; it points to More → Per diem');
   await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.selectOption('#sWs','1');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);
   ok(!(await p.$('#pdToday')),'8b '+T0+'no per diem set: no per diem row on Today');
   await p.click('nav.tabs [data-v=more]');const order=await p.evaluate(()=>Array.from(document.querySelectorAll('#view .card h2')).map(h=>h.textContent));
   ok(order[0]==='Pay setup'&&order[1]==='Per diem'&&/Add per diem/.test(await p.textContent('#pdCard')),'8c '+T0+'More has its own "Per diem" card right under Pay setup');
   await p.click('[data-a=perdiem]');await p.waitForTimeout(150);ok(/Harbor Line Builders, \$ per day worked/.test(await p.textContent('#otjModal')),'8d '+T0+'the per diem sheet asks for a daily amount for each job');
   await p.fill('#pd_0','abc');await p.click('#pdSave');await p.waitForTimeout(100);ok(/Enter a dollar amount/.test(await p.textContent('#pdErr'))&&!!(await p.$('#otjModal')),'8e '+T0+'a non-number is refused');
   await p.fill('#pd_0','$75');await p.click('#pdSave');await p.waitForTimeout(100);const asked=/is your per diem taxed/i.test(await p.textContent('#pdErr'))&&!!(await p.$('#otjModal'));await p.check('#pdTaxY');await p.click('#pdSave');await p.waitForTimeout(250);let s=await st(p);ok(asked,'8e2 '+T0+'the sheet will not save an amount until the taxed question is answered');
   ok(s.jobs[0].perDiem===75&&/Harbor Line Builders\s*\$75\.00 a day/.test(await p.textContent('#pdCard'))&&/Taxed on your stub/.test(await p.textContent('#pdTax')),'8f '+T0+'$75 a day saved on the job and shown on the card');
   await p.click('nav.tabs [data-v=today]');ok(/Per diem today/.test(await p.textContent('#pdToday'))&&(await p.textContent('#pdTodayAmt'))==='$0.00','8g '+T0+'Today shows "Per diem today $0.00" before any hours');
   await addHours(p,'06:00','10:00');await p.click('nav.tabs [data-v=today]');
   ok((await p.textContent('#pdTodayAmt'))==='$75.00'&&(await p.textContent('#earnToday'))==='$112.00','8h '+T0+'after 4 hrs: Per diem today $75.00 on its own line, Earned today $112.00 (per diem is not added into pay)');
   const vis=async id=>p.evaluate(id=>{const e=document.getElementById(id);if(!e)return false;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>100&&r.height>20&&r.left>=0&&r.right<=innerWidth+0.5&&cs.display!=='none'&&cs.visibility!=='hidden';},id);
   const tTxt=(await p.innerText('#pdToday')).replace(/\s+/g,' '),tVis=await vis('pdToday');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pd-1-today.png'),fullPage:true});
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);
   ok(/Per diem\s*1 day · not part of gross/.test(await p.textContent('#wkPd'))&&(await p.textContent('#wkPdAmt'))==='$75.00'&&(await p.textContent('#wkGross'))==='$112.00'&&/\$75\.00 per diem/.test(await p.textContent('#sheet [data-daypd]')),'8i '+T0+'Timesheet: the day row says "$75.00 per diem" and the week box has "Per diem · 1 day · $75.00"');
   const wTxt=(await p.innerText('#wkPd')).replace(/\s+/g,' '),wVis=await vis('wkPd');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pd-2-week.png'),fullPage:true});
   await p.click('[data-a=math]');await p.waitForTimeout(150);const math=(await p.innerText('#otjModal')).replace(/\s+/g,' ');ok(/Per diem \$75\.00/.test(math),'8j '+T0+'Show the math (pay) lists "Per diem $75.00"');await p.click('#otjModal [data-close]');
   const net1=await p.textContent('#wkNet');await p.click('nav.tabs [data-v=more]');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);ok(await p.inputValue('#pd_0')==='75','8k '+T0+'the sheet reopens with $75 filled in');await p.check('#pdTaxN');await p.click('#pdSave');await p.waitForTimeout(250);
   const cTxt=(await p.innerText('#pdCard')).replace(/\s+/g,' '),cVis=await vis('pdCard');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pd-3-more.png'),fullPage:true});
   await p.click('nav.tabs [data-v=week]');const net2=await p.textContent('#wkNet');const m=x=>+x.replace(/[^\d.]/g,'');
   ok(/Not taxed on your stub/.test(cTxt)&&m(net2)>m(net1)&&near(m(net2)-m(net1),75*0.0765),'8l '+T0+'"isn\'t taxed on my stub" takes per diem out of the tax estimate (take-home '+net1+' → '+net2+')');
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(hist.some(x=>/Edited job Harbor Line Builders: per diem a day .*→ \$75\.00/.test(x))&&!/[{}]|object Object|undefined/.test(hist.join('')),'8m '+T0+'Change history: "Edited job Harbor Line Builders: per diem a day … → $75.00"');
   await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());s=await st(p);ok(s.jobs[0].perDiem===75&&s.settings.perDiemNT===true,'8n '+T0+'per diem is still there after a reload');
   PD[dev]={tTxt,wTxt,cTxt,tVis,wVis,cVis,ua:await p.evaluate(()=>navigator.userAgent)};
   ok(tVis&&wVis&&cVis,'8o '+T0+'per diem rows are visible and inside the screen on Today, Timesheet and More');
   ok(!errs.length,'8 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  {const {c,p,errs}=await open(seed());
   const wkOf=state=>p.evaluate(([s,wk])=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();const w=OTJ.computeWeek(wk);return {tot:w.tot.perDiem,days:w.keys.map(k=>w.days[k].perDiem),jobs:OTJ.state().jobs.map(j=>j.perDiem)};},[state,D(0)]);
   let r=await wkOf(seed({settings:SET({perDiem:50}),entries:[H(D(0),8),H(D(1),8),{id:'pp',kind:'pto',date:D(2),hours:8,bucket:'v',jobId:'j1'}]}));
   ok(r.tot===100&&r.days[0]===50&&r.days[1]===50&&r.days[2]===0,'8p '+T0+'older setups (one per diem for everything) still pay the same: $50 per day worked, nothing on a PTO-only day');
   await p.click('nav.tabs [data-v=more]');ok(/\$50\.00 a day/.test(await p.textContent('#pdCard')),'8q '+T0+'…and that older amount shows on the Per diem card');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);const pre=await p.inputValue('#pd_0');await p.check('#pdTaxY');await p.click('#pdSave');await p.waitForTimeout(250);const s=await st(p);const again=await p.evaluate(wk=>OTJ.computeWeek(wk).tot.perDiem,D(0));
   ok(pre==='50'&&s.jobs[0].perDiem===50&&s.settings.perDiem===''&&again===100,'8r '+T0+'saving the sheet moves the older amount onto the job with no change to pay');
   const two=x=>seed(Object.assign({jobs:[job(null,{id:'jA',perDiem:60}),job(null,{id:'jB',name:'Example Iron Works',perDiem:40})]},x));
   r=await wkOf(two({entries:[H(D(0),6,{jobId:'jA'}),H(D(0),3,{jobId:'jB',start:at(D(0),'13:00')}),H(D(1),8,{jobId:'jB'})]}));
   ok(r.days[0]===60&&r.days[1]===40&&r.tot===100,'8s '+T0+'two jobs with their own amounts: a day worked at both pays one per diem at the higher amount ($60); a day at one pays that job\'s');
   r=await wkOf(seed({settings:SET({perDiem:50}),jobs:[job(null,{id:'jA'}),job(null,{id:'jB',name:'Example Iron Works'})],entries:[H(D(0),6,{jobId:'jA'}),H(D(0),3,{jobId:'jB',start:at(D(0),'13:00')})]}));
   ok(r.days[0]===50,'8t '+T0+'an older single amount is still counted once a day, even with two jobs worked');
   r=await wkOf(seed({jobs:[job(null,{id:'jA',perDiem:'abc'}),job(null,{id:'jB',name:'B',perDiem:-5}),job(null,{id:'jC',name:'C',perDiem:1e9}),job(null,{id:'jD',name:'D',perDiem:'42.5'})],entries:[H(D(0),2,{jobId:'jA'}),H(D(0),2,{jobId:'jB',start:at(D(0),'13:00')}),H(D(0),2,{jobId:'jC',start:at(D(0),'15:00')}),H(D(0),2,{jobId:'jD',start:at(D(0),'17:00')})]}));
   ok(r.days[0]===42.5&&r.jobs[0]===undefined&&r.jobs[1]===undefined&&r.jobs[2]===undefined&&r.jobs[3]===42.5,'8u '+T0+'damaged per diem values (text, negative, huge) are dropped; a good one is kept');
   ok(!errs.length,'8 '+T0+'no page errors (engine) '+errs.join('|').slice(0,140));await c.close();}
 }
 const a=PD.iphone,d=PD.android;
 ok(!!a&&!!d&&/iPhone/.test(a.ua)&&/Android/.test(d.ua)&&a.tTxt===d.tTxt&&a.wTxt===d.wTxt&&a.cTxt===d.cTxt&&a.tVis&&d.tVis&&a.wVis&&d.wVis&&a.cVis&&d.cVis,'8v per diem reads exactly the same on iPhone and Android (Today: "'+(a&&a.tTxt)+'" · Timesheet: "'+(a&&a.wTxt)+'")');
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
