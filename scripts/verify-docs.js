const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { createSiteServer, mount } = require('./site-server.js');
const { manifest } = require('./build-docs.js');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../docs'));
const journeysOnly = process.argv.includes('--journeys-only');
const server = createSiteServer(root);
let passed = 0;
const failures = [];
function check(condition, message) { if (condition) passed++; else failures.push(message); }
async function visit(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('.doc-content').waitFor();
}
async function snapshot(page, name) {
  if (!process.env.SITE_SCREENSHOTS) return;
  fs.mkdirSync(process.env.SITE_SCREENSHOTS, { recursive: true });
  await page.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, name + '.png') });
}

async function textContrast(page) {
  return page.evaluate(() => {
    const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = color => color.slice(0, 3).map(channel => {
      const value = channel / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const issues = [];
    let checked = 0, minimum = Infinity;
    for (const element of document.querySelectorAll('body *')) {
      if (!element.getClientRects().length || ![...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) continue;
      const style = getComputedStyle(element);
      if (style.visibility !== 'visible') continue;
      const foreground = rgb(style.color);
      let background;
      for (let parent = element; parent; parent = parent.parentElement) {
        const candidate = rgb(getComputedStyle(parent).backgroundColor);
        if (candidate.length >= 3 && (candidate[3] ?? 1) === 1) { background = candidate; break; }
      }
      if (!background || foreground.length < 3) {
        issues.push(`unresolved color: ${element.tagName}`); continue;
      }
      const light = luminance(foreground), dark = luminance(background);
      const ratio = (Math.max(light, dark) + .05) / (Math.min(light, dark) + .05);
      const size = parseFloat(style.fontSize), weight = parseInt(style.fontWeight, 10);
      const required = size >= 24 || (size >= 18.6667 && weight >= 700) ? 3 : 4.5;
      checked++; minimum = Math.min(minimum, ratio);
      if (ratio < required) issues.push(`${element.tagName} ${element.textContent.trim().slice(0, 45)}: ${ratio.toFixed(2)} < ${required}`);
    }
    return { checked, minimum, issues };
  });
}

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}${mount}`;
  let browser;
  try {
    browser = await chromium.launch({ ...(process.env.SITE_BROWSER_CHANNEL ? { channel: process.env.SITE_BROWSER_CHANNEL } : {}), timeout: 60000 });
    console.log(`Native docs: ${journeysOnly ? 'navigation-only selection' : manifest.documents.length + ' pages'}; ${process.env.SITE_BROWSER_CHANNEL || 'Chromium'} ${browser.version()}`);
    async function openContext(options) {
      const context = await browser.newContext(options);
      context.setDefaultTimeout(15000);
      context.setDefaultNavigationTimeout(30000);
      return context;
    }
    for (const theme of journeysOnly ? [] : ['light', 'dark']) {
      const context = await openContext({ colorScheme: theme, reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
      // Any external request is both blocked and reported. Guides must not need APIs or images hosted elsewhere.
      await context.route('https://**', route => route.abort());
      const page = await context.newPage();
      const errors = [], external = [], failed = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (!request.url().startsWith(base)) external.push(request.url()); });
      page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
      try {
        for (const entry of manifest.documents) {
          console.log(`  ${theme}: ${entry.label}`);
          await visit(page, base + entry.route);
          check(await page.locator('h1').count() === 1, `${entry.label}/${theme}: expected one h1`);
          check(await page.locator('.doc-content').innerText().then(text => text.trim().length > 100), `${entry.label}: missing static article`);
          check(await page.locator('.view-source').count() === 1, `${entry.label}: missing secondary source link`);
          check((await page.locator('.view-source').getAttribute('href')) === `https://github.com/${manifest.repository}/blob/main/${entry.source}`, `${entry.label}: wrong canonical source`);
          check(await page.locator('.doc-sidebar [aria-current="page"]').count() === 1, `${entry.label}: incorrect active navigation`);
          const ids = await page.locator('[id]').evaluateAll(elements => elements.map(el => el.id));
          check(new Set(ids).size === ids.length, `${entry.label}: duplicate IDs`);
          const links = await page.locator('a[href], link[href], script[src], img[src]').evaluateAll(elements => elements.map(el => el.href || el.src));
          const broken = [];
          for (const href of links) {
            const url = new URL(href);
            if (!href.startsWith(base)) continue; // Genuine references/source/issue/download actions remain external.
            let local = decodeURIComponent(url.pathname.slice(mount.length));
            if (local.endsWith('/')) local += 'index.html';
            const file = path.join(root, local);
            if (!fs.existsSync(file)) { broken.push(href); continue; }
            if (url.hash && file.endsWith('.html') && !fs.readFileSync(file, 'utf8').includes(`id="${decodeURIComponent(url.hash.slice(1))}"`))
              broken.push(href);
          }
          check(!broken.length, `${entry.label}: broken native links: ${broken.join(', ')}`);
          check(await page.locator('.doc-content a[href*="github.com/ArasaniRohithReddy/app-releases/blob/main/"]').count() === 0,
            `${entry.label}: a guide link still bounces to the repository`);
          const screenContrast = await textContrast(page);
          check(screenContrast.checked > 0 && !screenContrast.issues.length,
            `${entry.label}/${theme}: text contrast failures: ${screenContrast.issues.join('; ')}`);
          for (const width of [320, 390, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.waitForFunction(expected => document.getElementById('guide-navigation').open === expected, width > 960);
            check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${entry.label}/${theme}@${width}: horizontal overflow`);
          }
          await page.evaluate(() => document.documentElement.style.fontSize = '200%');
          for (const width of [320, 640, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await page.waitForFunction(() => parseFloat(document.documentElement.style.getPropertyValue('--header-offset')) >= document.querySelector('header.site').getBoundingClientRect().height);
            check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${entry.label}/${theme}@${width}, 200%: horizontal overflow`);
          }
          await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
          await page.emulateMedia({ media: 'print' });
          const printContrast = await textContrast(page);
          check(printContrast.checked > 0 && !printContrast.issues.length,
            `${entry.label}/${theme}: print contrast failures: ${printContrast.issues.join('; ')}`);
          await page.emulateMedia({ media: 'screen' });
          if (['Overview', 'User guide', 'Command line', 'Enterprise deployment', 'Data handling & privacy', 'License'].includes(entry.label)) {
            for (const width of [1440, 390]) {
              await page.setViewportSize({ width, height: 900 });
              await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
              await snapshot(page, `guide-${entry.route.split('/').filter(Boolean).at(-1)}-${theme}-${width}`);
            }
          }
        }
        check(errors.length === 0, `${theme}: guide JavaScript errors: ${errors.join('; ')}`);
        check(external.length === 0, `${theme}: reading guides made external requests: ${external.join('; ')}`);
        check(failed.length === 0, `${theme}: failed local guide dependencies: ${failed.join('; ')}`);
      } finally { await context.close(); }
    }

    for (const [width, scale] of [[320, 1], [390, 1], [768, 1], [1440, 1], [640, 2], [1280, 2]]) {
      const context = await openContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      if (scale === 2) await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '200%'; }));
      await context.route('https://api.github.com/**', route => route.abort());
      const page = await context.newPage();
      try {
        await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
        // Each portal card now names the application it opens, because the hub lists more than one.
        await page.getByRole('link', { name: 'Open app — Threat Model Reviewer', exact: true }).click();
        await page.waitForURL(base + '/threat-model-reviewer/');
        await page.getByRole('link', { name: 'Follow the quick-start guide', exact: true }).click();
        await page.waitForURL(base + '/threat-model-reviewer/docs/user-guide/#try-the-sample-model');
        await page.locator('.doc-content').waitFor();
        await page.waitForFunction(() => document.getElementById('try-the-sample-model').getBoundingClientRect().top >= document.querySelector('header.site').getBoundingClientRect().bottom);
        check(await page.locator('#try-the-sample-model').evaluate(el => el.getBoundingClientRect().top >= document.querySelector('header.site').getBoundingClientRect().bottom), `journey@${width}: quick-start anchor hidden`);
        const disclosure = page.locator('#guide-navigation');
        if (!await disclosure.evaluate(el => el.open)) await disclosure.locator('summary').click();
        await page.getByRole('navigation', { name: 'Documentation', exact: true }).getByRole('link', { name: 'Install', exact: true }).click();
        await page.waitForURL(base + '/threat-model-reviewer/docs/install/');
        await page.locator('.doc-content').getByRole('link', { name: 'SECURITY.md', exact: true }).click();
        await page.waitForURL(base + '/threat-model-reviewer/docs/security/#code-signing');
        check(await page.locator('h1').textContent() === 'Security Policy', `journey@${width}: cross-guide link left the site`);
        await page.getByRole('link', { name: 'Back to product', exact: true }).click();
        await page.waitForURL(base + '/threat-model-reviewer/');
        await page.getByRole('link', { name: 'All apps — release hub', exact: true }).click();
        await page.waitForURL(base + '/');
        check(page.url() === base + '/', `journey@${width}: return to portal failed`);
        if (scale === 2)
          check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `journey@${width}, 200%: portal reflow failed`);
      } finally { await context.close(); }
    }

    const growingHeader = await openContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await growingHeader.newPage();
      await visit(page, base + '/threat-model-reviewer/docs/user-guide/#try-the-sample-model');
      const before = await page.locator('header.site').evaluate(element => element.getBoundingClientRect().height);
      await page.locator('.doc-topbar').evaluate(element => { element.style.maxWidth = '24rem'; });
      await page.waitForFunction(previous => {
        const header = document.querySelector('header.site').getBoundingClientRect();
        return header.height > previous && document.getElementById('try-the-sample-model').getBoundingClientRect().top >= header.bottom;
      }, before);
      check(await page.locator('#try-the-sample-model').evaluate(element => element.getBoundingClientRect().top >= document.querySelector('header.site').getBoundingClientRect().bottom),
        'docs: a header that grows after fragment navigation obscures the destination');
    } finally { await growingHeader.close(); }

    console.log('  Keyboard, no-script and historical-link journeys');
    const keyboard = await openContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', colorScheme: 'light' });
    try {
      const page = await keyboard.newPage();
      await visit(page, base + '/threat-model-reviewer/docs/cli/');
      await page.keyboard.press('Tab');
      check(await page.locator('.skip').evaluate(el => el === document.activeElement), 'docs: skip link is not first');
      await page.keyboard.press('Enter');
      check(await page.locator('#main').evaluate(el => el === document.activeElement), 'docs: skip link did not focus main');
      const toc = page.locator('.doc-toc');
      await toc.locator('summary').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      check(await page.evaluate(() => /^H[2-6]$/.test(document.activeElement.tagName)), 'docs: TOC keyboard navigation did not focus the heading');
      const code = page.locator('pre').first();
      await code.focus();
      check(await code.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'docs: code focus indicator missing');
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.activeElement.tagName === 'PRE' && document.activeElement.scrollLeft > 0);
      check(await code.evaluate(el => el.scrollLeft > 0), 'docs: code example cannot scroll using the keyboard');
      const theme = page.locator('#theme-toggle');
      for (const mode of ['light', 'dark', 'system']) {
        await theme.focus(); await page.keyboard.press('Enter');
        check(await page.locator('html').getAttribute('data-theme') === (mode === 'system' ? null : mode), `docs: cannot choose ${mode} theme`);
      }
      check(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'), 'docs: reduced motion ignored');
      await visit(page, base + '/threat-model-reviewer/docs/enterprise-deployment/');
      const table = page.locator('.table-scroll').first();
      await table.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.activeElement.classList.contains('table-scroll') && document.activeElement.scrollLeft > 0);
      check(await table.evaluate(el => el.scrollLeft > 0 && getComputedStyle(el).outlineStyle !== 'none'), 'docs: table is not keyboard-scrollable with visible focus');
      if (process.env.SITE_SCREENSHOTS)
        await table.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, 'guide-enterprise-table-keyboard-390.png') });
      await page.getByRole('link', { name: 'Support', exact: true }).last().click();
      await page.waitForURL(base + '/help/');
      check(await page.getByRole('link', { name: 'Open an issue', exact: true }).getAttribute('href') === `https://github.com/${manifest.repository}/issues/new/choose`, 'docs: genuine issue action was redirected');
      await page.setViewportSize({ width: 1280, height: 900 });
      const guideMenu = page.locator('#guide-navigation');
      await page.waitForFunction(() => document.getElementById('guide-navigation').open);
      await guideMenu.getByRole('link', { name: 'Install', exact: true }).focus();
      await page.setViewportSize({ width: 640, height: 900 });
      await page.waitForFunction(() => {
        const menu = document.getElementById('guide-navigation');
        return !menu.open && document.activeElement === menu.querySelector('summary');
      });
      check(await guideMenu.locator('summary').evaluate(element => element === document.activeElement && getComputedStyle(element).outlineStyle !== 'none'),
        'docs: collapsing the sidebar hid keyboard focus');
    } finally { await keyboard.close(); }

    console.log('  No-JavaScript reading with enlarged text');
    const noJs = await openContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    try {
      // addStyleTag waits for script-driven events that do not run in a no-script context.
      await noJs.route('**/docs.css', route => route.fulfill({
        status: 200,
        contentType: 'text/css',
        body: fs.readFileSync(path.join(root, 'docs.css'), 'utf8') + '\nhtml { font-size: 200%; }\n'
      }));
      const page = await noJs.newPage();
      await page.goto(base + '/threat-model-reviewer/docs/');
      check(await page.locator('h1').isVisible(), 'docs: reading requires JavaScript');
      check(!await page.locator('#theme-toggle').isVisible(), 'docs: no-JS page exposes a dead theme control');
      await page.getByRole('navigation', { name: 'Documentation', exact: true }).getByRole('link', { name: 'Install', exact: true }).click();
      await page.waitForURL(base + '/threat-model-reviewer/docs/install/');
      check(await page.locator('.doc-content').innerText().then(text => text.includes('Trusted People')), 'docs: cross-guide content missing without JavaScript');
      check(await page.locator('header.site').evaluate(element => getComputedStyle(element).position === 'static'),
        'docs: no-JavaScript enlarged header can obscure anchors');
      check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
        'docs: no-JavaScript 200% text causes horizontal overflow');
    } finally { await noJs.close(); }

    console.log('  Historical release-note guide links');
    const history = await openContext({ reducedMotion: 'reduce' });
    try {
      await history.route('https://api.github.com/**', route => route.abort());
      const page = await history.newPage();
      await page.goto(base + '/threat-model-reviewer/releases/', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.documentElement.dataset.releaseReady === 'true');
      const card = page.locator('.rel').filter({ has: page.locator('.notes-body a[href*="/docs/cli/"]') }).first();
      const notes = card.locator('details.notes');
      if (!await notes.evaluate(el => el.open)) await notes.locator('summary').click();
      await card.locator('.notes-body a[href*="/docs/cli/"]').first().click();
      await page.waitForURL(base + '/threat-model-reviewer/docs/cli/');
      check(await page.locator('.doc-content').isVisible(), 'history: guide link did not reach the native reader');
    } finally { await history.close(); }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log(`${passed} native documentation browser checks passed; ${failures.length} failed.`);
  failures.forEach(message => console.error(message));
  if (failures.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
