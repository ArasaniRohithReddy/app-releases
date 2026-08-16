# Third-Party Notices

Threat Model Reviewer incorporates the third-party components listed below. This file is provided
for license-compliance review. Threat Model Reviewer itself is licensed under the
[MIT License](../../LICENSE).

*Accurate as of v2.0.3. Versions are the package references declared in the solution; license
identifiers are taken from each package's own metadata.*

---

## Runtime components (shipped in released builds)

| Component | Version | License | Project |
| --- | --- | --- | --- |
| **.NET 10** (self-contained runtime & libraries) | 10.0 | MIT | <https://github.com/dotnet/runtime> |
| **GitHub.Copilot.SDK** — GitHub Copilot integration, includes the bundled Copilot CLI runtime | 1.0.2 | MIT | <https://github.com/github/copilot-sdk> |
| **CommunityToolkit.Mvvm** — MVVM primitives for the desktop UI | 8.4.2 | MIT | <https://github.com/CommunityToolkit/dotnet> |
| **PDFsharp** — native PDF report generation | 6.2.4 | MIT | <https://docs.pdfsharp.net/> |
| **Microsoft.OpenApi.Readers** — OpenAPI/Swagger parsing for model authoring | 1.6.22 | MIT | <https://github.com/microsoft/OpenAPI.NET> |
| **System.Security.Cryptography.ProtectedData** — Windows DPAPI protection for locally stored credentials | 10.0.9 | MIT | <https://dot.net/> |

## Build- and test-time only (not distributed)

| Component | Version | License |
| --- | --- | --- |
| xunit | 2.9.3 | Apache-2.0 |
| xunit.runner.visualstudio | 3.1.4 | Apache-2.0 |
| Microsoft.NET.Test.Sdk | 17.14.1 | MIT |
| coverlet.collector | 6.0.4 | MIT |
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

Every runtime component above is distributed under the **MIT License** except where noted. Full
license text for each package is available from its project URL, and is embedded in the
corresponding NuGet package. To reproduce this inventory from source:

```powershell
dotnet list ThreatModelReviewer.slnx package --include-transitive
```

---

*If you believe a component is missing or mis-attributed, please
[open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) so it can be
corrected.*
