// Clocked In storage safety + per diem on the WebKit engine (WebKitGTK via WebKitWebDriver, iPhone UA, 412px). Usage: xvfb-run node otj_storage_webkit.js .. [shotDir]
const http=require('http'),fs=require('fs'),path=require('path');const {Builder,By}=require(process.env.SEL||'selenium-webdriver');
const ROOT=path.resolve(process.argv[2]||'..');const SHOTS=process.argv[3]||'';const PORT=18887;const O='http://127.0.0.1:'+PORT;
const T={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'[webkit] '+m);if(!c)fails++;};
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async()=>{await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const d=await new Builder().usingServer('http://127.0.0.1:4444').withCapabilities({browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:'/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser',args:['--automation','--user-agent='+UA]}}).build();
 const js=(s,...a)=>d.executeScript(s,...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));const shot=async n=>{if(SHOTS)fs.writeFileSync(path.join(SHOTS,'otj-storage-webkit-'+n+'.png'),await d.takeScreenshot(),'base64');};
 const BLOCK="This browser isn't saving your hours (Private Browsing or blocked storage). Use regular Safari/Chrome.";
 const blockJs="window.__si=window.__si||Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError');};";
 const back="document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));";
 const toast="var t=document.querySelector('.toast');return t?[t.firstChild.textContent,t.getAttribute('data-bad')||'']:['',''];";
 try{await d.manage().window().setRect({width:412,height:915});await d.get(O+'/job/');await wait(1200);
  ok(await js("return typeof window.OTJ==='object'&&!!OTJ.tax()&&OTJ.storeTest()===true&&!document.getElementById('storeBad')"),'loads; storage self-test passes; no banner');
  await js(blockJs);ok(await js("return OTJ.storeTest()===false"),'self-test reports blocked storage when writes throw');
  await js("document.getElementById('sJob').value='Gulf Coast Grocers';document.getElementById('sRate').value='28';document.querySelector('[data-a=saveSetup]').click();");await wait(400);
  let t=await js(toast);ok(/^Not saved\./.test(t[0])&&t[1]==='1'&&await js("return !!document.getElementById('storeBad')&&!!document.querySelector('[data-a=start]')&&localStorage.getItem('yfs_otj_v1')===null"),'blocked: setup shows the red error and banner, not a success message; nothing written');
  await js("document.querySelector('[data-a=start]').click()");await wait(1200);await js("document.querySelector('[data-a=stop]').click()");await wait(400);t=await js(toast);
  ok(t[1]==='1'&&!/Saved/.test(t[0])&&await js("return OTJ.state().entries.length===1"),'blocked: clock in/out keeps the shift on screen and never says Saved');
  await js(back);await wait(300);ok(await js("return OTJ.state().entries.length===1&&!!OTJ.state().settings"),'blocked: leaving and coming back does not wipe the shift (the WebKit repro)');await shot('1-blocked');
  await js("Storage.prototype.setItem=window.__si;document.getElementById('storeRetry').click();");await wait(400);t=await js(toast);
  ok(t[0]==='Saved ✓'&&await js("return !document.getElementById('storeBad')&&JSON.parse(localStorage.getItem('yfs_otj_v1')).entries.length===1"),'storage back: Try saving again → "Saved ✓", read back from storage');
  await d.navigate().refresh();await wait(1000);ok(await js("return OTJ.state().entries.length===1"),'reload keeps the shift');
  // undo last change
  await js("document.querySelector('nav.tabs [data-v=more]').click()");await wait(300);ok(await js("return /Private Browsing does not keep your hours/.test(document.getElementById('iosNotes').innerText)"),'More: iPhone notes');
  // per diem
  await js("document.querySelector('[data-a=perdiem]').click()");await wait(300);await js("document.getElementById('pd_0').value='75';document.getElementById('pdSave').click();");await wait(400);
  ok(await js("return !!document.querySelector('[data-a=undolast]')&&OTJ.state().jobs[0].perDiem===75"),'per diem saved; More now offers Undo last change');
  await js("var s=OTJ.state();var d0=new Date();d0.setHours(6,0,0,0);s.entries=[{id:'w1',kind:'work',date:OTJ.periodRange(new Date().toISOString().slice(0,10))&&(d0.getFullYear()+'-'+String(d0.getMonth()+1).padStart(2,'0')+'-'+String(d0.getDate()).padStart(2,'0')),start:d0.getTime(),manualHours:4,breakMin:0,jobId:s.jobs[0].id,codeId:'',splits:[],note:''}];localStorage.setItem('yfs_otj_v1',JSON.stringify(s));OTJ.reload();document.querySelector('nav.tabs [data-v=today]').click();");await wait(400);
  const vis="function v(id){var e=document.getElementById(id);if(!e)return false;var r=e.getBoundingClientRect();return r.width>100&&r.height>20&&r.left>=0&&r.right<=innerWidth+0.5;}";
  ok(await js(vis+"return v('pdToday')&&document.getElementById('pdTodayAmt').textContent==='$75.00'&&document.getElementById('earnToday').textContent==='$187.00'"),'per diem on Today (iPhone UA): Per diem today $75.00, Earned today $187.00');await shot('2-pd-today');
  await js("document.querySelector('nav.tabs [data-v=week]').click()");await wait(400);ok(await js(vis+"return v('wkPd')&&document.getElementById('wkPdAmt').textContent==='$75.00'&&/\\$75\\.00 per diem/.test(document.getElementById('sheet').innerText)"),'per diem on the Timesheet (iPhone UA)');await shot('3-pd-week');
  // damaged data
  const BAD='{"app":"yfs-on-the-job","entries":[{"id';await js("localStorage.removeItem('yfs_otj_v1_last');localStorage.setItem('yfs_otj_v1',arguments[0]);",BAD);await d.navigate().refresh();await wait(1000);
  ok(await js("var k=Object.keys(localStorage).filter(function(x){return x.indexOf('yfs_otj_v1_raw_')===0;});return k.length===1&&localStorage.getItem(k[0])===arguments[0]&&localStorage.getItem('yfs_otj_v1')===arguments[0]&&/couldn't be read/.test(document.getElementById('storeNote').innerText)",BAD),'damaged data: raw copy kept, original untouched, the app says so');
  // newer data
  await js("localStorage.setItem('yfs_otj_v1',JSON.stringify({app:'yfs-on-the-job',v:2,settings:null,entries:[]}));");await d.navigate().refresh();await wait(1000);
  ok(await js("return OTJ.store().ro&&/Update the app/.test(document.getElementById('storeBad').innerText)"),'data from a newer version: read-only with "Update the app"');
 }catch(e){ok(false,'exception '+e.message);}finally{try{await d.quit();}catch(_){}srv.close();}
 console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
