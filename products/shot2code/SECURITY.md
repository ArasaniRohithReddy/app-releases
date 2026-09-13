# shot2code security

shot2code runs on your own machine. Screenshots, generated code, project history
and API keys stay local; the only outbound traffic is to the model provider you
configure, plus the update check and anything you explicitly share. The full
inventory is in [DATA-HANDLING.md](DATA-HANDLING.md).

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

Note that 0.3.0 in particular should not be kept: its silent updater could start a
second installer, which the corrective 0.3.1 release fixed. See the
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
- which model provider was configured;
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
- `REPLICATE_API_KEY` has no Settings field; it must be set in `backend/.env` and
  only applies when running from source.
- GitHub Copilot credentials are resolved at request time and are not persisted or
  logged by the app; the model cache is keyed by a SHA-256 fingerprint of the
  credential.
- Project history is a plain SQLite database at
  `%LOCALAPPDATA%\shot2code\history.sqlite3`. It is **not encrypted** — treat it
  like any other local project folder and delete projects you no longer want on
  disk.
- Never commit a key, a token, or a copy of `history.sqlite3`, and redact keys from
  logs and screenshots before attaching them to an issue.
- There is no analytics or telemetry SDK in the app.

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
- Raw imported source is not written into persisted project context.
- **Previews are sandboxed:** rendered from `srcDoc` in an iframe without
  `allow-same-origin` (an opaque origin that cannot read app state, cookies or
  storage), under a restrictive Content-Security-Policy, a `no-referrer` policy,
  and a permissions list denying camera, microphone, geolocation and display
  capture.
- Select-and-edit accepts a message only when the channel and a random per-preview
  nonce match, with size-capped payloads.
- Generated code is still model output. **Review it before running it outside the
  preview**, especially anything touching the network, the filesystem or
  credentials.
- Sharing to CodePen sends code off your device to a third party. It is never
  automatic and always asks first.

## Out of scope

- Missing Authenticode signatures and SmartScreen warnings on the published
  binaries — known and documented above.
- Vulnerabilities in third-party model providers, CodePen, or CDN-hosted framework
  assets loaded by a preview.
- Findings that require an attacker who already has local access to your user
  account or can modify the installation directory.
- Insecure code produced by a model in response to a prompt. Report a *systemic*
  prompt-injection or sandbox-escape path instead.
