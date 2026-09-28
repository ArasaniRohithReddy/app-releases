# shot2code

**Turn a screenshot into working code — on your own machine.**

[![Latest release](https://img.shields.io/github/v/release/ArasaniRohithReddy/app-releases?filter=shot2code-*&label=latest&color=4F46E5)](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)

shot2code is a **Windows desktop app**. Give it a screenshot, several related
screens, a URL, a written description, a screen recording, or a Figma or Google
Stitch design, and it generates a working page you can edit, version and export.
Generation runs from your machine against the model provider you configure; your
screenshots, the generated code and your API keys are not sent anywhere except
the provider you chose and the integrations you switch on and use.

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

Signing in to GitHub Copilot needs **nothing installed**: the desktop app runs
its own GitHub OAuth device flow, shows a one-time code and opens your browser.
The `gh auth login` / `copilot` ladder and a pasted token still work.

## What you can do

| Task | Where | Result |
| --- | --- | --- |
| Generate from a reference | Upload a screenshot, paste a URL, describe a screen, or record one | A working page in the stack you chose, usually as several parallel options |
| Start from a Figma design | **Figma** — exported screenshots or SVG, or a REST import with your own access token | Frames rendered by Figma and brought in as local images; Figma MCP is not offered because Figma restricts it to catalog-listed clients |
| Start from a Google Stitch screen | **Stitch** — the official MCP server, or the bundled experimental SDK with your Stitch API key | A generated screen, or an imported Stitch project |
| Say what you want up front | The instruction box on **Upload** and **Import** | The first generation follows your instruction instead of guessing |
| Choose which models try it | **Settings → Models**, or the picker beside the composer | One option per selected model, across Copilot, OpenAI, Anthropic, Gemini and your own BYOK endpoint |
| Use your own endpoint | **Settings → GitHub Copilot SDK BYOK** | Models served by your OpenAI-compatible, Azure OpenAI or Anthropic endpoint, selectable beside the native ones — including several models only your endpoint knows |
| Sign in to Copilot in the app | **Settings → Sign in with GitHub** | A one-time code and your browser; the token is encrypted on this device, and disconnecting never signs out `gh` or the Copilot CLI |
| Check a provider before generating | **Settings → Connection checks**, or **Test model access** | One tiny request per provider, answered as Ready, Out of credit, Key rejected, Rate limited, Access denied, Model unavailable, Configuration problem or unreachable |
| Give Copilot runs extra tools | **Settings → MCP servers**, including the official **MCP Registry** | Tools from MCP servers you enable *and* trust, offered to Copilot and BYOK options |
| Add reusable instructions | **Settings → Agent Skills** — a local folder or a public GitHub folder | Skills you can enable per run; imported disabled, and their scripts can never execute |
| Research current APIs | **Settings → Web search** | Bounded Tavily/Exa search across native providers and both Copilot runtimes, with snippets labelled as untrusted |
| Create or find images | **Settings → Image generation / Free image search** | Replicate, Cloudflare or OpenAI-compatible generation, plus opt-in Openverse CC0/PDM search |
| Refine it | Chat panel, or select an element in the preview | A new version that keeps the previous one — with the whole conversation, answers included, still readable |
| Edit the source | Code tab | Multi-file tree, editor, whitespace-only **Format**, file badges — plus a read-only **Export project** view of what the ZIP will hold |
| See it as a real project | **Preview → Stack preview** | The controlled Vite HTML/React/Preact files rendered in the same sandbox, with no build scripts run |
| Check it at several widths | **Review** | Two to four real-width frames, overflow detection, a local source audit, an optional bounded AI review and a Design Inspector |
| Set how the width is shared | Drag (or keyboard-move) the chat and file-explorer dividers | A remembered view preference that never touches a project's versions |
| Step back through earlier attempts | **History** | Every version, the exact run identity behind each option, and a retry that re-rolls one |
| Reopen earlier work | **Recent projects** | Projects, versions and prompts restored from the local database — kept when the app is upgraded |
| Reuse an existing project | **Import → Folder, ZIP or source files** | Design context, or a normalized editable project |
| Drive it from the menu bar | **File · Edit · View · Window · Help** | The same commands as the keyboard, with project-only items disabled until they apply |
| Find a guide, or the log to attach | **Help** in the rail, or **Ctrl+/** | Get started, Guides, Support, shortcuts — and **Open diagnostic logs** in the desktop app |
| Send feedback | **Help → Feedback** | Direct submission through an authenticated GitHub CLI, or copy/download/browser fallbacks that attach no private app data |
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
| **GitHub Copilot** | **Sign in with GitHub** in Settings — a one-time code and your browser, with no command-line tool required. `gh auth login` / `copilot` still work — needs an active Copilot subscription | No API key to manage; reaches Claude, GPT, Gemini and Grok models. The model list is discovered from your account |
| Gemini | API key in **Settings** | Also powers video input and asset extraction |
| Anthropic | API key in **Settings** | |
| OpenAI | API key in **Settings** | |
| **Copilot SDK BYOK** | Your own endpoint and credential in **Settings** | Optional and additive. OpenAI-compatible (any `https://` endpoint, or `http://` on `localhost`), Azure OpenAI or Anthropic. **No Copilot subscription required.** No Gemini equivalent |
| Replicate | Key in **Settings** or `REPLICATE_API_KEY` | Default-compatible image generation; editing and background removal |
| Cloudflare Workers AI | Account id and token in **Settings** | Additive image generation with its own credential |
| OpenAI-compatible images | Endpoint and dedicated key in **Settings** | Additive generation and capability-checked editing |

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

**It also reaches models the catalogue does not know.** Name the ids your
endpoint serves — discovered from its `/models` route where one exists, typed by
hand otherwise — and each becomes a single honest option,
`<model> via <provider>`, with the identity
`sdk-byok/<provider>/custom/<model>` carried through History and retries. One
connection can offer several such models, and they can run side by side in the
same generation. The wire API is chosen automatically: Chat Completions for an
endpoint with its own base URL, Responses for a provider's own. Any such model
must support **image input and tool calling**, which only the endpoint's
documentation can confirm.

**Test before you generate.** **Connection checks** under the API keys test
OpenAI, Anthropic, Gemini and Replicate individually with one minimal request,
so an unpaid account or a revoked key is reported — with the action that fixes
it — before a generation is half-finished.

## MCP servers, skills and web search

Up to eight Model Context Protocol servers can be configured in **Settings** over
**stdio**, **HTTP** or **SSE**, either by hand or from the official
**MCP Registry** browser built into the app. A server must be **enabled** *and*
explicitly **trusted** before shot2code will start it, it is **read-only** until
you also allow write tools, a local server is spawned as an argument vector
rather than through a shell, and a remote one must use `https://` unless it is on
`localhost`. **A registry install is a disabled, untrusted draft** — nothing the
registry returns can start on its own. **Google Stitch MCP** is offered as a featured draft under the same rules.
Figma MCP endpoints are filtered from the registry and migrated entries are
disabled because Figma restricts both desktop and hosted MCP transports to
clients listed in its MCP Catalog.

**Agent Skills** are reusable instruction folders imported from a local folder or
a public GitHub folder URL. They are validated, recorded with their origin, and
**disabled by default**. A skill may contain scripts and those files are stored,
but **they can never execute**: shot2code exposes no shell tool and no
unrestricted host-filesystem tool.

MCP tools and skills are offered to **GitHub Copilot** and **Copilot SDK BYOK**
options only. Web research is different: the opt-in canonical `search_web` tool
uses Tavily or Exa and reaches native OpenAI, Anthropic and Gemini as well as
both Copilot runtimes. It limits queries, domains, results, snippets, calls per
turn and calls per generation, and labels every result as untrusted content.
Copilot's built-in search is offered only when canonical search is off.
Built-in `web_fetch` is blocked because the SDK cannot let shot2code inspect or
bound a whole-page result before the model receives it. See
[USER-GUIDE.md](USER-GUIDE.md#mcp-servers).

## Design sources: Figma and Google Stitch

Besides screenshots, a URL, a description or a recording, shot2code can start
from a design tool:

| Source | How |
| --- | --- |
| **Figma** | Exported screenshots; exported **SVG** (rasterised locally); or a **REST import** that takes a Figma URL and your own personal access token with `file_content:read`, and brings the rendered frames in as local images |
| **Google Stitch** | The official **Stitch MCP** endpoint, or the bundled **experimental** `@google/stitch-sdk` in the desktop app — validate a key, generate a screen from a prompt, or import an existing project or screen |

Both credentials are **capture-only**. The Figma token is sent to `api.figma.com`
and nowhere else, the Stitch key reaches only the bundled SDK, and neither is
included in a generation request, in project history or in an export. Figma's
desktop and hosted MCP servers admit only clients in Figma's own catalogue, and
shot2code does not impersonate another editor — REST/PAT is the supported
programmatic route. `@google/stitch-sdk` is published by Google Labs
and is explicitly not an officially supported Google product.

## Image generation and free images

Image generation is additive and provider-specific:

- **Replicate** is the default-compatible provider and the only one used for
  background removal. Curated models declare their own input shape; a custom
  model is accepted only after its published schema proves a string prompt and
  image output with no extra required inputs.
- **Cloudflare Workers AI** uses its own account id/token.
- **OpenAI-compatible images** use a dedicated endpoint/key and expose editing
  only when `/images/edits` actually exists.

Every prompt keeps its own success or classified failure. Partial batches report
**Generated X of N**; an all-failed batch fails instead of returning empty image
URLs. HTTP URLs, base64, data URLs and bytes all pass the same validation and
local-asset persistence boundary.

**Free image search** is a separate, opt-in Openverse tool. It does not silently
replace generation. Only CC0/Public Domain Mark records with a source and
licence URL survive local checks, and selected images are downloaded through
DNS/private-address, redirect, MIME, byte and decoded-pixel limits before being
stored locally. Openverse aggregates third-party metadata, so verify the source.

## Reviewing what was generated

**Review** renders the generated page at two to four real widths at once — 1440,
768 and 390 by default, any whole width from 320 to 1920 if you add your own —
measures horizontal overflow in the running frame, and runs a local,
deterministic audit of the generated source for semantic and accessibility
problems. Findings can be filtered, searched and selected in bulk, written into
the Chat composer for you to read and send, or applied directly with **Fix
selected findings**, which targets the exact version and option that was
reviewed. An optional **AI review** asks the model that option actually ran on
for a second opinion, with **no tools, MCP, skills, web search, shell or file
writes**; it is a real provider request and may use quota, and the local findings
remain the authoritative ones. A **Design Inspector** extracts colours,
variables, typography, spacing, radii, shadows and motion and exports
`DESIGN.md`, `SKILL.md` and a palette PNG. The whole result exports as JSON.
It is an automated source check, **not a WCAG conformance assessment**. See
[USER-GUIDE.md](USER-GUIDE.md#the-review-workspace).

Keys entered in Settings are stored on your device and sent only to the provider
they belong to. See [DATA-HANDLING.md](DATA-HANDLING.md).

## What it does not do

- It is **not** a hosted service and has no account, sync or cloud storage.
- It does **not** include a model or any free inference. You bring the provider.
- It does **not** run a shell, and it exposes no unrestricted host-filesystem
  tool. An imported skill may ship scripts; they are stored, never executed.
- It does **not** guarantee that generated code is correct, accessible or secure.
  It is model output: review it before running it outside the sandboxed preview.
- The published Windows binaries are **not code-signed**, so SmartScreen will warn
  on first run. Verify the SHA-256 checksum instead — see [SECURITY.md](SECURITY.md).

## Documentation

| Guide | What it covers |
| --- | --- |
| [INSTALL.md](INSTALL.md) | Downloads, checksum verification, SmartScreen, updates, uninstall |
| [USER-GUIDE.md](USER-GUIDE.md) | First run, providers, sign-in, BYOK, MCP and the registry, skills, Figma and Stitch, model selection, generating, editing, Review, resizing, History, import, export, the menu bar, shortcuts, Help |
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
