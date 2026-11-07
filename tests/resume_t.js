// resume-fix (app): reproduces Hunter's Samsung failure — leave the app mid-result, come back.
// Mocked Worker; nothing real is called. Usage: node resume_t.js <app.html>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');const RES=fs.readFileSync('raw_resume.txt','utf8');
const API='https://yourfirstshift.culpepperhunter.workers.dev';
const FULL='## AI MATCH ESTIMATE: 64/100 (vs this job posting)\n## VERDICT: Solid fit.\n\n## ✅ KEYWORD HITS (2 found)\n- Motor grader\n- Dozer\n';
const sse=(txt,stop)=>{const parts=txt.match(/[\s\S]{1,40}/g)||[];return parts.map(t=>'event: content_block_delta\ndata: '+JSON.stringify({type:'content_block_delta',index:0,delta:{type:'text_delta',text:t}})+'\n\n').join('')+(stop?'event: message_stop\ndata: {"type":"message_stop"}\n\n':'');};
let fails=0;const ok=(c,n)=>{console.log((c?'PASS ':'FAIL ')+n);if(!c)fails++;};
(async()=>{const b=await chromium.launch();
 async function open(o){const ctx=await b.newContext({viewport:{width:390,height:844}});const log={posts:[],gets:[],errs:[]};const errs=[];let n=0;
  await ctx.route('**/*',async r=>{const u=r.request().url(),m=r.request().method();
   if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
   if(u.startsWith(API)){if(m==='OPTIONS')return r.fulfill({status:204});
     if((u===API||u===API+'/')&&m==='POST'){const h=r.request().headers();log.posts.push({run:h['x-yfs-run']||'',dev:h['x-yfs-dev']||'',body:r.request().postData()});const step=(o.posts||[])[n++]||{kind:'full'};
       if(step.wait)await step.wait();
       if(step.kind==='abort')return r.abort('failed');
       if(step.kind==='5xx')return r.fulfill({status:503,body:'{"error":"x"}',contentType:'application/json'});
       if(step.kind==='402')return r.fulfill({status:402,body:'{"error":"pro_required"}',contentType:'application/json'});
       return r.fulfill({status:200,body:sse(step.kind==='cut'?FULL.slice(0,60):FULL,step.kind!=='cut'),contentType:'text/event-stream'});}
     if(u.includes('/api/run/')){log.gets.push(u);return o.cache?r.fulfill({body:JSON.stringify({ok:true,done:true,text:FULL}),contentType:'application/json'}):r.fulfill({status:404,body:'{"error":"not_found"}',contentType:'application/json'});}
     if(u.endsWith('/api/metrics/client_err')){log.errs.push(JSON.parse(r.request().postData()||'{}'));return r.fulfill({status:204});}
     return r.fulfill({body:'{}',contentType:'application/json'});}
   if(u.startsWith('http://yfs.local/'))return r.fulfill({status:404,body:''});return r.abort();});
  await ctx.addInitScript(([raw,pro])=>{localStorage.setItem('yfs_vault',JSON.stringify([{id:'v1',name:'Jeff',text:raw,look:'Bold Trades',ts:Date.now()}]));localStorage.setItem('yfs_vault_active','v1');localStorage.setItem('yfs_resume',raw);if(pro)localStorage.setItem('yfs_pro','1');
    window.__vis='visible';Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__vis});Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__vis==='hidden'});},[RES,!!o.pro]);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>d.dismiss());
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(600);await p.evaluate(()=>yfsOpenTool(1));await p.waitForTimeout(200);
  await p.fill('#xrayJd','Heavy Equipment Operator — Lee County. Must run dozer and motor grader, read grade stakes.');await p.evaluate(()=>{try{updateRunBtn()}catch(_){}});
  return {ctx,p,log,errs};}
 const setVis=(p,v)=>p.evaluate(v=>{window.__vis=v;document.dispatchEvent(new Event('visibilitychange'));},v);
 const gate=()=>{let open;const pr=new Promise(r=>open=r);return {wait:()=>pr,open};};
 const st=p=>p.evaluate(()=>({err:getComputedStyle(document.getElementById('errorBox')).display!=='none'?document.getElementById('errorBox').innerText:'',
   writing:!!document.querySelector('#outputBox .yfs-stream-note'),out:document.getElementById('outputBox').innerText,usage:localStorage.getItem('yfs_usage')||'0',busy:!!window.yfsRunBusy,retryBtn:!!document.querySelector('#errorBox .yfs-retry-btn')}));

 // T1 — Hunter's exact case: free user leaves the app mid-result, stream dies; comes back → finished result appears, free run intact until it's delivered
 let g1=gate();let {ctx,p,log,errs}=await open({posts:[{kind:'cut',wait:g1.wait}],cache:true});
 const run1=p.evaluate(()=>runTool());await p.waitForTimeout(300);await setVis(p,'hidden');g1.open();await run1;await p.waitForTimeout(300);
 let s=await st(p);
 ok(/interrupted when you left the app/.test(s.err)&&/Picking it back up/.test(s.err),'T1 honest message while away: "interrupted… picking it back up"');
 ok(!s.writing,'T1 no stuck "Writing your result…"');ok(s.usage==='0','T1 free run NOT used by the interruption');
 ok(log.errs.length===1&&log.errs[0].t==='interrupted'&&!JSON.stringify(log.errs[0]).includes('Jeff'),'T1 error logged as type "interrupted" only (no personal data)');
 ok(log.posts.length===1,'T1 nothing re-sent while the app is still in the background');
 await setVis(p,'visible');await p.waitForTimeout(1500);s=await st(p);
 ok(log.gets.length===1&&log.gets[0].includes('/api/run/'+log.posts[0].run)&&log.gets[0].includes('d='+log.posts[0].dev),'T1 on return: asks the server for the finished result of the SAME run + device');
 ok(log.posts.length===1,'T1 cache hit → no new AI request (no extra cost)');
 ok(!s.err&&/solid fit/i.test(s.out)&&!s.writing,'T1 finished result shown, no error');ok(s.usage==='1','T1 free run counted only once the result was delivered');
 ok(!s.busy&&errs.length===0,'T1 clean state, no page errors');await ctx.close();

 // T2 — no cached result → re-sends the SAME run (same id + same request) once
 g1=gate();({ctx,p,log,errs}=await open({posts:[{kind:'cut',wait:g1.wait},{kind:'full'}],cache:false}));
 const r2=p.evaluate(()=>runTool());await p.waitForTimeout(300);await setVis(p,'hidden');g1.open();await r2;await p.waitForTimeout(200);
 await setVis(p,'visible');await p.waitForTimeout(1800);s=await st(p);
 ok(log.posts.length===2&&log.posts[1].run===log.posts[0].run&&log.posts[1].body===log.posts[0].body,'T2 resume re-sends the SAME run id + identical request (server won\'t count a new free run)');
 ok(!s.err&&/solid fit/i.test(s.out)&&s.usage==='1','T2 result delivered, one free run used');ok(errs.length===0,'T2 no page errors');await ctx.close();

 // T3 — only ONE automatic resume: if that also gets interrupted → Try again button, no loop
 g1=gate();let g2=gate();({ctx,p,log}=await open({posts:[{kind:'cut',wait:g1.wait},{kind:'cut',wait:g2.wait}],cache:false}));
 const r3=p.evaluate(()=>runTool());await p.waitForTimeout(300);await setVis(p,'hidden');g1.open();await r3;await p.waitForTimeout(200);
 await setVis(p,'visible');await p.waitForTimeout(500);await setVis(p,'hidden');g2.open();await p.waitForTimeout(500);await setVis(p,'visible');await p.waitForTimeout(1500);s=await st(p);
 ok(log.posts.length===2,'T3 exactly one automatic resume (no retry loop)');ok(s.retryBtn&&/Tap Try again\. It won’t use your free run\./.test(s.err),'T3 then a clear "Try again" button');
 await p.click('#errorBox .yfs-retry-btn');await p.waitForTimeout(1200);ok(log.posts.length===3&&log.posts[2].run===log.posts[0].run,'T3 manual Try again reuses the same run');await ctx.close();

 // T4 — connection drops while the app is on screen → "Lost connection" + Try again (no auto loop)
 ({ctx,p,log}=await open({posts:[{kind:'abort'},{kind:'full'}]}));await p.evaluate(()=>runTool());await p.waitForTimeout(800);s=await st(p);
 ok(/Lost connection/.test(s.err)&&s.retryBtn&&log.posts.length===1,'T4 visible network drop → "Lost connection", Try again, no auto-retry');
 ok(log.errs.some(x=>x.t==='network'),'T4 logged as "network"');
 await p.click('#errorBox .yfs-retry-btn');await p.waitForTimeout(1200);s=await st(p);ok(/solid fit/i.test(s.out)&&log.posts[1].run===log.posts[0].run,'T4 Try again works with the same run');await ctx.close();

 // T5 — server error → its own message; T6 cut-off while visible → "cut off" + partial marked incomplete
 ({ctx,p,log}=await open({posts:[{kind:'5xx'}]}));await p.evaluate(()=>runTool());await p.waitForTimeout(600);s=await st(p);
 ok(/server had a hiccup/.test(s.err)&&s.retryBtn&&log.errs.some(x=>x.t==='http_5xx'),'T5 5xx → "server had a hiccup" + Try again');await ctx.close();
 ({ctx,p,log}=await open({posts:[{kind:'cut'}]}));await p.evaluate(()=>runTool());await p.waitForTimeout(800);s=await st(p);
 ok(/cut off before it finished/.test(s.err)&&/Incomplete/.test(s.out)&&!s.writing&&s.usage==='0','T6 visible cut-off → partial clearly marked "Incomplete", free run not used');await ctx.close();

 // T7 — in-flight guard: double tap = one request; T8 Pro: each fresh run gets a new id; T9 402 still shows Upgrade
 g1=gate();({ctx,p,log}=await open({posts:[{kind:'full',wait:g1.wait}],pro:true}));
 const r7=p.evaluate(()=>{runTool();runTool();return runTool();});await p.waitForTimeout(300);g1.open();await r7;await p.waitForTimeout(600);
 ok(log.posts.length===1,'T7 triple tap while running → one request');
 await p.evaluate(()=>runTool());await p.waitForTimeout(800);ok(log.posts.length===2&&log.posts[1].run!==log.posts[0].run,'T8 a new run (after success) gets a new id');await ctx.close();
 ({ctx,p,log}=await open({posts:[{kind:'402'}]}));await p.evaluate(()=>runTool());await p.waitForTimeout(600);s=await st(p);
 ok(!s.err&&!s.busy&&s.usage==='1'&&log.errs.length===0,'T9 402 (free run already used) still goes to the existing upgrade path: no error box, not logged as an error');await ctx.close();
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
