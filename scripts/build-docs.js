// Build only the explicitly approved, public repository sources. No runtime Markdown/API fetch.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const MarkdownIt = require('markdown-it');
const manifest = require('./docs/manifest.json');

const ROOT = path.resolve(__dirname, '..');
const normalize = text => text.replace(/\r\n?/g, '\n');
const escape = value => String(value).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const parser = new MarkdownIt({ html: false, linkify: false, typographer: false });

const PRODUCT_DOCS = {
  'products/threat-model-reviewer/': {
    id: 'threat-model-reviewer',
    name: 'Threat Model Reviewer'
  },
  'products/shot2code/': {
    id: 'shot2code',
    name: 'shot2code'
  }
};

function productFor(entry) {
  for (const [prefix, product] of Object.entries(PRODUCT_DOCS))
    if (entry.source.startsWith(prefix)) return product;
  return { id: '', name: 'App Releases' };
}

function safeUrl(value) {
  try {
    const decoded = parser.utils.unescapeAll(String(value));
    if (/[\u0000-\u0020\u007f\\]/.test(decoded) || decoded.startsWith('//')) return false;
    const expanded = decodeURIComponent(decoded);
    if (/[\u0000-\u001f\u007f\\]/.test(expanded)) return false;
    const scheme = expanded.trim().match(/^([a-z][a-z0-9+.-]*):/i);
    if (scheme && !['http', 'https', 'mailto'].includes(scheme[1].toLowerCase())) return false;
    const url = new URL(decoded, 'https://public-docs.invalid/');
    return ['https:', 'http:', 'mailto:'].includes(url.protocol);
  } catch { return false; }
}
parser.validateLink = safeUrl;

function inlineText(token) {
  if (!token) return '';
  if (token.children) return token.children.map(inlineText).join('');
  if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
  if (['text', 'code_inline', 'image'].includes(token.type)) return token.content;
  return '';
}

function slug(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, '').replace(/\s/g, '-');
}

function assertStableSource(entry, text) {
  const tokens = parser.parse(text, {});
  let quoteDepth = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'blockquote_open') quoteDepth++;
    if (tokens[i].type === 'blockquote_close') quoteDepth--;
    if (tokens[i].type !== 'inline') continue;
    const prose = inlineText(tokens[i]).trim();
    if (/^(?:(?:documentation|publication)[ _-]channel|channel)\s*:\s*(?:development|preview|unreleased)\b/i.test(prose))
      throw new Error(`${entry.source}: development-channel source is not publishable here`);
    const availability = /\b(?:unreleased|development[- ](?:only|channel|preview)|preview[- ]only)\b/i.test(prose);
    const labelled = /^(?:development[- ](?:only|channel|preview)|preview[- ]only|unreleased|current (?:desktop )?source builds|source[- ]only)\b/i.test(prose);
    if (!entry.history && availability && (labelled || quoteDepth > 0 || tokens[i - 1]?.type === 'heading_open'))
      throw new Error(`${entry.source}: explicitly unreleased/development guide refused`);
    if (!entry.history && /^source[- ]only\b.*\bdevelopment\b/i.test(prose))
      throw new Error(`${entry.source}: explicitly unreleased/development guide refused`);
  }
}

function validateManifest(catalog) {
  if (catalog.channel !== 'stable-public') throw new Error('Only stable-public documentation may be generated.');
  const sources = new Set(), routes = new Set();
  const shared = new Set(['SECURITY.md', 'SUPPORT.md', 'LICENSE', 'CODE_OF_CONDUCT.md']);
  for (const entry of catalog.documents) {
    if (!(shared.has(entry.source) || /^products\/(?:threat-model-reviewer|shot2code)\/(?:[A-Z-]+\.md|LICENSE)$/.test(entry.source)))
      throw new Error(`Source outside the approved public roots: ${entry.source}`);
    if (!/^\/(?:(?:threat-model-reviewer|shot2code)\/docs|help)\/(?:[a-z0-9-]+\/)*$/.test(entry.route))
      throw new Error(`Invalid documentation route: ${entry.route}`);
    if (sources.has(entry.source) || routes.has(entry.route)) throw new Error('Duplicate documentation source or route.');
    if (entry.history && !/^products\/(?:threat-model-reviewer|shot2code)\/CHANGELOG\.md$/.test(entry.source))
      throw new Error('Only a public product changelog may contain labelled unreleased history.');
    sources.add(entry.source); routes.add(entry.route);
  }
  for (const [alias, source] of Object.entries(catalog.legacyLinks || {})) {
    if (!alias.startsWith('/' + catalog.repository + '/blob/') || !sources.has(source))
      throw new Error('Historical link aliases must target an approved public document.');
  }
}

function prepareDocument(entry, source) {
  const text = normalize(source);
  assertStableSource(entry, text);
  const tokens = parser.parse(text, {});
  const used = new Set(['main', 'doc-top', 'theme-toggle', 'guide-navigation', 'doc-toc']);
  const counts = new Map(), sourceIds = new Set(), fragments = new Map(), headings = [];
  let title = entry.label, titleId = '', firstHeading = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'heading_open') continue;
    const content = inlineText(tokens[i + 1]).trim();
    const base = slug(content);
    let n = counts.get(base) || 0;
    let sourceId = n ? `${base}-${n}` : base;
    while (sourceIds.has(sourceId)) sourceId = `${base}-${++n}`;
    counts.set(base, n);
    sourceIds.add(sourceId);
    let id = sourceId || 'section';
    while (used.has(id)) id = 'section-' + id;
    used.add(id);
    fragments.set(sourceId, id);
    token.attrSet('id', id);
    token.attrSet('tabindex', '-1');
    let level = Number(token.tag.slice(1));
    if (level === 1 && firstHeading < 0) {
      title = content; titleId = id; firstHeading = i;
    } else {
      if (level === 1) { token.tag = 'h2'; tokens[i + 2].tag = 'h2'; level = 2; }
      headings.push({ id, text: content, level });
    }
  }
  if (firstHeading >= 0) tokens.splice(firstHeading, 3);
  if (!titleId) {
    titleId = slug(title) || 'document';
    while (used.has(titleId)) titleId = 'section-' + titleId;
    if (!fragments.has(slug(title))) fragments.set(slug(title), titleId);
  }
  const firstParagraph = tokens.find((token, i) => token.type === 'inline' && tokens[i - 1]?.type === 'paragraph_open');
  const description = inlineText(firstParagraph).trim().replace(/\s+/g, ' ').slice(0, 180) || `${title} in the public App Releases documentation.`;
  return {
    ...entry,
    product: productFor(entry),
    text,
    tokens,
    title,
    titleId,
    headings,
    fragments,
    description,
    sourceHash: hash(text)
  };
}

function relativeRoute(from, to) {
  const relative = path.posix.relative(from, to);
  return relative ? relative + (to.endsWith('/') ? '/' : '') : './';
}

function decode(value) {
  try { return decodeURIComponent(value); } catch { throw new Error(`Malformed link encoding: ${value}`); }
}

function resolveLink(href, document, documents, root = ROOT, catalog = manifest) {
  if (!safeUrl(href)) return null;
  const site = new URL(catalog.site);
  const input = new URL(href, `https://public-docs.invalid/${document.source}`);
  let source = null, siteRoute = null;
  if (input.origin === 'https://public-docs.invalid') {
    source = decode(input.pathname.slice(1));
  } else if (input.hostname.toLowerCase() === 'github.com') {
    const prefix = `/${catalog.repository}/`;
    if (input.pathname.toLowerCase().startsWith(prefix.toLowerCase())) {
      const suffix = input.pathname.slice(prefix.length);
      const match = /^(?:blob|tree)\/main\/(.+)$/.exec(suffix);
      if (match) source = decode(match[1]);
    }
  } else if (input.origin === site.origin && input.pathname.startsWith(site.pathname)) {
    siteRoute = '/' + input.pathname.slice(site.pathname.length);
  }
  if (source?.endsWith('/')) source += 'README.md';
  const target = source ? documents.find(doc => doc.source === source) : documents.find(doc => doc.route === siteRoute);
  if (target) {
    const fragment = input.hash ? decode(input.hash.slice(1)) : '';
    if (fragment && !target.fragments.has(fragment))
      throw new Error(`${document.source}: missing heading in ${target.source}: #${fragment}`);
    const destination = fragment ? '#' + encodeURIComponent(target.fragments.get(fragment)) : '';
    return (target.route === document.route && fragment ? '' : relativeRoute(document.route, target.route)) + destination;
  }
  if (source) {
    if (source === 'README.md') siteRoute = '/';
    else if (source.startsWith('docs/')) siteRoute = '/' + source.slice(5);
    else throw new Error(`${document.source}: unmapped repository document/file: ${source}`);
  }
  if (siteRoute !== null) {
    const local = path.resolve(root, 'docs', '.' + siteRoute);
    const relative = path.relative(path.join(root, 'docs'), local);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Site link escapes public docs.');
    const file = siteRoute.endsWith('/') ? path.join(local, 'index.html') : local;
    if (!fs.existsSync(file)) throw new Error(`${document.source}: missing static site target ${siteRoute}`);
    if (input.hash && file.endsWith('.html') && !fs.readFileSync(file, 'utf8').includes(`id="${decode(input.hash.slice(1))}"`))
      throw new Error(`${document.source}: missing static anchor ${input.hash}`);
    return relativeRoute(document.route, siteRoute) + input.search + input.hash;
  }
  return href; // Real external references, issue/auth/download actions remain external.
}

function renderContent(document, documents, root = ROOT, catalog = manifest) {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  md.validateLink = safeUrl;
  const normalLink = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const target = resolveLink(tokens[idx].attrGet('href'), document, documents, root, catalog);
    if (target === null) throw new Error(`${document.source}: unsafe link reached the renderer`);
    tokens[idx].attrSet('href', target);
    if (/^https?:/i.test(target)) tokens[idx].attrSet('rel', 'noopener noreferrer');
    return normalLink(tokens, idx, options, env, self);
  };
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx], src = token.attrGet('src');
    const target = resolveLink(src, document, documents, root, catalog);
    const alt = token.content || 'External image';
    // Remote badges/images are represented by their source alt text. Reading never calls
    // a badge service, GitHub API or another image endpoint.
    if (!target || /^(?:https?:|mailto:)/i.test(target))
      return `<span class="image-alt">${escape(alt)}</span>`;
    return `<img src="${escape(target)}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
  };
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx], language = token.info.trim().split(/\s+/)[0] || 'Text';
    return `<pre tabindex="0" aria-label="${escape(language)} code example"><code>${escape(token.content)}</code></pre>\n`;
  };
  md.renderer.rules.code_block = (tokens, idx) =>
    `<pre tabindex="0" aria-label="Code example"><code>${escape(tokens[idx].content)}</code></pre>\n`;
  let table = 0;
  md.renderer.rules.table_open = () => `<div class="table-scroll" tabindex="0" role="region" aria-label="${escape(document.title)} table ${++table}"><table>\n`;
  md.renderer.rules.table_close = () => '</table></div>\n';
  md.renderer.rules.th_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('scope', 'col');
    return self.renderToken(tokens, idx, options);
  };
  // Preserve Markdown-it Token methods while isolating the attributes we rewrite.
  const clone = tokens => tokens.map(token => Object.assign(
    Object.create(Object.getPrototypeOf(token)), token,
    { attrs: token.attrs?.map(attribute => [...attribute]) || null,
      children: token.children ? clone(token.children) : null }
  ));
  return md.renderer.render(clone(document.tokens), md.options, {});
}

function navigation(document, documents) {
  const hubPage = !document.product.id;
  const visible = hubPage
    ? documents.filter(doc => !doc.product.id)
    : documents.filter(doc => doc.product.id === document.product.id || !doc.product.id);
  const groups = [...new Set(visible.map(doc => doc.group))];
  const apps = hubPage ? `<div><p class="nav-group">Apps</p><ul><li><a href="${relativeRoute(document.route, '/')}#apps">Choose an app and its guides</a></li></ul></div>\n` : '';
  return apps + groups.map(group => `<div><p class="nav-group">${escape(group)}</p><ul>${visible.filter(doc => doc.group === group).map(doc =>
    `<li><a href="${relativeRoute(document.route, doc.route)}"${doc.route === document.route ? ' aria-current="page"' : ''}>${escape(doc.label)}</a></li>`
  ).join('')}</ul></div>`).join('\n');
}

function guideLinkScript(documents, catalog) {
  const routes = Object.fromEntries(documents.map(doc => [doc.source, { route: doc.route, fragments: Object.fromEntries(doc.fragments) }]));
  return `// Generated by scripts/build-docs.js. Source routes only; no network requests.\n(function () {\n` +
    `  const routes = ${JSON.stringify(routes)};\n` +
    `  const legacy = ${JSON.stringify(catalog.legacyLinks || {})};\n` +
    `  const base = new URL('.', document.currentScript.src);\n` +
    `  const prefix = ${JSON.stringify('/' + catalog.repository + '/')};\n` +
    `  window.SiteDocs = { resolve: function (href) {\n` +
    `    try {\n` +
    `      const url = new URL(href, location.href);\n` +
    `      const oldSource = ((href.startsWith('/') && !href.startsWith('//')) || url.hostname === 'github.com') ? legacy[url.pathname] : null;\n` +
    `      if (!oldSource && (url.hostname !== 'github.com' || !url.pathname.toLowerCase().startsWith(prefix.toLowerCase()))) return null;\n` +
    `      const match = /^(?:blob|tree)\\/main\\/(.+)$/.exec(url.pathname.slice(prefix.length));\n` +
    `      if (!oldSource && !match) return null;\n` +
    `      let source = oldSource || decodeURIComponent(match[1]); if (source.endsWith('/')) source += 'README.md';\n` +
    `      const doc = routes[source]; if (!doc) return null;\n` +
    `      const target = new URL(doc.route.slice(1), base);\n` +
    `      const fragment = decodeURIComponent(url.hash.slice(1));\n` +
    `      target.hash = doc.fragments[fragment] || fragment;\n` +
    `      return target.href;\n` +
    `    } catch (_) { return null; }\n` +
    `  } };\n})();\n`;
}

function buildSite(root = ROOT, catalog = manifest) {
  validateManifest(catalog);
  const realRoot = fs.realpathSync(root);
  const documents = catalog.documents.map(entry => {
    const file = fs.realpathSync(path.join(root, entry.source));
    const relative = path.relative(realRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Documentation source escapes the public repository.');
    return prepareDocument(entry, fs.readFileSync(file, 'utf8'));
  });
  const template = normalize(fs.readFileSync(path.join(root, 'scripts/docs/layout.html'), 'utf8'));
  const outputs = new Map();
  for (const document of documents) {
    const toc = document.headings.filter(heading => heading.level === 2);
    const canonical = new URL(document.route.slice(1), catalog.site).href;
    const hubPage = !document.product.id;
    const home = relativeRoute(document.route, '/');
    const productHome = hubPage ? home : home + document.product.id + '/';
    const overview = hubPage ? home : productHome;
    const guides = hubPage ? home + 'help/' : productHome + 'docs/';
    const brandGlyph = hubPage
      ? '<g fill="var(--on-accent)"><rect x="8" y="8" width="6.5" height="6.5" rx="1.6"/><rect x="17.5" y="8" width="6.5" height="6.5" rx="1.6"/><rect x="8" y="17.5" width="6.5" height="6.5" rx="1.6"/><rect x="17.5" y="17.5" width="6.5" height="6.5" rx="1.6"/></g>'
      : document.product.id === 'shot2code'
        ? '<rect x="6" y="8" width="20" height="14" rx="2.5" fill="none" stroke="var(--on-accent)" stroke-width="2"/><path d="M13.5 12.5L11 15.5l2.5 3M18.5 12.5L21 15.5l-2.5 3" fill="none" stroke="var(--on-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M16 4l9 3v7c0 6-3.9 10.4-9 12-5.1-1.6-9-6-9-12V7l9-3z" fill="none" stroke="var(--on-accent)" stroke-width="2" stroke-linejoin="round"/><path d="M11.5 16.2l3.1 3.1 6-6.4" fill="none" stroke="var(--on-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
    const values = {
      SOURCE: escape(document.source), SOURCE_HASH: document.sourceHash,
      TITLE: escape(document.title), TITLE_ID: escape(document.titleId),
      DESCRIPTION: escape(document.description), LABEL: escape(document.label),
      CANONICAL: escape(canonical), ROOT: relativeRoute(document.route, '/'),
      TITLE_CONTEXT: hubPage ? 'App Releases help' : `${document.product.name} documentation`,
      BRAND_NAME: hubPage ? 'App Releases' : document.product.name,
      BRAND_LABEL: hubPage ? 'App Releases — home' : `${document.product.name} — product overview`,
      BRAND_GLYPH: brandGlyph,
      OVERVIEW: overview, OVERVIEW_LABEL: hubPage ? 'All apps' : 'Product overview',
      GUIDES: guides, GUIDES_LABEL: hubPage ? 'Help' : 'Guides',
      DOCUMENTATION_LABEL: hubPage ? 'Help' : 'Documentation',
      RELEASES: hubPage ? home + 'releases/' : productHome + 'releases/',
      BACK_GUIDES: hubPage ? 'All help' : 'All guides',
      BACK_OVERVIEW: hubPage ? 'All apps' : 'Back to product',
      SOURCE_URL: escape(`https://github.com/${catalog.repository}/blob/main/${document.source}`),
      STRUCTURED_DATA: JSON.stringify({ '@context': 'https://schema.org', '@type': 'TechArticle',
        headline: document.title, description: document.description, url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'App Releases', url: catalog.site } }).replace(/</g, '\\u003c'),
      PAGE_NOTE: document.history ? '<p class="history-note">This public changelog preserves historical entries and explicitly labelled unreleased notes. Unreleased items are not claims about the stable binary.</p>'
        : document.source === 'LICENSE'
          ? `<p class="source-note">This is the hub content license. Application binaries and bundled components have their own license and notice documentation. <a href="${home}#apps">Choose an app to check its terms</a>.</p>` : '',
      NAVIGATION: navigation(document, documents),
      TOC: toc.length ? `<details class="doc-toc" id="doc-toc"><summary>On this page</summary><nav aria-label="On this page"><ul>${toc.map(heading =>
        `<li><a href="#${encodeURIComponent(heading.id)}">${escape(heading.text)}</a></li>`).join('')}</ul></nav></details>` : '',
      CONTENT: renderContent(document, documents, root, catalog)
    };
    const preparedTemplate = template.replace(/^[\t ]*\{\{([A-Z_]+)\}\}[\t ]*$/gm,
      (line, key) => values[key] === '' ? '' : line);
    const html = preparedTemplate.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`Unknown layout placeholder ${key}`);
      return values[key];
    });
    outputs.set('docs' + document.route + 'index.html', html);
  }
  outputs.set('docs/guide-links.js', guideLinkScript(documents, catalog));
  return { documents, outputs };
}

function checkOrWrite(root = ROOT, check = false) {
  const { documents, outputs } = buildSite(root);
  const unexpected = [];
  function safeOutput(file) {
    for (let current = path.resolve(file); current !== path.resolve(root); current = path.dirname(current)) {
      const relative = path.relative(root, current);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Generated output escapes the repository.');
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink())
        throw new Error(`Generated output must not follow symbolic links: ${current}`);
    }
  }
  function inspect(directory) {
    if (!fs.existsSync(directory)) return;
    safeOutput(directory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (!outputs.has(path.relative(root, file).split(path.sep).join('/')))
        unexpected.push(path.relative(root, file));
    }
  }
  inspect(path.join(root, 'docs/threat-model-reviewer/docs'));
  inspect(path.join(root, 'docs/shot2code/docs'));
  inspect(path.join(root, 'docs/help'));
  if (unexpected.length) throw new Error(`Unmapped generated pages require explicit review: ${unexpected.join(', ')}`);
  const drift = [];
  for (const [name, expected] of outputs) {
    const file = path.join(root, name);
    safeOutput(file);
    if (!fs.existsSync(file) || normalize(fs.readFileSync(file, 'utf8')) !== expected) {
      drift.push(name);
    }
  }
  if (check && drift.length) throw new Error(`Generated documentation drift. Run npm run build:docs and commit:\n${drift.join('\n')}`);
  if (!check) {
    for (const name of drift) {
      const file = path.join(root, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, outputs.get(name), 'utf8');
    }
  }
  return { pages: documents.length, changed: drift.length };
}

if (require.main === module) {
  try {
    const check = process.argv.includes('--check');
    const result = checkOrWrite(ROOT, check);
    console.log(`${result.pages} native documentation pages ${check ? 'match their public Markdown sources' : `generated; ${result.changed} outputs updated`}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { manifest, safeUrl, slug, assertStableSource, validateManifest, prepareDocument, relativeRoute, resolveLink, renderContent, buildSite, checkOrWrite };
