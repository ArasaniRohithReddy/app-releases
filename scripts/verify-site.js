const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'docs'));
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'threat-model-reviewer', 'releases', 'releases.json'), 'utf8'));
const latest = snapshot.find(r => r.tag_name.startsWith('threat-model-reviewer-v') && !r.draft && !r.prerelease);
if (!latest) throw new Error('The release snapshot has no stable Threat Model Reviewer release.');
const sample = JSON.parse(fs.readFileSync(path.join(root, 'threat-model-reviewer', 'samples', 'customer-portal-review.json'), 'utf8'));
const mime = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let requested;
  try { requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad URL'); return; }
  if (requested.endsWith('/')) requested += 'index.html';
  const file = path.resolve(root, '.' + requested);
  const relative = path.relative(root, file);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    res.writeHead(403); res.end('Outside site root'); return;
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

let passed = 0;
const failures = [];
function check(condition, message) {
  if (condition) passed++;
  else failures.push(message);
}

async function mockReleases(context, unavailable = false) {
  await context.route('https://api.github.com/repos/ArasaniRohithReddy/app-releases/**', route => {
    const list = route.request().url().includes('/releases?');
    return route.fulfill({
      status: unavailable ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(unavailable ? { message: 'Unavailable' } : list ? snapshot : latest)
    });
  });
}

async function main() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({
      ...(process.env.SITE_BROWSER_CHANNEL ? { channel: process.env.SITE_BROWSER_CHANNEL } : {}),
      timeout: 60000
    });
    const pages = [
      ['portal', '/'],
      ['product', '/threat-model-reviewer/'],
      ['releases', '/threat-model-reviewer/releases/']
    ];
    for (const [name, url] of pages) {
      for (const theme of ['light', 'dark']) {
        console.log(`Checking ${name}/${theme}`);
        const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1440, height: 900 } });
        await mockReleases(context);
        const page = await context.newPage();
        const errors = [];
        const failedRequests = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', r => {
          if (r.url().startsWith(base) && r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
        });
        await page.goto(base + url, { waitUntil: 'networkidle' });
        check(await page.locator('h1').count() === 1, `${name}/${theme}: expected one h1`);

        // Scroll lazy images into view before judging whether they loaded.
        for (const image of await page.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(el => el.decode());
          check(await image.evaluate(el => el.naturalWidth > 0), `${name}/${theme}: image did not load`);
          check(Boolean((await image.getAttribute('alt'))?.trim()), `${name}/${theme}: missing image alternative`);
        }
        for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          check(overflow <= 0, `${name}/${theme}@${width}: ${overflow}px horizontal overflow`);
          const wrapped = await page.evaluate(() => {
            const result = [];
            for (const el of document.querySelectorAll('.btn, .chip, .tag, .badge, .eyebrow')) {
              if (el.getBoundingClientRect().width === 0) continue;
              const tops = new Set();
              for (const node of el.childNodes) {
                if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                for (const rect of range.getClientRects()) {
                  if (rect.width && rect.height) tops.add(Math.round(rect.top / 4));
                }
              }
              if (tops.size > 1) result.push(el.textContent.trim().replace(/\s+/g, ' '));
            }
            return [...new Set(result)];
          });
          check(wrapped.length === 0, `${name}/${theme}@${width}: wrapped control labels: ${wrapped.join(', ')}`);
        }

        await page.setViewportSize({ width: 1440, height: 900 });
        const contrastProblems = await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          function rgba(color) {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data];
          }
          function blend(foreground, background) {
            const alpha = foreground[3] / 255;
            return foreground.slice(0, 3).map((c, i) => c * alpha + background[i] * (1 - alpha));
          }
          function luminance(rgb) {
            const linear = rgb.map(c => c / 255 <= .04045 ? c / 255 / 12.92 : ((c / 255 + .055) / 1.055) ** 2.4);
            return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
          }
          const problems = [];
          for (const el of document.querySelectorAll('.btn, .lede, .boundary-note, .pillar p, .workflow p, .coverage-list dd')) {
            if (el.getBoundingClientRect().width === 0) continue;
            const ancestors = [];
            for (let current = el; current; current = current.parentElement) ancestors.unshift(current);
            let background = [255, 255, 255];
            for (const ancestor of ancestors) background = blend(rgba(getComputedStyle(ancestor).backgroundColor), background);
            const style = getComputedStyle(el);
            const foreground = blend(rgba(style.color), background);
            const a = luminance(foreground), b = luminance(background);
            const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
            const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
            if (ratio < (large ? 3 : 4.5)) problems.push(`${el.textContent.trim().slice(0, 35)}: ${ratio.toFixed(2)}`);
          }
          return problems;
        });
        check(contrastProblems.length === 0, `${name}/${theme}: text contrast: ${contrastProblems.join('; ')}`);
        check(errors.length === 0, `${name}/${theme}: JavaScript errors: ${errors.join('; ')}`);
        check(failedRequests.length === 0, `${name}/${theme}: failed assets: ${failedRequests.join('; ')}`);
        await context.close();
      }
    }

    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    await mockReleases(context);
    const page = await context.newPage();
    await page.goto(base + '/threat-model-reviewer/', { waitUntil: 'networkidle' });
    if (process.env.SITE_SCREENSHOTS) {
      fs.mkdirSync(process.env.SITE_SCREENSHOTS, { recursive: true });
      for (const [name, width, height] of [['desktop', 1366, 768], ['mobile', 390, 844]]) {
        await page.setViewportSize({ width, height });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, `${name}.png`) });
      }
      await page.setViewportSize({ width: 1366, height: 768 });
    }
    for (const id of ['try', 'screens', 'how', 'features', 'whats-new', 'download', 'enterprise', 'docs'])
      check(await page.locator(`#${id}`).count() === 1, `product: missing section ${id}`);
    check(await page.locator('#screens img').count() === 4, 'product: expected four full screenshots');
    check(await page.locator('#how .steps li').count() === 4, 'product: expected four explanation steps');
    for (const [attribute, expected] of [['verdict', sample.verdict], ['score', sample.score], ['gating', sample.gatingFindings]])
      check((await page.locator(`[data-sample-${attribute}]`).textContent()).trim() === String(expected), `product: sample ${attribute} drift`);
    const primary = page.locator('#hero-download');
    check(await primary.evaluate(el => {
      const box = el.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight;
    }), 'product: primary download is below the fold on a 1366x768 laptop');
    const msi = latest.assets.find(a => a.name.endsWith('-x64.msi'));
    check(await primary.getAttribute('href') === msi.browser_download_url, 'product: hero does not select the recommended MSI');
    for (const kind of ['msi', 'portable', 'setup', 'cli', 'skill', 'msix', 'cer']) {
      const link = await page.locator(`[data-dl="${kind}"]`).first().getAttribute('href');
      check(latest.assets.some(a => a.browser_download_url === link), `product: no real asset for ${kind}`);
    }
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#try a[download]').click();
    const download = await downloadEvent;
    check(download.suggestedFilename() === 'customer-portal.tm7' && await download.failure() === null, 'product: sample download failed');

    for (const id of ['how', 'features', 'download']) {
      await page.evaluate(value => document.getElementById(value).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
      const clear = await page.evaluate(value => document.getElementById(value).getBoundingClientRect().top >= document.querySelector('header.site').getBoundingClientRect().bottom, id);
      check(clear, `product: ${id} is covered by the sticky header`);
    }
    await page.reload({ waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    check(await page.locator(':focus').getAttribute('class') === 'skip', 'product: skip link is not the first keyboard stop');
    const theme = page.locator('#theme-toggle');
    const initial = await theme.getAttribute('aria-label');
    await theme.focus();
    check(await theme.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'product: keyboard focus is not visible');
    await page.keyboard.press('Enter');
    check(await theme.getAttribute('aria-label') !== initial, 'product: keyboard theme toggle failed');
    const changed = await theme.getAttribute('aria-label');
    await page.reload({ waitUntil: 'networkidle' });
    check(await theme.getAttribute('aria-label') === changed, 'product: theme preference did not persist');
    check(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'), 'product: reduced motion ignored');
    await context.close();

    const offline = await browser.newContext();
    await mockReleases(offline, true);
    const fallback = await offline.newPage();
    await fallback.goto(base + '/threat-model-reviewer/', { waitUntil: 'networkidle' });
    check((await fallback.locator('#hero-download').getAttribute('href')).endsWith('/releases/latest'), 'product: API failure broke the download fallback');
    await offline.close();

    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage();
    await staticPage.goto(base + '/threat-model-reviewer/');
    check(await staticPage.locator('#try a[download]').count() === 1, 'product: sample requires JavaScript');
    check((await staticPage.locator('#hero-download').getAttribute('href')).endsWith('/releases/latest'), 'product: static download unavailable');
    await noJs.close();
  }
  finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log(`${passed} browser checks passed; ${failures.length} failed.`);
  failures.forEach(message => console.error(message));
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
