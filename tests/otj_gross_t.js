// Clocked In: gross never includes per diem (every card, the pay math and the CSV agree); setup wording; bonus base excludes per diem.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_gross_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18886,O='http://127.0.0.1:'+PORT;
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
  const scr=x=>+String(x).replace(/[^\d.]/g,'');const txt=async(p,sel)=>(await p.innerText(sel)).replace(/\s+/g,' ');
  const csvOf=async p=>{const t=await p.evaluate(()=>OTJ.buildCSV());const rows=csvParse(t);const h=rows[0];return {raw:t,rows:rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])))};};
  // Hunter's phone case: 12 hrs × $20 + $70 per diem (not taxed), paid weekly
  const base=x=>seed(Object.assign({settings:SET({rate:20,perDiemTax:'no',perDiemNT:true}),jobs:[job(null,{perDiem:70})],entries:[H(T,12,{start:at(T,'00:00')})]},x));

  {const {c,p,errs}=await open(base());
   ok((await p.textContent('#earnToday'))==='$240.00'&&(await p.textContent('#earnWeek'))==='$240.00'&&(await p.textContent('#pdTodayAmt'))==='$70.00'&&/on top of your pay/.test(await p.textContent('#pdToday')),'1a '+T0+'Today: Earned today $240.00 and This week so far $240.00 (12 hrs × $20); per diem $70.00 is on its own line, not added in');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);
   ok((await p.textContent('#wkGross'))==='$240.00','1b '+T0+'This week card: "Gross so far" is $240.00, not $310.00 (the phone bug)');
   ok(/^Per diem 1 day · not part of gross \$70\.00$/.test(await txt(p,'#wkPd')),'1c '+T0+'…with per diem on its own line: "Per diem · 1 day · not part of gross · $70.00"');
   ok((await p.textContent('#wkNet'))==='~$291.64','1d '+T0+'take-home is unchanged: ~$291.64 ($240 − Social Security and Medicare on $240, + $70 untaxed per diem)');
   ok(/\$240\.00/.test(await p.innerText('#sheet .tsday.today .tsp'))&&/\$70\.00 per diem/.test(await p.innerText('#sheet .tsday.today [data-daypd]')),'1e '+T0+'the day row shows $240.00 for the hours and "$70.00 per diem" beside the split');
   ok(/2026 so far:.*\$240\.00 gross \+ \$70\.00 per diem$/.test((await txt(p,'#yearLine')).replace(/^\d{4}/,'2026')),'1f '+T0+'year line: "$240.00 gross + $70.00 per diem"');
   await p.click('[data-a=math]');await p.waitForTimeout(150);const math=await txt(p,'#otjModal');
   ok(/Gross pay \(hours × rate, OT, PTO\) \$240\.00/.test(math)&&/Per diem \$70\.00/.test(math)&&/Est\. take-home \$291\.64/.test(math)&&!/310/.test(math),'1g '+T0+'Show the math: Gross pay $240.00, Per diem $70.00, Est. take-home $291.64');await p.click('#otjModal [data-close]');
   await p.click('#sheet .tsday.today .tsd');await p.waitForTimeout(150);ok(/12 hrs · \$240\.00 \+ \$70\.00 per diem/.test(await txt(p,'#otjModal')),'1h '+T0+'the day sheet: "12 hrs · $240.00 + $70.00 per diem"');await p.click('#otjModal [data-close]');
   const {raw,rows}=await csvOf(p);const sum=k=>rows.reduce((a,r)=>a+(+r[k]||0),0);
   ok(sum('Gross (estimate)')===240&&sum('Per diem')===70&&!/310/.test(raw),'1i '+T0+'CSV: Gross (estimate) column totals 240, Per diem column totals 70');
   // the same split everywhere, for a 2-week pay period too
   await load(p,base({settings:SET({rate:20,period:'biweekly',anchor:D(0),perDiemTax:'no',perDiemNT:true})}));await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);
   ok(/^\$240\.00 gross so far \+ \$70\.00 per diem$/.test(await txt(p,'#weekCard [data-ppsplit]'))&&(await p.textContent('#wkGross'))==='$240.00','1j '+T0+'paid every 2 weeks: the paycheck line reads "$240.00 gross so far + $70.00 per diem"');
   const pr=await p.evaluate(([a,z])=>{const t=OTJ.rangeTotals(a,z);return [t.gross,t.perDiem];},[D(0),D(6)]);ok(pr[0]===240&&pr[1]===70,'1k '+T0+'pay-period totals keep them apart ($240 gross, $70 per diem)');
   // sweep: with per diem on every worked day, no screen ever shows gross + per diem as one number
   await load(p,base({settings:SET({rate:20,perDiemTax:'yes'}),entries:[H(D(0),10),H(D(1),10),H(T,12,{start:at(T,'00:00')})].filter((e,i,a)=>a.findIndex(x=>x.date===e.date)===i)}));
   const w=await p.evaluate(wk=>{const w=OTJ.computeWeek(wk);return {g:w.tot.gross,pd:w.tot.perDiem,days:w.keys.map(k=>[w.days[k].gross,w.days[k].perDiem])};},D(0));const fm=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
   const combined=[fm(w.g+w.pd)].concat(w.days.filter(d=>d[1]>0).map(d=>fm(d[0]+d[1])));let seen=[];
   for(const v of ['today','week','pto','more']){await p.click('nav.tabs [data-v='+v+']');await p.waitForTimeout(150);const t=await p.innerText('body');combined.forEach(cb=>{if(t.includes(cb))seen.push(v+':'+cb);});}
   await p.click('nav.tabs [data-v=week]');await p.click('[data-a=math]');await p.waitForTimeout(150);const mt=await p.innerText('#otjModal table.math');const thTotal=mt.includes(fm(w.g+w.pd))||!mt.includes(fm(w.g))||!mt.includes(fm(w.pd));await p.click('#otjModal [data-close]');
   ok(w.pd>0&&!seen.length&&(await p.textContent('#wkGross'))===fm(w.g)&&(await p.textContent('#wkPdAmt'))===fm(w.pd)&&!thTotal,'1l '+T0+'sweep of Clock, Timesheet, PTO, More and Show the math with '+fm(w.pd)+' per diem in the week: no gross figure includes per diem anywhere '+seen.join(','));
   const c2=await csvOf(p);const wr=c2.rows.filter(r=>r.Date>=D(0)&&r.Date<=D(6));ok(near(wr.reduce((a,r)=>a+(+r['Gross (estimate)']||0),0),w.g)&&near(wr.reduce((a,r)=>a+(+r['Per diem']||0),0),w.pd),'1m '+T0+'CSV agrees with the card: Gross column = Gross so far, Per diem column = Per diem');
   ok(!errs.length,'1 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 2. setup wording ──
  {const {c,p,errs}=await open(null);const sum=await txt(p,'#preTaxBox summary');
   ok(/^Take anything out before taxes\? 401\(k\), health insurance, W-4 extras\. Optional\.$/.test(sum)&&!/More \(optional\)/.test(await p.innerText('#view')),'2a '+T0+'setup asks "Take anything out before taxes?" with "401(k), health insurance, W-4 extras. Optional." under it (the bare "More (optional)" heading is gone)');
   const ctl=sel=>p.evaluate(sel=>{const s=document.querySelector(sel+' summary'),sh=s.querySelector('.sh'),r=s.getBoundingClientRect(),b=sh.getBoundingClientRect();return {label:getComputedStyle(sh,'::after').content.replace(/"/g,''),h:r.height,inside:b.right<=r.right+0.5&&b.left>r.left+r.width/2,fits:r.right<=innerWidth+0.5,border:getComputedStyle(s).borderTopWidth};},sel);
   let a=await ctl('#preTaxBox');ok(/^Show/.test(a.label)&&a.h>=44&&a.inside&&a.fits&&a.border==='1px'&&!(await p.isVisible('#sK')),'2b '+T0+'collapsed, it is a boxed row with an obvious "Show ▾" control on the right (full-size tap target); the fields are hidden');
   await p.click('#preTaxBox summary');a=await ctl('#preTaxBox');ok(/^Hide/.test(a.label)&&await p.isVisible('#sK')&&await p.isVisible('#sH')&&await p.isVisible('#sCr')&&await p.isVisible('#sX'),'2c '+T0+'tapping it opens the 401(k), health, W-4 credits and extra withholding boxes and the control changes to "Hide ▴"');
   if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-setup-pretax.png'),fullPage:true});
   const bb=await ctl('#bonusBox');ok(/^Show/.test(bb.label)&&/^Bonus \(optional\) A percent of your pay or a flat amount\.$/.test(await txt(p,'#bonusBox summary')),'2d '+T0+'the Bonus section uses the same pattern');
   await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','20');await p.fill('#sK','50');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);ok((await st(p)).settings.k401===50,'2e '+T0+'the fields still save (401(k) $50)');
   await p.click('nav.tabs [data-v=more]');await p.click('[data-a=setup]');await p.waitForTimeout(150);a=await ctl('#preTaxBox');ok(/^Hide/.test(a.label)&&await p.isVisible('#sK')&&await p.inputValue('#sK')==='50','2f '+T0+'editing pay setup later opens it already, with the saved amount showing');
   ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),'2g '+T0+'setup fits the screen');ok(!errs.length,'2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 3. bonus base never includes per diem ──
  {const {c,p,errs}=await open(seed());const bon=s=>p.evaluate(([s,t])=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();const b=OTJ.bonusCalc(t);return b?[b.base,b.bonus]:null;},[s,T]);
   let r=await bon(base({settings:SET({rate:20,perDiemTax:'no',perDiemNT:true,bonus:{basis:'all',pct:10}})}));ok(r[0]===240&&r[1]===24,'3a '+T0+'bonus as a percent of all pay: 10% of $240.00 = $24.00 (the $70 per diem is not in the base)');
   r=await bon(base({settings:SET({rate:20,perDiemTax:'yes',bonus:{basis:'all',pct:10}})}));ok(r[0]===240,'3b '+T0+'same when per diem is taxed');
   r=await bon(base({settings:SET({rate:20,perDiemTax:'yes',bonus:{basis:'base',pct:10}})}));ok(r[0]===240,'3c '+T0+'regular-pay-only bonus: base $240.00');
   r=await bon(base({settings:SET({rate:20,perDiemTax:'yes',bonus:{basis:'job',pct:10,jobId:'j1'}})}));ok(r[0]===240,'3d '+T0+'one-job bonus: base $240.00');
   r=await bon(base({settings:SET({rate:20,perDiemTax:'yes',perDiemEach:true,bonus:{basis:'all',pct:10}}),pdDay:{[D(0)]:true,[D(1)]:true},entries:[H(T,12,{start:at(T,'00:00')})]}));const pd=await p.evaluate(wk=>OTJ.computeWeek(wk).tot.perDiem,D(0));
   ok(r[0]===240&&pd>=70,'3e '+T0+'per diem ticked on extra days ($'+pd+' in the week) still adds nothing to the bonus base');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);ok(/10% of \$240\.00 earned/.test(await txt(p,'#bonusLine')),'3f '+T0+'the bonus line on the week card says "10% of $240.00 earned…"');
   ok(!errs.length,'3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
