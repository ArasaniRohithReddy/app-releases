# Support

This is the shared support policy for applications distributed through **App Releases**.
Name the app when asking for help: installation, supported platforms, updates and provider
requirements differ by product and release.

## Choose your app

| App | Installation and downloads | Guides and troubleshooting | Privacy and security |
| --- | --- | --- | --- |
| Threat Model Reviewer | [Install guide](products/threat-model-reviewer/INSTALL.md) · [Enterprise deployment](products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md) | [User guide](products/threat-model-reviewer/USER-GUIDE.md) · [FAQ](products/threat-model-reviewer/FAQ.md) | [Data handling](products/threat-model-reviewer/DATA-HANDLING.md) · [Product security](products/threat-model-reviewer/SECURITY.md) |
| shot2code | [Downloads and installation guidance](https://arasanirohithreddy.github.io/app-releases/shot2code/#download) | [Product guides and troubleshooting](https://arasanirohithreddy.github.io/app-releases/shot2code/#docs) | [Privacy overview and policy links](https://arasanirohithreddy.github.io/app-releases/shot2code/#privacy) |

For another application, start at the [app directory](https://arasanirohithreddy.github.io/app-releases/#apps).
Do not apply one app's installer, runtime, signing or update instructions to another.

## Where to get help

| I want to… | Go to |
| --- | --- |
| Report a bug or request a feature | [Open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) |
| Report a security vulnerability | **Privately** — see [SECURITY.md](SECURITY.md). Never in a public issue. |
| Check licensing or bundled components | The app's license and third-party notices, linked from its product page |

All public support happens in the release hub:
**[ArasaniRohithReddy/app-releases](https://github.com/ArasaniRohithReddy/app-releases/issues)**.

## Before you file an issue

Including these makes a fix dramatically faster:

1. **App name and version** — use the app's About/Settings view or the release you downloaded.
2. **Package and installation method** — give the exact asset name or say that you built from source.
3. **Operating system, build and architecture** — include only relevant environment details.
4. **Expected and actual behavior**, exact error wording, and minimal reproduction steps.
5. **Relevant optional features** — provider/model, integrations or plugins involved, without keys,
   tokens, private prompts or account details.
6. **A synthetic or safely redacted example**, when needed to reproduce the issue.

> **Never post credentials or private personal, customer or business data.** Files, screenshots,
> logs and generated output can expose secrets, internal locations or proprietary content.
> Prefer synthetic examples; inspect every attachment and do not assume automatic redaction is complete.

Useful app-specific detail: for Threat Model Reviewer, include the input format, check/finding ID
and whether the issue affects deterministic review or optional AI. For shot2code, include the
input type, selected provider/model and output stack. These details do not require real source material.

## Severity and response

This is an actively maintained project. Issues are triaged in this order:

| Severity | Definition | Target first response |
| --- | --- | --- |
| **S1 — Critical** | Data loss, corrupted user files or materially incorrect core results | Within 1 business day |
| **S2 — High** | A core app workflow is blocked with no workaround | Within 3 business days |
| **S3 — Normal** | Bug with a workaround or a non-blocking feature issue | Best effort |
| **S4 — Enhancement** | Feature requests and ideas | Reviewed and roadmapped |

Data integrity and core correctness take priority across products. For Threat Model Reviewer,
that includes the deterministic verdict and `.tm7` write-back; other apps have their own critical workflows.

These targets are a good-faith commitment for a project of this size, not a contractual SLA. If
your organization needs a formal support agreement, please raise it in an issue.

## Supported versions

Check the **selected app's** support/security policy and latest stable release before reporting.
Reproduce on a supported release when practical. Update mechanisms and available packages vary;
follow that app's installation guide instead of assuming an in-app updater exists.

The repository-wide latest release may belong to a different app. Use the product's own release list.

See [SECURITY.md](SECURITY.md#supported-versions) for the security-fix policy.

## What is *not* supported

- **Modified builds.** Please reproduce on an official release before filing.
- **Third-party products and services.** Account, subscription, quota or service availability
  problems belong with their provider. Report an app integration failure here when you can reproduce it.
- **Application-specific dependencies.** Follow the product guide. For example, Microsoft Threat
  Modeling Tool support belongs with Microsoft, but a file produced by Threat Model Reviewer that
  fails to open there is a valid interoperability report.

## Contributing a fix

Detailed bug reports and feature requests are welcome — please
[open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose). The
source and contribution policy vary by app. Threat Model Reviewer accepts reports through this hub;
shot2code has a [public source repository](https://github.com/ArasaniRohithReddy/shot2code) and
[product contribution guidance](https://arasanirohithreddy.github.io/app-releases/shot2code/#docs).
Check the selected product's instructions before submitting code changes.