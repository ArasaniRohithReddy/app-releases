# shot2code architecture

A summary of how the shipped Windows app is put together, written for reviewers
who want to know what runs where. The implementation lives in the
[source repository](https://github.com/ArasaniRohithReddy/shot2code).

## The three pieces

| Piece | Technology | Role |
| --- | --- | --- |
| Renderer | React + Vite | The whole UI: chat, preview, Code tab, History, Help, settings |
| Backend | FastAPI (Python) | The agent loop, tools, model catalogue, project history, import scanning, export |
| Desktop shell | Electron | Starts the backend, verifies readiness, loads the built UI, owns zoom, the log folder, the GitHub device sign-in and the bundled Stitch SDK |

In the packaged app the shell starts the frozen backend on a **free local port**,
waits for its `/api/health` endpoint, and only then loads the built frontend from
disk. The port is injected into the renderer through preload, because Vite bakes
environment variables in at build time and cannot know it.

Generation streams over a **WebSocket** to that local backend; everything else is
plain HTTP on the same loopback origin.

## Startup

Startup is deliberately staged, because the packaged backend is a frozen Python
tree that Windows may still be scanning:

1. **Core routes first.** Health, settings and model catalogue, design system and
   history are imported before the server starts answering.
2. **Heavy routers on first use.** Generation, evaluation and the project tools
   are imported the first time a request needs them, not during startup.
3. **Optional probes in the background.** Chromium and Copilot discovery run as
   bounded background work; neither can delay `/api/health`.

The shell's readiness check is strict rather than optimistic: it requires
HTTP 200 *and* a genuine `{"ok": true}` body, aborts at once if the backend
process exits or cannot be spawned, records how long readiness took in the log,
and applies a 90-second cold-start deadline.

Deferred imports fail loudly. If a lazily loaded router cannot be imported, that
request returns an error and health fails from then on, so a backend that cannot
generate never reports itself healthy. Chromium is advertised as available only
after it has actually launched, and it is closed during backend shutdown. Its
**first** launch is given a longer budget than later ones, because that is when
antivirus software scans a newly written tree.

A generation started during that window is not lost: the deferred-route
middleware **accepts the WebSocket handshake before the generation graph has
finished importing** and replays the connect event to the application once it
is ready, rather than dropping the first run after launch.

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

The stream carries an application-level **heartbeat every 15 seconds**, so a long
Copilot run is not mistaken for a dead connection, and the client ignores it as
traffic. Once every expected variant has reached a terminal state, an abnormal
socket closure is treated as completion rather than reported as a failure; if the
selected variant was cancelled or failed while another finished, the usable one
is selected automatically. A failure the backend actually diagnosed keeps its own
message and points at the diagnostic log instead of being replaced by generic
advice.

### The model catalogue

`/api/models` answers what can actually be used right now. It reports which
providers have a usable credential and what each model supports — **without
returning the credential itself**. GitHub Copilot models are discovered from the
signed-in account, so the list is that account's real entitlement; OpenAI,
Anthropic and Google Gemini come from maintained catalogues that are validated
against the models the build knows how to drive. A fifth group, `sdk-byok`,
lists the run identities a usable BYOK connection can serve.

The renderer keeps a provider-neutral list of selected ids. Older settings
blobs are migrated into it: a `copilotModels` list moves across verbatim, and a
single `codeGenerationModel` is only treated as a real choice when it differs
from the historical default, so upgrading does not silently pin everyone to one
model. Ids the catalogue no longer knows are reported as stale and skipped rather
than deleted — and if the catalogue cannot be loaded at all, the saved selection
is left alone instead of being reset.

### Run identity and runtime

A selection is not just a model; it is a **run identity plus the runtime that
executes it**. The generate request carries one entry per pick — the identity,
the base model behind it, and whether it runs `native` or `copilot-byok` —
in the order the user arranged them, de-duplicated by identity alone.

A native identity is the model id itself. A BYOK identity is
`sdk-byok/<provider>/<base model>`; no model id starts with that prefix, so the
two can never collide. That is what allows a model and its BYOK counterpart to
occupy one run as two separate variants, and it is why a native pick is never
re-routed when a BYOK connection is configured. The identity — not the base
model — is what the stream reports back, what a variant records, and what a
retry replays.

### Providers

Provider adapters live in `backend/agent/providers/` and implement a shared
session protocol; a factory maps each run identity to its provider and runtime.

GitHub Copilot is the unusual one. The Copilot SDK is an *agent runtime* that owns
its own planning loop, while shot2code's engine also owns a loop. The provider
bridges the two: each Copilot tool invocation is parked and handed back to the
shot2code engine, which resolves it once the tool has actually run. Copilot's own
file and shell tools are excluded — only shot2code's tools are exposed, plus the
MCP servers, Agent Skills and opt-in web search the user has turned on. The
image tools are advertised only when an effective Replicate key exists, so a
model is never offered a tool the build cannot run.

### Copilot SDK BYOK

A BYOK identity runs on that same SDK bridge, but against the endpoint and
credential configured in Settings rather than a Copilot sign-in. The connection
is validated into a narrow, typed description before anything uses it: the
provider must be one of `openai`, `azure` or `anthropic`, an endpoint must be
`https://` unless it is loopback, and a credential is required unless the
endpoint is an OpenAI-compatible loopback host. The direct OpenAI and Anthropic
keys are never consulted as a fallback for it, and there is no Gemini provider
in the SDK to map onto.

The **wire API** is derived rather than assumed. When the connection does not
pin one, a base URL of its own resolves to Chat Completions — the interface
almost every OpenAI-compatible server implements — and a provider's own
endpoint resolves to Responses. The frontend omits the field entirely when the
user chose Automatic, which is how the backend is asked to decide; a pinned
value is sent and always wins.

An endpoint that serves models the catalogue does not know gets a **custom run
identity**, `sdk-byok/<provider>/custom/<url-encoded model>`. The model name is
URL-encoded so a slash or colon inside it cannot be mistaken for structure, and
the identity resolves back to the exact name to send. Several such models may be
configured on one connection, each becoming an independently selectable
identity. Such a model runs under a neutral, *non-reasoning* compatibility
template: it needs a known model to describe prompt shape and limits, but no
thinking level is derived from it or sent. The catalogue publishes one entry per
configured endpoint model rather than the whole family, because listing
catalogue names against someone else's model would be untrue.

`/api/integrations/validate` answers the same question the generate socket
would, using the same validator, and nothing else: no endpoint is contacted, no
server is started, and the response carries presence flags, a host name and
diagnostics rather than any credential.

### Live provider checks

`/api/providers/validate` is the opposite kind of check: it makes one
deliberately tiny request — a single-word prompt capped at 16 tokens — to prove
a credential actually works. Every provider error is normalised into one
category (`ready`, `credentials`, `billing`, `quota`, `permissions`, `model`,
`network`, `configuration`, `unknown`) so the UI can offer the right next step
instead of a stack trace, and the message is scrubbed of anything that was sent.
For an OpenAI-compatible BYOK connection the check first asks the endpoint what
it serves at `/models`, bounded and de-duplicated, so the model picker can offer
real ids; Azure and Anthropic have no equivalent route and say so.

**That listing is optional, and it is not the check.** When a model is already
configured, a `/models` route that is absent or refuses the inference credential
no longer fails the check: the configured model is exercised directly and the
endpoint's own answer about it is what gets reported. Credential failures keep
their own category, and a discovery failure with no configured model is still
surfaced as a configuration problem with the action that resolves it.

### In-app sign-in

In the packaged desktop app, **Sign in with GitHub** runs a **GitHub OAuth
device flow** owned by shot2code itself: the shell requests a device code,
displays the one-time code, opens the browser and polls for the token. The
application is registered with a **public client id and no client secret**,
because a desktop application cannot keep one; shot2code neither ships a secret
nor reuses another product's client id. The access and refresh tokens are
persisted under the Electron user-data directory, encrypted with `safeStorage`,
and refreshed when they expire. The backend is then restarted on the same port
with the token in `COPILOT_GITHUB_TOKEN`, and that restart is **serialised**, so
concurrent sign-in or disconnect actions cannot race a half-started process.
Disconnecting clears only shot2code's own copy — an external `gh` or Copilot CLI
session is untouched.

Where that flow is unavailable — the browser development build —
`/api/copilot/login` starts, polls and cancels a sign-in performed entirely by
the **official** GitHub Copilot CLI (falling back to the GitHub CLI). shot2code
runs a fixed argument vector, never a shell, drains the CLI's output without
storing it, and afterwards re-probes the existing credential ladder. No token
crosses the API in that mode. The start and cancel routes are guarded to local
and packaged-app origins because they spawn or kill a process.

### MCP servers, the registry and skills

Configured servers are validated the same way and bounded: at most eight, with
limits on arguments, environment entries, headers, tool names and timeout. A
`stdio` server is spawned as an explicit argument vector — never through a shell
— and an `http`/`sse` server must use `https://` unless it is loopback. A server
is handed to a session only when it is both enabled and trusted, and a
permission handler keeps it read-only unless write tools were explicitly allowed.

`/api/mcp-registry` proxies a search of the official registry at
`registry.modelcontextprotocol.io`, keeps only remote `https://` entries, and
collapses several published versions of the same server to the latest active
one. What it returns is a **draft**: installing an entry writes a server that is
disabled and untrusted, so a registry response can never start a process or
approve a tool. The featured Figma Desktop, Figma Remote and Google Stitch
templates are ordinary drafts with their transport and endpoint pre-filled.

`/api/skills` owns Agent Skills. An import from a local folder or a public
GitHub folder URL is validated (front matter, normalised relative paths with
traversal rejected, bounded file count and size), recorded with its provenance,
and stored under the shot2code data directory **disabled**. Because the GitHub
Contents API does not return file bodies in a directory listing, each file is
fetched individually rather than imported empty. A skill's script files are
stored as resources and are **never executable**: the agent is given only
shot2code's own `create_file` and `edit_file` tools, and the SDK's built-in
shell and host-filesystem tools are excluded. Opt-in web search adds search to
Copilot and BYOK runtimes and nothing else.

Because MCP, skills and web search are exposed through the SDK, only Copilot
subscription variants and BYOK variants receive them; a native OpenAI, Anthropic
or Gemini variant runs on that provider's own client and is never given them.
Environment values and request headers are excluded from every safe-metadata
projection, so they cannot reach a log line, a diagnostic or an API response.

Nothing here is on the critical path for a direct generation: an invalid,
incomplete or switched-off integration becomes a diagnostic that travels with
the response, not an error that stops the run.

### Design sources

`/api/figma` parses a Figma URL into a file key and optional node ids, asks the
REST API for rendered images of the top-level renderable frames, and converts
them into local data URLs. It talks to `https://api.figma.com` and nothing else,
authenticated only with the personal access token supplied in the request.
Exported SVG files are rasterised in the app before they are sent, so a model
always receives a picture rather than markup it might mis-read.

Google Stitch is reached two ways: as an ordinary MCP server, or through
`@google/stitch-sdk` bundled in the Electron package and driven over the shell's
own IPC — key validation, prompt-to-screen generation and project or screen
import. HTML and image downloads made on its behalf are HTTPS-only and
size-bounded. The SDK is published by Google Labs and is explicitly not an
officially supported Google product, so it is treated as experimental.

Both credentials are **capture-only**: the settings projection that builds a
generation payload strips them, so they cannot reach a model, project history or
an export.

## Reviewing generated output

The Review workspace renders the preview artifact into two to four frames at
their **actual** CSS widths (320–1920, defaults 1440/768/390), so layout is
exercised rather than simulated, and measures horizontal overflow inside each
running frame.

The source audit is a deterministic pass in the renderer over the generated
source: a small tolerant HTML parser produces a node tree, and a fixed set of
rules reports semantic and accessibility findings with evidence, the affected
file and guidance. It is a source check, not a conformance assessment, and it
makes no network call.

A result is bound to the commit, the variant index, a hash of the source it read
and the widths it ran at. Any change to those marks the result stale rather than
letting it be read as current. Findings can be filtered by severity, searched and
selected in bulk; selected findings are grouped by rule into an instruction that
is placed in the composer for the user to send, or applied directly by **Fix
selected findings**, which addresses the **exact commit and variant that was
reviewed** rather than the current selection. The JSON report reduces file paths
to a leaf name and carries no credential of any kind.

An optional **AI review** runs against the model recorded on that variant, with
`canonical_tools_override=[]` — no tools, no MCP servers, no skills, no web
search, no shell and no file writes. Its findings are kept in a separate list;
the deterministic local pass remains authoritative. A variant with no recorded
model identity cannot be AI-reviewed, and the UI says so rather than guessing a
model.

The **Design Inspector** is a second local pass over the composed source. It
counts repeated colours, CSS variables, typography, spacing, radii, shadows,
motion and semantic components, and renders them as `DESIGN.md`, `SKILL.md` and
a palette PNG. It reads the source the project declares rather than a browser's
computed styles.

## Workspace layout state

Pane widths — the chat/History divider and the multi-file explorer divider — are
**view state**, held in the renderer's own local storage and clamped to the
current viewport on every resize. They are stored apart from project data on
purpose: the history database records commits, options, retries and prompts, and
nothing about how wide a pane was. Dragging a divider therefore cannot create or
mutate a version.

The dividers are exposed as `role="separator"` controls with orientation,
current/minimum/maximum values, value text and the pane they control, so they are
operable from the keyboard as well as the mouse.

Help is a renderer dialog whose links all point at the published hub — the
product page, the release history and the guides in `products/shot2code/` — so it
cannot drift from what is actually published. Its one privileged action is
"open diagnostic logs", which asks the shell to reveal the backend log's folder;
in the browser development build there is no such log and the action reports that
instead of failing silently. Zoom lives in the shell, in deterministic 10-point
steps bounded to 50–300%, replacing Chromium's own accelerator handling so a
single keystroke does not zoom twice.

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
the concrete run identity behind it, which is what the UI displays and what a
retry replays. Saves are debounced.

The database uses WAL, foreign keys and versioned, idempotent migrations, and it
lives **outside the installation directory**. The NSIS package sets
`deleteAppDataOnUninstall: false` explicitly, so replacing or removing the
installed program leaves projects, versions and prompts intact.

The chat panel reconstructs the **active branch** from that store in
chronological order: prompts, attached images or recordings, selected-element
context, the run identity, generation state, and the persisted assistant
responses — shown in expandable blocks rather than reduced to a ready-state
summary. History remains the durable cross-branch timeline.

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

**Stack preview** is an additional view over the same sandbox: instead of the
composed document it renders the generated project's controlled Vite HTML, React
and Preact files. It executes **no package script and no project
configuration** — it is a render, not a build — and becomes available once a
generation has reached a terminal state. Fragment navigation is intercepted
inside the sandboxed document so a `file://` fragment cannot be treated as a
blocked navigation in the packaged app.

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

Because some stacks expand a single generated document into a project layout at
export time, the Code tab exposes that projection as a read-only **Export
project** view beside **Current code**, so the file set a download will contain
is visible before the ZIP is produced.

## Packaging

- The backend is frozen with **PyInstaller**.
- Only `chromium-headless-shell` is bundled; the app always launches headless, and
  full Chromium would add several hundred megabytes.
- **electron-builder 26.15.3** produces the NSIS `.exe` (plus its `.exe.blockmap`
  and `latest.yml`), the `.msi` and the portable `.zip`, around **Electron
  44.4.3** with **electron-updater 6.8.9**. `npm audit --omit=dev` reports
  **0 vulnerabilities** for what is actually distributed.
- The `@google/stitch-sdk` package is installed in the desktop package so the
  Stitch integration works in the packaged app; it is reached only through the
  shell's IPC.
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
