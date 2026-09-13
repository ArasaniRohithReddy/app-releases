const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const releaseData = require('../docs/release-data.js');
const { buildSnapshot } = require('./update-release-snapshot.js');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const product = read('docs/threat-model-reviewer/index.html');
const sample = JSON.parse(read('docs/threat-model-reviewer/samples/customer-portal-review.json'));
const snapshot = JSON.parse(read('docs/threat-model-reviewer/releases/releases.json'));
const stable = releaseData.latestStable(releaseData.normalize(snapshot));
const pages = ['docs/index.html', 'docs/threat-model-reviewer/index.html', 'docs/threat-model-reviewer/releases/index.html'];

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

test('all three pages contain exactly one valid structured-data block and social image', () => {
  for (const name of pages) {
    const html = read(name);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, name);
    assert.equal(JSON.parse(blocks[0][1])['@context'], 'https://schema.org');
    assert.equal([...html.matchAll(/property="og:image"/g)].length, 1, name);
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
  assert.equal(metadata.downloadUrl, releaseData.releaseUrl(release));
  for (const match of product.matchAll(/<a[^>]+(?:id="hero-download"|data-dl="[^"]+")[^>]+href="([^"]+)"/g))
    assert.equal(match[1], metadata.downloadUrl);
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
