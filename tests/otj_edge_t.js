// On the Job edge cases: damaged / hostile / extreme saved data must never crash the page or show NaN/undefined.
// Usage: node otj_edge_t.js .. [caseFilter|''] [free|pro]   (slow: run free and pro in parallel)
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ROOT=path.resolve(process.argv[2]||'..');const ONLY=process.argv[3]||'';const PORT=18891+(process.argv[4]==='pro'?1:0),O='http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const {CASES}=require('./otj_damaged_sets.js');
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
