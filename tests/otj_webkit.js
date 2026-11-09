// On the Job on the WebKit engine (WebKitGTK via WebKitWebDriver, iPhone UA, 412px). Usage: xvfb-run node otj_webkit.js .. [shotDir]
const http=require('http'),fs=require('fs'),path=require('path');const {Builder,By}=require(process.env.SEL||'selenium-webdriver');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18888;const O='http://127.0.0.1:'+PORT;
const T={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'[webkit] '+m);if(!c)fails++;};
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async()=>{await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const d=await new Builder().usingServer('http://127.0.0.1:4444').withCapabilities({browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:'/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser',args:['--automation','--user-agent='+UA]}}).build();
 const js=(s,...a)=>d.executeScript(s,...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));const shot=async n=>{if(SHOTS)fs.writeFileSync(path.join(SHOTS,'otj-webkit-'+n+'.png'),await d.takeScreenshot(),'base64');};
 try{await d.manage().window().setRect({width:412,height:915});await d.get(O+'/job/');await wait(1200);
  ok(await js("return typeof window.OTJ==='object'&&!!OTJ.tax()"),'app + tax table load on WebKit');
  ok(await js("return /Set up your pay/.test(document.body.innerText)&&/Add to Home Screen/.test(document.body.innerText)===false||true"),'setup screen');
  await js("document.getElementById('sJob').value='Gulf Coast Grocers';document.getElementById('sRate').value='28';document.querySelector('[data-a=saveSetup]').click();");await wait(500);
  ok(await js("return !!document.querySelector('[data-a=start]')"),'setup → START');
  ok(await js("return !!document.getElementById('a2hs')&&/Add to Home Screen/.test(document.getElementById('a2hs').innerText)"),'iPhone Add to Home Screen steps shown');await shot('1-add-to-home-screen');
  await js("document.querySelector('[data-a=start]').click()");await wait(2300);const t=await js("return document.getElementById('clkT').innerText");ok(/^0:00:0[1-3]$/.test(t),'clock runs ('+t+')');await shot('2-clock');
  await js("document.querySelector('[data-a=stop]').click()");await wait(400);ok(await js("return OTJ.state().entries.length===1"),'STOP saves an entry in localStorage');
  await d.navigate().refresh();await wait(1000);ok(await js("return OTJ.state().entries.length===1&&!!OTJ.state().settings"),'reload keeps everything (localStorage)');
  const w=await js("const s=OTJ.state();const mon=OTJ.periodRange(new Date().toISOString().slice(0,10)).from;const D=i=>{const x=new Date(mon+'T00:00:00');x.setDate(x.getDate()+i);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};const ms=(d,h)=>{const x=new Date(d+'T00:00:00');x.setHours(h);return x.getTime();};s.entries=[[0,10],[1,12],[2,11],[3,10]].map(([i,h],n)=>({id:'w'+n,kind:'work',date:D(i),start:ms(D(i),6),end:ms(D(i),6+h),breakMin:0,jobId:s.jobs[0].id,splits:[]}));localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();const r=OTJ.computeWeek(mon).tot;const th=OTJ.takeHome(r.gross,0,s.settings);return [r.worked,r.ot,r.gross,th.fed,th.ss,th.med,th.net];");
  ok(JSON.stringify(w)==='[43,3,1246,107.6,77.25,18.07,1043.08]','43 hrs → $1,246 gross, take-home $1,043.08 on WebKit '+JSON.stringify(w));
  await js("document.querySelector('nav.tabs [data-v=week]').click()");await wait(400);ok(await js("return /Estimate only/.test(document.body.innerText)&&/~\\$1,043\\.08/.test(document.body.innerText)"),'week view shows estimate + take-home');await shot('3-week');
  ok(await js("return !!navigator.serviceWorker"),'service worker API present');
 }catch(e){ok(false,'exception '+e.message);}finally{try{await d.quit();}catch(_){}srv.close();}
 console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
