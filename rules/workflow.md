# Development Workflow Rules

## Rule: Build + Test After Every Step

After completing ANY step or code change, always run these commands and record the result in changes.md.

### Engine (packages/server)

```bash
pnpm --filter flowise build
```

### Shared types

```bash
pnpm --filter @accelance/shared build
```

### Verify workspace is intact

```bash
pnpm install
```

### What to record in changes.md

-   Did the build pass? (yes / no + error)
-   What tests ran and passed?
-   What was the first error if it failed?

## Rule: Never Leave a Broken Build

If a build breaks during a step, fix it before moving to the next step.
Check `rules/known-issues.md` first — the error may already be documented.

## Rule: One Step at a Time

Never start Step N+1 until Step N is recorded as COMPLETE in its step file and changes.md.

## Rule: Save the Plan Before Executing

Every step must have its full plan saved in `rules/steps/step-XX-name.md` BEFORE any files are touched.
If Claude runs out of context mid-step, the plan file is the recovery document.

## Rule: Context Recovery

If a new Claude session starts and context is lost:

1. Read `rules/changes.md` — shows exactly what was done last
2. Read the current step file in `rules/steps/` — shows what was in progress
3. Read `rules/services.md` — shows current state of each service
4. Read `rules/known-issues.md` — check if the break is a known issue
