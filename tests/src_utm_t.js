// src-tracking for YouTube + UTM: ?src=youtube, ?utm_source= as a fallback, the source surviving a tap from the home page
// (two ways: the app reads our own home page's address, and docs/returns/index-src-snippet.html puts it on the links).
// Usage: node src_utm_t.js [../app.html]   (Worker + Stripe fully mocked; nothing real is called)
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');const cp=require('child_process');
const H=process.argv[2]||'../app.html';const SNIP=fs.readFileSync(path.join(__dirname,'..','docs','returns','index-src-snippet.html'),'utf8');
let fails=0;const ok=(c,m)=>{console.log((c?'  PASS ':'  FAIL ')+m);if(!c)fails++;};
// a made-up home page with the same link shapes the real one has, plus links that must never change
const LINKS=['/app.html','app.html','app.html#tool-0','app.html#tool-1','app.html#tool-5','app.html?src=reels','/job/','legal.html','https://example.com/app.html','mailto:hello@example.com'];
const home=snip=>'<!doctype html><html><head><meta charset="utf-8"><title>home</title></head><body>'+LINKS.map((h,i)=>'<a id="l'+i+'" href="'+h+'">link '+i+'</a><br>').join('')+(snip?SNIP:'')+'</body></html>';
async function ctxFor(b,log,homeHtml){const ctx=await b.newContext({viewport:{width:390,height:844}});
  await ctx.route('**/*',r=>{const q=r.request(),u=q.url();if(u.startsWith('https://checkout.stripe.com/'))return r.fulfill({status:204,body:''});
    if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(H),contentType:'text/html'});
    if(/^http:\/\/(yfs|other)\.local\/(\?.*)?$/.test(u))return r.fulfill({body:homeHtml||home(false),contentType:'text/html'});
    if(u.includes('fonts.g'))return r.abort();
    if(u.includes('workers.dev'))log.push({u,body:q.postData()||''});
    if(u.includes('/api/pro/checkout'))return r.fulfill({body:JSON.stringify({url:'https://checkout.stripe.com/c/test'}),contentType:'application/json'});
    return r.fulfill({body:'{}',contentType:'application/json'});});
  return ctx;}
async function page(ctx,errs){const p=await ctx.newPage();p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message);});p.on('dialog',d=>d.dismiss());return p;}
const metric=(log,m)=>log.filter(x=>x.u.includes('/api/metrics/'+m));
const ck=log=>log.filter(x=>x.u.includes('/api/pro/checkout'));
(async()=>{const b=await chromium.launch();
 // T1 known names, from ?src= and from ?utm_source=
 for(const [q,exp] of [['?src=youtube','youtube'],['?utm_source=youtube','youtube'],['?utm_source=tiktok','tiktok'],['?utm_source=%20YouTube%20','youtube'],['?utm_source=shorts&utm_medium=social&utm_campaign=launch-week','shorts'],
   ['?src=tiktok&utm_source=youtube','tiktok'],['?src=bogus&utm_source=youtube','youtube'],['?src=&utm_source=reels','reels'],['?utm_source=youtube#tool-1','youtube']]){
  const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);console.log('T1 '+q);
  await p.goto('http://yfs.local/app.html'+q);await p.waitForTimeout(450);await p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(400);
  ok(await p.evaluate(()=>yfsSrc())===exp&&await p.evaluate(()=>yfsSrcThisSession())===exp,'kept as '+exp);
  ok(metric(log,'visit').length===1&&metric(log,'visit')[0].u.endsWith('/api/metrics/visit?src='+exp),'visit metric ends ?src='+exp);
  ok(ck(log).length===1&&ck(log)[0].body===JSON.stringify({src:exp}),'Pro checkout body = '+(ck(log)[0]&&ck(log)[0].body));
  ok(log.every(x=>!/utm_|launch-week|social/.test(x.u+x.body)),'no utm_medium / utm_campaign / other text reaches the Worker');
  if(q.includes('#tool-1'))ok(await p.evaluate(()=>activeTool)===1,'#tool-1 still opens ATS X-Ray');
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T2 unknown names are thrown away: nothing stored, requests byte-identical to a visit with no source
 for(const q of ['?utm_source=facebook','?utm_source=newsletter','?utm_source=%3Cscript%3E','?utm_source=youtube%22','?utm_source=','?utm_source=you%20tube','?src=facebook&utm_source=google','?utm_medium=youtube&utm_campaign=tiktok']){
  const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);console.log('T2 '+q);
  await p.goto('http://yfs.local/app.html'+q);await p.waitForTimeout(450);await p.evaluate(()=>yfsOpenCheckout());await p.waitForTimeout(400);
  ok(await p.evaluate(()=>yfsSrc())===''&&await p.evaluate(()=>localStorage.getItem('yfs_src'))===null&&await p.evaluate(()=>sessionStorage.getItem('yfs_src'))===null,'nothing stored');
  ok(ck(log)[0].body==='{}'&&metric(log,'visit')[0].u.endsWith('/api/metrics/visit')&&metric(log,'pay_tap')[0].u.endsWith('/api/metrics/pay_tap'),'checkout body "{}" and metric URLs unchanged');
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T3 home page as it is today (no snippet): the visitor taps a plain app.html link, the app reads the source from our own home page's address
 for(const [q,id,exp,hash] of [['?src=tiktok','#l0','tiktok',''],['?utm_source=youtube','#l1','youtube',''],['?src=shorts','#l3','shorts','#tool-1'],['?src=facebook','#l1','',''],['','#l1','','']]){
  const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);console.log('T3 home '+(q||'(no query)')+' → tap '+LINKS[+id.slice(2)]);
  await p.goto('http://yfs.local/'+q);await p.click(id);await p.waitForURL(/app\.html/);await p.waitForTimeout(450);
  ok(p.url()==='http://yfs.local/app.html'+hash,'link itself unchanged: '+p.url());
  ok(await p.evaluate(()=>yfsSrc())===exp,'app knows the source: "'+exp+'"');
  ok(metric(log,'visit').length===1&&metric(log,'visit')[0].u.endsWith('/api/metrics/visit'+(exp?'?src='+exp:'')),'visit metric '+(exp?'ends ?src='+exp:'unchanged'));
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T4 another website's address is never read, whatever it says
 {const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);console.log('T4 other site ?src=tiktok → link to our app');
  await p.goto('http://other.local/?src=tiktok&utm_source=youtube');await p.evaluate(()=>{const a=document.createElement('a');a.id='x';a.href='http://yfs.local/app.html';a.referrerPolicy='unsafe-url';a.textContent='x';document.body.prepend(a);});
  await p.click('#x');await p.waitForURL(/yfs\.local\/app\.html/);await p.waitForTimeout(450);
  ok(/^http:\/\/other\.local\/\?src=tiktok/.test(await p.evaluate(()=>document.referrer)),'(the other site did send its full address: '+await p.evaluate(()=>document.referrer)+')');
  ok(await p.evaluate(()=>yfsSrc())===''&&await p.evaluate(()=>localStorage.getItem('yfs_src'))===null,'nothing stored');
  ok(metric(log,'visit')[0].u.endsWith('/api/metrics/visit'),'visit metric unchanged');ok(errs.length===0,'no page errors');await ctx.close();}
 // T5 a source in the app's own address wins over the home page's; a later visit with no source keeps the last good one
 {const log=[],errs=[];const ctx=await ctxFor(b,log);const p=await page(ctx,errs);console.log('T5 order');
  await p.goto('http://yfs.local/?src=tiktok');await p.click('#l5');await p.waitForURL(/app\.html/);await p.waitForTimeout(400);
  ok(await p.evaluate(()=>yfsSrc())==='reels','app.html?src=reels tapped from /?src=tiktok → reels');
  await p.goto('http://yfs.local/app.html?utm_source=bogus');await p.waitForTimeout(300);ok(await p.evaluate(()=>yfsSrc())==='reels','bogus utm_source keeps last good source');
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T6 the home page snippet: known source goes onto the app links only, #tool-N kept, everything else untouched
 const want=s=>['/app.html?src='+s,'/app.html?src='+s,'/app.html?src='+s+'#tool-0','/app.html?src='+s+'#tool-1','/app.html?src='+s+'#tool-5'].concat(LINKS.slice(5));
 for(const [q,exp] of [['?src=youtube','youtube'],['?utm_source=youtube','youtube'],['?utm_source=TikTok&utm_campaign=x','tiktok'],['?src=tiktok-ad','tiktok-ad'],['?src=facebook',''],['?utm_source=%22%3E%3Cscript%3E',''],['','']]){
  const log=[],errs=[];const ctx=await ctxFor(b,log,home(true));const p=await page(ctx,errs);console.log('T6 snippet, home '+(q||'(no query)'));
  await p.goto('http://yfs.local/'+q);await p.waitForTimeout(150);
  const got=await p.evaluate(()=>[].map.call(document.querySelectorAll('a'),a=>a.getAttribute('href')));
  ok(JSON.stringify(got)===JSON.stringify(exp?want(exp):LINKS),exp?'app links carry ?src='+exp+', the other 5 links untouched':'every link byte-identical');
  ok(log.length===0,'the snippet sends nothing anywhere');
  if(exp){await p.click('#l3');await p.waitForURL(/app\.html/);await p.waitForTimeout(450);
   ok(p.url()==='http://yfs.local/app.html?src='+exp+'#tool-1','tap lands on '+p.url());
   ok(await p.evaluate(()=>yfsSrc())===exp&&await p.evaluate(()=>activeTool)===1&&metric(log,'visit')[0].u.endsWith('?src='+exp),'app counts the visit as '+exp+' and opens ATS X-Ray');}
  ok(errs.length===0,'no page errors');await ctx.close();}
 // T7 the snippet on the real home page copies this repository holds on side branches (skipped when a branch isn't fetched)
 for(const ref of ['origin/cursor/homepage-head-snippet-c88f','origin/claude/ats-explainer','origin/claude/home-plans','origin/claude/home-live-edit']){
  let html='';try{html=cp.execFileSync('git',['show',ref+':index.html'],{cwd:path.join(__dirname,'..'),maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}).toString();}catch(_){}
  if(!html||html.indexOf('</body>')<0){console.log('T7 '+ref+': SKIP (not fetched)');continue;}
  const log=[],errs=[];const before=(html.match(/href="[^"]*"/g)||[]).map(x=>x.slice(6,-1));
  const ctx=await ctxFor(b,log,html.replace('</body>',SNIP+'</body>'));const p=await page(ctx,errs);console.log('T7 '+ref);
  await p.goto('http://yfs.local/?utm_source=youtube',{waitUntil:'domcontentloaded'});await p.waitForTimeout(300);
  const r=await p.evaluate(()=>[].map.call(document.querySelectorAll('a[href]'),a=>a.getAttribute('href')));
  const app=r.filter(h=>/app\.html/.test(h));const n=before.filter(h=>/(^|\/)app\.html(#|$)/.test(h)).length;
  ok(n>=5&&app.length===n&&app.every(h=>/^\/app\.html\?src=youtube(#tool-\d)?$/.test(h)),n+' app links, all carry ?src=youtube');
  ok(app.filter(h=>/#tool-\d$/.test(h)).length===before.filter(h=>/app\.html#tool-\d$/.test(h)).length,'#tool-N kept on every tool link');
  ok(JSON.stringify(r.filter(h=>!/app\.html/.test(h)))===JSON.stringify((await (async()=>{const p2=await page(ctx,errs);await p2.goto('http://yfs.local/',{waitUntil:'domcontentloaded'});await p2.waitForTimeout(200);return p2.evaluate(()=>[].map.call(document.querySelectorAll('a[href]'),a=>a.getAttribute('href')));})()).filter(h=>!/app\.html/.test(h))),'every other link the same as with no source');
  ok(errs.length===0,'no page errors');await ctx.close();}
 await b.close();console.log(fails?'FAILURES: '+fails:'ALL PASS');process.exit(fails?1:0);})();
