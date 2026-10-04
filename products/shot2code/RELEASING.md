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

## Two repositories, one history

The complete release history is kept in **both** repositories, and each has a job:

| Repository | Tag | Role |
| --- | --- | --- |
| [ArasaniRohithReddy/shot2code](https://github.com/ArasaniRohithReddy/shot2code/releases) | `vX.Y.Z` | **Canonical.** The source of the build and the feed `electron-updater` reads, so `latest.yml` must keep describing the binaries attached beside it |
| [ArasaniRohithReddy/app-releases](https://github.com/ArasaniRohithReddy/app-releases/releases) (this hub) | `shot2code-vX.Y.Z` | The published download and documentation home. It mirrors the same build, with **every** file that release carries |

Mirroring means mirroring: a hub release keeps the updater's own inputs
(`latest.yml`, the `.exe.blockmap`) attached alongside the installers, and they
show up in a release's complete file listing on the releases page. What the
public cards deliberately do **not** do is offer them as downloads — they are
machine inputs, and presenting them next to an installer would invite someone to
download the wrong file. Hiding them from the cards is a presentation choice, not
a gap in the mirror.

Nothing is pruned. Builds that predate the MSI or `SHA256SUMS.txt` stay listed
with exactly the files they were published with, so the page never implies a
download that does not exist. Only releases from 0.3.0 onwards have entries in
[CHANGELOG.md](CHANGELOG.md), because nothing earlier was tracked in a changelog;
their notes still live on the releases in both repositories.

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
and the blockmap is what makes a differential download possible. Attach them to
the hub release too — the mirror is only complete if it carries every file — but
the hub's download cards never present them as options, although they do appear
in a release's complete file listing.

Because the binaries are unsigned, `SHA256SUMS.txt` is the verification story —
publish it with every release.

## Release notes

Hub release notes summarise the version and link to the upstream release for the
full notes. Keep them accurate about:

- what changed (features, fixes),
- which downloads exist and which is recommended,
- the fact that the binaries are unsigned and may trigger SmartScreen.

Then mirror the same summary into [CHANGELOG.md](CHANGELOG.md) here.

## Final screenshot capture contract

This is the capture plan for the public input-tab atlas and the supporting
Review/Settings presentation. It is deliberately **versionless**: do not put a
release number in a filename, caption or screenshot-only page claim.

### One reproducible capture environment

Use the release-candidate desktop build with a new, capture-only profile:

- Windows display scaling: **100%**
- app zoom: **100%**
- browser/device scale factor: **1**
- output: sRGB PNG, one image pixel per CSS pixel
- capture target: the app content viewport only — no desktop, taskbar, window
  shadow or post-capture crop
- project/evidence: the synthetic **Northwind Analytics** fixture,
  `https://example.com`, and `octocat/Spoon-Knife` only; no customer code,
  private URL/repository, account name or local path
- provider state: no real provider account or key. Input-tab captures may show
  the honest disabled/unconfigured state. Use only explicitly fake endpoint
  values when a settings field must be demonstrated, and keep the connection
  switched off so no network call occurs
- key handling: no live credential is permitted. Inspect final PNGs at 400% and
  delete the isolated capture profile
- MCP state: one unauthenticated local fixture named **Demo component library**,
  left disabled and untrusted with write tools off, so the safe installation
  default is visible; no remote tenant or account

Wait for fonts, preview rendering and Review results to settle. Dismiss update
notices, toasts, tooltips and permission prompts. Move the pointer outside the
capture, stop caret/selection blinking where possible, and never edit or
recompress the resulting PNG. If a final UI label differs from this plan, use
the shipped label and update the page's alt text and caption in the same change;
never stage a screenshot of placeholder UI.

### The current screenshot set

All dimensions below are required PNG pixel dimensions.

| File | Dimensions / theme | Required state |
| --- | --- | --- |
| `input-upload.png` | `1426 × 893`, light | Upload selected; empty screenshot/video drop zone and generation controls visible |
| `input-url.png` | `1426 × 893`, light | URL selected with `https://example.com`; before inspection/capture |
| `input-text.png` | `1426 × 893`, light | Text selected; empty prompt, examples, stack and model controls visible |
| `input-import.png` | `1426 × 893`, light | Import selected; HTML/project modes plus Built Storybook entry visible |
| `input-figma.png` | `1426 × 893`, light | Figma selected; scoped REST requirement, preview action and MCP Catalog limitation visible |
| `input-github.png` | `1426 × 893`, light | GitHub selected with `octocat/Spoon-Knife`; local-open versus first-refinement copy, model picker and design-system choice visible |
| `input-stitch.png` | `1426 × 893`, light | Stitch selected; Stitch only and Convert to selected stack modes visible |
| `url-design-inspection.png` | `1426 × 893`, light | Completed `example.com` inspection with full-page responsive dimensions, blank/truncation state and DESIGN.md actions visible |
| `github-imported-project.png` | `1426 × 893`, light | Public Spoon-Knife project open in the editable Preview/Chat workspace |
| `review-workspace-og-light.png` | `1920 × 1008`, light | Northwind Analytics open; source/runtime Review, category filters and health state visible |
| `mcp-menu-light.png` | `1440 × 900`, light | MCP settings showing the synthetic server disabled, untrusted and write-disabled |
| `byok-settings-dark.png` | `1440 × 900`, dark | BYOK settings switched off; additive/separate credential explanation visible |
| `review-workspace-tablet.png` | `768 × 1024`, light | Completed Review in the shipped tablet/single-column navigation |

### Planned additions

These versionless filenames belong to the capture contract, but must not be
referenced from `docs/shot2code/index.html` or generated guides until the exact
PNG exists and has passed the same dimension, secret and responsive checks:

| File | Dimensions / theme | Required state |
| --- | --- | --- |
| `ollama-settings-light.png` | `1440 × 900`, light | BYOK card after **Configure local Ollama**, with localhost endpoint and install/hardware/model caveats visible |
| `page-reader-settings-dark.png` | `1440 × 900`, dark | Separate bounded page-reading consent, limits and blocked built-in `web_fetch` explanation |
| `iconify-settings-light.png` | `1440 × 900`, light | Iconify opt-in, fixed origin, currently-keyless caveat, SPDX policy and trademark warning |
| `chat-tools-light.png` | `1440 × 900`, light | Chat Tools inventory showing consent, provider cost, MCP write scope and enabled Skills honestly |
| `full-history-light.png` | `1440 × 900`, light | Cross-project Full history search with project/version totals |
| `history-expanded-light.png` | `1440 × 900`, light | Expanded version showing requested models, options, prompts, activity and retry/branch ancestry |

The lead uses `1920 × 1008` because it is exactly **40:21**, the same ratio as a
`1200 × 630` social card. It can therefore be scaled by an Open Graph consumer
without cropping the app toolbar or Review result. When these files land:

1. Keep all seven input tabs visible in the product page's Input tabs section,
   with the URL inspection and GitHub imported-project outcomes directly below.
2. Point `og:image` at `review-workspace-og-light.png`, set its declared size to
   `1920 × 1008`, and write alt text for only what is visibly present.
3. Give the lead a `40 / 21` aspect wrapper, input/outcome/desktop-detail images
   a `16 / 10` wrapper, and the tablet image a `3 / 4` wrapper.
4. Keep the site's documented `object-fit: contain` policy and neutral frame.
   Never switch a product screenshot to `cover`: letterboxing is acceptable,
   loss of UI is not.
5. Update each `<img width height>`, link label, alt and caption with the same
   commit. Every alt must describe the visible state and the true dimensions.
6. From the `app-releases` repository, run `npm test`; it includes the
   dimension, aspect, reflow and Open Graph checks. Then inspect the light/dark
   galleries and 320px/200%-text portal captures.

Before approval, inspect every image for exposed keys or tokens, account names,
email addresses, avatars, filesystem paths, repository names, clipboard
content, notification text, timestamps and background-window reflections.
Passing an automated test is not a secrets review.

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
