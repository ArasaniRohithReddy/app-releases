# Architecture

Threat Model Reviewer is a .NET 10 solution (`ThreatModelReviewer.slnx`) of five projects.
The guiding rule: **the deterministic core never depends on AI**, so the verdict is
reproducible. Deterministic review works offline; direct Azure discovery is a
separate network-backed Core feature and AI/MCP integrations are optional.

The integration boundaries below are included in **v2.7.0**. Release provenance
records its accepted source and runtime; a source version alone is not release evidence.

```
ThreatModelReviewer.Core   ──► no AI dependency (the deterministic engine)
        ▲
        │ uses
ThreatModelReviewer.Ai     ──► IAiProvider + CopilotProvider (GitHub Copilot SDK)
        ▲
        │ both used by
ThreatModelReviewer.App  (WPF / MVVM)      ThreatModelReviewer.Cli  (review/fix/create/eval)
ThreatModelReviewer.Tests (xUnit)
```

## Core (`ThreatModelReviewer.Core`)
- **Model** — the canonical, format-agnostic `ThreatModel` (elements, flows, trust
  boundaries, threats) plus a source artifact for lossless round-trip.
- **Parsing** — `Tm7Parser` (Microsoft `.tm7`) and `ThreatDragonParser` (`.json`).
- **Rubric** — the **`RubricEngine`** runs 72 `IRubricCheck` checks and computes the
  verdict + 0–100 review score. Also: `StrideCoverageMatrix`, `FlowThreatBreakdown`,
  `FrameworkCoverageMatrix`, `RiskScorer`, `ResponseClassifier`.
- **Knowledge** — `SecurityKnowledgeBase` (STRIDE → mitigations + OWASP / MITRE / CWE /
  NIST / MCSB references, OWASP LLM Top 10, MITRE ATLAS) and `FindingGuidance`.
- **Authoring** — `Tm7Editor` (DOM-passthrough), `Remediator`, `ThreatModelGenerator`.
- **Reporting** — HTML / PDF / Markdown / CSV / JSON / SARIF writers + issue exporters.
- **Generation** — `GenerationSpec`, `ThreatModelGenerationPipeline`, rule-based
  threat enumeration and evidence. `CreateSpecAdapter` adapts the form-shaped input.
- **Ingestion** — document/diagram readers and ARM, Bicep and Terraform parsing.
- **Azure** — `AzureReadOnlyCli` reads metadata; `AzureDiscovery` builds an inventory;
  `AzureDfdBuilder` drafts structure from recognized resources and eligible role assignments.
- **Compare, Facts, History and Policy** — deterministic comparisons and answers,
  local review history, and disclosed policy adjustments.

## Ai (`ThreatModelReviewer.Ai`)
`IAiProvider` with `CopilotProvider` (GitHub Copilot SDK) and an
`OpenAiCompatibleProvider`. Helpers: `FindingExplainer`, `ThreatAnalyzer`, `ModelCritic`,
remediation drafters. **All advisory** — nothing here changes the verdict.
Declared dependency versions are recorded in [Third-party notices](THIRD-PARTY-NOTICES.md).

> The Copilot SDK bundles a CLI runtime (`runtimes\win-x64\native\copilot.exe`) that it
> spawns as a child process. It is placed by a **build** target, so the app is distributed
> as a self-contained **`dotnet build`** folder (not `dotnet publish` / single-file). See
> [RELEASING.md](RELEASING.md).

## App (`ThreatModelReviewer.App`)
WPF, CommunityToolkit.Mvvm. The app exposes **Create, Assistant, Overview, Diagram,
Findings, Fix, Compare, Ask and History**. Model-dependent tabs are available when
their input is loaded. Create and Assistant are not unfinished hidden features.

Create accepts form input, architecture imports and an Azure-discovered draft.
The baseline-carried writer preserves an existing TMT KnowledgeBase and Profile.
Without a baseline, the app identifies newly generated output as reviewer-only.
The CLI's `azure` command writes the richer `GenerationSpec`; the desktop form uses
`CreateSpec`. Do not assume every rich property survives conversion through the form.

In development source, rich metadata is retained separately from display names and
matched back to edited rows only when identity is unambiguous. A single pipeline
result supplies the final XML, displayed counts and evidence for both baseline
and non-baseline generation. `GenerationArtifactWriter` stages the desktop output
set and uses `model.tm7.generation.json` to establish ownership before replacing
sidecars. See [the user workflow and limitations](USER-GUIDE.md#evidence-files).

`StencilImages` resolves and caches frozen artwork from an installed Microsoft TMT
instance. The diagram uses vector fallbacks when matching artwork is unavailable.

## Trust boundaries of the tool itself

Because this application parses untrusted files and can forward their content to a language model,
its own boundaries matter:

```
   ┌─────────────────────────── your machine ───────────────────────────┐
   │                                                                    │
   │  .tm7 / .json ──► Parsing ──► Rubric engine ──► Verdict, score,     │
   │  (untrusted)                  (deterministic)   findings, reports   │
   │                                     │                               │
   │                                     ▼                               │
   │                            PromptSafety.Redact                      │
   │                     (secrets + PII stripped, injection flagged)     │
   └─────────────────────────────────────┼───────────────────────────────┘
                                         │  finding text + redacted DFD summary
                                         ▼            (only on explicit user action)
                          GitHub Copilot (your seat)  ── or ──  your OpenAI-compatible endpoint
```

- Review does not upload the raw model file. AI extraction/refinement can send supplied
  text, the current draft or the selected image; text redaction does not redact images.
- Nothing returned by a model can change the verdict, the score or the findings; AI output is
  rendered as advisory text, and every drafted `.tm7` change is applied only after explicit
  user approval.
- Updates and authentication use their service endpoints. Direct Azure discovery
  uses the installed Azure CLI and existing identity.
- **MCP** is separate from direct discovery. `McpConnectionManager` requires master
  and per-server opt-in; enabled descriptors are passed into Copilot sessions.
  Microsoft Learn uses HTTPS; Azure MCP can download and run a local npm package.
  The direct Azure CLI wrapper's allowlist does not govern that separate process.

Full enumeration: [DATA-HANDLING.md](DATA-HANDLING.md).

### Connector and revision boundaries

`McpSessionPolicy` constrains effective SDK defaults as well as the configured
server list. `McpConnectionManager` owns probes and credential/consent state;
the provider and final-window shutdown dispose their owned lifetimes with bounded
escalation. Restricted Learn, Azure metadata and GitHub profiles remain opt-in.
They are not an infrastructure-discovery replacement or an OS sandbox.

The direct Azure runner instead invokes an allowlisted native Python/CLI process
inside its own Windows Job Object. The picker returns both group and validated
subscription ID; subsequent reads do not fall back to a mutable default account.

Desktop Compare captures exact bytes, identity and evaluation options in an
immutable snapshot, invalidating pending output on input changes. CLI SDL parses
and hashes one captured byte sequence; semantic/path-only callers remain explicitly
unverified. Reports are literal-rendered, and provenance is potentially sensitive.
See [MCP](MCP.md), [Azure](AZURE-DISCOVERY.md), and [Compare](COMPARISON.md).

## Cli (`ThreatModelReviewer.Cli`)
`review` / `fix` / `create` / `openapi` / `diff` / `eval`, plus `compare`, `generate`,
`ingest`, `azure`, `sdl`, `ask`, `history`, `policy`, and report/issue-export flags.
`review` exit codes: `0` ready-with-notes, `2` not ready, `1` error — designed so a build pipeline
can gate on threat-model readiness.

Development source also exposes local `mcp` configuration/credential commands,
explicit connection testing, and `--mcp` for opted-in AI calls. A normal review
or factual `ask` remains offline.

## Extending the rubric
Implement `IRubricCheck` and compose with the defaults:
```csharp
var engine = RubricEngine.WithAdditionalChecks(new[] { new MyOrgPolicyCheck() });
```
Add `FindingGuidance` and `SecurityKnowledgeBase` citations for any new check, plus tests.

## Documentation and distribution

The source owns the public guide copies listed in `docs/publication.json`.
`scripts\sync-public-docs.ps1` exports only that whitelist to a local hub clone,
relocates Markdown links and supports a read-only drift check. It never commits,
pushes, or publishes a release. Public Pages copy is maintained separately and
verified against the guide, sample result and current published release.
