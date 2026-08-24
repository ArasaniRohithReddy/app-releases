# Installing Threat Model Reviewer

Threat Model Reviewer is a **Windows desktop application**. Three download options are
attached to every release on the
**[releases page](https://github.com/ArasaniRohithReddy/app-releases/releases)** — pick one.

## System requirements

- **Windows 10 (1809 / build 17763) or Windows 11**, 64-bit (x64).
- ~400 MB free disk space.
- **No .NET install needed** — every download is self-contained (the .NET runtime is bundled).
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
3. If **SmartScreen** warns (see [About the SmartScreen warning](#about-the-smartscreen-warning)),
   click **More info → Run anyway**.

## Option 2 — Portable (zip)

1. Download `ThreatModelReviewer-vX.Y.Z-win-x64-portable.zip`.
2. Right-click → **Properties** → tick **Unblock**, then **Extract All** to a folder you
   control (e.g. `C:\Apps\ThreatModelReviewer`).
3. Run **`ThreatModelReviewer.exe`**.

> Keep the files together — `ThreatModelReviewer.exe` needs the folder beside it
> (including `runtimes\win-x64\native\copilot.exe`, which powers the Copilot features).

## Option 3 — Inno Setup installer (`Setup.exe`)

A per-user installer (no admin). Download `…-setup.exe` and run it. An alternative to the
MSI if you prefer a single per-user `.exe`.

## Option 4 — MSIX package — *experimental*

The MSIX is signed with a **self-signed** certificate, so you must trust it first:

1. Download `…-x64.msix` **and** `ThreatModelReviewer-publisher.cer`.
2. Right-click `…-publisher.cer` → **Install Certificate** → **Local Machine** →
   **Place all certificates in the following store** → **Trusted People** → Finish.
   *(needs admin)*
3. Double-click the `.msix` and **Install**.

> **Heads-up:** under MSIX the app runs in a packaged container. The Copilot SDK spawns a
> CLI child process and makes network calls, which can hit container restrictions — so
> **AI features may be limited under MSIX**. For full Copilot support, prefer the **MSI**
> or **portable** options.

---

## About the SmartScreen warning

The downloads are **Authenticode-signed**, but with a **self-signed** certificate for now —
so Microsoft Defender SmartScreen may still show *"Windows protected your PC"* on first run.
That's expected. The warning is about the certificate's **trust chain**, not about the app's
behavior. Verify it yourself before running — check the signature and hash with
`Get-AuthenticodeSignature` and `Get-FileHash` (see
[SECURITY.md](../../SECURITY.md#code-signing)) — and note that the deterministic review runs
entirely on your machine.

SmartScreen only stops warning when the binaries are signed with a certificate from a
**trusted Certificate Authority** (ideally **EV**, or **Azure Trusted Signing**). That
requires identity enrollment + a small cost, so it's planned rather than shipped. Once a CA
certificate is in place, the warning disappears for everyone — no change needed on your end.

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
