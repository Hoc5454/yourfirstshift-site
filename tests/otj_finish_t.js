// Clocked In finish-line checks: the take-home estimate is never shown below $0 (early in a pay period the 401(k), health and extra
// withholding that come out of every paycheck can be more than the pay so far); there is a way to reach us from inside the app, plus the
// Privacy and Terms pages; a brand-new user chooses their own state (it is no longer filled in as Florida); and "1 hr" is not "1 hrs". Page clock pinned (US Eastern). Made-up data only.
// Usage: node otj_finish_t.js .. [shotDir]
process.env.TZ='America/New_York';
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18870,O='http://127.0.0.1:'+PORT,KEY='yfs_otj_v1';
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0,passes=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(c)passes++;else fails++;};
const pad=n=>String(n).padStart(2,'0');const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const P=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(k,n)=>{const d=P(k);d.setDate(d.getDate()+n);return ymd(d);};const at=(k,hm)=>{const p=k.split('-'),t=hm.split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1],0,0).getTime();};
const r2=n=>Math.round(n*100)/100;const money=n=>(n<0?'-':'')+'$'+Math.abs(r2(n)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
// paid every 2 weeks from Monday Nov 16; $150 401(k) and $95 health come out of every paycheck
const SET=x=>Object.assign({rate:28,otRate:'',period:'biweekly',anchor:'2026-11-16',weekStart:1,state:'FL',stateRate:'',filing:'single',k401:150,health:95,credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
const shift=(d,a,z,n)=>({id:'w'+n,kind:'work',date:d,start:at(d,a),end:at(d,z),breakMin:0,jobId:'j1',codeId:'',splits:[],note:''});
const state=(T,entries,settings)=>({app:'yfs-on-the-job',v:1,created:at(addDays(T,-30),'08:00'),settings:settings===undefined?SET():settings,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true}],codes:[{id:'c1',nick:'AFE-7781',jobId:'j1',fields:{proj:'AFE-7781'},active:true}],entries,pto:{buckets:[]},clock:null,log:[],lastBackup:at(T,'08:00'),pdCharge:{},pdDay:{},ui:{a2hsX:1}});
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 const open=async(T,st)=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',timezoneId:'America/New_York'});
   await c.addInitScript(([now,v])=>{const _D=Date;const off=now-_D.now();class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');if(v)localStorage.setItem('yfs_otj_v1',v);}},[at(T,'12:00'),st?JSON.stringify(st):'']);
   const p=await c.newPage();p.setDefaultTimeout(8000);const h={c,p,errs:[]};p.on('pageerror',e=>h.errs.push(e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(150);return h;};
 const card=p=>p.evaluate(()=>({net:document.getElementById('wkNet').innerText,gross:document.getElementById('wkGross').innerText,floor:(document.getElementById('wkFloor')||{innerText:''}).innerText}));
 const math=async p=>{await p.click('[data-a=math]');await p.waitForTimeout(150);const r=await p.evaluate(()=>({rows:[...document.querySelectorAll('#otjModal table.math tr')].map(x=>x.innerText.replace(/\s+/g,' ')),floor:[...document.querySelectorAll('#otjModal [data-floor]')].map(x=>x.innerText.replace(/\s+/g,' '))}));await p.keyboard.press('Escape');await p.waitForTimeout(100);return r;};
 // ── 1. First day of a pay period: 3 hours ($84) against $245 of per-check deductions ──
 {const T='2026-11-16',h=await open(T,state(T,[shift(T,'07:00','10:00',1)])),p=h.p;await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);const c=await card(p),m=await math(p);
  ok(c.gross==='$84.00'&&c.net==='~$0.00'&&/more than your pay so far this pay period, so take-home shows \$0 until your hours pass it/.test(c.floor),'day one of a pay period, $84 earned, $245 comes out of every paycheck: take-home shows '+c.net+' with a plain reason (it used to show ~-$161.00)');
  ok(m.floor.length===1&&/is \$161\.00 more than this pay period's pay so far\. Take-home can't go below \$0/.test(m.floor[0])&&m.rows.some(x=>/^Est\. take-home \$0\.00$/.test(x))&&m.rows.some(x=>/^Pre-tax 401\(k\) −\$150\.00$/.test(x))&&m.rows.some(x=>/^Pre-tax health −\$95\.00$/.test(x)),'Show the math still lists the full $150 and $95, says they are $161.00 ahead of the pay, and ends on $0.00');
  const t=await p.evaluate(()=>{const s=OTJ.state().settings,a=OTJ.takeHome(84,0,s),z=OTJ.takeHome(2240,0,s),n=OTJ.takeHome(0,0,s);return {a:[a.net,a.short],z:[z.net,z.short,Math.round((z.total-150-95-z.fed-z.ss-z.med-z.addl-z.state)*100)/100],n:[n.net,n.short]};});
  ok(t.a[0]===0&&t.a[1]===161&&t.z[1]===0&&t.z[0]===t.z[2]&&t.z[0]>1500&&t.n[0]===0&&t.n[1]===0,'the pay math: $84 gives $0 (short by $161); a full $2,240 paycheck is figured exactly as before ('+money(t.z[0])+'); no pay at all gives $0 with no warning');
  if(SHOTS)await p.screenshot({path:path.join(SHOTS,'finish-1-floor.png')});ok(!h.errs.length,'no errors on day one '+h.errs.join(' | '));await h.c.close();}
 // ── 2. Later in the same pay period the estimate is positive and unchanged; an empty week shows no warning; no deductions never warns ──
 {const T='2026-11-20',days=[0,1,2,3,4].map((i,n)=>shift(addDays('2026-11-16',i),'07:00','15:00',n)),h=await open(T,state(T,days)),p=h.p;await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);const c=await card(p),m=await math(p);
  const want=await p.evaluate(()=>{const z=OTJ.takeHome(1120,0,OTJ.state().settings);return Math.round((z.total-150-95-z.fed-z.ss-z.med-z.addl-z.state)*100)/100;});
  ok(c.gross==='$1,120.00'&&c.net==='~'+money(want)&&want>700&&!c.floor&&!m.floor.length,'by Friday ($1,120 earned) take-home is '+c.net+', figured as before, and the warning is gone');
  await p.click('[data-a=wnext]');await p.waitForTimeout(150);const e=await card(p);ok(e.net==='~$0.00'&&!e.floor,'a week with no hours yet shows ~$0.00 and no warning');await h.c.close();
  const n=await open('2026-11-16',state('2026-11-16',[shift('2026-11-16','07:00','10:00',1)],SET({k401:'',health:''})));await n.p.click('nav.tabs [data-v=week]');await n.p.waitForTimeout(150);const c2=await card(n.p);
  ok(/^~\$7\d\.\d\d$/.test(c2.net)&&!c2.floor&&!n.errs.length,'with nothing coming out of the paycheck, day one shows '+c2.net+' and never warns');await n.c.close();}
 // ── 3. A way to reach us, and the legal pages, on every tab ──
 {const T='2026-11-20',h=await open(T,state(T,[shift(T,'07:00','15:00',1)])),p=h.p,wrong=[];
  for(const v of ['today','week','pto','more']){await p.click('nav.tabs [data-v='+v+']');await p.waitForTimeout(100);const f=await p.evaluate(()=>[...document.querySelectorAll('#footLinks a')].map(a=>({t:a.innerText,h:a.getAttribute('href'),hh:Math.round(a.getBoundingClientRect().height)})));
   const mail=f[0]?decodeURIComponent(f[0].h):'';
   if(!(f.length===3&&f[0].t==='Report a problem'&&/^mailto:hello@yourfirstshiftapp\.com\?subject=Clocked In problem&body=/.test(mail)&&f[1].t==='Privacy'&&f[1].h==='/privacy'&&f[2].t==='Terms'&&f[2].h==='/terms'&&f.every(x=>x.hh>=44)))wrong.push(v+': '+JSON.stringify(f).slice(0,160));
   if(/Harbor|AFE-7781|28(\.00)?\/hr|\$\d/.test(mail))wrong.push(v+': the email would carry the worker\'s own data');if(mail.indexOf('Screen: '+v)<0)wrong.push(v+': the email does not say which screen');}
  ok(!wrong.length,'every tab ends with Report a problem (an email to hello@yourfirstshiftapp.com that names the screen and the phone, never the worker\'s hours, codes or pay), Privacy and Terms, each a full-size tap target '+wrong.join(' || ').slice(0,400));
  await p.evaluate(()=>{OTJ.state().entries=null;});await p.tap('nav.tabs [data-v=week]');await p.waitForTimeout(200);const em=await p.evaluate(()=>{const a=document.getElementById('viewMail');return a?decodeURIComponent(a.getAttribute('href')):'';});
  ok(/^mailto:hello@yourfirstshiftapp\.com/.test(em)&&/Error: .*(null|filter)/.test(em)&&h.errs.length>=1,'the "This screen hit a problem" card has Report this problem, and the email carries the error text');if(SHOTS)await p.screenshot({path:path.join(SHOTS,'finish-2-report.png')});await h.c.close();}
 // ── 4. A brand-new user is told to pick their own state ──
 {const T='2026-11-20',n=await open(T,null),p=n.p,a=await p.evaluate(()=>{const s=document.getElementById('sState');return {st:s.value,first:s.options[0].text,rateRow:document.getElementById('stateRateRow').hidden};});
  ok(a.st===''&&a.first==='Choose your state'&&a.rateRow,'first-run setup no longer starts on Florida: the state box says "'+a.first+'"');
  await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.tap('[data-a=saveSetup]');await p.waitForTimeout(200);
  ok(await p.evaluate(k=>localStorage.getItem(k)===null&&/Choose the state you work in/.test((document.querySelector('.toast')||{innerText:''}).innerText),KEY),'Start tracking without a state says "Choose the state you work in." and saves nothing');
  await p.selectOption('#sState','GA');await p.waitForTimeout(100);const row=await p.evaluate(()=>!document.getElementById('stateRateRow').hidden);await p.tap('[data-a=saveSetup]');await p.waitForTimeout(250);
  ok(row&&await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));return d.settings.state==='GA'&&d.settings.rate===28&&d.jobs.length===1&&!!document.querySelector('[data-a=start]');},KEY)&&!n.errs.length,'choosing Georgia shows the state tax rate box, and Start tracking then saves and opens the Clock tab '+n.errs.join(' | '));await n.c.close();
  const e=await open(T,state(T,[]));await e.p.click('nav.tabs [data-v=more]');await e.p.click('[data-a=setup]');await e.p.waitForTimeout(150);
  ok(await e.p.evaluate(()=>document.getElementById('sState').value==='FL'&&document.getElementById('sState').options[0].value==='AL')&&!e.errs.length,'someone already set up sees their own state in Pay setup, with no "Choose your state" line');await e.c.close();}
 // ── 5. "1 hr", not "1 hrs" ──
 {const T='2026-11-19',mk=(d,z,n)=>({id:'w'+n,kind:'work',date:d,start:at(d,'06:00'),end:at(d,z),breakMin:30,jobId:'j1',codeId:'',splits:[],note:''});
  const h=await open(T,state(T,[mk('2026-11-16','17:00',1),mk('2026-11-17','17:00',2),mk('2026-11-18','17:00',3),mk('2026-11-19','16:00',4)],SET({period:'weekly',k401:'',health:''}))),tx=await h.p.evaluate(()=>document.getElementById('view').innerText.replace(/\s+/g,' '));
  ok(/Overtime: 1 hr this week/.test(tx)&&!/\b1 hrs\b/.test(tx)&&/41 hrs worked \(1 OT\)/.test(tx)&&!h.errs.length,'one hour of overtime reads "Overtime: 1 hr this week" (it used to read "1 hrs"); other amounts still read "41 hrs" '+h.errs.join(' | '));await h.c.close();}
 await b.close();srv.close();console.log(fails?fails+' FAIL ('+passes+' pass)':'ALL PASS ('+passes+')');process.exit(fails?1:0);})();
