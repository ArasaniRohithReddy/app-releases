# shot2code — data handling &amp; privacy

This page enumerates what shot2code stores, what it sends, and where. It describes
the published Windows build; anything marked *source only* is unavailable in the
packaged app. The behaviour described here can be checked against the source at
[ArasaniRohithReddy/shot2code](https://github.com/ArasaniRohithReddy/shot2code).

**Summary:** screenshots, generated code, project history and API keys stay on
your machine. The only outbound traffic is the request to the model provider you
configured, the update check, and anything you explicitly share.

## 1. What leaves the device

| Destination | When | What is sent |
| --- | --- | --- |
| The model provider you configured (GitHub Copilot, Gemini, Anthropic or OpenAI) | You start or refine a generation | Your prompt, the screenshots/URL/description you supplied, and the working project context the agent needs |
| **Your own endpoint** (Copilot SDK BYOK) | You start or refine a generation with a `sdk-byok/…` option selected | The same request, sent to the base URL you configured, authenticated with that connection's own key or bearer token |
| **An MCP server you enabled and trusted** | A Copilot or BYOK option calls one of its tools | The tool call the model made, plus the environment values or request headers you configured for that server |
| GitHub Copilot | Listing the models your account can use | The Copilot credential, to ask which models the signed-in plan offers. No prompt, project or screenshot is sent |
| Gemini | Asset extraction, or video/screen-recording input | The selected image or recording |
| Replicate (*source only*) | Image generation, editing or background removal | The prompt and the image you act on |
| `github.com` | Update check on per-user NSIS installs | Nothing about you: a request for the release feed |
| A URL you paste | You generate from a URL | A request to that URL to capture it |
| **A provider you test** | You choose **Test** in **Settings → Connection checks**, or **Test model access** | One minimal request — a single-word prompt capped at 16 tokens — authenticated with **only** that provider's credential. Replicate is checked against its account endpoint instead, so no prediction is started |
| **Your own endpoint** (model discovery) | You choose **Test model access** on an OpenAI-compatible connection | A request to that endpoint's `/models` route, to list the model ids it serves |
| **GitHub, via the official CLI** | You choose **Sign in with GitHub** | Nothing from shot2code. The CLI runs its own web flow in your browser and stores the credential itself; shot2code never sees the token |
| CodePen | You confirm a share | The code being shared |

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

Two things deliberately contact nothing:

- **Validating a BYOK connection or an MCP server** checks the configuration
  only. No endpoint is called, no MCP server is started. The live **Test model
  access** and per-provider checks are separate actions, and the app says they
  contact the endpoint before you use them.
- **The Review source audit** runs locally against the generated source. No code
  and no finding is uploaded.

Nothing else is contacted in normal use. Opening a link from the in-app **Help**
centre hands the URL to your default browser — the app itself fetches nothing for
Help, and every target is a public page on this hub or the source repository.
Previews may load CDN-hosted framework assets declared by the generated page
itself (for example a Tailwind or Bootstrap CDN); those requests come from the
preview document, not from a background service.

## 2. What is stored on disk

| Path | Contents | Removed by |
| --- | --- | --- |
| `%LOCALAPPDATA%\shot2code\history.sqlite3` | Projects, versions, variants, prompts and variant messages | Deleting a project in **Recent projects**, or deleting the folder |
| `%APPDATA%\shot2code-desktop\` | Desktop shell state and `shot2code-backend.log` | Deleting the folder |
| `%TEMP%\shot2code-installer-preinstall.log` | What the installer's pre-install safeguard found and stopped — process paths and outcome, no project data | Deleting the file |
| The app's own local storage | Provider API keys, the BYOK connection (including its key or bearer token), MCP server definitions (including their environment values and request headers), selected models, Review widths, pane widths and UI preferences | Clearing them in **Settings** |
| `backend/.env` (*source only*) | `REPLICATE_API_KEY`, optional `OPENAI_BASE_URL` | Editing the file |

The history database is **not encrypted**. Treat it like any other local project
folder: it contains your prompts and your generated code.

**No credential is written into the history database.** A version records the run
identity behind each option — `gpt-5.6-sol (high thinking)`, or
`sdk-byok/azure/gpt-5.6-sol (high thinking)` — and nothing about the key, the
endpoint or an MCP server's environment. The same is true of an exported Review
report.

Layout preferences — the chat and file-explorer pane widths — and your Review
viewport widths are view state in the app's own local storage, never in the
history database. Resizing a pane cannot create or alter a project version, an
option or a retry.

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
- The local `/api/models` route uses those credentials only to decide which
  providers are usable and, for Copilot, to read the account's model list. It
  returns provider availability and model capabilities, never a key or token.
  `/api/integrations/validate` answers with presence flags, a host name and
  diagnostics — never a credential.
- `REPLICATE_API_KEY` has no Settings field by design. It must be set in
  `backend/.env`, which means it is only usable when running from source.
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

## 5. Imported projects

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

## 6. Generated code and previews

- Preview documents render in an **opaque origin** (an iframe without
  `allow-same-origin`) under a restrictive Content-Security-Policy, a
  `no-referrer` policy, and a permissions list denying camera, microphone,
  geolocation and display capture. The Review frames render the same artifact
  under the same protections, at two to four real widths.
- Select-and-edit uses a per-preview message bridge with a random nonce and capped
  payloads.
- **The Review source audit is local and offline.** It parses the generated
  source in the app and reports findings; nothing is uploaded, and no provider is
  contacted to produce it. An exported report contains severities, rule ids,
  messages, evidence, guidance and the binding it was produced from, with file
  paths reduced to a leaf name and no credential of any kind. It is an automated
  source check, **not a WCAG conformance assessment**.
- Generated code is still model output. **Review it before running it outside the
  preview**, especially anything touching the network, the filesystem or
  credentials.
- CodePen sharing sends code to a third party. It is never automatic, always asks
  first, and public Pens may be visible to others.

## 7. Verifying these claims

- Run the app behind an HTTP proxy and watch the destinations for a generation, an
  import and an idle session. Validating a BYOK connection or an MCP server, and
  running a Review audit, should add no outbound request at all.
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
   credential and any MCP server whose environment values or headers hold a
   token. Deleting a server removes its stored values with it.
3. Uninstall the app ([INSTALL.md](INSTALL.md#uninstalling)).
4. Delete `%LOCALAPPDATA%\shot2code\` and `%APPDATA%\shot2code-desktop\`.
