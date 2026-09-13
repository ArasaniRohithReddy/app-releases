# Enterprise Deployment

*Applies to Threat Model Reviewer v2.5.1.*

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
| **`ThreatModelReviewer-v<version>-cli-win-x64.zip`** | Extract anywhere | None | **Build agents and pipelines** — headless review, exit-code gating, SARIF upload. See [CLI.md](CLI.md) |
| **`ThreatModelReviewer-v<version>-skill.zip`** | Extract anywhere | None | **Developer workstations using an AI agent** — registers a GitHub Copilot CLI skill that drives the CLI. Needs the CLI bundle alongside it. See [SKILL.md](SKILL.md) |

The desktop app and CLI are **self-contained**: no .NET runtime prerequisite.
The skill bundle requires the CLI; it contains instructions, not a standalone review engine.
Application executables and installers are **Authenticode-signed**; ZIP containers and skill
files are not — see [Signing and SmartScreen](#6-signing-smartscreen-and-trust).

### Package identifiers

Useful for detection rules, upgrade logic and uninstall automation:

| Item | Value |
| --- | --- |
| Product name | `Threat Model Reviewer` |
| Executable | `ThreatModelReviewer.exe` |
| MSI `UpgradeCode` | `{7E2D9A14-3C5B-4F8E-A1D6-9B0C2E4F6A38}` — stable upgrade-family ID |
| MSI `ProductCode` | Version-specific; obtain from the deployed release's original MSI |
| Inno Setup `AppId` | `{8F3A2C71-6B4E-4D2A-9E1F-7C5A0B9D3E64}` |
| Publisher (current) | `ArasaniRohithReddy` (self-signed certificate) |

> `UpgradeCode` identifies the upgrade family, not a particular installed release.
> Use the version-specific `ProductCode` for MSI product-code detection and GUID-based
> uninstall; read it from the deployed MSI's Property table. Never pass `UpgradeCode` to
> `msiexec /x`. A version-aware file detection rule is another option, as shown below.

See Microsoft's [ProductCode](https://learn.microsoft.com/en-us/windows/win32/msi/productcode),
[UpgradeCode](https://learn.microsoft.com/en-us/windows/win32/msi/upgradecode) and
[msiexec](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/msiexec)
references for the identifier and command semantics.

## 2. Silent installation

### MSI (recommended)

```powershell
# Per-machine (all users) — requires elevation
msiexec /i "ThreatModelReviewer-v2.5.1-x64.msi" ALLUSERS=1 /qn /norestart /l*v install.log

# Per-user (no elevation)
msiexec /i "ThreatModelReviewer-v2.5.1-x64.msi" ALLUSERS="" /qn /norestart

# Upgrade in place — install the newer MSI; its upgrade rules identify related versions

# Uninstall using the original MSI for the deployed release (v2.5.1 in this example)
msiexec /x "ThreatModelReviewer-v2.5.1-x64.msi" /qn /norestart
```

Keep the deployed release's original MSI accessible to the uninstall command and use its
actual path. If you deployed another version, use that version's MSI instead. Alternatively,
obtain its actual `ProductCode` from the MSI's Property table and pass that GUID to `/x`.

| Switch | Purpose |
| --- | --- |
| `/qn` | Fully silent, no UI |
| `/norestart` | Never reboot (the product does not require one) |
| `/l*v <file>` | Verbose log — always capture this in a deployment pipeline |
| `ALLUSERS=1` | Per-machine install (omit or set empty for per-user) |
| `APPLICATIONFOLDER="<path>"` | Override the MSI install directory |

### Setup.exe (Inno Setup)

```powershell
ThreatModelReviewer-v2.5.1-setup.exe /VERYSILENT /NORESTART /SUPPRESSMSGBOXES /LOG="install.log"
```

### Portable ZIP

```powershell
Expand-Archive .\ThreatModelReviewer-v2.5.1-win-x64-portable.zip -DestinationPath 'C:\Program Files\ThreatModelReviewer'
# Launch: C:\Program Files\ThreatModelReviewer\ThreatModelReviewer.exe
```

No registry writes, no uninstall entry — remove the folder to uninstall.

## 3. Microsoft Intune (Win32 app)

1. **Package** the MSI with the Microsoft Win32 Content Prep Tool
   (`IntuneWinAppUtil.exe -c <folder> -s <msi> -o <out>`).
2. **Install command**
   ```
   msiexec /i "ThreatModelReviewer-v2.5.1-x64.msi" ALLUSERS=1 /qn /norestart
   ```
3. **Uninstall command**
   ```
   msiexec /x "ThreatModelReviewer-v2.5.1-x64.msi" /qn /norestart
   ```
   The original MSI must be accessible in the uninstall context. Otherwise, use the
   `ProductCode` from that deployed MSI, not the `UpgradeCode`.
4. **Install behaviour:** *System* (for per-machine) — or *User* if deploying per-user.
5. **Detection rule:** MSI product-code rule using the `ProductCode` from the MSI being
   deployed (not `UpgradeCode`), or a file rule on
   `%ProgramFiles%\Threat Model Reviewer\ThreatModelReviewer.exe` with **version ≥ 2.5.1.0**.
   Adjust the file path for per-user installs or a custom `APPLICATIONFOLDER`.
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

AI use is optional; a configured OpenAI-compatible provider does not require Copilot
sign-in. For offline deployment, disable updates, do not use remote AI actions or
Azure discovery, and leave MCP sources disabled. The deterministic review, reports
and built-in remediation remain available.

To keep inference inside your own boundary, configure the OpenAI-compatible provider against an
Azure OpenAI or self-hosted endpoint; the key is stored DPAPI-encrypted per user. See
[DATA-HANDLING.md §3.3](DATA-HANDLING.md#33-openai-compatible-provider--optional-opt-in-self-configured).

### Network allow-list

| Purpose | Destination | Required? |
| --- | --- | --- |
| Update check | `api.github.com`, `github.com` | Optional — omit if updates are disabled |
| Copilot AI features | GitHub Copilot endpoints (per your Copilot deployment) | Optional — only if AI is used |
| Configured AI provider | The endpoint selected by the organization | Optional |
| Direct Azure discovery | Azure management and identity endpoints used by the installed Azure CLI | Optional |
| Microsoft Learn MCP | `learn.microsoft.com/api/mcp` | Optional; disabled initially |
| Azure MCP | npm package registry, Azure identity and service endpoints used by the server | Optional; disabled initially |
| Deterministic review, scoring, reports and built-in remediation | — | **No network access required** |

## 6. Signing, SmartScreen and trust

Application executables and installers are Authenticode-signed; ZIP containers are not.
The current certificate is **self-signed**
(`CN=ArasaniRohithReddy`), which means the binaries carry a valid, tamper-evident signature, but
Microsoft Defender SmartScreen may warn on first run because the certificate is not chain-trusted.

Options for managed estates:

- **Deploy via MSI/Intune** — use approved management tooling for unattended installation.
  A managed channel is not a bypass: SmartScreen or organization policy can still warn or
  block execution. Validate the rollout under your organization's software policy.
- **Experimental self-signed MSIX** — follow [INSTALL.md](INSTALL.md): verify the publisher
  certificate and, only if policy allows, import it into **Local Machine → Trusted People**
  with administrator approval. **Trusted Publishers alone does not establish certificate-chain trust.**
- **Future CA/EV signing** — migration to CA-issued, EV or Azure Trusted Signing certificates
  is planned, not shipped. Such certificates can establish publisher trust but do not
  guarantee that SmartScreen or policy warnings disappear. Plan any required certificate
  or policy updates as part of deployment.

Validate any download before mass deployment:

```powershell
Get-AuthenticodeSignature .\ThreatModelReviewer-v2.5.1-x64.msi | Format-List Status, SignerCertificate
Get-FileHash .\ThreatModelReviewer-v2.5.1-x64.msi -Algorithm SHA256
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
msiexec /x "ThreatModelReviewer-v2.5.1-x64.msi" /qn /norestart       # original deployed MSI
Remove-Item "$env:APPDATA\ThreatModelReviewer" -Recurse -Force        # per-user configuration
```

Portable installs are removed by deleting the folder. Uninstalling never touches your threat-model
files or exported reports.

---

**Need something this guide doesn't cover** — an MST transform, a specific management platform, or
a hardened baseline? [Open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose).
