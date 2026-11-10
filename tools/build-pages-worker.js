#!/usr/bin/env node
// Builds the Cloudflare Pages "_worker.js" (advanced mode) that serves every page of yourfirstshiftapp.com.
// The bundle is one ES module: `const F=` + JSON file map + the router below. No bundler, no minifier, no secrets.
//
// Usage: node tools/build-pages-worker.js <siteDir> <files.json> <out _worker.js> [--dir-index]
//   files.json  ordered list of [urlPath, contentType]. Order matters only for byte-identical output.
//   --dir-index adds the folder-index line, so /job and /job/ serve /job/index.html. Use it for every new deploy.
//               Without it the output is the router production ran up to be89f333 (kept so that build can be reproduced).
//
// Same files + same list + same flag = the same bytes, every time: nothing here reads a clock, a random number or the environment.
// The router only reads the request path. It makes no network calls and has no bindings, so it cannot touch /api/*, checkout or
// /api/pro/verify (those live on a separate Worker); any path it has no file for answers 404 "Not found".
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');

const ROUTER_HEAD = ";const A={'/privacy':'/legal.html','/terms':'/legal.html'};const d=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0));export default{async fetch(req){const u=new URL(req.url);let p=u.pathname.replace(/\\/+$/,'')||'/';if(p==='/')p='/index.html';if(A[p])p=A[p];if(!F[p]&&F[p+'.html'])p=p+'.html';";
const DIR_INDEX = "if(!F[p]&&F[p+'/index.html'])p=p+'/index.html';";
const ROUTER_TAIL = "const f=F[p];if(!f)return new Response('Not found',{status:404});const html=f[1].startsWith('text/html');const cc=html?'public, max-age=60, must-revalidate':'public, max-age=86400';return new Response(d(f[0]),{headers:{'content-type':f[1],'cache-control':cc}});}};";

function router(dirIndex) { return ROUTER_HEAD + (dirIndex ? DIR_INDEX : '') + ROUTER_TAIL; }

// files: ordered [[urlPath, contentType], ...]. Every file, text or binary, is read as raw bytes and base64-encoded.
function build(siteDir, files, dirIndex) {
  const F = {};
  for (const [p, type] of files) {
    if (typeof p !== 'string' || p[0] !== '/' || p.indexOf('..') >= 0) throw new Error('Bad path in file list: ' + p);
    if (typeof type !== 'string' || !type) throw new Error('Missing content type for ' + p);
    if (Object.prototype.hasOwnProperty.call(F, p)) throw new Error('Path listed twice: ' + p);
    F[p] = [fs.readFileSync(path.join(siteDir, p)).toString('base64'), type];
  }
  return 'const F=' + JSON.stringify(F) + router(dirIndex);
}
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

module.exports = { build, router, sha256, ROUTER_HEAD, DIR_INDEX, ROUTER_TAIL };

if (require.main === module) {
  const [dir, list, out, flag] = process.argv.slice(2);
  if (!dir || !list || !out || (flag && flag !== '--dir-index')) { console.error('Usage: node tools/build-pages-worker.js <siteDir> <files.json> <out _worker.js> [--dir-index]'); process.exit(2); }
  const js = build(dir, JSON.parse(fs.readFileSync(list, 'utf8')), flag === '--dir-index');
  fs.writeFileSync(out, js);
  console.log(out, sha256(js), Buffer.byteLength(js));
}
