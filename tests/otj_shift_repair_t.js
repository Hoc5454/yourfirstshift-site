// Clocked In: damaged shifts and job rates can't stop the export or poison the totals. A shift or PTO day saved with a date that is not a
// real day (Feb 30), hours typed by hand that are not a number, a break that is not a number, a per diem tick on a day that does not exist,
// and a job's own pay rate that is not a number. Each is repaired on load, nothing is thrown away that can be placed, and the job sheet no
// longer saves a rate that is not a number. Also: the "pay setup was reset" note is not carried inside a backup file.
// Page clock pinned to a Sunday and a Wednesday (US Eastern). Made-up data only.
// Usage: node otj_shift_repair_t.js ..
process.env.TZ='America/New_York';
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const PORT=18871,O='http://127.0.0.1:'+PORT,KEY='yfs_otj_v1';
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0,passes=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(c)passes++;else fails++;};
const pad=n=>String(n).padStart(2,'0');const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const P=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(k,n)=>{const d=P(k);d.setDate(d.getDate()+n);return ymd(d);};const at=(k,hm)=>{const p=k.split('-'),t=hm.split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1],0,0).getTime();};
const SET=x=>Object.assign({rate:28,otRate:'',period:'weekly',anchor:'2026-11-16',weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
const JOBS=()=>[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,perDiem:75},{id:'j2',name:'Dockside Pizza',rate:'19.50',otRate:'',active:true}];
const W=(T,x)=>{const o=Object.assign({kind:'work',date:T,start:at(T,'07:00'),end:at(T,'15:00'),breakMin:0,jobId:'j1',codeId:'',splits:[],note:''},x||{});o.id='z'+o.id;return o;};
const good=T=>[-6,-5,-4,-3,-2,-1].map((i,n)=>({id:'w'+n,kind:'work',date:addDays(T,i),start:at(addDays(T,i),'07:00'),end:at(addDays(T,i),'16:30'),breakMin:30,jobId:n===2?'j2':'j1',codeId:'',splits:[],note:''}));
const state=(T,x)=>Object.assign({app:'yfs-on-the-job',v:1,created:at(addDays(T,-40),'08:00'),settings:SET(),labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:JOBS(),codes:[],entries:good(T),
  pto:{buckets:[{id:'v',name:'Vacation',type:'none',start:80,startDate:addDays(T,-40)}]},clock:null,log:[],lastBackup:at(T,'08:00'),pdCharge:{},pdDay:{},ui:{a2hsX:1}},x||{});
// in the page: walk the tabs and the export, report anything wrong, return what the app holds
const WALK=()=>{const out={bad:[]};const GARB=/.{0,40}(NaN|undefined|\[object|Infinity|Invalid Date).{0,24}/;
  const scan=w=>{const tx=document.body.innerText;const m=tx.match(GARB);if(m)out.bad.push(w+': "'+m[0].replace(/\s+/g,' ')+'"');if(document.getElementById('viewErr')||/Couldn.t load the pay tables/.test(tx))out.bad.push(w+': error card');};
  const tk=(d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))(new Date());
  out.note=(document.getElementById('fixNote')||{innerText:''}).innerText.replace(/\s+/g,' ').trim();out.stored0=localStorage.getItem('yfs_otj_v1');
  for(const v of ['today','week','pto','more','today']){try{document.querySelector('nav.tabs [data-v='+v+']').click();scan(v);if(v==='week'){out.sheet=document.getElementById('sheet').innerText.replace(/\s+/g,' ');out.gross=document.getElementById('wkGross').innerText;out.net=document.getElementById('wkNet').innerText;}if(v==='more')out.jobs=document.querySelector('[data-job]')?[...document.querySelectorAll('[data-job]')].map(x=>x.innerText.replace(/\s+/g,' ')):[];}catch(e){out.bad.push(v+': threw '+e.message);}}
  try{const c=OTJ.buildCSV();const m=c.match(GARB);if(m)out.bad.push('export: "'+m[0]+'"');const rows=c.split('\r\n').filter(Boolean);out.csv=rows.slice(1).map(r=>r.split(','));out.head=rows[0].split(',');}catch(e){out.bad.push('export threw '+e.message);}
  try{const yr=OTJ.rangeTotals(tk.slice(0,4)+'-01-01',tk);if(![yr.gross,yr.hours].every(Number.isFinite))out.bad.push('year totals are not numbers');out.year=yr;const w=OTJ.computeWeek(tk);if(!Number.isFinite(OTJ.weekShare(w).net))out.bad.push('take-home is not a number');}catch(e){out.bad.push('totals threw '+e.message);}
  const s=OTJ.state(),j=x=>JSON.parse(JSON.stringify(x===undefined?null:x));out.entries=j(s.entries);out.jobsS=j(s.jobs);out.pdDay=j(s.pdDay);out.pdCharge=j(s.pdCharge);out.settings=j(s.settings);out.log=j(s.log);out.fix=j(s.ui.fix);return out;};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 const openDay=async(T,yes)=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',timezoneId:'America/New_York',acceptDownloads:true});
   await c.addInitScript(now=>{const _D=Date;const off=now-_D.now();class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;},at(T,'12:00'));
   const p=await c.newPage();p.setDefaultTimeout(8000);const h={c,p,errs:[]};p.on('pageerror',e=>h.errs.push(e.message));p.on('dialog',d=>(yes?d.accept():d.dismiss()).catch(()=>{}));await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());return h;};
 const run=async(h,st)=>{h.errs.length=0;const raw=JSON.stringify(st);await h.p.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,raw]);await h.p.reload();await h.p.waitForFunction(()=>window.OTJ&&OTJ.tax());await h.p.waitForTimeout(50);const r=await h.p.evaluate(WALK);await h.p.waitForTimeout(30);r.errs=h.errs.slice();r.raw=raw;r.csv=r.csv||[];r.head=r.head||[];r.jobs=r.jobs||[];r.sheet=r.sheet||'';return r;};
 const problems=r=>[].concat(r.errs.map(e=>'error: '+e),r.bad);const byId=(r,id)=>r.entries.filter(e=>e.id===id)[0]||{};const col=(r,n)=>r.head.indexOf(n);
 for(const [dn,T] of [['Sunday','2026-11-22'],['Wednesday','2026-11-25']]){const h=await openDay(T),G=good(T).length;
  // ── dates that are not real days ──
  let st=state(T,{entries:good(T).concat([W(T,{id:'a',date:'2026-02-30'}),W(T,{id:'b',date:'0000-00-00'}),{id:'zp1',kind:'pto',date:'2026-02-30',hours:8,bucket:'v',jobId:'j1'},{id:'zp2',kind:'pto',date:'2026-13-45',hours:4,bucket:'v',jobId:'j1'},{id:'zp3',kind:'pto',date:'soon',hours:8,bucket:'v',jobId:'j1'}]),pdDay:{'2026-02-30':true,[addDays(T,-1)]:false},pdCharge:{'2026-02-30':{key:'j:j1',label:'X'},[addDays(T,-6)]:{key:'j:j1',label:'Harbor Line Builders'}}});
  let r=await run(h,st);
  ok(!problems(r).length&&byId(r,'za').date===T&&byId(r,'zb').date===T&&byId(r,'zp1').date==='2026-03-02'&&byId(r,'zp2').date==='2027-02-14'&&!byId(r,'zp3').id&&r.entries.length===G+4&&r.csv.length===G+4,
    '['+dn+'] a shift dated Feb 30 or 0000-00-00 takes the day it started; a PTO day dated Feb 30 rolls to Mar 2; all are kept and exported ('+r.csv.length+' rows); a PTO day with no readable date is dropped, as before '+problems(r).slice(0,2).join('; '));
  ok(Object.keys(r.pdDay).join()===addDays(T,-1)&&Object.keys(r.pdCharge).join()===addDays(T,-6),'['+dn+'] a per diem tick or charge saved for a day that does not exist is dropped; the real ones are kept');
  // ── hours and breaks that are not numbers ──
  st=state(T,{entries:good(T).concat([W(T,{id:'h1',manualHours:'abc',end:undefined}),W(T,{id:'h2',manualHours:'9.5',end:undefined,date:addDays(T,-1),start:at(addDays(T,-1),'12:00')}),W(T,{id:'h3',manualHours:{},end:undefined,date:addDays(T,-2),start:at(addDays(T,-2),'12:00')}),W(T,{id:'k1',breakMin:'x',date:addDays(T,-3),start:at(addDays(T,-3),'17:00'),end:at(addDays(T,-3),'19:00')}),W(T,{id:'k2',breakMin:-600,date:addDays(T,-4),start:at(addDays(T,-4),'17:00'),end:at(addDays(T,-4),'19:00')})])});
  r=await run(h,st);const row=id=>r.csv.filter(x=>x[col(r,'Entry ID')]===id)[0]||[],hrsOf=id=>+row(id)[col(r,'Hours')];
  ok(!problems(r).length&&byId(r,'zh1').manualHours===undefined&&byId(r,'zh3').manualHours===undefined&&byId(r,'zh2').manualHours==='9.5'&&hrsOf('zh1')===0&&hrsOf('zh3')===0&&hrsOf('zh2')===9.5&&/Missing end time/.test(r.sheet)&&r.entries.length===G+5&&r.csv.length===G+5,
    '['+dn+'] hours typed by hand that are not a number: the shift is kept, counts 0 hours and shows "Missing end time · tap to fix"; totals stay real numbers ('+r.gross+', '+r.net+'); "9.5" as text still counts 9.5 '+problems(r).slice(0,2).join('; '));
  ok(byId(r,'zk1').breakMin===0&&byId(r,'zk2').breakMin===0&&hrsOf('zk1')===2&&hrsOf('zk2')===2,'['+dn+'] a break that is not a number, or is negative, counts as no break (a 2-hour shift is 2 hours, not 12)');
  // ── a job's own pay rate ──
  const jobsWith=x=>{const j=JOBS();Object.assign(j[1],x);return j;};const wrong=[];
  for(const [x,want,words] of [[{rate:'$19.50'},{rate:19.5,otRate:''},'pay rate for Dockside Pizza (now $19.50)'],[{rate:'-5'},{rate:'',otRate:''},'pay rate for Dockside Pizza (blank now)'],[{rate:'abc',otRate:'x'},{rate:'',otRate:''},'pay rate for Dockside Pizza (blank now); overtime rate for Dockside Pizza (blank now)'],
      [{rate:{},otRate:-1},{rate:'',otRate:''},'pay rate for Dockside Pizza (blank now); overtime rate for Dockside Pizza (blank now)'],[{rate:'19.50'},{rate:'19.50',otRate:''},null],[{rate:'21',otRate:'30.5'},{rate:'21',otRate:'30.5'},null],[{rate:22.25},{rate:22.25,otRate:''},null],[{rate:''},{rate:'',otRate:''},null]]){
    st=state(T,{jobs:jobsWith(x)});r=await run(h,st);const j2=r.jobsS[1],pr=problems(r);
    if(j2.rate!==want.rate||j2.otRate!==want.otRate)pr.push('saved as '+JSON.stringify([j2.rate,j2.otRate]));
    if(words?r.note.indexOf(words)<0||r.log.length!==1||r.log[0].new!==words||JSON.stringify(JSON.parse(r.log[0].old))!==JSON.stringify([{id:'j2',rate:x.rate,otRate:x.otRate===undefined?'':x.otRate}]):!!r.note||r.log.length||r.stored0!==r.raw)pr.push('note / history: '+(r.note||'(none)').slice(0,120)+' / '+r.log.length);
    const shown=(r.jobs[1]||'').match(/\$[\d,.]+\/hr/);if(!shown||shown[0]!=='$'+(+want.rate||28).toFixed(2)+'/hr')pr.push('job card shows '+(shown&&shown[0]));
    if(r.entries.length!==G)pr.push('shifts changed');if(pr.length)wrong.push(JSON.stringify(x)+' → '+pr.slice(0,2).join('; '));}
  ok(!wrong.length,'['+dn+'] a job\'s own pay rate: "$19.50" is read as $19.50, a rate that is not a number or is negative becomes blank (the job then uses the main rate), each named in the note; good rates are left exactly as saved '+wrong.slice(0,3).join(' || ').slice(0,600));
  st=state(T,{jobs:[{id:'j1',name:7,rate:'',otRate:'',active:true},{id:'j2',rate:'',otRate:'',active:true}]});r=await run(h,st);
  ok(!problems(r).length&&r.jobsS[0].name==='Job'&&r.jobsS[1].name==='Job'&&!r.note,'['+dn+'] a job with no readable name is called "Job" '+problems(r).slice(0,2).join('; '));
  // ── the job sheet no longer saves a rate that is not a number ──
  try{await run(h,state(T));const p=h.p;await p.click('nav.tabs [data-v=more]');await p.click('[data-job="j2"]');await p.waitForTimeout(150);
  await p.fill('#jR','abc');await p.tap('#jS');await p.waitForTimeout(200);let toast=await p.evaluate(()=>{const t=document.querySelector('.toast');return t?t.innerText:'';});
  ok(/Enter the rate as a number, or leave it blank/.test(toast)&&await p.evaluate(()=>!!document.getElementById('otjModal')&&OTJ.state().jobs[1].rate==='19.50'&&OTJ.state().log.length===0),'['+dn+'] job sheet: "abc" as the rate is not saved; the sheet stays open and says to enter a number');
  await p.fill('#jR','$21.75');await p.fill('#jO','-3');await p.tap('#jS');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!!document.getElementById('otjModal')&&OTJ.state().jobs[1].rate==='19.50'),'['+dn+'] job sheet: a negative overtime rate is not saved either');
  await p.fill('#jO','');await p.tap('#jS');await p.waitForTimeout(250);const d=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);const card=await p.evaluate(()=>[...document.querySelectorAll('[data-job]')].map(x=>x.innerText.replace(/\s+/g,' '))[1]);
  ok(d.jobs[1].rate==='21.75'&&d.jobs[1].otRate===''&&/\$21\.75\/hr/.test(card)&&d.log.length===1&&!h.errs.length,'['+dn+'] job sheet: "$21.75" is saved as 21.75 and the job shows $21.75/hr '+h.errs.join(' | '));
  await p.click('[data-job="j2"]');await p.waitForTimeout(150);await p.fill('#jR','24.50');await p.tap('#jS');await p.waitForTimeout(250);
  ok(await p.evaluate(()=>OTJ.state().jobs[1].rate==='24.50'&&!document.getElementById('otjModal')),'['+dn+'] job sheet: a normal rate ("24.50") saves exactly as it did before');
  }catch(e){ok(false,'['+dn+'] job sheet steps could not finish: '+String(e.message).split('\n')[0]);}
  await h.c.close();}
 // ── the "pay setup was reset" note is not carried inside a backup file ──
 {const T='2026-11-22',h=await openDay(T,true),p=h.p,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'otj-bk-')),st=state(T,{settings:SET({weekStart:9})});
  await p.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,JSON.stringify(st)]);await p.reload();await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(60);
  const note=()=>p.evaluate(()=>{const e=document.getElementById('fixNote');return e?e.innerText.replace(/\s+/g,' '):'';});
  await p.click('nav.tabs [data-v=more]');const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-a=backup]')]);const f=path.join(tmp,'backup.json');await dl.saveAs(f);const bk=JSON.parse(fs.readFileSync(f,'utf8'));
  ok(/workweek start \(now Tuesday\)/.test(await note())&&bk.data.settings.weekStart===2&&bk.data.ui.fix===undefined&&bk.data.entries.length===st.entries.length&&bk.data.log.some(l=>l.field==='(repaired)')&&await p.evaluate(()=>OTJ.state().ui.fix.length===1),
    'a backup made while the note is showing holds the repaired pay setup, every shift and the Change history line, but not the note itself (the note stays on screen)');
  await p.tap('#fixOk');await p.waitForTimeout(150);await p.setInputFiles('#restoreFile',f);await p.waitForTimeout(500);
  ok(!(await note())&&await p.evaluate(n=>OTJ.state().ui.fix===undefined&&OTJ.state().entries.length===n&&OTJ.state().settings.weekStart===2,st.entries.length)&&!h.errs.length,'restoring that backup after answering the note does not bring the note back '+h.errs.join(' | '));
  const f2=path.join(tmp,'damaged.json');fs.writeFileSync(f2,JSON.stringify({app:'yfs-on-the-job',kind:'backup',v:1,exported:at(T,'09:00'),data:state(T,{settings:SET({weekStart:13,period:'nope'})})}));
  await p.setInputFiles('#restoreFile',f2);await p.waitForTimeout(500);const t=await note();
  ok(/pay period \(now weekly\); workweek start \(now Saturday\)/.test(t)&&await p.evaluate(()=>OTJ.state().settings.weekStart===6&&OTJ.state().settings.period==='weekly')&&!h.errs.length,'restoring a backup whose pay setup is damaged repairs it and shows the note: "'+t.slice(0,110)+'" '+h.errs.join(' | '));
  fs.rmSync(tmp,{recursive:true,force:true});await h.c.close();}
 await b.close();srv.close();console.log(fails?fails+' FAIL ('+passes+' pass)':'ALL PASS ('+passes+')');process.exit(fails?1:0);})();
