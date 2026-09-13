# Pages deployment and snapshot preservation

## Status: remote activation is required

The read-only release audit on **2026-09-13** found:

- Pages `build_type: legacy`, source `main:/docs`.
- Live SHA `11429675b5011c5ac10d990297a7f524db149704`.
- Latest passing site-check SHA `d408c7d644c2e29aeb799b42af6a58bc2705c6e1`;
  no site-check run for the live snapshot SHA in the audited inventory.
- An earlier legacy Pages deployment completed before its site checks failed.

**The legacy publisher does not wait for this repository's site-check workflow.**
Adding `needs: check` to an Actions job cannot gate a separate branch-based publisher.
The workflows below are prepared for a coordinator-controlled migration; this document
does not claim that the current live deployment is gated.

## Validation and deployment path

```text
release / schedule / manual snapshot refresh
  checkout current default branch
  fetch all API pages → validate/merge saved history → commit candidate locally
  npm test → clean-tree check → normal fast-forward push
  explicitly dispatch site-checks.yml on main (also when the snapshot is unchanged)
                                  |
main push / manual site-check dispatch
  checkout immutable github.sha → npm test → verify unchanged tree
  archive committed docs at that SHA → upload SHA-named artifact
  deploy needs successful check job + opt-in + canonical repo + main branch
  verify Pages build_type=workflow and main still matches the checked SHA
  deploy that run's SHA-named artifact to the github-pages environment
```

- PRs run checks only: no Pages artifact or deployment, and no Pages write/OIDC permission.
- Production runs are serialized, not canceled mid-deployment. A newer pending run replaces
  an older pending run under GitHub's concurrency rules.
- The deploy preflight rejects superseded SHAs. A main update arriving after that preflight
  can leave a previously checked revision live briefly; the queued main run must itself pass
  before replacing it. Deployment always uses the artifact of its own successful check job.
- No cross-workflow artifact lookup, `workflow_run` privilege handoff, PAT or new secret is needed.
- `configure-pages` has `enablement: false`; the workflow will not silently enable Pages.

## Exact coordinator settings and activation order

Repository: **`ArasaniRohithReddy/app-releases`**.

1. Arrange a short cutover window. Drain existing legacy Pages and snapshot runs, or have an
   authorized operator cancel those specific runs. Do not delete run/deployment history.
   Already-started or rerun older workflow revisions must not be mistaken for this new path.
   Confirm Actions artifact capacity and the required permissions before changing the
   publishing source. If that prerequisite is blocked, defer cutover and explicitly record
   that the existing healthy legacy site is still ungated; do not delete history to make room.
2. In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
   The required remote API state is **`build_type: "workflow"`**, replacing `"legacy"`.
   This is the necessary change that closes the independent branch-publishing path.
   Use the reviewed `site-checks.yml` publisher; do not add a second starter deployment
   workflow that bypasses its checks.
   Do not delete/unpublish Pages, change the canonical hostname, or create a CNAME.
   Keep the last successful deployment; verify the existing three routes remain reachable
   during cutover rather than assuming availability from the settings change alone.
3. Merge the reviewed workflow/generator changes to `main` and let the checks pass.
   Prefer changing the Pages source before merging to avoid another legacy deployment race.
   Until the setting changes, any merge or snapshot push can still publish through legacy
   Pages independently, even with the new workflow committed.
4. Verify the existing **`github-pages` environment** permits deployments from **`main` only**.
   Optional required reviewers add a manual approval to every deployment, including scheduled
   snapshot deployments; choose that policy deliberately.
5. Set repository Actions variable **`PAGES_DEPLOY_ENABLED`** to the string **`true`** in
   **Settings → Secrets and variables → Actions → Variables**. Leave it unset or `false`
   until source/environment configuration and the reviewed workflow are ready.
   This is a non-secret opt-in, not a credential.
6. Manually run **Site and documentation checks** (`site-checks.yml`) on `main`.
   Manual dispatch ensures a run even if the previous commit carried a CI-skipping marker.
   The workflow revalidates the captured SHA before uploading or deploying.
7. Verify the successful check run's `head_sha`, the `github-pages-<SHA>` artifact, and the
   resulting Pages deployment SHA agree. Check portal → product → recommended MSI, CLI,
   skill and release-history paths live, then allow normal release/scheduled refreshes.

The jobs declare their required token permissions: checks use `contents: read`; deployment
uses `contents: read`, `actions: read`, `pages: write`, `id-token: write`; snapshot automation
uses `contents: write` and `actions: write`. Repository/org policy and branch rules must
allow the intended bot fast-forward push and explicit workflow dispatch. If policy rejects
them, the run fails visibly; do not substitute a force-push or grant an unreviewed bypass.

## Why snapshot refresh explicitly dispatches checks

Removing the old `[skip ci]` message is necessary but insufficient. Pushes made with the
repository's `GITHUB_TOKEN` do **not** trigger ordinary push workflows. GitHub explicitly
allows `workflow_dispatch` events to create new runs with that token.

The snapshot workflow therefore:

1. Keeps release, manual and six-hour scheduled triggers; scheduling is not a freshness SLA.
2. Reads **all** API pages using `--paginate --slurp`. It does not concatenate pages into
   multiple root JSON arrays or silently publish only the first page.
3. Validates data and merges by release tag/asset name, preserving absent saved records,
   file references and nonempty historical notes. Unexpected/empty API data fails before
   replacing the snapshot. New drafts are not published.
4. Commits only the generated snapshot locally, runs the full tests, then attempts a
   normal fast-forward push. A concurrent main update causes failure: rerun against the
   new base; never rebase unchecked code after validation.
5. Dispatches `site-checks.yml` on current main after the successful push, even for a
   no-change refresh. This also retries a missed/failed dispatch on the next successful run.
   The dispatched run tests its own captured `github.sha`; it may be newer than the
   snapshot commit if another approved main change won the race.

This preserves references and Git history, not immutable binary storage. A genuinely
withdrawn release/asset needs an explicit, authorized retirement/takedown decision;
API absence alone must not silently erase historical notes/files. Old workflow revisions
and direct repository edits remain operator-controlled; do not rerun stale workflows
expecting them to contain these safeguards.

## Failure and rollback boundaries

- This gate governs the Pages artifact, not independent release publication or the
  visibility of raw GitHub documentation on `main`. Coordinate repository branch controls
  separately; links to `blob/main` can change independently of a deployed Pages artifact.
- If checks, upload, permissions, dispatch or deployment fail, the last successful Pages
  deployment should remain the serving version. Verify that state; do not describe the new
  SHA as live merely because a commit or check job exists.
- Snapshot validation may intentionally block publication when a release changes package
  contracts or produces invalid data. Fix the contract/tests deliberately; never remove
  historical releases/assets to make a check pass.
- Pages artifacts use one-day retention. Upload still requires available Actions artifact
  storage/quota. An exhausted quota can block deployment; this work deletes no artifacts,
  releases or history to reclaim space.
- If an artifact has expired, or rerunning the upload job conflicts with an existing
  SHA-named artifact in that same run, dispatch a **new** workflow run on current main.
  Do not delete preserved artifacts or deploy an artifact from a different run to work around it.
- To pause future guarded deployments, unset/set `PAGES_DEPLOY_ENABLED=false`; an already
  running deployment requires separate operator attention. Keep Pages workflow-backed.
- Roll back source with a normal revert commit and run the same checks/deployment path.
  Do not force-push history or return to legacy publishing as an undocumented bypass.
- Remote settings, required-reviewer behavior, GitHub-hosted Linux browser execution and an
  actual successful gated Pages deployment require coordinator verification after activation.
  Local fixture/workflow tests are not evidence of remote deployment protection.

## Externally controlled legacy URL continuity

The release worker observed HTTP 404, without redirects, for:

- `https://rohithreddy7123.github.io/app-releases/`
- `https://rohithreddy7123.github.io/app-releases/threat-model-reviewer/`

The corresponding old-owner GitHub repository/latest/MSI aliases redirected successfully.
GitHub repository redirects do not imply GitHub Pages redirects.

The current repository cannot serve an HTTP redirect for a different username's
`github.io` origin. A continuity solution requires verified, authorized control of that
old Pages origin or assistance from its owner/GitHub. Ownership was not established by
the audit. Do not create a repository/account/domain, rewrite release history, or publish
a fake redirect claim to simulate continuity. Keep the existing canonical URLs under
`https://arasanirohithreddy.github.io/app-releases/` unchanged.

## Official references

Checked read-only on 2026-09-13:

- [Triggering workflows and GITHUB_TOKEN exceptions](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow)
- [Custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages REST settings](https://docs.github.com/en/rest/pages/pages?apiVersion=2022-11-28)
- Action inputs: [upload-pages-artifact v3](https://github.com/actions/upload-pages-artifact/tree/v3),
  [deploy-pages v4](https://github.com/actions/deploy-pages/tree/v4),
  [configure-pages v5](https://github.com/actions/configure-pages/tree/v5).
