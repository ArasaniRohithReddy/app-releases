# Public documentation expectations

- The threat-model-reviewer product guides are mirrored from the source repository's
  `docs/publication.json` map. Update the source guides, export with
  `scripts\sync-public-docs.ps1`, and run its `-Check` mode; do not fork the public copies.
- Update this hub's portal README and Pages when behavior changes, not just release notes.
- Keep MSI recommended for desktop installation. Document CLI and skill bundles
  separately; the skill requires the CLI.
- Do not advertise source-only work as released. Keep release snapshots generated
  by their workflow and historical notes intact.
- Use the synthetic sample for demonstrations and check the hero result against
  its JSON fixture. Never publish real customer models or Azure inventories.
- A model score is not system security or Microsoft approval. Model remediation
  does not patch application code or change deployments.
- Run `npm test` and inspect changed pages before publication, then verify the live site.
