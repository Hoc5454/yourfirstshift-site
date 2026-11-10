// The Cloudflare Pages _worker.js (file map + router) built by tools/build-pages-worker.js.
// Builds real bundles, loads them, and sends requests through the router itself.
// Usage: node pages_worker_t.js ..                       (uses repo files; stand-in bytes for site files that are not in the repo)
//        node pages_worker_t.js .. --prod-dir <siteDir>  (also rebuilds production be89f333 from its 21 real files and checks it byte for byte)
const fs=require('fs');const path=require('path');const os=require('os');const http=require('http');const cp=require('child_process');const crypto=require('crypto');
const ROOT=path.resolve(process.argv[2]||'..');const PI=process.argv.indexOf('--prod-dir');const PROD_DIR=PI>0?path.resolve(process.argv[PI+1]):'';
const B=require(path.join(ROOT,'tools','build-pages-worker.js'));
const LIST=JSON.parse(fs.readFileSync(path.join(ROOT,'tools','pages-files.json'),'utf8'));const PROD=JSON.parse(fs.readFileSync(path.join(ROOT,'tools','pages-files.prod-be89f333.json'),'utf8'));
const EXP=JSON.parse(fs.readFileSync(path.join(ROOT,'tools','prod-be89f333.expected.json'),'utf8'));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'yfs-pw-'));
// site folder for the test: the repo's own files where it has them, clearly marked stand-ins for the rest
const SITE=path.join(TMP,'site');const standIn=[];
for(const [p] of LIST){const src=path.join(ROOT,p),dst=path.join(SITE,p);fs.mkdirSync(path.dirname(dst),{recursive:true});
 if(fs.existsSync(src))fs.copyFileSync(src,dst);else{standIn.push(p);fs.writeFileSync(dst,/\.html$/.test(p)?'<!doctype html><title>stand-in '+p+'</title>':'stand-in '+p);}}
const load=async(js,name)=>{const f=path.join(TMP,name+'.mjs');fs.writeFileSync(f,js);return (await import('file://'+f)).default;};
const ask=async(w,u)=>{const r=await w.fetch(new Request('https://yfs.test'+u));const b=Buffer.from(await r.arrayBuffer());return {s:r.status,ct:r.headers.get('content-type'),cc:r.headers.get('cache-control'),n:b.length,h:sha(b),b};};
const same=(a,b)=>a.s===b.s&&a.ct===b.ct&&a.cc===b.cc&&a.h===b.h;
(async()=>{
 // ── 1. builder: deterministic, exact shape, no secrets ──
 const js=B.build(SITE,LIST,true),js2=B.build(SITE,LIST,true);
 ok(js===js2&&B.sha256(js)===B.sha256(js2),'1a same files + same list = the same bytes (sha '+B.sha256(js).slice(0,12)+'…, '+Buffer.byteLength(js).toLocaleString()+' B)');
 const out1=path.join(TMP,'a.js'),out2=path.join(TMP,'b.js');const cli=o=>cp.execFileSync('node',[path.join(ROOT,'tools','build-pages-worker.js'),SITE,path.join(ROOT,'tools','pages-files.json'),o,'--dir-index']).toString();
 const c1=cli(out1);await new Promise(r=>setTimeout(r,1100));cli(out2);ok(fs.readFileSync(out1,'utf8')===js&&fs.readFileSync(out2,'utf8')===js&&c1.indexOf(B.sha256(js))>0,'1b the command-line build gives the same bytes on a later run and prints its sha256 and size');
 const jsonPart=js.slice(8,js.length-B.router(true).length);
 ok(js.startsWith('const F={')&&js.endsWith(B.router(true))&&JSON.stringify(JSON.parse(jsonPart))===jsonPart,'1c shape: "const F=" + compact JSON file map + router, nothing before or after');
 ok(B.router(false).length===553&&B.router(true)===B.router(false).replace("const f=F[p];","if(!F[p]&&F[p+'/index.html'])p=p+'/index.html';const f=F[p];"),'1d router without --dir-index is the 553-byte production router; --dir-index adds exactly one statement');
 ok(sha(B.router(false))==='8d9bb01db112a17c8d067cf7667df7e23858fd4c5a76b7f87fc9c5953616ef10'&&sha(B.router(true))==='7ea4d00619b192fc40e4a47f2dd457f40011f1c80ceed423be63799b5004d915','1e router text is pinned (old '+sha(B.router(false)).slice(0,12)+'…, new '+sha(B.router(true)).slice(0,12)+'…)');
 const F=JSON.parse(jsonPart);ok(Object.keys(F).join()===LIST.map(x=>x[0]).join()&&LIST.every(([p,t])=>F[p][1]===t&&Buffer.from(F[p][0],'base64').equals(fs.readFileSync(path.join(SITE,p)))),'1f every listed file is embedded in list order, byte for byte, with its content type ('+LIST.length+' files)');
 const routerSrc=B.router(true);ok(!/\benv\b|fetch\(\s*['"`h]|XMLHttpRequest|WebSocket|process\.|Date\.now|Math\.random/.test(routerSrc)&&(routerSrc.match(/fetch/g)||[]).length===1,'1g router has no network calls, no bindings, no clock or random input (only the fetch handler itself)');
 const SECRET=/sk_live_|sk_test_|rk_live_|whsec_|sk-ant-|AKIA[0-9A-Z]{16}|ADMIN_KEY\s*[:=]\s*['"][^'"]+|Bearer\s+[A-Za-z0-9_\-]{20,}/;
 const builderSrc=fs.readFileSync(path.join(ROOT,'tools','build-pages-worker.js'),'utf8');const texts=LIST.filter(([p,t])=>/^text|json|xml|javascript|manifest/.test(t)&&standIn.indexOf(p)<0).map(([p])=>[p,fs.readFileSync(path.join(SITE,p),'utf8')]);
 const hit=texts.filter(([p,t])=>SECRET.test(t)).map(x=>x[0]);ok(!SECRET.test(builderSrc)&&!SECRET.test(routerSrc)&&!hit.length,'1h no key or token pattern in the builder, the router or any embedded text file from the repo ('+texts.length+' scanned) '+hit.join(','));
 let threw=0;for(const bad of [[['/../x','text/plain']],[['/app.html','text/html'],['/app.html','text/html']],[['/app.html','']],[['app.html','text/html']]]){try{B.build(SITE,bad,true);}catch(_){threw++;}}ok(threw===4,'1i the builder refuses a path with "..", a path listed twice, a missing content type and a path without a leading slash');

 // ── 2. routes on the new bundle ──
 const W=await load(js,'new');const bytes=p=>fs.readFileSync(path.join(SITE,p));const HTML='text/html; charset=utf-8',CCH='public, max-age=60, must-revalidate',CCS='public, max-age=86400';
 const is=(r,p,ct,cc)=>r.s===200&&r.ct===ct&&r.cc===cc&&r.b.equals(bytes(p));
 let r=await ask(W,'/');ok(is(r,'/index.html',HTML,CCH),'2a / serves /index.html');
 r=await ask(W,'/app.html');const r2=await ask(W,'/app');ok(is(r,'/app.html',HTML,CCH)&&same(r,r2)&&r.h===sha(fs.readFileSync(path.join(ROOT,'app.html'))),'2b /app.html and /app serve the repo\'s app.html byte for byte, html cache rule');
 for(const u of ['/job','/job/','/job?src=homescreen','/job/?src=homescreen','/job/index.html','/job//']){r=await ask(W,u);ok(is(r,'/job/index.html',HTML,CCH)&&/<title>Clocked In/.test(r.b.toString()),'2c '+u+' serves job/index.html (200, Clocked In)');}
 r=await ask(W,'/job/sw.js');ok(is(r,'/job/sw.js','text/javascript; charset=utf-8',CCS),'2d /job/sw.js: javascript type (needed for the offline worker to register)');
 r=await ask(W,'/job/manifest.webmanifest');ok(is(r,'/job/manifest.webmanifest','application/manifest+json',CCS)&&JSON.parse(r.b).short_name==='Clocked In','2e /job/manifest.webmanifest: the Clocked In manifest');
 r=await ask(W,'/job/tax-2026.json');ok(is(r,'/job/tax-2026.json','application/json; charset=utf-8',CCS),'2f /job/tax-2026.json');
 for(const u of ['/job/icon-192.png','/job/icon-512.png','/job/apple-touch-icon.png']){r=await ask(W,u);ok(is(r,u,'image/png',CCS),'2g '+u);}
 r=await ask(W,'/privacy');const rt=await ask(W,'/terms');ok(is(r,'/legal.html',HTML,CCH)&&same(r,rt),'2h /privacy and /terms serve /legal.html');
 for(const u of ['/nope','/job/nope','/jobs','/job/indexx','/app.html/x','/.git/config','/tools/build-pages-worker.js','/tests/otj_t.js','/README.md','/worker/worker.js']){r=await ask(W,u);ok(r.s===404&&r.b.toString()==='Not found'&&r.n===9&&r.cc===null,'2i '+u+' → 404 "Not found" (9 bytes, no cache header)');}
 for(const u of ['/api/pro/verify','/api/pro/checkout','/api/pro/plans','/api/metrics/x','/api','/api/']){r=await ask(W,u);ok(r.s===404&&r.b.toString()==='Not found','2j '+u+' is untouched by the router: 404 on the Pages host, as it always has been');}
 r=await W.fetch(new Request('https://yfs.test/api/pro/verify',{method:'POST',body:'{}'}));ok(r.status===404,'2k POST /api/pro/verify → 404 (the API lives on the separate Worker)');

 // ── 3. the new router changes nothing production serves today ──
 const oldP=await load(B.build(SITE,PROD,false),'prod-old'),newP=await load(B.build(SITE,PROD,true),'prod-new');
 const probes=[];for(const [p] of PROD){probes.push(p,p+'/',p+'?x=1',p+'//',p.replace(/\.html$/,''),p.replace(/\.html$/,'')+'/');}
 probes.push('/','//','/?utm=x','/privacy','/privacy/','/terms','/terms/','/legal','/app','/index','/org-report','/job','/job/','/job/index.html','/job/sw.js','/nope','/nope/','/api/pro/verify','/api/pro/checkout','/favicon','/og-image','/site','/robots','/sitemap','/a/b/c','/%20','/index.html/index.html','/app.html/index.html');
 let diff=[];for(const u of probes){const a=await ask(oldP,u),b=await ask(newP,u);if(!same(a,b))diff.push(u+' '+a.s+'→'+b.s);}
 ok(!diff.length,'3a production\'s 21 files: old router and new router answer the same for all '+probes.length+' probes (status, body, content type, cache rule) '+diff.slice(0,4).join(' | '));
 let served=0;for(const [p,t] of PROD){const a=await ask(oldP,p);if(a.s===200&&a.ct===t)served++;}ok(served===PROD.length,'3b every production path is served with its own content type ('+served+'/'+PROD.length+')');
 r=await ask(oldP,'/job/');ok(r.s===404,'3c the production router has no folder index: /job/ is 404 there (the bug)');
 // production hashes: check what the repo can check; the full rebuild needs the 21 real files
 const appProd=cp.execFileSync('git',['-C',ROOT,'show','767325f:app.html'],{maxBuffer:1<<26});ok(sha(appProd)===EXP.files['/app.html'][0]&&appProd.length===EXP.files['/app.html'][1],'3d production app.html = repo commit 767325f (sha e2e45db6…, 348,584 B)');
 ok(sha(fs.readFileSync(path.join(ROOT,'org-report.html')))===EXP.files['/org-report.html'][0],'3e production org-report.html = the repo\'s org-report.html');
 const sizes=PROD.reduce((a,[p,t])=>a+JSON.stringify(p).length+1+JSON.stringify([Buffer.alloc(EXP.files[p][1]).toString('base64'),t]).length,0)+2+(PROD.length-1);
 ok(8+sizes+553===EXP.bundle.bytes,'3f the documented production sizes add up to the documented bundle size: 8 + '+sizes.toLocaleString()+' + 553 = '+EXP.bundle.bytes.toLocaleString()+' B');
 if(PROD_DIR){const miss=PROD.filter(([p])=>!fs.existsSync(path.join(PROD_DIR,p))).map(x=>x[0]);const bad=miss.length?[]:PROD.filter(([p])=>sha(fs.readFileSync(path.join(PROD_DIR,p)))!==EXP.files[p][0]).map(x=>x[0]);
  ok(!miss.length&&!bad.length,'3g --prod-dir holds the 21 production files with the documented hashes '+miss.concat(bad).join(','));
  if(!miss.length){const pj=B.build(PROD_DIR,PROD,false);ok(B.sha256(pj)===EXP.bundle.sha256&&Buffer.byteLength(pj)===EXP.bundle.bytes,'3h rebuilt production bundle be89f333 byte for byte (sha '+B.sha256(pj).slice(0,12)+'…, '+Buffer.byteLength(pj).toLocaleString()+' B)');}}
 else console.log('SKIP 3g/3h byte-for-byte rebuild of production be89f333: needs the 21 real production files (run with --prod-dir <siteDir>). '+standIn.length+' site files are not in the repo: '+standIn.join(', '));

 // ── 4. real browsers through the real router: Clocked In opens, installs for offline, reopens with no signal ──
 let HOLD=false;const srv=http.createServer(async(q,s)=>{if(HOLD&&/^\/job\/?(\?|$)/.test(q.url))return; /* weak signal: never answer the page request */try{const rr=await W.fetch(new Request('http://127.0.0.1'+q.url,{method:q.method}));const h={};rr.headers.forEach((v,k)=>h[k]=v);s.writeHead(rr.status,h);s.end(Buffer.from(await rr.arrayBuffer()));}catch(e){s.writeHead(500);s.end(String(e));}});
 const PORT=18896;await new Promise(r=>srv.listen(PORT,r));const O='http://127.0.0.1:'+PORT;
 const jr=await new Promise(res=>{let out='';const ch=cp.spawn('node',[path.join(__dirname,'job_route_t.js'),O],{env:process.env});ch.stdout.on('data',d=>out+=d);ch.stderr.on('data',d=>out+=d);const t=setTimeout(()=>ch.kill(),240000);ch.on('close',()=>{clearTimeout(t);res({stdout:out});});});const jp=(jr.stdout.match(/^PASS /gm)||[]).length,jf=(jr.stdout.match(/^FAIL /gm)||[]).length;
 ok(jp>=50&&jf===0&&/ALL PASS/.test(jr.stdout),'4a job_route_t run against the built worker: '+jp+' pass, '+jf+' fail '+(jr.stdout.match(/^FAIL .*$/m)||[''])[0].slice(0,120));
 const {chromium}=require('playwright');const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(O+'/job/',{waitUntil:'load'});const act=await p.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration('/job/');return !!(r&&r.active&&r.active.state==='activated');},null,{timeout:25000}).then(()=>true).catch(()=>false);
 const cache=await p.evaluate(async()=>{const ks=await caches.keys();const c=await caches.open('otj-v2');return {ks,files:(await c.keys()).map(r=>new URL(r.url).pathname)};});
 ok(act&&cache.ks.join()==='otj-v2'&&['/job/','/job/tax-2026.json','/job/manifest.webmanifest','/job/icon-192.png'].every(f=>cache.files.includes(f)),'4b the offline worker installs from the built worker; cache is otj-v2 with the page, pay tables, manifest and icons '+(act?'':'[not active] ')+cache.ks.join()+' '+cache.files.length);
 await c.setOffline(true);let off=false;try{await p.goto(O+'/job/?src=homescreen',{waitUntil:'load',timeout:8000});await p.waitForFunction(()=>window.OTJ&&OTJ.tax&&OTJ.tax(),null,{timeout:6000});off=/Clocked In/.test(await p.title());}catch(_){}
 ok(off,'4c no signal: /job/?src=homescreen (the Home Screen address) opens the app with its pay tables');
 await c.setOffline(false);
 // slow signal: the page request hangs; the saved copy opens after the wait instead of a blank screen
 HOLD=true;
 const t0=Date.now();let slow=false;try{await p.goto(O+'/job/?fresh=1',{waitUntil:'domcontentloaded',timeout:12000});slow=/Clocked In/.test(await p.title());}catch(e){console.log('4d err '+String(e).slice(0,200));}const took=Date.now()-t0;
 ok(slow&&took>=3500&&took<9000,'4d weak signal: when the network hangs, the saved copy opens after about 4 seconds ('+(took/1000).toFixed(1)+' s) ');HOLD=false;
 ok(!errs.length,'4 no page errors '+errs.join('|').slice(0,140));await b.close();srv.close();
 fs.rmSync(TMP,{recursive:true,force:true});console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
