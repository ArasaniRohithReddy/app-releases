# User Guide

Threat Model Reviewer reviews, fixes and analyzes **Microsoft Threat Modeling
Tool `.tm7`** threat models (and OWASP Threat Dragon `.json`), and can create new ones. The **verdict and 0–100
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

### Create
A guided wizard (components → flows → boundaries) that generates a `.tm7` with a STRIDE
baseline. You can also describe a system or load an architecture / IaC / OpenAPI / Mermaid
document and let Copilot extract a DFD you review before generating. Every generated threat is
recorded as *Needs Investigation* — an enumerated starting point for you to triage, not a
finished review.

### Compare
Pick two revisions — or use the model you already have open as the baseline — and see what
changed, what got worse and what got better, with the score and verdict movement. Elements,
flows, boundaries and threats are matched by identity, so a rename reads as a rename rather than
a delete plus an add. **Explain with Copilot** adds a plain-English read; the numbers are computed
first and are never altered by it. Exports to HTML, Markdown or CSV.

### Ask
An assistant scoped to the model you have open. Common questions — your score, why a model is not
ready, how many threats are unmitigated, which flows cross a trust boundary — are answered
**straight from the model's own numbers with no AI call**, so no answer can contradict the review.
Each reply says which of the two it was. Open-ended questions go to Copilot, grounded in the same
facts and required to cite them.

There is also a **floating Ask panel** in the bottom-left corner, available from any tab, so asking
a question does not cost you your place in a long findings list. It is the *same conversation* as
this tab: maximising the panel hands its history to the tab rather than starting again, and closing
the model dismisses it.

### History
Every review you run, recorded on this machine, with a per-model score trend and **what you did** to
each model — opens, exports, fixes applied and Copilot actions. The tab names the folder the data
lives in and can open it, so you can verify that nothing leaves your machine rather than taking it
on trust. One click clears it.

**Reopening a model.** Double-click a row, or use the button at the end of it. File paths are *not*
recorded by default, so usually you will be asked where the file is; the app then compares the file
you pick against the content hash it recorded and tells you whether it is the same revision that was
reviewed, or has changed since.

## Appearance

**Help → Appearance** switches between **Light**, **Dark**, and **Match Windows**. The choice is
remembered and applies immediately — no restart.

The data-flow diagram deliberately stays a light sheet in dark mode. It renders a *document* that is
compared against the Microsoft Threat Modeling Tool and exported for review, so its colours are
fixed; only the frame around it follows the theme.

## Keyboard shortcuts

**Help → Keyboard shortcuts**, or **F1**, lists every accelerator. The most useful:

| Keys | Action |
|---|---|
| `Ctrl + O` / `Ctrl + W` | Open a model / close it |
| `Ctrl + E` / `Ctrl + Shift + E` | Export HTML / PDF |
| `Ctrl + R` | Critique the whole model with Copilot (advisory) |
| `Ctrl + T` | Open in the Microsoft Threat Modeling Tool |
| `Ctrl + 1` … `Ctrl + 7` | Jump to a tab |
| `Ctrl + K` | Show or hide the floating Ask panel |
| `Ctrl + mouse wheel` | Zoom the diagram |
| `Ctrl + 0` | Fit the diagram to the window |

---

## Evidence files

A generated threat model is only trustworthy if the reader can check how it was built. Passing
`--evidence` (or leaving **Write evidence file** ticked in the app's Create tab) writes a
`.evidence.md` beside the `.tm7` recording:

- **Declared inputs** — components, flows, boundaries and assumptions, exactly as supplied.
- **The resulting model** — every component, its stencil, whether it is in scope, and its boundary.
- **Threats enumerated** — the count by STRIDE category, and **every rule that fired and how often**,
  so the enumeration itself can be challenged rather than only the individual threats.
- **Added by the generator** — anything synthesized on your behalf, such as a trust boundary the
  specification did not declare. Presenting these as though you had asked for them would be the most
  misleading thing the file could do, so they are called out separately.
- **Gaps and what to verify** — every warning the generator raised, plus the manual checks that no
  tool can perform for you.

The file is deterministic and contains no AI-generated claims: re-running the same specification
reproduces it byte for byte, so any difference is a real change of input rather than model drift.
Attach it to a review and a reader can audit the model instead of trusting it.

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

`generate` returns `0`: a generated model is structurally complete, so it passes the readiness gate.
That is not the same as being reviewed. Every generated threat is recorded as *Needs Investigation*,
which the rubric counts as triaged because it is a deliberate disposition — but nobody has actually
analysed it yet. Treat a generated model as a starting point for triage, never as a finished review.
