# Pages deployment and snapshot preservation

## Status: retain legacy publishing while artifact capacity is unproven

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

The coordinator reported that **account Actions artifact storage quota recently blocked
ordinary test-artifact uploads**. Optional diagnostic/release-backup uploads are distinct
from the required Pages deployment artifact. **GitHub Releases uploads are unaffected**, but their success is not proof
that an Actions Pages artifact can be uploaded. `upload-pages-artifact@v3` uses
`upload-artifact@v4`, so the Pages path may encounter the same quota constraint.

**Do not switch off the working publication path to discover whether upload works.**
Keep Pages at `build_type: legacy`, source `main:/docs`, and keep
**`PAGES_DEPLOY_ENABLED=false`** (or unset) while artifact-backed publication is unproven.
No cleanup or deletion of old artifacts, releases or history is approved.

## Safe immediate path: validate snapshots without artifact storage

The reviewed snapshot safeguard can be integrated independently of Pages migration:
Native documentation is likewise compiled from the stable public Markdown and committed
under `docs/`; legacy branch publishing can serve those HTML files directly. Regenerate
with `npm run build:docs`, commit source/output together, and pass `npm run check:docs`
before updating the publishing branch. No new artifact-dependent publishing path is
required just to make guides readable on the site.

```text
release / schedule / manual snapshot refresh
  checkout current default branch
  fetch all API pages → validate/merge saved history → commit candidate locally
  npm test → clean-tree check → normal fast-forward push
    existing legacy Pages publisher remains configured at main:/docs
  explicitly dispatch site-checks.yml on main (also when the snapshot is unchanged)
main push / manual site-check dispatch
  checkout immutable github.sha → npm test
  PAGES_DEPLOY_ENABLED=false → no Pages artifact upload or Actions deployment
```

- Candidate snapshot validation happens **before updating the publishing branch** and
  does not require an Actions artifact upload. Quota must not be worked around by dropping
  tests, skipping validation, or enabling publication without its required artifact.
- With the deployment opt-in disabled, ordinary checks also need no artifact upload.
  Failure-only diagnostic uploads are distinct from a Pages deployment artifact: every
  Actions Pages deployment requires its artifact, even when all tests pass.
- Coordinate other main changes so their candidate site trees are validated before the
  branch is updated. Legacy publishing still does not wait for the post-push check job;
  pre-push snapshot validation is a useful safeguard, **not a full legacy deployment gate**.
- Do not enable the Pages deployment flag as a quota probe. This follow-up does not
  implement or run an upload-only probe or remote deployment rehearsal. Obtaining that
  evidence is a separate owner-approved task; if unavailable, stay on legacy publishing.

## Optional artifact-backed path: a separate evidence-backed migration

```text
owner-approved candidate validation and upload evidence, with legacy still serving
  separately approved cutover trial with captured prior configuration and rollback
  source=workflow + PAGES_DEPLOY_ENABLED=true
  checkout immutable github.sha → npm test → verify unchanged tree
  archive committed docs at that SHA → upload SHA-named artifact
  deploy needs successful check job + canonical repo + main branch + opt-in
  verify Pages mode and current main SHA → deploy that run's checked artifact
```

- PRs run checks only: no Pages artifact or deployment, and no Pages write/OIDC permission.
- Production runs are serialized, not canceled mid-deployment. A newer pending run replaces
  an older pending run under GitHub's concurrency rules.
- The deploy preflight rejects superseded SHAs. A main update arriving after that preflight
  can leave a previously checked revision live briefly; the queued main run must itself pass
  before replacing it. Deployment always uses the artifact of its own successful check job.
- No cross-workflow artifact lookup, `workflow_run` privilege handoff, PAT or new secret is needed.
- `configure-pages` has `enablement: false`; the workflow will not silently enable Pages.

## Deferred migration: evidence required before any source change

Repository: **`ArasaniRohithReddy/app-releases`**.

1. **Keep the current live site and prior Pages configuration in place.** Review and validate
   candidate changes before updating `main`; keep the deployment variable disabled.
   Do not make the Pages source change a prerequisite for installing the artifact-independent
   snapshot safeguards. This supersedes the earlier switch-source-before-merge recommendation.
2. Obtain explicit owner approval for any remote upload test and verify actual capacity for
   the **candidate Pages artifact**, required permissions, and the intended deployment path.
   A green local test, YAML check, unrelated artifact, or GitHub Releases upload is insufficient.
   Do not move Pages/test artifacts into Releases as a quota workaround.
   Quota can change between a probe and deployment; account for any retained probe artifact
   and the production upload without deleting old artifacts to make room.
3. **A successful upload is not a successful Pages deployment.** This repository has one
   production Pages origin; these workflows do not provide an independent production preview.
   If candidate deployment cannot be proven safely using existing authorized infrastructure
   or a separately approved, monitored cutover trial, **defer migration**. Do not claim that
   an unexecuted workflow has proven deployment, or create infrastructure to simulate proof.
4. For an approved trial only, capture the actual prior Pages configuration, serving SHA,
   approved `main:/docs` tree and workflow/run IDs. Arrange a rollback window and drain old
   publishing runs (or have an authorized operator cancel those specific runs, not delete them).
   Preserve the serving site and monitor it throughout; do not assume a source change
   automatically retains availability.
5. Only after those prerequisites, in **Settings → Pages → Build and deployment → Source**,
   choose **GitHub Actions**.
   The required remote API state is **`build_type: "workflow"`**, replacing `"legacy"`.
   This is the necessary change that closes the independent branch-publishing path.
   Use the reviewed `site-checks.yml` publisher; do not add a second starter deployment
   workflow that bypasses its checks.
   Do not delete/unpublish Pages, change the canonical hostname, or create a CNAME.
   Keep the last successful deployment; if availability or the trial fails, use the explicit
   prior-configuration rollback below instead of assuming another artifact upload will succeed.
6. Verify the existing **`github-pages` environment** permits deployments from **`main` only**.
   Optional required reviewers add a manual approval to every deployment, including scheduled
   snapshot deployments; choose that policy deliberately.
7. Set repository Actions variable **`PAGES_DEPLOY_ENABLED`** to the string **`true`** in
   **Settings → Secrets and variables → Actions → Variables**. Leave it unset or `false`
   until source/environment configuration and the reviewed workflow are ready.
   This is a non-secret opt-in, not a credential.
8. Manually run **Site and documentation checks** (`site-checks.yml`) on `main`.
   Manual dispatch ensures a run even if the previous commit carried a CI-skipping marker.
   The workflow revalidates the captured SHA before uploading or deploying.
9. Verify the successful check run's `head_sha`, the `github-pages-<SHA>` artifact, and the
   resulting Pages deployment SHA agree. Check portal → product → recommended MSI, CLI,
   skill and release-history paths live. Only a successful deployment plus live verification
   proves the migration; then allow normal artifact-backed deployment.

Do not substitute an earlier probe's artifact into a different run. The deployment run
revalidates its captured SHA and uploads its own artifact; probe success alone cannot
guarantee that second upload or the production deployment will succeed.

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

## Explicit rollback to the prior Pages configuration

The release worker recorded this prior configuration. Capture it again before an approved
trial and restore the actual captured values if they differ:

```json
{
  "build_type": "legacy",
  "source": { "branch": "main", "path": "/docs" },
  "https_enforced": true,
  "cname": null
}
```

1. Set `PAGES_DEPLOY_ENABLED=false` (or unset it) to prevent future Actions deployments.
   Have an authorized operator cancel or drain specific pending/in-flight deployment runs;
   the variable does not stop a job already running. Coordinate publishing-branch writes.
2. Confirm `main:/docs` contains the approved known-good site content before restoring
   branch publishing. If a bad candidate changed it, use a reviewed, validated **normal
   revert commit**, retaining release history/data and the artifact-independent snapshot
   safeguards. Never reset/force-push history or move tags.
3. In **Settings → Pages → Build and deployment → Source**, restore **Deploy from a branch**,
   select **`main`** and **`/docs`**, and save. The remote mode returns to **`build_type: "legacy"`**.
   Restore the recorded HTTPS/custom-domain values; the audited baseline uses HTTPS and
   has no CNAME. Do not delete/unpublish Pages or create a new domain/account/repository.
4. Verify the resulting build/deployment and the three live routes, downloads and release
   history. **Restoring the configuration does not pin the prior deployed SHA**: legacy
   publishing builds the configured branch head. Verify the intended known-good content,
   not merely the setting or a green job.
5. Record that this explicit availability rollback restores the **ungated legacy publisher**.
   Retain pre-push candidate snapshot validation and defer another migration attempt until
   quota, permissions and deployment evidence support it.

This rollback does not delete old artifacts/releases or rewrite history. A source-only
rollback through the Actions path is also possible when that path is proven operational,
but it is **not the only recovery plan when artifact upload itself is blocked**.

## Additional failure boundaries

- This gate governs the Pages artifact, not independent release publication or the
  visibility of raw GitHub documentation on `main`. Coordinate repository branch controls
  separately; links to `blob/main` can change independently of a deployed Pages artifact.
- If checks, upload, permissions, dispatch or deployment fail, verify the serving version
  immediately. Keep the existing working publication path when migration is unproven, or
  perform the approved prior-configuration rollback if a cutover trial changed it.
  Do not describe a new SHA as live merely because a commit, upload or check job exists.
- Snapshot validation may intentionally block publication when a release changes package
  contracts or produces invalid data. Fix the contract/tests deliberately; never remove
  historical releases/assets to make a check pass.
- Pages artifacts use one-day retention. Upload still requires available Actions artifact
  storage/quota; expiration is not proof that capacity has already been reclaimed.
  No cleanup job, retention shortening of existing artifacts, or deletion of artifacts,
  releases or history is approved to reclaim space.
- If an artifact has expired, or rerunning the upload job conflicts with an existing
  SHA-named artifact in that same run, dispatch a **new** workflow run on current main.
  Do not delete preserved artifacts or deploy an artifact from a different run to work around it.
- To pause future guarded deployments, unset/set `PAGES_DEPLOY_ENABLED=false`; an already
  running deployment requires separate operator attention. Returning to the captured
  legacy configuration is an explicit availability rollback, not a claim of continued gating.
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
