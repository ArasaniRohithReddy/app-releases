const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const docs = require('./build-docs.js');
const root = path.resolve(__dirname, '..');
const built = docs.buildSite();
const fixtureEntry = { source: 'products/threat-model-reviewer/USER-GUIDE.md', route: '/threat-model-reviewer/docs/user-guide/', label: 'Fixture', group: 'Product guides' };
const render = text => {
  const document = docs.prepareDocument(fixtureEntry, text);
  return { document, html: docs.renderContent(document, [document]) };
};

test('only the current public guide allowlist is generated, with deterministic output', () => {
  assert.equal(docs.manifest.channel, 'stable-public');
  const productSources = fs.readdirSync(path.join(root, 'products/threat-model-reviewer'))
    .filter(name => name.endsWith('.md') || name === 'LICENSE').map(name => 'products/threat-model-reviewer/' + name).sort();
  assert.deepEqual(docs.manifest.documents.filter(doc => doc.source.startsWith('products/threat-model-reviewer/')).map(doc => doc.source).sort(), productSources);
  assert.equal(built.documents.length, 22);
  assert.deepEqual([...built.outputs], [...docs.buildSite().outputs]);
  assert.deepEqual(docs.checkOrWrite(root, true), { pages: 22, changed: 0 });
});

test('development sources, traversing paths and duplicate routes are rejected', () => {
  assert.throws(() => docs.validateManifest({ ...docs.manifest, channel: 'development' }));
  assert.throws(() => docs.validateManifest({ ...docs.manifest, documents: [{ ...fixtureEntry, source: '../../private/USER-GUIDE.md' }] }));
  assert.throws(() => docs.validateManifest({ ...docs.manifest, documents: [{ ...fixtureEntry, route: '/help/../private/' }] }));
  assert.throws(() => docs.validateManifest({ ...docs.manifest, documents: [fixtureEntry, fixtureEntry] }));
  for (const text of [
    '# Guide\n\n> **UNRELEASED development preview**',
    '---\nchannel: development\n---\n# Guide',
    '# MCP (development-only)\nNot stable',
    '# Guide\n\n**Development-only:** these commands are not shipped.',
    '# Guide\n\n**Current source builds (unreleased):** new behavior.',
    '# Guide\n\nSource-only behavior under development.',
  ]) {
    assert.throws(() => docs.prepareDocument(fixtureEntry, text), /development|unreleased/i);
  }
  assert.doesNotThrow(() => render('# Examples\n\n~~~text\nchannel: development\n~~~\n\n```text\n# Development-only\n```\n'));
});

test('the public changelog retains labelled history without presenting it as stable functionality', () => {
  const history = built.documents.find(doc => doc.history);
  assert.equal(history.source, 'products/threat-model-reviewer/CHANGELOG.md');
  const html = built.outputs.get('docs' + history.route + 'index.html');
  assert.match(html, /Unreleased items are not claims about the stable binary/);
  assert.ok(history.headings.some(heading => heading.text === '[Unreleased]'));
  assert.ok(history.headings.some(heading => heading.text.includes('2.5.1')));
});

test('raw HTML and active URL schemes cannot become executable documentation', () => {
  const { html } = render('# Safe\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert(1))\n\n<iframe src="https://example.org"></iframe>');
  assert.doesNotMatch(html, /<script\b|<iframe\b|<img\b|href="javascript:/i);
  assert.match(html, /&lt;script&gt;/);
  for (const url of ['javascript:alert(1)', 'java&#x73;cript:alert(1)', 'javascript%3Aalert(1)', 'data:text/html,hi', 'file:///C:/private', 'vbscript:msgbox(1)', '//evil.example/x', 'https://x.example/%0aevil']) {
    assert.equal(docs.safeUrl(url), false, url);
  }
  for (const url of ['https://example.org/a', 'http://example.org', 'mailto:security@example.org', '../CLI.md', '#a-heading'])
    assert.equal(docs.safeUrl(url), true, url);
});

test('code is escaped, tables have keyboard regions, and external images do not fetch at runtime', () => {
  const { html } = render('# Example\n\n```powershell\n<script>not executable</script>\n```\n\n| Key | Value |\n| --- | --- |\n| a | b |\n\n![Release badge](https://img.shields.io/test)\n');
  assert.match(html, /<pre tabindex="0" aria-label="powershell code example"/);
  assert.match(html, /&lt;script&gt;not executable&lt;\/script&gt;/);
  assert.match(html, /class="table-scroll" tabindex="0" role="region"/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /<span class="image-alt">Release badge<\/span>/);
  assert.doesNotMatch(html, /<img|src="https:/);
});

test('heading IDs are deterministic, unique, and do not collide with the shared shell', () => {
  const document = docs.prepareDocument(fixtureEntry, '# main\n\n## Same heading\n\n## Same heading\n\n## theme-toggle\n\n[Jump](#same-heading-1)');
  assert.notEqual(document.titleId, 'main');
  assert.deepEqual(document.headings.map(h => h.id), ['same-heading', 'same-heading-1', 'section-theme-toggle']);
  assert.match(docs.renderContent(document, [document]), /href="#same-heading-1"/);
});

test('natural numbered headings cannot overwrite duplicate-heading fragments', () => {
  const document = docs.prepareDocument(fixtureEntry,
    '# Guide\n\n## Same\n\n## Same\n\n## Same-1\n\n## Same\n\n[Second](#same-1)\n\n[Natural](#same-1-1)');
  assert.deepEqual(document.headings.map(heading => heading.id), ['same', 'same-1', 'same-1-1', 'same-2']);
  assert.equal(document.fragments.get('same-1'), 'same-1');
  assert.equal(document.fragments.get('same-1-1'), 'same-1-1');
  assert.match(docs.renderContent(document, [document]), /href="#same-1">Second/);
});

test('a generated page title does not replace an existing source heading fragment', () => {
  const document = docs.prepareDocument({ ...fixtureEntry, label: 'Existing' }, '## Existing\n\n[Jump](#existing)');
  assert.equal(document.titleId, 'section-existing');
  assert.equal(document.fragments.get('existing'), 'existing');
  assert.match(docs.renderContent(document, [document]), /href="#existing">Jump/);
});
test('relative and GitHub guide links stay local while genuine external actions stay external', () => {
  const guide = built.documents.find(doc => doc.source === fixtureEntry.source);
  assert.equal(docs.resolveLink('CLI.md', guide, built.documents), '../cli/');
  assert.equal(docs.resolveLink('https://github.com/ArasaniRohithReddy/app-releases/blob/main/products/threat-model-reviewer/INSTALL.md', guide, built.documents), '../install/');
  assert.equal(docs.resolveLink('../../SECURITY.md#code-signing', guide, built.documents), '../../../help/security/#code-signing');
  assert.equal(docs.resolveLink('SECURITY.md#code-signing', guide, built.documents), '../security/#code-signing');
  assert.equal(docs.resolveLink('LICENSE', guide, built.documents), '../license/');
  const issue = 'https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose';
  assert.equal(docs.resolveLink(issue, guide, built.documents), issue);
  assert.throws(() => docs.resolveLink('MCP-DEVELOPMENT.md', guide, built.documents), /unmapped/);
  assert.throws(() => docs.resolveLink('CLI.md#missing-section', guide, built.documents), /missing heading/);
});

test('every generated guide has a static article, native navigation and one secondary source link', () => {
  for (const document of built.documents) {
    const html = built.outputs.get('docs' + document.route + 'index.html');
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, document.source);
    assert.equal([...html.matchAll(/class="view-source"/g)].length, 1, document.source);
    assert.match(html, /aria-label="Documentation"/, document.source);
    assert.match(html, /aria-current="page"/, document.source);
    assert.match(html, /class="doc-content">[\s\S]+<\/div>/, document.source);
    assert.ok(html.includes(document.sourceHash), document.source);
    assert.doesNotMatch(html, /<iframe|http-equiv="refresh"|src="[^"]*api\.github|src="[^"]*release-data\.js/i, document.source);
    assert.ok(html.includes(new URL(document.route.slice(1), docs.manifest.site).href), document.source);
  }
});

test('the three authored routes link to native guides and workflows check generated drift', () => {
  for (const file of ['docs/index.html', 'docs/threat-model-reviewer/index.html', 'docs/threat-model-reviewer/releases/index.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(html, /<a\b[^>]*href="https:\/\/github\.com\/ArasaniRohithReddy\/app-releases\/(?:blob|tree)\/main\//, file);
    assert.match(html, /href="[^"]*docs\/">Guides<\/a>/, file);
  }
  for (const file of ['.github/workflows/site-checks.yml', '.github/workflows/update-releases-snapshot.yml'])
    assert.match(fs.readFileSync(path.join(root, file), 'utf8'), /run: npm run check:docs/, file);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /npm run check:docs/);
});

test('release-note guide aliases resolve locally without editing historical data or calling APIs', () => {
  const sandbox = { URL, window: {}, document: { currentScript: { src: 'https://example.test/app-releases/guide-links.js' } }, location: { href: 'https://example.test/app-releases/threat-model-reviewer/releases/' } };
  vm.runInNewContext(built.outputs.get('docs/guide-links.js'), sandbox);
  const resolve = sandbox.window.SiteDocs.resolve;
  assert.equal(resolve('/ArasaniRohithReddy/app-releases/blob/docs/CLI.md'), 'https://example.test/app-releases/threat-model-reviewer/docs/cli/');
  assert.equal(resolve('https://github.com/ArasaniRohithReddy/app-releases/blob/main/products/threat-model-reviewer/INSTALL.md'), 'https://example.test/app-releases/threat-model-reviewer/docs/install/');
  assert.equal(resolve('https://evil.test/ArasaniRohithReddy/app-releases/blob/docs/CLI.md'), null);
  assert.equal(resolve('https://github.com/ArasaniRohithReddy/app-releases/releases/latest'), null);
});

test('drift checks are read-only, fail on edited output, and recover by deterministic regeneration', () => {
  const base = path.join(root, 'test-results');
  fs.mkdirSync(base, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(base, 'docs-drift-'));
  try {
    for (const entry of docs.manifest.documents) {
      const to = path.join(temporary, entry.source);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(path.join(root, entry.source), to);
    }
    fs.mkdirSync(path.join(temporary, 'scripts/docs'), { recursive: true });
    fs.copyFileSync(path.join(root, 'scripts/docs/layout.html'), path.join(temporary, 'scripts/docs/layout.html'));
    fs.cpSync(path.join(root, 'docs'), path.join(temporary, 'docs'), { recursive: true });
    const target = path.join(temporary, 'docs/threat-model-reviewer/docs/cli/index.html');
    fs.appendFileSync(target, '\n<!-- drift fixture -->\n');
    const changed = fs.readFileSync(target, 'utf8');
    assert.throws(() => docs.checkOrWrite(temporary, true), /drift/);
    assert.equal(fs.readFileSync(target, 'utf8'), changed, 'Check must never rewrite output');
    docs.checkOrWrite(temporary, false);
    assert.deepEqual(docs.checkOrWrite(temporary, true), { pages: 22, changed: 0 });
    const unapproved = path.join(temporary, 'docs/threat-model-reviewer/docs/development-preview.md');
    fs.writeFileSync(unapproved, '# Unreleased preview fixture');
    assert.throws(() => docs.checkOrWrite(temporary, true), /Unmapped generated pages/);
    assert.ok(fs.existsSync(unapproved), 'Checks must not silently delete unknown content');
    fs.unlinkSync(unapproved);

    fs.appendFileSync(target, '\n<!-- retain this until all output paths validate -->\n');
    const beforeInvalidOutput = fs.readFileSync(target, 'utf8');
    const lateOutput = path.join(temporary, 'docs/guide-links.js');
    fs.unlinkSync(lateOutput);
    fs.mkdirSync(lateOutput);
    assert.throws(() => docs.checkOrWrite(temporary, false), /EISDIR|illegal operation on a directory/i);
    assert.equal(fs.readFileSync(target, 'utf8'), beforeInvalidOutput, 'A later invalid destination must not leave an earlier page overwritten');
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
