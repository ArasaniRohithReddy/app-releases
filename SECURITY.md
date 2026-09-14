# Security Policy

This repository distributes more than one application. Reporting happens through
the shared hub, but each product has its own data handling, supported versions,
signing and update behavior. Do not apply one product's guarantees to another.

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.**

Use GitHub's [Report a vulnerability](https://github.com/ArasaniRohithReddy/app-releases/security/advisories/new)
action. Include the **product name**, version, installation format, impact and
reproduction steps. Redact credentials, private models, screenshots and other
sensitive content before sharing evidence.

### What to expect

| Stage | Target |
| --- | --- |
| Acknowledgement | Within 3 business days |
| Initial assessment | Within 5 business days |
| Critical issue | Prioritized ahead of feature work |
| Advisory and credit | Coordinated with the reporter when the fix is released |

These are response targets, not guaranteed resolution dates. Allow a reasonable
disclosure window. Good-faith reports that respect user privacy and avoid service
disruption are welcome; reporters are credited unless they prefer anonymity.

## How the application handles your data

Choose the policy for the application you are using:

| Product | Security policy | Data handling |
| --- | --- | --- |
| Threat Model Reviewer | [Product security](products/threat-model-reviewer/SECURITY.md) | [Threat model data and optional integrations](products/threat-model-reviewer/DATA-HANDLING.md) |
| shot2code | [Security guides on the product page](https://arasanirohithreddy.github.io/app-releases/shot2code/#privacy) | [Privacy overview and detailed guide links](https://arasanirohithreddy.github.io/app-releases/shot2code/#privacy) |

Local processing does not mean that every feature is offline. Review the selected
product's provider, sharing and update settings before using private inputs.

## Security of the product itself

Controls and limitations are documented in each product policy. A threat-model
readiness score is not Microsoft approval or proof that deployed controls work.
Likewise, successfully generating code or downloading an installer is not a
security assessment of that output.

## Supported versions

Use the product-specific policy and release list. The repository-wide
`releases/latest` endpoint can refer to a different application, and version
numbers from different products must not be compared.

| Product | Releases and downloads | Support policy |
| --- | --- | --- |
| Threat Model Reviewer | [Threat Model Reviewer releases](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/) | [Supported versions](products/threat-model-reviewer/SECURITY.md#supported-versions) |
| shot2code | [shot2code releases](https://arasanirohithreddy.github.io/app-releases/shot2code/releases/) | [Product security and update guides](https://arasanirohithreddy.github.io/app-releases/shot2code/#docs) |

## Code signing

Signing, checksums and automatic-update support vary by product and package
format. Follow the corresponding product's installation and security guides;
do not assume that every file in this repository is signed or self-updating.

Download from the product's release page, compare available integrity metadata
and verify the expected publisher before installation. A self-signed certificate
is not a publicly trusted certificate. Never disable an organization's controls
or bypass an administrator-enforced block to install a package; obtain IT approval.
