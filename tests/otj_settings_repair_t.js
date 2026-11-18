// Clocked In: damaged pay setup. Covers the Sunday/Monday crash (a saved "workweek starts on" outside the 7 real days) and every other saved
// pay-setup value that could crash, freeze or poison the numbers. Each case is opened as a fresh page load with the page clock pinned to a
// chosen day: every weekday of one week, plus the two Sundays when US clocks change and the Mondays after them (US Eastern time).
// Checks: no crash, no garbage on any screen, bad values put back to the safe choice and named in a note, shifts never touched,
// normal settings never changed. Made-up data only.
// Usage: node otj_settings_repair_t.js .. [shotDir]
process.env.TZ='America/New_York';
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18882,O='http://127.0.0.1:'+PORT,KEY='yfs_otj_v1';
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0,passes=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(c)passes++;else fails++;};
const pad=n=>String(n).padStart(2,'0');const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const P=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(k,n)=>{const d=P(k);d.setDate(d.getDate()+n);return ymd(d);};
const at=(k,hm)=>{const p=k.split('-'),t=hm.split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1],0,0).getTime();};
const dow=k=>P(k).getDay();const weekStartOf=(k,ws)=>addDays(k,-((dow(k)-ws+7)%7));
const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const short=k=>P(k).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.keys(v).sort().reduce((o,k)=>{o[k]=canon(v[k]);return o;},{}):v;
const same=(a,b)=>JSON.stringify(canon(a===undefined?null:a))===JSON.stringify(canon(b===undefined?null:b));   // same values, whatever order the keys are in
// the days every case is opened on. Sunday and Monday come first: they are the two days the live build crashed on.
const WEEK=[0,1,2,3,4,5,6].map(i=>({d:addDays('2026-11-22',i),n:WD[i]}));
const CLOCKS=[{d:'2026-03-08',n:'Sunday, clocks go forward'},{d:'2026-03-09',n:'Monday after clocks go forward'},{d:'2026-11-01',n:'Sunday, clocks go back'},{d:'2026-11-02',n:'Monday after clocks go back'}];
// made-up records around a pinned "today" T: two weeks of shifts, a PTO day, an hours-only entry, job codes, two jobs
function records(T){const e=[];let n=0;for(let i=-13;i<=0;i++){const d=addDays(T,i);
    if(i===-3){e.push({id:'p'+(++n),kind:'pto',date:d,hours:8,bucket:'v',jobId:'j1'});continue;}
    if(i===-5){e.push({id:'m'+(++n),kind:'work',date:d,start:at(d,'12:00'),manualHours:9.5,breakMin:0,jobId:'j1',codeId:'',splits:[],note:''});continue;}
    if(i===-6){e.push({id:'s'+(++n),kind:'work',date:d,start:at(d,'18:00'),end:at(d,'22:00'),breakMin:0,jobId:'j2',codeId:'',splits:[],note:'Second job'});}
    e.push({id:'w'+(++n),kind:'work',date:d,start:at(d,i===0?'05:00':'07:00'),end:at(d,i===0?'11:30':'16:30'),breakMin:30,jobId:'j1',codeId:'',splits:[],note:i===-1?'Poured footing':'',codes:i%2?{job:'AFE-100',po:'PO-7'}:undefined});}
  return e;}
const SET=(T,x)=>Object.assign({rate:28,otRate:'',period:'weekly',anchor:weekStartOf(T,1),weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
const state=(T,settings,x)=>Object.assign({app:'yfs-on-the-job',v:1,created:at(addDays(T,-40),'08:00'),settings:settings,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},
  jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,perDiem:75},{id:'j2',name:'Dockside Pizza',rate:'19.50',otRate:'',active:true,ot:{mode:'daily',weekN:40,dayN:8,dtN:'',mult:1.5}}],codes:[],entries:records(T),
  pto:{buckets:[{id:'v',name:'Vacation',type:'none',start:80,startDate:addDays(T,-40)}]},clock:null,log:[],lastBackup:at(T,'08:00'),pdCharge:{},pdDay:{},ui:{a2hsX:1}},x||{});
// settings that crash, freeze or poison the numbers on the live build (each one is a whole pay setup with one or more bad values)
const BADSETS=T=>({
  'workweek start 9 (the reported crash)':SET(T,{weekStart:9}),
  'half-filled (the edge suite\'s set)':{rate:'abc',period:'nope',state:'ZZ',filing:'?',weekStart:9},
  'workweek start "9" (text)':SET(T,{weekStart:'9'}),'workweek start 8':SET(T,{weekStart:8}),'workweek start 13':SET(T,{weekStart:13}),'workweek start -3':SET(T,{weekStart:-3}),
  'workweek start 1.5':SET(T,{weekStart:1.5}),'workweek start 1e21':SET(T,{weekStart:1e21}),'workweek start "Infinity"':SET(T,{weekStart:'Infinity'}),'workweek start missing':(()=>{const s=SET(T);delete s.weekStart;return s;})(),
  'every 2 weeks, start date "abc"':SET(T,{period:'biweekly',anchor:'abc'}),'every 2 weeks, start date 7':SET(T,{period:'biweekly',anchor:7}),'every 2 weeks, start date missing, workweek start 9':(()=>{const s=SET(T,{period:'biweekly',weekStart:9});delete s.anchor;return s;})(),
  'pay period "nope"':SET(T,{period:'nope'}),'pay period {}':SET(T,{period:{}}),'pay period 7, twice a month data':SET(T,{period:7,state:'GA',stateRate:5}),
  'hourly rate "Infinity"':SET(T,{rate:'Infinity'}),'overtime rate "Infinity"':SET(T,{otRate:'Infinity'}),'401(k) "Infinity"':SET(T,{k401:'Infinity'}),'state {}':SET(T,{state:{}}),
  'everything wrong':{rate:{},otRate:[],period:7,anchor:{},weekStart:'x',state:5,stateRate:'x',filing:[],k401:'x',health:{},credits:[],extraWH:'x',perDiem:{},perDiemNT:'no',perDiemTax:5,perDiemEach:'yes',bonus:'x'},
  'empty {}':{}});

// runs inside the page: walk every screen and sheet, report anything wrong, and return what the app now holds
const WALK=()=>{const out={bad:[]};const GARB=/.{0,40}(NaN|undefined|\[object|Infinity|Invalid Date).{0,24}/;
  const scan=w=>{const tx=document.body.innerText;const m=tx.match(GARB);if(m)out.bad.push(w+': "'+m[0].replace(/\s+/g,' ')+'"');
    const v=document.getElementById('view');if(!v||v.innerText.trim().length<20)out.bad.push(w+': blank screen');
    if(/Couldn.t load the pay tables/.test(tx))out.bad.push(w+': "couldn\'t load the pay tables" card');if(document.getElementById('viewErr'))out.bad.push(w+': "this screen hit a problem" card');
    if(window.__pwn||document.querySelector('img[src="x"]'))out.bad.push(w+': saved text ran as code');};
  const click=sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;};
  const shut=()=>{let g=0;while(document.getElementById('otjModal')&&g++<4)document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));};
  const step=(w,f)=>{try{f();}catch(e){out.bad.push(w+': threw '+e.message);}shut();};
  const tk=(d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))(new Date());out.today=tk;
  out.note=(document.getElementById('fixNote')||{innerText:''}).innerText.replace(/\s+/g,' ').trim();out.stored0=localStorage.getItem('yfs_otj_v1');
  scan('open');out.fresh=!!document.getElementById('sJob');out.lost=!!document.getElementById('setupLost');
  if(!out.fresh&&!out.lost){
    step('Clock',()=>{click('nav.tabs [data-v=today]');scan('Clock');out.clock=!!document.querySelector('[data-a=start],[data-a=stop]');});
    step('Clock > add hours',()=>{if(click('[data-a=add]'))scan('Clock > add hours');});step('Clock > forgot to clock in',()=>{if(click('[data-a=forgotin]'))scan('Clock > forgot to clock in');});step('Clock > PTO day',()=>{if(click('[data-a=addpto]'))scan('Clock > PTO day');});
    step('Timesheet',()=>{click('nav.tabs [data-v=week]');scan('Timesheet');const rows=[...document.querySelectorAll('#sheet .tsd')].map(x=>x.dataset.day);out.days=rows;out.todayRow=!!document.querySelector('#sheet .tsday.today .tsd[data-day="'+tk+'"]');
      out.wkNet=(document.getElementById('wkNet')||{innerText:''}).innerText;out.wkGross=(document.getElementById('wkGross')||{innerText:''}).innerText;});
    step('Timesheet > math',()=>{if(click('[data-a=math]')){scan('Timesheet > math');out.freq=(document.getElementById('mathFreq')||{innerText:''}).innerText;}});
    step('Timesheet > day',()=>{if(click('#sheet .tsd[data-day="'+tk+'"]')){scan('Timesheet > day');if(click('#dAdd'))scan('Timesheet > day > add');}});
    step('Timesheet > edit shift',()=>{if(click('#sheet [data-edit]'))scan('Timesheet > edit shift');});
    step('Timesheet > other weeks',()=>{if(click('[data-a=wprev]')){scan('last week');click('[data-a=wprev]');scan('2 weeks back');click('[data-a=wnext]');click('[data-a=wnext]');click('[data-a=wnext]');scan('next week');click('[data-a=wprev]');}});
    step('Timesheet > per diem charge',()=>{if(click('[data-a=pdcharge]'))scan('Timesheet > per diem charge');});
    step('PTO',()=>{click('nav.tabs [data-v=pto]');scan('PTO');});
    step('More',()=>{click('nav.tabs [data-v=more]');scan('More');});
    step('More > per diem',()=>{if(click('[data-a=perdiem]'))scan('More > per diem');});step('More > job',()=>{if(click('[data-job]'))scan('More > job');});
    step('More > change history',()=>{if(click('[data-a=logview]'))scan('More > change history');});step('More > export',()=>{if(click('[data-a=csv]'))scan('More > export');});
    step('More > pay setup',()=>{if(click('[data-a=setup]')){scan('More > pay setup');const v=id=>(document.getElementById(id)||{}).value;out.form={ws:v('sWs'),per:v('sPer'),state:v('sState'),fil:v('sFil'),rate:v('sRate'),anchor:v('sAnchor')};click('[data-a=cancelSetup]');}});
    step('export file',()=>{const c=OTJ.buildCSV();const m=c.match(GARB);if(m)out.bad.push('export file: "'+m[0]+'"');out.csvRows=c.split('\r\n').filter(Boolean).length-1;});
    step('change history text',()=>{const l=OTJ.logLines().map(x=>x.text);const m=l.join(' | ').match(GARB);if(m)out.bad.push('change history: "'+m[0]+'"');out.hist=l;});
    step('numbers',()=>{const pr=OTJ.periodRange(tk);out.period=[pr.from,pr.to];const yr=OTJ.rangeTotals(tk.slice(0,4)+'-01-01',tk);if(![yr.gross,yr.hours,yr.reg,yr.ot].every(Number.isFinite))out.bad.push('year totals are not numbers');
      const w=OTJ.computeWeek(out.days&&out.days[0]||tk),sh=OTJ.weekShare(w);out.weekKeys=w.keys;out.gross=w.tot.gross;out.net=sh.net;if(!Number.isFinite(sh.net)||!Number.isFinite(w.tot.gross))out.bad.push('take-home is not a number');});
    step('back to Clock',()=>{click('nav.tabs [data-v=today]');});}
  const s=OTJ.state(),j=x=>JSON.parse(JSON.stringify(x===undefined?null:x));
  out.settings=j(s.settings);out.entries=j(s.entries);out.jobs=j(s.jobs);out.rest=j({pto:s.pto,codes:s.codes,pdCharge:s.pdCharge,pdDay:s.pdDay,clock:s.clock,lastBackup:s.lastBackup,created:s.created});out.log=j(s.log);out.fix=j(s.ui&&s.ui.fix);
  out.stored1=localStorage.getItem('yfs_otj_v1');out.note1=(document.getElementById('fixNote')||{innerText:''}).innerText.replace(/\s+/g,' ').trim();
  return out;};

(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 // a page whose clock reads noon (US Eastern) on day T. load(raw) puts raw in storage and reloads: a real cold start with that saved data.
 const openDay=async(T,opts)=>{opts=opts||{};const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',timezoneId:'America/New_York',acceptDownloads:true,
     userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
   await c.addInitScript(now=>{const _D=Date;const off=now-_D.now();class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;},at(T,'12:00'));
   if(opts.noTax)await c.route('**/job/tax-2026.json',r=>r.abort());
   const p=await c.newPage();p.setDefaultTimeout(8000);const h={c,p,errs:[],T};p.on('pageerror',e=>h.errs.push(e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
   await p.goto(O+'/job/');if(!opts.noTax)await p.waitForFunction(()=>window.OTJ&&OTJ.tax());if(opts.pro)await p.evaluate(()=>localStorage.setItem('yfs_pro','1'));return h;};
 const boot=async(h,raw)=>{h.errs.length=0;await h.p.evaluate(([k,v])=>{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);},[KEY,raw]);await h.p.reload();await h.p.waitForFunction(()=>window.OTJ&&OTJ.tax());await h.p.waitForTimeout(60);};
 // load one saved state as a cold start and walk the app. A page that freezes is reported, closed and replaced.
 const run=async(h,st)=>{const raw=typeof st==='string'?st:JSON.stringify(st);let timer;
   const res=await Promise.race([(async()=>{await boot(h,raw);const r=await h.p.evaluate(WALK);await h.p.waitForTimeout(30);r.errs=h.errs.slice();r.raw=raw;return r;})().catch(e=>({bad:['could not finish: '+String(e.message).split('\n')[0]],errs:h.errs.slice(),raw})),
     new Promise(r=>{timer=setTimeout(()=>r({hang:true,bad:['the page froze'],errs:[],raw}),15000);})]);clearTimeout(timer);
   if(res.hang){try{await Promise.race([h.c.close(),new Promise(r=>setTimeout(r,3000))]);}catch(_){}const n=await openDay(h.T);h.c=n.c;h.p=n.p;h.errs=n.errs;}
   return res;};
 const problems=r=>[].concat(r.errs.map(e=>'error: '+e),r.bad);

 // ── 1. The reported crash: damaged pay setup opens on every weekday (it used to throw on Sundays and Mondays) ──
 for(const day of WEEK.concat(CLOCKS)){const T=day.d,h=await openDay(T),sets=BADSETS(T),wrong=[];let n=0;
   for(const name of Object.keys(sets)){const st=state(T,sets[name]);const r=await run(h,st);n++;const pr=problems(r);
     if(!r.hang){if(!r.clock)pr.push('Clock tab has no Start button');if(!(r.days&&r.days.length===7&&r.todayRow&&r.days.indexOf(T)>=0))pr.push('Timesheet does not show today in a 7-day week');
       if(!same(r.entries,st.entries))pr.push('shifts changed');if(r.csvRows!==st.entries.length)pr.push('export has '+r.csvRows+' rows for '+st.entries.length+' shifts');
       if(!(r.settings&&[0,1,2,3,4,5,6].indexOf(r.settings.weekStart)>=0&&['weekly','biweekly','semimonthly','monthly'].indexOf(r.settings.period)>=0))pr.push('pay setup not repaired');
       if(!/couldn't be read/.test(r.note))pr.push('no note about the reset');}
     if(pr.length)wrong.push(name+' → '+pr.slice(0,3).join('; '));}
   ok(!wrong.length,'['+day.n+' '+short(T)+'] '+n+' damaged pay setups open with no error, on every screen, with every shift kept '+wrong.slice(0,4).join(' || ').slice(0,700));
   // the edge suite's own damaged sets, built around this day
   process.env.OTJ_DAY=T;delete require.cache[require.resolve('./otj_damaged_sets.js')];const SH=require('./otj_damaged_sets.js');delete process.env.OTJ_DAY;const wrong2=[];let m=0;
   for(const name of Object.keys(SH.CASES)){if(/5,000 entries/.test(name)&&day!==WEEK[0]&&day!==WEEK[1])continue;const r=await run(h,SH.CASES[name]);m++;const pr=problems(r);if(pr.length)wrong2.push(name+' → '+pr.slice(0,2).join('; '));}
   ok(!wrong2.length,'['+day.n+' '+short(T)+'] the edge suite\'s '+m+' damaged data sets open with no error on every screen '+wrong2.slice(0,4).join(' || ').slice(0,700));
   await h.c.close();}

 // ── 2. What each bad value is put back to, and what the note says ──
 {const T='2026-11-22',h=await openDay(T),KEEP={keep:1},GONE={gone:1},mon=weekStartOf(T,1);
  // [field, saved value, repaired value, words the note must hold (null = fixed quietly, nothing the worker sees changes)]
  const ROWS=[
   ['weekStart',9,2,'workweek start (now Tuesday)'],['weekStart',8,1,'workweek start (now Monday)'],['weekStart',13,6,'workweek start (now Saturday)'],['weekStart',7,0,'workweek start (now Sunday)'],
   ['weekStart',-1,6,'workweek start (now Saturday)'],['weekStart',-3,4,'workweek start (now Thursday)'],['weekStart','9',2,'workweek start (now Tuesday)'],['weekStart','3',3,null],
   ['weekStart',1.5,0,'workweek start (now Sunday)'],['weekStart',null,0,'workweek start (now Sunday)'],['weekStart','abc',0,'workweek start (now Sunday)'],['weekStart',true,1,'workweek start (now Monday)'],
   ['weekStart',{},0,'workweek start (now Sunday)'],['weekStart','Infinity',0,'workweek start (now Sunday)'],['weekStart',GONE,0,'workweek start (now Sunday)'],
   ['weekStart',0,KEEP,null],['weekStart',1,KEEP,null],['weekStart',2,KEEP,null],['weekStart',3,KEEP,null],['weekStart',4,KEEP,null],['weekStart',5,KEEP,null],['weekStart',6,KEEP,null],
   ['period','nope','weekly','pay period (now weekly)'],['period',7,'weekly','pay period (now weekly)'],['period',null,'weekly','pay period (now weekly)'],['period',{},'weekly','pay period (now weekly)'],['period','Weekly','weekly','pay period (now weekly)'],['period',GONE,'weekly','pay period (now weekly)'],
   ['period','weekly',KEEP,null],['period','biweekly',KEEP,null],['period','semimonthly',KEEP,null],['period','monthly',KEEP,null],
   ['anchor','abc',KEEP,null],['anchor',7,KEEP,null],   // not paid every 2 weeks: the start date is not used, so it is left alone
   ['state','ZZ','','state (choose it again)'],['state',5,'','state (choose it again)'],['state',null,'','state (choose it again)'],['state','fl','','state (choose it again)'],['state',GONE,'','state (choose it again)'],['state','',KEEP,null],['state','TX',KEEP,null],['state','DC',KEEP,null],
   ['filing','?','single','filing status (now Single)'],['filing',null,'single','filing status (now Single)'],['filing','MFJ','single','filing status (now Single)'],['filing','mfj',KEEP,null],['filing','hoh',KEEP,null],
   ['rate','abc','','hourly rate (enter it again)'],['rate',null,'','hourly rate (enter it again)'],['rate',0,'','hourly rate (enter it again)'],['rate',-5,'','hourly rate (enter it again)'],['rate',true,'','hourly rate (enter it again)'],
   ['rate',{},'','hourly rate (enter it again)'],['rate','Infinity','','hourly rate (enter it again)'],['rate',GONE,'','hourly rate (enter it again)'],['rate','28',28,null],['rate',' 31 ',31,null],['rate','$28.50',28.5,'hourly rate (now $28.50)'],['rate',31.75,KEEP,null],
   ['otRate','x','','overtime rate (blank now)'],['otRate',-1,'','overtime rate (blank now)'],['otRate','Infinity','','overtime rate (blank now)'],['otRate',null,KEEP,null],['otRate','',KEEP,null],['otRate','42',42,null],['otRate',47.25,KEEP,null],
   ['stateRate','x','','state tax rate (blank now)'],['stateRate','4.5',4.5,null],['stateRate',5,KEEP,null],
   ['k401','x','','401(k) (blank now)'],['k401',{},'','401(k) (blank now)'],['k401','$1,200.50',1200.5,'401(k) (now $1,200.50)'],['k401',50,KEEP,null],
   ['health',-500,'','health insurance (blank now)'],['health',32.5,KEEP,null],['credits',-1e6,'','W-4 credits (blank now)'],['credits',2000,KEEP,null],['extraWH','x','','extra withholding (blank now)'],['extraWH',25,KEEP,null],
   ['perDiem',{},'','per diem (blank now)'],['perDiem',60,KEEP,null],
   ['perDiemNT','no',false,'per diem tax answer (asked again)'],['perDiemNT',1,false,'per diem tax answer (asked again)'],['perDiemNT',0,false,null],['perDiemNT',true,KEEP,null],
   ['perDiemTax',5,'','per diem tax answer (asked again)'],['perDiemTax','maybe','','per diem tax answer (asked again)'],['perDiemTax','yes',KEEP,null],['perDiemTax','',KEEP,null],
   ['perDiemEach','yes',false,'per diem with two jobs (now one a day)'],['perDiemEach',0,false,null],['perDiemEach',true,KEEP,null],
   ['someFutureKey',{a:[1,2]},KEEP,null]];
  const wrong=[];let n=0;
  for(const [f,v,want,words] of ROWS){const s=SET(T);if(v===GONE)delete s[f];else s[f]=v;const st=state(T,s),r=await run(h,st);n++;const exp=JSON.parse(JSON.stringify(s));if(want!==KEEP)exp[f]=want;
    const got=Object.assign({},r.settings||{});delete got.bonus;const tag=f+'='+(v===GONE?'(missing)':JSON.stringify(v)),pr=problems(r);
    if(!same(got,exp))pr.push('repaired to '+JSON.stringify((r.settings||{})[f])+', expected '+JSON.stringify(want===KEEP?v:want));
    if(words){if(r.note.indexOf(words)<0)pr.push('note does not say "'+words+'": '+r.note.slice(0,120));if(!(r.fix&&r.fix.length===1))pr.push('note lists '+(r.fix||[]).length+' things');
      if(!(r.log.length===1&&r.log[0].id==='settings'&&r.log[0].field==='(repaired)'&&r.log[0].new===words&&same(JSON.parse(r.log[0].old),JSON.parse(JSON.stringify(s)))))pr.push('change history does not keep the old values');}
    else{if(r.note)pr.push('a note is shown for a value that needed none: '+r.note.slice(0,100));if(r.log.length||r.fix)pr.push('change history / note list touched');}
    if(!same(r.entries,st.entries)||!same(r.jobs.map(j=>j.id+j.name+j.rate+j.perDiem),st.jobs.map(j=>j.id+j.name+j.rate+j.perDiem)))pr.push('shifts or jobs changed');
    if(r.stored0!==r.raw)pr.push('storage was rewritten while loading');
    if(pr.length)wrong.push(tag+' → '+pr.slice(0,2).join('; '));}
  ok(!wrong.length,n+' saved values: each bad one goes back to the safe choice and is named in the note; each good one is left exactly as saved '+wrong.slice(0,5).join(' || ').slice(0,900));
  // paid every 2 weeks: a start date that can't be read becomes the start of this workweek; one that can be read is kept
  const wrong2=[];for(const [v,keep] of [['abc',0],[7,0],[{},0],[null,0],['',0],['2026-11-24T00:00:00Z',0],['not-a-date',0],[GONE,0],['2026-10-05',1],['2019-01-07',1],['2026-02-30',1]]){   // the kept ones are Mondays, like the workweek (Feb 30 rolls over to Monday Mar 2, as it always did)
    const s=SET(T,{period:'biweekly'});if(v===GONE)delete s.anchor;else s.anchor=v;const r=await run(h,state(T,s)),pr=problems(r),want=keep?v:mon;
    if(!(r.settings&&r.settings.anchor===want))pr.push('start date is '+JSON.stringify(r.settings&&r.settings.anchor)+', expected '+want);
    if(keep?!!r.note:r.note.indexOf('pay period start date (now '+short(mon)+')')<0)pr.push('note: '+(r.note||'(none)').slice(0,110));
    if(r.period&&!(r.period[0]<=T&&T<=r.period[1]&&addDays(r.period[0],13)===r.period[1]))pr.push('today is not inside a 14-day pay period: '+r.period);
    if(pr.length)wrong2.push(JSON.stringify(v===GONE?'(missing)':v)+' → '+pr.slice(0,2).join('; '));}
  ok(!wrong2.length,'paid every 2 weeks: an unreadable start date becomes the start of this workweek (it used to freeze the page); a readable one is kept '+wrong2.slice(0,4).join(' || ').slice(0,700));
  // the two per diem answers always agree, so the pay math and the words on the card can't say different things
  const pdA=await run(h,state(T,SET(T,{perDiemTax:'yes',perDiemNT:true}))),pdB=await run(h,state(T,SET(T,{perDiemTax:'no',perDiemNT:false}))),pdC=await run(h,state(T,SET(T,{perDiemTax:'no',perDiemNT:true}))),pdD=await run(h,state(T,SET(T,{perDiemNT:true})));
  ok(pdA.settings.perDiemNT===false&&pdA.note.indexOf('per diem tax answer (now: taxed)')>=0&&pdB.settings.perDiemNT===true&&pdB.note.indexOf('per diem tax answer (now: not taxed)')>=0&&!pdC.note&&same(pdC.settings.perDiemNT,true)&&!pdD.note&&pdD.settings.perDiemNT===true&&pdD.settings.perDiemTax===undefined,
    'per diem: the stub answer wins when the two saved answers disagree; answers that agree (and the older single switch) are left alone');
  // unknown pay period: the math says 52 paychecks a year and take-home is a real number (it used to say "undefined paychecks" and NaN)
  const up=await run(h,state(T,SET(T,{period:'nope'})));ok(/weekly/.test(up.freq)&&/\(52 paychecks a year\)/.test(up.freq)&&Number.isFinite(up.net)&&up.net>0&&/^~\$[\d,]+\.\d\d$/.test(up.wkNet),'unknown pay period: figured as weekly, 52 paychecks a year, take-home '+up.wkNet+' '+problems(up).join('; '));
  await h.c.close();}

 // ── 3. Workweek start 9: the weeks are the same Tuesday weeks the app already showed Tuesday to Saturday, now on Sunday and Monday too ──
 {const wrong=[];for(const day of WEEK){const T=day.d,h=await openDay(T);const r9=await run(h,state(T,SET(T,{weekStart:9}))),r2=await run(h,state(T,SET(T,{weekStart:2})));const tue=weekStartOf(T,2),keys=[0,1,2,3,4,5,6].map(i=>addDays(tue,i));
    if(!same(r9.days,keys)||!same(r9.weekKeys,keys))wrong.push(day.n+': week shown is '+(r9.days||[]).join(',')+', expected the week of '+tue);
    if(!same(r9.days,r2.days)||r9.gross!==r2.gross||r9.net!==r2.net||r9.wkGross!==r2.wkGross||r9.wkNet!==r2.wkNet||!same(r9.period,r2.period))wrong.push(day.n+': numbers differ from a real Tuesday setup ('+r9.wkGross+' / '+r9.wkNet+' vs '+r2.wkGross+' / '+r2.wkNet+')');
    if(!(r9.form&&r9.form.ws==='2'))wrong.push(day.n+': Pay setup shows workweek start '+(r9.form&&r9.form.ws));await h.c.close();}
  ok(!wrong.length,'workweek start 9 behaves exactly like Tuesday on all 7 days: same week, same gross, same take-home, and Pay setup shows Tuesday '+wrong.slice(0,4).join(' || ').slice(0,600));}

 // ── 4. Normal pay setups are never changed, on any weekday ──
 {const wrong=[];let n=0;for(const day of WEEK.concat(CLOCKS)){const T=day.d,h=await openDay(T);
   const list=[];for(const period of ['weekly','biweekly','semimonthly','monthly'])for(let ws=0;ws<7;ws++)for(const a of (period==='biweekly'?[0,1,2,3,4,5,6]:[0])){
     list.push({name:period+' ws='+ws+(period==='biweekly'?' start+'+a:''),ws,period,s:SET(T,{period,weekStart:ws,anchor:addDays(weekStartOf(T,ws),a-21),filing:['single','mfj','hoh'][(ws+a)%3],state:['FL','GA','TX','CA','NY','WA','PA'][ws],stateRate:ws===1?5:ws===3?6.5:'',k401:ws%2?50:'',health:a%2?32.5:'',perDiemNT:!!(ws%2),perDiemTax:ws%2?'no':'yes',perDiemEach:ws===4,bonus:ws===3?{basis:'all',pct:9,amount:'',jobId:'',prior:'',priorYear:''}:undefined})});}
   list.push({name:'as the first version saved it',ws:1,period:'weekly',s:{rate:31.5,otRate:47.25,period:'weekly',anchor:weekStartOf(T,1),weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:60,perDiemNT:true}});
   list.push({name:'with a setting this version does not know',ws:1,period:'weekly',s:SET(T,{someFutureKey:{a:[1,2]},lang:'es'})});
   for(const c of list){const st=state(T,c.s),r=await run(h,st);n++;const pr=problems(r),got=Object.assign({},r.settings);if(c.s.bonus===undefined)delete got.bonus;
     if(!same(got,JSON.parse(JSON.stringify(c.s))))pr.push('pay setup changed: '+JSON.stringify(got).slice(0,160));
     if(r.note||r.note1||r.fix||r.log.length)pr.push('a note or change-history line appeared');
     if(r.stored0!==r.raw)pr.push('storage was rewritten while loading');
     if(!same(r.entries,st.entries)||!same(r.rest,JSON.parse(JSON.stringify({pto:st.pto,codes:st.codes,pdCharge:st.pdCharge,pdDay:st.pdDay,clock:st.clock,lastBackup:st.lastBackup,created:st.created})))||!same(r.jobs.map(j=>[j.id,j.name,j.rate,j.otRate,j.active,j.perDiem]),st.jobs.map(j=>[j.id,j.name,j.rate,j.otRate,j.active,j.perDiem])))pr.push('records changed');
     // the week and pay period, figured here outside the app, by the same rules the live build uses
     const wk=weekStartOf(T,c.ws),keys=[0,1,2,3,4,5,6].map(i=>addDays(wk,i));if(!same(r.days,keys))pr.push('week shown '+(r.days||[]).slice(0,1)+'…, expected '+wk);
     let per;if(c.period==='weekly')per=[wk,addDays(wk,6)];else if(c.period==='biweekly'){const diff=Math.round((P(wk)-P(c.s.anchor))/864e5),a2=addDays(c.s.anchor,Math.floor(diff/14)*14);per=[a2,addDays(a2,13)];}
     else{const d=P(T),y=d.getFullYear(),mo=d.getMonth();per=c.period==='monthly'?[ymd(new Date(y,mo,1)),ymd(new Date(y,mo+1,0))]:d.getDate()<=15?[ymd(new Date(y,mo,1)),ymd(new Date(y,mo,15))]:[ymd(new Date(y,mo,16)),ymd(new Date(y,mo+1,0))];}
     if(!same(r.period,per))pr.push('pay period '+r.period+', expected '+per);
     if(pr.length)wrong.push('['+day.n+'] '+c.name+' → '+pr.slice(0,2).join('; '));}
   await h.c.close();}
  ok(!wrong.length,n+' normal pay setups (every pay period × every workweek start × every 2-week start day) on 11 days: nothing changed, nothing written, no note, right week and pay period '+wrong.slice(0,4).join(' || ').slice(0,800));}

 // ── 5. The note: stays until the worker answers it, never repeats itself, and the fix is saved once ──
 {const T='2026-11-23',st=state(T,SET(T,{weekStart:9,period:'nope'})),raw=JSON.stringify(st);let h=await openDay(T,{pro:true});await boot(h,raw);const p=h.p;
  const note=()=>p.evaluate(()=>{const e=document.getElementById('fixNote');return e?e.innerText.replace(/\s+/g,' ').trim():'';});const S=()=>p.evaluate(()=>JSON.parse(JSON.stringify(OTJ.state())));const ls=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  let t=await note();ok(/^Part of your pay setup couldn't be read, so it was put back to a safe choice: pay period \(now weekly\); workweek start \(now Tuesday\)\. Your hours were not changed\./.test(t),'Monday, damaged setup: the note says what was reset and that hours were not changed: "'+t.slice(0,150)+'"');
  const sz=await p.evaluate(()=>['fixSetup','fixOk'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];}));
  ok(sz.every(x=>x[1]>=44&&x[0]>=44),'the note\'s two buttons are full-size tap targets ('+sz.map(x=>x.join('×')).join(', ')+')');if(SHOTS)await p.screenshot({path:path.join(SHOTS,'repair-1-note.png')});
  ok(await p.evaluate(([k,r])=>localStorage.getItem(k)===r,[KEY,raw]),'opening the app does not write anything by itself');
  await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());let s=await S();
  ok(s.log.length===1&&s.ui.fix.length===2&&(await note())===t,'reopening twice before anything is saved: still one note, one change-history line');
  await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);let d=await ls();
  ok(d.settings.weekStart===2&&d.settings.period==='weekly'&&same(d.entries,st.entries)&&d.log.length===1&&same(d.ui.fix,['pay period (now weekly)','workweek start (now Tuesday)']),'first save (switching tabs): the repaired setup is stored, every shift is stored unchanged');
  await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());s=await S();ok((await note())===t&&s.log.length===1,'reopen after it was saved: the note is still there until answered; no second change-history line');
  await p.click('nav.tabs [data-v=more]');await p.click('[data-a=logview]');await p.waitForTimeout(150);const hist=await p.evaluate(()=>[...document.querySelectorAll('#hist li')].map(x=>x.innerText));
  ok(hist.length===1&&/Pay setup couldn't be read and was put back to a safe choice: pay period \(now weekly\); workweek start \(now Tuesday\)$/.test(hist[0]),'Change history has the line: "'+hist[0]+'"');await p.keyboard.press('Escape');await p.waitForTimeout(100);
  await p.tap('#fixOk');await p.waitForTimeout(150);d=await ls();ok(!(await note())&&d.ui.fix===undefined&&d.settings.weekStart===2,'Got it: the note goes away and stays repaired');
  await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());s=await S();ok(!(await note())&&s.log.length===1&&same(s.entries,st.entries)&&!h.errs.length,'reopen after Got it: no note, nothing repaired twice, every shift still there '+h.errs.join(' | '));
  await h.c.close();
  // Check pay setup → the form shows the repaired values → Save clears the note
  h=await openDay(T);await boot(h,raw);const q=h.p;await q.tap('#fixSetup');await q.waitForTimeout(200);
  const form=await q.evaluate(()=>({ws:document.getElementById('sWs').value,per:document.getElementById('sPer').value,rate:document.getElementById('sRate').value,st:document.getElementById('sState').value,lost:!!document.getElementById('setupLost'),job:!!document.getElementById('sJob')}));
  ok(form.ws==='2'&&form.per==='weekly'&&form.rate==='28'&&form.st==='FL'&&!form.lost&&!form.job,'Check pay setup opens Pay setup showing the repaired values (Tuesday, Weekly)');
  await q.selectOption('#sWs','1');await q.tap('[data-a=saveSetup]');await q.waitForTimeout(250);d=await q.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  ok(!(await q.evaluate(()=>!!document.getElementById('fixNote')))&&d.settings.weekStart===1&&d.ui.fix===undefined&&same(d.entries,st.entries)&&d.jobs.length===2&&!h.errs.length,'saving Pay setup clears the note; the choice is saved; shifts and both jobs untouched '+h.errs.join(' | '));
  await h.c.close();}

 // ── 6. The whole pay setup is unreadable: the worker is told, enters it again, and keeps every job and shift ──
 {const T='2026-11-22';const wrong=[];for(const bad of [null,'x',5,[],true]){const h=await openDay(T),st=state(T,bad),r=await run(h,st),pr=problems(r);
    if(!r.lost||r.fresh)pr.push('did not show the "enter it again" setup');if(!same(r.entries,st.entries)||r.jobs.length!==2)pr.push('records changed');if(pr.length)wrong.push(JSON.stringify(bad)+' → '+pr.join('; '));await h.c.close();}
  ok(!wrong.length,'pay setup saved as null / text / a number / a list: the app opens on "enter it again", shifts and jobs kept '+wrong.join(' || ').slice(0,500));
  const h=await openDay(T),st=state(T,null);await boot(h,JSON.stringify(st));const p=h.p;const txt=await p.evaluate(()=>document.getElementById('setupLost').innerText.replace(/\s+/g,' '));
  ok(/Your pay setup couldn't be read, so enter it again\. Your hours, jobs and PTO are still here\./.test(txt)&&await p.evaluate(()=>!document.getElementById('sJob')&&document.querySelector('[data-a=saveSetup]').innerText==='Save'&&document.getElementById('sState').value===''&&!document.querySelector('[data-a=cancelSetup]')),'lost setup: says so in plain words; no job-name box; the state is not guessed');
  if(SHOTS)await p.screenshot({path:path.join(SHOTS,'repair-2-lost-setup.png')});
  await p.fill('#sRate','30');await p.tap('[data-a=saveSetup]');await p.waitForTimeout(200);let toast=await p.evaluate(()=>{const t=document.querySelector('.toast');return t?t.innerText:'';});
  ok(/Choose the state you work in/.test(toast)&&await p.evaluate(()=>OTJ.state().settings===null),'lost setup: Save asks for the state instead of guessing one');
  await p.selectOption('#sState','GA');await p.tap('[data-a=saveSetup]');await p.waitForTimeout(250);const d=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  ok(d.settings&&d.settings.rate===30&&d.settings.state==='GA'&&d.jobs.length===2&&same(d.jobs.map(j=>[j.id,j.name,j.rate,j.otRate,j.active,j.perDiem]),st.jobs.map(j=>[j.id,j.name,j.rate,j.otRate,j.active,j.perDiem]))&&d.jobs[0].perDiem===75&&d.jobs[1].rate==='19.50'&&d.jobs[1].ot.mode==='daily'&&d.jobs[0].ot.mode==='weekly'&&same(d.entries,st.entries)&&!h.errs.length,
    'lost setup saved again: both jobs keep their ids, rates, per diem and overtime rules; every shift kept '+h.errs.join(' | '));
  ok(await p.evaluate(()=>!!document.querySelector('[data-a=start]')&&!document.getElementById('setupLost')),'then the Clock tab opens, ready to clock in');await h.c.close();
  // a brand-new user is unchanged: the normal first-run setup
  const n=await openDay(T);await boot(n,null);const fr=await n.p.evaluate(()=>({job:!!document.getElementById('sJob'),lost:!!document.getElementById('setupLost'),st:document.getElementById('sState').value,btn:document.querySelector('[data-a=saveSetup]').innerText,ws:document.getElementById('sWs').value,opt0:document.getElementById('sState').options[0].value}));
  await n.p.fill('#sJob','Gulf Coast Grocers');await n.p.fill('#sRate','28');await n.p.tap('[data-a=saveSetup]');await n.p.waitForTimeout(250);const blocked=await n.p.evaluate(k=>localStorage.getItem(k)===null&&/Choose the state you work in/.test((document.querySelector('.toast')||{innerText:''}).innerText),KEY);
  await n.p.selectOption('#sState','TX');await n.p.tap('[data-a=saveSetup]');await n.p.waitForTimeout(250);const nd=await n.p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  ok(fr.job&&!fr.lost&&fr.st===''&&fr.opt0===''&&fr.btn==='Start tracking'&&fr.ws==='1'&&blocked&&nd.jobs.length===1&&nd.jobs[0].name==='Gulf Coast Grocers'&&nd.settings.rate===28&&nd.settings.state==='TX'&&nd.settings.weekStart===1&&nd.ui.fix===undefined&&nd.log.length===1&&!n.errs.length,'a brand-new user gets the normal first-run setup; no state is guessed, Start tracking asks for it, and then it saves as before '+n.errs.join(' | '));await n.c.close();}

 // ── 7. Safety net: a screen that fails to draw shows an honest card with Back up, and the error is still reported ──
 {const T='2026-11-22',h=await openDay(T);await boot(h,JSON.stringify(state(T,SET(T))));const p=h.p;
  await p.evaluate(()=>{window.__keep=OTJ.state().entries;OTJ.state().entries=null;});await p.tap('nav.tabs [data-v=week]');await p.waitForTimeout(200);
  const card=await p.evaluate(()=>{const e=document.getElementById('viewErr');return e?e.innerText.replace(/\s+/g,' '):'';});
  ok(/This screen hit a problem/.test(card)&&/Your hours are still saved on this phone/.test(card)&&/Back up now/.test(card)&&/Try again/.test(card)&&h.errs.length>=1,'a screen that can\'t be drawn shows "This screen hit a problem" with Back up now and Try again; the error still reaches the console ('+h.errs.length+')');
  await p.evaluate(()=>{OTJ.state().entries=window.__keep;});await p.tap('nav.tabs [data-v=today]');await p.waitForTimeout(150);
  ok(await p.evaluate(()=>!document.getElementById('viewErr')&&!!document.querySelector('[data-a=start]')),'the tabs keep working: once the data is readable again the Clock tab draws normally');await h.c.close();
  // "couldn't load the pay tables" is shown when the pay tables really can't be loaded, and only then
  const n=await openDay(T,{noTax:true});await n.p.waitForTimeout(500);const tx=await n.p.evaluate(()=>document.getElementById('view').innerText);
  ok(/Couldn't load the pay tables/.test(tx)&&!(await n.p.evaluate(()=>!!document.getElementById('viewErr'))),'pay tables blocked: the "couldn\'t load the pay tables" card is shown (and only then: section 1 checks it never shows for damaged setup)');await n.c.close();}

 await b.close();srv.close();console.log(fails?fails+' FAIL ('+passes+' pass)':'ALL PASS ('+passes+')');process.exit(fails?1:0);})();
