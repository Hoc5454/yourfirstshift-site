#!/usr/bin/env node
// Is the site customers get the same as the code in this repository?
//
// Downloads every site file this repository holds (the list is tools/pages-files.json) and compares each one, byte for byte,
// with the same file at a branch or commit (default: main). When a file differs, it says which earlier version the site has.
//
// One thing is allowed for: on yourfirstshiftapp.com Cloudflare hides email addresses in a page on the way out (see
// "Cloudflare's email protection" below). The check undoes exactly that edit before comparing, and says so in its answer.
//
// Read-only: it downloads public files the way a visitor's browser does. No keys, no cookies, no sign-in, nothing is changed.
// It never asks for /api/*, checkout or /api/pro/verify: only the paths in tools/pages-files.json.
// A redirect is followed only to the same path on the same site (the plain address passes visitors on to www); see okHop().
//
// Usage: node tools/live-check.js [--base https://yourfirstshiftapp.com] [--ref main] [--md out.md]
//   --base  the site to read: the live site (default; with or without www), a *.pages.dev preview, or localhost (for the test).
//   --ref   the branch or commit to compare with (default: main).
//   --md    also write the result to this file as a short table (GitHub shows it on the run page).
// Exit code: 0 = every file is the same · 1 = at least one file differs · 2 = the site could not be read · 3 = wrong usage
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIVE = 'https://yourfirstshiftapp.com';
const LIVE_HOSTS = ['yourfirstshiftapp.com', 'www.yourfirstshiftapp.com'];   // the plain address answers 301 and passes visitors on to www
const UA = 'yourfirstshift-live-check (+https://github.com/Hoc5454/yourfirstshift-site)';
const HISTORY = 500;      // how far back on the branch to look for the version the site has
const TRIES = 3;          // downloads per file before giving up
const HOPS = 5;           // redirects followed for one file before giving up
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const num = n => n.toLocaleString('en-US');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const git = (args, input) => cp.execFileSync('git', args, { cwd: ROOT, input, maxBuffer: 512 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] });
const tryGit = (args, input) => { try { return git(args, input); } catch (_) { return null; } };
const when = iso => new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET';

// ── what to read ──
function okBase(b) {
  let u; try { u = new URL(b); } catch (_) { return null; }
  if (u.username || u.password || u.search || u.hash || (u.pathname !== '/' && u.pathname !== '')) return null;
  const h = u.hostname;
  const site = u.protocol === 'https:' && !u.port && (LIVE_HOSTS.indexOf(h) >= 0 || /^[a-z0-9-]+(\.[a-z0-9-]+)*\.pages\.dev$/.test(h));
  const local = u.protocol === 'http:' && isLocal(h);
  return site || local ? u.origin : null;
}
const isLocal = h => h === '127.0.0.1' || h === 'localhost';
// May a redirect from one address to another be followed? Only when it is the same file on the same site:
// the same path and no query, on the same host or between the plain address and www. Never to any other host (not even
// another *.pages.dev), never to another path (so nothing outside tools/pages-files.json is ever asked for), never from
// https down to http, never to an address with a sign-in in it. `from` and `to` are URL objects.
function okHop(from, to) {
  if (to.username || to.password || to.pathname !== from.pathname || to.search || from.search) return false;
  if (from.protocol === 'https:') return to.protocol === 'https:' && !to.port && (to.hostname === from.hostname || (LIVE_HOSTS.indexOf(from.hostname) >= 0 && LIVE_HOSTS.indexOf(to.hostname) >= 0));
  return from.protocol === 'http:' && to.protocol === 'http:' && isLocal(from.hostname) && isLocal(to.hostname);   // the stand-in site the test runs
}
// where a redirect pointed, for the report: text from the site, so only plain characters and not much of it
const place = u => (u.origin + u.pathname).replace(/[^\x21-\x7e]/g, '?').slice(0, 120);
function resolveRef(r) {
  if (typeof r !== 'string' || !/^[A-Za-z0-9._\/-]{1,120}$/.test(r) || r[0] === '-' || r.indexOf('..') >= 0) return null;
  const exact = r === 'HEAD' || /^[0-9a-f]{7,64}$/.test(r);
  const remotes = (tryGit(['remote']) || '').toString().split('\n').filter(Boolean);
  // a branch name means the copy fetched from GitHub when there is one (a local branch can be days old)
  const tries = exact ? [r] : remotes.map(x => x + '/' + r).concat([r]);
  for (const c of tries) {
    const o = tryGit(['rev-parse', '--verify', '--quiet', c + '^{commit}']);
    if (o) return { name: c, sha: o.toString().trim() };
  }
  return null;
}
const blobAt = (commit, file) => tryGit(['show', commit + ':' + file]);
// the git id of these exact bytes, to find them in history without reading every old copy
const blobId = bytes => git(['hash-object', '--no-filters', '--stdin'], bytes).toString().trim();

// ── one download ──
async function download(url, tries) {
  let last = { status: 0, why: 'no answer' };
  for (let i = 0; i < tries; i++) {
    if (i) await sleep(1500);
    try {
      // redirects are followed by hand, one at a time, so each one can be checked before anything is asked of the next address
      let at = new URL(url), r;
      for (let hops = 0; ; hops++) {
        r = await fetch(at, { redirect: 'manual', headers: { 'user-agent': UA, 'cache-control': 'no-cache', accept: '*/*' }, signal: AbortSignal.timeout(30000) });
        if ([301, 302, 303, 307, 308].indexOf(r.status) < 0) break;
        const loc = r.headers.get('location'); let to = null; try { if (loc) to = new URL(loc, at); } catch (_) { /* no usable address */ }
        try { if (r.body) await r.body.cancel(); } catch (_) { /* nothing to drop */ }
        // a refused redirect is an answer, not a hiccup: no second try
        if (!to || !okHop(at, to)) return { status: r.status, why: 'HTTP ' + r.status + ' (a redirect to ' + (to ? place(to) : 'nowhere') + ', which this check does not follow)' };
        if (hops >= HOPS) return { status: r.status, why: 'HTTP ' + r.status + ' (more than ' + HOPS + ' redirects in a row)' };
        at = to;
      }
      const body = Buffer.from(await r.arrayBuffer());
      last = { status: r.status, body, why: 'HTTP ' + r.status, via: at.host !== new URL(url).host ? at.host : '' };
      if (r.status < 500) return last;       // a 4xx will not change on a second try
    } catch (e) { last = { status: 0, why: String((e && e.cause && e.cause.code) || (e && e.name) || 'no answer') }; }
  }
  return last;
}

// ── Cloudflare's email protection ──
// On yourfirstshiftapp.com (not on *.pages.dev previews) Cloudflare hides email addresses in a page from scrapers on the way
// out. Seen on /app.html, Nov 19 2026:
//   href="mailto:someone@site.com"  becomes  href="/cdn-cgi/l/email-protection#<hex>"
//       (hex = one key byte, then every character of the address XOR that key; the key is new on every download)
//   its decode script is added:  <script data-cfasync="false" src="/cdn-cgi/scripts/<id>/cloudflare-static/email-decode.min.js"></script>
//   the marker <!--email_off-->, which tells it to leave part of a page alone, is removed
// So the bytes a visitor gets are never the uploaded bytes, and never twice the same. undoEmailProtection() reverses those
// edits and nothing else. Markers are left out of both copies for the comparison, since only Cloudflare reads them.
const CF_SIGN = /\/cdn-cgi\/(l\/email-protection#|scripts\/[0-9a-f]+\/cloudflare-static\/email-decode\.min\.js)/;
const CF_LINK = /\/cdn-cgi\/l\/email-protection#([0-9a-f]{4,})/g;
const CF_SCRIPT = /<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[0-9a-f]+\/cloudflare-static\/email-decode\.min\.js"><\/script>/g;
const CF_MARK = /<!--\/?email_off-->/g;
function undoEmailProtection(live) {
  let links = 0, scripts = 0;
  let s = live.toString('latin1').replace(CF_LINK, (all, hex) => {
    if (hex.length % 2) return all;
    const key = parseInt(hex.slice(0, 2), 16); let out = '';
    for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
    // only a plain address (with at most a simple ?subject=…) is put back; anything else stays as it came and shows as a difference
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(\?[A-Za-z0-9._~%+=-]*)?$/.test(out)) return all;
    links++; return 'mailto:' + out;
  });
  s = s.replace(CF_SCRIPT, () => { scripts++; return ''; });
  return { bytes: Buffer.from(s, 'latin1'), links, scripts };
}
const marks = b => (b.toString('latin1').match(CF_MARK) || []).length;
// What only Cloudflare reads or adds, left out of a page: its markers and its decode script. Nothing else.
const bare = b => Buffer.from(b.toString('latin1').replace(CF_MARK, '').replace(CF_SCRIPT, ''), 'latin1');
// A page that came through the email protection, made ready to compare with the repository's copy. null when the live copy
// shows no sign of it. The decode script is left out of BOTH copies: a file that already carries that script from an earlier
// save (the home page does, Nov 19 2026) has it taken out of its place and put back elsewhere by Cloudflare on the way out,
// so on either side the script is Cloudflare's, not ours. Every other byte still has to match.
function throughCf(live, want) {
  if (!CF_SIGN.test(live.toString('latin1'))) return null;
  const u = undoEmailProtection(live);
  return { a: bare(u.bytes), b: bare(want), links: u.links, scripts: u.scripts, own: (want.toString('latin1').match(CF_SCRIPT) || []).length, marks: Math.max(0, marks(want) - marks(u.bytes)) };
}

// ── which earlier version is this? ──
// Walks the branch's own line of commits (merges count once), newest first.
function versions(ref, file) {
  const log = (tryGit(['log', '--first-parent', '-n', String(HISTORY), '--format=%H%x09%cI%x09%s', ref]) || '').toString().split('\n').filter(Boolean)
    .map(l => { const p = l.split('\t'); return { commit: p[0], date: p[1], subject: p.slice(2).join('\t') }; });
  if (!log.length) return [];
  const out = (tryGit(['cat-file', '--batch-check'], log.map(c => c.commit + ':' + file).join('\n') + '\n') || '').toString().split('\n');
  log.forEach((c, i) => { const m = /^([0-9a-f]{40,64}) blob \d+$/.exec(out[i] || ''); c.blob = m ? m[1] : ''; });
  return log;
}
// `live` and `want` are what gets compared. With `loose` (a page that came through the email protection) they are the copies
// with that undone and the markers left out, and an old version counts as found when it is the same in that form.
function explain(ref, file, live, want, loose) {
  const log = versions(ref, file);
  const tips = (tryGit(['for-each-ref', '--format=%(refname:short)', 'refs/remotes', 'refs/heads', 'refs/tags']) || '').toString().split('\n').filter(x => x && !/\/HEAD$/.test(x));
  const tipIds = tips.length ? (tryGit(['cat-file', '--batch-check'], tips.map(t => t + ':' + file).join('\n') + '\n') || '').toString().split('\n').map(l => { const m = /^([0-9a-f]{40,64}) blob \d+$/.exec(l); return m ? m[1] : ''; }) : [];
  // the git id (or ids) the site's copy has in this repository
  let ids;
  if (!loose) ids = [blobId(live)];
  else {
    const liveSha = sha256(live); ids = [];
    const all = []; log.forEach(c => { if (c.blob && all.indexOf(c.blob) < 0) all.push(c.blob); }); tipIds.forEach(i => { if (i && all.indexOf(i) < 0) all.push(i); });
    for (const id of all.slice(0, 150)) { const b = tryGit(['cat-file', 'blob', id]); if (b && sha256(bare(b)) === liveSha) ids.push(id); }
  }
  const at = log.findIndex(c => ids.indexOf(c.blob) >= 0);
  if (at >= 0) {
    let newer = 0; for (let i = 0; i < at; i++) if (log[i].blob !== log[i + 1].blob) newer++;
    const c = log[at];
    return { kind: 'older', text: 'the site has an OLDER copy: the one this branch had as of ' + c.commit.slice(0, 7) + ' (' + when(c.date) + ', "' + c.subject.slice(0, 90) + '"). ' +
      newer + ' newer change' + (newer === 1 ? '' : 's') + ' to this file ' + (newer === 1 ? 'is' : 'are') + ' not on the site.' };
  }
  // not on this branch's line: the tip of another branch or a tag?
  // the same branch shows up once per place git keeps it (origin/x and a local x): name it once, without the "origin/"
  const remotes = (tryGit(['remote']) || '').toString().split('\n').filter(Boolean);
  const plain = t => { const r = remotes.find(x => t.indexOf(x + '/') === 0); return r ? t.slice(r.length + 1) : t; };
  const hit = tips.filter((t, i) => ids.indexOf(tipIds[i]) >= 0).map(plain).filter((t, i, a) => a.indexOf(t) === i);
  if (hit.length) return { kind: 'branch', text: 'the site has the copy from ' + hit.slice(0, 3).join(', ') + (hit.length > 3 ? ' (and ' + (hit.length - 3) + ' more)' : '') + ', not the copy on this branch.' };
  // no version at all: show every place it differs from this branch's copy, so a person can see what was changed
  const show = b => JSON.stringify(b.toString('latin1').replace(/[^\x20-\x7e]/g, '.').slice(0, 160)) + (b.length > 160 ? '… (' + num(b.length) + ' B)' : '');
  const diff = regions(live, want, 12);
  if (diff.length === 1 && !diff[0].want.length && !diff[0].open) {
    return { kind: 'added', text: 'the site has this branch\'s copy PLUS ' + num(diff[0].live.length) + ' extra bytes at byte ' + num(diff[0].at) + ': ' + show(diff[0].live) };
  }
  return { kind: 'unknown', text: 'the site\'s copy is NOT a version on this branch or at the tip of any branch. It differs from this branch\'s copy in ' +
    (diff.more ? 'more than ' : '') + diff.length + ' place' + (diff.length === 1 ? '' : 's') + ':' +
    diff.map(d => '\n             byte ' + num(d.at) + ': site ' + (d.live.length ? show(d.live) : '(nothing)') + ' · branch ' + (d.want.length ? show(d.want) : '(nothing)') + (d.open ? ' (the rest could not be lined up)' : '')).join('') };
}

// Every place two nearly identical files differ, at most `max` places. After a difference it looks for the nearest run of
// 24 bytes that both files have again, within 6,000 bytes, and carries on from there.
function regions(live, want, max) {
  const W = 24, REACH = 6000; const out = []; let i = 0, j = 0;
  for (;;) {
    while (i < live.length && j < want.length && live[i] === want[j]) { i++; j++; }
    if (i >= live.length && j >= want.length) break;
    if (out.length >= max) { out.more = true; break; }
    const seen = new Map();
    for (let dj = 0; dj <= REACH && j + dj + W <= want.length; dj++) { const k = want.toString('latin1', j + dj, j + dj + W); if (!seen.has(k)) seen.set(k, dj); }
    let hit = null;
    for (let di = 0; di <= REACH && i + di + W <= live.length; di++) { const dj = seen.get(live.toString('latin1', i + di, i + di + W)); if (dj !== undefined) { hit = [di, dj]; break; } }
    // nothing lines up again nearby: what is left of each file, less the ending they share, is the last difference
    if (!hit) {
      let e = 0; const n = Math.min(live.length - i, want.length - j); while (e < n && live[live.length - 1 - e] === want[want.length - 1 - e]) e++;
      const a = live.subarray(i, live.length - e), b = want.subarray(j, want.length - e);
      out.push({ at: i, live: a, want: b, open: a.length > REACH || b.length > REACH }); break;
    }
    out.push({ at: i, live: live.subarray(i, i + hit[0]), want: want.subarray(j, j + hit[1]) });
    i += hit[0]; j += hit[1];
  }
  return out;
}

// ── the check ──
async function check(base, ref) {
  const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'pages-files.json'), 'utf8'));
  const rows = []; let down = false;
  for (const [p, type] of list) {
    const file = p.replace(/^\//, ''); const want = blobAt(ref.sha, file);
    if (!want) continue;                                   // the home page, legal page and site icons are not in this repository
    const got = await download(base + p, down ? 1 : TRIES);  // once nothing answers at all, one try per file is enough
    if (!got.status) down = true;
    const row = { path: p, wantSha: sha256(want), wantSize: want.length };
    if (got.status !== 200 || !got.body) { row.state = 'unread'; row.note = got.why; }
    else {
      row.liveSha = sha256(got.body); row.liveSize = got.body.length; if (got.via) row.via = got.via;
      if (row.liveSha === row.wantSha) row.state = 'same';
      else {
        // a page that came through Cloudflare's email protection: compare with that undone
        const cf = /^text\/html/.test(type) ? throughCf(got.body, want) : null;
        const a = cf ? cf.a : got.body, b = cf ? cf.b : want;
        if (cf && sha256(a) === sha256(b)) { row.state = 'same'; row.cf = { links: cf.links, scripts: cf.scripts, own: cf.own, marks: cf.marks }; }
        else { const e = explain(ref.sha, file, a, b, !!cf); row.state = 'differs'; row.kind = e.kind; row.note = (cf ? '(with Cloudflare\'s email protection undone) ' : '') + e.text; }
      }
    }
    rows.push(row);
  }
  return rows;
}

function report(base, ref, rows) {
  const same = rows.filter(r => r.state === 'same'), differs = rows.filter(r => r.state === 'differs'), unread = rows.filter(r => r.state === 'unread');
  const refText = ref.name + ' (' + ref.sha.slice(0, 7) + ')';
  let verdict, code;
  if (!rows.length) { verdict = 'NOTHING TO COMPARE: ' + refText + ' holds none of the site\'s files.'; code = 3; }
  else if (unread.length === rows.length) { verdict = 'COULD NOT READ THE SITE: ' + base + ' answered ' + unread[0].note + ' for all ' + rows.length + ' files. This says nothing about what is live.'; code = 2; }
  else if (differs.length) { verdict = 'NOT THE SAME: ' + differs.length + ' of ' + rows.length + ' files on ' + base + ' differ from ' + refText + ': ' + differs.map(r => r.path).join(', ') + '.'; code = 1; }
  else if (unread.length) { verdict = 'NOT FINISHED: ' + unread.length + ' of ' + rows.length + ' files could not be read (' + unread.map(r => r.path + ' ' + r.note).join(', ') + '). The other ' + same.length + ' are the same as ' + refText + '.'; code = 2; }
  else {
    const cf = rows.filter(r => r.cf);
    verdict = 'THE SAME: all ' + rows.length + ' files on ' + base + ' are the files at ' + refText +
      (cf.length ? ' (' + cf.map(r => r.path).join(', ') + ' with Cloudflare\'s email protection undone; the rest byte for byte).' : ', byte for byte.'); code = 0;
  }
  const cfNote = r => 'Cloudflare\'s email protection, undone for the comparison: ' + r.cf.links + ' mailto link' + (r.cf.links === 1 ? '' : 's') + ' hidden from scrapers' +
    (r.cf.scripts ? (r.cf.own ? ', its decode script moved (the file already carries one)' : ', its decode script added') : '') + (r.cf.marks ? ', ' + r.cf.marks + ' <!--email_off--> marker' + (r.cf.marks === 1 ? '' : 's') + ' removed' : '') +
    '. Everything else in the file is byte for byte the same.';
  const stamp = when(new Date().toISOString());
  const word = { same: 'same', differs: 'DIFFERENT', unread: 'not read' };
  // when the address asked passed the requests on (the plain address does, to www), say where the files were really read
  const via = rows.map(r => r.via).filter((v, i, a) => v && a.indexOf(v) === i);
  const viaNote = via.length ? base.replace(/^https?:\/\//, '') + ' passed ' + (rows.every(r => r.via) ? 'every request' : rows.filter(r => r.via).length + ' of ' + rows.length + ' requests') + ' on to ' + via.join(', ') + ', so those files were read from there.' : '';
  const lines = ['Site check: ' + base + ' compared with ' + refText + ', ' + stamp].concat(viaNote ? [viaNote] : [], ['']);
  for (const r of rows) {
    lines.push((word[r.state] + '          ').slice(0, 10) + ' ' + r.path + '   ' + (r.liveSha ? 'site ' + num(r.liveSize) + ' B ' + r.liveSha.slice(0, 12) + '…' : 'site ' + r.note) +
      (r.state === 'same' && !r.cf ? '' : '   ·   ' + ref.name + ' ' + num(r.wantSize) + ' B ' + r.wantSha.slice(0, 12) + '…'));
    if (r.state === 'differs') lines.push('           ' + r.note);
    if (r.cf) lines.push('           ' + cfNote(r));
  }
  lines.push('', verdict);
  // the table goes on a web page: text from the site must not be able to turn into a link, a tag or a table cell there
  const cell = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_\[\]()!#|~]/g, c => '\\' + c);
  const md = ['## ' + cell(verdict), '', 'Checked ' + stamp + '. Site: ' + base + '. Compared with: ' + cell(refText) + '.' + (viaNote ? ' ' + cell(viaNote) : ''), '',
    '| File | Result | On the site | In the repository |', '|---|---|---|---|']
    .concat(rows.map(r => '| `' + r.path + '` | ' + (r.state === 'same' ? 'same' + (r.cf ? ' (' + cell(cfNote(r)) + ')' : '') : r.state === 'differs' ? '**different**: ' + cell(r.note) : 'not read (' + cell(r.note) + ')') + ' | ' +
      (r.liveSha ? num(r.liveSize) + ' B `' + r.liveSha.slice(0, 12) + '…`' : '-') + ' | ' + num(r.wantSize) + ' B `' + r.wantSha.slice(0, 12) + '…` |'))
    .concat(['', 'This check only downloads public files. It changes nothing and deploys nothing.', '']);
  return { verdict, code, text: lines.join('\n'), md: md.join('\n') };
}

async function main(argv) {
  const arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const known = ['--base', '--ref', '--md'];
  if (argv.some((a, i) => (i % 2 === 0) !== (known.indexOf(a) >= 0)) || argv.length % 2) { console.error('Usage: node tools/live-check.js [--base ' + LIVE + '] [--ref main] [--md out.md]'); return 3; }
  const base = okBase(arg('--base') || LIVE);
  if (!base) { console.error('--base must be ' + LIVE + ' (with or without www), an https://….pages.dev preview, or http://localhost (no path).'); return 3; }
  const ref = resolveRef(arg('--ref') || 'main');
  if (!ref) { console.error('--ref: no such branch or commit here: ' + (arg('--ref') || 'main')); return 3; }
  const out = report(base, ref, await check(base, ref));
  console.log(out.text);
  if (arg('--md')) fs.appendFileSync(arg('--md'), out.md + '\n');
  return out.code;
}

module.exports = { okBase, okHop, resolveRef, check, report, main, sha256, undoEmailProtection, throughCf };
if (require.main === module) main(process.argv.slice(2)).then(c => process.exit(c), e => { console.error(e && e.stack || e); process.exit(4); });
