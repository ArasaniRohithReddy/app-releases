// Each product on the hub keeps its own snapshot. Never prune saved history on API absence.
const fs = require('node:fs');
const releases = require('../docs/release-data.js');

function project(release) {
  return {
    tag_name: release.tag_name,
    name: release.name ?? null,
    published_at: release.published_at,
    prerelease: release.prerelease,
    body_html: release.body_html || '',
    assets: release.assets.map(asset => ({
      name: asset.name,
      size: asset.size,
      download_count: asset.download_count,
      browser_download_url: asset.browser_download_url
    }))
  };
}

function buildSnapshot(previous, pages, prefix = releases.PREFIX) {
  if (!Array.isArray(previous)) throw new Error('The saved snapshot is not an array; refusing to replace it.');
  const saved = previous.length ? releases.normalize(previous, prefix) : [];
  if (saved.length !== previous.length) throw new Error('The saved snapshot contains invalid records.');
  if (!Array.isArray(pages) || !pages.length || pages.some(page => !Array.isArray(page)))
    throw new Error('Expected an array of API pages from gh api --paginate --slurp.');
  const records = pages.flat();
  if (records.some(record => !record || typeof record.tag_name !== 'string'))
    throw new Error('The release API returned malformed records.');
  const candidates = records.filter(record => record.tag_name.startsWith(prefix) && record.draft !== true);
  const incoming = releases.normalize(candidates, prefix);
  if (incoming.length !== candidates.length) throw new Error('The release API returned invalid product releases or assets.');
  for (const release of incoming) {
    if ((release.name != null && typeof release.name !== 'string') ||
        (release.body_html !== null && typeof release.body_html !== 'string') ||
        release.assets.some(asset => !Number.isSafeInteger(asset.download_count) || asset.download_count < 0))
      throw new Error('Expected rendered release notes and valid asset counters from the HTML API.');
  }
  // Project before merging: raw API body/author/uploader fields do not belong in the snapshot.
  // Empty refreshed notes or missing files must not erase previously published content.
  return releases.merge(saved, incoming.map(project)).map(project);
}

function updateFile(file, pages, prefix) {
  const before = fs.readFileSync(file, 'utf8');
  const snapshot = buildSnapshot(JSON.parse(before), pages, prefix);
  const after = JSON.stringify(snapshot) + '\n';
  if (after !== before) {
    const temporary = file + '.tmp';
    try {
      fs.writeFileSync(temporary, after, 'utf8');
      fs.renameSync(temporary, file);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  return { changed: after !== before, releases: snapshot.length, assets: snapshot.reduce((n, r) => n + r.assets.length, 0) };
}

if (require.main === module) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node scripts/update-release-snapshot.js <existing-snapshot.json> [tag-prefix] (API pages on stdin)');
    const result = updateFile(process.argv[2], JSON.parse(fs.readFileSync(0, 'utf8')), process.argv[3] || releases.PREFIX);
    console.log(`Snapshot ${result.changed ? 'updated' : 'unchanged'}: ${result.releases} releases, ${result.assets} assets.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildSnapshot, updateFile };
