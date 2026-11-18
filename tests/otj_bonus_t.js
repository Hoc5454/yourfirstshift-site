// Clocked In: bonus estimate in pay setup, plus a deeper check of the pay engine (random weeks) and the start-time picker.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_bonus_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18892,O='http://127.0.0.1:'+PORT;
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


  // ── 1. bonus math ──
  {const {c,p,errs}=await open(seed());
   const bon=(state)=>p.evaluate(([s,t])=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();return OTJ.bonusCalc(t);},[state,T]);
   const wk=()=>[0,1,2,3].map(i=>H(D(i),10)).concat([H(D(4),5)]);   // 45 hrs: 40 reg + 5 OT at $28 → $1,120 + $210 = $1,330 (some days may be after today: only days up to today count)
   const upTo=wk().filter(e=>e.date<=T);const hrsSoFar=upTo.reduce((a,e)=>a+e.manualHours,0);const reg=Math.min(40,hrsSoFar),ot=hrsSoFar-reg,gross=reg*28+ot*42;
   let r=await bon(seed({settings:SET({bonus:{basis:'all',pct:9}}),entries:wk()}));
   ok(r&&near(r.base,gross)&&near(r.bonus,Math.round(gross*9)/100),'1a '+T0+'9% of all pay this year (regular + overtime): 9% of $'+gross.toFixed(2)+' = $'+(gross*0.09).toFixed(2));
   ok(near(r.tax,Math.round(r.bonus*(0.22+0.062+0.0145)*100)/100)&&near(r.net,r.bonus-r.tax),'1b '+T0+'after taxes: 22% federal flat rate + 6.2% Social Security + 1.45% Medicare (FL: no state tax) → $'+r.net.toFixed(2));
   r=await bon(seed({settings:SET({bonus:{basis:'base',pct:9}}),entries:wk()}));ok(near(r.base,reg*28),'1c '+T0+'regular pay only: overtime is left out of the base ($'+(reg*28).toFixed(2)+')');
   r=await bon(seed({settings:SET({bonus:{basis:'all',pct:9,prior:62000,priorYear:T.slice(0,4)}}),entries:wk()}));ok(near(r.base,gross+62000)&&near(r.bonus,Math.round((gross+62000)*9)/100),'1d '+T0+'pay earned before using the app is added in: 9% of $'+(gross+62000).toFixed(2));
   r=await bon(seed({settings:SET({bonus:{basis:'all',pct:9,prior:62000,priorYear:String(+T.slice(0,4)-1)}}),entries:wk()}));ok(near(r.base,gross),'1e '+T0+'a "before the app" amount entered for last year is not carried into this year');
   r=await bon(seed({settings:SET({bonus:{basis:'flat',amount:1500}}),entries:wk()}));ok(r.bonus===1500&&near(r.net,1500-1500*0.2965),'1f '+T0+'flat amount: $1,500 → $1,055.25 after taxes');
   const two=seed({settings:SET({bonus:{basis:'job',pct:5,jobId:'jB'}}),jobs:[job(null,{id:'jA'}),job(null,{id:'jB',name:'Example Iron Works',rate:'30'})],entries:[H(D(0),8,{jobId:'jA'}),H(D(0),6,{jobId:'jB',start:at(D(0),'12:01')})]});
   r=await bon(two);ok(near(r.base,D(0)<=T?180:0)&&near(r.bonus,D(0)<=T?9:0),'1g '+T0+'one job only: 5% of the $180.00 earned at that job, the other job left out');
   r=await bon(seed({settings:SET({bonus:{basis:'all',pct:9}}),entries:[H((+T.slice(0,4)-1)+'-12-30',10),H(D(0),10)]}));ok(near(r.base,D(0)<=T&&D(0).slice(0,4)===T.slice(0,4)?280:0),'1h '+T0+'last year\'s hours are not counted in this year\'s bonus');
   r=await bon(seed({settings:SET({state:'GA',stateRate:5,bonus:{basis:'flat',amount:1000}})}));ok(near(r.net,1000-1000*(0.2965+0.05)),'1i '+T0+'a state tax rate from Pay setup is taken off too ($1,000 → $653.50 in a 5% state)');
   r=await bon(seed({settings:SET({bonus:{basis:'all',pct:9}}),entries:[H(D(0),8),{id:'pp',kind:'pto',date:D(0),hours:8,bucket:'v',jobId:'j1'}]}));ok(near(r.base,D(0)<=T?448:0),'1j '+T0+'PTO pay counts toward the bonus base; per diem does not');
   for(const [nm,b] of [['no bonus set',undefined],['basis none',{basis:'none',pct:9}],['percent missing',{basis:'all'}],['percent over 100',{basis:'all',pct:900}],['negative',{basis:'all',pct:-5}],['wrong type','x'],['flat with no amount',{basis:'flat'}],['unknown basis',{basis:'zzz',pct:9}]]){r=await bon(seed({settings:SET({bonus:b}),entries:wk()}));if(r)ok(false,'1k '+T0+nm+' → no bonus');}
   ok(true,'1k '+T0+'no bonus, or a damaged bonus setting (missing, over 100%, negative, wrong type), shows no bonus and breaks nothing');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);ok(!(await p.$('#bonusLine')),'1l '+T0+'with no bonus set, the week card has no bonus line');
   ok(!errs.length,'1 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 2. on screen ──
  {const {c,p,errs}=await open(null);
   ok(/Bonus \(optional\)/.test(await p.textContent('#bonusBox summary'))&&await p.evaluate(()=>!document.getElementById('bonusBox').open),'2a '+T0+'first-run pay setup has a closed "Bonus (optional)" section (nothing extra to fill in unless you want it)');
   await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.selectOption('#sWs','1');await p.click('#bonusBox summary');
   const opts=await p.$$eval('#sBb option',o=>o.map(x=>x.textContent));ok(opts.length===4&&/No bonus/.test(opts[0])&&/all my pay for the year \(regular \+ overtime\)/.test(opts[1])&&/regular pay only/.test(opts[2])&&/flat dollar amount/.test(opts[3]),'2b '+T0+'choices: No bonus, percent of all pay, percent of regular pay only, flat amount (one job only appears with 2+ jobs)');
   await p.selectOption('#sBb','all');ok(await p.isVisible('#sBp')&&await p.isVisible('#sBpr')&&!(await p.isVisible('#sBa')),'2c '+T0+'choosing a percent shows the percent box and the optional "earned before" box');
   await p.click('[data-a=saveSetup]');await p.waitForTimeout(200);ok(/Set up your pay/.test(await p.textContent('#view'))&&/Enter your bonus percent/.test(await p.textContent('.toast')),'2d '+T0+'a bonus type with no percent is not saved: it asks for the percent');
   await p.fill('#sBp','9');await p.fill('#sBpr','62,000');await p.click('[data-a=saveSetup]');await p.waitForTimeout(300);let s=await st(p);
   ok(s.settings.bonus.basis==='all'&&s.settings.bonus.pct===9&&s.settings.bonus.prior===62000&&s.settings.bonus.priorYear===T.slice(0,4),'2e '+T0+'9% of all pay, with $62,000 earned before, is saved');
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','06:00');await p.fill('#eEnd','16:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(250);
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);const bl=(await p.textContent('#bonusLine')).replace(/\s+/g,' ');
   ok(/Bonus so far\d{4} · estimate ?~\$5,605\.20\+\$25\.20 this week/.test(bl)&&await p.evaluate(()=>{const c=document.getElementById('weekCard'),b=document.getElementById('bonusLine'),n=document.getElementById('wkNet'),m=c.querySelector('[data-a=math]');return c.contains(b)&&(n.compareDocumentPosition(b)&4)&&(b.compareDocumentPosition(m)&4);})&&/9% of \$62,280\.00 earned in \d{4} \(regular \+ overtime\), including \$62,000\.00 from before you started here/.test(bl)&&/About \$3,943\.26 after taxes/.test(bl)&&/Your employer decides the final amount/.test(bl),'2f '+T0+'in the earnings box, right under take-home: "Bonus so far ~$5,605.20, +$25.20 this week · 9% of $62,280.00 … About $3,943.26 after taxes … Your employer decides the final amount"');
   ok(await p.evaluate(()=>{const e=document.getElementById('bonusLine');const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+0.5&&document.documentElement.scrollWidth-innerWidth<=1;}),'2g '+T0+'the bonus line fits the screen');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-bonus-1-card.png'),fullPage:true});
   await p.click('nav.tabs [data-v=more]');ok(/bonus 9% of all pay this year/.test(await p.textContent('#view')),'2h '+T0+'More → Pay setup summary names the bonus');
   await p.click('[data-a=setup]');await p.waitForTimeout(150);ok(await p.evaluate(()=>document.getElementById('bonusBox').open)&&await p.inputValue('#sBp')==='9'&&await p.inputValue('#sBpr')==='62000','2i '+T0+'Pay setup reopens with the bonus filled in');if(SHOTS){await p.evaluate(()=>document.getElementById('bonusBox').scrollIntoView());await p.screenshot({path:path.join(SHOTS,dev+'-bonus-2-setup.png')});}
   await p.selectOption('#sBb','flat');await p.fill('#sBa','1500');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);
   ok(/~\$1,500\.00/.test(await p.textContent('#bonusLine'))&&/Flat amount you entered/.test(await p.textContent('#bonusLine'))&&!(await p.$('#bonusWk')),'2j '+T0+'switching to a flat $1,500 shows on the card');
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(hist.some(x=>/Changed pay setup: bonus 9% of all pay this year \(regular \+ overtime\) → \$1,500\.00 flat/.test(x))&&!/[{}]|object Object/.test(hist.join('')),'2k '+T0+'Change history: "Changed pay setup: bonus 9% of all pay this year (regular + overtime) → $1,500.00 flat"');
   await p.click('nav.tabs [data-v=more]');await p.evaluate(()=>{navigator.canShare=null;});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('[data-a=backup]')]);const f1=path.join(os.tmpdir(),'yfs-bonus-'+dev+'.json');if(dl)await dl.saveAs(f1);
   await p.evaluate(()=>{const s=OTJ.state();delete s.settings.bonus;localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();});await p.click('nav.tabs [data-v=more]');if(dl){await p.setInputFiles('#restoreFile',f1);await p.waitForTimeout(500);}s=await st(p);
   ok(!!dl&&s.settings.bonus.basis==='flat'&&s.settings.bonus.amount===1500,'2l '+T0+'backup and restore keep the bonus setting');
   const old={app:'yfs-on-the-job',kind:'backup',v:1,exported:Date.now()-86400000,data:seed({entries:[H(D(0),8)]})};const f2=path.join(os.tmpdir(),'yfs-bonus-old-'+dev+'.json');fs.writeFileSync(f2,JSON.stringify(old));await p.setInputFiles('#restoreFile',f2);await p.waitForTimeout(500);s=await st(p);
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);ok(s.settings.bonus.basis==='none'&&!(await p.$('#bonusLine'))&&s.entries.length===1,'2m '+T0+'an old backup with no bonus restores cleanly with no bonus line');
   ok(!errs.length,'2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  // one-job option appears with two jobs
  {const {c,p,errs}=await open(seed({jobs:[job(null,{id:'jA'}),job(null,{id:'jB',name:'Example Iron Works'})]}),true);await p.click('nav.tabs [data-v=more]');await p.click('[data-a=setup]');await p.waitForTimeout(150);await p.click('#bonusBox summary');
   await p.selectOption('#sBb','job');await p.selectOption('#sBj','jB');await p.fill('#sBp','5');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);const s=await st(p);
   ok(s.settings.bonus.basis==='job'&&s.settings.bonus.jobId==='jB'&&/bonus 5% of pay from Example Iron Works/.test(await p.textContent('#view')),'2n '+T0+'with two jobs, "a percent of my pay from one job" is offered and saved');ok(!errs.length,'2 '+T0+'no page errors (two jobs) '+errs.join('|').slice(0,140));await c.close();}

  // ── 3. deeper check of the last update ──
  {const {c,p,errs}=await open(seed());
   // random weeks through the pay engine: the split must always add up, never go negative, and "both" must never give less OT than either rule alone
   const fz=await p.evaluate(([wk,days])=>{let seedN=12345;const rnd=()=>{seedN=(seedN*1103515245+12345)&0x7fffffff;return seedN/0x7fffffff;};const r2=n=>Math.round(n*100)/100;const bad=[];let n=0;
     const S0=JSON.stringify(OTJ.state());
     for(let t=0;t<400;t++){const s=JSON.parse(S0);const ents=[];const nE=1+Math.floor(rnd()*9);for(let i=0;i<nE;i++){const d=days[Math.floor(rnd()*7)];ents.push({id:'f'+i,kind:rnd()<0.12?'pto':'work',date:d,start:new Date(d+'T00:00:00').getTime()+i*60000,manualHours:r2(0.25+rnd()*15.5),hours:r2(1+rnd()*8),bucket:'v',breakMin:0,jobId:'j1',codeId:'',splits:[],note:''});}
       const dayN=4+Math.floor(rnd()*8),weekN=20+Math.floor(rnd()*40),dtN=rnd()<0.4?dayN+1+Math.floor(rnd()*6):'',mult=rnd()<0.2?2:1.5;const res={};
       for(const mode of ['weekly','daily','both']){s.entries=ents;s.jobs=[{id:'j1',name:'J',rate:'',otRate:'',active:true,ot:{mode,dayN,weekN,dtN,mult},otHist:[{rule:{mode,dayN,weekN,dtN,mult},effectiveFrom:'1970-01-01'}]}];localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();const w=OTJ.computeWeek(wk);n++;
         const worked=r2(ents.filter(e=>e.kind!=='pto').reduce((a,e)=>a+e.manualHours,0)),pto=r2(ents.filter(e=>e.kind==='pto').reduce((a,e)=>a+e.hours,0));res[mode]=w.tot;
         const items=[];w.keys.forEach(k=>w.days[k].items.forEach(it=>items.push(it)));
         if(Math.abs(w.tot.reg+w.tot.ot+w.tot.dt-worked)>0.06)bad.push(mode+' split != worked '+JSON.stringify(w.tot)+' vs '+worked);
         if(Math.abs(w.tot.pto-pto)>0.06)bad.push(mode+' pto');
         if(items.some(it=>it.reg<-1e-9||it.ot<-1e-9||it.dt<-1e-9||Math.abs(it.reg+it.ot+it.dt+it.pto-it.hours)>0.011))bad.push(mode+' entry split');
         const exp=w.tot.reg*28+w.tot.ot*28*mult+w.tot.dt*56+w.tot.pto*28;if(Math.abs(exp-w.tot.gross)>0.2)bad.push(mode+' gross '+w.tot.gross+' vs '+exp);
         if(mode==='weekly'&&w.tot.reg>weekN+0.06)bad.push('weekly reg over the limit');
         if(mode==='daily'&&w.keys.some(k=>w.days[k].reg>dayN+0.011))bad.push('daily reg over the limit');
         if(dtN&&w.keys.some(k=>w.days[k].reg+w.days[k].ot>dtN+0.011))bad.push(mode+' hours past the double-time mark not paid as DT');}
       if(res.both.ot+res.both.dt<res.weekly.ot+res.weekly.dt-0.06||res.both.ot+res.both.dt<res.daily.ot+res.daily.dt-0.06)bad.push('both < single rule');
       if(bad.length>5)break;}
     localStorage.setItem('yfs_otj_v1',S0);OTJ.reload();return {n,bad:bad.slice(0,4)};},[D(0),[0,1,2,3,4,5,6].map(D)]);
   ok(fz.n===1200&&!fz.bad.length,'3a '+T0+'1,200 random weeks (400 schedules x weekly / daily / both, with and without double time): reg + OT + DT always equals hours worked, pay matches the split, limits hold, and "both" never gives less premium time than either rule alone '+fz.bad.join(' | ').slice(0,200));
   // start-time picker: cannot start inside a shift already logged
   const st0=seed({entries:[Wk(T,'06:00','10:30')]});await p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},st0);
   await p.click('[data-a=forgotin]');await p.waitForTimeout(150);await p.fill('#sD',T);await p.fill('#sT','09:00');await p.click('#sGo');await p.waitForTimeout(150);let s=await st(p);
   ok(!s.clock&&/already have a shift logged until 10:30am/.test(await p.textContent('#sErr')),'3b '+T0+'"Forgot to clock in": a start inside a shift already logged (9:00, shift runs to 10:30) is refused, so no hours are counted twice');
   await p.fill('#sT','10:30');await p.click('#sGo');await p.waitForTimeout(200);s=await st(p);ok(s.clock&&s.clock.start===at(T,'10:30'),'3c '+T0+'starting right when that shift ended (10:30) is allowed');
   await p.click('[data-a=stop]');await p.waitForTimeout(200);
   // 24-hour tick does not carry over to other times
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','03:00');await p.fill('#eEnd','03:00');await p.check('#e24');await p.fill('#eEnd','04:00');await p.fill('#eEnd','03:00');await p.waitForTimeout(80);
   ok(!(await p.isChecked('#e24')),'3d '+T0+'the 24-hour tick clears when the times change, so it must be confirmed again');await p.click('#eSave');await p.waitForTimeout(150);ok(/same time/.test(await p.textContent('#eErr'))&&(await st(p)).entries.filter(e=>!e.deleted).length===2,'3e '+T0+'…and Save is blocked until it is');
   ok(!errs.length,'3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
