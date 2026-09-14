# FAQ & Troubleshooting

### Does this fix security vulnerabilities in my code?
No. It edits **threat model artifacts**, not application code or deployed resources.
It identifies missing threats and weak triage, helps draft mitigation proposals, and
exports work items. The owning team implements the controls and verifies them.

### Does READY WITH NOTES mean Microsoft will approve the model?
No. It means the model has no gating findings under the selected rubric and policy.
The score measures model maturity, not real-world security. A reviewer can require
additional evidence, and open threats can remain even when the readiness gate passes.

### Can I try it without a Copilot subscription or a real model?
Yes. Download the [synthetic sample](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/samples/customer-portal.tm7)
and follow [Try the sample model](USER-GUIDE.md#try-the-sample-model). Its default
result is NOT READY, 65/100, with 27 gating findings. No AI call is needed.

### What file types can it review?
Microsoft Threat Modeling Tool **`.tm7`** files, and OWASP **Threat Dragon `.json`**.

### Is this a replacement for every Microsoft Threat Modeling Tool feature?
No. It complements Microsoft TMT with deterministic review, model remediation,
supported drafting and evidence workflows. It does not claim full template-editor,
OneDrive-sharing or native-dashboard parity. Diagram artwork can come from a local
TMT installation or from a built-in fallback; matching an icon does not
verify the deployed service. See [Microsoft TMT compatibility](MICROSOFT-TMT.md).

### Do I need .NET installed?
No. Every download is **self-contained** — the .NET runtime is bundled.

### Do I need GitHub Copilot?
No. The **verdict, 0–100 score, and findings are fully deterministic** and work offline.
Copilot only powers the optional, advisory enrichments (explain, deep analysis, draft
fixes, critique, gap analysis). You can also point at an OpenAI-compatible endpoint via
**AI provider** in the header.

### The AI buttons are greyed out / the header says "Not signed in to GitHub Copilot". How do I fix it?
The AI features run on **your GitHub Copilot seat**, so you need an **active Copilot
subscription** (Individual, Business, or Enterprise) **and** to be signed in — **no token to paste.**
The app uses your existing Copilot CLI / `gh` sign-in if you have one; otherwise sign in right in
the app. To sign in, do any one of:

- Click **"Sign in to Copilot"** in the header — a dialog shows a one-time code; click **Copy code
  & open GitHub**, approve it in your browser, and the app reconnects and lists your models. This is
  the GitHub **device flow** (same client the Copilot CLI uses) — **no external CLI needed.**
- Already signed in via the **Copilot CLI** (`copilot login`) or **GitHub CLI** (`gh auth login`)?
  The app uses that automatically — nothing to do.
- Set an environment variable `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, or `GITHUB_TOKEN` to a
  **fine-grained PAT (v2) with the "Copilot Requests" permission** *(classic `ghp_` tokens aren't
  supported)*.

When you're connected, the header shows a green dot and *"GitHub Copilot ready — N models"*.

### Is my threat model sent anywhere?
The deterministic review is **local**. AI features send context to your selected
provider; extraction can include supplied document text or the image you select.
Text redaction is a safeguard, not a guarantee that every sensitive value is removed.
Azure discovery and enabled MCP sources have their own network paths. See
[Data handling](DATA-HANDLING.md) before using private inputs.

### Windows SmartScreen says "Windows protected your PC".
The portable `.exe` and the installers **are** Authenticode-signed — but for now with a
**self-signed** certificate that Windows doesn't chain-trust, so SmartScreen may warn on first
run. Verify the download source, signature and hash before deciding whether to run it,
and follow your organization's policy. A CA-issued/EV certificate or Azure Trusted
Signing can establish publisher trust, but does not guarantee that all warnings disappear.
See [SECURITY.md](SECURITY.md#code-signing).

### The MSIX won't install / AI features don't work in the MSIX.
- Install the included **`ThreatModelReviewer-publisher.cer`** into **Trusted People**
  (Local Machine) first — see [INSTALL.md](INSTALL.md).
- Under MSIX the app runs in a container that can restrict the Copilot CLI child process,
  so **AI may be limited**. Use the **portable** or **installer** download for full Copilot
  support.

### "Copilot CLI runtime not found" / AI buttons fail in the portable build.
Keep the extracted folder intact — `ThreatModelReviewer.exe` needs the files beside it,
including `runtimes\win-x64\native\copilot.exe`. Don't copy the `.exe` out on its own.

### Why does an update check say it could not confirm the latest version?
The release hub hosts multiple applications. The updater
checks all pages within a finite limit, filters for this product's stable releases,
and can use its public release snapshot to find a newer version. An API failure,
an incomplete list or a snapshot with no newer product release is not proof that
you are current. Retry or use the [Threat Model Reviewer releases page](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/).
Another product's repository-wide "latest" release is not a TMR update.

### Why is the verdict NOT READY even though the score is high?
Because they measure different things, and this is intended. The score measures **maturity** —
how complete and thorough the model is. Readiness is a separate **gate**: a single must-fix
(gating) finding — e.g. an un-triaged threat — forces NOT READY under this tool's rubric.
A high score with a NOT READY verdict can describe a thorough
model that has a few specific blockers. Clear the gating findings (the Fix tab automates most)
and the verdict flips to READY WITH NOTES.

### Is FAIL different from NOT READY?
No — they are the same fact under two names. `Band == Fail` is *defined as*
`Verdict == NotReady`, so the score can never cause FAIL on its own; the band only
distinguishes **PASS** (score ≥ 85) from **CONDITIONAL** once there are no gating findings.
FAIL is the machine-readable name used in exports and CI.

### A finding looks wrong / too noisy.
Open an issue with the check ID and a sanitized snippet:
<https://github.com/ArasaniRohithReddy/app-releases/issues>. Many checks are advisory and use
deliberately tight triggers; we tune them from real reports.

### Can I add my own organization's checks?
The CLI's `policy` commands can configure the existing rubric with disclosed overrides
and waivers; they do not load arbitrary new checks. Custom check implementations are
source-level extensions — checks implement an
`IRubricCheck` interface and compose with the defaults via
`RubricEngine.WithAdditionalChecks(...)` — but that extension point is only reachable when
building from source, and the source repository is private. A supported way to load
organization-specific checks into the shipped app and CLI is on the roadmap. If you need a
particular check, please [open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)
describing the policy — several built-in checks started exactly that way.

### How do I report a bug or request a feature?
Use the issue templates at
<https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose>.
