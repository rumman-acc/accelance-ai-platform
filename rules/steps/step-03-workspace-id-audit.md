# Step 03 — workspaceId Audit

**Status:** COMPLETE ✓
**Date started:** 2026-06-25
**Depends on:** Step 01 ✓, Step 02 ✓
**Unblocks:** Step 04 (NestJS api — confirms the engine's workspace scoping is solid)

---

## Goal

Verify every Flowise entity is properly workspace-scoped before NestJS starts proxying
to the engine. Confirm no migrations are needed.

---

## Audit Result — ALL TOP-LEVEL ENTITIES ALREADY HAVE workspaceId ✓

| Entity             | workspaceId | Notes                             |
| ------------------ | ----------- | --------------------------------- |
| ChatFlow           | ✅          | Has column, service filters by it |
| Credential         | ✅          | Has column, service filters by it |
| Tool               | ✅          | Has column, defense-in-depth set  |
| DocumentStore      | ✅          | Has column, service filters by it |
| Variable           | ✅          | Has column, service filters by it |
| ApiKey             | ✅          | Has column                        |
| Assistant          | ✅          | Has column                        |
| CustomTemplate     | ✅          | Has column                        |
| Dataset            | ✅          | Has column                        |
| Evaluation         | ✅          | Has column                        |
| Evaluator          | ✅          | Has column                        |
| Execution          | ✅          | Has column                        |
| ScheduleRecord     | ✅          | Has column                        |
| ScheduleTriggerLog | ✅          | Has column                        |
| CustomMcpServer    | ✅          | Has column                        |

---

## Child Records — Scoped Through Parent (no direct workspaceId needed)

| Entity                 | Parent link     | Scoped via                  |
| ---------------------- | --------------- | --------------------------- |
| ChatMessage            | chatflowid      | ChatFlow.workspaceId ✓      |
| ChatMessageFeedback    | chatflowid      | ChatFlow.workspaceId ✓      |
| DatasetRow             | datasetId       | Dataset.workspaceId ✓       |
| DocumentStoreFileChunk | documentStoreId | DocumentStore.workspaceId ✓ |
| EvaluationRun          | evaluationId    | Evaluation.workspaceId ✓    |
| Lead                   | chatflowid      | ChatFlow.workspaceId ✓      |
| UpsertHistory          | chatflowid      | ChatFlow.workspaceId ✓      |

---

## How workspaceId Flows Through the Stack (confirmed working with Step 02)

```
Request arrives at engine
  → trustEngineHeaders middleware (Step 02)
      reads X-Workspace-Id header
      sets req.user.activeWorkspaceId
  → Controller reads req.user.activeWorkspaceId
  → Passes to service as workspaceId param
  → Service calls getWorkspaceSearchOptions(workspaceId)
      returns { workspaceId: Equal(workspaceId) }
  → TypeORM query filters by workspaceId
```

Key file: `packages/server/src/enterprise/utils/ControllerServiceUtils.ts`

-   `getWorkspaceSearchOptions(workspaceId)` — direct workspaceId param
-   `getWorkspaceSearchOptionsFromReq(req)` — reads from req.user.activeWorkspaceId

---

## Files Changed

**None.** This step is audit-only. No migrations, no entity changes, no service changes.
All workspace scoping was already correctly implemented in the Flowise enterprise codebase.

---

## No Migrations Needed

Existing data: this is a fresh setup — no existing rows to backfill.
New rows: workspaceId is always set server-side from req.user.activeWorkspaceId,
never from client input. Defense-in-depth is in place.

---

## Next Step

→ Step 04: Scaffold NestJS apps/api (auth, tenant, workspace, RBAC, proxy)
See `rules/steps/step-04-nestjs-api.md`
