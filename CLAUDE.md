# Accelance AI Platform — Claude Instructions

## Read This First

Before making any change, read the files in `rules/` to understand the current state of the project.
After making any change, update the relevant file in `rules/`.

**Rules folder:** `rules/`

-   `rules/architecture.md` — service layout, ports, decisions
-   `rules/changes.md` — log of every structural change made
-   `rules/services.md` — what each service does, where it lives, its status
-   `rules/known-issues.md` — bugs encountered and how they were resolved

## Project Overview

Accelance AI Platform — a multi-tenant AI agent platform built on a Flowise OSS fork.
Root: `d:/Accelance AI Platform/AI-Platform-Internal/`

Current state: **Flowise 3.1.2 monorepo** being restructured into a 5-service architecture.
See `rules/architecture.md` for the full plan and current progress.

## Key Rules

-   Never modify files outside this repo
-   Always check `rules/changes.md` before starting work so you know what was already done
-   When a service breaks, check `rules/known-issues.md` first
-   The `apps/engine` service (Flowise) should never do auth — auth lives in `apps/api` (NestJS)
-   All cross-service calls are HTTP only — services never import each other's code
-   Shared TypeScript types live in `packages/shared` only
-   **After every step or change: run build + test and record the result** — see `rules/workflow.md`
-   **Save the full step plan to `rules/steps/` before touching any code**
