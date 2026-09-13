# Public documentation expectations

- The threat-model-reviewer product guides are mirrored from the source repository's
  `docs/publication.json` map. Update the source guides, export with
  `scripts\sync-public-docs.ps1`, and run its `-Check` mode; do not fork the public copies.
- The shot2code guides under `products/shot2code/` are authored here, not mirrored. Keep them
  accurate against the public source repository (`ArasaniRohithReddy/shot2code`) and the
  published release; do not promise behavior the shipped build does not have.
- Each product owns its own pages, release snapshot and tag prefix (`‹app›-v‹x.y.z›`). Never
  resolve a download from `/releases/latest`: it is repository-wide and returns whichever
  application shipped most recently.
- Do not type a release version into a page. Resolve it from the release feed and let the static
  fallback point at the product-filtered release list, so a new build cannot leave a stale
  version, download link or structured-data claim behind.
- Update this hub's portal README and Pages when behavior changes, not just release notes.
- Keep MSI recommended for Threat Model Reviewer desktop installation, and the per-user NSIS
  `.exe` recommended for shot2code (it is the only self-updating format). Document CLI and skill
  bundles separately; the skill requires the CLI.
- Do not advertise source-only work as released. Keep release snapshots generated
  by their workflow and historical notes intact.
- Use the synthetic sample for demonstrations and check the hero result against
  its JSON fixture. Never publish real customer models or Azure inventories.
- A model score is not system security or Microsoft approval. Model remediation
  does not patch application code or change deployments.
- Run `npm test` and inspect changed pages before publication, then verify the live site.
