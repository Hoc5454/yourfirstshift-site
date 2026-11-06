// pro-refresh: paying users keep Pro past the 35-day pass. Worker mocked; nothing real called.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');
const API='https://yourfirstshift.culpepperhunter.workers.dev';
let fails=0;const ok=(c,n)=>{console.log((c?'PASS ':'FAIL ')+n);if(!c)fails++;};
const b64u=s=>Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const tok=c=>b64u(JSON.stringify(c))+'.sig'+Math.random().toString(36).slice(2,8);
const now=()=>Math.floor(Date.now()/1000);
(async()=>{const b=await chromium.launch();
 async function open(o){const ctx=await b.newContext({viewport:{width:390,height:844}});const log={refresh:[],ai:[]};const errs=[];
  await ctx.route('**/*',async r=>{const u=r.request().url(),m=r.request().method();
   if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
   if(u.startsWith(API)){
     if(m==='OPTIONS')return r.fulfill({status:204});
     if(u.endsWith('/api/pro/refresh')){const bd=JSON.parse(r.request().postData()||'{}');log.refresh.push(bd.token);const res=o.refresh||{status:200,body:{ok:true,token:o.fresh,exp:now()+35*86400}};
       return r.fulfill({status:res.status,body:JSON.stringify(res.body),contentType:'application/json'});}
     if(u===API||u===API+'/'){const h=r.request().headers();log.ai.push(h['x-yfs-pro']||'');
       const pass=o.aiOk?o.aiOk(h['x-yfs-pro']||''):true;
       return r.fulfill(pass?{status:200,body:JSON.stringify({content:[{type:'text',text:'ok'}]}),contentType:'application/json'}:{status:402,body:'{"error":"pro_required"}',contentType:'application/json'});}
     return r.fulfill({status:200,body:'{}',contentType:'application/json'});}
   if(u.startsWith('http://yfs.local/'))return r.fulfill({body:'',status:404});return r.abort();});
  await ctx.addInitScript(o=>{if(o.tok){localStorage.setItem('yfs_pro','1');localStorage.setItem('yfs_pro_token',o.tok);}if(o.lastAt)localStorage.setItem('yfs_pro_refresh_at',String(o.lastAt));},{tok:o.tok,lastAt:o.lastAt});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1400);return {ctx,p,log,errs};}
 const ai=p=>p.evaluate(async()=>{const r=await fetch(YFS_API,{method:'POST',headers:proHeaders(),body:'{"messages":[]}'});return r.status;});
 const FRESH='fresh.'+'x';
 // T1 expired pass on load → renewed, stays Pro
 let o={tok:tok({sub:'sub_1',cus:'c',iat:now()-40*86400,exp:now()-5*86400}),fresh:'NEWTOKEN.a'};let {ctx,p,log,errs}=await open(o);
 ok(log.refresh.length===1&&log.refresh[0]===o.tok,'T1 expired pass → refresh called once on load');
 ok(await p.evaluate(()=>localStorage.getItem('yfs_pro_token'))==='NEWTOKEN.a'&&await p.evaluate(()=>localStorage.getItem('yfs_pro'))==='1','T1 new pass saved, still Pro');
 ok(await ai(p)===200&&log.ai.pop()==='NEWTOKEN.a','T1 next AI call uses the new pass');ok(errs.length===0,'T1 no page errors');await ctx.close();
 // T2 30 days left → no call; 3 days left → renewed early
 o={tok:tok({sub:'sub_1',iat:now(),exp:now()+30*86400}),fresh:'N2.a'};({ctx,p,log,errs}=await open(o));ok(log.refresh.length===0,'T2 30 days left → no refresh');await ctx.close();
 o={tok:tok({sub:'sub_1',iat:now(),exp:now()+3*86400}),fresh:'N3.a'};({ctx,p,log,errs}=await open(o));ok(log.refresh.length===1&&await p.evaluate(()=>localStorage.getItem('yfs_pro_token'))==='N3.a','T2 3 days left → renewed early');await ctx.close();
 // T3 throttle: near expiry but tried <12h ago → no call
 o={tok:tok({sub:'sub_1',iat:now(),exp:now()+3*86400}),fresh:'N4.a',lastAt:Date.now()-3600e3};({ctx,p,log}=await open(o));ok(log.refresh.length===0,'T3 tried 1h ago → waits (no spam)');await ctx.close();
 // T4 org-code pass and free user → never refresh
 o={tok:tok({org:'YFS-TEST-AB12',did:'a'.repeat(32),exp:now()-10})};({ctx,p,log}=await open(o));ok(log.refresh.length===0,'T4 org pass → no refresh');await ctx.close();
 o={};({ctx,p,log,errs}=await open(o));ok(log.refresh.length===0,'T4 free user → no refresh');ok(await ai(p)===200&&log.ai.pop()==='','T4 free AI call untouched (no pass header)');await ctx.close();
 // T5 server says 402 for the old pass (not expired locally) → renew + retry once → 200
 o={tok:tok({sub:'sub_1',iat:now(),exp:now()+20*86400}),fresh:'N5.a',aiOk:t=>t==='N5.a'};({ctx,p,log,errs}=await open(o));
 ok(await ai(p)===200,'T5 402 → renewed and retried → result');ok(log.ai.length===2&&log.ai[1]==='N5.a'&&log.refresh.length===1,'T5 exactly one retry, with the new pass');await ctx.close();
 // T6 subscription really ended → refresh 402 → caller still gets 402 (existing downgrade runs), no loop
 o={tok:tok({sub:'sub_1',iat:now(),exp:now()+20*86400}),refresh:{status:402,body:{error:'inactive',status:'canceled'}},aiOk:()=>false};({ctx,p,log}=await open(o));
 ok(await ai(p)===402&&log.refresh.length===1&&log.ai.length===1,'T6 canceled sub → 402 passes through, no retry loop');await ctx.close();
 // T7 expired locally right before an AI call → renewed BEFORE sending (no blurred result for a payer)
 o={tok:tok({sub:'sub_1',iat:now(),exp:now()+20*86400}),fresh:'N7.a'};({ctx,p,log}=await open(o));
 await p.evaluate(t=>localStorage.setItem('yfs_pro_token',t),tok({sub:'sub_1',iat:now()-40*86400,exp:now()-60}));
 ok(await ai(p)===200&&log.ai.pop()==='N7.a','T7 expired pass → renewed before the AI call is sent');await ctx.close();
 // T8 Worker down → keeps the old pass, no crash
 o={tok:tok({sub:'sub_1',iat:now(),exp:now()+2*86400}),refresh:{status:502,body:{error:'status unavailable'}}};({ctx,p,log,errs}=await open(o));
 ok(await p.evaluate(()=>localStorage.getItem('yfs_pro'))==='1'&&errs.length===0,'T8 refresh fails → stays as-is, no errors');await ctx.close();
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
