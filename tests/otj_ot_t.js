// Clocked In: per-job overtime rules, pay code is a label only, one take-home per gross.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_ot_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18894,O='http://127.0.0.1:'+PORT;
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
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 for(const dev of Object.keys(DEVS)){const T0='['+dev+'] ';
  const open=async(state,pro)=>{const c=await b.newContext({...DEVS[dev],serviceWorkers:'block',acceptDownloads:true});
   await c.addInitScript(([v,now,pro])=>{const _D=Date;const off=now-_D.now();class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;
     if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');if(v)localStorage.setItem('yfs_otj_v1',v);if(pro)localStorage.setItem('yfs_pro','1');}},[state?JSON.stringify(state):'',NOW.getTime(),!!pro]);
   const p=await c.newPage();p.setDefaultTimeout(6000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(200);return {c,p,errs};};
  const st=p=>p.evaluate(()=>JSON.parse(JSON.stringify(OTJ.state())));
  // run the pay engine on a given state: returns the week totals + per-entry split
  const week=(p,state,wk)=>p.evaluate(([s,wk])=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();const w=OTJ.computeWeek(wk);const items=[];w.keys.forEach(k=>w.days[k].items.forEach(it=>items.push({id:it.e.id,d:k,h:it.hours,reg:it.reg,ot:it.ot,dt:it.dt,pto:it.pto,g:Math.round(it.gross*100)/100})));return {tot:w.tot,jobs:w.jobs,items,rules:OTJ.state().jobs.map(j=>OTJ.ruleText(j))};},[state,wk||D(0)]);

  // ── 1. the overtime engine ──
  {const {c,p,errs}=await open(seed());
   let w=await week(p,seed({jobs:[job({mode:'daily',dayN:8})],entries:[H(D(0),10)]}));
   ok(w.tot.reg===8&&w.tot.ot===2&&near(w.tot.gross,8*28+2*42)&&w.rules[0]==='OT after 8 hrs/day','1a '+T0+'10-hr day under Daily 8 = 8 regular + 2 OT ($308.00)');
   const four=()=>[H(D(0),10),H(D(1),10),H(D(2),10),H(D(3),10)];
   w=await week(p,seed({jobs:[job({mode:'weekly',weekN:40})],entries:four()}));ok(w.tot.ot===0&&w.tot.reg===40&&near(w.tot.gross,1120),'1b '+T0+'4 x 10 under Weekly 40 = 0 OT ($1,120.00)');
   w=await week(p,seed({jobs:[job({mode:'daily',dayN:8})],entries:four()}));ok(w.tot.ot===8&&w.tot.reg===32,'1c '+T0+'the same 4 x 10 under Daily 8 = 8 OT');
   w=await week(p,seed({jobs:[job({mode:'both',dayN:8,weekN:40})],entries:[0,1,2,3,4].map(i=>H(D(i),10))}));ok(w.tot.ot===10&&w.tot.reg===40&&w.tot.worked===50,'1d '+T0+'Daily + weekly, 5 x 10: 10 OT, not 20 (daily OT hours are not counted again toward the 40)');
   const six=()=>[0,1,2,3,4,5].map(i=>H(D(i),9));const both=await week(p,seed({jobs:[job({mode:'both'})],entries:six()})),wOnly=await week(p,seed({jobs:[job({mode:'weekly'})],entries:six()})),dOnly=await week(p,seed({jobs:[job({mode:'daily'})],entries:six()}));
   ok(both.tot.ot===14&&wOnly.tot.ot===14&&dOnly.tot.ot===6&&both.tot.reg===40,'1e '+T0+'Daily + weekly, 6 x 9: 6 daily + 8 weekly = 14 OT; never less than weekly alone (14) or daily alone (6)');
   const tw=()=>[0,1,2,3].map(i=>H(D(i),12));const b2=await week(p,seed({jobs:[job({mode:'both'})],entries:tw()})),w2=await week(p,seed({jobs:[job({mode:'weekly'})],entries:tw()}));ok(b2.tot.ot===16&&w2.tot.ot===8&&b2.tot.reg===32,'1f '+T0+'Daily + weekly, 4 x 12: 16 OT (the larger result), weekly alone would be 8');
   w=await week(p,seed({jobs:[job({mode:'daily',dayN:8,dtN:12})],entries:[H(D(0),14)]}));ok(w.tot.reg===8&&w.tot.ot===4&&w.tot.dt===2&&near(w.tot.gross,8*28+4*42+2*56)&&/double time after 12 hrs\/day/.test(w.rules[0]),'1g '+T0+'double time: 14-hr day = 8 regular + 4 OT + 2 double time ($504.00)');
   w=await week(p,seed({jobs:[job({mode:'daily',dayN:8,dtN:12})],entries:[Wk(D(0),'05:00','12:00'),Wk(D(0),'13:00','20:00')]}));ok(w.items[0].reg===7&&w.items[0].ot===0&&w.items[1].reg===1&&w.items[1].ot===4&&w.items[1].dt===2,'1h '+T0+'two shifts in one day share the day\'s count: 7 reg, then 1 reg + 4 OT + 2 DT');
   w=await week(p,seed({jobs:[job({mode:'weekly',weekN:40,dtN:12})],entries:[H(D(0),14),H(D(1),14),H(D(2),14)]}));ok(w.tot.dt===6&&w.tot.reg===36&&w.tot.ot===0,'1i '+T0+'Weekly 40 + double time after 12: 3 x 14 = 6 DT, 36 regular, no OT (DT hours do not also count toward the 40)');
   w=await week(p,seed({jobs:[job({mode:'weekly',mult:2})],entries:[0,1,2,3,4].map(i=>H(D(i),9))}));ok(w.tot.ot===5&&near(w.tot.gross,40*28+5*56),'1j '+T0+'OT multiplier 2: 5 OT hrs at $56.00');
   w=await week(p,seed({jobs:[job({mode:'weekly',weekN:36})],entries:four()}));ok(w.tot.ot===4,'1k '+T0+'Weekly after 36 hrs: 40 worked = 4 OT');
   w=await week(p,seed({jobs:[job({mode:'daily'})],entries:[H(D(0),8),{id:'p1',kind:'pto',date:D(0),hours:8,bucket:'v',jobId:'j1'}]}));ok(w.tot.ot===0&&w.tot.pto===8&&w.tot.reg===8,'1l '+T0+'PTO on the same day never creates overtime');
   // two jobs, two rules, one week
   const two=seed({jobs:[job({mode:'weekly',weekN:40},{id:'jA',name:'Harbor Line Builders'}),job({mode:'daily',dayN:8},{id:'jB',name:'Example Iron Works',rate:'30'})],entries:[...[0,1,2,3].map(i=>H(D(i),10,{jobId:'jA'})),H(D(4),10,{jobId:'jB'}),H(D(5),6,{jobId:'jB'})]});
   w=await week(p,two);ok(w.jobs.jA.ot===0&&w.jobs.jA.worked===40&&w.jobs.jB.ot===2&&w.jobs.jB.worked===16&&near(w.tot.gross,40*28+14*30+2*45),'1m '+T0+'two jobs with different rules in one week: Weekly-40 job 0 OT on 40 hrs; Daily-8 job 2 OT on 16 hrs; 56 hrs total is not combined into weekly OT');
   // jobs saved before this change (no rule) = Weekly 40, numbers unchanged
   w=await week(p,seed({entries:[0,1,2,3].map(i=>H(D(i),10)).concat([H(D(4),3)])}));ok(w.tot.ot===3&&near(w.tot.gross,40*28+3*42)&&w.rules[0]==='OT after 40 hrs/week','1n '+T0+'a job saved before this change has no rule and is figured as Weekly 40: 43 hrs = 3 OT, $1,246.00 (same as before)');
   w=await week(p,seed({jobs:[job({mode:'nope',weekN:-5,dayN:'x',dtN:99,mult:0})],entries:[0,1,2,3,4].map(i=>H(D(i),9))}));ok(w.tot.ot===5&&w.rules[0]==='OT after 40 hrs/week','1o '+T0+'a damaged rule is repaired to Weekly 40 at 1.5x');
   ok(!errs.length,'1 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 2. on screen: first-run asks, banner/badges/math/CSV/backup follow the job's rule ──
  {const {c,p,errs}=await open(null);
   ok(/When does your overtime kick in\?/.test(await p.textContent('#view'))&&await p.isVisible('#sO_mode'),'2a '+T0+'first-run pay setup asks "When does your overtime kick in?"');
   ok(await p.inputValue('#sO_mode')==='weekly'&&await p.inputValue('#sO_week')==='40'&&await p.inputValue('#sO_mult')==='1.5'&&!(await p.isVisible('#sO_day')),'2b '+T0+'it starts on the common answer: after 40 hrs in a week, 1.5x');
   await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.selectOption('#sO_mode','daily');ok(await p.isVisible('#sO_day')&&!(await p.isVisible('#sO_week'))&&/OT after 8 hrs\/day/.test(await p.textContent('#sO_say')),'2c '+T0+'choosing "in a day" shows the daily box and says the rule back in plain words');
   await p.selectOption('#sWs','1');await p.click('[data-a=saveSetup]');await p.waitForTimeout(300);let s=await st(p);ok(s.jobs[0].ot&&s.jobs[0].ot.mode==='daily'&&s.jobs[0].ot.dayN===8&&s.jobs[0].otHist.length===1&&s.jobs[0].otHist[0].effectiveFrom==='1970-01-01'&&s.jobs[0].otHist[0].rule.mode==='daily','2d '+T0+'the rule is saved on the job as its first rule-history entry, from the beginning');
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','06:00');await p.fill('#eEnd','16:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(250);
   const ban=await p.textContent('.alert.ot');ok(/Overtime: 2 hrs this week/.test(ban)&&/OT after 8 hrs\/day/.test(ban)&&/estimate/.test(ban),'2e '+T0+'OT banner: "Overtime: 2 hrs this week · OT after 8 hrs/day", still labelled estimate');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);s=await st(p);const row=(await p.textContent('#sheet [data-row="'+s.entries[0].id+'"]')).replace(/\s+/g,' ');
   ok(/10 hrs/.test(row)&&/8 reg/.test(row)&&/2 OT/.test(row),'2f '+T0+'timesheet row shows the app\'s own split: 10 hrs = 8 reg + 2 OT');
   const card=(await p.textContent('#weekCard')).replace(/\s+/g,' ');ok(/10 worked/.test(card)&&/8 reg · 2 OT/.test(card)&&/\$308\.00/.test(card)&&/Estimate only/.test(card)&&/OT after 8 hrs\/day/.test(await p.textContent('#otRules')),'2g '+T0+'week card: 10 worked, 8 reg · 2 OT, $308.00, "Estimate only"; the rule is named under it');
   await p.click('[data-a=math]');await p.waitForTimeout(200);const mt=(await p.textContent('#otjModal')).replace(/\s+/g,' ');ok(/Regular 8 hrs × \$28\.00/.test(mt)&&/Overtime 2 hrs × \$42\.00/.test(mt)&&/OT rule for this week: OT after 8 hrs\/day/.test(mt)&&/Estimate only/.test(mt),'2h '+T0+'Show the math: 8 × $28.00, 2 × $42.00, and "OT rule for this week: OT after 8 hrs/day"');await p.click('[data-close]');
   const csv=csvParse(await p.evaluate(()=>OTJ.buildCSV({})));const Hd=csv[0],r1=csv[1];const col=nm=>r1[Hd.indexOf(nm)];
   ok(col('Regular')==='8'&&col('Overtime')==='2'&&col('Double time')==='0'&&col('OT rule')==='OT after 8 hrs/day'&&col('Gross (estimate)')==='308','2i '+T0+'CSV: Regular 8, Overtime 2, Double time 0, OT rule column says which rule applied');
   // change the rule in Pay setup (one job) → numbers follow; history says it in words
   // a 10-hr day LAST week too, then change the rule this week: last week must not change
   await p.evaluate(([d,id])=>{const s=OTJ.state();const st=new Date(d+'T06:00:00').getTime();s.entries.push({id:'lastwk',kind:'work',date:d,start:st,end:st+10*3600e3,breakMin:0,jobId:id,codeId:'',splits:[],note:''});localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},[D(-7),s.jobs[0].id]);
   const lw0=await p.evaluate(d=>{const w=OTJ.computeWeek(d);return [w.tot.reg,w.tot.ot,w.tot.gross];},D(-7));
   await p.click('nav.tabs [data-v=more]');await p.click('[data-a=setup]');await p.waitForTimeout(150);ok(await p.inputValue('#sO_mode')==='daily'&&!(await p.isVisible('#sO_when')),'2j '+T0+'Pay setup shows this job\'s rule; no "which week" question until the rule is changed');
   await p.selectOption('#sO_mode','weekly');ok(await p.isVisible('#sO_when')&&await p.inputValue('#sO_when')===D(0)&&/Starting which week\?/.test(await p.textContent('#sO_whenW')),'2j2 '+T0+'changing the rule asks "Starting which week?", defaulting to this week');
   await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);const card2=(await p.textContent('#weekCard')).replace(/\s+/g,' ');
   const lw1=await p.evaluate(d=>{const w=OTJ.computeWeek(d);return [w.tot.reg,w.tot.ot,w.tot.gross];},D(-7));s=await st(p);
   ok(JSON.stringify(lw0)==='[8,2,308]'&&JSON.stringify(lw1)===JSON.stringify(lw0),'2k '+T0+'Daily 8 → Weekly 40 starting this week: last week\'s 10-hr day stays 8 reg + 2 OT, $308.00 (pay unchanged)');
   ok(/10 worked/.test(card2)&&/10 reg · 0 OT/.test(card2)&&/\$280\.00/.test(card2)&&!(await p.$('.alert.ot'))&&/OT after 40 hrs\/week/.test(await p.textContent('#otRules')),'2k2 '+T0+'this week uses the new rule: 10 reg · 0 OT, $280.00, and the page says "OT after 40 hrs/week"');
   ok(s.jobs[0].otHist.length===2&&s.jobs[0].otHist[0].rule.mode==='daily'&&s.jobs[0].otHist[0].effectiveFrom==='1970-01-01'&&s.jobs[0].otHist[1].rule.mode==='weekly'&&s.jobs[0].otHist[1].effectiveFrom===D(0),'2k3 '+T0+'the rule history gained one entry (Weekly 40 from '+D(0)+'); the earlier entry is unchanged');
   await p.click('[data-a=wprev]');await p.waitForTimeout(200);const lwPage=(await p.textContent('#view')).replace(/\s+/g,' ');ok(/OT after 8 hrs\/day/.test(await p.textContent('#otRules'))&&/8 reg · 2 OT/.test(lwPage),'2k4 '+T0+'last week\'s page still says "OT after 8 hrs/day" and 8 reg · 2 OT');
   await p.click('[data-a=math]');await p.waitForTimeout(200);ok(/OT rule for this week: OT after 8 hrs\/day/.test(await p.textContent('#otjModal')),'2k5 '+T0+'Show the math for last week names the rule used that week');await p.click('[data-close]');await p.click('[data-a=wnext]');
   {const cv=csvParse(await p.evaluate(()=>OTJ.buildCSV({})));const H2=cv[0];const rl=cv.find(r=>r[H2.length-1]==='lastwk'),rt=cv.find(r=>r[H2.length-1]!=='lastwk'&&r!==H2);
    ok(rl[H2.indexOf('OT rule')]==='OT after 8 hrs/day'&&rl[H2.indexOf('Overtime')]==='2'&&rt[H2.indexOf('OT rule')]==='OT after 40 hrs/week'&&rt[H2.indexOf('Overtime')]==='0','2k6 '+T0+'CSV: each row names the rule used for its own week (last week Daily 8 with 2 OT, this week Weekly 40 with 0 OT)');}
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(hist.some(x=>/Edited job Harbor Line Builders: OT rule OT after 8 hrs\/day → OT after 40 hrs\/week, starting the week of \w{3} \d+/.test(x))&&!/[{}]/.test(hist.join('')),'2l '+T0+'Change history: "Edited job …: OT rule OT after 8 hrs/day → OT after 40 hrs/week, starting the week of …"');
   // job screen under More
   await p.click('nav.tabs [data-v=more]');ok(/OT after 40 hrs\/week/.test(await p.textContent('[data-job]')),'2m '+T0+'More → Jobs lists each job with its rule');
   await p.click('[data-job]');await p.waitForTimeout(150);await p.selectOption('#jO_mode','both');await p.fill('#jO_dt','12');await p.click('#jS');await p.waitForTimeout(250);s=await st(p);
   ok(s.jobs[0].ot.mode==='both'&&s.jobs[0].ot.dtN===12&&s.jobs[0].otHist.length===2&&s.jobs[0].otHist[1].effectiveFrom===D(0)&&/OT after 8 hrs\/day or 40 hrs\/week, double time after 12 hrs\/day/.test(await p.textContent('[data-job]')),'2n '+T0+'the job screen edits the rule (daily + weekly, double time after 12) starting this week; it replaces this week\'s entry, the first entry stays');
   // backup → restore keeps the rule; an old backup (no rule) restores as Weekly 40
   await p.evaluate(()=>{navigator.canShare=null;});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('[data-a=backup]')]);const f1=path.join(os.tmpdir(),'yfs-ot-'+dev+'.json');if(dl)await dl.saveAs(f1);
   const bj=dl?JSON.parse(fs.readFileSync(f1,'utf8')):{data:{jobs:[{}]}};ok(!!dl&&bj.data.jobs[0].ot&&bj.data.jobs[0].ot.mode==='both'&&bj.data.jobs[0].otHist.length===2&&bj.data.jobs[0].otHist[0].rule.mode==='daily','2o '+T0+'the backup file holds the job\'s whole OT rule history');
   await p.evaluate(()=>{const s=OTJ.state();s.jobs[0].ot={mode:'weekly'};s.jobs[0].otHist=[{rule:{mode:'weekly'},effectiveFrom:'1970-01-01'}];s.entries=[];localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();});await p.click('nav.tabs [data-v=more]');if(dl){await p.setInputFiles('#restoreFile',f1);await p.waitForTimeout(500);}s=await st(p);
   ok(s.jobs[0].ot.mode==='both'&&s.jobs[0].ot.dtN===12&&s.jobs[0].otHist.length===2&&s.jobs[0].otHist[0].rule.mode==='daily'&&s.entries.length===2,'2p '+T0+'restoring that backup brings the whole rule history back');
   const old={app:'yfs-on-the-job',kind:'backup',v:1,exported:Date.now()-86400000,data:seed({entries:[0,1,2,3].map(i=>H(D(i),10)).concat([H(D(4),5)])})};const f2=path.join(os.tmpdir(),'yfs-ot-old-'+dev+'.json');fs.writeFileSync(f2,JSON.stringify(old));
   await p.setInputFiles('#restoreFile',f2);await p.waitForTimeout(500);const ow=await p.evaluate(wk=>{const w=OTJ.computeWeek(wk);const j=OTJ.state().jobs[0];return {ot:w.tot.ot,g:w.tot.gross,rule:OTJ.ruleText(j),n:OTJ.state().entries.length,h:JSON.stringify(j.otHist)};},D(0));
   ok(ow.n===5&&ow.rule==='OT after 40 hrs/week'&&ow.ot===5&&near(ow.g,40*28+5*42)&&ow.h==='[{"rule":{"mode":"weekly","weekN":40,"dayN":8,"dtN":"","mult":1.5},"effectiveFrom":"1970-01-01"}]','2q '+T0+'an old backup (no rule in it) restores as one Weekly 40 entry from the beginning: 45 hrs = 5 OT, $1,330.00');
   // a backup from before rule history (one rule on the job, no history) → one entry with that rule
   const f3=path.join(os.tmpdir(),'yfs-ot-53-'+dev+'.json');fs.writeFileSync(f3,JSON.stringify({app:'yfs-on-the-job',kind:'backup',v:1,exported:Date.now(),data:seed({jobs:[job({mode:'daily',dayN:8})],entries:[H(D(0),10)]})}));
   await p.setInputFiles('#restoreFile',f3);await p.waitForTimeout(500);const o3=await p.evaluate(wk=>{const j=OTJ.state().jobs[0];return {h:j.otHist,ot:OTJ.computeWeek(wk).tot.ot};},D(0));
   ok(o3.h.length===1&&o3.h[0].rule.mode==='daily'&&o3.h[0].effectiveFrom==='1970-01-01'&&o3.ot===2,'2r '+T0+'a backup with one rule and no history restores as one entry with that rule (Daily 8 → 2 OT)');
   ok(!errs.length,'2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 6. rule history: pick a week, damaged history ──
  {const {c,p,errs}=await open(seed());
   const wkOT=(p,ds)=>p.evaluate(ds=>ds.map(d=>OTJ.computeWeek(d).tot.ot),ds);const W4=[D(-21),D(-14),D(-7),D(0)];
   const four=()=>W4.map(d=>H(d,10));
   await week(p,seed({settings:SET({weekStart:1}),jobs:[job({mode:'daily',dayN:8})],entries:four()}));await p.click('nav.tabs [data-v=more]');await p.click('[data-job]');await p.waitForTimeout(150);
   ok(!(await p.isVisible('#jO_when')),'6a '+T0+'job screen: no week question while the rule is unchanged');
   await p.selectOption('#jO_mode','weekly');ok(await p.isVisible('#jO_when')&&(await p.$$eval('#jO_when option',o=>o.map(x=>x.textContent))).join('|').match(/^This week \(from .+\)\|Last week \(from .+\)\|2 weeks ago .*\|My first week \(I set it up wrong\)$/),'6b '+T0+'job screen: changing the rule offers This week, Last week, 2–4 weeks ago, or My first week');
   await p.selectOption('#jO_when',D(-14));await p.click('#jS');await p.waitForTimeout(250);let ot=await wkOT(p,W4);
   ok(JSON.stringify(ot)==='[2,0,0,0]','6c '+T0+'Weekly 40 starting 2 weeks ago: 3 weeks ago keeps its 2 OT; 2 weeks ago, last week and this week are 0 OT ('+ot.join(',')+')');
   await p.click('[data-job]');await p.waitForTimeout(150);await p.selectOption('#jO_mode','daily');await p.selectOption('#jO_when','1970-01-01');await p.click('#jS');await p.waitForTimeout(250);ot=await wkOT(p,W4);let s=await st(p);
   ok(JSON.stringify(ot)==='[2,2,2,2]'&&s.jobs[0].otHist.length===1&&s.jobs[0].otHist[0].rule.mode==='daily','6d '+T0+'"My first week (I set it up wrong)" applies the rule to every week and leaves one history entry');
   await p.click('[data-job]');await p.waitForTimeout(150);await p.selectOption('#jO_mode','weekly');await p.selectOption('#jO_when',D(-7));await p.click('#jS');await p.waitForTimeout(200);
   await p.click('[data-job]');await p.waitForTimeout(150);await p.selectOption('#jO_mode','both');await p.selectOption('#jO_when',D(-14));await p.click('#jS');await p.waitForTimeout(200);s=await st(p);ot=await wkOT(p,W4);
   ok(s.jobs[0].otHist.map(x=>x.rule.mode+'@'+(x.effectiveFrom===D(-14)?'-14':x.effectiveFrom==='1970-01-01'?'0':x.effectiveFrom)).join(',')==='daily@0,both@-14'&&JSON.stringify(ot)==='[2,2,2,2]','6e '+T0+'a change starting earlier than a later change replaces the later one (history: Daily from the start, Both from 2 weeks ago)');
   await p.click('[data-job]');await p.waitForTimeout(150);await p.fill('#jN','Harbor Line Builders East');await p.click('#jS');await p.waitForTimeout(200);ok((await st(p)).jobs[0].otHist.length===2,'6f '+T0+'saving the job without changing the rule adds no history entry');
   const bad=await week(p,seed({jobs:[Object.assign(job(),{ot:{mode:'daily'},otHist:['x',null,{rule:{mode:'weekly'},effectiveFrom:'nope'},{rule:{mode:'daily',dayN:10},effectiveFrom:D(-7)},{rule:{mode:'weekly',weekN:-3},effectiveFrom:D(-7)},{rule:'?',effectiveFrom:D(0)}]})],entries:[H(D(-7),12),H(D(0),12)]}));
   const bh=await p.evaluate(()=>OTJ.state().jobs[0].otHist);
   ok(bh.length===2&&bh[0].effectiveFrom===D(-7)&&bh[0].rule.mode==='weekly'&&bh[0].rule.weekN===40&&bh[1].rule.mode==='weekly'&&!errs.length,'6g '+T0+'a damaged rule history is repaired on load (bad rows dropped, one entry per week, bad values back to Weekly 40), no page errors');
   ok(!errs.length,'6 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 3. pay code is a label only ──
  {const mk=pay=>seed({jobs:[job({mode:'daily',dayN:8})],entries:[Object.assign(Wk(T,'06:00','16:00'),{id:'big',codes:pay?{pay}:undefined}),Object.assign(Wk(D(TI===0?1:0),'06:00','12:00'),{id:'small',codes:pay?{pay}:undefined})]});
   const {c,p,errs}=await open(seed());const res={};for(const pay of ['','REG','OT','DT','reg','Overtime','PTO','XYZ']){const w=await week(p,mk(pay));res[pay]=JSON.stringify([w.tot.reg,w.tot.ot,w.tot.dt,w.tot.gross,w.items.map(i=>[i.reg,i.ot,i.g])]);}
   ok(Object.values(res).every(v=>v===res[''])&&/\[14,2,0,476/.test(res['']),'3a '+T0+'pay code blank, REG, OT, DT, PTO or anything else gives identical pay: 14 reg + 2 OT, $476.00');
   await week(p,mk('OT'));await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);let big=await p.textContent('#sheet [data-row="big"]'),small=await p.textContent('#sheet [data-row="small"]');
   ok(/Pay code says OT, but by your OT rule these hours are regular/.test(small)&&!/Pay code says/.test(big),'3b '+T0+'typed OT on a 6-hr day the rule counts as regular → a note on that row only');
   await week(p,mk('REG'));await p.click('nav.tabs [data-v=today]');await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);big=await p.textContent('#sheet [data-row="big"]');small=await p.textContent('#sheet [data-row="small"]');
   ok(/Pay code says REG, but by your OT rule 2 of these hours are overtime/.test(big)&&!/Pay code says/.test(small),'3c '+T0+'typed REG on a 10-hr day with 2 OT hrs → a note on that row only');
   const fit=await p.evaluate(()=>{const n=document.querySelector('[data-paynote]');const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+0.5&&document.documentElement.scrollWidth-innerWidth<=1;});ok(fit,'3d '+T0+'the note fits the screen');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-ot-1-paynote.png'),fullPage:true});
   await p.click('#sheet [data-edit="big"]');await p.waitForTimeout(150);ok(/Optional\. Only for your employer's timesheet\. Overtime is tracked for you\./.test(await p.textContent('[data-payhelp]'))&&await p.isVisible('[data-payhelp]'),'3e '+T0+'pay code helper text in the editor: "Optional. Only for your employer\'s timesheet. Overtime is tracked for you."');
   await p.fill('#eC_pay','OT');await p.click('#eSave');await p.waitForTimeout(250);const s=await st(p);ok(s.entries.find(e=>e.id==='big').codes.pay==='OT'&&!(await p.$('#otjModal')),'3f '+T0+'the note never blocks: any pay code still saves');
   const csv=csvParse(await p.evaluate(()=>OTJ.buildCSV({})));const Hd=csv[0];const rb=csv.find(r=>r[Hd.length-1]==='big');ok(rb[Hd.indexOf('Pay code')]==='OT'&&rb[Hd.indexOf('Regular')]==='8'&&rb[Hd.indexOf('Overtime')]==='2','3g '+T0+'CSV keeps the typed pay code and shows the app\'s own split beside it (Pay code OT, Regular 8, Overtime 2)');
   ok(!errs.length,'3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 5. auto-OT is obvious ──
  {const {c,p,errs}=await open(null);
   ok(/We track your overtime automatically\. Just tell us when it kicks in\./.test(await p.textContent('[data-autoot]'))&&await p.evaluate(()=>{const a=document.querySelector('[data-autoot]'),m=document.getElementById('sO_mode');return a.getBoundingClientRect().bottom<=m.getBoundingClientRect().top&&m.getBoundingClientRect().top-a.getBoundingClientRect().bottom<90;}),'5a '+T0+'first-run pay setup, right above the OT rule: "We track your overtime automatically. Just tell us when it kicks in."');
   ok(!errs.length,'5 '+T0+'no page errors (setup) '+errs.join('|').slice(0,140));await c.close();}
  {const live=async(state)=>{const o=await open(state);const v=await o.p.evaluate(wk=>{const w=OTJ.computeWeek(wk);const n=new Date();const tk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const d=w.days[tk];const r=x=>Math.round(x*10)/10;
      const g=id=>(document.getElementById(id)||{}).textContent||'';return {today:g('liveToday'),week:g('liveWeek'),rule:g('liveRule'),badge:g('otNow'),d:[r(d.reg),r(d.ot),r(d.dt)],t:[r(w.tot.reg),r(w.tot.ot),r(w.tot.dt)],fit:document.documentElement.scrollWidth-innerWidth<=1};},D(0));return Object.assign(o,{v});};
   const num=s=>(s.match(/[\d.]+(?= reg)|[\d.]+(?= OT)|[\d.]+(?= DT)/g)||[]).map(x=>Math.round(+x*10)/10);const eq=(a,b)=>a.length>=2&&a.every((x,i)=>Math.abs(x-b[i])<=0.11);
   const clk=h=>({start:NOW.getTime()-h*3600e3,jobId:'j1',breaks:[],onBreak:null});
   // Daily 8, 10 hrs into the shift (started 2am today)
   let o=await live(seed({jobs:[job({mode:'daily',dayN:8})],clock:clk(10)}));
   ok(/^Today: 8 reg · 2(\.\d+)? OT$/.test(o.v.today)&&eq(num(o.v.today),o.v.d)&&o.v.badge==='Overtime now','5b '+T0+'Daily 8, on the clock 10 hrs: "'+o.v.today+'" with an "Overtime now" badge; matches the pay engine');
   ok(/^This week: /.test(o.v.week)&&eq(num(o.v.week),o.v.t)&&/Tracked for you · OT after 8 hrs\/day · estimate/.test(o.v.rule)&&o.v.fit,'5c '+T0+'plus "'+o.v.week+'" and "Tracked for you · OT after 8 hrs/day · estimate"; fits the screen');if(SHOTS)await o.p.screenshot({path:path.join(SHOTS,dev+'-ot-3-clock-live.png')});
   ok(!o.errs.length,'5 '+T0+'no page errors (daily) '+o.errs.join('|').slice(0,140));await o.c.close();
   o=await live(seed({jobs:[job({mode:'daily',dayN:8})],clock:clk(5)}));ok(/^Today: 5(\.\d+)? reg · 0 OT$/.test(o.v.today)&&!o.v.badge,'5d '+T0+'Daily 8, 5 hrs in: "'+o.v.today+'", no badge before the rule is crossed');await o.c.close();
   // Weekly 40: 38 hrs already this week (hours-only entries on other days of the week) + 3 hrs running
   o=await live(seed({jobs:[job({mode:'weekly',weekN:40})],entries:[H(T,19,{start:at(T,'00:01')}),H(T,19,{start:at(T,'00:02')})],clock:clk(3)}));
   ok(eq(num(o.v.today),o.v.d)&&eq(num(o.v.week),o.v.t)&&o.v.t[0]===40&&Math.abs(o.v.t[1]-1)<=0.11&&o.v.badge==='Overtime now'&&/OT after 40 hrs\/week/.test(o.v.rule),'5e '+T0+'Weekly 40, 38 hrs already logged + 3 hrs on the clock: "'+o.v.today+'", "'+o.v.week+'", badge on; matches the pay engine');await o.c.close();
   o=await live(seed({jobs:[job({mode:'daily',dayN:8,dtN:11})],clock:clk(11.5)}));ok(/^Today: 8 reg · 3 OT · 0\.5\d? DT$/.test(o.v.today)&&o.v.badge==='Double time now','5f '+T0+'double time after 11: "'+o.v.today+'", badge says "Double time now"');await o.c.close();
   // the split updates live without a reload (cross the line while watching)
   o=await live(seed({jobs:[job({mode:'daily',dayN:8})],clock:{start:NOW.getTime()-8*3600e3+40000,jobId:'j1',breaks:[],onBreak:null}}));const before=o.v.badge;
   await o.p.evaluate(()=>{const s=OTJ.state();s.clock.start-=60000;});await o.p.waitForFunction(()=>!!document.getElementById('otNow'),null,{timeout:6000}).catch(()=>{});
   ok(!before&&await o.p.evaluate(()=>!!document.getElementById('otNow')),'5g '+T0+'the badge turns on by itself once the 8th hour passes (the screen updates every second, no reload)');await o.c.close();
   // timesheet: every day row and the week total show reg and OT separately
   o=await open(seed({jobs:[job({mode:'daily',dayN:8})],entries:[Wk(D(0),'06:00','16:00'),Wk(D(1),'06:00','13:00')]}));await o.p.click('nav.tabs [data-v=week]');await o.p.waitForTimeout(200);
   const rows=await o.p.evaluate(()=>({days:[...document.querySelectorAll('#sheet [data-daysplit]')].map(x=>x.textContent),tot:document.getElementById('wkSplit').textContent,fit:document.documentElement.scrollWidth-innerWidth<=1}));
   ok(rows.days.join('|')==='8 reg · 2 OT|7 reg · 0 OT'&&rows.tot==='15 reg · 2 OT'&&rows.fit,'5h '+T0+'each day row shows its own split ('+rows.days.join(' | ')+') and the week total shows '+rows.tot);if(SHOTS)await o.p.screenshot({path:path.join(SHOTS,dev+'-ot-4-day-split.png'),fullPage:true});
   ok(!o.errs.length,'5 '+T0+'no page errors (timesheet) '+o.errs.join('|').slice(0,140));await o.c.close();}

  // ── 4. one gross, one take-home ──
  {const money=s=>+String(s).replace(/[^\d.\-]/g,'');
   for(const per of ['weekly','biweekly','semimonthly','monthly']){
    const {c,p,errs}=await open(seed({settings:SET({rate:48.85,period:per,anchor:D(0)}),entries:[H(T,23.5)]}));await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(250);
    const v=await p.evaluate(()=>({g:document.getElementById('wkGross').textContent,n:document.getElementById('wkNet').textContent,cards:[...document.querySelectorAll('#view .card h2')].map(h=>h.textContent),periods:[...document.querySelectorAll('#weekCard [data-period]')].map(x=>x.innerText.replace(/\s+/g,' ')),how:(document.getElementById('wkHow')||{}).textContent||''}));
    const exp=await p.evaluate(()=>{const s=OTJ.state();return OTJ.takeHome(1147.98,0,s.settings).net;});
    ok(v.g==='$1,147.98'&&near(money(v.n),exp),'4a '+T0+per+': week take-home ~$'+money(v.n).toFixed(2)+' = the paycheck estimate at the real pay frequency ($'+exp.toFixed(2)+')');
    if(per==='weekly')ok(v.periods.length===0&&!v.how,'4b '+T0+'weekly: no second figure at all');
    else ok(v.periods.length===1&&/\$1,147\.98 gross so far/.test(v.periods[0])&&near(money(v.periods[0].split('~')[1]),money(v.n))&&/week's share of that paycheck/.test(v.how),'4b '+T0+per+': same gross ($1,147.98) → the paycheck line shows the same take-home as the week (~$'+money(v.n).toFixed(2)+'), with a line saying how it is figured');
    ok(!v.cards.includes('This pay period')&&v.cards.filter(x=>x==='This week').length===1,'4c '+T0+per+': one card for the week (no separate "This pay period" box)');
    await p.click('[data-a=math]');await p.waitForTimeout(200);const mt=(await p.textContent('#otjModal')).replace(/\s+/g,' ');const freq={weekly:'weekly',biweekly:'every 2 weeks',semimonthly:'twice a month',monthly:'monthly'}[per],chk={weekly:52,biweekly:26,semimonthly:24,monthly:12}[per];
    const sum=await p.evaluate(()=>[...document.querySelectorAll('.math tr.sum td')].pop().textContent);
    ok(new RegExp('Pay frequency used: '+freq+' \\('+chk+' paychecks a year\\)').test(mt)&&near(money(sum),money(v.n)),'4d '+T0+per+': Show the math states the pay frequency ("'+freq+'", '+chk+' paychecks) and ends on the same take-home');
    if(per==='biweekly'){if(SHOTS){await p.click('[data-close]');await p.screenshot({path:path.join(SHOTS,dev+'-ot-2-one-card.png'),fullPage:true});}}
    ok(!errs.length,'4 '+T0+per+': no page errors '+errs.join('|').slice(0,140));await c.close();}
   // the exact figures from the phone: $1,147.98 gross, paid every 2 weeks, head of household, FL
   {const {c,p,errs}=await open(seed({settings:SET({rate:48.85,period:'biweekly',anchor:D(0),filing:'hoh'}),entries:[H(T,23.5)]}));await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(250);
    const v=await p.evaluate(()=>({n:document.getElementById('wkNet').textContent,per:document.querySelector('#weekCard [data-period]').innerText,asWeekly:OTJ.takeHome(1147.98,0,Object.assign({},OTJ.state().settings,{period:'weekly'})).net}));
    ok(near(money(v.n),1038.25)&&near(money(v.per.split('~')[1]),1038.25)&&near(v.asWeekly,984.94),'4e '+T0+'the case from the phone: $1,147.98 gross, biweekly → ~$1,038.25 in both places. The old week card showed ~$984.94, which is this gross taxed as a weekly check ($'+v.asWeekly.toFixed(2)+')');
    ok(!errs.length,'4 '+T0+'no page errors (phone case) '+errs.join('|').slice(0,140));await c.close();}
   // a pay period with hours in both of its weeks: each week shows its share, and the shares add up to the paycheck
   {const {c,p,errs}=await open(seed({settings:SET({period:'biweekly',anchor:D(0)}),entries:[H(D(0),10),H(D(1),10),H(D(7),8),H(D(8),8),H(D(9),8)]}));
    const r=await p.evaluate(([a,b])=>{const w1=OTJ.computeWeek(a),w2=OTJ.computeWeek(b),s1=OTJ.weekShare(w1),s2=OTJ.weekShare(w2);const pt=OTJ.rangeTotals(a,OTJ.periodRange(a).to);return {n1:s1.net,n2:s2.net,sh1:s1.parts[0].share,pay:OTJ.takeHome(pt.gross,0,OTJ.state().settings).net,g:pt.gross,parts:s1.parts.length};},[D(0),D(7)]);
    ok(r.parts===1&&near(r.g,1232)&&Math.abs(r.n1+r.n2-r.pay)<0.02&&near(r.sh1,560/1232),'4f '+T0+'biweekly, hours in both weeks: week 1 (~$'+r.n1.toFixed(2)+') + week 2 (~$'+r.n2.toFixed(2)+') = the paycheck (~$'+r.pay.toFixed(2)+')');
    await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);const card=(await p.textContent('#weekCard')).replace(/\s+/g,' ');await p.click('[data-a=math]');await p.waitForTimeout(200);const mt=(await p.textContent('#otjModal')).replace(/\s+/g,' ');
    if(TI<=1||true)ok(/\$1,232\.00 gross so far/.test(card)&&/This week is 45\.5% of that period's pay so far/.test(mt)&&/paid every 2 weeks/.test(mt)&&/then this week gets its share/.test(mt),'4g '+T0+'the card shows the paycheck it belongs to ($1,232.00 gross so far); the math says "This week is 45.5% of that period\'s pay"');
    ok(/\d{4} so far: \d/.test(await p.textContent('#yearLine')),'4h '+T0+'the card ends with a year-so-far line (hours and gross)');
    ok(!errs.length,'4 '+T0+'no page errors (two-week period) '+errs.join('|').slice(0,140));await c.close();}
   // a week that straddles two pay periods (twice a month, Sunday week Nov 15–21, 2026: the 15th is one period, 16th–21st the next)
   {const {c,p,errs}=await open(seed({settings:SET({period:'semimonthly',weekStart:0}),entries:[H('2026-11-15',8),H('2026-11-16',8),H('2026-11-10',8)]}));
    const r=await p.evaluate(()=>{const w=OTJ.computeWeek('2026-11-15'),s=OTJ.weekShare(w);const S=OTJ.state().settings;return {parts:s.parts.map(x=>[x.pr.from,x.pr.to,Math.round(x.share*1000)/1000,x.net]),net:s.net,a:OTJ.takeHome(448,0,S).net,b:OTJ.takeHome(224,0,S).net};});
    ok(r.parts.length===2&&r.parts[0][0]==='2026-11-01'&&r.parts[1][0]==='2026-11-16'&&r.parts[0][2]===0.5&&r.parts[1][2]===1&&Math.abs(r.net-(r.a*0.5+r.b))<0.02,'4i '+T0+'a week across two pay periods takes its share of each: half of the 1st–15th check + all of the 16th–30th check so far (~$'+r.net.toFixed(2)+')');
    ok(!errs.length,'4 '+T0+'no page errors (straddle) '+errs.join('|').slice(0,140));await c.close();}
  }
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
