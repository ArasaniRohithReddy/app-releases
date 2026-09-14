# Third-Party Notices

shot2code incorporates the third-party components listed below. This file is provided for
license-compliance review. shot2code itself is licensed under the
[MIT License](https://github.com/ArasaniRohithReddy/shot2code/blob/main/LICENSE); the
documentation and release assets in this hub are published under the
[MIT License](../../LICENSE).

*Principal direct dependencies, aligned with the public source on 14 September 2026. This is
**not** a complete list and not a transitive SBOM: each component brings dependencies of its own,
and the bundled runtimes below aggregate hundreds of separately licensed projects. For a
deployment or compliance decision, resolve the manifests and lockfiles named in
[Authoritative manifests](#authoritative-manifests) and inspect the license files shipped inside
the release you are assessing.*

The license column records the identifier each project declares in its own metadata at that date.
It is a pointer, not a legal determination, and it does not describe that project's dependencies.

---

## Bundled runtimes

These ship inside the Windows installer, which is why it unpacks to roughly 600 MB. They are the
largest licensing surface in the product and none of them is a single-license component.

| Component | Role in shot2code | Declared license |
| --- | --- | --- |
| **Electron** — includes Chromium and Node.js | The desktop shell that hosts the UI | MIT for Electron itself; the embedded **Chromium** is BSD-3-Clause **plus many other licenses**, and **Node.js** is MIT with its own bundled dependencies |
| **CPython** (3.11+) | The backend runtime, frozen into the app | Python Software Foundation License 2.0, with separately licensed standard-library components |
| **PyInstaller** | Freezes the backend; its bootloader is linked into the shipped executable | GPL-2.0-or-later **with the PyInstaller bootloader exception**, which permits bundling with applications under other licenses. Consult the project's own `COPYING.txt` for the exact terms and for the parts it licenses differently | 
| **`chromium-headless-shell`** (Playwright build) | The headless browser behind the screenshot-preview tool | BSD-3-Clause and other licenses, as for Chromium |

Chromium's full credit list is the authoritative record for both the Electron shell and the
headless shell; it is reachable from any Chromium-based browser at `chrome://credits` and is
shipped as a license file inside the respective distributions.

## Backend — principal direct dependencies

Declared in [`backend/pyproject.toml`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/backend/pyproject.toml)
and resolved by [`backend/uv.lock`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/backend/uv.lock).

| Component | Role | Declared license | Project |
| --- | --- | --- | --- |
| **fastapi** | HTTP and WebSocket application framework | MIT | <https://github.com/fastapi/fastapi> |
| **uvicorn** | ASGI server | BSD-3-Clause | <https://github.com/encode/uvicorn> |
| **websockets** | WebSocket protocol implementation | BSD-3-Clause | <https://github.com/python-websockets/websockets> |
| **pydantic** | Request and configuration models | MIT | <https://github.com/pydantic/pydantic> |
| **httpx**, **aiohttp** | HTTP clients used by the provider layer | BSD-3-Clause, Apache-2.0 | <https://github.com/encode/httpx> · <https://github.com/aio-libs/aiohttp> |
| **github-copilot-sdk** | GitHub Copilot provider, including its bundled Copilot CLI runtime | MIT | <https://github.com/github/copilot-sdk> |
| **openai** | OpenAI provider client | Apache-2.0 | <https://github.com/openai/openai-python> |
| **anthropic** | Anthropic provider client | MIT | <https://github.com/anthropics/anthropic-sdk-python> |
| **google-genai** | Gemini provider client, including video input | Apache-2.0 | <https://github.com/googleapis/python-genai> |
| **playwright** | Drives the bundled headless browser for screenshot preview | Apache-2.0 | <https://github.com/microsoft/playwright-python> |
| **pillow**, **pillow-heif** | Image decoding and conversion | MIT-CMU (HPND), BSD-3-Clause | <https://github.com/python-pillow/Pillow> · <https://github.com/bigcat88/pillow_heif> |
| **moviepy** | Screen-recording and video handling | MIT | <https://github.com/Zulko/moviepy> |
| **beautifulsoup4** | HTML parsing for URL input and generated output | MIT | <https://www.crummy.com/software/BeautifulSoup/> |
| **python-dotenv** | Reads `backend/.env` | BSD-3-Clause | <https://github.com/theskumar/python-dotenv> |
| **langfuse** | Optional generation tracing, off unless configured | MIT | <https://github.com/langfuse/langfuse-python> |

## Frontend — principal direct dependencies

Declared in [`frontend/package.json`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/frontend/package.json)
and resolved by [`frontend/pnpm-lock.yaml`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/frontend/pnpm-lock.yaml).
The frontend is compiled into static assets at build time, so its dependency tree is far larger
than the direct references below.

| Component | Role | Declared license | Project |
| --- | --- | --- | --- |
| **React**, **React DOM** | UI runtime | MIT | <https://github.com/facebook/react> |
| **React Router** | In-app routing (hash routing in the packaged app) | MIT | <https://github.com/remix-run/react-router> |
| **Radix UI** primitives | Accessible dialog, select, tabs, popover and related components | MIT | <https://github.com/radix-ui/primitives> |
| **CodeMirror 6** and its language packages | The editor in the Code tab | MIT | <https://github.com/codemirror> |
| **Tailwind CSS** | Styling for the app's own interface | MIT | <https://github.com/tailwindlabs/tailwindcss> |
| **Zustand** | Client state | MIT | <https://github.com/pmndrs/zustand> |
| **react-markdown**, **react-syntax-highlighter** | Rendering assistant messages and code | MIT | <https://github.com/remarkjs/react-markdown> |
| **react-dropzone**, **react-hot-toast**, **react-icons** | Upload, notifications and iconography | MIT | <https://github.com/react-dropzone/react-dropzone> |
| **html2canvas** | Client-side capture used by the preview tooling | MIT | <https://github.com/niklasvh/html2canvas> |
| **nanoid** | Identifier generation | MIT | <https://github.com/ai/nanoid> |

## Desktop shell

Declared in [`desktop/package.json`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/desktop/package.json).

| Component | Role | Declared license | Project |
| --- | --- | --- | --- |
| **electron** | The application shell (see [Bundled runtimes](#bundled-runtimes)) | MIT | <https://github.com/electron/electron> |
| **electron-updater** | Per-user NSIS update flow against the public GitHub Releases feed | MIT | <https://github.com/electron-userland/electron-builder> |

## Build- and test-time only (not distributed)

| Component | Role | Declared license |
| --- | --- | --- |
| **electron-builder** | Produces the NSIS `.exe`, `.msi` and portable `.zip` | MIT |
| **Vite**, **TypeScript**, **ESLint** | Frontend build and checks | MIT |
| **Jest**, **Vitest** | Frontend tests | MIT |
| **pytest**, **pytest-asyncio** | Backend tests | MIT |
| **pyright** | Backend type checking | MIT |
| **NSIS** | Windows installer engine used by electron-builder | zlib/libpng license |

## Code that shot2code generates

The output stacks — Tailwind CSS, Bootstrap, Bulma, daisyUI, Ionic, Alpine.js, htmx, Preact, Vue,
Material 3 and the rest — are **referenced by generated projects**, not redistributed inside the
app. A generated single-file export loads them from their public CDNs, and a generated project
folder declares them as ordinary dependencies that your own package manager resolves.

Their licenses therefore apply to the project you export, not to shot2code, and they are not
listed here. Generated code is model output: review its licensing, correctness and security
before you use it, as noted in [SECURITY.md](SECURITY.md).

## Authoritative manifests

| Layer | Manifest | Lockfile |
| --- | --- | --- |
| Backend | [`backend/pyproject.toml`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/backend/pyproject.toml) | [`backend/uv.lock`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/backend/uv.lock) |
| Frontend | [`frontend/package.json`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/frontend/package.json) | [`frontend/pnpm-lock.yaml`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/frontend/pnpm-lock.yaml) |
| Desktop shell | [`desktop/package.json`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/desktop/package.json) | [`desktop/package-lock.json`](https://github.com/ArasaniRohithReddy/shot2code/blob/main/desktop/package-lock.json) |

## Obtaining license texts

Full license texts are distributed with the packages themselves, not reproduced here. To resolve
exact versions and their licenses from a checkout of the source:

```powershell
cd backend;  uv tree
cd frontend; pnpm licenses list
cd desktop;  npm ls --all
```

Electron, Chromium and the headless shell ship their own license files inside the installed
application directory; those files, not this summary, are the record for a bundled runtime.

---

*If you believe a component is missing or mis-attributed, please
[open an issue](https://github.com/ArasaniRohithReddy/app-releases/issues/new/choose) so it can be
corrected.*
