# Enterprise Deployment

*Applies to Threat Model Reviewer v2.1.2 and later.*

This guide covers packaged, unattended rollout of Threat Model Reviewer to managed Windows
estates — Microsoft Intune, Configuration Manager (SCCM), Group Policy, or a scripted
distribution. For a single interactive install, see [INSTALL.md](INSTALL.md).

---

## 1. Choosing a package

| Package | Scope | Admin rights | Best for |
| --- | --- | --- | --- |
| **`ThreatModelReviewer-v<version>-x64.msi`** | Per-machine **or** per-user | Per-machine requires admin | **Recommended for managed deployment** — Intune, SCCM, GPO |
| **`ThreatModelReviewer-v<version>-win-x64-portable.zip`** | Extract anywhere | None | Air-gapped hosts, jump boxes, VDI golden images, "no install" policies |
| **`ThreatModelReviewer-v<version>-setup.exe`** | Per-user | None | Self-service for users without local admin |
| **`ThreatModelReviewer-v<version>-x64.msix`** + `.cer` | Per-user (packaged) | Certificate must be trusted | Environments standardizing on MSIX *(experimental — container restrictions may limit AI features)* |

All packages are **self-contained**: no .NET runtime prerequisite. All are
**Authenticode-signed** — see [Signing and SmartScreen](#6-signing-smartscreen-and-trust).

### Package identifiers

Useful for detection rules, upgrade logic and uninstall automation:

| Item | Value |
| --- | --- |
| Product name | `Threat Model Reviewer` |
| Executable | `ThreatModelReviewer.exe` |
| MSI `UpgradeCode` | `{7E2D9A14-3C5B-4F8E-A1D6-9B0C2E4F6A38}` |
| Inno Setup `AppId` | `{8F3A2C71-6B4E-4D2A-9E1F-7C5A0B9D3E64}` |
| Publisher (current) | `ArasaniRohithReddy` (self-signed certificate) |

> The MSI `UpgradeCode` is stable across versions — use it for Intune/SCCM detection and to let
> the installer replace an earlier build in place.

## 2. Silent installation

### MSI (recommended)

```powershell
# Per-machine (all users) — requires elevation
msiexec /i "ThreatModelReviewer-v2.1.2-x64.msi" ALLUSERS=1 /qn /norestart /l*v install.log

# Per-user (no elevation)
msiexec /i "ThreatModelReviewer-v2.1.2-x64.msi" ALLUSERS="" /qn /norestart

# Upgrade in place — same command as install; the UpgradeCode handles removal of the old build

# Uninstall
msiexec /x "{7E2D9A14-3C5B-4F8E-A1D6-9B0C2E4F6A38}" /qn /norestart
```

| Switch | Purpose |
| --- | --- |
| `/qn` | Fully silent, no UI |
| `/norestart` | Never reboot (the product does not require one) |
| `/l*v <file>` | Verbose log — always capture this in a deployment pipeline |
| `ALLUSERS=1` | Per-machine install (omit or set empty for per-user) |
| `INSTALLFOLDER="<path>"` | Override the install directory |

### Setup.exe (Inno Setup)

```powershell
ThreatModelReviewer-v2.1.2-setup.exe /VERYSILENT /NORESTART /SUPPRESSMSGBOXES /LOG="install.log"
```

### Portable ZIP

```powershell
Expand-Archive .\ThreatModelReviewer-v2.1.2-win-x64-portable.zip -DestinationPath 'C:\Program Files\ThreatModelReviewer'
# Launch: C:\Program Files\ThreatModelReviewer\ThreatModelReviewer.exe
```

No registry writes, no uninstall entry — remove the folder to uninstall.

## 3. Microsoft Intune (Win32 app)

1. **Package** the MSI with the Microsoft Win32 Content Prep Tool
   (`IntuneWinAppUtil.exe -c <folder> -s <msi> -o <out>`).
2. **Install command**
   ```
   msiexec /i "ThreatModelReviewer-v2.1.2-x64.msi" ALLUSERS=1 /qn /norestart
   ```
3. **Uninstall command**
   ```
   msiexec /x "{7E2D9A14-3C5B-4F8E-A1D6-9B0C2E4F6A38}" /qn /norestart
   ```
4. **Install behaviour:** *System* (for per-machine) — or *User* if deploying per-user.
5. **Detection rule:** MSI product code, or a file rule on
   `%ProgramFiles%\Threat Model Reviewer\ThreatModelReviewer.exe` with **version ≥ 2.1.4.0**.
6. **Requirements:** Windows 10 1809+ / Windows 11, x64.
7. **Return codes:** `0` success, `3010` soft reboot (not expected), `1602` user cancelled,
   `1603` fatal error — inspect the MSI log.

## 4. Configuration Manager (SCCM) and Group Policy

**Configuration Manager** — create an *Application* with the MSI as the deployment type; the
install/uninstall commands and detection method above apply unchanged. Deploy as *Required* to a
device collection for per-machine installs.

**Group Policy Software Installation** — the MSI can be assigned per-machine via
*Computer Configuration → Software Settings → Software installation*. Place the MSI on a UNC share
readable by domain computers. (GPO software installation does not support MSI transforms for
per-user/per-machine switching at deploy time; assign per-machine and control per-user behaviour
with the configuration files in §5.)

## 5. Configuration for managed estates

The application stores per-user configuration under `%APPDATA%\ThreatModelReviewer\`. These files
are plain JSON, safe to seed, and never contain threat-model content.

### Controlling updates

The in-app update check contacts GitHub once at start-up. To disable it fleet-wide, deploy this
file to each user profile (logon script, Intune configuration script, or a default-profile seed):

**`%APPDATA%\ThreatModelReviewer\update.json`**
```json
{ "Enabled": false }
```

With updates disabled the application makes **no unsolicited outbound request at all** — version
lifecycle is then owned entirely by your deployment tooling. Users can also toggle this in the app.

### Controlling AI features

AI is **opt-in by user sign-in**; nothing is sent to any model unless a user signs in to Copilot
*and* clicks an AI action. To keep the deployment fully offline, simply do not distribute Copilot
seats — the deterministic review, reports and remediation are unaffected.

To keep inference inside your own boundary, configure the OpenAI-compatible provider against an
Azure OpenAI or self-hosted endpoint; the key is stored DPAPI-encrypted per user. See
[DATA-HANDLING.md §3.3](DATA-HANDLING.md#33-openai-compatible-provider--optional-opt-in-self-configured).

### Network allow-list

| Purpose | Destination | Required? |
| --- | --- | --- |
| Update check | `api.github.com`, `github.com` | Optional — omit if updates are disabled |
| Copilot AI features | GitHub Copilot endpoints (per your Copilot deployment) | Optional — only if AI is used |
| Everything else (review, scoring, reports, remediation) | — | **No network access required** |

## 6. Signing, SmartScreen and trust

Every artifact is Authenticode-signed. The current certificate is **self-signed**
(`CN=ArasaniRohithReddy`), which means the binaries carry a valid, tamper-evident signature, but
Microsoft Defender SmartScreen may warn on first run because the certificate is not chain-trusted.

Options for managed estates:

- **Deploy via MSI/Intune** — packages installed by a trusted management channel do not surface
  the interactive SmartScreen prompt to users.
- **Trust the publisher certificate** — distribute the `…-publisher.cer` to *Trusted Publishers*
  via GPO/Intune if your policy allows. (Required for MSIX.)
- **Wait for CA/EV signing** — migration to a CA-issued or Azure Trusted Signing certificate is
  planned and will require no change on the client.

Validate any download before mass deployment:

```powershell
Get-AuthenticodeSignature .\ThreatModelReviewer-v2.1.2-x64.msi | Format-List Status, SignerCertificate
Get-FileHash .\ThreatModelReviewer-v2.1.2-x64.msi -Algorithm SHA256
```

Record the hash from your first download and compare it across distribution points. *(Publishing
per-release checksums is on the roadmap.)*

## 7. Automation and CI/CD

The CLI runs the same deterministic engine with no UI and no Copilot seat, so threat-model
readiness can gate a pipeline:

```powershell
ThreatModelReviewer.Cli.exe "model.tm7" --sarif review.sarif --html review.html
# exit 0 = ready with notes | 2 = not ready | 1 = error
```

Upload `review.sarif` to GitHub code scanning, or publish the HTML report as a build artifact.
Because the verdict is deterministic, the gate is stable across runs and agents.

## 8. Virtual desktops and multi-user hosts

- **VDI / golden images:** install per-machine (MSI `ALLUSERS=1`) or bake in the portable folder.
  Per-user configuration is created on first run and roams with `%APPDATA%` if you use profile
  roaming or FSLogix.
- **Session hosts (RDS/AVD):** per-machine install is supported. Each user gets independent
  credentials (DPAPI-encrypted to their own account) and preferences.
- **Non-persistent VDI:** disable the update check so images stay at the version you validated.

## 9. Removal

```powershell
msiexec /x "{7E2D9A14-3C5B-4F8E-A1D6-9B0C2E4F6A38}" /qn /norestart   # MSI
Remove-Item "$env:APPDATA\ThreatModelReviewer" -Recurse -Force        # per-user configuration
```

Portable installs are removed by deleting the folder. Uninstalling never touches your threat-model
files or exported reports.

---

**Need something this guide doesn't cover** — an MST transform, a specific management platform, or
a hardened baseline? [Open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose).
