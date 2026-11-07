# CLAUDE RETURN: brand-icons (replace the old yellow "Y" with the patch badge)

Hunter approved logo Option A (the patch badge: orange circle, navy ring, document + checkmark), Nov 7.

## Files (upload to the site root, replacing old ones)
- `favicon.ico` (16, 32, 48 inside)
- `favicon-48.png`, `favicon-96.png`
- `apple-touch-icon.png` (180, navy background)
- `icon-192.png`, `icon-512.png`
- `site.webmanifest`

app.html already points at `/favicon.ico` and `/apple-touch-icon.png`, so the app picks up the new icons with no code change.

## Homepage (index.html, Shift-owned): add inside <head>
```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#1B2A4A">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
 {"@type":"WebSite","name":"YourFirstShift","alternateName":"YFS","url":"https://www.yourfirstshiftapp.com/"},
 {"@type":"Organization","name":"YourFirstShift","url":"https://www.yourfirstshiftapp.com/","logo":"https://www.yourfirstshiftapp.com/icon-512.png"}
]}
</script>
```
Remove any older `<link rel="icon">` lines that point at the old yellow Y files.

The WebSite block tells Google to show "YourFirstShift" as the site name instead of "yourfirstshiftapp.com". Google picks this up on its own schedule (days to a few weeks).

## Not touched
app.html, Worker, checkout, pricing, Stripe.

## Check after deploy
- Open https://www.yourfirstshiftapp.com/favicon.ico: patch badge, not yellow Y.
- Phone browser tab shows the badge (clear cache or use a private tab).
- Optional: Google Search Console > URL Inspection > Request indexing on the homepage to speed it up.
