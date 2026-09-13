// Reading works without scripts; enhancement keeps sticky offsets and keyboard focus aligned.
(function () {
  const navigation = document.getElementById('guide-navigation');
  if (!navigation) return;
  const header = document.querySelector('header.site');
  function revealFragment() {
    if (!header || getComputedStyle(header).position !== 'sticky' || !location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); }
    catch (error) { if (error instanceof URIError) return; throw error; }
    const target = document.getElementById(id);
    if (!target || !target.getClientRects().length) return;
    const top = target.getBoundingClientRect().top;
    // Font/zoom changes can grow the header after the browser's initial fragment scroll.
    if (top >= -1 && top < header.getBoundingClientRect().bottom + 12)
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function updateHeaderOffset() {
    if (header) {
      document.documentElement.style.setProperty('--header-offset', `${Math.ceil(header.getBoundingClientRect().height) + 12}px`);
      requestAnimationFrame(revealFragment);
    }
  }
  updateHeaderOffset();
  if (header && typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderOffset).observe(header);
  window.addEventListener('resize', updateHeaderOffset);
  window.addEventListener('load', updateHeaderOffset);
  window.addEventListener('hashchange', updateHeaderOffset);
  document.documentElement.classList.add('docs-enhanced');
  const summary = navigation.querySelector('summary');
  const compact = window.matchMedia('(max-width: 960px)');
  function adapt() {
    const restoreFocus = compact.matches && navigation.contains(document.activeElement) && document.activeElement !== summary;
    navigation.open = !compact.matches;
    if (restoreFocus) summary.focus();
  }
  adapt();
  compact.addEventListener('change', adapt);
})();
