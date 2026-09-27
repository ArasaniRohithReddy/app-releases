# shot2code FAQ &amp; troubleshooting

Common questions, in the order people ask them. If something is failing rather
than merely unclear, [TROUBLESHOOTING.md](TROUBLESHOOTING.md) is the symptom-first
runbook — startup, providers, Chromium, import, export, updates, and where the
logs live.

## General

**Is it free?**
The app is free and MIT-licensed. The model provider is not: you need either an
active GitHub Copilot subscription, your own API key, or your own endpoint
reached through a Copilot SDK BYOK connection — and you pay that provider
directly.

**Does my code or my screenshots leave the machine?**
Only in the generation request sent to the provider you configured — including
your own endpoint, if you configured a BYOK connection — and only when you ask
for something. Projects and their history are stored locally. The Review audit
runs locally. A few actions deliberately reach out and say so first: a Figma
REST import contacts `api.figma.com`, the bundled Stitch SDK contacts Stitch,
an MCP server you enabled and trusted receives the tool calls a model makes,
Copilot web search sends your search queries when you switch it on, and an AI
review is a normal request to your provider. CodePen sharing is the one
deliberate export of your code, and it always asks first. Full detail:
[DATA-HANDLING.md](DATA-HANDLING.md).

**Is there a macOS or Linux build?**
No. Those platforms are supported only by
[running from source](https://github.com/ArasaniRohithReddy/shot2code#running-from-source).

**Is there telemetry?**
No. There is no analytics SDK in the app. The remaining background call is the
update check on per-user installs.

**Why is the download so large?**
Each build carries a frozen Python backend and a headless Chromium so that
nothing has to be installed separately. It unpacks to roughly 600 MB.

## Installing

**Windows says "Windows protected your PC".**
Expected — the builds are unsigned. Verify the SHA-256 hash against
`SHA256SUMS.txt` from the same release, then **More info → Run anyway**, or
right-click the file → **Properties** → **Unblock** → **Apply**. See
[INSTALL.md](INSTALL.md#about-the-smartscreen-warning).

**The installer seems to do nothing.**
It unpacks about 600 MB, so it can sit for a minute before showing progress.

**The MSI says updates are managed by an administrator.**
That is intentional. MSI is the per-machine deployment format and does not use the
self-updater. Use the `.exe` installer if you want per-user automatic updates.

**Which download should I pick?**
`.exe` for a normal single-user install, `.msi` for managed deployment, `.zip` if
you want nothing written outside a folder you control.

## Starting the app

**How long should startup take?**
From 0.3.3, a few seconds — roughly 5–11 seconds to a usable window on a warm
machine. The splash screen waits for the bundled backend's health check, and the
shell gives up after 90 seconds rather than hanging. A fresh portable copy, or the
first launch after an update, is slower (around 40 seconds) because Windows has
to scan a newly written tree.

Earlier builds imported the generation, evaluation and project tooling before
health could answer and launched Chromium synchronously, which on slow machines
pushed readiness past five minutes. Those now load on first use and in the
background, so an optional capability can no longer hold up the app.

**Can I make the chat panel wider?**
Yes, on windows at least 1280px wide. Drag the divider between the chat panel and
the preview, or the one between the file tree and the editor, or focus it and use
the arrow keys (`Shift` for bigger steps, `Home`/`End` for the limits, `Enter` to
reset). The widths are remembered, are clamped so neither side becomes unusable,
and are a view preference only — resizing never creates or changes a version. On
narrower windows Preview, Chat and History stay separate destinations and no
divider appears.

**Where is the in-app help?**
**Ctrl+/**, or **Help** in the rail. It has Get started, Guides, Support and
Keyboard shortcuts, and every link opens the published copy on this hub. In the
desktop app, Support also has **Open diagnostic logs**, which opens the folder
holding the backend log — the file to attach to a bug report.

**The app is too small or too large to read.**
In the desktop app use `Ctrl+=` / `Ctrl++` to zoom in, `Ctrl+-` to zoom out and
`Ctrl+0` to reset; the numpad add and subtract keys work too. Zoom moves in
10-point steps between 50% and 300%.

**The window is blank, or never appears.**
Read the log and include its tail in an issue:

```
%APPDATA%\shot2code-desktop\shot2code-backend.log
```

It records backend startup, renderer load failures, crashes and console errors.

## Generating

**"No API key found and no GitHub Copilot credentials detected".**
You need one of:

- a GitHub Copilot subscription — use **Settings → Sign in with GitHub**, which
  needs no command-line tool, or run `gh auth login` (or `copilot`) once and
  restart shot2code; Settings shows which account it picked up, or
- an API key for OpenAI, Anthropic or Gemini, entered in **Settings**.

**Copilot shows "Not signed in" even though the CLI works.**
The app looks for a token in Settings, then `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` /
`GITHUB_TOKEN`, then a stored `copilot` login, then `gh auth login`. If none are
found, sign in again and restart the app so the check re-runs. A fine-grained
token with the **Copilot Requests** permission also works.

**No models are listed for a provider.**
A provider only appears once shot2code can see a credential for it, so check the
key in **Settings** (or the Copilot sign-in) first. For GitHub Copilot, only
models that accept images are offered, because turning a screenshot into code
requires image input — an empty Copilot list usually means your plan currently
has no vision-capable model. In video mode, every provider's list is filtered to
models that can read video.

**Can I run more than one model on the same screenshot?**
Yes. Tick several models in **Settings → Models**, or in the picker beside the
composer — they can come from different providers. You get one option per
selected model, capped at 4 for a first generation and 2 for an update or a
video. Tick nothing to leave the choice automatic. The picker states the outcome
in words, including when you have selected more models than the run can use.

**Settings says some of my saved models "can no longer run".**
The key for them was removed, or the provider retired them. They are ignored
rather than silently deleted; use **Remove** to clear them. If the catalogue
cannot be loaded at all, your selection is left untouched instead of being reset.

**A model I used before has disappeared from the list.**
Deprecated models are hidden unless you tick **Show deprecated models** — or
unless one is already selected, in which case it stays visible where you chose
it.

**Only one of my screenshots appears in the result.**
Upload them together and choose **Separate pages**. That mode requires one
navigable view per screenshot. Use **Responsive views** only when the images are
the same page at different widths, and **UI states** for before/after states such
as an open modal.

**The generated code is wrong, inaccessible or insecure.**
It is model output. Refine it in chat, retry the version, or edit the files
directly — and review anything before running it outside the sandboxed preview.

**Why does Chat only show part of the conversation?**
It should not. The panel reconstructs the whole branch in order — your prompts,
the images or recording you attached, any selected-element context, the model
identity, the generation state and the assistant's own responses. Answers from
earlier versions sit in expandable blocks rather than collapsing to *"Option
ready."*

**Can I say what I want before the first generation?**
Yes. Both **Upload** and **Import** take an optional first instruction (and a
model choice) before anything is generated.

**Can I see what the download will contain before I download it?**
Yes. The Code tab has a read-only **Export project** view beside **Current
code** listing the exact text files and assets the ZIP will hold for your stack.

**Is Stack preview running a build?**
No. Preview still defaults to the composed HTML document. **Stack preview**
renders the controlled Vite HTML, React and Preact files in the same browser
sandbox — **no package script and no project configuration is executed**.

**"Could not start screen recording".**
Screen capture needs the app to grant itself permission to the display. Check the
log for a `screen capture` line; it records which source was chosen or why the
request failed.

**Screenshot by URL failed and I do not know why.**
It now says which: a rejected key, a billing or credit problem, a rate limit, a
timeout, an invalid URL, or the provider being unavailable. You can test the
ScreenshotOne key from the URL tab with one minimal request before relying on it.

## Features that need extra setup

| Feature | Requirement |
| --- | --- |
| Video / screen-recording input | A Gemini key |
| Asset extraction (reusing real logos from a screenshot) | A Gemini key |
| Image generation, editing, background removal | `REPLICATE_API_KEY` in `backend/.env` — no Settings field, so source runs only. The tools are not offered at all without an effective key |
| Screenshot preview (the agent checking its own output) | Chromium, which ships with the desktop app; Settings reports if it is unavailable |
| Screenshot by URL | A ScreenshotOne key, testable from the URL tab |
| Your own model endpoint | A Copilot SDK BYOK connection with its own credential — see below |
| Tools from an MCP server | A server that is both enabled and trusted, and an option running on Copilot or BYOK |
| An Agent Skill, or Copilot web search | An enabled skill (or the web-search switch) and an option running on Copilot or BYOK |
| Figma REST import | A Figma personal access token with `file_content:read` |
| Google Stitch generation or import | A Stitch API key, used by the bundled experimental SDK in the desktop app |

## Copilot SDK BYOK

**Do I need a Copilot subscription to use BYOK?**
No. It is the Copilot *SDK* — the runtime that talks to your endpoint — not your
Copilot entitlement. A subscription is only needed for the **GitHub Copilot**
provider, which reaches models through your plan.

**Which endpoints can it reach?**
**OpenAI-compatible**, **Azure OpenAI** and **Anthropic**. The
OpenAI-compatible mode is deliberately broad: any endpoint that speaks the
OpenAI wire format — a vendor API, a gateway, a self-hosted server or one your
organisation runs — over any `https://` URL, or `http://` when the host is
`localhost`.

**My endpoint serves its own model, not a catalogue one. Does that work?**
Yes. Put its id in **Endpoint model**. If the endpoint lists models at
`/models`, **Test model access** fills a picker with the ids it reported;
otherwise type it. Ids may be up to **128** characters and may contain
`. _ : / @ + -`. It then appears in **Settings → Models** as exactly one option,
`<model> via <provider>`, rather than a list of catalogue names that would all
reach the same model.

**Does the model need anything in particular?**
Yes: it must accept the wire API in use and support **image input and tool
calling**. Screenshots are sent as images and the agent works by calling tools,
so a text-only model will fail even if the connection check passes. Neither the
check nor the endpoint's model list tells you which models qualify — only the
endpoint's documentation can.

**Which wire API should I choose?**
**Automatic**, unless you know otherwise. It picks Chat Completions for an
endpoint with its own base URL — the interface almost every OpenAI-compatible
server implements — and Responses for a provider's own endpoint. Pin one if your
endpoint needs it; a pinned choice always wins.

**Can I point it at Gemini?**
No. The Copilot SDK has no Gemini provider, so Gemini models always use the
Gemini API key directly. The app states this as a notice rather than failing
later.

**Will it use my existing OpenAI or Anthropic key?**
No, and that is deliberate. The connection carries its own API key or bearer
token. Your direct keys belong to the native providers and keep working there
untouched.

**Can I run it without a key at all?**
Only for an **OpenAI-compatible endpoint on `localhost`** — a local Ollama, LM
Studio or vLLM server. Everything else, including Azure and Anthropic, must have
its own credential.

**Does switching BYOK on change how my existing models run?**
No. A native selection always runs on its native provider. Nothing is re-routed,
which is why there is no warning about it.

**Can I compare a model against the same model on my endpoint?**
Yes — that is the point of the separate identity. Tick both
`gpt-5.6-sol (high thinking)` and `sdk-byok/azure/gpt-5.6-sol (high thinking)`
and one generation produces both options side by side. The reasoning effort is
part of the base model name, so both run at the effort you picked.

**Does the identity survive History and a retry?**
Yes. Each option records the identity it ran as, so retrying a BYOK option
re-runs it on your endpoint.

**What does Validate connection actually do?**
It checks the settings. No request is made to your endpoint, and the response
contains presence flags and the host name only — never your credential.

**And Test model access?**
The opposite, and the card says so: it contacts the endpoint with one tiny
request and may use a small amount of quota. It also lists the models the
endpoint reports, when it exposes them.

**My connection is half-finished. Will generation fail?**
No. An incomplete or switched-off connection is reported as a notice and
skipped; your direct generations are unaffected.

## Checking a provider works

**What does a connection check actually send?**
One deliberately tiny request — a single-word prompt capped at 16 tokens — to
the provider you asked about, using **only** that provider's credential. Testing
Gemini never puts your OpenAI key on the wire.

**Does it cost anything?**
On a metered account it may use **a small amount of quota**. It is as small as a
request can be, but it is not free. Replicate is the exception: it is checked
against its account endpoint, so no prediction is started.

**I have a valid key but everything fails. Why?**
Check it. **Out of credit** is the usual answer: the key is fine and the account
has nothing left to spend. Providers report that in a way that reads like a rate
limit, so the result links straight to the billing page instead of telling you
to wait.

**Can I test the key in `backend/.env` rather than one in Settings?**
Yes. Leave the Settings field empty and the check uses the key the backend
holds in its own configuration.

**Why was my check refused when I gave a custom OpenAI base URL?**
A request naming its own base URL must carry its own API key. The key configured
on the server is only ever used with the server's own endpoint, so nobody can
point the app at a host they control and have your server's key sent there.

## Signing in to GitHub Copilot

**Do I need the GitHub CLI or the Copilot CLI installed?**
No. The desktop app runs **its own GitHub OAuth device flow**: it shows a
one-time code, opens your browser, and finishes with nothing installed. The
terminal routes and a pasted token still work if you prefer them.

**Does shot2code ship a client secret?**
No. It uses a **public client id only**. A desktop application cannot keep a
secret, so it does not pretend to, and it does not borrow another product's
client id.

**Where does the token end up?**
Encrypted, in the app's own user-data folder, using Electron `safeStorage` —
the operating system's key store. It is refreshed automatically when it expires
and is handed to the backend in its process environment on restart.

**Does shot2code see my GitHub token?**
In the desktop device flow it holds one, encrypted as above, because that is
what makes a CLI unnecessary. In the fallback used where that flow is not
available, the **official** GitHub Copilot CLI web flow (or the GitHub CLI) does
the login, stores the credential itself, and shot2code only learns whether a
session exists.

**Does disconnecting log me out of `gh` or the Copilot CLI?**
No. **Disconnect GitHub from shot2code** clears only what this app holds. A CLI
session on the same machine stays signed in — shot2code did not create it.

**What if no sign-in route is available?**
The button says so and links the official install instructions. You can still
run `gh auth login` or `copilot` in a terminal, or paste a token into Settings.

**Can I stop a sign-in half way?**
Yes. **Cancel** stops the flow. A sign-in is also bounded by a timeout and is
killed if the backend stops.

## MCP servers, skills and web search

**Which options can use MCP tools, skills or web search?**
GitHub Copilot subscription options and Copilot SDK BYOK options. An option
running on your own OpenAI, Anthropic or Gemini key uses that provider's own
client and never sees any of them.

**How many servers can I add?**
Up to eight, over stdio, HTTP or SSE.

**Can I browse servers instead of typing a URL?**
Yes — the **MCP Registry** browser in Settings searches the official registry.
Only remote `https://` entries are listed, and duplicates collapse to the latest
active version.

**What happens when I install one from the registry?**
It is added as a **disabled, untrusted draft** with its URL and headers laid out
for review. A registry listing is not an endorsement, and nothing starts until
you turn on the same two switches as for any other server.

**Are Figma and Stitch pre-configured?**
They are offered as featured drafts — **Figma Desktop MCP**, **Figma Remote
MCP** and **Google Stitch MCP** — with the right transport and endpoint filled
in. They arrive disabled and untrusted like everything else.

**I added a server and nothing happened.**
A server needs **both** switches: **Enabled** and **Trusted**. Until it is
trusted, shot2code will not start it or approve its tools, and says so as a
notice beside the model picker.

**Why is my server read-only?**
Because that is the default. Tools that can change files, data or remote state
need **Allow write tools** turned on for that server as well.

**Is my command run through a shell?**
No. A local server is spawned as an argument vector, so nothing in the command
or its arguments is re-interpreted by `cmd` or PowerShell. That is why arguments
are entered one per line.

**Can I use an `http://` URL?**
Only for `localhost`. Any other host must use `https://`.

**Where do my tokens end up?**
In Settings on this device. Values that look like credentials are masked in the
list and stay masked and read-only in the editor until you reveal them. Only
key and header *names* ever appear in a diagnostic or validation response, and
no value is written into project history or an exported review report.

**Does Validate servers start anything?**
No. It checks the configuration only.

**What is an Agent Skill?**
A reusable instruction folder — a house style, a component convention, a
checklist — imported from a local folder or a public GitHub folder URL. Front
matter, paths and sizes are validated and the origin is recorded.

**Are skills active as soon as I import one?**
No. **Every skill is disabled by default.** Enable, disable or remove it when
you want to.

**A skill contains scripts. Will shot2code run them?**
No, and it cannot. The files are stored as resources, but shot2code exposes no
shell tool and no unrestricted host-filesystem tool to any model, so there is
nothing that could execute them.

**What does Allow web search actually do?**
It lets Copilot and BYOK options search the public web when a prompt needs
current documentation. It is off by default, **your search queries leave the
device**, and it adds search and nothing else — shell access and unrestricted
computer files stay disabled.

## Figma and Google Stitch

**How do I start from a Figma design?**
Four ways: exported screenshots, an exported **SVG** (rasterised locally before
it is sent), the **Figma Desktop MCP** server on `http://127.0.0.1:3845/mcp`, or
a **REST import** using a Figma URL and your own personal access token with
`file_content:read`.

**Why does the Figma remote MCP server not connect?**
Figma currently admits only clients listed in its own MCP catalogue. shot2code
does not impersonate another editor or reuse its sign-in to get around that, so
the REST import is the route that works today for most accounts.

**Where does my Figma token go?**
To `api.figma.com` and nowhere else. It is never part of a generation request,
project history or an export.

**What can the Stitch integration do?**
Either reach the official **Stitch MCP** endpoint like any other server, or use
the bundled SDK in the desktop app with a Stitch API key to validate the key,
generate a screen from a prompt, or import an existing project or screen.

**Is the Stitch SDK official?**
It is published by Google Labs, which states it is **not an officially supported
Google product**. shot2code bundles version 0.3.5 (Apache-2.0) and treats it as
experimental. HTML and images it downloads must be `https://` and are
size-bounded.

**Does my Stitch key reach the model?**
No. Like the Figma token it is capture-only: stored on this device, passed to the
bundled SDK, and excluded from generation requests, history and exports.

## Reviewing the result

**What does Review actually render?**
The generated page at two to four real widths at once — 1440, 768 and 390 by
default. Each frame is that actual width, not a scaled screenshot, so a layout
that breaks at 390px breaks visibly.

**Can I use my own widths?**
Yes: any whole number from 320 to 1920, keeping between two and four frames.
Your set is remembered on this device.

**Is the audit a WCAG check?**
**No.** It is a deterministic, local pass over the generated source that reports
semantic and accessibility problems with evidence and guidance. It is **not a
WCAG conformance assessment** and does not replace testing with real assistive
technology. A framework project's runtime DOM can also differ from the source
that was audited.

**Does it send my code anywhere?**
No. The audit runs locally on the generated source.

**Why is my result marked stale?**
Because something it was bound to changed — the version, the option, the source,
or the widths. Re-run it to get an answer about what is on screen now.

**Do the findings get sent to the model automatically?**
No. Selected findings are written into the composer as a grouped instruction.
Read it, edit it, then send it yourself.

**Then what does "Fix selected findings" do?**
That one does send — deliberately, and immediately — as a targeted update
against the **exact version and option that was reviewed**, not whatever is on
screen. The result is a new version, so nothing is overwritten.

**How do I narrow a long list of findings?**
Filter by severity, search the text, then use **Select visible** or **Select
errors + warnings** to tick them in bulk.

**What is the AI review?**
An optional second opinion from **the model that option actually ran on**. It
runs with **no tools, no MCP servers, no skills, no web search, no shell and no
file writes**, and its findings are kept separate from the local ones, which
remain authoritative.

**Does the AI review cost anything?**
Yes — it is a real request to your provider and may use quota. The local audit
is free, deterministic and offline. An option with no recorded model identity
cannot be AI-reviewed; retry it first.

**What is the Design Inspector for?**
It extracts the design decisions in the generated source — repeated colours, CSS
variables, typography, spacing, radii, shadows, motion and semantic component
counts — and exports `DESIGN.md`, `SKILL.md` and a palette PNG. It reads the
composed source, so it describes what the code declares rather than what a
browser finally computes.

**Is the JSON report safe to attach to an issue?**
It is built to be: file paths are reduced to a leaf name and no credential of
any kind is included. Read it before you post it, as you would any export.

## Importing

**An imported project has no components or tokens.**
The scanner reads HTML, CSS, JavaScript, TypeScript, Vue, JSON, Markdown and YAML.
It deliberately skips `node_modules`, build output, binaries and large files, and
it never executes `tailwind.config.js` or any other project code. Component
discovery recognises exported React/TypeScript components and `.vue` files; CSS
variables and reusable CSS classes become design tokens.

**Can it import my whole repository?**
There are limits on archive size, entry count, file count, per-file size and total
decoded text. Point it at the part of the project you actually want as context.

## Updating

**An update downloaded — how do I install it?**
Settings shows **Restart & install** when a download is ready. The install runs
silently and relaunches.

**Will an update delete my projects?**
No. History lives in `%LOCALAPPDATA%\shot2code\history.sqlite3`, outside the
installation directory, and the installer is configured not to remove
application data — so replacing the installed program leaves every project,
version and prompt in place.

**Settings says the update was not started because shot2code could not shut down
safely.**
That is the safe outcome, not a failure to worry about: the updater refuses to
replace files while the bundled backend tree may still be running. Quit the app
completely and try again.

**The installer stopped and said it could not stop the installed shot2code
backend.**
From 0.3.2 the safeguard is in the installer as well as the app, so an update
that starts from an older client is protected too. It identifies processes by
their executable path under the installed `resources\backend` folder, stops each
tree, and refuses to replace anything it cannot confirm is stopped. Close
shot2code (and any leftover backend process) and run the installer again. A
silent install returns a distinct exit code instead of a dialog, and both write
diagnostics to:

```
%TEMP%\shot2code-installer-preinstall.log
```

**Can I go back to an older version?**
Download the older release from the
[releases page](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)
and install it. The updater itself never downgrades. Not every older build was
published with all four files — checksums arrived with 0.3.1, and some earlier
builds had no MSI — so the page shows exactly what each release actually carries.

**Why does the releases page list versions the changelog does not?**
The complete history is kept in both repositories: this hub mirrors each build as
a `shot2code-vX.Y.Z` release with every file it was published with, and the
[source repository](https://github.com/ArasaniRohithReddy/shot2code/releases) is
the canonical `vX.Y.Z` history and the feed the updater reads. Only releases from
0.3.0 onwards have changelog entries, because nothing earlier was tracked in a
changelog.

## Data and privacy

**Where are my projects stored?**
`%LOCALAPPDATA%\shot2code\history.sqlite3`. It is not encrypted — treat it like
any other local project folder.

**How do I delete everything?**
Delete projects from **Recent projects** (this removes them and their versions
from the device), then uninstall and delete `%LOCALAPPDATA%\shot2code\`.

**Where are my API keys?**
Stored locally by the app for the device you entered them on, and sent only to the
provider they belong to. A GitHub token obtained through the in-app sign-in is
encrypted with Electron `safeStorage`. The Figma token and the Stitch API key are
capture-only — used by the code that calls those services and excluded from
generation requests, history and exports. Your model selection is stored the same
way — a preference on this device, not an account setting. `REPLICATE_API_KEY`
lives in `backend/.env` instead.

## Getting help

- Something is broken: work through
  [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — it covers startup, providers,
  Chromium, import, export and updates, and names the logs to read.
- Bugs and ideas: [open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)
  in this hub and pick **shot2code**. Include the details listed under
  [Reporting a problem](TROUBLESHOOTING.md#reporting-a-problem).
- Security problems: report them privately — see [SECURITY.md](SECURITY.md).
- Where a fix belongs — this hub or the source repository — is explained in
  [CONTRIBUTING.md](CONTRIBUTING.md).
- Never paste API keys, tokens or unredacted log lines into a public issue.
