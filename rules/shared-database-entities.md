# Shared Database Entities

## ⚠️ Rule

When you change any entity or table, check this file first. If the table is owned by a service other than where you're making the change, you MUST update that other service too.

## Entity Ownership Map

| Table               | Owner Service              | Entity File                                                | Notes                           |
| ------------------- | -------------------------- | ---------------------------------------------------------- | ------------------------------- |
| `user`              | packages/server enterprise | `enterprise/database/entities/user.entity.ts`              | Auth user — bcrypt password     |
| `organization`      | packages/server enterprise | `enterprise/database/entities/organization.entity.ts`      | ONE per deployment              |
| `role`              | packages/server enterprise | `enterprise/database/entities/role.entity.ts`              | owner/member/personal workspace |
| `workspace`         | packages/server enterprise | `enterprise/database/entities/workspace.entity.ts`         | Multiple per org                |
| `workspace_user`    | packages/server enterprise | `enterprise/database/entities/workspace-user.entity.ts`    | User↔workspace join             |
| `organization_user` | packages/server enterprise | `enterprise/database/entities/organization-user.entity.ts` | User↔org join                   |
| `login_method`      | packages/server enterprise | `enterprise/database/entities/login-method.entity.ts`      | SSO config                      |
| `login_session`     | packages/server enterprise | `enterprise/database/entities/login-session.entity.ts`     | Active sessions                 |
| `chat_flow`         | packages/server core       | `database/entities/ChatFlow.ts`                            | AI flows                        |
| `apikey`            | packages/server core       | `database/entities/ApiKey.ts`                              | API keys                        |
| `credential`        | packages/server core       | `database/entities/Credential.ts`                          | Encrypted credentials           |
| `tool`              | packages/server core       | `database/entities/Tool.ts`                                | Custom tools                    |
| `assistant`         | packages/server core       | `database/entities/Assistant.ts`                           | AI assistants                   |
| `document_store`    | packages/server core       | `database/entities/DocumentStore.ts`                       | RAG stores                      |
| `variable`          | packages/server core       | `database/entities/Variable.ts`                            | Flow variables                  |
| `execution`         | packages/server core       | `database/entities/Execution.ts`                           | Flow execution log              |
| `workspace_shared`  | packages/server enterprise | `enterprise/database/entities/EnterpriseEntities.ts`       | Shared workspace settings       |

## Cross-Service Change Checklist

If a future NestJS service (apps/api) needs to read these tables:

-   [ ] It must connect to the SAME PostgreSQL instance
-   [ ] It must NOT run its own migrations against these tables
-   [ ] It must treat the schema as read-only or use Flowise migrations for changes
-   [ ] Any new columns must be added via a Flowise migration file

## Adding a Migration

1. Copy the most recent migration in `packages/server/src/enterprise/database/migrations/postgres/`
2. Rename: new timestamp + descriptive name (e.g., `1751234567890-AddFeatureX.ts`)
3. Update the class name to match the filename
4. Add the import + class to `packages/server/src/database/migrations/postgres/index.ts`
5. Test: `pnpm build` then restart server (migrations run automatically)

## Critical Constraints

-   `user.credential` — bcrypt hash, NEVER store plaintext password
-   `organization_user` + `workspace_user` — composite PKs (`organizationId+userId`, `workspaceId+userId`)
-   `role.permissions` — stored as JSON string array (e.g., `'["chatflows:view","chatflows:create"]'`)
-   One organization per ENTERPRISE deployment — `ensureOneOrganizationOnly()` enforces this
