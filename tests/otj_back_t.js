// Clocked In: the phone back button (Android back, browser back, iOS edge-swipe all arrive as popstate).
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_back_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18885,O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/job')u='/job/';if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
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





  // the test's own start-up script cannot run on the blank page reached after leaving the app; that is not an app error
  const appErrs=e=>e.filter(m=>!/sessionStorage/.test(m));
  const S0=x=>seed(Object.assign({entries:[Wk(T,'06:00','08:00')]},x));
  const bk=async p=>{await p.goBack({waitUntil:'commit'}).catch(()=>{});await p.waitForTimeout(220);};
  const at2=p=>p.evaluate(()=>({view:(document.querySelector('nav.tabs [aria-current=page]')||{dataset:{}}).dataset.v||'',modal:!!document.getElementById('otjModal'),h3:(document.querySelector('#otjModal h3')||{}).textContent||'',setup:!!document.getElementById('sRate'),path:location.pathname+location.search+location.hash,depth:(history.state&&history.state.otj)||0,mark:window.__mark||0})).catch(()=>null);
  const mark=p=>p.evaluate(()=>{window.__mark=1;});
  const tab=async(p,v)=>{await p.click('nav.tabs [data-v='+v+']');await p.waitForTimeout(120);};
  const day=async p=>{await p.click('#sheet .tsday.today .tsd');await p.waitForTimeout(150);};
  const left=async p=>!/\/job\//.test(p.url());

  // 1 + 2: day sheet, and sheets opened from it
  {const {c,p,errs}=await open(S0());await mark(p);await tab(p,'week');await day(p);let a=await at2(p);const dayTitle=a.h3;
   ok(a.modal&&a.depth===2&&a.path==='/job/','1a '+T0+'(Timesheet → day sheet open; address still /job/)');
   await bk(p);a=await at2(p);ok(!a.modal&&a.view==='week'&&a.path==='/job/'&&a.mark===1,'1b '+T0+'back with a day sheet open: the sheet closes, still on Timesheet, address still /job/, the app did not close or reload');
   await day(p);await p.click('#dAdd');await p.waitForTimeout(150);a=await at2(p);ok(a.modal&&await p.isVisible('#eStart')&&a.h3!==dayTitle,'2a '+T0+'(day sheet → Add hours open)');
   await p.fill('#eStart','09:00');await bk(p);a=await at2(p);ok(a.modal&&a.h3===dayTitle&&!(await p.$('#eStart'))&&a.view==='week','2b '+T0+'back from Add hours: the form closes and the SAME day\'s sheet is back (not dumped on the Timesheet); what was typed is discarded');
   await bk(p);a=await at2(p);ok(!a.modal&&a.view==='week'&&a.mark===1,'2c '+T0+'back again: the day sheet closes, still on Timesheet');
   await bk(p);a=await at2(p);ok(!a.modal&&a.view==='today'&&a.mark===1&&a.depth===0&&live(await st(p)).length===1,'2d '+T0+'back again: Clock. Nothing was saved along the way');
   await tab(p,'week');await day(p);await p.click('#otjModal [data-edit]');await p.waitForTimeout(150);const ed=await p.isVisible('#eDel');await bk(p);a=await at2(p);ok(ed&&a.modal&&a.h3===dayTitle,'2e '+T0+'day sheet → Edit a shift → back: the day sheet is back');
   await p.click('#dPto');await p.waitForTimeout(150);await bk(p);a=await at2(p);ok(a.modal&&a.h3===dayTitle,'2f '+T0+'day sheet → PTO → back: the day sheet is back');
   await p.click('#otjModal [data-edit]');await p.waitForTimeout(150);await p.click('#eDel');await bk(p);a=await at2(p);ok(a.modal&&a.h3===dayTitle&&live(await st(p)).length===1,'2g '+T0+'with the in-sheet "Delete this entry?" showing, back closes the edit sheet like the X (nothing deleted)');
   await bk(p);await bk(p);a=await at2(p);ok(a.view==='today'&&!a.modal,'2h '+T0+'…then day closes, then Clock');
   ok(!appErrs(errs).length,'1-2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // 3: Edit pay setup
  {const {c,p,errs}=await open(S0());await mark(p);await tab(p,'more');await p.click('[data-a=setup]');await p.waitForTimeout(150);await p.fill('#sRate','99');
   await bk(p);let a=await at2(p);ok(!a.setup&&a.view==='more'&&/Edit pay setup/.test(await p.innerText('#view'))&&(await st(p)).settings.rate===28&&a.mark===1,'3a '+T0+'back on Edit pay setup acts like Cancel: More is back, the form is gone, the typed $99 rate is discarded');
   await p.click('[data-a=setup]');await p.waitForTimeout(150);await p.click('[data-a=cancelSetup]');await p.waitForTimeout(150);await bk(p);a=await at2(p);ok(a.view==='today'&&!a.setup,'3b '+T0+'Cancel does not leave a stuck step: one back from More then goes to Clock');
   await tab(p,'more');await p.click('[data-a=setup]');await p.waitForTimeout(150);await p.fill('#sRate','30');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);await bk(p);a=await at2(p);ok((await st(p)).settings.rate===30&&a.view==='today'&&!a.setup,'3c '+T0+'Save does not either: rate saved, one back goes to Clock and the form does not reopen');
   await tab(p,'more');await p.click('[data-a=setup]');await p.waitForTimeout(150);await tab(p,'week');await bk(p);a=await at2(p);ok(a.view==='more'&&!a.setup,'3d '+T0+'tapping a tab from Edit pay setup, then back: More (not the form)');
   ok(!appErrs(errs).length,'3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // 4 + 5: tabs, and leaving from Clock
  {const {c,p,errs}=await open(S0());await mark(p);let a=await at2(p);ok(a.view==='today'&&a.depth===0&&await p.evaluate(()=>history.state===null),'5a '+T0+'opening on Clock adds no history step (nothing that could trap the worker)');
   await tab(p,'week');await tab(p,'pto');await bk(p);a=await at2(p);const v1=a.view;await bk(p);a=await at2(p);
   ok(v1==='week'&&a.view==='today'&&a.mark===1,'4a '+T0+'Clock → Timesheet → PTO, back → Timesheet, back → Clock');
   await tab(p,'week');await p.click('[data-a=wprev]');await p.waitForTimeout(100);await tab(p,'more');await tab(p,'week');await bk(p);a=await at2(p);ok(a.view==='today','4b '+T0+'tapping back to the tab you came from does not pile up steps (Timesheet → More → Timesheet, back → Clock)');
   await tab(p,'week');await tab(p,'pto');await tab(p,'today');a=await at2(p);ok(a.view==='today'&&a.depth===0,'4c '+T0+'tapping the Clock tab clears the trail');
   await p.click('[data-a=gopay]');await p.waitForTimeout(150);a=await at2(p);const viaLink=a.view;await bk(p);a=await at2(p);ok(viaLink==='week'&&a.view==='today','4d '+T0+'the "See take-home" link on Clock counts as a tab change: back returns to Clock');
   await p.goForward({waitUntil:'commit'}).catch(()=>{});await p.waitForTimeout(250);a=await at2(p);ok(a.view==='today'&&!a.modal&&a.mark===1,'4e '+T0+'the browser forward button does not reopen anything');
   await bk(p);ok(await left(p),'5b '+T0+'back on Clock (no sheet open) leaves the app');
   ok(!appErrs(errs).length,'4-5 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  {const {c,p}=await open(null);ok(await p.evaluate(()=>history.state===null&&!!document.getElementById('sRate')),'5c '+T0+'(first-run setup: no history step)');await bk(p);ok(await left(p),'5d '+T0+'back on first-run setup leaves the app');await c.close();}
  {const {c,p,errs}=await open(S0({ui:{a2hsX:1,view:'week'}}));await mark(p);let a=await at2(p);ok(a.view==='week'&&a.depth===0,'5e '+T0+'(the app reopened on Timesheet, where it was left; no step is added until the first tap)');await p.click('header.hd',{position:{x:5,y:5}}).catch(()=>{});await p.waitForTimeout(100);await bk(p);a=await at2(p);ok(a.view==='today'&&a.mark===1,'5f '+T0+'back from a tab the app reopened on goes to Clock');await bk(p);ok(await left(p),'5g '+T0+'…and back again leaves');ok(!appErrs(errs).length,'5 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // 6 + 7: Save, X and backdrop use up the step
  {const {c,p,errs}=await open(S0());await mark(p);await tab(p,'week');await day(p);await p.click('#dAdd');await p.waitForTimeout(150);await p.fill('#eStart','09:00');await p.fill('#eEnd','11:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(300);let a=await at2(p);
   ok(!a.modal&&a.view==='week'&&live(await st(p)).length===2&&a.depth===1,'6a '+T0+'Save on Add hours: the sheet closes, the shift is saved, still on Timesheet');
   await bk(p);a=await at2(p);ok(a.view==='today'&&!a.modal&&a.mark===1,'6b '+T0+'one back from Timesheet goes to Clock; the form does not reopen');
   await tab(p,'week');await day(p);await p.click('#otjModal .x');await p.waitForTimeout(200);a=await at2(p);const closedX=!a.modal;await bk(p);a=await at2(p);ok(closedX&&a.view==='today'&&!a.modal,'7a '+T0+'X still closes the sheet and leaves no stuck step (one back → Clock, the sheet does not reopen)');
   await tab(p,'week');await day(p);await p.mouse.click(6,6);await p.waitForTimeout(200);a=await at2(p);const closedB=!a.modal;await bk(p);a=await at2(p);ok(closedB&&a.view==='today'&&!a.modal,'7b '+T0+'tapping outside the sheet: same');
   await tab(p,'week');await day(p);await p.click('#dAdd');await p.waitForTimeout(150);await p.click('#otjModal .x');await p.waitForTimeout(200);a=await at2(p);const closed2=!a.modal&&a.depth===1;await bk(p);a=await at2(p);ok(closed2&&a.view==='today','7c '+T0+'X on Add hours opened from a day: both steps are used up (one back → Clock)');
   await tab(p,'week');await p.click('[data-a=math]');await p.waitForTimeout(150);await p.keyboard.press('Escape');await p.waitForTimeout(200);a=await at2(p);const esc=!a.modal;await bk(p);a=await at2(p);ok(esc&&a.view==='today','7d '+T0+'Escape closes a sheet like the X');
   await p.click('[data-a=add]');await p.waitForTimeout(150);await bk(p);a=await at2(p);const closedOnClock=!a.modal&&a.view==='today'&&a.mark===1;await bk(p);ok(closedOnClock&&await left(p),'7e '+T0+'on Clock with a sheet open: back closes the sheet; back again leaves the app');
   ok(!appErrs(errs).length,'6-7 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // 8: /job → /job/ and ?src=homescreen
  {const c=await b.newContext({...DEVS[dev],serviceWorkers:'block'});await c.addInitScript(v=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);}},JSON.stringify(S0()));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(O+'/job?src=homescreen#x');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(200);let a=await at2(p);
   ok(a.path==='/job/?src=homescreen#x'&&await p.evaluate(()=>history.state===null),'8a '+T0+'opening /job still becomes /job/ (query and hash kept) with no extra history step');
   await tab(p,'week');await day(p);a=await at2(p);const during=a.path;await bk(p);await bk(p);a=await at2(p);ok(during==='/job/?src=homescreen#x'&&a.path==='/job/?src=homescreen#x'&&a.view==='today','8b '+T0+'?src=homescreen survives tab changes, sheets and back');
   await tab(p,'week');await day(p);await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(300);a=await at2(p);const afterReload=a.view==='week'&&!a.modal&&a.depth===1;await bk(p);a=await at2(p);const toClock=a&&a.view==='today';await bk(p);
   ok(afterReload&&toClock&&await left(p),'8c '+T0+'reloading with a sheet open leaves no dead steps: Timesheet, back → Clock, back → out');
   ok(!appErrs(errs).length,'8 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
