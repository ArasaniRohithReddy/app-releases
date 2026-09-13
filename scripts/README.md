# Site verification

For the validation-before-deployment workflow and the **coordinator-required Pages
setting change**, see [Pages deployment and snapshot preservation](PAGES-DEPLOYMENT.md).
Committing the workflows does not gate the existing build-from-branch deployment by itself.

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

Serves `docs/` under `/app-releases/` on a temporary loopback port (matching the Pages
project path) and checks all three pages at widths from 320 to 1920 pixels and both colour schemes:
no horizontal overflow, no JavaScript errors, no failed same-origin requests, exactly one `<h1>`,
every image loaded and carrying alt text, and nothing that should stay on one line wrapping onto two.
It also asserts the product page still has each of its sections, four screenshots, four steps and
one JSON-LD block, so a section cannot quietly disappear in an edit. The sample
result is checked against its published JSON, which source tests validate against
the actual rubric. Download tests use the release snapshot rather than a live API,
and confirm that the hero selects MSI and all seven asset kinds remain correctly linked.
The portal → product → MSI / CLI / skill → release history journey uses synthetic download
responses, not real binaries. Every release card, historical note and all-files link is compared
with the unmodified snapshot.

Keyboard focus, light/dark/system choices, theme persistence (including blocked storage),
reduced motion, text contrast, 200% text resizing, sample downloading, sticky-header clearance
and JavaScript-disabled fallbacks are checked. A delayed live refresh must preserve filters,
expanded notes/files and keyboard focus.

Fault cases include GitHub 403/503, an aborted request, malformed JSON/records and empty responses.
They must retain the same-origin snapshot; if neither source is usable, the release list must
offer GitHub history instead of loading forever. Synthetic partial lists, other products,
drafts and newer pre-releases cannot erase history or take over stable download links.
The fast Node tests also exercise live pagination, request timeouts, metadata and local/public-guide
link targets. These are preservation checks, not a release inventory or installer-signature audit.

To capture each route in both themes at desktop and mobile sizes:

```powershell
$env:SITE_SCREENSHOTS = Join-Path (Get-Location) 'test-results/site-preservation/local'
npm test
```

Screenshots and dependencies are ignored by Git. The browser and temporary server are closed
by the test runner; no user app or desktop session is touched.
No private model or live Azure account is required. Use `npm run test:content` for
only the fast copy/sample checks.

The content suite also tests the snapshot generator with paginated, partial and invalid
API fixtures, plus workflow guards that bind deployment to the checked SHA. The scheduled
generator consumes `gh api --paginate --slurp` output; it preserves saved releases, notes
and assets instead of pruning them on API absence. Do not regenerate the real snapshot
by hand for a site change.

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