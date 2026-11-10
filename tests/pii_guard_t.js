// PII guard: fails if any tracked text file contains a blocked term.
// Blocked terms are stored ONLY as sha256 hashes — never commit the plain names.
// How it matches: each file is lower-cased and split into words (letters/digits); every 1-, 2- and 3-word
// run is hashed and compared with the list. So "Some-Name", "some name" and "SOME NAME" all match "some name".
// Add a term (plain text stays on your machine):   node pii_guard_t.js --hash "some name"   → paste the hash below.
// Images are not scanned here (PNG screenshots are checked separately with OCR before commit).
// Usage: node tests/pii_guard_t.js [repoRoot]
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const norm=s=>(String(s).toLowerCase().match(/[a-z0-9]+/g)||[]).join(' ');
if(process.argv[2]==='--hash'){console.log(sha(norm(process.argv.slice(3).join(' '))));process.exit(0);}
const BLOCKED=new Set([
'ed872309250a9f1fe84330f0093758a4c7bc1d9bf7b4a3fc39f61aea4b3af867',
'c8ebf1e8489dde8bda6225ef3faf911834cf3194f54de8ca3269274bdca277cb',
'328d0bd3f699ce8051a1a65017395eec11d3b2089079dba8c060ddbb198b7957',
'723974260359c414efdd593a3e8798bae27b58cd8f71a971bb7eddbbe1f69b1e',
'961ec19a4c7539bb350fa6d496ce3f35278d8ad5faa051963c6994bebdd551fa',
'f7452e29f401a07555413a3a864087de7b61d40b0fa099799b2c726cf3326779',
'5fd3b8df8fcd8a0611bb6904a90cd6f6258de11895f53a9cd7e7b4bc829ed1ab',
'1fba32b3ed5098f78339e0005ed6919e81e2b5b8f7fd70e7872bbff20dbe4d7d',
'e2924ec50f788884a1cb59c2c73432e0a618aa47ab7e293d922043ea2d6eb9f4',
'c8adfbf878a5750a2caea8f251413dc3b1edc985f012ef0e57a751ca0745c6cc',
'384de0fd26e844704bcf55ceb46219a817a463f60f12e8813f5a30f8d993a650',
'6a4f2115cccfb5ed43a585c0a1b29af6b139070f27c044ca2d6d46ded9fa7821',
'd0c87f8aa78e9a631cbacb513d6541ed2513ef9deee629e0d46b2f9ef724e696',
'618d761c2b3dc0d05069e71b9942dd09b90c6c8829e5965b92b6147df9bb0ecd',
'5332df82e5090f2784fdb4c26d96d22f6c7b61b2cdf66da263080cdac4c2871f',
'5e23eb2aada0bcb01d67e27c0d2a31bc7c64c0731ad3fd50b12ac8502beea183',
'72d4f3f0f5c5b5fa41c9b31721c4c102d7281958f1e6d702bca9a45d1282251c',
'92b0659716c563d2ba51aa54db4dbcbd4e24b5adc26eddaaf5b875f1334502c2',
'03535e69902244ae5d24364003e734c23cad85e02b20e8cd344bed0b5b37211a',
'7d29cc8e81b193702c4625f536ed9c35f9e0972f9b648534392823fb9836147f',
'65b58547c7da39d89c2a7f9939432ef5b045f73a829cd8c923007a65ac378411',
'c4a0fba229529c70edef3e30e9fb880b35fcdc997dde4f2fae68a1da5b0d0dd6',
'7de90b42f31a9aaab997d430e318bb0a46c5742d0e597080c685c7493623869b',
]);
const ROOT=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const files=cp.execSync('git ls-files',{cwd:ROOT,maxBuffer:1<<26}).toString().split('\n').filter(Boolean)
  .filter(f=>!/\.(png|jpe?g|gif|webp|ico|pdf|docx?|zip|woff2?)$/i.test(f));
let hits=0;
for(const f of files){let t;try{t=fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){continue;}
  const lines=t.split('\n');
  for(let li=0;li<lines.length;li++){const w=lines[li].toLowerCase().match(/[a-z0-9]+/g)||[];
    for(let i=0;i<w.length;i++)for(let n=1;n<=3&&i+n<=w.length;n++){if(BLOCKED.has(sha(w.slice(i,i+n).join(' ')))){hits++;console.log('FAIL '+f+':'+(li+1)+' blocked term ('+n+' word'+(n>1?'s':'')+', hash '+sha(w.slice(i,i+n).join(' ')).slice(0,10)+'…)');}}}}
console.log(hits?hits+' FAIL':'PASS pii guard: 0 blocked terms in '+files.length+' text files ('+BLOCKED.size+' hashes)');
process.exit(hits?1:0);
