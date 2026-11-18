// Clocked In per diem tap target on the WebKit engine (WebKitGTK via WebKitWebDriver, iPhone UA, 390px). Only the checkbox and "Per diem" toggle it. Usage: xvfb-run node otj_pdtap_webkit.js .. [shotDir]
const http=require('http'),fs=require('fs'),path=require('path');const {Builder,Origin}=require(process.env.SEL||'selenium-webdriver');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18878;const O='http://127.0.0.1:'+PORT;
const T={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'[webkit] '+m);if(!c)fails++;};
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async()=>{await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const d=await new Builder().usingServer('http://127.0.0.1:4444').withCapabilities({browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:'/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser',args:['--automation','--user-agent='+UA]}}).build();
 const js=(s,...a)=>d.executeScript(s,...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const tap=async(x,y)=>{await d.actions({async:true}).move({origin:Origin.VIEWPORT,x:Math.round(x),y:Math.round(y)}).click().perform();await wait(250);};
 try{await d.manage().window().setRect({width:390,height:844});await d.get(O+'/job/');await wait(1200);
  // Made-up data: one job with $75 per diem, hours on Monday of this week.
  await js("function ymd(x){return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}var n=new Date();n.setHours(12,0,0,0);var m=new Date(n);m.setDate(n.getDate()-((n.getDay()+6)%7));var d0=ymd(m);"+
   "var s={app:'yfs-on-the-job',v:1,created:Date.now(),settings:{rate:28,otRate:'',period:'weekly',anchor:d0,weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false,perDiemTax:'yes'},labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,ot:null,perDiem:75}],codes:[],entries:[{id:'e1',kind:'work',date:d0,start:m.getTime(),manualHours:10,breakMin:0,jobId:'j1',codeId:'',splits:[],note:''}],pto:{buckets:[]},clock:null,log:[],lastBackup:Date.now(),ui:{a2hsX:1}};"+
   "localStorage.setItem('yfs_otj_v1',JSON.stringify(s));");
  await d.navigate().refresh();await wait(1000);await js("document.querySelector('nav.tabs [data-v=week]').click()");await wait(400);
  const css=await js("for(const sh of document.styleSheets){for(const r of sh.cssRules){if(r.selectorText==='.pdchk')return r.cssText;}}return '';");
  ok(/width:\s*max-content/.test(css)&&/margin:\s*-6px 0(px)? 2px auto/.test(css)&&!/inline-flex/.test(css),'.pdchk rule is the narrow, right-pushed one');
  for(const idx of [0,6]){const nm=idx===0?'Monday (has hours, ticked)':'Sunday (no hours, unticked)';
   const G="var l=document.querySelectorAll('#sheet .pdchk')["+idx+"];l.scrollIntoView({block:'center'});var r=l.getBoundingClientRect(),cb=l.querySelector('input').getBoundingClientRect(),sp=l.querySelector('span').getBoundingClientRect(),day=l.closest('.tsday'),row=day.getBoundingClientRect();return {l:r.left,w:r.width,h:r.height,top:r.top,bot:r.bottom,cy:r.top+r.height/2,cbX:cb.left+cb.width/2,cbY:cb.top+cb.height/2,spX:sp.left+sp.width/2,spY:sp.top+sp.height/2,inL:row.left,rowB:row.bottom};";
   const chk="return document.querySelectorAll('#sheet [data-pdday]')["+idx+"].checked;";
   const closeM="var m=document.getElementById('otjModal');if(m){var c=m.querySelector('[data-close]');if(c)c.click();}";
   let g=await js(G);await wait(150);g=await js(G);const was=await js(chk);
   ok(g.w<=140&&g.h>=44,nm+': control is small ('+Math.round(g.w)+'px wide) and 44px tall');
   let moved=[];for(const [x,y] of [[g.inL+12,g.top+g.h*0.8],[(g.inL+g.l)/2,g.bot-2],[g.l-10,g.bot-2],[g.inL+12,Math.min(g.rowB-2,g.bot+3)]]){await tap(x,y);if(await js(chk)!==was)moved.push(Math.round(x)+','+Math.round(y));await js(closeM);await wait(150);}
   ok(!moved.length,nm+': taps in the lower empty area do NOT change per diem '+moved.join(' '));
   g=await js(G);await wait(100);moved=[];for(const x of [g.inL+4,g.inL+40,(g.inL+g.l)/2,g.l-10]){await tap(x,g.cy);if(await js(chk)!==was)moved.push(Math.round(x));await js(closeM);await wait(150);}
   ok(!moved.length,nm+': taps on the left/empty part do NOT change per diem '+moved.join(' '));
   g=await js(G);await wait(100);await tap(g.cbX,g.cbY);ok(await js(chk)===!was,nm+': tapping the checkbox toggles it');
   g=await js(G);await wait(100);await tap(g.spX,g.spY);ok(await js(chk)===was,nm+': tapping "Per diem" toggles it back');}
  if(SHOTS)fs.writeFileSync(path.join(SHOTS,'otj-pdtap-webkit.png'),await d.takeScreenshot(),'base64');
  ok(await js("return document.documentElement.scrollWidth-innerWidth<=1"),'Timesheet fits the screen');
 }catch(e){ok(false,'crashed: '+e.message);}finally{await d.quit();srv.close();}
 console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
