// Clocked In: per diem rules (one a day, charge-to job, CSV, taxed question), damaged-data download, open-form guard.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_perdiem_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18890,O='http://127.0.0.1:'+PORT;
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


  const wkOf=(p,state,wk)=>p.evaluate(([s,wk])=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();const w=OTJ.computeWeek(wk);const c=OTJ.pdCharge(wk);return {tot:w.tot.perDiem,days:w.keys.map(k=>w.days[k].perDiem),to:c?c.label:null,over:c?c.over:null};},[state,wk||D(0)]);
  const two=x=>seed(Object.assign({jobs:[job(null,{id:'jA',perDiem:60}),job(null,{id:'jB',name:'Example Iron Works',perDiem:40})]},x));
  const csvOf=async p=>{const t=await p.evaluate(()=>OTJ.buildCSV());const rows=csvParse(t);const h=rows[0];return {h,rows:rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])))};};

  // ── 1. one per diem a day ──
  {const {c,p,errs}=await open(seed());
   let r=await wkOf(p,two({entries:[H(D(0),6,{jobId:'jA'}),H(D(0),3,{jobId:'jB',start:at(D(0),'13:00')}),H(D(1),8,{jobId:'jB'}),H(D(2),8,{jobId:'jA'})]}));
   ok(r.days[0]===60&&r.days[1]===40&&r.days[2]===60&&r.tot===160,'1a '+T0+'two jobs on the same day = ONE per diem at the higher amount ($60, not $100); other days pay that day\'s job');
   r=await wkOf(p,two({jobs:[job(null,{id:'jA',perDiem:40}),job(null,{id:'jB',name:'Example Iron Works',perDiem:60})],entries:[H(D(0),6,{jobId:'jA'}),H(D(0),3,{jobId:'jB',start:at(D(0),'13:00')})]}));ok(r.days[0]===60,'1b '+T0+'the higher amount wins whichever job is listed or worked first');
   r=await wkOf(p,two({settings:SET({perDiemEach:true}),entries:[H(D(0),6,{jobId:'jA'}),H(D(0),3,{jobId:'jB',start:at(D(0),'13:00')}),H(D(1),8,{jobId:'jB'})]}));ok(r.days[0]===100&&r.days[1]===40&&r.tot===140,'1c '+T0+'with "My employers each pay per diem (count both)" on: $60 + $40 = $100 that day');
   r=await wkOf(p,seed({settings:SET({perDiem:50}),entries:[H(D(0),8),H(D(1),8),{id:'pp',kind:'pto',date:D(2),hours:8,bucket:'v',jobId:'j1'}]}));ok(r.tot===100&&r.days[2]===0,'1d '+T0+'old data (one amount, one job) pays exactly what it did: $50 per day worked, none on a PTO-only day');
   r=await wkOf(p,seed({settings:SET({perDiem:50}),jobs:[job(null,{id:'jA'}),job(null,{id:'jB',name:'Example Iron Works'})],entries:[H(D(0),6,{jobId:'jA'}),H(D(1),3,{jobId:'jB'}),H(D(2),3,{jobId:'jA'}),H(D(2),3,{jobId:'jB',start:at(D(2),'13:00')})]}));ok(r.days[0]===50&&r.days[1]===50&&r.days[2]===50,'1e '+T0+'old data with two jobs: $50 a day, including the day both were worked');
   r=await wkOf(p,two({jobs:[job(null,{id:'jA',perDiem:60}),job(null,{id:'jB',name:'Example Iron Works',perDiem:0})],entries:[H(D(0),3,{jobId:'jB'}),H(D(1),3,{jobId:'jA'})]}));ok(r.days[0]===0&&r.days[1]===60,'1f '+T0+'a job with no per diem adds nothing on its own day');
   // ── 2. which job the week's per diem is charged to ──
   const cd=(d,h,code,x)=>H(d,h,Object.assign({codes:code?{job:code}:undefined},x||{}));
   r=await wkOf(p,seed({jobs:[job(null,{perDiem:75})],entries:[cd(D(0),10,'AFE-100'),cd(D(1),6,'AFE-200'),cd(D(2),6,'AFE-200')]}));ok(r.to==='AFE-200'&&r.over===false,'2a '+T0+'charged to the Job # with the most hours that week (AFE-200: 12 hrs beats AFE-100: 10 hrs)');
   r=await wkOf(p,seed({jobs:[job(null,{perDiem:75})],entries:[cd(D(0),8,'AFE-100'),cd(D(1),8,'AFE-200'),cd(D(2),8,'AFE-300')]}));ok(r.to==='AFE-100','2b '+T0+'a tie goes to the first job worked that week (AFE-100)');
   r=await wkOf(p,seed({jobs:[job(null,{perDiem:75})],entries:[cd(D(1),8,'AFE-200'),cd(D(0),8,'AFE-100',{id:'late'})]}));ok(r.to==='AFE-100','2c '+T0+'…"first" means first worked, not first typed in');
   r=await wkOf(p,seed({jobs:[job(null,{perDiem:75})],entries:[H(D(0),8),H(D(1),8)]}));ok(r.to==='Harbor Line Builders','2d '+T0+'shifts with no Job # are charged to the job\'s name');
   r=await wkOf(p,two({entries:[H(D(0),5,{jobId:'jA'}),H(D(1),9,{jobId:'jB'})]}));ok(r.to==='Example Iron Works','2e '+T0+'two employers: the one with the most hours that week');
   r=await wkOf(p,seed({jobs:[job(null,{perDiem:75})],entries:[cd(D(0),4,'AFE-100'),{id:'pp',kind:'pto',date:D(1),hours:40,bucket:'v',jobId:'j1',codes:{job:'AFE-900'}}]}));ok(r.to==='AFE-100','2f '+T0+'PTO hours do not decide the charge');
   // on screen + override per week
   const lastMon=(()=>{const x=new Date(mon);x.setDate(mon.getDate()-7);return ymd(x);})(),lastTue=(()=>{const x=new Date(mon);x.setDate(mon.getDate()-6);return ymd(x);})();
   await p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},seed({jobs:[job(null,{perDiem:75})],entries:[cd(D(0),10,'AFE-100'),cd(D(1),6,'AFE-200'),cd(D(1),6,'AFE-200',{start:at(D(1),'18:30')}),{id:'pp',kind:'pto',date:D(2),hours:8,bucket:'v',jobId:'j1'},cd(lastMon,9,'AFE-700'),cd(lastTue,3,'AFE-800')]}));
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);let line=(await p.innerText('#wkPdTo')).replace(/\s+/g,' ');
   ok(/^Per diem charged to: AFE-200 · Change$/.test(line),'2g '+T0+'Timesheet week box: "Per diem charged to: AFE-200 · Change"');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pdr-1-week.png'),fullPage:true});
   ok(await p.evaluate(()=>{const e=document.getElementById('wkPdTo'),r=e.getBoundingClientRect(),b=e.querySelector('button').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+0.5&&b.height>=44&&document.documentElement.scrollWidth-innerWidth<=1;}),'2h '+T0+'the line fits the screen and "Change" is a full-size tap target');
   await p.click('[data-a=pdcharge]');await p.waitForTimeout(150);const mt=(await p.innerText('#otjModal')).replace(/\s+/g,' ');
   ok(/Charge per diem to/.test(mt)&&/AFE-100 · 10 hrs this week/.test(mt)&&/AFE-200 · 12 hrs this week · most hours/.test(mt)&&await p.evaluate(()=>document.querySelector('input[name=pdc]:checked').parentNode.innerText.indexOf('AFE-200')>=0),'2i '+T0+'"Change" lists the week\'s jobs with their hours, with the current one ticked');
   await p.evaluate(()=>{const r=Array.from(document.querySelectorAll('input[name=pdc]')).find(x=>/AFE-100/.test(x.parentNode.innerText));r.checked=true;});await p.click('#pdcSave');await p.waitForTimeout(250);line=(await p.innerText('#wkPdTo')).replace(/\s+/g,' ');let s=await st(p);
   ok(/^Per diem charged to: AFE-100 \(your choice\) · Change$/.test(line)&&s.pdCharge[D(0)].label==='AFE-100'&&Object.keys(s.pdCharge).length===1,'2j '+T0+'picking AFE-100 shows "Per diem charged to: AFE-100 (your choice)" and is saved for that week only');
   await p.click('[data-a=wprev]');await p.waitForTimeout(200);ok(/^Per diem charged to: AFE-700 · Change$/.test((await p.innerText('#wkPdTo')).replace(/\s+/g,' ')),'2k '+T0+'last week still uses its own longest-hours job (AFE-700)');
   await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);ok(/AFE-100 \(your choice\)/.test(await p.innerText('#wkPdTo'))&&await p.evaluate(wk=>OTJ.pdCharge(wk).over===true,D(0)),'2l '+T0+'the choice is still there after a reload');
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(hist.some(x=>/^Per diem charged to: AFE-200 → AFE-100 \(week of /.test(x))&&!/[{}]|object Object|undefined/.test(hist.join('')),'2m '+T0+'Change history: "Per diem charged to: AFE-200 → AFE-100 (week of …)"');
   // ── 3. CSV ──
   const {h,rows}=await csvOf(p);const gi=h.indexOf('Gross (estimate)');
   ok(h[gi+1]==='Per diem'&&h[gi+2]==='Per diem charged to'&&h[gi+3]==='OT rule','3a '+T0+'CSV has "Per diem" and "Per diem charged to" columns right after Gross (estimate)');
   const wkRows=rows.filter(r=>r.Date>=D(0)&&r.Date<=D(6)),sum=k=>wkRows.reduce((a,r)=>a+(+r[k]||0),0);const scr=x=>+x.replace(/[^\d.]/g,'');
   ok(near(sum('Per diem'),scr(await p.textContent('#wkPdAmt')))&&near(sum('Gross (estimate)')+sum('Per diem'),scr(await p.textContent('#wkGross')))&&sum('Per diem')===150,'3b '+T0+'the CSV adds up to the screen: Per diem column = $150.00, Gross + Per diem = the week\'s "Gross so far"');
   const tue=wkRows.filter(r=>r.Date===D(1)),pto=wkRows.filter(r=>r.Type==='PTO')[0];
   ok(tue.length===2&&tue[0]['Per diem']==='75'&&tue[1]['Per diem']===''&&tue[1]['Per diem charged to']===''&&pto['Per diem']===''&&wkRows.filter(r=>r['Per diem']).every(r=>r['Per diem charged to']==='AFE-100'),'3c '+T0+'the day\'s per diem is on the day\'s first shift only (two shifts on Tuesday: 75 then blank), PTO rows are blank, and the charged-to column carries the choice (AFE-100)');
   ok(rows.filter(r=>r.Date===lastMon)[0]['Per diem charged to']==='AFE-700','3d '+T0+'last week\'s rows show last week\'s job (AFE-700)');
   ok(!errs.length,'1-3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 4. "Is your per diem taxed on your pay stub?" ──
  {const {c,p,errs}=await open(seed({entries:[Wk(T,'06:00','10:00')]}));await p.click('nav.tabs [data-v=more]');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);
   ok(/Is your per diem taxed on your pay stub\?/.test(await p.textContent('#pdTaxQ'))&&await p.evaluate(()=>!document.querySelector('input[name=pdTax]:checked'))&&!(await p.$('#pdNT'))&&!(await p.$('#pdEach')),'4a '+T0+'the sheet asks "Is your per diem taxed on your pay stub?" with nothing picked for you (and no two-employer switch with one job)');
   await p.fill('#pd_0','75');await p.click('#pdSave');await p.waitForTimeout(120);ok(/Answer the question/.test(await p.textContent('#pdErr'))&&!!(await p.$('#otjModal'))&&(await st(p)).jobs[0].perDiem===undefined,'4b '+T0+'an amount cannot be saved until the question is answered');
   await p.check('#pdTaxN');await p.click('#pdSave');await p.waitForTimeout(250);let s=await st(p);
   ok(s.settings.perDiemTax==='no'&&s.settings.perDiemNT===true&&/Not taxed on your stub/.test(await p.textContent('#pdTax')),'4c '+T0+'"No" is saved and per diem is left out of the tax estimate');
   await p.click('nav.tabs [data-v=week]');const nNo=await p.textContent('#wkNet');await p.click('nav.tabs [data-v=more]');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);const pre=await p.isChecked('#pdTaxN');await p.check('#pdTaxY');await p.click('#pdSave');await p.waitForTimeout(250);await p.click('nav.tabs [data-v=week]');const nYes=await p.textContent('#wkNet');const m=x=>+x.replace(/[^\d.]/g,'');s=await st(p);
   ok(pre&&s.settings.perDiemTax==='yes'&&s.settings.perDiemNT===false&&near(m(nNo)-m(nYes),75*0.0765),'4d '+T0+'the answer is remembered; switching to "Yes" taxes it (take-home '+nNo+' → '+nYes+')');
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(hist.includes('Per diem on your stub: not answered → not taxed')&&hist.includes('Per diem on your stub: not taxed → taxed'),'4e '+T0+'Change history records the answer in plain English');
   await p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},seed({settings:SET({perDiem:50})}));await p.click('nav.tabs [data-v=more]');await p.waitForTimeout(150);
   ok(/Is it taxed on your pay stub\?/.test(await p.textContent('#pdTax')),'4f '+T0+'older setups that were never asked see the question on the Per diem card');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);ok(await p.evaluate(()=>!document.querySelector('input[name=pdTax]:checked')),'4g '+T0+'…and the sheet does not assume "taxed" for them');await p.click('#otjModal [data-close]');
   await p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},seed({settings:SET({perDiem:50,perDiemNT:true})}));await p.click('nav.tabs [data-v=more]');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);ok(await p.isChecked('#pdTaxN'),'4h '+T0+'someone who already said "not taxed" keeps that answer');
   await p.fill('#pd_0','');await p.evaluate(()=>{document.getElementById('pdTaxN').checked=false;});await p.click('#pdSave');await p.waitForTimeout(250);ok(!(await p.$('#otjModal'))&&(await st(p)).jobs[0].perDiem===0,'4i '+T0+'clearing the amount (no per diem) saves without the question');
   // the two-employer switch
   await p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},two({entries:[H(T,6,{jobId:'jA',start:at(T,'06:00')}),H(T,3,{jobId:'jB',start:at(T,'13:00')})]}));await p.click('nav.tabs [data-v=more]');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);
   ok(/My employers each pay per diem \(count both\)/.test(await p.innerText('#otjModal'))&&!(await p.isChecked('#pdEach')),'4j '+T0+'with two jobs, More → Per diem has the switch "My employers each pay per diem (count both)", off by default');
   await p.check('#pdTaxY');await p.click('#pdSave');await p.waitForTimeout(250);await p.click('nav.tabs [data-v=today]');const one=await p.textContent('#pdTodayAmt');
   await p.click('nav.tabs [data-v=more]');await p.click('[data-a=perdiem]');await p.waitForTimeout(150);await p.check('#pdEach');await p.click('#pdSave');await p.waitForTimeout(250);await p.click('nav.tabs [data-v=today]');const both=await p.textContent('#pdTodayAmt');
   ok(one==='$60.00'&&both==='$100.00'&&(await st(p)).settings.perDiemEach===true,'4k '+T0+'Today shows $60.00 with the switch off and $100.00 with it on');
   ok(!errs.length,'4 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 5. download the damaged data ──
  {const BAD='{"app":"yfs-on-the-job","v":1,"entries":[{"id":"e1","kind":"work","date":"'+T+'","sta';const {c,p,errs}=await open(null,{raw:BAD});
   ok(/couldn't be read/.test(await p.textContent('#storeNote'))&&/Download the damaged data/.test(await p.textContent('#storeRawDl')),'5a '+T0+'next to the "couldn\'t be read" note there is a "Download the damaged data" button');
   await p.evaluate(()=>{navigator.canShare=null;});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('#storeRawDl')]);let got=null;if(dl){const f=path.join(os.tmpdir(),'yfs-raw-'+dev+'.txt');await dl.saveAs(f);got=fs.readFileSync(f,'utf8');}
   ok(got===BAD&&/^yfs-clocked-in-damaged-data-\d{4}-\d\d-\d\d\.txt$/.test(dl?dl.suggestedFilename():''),'5b '+T0+'it downloads the raw copy exactly, byte for byte');
   await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.click('nav.tabs [data-v=more]');await p.evaluate(()=>{navigator.canShare=null;});
   const [dl2]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('[data-a=rawdl]')]);let got2=null;if(dl2){const f=path.join(os.tmpdir(),'yfs-raw2-'+dev+'.txt');await dl2.saveAs(f);got2=fs.readFileSync(f,'utf8');}
   ok(got2===BAD,'5c '+T0+'after starting over, the same download is still available under More → Backup + restore');
   await c.close();const y=await open(seed());await y.p.click('nav.tabs [data-v=more]');ok(!(await y.p.$('[data-a=rawdl]'))&&!(await y.p.$('#storeRawDl')),'5d '+T0+'no button when there is no damaged data');await y.c.close();
   ok(!errs.length,'5 '+T0+'no page errors '+errs.join('|').slice(0,140));}

  // ── 6. another tab's save never reloads the screen under an open form ──
  {const {c,p,errs}=await open(seed({entries:[Wk(T,'06:00','07:00')]}));const other=async extra=>{const o=await st(p);o.entries.push(Wk(T,'07:00','08:00',extra));await p.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,JSON.stringify(o)]);await back(p);};
   await p.click('nav.tabs [data-v=week]');await p.click('#sheet [data-edit]');await p.waitForTimeout(150);await p.fill('#eEnd','07:30');const scr0=await p.innerText('#sheet');await other({id:'tabB'});
   ok(live(await st(p)).length===1&&!!(await p.$('#otjModal'))&&await p.inputValue('#eEnd')==='07:30'&&(await p.innerText('#sheet'))===scr0&&await p.evaluate(()=>OTJ.store().stale),'6a '+T0+'a shift is open for editing when another tab saves: the form, what was typed and the screen behind it are left alone');
   await p.click('#otjModal [data-close]');await p.waitForTimeout(250);ok(live(await st(p)).length===2&&/7:00am–8:00am/.test(await p.innerText('#sheet'))&&await p.evaluate(()=>!OTJ.store().stale),'6b '+T0+'closing the form then brings in the other tab\'s save');
   await p.click('nav.tabs [data-v=more]');await p.click('[data-a=setup]');await p.waitForTimeout(150);await p.fill('#sRate','33');await other({id:'tabC'});
   ok(await p.inputValue('#sRate')==='33'&&live(await st(p)).length===2,'6c '+T0+'same for Pay setup: a typed rate is not wiped by another tab\'s save');
   await p.click('[data-a=cancelSetup]');await p.waitForTimeout(250);ok(live(await st(p)).length===3,'6d '+T0+'…and Cancel brings the other tab\'s save in');
   await p.click('nav.tabs [data-v=today]');await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','09:00');await p.fill('#eEnd','10:00');await p.fill('#eBrk','0');await other({id:'tabD'});const theirs=await ls(p);await p.click('#eSave');await p.waitForTimeout(250);
   ok(live(await st(p)).some(e=>!/^tab/.test(e.id)&&e.id!=='e'+0)&&(await ls(p,KEY+'_last'))===theirs&&(await toastTxt(p))[0]==='Saved ✓','6e '+T0+'if the open form is saved instead, this tab\'s save goes through and the other tab\'s version is kept as the "Undo last change" copy');
   await other({id:'tabE'});ok(live(await st(p)).some(e=>e.id==='tabE'),'6f '+T0+'with no form open, another tab\'s save still shows up right away');
   ok(!errs.length,'6 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
