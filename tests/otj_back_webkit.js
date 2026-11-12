// Clocked In back button on the WebKit engine (WebKitGTK via WebKitWebDriver, iPhone UA, 412px). Usage: xvfb-run node otj_back_webkit.js .. [shotDir]
const http=require('http'),fs=require('fs'),path=require('path');const {Builder,By}=require(process.env.SEL||'selenium-webdriver');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18884;const O='http://127.0.0.1:'+PORT;
const T={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'[webkit] '+m);if(!c)fails++;};
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async()=>{await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const d=await new Builder().usingServer('http://127.0.0.1:4444').withCapabilities({browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:'/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser',args:['--automation','--user-agent='+UA]}}).build();
 const js=(s,...a)=>d.executeScript(s,...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));const shot=async n=>{if(SHOTS)fs.writeFileSync(path.join(SHOTS,'otj-webkit-'+n+'.png'),await d.takeScreenshot(),'base64');};
 const at="return {view:(document.querySelector('nav.tabs [aria-current=page]')||{dataset:{}}).dataset.v||'',modal:!!document.getElementById('otjModal'),h3:(document.querySelector('#otjModal h3')||{}).textContent||'',setup:!!document.getElementById('sRate'),path:location.pathname,mark:window.__mark||0,depth:(history.state&&history.state.otj)||0};";
 const tap=async sel=>{const el=await d.findElement(By.css(sel));await js('arguments[0].scrollIntoView({block:"center"})',el);await wait(80);await el.click();};
 const bk=async()=>{await d.navigate().back();await wait(400);};
 try{await d.manage().window().setRect({width:412,height:915});await d.get('about:blank');await d.get(O+'/job/');await wait(1200);
  await js("document.getElementById('sJob').value='Gulf Coast Grocers';document.getElementById('sRate').value='28';");await tap('[data-a=saveSetup]');await wait(500);await js("window.__mark=1");
  let a=await js(at);ok(a.view==='today'&&a.depth===0,'Clock after setup: no history step');
  await tap('nav.tabs [data-v=week]');await wait(300);await tap('#sheet .tsday.today .tsd');await wait(300);a=await js(at);const title=a.h3;ok(a.modal&&a.path==='/job/','day sheet open');
  await tap('#dAdd');await wait(300);await bk();a=await js(at);ok(a.modal&&a.h3===title&&a.mark===1,'back from Add hours: the same day sheet is back');
  await bk();a=await js(at);ok(!a.modal&&a.view==='week'&&a.mark===1,'back: day sheet closes, still Timesheet');
  await tap('nav.tabs [data-v=pto]');await wait(300);await bk();a=await js(at);const v1=a.view;await bk();a=await js(at);ok(v1==='week'&&a.view==='today'&&a.mark===1,'PTO → back → Timesheet → back → Clock');
  await tap('nav.tabs [data-v=more]');await wait(300);await tap('[data-a=setup]');await wait(300);await bk();a=await js(at);ok(!a.setup&&a.view==='more','back on Edit pay setup: More');
  await tap('nav.tabs [data-v=week]');await wait(300);await tap('#sheet .tsday.today .tsd');await wait(300);await tap('#otjModal .x');await wait(400);await bk();a=await js(at);ok(a.view==='more'&&!a.modal,'X leaves no stuck step (back → previous tab, sheet does not reopen)');
  await bk();a=await js(at);ok(a.view==='today','back → Clock');
  await bk();const url=await d.getCurrentUrl();ok(!/\/job\//.test(url),'back on Clock leaves the app ('+url+')');
 }catch(e){ok(false,'exception '+e.message);}finally{try{await d.quit();}catch(_){}srv.close();}
 console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
