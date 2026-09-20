// A native index over the shared product registry/loader, not another release parser.
(function () {
  "use strict";
  const root = document.documentElement;
  const status = document.getElementById("release-status");
  if (!window.ReleaseData) {
    status.textContent = "Combined releases are unavailable. Use the native product-history links below.";
    root.dataset.releaseSource = "unavailable";
    root.dataset.releaseReady = "true";
    return;
  }
  const site = new URL("../", document.currentScript.src);
  const products = ReleaseData.PRODUCTS;
  const states = new Map(products.map(product => [product.id, { product, releases: [], source: "loading", settled: false }]));
  const app = document.getElementById("release-app");
  const channel = document.getElementById("release-channel");
  const form = document.getElementById("release-filters");
  const empty = document.getElementById("release-empty");
  const groups = new Map([...document.querySelectorAll(".release-group")].map(group => [group.dataset.product, group]));
  for (const product of products) {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = product.name;
    app.appendChild(option);
  }
  const query = new URLSearchParams(location.search);
  if (states.has(query.get("app"))) app.value = query.get("app");
  if (["all", "stable", "preview"].includes(query.get("type"))) channel.value = query.get("type");
  form.hidden = false;
  form.addEventListener("submit", event => event.preventDefault());

  function updateFilters() {
    let shown = 0, matching = 0;
    for (const { product, source, releases } of states.values()) {
      const group = groups.get(product.id);
      if (!group) continue;
      group.hidden = app.value !== "all" && app.value !== product.id;
      if (group.hidden) continue;
      matching++;
      for (const row of group.querySelectorAll(".release-row")) {
        row.hidden = channel.value !== "all" && row.dataset.channel !== channel.value;
        if (!row.hidden) shown++;
      }
      // Keep unavailable product links visible: a failed request is not "no releases".
      group.dataset.source = source;
      group.dataset.releaseCount = String(releases.length);
    }
    const selected = [...states.values()].filter(state => app.value === "all" || app.value === state.product.id);
    const pending = selected.some(state => !state.settled);
    const unavailable = selected.filter(state => state.source === "unavailable").length;
    empty.hidden = shown > 0 || pending || unavailable > 0;
    status.textContent = `${shown} release${shown === 1 ? "" : "s"} shown across ${matching} app${matching === 1 ? "" : "s"}. ` +
      (pending ? "Checking for updates." : unavailable ? "Some history is unavailable; native product links remain below." : "Open a version for native release details.");
    root.dataset.releaseSource = [...states.values()].every(state => state.source === "live") ? "live"
      : [...states.values()].some(state => state.releases.length) ? "snapshot" : pending ? "loading" : "unavailable";
  }

  function saveFilters() {
    const url = new URL(location.href);
    if (app.value === "all") url.searchParams.delete("app"); else url.searchParams.set("app", app.value);
    if (channel.value === "all") url.searchParams.delete("type"); else url.searchParams.set("type", channel.value);
    history.replaceState(null, "", url);
    updateFilters();
  }
  app.addEventListener("change", saveFilters);
  channel.addEventListener("change", saveFilters);

  function render(state) {
    const { product, releases, source, settled } = state;
    const group = groups.get(product.id);
    if (!group) throw new Error("The native release index is missing a registered product section.");
    const list = group.querySelector(".release-list");
    const focused = list.contains(document.activeElement) ? document.activeElement.getAttribute("href") : null;
    const latest = ReleaseData.latestStable(releases, product.prefix);
    const fragment = document.createDocumentFragment();
    for (const release of releases) {
      const stable = Boolean(ReleaseData.latestStable([release], product.prefix));
      const version = "v" + release.tag_name.slice(product.prefix.length);
      const row = document.createElement("li");
      row.className = "release-row";
      row.dataset.tag = release.tag_name;
      row.dataset.channel = stable ? "stable" : "preview";
      const summary = document.createElement("div");
      const title = document.createElement("div");
      title.className = "release-title";
      const versionText = document.createElement("span");
      versionText.className = "release-version";
      versionText.textContent = version;
      const badge = document.createElement("span");
      badge.className = "release-channel" + (stable ? "" : " preview");
      badge.textContent = stable ? release === latest ? "Latest stable" : "Stable" : "Pre-release";
      title.append(versionText, badge);
      const date = document.createElement("time");
      date.className = "release-date";
      date.dateTime = release.published_at;
      date.textContent = "Published " + new Date(release.published_at).toLocaleDateString(undefined,
        { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) + " (UTC)";
      summary.append(title, date);
      const link = document.createElement("a");
      link.className = "release-detail";
      link.href = new URL(product.path + "releases/#" + encodeURIComponent(release.tag_name), site);
      link.textContent = "Release details";
      link.setAttribute("aria-label", `${product.name} ${version} release details`);
      row.append(summary, link);
      fragment.appendChild(row);
    }
    list.replaceChildren(fragment);
    group.querySelector(".group-source").textContent = source === "unavailable"
      ? "The combined list could not load this app's history. " + (state.error || "") + " Open its native history page to retry; no other app's releases are substituted."
      : source === "live" ? "Updated from this app's published release feed."
      : source === "snapshot" ? "Saved release snapshot." + (settled ? " Live refresh was unavailable." : " Checking for updates.")
      : "Loading this app's release history.";
    if (focused) {
      const replacement = [...list.querySelectorAll("a")].find(link => link.getAttribute("href") === focused);
      if (replacement) replacement.focus({ preventScroll: true });
    }
    updateFilters();
  }

  updateFilters();
  Promise.all([...states.values()].map(state =>
    ReleaseData.load(new URL(state.product.snapshot, site).href, function (releases, source) {
      state.releases = releases;
      state.source = source;
      render(state);
    }, function (error) {
      state.error = error.message;
      state.source = "unavailable";
      render(state);
    }, { prefix: state.product.prefix }).then(function () {
      state.settled = true;
      render(state);
    })
  )).then(function () { root.dataset.releaseReady = "true"; });
})();
