// Reading works without scripts; enhancement keeps sticky offsets and keyboard focus aligned.
(function () {
  const navigation = document.getElementById('guide-navigation');
  if (!navigation) return;
  const header = document.querySelector('header.site');
  function updateHeaderOffset() {
    if (header) document.documentElement.style.setProperty('--header-offset', `${Math.ceil(header.getBoundingClientRect().height) + 12}px`);
  }
  updateHeaderOffset();
  if (header && typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderOffset).observe(header);
  window.addEventListener('resize', updateHeaderOffset);
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
