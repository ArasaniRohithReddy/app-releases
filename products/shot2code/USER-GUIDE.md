# shot2code user guide

Everything below describes the published Windows build. If something here does
not match what you see, check the version in **Settings** against
[CHANGELOG.md](CHANGELOG.md). The application itself is developed at
[ArasaniRohithReddy/shot2code](https://github.com/ArasaniRohithReddy/shot2code).

- [First run](#first-run)
- [Choosing a model provider](#choosing-a-model-provider)
- [Generating your first page](#generating-your-first-page)
- [Using more than one screenshot](#using-more-than-one-screenshot)
- [Refining the result](#refining-the-result)
- [The Code tab](#the-code-tab)
- [Versions and retries](#versions-and-retries)
- [Recent projects](#recent-projects)
- [Importing an existing project](#importing-an-existing-project)
- [Preview, CodePen and sharing](#preview-codepen-and-sharing)
- [Exporting a project](#exporting-a-project)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Settings](#settings)

## First run

Install it with the [install guide](INSTALL.md), then start it. The first launch
takes about a minute while the bundled backend comes up; the splash screen stays
until it answers.

The chat panel shows a **provider status callout**. It only states what the app
can actually see from the window:

- *"No model provider saved in this browser"* — no key has been entered here. The
  app will still try credentials it cannot see from the UI, such as a GitHub
  Copilot sign-in or a key in `backend/.env`.
- *"… saved on this device"* — a key exists.

It never claims a provider is connected or verified, because that is only proved
by a real request. The callout's actions are **Add a key in Settings** and
**Setup guide**.

## Choosing a model provider

You need **one** provider.

### GitHub Copilot (no API key)

If you already use the GitHub CLI, this is the least work:

```powershell
gh auth login        # or: copilot
```

Restart shot2code and open **Settings** — it shows which account was picked up.
An active Copilot subscription is required.

Credentials are resolved in this order:

1. A token pasted into **Settings**
2. `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`
3. A stored `copilot` CLI login
4. A stored `gh auth login`

If you would rather use a token, create a fine-grained token with the
**Copilot Requests** permission and paste it into Settings.

Settings lists the models your plan actually offers. Tick the ones you want and
each generation produces one variant per selected model; leave them unchecked to
let shot2code choose. Models that cannot read images are hidden, because turning
a screenshot into code requires image input — an empty list usually means your
plan currently has no vision-capable model.

### API keys

Paste a **Gemini**, **Anthropic** or **OpenAI** key into **Settings**. Keys are
stored on this device and sent with the generation request to that provider only.

Two capabilities need a specific provider:

| Capability | Needs |
| --- | --- |
| Video / screen-recording input, asset extraction | A Gemini key |
| Image generation, image editing, background removal | `REPLICATE_API_KEY` in `backend/.env` — there is no Settings field, so this is only available when running from source |

## Generating your first page

1. Choose an input: upload a screenshot, paste a URL, write a description, or
   record the screen.
2. Pick the output stack (see the [stack list](README.md#output-stacks)).
3. Generate. Several variants are produced in parallel — one per selected model —
   so you can compare and keep the closest one.

Behind the scenes the model calls tools (create a file, edit a file, extract
assets, render a screenshot preview) and shot2code runs them locally and feeds
the results back. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Using more than one screenshot

When you upload more than one screenshot, shot2code asks how they relate. The
answer changes what the model is required to produce:

| Mode | Behaviour |
| --- | --- |
| **Separate pages** (default) | One navigable route or view per screenshot; none may be omitted |
| Responsive views | One page, with breakpoints inferred from the screenshots |
| UI states | One interface, with interactions that move between the states |
| Supporting references | Screenshot 1 is the target; the rest clarify details |

If only one of several screenshots shows up in the result, upload them together
and pick **Separate pages** — that mode makes the model account for every view.

## Refining the result

- **Say what to change** in the chat panel. A new version is created; the previous
  one is kept.
- **Select an element** in the preview and describe the change to scope an edit to
  that element.
- A new project offers three starter suggestions (for example *Make the layout
  responsive*, *Fix accessibility issues*, *Polish spacing and typography*). They
  **insert** the full instruction into the composer so you can edit it first —
  nothing is sent on your behalf.

## The Code tab

The Code tab is the authoritative project source: a keyboard-navigable file tree,
file tabs (shown once a project has more than one file), and an editor.

- Badges tell you what a file is: **Entry**, **Preview**, **Read-only**,
  **Generated**.
- **Format** reflows HTML, CSS, JavaScript and JSON. It is never automatic, never
  evaluates the file, refuses component source (JSX/TSX/Vue) instead of rewriting
  it, and leaves the file untouched when the syntax is ambiguous or unbalanced —
  so exports keep their original bytes.
- **Copy**, **Download** and **CodePen** sit next to it.
- The status bar shows the language and line count (for example *HTML · 26 lines*),
  the hint *"Tab moves focus outside the editor; Ctrl+] indents"*, and the reason
  CodePen is unavailable when it is.
- The file explorer is collapsible and remembers your choice; it opens by default
  only when a project has more than one file.

## Versions and retries

Every generation is a version you can step back through. Retrying a version
reuses the models that produced the original variants, and the retry keeps a link
to the version it re-rolls, so it does not look like an unrelated branch.

The variants strip appears only when a version actually has more than one variant.

## Recent projects

Projects, versions and prompts are saved in a local SQLite database
(`history.sqlite3` under `%LOCALAPPDATA%\shot2code\`), so **Recent projects** can
reopen earlier work. Saves are debounced, so ordinary typing does not thrash the
disk.

Deleting a project removes it and every saved version from the device. Nothing is
uploaded anywhere.

## Importing an existing project

**Import → Folder, ZIP or source files** takes a project folder, a ZIP archive, or
individual source files.

shot2code validates paths and size limits, ignores dependency and build-output
directories, rejects unsafe or malformed input, and detects the likely framework
from package metadata, source files and CDN tags — **without executing** any of
the project's configuration or application code.

After inspection you choose:

- **Use as design context** — only a compact summary is kept and added to the
  design-system context for later prompts, or
- **Open editable project** — the normalized file payload is handed to the editor.

Raw source is held only for that active handoff; it is never written into
persisted project context. The active context is shown above every input tab and
can be cleared.

Note that imported component paths are naming and API context. A generated
preview is self-contained, so it will not resolve imports from your local
project.

## Preview, CodePen and sharing

The preview is a **derived** artifact, not the source of truth: browser-ready
local CSS, JavaScript, images, SVGs and encoded fonts are inlined where possible.
If a framework build or a local asset cannot be represented safely, the preview
shows a deterministic fallback or diagnostic while every source file stays
editable and downloadable.

Preview documents run in an opaque-origin sandbox with a restrictive
Content-Security-Policy; select-and-edit talks to the app through validated,
per-preview messages rather than direct parent-window access.

**CodePen** is offered only when the selected stack can honestly run in a
browser-only Pen. Sharing always asks first, because the code leaves your device
and a public Pen may be visible to others. For build-dependent projects, download
the project folder instead.

## Exporting a project

Two shapes:

- **Single HTML** — keeps the generated document intact, pins the working Babel
  runtime where one is used, and bundles downloaded images and fonts under
  `assets/`.
- **Project folder** — a Vite project using an explicit strategy per stack. HTML
  and CDN stacks get a deterministic static-copy production build so inline
  modules and import maps are not rebundled or reordered; React and Preact use
  Vite's framework build path when the generated source is safely transformable,
  and a documented Vite HTML fallback when it is not.

When the editor holds a multi-file project, export treats that source tree and its
declared entry point as authoritative — even if the preview used a composed HTML
fallback — and preserves existing package and framework configuration. If there is
no valid root `package.json` build command, export keeps every source file and
adds a **Safe fallback** note instead of generating a plausible but potentially
broken scaffold.

## Keyboard shortcuts

Press **Ctrl+/** (or the keyboard button in the rail) for the complete reference.

| Shortcut | Action |
| --- | --- |
| `Ctrl+1` … `Ctrl+4` | Preview, Code, Chat, Versions |
| `Ctrl+3` (again) | Collapse the chat panel on wide windows; `Ctrl+1` or `Ctrl+4` bring it back |
| `Ctrl+Shift+Enter` | Retry an AI-generated version |
| `Ctrl+Alt+N` | New project |
| `Ctrl+Alt+I` | Import |
| `Ctrl+Alt+U` | Upload |
| `Ctrl+Alt+S` | Settings |
| `Ctrl+Alt+E` | Export the current project |
| `Ctrl+/` | Shortcut reference |
| `Tab` / `Ctrl+]` (in the editor) | Move focus out of the editor / indent |

Navigation shortcuts pause while you are typing or while a dialog is open.

## Settings

Settings holds your provider keys and model selection, shows the running version
and the update state (**Check now**, download progress, **Restart & install**),
and reports whether the screenshot-preview browser is available.

Screenshot preview lets the agent render its own output in a headless browser and
check its work. Chromium ships with the desktop app; if it is unavailable,
Settings says so and the app skips that tool.
