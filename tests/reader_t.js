// reader-resume: leave the app while "Reading your document…" → come back → it reconnects and finishes (one retry, after the network is back).
// Usage: node reader_t.js <app.html>   (Worker mocked; nothing real is called)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const H=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync('raw_resume.txt','utf8');
const PDF=Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{const b=await chromium.launch();
 async function setup(plan,tool=1){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const st={errs:[],extract:0,times:[],gate:null};
  p.on('pageerror',e=>st.errs.push(e.message));p.on('dialog',d=>d.dismiss());
  await ctx.route('**/*',async r=>{const u=r.request().url();
   if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
   if(/workers\.dev\/?$/.test(u)&&(r.request().headers()['x-yfs-kind']||'')==='extract'){const n=st.extract++;st.times.push(Date.now());const act=plan[n]||'ok';
     if(act==='hold')await new Promise(res=>st.gate=res);
     if(act==='abort'||act==='hold')return r.abort('failed');
     return r.fulfill({body:JSON.stringify({content:[{text:RAW}]}),contentType:'application/json'});}
   if(u.includes('workers.dev'))return r.fulfill({body:'{}',contentType:'application/json'});
   return r.abort();});
  await p.addInitScript(()=>{window.__vis='visible';window.__online=true;
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__vis});Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__vis==='hidden'});
    Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>window.__online});});
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(400);await p.evaluate(t=>yfsOpenTool(t),tool);await p.waitForTimeout(200);return {ctx,p,st};}
 const hide=p=>p.evaluate(()=>{window.__vis='hidden';document.dispatchEvent(new Event('visibilitychange'));});
 const show=p=>p.evaluate(()=>{window.__vis='visible';document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
 const zone=p=>p.evaluate(()=>{const z=document.getElementById('uploadZone');return z?z.innerText.replace(/\s+/g,' ').trim():'';});
 const upload=p=>p.setInputFiles('#fileInput',{name:'Jeffery_Resume.pdf',mimeType:'application/pdf',buffer:PDF});

 // T1 — Hunter's case in ATS X-Ray: leave while reading, read dies, come back → "Reconnecting", ONE retry after ~1.5s, success, no error
 let {ctx,p,st}=await setup(['hold','ok'],1);await upload(p);await p.waitForTimeout(400);
 ok(/Keep this screen open — about 30 seconds/.test(await zone(p)),'T1 note while reading: "Keep this screen open — about 30 seconds."');
 await hide(p);st.gate&&st.gate();await p.waitForTimeout(500);
 ok(!/couldn.t reach/i.test(await zone(p))&&st.extract===1,'T1 failure while away: no error shown, nothing retried while still away');
 const tBack=Date.now();await show(p);await p.waitForTimeout(400);
 ok(/Reconnecting/i.test(await zone(p)),'T1 on return: "Reconnecting — picking your document back up"');
 await p.waitForTimeout(2200);const z1=await zone(p);
 ok(st.extract===2&&st.times[1]-tBack>=1300,'T1 exactly one retry, ~1.5s after coming back (network has time to wake)');
 ok(/Jeffery_Resume\.pdf/.test(z1)&&!/couldn.t|Reconnecting/i.test(z1),'T1 document read successfully, no error: '+z1.slice(0,60));
 ok(await p.evaluate(()=>localStorage.getItem('yfs_usage')||'0')==='0','T1 no free run used');ok(st.errs.length===0,'T1 no page errors');await ctx.close();

 // T2 — back but still offline → waits for the connection, then retries
 ({ctx,p,st}=await setup(['hold','ok'],1));await upload(p);await p.waitForTimeout(300);await hide(p);st.gate&&st.gate();await p.waitForTimeout(300);
 await p.evaluate(()=>{window.__online=false;});await show(p);await p.waitForTimeout(2500);
 ok(st.extract===1&&/Reconnecting/i.test(await zone(p)),'T2 still offline → waits (no wasted retry), shows Reconnecting');
 await p.evaluate(()=>{window.__online=true;window.dispatchEvent(new Event('online'));});await p.waitForTimeout(2200);
 ok(st.extract===2&&/Jeffery_Resume\.pdf/.test(await zone(p)),'T2 connection back → one retry → success');await ctx.close();

 // T3 — retry also fails → the error shows once, no loop
 ({ctx,p,st}=await setup(['hold','abort','ok'],1));await upload(p);await p.waitForTimeout(300);await hide(p);st.gate&&st.gate();await p.waitForTimeout(300);await show(p);await p.waitForTimeout(3500);
 ok(st.extract===2&&/couldn.t reach our file reader/i.test(await zone(p)),'T3 retry also failed → honest error once, then stops (no loop)');await ctx.close();

 // T4 — failure while on screen the whole time → error right away (unchanged)
 ({ctx,p,st}=await setup(['abort'],1));await upload(p);await p.waitForTimeout(800);
 ok(st.extract===1&&/couldn.t reach our file reader/i.test(await zone(p)),'T4 visible failure → error right away, no auto-retry (unchanged)');await ctx.close();

 // T5 — Samsung "freeze" (tab paused without a visibility change) counts as leaving
 ({ctx,p,st}=await setup(['hold','ok'],3));await upload(p);await p.waitForTimeout(300);
 await p.evaluate(()=>document.dispatchEvent(new Event('freeze')));st.gate&&st.gate();await p.waitForTimeout(300);
 await p.evaluate(()=>document.dispatchEvent(new Event('resume')));await p.waitForTimeout(2600);
 ok(st.extract===2&&/Jeffery_Resume\.pdf/.test(await zone(p)),'T5 freeze → resume → one retry → success (Cover Letter tool)');await ctx.close();

 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
