# Threat Model Reviewer

A **Windows desktop tool** that reviews, fixes, analyzes, and creates **Microsoft Threat
Modeling Tool `.tm7`** threat models (and OWASP Threat Dragon `.json`), powered by your own
**GitHub Copilot** seat. It catches the issues a Microsoft SDL reviewer would bounce back
**before** you submit — and the **verdict is deterministic** (never produced by AI; AI only
explains and drafts fixes you review).

## Download

**[⬇ Latest release](https://github.com/ArasaniRohithReddy/app-releases/releases)** — pick one:

| Download | Use it if… |
| --- | --- |
| `…-win-x64-portable.zip` | simplest — extract & run *(recommended)* |
| `…-setup.exe` | you want a Start-Menu shortcut + uninstall (per-user, no admin) |
| `…-x64.msix` + `…-publisher.cer` | you prefer MSIX *(experimental — AI may be limited under MSIX)* |

No .NET install needed (self-contained). → **[Install instructions](INSTALL.md)**

> **AI features** (explain, draft fixes, critique, gap analysis) need an **active GitHub Copilot
> subscription** and being signed in — click **"Sign in to Copilot"** in the app (or use
> `gh auth login`). The **deterministic review** (verdict, score, findings, exports) needs none of
> this and works fully offline. See **[Install instructions → Signing in to GitHub Copilot](INSTALL.md#signing-in-to-github-copilot)**.

## What it does

- **Review** a `.tm7` → a stamped **NOT READY / READY-WITH-NOTES** verdict, a **0–100 review
  score**, and a prioritized findings list — each finding mapped to **OWASP / MITRE / CWE /
  Microsoft Learn** references with built-in fix guidance.
- **~70 deterministic checks**: structural completeness, STRIDE-per-element coverage, triage
  & mitigation quality, identity/boundary, data protection, network, logging/detection,
  deprecated crypto, supply chain, mismodeled stencils, and a deep **AI/agentic** surface
  (OWASP LLM Top 10 2025, OWASP Agentic, MITRE ATLAS).
- **Coverage views**: STRIDE matrix, **Threats-by-interaction**, and a **Framework coverage**
  scorecard (OWASP Top 10 + STRIDE).
- **Fix** with round-trip write-back to a valid `.tm7`; **Create** via a wizard or Copilot
  DFD extraction.
- Optional **Copilot** enrichments (explain, deep analysis, draft fixes, critique, gap
  analysis, triage planning) — each independent and advisory.
- **Exports**: HTML / PDF / Markdown / CSV / JSON / SARIF + work items (GitHub / Azure
  DevOps / Jira).

## Docs

- **[Install](INSTALL.md)** · **[User guide](USER-GUIDE.md)** · **[FAQ & troubleshooting](FAQ.md)** · **[Changelog](CHANGELOG.md)**

## Privacy

The deterministic review runs **entirely on your machine**. Copilot features send only
minimal, **redacted** context (finding text, a DFD summary) to your own Copilot seat — never
the raw `.tm7`.

## Issues

Found a bug or have an idea?
**[Open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)**.
