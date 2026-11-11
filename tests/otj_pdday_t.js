// Clocked In: the per-day "Per diem" checkbox on the Timesheet.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_pdday_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18889,O='http://127.0.0.1:'+PORT;
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



  const load=(p,s)=>p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},s);
  const wk=p=>p.evaluate(wk=>{const w=OTJ.computeWeek(wk);return {tot:w.tot.perDiem,gross:w.tot.gross,days:w.keys.map(k=>w.days[k].perDiem)};},D(0));
  const boxes=p=>p.$$eval('#sheet [data-pdday]',b=>b.map(x=>x.checked));
  const tick=async(p,i)=>{await p.click('#sheet [data-pdday="'+D(i)+'"]');await p.waitForTimeout(220);};
  const scr=x=>+x.replace(/[^\d.]/g,'');
  const csvOf=async p=>{const t=await p.evaluate(()=>OTJ.buildCSV());const rows=csvParse(t);const h=rows[0];return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])));};
  const one=x=>seed(Object.assign({settings:SET({perDiemTax:'yes'}),jobs:[job(null,{perDiem:75})],entries:[H(D(0),10),H(D(1),8),H(D(2),8)]},x));

  {const {c,p,errs,dialogs}=await open(seed({entries:[H(D(0),10)]}));
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);ok((await boxes(p)).length===0,'1a '+T0+'no per diem set up: no checkboxes on the Timesheet');
   await load(p,one());await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);let b=await boxes(p);
   ok(b.length===7&&b.join()==='true,true,true,false,false,false,false'&&/Per diem/.test(await p.innerText('#sheet .pdchk')),'1b '+T0+'per diem set up: every day has a "Per diem" checkbox, ticked by itself on the 3 days worked and not on the others');
   ok(await p.evaluate(()=>Array.from(document.querySelectorAll('#sheet .pdchk')).every(l=>{const r=l.getBoundingClientRect(),card=document.getElementById('sheet').getBoundingClientRect(),cb=l.querySelector('input').getBoundingClientRect();return r.height>=44&&cb.width>=20&&cb.right<=card.right&&cb.left>card.left+card.width/2&&r.right<=innerWidth+0.5;})&&document.documentElement.scrollWidth-innerWidth<=1),'1c '+T0+'the checkbox sits on the right side of each day, is a full-size tap target and fits the screen');
   if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pdday-1.png'),fullPage:true});
   let w=await wk(p);ok(w.tot===225&&(await p.textContent('#wkPdAmt'))==='$225.00','1d '+T0+'before any change: 3 days × $75 = $225.00 (same as before this feature)');
   // uncheck a worked day
   const g0=scr(await p.textContent('#wkGross')),n0=scr(await p.textContent('#wkNet'));await tick(p,1);w=await wk(p);let s=await st(p);b=await boxes(p);
   ok(w.days[1]===0&&w.tot===150&&s.pdDay[D(1)]===false&&b[1]===false&&(await toastTxt(p))[0]==='Saved ✓','2a '+T0+'untick a worked day: that day pays $0 per diem, the choice is saved with the day');
   ok((await p.textContent('#wkPdAmt'))==='$150.00'&&/2 days/.test(await p.textContent('#wkPd'))&&near(g0,scr(await p.textContent('#wkGross')))&&scr(await p.textContent('#wkNet'))<n0&&!/per diem/.test(await p.innerText('#sheet .tsday:nth-child(2) .tsd')),'2b '+T0+'the week box follows: Per diem $150.00 · 2 days, Gross so far unchanged (per diem is not part of gross), take-home down, and the day row no longer shows per diem');
   await p.click('[data-a=math]');await p.waitForTimeout(150);ok(/Per diem \$150\.00/.test((await p.innerText('#otjModal')).replace(/\s+/g,' ')),'2c '+T0+'Show the math: "Per diem $150.00"');await p.click('#otjModal [data-close]');
   const pt=await p.evaluate(([a,z])=>OTJ.rangeTotals(a,z).perDiem,[D(0),D(6)]);ok(pt===150,'2d '+T0+'pay-period totals use it too ($150.00)');
   // check a day with no hours
   await tick(p,5);w=await wk(p);s=await st(p);b=await boxes(p);
   ok(w.days[5]===75&&w.tot===225&&s.pdDay[D(5)]===true&&b[5]===true&&/\$75\.00 per diem/.test(await p.innerText('#sheet .tsday:nth-child(6)'))&&!(await p.$('#sheet .tsday:nth-child(6) .tsp')),'3a '+T0+'tick a day with no hours (a travel day): it pays one $75.00 per diem and the day row shows it');
   ok((await p.textContent('#wkPdAmt'))==='$225.00'&&/3 days/.test(await p.textContent('#wkPd')),'3b '+T0+'week box: Per diem $225.00 · 3 days');
   let rows=await csvOf(p);const wr=rows.filter(r=>r.Date>=D(0)&&r.Date<=D(6)),sum=k=>wr.reduce((a,r)=>a+(+r[k]||0),0),sat=wr.filter(r=>r.Date===D(5));
   ok(sat.length===1&&sat[0].Type==='Per diem'&&sat[0]['Per diem']==='75'&&sat[0].Hours===''&&sat[0]['Per diem charged to']==='Harbor Line Builders'&&wr.filter(r=>r.Date===D(1))[0]['Per diem']===''&&sum('Per diem')===225&&near(sum('Gross (estimate)'),scr(await p.textContent('#wkGross')))&&wr.map(r=>r.Date).join()===wr.map(r=>r.Date).slice().sort().join(),'3c '+T0+'CSV: the no-hours day gets its own "Per diem" line, the unticked day is blank, rows stay in date order, and the totals match the screen');
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(hist.some(x=>/^Per diem for \w+day, \w+ \d+: on → off$/.test(x))&&hist.some(x=>/^Per diem for \w+day, \w+ \d+: off → on$/.test(x))&&!/[{}]|object Object|undefined/.test(hist.join('')),'3d '+T0+'Change history: "Per diem for Tuesday, Nov 10: on → off"');
   // back to automatic
   await tick(p,1);await tick(p,5);s=await st(p);w=await wk(p);ok(Object.keys(s.pdDay).length===0&&w.tot===225&&(await boxes(p)).join()==='true,true,true,false,false,false,false','4a '+T0+'ticking a worked day back on (and the empty day back off) returns both to automatic');
   await tick(p,2);await p.click('#sheet .tsday:nth-child(3) [data-edit]');await p.waitForTimeout(150);await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(250);await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);
   ok((await wk(p)).days[2]===0&&(await boxes(p))[2]===false,'4b '+T0+'an unticked day stays unticked when its hours change');
   // survives reload + backup/restore
   await tick(p,1);await tick(p,5);const before=await wk(p);const sv=await st(p);await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());ok(JSON.stringify(await wk(p))===JSON.stringify(before)&&(await st(p)).pdDay[D(1)]===false,'5a '+T0+'the ticks are still there after a reload');
   await p.click('nav.tabs [data-v=more]');await p.evaluate(()=>{navigator.canShare=null;});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('[data-a=backup]')]);const f1=path.join(os.tmpdir(),'yfs-pdday-'+dev+'.json');if(dl)await dl.saveAs(f1);const bk=dl?JSON.parse(fs.readFileSync(f1,'utf8')):null;
   ok(!!bk&&bk.data.pdDay[D(1)]===false&&bk.data.pdDay[D(5)]===true,'5b '+T0+'the backup file holds each day\'s choice');
   await load(p,one({entries:[]}));ok((await wk(p)).tot===0,'5c '+T0+'(records replaced with an empty week)');await p.click('nav.tabs [data-v=more]');await p.setInputFiles('#restoreFile',f1);await p.waitForTimeout(500);await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);
   ok(JSON.stringify(await wk(p))===JSON.stringify(before)&&JSON.stringify((await st(p)).pdDay)===JSON.stringify(sv.pdDay)&&JSON.stringify(await boxes(p))===JSON.stringify([true,false,false,false,false,true,false]),'5d '+T0+'restore from the backup: the same days are ticked and the per diem totals are identical');
   // Today follows today's tick
   await load(p,one({entries:[H(T,4,{start:at(T,'06:00')})]}));await p.click('nav.tabs [data-v=today]');const t1=await p.textContent('#pdTodayAmt');await p.click('nav.tabs [data-v=week]');await p.click('#sheet [data-pdday="'+T+'"]');await p.waitForTimeout(220);await p.click('nav.tabs [data-v=today]');
   ok(t1==='$75.00'&&(await p.textContent('#pdTodayAmt'))==='$0.00'&&(await p.textContent('#earnToday'))==='$112.00','6a '+T0+'Today follows it: untick today and "Per diem today" goes from $75.00 to $0.00');
   ok(!errs.length,'1-6 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // two jobs, old data, damaged values
  {const {c,p,errs}=await open(seed());const two=x=>seed(Object.assign({settings:SET({perDiemTax:'yes'}),jobs:[job(null,{id:'jA',perDiem:60}),job(null,{id:'jB',name:'Example Iron Works',perDiem:40})],entries:[H(D(0),6,{jobId:'jA'}),H(D(0),3,{jobId:'jB',start:at(D(0),'13:00')}),H(D(1),8,{jobId:'jB'})]},x));
   await load(p,two());await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);let w=await wk(p);
   ok(w.days[0]===60&&(await p.$$('#sheet .tsday:nth-child(1) [data-pdday]')).length===1&&(await boxes(p))[0]===true,'7a '+T0+'two jobs on one day: still ONE checkbox and ONE per diem ($60, the higher amount)');
   await tick(p,0);w=await wk(p);ok(w.days[0]===0&&w.days[1]===40,'7b '+T0+'unticking that day takes the one per diem off; the other day is untouched');
   await tick(p,0);await tick(p,4);w=await wk(p);ok(w.days[0]===60&&w.days[4]===60,'7c '+T0+'ticking a no-hours day with two jobs pays one per diem at the higher amount ($60)');
   await load(p,two({settings:SET({perDiemTax:'yes',perDiemEach:true}),pdDay:{[D(0)]:false,[D(4)]:true}}));w=await wk(p);ok(w.days[0]===0&&w.days[1]===40&&w.days[4]===60,'7d '+T0+'with "count both" on, an unticked day still pays $0 and a ticked empty day still pays one');
   await load(p,seed({settings:SET({perDiem:50}),entries:[H(D(0),8),H(D(1),8),{id:'pp',kind:'pto',date:D(2),hours:8,bucket:'v',jobId:'j1'}]}));w=await wk(p);const s=await st(p);
   ok(w.tot===100&&w.days[2]===0&&JSON.stringify(s.pdDay)==='{}','8a '+T0+'old data with no ticks saved pays exactly what it did ($50 a day worked, none on a PTO day)');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);await tick(p,2);ok((await wk(p)).days[2]===50,'8b '+T0+'…until changed: ticking the PTO day adds $50');
   await load(p,one({pdDay:{[D(0)]:'no',[D(1)]:0,'not-a-date':false,[D(2)]:false,[D(3)]:null}}));const s2=await st(p);w=await wk(p);
   ok(JSON.stringify(s2.pdDay)===JSON.stringify({[D(2)]:false})&&w.days[0]===75&&w.days[1]===75&&w.days[2]===0,'8c '+T0+'damaged tick values are dropped (those days go back to automatic); good ones are kept');
   ok(!errs.length,'7-8 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
