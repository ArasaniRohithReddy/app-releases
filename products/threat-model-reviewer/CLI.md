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

# Write the SDL-ready artifact bundle (document, register, matrix, manifest)
ThreatModelReviewer.Cli.exe sdl model.tm7 --out .\sdl-bundle

# Answer a question from deterministic facts only - no AI, no network
ThreatModelReviewer.Cli.exe ask model.tm7 "why is it not ready?"
```

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
