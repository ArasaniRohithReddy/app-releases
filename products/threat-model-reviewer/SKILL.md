# The GitHub Copilot CLI skill

A skill is how this tool reaches an AI agent. Without one, an agent asked "review my threat model"
has to work out on its own that a reviewer exists, where it lives, which verb to call and what the
exit codes mean — and when we tested that, it read the source and built the CLI from a repository
nobody outside the team can clone. It got the right answer after nine minutes and 354 AI credits.
With the skill, it runs one command.

Download **`ThreatModelReviewer-vX.Y.Z-skill.zip`** from the
[latest release](https://github.com/ArasaniRohithReddy/app-releases/releases/latest).

---

## What it does

The skill teaches an agent five jobs, each mapped to what a developer actually asks rather than to
our verb names:

| Ask | What the agent runs |
| --- | --- |
| "review this threat model", "is it ready for sign-off" | the default review verb, then reports verdict, score and gating findings |
| "why is it NOT READY" | `ask`, which answers from the model's own numbers with no AI call |
| "fix what you can" | `fix`, previewed first, then written to a new `.tm7` |
| "did the posture regress" | `compare`, including per-check regressions |
| "build me a model from this API / IaC / diagram" | `ingest` then `generate --evidence`, or `openapi` |

It also carries the CI recipes, the spec schemas, and the full rubric so an agent can explain a
check id instead of inventing one.

## The invariant it protects

**The verdict and the 0–100 score are 100% deterministic.** They come from 72 rubric checks in
`ThreatModelReviewer.Core`, which has no AI dependency and runs offline.

The skill says so in its own first section, and then states the consequence in the imperative:

> - **Never state a verdict, score or gating count you did not read out of the tool's output.**
> - **Never imply that you, or any AI, can change a verdict.**
> - If the tool cannot be run, say so and stop.

That last rule matters most. An agent that cannot find the CLI has every incentive to reason its
way to a plausible-looking verdict, and a plausible-looking verdict is worse than no answer, because
somebody will quote it in a sign-off.

## Install

You need two downloads: the skill, and the CLI it drives.

```powershell
# 1. The skill bundle
Expand-Archive ThreatModelReviewer-vX.Y.Z-skill.zip -DestinationPath C:\tools\tmr-skill

# 2. The CLI, which does the actual work
Expand-Archive ThreatModelReviewer-vX.Y.Z-cli-win-x64.zip -DestinationPath C:\tools\tmr-cli
$env:THREAT_MODEL_REVIEWER_CLI = 'C:\tools\tmr-cli'   # or put the folder on PATH

# 3. Register the skill
copilot skill add C:\tools\tmr-skill\skills
copilot skill list        # 'threat-model-reviewer' should be listed
```

Register the **`skills` directory**, not the single `SKILL.md`. `copilot skill add <file>` copies
only that one file, which leaves the reference guides and the resolver script behind.

For one repository rather than your user account, copy `skills/threat-model-reviewer/` into that
repository's `.github/skills/`. It can also be loaded as a plugin, which suits a pipeline:

```powershell
copilot --plugin-dir C:\tools\tmr-skill -p "review docs/threat-model.tm7"
```

## Use it

```
> review docs/threat-model.tm7
> why is this threat model NOT READY?
> fix what you can in Model.tm7 and write a corrected copy
> did the security posture regress between these two revisions?
> generate a threat model from openapi.yaml, with an evidence file
```

Non-interactively:

```powershell
copilot -p "review docs/threat-model.tm7 and list the gating findings" --allow-all-tools
```

## What is in the bundle

| Path | Purpose |
| --- | --- |
| `skills/threat-model-reviewer/SKILL.md` | The skill: routing, the determinism invariant, the five jobs, exit codes |
| `references/cli-reference.md` | Every verb and flag, and what authentication each needs |
| `references/rubric-and-verdict.md` | How the verdict is decided, the 8 gating checks, all 72 check ids |
| `references/spec-schemas.md` | The `generate` and `create` spec schemas, which differ |
| `references/ci-recipes.md` | GitHub Actions, Azure DevOps, pre-commit, batch review |
| `scripts/Invoke-ThreatModelReviewer.ps1` | Finds the CLI and forwards the exit code unchanged |
| `plugin.json` | Plugin manifest |

The references exist so `SKILL.md` can stay short. An agent loads the description first and reads
only the reference it needs, which keeps the common case cheap.

## Finding the CLI

`Invoke-ThreatModelReviewer.ps1` searches, in order: `THREAT_MODEL_REVIEWER_CLI`, then `PATH`, then
its own folder and the usual install locations, capped at three directories deep so it cannot appear
to hang on a large `Downloads` folder.

```powershell
pwsh -NoProfile -File .\scripts\Invoke-ThreatModelReviewer.ps1 -WhereIs
```

It forwards the CLI's exit code verbatim, and returns `1` itself only when the executable cannot be
found — which is correctly a run that failed. A wrapper that rewrote the exit code would turn a
failing CI gate into a passing one, so it deliberately adds nothing.

## Exit codes

`0` READY WITH NOTES · `2` NOT READY · `1` the run failed. The skill spells out that `1` is not a
verdict, because "the command was wrong" and "the model is bad" look identical to an agent that has
only a non-zero number to go on.

## What is guarded

`ThreatModelReviewer.Tests/SkillPackagingTests.cs` holds 23 tests over the bundle, because nothing
compiles it and a wrong sentence in a skill becomes a wrong command. They assert, among other
things, that:

- every verb and flag the skill tells an agent to run is one the CLI actually parses;
- the two documented spec examples deserialize and generate a real model, so the `generate` and
  `create` schemas cannot drift apart from the docs that describe them;
- every gating check the engine gates on is named in the rubric reference;
- every relative link resolves, so progressive disclosure does not dead-end;
- the description stays inside the loader's 1024-character limit;
- the resolver still forwards `$LASTEXITCODE`;
- the release script still packages the bundle.

Each guard was checked by breaking the thing it protects and confirming the test failed.

The 1024-character limit is in there because the first draft of the description was 1199 characters
and `copilot skill add` refused it outright. Nothing in the build would have caught that.

## Limits

- **Windows x64 only.** The CLI has no Linux or macOS build, so this cannot run on a Linux runner.
- **The engine reads the model, not the system.** It cannot verify that a claimed mitigation is
  actually deployed.
- **Generation enumerates; it does not analyse.** Every generated threat is *Needs Investigation*.
- **AI verbs need a Copilot seat.** Only `--explain` and `fix --ai`. Everything else works offline.
- **Skill selection is not guaranteed.** An agent chooses a skill from its description. On a machine
  with hundreds of skills installed the list an agent sees can be truncated, and the skill may not
  be offered at all. Naming it — "use the threat-model-reviewer skill" — always works.

## See also

- [CLI reference](CLI.md) — the tool the skill drives
- [Install guide](INSTALL.md)
- [Data handling](DATA-HANDLING.md) — exactly what the AI verbs send, and when
