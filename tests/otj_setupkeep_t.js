// Clocked In: saving Edit pay setup keeps every saved setting (per diem answers were being dropped).
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_setupkeep_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18881,O='http://127.0.0.1:'+PORT;
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





  const two=x=>seed(Object.assign({jobs:[job(null,{id:'jA',perDiem:70}),job(null,{id:'jB',name:'Example Iron Works',perDiem:50})],entries:[H(T,6,{jobId:'jA',start:at(T,'00:00')}),H(T,3,{jobId:'jB',start:at(T,'07:00')})]},x));
  const pdT=p=>p.evaluate(([wk,t])=>OTJ.computeWeek(wk).days[t].perDiem,[D(0),T]);
  const saveSetup=async(p,edit)=>{await p.click('nav.tabs [data-v=more]');await p.click('[data-a=setup]');await p.waitForTimeout(150);if(edit)await edit();await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);};

  {const {c,p,errs}=await open(two({settings:SET({perDiemEach:true,perDiemTax:'yes'})}));const before=await pdT(p);
   await saveSetup(p);let s=await st(p);
   ok(before===120&&s.settings.perDiemEach===true&&s.settings.perDiemTax==='yes'&&await pdT(p)===120,'1a '+T0+'two jobs ($70 + $50), "count both" on, taxed = yes: Save on Edit pay setup with no edits keeps both answers and today still pays $120 (it was dropping to $70)');
   await p.click('nav.tabs [data-v=more]');ok(/Taxed on your stub/.test(await p.textContent('#pdTax'))&&/from each job you work that day/.test(await p.textContent('#pdTax'))&&!/Is it taxed on your pay stub\?/.test(await p.textContent('#pdTax')),'1b '+T0+'the Per diem card still shows the answer; the taxed question is not asked again');
   await p.click('[data-a=perdiem]');await p.waitForTimeout(150);ok(await p.isChecked('#pdTaxY')&&await p.isChecked('#pdEach'),'1c '+T0+'the per diem sheet still has "Yes" and "count both" ticked');await p.click('#otjModal [data-close]');
   const hist=await p.evaluate(()=>OTJ.logLines().map(x=>x.text));ok(!hist.some(x=>/per diem/i.test(x)),'1d '+T0+'that Save records no per diem change in history');
   await saveSetup(p,async()=>{await p.fill('#sRate','31');});s=await st(p);
   ok(s.settings.rate===31&&s.settings.perDiemEach===true&&s.settings.perDiemTax==='yes'&&await pdT(p)===120,'1e '+T0+'changing a real pay field (rate $28 → $31) saves it and still keeps the per diem answers');
   ok(!errs.length,'1 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  {const {c,p,errs}=await open(two({settings:SET({perDiemTax:'yes'})}));const before=await pdT(p);await saveSetup(p);let s=await st(p);
   ok(before===70&&!s.settings.perDiemEach&&await pdT(p)===70&&s.settings.perDiemTax==='yes','2a '+T0+'"count both" off: Save leaves it off and the day still pays only the higher amount ($70)');
   ok(!errs.length,'2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  {const {c,p,errs}=await open(two({settings:SET({perDiemTax:'no',perDiemNT:true})}));await p.click('nav.tabs [data-v=week]');const n0=await p.textContent('#wkNet');await saveSetup(p);let s=await st(p);await p.click('nav.tabs [data-v=week]');
   ok(s.settings.perDiemTax==='no'&&s.settings.perDiemNT===true&&(await p.textContent('#wkNet'))===n0,'3a '+T0+'"not taxed" survives Save (answer kept, take-home unchanged at '+n0+')');
   await p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},two({settings:SET({perDiemNT:true})}));await saveSetup(p);s=await st(p);ok(s.settings.perDiemNT===true&&s.settings.perDiemTax===undefined,'3b '+T0+'an older "not taxed" tick with no saved answer is kept as it was (nothing invented)');
   await p.evaluate(s=>{localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},two({settings:SET({perDiem:50,someFutureKey:{a:1},bonus:{basis:'all',pct:9}})}));await saveSetup(p);s=await st(p);
   ok(s.settings.perDiem===50&&JSON.stringify(s.settings.someFutureKey)==='{"a":1}'&&s.settings.bonus.pct===9,'3c '+T0+'any other saved setting is kept too (older single per diem amount, bonus, and a key this form knows nothing about)');
   ok(!errs.length,'3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  {const {c,p,errs}=await open(null);await p.fill('#sJob','Harbor Line Builders');await p.fill('#sRate','28');await p.click('[data-a=saveSetup]');await p.waitForTimeout(250);const s=await st(p);const k=Object.keys(s.settings).sort().join();
   ok(k==='anchor,bonus,credits,extraWH,filing,health,k401,otRate,perDiem,perDiemNT,period,rate,state,stateRate,weekStart'&&s.settings.rate===28&&s.settings.perDiem===''&&s.settings.perDiemNT===false&&!('perDiemEach' in s.settings)&&!('perDiemTax' in s.settings)&&!!(await p.$('[data-a=start]')),'4a '+T0+'first-run "Start tracking" still creates the same settings as before, with no per diem answers invented');
   ok(!errs.length,'4 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
