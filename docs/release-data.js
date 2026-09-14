// Shared, product-scoped progressive enhancement. The generated snapshot is never edited here.
(function (root) {
  "use strict";
  const REPO = "ArasaniRohithReddy/app-releases";
  const PREFIX = "threat-model-reviewer-v";
  const API = "https://api.github.com/repos/" + REPO + "/releases";
  const RELEASES = "https://github.com/" + REPO + "/releases";
  const TAG_SUFFIX = "\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$";
  const TAG = new RegExp("^" + PREFIX + TAG_SUFFIX);
  const tagPattern = prefix => prefix === PREFIX ? TAG
    : new RegExp("^" + String(prefix).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + TAG_SUFFIX);

  function kindOf(name) {
    const n = typeof name === "string" ? name.toLowerCase() : "";
    if (/^threatmodelreviewer-v\d+\.\d+\.\d+-sha256sums\.txt$/.test(n)) return "checksums";
    if (/^threatmodelreviewer-v\d+\.\d+\.\d+-release\.json$/.test(n)) return "provenance";
    if (n.endsWith("-skill.zip")) return "skill";
    if (n.endsWith("-cli-win-x64.zip")) return "cli";
    if (n.endsWith("-portable.zip")) return "portable";
    if (n.endsWith(".msi")) return "msi";
    if (n.endsWith("-setup.exe")) return "setup";
    if (n.endsWith(".msix")) return "msix";
    if (n.endsWith(".cer")) return "cer";
    return null; // Unknown files still belong in the complete asset table.
  }

  function validAsset(asset, tag) {
    return asset && typeof asset.name === "string" && asset.name.trim() &&
      Number.isFinite(asset.size) && asset.size >= 0 &&
      asset.browser_download_url === RELEASES + "/download/" +
        encodeURIComponent(tag) + "/" + encodeURIComponent(asset.name);
  }

  function sorted(releases) {
    return releases.slice().sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  }

  // The hub publishes more than one application, so the caller names the tag prefix it owns.
  // Without one, this is the Threat Model Reviewer feed these pages have always loaded.
  function normalize(json, prefix = PREFIX) {
    const tag = tagPattern(prefix);
    if (!Array.isArray(json)) throw new Error("The release service returned an invalid list.");
    const releases = json.filter(r =>
      r && typeof r.tag_name === "string" && tag.test(r.tag_name) &&
      (r.draft === undefined || r.draft === false) && typeof r.prerelease === "boolean" &&
      typeof r.published_at === "string" && Number.isFinite(Date.parse(r.published_at)) &&
      Array.isArray(r.assets) && r.assets.every(a => validAsset(a, r.tag_name)) &&
      (r.body_html == null || typeof r.body_html === "string") &&
      (r.body == null || typeof r.body === "string")
    );
    if (!releases.length) throw new Error("No valid published releases were returned for this application.");
    return sorted(releases);
  }

  function latestStable(releases, prefix = PREFIX) {
    return sorted(releases).find(r => !r.prerelease && !r.tag_name.slice(prefix.length).includes("-"));
  }

  function releaseUrl(release) {
    return RELEASES + "/tag/" + encodeURIComponent(release.tag_name);
  }

  function merge(saved, live) {
    const byTag = new Map(saved.map(r => [r.tag_name, r]));
    for (const release of live) {
      const previous = byTag.get(release.tag_name);
      if (!previous) { byTag.set(release.tag_name, release); continue; }
      // A partial API page or an incomplete refresh must not erase historical files or notes.
      const assets = new Map(previous.assets.map(a => [a.name, a]));
      release.assets.forEach(a => assets.set(a.name, a));
      byTag.set(release.tag_name, {
        ...previous, ...release,
        assets: [...assets.values()],
        body_html: release.body_html || (release.body ? "" : previous.body_html),
        body: release.body || previous.body
      });
    }
    return sorted([...byTag.values()]);
  }

  async function load(snapshotUrl, onData, onError = function () {}, options = {}) {
    const fetcher = options.fetch || root.fetch.bind(root);
    const timeout = options.timeout ?? 10000;
    // The hub publishes several applications from one repository, so a caller names the tag prefix
    // whose releases it wants; the release list itself is shared.
    const prefix = options.prefix || PREFIX;
    async function request(url, accept) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetcher(url, {
          cache: "no-cache", signal: controller.signal,
          headers: { Accept: accept || "application/json" }
        });
        if (response.status === 403) throw new Error("GitHub's API rate limit was reached from this network.");
        if (!response.ok) throw new Error("The release service returned HTTP " + response.status + ".");
        return { json: await response.json(), link: response.headers.get("link") || "" };
      } finally {
        clearTimeout(timer);
      }
    }

    let releases = [];
    try { releases = normalize((await request(snapshotUrl)).json, prefix); }
    catch (_) { /* The live API may still work. Static links remain usable meanwhile. */ }
    if (releases.length) onData(releases, "snapshot");

    try {
      const all = [], visited = new Set();
      let next = API + "?per_page=100";
      while (next) {
        // Follow pagination only on this repository's release endpoint, never an arbitrary URL.
        const url = new URL(next);
        if (url.origin + url.pathname !== API || url.username || url.password || visited.has(next))
          throw new Error("The release service returned invalid pagination.");
        visited.add(next);
        const response = await request(next, "application/vnd.github.html+json");
        if (!Array.isArray(response.json)) throw new Error("The release service returned an invalid list.");
        all.push(...response.json);
        const match = response.link.match(/(?:^|,)\s*<([^>]+)>;\s*rel="next"/);
        next = match ? match[1] : "";
      }
      releases = merge(releases, normalize(all, prefix));
      onData(releases, "live");
    } catch (error) {
      if (!releases.length) onError(error);
    }
    return releases;
  }

  const data = { PREFIX, kindOf, normalize, latestStable, releaseUrl, merge, load };
  if (typeof module === "object" && module.exports) module.exports = data;
  else root.ReleaseData = data;
})(globalThis);
