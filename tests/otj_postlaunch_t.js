// Clocked In post-launch fixes (found on a phone, live c6364db7):
//  1) Save is blocked when Start or End is blank; no entry over 24 hrs; a warning over 16 hrs.
//  2) Every saved entry can be deleted (confirm inside the sheet, no browser pop-up), totals update, Undo on the toast.
//  3) Change history reads as plain English: no raw data, no ids, fits a phone, newest first.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_postlaunch_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18898,O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const DEVS={iphone:{...devices['iPhone 13'],viewport:{width:390,height:844}},android:{...devices['Pixel 7']},desktop:{viewport:{width:1280,height:900}}};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const NOW=new Date(new Date().setHours(12,0,0,0));const T=ymd(NOW);const ms=t=>{const [h,m]=t.split(':');const x=new Date(NOW);x.setHours(+h,+m,0,0);return x.getTime();};
const SD=NOW.toLocaleDateString('en-US',{month:'short',day:'numeric'});
const seed=x=>Object.assign({app:'yfs-on-the-job',v:1,created:Date.now(),settings:{rate:28,otRate:'',period:'weekly',anchor:T,weekStart:NOW.getDay(),state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},
  labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'ZQXJOB1',name:'Harbor Line Builders',rate:'',otRate:'',active:true}],codes:[],entries:[],pto:{buckets:[{id:'ZQXBKT1',name:'Vacation',type:'none',start:40,startDate:T}]},clock:null,log:[],lastBackup:Date.now(),ui:{a2hsX:1}},x||{});
const W=(id,a,b,x)=>Object.assign({id,kind:'work',date:T,start:ms(a),end:ms(b),breakMin:0,jobId:'ZQXJOB1',codeId:'',splits:[],note:''},x||{});
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 for(const dev of Object.keys(DEVS)){const T0='['+dev+'] ';
  const open=async(state,pro)=>{const c=await b.newContext({...DEVS[dev],serviceWorkers:'block'});
   await c.addInitScript(([v,now,pro])=>{const _D=Date;const off=now-_D.now();class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(_D.now()+off);}static now(){return _D.now()+off;}}window.Date=D2;
     if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);if(pro)localStorage.setItem('yfs_pro','1');}},[JSON.stringify(state),NOW.getTime(),!!pro]);
   const p=await c.newPage();p.setDefaultTimeout(6000);const errs=[],dialogs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{dialogs.push(d.message());d.dismiss();});await p.goto(O+'/job/');await p.waitForFunction(()=>window.OTJ&&OTJ.tax());await p.waitForTimeout(200);return {c,p,errs,dialogs};};
  const st=p=>p.evaluate(()=>JSON.parse(JSON.stringify(OTJ.state())));const live=s=>s.entries.filter(e=>!e.deleted);
  const err=async p=>(await p.isVisible('#eErr'))?(await p.textContent('#eErr')):'';
  const save=async p=>{await p.click('#eSave');await p.waitForTimeout(200);};

  // ── 1. times ──
  {const {c,p,errs}=await open(seed());await p.click('[data-a=add]');await p.waitForTimeout(150);
   await p.fill('#eStart','');await save(p);let s=await st(p);ok(s.entries.length===0&&/Enter a start time/.test(await err(p))&&await p.isVisible('#eSave'),'1a '+T0+'Start cleared → Save blocked, "Enter a start time" shown, nothing saved');
   ok(!(await p.$('.toast'))&&(await p.$$('#eErr')).length===1,'1a2 '+T0+'the error shows once, in the sheet (no second copy in a toast)');
   ok(/Enter a start time and an end time/.test(await p.textContent('#eCalc')),'1b '+T0+'the hours line asks for the times instead of showing a made-up total');
   await p.fill('#eStart','07:00');await p.fill('#eEnd','');await save(p);s=await st(p);ok(s.entries.length===0&&/Enter an end time/.test(await err(p)),'1c '+T0+'End cleared → Save blocked, "Enter an end time" shown, nothing saved');
   await p.fill('#eStart','');await save(p);s=await st(p);ok(s.entries.length===0&&/Enter a start time/.test(await err(p)),'1d '+T0+'both blank → blocked');
   await p.fill('#eStart','07:00');await p.fill('#eEnd','07:00');await save(p);s=await st(p);ok(s.entries.length===0&&/same time/.test(await err(p))&&await p.isVisible('#e24W')&&!(await p.isChecked('#e24')),'1e '+T0+'Start = End → blocked, and a "This is a full 24-hour shift" box appears');
   await p.fill('#eBrk','0');await p.check('#e24');ok(/24 hrs/.test(await p.textContent('#eCalc')),'1e2 '+T0+'ticking the box shows "This entry: 24 hrs"');await save(p);s=await st(p);
   ok(s.entries.length===1&&s.entries[0].end-s.entries[0].start===86400000&&!(await p.$('#otjModal')),'1e3 '+T0+'a confirmed 24-hour shift (7:00 to 7:00) saves in one tap: 24 hrs');
   await p.click('[data-edit="'+s.entries[0].id+'"]');await p.waitForTimeout(150);ok(await p.isChecked('#e24')&&await p.isVisible('#e24W'),'1e4 '+T0+'reopening it shows the 24-hour box ticked');
   await p.uncheck('#e24');await save(p);ok(/same time/.test(await err(p))&&(await st(p)).entries[0].end-(await st(p)).entries[0].start===86400000,'1e5 '+T0+'unticking it blocks Save again; the saved shift is untouched');
   await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(200);s=await st(p);await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','07:00');
   await p.fill('#eEnd','15:30');await p.fill('#eBrk','600');await save(p);s=await st(p);ok(live(s).length===0&&/break is as long as the shift/.test(await err(p)),'1f '+T0+'a break longer than the shift → blocked');
   await p.fill('#eBrk','30');await save(p);s=await st(p);s.entries=s.entries.filter(e=>!e.deleted);ok(s.entries.length===1&&s.entries[0].start===ms('07:00')&&s.entries[0].end===ms('15:30')&&s.entries[0].breakMin===30,'1g '+T0+'real times → saved (7:00–3:30, 30 min break)');
   // edit: clearing a time cannot damage the saved entry
   const id=s.entries[0].id;await p.click('[data-edit="'+id+'"]');await p.waitForTimeout(150);await p.fill('#eEnd','');await save(p);s=await st(p);s.entries=s.entries.filter(e=>!e.deleted);
   ok(s.entries.length===1&&s.entries[0].end===ms('15:30')&&/Enter an end time/.test(await err(p))&&!s.log.some(l=>l.field==='end'),'1h '+T0+'editing: End cleared → blocked; the saved entry and its history are untouched');
   await p.fill('#eStart','');await p.fill('#eEnd','15:30');await save(p);s=await st(p);s.entries=s.entries.filter(e=>!e.deleted);ok(s.entries[0].start===ms('07:00'),'1i '+T0+'editing: Start cleared → blocked; the saved start stays 7:00');await p.click('[data-close]');
   // hours-only and PTO limits
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.check('#eHO');await p.fill('#eHrs','25');await save(p);s=await st(p);ok(live(s).length===1&&/more than 24 hours/.test(await err(p)),'1j '+T0+'"Just enter total hours" = 25 → blocked (over 24)');
   await p.fill('#eHrs','');await save(p);s=await st(p);ok(live(s).length===1&&/Enter the hours worked/.test(await err(p)),'1k '+T0+'total hours blank → blocked');
   await p.fill('#eHrs','17');await save(p);s=await st(p);const w1=await err(p);ok(live(s).length===1&&/17 hours in one entry/.test(w1)&&/tap Save again/.test(w1),'1l '+T0+'17 hrs → a warning first, not saved yet');
   await save(p);s=await st(p);ok(live(s).length===2&&live(s)[1].manualHours===17,'1m '+T0+'Save again → the 17-hr entry is allowed');
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','05:00');await p.fill('#eEnd','22:00');await p.fill('#eBrk','0');await save(p);s=await st(p);ok(live(s).length===2&&/17 hours/.test(await err(p)),'1n '+T0+'5:00am–10:00pm (17 hrs) → warning first');
   await p.fill('#eEnd','21:30');await save(p);s=await st(p);ok(live(s).length===2&&/16\.5 hours/.test(await err(p)),'1o '+T0+'changing the times after the warning warns again for the new total');
   await p.fill('#eEnd','13:00');await save(p);s=await st(p);ok(live(s).length===3,'1p '+T0+'8 hrs → saves with no warning');
   await p.click('[data-a=addpto]');await p.waitForTimeout(150);await p.fill('#ePH','30');await save(p);s=await st(p);ok(live(s).length===3&&/more than 24 hours/.test(await err(p)),'1q '+T0+'PTO of 30 hrs in one entry → blocked');
   await p.fill('#ePH','0');await save(p);s=await st(p);ok(live(s).length===3&&/Enter PTO hours/.test(await err(p)),'1r '+T0+'PTO of 0 hrs → blocked');await p.click('[data-close]');
   ok(s.entries.every(e=>e.kind==='pto'||e.manualHours!=null||(typeof e.start==='number'&&typeof e.end==='number'&&e.end>e.start)),'1s '+T0+'every saved shift has a real start and end (or total hours)');
   ok(!errs.length,'1 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
  // an old saved shift with no end time: counts nothing, says so, must be fixed or deleted
  {const {c,p,errs}=await open(seed({entries:[{id:'ZQXBAD1',kind:'work',date:T,start:ms('07:00'),breakMin:0,jobId:'ZQXJOB1',codeId:'',splits:[],note:''}]}));
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);const row=await p.textContent('#sheet [data-row="ZQXBAD1"]');const tot=await p.textContent('#view');
   ok(/Missing end time/.test(row)&&/0 hrs/.test(row)&&/Gross so far\s*\$0\.00/.test(tot.replace(/\s+/g,' ')),'1t '+T0+'a saved shift with no end time counts 0 hrs and $0 (it used to keep counting up to now) and says "Missing end time"');
   await p.click('[data-edit="ZQXBAD1"]');await p.waitForTimeout(150);ok(await p.inputValue('#eEnd')===''&&await p.inputValue('#eStart')==='07:00','1u '+T0+'opening it shows End blank, not a made-up time');
   await save(p);ok(/Enter an end time/.test(await err(p)),'1v '+T0+'it cannot be saved until End is filled');await p.fill('#eEnd','15:00');await save(p);const s=await st(p);ok(s.entries[0].end===ms('15:00'),'1w '+T0+'filling End fixes it (8 hrs)');
   ok(!errs.length,'1 '+T0+'no page errors (old data) '+errs.join('|').slice(0,140));await c.close();}

  // ── 2. delete ──
  {const {c,p,errs,dialogs}=await open(seed({entries:[W('ZQXONLY1','07:00','15:00')]}));const money=async()=>({today:await p.textContent('#earnToday'),week:await p.textContent('#earnWeek')});
   let m=await money();ok(m.today==='$224.00'&&m.week==='$224.00','2a '+T0+'set-up: one 8-hr shift, the only entry on its day ($224.00 today and this week)');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);await p.click('#sheet [data-edit="ZQXONLY1"]');await p.waitForTimeout(150);
   const del=await p.evaluate(()=>{const b=document.getElementById('eDel');b.scrollIntoView();const r=b.getBoundingClientRect();return {vis:r.height>=44&&r.top>=0&&r.bottom<=innerHeight+1,txt:b.textContent};});
   ok(del.vis&&/Delete entry/.test(del.txt),'2b '+T0+'the edit sheet has a Delete button that can be scrolled into view and tapped');
   await p.click('#eDel');await p.waitForTimeout(100);const ask=await p.textContent('#eDelAsk');ok(/Delete this entry\?/.test(ask)&&/Change history/.test(ask)&&await p.isVisible('#eDelYes')&&await p.isVisible('#eDelNo')&&dialogs.length===0,'2c '+T0+'Delete asks inside the sheet ("Delete this entry? … Change history"), with no browser pop-up');
   if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pl-1-delete-confirm.png')});
   await p.click('#eDelNo');await p.waitForTimeout(150);let s=await st(p);ok(live(s).length===1&&!!(await p.$('#otjModal'))&&!(await p.$('#eDelAsk'))&&await p.isVisible('#eDel')&&await p.isVisible('#eSave'),'2d '+T0+'"Keep it" closes only the confirm: the editor stays open with its Delete button back; nothing deleted');
   await p.click('#eDel');await p.waitForTimeout(100);ok(await p.isVisible('#eDelAsk'),'2d2 '+T0+'Delete still works after "Keep it"');await p.click('#eDelNo');await p.click('[data-close]');await p.waitForTimeout(150);
   await p.click('#sheet [data-edit="ZQXONLY1"]');await p.waitForTimeout(150);await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(250);s=await st(p);
   const wk=(await p.textContent('#view')).replace(/\s+/g,' ');
   ok(live(s).length===0&&!(await p.$('#sheet [data-row="ZQXONLY1"]'))&&/Gross so far\s*\$0\.00/.test(wk)&&/Est\. take-home\s*~\$0\.00/.test(wk)&&/Hours\s*0 worked/.test(wk),'2e '+T0+'"Yes, delete" removes the only entry on its day; the Timesheet shows 0 hrs, $0.00 gross and $0.00 take-home right away');
   const toast=await p.textContent('.toast');ok(/Deleted\./.test(toast)&&await p.isVisible('.toast button')&&/Undo/.test(await p.textContent('.toast button')),'2f '+T0+'the "Deleted." message has an Undo button');if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pl-2-deleted-undo.png')});
   await p.click('nav.tabs [data-v=today]');await p.waitForTimeout(150);m=await money();ok(m.today==='$0.00'&&m.week==='$0.00'&&/Nothing logged today/.test(await p.textContent('#view')),'2g '+T0+'Clock tab: Earned today and This week are back to $0.00');
   ok(s.log.some(l=>l.id==='ZQXONLY1'&&l.field==='(deleted)')&&s.entries.length===1,'2h '+T0+'the delete is written to Change history (and the record stays in the backup data)');
   // the message bar never blocks a tap
   {const tb=await p.evaluate(()=>{const t=document.querySelector('.toast');if(!t)return null;const r=t.getBoundingClientRect(),x=r.left+r.width*0.25,y=r.top+r.height/2;const hit=document.elementFromPoint(x,y);return {pe:getComputedStyle(t).pointerEvents,hitToast:!!(hit&&hit.closest('.toast')&&!hit.closest('.toast button'))};});
    ok(tb&&tb.pe==='none'&&!tb.hitToast,'2f2 '+T0+'the message bar lets taps through (pointer-events: none); a tap on its text lands on what is underneath');
    await p.click('nav.tabs [data-v=today]');await p.click('[data-a=add]');await p.waitForTimeout(120);await p.fill('#eStart','05:00');await p.fill('#eEnd','05:30');await p.fill('#eBrk','0');
    await p.evaluate(()=>{const b=document.getElementById('eSave');b.scrollIntoView({block:'end'});});const vis=await p.isVisible('.toast');await p.click('#eSave',{timeout:2500});await p.waitForTimeout(200);const s2=await st(p);
    ok(vis&&live(s2).length===1&&live(s2)[0].start===ms('05:00'),'2f3 '+T0+'Save works while the "Deleted." message is on screen');
    const nid=live(s2)[0].id;await p.click('[data-edit="'+nid+'"]');await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(200);await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);}
   // undo
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);await p.click('#sheet [data-day="'+T+'"]');await p.waitForTimeout(150);await p.click('#dAdd');await p.waitForTimeout(150);await p.fill('#eStart','08:00');await p.fill('#eEnd','10:00');await p.fill('#eBrk','0');await save(p);s=await st(p);const id2=live(s)[0].id;
   await p.click('#sheet [data-edit="'+id2+'"]');await p.waitForTimeout(150);await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(200);await p.click('.toast button');await p.waitForTimeout(250);s=await st(p);const wk2=(await p.textContent('#view')).replace(/\s+/g,' ');
   ok(live(s).length===1&&live(s)[0].id===id2&&/Gross so far\s*\$56\.00/.test(wk2)&&!!(await p.$('#sheet [data-row="'+id2+'"]')),'2i '+T0+'Undo brings the entry back and the totals with it ($56.00)');
   ok(s.log.filter(l=>l.id===id2).map(l=>l.field).join()==='(created),(deleted),(undeleted)','2j '+T0+'history records created, deleted and brought back');
   // PTO entry + delete from the day sheet and from the Clock tab list
   await p.click('nav.tabs [data-v=today]');await p.click('[data-a=addpto]');await p.waitForTimeout(150);await p.fill('#ePH','8');await save(p);s=await st(p);const pid=live(s).find(e=>e.kind==='pto').id;
   await p.click('[data-edit="'+pid+'"]');await p.waitForTimeout(150);await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(200);s=await st(p);ok(!live(s).some(e=>e.kind==='pto')&&/Vacation.*used 0 hrs\s*40 hrs/.test((await (async()=>{await p.click('nav.tabs [data-v=pto]');await p.waitForTimeout(150);return p.textContent('#view');})()).replace(/\s+/g,' ')),'2k '+T0+'a PTO entry can be deleted from the Clock tab list; the PTO balance goes back to 40 hrs');
   await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(150);await p.click('#sheet [data-day="'+T+'"]');await p.waitForTimeout(150);await p.click('#otjModal [data-edit="'+id2+'"]');await p.waitForTimeout(150);await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(200);s=await st(p);
   ok(live(s).length===0&&dialogs.length===0,'2l '+T0+'the last entry can be deleted from the day sheet too; no browser pop-ups were used anywhere');
   ok(!errs.length,'2 '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}

  // ── 3. change history in plain English ──
  {const t0=NOW.getTime()-86400e3*2;const oldSet={rate:28,otRate:'',period:'weekly',anchor:T,weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false};
   const log=[{t:t0,id:'settings',field:'(setup)',old:'',new:'rate 28, weekly, FL',reason:''},
    {t:t0+1e3,id:'ZQXOLD1',field:'(created)',old:'',new:T+' 7:00am-3:30pm break 30m',reason:'clock'},
    {t:t0+2e3,id:'ZQXOLD1',field:'end',old:new Date(ms('15:30')).toLocaleString(),new:new Date(ms('16:00')).toLocaleString(),reason:'forgot to clock out'},
    {t:t0+3e3,id:'job',field:'Harbor Line Builders',old:JSON.stringify({id:'ZQXJOB1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,created:1}),new:JSON.stringify({id:'ZQXJOB1',name:'Harbor Line Builders',rate:'30',otRate:'',active:true,created:1}),reason:''},
    {t:t0+4e3,id:'pto',field:'bucket Vacation',old:JSON.stringify({id:'ZQXBKT1',name:'Vacation',type:'none',start:0,startDate:T}),new:JSON.stringify({id:'ZQXBKT1',name:'Vacation',type:'none',start:40,startDate:T}),reason:''},
    {t:t0+5e3,id:'settings',field:'pay setup',old:JSON.stringify(oldSet),new:JSON.stringify(Object.assign({},oldSet,{rate:30,weekStart:0,k401:50})),reason:''},
    {t:t0+6e3,id:'ZQXGONE9',field:'(created)',old:'',new:T+' PTO 8h Vacation',reason:'manual'},
    {t:t0+7e3,id:'ZQXGONE9',field:'(deleted)',old:T+' PTO 8h Vacation',new:'',reason:''},
    {t:t0+8e3,id:'backup',field:'(restored)',old:'',new:'2026-11-08T14:03:22.123Z · 3 entries · 1 damaged skipped',reason:''},
    {t:t0+9e3,id:'ZQXOLD1',field:'weird{field}',old:'{"a":1}',new:'[1,2]',reason:''},
    {t:'x',id:null,field:null,old:{a:1},new:7},null,5];
   const {c,p,errs}=await open(seed({entries:[W('ZQXOLD1','07:00','16:00',{breakMin:30,src:'clock'})],log}),true);
   // real edits through the screens
   await p.click('[data-edit="ZQXOLD1"]');await p.waitForTimeout(150);await p.fill('#eEnd','16:30');await p.fill('#eBrk','45');await p.fill('#eC_job','E29037056');await p.fill('#eC_po','943015');await p.fill('#eNote','north gate');await save(p);
   await p.click('[data-edit="ZQXOLD1"]');await p.waitForTimeout(150);await p.fill('#eC_po','943099');await p.fill('#eWhy','wrong PO');await save(p);
   await p.click('[data-a=add]');await p.waitForTimeout(150);await p.fill('#eStart','17:00');await p.fill('#eEnd','18:00');await p.fill('#eBrk','0');await p.click('#eClr');await save(p);
   let s=await st(p);const newId=live(s).find(e=>e.id!=='ZQXOLD1').id;await p.click('[data-edit="'+newId+'"]');await p.waitForTimeout(150);await p.click('#eDel');await p.click('#eDelYes');await p.waitForTimeout(200);await p.click('.toast button');await p.waitForTimeout(200);
   await p.click('nav.tabs [data-v=more]');await p.click('[data-a=logview]');await p.waitForTimeout(250);
   const H=await p.evaluate(()=>{const u=document.getElementById('hist');const sh=document.querySelector('#otjModal .sheet');return {rows:[...u.querySelectorAll('li')].map(l=>l.innerText.replace(/\s+/g,' ').trim()),over:Math.max(u.scrollWidth-u.clientWidth,sh.scrollWidth-sh.clientWidth,document.documentElement.scrollWidth-innerWidth),fs:parseFloat(getComputedStyle(u.querySelector('li')).fontSize),tables:document.querySelectorAll('#otjModal table').length};});
   s=await st(p);const ids=[...new Set(s.entries.map(e=>e.id).concat(s.jobs.map(j=>j.id),s.pto.buckets.map(x=>x.id),['ZQXGONE9']))];const all=H.rows.join('\n');
   if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pl-3-history.png')});
   ok(H.rows.length>=15&&!/[{}]/.test(all)&&!/"\w+":/.test(all),'3a '+T0+'no row has "{" or raw data ('+H.rows.length+' rows)');
   ok(!ids.some(i=>all.indexOf(i)>=0)&&!/undefined|null|NaN|\[object|Invalid Date/.test(all),'3b '+T0+'no row shows an id ('+ids.length+' ids checked) or a broken value');
   ok(H.over<=1&&H.fs>=15&&H.tables===0,'3c '+T0+'fits the screen: no sideways scroll, '+H.fs+'px type');
   const has=(re,why)=>ok(H.rows.some(r=>re.test(r)),'3d '+T0+why+' → "'+(H.rows.find(r=>re.test(r))||'MISSING').slice(0,110)+'"');
   has(new RegExp('^\\w{3} \\d+ · Edited shift \\('+SD+'\\): 7:00 AM–4:00 PM → 7:00 AM–4:30 PM; break 30 min → 45 min; added job codes Job E29037056 · PO 943015; added note “north gate”$'),'an edit made in the app reads as one line');
   has(/Edited shift \(.*\): job codes Job E29037056 · PO 943015 → Job E29037056 · PO 943099 · “wrong PO”$/,'a code change shows before → after and the reason typed');
   has(/Added a shift \(.*\): 5:00 PM–6:00 PM$/,'adding hours');has(/Deleted a shift \(.*\): 5:00 PM–6:00 PM$/,'deleting');has(/Brought back a deleted shift \(.*\): 5:00 PM–6:00 PM$/,'undo of a delete');
   has(/Clocked a shift \(.*\): 7:00 AM–3:30 PM, 30 min break$/,'old history: a clocked shift');has(/Edited shift \(.*\): end 3:30 PM → 4:00 PM · “forgot to clock out”$/,'old history: an end-time edit (saved before this fix)');
   has(/Edited job Harbor Line Builders: hourly rate none → \$30\.00$/,'old history: a job edit that was stored as raw data');has(/Edited PTO bucket Vacation: starting balance 0 → 40$/,'old history: a PTO bucket edit that was stored as raw data');
   has(/Changed pay setup: hourly rate \$28\.00 → \$30\.00; workweek starts Monday → Sunday; 401\(k\) none → \$50\.00$/,'old history: a pay set-up change that was stored as raw data');has(/Set up pay: \$28\.00\/hr, weekly, FL$/,'old history: first set-up');
   has(/Added PTO \(.*\): PTO 8 hrs \(Vacation\)$/,'old history: PTO for an entry that no longer exists');has(/Restored a backup \(made Nov 8 · 3 entries · 1 damaged skipped\)$/,'old history: a restore');has(/Edited shift \(.*\): other details$/,'old history: an unknown kind of change is named without dumping its data');
   ok(!H.rows.some(r=>/object Object|Dec 31/.test(r)),'3d '+T0+'damaged history rows are left out, not shown as nonsense');
   const iNew=H.rows.findIndex(r=>/Brought back/.test(r)),iOld=H.rows.findIndex(r=>/Set up pay/.test(r));ok(iNew===0&&iOld===H.rows.length-1-H.rows.slice().reverse().findIndex(r=>/Set up pay/.test(r))&&iOld>iNew&&/^\w{3} \d+ · /.test(H.rows[0]),'3e '+T0+'newest first: the last change is row 1, the first set-up is at the bottom; each row starts with its date');
   ok(/changes\. Newest first\./.test(await p.textContent('#otjModal .fine')),'3f '+T0+'the heading says how many changes, newest first');
   ok(!errs.length,'3 '+T0+'no page errors, even with damaged history rows '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
