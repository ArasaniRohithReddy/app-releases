# Security Policy

Threat Model Reviewer is a **defensive** security tool that handles highly sensitive input: your
threat models. This policy covers how to report a vulnerability, how the product handles data, how
it is built and signed, and which versions receive fixes.

- **Data handling in full detail:** [Data handling & privacy](products/threat-model-reviewer/DATA-HANDLING.md)
- **Managed/offline deployment:** [Enterprise deployment](products/threat-model-reviewer/ENTERPRISE-DEPLOYMENT.md)

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report security issues privately via GitHub's **"Report a vulnerability"** button under
the **Security** tab of the public repository
([ArasaniRohithReddy/app-releases](https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new)),
or by emailing the maintainer. Include:

- the affected version and install method (portable / installer / MSIX),
- a description of the issue and its impact,
- reproduction steps or a proof of concept.

You can expect an acknowledgement within a few days. Please give a reasonable
disclosure window before any public discussion.

### What to expect

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | Within 3 business days |
| Initial assessment and severity | Within 5 business days |
| Fix or documented mitigation for a critical issue | Prioritized ahead of all feature work |
| Public advisory and credit | On release of the fix, coordinated with you |

Researchers who report in good faith will be credited in the advisory unless they prefer to remain
anonymous. We will not pursue action against good-faith research that respects user privacy and
avoids service disruption.

## How the application handles your data

Threat models are sensitive, so the application is designed to keep them local:

- **The deterministic review runs entirely on your machine.** The verdict, score, and
  findings never depend on a network call.
- **AI features are optional and additive.** Finding tools send contextual text;
  extraction and refinement can also send supplied documents, drafts or images.
  Text redaction is a safeguard, not a guarantee that an input is free of secrets.
- Prompts go to **your own GitHub Copilot seat** and are metered against your quota.
- An OpenAI-compatible provider (Azure OpenAI / OpenAI / local) can be used instead of
  Copilot; the API key is stored locally and DPAPI-protected.
- **No product analytics** are sent by the app. Updates, account checks, Azure discovery
  and enabled MCP sources have separate network paths. External runtimes and servers
  have their own terms and settings; disable integrations for an offline-only workflow.

Every network destination, storage path and redaction rule is enumerated in
**[Data handling & privacy](products/threat-model-reviewer/DATA-HANDLING.md)**.

## Security of the product itself

Because this tool parses untrusted files and passes their content to a language model, it is built
defensively:

| Risk | Control |
| --- | --- |
| **Malicious/malformed `.tm7` or `.json`** | Parsing is defensive: malformed input surfaces as an error rather than a crash. XML is read through `System.Xml.Linq` using .NET 10's default reader settings, under which **DTD processing and external entity resolution are disabled by default** (no XXE by construction on this runtime). |
| **Secrets inside a threat model reaching an LLM** | `PromptSafety.Redact` strips private keys, JWTs, cloud/GitHub tokens, bearer tokens, connection-string secrets and emails before any prompt is sent. |
| **Prompt injection embedded in model content** | Known injection patterns are scanned and flagged. This does not guarantee detection; review tool use and treat model content as untrusted. |
| **Secrets accidentally committed to a model** | Surfaced as findings so they can be removed at the source. |
| **Credential theft at rest** | GitHub tokens and provider API keys are encrypted with Windows DPAPI, scoped to the current user. |
| **Token leakage to child processes** | Since v2.0.1 the device-flow token is passed directly to the Copilot SDK rather than being set as a process-wide environment variable. |
| **Untrusted update payloads** | Update packages download over HTTPS from the official release hub, are Authenticode-signed, and install paths are validated against traversal. |
| **Report/export injection** | CSV and issue exports are neutralized against formula-injection (`=`, `+`, `-`, `@` prefixes). |
| **Supply chain** | A small, pinned dependency set (see [Third-party notices](products/threat-model-reviewer/THIRD-PARTY-NOTICES.md)) with automated update PRs via Dependabot. |

The deterministic core has **no AI dependency**, so no model output can alter a verdict, a score,
or the contents written back to a `.tm7` without explicit user approval of each change.

## Supported versions

| Version | Status |
| --- | --- |
| **2.5.1** (latest) | ✅ Supported — receives security and functional fixes |
| 2.4.x (earlier) | ⚠️ Best effort — please update; in-app update makes this a two-click operation |
| 2.2.x (earlier) | ⚠️ Best effort — please update; in-app update makes this a two-click operation |
| 2.0.x (earlier) | ⚠️ Best effort — please update; in-app update makes this a two-click operation |
| 1.x | ❌ End of life — upgrade to 2.x |

Fixes are delivered in the next release rather than as patches to older versions. Because in-app
updating has shipped since v1.0.4, staying current is normally automatic.

## Code signing

Application executables and installers (MSI, setup `.exe`, and MSIX) are **Authenticode-signed**.
ZIP containers, Markdown skill files and the public certificate are not
Authenticode-signed application binaries.
For now they're signed with a **self-signed** certificate (`CN=ArasaniRohithReddy`), which means:

- the binaries carry a valid, tamper-evident signature, and the MSIX installs after you
  import the included `.cer` into *Trusted People*;
- but **Microsoft Defender SmartScreen still warns** on first run, because a self-signed
  certificate isn't chain-trusted by Windows. Click **More info → Run anyway**.

CA-issued, EV or Azure Trusted Signing certificates can establish publisher trust,
but do not guarantee the absence of SmartScreen or organizational policy warnings.
The release pipeline supports supplying a certificate with `-CertPfx` or
`-CertThumbprint` to sign application binaries and installers. This migration is planned.
