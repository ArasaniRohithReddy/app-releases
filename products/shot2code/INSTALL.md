# Installing shot2code

shot2code is a **Windows desktop application**. Every download is attached to its
release on the
**[releases page](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)**.
Release tags in this hub are product-prefixed: `shot2code-vX.Y.Z`.

## System requirements

- **Windows 10 or Windows 11**, 64-bit (x64).
- About **600 MB** of free disk space after unpacking. The app carries its own
  Python backend and a headless Chromium, so there is no runtime to install.
- **One model provider**: a GitHub Copilot sign-in, or a Gemini, Anthropic or
  OpenAI API key. Without one, generation fails fast — the rest of the app still
  opens.
- There are **no macOS or Linux builds**. On those platforms, run the project
  [from source](https://github.com/ArasaniRohithReddy/shot2code#running-from-source).

## Which download?

| File | Use |
| --- | --- |
| `shot2code-<version>-x64.exe` | **Recommended.** Per-user NSIS installer with shortcuts — and the only format that updates itself. |
| `shot2code-<version>-x64.msi` | Per-machine managed deployment. Self-update is disabled; upgrades are administrator-controlled. |
| `shot2code-<version>-x64.zip` | Portable. Unzip and run `shot2code.exe`. |
| `SHA256SUMS.txt` | Checksums for the files in that release. |

The `.exe.blockmap` and `latest.yml` files produced by the build are inputs for
the auto-updater, not downloads for people. They are attached to the release, and
appear in its complete file listing, but the download cards never offer them.

Every published build is mirrored on that releases page. Not every one of them
shipped all four files — published checksums arrived with 0.3.1, and some earlier
builds had no MSI — so the page lists exactly the files each release actually
carries rather than four placeholders.

## Verify before you install

The Windows builds are **not code-signed**, so there is no signature to check.
Compare the hash instead:

```powershell
Get-FileHash .\shot2code-<version>-x64.exe -Algorithm SHA256
```

Then compare the result with the matching line in `SHA256SUMS.txt` from the same
release. PowerShell prints uppercase hex; hexadecimal comparison is
case-insensitive. If a hash does not match, **stop** and
[report it privately](https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new).

## Option 1 — installer (`.exe`) — *recommended*

1. Download `shot2code-<version>-x64.exe` and verify its hash.
2. Run it. Windows SmartScreen will warn — see
   [About the SmartScreen warning](#about-the-smartscreen-warning).
3. It installs per-user (no administrator rights needed) and adds a Start-Menu
   shortcut and an entry in *Apps & features*.

This is the only build that updates itself.

## Option 2 — MSI

1. Download `shot2code-<version>-x64.msi` and verify its hash.
2. Install it. This is the **per-machine** layout, intended for managed
   deployment.
3. The app detects a Program Files install, **disables self-update**, and reports
   in Settings that upgrades are administrator-managed. Deploy the next MSI to
   upgrade.

## Option 3 — portable (`.zip`)

1. Download `shot2code-<version>-x64.zip` and verify its hash.
2. Right-click the ZIP → **Properties** → tick **Unblock** → **Apply**, then
   extract it to a folder you control.
3. Run `shot2code.exe` from the extracted folder. Keep the folder together — the
   frozen backend and the bundled Chromium live beside the executable.

Portable builds do not self-update. Replace the folder with a newer build.

## First launch

The first start takes about a minute: the bundled Python backend has to come up
before the window is usable, and the splash screen stays visible until it answers
its health check. Later launches are faster.

If the window stays blank or never appears, read the log — it records backend
startup, renderer load failures, crashes and console errors:

```
%APPDATA%\shot2code-desktop\shot2code-backend.log
```

Include the tail of that file if you open an issue.

## About the SmartScreen warning

The builds are unsigned, so Windows shows *"Windows protected your PC"* the first
time you run an installer, and downloaded files carry the mark of the web. The
warning is expected; it is **not** evidence that the download is good or bad.

After verifying the checksum, either:

- click **More info → Run anyway**, or
- right-click the file → **Properties** → tick **Unblock** → **Apply**, then run it.

## Updates

- Per-user `.exe` installs check the public GitHub Releases feed. **Settings**
  shows the running version, the update state, download progress, a **Check now**
  button, and **Restart & install** when a download is ready.
- The install runs silently and relaunches the app. Before it starts, the bundled
  backend, Copilot CLI and Chromium process tree is stopped and that shutdown is
  verified. If it cannot be confirmed, the update is **not** started and stays
  retryable rather than replacing a running app.
- **The installer repeats that check itself.** An app-side guard cannot protect a
  machine that is still on an older build, so from 0.3.2 the NSIS installer runs
  a pre-install safeguard before it uninstalls or replaces anything: it finds
  processes by executable path under the installed `resources\backend` folder,
  stops each tree, and confirms none is left. It never kills by process name, so
  an unrelated program with the same executable name is untouched. If the tree
  cannot be confirmed stopped, the install is aborted — with a message you can
  act on, or a distinct exit code for a silent install — and it writes
  diagnostics to `%TEMP%\shot2code-installer-preinstall.log`.
- MSI installs are administrator-managed and do not self-update.
- Portable builds do not update; download a new ZIP.

## Uninstalling

- **Installer / MSI:** *Settings → Apps → Installed apps → shot2code → Uninstall*.
- **Portable:** delete the extracted folder.

Uninstalling does not delete your projects. They live in a local database:

```
%LOCALAPPDATA%\shot2code\history.sqlite3
```

Delete that folder as well if you want the project history gone. Individual
projects can be removed from **Recent projects** inside the app — deleting a
project removes it and its versions from the device.

## Where things are stored

| Path | Contents |
| --- | --- |
| `%LOCALAPPDATA%\shot2code\` | `history.sqlite3` — projects, versions, prompts |
| `%APPDATA%\shot2code-desktop\` | Desktop shell state and `shot2code-backend.log` |
| `%TEMP%\shot2code-installer-preinstall.log` | What the installer's pre-install safeguard found and stopped |
| The app's own local storage | Provider API keys, your model selection and UI preferences entered in Settings |

See [DATA-HANDLING.md](DATA-HANDLING.md) for the full list, including every
network destination.
