# FAQ & Troubleshooting

### What file types can it review?
Microsoft Threat Modeling Tool **`.tm7`** files, and OWASP **Threat Dragon `.json`**.

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
The deterministic review is **100% local**. AI features send only **minimal, redacted**
context (finding text, a DFD summary) to **your** Copilot seat — never the raw `.tm7`, and
secrets are stripped by a redaction pass first.

### Windows SmartScreen says "Windows protected your PC".
The portable `.exe` and the installers **are** Authenticode-signed — but for now with a
**self-signed** certificate that Windows doesn't chain-trust, so SmartScreen may warn on first
run. Click **More info → Run anyway**. A self-signed certificate never accrues SmartScreen
reputation; the warning clears for everyone only once signing moves to a **CA-issued/EV**
certificate or **Azure Trusted Signing**, which is planned. You can verify the signature and hash
yourself first — see [SECURITY.md](../../SECURITY.md#code-signing).

### The MSIX won't install / AI features don't work in the MSIX.
- Install the included **`ThreatModelReviewer-publisher.cer`** into **Trusted People**
  (Local Machine) first — see [INSTALL.md](INSTALL.md).
- Under MSIX the app runs in a container that can restrict the Copilot CLI child process,
  so **AI may be limited**. Use the **portable** or **installer** download for full Copilot
  support.

### "Copilot CLI runtime not found" / AI buttons fail in the portable build.
Keep the extracted folder intact — `ThreatModelReviewer.exe` needs the files beside it,
including `runtimes\win-x64\native\copilot.exe`. Don't copy the `.exe` out on its own.

### Why is the verdict NOT READY even though the score is high?
The score measures **maturity**; readiness is a separate **gate**. Any must-fix (gating)
finding — e.g. an un-triaged threat — forces NOT READY, just like a Microsoft SDL reviewer
would. Clear the gating findings (the Fix tab automates most) and the verdict flips.

### A finding looks wrong / too noisy.
Open an issue with the check ID and a sanitized snippet:
<https://github.com/ArasaniRohithReddy/app-releases/issues>. Many checks are advisory and use
deliberately tight triggers; we tune them from real reports.

### Can I add my own organization's checks?
Not from a released build today. The rubric engine is designed for it — checks implement an
`IRubricCheck` interface and compose with the defaults via
`RubricEngine.WithAdditionalChecks(...)` — but that extension point is only reachable when
building from source, and the source repository is private. A supported way to load
organization-specific checks into the shipped app and CLI is on the roadmap. If you need a
particular check, please [open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose)
describing the policy — several built-in checks started exactly that way.

### How do I report a bug or request a feature?
Use the issue templates at
<https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose>.
