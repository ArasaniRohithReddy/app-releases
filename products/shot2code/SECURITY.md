# shot2code security

shot2code runs on your own machine. Screenshots, generated code, project history
and API keys stay local; the only outbound traffic is to the model provider you
configure, plus the update check and the integrations you switch on and use —
an MCP server you trusted, a Figma/Stitch/GitHub import, public-site inspection,
bounded web or free-image search, an image provider, feedback you submit, or
anything you explicitly share. The full inventory is in
[DATA-HANDLING.md](DATA-HANDLING.md).

This page covers the shot2code-specific parts. The hub-wide policy — how reports
are handled and what to expect — is in the repository
[SECURITY.md](../../SECURITY.md).

## Supported versions

Only the **newest published release** receives fixes, and fixes ship as a new
release rather than as patches to an older installer.

| Version | Status |
| --- | --- |
| The newest release on the [releases page](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) | ✅ Supported |
| Anything older | ❌ Not supported — update to the newest release |

The page resolves that release from the release feed, so this stays accurate
without anyone editing a version into it. Two older builds are worth calling out
by name: 0.3.0's silent updater could start a second installer, and the fix in
0.3.1 could only protect a machine already running 0.3.1 — the guard that also
protects an update *from* an older client is in the 0.3.2 installer. See the
[changelog](CHANGELOG.md).

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub Security Advisories:
<https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new>
(or the **Security** tab → **Report a vulnerability**). Reports about the source
code can also be filed in the
[project repository](https://github.com/ArasaniRohithReddy/shot2code/security/advisories/new).

Useful details to include:

- the shot2code version (**Settings**, or the installer filename);
- how you run it: `.exe` installer, MSI, portable ZIP, or from source;
- which model provider was configured — and whether a Copilot SDK BYOK
  connection, an MCP server, an Agent Skill, web/free-image search, an image
  provider, a Figma import or the Google Stitch integration was in play;
- reproduction steps, and a proof of concept if you have one;
- relevant lines from `%APPDATA%\shot2code-desktop\shot2code-backend.log`,
  **with any API keys or tokens redacted**.

This is a small project maintained by one person. Expect an acknowledgement when
the report is read, and a fix timeline that depends on severity. Please allow a
reasonable window before public disclosure. Credit is given in the advisory unless
you prefer otherwise.

## Unsigned Windows binaries and SmartScreen

The published Windows builds are **not code-signed**. Windows shows *"Windows
protected your PC"* the first time you run an installer, and downloaded files
carry the mark of the web. That warning is expected; it is not evidence that the
download is good or bad.

Because there is no signature to check, verify the download yourself:

1. Download only from this hub's
   [releases](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)
   or from the project's own GitHub releases.
2. Compare the SHA-256 hash with `SHA256SUMS.txt` attached to the same release:

   ```powershell
   Get-FileHash .\shot2code-<version>-x64.exe -Algorithm SHA256
   ```

3. Only then choose **More info → Run anyway**, or right-click the file →
   **Properties** → **Unblock** → **Apply**.

If a hash does not match, stop and report it.

## API keys and local data

- Provider keys entered in **Settings** are stored on your device only and sent to
  the provider they belong to with a generation request. There is no server to
  store them on.
- **The Copilot SDK BYOK connection carries its own credential.** Its API key or
  bearer token is used only for the endpoint you configured; the direct OpenAI
  and Anthropic keys are never substituted for it. A credential is required
  unless the endpoint is an OpenAI-compatible host on `localhost`.
- **Signing in to GitHub Copilot uses a public client id and no secret.** The
  desktop app runs a **GitHub OAuth device flow** registered for shot2code: it
  shows a one-time code and opens your browser. A desktop application cannot
  keep a client secret, so none is used or shipped, and shot2code does not
  borrow another product's client id. The access and refresh tokens it receives
  are stored under the app's own user-data folder **encrypted with Electron
  `safeStorage`**, the operating system's key store, and are handed to the
  backend in its process environment on a **serialised** restart, so repeated
  sign-in or disconnect actions cannot race a half-started backend.
- **Disconnecting is scoped to this app.** **Disconnect GitHub from shot2code**
  removes only the credential shot2code holds. A `gh auth login` or `copilot`
  session on the same machine **stays signed in**, because shot2code did not
  create it and has no business ending it.
- **Where the device flow is unavailable, sign-in is delegated and tokenless.**
  shot2code runs the official CLI's own login command with a
  **fixed argument vector**, spawned directly rather than through a shell, so
  nothing a request sends can influence the command line. The CLI's output is
  drained but never returned, logged or stored, because a login flow prints
  one-time codes and can echo tokens. The run is bounded by a timeout, can be
  cancelled, and is killed when the backend stops. In that mode
  **shot2code never receives the token** — only whether a session exists.
- **Capture-only credentials never reach a model.** The Figma personal access
  token is sent to `api.figma.com` and nowhere else; the Google Stitch API key
  reaches only the bundled SDK through the desktop app's own IPC; a separate
  fine-grained GitHub repository token reaches only GitHub for the selected
  private repository. None is placed in a generation request, AI review,
  project history, snapshot or export.
- **Imported design assets are fetched defensively.** Stitch resources use
  pinned public DNS resolution, manual redirect validation, byte/file ceilings
  and MIME/magic-byte checks before local persistence. Rejected assets fail
  closed instead of remaining as live external URLs. Figma downloads stream
  under per-file and aggregate budgets.
- **Public website inspection never lets Chromium fetch directly.** Each
  HTTP(S) request is fulfilled through a public-only pinned resolver; cookies
  and authorization are not forwarded, redirects re-enter the same guard, and
  private/loopback/link-local/metadata targets, WebSockets, EventSource,
  service workers, media and non-GET/HEAD requests are blocked. Request,
  resource-byte, total-byte, element and global-time limits apply.
- **Starting or cancelling a sign-in is origin-guarded.** Both spawn or kill a
  process, so they are refused unless the request came from the app on this
  machine: `localhost`, `127.0.0.1`, `::1`, or the `null` origin the packaged
  `file://` app sends. A request with no origin is refused as well, because CORS
  does not prevent a cross-site POST from being *sent*. Reading the sign-in
  status is not guarded, because it changes nothing and returns no token.
- **A connection check never lends the server's key to a caller's URL.** A check
  that names its own OpenAI base URL must carry its own API key in the same
  request; the key configured on the server is only ever used with the server's
  own endpoint. Nobody who can reach the local API can point it at a host they
  control and have the server's credential sent there.
- **Connection checks return no credential.** A result carries a category, a
  message and the model that was tried. Provider error text is scrubbed of any
  value that was sent before it is shown, and every key field in Settings is
  masked.
- The local `/api/models` route reports which providers are usable and what each
  model supports. It never returns a key or a token, and your model selection is
  a local preference rather than an account setting.
  `/api/integrations/validate` answers with presence flags, a host name and
  diagnostics — it contacts no endpoint, starts no MCP server and returns no
  credential. `/api/providers/validate` is the deliberate exception: it makes
  one minimal request to the provider you asked about, and the app says so
  before you use it.
- Image-provider and web-search credentials are read from current Settings only
  when their selected feature is used. Closed serialization allowlists keep
  every key, bearer token, MCP environment value and request header out of
  project history and snapshots.
- GitHub Copilot credentials are resolved at request time and are not persisted or
  logged by the app; the model cache is keyed by a SHA-256 fingerprint of the
  credential.
- Project history is a plain SQLite database at
  `%LOCALAPPDATA%\shot2code\history.sqlite3`. It is **not encrypted** — treat it
  like any other local project folder and delete projects you no longer want on
  disk. **No credential is written into it**: a version records the run identity
  behind each option and nothing about the key, the endpoint, an MCP server,
  Figma or Stitch. It sits outside the installation directory, and an uninstall
  deliberately leaves it alone, so an upgrade cannot destroy your work.
- Never commit a key, a token, or a copy of `history.sqlite3`, and redact keys from
  logs and screenshots before attaching them to an issue.
- There is no analytics or telemetry SDK in the app.

## MCP servers

An MCP server is a program shot2code may run, or an endpoint it may call, on your
behalf. It is gated accordingly.

- **Two switches, not one.** A server must be **enabled** *and* explicitly marked
  **trusted** before it is started or its tools are approved. Trusting a local
  server means agreeing to run that program on this device; the settings page
  says so.
- **Read-only by default.** A trusted server still cannot use tools that change
  files, data or remote state until **Allow write tools** is turned on for it.
- **No shell.** A `stdio` server is spawned as an explicit argument vector, so
  nothing in the command or its arguments is re-interpreted by `cmd` or
  PowerShell. Arguments are entered one per line for that reason.
- **Transport is constrained.** An `http` or `sse` server must use `https://`
  unless the host is `localhost`, and a URL may not embed a username or password.
- **Everything is bounded.** At most eight servers, with limits on arguments,
  environment entries, headers, tool names and timeout, and a refusal — with a
  reason — rather than a silent truncation.
- **Server secrets are treated as secrets.** Environment values and request
  headers are masked in the list, masked and read-only in the editor until
  revealed, excluded from every diagnostic and API response, and never written
  into project history or an exported review report. Only their names appear.
- **Scope is limited to the SDK runtimes.** Only GitHub Copilot subscription
  options and Copilot SDK BYOK options are given MCP tools. An option running on
  your own OpenAI, Anthropic or Gemini key never receives them.
- **A registry install is a draft, not a running server.** The in-app **MCP
  Registry** browser lists only remote `https://` entries from the official
  registry, and installing one creates a **disabled, untrusted** draft with its
  URL and headers laid out for review. A registry listing is not an endorsement;
  the two switches, the read-only default and the separate write gate all still
  apply. Google Stitch is a featured draft. Figma MCP endpoints are filtered and
  migrated entries are disabled because Figma restricts both transports to
  clients in its MCP Catalog.
- A disabled, untrusted or malformed server is reported as a notice and skipped.
  It does not block a direct generation.

## Agent Skills and model tools

- **Skills are inert text, and they are off by default.** A skill imported from
  a local folder or a public GitHub folder is validated — front matter, path
  normalisation with traversal rejected, bounded file count and size — recorded
  with the origin it came from, and **disabled until you enable it**.
- **A skill's scripts can never execute.** Script files are stored as resources
  because a skill may legitimately ship them, but shot2code exposes **no shell
  tool and no unrestricted host-filesystem tool** to any model. There is nothing
  that could run them.
- **Copilot's own file and shell tools are excluded.** The agent is given
  shot2code's own `create_file` and `edit_file` tools, which act on the project
  held in memory, and nothing else from the SDK's built-in surface.
- **Canonical web search is opt-in, bounded and provider-neutral.** Tavily/Exa
  queries may be issued by native OpenAI, Anthropic and Gemini options as well
  as Copilot and BYOK. Fixed endpoints, redirect refusal, local domain
  re-filtering, result/snippet bounds, per-turn/per-generation budgets and an
  untrusted-content warning limit what reaches the model.
- **Copilot built-in search never duplicates canonical search.** It is enabled
  only when the canonical tool is unusable. Built-in `web_fetch` and all URL
  permission requests are denied because the current SDK cannot let shot2code
  inspect, truncate or budget a whole-page result before the model receives it.
- **Free image search is separate and hostile-input bounded.** Openverse results
  must be CC0/Public Domain Mark with source and licence URLs; every resolved
  address, redirect, MIME type, byte count and decoded pixel count is checked
  before bytes are persisted locally. Generated markup never hotlinks them.
- **The AI review runs with no tools at all** — no MCP, no skills, no web
  search, no shell, no file writes — so a second opinion cannot become a second
  agent. It is a real provider request against the model that option ran on.
- Skills follow the MCP rule: **Copilot and BYOK runtimes only**. Canonical web
  search deliberately reaches native provider runtimes too.

## Update integrity

- Per-user NSIS installs update through `electron-updater` against the public
  GitHub Releases feed over HTTPS. The `latest.yml` manifest published with a
  release carries the installer's SHA-512, and the updater refuses a download
  whose hash does not match.
- There is one guarded install entry point, so a queued click or an
  install-on-quit cannot start a second installer behind the first.
- Before installing, the bundled backend, Copilot CLI and Chromium process tree is
  stopped and the shutdown is **verified**. If it cannot be confirmed, the update
  is not started; it stays retryable rather than replacing a running app.
- **The installer enforces the same rule independently.** An app-side guard only
  protects machines already running the fixed build, so the NSIS installer checks
  before it uninstalls or replaces anything: it matches processes by executable
  path under the installed `resources\backend` directory — never by process name,
  so an unrelated program sharing an executable name is not touched — stops each
  tree, and confirms none survives. It fails closed: an unconfirmed shutdown
  aborts the replacement with an actionable message or a distinct silent-install
  exit code, and writes `%TEMP%\shot2code-installer-preinstall.log`.
- MSI installs are per-machine managed deployments: self-update is disabled and
  upgrades are left to the administrator.
- Releases are published from a locally verified build so that `latest.yml` always
  describes the binaries attached to the same release — see [RELEASING.md](RELEASING.md).

## Imported and generated code

shot2code treats every project you import and every page it generates as untrusted
input.

- **Imported projects are never executed.** The scanner parses text only; it does
  not import `tailwind.config.*` or any other configuration or application module,
  and it runs no install or build commands.
- The scanner rejects path traversal, ignores dependency and build-output
  directories, and enforces limits on archive size, entry count, file count,
  per-file size and total decoded text.
- GitHub repository ZIPs use the same scanner, and bounded PNG/JPEG/GIF/WebP
  files cross a separate validated binary path into the local asset store.
- Raw imported source is not written into persisted project context.
- Figma, Stitch, website and repository text is wrapped as **untrusted
  evidence**. It cannot redefine the task, request credentials, or instruct the
  model to call a tool.
- **Previews are sandboxed:** rendered from `srcDoc` in an iframe without
  `allow-same-origin` (an opaque origin that cannot read app state, cookies or
  storage), under a restrictive Content-Security-Policy, a `no-referrer` policy,
  and a permissions list denying camera, microphone, geolocation and display
  capture. **Stack preview** renders the generated project's controlled Vite
  HTML, React and Preact files in that same sandbox and executes **no package
  script and no project configuration**.
- Select-and-edit accepts a message only when the channel and a random per-preview
  nonce match, with size-capped payloads.
- Generated code is still model output. **Review it before running it outside the
  preview**, especially anything touching the network, the filesystem or
  credentials. The Review source audit is a local, deterministic check of that
  source — it reports semantic and accessibility problems with evidence, and it
  is **not a WCAG conformance assessment** or a security review.
- Website `DESIGN.md` inspection is rendered evidence, not original source, an
  assertion of asset rights, or security/WCAG certification.
- Sharing to CodePen sends code off your device to a third party. It is never
  automatic and always asks first.

## Out of scope

- Missing Authenticode signatures and SmartScreen warnings on the published
  binaries — known and documented above.
- Vulnerabilities in third-party model providers, CodePen, or CDN-hosted framework
  assets loaded by a preview.
- Vulnerabilities in an MCP server you chose to configure and trust, in a skill
  you chose to import and enable, or in the BYOK endpoint you chose to point the
  app at. Report a flaw in how shot2code *gates* them instead.
- Vulnerabilities in Figma, Google Stitch, ScreenshotOne or the experimental
  `@google/stitch-sdk`. Report a flaw in how shot2code *handles their
  credentials or responses* instead.
- Findings that require an attacker who already has local access to your user
  account or can modify the installation directory.
- Insecure code produced by a model in response to a prompt. Report a *systemic*
  prompt-injection or sandbox-escape path instead.
- Accessibility problems the Review audit does not detect. It is a bounded set of
  source rules, not a conformance tool.
