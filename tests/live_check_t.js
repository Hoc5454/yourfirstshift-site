// tools/live-check.js ("is the site the same as the repository?") against a stand-in site on this machine.
// Nothing here touches the real site. Usage: node live_check_t.js ..
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),cp=require('child_process');
const ROOT=path.resolve(process.argv[2]||'..');const TOOL=path.join(ROOT,'tools','live-check.js');const T=require(TOOL);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const git=a=>cp.execFileSync('git',a,{cwd:ROOT,maxBuffer:512*1024*1024,stdio:['ignore','pipe','ignore']});const tryGit=a=>{try{return git(a);}catch(_){return null;}};
const LIST=JSON.parse(fs.readFileSync(path.join(ROOT,'tools','pages-files.json'),'utf8')).map(x=>x[0]);
// the site files this repository holds at HEAD, as committed
const HEADFILES={};for(const p of LIST){const b=tryGit(['show','HEAD:'+p.slice(1)]);if(b)HEADFILES[p]=b;}
const N=Object.keys(HEADFILES).length;const APP='/job/index.html';

// stand-in site: answers only what `site` holds; keeps a note of every request
let site={};const seen=[];
const srv=http.createServer((q,s)=>{seen.push({m:q.method,u:q.url,ua:q.headers['user-agent']||'',cookie:q.headers.cookie||'',auth:q.headers.authorization||''});
 const v=site[q.url];if(typeof v==='number'){s.writeHead(v,{'content-type':'text/plain'});s.end('no');return;}
 if(!v){s.writeHead(404,{'content-type':'text/plain'});s.end('Not found');return;}
 s.writeHead(200,{'content-type':'application/octet-stream'});s.end(v);});
const run=args=>new Promise(res=>cp.execFile('node',[TOOL].concat(args),{cwd:os.tmpdir(),maxBuffer:64*1024*1024},(e,out,err)=>res({code:e?(typeof e.code==='number'?e.code:-1):0,out:String(out),err:String(err)})));

(async()=>{
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const BASE='http://127.0.0.1:'+srv.address().port;
 ok(N>=5&&!!HEADFILES[APP]&&!!HEADFILES['/app.html']&&!!HEADFILES['/job/sw.js'],'0 the repository holds '+N+' of the site\'s '+LIST.length+' files, with the two apps among them');

 // ── 1. the site is the repository ──
 site=Object.assign({},HEADFILES);let r=await run(['--base',BASE,'--ref','HEAD']);
 ok(r.code===0&&r.out.indexOf('THE SAME: all '+N+' files')>=0&&!/DIFFERENT|not read/.test(r.out),'1a every file the same: says THE SAME for all '+N+', exit 0');
 const asked=seen.map(x=>x.u);
 ok(asked.length===N&&asked.every(u=>LIST.indexOf(u)>=0&&HEADFILES[u])&&!asked.some(u=>/\/api\/|\?|pro\/verify|checkout/.test(u)),'1b it asks only for listed files the repository holds, once each: no /api/ path, no query string ('+asked.length+' requests)');
 ok(seen.every(x=>x.m==='GET'&&!x.cookie&&!x.auth&&/^yourfirstshift-live-check /.test(x.ua)),'1c every request is a plain GET that names itself, with no cookie and no sign-in');
 const md=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'yfs-lc-')),'out.md');r=await run(['--base',BASE,'--ref','HEAD','--md',md]);const mdText=fs.existsSync(md)?fs.readFileSync(md,'utf8'):'';
 ok(r.code===0&&/^## THE SAME: all /.test(mdText)&&mdText.indexOf('| `'+APP+'` | same | ')>0&&mdText.indexOf(T.sha256(HEADFILES[APP]).slice(0,12))>0,'1d --md writes the answer as a heading and one table row per file, with size and hash');

 // ── 2. the site still has the version from before the last change ──
 const line=git(['log','--first-parent','-n','500','--format=%H','HEAD']).toString().split('\n').filter(Boolean);
 const idOf=c=>{const o=tryGit(['rev-parse','--verify','--quiet',c+':'+APP.slice(1)]);return o?o.toString().trim():'';};const now=idOf('HEAD');
 const olderAt=line.find(c=>{const i=idOf(c);return i&&i!==now;});
 if(!olderAt)console.log('SKIP 2 this checkout has no earlier version of '+APP+' in its history (shallow clone?)');
 else{site=Object.assign({},HEADFILES);site[APP]=git(['show',olderAt+':'+APP.slice(1)]);r=await run(['--base',BASE,'--ref','HEAD']);
  ok(r.code===1&&r.out.indexOf('NOT THE SAME: 1 of '+N+' files')>=0&&r.out.indexOf('differ from HEAD')>0&&r.out.trim().split('\n').pop().indexOf(APP+'.')>0,'2a an older Clocked In on the site: NOT THE SAME, names the one file, exit 1');
  ok(r.out.indexOf('OLDER copy: the one this branch had as of '+olderAt.slice(0,7)+' ')>0&&r.out.indexOf('1 newer change to this file is not on the site.')>0,'2b it says which commit the site\'s copy is from ('+olderAt.slice(0,7)+') and that 1 newer change is missing');
  ok((r.out.match(/^same /mg)||[]).length===N-1&&(r.out.match(/^DIFFERENT /mg)||[]).length===1,'2c the other '+(N-1)+' files still read as same');}

 // ── 3. copies that are no version at all ──
 const src=HEADFILES[APP];const cut=src.lastIndexOf('</body>');const extra=Buffer.from('@@added-by-host.js@@');
 site=Object.assign({},HEADFILES);site[APP]=Buffer.concat([src.subarray(0,cut),extra,src.subarray(cut)]);r=await run(['--base',BASE,'--ref','HEAD']);
 ok(cut>0&&src[cut-1]!==64&&r.code===1&&r.out.indexOf('PLUS '+extra.length+' extra bytes at byte '+cut.toLocaleString('en-US'))>0&&r.out.indexOf('added-by-host.js')>0,'3a the right file with a line added on the way out: NOT the same, and it shows the '+extra.length+' added bytes and where');
 const flipped=Buffer.from(src);const at=Math.floor(src.length/2);flipped[at]=flipped[at]===65?66:65;site[APP]=flipped;r=await run(['--base',BASE,'--ref','HEAD']);
 ok(r.code===1&&r.out.indexOf('NOT a version on this branch or at the tip of any branch. It differs from this branch\'s copy in 1 place:')>0&&r.out.indexOf('byte '+at.toLocaleString('en-US')+': site '+JSON.stringify(String.fromCharCode(flipped[at]))+' · branch '+JSON.stringify(String.fromCharCode(src[at])))>0,'3b one changed byte: NOT a version in this repository, and it shows the one place, with both bytes');
 // three separate changes: every one is listed, each at its own place
 const multi=Buffer.concat([src.subarray(0,1000),Buffer.from('#one#'),src.subarray(1000,5000),src.subarray(5040,90000),Buffer.from('#three#'),src.subarray(90010)]);site[APP]=multi;r=await run(['--base',BASE,'--ref','HEAD']);
 ok(r.code===1&&r.out.indexOf('in 3 places:')>0&&r.out.indexOf('byte 1,000: site "#one#" · branch (nothing)')>0&&r.out.indexOf('byte 5,005: site (nothing) · branch ')>0&&r.out.indexOf('byte 89,965: site "#three#" · branch ')>0,'3c three changes in one file (text added, text removed, text replaced): all three listed, each at its own byte');

 // ── 4. a site that cannot be read never reads as "the same" ──
 site={};for(const p of Object.keys(HEADFILES))site[p]=403;r=await run(['--base',BASE,'--ref','HEAD']);
 ok(r.code===2&&r.out.indexOf('COULD NOT READ THE SITE')>=0&&r.out.indexOf('HTTP 403 for all '+N+' files')>0&&r.out.indexOf('THE SAME')<0,'4a every file refused (403): COULD NOT READ THE SITE, exit 2, never "the same"');
 site=Object.assign({},HEADFILES);delete site['/job/sw.js'];r=await run(['--base',BASE,'--ref','HEAD']);
 ok(r.code===2&&r.out.indexOf('NOT FINISHED: 1 of '+N+' files could not be read (/job/sw.js HTTP 404)')>=0&&r.out.indexOf('THE SAME: all')<0,'4b one file missing on the site (404): NOT FINISHED, exit 2');
 site=Object.assign({},HEADFILES);site[APP]=Buffer.alloc(0);r=await run(['--base',BASE,'--ref','HEAD']);
 ok(r.code===1&&r.out.indexOf('NOT THE SAME: 1 of '+N)>=0,'4c an empty answer for a file is a difference, not a pass');

 // ── 5. Cloudflare's email protection on the way out (seen on the live /app.html, Nov 19 2026) ──
 // What it was seen to do: hide the first mailto link behind a key that is new on every download, drop the <!--email_off--> marker, add its decode script before the next <script.
 const RES='/app.html';const res=HEADFILES[RES];const CFS='<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>';
 const enc=(t,key)=>[key].concat(Array.from(Buffer.from(t)).map(c=>c^key)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const cfize=(buf,key,other)=>{let t=buf.toString('latin1');const m=/href="mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)"/.exec(t);if(!m)return null;
  const link='href="/cdn-cgi/l/email-protection#'+enc(other||m[1],key)+'"';t=t.slice(0,m.index)+link+t.slice(m.index+m[0].length);const had=t.indexOf('<!--email_off-->')>=0;t=t.replace('<!--email_off-->','');
  const at=t.indexOf('<script',m.index+link.length);if(at<0)return null;return {b:Buffer.from(t.slice(0,at)+CFS+t.slice(at),'latin1'),addr:m[1],had};};
 site=Object.assign({},HEADFILES);site[RES]=res;
 const c1=cfize(res,0x99),c2=cfize(res,0x07);
 if(!c1)console.log('SKIP 5 '+RES+' has no mailto link in its page markup to hide');
 else{
  ok(c1.b.length===res.length+(30+2*c1.addr.length)-(7+c1.addr.length)+CFS.length-(c1.had?16:0)&&!c1.b.equals(c2.b)&&c1.b.length===c2.b.length,'5a stand-in for the protected page: '+(c1.b.length-res.length)+' bytes larger than the file ('+res.length.toLocaleString('en-US')+' B → '+c1.b.length.toLocaleString('en-US')+' B), different bytes for each key');
  site[RES]=c1.b;r=await run(['--base',BASE,'--ref','HEAD']);site[RES]=c2.b;const rB=await run(['--base',BASE,'--ref','HEAD']);
  ok(r.code===0&&rB.code===0&&[r,rB].every(x=>x.out.indexOf('THE SAME: all '+N+' files')>=0&&x.out.indexOf('('+RES+' with Cloudflare\'s email protection undone; the rest byte for byte).')>0),'5b the resume app behind the email protection, with two different keys: THE SAME both times, and the answer names the file it undid it for');
  ok(r.out.indexOf('1 mailto link hidden from scrapers, its decode script added'+(c1.had?', 1 <!--email_off--> marker removed':'')+'. Everything else in the file is byte for byte the same.')>0&&r.out.indexOf('site '+c1.b.length.toLocaleString('en-US')+' B ')>0,'5c it says exactly what was undone, and shows the size the site really sent');
  const bent=Buffer.from(c1.b);const far=Math.floor(bent.length*0.6);bent[far]=bent[far]===65?66:65;site[RES]=bent;r=await run(['--base',BASE,'--ref','HEAD']);
  ok(r.code===1&&r.out.indexOf('NOT THE SAME: 1 of '+N)>=0&&r.out.indexOf('(with Cloudflare\'s email protection undone) the site\'s copy is NOT a version')>0&&r.out.indexOf('in 1 place:')>0,'5d the protected page with one more byte changed: NOT THE SAME, and only that one place is listed');
  site[RES]=cfize(res,0x3c,'billing@example.org').b;r=await run(['--base',BASE,'--ref','HEAD']);
  ok(r.code===1&&r.out.indexOf('billing@example.org')>0&&r.out.indexOf('THE SAME: all')<0,'5e a hidden address that is not the one in the file: NOT THE SAME, and the other address is shown');
  const bad=cfize(res,0x21,'x"><img src=x onerror=1>').b;const u=T.undoEmailProtection(bad),u1=T.undoEmailProtection(c1.b),u0=T.undoEmailProtection(res);
  ok(u.links===0&&u.bytes.toString('latin1').indexOf('/cdn-cgi/l/email-protection#')>0&&u.bytes.toString('latin1').indexOf('<img src=x')<0&&u1.links===1&&u1.scripts===1&&u0.links===0&&u0.scripts===0&&u0.bytes.equals(res),'5f only a plain address is put back: hidden text that is not an address is left as it came; a page with no protection comes back untouched');
  const resLine=git(['log','--first-parent','-n','500','--format=%H','HEAD']).toString().split('\n').filter(Boolean);const rid=c=>{const o=tryGit(['rev-parse','--verify','--quiet',c+':'+RES.slice(1)]);return o?o.toString().trim():'';};const rnow=rid('HEAD');
  const rOld=resLine.find(c=>{const i=rid(c);return i&&i!==rnow;});const oldCf=rOld?cfize(git(['show',rOld+':'+RES.slice(1)]),0x5a):null;
  if(!oldCf)console.log('SKIP 5g no earlier version of '+RES+' with a mailto link in this checkout\'s history');
  else{site[RES]=oldCf.b;r=await run(['--base',BASE,'--ref','HEAD']);
   ok(r.code===1&&r.out.indexOf('(with Cloudflare\'s email protection undone) the site has an OLDER copy: the one this branch had as of '+rOld.slice(0,7)+' ')>0,'5g an OLDER resume app behind the email protection is still named by its commit ('+rOld.slice(0,7)+')');}
  site[RES]=res;site['/job/sw.js']=Buffer.concat([HEADFILES['/job/sw.js'],Buffer.from(CFS)]);r=await run(['--base',BASE,'--ref','HEAD']);
  ok(r.code===1&&r.out.indexOf('NOT THE SAME: 1 of '+N)>=0&&r.out.trim().split('\n').pop().indexOf('/job/sw.js.')>0&&r.out.indexOf('PLUS '+CFS.length+' extra bytes')>0,'5h nothing is undone in a file that is not a page: the same script added to sw.js is a plain difference');}

 // ── 6. what it may be pointed at, and a site that is not there ──
 srv.close();r=await run(['--base',BASE,'--ref','HEAD']);
 ok(r.code===2&&r.out.indexOf('COULD NOT READ THE SITE')>=0&&r.out.indexOf('THE SAME: all')<0,'6a nothing answering at all: COULD NOT READ THE SITE, exit 2');
 const good=['https://yourfirstshiftapp.com','https://yourfirstshiftapp.com/','https://abc123.yourfirstshift.pages.dev','http://127.0.0.1:8123','http://localhost:8123'];
 const bad=['http://yourfirstshiftapp.com','https://www.example.com','https://yourfirstshiftapp.com.example.com','https://examplepages.dev','https://x.pages.dev.example.com','https://user:pw@yourfirstshiftapp.com',
  'https://yourfirstshiftapp.com/?a=1','https://yourfirstshiftapp.com/api/pro/verify','https://yourfirstshiftapp.com:8443','ftp://yourfirstshiftapp.com','file:///etc/passwd','yourfirstshiftapp.com',''];
 ok(good.every(b=>T.okBase(b))&&bad.every(b=>!T.okBase(b)),'6b --base: only the live site, a *.pages.dev preview or localhost; no other host, no path, no query, no sign-in ('+good.length+' allowed, '+bad.length+' refused)');
 ok(['--upload-pack=x','-n','a..b','main;id','$(id)','a b',''].every(x=>!T.resolveRef(x))&&!!T.resolveRef('HEAD')&&T.resolveRef('HEAD').sha===git(['rev-parse','HEAD']).toString().trim(),'6c --ref: a plain branch name or commit only; nothing that could be read as an option or a command');
 r=await run(['--base','https://www.example.com']);const r2=await run(['--ref','no-such-branch-here']);const r3=await run(['--bogus','1']);const r4=await run(['--base']);
 ok(r.code===3&&r2.code===3&&r3.code===3&&r4.code===3&&!/THE SAME/.test(r.out+r2.out+r3.out+r4.out),'6d a refused site, an unknown branch, an unknown option and a missing value all stop with exit 3 before anything is downloaded');

 console.log(fails?'\n'+fails+' FAILED':'\nALL PASS');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
