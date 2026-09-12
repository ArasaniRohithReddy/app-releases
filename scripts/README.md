# Site verification

Install the locked development dependencies, then run the content and browser checks:

```powershell
npm ci
npx playwright install chromium
npm test
```

If a managed Windows environment cannot launch the downloaded Chromium, the same
assertions can run against an installed Edge browser:

```powershell
$env:SITE_BROWSER_CHANNEL = 'msedge'
npm test
```

This changes the browser executable, not which assertions run. Leave the variable
unset for the default bundled Chromium used by CI.

## verify-site.js

```bash
node scripts/verify-site.js docs
```

Serves `docs/` on a temporary loopback port and checks all three pages at widths from
320 to 1920 pixels and both colour schemes:
no horizontal overflow, no JavaScript errors, no failed same-origin requests, exactly one `<h1>`,
every image loaded and carrying alt text, and nothing that should stay on one line wrapping onto two.
It also asserts the product page still has each of its sections, four screenshots, four steps and
one JSON-LD block, so a section cannot quietly disappear in an edit. The sample
result is checked against its published JSON, which source tests validate against
the actual rubric. Download tests use the release snapshot rather than a live API,
and confirm that the hero selects MSI and all seven assets remain reachable.

Keyboard focus, theme persistence, reduced motion, text contrast, sample downloading,
sticky-header clearance, API failure and JavaScript-disabled fallbacks are checked.
No private model or live Azure account is required. Use `npm run test:content` for
only the fast copy/sample checks.

For mirrored product guides, make the correction in the source repository and run
its `scripts\sync-public-docs.ps1` export and `-Check` mode before committing here.
Review this hub's README and Pages separately; copying guides cannot verify marketing
claims. Existing release ZIPs are not changed by documentation edits.

Two things it deliberately does **not** do, because both produced false failures:

- measure wrapping by comparing element height to line-height, which counts padding as a wrap and
  flags every ordinary button;
- measure wrapping across a whole element, which counts an inline icon sitting at a different
  baseline as a second line.

It measures the element's own text nodes instead. Confirmed to still catch a genuine wrap by forcing
a button narrow and watching it fail.

## find-overflow.js

```bash
node scripts/find-overflow.js docs /threat-model-reviewer/
```

When `verify-site.js` reports horizontal overflow, this attributes it: it lists the innermost
elements extending past the viewport, so the cause is identified rather than guessed at.