// Verifies the published site locally before it goes live.
//
// The checks are chosen from things that have actually broken here before: a header that overflows
// at one width, a button whose text loses contrast against its own background, a section that
// wraps mid-phrase, and — new in this pass — screenshots that 404 because a path was written
// relative to the wrong folder.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2];
const PORT = 8099;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp',
};

function serve() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT);
}

const PAGES = [
  { name: 'portal',   url: `http://localhost:${PORT}/` },
  { name: 'product',  url: `http://localhost:${PORT}/threat-model-reviewer/` },
  { name: 'releases', url: `http://localhost:${PORT}/threat-model-reviewer/releases/` },
];
const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const THEMES = ['light', 'dark'];

let pass = 0;
const fail = [];
const ok = (cond, msg) => { if (cond) pass++; else fail.push(msg); };

(async () => {
  const server = serve();
  const browser = await chromium.launch();

  for (const pageDef of PAGES) {
    for (const theme of THEMES) {
      const ctx = await browser.newContext({ colorScheme: theme, viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();

      const jsErrors = [];
      const badRequests = [];
      page.on('pageerror', e => jsErrors.push(String(e)));
      page.on('response', r => {
        if (r.status() >= 400 && r.url().startsWith(`http://localhost:${PORT}`)) {
          badRequests.push(`${r.status()} ${r.url()}`);
        }
      });

      await page.goto(pageDef.url, { waitUntil: 'networkidle' });

      ok(jsErrors.length === 0, `${pageDef.name}/${theme}: JS errors: ${jsErrors.join(' | ')}`);
      // A 404 on a same-origin asset means a broken path, which is the single most likely way a
      // screenshot silently disappears from the page.
      ok(badRequests.length === 0, `${pageDef.name}/${theme}: failed requests: ${badRequests.join(' | ')}`);

      // Exactly one h1 keeps the document outline usable for screen readers.
      const h1s = await page.locator('h1').count();
      ok(h1s === 1, `${pageDef.name}/${theme}: expected 1 <h1>, found ${h1s}`);

      // Every image must have loaded AND have alt text.
      const imgs = await page.evaluate(() => Array.from(document.images).map(i => ({
        src: i.currentSrc || i.src, w: i.naturalWidth, alt: i.getAttribute('alt'),
      })));
      for (const im of imgs) {
        ok(im.w > 0, `${pageDef.name}/${theme}: image did not load: ${im.src}`);
        ok(im.alt !== null && im.alt.trim().length > 0, `${pageDef.name}/${theme}: image has no alt text: ${im.src}`);
      }

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(120);

        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(overflow <= 0, `${pageDef.name}/${theme}@${width}: horizontal overflow of ${overflow}px`);

        // Elements that must never wrap to a second line. Only the element's own text is measured:
        // comparing box height to line-height counts padding as wrapping, and measuring the whole
        // element counts an inline icon sitting at a different baseline as a second line. Both
        // produced false positives on every ordinary button and icon link.
        const wrapped = await page.evaluate(() => {
          const out = [];
          for (const el of document.querySelectorAll('.brand, .back-link, .btn, .chip, .tag, .badge, .eyebrow')) {
            if ((el.textContent || '').trim().length === 0) continue;

            const tops = new Set();
            let label = '';
            for (const node of el.childNodes) {
              if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
              label += node.textContent;
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const r of range.getClientRects()) {
                if (r.width > 0 && r.height > 0) tops.add(Math.round(r.top / 4));
              }
            }
            if (tops.size > 1) out.push(label.replace(/\s+/g, ' ').trim().slice(0, 30));
          }
          return [...new Set(out)];
        });
        ok(wrapped.length === 0, `${pageDef.name}/${theme}@${width}: wrapped single-line elements: ${wrapped.slice(0, 8).join(', ')}`);
      }

      await ctx.close();
    }
  }

  // Content assertions on the product page, so a section cannot silently disappear.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(PAGES[1].url, { waitUntil: 'networkidle' });

  for (const id of ['screens', 'how', 'features', 'download', 'enterprise', 'docs']) {
    ok(await page.locator(`#${id}`).count() === 1, `product: section #${id} is missing`);
  }
  ok(await page.locator('#screens img').count() === 4, 'product: expected 4 screenshots');
  ok(await page.locator('#how .steps li').count() === 4, 'product: expected 4 steps in "how it works"');

  const ld = await page.locator('script[type="application/ld+json"]').count();
  ok(ld === 1, `product: expected 1 JSON-LD block, found ${ld}`);

  // Anchor navigation must not park a section underneath the sticky header. Measured on the
  // section's own top edge, because that is what scroll-padding-top controls — checking the
  // heading instead passes either way, since section padding happens to clear the header on its own.
  const headerH = await page.evaluate(() => {
    const h = document.querySelector('header, .nav')?.getBoundingClientRect().height || 0;
    return Math.round(h);
  });
  for (const id of ['how', 'features', 'download']) {
    // Instant, not the page's smooth default: a measurement taken mid-animation reports wherever
    // the scroll happened to be and silently passes.
    await page.evaluate(i => document.getElementById(i).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
    await page.waitForTimeout(150);
    const top = await page.evaluate(i => Math.round(document.getElementById(i).getBoundingClientRect().top), id);
    ok(top >= headerH - 2, `product: #${id} lands at ${top}px, beneath the ${headerH}px sticky header`);
  }

  const body = await page.textContent('body');
  ok(!/Rohithreddy7123/.test(body), 'product: stale owner reference');
  ok(/72 deterministic checks/.test(body), 'product: the check count is not stated exactly');

  await ctx.close();
  await browser.close();
  server.close();

  console.log(`\n${pass} checks passed, ${fail.length} failed`);
  if (fail.length) { console.log('\nFAILURES:'); fail.slice(0, 40).forEach(f => console.log('  - ' + f)); process.exit(1); }
})();
