// Native deep links into the existing product history renderers; no release parsing or requests.
(function () {
  "use strict";
  const list = document.getElementById("list");
  if (!list) return;
  let followed = "";
  let pending = "";
  function follow() {
    if (!location.hash || location.hash === followed || location.hash === pending) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); }
    catch (_) { return; } // a malformed external fragment is not a release selection
    const card = document.getElementById(id);
    if (!card || !list.contains(card) || !card.classList.contains("rel")) return;
    const filter = document.getElementById("filter");
    if (filter && filter.value) {
      filter.value = "";
      filter.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const hash = location.hash;
    pending = hash;
    requestAnimationFrame(function () {
      pending = "";
      if (location.hash !== hash) return;
      // A fast live response may have replaced the snapshot's element before this frame.
      const target = document.getElementById(id);
      if (!target || !list.contains(target) || !target.classList.contains("rel")) return;
      const notes = target.querySelector("details.notes");
      if (notes) notes.open = true;
      target.scrollIntoView({ block: "start", behavior: "instant" });
      target.focus({ preventScroll: true });
      followed = hash;
    });
  }
  new MutationObserver(follow).observe(list, { childList: true });
  window.addEventListener("hashchange", function () { followed = ""; pending = ""; follow(); });
  follow();
})();
