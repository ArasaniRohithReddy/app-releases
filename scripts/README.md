# Site verification

For artifact-independent snapshot checks and the **deferred, quota-aware Pages
migration**, see [Pages deployment and snapshot preservation](PAGES-DEPLOYMENT.md).
Committing the workflows does not gate the existing build-from-branch deployment by itself.
**Keep the working legacy publisher while Actions artifact capacity/deployment is unproven.**
Candidate snapshot validation before branch updates needs no artifact upload. Pages migration
is a separate evidence-backed step, with an explicit rollback to the prior Pages configuration;
no artifact or release cleanup is approved.

Start with the fast content checks, then the browser suite, reusing installed dependencies:

```powershell
npm run test:content
npm run test:site
```

Run `npm ci` only if a dependency is missing (for example, `Cannot find module 'playwright'`),
then repeat the checks. If the bundled browser is missing, use installed Edge below or install
it with `npx playwright install chromium`. Run the complete `npm test` before committing.

If a managed Windows environment cannot launch the downloaded Chromium, the same
assertions can run against an installed Edge browser:

```powershell
$env:SITE_BROWSER_CHANNEL = 'msedge'
npm test
```

This changes the browser executable, not which assertions run. Leave the variable
unset for the default bundled Chromium used by CI.

## Native documentation

The repository Markdown is canonical. Do not edit generated guide HTML by hand.
`scripts/docs/manifest.json` is an explicit **stable-public** allowlist: the current
12 product guides and the root security, support, license and conduct documents.
It does not discover or import private-source exports or development-preview directories.
The existing public changelog retains its labelled Unreleased history, with a clear notice;
that exception does not permit publishing an unreleased guide.

After an approved public Markdown change, run:

```powershell
npm run build:docs
npm run check:docs
npm test
```

Commit the source and generated outputs together. `check:docs` is read-only and fails on
missing/stale HTML, route metadata or unexpected pages in the generated directories.
Both site and snapshot workflows run that check; the test command includes it as well.
The shared shell is `scripts/docs/layout.html`; the shared reader styles/controls are
`docs/docs.css`, `docs/docs.js` and the existing `docs/theme.js`.

Markdown-it is a pinned development dependency, not a browser dependency. Raw HTML is
escaped, unsafe URL schemes are rejected, code is escaped, tables get keyboard-scrollable
regions, and internal guide links/fragments are resolved at build time. External badges
are represented by their alternative text, not fetched from an API when someone reads.
Each generated page has a genuine secondary **View source on GitHub** link.
Issue, authentication, release-download and third-party reference actions stay external.
Availability labels are checked as Markdown tokens, including plain or bold
development-only notices; fenced examples are not mistaken for publication metadata.
Generated heading fragments stay unique even when a natural numbered heading collides
with a duplicate heading. Every output path is validated before any page is rewritten.

Native guides are committed under `docs/threat-model-reviewer/docs/` and `docs/help/`.
They work with JavaScript disabled and without GitHub/API access. `docs/guide-links.js`
only rewrites known documentation references in rendered historical release notes;
the release snapshot and its historical note text are not edited.

`scripts/verify-docs.js` checks every native page, internal targets and source links,
keyboard/TOC/code/table behavior, both themes, mobile/tablet/desktop widths and 200% text
reflow. It blocks external requests while reading guides and exercises portal → product →
guide → cross-guide → product/portal journeys, including JavaScript-disabled navigation.
It also measures rendered text contrast in screen and print modes, retains visible
keyboard focus when the guide navigation collapses, and checks enlarged no-JavaScript
reading. These are bounded checks, not a claim of full WCAG conformance.
The compact guide header scrolls normally rather than obscuring anchors at large
text sizes. Desktop sticky offsets follow the measured header height, and the reader
retargets an occluded fragment after a font or zoom change grows the sticky header.
The navigation regression also exercises a header that expands after arrival. Browser waits
have finite deadlines; no-script text-size tests use a stylesheet fixture instead of
script injection. For a targeted navigation rerun, use
`node scripts/verify-docs.js docs --journeys-only`; the default and CI still run every page.

This requires **no new production server or runtime API**, and **no Pages source-setting
change**. The working `main:/docs` publisher can serve the committed static outputs.
Artifact-quota constraints and the separately deferred Actions migration still apply;
local generation or tests are not proof of a remote deployment.

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

`site-accessibility-checks.js` adds regressions for persistent prose-link underlines,
the release filter's computed boundary/placeholder/focus contrast, synthetic pre-release
badge text contrast, the visible “Overview”
label in its accessible name, native light/dark controls under both OS preferences, and
disabled theme controls when JavaScript is absent. It checks
single-row normal-text headers at 16 widths, including both sides of the 1460px
secondary-navigation breakpoint. Exactly one visible Guides entry is retained at every width.
The separate enlarged-text checks still permit wrapping rather than clipping controls.
It also checks forward/reverse keyboard focus
clear of the header, 24px primary-control targets, and content overflowing inside cards at
200% text size. The page-reflow checks include 320px at both normal and enlarged text sizes.
Normal-size single-line checks remain; enlarged labels may wrap rather than clip.
The shared prose-link rule uses existing accent colours; the filter boundary uses the
existing `--muted` token instead of the decorative `--line`, and small pre-release text uses
`--ink-2` on its existing warning tint. No new palette is introduced.
Its route list is explicitly limited to the portal, product landing page and releases page;
it does not inherit or audit native product-guide or `/help/` routes from other checks.

These checks are not a WCAG conformance claim. Root-font resizing is **not browser zoom**.
Before publication, manually use Edge at 200% browser zoom and NVDA with keyboard-only
navigation: follow portal → product → downloads → filtered history, expand/scroll all files
and notes, clear a no-match filter, and check the unavailable-history fallback. Verify spoken
labels/status updates, text-spacing overrides, focus after scrolling and delayed refresh,
and inline/spacing exceptions for small links. Inspect every changed-page capture and all
four synthetic screenshots; record browser/AT versions and any image-inspection limitation.
Criteria: [WCAG 2.2, W3C Recommendation, 5 October 2023](https://www.w3.org/TR/2023/REC-WCAG22-20231005/)
1.4.1, 1.4.3, 1.4.4, 1.4.10–12, 2.1.1–2, 2.4.7, 2.4.11, 2.5.3, 2.5.8 and 4.1.3.

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