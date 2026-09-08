# Site verification

Two scripts that check the published site before it goes live. Both need Playwright:

```bash
npm install playwright && npx playwright install chromium
```

## verify-site.js

```bash
node scripts/verify-site.js docs
```

Serves `docs/` locally and checks all three pages across seven widths and both colour schemes:
no horizontal overflow, no JavaScript errors, no failed same-origin requests, exactly one `<h1>`,
every image loaded and carrying alt text, and nothing that should stay on one line wrapping onto two.
It also asserts the product page still has each of its sections, four screenshots, four steps and
one JSON-LD block, so a section cannot quietly disappear in an edit.

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