// Finds which elements are wider than the viewport, so an overflow can be attributed instead of guessed.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2];
const URL_PATH = process.argv[3] || '/threat-model-reviewer/';
const PORT = 8098;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://localhost:${PORT}${URL_PATH}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);

    const result = await page.evaluate((vw) => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - doc.clientWidth;
      if (overflow <= 0) return { overflow: 0, culprits: [] };

      const culprits = [];
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        // Report the element itself, not every ancestor that contains it.
        if (r.right > vw + 1 || r.left < -1) {
          const hasOverflowingChild = Array.from(el.children).some(c => {
            const cr = c.getBoundingClientRect();
            return cr.width > 0 && (cr.right > vw + 1 || cr.left < -1);
          });
          if (!hasOverflowingChild) {
            culprits.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 50),
              right: Math.round(r.right),
              width: Math.round(r.width),
              text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
            });
          }
        }
      }
      return { overflow, culprits: culprits.slice(0, 10) };
    }, width);

    console.log(`\n=== ${width}px : overflow ${result.overflow}px ===`);
    for (const c of result.culprits) {
      console.log(`  <${c.tag} class="${c.cls}"> right=${c.right} w=${c.width}  "${c.text}"`);
    }
  }

  await browser.close();
  process.exit(0);
})();
