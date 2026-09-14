# Releasing

Source lives in the **private** repo; binaries, docs, and issues live in the **public**
release hub **[ArasaniRohithReddy/app-releases](https://github.com/ArasaniRohithReddy/app-releases)**.
A release promotes an accepted, signed candidate there as a GitHub Release. Building,
signing, uploading a draft, and making it public are separate authorization gates.

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
> builds into a fresh, apostrophe-free folder under `%TEMP%` before zipping/packaging.
> It does not reuse an older `bin\Release` payload.

## Build the artifacts

```powershell
# Only after the exact source head, version, runtime and signer are approved.
# Requires installed .NET 10 SDK, WiX 5.0.2 + UI extension, Inno Setup 6,
# and Windows SDK makeappx/signtool. See the read-only preflight below first.
$ver = ([xml](Get-Content .\ThreatModelReviewer.App\ThreatModelReviewer.App.csproj)).Project.PropertyGroup.Version |
    Where-Object { $_ } | Select-Object -First 1
pwsh scripts\build-release.ps1 -Version $ver -CertThumbprint $approvedThumbprint `
    -ExpectedSourceCommit $acceptedHead `
    -CopilotCliBinaryPath $approvedRuntime -ExpectedCopilotCliSha256 $approvedRuntimeHash
```

Outputs to **`dist\vX.Y.Z\`** (git-ignored), or the explicit `-OutputDirectory`.
The directory must be new or empty. A retry must use a new empty directory rather
than deleting historical packages, screenshots or another build's output.
Bundled quick-start instructions come from `docs/PACKAGE-README.md` and
`docs/PACKAGE-CLI.md`, not the private source README's candidate/publication notices.
Missing bundled guides or licenses fail the build.

| Artifact | What it is |
| --- | --- |
| `ThreatModelReviewer-vX.Y.Z-x64.msi` | **Dual-scope MSI** — install for all users (per-machine) or just me (per-user). |
| `ThreatModelReviewer-vX.Y.Z-win-x64-portable.zip` | Self-contained folder — extract & run. |
| `ThreatModelReviewer-vX.Y.Z-setup.exe` | Per-user-default Inno Setup installer, with an optional elevated all-users mode. |
| `ThreatModelReviewer-vX.Y.Z-x64.msix` | Signed MSIX (experimental). |
| `ThreatModelReviewer-vX.Y.Z-cli-win-x64.zip` | Self-contained command line for CI and scripting. |
| `ThreatModelReviewer-vX.Y.Z-skill.zip` | GitHub Copilot CLI skill. Markdown plus a resolver script, so there is nothing to compile — it is staged, version-stamped and zipped. |
| `ThreatModelReviewer-publisher.cer` | Public signing certificate; trust requires an approved deployment policy. |
| `ThreatModelReviewer-vX.Y.Z-release.json` | Source SHA, SDK/runtime/framework versions, runtime hashes, signing observations and artifact digests. Not an installation acceptance claim. |
| `ThreatModelReviewer-vX.Y.Z-SHA256SUMS.txt` | SHA-256 for the seven distribution files and the release report. |

**MSI is the recommended desktop distribution. The skill ZIP is not the CLI**:
users must obtain the separate CLI ZIP and configure its resolver. An ordinary
release requires all seven distribution files. `-SkipMsi`, `-SkipInstaller` and
`-SkipMsix` are deliberate partial-development builds, not substitutes for release
acceptance. Missing tools or missing requested outputs now fail instead of
silently producing an unsigned/incomplete candidate.
Use `build-release.ps1` as the release entry point: the standalone legacy
`build-msi.ps1` does not provide this complete prerequisite/evidence gate.

### Runtime acquisition in managed environments

The release script defaults to the app project's declared version and rejects a
different `-Version`; an artifact filename must not claim a different build version.
Each invocation uses its own staging directory rather than deleting another
concurrent build's staging files.

Run a side-effect-free preflight before staging or signing:

```powershell
pwsh scripts\build-release.ps1 -PreflightOnly -CheckPackagingTools `
    -CopilotCliBinaryPath $approvedRuntime -ExpectedCopilotCliSha256 $approvedRuntimeHash `
    -CertThumbprint $approvedThumbprint -ExpectedSourceCommit $acceptedHead
```

It checks the app version, supported `win-x64` target, SDK-pinned runtime version,
and supplied runtime metadata/hash. `-CheckPackagingTools` also checks the installed
tools, app file/assembly versions, empty output directory, and the selected
certificate's private-key association, validity, Code Signing EKU and exact MSIX
publisher match. It reads certificate metadata but creates/imports/trusts nothing.
`HasPrivateKey` does not prove key-provider/ACL access; only a separately authorized
signing attempt can establish that. `SourceClean=false` is not an accepted release head.
`PackagingVerified` is deliberately `false`: preflight is
not an installer, signature, packaged-runtime or upgrade test.
Preflight does not restore dependencies. On a fresh worktree it can read the
**exact declared SDK version's** existing NuGet `GitHub.Copilot.SDK.props` when
`obj` imports are absent; it never picks the newest cached SDK. If neither the
evaluated pin nor those cached props are available, it stops. A normal authorized
build may restore the declared projects and recheck the pin before staging.

Do **not** use `CopilotSkipCliDownload=true` for a release. That option is useful
for synthetic tests but can leave the real Copilot runtime absent or stale.
If managed security blocks runtime acquisition, **stop**; do not disable controls,
bootstrap `npx`, switch download routes or copy unapproved packages. Use an
already-approved runtime through the documented override:

```powershell
pwsh scripts\build-release.ps1 -Version $ver -ExpectedSourceCommit $acceptedHead `
    -CopilotCliBinaryPath $approvedRuntime -ExpectedCopilotCliSha256 $approvedRuntimeHash `
    -CertThumbprint $approvedThumbprint
```

This uses the SDK's supported `CopilotCliBinaryPath` property. The script checks
the copied runtime's file version against `CopilotCliVersion` from the installed
SDK and, for an explicitly supplied binary, compares its SHA-256 after both
app and CLI builds, and requires both payloads to contain the same bytes. App,
CLI and setup executable file versions must equal `X.Y.Z.0`; the CLI build is
version-stamped without editing project metadata. MSI ProductVersion/UpgradeCode
and self-contained .NET 10 runtime files/configs are checked too.
A compile-only pass is not packaged-runtime validation.
Inspect the actual runtime behavior as well; package/file metadata and a
launcher-reported version are separate observations.

### Tools

The lightweight packaging regression harness writes an actual counted JSON report:

```powershell
pwsh packaging\Test-ReleasePreflight.ps1 -ApprovedRuntimePath $approvedRuntime `
    -ReportPath C:\release-evidence\packaging-fixtures.json
```

Use a new report path. Require `Status: Passed` and a nonzero `Executed` count;
a printed success line does not replace the report or a successful exit code.

- **WiX v5** for the MSI: `dotnet tool install --global wix --version 5.0.2` then
  `wix extension add -g WixToolset.UI.wixext/5.0.2`. *(WiX v7 requires a paid OSMF EULA — pin to v5.)*
- **Inno Setup**: `winget install JRSoftware.InnoSetup`.
- **Windows SDK** (MSIX: `makeappx` + `signtool`): `winget install Microsoft.WindowsSDK.10.0.26100`.

These are provisioning instructions, not permission to install tools on a managed
host. Prefer already-installed approved tools. An existing `winapp` installation
can be inspected with `winapp --cli-schema`; do not bootstrap another copy.
This WPF app does not need `winapp init` or Windows App SDK version metadata to
package its existing build. The maintained manifest is
`packaging\msix\AppxManifest.xml`; its version is stamped only into staging.

### SDK and bundled-runtime update policy

**v2.6.0 baseline qualified 2026-09-14:** `GitHub.Copilot.SDK` **1.0.11**
with the SDK-pinned Windows runtime **1.0.79**. Package/file metadata and the
local RPC status reported that runtime version; RPC protocol **3** identifies the
SDK/runtime transport, not the MCP specification version. A standalone installed
CLI's banner is not evidence about the bundled runtime; use the approved file's
metadata/hash and actual SDK RPC behavior, not a different launcher.

The model catalogue is fetched for the user's signed-in seat. A newer model
appearing in that catalogue does not by itself require an SDK update. Offline
verification hosts intentionally do not establish account/model availability.

An SDK **1.0.13** update is available for review, not automatically approved.
Its published changes include host-tool cancellation, optional client identity,
session credential callbacks and additional session behavior. Assess each new
default and capability against the existing consent, authentication, environment
and tool restrictions; do not enable a new channel merely because it exists.

For each candidate, use an isolated branch and record:

1. The exact package version and its declared runtime pin. Acquire required
   binaries only through approved channels; never bypass an organizational block.
2. Build, model discovery and actual SDK wire/tool-permission compatibility,
   including default-off/single/selected/all MCP behavior and shutdown.
3. The complete relevant suite and packaged-runtime checks. Keep intermittent
   failures and unverified authenticated/native paths explicit; one passing
   rerun does not prove an earlier failure's cause was resolved.
4. Updated dependency notices, feature/privacy documentation and skill syntax
   before release. Keep the previous accepted pin until the candidate qualifies.

See the upstream [SDK releases](https://github.com/github/copilot-sdk/releases)
and the runtime acquisition and preflight instructions above.

### Signing

`scripts\build-release.ps1` signs application executables and installers, not ZIP containers:

- with **your certificate** when you pass `-CertPfx <file> [-CertPassword <pw>]` or
  `-CertThumbprint <thumb>` — use an appropriately issued certificate or
  Azure Trusted Signing for publisher trust; signing does not guarantee SmartScreen reputation;
- otherwise with a reused/generated **development-only self-signed** certificate.
  That is not public publisher trust and does not by itself make an MSIX installable.

All five signed files (desktop/CLI hosts, MSI, setup and MSIX) use the same selected
certificate and RFC 3161 timestamping. `-CertPfx` is passed through to MSIX, not
replaced by another certificate. `-CertThumbprint` defaults to `CurrentUser\My`;
use `-CertStoreLocation LocalMachine` explicitly for a machine-store key. No key
is exported just to accommodate a store-backed certificate. PFX inspection uses
ephemeral key storage; the scripts never import certificate trust.

The MSIX publisher remains **`CN=ArasaniRohithReddy`**. A differently named
certificate is a release blocker, not a reason to silently change the package
identity. Preserve the MSI UpgradeCode, Inno AppId and MSIX Name/Application Id.
Certificate validity and key presence do not establish signer reputation.
Windows can report an untrusted self-signed root as `UnknownError`; the release
report preserves that status and `TrustVerified=false`, rather than calling it a
pass. `winapp cert install` requires an **administrator** terminal and separate
approval in the disposable acceptance environment, never routine preflight.

## Acceptance gates (do not publish on build success alone)

1. **Accepted source:** the coordinator chooses the version and exact clean SHA,
   updates app/skill/docs metadata, and accepts the exact-head CI result. Passing
   an earlier head is insufficient. Source `main`, other worktrees and stable
   public documentation are not changed by packaging.
2. **Read-only preflight:** run the command above and the lightweight fixture suite:

   ```powershell
   pwsh packaging\Test-ReleasePreflight.ps1 -ApprovedRuntimePath $approvedRuntime
   ```

   Neither command compiles or signs. On shared validation hosts, coordinate before
   the real build; do not overlap another agent's validation.
3. **Authorized build/sign, once:** keep the same thread holding the bounded lease
   for the entire child build and release it in `finally`:

   ```powershell
   $lease = [Threading.Mutex]::new($false, 'Local\TMR-Fleet-Validation-20260913')
   $held = $false
   try {
       try { $held = $lease.WaitOne([TimeSpan]::FromSeconds(30)) }
       catch [Threading.AbandonedMutexException] { $held = $true }
       if (-not $held) { throw 'Another validation owns the lease; coordinate and retry later.' }
       & .\scripts\build-release.ps1 -Version $ver -ExpectedSourceCommit $acceptedHead `
           -CopilotCliBinaryPath $approvedRuntime -ExpectedCopilotCliSha256 $approvedRuntimeHash `
           -CertThumbprint $approvedThumbprint
   } finally {
       if ($held) { $lease.ReleaseMutex() }
       $lease.Dispose()
   }
   ```

4. **Artifact integrity and metadata:** read the immutable output; do not mix local
   MSIX with a different CI build/signer. Never use `dist/*` for publication.

   ```powershell
   . .\packaging\Release.Common.ps1
   $out = Join-Path $PWD "dist\v$ver"
   Test-TmrReleaseEvidence -Directory $out -Version $ver `
       -ExpectedSourceCommit $acceptedHead -ExpectedCopilotCliSha256 $approvedRuntimeHash
   foreach ($name in @("ThreatModelReviewer-v$ver-x64.msi",
                       "ThreatModelReviewer-v$ver-setup.exe",
                       "ThreatModelReviewer-v$ver-x64.msix")) {
       Get-TmrSignatureCheck (Join-Path $out $name) $approvedThumbprint
   }
   Get-TmrMsiProperty (Join-Path $out "ThreatModelReviewer-v$ver-x64.msi") ProductVersion
   Get-TmrMsiProperty (Join-Path $out "ThreatModelReviewer-v$ver-x64.msi") UpgradeCode
   ```

   The evidence check is only an integrity/provenance check. Independently inspect
   the ZIP/MSIX entries: root app/CLI executables; `runtimes/win-x64/native/copilot.exe`
   with the approved SHA-256 in **each** app, CLI and MSIX payload; .NET 10
   `includedFrameworks`; the declared SDK in `.deps.json`; MSIX version `X.Y.Z.0`,
   x64 architecture, unchanged publisher/identity, required logos and
   `AppxSignature.p7x`. Check the skill's `plugin.json`, resolver and separate-CLI
   instructions. Hashes are not a substitute for Authenticode verification.
5. **Disposable Windows acceptance, separately authorized:** verify the actual
   signatures/timestamps under the intended trust policy and executable versions
   after extraction; clean MSI install and previous-stable → candidate upgrades in
   both scopes; setup install/upgrade; portable and CLI launch on a VM without
   preinstalled .NET; the separate skill-to-CLI resolver; MSIX install/upgrade
   where policy permits. Use synthetic files and no real OneDrive/Documents profile.
   Verify the **packaged** SDK/runtime path and expected RPC behavior, not a
   globally installed CLI banner. Do not launch native TMT on the shared profile.
   Hash-verified files, a signed file and a working/accepted installation are three
   different claims. Record unverified authenticated/native paths explicitly.
6. **Publication approval:** the coordinator accepts the evidence, trust limitations,
   full runtime/upgrade results and documentation/link fixes before promotion.

## Publish the GitHub Release (public repo)

**Manual (gh CLI), only after upload authorization:**
```powershell
$tag = "threat-model-reviewer-v$ver"
. .\packaging\Release.Common.ps1
$out = Join-Path $PWD "dist\v$ver"
Test-TmrReleaseEvidence -Directory $out -Version $ver `
    -ExpectedSourceCommit $acceptedHead -ExpectedCopilotCliSha256 $approvedRuntimeHash
$assets = @(Get-TmrReleaseAssetNames -Version $ver -IncludeEvidence |
    ForEach-Object { Join-Path $out $_ })
gh release create $tag @assets `
  --repo ArasaniRohithReddy/app-releases `
  --draft --latest=false --target main `
  --title "Threat Model Reviewer v$ver" `
  --notes-file docs\release-notes\v$ver.md
if ($LASTEXITCODE -ne 0) { throw 'Inspect the failed draft/upload; do not delete or overwrite existing releases.' }
```

**Stop after draft creation.** Inspect its exact nine assets and complete acceptance.
The following is a separate operation, only after the coordinator authorizes
public promotion:

```powershell
gh release edit $tag --repo ArasaniRohithReddy/app-releases --draft=false --latest=false
```

The hub is **multi-product**. Never interpret `/releases/latest` as "latest TMR",
make TMR global latest, or edit/deprecate/delete another product's release to fix
discovery. As of the 2026-09-14 preflight, global latest is `shot2code-v0.3.2`;
TMR stable is `threat-model-reviewer-v2.5.1`. Discover by prefix, ignore drafts
and prereleases, and choose the highest product version:

```powershell
gh api --paginate 'repos/ArasaniRohithReddy/app-releases/releases?per_page=100' `
  --jq '.[] | select((.tag_name | startswith("threat-model-reviewer-v")) and (.draft | not) and (.prerelease | not)) | {tag_name,html_url}'
gh api repos/ArasaniRohithReddy/app-releases/releases/tags/threat-model-reviewer-v2.5.1
gh api repos/ArasaniRohithReddy/app-releases/pages --jq '{build_type,source,status}'
```

Use exact tag/download links in versioned docs, and a product-filtered listing for
moving discovery links. The in-app checker filters the prefix rather than using
global latest, but its API window is currently only 50 releases and Atom is finite;
pagination/exhaustion and prerelease fallback remain updater-owner follow-ups.

`--target main` above identifies the **hub's** existing documentation commit when
GitHub creates the new hub tag; it does not push/merge source `main`. The build's
private-source SHA is recorded in the release report. Do not use `--clobber`,
auto-generated hub-wide notes, release deletion, force tags or history rewrites.
If upload fails, inspect the draft and resume only the new candidate's missing
assets with explicit approval. Preserve all prior release assets and screenshots.

**Automated (GitHub Actions):** an authorized product-prefixed private tag (or
manual dispatch) invokes `.github/workflows/release.yml`. It requires successful
CI for the exact head and the **`release` environment**, which administrators must
configure with required reviewers before enabling it. Required secrets are
`RELEASE_TOKEN` (hub `contents:write`), `RELEASE_CERT_PFX_BASE64` and the appropriate
`RELEASE_CERT_PASSWORD`. It builds **all formats with one approved signer** and
creates a **draft** with `--latest=false`, never directly publishes stable.
The approved runtime must be obtainable under that runner's organizational policy;
do not use hosted execution as a workaround for a managed host's acquisition block.
For the currently blocked local environment use only the approved existing binary
override, and do not trigger a second hosted build to replace that candidate.

Actions backup upload is opt-in and `continue-on-error`; exhausted Actions storage
must not block the separate Release asset upload, and is never a reason to delete
existing artifacts. At the 2026-09-14 preflight only `RELEASE_TOKEN` was configured;
the protected environment and approved signing secrets were still prerequisites.

## Versioning & tags

- Bump `<Version>` in `ThreatModelReviewer.App\ThreatModelReviewer.App.csproj`.
- Keep its `<AssemblyVersion>`/`<FileVersion>` at `X.Y.Z.0`, and update the skill
  version/docs under the coordinator's ownership before approving a release head.
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

Those commands require a stable documentation channel. During development,
`docs\publication.json` is marked `development`; use `-AllowDevelopment` only
with a separate preview worktree. Do not overwrite the stable v2.5.1 guides with
new MCP command instructions before publishing matching app, CLI and skill
bundles. `docs\DOCUMENTATION.md` describes the stable-source
and preview workflows.

Review the hub portal README and all Pages surfaces separately: hero claims,
screenshots, version fallbacks, JSON-LD, MSI recommendation, CLI/skill links and
asset classifiers. The copy command does not certify those manual surfaces.
After publishing, run the hub release-snapshot workflow and verify the live result.
Preserve the working **legacy Pages source `main:/docs`**; a product release is not
authorization to migrate Pages, enable a different deployment mode, or replace the
portal with one application's site. Recheck the Pages API and live product pages,
historical downloads and screenshots after any separately approved docs update.

Do not label a source change as shipped just because the project still carries the
last release's version. Preserve historical release notes; document unreleased work
separately until new packages are built and verified.
