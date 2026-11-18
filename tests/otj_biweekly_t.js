// Clocked In: paid every 2 weeks, with a pay period that does NOT start on the workweek's first day (workweek starts Monday, pay period
// starts Wednesday, and every other pairing). Each day must land in the pay period it really falls in, a workweek that crosses a pay-period
// boundary must be split between the two paychecks, and PTO earned "per pay period" must be earned once per pay period.
// When the two start on the same weekday nothing changes. Page clock pinned to a chosen day (US Eastern). Made-up data only.
// Usage: node otj_biweekly_t.js .. [shotDir]
process.env.TZ='America/New_York';
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18873,O='http://127.0.0.1:'+PORT,KEY='yfs_otj_v1';
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0,passes=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(c)passes++;else fails++;};
const pad=n=>String(n).padStart(2,'0');const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const P=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(k,n)=>{const d=P(k);d.setDate(d.getDate()+n);return ymd(d);};const at=(k,hm)=>{const p=k.split('-'),t=hm.split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1],0,0).getTime();};
const dow=k=>P(k).getDay();const weekStartOf=(k,ws)=>addDays(k,-((dow(k)-ws+7)%7));const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const daysBetween=(a,b)=>Math.round((P(b)-P(a))/864e5);const r2=n=>Math.round(n*100)/100;
const money=n=>'$'+r2(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
// the pay period a day falls in, figured here: 14-day blocks counted from the pay-period start date
const period=(k,anchor)=>{const n=Math.floor(daysBetween(anchor,k)/14),from=addDays(anchor,n*14);return [from,addDays(from,13)];};
// what the live build did: count from the first day of the day's workweek instead of from the day
const periodOld=(k,anchor,ws)=>period(weekStartOf(k,ws),anchor);
const SET=x=>Object.assign({rate:20,otRate:'',period:'biweekly',anchor:'2026-10-07',weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
// 8 hours, 7:00 to 3:00, every Monday to Friday for the 7 weeks up to and including day T
const shifts=T=>{const e=[];for(let i=-48;i<=0;i++){const d=addDays(T,i);if(dow(d)===0||dow(d)===6)continue;e.push({id:'w'+(i+48),kind:'work',date:d,start:at(d,'07:00'),end:at(d,'15:00'),breakMin:0,jobId:'j1',codeId:'',splits:[],note:''});}return e;};
const state=(T,settings,x)=>Object.assign({app:'yfs-on-the-job',v:1,created:at(addDays(T,-80),'08:00'),settings,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true}],codes:[],entries:shifts(T),
  pto:{buckets:[{id:'h',name:'Vacation',type:'perPeriod',earn:2,start:5,startDate:addDays(T,-75)}]},clock:null,log:[],lastBackup:at(T,'08:00'),pdCharge:{},pdDay:{},ui:{a2hsX:1}},x||{});
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 const openDay=async T=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',timezoneId:'America/New_York',userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
   await c.addInitScript(now=>{const _D=Date;const off=now-_D.now();class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;},at(T,'12:00'));
   const p=await c.newPage();p.setDefaultTimeout(8000);const h={c,p,errs:[]};p.on('pageerror',e=>h.errs.push(e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());return h;};
 const boot=async(h,st)=>{h.errs.length=0;await h.p.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,JSON.stringify(st)]);await h.p.reload();await h.p.waitForFunction(()=>window.OTJ&&OTJ.tax());await h.p.waitForTimeout(60);};

 // ── 1. The worked example: workweek starts Monday, pay period starts Wednesday, today is Friday Nov 20 ──
 {const T='2026-11-20',h=await openDay(T),st=state(T,SET());await boot(h,st);const p=h.p;
  const pr=await p.evaluate(()=>['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22'].map(k=>{const r=OTJ.periodRange(k);return k+':'+r.from+'..'+r.to;}));
  ok(pr.slice(0,2).every(x=>/:2026-11-04\.\.2026-11-17$/.test(x))&&pr.slice(2).every(x=>/:2026-11-18\.\.2026-12-01$/.test(x)),'Mon and Tue Nov 16-17 are in the pay period Nov 4 to Nov 17; Wed Nov 18 on are in the next one, Nov 18 to Dec 1 (the live build put all seven days in Nov 4 to Nov 17) '+pr.filter((x,i)=>i>1&&!/11-18\.\./.test(x)).slice(0,2).join(' '));
  const sh=await p.evaluate(()=>{const s=OTJ.state().settings,w=OTJ.computeWeek('2026-11-16'),x=OTJ.weekShare(w);return {gross:w.tot.gross,net:x.net,parts:x.parts.map(q=>({from:q.pr.from,to:q.pr.to,mine:q.mine,all:q.pt.gross+q.pt.perDiem,share:q.share,net:q.net,th:q.th.net})),a:OTJ.takeHome(1600,0,s).net,z:OTJ.takeHome(480,0,s).net,one:OTJ.takeHome(1600,0,s).net*0.5};});
  const want=r2(sh.a*0.2+sh.z*1);
  ok(sh.gross===800&&sh.parts.length===2&&sh.parts[0].from==='2026-11-04'&&sh.parts[0].mine===320&&sh.parts[0].all===1600&&Math.abs(sh.parts[0].share-0.2)<1e-9&&sh.parts[1].from==='2026-11-18'&&sh.parts[1].mine===480&&sh.parts[1].all===480&&sh.parts[1].share===1,
    'this week ($800 gross) is split between the two paychecks: $320 of the $1,600 paycheck for Nov 4-17 (20%), and all $480 so far of the paycheck for Nov 18-Dec 1 '+JSON.stringify(sh.parts.map(q=>[q.from,q.mine,q.all,r2(q.share)])));
  ok(Math.abs(sh.net-want)<0.011&&sh.parts[0].th===sh.a&&sh.parts[1].th===sh.z,'the week\'s take-home is 20% of the first paycheck plus 100% of the second: '+money(sh.a)+' × 20% + '+money(sh.z)+' = '+money(want)+' (app shows '+money(sh.net)+'; the live build figured '+money(sh.one)+', half of the first paycheck)');
  await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);const ui=await p.evaluate(()=>({net:document.getElementById('wkNet').innerText,how:(document.getElementById('wkHow')||{innerText:''}).innerText,rows:[...document.querySelectorAll('#weekCard [data-period]')].map(x=>x.innerText.replace(/\s+/g,' '))}));
  ok(ui.net==='~'+money(want)&&ui.rows.length===2&&/^Paycheck for Nov 4 – Nov 17 \$1,600\.00 gross so far/.test(ui.rows[0])&&/^Paycheck for Nov 18 – Dec 1 \$480\.00 gross so far/.test(ui.rows[1])&&/paid every 2 weeks/.test(ui.how),'Timesheet shows take-home '+ui.net+' and both paychecks: "'+ui.rows.map(x=>x.slice(0,34)).join('" and "')+'"');
  if(SHOTS)await p.screenshot({path:path.join(SHOTS,'biweekly-1-two-paychecks.png'),fullPage:true});
  await p.click('[data-a=math]');await p.waitForTimeout(150);const math=await p.evaluate(()=>[...document.querySelectorAll('#otjModal table.math tr')].map(x=>x.innerText.replace(/\s+/g,' ')));
  ok(math.some(x=>/^Paycheck for Nov 4 – Nov 17 · paid every 2 weeks/.test(x))&&math.some(x=>/^Paycheck for Nov 18 – Dec 1 · paid every 2 weeks/.test(x))&&math.some(x=>/^This week is 20% of that period's pay so far/.test(x))&&math.some(x=>/^This week is 100% of that period's pay so far/.test(x))&&math.some(x=>x==='Est. take-home for this week '+money(want)),'Show the math lists both paychecks, 20% and 100%, and ends on '+money(want));
  await p.keyboard.press('Escape');await p.waitForTimeout(100);
  // last week (Nov 9-15) sits wholly inside one pay period: one paycheck row, same as before
  await p.click('[data-a=wprev]');await p.waitForTimeout(150);const prev=await p.evaluate(()=>[...document.querySelectorAll('#weekCard [data-period]')].map(x=>x.innerText.replace(/\s+/g,' ')));
  ok(prev.length===1&&/^Paycheck for Nov 4 – Nov 17/.test(prev[0])&&!h.errs.length,'the week before sits inside one pay period and shows one paycheck, as before '+h.errs.join(' | '));
  // PTO earned per pay period: 2 hrs for each pay period that has ended since the bucket's start date
  await p.click('nav.tabs [data-v=pto]');await p.waitForTimeout(150);const start=addDays(T,-75);let n=0;for(let k=period(start,'2026-10-07')[1];k<=T;k=addDays(k,14))n++;
  const bal=await p.evaluate(()=>OTJ.ptoBalance(OTJ.state().pto.buckets[0]));const txt=await p.evaluate(()=>document.getElementById('view').innerText.replace(/\s+/g,' '));
  ok(bal.balance===5+2*n&&bal.earned===2*n&&n===6&&txt.indexOf(String(5+2*n))>=0&&!/\d,\d\d\d/.test(txt),'PTO "2 hrs per pay period": '+n+' pay periods have ended, balance is '+bal.balance+' hrs (the live build showed 4,005) ');
  if(SHOTS)await p.screenshot({path:path.join(SHOTS,'biweekly-2-pto.png')});
  await h.c.close();}

 // ── 2. Every pairing of workweek start and pay-period start, on several days: each day is inside its own pay period, and the periods tile ──
 {const wrong=[],same=[],moved=[];let checked=0;
  for(const T of ['2026-11-22','2026-11-23','2026-03-08','2026-11-01','2026-12-31']){const h=await openDay(T);
   for(let ws=0;ws<7;ws++)for(let a=0;a<7;a++){const anchor=addDays(weekStartOf(addDays(T,-35),ws),a),st=state(T,SET({weekStart:ws,anchor}));st.entries=st.entries.slice(-12);await boot(h,st);
     const got=await h.p.evaluate(([T,n])=>{const out=[],d0=new Date(+T.slice(0,4),+T.slice(5,7)-1,+T.slice(8)-60);for(let i=0;i<n;i++){const d=new Date(d0);d.setDate(d0.getDate()+i);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),r=OTJ.periodRange(k);out.push([k,r.from,r.to]);}
       return {pr:out,pto:OTJ.ptoBalance(OTJ.state().pto.buckets[0])};},[T,100]);
     const name='['+T+'] workweek starts '+WD[ws]+', pay period starts '+WD[dow(anchor)];let bad='',differs=0;
     for(const [k,from,to] of got.pr){checked++;const w=period(k,anchor);if(from!==w[0]||to!==w[1]||!(from<=k&&k<=to)||daysBetween(from,to)!==13||dow(from)!==dow(anchor)){bad=k+' → '+from+'..'+to+', expected '+w.join('..');break;}if(periodOld(k,anchor,ws)[0]!==from)differs++;}
     let n=0;const start=addDays(T,-75);for(let k=period(start,anchor)[1];k<=T;k=addDays(k,14))n++;if(!bad&&got.pto.balance!==5+2*n)bad='PTO per pay period balance '+got.pto.balance+', expected '+(5+2*n);
     if(bad)wrong.push(name+': '+bad);if(h.errs.length)wrong.push(name+': '+h.errs[0]);
     if(a===0){if(differs)same.push(name+': '+differs+' days changed');}else if(!differs)moved.push(name);}
   await h.c.close();}
  ok(!wrong.length,'all 49 pairings of workweek start and pay-period start, on 5 days ('+checked+' day checks): every day is inside its own 14-day pay period, periods start on the pay-period weekday, PTO per pay period is earned once per period '+wrong.slice(0,3).join(' || ').slice(0,700));
  ok(!same.length,'when the pay period starts on the workweek\'s first day (the default the form offers), every day lands in the same pay period as on the live build: nothing changes '+same.slice(0,3).join(' || '));
  ok(!moved.length,'when they start on different weekdays, the days after each pay-period boundary move to the right paycheck (all 42 such pairings) '+moved.slice(0,3).join(' || '));}

 // ── 3. A whole year of days, including both clock changes: no day is missed or counted twice ──
 {const T='2026-06-15',h=await openDay(T),anchor='2026-01-08',st=state(T,SET({weekStart:0,anchor}));st.entries=st.entries.slice(-5);await boot(h,st);
  const got=await h.p.evaluate(()=>{const out=[];for(let i=0;i<400;i++){const d=new Date(2025,11,15+i);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),r=OTJ.periodRange(k);out.push([k,r.from,r.to]);}return out;});
  let bad='';const starts=new Set();for(const [k,from,to] of got){const w=period(k,anchor);if(from!==w[0]||to!==w[1]){bad=k+' → '+from+'..'+to;break;}starts.add(from);}
  const list=[...starts].sort();for(let i=1;i<list.length&&!bad;i++)if(addDays(list[i-1],14)!==list[i])bad='gap between '+list[i-1]+' and '+list[i];
  ok(!bad&&list.length>=28&&!h.errs.length,'400 days in a row (Dec 2025 to Jan 2027, across both clock changes): '+list.length+' pay periods, back to back, each 14 days '+bad);await h.c.close();}

 // ── 4. The other pay periods are untouched ──
 {const T='2026-11-20',h=await openDay(T),wrong=[];
  for(const [per,want] of [['weekly',['2026-11-16','2026-11-22']],['semimonthly',['2026-11-16','2026-11-30']],['monthly',['2026-11-01','2026-11-30']]]){await boot(h,state(T,SET({period:per})));const r=await h.p.evaluate(k=>{const x=OTJ.periodRange(k);return [x.from,x.to];},T);if(r[0]!==want[0]||r[1]!==want[1])wrong.push(per+' → '+r.join('..'));}
  ok(!wrong.length&&!h.errs.length,'weekly, twice a month and monthly pay periods are figured exactly as before '+wrong.join(' || '));await h.c.close();}

 await b.close();srv.close();console.log(fails?fails+' FAIL ('+passes+' pass)':'ALL PASS ('+passes+')');process.exit(fails?1:0);})();
