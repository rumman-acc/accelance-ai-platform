# Step 08 — Invite System

## Goal

Allow org admins to invite users by email. Invited users join the existing tenant
(org + workspace) instead of creating a new one.

## Flow

```
1. Admin → POST /org/invite { email }
   → verify caller is org admin
   → check email not already a member
   → create Invite record (token = signed JWT, 24h)
   → send email via Resend with link: APP_URL/register?invite=<token>
   → return { inviteUrl }

2. Invited user opens /register?invite=<token>
   → page pre-fills email (decoded from token), email field disabled
   → user fills name + password
   → POST /auth/register { name, email, password, inviteToken }

3. Backend register() with inviteToken
   → verify JWT invite token (not expired, type=invite)
   → check invite record exists + not usedAt
   → create User only (NO new org/workspace)
   → add to existing org (OrganizationUser)
   → add to existing workspace (WorkspaceUser, role=Member)
   → mark invite.usedAt = now
   → return JWT with existing tenantId + workspaceId

4. GET /org/members → list all users in caller's org
```

## Files to create

-   `apps/api/src/entities/invite.entity.ts`
-   `apps/api/src/email/email.service.ts`
-   `apps/api/src/org/org.module.ts`
-   `apps/api/src/org/org.controller.ts`
-   `apps/api/src/org/org.service.ts`
-   `apps/web/src/app/settings/team/page.tsx`

## Files to modify

-   `apps/api/src/auth/dto/register.dto.ts` — add optional inviteToken
-   `apps/api/src/auth/auth.service.ts` — branch on inviteToken in register()
-   `apps/api/src/auth/auth.module.ts` — export InviteRepo so OrgModule can use it
-   `apps/api/src/app.module.ts` — import OrgModule
-   `apps/api/package.json` — add resend
-   `apps/web/src/app/register/page.tsx` — read invite token from URL
-   `apps/web/src/lib/api.ts` — add inviteUser(), getMembers()
-   `.env.example` + `.env` — RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL

## Env vars needed

```
RESEND_API_KEY=re_...          # from resend.com
RESEND_FROM_EMAIL=noreply@...  # must be verified domain in Resend
APP_URL=http://localhost:3001  # base URL for invite links
```
