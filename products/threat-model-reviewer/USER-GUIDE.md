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

## Try the sample model

Download the [synthetic customer-portal model](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/samples/customer-portal.tm7)
and open it using **Open .tm7**. No Copilot sign-in is needed. With the default rubric,
expect **NOT READY**, **65/100**, and **27 gating findings**: its threats are still
*Not Started*.

Open **Findings** to see the `C1` findings, then **Fix > Generate fix plan** to preview
the proposed triage. Save to a **new file** if you apply changes. A move to
*Needs Investigation* is an acknowledgement to investigate, not an implemented
mitigation. Compare the revisions to see model progress, then assign and verify
the actual security work.

The sample is intentionally incomplete. Its score and gate are not a certification,
and clearing the gate does not mean every threat has been resolved.

## Open a model

- Click **Open .tm7** in the header, or
- Launch the app with a path (`ThreatModelReviewer.exe "C:\path\Model.tm7"`), or "Open with".

When opens overlap, only the latest open can install its review,
change navigation, or start the optional AI pass selected for that open. A delayed success
or failure from an earlier open does not replace the latest model or its loading/error state.

### Unsaved changes and separate windows

Open (including History and file drop), Close model, generated-model
replacement and window exit ask whether to **Save**, **Don't save**, or **Cancel** when
the current diagram has unsaved changes. Save must succeed before replacement or exit;
a cancelled, failed or obsolete save keeps the current review and its unsaved state.
Only `.tm7` diagram changes can be saved back this way. For other formats, cancel or
explicitly choose to discard; do not interpret an unavailable Save as a completed save.

Decisions belong to the exact document and edits that were shown. A late confirmation
or save cannot discard edits made while it was pending. An original-file write already
started may finish, but it cannot replace newer in-memory work. A new Open can supersede
an old operation after any required discard confirmation; choosing Save again requires
the active save/refresh to finish first. Diagram pop-outs close when their model is
replaced so they cannot keep editing an obsolete document.

**New window** (`Ctrl + Shift + N`) starts a separate application window/process without
closing this model or copying its unsaved changes. Each window owns one active review;
Compare still compares saved revisions rather than editing two documents in one view.
The independent Create/Assistant draft survives Close model within its window, but is
not a persisted session: generate and retain its files before exiting the application.

The header shows one **verdict** — NOT READY or READY WITH NOTES — with the **review score**
as supporting detail. They answer different questions. The **score (0–100)** measures
*maturity*: how thoroughly the model is built. The **verdict** is a *gate*: any must-fix
(gating) finding forces NOT READY no matter how high the score, so a well-built model can
legitimately score 88/100 and still be NOT READY — "thorough work, but specific blockers".
The **band** (PASS / CONDITIONAL / FAIL) appears in exports and CI only; FAIL is simply the
machine-readable name for NOT READY. Toggle **Strict SDL bar** to make borderline SDL items
gating.

## The tabs

**Workspace layout increment — development source, not a new published build.**
The nine tabs and their shortcuts are unchanged. The compact layout uses normal-weight body text,
wrapping labels and the existing light/dark palette:

- **Create / Assistant:** the introduction scrolls with the form; Generate/Extract remain outside
  the editor, alongside extraction cancellation when running. Create's action columns share a
  content-sized width, and Assistant's text editor can grow before scrolling.
- **Overview:** section titles and optional AI actions occupy separate columns; STRIDE bars fit
  their column without covering counts. Verdict, score and provenance are unchanged.
- **Diagram:** **More ▾** groups **Full screen**, **Open in TMT** and **Reset to saved**. Save,
  editing, connection and zoom controls stay directly available.
- **Findings / Fix:** drag the divider between list and details, or Tab to it and use Left/Right.
  Rows can grow with text. **Totals and risk** and **Fix plan summary** disclose supporting detail
  without consuming a permanent row. Once a fix plan exists, Apply & Save is the primary action;
  generating another plan remains available and still replaces the current plan and selections.
- **Compare:** labelled, wrapping path fields expose long saved-file paths; browsing, dropping,
  swapping and snapshot export retain their existing behavior.
- **Ask:** the mode and composer stay outside the conversation scroll area; review/provider context
  and the mode explanation scroll with the conversation. The explanation is also available on the
  mode picker. Empty conversations start at the top. Both Ask surfaces still share one draft and
  Ctrl+Enter command.
- **History:** **What is kept and where** groups the privacy explanation, totals and storage path.
  An empty list explains the next steps without turning recording on.

At narrow logical widths, the duplicate in-client app title is omitted to make room for commands;
Sign in (when needed), Provider and Help remain available. Long lists and details still scroll.
These changes do not alter review rules, provider connections, edit confirmations or history consent.

### Overview
The review layout keeps readiness, score, evidence and optional guidance separate.

- **Readiness gate** — why the current review is gated, grouped by check. **Review gating
  findings** opens the Findings tab with its gating filter; **Open Fix tab** opens the plan workspace.
- **Maturity score** — the separate 0–100 score and four weighted dimensions
  (scope, coverage, response/hygiene, validation). A high score cannot cancel a gating finding.
  Neither the score nor READY WITH NOTES is Microsoft approval or proof that controls work.
- **Model facts**, **STRIDE coverage**, and **AI/LLM components** describe the model.
- **Threats by interaction** — every threat regrouped onto its data flow, worst-gap-first,
  with an independent **Prioritize interactions** action.
- **Framework coverage** — a deterministic scorecard (OWASP Top 10 2021 + STRIDE): which
  categories your threats address. Coverage status is written in text as well as colour.
  **Analyze gaps** requests optional suggestions.
- **Optional model critique** — uses the configured AI provider, like the prioritization and
  gap actions. Output identifies its producing provider; Offline output is labelled as a
  placeholder with no AI inference. These actions never change the deterministic verdict.

Opening/reloading/closing a model, changing the review options,
or starting a structural re-review invalidates optional guidance and the current fix plan.
Pending advisory requests are cancelled locally; late content, progress and errors from their
old review are discarded rather than displayed as current. A provider may already have received
the request, so local cancellation is not a promise to undo provider work or charges.

### Diagram
The DFD is deliberately a **light document sheet**, including in the dark app theme.
When matching artwork is available in the installed Microsoft Threat Modeling Tool,
the renderer uses it; otherwise it retains the vector fallback. This is not a claim
of native TMT visual or pixel parity.

The Diagram workspace has wrapping action rows, a viewport-aware **Fit** action,
10–600% zoom controls, and one side pane at a time so the document remains usable in
a compact window.

- **Edit diagram → Edit tools** exposes the selected element's full name, kind and
  stencil type. Select on the canvas or use the labelled element list. Long document
  labels are bounded rather than overflowing shapes; their full names remain in
  tooltips and accessibility names. Label rendering does not change model topology.
- **Keyboard:** Tab to an element or flow label. Enter selects an element; arrow
  keys move it one document unit and Shift+arrows move it ten. Flow-label arrows
  reposition the label; Enter or F2 starts a rename, Enter applies it, and Escape
  cancels it and returns focus to the canvas. **Add data flow** provides labelled
  source/target pickers as the keyboard alternative to drag-to-connect.
- Focus the canvas and use arrows/scrollbars to pan. Ctrl+plus/minus zooms,
  Ctrl+0 fits the available viewport, and Ctrl+Home restores 100%. The existing
  Ctrl+1…7 tab shortcuts are unchanged.
- **Save changes** writes positions and structural edits to the `.tm7` and
  re-reviews it. **Reset to saved** discards unsaved diagram edits. Closing a side
  pane does not discard edits or a proposal.

**Edit diagram → Copilot edits** separates the instruction, attachments, recovery
messages and proposed-change review from the always-reachable request/review actions.
Propose changes is replaced by Apply / Discard when a proposal is ready; discard
to revise the request. Example instructions are optional. The pane uses the existing
global provider, model and optional MCP settings; it does not create a separate
connection configuration. **Ask Copilot** is the advisory conversation, not the
proposal-application control.

Proposals require **human review**. Applying one changes the threat model only;
it does not patch application code, configure infrastructure or deploy mitigations.
Review every change and warning against the current model before applying. If the
model or edit request changes, pending Diagram AI work and prepared proposals are
cancelled/discarded with an explicit status. Request a new proposal for the current
model. This protection is a **separate source-only safety follow-up**, not a claim
that the earlier UI polish alone fixed model-revision safety.

Proposals are bound to the originating model, edit session, surface and existing
edit/reparse sequence. Apply works on a private copy and checks that context again
before publishing anything into the open model. Opening/reloading/closing a model,
resetting or saving the diagram, manual model edits, and changing the edit instruction
or attachments invalidate obsolete work. Model-bound Diagram chat history is also
discarded on replacement or structural changes, so old answers/citations do not
ground a new document's conversation. Late completion, failure or progress from an
obsolete request cannot replace a newer request's state.

Cancellation signals the provider and releases the local command; a provider that
ignores cancellation may still finish remotely. Its late result is discarded.
If a cancellation callback fails, the document transition still completes and a
generic callback-failure/discard notice is shown; old results remain ineligible.
These guards do not validate the proposal's architectural claims or implement
mitigations, and Save changes is still required to write accepted model edits.

**Image privacy:** a selected image may be sent to the configured provider when
you request a proposal. **Text redaction does not sanitize pixels.** Remove
sensitive content from images yourself before attaching them. Model summaries and
attached text may also be sent; remove secrets rather than relying on redaction.

### Findings
Search check, severity, title, target, message or references;
combine **Severity** and **Only gating** to narrow the list. The count shows visible versus total
findings. **Reset** clears filters without discarding column sorting. Column headers sort the view;
the virtualized rows stay compact for large reviews. Ellipses indicate abbreviated titles/targets,
not different findings.

Use Up/Down in the list to select a finding. **Selected finding details** shows the full target,
selectable message, built-in **what-it-means / how-to-fix** guidance, and **framework references**
(OWASP / MITRE / CWE / Microsoft Learn). The gate column explicitly distinguishes **Gating**
from **Advisory**; severity alone does not decide readiness.

Expand **Optional AI guidance and analysis** to explain the selected finding or run **Deep analysis**
(an advisory DREAD estimate, mitigation plan, attack tree and Gherkin tests). Each row retains its
own output, provider label and progress/error state. Built-in guidance remains separate; Offline
placeholders are not labelled as Copilot inference.

Changing the selected finding does not redirect work: guidance and analysis still belong to the
row that requested them. A failed row can be retried without discarding its built-in guidance.
AI-enriched exports stop if the originating review changes during the options, generation or
save-choice steps. An export does not treat an analysis that is still running as completed content;
wait and retry, or export without optional AI analysis.

**Review totals and risk**, **Explain all**, **Deep analysis for all**, and **Export ▾** use the
**full review, not the filtered list**. Export offers HTML / PDF / Markdown / CSV / JSON / SARIF
and work-item exports (GitHub / Azure DevOps / Jira), with an optional AI-content inclusion step.

### Fix
1. **Generate fix plan** creates built-in proposals for supported findings: missing threats,
   triage, justifications and out-of-scope reasons. Regenerating replaces the old plan and selections.
   No automatic fixes is not the same as no findings or a ready model.
2. Select a row to read the **exact selected fix content**. The preview is read-only, selectable
   and copyable. Selecting a row and including it for saving are separate actions: use its **Apply**
   checkbox, or **Include this fix when saving** in the detail pane.
3. **Draft all with AI** or **Draft this fix with AI** optionally drafts specifics using the configured
   provider. Pick **Built-in** or the available draft under **Content source**; switching sources
   updates the preview. Offline variants are explicitly labelled as placeholders, not AI inference.
   Review placeholders even after switching back from a draft.
4. **Plan options ▾** selects/clears all fixes or switches all rows to built-in content or available
   drafts. The save bar counts included built-in, AI-drafted and (when present) offline items.
5. **Apply & Save fixed .tm7** is available when at least one fix is included. Prefer a new file.
   It writes and re-reviews the model; confirm the saved file in the Microsoft Threat Modeling Tool
   and edit any model-specific text there.

Changing threat state or writing a mitigation description does **not** implement or verify a
security control, patch application code, or change deployed infrastructure.

Regenerating a plan cancels its outstanding draft requests. A delayed draft for an earlier plan
cannot replace the new plan's content merely because an action has the same check/target ID.

Changing the model/review or regenerating the plan while choosing a save destination prevents
that obsolete plan from starting a write. If writing has already begun, the original selected
file may still finish; its late completion will not reopen it over a newer model or overwrite
the newer workspace's status. This is not transactional file rollback. Keep reviewing the
saved artifact in the Threat Modeling Tool.

### Create

**Development source only:** the authoring layout below is not yet in the public v2.5.1
binary. The score, verdict and generation rules are unchanged.

1. Open **Choose a starting point / replace this draft** for a template, a local architecture
   import, **Use Assistant…**, or **Start empty**. Azure discovery is an optional disclosure
   inside this section; nothing connects automatically. Loading a source replaces the draft
   rows and source notes, not an existing saved model.
2. Enter a **Model name**, then edit **Components**, **Data flows** and **Trust boundaries**.
   The add row shares the existing rows' labelled columns. An Add action is disabled until its
   required fields have values. Flow source/target pickers accept a component selection or typed text.
3. Use **Review validation** to jump to the full list of blocking issues and advisory warnings.
   **Metadata & source notes** shows all import warnings and the effective generation input:
   stable IDs, ownership, assumptions, dependencies, stencils, scope and security properties.
   Changing endpoints is reflected there; obsolete interaction assertions are not displayed as
   current facts. **Live diagram preview** is optional and shows only the valid part of the draft.
4. The **Generate .tm7** command and **Write evidence file** option stay visible while the draft
   scrolls. Errors wrap in a selectable, scrollable status area so long messages do not hide retry
   controls. **Generation & baseline details** explains the optional baseline prompt and file ownership.

**Import architecture…** builds a draft from a file your team already maintains — Bicep, an ARM
template, Terraform, or a draw.io / Excalidraw / Graphviz / Mermaid / Visio diagram. The reading is
deterministic and uses the same code as the CLI's `ingest` verb.

It produces a *draft*, on purpose: infrastructure code records what was declared and a diagram records
what someone drew, and neither is necessarily what is deployed. Review it, correct it, then generate.

A guided wizard (components → flows → boundaries) that generates a `.tm7` with a STRIDE
baseline. You can also describe a system or load an architecture / IaC / OpenAPI / Mermaid
document and let Copilot extract a DFD you review before generating. Every generated threat is
recorded as *Needs Investigation* — an enumerated starting point for you to triage, not a
finished review.

Component names/kinds, flow names/endpoints and boundary
names/members can be edited in place. An unambiguous component rename updates its flow and boundary
references. Clearing a name while typing does not erase those references: they retain the last valid
name until a nonblank, unambiguous replacement is entered. A blank draft cannot be generated, and a
temporary duplicate name does not redirect another component's references. Restoring the original
name cancels the rename. Imported rich facts stay with that row rather than its display name or list position;
removing a row does not restore it on Generate. A changed component kind drops an incompatible stencil,
and changed flow endpoints clear the old interaction's transport/security facts. A flow label by
itself does not assert a protocol or data classification.
Flows use the generic TMT connector with any explicitly supplied protocol/security facts retained as
properties; an encrypted transport is not relabelled HTTPS or assigned a guessed template stencil ID.
An explicitly declared HTTP transport retains its plaintext signal for the existing F3 check even
with a neutral flow name and no separate encryption flag. Both writers retain flow type identifiers.

**Build from Azure…** goes one step further: instead of reading what was *declared*, it reads what is
actually **deployed**. Pick a resource group you already have access to and it drafts a model from
the resources in it.

The draft can include possible access paths inferred from a managed identity's
**data-plane** role assignments. Permission is not evidence of actual traffic. Roles that only
grant control over configuration (Contributor, Reader, Owner) are not drawn, and neither are grants
made across the whole subscription or a management group, which are almost always inherited
governance rather than this system talking to itself.

You need the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli), a completed
`az login`, and **Reader** or equivalent read permissions at the selected scope.
Denied or inaccessible metadata can leave gaps. Discovery is read-only: it cannot create,
change or delete anything, and no command that reads a key, secret or connection string is
reachable from the tool at all.

Tick **Write evidence file** before generating, and read what it says discovery *cannot* see.
In current source builds, Azure stencil hints, discovery assumptions, dependencies and gap notes
are retained through the editable draft and written into the generated model. Review those assumptions:

- A role shows what is **authorised**, not what happens — a granted role may be unused.
- Access using a **shared key** leaves no role assignment, so it is invisible here and will be
  missing from the diagram entirely.
- An inferred caller path does not establish its protocol, public reachability, authentication or
  encryption. Data sensitivity and deployed mitigations are not inferred from a resource type.

For Microsoft TMT compatibility, use the Create workflow's baseline prompt to carry
the embedded KnowledgeBase and Profile from a suitable existing `.tm7`. Without a
baseline, the app identifies the output as reviewer-only. Always open the final
artifact in Microsoft TMT before submitting it; a successful reviewer parse is not
the same compatibility check.

In current source builds, carrying a baseline changes the container, not the analysis: its old
diagrams, threats, model notes and narrative fields are replaced with the generated draft. The written threat set,
reported count and evidence come from the same generation result. Native automatic threat generation
is disabled so it does not replace that set on first open. An already-open reviewer-only file is not
automatically treated as a native baseline.

**Reproduce native serializer validation from a source checkout (Windows):**

```powershell
pwsh -NoProfile -File .\ThreatModelReviewer.Tests\Native\Validate-Generation.ps1 -KeepArtifacts
```

This opt-in test discovers the installed Azure template using the same ClickOnce-aware discovery
as the stencil extractor. It acquires the fleet validation mutex, creates a disposable baseline using
Microsoft's installed data contracts, and exercises Microsoft's serializer in an isolated x86
.NET Framework process. It checks rich, Azure-derived and neutral-name HTTP synthetic drafts through
read/save/reload, including metadata, stencil IDs, properties, threat counts, F3 parity and evidence. The console records the
serializer/template fingerprints. `-KeepArtifacts` retains the disposable models under the checkout's
ignored `artifacts` directory; without it they are deleted. These local models embed installed vendor
KB content and must not be committed or redistributed.

Serializer acceptance is a distinct check from this product's parser, but is still not a TMT
UI/dashboard test or a compatibility guarantee for every template/version. Full
dashboard acceptance still requires a disposable, isolated Windows environment:
open/save a synthetic artifact there, inspect the diagram/dashboard and recheck
counts and narrative. Do not substitute a user's active TMT session or allow its
online template refresh to modify that user's installation/profile. No existing
user process or real model is used by the automated serializer test.

### Assistant and draft replacement

Assistant separates input selection, extraction, draft review and
generation. Choose an input source:

| Input | What happens before extraction |
|---|---|
| **Description** | Type the actors, components, connections and trust boundaries, or load the synthetic example. State unknowns explicitly. |
| **Document** | Paste text or **Load / replace document…** into an editable local copy. A load replaces text instead of silently appending it; it does not yet replace the Create draft. Documents are limited to 2 MB and the first 24,000 characters; truncation is disclosed. **Map OpenAPI locally (no AI)** uses the deterministic mapper instead of a provider. |
| **Image** | **Choose / replace image…** stages a validated PNG, JPEG, GIF, WebP or BMP up to 8 MB. The name and size are shown; selection alone does not send the image. Text and image input are separate, not combined. |

Choose **Extract text draft** or **Extract image draft** when ready. Extraction sends the selected
input to the configured provider and opens a successful draft in Create for review. It does not
generate a file. The image path uses the selected model when vision-capable, otherwise an available
vision model, and reports when none is available.

**Image privacy:** the selected image is sent to the provider when you extract. **Text redaction
does not sanitize images.** Review and redact sensitive pixels before selecting a file. Remove
secrets from text too; prompt redaction is not a reason to submit them.

**Provider, model & optional context** uses the app's global model and provider selection.
**MCP context settings…** opens the existing global settings; it does not enable connections or
create a separate credential setup. Optional MCP context remains off by default.

Errors keep the input and current draft so you can correct the problem and retry. **Cancel
extraction** stops local waiting and requests cancellation; it cannot undo input already received
by a provider. Late results are not applied after cancellation, after changing input source or
content, or after editing/replacing the draft. An empty provider response does not erase a draft.
**Review draft in Create** returns to the current editable draft without another provider call.

Text/image extraction, architecture import, OpenAPI mapping and loading a template replace the
Create draft. In current source builds, replacement clears the previous Azure observations and
row metadata. In Create, **Refine the draft with AI (optional) → Refine draft** instead edits the
current draft: original observations remain
historical evidence, and only rows matched uniquely in both the input and output retain rich
metadata. Duplicate refinement flows/boundaries get fresh IDs rather than all inheriting one
original identity. A name-only Assistant response cannot prove that a renamed row is the same
Azure resource; edit its name in place to keep
that identity. A refinement response is not applied if the draft was edited or replaced while it
was running, including while the provider was connecting. **Cancel refinement** keeps the draft
and instruction. A new follow-up instruction typed while waiting is not erased by the earlier
response. Review the result before generating; AI does not change the deterministic review rubric.

### Compare
Pick two revisions — or use the model you already have open as the baseline — and see what
changed, what got worse and what got better, with the score and verdict movement. Elements,
flows, boundaries and threats use identity matching where possible; uncertain matches are disclosed
rather than guaranteed. **Explain with Copilot** adds a plain-English read; the numbers are computed
first and are never altered by it. Exports to HTML, Markdown or CSV.

Compare evaluates saved-file snapshots, including when **Use
open** selects a file. Save in-memory edits first. Changing or reselecting an input
invalidates pending results and explanations; a later file write needs another
Compare, because this is not a live file watcher. Exports disclose the captured
paths, byte hashes, rubric/options and matching warnings. Duplicate threats may
remain ambiguous rather than being presented as confirmed matches. See
[comparing saved revisions](COMPARISON.md).

The inputs and result scroll together at compact window sizes. Expand **Snapshot identity,
paths, hashes and options** to inspect or copy the full provenance; it is not only a tooltip.
**Export snapshot…** writes the captured result, including its warnings. **Cancel comparison**
and **Cancel explanation** appear while their respective operations are running.

### Ask
An assistant scoped to the model you have open. Common questions — your score, why a model is not
ready, how many threats are unmitigated, which flows cross a trust boundary — are answered
**straight from the model's own numbers with no AI call** by default. Open-ended questions use the
app's selected shared AI provider (Copilot by default), grounded in bounded facts from that review.
AI drafts are advisory and grounding checks are not a guarantee of correctness; verify them.

There is also a **floating Ask panel** in the bottom-left corner, available from any tab, so asking
a question does not cost you your place in a long findings list. It is the *same conversation* as
this tab: **Open tab** moves focus to the full-size question box without starting again. **Hide**
only hides the panel; it does not cancel a request or lose your draft.

Both surfaces bind the same
question, conversation, answer mode, commands and source labels:

| Answer mode | Behavior when you explicitly select **Ask** |
|---|---|
| **Automatic · local facts first** (default) | Factual lookups remain offline. Only open-ended questions call the existing selected AI provider. |
| **Local only · no AI** | Never calls AI. If no local lookup fits, explains the limitation and shows a labelled local summary. |
| **Copilot / selected AI · advisory** | Explicitly requests the existing selected provider, even for a factual question; may use quota. Selecting this mode does not sign in, switch providers, change MCP configuration or create a separate client. |

Ask uses the same provider and MCP owner as the rest of the app. Optional **SDK MCP context is
Copilot-only**; choosing an OpenAI-compatible/Other provider does not enable that SDK MCP path.
An explicitly sent Copilot request uses the existing enabled-source configuration. A completed
source test is a historical diagnostic result, **not proof that an AI session is already live**.
The selected-provider label and an answer's provenance do not turn a test result into live activity.

**Ctrl+Enter** sends; Enter adds a line. Suggestions fill the input without sending. While an
answer is pending, either surface can **Cancel answer**; a next-question draft is kept.
**Clear chat** clears both surfaces and discards pending output. Disconnected, empty, failed and
cancelled requests are labelled as such—not as AI drafts. **Retry this question** is an explicit
new request using the **currently visible answer mode** and selected provider/model. Switching to
Local only also prevents an older AI turn's Retry button from making an AI call.
No retry, provider connection or local-to-AI promotion happens in the background.

Each turn identifies its originating review. Replacing/reloading/closing the model, or changing
its review (including the strict SDL bar), clears the shared conversation and resets the mode to
Automatic. Late replies are discarded even if a provider ignores cancellation. Verified reference
lists are scoped text, not clickable links into a later model's findings. Ask conversations remain
in memory and are not written to local activity history or production prompt/response logs.
Fake-provider tests exercise routing and lifecycle behavior. The packaged provider's live model
catalogue was separately verified without inference; that does not certify every authenticated
MCP service or AI response.

The Ask launcher occupies its own status-bar column. The panel
fits the workspace height, puts focus in **Question**, and keeps Tab/Shift+Tab within its
controls while open. **Escape** or **Ctrl+K** closes it and restores the previous visible
control. Moving to another shell region or tab dismisses the panel, so focus cannot remain
behind it. **Open Ask tab** keeps the same conversation and focuses the full-size question box.

### History
Optional retained activity on this machine, with a per-model score trend and **what you did** to
each model — opens, exports, fixes applied and Copilot actions. **History folder** opens the local
activity-records folder; it is distinct from a selected model's **Open folder** action.
**Clear history…** asks for confirmation before deletion. Clearing records does not turn recording off.

**Privacy & export…** opens the history controls for recording,
model names, file paths, retention, export and deletion. **What is kept and where** shows the actual
preferences and selectable storage location. Prompts and responses are never history records.

**Saved locations — development source, not a new published build.** Every row keeps **Open**
and **Locate…** in the same positions:

| Location state | What to do |
|---|---|
| **Available** | **Open** requests the recorded saved file. **Locate…** remains available to choose a moved or replacement file, even while the original exists. |
| **Not found** | The recorded file is missing or inaccessible. **Locate…** chooses another location; **Refresh** rechecks availability. |
| **No location remembered** | This entry contains no saved directory. Use **Locate…**; the app does not infer one from the current model or another source. |
| **Could not check / Full path unavailable** | Inspect the details and use **Refresh** or **Locate…**, rather than assuming a path or revision match. |

Select a row to read its **full, selectable recorded path**, last activity, recorded score, trend and
activity. The list shows the containing folder's name instead of a repeated drive/user prefix,
with the full recorded file path in its tooltip. Drag the list/details divider, or
Tab to it and use Left/Right. **Copy path** works for a remembered path even when its file is missing.
It puts the path on the system clipboard, where other apps, clipboard history or sync may retain it.
**Open folder** requests that file's existing containing folder; it does not create a missing
folder or open the model. Operation errors remain selectable in the History status area.

**Remembering future locations.** Paths remain **off by default**. Choose **Privacy & export… →
Privacy → Store full file paths → Save privacy settings** to opt in. **Path recording settings…**
in selected-item details opens the same dialog and does not change a setting itself. Opting in
cannot restore unrecorded past paths. Turning it off stops future path recording; it does not erase
paths already retained. Locate does not rewrite the original entry; an accepted reopen can produce
new history under the current privacy settings.

**Reopening safeguards.** Both Open and Locate compare the chosen bytes against the **original
entry's recorded content hash**, including when Locate chooses a different file. Matching a
filename is not proof of the original revision. This is a pre-open content check, not an atomic
snapshot of the subsequent load. The existing main-workspace **Save / Discard / Cancel** guard
still applies; an accepted file receives a fresh review, never the recorded score. History says
**Open requested**, not “opened successfully”: the existing load callback does not return an
adoption result. Check the current model and workspace status if a save, cancellation or parse
failure prevents opening. Double-click/Enter retain the shortcut of using the recorded file when
available, otherwise Locate. Availability is a refresh-time check, not a file watcher. **Last
activity** is not a claim that the last event was a review.

Unavailable drives do not run availability checks on the UI thread. Refresh has a five-second
budget for its recorded-path checks; explicit existence, hash and containing-folder checks each
also stop waiting after five seconds. A timeout is visible, never an assumed match or a later open.
The operating system may still be completing one background filesystem call. History does not queue
more checks while that call is pending; other app controls remain usable. Retry History after the
drive responds. This does not change the main workspace's load or Save/Discard/Cancel behavior.

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

### Shell navigation

The app also provides:

| Keys | Action |
|---|---|
| `Ctrl + 8` / `Ctrl + 9` | Create / Assistant (existing Ctrl+1…7 assignments stay unchanged) |
| `Ctrl + Shift + N` | Open a separate review window without replacing this model |
| `Ctrl + Tab` / `Ctrl + Shift + Tab` | Next / previous available tab, from any pane |
| `F6` / `Shift + F6` | Cycle commands → workspace tab strip → status bar, forwards / backwards |
| `Alt + C` | Close a model (Ctrl+O opens one) |
| `Alt + L` / `Alt + S` | Focus the AI model picker / refresh models |
| `Alt + P` / `Alt + H` / `Alt + A` | Provider / Help / Ask panel |

Tab shortcuts respect availability: Diagram, Findings and Fix need an open model.
After jumping to a tab, use **Left/Right** to move along the native tab strip and **Tab**
to enter its content. **Shift+Tab** reverses the order. The Help menu includes this list.
Existing authoring mnemonics remain available: Alt+M for the model name and Alt+D/O/I
for Assistant's Description/Document/Image choices.

The loaded-model title and verdict have their own header row; long titles trim with the
full text available as a tooltip. Commands can wrap instead of extending off the window.
Shared controls have explicit keyboard focus and disabled states in Light, Dark and
Match Windows. Rendered Markdown code highlights and quoted caveats also follow
theme switches without rerunning the answer. Contrast and keyboard checks are
targeted desktop improvements, not
a claim of complete WCAG 2.2/WCAG2ICT conformance or full screen-reader certification.

---

## Evidence files

A generated threat model is only trustworthy if the reader can check how it was built. Passing
`--evidence` (or leaving **Write evidence file** ticked in the app's Create tab) writes a
`.evidence.md` beside the `.tm7` recording:

- **Declared inputs** — components, flows, boundaries and assumptions supplied to the generator.
  These can include upstream inferences and human edits; they are not all observed facts.
- **The resulting model** — every component, its stencil, whether it is in scope, and its boundary.
- **Threats enumerated** — the count by STRIDE category, and **every rule that fired and how often**,
  so the enumeration itself can be challenged rather than only the individual threats.
- **Added by the generator** — anything synthesized on your behalf, such as a trust boundary the
  specification did not declare. Presenting these as though you had asked for them would be the most
  misleading thing the file could do, so they are called out separately.
- **Gaps and what to verify** — every warning the generator raised, plus the manual checks that no
  tool can perform for you.

Rule enumeration is deterministic for the same specification and options.
Evidence files include a capture timestamp, so repeated runs need not produce
byte-identical evidence. AI-supplied wording is disclosed where applicable.
Attach it to a review and a reader can audit the model instead of trusting it.

Generation also records the companion `.tm7`'s SHA-256 hash and input-adaptation warnings
(for example an ambiguous duplicate name). The desktop validates before writing and stages the
model/evidence set before publication. Cancellation or an ordinary write failure leaves an existing
set unchanged, or no new files on a first attempt. Reusing an output name with evidence disabled
removes only provably owned, unchanged sidecars; replacing an Azure draft with another input removes
only its provably owned, unchanged Azure sidecar.

The desktop writes `model.tm7.generation.json` as an ownership record. It retains the model extension
and binds the exact previous `.tm7` bytes and each generated sidecar's bytes with SHA-256 hashes.
A matching basename alone is not ownership: `model.azure-evidence.md` could belong to `model.json`
or be maintained by a person. An unproven, edited or legacy sidecar without a matching ownership
record is preserved and generation reports a conflict **without replacing the existing file set**.
Choose another output name, or review/move the conflicting files yourself. Keep the ownership
record with the model/evidence set if you expect to regenerate in place; an external model edit or
native re-save changes its hash and invalidates the previous ownership proof.

This is rollback protection for ordinary failures, not a power-loss transaction. If rollback itself
fails, the error identifies the `.tmr-*.backup` files kept beside the output for recovery.
Generation notes (including Azure discovery gaps) are included in the evidence and appended under
**Generation notes** in the model's high-level system description. They are not written as a custom
`MetaInformation/Notes` member, which Microsoft's serializer silently discards when saving.

### Azure discovery evidence

A model built from a live subscription is the easiest kind to over-trust, because it describes
something real. Building from Azure therefore writes a second file, `.azure-evidence.md`, recording:

- **The read-only Azure command vocabulary** — an allowlist, not a per-call execution trace.
- **Observed role assignments and the original flow-inference rules** — permission is not traffic.
- **Observed resources and mapping eligibility**, including why supporting or unrecognised types
  were excluded from the original draft.
- **Configuration worth reviewing**, such as public network access or shared-key auth being enabled.
- **What could not be read at all** — including resources referenced by a private endpoint that your
  account cannot see, which is proof the picture is incomplete.
- **What discovery cannot tell you**, stated plainly rather than left to be discovered later.

This file separates **original Azure observations**, the
**original inferred draft**, and the **edited draft used for generation**. Identity-based tables show
renamed/edited, removed and added entries, and its hash identifies the companion model. An original
resource or role may still appear as an observation after you remove it from the draft; it is not
claimed to remain in the generated model. Generate does not re-read Azure or reapply the original
inventory over your edits.

## Assistant data sources (MCP)

**Setup interface in version 2.7.0 or later:** the app presents a short state and next action
for each server, with setup guidance, tool results and detailed disclosures
expandable. **Needs setup**, **Ready to test**, **Testing** and the last completed
result are different states. A source not included in the latest selection is
not reported as failed; a completed test is not a live AI connection.

GitHub credential actions remain reachable while that source is off. **Use GitHub
CLI sign-in** requires confirmation before copying its stored github.com credential;
it can be a different account with broader repository access than Copilot. PAT
entry remains separate. **Build from Azure (CLI)** closes the settings dialog and
opens the existing read-only Azure picker; it does not enable MCP or let AI run
arbitrary `az` commands. These additions are not in the v2.6.0 bundle.

**Help → Assistant data sources (MCP)** adds optional external context to the
assistant. It does not independently verify a system's security controls.

Version **2.6.0 and later** includes the following restricted profiles and matching CLI controls.
An older installed release does not acquire them until updated:

| Source | What it adds |
| --- | --- |
| **Microsoft Learn Docs** | Official documentation search, fetch and code-sample search |
| **Azure metadata** | Subscription/group listing only, using pinned `@azure/mcp@2.0.5` with read-only and explicit-tool flags; requires Node.js and a usable Azure identity |
| **GitHub review context** | Read repository files, issues and pull requests using a selected-repository PAT or, from v2.7.0, an explicitly imported GitHub CLI credential; does not reuse the Copilot seat token |

New profiles are **off initially**, behind a master switch and per-source consent.
Configuration changes are local; an explicit connection test or enabled assistant
session can start processes, authenticate and connect. Read the disclosure before
enabling a source. Older unrestricted profiles require renewed consent. Read-only
results may still contain private information and become AI-provider context.

None of this affects the verdict or the score. Those come from the rubric engine, which never
consults an external source.
Use **Build from Azure** for the deterministic resource-inventory workflow; the
restricted Azure MCP profile does not inspect storage/network configuration.
See [MCP setup and limits](MCP.md) and [data handling](DATA-HANDLING.md).

## How AI is used (and not used)

- The **verdict, score, and findings are deterministic** — they never depend on AI.
- Copilot buttons are **additive and independent**: running one never blocks the others.
- Finding actions send contextual text; extraction/refinement can send supplied
  documents, the current draft or the selected image. Text redaction does not
  sanitize images or guarantee that every sensitive value is removed.
- Prompts use your selected provider. Enabled MCP tool arguments and results can
  also become provider context; deterministic review needs none of these paths.

## Exit codes (CLI)

Interpret exit codes in the context of the selected command; generation success is not
a readiness verdict:

| Code | Meaning |
| --- | --- |
| `0` | The command succeeded; for a review, READY WITH NOTES with no gating findings |
| `1` | The command could not run — bad usage, or missing/unreadable input |
| `2` | Ran fine, but the result gates: NOT READY, a serious comparison regression, or insecure IaC |

For `generate`, exit `0` means generation succeeded. It does not establish a readiness verdict.
Run a separate review of the generated file (for example, `ThreatModelReviewer.Cli.exe "model.tm7"`)
and report that review's actual verdict, score and findings. Generated threats start as
*Needs Investigation*: a starting point for triage, not implemented mitigations or a finished review.
