<div align="center">

# App Releases

**The official distribution hub for Windows desktop applications by [@ArasaniRohithReddy](https://github.com/ArasaniRohithReddy).**

Signed releases · Documentation · Issue tracking

**[🌐 arasanirohithreddy.github.io/app-releases](https://arasanirohithreddy.github.io/app-releases/)**

[![Latest release](https://img.shields.io/github/v/release/ArasaniRohithReddy/app-releases?label=latest&color=4F46E5)](https://github.com/ArasaniRohithReddy/app-releases/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/ArasaniRohithReddy/app-releases/total?color=157347)](https://github.com/ArasaniRohithReddy/app-releases/releases)
[![License](https://img.shields.io/badge/docs%20%26%20assets-MIT-555)](LICENSE)

</div>

---

Application source code is maintained in private repositories. This public repository is the
single place to **download** builds, read **documentation**, and file **issues**.

## Applications

### 🛡️ Threat Model Reviewer

Find structural, coverage and triage gaps in **Microsoft Threat Modeling Tool (`.tm7`)**
and OWASP Threat Dragon (`.json`) models before human review. The readiness verdict
and 0–100 score are computed locally by a deterministic rubric; Copilot is optional.
Create and Assistant are available in the desktop app.

Model fixes do **not** patch code or change infrastructure. The owning team implements
and verifies mitigations; a readiness result is not Microsoft approval.
Start with the [synthetic sample and quick-start guide](products/threat-model-reviewer/USER-GUIDE.md#try-the-sample-model).

| Resource | Link |
| --- | --- |
| **Website** | [Product page](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/) |
| **Download** | [Releases](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/) — every version, notes and files · or [latest on GitHub](https://github.com/ArasaniRohithReddy/app-releases/releases/latest) |
| **Documentation** | [Overview](products/threat-model-reviewer/) · [Install](products/threat-model-reviewer/INSTALL.md) · [User guide](products/threat-model-reviewer/USER-GUIDE.md) · [FAQ](products/threat-model-reviewer/FAQ.md) · [Changelog](products/threat-model-reviewer/CHANGELOG.md) |
| **For enterprises** | [Data handling & privacy](products/threat-model-reviewer/DATA-HANDLING.md) · [Enterprise deployment](products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md) · [Third-party notices](products/threat-model-reviewer/THIRD-PARTY-NOTICES.md) |
| **Platform** | Windows 10/11 x64 · self-contained (no .NET install) |

> Additional applications will be published here over time, each under `products/<app>/` with its
> own documentation and product-prefixed release tags.

## Download

Choose **MSI (recommended)** for the desktop app, or the portable ZIP/per-user setup.
The separate **CLI bundle** (`-cli-win-x64.zip`) supports Windows CI and scripting.
The **Copilot CLI skill** (`-skill.zip`) needs that CLI bundle alongside it.
See the [CLI](products/threat-model-reviewer/CLI.md) and [skill guides](products/threat-model-reviewer/SKILL.md).

Browse every version — with its release notes, file sizes and direct downloads — on the
**[releases page](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/)**.
The **[website](https://arasanirohithreddy.github.io/app-releases/)** selects the latest stable
Threat Model Reviewer release from a same-origin snapshot, then refreshes from GitHub when
available. API errors do not remove the saved release history or its download links.
The raw **[GitHub Releases](https://github.com/ArasaniRohithReddy/app-releases/releases)** list
remains available, including when JavaScript is disabled.

Release tags are product-prefixed — `‹app›-v‹x.y.z›`, for example
`threat-model-reviewer-vX.Y.Z`.

### Verifying a download

Executables and installers are **Authenticode-signed**; ZIP containers are not.
Before deploying widely, confirm the signature and record the hash:

```powershell
Get-AuthenticodeSignature .\ThreatModelReviewer-vX.Y.Z-x64.msi | Format-List Status, SignerCertificate
Get-FileHash .\ThreatModelReviewer-vX.Y.Z-x64.msi -Algorithm SHA256
```

Artifacts are currently signed with a self-signed certificate, so Microsoft Defender SmartScreen
may warn on first run — **More info → Run anyway**. Migration to a CA/EV certificate is planned.
See [SECURITY.md](SECURITY.md#code-signing).

## Deploying in an organization

Managed rollout — silent install switches, MSI `UpgradeCode` and Inno `AppId` for detection rules,
Microsoft Intune / Configuration Manager / Group Policy, disabling update checks fleet-wide,
air-gapped operation and CI/CD integration — is documented in
**[Enterprise deployment](products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md)**.

Security and privacy reviewers should start with
**[Data handling & privacy](products/threat-model-reviewer/DATA-HANDLING.md)**, which enumerates
every network destination and on-disk storage path, and confirms that no telemetry is collected.

## Support

| Need | Where to go |
| --- | --- |
| **Bug or feature request** | [Open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) — it will ask which application it concerns |
| **Support policy & severities** | [SUPPORT.md](SUPPORT.md) |
| **Security vulnerability** | [Report privately](https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new) — **never** in a public issue. See [SECURITY.md](SECURITY.md) |
| **Community expectations** | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

> ⚠️ **Never attach a real threat model to a public issue.** Threat models describe your attack
> surface. Sanitize first, or describe the structure instead.

## License

Documentation and release assets in this repository are provided under the
[MIT License](LICENSE). Third-party components bundled in the applications are listed in each
product's third-party notices.
