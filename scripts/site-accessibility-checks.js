// Focused regressions for the existing public pages. Uses verify-site's owned browser/server
// and snapshot fixtures; no live downloads, extra dependencies or separate process lifecycle.
module.exports = async function accessibilityChecks({ browser, base, snapshot, check, mockReleases, visit }) {
  // Independent of the caller's growing native-document route list: this task owns only these pages.
  const pages = [
    ['portal', '/'],
    ['product', '/threat-model-reviewer/'],
    ['releases', '/threat-model-reviewer/releases/']
  ];
  async function openContext(options) {
    const context = await browser.newContext(options);
    context.setDefaultTimeout(15000);
    context.setDefaultNavigationTimeout(30000);
    return context;
  }

  // Evaluated in the page. These controls/badges use solid sRGB tokens, not image backgrounds.
  function surfaceContrast(input) {
    const style = getComputedStyle(input);
    const placeholder = input.matches('input') ? getComputedStyle(input, '::placeholder') : null;
    function rgba(value) {
      if (!/^rgba?\(/.test(value)) throw new Error('Unsupported computed colour: ' + value);
      const numbers = value.match(/[\d.]+/g).map(Number);
      return [...numbers.slice(0, 3), numbers[3] ?? 1];
    }
    function blend(foreground, background, opacity = 1) {
      const alpha = foreground[3] * opacity;
      return foreground.slice(0, 3).map((c, i) => c * alpha + background[i] * (1 - alpha));
    }
    function luminance(rgb) {
      const linear = rgb.map(c => c / 255 <= .04045 ? c / 255 / 12.92 : ((c / 255 + .055) / 1.055) ** 2.4);
      return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
    }
    function contrast(a, b) {
      const first = luminance(a), second = luminance(b);
      return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
    }
    const ancestors = [];
    for (let el = input.parentElement; el; el = el.parentElement) ancestors.unshift(el);
    let outside = [255, 255, 255];
    for (const el of ancestors) outside = blend(rgba(getComputedStyle(el).backgroundColor), outside);
    const inside = blend(rgba(style.backgroundColor), outside);
    const border = blend(rgba(style.borderTopColor), inside);
    return {
      boundary: Math.min(contrast(border, inside), contrast(border, outside)),
      text: contrast(blend(rgba(style.color), inside), inside),
      placeholder: placeholder ? contrast(blend(rgba(placeholder.color), inside, Number(placeholder.opacity)), inside) : null,
      outline: contrast(blend(rgba(style.outlineColor), outside), outside),
      outlineVisible: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
    };
  }

  async function checkFocus(page, label) {
    const focus = await page.evaluate(() => {
      const el = document.activeElement, rect = el.getBoundingClientRect(), style = getComputedStyle(el);
      return {
        inMain: Boolean(el.closest('main')),
        clear: rect.top >= document.querySelector('header.site').getBoundingClientRect().bottom &&
          rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth,
        visible: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
        name: el.getAttribute('aria-label') || el.textContent.trim()
      };
    });
    check(focus.inMain && focus.clear && focus.visible,
      `${label}: main control focus is missing, obscured or outside the viewport (${focus.name})`);
  }

  console.log('Checking public-page accessibility regressions');
  for (const system of ['light', 'dark']) {
    for (const [name, url] of pages) {
      const context = await openContext({
        colorScheme: system, reducedMotion: 'reduce', viewport: { width: 1280, height: 900 }
      });
      try {
        await mockReleases(context);
        if (name === 'releases') {
          // Exercise the pre-release state without editing the snapshot or selecting it as stable.
          const preview = {
            ...snapshot[0], tag_name: 'threat-model-reviewer-v99.0.0-preview',
            published_at: '2099-01-01T00:00:00Z', prerelease: true, assets: [], body_html: '', body: ''
          };
          await context.route('https://api.github.com/**', route => route.fulfill({
            contentType: 'application/json', body: JSON.stringify([preview, ...snapshot])
          }));
        }
        const page = await context.newPage();
        await visit(page, base + url);
        const button = page.getByRole('button', { name: /^Theme:/ });
        check(await button.isEnabled(), `${name}/${system}: theme helper did not enable its control`);

        // Explicit choices must win over the opposite OS preference for native controls too.
        // Space exercises the native button without substituting a scripted click.
        for (const mode of ['light', 'dark', 'system']) {
          await button.press('Space');
          const effective = mode === 'system' ? system : mode;
          check(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme) === effective,
            `${name}/${system}/${mode}: native colour scheme differs from the selected page theme`);

          const prose = await page.locator('main :is(p, li, dd, figcaption, .note, .dl-size, .notes-body) a:not(.btn)')
            .evaluateAll(links => {
              const visible = links.filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0);
              return {
                count: visible.length,
                missing: visible.filter(el => !getComputedStyle(el).textDecorationLine.includes('underline'))
                  .map(el => el.textContent.trim().slice(0, 80))
              };
            });
          check(prose.count > 0 && prose.missing.length === 0,
            `${name}/${system}/${mode}: prose links depend on colour alone: ${prose.missing.join('; ')}`);

          if (name === 'releases') {
            const input = page.getByRole('searchbox', { name: 'Filter releases by version' });
            const normal = await input.evaluate(surfaceContrast);
            check(normal.boundary >= 3, `releases/${system}/${mode}: field boundary ${normal.boundary.toFixed(2)}:1 < 3:1`);
            check(normal.text >= 4.5 && normal.placeholder >= 4.5,
              `releases/${system}/${mode}: input/placeholder text ${normal.text.toFixed(2)}/${normal.placeholder.toFixed(2)}:1`);
            await input.focus();
            const focused = await input.evaluate(surfaceContrast);
            check(focused.outlineVisible && focused.outline >= 3,
              `releases/${system}/${mode}: focus outline missing or below 3:1 (${focused.outline.toFixed(2)}:1)`);
            console.log(`  Release filter/${system}/${mode}: boundary ${normal.boundary.toFixed(2)}:1, placeholder ${normal.placeholder.toFixed(2)}:1, focus ${focused.outline.toFixed(2)}:1`);
            const badge = await page.locator('.badge.pre').evaluate(surfaceContrast);
            check(badge.text >= 4.5, `releases/${system}/${mode}: pre-release text ${badge.text.toFixed(2)}:1 < 4.5:1`);
            console.log(`  Pre-release badge/${system}/${mode}: ${badge.text.toFixed(2)}:1`);
          }
        }

        if (name === 'releases') {
          const namedLikeItsCaption = await page.locator('header.site .back-link').evaluate(el => {
            const visible = el.innerText.trim().replace(/\s+/g, ' ').toLowerCase();
            return Boolean(visible) && (el.getAttribute('aria-label') || '').toLowerCase().includes(visible);
          });
          check(namedLikeItsCaption,
            'releases: accessible back-link name must contain its visible Overview label');
        }

        for (const width of [320, 375, 390, 620, 621, 640, 700, 701, 820, 821, 980, 1280, 1460, 1461, 1600, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          const header = await page.locator('header.site').evaluate(element => {
            const singleRow = container => {
              const centers = [...container.children].filter(child => !child.classList.contains('spacer'))
                .map(child => child.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0)
                .map(box => box.top + box.height / 2);
              return centers.length < 2 || Math.max(...centers) - Math.min(...centers) <= 1;
            };
            return {
              height: element.getBoundingClientRect().height,
              aligned: [...element.querySelectorAll('.nav, .nav-links, .nav-actions')].every(singleRow),
              guideLinks: [...element.querySelectorAll('a')].filter(link =>
                link.textContent.trim() === 'Guides' && link.getBoundingClientRect().width > 0).length
            };
          });
          check(header.height <= 70 && header.aligned,
            `${name}/${system}@${width}: normal-size header wraps or loses alignment (${header.height.toFixed(1)}px)`);
          check(header.guideLinks === 1, `${name}/${system}@${width}: expected one visible Guides entry, got ${header.guideLinks}`);
        }

        // Real forward/backward Tab navigation, including the narrow wrapping-header layout.
        for (const width of [320, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await visit(page, base + url);
          if (name === 'portal') {
            // A 300px card can consume the right gutter at 320px without overflowing the viewport.
            const aligned = await page.locator('.apps').evaluate(grid => {
              const bounds = grid.getBoundingClientRect();
              return [...grid.children].every(card => {
                const box = card.getBoundingClientRect();
                return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
              });
            });
            check(aligned, `portal/${system}@${width}: app cards extend into the content gutter`);
          }
          await page.keyboard.press('Tab');
          check(await page.locator('.skip').evaluate(el => el === document.activeElement),
            `${name}/${system}@${width}: skip link is not first`);
          await page.keyboard.press('Enter');
          await page.keyboard.press('Tab');
          await checkFocus(page, `${name}/${system}@${width}/forward`);
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          await checkFocus(page, `${name}/${system}@${width}/backward`);

          // Inline prose links use the SC 2.5.8 inline exception; data-table links need a
          // separate spacing review. Do not incorrectly require every inline link to be 24px tall.
          const small = await page.locator('#theme-toggle, main .btn, main input, main summary').evaluateAll(elements =>
            elements.filter(el => {
              const box = el.getBoundingClientRect();
              return box.width > 0 && box.height > 0 && (box.width < 24 || box.height < 24);
            }).map(el => el.getAttribute('aria-label') || el.textContent.trim().slice(0, 80)));
          check(small.length === 0, `${name}/${system}@${width}: undersized primary controls: ${small.join('; ')}`);
        }

        // Page overflow alone misses a label overflowing its card into a neighbour.
        // Existing code/table scrollers need separate keyboard and reflow-exception review.
        await page.evaluate(() => document.documentElement.style.fontSize = '200%');
        for (const width of [320, 640, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          const clipped = await page.locator('h1, main .btn, .app-card, .feature, .dl-card, .dl-item, footer.site .brand')
            .evaluateAll(elements => elements.filter(el =>
              el.clientWidth > 0 && el.getBoundingClientRect().height > 0 && el.scrollWidth > el.clientWidth + 1)
              .map(el => el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)));
          check(clipped.length === 0, `${name}/${system}@${width}, 200% text: overflowing content: ${clipped.join('; ')}`);
        }
      } finally { await context.close(); }
    }
  }

  const noJs = await openContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  try {
    const page = await noJs.newPage();
    for (const [name, url] of pages) {
      await page.goto(base + url, { waitUntil: 'domcontentloaded' });
      check(await page.locator('#theme-toggle').isDisabled(),
        `${name}: JavaScript-disabled page advertises an operable theme button`);
      check(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme) === 'dark',
        `${name}: JavaScript-disabled page does not retain its system colour scheme`);
    }
  } finally { await noJs.close(); }
};
