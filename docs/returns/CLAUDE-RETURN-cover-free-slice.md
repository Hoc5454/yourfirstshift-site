# CLAUDE RETURN: Free Cover Letter shows the opening paragraph
Base: tip 9231dd43 (verified = Claude's last Cover Letter gate file) · Rollback: that tip (9231dd43…) · File: app.html (full replacement)
One small script added at the end. Nothing else changed.

## Fix
Live check found that Free Cover Letter showed only the letterhead. The AI starts with "# Cover Letter — Name" + "---", so the old free cut landed before the letter body.
Now on Cover Letter only: Free = everything up to and including the **first real paragraph** (80+ characters, ends like a sentence, not a heading, divider, or "Dear…" line). The rest stays locked under "🔒 The rest of your letter is ready", then the resume tease.
If no such paragraph is found, it falls back to the old cut. Pro unchanged; other tools unchanged.

## Tested (390px, mocked Worker)
- Marcus-style letter (title + divider + letterhead): free shows letterhead + "Road and drainage work doesn't forgive sloppy grading…", rest locked, tease shows.
- Plain "Dear Hiring Manager," letter: free shows greeting + first paragraph.
- Regression: gate states, free tease on 4 tools, lonely-bullet sweep 150/150.

## Hunter phone PASS (Incognito)
1. Cover Letter with resume + job → you can read the letterhead AND the first paragraph; the rest is locked
