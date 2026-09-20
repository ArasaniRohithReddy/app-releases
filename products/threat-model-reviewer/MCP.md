# Optional MCP review context

The restricted profiles, `mcp` CLI controls, separate credentials and SDK
context/tool restrictions described here are included in **v2.7.0**.
Use matching app, CLI and skill releases.

## Readiness and setup corrections in v2.7.0

**v2.7.0 corrects** a false
readiness failure: the native SDK can report a connected server and advertised
tools before its lazy effective-tool catalogue exists. The adapter now calls
`session.tools.initializeAndValidate` before inspecting that catalogue. The exact
three-tool Learn allowlist, schema checks, permission gates and timeouts remain.
No AI prompt or resource operation is needed to initialize it.

Maintainers can repeat the native public-Learn check with the opt-in
`NativeLearnMcpTests` fixture. Set `TMR_VALIDATE_PUBLIC_LEARN_MCP=1`,
`TMR_PUBLIC_LEARN_RUNTIME` to the approved runtime executable and
`TMR_PUBLIC_LEARN_RUNTIME_SHA256` to its independently approved digest, then run
the fixture with a nonzero TRX report. It uses the production adapter and restricted
profile, reaches only the public Learn endpoint and verifies all three schemas
without sending a model prompt or invoking a resource tool. Normal test runs skip
this network-dependent check. Synthetic fixtures also model the initially empty
catalogue so this ordering defect cannot pass unnoticed again.

Starting with version 2.7.0, `mcp setup microsoft-learn`, `mcp setup azure` and
`mcp setup github-review-context` explain prerequisites without starting servers,
installing packages, signing in or querying Azure. Learn needs no PAT or local npm
server. Azure MCP needs Node/npx and the approved pinned package; Azure CLI alone
does not install it. **Build from Azure (CLI)** remains the separate installed-CLI
inventory workflow with explicit subscription/group selection.

### GitHub sign-in versus repository authorization

Copilot sign-in supplies model entitlement. A custom GitHub MCP connection also
needs authorization to read repositories; the SDK does not infer or enlarge it.
The [official GitHub MCP installation guide](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-copilot-cli.md)
distinguishes the standalone CLI's built-in server from separately configured
servers. The [SDK MCP guide](https://github.com/github/copilot-sdk/blob/v1.0.11/docs/features/mcp.md)
provides server configuration, not an automatic account-authorization promise.

The v2.6.0 profile uses a selected-repository fine-grained PAT. Version 2.7.0
additionally offers **Use GitHub CLI sign-in**, or:

```powershell
ThreatModelReviewer.Cli.exe mcp credential github-review-context --github-cli --consent
```

This explicit action reads `gh.exe auth token --hostname github.com` from the
installed GitHub CLI, with ambient Copilot/GitHub/provider token variables removed
from that child. It never runs `gh auth login`, prompts for extra scopes or obtains
a token automatically when opening settings. Run the normal GitHub CLI sign-in
yourself first if needed. Its account may differ from Copilot, and its repository
access can be broader than a fine-grained PAT; review that before consenting.

The credential is copied to the app's current-user DPAPI store and the source
remains disabled until separately enabled. It is not a live link to `gh`: signing
out or changing accounts there does not delete the stored copy. Use
`mcp forget-credential github-review-context` to remove that copy, and use GitHub
to revoke a credential when required. Revocation can also affect the CLI identity
that originally supplied it. Only the same three read tools are exposed.

Credential-isolation tests must inject synthetic readers or use a genuinely
separate OS identity. An empty `GH_CONFIG_DIR` alone is not proof that `gh`
cannot access an existing credential source such as the OS credential store.
Never run a production credential import as an assumed no-account test against
a normal user profile.

OAuth is another supported GitHub MCP authentication model when the host owns a
registered OAuth/GitHub App and its lifecycle. This product does not claim that its
Copilot device-flow token is a repository credential or silently forward it to MCP.
No new OAuth app registration or token-scope grant is created by setup.

### Approved proxies and managed package access

An organization-approved proxy can carry package-manager traffic; it does not
override approval of the package, endpoint or executable. Ask IT to approve the
pinned Azure MCP artifact and its download/runtime dependencies before testing.
The app does not configure a proxy, install a server, disable TLS checks or retry
an administrator-blocked package through a mirror, another registry or another
package manager.

Microsoft documents several [Azure MCP installation formats](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/get-started),
and npm documents [proxy configuration](https://docs.npmjs.com/cli/v11/using-npm/config#https-proxy).
Those are technical capabilities, not authorization to bypass a device policy.
An IT-approved, preinstalled distribution can instead use a reviewed custom
descriptor as described below; the built-in `azure` profile remains pinned to
`@azure/mcp@2.0.5` with its two restricted read operations.

Proxy reachability, Azure sign-in, tool/schema readiness and authorization to a
particular Azure scope are separate checks. On the release-verification host,
actual Azure MCP startup remains unverified because package approval is pending.
Learn's hosted endpoint and the separate Azure CLI inventory workflow do not
establish Azure MCP readiness.

Upstream settings were verified on **2026-09-13** using the primary sources below.

The release checks include synthetic SDK protocol/permission coverage, package
runtime hashes and live model-catalogue discovery without inference. These do not
establish access to every repository, Azure scope or external MCP service.

MCP adds tools to **Copilot advisory AI requests**, not to the deterministic
rubric. Reading repository evidence or Azure metadata cannot establish that a
mitigation is implemented, deployed, effective, or approved by Microsoft.
Retrieved content is untrusted evidence to review, not instructions to obey.

**MCP, SDK, API and tool are different layers.** MCP is the protocol for
discovering and calling named tools over HTTP or stdio. The pinned GitHub
Copilot SDK is this app's client/runtime integration and owns those sessions.
A tool (for example `issue_read`) is a named operation with an input schema;
its server may call a service API behind it. Adding a descriptor does not
install another AI SDK or prove that any tool is available or executable.

## Defaults and network boundaries

- The MCP master switch and **every
  individual profile default off**.
- Opening MCP settings, listing/showing configuration, checking local credential
  readiness, storing/forgetting a PAT, and changing switches do **not** start an
  MCP service or perform a network authentication probe.
- A connection starts only on an explicit single/selected/all-enabled probe,
  or on an applicable Copilot AI request after both switches permit it.
- CLI AI requests additionally require `--mcp` on that invocation. Normal
  `<model.tm7>` review and deterministic `ask` remain offline, even with saved
  MCP settings enabled. `--mcp` alone is a usage error, not implicit AI consent.
- MCP is not attached to the offline or OpenAI-compatible provider. Existing
  Copilot sign-in/model listing and the app's optional update checks are separate
  from these MCP gates; this is not a claim that the whole desktop startup is
  network-free.

Read the disclosure and tool list before enabling each profile. **Read-only is
not the same as nonsensitive.** Tool arguments may contain details from a finding
or question; returned data can enter Copilot's provider context. Do not query
private material unless your organisation permits sending it to that provider.

## Restricted profiles

The SDK `Tools` field is an enforced, nonempty allowlist—not the informational
`DeclaredCapabilities` field and never a factory wildcard.

There is also a **session-wide source-qualified allowlist** containing only the
selected MCP tools (`mcp:<server>-<tool>` via SDK `ToolSet.AddMcp`). When MCP is
off, the session has an explicitly empty tool list. Native coding/shell tools
are not enabled by this advisory provider. Configuration discovery, ambient
plugins, skills and file hooks are disabled so a user's unrelated Copilot CLI
configuration cannot silently attach other sources.
Tool-search deferral is explicitly disabled for these small allowlists.
The permission handler independently rejects native, unknown, cross-profile
and managed-approval-required tool requests rather than using blanket approval.

Tool filtering alone is **not** an ambient-context policy. We explicitly retain
`CopilotClientMode.CopilotCli` solely to preserve intentional CLI/keychain seat
authentication, without redirecting its auth filesystem or extracting tokens.
The remaining ambient defaults are explicitly closed:

- host git operations and file-change tracking: off;
- embedding retrieval: skipped; any embedding cache: in-memory, not persistent;
- session memory, session store, infinite sessions and session telemetry: off;
- experimental mode, remote session export/steering and MCP Apps: off;
- custom-instruction discovery, skills, file hooks and coauthor/scheduler
  features: off; custom agents limited locally, with no agents supplied;
- the coding-agent system prompt is **replaced**, not appended to; its
  `environment_context`, working-directory, git, directory-listing and runtime
  instruction sections are not implicitly carried into the model;
- after SDK default application, an additional mandatory options update sets
  `installedPlugins=[]` and repeats the instruction/agent/coauthor/scheduler
  restrictions **before the session is returned to any caller**. Failure closes
  the session rather than continuing with permissive defaults.

This is the explicit-closure alternative to SDK Empty mode. Empty mode changes
`COPILOT_HOME`/keytar behavior and requires a dedicated filesystem arrangement;
changing modes without supplying a compatible auth path would break existing
CLI sign-ins. Tests execute the installed **1.0.11** defaulting methods and
capture its actual post-default JSON-RPC payloads, not just our input POCO.

The SDK's **implicit `github-mcp-server` is explicitly disabled**, including on
connection-test and advisory sessions. This is important: SDK 1.0.11
defaults to Copilot CLI behavior, which is not the same as this application's
consent. Only the separately named `github-review-context` profile can provide
the shipped GitHub tools. Disabling the implicit server does not bypass or
disable authentication/elicitation on selected servers.

| Profile ID | Transport / destination | SDK tool allowlist |
| --- | --- | --- |
| `microsoft-learn` | HTTP, `https://learn.microsoft.com/api/mcp` | `microsoft_docs_search`, `microsoft_docs_fetch`, `microsoft_code_sample_search` |
| `azure` | Local stdio via the pinned command below | `group_list`, `subscription_list` |
| `github-review-context` | HTTP, `https://api.githubcopilot.com/mcp/readonly` | `get_file_contents`, `issue_read`, `pull_request_read` |

**Microsoft Learn:** no credential is required. Query terms go to Microsoft
Learn; documentation returned to the assistant can ground recommendations.
Query text can still reveal model details. It does not inspect your deployment.

**Azure metadata:** the exact server arguments are:

```text
npx -y @azure/mcp@2.0.5 server start --read-only --tool group_list --tool subscription_list
```

This can download a package from npm and start a local process. It requires
Node.js/npx and a usable Azure Identity sign-in (for example `az login`).
Authentication and elicitation are **not disabled**. Server filtering and the
SDK allowlist both limit the tools. Subscription/resource-group names, IDs, tags
and other returned metadata may be sensitive.

**Managed package policy still applies.** If Windows Security reports
"This content is blocked by your IT admin" / `[TE] NPM URL Block`, stop the
affected bootstrap and request IT approval. That notification is policy
evidence; it does not identify a blocked URL unless the notification or
administrator provides one. Do not disable security controls, switch
registries/mirrors/CDNs, copy unapproved packages, or remove tool/authentication
restrictions to evade it. The application does not attempt an alternate
download. A missing PAT for a **disabled GitHub profile** is not an explanation
for Azure's local npm bootstrap failure.

The upstream **2.0.5** server-start tests verify these unprefixed names.
`@latest` pointed to **3.0.0-beta.43** at verification time; it is deliberately
not used. `azmcp_`-prefixed examples are not the pinned-version contract.
`group_resource_list` and `storage_account_get` are **not enabled**: their
pinned-version behavior was not independently validated for this implementation.
No secret retrieval, data-plane content, CLI extension, namespace proxy, or
broad resource-configuration tool is included. Direct deterministic Azure
discovery remains a separate feature.

**GitHub review context:** the server map includes exactly these non-secret
headers, in addition to a late-bound Authorization header:

```text
X-MCP-Readonly: true
X-MCP-Tools: get_file_contents,issue_read,pull_request_read
```

The Authorization value is resolved from the DPAPI-protected named secret
`github-review-context-pat`. It is never a descriptor literal or a command-line
argument. The read-only endpoint, headers and SDK tool selection are enforced
together; changing the endpoint does not leave a misleading “read-only” badge.
Custom descriptors cannot reference that reserved GitHub secret name to forward
the PAT to a different service.

The selected tools may return file contents, issue bodies/comments, PR
descriptions/diffs/reviews and other repository information. A useful app
assistant question identifies an **authorised repository and specific file,
issue, or PR** and asks what that evidence supports or leaves unverified.
For example, using synthetic/public examples only: “Compare the authentication
assumptions in this finding with the design file I identified; cite the file
revision and distinguish design intent from deployment evidence.”

## GitHub credential setup in the app

1. Open **Assistant data sources (MCP)** from the app's Help menu.
2. Read the GitHub card's destination, tool list and disclosure.
3. In GitHub's **Settings → Developer settings**, create a **separate
   fine-grained PAT**. Select only the repositories needed for this review.
   Grant **Contents: read**, **Issues: read**, **Pull requests: read**, and
   GitHub's required **Metadata: read**. Choose a short expiry and obtain any
   organisation approval required by GitHub.
4. Choose **Set / replace PAT…** and paste that PAT into the password field.
   The field clears before asynchronous storage, on errors and on close.
   There is no password data binding or retained token property.
5. Saving does **not** enable GitHub. Review the disclosure, enable that source,
   then enable the master switch.
6. Optionally choose **Test only this source** on the GitHub card. It initializes
   GitHub and lists its allowed tools, without starting other configured
   sources. It sends no threat-model content and invokes no resource tools.
   The initialization itself can contact services. The probe runtime closes
   before its result is reported.

The application **never extracts `gh` credentials**, acquires a GitHub PAT
automatically, or reuses the Copilot device-flow token as an MCP credential.
Copilot seat authentication and the GitHub MCP PAT are different concerns.

“Ready locally” means the descriptor, PAT shape and local DPAPI decryption
passed. It is **not** a remote validation of repository selection, permissions,
expiry, subscription entitlement or organisation approval. Even successful
tool listing does not prove access to a particular private repository.

**Forget credential** deletes the stored value, disables every dependent
profile and tears down the manager's connection-test runtime. Replacing the PAT
also disables dependents so a potentially different scope requires a new enable
decision. Revoke the PAT in GitHub when it is no longer needed; forgetting a
local copy is not remote revocation.

## One server or multiple servers

**Connection scope is per MCP server, not per tool.** A server exposes the
explicit allowed tools listed on its card. One Copilot SDK diagnostic session
can attach one or several selected servers; it does not create a separate
connection option for each tool name.

The app has three explicit probe actions:

- **Test only this source** on a card tests that server alone.
- **Include in selected test** marks a transient selection; **Test selected**
  tests exactly those marked servers.
- **Test all enabled** tests every currently enabled source, including
  Azure/npx if Azure is enabled.

Probe selection is **not consent**. The master and every requested source
must already be enabled, with readable required credentials and no pending
re-consent notice. The whole selection is checked before a runtime or seat
auth source is accessed. Unknown IDs, individual tool names used as IDs,
duplicates, an empty explicit selection, disabled/unconsented sources or
missing credentials reject the whole probe; valid sources in that rejected
selection are not started as a fallback. Testing never flips saved switches.

Selecting only Learn, only GitHub, or Learn plus GitHub does **not** bootstrap
Azure/npx, even when Azure is also saved enabled. This is useful when IT has
blocked npm; it does not remove that restriction or authorize a workaround.
The saved source checkboxes remain the selection for **subsequent AI requests**.
Probing Learn alone does not silently narrow or broaden that AI selection:
explicitly disable other sources if future AI requests must use Learn only.
An already-running AI request is a separate session, not this probe's runtime.

Results distinguish **saved configuration**, **completed probe evidence** and
**live AI-session connectivity**. A probe initializes/lists only, performs
bounded cleanup, and reports historical transport/tool/schema results as
"Probe passed/failed (closed)". Its runtime is no longer counted as connected.
If cleanup cannot be confirmed, that failure remains explicit and the probe
does not succeed. Cancellation during cleanup is also reported as cancellation,
even if tool metadata had already been discovered successfully. The settings
dialog retains only the latest in-memory
probe until settings change/reload; CLI `show`/`status` in another invocation
do not invent or persist that history. Neither surface claims to observe a
live AI-session connection from a completed probe.

## CLI setup and use

Use the executable name appropriate to your source build/CLI package.

```powershell
ThreatModelReviewer.Cli mcp list
ThreatModelReviewer.Cli mcp show github-review-context

# Hidden interactive input; the PAT is not part of the command line/history.
ThreatModelReviewer.Cli mcp credential github-review-context

ThreatModelReviewer.Cli mcp enable github-review-context --consent
ThreatModelReviewer.Cli mcp on --consent
ThreatModelReviewer.Cli mcp status

# One consented server; does not initialize Azure or Learn.
ThreatModelReviewer.Cli mcp test github-review-context

# Explicit selection, only if each source has separately been enabled.
ThreatModelReviewer.Cli mcp test microsoft-learn github-review-context

# Backward-compatible: all currently enabled servers, including Azure if enabled.
ThreatModelReviewer.Cli mcp test

# Advisory AI only; the deterministic verdict/score is still computed locally.
ThreatModelReviewer.Cli samples/customer-portal.tm7 --explain --mcp
ThreatModelReviewer.Cli fix samples/customer-portal.tm7 --ai --mcp --out draft.tm7

ThreatModelReviewer.Cli mcp disable github-review-context
ThreatModelReviewer.Cli mcp forget-credential github-review-context
ThreatModelReviewer.Cli mcp off
```

`fix --ai --mcp` drafts **threat-model notes**, not application code, issue
writes, pull-request changes, or deployed mitigations. Review drafts before use.
The existing advisory fallback remains available if Copilot cannot answer.

For automation, arrange for your secret manager to inject a **dedicated**
environment variable into the process, then pass **its name**, not its value:

```powershell
ThreatModelReviewer.Cli mcp credential github-review-context --env TMR_REVIEW_PAT
# Remove the variable from your shell when provisioning is complete.
Remove-Item Env:TMR_REVIEW_PAT -ErrorAction SilentlyContinue
```

There is no `--token` option, positional token value, redirected-stdin token
mode, or ambient token discovery. Common `GH_TOKEN`, `GITHUB_TOKEN`,
`COPILOT_GITHUB_TOKEN` and related seat-token variable names are refused.
Do not put a PAT into shell history, URLs, descriptors, scripts, screenshots,
logs or command-line arguments. Environment variables are not encrypted;
restrict who can inspect the provisioning process.

`mcp list` / `status` report **configured settings and local readiness**, not a
fabricated live connection. They never initialize a service, even if settings
enable it. `mcp help` describes every action:

- `show <id>`: disclose destination/scope/tools.
- `on --consent` / `off`: master gate.
- `enable <id> --consent` / `disable <id>`: per-profile gate; enable requires
  local credential readiness.
- `credential github-review-context [--env NAME]` / `forget-credential ...`.
- `reset <id>` / `remove <id>`: reset a built-in disabled, or remove a custom
  profile. This does not silently delete a PAT; use forget for that.
- `import <descriptor.json> --consent`: validate and save a custom definition
  **disabled**, regardless of its JSON `Enabled` value. Custom profiles must
  currently be **credential-free**. `HeaderSecretRefs` and
  `EnvironmentSecretRefs` are rejected with a precise message until a complete
  generic app/CLI setup-and-forget lifecycle exists. Do not inline a token as a
  workaround. The dedicated GitHub credential remains bound to its endpoint.
- `test <server-id>`: initialize/list only that already-enabled source, then close.
- `test <server-id> <server-id> ...`: initialize/list exactly the selected
  already-enabled sources, then close.
- `test`: unchanged all-enabled scope, then close. No wildcard or tool-name
  selection expands the approved per-server tool allowlists.

MCP command exit codes are **0** for success and **1** for bad usage,
configuration/readiness/input failure, or an unsuccessful connection test.
`list`/`status` return 1 when configuration load/migration warnings need
attention. A default disabled GitHub profile needing its first credential is
normal, not a failing command. `test` with no effective sources returns 1
without starting anything. **2** remains the deterministic review's gating
exit code; MCP never changes it.

## Storage, upgrades and long-running application instances

Settings live in `%LOCALAPPDATA%\ThreatModelReviewer\mcp-servers.json`.
Named secret values are encrypted with **Windows DPAPI, CurrentUser**, through
the existing secret-storage mechanism. MCP refuses plaintext, arbitrary
base64, and the historical non-Windows `plain:` fallback. Credential storage is
Windows-only; there is no false claim of encrypted cross-platform storage.
Ordinary file permissions still matter.

For isolated tests or an intentionally separate local profile, the optional
`THREATMODELREVIEWER_MCP_ROOT` environment variable overrides the settings
directory. Explicit constructor roots take precedence. Never point it at an
untrusted shared directory. Automated tests use disposable roots and synthetic
credentials, not the real user's configuration.

Configuration schema **2** applies these conservative rules:

- Saved legacy or modified built-ins—including a user-customized narrower
  variant—are reset to the current vetted definition **while disabled**.
  The old customization is not treated as consent to the replacement.
  Persistent `ReviewRequired` notices explain the reset until explicit
  review/enable or replacement. Reading settings alone never rewrites the file.
- Reserved built-in IDs are checked again at the SDK-map boundary regardless
  of a hand-edited `IsBuiltIn` flag. Only their `Enabled` setting is mutable.
  The SDK's implicit `github-mcp-server` name cannot be used for a custom
  profile; use a credential-free custom ID or the supported GitHub profile.
- Custom credential-free profiles with valid explicit allowlists keep their configuration.
  Legacy custom profiles without an allowlist, empty/wildcard lists, invalid
  transport fields or inline credential settings are rejected, with a notice;
  they are not silently assigned a guessed subset. Re-import a reviewed
  definition under a custom ID. Custom tools may read sensitive data or write;
  the app/CLI do not certify them as read-only.
- Custom profiles containing secret references are rejected on import, load
  and SDK-map validation, even if a referenced encrypted value happens to
  exist. Previously stored unsupported credentials are not forwarded to any
  server. This conservative restriction replaces the earlier incomplete
  custom-credential setup story.
- Unknown schema versions and corrupt files fail closed. Missing/unreadable
  credentials disable dependent saved profiles. Invalid ciphertext is not
  treated as a usable credential.

An unrelated settings save preserves re-consent notices. Saving uses atomic
file replacement, avoiding a partially written configuration at session
creation. Do not hand-edit a file while another process is saving settings.

The app already supplies its manager's `BuildSessionServerMap` callback to the
Copilot provider. **Every new AI request reads the current file again**, not a
cached map, so CLI changes, file deletion, changed endpoints or credential
removal affect subsequent work in an already-running app. The provider reuses
its Copilot **client**, but creates and disposes an SDK **session per request**;
it never resumes a session with stale MCP permissions. Connection-test runtimes
are stopped on manager changes, reload and disposal.

Connection tests read a **current Copilot seat callback** supplied by the app,
snapshot it once per attempt, and invalidate the discovery cache when it
changes. The same snapshot reaches the real SDK client options. A null
snapshot retains intentional logged-in CLI auth. This callback never reads the
GitHub MCP PAT, and no token is copied into a process-wide environment variable.
The app integration below must supply the token used by its successful provider
probe; the AI/MCP assembly never automatically harvests device-flow or `gh`
credentials. The separately consented GitHub CLI import in version 2.7.0 described
above is a local credential-copy action, not part of probing or AI startup.

That separation is **not environment isolation**. SDK-hosted stdio children
normally inherit their host's environment. The stdio configuration overlay
therefore clears these known credential keys, without reading their values:
`COPILOT_GITHUB_TOKEN`, `GITHUB_COPILOT_TOKEN`, `COPILOT_TOKEN`, `GH_TOKEN`,
`GITHUB_TOKEN`, `GH_ENTERPRISE_TOKEN`, `GITHUB_ENTERPRISE_TOKEN`,
`OPENAI_API_KEY`, `AZURE_OPENAI_API_KEY`, and `ANTHROPIC_API_KEY`.
It does not clear the intentionally used Azure identity chain or arbitrary
unrecognized variables, and cannot prevent a same-user process from reading
local files/identity stores. **Local MCP servers are not sandboxed.** Review
their trust boundary and remove unrelated sensitive environment values before
launching the app/CLI; do not infer universal secret isolation from the masks.
Synthetic child-process tests verify inheritance and the transmitted overlay,
not every third-party/native runtime's environment-merging implementation.

The obsolete standalone account/quota probe has been retired: no shipping
app or CLI path invoked it. Its test-only wiring assertions were removed,
not replaced by a fake call or orphan-guard exemption. Existing sign-in,
model selection, authenticated MCP connection testing and bounded shutdown
continue through the provider/manager/runtime path. This does not promise a
new account/quota dashboard. The unused public `CopilotAccountProbe.ProbeAsync`
API is removed; callers outside the shipping app/CLI must not depend on it.

Connection readiness comes from the SDK server **Status**, not the absence of
an error string. Pending/unreported servers are polled up to the bounded
connection deadline (90 seconds by default). `ListToolsAsync` is called only
after **Connected**. The version 2.7.0 adapter then initializes the SDK tool catalogue
before checking effective metadata; an advertised name alone is not a successful
schema check. Needs-auth, stopped, disabled, failed and unsupported
statuses are terminal for that attempt. Timeout, cancellation, missing tools
and authentication-required classifications survive into app/CLI status with
locally authored messages; remote error text is never shown.

Each failure identifies the **source ID and last observed stage**: local
configuration/credential readiness, shared Copilot runtime startup, shared
session creation, local stdio/bootstrap or hosted HTTP initialization,
source authentication, tool/schema discovery, or owned shutdown. If a runtime
does not report a stage, the UI says so rather than guessing. Azure bootstrap
guidance points to Node.js/npx and organisation package approval; GitHub
authentication guidance points only to its separate scoped PAT. Raw server
text, even text resembling a security notification, is not trusted as policy
evidence or copied into diagnostics.

The manager and production runtime now share the **same work-deadline token**.
At the unchanged 90-second default, further discovery work is cancelled.
The deadline-aware runtime gets at most the existing graceful interval
(2 seconds by default) to return already-completed per-source results;
this is cancellation reporting, **not extra tool-execution time**.
Previously, a racing outer timeout could discard ready Learn/GitHub results
while Azure was still pending/unreported. Such results now remain distinct,
and late tool-list completion cannot be promoted to ready after cancellation.
An uncooperative custom runtime does not receive that reporting privilege.
Failure to return a bounded report triggers the existing bounded teardown.
Caller cancellation and final shutdown still revoke the whole attempt.

This isolation depends on the SDK having created a session and reported
individual source states. A shared startup/session failure cannot establish
per-source readiness, and the app does not claim otherwise. Use a single or
explicitly selected hosted-source probe to omit Azure bootstrap without
changing saved consent. Disable Azure explicitly if future AI requests must
also omit it. Do not automatically enable GitHub, acquire a PAT, or change
any other source's consent to compensate for a failing source.

**Configured, connected and tool-ready are separate states.** `mcp show <id>`
and the app card show the configured tool names and curated capabilities
without connecting. After a single/selected/all-enabled probe, each allowed
name is reported as missing, discovered-but-unavailable, missing/invalid
schema, or available in the SDK's effective metadata with a valid object
input schema. The SDK metadata uses `input_schema`; a transport connection
or a server's `tools/list` response alone is not readiness evidence.
Cross-profile, duplicate, blank, deferred or unrecognized runtime names do
not establish availability. Partial failures remain explicit and CLI testing
returns 1. No resource tool is invoked by connection testing.
The metadata belongs to the completed probe, not to an indefinitely connected
server. The existing lower-level `RefreshAsync` diagnostic-runtime API retains
its compatibility behavior; App/CLI test actions use the scoped, auto-closing
`TestConnectionsAsync` path and do not reuse its live discovery cache.

The app and CLI share the same tool presentation and restricted maps.
`OpenAI-compatible` and `Offline` providers **do not attach MCP profiles**,
even if the settings are enabled. CLI MCP-enabled AI remains limited to
review `--explain --mcp` and `fix --ai --mcp`; deterministic `ask` does not
become another MCP/AI engine. Connection testing itself uses the Copilot SDK.

Graceful SDK teardown has a **2-second** default deadline, followed by a
separate **2-second** force-stop deadline on failure **or a hang**. The manager
also bounds misbehaving `IMcpRuntime` implementations with an outer watchdog
(the runtime's two phases plus 100 ms, then its own force-stop deadline).
Only the owned client's process tree is targeted by the SDK force-stop API.
If even force-stop fails or hangs, termination is reported **unconfirmed** and
that manager blocks further MCP connections. CLI `mcp test` returns 1 for this
condition instead of claiming clean success.

Deadline-critical shutdown dispatch and supervision do not use the shared
ThreadPool. Each phase invokes the SDK on an independent background thread;
an independent supervisor enforces the existing deadlines even if the SDK
blocks synchronously before returning a task. Window-owned provider shutdown
also bypasses the default pool. Otherwise pool contention can leave both the
graceful and force-stop callbacks queued, with neither one invoked. A callback
that has not started when its deadline expires is not subsequently admitted
as stale graceful work. SDK-internal asynchronous work can still time out;
that remains **unconfirmed**, never a success-shaped fallback.
Phase success is measured using a monotonic timestamp at callback completion,
not the time an overloaded scheduler next runs the supervisor. A late observer
must not falsely report a timely, completed force-stop as unconfirmed.

Shutdown cancels admission and in-flight waits, joins an already-running
settings teardown, and clears connected/tool status without rewriting saved
consent. Late SDK start/session results are never published and have cleanup
continuations attached. Managed semaphore/CTS objects are deliberately not
disposed while cancelled waiters can still release/register against them; no
WaitHandle is used. Registered AI providers (including not-yet-published
sign-in probes) share the window manager's **final** lifetime. An ordinary
provider reconnect disposes only its provider, not the manager.

This is not retroactive erasure. In-flight work may already have used a tool,
and returned context may already exist in the conversation/provider. Cancel
active work and revoke the PAT if immediate credential invalidation is needed.
The application cannot recall data already sent to a provider.

The scheduling safeguards remove shared-pool
dependencies from deadline-critical cleanup and uses callback-completion
timestamps rather than delayed observer timing. Production's finite shutdown
deadlines and exact SDK opt-outs are unchanged. Its wire-test fixture uses
separate finite setup/create budgets and context-independent I/O; those are
test-harness changes, not new end-user AI request timeouts.

## Troubleshooting and validation limits

During v2.6.0 qualification, synthetic stress runs encountered intermittent
cold-start permission timeouts. That release candidate subsequently passed the
full local and hosted suites with the original transaction deadlines. This is
historical release evidence, not acceptance of later development changes; the
earlier observations are not erased or claimed to have one conclusively identified
cause. Check system load and provider availability before retrying. A timeout is
a failure, not connection evidence.

Version 2.7.0 preserves an incomplete-shutdown warning whether cleanup is rejected
by the manager's watchdog or reported directly by the runtime. It blocks new MCP
session maps and reconnect attempts after either outcome, including sources that
otherwise reported ready. A completed task does not establish that its child
processes have stopped; no connection or cleanup deadline is extended.

- **GitHub credential missing/unreadable:** set a new separately scoped fine-grained
  PAT, review consent and enable again. Version 2.7.0 and later also support the
  explicit GitHub CLI sign-in import described above. DPAPI blobs are not portable
  to another Windows user. Neither option is an Azure bootstrap remedy.
- **Azure initialization failed:** check Node.js/npx, access to the pinned npm
  package and organisation policy. An unreported server or timeout alone does
  **not** prove a policy block. If Windows Security or IT explicitly reports
  one, stop and obtain approval; do not retry through another download source
  or alter managed security controls. Azure Identity sign-in is a separate
  authentication stage. Do not "fix" either stage by selecting `@latest`,
  removing tool filters, or disabling authentication/elicitation.
- **GitHub tools list but a repository cannot be read:** review the credential's
  repository grants, read permissions, expiry and approval. For a PAT, check its
  selected repositories; for an explicitly imported CLI credential, check the
  imported account's existing access. Copilot sign-in does not enlarge either.
  Tool listing does not test a resource operation.
- **Configuration changed during a running app:** reopening settings reloads
  local status; the next Copilot request independently reloads its authority.
- Remote exception bodies, HTTP errors and tool descriptions are withheld from
  status/diagnostics because they can echo Authorization or private content.
  Status retains only configured allowed tool names. AI failures are sanitized
  without an original inner exception; transient retry classification remains.
- Runtime logging, session telemetry, cross-session store and infinite-session
  features are explicitly off. This does not erase information already sent
  to a provider, change that provider's terms, or certify the native runtime's
  filesystem behavior without a native-runtime test.
- The password UI/CLI buffer is cleared, but managed strings required for DPAPI
  and the SDK cannot be guaranteed zeroed in process memory. Nothing promises
  protection against an attacker already controlling the same Windows user.

**An IT-approved preinstalled server is administrator-provided configuration,
not an automatic workaround.** An administrator may supply a reviewed,
credential-free stdio descriptor under a **custom ID**, using an approved
already-installed entrypoint and verified artifact. Existing `mcp import
<descriptor.json> --consent` accepts that kind of descriptor but saves it
disabled. Inspect the actual ID with `mcp list` / `mcp show`, confirm its
explicit metadata-only tools and version-appropriate read-only arguments,
and obtain separate enable consent. The app neither invents an executable
path nor downloads/copies an alternative package, and the reserved `azure`
profile remains unchanged. Custom profiles are not certified read-only by
the app; IT must approve both the artifact and its execution under local
policy. A credential-bearing custom descriptor is still rejected. Managed
npm approval remains an IT blocker, not something these code changes lift.

The focused tests use synthetic runtime states and the **real SDK 1.0.11
assembly**, including its post-default application methods and a loopback
JSON-RPC sink capturing actual serialized session creation/options updates.
That sink does not run a Copilot executable, model or resource tool. Coverage
includes every provider path, file/credential removal while a session exists,
CLI parsing/exit codes, offline review, auth-source rotation, pending-to-connected
polling, ignored cancellation, hanging session/client/manager disposal,
force-stop hangs, late results and final shutdown after connection testing.
Scheduling regressions deliberately withhold the fixture creator's
synchronization context and, in an exclusive test collection, temporarily
make only the test process's ThreadPool unavailable. Before the scheduling
fix, SDK startup depended on dispatching that creator context, and direct
provider/window-owner shutdown invoked neither graceful nor force-stop
callbacks during the bounded pool hold. The same regressions now require
progress without releasing those scheduling constraints, including
synchronous callback hangs. Deadline-order lifecycle fixtures share that
exclusive collection with the process-global scheduling fixtures: their
40 ms/100 ms synthetic budgets must not race unrelated corpus/serializer
tests. Dedicated hang/force tests retain those short deadline assertions.
The reconnect ownership fixture instead uses production cleanup bounds and
asserts exactly which provider is disposed; it does not test sub-100ms thread
admission. Configuration, policy, CLI and SDK-wire tests remain parallel with exact wire/plugin
assertions. Restoration of the original process ThreadPool limits is also
checked when a contention observation throws. The loopback transport's I/O continuations explicitly
avoid capturing test/UI synchronization contexts.
SDK fixture arrangement/startup and the session-create/post-default-options
transaction each retain their own finite **10-second** I/O deadline. They do
not share a nearly exhausted cancellation token: under group contention that
cancelled the exact-options test during session creation. The original
opt-out/plugin assertions and the existing provider hang test are unchanged.

A separate integrated-suite failure exposed an invalid fixture-state
assumption: the whole-connection deadline can expire during SDK startup,
before any session exists. The readiness test must not dereference a
null-forgiven `LastSession` after merely observing a timeout. Pending and
unreported polling coverage now establishes a synthetic session and observes
its first poll before arming the unchanged real **80 ms** readiness deadline.
A separate real **80 ms** whole-connection regression deliberately stalls
startup and requires `TimedOut`, no session, no tools and no session creation
after the late startup completes. Production connection/shutdown bounds are
unchanged; this is state-based fixture separation, not timeout inflation or
removal of the no-tool assertions.
That startup test uses production cleanup bounds independently of its
unchanged 80 ms work deadline; an unrelated 40 ms cold-thread teardown budget
must not mask the startup result. Its observer covers the work deadline plus
both configured cleanup phases and a scheduling margin; it does not extend
the runtime's deadlines. Explicit hang/force tests retain their short deadline
assertions and unconfirmed-failure behavior.

Additional source-isolation regressions force the manager's deadline to
win while two hosted sources have already listed their tools. They require
both hosted results to remain ready, Azure to remain explicitly failed,
and shutdown to clear all live state. An actual-SDK loopback fixture also
reports Azure pending/unreported before a terminal bootstrap failure,
checks all six hosted tool names/schemas independently, and verifies App/CLI
source/stage guidance without interpreting a synthetic remote "NPM URL Block"
string as policy evidence. Eight distinct synthetic tool operations are
permission-checked through the SDK protocol; unknown/write/cross-profile
requests never reach the synthetic tool handler. None of those fixtures
authenticates to GitHub/Azure or invokes production resource operations.
Scoped-probe regressions additionally cover one/several/all enabled servers,
whole-selection refusal before startup, immutable queued selections, unchanged
saved AI consent, and closed-probe versus live-status separation. Actual SDK
session maps and off-screen WPF control actions verify that a hosted-only
selection never includes Azure. No user window, npm bootstrap, real credentials
or inference is used by these checks.
The owned off-screen fixture windows carry an **ISOLATED OFFLINE VERIFICATION**
title and use `ShowActivated=false` / `ShowInTaskbar=false`; they are never
shown and close only their own synthetic test instances. Production window
titles and the user's normal app/profile are not changed. These are WPF
component/routed-click and programmatic checkbox checks, **not** native UIA,
physical keyboard, mouse, foreground focus or screen-reader acceptance.
They do not establish whether a normal signed-in app can list Copilot models.

A later eight-tool regression reproduced a first-permission response stall
in the headless SDK fixture, not a resource operation: the notification was
written and the policy callback was observed, but no matching permission RPC
response reached the fixture before the unchanged 20-second transaction
deadline. That observation alone does not establish a production SDK defect
or prove that scheduler contention was the sole cause.

The investigation did prove a separate fixture transaction-boundary error:
it reported completion on receipt of the SDK's permission decision, before
writing the RPC acknowledgement. Completion now follows acknowledgement
flush and writer release, so the next transaction cannot inherit that
unfinished fixture write. A condition-based regression checks this ordering.
The discovery timer is disposed at the end of discovery; every tool still
has its original finite 20-second budget, all eight tool/schema assertions
and all six denied-request assertions remain, and fourteen actual policy
callbacks are required. If another deadline fails, test diagnostics retain
only phase timings, callback/RPC counts, reader state and SDK exception
**types**/numeric event IDs, never log payloads, formatted state, exception
messages, credentials or content. Peer reader termination closes its owned
socket rather than stranding SDK cleanup. These are test-fixture changes,
not increased production connection/teardown limits or authenticated-service
compatibility claims; the original stall still needs correlated combined-run
diagnostics if it recurs.

The final parent TRX confirms that its only MCP failure was this permission
case; it does not include callback/transport phase data. Additional headless
coverage runs four independent real-SDK clients concurrently and retains
the original eight-tool case. Three consecutive 28-test SDK/policy batches
passed without deadline changes. This is bounded reproduction evidence,
not proof that the earlier intermittent stall is eliminated. Test-only
diagnostics now also report the pinned SDK's write-slot/pending-request
counts and stream type names; they never inspect stream contents or pending
request payloads. SDK notification-dispatch exceptions logged at Debug are
captured as type/numeric-ID only, with a regression forbidding formatting
their state or messages. No production logging or model inventory is changed.

The reported combined-suite failures had no exception detail in the original
quiet output; the supplied two-test TRX recorded only a passing rerun.
Controlled before/after failures establish the scheduling defects above.
A later MCP-group run also reproduced the original wire test as a
`TaskCanceledException` in SDK session creation, exposing the shared-budget
problem. This is not a recovered stack trace for the parent's original
quiet run. Coordinator combined-suite validation is still required after
integrating this fix.

They do not query private repositories or Azure. No live credentialed access
or permission validation is claimed. The SDK's pinned Copilot CLI is **1.0.79**;
current validation registers the coordinator's verified executable through
the supported **`CopilotCliBinaryPath`** MSBuild property. Skipping the runtime
download or using stale output is not packaged-runtime compatibility evidence.
The integration review initially identified a missing Debug runtime and a
stale Release copy of CLI **1.0.64**; neither was used as compatibility
evidence. The coordinator subsequently supplied the verified executable,
registered through `CopilotCliBinaryPath` with TLS validation retained.

A bounded native probe using SDK **1.0.11** and a fresh, credential-free
profile verified local stdio startup, ping, runtime status, session creation,
metadata readback, explicit options-update acceptance, synthetic local MCP
initialization/tool listing, and graceful owned shutdown. Runtime status
reported **1.0.79 / protocol 3**, matching package/FileVersion/ProductVersion.
The separately observed `--version` banner was **1.0.84-5**; it is not equated
with those other version surfaces.

The native fixture received only `initialize`, `notifications/initialized`
and `tools/list`; no resource tools, auth APIs or model-send APIs were invoked.
The no-inference handler and deny proxy observed zero requests (not an OS
packet-capture claim). Readback confirmed an isolated working directory,
`selectedModel=null` and `isRemote=false`. Options acceptance is not a full
effective-options or model-context proof.

Two cold-profile starts exceeded 12-/25-second deadlines with incomplete
self-extraction directories. Copying only the completed public package cache
from an isolated protocol run into another fresh profile allowed all guarded
local-only stages to pass. That historical auth-free probe used the already
verified Copilot package; it is **not** a recipe for evading a managed npm
restriction or permission to copy an unapproved Azure server package.
Successful-run SDK teardown completed gracefully,
the owned Job Object was empty, all observed probe PIDs were confirmed absent,
and disposable profiles/extraction caches were removed. Evidence is retained
in the session's test artifacts. No shared app source was changed by the probe.
This verifies the **Empty-mode, auth-free local boundary**, not authenticated
production-mode behavior, GitHub/Azure access, inference, or final packaging.

## Coordinator app integration reference (already applied)

The coordinator has applied this wiring to the generation worker's shared files.
Do not reapply these hunks to an already integrated branch.
Do **not** replace its other changes, or the coordinator's accessibility
Label/Name additions in `McpCredentialDialog.xaml` (the follow-up does not edit
that XAML file). Preserve the existing `BuildSessionServerMap()` callback.

### A. Current seat injection and window-owned provider registration

```diff
--- a/ThreatModelReviewer.App/ViewModels/MainViewModel.cs
+++ b/ThreatModelReviewer.App/ViewModels/MainViewModel.cs
@@
-    public Ai.Mcp.McpConnectionManager Mcp { get; } = new();
+    private string? _copilotSeatTokenForMcp; // Copilot seat only, never the GitHub MCP PAT.
+    public Ai.Mcp.McpConnectionManager Mcp { get; }
@@
     public MainViewModel()
     {
+        Mcp = new(copilotSeatToken: () => System.Threading.Volatile.Read(ref _copilotSeatTokenForMcp));
         SelectedTabIndex = OverviewTabIndex; // Overview is the home/empty state
@@
         var provider = new ResilientAiProvider(
-            new CopilotProvider(githubToken, mcpServers: () => Mcp.BuildSessionServerMap()));
+            new CopilotProvider(githubToken, mcpServers: () => Mcp.BuildSessionServerMap(), lifetimeOwner: Mcp));
@@
             _ = await provider.ListModelsAsync(cts.Token);
+            if (Mcp.IsDisposed) { await provider.DisposeAsync(); return false; }
+            System.Threading.Volatile.Write(ref _copilotSeatTokenForMcp, githubToken);
             _sharedAi = provider;
@@
     public async Task ShutdownAiAsync()
     {
+        System.Threading.Volatile.Write(ref _copilotSeatTokenForMcp, null);
         if (_sharedAi is not null)
```

`lifetimeOwner: Mcp` is essential: registering **before**
`ListModelsAsync` means final shutdown also owns a pending sign-in provider
that has not yet been assigned to `_sharedAi`. Registration after final
disposal is inert and cannot start another client.

### B. Final shutdown, distinct from provider reconnect

Add this method after `ShutdownAiAsync`; retain `ShutdownAiAsync` for existing
reconnect/provider-switch callers. Only final window closing calls the new
method:

```csharp
/// <summary>Final window shutdown; do not use for provider reconnect.</summary>
public async Task ShutdownAsync()
{
    try { await Mcp.DisposeAsync(); }
    finally { await ShutdownAiAsync(); }
}
```

```diff
--- a/ThreatModelReviewer.App/MainWindow.xaml.cs
+++ b/ThreatModelReviewer.App/MainWindow.xaml.cs
@@
-                if (DataContext is MainViewModel vm) await vm.ShutdownAiAsync();
+                if (DataContext is MainViewModel vm) await vm.ShutdownAsync();
```

The existing close-cancel/await/re-close behavior should remain. If cleanup is
unconfirmed, `Mcp.ShutdownWarning` is a sanitized message suitable for local
status; do not assert that the native process was terminated.

The coordinator reports passing integrated MCP/UI-wiring tests covering
seat injection and final ownership. Retain that coverage when merging later
changes; final packaged and authenticated runtime validation remains separate.

## Researched follow-up: Azure DevOps

Do **not** add an unusable Azure DevOps checkbox. The remote endpoint pattern
`https://mcp.dev.azure.com/{organization}` requires **Microsoft Entra OAuth**.
The supported custom-app flow/client registration is a follow-up; it cannot be
replaced by copying a Copilot PAT. No Azure DevOps profile or OAuth promise is
shipped here.

## Primary sources (verified 2026-09-13)

- [Microsoft Learn MCP developer reference](https://learn.microsoft.com/training/support/mcp-developer-reference):
  HTTP endpoint and the three documentation tools.
- [Azure MCP concepts](https://learn.microsoft.com/azure/developer/azure-mcp-server/concepts)
  and [tool documentation](https://learn.microsoft.com/azure/developer/azure-mcp-server/tools/):
  authentication, filtering and read-only limitations.
- [Azure MCP Server 2.0.5 release](https://github.com/microsoft/mcp/releases/tag/Azure.Mcp.Server-2.0.5).
- [Pinned 2.0.5 server-start tests](https://raw.githubusercontent.com/microsoft/mcp/Azure.Mcp.Server-2.0.5/core/Azure.Mcp.Core/tests/Azure.Mcp.Core.Tests/Areas/Server/ServerStartCommandTests.cs)
  and [service-start options](https://raw.githubusercontent.com/microsoft/mcp/Azure.Mcp.Server-2.0.5/core/Microsoft.Mcp.Core/src/Areas/Server/Options/ServiceStartOptions.cs):
  exact unprefixed tools and read-only/tool switches.
- [GitHub MCP README](https://github.com/github/github-mcp-server/blob/main/README.md)
  and [remote-server documentation](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md):
  `/readonly`, `X-MCP-Readonly`, `X-MCP-Tools`, and PAT authentication.
- [Azure DevOps remote MCP](https://learn.microsoft.com/azure/devops/mcp-server/remote-mcp-server?view=azure-devops):
  remote transport and Entra OAuth follow-up.
- Local resolved NuGet package `GitHub.Copilot.SDK` **1.0.11**, its XML API
  documentation and `build/GitHub.Copilot.SDK.targets`: actual
  `GitHub.Copilot.McpHttpServerConfig`, `McpStdioServerConfig`,
  `SessionConfig.McpServers`, and the download-skip build property were checked
  against the installed dependency and compiled, not guessed from older Learn
  namespace examples.
- Additional public-only verification against the SDK **v1.0.11** tag:
  [ToolSet source](https://github.com/github/copilot-sdk/blob/v1.0.11/dotnet/src/ToolSet.cs),
  [ToolSet tests](https://github.com/github/copilot-sdk/blob/v1.0.11/dotnet/test/Unit/ToolSetTests.cs),
  [client/session serialization](https://github.com/github/copilot-sdk/blob/v1.0.11/dotnet/src/Client.cs),
  and the [disabled MCP server end-to-end tests](https://github.com/github/copilot-sdk/blob/v1.0.11/nodejs/test/e2e/disabled_mcp_servers.e2e.test.ts)
  verify source qualification and the exact implicit `github-mcp-server` name.
  The latter tests verify that disabling that server prevents initialization
  requests even when GitHub MCP features would otherwise be enabled.
- The same tagged SDK `Client.cs` supplies `ApplyConfigDefaultsForMode`,
  `GetSystemMessageConfigForMode` and the post-create options patch. The
  [SDK client lifetime unit tests](https://github.com/github/copilot-sdk/blob/v1.0.11/dotnet/test/Unit/ClientSessionLifetimeTests.cs)
  document the synthetic JSON-RPC handshake and hanging-session teardown seam
  used for assembly/wire validation without a native executable.
