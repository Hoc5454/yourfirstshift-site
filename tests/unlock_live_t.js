// unlock-live: one "Unlock to edit it live + download a clean PDF." line under the free Unlock button (X-Ray tease + Builder); none for Pro.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=fs.readFileSync(path.resolve(process.argv[2]||'../app.html'),'utf8');const SHOT=process.argv[3]||'';const API='https://yourfirstshift.culpepperhunter.workers.dev';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const XRAY="## AI MATCH ESTIMATE: 71/100\n## VERDICT: Strong base.\n\n## ✅ KEYWORD HITS (1 found)\n- Forklift\n";
const RB="# MARCUS JOHNSON\nCDL-A Driver\nJacksonville, FL · (904) 555-0142\n\n## PROFESSIONAL SUMMARY\nRegional CDL-A driver.\n\n## EXPERIENCE\n### Driver | Southeast Freight | 2021 – Present\n- Drive regional routes\n";
async function page(b,out,pro){const ctx=await b.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:APP,contentType:'text/html'});
  if(u===API||u===API+'/')return r.fulfill({body:JSON.stringify({content:[{type:'text',text:out}]}),contentType:'application/json'});
  if(u.startsWith(API))return r.fulfill({body:'{}',contentType:'application/json'});return r.abort();});
 await ctx.addInitScript(p=>{if(p)localStorage.setItem('yfs_pro','1');},pro);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1200);return {ctx,p,errs};}
const look=p=>p.evaluate(()=>{const v=[...document.querySelectorAll('.yfs-unl-live')].filter(e=>e.offsetParent);return {n:v.length,txt:v[0]&&v[0].innerText.trim(),afterBtn:v[0]&&/Unlock full resume/i.test((v[0].previousElementSibling||{}).innerText||''),ow:document.documentElement.scrollWidth};});
(async()=>{const b=await chromium.launch();
 for(const [tool,out,name] of [[1,XRAY,'X-Ray'],[5,RB,'Builder']]){
  const {ctx,p,errs}=await page(b,out,false);await p.evaluate(t=>yfsOpenTool(t),tool);await p.waitForTimeout(300);await p.evaluate(()=>yfsTryExample());await p.waitForTimeout(200);await p.evaluate(()=>runTool());await p.waitForTimeout(3000);
  const r=await look(p);ok(r.n===1&&r.txt==='✏️ Unlock to edit it live + download a clean PDF.'&&r.afterBtn,name+' free: one line right under Unlock ('+JSON.stringify(r)+')');ok(r.ow<=412,name+' no sideways scroll');ok(!errs.length,name+' no page errors '+errs.join('|'));
  if(SHOT&&tool===1){await p.evaluate(()=>document.querySelector('.yfs-unl-live').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:SHOT});}
  await ctx.close();
  const c2=await page(b,out,true);await c2.p.evaluate(t=>yfsOpenTool(t),tool);await c2.p.waitForTimeout(300);await c2.p.evaluate(()=>yfsTryExample());await c2.p.waitForTimeout(200);await c2.p.evaluate(()=>runTool());await c2.p.waitForTimeout(3000);
  ok((await look(c2.p)).n===0,name+' Pro: no unlock line');await c2.ctx.close();}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
