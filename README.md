<div align="center">

# App Releases

**The official distribution hub for Windows desktop applications by [@ArasaniRohithReddy](https://github.com/ArasaniRohithReddy).**

Releases · Documentation · Issue tracking

**[🌐 arasanirohithreddy.github.io/app-releases](https://arasanirohithreddy.github.io/app-releases/)**

[![Latest release](https://img.shields.io/github/v/release/ArasaniRohithReddy/app-releases?label=latest&color=4F46E5)](https://github.com/ArasaniRohithReddy/app-releases/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/ArasaniRohithReddy/app-releases/total?color=157347)](https://github.com/ArasaniRohithReddy/app-releases/releases)
[![License](https://img.shields.io/badge/docs%20%26%20assets-MIT-555)](LICENSE)

</div>

---

Some applications are developed in private repositories and some in public ones — shot2code's
source is public at [ArasaniRohithReddy/shot2code](https://github.com/ArasaniRohithReddy/shot2code).
Either way, this public repository is the single place to **download** builds, read
**documentation**, and file **issues**.

## Applications

### 🛡️ Threat Model Reviewer

Find structural, coverage and triage gaps in **Microsoft Threat Modeling Tool (`.tm7`)**
and OWASP Threat Dragon (`.json`) models before human review. The readiness verdict
and 0–100 score are computed locally by a deterministic rubric; Copilot is optional.
Create and Assistant support draft authoring in the desktop app. Ask and floating
Ask share one conversation, with explicit local/AI modes. Optional, default-off
MCP context provides restricted Learn, Azure metadata and GitHub read operations
through the Copilot SDK, with matching CLI and skill controls.

Model fixes do **not** patch code or change infrastructure. The owning team implements
and verifies mitigations; a readiness result is not Microsoft approval.
Start with the [synthetic sample and quick-start guide](products/threat-model-reviewer/USER-GUIDE.md#try-the-sample-model).

| Resource | Link |
| --- | --- |
| **Website** | [Product page](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/) |
| **Download** | [Releases](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/) — every version, notes and files · or [TMR releases on GitHub](https://github.com/ArasaniRohithReddy/app-releases/releases?q=threat-model-reviewer&expanded=true) |
| **Documentation** | [Read guides on the site](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/docs/) — overview, installation, user guide, CLI, skill, FAQ and changelog |
| **In this repository** | [Overview](products/threat-model-reviewer/) · [Install](products/threat-model-reviewer/INSTALL.md) · [User guide](products/threat-model-reviewer/USER-GUIDE.md) · [FAQ](products/threat-model-reviewer/FAQ.md) · [Changelog](products/threat-model-reviewer/CHANGELOG.md) |
| **For enterprises** | [Data handling & privacy](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/docs/data-handling/) · [Enterprise deployment](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/docs/enterprise-deployment/) · [Third-party notices](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/docs/third-party-notices/) |
| **Platform** | Windows 10/11 x64 · self-contained (no .NET install) |

> Additional applications will be published here over time, each under `products/<app>/` with its
> own documentation and product-prefixed release tags.

### 🖼️ shot2code

Turn **screenshots, mockups, URLs, written descriptions or screen recordings** into editable
web code, on your own machine. Twelve output stacks, a multi-file project editor, local SQLite
project **History**, a sandboxed preview, and single-HTML or Vite project export.

shot2code ships **no model**: you bring a GitHub Copilot sign-in (no API key) or a Gemini,
Anthropic or OpenAI key. Whichever you bring, **Settings** lets you pick which of that provider's
models run — one generated option per selected model, across GitHub Copilot, OpenAI, Anthropic
and Google Gemini. Generated code is model output — review it before running it outside
the sandboxed preview. The Windows builds are **not code-signed**; verify the published
SHA-256 checksums.

| Resource | Link |
| --- | --- |
| **Website** | [Product page](https://arasanirohithreddy.github.io/app-releases/shot2code/) |
| **Download** | [Releases](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) — every mirrored version, its notes and the files it actually carries |
| **Documentation** | [Overview](products/shot2code/) · [Install](products/shot2code/INSTALL.md) · [User guide](products/shot2code/USER-GUIDE.md) · [FAQ](products/shot2code/FAQ.md) · [Troubleshooting](products/shot2code/TROUBLESHOOTING.md) · [Changelog](products/shot2code/CHANGELOG.md) |
| **For reviewers** | [Data handling & privacy](products/shot2code/DATA-HANDLING.md) · [Security](products/shot2code/SECURITY.md) · [Architecture](products/shot2code/ARCHITECTURE.md) · [Third-party notices](products/shot2code/THIRD-PARTY-NOTICES.md) |
| **Contributing** | [Where issues, docs fixes and code changes go](products/shot2code/CONTRIBUTING.md) |
| **Source** | [ArasaniRohithReddy/shot2code](https://github.com/ArasaniRohithReddy/shot2code) — the canonical `vX.Y.Z` history and the updater feed |
| **Platform** | Windows 10/11 x64 · self-contained (backend and headless Chromium bundled) |

Threat Model Reviewer's guides, along with [support](https://arasanirohithreddy.github.io/app-releases/help/),
[security](https://arasanirohithreddy.github.io/app-releases/help/security/) and
[license](https://arasanirohithreddy.github.io/app-releases/help/license/), are readable on the
site without GitHub's API; shot2code's guides are published as Markdown in this repository. Either
way, this repository's public Markdown is the canonical source; site HTML is generated
deterministically, with a secondary **View source on GitHub** link.
Contributor workflow: [build and drift checks](scripts/README.md#native-documentation).

## Download

Release tags are product-prefixed — `‹app›-v‹x.y.z›`, for example
`threat-model-reviewer-vX.Y.Z` and `shot2code-vX.Y.Z` — and each product's releases page
lists only its own builds.

**Threat Model Reviewer:** choose **MSI (recommended)** for the desktop app, or the portable
ZIP/per-user setup. The separate **CLI bundle** (`-cli-win-x64.zip`) supports Windows CI and
scripting, and the **Copilot CLI skill** (`-skill.zip`) needs that CLI bundle alongside it.
See the [CLI](products/threat-model-reviewer/CLI.md) and [skill guides](products/threat-model-reviewer/SKILL.md).

**shot2code:** choose the per-user **`.exe` installer (recommended)** — it is the only
self-updating format — or the **MSI** for per-machine managed deployment, or the portable
**ZIP**. `SHA256SUMS.txt` is attached for verification. Older builds predate some of those
formats, and each release card lists only the files that release actually carries. See the
[install guide](products/shot2code/INSTALL.md).

Browse every version — with its release notes, file sizes and direct downloads — on each product's
releases page:
**[Threat Model Reviewer](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/)** ·
**[shot2code](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/)**.
The **[website](https://arasanirohithreddy.github.io/app-releases/)** links the latest build of each
app: every product page selects its newest stable release from a same-origin snapshot first, then
refreshes from GitHub when available, so an API error never removes the saved release history or
its download links. The raw
**[GitHub Releases](https://github.com/ArasaniRohithReddy/app-releases/releases)** list remains
available, including when JavaScript is disabled.

### Verifying a download

Signing differs per product, so check the product's own guidance before deploying widely.

**Threat Model Reviewer** — executables and installers are **Authenticode-signed**; ZIP
containers are not. Confirm the signature and record the hash:

```powershell
Get-AuthenticodeSignature .\ThreatModelReviewer-vX.Y.Z-x64.msi | Format-List Status, SignerCertificate
Get-FileHash .\ThreatModelReviewer-vX.Y.Z-x64.msi -Algorithm SHA256
```

Artifacts are currently signed with a self-signed certificate, so Microsoft Defender SmartScreen
may warn on first run — **More info → Run anyway**. Migration to a CA/EV certificate is planned.
See [SECURITY.md](SECURITY.md#code-signing).

**shot2code** — the builds are **not code-signed**, so there is no signature to check. Compare the
hash against `SHA256SUMS.txt` attached to the same release:

```powershell
Get-FileHash .\shot2code-X.Y.Z-x64.exe -Algorithm SHA256
```

SmartScreen will warn on first run; that warning is expected and is not evidence that the download
is good or bad. See [shot2code security](products/shot2code/SECURITY.md).

## Deploying in an organization

**Threat Model Reviewer:** managed rollout — silent install switches, MSI `UpgradeCode` and Inno
`AppId` for detection rules, Microsoft Intune / Configuration Manager / Group Policy, disabling
update checks fleet-wide, air-gapped operation and CI/CD integration — is documented in
**[Enterprise deployment](products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md)**.

**shot2code:** the MSI is the per-machine deployment format. The app detects a Program Files
install, disables self-update and reports that upgrades are administrator-managed; per-user `.exe`
installs self-update from the public releases feed. See
[Install](products/shot2code/INSTALL.md) and [Security](products/shot2code/SECURITY.md).

Security and privacy reviewers should start with each product's data-handling guide —
**[Threat Model Reviewer](products/threat-model-reviewer/DATA-HANDLING.md)** and
**[shot2code](products/shot2code/DATA-HANDLING.md)** — which enumerate every network destination and
on-disk storage path, and confirm that no telemetry is collected.

## Support

| Need | Where to go |
| --- | --- |
| **Bug or feature request** | [Open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) — it will ask which application it concerns |
| **Support policy & severities** | [SUPPORT.md](SUPPORT.md) |
| **Security vulnerability** | [Report privately](https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new) — **never** in a public issue. See [SECURITY.md](SECURITY.md) |
| **Community expectations** | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

> ⚠️ **Never attach sensitive material to a public issue.** A threat model describes your attack
> surface, and logs, screenshots and generated projects can carry API keys, tokens or proprietary
> code. Sanitize or redact first, or describe the structure instead.

## License

Documentation and release assets in this repository are provided under the
[MIT License](LICENSE). Third-party components bundled in the applications are listed in each
product's third-party notices.
