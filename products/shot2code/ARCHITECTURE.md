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
disk. Runtime HTTP and WebSocket URLs cross from main to the sandboxed preload
through synchronous IPC, because Vite bakes environment variables at build time
and `file://` has no usable origin. The preload uses no unsupported Node module;
if preload initialization fails, every desktop bridge would disappear at once.

Generation streams over a **WebSocket** to that local backend; everything else is
plain HTTP on the same loopback origin.

The shell also owns native feedback submission and window state. **Help →
Feedback** calls a startup-registered IPC handler; an authenticated GitHub CLI
may create the issue directly, otherwise the renderer receives safe copy,
download and browser fallbacks. Native bounds/maximized state is validated,
written atomically and recovered onto a visible display.

## Startup

Startup is deliberately staged, because the packaged backend is a frozen Python
tree that Windows may still be scanning:

1. **Core routes first.** Health, settings and model catalogue, design system and
   history are imported before the server starts answering.
2. **Heavy routers on first use.** Generation, evaluation and the project tools
   are imported the first time a request needs them, not during startup.
3. **Core-health head start.** Chromium and Copilot discovery waits five
   seconds, then runs as bounded background work. This lets the shell receive
   initial health before Windows antivirus scans newly written browser/SDK
   processes.

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

After `did-finish-load`, `desktop/renderer-health.js` waits for the renderer to
settle and inspects `readyState`, root-child count and body text length. A truly
blank top-level renderer is reloaded exactly once. If it is still empty after the
second load, the shell logs the outcome and replaces it with a static recovery
screen whose manual reload button needs no React bundle; project data remains in
the separate SQLite store.

A generation started during that window is not lost: the deferred-route
middleware **accepts the WebSocket handshake before the generation graph has
finished importing** and replays the connect event to the application once it
is ready, rather than dropping the first run after launch.

## The agent loop

The backend runs an agent loop rather than a single prompt:

1. The request (images, URL, description or recording, plus the chosen stack and
   models) is turned into a prompt.
2. The model calls tools — `create_file`, `edit_file`, `extract_assets`,
   `screenshot_preview`, image generation/editing, canonical web/page/photo/icon
   research, and (for Copilot runtimes) enabled MCP/Skill capabilities.
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
file and shell tools are excluded — only shot2code's canonical tools are exposed,
plus the MCP servers and Agent Skills the user has turned on. Canonical `search_web`, `read_web_page`, `search_free_images`, `search_icons`
and image tools are provider-neutral definitions wrapped by each runtime. Their
availability is derived from validated request configuration, so a model is
never offered a tool the build cannot run or the user did not consent to.

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

The local Ollama action is a renderer preset over this same connection, not a
sixth provider. It writes the OpenAI-compatible loopback URL
`http://localhost:11434/v1`, clears stale remote credentials/model ids and relies
on the existing localhost no-credential exception. Ollama/model installation,
hardware, licences and vision/tool-call support remain outside shot2code; native
provider routing is unchanged.

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
approve a tool. Google Stitch is the featured template. Figma MCP endpoints are
filtered from registry results and migrated entries are disabled because Figma
restricts both desktop and hosted transports to clients listed in its MCP
Catalog.

`/api/skills` owns Agent Skills. An import from a local folder or a public
GitHub folder URL is validated (front matter, normalised relative paths with
traversal rejected, bounded file count and size), recorded with its provenance,
and stored under the shot2code data directory **disabled**. Because the GitHub
Contents API does not return file bodies in a directory listing, each file is
fetched individually rather than imported empty. A skill's script files are
stored as resources and are **never executable**: the agent is given only
shot2code's own `create_file` and `edit_file` tools, and the SDK's built-in
shell and host-filesystem tools are excluded.

MCP and skills are exposed through the SDK, so only Copilot subscription variants
and BYOK variants receive them. Canonical web search is different: native
OpenAI, Anthropic and Gemini use their existing tool serializers, while both
Copilot runtimes receive the same definition as a custom tool. A session gets
exactly one search route. Copilot built-in `web_search` is enabled only when the
canonical tool is unusable; built-in `web_fetch` and URL permissions are
rejected because their results cannot be bounded before reaching the model.
Environment values and request headers are excluded from every safe-metadata
projection, so they cannot reach a log line, a diagnostic or an API response.

Nothing here is on the critical path for a direct generation: an invalid,
incomplete or switched-off integration becomes a diagnostic that travels with
the response, not an error that stops the run.

The renderer's Chat **Tools** popover joins request settings with live local
capability/Skill reads. It reports project editing, Chromium preview readiness,
web/page/photo/icon consent, generated-image readiness/cost, active MCP server
count/write scope and enabled Skills. It mutates nothing; **Manage tools** is the
only path from the inventory to Settings.

### Design sources

The renderer exposes seven input tabs — Upload, URL, Text, Import, Figma,
GitHub and Stitch — but they all converge on the same project/history contract.
The [input-tab guide](INPUT-TABS.md) describes their user-facing behavior.

`/api/figma` parses a Figma URL into a file key and optional node ids, requests
rendered images, original image-fill URLs and export-marked nodes, and streams
assets under per-file/aggregate budgets. The renderer can hold that response as
an optional frame preview before generation; the later generate action reuses
the same rendered evidence rather than fetching it twice. Optional asset errors
remain partial-success. Only `https://api.figma.com` receives the scoped PAT.

`/api/storybook-context` accepts four source kinds: selected JSON files, a built
folder, a ZIP or a public HTTPS root. Every route normalizes to only
`index.json`, `manifests/components.json` and `manifests/docs.json` with supported
schema, duplicate-key, path/case-collision, symlink/encryption, count, byte and
text bounds. URL import derives those fixed resource paths from the public root,
uses the same public-only page resolver and revalidates redirects; it never asks
for `iframe.html`, stories, CSF, bundles, addons, loaders or play functions. The
output is compact untrusted component context, never executable code.

Google Stitch is reached as an ordinary trusted MCP server or through the
bundled experimental `@google/stitch-sdk` over Electron IPC. Stitch-only opens
localized HTML, screenshot, images, stylesheets, nested CSS assets/fonts,
`srcset` and available `DESIGN.md`; LLM conversion is explicit. The asset
localizer pins public DNS, revalidates redirects, checks MIME/magic and byte/file
budgets, sanitizes SVG and fails closed instead of retaining rejected hotlinks.

`/api/github-repository` downloads public archives without a token or private
archives with a separate fine-grained repository token. Text enters the
never-execute scanner and bounded PNG/JPEG/GIF/WebP enters the binary project
path. The renderer first opens that project locally. A blank instruction stops
there; a non-empty instruction starts an update run with the tab's selected
models and design system. Stack detection is preserved and falls back to the
current default only when no frontend stack is found. Copilot OAuth is never
broadened or reused.

`/api/url-design-inspector` runs local Chromium while every HTTP(S) request is
fulfilled through a pinned public-only resolver. Unsafe schemes/addresses,
WebSocket/EventSource/service workers, media and non-GET/HEAD requests are
blocked under request/resource/total/deadline/element budgets. It scrolls lazy
content in bounded steps and captures full-page desktop/tablet/mobile evidence.
Each viewport returns actual document/capture dimensions plus `blank`,
`truncated` and `fullPage` metadata; capture height is capped at 40,000px and
area at 36 million pixels. The result is computed evidence, not recovered source
or asset rights.

All capture credentials are stripped from generation/history/export payloads.
All design text is wrapped as untrusted evidence, and imported binary references
are canonicalized as `shot2code-local:/local-assets/...` for persistence then
rebound to the current backend origin on restore.

### Web and image tools

`backend/web_search/` owns two independent canonical tools. `search_web` uses
fixed Tavily/Exa HTTPS endpoints, no redirects, local domain re-filtering,
bounded snippets and a `WebSearchRuntime` budget of three calls/turn and ten per
generation. `read_web_page` has separate consent and budget state: public
query-free HTTP(S), standard ports, public-only pinned DNS, up to three
revalidated redirects, no cookies/auth/subresources, HTML/text/Markdown/JSON
only, 512 KB input and 16,000 extracted untrusted characters, two calls/turn and
five/generation. Failed outbound attempts spend budget. Copilot built-in
`web_fetch` stays denied because the runtime hands its unbounded result to the
model before application policy can inspect it.

`backend/free_images/` owns `search_free_images`. Openverse results are locally
restricted to CC0/Public Domain Mark and require source/licence URLs. Every DNS
answer, redirect, MIME/magic pair, byte count and decoded pixel count is checked
before local persistence. It does not call generic web search because a web
result says nothing about reuse rights.

`backend/icon_search/` owns `search_icons`. The origin is fixed to
`https://api.iconify.design`; no credential, cookies, environment proxy or
redirect is accepted. Search and SVG bodies have independent budgets. Automatic
results must name a permissive SPDX licence. Bounded XML sanitization removes
entities, scripts, event handlers, style/foreignObject/animation/media and
external URL references. A deterministic local SVG embeds collection, author,
source, licence and retrieval provenance plus brand/trademark state.

`backend/image_generation/` separates catalogue, settings, provider calls,
normalization and per-prompt outcomes. Replicate remains default-compatible;
Cloudflare Workers AI and OpenAI-compatible endpoints are additive. Every
response passes the same URL/byte/data normalization boundary. An all-failed
batch is a real tool failure. Non-network credential, billing, quota,
permission, model or configuration failures trip `AgentToolRuntime`'s
per-generation circuit breaker immediately; two failed batches also block
unknown/network repeats. The block returns a safe alternative action rather
than repeatedly calling a provider that cannot succeed.

## Reviewing generated output

The Review workspace renders two to four sandboxed frames at actual CSS widths
(320–1920; defaults 1440/768/390) and runs two evidence paths.

The deterministic source audit produces findings with severity, one of
Accessibility/Structure/Responsive/Document categories, evidence, guidance and
safe file labels. Each frame independently runs bounded browser inspection for
horizontal overflow, accessible names, custom focus visibility, 24px target-size
advisories, image alternatives/load failures, headings and main landmarks. It
stops at 2,500 elements and 32 findings per viewport. A frame error is isolated;
source and other viewport results survive.

Filters combine severity, category and query. Filtered select-all operates only
on visible ids and preserves hidden selections. The health reducer distinguishes
not-run, stale, error/warning/advisory, partial and healthy states and names
ready/failed/pending runtime coverage. The binding includes commit, variant,
source hash and viewport widths, so any changed dimension makes the run stale.

Selected findings can be composed for user review or applied against the exact
bound commit/variant. Optional AI review uses the recorded model with an empty
canonical tool set — no MCP, Skills, web, shell or writes — and remains separate
from deterministic evidence. Schema-v2 JSON includes binding, category counts,
runtime coverage and per-viewport metadata with safe relative labels and no
credential. It explicitly states that automated evidence is not WCAG
certification.

The Design Inspector remains a second local pass over composed source and emits
`DESIGN.md`, `SKILL.md` and a palette PNG. The URL inspector is the complementary
browser-computed path before generation; Figma preview is the rendered-frame path
before a model call.

## Workspace layout state

Pane widths, active Preview/Code/Review surface, HTML/Stack preview source and
preview zoom are **view state**, held in renderer local storage and clamped to
the current viewport. Native window bounds and maximized state are stored
atomically in the Electron user-data directory and recovered onto a visible
display. They are separate from project data on purpose: resizing or changing
views cannot create or mutate a version.

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

Projects, commits, variants, prompts, messages and activity are stored in local
SQLite behind `/api/history` list/load/rename/append/select/delete routes.

- Windows: `%LOCALAPPDATA%\shot2code\history.sqlite3`
- macOS source runs: `~/Library/Application Support/shot2code/`
- Linux source runs: `$XDG_DATA_HOME/shot2code/` or `~/.local/share/shot2code/`
- Override: `SHOT2CODE_DATA_DIR` or `SHOT2CODE_HISTORY_DB_PATH`

Commits record parent and optional retry source; ancestry walks reject cycles.
Variants record requested/concrete model identities, option status/timing/error,
messages and saved agent activity. The renderer expands the current-project
History into requested models, all saved options, prompts/responses, attachment
counts, activity and branch/retry navigation.

Full history reuses the list endpoint in 500-project pages and loads one complete
project only when selected. The dialog searches project summaries and exposes
every version/option/model/prompt/response/attachment/activity/status/timing/error
and ancestry record before **Open project**. It is read-only until opening and
creates no second data store.

The database uses WAL, foreign keys and idempotent migrations outside the
installation directory; NSIS leaves app data in place. Saves are debounced. Chat
reconstructs the active branch chronologically, including assistant responses.
Restore validates the selected variant and repairs a failed/cancelled selection
to a completed sibling when available, then restores project/version/file.

## Preview

The file tree is the authoritative project source. The preview is a **derived**,
self-contained HTML artifact: browser-ready local CSS, JavaScript, images, SVGs
and encoded fonts are embedded when that can be done safely. When a framework
build or a local asset cannot be represented, the preview renders a deterministic
fallback or diagnostic instead of guessing, and every source file remains
editable and downloadable.

At **100%** the fixed-width desktop canvas is centred inside a neutral framed
viewport rather than anchored to the left edge; a window narrower than the canvas
scrolls the frame horizontally instead of clipping the start of the page.
Desktop zoom runs from 25% to 200% with −/+/Fit/100% controls and scrollable pan;
mobile stays fitted. A single animation-frame-coalesced `ResizeObserver` rejects
hidden/zero-size geometry and unchanged measurements, preventing narrow-window
flicker and iframe reload churn. Scale and version (**History _n_/_m_**) remain
separate, labelled controls.

Security properties of a preview document:

- rendered from `srcDoc` in an iframe **without** `allow-same-origin`, so it runs
  in an opaque origin and cannot read app state, cookies or storage;
- a restrictive Content-Security-Policy, a `no-referrer` policy, and a permissions
  list denying camera, microphone, geolocation and display capture;
- select-and-edit uses a per-preview message bridge — messages are accepted only
  when the channel and a random per-preview nonce match, and payloads are capped.

The agent-facing `screenshot_preview` tool captures full-page desktop/mobile
images and returns the image plus bounded body-text/rendered-element counts,
sanitized console/page errors and `nearly_blank` metadata. Problematic previews
remain successful image captures but explicitly tell the model to repair runtime
failures before declaring the page complete.

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
there. Renderer-health entries distinguish the one automatic reload from the
static recovery screen. It is the first thing to read for a blank window or a
backend that never becomes ready. An install that refuses to replace a running
backend leaves its own trail in `%TEMP%\shot2code-installer-preinstall.log`.

Console diagnostics — the prompt preview in particular — are encoded for whatever
the active output stream can represent, including a strict cp1252 Windows
console, so box-drawing characters or prompt text cannot raise a
`UnicodeEncodeError` in the middle of a generation. That path matters when
running from source; the packaged app writes to the log file above.
