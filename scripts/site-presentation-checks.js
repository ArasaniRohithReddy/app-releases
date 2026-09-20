const fs = require('node:fs');
const path = require('node:path');

// Product presentation has a deliberately explicit matrix. These are the widths used for the
// visual review, not a sample inferred from framework breakpoints.
const PRESENTATION_WIDTHS = [320, 352, 390, 768, 1024, 1366, 1440, 1920];

module.exports = async function presentationChecks({ browser, base, check, mockReleases, visit }) {
  console.log('Checking screenshot presentation and portal-card alignment');

  async function openContext(theme) {
    const context = await browser.newContext({
      colorScheme: theme,
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 900 }
    });
    await mockReleases(context);
    return context;
  }

  for (const theme of ['light', 'dark']) {
    const context = await openContext(theme);
    try {
      const portal = await context.newPage();
      await visit(portal, base + '/');

      for (const textPercent of [100, 200]) {
        await portal.evaluate(percent => {
          document.documentElement.style.fontSize = percent === 100 ? '' : `${percent}%`;
        }, textPercent);

        for (const width of PRESENTATION_WIDTHS) {
          await portal.setViewportSize({ width, height: 900 });
          const result = await portal.locator('.apps').evaluate((grid, viewportWidth) => {
            const box = element => element.getBoundingClientRect();
            const inside = (inner, outer) =>
              inner.left >= outer.left - 1 && inner.right <= outer.right + 1 &&
              inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
            const cards = [...grid.querySelectorAll('.app-card.live')].map(card => {
              const cardBox = box(card);
              const icon = box(card.querySelector('.app-icon'));
              const title = box(card.querySelector('.app-title'));
              const status = box(card.querySelector('.status'));
              const footer = box(card.querySelector('.app-foot'));
              const open = box(card.querySelector('.app-open'));
              const version = box(card.querySelector('.ver'));
              const tags = [...card.querySelectorAll('.app-tags span')].map(box);
              const sameFooterRow = open.top < version.bottom && version.top < open.bottom;
              return {
                name: card.querySelector('.app-title').textContent.trim(),
                versionText: card.querySelector('.ver').textContent.trim(),
                card: { top: cardBox.top, left: cardBox.left, right: cardBox.right, height: cardBox.height },
                topDisplay: getComputedStyle(card.querySelector('.app-top')).display,
                titleBesideOrAfterIcon:
                  (title.left >= icon.right - 1 && title.top <= icon.bottom + 1) ||
                  (title.top >= icon.bottom - 1 && Math.abs(title.left - icon.left) <= 1),
                statusAfterTitle: status.top >= title.bottom - 1,
                statusAligned: Math.abs(status.left - title.left) <= 1 ||
                  Math.abs(status.left - icon.left) <= 1,
                footerTop: footer.top,
                openTop: open.top,
                versionTop: version.top,
                footerAligned: !sameFooterRow ||
                  (Math.abs((open.top + open.height / 2) - (version.top + version.height / 2)) <= 1),
                footerSeparated: sameFooterRow ? open.right <= version.left + 1 : open.bottom <= version.top + 1,
                contained: [icon, title, status, footer, open, version, ...tags]
                  .every(child => inside(child, cardBox)),
                tagsContained: tags.every(tag => tag.left >= cardBox.left - 1 &&
                  tag.right <= cardBox.right + 1 && tag.width <= cardBox.width + 1),
                clipped: card.scrollWidth > card.clientWidth + 1
              };
            });
            const gridBox = box(grid);
            const sameRow = cards.length >= 2 && Math.abs(cards[0].card.top - cards[1].card.top) <= 1;
            return {
              pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              gridContained: gridBox.left >= -1 && gridBox.right <= viewportWidth + 1,
              cards,
              sameRow,
              equalHeight: !sameRow || Math.abs(cards[0].card.height - cards[1].card.height) <= 1,
              footerBaseline: !sameRow ||
                (Math.abs(cards[0].footerTop - cards[1].footerTop) <= 1 &&
                 Math.abs(cards[0].openTop - cards[1].openTop) <= 1 &&
                 Math.abs(cards[0].versionTop - cards[1].versionTop) <= 1)
            };
          }, width);

          const label = `portal/${theme}@${width}, ${textPercent}% text`;
          check(result.cards.length === 2, `${label}: expected two live product cards`);
          check(result.pageOverflow <= 0 && result.gridContained, `${label}: cards overflow the viewport`);
          check(result.cards.every(card => card.topDisplay === 'grid'),
            `${label}: icon/title/status header is not using the stable grid`);
          check(result.cards.every(card => card.titleBesideOrAfterIcon && card.statusAfterTitle && card.statusAligned),
            `${label}: icon, title or status left the intended header rows`);
          check(result.cards.every(card => card.contained && card.tagsContained && !card.clipped),
            `${label}: a card or tag clips/escapes its border`);
          check(result.cards.every(card => card.footerAligned && card.footerSeparated),
            `${label}: Open app and version overlap or lose their baseline`);
          check(result.equalHeight && result.footerBaseline,
            `${label}: cards sharing a row do not have equal heights and footer baselines`);
          check(result.cards.every(card => /^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(card.versionText)),
            `${label}: a version chip is unresolved or malformed`);
        }
      }

      if (process.env.SITE_SCREENSHOTS) {
        fs.mkdirSync(process.env.SITE_SCREENSHOTS, { recursive: true });
        await portal.evaluate(() => { document.documentElement.style.fontSize = ''; });
        await portal.setViewportSize({ width: 1440, height: 900 });
        await portal.locator('.apps').screenshot({
          path: path.join(process.env.SITE_SCREENSHOTS, `portal-cards-${theme}-1440.png`)
        });
        await portal.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        // Keep the whole enlarged card grid in one viewport. A stitched locator screenshot would
        // otherwise repeat the real sticky header between tiles and create false overlap evidence.
        await portal.setViewportSize({ width: 320, height: 10000 });
        await portal.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await portal.locator('.apps').screenshot({
          path: path.join(process.env.SITE_SCREENSHOTS, `portal-cards-${theme}-320-200pct.png`)
        });
      }
      await portal.close();

      const product = await context.newPage();
      await visit(product, base + '/shot2code/');
      for (const image of await product.locator('.hero-proof img, #screens img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(element => element.decode());
      }

      const intrinsic = await product.locator('.hero-proof .shot-frame, #screens .shot-frame')
        .evaluateAll(frames => frames.map(frame => {
          const image = frame.querySelector('img');
          const style = getComputedStyle(frame);
          const imageStyle = getComputedStyle(image);
          return {
            classes: frame.className,
            width: Number(image.getAttribute('width')),
            height: Number(image.getAttribute('height')),
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            objectFit: imageStyle.objectFit,
            background: style.backgroundColor,
            borderWidth: parseFloat(style.borderTopWidth),
            borderStyle: style.borderTopStyle,
            overflow: style.overflow,
            alt: image.getAttribute('alt') || ''
          };
        }));
      const expectedClasses = [
        'shot-frame--16x9', 'shot-frame--16x9',
        'shot-frame--detail', 'shot-frame--detail', 'shot-frame--portrait'
      ];
      check(intrinsic.length === expectedClasses.length,
        `shot2code/${theme}: expected the hero plus four framed screenshots`);
      intrinsic.forEach((image, index) => {
        const label = `shot2code/${theme} screenshot ${index + 1}`;
        check(image.classes.split(/\s+/).includes(expectedClasses[index]),
          `${label}: missing ${expectedClasses[index]} aspect wrapper`);
        check(image.width === image.naturalWidth && image.height === image.naturalHeight,
          `${label}: markup ${image.width}x${image.height} differs from PNG ${image.naturalWidth}x${image.naturalHeight}`);
        check(image.objectFit === 'contain', `${label}: object-fit must be contain, not ${image.objectFit}`);
        check(image.background !== 'rgba(0, 0, 0, 0)' &&
          image.borderWidth >= 1 && image.borderStyle === 'solid' && image.overflow === 'hidden',
        `${label}: frame background/border/overflow policy is missing`);
        check(image.alt.trim().length >= 25, `${label}: alternative text is missing or uninformative`);
      });

      for (const textPercent of [100, 200]) {
        await product.evaluate(percent => {
          document.documentElement.style.fontSize = percent === 100 ? '' : `${percent}%`;
        }, textPercent);
        for (const width of PRESENTATION_WIDTHS) {
          await product.setViewportSize({ width, height: 900 });
          const layout = await product.locator('#screens').evaluate((section, viewportWidth) => {
            const rect = element => element.getBoundingClientRect();
            const frames = [...section.querySelectorAll('.shot-frame')].map(frame => {
              const box = rect(frame);
              const image = frame.querySelector('img');
              const naturalRatio = image.naturalWidth / image.naturalHeight;
              const innerWidth = Math.max(0, box.width - 2);
              const innerHeight = Math.max(0, box.height - 2);
              const scale = Math.min(innerWidth / image.naturalWidth, innerHeight / image.naturalHeight);
              const paintedWidth = image.naturalWidth * scale;
              const paintedHeight = image.naturalHeight * scale;
              return {
                classes: frame.className,
                left: box.left, right: box.right, top: box.top,
                width: box.width, height: box.height,
                ratio: box.width / box.height,
                uncropped: paintedWidth <= innerWidth + .5 && paintedHeight <= innerHeight + .5 &&
                  Math.abs((paintedWidth / paintedHeight) - naturalRatio) <= .001
              };
            });
            const figures = [...section.querySelectorAll('figure')];
            const details = figures.slice(1, 3).map(figure => ({
              frame: rect(figure.querySelector('.shot-frame')),
              caption: rect(figure.querySelector('figcaption')),
              figure: rect(figure)
            }));
            const portrait = rect(section.querySelector('.shot-portrait .shot-frame'));
            const wrap = rect(section.querySelector('.wrap'));
            const sameDetailRow = Math.abs(details[0].frame.top - details[1].frame.top) <= 1;
            return {
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              framesInside: frames.every(frame => frame.left >= -1 && frame.right <= viewportWidth + 1),
              ratios: frames.map(frame => ({
                classes: frame.classes, ratio: frame.ratio, uncropped: frame.uncropped
              })),
              detailsAligned: !sameDetailRow ||
                (Math.abs(details[0].frame.height - details[1].frame.height) <= 1 &&
                 Math.abs(details[0].caption.top - details[1].caption.top) <= 1 &&
                 Math.abs(details[0].figure.height - details[1].figure.height) <= 1),
              captionsBelow: figures.every(figure =>
                rect(figure.querySelector('figcaption')).top >= rect(figure.querySelector('.shot-frame')).bottom),
              portraitCentered: Math.abs((portrait.left + portrait.right) / 2 -
                (wrap.left + wrap.right) / 2) <= 1,
              portraitHeight: portrait.height
            };
          }, width);
          const label = `shot2code gallery/${theme}@${width}, ${textPercent}% text`;
          check(layout.overflow <= 0 && layout.framesInside, `${label}: screenshot frame overflows`);
          check(layout.ratios.every(frame => frame.uncropped), `${label}: a source image would be cropped or distorted`);
          for (const frame of layout.ratios) {
            const expected = frame.classes.includes('shot-frame--portrait') ? 3 / 4 :
              frame.classes.includes('shot-frame--detail') ? 16 / 10 : 16 / 9;
            check(Math.abs(frame.ratio - expected) <= .015,
              `${label}: ${frame.classes} rendered at ${frame.ratio.toFixed(3)}, expected ${expected.toFixed(3)}`);
          }
          check(layout.detailsAligned && layout.captionsBelow,
            `${label}: detail frames/captions lose their shared rhythm`);
          check(layout.portraitCentered && layout.portraitHeight <= 642,
            `${label}: portrait is not centred or exceeds its 640px content-height ceiling`);
        }
      }

      if (process.env.SITE_SCREENSHOTS) {
        await product.evaluate(() => { document.documentElement.style.fontSize = ''; });
        for (const [size, width] of [['desktop', 1440], ['mobile', 390]]) {
          await product.setViewportSize({ width, height: 900 });
          await product.locator('#screens').screenshot({
            path: path.join(process.env.SITE_SCREENSHOTS, `shot2code-gallery-${theme}-${size}.png`)
          });
        }
      }
      await product.close();
    } finally {
      await context.close();
    }
  }

  // Hold image responses until the CSS aspect boxes are measurable, then confirm that decoding the
  // real PNGs changes neither frame nor caption geometry. This catches missing intrinsic sizing
  // even when a warm browser cache would otherwise hide the shift.
  const delayed = await openContext('light');
  let releaseImages;
  const imageGate = new Promise(resolve => { releaseImages = resolve; });
  try {
    await delayed.route('**/shot2code/img/*.png', async route => {
      await imageGate;
      await route.continue();
    });
    const page = await delayed.newPage();
    await page.addInitScript(() => {
      window.__presentationShift = 0;
      new PerformanceObserver(entries => {
        for (const entry of entries.getEntries()) {
          if (!entry.hadRecentInput) window.__presentationShift += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await visit(page, base + '/shot2code/');
    const geometry = () => page.locator('.hero-proof, #screens').evaluateAll(regions =>
      regions.flatMap(region => [...region.querySelectorAll('.shot-frame, figcaption')].map(element => {
        const box = element.getBoundingClientRect();
        return {
          key: element.className || element.tagName,
          top: box.top + scrollY,
          left: box.left + scrollX,
          width: box.width,
          height: box.height
        };
      })));
    const before = await geometry();
    await page.evaluate(() => { window.__presentationShift = 0; });
    releaseImages();
    for (const image of await page.locator('.hero-proof img, #screens img').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(element => element.decode());
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    const after = await geometry();
    const moved = before.filter((box, index) => {
      const next = after[index];
      return !next || ['top', 'left', 'width', 'height'].some(key => Math.abs(box[key] - next[key]) > .5);
    });
    const shift = await page.evaluate(() => window.__presentationShift);
    check(moved.length === 0, `shot2code images: ${moved.length} frame/caption boxes moved after decode`);
    check(shift <= .001, `shot2code images: image decode caused ${shift.toFixed(4)} cumulative layout shift`);
    await page.close();
  } finally {
    releaseImages();
    await delayed.close();
  }
};

module.exports.PRESENTATION_WIDTHS = PRESENTATION_WIDTHS;
