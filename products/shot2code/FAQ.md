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
runs locally. CodePen sharing is the one deliberate export, and it always asks
first. Full detail: [DATA-HANDLING.md](DATA-HANDLING.md).

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

- a GitHub Copilot subscription — run `gh auth login` (or `copilot`) once, then
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

**"Could not start screen recording".**
Screen capture needs the app to grant itself permission to the display. Check the
log for a `screen capture` line; it records which source was chosen or why the
request failed.

## Features that need extra setup

| Feature | Requirement |
| --- | --- |
| Video / screen-recording input | A Gemini key |
| Asset extraction (reusing real logos from a screenshot) | A Gemini key |
| Image generation, editing, background removal | `REPLICATE_API_KEY` in `backend/.env` — no Settings field, so source runs only |
| Screenshot preview (the agent checking its own output) | Chromium, which ships with the desktop app; Settings reports if it is unavailable |
| Your own model endpoint | A Copilot SDK BYOK connection with its own credential — see below |
| Tools from an MCP server | A server that is both enabled and trusted, and an option running on Copilot or BYOK |

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

**Does shot2code see my GitHub token?**
No. **Sign in with GitHub** runs the **official** GitHub Copilot CLI web flow
(falling back to the GitHub CLI). That tool opens your browser and stores the
credential itself. shot2code only learns afterwards whether a session exists.

**What if neither CLI is installed?**
The button says so and links the official install instructions. You can still
run `gh auth login` or `copilot` in a terminal, or paste a token into Settings —
both routes are unchanged.

**Can I stop a sign-in half way?**
Yes. **Cancel** stops the flow and ends the CLI process. A sign-in is also
bounded by a timeout and is killed if the backend stops.

## MCP servers

**Which options can use MCP tools?**
GitHub Copilot subscription options and Copilot SDK BYOK options. An option
running on your own OpenAI, Anthropic or Gemini key uses that provider's own
client and never sees an MCP tool.

**How many servers can I add?**
Up to eight, over stdio, HTTP or SSE.

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
provider they belong to. Your model selection is stored the same way — a
preference on this device, not an account setting. `REPLICATE_API_KEY` lives in
`backend/.env` instead.

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
