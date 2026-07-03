# Changelog

All notable changes to **Threat Model Reviewer** are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and the
project aims to follow [Semantic Versioning](https://semver.org/).

## [1.0.7] — 2026-07-03

### Added
- **In-app "Sign in to GitHub Copilot".** When you're not signed in, the header says so and shows a
  **Sign in to Copilot** button that runs the bundled GitHub Copilot CLI's sign-in (browser /
  device-code), then reconnects and lists your models. No token to paste.

### Changed
- Clearer prerequisites: the AI features need an **active GitHub Copilot subscription** and being
  signed in (in-app button, `gh auth login`, or a `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` /
  `GITHUB_TOKEN` fine-grained PAT with the "Copilot Requests" permission). The deterministic review
  needs none of this.

## [1.0.6] — 2026-07-03

### Added
- **Choose the fix source for *all* fixes at once.** The Fix tab now has a **"Use for all:
  Built-in / Copilot"** control that switches every fix to the deterministic built-in content or to
  the Copilot draft in one click — alongside the existing **"Draft with Copilot"** button
  (generates the drafts) and the **per-row** Built-in / Copilot radios (individual override).

## [1.0.5] — 2026-07-03

### Fixed
- **"Analyze gaps with Copilot" and "Prioritize with Copilot" buttons stayed greyed out** on the
  Overview tab even after a model was loaded (a missing change-notification left them stuck
  disabled). Both now enable as soon as a `.tm7` is reviewed. These are independent advisory
  actions — using "Draft with Copilot" in the Fix tab never disabled them.

## [1.0.4] — 2026-06-28

### Changed
- **In-app updates** — clicking **Download** on the update banner now downloads the new build
  *inside the app*, with a progress bar, instead of opening a browser. It automatically picks the
  installer that matches how you installed (MSI, Inno `-setup.exe`, portable `.zip`, or MSIX),
  then offers **Install &amp; restart**: the app closes, updates in place, and reopens on the new
  version. A **What's new** link still opens the full release notes, and the browser download
  remains as a fallback. (The in-app updater ships *in* v1.0.4, so updates *after* this one
  install in-app.)

## [1.0.3] — 2026-06-28

### Added
- **About dialog** — a proper About page (header **Help ▾ → About**) showing the app version,
  publisher, what the app does, the **deterministic-verdict promise** (the verdict and 0–100
  score come from the rubric engine, never AI; Copilot is advisory; models are reviewed
  locally), the MIT license, and direct links to the repo, issues, and releases.
- **Help menu** in the header with direct links — **User guide**, **Installation guide**,
  **FAQ**, **Report an issue**, **View all releases**, **View on GitHub**, and **Check for
  updates** — so help and the issue tracker are one click away.

### Changed
- Header subtitle now reads "Review, fix, **analyze** & create Microsoft Threat Modeling Tool
  (.tm7) threat models" — it previously omitted *analyze* — and wraps cleanly on narrow windows.

## [1.0.2] — 2026-06-28

### Added
- **In-app update check** — on startup (and via a "Check for updates" link in the status
  bar) the app checks the release hub for a newer build and shows a dismissible banner with
  **Download / Skip this version / Later**. It's notify-only (never auto-applies), works for
  every install format, fails soft when offline, and can be disabled in
  `%APPDATA%\ThreatModelReviewer\update.json`.

## [1.0.1] — 2026-06-28

### Added
- **MSI installer** (`…-x64.msi`) built with WiX — a single, dual-scope installer that lets
  the user choose **per-machine** (all users / Program Files) or **per-user** (no admin) at
  install time, with a Start-Menu shortcut and *Apps & features* entry.
- **Authenticode signing** of every artifact (portable `.exe`, MSI, installer `.exe`, MSIX).
  The build pipeline signs with your CA/EV certificate via `-CertPfx` / `-CertThumbprint`;
  otherwise a self-signed certificate is used.

### Notes
- Artifacts are currently **self-signed**, so SmartScreen still warns on first run until a
  CA-issued (ideally EV) certificate or Azure Trusted Signing is used. See `docs/INSTALL.md`.

## [1.0.0] — 2026-06-27

First public release.

### Added
- **Deterministic review** of Microsoft Threat Modeling Tool `.tm7` files (and OWASP
  Threat Dragon `.json`): a stamped **NOT READY / READY-WITH-NOTES** verdict plus a
  **0–100 review score** with a letter grade across the Four-Question dimensions. The
  verdict is never produced by AI.
- **~70 rubric checks** spanning structural completeness, STRIDE-per-element coverage,
  triage & mitigation quality, trust-boundary/identity, data protection, network,
  logging/detection, deprecated cryptography, software supply chain, mismodeled
  stencils, and a deep **AI/agentic** surface (OWASP LLM Top 10 2025, OWASP Agentic,
  MITRE ATLAS). Each finding cites authoritative references (OWASP, MITRE, CWE,
  Microsoft Learn) and ships built-in "what it means / how to fix" guidance.
- **STRIDE-per-element coverage matrix**, **Threats-by-interaction** breakdown
  (worst-gap-first), and a deterministic **Framework coverage** scorecard
  (OWASP Top 10 2021 + STRIDE).
- **Fix / remediation** with round-trip write-back to a valid `.tm7` (add missing
  threats, triage Not-Started, draft justifications, fill out-of-scope reasons).
- **Create** a new `.tm7` from a guided wizard or from Copilot DFD extraction.
- **Copilot enrichment** (optional, advisory): explain findings, deep analysis (DREAD /
  attack tree / Gherkin), draft fixes, whole-model critique, framework-gap analysis, and
  interaction-triage planning — each independent and powered by your GitHub Copilot seat.
- **Exports**: HTML, PDF, Markdown, CSV, JSON, SARIF reports + issue-tracker work items
  (GitHub / Azure DevOps / Jira / JSON), with an optional pre-export "include Copilot
  guidance / deep analysis" step.
- **Packaging**: portable self-contained `.exe` (zip), Inno Setup installer, and a signed
  MSIX package.

[1.0.7]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.7
[1.0.6]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.6
[1.0.5]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.5
[1.0.4]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.4
[1.0.3]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.3
[1.0.2]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.2
[1.0.1]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.1
[1.0.0]: https://github.com/Rohithreddy7123/app-releases/releases/tag/threat-model-reviewer-v1.0.0
