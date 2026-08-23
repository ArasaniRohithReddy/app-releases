# User Guide

Threat Model Reviewer reviews, fixes and analyzes **Microsoft Threat Modeling
Tool `.tm7`** threat models (and OWASP Threat Dragon `.json`). Model creation is currently in
**beta**. The **verdict and 0–100
score are deterministic** — computed by a rubric engine, never by AI. GitHub Copilot is
optional and only ever *advisory*.

## Before you start (prerequisites)

- **To review, fix, score, and export:** nothing extra — it all runs locally and offline.
- **To use the AI features** (explain, deep analysis, draft fixes, critique, gap analysis, DFD
  extraction): an **active GitHub Copilot subscription** (Individual, Business, or Enterprise) and
  being **signed in**. The app uses the bundled **GitHub Copilot CLI** and your logged-in seat —
  **no token to paste.** If the header shows *"Not signed in to GitHub Copilot"*, click
  **Sign in to Copilot** (or run `gh auth login`, or set `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` /
  `GITHUB_TOKEN` to a fine-grained PAT with the "Copilot Requests" permission). When connected, the
  header shows a green dot and *"GitHub Copilot ready — N models"*. See **INSTALL.md → Signing in to
  GitHub Copilot** for details.

## Open a model

- Click **Open .tm7** in the header, or
- Launch the app with a path (`ThreatModelReviewer.exe "C:\path\Model.tm7"`), or "Open with".

The header shows one **verdict** — NOT READY or READY WITH NOTES — with the **review score**
as supporting detail. They answer different questions. The **score (0–100)** measures
*maturity*: how thoroughly the model is built. The **verdict** is a *gate*: any must-fix
(gating) finding forces NOT READY no matter how high the score, so a well-built model can
legitimately score 88/100 and still be NOT READY — "thorough work, but specific blockers".
The **band** (PASS / CONDITIONAL / FAIL) appears in exports and CI only; FAIL is simply the
machine-readable name for NOT READY. Toggle **Strict SDL bar** to make borderline SDL items
gating.

## The tabs

### Overview
The at-a-glance dashboard:
- **Verdict & readiness** — why the model is gated, grouped by check.
- **Review score** — the 0–100 maturity score broken into the four dimensions
  (scope, coverage, response/hygiene, validation).
- **Stat cards**, **STRIDE coverage**, and **AI/LLM components**.
- **Threats by interaction** — every threat regrouped onto its data flow, worst-gap-first,
  with an independent **Prioritize with Copilot** button.
- **Framework coverage** — a deterministic scorecard (OWASP Top 10 2021 + STRIDE): which
  categories your threats address, with an independent **Analyze gaps with Copilot** button.
- **Copilot critique pass** — an optional whole-model SDL critique.

### Diagram
The data-flow diagram with correct DFD shapes, each node labelled with its **stencil type**
(e.g. "Azure Key Vault", "Web Application"); zoomable. A Copilot chat can answer questions
and propose diagram edits.

### Findings
The prioritized findings list. Each finding shows its severity, whether it's **gating**,
the target element/flow, the message, **framework references** (OWASP / MITRE / CWE /
Microsoft Learn), and built-in **what-it-means / how-to-fix** guidance. Per finding you can
**Explain with Copilot** or run **Deep analysis** (DREAD + attack tree + Gherkin tests) —
each independent. **Export ▾** offers HTML / PDF / Markdown / CSV / JSON / SARIF and
work-item exports (GitHub / Azure DevOps / Jira), with an optional "include Copilot
guidance / deep analysis" step.

### Fix
Generate a **remediation plan**: add missing threats, triage Not-Started threats, draft
justifications, and fill out-of-scope reasons. For each item pick **Built-in** or **Copilot**
(draft the specifics with your seat). Review the preview, then **Apply & Save** a corrected
`.tm7` that re-opens cleanly in the Microsoft Threat Modeling Tool.

### Create — beta (not in the current build)
A guided wizard (components → flows → boundaries) that generates a `.tm7` with a STRIDE
baseline. You can also describe a system or load an architecture / IaC / OpenAPI / Mermaid
document and let Copilot extract a DFD you review before generating. **This tab is in beta and
is hidden in the current release** — it will be enabled in a future update. Today's build
focuses on reviewing, fixing and analyzing existing models.

## How AI is used (and not used)

- The **verdict, score, and findings are deterministic** — they never depend on AI.
- Copilot buttons are **additive and independent**: running one never blocks the others.
- Only minimal, **redacted** context is sent (finding text, a DFD summary) — never the raw
  `.tm7`. Prompts use **your GitHub Copilot seat**.

## Exit codes (CLI)

Uniform across every verb, so a pipeline can gate on them:

| Code | Meaning |
| --- | --- |
| `0` | Succeeded, and nothing is gating |
| `1` | The command could not run — bad usage, or missing/unreadable input |
| `2` | Ran fine, but the result gates: NOT READY, a serious comparison regression, or insecure IaC |

`generate` returns `0` even though its output is NOT READY by construction, because every generated
threat is deliberately left as *needs investigation* for an owner to triage.
