// On the Job edge cases: damaged / hostile / extreme saved data must never crash the page or show NaN/undefined.
// Usage: node otj_edge_t.js .. [caseFilter|''] [free|pro]   (slow: run free and pro in parallel)
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const ONLY=process.argv[3]||'';const PORT=18891+(process.argv[4]==='pro'?1:0),O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const T=ymd(new Date());const t0=new Date(T+'T07:00:00').getTime();
const SET={rate:28,otRate:'',period:'weekly',anchor:T,weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false};
const base=x=>Object.assign({app:'yfs-on-the-job',v:1,created:Date.now(),settings:SET,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Gulf Coast Grocers',rate:'',otRate:'',active:true}],codes:[],entries:[],pto:{buckets:[]},clock:null,log:[],lastBackup:Date.now(),ui:{a2hsX:1}},x);
const W=(o)=>Object.assign({id:'e'+Math.random(),kind:'work',date:T,start:t0,end:t0+8*3600e3,breakMin:0,jobId:'j1',codeId:'',splits:[],note:''},o);
const XSS='<img src=x onerror="window.__pwn=1">';
const CASES={
 'missing lists (old/partial save)':{app:'yfs-on-the-job',v:1,settings:SET},
 'lists are wrong types':base({jobs:null,codes:'x',entries:{},pto:null,log:5,labels:null,ui:null}),
 'settings half-filled':base({settings:{rate:'abc',period:'nope',state:'ZZ',filing:'?',weekStart:9},entries:[W({})]}),
 'no settings but has entries':base({settings:null,entries:[W({})]}),
 'garbage entries':base({entries:[null,5,'x',{},W({start:'x',end:null}),W({date:'not-a-date'}),W({end:t0-3600e3}),W({breakMin:99999}),W({jobId:'gone'}),W({splits:[{codeId:'gone',hours:'x'},null]}),W({kind:'pto',bucket:'gone',hours:-5}),W({kind:'weird'})]}),
 'extreme numbers':base({settings:Object.assign({},SET,{rate:1e12,k401:1e9,health:-500,extraWH:1e9,perDiem:1e7,credits:-1e6}),entries:[W({end:t0+400*3600e3}),W({date:'1900-01-01',start:-1e15,end:1e15})]}),
 'negative + zero pay':base({settings:Object.assign({},SET,{rate:-20}),jobs:[{id:'j1',name:'',rate:0,otRate:-1,active:true}],entries:[W({})]}),
 'hostile names':base({jobs:[{id:'j1',name:XSS,rate:'',otRate:'',active:true}],codes:[{id:'c1',nick:XSS,jobId:'j1',fields:{proj:XSS,po:XSS,cost:XSS,wo:XSS},active:true},{id:'c2',nick:XSS}],labels:{proj:XSS,po:XSS,cost:XSS,wo:XSS},entries:[W({note:XSS,codeId:'c1'})],pto:{buckets:[{id:'b1',name:XSS,type:XSS,earn:XSS,per:XSS}]},log:[{t:Date.now(),what:XSS,old:XSS,new:XSS,reason:XSS}]}),
 'clock left running for a year':base({clock:{start:Date.now()-365*86400e3,jobId:'j1',breaks:[{s:Date.now()-1000}]}}),
 'clock is garbage':base({clock:{start:'x',breaks:'y'}}),
 'pto garbage':base({pto:{buckets:[null,{id:'b',name:'Vac',hours:'x',accrual:null,start:'bad'},{id:'c',name:'Sick',accrual:{type:'perHour',rate:1e9}}]},entries:[W({kind:'pto',bucket:'b',hours:1e9})]}),
 '5,000 entries':base({entries:Array.from({length:5000},(_,i)=>W({id:'e'+i,date:ymd(new Date(Date.now()-i*86400e3)),start:t0-i*86400e3,end:t0-i*86400e3+9*3600e3}))}),
};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();
 for(const pro of (process.argv[4]==='pro'?[true]:process.argv[4]==='free'?[false]:[false,true]))for(const [name,state] of Object.entries(CASES)){if(ONLY&&!name.includes(ONLY))continue;
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await c.addInitScript(([v,pro])=>{if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('yfs_otj_v1',v);if(pro)localStorage.setItem('yfs_pro','1');}},[JSON.stringify(state),pro]);
  const p=await c.newPage();p.setDefaultTimeout(600);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
  const t=Date.now();await p.goto(O+'/job/');await p.waitForTimeout(600);const bad=[];let slow=Date.now()-t;
  const scan=async w=>{const r=await p.evaluate(()=>{const tx=document.body.innerText;return {blank:tx.trim().length<40,nan:(tx.match(/.{0,40}(NaN|undefined|\[object|Infinity|Invalid Date).{0,20}/g)||[]).slice(0,2),pwn:window.__pwn||0,img:document.querySelectorAll('img[src="x"]').length,wide:document.documentElement.scrollWidth-innerWidth};});
   if(r.blank)bad.push(w+':blank');if(r.nan.length)bad.push(w+':'+r.nan.join(','));if(r.pwn||r.img)bad.push(w+':script-ran');if(r.wide>2)bad.push(w+':wide+'+r.wide);};
  await scan('load');
  const tabs=await p.$$eval('nav.tabs [data-v]',a=>a.map(x=>x.dataset.v));
  for(const v of tabs){await p.click('nav.tabs [data-v='+v+']').catch(()=>{});await p.waitForTimeout(250);await scan(v);
   const acts=await p.$$eval('main [data-a], .wrap [data-a]',a=>[...new Set(a.map(x=>x.dataset.a))].filter(x=>!/backup|restore|csv|install|clock|del|reset|wipe|erase|upgrade|plans|pro/i.test(x)).slice(0,10)).catch(()=>[]);
   for(const a of acts){const el=await p.$('[data-a="'+a+'"]');if(!el)continue;await el.click({timeout:400}).catch(()=>{});await p.waitForTimeout(150);await scan(v+'>'+a);
    await p.evaluate(()=>{try{closeModal();}catch(_){}document.querySelectorAll('.sheet-bg,.modal-bg').forEach(x=>x.click&&0);});await p.click('nav.tabs [data-v='+v+']').catch(()=>{});await p.waitForTimeout(80);}}
  ok(!errs.length&&!bad.length,`[${pro?'pro':'free'}] ${name}: no crash, no NaN/undefined, nothing runs${slow>4000?' (slow '+slow+'ms)':''} ${[...new Set(errs)].join(' | ').slice(0,260)} ${[...new Set(bad)].slice(0,6).join(' ')}`);
  await c.close();}
 await b.close();srv.close();console.log(fails?fails+' FAIL':'ALL PASS');process.exit(fails?1:0);})();
