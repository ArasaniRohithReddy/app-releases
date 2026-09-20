# shot2code

**Turn a screenshot into working code — on your own machine.**

[![Latest release](https://img.shields.io/github/v/release/ArasaniRohithReddy/app-releases?filter=shot2code-*&label=latest&color=4F46E5)](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)

shot2code is a **Windows desktop app**. Give it a screenshot, several related
screens, a URL, a written description or a screen recording, and it generates a
working page you can edit, version and export. Generation runs from your machine
against the model provider you configure; your screenshots, the generated code
and your API keys are not sent anywhere else.

**[Product site](https://arasanirohithreddy.github.io/app-releases/shot2code/)**
**[Downloads](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)**
**[Install](INSTALL.md)** **[User guide](USER-GUIDE.md)** **[FAQ](FAQ.md)**
**[Troubleshooting](TROUBLESHOOTING.md)**

Source code, issues about the code itself, and the upstream release notes live in
the project repository: **<https://github.com/ArasaniRohithReddy/shot2code>**.
This hub is where the Windows builds and their documentation are published.

## What you need

| Requirement | Detail |
| --- | --- |
| Operating system | Windows 10 or 11, 64-bit (x64). No macOS or Linux builds — run from source there. |
| Disk | The installer unpacks roughly 600 MB: the Python backend and a headless Chromium ship inside the app. |
| A model provider | **One** of: a GitHub Copilot sign-in (no API key), a Gemini, Anthropic or OpenAI API key, or a **Copilot SDK BYOK** connection to your own endpoint (no Copilot subscription needed). |

Without a provider, generation fails fast and says so. The app does not ship a
model and cannot generate anything on its own.

## What you can do

| Task | Where | Result |
| --- | --- | --- |
| Generate from a reference | Upload a screenshot, paste a URL, describe a screen, or record one | A working page in the stack you chose, usually as several parallel options |
| Choose which models try it | **Settings → Models**, or the picker beside the composer | One option per selected model, across Copilot, OpenAI, Anthropic, Gemini and your own BYOK endpoint |
| Use your own endpoint | **Settings → GitHub Copilot SDK BYOK** | Models served by your OpenAI-compatible, Azure OpenAI or Anthropic endpoint, selectable beside the native ones — including a model only your endpoint knows |
| Sign in to Copilot in the app | **Settings → Sign in with GitHub** | The official CLI's browser flow; the credential stays with that tool and shot2code never sees the token |
| Check a provider before generating | **Settings → Connection checks**, or **Test model access** | One tiny request per provider, answered as Ready, Out of credit, Key rejected, Rate limited, Access denied, Model unavailable, Configuration problem or unreachable |
| Give Copilot runs extra tools | **Settings → MCP servers** | Tools from MCP servers you enable *and* trust, offered to Copilot and BYOK options |
| Refine it | Chat panel, or select an element in the preview | A new version that keeps the previous one |
| Edit the source | Code tab | Multi-file tree, editor, whitespace-only **Format**, file badges |
| Check it at several widths | **Review** | Two to four real-width frames, overflow detection and a local source audit |
| Set how the width is shared | Drag (or keyboard-move) the chat and file-explorer dividers | A remembered view preference that never touches a project's versions |
| Step back through earlier attempts | **History** | Every version, the identity behind each option, and a retry that re-rolls one |
| Reopen earlier work | **Recent projects** | Projects, versions and prompts restored from the local database |
| Reuse an existing project | **Import → Folder, ZIP or source files** | Design context, or a normalized editable project |
| Drive it from the menu bar | **File · Edit · View · Window · Help** | The same commands as the keyboard, with project-only items disabled until they apply |
| Find a guide, or the log to attach | **Help** in the rail, or **Ctrl+/** | Get started, Guides, Support, shortcuts — and **Open diagnostic logs** in the desktop app |
| Take it away | **Download** | A single self-contained HTML file, or a Vite project folder |

## Output stacks

HTML + Tailwind · HTML + CSS · React + Tailwind · Vue + Tailwind · Bootstrap ·
Ionic + Tailwind · Alpine.js + Tailwind · Preact + Tailwind · Tailwind + daisyUI ·
Bulma · Material 3 · htmx + Tailwind

Each stack has an explicit single-HTML and project-folder export strategy, so the
download builds rather than being a plausible-looking scaffold. See
[USER-GUIDE.md](USER-GUIDE.md#exporting-a-project).

## Model providers

| Provider | Setup | Notes |
| --- | --- | --- |
| **GitHub Copilot** | **Sign in with GitHub** in Settings, or `gh auth login` / `copilot` — needs an active Copilot subscription | No API key to manage; reaches Claude, GPT, Gemini and Grok models. The model list is discovered from your account |
| Gemini | API key in **Settings** | Also powers video input and asset extraction |
| Anthropic | API key in **Settings** | |
| OpenAI | API key in **Settings** | |
| **Copilot SDK BYOK** | Your own endpoint and credential in **Settings** | Optional and additive. OpenAI-compatible (any `https://` endpoint, or `http://` on `localhost`), Azure OpenAI or Anthropic. **No Copilot subscription required.** No Gemini equivalent |
| Replicate | `REPLICATE_API_KEY` in `backend/.env` | Image generation, editing and background removal; source runs only |

All of these support **model selection**: tick as many models as you like in
**Settings → Models** or in the picker beside the composer, and each run
produces one option per selected model, up to the per-run limit. Tick nothing to
leave it automatic. See
[USER-GUIDE.md](USER-GUIDE.md#choosing-which-models-run).

**BYOK is a separate connection, not a replacement.** It carries its own API key
or bearer token — the direct OpenAI and Anthropic keys are never borrowed for
it — and only an OpenAI-compatible endpoint on `localhost` may run without a
credential. Its models appear under **Copilot SDK (BYOK)** with the run identity
`sdk-byok/<provider>/<base model>`, so a model and its BYOK twin can run in the
same generation and be compared. Configuring it changes nothing about how the
native providers behave. See
[USER-GUIDE.md](USER-GUIDE.md#using-your-own-endpoint-copilot-sdk-byok).

**It also reaches models the catalogue does not know.** Name the id your
endpoint serves — discovered from its `/models` route where one exists, typed by
hand otherwise — and it appears as a single honest option,
`<model> via <provider>`, with the identity
`sdk-byok/<provider>/custom/<model>` carried through History and retries. The
wire API is chosen automatically: Chat Completions for an endpoint with its own
base URL, Responses for a provider's own. Any such model must support **image
input and tool calling**, which only the endpoint's documentation can confirm.

**Test before you generate.** **Connection checks** under the API keys test
OpenAI, Anthropic, Gemini and Replicate individually with one minimal request,
so an unpaid account or a revoked key is reported — with the action that fixes
it — before a generation is half-finished.

## MCP servers

Up to eight Model Context Protocol servers can be configured in **Settings** over
**stdio**, **HTTP** or **SSE**. A server must be **enabled** *and* explicitly
**trusted** before shot2code will start it, it is **read-only** until you also
allow write tools, a local server is spawned as an argument vector rather than
through a shell, and a remote one must use `https://` unless it is on
`localhost`. Their tools are offered to **GitHub Copilot** and **Copilot SDK
BYOK** options only — an option running on your own OpenAI, Anthropic or Gemini
key never sees them. See [USER-GUIDE.md](USER-GUIDE.md#mcp-servers).

## Reviewing what was generated

**Review** renders the generated page at two to four real widths at once — 1440,
768 and 390 by default, any whole width from 320 to 1920 if you add your own —
measures horizontal overflow in the running frame, and runs a local,
deterministic audit of the generated source for semantic and accessibility
problems. Selected findings can be written into the Chat composer for you to
read and send, and the whole result exports as JSON. It is an automated source
check, **not a WCAG conformance assessment**. See
[USER-GUIDE.md](USER-GUIDE.md#the-review-workspace).

Keys entered in Settings are stored on your device and sent only to the provider
they belong to. See [DATA-HANDLING.md](DATA-HANDLING.md).

## What it does not do

- It is **not** a hosted service and has no account, sync or cloud storage.
- It does **not** include a model or any free inference. You bring the provider.
- It does **not** guarantee that generated code is correct, accessible or secure.
  It is model output: review it before running it outside the sandboxed preview.
- The published Windows binaries are **not code-signed**, so SmartScreen will warn
  on first run. Verify the SHA-256 checksum instead — see [SECURITY.md](SECURITY.md).

## Documentation

| Guide | What it covers |
| --- | --- |
| [INSTALL.md](INSTALL.md) | Downloads, checksum verification, SmartScreen, updates, uninstall |
| [USER-GUIDE.md](USER-GUIDE.md) | First run, providers, BYOK, MCP, model selection, generating, editing, Review, resizing, History, import, export, the menu bar, shortcuts, Help |
| [FAQ.md](FAQ.md) | Common questions, in the order people ask them |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Symptom-first runbook: startup, providers, Chromium, import, export, updates, where the logs live |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the app, backend, agent loop and packaging fit together |
| [DATA-HANDLING.md](DATA-HANDLING.md) | Every network destination and on-disk path |
| [SECURITY.md](SECURITY.md) | Reporting a vulnerability, unsigned builds, update integrity |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Where issues, documentation fixes and code changes each go |
| [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) | Bundled runtimes and principal dependencies, with links to the source manifests |
| [RELEASING.md](RELEASING.md) | How a build becomes a release in this hub |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each published version |

Bugs and ideas belong in this hub —
[open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)
and pick **shot2code**. Vulnerabilities are [reported privately](SECURITY.md).
The hub's [support policy](../../SUPPORT.md) covers triage for every product
published here.

## License

The application is MIT-licensed in its
[source repository](https://github.com/ArasaniRohithReddy/shot2code/blob/main/LICENSE).
The documentation and release assets in this hub are provided under the
[MIT License](../../LICENSE). Components that ship inside the app — Electron and
Chromium, the frozen Python runtime, the headless browser — are listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
