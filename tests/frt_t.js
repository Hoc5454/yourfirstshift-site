// file-reader-retry: Android app-switch kills the in-flight read -> auto-retry once on return; Upgrade CTA stays orange after Free.
// Usage: node frt_t.js <app.html> [shotPath]   (Worker + checkout mocked; nothing real is called)
const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../app.html',SHOT=process.argv[3]||'';
const RAW=fs.readFileSync('raw_resume.txt','utf8');
const PDF=Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
let fails=0;const ok=(c,m)=>{console.log((c?'  PASS ':'  FAIL ')+m);if(!c)fails++;};
const LETTER='Dear Hiring Manager,\n\nI ran final grade on three subdivisions last year.\n\nJeffery Johnson';

async function setup(b,{used=false,pro=false,plan}){
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
  const st={errs:[],extract:0,ai:0,ck:0,pending:[]};
  p.on('pageerror',e=>{st.errs.push(e.message);console.log('PAGEERR',e.message);});p.on('dialog',d=>d.dismiss());
  ctx.on('page',np=>np.close().catch(()=>{}));
  await ctx.route('**/*',async r=>{const u=r.request().url();/* checkout-same-tab: Stripe now opens in the SAME tab; a 204 keeps the test on the app page */if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({status:204,body:''});
    if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
    if(u.includes('/api/pro/checkout')){st.ck++;return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/test'}),contentType:'application/json'});}
    if(/workers\.dev\/?$/.test(u)){const k=(r.request().headers()['x-yfs-kind']||'');
      if(k==='extract'){const n=st.extract++;const act=(plan&&plan[n])||'ok';
        if(act==='abort')return r.abort('failed');
        if(act==='hang'){return new Promise(res=>st.pending.push(()=>{r.abort('failed').catch(()=>{});res();}));}
        if(act==='hangAbortOnHide'){return new Promise(res=>st.pending.push(()=>{r.abort('failed').catch(()=>{});res();}));}
        return r.fulfill({body:JSON.stringify({content:[{text:RAW}]}),contentType:'application/json'});}
      st.ai++;return r.fulfill({body:JSON.stringify({content:[{text:LETTER}]}),contentType:'application/json'});}
    return r.abort();});
  await p.addInitScript(([used,pro])=>{if(used)localStorage.setItem('yfs_usage','1');if(pro)localStorage.setItem('yfs_pro','1');
    // test hook: fake page visibility (Android app switch)
    window.__vis='visible';Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__vis});
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__vis==='hidden'});},[used,pro]);
  await p.goto('http://yfs.local/app.html');await p.waitForTimeout(400);
  await p.evaluate(()=>yfsOpenTool(3));await p.waitForTimeout(200);
  return {ctx,p,st};
}
const hide=p=>p.evaluate(()=>{window.__vis='hidden';document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));});
const show=p=>p.evaluate(()=>{window.__vis='visible';document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
const zone=p=>p.evaluate(()=>{const z=document.getElementById('uploadZone');return z?z.innerText.replace(/\s+/g,' ').trim():'';});
const btn=p=>p.evaluate(()=>{const b=document.getElementById('runBtn');return {cls:b.className,txt:b.textContent,dis:b.disabled,bg:getComputedStyle(b).backgroundColor};});
const upload=p=>p.setInputFiles('#fileInput',{name:'Jeffery_Resume.pdf',mimeType:'application/pdf',buffer:PDF});
const isOrange=bg=>{const m=bg.match(/\d+/g);if(!m)return false;const [r,g,bb]=m.map(Number);return r>200&&g>100&&g<190&&bb<90;};

(async()=>{const b=await chromium.launch();

 console.log('T1 app switch kills read -> auto-retry once on return -> success');
 {const {ctx,p,st}=await setup(b,{plan:['hang','ok']});
  await upload(p);await p.waitForTimeout(400);
  await hide(p);await p.waitForTimeout(100);st.pending.splice(0).forEach(f=>f());await p.waitForTimeout(400);
  ok(!/couldn.t reach/i.test(await zone(p)),'no file-reader error while app is in background');
  await show(p);await p.waitForTimeout(3200);/* reader-resume: retry now waits ~1.5s for the network */
  const z=await zone(p);ok(/resume loaded/i.test(z),'resume loaded after return: '+z.slice(0,60));
  ok(st.extract===2,'exactly 2 extract calls (1 retry), got '+st.extract);
  ok(await p.evaluate(()=>(extractedFileText||'').includes('Johnson')||extractedFileText.length>100),'extracted text kept');
  ok((await p.evaluate(()=>localStorage.getItem('yfs_usage')))==null,'free run not used by reading');
  ok(st.errs.length===0,'no page errors');await ctx.close();}

 console.log('T2 retry also fails -> friendly error + paste fallback, no 3rd try, free run not burned');
 {const {ctx,p,st}=await setup(b,{plan:['hang','abort','ok']});
  await upload(p);await p.waitForTimeout(300);await hide(p);st.pending.splice(0).forEach(f=>f());await p.waitForTimeout(300);
  await show(p);await p.waitForTimeout(3200);/* reader-resume: retry now waits ~1.5s for the network */
  const z=await zone(p);ok(/couldn.t reach our file reader/i.test(z)&&/paste your resume/i.test(z),'friendly error + paste fallback: '+z.slice(0,90));
  await show(p);await p.waitForTimeout(800);
  ok(st.extract===2,'no extra retry after second failure, calls='+st.extract);
  ok((await p.evaluate(()=>localStorage.getItem('yfs_usage')))==null,'free run not burned');
  ok(st.ai===0,'no AI run');ok(st.errs.length===0,'no page errors');await ctx.close();}

 console.log('T3 read stalls (never answers) while away -> retry on return');
 {const {ctx,p,st}=await setup(b,{plan:['hang','ok']});
  await upload(p);await p.waitForTimeout(300);await hide(p);await p.waitForTimeout(300);await show(p);
  await p.waitForTimeout(7500);
  const z=await zone(p);ok(/resume loaded/i.test(z),'loaded after stall retry: '+z.slice(0,50));ok(st.extract===2,'2 extract calls, got '+st.extract);
  st.pending.splice(0).forEach(f=>f());await p.waitForTimeout(500);
  ok(/resume loaded/i.test(await zone(p)),'late failure of the stalled read does not overwrite success');
  ok(st.errs.length===0,'no page errors');await ctx.close();}

 console.log('T4 error while staying on page (no app switch) -> unchanged: error shown, no auto-retry');
 {const {ctx,p,st}=await setup(b,{plan:['abort','ok']});
  await upload(p);await p.waitForTimeout(1200);
  ok(/couldn.t reach our file reader/i.test(await zone(p)),'existing error shown');ok(st.extract===1,'1 extract call');
  await ctx.close();}

 console.log('T5 after Free run + file error showing -> Upgrade CTA stays orange and opens checkout');
 {const {ctx,p,st}=await setup(b,{plan:['ok','hang','abort','abort']});
  await upload(p);await p.waitForTimeout(1200);await p.fill('#userInput','Heavy Equipment Operator — Lee County.');await p.evaluate(()=>updateRunBtn());
  await p.click('#runBtn');await p.waitForTimeout(1500);
  let s=await btn(p);console.log('   after free run:',JSON.stringify(s));
  ok(/Upgrade to continue/.test(s.txt)&&isOrange(s.bg),'Upgrade CTA orange after free run');
  await upload(p);await p.waitForTimeout(300);
  s=await btn(p);console.log('   while reading:',JSON.stringify(s));ok(/Upgrade to continue/.test(s.txt)&&isOrange(s.bg)&&!s.dis,'orange while reading');
  await hide(p);st.pending.splice(0).forEach(f=>f());await p.waitForTimeout(300);await show(p);await p.waitForTimeout(3200);/* reader-resume: retry now waits ~1.5s for the network */
  ok(/couldn.t reach our file reader/i.test(await zone(p)),'file error showing after retry failed');
  s=await btn(p);console.log('   error state:',JSON.stringify(s));
  ok(/Upgrade to continue/.test(s.txt)&&/ready/.test(s.cls)&&!s.dis&&isOrange(s.bg),'Upgrade CTA still orange in error state');
  await p.fill('#userInput','typing more');s=await btn(p);ok(/Upgrade to continue/.test(s.txt)&&isOrange(s.bg),'still orange after typing');
  ok(await p.evaluate(()=>{const h=document.getElementById('yfsGateHint');return !h||h.style.display==='none';}),'no gray gate hint under CTA');
  if(SHOT){await p.evaluate(()=>{const z=document.getElementById('uploadZone');scrollTo(0,z.getBoundingClientRect().top+scrollY-120);});await p.waitForTimeout(200);await p.screenshot({path:SHOT});}
  const ai0=st.ai;await p.click('#runBtn');await p.waitForTimeout(600);
  ok(st.ck===1,'tap -> 1 checkout call (got '+st.ck+')');ok(st.ai===ai0,'no second free AI run');
  ok((await p.evaluate(()=>localStorage.getItem('yfs_usage')))==='1','usage still 1');
  ok(st.errs.length===0,'no page errors');await ctx.close();}

 console.log('T6 Pro: run button normal after file error');
 {const {ctx,p,st}=await setup(b,{plan:['abort'],pro:true});
  await p.fill('#userInput','Heavy Equipment Operator — Lee County.');await upload(p);await p.waitForTimeout(1200);
  const s=await btn(p);ok(/Run Cover Letter/.test(s.txt)&&!/upgrade/i.test(s.cls),'Pro sees Run, not Upgrade: '+s.txt);await ctx.close();}

 console.log('T7 Free unused: normal free run after a successful read (free slice intact)');
 {const {ctx,p,st}=await setup(b,{plan:['ok']});
  await upload(p);await p.waitForTimeout(1200);await p.fill('#userInput','Heavy Equipment Operator — Lee County.');await p.evaluate(()=>updateRunBtn());
  let s=await btn(p);ok(/Run Cover Letter/.test(s.txt)&&/ready/.test(s.cls),'Run ready before free run');
  await p.click('#runBtn');await p.waitForTimeout(1500);
  ok(st.ai===1,'1 AI run');ok((await p.evaluate(()=>localStorage.getItem('yfs_usage')))==='1','usage=1');
  s=await btn(p);ok(/Upgrade to continue/.test(s.txt)&&isOrange(s.bg),'then Upgrade CTA orange');
  await p.click('#runBtn');await p.waitForTimeout(500);ok(st.ai===1&&st.ck===1,'tap -> checkout, no 2nd AI run');
  ok(st.errs.length===0,'no page errors');await ctx.close();}

 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
