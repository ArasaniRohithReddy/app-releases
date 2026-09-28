# shot2code — data handling &amp; privacy

This page enumerates what shot2code stores, what it sends, and where. It describes
the published Windows build; anything marked *source only* is unavailable in the
packaged app. The behaviour described here can be checked against the source at
[ArasaniRohithReddy/shot2code](https://github.com/ArasaniRohithReddy/shot2code).

**Summary:** screenshots, generated code, project history and API keys stay on
your machine. The only outbound traffic is the request to the model provider you
configured, the update check, and the integrations you switch on and use — an
MCP server you trusted, a Figma or Google Stitch import, web or free-image
search, an image provider, feedback you explicitly submit, or anything you
explicitly share.

## 1. What leaves the device

| Destination | When | What is sent |
| --- | --- | --- |
| The model provider you configured (GitHub Copilot, Gemini, Anthropic or OpenAI) | You start or refine a generation | Your prompt, the screenshots/URL/description you supplied, and the working project context the agent needs |
| **Your own endpoint** (Copilot SDK BYOK) | You start or refine a generation with a `sdk-byok/…` option selected | The same request, sent to the base URL you configured, authenticated with that connection's own key or bearer token |
| **The model an option ran on** | You ask for an **AI review** of that option | The generated source and a review instruction. The request carries **no tools, no MCP servers, no skills and no web search** |
| **An MCP server you enabled and trusted** | A Copilot or BYOK option calls one of its tools | The tool call the model made, plus the environment values or request headers you configured for that server |
| **Tavily or Exa** | You enable canonical **Web search** and a model searches | The bounded query and optional domain filter. Off by default. No raw page fetch is requested |
| **The public web, through Copilot** | Canonical search is off, Copilot built-in search is enabled and a Copilot/BYOK option searches | The search query the model issues. Built-in `web_fetch` remains blocked |
| **Openverse and the selected image host** | You enable **Free image search**, the model searches, and an image is selected | The search query, then a bounded image download. No credential. Only locally revalidated CC0/Public Domain Mark results are accepted |
| **`registry.modelcontextprotocol.io`** | You search the **MCP Registry** in Settings | Your search terms. Nothing about your projects, and no credential |
| **`api.figma.com`** | You run a Figma **REST import** | The file and node ids from the URL you pasted, authenticated with **only** your Figma personal access token |
| **Google Stitch** | You validate a Stitch key, generate a screen, or import a project with the bundled SDK — or a trusted Stitch MCP server is called | The prompt or project reference, authenticated with **only** your Stitch API key. HTML and image downloads made on its behalf are `https://` and size-bounded |
| **`github.com` / `api.github.com`** | You choose **Sign in with GitHub**, or a skill is imported from a public GitHub folder | For sign-in: the device-flow exchange with the app's **public client id** — no client secret, and nothing about your projects. Where that flow is unavailable the official CLI performs the login instead and shot2code never sees the token. For a skill: a request for the files in the folder URL you pasted |
| GitHub Copilot | Listing the models your account can use | The Copilot credential, to ask which models the signed-in plan offers. No prompt, project or screenshot is sent |
| Gemini | Asset extraction, or video/screen-recording input | The selected image or recording |
| Replicate | Image generation, editing or background removal | The prompt and the source image, if any, authenticated with only the Replicate key |
| Cloudflare Workers AI | Image generation with Cloudflare selected | The prompt, authenticated with only the Cloudflare account id/token |
| Your OpenAI-compatible image endpoint | Image generation or supported editing with that provider selected | The prompt and source image, if any, sent to the configured endpoint with its dedicated credential |
| **ScreenshotOne** | You capture a URL, or test its key | The URL to capture, authenticated with only that key |
| `github.com` | Update check on per-user NSIS installs | Nothing about you: a request for the release feed |
| A URL you paste | You generate from a URL | A request to that URL to capture it |
| **A provider you test** | You choose **Test** in **Settings → Connection checks**, or **Test model access** | One minimal request — a single-word prompt capped at 16 tokens — authenticated with **only** that provider's credential. Replicate is checked against its account endpoint instead, so no prediction is started |
| **Your own endpoint** (model discovery) | You choose **Test model access** on an OpenAI-compatible connection | A request to that endpoint's `/models` route, to list the model ids it serves |
| CodePen | You confirm a share | The code being shared |
| GitHub Issues | You explicitly submit **Help → Feedback** through an already authenticated `gh` CLI, or open the browser fallback | The category, title and body you reviewed. Logs, prompts, screenshots, history, project files and credentials are never attached automatically |

The model lists for OpenAI, Anthropic and Gemini are **maintained catalogues
inside the app**, so choosing models for those providers contacts nobody. The
BYOK list is derived from the connection you configured, not fetched from it.
The catalogue is served to the UI by the local backend on `/api/models`, which
reports provider availability and model capabilities and **never returns a key or
token**.

A connection check sends **only the credential for the provider being tested**.
Testing Gemini never puts an OpenAI key on the wire, and a check that names its
own OpenAI base URL must carry its own key — the key configured on the server is
only ever used with the server's own endpoint.

**Capture-only credentials never reach a model.** The Figma personal access
token is used for `api.figma.com` and nothing else; the Google Stitch API key is
used by the bundled SDK and nothing else. Neither is included in a generation
request, written into project history, or present in an export.

Two things deliberately contact nothing:

- **Validating a BYOK connection or an MCP server** checks the configuration
  only. No endpoint is called, no MCP server is started. The live **Test model
  access** and per-provider checks are separate actions, and the app says they
  contact the endpoint before you use them.
- **The Review source audit** runs locally against the generated source. No code
  and no finding is uploaded. The optional **AI review** is the opposite and is
  listed above; it is a real provider request.

**Imported skills contact nothing after they are imported.** Importing from a
public GitHub folder makes the requests above; afterwards the skill is local
text, and its scripts are never executed.

Nothing else is contacted in normal use. Opening a link from the in-app **Help**
centre hands the URL to your default browser — the app itself fetches nothing for
Help, and every target is a public page on this hub or the source repository.
Previews may load CDN-hosted framework assets declared by the generated page
itself (for example a Tailwind or Bootstrap CDN); those requests come from the
preview document, not from a background service. **Stack preview** renders in the
same sandbox and runs no package script or project configuration.

## 2. What is stored on disk

| Path | Contents | Removed by |
| --- | --- | --- |
| `%LOCALAPPDATA%\shot2code\history.sqlite3` | Projects, versions, variants, prompts and variant messages | Deleting a project in **Recent projects**, or deleting the folder |
| `%LOCALAPPDATA%\shot2code\` (skills) | Agent Skills you imported — their text and any script files they carry, stored as inert resources | Removing the skill in **Settings → Agent Skills**, or deleting the folder |
| `%APPDATA%\shot2code-desktop\` | Desktop shell state, `window-state.json`, the **encrypted GitHub token** from the in-app sign-in, and `shot2code-backend.log` | **Disconnect GitHub from shot2code** for the token; deleting the folder for the rest |
| `%TEMP%\shot2code-installer-preinstall.log` | What the installer's pre-install safeguard found and stopped — process paths and outcome, no project data | Deleting the file |
| The app's own local storage | Provider and image-provider keys, the BYOK connection (including its key or bearer token), MCP server definitions (including their environment values and request headers), web-search settings, the Figma access token, the Stitch API key, the ScreenshotOne key, selected models, Review widths, pane widths, preview source/zoom and UI preferences | Clearing them in **Settings** |
| `backend/.env` (*source only*) | Optional provider, image-provider and search credentials documented in the source repository | Editing the file |

The history database is **not encrypted**. Treat it like any other local project
folder: it contains your prompts and your generated code.

**The GitHub token from the in-app sign-in is encrypted** with Electron
`safeStorage`, which uses the operating system's own key store, along with its
refresh token. Disconnecting removes it and leaves any `gh` or Copilot CLI
session on the machine untouched, because shot2code did not create those.

**No credential is written into the history database.** A version records the run
identity behind each option — `gpt-5.6-sol (high thinking)`, or
`sdk-byok/azure/gpt-5.6-sol (high thinking)` — and nothing about the key, the
endpoint, an MCP server, Figma or Stitch. The same is true of an exported Review
report and of the `DESIGN.md`, `SKILL.md` and palette exports from the Design
Inspector.

**Project data lives outside the installation directory**, and the installer is
configured not to delete application data, so upgrading or replacing the
installed program keeps every project, version and prompt.

Layout preferences — pane widths, Review viewport widths, preview tab/source and
zoom — are view state in the app's own local storage, never in the history
database. Native window bounds/maximized state is stored separately in
`window-state.json`. Resizing a pane or window cannot create or alter a project
version, option or retry.

The database location can be redirected with `SHOT2CODE_DATA_DIR` or
`SHOT2CODE_HISTORY_DB_PATH`.

## 3. API keys and credentials

- Keys entered in **Settings** are stored by the app on that device only. They are
  sent to the backend with a generation request and used to call that provider —
  they are not stored server-side (there is no server) and are not sent anywhere
  else.
- **The Copilot SDK BYOK connection carries its own credential.** The key or
  bearer token you enter for it is used only for that endpoint; the direct
  OpenAI and Anthropic keys are never substituted for it. An OpenAI-compatible
  endpoint on `localhost` may be configured without one.
- **MCP environment values and request headers are treated as secrets.** They
  are masked in the server list, masked and read-only in the editor until you
  reveal them, and only their *names* appear in a diagnostic or a validation
  response. Values are excluded from logs, from project history and from the
  exported review report.
- **The GitHub token from the in-app sign-in is encrypted at rest.** The desktop
  app runs a GitHub OAuth device flow with a **public client id and no client
  secret**, and stores the access and refresh tokens through Electron
  `safeStorage`. They are handed to the backend in its process environment on a
  serialised restart, never written into project data, and removed by
  **Disconnect GitHub from shot2code** — which does not end a `gh` or Copilot
  CLI session on the same machine.
- **The Figma access token and the Google Stitch API key are capture-only.** The
  Figma token is sent to `api.figma.com` only; the Stitch key reaches only the
  bundled SDK. Neither is placed in a generation request, in project history or
  in an export.
- The local `/api/models` route uses those credentials only to decide which
  providers are usable and, for Copilot, to read the account's model list. It
  returns provider availability and model capabilities, never a key or token.
  `/api/integrations/validate` answers with presence flags, a host name and
  diagnostics — never a credential.
- Image-provider and web-search credentials are read from current Settings at
  send time. Closed serialization allowlists prevent any key, bearer token, MCP
  environment value or request header from reaching a project snapshot.
- GitHub Copilot credentials are resolved at request time: a token in Settings,
  then `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`, then a stored
  `copilot` login, then a stored `gh auth login`. Tokens are not persisted by the
  app and not logged; the model cache is keyed by a SHA-256 fingerprint of the
  credential rather than the credential itself.
- Redact keys and tokens from logs and screenshots before attaching them to an
  issue.

## 4. Telemetry

There is **no analytics or telemetry SDK** in the app. Nothing about your usage,
your prompts or your projects is collected by the project.

The only unsolicited network call is the update check on per-user installs, which
reads the public GitHub Releases feed.

## 5. Imported projects and skills

Imported code is treated as untrusted input:

- **It is never executed.** The scanner parses text only; it does not import
  `tailwind.config.*` or any other configuration or application module, and it
  runs no install or build commands.
- Path traversal is rejected; dependency and build-output directories are ignored;
  archive size, entry count, file count, per-file size and total decoded text are
  all capped.
- Raw imported source is **not** written into persisted project context. Only the
  compact summary is stored; the normalized payload exists for the active
  editable-import handoff.
- Imported files are not uploaded anywhere by the import itself. Whatever ends up
  in the working project context can be sent to your provider on a later
  generation, exactly like the rest of the project.

**Agent Skills are treated the same way.** A skill imported from a local folder
or a public GitHub folder is validated (front matter, normalised paths, bounded
file count and size), stored under shot2code's data directory with a record of
where it came from, and **disabled until you enable it**. A skill may contain
script files; they are kept as inert resources and **cannot be executed**,
because shot2code exposes no shell tool and no unrestricted host-filesystem tool
to any model. An enabled skill's text reaches a Copilot or BYOK run as
instructions, like the rest of the prompt.

## 6. Generated code and previews

- Preview documents render in an **opaque origin** (an iframe without
  `allow-same-origin`) under a restrictive Content-Security-Policy, a
  `no-referrer` policy, and a permissions list denying camera, microphone,
  geolocation and display capture. The Review frames render the same artifact
  under the same protections, at two to four real widths. **Stack preview** uses
  the same sandbox and executes **no package script and no project
  configuration**.
- Select-and-edit uses a per-preview message bridge with a random nonce and capped
  payloads.
- **The Review source audit is local and offline.** It parses the generated
  source in the app and reports findings; nothing is uploaded, and no provider is
  contacted to produce it. The optional **AI review** is a separate, explicit
  action: it sends the generated source to the model that option ran on, with no
  tools, MCP servers, skills or web search attached. An exported report contains
  severities, rule ids, messages, evidence, guidance and the binding it was
  produced from, with file paths reduced to a leaf name and no credential of any
  kind. It is an automated source check, **not a WCAG conformance assessment**.
- **Design Inspector exports are local.** `DESIGN.md`, `SKILL.md` and the palette
  PNG are produced from the generated source in the app and carry no credential.
- Generated code is still model output. **Review it before running it outside the
  preview**, especially anything touching the network, the filesystem or
  credentials.
- CodePen sharing sends code to a third party. It is never automatic, always asks
  first, and public Pens may be visible to others.

## 7. Verifying these claims

- Run the app behind an HTTP proxy and watch the destinations for a generation, an
  import and an idle session. Validating a BYOK connection or an MCP server, and
  running a Review audit, should add no outbound request at all. Searching the
  MCP Registry, importing a skill from GitHub, a Figma REST import, a Stitch
  call, an AI review and a web search each appear only when you take that
  action, and carry only that feature's own credential.
- Disconnect the network: the app starts, projects open from the local database,
  and generation fails with a provider error rather than silently doing something
  else.
- Inspect `%LOCALAPPDATA%\shot2code\history.sqlite3` with any SQLite client to see
  exactly what is stored — including that a version records only the run identity
  behind each option, never a key or an endpoint.
- Read `%APPDATA%\shot2code-desktop\shot2code-backend.log` for what the backend did
  at startup.

## 8. Deleting your data

1. Delete individual projects from **Recent projects** — that removes the project
   and all of its versions from the device.
2. Clear provider keys in **Settings**, along with the BYOK connection's
   credential, the Figma access token, the Stitch API key, the ScreenshotOne key
   and any MCP server whose environment values or headers hold a token. Deleting
   a server removes its stored values with it. Choose **Disconnect GitHub from
   shot2code** to remove the encrypted GitHub token — a `gh` or Copilot CLI
   session on the machine is separate and is signed out with that tool.
3. Remove any Agent Skills you imported in **Settings → Agent Skills**.
4. Uninstall the app ([INSTALL.md](INSTALL.md#uninstalling)). **An uninstall
   deliberately leaves your projects in place**, so that an upgrade cannot
   destroy them.
5. Delete `%LOCALAPPDATA%\shot2code\` and `%APPDATA%\shot2code-desktop\`.
