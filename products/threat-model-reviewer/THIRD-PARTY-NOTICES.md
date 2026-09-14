# Third-Party Notices

Threat Model Reviewer incorporates the third-party components listed below. This file is provided
for license-compliance review. Threat Model Reviewer itself is licensed under the
[MIT License](LICENSE).

*Direct package references aligned with the current source on 13 September 2026.
This is not a complete transitive SBOM. Inspect the exact release's bundled license
files and dependency inventory for deployment or compliance decisions.*

---

## Runtime direct package references

| Component | Version | License | Project |
| --- | --- | --- | --- |
| **.NET 10** (self-contained runtime & libraries) | 10.0 | MIT | <https://github.com/dotnet/runtime> |
| **GitHub.Copilot.SDK** — GitHub Copilot integration, includes the bundled Copilot CLI runtime | 1.0.11 | MIT | <https://github.com/github/copilot-sdk> |
| **CommunityToolkit.Mvvm** — MVVM primitives for the desktop UI | 8.4.2 | MIT | <https://github.com/CommunityToolkit/dotnet> |
| **DocumentFormat.OpenXml** — Office document ingestion | 3.5.1 | MIT | <https://github.com/dotnet/Open-XML-SDK> |
| **PDFsharp** — native PDF report generation | 6.2.4 | MIT | <https://docs.pdfsharp.net/> |
| **Microsoft.OpenApi.Readers** — OpenAPI/Swagger parsing for model authoring | 1.6.31 | MIT | <https://github.com/microsoft/OpenAPI.NET> |
| **System.Security.Cryptography.ProtectedData** — Windows DPAPI protection for locally stored credentials | 10.0.11 | MIT | <https://dot.net/> |

## Build- and test-time only (not distributed)

| Component | Version | License |
| --- | --- | --- |
| xunit | 2.9.3 | Apache-2.0 |
| xunit.runner.visualstudio | 4.0.0 | Apache-2.0 |
| Microsoft.NET.Test.Sdk | 18.9.0 | MIT |
| coverlet.collector | 10.0.1 | MIT |
| WiX Toolset (MSI authoring) | 5.0.2 | MS-RL |
| Inno Setup (installer authoring) | 6.x | Inno Setup License (BSD-style) |

## Reference frameworks and knowledge sources

The rubric and the built-in security knowledge base cite the following publicly available
frameworks. They are referenced by name and hyperlink for attribution and traceability; no
proprietary content is redistributed with the product.

| Source | Steward |
| --- | --- |
| Microsoft Security Development Lifecycle (SDL) and the Threat Modeling Tool documentation | Microsoft |
| STRIDE and the STRIDE-per-element chart | Microsoft / Adam Shostack |
| OWASP Top 10, OWASP API Security Top 10 | OWASP Foundation |
| OWASP Top 10 for Large Language Model Applications (2025) and OWASP Agentic security guidance | OWASP Foundation |
| MITRE ATT&CK® | The MITRE Corporation |
| MITRE ATLAS™ | The MITRE Corporation |
| Common Weakness Enumeration (CWE™) | The MITRE Corporation |
| Microsoft Cloud Security Benchmark, Microsoft Learn security guidance | Microsoft |
| OWASP Threat Dragon model format (interoperability) | OWASP Foundation |

MITRE ATT&CK®, ATLAS™ and CWE™ are trademarks of The MITRE Corporation. Microsoft, Azure and
related marks are trademarks of the Microsoft group of companies. OWASP is a registered trademark
of the OWASP Foundation. All trademarks are the property of their respective owners; their use
here is nominative and does not imply endorsement.

## Obtaining license texts

The table identifies the licenses of the named packages. Bundled tools and transitive
dependencies can have separate notices and terms; do not infer their licensing from
the parent package. Full license texts are available from the project/package metadata.
To inspect direct and transitive versions from source:

```powershell
dotnet list ThreatModelReviewer.slnx package --include-transitive
```

---

*If you believe a component is missing or mis-attributed, please
[open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) so it can be
corrected.*
