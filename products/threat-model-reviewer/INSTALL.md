# Installing Threat Model Reviewer

Threat Model Reviewer is a **Windows desktop application** with a command line and a GitHub Copilot
CLI skill alongside it. Every download is attached to each release on the
**[Threat Model Reviewer releases page](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/)** — pick the matching product package.

## System requirements

- **Windows 10 (1809 / build 17763) or Windows 11**, 64-bit (x64).
- Allow disk space for both the download and the extracted/installed bundle; release
  assets list compressed download sizes, not the complete installation footprint.
- **No .NET install needed** for desktop and CLI bundles; the runtime is included.
  The skill bundle contains instructions and a resolver, and requires the separate CLI.
- **Optional:** an **active GitHub Copilot subscription** (Individual, Business, or Enterprise),
  only if you want the AI features. The app uses your signed-in seat (see
  [Signing in to GitHub Copilot](#signing-in-to-github-copilot)); the deterministic review
  (verdict, score, findings) works fully **without** it.

---

## Option 1 — MSI installer — *recommended*

1. Download `ThreatModelReviewer-vX.Y.Z-x64.msi`.
2. Run it. The wizard lets you choose **"Install for all users"** (per-machine, into
   Program Files — needs admin once) or **"Install just for me"** (per-user, into your
   profile — no admin). It adds a Start-Menu shortcut and an entry in *Apps & features*.
3. If **SmartScreen** warns, verify the source, signature and hash before proceeding.
   Follow [the trust guidance](#about-the-smartscreen-warning) and your organization's policy.

## Option 2 — Portable (zip)

1. Download `ThreatModelReviewer-vX.Y.Z-win-x64-portable.zip`.
2. Verify the download, then **Extract All** to a folder you control
   (e.g. `C:\Apps\ThreatModelReviewer`). Do not bypass an administrator-enforced block.
3. Run **`ThreatModelReviewer.exe`**.

> Keep the files together — `ThreatModelReviewer.exe` needs the folder beside it
> (including `runtimes\win-x64\native\copilot.exe`, which powers the Copilot features).

## Option 3 — Inno Setup installer (`Setup.exe`)

A per-user installer (no admin). Download `…-setup.exe` and run it. An alternative to the
MSI if you prefer a single per-user `.exe`.

## Option 4 — MSIX package — *experimental*

The MSIX uses a **self-signed** certificate. Confirm the expected publisher and
obtain approval before adding trust; importing a certificate is not just extraction:

1. Download `…-x64.msix` **and** `ThreatModelReviewer-publisher.cer` from the same release.
2. Right-click `…-publisher.cer` → **Install Certificate** → **Local Machine** →
   **Place all certificates in the following store** → **Trusted People** → Finish.
   *(needs admin and approval under the device's trust policy)*
3. Double-click the `.msix` and **Install**.

> **Heads-up:** under MSIX the app runs in a packaged container. The Copilot SDK spawns a
> CLI child process and makes network calls, which can hit container restrictions — so
> **AI features may be limited under MSIX**. For full Copilot support, prefer the **MSI**
> or **portable** options.

---

## About the SmartScreen warning

Executables and installers are **Authenticode-signed** with the project's current
**self-signed** certificate; ZIP containers are not. SmartScreen or organization
policy can still warn or block execution. Do not treat a warning as proof of safety
or dismiss it automatically. Verify the download source, signature and hash, then
follow your organization's software policy. See [SECURITY.md](SECURITY.md#code-signing).

CA-issued, EV or Azure Trusted Signing certificates can establish publisher trust,
but signing alone does not guarantee that SmartScreen or policy warnings disappear.
That signing migration is planned, not shipped.

---

## Signing in to GitHub Copilot

The AI features (explanations, drafted fixes, critique, DFD extraction) run on **your GitHub
Copilot seat** — so they need an **active Copilot subscription** (Individual, Business, or
Enterprise) and you must be **signed in**. The deterministic review needs none of this.

**How the app authenticates (in priority order).** No token to paste:

1. **Your existing GitHub Copilot CLI / `gh` sign-in** — if you've run `copilot login` or
   `gh auth login`, the app uses that automatically (the GitHub Copilot SDK's `UseLoggedInUser`).
   This is the smoothest path — nothing to do.
2. **In-app sign-in** — if you're *not* already signed in, the header shows *"Not signed in to
   GitHub Copilot"* with a **Sign in to Copilot** button that runs the **GitHub device flow** (the
   same one, and same client, the Copilot CLI uses) right inside the app.

When you're signed in, the header shows a green dot and *"GitHub Copilot ready — N models"*.

**Ways to sign in (any one):**

1. **In-app (easiest):** click **"Sign in to Copilot"** in the header. A dialog shows a one-time
   code — click **"Copy code & open GitHub"**, approve it in your browser, and the app reconnects
   and lists your models automatically. **No external CLI needed.**
2. **GitHub Copilot CLI / GitHub CLI:** if you already use them, run `copilot login` or
   `gh auth login` — the app picks that up (path 1 above).
3. **Environment variable (headless / automation):** set one of `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`,
   or `GITHUB_TOKEN` to a **fine-grained personal access token (v2) with the "Copilot Requests"
   permission**. *(Classic `ghp_` tokens are not supported.)*

Prefer not to use Copilot? Open **AI provider** in the header to point at an OpenAI-compatible
endpoint (Azure OpenAI / OpenAI / local), or simply don't use the AI buttons — the verdict, score,
and findings are computed deterministically without AI.

> Tokens are stored securely per-user (the CLI uses your OS credential store; the in-app device
> sign-in stores its token DPAPI-encrypted). Never in the repo.

## Uninstalling

- **MSI / Inno installer:** *Settings → Apps → Threat Model Reviewer → Uninstall*.
- **Portable:** delete the folder.
- **MSIX:** right-click the Start-Menu tile → **Uninstall**.

## Troubleshooting

See [FAQ.md](FAQ.md). Still stuck? Open an issue:
<https://github.com/ArasaniRohithReddy/app-releases/issues>.

---

## Option 5 — Command line

For CI, batch review and scripting, download **`ThreatModelReviewer-vX.Y.Z-cli-win-x64.zip`** from the
same release. It is self-contained: extract it anywhere and run it, with no .NET installation.

```powershell
ThreatModelReviewer.Cli.exe "path\to\Model.tm7"
```

The exit code is the contract — `0` READY WITH NOTES, `2` NOT READY, `1` the run failed — so a build
can gate on the verdict. Full reference: [CLI.md](CLI.md).

## Option 6 — GitHub Copilot CLI skill

To let an AI agent drive the reviewer, download **`ThreatModelReviewer-vX.Y.Z-skill.zip`** as well
as the CLI bundle. The skill is instructions; the CLI does the work, so both are needed.

```powershell
Expand-Archive ThreatModelReviewer-vX.Y.Z-skill.zip    -DestinationPath C:\tools\tmr-skill
Expand-Archive ThreatModelReviewer-vX.Y.Z-cli-win-x64.zip -DestinationPath C:\tools\tmr-cli

$env:THREAT_MODEL_REVIEWER_CLI = 'C:\tools\tmr-cli'   # or put that folder on PATH
copilot skill add C:\tools\tmr-skill\skills
copilot skill list                                    # 'threat-model-reviewer' should appear
```

Then ask in plain English: *"review docs/threat-model.tm7"*, *"why is it NOT READY?"*, *"fix what
you can"*. The verdict still comes from the deterministic engine; the agent only runs it and reports
what it says. Full guide: [SKILL.md](SKILL.md).