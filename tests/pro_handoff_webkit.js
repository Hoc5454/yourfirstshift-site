// pro-handoff on the WebKit engine (WebKitGTK via WebKitWebDriver, iPhone-size window + iPhone Safari UA).
// Real full-page navigations: app → mocked Stripe page → back to app (localStorage/sessionStorage survive), plus Back-button (bfcache) path.
// Local mock server stands in for the Worker + Stripe; the app copy only has YFS_API pointed at it (test harness only).
// Usage: xvfb-run -a node pro_handoff_webkit.js ../app.html [shotDir]   (needs selenium-webdriver + WebKitWebDriver)
const http=require('http');const fs=require('fs');const path=require('path');
const {Builder,By,until}=require(process.env.SEL||'selenium-webdriver');
const F=require('./pro_handoff_fixtures.js');
const PORT=18777,ORIGIN='http://127.0.0.1:'+PORT;
const SRC=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const SHOTS=process.argv[3]||'';
const APP=SRC.split("https://yourfirstshift.culpepperhunter.workers.dev").join(ORIGIN+'/w');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'[webkit] '+m);if(!c)fails++;};
const log={ai:[],verify:0};
function tok(c){return Buffer.from(JSON.stringify(c)).toString('base64').replace(/=+$/,'')+'.sig';}
const srv=http.createServer((q,s)=>{let b='';q.on('data',d=>b+=d);q.on('end',()=>{const u=q.url;const J=(o,st)=>{s.writeHead(st||200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'});s.end(JSON.stringify(o));};
  if(q.method==='OPTIONS'){s.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST,GET'});return s.end();}
  if(u.startsWith('/app.html')){s.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return s.end(APP);}
  if(u.startsWith('/stripe')){s.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return s.end(F.STRIPE.replace('http://yfs.local',ORIGIN));}
  if(u==='/w/api/pro/checkout')return J({url:ORIGIN+'/stripe/c/pay/cs_test_123'});
  if(u==='/w/api/pro/verify'){log.verify++;return J({token:tok({sub:'cus_t',exp:Math.floor(Date.now()/1000)+35*86400})});}
  if(u==='/w'||u==='/w/'){let p='';try{p=JSON.parse(b).messages[0].content;}catch(_){}log.ai.push(p);
    return J({content:[{type:'text',text:/Upgrade this person/.test(p)?F.UPG:/analyzing a job application/.test(p)?F.XRAY:/cover letter/i.test(p)?F.CL:F.IV}]});}
  if(u.startsWith('/w/'))return J({});s.writeHead(404);s.end();});});
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async()=>{await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const caps={browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:'/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser',args:['--automation','--user-agent='+UA]}};
 let d;try{d=await new Builder().usingServer('http://127.0.0.1:4444').withCapabilities(caps).build();}catch(e){console.log('webkit driver unavailable: '+e.message);process.exit(2);}
 const js=(s,...a)=>d.executeScript(s,...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const shot=async n=>{if(SHOTS){fs.writeFileSync(path.join(SHOTS,'webkit-'+n+'.png'),await d.takeScreenshot(),'base64');}};
 const waitFor=async(fn,ms)=>{const t=Date.now();while(Date.now()-t<(ms||15000)){try{if(await js('return ('+fn+')()'))return true;}catch(_){}await wait(200);}return false;};
 try{
  await d.manage().window().setRect({width:412,height:915});
  const ver=await js('return navigator.userAgent');ok(/AppleWebKit/.test(ver),'engine = WebKit ('+(await js("return (navigator.userAgent.match(/AppleWebKit\\/[\\d.]+/)||[''])[0]"))+')');
  await d.get(ORIGIN+'/app.html');await wait(1500);
  ok(await js("return typeof window.yfsProHandoff==='function'&&typeof window.yfsResumeFields==='function'"),'handoff script parses and runs on WebKit');
  // free X-Ray run
  await js('yfsOpenTool(1)');await wait(400);
  await js('document.getElementById("xrayJd").value=arguments[0];document.getElementById("xrayResume").value=arguments[1];try{xrayCheck();}catch(_){}updateRunBtn();',F.JD,F.RESUME);
  await js('runTool()');ok(await waitFor("()=>!!document.querySelector('#yfsTease .rb-page')"),'free teaser painted');
  ok(await js("return !!localStorage.getItem('yfs_handoff')"),'handoff saved in localStorage');await shot('2-teaser');
  // tap Unlock → real navigation to the mocked Stripe page
  await js('yfsOpenCheckout()');ok(await waitFor("()=>/\\/stripe\\//.test(location.href)"),'navigated to Stripe (same tab)');await shot('3-stripe-test');
  // Back without paying (bfcache / back-forward): still free, nothing broken
  await d.navigate().back();await wait(1500);
  const back=await js("return {u:location.pathname,pro:localStorage.getItem('yfs_pro'),busy:document.body.classList.contains('yfs-co-busy'),bn:!!document.getElementById('yfsProBanner'),h:!!localStorage.getItem('yfs_handoff')}");
  ok(back.u==='/app.html'&&!back.pro&&!back.busy&&!back.bn&&back.h,'Back from Stripe: free, spinner cleared, handoff kept '+JSON.stringify(back));
  // pay → success return
  await js('yfsOpenCheckout()');await waitFor("()=>/\\/stripe\\//.test(location.href)");
  await d.findElement(By.id('pay')).click();
  ok(await waitFor("()=>!!document.querySelector('#yfsProBanner .pb-h')&&!document.querySelector('#yfsProBanner .pb-busy')",25000),'paid return → Pro banner, job match finished');
  await wait(700);
  const r=await js("var pg=document.getElementById('rbPage');var v=function(f){var e=pg.querySelector('[data-f='+f+']');return e?e.innerText.trim():'';};var b=document.getElementById('yfsProBanner');return {tool:activeTool,url:location.search,banner:b.innerText,top:b.getBoundingClientRect().top,name:v('name'),sum:v('summary'),skills:v('skills'),exp:v('experience'),ph:/Your Name|City, ST|\\+ Add city/.test(pg.innerText),edit:pg.querySelector('[data-f=summary]').getAttribute('contenteditable'),ty:!!document.getElementById('yfsThankYou'),act:(yfsVaultList().find(function(x){return x.id===yfsVaultActive();})||{}).name}");
  ok(log.verify===1&&r.url===''&&r.tool===5,'verified once, URL cleaned, in the live editor');
  ok(/You're Pro\. Here's your full resume\./.test(r.banner)&&/Tap any part to edit, then Download PDF\./.test(r.banner)&&!r.ty,'exact banner, no popup');
  ok(r.top>=0&&r.top<400,'scrolled to the resume top ('+Math.round(r.top)+'px)');
  ok(r.name==='Jordan Reyes'&&!r.ph&&r.edit==='true','same resume, no blank template, tap-to-edit');
  ok(/cycle counts/i.test(r.sum)&&!/30%/.test(r.sum)&&/^Cycle counts/i.test(r.skills)&&!/SAP|Manhattan/.test(r.skills)&&!/Sunrise/.test(r.exp)&&/Bayside/.test(r.exp),'upgraded with only real facts');
  ok(/· Pro/.test(r.act||''),'Pro resume is ACTIVE ('+r.act+')');
  await shot('4-pro-landing');
  // reload (iOS often reloads a tab): stays on Pro, no re-run, builder still filled
  const n0=log.ai.length;await d.navigate().refresh();await wait(1500);await js('yfsOpenTool(5)');await wait(500);
  const rl=await js("return {n:(document.querySelector('#rbPage [data-f=name]')||{}).innerText,pro:localStorage.getItem('yfs_pro')}");ok(rl.pro==='1'&&rl.n==='Jordan Reyes'&&log.ai.length===n0,'reload keeps Pro + resume, no extra AI run');
  await js('yfsOpenTool(3)');await wait(500);
  const c=await js("var u=document.getElementById('uploadZone');return {u:(document.getElementById('yfsUsing')||{}).innerText||'',up:u?getComputedStyle(u).display:'none'}");
  ok(/Using: .*· Pro/.test(c.u)&&c.up==='none','Cover Letter: Using chip, no upload ask');await shot('6-cover-letter');
  await js('yfsOpenTool(4)');await wait(400);ok(/Using:/.test(await js("return (document.getElementById('yfsUsing')||{}).innerText||''")),'Interview: Using chip');await shot('7-interview');
 }catch(e){ok(false,'exception '+e.message);}
 finally{try{await d.quit();}catch(_){}srv.close();}
 console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
