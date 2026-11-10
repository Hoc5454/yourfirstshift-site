/**
 * YourFirstShift Worker — sanitized GitHub attachment (PREP ONLY; not deployed).
 * Provenance: LIVE Cloudflare script `yourfirstshift` content/v2 download Nov 6, 2026 America/New_York
 * sha256 matches shared-box /workspace/yfs-qa/worker-p09/worker.js (byte-identical).
 * Secrets: NONE embedded. Use Cloudflare/Wrangler secret bindings by NAME only (see INSTRUCTIONS).
 * Do not commit .dev.vars or secret values. No behavior edits in this prep pack.
 */
const LANDING_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YourFirstShift™ — AI Job Tools for Everyday Workers</title>
<meta name="description" content="Free AI-powered resume builder, cover letter generator, ATS scanner, and interview prep — built for tradespeople, drivers, warehouse workers, and everyday 9-5 workers.">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --orange: #FF6B35;
  --orange-dark: #e85a24;
  --orange-lite: #FFF3EE;
  --blue: #3B82F6;
  --blue-lite: #EFF6FF;
  --green: #10B981;
  --green-lite: #ECFDF5;
  --bg: #F8FAFC;
  --white: #FFFFFF;
  --border: #E2E8F0;
  --text: #1E293B;
  --muted: #64748B;
  --light: #94A3B8;
  --radius: 12px;
}
html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; }
a { text-decoration: none; color: inherit; }

/* ── NAV ── */
.nav {
  background: var(--white); border-bottom: 1px solid var(--border);
  padding: 14px 24px; display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.logo { font-size: 20px; font-weight: 800; letter-spacing: -.01em; }
.logo .your { color: var(--text); }
.logo .first { color: var(--orange); }
.logo .shift { color: var(--text); }
.logo sup { font-size: 10px; color: var(--light); }
.nav-links { display: flex; align-items: center; gap: 20px; }
.nav-links a { font-size: 14px; font-weight: 600; color: var(--muted); transition: color .2s; }
.nav-links a:hover { color: var(--orange); }
.nav-cta {
  background: var(--orange); color: #fff; padding: 9px 20px;
  border-radius: 8px; font-size: 14px; font-weight: 700;
  transition: all .2s; white-space: nowrap;
}
.nav-cta:hover { background: var(--orange-dark); color: #fff; transform: translateY(-1px); }
.nav-sign { font-size: 14px; font-weight: 600; color: var(--blue); }
.nav-sign:hover { color: var(--blue); opacity: .8; }
@media(max-width:640px){ .nav-links { display: none; } }

/* ── HERO ── */
.hero {
  max-width: 860px; margin: 0 auto; padding: 72px 24px 80px;
  text-align: center;
}
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--orange-lite); border: 1px solid rgba(255,107,53,.2);
  color: var(--orange); padding: 6px 18px; border-radius: 20px;
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  margin-bottom: 24px;
}
.hero h1 {
  font-size: clamp(30px, 6vw, 52px); font-weight: 800;
  line-height: 1.1; letter-spacing: -.025em; margin-bottom: 20px; color: var(--text);
}
.hero h1 .accent { color: var(--orange); }
.hero .sub {
  font-size: clamp(16px, 2.5vw, 19px); color: var(--muted);
  max-width: 600px; margin: 0 auto 36px; line-height: 1.65;
}
.hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 48px; }
.btn-primary {
  background: var(--orange); color: #fff; padding: 16px 32px;
  border-radius: 10px; font-size: 16px; font-weight: 800;
  transition: all .2s; display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(255,107,53,.25);
}
.btn-primary:hover { background: var(--orange-dark); transform: translateY(-2px); box-shadow: 0 6px 28px rgba(255,107,53,.35); color: #fff; }
.btn-secondary {
  background: var(--white); color: var(--text); padding: 16px 32px;
  border-radius: 10px; font-size: 16px; font-weight: 700;
  border: 1px solid var(--border); transition: all .2s;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.btn-secondary:hover { border-color: var(--orange); color: var(--orange); transform: translateY(-1px); }

/* TRUST BADGES */
.trust-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.trust-badge {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 20px; padding: 7px 16px; font-size: 13px;
  color: var(--muted); display: flex; align-items: center; gap: 7px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.trust-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; }

/* ── SOCIAL PROOF BANNER ── */
.proof-bar {
  background: var(--white); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  padding: 16px 24px; text-align: center;
}
.proof-bar p { font-size: 14px; color: var(--muted); }
.proof-bar strong { color: var(--text); }

/* ── TOOLS SECTION ── */
.section { max-width: 1100px; margin: 0 auto; padding: 80px 24px; }
.section-eyebrow { font-size: 11px; font-weight: 800; color: var(--orange); text-transform: uppercase; letter-spacing: .12em; margin-bottom: 12px; text-align: center; }
.section-title { font-size: clamp(26px, 4vw, 38px); font-weight: 800; letter-spacing: -.02em; text-align: center; margin-bottom: 14px; }
.section-sub { font-size: 16px; color: var(--muted); text-align: center; max-width: 520px; margin: 0 auto 52px; line-height: 1.65; }

.tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.tool-card {
  background: var(--white); border: 1px solid var(--border); border-radius: 16px;
  padding: 28px; transition: all .25s; position: relative; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.tool-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--orange); transform: scaleX(0); transform-origin: left;
  transition: transform .3s;
}
.tool-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,.1); border-color: rgba(255,107,53,.2); }
.tool-card:hover::before { transform: scaleX(1); }
.tool-icon { font-size: 32px; margin-bottom: 16px; display: block; }
.tool-badge {
  position: absolute; top: 18px; right: 18px;
  background: var(--green-lite); color: var(--green);
  font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 10px;
  text-transform: uppercase; letter-spacing: .06em;
}
.tool-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.tool-desc { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 18px; }
.tool-link {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--orange); font-size: 13px; font-weight: 700;
  transition: gap .2s;
}
.tool-card:hover .tool-link { gap: 10px; }

/* ── HOW IT WORKS ── */
.how-section { background: var(--white); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.steps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 32px; }
.step { text-align: center; }
.step-num {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--orange-lite); color: var(--orange);
  font-size: 18px; font-weight: 800; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 16px;
  border: 2px solid rgba(255,107,53,.2);
}
.step-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.step-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

/* ── WHO IT'S FOR ── */
.audience-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
.audience-chip {
  background: var(--white); border: 1px solid var(--border); border-radius: 12px;
  padding: 16px 14px; text-align: center; transition: all .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.audience-chip:hover { border-color: var(--orange); background: var(--orange-lite); }
.audience-chip .ach-icon { font-size: 26px; margin-bottom: 8px; display: block; }
.audience-chip .ach-label { font-size: 13px; font-weight: 700; color: var(--text); }

/* ── TESTIMONIAL ── */
.testi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.testi-card {
  background: var(--white); border: 1px solid var(--border); border-radius: 16px;
  padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.testi-stars { color: #F59E0B; font-size: 14px; margin-bottom: 12px; }
.testi-text { font-size: 14px; color: var(--text); line-height: 1.65; margin-bottom: 16px; font-style: italic; }
.testi-author { font-size: 13px; font-weight: 700; color: var(--muted); }

/* ── CTA SECTION ── */
.cta-section {
  background: linear-gradient(135deg, #FF6B35 0%, #e85a24 100%);
  padding: 80px 24px; text-align: center;
}
.cta-section h2 { font-size: clamp(26px, 4vw, 40px); font-weight: 800; color: #fff; margin-bottom: 14px; letter-spacing: -.02em; }
.cta-section p { font-size: 17px; color: rgba(255,255,255,.85); max-width: 480px; margin: 0 auto 36px; line-height: 1.6; }
.btn-white {
  background: #fff; color: var(--orange); padding: 16px 36px;
  border-radius: 10px; font-size: 16px; font-weight: 800;
  transition: all .2s; display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,.15);
}
.btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.2); color: var(--orange); }
.cta-note { font-size: 13px; color: rgba(255,255,255,.7); margin-top: 16px; }

/* ── FOOTER ── */
.footer {
  background: var(--text); color: #94A3B8;
  padding: 48px 24px 32px;
}
.footer-inner { max-width: 1100px; margin: 0 auto; }
.footer-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
@media(max-width:640px){ .footer-top { grid-template-columns: 1fr; } }
.footer-logo { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
.footer-logo .first { color: var(--orange); }
.footer-tagline { font-size: 14px; line-height: 1.6; color: #64748B; }
.footer-col h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #CBD5E1; margin-bottom: 14px; }
.footer-col a { display: block; font-size: 14px; color: #64748B; margin-bottom: 8px; transition: color .2s; }
.footer-col a:hover { color: var(--orange); }
.footer-bottom { border-top: 1px solid #334155; padding-top: 24px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 13px; color: #475569; }
.powered { font-size: 12px; color: #334155; }
.powered a { color: #475569; }
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="logo">
    <span class="your">Your</span><span class="first">First</span><span class="shift">Shift</span><sup>™</sup>
  </div>
  <div class="nav-links">
    <a href="#tools">Tools</a>
    <a href="#how">How It Works</a>
    <a href="#who">Who It's For</a>
    <a href="https://yourfirstshift.culpepperhunter.workers.dev/resume" class="nav-cta">Build My Resume</a>
    <a href="#signin" class="nav-sign">Sign In</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-eyebrow">
    ⚡ Powered by Claude — Free to Use
  </div>
  <h1>Paste your background<br>and <span class="accent">we'll do the rest.</span></h1>
  <p class="sub">AI-powered job tools built for everyday workers — trades, warehouse, drivers, admin, retail, and anyone who works hard and deserves a fair shot at something better.</p>

  <div class="hero-btns">
    <a href="https://yourfirstshift.culpepperhunter.workers.dev/resume" class="btn-primary">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      Build My Resume — Free
    </a>
    <a href="#tools" class="btn-secondary">See All 5 Tools →</a>
  </div>

  <div class="trust-row">
    <div class="trust-badge"><span class="dot"></span>Free PDF &amp; Word download</div>
    <div class="trust-badge"><span class="dot"></span>No account required to start</div>
    <div class="trust-badge"><span class="dot"></span>ATS-optimized output</div>
    <div class="trust-badge"><span class="dot"></span>Understands trades &amp; certs</div>
    <div class="trust-badge"><span class="dot"></span>Works on your phone</div>
  </div>
</section>

<!-- PROOF BAR -->
<div class="proof-bar">
  <p>Built by a <strong>blue-collar pipeline worker</strong> who fought ATS systems for 14 years. This tool understands <strong>CDL, NACE, Veriforce OQ, OSHA, hydrostatic testing</strong> — and every other credential that corporate resume builders ignore.</p>
</div>

<!-- TOOLS -->
<section class="section" id="tools">
  <div class="section-eyebrow">5 Free Tools</div>
  <h2 class="section-title">Everything you need to get hired</h2>
  <p class="section-sub">One place for every job search tool — no bouncing between websites, no hidden fees.</p>

  <div class="tools-grid">

    <div class="tool-card">
      <span class="tool-badge">Most Popular</span>
      <span class="tool-icon">📄</span>
      <div class="tool-title">Resume Builder</div>
      <div class="tool-desc">Paste your background or upload your old resume. We write it, format it, and make it ATS-ready. Edit anything live, download as PDF or Word — free.</div>
      <a href="https://yourfirstshift.culpepperhunter.workers.dev/resume" class="tool-link">Build My Resume →</a>
    </div>

    <div class="tool-card">
      <span class="tool-icon">🎯</span>
      <div class="tool-title">ATS X-Ray</div>
      <div class="tool-desc">Paste your resume and a job posting. We score your keyword match and tell you exactly what's missing before you apply — so you don't get filtered out before a human ever sees you.</div>
      <a href="ats.html" class="tool-link">Scan My Resume →</a>
    </div>

    <div class="tool-card">
      <span class="tool-icon">✉️</span>
      <div class="tool-title">Cover Letter Generator</div>
      <div class="tool-desc">A real cover letter tailored to the specific job — not a generic template. Sounds like you wrote it yourself, because you told us what matters.</div>
      <a href="coverletter.html" class="tool-link">Write My Cover Letter →</a>
    </div>

    <div class="tool-card">
      <span class="tool-icon">📨</span>
      <div class="tool-title">Outreach Engine</div>
      <div class="tool-desc">Skip the application portal. Write a direct message to the hiring manager that gets read. We write it, you send it.</div>
      <a href="outreach.html" class="tool-link">Write My Outreach →</a>
    </div>

    <div class="tool-card">
      <span class="tool-icon">🎤</span>
      <div class="tool-title">Interview Prep</div>
      <div class="tool-desc">Get the questions they're likely to ask for that specific role — and strong, honest answers based on your background. Walk in ready.</div>
      <a href="interview.html" class="tool-link">Prep for My Interview →</a>
    </div>

  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how-section" id="how">
  <div class="section" style="padding-top:72px; padding-bottom:72px;">
    <div class="section-eyebrow">How It Works</div>
    <h2 class="section-title">Three steps. Under two minutes.</h2>
    <p class="section-sub">No tutorials. No complicated setup. Just paste and go.</p>
    <div class="steps-grid">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-title">Paste Your Background</div>
        <div class="step-desc">Type or paste your work history, skills, and certifications. Don't worry about formatting — just get it in there. You can also upload your old resume PDF.</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-title">We Do the Work</div>
        <div class="step-desc">Claude reads your background and builds a professional, ATS-optimized resume with strong action-verb bullets. Takes about 15 seconds.</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-title">Edit &amp; Download Free</div>
        <div class="step-desc">Click anything in the live preview to edit it directly. Pick your style. Download as PDF, Word, or plain text — always free, no account needed to start.</div>
      </div>
      <div class="step">
        <div class="step-num">4</div>
        <div class="step-title">Tailor for Each Job</div>
        <div class="step-desc">Paste the job description and we rewrite your resume to match their exact language and keywords. One click, done.</div>
      </div>
    </div>
  </div>
</section>

<!-- WHO IT'S FOR -->
<section class="section" id="who">
  <div class="section-eyebrow">Who It's For</div>
  <h2 class="section-title">Built for people who work for a living</h2>
  <p class="section-sub">Not just tech workers. Not just college grads. Everyone.</p>
  <div class="audience-grid">
    <div class="audience-chip"><span class="ach-icon">🔧</span><div class="ach-label">Tradespeople</div></div>
    <div class="audience-chip"><span class="ach-icon">🚛</span><div class="ach-label">CDL Drivers</div></div>
    <div class="audience-chip"><span class="ach-icon">🏗️</span><div class="ach-label">Construction</div></div>
    <div class="audience-chip"><span class="ach-icon">🏭</span><div class="ach-label">Warehouse</div></div>
    <div class="audience-chip"><span class="ach-icon">🧹</span><div class="ach-label">Janitorial</div></div>
    <div class="audience-chip"><span class="ach-icon">🔥</span><div class="ach-label">Firefighters</div></div>
    <div class="audience-chip"><span class="ach-icon">🛒</span><div class="ach-label">Retail</div></div>
    <div class="audience-chip"><span class="ach-icon">💊</span><div class="ach-label">Healthcare</div></div>
    <div class="audience-chip"><span class="ach-icon">🖥️</span><div class="ach-label">Admin &amp; Office</div></div>
    <div class="audience-chip"><span class="ach-icon">🌿</span><div class="ach-label">Landscaping</div></div>
    <div class="audience-chip"><span class="ach-icon">⚡</span><div class="ach-label">Electricians</div></div>
    <div class="audience-chip"><span class="ach-icon">🔩</span><div class="ach-label">Maintenance</div></div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="how-section">
  <div class="section" style="padding-top:72px; padding-bottom:72px;">
    <div class="section-eyebrow">Real Workers, Real Results</div>
    <h2 class="section-title">What people are saying</h2>
    <div class="testi-grid">
      <div class="testi-card">
        <div class="testi-stars">★★★★★</div>
        <div class="testi-text">"I've been a CDL driver for 11 years and never knew how to write a resume. This thing knew exactly what to put — it even mentioned my HazMat endorsement without me spelling it out. Got a callback the next day."</div>
        <div class="testi-author">Marcus T. — CDL Class A Driver, Georgia</div>
      </div>
      <div class="testi-card">
        <div class="testi-stars">★★★★★</div>
        <div class="testi-text">"I've been applying for 3 months with no calls back. Used the ATS X-Ray and found out my resume was missing half the keywords. Fixed it, applied the same day, had two interviews by Friday."</div>
        <div class="testi-author">Denise R. — Warehouse Supervisor, Ohio</div>
      </div>
      <div class="testi-card">
        <div class="testi-stars">★★★★★</div>
        <div class="testi-text">"As a pipeline welder I didn't think any resume tool would understand my certs. This one listed my Veriforce OQs and NACE exactly right. First tool that actually speaks my language."</div>
        <div class="testi-author">Bobby K. — Pipeline Welder, Texas</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <h2>Your next job starts right here.</h2>
  <p>Paste your background and we'll do the rest. Free to build, free to download, no account needed to start.</p>
  <a href="https://yourfirstshift.culpepperhunter.workers.dev/resume" class="btn-white">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    Build My Resume — Free
  </a>
  <div class="cta-note">⚡ Powered by Claude · Free PDF &amp; Word download · No credit card ever</div>
</section>

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-logo">Your<span class="first">First</span>Shift™</div>
        <div class="footer-tagline">AI-powered job tools for everyday workers. Built by someone who's been there — long hours, hard work, and deserving a fair shot.</div>
      </div>
      <div class="footer-col">
        <h4>Tools</h4>
        <a href="https://yourfirstshift.culpepperhunter.workers.dev/resume">Resume Builder</a>
        <a href="ats.html">ATS X-Ray</a>
        <a href="coverletter.html">Cover Letter</a>
        <a href="outreach.html">Outreach Engine</a>
        <a href="interview.html">Interview Prep</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="privacy.html">Privacy Policy</a>
        <a href="terms.html">Terms of Use</a>
        <a href="mailto:hello@yourfirstshiftapp.com">Contact Us</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 YourFirstShift™. All rights reserved.</span>
      <span class="powered">Powered by Claude · Independent product, not affiliated with or endorsed by Anthropic PBC. "Claude" is a trademark of Anthropic PBC.</span>
    </div>
  </div>
</footer>

</body>
</html>
`;
const RESUME_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resume Builder — YourFirstShift™</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --orange: #FF6B35;
  --orange-dark: #e85a24;
  --orange-lite: #FFF3EE;
  --blue: #3B82F6;
  --blue-dark: #2563eb;
  --green: #10B981;
  --green-lite: #ECFDF5;
  --red: #DC2626;
  --bg: #F8FAFC;
  --white: #FFFFFF;
  --border: #E2E8F0;
  --text: #1E293B;
  --muted: #64748B;
  --light: #94A3B8;
  --bg3: #F1F5F9;
  --radius: 10px;
}
html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; min-height: 100vh; font-size: 15px; }

/* ── NAV ── */
.nav {
  background: var(--white); border-bottom: 1px solid var(--border);
  padding: 13px 24px; display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 200; box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.logo { font-size: 20px; font-weight: 800; letter-spacing: -.01em; text-decoration: none; }
.logo .your { color: var(--text); }
.logo .first { color: var(--orange); }
.logo .shift { color: var(--text); }
.logo sup { font-size: 10px; color: var(--light); }
.nav-right { display: flex; align-items: center; gap: 12px; position: relative; }
.nav-signin {
  background: var(--orange); color: #fff; padding: 8px 18px;
  border-radius: 8px; font-size: 13px; font-weight: 700; border: none;
  cursor: pointer; transition: all .2s;
}
.nav-signin:hover { background: var(--orange-dark); }

/* USER MENU */
.user-menu {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 30px; padding: 4px 14px 4px 4px; cursor: pointer;
  transition: all .2s;
}
.user-menu:hover { border-color: var(--orange); }
.user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--orange); color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-size: 13px; font-weight: 700; color: var(--text); }
.user-dropdown {
  position: absolute; top: 48px; right: 0; background: var(--white);
  border: 1px solid var(--border); border-radius: 12px; padding: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1); min-width: 210px;
  display: none; z-index: 300;
}
.user-dropdown.open { display: block; }
.dd-head { padding: 10px 14px 10px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
.dd-name { font-size: 13px; font-weight: 700; color: var(--text); }
.dd-email { font-size: 12px; color: var(--light); }
.dd-plan { font-size: 11px; font-weight: 700; margin-top: 4px; }
.dd-item {
  padding: 9px 14px; border-radius: 8px; font-size: 14px; color: var(--text);
  cursor: pointer; transition: background .15s; display: flex; align-items: center; gap: 8px;
}
.dd-item:hover { background: var(--bg); }
.dd-item.upgrade { color: var(--orange); font-weight: 700; }
.dd-item.danger { color: var(--red); }
.dd-item.danger:hover { background: #FEF2F2; }
.dd-divider { height: 1px; background: var(--border); margin: 4px 0; }

/* ── PHASES ── */
.phase { display: none; }
.phase.active { display: block; }

/* ── PHASE 1: INPUT ── */
.hero { max-width: 740px; margin: 0 auto; padding: 48px 20px 64px; text-align: center; }
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--orange-lite); border: 1px solid rgba(255,107,53,.2);
  color: var(--orange); padding: 6px 18px; border-radius: 20px;
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 22px;
}
.hero h1 { font-size: clamp(26px, 5vw, 42px); font-weight: 800; line-height: 1.12; letter-spacing: -.025em; margin-bottom: 14px; }
.hero h1 .accent { color: var(--orange); }
.hero .sub { color: var(--muted); font-size: 16px; line-height: 1.65; max-width: 540px; margin: 0 auto 36px; }

/* TRUST ROW */
.trust-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 36px; }
.trust-item {
  background: var(--white); border: 1px solid var(--border); border-radius: 20px;
  padding: 6px 14px; font-size: 12px; color: var(--muted);
  display: flex; align-items: center; gap: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.trust-item .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0; }

/* FREE USES BANNER */
.free-banner {
  background: var(--green-lite); border: 1px solid rgba(16,185,129,.2);
  border-radius: 10px; padding: 12px 18px; margin-bottom: 20px;
  font-size: 13px; color: #065F46; display: flex; align-items: center; gap: 8px;
}
.free-banner.warn { background: #FFFBEB; border-color: rgba(245,158,11,.3); color: #92400E; }
.free-banner.out { background: #FEF2F2; border-color: rgba(220,38,38,.2); color: #991B1B; }

/* INPUT CARD */
.card {
  background: var(--white); border: 1px solid var(--border); border-radius: 16px;
  padding: 28px; margin-bottom: 14px; text-align: left;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.card-label { font-size: 11px; font-weight: 700; color: var(--orange); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 10px; display: block; }
textarea {
  width: 100%; background: var(--bg3); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text); font-size: 14px;
  padding: 14px 16px; resize: vertical; min-height: 160px;
  line-height: 1.65; font-family: inherit; transition: border-color .2s;
}
textarea:focus { outline: none; border-color: var(--orange); background: var(--white); }
textarea::placeholder { color: #CBD5E1; }

/* UPLOAD */
.upload-row { display: flex; gap: 10px; margin-top: 12px; align-items: center; flex-wrap: wrap; }
.upload-btn {
  display: flex; align-items: center; gap: 7px;
  background: var(--bg3); border: 1px dashed #CBD5E1; border-radius: 8px;
  color: var(--muted); font-size: 13px; font-weight: 600; padding: 9px 16px;
  cursor: pointer; transition: all .2s; white-space: nowrap;
}
.upload-btn:hover { border-color: var(--orange); color: var(--orange); }
.upload-btn input { display: none; }
.upload-ok { font-size: 13px; color: var(--green); font-weight: 600; }

/* JD TOGGLE */
.jd-row { display: flex; align-items: center; gap: 8px; margin-top: 16px; cursor: pointer; }
.jd-row input[type=checkbox] { accent-color: var(--orange); width: 16px; height: 16px; cursor: pointer; }
.jd-row label { font-size: 13px; color: var(--muted); cursor: pointer; user-select: none; }
.jd-row label strong { color: var(--text); }
#jdWrap { display: none; margin-top: 10px; }
#jdWrap.show { display: block; }

/* STYLE GRID */
.style-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.scard {
  background: var(--white); border: 2px solid var(--border); border-radius: 10px;
  padding: 12px 10px; cursor: pointer; transition: all .2s; text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.scard:hover { border-color: #CBD5E1; }
.scard.active { border-color: var(--orange); background: var(--orange-lite); }
.scard .sw { width: 100%; height: 34px; border-radius: 5px; margin-bottom: 9px; border: 1px solid #E2E8F0; }
.scard .sn { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.scard .sd { font-size: 11px; color: var(--light); }

/* GEN BUTTON */
.gen-btn {
  width: 100%; padding: 18px; background: var(--orange); color: #fff;
  font-size: 16px; font-weight: 800; border: none; border-radius: 12px;
  cursor: pointer; margin-top: 24px; letter-spacing: .02em;
  transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 4px 20px rgba(255,107,53,.25);
}
.gen-btn:hover { background: var(--orange-dark); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,107,53,.35); }
.gen-btn:disabled { background: #CBD5E1; color: var(--white); cursor: not-allowed; transform: none; box-shadow: none; }
.free-note { text-align: center; font-size: 13px; color: var(--muted); margin-top: 10px; }
.free-note strong { color: var(--green); }

/* ── PHASE 2: LOADING ── */
.loading-screen {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 70vh; text-align: center; padding: 40px 20px;
}
.loading-ring {
  width: 60px; height: 60px; border-radius: 50%;
  border: 3px solid var(--border); border-top-color: var(--orange);
  animation: spin .85s linear infinite; margin-bottom: 24px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-title { font-size: 22px; font-weight: 700; margin-bottom: 6px; color: var(--text); }
.loading-sub { color: var(--muted); font-size: 14px; margin-bottom: 28px; }
.step-list { list-style: none; }
.step-list li { font-size: 14px; color: var(--light); padding: 5px 0; transition: color .3s; }
.step-list li.done { color: var(--green); }
.step-list li.done::before { content: '✓  '; }
.step-list li.going { color: var(--text); font-weight: 600; }
.step-list li.going::before { content: '→  '; color: var(--orange); }

/* ── PHASE 3: EDITOR ── */
.editor-wrap { display: grid; grid-template-columns: 300px 1fr; min-height: calc(100vh - 53px); }
@media(max-width:860px){ .editor-wrap { grid-template-columns: 1fr; } }

/* LEFT PANEL */
.left-panel {
  background: var(--white); border-right: 1px solid var(--border);
  padding: 20px 16px; overflow-y: auto;
  max-height: calc(100vh - 53px); position: sticky; top: 53px;
}
@media(max-width:860px){ .left-panel { position:static; max-height:none; border-right:none; border-bottom:1px solid var(--border); } }

.lp-section { margin-bottom: 22px; }
.lp-title { font-size: 10px; font-weight: 800; color: var(--orange); text-transform: uppercase; letter-spacing: .12em; margin-bottom: 10px; }
.divider { height: 1px; background: var(--border); margin: 18px 0; }

/* COACH BOX */
.coach-box {
  background: var(--orange-lite); border: 1px solid rgba(255,107,53,.2);
  border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 13px;
  color: #7C3311; line-height: 1.6;
}
.coach-name { font-size: 10px; font-weight: 800; color: var(--orange); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }

/* STYLE PILLS */
.style-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.spill {
  padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border);
  background: var(--bg3); color: var(--muted); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .2s;
}
.spill:hover { border-color: #CBD5E1; color: var(--text); }
.spill.active { border-color: var(--orange); color: var(--orange); background: var(--orange-lite); }

/* AI BUTTONS */
.ai-list { display: flex; flex-direction: column; gap: 7px; }
.ai-btn {
  padding: 11px 12px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--white); color: var(--text); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .2s; display: flex; align-items: flex-start; gap: 9px; text-align: left;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
}
.ai-btn:hover { border-color: var(--orange); background: var(--orange-lite); }
.ai-btn .ico { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.ai-sub { color: var(--light); font-weight: 400; font-size: 11px; display: block; margin-top: 1px; }

/* TAILOR */
.tailor-jd { min-height: 90px; font-size: 13px; }
.tailor-btn {
  width: 100%; margin-top: 8px; padding: 11px;
  background: var(--blue); color: #fff; font-weight: 700; font-size: 13px;
  border: none; border-radius: 8px; cursor: pointer; transition: background .2s;
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.tailor-btn:hover { background: var(--blue-dark); }
.tailor-btn:disabled { background: #CBD5E1; cursor: not-allowed; }

/* DOWNLOADS */
.dl-stack { display: flex; flex-direction: column; gap: 7px; }
.dl-btn {
  padding: 11px 14px; border-radius: 8px; font-size: 13px; font-weight: 700;
  cursor: pointer; border: none; display: flex; align-items: center; gap: 8px; transition: all .2s;
}
.dl-pdf { background: #7F1D1D; color: #FCA5A5; }
.dl-pdf:hover { background: var(--red); color: #fff; }
.dl-word { background: #1E3A8A; color: #93C5FD; }
.dl-word:hover { background: var(--blue); color: #fff; }
.dl-txt { background: var(--bg3); color: var(--muted); border: 1px solid var(--border); }
.dl-txt:hover { border-color: #CBD5E1; color: var(--text); }
.dl-btn:disabled { opacity: .35; cursor: not-allowed; }
.start-over {
  width: 100%; padding: 9px; background: none; border: 1px solid var(--border);
  border-radius: 8px; color: var(--muted); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .2s; margin-top: 7px;
}
.start-over:hover { border-color: #CBD5E1; color: var(--text); }

/* RIGHT PANEL */
.right-panel { background: #DDE3EA; padding: 28px 20px; overflow-y: auto; }
.preview-inner { max-width: 780px; margin: 0 auto; }
.preview-label { font-size: 11px; color: #94A3B8; text-align: center; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.edit-hint {
  background: rgba(255,107,53,.08); border: 1px solid rgba(255,107,53,.25);
  border-radius: 8px; padding: 9px 14px; font-size: 12px; color: #EA580C;
  margin-bottom: 12px; text-align: center;
}

/* ── RESUME DOC ── */
#resumeDoc {
  background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.12);
  border-radius: 2px; overflow: hidden; min-height: 1000px;
  color: #1a1a1a; font-size: 13px; line-height: 1.5;
}
[contenteditable] { outline: none; cursor: text; border-radius: 2px; transition: background .15s; }
[contenteditable]:hover { background: rgba(255,107,53,.06); }
[contenteditable]:focus { background: rgba(255,107,53,.1); box-shadow: 0 0 0 1.5px rgba(255,107,53,.4); }

/* ── TEMPLATES ── */
.t-modern { font-family: Georgia,'Times New Roman',serif; padding: 48px 52px; }
.t-modern .rname { font-size: 28px; font-weight: 700; color: #111; letter-spacing:-.02em; margin-bottom:3px; }
.t-modern .rtitle { font-size:11.5px; font-weight:700; color:#b45309; text-transform:uppercase; letter-spacing:.12em; margin-bottom:7px; font-family:'Segoe UI',sans-serif; }
.t-modern .rcontact { font-size:12px; color:#666; font-family:'Segoe UI',sans-serif; }
.t-modern .rheader { border-bottom:2.5px solid #111; padding-bottom:13px; margin-bottom:18px; }
.t-modern .rsect { font-size:10px; font-weight:700; color:#b45309; text-transform:uppercase; letter-spacing:.15em; margin:18px 0 7px; font-family:'Segoe UI',sans-serif; }
.t-modern .rjtitle { font-size:13.5px; font-weight:700; color:#111; }
.t-modern .rjmeta { font-size:11.5px; color:#888; font-family:'Segoe UI',sans-serif; margin-bottom:6px; }
.t-modern .rbul { font-size:12.5px; color:#333; padding-left:14px; position:relative; margin-bottom:4px; }
.t-modern .rbul::before { content:'▸'; position:absolute; left:0; color:#b45309; font-size:9px; top:3px; }
.t-modern .rskills { font-size:12.5px; color:#444; line-height:1.8; }
.t-modern .rcert { font-size:12.5px; color:#333; margin-bottom:3px; }
.t-modern .rsum { font-size:12.5px; color:#333; line-height:1.65; }
.t-modern .rjob { margin-bottom:14px; }
.t-modern .rjob+.rjob { border-top:1px solid #eee; padding-top:13px; }

.t-minimal { font-family:'Helvetica Neue',Arial,sans-serif; padding:52px 56px; }
.t-minimal .rname { font-size:30px; font-weight:300; color:#111; letter-spacing:-.03em; margin-bottom:4px; }
.t-minimal .rtitle { font-size:11.5px; color:#bbb; text-transform:uppercase; letter-spacing:.2em; margin-bottom:7px; }
.t-minimal .rcontact { font-size:12px; color:#999; }
.t-minimal .rheader { border-bottom:1px solid #ddd; padding-bottom:18px; margin-bottom:26px; }
.t-minimal .rsect { font-size:9.5px; font-weight:700; color:#bbb; text-transform:uppercase; letter-spacing:.22em; margin:20px 0 9px; }
.t-minimal .rjtitle { font-size:13.5px; font-weight:600; color:#111; }
.t-minimal .rjmeta { font-size:11.5px; color:#bbb; margin-bottom:6px; }
.t-minimal .rbul { font-size:12.5px; color:#555; padding-left:15px; position:relative; margin-bottom:4px; }
.t-minimal .rbul::before { content:'–'; position:absolute; left:0; color:#ccc; }
.t-minimal .rskills { font-size:12.5px; color:#666; line-height:1.8; }
.t-minimal .rcert { font-size:12.5px; color:#555; margin-bottom:3px; }
.t-minimal .rsum { font-size:12.5px; color:#555; line-height:1.65; }
.t-minimal .rjob { margin-bottom:14px; }
.t-minimal .rjob+.rjob { border-top:1px solid #f0f0f0; padding-top:13px; }

.t-trades { font-family:'Segoe UI',Arial,sans-serif; }
.t-trades .rheader { background:linear-gradient(135deg,#1c1c1c 0%,#2d1a0e 100%); padding:36px 48px 28px; }
.t-trades .rname { font-size:30px; font-weight:800; color:#fff; letter-spacing:-.01em; margin-bottom:3px; }
.t-trades .rtitle { font-size:12px; color:#FF6B35; text-transform:uppercase; letter-spacing:.12em; font-weight:700; margin-bottom:8px; }
.t-trades .rcontact { font-size:12px; color:#aaa; }
.t-trades .rbody { padding:28px 48px; }
.t-trades .rsect { font-size:10.5px; font-weight:800; color:#FF6B35; text-transform:uppercase; letter-spacing:.14em; margin:18px 0 8px; border-left:3px solid #FF6B35; padding-left:10px; }
.t-trades .rjtitle { font-size:14px; font-weight:700; color:#111; }
.t-trades .rjmeta { font-size:11.5px; color:#888; margin-bottom:7px; }
.t-trades .rbul { font-size:12.5px; color:#333; padding-left:15px; position:relative; margin-bottom:4px; }
.t-trades .rbul::before { content:'◆'; position:absolute; left:0; color:#FF6B35; font-size:6px; top:5px; }
.t-trades .rskills { font-size:12.5px; color:#444; line-height:1.8; }
.t-trades .rcert { font-size:12.5px; color:#333; margin-bottom:3px; }
.t-trades .rsum { font-size:12.5px; color:#333; line-height:1.65; }
.t-trades .rjob { margin-bottom:14px; }
.t-trades .rjob+.rjob { border-top:1px solid #ececec; padding-top:13px; }
.t-trades [contenteditable]:hover { background:rgba(255,107,53,.05); }
.t-trades .rheader [contenteditable]:hover { background:rgba(255,107,53,.15); }
.t-trades .rheader [contenteditable]:focus { background:rgba(255,107,53,.2); box-shadow:0 0 0 1.5px rgba(255,107,53,.6); }

.t-tech { font-family:'Courier New',monospace; background:#0d1117; color:#c9d1d9; }
.t-tech .rheader { padding:36px 48px 24px; border-bottom:1px solid #21262d; }
.t-tech .rname { font-size:26px; font-weight:700; color:#58a6ff; margin-bottom:4px; }
.t-tech .rtitle { font-size:12px; color:#8b949e; margin-bottom:7px; }
.t-tech .rcontact { font-size:12px; color:#8b949e; }
.t-tech .rbody { padding:24px 48px; }
.t-tech .rsect { font-size:11px; font-weight:700; color:#3fb950; text-transform:uppercase; letter-spacing:.12em; margin:18px 0 8px; }
.t-tech .rsect::before { content:'// '; color:#484f58; }
.t-tech .rjtitle { font-size:13.5px; font-weight:700; color:#e2e8f0; }
.t-tech .rjmeta { font-size:11.5px; color:#8b949e; margin-bottom:6px; }
.t-tech .rbul { font-size:12.5px; color:#c9d1d9; padding-left:15px; position:relative; margin-bottom:4px; }
.t-tech .rbul::before { content:'>'; position:absolute; left:0; color:#3fb950; }
.t-tech .rskills { font-size:12.5px; color:#c9d1d9; line-height:1.8; }
.t-tech .rcert { font-size:12.5px; color:#c9d1d9; margin-bottom:3px; }
.t-tech .rsum { font-size:12.5px; color:#c9d1d9; line-height:1.65; }
.t-tech .rjob { margin-bottom:14px; }
.t-tech .rjob+.rjob { border-top:1px solid #21262d; padding-top:13px; }
.t-tech [contenteditable]:hover { background:rgba(63,185,80,.08); }
.t-tech [contenteditable]:focus { background:rgba(63,185,80,.13); box-shadow:0 0 0 1.5px rgba(63,185,80,.4); }

.t-classic { font-family:'Times New Roman',Times,serif; padding:48px 52px; }
.t-classic .rheader { text-align:center; border-bottom:1px solid #111; padding-bottom:13px; margin-bottom:15px; }
.t-classic .rname { font-size:24px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin-bottom:3px; }
.t-classic .rtitle { font-size:11.5px; color:#555; font-style:italic; margin-bottom:5px; }
.t-classic .rcontact { font-size:12px; color:#444; }
.t-classic .rsect { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; border-bottom:1px solid #111; padding-bottom:2px; margin:17px 0 8px; }
.t-classic .rjtitle { font-size:13.5px; font-weight:700; }
.t-classic .rjmeta { font-size:11.5px; color:#666; font-style:italic; margin-bottom:5px; }
.t-classic .rbul { font-size:12.5px; color:#222; padding-left:17px; position:relative; margin-bottom:3px; }
.t-classic .rbul::before { content:'•'; position:absolute; left:4px; }
.t-classic .rskills { font-size:12.5px; color:#333; line-height:1.8; }
.t-classic .rcert { font-size:12.5px; color:#222; margin-bottom:3px; }
.t-classic .rsum { font-size:12.5px; color:#222; line-height:1.65; }
.t-classic .rjob { margin-bottom:13px; }
.t-classic .rjob+.rjob { border-top:1px solid #ddd; padding-top:12px; }

/* ── AUTH OVERLAY ── */
.auth-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.6);
  z-index: 500; display: flex; align-items: center; justify-content: center;
  padding: 20px; opacity: 0; pointer-events: none; transition: opacity .25s;
  backdrop-filter: blur(6px);
}
.auth-overlay.open { opacity: 1; pointer-events: all; }
.auth-modal {
  background: var(--white); border-radius: 20px; padding: 40px 36px;
  max-width: 420px; width: 100%; text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,.18);
  transform: translateY(20px); transition: transform .25s;
  position: relative;
}
.auth-overlay.open .auth-modal { transform: translateY(0); }
.auth-close {
  position: absolute; top: 16px; right: 18px;
  background: none; border: none; font-size: 20px; color: var(--light);
  cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color .2s;
}
.auth-close:hover { color: var(--text); }
.auth-logo { font-size: 18px; font-weight: 800; margin-bottom: 20px; }
.auth-logo .first { color: var(--orange); }
.auth-icon { font-size: 44px; margin-bottom: 14px; display: block; }
.auth-title { font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 8px; letter-spacing: -.02em; }
.auth-sub { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 28px; }
.auth-sub strong { color: var(--orange); }
.auth-sub .price { font-size: 22px; font-weight: 800; color: var(--text); }

/* UPGRADE CARD */
.upgrade-features {
  background: var(--orange-lite); border: 1px solid rgba(255,107,53,.2);
  border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left;
}
.upgrade-features li {
  font-size: 13px; color: #7C3311; padding: 4px 0;
  display: flex; align-items: center; gap: 8px;
}
.upgrade-features li::before { content: '✓'; color: var(--orange); font-weight: 800; }

/* GOOGLE BTN */
.btn-google {
  width: 100%; padding: 14px 20px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--white);
  font-size: 15px; font-weight: 700; color: var(--text);
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all .2s; margin-bottom: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.btn-google:hover { border-color: var(--orange); box-shadow: 0 4px 16px rgba(0,0,0,.1); transform: translateY(-1px); }

.auth-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
.auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.auth-divider span { font-size: 12px; color: var(--light); font-weight: 600; }

.auth-input {
  width: 100%; padding: 13px 16px; border: 1.5px solid var(--border);
  border-radius: 10px; font-size: 14px; color: var(--text);
  font-family: inherit; margin-bottom: 10px; transition: border-color .2s;
  background: var(--bg3);
}
.auth-input:focus { outline: none; border-color: var(--orange); background: var(--white); }
.auth-input::placeholder { color: #CBD5E1; }

.btn-orange {
  width: 100%; padding: 14px; border-radius: 10px; border: none;
  background: var(--orange); color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all .2s; margin-bottom: 10px;
  box-shadow: 0 4px 16px rgba(255,107,53,.25);
}
.btn-orange:hover { background: var(--orange-dark); transform: translateY(-1px); }
.btn-orange:disabled { background: #CBD5E1; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-upgrade {
  width: 100%; padding: 16px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, var(--orange) 0%, #e85a24 100%);
  color: #fff; font-size: 16px; font-weight: 800;
  cursor: pointer; transition: all .2s; margin-bottom: 12px;
  box-shadow: 0 4px 20px rgba(255,107,53,.3); letter-spacing: .01em;
}
.btn-upgrade:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,107,53,.4); }

.auth-toggle { font-size: 13px; color: var(--muted); margin-top: 4px; }
.auth-toggle a { color: var(--orange); font-weight: 700; cursor: pointer; }
.auth-error {
  background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px;
  padding: 10px 14px; font-size: 13px; color: var(--red);
  margin-bottom: 12px; display: none; text-align: left;
}
.auth-error.show { display: block; }
.auth-fine { font-size: 11px; color: var(--light); margin-top: 16px; line-height: 1.6; }

/* TOAST */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px);
  background: var(--white); border: 1px solid var(--border); color: var(--text);
  padding: 11px 22px; border-radius: 30px; font-size: 14px; font-weight: 700;
  z-index: 9999; transition: transform .3s ease; white-space: nowrap;
  box-shadow: 0 8px 30px rgba(0,0,0,.12);
}
.toast.show { transform: translateX(-50%) translateY(0); }
.toast.ok { border-color: var(--green); color: var(--green); }
.toast.err { border-color: var(--red); color: var(--red); }
.toast.info { border-color: var(--orange); color: var(--orange); }

.spinner-sm { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }

@media(max-width:600px){
  .t-modern,.t-minimal,.t-classic{padding:26px 20px!important}
  .t-trades .rheader,.t-trades .rbody,.t-tech .rheader,.t-tech .rbody{padding-left:20px!important;padding-right:20px!important}
  .right-panel{padding:14px 8px}
  .left-panel{padding:16px 12px}
  .auth-modal{padding:32px 22px}
}
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <a href="index.html" class="logo">
    <span class="your">Your</span><span class="first">First</span><span class="shift">Shift</span><sup>™</sup>
  </a>
  <div class="nav-right" id="navRight">
    <button class="nav-signin" onclick="showAuth('signin')">Sign In / Sign Up</button>
  </div>
</nav>

<!-- ═══════ PHASE 1: INPUT ═══════ -->

<!-- PHASE 0: LANDING PAGE -->
<div id="phase0" class="phase active">

  <div style="max-width:860px;margin:0 auto;padding:72px 24px 80px;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:8px;background:#FFF3EE;border:1px solid rgba(255,107,53,.2);color:#FF6B35;padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:24px;">
      ⚡ Powered by Claude — Free to Use
    </div>
    <h1 style="font-size:clamp(30px,6vw,52px);font-weight:800;line-height:1.1;letter-spacing:-.025em;margin-bottom:20px;color:#1E293B;">
      Paste your background<br>and <span style="color:#FF6B35;">we'll do the rest.</span>
    </h1>
    <p style="font-size:clamp(16px,2.5vw,19px);color:#64748B;max-width:600px;margin:0 auto 36px;line-height:1.65;">
      AI-powered job tools built for everyday workers — trades, warehouse, drivers, admin, retail, and anyone who works hard and deserves a fair shot at something better.
    </p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:48px;">
      <button onclick="goToBuilder()" style="background:#FF6B35;color:#fff;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:800;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(255,107,53,.25);">
        ⚡ Build My Resume — Free
      </button>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:60px;">
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:7px 16px;font-size:13px;color:#64748B;display:flex;align-items:center;gap:7px;"><span style="width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;"></span>Free PDF &amp; Word download</div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:7px 16px;font-size:13px;color:#64748B;display:flex;align-items:center;gap:7px;"><span style="width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;"></span>No account required to start</div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:7px 16px;font-size:13px;color:#64748B;display:flex;align-items:center;gap:7px;"><span style="width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;"></span>ATS-optimized output</div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:7px 16px;font-size:13px;color:#64748B;display:flex;align-items:center;gap:7px;"><span style="width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;"></span>Understands trades &amp; certs</div>
    </div>
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:24px;max-width:640px;margin:0 auto;box-shadow:0 1px 4px rgba(0,0,0,.05);">
      <div style="font-size:14px;color:#64748B;line-height:1.65;">Built by a <strong style="color:#1E293B;">blue-collar pipeline worker</strong> who fought ATS systems for 14 years. This tool understands <strong style="color:#FF6B35;">CDL, NACE, Veriforce OQ, OSHA, hydrostatic testing</strong> — and every other credential that corporate resume builders ignore.</div>
    </div>
  </div>
</div>

<div id="phase1" class="phase">
  <div class="hero">
    <div class="hero-eyebrow">⚡ Powered by Claude</div>
    <h1>Paste your background and<br><span class="accent">we'll do the rest.</span></h1>
    <p class="sub">Built for tradespeople, drivers, warehouse crews, admin workers, and anyone who works hard and deserves a fair shot. ATS-optimized, free to download.</p>

    <div class="trust-row">
      <div class="trust-item"><span class="dot"></span>1 free resume build</div>
      <div class="trust-item"><span class="dot"></span>No account to start</div>
      <div class="trust-item"><span class="dot"></span>ATS-optimized</div>
      <div class="trust-item"><span class="dot"></span>Understands trades &amp; certs</div>
      <div class="trust-item"><span class="dot"></span>PDF &amp; Word download</div>
    </div>

    <div id="freeBanner" class="free-banner">
      🟢 You have <strong id="freeCount">1 free resume build</strong> remaining. No account needed.
    </div>

    <div class="card">
      <span class="card-label">Your Background</span>
      <textarea id="userInput" placeholder="Don't worry about formatting — just get it all in here. Your name, phone, email, city/state. Every job you've had and what you did. Any licenses, certs, or OQ qualifications (CDL, NACE, Veriforce, OSHA, etc). Skills. ShiftAI will handle the rest."></textarea>
      <div class="upload-row">
        <label class="upload-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Old Resume (PDF or TXT)
          <input type="file" id="pdfFile" accept=".pdf,.txt" onchange="handleUpload(event)">
        </label>
        <span class="upload-ok" id="uploadOk"></span>
      </div>
      <div class="jd-row">
        <input type="checkbox" id="jdCheck" onchange="document.getElementById('jdWrap').classList.toggle('show',this.checked)">
        <label for="jdCheck"><strong>Tailor to a specific job posting</strong> — paste a job description and we'll match your resume to their exact language</label>
      </div>
      <div id="jdWrap">
        <textarea id="jdInput" placeholder="Paste the full job description here…" style="min-height:110px;margin-top:8px;"></textarea>
      </div>
    </div>

    <div class="card">
      <span class="card-label">Choose Your Style</span>
      <div class="style-grid">
        <div class="scard active" data-style="modern" onclick="pickStyle('modern',this)">
          <div class="sw" style="background:linear-gradient(135deg,#fff 55%,#fef3c7 100%);"></div>
          <div class="sn">Modern Pro</div><div class="sd">Serif + warm gold</div>
        </div>
        <div class="scard" data-style="minimal" onclick="pickStyle('minimal',this)">
          <div class="sw" style="background:#fff;"></div>
          <div class="sn">Clean Minimal</div><div class="sd">Airy &amp; clean</div>
        </div>
        <div class="scard" data-style="trades" onclick="pickStyle('trades',this)">
          <div class="sw" style="background:linear-gradient(135deg,#1c1c1c 45%,#2d1a0e 100%);border-color:#555;"></div>
          <div class="sn">Bold Trades</div><div class="sd">Built for the field</div>
        </div>
        <div class="scard" data-style="tech" onclick="pickStyle('tech',this)">
          <div class="sw" style="background:#0d1117;border-color:#21262d;"></div>
          <div class="sn">Creative Tech</div><div class="sd">Dark mode</div>
        </div>
        <div class="scard" data-style="classic" onclick="pickStyle('classic',this)">
          <div class="sw" style="background:#fff;display:flex;align-items:center;justify-content:center;">
            <div style="width:55%;height:2px;background:#111;"></div>
          </div>
          <div class="sn">Traditional</div><div class="sd">Classic &amp; timeless</div>
        </div>
      </div>
    </div>

    <button class="gen-btn" id="genBtn" onclick="generate()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      Build My Resume — Powered by Claude
    </button>
    <div class="free-note" id="freeNote">1 free build · <strong>No credit card · No account needed to start</strong></div>
  </div>
</div>

<!-- ═══════ PHASE 2: LOADING ═══════ -->
<div id="phase2" class="phase">
  <div class="loading-screen">
    <div class="loading-ring"></div>
    <div class="loading-title">Building your resume…</div>
    <div class="loading-sub">Usually done in 10–15 seconds</div>
    <ul class="step-list" id="steps">
      <li id="s1">Reading your background</li>
      <li id="s2">Writing strong, specific bullet points</li>
      <li id="s3">Highlighting your certs &amp; licenses</li>
      <li id="s4">Optimizing for ATS keyword screening</li>
      <li id="s5">Formatting to your chosen style</li>
    </ul>
  </div>
</div>

<!-- ═══════ PHASE 3: EDITOR ═══════ -->
<div id="phase3" class="phase">
  <div class="editor-wrap">
    <div class="left-panel">

      <div class="coach-box">
        <div class="coach-name">⚡ YourFirstShift Coach</div>
        <span id="coachMsg">Your resume is ready. Click any text to edit it directly — your name, bullets, everything. When you're happy, download it free.</span>
      </div>

      <div class="lp-section">
        <div class="lp-title">Switch Style</div>
        <div class="style-pills">
          <div class="spill active" data-s="modern" onclick="switchStyle('modern',this)">Modern Pro</div>
          <div class="spill" data-s="minimal" onclick="switchStyle('minimal',this)">Minimal</div>
          <div class="spill" data-s="trades" onclick="switchStyle('trades',this)">Bold Trades</div>
          <div class="spill" data-s="tech" onclick="switchStyle('tech',this)">Tech</div>
          <div class="spill" data-s="classic" onclick="switchStyle('classic',this)">Classic</div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="lp-section">
        <div class="lp-title">Improve with AI</div>
        <div class="ai-list">
          <button class="ai-btn" onclick="aiImprove('strengthen')">
            <span class="ico">💪</span>
            <div>Strengthen Bullets<span class="ai-sub">Stronger verbs, more impact</span></div>
          </button>
          <button class="ai-btn" onclick="aiImprove('ats')">
            <span class="ico">🎯</span>
            <div>Optimize for ATS<span class="ai-sub">Beat automated screening</span></div>
          </button>
          <button class="ai-btn" onclick="aiImprove('concise')">
            <span class="ico">✂️</span>
            <div>Tighten It Up<span class="ai-sub">Cut fluff, sharpen every line</span></div>
          </button>
          <button class="ai-btn" onclick="aiImprove('tone')">
            <span class="ico">👔</span>
            <div>Elevate the Tone<span class="ai-sub">More polished, more senior</span></div>
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <div class="lp-section">
        <div class="lp-title">Tailor to a Job Posting</div>
        <textarea class="tailor-jd" id="tailorJD" placeholder="Paste a job description and we'll rewrite your resume to match their exact language and keywords…"></textarea>
        <button class="tailor-btn" id="tailorBtn" onclick="tailorResume()">⚡ Tailor My Resume</button>
      </div>

      <div class="divider"></div>

      <div class="lp-section">
        <div class="lp-title">Download — Always Free</div>
        <div class="dl-stack">
          <button class="dl-btn dl-pdf" id="dlPdf" onclick="dlPDF()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Download PDF
          </button>
          <button class="dl-btn dl-word" onclick="dlWord()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Download Word (.doc)
          </button>
          <button class="dl-btn dl-txt" onclick="dlTXT()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
            Plain Text (ATS paste)
          </button>
        </div>
        <button class="start-over" onclick="startOver()">← Start Over</button>
      </div>
    </div>

    <div class="right-panel">
      <div class="preview-inner">
        <div class="preview-label">Live Preview — click any text to edit</div>
        <div class="edit-hint" id="editHint">✏️ Click directly on your name, summary, bullets — anything — to edit it before downloading.</div>
        <div id="resumeDoc"></div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════ AUTH MODAL ═══════ -->
<div class="auth-overlay" id="authOverlay">
  <div class="auth-modal" id="authModal">
    <button class="auth-close" id="authClose" onclick="closeAuth()">✕</button>
    <div class="auth-logo">Your<span class="first">First</span>Shift™</div>

    <!-- UPGRADE VIEW (shown when free limit hit) -->
    <div id="upgradeView" style="display:none;">
      <span class="auth-icon">🚀</span>
      <div class="auth-title">You've used your free run</div>
      <div class="auth-sub">You got a taste — now go unlimited. <span class="price">$9<small>/mo</small></span> for every tool, every time.</div>
      <ul class="upgrade-features">
        <li>Unlimited resume builds &amp; edits</li>
        <li>Unlimited ATS X-Ray scans</li>
        <li>Unlimited cover letters</li>
        <li>Unlimited interview prep</li>
        <li>Save &amp; access your resumes anywhere</li>
        <li>Job tailoring — match any posting</li>
      </ul>
      <button class="btn-upgrade" onclick="goUpgrade()">⚡ Upgrade to Pro — $9/month</button>
      <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">Already have Pro? <a style="color:var(--orange);font-weight:700;cursor:pointer;" onclick="showLoginView()">Sign in here</a></div>
    </div>

    <!-- SIGN IN / SIGN UP VIEW -->
    <div id="signinView">
      <span class="auth-icon" id="authIcon">👋</span>
      <div class="auth-title" id="authTitle">Welcome back</div>
      <div class="auth-sub" id="authSubtitle">Sign in to access your resumes and Pro features.</div>

      <div class="auth-error" id="authError"></div>

      <button class="btn-google" onclick="signInWithGoogle()">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>

      <div class="auth-divider"><span>or use email</span></div>

      <input class="auth-input" type="email" id="authEmail" placeholder="Your email address">
      <input class="auth-input" type="password" id="authPassword" placeholder="Password (6+ characters)" style="display:none;">
      <button class="btn-orange" id="authEmailBtn" onclick="handleEmailAuth()">Continue with Email</button>
      <div class="auth-toggle" id="authToggle">
        New here? <a onclick="toggleSignup()">Create a free account</a>
      </div>

      <div class="auth-fine">No spam. No selling your data. Cancel anytime.</div>
    </div>
  </div>
</div>

<!-- TOAST -->
<div class="toast" id="toast"></div>

<script>
// ─── CONFIG ──────────────────────────────────────────────

function goToBuilder() {
  document.getElementById('phase0').classList.remove('active');
  document.getElementById('phase1').classList.add('active');
  // Sync nav
  checkSession();
}

// UPDATE THIS to your actual Cloudflare Worker URL after Madeline deploys
const WORKER_URL = 'https://yourfirstshift.culpepperhunter.workers.dev';
const TOOL_NAME = 'resume';

if(typeof pdfjsLib!=='undefined')
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ─── STATE ───────────────────────────────────────────────
let appStyle = 'modern';
let resumeData = null;
let busy = false;
let currentUser = null;
let isSignup = false;
let hasUsedFreeRun = false;

// ─── CLAUDE SYSTEM PROMPT ────────────────────────────────
const CLAUDE_SYSTEM = \`You are an elite professional resume writer and career coach built for YourFirstShiftApp.com. You were created by a blue-collar pipeline worker who knows what it's like to fight ATS systems just to get a fair shot. Your mission: help everyday workers — tradespeople, janitors, warehouse staff, construction crews, admin workers, drivers, retail — turn real experience into resumes that get them hired.

You deeply understand: CDL Class A/B, NACE CIP Level 1/2, Veriforce OQ tasks, OSHA 10/30, Excavation Competent Person, hydrostatic testing, pipeline pigging, cathodic protection, crane rigging, forklift, heavy equipment operation, DOT/PHMSA regulations, and all trades certifications.

Rules:
- Every bullet starts with a strong past-tense action verb
- Metrics and specifics beat vague claims — use numbers when available
- Never invent experience — highlight transferable skills beautifully
- ATS-friendly, human-sounding, achievement-focused output
- Be warm and encouraging — like a trusted mentor, not a corporate robot

Return ONLY raw JSON — no markdown, no backticks, no commentary:
{
  "name": "Full Name",
  "title": "Strong Professional Title reflecting seniority",
  "contact": "City, ST | Phone | Email",
  "coachNote": "1-2 sentences of warm specific encouragement referencing something real from their background",
  "summary": "3 powerful sentences. 1: years + expertise. 2: top credential or achievement. 3: value to employers.",
  "skills": ["skill1","skill2",...10-16 skills],
  "experience": [{"title":"","company":"","location":"","dates":"","bullets":["4-6 bullets each"]}],
  "certifications": [{"name":"","detail":""}],
  "education": "Degree School Year or empty string"
}\`;

// ─── INIT ─────────────────────────────────────────────────
window.addEventListener('load', async () => {
  await checkSession();
  updateFreeBanner();

  // Handle return from Google OAuth
  const params = new URLSearchParams(window.location.search);
  if (params.get('login') === 'success') {
    history.replaceState({}, '', window.location.pathname);
    toast('You\\'re signed in! Welcome. 👋', 'ok');
    await checkSession();
  }
  if (params.get('error')) {
    showAuth('signin');
    showAuthError('Sign in failed — please try again or use email.');
  }
});

// ─── SESSION CHECK ────────────────────────────────────────
async function checkSession() {
  try {
    const res = await fetch(\`\${WORKER_URL}/auth/me\`, { credentials: 'include' });
    const data = await res.json();
    if (data.user) {
      currentUser = data.user;
      hasUsedFreeRun = (data.usage?.[TOOL_NAME] || 0) >= 1;
      renderUserNav(data.user, data.usage, data.limits);
    }
  } catch {
    // Worker not connected yet — allow free run
  }
}

// ─── USAGE CHECK ─────────────────────────────────────────
// Returns true if allowed to proceed, false if blocked
async function checkUsage() {
  // Pro users always pass
  if (currentUser?.is_pro) return true;

  try {
    const res = await fetch(\`\${WORKER_URL}/api/usage?tool=\${TOOL_NAME}\`, { credentials: 'include' });
    const data = await res.json();
    const used = data.usage?.[TOOL_NAME] || 0;
    const limit = data.limits?.[TOOL_NAME] || 1;

    if (used >= limit) {
      // Already used free run — show upgrade wall
      if (currentUser) {
        // Signed in but not Pro
        showAuth('upgrade');
      } else {
        // Not signed in — show upgrade (signing in won't help unless they upgrade)
        showAuth('upgrade');
      }
      return false;
    }
    return true;
  } catch {
    // If worker unreachable, use localStorage as fallback
    const localUsed = parseInt(localStorage.getItem(\`yfs_used_\${TOOL_NAME}\`) || '0');
    if (localUsed >= 1) {
      showAuth('upgrade');
      return false;
    }
    return true;
  }
}

function updateFreeBanner() {
  const banner = document.getElementById('freeBanner');
  const count = document.getElementById('freeCount');
  const note = document.getElementById('freeNote');

  if (currentUser?.is_pro) {
    banner.className = 'free-banner';
    banner.innerHTML = '⚡ <strong>Pro — Unlimited</strong> — build and tailor as many resumes as you need.';
    if (note) note.style.display = 'none';
    return;
  }

  const localUsed = parseInt(localStorage.getItem(\`yfs_used_\${TOOL_NAME}\`) || '0');
  if (localUsed >= 1 || hasUsedFreeRun) {
    banner.className = 'free-banner out';
    banner.innerHTML = '🔒 You\\'ve used your free resume build. <strong>Upgrade to Pro ($9/mo)</strong> for unlimited access — or <a href="#" onclick="showAuth(\\'signin\\');return false;" style="color:var(--red);font-weight:700;">sign in</a> if you already have Pro.';
    if (note) note.style.display = 'none';
  } else {
    banner.className = 'free-banner';
    if (count) count.textContent = '1 free resume build';
    if (note) note.innerHTML = '1 free build · <strong style="color:var(--green)">No credit card · No account needed to start</strong>';
  }
}

// ─── STYLE PICKER ─────────────────────────────────────────
function pickStyle(s, el) {
  appStyle = s;
  document.querySelectorAll('.scard').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

// ─── FILE UPLOAD ──────────────────────────────────────────
async function handleUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  const ok = document.getElementById('uploadOk');
  ok.textContent = 'Reading…';
  try {
    if (file.name.endsWith('.txt')) {
      document.getElementById('userInput').value = await file.text();
      ok.textContent = '✓ File loaded';
    } else {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let txt = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const ct = await pg.getTextContent();
        txt += ct.items.map(it => it.str).join(' ') + '\\n';
      }
      document.getElementById('userInput').value = txt.trim();
      ok.textContent = \`✓ PDF loaded (\${pdf.numPages}p)\`;
    }
  } catch { ok.textContent = '✗ Can\\'t read file — paste text instead'; }
}

// ─── LOADING ANIMATION ────────────────────────────────────
function animateSteps() {
  const ids = ['s1','s2','s3','s4','s5'];
  ids.forEach(id => document.getElementById(id).className = '');
  let i = 0;
  document.getElementById(ids[0]).className = 'going';
  const iv = setInterval(() => {
    if (i < ids.length) {
      if (i > 0) document.getElementById(ids[i-1]).className = 'done';
      if (i < ids.length) document.getElementById(ids[i]).className = 'going';
      i++;
    } else {
      ids.forEach(id => document.getElementById(id).className = 'done');
      clearInterval(iv);
    }
  }, 1600);
  return iv;
}

// ─── GENERATE ─────────────────────────────────────────────
async function generate() {
  const input = document.getElementById('userInput').value.trim();
  if (!input) { toast('Add your background first', 'err'); return; }
  if (busy) return;

  // ── USAGE GATE — this is the wall ──
  const allowed = await checkUsage();
  if (!allowed) return; // Auth modal already shown

  busy = true;
  document.getElementById('genBtn').disabled = true;

  const jd = document.getElementById('jdInput').value.trim();
  const hasJD = jd.length > 30;

  showPhase('phase2');
  const iv = animateSteps();

  const userMsg = \`Parse and rewrite this background into a job-ready resume\${hasJD ? ' tailored to the job description' : ''}:\\n\\nBACKGROUND:\\n\${input}\${hasJD ? \`\\n\\nJOB DESCRIPTION:\\n\${jd}\` : ''}\`;

  try {
    // ── Call through Worker (keeps API key secret + tracks usage) ──
    const res = await fetch(\`\${WORKER_URL}/api/claude\`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: TOOL_NAME,
        messages: [{ role: 'user', content: CLAUDE_SYSTEM + '\\n\\n' + userMsg }],
        model: 'claude-sonnet-4-6'
      })
    });

    const d = await res.json();

    // Worker returned a limit error
    if (d.error === 'free_limit_reached') {
      clearInterval(iv);
      showPhase('phase1');
      showAuth('upgrade');
      busy = false;
      document.getElementById('genBtn').disabled = false;
      return;
    }

    clearInterval(iv);
    document.querySelectorAll('.step-list li').forEach(l => l.className = 'done');

    const raw = (d.content || []).map(c => c.text || '').join('').replace(/\`\`\`json|\`\`\`/g,'').trim();
    resumeData = JSON.parse(raw);

    // Mark free run used locally too (belt and suspenders)
    localStorage.setItem(\`yfs_used_\${TOOL_NAME}\`, '1');
    hasUsedFreeRun = true;

    if (resumeData.coachNote) document.getElementById('coachMsg').textContent = resumeData.coachNote;

    await sleep(500);
    renderDoc(resumeData, appStyle);
    syncPills(appStyle);
    showPhase('phase3');
    updateFreeBanner();
    setTimeout(() => { const h = document.getElementById('editHint'); if (h) h.style.display = 'none'; }, 6000);

  } catch (err) {
    clearInterval(iv);
    showPhase('phase1');
    // Fallback: try calling Claude directly if Worker not deployed yet
    await generateFallback(input, jd, hasJD);
  } finally {
    busy = false;
    document.getElementById('genBtn').disabled = false;
  }
}

// Fallback for before Worker is deployed — still enforces localStorage gate
async function generateFallback(input, jd, hasJD) {
  const iv = animateSteps();
  showPhase('phase2');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2800,
        messages: [{ role: 'user', content: CLAUDE_SYSTEM + '\\n\\nParse and rewrite:\\n' + input + (hasJD ? '\\n\\nJOB:\\n' + jd : '') }]
      })
    });
    const d = await res.json();
    clearInterval(iv);
    const raw = (d.content||[]).map(c=>c.text||'').join('').replace(/\`\`\`json|\`\`\`/g,'').trim();
    resumeData = JSON.parse(raw);
    localStorage.setItem(\`yfs_used_\${TOOL_NAME}\`, '1');
    hasUsedFreeRun = true;
    if (resumeData.coachNote) document.getElementById('coachMsg').textContent = resumeData.coachNote;
    await sleep(500);
    renderDoc(resumeData, appStyle);
    syncPills(appStyle);
    showPhase('phase3');
    updateFreeBanner();
    setTimeout(() => { const h = document.getElementById('editHint'); if (h) h.style.display = 'none'; }, 6000);
  } catch (err) {
    clearInterval(iv);
    showPhase('phase1');
    toast('Something went wrong — please try again', 'err');
    console.error(err);
  }
}

// ─── RENDER ───────────────────────────────────────────────
function renderDoc(d, s) {
  appStyle = s;
  document.getElementById('resumeDoc').innerHTML = buildHTML(d, s);
}

function buildHTML(d, s) {
  const cls = {modern:'t-modern',minimal:'t-minimal',trades:'t-trades',tech:'t-tech',classic:'t-classic'}[s]||'t-modern';
  const e = str => str ? String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
  const buls = arr => (arr||[]).map(b=>\`<div class="rbul" contenteditable="true">\${e(b)}</div>\`).join('');
  const certs = arr => (arr||[]).map(c=>\`<div class="rcert" contenteditable="true"><strong>\${e(c.name)}</strong>\${c.detail?' — '+e(c.detail):''}</div>\`).join('');
  const jobs = arr => (arr||[]).map(j=>\`<div class="rjob">
    <div class="rjtitle" contenteditable="true">\${e(j.title)}</div>
    <div class="rjmeta" contenteditable="true">\${e(j.company)}\${j.location?' · '+e(j.location):''} · \${e(j.dates)}</div>
    \${buls(j.bullets)}</div>\`).join('');
  const hasEdu = d.education && d.education.trim();
  const hasCerts = d.certifications && d.certifications.length;

  if (s==='trades') return \`<div class="\${cls}"><div class="rheader">
    <div class="rname" contenteditable="true">\${e(d.name)}</div>
    <div class="rtitle" contenteditable="true">\${e(d.title)}</div>
    <div class="rcontact" contenteditable="true">\${e(d.contact)}</div>
  </div><div class="rbody">
    <div class="rsect">Professional Summary</div><div class="rsum" contenteditable="true">\${e(d.summary)}</div>
    <div class="rsect">Experience</div>\${jobs(d.experience)}
    <div class="rsect">Skills &amp; Qualifications</div><div class="rskills" contenteditable="true">\${(d.skills||[]).map(e).join(' · ')}</div>
    \${hasCerts?\`<div class="rsect">Certifications &amp; Licenses</div>\${certs(d.certifications)}\`:''}
    \${hasEdu?\`<div class="rsect">Education</div><div class="rsum" contenteditable="true">\${e(d.education)}</div>\`:''}
  </div></div>\`;

  if (s==='tech') return \`<div class="\${cls}"><div class="rheader">
    <div class="rname" contenteditable="true">\${e(d.name)}</div>
    <div class="rtitle" contenteditable="true">\${e(d.title)}</div>
    <div class="rcontact" contenteditable="true">\${e(d.contact)}</div>
  </div><div class="rbody">
    <div class="rsect">Summary</div><div class="rsum" contenteditable="true">\${e(d.summary)}</div>
    <div class="rsect">Experience</div>\${jobs(d.experience)}
    <div class="rsect">Skills</div><div class="rskills" contenteditable="true">\${(d.skills||[]).map(e).join(' · ')}</div>
    \${hasCerts?\`<div class="rsect">Certifications</div>\${certs(d.certifications)}\`:''}
    \${hasEdu?\`<div class="rsect">Education</div><div class="rsum" contenteditable="true">\${e(d.education)}</div>\`:''}
  </div></div>\`;

  if (s==='classic') return \`<div class="\${cls}"><div class="rheader">
    <div class="rname" contenteditable="true">\${e(d.name)}</div>
    <div class="rtitle" contenteditable="true">\${e(d.title)}</div>
    <div class="rcontact" contenteditable="true">\${e(d.contact)}</div>
  </div>
    <div class="rsect">Professional Summary</div><div class="rsum" contenteditable="true">\${e(d.summary)}</div>
    <div class="rsect">Professional Experience</div>\${jobs(d.experience)}
    <div class="rsect">Core Competencies</div><div class="rskills" contenteditable="true">\${(d.skills||[]).map(e).join(' · ')}</div>
    \${hasCerts?\`<div class="rsect">Certifications &amp; Licenses</div>\${certs(d.certifications)}\`:''}
    \${hasEdu?\`<div class="rsect">Education</div><div class="rsum" contenteditable="true">\${e(d.education)}</div>\`:''}
  </div>\`;

  return \`<div class="\${cls}"><div class="rheader">
    <div class="rname" contenteditable="true">\${e(d.name)}</div>
    <div class="rtitle" contenteditable="true">\${e(d.title)}</div>
    <div class="rcontact" contenteditable="true">\${e(d.contact)}</div>
  </div>
    <div class="rsect">Summary</div><div class="rsum" contenteditable="true">\${e(d.summary)}</div>
    <div class="rsect">Experience</div>\${jobs(d.experience)}
    <div class="rsect">Skills</div><div class="rskills" contenteditable="true">\${(d.skills||[]).map(e).join(' · ')}</div>
    \${hasCerts?\`<div class="rsect">Certifications &amp; Training</div>\${certs(d.certifications)}\`:''}
    \${hasEdu?\`<div class="rsect">Education</div><div class="rsum" contenteditable="true">\${e(d.education)}</div>\`:''}
  </div>\`;
}

// ─── STYLE SWITCH ─────────────────────────────────────────
function switchStyle(s, el) {
  document.querySelectorAll('.spill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  if (resumeData) renderDoc(resumeData, s);
}
function syncPills(s) {
  document.querySelectorAll('.spill').forEach(p => p.classList.toggle('active', p.dataset.s === s));
}

// ─── SNAPSHOT EDITS ───────────────────────────────────────
function snapshot() {
  if (!resumeData) return;
  const doc = document.getElementById('resumeDoc');
  const t = (cls, i=0) => { const els=doc.querySelectorAll('.'+cls); return els[i]?els[i].innerText.trim():''; };
  resumeData.name = t('rname');
  resumeData.title = t('rtitle');
  resumeData.contact = t('rcontact');
  resumeData.summary = t('rsum');
  const skillEl = doc.querySelector('.rskills');
  if (skillEl) resumeData.skills = skillEl.innerText.split('·').map(s=>s.trim()).filter(Boolean);
  doc.querySelectorAll('.rjob').forEach((el,i) => {
    if (!resumeData.experience[i]) return;
    const jt=el.querySelector('.rjtitle'); if(jt) resumeData.experience[i].title=jt.innerText.trim();
    const jm=el.querySelector('.rjmeta'); if(jm) resumeData.experience[i].meta=jm.innerText.trim();
    resumeData.experience[i].bullets=Array.from(el.querySelectorAll('.rbul')).map(b=>b.innerText.trim());
  });
}

// ─── AI IMPROVEMENT (Pro gate) ────────────────────────────
async function aiImprove(type) {
  // AI improvements require Pro
  if (!currentUser?.is_pro) {
    showAuth('upgrade');
    return;
  }
  if (busy) { toast('Working…', 'info'); return; }
  busy = true;
  snapshot();

  const prompts = {
    strengthen: 'Rewrite all experience bullets with stronger past-tense action verbs and specific measurable impact. Return same JSON schema — only improve bullets arrays.',
    ats: 'Optimize for ATS systems. Add industry keywords, expand skills array, naturally repeat credentials. Return same JSON schema.',
    concise: 'Tighten every line. Cut filler, make every word earn its place. Return same JSON schema.',
    tone: 'Elevate language to sound more polished and senior. Return same JSON schema.'
  };
  const labels = {strengthen:'Strengthening bullets…',ats:'Optimizing for ATS…',concise:'Tightening it up…',tone:'Elevating the tone…'};
  toast(labels[type], 'info');

  try {
    const res = await fetch(\`\${WORKER_URL}/api/claude\`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'ai_improve',
        messages: [{ role: 'user', content: \`\${CLAUDE_SYSTEM}\\n\\n\${prompts[type]}\\n\\nResume:\\n\${JSON.stringify(resumeData,null,2)}\\n\\nReturn ONLY improved JSON.\` }]
      })
    });
    const d = await res.json();
    if (d.error === 'free_limit_reached') { showAuth('upgrade'); return; }
    const raw = (d.content||[]).map(c=>c.text||'').join('').replace(/\`\`\`json|\`\`\`/g,'').trim();
    Object.assign(resumeData, JSON.parse(raw));
    renderDoc(resumeData, appStyle);
    toast('Done! ✓', 'ok');
  } catch { toast('Failed — try again', 'err'); }
  finally { busy = false; }
}

// ─── JOB TAILORING (Pro gate) ─────────────────────────────
async function tailorResume() {
  if (!currentUser?.is_pro) { showAuth('upgrade'); return; }
  const jd = document.getElementById('tailorJD').value.trim();
  if (!jd) { toast('Paste a job description first', 'err'); return; }
  if (busy) return;
  busy = true;
  snapshot();
  const btn = document.getElementById('tailorBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Tailoring…';

  try {
    const res = await fetch(\`\${WORKER_URL}/api/claude\`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'tailor',
        messages: [{ role: 'user', content: \`\${CLAUDE_SYSTEM}\\n\\nRewrite this resume to target the job description. Mirror their language and keywords. Keep all facts accurate.\\n\\nRESUME:\\n\${JSON.stringify(resumeData,null,2)}\\n\\nJOB:\\n\${jd}\\n\\nReturn ONLY updated JSON.\` }]
      })
    });
    const d = await res.json();
    if (d.error === 'free_limit_reached') { showAuth('upgrade'); return; }
    const raw = (d.content||[]).map(c=>c.text||'').join('').replace(/\`\`\`json|\`\`\`/g,'').trim();
    Object.assign(resumeData, JSON.parse(raw));
    renderDoc(resumeData, appStyle);
    toast('Tailored! ✓', 'ok');
  } catch { toast('Failed — try again', 'err'); }
  finally {
    busy = false;
    btn.disabled = false;
    btn.innerHTML = '⚡ Tailor My Resume';
  }
}

// ─── DOWNLOADS ────────────────────────────────────────────
async function dlPDF() {
  snapshot();
  const el = document.getElementById('resumeDoc'); if (!el) return;
  const btn = document.getElementById('dlPdf');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Generating…';
  try {
    const bg = appStyle==='tech'?'#0d1117':appStyle==='trades'?'#1c1c1c':'#ffffff';
    const canvas = await html2canvas(el, {scale:2.5,useCORS:true,backgroundColor:bg,logging:false,removeContainer:true});
    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF({orientation:'portrait',unit:'mm',format:'letter'});
    const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight();
    const ratio=canvas.width/pw, fullH=canvas.height/ratio;
    let y=0, pg=0;
    while(y<fullH){
      if(pg>0) pdf.addPage();
      const sy=y*ratio, sh=Math.min(ph*ratio,canvas.height-sy);
      const sc=document.createElement('canvas');
      sc.width=canvas.width; sc.height=sh;
      const ctx=sc.getContext('2d');
      ctx.fillStyle=bg; ctx.fillRect(0,0,sc.width,sc.height);
      ctx.drawImage(canvas,0,sy,canvas.width,sh,0,0,canvas.width,sh);
      pdf.addImage(sc.toDataURL('image/jpeg',.96),'JPEG',0,0,pw,sh/ratio);
      y+=ph; pg++;
    }
    pdf.save(\`\${(resumeData?.name||'Resume').replace(/\\s+/g,'_')}_Resume.pdf\`);
    toast('PDF downloaded ✓', 'ok');
  } catch { toast('PDF failed — try Word instead', 'err'); }
  finally { btn.disabled=false; btn.innerHTML=orig; }
}

function dlWord() {
  snapshot(); if(!resumeData) return;
  const d=resumeData;
  const e=s=>s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';
  const html=\`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>
body{font-family:Calibri,sans-serif;font-size:11pt;color:#111;margin:72pt;line-height:1.4}
h1{font-size:20pt;font-weight:bold;margin:0 0 3pt}
.sub{font-size:10pt;color:#b45309;text-transform:uppercase;letter-spacing:1pt;margin:0 0 3pt}
.con{font-size:10pt;color:#666;margin:0 0 14pt}
hr{border:none;border-top:1.5pt solid #111;margin:8pt 0}
h2{font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1pt;color:#FF6B35;margin:12pt 0 5pt;border-bottom:.5pt solid #ddd;padding-bottom:2pt}
.jt{font-size:11pt;font-weight:bold;margin:0}
.jm{font-size:9.5pt;color:#888;margin:1pt 0 5pt}
.b{font-size:10.5pt;margin:0 0 3pt 14pt;text-indent:-6pt}
p{font-size:10.5pt;line-height:1.5;margin:0 0 8pt}
.sk{font-size:10.5pt;color:#444;line-height:1.6}
.ct{font-size:10.5pt;margin:0 0 3pt}
</style></head><body>
<h1>\${e(d.name)}</h1><div class="sub">\${e(d.title)}</div><div class="con">\${e(d.contact)}</div><hr>
<h2>Professional Summary</h2><p>\${e(d.summary)}</p>
<h2>Experience</h2>\${(d.experience||[]).map(j=>\`<div class="jt">\${e(j.title)}</div><div class="jm">\${e(j.company)}\${j.location?' · '+e(j.location):''} · \${e(j.dates)}</div>\${(j.bullets||[]).map(b=>\`<div class="b">• \${e(b)}</div>\`).join('')}<br>\`).join('')}
<h2>Skills &amp; Qualifications</h2><div class="sk">\${(d.skills||[]).map(e).join(' · ')}</div>
\${d.certifications&&d.certifications.length?\`<h2>Certifications &amp; Licenses</h2>\${d.certifications.map(c=>\`<div class="ct"><b>\${e(c.name)}</b>\${c.detail?' — '+e(c.detail):''}</div>\`).join('')}\`:''}
\${d.education?\`<h2>Education</h2><p>\${e(d.education)}</p>\`:''}
<br><div style="font-size:8pt;color:#ccc;text-align:center">Created with YourFirstShift™ — yourfirstshiftapp.com</div>
</body></html>\`;
  const blob=new Blob([html],{type:'application/msword'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=\`\${(d.name||'Resume').replace(/\\s+/g,'_')}_Resume.doc\`;
  a.click(); URL.revokeObjectURL(url);
  toast('Word doc downloaded ✓', 'ok');
}

function dlTXT() {
  snapshot(); if(!resumeData) return;
  const d=resumeData; const L='═'.repeat(58);
  const lines=[d.name.toUpperCase(),d.title,d.contact,'',L,'PROFESSIONAL SUMMARY',L,d.summary,'',L,'EXPERIENCE',L];
  (d.experience||[]).forEach(j=>{
    lines.push(\`\${j.title} | \${j.company}\${j.location?' | '+j.location:''} | \${j.dates}\`);
    (j.bullets||[]).forEach(b=>lines.push(\`  • \${b}\`));
    lines.push('');
  });
  lines.push(L,'SKILLS & QUALIFICATIONS',L,(d.skills||[]).join(' • '),'');
  if(d.certifications&&d.certifications.length){
    lines.push(L,'CERTIFICATIONS & LICENSES',L);
    d.certifications.forEach(c=>lines.push(\`\${c.name}\${c.detail?' — '+c.detail:''}\`));
    lines.push('');
  }
  if(d.education){lines.push(L,'EDUCATION',L,d.education,'');}
  lines.push('─'.repeat(58),'Created with YourFirstShift™ — yourfirstshiftapp.com');
  const blob=new Blob([lines.join('\\n')],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=\`\${(d.name||'Resume').replace(/\\s+/g,'_')}_ATS.txt\`;
  a.click(); URL.revokeObjectURL(url);
  toast('Plain text downloaded ✓', 'ok');
}

// ─── AUTH MODAL ───────────────────────────────────────────
function showAuth(mode) {
  const overlay = document.getElementById('authOverlay');
  const upgradeView = document.getElementById('upgradeView');
  const signinView = document.getElementById('signinView');
  const authClose = document.getElementById('authClose');
  const authIcon = document.getElementById('authIcon');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');

  clearAuthError();

  if (mode === 'upgrade') {
    upgradeView.style.display = 'block';
    signinView.style.display = 'none';
    authClose.style.display = 'block';
  } else {
    upgradeView.style.display = 'none';
    signinView.style.display = 'block';
    authClose.style.display = 'block';
    authIcon.textContent = '👋';
    authTitle.textContent = isSignup ? 'Create your free account' : 'Welcome back';
    authSubtitle.textContent = isSignup
      ? 'Free account gets you 1 run per tool. Upgrade anytime for unlimited.'
      : 'Sign in to access your resumes and Pro features.';
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showLoginView() {
  document.getElementById('upgradeView').style.display = 'none';
  document.getElementById('signinView').style.display = 'block';
}

function closeAuth() {
  document.getElementById('authOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// Close on overlay click
document.getElementById('authOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('authOverlay')) closeAuth();
});

function goUpgrade() {
  // TODO: Replace with your Stripe payment link when ready
  window.location.href = 'https://buy.stripe.com/3cIbIU3p4dJS7zd3BN04800';
  toast('Stripe coming soon — email hello@yourfirstshiftapp.com to upgrade manually', 'info');
  closeAuth();
}

// ─── GOOGLE AUTH ─────────────────────────────────────────
function signInWithGoogle() {
  window.location.href = \`\${WORKER_URL}/auth/google\`;
}

// ─── EMAIL AUTH ──────────────────────────────────────────
function toggleSignup() {
  isSignup = !isSignup;
  const pw = document.getElementById('authPassword');
  const toggle = document.getElementById('authToggle');
  const btn = document.getElementById('authEmailBtn');
  const title = document.getElementById('authTitle');
  const sub = document.getElementById('authSubtitle');
  if (pw) pw.style.display = isSignup ? 'block' : 'none';
  if (toggle) toggle.innerHTML = isSignup
    ? 'Already have an account? <a onclick="toggleSignup()">Sign in</a>'
    : 'New here? <a onclick="toggleSignup()">Create a free account</a>';
  if (btn) btn.textContent = isSignup ? 'Create Account' : 'Continue with Email';
  if (title) title.textContent = isSignup ? 'Create your free account' : 'Welcome back';
  if (sub) sub.textContent = isSignup
    ? 'Free account gets you 1 run per tool. Upgrade anytime for unlimited.'
    : 'Sign in to access your resumes and Pro features.';
}

async function handleEmailAuth() {
  const email = document.getElementById('authEmail')?.value?.trim();
  const password = document.getElementById('authPassword')?.value;
  if (!email || !email.includes('@')) { showAuthError('Please enter a valid email address.'); return; }
  if (isSignup && (!password || password.length < 6)) { showAuthError('Password must be at least 6 characters.'); return; }
  const btn = document.getElementById('authEmailBtn');
  btn.disabled = true; btn.textContent = 'Working…';
  try {
    const res = await fetch(\`\${WORKER_URL}/auth/\${isSignup?'register':'login'}\`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.user) {
      currentUser = data.user;
      closeAuth();
      renderUserNav(data.user, data.usage || {}, data.limits || {});
      updateFreeBanner();
      toast(\`Welcome\${isSignup?'':' back'}! 👋\`, 'ok');
    } else {
      showAuthError(data.message || 'Something went wrong — try Google instead.');
    }
  } catch { showAuthError('Connection error — try Google sign in.'); }
  finally { btn.disabled=false; btn.textContent = isSignup?'Create Account':'Continue with Email'; }
}

// ─── SIGN OUT ─────────────────────────────────────────────
async function signOut() {
  try { await fetch(\`\${WORKER_URL}/auth/logout\`, { method: 'POST', credentials: 'include' }); } catch {}
  currentUser = null;
  localStorage.removeItem(\`yfs_used_\${TOOL_NAME}\`);
  window.location.reload();
}

// ─── NAV RENDER ──────────────────────────────────────────
function renderUserNav(user, usage, limits) {
  const navRight = document.getElementById('navRight');
  if (!navRight) return;
  const initial = (user.name || user.email || '?')[0].toUpperCase();
  const avatar = user.picture ? \`<img src="\${user.picture}" alt="">\` : initial;
  navRight.innerHTML = \`
    <div style="position:relative;">
      <div class="user-menu" onclick="toggleDrop()">
        <div class="user-avatar">\${avatar}</div>
        <span class="user-name">\${user.name?.split(' ')[0] || 'You'}</span>
        <span style="font-size:10px;color:var(--light);">▼</span>
      </div>
      <div class="user-dropdown" id="userDrop">
        <div class="dd-head">
          <div class="dd-name">\${user.name||''}</div>
          <div class="dd-email">\${user.email}</div>
          <div class="dd-plan" style="color:\${user.is_pro?'var(--green)':'var(--orange)'}">
            \${user.is_pro?'⚡ Pro — Unlimited':'🆓 Free Plan (1 run per tool)'}
          </div>
        </div>
        \${!user.is_pro?\`<div class="dd-item upgrade" onclick="showAuth('upgrade')">⚡ Upgrade to Pro — $9/mo</div><div class="dd-divider"></div>\`:''}
        <div class="dd-item danger" onclick="signOut()">Sign Out</div>
      </div>
    </div>\`;
}

function toggleDrop() {
  document.getElementById('userDrop')?.classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu')) document.getElementById('userDrop')?.classList.remove('open');
});

// ─── HELPERS ─────────────────────────────────────────────
function showPhase(id) {
  ['phase0','phase1','phase2','phase3'].forEach(p => {
    const el = document.getElementById(p);
    if(el) el.classList.toggle('active', p===id);
  });
}
function startOver() {
  resumeData = null;
  ['userInput','jdInput','tailorJD'].forEach(id => document.getElementById(id).value='');
  document.getElementById('uploadOk').textContent='';
  document.getElementById('jdCheck').checked=false;
  document.getElementById('jdWrap').classList.remove('show');
  showPhase('phase1');
  updateFreeBanner();
}
function showAuthError(msg) {
  const el=document.getElementById('authError'); if(el){el.textContent=msg;el.classList.add('show');}
}
function clearAuthError() {
  const el=document.getElementById('authError'); if(el) el.classList.remove('show');
}
function setCoach(msg) { document.getElementById('coachMsg').textContent=msg; }
let _tt;
function toast(msg, type) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show'+(type?' '+type:'');
  clearTimeout(_tt); _tt=setTimeout(()=>t.classList.remove('show'),3200);
}
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }
</script>
</body>
</html>
`;

// ============================================================
// YourFirstShift™ — Cloudflare Worker v3.0
// Handles: Claude API + Google OAuth + Stripe + D1 Database
// ============================================================

const FREE_LIMITS = {
  resume: 1,
  ats: 1,
  coverletter: 1,
  outreach: 1,
  interview: 1,
  ai_improve: 0,  // Pro only
  tailor: 0,      // Pro only
};

// ── CORS ────────────────────────────────────────────────────
const ALLOWED_ORIGINS = ['https://yourfirstshiftapp.com', 'https://www.yourfirstshiftapp.com', 'https://yourfirstshift.pages.dev', 'https://yourfirstshift-site.pages.dev'];
const RL_LIMIT = 20;
function originOk(o) { if (!o) return false; if (ALLOWED_ORIGINS.includes(o)) return true; try { const u = new URL(o); return u.protocol === 'https:' && /^[a-z0-9-]+\.yourfirstshift-site\.pages\.dev$/.test(u.hostname); } catch { return false; } }
function cors(origin) { if (!originOk(origin)) return { 'Vary': 'Origin' }; return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-YFS-Pro, X-YFS-Kind, X-YFS-Run, X-YFS-Dev', 'Access-Control-Allow-Credentials': 'true', 'Vary': 'Origin' }; }
function requestOriginAllowed(request) { const o = request.headers.get('Origin'); if (o) return originOk(o); const r = request.headers.get('Referer'); if (!r) return false; try { return originOk(new URL(r).origin); } catch { return false; } }
async function rateLimit(request) { const ip = request.headers.get('CF-Connecting-IP') || 'unknown'; const hour = Math.floor(Date.now() / 3600000); const key = new Request(`https://rl.internal/rl:${ip}:${hour}`); const cache = caches.default; const hit = await cache.match(key); const count = hit ? parseInt(await hit.text(), 10) || 0 : 0; if (count >= RL_LIMIT) return { ok: false, count }; await cache.put(key, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=3600' } })); return { ok: true, count: count + 1 }; }
// sec-fix 3: a valid Pro/org/pack token is limited per subscription/seat (not per IP); free callers per IP.
const RL_FREE_PER_HOUR = 60, RL_PRO_PER_HOUR = 120;
const RL_FREE_IP_CEIL = 300; // per-IP ceiling across all devices (classrooms / shared Wi-Fi); stops device-id rotation
function yfsRlId(p) { if (!p) return ''; if (p.org) { const c = yfsOrgCode(p.org), d = yfsOrgDevice(p.did); return c && d ? 'org:' + c + ':' + d : ''; } if (p.sub) return 'sub:' + String(p.sub); if (p.pack) return 'pack:' + String(p.pack); return ''; }
async function yfsRateLimit(request, env) { const hour = Math.floor(Date.now() / 3600000); let id = ''; const tok = request.headers.get('X-YFS-Pro'); if (tok && env && env.PRO_SIGNING_SECRET) { try { id = yfsRlId(await verifyProToken(env, tok)); } catch (_) { id = ''; } } if (id) { const r = await yfsRlHit(env, id, hour, RL_PRO_PER_HOUR); return { ...r, max: RL_PRO_PER_HOUR, keyed: 'token', hour }; } const ip = request.headers.get('CF-Connecting-IP') || 'unknown'; const dev = yfsDevId(request); if (dev) { const [c, r] = await Promise.all([yfsRlHit(env, 'ip:' + ip + '|all', hour, RL_FREE_IP_CEIL), yfsRlHit(env, 'ip:' + ip + '|d:' + dev, hour, RL_FREE_PER_HOUR)]); if (!c.ok) return { ...c, max: RL_FREE_IP_CEIL, keyed: 'ip-ceiling', hour }; return { ...r, max: RL_FREE_PER_HOUR, keyed: 'ip+device', hour }; } const r = await yfsRlHit(env, 'ip:' + ip, hour, RL_FREE_PER_HOUR); return { ...r, max: RL_FREE_PER_HOUR, keyed: 'ip', hour }; }
// 429 body for the new limiter (app shows its own text for 429s; this is for humans/devtools). Retry-After = seconds to the hour boundary.
function yfsRateLimited(rl, origin) { const now = Math.floor(Date.now() / 1000); const hour = (rl && rl.hour) || Math.floor(now / 3600); const retry = Math.max(60, (hour + 1) * 3600 - now); return j({ error: 'rate_limited', message: 'Too many requests right now. Please wait about ' + Math.ceil(retry / 60) + ' minutes and try again.', retry_after: retry, limit_per_hour: (rl && rl.max) || null }, 429, origin, { 'Retry-After': String(retry), 'Cache-Control': 'no-store' }); }
// Counter lives in D1 (one global, atomic count; the Cache API counter is per data center). IPs are stored only as a
// keyed HMAC prefix; rows expire after ~2h. Fails OPEN on a D1 error or after RL_STORE_TIMEOUT_MS (a slow or down
// counter never blocks or hangs a request).
let yfsRlReady = false;
const RL_STORE_TIMEOUT_MS = 1500;
// IP keys are an HMAC keyed by the existing PRO_SIGNING_SECRET binding (no salt in source); plain SHA-256 if it is missing.
let yfsRlKey = null;
async function yfsRlHash(env, v) { if (env.PRO_SIGNING_SECRET) { if (!yfsRlKey) yfsRlKey = await crypto.subtle.importKey('raw', te.encode('yfs-rl:' + env.PRO_SIGNING_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return hex(await crypto.subtle.sign('HMAC', yfsRlKey, te.encode(v))).slice(0, 32); } return hex(await crypto.subtle.digest('SHA-256', te.encode(v))).slice(0, 32); }
async function yfsRlHit(env, id, hour, max) { if (!env || !env.DB) return { ok: true, count: 0, store: 'none' }; let timer; const to = new Promise(res => { timer = setTimeout(() => { try { console.error('yfs rate-limit store timeout'); } catch (_) {} res({ ok: true, count: 0, store: 'timeout' }); }, RL_STORE_TIMEOUT_MS); }); try { return await Promise.race([yfsRlHitD1(env, id, hour, max), to]); } finally { clearTimeout(timer); } }
async function yfsRlHitD1(env, id, hour, max) { if (!env || !env.DB) return { ok: true, count: 0, store: 'none' }; try { if (id.startsWith('ip:')) id = 'ip:' + (await yfsRlHash(env, id.slice(3))); if (!yfsRlReady) { await env.DB.prepare('CREATE TABLE IF NOT EXISTS yfs_rl (k TEXT PRIMARY KEY, n INTEGER NOT NULL, exp INTEGER NOT NULL)').run(); yfsRlReady = true; } const k = id + ':' + hour; const row = await env.DB.prepare('INSERT INTO yfs_rl (k, n, exp) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n').bind(k, (hour + 2) * 3600).first(); const n = (row && Number(row.n)) || 1; if (Math.random() < 0.01) { try { await env.DB.prepare('DELETE FROM yfs_rl WHERE exp < ?').bind(Math.floor(Date.now() / 1000)).run(); } catch (_) {} } return { ok: n <= max, count: n, store: 'd1' }; } catch (e) { try { console.error('yfs rate-limit store error', String(e && e.message || e)); } catch (_) {} return { ok: true, count: 0, store: 'error' }; } }

function json(data, status=200, origin='') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });
}

// ── MAIN ROUTER ─────────────────────────────────────────────

// ── YourFirstShift Pro unlock (merged) ──
const PAYMENT_LINK_ID = 'plink_1TtWB12UF854inJLWljHjKrk';
const PRO_TOKEN_TTL_S = 60 * 60 * 24 * 35; // 35 days; re-checked against KV each call
const FREE_PER_DAY = 1;
const ACTIVE_SUB = new Set(['active', 'trialing', 'past_due']); // past_due = grace

function j(body, status, origin, extra = {}) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...cors(origin), ...extra } });
}

// ---- base64url / HMAC helpers ----
const te = new TextEncoder();
function b64u(buf) {
  const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = ''; for (const c of b) s += String.fromCharCode(c);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
async function hmac(secret, data) {
  const k = await crypto.subtle.importKey('raw', te.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, te.encode(data));
}
function hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---- Pro token: base64url(json).base64url(hmac) ----
async function signProToken(env, payload) {
  const body = b64u(te.encode(JSON.stringify(payload)));
  return body + '.' + b64u(await hmac(env.PRO_SIGNING_SECRET, body));
}
async function verifyProToken(env, token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expect = b64u(await hmac(env.PRO_SIGNING_SECRET, body));
  if (!safeEq(sig, expect)) return null;
  let p; try { p = JSON.parse(new TextDecoder().decode(b64uDecode(body))); } catch { return null; }
  if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
  // Org-code Pro (B2B): code must still exist, not ended, and this device's seat must still exist.
  if (p.org) { if (!(await yfsOrgTokenOk(env, p))) return null; return p; }
  if (p.pack) { if (p.pi && env.YFS_KV && await env.YFS_KV.get('packrev:' + p.pi)) return null; return p; }
  // Revocation: subscription state from webhook (missing record => trust token until exp)
  if (p.sub && env.YFS_KV) {
    const rec = await env.YFS_KV.get('sub:' + p.sub, 'json');
    if (rec && !ACTIVE_SUB.has(rec.status)) return null;
  }
  return p;
}

// ---- Stripe REST (restricted key) ----
async function stripeGet(env, path) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    headers: { Authorization: 'Bearer ' + env.STRIPE_RK } });
  const d = await r.json();
  if (!r.ok) throw new Error((d.error && d.error.message) || 'stripe ' + r.status);
  return d;
}

// ---- POST /api/pro/verify {session_id} ----
async function handleProVerify(request, env, origin) {
  if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin);
  const rl = await rateLimit(request);
  if (!rl.ok) return j({ error: 'Rate limit' }, 429, origin, { 'Retry-After': '3600' });
  let sid; try { sid = (await request.json()).session_id; } catch {}
  if (!sid || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(sid)) return j({ error: 'bad session_id' }, 400, origin);
  let s;
  try { s = await stripeGet(env, 'checkout/sessions/' + encodeURIComponent(sid)); }
  catch (e) { return j({ error: 'session not found' }, 404, origin); }
  if (s.status !== 'complete') return j({ error: 'session not complete' }, 402, origin);
  if (!yfsIsProSession(s)) return j({ error: 'wrong product' }, 403, origin);
  if (s.mode === 'payment') {
    if (!yfsIsPackSession(s)) return j({ error: 'not paid' }, 402, origin);
    const t = await yfsPackToken(env, s, 'pack');
    if (!t) return j({ error: 'pack ended' }, 410, origin);
    return j({ ok: true, token: t.token, exp: t.exp, plan: 'pack' }, 200, origin);
  }
  if (s.mode !== 'subscription' || !s.subscription) return j({ error: 'not a subscription' }, 403, origin);
  const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
  // Seed KV in case webhook hasn't landed yet
  if (env.YFS_KV) {
    const existing = await env.YFS_KV.get('sub:' + subId, 'json');
    if (!existing) await env.YFS_KV.put('sub:' + subId, JSON.stringify({
      status: 'active', customer: s.customer, updated: Date.now(), src: 'verify' }));
  }
  const now = Math.floor(Date.now() / 1000);
  const token = await signProToken(env, { sub: subId, cus: s.customer, iat: now, exp: now + PRO_TOKEN_TTL_S });
  return j({ ok: true, token, exp: now + PRO_TOKEN_TTL_S }, 200, origin);
}

// ---- Stripe-Signature verify (t=…,v1=…; 5-min tolerance) ----
async function verifyYfsStripeSig(env, raw, header) {
  if (!header) return false;
  let t = null; const v1 = [];
  for (const kv of header.split(',')) {
    const [k, v] = kv.split('='); if (k === 't') t = v; else if (k === 'v1') v1.push(v);
  }
  if (!t || !v1.length) return false;
  if (Math.abs(Date.now() / 1000 - parseInt(t, 10)) > 300) return false;
  const expect = hex(await hmac(env.STRIPE_WEBHOOK_SECRET, t + '.' + raw));
  return v1.some(s => safeEq(s, expect));
}

// ---- POST /api/stripe/webhook ----
async function handleYfsProStripeWebhook(request, env) {
  const raw = await request.text();
  if (!(await verifyYfsStripeSig(env, raw, request.headers.get('Stripe-Signature'))))
    return new Response('bad signature', { status: 400 });
  const evt = JSON.parse(raw);
  // idempotency
  if (await env.YFS_KV.get('evt:' + evt.id)) return new Response('dup', { status: 200 });
  const o = evt.data.object;
  const put = (subId, status, extra = {}) => subId && env.YFS_KV.put('sub:' + subId,
    JSON.stringify({ status, customer: o.customer, updated: Date.now(), evt: evt.type, ...extra }));
  switch (evt.type) {
    case 'checkout.session.completed':
      if (yfsIsProSession(o) && o.subscription) await put(o.subscription, 'active');
      break;
    case 'customer.subscription.updated':
      await put(o.id, o.status, yfsSubCancelFields(o));
      break;
    case 'customer.subscription.deleted':
      await put(o.id, 'canceled', yfsSubCancelFields(o));
      break;
    case 'invoice.paid':
      await put(typeof o.subscription === 'string' ? o.subscription
        : (o.parent && o.parent.subscription_details && o.parent.subscription_details.subscription), 'active');
      break;
    case 'charge.refunded':
      if (o.payment_intent && (o.refunded || o.amount_refunded > 0)) await env.YFS_KV.put('packrev:' + (typeof o.payment_intent === 'string' ? o.payment_intent : o.payment_intent.id), '1', { expirationTtl: 60 * 86400 });
      break;
    case 'charge.dispute.created':
      // chargeback on a $29 Job Hunt Pack → pass stops working (same as a refund)
      if (o.payment_intent) await env.YFS_KV.put('packrev:' + (typeof o.payment_intent === 'string' ? o.payment_intent : o.payment_intent.id), '1', { expirationTtl: 120 * 86400 });
      break;
    case 'invoice.payment_failed':
      await put(typeof o.subscription === 'string' ? o.subscription
        : (o.parent && o.parent.subscription_details && o.parent.subscription_details.subscription), 'past_due');
      break;
    default: break;
  }
  await env.YFS_KV.put('evt:' + evt.id, '1', { expirationTtl: 60 * 60 * 24 * 7 });
  return new Response('ok', { status: 200 });
}

// ---- POST /api/pro/restore {email} (P0.9 cross-device restore) ----
async function handleProRestore(request, env, origin) {
  if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin);
  const rl = await yfsRateLimit(request, env);
  if (!rl.ok) return yfsRateLimited(rl, origin);
  let email; try { email = String((await request.json()).email || '').trim(); } catch {}
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return j({ error: 'bad email' }, 400, origin);
  const variants = [...new Set([email, email.toLowerCase()])];
  let found = null, pack = null;
  try {
    // Lookup via Checkout Sessions on the Pro Payment Link (key has checkout read; no customer read needed)
    for (const em of variants) {
      const ss = await stripeGet(env, 'checkout/sessions?limit=50&status=complete&customer_details[email]=' + encodeURIComponent(em));
      for (const x of (ss.data || [])) {
        if (yfsIsPackSession(x)) { const t = await yfsPackToken(env, x, 'restore'); if (t && (!pack || t.exp > pack.exp)) pack = t; continue; }
        if (!yfsIsProSession(x) || x.mode !== 'subscription' || !x.subscription) continue;
        const subId = typeof x.subscription === 'string' ? x.subscription : x.subscription.id;
        let status = null;
        try { status = (await stripeGet(env, 'subscriptions/' + encodeURIComponent(subId))).status; } catch (_) {}
        if (status == null && env.YFS_KV) { const rec = await env.YFS_KV.get('sub:' + subId, 'json'); status = rec && rec.status; }
        if (!status || !ACTIVE_SUB.has(status)) continue;
        if (env.YFS_KV) { const rec = await env.YFS_KV.get('sub:' + subId, 'json'); if (rec && !ACTIVE_SUB.has(rec.status)) continue; }
        found = { sub: subId, cus: x.customer }; break;
      }
      if (found) break;
    }
  } catch (e) {
    const m = String(e && e.message || ''); console.log('restore lookup failed', /ermission/.test(m) ? 'permission' : 'other');
    return j({ error: 'lookup failed, try again' }, 502, origin);
  }
  if (!found && pack) return j({ ok: true, token: pack.token, exp: pack.exp, plan: 'pack' }, 200, origin);
  if (!found) return j({ error: 'no active Pro subscription for that email' }, 404, origin);
  const now = Math.floor(Date.now() / 1000);
  const token = await signProToken(env, { sub: found.sub, cus: found.cus, iat: now, exp: now + PRO_TOKEN_TTL_S, src: 'restore' });
  return j({ ok: true, token, exp: now + PRO_TOKEN_TTL_S }, 200, origin);
}


// ---- Stripe-confirmed cancel fields (no secrets) ----
function yfsPeriodEnd(o) {
  if (o.current_period_end) return o.current_period_end;
  const it = o.items && o.items.data && o.items.data[0];
  return (it && it.current_period_end) || null;
}
function yfsSubCancelFields(o) {
  const pe = yfsPeriodEnd(o);
  const canceling = !!o.cancel_at_period_end || !!o.cancel_at || o.status === 'canceled';
  const ends = o.status === 'canceled' ? (o.ended_at || o.canceled_at || pe) : (o.cancel_at || (o.cancel_at_period_end ? pe : null));
  return { cancel_at_period_end: !!o.cancel_at_period_end, cancel_at: o.cancel_at || null,
    canceled_at: o.canceled_at || null, ended_at: o.ended_at || null, period_end: pe,
    canceling, access_ends: canceling ? ends : null };
}
// ---- POST /api/pro/status {token} -> Stripe-confirmed sub state ----
async function handleProStatus(request, env, origin) {
  if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin);
  const rl = await yfsRateLimit(request, env);
  if (!rl.ok) return yfsRateLimited(rl, origin);
  let token; try { token = String((await request.json()).token || ''); } catch {}
  if (!token || !token.includes('.')) return j({ error: 'bad token' }, 400, origin);
  const [body, sig] = token.split('.');
  const expect = b64u(await hmac(env.PRO_SIGNING_SECRET, body));
  if (!safeEq(sig || '', expect)) return j({ error: 'bad token' }, 401, origin);
  let p; try { p = JSON.parse(new TextDecoder().decode(b64uDecode(body))); } catch { return j({ error: 'bad token' }, 400, origin); }
  if (!p.sub) return j({ error: 'no subscription on token' }, 404, origin);
  let f = null, status = null, src = 'stripe';
  try { const o = await stripeGet(env, 'subscriptions/' + encodeURIComponent(p.sub)); status = o.status; f = yfsSubCancelFields(o); }
  catch (_) {
    const rec = env.YFS_KV && await env.YFS_KV.get('sub:' + p.sub, 'json');
    if (rec && rec.evt) { status = rec.status; f = rec; src = 'webhook'; }
  }
  if (!status) return j({ error: 'status unavailable' }, 502, origin);
  return j({ ok: true, src, status, active: ACTIVE_SUB.has(status), canceling: !!(f && f.canceling),
    access_ends: (f && f.access_ends) || null, canceled_at: (f && f.canceled_at) || null }, 200, origin);
}


// ---- Anonymous funnel counters (no PII: no email, no IP, no ids stored) ----
const YFS_METRICS=['visit','free_run','pay_tap','org_redeem','heard_about','heard_skip'];
async function handleMetrics(request, env, path, origin){
  const H={'Cache-Control':'no-store'};
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  const day=new Date().toISOString().slice(0,10);
  if (request.method === 'GET' && path === '/api/metrics') {
    const out={total:{},today:{},day};
    for (const m of YFS_METRICS){ out.total[m]=parseInt(await env.YFS_KV.get('m:'+m)||'0',10); out.today[m]=parseInt(await env.YFS_KV.get('m:'+m+':'+day)||'0',10); }
    const days=[];for(let i=1;i<7;i++){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);const r={day:d};for(const m of YFS_METRICS)r[m]=parseInt(await env.YFS_KV.get('m:'+m+':'+d)||'0',10);days.push(r);}
    out.prior_days=days;
    return j(out,200,origin,H);
  }
  const m=path.slice('/api/metrics/'.length);
  if (request.method === 'POST' && YFS_METRICS.includes(m)) {
    if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin);
    const inc=async k=>{const v=parseInt(await env.YFS_KV.get(k)||'0',10)+1;await env.YFS_KV.put(k,String(v));return v;};
    const t=await inc('m:'+m); await inc('m:'+m+':'+day);
    return j({ok:true,metric:m,total:t},200,origin,H);
  }
  return j({error:'not found'},404,origin);
}


// ---- Worker-created Pro Checkout Session (cancel returns to the free result) ----
const YFS_PRO_PRICE = 'price_1TtWAN2UF854inJLHEqOW9Lx'; // same $9/mo price as Payment Link
function yfsIsProSession(s) { return !!s && (s.payment_link === PAYMENT_LINK_ID || (s.metadata && s.metadata.yfs_pro === '1')); }
// ---- Plans: $9/mo Pro (always), $59/yr Pro and $29 one-time 30-day Job Hunt Pack (only when Shift sets their Stripe price IDs as plain vars) ----
const YFS_PACK_DAYS = 30;
function yfsPlanFor(env, id) {
  id = String(id || 'pro');
  if (id === 'pro') return { id: 'pro', mode: 'subscription', price: YFS_PRO_PRICE };
  if (id === 'pro_year' && /^price_[A-Za-z0-9]+$/.test(env.YFS_PRICE_YEAR || '')) return { id, mode: 'subscription', price: env.YFS_PRICE_YEAR };
  if (id === 'pack' && /^price_[A-Za-z0-9]+$/.test(env.YFS_PRICE_PACK || '')) return { id, mode: 'payment', price: env.YFS_PRICE_PACK };
  return null;
}
function yfsIsPackSession(s) {
  return !!s && s.mode === 'payment' && s.payment_status === 'paid' && !!s.metadata && s.metadata.yfs_pro === '1' && s.metadata.yfs_plan === 'pack';
}
function yfsPackPi(s) { return s && (typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent && s.payment_intent.id)) || ''; }
async function yfsPackToken(env, s, src) {
  const now = Math.floor(Date.now() / 1000), exp = (Number(s.created) || now) + YFS_PACK_DAYS * 86400;
  if (exp <= now) return null;
  const pi = yfsPackPi(s);
  if (pi && env.YFS_KV && await env.YFS_KV.get('packrev:' + pi)) return null;      // refunded
  return { token: await signProToken(env, { pack: s.id, pi, cus: s.customer, iat: now, exp, src }), exp };
}
// GET /api/pro/plans → which plans can be bought right now (app shows only these)
function handleProPlans(env, origin) {
  return j({ plans: { pro: true, pro_year: !!yfsPlanFor(env, 'pro_year'), pack: !!yfsPlanFor(env, 'pack') }, pack_days: YFS_PACK_DAYS }, 200, origin, { 'Cache-Control': 'no-store' });
}

async function handleProCheckout(request, env, origin) {
  if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin);
  const rl = await rateLimit(request);
  if (!rl.ok) return j({ error: 'Rate limit' }, 429, origin, { 'Retry-After': '3600' });
  let b = {}; try { b = await request.json(); } catch {}
  let email = String(b.email || '').trim();
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) email = '';
  const plan = yfsPlanFor(env, b.plan);
  if (!plan) return j({ error: 'plan_unavailable' }, 409, origin);
  const src = String(b.src || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  const base = originOk(origin) ? origin : 'https://yourfirstshiftapp.com';
  const p = new URLSearchParams();
  p.set('mode', plan.mode);
  p.set('line_items[0][price]', plan.price);
  p.set('line_items[0][quantity]', '1');
  p.set('success_url', base + '/app.html?checkout=success&session_id={CHECKOUT_SESSION_ID}');
  p.set('cancel_url', base + '/app.html?checkout=canceled');
  p.set('billing_address_collection', 'auto');
  p.set('metadata[yfs_pro]', '1');
  p.set('metadata[yfs_plan]', plan.id);
  if (src) p.set('metadata[yfs_src]', src);
  if (plan.mode === 'subscription') {
    p.set('subscription_data[metadata][yfs_pro]', '1');
    p.set('subscription_data[metadata][yfs_plan]', plan.id);
  } else {
    p.set('customer_creation', 'always');
    p.set('payment_intent_data[metadata][yfs_plan]', plan.id);
  }
  if (email) p.set('customer_email', email);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST',
    headers: { Authorization: 'Bearer ' + env.STRIPE_RK, 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.url) return j({ error: 'checkout unavailable', detail: d.error && d.error.message }, 502, origin);
  return j({ url: d.url, id: d.id }, 200, origin, { 'Cache-Control': 'no-store' });
}

// ---- Router hook (insert point C) ----
// ════════════════════════════════════════════════════════════════════════════
// B2B org codes (PR #5 org-codes + PR #6 org-report). Added by Claude.
// KV keys (no personal data):
//   org:<CODE>                        {"org","seat_limit","ends"(unix s),"plan","issued"}  ← Shift creates
//   orgcount:<CODE>                   "<seats redeemed>"
//   orgseat:<CODE>:<device>           "<first redeem unix s>"   (delete to free a seat)
//   orgact:<CODE>:<YYYY-MM>:<device>  "1"  (TTL 400d)  → active seats per month
//   orgm:<CODE>:<YYYY-MM>:run:<tool>  "<count>"         → Pro runs per tool per month
// Org tokens use the same signer as Stripe Pro: {org, did, iat, exp:ends, src:'org'}, no `sub`
// (so /api/pro/status and Stripe revocation never touch them).
// Secrets: uses PRO_SIGNING_SECRET (existing). Report route needs ADMIN_KEY (new; wrangler secret put).
// ════════════════════════════════════════════════════════════════════════════
const ORG_TOOLS = ['translator', 'ats', 'outreach', 'cover', 'interview', 'builder', 'other'];
const ORG_RL_PER_HOUR = 10;
function yfsOrgCode(c) { c = String(c || '').toUpperCase().replace(/\s+/g, '').replace(/[–—_]/g, '-').trim();
  return (c.length >= 6 && c.length <= 24 && /^[A-Z0-9]{2,8}(-[A-Z0-9]{2,8}){1,3}$/.test(c)) ? c : ''; }
function yfsOrgDevice(d) { d = String(d || ''); return /^[a-f0-9]{32}$/.test(d) ? d : ''; }
function yfsMonth(d = new Date()) { return d.toISOString().slice(0, 7); }
function yfsOrgEnds(rec) { const e = Number(rec && rec.ends) || 0; return e > 1e12 ? Math.floor(e / 1000) : e; }
async function yfsOrgTokenOk(env, p) {
  if (!env.YFS_KV) return false;
  const code = yfsOrgCode(p.org), dev = yfsOrgDevice(p.did);
  if (!code || !dev) return false;
  const rec = await env.YFS_KV.get('org:' + code, 'json');
  if (!rec || rec.disabled) return false;
  if (yfsOrgEnds(rec) <= Math.floor(Date.now() / 1000)) return false;     // ended (or ended early by Shift)
  return !!(await env.YFS_KV.get('orgseat:' + code + ':' + dev));        // seat freed by Shift → off
}
async function yfsOrgRateLimit(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const hour = Math.floor(Date.now() / 3600000);
  const key = new Request(`https://rl.internal/org:${ip}:${hour}`); const cache = caches.default;
  const hit = await cache.match(key); const n = hit ? parseInt(await hit.text(), 10) || 0 : 0;
  if (n >= ORG_RL_PER_HOUR) return false;
  await cache.put(key, new Response(String(n + 1), { headers: { 'Cache-Control': 'max-age=3600' } }));
  return true;
}
async function kvInc(env, key, opts) { const n = (parseInt(await env.YFS_KV.get(key) || '0', 10) || 0) + 1; await env.YFS_KV.put(key, String(n), opts); return n; }

// ---- POST /api/org/redeem {code, device} ----
async function handleOrgRedeem(request, env, origin) {
  if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin);
  if (!env.YFS_KV || !env.PRO_SIGNING_SECRET) return j({ error: 'unavailable' }, 503, origin);
  if (!(await yfsOrgRateLimit(request))) return j({ error: 'Rate limit' }, 429, origin, { 'Retry-After': '3600' });
  let b = {}; try { b = await request.json(); } catch {}
  const code = yfsOrgCode(b.code), dev = yfsOrgDevice(b.device);
  if (!dev) return j({ error: 'bad_device' }, 400, origin);
  if (!code) return j({ error: 'invalid' }, 404, origin);
  const rec = await env.YFS_KV.get('org:' + code, 'json');
  if (!rec || rec.disabled) return j({ error: 'invalid' }, 404, origin);
  const now = Math.floor(Date.now() / 1000), ends = yfsOrgEnds(rec);
  if (!ends || ends <= now) return j({ error: 'expired', ends }, 410, origin);
  const limit = Math.max(0, parseInt(rec.seat_limit, 10) || 0);
  const seatKey = 'orgseat:' + code + ':' + dev;
  let used = parseInt(await env.YFS_KV.get('orgcount:' + code) || '0', 10) || 0;
  if (!(await env.YFS_KV.get(seatKey))) {                       // new device → needs a free seat
    if (used >= limit) return j({ error: 'full', seat_limit: limit }, 409, origin);
    await env.YFS_KV.put(seatKey, String(now));
    used = await kvInc(env, 'orgcount:' + code);                // KV not atomic: fine at pilot size
  }
  const token = await signProToken(env, { org: code, did: dev, iat: now, exp: ends, src: 'org' });
  return j({ ok: true, token, org: String(rec.org || '').slice(0, 80), ends, seats_used: used, seat_limit: limit }, 200, origin);
}

// ---- POST /api/metrics/org_event  (text/plain JSON {t, k:'open'|'run', tool}) ----
async function handleOrgEvent(request, env, origin) {
  const H = { 'Cache-Control': 'no-store' };
  const done = () => new Response(null, { status: 204, headers: { ...cors(origin), ...H } });
  if (!env.YFS_KV || !requestOriginAllowed(request)) return done();
  let b = {}; try { b = JSON.parse(await request.text()); } catch { return done(); }
  const p = await verifyProToken(env, String(b.t || ''));      // same check as the AI route; rejects expired/freed
  if (!p || !p.org) return done();                             // not an org token → ignore
  const code = yfsOrgCode(p.org), dev = yfsOrgDevice(p.did), mon = yfsMonth();
  if (b.k !== 'open' && b.k !== 'run') return done();
  await env.YFS_KV.put(`orgact:${code}:${mon}:${dev}`, '1', { expirationTtl: 400 * 86400 });
  if (b.k === 'run') {
    const tool = ORG_TOOLS.includes(b.tool) ? b.tool : 'other';
    await kvInc(env, `orgm:${code}:${mon}:run:${tool}`, { expirationTtl: 800 * 86400 });
  }
  return done();
}

// ---- GET /api/admin/org-report?code=&month=YYYY-MM  (Authorization: Bearer <ADMIN_KEY>) ----
async function handleOrgReport(request, env, url, origin) {
  const H = { 'Cache-Control': 'no-store' };
  if (!env.ADMIN_KEY) return j({ error: 'admin not configured' }, 503, origin, H);
  const auth = request.headers.get('Authorization') || '';
  if (!safeEq(auth, 'Bearer ' + env.ADMIN_KEY)) return j({ error: 'unauthorized' }, 401, origin, H);
  const code = yfsOrgCode(url.searchParams.get('code'));
  const mon = String(url.searchParams.get('month') || yfsMonth());
  if (!code || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mon)) return j({ error: 'bad_request' }, 400, origin, H);
  const rec = await env.YFS_KV.get('org:' + code, 'json');
  if (!rec) return j({ error: 'invalid' }, 404, origin, H);
  const runs = {}; let total = 0;
  for (const t of ORG_TOOLS) { const n = parseInt(await env.YFS_KV.get(`orgm:${code}:${mon}:run:${t}`) || '0', 10) || 0; runs[t] = n; total += n; }
  let active = 0, cursor;
  do { const pg = await env.YFS_KV.list({ prefix: `orgact:${code}:${mon}:`, cursor }); active += pg.keys.length; cursor = pg.list_complete ? undefined : pg.cursor; } while (cursor);
  const [y, mo] = mon.split('-').map(Number);
  return j({ code, org: rec.org || '', plan: rec.plan || '',
    period: { start: `${mon}-01`, end: new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10) },
    seat_limit: parseInt(rec.seat_limit, 10) || 0,
    seats_redeemed: parseInt(await env.YFS_KV.get('orgcount:' + code) || '0', 10) || 0,
    active_seats: active, runs, runs_total: total, free_runs: null,
    generated_at: new Date().toISOString() }, 200, origin, H);
}

// ---- POST /api/metrics/heard_about (text/plain JSON {answer, src}) — PR #4 "How did you hear about us?" ----
// Keeps the typed answer (≤120 chars, no other data) + bumps the counter. Read back: wrangler kv key list --prefix heard:
async function handleHeardAbout(request, env, origin) {
  const H = { 'Cache-Control': 'no-store' };
  if (!env.YFS_KV || !requestOriginAllowed(request)) return new Response(null, { status: 204, headers: { ...cors(origin), ...H } });
  if (!(await yfsOrgRateLimit(request))) return j({ error: 'Rate limit' }, 429, origin, H);
  let b = {}; try { b = JSON.parse(await request.text()); } catch {}
  const answer = String(b.answer || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120);
  const src = String(b.src || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  if (answer) { const ts = Date.now();
    await env.YFS_KV.put(`heard:${ts}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify({ answer, src, ts }), { expirationTtl: 800 * 86400 }); }
  const day = new Date().toISOString().slice(0, 10);
  await kvInc(env, 'm:heard_about'); await kvInc(env, 'm:heard_about:' + day);
  return j({ ok: true }, 200, origin, H);
}

// ---- POST /api/pro/refresh {token} — renew a Stripe Pro token while the subscription is still active ----
// Accepts a correctly signed token even after exp (up to 90 days past), re-checks Stripe (or the webhook record),
// and returns a fresh token. Org tokens never refresh (they end with the program). Added by Claude.
const PRO_REFRESH_GRACE_S = 90 * 86400;
async function handleProRefresh(request, env, origin) {
  if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin);
  const rl = await yfsRateLimit(request, env);
  if (!rl.ok) return yfsRateLimited(rl, origin);
  let token; try { token = String((await request.json()).token || ''); } catch {}
  if (!token || !token.includes('.')) return j({ error: 'bad token' }, 400, origin);
  const [body, sig] = token.split('.');
  const expect = b64u(await hmac(env.PRO_SIGNING_SECRET, body));
  if (!safeEq(sig || '', expect)) return j({ error: 'bad token' }, 401, origin);
  let p; try { p = JSON.parse(new TextDecoder().decode(b64uDecode(body))); } catch { return j({ error: 'bad token' }, 400, origin); }
  if (p.org) return j({ error: 'org token' }, 400, origin);
  if (!p.sub) return j({ error: 'no subscription on token' }, 404, origin);
  const now = Math.floor(Date.now() / 1000);
  if (!p.exp || p.exp < now - PRO_REFRESH_GRACE_S) return j({ error: 'too_old' }, 401, origin);
  let status = null;
  try { status = (await stripeGet(env, 'subscriptions/' + encodeURIComponent(p.sub))).status; }
  catch (_) { const rec = env.YFS_KV && await env.YFS_KV.get('sub:' + p.sub, 'json'); if (rec && rec.status) status = rec.status; }
  if (!status) return j({ error: 'status unavailable' }, 502, origin);
  if (!ACTIVE_SUB.has(status)) return j({ error: 'inactive', status }, 402, origin);
  const exp = now + PRO_TOKEN_TTL_S;
  const fresh = await signProToken(env, { sub: p.sub, cus: p.cus, iat: now, exp, src: 'refresh' });
  return j({ ok: true, token: fresh, exp }, 200, origin);
}

// ════════════════════════════════════════════════════════════════════════════
// resume-fix (Claude): phones kill the result stream when the user switches apps.
//  • Each AI run carries X-YFS-Run (32 hex, new per run) + X-YFS-Dev (32 hex device id, no personal data).
//  • freeGate: retrying the SAME run (same request body) within 10 min doesn't count a new free run (max 3 retries).
//  • The finished result (already free-cut for free users) is cached 10 min under runres:<dev>:<run>;
//    GET /api/run/<run>?d=<dev> returns it, so a returning user gets it instantly with no new AI cost.
//    Needs both random ids → nobody can fetch someone else's result. Expires automatically.
//  • POST /api/metrics/client_err logs error TYPES only (no text, no ids) → GET /api/metrics/errors.
// ════════════════════════════════════════════════════════════════════════════
const RUN_TTL_S = 600, RUN_RETRIES = 3;
const ERR_TYPES = ['interrupted', 'network', 'http_5xx', 'http_4xx', 'busy', 'incomplete', 'empty', 'timeout', 'other'];
const UA_FAM = ['samsung', 'chrome', 'safari', 'firefox', 'edge', 'inapp', 'other'];
function yfsRunId(request) { const v = String(request.headers.get('X-YFS-Run') || ''); return /^[a-f0-9]{32}$/.test(v) ? v : ''; }
function yfsDevId(request) { const v = String(request.headers.get('X-YFS-Dev') || ''); return /^[a-f0-9]{32}$/.test(v) ? v : ''; }
async function yfsBodyHash(request) { try { return hex(await crypto.subtle.digest('SHA-256', te.encode(await request.clone().text()))); } catch (_) { return ''; } }
async function yfsCacheRun(env, dev, run, stream, free) {
  try {
    const rd = stream.getReader(), dec = new TextDecoder(); let buf = '', text = '', done = false;
    while (true) { const r = await rd.read(); if (r.done) break; buf += dec.decode(r.value, { stream: true });
      let i; while ((i = buf.indexOf('\n')) >= 0) { const ln = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!ln.startsWith('data:')) continue; let o = null; try { o = JSON.parse(ln.slice(5).trim()); } catch (_) { continue; }
        if (o && o.type === 'content_block_delta' && o.delta && typeof o.delta.text === 'string') text += o.delta.text;
        else if (o && o.type === 'message_stop') done = true; } }
    if (done && text) await env.YFS_KV.put('runres:' + dev + ':' + run, JSON.stringify({ text, free: free ? 1 : 0, ts: Date.now() }), { expirationTtl: RUN_TTL_S });
  } catch (_) {}
}
async function yfsBucket(request, name, max) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown', hour = Math.floor(Date.now() / 3600000);
  const key = new Request(`https://rl.internal/${name}:${ip}:${hour}`), cache = caches.default;
  const hit = await cache.match(key), n = hit ? parseInt(await hit.text(), 10) || 0 : 0;
  if (n >= max) return false;
  await cache.put(key, new Response(String(n + 1), { headers: { 'Cache-Control': 'max-age=3600' } })); return true;
}
async function handleRunFetch(request, env, path, origin) {
  const H = { 'Cache-Control': 'no-store' };
  if (!requestOriginAllowed(request)) return j({ error: 'Forbidden origin' }, 403, origin, H);
  if (!env.YFS_KV) return j({ error: 'unavailable' }, 503, origin, H);
  if (!(await yfsBucket(request, 'run', 120))) return j({ error: 'Rate limit' }, 429, origin, H);
  const run = path.slice('/api/run/'.length), dev = String(new URL(request.url).searchParams.get('d') || '');
  if (!/^[a-f0-9]{32}$/.test(run) || !/^[a-f0-9]{32}$/.test(dev)) return j({ error: 'bad_request' }, 400, origin, H);
  const rec = await env.YFS_KV.get('runres:' + dev + ':' + run, 'json');
  if (!rec || !rec.text) return j({ error: 'not_found' }, 404, origin, H);
  return j({ ok: true, done: true, text: rec.text }, 200, origin, H);
}
async function handleClientErr(request, env, origin) {
  const done = () => new Response(null, { status: 204, headers: { ...cors(origin), 'Cache-Control': 'no-store' } });
  if (!env.YFS_KV || !requestOriginAllowed(request)) return done();
  if (!(await yfsBucket(request, 'err', 30))) return done();
  let b = {}; try { b = JSON.parse(await request.text()); } catch (_) { return done(); }
  const t = ERR_TYPES.includes(b.t) ? b.t : 'other', ua = UA_FAM.includes(b.ua) ? b.ua : 'other';
  await kvInc(env, `m:err:${new Date().toISOString().slice(0, 10)}:${t}:${ua}`, { expirationTtl: 30 * 86400 });
  return done();
}
async function handleErrStats(env, origin) {
  const out = {}; const days = [0, 1].map(k => new Date(Date.now() - k * 864e5).toISOString().slice(0, 10));
  for (const d of days) { out[d] = {}; const pg = await env.YFS_KV.list({ prefix: 'm:err:' + d + ':' });
    for (const k of pg.keys) out[d][k.name.slice(('m:err:' + d + ':').length)] = parseInt(await env.YFS_KV.get(k.name) || '0', 10) || 0; }
  return j({ errors: out }, 200, origin, { 'Cache-Control': 'no-store' });
}
async function routeResume(request, env, path, origin) {
  const opt = () => new Response(null, { status: 204, headers: cors(origin) });
  if (path.startsWith('/api/run/')) { if (request.method === 'OPTIONS') return opt(); if (request.method === 'GET') return handleRunFetch(request, env, path, origin); }
  if (path === '/api/metrics/client_err') { if (request.method === 'OPTIONS') return opt(); if (request.method === 'POST') return handleClientErr(request, env, origin); }
  if (path === '/api/metrics/errors' && request.method === 'GET' && env.YFS_KV) return handleErrStats(env, origin);
  return null;
}

async function routeOrg(request, env, path, origin) {
  const opt = () => new Response(null, { status: 204, headers: cors(origin) });
  if (path === '/api/metrics/heard_about') { if (request.method === 'OPTIONS') return opt(); if (request.method === 'POST') return handleHeardAbout(request, env, origin); }
  if (path === '/api/org/redeem') { if (request.method === 'OPTIONS') return opt(); if (request.method === 'POST') return handleOrgRedeem(request, env, origin); }
  if (path === '/api/metrics/org_event') { if (request.method === 'OPTIONS') return opt(); if (request.method === 'POST') return handleOrgEvent(request, env, origin); }
  if (path === '/api/admin/org-report') { if (request.method === 'OPTIONS') return opt(); if (request.method === 'GET') return handleOrgReport(request, env, new URL(request.url), origin); }
  return null;
}

async function routePro(request, env, path, origin) {
  const resumeRes = await routeResume(request, env, path, origin);
  if (resumeRes) return resumeRes;
  const orgRes = await routeOrg(request, env, path, origin);
  if (orgRes) return orgRes;
  if (path === '/api/metrics' || path.startsWith('/api/metrics/')) return handleMetrics(request, env, path, origin);
  if (path === '/api/stripe/webhook' && request.method === 'POST') return handleYfsProStripeWebhook(request, env);
  if (path === '/api/pro/restore') {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'POST') return handleProRestore(request, env, origin);
  }
  if (path === '/api/pro/plans') {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'GET') return handleProPlans(env, origin);
  }
  if (path === '/api/pro/refresh') {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'POST') return handleProRefresh(request, env, origin);
  }
  if (path === '/api/pro/status') {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'POST') return handleProStatus(request, env, origin);
  }
  if (path === '/api/pro/checkout') {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'POST') return handleProCheckout(request, env, origin);
  }
  if (path === '/api/pro/verify') {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'POST') return handleProVerify(request, env, origin);
  }
  return null;
}

// ── sec-fix 1+2: real file reads only; fixed model; capped max_tokens; body size limits ──
const AI_MODEL = 'claude-sonnet-4-6', AI_MAX_TOKENS = 3000, AI_DEFAULT_TOKENS = 2800;
const MAX_BODY_BYTES = 10 * 1024 * 1024;      // 10 MiB: any request carrying a PDF/image file read
const MAX_TEXT_BODY_BYTES = 256 * 1024;      // 256 KiB: every request without a file block
const YFS_EXTRACT_PROMPT = { document: 'Extract ALL text from this resume exactly as written. Return only the raw text — every job title, company, date, skill, and bullet point. No commentary, no formatting labels.', image: 'Extract ALL text from this resume image exactly as it appears. Return only the raw text — every job, date, skill, and bullet point. No commentary.' };
function yfsFileBlocks(body) { const out = []; const m = body && body.messages; if (!Array.isArray(m)) return out; for (const x of m) { if (x && Array.isArray(x.content)) for (const c of x.content) { if (c && (c.type === 'document' || c.type === 'image') && c.source && typeof c.source === 'object') out.push(c); } } return out; }
function yfsIsFileRead(body) { return yfsFileBlocks(body).length > 0; }
function yfsClampTokens(v) { const n = Math.floor(Number(v)); if (!Number.isFinite(n) || n <= 0) return AI_DEFAULT_TOKENS; return Math.min(n, AI_MAX_TOKENS); }
const yfsBodies = new WeakMap();
async function yfsAiBody(request) { if (yfsBodies.has(request)) return yfsBodies.get(request); let raw = ''; try { raw = await request.clone().text(); } catch (_) { raw = ''; } const bytes = te.encode(raw).length; let json = null; try { json = JSON.parse(raw); } catch (_) { json = null; } const rec = { bytes, json }; yfsBodies.set(request, rec); return rec; }
async function yfsBodyTooBig(request, origin) { const cl = parseInt(request.headers.get('Content-Length') || '', 10); if (Number.isFinite(cl) && cl > MAX_BODY_BYTES) return j({ error: 'too_large', max_bytes: MAX_BODY_BYTES }, 413, origin); const b = await yfsAiBody(request); const max = yfsIsFileRead(b.json) ? MAX_BODY_BYTES : MAX_TEXT_BODY_BYTES; if (b.bytes > max) return j({ error: 'too_large', max_bytes: max }, 413, origin); return null; }
async function yfsIsExtract(request) { if (request.headers.get('X-YFS-Kind') !== 'extract') return false; const b = await yfsAiBody(request); return yfsIsFileRead(b.json); }
// ---- Optional server-side free limit (insert point D) ----
// NOTE: app also POSTs for PDF/image text extraction; those count as calls. Free users
// therefore get FREE_PER_DAY *requests*, so set >=2 or have app send X-YFS-Kind: extract.
async function freeGate(request, env, origin) {
  if (env.ENFORCE_FREE_LIMIT !== '1' || !env.YFS_KV) return null;
  const tok = request.headers.get('X-YFS-Pro');
  if (tok && await verifyProToken(env, tok)) return null;
  if (await yfsIsExtract(request)) return null; // sec-fix 1: only a REAL file read (document/image block) is free extraction
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const key = `free:${ip}:${day}`;
  const run = yfsRunId(request), h = run ? await yfsBodyHash(request) : '';
  if (run) {   // resume-fix: same run retried after an interruption → not a new free run (max RUN_RETRIES, same request only)
    const rec = await env.YFS_KV.get('frun:' + run, 'json');
    if (rec && rec.h === h && (rec.n || 0) < RUN_RETRIES) {
      await env.YFS_KV.put('frun:' + run, JSON.stringify({ h, n: (rec.n || 0) + 1 }), { expirationTtl: RUN_TTL_S });
      return null;
    }
  }
  const n = parseInt(await env.YFS_KV.get(key) || '0', 10);
  if (n >= FREE_PER_DAY) return j({ error: 'pro_required', upgrade: 'https://buy.stripe.com/3cIbIU3p4dJS7zd3BN04800' }, 402, origin);
  await env.YFS_KV.put(key, String(n + 1), { expirationTtl: 60 * 60 * 26 });
  if (run) await env.YFS_KV.put('frun:' + run, JSON.stringify({ h, n: 0 }), { expirationTtl: RUN_TTL_S });
  return null;
}

// ── P0 free-stream cut: Worker never sends locked Experience+ to free clients ──
const YFS_FILL=['Led daily work safely and on schedule with a strong team focus','Trained new crew members on standard procedures and safety checks','Improved shift output while keeping quality and safety records clean','Handled equipment checks, logs, and handoffs every shift','Recognized by supervisors for reliability and attendance','Solved problems on the floor and kept work moving'];
function yfsFreeCutter(){let mode='start',pend='',seenSum=false,n=0;
  const RES=/EXPERIENCE|EMPLOYMENT|WORK HISTORY|SKILLS|EDUCATION|CERTIF|TRAINING|LICENS|QUALIFICATION|ACHIEVE|PROJECT/i,SUM=/SUMMARY|PROFILE|OBJECTIVE/i;
  const fill=(l)=>{if(!l||/^([-*_]\s*){3,}$/.test(l))return '';if(/^##\s/.test(l))return l;
    if(/^###\s/.test(l)||/^\*\*.+\*\*/.test(l)||/\|/.test(l))return '### Job Title | Company Name | 20XX – Present';
    if(/^[-*+•]\s+/.test(l))return '- '+YFS_FILL[(n++)%YFS_FILL.length];return YFS_FILL[(n++)%YFS_FILL.length]+'.';};
  const line=(raw)=>{const l=raw.trim();
    if(mode==='start'){if(!l)return raw;mode=/^#\s+\S/.test(l)?'head':'plain';if(mode==='plain')return raw;return raw;}
    if(mode==='head'){if(/^##\s/.test(l)){const h=l.replace(/^##\s+/,'');
        if(!seenSum&&SUM.test(h)){seenSum=true;return raw;}
        if(seenSum||RES.test(h)){mode='cut';return l;} mode='plain';return raw;}
      return raw;}
    if(mode==='cut')return fill(l);
    return raw;};
  return {push(t){if(mode==='plain')return t;pend+=t;let out='',i;
      while((i=pend.indexOf('\n'))>=0){const ln=pend.slice(0,i);pend=pend.slice(i+1);out+=line(ln)+'\n';if(mode==='plain'){out+=pend;pend='';return out;}}
      return out;},
    flush(){if(mode==='plain'||!pend){const p=pend;pend='';return p;}const p=pend;pend='';return line(p);}};}
function yfsCutText(t){const c=yfsFreeCutter();return c.push(String(t||''))+c.flush();}
function yfsFreeSSE(body){const dec=new TextDecoder(),enc=new TextEncoder(),cut=yfsFreeCutter();let buf='',idx=0;
  const ev=(txt)=>'event: content_block_delta\ndata: '+JSON.stringify({type:'content_block_delta',index:idx,delta:{type:'text_delta',text:txt}})+'\n\n';
  const handle=(ln,ctl)=>{if(ln.startsWith('data:')){const d=ln.slice(5).trim();let o=null;try{o=JSON.parse(d);}catch(_){}
      if(o&&o.type==='content_block_delta'&&o.delta&&typeof o.delta.text==='string'){idx=o.index||0;o.delta.text=cut.push(o.delta.text);ctl.enqueue(enc.encode('data: '+JSON.stringify(o)+'\n'));return;}
      if(o&&(o.type==='content_block_stop'||o.type==='message_stop'||o.type==='message_delta')){const f=cut.flush();if(f)ctl.enqueue(enc.encode(ev(f)));}}
    ctl.enqueue(enc.encode(ln+'\n'));};
  return body.pipeThrough(new TransformStream({transform(ch,ctl){buf+=dec.decode(ch,{stream:true});let i;while((i=buf.indexOf('\n'))>=0){const ln=buf.slice(0,i).replace(/\r$/,'');buf=buf.slice(i+1);handle(ln,ctl);}},
    flush(ctl){buf+=dec.decode();if(buf)handle(buf,ctl);const f=cut.flush();if(f)ctl.enqueue(enc.encode(ev(f)));}}));}
async function handleAnthropicProxy(request, env, origin, ctx) { try { const _tok = request.headers.get('X-YFS-Pro'); if (!env.ANTHROPIC_API_KEY) { return json({ error: 'Server misconfigured: missing ANTHROPIC_API_KEY' }, 500, origin); } const body = await request.json(); if (!body || !Array.isArray(body.messages)) return json({ error: 'bad_request' }, 400, origin); const _files = request.headers.get('X-YFS-Kind') === 'extract' ? yfsFileBlocks(body) : []; const _extract = _files.length > 0; const _free = !_extract && !(_tok && await verifyProToken(env, _tok)); const payload = { model: AI_MODEL, max_tokens: yfsClampTokens(body.max_tokens), messages: body.messages }; if (_extract) { payload.messages = [{ role: 'user', content: [..._files, { type: 'text', text: _files.some(f => f.type === 'document') ? YFS_EXTRACT_PROMPT.document : YFS_EXTRACT_PROMPT.image }] }]; } else if (body.system) payload.system = body.system; if (body.stream === true) payload.stream = true; const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(payload) }); if (payload.stream && res.ok && res.body) { let _out = _free ? yfsFreeSSE(res.body) : res.body; const _run = yfsRunId(request), _dev = yfsDevId(request); if (_run && _dev && ctx && typeof ctx.waitUntil === 'function' && env.YFS_KV) { const _t = _out.tee(); _out = _t[0]; ctx.waitUntil(yfsCacheRun(env, _dev, _run, _t[1], _free)); } return new Response(_out, { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'X-YFS-Free-Cut': _free ? '1' : '0', 'Cache-Control': 'no-cache', ...cors(origin) } }); } const data = await res.json(); if (_free && res.ok && data && Array.isArray(data.content)) { try { for (const b of data.content) if (b && typeof b.text === 'string') b.text = yfsCutText(b.text); } catch (_) {} } return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json', ...cors(origin) } }); } catch (err) { return json({ error: 'Server error', detail: String(err && err.message || err) }, 500, origin); } }
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const path = url.pathname;
    
  const pro = await routePro(request, env, path, origin);
  if (pro) return pro;
if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'POST' && (path === '/' || path === '' || path === '/api/claude')) { if (!requestOriginAllowed(request)) return new Response(JSON.stringify({ error: 'Forbidden origin' }), { status: 403, headers: { 'Content-Type': 'application/json', ...cors(origin) } }); const rl = await yfsRateLimit(request, env); if (!rl.ok) return yfsRateLimited(rl, origin); const big = await yfsBodyTooBig(request, origin); if (big) return big; }

    if (request.method === 'OPTIONS')
      return new Response(null, { headers: cors(origin) });

    const gate = await freeGate(request, env, origin);

    if (gate) return gate;


    if (request.method === 'POST' && (path === '/' || path === '')) return handleAnthropicProxy(request, env, origin, ctx); // Serve HTML pages
    if (request.method === 'GET') {
      if (path === '/' || path === '' || path === '/index.html') {
        return new Response(LANDING_PAGE, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
      if (path === '/resume' || path === '/resume.html') {
        return new Response(RESUME_PAGE, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
    }

    // Claude API
    if (path === '/api/claude' && request.method === 'POST')
      return json({ error: 'gone', message: 'This endpoint was retired. Use the app at yourfirstshiftapp.com.' }, 410, origin); // sec-fix: legacy route retired (handleClaude kept, unused)

    // Auth
    if (path === '/auth/google') return handleGoogleLogin(request, env);
    if (path === '/auth/callback') return handleGoogleCallback(request, env);
    if (path === '/auth/logout' && request.method === 'POST') return handleLogout(request, env, origin);
    if (path === '/auth/me') return handleMe(request, env, origin);
    if (path === '/auth/register' && request.method === 'POST') return handleEmailRegister(request, env, origin);
    if (path === '/auth/login' && request.method === 'POST') return handleEmailLogin(request, env, origin);

    // Usage
    if (path === '/api/usage') return handleUsage(request, env, origin);

    // Stripe
    if (path === '/stripe/webhook' && request.method === 'POST') return handleStripeWebhook(request, env);
    if (path === '/stripe/portal' && request.method === 'GET') return handleStripePortal(request, env, origin);

    return json({ error: 'Not found' }, 404, origin);
  }
};

// ════════════════════════════════════════════════════════════
// CLAUDE API PROXY
// ════════════════════════════════════════════════════════════
async function handleClaude(request, env, origin) {
  try {
    const body = await request.json();
    const { tool, messages } = body;
    // sec-fix 1: only known tools (FREE_LIMITS keys); unknown names used to get unlimited runs
    if (typeof tool !== 'string' || !Object.prototype.hasOwnProperty.call(FREE_LIMITS, tool)) return json({ error: 'unknown_tool', tool: typeof tool === 'string' ? tool.slice(0, 40) : null }, 400, origin);
    if (!Array.isArray(messages)) return json({ error: 'bad_request' }, 400, origin);
    const session = await getSession(request, env);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const trackingKey = session?.user_id ? String(session.user_id) : `ip_${ip}`;

    // Pro users — unlimited, no checks
    if (session?.is_pro) {
      return await callClaude(messages, env, origin);
    }

    // Check if tool is Pro-only
    const limit = FREE_LIMITS[tool];
    if (limit === 0) {
      return json({
        error: 'free_limit_reached',
        tool,
        message: 'This feature requires a Pro account.',
      }, 403, origin);
    }

    // Check free usage
    if (limit !== undefined) {
      const used = await getToolUsage(env, trackingKey, tool);
      if (used >= limit) {
        return json({
          error: 'free_limit_reached',
          tool,
          message: `You've used your free ${tool} run. Upgrade to Pro for unlimited access.`,
          used, limit,
        }, 403, origin);
      }
    }

    // Make the Claude call
    const result = await callClaude(messages, env, origin);

    // Increment usage on success
    if (result.status === 200) {
      await incrementUsage(env, trackingKey, tool);
      if (session?.user_id) await updateLastLogin(env, session.user_id);
    }

    return result;

  } catch (err) {
    return json({ error: 'Server error', detail: err.message }, 500, origin);
  }
}

async function callClaude(messages, env, origin) { // sec-fix 2: caller model ignored
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: AI_DEFAULT_TOKENS,
      messages,
    }),
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });
}

// ════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ════════════════════════════════════════════════════════════
async function handleGoogleLogin(request, env) {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  const headers = new Headers();
  headers.set('Location', `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return Response.redirect(`${env.APP_URL}?error=no_code`, 302);

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');

    // Get Google user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const gUser = await userRes.json();

    // Upsert user in D1
    const user = await upsertUser(env, {
      google_id: gUser.id,
      email: gUser.email,
      name: gUser.name,
      picture: gUser.picture,
    });

    // Create session
    const token = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO sessions (token, user_id, created_at, expires_at)
       VALUES (?, ?, datetime('now'), datetime('now', '+30 days'))`
    ).bind(token, user.id).run();

    const headers = new Headers();
    headers.set('Location', `${env.APP_URL}?login=success`);
    headers.set('Set-Cookie',
      `yfs_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30*24*60*60}`
    );
    return new Response(null, { status: 302, headers });

  } catch (err) {
    return Response.redirect(`${env.APP_URL}?error=auth_failed`, 302);
  }
}

async function handleLogout(request, env, origin) {
  const session = await getSession(request, env);
  if (session) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?')
      .bind(session.token).run();
  }
  const headers = new Headers({
    'Content-Type': 'application/json', ...cors(origin),
    'Set-Cookie': 'yfs_session=; HttpOnly; Secure; Path=/; Max-Age=0',
  });
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}

async function handleMe(request, env, origin) {
  const session = await getSession(request, env);
  if (!session) return json({ user: null }, 200, origin);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = String(session.user_id);
  const usage = await getAllUsage(env, key);
  return json({
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      picture: session.picture,
      is_pro: !!session.is_pro,
      created_at: session.created_at,
    },
    usage,
    limits: FREE_LIMITS,
  }, 200, origin);
}

// ════════════════════════════════════════════════════════════
// EMAIL AUTH
// ════════════════════════════════════════════════════════════
async function handleEmailRegister(request, env, origin) {
  try {
    const { email, password } = await request.json();
    if (!email || !password || password.length < 6)
      return json({ message: 'Invalid email or password too short' }, 400, origin);

    // Check if user exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase()).first();
    if (existing)
      return json({ message: 'An account with this email already exists. Try signing in.' }, 400, origin);

    // Hash password
    const hash = await hashPassword(password);

    // Create user
    const result = await env.DB.prepare(
      `INSERT INTO users (email, password_hash, name, created_at, last_login, is_pro)
       VALUES (?, ?, ?, datetime('now'), datetime('now'), 0)`
    ).bind(email.toLowerCase(), hash, email.split('@')[0]).run();

    const userId = result.meta.last_row_id;

    // Create session
    const token = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO sessions (token, user_id, created_at, expires_at)
       VALUES (?, ?, datetime('now'), datetime('now', '+30 days'))`
    ).bind(token, userId).run();

    const headers = new Headers({
      'Content-Type': 'application/json', ...cors(origin),
      'Set-Cookie': `yfs_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30*24*60*60}`,
    });
    return new Response(JSON.stringify({
      user: { id: userId, email, name: email.split('@')[0], is_pro: false },
      usage: {}, limits: FREE_LIMITS,
    }), { status: 200, headers });

  } catch (err) {
    return json({ message: 'Registration failed — try again' }, 500, origin);
  }
}

async function handleEmailLogin(request, env, origin) {
  try {
    const { email, password } = await request.json();
    if (!email || !password)
      return json({ message: 'Email and password required' }, 400, origin);

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user || !user.password_hash)
      return json({ message: 'No account found with this email. Try signing up.' }, 401, origin);

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid)
      return json({ message: 'Incorrect password. Try again or use Google sign in.' }, 401, origin);

    // Update last login
    await env.DB.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`)
      .bind(user.id).run();

    // Create session
    const token = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO sessions (token, user_id, created_at, expires_at)
       VALUES (?, ?, datetime('now'), datetime('now', '+30 days'))`
    ).bind(token, user.id).run();

    const usage = await getAllUsage(env, String(user.id));
    const headers = new Headers({
      'Content-Type': 'application/json', ...cors(origin),
      'Set-Cookie': `yfs_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30*24*60*60}`,
    });
    return new Response(JSON.stringify({
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture, is_pro: !!user.is_pro },
      usage, limits: FREE_LIMITS,
    }), { status: 200, headers });

  } catch (err) {
    return json({ message: 'Login failed — try again' }, 500, origin);
  }
}

// ════════════════════════════════════════════════════════════
// STRIPE WEBHOOKS
// ════════════════════════════════════════════════════════════
async function handleStripeWebhook(request, env) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  // Verify webhook signature
  try {
    const valid = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return new Response('Invalid signature', { status: 400 });
  } catch {
    return new Response('Signature error', { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    switch (event.type) {

      // Payment succeeded — upgrade user to Pro
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        if (customerId) {
          await env.DB.prepare(
            `UPDATE users SET is_pro = 1, stripe_customer_id = ?, stripe_subscription_id = ?
             WHERE stripe_customer_id = ? OR email = ?`
          ).bind(customerId, subscriptionId, customerId,
            invoice.customer_email || '').run();
        }
        break;
      }

      // Subscription created — upgrade user
      case 'customer.subscription.created': {
        const sub = event.data.object;
        await env.DB.prepare(
          `UPDATE users SET is_pro = 1, stripe_customer_id = ?, stripe_subscription_id = ?
           WHERE stripe_customer_id = ?`
        ).bind(sub.customer, sub.id, sub.customer).run();
        break;
      }

      // Subscription updated
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const isPro = sub.status === 'active' ? 1 : 0;
        await env.DB.prepare(
          `UPDATE users SET is_pro = ?, stripe_subscription_id = ?
           WHERE stripe_customer_id = ?`
        ).bind(isPro, sub.id, sub.customer).run();
        break;
      }

      // Subscription cancelled or payment failed — downgrade
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj = event.data.object;
        const customerId = obj.customer;
        if (customerId) {
          await env.DB.prepare(
            `UPDATE users SET is_pro = 0 WHERE stripe_customer_id = ?`
          ).bind(customerId).run();
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return new Response('OK', { status: 200 });
}

// Customer portal — let users manage their subscription
async function handleStripePortal(request, env, origin) {
  const session = await getSession(request, env);
  if (!session) return json({ error: 'Not authenticated' }, 401, origin);

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(session.user_id).first();

  if (!user?.stripe_customer_id)
    return json({ error: 'No Stripe customer found' }, 400, origin);

  try {
    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: user.stripe_customer_id,
        return_url: env.APP_URL,
      }),
    });
    const portal = await res.json();
    return json({ url: portal.url }, 200, origin);
  } catch {
    return json({ error: 'Could not create portal session' }, 500, origin);
  }
}

// ════════════════════════════════════════════════════════════
// USAGE TRACKING
// ════════════════════════════════════════════════════════════
async function handleUsage(request, env, origin) {
  const session = await getSession(request, env);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = session?.user_id ? String(session.user_id) : `ip_${ip}`;
  const usage = await getAllUsage(env, key);
  return json({ usage, limits: FREE_LIMITS }, 200, origin);
}

async function getToolUsage(env, key, tool) {
  try {
    const r = await env.DB.prepare(
      'SELECT count FROM usage WHERE tracking_key = ? AND tool = ?'
    ).bind(key, tool).first();
    return r?.count || 0;
  } catch { return 0; }
}

async function getAllUsage(env, key) {
  try {
    const r = await env.DB.prepare(
      'SELECT tool, count FROM usage WHERE tracking_key = ?'
    ).bind(key).all();
    const usage = {};
    (r.results || []).forEach(row => { usage[row.tool] = row.count; });
    return usage;
  } catch { return {}; }
}

async function incrementUsage(env, key, tool) {
  try {
    await env.DB.prepare(`
      INSERT INTO usage (tracking_key, tool, count, last_used)
      VALUES (?, ?, 1, datetime('now'))
      ON CONFLICT(tracking_key, tool)
      DO UPDATE SET count = count + 1, last_used = datetime('now')
    `).bind(key, tool).run();
  } catch (e) { console.error('Usage error:', e); }
}

// ════════════════════════════════════════════════════════════
// DATABASE HELPERS
// ════════════════════════════════════════════════════════════
async function getSession(request, env) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(/yfs_session=([^;]+)/);
  if (!match) return null;
  try {
    const r = await env.DB.prepare(`
      SELECT s.token, s.user_id, u.email, u.name, u.picture, u.is_pro, u.created_at, u.stripe_customer_id
      FROM sessions s JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(match[1]).first();
    return r || null;
  } catch { return null; }
}

async function upsertUser(env, { google_id, email, name, picture }) {
  const existing = await env.DB.prepare(
    'SELECT * FROM users WHERE google_id = ? OR email = ?'
  ).bind(google_id, email).first();

  if (existing) {
    await env.DB.prepare(
      `UPDATE users SET name=?, picture=?, google_id=?, last_login=datetime('now') WHERE id=?`
    ).bind(name, picture, google_id, existing.id).run();
    return existing;
  }

  const r = await env.DB.prepare(
    `INSERT INTO users (google_id, email, name, picture, created_at, last_login, is_pro)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 0)`
  ).bind(google_id, email, name, picture).run();
  return { id: r.meta.last_row_id, google_id, email, name, picture, is_pro: 0 };
}

async function updateLastLogin(env, userId) {
  try {
    await env.DB.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`)
      .bind(userId).run();
  } catch {}
}

// ════════════════════════════════════════════════════════════
// CRYPTO HELPERS
// ════════════════════════════════════════════════════════════
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2,'0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const computedHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2,'0')).join('');
  return computedHex === hashHex;
}

async function verifyStripeSignature(body, sig, secret) {
  if (!sig || !secret) return false;
  const parts = sig.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,'0')).join('');
  return computed === signature;
}