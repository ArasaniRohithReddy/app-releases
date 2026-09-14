# shot2code architecture

A summary of how the shipped Windows app is put together, written for reviewers
who want to know what runs where. The implementation lives in the
[source repository](https://github.com/ArasaniRohithReddy/shot2code).

## The three pieces

| Piece | Technology | Role |
| --- | --- | --- |
| Renderer | React + Vite | The whole UI: chat, preview, Code tab, History, settings |
| Backend | FastAPI (Python) | The agent loop, tools, model catalogue, project history, import scanning, export |
| Desktop shell | Electron | Starts the backend, waits for it, loads the built UI |

In the packaged app the shell starts the frozen backend on a **free local port**,
waits for its `/api/health` endpoint, and only then loads the built frontend from
disk. The port is injected into the renderer through preload, because Vite bakes
environment variables in at build time and cannot know it.

Generation streams over a **WebSocket** to that local backend; everything else is
plain HTTP on the same loopback origin.

## The agent loop

The backend runs an agent loop rather than a single prompt:

1. The request (images, URL, description or recording, plus the chosen stack and
   models) is turned into a prompt.
2. The model calls tools — `create_file`, `edit_file`, `extract_assets`,
   `screenshot_preview`, and the image tools.
3. shot2code executes each tool **locally** and feeds the result back.
4. The loop ends with a project: a set of files and a declared entry point.

Several options can run in parallel, one per selected model, which is why a
generation can produce more than one candidate. The number is capped per run: up
to four for a first generation, two for an update or a video.

### The model catalogue

`/api/models` answers what can actually be used right now. It reports which
providers have a usable credential and what each model supports — **without
returning the credential itself**. GitHub Copilot models are discovered from the
signed-in account, so the list is that account's real entitlement; OpenAI,
Anthropic and Google Gemini come from maintained catalogues that are validated
against the models the build knows how to drive.

The renderer keeps a provider-neutral list of selected model ids. Older settings
blobs are migrated into it: a `copilotModels` list moves across verbatim, and a
single `codeGenerationModel` is only treated as a real choice when it differs
from the historical default, so upgrading does not silently pin everyone to one
model. Ids the catalogue no longer knows are reported as stale and skipped rather
than deleted — and if the catalogue cannot be loaded at all, the saved selection
is left alone instead of being reset.

### Providers

Provider adapters live in `backend/agent/providers/` and implement a shared
session protocol; a factory maps the selected model to its provider.

GitHub Copilot is the unusual one. The Copilot SDK is an *agent runtime* that owns
its own planning loop, while shot2code's engine also owns a loop. The provider
bridges the two: each Copilot tool invocation is parked and handed back to the
shot2code engine, which resolves it once the tool has actually run. Copilot's own
file and shell tools are excluded — only shot2code's tools are exposed.

## Project history

Projects, versions (commits), variants, prompts and variant messages are stored in
a local **SQLite** database with a versioned schema and tracked migrations, served
over an `/api/history` route group (list, load, rename, append version, update
selection, delete).

- Windows: `%LOCALAPPDATA%\shot2code\history.sqlite3`
- macOS (source runs): `~/Library/Application Support/shot2code/`
- Linux (source runs): `$XDG_DATA_HOME/shot2code/` or `~/.local/share/shot2code/`
- Override with `SHOT2CODE_DATA_DIR` or `SHOT2CODE_HISTORY_DB_PATH`

Commits record both a parent and, for a retry, the commit they re-roll, so retry
ancestry is explicit; ancestry walks detect and reject cycles. A retry reuses the
provider and model choices its source generation used, and each variant stores
the concrete model behind it. Saves are debounced.

## Preview

The file tree is the authoritative project source. The preview is a **derived**,
self-contained HTML artifact: browser-ready local CSS, JavaScript, images, SVGs
and encoded fonts are embedded when that can be done safely. When a framework
build or a local asset cannot be represented, the preview renders a deterministic
fallback or diagnostic instead of guessing, and every source file remains
editable and downloadable.

At **100%** the fixed-width desktop canvas is centred inside a neutral framed
viewport rather than anchored to the left edge; a window narrower than the canvas
scrolls the frame horizontally instead of clipping the start of the page. Scale
(**Fit / 100%**) and version (**History _n_/_m_**) are separate, labelled
controls.

Security properties of a preview document:

- rendered from `srcDoc` in an iframe **without** `allow-same-origin`, so it runs
  in an opaque origin and cannot read app state, cookies or storage;
- a restrictive Content-Security-Policy, a `no-referrer` policy, and a permissions
  list denying camera, microphone, geolocation and display capture;
- select-and-edit uses a per-preview message bridge — messages are accepted only
  when the channel and a random per-preview nonce match, and payloads are capped.

## Import

The import scanner parses **text only**. It never `require()`s or imports
`tailwind.config.*` or any other configuration or application module, and it runs
no install or build commands. It rejects path traversal, ignores dependency and
build-output directories, and enforces limits on archive size, entry count, file
count, per-file size and total decoded text.

Only a compact `ProjectContext` summary is persisted. The normalized file payload
exists for the active editable-import handoff and is not written into stored
context.

## Export

Export has an explicit strategy per stack rather than one generic scaffold
generator:

- **Single HTML** keeps the generated document intact, pins the working Babel
  runtime where one is used, and bundles downloaded images and fonts under
  `assets/`.
- **Project folder** produces a Vite project. HTML/CDN stacks use a deterministic
  static-copy production build so inline modules, import maps and script ordering
  are preserved; React and Preact use Vite's framework build path when the
  generated source is safely transformable, and a documented Vite HTML fallback
  when it is not.
- A multi-file source project is exported as-is, with its declared entry point and
  existing package/framework configuration preserved. With no valid root build
  command, export keeps every file and adds a **Safe fallback** note instead of
  inventing a scaffold.

## Packaging

- The backend is frozen with **PyInstaller**.
- Only `chromium-headless-shell` is bundled; the app always launches headless, and
  full Chromium would add several hundred megabytes.
- **electron-builder** produces the NSIS `.exe` (plus its `.exe.blockmap` and
  `latest.yml`), the `.msi` and the portable `.zip`.
- The UI is served over `file://` in the packaged app and `http://` in development.
  That difference is the source of most desktop-only bugs, so the shell uses a
  hash router, relative asset paths, and an explicit display-media handler.

## Updates

Per-user NSIS installs update through `electron-updater` against the public GitHub
Releases feed. `latest.yml` carries the installer's SHA-512 and the updater
refuses a download whose hash does not match.

There is a single guarded install entry point. Before installing, the bundled
backend, Copilot CLI and Chromium process tree is stopped **synchronously** with a
bounded timeout and the process ID is re-probed to confirm it is gone. If that
cannot be confirmed, the update is not started — the guard is released and the app
reports that it could not shut down safely, rather than overwriting a live
PyInstaller tree. Installs under Program Files (the MSI layout) are treated as
managed: self-update is disabled.

That guard lives in the *running* app, which cannot help a machine still on an
older build. The NSIS installer therefore repeats the check before it uninstalls
or replaces anything: it enumerates processes whose executable path sits under
the installed `resources\backend` directory, terminates each of those trees
synchronously, and verifies that none remains. Matching is by path, never by
process name, so an unrelated program with the same executable name is left
running. A tree that cannot be confirmed stopped aborts the replacement — an
actionable message interactively, a distinct exit code silently — and both paths
write to `%TEMP%\shot2code-installer-preinstall.log`.

## Diagnostics

```
%APPDATA%\shot2code-desktop\shot2code-backend.log
```

Backend startup, renderer load failures, crashes and console errors all land
there. It is the first thing to read for a blank window or a backend that never
becomes ready. An install that refuses to replace a running backend leaves its
own trail in `%TEMP%\shot2code-installer-preinstall.log`.

Console diagnostics — the prompt preview in particular — are encoded for whatever
the active output stream can represent, including a strict cp1252 Windows
console, so box-drawing characters or prompt text cannot raise a
`UnicodeEncodeError` in the middle of a generation. That path matters when
running from source; the packaged app writes to the log file above.
