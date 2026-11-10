// Clocked In must open at BOTH /job and /job/ (200, right page, right manifest).
// Usage: node job_route_t.js ..                      (local server that applies the repo's _redirects file)
//        node job_route_t.js https://<preview-or-live> (checks a real deploy; run this on the Cloudflare preview before going live)
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const ARG=process.argv[2]||'..';const REMOTE=/^https?:\/\//.test(ARG);const ROOT=REMOTE?null:path.resolve(ARG);const PORT=18893;const O=REMOTE?ARG.replace(/\/+$/,''):'http://127.0.0.1:'+PORT;
const TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
// _redirects: "<from> <to> [status]" per line; 200 = serve <to> at the same address, 3xx = redirect
const rules=()=>{const f=path.join(ROOT,'_redirects');if(!fs.existsSync(f))return [];return fs.readFileSync(f,'utf8').split('\n').map(l=>l.trim()).filter(l=>l&&l[0]!=='#').map(l=>{const p=l.split(/\s+/);return {from:p[0],to:p[1],code:+(p[2]||302)};});};
// Strict on purpose: with no rule, a folder asked for without its slash is a 404 (the failure seen on production).
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);const r=rules().find(x=>x.from===u);
  if(r){if(r.code===200)u=r.to;else{s.writeHead(r.code,{Location:r.to});return s.end();}}
  if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('not found');}
  s.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
(async()=>{if(!REMOTE)await new Promise(r=>srv.listen(PORT,r));
 if(!REMOTE){const R=rules();ok(R.some(x=>x.from==='/job'&&x.to==='/job/index.html'&&x.code===200),'_redirects has the rule "/job /job/index.html 200"');
  ok(!R.some(x=>x.from==='/*'||x.from==='/'),'_redirects does not touch the home page or the resume app');}
 const b=await chromium.launch();
 for(const dev of ['phone','desktop'])for(const url of ['/job','/job/','/job?src=homescreen','/job/?src=homescreen']){
  const cx=await b.newContext(dev==='phone'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});const p=await cx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  const res=await p.goto(O+url,{waitUntil:'load'});const tag='['+dev+'] '+url;
  ok(res&&res.status()===200,tag+' answers 200 (got '+(res&&res.status())+')');
  ok(/Clocked In/.test(await p.title()),tag+' is the Clocked In page (title "'+(await p.title())+'")');
  const href=await p.evaluate(()=>{const l=document.querySelector('link[rel=manifest]');return l?l.href:'';});
  const m=await p.evaluate(async h=>{try{const r=await fetch(h);return {s:r.status,j:await r.json()};}catch(e){return {s:0,j:{}};}},href);
  ok(m.s===200&&/Clocked In/.test(m.j.name||'')&&m.j.short_name==='Clocked In'&&m.j.scope==='/job/'&&/^\/job\/\?/.test(m.j.start_url||''),tag+' loads the Clocked In manifest (name "'+m.j.name+'", scope '+m.j.scope+', start '+m.j.start_url+')');
  await p.waitForFunction(()=>window.OTJ&&OTJ.tax&&OTJ.tax(),null,{timeout:8000}).catch(()=>{});
  ok(await p.evaluate(()=>!!(window.OTJ&&OTJ.tax())&&!/Couldn't load the pay tables/.test(document.body.innerText)),tag+' loads its pay tables and shows the app, not an error card');
  const loc=await p.evaluate(()=>location.pathname+location.search);
  ok(/^\/job\/(\?|$)/.test(loc)&&(url.indexOf('?')<0||/src=homescreen/.test(loc)),tag+' ends up at /job/ with its query kept ('+loc+')');
  ok(!errs.length,tag+' no page errors '+errs.join('|').slice(0,160));await cx.close();}
 // the resume app and other paths are untouched by the rule
 const cx=await b.newContext();const p=await cx.newPage();const a=await p.goto(O+'/app.html',{waitUntil:'domcontentloaded'});ok(a&&a.status()===200&&!/Clocked In/.test(await p.title()),'/app.html still opens the resume app (200)');
 const j=await p.goto(O+'/job/tax-2026.json');ok(j&&j.status()===200,'/job/tax-2026.json still 200');
 if(!REMOTE){const n=await p.goto(O+'/jobs');ok(n&&n.status()===404,'a different path (/jobs) is not caught by the rule (404)');}
 await b.close();if(!REMOTE)srv.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
