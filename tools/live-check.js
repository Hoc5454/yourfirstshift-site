#!/usr/bin/env node
// Is the site customers get the same as the code in this repository?
//
// Downloads every site file this repository holds (the list is tools/pages-files.json) and compares each one, byte for byte,
// with the same file at a branch or commit (default: main). When a file differs, it says which earlier version the site has.
//
// Read-only: it downloads public files the way a visitor's browser does. No keys, no cookies, no sign-in, nothing is changed.
// It never asks for /api/*, checkout or /api/pro/verify: only the paths in tools/pages-files.json.
//
// Usage: node tools/live-check.js [--base https://yourfirstshiftapp.com] [--ref main] [--md out.md]
//   --base  the site to read: the live site (default), a *.pages.dev preview, or localhost (for the test).
//   --ref   the branch or commit to compare with (default: main).
//   --md    also write the result to this file as a short table (GitHub shows it on the run page).
// Exit code: 0 = every file is the same · 1 = at least one file differs · 2 = the site could not be read · 3 = wrong usage
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIVE = 'https://yourfirstshiftapp.com';
const UA = 'yourfirstshift-live-check (+https://github.com/Hoc5454/yourfirstshift-site)';
const HISTORY = 500;      // how far back on the branch to look for the version the site has
const TRIES = 3;          // downloads per file before giving up
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
  const site = u.protocol === 'https:' && !u.port && (h === 'yourfirstshiftapp.com' || /^[a-z0-9-]+(\.[a-z0-9-]+)*\.pages\.dev$/.test(h));
  const local = u.protocol === 'http:' && (h === '127.0.0.1' || h === 'localhost');
  return site || local ? u.origin : null;
}
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
      const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA, 'cache-control': 'no-cache', accept: '*/*' }, signal: AbortSignal.timeout(30000) });
      const body = Buffer.from(await r.arrayBuffer());
      last = { status: r.status, body, why: 'HTTP ' + r.status };
      if (r.status < 500) return last;       // a 4xx will not change on a second try
    } catch (e) { last = { status: 0, why: String((e && e.cause && e.cause.code) || (e && e.name) || 'no answer') }; }
  }
  return last;
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
function explain(ref, file, live, want) {
  const id = blobId(live); const log = versions(ref, file);
  const at = log.findIndex(c => c.blob === id);
  if (at >= 0) {
    let newer = 0; for (let i = 0; i < at; i++) if (log[i].blob !== log[i + 1].blob) newer++;
    const c = log[at];
    return { kind: 'older', text: 'the site has an OLDER copy: the one this branch had as of ' + c.commit.slice(0, 7) + ' (' + when(c.date) + ', "' + c.subject.slice(0, 90) + '"). ' +
      newer + ' newer change' + (newer === 1 ? '' : 's') + ' to this file ' + (newer === 1 ? 'is' : 'are') + ' not on the site.' };
  }
  // not on this branch's line: the tip of another branch or a tag?
  const tips = (tryGit(['for-each-ref', '--format=%(refname:short)', 'refs/remotes', 'refs/heads', 'refs/tags']) || '').toString().split('\n').filter(x => x && !/\/HEAD$/.test(x));
  if (tips.length) {
    const ids = (tryGit(['cat-file', '--batch-check'], tips.map(t => t + ':' + file).join('\n') + '\n') || '').toString().split('\n');
    const hit = tips.filter((t, i) => (ids[i] || '').split(' ')[0] === id);
    if (hit.length) return { kind: 'branch', text: 'the site has the copy from ' + hit.slice(0, 3).join(', ') + (hit.length > 3 ? ' (and ' + (hit.length - 3) + ' more)' : '') + ', which is not what this branch has.' };
  }
  // the same file with something added on the way out (a host can add a line to a page)?
  const P = (() => { let i = 0; const n = Math.min(live.length, want.length); while (i < n && live[i] === want[i]) i++; return i; })();
  const S = (() => { let i = 0; const n = Math.min(live.length, want.length) - P; while (i < n && live[live.length - 1 - i] === want[want.length - 1 - i]) i++; return i; })();
  const show = b => JSON.stringify(b.toString('latin1').replace(/[^\x20-\x7e]/g, '.').slice(0, 200));
  if (live.length > want.length && P + S === want.length) {
    return { kind: 'added', text: 'the site has this branch\'s copy PLUS ' + num(live.length - want.length) + ' extra bytes at byte ' + num(P) + ': ' + show(live.subarray(P, live.length - S)) };
  }
  return { kind: 'unknown', text: 'the site\'s copy is NOT a version on this branch or at the tip of any branch. First difference at byte ' + num(P) + ': site ' + show(live.subarray(P, P + 80)) + ' · branch ' + show(want.subarray(P, P + 80)) };
}

// ── the check ──
async function check(base, ref) {
  const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'pages-files.json'), 'utf8'));
  const rows = []; let down = false;
  for (const [p] of list) {
    const file = p.replace(/^\//, ''); const want = blobAt(ref.sha, file);
    if (!want) continue;                                   // the home page, legal page and site icons are not in this repository
    const got = await download(base + p, down ? 1 : TRIES);  // once nothing answers at all, one try per file is enough
    if (!got.status) down = true;
    const row = { path: p, wantSha: sha256(want), wantSize: want.length };
    if (got.status !== 200 || !got.body) { row.state = 'unread'; row.note = got.why; }
    else {
      row.liveSha = sha256(got.body); row.liveSize = got.body.length;
      if (row.liveSha === row.wantSha) row.state = 'same';
      else { const e = explain(ref.sha, file, got.body, want); row.state = 'differs'; row.kind = e.kind; row.note = e.text; }
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
  else { verdict = 'THE SAME: all ' + rows.length + ' files on ' + base + ' are byte for byte the files at ' + refText + '.'; code = 0; }
  const stamp = when(new Date().toISOString());
  const word = { same: 'same', differs: 'DIFFERENT', unread: 'not read' };
  const lines = ['Site check: ' + base + ' compared with ' + refText + ', ' + stamp, ''];
  for (const r of rows) {
    lines.push((word[r.state] + '          ').slice(0, 10) + ' ' + r.path + '   ' + (r.liveSha ? 'site ' + num(r.liveSize) + ' B ' + r.liveSha.slice(0, 12) + '…' : 'site ' + r.note) +
      (r.state === 'same' ? '' : '   ·   ' + ref.name + ' ' + num(r.wantSize) + ' B ' + r.wantSha.slice(0, 12) + '…'));
    if (r.state === 'differs') lines.push('           ' + r.note);
  }
  lines.push('', verdict);
  // the table goes on a web page: text from the site must not be able to turn into a link, a tag or a table cell there
  const cell = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_\[\]()!#|~]/g, c => '\\' + c);
  const md = ['## ' + cell(verdict), '', 'Checked ' + stamp + '. Site: ' + base + '. Compared with: ' + cell(refText) + '.', '',
    '| File | Result | On the site | In the repository |', '|---|---|---|---|']
    .concat(rows.map(r => '| `' + r.path + '` | ' + (r.state === 'same' ? 'same' : r.state === 'differs' ? '**different**: ' + cell(r.note) : 'not read (' + cell(r.note) + ')') + ' | ' +
      (r.liveSha ? num(r.liveSize) + ' B `' + r.liveSha.slice(0, 12) + '…`' : '-') + ' | ' + num(r.wantSize) + ' B `' + r.wantSha.slice(0, 12) + '…` |'))
    .concat(['', 'This check only downloads public files. It changes nothing and deploys nothing.', '']);
  return { verdict, code, text: lines.join('\n'), md: md.join('\n') };
}

async function main(argv) {
  const arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const known = ['--base', '--ref', '--md'];
  if (argv.some((a, i) => (i % 2 === 0) !== (known.indexOf(a) >= 0)) || argv.length % 2) { console.error('Usage: node tools/live-check.js [--base ' + LIVE + '] [--ref main] [--md out.md]'); return 3; }
  const base = okBase(arg('--base') || LIVE);
  if (!base) { console.error('--base must be ' + LIVE + ', an https://….pages.dev preview, or http://localhost (no path).'); return 3; }
  const ref = resolveRef(arg('--ref') || 'main');
  if (!ref) { console.error('--ref: no such branch or commit here: ' + (arg('--ref') || 'main')); return 3; }
  const out = report(base, ref, await check(base, ref));
  console.log(out.text);
  if (arg('--md')) fs.appendFileSync(arg('--md'), out.md + '\n');
  return out.code;
}

module.exports = { okBase, resolveRef, check, report, main, sha256 };
if (require.main === module) main(process.argv.slice(2)).then(c => process.exit(c), e => { console.error(e && e.stack || e); process.exit(4); });
