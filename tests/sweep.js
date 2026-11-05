const { chromium } = require('playwright');const fs=require('fs');
const [,,html,mdf]=process.argv;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await ctx.route('**/*',r=>{const u=r.request().url();if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(html),contentType:'text/html'});return r.fulfill({body:'{}',contentType:'application/json'});});
 await p.addInitScript(()=>{localStorage.setItem('yfs_pro','1');});
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(600);
 const base=fs.readFileSync(mdf,'utf8');let bad=0,tot=0;
 for(const look of ['Modern Professional','Clean Minimal','Bold Trades','Creative Tech','Traditional Classic'])
 for(let n=0;n<60;n+=2){const md=base.replace('FILLER',Array(n*3).fill('word').join(' '));
  const res=await p.evaluate(([md,look])=>{isPro=true;selectedStyle=look;const box=document.getElementById('outputBox');box.style.display='block';yfsModernPaint(box,md,true,'');
   const c=yfsStyledClone();const host=document.createElement('div');host.className='yfs-modern';host.style.cssText='position:absolute;left:0;top:0;width:816px;max-width:none;background:#fff;';
   c.style.cssText='width:816px;aspect-ratio:auto;min-height:1056px;overflow:visible;box-shadow:none;padding:52px 58px;font-size:13.5px;box-sizing:border-box;';if(c.classList.contains('tpl-trades'))c.style.paddingTop='0';
   host.appendChild(c);document.body.appendChild(host);yfsPdfPrep(c);
   const PH=(window.yfsPdfPH?yfsPdfPH():816*10.1/8.5),o=c.parentNode.getBoundingClientRect();const R=e=>{const r=e.getBoundingClientRect();return{t:r.top-o.top,b:r.bottom-o.top};};const pg=e=>Math.floor((R(e).t+1)/PH);
   const errs=[];
   c.querySelectorAll('ul').forEach(u=>{const L=[...u.children].filter(x=>x.tagName==='LI'&&!x.classList.contains('yfs-pb-sp'));if(L.length<2)return;
    const last=L[L.length-1];if(pg(last)>pg(L[L.length-2]))errs.push('widow:'+last.textContent.slice(0,30));
    if(L.length>=3&&pg(L[1])>pg(L[0]))errs.push('orphan:'+L[0].textContent.slice(0,30));});
   c.querySelectorAll('.rb-jh').forEach(h=>{let n=h.nextElementSibling;while(n&&n.classList.contains('yfs-pb-sp'))n=n.nextElementSibling;if(n&&pg(n)>pg(h))errs.push('hdr-alone:'+h.textContent.slice(0,30));});
   c.querySelectorAll('li,p,.rb-jh').forEach(e=>{if(e.classList.contains('yfs-pb-sp'))return;const r=R(e);const k=Math.floor(r.t/PH);if(r.b>(k+1)*PH+1&&!(e.tagName==='P'))errs.push('straddle:'+e.textContent.slice(0,25));});
   const H=c.scrollHeight;host.remove();return {errs,pages:Math.ceil((H+40)/PH)};},[md,look]);
  tot++;if(res.errs.length){bad++;if(bad<=12)console.log(look,n,res.errs.join(' | '));}}
 console.log('cases',tot,'bad',bad);await b.close();})();
