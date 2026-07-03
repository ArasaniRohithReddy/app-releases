# User Guide

Threat Model Reviewer reviews, fixes, analyzes, and creates **Microsoft Threat Modeling
Tool `.tm7`** threat models (and OWASP Threat Dragon `.json`). The **verdict and 0–100
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

The header shows the **verdict** (NOT READY / READY WITH NOTES), the **review score**, the
**band**, the model name, and counts. Toggle **Strict SDL bar** to make borderline SDL
items gating.

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

### Create
A guided wizard (components → flows → boundaries) that generates a `.tm7` with a STRIDE
baseline. You can also describe a system or load an architecture / IaC / OpenAPI / Mermaid
document and let Copilot extract a DFD you review before generating.

## How AI is used (and not used)

- The **verdict, score, and findings are deterministic** — they never depend on AI.
- Copilot buttons are **additive and independent**: running one never blocks the others.
- Only minimal, **redacted** context is sent (finding text, a DFD summary) — never the raw
  `.tm7`. Prompts use **your GitHub Copilot seat**.

## Exit codes (CLI)

`review`: `0` = ready-with-notes, `2` = not ready, `1` = error.
