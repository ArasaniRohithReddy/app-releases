// Reuses verify-site's owned loopback server, browser and published snapshot fixtures.
const fs = require('node:fs');
const path = require('node:path');
module.exports = async function releaseHubChecks({ browser, base, root, products, allReleases, check, mockReleases, visit }) {
  console.log('Checking native multi-app release navigation, isolation and failure states');
  async function capture(page, name) {
    if (!process.env.SITE_SCREENSHOTS) return;
    fs.mkdirSync(process.env.SITE_SCREENSHOTS, { recursive: true });
    await page.screenshot({ path: path.join(process.env.SITE_SCREENSHOTS, name + '.png') });
  }
  async function context(options = {}) {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', ...options });
    ctx.setDefaultTimeout(15000);
    ctx.setDefaultNavigationTimeout(30000);
    return ctx;
  }

  for (const theme of ['light', 'dark']) {
    const ctx = await context({ colorScheme: theme, viewport: { width: 1180, height: 800 } });
    try {
      const unexpected = await mockReleases(ctx);
      const page = await ctx.newPage();
      for (const selector of ['header.site .rel-btn', '.hero .cta-row a:nth-child(2)', 'footer.site a[href="./releases/"]', '.catalog-note a[href="./releases/"]']) {
        await visit(page, base + '/');
        await page.locator(selector).click();
        await page.waitForURL(base + '/releases/');
        await page.waitForFunction(() => document.documentElement.dataset.releaseReady === 'true');
        check(page.url() === base + '/releases/', `hub/${theme}: ${selector} left native release browsing`);
      }
      await page.goto(base + '/help/', { waitUntil: 'domcontentloaded' });
      await page.locator('header.site').getByRole('link', { name: 'Releases', exact: true }).click();
      await page.waitForURL(base + '/releases/');
      await page.waitForFunction(() => document.documentElement.dataset.releaseReady === 'true');
      check(page.url() === base + '/releases/', `hub/${theme}: shared-help release navigation left the site`);
      for (const product of products) {
        const group = page.locator(`.release-group[data-product="${product.name}"]`);
        const tags = await group.locator('.release-row').evaluateAll(rows => rows.map(row => row.dataset.tag));
        check(JSON.stringify(tags) === JSON.stringify(product.snapshot.map(release => release.tag_name)),
          `hub/${theme}/${product.name}: history or product isolation changed`);
        const dates = await group.locator('time').evaluateAll(times => times.map(time => time.dateTime));
        check(JSON.stringify(dates) === JSON.stringify(product.snapshot.map(release => release.published_at)),
          `hub/${theme}/${product.name}: published dates changed`);
        check(await group.locator('.release-channel').filter({ hasText: 'Latest stable' }).count() === 1,
          `hub/${theme}/${product.name}: latest stable marker missing`);
      }
      for (const width of [320, 390, 620, 621, 700, 701, 768, 980, 1180, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
          `hub/${theme}@${width}: horizontal overflow`);
        check(await page.locator('header.site').evaluate(header => header.getBoundingClientRect().height <= 70),
          `hub/${theme}@${width}: normal header wrapped`);
        check(await page.locator('a.history-link, a.release-detail, select').evaluateAll(elements =>
          elements.every(element => element.getBoundingClientRect().height >= 24)),
        `hub/${theme}@${width}: a release/filter target is too short`);
        if ([390, 1180].includes(width)) await capture(page, `native-release-hub-${theme}-${width}`);
      }
      for (const family of ['Arial, sans-serif', 'Verdana, sans-serif', 'Tahoma, sans-serif', 'system-ui, sans-serif']) {
        await page.evaluate(font => document.documentElement.style.setProperty('--font', font), family);
        for (const width of [320, 479, 480, 481, 619, 620, 621, 699, 700, 701, 960, 961]) {
          await page.setViewportSize({ width, height: 900 });
          check(await page.locator('header.site').evaluate(header => header.getBoundingClientRect().height <= 70),
            `hub/${theme}/${family}@${width}: normal header wrapped`);
          check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
            `hub/${theme}/${family}@${width}: horizontal overflow`);
        }
      }
      await page.evaluate(() => document.documentElement.style.removeProperty('--font'));
      await page.evaluate(() => document.documentElement.style.fontSize = '200%');
      for (const width of [320, 640, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        check(await page.locator('main, .release-group, .release-row, .hub-field').evaluateAll(elements =>
          elements.every(element => element.scrollWidth <= element.clientWidth + 1)),
        `hub/${theme}@${width}/200%: content overflow`);
      }
      await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
      await page.setViewportSize({ width: 1180, height: 800 });
      await page.locator('#release-app').selectOption(products[1].name);
      check(await page.locator('.release-group:visible').count() === 1, `hub/${theme}: app filter did not isolate its group`);
      check(await page.locator('.release-group:visible').getAttribute('data-product') === products[1].name,
        `hub/${theme}: app filter substituted another product`);
      await page.locator('#release-channel').selectOption('preview');
      check(await page.locator('.release-row:visible').count() === products[1].snapshot.filter(release => release.prerelease).length,
        `hub/${theme}: pre-release filter count drifted`);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.documentElement.dataset.releaseReady === 'true');
      check(await page.locator('#release-app').inputValue() === products[1].name &&
        await page.locator('#release-channel').inputValue() === 'preview', `hub/${theme}: URL filters were not restored`);
      await visit(page, base + '/releases/');
      await page.keyboard.press('Tab');
      check(await page.locator('.skip').evaluate(element => element === document.activeElement), `hub/${theme}: skip link is not first`);
      await page.keyboard.press('Enter');
      check(await page.locator('#main').evaluate(element => element === document.activeElement), `hub/${theme}: skip link did not focus main`);
      await page.keyboard.press('Tab');
      check(await page.locator('#release-app').evaluate(element =>
        element === document.activeElement && getComputedStyle(element).outlineStyle !== 'none'),
      `hub/${theme}: app filter is not the next visible keyboard focus target`);

      for (const product of products) {
        await visit(page, base + '/releases/');
        const release = product.snapshot.at(-1); // an older entry, not just the default latest card
        const link = page.locator(`.release-row[data-tag="${release.tag_name}"] .release-detail`);
        const href = await link.getAttribute('href');
        check(href === base + product.url + 'releases/#' + encodeURIComponent(release.tag_name),
          `hub/${product.name}: detail link is not native/product-specific`);
        await link.click();
        await page.waitForURL(href);
        await page.waitForFunction(tag => {
          const card = document.getElementById(tag);
          return card && card === document.activeElement;
        }, release.tag_name);
        const card = page.locator(`article[id="${release.tag_name}"]`);
        check(await card.isVisible(), `hub/${product.name}: selected native detail is missing`);
        if (await card.locator('details.notes').count())
          check(await card.locator('details.notes').evaluate(element => element.open), `hub/${product.name}: linked notes were not opened`);
        await capture(page, `native-release-detail-${product.name}-${theme}`);
        await page.getByRole('link', { name: "All apps' releases", exact: true }).click();
        await page.waitForURL(base + '/releases/');
        check(page.url() === base + '/releases/', `hub/${product.name}: native history back-link failed`);
      }
      check(unexpected.length === 0, `hub/${theme}: non-product-scoped API endpoint requested`);
    } finally { await ctx.close(); }
  }

  for (const fault of ['offline', 'empty', 'malformed', 'both unavailable', 'one product unavailable']) {
    const ctx = await context();
    try {
      await ctx.route('https://api.github.com/**', route => {
        if (fault === 'offline') return route.abort();
        const data = fault === 'one product unavailable' ? products[0].snapshot : [];
        return route.fulfill({ contentType: 'application/json', body: fault === 'malformed' ? '{' : JSON.stringify(data) });
      });
      if (fault === 'both unavailable')
        await ctx.route('**/releases.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
      if (fault === 'one product unavailable')
        await ctx.route(`**/${products[1].name}/releases/releases.json`, route => route.fulfill({ status: 503, body: 'Unavailable' }));
      const page = await ctx.newPage();
      await visit(page, base + '/releases/');
      for (const product of products) {
        const group = page.locator(`.release-group[data-product="${product.name}"]`);
        const unavailable = fault === 'both unavailable' || (fault === 'one product unavailable' && product === products[1]);
        check(await group.locator('.release-row').count() === (unavailable ? 0 : product.snapshot.length),
          `hub/${fault}/${product.name}: unavailable or saved history is misrepresented`);
        check(await group.locator('.history-link').getAttribute('href') === `../${product.name}/releases/`,
          `hub/${fault}/${product.name}: native fallback link disappeared`);
        if (unavailable) check((await group.locator('.group-source').innerText()).includes('could not load'),
          `hub/${fault}/${product.name}: error not disclosed`);
      }
      if (fault === 'both unavailable') await capture(page, 'native-release-hub-unavailable');
    } finally { await ctx.close(); }
  }

  const previewContext = await context();
  try {
    const preview = { ...products[1].latest, tag_name: products[1].prefix + '99.0.0-preview',
      published_at: '2099-01-01T00:00:00Z', prerelease: true, assets: [], body: '', body_html: '' };
    const draft = { ...preview, tag_name: products[1].prefix + '100.0.0', draft: true, prerelease: false };
    await previewContext.route('https://api.github.com/**', route => route.fulfill({
      contentType: 'application/json', body: JSON.stringify([preview, draft, ...allReleases])
    }));
    const page = await previewContext.newPage();
    await visit(page, base + '/releases/');
    const group = page.locator(`.release-group[data-product="${products[1].name}"]`);
    check(await group.locator(`.release-row[data-tag="${preview.tag_name}"] .release-channel`).innerText() === 'Pre-release',
      'hub: preview is not labelled');
    check(await group.locator(`.release-row[data-tag="${products[1].latest.tag_name}"] .release-channel`).innerText() === 'Latest stable',
      'hub: a preview replaced the stable recommendation');
    check(await page.locator(`.release-row[data-tag="${draft.tag_name}"]`).count() === 0, 'hub: unpublished draft became a release');
    await page.locator('#release-channel').selectOption('preview');
    check(await page.locator('.release-row:visible').count() === 1, 'hub: preview filtering included stable releases');
  } finally { await previewContext.close(); }

  const noScript = await context({ javaScriptEnabled: false });
  try {
    const page = await noScript.newPage();
    await page.goto(base + '/releases/');
    check(await page.locator('#release-filters').isVisible() === false, 'hub: no-script filters are dead controls');
    for (const product of products)
      check(await page.locator(`a.history-link[href="../${product.name}/releases/"]`).isVisible(),
        `hub: ${product.name} native history requires JavaScript`);
  } finally { await noScript.close(); }
};
