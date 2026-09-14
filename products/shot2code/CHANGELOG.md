# Changelog — shot2code

Published Windows builds of shot2code, newest first. Tags in this hub are
product-prefixed (`shot2code-vX.Y.Z`); the upstream project tags the same build as
`vX.Y.Z`.

The authoritative list of published builds is the
[releases page](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/),
which is generated from the release feed; this file summarises each one.

The full engineering changelog lives with the code:
[CHANGELOG.md](https://github.com/ArasaniRohithReddy/shot2code/blob/main/CHANGELOG.md).
Versions before 0.3.0 were not tracked in a changelog, so the earlier builds
mirrored on the releases page have downloads and notes but no entry here.

## [0.3.3] — 2026-09-14

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.3.3) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.3.3)

The current release. It makes the packaged app start in seconds instead of
minutes, lets you decide how the workspace splits its width, and replaces the
shortcuts-only dialog with a Help centre that can open the log you need to
attach to a bug report.

### Fixed

- **Startup no longer waits for features you have not used yet.** The frozen
  backend used to import the generation, evaluation and project-tool
  dependencies *before* health could answer, then launch Playwright
  synchronously. On a slow machine that delayed readiness by 299–347 seconds and
  blew past the shell's timeout — the splash screen that never cleared. Core
  routes now come up first, the heavy routers load on first use, and Chromium
  and Copilot discovery run as bounded background work.
- **Readiness is checked strictly, not hopefully.** The desktop shell now
  requires HTTP 200 *and* a real `{"ok": true}` body, gives up immediately if the
  backend exits or cannot be spawned, records how long readiness took, and uses a
  90-second cold-start deadline instead of waiting on optional capabilities.
  Final packaged validation was **10 of 10 relaunches with no timeouts** —
  5.2 s fastest, 8.3 s median, 11.2 s slowest to a ready shell; 10.6 s on a fresh
  profile and 40.9 s for a fresh portable or post-update first run.
- **A deferred feature that fails stays failed.** If one of the lazily imported
  routers cannot load, the request returns an error and health starts failing
  from then on, rather than reporting a healthy backend that cannot generate.
  Chromium is advertised only after it has actually launched, and it is closed
  when the backend shuts down.

### Added

- **A resizable Chat and History panel.** On wide windows (≥ 1280px) drag the
  divider between the conversation/History panel and Preview or Code. It is a
  real separator, not a decoration: arrow keys move it 16px, **Shift**+arrow
  64px, **Home**/**End** jump to the narrowest and widest allowed widths,
  **Enter** or a double-click restores the default, and **Escape** cancels a drag
  in progress.
- **A resizable project file explorer** with its own divider on multi-file Code
  workspaces, and minimum widths for both the tree and the editor. Single-file
  projects still show no tree, so no space is wasted on an empty one.
- **Pane widths that persist — and stay a view preference.** Chat and explorer
  widths survive a restart and a collapse/reopen cycle, and are clamped to the
  current window so neither side can be squeezed into uselessness. They are kept
  entirely apart from project data: **resizing a pane cannot change or create a
  version**, an option, a retry or anything in History.
- **An in-app Help centre.** The rail's **Help** action and **Ctrl+/** open four
  sections — *Get started*, *Guides*, *Support* and *Keyboard shortcuts*. Its
  links point at this hub: the product page, the complete release history, and
  the install, user, FAQ, troubleshooting, architecture, data-handling, security,
  changelog, contributing, third-party and releasing guides, plus the issue
  tracker and the source repository.
- **Open diagnostic logs.** In the packaged desktop app, Help opens the folder
  holding the backend log and says plainly whether that worked. The browser
  development build has no such log and explains why the action is unavailable
  instead of offering a dead button.
- **Real desktop zoom.** `Ctrl+=` and `Ctrl++` zoom in, `Ctrl+-` zooms out, the
  numpad add and subtract keys work with `Ctrl`, and `Ctrl+0` resets. Zoom moves
  in deterministic 10-point steps and is bounded between 50% and 300%.

### Changed

- Below the desktop split breakpoint nothing moves: the **Preview**, **Chat** and
  **History** destinations behave exactly as before and no drag handle is shown.
- Chat spacing and the composer reflow at the narrowest supported panel width
  without hiding **Send**, the model picker or the design-system controls.
- The shortcuts-only dialog became the Help centre; the full shortcut reference
  is still inside it.

### Accessibility

- Every pane handle is a `role="separator"` with vertical orientation, current,
  minimum and maximum values, readable value text, an explicit link to the pane
  it controls, keyboard instructions, visible focus and a 44-pixel interaction
  gutter.
- Help keeps focus trapped while open, labels each external link descriptively,
  uses 44-pixel tabs and rows, scrolls its tabs horizontally on narrow windows,
  and shows honest disabled states.
- The recognised zoom keys suppress Chromium's duplicate handling without
  swallowing ordinary editor input, AltGr or composition events.

## [0.3.2] — 2026-09-14

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.3.2) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.3.2)

The current release. It protects an update that starts from an older client,
extends model selection to every supported code provider, and finishes the
responsive **Preview** and **History** work.

Superseded by 0.3.3, which makes the packaged app start in seconds.

### Fixed

- **An old client can no longer be replaced while its backend is running.** The
  0.3.1 guard lives in the *app*, so a machine still on an older build could not
  use it. The NSIS installer now runs its own pre-install safeguard before it
  uninstalls or replaces anything: it identifies processes by executable path
  under the installed `resources\backend` directory, terminates each captured
  process tree synchronously, and verifies that no matching process is left.
  It never kills by process name, so an unrelated program that happens to share
  an executable name is left alone.
- **That safeguard fails closed and says why.** If the installed backend tree
  cannot be confirmed stopped, the replacement is aborted — with an actionable
  message for an interactive install, or a distinct exit code for a silent one.
  Diagnostics are written to
  `%TEMP%\shot2code-installer-preinstall.log`.
- **The 100% preview no longer hugs the left edge.** A fixed-width desktop
  canvas is centred inside a neutral framed viewport. Narrower windows keep
  deliberate horizontal scrolling instead of clipping the start of the canvas.
- **History is discoverable at every width.** The user-facing name is now
  **History** everywhere it used to read *Versions*, with its own labelled
  destination beside **Preview** and **Chat** when the window is too narrow for
  the split view. History rows are real buttons with better focus, larger
  targets and stronger contrast.
- **A strict Windows console can no longer crash prompt logging.** Prompt-preview
  diagnostics are encoded for whatever the active output stream can actually
  represent, including a strict cp1252 console, instead of letting box-drawing
  characters or prompt text raise `UnicodeEncodeError` mid-generation. This
  affects running from source; the packaged app logs to a file.

### Added

- **Model selection for every code-generation provider.** Settings and the
  compact picker beside the composer group the available models under **GitHub
  Copilot**, **OpenAI**, **Anthropic** and **Google Gemini**. Tick as many as you
  like: one option is generated per selected model, up to the per-run variant
  limit. Selecting nothing keeps the automatic behaviour.
- **A credential-aware model catalogue.** `/api/models` reports which providers
  are usable and what each model can do — without returning any secret. Copilot
  models are discovered from the signed-in account; the API-key providers use
  maintained, validated catalogues.
- **Safe migration and honest handling of stale picks.** An existing
  `copilotModels` list, or a `codeGenerationModel` that was actually changed from
  its old default, is migrated into the provider-neutral selection. Removed
  credentials, retired models and choices the current input mode cannot use are
  reported explicitly instead of silently dropped.
- **Installer-level regression coverage.** Desktop tests cover the NSIS wiring,
  the installed process-tree shutdown, the survival of an unrelated process with
  the same executable name, the fail-closed path, and the updater lifecycle.

### Changed

- Preview controls are grouped by purpose: a **Fit / 100%** segmented control and
  a labelled **History _n_/_m_** control instead of loose buttons.
- A retry reuses the provider and model choices its source generation actually
  used, and history records the concrete model behind each variant.
- The published screenshots and these guides were retaken and rewritten for the
  centred preview, the History naming, the responsive destinations and the
  multi-provider model interface.

## [0.3.1] — 2026-09-13

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.3.1) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.3.1)

A corrective release: it closes a race in the silent updater shipped in 0.3.0, and
reworks the workspace around the chat panel, the code editor and the provider
status the app can honestly report.

Superseded by 0.3.2, which moves the shutdown guard into the installer so it also
protects machines updating *from* an older client.

### Fixed

- **The updater could start a second installer.** Both install paths — the
  automatic one after a download, and **Restart & install** in Settings — called
  the install directly, so a queued click or an install-on-quit could launch a
  second installer while the first was already replacing files. There is now a
  single guarded entry point: the in-progress flag is set before any blocking
  work, and install-on-quit is disabled for that explicit path.
- **Backend shutdown is verified instead of assumed.** The process-tree kill is
  bounded by a 30-second timeout, its exit status is checked, and the process ID
  is re-probed to confirm the tree is gone. An already-exited backend counts as
  stopped.
- **A failed shutdown aborts the install and stays retryable.** If the tree cannot
  be confirmed dead, the update is not started at all — no more overwriting a live
  PyInstaller tree. Settings reports that shot2code could not shut down safely and
  asks you to quit and try again, instead of looking stuck.
- **The new install path is packaged.** It is listed in the electron-builder
  `files` array, so it ships inside the app rather than being dropped from the
  build.

### Added

- **Collapsible chat panel** on wide layouts (≥ 1280px), so the preview or the
  code editor can take the full width. The choice is remembered; **Ctrl+3**
  toggles it and **Ctrl+1** / **Ctrl+4** bring it back.
- **Conversation empty state with starters.** A new project offers three starting
  points — *Make the layout responsive*, *Fix accessibility issues* and *Polish
  spacing and typography* for imported code; *Match the reference more closely*,
  *Make the layout responsive* and *Add the missing interactions* for a generated
  first version. They **insert** the full instruction into the composer so you can
  edit it; nothing is sent on your behalf.
- **Provider status callout** that states only what the app can see: *"No model
  provider saved in this browser"* (with the reminder that credentials it cannot
  see from there, such as a Copilot sign-in, may still work) or *"… saved on this
  device"*. It never claims a provider is connected or verified.
- **Format action in the Code tab** — a whitespace-only formatter for HTML, CSS,
  JavaScript and JSON. It is never automatic, never evaluates the file, refuses
  component source (JSX/TSX/Vue), and bails out unchanged on ambiguous or
  unbalanced syntax.
- **Collapsible project file explorer**, defaulting to open only when a project has
  more than one file.
- **Editor status bar** with the language and line count, the keyboard hint, and
  the reason CodePen is unavailable as a polite status message rather than a
  banner over the code.
- **Read-only** and **Generated** badges beside the existing **Entry** and
  **Preview** badges.

### Changed

- The icon rail's **Editor** entry is now **Chat**, with an explicit
  collapse/expand control, `aria-label`/`aria-pressed`/`aria-controls`/
  `aria-expanded` on rail buttons, decorative icons hidden from assistive
  technology, and targets at least 44px.
- Code tab toolbar labels shortened to **Format**, **Copy**, **Download** and
  **CodePen**, with the full descriptions moved into their accessible names.
- File tabs appear only when a project has more than one file, and the active tab
  is underlined rather than merely tinted.
- The editor highlights the active line and gutter and uses theme-correct surfaces
  in both themes.
- The variants strip renders only when a version actually has more than one
  variant.

## [0.3.0] — 2026-09-13

[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.3.0)

The release that turned shot2code into a local-first project workspace: projects
and their version history are saved on your own machine, generated output is a
real multi-file project you can edit, and previews run in a locked-down sandbox.

Superseded by 0.3.1, which fixes the updater race it shipped with.

### Added

- **Local project history (SQLite).** Projects, versions, variants, prompts and
  messages are stored in `history.sqlite3` in a per-user data directory
  (`%LOCALAPPDATA%\shot2code\` on Windows), with a versioned schema, tracked
  migrations and an `/api/history` route group. A **Recent projects** panel
  restores earlier work; deleting a project removes it and its versions from the
  device.
- **Retry ancestry.** Commits record both their parent and, for a retry, the
  commit they re-roll. Retrying reuses the models that produced the original
  variants, and ancestry walks reject cycles.
- **Multi-file editor and project tree.** A keyboard-navigable file tree with
  expandable folders and read-only files announced as such, file tabs with
  arrow-key navigation, per-file copy/download, and the resolved entry point
  badged. The tree is the authoritative source for export, CodePen and preview.
- **Safe, sandboxed previews.** Rendered from `srcDoc` without
  `allow-same-origin`, with an injected Content-Security-Policy, `no-referrer`,
  and camera/microphone/geolocation/display-capture denied. Select-and-edit moved
  to a nonce-checked per-preview message bridge with capped payloads, and an
  unrepresentable build shows a deterministic fallback instead of a silently
  broken page.
- **Import, export and CodePen across all 12 stacks.** Import a folder, ZIP or
  selected files — parsed as text only, never executed, bounded by explicit
  archive, entry, file, size and text limits. Export produces a single
  self-contained HTML file or a project folder with a documented per-stack
  strategy. CodePen is offered only when the stack can honestly run in a Pen, and
  always asks first.
- **Multi-screenshot modes**: `pages` (the default), `responsive`, `states` and
  `references`, saved with the project and sent with each generation.
- **Shortcut reference (Ctrl+/)** and conflict-free `Ctrl+Alt` project shortcuts,
  plus accessibility work across the workspace.
- **GitHub Copilot model discovery** — the app asks the signed-in account which
  models it can use and whether each supports vision, instead of shipping a
  hardcoded list. Credentials are resolved without persisting or logging a token.
- **Desktop updater and packaging** — auto-update for per-user NSIS installs with
  the state surfaced in Settings, silent install and relaunch, managed-install
  detection under Program Files, and NSIS/MSI/portable builds with the backend
  frozen by PyInstaller and only headless Chromium bundled.

### Security

- Previews run in an opaque origin under a restrictive CSP with a nonce-checked
  edit bridge.
- Imported projects are parsed as text only and never executed; traversal paths
  are rejected and count/size/text limits enforced.
- Raw imported source is never written into persisted project context.
- CodePen sharing requires explicit confirmation before any code leaves the device.
