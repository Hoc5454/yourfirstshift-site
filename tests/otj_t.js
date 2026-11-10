// On the Job (Phase 1) acceptance tests. Real local http server (service worker + offline work), phone viewports.
// Usage: node otj_t.js [repoRoot] [shotDir] [iphone|android|desktop]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const crypto=require('crypto');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const DEV=process.argv[4]||'iphone';
const PORT=18000+Math.floor(Math.random()*900);const O='http://localhost:'+PORT;
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'['+DEV+'] '+m);if(!c)fails++;};
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
const DEVS={iphone:{...devices['iPhone 13'],viewport:{width:412,height:915}},android:devices['Pixel 7'],desktop:{viewport:{width:1280,height:900}}};
const TAX=JSON.parse(fs.readFileSync(path.join(ROOT,'job/tax-2026.json'),'utf8'));
// independent hand calc from the dated table file (Worksheet 1A)
function hand(gross,period,filing,state,rate){const P=TAX.pay_periods[period];const adj=filing==='mfj'?12900:8600;const aaw=Math.max(0,gross*P-adj);const t=TAX.federal_standard_annual[filing];
  const row=t.find(r=>aaw>=r[0]&&(r[1]==null||aaw<r[1]));const fed=Math.round(((row[2]+(aaw-row[0])*row[3])/P)*100)/100;const ss=Math.round(gross*0.062*100)/100,med=Math.round(gross*0.0145*100)/100;
  const st=TAX.no_wage_tax_states.includes(state)?0:Math.round(gross*(rate||0)/100*100)/100;return {fed,ss,med,st,net:Math.round((gross-fed-ss-med-st)*100)/100};}
const ms=(d,t)=>{const [h,m]=t.split(':');const x=new Date(d+'T00:00:00');x.setHours(+h,+m,0,0);return x.getTime();};
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const today=new Date();const dow=(today.getDay()-1+7)%7;const mon=new Date(today);mon.setDate(today.getDate()-dow);const D=i=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return ymd(x);};
function seed(extra){const s={app:'yfs-on-the-job',v:1,created:Date.now(),settings:{rate:28,otRate:'',period:'weekly',anchor:D(0),weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},
  labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Gulf Coast Grocers',rate:'',otRate:'',active:true}],codes:[],entries:[],pto:{buckets:[]},clock:null,log:[],lastBackup:Date.now(),ui:{a2hsX:1}};return Object.assign(s,extra||{});}
const W=(id,d,a,b,brk)=>({id,kind:'work',date:d,start:ms(d,a),end:ms(d,b),breakMin:brk||0,jobId:'j1',codeId:'',splits:[],note:''});
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 async function ctx(state,opt={}){const c=await b.newContext({...DEVS[DEV],deviceScaleFactor:2,serviceWorkers:'allow'});
  if(state!==undefined)await c.addInitScript(([k,v,pro])=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');if(v)localStorage.setItem(k,v);else localStorage.removeItem(k);if(pro)localStorage.setItem('yfs_pro','1');}},['yfs_otj_v1',state?JSON.stringify(state):'',!!opt.pro]);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.goto(O+'/job/');await p.waitForTimeout(700);return {c,p,errs};}
 const shot=async(p,n)=>{if(SHOTS){await p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));await p.screenshot({path:path.join(SHOTS,'otj-'+DEV+'-'+n+'.png')});}};
 // ── 1. first run: setup in 30 seconds + iPhone Add to Home Screen prompt ──
 {const c=await b.newContext({...DEVS[DEV],deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(O+'/job/');await p.waitForTimeout(600);
  ok(await p.isVisible('text=Set up your pay'),'1a first visit = 30-second pay setup, no blank screen');await shot(p,'0-setup');
  await p.fill('#sJob','Gulf Coast Grocers');await p.fill('#sRate','28');await p.selectOption('#sState','FL');await p.click('[data-a=saveSetup]');await p.waitForTimeout(400);
  ok(await p.isVisible('text=START'),'1b setup saved → Clock screen with a big START');
  if(DEV==='iphone'){ok(await p.isVisible('#a2hs')&&/Add to Home Screen/.test(await p.textContent('#a2hs')),'1c iPhone shows Add to Home Screen steps');await shot(p,'1-add-to-home-screen');
   await p.click('[data-a=a2hsx]');await p.reload();await p.waitForTimeout(500);ok(!(await p.isVisible('#a2hs')),'1d prompt dismissed stays dismissed (shows once)');}
  ok(!errs.length,'1 no page errors '+errs.join('|'));await c.close();}
 // ── 2. clock in/out, break not counted, edit keeps history ──
 {const {c,p,errs}=await ctx(seed({codes:[{id:'c1',nick:'Tie-in Station 9',jobId:'j1',fields:{proj:'P-2210',po:'4500-18 / 10',cost:'03 30 00',wo:'WO-1182'},active:true,fav:true},{id:'c2',nick:'Yard + Staging',jobId:'j1',fields:{proj:'P-2210',po:'',cost:'01 50 00',wo:''},active:true}]}));
  await p.evaluate(()=>{const s=OTJ.state();s.clock={start:Date.now()-((8*60+30)*60000),jobId:'j1',codeId:'c1',breaks:[{s:Date.now()-240*60000,e:Date.now()-210*60000}],onBreak:null};localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();});
  await p.waitForTimeout(1200);ok(/^8:0\d:\d\d$/.test(await p.textContent('#clkT')),'2a running clock shows 8h worked (8.5h on the clock − 30 min break) ['+await p.textContent('#clkT')+']');await shot(p,'2-clock-running');
  await p.click('[data-a=stop]');await p.waitForTimeout(400);
  const e=await p.evaluate(()=>{const s=OTJ.state();return {n:s.entries.length,h:OTJ.entryHours(s.entries[0]),brk:s.entries[0].breakMin,log:s.log.map(l=>l.field)};});
  ok(e.n===1&&Math.abs(e.h-8)<0.02&&e.brk===30,'2b STOP saves 8 hrs worked; 30-min break recorded and not counted ('+JSON.stringify(e)+')');
  ok(e.log.includes('(created)'),'2c creation written to change history');
  // edit clock-out time
  const id=await p.evaluate(()=>OTJ.state().entries[0].id);await p.click('[data-edit="'+id+'"]');await p.waitForTimeout(300);
  const oldEnd=await p.inputValue('#eEnd');const [hh,mm]=oldEnd.split(':').map(Number);const ne=String((hh+1)%24).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  await p.fill('#eEnd',ne);await p.fill('#eWhy','forgot to clock out');await p.click('#eSave');await p.waitForTimeout(300);
  const lg=await p.evaluate(()=>OTJ.state().log.filter(l=>l.field==='end')[0]);
  ok(lg&&lg.old&&lg.new&&lg.old!==lg.new&&lg.t>0&&lg.reason==='forgot to clock out','2d editing clock-out keeps old + new + timestamp + reason');
  ok(await p.evaluate(()=>!!OTJ.state().entries[0].orig),'2e original clock times kept on the entry');
  // free: log is written but viewing is Pro
  await p.click('nav.tabs [data-v=more]');await p.click('[data-a=logview]');await p.waitForTimeout(200);ok(/Pro feature/.test(await p.textContent('.sheet')),'2f Free: change history saved, viewing it prompts Pro');await p.click('[data-close]');
  ok(!errs.length,'2 no page errors '+errs.join('|'));await c.close();}
 // ── 3. 43 hrs → $1,246, OT alert; FL take-home vs hand calc; show the math ──
 {const st=seed({entries:[W('a',D(0),'06:00','16:00'),W('b',D(1),'06:00','18:00'),W('c',D(2),'06:00','17:00'),W('d',D(3),'06:00','16:00')]});
  const {c,p,errs}=await ctx(st);await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(300);
  const t=await p.evaluate(D0=>{const w=OTJ.computeWeek(D0);return w.tot;},D(0));
  ok(t.worked===43&&t.reg===40&&t.ot===3&&t.gross===1246,'3a Mon–Thu 10+12+11+10 = 43 hrs at $28 → $1,246 (40×28 + 3×42) '+JSON.stringify(t));
  ok(/Overtime: 3 hrs this week/.test(await p.textContent('#view')),'3b OT alert shows (estimate)');
  const th=await p.evaluate(()=>OTJ.takeHome(1246,0,OTJ.state().settings));const hd=hand(1246,'weekly','single','FL');
  ok(th.fed===hd.fed&&th.ss===hd.ss&&th.med===hd.med&&th.net===hd.net,'3c FL single weekly: fed '+th.fed+' ss '+th.ss+' med '+th.med+' net '+th.net+' = hand calc '+JSON.stringify(hd));
  ok(th.lines.some(l=>/No state income tax on wages \(FL\)/.test(l.k)),'3d FL: "No state income tax on wages" (no state tax line)');
  const v=await p.textContent('#view');ok(/Estimate only/.test(v)&&/2026 IRS \+ SSA tables, checked Nov 9, 2026/.test(v),'3e week shows "Estimate only" + the table date');
  ok(/Gross so far\s*\$1,246\.00/.test(v)&&v.includes('~$1,043.08'),'3f week view: Gross so far $1,246.00 + Est. take-home ~$'+th.net);
  await shot(p,'3-week-paycheck');
  await p.click('[data-a=math][data-scope=week]');await p.waitForTimeout(200);const mt=await p.evaluate(()=>[...document.querySelectorAll('.math tr')].map(r=>r.innerText));
  ok(mt.some(x=>/Regular 40 hrs × \$28\.00\s+\$1,120\.00/.test(x))&&mt.some(x=>/Overtime 3 hrs × \$42\.00\s+\$126\.00/.test(x))&&mt.some(x=>/Est\. take-home\s+\$1,043\.08/.test(x)),'3g Show the math lines add up ('+mt.join(' | ').slice(0,200)+')');
  ok(/Estimate only/.test(await p.textContent('.sheet'))&&/checked Nov 9, 2026/.test(await p.textContent('.sheet')),'3h math shows Estimate only + table date');await shot(p,'4-show-the-math');
  ok(!errs.length,'3 no page errors '+errs.join('|'));await c.close();}
 // ── 4. federal/FICA fixtures: married + single, weekly + biweekly; taxed state rate; WA note; per diem ──
 {const {c,p}=await ctx(seed());
  for(const [g,per,fil] of [[1246,'weekly','mfj'],[2492,'biweekly','single'],[2492,'biweekly','mfj'],[850,'weekly','hoh'],[5200,'biweekly','single']]){
   const th=await p.evaluate(([g,per,fil])=>OTJ.takeHome(g,0,{period:per,filing:fil,state:'TX'}),[g,per,fil]);const hd=hand(g,per,fil,'TX');
   ok(th.fed===hd.fed&&th.ss===hd.ss&&th.med===hd.med,'4a '+fil+' '+per+' $'+g+': fed '+th.fed+' = hand '+hd.fed+', FICA '+th.ss+'+'+th.med);}
  const ga=await p.evaluate(()=>OTJ.takeHome(1000,0,{period:'weekly',filing:'single',state:'GA',stateRate:5}));
  ok(ga.state===50&&ga.lines.some(l=>l.k==='Your rate (5%)'),'4b taxed state: line text exactly "Your rate (5%)" = 5% of taxable wages ($50)');
  const ga0=await p.evaluate(()=>OTJ.takeHome(1000,0,{period:'weekly',filing:'single',state:'GA'}));ok(ga0.lines.some(l=>/State tax not included/.test(l.k)),'4c taxed state with no rate → says state tax not included');
  const wa=await p.evaluate(()=>OTJ.tax().state_notes.WA);ok(/PFML|Paid Family/.test(wa)&&/Phase 3/.test(wa),'4d WA note: other deductions (WA PFML) come in Phase 3');
  const pd=await p.evaluate(()=>[OTJ.takeHome(1000,350,{period:'weekly',filing:'single',state:'FL',perDiemNT:true}),OTJ.takeHome(1000,350,{period:'weekly',filing:'single',state:'FL',perDiemNT:false})]);
  ok(pd[0].total===1350&&pd[0].fitWages===1000&&pd[0].ficaWages===1000&&pd[1].fitWages===1350,'4e per diem marked not taxed: in gross, left out of taxable wages');
  const k=await p.evaluate(()=>OTJ.takeHome(1000,0,{period:'weekly',filing:'single',state:'FL',k401:100,health:50}));ok(k.fitWages===850&&k.ficaWages===950,'4f pre-tax 401k lowers income tax only; health lowers both');
  await c.close();}
 // ── 5. PTO: not counted toward 40; balances ──
 {const L=i=>D(i-7);const pto={buckets:[{id:'v',name:'Vacation',type:'none',start:40,startDate:L(0),cap:'',carry:''},{id:'s',name:'Sick',type:'perHours',earn:1,per:30,start:0,startDate:L(0),cap:'',carry:''}]};
  const P=(id,d,h)=>({id,kind:'pto',date:d,hours:h,bucket:'v',jobId:'j1'});
  let st=seed({pto,entries:[W('a',L(0),'07:00','15:00'),W('b',L(1),'07:00','15:00'),W('c',L(2),'07:00','15:00'),W('d',L(3),'07:00','15:00'),P('p',L(4),8)]});
  let {c,p,errs}=await ctx(st);let t=await p.evaluate(D0=>OTJ.computeWeek(D0).tot,L(0));
  ok(t.worked===32&&t.pto===8&&t.ot===0&&t.gross===1120,'5a 32 worked + 8 PTO = $1,120 gross, 0 OT');
  await p.click('nav.tabs [data-v=pto]');await p.waitForTimeout(200);const pv=await p.textContent('#view');
  ok(/Vacation.*32 hrs/.test(pv.replace(/\s+/g,' '))&&/doesn't count toward the 40|don't count toward the 40/.test(pv),'5b balance updates: Vacation 40 − 8 = 32 hrs; plain-words OT note');
  const sick=await p.evaluate(()=>OTJ.ptoBalance(OTJ.state().pto.buckets[1]).balance);ok(Math.abs(sick-32/30)<0.02,'5c Sick accrues 1 per 30 worked (32 hrs → '+sick+')');
  await shot(p,'5-pto');await c.close();
  st=seed({pto,entries:[W('a',L(0),'07:00','15:00'),W('b',L(1),'07:00','15:00'),W('c',L(2),'07:00','15:00'),W('d',L(3),'07:00','15:00'),W('e',L(4),'07:00','15:00'),P('p',L(5),8)]});
  ({c,p}=await ctx(st));t=await p.evaluate(D0=>OTJ.computeWeek(D0).tot,L(0));ok(t.worked===40&&t.pto===8&&t.ot===0&&t.gross===1344,'5d 40 worked + 8 PTO → OT 0 (PTO not counted), $1,344');
  // PTO via one tap on the calendar
  await p.click('nav.tabs [data-v=today]');await p.click('[data-a=addpto]');await p.waitForTimeout(200);await p.fill('#ePH','4');await p.click('#eSave');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>OTJ.state().entries.filter(e=>e.kind==='pto').length===2),'5e "PTO day" adds PTO from the clock screen');await c.close();}
 // ── 6. Free: 1 job, 3 codes, split one shift across codes; 2nd job → Pro; data never locked ──
 {const {c,p,errs}=await ctx(seed());await p.click('nav.tabs [data-v=codes]');
  for(const [n,proj] of [['Tie-in Station 9','P-2210'],['Yard + Staging','P-2210'],['Hydrotest','P-2290']]){await p.click('[data-a=addcode]');await p.fill('#cN',n);await p.fill('#cf_proj',proj);await p.fill('#cf_cost','03 30 00');await p.click('#cS');await p.waitForTimeout(150);}
  ok(await p.evaluate(()=>OTJ.state().codes.length===3),'6a Free saves 3 codes');await shot(p,'6-code-vault');
  await p.click('[data-a=addcode]');ok(/Pro feature/.test(await p.textContent('.sheet')),'6b 4th code → Pro');await p.click('[data-close]');
  await p.click('[data-a=addjob]');ok(/Pro feature/.test(await p.textContent('.sheet')),'6c 2nd job → Pro');await p.click('[data-close]');
  await p.click('nav.tabs [data-v=today]');await p.click('[data-a=add]');await p.waitForTimeout(200);await p.fill('#eStart','06:00');await p.fill('#eEnd','16:30');await p.fill('#eBrk','30');
  await p.click('#addSplit');await p.waitForTimeout(100);await p.fill('[data-sh="0"]','4');await p.fill('[data-sh="1"]','6');await p.waitForTimeout(100);
  ok(/Split total: 10 ✓/.test(await p.textContent('#eCalc')),'6d split UI checks the total (10 = 10 ✓)');await shot(p,'7-split-editor');
  await p.click('#eSave');await p.waitForTimeout(200);const e=await p.evaluate(()=>OTJ.state().entries.slice(-1)[0]);
  ok(e.splits.length===2&&e.splits[0].hours===4&&e.splits[1].hours===6,'6e Free: one 10-hr day split 4 + 6 across two codes');
  const day=await p.evaluate(()=>{const k=OTJ.state().entries.slice(-1)[0].date;return k;});await p.click('nav.tabs [data-v=week]');await p.click('[data-day="'+day+'"]');await p.waitForTimeout(200);
  const dm=await p.textContent('.sheet');ok(/Tie-in Station 9 4h/.test(dm)&&/Yard \+ Staging 6h/.test(dm),'6f the day shows both codes');await shot(p,'8-day-split-2-codes');await p.click('[data-close]');
  // CSV always free
  await p.click('nav.tabs [data-v=more]');const csv=await p.evaluate(()=>OTJ.buildCSV({}));const lines=csv.trim().split('\r\n');
  ok(lines.length===3&&/Tie-in Station 9/.test(lines[1])&&/Yard \+ Staging/.test(lines[2])&&lines[0].startsWith('Date,Day,Job'),'6g CSV export works on Free (one row per code split)');
  const [dlp]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),(async()=>{await p.click('[data-a=csv]');await p.click('#xGo');})()]);
  ok(DEV==='desktop'?!!dlp:true,'6h CSV download fires (desktop; phones use the share sheet)');await shot(p,'9-more-export');
  ok(!errs.length,'6 no page errors '+errs.join('|'));await c.close();}
 // ── 7. Pro: change history view + filtered export; data stays readable if Pro lapses ──
 {const st=seed({entries:[W('a',D(0),'06:00','16:00')],codes:[{id:'c1',nick:'Tie-in',jobId:'j1',fields:{proj:'P1'},active:true}],log:[{t:Date.now()-5000,id:'a',field:'end',old:'4:00pm',new:'4:30pm',reason:'forgot to clock out'}]});
  const {c,p,errs}=await ctx(st,{pro:true});await p.click('nav.tabs [data-v=more]');await p.click('[data-a=logview]');await p.waitForTimeout(200);
  const lv=await p.textContent('.sheet');ok(/was: 4:00pm/.test(lv)&&/now: 4:30pm/.test(lv)&&/forgot to clock out/.test(lv),'7a Pro: change history shows when, old, new, why');await shot(p,'10-change-history');await p.click('[data-close]');
  await p.click('[data-a=csv]');ok(await p.isVisible('#xF'),'7b Pro: export filters (date/job/code)');await p.click('[data-close]');
  await p.evaluate(()=>{localStorage.removeItem('yfs_pro');OTJ.reload();});await p.click('nav.tabs [data-v=week]');ok(/\$280\.00/.test(await p.textContent('#view')),'7c Pro lapses → records still readable');
  ok(!errs.length,'7 no page errors '+errs.join('|'));await c.close();}
 // ── 8. backup → wipe → restore = identical (hash) ──
 {const st=seed({entries:[W('a',D(0),'06:00','16:00'),W('b',D(1),'06:00','18:00')],codes:[{id:'c1',nick:'Tie-in',jobId:'j1',fields:{proj:'P1'},active:true}],pto:{buckets:[{id:'v',name:'Vacation',type:'none',start:24,startDate:D(0)}]},log:[{t:1,id:'a',field:'(created)',old:'',new:'x',reason:''}]});
  const {c,p,errs}=await ctx(st);await p.click('nav.tabs [data-v=more]');
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),p.evaluate(()=>{navigator.canShare=null;}).then(()=>p.click('[data-a=backup]'))]);
  ok(!!dl,'8a Back up now → one .json file');const fpath=dl?await dl.path():null;const file=fpath?fs.readFileSync(fpath,'utf8'):'{}';const bj=JSON.parse(file);
  const h0=crypto.createHash('sha256').update(JSON.stringify(bj.data)).digest('hex');ok(bj.app==='yfs-on-the-job'&&bj.data.entries.length===2,'8b backup holds every entry, code, PTO and history');
  await shot(p,'11-backup');
  await p.evaluate(()=>{localStorage.clear();});await p.reload();await p.waitForTimeout(500);ok(await p.isVisible('text=Set up your pay'),'8c site data cleared → app is empty');
  // restore from setup-less state: open More via injected settings-less path → use the file input directly
  await p.fill('#sRate','1');await p.click('[data-a=saveSetup]');await p.click('nav.tabs [data-v=more]');await p.setInputFiles('#restoreFile',fpath);await p.waitForTimeout(500);
  const back=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('yfs_otj_v1'));s.log=s.log.filter(l=>l.field!=='(restored)');return JSON.stringify(s);});
  const h1=crypto.createHash('sha256').update(back).digest('hex');ok(h0===h1,'8d restore brings everything back identically (sha256 '+h0.slice(0,12)+' = '+h1.slice(0,12)+')');
  ok(/Restored/.test(await p.textContent('body')),'8e restore confirms');await shot(p,'12-restored');
  ok(!errs.length,'8 no page errors '+errs.join('|'));await c.close();}
 // ── 9. offline: airplane mode → app opens, clock works, entry saved ──
 {const {c,p,errs}=await ctx(seed());await p.waitForTimeout(800);await p.reload();await p.waitForTimeout(800);
  const sw=await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration('/job/');return !!(r&&(r.active||r.waiting||r.installing))&&!!navigator.serviceWorker.controller;});ok(sw,'9a service worker active for /job/ only');
  await c.setOffline(true);await p.reload();await p.waitForTimeout(800);ok(await p.isVisible('text=START'),'9b offline: app opens from the phone');
  await p.click('[data-a=start]');await p.waitForTimeout(1200);await p.click('[data-a=stop]');await p.waitForTimeout(300);ok(await p.evaluate(()=>OTJ.state().entries.length===1),'9c offline: clock in/out saved');
  await c.setOffline(false);
  const scope=await p.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).map(r=>r.scope));ok(scope.every(s=>/\/job\/$/.test(s)),'9d no service worker over the resume app '+JSON.stringify(scope));
  ok(!errs.length,'9 no page errors '+errs.join('|'));await c.close();}
 // ── 10. resume app: new tab, nothing else ──
 {const c=await b.newContext({...DEVS[DEV]});await c.route(/workers\.dev/,r=>r.fulfill({body:'{}',contentType:'application/json'}));await c.route(/fonts\.g|cdnjs|jsdelivr|unpkg/,r=>r.fulfill({body:'',contentType:'text/plain'}));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(O+'/app.html');await p.waitForTimeout(1200);const n=await p.evaluate(()=>{const a=document.getElementById('ybnJob');const r=a.getBoundingClientRect();return {href:a.getAttribute('href'),w:r.width,txt:a.innerText.trim(),cols:getComputedStyle(document.getElementById('yfsBottomNav')).gridTemplateColumns.split(' ').length};});
  ok(n.href==='/job/'&&n.txt==='On the Job'&&n.cols===5&&n.w>50,'10a resume app bottom nav has the new "On the Job" tab '+JSON.stringify(n));
  const p2=await c.newPage();await p2.goto(O+'/job/');await p2.goto(O+'/app.html#plans');await p2.waitForTimeout(2500);ok(await p2.evaluate(()=>document.getElementById('yfsPlans').classList.contains('open')),'10b "See Pro plans" opens the plans sheet');
  ok(!errs.filter(e=>!/Unexpected token/.test(e)).length,'10 no page errors '+errs.join('|'));await c.close();}
 await b.close();srv.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
