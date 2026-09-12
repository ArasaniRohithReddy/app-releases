# Releasing

Source lives in the **private** repo; binaries, docs, and issues live in the **public**
release hub **[ArasaniRohithReddy/app-releases](https://github.com/ArasaniRohithReddy/app-releases)**.
A release publishes the built artifacts there as a GitHub Release.

## Why `dotnet build`, not `dotnet publish`

The app embeds the **GitHub Copilot SDK**, which bundles a CLI runtime at
`runtimes\win-x64\native\copilot.exe` and **spawns it as a child process**. That file is
placed by the SDK's `_CopyCopilotCliToOutput` **build** target.

- `dotnet publish` does **not** run that target and trips `MSB3094` (the SDK registers the
  runtime via `ContentWithTargetPath`).
- Single-file publish would bundle `copilot.exe` *inside* the host exe, so the SDK can't
  spawn it.

So `scripts\build-release.ps1` uses **`dotnet build -c Release -r win-x64 --self-contained`**
and ships the resulting **folder**. (The folder is also what the installer and MSIX package.)

> Paths containing apostrophes can cause SDK copy-task problems. The build script
> stages to an apostrophe-free folder under `%TEMP%` before zipping/packaging.

## Build the artifacts

```powershell
# Requires: .NET 10 SDK; Inno Setup (winget install JRSoftware.InnoSetup);
#           Windows SDK for MSIX (winget install Microsoft.WindowsSDK.10.0.26100)
$ver = ([xml](Get-Content .\ThreatModelReviewer.App\ThreatModelReviewer.App.csproj)).Project.PropertyGroup.Version |
    Where-Object { $_ } | Select-Object -First 1
pwsh scripts\build-release.ps1 -Version $ver
```

Outputs to `dist\` (git-ignored):

| Artifact | What it is |
| --- | --- |
| `ThreatModelReviewer-vX.Y.Z-x64.msi` | **Dual-scope MSI** — install for all users (per-machine) or just me (per-user). |
| `ThreatModelReviewer-vX.Y.Z-win-x64-portable.zip` | Self-contained folder — extract & run. |
| `ThreatModelReviewer-vX.Y.Z-setup.exe` | Per-user Inno Setup installer. |
| `ThreatModelReviewer-vX.Y.Z-x64.msix` | Signed MSIX (experimental). |
| `ThreatModelReviewer-vX.Y.Z-cli-win-x64.zip` | Self-contained command line for CI and scripting. |
| `ThreatModelReviewer-vX.Y.Z-skill.zip` | GitHub Copilot CLI skill. Markdown plus a resolver script, so there is nothing to compile — it is staged, version-stamped and zipped. |
| `ThreatModelReviewer-publisher.cer` | Public cert users trust for the MSIX. |

### Tools

- **WiX v5** for the MSI: `dotnet tool install --global wix --version 5.0.2` then
  `wix extension add -g WixToolset.UI.wixext/5.0.2`. *(WiX v7 requires a paid OSMF EULA — pin to v5.)*
- **Inno Setup**: `winget install JRSoftware.InnoSetup`.
- **Windows SDK** (MSIX: `makeappx` + `signtool`): `winget install Microsoft.WindowsSDK.10.0.26100`.

### Signing

`scripts\build-release.ps1` signs application executables and installers, not ZIP containers:

- with **your certificate** when you pass `-CertPfx <file> [-CertPassword <pw>]` or
  `-CertThumbprint <thumb>` — use an appropriately issued certificate or
  Azure Trusted Signing for publisher trust; signing does not guarantee SmartScreen reputation;
- otherwise with a generated **self-signed** cert (so artifacts are signed and the MSIX
  installs, but SmartScreen still warns publicly).

## Publish the GitHub Release (public repo)

**Manual (gh CLI):**
```powershell
$tag = "threat-model-reviewer-v$ver"
$assets = @(
    "dist\ThreatModelReviewer-v$ver-x64.msi",
    "dist\ThreatModelReviewer-v$ver-win-x64-portable.zip",
    "dist\ThreatModelReviewer-v$ver-setup.exe",
    "dist\ThreatModelReviewer-v$ver-cli-win-x64.zip",
    "dist\ThreatModelReviewer-v$ver-skill.zip",
    "dist\ThreatModelReviewer-v$ver-x64.msix",
    "dist\ThreatModelReviewer-publisher.cer"
)
# Omit the MSIX/certificate entries only when that packaging step was deliberately skipped.
gh release create $tag @assets `
  --repo ArasaniRohithReddy/app-releases `
  --title "Threat Model Reviewer v$ver" `
  --notes-file docs\release-notes\v$ver.md
```

**Automated (GitHub Actions):** push a tag `threat-model-reviewer-vX.Y.Z` to the private
repo. The `.github/workflows/release.yml` workflow builds the artifacts and creates the
Release in `app-releases` using the `RELEASE_TOKEN` secret (a PAT with `contents:write` on
the public repo). Set that secret once in the private repo's settings.

## Versioning & tags

- Bump `<Version>` in `ThreatModelReviewer.App\ThreatModelReviewer.App.csproj`.
- Tag format is **product-prefixed** so the hub can host multiple apps:
  `threat-model-reviewer-vX.Y.Z` (a future app would use `other-app-vX.Y.Z`).
- Add a `CHANGELOG.md` entry and a `docs\release-notes\vX.Y.Z.md`.

## Documentation must move with the release

The version number appears in several documents as a *claim about the current release*, and a stale
claim is worse than no claim — SECURITY.md telling a reader that an older build is the supported one
is a security-relevant inaccuracy. So these are checked automatically:

| What | Where | Checked by |
|---|---|---|
| Changelog entry and link | `CHANGELOG.md` | `DocumentationCurrencyTests` |
| Release notes file | `docs\release-notes\vX.Y.Z.md` | `DocumentationCurrencyTests` |
| Supported-versions table | `SECURITY.md` | `DocumentationCurrencyTests` |
| Deployment version floor | `docs\ENTERPRISE-DEPLOYMENT.md` | `DocumentationCurrencyTests` |
| Build example | `README.md` | `DocumentationCurrencyTests` |
| Every tab is described | `docs\USER-GUIDE.md` | `DocumentationCurrencyTests` |

`dotnet test` fails if any of these fall behind, so a release cannot be tagged with documentation
that still describes the previous one. Bump the version first, then run the suite: the failures tell
you exactly which documents to update.

Keep documentation aligned during development using `docs\DOCUMENTATION.md`.
The complete public mapping lives in `docs\publication.json`, including the public
README, user/CLI/skill guides, security guidance and synthetic sample.

```powershell
pwsh scripts\sync-public-docs.ps1 -HubPath C:\work\app-releases
pwsh scripts\sync-public-docs.ps1 -HubPath C:\work\app-releases -Check
```

Review the hub portal README and all Pages surfaces separately: hero claims,
screenshots, version fallbacks, JSON-LD, MSI recommendation, CLI/skill links and
asset classifiers. The copy command does not certify those manual surfaces.
After publishing, run the hub release-snapshot workflow and verify the live result.

Do not label a source change as shipped just because the project still carries the
last release's version. Preserve historical release notes; document unreleased work
separately until new packages are built and verified.
