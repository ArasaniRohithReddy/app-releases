# Changelog — shot2code

Published Windows builds of shot2code, newest first. Tags in this hub are
product-prefixed (`shot2code-vX.Y.Z`); the upstream project tags the same build as
`vX.Y.Z`.

The authoritative list of published builds is the
[releases page](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/),
which is generated from the release feed; this file summarises each one.

The full engineering changelog lives with the code:
[CHANGELOG.md](https://github.com/ArasaniRohithReddy/shot2code/blob/main/CHANGELOG.md).
Versions before 0.3.0 were not tracked in a changelog.

## [0.3.1] — 2026-09-13

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.3.1) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.3.1)

A corrective release: it closes a race in the silent updater shipped in 0.3.0, and
reworks the workspace around the chat panel, the code editor and the provider
status the app can honestly report.

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
