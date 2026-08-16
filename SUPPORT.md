# Support

Thank you for using **Threat Model Reviewer**. This document explains where to get help, what to
expect, and how issues are prioritized.

## Where to get help

| I want to… | Go to |
| --- | --- |
| Install or upgrade the app | [Install guide](products/threat-model-reviewer/INSTALL.md) |
| Roll it out to a managed fleet | [Enterprise deployment](products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md) |
| Learn what a tab, score or finding means | [User guide](products/threat-model-reviewer/USER-GUIDE.md) |
| Check a common problem | [FAQ & troubleshooting](products/threat-model-reviewer/FAQ.md) |
| Understand what data leaves my machine | [Data handling & privacy](products/threat-model-reviewer/DATA-HANDLING.md) |
| Report a bug or request a feature | [Open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) |
| Report a security vulnerability | **Privately** — see [SECURITY.md](SECURITY.md). Never in a public issue. |

All public support happens in the release hub:
**[ArasaniRohithReddy/app-releases](https://github.com/ArasaniRohithReddy/app-releases/issues)**.

## Before you file an issue

Including these makes a fix dramatically faster:

1. **Version** — shown in **Help → About** (or the header), e.g. `v2.0.3`.
2. **Install method** — MSI, portable ZIP, setup.exe or MSIX.
3. **Windows version** — 10 or 11, and the build number.
4. **What you expected vs. what happened**, with exact wording of any error.
5. **Whether AI was involved** — was the failure in the deterministic review, or in a Copilot
   action? (This narrows the cause immediately.)
6. **A minimal model that reproduces it, if you can share one.**

> **Never attach a real, sensitive threat model to a public issue.** Threat models describe your
> attack surface. Sanitize it first, or describe the structure instead — element/flow counts,
> which check fired, and the finding id.

## Severity and response

This is an actively maintained project. Issues are triaged in this order:

| Severity | Definition | Target first response |
| --- | --- | --- |
| **S1 — Critical** | Data loss, model corruption, or an incorrect *deterministic* verdict | Within 1 business day |
| **S2 — High** | A core workflow (review, fix, export) is blocked with no workaround | Within 3 business days |
| **S3 — Normal** | Bug with a workaround, or an AI/advisory feature issue | Best effort |
| **S4 — Enhancement** | Feature requests and ideas | Reviewed and roadmapped |

Correctness of the deterministic verdict and the integrity of `.tm7` write-back are treated as the
highest priority, because everything else depends on them.

These targets are a good-faith commitment for a project of this size, not a contractual SLA. If
your organization needs a formal support agreement, please raise it in an issue.

## Supported versions

The **latest released version** receives fixes. Because in-app updating is built in (v1.0.4 and
later), upgrading is normally a two-click operation, and reproducing an issue on the latest build
is the first troubleshooting step.

See [SECURITY.md](SECURITY.md#supported-versions) for the security-fix policy.

## What is *not* supported

- **Modified builds.** Please reproduce on an official release before filing.
- **The Microsoft Threat Modeling Tool itself.** Issues with TMT belong with Microsoft. If a file
  produced *by this app* fails to open in TMT, that **is** our bug — please report it.
- **Your GitHub Copilot subscription, quota or availability.** AI features depend on your own
  seat; the deterministic review never does.

## Contributing a fix

Pull requests and detailed bug reports are welcome — see [CONTRIBUTING.md](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose).
