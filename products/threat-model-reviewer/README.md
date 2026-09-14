# Threat Model Reviewer

**Find the gaps before your threat model review.**

[![Downloads](https://img.shields.io/badge/downloads-Threat_Model_Reviewer-4F46E5)](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/)

Use the app, CLI and skill from the same product release. Updating a guide does
not add new commands to an older installed binary.

Review Microsoft Threat Modeling Tool `.tm7` and OWASP Threat Dragon `.json`
models, work through specific findings, and save a corrected model for human
review. The Windows app, CLI and Copilot CLI skill use the same deterministic
review engine. You do not need Copilot to run a review.

**[Product site](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/)**
**[Downloads](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/)**
**[User guide](USER-GUIDE.md)** **[CLI](CLI.md)** **[Skill](SKILL.md)**

## Start with a safe example

Download the [synthetic customer-portal model](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/samples/customer-portal.tm7)
and open it with **Open .tm7**. Under the default rubric it returns **NOT READY**,
**65/100**, and **27 gating findings** for threats still marked *Not Started*.
The [quick-start guide](USER-GUIDE.md#try-the-sample-model) explains the next steps.

For automation, extract the CLI bundle and run:

```powershell
.\ThreatModelReviewer.Cli.exe .\customer-portal.tm7 --md .\review.md
$LASTEXITCODE
```

An exit code of `2` is expected for this sample: the review ran successfully and
found gating issues. Code `1` means the command failed, not that a model failed review.

## What you can do

| Task | Where | Result |
| --- | --- | --- |
| Review an existing model | App or CLI | 72 deterministic checks, a readiness verdict, score and traceable findings |
| Correct the model | Fix tab or CLI `fix` | Preview changes, then write a corrected `.tm7`; suggestions are not automatically verified mitigations |
| Draft a model | Create/Assistant tabs or CLI authoring commands | Components, flows and a STRIDE starting point to review and refine |
| Start from existing architecture | Create import or CLI `ingest` | Extract structure from IaC, supported diagrams and documents |
| Start from deployed Azure | Create > Build from Azure or CLI `azure` | Read resource metadata and infer possible access paths; Azure CLI sign-in and read access are required |
| Track progress | Compare, Ask and History | Compare model revisions, ask factual questions and keep local review history |
| Hand off security work | Reports and work-item exports | Share findings and mitigation proposals with the team implementing the controls |
| Use an AI agent | Copilot CLI skill plus the CLI bundle | Ask the agent to run the engine and report its actual output |

Generated threats start as *Needs Investigation*. A role assignment indicates
permission, not observed traffic. Azure discovery is not a complete map of an
application: shared-key access, other resource groups and unknown resource types
can leave gaps. Inspect the draft and its evidence before relying on it.

Newly generated files need the supported baseline/template workflow when they
must reopen in Microsoft TMT. Follow the Create guidance in the user guide;
parsing a file in this reviewer alone does not prove TMT compatibility.
The [compatibility guide](MICROSOFT-TMT.md) distinguishes supported review and
authoring workflows from native TMT features and template-dependent behavior.

## What the result does not mean

The score describes the **model**, not a measured reduction in system risk.
**READY WITH NOTES** means there are no gating findings under the selected rubric
and policy. It is not Microsoft approval or proof that security controls work.

This application **does not patch source code or change deployed infrastructure**.
It helps identify missing threats, improve the model and hand off actionable work.
The owning team implements mitigations and supplies verification evidence.

## Choose a download

| Package | Choose it for |
| --- | --- |
| **`...-x64.msi` - recommended** | Desktop installation or managed deployment, per-machine or per-user |
| `...-win-x64-portable.zip` | Extract-and-run desktop use |
| `...-setup.exe` | Per-user desktop installer |
| `...-cli-win-x64.zip` | Scripts and Windows CI runners |
| `...-skill.zip` | Copilot CLI skill; install the CLI bundle alongside it |
| `...-x64.msix` and `...-publisher.cer` | Experimental MSIX distribution |

Windows 10/11 x64. App and CLI bundles include .NET; the skill is instructions and
a CLI resolver, not a replacement runtime. Executables and installers are signed
with the project's current self-signed certificate. ZIP files are not
Authenticode-signed containers. Check the [installation guide](INSTALL.md) and
[security policy](SECURITY.md#code-signing) before installing.

## Privacy and optional AI

Deterministic model review works locally without network access. Optional AI
features send context to the configured provider; image extraction sends the
image you select. Azure discovery and enabled MCP data sources use network
access separately. Review [Data handling](DATA-HANDLING.md) before enabling them.

The app does not collect product analytics. Update checks can be disabled.
External providers, CLI runtimes and MCP servers have their own terms and settings.

## Developer context and evidence

The application includes [restricted MCP developer context](MCP.md), a
[shell-free Azure discovery runner](AZURE-DISCOVERY.md), and
[captured-revision comparison](COMPARISON.md). Generation retains edited metadata
and protects evidence ownership; SDL exports identify the evaluated source bytes
and publish the manifest last. Use matching binaries and skill instructions;
older releases do not implement every current command or safeguard.

Microsoft Learn, Azure metadata and GitHub repository context are separate,
default-off sources. Read-only access is not a privacy guarantee, and none changes
the deterministic verdict. Azure DevOps MCP remains deferred, not a shipped option.

## Guides and support

[Install](INSTALL.md) · [User guide](USER-GUIDE.md) · [FAQ](FAQ.md) ·
[CLI](CLI.md) · [Skill](SKILL.md) · [Architecture](ARCHITECTURE.md) ·
[Microsoft TMT compatibility](MICROSOFT-TMT.md) ·
[Enterprise deployment](ENTERPRISE-DEPLOYMENT.md) ·
[Third-party notices](THIRD-PARTY-NOTICES.md) ·
[Changelog](CHANGELOG.md)

[Report a bug](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)
with a check ID and sanitized example. Never attach a real threat model or Azure
inventory to a public issue. Report vulnerabilities
[privately](https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new).
