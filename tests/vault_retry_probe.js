// file-reader-retry: "My resumes" (vault) upload also auto-retries once after an app switch. Usage: node vault_retry_probe.js <app.html>
const { chromium } = require('playwright');const fs=require('fs');
const H=process.argv[2]||'../app.html';const RAW=fs.readFileSync('raw_resume.txt','utf8');const PDF=Buffer.from('%PDF-1.4\n%%EOF\n');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message);});let n=0;const pend=[];
 await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
  if(/workers\.dev\/?$/.test(u)){n++;if(n===1)return new Promise(res=>pend.push(()=>{r.abort('failed').catch(()=>{});res();}));return r.fulfill({body:JSON.stringify({content:[{text:RAW}]}),contentType:'application/json'});}return r.abort();});
 await p.addInitScript(()=>{window.__vis='visible';Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__vis});});
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(400);await p.evaluate(()=>yfsOpenTool(3));
 const inp=await p.$('input[onchange="yfsVaultFile(event)"]');await inp.setInputFiles({name:'v.pdf',mimeType:'application/pdf',buffer:PDF});await p.waitForTimeout(300);
 await p.evaluate(()=>{window.__vis='hidden';document.dispatchEvent(new Event('visibilitychange'));});pend.splice(0).forEach(f=>f());await p.waitForTimeout(300);
 await p.evaluate(()=>{window.__vis='visible';document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(4000);
 const r=await p.evaluate(()=>({vz:(document.getElementById('vaultZone')||{}).textContent||'',vi:((document.getElementById('vaultInput')||{}).value||'').length,uz:!!document.getElementById('uploadZone')}));
 console.log(JSON.stringify(r),'calls',n);const pass=/File read/.test(r.vz)&&r.vi>100&&r.uz&&n===2&&!errs.length;console.log(pass?'PASS vault retry':'FAIL vault retry');
 await b.close();process.exit(pass?0:1);})();
