// Clocked In: the money has to agree with itself. For many normal pay setups, on many days, this checks that the same numbers come out
// every way the app can add them up: days add up to the week, weeks add up to the pay period and to the year, the export file adds up to
// the screen, a week's take-home shares add up to the paycheck, every day sits inside exactly one pay period, and PTO adds up.
// Page clock pinned to a chosen day (US Eastern). Made-up data only.
// Usage: node otj_invariants_t.js .. [days: all|YYYY-MM-DD,...]
process.env.TZ='America/New_York';
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const PORT=18872,O='http://127.0.0.1:'+PORT,KEY='yfs_otj_v1';
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0,passes=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(c)passes++;else fails++;};
const pad=n=>String(n).padStart(2,'0');const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const P=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(k,n)=>{const d=P(k);d.setDate(d.getDate()+n);return ymd(d);};const at=(k,hm)=>{const p=k.split('-'),t=hm.split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1],0,0).getTime();};
const dow=k=>P(k).getDay();const weekStartOf=(k,ws)=>addDays(k,-((dow(k)-ws+7)%7));const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ALL=['2026-11-22','2026-11-23','2026-11-25','2026-11-28','2026-12-31','2027-01-01','2026-03-08','2026-03-09','2026-11-01','2026-11-02','2026-02-28','2026-07-15'];
const DAYS=!process.argv[3]||process.argv[3]==='all'?ALL:process.argv[3].split(',');
// 10 weeks of made-up work: long days (overtime), a second job with a daily-overtime rule, an overnight shift, PTO, hours-only entries, a deleted shift, codes
function records(T){const e=[];let n=0;for(let i=-70;i<=0;i++){const d=addDays(T,i),w=dow(d);
    if(i%23===-3){e.push({id:'p'+(++n),kind:'pto',date:d,hours:8,bucket:'v',jobId:'j1'});continue;}
    if(i%17===-5){e.push({id:'m'+(++n),kind:'work',date:d,start:at(d,'12:00'),manualHours:9.5,breakMin:0,jobId:'j1',codeId:'',splits:[],note:''});continue;}
    if(w===6||i%9===-6){e.push({id:'s'+(++n),kind:'work',date:d,start:at(d,'17:00'),end:at(d,i%2?'23:15':i%4===0?'23:59':'22:30'),breakMin:15,jobId:'j2',codeId:'',splits:[],note:'Second job',codes:{job:'DOCK-2',pay:'REG'}});if(w===6)continue;}
    if(i%29===-11){e.push({id:'o'+(++n),kind:'work',date:d,start:at(d,'21:00'),end:at(addDays(d,1),'05:30'),breakMin:30,jobId:'j1',codeId:'',splits:[],note:'Night pour'});continue;}
    if(i%31===-12){e.push({id:'x'+(++n),kind:'work',date:d,start:at(d,'07:00'),end:at(d,'15:00'),breakMin:0,jobId:'j1',codeId:'',splits:[],note:'',deleted:true});continue;}
    if(w===0&&i%2)continue;
    e.push({id:'w'+(++n),kind:'work',date:d,start:at(d,i===0?'05:00':'06:30'),end:at(d,i===0?'11:30':i%4===0?'19:45':'16:30'),breakMin:30,jobId:'j1',codeId:'',splits:[],note:i===-1?'Poured footing':'',codes:i%2?{job:'AFE-100',po:'PO-7',cost:'31-200'}:undefined});}
  return e;}
const SET=(T,x)=>Object.assign({rate:28,otRate:'',period:'weekly',anchor:weekStartOf(T,1),weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
const state=(T,settings)=>({app:'yfs-on-the-job',v:1,created:at(addDays(T,-90),'08:00'),settings,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},
  jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,perDiem:75},{id:'j2',name:'Dockside Pizza',rate:'19.50',otRate:'',active:true,perDiem:20,ot:{mode:'both',weekN:40,dayN:4,dtN:6,mult:1.5}}],codes:[],entries:records(T),
  pto:{buckets:[{id:'v',name:'Vacation',type:'perHours',earn:1,per:30,start:40,startDate:addDays(T,-90)},{id:'h',name:'Holiday',type:'perPeriod',earn:2,start:3,startDate:addDays(T,-90)},{id:'n',name:'Floating',type:'none',start:16,startDate:addDays(T,-90)}]},clock:null,log:[],lastBackup:at(T,'08:00'),pdCharge:{},pdDay:{[addDays(T,-2)]:false,[addDays(T,-8)]:true},ui:{a2hsX:1}});
function cases(T){const out=[];for(const period of ['weekly','biweekly','semimonthly','monthly'])for(let ws=0;ws<7;ws++)for(const a of (period==='biweekly'?[0,1,2,3,4,5,6]:[0])){
    out.push({name:period+', workweek starts '+WD[ws]+(period==='biweekly'?', pay period starts '+WD[(ws+a)%7]:''),st:state(T,SET(T,{period,weekStart:ws,anchor:addDays(weekStartOf(T,ws),a-28),filing:['single','mfj','hoh'][(ws+a)%3],state:['FL','GA','TX','CA','NY','WA','PA'][ws],
      stateRate:ws===1?5:ws===3?6.5:'',otRate:ws===5?45:'',k401:ws%2?50:'',health:a%2?32.5:'',credits:ws===6?2000:'',extraWH:ws===2?25:'',perDiemNT:!!(ws%2),perDiemTax:ws%2?'no':'yes',perDiemEach:ws===4||a===3,bonus:ws===3?{basis:'all',pct:9,amount:'',jobId:'',prior:'',priorYear:''}:undefined}))});}
  return out;}
// runs inside the page. Returns a list of things that do not add up.
const CHECK=()=>{const bad=[],near=(a,b,tol)=>Math.abs(a-b)<=(tol||0.011),r2=n=>Math.round(n*100)/100,S=OTJ.state();
  const K=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),D=k=>new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8)),add=(k,n)=>{const d=D(k);d.setDate(d.getDate()+n);return K(d);};
  const tk=K(new Date()),ws=S.settings.weekStart,wkOf=k=>add(k,-((D(k).getDay()-ws+7)%7)),first=wkOf(add(tk,-77)),weeks=[];for(let i=0;i<13;i++)weeks.push(add(first,i*7));
  const live=S.entries.filter(e=>!e.deleted);
  // 1. days add up to the week; the kinds of hours add up to the hours; every shift is in exactly one week
  let seen=0;const dayGross={},dayPd={},shares={};
  for(const w0 of weeks){const w=OTJ.computeWeek(w0),t=w.tot;let g=0,h=0,pd=0,n=0;w.keys.forEach(k=>{const d=w.days[k];g+=d.gross;h+=d.hours;pd+=d.perDiem;n+=d.items.length;dayGross[k]=d.gross;dayPd[k]=d.perDiem;
      if(!near(d.hours,d.reg+d.ot+d.dt+d.pto,0.011))bad.push(k+': day hours '+d.hours+' ≠ regular+OT+DT+PTO '+r2(d.reg+d.ot+d.dt+d.pto));if(!near(d.gross,d.items.reduce((a,it)=>a+it.gross,0),0.011*Math.max(1,d.items.length)))bad.push(k+': day gross ≠ its shifts');});
    seen+=n;if(!near(g,t.gross,0.04)||!near(h,t.hours,0.04)||!near(pd,t.perDiem,0.04))bad.push('week of '+w0+': days add to '+r2(g)+' / '+r2(h)+' hrs / '+r2(pd)+' per diem, week total says '+t.gross+' / '+t.hours+' / '+t.perDiem);
    if(!near(t.hours,t.reg+t.ot+t.dt+t.pto,0.04))bad.push('week of '+w0+': hours '+t.hours+' ≠ parts '+r2(t.reg+t.ot+t.dt+t.pto));
    if([t.gross,t.hours,t.reg,t.ot,t.dt,t.pto,t.perDiem].some(x=>!(x>=0)))bad.push('week of '+w0+': a negative or missing total');
    // 2. the week's take-home: its pieces cover the whole week once, each share is between 0 and 1, and it is never below $0 or more than the pay
    const sh=shares[w0]=OTJ.weekShare(w),mine=sh.parts.reduce((a,p)=>a+p.mine,0);if(!near(mine,t.gross+t.perDiem,0.03))bad.push('week of '+w0+': pay-period pieces cover '+r2(mine)+' of '+r2(t.gross+t.perDiem));
    sh.parts.forEach(p=>{if(!(p.share>=0&&p.share<=1.0000001))bad.push('week of '+w0+': share '+p.share);if(!(p.pr.from<=w.keys[6]&&p.pr.to>=w.keys[0]))bad.push('week of '+w0+': uses a pay period that does not touch it, '+p.pr.from+'..'+p.pr.to);});
    if(!(sh.net>=0&&sh.net<=t.gross+t.perDiem+0.01)||!Number.isFinite(sh.net))bad.push('week of '+w0+': take-home '+sh.net+' vs pay '+r2(t.gross+t.perDiem));}
  const inWin=live.filter(e=>{const k=e.date;return k>=weeks[0]&&k<=add(weeks[12],6);}).length;if(seen!==inWin)bad.push('shifts counted in weeks: '+seen+', shifts saved: '+inWin);
  // 3. every day sits inside its own pay period; pay periods are back to back; a pay period's total is the sum of its days
  const periods={};for(let k=weeks[0];k<=add(weeks[12],6);k=add(k,1)){const p=OTJ.periodRange(k);if(!(p.from<=k&&k<=p.to))bad.push(k+' is outside its pay period '+p.from+'..'+p.to);(periods[p.from]=periods[p.from]||{p,days:[]}).days.push(k);}
  const pk=Object.keys(periods).sort();for(let i=1;i<pk.length;i++)if(add(periods[pk[i-1]].p.to,1)!==pk[i])bad.push('pay periods '+pk[i-1]+' and '+pk[i]+' are not back to back');
  for(let i=1;i<pk.length-1;i++){const q=periods[pk[i]],t=OTJ.rangeTotals(q.p.from,q.p.to),g=q.days.reduce((a,k)=>a+(dayGross[k]||0),0),pd=q.days.reduce((a,k)=>a+(dayPd[k]||0),0);
    if(!near(g,t.gross,0.02*q.days.length)||!near(pd,t.perDiem,0.02))bad.push('pay period '+q.p.from+': its days add to '+r2(g)+' + '+r2(pd)+', total says '+t.gross+' + '+t.perDiem);
    // 4. the take-home shares of the weeks that touch a finished pay period add up to that paycheck
    let net=0,th=null;for(const w0 of weeks){shares[w0].parts.forEach(p=>{if(p.pr.from===q.p.from){net+=p.th.net*p.share;th=p.th.net;}});}
    if(th!=null&&t.gross+t.perDiem>0&&!near(net,th,0.06))bad.push('pay period '+q.p.from+': the weeks\' shares add to '+r2(net)+', the paycheck is '+th);}
  // 5. the export file adds up to the screen (hours, gross, per diem) and has one row per shift
  const rows=OTJ.buildCSV().split('\r\n').filter(Boolean).map(l=>{const o=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else if(ch==='"')q=true;else if(ch===','){o.push(c);c='';}else c+=ch;}o.push(c);return o;});
  const H=rows[0],col=n=>H.indexOf(n),body=rows.slice(1),lo=live.reduce((a,e)=>e.date<a?e.date:a,'9999'),hi=live.reduce((a,e)=>e.date>a?e.date:a,'0000'),all=OTJ.rangeTotals(lo,hi);
  const sum=n=>body.reduce((a,r)=>a+(+r[col(n)]||0),0),shiftRows=body.filter(r=>r[col('Entry ID')]);
  if(shiftRows.length!==live.length)bad.push('export has '+shiftRows.length+' shift rows for '+live.length+' shifts');
  if(!near(sum('Gross (estimate)'),all.gross,0.011*body.length)||!near(sum('Hours'),all.hours,0.011*body.length)||!near(sum('Per diem'),all.perDiem,0.02))bad.push('export adds to '+r2(sum('Gross (estimate)'))+' gross / '+r2(sum('Hours'))+' hrs / '+r2(sum('Per diem'))+' per diem; the app says '+all.gross+' / '+all.hours+' / '+all.perDiem);
  if(!near(sum('Regular')+sum('Overtime')+sum('Double time')+sum('PTO'),sum('Hours'),0.011*body.length))bad.push('export: regular+OT+DT+PTO ≠ hours');
  // 6. the year line: Jan 1 to today is the sum of the days in it
  const y=tk.slice(0,4),yr=OTJ.rangeTotals(y+'-01-01',tk);let yg=0;Object.keys(dayGross).forEach(k=>{if(k>=y+'-01-01'&&k<=tk)yg+=dayGross[k];});if(lo>=weeks[0]&&!near(yg,yr.gross,0.02*91))bad.push('year so far '+yr.gross+' ≠ its days '+r2(yg));
  // 7. PTO: balance = start + earned - used, nothing absurd
  S.pto.buckets.forEach(b=>{const x=OTJ.ptoBalance(b);if(!near(x.balance,(+b.start||0)+x.earned-x.used,0.011)||!(x.earned>=0&&x.earned<200)||!(x.used>=0))bad.push('PTO '+b.name+': balance '+x.balance+', start '+b.start+', earned '+x.earned+', used '+x.used);});
  return bad;};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();let total=0;
 for(const T of DAYS){const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',timezoneId:'America/New_York'});
   await c.addInitScript(now=>{const _D=Date;class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(now);}static now(){return now;}}window.Date=D2;},at(T,'12:00'));
   const p=await c.newPage();p.setDefaultTimeout(15000);const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());const wrong=[];let n=0;
   for(const cs of cases(T)){errs.length=0;await p.evaluate(([k,v])=>{localStorage.setItem(k,v);OTJ.reload();},[KEY,JSON.stringify(cs.st)]);const bad=await p.evaluate(CHECK).catch(e=>['could not finish: '+String(e.message).split('\n')[0]]);n++;total++;
     if(bad.length||errs.length)wrong.push(cs.name+' → '+bad.concat(errs).slice(0,2).join('; ')+(bad.length>2?' (+'+(bad.length-2)+' more)':''));}
   ok(!wrong.length,'['+WD[dow(T)]+' '+T+'] '+n+' pay setups: days, weeks, pay periods, year, export file, take-home shares and PTO all add up '+wrong.slice(0,3).join(' || ').slice(0,900)+(wrong.length>3?' … +'+(wrong.length-3)+' more setups':''));
   await c.close();}
 console.log(total+' pay setups checked');await b.close();srv.close();console.log(fails?fails+' FAIL ('+passes+' pass)':'ALL PASS ('+passes+')');process.exit(fails?1:0);})();
