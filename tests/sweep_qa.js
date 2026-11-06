// QA sweep: every screen at two phone widths, free + Pro. Reports page errors, console errors, sideways overflow, tiny tap targets, missing labels.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');const RES=fs.readFileSync('raw_resume.txt','utf8');
const E2E=fs.readFileSync('e2e.js','utf8');const OUT=eval('('+E2E.slice(E2E.indexOf('const OUT=')+10,E2E.indexOf('\n(async')).replace(/;\s*$/,'')+')');
const API='https://yourfirstshift.culpepperhunter.workers.dev';const shots=process.argv[3]||'/tmp/qa';fs.mkdirSync(shots,{recursive:true});
const issues=[];const add=(w,where,msg)=>{const k=where+' | '+msg;if(!issues.some(i=>i.k===k))issues.push({k,w,where,msg});};
(async()=>{const b=await chromium.launch();
for(const W of [390,360])for(const pro of [false,true]){
 const ctx=await b.newContext({viewport:{width:W,height:W===360?740:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 let tool=1;
 await ctx.route('**/*',r=>{const u=r.request().url();
  if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
  if(u===API||u===API+'/')return r.fulfill({body:JSON.stringify({content:[{type:'text',text:OUT[tool]||OUT[1]}]}),contentType:'application/json'});
  if(u.startsWith(API))return r.fulfill({body:u.endsWith('/api/pro/plans')?'{"plans":{"pro":true,"pack":true,"pro_year":true}}':'{}',contentType:'application/json'});
  if(u.startsWith('http://yfs.local/'))return r.fulfill({status:404,body:''});
  if(/cdnjs|jsdelivr|unpkg/.test(u))return r.continue().catch(()=>r.abort());
  return r.abort();});
 await ctx.addInitScript(([raw,pro])=>{localStorage.setItem('yfs_vault',JSON.stringify([{id:'v1',name:'JEFFERYJOHNSONResume',text:raw,look:'Bold Trades',ts:Date.now()}]));localStorage.setItem('yfs_vault_active','v1');localStorage.setItem('yfs_resume',raw);if(pro)localStorage.setItem('yfs_pro','1');},[RES,pro]);
 const p=await ctx.newPage();const tag=`${W}${pro?'P':'F'}`;
 p.on('pageerror',e=>add(W,tag,'PAGE ERROR: '+e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/net::ERR|Failed to load resource|ERR_FAILED/.test(m.text()))add(W,tag,'console error: '+m.text().slice(0,160));});
 p.on('dialog',d=>{add(W,tag,'unexpected dialog: '+d.message().slice(0,80));d.dismiss();});
 async function audit(where){const r=await p.evaluate(()=>{const out=[];const vw=innerWidth;
   if(document.documentElement.scrollWidth>vw+1)out.push('page scrolls sideways ('+document.documentElement.scrollWidth+'px > '+vw+'px)');
   const vis=e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0.05&&b.width>0&&b.height>0;};
   document.querySelectorAll('body *').forEach(e=>{if(!vis(e))return;const b=e.getBoundingClientRect();if(b.right>vw+2&&getComputedStyle(e).position!=='fixed'){let q=e,clip=false;while(q=q.parentElement){const o=getComputedStyle(q).overflowX;if(o==='hidden'||o==='auto'||o==='scroll'){clip=true;break;}}if(!clip)out.push('wider than screen: '+e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:'')+' right='+Math.round(b.right));}});
   document.querySelectorAll('button,a[href],[role=button],input,select,textarea').forEach(e=>{if(!vis(e))return;const b=e.getBoundingClientRect();
     const t=(e.innerText||e.value||e.getAttribute('aria-label')||e.title||'').trim();
     if(!t&&!e.getAttribute('aria-label')&&!(e.labels&&e.labels.length)&&!e.placeholder&&e.type!=='file'&&e.type!=='hidden')out.push('no label: '+e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''));
     if((e.tagName==='BUTTON'||e.getAttribute('role')==='button')&&(b.height<36||b.width<36))out.push('small tap target ('+Math.round(b.width)+'x'+Math.round(b.height)+'): '+(e.id?'#'+e.id:(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''))+' "'+t.slice(0,24)+'"');});
   return [...new Set(out)].slice(0,40);});
  r.forEach(m=>add(W,tag+' '+where,m));}
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(1600);
 await audit('home');await p.screenshot({path:`${shots}/${tag}_home.png`,fullPage:true});
 for(const t of [0,1,2,3,4,5]){tool=t;await p.evaluate(t=>yfsOpenTool(t),t);await p.waitForTimeout(400);await audit('tool'+t);
  if(W===390)await p.screenshot({path:`${shots}/${tag}_tool${t}.png`});
  if(t>=1&&t<=4){const sel=t===1?'#xrayJd':'#userInput';if(!(await p.isVisible(sel))){add(W,tag+' tool'+t,'input '+sel+' not visible'+(pro?'':' (free run used — expected if gated)'));continue;}await p.fill(sel,t===1?'Heavy Equipment Operator — Lee County. Must run dozer and motor grader, read grade stakes, CDL a plus.':'Lee County Public Works, Heavy Equipment Operator. Interview next week.');
   await p.evaluate(()=>{try{updateRunBtn()}catch(_){}});
   if(!pro&&t>1){/* free run already used */}else{await p.evaluate(()=>runTool());await p.waitForTimeout(1800);await audit('result'+t);if(W===390){const y=await p.evaluate(()=>{const o=document.getElementById('outputSection');return o?o.getBoundingClientRect().top+scrollY:0;});await p.evaluate(y=>scrollTo(0,y-60),y);await p.waitForTimeout(150);await p.screenshot({path:`${shots}/${tag}_result${t}.png`});}}}
 }
 for(const [nm,fn] of [['plans','yfsOpenPlans()'],['account','yfsOpenAccount()'],['restore','yfsOpenRestore()'],['vault','openVault()'],['org','yfsOpenOrg&&yfsOpenOrg()']]){
  await p.evaluate(()=>{try{yfsCloseSheets()}catch(_){};document.querySelectorAll('.modal-overlay,.yfs-rm').forEach(m=>m.style.display='none');});await p.evaluate(fn);await p.waitForTimeout(500);await audit(nm);
  if(W===390)await p.screenshot({path:`${shots}/${tag}_${nm}.png`});}
 await ctx.close();}
await b.close();
const by={};issues.forEach(i=>{(by[i.msg]=by[i.msg]||[]).push(i.where);});
console.log('ISSUES ('+Object.keys(by).length+' unique):');Object.entries(by).forEach(([m,w])=>console.log('- '+m+'  ['+[...new Set(w)].slice(0,6).join(', ')+(w.length>6?' …':'')+']'));})();
