# Troubleshooting shot2code

A symptom-first runbook for the published Windows build. If you are looking for
*what a feature does* rather than *why it is not working*, start with the
[FAQ](FAQ.md) or the [user guide](USER-GUIDE.md).

Everything here is local: shot2code has no service to check and no status page.
Almost every failure is answered by one of three things — the backend log, the
provider credential the app can actually see, or a process that did not exit.

- [Start here](#start-here)
- [Where the logs and data live](#where-the-logs-and-data-live)
- [The app will not start](#the-app-will-not-start)
- [Providers and the model catalogue](#providers-and-the-model-catalogue)
- [Copilot SDK BYOK](#copilot-sdk-byok)
- [MCP servers](#mcp-servers)
- [Generation fails or is wrong](#generation-fails-or-is-wrong)
- [The Review workspace](#the-review-workspace)
- [Screenshot preview, Chromium and screen recording](#screenshot-preview-chromium-and-screen-recording)
- [Importing a project](#importing-a-project)
- [Preview, export and CodePen](#preview-export-and-codepen)
- [History and recent projects](#history-and-recent-projects)
- [Installing and updating](#installing-and-updating)
- [Reporting a problem](#reporting-a-problem)

## Start here

Four checks resolve most reports before they become issues:

1. **Which version?** **Settings** shows the running version and the update
   state. Compare it with the [changelog](CHANGELOG.md) and the
   [releases page](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/).
   Fixes land in the newest release; reproduce there first.
2. **Which install format?** NSIS `.exe` (per-user, self-updating), `.msi`
   (per-machine, managed, no self-update) or the portable `.zip`. The format
   changes what updating and uninstalling can do — see [INSTALL.md](INSTALL.md).
3. **Which provider?** The chat panel's status callout reports only what the app
   can see from the window. A GitHub Copilot sign-in or a key in `backend/.env`
   is invisible to it, so "no provider saved" is not the same as "no provider".
   A Copilot SDK BYOK connection is a separate credential again — check its own
   card in **Settings**.
4. **Read the log, not the console.** The window is a renderer; the interesting
   failures are in the backend log below.

## Where the logs and data live

| What | Path |
| --- | --- |
| Backend startup, renderer load failures, crashes, console errors | `%APPDATA%\shot2code-desktop\shot2code-backend.log` |
| Installer pre-install safeguard (per-user and silent installs) | `%TEMP%\shot2code-installer-preinstall.log` |
| Projects, versions and prompts | `%LOCALAPPDATA%\shot2code\history.sqlite3` |
| Everything else the app stores on this device | `%LOCALAPPDATA%\shot2code\` |

Paste a path into the Explorer address bar to open it. In the packaged desktop
app, **Help → Support → Open diagnostic logs** opens the backend log's folder
directly and reports whether it succeeded; the browser development build has no
such log and says so. The backend log is plain text and is the file to read first
for a blank window, a splash screen that never clears, or an update that did not
install.

The database is **not** encrypted: it holds your prompts and generated code, so
treat it like any other local project folder. [DATA-HANDLING.md](DATA-HANDLING.md)
lists every path and every network destination.

## The app will not start

| Symptom | Cause and fix |
| --- | --- |
| First launch sits on the splash screen for a few seconds | Expected. The splash stays until the frozen Python backend answers its health check — normally about 5–11 seconds from 0.3.3. A fresh portable copy or the first launch after an update takes longer (around 40 seconds) while Windows scans the newly written tree. |
| The splash screen never clears | The shell gives up after 90 seconds and logs how long readiness took. Read `shot2code-backend.log`: it records whether the backend exited, failed to spawn, or answered health with something other than `{"ok": true}`. Startup no longer waits on Chromium or Copilot, so a missing optional capability is not the cause. |
| The window is blank, or never appears at all | Read `shot2code-backend.log`. It records backend startup, `did-fail-load`, renderer crashes and console errors, which is the difference between "the backend never came up" and "the UI failed to load". In the packaged app, **Help → Support → Open diagnostic logs** opens that folder for you. |
| "Backend did not become ready in time" | Usually a partially replaced install: an older updater could overwrite files while the backend was still running, leaving native modules missing. Download the newest installer from the releases page and run it manually (right-click → **Properties** → **Unblock** first). |
| Generation fails on a backend that reported healthy earlier | A deferred feature failed to load. Those routers are imported on first use; if one cannot load, the request returns an error and health starts failing too, so the log will show it. Restart the app and read `shot2code-backend.log`. |
| The app starts, but everything says no provider | Nothing is wrong with the app. Go to [Providers and the model catalogue](#providers-and-the-model-catalogue). |
| Windows says "Windows protected your PC" | Expected — the builds are not code-signed. Verify the SHA-256 hash against `SHA256SUMS.txt` from the same release first, then **More info → Run anyway**. See [INSTALL.md](INSTALL.md#about-the-smartscreen-warning) and [SECURITY.md](SECURITY.md). |

## Providers and the model catalogue

shot2code ships no model and no inference. It needs **one** of: a GitHub Copilot
sign-in, a Gemini, Anthropic or OpenAI API key, or a Copilot SDK BYOK connection.
Without one, generation fails immediately and says so.

| Symptom | Cause and fix |
| --- | --- |
| "No API key found and no GitHub Copilot credentials detected" | Use **Settings → GitHub Copilot → Sign in with GitHub**, run `gh auth login` (or `copilot`) once and restart shot2code, or paste a key into **Settings**. |
| **Sign in with GitHub** is disabled and says it is unavailable | Neither the GitHub Copilot CLI nor the GitHub CLI is on `PATH`. The warning links the official install instructions. You can still sign in from a terminal or paste a token. |
| The browser opened but Settings still says "Not signed in" | Finish the flow in the browser — the app polls until the CLI reports a result, and only then re-probes. If you closed the window, choose **Cancel** and try again. |
| Sign-in is refused with "can only be started from the shot2code app on this machine" | Starting a sign-in spawns a process, so it is only accepted from the app itself. Use the button in Settings rather than calling the API from elsewhere. |
| Copilot shows "Not signed in" although the CLI works | Credentials are resolved in order: a token in **Settings**, then `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`, then a stored `copilot` login, then `gh auth login`. Sign in again and restart so the check re-runs. A fine-grained token with the **Copilot Requests** permission also works. |
| A provider is missing from **Settings → Models** | A provider appears only once the app can see a credential for it. Add the key first; the catalogue follows. A BYOK connection never makes a native provider available — each still needs its own key. |
| The Copilot list is empty even though you are signed in | Only models that accept images are offered, because turning a screenshot into code requires image input. An empty list usually means your plan currently has no vision-capable model. |
| A model you used before has vanished | Deprecated models are hidden unless you tick **Show deprecated models** — or unless one is already selected, in which case it stays visible where you picked it. |
| "N saved models can no longer run" | The key for them was removed, or the provider retired them. They are ignored rather than deleted silently; use **Remove** to clear them. |
| Your whole selection reset itself | It should not, and it does not: if the catalogue cannot be loaded at all, the saved selection is left untouched rather than being cleared. |
| Fewer options than models you ticked | The per-run cap applies: up to 4 options for a first generation, up to 2 for an update or a video. Only the first models up to the limit run, and the picker says so in words. |
| No models at all in video mode | In video mode the list is filtered to models that can read video. Everything else would fail on the input. BYOK options are not offered for video either. |

Keys are stored on the device you entered them on and are sent only to the
provider they belong to. `REPLICATE_API_KEY` has no Settings field — it is read
from `backend/.env`, so it applies to source runs only.

### Reading a connection check

**Settings → Connection checks** tests one provider at a time with a single tiny
request. What it reports is what to do:

| Result | Cause and fix |
| --- | --- |
| **Out of credit** | The credential is valid; the account has nothing left to spend. Follow the billing link in the result. Waiting does **not** help — providers report an empty balance in a way that reads like a rate limit. |
| **Key rejected** | The credential was refused. Check it for a typo, or issue a new one and paste it in. |
| **Rate limited** | Temporary. Try again shortly, or generate fewer options at once. |
| **Access denied** | The account cannot use that model. Enable it on the provider, or pick another in **Settings → Models**. |
| **Model unavailable** | The provider does not offer the model that was tried. Pick another. |
| **Configuration problem** | Usually a missing key, or a base URL the request cannot use. |
| **Could not reach the provider** | Network, proxy or firewall. The provider was never reached. |
| "A custom OpenAI base URL needs its own API key in the same request" | Deliberate. The key configured on the server is only used with the server's own endpoint, so a request naming its own base URL must carry its own key. |
| "This backend does not offer connection checks yet" | The backend predates the feature. Start a generation to find out whether the credential works. |

A check is a real request and may use a little quota on a metered account.
Replicate is checked against its account endpoint, so it starts no prediction.

## Copilot SDK BYOK

BYOK is optional and additive. Nothing here stops a direct generation: an
incomplete connection is reported as a notice and skipped.

| Symptom | Cause and fix |
| --- | --- |
| No **Copilot SDK (BYOK)** group in **Settings → Models** | The connection is switched off or not usable yet. The card states the reason — *switched off*, *needs its own API key or bearer token*, or *needs the endpoint URL of your Azure OpenAI resource*. |
| "Add a dedicated API key…" although OpenAI already works | That is intended. BYOK carries its own credential; the direct OpenAI and Anthropic keys are never borrowed for it. Only an **OpenAI-compatible** endpoint on `localhost` may run without one. |
| "must use https:// unless it points at localhost" | Plain `http://` is only accepted for a loopback host. Use `https://`, or point the base URL at `localhost`/`127.0.0.1`. |
| Azure refuses to validate | Azure needs the endpoint URL of your resource **and** its own credential. The `api-version` field applies to Azure only. |
| You want a Gemini BYOK option | There is none. The Copilot SDK has no Gemini provider, so Gemini models always use the Gemini API key directly. The app reports this as a notice. |
| Selecting a BYOK option seems to have moved a native one | It has not. A native pick always runs on its native provider; the two are separate identities and produce separate options. Check the identity recorded against each option in **History**. |
| A saved BYOK pick stopped matching | You changed the connection's provider, or switched it off. The card says how many selected options no longer match; reselect them in **Settings → Models**. |
| **Validate connection** succeeds but generation fails | Validation checks the settings only — it never calls your endpoint. Use **Test model access** to contact it. A failure at generation time is the endpoint's own response, passed through unchanged. |
| **Test model access** finds no models to choose from | Only OpenAI-compatible endpoints expose `/models`. Azure OpenAI and Anthropic do not list models here, so type the model id (or Azure deployment name) by hand. |
| "The endpoint does not list ‹model›" | The name is not one the endpoint reported. Pick one from the list the check returned, or check the spelling. |
| The endpoint model you typed is refused | Ids may be up to **128** characters and may contain `. _ : / @ + -`. Spaces are not allowed. An over-long id is reported rather than trimmed, because trimming would run a different model. |
| The model answers the check but generation fails on the first screenshot | The model must support **image input and tool calling**. A text-only model passes a plain-text check and then fails a real run. Neither the check nor the endpoint's model list can tell you which models qualify — see the endpoint's documentation. |
| Your endpoint rejects the request shape | The **Wire API** is **Automatic** by default: Chat Completions for an endpoint with its own base URL, Responses for a provider's own endpoint. Pin the one your endpoint needs. |
| Only one option appears for your endpoint | Correct, when you named an endpoint model the catalog does not know. It appears once as `‹model› via ‹provider›`; listing catalog names against it would be untrue. |

## MCP servers

| Symptom | Cause and fix |
| --- | --- |
| A server is configured but no tools appear | A server needs **both** switches: **Enabled** *and* **Trusted**. Until then the picker reports *"'‹name›' is not marked trusted, so shot2code will not start it or approve its tools."* |
| Tools appear for one option but not another | MCP reaches the SDK runtimes only. GitHub Copilot options and Copilot SDK BYOK options get the tools; an option on your own OpenAI, Anthropic or Gemini key never does. |
| A tool that should change something does nothing | Servers are read-only by default. Turn on **Allow write tools** for that server — it is the switch that permits changing files, data or remote state. |
| "Use https:// unless the server runs on localhost" | An `http://` URL is accepted only for a loopback host. |
| "A local server needs a command to run" | A `stdio` server needs its command. Arguments go **one per line**, because the command is spawned as an argument vector rather than through a shell. |
| Quoting in the command does not behave like a shell | Correct — there is no shell. Split the command and each argument into their own fields instead of relying on `cmd` or PowerShell quoting. |
| "Another server already uses the name…" | Two names reduce to the same internal id. Give them distinct names. |
| A value you typed is now masked | Environment values and request headers that look like credentials are masked on purpose. Use **Show values to edit** to reveal them for editing. |
| **Validate servers** passes but a server never starts | Validation checks the configuration only; it starts nothing. Check the server's own command, URL or credentials. |

## Generation fails or is wrong

| Symptom | Cause and fix |
| --- | --- |
| The run stops with a provider error | The request reached the provider and it refused. Quota, rate limits, model availability and billing belong to your account, not to shot2code; the message is passed through unchanged. |
| The generated code is wrong, inaccessible or insecure | It is model output, not a guarantee. Refine it in chat, retry the version to re-roll it, or edit the files directly — and review anything before you run it outside the sandboxed preview. |
| Only one of several screenshots appears | Upload them together and choose **Separate pages**. That mode requires one navigable view per screenshot. **Responsive views** is for the same page at different widths, **UI states** for before/after states. |
| A refinement replaced work you wanted to keep | Nothing is overwritten — each refinement is a new version. Step back through **History**. |
| The result ignores an imported component | Imported component paths are naming and API context. A generated preview is self-contained, so it cannot resolve imports from your local project. |

## The Review workspace

| Symptom | Cause and fix |
| --- | --- |
| The result says **stale** | A review is bound to the version, the option, a hash of the source it read and the widths it ran at. Change any of those and it is marked stale rather than shown as current. Run it again. |
| "Width must be between 320px and 1920px." | Custom widths are whole numbers in that range. The input refuses anything else instead of clamping it silently. |
| You cannot remove a frame | Keep between two and four. One frame is not a comparison; more than four stops being readable. |
| A frame shows overflow you cannot see in Preview | Overflow is measured in the running frame at that real width. Preview at 100% is one width — Review is the one that exercises the others. |
| The audit missed an accessibility problem | It is a bounded set of source rules, not a conformance tool. It is **not a WCAG assessment** and does not replace testing with assistive technology. A framework project's runtime DOM can also differ from the source it read. |
| Findings were not sent to the model | By design. Selected findings are written into the composer for you to read, edit and send. Nothing is sent on your behalf. |
| You want to attach the result to an issue | Export the JSON report. It carries severities, rule ids, messages, evidence and guidance, reduces file paths to a leaf name, and contains no credential of any kind — read it before posting, as with any export. |

## Screenshot preview, Chromium and screen recording

**Screenshot preview** is the tool the agent uses to render its own output and
check its work. Chromium ships with the desktop app; **Settings** reports whether
it is available, and if it is not, the app skips that tool instead of failing the
run. Only the headless shell is bundled — full Chromium would add several hundred
megabytes and the app always launches headless.

When Settings reports it unavailable, **Check again** re-probes the backend, so
you can fix the cause and confirm it without restarting shot2code. The advice
depends on how you are running it:

| Running | What the warning says |
| --- | --- |
| The packaged desktop app | The browser is bundled, so **nothing needs installing**. It could not start. Restart shot2code, then **Check again**; if it still fails, reinstall and open the diagnostic log — antivirus quarantining the bundled browser is the usual cause |
| From source | The browser is genuinely missing. Run `cd backend && uv run playwright install chromium-headless-shell`, restart the backend, then **Check again** |

**"Could not start screen recording"** means the app could not grant itself
permission to the display. Search the backend log for a `screen capture` line: it
records which source was chosen, or why the request failed. Video and screen
recording input also need a Gemini key.

## Importing a project

Import reads a folder, a ZIP or individual source files. It parses text — it
**never** executes your project's code, including `tailwind.config.js`.

| Symptom | Cause and fix |
| --- | --- |
| No components or tokens were found | The scanner reads HTML, CSS, JavaScript, TypeScript, Vue, JSON, Markdown and YAML, and skips `node_modules`, build output, binaries and large files. Components are recognised from exported React/TypeScript components and `.vue` files; CSS variables and reusable classes become design tokens. |
| Part of the project is missing | Deliberate. There are limits on archive size, entry count, file count, per-file size and total decoded text. Point it at the part of the project you actually want as context. |
| The import was rejected outright | Unsafe or malformed input — traversal paths in an archive, for example — is refused rather than sanitised. |
| You wanted the files, not a summary | **Use as design context** keeps only a compact summary. Choose **Open editable project** to hand the normalized files to the editor instead. |

## Preview, export and CodePen

| Symptom | Cause and fix |
| --- | --- |
| The preview shows a fallback or a diagnostic | The preview is derived, not the source of truth. When a framework build or a local asset cannot be represented safely it degrades deterministically, while every source file stays editable and downloadable in the **Code** tab. |
| The preview scrolls sideways at **100%** | Intended. A fixed-width desktop canvas is centred in a neutral frame; when the window is narrower than the canvas the frame scrolls rather than cropping the start of the page. Use **Fit** to scale it down. |
| **CodePen** is greyed out | It is offered only when the selected stack can honestly run in a browser-only Pen. The status bar states the reason. Download the project folder for build-dependent stacks. Sharing always asks first, because the code leaves your device. |
| The exported project has a **Safe fallback** note | There was no valid root `package.json` build command, so export kept every source file rather than generating a plausible but broken scaffold. |
| **Format** did nothing | It is whitespace-only and deliberately conservative: it refuses component source (JSX/TSX/Vue) and leaves a file untouched when the syntax is ambiguous or unbalanced, so exports keep their original bytes. |

## History and recent projects

Every generation becomes a version. **History** is the name used everywhere in
the app — the rail entry, the **History _n_/_m_** preview control, and the
separate destination on narrow windows.

| Symptom | Cause and fix |
| --- | --- |
| **History** is not visible on a narrow window | It is not hidden behind the Preview/Chat switch; it is a third labelled destination in the top bar. |
| The options strip is missing | It appears only when a version actually has more than one option. |
| A retry looks like an unrelated branch | It should not: a retry reuses the provider and model choices behind the original options and keeps a link to the version it re-rolls. |
| A project is gone from **Recent projects** | Deleting a project removes it and all of its versions from the device. There is no cloud copy and no undo. |
| Recent work is missing after reinstalling | Projects live in `%LOCALAPPDATA%\shot2code\history.sqlite3`. An uninstall that removed that folder removed the history with it. |

## The workspace layout

| Symptom | Cause and fix |
| --- | --- |
| Settings will not scroll to its final controls | Update to v0.4.0 or newer. Settings now owns a viewport-bounded scroll area in both empty and active projects. On an older build, close Settings, resize the window or reduce zoom temporarily, then install the current release. |
| There is no divider to drag | Dividers appear on windows at least 1280px wide. Below that, **Preview**, **Chat** and **History** stay separate destinations by design. The explorer divider also needs a project with more than one file. |
| A pane is too narrow to use | Widths are clamped to the window, so neither side can be dragged away entirely. Press **Enter** or double-click a divider to restore its default, or **Home**/**End** to jump to the allowed limits. |
| Widths changed after resizing the window | Expected: saved widths re-clamp to the current viewport so both panes stay usable. |
| A pane cannot be moved with the keyboard | Focus the divider first, then use `←`/`→` (16px), `Shift`+`←`/`→` (64px), `Home`/`End`, `Enter` to reset, `Escape` to cancel a drag. |
| Resizing seems to have created a version | It cannot. Pane widths are a view preference stored separately from project data; resizing never creates or changes a version, an option, a retry or anything in History. |
| The app is too small or too large to read | In the desktop app, `Ctrl+=`/`Ctrl++` zoom in, `Ctrl+-` zooms out and `Ctrl+0` resets, in 10-point steps between 50% and 300%. Numpad add and subtract work with `Ctrl` too. |

## Installing and updating

| Symptom | Cause and fix |
| --- | --- |
| The installer seems to do nothing | It unpacks roughly 600 MB, so it can sit for a minute before showing progress. |
| The MSI says updates are managed by an administrator | Intentional. MSI is the per-machine deployment format and does not self-update. Use the `.exe` installer for per-user automatic updates. |
| An update downloaded but nothing happened | **Settings** shows **Restart & install** when a download is ready. The install runs silently and relaunches. |
| "The update was not started because shot2code could not shut down safely" | The safe outcome, not a crash: the updater refuses to replace files while the bundled backend tree may still be running. Quit the app completely and try again. |
| The installer stopped and could not stop the installed backend | The installer repeats the same check independently, so an update starting from an older client is protected too. It identifies processes by executable path under the installed `resources\backend` folder — never by process name — stops each tree, and refuses to replace anything it cannot confirm is stopped. Close shot2code and any leftover backend process, then run it again. A silent install returns a distinct exit code instead of a dialog, and both write to `%TEMP%\shot2code-installer-preinstall.log`. |
| You need an older version | Download it from the releases page and install it; the updater itself never downgrades. Not every older build shipped all four files — checksums arrived with 0.3.1 — so the page shows exactly what each release carries. |

## Reporting a problem

Bugs and ideas belong in this hub:
**[open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)**
and pick **shot2code**. Suspected vulnerabilities are
[reported privately](SECURITY.md), never in a public issue. The hub's
[support policy](../../SUPPORT.md) sets the triage order for issues filed here,
and [CONTRIBUTING.md](CONTRIBUTING.md) explains where code changes go.

Include, and a fix gets much faster:

1. **Version** from **Settings**, and the **install format** (`.exe`, `.msi` or `.zip`).
2. **Windows version and build**, and whether the install is per-user or per-machine.
3. **What you expected, what happened**, and the exact wording of any error.
4. **Which provider and which model** were selected — Copilot, OpenAI, Anthropic
   or Gemini — and whether the failure also happens with a different one.
5. **The tail of `shot2code-backend.log`** — **Help → Support → Open diagnostic
   logs** finds it for you — and
   `%TEMP%\shot2code-installer-preinstall.log` for an install or update problem.
6. **The input**, if you can share it: the screenshot, URL or description, the
   output stack, and the multi-screenshot mode you chose.

**Never paste secrets into a public issue.** Redact before you attach anything:

- API keys, GitHub tokens and anything from `backend/.env` — log lines can quote
  them, and an issue is public and permanently indexed.
- Screenshots of **Settings** showing a key, even partially.
- `history.sqlite3`, exported projects or generated code you do not want public;
  they contain your prompts and your work.
- Screenshots of internal systems. Redact or reproduce the problem with a
  throwaway example instead.

If a credential does leak, revoke it with the provider immediately — deleting the
comment is not enough.
