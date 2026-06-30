# Step 01 — Enterprise Auth Setup

**Status:** ✅ Complete (2026-06-30)  
**Goal:** Enable org/workspace/user management with PostgreSQL, no Flowise EE license

---

## What was done

### 1. Patched `IdentityManager._validateLicenseKey()`

**File:** `packages/server/src/IdentityManager.ts`

Added at the very start of the method:

```typescript
if (process.env.FLOWISE_PLATFORM?.toLowerCase() === 'enterprise') {
    this.licenseValid = true
    this.currentInstancePlatform = Platform.ENTERPRISE
    return
}
```

**Why this works:** Flowise's license check normally requires `FLOWISE_EE_LICENSE_KEY` + either an offline RSA-signed JWT or a license server URL. By short-circuiting before those checks, we get `Platform.ENTERPRISE` without any of that. All enterprise feature flags are unlocked (see `getFeaturesByPlan()` which returns all flags for ENTERPRISE). No Stripe required.

### 2. Created `packages/server/.env`

Key settings:

-   `FLOWISE_PLATFORM=enterprise` — triggers the patch above
-   `PORT=3002` — server port
-   PostgreSQL credentials (Neon)
-   `SECRETKEY_PATH` — where Flowise stores its encryption keys
-   `JWT_AUTH_TOKEN_SECRET` — deterministic auth token signing
-   `EXPRESS_SESSION_SECRET` — session cookie signing
-   SMTP (Brevo) — for user invite emails
-   `SENDER_EMAIL=noreply@accelance.io` — from address in invite emails
-   `APP_URL=http://localhost:3002` — embedded in invite links

---

## How to use

### First-time setup

```
1. Start: cd packages/server && node bin/run start
2. Migrations run automatically (creates all enterprise tables in Neon)
3. Browse to: http://localhost:3002/register
4. Fill in:
   - Organisation Name: Accelance AI Platform
   - Your Name: <your name>
   - Email: <your email>
   - Password: <strong password>
5. Submit → you are now the OWNER admin
6. Sign in at: http://localhost:3002/signin
```

### Create a workspace (after login)

Via UI: click workspace settings → New Workspace

Via API:

```http
POST http://localhost:3002/api/v1/workspace
Content-Type: application/json
Cookie: <session cookie>

{
  "name": "Engineering",
  "description": "Engineering team workspace"
}
```

### Invite a user

Via UI: workspace settings → Members → Invite

Via API:

```http
POST http://localhost:3002/api/v1/account/invite
Content-Type: application/json
Cookie: <session cookie>

{
  "user": { "email": "colleague@example.com" },
  "workspace": { "id": "<workspaceId>" },
  "role": { "id": "<roleId>" }
}
```

User receives email with link: `http://localhost:3002/register?token=<tempToken>`

They fill in their name + password → account activated as MEMBER.

### Promote user to admin (OWNER role)

Via UI: workspace settings → Members → change role to Owner

Or update the role via `PUT /api/v1/workspaceuser`.

---

## Key code paths

| What               | Where                                                        |
| ------------------ | ------------------------------------------------------------ |
| Platform bypass    | `IdentityManager._validateLicenseKey()`                      |
| Registration logic | `AccountService.createRegisterAccount()` (ENTERPRISE branch) |
| Invite logic       | `AccountService.saveInviteAccount()`                         |
| Login logic        | `AccountService.login()`                                     |
| Role seeding       | `RefactorEnterpriseDatabase1737076223692.populateTable()`    |
| Session handling   | `enterprise/middleware/passport/index.ts`                    |

---

## Notes

-   ENTERPRISE enforces **one organization** (`ensureOneOrganizationOnly()`) — correct for our use case
-   SMTP must be configured for invite emails. Without it, invites still work but no email is sent (console warns)
-   Password reset also requires SMTP
-   The `SECRETKEY_PATH` folder stores: `jwt_auth_token_secret.key`, `express_session_secret.key`, `encryption_key` — if this folder is wiped, existing encrypted credentials become unreadable
-   All enterprise feature flags are active (workspaces, roles, SSO config, audit log, etc.)
