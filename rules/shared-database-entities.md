# Shared Database — Entity Ownership Rule

## The Problem

Both `apps/api` (NestJS) and `packages/server` (Flowise engine) connect to the **same
PostgreSQL database** and both run with `synchronize: true`. This means two independent
TypeORM instances can touch the same tables.

Flowise ships with enterprise database migrations that assume it **owns** the schema for
`user`, `organization`, `workspace`, `workspace_user`, and related tables. But in
`ACCELANCE_ENGINE_MODE`, NestJS is the authoritative owner of those tables. Conflicts
arise every time Flowise releases a migration that reshapes a shared table.

### Incidents logged

| Migration                                  | What it tried to do                                   | Impact if run                                                    |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `1729130948686-LinkWorkspaceId`            | `ALTER TABLE "user" ALTER COLUMN "activeWorkspaceId"` | Column doesn't exist in NestJS entity — crash                    |
| `1734074497540-AddPersonalWorkspace`       | INSERT a Personal Workspace for every user            | Fails on NOT NULL `createdBy`; would create duplicate workspaces |
| `1737076223692-RefactorEnterpriseDatabase` | Renames `user` → `temp_user`, recreates schema        | **Destroys all NestJS auth data**                                |

All three were made **no-ops** (see commit history).

---

## The Rule: Entity Ownership

```
apps/api (NestJS)   OWNS:  user, organization, workspace, workspace_user,
                            organization_user, role, invite

packages/server     OWNS:  chat_flow, credential, tool, variable, assistant,
(Flowise engine)            document_store, apikey, execution, evaluation,
                            evaluator, dataset, workspace_shared, custom_template
```

**If a table is in the NestJS column, Flowise migrations must not:**

-   CREATE or DROP it
-   Rename or recreate it
-   INSERT seed data into it
-   Add NOT NULL columns without a default

**If a table is in the Flowise column, NestJS entities must not:**

-   Add NOT NULL columns without defaults (those columns won't be in Flowise's INSERT)
-   Rename or drop columns the Flowise code reads

---

## Checklist: Before Upgrading Flowise

Whenever you pull a new Flowise version or add migrations, check:

1. **Run `pnpm --filter flowise build` then start with a fresh DB copy** and watch the
   migration log for errors.

2. **For each new migration file** in `packages/server/src/enterprise/database/migrations/postgres/`:

    - Does it touch `user`, `organization`, `workspace`, `workspace_user`, `organization_user`, `role`?
    - If YES → read the full migration. If it does anything beyond read-only queries on those
      tables, **make it a no-op** and add a comment explaining why.

3. **Check for new columns in shared Flowise entities** (entities that map to NestJS-owned tables):

    - If Flowise adds a NOT NULL column to `workspace`, `user`, etc., add the same column
      to the corresponding NestJS entity **with a default value** so TypeORM synchronize
      creates it before Flowise tries to INSERT.

4. **Never add NOT NULL columns without defaults** to shared NestJS entities (workspace,
   organization, etc.). Always use `nullable: true` or supply a `default`.

---

## How to Make a Migration a No-Op

```typescript
public async up(_queryRunner: QueryRunner): Promise<void> {
    // NO-OP in ACCELANCE_ENGINE_MODE.
    // <one-line reason>
    // <longer explanation of what this migration does and why we skip it>
}
```

Always leave the `name` property and the class declaration intact — TypeORM uses the name
to track whether the migration has run.

---

---

## Rule: Cross-Service Entity Change Check

**Whenever you alter an entity in one service, immediately check the same table in the other service.**

This is mandatory — not optional — because both services share one database and both run
`synchronize: true`. A column added in one service will be auto-created in the DB; if the
other service inserts a row without that column, it will fail if the column is NOT NULL.

### What "alter an entity" means

-   Adding a column (especially NOT NULL without default)
-   Removing or renaming a column
-   Changing a column type
-   Adding a constraint or index
-   Adding a new entity/table that shares a name across services

### The cross-check process

1. **Find the table name** — look at `@Entity({ name: '...' })` decorator (or the
   snake_case class name if no explicit name).

2. **Search the other service** for that table name:

    - NestJS entity changed → search `packages/server/src/` for the table name
    - Flowise entity changed → search `apps/api/src/` for the table name

3. **If the other service has the same table:**

    - Does the new column exist there too? If not, add it.
    - Is the new column NOT NULL? Add a default or make it nullable to avoid INSERT failures.
    - Is it a new table? Add an ownership comment to both files (see ownership table above).

4. **If a Flowise migration touches the same table** after your NestJS change, re-read
   the checklist under "Before Upgrading Flowise" — new constraints may invalidate it.

### Quick search commands

```bash
# Find all entities in NestJS that map to a given table name
grep -r 'name.*workspace' apps/api/src/entities/

# Find all Flowise entities/migrations that touch the same table
grep -r '"workspace"' packages/server/src/enterprise/database/
grep -r '"workspace"' packages/server/src/database/entities/
```

### Example

You add `billingPlan` (NOT NULL, no default) to the NestJS `Organization` entity.

1. Flowise also has an `organization` table (from `packages/server/src/enterprise/database/entities/organization.entity.ts`).
2. Flowise migrations may INSERT into `organization` — they would now fail.
3. Fix: either make `billingPlan` nullable in NestJS, or add a default, before shipping.

---

## Long-term Fix (when time allows)

Separate the two services onto **separate database schemas** (PostgreSQL schemas, not
databases) so they can't accidentally collide:

-   NestJS → `accelance` schema
-   Flowise → `flowise` schema (or keep `public`)

Until then, the rule above and the no-op pattern are the guard rails.
