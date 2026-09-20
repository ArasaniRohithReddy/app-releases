# Contributing to shot2code

shot2code lives in two public repositories, and the useful first question is
which one your contribution belongs to.

| You want to… | Go to |
| --- | --- |
| Change application code, add a stack, fix a bug in the app | **Source repository** — [ArasaniRohithReddy/shot2code](https://github.com/ArasaniRohithReddy/shot2code) |
| Report a bug or request a feature in a published Windows build | **This hub** — [open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) and pick **shot2code** |
| Correct or improve these published guides | **This hub** — start from the [shot2code documentation](README.md), then use **View source on GitHub** on the page you want to edit |
| Report a security vulnerability | **Privately** — see [SECURITY.md](SECURITY.md). Never in a public issue |

This hub publishes the Windows builds and their documentation. It does not
contain the application source, so a code change made here cannot reach the app.

Taking part in either repository means agreeing to the
[Code of Conduct](../../CODE_OF_CONDUCT.md). The hub's
[support policy](../../SUPPORT.md) sets the triage order and the response targets
that apply to issues filed here.

## Reporting a bug

A good report is worth more than a patch here, because the hard part of a fix is
reproducing the problem on a packaged Windows build.

1. Work through [TROUBLESHOOTING.md](TROUBLESHOOTING.md) first — it resolves most
   startup, provider, update and import problems without an issue.
2. Reproduce on the newest published release. Fixes land there, and **Settings**
   shows both the running version and the update state.
3. Include everything in
   [Reporting a problem](TROUBLESHOOTING.md#reporting-a-problem): version,
   install format, Windows build, provider and model, the exact error, and the
   tail of `%APPDATA%\shot2code-desktop\shot2code-backend.log`.

Feature requests are welcome in the same place. Say what you are trying to do
rather than which control you want added — the underlying task is usually the
part worth designing around.

## Improving these guides

The guides under `products/shot2code/` are authored in this hub, not mirrored
from anywhere, so a pull request here is the direct route to fixing them. Good
contributions include a wrong path, a step that no longer matches the shipped UI,
a missing symptom in [TROUBLESHOOTING.md](TROUBLESHOOTING.md), or a claim the
build does not actually support.

Two rules make a documentation change mergeable:

- **Describe the published build.** These pages are read by people deciding
  whether to install an unsigned binary. Do not document behaviour that only
  exists in source, and do not promise something the current release does not do.
- **Keep the links and the checks green.** The product page, this guide set and
  the hub's tests are validated together:

  ```powershell
  npm install
  npx playwright install chromium
  npm test
  ```

  `npm test` checks the generated documentation for drift, runs the content
  tests, and drives the published pages in a browser. Every internal link,
  heading fragment and help target in these guides is checked, so a renamed
  section is caught before it ships. `npm run build:docs` regenerates the native
  documentation pages when a source they are built from changes.

If a change touches the product page as well, `npm test` also runs the
accessibility, contrast and 320–1920 px reflow checks against it, at normal and
200% text size.

## Contributing code

Code contributions go to the source repository, which is public and accepts pull
requests. Read its
[CONTRIBUTING.md](https://github.com/ArasaniRohithReddy/shot2code/blob/main/CONTRIBUTING.md)
before you start; it is the authoritative version of everything below.

In short, expect to:

- Open an issue first for anything non-trivial — a new output stack, an API
  contract change, or a change to the on-disk history schema.
- Run the checks for the half you touched: `uv run pytest` and `uv run pyright`
  for the Python backend, `pnpm test`, `pnpm lint` and `pnpm build` for the
  React frontend, and both if your change crosses the boundary.
- Verify anything touching routing, asset paths, `window.open`, display capture
  or the backend port **in a packaged build**. The packaged app serves the UI
  over `file://` and the dev server serves it over `http://`; that one
  difference has caused every desktop-only bug so far.
- Leave versions alone. `desktop/package.json` holds the released version and is
  bumped only by a release, never by a feature change. Release tags and
  published assets are not edited by hand — see [RELEASING.md](RELEASING.md) for
  how a build becomes a release in this hub.

## No secrets, ever

This applies to issues, pull requests and attachments in both repositories.

- Never commit or paste API keys, GitHub tokens, `backend/.env` or `.env.local`.
- Redact keys and tokens from logs, screenshots and fixtures **before** you
  attach them. Public issues are permanently indexed.
- Do not attach `history.sqlite3` or exported projects: they contain your prompts
  and your generated code.
- If you leak a credential, revoke it with the provider immediately. Deleting the
  comment or rewriting history is not a substitute.
- Found a vulnerability? Do not open a public issue — follow
  [SECURITY.md](SECURITY.md).

## Licensing

The application is MIT-licensed in its
[source repository](https://github.com/ArasaniRohithReddy/shot2code/blob/main/LICENSE),
and the documentation and release assets in this hub are published under the
[MIT License](../../LICENSE). Contributions are accepted under the same terms as
the repository you send them to. Components that ship inside the app are listed
in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
