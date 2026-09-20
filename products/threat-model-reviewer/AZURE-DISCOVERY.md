# Deterministic Azure discovery: I/O contract

This guide describes the read-only runner included in **v2.7.0**.
This reader is independent of the AI/MCP connectors. It does not change the review
rubric or give an AI permission to choose commands.

## Requirements and supported execution

- **Windows 10 / Windows Server 2016 or later**, with the application's supported
  .NET runtime. The runner requires Windows process-job attributes. Non-Windows
  hosts return an explicit `Failed` result **before starting anything**: there is
  no less-safe fallback that promises to clean up children it cannot contain.
- A trusted Azure CLI installation. The normal MSI (`wbin`) and ZIP (`bin`) layouts
  put `python.exe` beside or immediately above the `az.cmd`/`az.bat` directory on
  `PATH`. Python virtual environments with an adjacent interpreter are supported
  too. The first CLI marker on an absolute `PATH` entry wins; an unsupported first
  installation is not silently replaced with another one.
- For other layouts, set **`TMR_AZURE_CLI_PYTHON`** in the app/CLI process environment
  to the **absolute path of a native `python.exe` with `azure-cli` installed**.
  A dedicated Python virtual environment is suitable. The override takes priority;
  invalid overrides fail rather than falling back. Shell aliases, batch files, and
  command strings are not interpreter paths.
- A usable account in that CLI environment, authenticated **by the engineer**.
  Discovery never runs login, refreshes a UI sign-in, or changes the selected
  subscription. The CLI itself may use/refresh its cached credentials normally.
- Permission to read the requested metadata. Reader at the requested scope, or
  equivalent custom-role permissions, is normally sufficient. Deny assignments,
  inaccessible scopes, cloud/tenant selection, or authentication policy can still
  prevent reads. A denial is not evidence that the scope is empty.

Windows launches the CLI's Python module directly:

```text
<absolute-python.exe> -I -B -X utf8 -m azure.cli <fixed read arguments>
```

There is **no `cmd.exe /c`, PowerShell command string, or installed-wrapper parsing**.
Isolated mode (`-I`) excludes the current directory, `PYTHONPATH`, and Python's
user-site packages. Install the CLI into the selected interpreter/environment,
not only with `pip --user`. UTF-8 mode preserves non-ASCII names in redirected
output. Dynamic extension installation, CLI auto-upgrade, and CLI telemetry are
disabled in the child environment. Stdin is closed; no interactive prompt can wait
for an engineer to answer.

This intentionally narrows the old non-Windows/batch-wrapper fallback. Other host
platforms need a separately implemented and tested process-containment backend,
not merely different quoting.

## Exact reads and argument boundaries

These are the entire accepted shapes, before the fixed output flags are appended.
Brackets indicate an optional pair, not literal characters.

| Named read | Shape |
| --- | --- |
| Account metadata | `account show [--subscription VALUE]` |
| Visible resource groups | `group list [--subscription VALUE]` |
| Group inventory | `resource list --resource-group VALUE [--subscription VALUE]` |
| One resource's configuration | `resource show --ids VALUE` |
| Group/inherited role assignments | `role assignment list --resource-group VALUE --include-inherited [--subscription VALUE]` |
| Private endpoints | `network private-endpoint list --resource-group VALUE [--subscription VALUE]` |

The public account method still reads the selected account. Discovery uses an
internal overload to resolve an explicitly requested subscription with
`account show --subscription`, then uses its returned ID for subsequent scoped
reads. The inventory's subscription ID and display name therefore refer to the
same subscription; no `account set` is necessary.

### Desktop picker scope hand-off

`AzureDiscoverDialog` validates the account's subscription ID as a nonempty GUID
and captures its canonical form **before listing groups**. It explicitly passes
that ID to the group-list read and carries it on each immutable group row.
Returned group identities must match that subscription and the displayed group
name. A missing/invalid account ID or inconsistent group identity disables
selection and reports an error; it never retries against the mutable default.

Accepting a row returns both `SelectedResourceGroup` and
`SelectedSubscriptionId`. Refresh clears any previous committed pair. An unscoped,
foreign, or stale row cannot be accepted. Group names, locations, accessible row
text, refresh, cancel, and successful dialog behavior otherwise stay the same.

The integrated `MainViewModel` passes both returned values to discovery. A cancelled
dialog leaves the draft unchanged. An accepted dialog with an incomplete selection
reports an error; it does not silently substitute the current default subscription.

This pins the entire hand-off even if another process changes the CLI's selected
subscription between reading the account, listing groups, and building the draft.
Two subscriptions having a group with the same name does not make them the same
scope.

### Command validation

The executor checks every argument position, option, and value boundary. Extra
verbs, unknown/duplicate/reordered options, queries, caller-selected output
formats, and extra positional arguments are rejected. The unused `account list`
and `group show` entries are no longer advertised in `ReadOnlyVerbs`.
`IsReadOnly` validates these complete, pre-output shapes; it is **not** a
shell-escaping API. `ForbiddenWords` remains available for compatibility, but a
word blacklist does not enforce this boundary.

Each value is transported as **one `--option=value` argv token**, with native
Windows argument quoting, followed by fixed `--output=json --only-show-errors`.
Even a leading `-`, embedded quotation mark, shell punctuation, space, Unicode
character, or trailing backslash in a supplied value cannot introduce another
argument or shell command. Names such as `secrets` and `start` remain names.

Null optional subscriptions mean “use the selected subscription”; empty or
whitespace-only supplied subscriptions are errors, not silently omitted options.
Required values must be nonblank and contain no control characters (including
NUL, CR, LF and tabs). A resource ID must begin with `/` and have more than one
character; a URL is not accepted in its place.

This is **not an ID-only subscription contract**: names containing spaces/Unicode
are preserved. A subscription GUID is preferable when display names are ambiguous.
Azure still validates its service-specific naming/ID rules. In particular, Azure
resource-group names support Unicode letters/digits and `_-().`, but not spaces,
and cannot end in a period. The runner does not try to duplicate every service's
naming rules or turn an invalid Azure name into an empty result.

## Results and errors

The existing public constructors, named-read methods, discovery signature, and
inventory/model definitions are preserved. `MalformedOutput` and
`InvalidArguments` are appended enum members; existing enum numeric values are
unchanged. Existing app/CLI callers already display returned messages and gaps.

| Outcome | Meaning |
| --- | --- |
| `NotInstalled` | No supported CLI interpreter, executable missing at launch, or the selected Python environment has no `azure`/`azure.cli` module. Install/repair the CLI or correct the explicit interpreter path. |
| `NotSignedIn` | CLI reports no usable login or a recognized expired/revoked session. The engineer must authenticate outside discovery. |
| `NotAuthorized` | CLI reports a recognized authorization denial, such as `AuthorizationFailed` or `Forbidden`. Review the denied operation/scope. |
| `InvalidArguments` | A required value or full command shape was rejected before launch. |
| `MalformedOutput` | Empty stdout, invalid UTF-8/JSON, a wrong root shape, or malformed records in a required collection. No data from that read is accepted. |
| `TimedOut` | The individual read exceeded its timeout and its process tree was reaped. Default: **120 seconds per read**, not a single deadline for the whole resource group. |
| `Failed` | Other nonzero exits, unsupported process containment, executable access/format failures, or explicit I/O/cleanup failures. Unknown CLI diagnostics retain one bounded, control-character-sanitized line, or the exit code if stderr is empty. |
| User cancellation | Throws `OperationCanceledException` with the caller's token **after cleanup**. It is not relabelled as a timeout or returned as a partial success. |

A zero exit code alone is insufficient. Account output requires an object with
nonblank `id` and `name`. Group/resource lists require arrays of usable objects;
resources require `id`, `name`, and `type`, with correctly shaped optional identity
and configuration metadata. Role records require a principal and scope. Missing
role names are retained as unresolved assignments with an explicit inference gap.
Private endpoint output must have named entries with the expected
`privateLinkServiceConnections` array and usable connection records.

`[]` is a legitimate empty list. Empty text, `null`, `{}` in place of a list,
`[null]`, or records missing their required identity fields are **not** empty
inventories. Extra JSON fields are retained in the raw read result; validation
does not discard useful metadata to make a malformed list look successful.

Account/resource-list failures are fatal to discovery. Optional role/private
endpoint/configuration failures retain the readable resource inventory and
explicit gaps. Configuration failures include their classification and reason.
Previously observed identity, location, and security notes are preserved; detail
notes are merged rather than replacing earlier metadata. No malformed optional
output is quietly reported as “there were no assignments/endpoints/settings.”

## Process lifetime and safety boundaries

The native Windows launcher assigns a newly created process to a **private,
unnamed kill-on-close job atomically at creation**. There is no start-then-attach
window in which a child can escape. Only the three standard pipe handles are
inherited. Stdout and stderr are drained concurrently.

Timeout and user cancellation terminate that job and wait for its active process
count to reach zero. Cleanup is not cancelled by the user's token and has a
separate 10-second verification limit; failure to verify cleanup is reported as
`Failed`, not claimed as successful termination. The job is also closed as a
last-resort cleanup on exceptional unwinding.

Even after a normal or malformed-output parent exit, remaining descendants are
terminated before returning/parsing the result. A child holding a pipe open
cannot turn malformed output into a hanging read. No process-name enumeration or
process-name-based termination is used; another engineer's CLI/Python process or
another concurrent wrapper invocation is not in this job.

These guarantees assume a trusted local OS, interpreter and CLI installation,
including any already-installed CLI extensions. This is not a sandbox for
malicious local executable code or a replacement for Azure RBAC. If a host's job
policy prevents containment, discovery fails; it does not launch uncontained.

The reads request management metadata, role assignments and network configuration,
not keys, token values, app settings, connection strings or secret contents. Read
only means **no Azure resource mutations**, not zero local CLI cache/log writes or
zero network use. Owners may themselves place sensitive information in metadata;
inventory/evidence files must still be handled privately.

Permission is **not proof of traffic, an effective network boundary, or an
implemented mitigation**. Role-name-based data-access inference, invisible
shared-key access, resources outside the readable scope, and the existing
private-endpoint interpretation remain limitations of a draft. This I/O change
does not widen the DFD builder, interpret additional connection types, or change
the rubric. Engineers must verify the generated model and actual controls.
The sequence of Azure reads is not a transactional snapshot: deployment state and
permissions can change between reads.

## Focused, account-independent verification

Tests require the Windows .NET 10 SDK and Python 3 on `PATH`, **not** Azure CLI or an
Azure account. Each fixture creates a private virtual environment without pip
under a unique test `obj/azure-cli-io-*` directory in this worktree. Its only
`azure.cli` module is a synthetic fixture. The fake batch file is a marker, not an
executable wrapper. No sign-in, selected-subscription change, real Azure read, or
resource mutation occurs.

Tests cover exact argv observed by that module (including inert punctuation and
Unicode), missing/broken installations, classified stderr, malformed roots and
records, simultaneous large stdout/stderr, integration gaps/metadata, cancellation,
timeouts, and a parent exiting before its child. Concurrent identical-interpreter
fixtures verify that cleanup leaves the unrelated tree running.
End-to-end tests also run the existing CLI executable against that fake module:
group-read errors remain failures, malformed inventory does not write a draft,
and optional-read gaps appear on stderr. Those CLI tests need no CLI edits.
Picker tests use real WPF controls on an STA dispatcher without showing a window
or creating a global application. A fake CLI changes its default from A to B
after returning account A; both subscriptions contain a group named `shared`.
The tests verify the picker still lists A, returns A with the selected group,
and discovers A when that pair is forwarded as in the required caller patch.
They also cover invalid account IDs, foreign group identities/rows, and clearing
stale selections on a failed refresh.

Run from the assigned repository root. For this fleet validation, hold the named
mutex for the complete build/test command and release it in `finally`:

```powershell
$mutex = [System.Threading.Mutex]::new($false, 'Local\TMR-Fleet-Validation-20260913')
$acquired = $false
try {
    try { $acquired = $mutex.WaitOne([TimeSpan]::FromMinutes(10)) }
    catch [System.Threading.AbandonedMutexException] { $acquired = $true }
    if (-not $acquired) { throw 'Timed out acquiring fleet validation mutex.' }
    dotnet test ThreatModelReviewer.Tests/ThreatModelReviewer.Tests.csproj `
        --filter 'FullyQualifiedName~AzureCliIoTests|FullyQualifiedName~AzureDiscoveryTests|FullyQualifiedName~AzureDiscoverDialogTests' `
        --nologo --disable-build-servers -p:CopilotSkipCliDownload=true `
        -p:UseSharedCompilation=false -m:1 --logger 'console;verbosity=minimal'
    if ($LASTEXITCODE -ne 0) { throw "Azure tests failed: $LASTEXITCODE" }
}
finally {
    if ($acquired) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
```

`CopilotSkipCliDownload` is the existing SDK's build-time opt-out for downloading
its unrelated Copilot binary; these tests do not execute AI connectors. It does
not change a package version or constitute app/AI release validation.

## Public references

Reviewed **2026-09-13**; these are product/OS references, not claims that a real
subscription was tested:

- [Install Azure CLI on Windows (MSI/ZIP)](https://learn.microsoft.com/cli/azure/install-azure-cli-windows)
- [Azure CLI account commands (`--subscription` name or ID)](https://learn.microsoft.com/cli/azure/account)
- [Azure CLI group commands](https://learn.microsoft.com/cli/azure/group),
  [resource commands](https://learn.microsoft.com/cli/azure/resource),
  [role assignments](https://learn.microsoft.com/cli/azure/role/assignment),
  [private endpoints](https://learn.microsoft.com/cli/azure/network/private-endpoint)
- [Azure resource naming rules](https://learn.microsoft.com/azure/azure-resource-manager/management/resource-name-rules)
- [Azure CLI configuration](https://learn.microsoft.com/cli/azure/azure-cli-configuration)
- [Official Azure CLI ZIP launcher source (module/relative interpreter layout)](https://github.com/Azure/azure-cli/blob/dev/build_scripts/windows/scripts/az_zip.cmd)
- [Official Azure CLI Python launcher source](https://github.com/Azure/azure-cli/blob/dev/src/azure-cli/az.bat)
- [Windows process attributes: handle and job lists](https://learn.microsoft.com/windows/win32/api/processthreadsapi/nf-processthreadsapi-updateprocthreadattribute)
- [Windows job objects](https://learn.microsoft.com/windows/win32/procthread/job-objects)
