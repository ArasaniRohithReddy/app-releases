# shot2code FAQ &amp; troubleshooting

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

**No Copilot models are listed.**
Only models that accept images are shown, because turning a screenshot into code
requires image input. An empty list usually means your plan currently has no
vision-capable model.

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

**Can I go back to an older version?**
Download the older release from the
[releases page](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)
and install it. The updater itself never downgrades.

## Data and privacy

**Where are my projects stored?**
`%LOCALAPPDATA%\shot2code\history.sqlite3`. It is not encrypted — treat it like
any other local project folder.

**How do I delete everything?**
Delete projects from **Recent projects** (this removes them and their versions
from the device), then uninstall and delete `%LOCALAPPDATA%\shot2code\`.

**Where are my API keys?**
Stored locally by the app for the device you entered them on, and sent only to the
provider they belong to. `REPLICATE_API_KEY` lives in `backend/.env` instead.

## Getting help

- Bugs and ideas: [open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)
  in this hub and pick **shot2code**.
- Security problems: report them privately — see [SECURITY.md](SECURITY.md).
- Never paste API keys, tokens or unredacted log lines into a public issue.
