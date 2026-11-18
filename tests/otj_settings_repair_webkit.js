// Clocked In on the WebKit engine (the engine Safari uses; WebKitGTK via WebKitWebDriver, iPhone UA, 412px): damaged pay setup opens on a
// Sunday and on a Monday (the two days it used to crash), with every shift kept and the reset named in a note. Made-up data only.
// The set that used to freeze the page runs last, on its own line: if the page ever freezes again this test is stopped by its time limit, which counts as a failure.
// Usage: xvfb-run node otj_settings_repair_webkit.js ..
const http=require('http'),fs=require('fs'),path=require('path');const {Builder}=require(process.env.SEL||'selenium-webdriver');
const ROOT=path.resolve(process.argv[2]||'..');const PORT=18879;const O='http://127.0.0.1:'+PORT;
const T={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT,u);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+'[webkit] '+m);if(!c)fails++;};
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const pad=n=>String(n).padStart(2,'0');const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const P=k=>{const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(k,n)=>{const d=P(k);d.setDate(d.getDate()+n);return ymd(d);};const at=(k,hm)=>{const p=k.split('-'),t=hm.split(':');return new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1],0,0).getTime();};
const SET=x=>Object.assign({rate:28,otRate:'',period:'weekly',anchor:'2026-11-16',weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false},x||{});
const state=(D,settings)=>({app:'yfs-on-the-job',v:1,created:at(addDays(D,-30),'08:00'),settings,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Harbor Line Builders',rate:'',otRate:'',active:true,perDiem:75}],codes:[],
  entries:[-9,-8,-7,-6,-5,-2,-1,0].map((i,n)=>({id:'w'+n,kind:'work',date:addDays(D,i),start:at(addDays(D,i),'07:00'),end:at(addDays(D,i),i?'16:30':'11:00'),breakMin:30,jobId:'j1',codeId:'',splits:[],note:''})),pto:{buckets:[]},clock:null,log:[],lastBackup:at(D,'08:00'),pdCharge:{},pdDay:{},ui:{a2hsX:1}});
const FREEZE={'every 2 weeks with start date "abc"':SET({period:'biweekly',anchor:'abc'}),'every 2 weeks with start date 7 and workweek start 9':SET({period:'biweekly',anchor:7,weekStart:9})};
const SETS={'workweek start 9':SET({weekStart:9}),'half-filled (the edge suite\'s set)':{rate:'abc',period:'nope',state:'ZZ',filing:'?',weekStart:9},'pay period "nope"':SET({period:'nope'}),'workweek start 1.5':SET({weekStart:1.5}),
  'everything wrong':{rate:{},otRate:[],period:7,anchor:{},weekStart:'x',state:5,stateRate:'x',filing:[],k401:'x',health:{},credits:[],extraWH:'x',perDiem:{},perDiemNT:'no',perDiemTax:5,perDiemEach:'yes',bonus:'x'}};
// in the page: stop the clock at noon on the chosen day, load the saved data, walk the tabs
const LOAD="var now=arguments[0],raw=arguments[1];if(!window.__D)window.__D=Date;var _D=window.__D;class D2 extends _D{constructor(...a){if(a.length)super(...a);else super(now);}static now(){return now;}}window.Date=D2;"+
  "window.__errs=[];if(!window.__hook){window.__hook=1;window.addEventListener('error',function(e){window.__errs.push(String(e.message||e.error));});}"+
  "localStorage.setItem('yfs_otj_v1',raw);try{OTJ.reload();}catch(e){window.__errs.push('reload threw: '+e.message);}"+
  "['today','week','pto','more','today'].forEach(function(v){try{document.querySelector('nav.tabs [data-v='+v+']').click();}catch(e){window.__errs.push(v+' threw: '+e.message);}"+
  " var tx=document.body.innerText,m=tx.match(/.{0,30}(NaN|undefined|\\[object|Infinity|Invalid Date).{0,20}/);if(m)window.__errs.push(v+' shows: '+m[0]);if(/Couldn.t load the pay tables/.test(tx)||document.getElementById('viewErr'))window.__errs.push(v+' shows an error card');"+
  " if(v==='week'){window.__days=[].map.call(document.querySelectorAll('#sheet .tsd'),function(x){return x.dataset.day;});window.__net=(document.getElementById('wkNet')||{}).innerText;}});return true;";
const READ="var d=new Date(),tk=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),s=OTJ.state();"+
  "return {errs:window.__errs,today:tk,days:window.__days||[],net:window.__net||'',start:!!document.querySelector('[data-a=start]'),entries:JSON.stringify(s.entries),ws:s.settings&&s.settings.weekStart,per:s.settings&&s.settings.period,note:(document.getElementById('fixNote')||{innerText:''}).innerText};";
(async()=>{await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const d=await new Builder().usingServer('http://127.0.0.1:4444').withCapabilities({browserName:'MiniBrowser','webkitgtk:browserOptions':{binary:'/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser',args:['--automation','--user-agent='+UA]}}).build();
 const js=(s,...a)=>d.executeScript(s,...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{await d.manage().window().setRect({width:412,height:915});await d.get(O+'/job/');await wait(1200);
  ok(await js("return typeof window.OTJ==='object'&&!!OTJ.tax()"),'the app loads');
  for(const [name,D,LIST] of [['Sunday','2026-11-22',SETS],['Monday','2026-11-23',SETS],['Wednesday','2026-11-25',SETS],['Sunday (the setups that used to freeze the page)','2026-11-22',FREEZE],['Monday (the setups that used to freeze the page)','2026-11-23',FREEZE]]){const wrong=[];
   for(const k of Object.keys(LIST)){const st=state(D,LIST[k]);await js(LOAD,at(D,'12:00'),JSON.stringify(st));await wait(120);const r=await js(READ);const pr=r.errs.slice();
    if(r.today!==D)pr.push('page clock is '+r.today);if(!r.start)pr.push('no Start button');if(!(r.days.length===7&&r.days.indexOf(D)>=0))pr.push('Timesheet does not show today in a 7-day week');
    if(r.entries!==JSON.stringify(st.entries))pr.push('shifts changed');if(!([0,1,2,3,4,5,6].indexOf(r.ws)>=0&&['weekly','biweekly','semimonthly','monthly'].indexOf(r.per)>=0))pr.push('pay setup not repaired');
    if(!/couldn't be read/.test(r.note))pr.push('no note');if(!/^~\$[\d,]+\.\d\d$/.test(r.net))pr.push('take-home shows '+r.net);
    if(pr.length)wrong.push(k+' → '+pr.slice(0,3).join('; '));}
   ok(!wrong.length,name+' '+D+': '+Object.keys(LIST).length+' damaged pay setups open with no error; Start button, 7-day week with today, take-home a real amount, shifts kept, note shown '+wrong.slice(0,3).join(' || ').slice(0,600));}
  // a normal setup on the same Sunday: nothing repaired, no note
  const st=state('2026-11-22',SET());await js(LOAD,at('2026-11-22','12:00'),JSON.stringify(st));await wait(120);const r=await js(READ);
  ok(!r.errs.length&&!r.note&&r.ws===1&&r.per==='weekly'&&r.entries===JSON.stringify(st.entries)&&r.days[0]==='2026-11-16','Sunday, normal pay setup: no note, nothing changed, the week is still Monday Nov 16 to Sunday Nov 22 '+r.errs.join(' | '));
 }catch(e){ok(false,'test crashed: '+e.message);}
 try{await d.quit();}catch(_){}srv.close();console.log(fails?fails+' FAIL':'ALL PASS');process.exit(fails?1:0);})();
