// ?src=tiktok-ad (paid TikTok boost link): captured, tagged on metrics + checkout, Owen card shows, junk still rejected.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const APP=path.resolve(process.argv[2]||'../app.html');const RAW=fs.readFileSync(APP,'utf8');
let fails=0;const ok=(c,n)=>{console.log((c?'PASS ':'FAIL ')+n);if(!c)fails++;};
(async()=>{const b=await chromium.launch();
 async function open(q){const ctx=await b.newContext({viewport:{width:390,height:844}});const log=[],errs=[];
  await ctx.route('**/*',r=>{const u=r.request().url();
   if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:RAW,contentType:'text/html'});
   if(u.includes('workers.dev')){log.push({u,b:r.request().postData()||''});
     if(u.includes('/api/pro/checkout'))return r.fulfill({body:JSON.stringify({url:'about:blank'}),contentType:'application/json'});
     return r.fulfill({body:'{}',contentType:'application/json'});}
   if(u.startsWith('http://yfs.local/'))return r.fulfill({body:'',status:404});
   return r.abort();});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));await p.goto('http://yfs.local/app.html'+q);await p.waitForTimeout(600);return {ctx,p,log,errs};}
 let {ctx,p,log,errs}=await open('?src=tiktok-ad');
 ok(await p.evaluate(()=>yfsSrc())==='tiktok-ad','yfsSrc() = tiktok-ad');
 ok(log.some(x=>/\/api\/metrics\/visit\?src=tiktok-ad$/.test(x.u)),'visit metric tagged ?src=tiktok-ad');
 ok(await p.evaluate(()=>{const e=document.getElementById('yfsOwen');return !!e&&getComputedStyle(e).display!=='none';}),'Owen card shows for the ad link');
 await p.evaluate(()=>fetch('https://yourfirstshift.culpepperhunter.workers.dev/api/pro/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));await p.waitForTimeout(200);
 const co=log.filter(x=>x.u.endsWith('/api/pro/checkout')).pop();ok(!!co&&JSON.parse(co.b||'{}').src==='tiktok-ad','Pro checkout body carries src=tiktok-ad');
 ok(errs.length===0,'no page errors');await ctx.close();
 ({ctx,p,log,errs}=await open('?src=tiktok-adz'));
 ok(await p.evaluate(()=>yfsSrc())==='','unknown tag still rejected');await ctx.close();
 await b.close();console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);})();
