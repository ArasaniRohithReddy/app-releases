# Releasing shot2code to this hub

How a shot2code build becomes a published release here. The engineering process —
version bump, build, smoke checks, rollback — lives with the code in
[`docs/RELEASING.md`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/docs/RELEASING.md)
in the project repository. This page is the hub-side contract.

## Tags

Releases in this repository are shared by several products, so every tag is
product-prefixed:

```
shot2code-v<x.y.z>
```

The version is the one in the project's `desktop/package.json`, which is what
electron-builder stamps into the installer filename, what `latest.yml` advertises,
and what **Settings** displays. Tags are never moved or reused.

## Assets attached to a hub release

| File | Purpose |
| --- | --- |
| `shot2code-<version>-x64.exe` | Per-user NSIS installer — the recommended download and the only self-updating format |
| `shot2code-<version>-x64.msi` | Per-machine managed deployment |
| `shot2code-<version>-x64.zip` | Portable build |
| `SHA256SUMS.txt` | SHA-256 hashes for the published files |

The project's own release additionally carries `shot2code-<version>-x64.exe.blockmap`
and `latest.yml`. Those are **updater inputs**, not downloads for people:
`latest.yml` is the `electron-updater` manifest (version, filename, size, SHA-512)
and the blockmap is what makes a differential download possible. The hub's pages
therefore never present them as download options, although they do appear in a
release's complete file listing when they are attached.

Because the binaries are unsigned, `SHA256SUMS.txt` is the verification story —
publish it with every release.

## Release notes

Hub release notes summarise the version and link to the upstream release for the
full notes. Keep them accurate about:

- what changed (features, fixes),
- which downloads exist and which is recommended,
- the fact that the binaries are unsigned and may trigger SmartScreen.

Then mirror the same summary into [CHANGELOG.md](CHANGELOG.md) here.

## After publishing

1. Confirm the asset list:

   ```powershell
   gh release view shot2code-v<version> --json assets --jq '.assets[] | "\(.name)  \(.size)"'
   ```

2. The `update-releases-snapshot` workflow regenerates
   `docs/shot2code/releases/releases.json` from the GitHub API on release events,
   on a schedule, and on demand. The releases page renders that same-origin
   snapshot first and then refreshes from the live API, so a rate-limited visitor
   still sees the list. To refresh it by hand:

   ```powershell
   gh api -H "Accept: application/vnd.github.html+json" `
     "repos/ArasaniRohithReddy/app-releases/releases?per_page=100" `
     --jq '[ .[] | select(.draft == false) | select(.tag_name | startswith("shot2code-v")) |
             { tag_name, name, published_at, prerelease, body_html,
               assets: [ .assets[] | { name, size, download_count, browser_download_url } ] } ]
           | sort_by(.published_at) | reverse' > docs/shot2code/releases/releases.json
   ```

3. Nothing else on the site needs a version edit. The product page resolves the
   **newest stable release whose tag starts with `shot2code-v`** and fills in the
   version chips, the download links and sizes, the SHA-256 verification command
   and the `softwareVersion` in its structured data from that release. Its static
   fallbacks point at the product-filtered release list, which carries no version
   and so cannot go stale.
4. Update [CHANGELOG.md](CHANGELOG.md) with the new version, and any guide whose
   behaviour changed.

## Rollback

- If a release is broken for everyone, mark it as a pre-release or delete the
  release. The hub pages select the newest **stable** release, so both actions
  take it out of circulation while keeping the tag.
- Never delete or replace an installer that clients may already be downloading
  while its manifest is still live.
- The updater does not downgrade: the real fix for a bad build that people have
  already installed is to publish the next patch version.
