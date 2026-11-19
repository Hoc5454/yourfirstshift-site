// Clocked In: prove a change does nothing for people whose saved data is normal. Opens the SAME saved data in two builds of the app (an old
// folder and a new folder), on every weekday, walks every screen and sheet, and compares what the worker would see, word for word: every
// screen's text, the export file, the change history, the pay numbers, the pay setup, and what is written to storage.
// Usage: node otj_compare_builds.js <old-root> <new-root> [days: all|YYYY-MM-DD,...] [skip: words in the names of setups to leave out, several separated by |]
//   The skip is for a change that is MEANT to alter some setups: leave those out here (they need their own test) and prove the rest are untouched.
//   Two more optional arguments for a change that is meant to be seen: [ignore: exact text removed from every screen before comparing]
//   [allow: a pattern; a difference is expected, and only counted, when the OLD build's text at that spot matches it]
//   e.g. git worktree add /tmp/live <commit that is live>  &&  node otj_compare_builds.js /tmp/live ..
// Made-up data only.
process.env.TZ='America/New_York';
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
if(!process.argv[2]||!process.argv[3]){console.log('Usage: node otj_compare_builds.js <old-root> <new-root> [days]');process.exit(2);}
const OLD=path.resolve(process.argv[2]),NEW=path.resolve(process.argv[3]);const PORT=+(process.env.CMP_PORT||18883),KEY='yfs_otj_v1';
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const serve=(ROOT,port)=>new Promise(r=>{const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});srv.listen(port,()=>r(srv));});
let fails=0,passes=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(c)passes++;else fails++;};
const pad=n=>String(n).padStart(2,'0');const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const P=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(k,n)=>{const d=P(k);d.setDate(d.getDate()+n);return ymd(d);};const at=(k,hm)=>{const p=k.split('-'),t=hm.split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1],0,0).getTime();};
const dow=k=>P(k).getDay();const weekStartOf=(k,ws)=>addDays(k,-((dow(k)-ws+7)%7));const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
// one full week, the last and first days of a year, and the Sundays US clocks change (with the Mondays after)
const ALL=['2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28','2026-12-31','2027-01-01','2026-03-08','2026-03-09','2026-11-01','2026-11-02'];
const DAYS=!process.argv[4]||process.argv[4]==='all'?ALL:process.argv[4].split(',');const SKIP=process.argv[5]||'',IGNORE=process.argv[6]||'',ALLOW=process.argv[7]?new RegExp(process.argv[7]):null;const HR1=!!process.env.OTJ_SAME_HR;   // OTJ_SAME_HR=1: read "1 hrs" and "1 hr" as the same words (one build says the first, the other the second)
const strip=v=>{if(typeof v!=='string')return v;if(HR1)v=v.replace(/\b1 hrs\b/g,'1 hr');return IGNORE?v.split(IGNORE).join('').replace(/\n{2,}/g,'\n').replace(/[ \t]+\n/g,'\n').trim():v;};
function records(T){const e=[];let n=0;for(let i=-20;i<=0;i++){const d=addDays(T,i);
    if(i===-3){e.push({id:'p'+(++n),kind:'pto',date:d,hours:8,bucket:'v',jobId:'j1'});continue;}
    if(i===-5){e.push({id:'m'+(++n),kind:'work',date:d,start:at(d,'12:00'),manualHours:9.5,breakMin:0,jobId:'j1',codeId:'',splits:[],note:''});continue;}
    if(i===-6||i===-9){e.push({id:'s'+(++n),kind:'work',date:d,start:at(d,'18:00'),end:at(d,'23:15'),breakMin:15,jobId:'j2',codeId:'',splits:[],note:'Second job',codes:{job:'DOCK-2',pay:'REG'}});}
    if(i===-11){e.push({id:'o'+(++n),kind:'work',date:d,start:at(d,'21:00'),end:at(addDays(d,1),'05:30'),breakMin:30,jobId:'j1',codeId:'',splits:[],note:'Night pour'});continue;}
    if(i===-12){e.push({id:'x'+(++n),kind:'work',date:d,start:at(d,'07:00'),end:at(d,'15:00'),breakMin:0,jobId:'j1',codeId:'',splits:[],note:'',deleted:true});continue;}
    e.push({id:'w'+(++n),kind:'work',date:d,start:at(d,i===0?'05:00':'06:30'),end:at(d,i===0?'11:30':i%4===0?'19:00':'16:30'),breakMin:30,jobId:'j1',codeId:'',splits:[],note:i===-1?'Poured footing':'',codes:i%2?{job:'AFE-100',po:'PO-7',cost:'31-200'}:undefined});}
  return e;}
const SET=(T,x)=>Object.assign({rate:28,otRate:'',period:'weekly',anchor:weekStartOf(T,1),weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
const state=(T,settings,x)=>Object.assign({app:'yfs-on-the-job',v:1,created:at(addDays(T,-60),'08:00'),settings,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},
  jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,perDiem:75},{id:'j2',name:'Dockside Pizza',rate:'19.50',otRate:'',active:true,ot:{mode:'daily',weekN:40,dayN:8,dtN:'',mult:1.5}}],codes:[],entries:records(T),
  pto:{buckets:[{id:'v',name:'Vacation',type:'perHours',earn:1,per:30,start:40,startDate:addDays(T,-60)},{id:'s',name:'Sick',type:'yearly',earn:40,start:8,startDate:addDays(T,-400)},{id:'h',name:'Holiday',type:'perPeriod',earn:2,start:0,startDate:addDays(T,-75)}]},clock:null,
  log:[{t:at(addDays(T,-2),'09:00'),id:'settings',field:'(setup)',old:'',new:'rate 28, weekly, FL',reason:''}],lastBackup:at(addDays(T,-1),'08:00'),pdCharge:{},pdDay:{[addDays(T,-2)]:false},ui:{a2hsX:1}},x||{});
// normal pay setups: every pay period x every workweek start (paid every 2 weeks: the pay period starting on each weekday), plus older saves
function cases(T){const out=[];for(const period of ['weekly','biweekly','semimonthly','monthly'])for(let ws=0;ws<7;ws++)for(const a of (period==='biweekly'?[0,1,2,3,4,5,6]:[0])){
    out.push({name:period+', workweek starts '+WD[ws]+(period==='biweekly'?', pay period starts '+WD[(ws+a)%7]+(a?' (a different weekday)':''):''),st:state(T,SET(T,{period,weekStart:ws,anchor:addDays(weekStartOf(T,ws),a-21),filing:['single','mfj','hoh'][(ws+a)%3],state:['FL','GA','TX','CA','NY','WA','PA'][ws],
      stateRate:ws===1?5:ws===3?6.5:'',otRate:ws===5?45:'',k401:ws%2?50:'',health:a%2?32.5:'',credits:ws===6?2000:'',extraWH:ws===2?25:'',perDiemNT:!!(ws%2),perDiemTax:ws%2?'no':'yes',perDiemEach:ws===4,bonus:ws===3?{basis:'all',pct:9,amount:'',jobId:'',prior:'',priorYear:''}:ws===5?{basis:'flat',pct:'',amount:1500,jobId:'',prior:'',priorYear:''}:undefined}))});}
  out.push({name:'as the first version saved it (one job, old per diem)',st:state(T,{rate:31.5,otRate:47.25,period:'weekly',anchor:weekStartOf(T,1),weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:60,perDiemNT:true},{jobs:[{id:'j1',name:'Gulf Coast Grocers',rate:'',otRate:'',active:true}]})});
  out.push({name:'with a setting this version does not know',st:state(T,SET(T,{someFutureKey:{a:[1,2]},lang:'es'}))});
  out.push({name:'brand-new user (nothing saved)',st:null});
  return out;}
// runs inside the page: load the saved data as a cold start already happened, walk everything, return what was seen
const SNAP=()=>{const out={};const cap=k=>{out[k]=document.body.innerText.replace(/[ \t ]+/g,' ').replace(/\s*\n\s*/g,'\n').trim();};
  const click=sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;};
  const shut=()=>{let g=0;while(document.getElementById('otjModal')&&g++<4)document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));};
  const step=(k,f)=>{try{f();}catch(e){out[k]='THREW '+e.message;}shut();};
  out.stored0=localStorage.getItem('yfs_otj_v1');cap('open');
  if(document.getElementById('sRate')){const v=id=>{const e=document.getElementById(id);return e?e.value:null;};out.form=JSON.stringify(['sJob','sRate','sOt','sPer','sAnchor','sWs','sState','sStRate','sFil','sK','sH','sCr','sX','sBb'].map(v));return out;}
  const tk=(d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))(new Date());
  step('clock',()=>{click('nav.tabs [data-v=today]');cap('clock');});
  for(const a of ['add','forgotin','addpto'])step('clock>'+a,()=>{if(click('[data-a='+a+']'))cap('clock>'+a);});
  step('timesheet',()=>{click('nav.tabs [data-v=week]');cap('timesheet');out.days=[...document.querySelectorAll('#sheet .tsd')].map(x=>x.dataset.day).join(',');});
  step('timesheet>math',()=>{if(click('[data-a=math]'))cap('timesheet>math');});
  step('timesheet>day',()=>{if(click('#sheet .tsd[data-day="'+tk+'"]'))cap('timesheet>day');});
  step('timesheet>shift',()=>{if(click('#sheet [data-edit]'))cap('timesheet>shift');});
  step('timesheet>pdcharge',()=>{if(click('[data-a=pdcharge]'))cap('timesheet>pdcharge');});
  for(let i=1;i<=4;i++){step('timesheet-'+i,()=>{click('[data-a=wprev]');cap('timesheet-'+i);});step('timesheet-'+i+'>math',()=>{if(click('[data-a=math]'))cap('timesheet-'+i+'>math');});}
  step('timesheet+1',()=>{for(let i=0;i<5;i++)click('[data-a=wnext]');cap('timesheet+1');for(let i=0;i<1;i++)click('[data-a=wprev]');});
  step('pto',()=>{click('nav.tabs [data-v=pto]');cap('pto');});
  step('more',()=>{click('nav.tabs [data-v=more]');cap('more');});
  for(const a of ['perdiem','logview','csv'])step('more>'+a,()=>{if(click('[data-a='+a+']'))cap('more>'+a);});
  step('more>job',()=>{if(click('[data-job]'))cap('more>job');});
  step('more>setup',()=>{if(click('[data-a=setup]')){cap('more>setup');const v=id=>{const e=document.getElementById(id);return e?e.value:null;};out.form=JSON.stringify(['sRate','sOt','sPer','sAnchor','sWs','sState','sStRate','sFil','sK','sH','sCr','sX','sBb','sBp','sBa'].map(v));click('[data-a=cancelSetup]');}});
  step('export',()=>{out.export=OTJ.buildCSV();});step('history',()=>{out.history=JSON.stringify(OTJ.logLines());});
  step('numbers',()=>{const s=OTJ.state(),o={};const first=new Date(tk.slice(0,4),+tk.slice(5,7)-1,+tk.slice(8)-45);
    for(let i=0;i<60;i++){const d=new Date(first);d.setDate(first.getDate()+i);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const pr=OTJ.periodRange(k),w=OTJ.computeWeek(k);o[k]=[pr.from,pr.to,w.tot,OTJ.weekShare(w).net];}
    o.year=OTJ.rangeTotals(tk.slice(0,4)+'-01-01',tk);o.bonus=OTJ.bonusCalc(tk);o.pto=s.pto.buckets.map(b=>OTJ.ptoBalance(b));out.numbers=JSON.stringify(o);});
  step('home',()=>{click('nav.tabs [data-v=today]');});
  const s=OTJ.state();out.settings=JSON.stringify(s.settings);out.state=JSON.stringify(s,(k,v)=>k==='ui'?undefined:v);out.stored1=localStorage.getItem('yfs_otj_v1');out.bar=(document.getElementById('storeBar')||{innerText:''}).innerText;
  return out;};
(async()=>{const PORT2=+(process.env.CMP_PORT2||18875);const s1=await serve(OLD,PORT),s2=await serve(NEW,PORT2);const b=await chromium.launch();
 const open=async(port,T)=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',timezoneId:'America/New_York',userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
   await c.addInitScript(now=>{const _D=Date;class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(now);}static now(){return now;}}window.Date=D2;},at(T,'12:00'));   // the clock is stopped at noon, so both builds see the same instant
   const p=await c.newPage();p.setDefaultTimeout(8000);const h={c,p,errs:[]};p.on('pageerror',e=>h.errs.push(e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));await p.goto('http://127.0.0.1:'+port+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());
   await p.evaluate(()=>localStorage.setItem('yfs_pro','1'));return h;};
 const snap=async(h,raw)=>{h.errs.length=0;await h.p.evaluate(([k,v])=>{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);},[KEY,raw]);await h.p.reload();await h.p.waitForFunction(()=>window.OTJ&&OTJ.tax());await h.p.waitForTimeout(40);
   const r=await h.p.evaluate(SNAP);r.errors=h.errs.join(' | ');return r;};
 let total=0,screens=0,skipped=0,allowed=0;
 for(const T of DAYS){const a=await open(PORT,T),z=await open(PORT2,T),diff=[];let n=0;
   for(const c of cases(T)){if(SKIP&&SKIP.split('|').some(x=>x&&c.name.indexOf(x)>=0)){skipped++;continue;}const raw=c.st?JSON.stringify(c.st):null;const A=await snap(a,raw),Z=await snap(z,raw);n++;total++;
     const keys=[...new Set(Object.keys(A).concat(Object.keys(Z)))];screens+=keys.length;
     for(const k of keys){const av=strip(A[k]),zv=strip(Z[k]);if(av!==zv){const x=String(av),y=String(zv);let i=0;while(i<x.length&&x[i]===y[i])i++;if(ALLOW&&ALLOW.test(x.slice(Math.max(0,i-12),i+70))){allowed++;continue;}diff.push(c.name+' · '+k+': old "'+x.slice(Math.max(0,i-40),i+60).replace(/\n/g,' / ')+'" new "'+y.slice(Math.max(0,i-40),i+60).replace(/\n/g,' / ')+'"');break;}}
     if(A.errors)diff.push(c.name+' · old build error: '+A.errors.slice(0,120));}
   ok(!diff.length,'['+WD[dow(T)]+' '+T+'] '+n+' normal saved setups look and figure exactly the same in both builds (every screen, export, history, numbers, storage) '+diff.slice(0,3).join(' || ').slice(0,900)+(diff.length>3?' … +'+(diff.length-3)+' more':''));
   await a.c.close();await z.c.close();}
 console.log(total+' saved setups compared, '+screens+' screens / files / number sets checked word for word'+(SKIP?' ('+skipped+' left out: "'+SKIP+'")':'')+(ALLOW?' ('+allowed+' expected differences matching '+ALLOW+')':''));
 await b.close();s1.close();s2.close();console.log(fails?fails+' FAIL ('+passes+' pass)':'ALL PASS ('+passes+')');process.exit(fails?1:0);})();
