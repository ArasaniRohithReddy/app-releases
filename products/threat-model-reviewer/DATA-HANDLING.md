# Data Handling & Privacy

*Applies to Threat Model Reviewer v2.1.1 and later. Companion to [SECURITY.md](../SECURITY.md).*

Threat models are among the most sensitive documents an organization produces: they enumerate a
system's assets, trust boundaries and known weaknesses. This document states precisely what the
application does with that data, what leaves your machine, and what does not — so a security or
privacy reviewer can approve it on evidence rather than assurances.

---

## 1. Summary for reviewers

| Question | Answer |
| --- | --- |
| Is the review performed locally? | **Yes.** Parsing, all ~70 rubric checks, scoring, the verdict and every report are computed in-process on your machine. |
| Is the threat model file ever uploaded? | **No.** The raw `.tm7` / `.json` is never transmitted. |
| Does the product collect telemetry or analytics? | **No.** There is no analytics SDK, no usage tracking, no crash reporting, and no vendor endpoint. |
| Is there an activity history? | **Yes, and it is yours.** An optional local history of what *you* did (models reviewed, scores, exports, AI actions) is kept on your own disk. It is never transmitted, contains no threat-model content and no AI prompt or response, and can be disabled, exported or erased at any time — see [§5.1](#51-local-activity-history). |
| Does it require network access? | **No.** The deterministic review works fully offline and air-gapped. |
| What can leave the machine? | Only (a) an anonymous GitHub release check and (b) AI prompts, **and only when you explicitly invoke an AI feature**. Both are described below and both can be disabled. |
| Where is data stored at rest? | Locally, under `%APPDATA%\ThreatModelReviewer\`. Credentials are encrypted with Windows DPAPI. |
| Who is the data processor for AI features? | **Your own** GitHub Copilot subscription — the same tenant, terms and data-protection commitments your organization already has with GitHub. |

## 2. Data classification

| Data | Where it lives | Leaves the machine? |
| --- | --- | --- |
| The threat model file (`.tm7`, `.json`) | Only where you opened it from / saved it to | **Never** |
| Findings, verdict, score, coverage matrices | In memory; written to reports you explicitly export | **Never** (unless you send a report you exported) |
| Exported reports (HTML, PDF, MD, CSV, JSON, SARIF, work items) | The path you choose | Only if you distribute them |
| Finding text + redacted DFD summary | In memory | **Only when you invoke an AI feature** → your Copilot seat |
| GitHub OAuth token (if you sign in inside the app) | `%APPDATA%\ThreatModelReviewer\`, **DPAPI-encrypted** (current user) | Sent only to GitHub to authenticate your own seat |
| AI provider settings / API key (optional OpenAI-compatible mode) | `%APPDATA%\ThreatModelReviewer\`, **DPAPI-encrypted** | Sent only to the endpoint **you** configure |
| Update preferences (`update.json`) | `%APPDATA%\ThreatModelReviewer\update.json` | Never |
| Activity history (`history-*.jsonl`, `settings.json`, `salt.txt`) | `%LOCALAPPDATA%\ThreatModelReviewer\history\` | **Never** |
| Downloaded update package | `%LOCALAPPDATA%\…\ThreatModelReviewer` cache | Never |

## 3. Exactly what leaves the machine

There are **three** possible outbound destinations. Nothing else is contacted.

### 3.1 Update check — automatic, disableable

| Property | Detail |
| --- | --- |
| **Destination** | `https://api.github.com/repos/ArasaniRohithReddy/app-releases/releases` (falls back to the public `releases.atom` feed on `github.com` if the API is rate-limited) |
| **When** | Once at application start, and when you click **Check for updates** |
| **Sent** | An unauthenticated HTTPS `GET` with a static `User-Agent`. **No account identifier, no machine identifier, no model data, no usage data.** |
| **Purpose** | Compare the latest published version against the running version |
| **To disable** | Turn off the update check in the app, or deploy `%APPDATA%\ThreatModelReviewer\update.json` containing `{ "Enabled": false }` — see [Enterprise deployment](ENTERPRISE-DEPLOYMENT.md#controlling-updates) |

### 3.2 GitHub Copilot — only when you invoke an AI feature

| Property | Detail |
| --- | --- |
| **Destination** | GitHub Copilot, through the bundled GitHub Copilot CLI runtime, authenticated as **your** signed-in seat |
| **When** | Only on an explicit action: *Explain*, *Deep analysis*, *Critique*, *Framework-gap analysis*, *Draft fix*, *Prioritize interactions* |
| **Sent** | The finding text (check id, title, message), a **redacted** structural summary of the data-flow diagram (element and flow names, kinds, trust boundaries), and the relevant framework references |
| **Not sent** | The `.tm7`/`.json` file itself, file paths, file contents outside the summarized structure, or any credential material |
| **Processing terms** | Your organization's existing GitHub Copilot agreement governs the request. Prompts are metered against your premium-request quota. |
| **To disable** | Do not sign in to Copilot, or simply do not use the AI buttons. The deterministic review is unaffected. |

### 3.3 OpenAI-compatible provider — optional, opt-in, self-configured

If you prefer to keep inference inside your own boundary, the provider seam accepts any
OpenAI-compatible endpoint — **Azure OpenAI**, a private gateway, or a locally hosted model.

| Property | Detail |
| --- | --- |
| **Destination** | The base URL **you** enter. There is no default and no vendor endpoint. |
| **Credential** | Stored locally and DPAPI-encrypted; sent only to your endpoint as a bearer token. |
| **Use case** | Regulated environments that require inference to remain in-tenant or on-premises. |

## 4. Secret redaction before any prompt

Threat models frequently contain accidental secrets (a connection string pasted into a mitigation
note, a token in a description). Before **any** text is sent to a model, the deterministic
`PromptSafety` pass replaces high-confidence secret material with typed placeholders:

| Detected | Examples |
| --- | --- |
| Private keys | `-----BEGIN … PRIVATE KEY-----` |
| Tokens | JWTs, GitHub tokens (`ghp_`/`gho_`/`ghu_`/`ghs_`/`ghr_`), AWS access keys (`AKIA…`), `Bearer …` |
| Connection secrets | `password=`, `AccountKey=`, `SharedAccessKey=`, `client_secret=`, `api_key=` |
| Personal data | Email addresses |

The same module also **detects prompt-injection content embedded in the threat model itself**
(for example a description containing *"ignore previous instructions"*), so untrusted model
content cannot hijack an AI request, and surfaces secrets found in the model as findings so you
can remove them at the source.

Redaction is deterministic, offline and applied regardless of which provider is configured.

## 5. Storage, retention and removal

| Path | Contents | Retention |
| --- | --- | --- |
| `%APPDATA%\ThreatModelReviewer\update.json` | Update preference, skipped version | Until changed or deleted |
| `%APPDATA%\ThreatModelReviewer\` (provider settings, token store) | AI provider configuration, DPAPI-encrypted credentials | Until you sign out or delete the file |
| `%LOCALAPPDATA%\ThreatModelReviewer\history\` | Local activity history — see [§5.1](#51-local-activity-history) | Your configured retention window (180 days by default) |
| `%LOCALAPPDATA%` update cache | Downloaded installer for an in-app update | Replaced on next update; safe to delete |

The application maintains **no** central database, no server-side account, and no cloud state.
To remove all data: uninstall, then delete `%APPDATA%\ThreatModelReviewer\` and
`%LOCALAPPDATA%\ThreatModelReviewer\`.

### 5.1 Local activity history

The application can keep a private record of **your own activity** so you can answer questions like
*"is this threat model actually getting better?"*. This is a personal audit trail, not telemetry: it
is written to your disk, read only by the app on your machine, and **never transmitted anywhere**.
There is no endpoint that receives it and no code path that sends it.

**Where it lives.** `%LOCALAPPDATA%\ThreatModelReviewer\history\`:

| File | Contents |
| --- | --- |
| `history-YYYY-MM.NNN.jsonl` | The records themselves — newline-delimited JSON, one record per line, one file per calendar month, rolled to the next sequence number at 4 MB |
| `settings.json` | Your history preferences (below) |
| `salt.txt` | A random 32-byte salt generated once on this machine, used to hash model identities. Never leaves the machine, so a hash here cannot be matched against anyone else's history |

There is no database and no additional dependency — plain text files you can read, diff or delete
yourself. A total cap (32 MB by default) and the retention window keep the folder bounded.

**What a record contains.** Every record carries a schema version, a UTC ISO-8601 timestamp, a
session id, and one typed payload:

| Record | What is stored |
| --- | --- |
| `SessionStarted` / `SessionEnded` | App version, session duration |
| `ModelOpened` | File **name** (not the folder), a salted model identity hash, a salted content hash, the model's own name, format, and the element / flow / boundary / threat counts |
| `ReviewCompleted` | Score, grade, verdict, band, rubric version, per-severity counts, gating and total finding counts, review duration, and the **check ids** that fired with counts |
| `ExportPerformed` | The format only (`pdf`, `html`, `sarif`, …) — not the destination |
| `AiActionPerformed` | Which action ran, the AI model id, duration, success, and a short failure classification |
| `FixApplied` | The rubric check ids addressed and how many edits landed |
| `PolicyApplied` | Policy name, policy hash, suppression and override counts |

**What a record can never contain.** The following are absent *by construction* — the record types
have no field capable of holding them, so there is no setting or bug that can turn them on:

- The contents of a threat model — no element names, descriptions, mitigations or properties.
- Any AI **prompt** or any AI **response**. `AiActionPerformed` has exactly five fields:
  action, model id, duration, success, error kind.
- Finding text — only the check id (e.g. `F5`), which is a fixed rubric identifier.
- Credentials, tokens or provider keys.

Every free-text field is additionally length-capped (an AI action to 64 characters, a model id to
128, a file name to 260), so no record can grow to hold smuggled prose, and control characters are
stripped so a value can never break the one-record-per-line format.

**Your controls.** All four live in the app's **History → Privacy** tab and in
`%LOCALAPPDATA%\ThreatModelReviewer\history\settings.json`:

| Setting | Default | Effect |
| --- | --- | --- |
| `Enabled` | `true` | The kill switch. With it off the store writes **nothing at all** — no records, no folder, not even the salt. |
| `RetentionDays` | `180` | Period files that fall entirely outside the window are deleted, and reads exclude anything older, so nothing beyond the window is surfaced. |
| `StoreFilePaths` | **`false`** | Off by default. With it off the *directory* your threat models live in is never written — only the file name plus a salted hash, which is enough for trends without recording where the file is. |
| `StoreModelNames` | `true` | Turn off for a hash-only history: trends still work, but nothing human-readable is kept. |

These settings are enforced by the store itself, not by each call site: every record passes through
a redaction pass on its way to disk, so a caller that supplies a full path still cannot get that
path written when you have said no.

Two further operations put you in control of the data:

- **Export my history** writes everything retained, plus the settings that produced it, as indented
  JSON to a file you choose — so you can inspect exactly what is held.
- **Clear all history** deletes every record *and* the salt, so identities recorded before the
  clear cannot be correlated with anything recorded after it.

**Deployment note.** To disable history fleet-wide, deploy
`%LOCALAPPDATA%\ThreatModelReviewer\history\settings.json` containing `{ "Enabled": false }`.

## 6. Compliance notes

- **Data residency.** Because analysis is local, threat models never cross a regional boundary
  through this product. If you use Copilot features, residency is governed by your existing
  Copilot agreement; if that is unacceptable, use the OpenAI-compatible provider pointed at an
  in-region endpoint, or don't enable AI at all.
- **Personal data.** The product is not designed to process personal data. Any personal data is
  incidental (for example an author's name inside a model) and remains local; email addresses are
  redacted before any prompt. The local activity history can incidentally hold a file name you chose
  (e.g. `jane-smith-review.tm7`); turn off `StoreModelNames` for a hash-only history, or turn history
  off entirely.
- **Air-gapped use.** Fully supported. Deploy the portable ZIP or MSI, disable the update check,
  and do not sign in to Copilot — every deterministic capability continues to work.
- **Auditability.** The verdict, score and findings are reproducible: the same input file always
  yields the same output, which is what makes the results defensible in an audit.

## 7. Verifying these claims yourself

You do not have to take this document on trust:

1. **Watch the network.** Run the app behind a proxy or with Fiddler/Wireshark, review a model end
   to end, and confirm the only request is the release check (and nothing at all once updates are
   disabled).
2. **Run it offline.** Disconnect the machine and review a model — the verdict, score, findings
   and reports are unchanged.
3. **Check determinism.** Review the same model twice, with and without AI enrichment: the
   verdict and score are identical.
4. **Inspect the packages.** The full dependency set is listed in
   [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) — there is no analytics or telemetry package
   among them.
5. **Read your own history.** The files under `%LOCALAPPDATA%\ThreatModelReviewer\history\` are
   plain newline-delimited JSON. Open one in any editor and confirm for yourself that it holds
   counts, scores and hashes — no model content, no prompts and no responses — and that the folder
   never appears in any outbound request.

---

**Questions or an issue with anything stated here?** Please
[open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose), or report
security concerns privately as described in [SECURITY.md](../SECURITY.md).
