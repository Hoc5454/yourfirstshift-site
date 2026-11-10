// yfsPdfFit must measure the words of a block that also holds bold text ("<b>Lead:</b> ran a crew…"),
// so the page count is right and no line is cut off. Made-up text only. Usage: node pdf_fit_bold_t.js ../app.html
const {chromium}=require('playwright');const path=require('path');
const APP='file://'+path.resolve(process.argv[2]||'../app.html');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(APP,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof yfsPdfFit==='function'&&typeof yfsPdfPH==='function');
 const run=(kind)=>p.evaluate(kind=>{const PH=yfsPdfPH();const root=document.createElement('div');root.style.cssText='position:absolute;left:0;top:0;width:794px;background:#fff';
   const c=document.createElement('div');c.style.cssText='padding:0 40px;font:14px/20px Arial';root.appendChild(c);
   const fill=document.createElement('div');fill.textContent='Example Iron Works';fill.style.height=(PH-60)+'px';c.appendChild(fill);
   const long='Ran a three-person crew on commercial jobs, kept the daily log, ordered rod and gas, and trained two new hires on stick and flux-core welding. '.repeat(4);
   const blk=document.createElement(kind==='li'?'ul':'div');const e=document.createElement(kind==='li'?'li':'p');e.style.margin='0';
   if(kind==='plain')e.textContent='Lead welder: '+long;else e.innerHTML='<b>Lead welder:</b> '+long+(kind==='mid'?' <i>Night shift.</i> Closed out every job on time.':'');
   blk.style.margin='0';blk.appendChild(e);c.appendChild(blk);document.body.appendChild(root);
   const o=root.getBoundingClientRect();const g=document.createRange();g.selectNodeContents(e);const rs=[...g.getClientRects()];const before=Math.max.apply(null,rs.map(r=>r.bottom))-o.top;
   yfsPdfFit(c);const rs2=[...g.getClientRects()];const textBottom=Math.max.apply(null,rs2.map(r=>r.bottom))-root.getBoundingClientRect().top;const box=c.getBoundingClientRect().bottom-root.getBoundingClientRect().top;
   const out={PH:PH,before:before,pages:+c.getAttribute('data-pdf-pages'),need:Math.ceil(textBottom/PH),cut:c.style.overflow==='hidden'&&textBottom>box+1,textBottom:Math.round(textBottom),box:Math.round(box)};root.remove();return out;},kind);
 for(const [kind,label] of [['p','paragraph starting with bold'],['li','bullet starting with bold'],['mid','paragraph with bold and italic inside'],['plain','plain paragraph (as before)']]){const r=await run(kind);
  ok(r.before>r.PH,'['+label+'] set-up: the words run past page 1 ('+Math.round(r.before)+'px of '+r.PH+')');
  ok(r.pages===r.need&&r.pages===2,'['+label+'] page count matches the words: '+r.pages+' (needs '+r.need+')');
  ok(!r.cut,'['+label+'] no line is hidden (words end at '+r.textBottom+'px, sheet at '+r.box+'px)');}
 ok(!errs.length,'no page errors '+errs.join('|').slice(0,160));await b.close();console.log(fails?('\n'+fails+' FAILED'):'\nALL PASS');process.exit(fails?1:0);})();
