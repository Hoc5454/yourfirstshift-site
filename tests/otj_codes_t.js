// Clocked In: the codes a worker needs for the employer's timesheet live on each entry and show on the Timesheet.
// Covers: add / edit / clear codes, saved defaults, timesheet rows, CSV columns + escaping, backup with codes,
// old backup without codes, old saved code sets, limits, hostile text. iPhone, Android and desktop sizes. Made-up data only.
// Usage: node otj_codes_t.js ..  [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18899,O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const DEVS={iphone:{...devices['iPhone 13'],viewport:{width:390,height:844}},android:{...devices['Pixel 7']},desktop:{viewport:{width:1280,height:900}}};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const NOW=new Date(new Date().setHours(12,0,0,0));const T=ymd(NOW);const ms=(t)=>{const [h,m]=t.split(':');const x=new Date(NOW);x.setHours(+h,+m,0,0);return x.getTime();};
const seed=x=>Object.assign({app:'yfs-on-the-job',v:1,created:Date.now(),settings:{rate:28,otRate:'',period:'weekly',anchor:T,weekStart:NOW.getDay(),state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},
  labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true}],codes:[],entries:[],pto:{buckets:[{id:'v',name:'Vacation',type:'none',start:40,startDate:T}]},clock:null,log:[],lastBackup:Date.now(),ui:{a2hsX:1}},x||{});
// small CSV reader (quoted cells, doubled quotes, commas and line breaks inside quotes)
function csvParse(t){const rows=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}else if(ch==='\r'){}else if(ch==='\n'){r.push(c);rows.push(r);r=[];c='';}else c+=ch;}if(c||r.length){r.push(c);rows.push(r);}return rows;}
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 for(const dev of Object.keys(DEVS)){const T0='['+dev+'] ';
  const open=async(state,opt)=>{const c=await b.newContext({...DEVS[dev],serviceWorkers:'block',acceptDownloads:true});
   await c.addInitScript(([v,now])=>{const _D=Date;const off=now-_D.now();/* pin the clock to noon so a test run near midnight can't change the day */
     class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;
     if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');if(v)localStorage.setItem('yfs_otj_v1',v);}},[state?JSON.stringify(state):'',NOW.getTime()]);
   const p=await c.newPage();p.setDefaultTimeout(6000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(200);return {c,p,errs};};
  const st=p=>p.evaluate(()=>JSON.parse(JSON.stringify(OTJ.state())));
  const fillCodes=async(p,pfx,o)=>{for(const k of Object.keys(o))await p.fill('#'+pfx+k,o[k]);};
  const A={job:'4471 Station 9',task:'WELD-02',cost:'03-100',pay:'REG',po:'4500-18'};

  // ── 1. add, show, edit, clear ──
  {const {c,p,errs}=await open(seed());
   const tabs=await p.$$eval('nav.tabs [data-v]',a=>a.map(x=>x.textContent.trim()));ok(tabs.join('|')==='Clock|Timesheet|PTO|More','1a '+T0+'four tabs, no Codes tab ('+tabs.join(', ')+')');
   await p.click('nav.tabs [data-v=week]');await p.click('[data-day="'+T+'"]');await p.waitForTimeout(150);await p.click('#dAdd');await p.waitForTimeout(150);
   ok(await p.isVisible('#eC_job')&&await p.isVisible('#eC_task')&&await p.isVisible('#eC_cost')&&await p.isVisible('#eC_pay')&&await p.isVisible('#eC_po')&&await p.isVisible('#eNote'),'1b '+T0+'tap a day → Add hours → Job #, Task, Cost, Pay, PO # and Note are right there');
   await p.fill('#eStart','07:00');await p.fill('#eEnd','15:30');await p.fill('#eBrk','30');await fillCodes(p,'eC_',A);await p.fill('#eNote','Tie-in at the north gate');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-1-editor.png')});
   await p.click('#eSave');await p.waitForTimeout(250);let s=await st(p);let e=s.entries[0];
   ok(e&&JSON.stringify(e.codes)===JSON.stringify(A)&&e.note==='Tie-in at the north gate','1c '+T0+'all five codes and the note are saved on the entry');
   const row=await p.evaluate(id=>{const li=document.querySelector('#sheet [data-row="'+id+'"]');const day=li.closest('.tsday');const r=li.getBoundingClientRect();const cds=[...li.querySelectorAll('.cd')];
     return {day:day.querySelector('.tsd').innerText.replace(/\s+/g,' '),text:li.innerText.replace(/\s+/g,' '),n:cds.length,fs:Math.min(...cds.map(x=>parseFloat(getComputedStyle(x).fontSize))),inView:cds.every(x=>{const q=x.getBoundingClientRect();return q.left>=0&&q.right<=innerWidth+0.5&&q.width>0;}),over:document.documentElement.scrollWidth-innerWidth,modal:!!document.getElementById('otjModal')};},e.id);
   ok(!row.modal&&/7:00am–3:30pm/.test(row.text)&&/8 hrs/.test(row.text)&&/Job\s*4471 Station 9/i.test(row.text)&&/Task\s*WELD-02/i.test(row.text)&&/Cost\s*03-100/i.test(row.text)&&/Pay\s*REG/i.test(row.text)&&/PO\s*4500-18/i.test(row.text)&&/Tie-in at the north gate/.test(row.text),'1d '+T0+'timesheet row shows in/out, hours, every code with its label, and the note, without opening the entry');
   ok(/\w{3} \w{3} \d+/.test(row.day)&&/8 hrs/.test(row.day)&&/\$224\.00/.test(row.day),'1e '+T0+'the day line shows the date, total hours and pay ("'+row.day+'")');
   ok(row.n===5&&row.fs>=14&&row.inView&&row.over<=1,'1f '+T0+'codes are readable on this screen: '+row.fs+'px type, nothing cut off, no sideways scroll');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-2-timesheet.png'),fullPage:true});
   // edit one code
   await p.click('#sheet [data-edit="'+e.id+'"]');await p.waitForTimeout(150);ok(await p.inputValue('#eC_job')===A.job&&await p.inputValue('#eC_po')===A.po,'1g '+T0+'tap the shift → its codes are in the boxes');
   await p.fill('#eC_task','FIT-07');await p.fill('#eC_pay','OT');await p.fill('#eWhy','wrong task code');await p.click('#eSave');await p.waitForTimeout(250);s=await st(p);e=s.entries[0];
   ok(e.codes.task==='FIT-07'&&e.codes.pay==='OT'&&e.codes.job===A.job,'1h '+T0+'edited codes are saved; the others stay');
   const lg=s.log.filter(l=>l.field==='codes').slice(-1)[0];ok(lg&&/WELD-02/.test(lg.old)&&/FIT-07/.test(lg.new)&&lg.reason==='wrong task code','1i '+T0+'the change history keeps the old and new codes and the reason');
   // clear
   await p.click('#sheet [data-edit="'+e.id+'"]');await p.waitForTimeout(150);await p.click('#eClr');ok((await p.inputValue('#eC_job'))===''&&(await p.inputValue('#eC_po'))==='','1j '+T0+'"Clear codes" empties every box');
   await p.click('#eSave');await p.waitForTimeout(250);s=await st(p);e=s.entries[0];const t2=await p.evaluate(id=>document.querySelector('#sheet [data-row="'+id+'"]').innerText,e.id);
   ok(!e.codes&&!/4471|FIT-07|03-100/.test(t2)&&/\+ Add codes/.test(t2)&&/7:00am–3:30pm/.test(t2),'1k '+T0+'cleared codes are gone from the entry and the row; hours are untouched; the row offers "+ Add codes"');
   ok(!errs.length,'1 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 2. saved defaults: typed once, filled in next time, changed per entry ──
  {const {c,p,errs}=await open(seed());
   ok(/\+ Add job codes/.test(await p.textContent('#clkCodes')),'2a '+T0+'Clock tab offers "+ Add job codes" before the first shift');
   await p.click('[data-a=clkcodes]');await p.waitForTimeout(150);await fillCodes(p,'kC_',A);await p.click('#kSave');await p.waitForTimeout(200);
   ok(/4471 Station 9/.test(await p.textContent('#clkCodes'))&&/Change codes/.test(await p.textContent('#clkCodes')),'2b '+T0+'the codes for the next shift show on the Clock tab');
   await p.click('[data-a=start]');await p.waitForTimeout(250);let s=await st(p);ok(JSON.stringify(s.clock.codes)===JSON.stringify(A)&&/4471 Station 9/.test(await p.textContent('#clkCodes')),'2c '+T0+'START carries the saved codes onto the running shift');
   await p.click('[data-a=clkcodes]');await p.waitForTimeout(150);await p.fill('#kC_cost','05-220');await p.click('#kSave');await p.waitForTimeout(200);
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);ok(/On the clock/.test(await p.textContent('#sheet'))&&/05-220/.test(await p.textContent('#sheet')),'2d '+T0+'codes can be changed mid-shift; the running shift shows on the timesheet with them');
   await p.click('nav.tabs [data-v=today]');await p.click('[data-a=stop]');await p.waitForTimeout(250);s=await st(p);
   ok(s.entries.length===1&&s.entries[0].codes.cost==='05-220'&&s.entries[0].codes.job===A.job&&s.entries[0].codes.po===A.po,'2e '+T0+'STOP saves the entry with its codes');
   ok(/05-220/.test(await p.textContent('#clkCodes')),'2f '+T0+'the next clock-in is already filled with the last codes');
   await p.click('[data-a=add]');await p.waitForTimeout(150);ok(await p.inputValue('#eC_job')===A.job&&await p.inputValue('#eC_cost')==='05-220','2g '+T0+'"+ Add hours" starts with the last codes');
   await p.fill('#eC_job','5530 Yard');await p.fill('#eStart','16:00');await p.fill('#eEnd','18:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(250);s=await st(p);
   ok(s.entries.length===2&&s.entries[1].codes.job==='5530 Yard'&&s.entries[0].codes.job===A.job&&s.ui.lastCodes.job==='5530 Yard','2h '+T0+'changing codes on one entry leaves earlier entries alone and becomes the new default');
   await p.click('[data-a=addpto]');await p.waitForTimeout(150);await p.fill('#eC_pay','PTO');await p.fill('#ePH','4');await p.click('#eSave');await p.waitForTimeout(250);s=await st(p);
   ok(s.entries[2].kind==='pto'&&s.entries[2].codes.pay==='PTO','2i '+T0+'a PTO day can carry codes too (pay code PTO)');
   await p.click('nav.tabs [data-v=today]');await p.click('[data-a=clkcodes]');await p.waitForTimeout(150);await p.click('#kClr');await p.click('#kSave');await p.waitForTimeout(200);s=await st(p);
   ok(!Object.keys(s.ui.lastCodes).length&&/\+ Add job codes/.test(await p.textContent('#clkCodes'))&&s.entries[0].codes.job===A.job,'2j '+T0+'the saved default can be deleted; entries already logged keep their codes');
   await p.click('[data-a=start]');await p.waitForTimeout(200);await p.click('[data-a=stop]');await p.waitForTimeout(250);s=await st(p);ok(!s.entries[3].codes,'2k '+T0+'with no default, a new shift has no codes');
   ok(!errs.length,'2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 3. limits, odd text, hostile text ──
  {const {c,p,errs}=await open(seed());await p.click('[data-a=add]');await p.waitForTimeout(150);
   const ml=await p.evaluate(()=>['job','task','cost','pay','po'].map(k=>+document.getElementById('eC_'+k).maxLength));ok(ml.join()==='40,30,30,12,30','3a '+T0+'each box has a length limit ('+ml.join('/')+')');
   await p.evaluate(()=>{const set=(id,v)=>{document.getElementById(id).value=v;};set('eC_job','<img src=x onerror="window.__pwn=1"> & "quoted"');set('eC_task','   WELD   02  ');set('eC_cost','=1+1');set('eC_po','X'.repeat(200));});
   await p.click('#eSave');await p.waitForTimeout(250);await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);const s=await st(p);const e=s.entries[0];
   ok(e.codes.task==='WELD 02'&&e.codes.po.length===30&&e.codes.job.length<=40,'3b '+T0+'spaces are tidied and long text is cut to the limit');
   ok(await p.evaluate(()=>!window.__pwn&&!document.querySelector('#sheet img')&&/<img src=x/.test(document.getElementById('sheet').innerText)),'3c '+T0+'code text is shown as plain text; nothing in it can run');
   ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),'3d '+T0+'long codes wrap; no sideways scroll');
   ok(!errs.length,'3 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 4. CSV columns + escaping; backup with codes; restore ──
  {const tricky={job:'Station "9", North',task:'A,B',cost:'03-100',pay:'OT',po:'PO, 4500 "rev 2"'};
   const st0=seed({entries:[{id:'e1',kind:'work',date:T,start:ms('06:00'),end:ms('16:30'),breakMin:30,jobId:'j1',codeId:'',splits:[],note:'Rain delay, "north" pad',codes:tricky},{id:'e2',kind:'pto',date:T,hours:4,bucket:'v',jobId:'j1',codeId:'',splits:[],note:'',codes:{pay:'PTO'}},{id:'e3',kind:'work',date:T,start:ms('17:00'),end:ms('18:00'),breakMin:0,jobId:'j1',codeId:'',splits:[],note:''}]});
   const {c,p,errs}=await open(st0);const csv=await p.evaluate(()=>OTJ.buildCSV({}));const rows=csvParse(csv);const H=rows[0];const col=n=>H.indexOf(n);
   ok(rows.length===4&&rows.every(r=>r.length===H.length),'4a '+T0+'CSV: header + one row per entry, every row has '+H.length+' cells even with commas and quotes inside');
   ok(['Date','Start','End','Hours','Overtime','Job #','Task code','Cost code','Pay code','PO #','Note'].every(n=>col(n)>=0)&&col('Job #')<col('Task code')&&col('Task code')<col('Cost code')&&col('Cost code')<col('Pay code')&&col('Pay code')<col('PO #'),'4b '+T0+'CSV: codes are their own columns (Job #, Task code, Cost code, Pay code, PO #)');
   const r1=rows.find(r=>r[H.length-1]==='e1'),r2=rows.find(r=>r[H.length-1]==='e2'),r3=rows.find(r=>r[H.length-1]==='e3');
   ok(r1[col('Job #')]===tricky.job&&r1[col('Task code')]===tricky.task&&r1[col('Cost code')]===tricky.cost&&r1[col('Pay code')]===tricky.pay&&r1[col('PO #')]===tricky.po&&r1[col('Note')]==='Rain delay, "north" pad'&&r1[col('Start')]==='06:00'&&r1[col('End')]==='16:30'&&r1[col('Hours')]==='10','4c '+T0+'CSV: commas and quotes come back exactly as typed');
   ok(/"Station ""9"", North"/.test(csv)&&r2[col('Pay code')]==='PTO'&&r2[col('Job #')]===''&&r3[col('Job #')]===''&&r3[col('PO #')]==='','4d '+T0+'CSV: quotes are doubled, PTO row carries its pay code, an entry with no codes has empty cells');
   // backup → wipe → restore
   await p.click('nav.tabs [data-v=more]');await p.evaluate(()=>{navigator.canShare=null;});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('[data-a=backup]')]);
   const file=dl?path.join(os.tmpdir(),'yfs-codes-'+dev+'.json'):'';if(dl)await dl.saveAs(file);const bj=dl?JSON.parse(fs.readFileSync(file,'utf8')):{data:{entries:[]}};
   ok(!!dl&&/^yfs-clocked-in-backup-/.test(dl.suggestedFilename())&&JSON.stringify(bj.data.entries[0].codes)===JSON.stringify(tricky)&&bj.data.entries[1].codes.pay==='PTO','4e '+T0+'the backup file holds every code');
   await p.evaluate(()=>{const s=OTJ.state();s.entries=[];s.ui.lastCodes={};localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();});await p.click('nav.tabs [data-v=more]');
   if(dl){await p.setInputFiles('#restoreFile',file);await p.waitForTimeout(500);}const s=await st(p);
   ok(s.entries.length===3&&JSON.stringify(s.entries[0].codes)===JSON.stringify(tricky)&&s.entries[1].codes.pay==='PTO'&&!s.entries[2].codes,'4f '+T0+'a backup with codes restores with every code intact');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);ok(/Station "9", North/.test(await p.textContent('#sheet')),'4g '+T0+'restored codes show on the timesheet');
   ok(!errs.length,'4 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 5. old data: no codes at all, old saved code sets, an old split shift, the old Codes tab as last screen ──
  {const old={app:'yfs-on-the-job',kind:'backup',v:1,exported:Date.now()-86400000,data:seed({ui:{a2hsX:1,view:'codes',lastCode:'c1'},
     codes:[{id:'c1',nick:'Tie-in Station 9',jobId:'j1',fields:{proj:'P-2210',po:'4500-18 / 10',cost:'03 30 00',wo:'WO-1182'},active:true,fav:true},{id:'c2',nick:'Yard + Staging',jobId:'j1',fields:{proj:'',po:'',cost:'01 50 00',wo:''},active:true}],
     entries:[{id:'o1',kind:'work',date:T,start:ms('06:00'),end:ms('14:00'),breakMin:0,jobId:'j1',codeId:'',splits:[],note:'plain old entry'},
              {id:'o2',kind:'work',date:T,start:ms('14:00'),end:ms('16:00'),breakMin:0,jobId:'j1',codeId:'c1',splits:[],note:''},
              {id:'o3',kind:'work',date:T,start:ms('16:00'),end:ms('20:00'),breakMin:0,jobId:'j1',codeId:'',splits:[{codeId:'c1',hours:1},{codeId:'c2',hours:3}],note:''},
              {id:'o4',kind:'pto',date:T,hours:8,bucket:'v',jobId:'j1'}]})};
   const file=path.join(os.tmpdir(),'yfs-old-'+dev+'.json');fs.writeFileSync(file,JSON.stringify(old));
   const {c,p,errs}=await open(seed({entries:[{id:'cur',kind:'work',date:T,start:ms('08:00'),end:ms('09:00'),breakMin:0,jobId:'j1',codeId:'',splits:[],note:'',codes:{job:'KEEP-ME'}}]}));
   await p.click('nav.tabs [data-v=more]');await p.setInputFiles('#restoreFile',file);await p.waitForTimeout(600);const s=await st(p);const by=id=>s.entries.find(e=>e.id===id);
   ok(s.entries.length===4&&by('o1')&&!by('o1').codes&&by('o1').note==='plain old entry'&&by('o4')&&by('o4').hours===8,'5a '+T0+'an old backup with no codes restores cleanly: 4 of 4 entries, hours and notes intact');
   ok(by('o2').codes&&by('o2').codes.job==='P-2210'&&by('o2').codes.po==='4500-18 / 10'&&by('o2').codes.cost==='03 30 00'&&by('o2').codes.task==='WO-1182','5b '+T0+'an entry that pointed at an old saved code set now carries that set\'s values');
   ok(by('o3').splits.length===2&&s.codes.length===2&&s.codes[0].nick==='Tie-in Station 9','5c '+T0+'nothing is thrown away: old code sets and an old split shift stay in the data');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);const sh=await p.textContent('#sheet');
   ok(/P-2210/.test(sh)&&/Split: Tie-in Station 9 1h \+ Yard \+ Staging 3h/.test(sh)&&/plain old entry/.test(sh),'5d '+T0+'the timesheet shows the old codes and the old split');
   const csv=csvParse(await p.evaluate(()=>OTJ.buildCSV({})));const H=csv[0];ok(csv.length===5&&csv.find(r=>r[H.length-1]==='o2')[H.indexOf('Job #')]==='P-2210'&&/split: Tie-in Station 9 1h \+ Yard \+ Staging 3h/.test(csv.find(r=>r[H.length-1]==='o3')[H.indexOf('Note')]),'5e '+T0+'CSV carries the old codes; the old split is written in the Note cell');
   ok(!errs.length,'5 '+T0+'no page errors after restore '+errs.join('|').slice(0,140));await c.close();
   // old data already on the phone, last screen was the removed Codes tab
   const o2=await open(old.data);const cur=await o2.p.evaluate(()=>({tab:(document.querySelector('nav.tabs [aria-current=page]')||{}).textContent,sheet:!!document.getElementById('sheet'),n:OTJ.state().entries.length}));
   ok(cur.sheet&&/Timesheet/.test(cur.tab||'')&&cur.n===4,'5f '+T0+'a phone that last had the old Codes tab open lands on the Timesheet, with all its records');
   await o2.p.click('[data-edit="o2"]');await o2.p.waitForTimeout(150);await o2.p.click('#eClr');await o2.p.click('#eSave');await o2.p.waitForTimeout(250);await o2.p.reload();await o2.p.waitForFunction(()=>window.OTJ&&OTJ.tax());
   ok(await o2.p.evaluate(()=>!OTJ.state().entries.find(e=>e.id==='o2').codes),'5g '+T0+'codes cleared from an old entry stay cleared after a reload');
   ok(!o2.errs.length,'5 '+T0+'no page errors on old data '+o2.errs.join('|').slice(0,140));await o2.c.close();}

  // ── 6. damaged codes never break the page ──
  {const {c,p,errs}=await open(seed({ui:{a2hsX:1,lastCodes:'x'},clock:{start:ms('07:00'),jobId:'j1',codes:[1,2],breaks:[]},entries:[{id:'d1',kind:'work',date:T,start:ms('01:00'),end:ms('02:00'),jobId:'j1',codes:'oops'},{id:'d2',kind:'work',date:T,start:ms('02:00'),end:ms('03:00'),jobId:'j1',codes:{job:{a:1},task:null,cost:42,extra:'x',pay:['a']}},{id:'d3',kind:'work',date:T,start:ms('03:00'),end:ms('04:00'),jobId:'j1',codes:null,codeId:'gone',note:7}]}));
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);const s=await st(p);const tx=await p.textContent('#view');
   ok(s.entries.length===3&&!s.entries[0].codes&&JSON.stringify(s.entries[1].codes)==='{"cost":"42"}'&&!s.entries[2].codes&&!/undefined|NaN|\[object/.test(tx),'6a '+T0+'damaged code values are repaired on load; every entry is kept; nothing odd on screen');
   await p.click('[data-edit="d2"]');await p.waitForTimeout(150);ok(await p.inputValue('#eC_cost')==='42'&&await p.inputValue('#eC_job')==='','6b '+T0+'a repaired entry opens and can be edited');
   ok(!errs.length,'6 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  // ── 7. recent code sets: tap to fill, no retyping when switching jobs ──
  {const B={job:'5530 Yard',task:'RIG-01',cost:'01-500',pay:'REG',po:'7700-02'};
   const {c,p,errs}=await open(seed());
   for(const set of [A,B]){await p.click('[data-a=add]');await p.waitForTimeout(150);await p.click('#eClr');await fillCodes(p,'eC_',set);await p.fill('#eStart',set===A?'06:00':'09:00');await p.fill('#eEnd',set===A?'08:00':'10:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(250);}
   let s=await st(p);ok(s.ui.recentCodes.length===2&&s.ui.recentCodes[0].job===B.job&&s.ui.recentCodes[1].job===A.job,'7a '+T0+'the last code sets are remembered, newest first');
   await p.click('[data-a=add]');await p.waitForTimeout(150);
   const rr=await p.evaluate(()=>[...document.querySelectorAll('#eC_recent .rcf')].map(b=>{const r=b.getBoundingClientRect();return {t:b.textContent,h:r.height,in:r.left>=0&&r.right<=innerWidth};}));
   ok(rr.length===2&&/5530 Yard/.test(rr[0].t)&&/4471 Station 9/.test(rr[1].t)&&rr.every(x=>x.h>=44&&x.in),'7b '+T0+'"+ Add hours" lists them as big tap targets ('+rr.map(x=>Math.round(x.h)+'px').join(', ')+')');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-3-recent.png')});
   ok(await p.inputValue('#eC_job')===B.job,'7c '+T0+'the boxes start with the most recent set');
   await p.click('#eC_recent [data-rc="1"]');ok(await p.inputValue('#eC_job')===A.job&&await p.inputValue('#eC_task')===A.task&&await p.inputValue('#eC_cost')===A.cost&&await p.inputValue('#eC_pay')===A.pay&&await p.inputValue('#eC_po')===A.po,'7d '+T0+'one tap on an older set fills all five boxes');
   await p.fill('#eStart','11:00');await p.fill('#eEnd','12:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(250);s=await st(p);
   ok(s.entries.length===3&&JSON.stringify(s.entries[2].codes)===JSON.stringify(A)&&s.ui.recentCodes.length===2&&s.ui.recentCodes[0].job===A.job,'7e '+T0+'saved with that set; it moves to the top; no duplicate is added');
   await p.click('[data-a=clkcodes]');await p.waitForTimeout(150);ok(await p.evaluate(()=>document.querySelectorAll('#kC_recent .rcf').length===2),'7f '+T0+'the Clock tab codes screen offers the same sets');
   await p.click('#kC_recent [data-rc="1"]');await p.click('#kSave');await p.waitForTimeout(200);s=await st(p);ok(s.ui.lastCodes.job===B.job&&/5530 Yard/.test(await p.textContent('#clkCodes')),'7g '+T0+'switching jobs before clock-in is two taps');
   await p.click('[data-a=clkcodes]');await p.waitForTimeout(150);await p.click('#kC_recent [data-rx="1"]');await p.waitForTimeout(100);s=await st(p);
   ok(s.ui.recentCodes.length===1&&s.ui.recentCodes[0].job===B.job&&s.entries.filter(e=>e.codes&&e.codes.job===A.job).length===2,'7h '+T0+'✕ forgets a set; entries that used it keep their codes');await p.click('[data-close]');
   await p.evaluate(()=>{const s=OTJ.state();s.ui.recentCodes=[1,2,3,4,5].map(i=>({job:'J'+i}));localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();});
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.click('#eClr');await p.fill('#eC_job','J6');await p.fill('#eStart','13:00');await p.fill('#eEnd','14:00');await p.fill('#eBrk','0');await p.click('#eSave');await p.waitForTimeout(250);s=await st(p);
   ok(s.ui.recentCodes.length===5&&s.ui.recentCodes[0].job==='J6'&&!s.ui.recentCodes.some(x=>x.job==='J5'),'7i '+T0+'only the last 5 sets are kept');
   await p.click('[data-a=add]');await p.waitForTimeout(150);ok(await p.evaluate(()=>{const i=document.getElementById('eC_pay');const d=document.getElementById(i.getAttribute('list'));return !!d&&[...d.options].map(o=>o.value).join()==='REG,OT,DT,PTO,HOL,SICK';}),'7j '+T0+'Pay code suggests REG, OT, DT, PTO, HOL, SICK (still free text)');
   ok(!errs.length,'7 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 8. a clock left running: ask, and let the worker put in the real stop time ──
  {const start=NOW.getTime()-20*3600e3;const Y=ymd(new Date(start));
   const run=x=>seed({clock:Object.assign({start,jobId:'j1',codes:A,breaks:[{s:start+4*3600e3,e:start+4.5*3600e3}],onBreak:null},x||{})});
   const {c,p,errs}=await open(run());const card=await p.textContent('#stillOn').catch(()=>'');
   ok(/Still on the clock\?/.test(card)&&/20 hours ago/.test(card)&&/4:00pm/.test(card),'8a '+T0+'after a very long shift the Clock tab asks "Still on the clock?" with when it started');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-4-still-on.png')});
   await p.click('[data-a=stillyes]');await p.waitForTimeout(200);let s=await st(p);ok(!(await p.$('#stillOn'))&&s.clock&&s.clock.start===start&&s.clock.askedAt>0&&s.entries.length===0,'8b '+T0+'"Yes, still working" keeps the clock running and stops asking for now');
   await p.evaluate(t=>{const s=OTJ.state();s.clock.askedAt=t;localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();},NOW.getTime()-5*3600e3);await p.waitForTimeout(200);ok(!!(await p.$('#stillOn')),'8c '+T0+'it asks again a few hours later');
   await p.click('[data-a=forgot]');await p.waitForTimeout(200);
   const tom=ymd(new Date(NOW.getTime()+86400e3));await p.fill('#fD',tom);await p.fill('#fT','09:00');await p.click('#fSave');await p.waitForTimeout(200);s=await st(p);
   ok(!!(await p.$('#fSave'))&&s.clock&&s.entries.length===0&&/not in the future/.test(await p.textContent('#fCalc')),'8d '+T0+'a stop time in the future is refused; nothing is saved');
   await p.fill('#fD',Y);await p.fill('#fT','23:30');ok(/7\.5 hrs/.test(await p.textContent('#fCalc')),'8e '+T0+'it shows what the chosen stop time adds up to (7.5 hrs on the clock)');
   await p.click('#fSave');await p.waitForTimeout(300);s=await st(p);const e=s.entries[0];const h=await p.evaluate(()=>OTJ.entryHours(OTJ.state().entries[0]));
   ok(!s.clock&&e&&e.start===start&&e.date===Y&&new Date(e.end).getHours()===23&&new Date(e.end).getMinutes()===30&&e.breakMin===30&&Math.abs(h-7)<0.01&&e.codes.job===A.job,'8f '+T0+'the shift is saved with the real stop time: 7 hrs after the 30-min break, on the day it started, codes kept');
   ok(s.log.some(l=>l.id===e.id&&l.reason==='forgot to clock out'),'8g '+T0+'the change history notes "forgot to clock out"');
   ok(!errs.length,'8 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();
   const n=await open(seed({clock:{start:NOW.getTime()-10*3600e3,jobId:'j1',breaks:[],onBreak:null}}));ok(!(await n.p.$('#stillOn'))&&!!(await n.p.$('#clkT')),'8h '+T0+'a normal 10-hour shift is not interrupted');await n.c.close();
   const br=await open(run({breaks:[],onBreak:start+9*3600e3}));await br.p.click('[data-a=forgot]');await br.p.waitForTimeout(200);await br.p.fill('#fD',Y);await br.p.fill('#fT','22:00');await br.p.click('#fSave');await br.p.waitForTimeout(300);
   const be=(await st(br.p)).entries[0];ok(be&&be.breakMin===0&&new Date(be.end).getHours()===22,'8i '+T0+'a break that was still running after the real stop time is not taken off the shift');ok(!br.errs.length,'8 '+T0+'no page errors (break case) '+br.errs.join('|').slice(0,140));await br.c.close();}

 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
