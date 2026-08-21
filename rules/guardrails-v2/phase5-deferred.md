# Guardrails v2 — Phase 5 (Deferred set), as-built

Progress log for Phase 5, following `Guardrails_end_to_end_protocol.md`'s
BUILD/TEST/REPORT/READ/FIX/RE-TEST/ADVANCE loop. The protocol's own instruction for this phase:
"re-scope each item against whatever's actually needed at that point rather than building blind
against the original list" -- confirmed necessary before any code, since none of `pii_ner`,
`classifier_http`/webhook guardrails, or retrieval-stage guardrails had any prior spec anywhere
in `rules/guardrails-v2/` (all three were a total blank slate, not a case of missing something
already written down).

## Scope decision (2026-08-21)

User authorized building the first three Phase 5 items except `custom_code` (explicitly
deferred -- the protocol itself flags it as the one item in the whole plan with a real security
surface if done wrong, and it gets its own go-ahead later, not picked up on momentum). Before
building, presented three real design gaps, each with a genuine tradeoff:

- **`pii_ner` — deferred.** No NER library, model, or external-API call exists anywhere in this
  repo (confirmed absent). The real choice -- in-process JS NER library vs. an external NER API
  call -- has a privacy tension baked in: an external API means PII-laden content leaves the
  platform to a third party, which is exactly what a PII-detection feature exists to prevent.
  Not a call to make by default. Deferred as its own decision; not started.
- **`classifier_http`/webhook guardrails — built this pass**, contract confirmed with the user
  first: POST `{content}` to a user-configured URL, expect a `verdict-contract.md`-shaped JSON
  response back, fail per the existing (previously inert) `defaultFailMode` field.
- **Retrieval-stage guardrails — scoped, not yet built.** No vectorstore node has a guardrails
  anchor today, and 6+ implementations exist (Pinecone, Qdrant, Redis, Postgres/PGVector,
  Milvus, etc.). Confirmed scope: build the generic mechanism once, wire into 1-2 real
  vectorstore nodes first, leave the rest for a follow-up pass.

## Unit 1 — `classifier_http` kind + authoring + attachment

**Tier A** (new outbound network call the server itself initiates from user-supplied input --
the classic SSRF shape; also the first kind to actually consume `defaultFailMode`, which has
been schema-defined but inert since Phase 0).

**Build:**
- `packages/components/src/guardrails/kinds/classifierHttp.ts` -- `evaluateClassifierHttp(params,
  content)`. Uses `secureFetch` (`httpSecurity.ts`) -- the same DNS-resolve + deny-list +
  redirect-revalidation + IP-pinned-agent mechanism `RequestsPost.ts`'s tool already uses for
  user-configured URLs -- rather than a bare `fetch()`, which would have been a real security
  regression next to what already exists in this codebase. Any technical failure (bad URL,
  deny-list rejection, timeout, non-2xx, malformed/missing verdict) resolves to a real verdict
  (`block` if `failMode:'closed'`, `pass` otherwise) rather than throwing.
- Exported from `packages/components/src/index.ts` (public surface, needed by the server's
  authoring/dry-run path, same as `evaluateRegexMatch`).
- `runAttachedGuardrails.ts`: generalized `runCustomToolCallGuardrails`'s dispatch from a single
  hardcoded `kindKey === 'regex_match'` check to a `GENERIC_TOOL_CALL_KIND_EXECUTORS` map keyed
  by `kindKey` (`regex_match` -> `evaluateRegexMatch`, `classifier_http` -> `evaluateClassifierHttp`)
  -- adding a second authorable kind without hardcoding a second `if` branch.
- `CustomToolCallGuardrail.ts`'s dropdown now lists custom definitions of either
  `regex_match` or `classifier_http` (`TOOL_CALL_KIND_KEYS`), not just `regex_match` -- same
  wrapper node, no second node needed, since both are tool-call-scoped kinds.
- `services/guardrails/index.ts`: added `classifier_http` to `AUTHORING_KIND_VALIDATORS`
  (rejects a non-http(s) or malformed `url`, a non-positive `timeoutMs`, an invalid `failMode`),
  `AUTHORING_PARAM_SCHEMAS`, `AUTHORING_KIND_EXECUTORS` (dry-run reuses the exact same function),
  and `HOOK_SELECTABLE_KIND_KEYS` (a webhook guardrail needs `pre`/`post` selection for the same
  reason `regex_match` did).

**Test:** rebuilt both packages, restarted against the live Neon DB (this restart again took
~3 minutes instead of the usual ~15-25s -- same pattern as the last two restarts this session,
traced to system resource contention, not a code issue). Two rounds of direct-invocation proof
against the real compiled function:
1. **Default security posture** (matching the real running server exactly -- `HTTP_SECURITY_CHECK`
   left unset): targeting `127.0.0.1` and the cloud metadata IP `169.254.169.254` both correctly
   rejected by the deny-list before any request left the process, resolving to `pass` when
   `failMode` is unset and `block` when `failMode:'closed'` -- never a crash. An unconfigured
   `url` also resolves to a real verdict rather than throwing.
2. **Response-parsing proof** against a real local HTTP test server (SSRF deny-list disabled
   only within that one disposable test process via `HTTP_SECURITY_CHECK=false`, never touching
   the actual dev server's security posture): a real `block` response with `evidence` parsed
   correctly; a real `redact` response's `transformedPayload` parsed correctly; a malformed
   response (no `verdict` field) correctly failed open; an HTTP 500 correctly failed closed when
   configured to; a deliberately slow endpoint (3s) with `timeoutMs:500` correctly aborted and
   failed closed in ~505ms, not the full 3s.

Then, through the real running HTTP API (not just direct invocation): the dry-run endpoint
correctly surfaced the same SSRF-driven fail-open behavior for an end user testing a pattern
before save; `POST /guardrails/definitions` correctly rejected an invalid URL, correctly created
a valid `classifier_http` custom definition with `hooks:'post'`, and correctly rejected a
duplicate key. Test definition and its (empty) audit-log row deleted after.

**RESULT: PASS.**

## Next units (not yet built)

- Retrieval-stage guardrails -- generic mechanism + wiring into 1-2 vectorstore nodes.
- `pii_ner` -- deferred, needs its own NER-approach decision first.
- `custom_code` guardrails -- explicitly deferred per the user, needs its own go-ahead and a
  real sandboxing spec (egress allowlist, timeout, no credential access) before any code.
- Approver inbox -- not yet authorized to start.
