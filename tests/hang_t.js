// hang-guard: a request that never answers must not leave "Working on it" / "Reading…" up forever while the screen is visible.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');const RES=fs.readFileSync('raw_resume.txt','utf8');
const API='https://yourfirstshift.culpepperhunter.workers.dev';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
async function ctxFor(b,pro,hangRun,hangExtract,state){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await ctx.route('**/*',async r=>{const u=r.request().url();const h=r.request().headers();
  if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
  if(u===API||u===API+'/'){const ex=(h['x-yfs-kind']==='extract');state.calls.push(ex?'extract':'run');
    if((ex&&hangExtract)||(!ex&&hangRun))return; /* never answer */
    return r.fulfill({body:JSON.stringify({content:[{type:'text',text:ex?RES:'Dear Hiring Manager,\n\nTest.\n\nJordan'}]}),contentType:'application/json'});}
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});
  if(u.startsWith('http://yfs.local/'))return r.fulfill({status:404,body:''});
  return r.abort();});
 await ctx.addInitScript(([raw,pro])=>{if(raw){localStorage.setItem('yfs_vault',JSON.stringify([{id:'v1',name:'Jordan Resume',text:raw,look:'Bold Trades',ts:Date.now()}]));localStorage.setItem('yfs_vault_active','v1');localStorage.setItem('yfs_resume',raw);}if(pro)localStorage.setItem('yfs_pro','1');},[pro?RES:'',pro]);
 return ctx;}
(async()=>{const b=await chromium.launch();
 // T1: AI run never answers → after 45s a clear error with Try again, button usable, nothing burned
 {const st={calls:[]};const ctx=await ctxFor(b,true,true,false,st);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install();await p.goto('http://yfs.local/app.html');await p.clock.runFor(1500);
  await p.evaluate(()=>yfsOpenTool(3));await p.clock.runFor(300);await p.fill('#userInput','Demo County Public Works, Heavy Equipment Operator.');await p.evaluate(()=>{try{updateRunBtn()}catch(_){}});
  await p.click('.run-btn');await p.clock.runFor(10000);
  const mid=await p.evaluate(()=>({busy:!!window.yfsRunBusy,btn:document.querySelector('.run-btn').innerText}));
  ok(mid.busy,'T1a still working at 10s (no early give-up) ['+mid.btn.trim()+']');
  await p.clock.runFor(40000);await p.waitForTimeout(300);
  const s=await p.evaluate(()=>{const e=document.querySelector('.error-box');return {busy:!!window.yfsRunBusy,err:e&&getComputedStyle(e).display!=='none'?e.innerText.replace(/\s+/g,' '):'',btn:document.querySelector('.run-btn').innerText.trim()};});
  ok(!s.busy,'T1b no longer stuck after 45s');ok(/try again/i.test(s.err),'T1c shows Try again ['+s.err.slice(0,90)+']');
  ok(!/working on it/i.test(s.btn),'T1d run button back to normal ['+s.btn+']');ok(!errs.length,'T1e no page errors '+errs.join('|'));await ctx.close();}
 // T2: app in background for a long time → guard does NOT fire while hidden
 {const st={calls:[]};const ctx=await ctxFor(b,true,true,false,st);const p=await ctx.newPage();
  await p.clock.install();await p.goto('http://yfs.local/app.html');await p.clock.runFor(1500);
  await p.evaluate(()=>yfsOpenTool(3));await p.clock.runFor(300);await p.fill('#userInput','Demo County Public Works, Heavy Equipment Operator.');await p.evaluate(()=>{try{updateRunBtn()}catch(_){}});
  await p.click('.run-btn');await p.clock.runFor(2000);
  await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  await p.clock.runFor(120000);
  const s=await p.evaluate(()=>({calls:0,err:(document.querySelector('.error-box')||{}).innerText||''}));
  ok(!/server had a hiccup|took too long/i.test(s.err),'T2 no timeout error while hidden ['+s.err.replace(/\s+/g,' ').slice(0,60)+']');await ctx.close();}
 // T3: file reader never answers (image upload) → after 60s friendly error + paste fallback, not stuck on Reading
 {const st={calls:[]};const ctx=await ctxFor(b,false,false,true,st);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install();await p.goto('http://yfs.local/app.html');await p.clock.runFor(1500);
  await p.evaluate(()=>yfsOpenTool(0));await p.clock.runFor(300);
  await p.locator('#uploadZone input[type=file]').first().setInputFiles({name:'resume.png',mimeType:'image/png',buffer:PNG});
  await p.clock.runFor(5000);const z1=await p.evaluate(()=>document.getElementById('uploadZone').innerText.replace(/\s+/g,' '));
  ok(st.calls.includes('extract'),'T3a image read sent to file reader');
  await p.clock.runFor(60000);await p.waitForTimeout(300);
  const z2=await p.evaluate(()=>[...document.querySelectorAll('.upload-zone,[id=uploadZone]')].filter(e=>e.offsetParent).map(e=>e.innerText).join(' ').replace(/\s+/g,' '));
  ok(!/reading/i.test(z2),'T3b not stuck on Reading after 60s ['+z2.slice(0,100)+']');
  ok(/try again|paste/i.test(z2),'T3c friendly error with a way forward');ok(!errs.length,'T3d no page errors '+errs.join('|'));await ctx.close();}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
