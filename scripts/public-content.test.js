const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const product = read('docs/threat-model-reviewer/index.html');
const sample = JSON.parse(read('docs/threat-model-reviewer/samples/customer-portal-review.json'));

test('hero result describes the published synthetic sample', () => {
  for (const [attribute, value] of [['verdict', sample.verdict], ['score', sample.score], ['gating', sample.gatingFindings]]) {
    const match = product.match(new RegExp(`data-sample-${attribute}[^>]*>([^<]+)<`));
    assert.ok(match, `Missing sample ${attribute}`);
    assert.equal(match[1].trim(), String(value));
  }
  assert.ok(fs.existsSync(path.join(root, 'docs/threat-model-reviewer/samples/customer-portal.tm7')));
  assert.match(product, /href="samples\/customer-portal\.tm7" download/);
  assert.ok(product.includes(`${sample.checkCount} deterministic checks`));
});

test('current product copy does not carry retired feature or approval claims', () => {
  for (const name of ['README.md', 'products/threat-model-reviewer/README.md', 'products/threat-model-reviewer/ARCHITECTURE.md', 'docs/threat-model-reviewer/index.html']) {
    const text = read(name);
    assert.doesNotMatch(text, /hidden in the current desktop build|model authoring is in beta|pass SDL review the first time|latest-v2\.0\.3/i, name);
  }
  assert.match(product, /does not patch application code/);
  assert.match(product, /not Microsoft approval|guarantee Microsoft approval/);
  assert.doesNotMatch(product, /Every artifact is Authenticode-signed/);
});

test('only MSI is recommended in the product download grid', () => {
  const recommended = [...product.matchAll(/<div class="dl-card recommended">([\s\S]*?)<\/div>\s*<div class="dl-card">/g)];
  assert.equal(recommended.length, 1);
  assert.match(recommended[0][1], /data-dl="msi"/);
  assert.doesNotMatch(recommended[0][1], /data-dl="portable"/);
  for (const kind of ['msi', 'portable', 'setup', 'cli', 'skill', 'msix', 'cer'])
    assert.match(product, new RegExp(`data-dl="${kind}"`));
});

test('published guides have the public overview, quick start and current integration limits', () => {
  const overview = read('products/threat-model-reviewer/README.md');
  assert.match(overview, /Create\/Assistant/);
  assert.match(overview, /does not patch source code/);
  assert.match(read('products/threat-model-reviewer/USER-GUIDE.md'), /## Try the sample model/);
  assert.match(read('products/threat-model-reviewer/DATA-HANDLING.md'), /3\.5 Assistant data sources \(MCP\)/);
  assert.match(read('products/threat-model-reviewer/SKILL.md'), /`azure`[\s\S]*requires Azure network access/);
});

test('all three pages contain exactly one valid structured-data block and social image', () => {
  for (const name of ['docs/index.html', 'docs/threat-model-reviewer/index.html', 'docs/threat-model-reviewer/releases/index.html']) {
    const html = read(name);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, name);
    assert.equal(JSON.parse(blocks[0][1])['@context'], 'https://schema.org');
    assert.equal([...html.matchAll(/property="og:image"/g)].length, 1, name);
  }
});
