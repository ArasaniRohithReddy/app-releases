# Command line

`ThreatModelReviewer.Cli.exe` runs the same deterministic rubric engine as the desktop app, with no
UI and no .NET installation required. It is intended for CI, batch review, and scripting.

Download **`ThreatModelReviewer-vX.Y.Z-cli-win-x64.zip`** from the
[latest release](https://github.com/ArasaniRohithReddy/app-releases/releases/latest), extract it
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

---

## Building from a deployed Azure resource group

Infrastructure code records what was *declared* and a diagram records what somebody *drew*. Neither
is the same as what is running. The `azure` verb reads the deployed system instead.

```powershell
ThreatModelReviewer.Cli.exe azure groups                                  # what you can read
ThreatModelReviewer.Cli.exe azure my-rg --out spec.json --evidence
ThreatModelReviewer.Cli.exe generate spec.json --out model.tm7
ThreatModelReviewer.Cli.exe model.tm7                                     # review it
```

Requires the Azure CLI, a completed `az login`, and the **Reader** role on the group.

### How flows are inferred

A managed identity holding a **data-plane** role on a store is evidence that the resource running as
that identity reads or writes it — a path that exists in production whether or not anyone drew it.

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

---

## Using it in CI

```yaml
- name: Review the threat model
  shell: pwsh
  run: |
    ./ThreatModelReviewer.Cli.exe "docs/threat-model.tm7" --sarif findings.sarif
    if ($LASTEXITCODE -eq 2) { exit 1 }   # gate the build on a NOT READY verdict

- name: Publish findings
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: findings.sarif
```

The SARIF output means findings appear in the GitHub Security tab like any other scanner's.

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
