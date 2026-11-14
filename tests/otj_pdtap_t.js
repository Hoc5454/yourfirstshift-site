// Clocked In: per diem tap target. ONLY the checkbox and the words "Per diem" toggle it; the empty lower and left parts of a day row do not.
// iPhone, Android and desktop sizes. Made-up data only. Usage: node otj_pdtap_t.js .. [shotDir]
const {chromium,devices}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18879,O='http://127.0.0.1:'+PORT;
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

  const one=()=>seed({settings:SET({perDiemTax:'yes'}),jobs:[job(null,{perDiem:75})],entries:[H(D(0),10),H(T,8,{start:at(T,'00:00')})].filter((e,i,a)=>a.findIndex(z=>z.date===e.date)===i)});
  const geo=(p,sel)=>p.evaluate(sel=>{const l=document.querySelector(sel),r=l.getBoundingClientRect(),cb=l.querySelector('input').getBoundingClientRect(),sp=l.querySelector('span').getBoundingClientRect(),day=l.closest('.tsday'),row=day.getBoundingClientRect(),ps=getComputedStyle(day);
    let a=l.parentNode,lab=false;while(a&&a!==document.body){if(a.tagName==='LABEL')lab=true;a=a.parentNode;}
    return {l:r.left,r:r.right,w:r.width,h:r.height,top:r.top,bot:r.bottom,cy:r.top+r.height/2,cbCx:cb.left+cb.width/2,cbCy:cb.top+cb.height/2,spCx:sp.left+sp.width/2,spCy:sp.top+sp.height/2,rowL:row.left,rowR:row.right,rowB:row.bottom,inL:row.left+parseFloat(ps.paddingLeft),parentIsDay:l.parentNode===day,wrapLabel:lab,vw:innerWidth};},sel);
  const checked=(p,k)=>p.evaluate(k=>document.querySelector('#sheet [data-pdday="'+k+'"]').checked,k);
  const tapAt=async(p,x,y)=>{if(DEVS[dev].hasTouch)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);await p.waitForTimeout(220);};
  const closeAny=async p=>{if(await p.$('#otjModal')){await p.click('#otjModal [data-close]');await p.waitForTimeout(150);}};
  const scroll=(p,sel)=>p.evaluate(sel=>document.querySelector(sel).scrollIntoView({block:'center'}),sel);

  {const {c,p,errs}=await open(one());await p.click('nav.tabs [data-v=week]');await p.waitForTimeout(200);
   const css=await p.evaluate(()=>{for(const sh of document.styleSheets){for(const r of sh.cssRules){if(r.selectorText==='.pdchk')return r.cssText;}}return '';});
   ok(/display:\s*flex/.test(css)&&!/inline-flex/.test(css)&&/width:\s*max-content/.test(css)&&/margin:\s*-6px 0(px)? 2px auto/.test(css)&&/min-height:\s*44px/.test(css),'0 '+T0+'.pdchk is display:flex; width:max-content; margin:-6px 0 2px auto (no inline-flex)');
   for(const [nm,k,sel] of [['a day with hours (ticked)',D(0)===T?D(1):D(0),null],['today',T,'.tsday.today'],['a day with no hours (unticked)',D(6)===T?D(5):D(6),null]]){
     const s='#sheet '+(sel?sel+' ':'')+'.pdchk'+(sel?'':':has([data-pdday="'+k+'"])');await scroll(p,s);await p.waitForTimeout(80);let g=await geo(p,s);const was=await checked(p,k);
     ok(g.parentIsDay&&!g.wrapLabel,'e '+T0+nm+': the label sits directly in the day row and no label wraps the whole row');
     // (c) lower empty area of the row: lower part of the per diem line and the row's bottom padding, left of and across the row
     const lowY=[g.top+g.h*0.8,g.bot-2,Math.min(g.rowB-2,g.bot+3)];const lowX=[g.inL+12,(g.inL+g.l)/2,g.l-10];let moved=[];
     for(const y of lowY)for(const x of lowX){await tapAt(p,x,y);if(await checked(p,k)!==was)moved.push(Math.round(x)+','+Math.round(y));await closeAny(p);}
     ok(!moved.length&&await checked(p,k)===was,'c '+T0+nm+': 9 taps in the lower empty area of the row do NOT change per diem '+moved.join(' '));
     // (d) left / empty part of the row at the per diem line's middle and top. Stops 10px short of the control: phone browsers snap a finger tap a few px away onto the nearest control, which no CSS can turn off.
     await scroll(p,s);g=await geo(p,s);moved=[];
     for(const y of [g.cy,g.top+g.h*0.3])for(const x of [g.inL+4,g.inL+40,(g.inL+g.l)/2,g.l-10]){await tapAt(p,x,y);if(await checked(p,k)!==was)moved.push(Math.round(x)+','+Math.round(y));await closeAny(p);}
     ok(!moved.length&&await checked(p,k)===was,'d '+T0+nm+': 8 taps on the left/empty part of the row do NOT change per diem '+moved.join(' '));
     // (a) the checkbox toggles; (b) the words toggle
     await scroll(p,s);g=await geo(p,s);await tapAt(p,g.cbCx,g.cbCy);const a1=await checked(p,k);
     ok(a1===!was,'a '+T0+nm+': tapping the checkbox toggles per diem');
     await scroll(p,s);g=await geo(p,s);await tapAt(p,g.spCx,g.spCy);const a2=await checked(p,k);
     ok(a2===was,'b '+T0+nm+': tapping the words "Per diem" toggles it back');
     ok(g.h>=44&&g.w<=140&&g.r<=g.vw+0.5,'f '+T0+nm+': control is still 44px tall ('+Math.round(g.h)+'px), small ('+Math.round(g.w)+'px wide) and on screen');}
   const s2=await st(p);ok(Object.keys(s2.pdDay||{}).length===0,'g '+T0+'after toggling each day there and back, nothing is left changed');
   if(SHOTS)await p.screenshot({path:path.join(SHOTS,dev+'-pdtap.png'),fullPage:false});
   ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),'h '+T0+'Timesheet still fits the screen');ok(!errs.length,'i '+T0+'no page errors '+errs.join('|').slice(0,140));await c.close();}
 }
 await b.close();srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
