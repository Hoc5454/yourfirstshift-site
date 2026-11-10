// Overnight fixes on the WebKit engine (iPhone Safari UA): free-run card under a restored result,
// small free X-Ray box, bigger tap area, :has() support. Usage: xvfb-run -a node overnight_webkit.js ../app.html  (WebKitWebDriver on :4444)
const http=require('http');const fs=require('fs');const path=require('path');
const {Builder}=require(process.env.SEL||'selenium-webdriver');const F=require('./pro_handoff_fixtures.js');
const PORT=18779,ORIGIN='http://127.0.0.1:'+PORT;
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8').split("https://yourfirstshift.culpepperhunter.workers.dev").join(ORIGIN+'/w');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'[webkit] '+m);if(!c)fails++;};
const srv=http.createServer((q,s)=>{let b='';q.on('data',d=>b+=d);q.on('end',()=>{const J=o=>{s.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'});s.end(JSON.stringify(o));};
 if(q.method==='OPTIONS'){s.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST,GET'});return s.end();}
 if(q.url.startsWith('/app.html')){s.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return s.end(APP);}
 if(q.url==='/w'||q.url==='/w/')return J({content:[{type:'text',text:F.XRAY}]});if(q.url.startsWith('/w/'))return J({});s.writeHead(404);s.end();});});
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async()=>{await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const caps={browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:'/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser',args:['--automation','--user-agent='+UA]}};
 let d;try{d=await new Builder().usingServer('http://127.0.0.1:4444').withCapabilities(caps).build();}catch(e){console.log('webkit driver unavailable: '+e.message);process.exit(2);}
 const js=(s,...a)=>d.executeScript(s,...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{await d.manage().window().setRect({width:412,height:915});
  await d.get(ORIGIN+'/app.html');await wait(1500);
  ok(await js("return CSS.supports('selector(:has(p))')"),':has() supported (free X-Ray box can shrink)');
  await js('localStorage.clear();');await d.get(ORIGIN+'/app.html');await wait(1500);
  await js('yfsOpenTool(1)');await wait(400);
  await js('document.getElementById("xrayJd").value=arguments[0];document.getElementById("xrayResume").value=arguments[1];try{xrayCheck();}catch(_){}updateRunBtn();runTool();',F.JD,F.RESUME);
  await wait(3500);
  const h=await js("var b=document.getElementById('outputBox');return b?b.offsetHeight:0");
  const onlyH2=await js("var b=document.getElementById('outputBox');return !!b&&!b.querySelector('p,ul,ol,li,table,div,pre,blockquote,h3,h4')");
  ok(!onlyH2||h<240,'free X-Ray box has no big blank area (height '+h+')');
  await d.navigate().refresh();await wait(1800);await js('yfsOpenTool(1)');await wait(1200);
  const r=await js("var pw=[].slice.call(document.querySelectorAll('.paywall')).filter(function(e){return e.offsetParent});var os=document.getElementById('outputSection');function t(e){return e.getBoundingClientRect().top+scrollY}return {n:pw.length,pw:pw[0]?t(pw[0]):-1,os:os&&os.offsetParent?t(os):-1}");
  ok(r.n===1&&r.os>=0&&r.pw>r.os,'free run used + restored result: result first, card under it '+JSON.stringify(r));
  await js('yfsOpenTool(2)');await wait(700);
  const n2=await js("return [].slice.call(document.querySelectorAll('.paywall')).filter(function(e){return e.offsetParent}).length+':'+!!document.querySelector('#appContent .paywall')+':'+!!document.getElementById('yfsPwMoved')");
  ok(n2==='1:true:false','tool without a result: one card, normal spot ('+n2+')');
  const tap=await js("var a=document.querySelector('#appContent .paywall a, #yfsPwMoved a');if(!a)return 'none';a.scrollIntoView({block:'center'});var r=a.getBoundingClientRect(),x=r.left+r.width/2,u=document.elementFromPoint(x,r.top-9);return (u===a||a.contains(u))?'ok':'miss'");
  ok(tap==='ok','small "Cancel anytime" link has a bigger tap area ('+tap+')');
  const errs=await js("return (window.__yfsErrs||[]).length");
 }catch(e){ok(false,'threw: '+e.message);}
 await d.quit();srv.close();console.log(fails?fails+' FAIL':'ALL PASS');process.exit(fails?1:0);})();
