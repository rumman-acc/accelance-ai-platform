# `custom_code` Guardrail — Sandboxing Spec (Draft for Review)

Status: **design only, no implementation authorized.** This exists to be reviewed and
argued with before a single line of executor code is written. Nothing here should be
built until this document is explicitly signed off, per the phase protocol's rule that
this is the one item in the whole guardrails effort with a genuine security surface
rather than a correctness surface.

**Revision note (2026-08-21):** revised after one implementer's review, folding in
findings directly (§3/§4: `worker_threads`+`resourceLimits` named explicitly,
`vm2`/`NodeVM` explicitly forbidden by name; §5: added an outer caller-side timeout and
an honest complexity note; §6.5: closed the compiled-script/VM-reuse gap; §7: four
additions). §8 is still open and unresolved. Still not signed off.

---

## 1. Why this is different from everything else built so far

Every other guardrail kind runs code your team wrote, configured with a tenant's
parameters (a regex string, a list of banned words, a rubric prompt). The blast radius
of a mistake is "the guardrail behaves wrong." `custom_code` runs **a tenant's own
code**, inside your process. The blast radius of a mistake is "a tenant's code touches
something it shouldn't" — other tenants' data, your credentials, your internal network,
or the host itself.

This spec's job is to make the blast radius of a mistake small and boring, not to make
the feature powerful. Every design choice below trades capability for containment on
purpose.

## 2. Threat model

What a malicious or careless `custom_code` guardrail could attempt, and why each matters
in this specific architecture (single Node process, `packages/server`, multi-tenant):

| Threat | Why it's realistic here |
| --- | --- |
| Read env vars, process memory, or other loaded modules | Runs in-process by default in Node; nothing stops `process.env` access without a real sandbox |
| Make outbound network calls (exfiltrate data, reach internal services, SSRF) | Same class of risk already handled carefully for `classifier_http` — this is worse, since it's arbitrary code, not a fixed request shape |
| Read/write the filesystem | Could read other tenants' uploaded files, credentials on disk, or the app's own source |
| Access the DB connection pool or ORM instance directly | Would bypass every RBAC/tenancy check the rest of the app relies on |
| Consume unbounded CPU/memory, or hang forever | A single Node process handling multiple tenants means one bad script can degrade or crash the whole service |
| Access other tenants' in-flight request data (closures, shared module state) | In-process execution risks touching whatever's reachable in scope, not just what's passed in |
| Escalate via prototype pollution / `require`/`import` of arbitrary modules | Node-specific: `require('child_process')`, `require('fs')`, etc. are one line away if not blocked |

The core decision this spec makes: **none of these are acceptable residual risks.**
Given that, the guardrail cannot run in-process at all.

## 3. Core decision: out-of-process, not in-process sandboxing

Rejected: any approach that runs tenant code inside the main Node process (`vm2`,
Node's built-in `vm` module, `Function()` constructor sandboxes, etc.). All of these
have known, repeated history of sandbox-escape vulnerabilities, and even when patched,
they still share memory space and the event loop with your production traffic. A
guardrail hang or crash inside the main process is not an acceptable failure mode for a
component whose entire job is safety-net infrastructure.

**`vm2`/`NodeVM` is explicitly forbidden by name for this feature, not just implicitly
excluded as "an in-process approach."** This matters concretely, not hypothetically:
`vm2` is already a direct dependency of this repo (`packages/components/package.json`)
and is already running in production today, powering the "Custom Function" node family
(`packages/components/src/utils.ts`'s `executeJavaScriptCode`, used by
`nodes/utilities/CustomFunction`, `nodes/agentflow/CustomFunction`, and
`nodes/sequentialagents/CustomFunction`). `vm2` is unmaintained with a documented
history of sandbox-escape CVEs — exactly the class of tool this section already rejects.
Because it's already imported and already used elsewhere in this codebase, it is the
path of least resistance for whoever builds this next, and reaching for it would violate
this section's own intent while looking like reuse of "already-approved" infrastructure.
Naming it explicitly closes that gap. (The existing Custom Function usage is a separate,
pre-existing exposure — tracked independently in `rules/known-issues.md`, not fixed by
or blocking this spec.)

**Required: execution happens in a separate, disposable, tightly-constrained process
or container**, isolated from the main application. Two viable shapes:

- **Ephemeral container per execution** (e.g. a locked-down Docker/Firecracker
  container spun up for the single guardrail call, torn down immediately after) — strongest
  isolation, highest latency and infra cost. **Not supported by anything in this repo
  today** — the running server process has no Docker socket access, no
  container-orchestration client wired into the request path, and no Firecracker
  tooling anywhere. (The one place this codebase spawns containers,
  `NimContainerManager` for NVIDIA NIM model serving, is a fully separate subsystem with
  no request-path wiring — not reusable scaffolding for this.) Choosing this shape means
  committing to a genuinely new infra project, not an extension of anything running.
- **A persistent, dedicated sandbox worker pool — specifically Node's built-in
  `worker_threads`, each worker constructed with a `resourceLimits` object
  (`maxOldGenerationSizeMb`, `maxYoungGenerationSizeMb`, etc.) enforcing a real memory
  ceiling, plus `require`/dynamic `import` disabled inside the worker's execution
  context** — not "a hardened runtime" in the abstract, and specifically not `vm2`.
  `vm2` cannot satisfy §4's memory-limit requirement at all (it provides a timeout, not
  a memory cap), which independently disqualifies it here even setting the CVE history
  aside. `worker_threads` needs no new infrastructure — it's built into the Node 24
  runtime this repo already targets.

Which of these two shapes fits depends on your actual latency budget and infra team's
comfort level — that's the one open question this spec leaves for you rather than
picking unilaterally, since it's an infra/ops tradeoff, not a security tradeoff (both,
built correctly per the naming above, can be made equally safe; they differ in cost,
speed, and how much new infrastructure they require this repo to stand up).

## 4. Hard constraints on the execution environment

Non-negotiable regardless of which shape from §3 is chosen:

- **No network egress, full stop.** Not an allowlist, not "only to approved domains" —
  zero. A guardrail scanning content has no legitimate need to make an outbound
  request; if a tenant needs that, it's a `classifier_http` guardrail, which already has
  its own audited controls, not `custom_code`.
- **No filesystem access.** No read, no write, not even to a scratch directory, unless
  a specific future use case demands it — and if so, that's an explicit tmpfs mount,
  wiped every execution, never persisted, never shared across tenants or calls.
- **No access to environment variables, process arguments, or any host process state.**
  The sandbox receives exactly the input payload and nothing else — not `process.env`,
  not the app's config, not other requests' data.
- **No access to the DB, ORM, or any credential store**, directly or via any injected
  object. If a guardrail needs to check something against stored data, that check
  happens outside the sandbox, in your code, before or after the call — never by giving
  the tenant's code a live handle to your database.
- **Hard CPU and memory limits**, enforced by the container/runtime, not by convention
  — for the worker-pool shape, this means the `worker_threads` `resourceLimits` option
  named in §3, not a value checked after the fact. Recommend starting conservative —
  e.g. 128MB memory, single-core, and tightening or loosening only after real usage
  data.
- **Hard wall-clock timeout, enforced at TWO levels, not one.** (1) The sandbox itself
  kills the execution forcibly (SIGKILL-equivalent for a container; `worker.terminate()`
  for a worker thread — not a cooperative cancellation the tenant's code could ignore),
  same principle already proven correct in the `classifier_http` timeout test (measured
  against real wall-clock, not trusted from config). (2) **Independently, the calling
  code that awaits the sandbox's response has its own outer timeout**, separate from
  (1) — covering the case where the sandboxed process/worker is genuinely dead but the
  IPC/message channel back to the caller never resolves or rejects. Without (2), a
  channel-level hang after a correctly-killed sandbox would still hang the guardrail
  check itself.
- **No access to other tenants' data or any shared in-process state — including no
  reused VM/worker/global-state object across two different tenants' executions, even
  a compiled-script object cached for performance.** Each execution gets a fresh
  environment; nothing persists between calls, nothing is shared between concurrent
  executions from different tenants. Sandboxing libraries and runtimes often cache a
  compiled script or reuse a worker instance across calls purely for speed — if that
  cached object retains any closure state, two tenants sharing it is exactly the leak
  this bullet exists to prevent. This must hold even when a library makes reuse the
  default/easy path.
- **Restricted language surface where the runtime allows it** — e.g. if using an
  isolated-vm-style approach, disable `require`/dynamic `import` entirely inside the
  sandbox; the tenant's code should be able to receive input, run pure logic, and return
  output, nothing else.

## 5. Interface contract

The sandbox receives exactly one thing: the content or tool-call data being checked,
serialized, per the existing guardrail input shape already used by every other kind.

The sandbox must return exactly the same `GuardrailVerdict` shape every other kind
returns (verdict, score, reason, transformed payload if redacting, evidence) — no
sandbox-specific extensions to that contract. If the returned value doesn't match the
expected shape, or the sandbox errors, times out, or is killed, treat it as a check
failure and apply the guardrail's configured `failMode` (open/closed per category,
same rule as every other kind) — never treat a malformed or failed sandbox response as
an implicit pass.

**The calling code's wait for a response needs its own outer timeout, independent of
the sandbox's internal kill mechanism** (see §4's two-level timeout requirement) — a
sandbox that is correctly killed is not the same guarantee as a caller that is
guaranteed to hear about it promptly. Both must hold.

**Honestly, not cosmetically: this is the first kind in the whole guardrails effort
that requires real process/worker lifecycle management** (spawn, message, await,
enforce two independent timeouts, tear down, pool or recycle) rather than a plain
function call. Every other kind executor (`evaluateRegexMatch`, `evaluateClassifierHttp`,
`verifyWorkspaceMembership`) is called in-process and returns directly. `custom_code`'s
executor can still be made to fit the same calling signature every other kind uses, so
there's no interface-level friction — but the implementation is a genuine step up in
complexity from anything built so far in this effort, not a same-shape variation on it.
That complexity is the correct price for the isolation this spec requires, not a reason
to reconsider the architecture — but it should be budgeted and scheduled as such, not
assumed to be "as easy as the last kind."

## 6. What must be proven before this ships (Tier A, no exceptions)

This list is the actual acceptance criteria — nothing here should be signed off on
"the sandbox library is supposed to prevent this," it needs to be demonstrated against
this specific integration:

1. **Network egress attempt is blocked.** Submit custom code that attempts an outbound
   HTTP request (to a real, controlled test endpoint) and confirm it never arrives.
2. **Filesystem access attempt is blocked.** Submit code that attempts to read a known
   file (e.g. `/etc/passwd` or an app source file) and confirm it fails or returns
   nothing, not real content.
3. **Env/credential access attempt is blocked.** Submit code that attempts to read
   `process.env` or any injected app object and confirm nothing sensitive is reachable.
4. **Resource limits actually fire.** Submit code with an infinite loop and a
   memory-bomb (large allocation loop) separately; confirm both are killed at the
   configured limits, with wall-clock/measured-memory evidence, not just config values.
5. **Cross-tenant isolation holds, including no reused VM/worker/global-state object.**
   Run two concurrent executions with different tenant inputs and confirm neither can
   observe the other's data or affect the other's execution — and specifically confirm
   that no compiled-script object, worker instance, or global-state object is reused
   across the two executions, even if the chosen library/runtime makes that reuse the
   default or easy path for performance. A shared cached object retaining closure state
   is exactly the leak this criterion exists to catch, not just "did tenant B see
   tenant A's actual data."
6. **Malformed/crashed output fails safely.** Submit code that returns garbage, throws,
   or times out, and confirm the guardrail applies its configured `failMode` correctly
   rather than silently passing.
7. **Verdict contract compliance.** Submit valid code that returns a correctly-shaped
   verdict and confirm it flows through the existing verdict/audit pipeline identically
   to every other kind — no special-casing needed downstream.

Every one of these needs the same evidence standard already established across this
build: captured logs, real attempted breaches, measured timing — not "the sandbox
library's documentation says this is prevented."

## 7. Explicitly out of scope for v1

- Any language other than the single runtime chosen in the implementation pass (don't
  support "any language via arbitrary interpreter" — one supported language, tightly
  controlled, is safer and enough for v1)
- Any persistent state between executions of the same custom guardrail
- Any capability to call other guardrails, other tools, or the agent itself from within
  the sandboxed code
- Any UI feature that lets a tenant "test" their code with elevated permissions or
  network access "just for testing" — the test/dry-run path must run under the exact
  same constraints as production, or the dry-run tester becomes the hole in the sandbox
- **Reusing the existing `vm2`/`NodeVM` machinery that already powers the "Custom
  Function" node family for this feature, in any form.** See §3 -- it's already in this
  repo, already looks like approved precedent, and is exactly the class of tool this
  spec rejects. Not a v1-vs-later scoping question; not permitted at all under this spec.
- **Rate-limiting/quota on the dry-run tester specifically for this kind.** Running
  under production constraints (the point above) stops a tenant from getting a
  *more privileged* test path, but it doesn't stop repeated, production-cost dry-run
  calls from becoming a resource-exhaustion vector the way a cheap kind's dry-run
  (`regex_match`, `classifier_http`) never could. Needs its own rate limit; not covered
  by "same constraints as production" alone.
- **Asynchronous/awaiting code inside the sandbox.** v1 is synchronous, bounded-time,
  pure-function execution only — no `await`, no retries, no background work. Given the
  sandbox has no network/filesystem/DB access, there is no legitimate long-running async
  operation for tenant code to perform anyway; scoping this out now avoids a confusing
  "why doesn't my retry loop work" question later rather than fixing a real gap.
- **Assuming existing authoring permissions are sufficient without a deliberate check.**
  Creating a `custom_code` definition is authorizing code execution, not just
  configuring a check — at minimum the same `guardrails:manage` permission every other
  custom definition requires, stated here explicitly rather than left to be assumed
  adequate by default given what this kind actually grants.

## 8. Open question for you, not resolved here

Ephemeral-container-per-call vs. persistent-worker-pool-with-resets (§3) — an infra
cost/latency tradeoff, not a security one if both are built to this spec. Needs your
infra team's input before implementation starts.

---

*This document should be treated as the gate for authorizing any `custom_code` build
work — no implementation task should be sent to the build loop referencing
`custom_code` until this is reviewed, amended as needed, and explicitly signed off.*