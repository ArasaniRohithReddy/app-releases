// Shared page controls: preserve theme choices and keep anchors clear of a wrapping header.
(function () {
  const root = document.documentElement;
  const header = document.querySelector("header.site");
  if (header) {
    const updateOffset = function () {
      root.style.setProperty("--header-offset", Math.ceil(header.getBoundingClientRect().height + 16) + "px");
    };
    updateOffset();
    if (window.ResizeObserver) new ResizeObserver(updateOffset).observe(header);
    else window.addEventListener("resize", updateOffset);
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const button = document.getElementById("theme-toggle");
  const modes = ["system", "light", "dark"];
  function current() { return root.getAttribute("data-theme") || "system"; }
  function next() { return modes[(modes.indexOf(current()) + 1) % modes.length]; }
  function label() {
    if (!button) return;
    const mode = current();
    const effective = mode === "system" ? " (" + (mq.matches ? "dark" : "light") + ")" : "";
    const text = "Theme: " + mode + effective + ". Switch to " + next() + " theme";
    button.setAttribute("aria-label", text);
    button.title = text;
  }
  function apply(mode) {
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    try {
      if (mode === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", mode);
    } catch (_) { /* The control still works when storage is blocked. */ }
    label();
  }
  if (button) {
    button.hidden = false;
    button.addEventListener("click", function () { apply(next()); });
  }
  if (mq.addEventListener) mq.addEventListener("change", label);
  label();
})();
