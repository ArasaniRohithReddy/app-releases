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

## [0.6.0] — 2026-10-04

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.6.0) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.6.0)

The current stable release expands shot2code from screenshot generation into a
local-first design-source workspace.

### Added

- Figma REST import now preserves original image fills and export-marked nodes
  beside rendered frames as bounded, reusable local assets.
- Google Stitch defaults to **Stitch only**: localized HTML, screenshot, images,
  stylesheets, nested CSS assets/fonts, `srcset` and available `DESIGN.md` open
  directly without a second model request. Conversion is explicit.
- The URL tab can inspect a public website through a bounded public-only
  Chromium proxy, produce desktop/tablet/mobile screenshots and export a
  browser-computed `DESIGN.md`.
- A dedicated GitHub tab opens public repositories without a token or private
  repositories with a separate repository-limited `Contents: read` token,
  preserving bounded image assets without executing repository code.
- PNG, JPEG and WebP screenshots can be pasted directly into refinement Chat,
  with duplicate, count and size controls.
- A new capture-to-code application identity ships across the EXE, NSIS, MSI,
  portable build, shortcuts, sidebar and browser favicons.

### Changed

- Imported Figma, Stitch and GitHub assets now use restart-safe local references
  across History, retries and later chat, and binary project files export as
  decoded bytes.
- Preview and CodePen unwrap real brace-wrapped public URLs and replace
  unresolved `IMG.*` pseudo references with a safe placeholder; generation
  prompts explicitly forbid those malformed forms.
- Public-site, design-tool and repository text is labelled untrusted evidence.
  Stitch and website networking uses pinned public-address validation, bounded
  redirects/downloads and fail-closed behavior.
- MCP and Agent Skills retain enabled-plus-trusted, read-only-by-default and
  disabled-by-default safety rules and were reverified across backend,
  renderer and packaged-app surfaces.

## [0.5.2] — 2026-09-28

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.5.2) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.5.2)

The previous stable release. It includes the v0.5.0 feature set plus the fixes and additions below.

### Added

- **Free image search — shot2code sends no key of its own.** A new canonical
  `search_free_images` tool finds real, ready-to-use photographs through
  Openverse's public image API, and is offered to every runtime. It needs no
  credential, so it works on a machine with **no** Replicate, Cloudflare or
  OpenAI-compatible configuration at all, and configuring one of those never
  switches it off. It is a *separate* tool from `generate_images`, never a
  silent fallback inside it: the model picks whichever the design needs, and
  the activity feed says "Found 3 free images" rather than "Generated". Off by
  default, because the query text leaves the machine.
- Free image results are restricted to **CC0 and Public Domain Mark**, so an
  exported project cannot quietly inherit an attribution, share-alike or
  non-commercial obligation shot2code could not enforce on the user's behalf.
  The licence is re-checked locally rather than trusting the search server's
  filter, and a result missing its source page or licence URL is dropped
  because it could not be verified. Title, creator, source page, provider,
  licence name and licence URL travel with every image, along with an explicit
  warning that Openverse aggregates other platforms' metadata and should be
  verified before commercial use.
- Found images are downloaded and served locally, so generated and exported
  projects never hotlink somebody else's server. Every URL is checked first:
  `http(s)` only, DNS-resolved with private, loopback, link-local and cloud
  metadata addresses refused (a mixed answer is rejected outright as a
  rebinding attempt), redirects re-validated rather than followed, declared
  content type required to match the sniffed bytes within an image allowlist,
  and byte and decoded-pixel ceilings enforced. Web image search is
  deliberately not used: a picture on a web page grants no reuse right.

- **Optional image-generation providers.** Placeholder images can now be
  generated by Cloudflare Workers AI (account ID + API token) or by any
  OpenAI-compatible image endpoint (base URL, plus an API key unless it runs on
  localhost), in addition to Replicate. The alternatives are *additive*:
  Replicate stays the default and the existing Replicate, OpenAI, Anthropic and
  Gemini keys are never read, replaced or re-routed by the choice. Cloudflare's
  daily allocation is quoted from Cloudflare's own pricing page — 10,000
  Neurons a day on **both** the Workers Free and Workers Paid plans, resetting
  at 00:00 UTC, $0.011 per 1,000 Neurons above it — attributed to the user's
  Cloudflare account, dated, and marked able to change, never as a guarantee.
  `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` supply the same
  credentials to headless runs.
- Both validated Replicate image models are now selectable —
  `prunaai/z-image-turbo` (default) and `black-forest-labs/flux-2-klein-4b` —
  each with cost wording that names who bills, quotes the provider's own
  published figure with the date it was read, links that provider's pricing
  page, and says the terms can change. No provider is described as permanently
  free anywhere in the product.
- **Checked custom Replicate models.** Another Replicate model can be used once
  it passes a schema check: `POST /api/image-models/validate` reads that
  model's own published OpenAPI schema and accepts it only if it really
  declares a string `prompt` input and an image output and requires nothing
  else. Replicate models do not share one input schema, so no model outside the
  curated list is claimed to be compatible without that evidence.
- `GET /api/image-models` exposes the curated catalog — providers, defaults,
  capabilities and cost notes — as a pure read that carries no credential.
- **Provider-neutral web search.** A shot2code-owned `search_web` tool is now
  offered to every runtime — native OpenAI, Anthropic and Gemini, GitHub
  Copilot and Copilot SDK BYOK — instead of only to Copilot SDK sessions.
  Tavily is the default provider (its published plan is 1,000 API credits a
  month with no credit card, plus a documented keyless trial that needs no
  account); Exa is available as an alternative and always needs a key. Those
  allowances are the providers' own and can change — shot2code links their
  pricing pages rather than promising anything. Off by default; Settings
  states exactly what leaves the device before it can be switched on, and
  offers a test-connection button.
- Web search requests go only to the provider's fixed HTTPS endpoint, with an
  explicit timeout, no redirects and no raw page content. Each search returns
  at most 5 results with bounded titles, snippets and total size, prefixed with
  an untrusted-content warning, and is capped at 3 searches per turn and 10 per
  generation. Search-provider keys are backend-only and are excluded from
  history, commit snapshots and tool arguments.
- Copilot's built-in `web_search` remains available for people who prefer it
  and have the entitlement. When the canonical search is configured and usable,
  it is enabled *instead of* the built-in, so a model can never take the
  unbounded route past the budgets and the domain allowlist.
- Google Stitch generation now reports real SDK phases — connecting, project
  creation, screen generation, output download and import — with elapsed time,
  an accessible live status and bounded error messages. The SDK client now uses
  the same ten-minute generation timeout the UI promises.
- Dedicated **Figma** and **Stitch** input destinations sit beside Upload, URL,
  Text and Import. Figma uses its documented REST/PAT frame-rendering path;
  Stitch uses the bundled experimental SDK and preserves the selected
  shot2code stack/model routing.
- The Preview toolbar now includes accessible 25%–200% desktop canvas zoom,
  Fit and 100% controls. Magnified canvases pan without blocking iframe
  interaction.
- Help now includes an in-app Bug, Feature request and Feedback form with
  authenticated `gh` submission plus copy, Markdown-download and prefilled
  browser fallbacks.

### Changed

- **Copilot's built-in `web_fetch` is assessed and deliberately not offered.**
  It is a real runtime built-in and `ToolSet.add_builtin("web_fetch")` would
  reach it, but a built-in's result is produced inside the Copilot runtime and
  handed to the model by the runtime — the SDK only notifies the application
  afterwards. There is therefore no point at which shot2code could cap that
  text, mark it as untrusted, or count it against a budget, and `web_fetch`
  returns a whole page. The SDK also accepts no URL allowlist at session
  creation. Settings now explains this next to the Copilot web-search switch,
  as its own unconditional disclosure rather than something coupled to that
  switch, and points at the canonical `search_web` tool, whose results *are*
  capped, labelled and budgeted.
- **The deny-by-default Copilot permission handler is now installed on every
  session**, subscription and BYOK, instead of only on sessions that configured
  MCP servers. Without a handler the runtime fell back to its own default
  policy, so a run using a network-capable built-in had no shot2code-owned
  answer to "may this URL be fetched?". Any URL the runtime asks to open is
  denied with a reason naming the host and path — never the query string, which
  can carry a token. MCP approvals are unchanged.
- A `ToolSet` that names a blocked built-in — directly or through a
  `builtin:*` wildcard — now fails when the session is built, rather than
  silently granting a capability whose output cannot be bounded.
- **Image results are normalized in one place.** Remote URLs, raw bytes, base64
  and `data:` payloads all pass through one adapter that either keeps a public  URL or writes the image to the served local asset directory, and refuses
  anything unsafe (`file:`, private or loopback addresses that are not our own
  assets, oversized payloads). A locally served image is handed to the model as
  bytes, because such a URL is not fetchable by Anthropic, OpenAI or Gemini.
- Background removal is stated as Replicate-only and behaves that way: the
  `remove_backgrounds` tool is simply not offered without a Replicate key, and
  no other provider's model is substituted. Image editing runs on Replicate, or
  on an OpenAI-compatible endpoint that actually implements `/images/edits` —
  a missing route there is reported as a capability gap, not a credential
  problem.
- Figma MCP is no longer advertised or activated. Figma officially limits both
  its desktop and hosted MCP servers to clients in the Figma MCP Catalog, so
  shot2code filters registry results, disables migrated entries and uses the
  supported scoped-PAT REST workflow instead. Figma 429 responses now preserve
  retry, plan, limit-type and upgrade guidance.

### Fixed

- **Image generation no longer reports success for a batch that produced
  nothing.** Every per-prompt failure used to collapse into `None`, the tool
  still returned success, and the activity feed counted the empty results as
  generated images — three blank grey tiles under "Generated 3 images". Each
  prompt now keeps its own classified outcome (429 rate limit, 402 billing,
  authentication, timeout, or a generic provider error), a batch that produced
  nothing returns a failure with the reason and what to do about it, a partial
  batch truthfully reads "Generated 2 of 5 images", and no success-shaped
  result ever carries an empty URL. The same counting fix applies to
  `remove_backgrounds` and `edit_images`.
- The activity feed replaces the unexplained grey "Failed" tile with an
  accessible alert carrying the classified reason and the action to take, so a
  screen reader announces the failure instead of reading an empty box.
- Image-provider credentials are excluded from commit snapshots, project
  history and streamed tool arguments, mirroring the existing BYOK, MCP and
  web-search secret handling.
- A manually configured Copilot SDK BYOK model is tested directly when an
  OpenAI-compatible gateway does not expose a working optional `/models`
  endpoint. Credential failures still fail immediately, and a connection with
  no configured model still receives an actionable discovery error.
- Non-maximized preview resizing is coalesced through one ResizeObserver and
  one animation-frame write. Unchanged geometry and hidden zero-sized panes no
  longer rewrite iframe dimensions or repeatedly report scale, eliminating the
  resize flicker without rebuilding the preview document.
- The selected preview tab, HTML/Stack source, view mode and zoom now survive
  restart through validated preferences. The desktop also restores validated
  on-screen window bounds/maximized state, while the active project, version
  and file continue to restore from SQLite rather than being duplicated in
  local storage.
- Restoring a saved project no longer reopens on a cancelled option when the
  same generation has a completed option. shot2code selects and persists the
  completed sibling; when every option was cancelled or failed, the sidebar
  now offers Retry instead of incorrectly telling the user to select a
  completed option that does not exist.
- The packaged `file://` renderer now obtains the runtime backend HTTP and
  WebSocket addresses synchronously from the Electron main process instead of
  relying on a mutable environment variable visible to preload. History and
  API calls can no longer fall back to invalid `file:/api/...` URLs.
- The Electron preload no longer imports Node's `crypto` module. Electron 44
  runs the preload in a sandbox where that module is unavailable; the import
  prevented every desktop bridge from loading even though the backend itself
  had started successfully.
- The in-app feedback IPC handler is registered during application startup
  rather than inside the Stitch import callback, so Bug, Feature request and
  Feedback submissions work before any Stitch action has run.

## [0.5.1] — 2026-09-27

The `v0.5.1` source tag was created during release validation, but no GitHub
Release was published. Packaged smoke testing found a cancelled-option restore
defect and two Electron preload/IPC defects. The draft release was deleted, the
tag was not moved or reused, and the corrected build was rolled forward to
0.5.2.

## [0.5.0] — 2026-09-27

[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.5.0) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.5.0)

**Marked a pre-release and superseded by 0.5.2.** The final stable build includes everything described here plus the corrections documented above.

It signs you in to GitHub Copilot from the app itself with
no command-line tool installed, opens the official **MCP Registry** and an
**Agent Skills** library, makes **Figma** and **Google Stitch** first-class
design sources, restores the whole conversation in Chat, shows the exact files
an export will contain before you download them, and keeps your projects when
the installation directory is replaced.

Everything new here is **additive and off until you switch it on**. If you
configure none of it, the app behaves as it did in 0.4.0 — the native OpenAI,
Anthropic, Gemini and Copilot routes are untouched.

### Added

- **Sign in to GitHub Copilot without a CLI.** The desktop app now runs its own
  **GitHub OAuth device flow** against an application registered for shot2code.
  It shows a one-time code, opens your browser, and completes without the
  GitHub Copilot CLI or the GitHub CLI being installed. The app uses a
  **public client id and no client secret**, because a desktop application
  cannot keep one.
- **The token is encrypted at rest.** The access token and its refresh token
  are stored under the app's own user-data folder, encrypted with Electron
  **`safeStorage`** — the operating system's own key store. They are refreshed
  automatically when they expire.
- **Disconnecting is app-only.** **Disconnect GitHub from shot2code** clears
  the credential this app holds and nothing else: a `gh auth login` or
  `copilot` session on the same machine **stays signed in**, because shot2code
  did not create it and has no business ending it. The app also says so, rather
  than leaving you to guess what it touched.
- **The official MCP Registry, in the app.** **Settings → MCP servers →
  MCP Registry** searches
  [`registry.modelcontextprotocol.io`](https://registry.modelcontextprotocol.io)
  and installs an entry as a **disabled, untrusted draft** with its URL and
  headers laid out for review. Nothing a registry returns can start a server:
  the two existing switches still have to be turned on by hand. Only remote
  `https://` entries are offered, and duplicates collapse to the latest active
  version.
- **Featured integrations you would otherwise have to hand-configure.**
  **Figma Desktop MCP**, **Figma Remote MCP** and **Google Stitch MCP** are
  offered as one-click drafts with the correct transport and endpoint
  pre-filled — and, like every other server, arrive disabled and untrusted.
- **An Agent Skills library.** **Settings → Agent Skills** imports a skill from
  a **local folder** or from a **public GitHub folder URL**
  (`https://github.com/owner/repo/tree/main/path`). Front matter, paths and
  sizes are validated, the origin is recorded as provenance, and each skill can
  be enabled, disabled or removed. **Every imported skill is disabled by
  default.**
- **Figma, four ways.** Exported **screenshots**, exported **SVG** files (which
  are rasterised locally before they are sent), the **Figma Desktop MCP**
  server on `http://127.0.0.1:3845/mcp`, and a **REST import** that takes a
  Figma URL plus a personal access token with `file_content:read`, resolves the
  file and node ids in the URL, asks Figma to render those frames, and brings
  the images in as local data URLs.
- **Google Stitch, two ways.** The official **Stitch MCP** endpoint at
  `https://stitch.googleapis.com/mcp`, and a bundled **experimental**
  `@google/stitch-sdk` in the desktop app that validates a Stitch API key,
  generates a screen from a prompt, and imports an existing Stitch project or
  screen. HTML and image downloads made on its behalf are **HTTPS-only and
  size-bounded**.
- **Chat shows the whole conversation again.** The active branch is
  reconstructed in order — your prompts, the screenshots or recording you
  attached, any selected-element context, the model identity, the generation
  state **and the assistant's own responses**, in expandable, scrollable blocks.
  Older versions no longer collapse to *"Option ready."*
- **A first instruction on Upload and Import.** Both tabs now accept an optional
  instruction — and a model choice — before the first generation, so an imported
  multi-file project can go straight into the refinement flow.
- **Review can fix what it found.** **Fix selected findings** sends a targeted
  update against the **exact commit and option that was reviewed**, rather than
  whatever happens to be on screen. Findings can be narrowed with severity
  filters and a text search, and selected in bulk with **Select visible** and
  **Select errors + warnings**.
- **An optional, bounded AI review.** Beside the deterministic local audit, a
  second opinion can be requested from the **model that option actually ran
  on**. It runs with **no tools, no MCP servers, no skills, no web search, no
  shell and no file writes**, and its findings are kept separate from the local
  ones, which remain authoritative. It is a real provider request and **may use
  quota**.
- **A Design Inspector.** Review can extract repeated colours, CSS variables,
  typography, spacing, radii, shadows, motion and semantic component counts from
  the generated source, and export them as **`DESIGN.md`**, **`SKILL.md`** and a
  **palette PNG**.
- **The Code tab shows what you will actually download.** Beside **Current
  code** there is now a read-only **Export project** view listing the exact text
  files and assets the ZIP will contain for the selected stack, so the export
  layout is no longer a surprise at download time.
- **A sandboxed Stack preview.** Preview still defaults to the composed HTML
  document. **Stack preview** additionally renders the controlled Vite HTML,
  React and Preact files in the same browser sandbox. **No package script and
  no project configuration is executed** to produce it.
- **Copilot web research, opt-in.** **Settings → Copilot web research → Allow
  web search** lets GitHub Copilot and Copilot SDK BYOK options search the
  public web when a prompt needs current documentation. Search queries leave
  the device, which the setting says in as many words. It is off by default.
- **ScreenshotOne says what went wrong.** A failed capture is now reported as a
  rejected key, a billing or credit problem, a rate limit, a timeout, an invalid
  URL or an unavailable provider — and the URL tab can test a ScreenshotOne key
  with one minimal request before you rely on it.
- **One endpoint, several selectable models.** A Copilot SDK BYOK connection is
  no longer limited to a single endpoint model: every model you discover or
  type becomes its **own selectable identity**, so several models from the same
  endpoint can run in one generation and be compared.

### Changed

- **Projects survive an upgrade.** History lives in
  `%LOCALAPPDATA%\shot2code\history.sqlite3`, outside the installation
  directory, and the installer is explicitly configured not to remove
  application data. Replacing the installed program therefore leaves every
  project, version and prompt in place.
- **History records the exact run identity.** Each option stores and displays
  the identity it really ran as — a native model id, or the
  `sdk-byok/<provider>/<base model>` twin — so a retry replays that runtime
  rather than the provider whose model it borrowed.
- **Image tools are gated on a usable key.** `generate_images` and
  `edit_images` are no longer advertised to a model unless an effective
  Replicate key exists. The preference still works when that key comes from
  `backend/.env`.
- **Skills and web search reach Copilot runtimes only.** Like MCP tools, they
  are exposed to GitHub Copilot subscription options and Copilot SDK BYOK
  options. An option running on your own OpenAI, Anthropic or Gemini key never
  sees them.
- **The shipped desktop stack was updated**: Electron **44.4.3**,
  electron-builder **26.15.3** and electron-updater **6.8.9**, with
  `npm audit --omit=dev` reporting **0 vulnerabilities** for what is actually
  distributed.
- **First-run browser startup has a longer budget.** The bundled headless
  Chromium is allowed more time on its first launch, because that is when
  antivirus software scans a newly written tree — the previous budget could
  report the browser unavailable on a machine where it was merely slow.

### Fixed

- **A generation started during a cold start no longer fails.** The deferred
  route loader accepts the WebSocket handshake before the frozen generation
  graph has finished importing and replays the connect event, instead of
  dropping the first run after launch.
- **Long runs no longer look dead.** The backend sends a heartbeat every 15
  seconds so a long Copilot run is not mistaken for a stalled connection.
- **A completed run is no longer reported as a failure.** An abnormal socket
  closure after every option has reached a terminal state is treated as
  completion, and when the selected option was cancelled or failed while another
  one finished, the usable option is selected for you.
- **"Check the console" is a last resort again.** A failure that the backend
  actually diagnosed keeps its own message and points at the diagnostic log.
- **A root-level skill folder on GitHub imports correctly.** The Contents API
  does not return file contents in a directory listing, so each file is now
  fetched individually rather than imported empty.
- **A `204` route no longer breaks the backend.** A FastAPI route annotated
  `-> None` for a no-content response made the whole application unimportable;
  it returns an explicit `Response` now.

### Security

- **No client secret ships in the app.** The GitHub device flow uses a public
  client id only. A desktop application cannot keep a secret, so it does not
  pretend to have one, and it does not borrow another product's client id.
- **Credentials are encrypted by the operating system.** GitHub tokens obtained
  in the app are written through Electron `safeStorage`. The backend receives
  the token in its process environment on a restart that is **serialised**, so
  two sign-in or disconnect actions cannot race a half-started backend.
- **Disconnecting never reaches outside the app.** Clearing the credential
  shot2code holds does not touch a `gh` or Copilot CLI session on the same
  machine.
- **Capture-only credentials never reach a model.** The Figma personal access
  token and the Google Stitch API key are used only by the code that calls those
  services — the Figma token is sent to `api.figma.com` and nowhere else, and
  the Stitch key is passed through desktop IPC to the bundled SDK. Both are
  stripped from generation requests, from project history and from exports.
- **A registry install is a draft, not a running server.** An entry installed
  from the MCP Registry arrives **disabled and untrusted**, and only remote
  `https://` entries are listed at all. The two switches, the read-only
  default and the separate **Allow write tools** gate are unchanged.
- **Imported skills cannot execute.** A skill may contain scripts, and those
  files are stored as resources — but shot2code exposes **no shell tool and no
  unrestricted host-filesystem tool**, so nothing in a skill can be run. Skills
  are bounded in file count and size, path traversal is rejected, and every
  import is disabled until you enable it.
- **Copilot's own file and shell tools stay excluded.** shot2code continues to
  expose only its own `create_file` and `edit_file` tools, which act on the
  project in memory. Enabling web search adds search and nothing else.
- **The AI review runs without tools.** It is given no tool surface at all — no
  MCP, no skills, no web search, no shell, no file writes — so a second opinion
  cannot become a second agent.
- **Stitch downloads are constrained.** HTML and image fetches made on the
  SDK's behalf must be `https://` and are size-bounded.

### Notes

- The GitHub device flow is a feature of the **desktop app**. Where it is not
  available, the existing delegated route is used instead and **shot2code never
  receives or saves the token** in that mode. The `gh auth login` / `copilot`
  ladder and the optional token field are unchanged either way.
- **Figma's remote MCP server currently admits only clients in Figma's own MCP
  catalogue.** shot2code does not impersonate another editor or reuse its OAuth
  identity, so the REST import with your own personal access token is the route
  that works today for most accounts.
- **`@google/stitch-sdk` is experimental.** Google Labs states it is not an
  officially supported Google product. It is bundled at version **0.3.5**
  (Apache-2.0) and is used only when you supply a Stitch API key.
- The AI review, like a connection check, is a real provider request on a
  metered account. The **local** source audit remains free, deterministic and
  offline, and it is still an automated check of generated source — **not a
  WCAG conformance assessment**.
- Validation for this build: **976 backend tests (13 skipped)**, **851 frontend
  tests (9 skipped)** and **47 desktop tests**, plus **15 exported projects**
  checked across the **12-stack browser matrix**. The packaged `file://` app,
  history retention across an install-directory replacement, a root-level
  GitHub skill import and the bundled Chromium were all verified on the
  packaged build.

## [0.4.0] — 2026-09-20

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.4.0) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.4.0)

It adds a second, optional way to reach a model — your own
endpoint through the GitHub Copilot SDK — lets Copilot runs call MCP servers you
configure, turns the preview into a side-by-side responsive **Review** with a
local source audit, and puts a real Windows menu bar on the app.

Superseded by 0.5.2, which includes CLI-free GitHub sign-in, the MCP Registry,
Agent Skills, Figma and Google Stitch.

Everything here is **additive**. If you do not configure any of it, the app
behaves exactly as it did in 0.3.3.

### Added

- **Copilot SDK BYOK: bring your own endpoint.** A single, separate connection
  in **Settings** with its own credential — **OpenAI-compatible**, **Azure
  OpenAI** or **Anthropic**, an optional base URL, an API key *or* a bearer
  token, an optional endpoint model, and an Azure `api-version`.
  **No Copilot subscription is required.** The OpenAI-compatible mode works
  with any endpoint that speaks the OpenAI wire format — a vendor API, a
  gateway, a self-hosted server or one your organisation runs — over any
  `https://` URL, or `http://` when the host is `localhost`. An
  OpenAI-compatible endpoint on `localhost` may run without a credential;
  everything else must carry its own. The direct OpenAI and Anthropic keys are
  **never** used as a fallback for it.
- **The wire API is chosen for you.** **Automatic** is the default: an endpoint
  with its own base URL gets **Chat Completions**, the interface almost every
  OpenAI-compatible server implements, and a provider's own endpoint gets
  **Responses**. You can pin either protocol if your endpoint needs one, and a
  pinned choice always wins.
- **Endpoint models, discovered or typed.** If the endpoint lists models at
  `/models`, **Test model access** fills a picker with the ids it reported —
  de-duplicated and capped — and you choose one. Azure and Anthropic do not
  expose that route, so the name is typed by hand there; typing is available
  everywhere. Model ids may be up to **128** characters and may contain the
  `. _ : / @ + -` characters real deployments use.
- **A custom endpoint model is one honest option.** Name a model the catalog
  does not know and **Settings → Models** shows exactly one entry for it —
  `<model> via <provider>`, with the run identity
  `sdk-byok/<provider>/custom/<model>` — instead of a list of catalog names
  that would all reach the same model. No reasoning effort is sent for it,
  because an arbitrary endpoint model has no thinking level.
- **BYOK models are their own selections.** Each model the connection can serve
  appears in **Settings → Models** under **Copilot SDK (BYOK)** with the run
  identity `sdk-byok/<provider>/<base model>`. Because that id can never collide
  with a direct model id, you can select a model *and* its BYOK twin in the same
  generation and compare the two results side by side. The reasoning effort you
  picked is part of the base model, so it carries across unchanged.
- **The identity survives History and retries.** Each option records the
  identity it actually ran as, so retrying a BYOK option re-runs it on your
  endpoint rather than on the provider whose model it borrowed. A custom
  endpoint model keeps its own identity through both.
- **Sign in to GitHub Copilot from the app.** **Settings → GitHub Copilot**
  offers **Sign in with GitHub** when nobody is signed in. It runs the
  **official** GitHub Copilot CLI web flow — falling back to the GitHub CLI —
  which opens your browser and stores the credential in that tool's own
  keychain. shot2code never receives, stores or sees the token; it only learns
  whether a session now exists. The flow can be cancelled, and if neither CLI
  is installed the app says so and links the official install instructions. The
  optional token field and the terminal route are unchanged.
- **Test a provider before you generate.** A compact **Connection checks** area
  under the API keys tests **OpenAI**, **Anthropic**, **Gemini** and
  **Replicate** individually, and the BYOK card gains **Test model access**.
  Each test makes one deliberately tiny request — a single-word prompt capped
  at 16 tokens — so a key that is malformed, revoked, out of credit or pointed
  at a model your account cannot see fails here rather than halfway through a
  generation. Leaving a field empty tests the key the backend holds in its own
  configuration instead. Replicate is checked against its account endpoint, so
  it starts no prediction.
- **Results say what to do next.** An answer is reported as **Ready**, **Out of
  credit** (with a link straight to that provider's billing page), **Key
  rejected**, **Rate limited**, **Access denied**, **Model unavailable**,
  **Configuration problem** or **Could not reach the provider** — never as an
  unexplained failure. An account with no credit left is the case this exists
  for: it looks like a rate limit and waiting never fixes it.
- **Re-check the screenshot preview without restarting.** The Screenshot
  Preview warning gains **Check again**, which re-probes the backend. Running
  from source it gives the exact install command and asks you to restart the
  backend; in the packaged app — where the browser is bundled — it says the
  bundled browser could not start, suggests a restart or reinstall, and opens
  the diagnostic log.
- **MCP servers for Copilot runs.** Up to **8** servers in **Settings**, over
  **stdio**, **HTTP** or **SSE**, with an optional tool allowlist and timeout.
  Their tools appear in the activity list as `MCP · <server> · <tool>`.
- **A responsive Review workspace.** A **Review** destination renders the
  generated page at **two to four real widths** at once — **1440**, **768** and
  **390** by default, any whole width from **320** to **1920** if you add your
  own. Frames are rendered at their actual width rather than scaled screenshots,
  and horizontal overflow is measured in the running frame.
- **A local source audit beside the frames.** A deterministic pass over the
  generated source reports semantic and accessibility problems — missing
  `lang`, no `<title>`, missing viewport meta, heading order, missing `main`,
  unlabelled images, form controls and interactive elements, duplicate `id`s,
  positive `tabindex`, nested interactive elements, missing table captions and
  headers, and fixed widths that will overflow your narrowest frame — each with
  the evidence, the affected file and what to do about it.
- **Send findings to Chat.** Tick the findings you want and they are written
  into the composer as a grouped instruction. **It is not sent for you** — read
  it, edit it, then send.
- **A source-safe JSON report.** Export the review as JSON: severities, rule
  ids, messages, evidence and guidance, with file paths reduced to a leaf name
  and no credentials of any kind.
- **A native Windows menu bar.** **File**, **Edit**, **View**, **Window** and
  **Help**, driving the same commands as the keyboard: new project, upload,
  import, export, the Preview/Code/Chat/History destinations, **Show Chat
  panel** (`Ctrl+Alt+C`), Settings, zoom, the Help centre and the shortcut
  reference. Items that cannot work without a project are disabled rather than
  offered.

### Changed

- **The model picker has a fifth group.** **Copilot SDK (BYOK)** sits beside
  GitHub Copilot, OpenAI, Anthropic and Google Gemini. The four native groups
  are untouched: each still needs its own key or sign-in, and none of them is
  ever relabelled or re-routed because BYOK is configured.
- **Every API key field is masked.** The OpenAI, Anthropic, Gemini and
  Replicate keys are password inputs with autocomplete off, matching the
  Copilot token and BYOK credential fields. The OpenAI base URL stays readable,
  because it is not a secret.
- **A failed generation keeps its explanation.** When the backend diagnoses a
  problem and then the connection closes, the actionable message is what you
  see. The generic "check the console" text now appears only when there really
  was no diagnosis, and it no longer replaces a specific one that arrived
  first.
- **MCP tools reach the SDK runtimes only.** A GitHub Copilot subscription
  option and a Copilot SDK BYOK option can call them. An option running on your
  own OpenAI, Anthropic or Gemini key runs on that provider's own client and
  never sees an MCP tool. The picker says so.
- **Review results are bound to what produced them.** A result records the
  version, the option, a hash of the source and the widths it ran at. Change any
  of those and the result is marked stale instead of being presented as current.

### Fixed

- **Every Settings control remains reachable.** Settings now owns a
  viewport-bounded scroll area whether the app is empty or a project is open,
  so the final Screenshot by URL and capability controls no longer extend below
  the fixed desktop shell.

### Security

- **Sign-in is delegated, never implemented.** shot2code runs the official
  CLI's own login command with a **fixed argument vector**, spawned directly
  and never through a shell. Nothing a request sends can influence that command
  line. The CLI's output is drained but never returned, logged or stored,
  because a login flow prints one-time codes and can echo tokens. The run is
  bounded by a timeout, can be cancelled, and is killed when the backend stops.
- **Starting or cancelling a sign-in is origin-guarded.** Both spawn or kill a
  process, so they are refused unless the request comes from the app on this
  machine — `localhost`, `127.0.0.1`, `::1`, or the `null` origin the packaged
  `file://` app sends. A missing origin is refused too, because CORS does not
  stop a cross-site POST from being *sent*. Reading the status is unguarded
  only because it changes nothing and returns no token.
- **The server's key is never lent to a caller's URL.** A connection check that
  names its own OpenAI base URL must carry its own API key in the same request.
  The key configured on the server is only ever used with the server's own
  endpoint, so no caller can point shot2code at a host it controls and have the
  server's credential sent there.
- **An MCP server needs two switches.** It must be **enabled** *and* explicitly
  marked **trusted** before shot2code will start it or approve its tools.
- **Read-only by default.** A trusted server still cannot use write tools until
  **Allow write tools** is turned on for it, which the settings page labels as
  the risk it is.
- **A local server is spawned as an argument vector, never through a shell**, so
  nothing in a command or its arguments is re-interpreted by `cmd` or
  PowerShell.
- **Remote servers must use `https://`** unless the host is `localhost`.
- **Server secrets stay secret.** Environment values and request headers that
  look like credentials are masked in the list and stay masked, read-only, in
  the editor until you ask to reveal them. Only key and header *names* appear in
  diagnostics; values never reach a log line, a validation response, a project
  snapshot or the exported review report.
- **Connection checks return no credential.** A result carries a category, a
  message and the model that was tried. Provider error text is scrubbed of any
  value that was sent before it is shown.
- **Validation contacts nothing.** **Validate connection** and **Validate
  servers** check the configuration only — no endpoint is called and no MCP
  server is started. **Test model access** and the per-provider checks are the
  opposite and say so: they contact the endpoint and may use a little quota.

### Notes

- Configuring neither BYOK nor MCP changes nothing: an incomplete or switched-off
  BYOK connection, and a disabled or untrusted MCP server, are reported as
  notices and **never block a direct generation**.
- There is **no Gemini BYOK**: the Copilot SDK has no Gemini provider, so Gemini
  models always use the Gemini API key directly.
- A model reached through your own endpoint must accept the wire API in use and
  support **image input and tool calling**. Screenshots are sent as images and
  the agent works by calling tools, so a text-only model will fail. Neither the
  connection check nor the endpoint's model list can tell you which models
  qualify — only the endpoint's own documentation can.
- A connection check is a real request to a real provider and may consume a
  small amount of quota. It is deliberately tiny, but it is not free on a
  metered account.
- The source audit is a **local, deterministic check of generated source**. It is
  not a WCAG conformance assessment and does not replace testing with real
  assistive technology.

## [0.3.3] — 2026-09-14

[Download](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) ·
[hub release](https://github.com/ArasaniRohithReddy/app-releases/releases/tag/shot2code-v0.3.3) ·
[upstream notes](https://github.com/ArasaniRohithReddy/shot2code/releases/tag/v0.3.3)

It makes the packaged app start in seconds instead of
minutes, lets you decide how the workspace splits its width, and replaces the
shortcuts-only dialog with a Help centre that can open the log you need to
attach to a bug report.

Superseded by 0.4.0, which adds Copilot SDK BYOK, MCP servers and the Review
workspace.

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

It protects an update that starts from an older client,
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
