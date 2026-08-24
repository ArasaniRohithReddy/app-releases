<div align="center">

# 🛡️ Threat Model Reviewer

**Enterprise-grade review, remediation and analysis for Microsoft threat models.**

[![Latest](https://img.shields.io/badge/latest-v2.0.3-4F46E5)](https://github.com/ArasaniRohithReddy/app-releases/releases/latest)
[![Platform](https://img.shields.io/badge/Windows%2010%2F11-x64-0078D4)](INSTALL.md)
[![Self-contained](https://img.shields.io/badge/.NET-not%20required-512BD4)](INSTALL.md)
[![Verdict](https://img.shields.io/badge/verdict-deterministic-157347)](#why-teams-trust-the-result)

**[Product site](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/)** ·
**[Download](https://github.com/ArasaniRohithReddy/app-releases/releases/latest)** ·
**[Install](INSTALL.md)** · **[User guide](USER-GUIDE.md)** · **[FAQ](FAQ.md)**

</div>

---

A **Windows desktop application** that reviews, fixes and analyzes **Microsoft Threat Modeling
Tool `.tm7`** threat models (and OWASP Threat Dragon `.json`), powered by your own **GitHub
Copilot** seat. It catches the issues a Microsoft SDL reviewer would send back **before** you
submit — and the **verdict is deterministic**, never produced by AI.

## The problem it solves

Threat models fail review for repeatable, mechanical reasons: an interaction nobody analyzed, a
threat left *Not Started*, a *Not Applicable* with no justification, an out-of-scope element with
no stated reason. Those are found late — in review — and cost a full cycle.

This tool applies the same bar **locally, in seconds**, before submission.

## What it does

| Capability | What it gives you |
| --- | --- |
| **Review** | Open a `.tm7` and get a stamped **NOT READY / READY WITH NOTES** verdict, a **0–100 score with a letter grade**, and a prioritized findings list — from ~70 deterministic checks, each citing STRIDE, OWASP, MITRE ATT&CK/ATLAS, CWE or Microsoft Learn. |
| **Fix** | Build a previewable remediation plan — add missing threats, triage, draft justifications, fill out-of-scope reasons — with built-in or Copilot-drafted wording, then **save a corrected `.tm7` that reopens cleanly in the Threat Modeling Tool**. |
| **Analyze** | DREAD scoring, attack trees, mitigation plans, verification tests, whole-model critique, framework-gap analysis, STRIDE and framework coverage scorecards. |
| **Export** | HTML, PDF, Markdown, CSV, JSON, **SARIF**, plus ready-to-file work items for **GitHub, Azure DevOps and Jira**. |
| **Create** *(beta)* | Guided authoring and Copilot DFD extraction from a description, architecture image or OpenAPI spec. **Hidden in the current desktop build**; available today via the CLI. |
| **Compare & History** | See whether a revision improved or regressed, and keep a local record of every review — score trend plus what you did to each model. A history row reopens the model, checking the file you pick against the revision that was reviewed. |

### Working in the app

- **Light, Dark and Match Windows** themes (**Help → Appearance**) — applied immediately, remembered
  between sessions. The data-flow diagram deliberately stays a light sheet in dark mode: it renders a
  document that is compared against the Threat Modeling Tool, so its colours are fixed.
- **Keyboard shortcuts** for everything you repeat — open, close, export, jump between tabs,
  `Ctrl + mouse wheel` to zoom the diagram. **F1** lists them all.
- **A floating Ask panel** available from any tab, so a question does not cost you your place in a
  long findings list. It shares one conversation with the Ask tab.
### Coverage highlights

- **STRIDE-per-element** and per-interaction analysis, matching how the Threat Modeling Tool
  actually generates threats.
- **AI & agentic surface** — OWASP **LLM Top 10 (2025)**, OWASP Agentic threats and MITRE
  **ATLAS**: prompt injection, RAG oversharing, agent channel authentication, human-in-the-loop,
  content safety.
- **Security hygiene** — secrets handling, encryption at rest, managed identity, logging and
  detection sinks, deprecated cryptography, supply chain, SSRF/CSRF, rate limiting.
- **Triage quality** — un-triaged threats, unjustified dispositions, boilerplate or unactionable
  mitigations.

## Why teams trust the result

| Guarantee | How it's enforced |
| --- | --- |
| **The verdict is never AI-generated** | The rubric engine has no AI dependency. Same model in → same verdict out, every time. |
| **Works fully offline** | The entire review requires no network call. Air-gapped use is supported. |
| **Your model never leaves the machine** | AI features send only finding text and a **redacted** structural summary — never the `.tm7`. |
| **Secrets stripped before any prompt** | Private keys, JWTs, cloud/GitHub tokens, connection-string secrets and emails are redacted; prompt-injection content embedded in a model is detected and flagged. |
| **No telemetry** | No analytics, no usage tracking, no vendor endpoint. The only self-initiated request is an anonymous release check — and it can be disabled. |

Full detail: **[Data handling & privacy](DATA-HANDLING.md)**.

## Install

Every release ships the **desktop app** (MSI, setup, or portable ZIP) *and* a **command-line bundle** (`-cli-win-x64.zip`) for CI and scripting &mdash; see [CLI.md](CLI.md).

Download from the **[latest release](https://github.com/ArasaniRohithReddy/app-releases/releases/latest)**:

| Package | Choose it when |
| --- | --- |
| **`…-x64.msi`** | Standard installer; per-machine or per-user. **Recommended, and the option for managed deployment** |
| **`…-win-x64-portable.zip`** | Extract and run — no installation |
| **`…-setup.exe`** | Per-user installer, no administrator rights |
| **`…-x64.msix`** + **`…-publisher.cer`** | MSIX *(experimental — trust the `.cer` first)* |

Every build is **self-contained** — no .NET runtime required. Step-by-step: **[INSTALL.md](INSTALL.md)**.

## Requirements

- **Windows 10 or 11, x64.** Nothing else for the deterministic review.
- *Optional, for AI features only:* an active **GitHub Copilot** subscription and a signed-in
  seat — or any **OpenAI-compatible** endpoint (including Azure OpenAI) if you need inference to
  stay inside your own boundary.

## Documentation

| Document | For |
| --- | --- |
| **[INSTALL.md](INSTALL.md)** | Installing, updating and uninstalling |
| **[USER-GUIDE.md](USER-GUIDE.md)** | Tabs, scoring, findings and workflows |
| **[FAQ.md](FAQ.md)** | Common questions and troubleshooting |
| **[DATA-HANDLING.md](DATA-HANDLING.md)** | **Security & privacy review** — network egress, storage, redaction, no telemetry |
| **[ENTERPRISE-DEPLOYMENT.md](ENTERPRISE-DEPLOYMENT.md)** | **IT administrators** — silent install, Intune/SCCM/GPO, air-gapped, CI/CD |
| **[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)** | License compliance |
| **[Releases](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/)** | Every version — notes, downloads and file sizes |
| **[CHANGELOG.md](CHANGELOG.md)** | Full release history |

## Support

- **Bugs and ideas:** [open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) · [support policy](../../SUPPORT.md)
- **Vulnerabilities:** [report privately](https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new) · [security policy](../../SECURITY.md)

> ⚠️ Never attach a real threat model to a public issue — sanitize it first.
