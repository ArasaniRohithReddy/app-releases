const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const releaseData = require('../docs/release-data.js');
const { buildSnapshot } = require('./update-release-snapshot.js');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const exists = name => fs.existsSync(path.join(root, name));

// One entry per application on the hub. Shared expectations are asserted from this list, so a new
// product inherits them instead of needing its own copy of each test.
const products = [
  {
    name: 'threat-model-reviewer',
    prefix: 'threat-model-reviewer-v',
    productPage: 'docs/threat-model-reviewer/index.html',
    releasesPage: 'docs/threat-model-reviewer/releases/index.html',
    snapshot: 'docs/threat-model-reviewer/releases/releases.json',
    guides: 'products/threat-model-reviewer',
    kinds: ['msi', 'portable', 'setup', 'cli', 'skill', 'msix', 'cer'],
    recommendedKind: 'msi',
    fallback: 'https://github.com/ArasaniRohithReddy/app-releases/releases?q=threat-model-reviewer&expanded=true',
    requiredGuides: ['README.md', 'INSTALL.md', 'USER-GUIDE.md', 'FAQ.md', 'CHANGELOG.md', 'DATA-HANDLING.md']
  },
  {
    name: 'shot2code',
    prefix: 'shot2code-v',
    productPage: 'docs/shot2code/index.html',
    releasesPage: 'docs/shot2code/releases/index.html',
    snapshot: 'docs/shot2code/releases/releases.json',
    guides: 'products/shot2code',
    kinds: ['setup', 'msi', 'portable', 'checksums'],
    recommendedKind: 'setup',
    fallback: 'https://github.com/ArasaniRohithReddy/app-releases/releases?q=shot2code&expanded=true',
    requiredGuides: ['README.md', 'INSTALL.md', 'USER-GUIDE.md', 'FAQ.md', 'ARCHITECTURE.md',
      'DATA-HANDLING.md', 'RELEASING.md', 'CHANGELOG.md', 'SECURITY.md']
  }
];

const pages = ['docs/index.html', ...products.flatMap(p => [p.productPage, p.releasesPage])];
const product = read('docs/threat-model-reviewer/index.html');
const shot2code = read('docs/shot2code/index.html');
const sample = JSON.parse(read('docs/threat-model-reviewer/samples/customer-portal-review.json'));
const snapshot = JSON.parse(read('docs/threat-model-reviewer/releases/releases.json'));
const stable = releaseData.latestStable(releaseData.normalize(snapshot));
// Icon path data is full of number triples ("3.58 0 8c0 3.54 2.29"), so version scanning has to
// look at the markup a reader actually gets, not at the artwork.
const withoutArtwork = html => html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

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

test('only one download is recommended per product, and every kind is offered', () => {
  for (const entry of products) {
    const html = read(entry.productPage);
    const recommended = [...html.matchAll(/<div class="dl-card recommended">([\s\S]*?)<\/div>\s*<div class="dl-card">/g)];
    assert.equal(recommended.length, 1, entry.name);
    assert.match(recommended[0][1], new RegExp(`data-dl="${entry.recommendedKind}"`), entry.name);
    for (const kind of entry.kinds.filter(k => k !== entry.recommendedKind))
      assert.doesNotMatch(recommended[0][1], new RegExp(`data-dl="${kind}"`), `${entry.name}: ${kind}`);
    for (const kind of entry.kinds)
      assert.match(html, new RegExp(`data-dl="${kind}"`), `${entry.name}: ${kind}`);
  }
});

test('no page resolves downloads through the repository-wide latest release', () => {
  // /releases/latest returns whichever product shipped most recently, so a second application would
  // silently hand its build to the first one's download buttons. The shared loader is checked too,
  // because the pages that include it resolve their downloads through it.
  for (const name of [...pages, 'docs/release-data.js']) {
    const html = read(name);
    assert.doesNotMatch(html, /href="[^"]*\/releases\/latest"/, name);
    assert.doesNotMatch(html, /api\.github\.com\/repos\/[^"']*\/releases\/latest/, name);
    assert.doesNotMatch(html, /"downloadUrl":\s*"[^"]*\/releases\/latest"/, name);
  }
});

test('every product page falls back to its own release list without JavaScript', () => {
  for (const entry of products) {
    const html = read(entry.productPage);
    const escaped = entry.fallback.replace(/&/g, '&amp;');
    const hrefs = [...html.matchAll(/(?:id="hero-download"|data-dl="[a-z]+")[^>]*href="([^"]+)"|href="([^"]+)"[^>]*(?:id="hero-download"|data-dl="[a-z]+")/g)]
      .map(match => match[1] || match[2]);
    assert.ok(hrefs.length >= entry.kinds.length, `${entry.name}: expected static download links`);
    for (const href of hrefs) assert.equal(href, escaped, entry.name);
    // A fallback that names a version goes stale the moment the next build ships.
    assert.doesNotMatch(entry.fallback, /\d+\.\d+\.\d+/, `${entry.name}: the static fallback pins a version`);
    assert.doesNotMatch(html, /releases\/tag\//, `${entry.name}: links to a pinned release tag`);
  }
});

test('every product resolves its own releases by tag prefix', () => {
  // A page either queries the release list inline or includes the shared loader that does; both
  // must read the *list* and filter it, never the repository-wide latest release.
  const loader = read('docs/release-data.js');
  const usesLoader = html => /<script src="[^"]*release-data\.js"[^>]*>/.test(html);
  const listsReleases = html => /releases\?per_page=100/.test(html) ||
    (usesLoader(html) && loader.includes('"?per_page=100"'));
  const filtersOn = (html, prefix) => html.includes(`"${prefix}"`) ||
    (usesLoader(html) && loader.includes(`"${prefix}"`));
  for (const entry of products) {
    for (const page of [entry.productPage, entry.releasesPage]) {
      const html = read(page);
      assert.ok(listsReleases(html), `${page} does not read the release list`);
      assert.ok(filtersOn(html, entry.prefix), `${page} does not filter on ${entry.prefix}`);
    }
  }
  const portal = read('docs/index.html');
  for (const entry of products) assert.ok(filtersOn(portal, entry.prefix), `portal does not resolve ${entry.name}`);
  assert.ok(listsReleases(portal), 'the portal does not read the release list');
});

test('release snapshots are per product and carry the published assets', () => {
  for (const entry of products) {
    const snapshot = JSON.parse(read(entry.snapshot));
    assert.ok(Array.isArray(snapshot) && snapshot.length > 0, entry.name);
    for (const release of snapshot) {
      assert.ok(release.tag_name.startsWith(entry.prefix), `${entry.name}: ${release.tag_name} is another product's release`);
      assert.match(release.tag_name, new RegExp(`^${entry.prefix}\\d+\\.\\d+\\.\\d+`), `${entry.name}: ${release.tag_name}`);
      assert.ok(Array.isArray(release.assets), entry.name);
    }
    const sorted = [...snapshot].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    assert.equal(snapshot[0].tag_name, sorted[0].tag_name, `${entry.name}: snapshot is not newest-first`);
  }
  // Shape, not version: the snapshot is regenerated by the workflow on every release, so pinning a
  // version here would fail the next build instead of catching a real problem.
  const latest = JSON.parse(read('docs/shot2code/releases/releases.json'))[0];
  const version = latest.tag_name.replace('shot2code-v', '');
  for (const pattern of [
    /^SHA256SUMS/,
    new RegExp(`^shot2code-${version.replace(/\./g, '\\.')}-x64\\.exe$`),
    new RegExp(`^shot2code-${version.replace(/\./g, '\\.')}-x64\\.msi$`),
    new RegExp(`^shot2code-${version.replace(/\./g, '\\.')}-x64\\.zip$`)
  ]) assert.ok(latest.assets.some(a => pattern.test(a.name)), `shot2code is missing an asset matching ${pattern}`);
  // Updater inputs may be attached to a release, but they are not hub downloads.
  assert.ok(latest.assets.every(a => a.browser_download_url.includes(latest.tag_name)));
});

test('the snapshot workflow regenerates every product', () => {
  const workflow = read('.github/workflows/update-releases-snapshot.yml');
  for (const entry of products)
    assert.match(workflow, new RegExp(`\\["${entry.prefix}"\\]="${entry.snapshot}"`), entry.name);
});

test('published guides have the public overview, quick start and current integration limits', () => {
  const overview = read('products/threat-model-reviewer/README.md');
  assert.match(overview, /Create\/Assistant/);
  assert.match(overview, /does not patch source code/);
  assert.match(read('products/threat-model-reviewer/USER-GUIDE.md'), /## Try the sample model/);
  assert.match(read('products/threat-model-reviewer/DATA-HANDLING.md'), /3\.5 Assistant data sources \(MCP\)/);
  assert.match(read('products/threat-model-reviewer/SKILL.md'), /`azure`[\s\S]*requires Azure network access/);
});

test('stable generation success is separate from the generated model readiness verdict', () => {
  for (const name of ['products/threat-model-reviewer/USER-GUIDE.md', 'products/threat-model-reviewer/CLI.md']) {
    const guide = read(name).replace(/[*`]/g, '').replace(/\s+/g, ' ');
    assert.match(guide, /For generate, exit 0 means generation succeeded/, name);
    assert.match(guide, /does not establish a readiness verdict/, name);
    assert.match(guide, /Run a separate review.*actual verdict, score and findings/, name);
    assert.match(guide, /ThreatModelReviewer\.Cli\.exe "model\.tm7"/, name);
    assert.doesNotMatch(guide, /structurally complete, so it passes the readiness gate/, name);
  }
  for (const name of ['README.md', 'products/threat-model-reviewer/README.md'])
    assert.doesNotMatch(read(name), /structurally complete, so it passes the readiness gate/, name);
});

test('stable SARIF copy distinguishes local output from a separately configured upload', () => {
  const cli = read('products/threat-model-reviewer/CLI.md').replace(/[*`]/g, '').replace(/\s+/g, ' ');
  assert.match(cli, /--sarif writes a local SARIF file/);
  assert.match(cli, /does not upload findings or transmit them automatically/);
  assert.match(cli, /separate upload-sarif step publishes/);
  assert.match(cli, /only if that step runs successfully/);
  const page = product.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.match(page, /--sarif writes a local file; upload to code scanning is a separate workflow/);
  assert.match(product, /<span class="kbd" style="white-space:nowrap">--sarif<\/span>/);
  assert.doesNotMatch(page, /SARIF uploads to code scanning/);
});

test('stable enterprise MSI examples uninstall the deployed package, never its UpgradeCode', () => {
  const guide = read('products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md');
  const installer = 'ThreatModelReviewer-v2.5.1-x64.msi';
  assert.ok(snapshot.find(r => r.tag_name === 'threat-model-reviewer-v2.5.1').assets.some(a => a.name === installer));
  const uninstalls = [...guide.matchAll(/^\s*msiexec\s+\/x\s+("[^"]+"|\S+).*$/gmi)];
  assert.equal(uninstalls.length, 3, 'Silent install, Intune and removal examples must all be checked');
  for (const [, target] of uninstalls) assert.equal(target, `"${installer}"`);
  assert.match(guide, /Applies to Threat Model Reviewer v2\.5\.1\b/);
  const versions = [...guide.matchAll(/ThreatModelReviewer-v(\d+\.\d+\.\d+)-/g)].map(m => m[1]);
  assert.deepEqual([...new Set(versions)], ['2.5.1']);
  assert.doesNotMatch(guide, /v2\.1\.2\b|\bINSTALLFOLDER\b/);
  assert.match(guide, /`APPLICATIONFOLDER="<path>"`/);
  const plain = guide.replace(/^>\s?/gm, '').replace(/[*`]/g, '').replace(/\s+/g, ' ');
  assert.match(plain, /MSI ProductCode \| Version-specific/);
  assert.match(plain, /UpgradeCode identifies the upgrade family/);
  assert.match(plain, /Never pass UpgradeCode to msiexec \/x/);
  assert.match(plain, /ProductCode from the MSI being deployed \(not UpgradeCode\)/);
});

test('stable enterprise signing and MSIX trust guidance keeps package and policy boundaries', () => {
  const guide = read('products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md');
  const plain = guide.replace(/^>\s?/gm, '').replace(/[*`]/g, '').replace(/\s+/g, ' ');
  assert.match(plain, /desktop app and CLI are self-contained/i);
  assert.match(plain, /skill bundle requires the CLI/i);
  assert.match(plain, /ZIP containers and skill files are not/);
  assert.doesNotMatch(plain, /All packages are self-contained|All are Authenticode-signed/i);
  assert.doesNotMatch(plain, /do not surface the interactive SmartScreen prompt|will require no change on the client/);
  const trust = guide.split('## 6. Signing, SmartScreen and trust')[1].split('## 7.')[0];
  assert.match(trust, /\[INSTALL\.md\]\(INSTALL\.md\)/);
  assert.match(plain, /Local Machine → Trusted People/);
  assert.match(plain, /Trusted Publishers alone does not establish certificate-chain trust/);
  assert.match(plain, /do not guarantee that SmartScreen or policy warnings disappear/);
  assert.match(plain, /organization's software policy/);
  assert.doesNotMatch(guide, /ThreatModelReviewer\.Cli\.exe\s+(?:fleet|mcp)\b|^#{1,6}.*UNRELEASED.*MCP/im);
});

test('every product ships the guides its pages link to', () => {
  for (const entry of products)
    for (const guide of entry.requiredGuides)
      assert.ok(exists(`${entry.guides}/${guide}`), `${entry.guides}/${guide} is missing`);
});

test('the shot2code guides describe the shipped build', () => {
  const guide = read('products/shot2code/USER-GUIDE.md');
  assert.match(guide, /## Choosing a model provider/);
  assert.match(guide, /## Exporting a project/);
  assert.match(guide, /Separate pages[\s\S]*Responsive views[\s\S]*UI states[\s\S]*Supporting references/);
  assert.match(guide, /Ctrl\+Alt\+E/);

  const install = read('products/shot2code/INSTALL.md');
  assert.match(install, /not \*\*code-signed\*\*|\*\*not code-signed\*\*/);
  // The example names a placeholder, not a release that will age out of the guide.
  assert.match(install, /Get-FileHash \.\\shot2code-<version>-x64\.exe -Algorithm SHA256/);
  assert.doesNotMatch(install, /shot2code-\d+\.\d+\.\d+-x64/);
  assert.match(install, /%LOCALAPPDATA%\\shot2code\\history\.sqlite3/);

  const data = read('products/shot2code/DATA-HANDLING.md');
  assert.match(data, /no analytics or telemetry SDK/i);
  assert.match(data, /Imported projects are never executed|never executed/i);

  const security = read('products/shot2code/SECURITY.md');
  assert.match(security, /not code-signed/);
  assert.match(security, /security\/advisories\/new/);
  // Support is expressed as "the newest published release", so it stays true across releases.
  assert.doesNotMatch(security, /\d+\.\d+\.\d+ *\| *✅/);

  const changelog = read('products/shot2code/CHANGELOG.md');
  assert.match(changelog, /## \[\d+\.\d+\.\d+\] — \d{4}-\d{2}-\d{2}/);
  assert.match(changelog, /could start a second installer/);

  // The hub documents the product; it does not re-host the source.
  for (const name of ['README.md', 'INSTALL.md', 'USER-GUIDE.md', 'FAQ.md', 'ARCHITECTURE.md', 'DATA-HANDLING.md', 'RELEASING.md', 'SECURITY.md'])
    assert.match(read(`products/shot2code/${name}`), /ArasaniRohithReddy\/(shot2code|app-releases)/, name);
});

test('the shot2code page states the platform, the provider requirement and the signing status', () => {
  assert.match(shot2code, /Windows 10\/11 · x64/);
  assert.match(shot2code, /not code-signed/);
  assert.match(shot2code, /SmartScreen|Windows protected your PC/);
  assert.match(shot2code, /GitHub Copilot/);
  assert.match(shot2code, /Gemini, Anthropic, OpenAI/);
  assert.match(shot2code, /SQLite|%LOCALAPPDATA%\\shot2code/);
  assert.match(shot2code, /Twelve output stacks/);
  assert.match(shot2code, /opaque-origin sandbox/);
  assert.match(shot2code, /Ctrl\+\/|Ctrl\+Alt/);
  assert.match(shot2code, /Restart &amp; install|Restart & install/);
  assert.match(shot2code, /SHA256SUMS/);
  // Twelve stacks, listed rather than claimed.
  assert.equal([...shot2code.matchAll(/<li><span class="tick"/g)].length, 12);
  // No borrowed claims from the other product on the hub.
  assert.doesNotMatch(shot2code, /Authenticode|deterministic (verdict|checks)|threat model/i);
});

test('no page hard-codes a release version that the release feed should supply', () => {
  // A published build can be superseded at any time; a version baked into markup cannot follow it.
  // The portal and the shot2code page resolve every version they show. (The Threat Model Reviewer
  // page still carries its published version statically — pre-existing, and left alone here.)
  for (const name of ['docs/index.html', 'docs/shot2code/index.html']) {
    const html = read(name);
    assert.doesNotMatch(withoutArtwork(html), /\bv?\d+\.\d+\.\d+\b/, `${name}: a version is hard-coded into the page`);
  }
  const structured = JSON.parse(shot2code.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(structured.softwareVersion, undefined, 'shot2code: structured data declares a static version');
  assert.doesNotMatch(structured.downloadUrl, /\d+\.\d+\.\d+/, 'shot2code: structured data pins a download');
  // Both version chips and the verification command are filled in from the resolved release.
  assert.match(shot2code, /id="version-chip">latest</);
  assert.match(shot2code, /id="version-chip-2">latest</);
  assert.match(shot2code, /id="verify-command">Get-FileHash \.\\shot2code-&lt;version&gt;-x64\.exe/);
  assert.match(shot2code, /id="structured-data"/);
  assert.match(shot2code, /data\.softwareVersion = version/);
});

test('shot2code screenshots are published with the page', () => {
  const images = [...shot2code.matchAll(/<img src="(img\/[^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(images).size, 4);
  for (const image of new Set(images)) assert.ok(exists(`docs/shot2code/${image}`), image);
  for (const match of shot2code.matchAll(/<img[^>]*>/g)) assert.match(match[0], /alt="[^"]{25,}"/);
});

test('the hub portal and README present every product', () => {
  const portal = read('docs/index.html');
  const readme = read('README.md');
  for (const entry of products) {
    assert.match(portal, new RegExp(`href="\\./${entry.name}/"`), `portal: ${entry.name}`);
    assert.match(readme, new RegExp(`products/${entry.name}/INSTALL\\.md`), `README: ${entry.name}`);
  }
  // The hub is not a single-product site any more, so its shared copy must not speak for one app.
  assert.doesNotMatch(portal, /Start with Threat Model Reviewer/);
  const jsonLd = JSON.parse(portal.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(jsonLd.hasPart.map(part => part.name), ['Threat Model Reviewer', 'shot2code']);
});

test('issue templates cover every product', () => {
  for (const template of ['bug_report.yml', 'feature_request.yml']) {
    const text = read(`.github/ISSUE_TEMPLATE/${template}`);
    for (const entry of products.map(p => p.name === 'shot2code' ? 'shot2code' : 'Threat Model Reviewer'))
      assert.match(text, new RegExp(`- ${entry}`), `${template}: ${entry}`);
  }
  const bug = read('.github/ISSUE_TEMPLATE/bug_report.yml');
  // The secret warning must stay at least as strong while covering more than threat models.
  assert.match(bug, /no API keys or tokens/i);
  assert.match(bug, /threat.model/i);
  assert.match(bug, /- Installer \(MSI\)/);
  assert.match(bug, /NSIS \.exe/);
});

test('all published pages contain exactly one valid structured-data block and social image', () => {
  for (const name of pages) {
    const html = read(name);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, name);
    assert.equal(JSON.parse(blocks[0][1])['@context'], 'https://schema.org');
    assert.equal([...html.matchAll(/property="og:image"/g)].length, 1, name);
    assert.match(html, /<link rel="canonical" href="https:\/\/arasanirohithreddy\.github\.io\/app-releases\/[^"]*" \/>/, name);
  }
});

test('current copy distinguishes signing, private reports and released command surfaces', () => {
  const portal = read(pages[0]);
  const releases = read(pages[2]);
  assert.doesNotMatch(releases, /All packages are self-contained and Authenticode-signed/i);
  assert.match(releases, /separate skill needs the CLI/);
  assert.doesNotMatch(portal, /vulnerability reports all go to this public/i);
  assert.match(portal, /security\/advisories\/new">Report vulnerabilities privately/);
  for (const name of [...pages, 'README.md'])
    assert.doesNotMatch(read(name), /ThreatModelReviewer\.Cli\.exe\s+(?:fleet|mcp)\b/i, name);
});

test('static software metadata and no-JavaScript downloads refer to the same published version', () => {
  const metadata = JSON.parse(product.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const release = snapshot.find(r => r.tag_name === releaseData.PREFIX + metadata.softwareVersion);
  assert.ok(release && !release.prerelease, 'Structured data must describe a published stable release');
  // The published version is still declared, but every link without JavaScript resolves this
  // product's release list instead of pinning that version's tag, so a newer build cannot leave
  // the static markup handing out a superseded download.
  const resilient = products.find(entry => entry.name === 'threat-model-reviewer').fallback;
  assert.equal(metadata.downloadUrl, resilient);
  assert.doesNotMatch(metadata.downloadUrl, /\/releases\/tag\//);
  assert.ok(releaseData.releaseUrl(release).endsWith(release.tag_name), 'Tag links stay resolvable for the live refresh');
  for (const match of product.matchAll(/<a[^>]+(?:id="hero-download"|data-dl="[^"]+")[^>]+href="([^"]+)"/g))
    assert.equal(match[1], resilient.replace(/&/g, '&amp;'));
});

test('page metadata, local assets and mapped public documentation links resolve', () => {
  const base = 'https://arasanirohithreddy.github.io/app-releases/';
  const github = 'https://github.com/ArasaniRohithReddy/app-releases/blob/main/';
  for (const name of pages) {
    const html = read(name);
    const url = base + name.slice('docs/'.length).replace(/index\.html$/, '');
    assert.ok(html.includes(`<link rel="canonical" href="${url}"`), name);
    assert.ok(html.includes(`<meta property="og:url" content="${url}"`), name);
    const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, match => match.startsWith('<script src=') ? match : '');
    for (const [, attribute, href] of markup.matchAll(/(href|src|content)="([^"]+)"/g)) {
      if (attribute === 'content' && !/^https?:/.test(href)) continue;
      if (!/^(?:https?:|\.{0,2}\/|#|img\/|samples\/)/.test(href)) continue;
      const link = new URL(href, url);
      let local;
      if (link.href.startsWith(github)) local = decodeURIComponent(link.pathname.slice('/ArasaniRohithReddy/app-releases/blob/main/'.length));
      else if (link.origin === new URL(base).origin && link.pathname.startsWith('/app-releases/')) {
        local = 'docs/' + decodeURIComponent(link.pathname.slice('/app-releases/'.length));
        if (local.endsWith('/')) local += 'index.html';
      }
      if (!local) continue;
      assert.ok(fs.existsSync(path.join(root, local)), `${name}: missing ${href}`);
      if (link.hash && local.endsWith('.html'))
        assert.ok(read(local).includes(`id="${decodeURIComponent(link.hash.slice(1))}"`), `${name}: missing anchor ${href}`);
      if (link.hash && local.endsWith('.md')) {
        const headings = [...read(local).matchAll(/^#{1,6}\s+(.+)$/gm)].map(m =>
          m[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-'));
        assert.ok(headings.includes(decodeURIComponent(link.hash.slice(1))), `${name}: missing guide anchor ${href}`);
      }
    }
  }
  const png = fs.readFileSync(path.join(root, 'docs/img/social-card.png'));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  for (const [, href] of read('README.md').matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(href)) continue;
    assert.ok(fs.existsSync(path.join(root, href.split('#')[0])), `README.md: missing ${href}`);
  }
});

test('all snapshot packages classify without conflating desktop, CLI or skill ZIPs', () => {
  assert.deepEqual(releaseData.normalize(snapshot), snapshot);
  const before = JSON.stringify(snapshot);
  for (const release of snapshot)
    for (const asset of release.assets) assert.ok(releaseData.kindOf(asset.name), asset.name);
  const kinds = stable.assets.map(a => releaseData.kindOf(a.name)).sort();
  assert.deepEqual(kinds, ['cer', 'cli', 'msi', 'msix', 'portable', 'setup', 'skill']);
  assert.equal(releaseData.kindOf('unknown-client.zip'), null);
  assert.equal(releaseData.kindOf('unknown-tool.exe'), null);
  assert.equal(releaseData.kindOf(null), null);
  assert.equal(JSON.stringify(snapshot), before, 'Classification must not mutate the generated snapshot');
});

test('malformed, draft and other-product data cannot become a stable download', () => {
  for (const json of [null, {}, [], [null], [{ ...stable, tag_name: 42 }], [{ ...stable, assets: {} }],
    [{ ...stable, draft: true }], [{ ...stable, prerelease: 'false' }], [{ ...stable, published_at: 'invalid' }],
    [{ ...stable, tag_name: 'other-app-v9.9.9' }], [{ ...stable, assets: [{ ...stable.assets[0], browser_download_url: 'javascript:void(0)' }] }]]) {
    assert.throws(() => releaseData.normalize(json), /release/i);
  }
  const preview = { ...stable, tag_name: releaseData.PREFIX + '9.9.9-preview', prerelease: true, published_at: '2099-01-01T00:00:00Z', assets: [] };
  const rels = releaseData.normalize([null, preview, ...snapshot]);
  assert.ok(rels.includes(preview), 'Pre-releases remain in the history');
  assert.equal(releaseData.latestStable(rels).tag_name, stable.tag_name);
  assert.equal(releaseData.latestStable([preview]), undefined);
});

test('a partial refresh keeps every saved release, asset and historical note', () => {
  const before = JSON.stringify(snapshot);
  const refresh = { ...stable, body_html: '', assets: [{ ...stable.assets[0], download_count: 123 }] };
  const merged = releaseData.merge(snapshot, [refresh]);
  assert.equal(merged.length, snapshot.length);
  assert.equal(merged.flatMap(r => r.assets).length, snapshot.flatMap(r => r.assets).length);
  assert.equal(merged[0].assets[0].download_count, 123);
  for (const saved of snapshot) {
    const current = merged.find(r => r.tag_name === saved.tag_name);
    assert.equal(current.body_html, saved.body_html, saved.tag_name);
    assert.deepEqual(current.assets.map(a => a.browser_download_url).sort(), saved.assets.map(a => a.browser_download_url).sort());
  }
  assert.equal(JSON.stringify(snapshot), before);
});

const response = (json, options = {}) => new Response(JSON.stringify(json), options);

test('loader renders the snapshot first and follows live pagination without losing history', async () => {
  const calls = [], sources = [];
  const extra = { ...stable, tag_name: releaseData.PREFIX + '9.9.9-preview', prerelease: true, assets: [] };
  const next = 'https://api.github.com/repos/ArasaniRohithReddy/app-releases/releases?per_page=100&page=2';
  const result = await releaseData.load('/snapshot', (rels, source) => sources.push([source, rels.length]), assert.fail, {
    fetch: async url => {
      calls.push(url);
      if (url === '/snapshot') return response(snapshot);
      if (url === next) return response([extra]);
      return response([stable], { headers: { link: `<${next}>; rel="next"` } });
    }
  });
  assert.equal(calls.length, 3);
  assert.deepEqual(sources, [['snapshot', snapshot.length], ['live', snapshot.length + 1]]);
  assert.equal(result.flatMap(r => r.assets).length, snapshot.flatMap(r => r.assets).length);
});

test('403, unavailable, malformed or empty live data leaves the same-origin snapshot usable', async () => {
  const failures = [
    () => response({}, { status: 403 }), () => response({}, { status: 503 }),
    () => { throw new Error('Offline'); }, () => new Response('not JSON'),
    () => response({ message: 'unexpected shape' }), () => response([]), () => response([null])
  ];
  for (const fail of failures) {
    const sources = [];
    const result = await releaseData.load('/snapshot', (_, source) => sources.push(source), assert.fail, {
      fetch: async url => url === '/snapshot' ? response(snapshot) : fail()
    });
    assert.deepEqual(result, snapshot);
    assert.deepEqual(sources, ['snapshot']);
  }
});

test('invalid snapshots recover through live data, or produce a terminal GitHub fallback', async () => {
  for (const invalid of [[], {}, null, [null]]) {
    const sources = [];
    const recovered = await releaseData.load('/snapshot', (_, source) => sources.push(source), assert.fail, {
      fetch: async url => response(url === '/snapshot' ? invalid : snapshot)
    });
    assert.deepEqual(recovered, snapshot);
    assert.deepEqual(sources, ['live']);
    const errors = [];
    assert.deepEqual(await releaseData.load('/snapshot', assert.fail, error => errors.push(error), {
      fetch: async () => response(invalid)
    }), []);
    assert.equal(errors.length, 1);
  }
});

test('stalled requests time out and invalid pagination never follows a different origin', async () => {
  let aborted = 0, error;
  await releaseData.load('/snapshot', assert.fail, e => error = e, {
    timeout: 1,
    fetch: (_, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => { aborted++; reject(new Error('Request timed out')); }, { once: true });
    })
  });
  assert.equal(aborted, 2);
  assert.match(error.message, /timed out/);
  const calls = [];
  const result = await releaseData.load('/snapshot', () => {}, assert.fail, {
    fetch: async url => {
      calls.push(url);
      return response(url === '/snapshot' ? snapshot : [stable], {
        headers: { link: '<https://example.invalid/releases?page=2>; rel="next"' }
      });
    }
  });
  assert.equal(calls.length, 2);
  assert.deepEqual(result, snapshot);
});

test('snapshot generation consumes all API pages without changing the existing schema or history', () => {
  const otherProducts = Array.from({ length: 100 }, (_, i) => ({ tag_name: `other-app-v1.0.${i}`, draft: false }));
  const api = snapshot.map(r => ({ ...r, draft: false, author: { login: 'not-part-of-the-snapshot' } }));
  const before = JSON.stringify(snapshot);
  assert.deepEqual(buildSnapshot(snapshot, [otherProducts, api]), snapshot);
  assert.deepEqual(buildSnapshot([], [otherProducts, api]), snapshot, 'Product releases on page two must not be missed');
  assert.equal(JSON.stringify(snapshot), before, 'The saved fixture must not be mutated');
});

test('snapshot generation preserves absent releases, assets and notes during partial refreshes', () => {
  const partial = { ...stable, body_html: '', body: 'Ignored raw API body', assets: [{ ...stable.assets[0], download_count: 123 }] };
  const result = buildSnapshot(snapshot, [[partial]]);
  assert.equal(result.length, snapshot.length);
  assert.equal(result.flatMap(r => r.assets).length, snapshot.flatMap(r => r.assets).length);
  for (const old of snapshot) {
    const saved = result.find(r => r.tag_name === old.tag_name);
    assert.equal(saved.body_html, old.body_html, old.tag_name);
    assert.deepEqual(saved.assets.map(a => a.browser_download_url), old.assets.map(a => a.browser_download_url));
    assert.equal(Object.hasOwn(saved, 'body'), false);
  }
  assert.equal(result.find(r => r.tag_name === stable.tag_name).assets[0].download_count, 123);
});

test('snapshot generation rejects malformed or empty API data instead of replacing saved history', () => {
  for (const pages of [null, {}, [], [null], [{}], [[]], [[null]], snapshot,
    [[{ ...stable, assets: {} }]], [[{ ...stable, body_html: undefined }]],
    [[{ ...stable, assets: [{ ...stable.assets[0], download_count: -1 }] }]]])
    assert.throws(() => buildSnapshot(snapshot, pages));
  assert.throws(() => buildSnapshot([null], [[stable]]));
});

test('snapshot CLI updates valid candidates and leaves an existing file intact on bad input', () => {
  const evidence = path.join(root, 'test-results');
  fs.mkdirSync(evidence, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(evidence, 'snapshot-test-'));
  const file = path.join(temporary, 'releases.json');
  const original = JSON.stringify(snapshot) + '\n';
  try {
    fs.writeFileSync(file, original);
    const script = path.join(root, 'scripts/update-release-snapshot.js');
    const bad = spawnSync(process.execPath, [script, file], { input: '[[]]', encoding: 'utf8' });
    assert.equal(bad.status, 1);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    const good = spawnSync(process.execPath, [script, file], { input: JSON.stringify([snapshot]), encoding: 'utf8' });
    assert.equal(good.status, 0, good.stderr);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    const update = [[{ ...stable, assets: [{ ...stable.assets[0], download_count: 123 }] }]];
    const changed = spawnSync(process.execPath, [script, file], { input: JSON.stringify(update), encoding: 'utf8' });
    assert.equal(changed.status, 0, changed.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), buildSnapshot(snapshot, update));
    assert.equal(fs.existsSync(file + '.tmp'), false);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('Pages deployment consumes only its successful check job and SHA-specific artifact', () => {
  const workflow = read('.github/workflows/site-checks.yml');
  const deploy = workflow.split('\n  deploy:')[1];
  assert.ok(deploy, 'Deployment must be part of the validation workflow');
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  const checks = workflow.indexOf('- run: npm test');
  const archive = workflow.indexOf('git archive "${GITHUB_SHA}:docs"');
  const upload = workflow.indexOf('uses: actions/upload-pages-artifact@v3');
  assert.ok(checks >= 0 && checks < archive && archive < upload, 'Check the committed tree before archiving/uploading it');
  assert.match(workflow, /git status --porcelain --untracked-files=all --ignored -- docs/);
  assert.match(workflow, /name: github-pages-\$\{\{ github\.sha \}\}/);
  assert.match(deploy, /needs: check/);
  assert.match(deploy, /needs\.check\.result == 'success'/);
  assert.match(deploy, /artifact_name: github-pages-\$\{\{ github\.sha \}\}/);
  assert.match(deploy, /"\$main_sha" != "\$GITHUB_SHA"/);
  assert.ok(deploy.indexOf('"$main_sha" != "$GITHUB_SHA"') < deploy.indexOf('uses: actions/deploy-pages@v4'));
  assert.doesNotMatch(workflow, /workflow_run:|pull_request_target:|continue-on-error:/);
});

test('Pages deploy is opt-in, main-only and cannot silently enable legacy Pages', () => {
  const workflow = read('.github/workflows/site-checks.yml');
  const deploy = workflow.split('\n  deploy:')[1];
  for (const guard of [
    "github.repository == 'ArasaniRohithReddy/app-releases'",
    "github.ref == 'refs/heads/main'",
    "github.event_name != 'pull_request'",
    "vars.PAGES_DEPLOY_ENABLED == 'true'"
  ]) assert.equal(workflow.split(guard).length - 1, 3, `Stage, upload and deploy must all enforce: ${guard}`);
  assert.match(deploy, /pages: write/);
  assert.match(deploy, /id-token: write/);
  assert.match(deploy, /name: github-pages/);
  assert.match(deploy, /"\$build_type" != "workflow"/);
  assert.match(deploy, /enablement: false/);
  assert.doesNotMatch(workflow.split('\n  deploy:')[0], /pages: write|id-token: write/);
  assert.match(workflow, /push:\s+branches: \[main\]\s+workflow_dispatch:/);
});

test('snapshot workflow validates before push and explicitly dispatches checks even on no change', () => {
  const workflow = read('.github/workflows/update-releases-snapshot.yml');
  assert.match(workflow, /--paginate --slurp/);
  assert.match(workflow, /node scripts\/update-release-snapshot\.js/);
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/);
  assert.doesNotMatch(workflow, /\[skip ci\]|\[ci skip\]|git add -A|git push[^\n]*--force|git pull[^\n]*--rebase/i);
  const commit = workflow.indexOf('git commit -m');
  const validate = workflow.indexOf('run: npm test');
  const push = workflow.indexOf('git push origin');
  const dispatch = workflow.indexOf('gh workflow run site-checks.yml');
  assert.ok(commit >= 0 && commit < validate && validate < push && push < dispatch);
  const dispatchStep = workflow.slice(workflow.indexOf('- name: Dispatch same-SHA'));
  assert.doesNotMatch(dispatchStep, /\n\s+if:/, 'No-change refreshes must retry a previously missed dispatch');
  assert.match(dispatchStep, /--ref "\$\{\{ github\.event\.repository\.default_branch \}\}"/);
});

test('quota-blocked Pages migration retains legacy publication and has an explicit configuration rollback', () => {
  const plan = read('scripts/PAGES-DEPLOYMENT.md');
  const plain = plan.replace(/[*`]/g, '').replace(/\s+/g, ' ');
  assert.match(plain, /Keep Pages at build_type: legacy, source main:\/docs/);
  assert.match(plain, /PAGES_DEPLOY_ENABLED=false/);
  assert.match(plain, /before updating the publishing branch.*does not require an Actions artifact upload/);
  assert.match(plain, /GitHub Releases uploads are unaffected.*not proof/);
  assert.match(plain, /A successful upload is not a successful Pages deployment/);
  assert.match(plain, /does not implement or run an upload-only probe/);
  assert.doesNotMatch(plain, /Prefer changing the Pages source before merging|Keep Pages workflow-backed/);
  const rollback = plan.split('## Explicit rollback to the prior Pages configuration')[1];
  assert.ok(rollback, 'A source-only Actions rollback cannot recover from an artifact-quota blocker');
  const state = JSON.parse(rollback.match(/```json\s+([\s\S]*?)```/)[1]);
  assert.deepEqual(state, {
    build_type: 'legacy', source: { branch: 'main', path: '/docs' },
    https_enforced: true, cname: null
  });
  assert.match(plain, /restore Deploy from a branch.*main.*\/docs/);
  assert.match(plain, /Restoring the configuration does not pin the prior deployed SHA/);
  assert.match(plain, /ungated legacy publisher/);
  assert.match(plain, /No cleanup job, retention shortening of existing artifacts, or deletion/);
  assert.doesNotMatch(read('.github/workflows/update-releases-snapshot.yml'),
    /uses:\s*actions\/(?:upload(?:-pages)?-artifact|deploy-pages)@/,
    'The pre-push snapshot safeguard must not depend on artifact upload');
});
