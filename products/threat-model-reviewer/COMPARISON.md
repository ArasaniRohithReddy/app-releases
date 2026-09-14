# Comparing saved model revisions

This guide describes saved-revision comparison in **v2.6.0**. Use the release
notes and matching guide for an older installed version.

## Workflow

1. Save both revisions. Browse, type a path, drag a file, or select **Use open** for
   the baseline and candidate. **Use open** selects the open model's **saved
   file**, not an unsaved in-memory diagram.
2. Select **Compare**. The existing deterministic comparer evaluates both files
   with the same default rubric checks and options. The comparison does not
   inherit other panels' policy selections; its captured options are disclosed.
3. Read the score, verdict, changes, and matching/confidence notes. A heuristic
   pairing is not confirmed identity. Duplicate/blank IDs and other engine
   warnings are review limitations, not a new score or gating rule.
4. Optionally **Explain with Copilot**, or **Export snapshot…** HTML, Markdown, or CSV.
   Explanation remains advisory; it cannot change any deterministic result.

The result is a **saved-file snapshot**, not a live view of either file:

- Absolute input paths, filenames, model names, format, byte length, and full
  SHA-256 digests identify the evaluated inputs. Compact labels show the first
  12 hash characters; full provenance is selectable under **Snapshot identity,
  paths, hashes and options**, as well as in the identity tooltip / accessibility
  help text and exports. Inputs and results share one scroll area at compact sizes.
- SHA-256 is calculated over the exact bytes decoded and parsed, including
  encoding/BOM differences. JSON format detection uses those same captured
  bytes, not a second read of the path.
- Evaluation time (UTC), rubric version, strict-bar setting, check IDs, and the
  matching strategy are recorded. The desktop still uses the standard default
  pre-review options; no scoring or gating behavior is changed.
- Saving different content at the **same path** gives a different revision on
  the next Compare, even if the file length and modification time are unchanged.
  Identical bytes keep the same content identity. No filesystem watcher is added:
  save and run Compare again to refresh a result.

## Invalidation, failures, and cancellation

Changing either path clears the result, rows, posture, warnings, and AI prose,
and disables Export and Explain until a new comparison succeeds. Browse,
accepted file drops, Use open, and Swap also invalidate when they reselect the
same path(s). In particular, re-dropping a file saved at the same path requires
a new Compare; it cannot leave the old Export/Explain actions active. Cancelling
a picker, or choosing Use open when no saved model is open, leaves the selection
unchanged; neither action claims that a new comparison succeeded.

Starting another Compare clears the previous result **before** checking inputs.
Missing, blank, unreadable, and malformed inputs therefore cannot leave an old
success active. Failures and cancellation report an explicit status; repairing
the file or selecting valid inputs allows a retry.

Comparison and explanation each carry operation identity and cancellation.
Input changes or recomparison cancel obsolete work. Only the current operation
may publish a result, prose, status, or busy-state completion. Cancellation is
cooperative, so an uncooperative worker may finish internally, but the UI stops
waiting and cannot accept its late success or failure. Late faults are observed
without a continuation that can modify UI state. Reverting a picker edit does
not revive the old operation.

**Cancel comparison** and **Cancel explanation** are available while their
respective work is pending. They cancel only that operation, not other app work.

An explanation failure/cancellation clears old prose but does not discard the
current deterministic comparison. An export dialog that outlives its snapshot
cannot export or relabel it. An export write failure reports an error and can
be retried against the same valid snapshot.

## Matching limits

Threat IDs in generated models can be reassigned. Threat matching therefore
starts with a composite key: STRIDE category, source/flow/target interaction
(translated through the diagram matches), and normalized title.

When multiple threats share that key, a warning identifies the ambiguity:

- Equal sets of state, priority, and mitigation facts are matched first,
  independently of row order. Priority casing and insignificant mitigation
  whitespace follow the normal comparison rules.
- A nonblank retained ID can break ties only within that key, and only if it is
  unique in each entire model (after trimming and case-insensitive comparison).
  IDs never override equality of the fact sets: regenerated models may reuse
  the same IDs for different duplicate rows.
- These duplicate pairings are not labelled exact or confirmed identity.
  Unresolved duplicates are reported as removals/additions, not invented state
  transitions. Review the warning before interpreting those changes.

An unchanged duplicate fact set can therefore have **no semantic delta and still
have an identity warning**. It does not prove that each individual threat kept
its identity. None of these warnings changes the rubric score or gating rules.

For other unmatched threats, title matching is bounded to 250,000 candidate
pairs per pass. If that limit is exceeded, threat-specific notes identify the
skipped same-interaction or cross-interaction pass, the unmatched counts, and
the pair limit. Those threats remain removals/additions rather than silently
being treated as successfully matched.

## Export and privacy

Every export title and revision label comes from the snapshot, never from the
current picker text. HTML and Markdown include comparison provenance. CSV
retains the existing eight-column change-log header and rows, then appends
`Provenance,Snapshot` and `Matching,Warning` records. Consumers that only need
change rows should filter by `Area`. Model-provided text is escaped as literal
data in HTML and Markdown, including report rows, code-span labels, warnings,
and advisory prose; the report's own headings, emphasis, and tables remain
formatted. CSV cells include spreadsheet-formula neutralization, including
values that begin with a line feed.

**Exported provenance includes absolute local paths and model names.** Inspect
the report before sharing it. Full digests identify file contents; they are not
an anonymization or an assurance that the modeled system is secure.

The optional Copilot prompt uses the captured filenames, digests, options,
computed deltas, and matching notes. It does **not** send absolute local paths
or raw model files. No provider call occurs until Explain is requested; tests
use only offline fake/delayed/failing providers.

## Availability and verification limits

Offline regression tests cover saved-file revisions, selection invalidation,
late/cancelled work, rendered report literals, matching ambiguity, matching
limits, and unchanged deterministic scoring/gating behavior. They use synthetic
models and controlled providers, not real model uploads or live AI calls.

These checks do not validate an MSI installation or a live Copilot session.
The scoped source validation uses an explicitly supplied local Copilot runtime
binary, not a skipped-download acceptance claim. No real inference or MCP
service call is needed for these tests. This guide does not promise security
approval or implemented mitigations based on a comparison or a score.
