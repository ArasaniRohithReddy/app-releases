# Command line

`ThreatModelReviewer.Cli.exe` runs the same deterministic rubric engine as the desktop app, with no
UI and no .NET installation required. It is intended for CI, batch review, and scripting.

Use the CLI from the matching product release. Older binaries do not acquire new
commands because this guide changes.

The version 2.7.0 desktop History location, Open/Locate, Copy path and Open folder
actions do not introduce CLI commands or switches. Path recording remains opt-in;
unrecorded historical locations cannot be recovered by enabling it later. For
automation, use the model path supplied by the user rather than guessing a path
from a history identifier.

Download **`ThreatModelReviewer-vX.Y.Z-cli-win-x64.zip`** from the
[Threat Model Reviewer releases](https://arasanirohithreddy.github.io/app-releases/threat-model-reviewer/releases/), extract it
anywhere, and run the executable. Nothing else to install.

```powershell
# Optional: put it on PATH for the current session
$env:Path += ";C:\tools\ThreatModelReviewer-cli"
```

---

## Reviewing a model

The default verb is review, so a bare path is all that is needed. It accepts Microsoft Threat
Modeling Tool `.tm7` files and OWASP Threat Dragon `.json` files.

```powershell
ThreatModelReviewer.Cli.exe "path\to\Model.tm7"
```

### Exit codes

The exit code is the contract, so a pipeline can gate on it without parsing output.

| Code | Meaning |
| --- | --- |
| `0` | READY WITH NOTES — nothing gating |
| `2` | NOT READY — at least one gating finding |
| `1` | The run failed (file missing, unreadable, bad arguments) |

```powershell
ThreatModelReviewer.Cli.exe "Model.tm7"
if ($LASTEXITCODE -eq 2) { throw "Threat model is NOT READY - see the findings above." }
```

### Reports

```powershell
ThreatModelReviewer.Cli.exe "Model.tm7" `
  --html report.html --md summary.md --json findings.json --sarif findings.sarif --csv findings.csv
```

`--explain` adds Copilot commentary to the report. It never changes the verdict or the score; those
come from the rubric engine alone.

---

## Other verbs

```powershell
# Remediate: add missing threats, triage, justify - then write a corrected .tm7
ThreatModelReviewer.Cli.exe fix "Model.tm7" --out "Model.fixed.tm7"

# Author a model from a spec, or from an OpenAPI document
ThreatModelReviewer.Cli.exe create spec.json --out new.tm7
ThreatModelReviewer.Cli.exe openapi api.yaml --out api.tm7

# Compare two revisions and report whether the posture regressed
ThreatModelReviewer.Cli.exe compare baseline.tm7 candidate.tm7 --md diff.md

# Build a .tm7 from a described system (deterministic STRIDE enumeration)
ThreatModelReviewer.Cli.exe generate system.json --out model.tm7

# ...and write an auditable record of how it was built, beside the model
ThreatModelReviewer.Cli.exe generate system.json --out model.tm7 --evidence

# Read what the team already has: documents, diagrams, or infrastructure as code
ThreatModelReviewer.Cli.exe ingest architecture.drawio
ThreatModelReviewer.Cli.exe ingest main.bicep
ThreatModelReviewer.Cli.exe ingest design.docx --out grounding.md

# Draft from a DEPLOYED Azure resource group (read-only; never reads a secret)
ThreatModelReviewer.Cli.exe azure groups
ThreatModelReviewer.Cli.exe azure my-rg --out spec.json --evidence

# Write the SDL-ready artifact bundle (document, register, matrix, manifest)
ThreatModelReviewer.Cli.exe sdl model.tm7 --out .\sdl-bundle

# Answer a question from deterministic facts only - no AI, no network
ThreatModelReviewer.Cli.exe ask model.tm7 "why is it not ready?"
```

### SDL bundle integrity

The SDL writer validates that every threat has a non-blank identifier that is unique after trimming
before it creates the output directory. It writes `manifest.json` last and removes an older manifest
before replacing artifacts. If a write fails, the absence of the manifest is the failure signal; unrelated
files in the output directory are left alone.

The CLI captures the source bytes once, decodes and parses that snapshot, and
supplies one complete `SdlSourceIdentity` from those same bytes. The source path,
format, SHA-256 and byte count therefore describe the evaluated revision, including
its original encoding/BOM. The SDL writer never rereads a mutable source path or
hashes reserialized XML to invent file identity.

An in-process caller supplying only a semantic model/path gets an explicitly
**unverified** source identity without a digest or byte count; it must provide
captured identity to claim exact bytes. Incomplete or conflicting digest overrides
are rejected. Artifact hashes remain independently verifiable.

Artifact replacement is **not transactional or power-loss atomic**. A failed refresh can leave a mixture
of old and new artifact files, but it must not leave a success-shaped manifest. Prefer a new or empty
output directory, and trust a completed bundle only after verifying every available hash in `manifest.json`.

Repository maintainers can run the standard-library-only artifact parser over captured test bundles:

```powershell
python scripts\tests\validate_sdl_bundle.py --root .\TestResults\sdl-phase-artifacts
```

---

## Generation success and review readiness

For `generate`, exit `0` means generation succeeded. It does not establish a readiness verdict.
Run a separate review of the output (`ThreatModelReviewer.Cli.exe "model.tm7"`) and use that
review's actual verdict, score and findings.

## Building from a deployed Azure resource group

Infrastructure code records what was *declared* and a diagram records what somebody *drew*. Neither
is the same as what is running. The `azure` verb reads the deployed system instead.

```powershell
ThreatModelReviewer.Cli.exe azure groups                                  # what you can read
ThreatModelReviewer.Cli.exe azure my-rg --out spec.json --evidence
ThreatModelReviewer.Cli.exe generate spec.json --out model.tm7
ThreatModelReviewer.Cli.exe model.tm7                                     # review it
```

Requires the Azure CLI, a completed `az login`, and read access to the requested
resources, role assignments and endpoints. Missing access can produce gaps.

### How flows are inferred

A managed identity holding a **data-plane** role has permission to access a resource.
Discovery uses eligible assignments to suggest possible flows; it does not observe
traffic or verify that an application uses the permission.

Two kinds of assignment are deliberately **not** drawn:

| Not drawn | Why |
| --- | --- |
| Configuration roles (Contributor, Reader, Owner) | Being able to reconfigure a store is a privilege concern, not a path data travels. |
| Subscription- or management-group-scoped grants | Almost always inherited governance. On one measured resource group, 111 of 115 assignments were at this level. |

Both are counted in the evidence file, so you can see the decision rather than wonder about it.

### Read-only by construction

The wrapper cannot be handed a command. Every read is a named method that builds its own arguments
and re-validates them against an allowlist before running. Nothing can create, change or delete a
resource, and no command that reads a key, secret, connection string or credential is reachable.

The native Azure CLI Python module runs without a command
shell. Use the installed MSI/ZIP/virtual-environment interpreter, or an explicit
`TMR_AZURE_CLI_PYTHON` absolute path for another trusted installation layout.
The selected subscription is captured and passed through the discovery operation;
malformed responses, access errors and unconfirmed cleanup cannot become empty
successes. See [the supported I/O contract](AZURE-DISCOVERY.md).

### What it cannot tell you

Always pass `--evidence`, and read the limits it records. The two that matter most:

- **A role shows what is authorised, not what happens.** A granted role may be unused — which is
  worth questioning in itself.
- **Access using a shared key leaves no role assignment.** Discovery cannot see it, and this tool
  never reads those credentials to find out. Such a path will be missing from the diagram entirely.

These are written into the generated `.tm7` as assumptions, so the model states them even when it
travels without the evidence file.

---

## AI verbs and authentication

Reviewing, fixing, comparing and generating are **fully deterministic and work offline**. Only the
verbs that ask Copilot for commentary need a signed-in seat.

The CLI bundle carries the Copilot runtime, and picks up an existing login from the GitHub CLI
(`gh auth login`) or from an environment variable:

```powershell
$env:COPILOT_GITHUB_TOKEN = "<fine-grained PAT with Copilot Requests>"
```

Classic `ghp_` tokens are not supported. See [DATA-HANDLING.md](DATA-HANDLING.md) for exactly what is
sent and when.

## Optional MCP context

**Requires version 2.7.0 or later (not in v2.6.0):** `mcp setup <id>` provides local
source-specific instructions. `mcp credential github-review-context --github-cli
--consent` explicitly copies the installed GitHub CLI's stored github.com identity
instead of asking for a new PAT. Its account/access can differ from Copilot and may
be broader than a selected-repository PAT. No login, scope grant or source enablement
is automatic. The copied credential does not follow later CLI sign-ins/sign-outs.
Version 2.7.0 also corrects lazy SDK tool initialization during connection tests.

MCP adds optional context to Copilot, not another source of verdicts. It requires
both master and per-profile consent, and an AI invocation must also request
`--mcp`. The installed v2.5.1 CLI does not have these commands.
This integration uses the **GitHub Copilot SDK only**. OpenAI-compatible and
Offline providers do not attach MCP profiles. MCP is a tool protocol, the SDK
hosts its sessions, and individual tools expose named operations/input schemas
over a service API; these are not interchangeable capabilities.

```powershell
# Local inspection only; no server connection
ThreatModelReviewer.Cli.exe mcp list
ThreatModelReviewer.Cli.exe mcp show github-review-context
ThreatModelReviewer.Cli.exe mcp status

# Store a separate fine-grained PAT using masked input; never pass a token literal
ThreatModelReviewer.Cli.exe mcp credential github-review-context
ThreatModelReviewer.Cli.exe mcp enable github-review-context --consent
ThreatModelReviewer.Cli.exe mcp on --consent

# Single-server probe; no other configured source starts
ThreatModelReviewer.Cli.exe mcp test github-review-context

# Several servers, only after each has separately been enabled/consented
ThreatModelReviewer.Cli.exe mcp test microsoft-learn github-review-context

# Backward-compatible all-enabled probe; includes Azure/npx if Azure is enabled
ThreatModelReviewer.Cli.exe mcp test

# Opt in for this AI request; the rubric still runs locally
ThreatModelReviewer.Cli.exe "Model.tm7" --explain --mcp
ThreatModelReviewer.Cli.exe fix "Model.tm7" --ai --mcp --out "Model.draft.tm7"

# Disable future use and separately remove the stored credential
ThreatModelReviewer.Cli.exe mcp off
ThreatModelReviewer.Cli.exe mcp forget-credential github-review-context
```

Built-ins are Microsoft Learn, Azure **subscription/group metadata only**, and
GitHub file/issue/pull-request reads. A selected-repository PAT remains the narrowest
GitHub option. Do not reuse a Copilot seat token or copy a broad automation credential
into hidden input. The new explicit GitHub CLI import is a separate consented action.
Read-only data can still be sensitive and enter provider context. Normal review
and factual `ask` require none of this. For exact tools, custom-import restrictions,
credential lifecycle and troubleshooting, see [MCP](MCP.md).

`mcp show <id>` already provides per-profile configured names/capabilities;
it is local and does not claim discovery. `mcp test` prints each allowed tool's
discovery, SDK availability and input-schema state. Transport-connected is
not tools-ready, and available metadata is not proof of an authenticated
resource operation. Missing names/schemas or unavailable/deferred tools fail
readiness explicitly. No resource tools are invoked by this command.

Scope is per **server**, not per tool. `mcp test <id>` tests one server;
`mcp test <id> <id> ...` tests exactly that selection; plain `mcp test` remains
all enabled. The master and every requested profile must already be enabled.
All requested IDs, consent and credentials are validated before startup:
unknown/disabled/unconsented/missing-credential selections fail as a whole,
without starting a valid subset or enabling anything. Hosted-only selection
never starts Azure/npx, even when Azure is saved enabled.

Every probe closes its diagnostic runtime before reporting. A passed probe
is historical transport/tool/schema evidence, **not a live AI-session
connection**. Cleanup failures remain explicit and return 1. `show`/`status`
remain local configuration inspection; probe history is not persisted across
CLI invocations. Testing does not change the saved enabled-source selection
used by the next `--explain --mcp` or `fix --ai --mcp` request.

Test failures include the source ID and last observed stage, rather than
blaming every failure on a GitHub credential. Azure stdio/bootstrap guidance
distinguishes Node.js/npx prerequisites from source authentication and from
an **explicitly reported IT policy block**. A timeout/unreported server alone
does not establish such a block. If managed security reports one, stop and
request IT approval; do not bypass controls or switch download sources.
Pending Azure does not erase completed hosted-source results once the SDK
session exists; shared runtime/session failures remain shared and explicit.
Only an administrator-approved preinstalled entrypoint/descriptor may use
the existing credential-free custom-import path; no automatic alternative
package or executable path is selected. See [MCP](MCP.md) for that boundary.

Local stdio is not a sandbox. Known Copilot/GitHub-seat and AI-provider
credential environment keys are masked in the transmitted overlay, but other
variables, the intended Azure identity chain and local files can remain
accessible. Remote GitHub Authorization uses only its separate named PAT.

---

## Using it in CI

```yaml
- name: Review the threat model
  shell: pwsh
  run: |
    ./ThreatModelReviewer.Cli.exe "docs/threat-model.tm7" --sarif findings.sarif
    if ($LASTEXITCODE -eq 2) { exit 1 }   # gate the build on a NOT READY verdict

- name: Publish findings
  if: ${{ always() && hashFiles('findings.sarif') != '' }}
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: findings.sarif
```

`--sarif` writes a local SARIF file. It does not upload findings or transmit them automatically.
The separate upload-sarif step publishes those findings to GitHub code scanning only if that step
runs successfully and the repository is configured to accept them. Review the file for sensitive
model content and apply the repository's access policy before uploading.

---

## Driving it from an AI agent

Everything above is also reachable through the **GitHub Copilot CLI skill**, shipped as
`ThreatModelReviewer-vX.Y.Z-skill.zip` in the same release. It teaches an agent which verb to run
for a plain-English request, what the exit codes mean, and — importantly — that it must report the
engine's verdict rather than form one of its own.

```powershell
Expand-Archive ThreatModelReviewer-vX.Y.Z-skill.zip -DestinationPath C:\tools\tmr-skill
$env:THREAT_MODEL_REVIEWER_CLI = 'C:\tools\tmr-cli'   # where this CLI bundle was extracted
copilot skill add C:\tools\tmr-skill\skills
```

Then: *"review docs/threat-model.tm7"*, *"why is it NOT READY?"*, *"fix what you can"*, *"did the
posture regress?"*. Full guide: [SKILL.md](SKILL.md).
