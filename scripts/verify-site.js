const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const releaseData = require('../docs/release-data.js');
const { createSiteServer, mount } = require('./site-server.js');
const accessibilityChecks = require('./site-accessibility-checks.js');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..', 'docs'));

// Every product on the hub is described once, here. The assertions below are written against this
// list, so adding an application means adding an entry rather than copying a block of checks.
const products = [
  {
    name: 'threat-model-reviewer',
    url: '/threat-model-reviewer/',
    prefix: 'threat-model-reviewer-v',
    versionChip: 'tmr-version',
    sections: ['try', 'screens', 'how', 'features', 'whats-new', 'download', 'enterprise', 'docs'],
    screenshots: 4,
    steps: 4,
    kinds: ['msi', 'portable', 'setup', 'cli', 'skill', 'msix', 'cer'],
    // The hero mirrors the card marked "Recommended" in the download grid.
    recommended: asset => asset.name.endsWith('-x64.msi'),
    // This page loads its committed snapshot before refreshing from the API, so a failed API call
    // still leaves real downloads on the page.
    snapshotBacked: true,
    fallback: 'https://github.com/ArasaniRohithReddy/app-releases/releases?q=threat-model-reviewer&expanded=true'
  },
  {
    name: 'shot2code',
    url: '/shot2code/',
    prefix: 'shot2code-v',
    versionChip: 'shot2code-version',
    sections: ['what', 'screens', 'how', 'features', 'stacks', 'providers', 'whats-new', 'download', 'privacy', 'docs'],
    screenshots: 4,
    steps: 4,
    kinds: ['setup', 'msi', 'portable', 'checksums'],
    recommended: asset => /-x64\.exe$/.test(asset.name),
    // The product page resolves downloads live; its release list keeps the committed snapshot.
    snapshotBacked: false,
    fallback: 'https://github.com/ArasaniRohithReddy/app-releases/releases?q=shot2code&expanded=true'
  }
];

for (const product of products) {
  product.snapshot = JSON.parse(fs.readFileSync(path.join(root, product.name, 'releases', 'releases.json'), 'utf8'));
  product.latest = product.snapshot.find(r => r.tag_name.startsWith(product.prefix) && !r.draft && !r.prerelease);
  if (!product.latest) throw new Error(`The ${product.name} release snapshot has no stable release.`);
}
// One repository, several products: the pages read the release *list* and pick the newest stable
// release carrying their own tag prefix, so the mock has to serve every product at once.
const allReleases = products
  .flatMap(product => product.snapshot)
  .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

// The preservation, history and accessibility journeys below exercise the release page bundle that
// only the Threat Model Reviewer ships, so they are written against that product's saved history.
const reviewer = products.find(product => product.name === 'threat-model-reviewer');
const snapshot = reviewer.snapshot;
const latest = reviewer.latest;

const sample = JSON.parse(fs.readFileSync(path.join(root, 'threat-model-reviewer', 'samples', 'customer-portal-review.json'), 'utf8'));
const pages = [['portal', '/'], ['product', '/threat-model-reviewer/'], ['releases', '/threat-model-reviewer/releases/']];
const server = createSiteServer(root);

let passed = 0;
const failures = [];
function check(condition, message) {
  if (condition) passed++;
  else failures.push(message);
}

async function mockReleases(context, unavailable = false) {
  // Anything the pages ask of the GitHub API other than the release list is recorded, because
  // /releases/latest is repository-wide and would hand one product another product's build.
  const unexpected = [];
  await context.route('https://api.github.com/repos/ArasaniRohithReddy/app-releases/**', route => {
    const url = route.request().url();
    if (unavailable) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Unavailable' }) });
    }
    if (!url.includes('/releases?')) {
      unexpected.push(url);
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not Found' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(allReleases) });
  });
  return unexpected;
}

async function ready(page) {
  await page.waitForFunction(() => document.documentElement.dataset.releaseReady === 'true');
}

async function visit(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(page);
}

async function historyMatches(page, expected, label) {
  const differences = await page.evaluate(releases => {
    const text = html => new DOMParser().parseFromString(html || '', 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
    const cards = [...document.querySelectorAll('.rel')];
    const errors = [];
    if (cards.length !== releases.length) errors.push(`release count ${cards.length} != ${releases.length}`);
    for (const release of releases) {
      const ver = release.tag_name.replace('threat-model-reviewer-v', '').toLowerCase();
      const card = cards.find(c => c.dataset.ver === ver);
      if (!card) { errors.push(`missing ${ver}`); continue; }
      const actual = [...card.querySelectorAll('.files tbody a')].map(a => a.href).sort();
      const wanted = release.assets.map(a => a.browser_download_url).sort();
      if (JSON.stringify(actual) !== JSON.stringify(wanted)) errors.push(`${ver}: asset history changed`);
      if (text(card.querySelector('.notes-body')?.innerHTML) !== text(release.body_html)) errors.push(`${ver}: notes changed`);
    }
    return errors;
  }, expected);
  check(differences.length === 0, `${label}: ${differences.join('; ')}`);
}

async function preservationChecks(browser, base) {
  const version = 'v' + latest.tag_name.slice(releaseData.PREFIX.length);
  const msi = latest.assets.find(a => releaseData.kindOf(a.name) === 'msi');
  console.log('Checking preservation journeys and fault states');

  const journey = await browser.newContext({ reducedMotion: 'reduce' });
  try {
    await mockReleases(journey);
    const page = await journey.newPage();
    await visit(page, base + '/');
    // Two products now share the portal, so each card names the application it opens.
    await page.getByRole('link', { name: 'Open app — Threat Model Reviewer', exact: true }).click();
    await ready(page);
    check(page.url() === base + '/threat-model-reviewer/', 'journey: portal did not open the product');
    for (const kind of ['msi', 'cli', 'skill']) {
      const asset = latest.assets.find(a => releaseData.kindOf(a.name) === kind);
      // Only exercise the link/download plumbing; never download or run a real installer in tests.
      await journey.route(asset.browser_download_url, route => route.fulfill({
        contentType: 'application/octet-stream',
        headers: { 'Content-Disposition': `attachment; filename="${asset.name}"` },
        body: 'Synthetic browser download fixture, not an application binary.'
      }));
      const event = page.waitForEvent('download');
      await page.locator(kind === 'msi' ? '#hero-download' : `[data-dl="${kind}"]`).click();
      const download = await event;
      check(download.suggestedFilename() === asset.name && await download.failure() === null, `journey: ${kind} download routing failed`);
    }
    check(/needs the command-line bundle/i.test(await page.locator('[data-dl="skill"]').locator('..').textContent()), 'journey: skill dependency is missing');
    await page.getByRole('link', { name: /^All releases\b/ }).click();
    await ready(page);
    await historyMatches(page, snapshot, 'journey: complete history');
    if (process.env.SITE_SCREENSHOTS)
      await page.locator('.rel.latest .dl-grid').screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, 'release-download-kinds.png') });
    const wrongKinds = await page.locator('.rel').evaluateAll((cards, releases) => cards.flatMap(card => {
      const release = releases.find(r => r.tag_name === 'threat-model-reviewer-v' + card.dataset.ver);
      return [...card.querySelectorAll('[data-kind]')].filter(link => {
        const asset = release?.assets.find(a => a.browser_download_url === link.href);
        return !asset || window.ReleaseData.kindOf(asset.name) !== link.dataset.kind ||
          !link.getAttribute('aria-label')?.includes('v' + card.dataset.ver);
      }).map(link => link.href);
    }), snapshot);
    check(wrongKinds.length === 0, 'history: package links or accessible version labels drifted');
    for (const query of [version, version.toUpperCase(), latest.tag_name, '2.5']) {
      await page.getByRole('searchbox').fill(query);
      const normalized = query.toLowerCase().replace(/^(?:threat-model-reviewer-)?v(?=\d)/, '');
      const count = snapshot.filter(r => r.tag_name.slice(releaseData.PREFIX.length).includes(normalized)).length;
      check(await page.locator('.rel:visible').count() === count, `history: filter failed for ${query}`);
    }
    await page.getByRole('searchbox').fill('no-such-version');
    await page.getByRole('heading', { name: 'No matching version' }).waitFor();
    check(await page.locator('.rel:visible').count() === 0, 'history: empty state still displays cards');
    if (process.env.SITE_SCREENSHOTS)
      await page.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, 'releases-filter-empty.png') });
    await page.getByRole('searchbox').fill('');
    check(await page.locator('.no-match').count() === 0 && await page.locator('.rel:visible').count() === snapshot.length, 'history: clearing the filter did not recover all releases');
    await page.getByRole('link', { name: 'Overview — back to Threat Model Reviewer', exact: true }).click();
    await ready(page);
    await page.getByRole('link', { name: 'All apps — release hub', exact: true }).click();
    await ready(page);
    check(page.url() === base + '/', 'journey: return to portal failed');
  } finally { await journey.close(); }

  const faults = [
    { name: '403', status: 403 }, { name: '503', status: 503 }, { name: 'offline', abort: true },
    { name: 'invalid JSON', body: '{' }, { name: 'wrong shape', body: '{}' },
    { name: 'empty array', body: '[]' }, { name: 'malformed entries', body: JSON.stringify([null, { ...latest, assets: {} }]) }
  ];
  for (const fault of faults) {
    const context = await browser.newContext();
    try {
      await context.route('https://api.github.com/**', route => fault.abort ? route.abort() : route.fulfill({
        status: fault.status || 200, contentType: 'application/json', body: fault.body || '{"message":"Unavailable"}'
      }));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const [name, url] of pages) {
        await visit(page, base + url);
        check(await page.locator('html').getAttribute('data-release-source') === 'snapshot', `${name}/${fault.name}: did not retain the snapshot`);
        if (name === 'portal') check(await page.locator('#tmr-version').textContent() === version, `${fault.name}: portal version drift`);
        if (name === 'product') {
          check(await page.locator('#hero-download').getAttribute('href') === msi.browser_download_url, `${fault.name}: snapshot MSI missing`);
          const links = await page.locator('[data-dl]').evaluateAll(nodes => nodes.map(n => [n.dataset.dl, n.href]));
          check(links.every(([kind, href]) => latest.assets.some(a => releaseData.kindOf(a.name) === kind && a.browser_download_url === href)), `${fault.name}: package kinds drifted`);
        }
        if (name === 'releases') await historyMatches(page, snapshot, `${fault.name}: snapshot history`);
      }
      check(errors.length === 0, `${fault.name}: JavaScript errors: ${errors.join('; ')}`);
    } finally { await context.close(); }
  }

  for (const liveWorks of [false, true]) {
    const context = await browser.newContext();
    try {
      await context.route('**/releases.json', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
      await context.route('https://api.github.com/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(liveWorks ? snapshot : []) }));
      const page = await context.newPage();
      await visit(page, base + '/threat-model-reviewer/releases/');
      if (liveWorks) await historyMatches(page, snapshot, 'empty snapshot: live recovery');
      else {
        check(await page.getByRole('link', { name: 'View releases on GitHub', exact: true }).isVisible(), 'both empty: GitHub fallback is missing');
        check(await page.locator('.skel').count() === 0 && await page.locator('#hm-count').textContent() === 'Releases unavailable', 'both empty: indefinite loading state');
        if (process.env.SITE_SCREENSHOTS)
          await page.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, 'releases-unavailable.png') });
      }
    } finally { await context.close(); }
  }

  // Synthetic future data only: these fixtures never change the published snapshot or stable claim.
  const newTag = releaseData.PREFIX + '99.0.0';
  const newVersion = latest.tag_name.slice(releaseData.PREFIX.length);
  const newer = {
    ...latest, tag_name: newTag, published_at: '2099-01-01T00:00:00Z',
    assets: latest.assets.map(a => ({
      ...a, name: a.name.replace('v' + newVersion, 'v99.0.0'),
      browser_download_url: a.browser_download_url.replaceAll(latest.tag_name, newTag).replaceAll('v' + newVersion, 'v99.0.0')
    }))
  };
  const preview = { ...newer, tag_name: releaseData.PREFIX + '99.1.0-preview', prerelease: true, published_at: '2099-02-01T00:00:00Z', assets: [] };
  const refreshes = [
    { name: 'partial live list', live: [latest], expected: snapshot, stable: latest },
    { name: 'mixed live products and channels', live: [{ ...newer, tag_name: 'other-app-v100.0.0' }, { ...newer, draft: true }, preview, newer], expected: [preview, newer, ...snapshot], stable: newer }
  ];
  for (const fixture of refreshes) {
    const context = await browser.newContext();
    try {
      await context.route('https://api.github.com/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixture.live) }));
      const page = await context.newPage();
      for (const [name, url] of pages) {
        await visit(page, base + url);
        const ver = 'v' + fixture.stable.tag_name.slice(releaseData.PREFIX.length);
        const chip = name === 'portal' ? '#tmr-version' : name === 'product' ? '#version-chip' : '#hm-latest';
        check(await page.locator(chip).textContent() === ver, `${name}/${fixture.name}: wrong stable version`);
        if (name === 'product') check(await page.locator('#hero-download').getAttribute('href') === fixture.stable.assets.find(a => releaseData.kindOf(a.name) === 'msi').browser_download_url, `${fixture.name}: wrong MSI`);
        if (name === 'releases') {
          await historyMatches(page, fixture.expected, fixture.name);
          check(await page.locator('.rel.latest .rel-ver').textContent() === ver, `${fixture.name}: prerelease labelled latest`);
        }
      }
    } finally { await context.close(); }
  }

  const incomplete = await browser.newContext();
  try {
    const withoutSkill = { ...newer, assets: newer.assets.filter(a => releaseData.kindOf(a.name) !== 'skill') };
    await incomplete.route('https://api.github.com/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify([withoutSkill]) }));
    const page = await incomplete.newPage();
    await visit(page, base + '/threat-model-reviewer/');
    check(await page.locator('[data-dl="skill"]').getAttribute('href') === releaseData.releaseUrl(newer), 'refresh: missing skill retained an older version download');
    check(await page.locator('[data-size="skill"]').textContent() === '', 'refresh: missing skill retained an older file size');
  } finally { await incomplete.close(); }

  const delayed = await browser.newContext({ reducedMotion: 'reduce' });
  let releaseLive;
  const gate = new Promise(resolve => releaseLive = resolve);
  try {
    const updated = structuredClone(snapshot);
    updated[0].assets[0].download_count++;
    await delayed.route('https://api.github.com/**', async route => {
      await gate;
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(updated) });
    });
    const page = await delayed.newPage();
    await page.goto(base + '/threat-model-reviewer/releases/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.releaseSource === 'snapshot');
    const olderVersion = snapshot[1].tag_name.slice(releaseData.PREFIX.length);
    const older = page.locator(`.rel[data-ver="${olderVersion}"]`);
    await page.getByRole('searchbox').fill('v' + olderVersion);
    await older.locator('.assets > summary').focus();
    await page.keyboard.press('Enter');
    await older.locator('.notes > summary').focus();
    await page.keyboard.press('Enter');
    releaseLive();
    await ready(page);
    check(await older.locator('.assets').evaluate(el => el.open) && await older.locator('.notes').evaluate(el => el.open), 'refresh: disclosures closed while being read');
    check(await older.locator('.notes > summary').evaluate(el => el === document.activeElement), 'refresh: keyboard focus was lost');
    check(await page.getByRole('searchbox').inputValue() === 'v' + olderVersion && await page.locator('.rel:visible').count() === 1, 'refresh: filter state was lost');
  } finally { releaseLive(); await delayed.close(); }

  const themes = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' });
  try {
    await mockReleases(themes);
    const page = await themes.newPage();
    for (const [name, url] of pages) {
      await visit(page, base + url);
      await page.keyboard.press('Tab');
      check(await page.locator('.skip').evaluate(el => el === document.activeElement), `${name}: skip link is not first`);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      check(await page.evaluate(() => Boolean(document.activeElement.closest('main'))), `${name}: skip link did not bypass header controls`);
      const button = page.getByRole('button', { name: /^Theme:/ });
      for (const mode of ['light', 'dark', 'system']) {
        await button.focus();
        await page.keyboard.press('Enter');
        check(await page.locator('html').getAttribute('data-theme') === (mode === 'system' ? null : mode), `${name}: cannot select ${mode} using the keyboard`);
        check((await button.getAttribute('aria-label')).includes('Theme: ' + mode), `${name}: theme label drift`);
      }
      check(await page.evaluate(() => localStorage.getItem('theme')) === null, `${name}: returning to system did not clear the saved override`);
      await page.emulateMedia({ colorScheme: 'dark' });
      // CSS and the matchMedia change event can settle on different turns (notably in Edge).
      await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(15, 17, 22)' &&
        document.getElementById('theme-toggle').getAttribute('aria-label').includes('system (dark)'));
      check((await button.getAttribute('aria-label')).includes('system (dark)'), `${name}: system preference did not update`);
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(251, 251, 253)' &&
        document.getElementById('theme-toggle').getAttribute('aria-label').includes('system (light)'));
    }
  } finally { await themes.close(); }

  const blockedStorage = await browser.newContext();
  try {
    await mockReleases(blockedStorage);
    await blockedStorage.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked for this test'); } }));
    const page = await blockedStorage.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [name, url] of pages) {
      await visit(page, base + url);
      for (const mode of ['light', 'dark', 'system']) {
        await page.locator('#theme-toggle').click();
        check(await page.locator('html').getAttribute('data-theme') === (mode === 'system' ? null : mode), `${name}: theme failed with blocked storage`);
      }
    }
    check(errors.length === 0, 'blocked storage caused JavaScript errors');
  } finally { await blockedStorage.close(); }
}

async function main() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}${mount}`;
  let browser;
  try {
    browser = await chromium.launch({
      ...(process.env.SITE_BROWSER_CHANNEL ? { channel: process.env.SITE_BROWSER_CHANNEL } : {}),
      timeout: 60000
    });
    console.log(`Browser: ${process.env.SITE_BROWSER_CHANNEL || 'bundled Chromium'} ${browser.version()}`);
    // Every published page of every product, not just the first application on the hub.
    const sitePages = [
      ['portal', '/'],
      ...products.flatMap(product => [
        [`${product.name} product`, product.url],
        [`${product.name} releases`, `${product.url}releases/`]
      ])
    ];
    for (const [name, url] of sitePages) {
      for (const theme of ['light', 'dark']) {
        console.log(`Checking ${name}/${theme}`);
        const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1440, height: 900 } });
        const unexpectedApi = await mockReleases(context);
        const page = await context.newPage();
        const errors = [];
        const failedRequests = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', r => {
          if (r.url().startsWith(base) && r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
        });
        await visit(page, base + url);
        check(await page.locator('h1').count() === 1, `${name}/${theme}: expected one h1`);
        // Content-grid alignment is specific to the Threat Model Reviewer page's layout.
        if (name === 'threat-model-reviewer product') {
          const alignment = await page.evaluate(() => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect();
            const lefts = selector => [...document.querySelectorAll(selector)].map(el => el.getBoundingClientRect().left);
            const same = values => Math.max(...values) - Math.min(...values) < 1;
            return {
              note: Math.abs(rect('.how-note').width - rect('.steps').width) < 1,
              sample: Math.abs(lefts('.pillars > *')[1] - lefts('.start-example > *')[1]) < 1,
              workflows: same(lefts('.workflow p')) && same(lefts('.workflow > a')),
              hero: Math.abs(rect('.hero h1').top - rect('.hero-proof img').top) < 1,
              copy: parseFloat(getComputedStyle(document.querySelector('.steps p')).fontSize) >= 16
            };
          });
          for (const [part, aligned] of Object.entries(alignment))
            check(aligned, `product/${theme}: ${part} alignment/readability regression`);
        }
        const structuredData = await page.locator('script[type="application/ld+json"]').count();
        check(structuredData === 1, `${name}/${theme}: expected one JSON-LD block, found ${structuredData}`);
        check(await page.locator('meta[property="og:image"]').count() === 1, `${name}/${theme}: expected one og:image`);

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

        await page.evaluate(() => document.documentElement.style.fontSize = '200%');
        for (const width of [320, 640, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          check(overflow <= 0, `${name}/${theme}@${width}, 200% text: ${overflow}px horizontal overflow`);
          await page.waitForFunction(() => parseFloat(document.documentElement.style.getPropertyValue('--header-offset')) >=
            document.querySelector('header.site').getBoundingClientRect().height);
          const header = await page.evaluate(() => ({
            height: document.querySelector('header.site').getBoundingClientRect().height,
            clearance: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
          }));
          check(header.clearance >= header.height, `${name}/${theme}@${width}, 200% text: ${header.height}px header exceeds ${header.clearance}px anchor clearance`);
        }
        await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
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
          for (const el of document.querySelectorAll('.btn, .lede, .boundary-note, .pillar p, .workflow p, .coverage-list dd, .stack-grid li, .callout p')) {
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
        if (process.env.SITE_SCREENSHOTS) {
          fs.mkdirSync(process.env.SITE_SCREENSHOTS, { recursive: true });
          for (const [size, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
            await page.setViewportSize({ width, height });
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await page.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, `${name}-${theme}-${size}.png`) });
          }
        }
        check(unexpectedApi.length === 0, `${name}/${theme}: queried a non-list GitHub API endpoint: ${unexpectedApi.join(', ')}`);
        await context.close();
      }
    }

    // The portal resolves each product independently, so the newest release overall cannot put its
    // version on another application's card.
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await mockReleases(context);
      const page = await context.newPage();
      await page.goto(base + '/', { waitUntil: 'networkidle' });
      for (const product of products) {
        const expected = 'v' + product.latest.tag_name.slice(product.prefix.length);
        await page.waitForFunction(
          ([id, value]) => document.getElementById(id)?.textContent.trim() === value,
          [product.versionChip, expected],
          { timeout: 5000 }
        ).catch(() => {});
        check((await page.locator(`#${product.versionChip}`).textContent()).trim() === expected,
          `portal: ${product.name} card shows the wrong version`);
        check(await page.locator(`.app-card a[href="./${product.name}/"]`).count() === 1,
          `portal: missing a card linking to ${product.name}`);
      }
      await context.close();
    }

    for (const product of products) {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
      await mockReleases(context);
      const page = await context.newPage();
      await page.goto(base + product.url, { waitUntil: 'networkidle' });
      if (process.env.SITE_SCREENSHOTS) {
        fs.mkdirSync(process.env.SITE_SCREENSHOTS, { recursive: true });
        for (const [label, width, height] of [['desktop', 1366, 768], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
          await page.setViewportSize({ width, height });
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await page.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, `${product.name}-${label}.png`) });
        }
        await page.setViewportSize({ width: 1366, height: 768 });
      }
      for (const id of product.sections)
        check(await page.locator(`#${id}`).count() === 1, `${product.name}: missing section ${id}`);
      check(await page.locator('#screens img').count() === product.screenshots,
        `${product.name}: expected ${product.screenshots} full screenshots`);
      check(await page.locator('#how .steps li').count() === product.steps,
        `${product.name}: expected ${product.steps} explanation steps`);

      const primary = page.locator('#hero-download');
      check(await primary.evaluate(el => {
        const box = el.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight;
      }), `${product.name}: primary download is below the fold on a 1366x768 laptop`);
      const recommended = product.latest.assets.find(product.recommended);
      check(recommended && await primary.getAttribute('href') === recommended.browser_download_url,
        `${product.name}: hero does not select the recommended download`);
      for (const kind of product.kinds) {
        const link = await page.locator(`[data-dl="${kind}"]`).first().getAttribute('href');
        check(product.latest.assets.some(a => a.browser_download_url === link), `${product.name}: no real asset for ${kind}`);
      }
      // The version is resolved from the release feed, so a new build cannot leave a stale number
      // behind on the page.
      const version = 'v' + product.latest.tag_name.slice(product.prefix.length);
      for (const id of ['version-chip', 'version-chip-2'])
        check((await page.locator(`#${id}`).textContent()).trim() === version,
          `${product.name}: #${id} did not resolve to the published version`);

      for (const id of ['how', 'features', 'download']) {
        await page.evaluate(value => document.getElementById(value).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
        const clear = await page.evaluate(value => document.getElementById(value).getBoundingClientRect().top >= document.querySelector('header.site').getBoundingClientRect().bottom, id);
        check(clear, `${product.name}: ${id} is covered by the sticky header`);
      }
      await page.reload({ waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      check(await page.locator(':focus').getAttribute('class') === 'skip', `${product.name}: skip link is not the first keyboard stop`);
      const theme = page.locator('#theme-toggle');
      const initial = await theme.getAttribute('aria-label');
      await theme.focus();
      check(await theme.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), `${product.name}: keyboard focus is not visible`);
      await page.keyboard.press('Enter');
      check(await theme.getAttribute('aria-label') !== initial, `${product.name}: keyboard theme toggle failed`);
      const changed = await theme.getAttribute('aria-label');
      await page.reload({ waitUntil: 'networkidle' });
      check(await theme.getAttribute('aria-label') === changed, `${product.name}: theme preference did not persist`);
      check(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'), `${product.name}: reduced motion ignored`);
      await context.close();

      // Both degraded paths must still hand the reader this product's own release, never the
      // repository-wide latest, which now belongs to whichever application shipped most recently.
      // A page backed by a committed snapshot keeps offering the real files when the API is down;
      // one without a snapshot falls back to its own filtered release list.
      const offline = await browser.newContext();
      await mockReleases(offline, true);
      const fallback = await offline.newPage();
      await fallback.goto(base + product.url, { waitUntil: 'networkidle' });
      if (product.snapshotBacked) {
        const saved = product.latest.assets.find(product.recommended);
        await fallback.waitForFunction(
          expected => document.getElementById('hero-download')?.getAttribute('href') === expected,
          saved.browser_download_url, { timeout: 5000 }
        ).catch(() => {});
        check(await fallback.locator('#hero-download').getAttribute('href') === saved.browser_download_url,
          `${product.name}: API failure broke the snapshot download`);
        for (const kind of product.kinds) {
          const link = await fallback.locator(`[data-dl="${kind}"]`).first().getAttribute('href');
          check(product.latest.assets.some(a => a.browser_download_url === link),
            `${product.name}: ${kind} lost its snapshot download when the API failed`);
        }
      } else {
        check(await fallback.locator('#hero-download').getAttribute('href') === product.fallback,
          `${product.name}: API failure broke the download fallback`);
        for (const kind of product.kinds) {
          const link = await fallback.locator(`[data-dl="${kind}"]`).first().getAttribute('href');
          check(link === product.fallback, `${product.name}: ${kind} has no working fallback when the API fails`);
        }
      }
      await offline.close();

      const noJs = await browser.newContext({ javaScriptEnabled: false });
      const staticPage = await noJs.newPage();
      await staticPage.goto(base + product.url);
      check(await staticPage.locator('#hero-download').getAttribute('href') === product.fallback,
        `${product.name}: static download unavailable`);
      // Structured data and the links a reader can click must describe the same download.
      const declared = JSON.parse(await staticPage.locator('script[type="application/ld+json"]').textContent()).downloadUrl;
      check(declared === product.fallback,
        `${product.name}: structured data and the no-JavaScript download disagree`);
      for (const kind of product.kinds)
        check(await staticPage.locator(`[data-dl="${kind}"]`).first().getAttribute('href') === product.fallback,
          `${product.name}: ${kind} needs JavaScript to be downloadable`);
      await noJs.close();
    }

    // Product-specific content that only makes sense for one application.
    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      await mockReleases(context);
      const page = await context.newPage();
      await page.goto(base + '/threat-model-reviewer/', { waitUntil: 'networkidle' });
      for (const [attribute, expected] of [['verdict', sample.verdict], ['score', sample.score], ['gating', sample.gatingFindings]])
        check((await page.locator(`[data-sample-${attribute}]`).textContent()).trim() === String(expected), `threat-model-reviewer: sample ${attribute} drift`);
      const downloadEvent = page.waitForEvent('download');
      await page.locator('#try a[download]').click();
      const download = await downloadEvent;
      check(download.suggestedFilename() === 'customer-portal.tm7' && await download.failure() === null, 'threat-model-reviewer: sample download failed');
      await context.close();

      const noJs = await browser.newContext({ javaScriptEnabled: false });
      const staticPage = await noJs.newPage();
      await staticPage.goto(base + '/threat-model-reviewer/');
      check(await staticPage.locator('#try a[download]').count() === 1, 'threat-model-reviewer: sample requires JavaScript');
      await noJs.close();
    }

    // Only the no-JavaScript history fallback is specific to this product's releases page; the
    // keyboard, theme and offline journeys above already run for every application on the hub.
    {
      const noJs = await browser.newContext({ javaScriptEnabled: false });
      const staticPage = await noJs.newPage();
      await staticPage.goto(base + '/threat-model-reviewer/releases/');
      check(await staticPage.getByRole('link', { name: 'View releases on GitHub', exact: true }).isVisible(), 'releases: history fallback requires JavaScript');
      check(await staticPage.locator('.skel').count() === 0, 'releases: no-JavaScript page leaves loading skeletons');
      await noJs.close();
    }

    await preservationChecks(browser, base);
    await accessibilityChecks({ browser, base, snapshot, check, mockReleases, visit });

    {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      await mockReleases(context);
      const page = await context.newPage();
      await page.goto(base + '/shot2code/', { waitUntil: 'networkidle' });
      check(await page.locator('#stacks .stack-grid li').count() === 12, 'shot2code: expected twelve output stacks');
      const warning = (await page.locator('#download .note').textContent()).toLowerCase();
      check(warning.includes('not code-signed') && warning.includes('windows protected your pc'),
        'shot2code: the unsigned-binary warning is missing from the download section');

      // Version-resilience: the structured data and the copy-paste verification command are both
      // filled in from the release that was actually resolved.
      const shot2codeProduct = products.find(entry => entry.name === 'shot2code');
      const installer = shot2codeProduct.latest.assets.find(shot2codeProduct.recommended);
      const structured = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
      check(structured.softwareVersion === shot2codeProduct.latest.tag_name.slice(shot2codeProduct.prefix.length),
        'shot2code: structured data did not take the resolved version');
      check(structured.downloadUrl === installer.browser_download_url,
        'shot2code: structured data did not take the resolved installer');
      const verifyCommand = (await page.locator('#verify-command').textContent()).trim();
      check(verifyCommand === `Get-FileHash .\\${installer.name} -Algorithm SHA256`,
        `shot2code: the verification command still reads "${verifyCommand}"`);
      // The gallery links to the full-resolution files, so those have to exist on the site.
      for (const link of await page.locator('#screens a[href$=".png"]').all()) {
        const href = await link.getAttribute('href');
        const response = await page.request.get(new URL(href, base + '/shot2code/').toString());
        check(response.ok(), `shot2code: gallery link ${href} did not resolve`);
        check(Boolean((await link.getAttribute('aria-label'))?.trim()), `shot2code: gallery link ${href} has no accessible name`);
      }
      await context.close();
    }

    // Each releases page lists only its own product, and only the packages a person downloads.
    for (const product of products) {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      await mockReleases(context);
      const page = await context.newPage();
      await page.goto(base + product.url + 'releases/', { waitUntil: 'networkidle' });
      const versions = await page.locator('.rel .rel-ver').allTextContents();
      check(versions.length === product.snapshot.length, `${product.name} releases: rendered ${versions.length} of ${product.snapshot.length} releases`);
      check(versions[0]?.trim() === 'v' + product.latest.tag_name.slice(product.prefix.length),
        `${product.name} releases: the newest card is not this product's latest release`);
      const links = await page.locator('.rel.latest .dl-item a.btn').evaluateAll(nodes => nodes.map(n => n.href));
      check(links.length > 0 && links.every(href => product.latest.assets.some(a => a.browser_download_url === href)),
        `${product.name} releases: a download button does not point at a real asset`);
      check(!links.some(href => /\.blockmap$|latest\.yml$/.test(href)),
        `${product.name} releases: updater internals are offered as downloads`);
      await context.close();
    }
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
