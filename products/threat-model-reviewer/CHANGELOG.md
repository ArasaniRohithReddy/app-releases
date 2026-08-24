# Changelog

All notable changes to **Threat Model Reviewer** are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and the
project aims to follow [Semantic Versioning](https://semver.org/).

## [2.1.4] — 2026-08-24

Dark mode finished properly, keyboard shortcuts, and a history you can act on.

### Added
- **Keyboard shortcuts** — 16 accelerators for opening, closing, exporting, critiquing and moving
  between tabs, plus **Ctrl + mouse wheel** to zoom the diagram. **Help → Keyboard shortcuts** (F1)
  lists them; the list is checked against the window's real bindings in both directions.
- **Reopen from History.** A row can now be opened again. File paths are not stored by default, so
  the app usually asks where the file is — and then uses the recorded content hash to tell you
  whether it is the same revision that was reviewed.
- **"What you did" in History** — opens, exports, fixes applied and Copilot actions per model.

### Fixed
- **Dark mode reached only part of the app.** The guard added in 2.1.3 checked a single file, so 84
  hard-coded colours survived across the dialogs and the diagram; the whole Diagram tab stayed light
  inside a dark window. Every view is now covered.
- **The diagram is a document, not chrome.** Theming its shapes made every node a dark block with
  unreadable text. The canvas is now a light sheet inside a dark frame, with its colours pinned.
- **Icons that looked broken.** The Threat Modeling Tool substitutes an 18×18 generic outline for
  elements left as a plain External Interactor or Data Store, which reads as a missing image when
  scaled. Those, and the legacy 16×16 glyphs, now fall back to our own name-derived icons — a chart
  for Power BI datasets, a file box for SharePoint. Real product artwork is unchanged.
- **"Threats by interaction" and "Framework coverage" were unusable on a wide monitor.** Both had an
  unbounded column, so the name sat at one edge and the numbers at the other. Both are now capped.
- **Element names containing line breaks** turned a single interaction into three ragged lines.
- **F1 did nothing** — WPF's built-in help command claims it before window bindings see it.

### Internal
- Export, fix and Copilot events were recordable but never recorded; Copilot events could not even be
  attributed to a model. Both are now wired, so history describes work rather than just file opens.

## [2.1.3] — 2026-08-24

Appearance and reach: the app can now be themed, questions can be asked without leaving
the tab you're on, and comparing two revisions is legible.

### Added
- **Light, Dark and Match Windows themes** (Help → Appearance). The choice is remembered,
  applies immediately without a restart, and System follows Windows as it changes.
- **A floating Ask panel.** A launcher in the bottom-left opens a compact chat over any tab,
  so a question no longer costs you your place. It is the same conversation as the Ask tab:
  maximising hands the history over rather than starting again.
- **"Use open model" on both Compare fields**, plus a swap button. Comparing the open model
  against an older revision is as common as the reverse, and only the baseline supported it.

### Changed
- The Compare tab leads with the verdict and separates what got worse from what got better,
  instead of stacking dense lists of long strings.
- Overview statistics sit on an even four-column grid; eight tiles previously broke 5 + 3 and
  left a gap.

### Fixed
- Interactions without a name printed their endpoints twice in "Threats by interaction".
- Closing a model now dismisses the floating Ask panel, which otherwise stayed open over the
  empty state with nothing left to answer about.

### Internal
- Every colour in the app now resolves through a semantic token — 114 hard-coded values in the
  main window, 26 white backgrounds across the dialogs, and 43 literals chosen in view models.
  Guards were added for each way this fails quietly: the two palettes must define the same
  tokens and differ on the core surfaces, no themed brush may be bound with `StaticResource`
  (which resolves once and then ignores a theme change), and no colour may be hard-coded.
  The diagram is exempt by design: it renders a document, not app chrome.

## [2.1.2] — 2026-08-23

Fixes found by driving the app before shipping rather than trusting a green test suite.

### Fixed

- **The History tab was empty even after a review.** Two separate faults. The recorder was never
  called — the store, query layer, privacy controls and tab were all complete and all tested, and
  nothing invoked them, so the feature did nothing while every test passed. And once recording
  worked, the tab still showed nothing until you noticed the **Refresh** button. Reviewing a model
  now records it, and opening the tab loads it.
- **The assistant showed its own Markdown.** Answers are written in Markdown and were bound straight
  to text, so readers saw `**NOT READY**` and literal dashes — the most important line in an answer
  was the hardest to read. It now uses the renderer the app already had.
- **The test suite wrote into the real history store.** Wiring the recorder into model loading meant
  any test that opened a model recorded a review, filling a developer's History tab with fixtures.
  The history root now honours `THREATMODELREVIEWER_HISTORY_ROOT`, which the tests redirect to a
  temp folder — and which administrators can use to move history off a roaming profile.
- **Compare's Explain and Export buttons looked broken.** They are correctly disabled until a
  comparison exists, but said nothing; they now explain themselves while disabled. The path boxes
  also accept a dropped `.tm7`.
- **A documented claim was untrue.** The docs said `generate` produces a NOT READY model "by
  construction". It does not: a generated model reports READY WITH NOTES with zero gating findings,
  because the rubric counts *Needs Investigation* as triaged. The docs now describe what actually
  happens, and why a generated model still is not a reviewed one.
- **The framework coverage matrix was labelled "OWASP Top 10 (2021)"** while listing the 2025
  categories updated in 2.1.1.

### Added

- **Feature wiring tests.** The History bug could not be caught by unit tests — every part passed in
  isolation; the gap was between the code existing and the code running. These assert that each
  capability is reachable from a surface a user can drive: every Core engine referenced by the app or
  CLI, every advertised tab present and not collapsed, every CLI verb dispatchable, the recorder
  actually invoked, and the assistant rendering Markdown. They cannot prove a feature is correct,
  only that it is not orphaned.

### Notes
- The **verdict** and **0–100 review score** remain 100% deterministic; Copilot stays advisory.
- 1231 automated tests.

## [2.1.1] — 2026-08-23

A follow-up to 2.1.0 fixing three things that stopped users seeing any of it, plus a
correction to the standards the rubric cites.

### Fixed

- **In-app update could produce an unusable installer.** Downloads were only size-checked when
  a length was known. On the release-atom fallback — taken whenever the anonymous GitHub API is
  rate-limited at 60 requests an hour — every asset size is reported as `0`, so if the server also
  omitted `Content-Length` nothing was verified at all. A truncated transfer or an error page was
  moved into place and handed to `msiexec`, which reported *"This installation package could not be
  opened"* — an error that says nothing about the download. Every download is now format-checked
  before it runs (an MSI must start with the OLE compound-file signature, a zip with `PK`, an
  executable with `MZ`) and the failure names the real cause. The published 2.1.0 MSI was never
  faulty; only the download path was.
- **The header could collapse and hide the tab strip.** The identity block sat in a star-width
  column beside a content-sized command cluster. Adding the Close button in 2.1.0 tipped it over:
  the cluster claimed the row, the star column collapsed to a few pixels, and the title wrapped one
  character per line down the left edge, pushing the tabs off screen. Rebuilt as a single compact
  strip — roughly 50px — in which nothing can wrap; the open model's name trims with an ellipsis.
- **The verdict was printed twice.** The CI band is FAIL precisely when the verdict is NOT READY,
  so showing them as separate chips read as two independent failures, and previously put a green
  grade pill beside a red FAIL. They are now one chip.
- **Markdown was rejected as "not a diagram".** `.md` is registered as a diagram extension because
  markdown can embed Mermaid, so plain prose never reached the document reader. Shared extensions
  now fall back correctly, and markdown containing a diagram is still read as one.

### Changed

- **Compare, Ask and History are now in the app, not just the CLI.** 2.1.0 shipped these engines
  with no way to reach them outside a terminal.
  - **Compare** — pick two revisions (or use the model you already have open as the baseline) and see
    what changed, what got worse, and what got better, with the score and verdict movement. *Explain
    with Copilot* adds a plain-English read of the change; the numbers are computed before Copilot is
    asked and never change. Exports to HTML, Markdown or CSV.
  - **Ask** — an assistant scoped to the open threat model. Common questions are answered straight
    from the model's own numbers with **no AI call at all**, so no answer can contradict the review;
    each reply says which of the two it was. Open-ended questions go to Copilot grounded in the same
    facts, with the supporting check ids cited.
  - **History** — every review you run, recorded locally, with score trends per model. The tab states
    where the data lives and can open that folder, because "it never leaves your machine" is a claim
    you should be able to verify rather than take on trust. One click clears it.
- **Create and Assistant are no longer hidden.** Both were fully implemented behind
  `Visibility="Collapsed"`, and with 2.1.0 shipping a round-trip-verified `.tm7` writer there is no
  longer a reason to keep model authoring out of the product. Create offers templates, Copilot
  refinement, a live diagram preview, components, flows and boundaries; Assistant extracts a DFD
  from a document, an architecture image, or an OpenAPI spec.
- **The app and the CLI now run the same generation engine.** The Create tab used the original
  generator while `generate` used the deterministic pipeline. Two implementations of one feature
  drift, and a user comparing them would rightly lose confidence in both. Create now reports how
  many threats it produced and states that each is recorded as *Needs Investigation*, so its output
  is not mistaken for a finished review.
- **Rubric citations updated to OWASP Top 10:2025**, published 6 November 2025. The edition
  re-ranked categories rather than just renaming them, so all 43 references were mapped by concept:
  Cryptographic Failures moved A02→A04, Injection A03→A05, Insecure Design A04→A06, Security
  Misconfiguration A05→A02, and Vulnerable & Outdated Components (A06) became Software Supply Chain
  Failures (A03). SSRF is no longer its own category — OWASP folded it into A01 — and A10 is now
  Mishandling of Exceptional Conditions. **No score changes:** the coverage matrix feeds reports and
  the assistant, never the engine, and both sample models score exactly as before.
- Release builds now upload their artifacts before publishing, so a missing or expired publishing
  token costs a manual publish rather than a repeated build.

### Notes
- The **verdict** and **0–100 review score** remain 100% deterministic; Copilot stays advisory.
- 1200 automated tests (up from 418 at the start of the 2.1 cycle).

## [2.1.0] — 2026-08-23

This release is mostly **new engine capability, reachable from the CLI**. The desktop UI for these
features lands next; everything below is available today via `ThreatModelReviewer.Cli`.

The **verdict** and **0–100 review score** remain 100% deterministic. Copilot stays advisory, and
several of the additions below exist specifically to keep it that way — the assistant answers from
computed facts rather than inference, and generation lets a language model touch prose only, never
structure.

### Added

- **`compare` — what changed between two revisions.** Matches elements, flows, boundaries and threats
  by stable identity rather than list position, so a rename is reported as a rename instead of a
  delete plus an add. Reports rubric deltas including pass→fail transitions, threat state changes,
  and a posture summary that makes regressions impossible to miss. Exits `2` on a serious regression
  so CI can block on it.
- **`generate` — build a `.tm7` from a described system.** Deterministic STRIDE enumeration keyed on
  element kinds, boundary crossings and flow properties. Every generated threat is recorded as
  *Needs Investigation*: this is an enumerated starting point, not a completed review, and the output
  says so. Generating twice from one spec produces byte-identical output.
- **`ingest` — read what teams already have.** Documents (Word, PowerPoint, Excel, PDF, CSV, Markdown,
  JSON, YAML), diagrams (Excalidraw, draw.io including its compressed form, Mermaid, Visio, Graphviz),
  and infrastructure as code (ARM, Bicep, Terraform). Diagrams are mapped to data-flow-diagram
  candidates; anything the mapper cannot classify confidently is flagged for a human rather than
  guessed at. Infrastructure ingestion extracts deterministic **security facts** — TLS enforcement,
  public network access, identity type, key-vault protection, firewall rules — each with a file and
  line citation, and exits `2` when it finds insecure configuration.
- **`sdl` — the artifacts a reviewer actually asks for.** A full threat model document (Markdown and
  HTML), the threat register (CSV and JSON), an assumptions and out-of-scope log, a traceability
  matrix, and a manifest recording tool version, rubric version and the source model's identity and
  hash, so a reviewer can verify every file and reproduce the deterministic content.
- **`ask` — answers with no AI and no network.** Common questions (score, verdict, unmitigated counts,
  which flows cross a boundary, why a model is not ready) are answered exactly from a computed fact
  sheet, with the supporting check ids cited. Questions needing judgement are declined rather than
  guessed at.
- **`policy` — organisation policy, with disclosure that cannot be switched off.** Validate a policy,
  list the check ids one may reference, or apply one to a review. Waivers require a reason, an owner
  and an expiry; an expired waiver stops applying and becomes a finding of its own. Applying a policy
  always prints the unpoliced result beside the policed one, plus every suppression and the policy's
  hash — a policy can tune the rubric, but it can never quietly hide a failure. Ships `default`,
  `strict` and a worked `enterprise-exceptions` preset.
- **`history` — local review history and score trends.** Append-only, on this machine only, never
  transmitted. File paths are hashed rather than stored by default, and AI prompts and responses are
  never recorded.
- **Model Context Protocol support**, shipped disabled. Every server must be enabled individually and
  carries a plain-English disclosure of what it can see; secrets are held in the existing DPAPI-backed
  store rather than written into configuration.
- **Close the open threat model** (Ctrl+W), with an unsaved-changes guard and a full reset of document
  state. Previously a model could only be replaced, never closed.
- **Microsoft Threat Modeling Tool stencil artwork in the diagram view**, extracted at run time from
  the user's own MTMT installation. The artwork is Microsoft's and is deliberately never redistributed
  with this app.
- **File attachments in the Edit with Copilot panel**, so an architecture diagram or document can be
  handed over directly instead of described in prose. Vision-only content is gated on the selected
  model actually supporting vision.

### Changed

- **GitHub Copilot SDK 1.0.2 → 1.0.11**, which moves the bundled Copilot runtime to CLI 1.0.79.
  Verified with a live probe, not just a clean compile. Note that the available model list is served
  by the GitHub API and is *not* gated by the SDK version — both runtimes return the same models.
- **Fluent 2 design foundation**, with the whole app re-skinned onto shared design tokens.
- Test host updated to Microsoft.NET.Test.Sdk 18.9.0 and coverlet.collector 10.0.1.

### Fixed

- **A shipping WCAG contrast failure.** The score and band chips used colours that failed AA against
  their own background (2.78:1 and 4.29:1). All three states now pass (5.64:1, 4.55:1, 6.40:1).
- **An unreadable model dropdown**, which rendered the raw record text
  (`AiModel { Id = …, SupportsVision = True }`) inside a 190px control.
- **A gap in the archive guard.** A crafted Office file whose central directory under-reported an
  entry's size passed inspection and then silently truncated content. Such a mismatch is now detected
  and rejected.
- **Ingestion of shared file extensions.** `.md` is also a diagram extension, because markdown can
  embed a Mermaid block, so plain markdown was being rejected as "not a diagram". Shared extensions
  now fall back to document extraction.
- **A load-sensitive test** that waited a fixed interval for an asynchronous progress callback and
  failed on a busy machine.
- Documentation corrected on the relationship between the score, the verdict and the CI band: the
  **FAIL** band and the **NOT READY** verdict are the same outcome, not two independent ones.

## [2.0.3] — 2026-08-09

### Changed
- **Product copy now matches the shipped feature set.** The header subtitle, About dialog, package
  description and docs previously said the app also *creates* threat models, but model **creation is in
  beta and hidden in the current build**. Everywhere now reads "review, fix & analyze", and the Create
  capability (guided wizard + Copilot DFD extraction from a description, image or OpenAPI spec) is clearly
  labelled **beta / coming soon**. No functional change — the Create and Assistant tabs were already hidden.
  The `create` and `openapi` commands remain available in the CLI.

### Added
- **Enterprise-grade documentation set**, for security review and managed rollout:
  - **Data handling & privacy** — every network destination and on-disk path, the secret redaction
    applied before any AI prompt, and confirmation that no telemetry or analytics are collected.
  - **Enterprise deployment** — silent-install switches, MSI `UpgradeCode` / Inno `AppId` for detection
    rules, Intune / Configuration Manager / Group Policy guidance, disabling update checks fleet-wide,
    air-gapped operation, VDI notes, and CI/CD gating with the CLI.
  - **Third-party notices** — full component inventory with licenses.
  - **Support policy** — severity definitions and response targets.
  - **Code of conduct**, `CODEOWNERS` and Dependabot configuration.
- **Security policy expanded** with vulnerability-response targets, a supported-versions table, and the
  controls protecting the tool itself (untrusted-file parsing, prompt-injection detection, DPAPI
  credential storage, export formula-injection neutralization, supply chain).

### Notes
- The **verdict** and **0–100 review score** remain 100% deterministic; Copilot stays advisory.

## [2.0.2] — 2026-08-09

### Changed
- **Canonical project home is now `ArasaniRohithReddy`.** Following the repository transfer, every link
  and identifier the app carries now points to the new owner: the **in-app update check**, the **About**
  dialog and **Help** menu links (releases, install & user guide, FAQ, issues, security, license), the
  SARIF report's `informationUri`, and the installer/package **publisher**, URLs, and **code-signing
  identity** (`CN=ArasaniRohithReddy`). The old `Rohithreddy7123` URLs still resolve via GitHub's
  automatic redirect, but the app no longer relies on it — existing installs are offered this update
  through that redirect and are canonical afterwards.

### Notes
- **No change to behavior, the verdict, or the 0–100 review score** — this is an identity/branding
  release. The score and verdict remain 100% deterministic; Copilot stays advisory only.
- The MSIX package identity changed with the publisher, so an existing **MSIX** install updates
  side-by-side; **MSI**, **Setup.exe**, and **portable** users update normally (in-app from v1.0.4+).

## [2.0.1] — 2026-07-27

### Changed
- **Diagram edits no longer freeze the UI on large models.** Adding, renaming, deleting, or connecting
  elements — and the **Save changes** / **Reset** diagram commands — now run the re-parse and re-review on a
  background thread, so the app stays responsive on big threat models.

### Fixed
- **CLI:** a dangling or unknown option (e.g. a trailing `--model` with no value) now reports a clear error
  and exits with code 1 instead of being mistaken for the input file path; an invalid `--issues-format` is
  rejected with the list of valid choices.

### Security
- The in-app device-flow GitHub token is now passed directly to the Copilot SDK instead of being set as a
  process-wide environment variable, so it can no longer be inherited by other processes the app launches
  (browser, `cmd`, the Threat Modeling Tool).

## [2.0.0] — 2026-07-26

The 2.0 line opens with a correctness release: models you fix in the app now reliably
reopen in the Microsoft Threat Modeling Tool, Copilot's advisory text renders properly,
and a whole-app audit (run with Claude Opus 4.8 + Opus 5) hardened every write path.

### Fixed
- **App-fixed `.tm7` files now open in the Microsoft Threat Modeling Tool.** Two defects made
  TMT reject a saved model as *"could not be deserialized / may be corrupted"*: the threat
  `State` was written as `"Needs Investigation"` (TMT's `ThreatState` enum only accepts
  `NeedsInvestigation`), and whole-model threats wrote empty `Guid` fields. Both are fixed and
  verified against TMT's own serializer.
- **Fixed a TMT dashboard crash** (*"an item with the same key has already been added"*). TMT
  identifies a threat by `TypeId + Source + Flow + Target`; several distinct threats added to one
  element/category (e.g. OWASP-LLM risks) now get distinct TypeIds so they never collide.
- **The `--baseline` Create path no longer produces corrupt files** (an XML declaration/encoding
  mismatch); carried KnowledgeBase and multi-line names are preserved byte-for-byte.
- **Copilot output now renders as formatted text** — the critique, per-finding guidance, and
  mitigation plan show real **bold**, *italic*, `code`, and bullet lists instead of literal
  Markdown symbols.

### Changed
- **Whole-app correctness audit.** Hardened AI-response handling (malformed/partial JSON no longer
  crashes; AI failures never abort the deterministic report or verdict), fixed a triage-state parser
  that could mark open threats as mitigated, made model parsing/diff/critique robust to duplicate or
  blank element ids, stopped a portable-update helper from hanging invisibly, neutralized CSV
  formula-injection in exports, and ensured the bundled Copilot runtime is never orphaned on exit.
- Newly added diagram elements now default **in scope** (a cloned template could previously make them
  out-of-scope and change the deterministic result).

### Notes
- **Verdict and 0–100 review score remain 100% deterministic.** Copilot is advisory only.
- Known follow-ups: diagram-edit responsiveness on very large models, and published update-asset
  checksums, are planned for a later 2.x release.

## [1.0.11] — 2026-07-03

### Added
- **"Deep analysis for all" button** on the Findings tab, beside "Explain all with Copilot". It runs
  the full deep analysis (DREAD, mitigation plan, attack tree, and verification tests) for **every**
  finding at once, stored per-finding and reusable in exports. Because each finding is several
  premium requests, it asks for confirmation (showing the estimated cost) first. Advisory only — the
  verdict stays deterministic.

### Changed
- **Consistent button styling & sizing across the app.** Buttons now use one of three deliberate
  tiers (default / compact / inline) instead of ad-hoc per-button sizes: the coverage-panel buttons
  match the standard text size; the Diagram, Create, and chat action buttons share one compact size;
  and the AI-provider and review-options dialogs now use the app's shared button styles (rounded
  chrome, hover/focus states) rather than raw system buttons.

## [1.0.10] — 2026-07-03

### Fixed
- **Literal `\u2026` / `\u2014` shown in the UI.** A few labels/tooltips had C#-style Unicode escapes
  embedded in XAML (where they aren't interpreted), so an ellipsis appeared as the raw text
  `\u2026` (e.g. on the **Analyze gaps with Copilot** and **Prioritize with Copilot** buttons) and an
  em-dash as `\u2014` (a couple of tooltips and the diagram-assistant title). All are now rendered as
  proper `…` and `—`.

## [1.0.9] — 2026-07-03

### Fixed
- **"Check for updates" could wrongly say "You're on the latest version" when it actually failed.**
  GitHub's unauthenticated API has a 60-requests/hour limit; when it was hit (HTTP 403), the check
  treated the failure as "up to date." Now:
  - it **falls back to the `releases.atom` feed** (served from github.com, **not** subject to that
    API rate limit) so the check keeps working — reconstructing the download links from the release
    tag; and
  - if it genuinely **can't reach GitHub**, it says so ("Couldn't reach GitHub… try again later")
    instead of claiming you're up to date.

## [1.0.8] — 2026-07-03

### Added
- **Sign in to GitHub Copilot from inside the app — no external CLI required.** If you're not
  already signed in, the **Sign in to Copilot** button now opens an in-app dialog that runs GitHub's
  **OAuth device flow** (the same flow and client the GitHub Copilot CLI uses): it shows a one-time
  code, you approve it in your browser, and the app connects and lists your models. The token is
  stored DPAPI-encrypted per-user.

### Changed
- **Copilot authentication is now layered (best UX first):** the app uses your **existing GitHub
  Copilot CLI / `gh` sign-in** automatically when present, and only offers the in-app device-flow
  sign-in if you're not already signed in. Either way, the deterministic review needs no sign-in.

## [1.0.7] — 2026-07-03

### Added
- **In-app "Sign in to GitHub Copilot".** When the AI features aren't available because you're not
  signed in, the header now says so clearly and shows a **Sign in to Copilot** button that runs the
  bundled GitHub Copilot CLI's sign-in (browser / device-code) — then reconnects and lists your
  models automatically. No token to paste.

### Changed
- Clearer prerequisites everywhere: the AI features need an **active GitHub Copilot subscription**
  and being signed in (via the in-app button, `gh auth login`, or a `COPILOT_GITHUB_TOKEN` /
  `GH_TOKEN` / `GITHUB_TOKEN` fine-grained PAT with the "Copilot Requests" permission). Documented in
  the README, install guide, user guide, and FAQ. The deterministic review still needs none of this.

## [1.0.6] — 2026-07-03

### Added
- **Choose the fix source for *all* fixes at once.** The Fix tab now has a **"Use for all:
  Built-in / Copilot"** control that switches every fix to the deterministic built-in content or to
  the Copilot draft in one click — alongside the existing **"Draft with Copilot"** button
  (generates the drafts) and the **per-row** Built-in / Copilot radios (individual override). So you
  can pick the source globally or per fix.

## [1.0.5] — 2026-07-03

### Fixed
- **"Analyze gaps with Copilot" and "Prioritize with Copilot" buttons stayed greyed out** on the
  Overview tab even after a model was loaded. Their enable-state wasn't being re-evaluated when the
  review completed (a missing change-notification), so they were stuck disabled. Both now enable as
  soon as a `.tm7` is reviewed, exactly like the other Copilot buttons. (These are independent,
  advisory actions — using "Draft with Copilot" in the Fix tab never disabled them.)

## [1.0.4] — 2026-06-28

### Changed
- **In-app updates** — clicking **Download** on the update banner now downloads the new build
  *inside the app*, with a progress bar, instead of opening a browser. It automatically picks the
  installer that matches how you installed (MSI, Inno `-setup.exe`, portable `.zip`, or MSIX),
  then offers **Install &amp; restart**: the app closes, updates in place, and reopens on the new
  version. A **What's new** link still opens the full release notes in the browser, and the
  browser download remains as a fallback when no matching installer is found.

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

[2.1.4]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.1.4
[2.1.3]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.1.3
[2.1.2]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.1.2
[2.1.1]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.1.1
[2.1.0]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.1.0
[2.0.3]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.0.3
[2.0.2]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.0.2
[2.0.1]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.0.1
[2.0.0]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v2.0.0
[1.0.11]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.11
[1.0.10]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.10
[1.0.9]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.9
[1.0.8]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.8
[1.0.7]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.7
[1.0.6]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.6
[1.0.5]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.5
[1.0.4]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.4
[1.0.3]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.3
[1.0.2]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.2
[1.0.1]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.1
[1.0.0]: https://github.com/ArasaniRohithReddy/app-releases/releases/tag/threat-model-reviewer-v1.0.0
