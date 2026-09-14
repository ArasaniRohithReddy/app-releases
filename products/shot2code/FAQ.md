# shot2code FAQ &amp; troubleshooting

Common questions, in the order people ask them. If something is failing rather
than merely unclear, [TROUBLESHOOTING.md](TROUBLESHOOTING.md) is the symptom-first
runbook — startup, providers, Chromium, import, export, updates, and where the
logs live.

## General

**Is it free?**
The app is free and MIT-licensed. The model provider is not: you need either an
active GitHub Copilot subscription or your own API key, and you pay that provider
directly.

**Does my code or my screenshots leave the machine?**
Only in the generation request sent to the provider you configured, and only when
you ask for something. Projects and their history are stored locally. CodePen
sharing is the one deliberate export, and it always asks first. Full detail:
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

**First launch is slow.**
A cold start boots the bundled Python backend and probes Chromium and Copilot. The
splash screen stays up until the backend answers. Later launches are faster
because the Copilot check is cached.

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
